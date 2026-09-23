#!/usr/bin/env python3
"""Check the reviewed publication manifest against staged changes.

The pre-commit check is deliberately a development/staged-integrity check.  A
full release closure is a separate, strict operation because the current
published Shepherd Adventure entry has a known, intentionally deferred graph
decision: ``boot.mjs`` imports the unfinished rebuild module, while that
module is not in the publication allowlist.
"""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
from argparse import ArgumentParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = "projects/portal/publication.json"
PUBLISHABLE_EXTENSIONS = {
    ".bin", ".css", ".glb", ".gltf", ".html", ".js", ".jpg", ".json",
    ".mjs", ".mp3", ".png", ".svg", ".txt", ".vtt", ".wav",
}
PRIVATE_ASSET_METADATA = {"asset.json", "package.json", "provenance.json", "sources.json"}
IMPORT_RE = re.compile(r'''(?:from\s*|import\s*(?:\(\s*)?)['"](\.[^'"]+)['"]''')


def index_bytes(name: str, root: Path = ROOT) -> bytes | None:
    result = subprocess.run(["git", "show", f":{name}"], cwd=root, capture_output=True)
    return result.stdout if result.returncode == 0 else None


def file_bytes(name: str, root: Path = ROOT) -> bytes | None:
    # The index contains unchanged files too. Falling back to HEAD would revive
    # a staged deletion and allow a stale manifest to publish a missing asset.
    return index_bytes(name, root)


def staged_names(root: Path = ROOT) -> set[str]:
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=d", "-z"],
        cwd=root, check=True, capture_output=True,
    )
    return {name for name in result.stdout.decode().split("\0") if name}


def manifest_from_bytes(raw: bytes, errors: list[str]) -> dict:
    try:
        manifest = json.loads(raw)
    except json.JSONDecodeError as error:
        errors.append(f"invalid {MANIFEST_PATH}: {error}")
        return {}
    if not isinstance(manifest, dict):
        errors.append(f"invalid {MANIFEST_PATH}: expected a JSON object")
        return {}
    return manifest


def published_files(manifest: dict) -> set[str]:
    return {
        name
        for prototype in manifest.get("prototypes", [])
        for name in prototype.get("files", [])
    }


def head_published_files(root: Path) -> set[str]:
    result = subprocess.run(
        ["git", "show", f"HEAD:{MANIFEST_PATH}"],
        cwd=root, capture_output=True,
    )
    if result.returncode != 0:
        return set()
    try:
        return published_files(json.loads(result.stdout))
    except (json.JSONDecodeError, TypeError):
        return set()


def check_module_closure(root: Path, files: set[str], errors: list[str]) -> None:
    for name in sorted(files):
        if not name.endswith(".mjs"):
            continue
        raw = file_bytes(name, root)
        if raw is None:
            continue
        for dependency in IMPORT_RE.findall(raw.decode()):
            target = (root / Path(name).parent / dependency).resolve()
            try:
                dependency_name = target.relative_to(root).as_posix()
            except ValueError:
                errors.append(f"published module escapes the repository: {name} -> {dependency}")
                continue
            if dependency_name not in files:
                errors.append(f"published module dependency is not listed: {name} -> {dependency_name}")


def is_publishable_prototype_change(name: str) -> bool:
    path = Path(name)
    if not name.startswith("prototypes/"):
        return False
    if "/src/" in name or "/maps/" in name:
        return True
    if "/assets/" in name:
        return path.suffix in PUBLISHABLE_EXTENSIONS and path.name not in PRIVATE_ASSET_METADATA
    return len(path.parts) == 3 and path.suffix in {".css", ".html", ".js", ".mjs"}


def staged_closure_files(
    root: Path,
    manifest: dict,
    staged: set[str],
) -> set[str]:
    """Return only graph nodes whose publication intent changed in this index.

    The development hook must catch a newly broken or newly published module,
    but it must not claim to validate the already-published graph when an
    unrelated feature-only hash is staged.  ``verify.py`` remains the strict
    full-artifact guard for release validation.
    """
    published = published_files(manifest)
    newly_published = published - head_published_files(root)
    return {
        name
        for name in published
        if name.endswith(".mjs") and (name in staged or name in newly_published)
    }


def check_publication(root: Path = ROOT, *, strict: bool = False) -> list[str]:
    """Return publication-integrity errors for the index at ``root``.

    ``strict=False`` is the pre-commit development check.  It checks every
    recorded hash and the module closure affected by staged publication
    changes.  ``strict=True`` checks the complete publication module closure.
    """
    errors: list[str] = []
    raw_manifest = file_bytes(MANIFEST_PATH, root)
    if raw_manifest is None:
        return [f"missing {MANIFEST_PATH}"]
    manifest = manifest_from_bytes(raw_manifest, errors)
    if not manifest:
        return errors

    reviewed = manifest.get("reviewed_files", {})
    if not isinstance(reviewed, dict):
        errors.append(f"invalid {MANIFEST_PATH}: reviewed_files must be an object")
        reviewed = {}
    published = published_files(manifest)
    feature_only = set(reviewed) - published

    staged = staged_names(root)

    for name in sorted(published | set(reviewed)):
        raw = file_bytes(name, root)
        if raw is None:
            errors.append(f"reviewed/public file is missing: {name}")
            continue
        expected = reviewed.get(name)
        if expected is None:
            errors.append(f"published file has no reviewed hash: {name}")
        elif hashlib.sha256(raw).hexdigest() != expected:
            errors.append(f"reviewed hash is stale: {name}")

    if strict:
        check_module_closure(root, published, errors)
    else:
        check_module_closure(root, staged_closure_files(root, manifest, staged), errors)

    for name in sorted(staged):
        path = Path(name)
        # A reviewed-but-unpublished file is a deliberate feature input, not a
        # portal publication request. Its recorded hash was still checked
        # above, and build.py will never copy it unless a reviewer adds it to a
        # prototype's explicit files list.
        if is_publishable_prototype_change(name) and name not in published and name not in feature_only:
            errors.append(f"changed publishable file is not listed in the manifest: {name}")
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = ArgumentParser(description=__doc__)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="validate the complete publication module closure for release review",
    )
    args = parser.parse_args(argv)
    errors = check_publication(strict=args.strict)

    if errors:
        label = "Strict full publication check" if args.strict else "Staged publication integrity check"
        print(f"{label} failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        print("Inspect the public change and update projects/portal/publication.json before committing.", file=sys.stderr)
        return 1
    if args.strict:
        print("PASS: strict full publication module closure and recorded hashes are current.")
    else:
        print(
            "PASS: staged publication integrity and recorded hashes are current "
            "(development check; full publication closure not evaluated)."
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
