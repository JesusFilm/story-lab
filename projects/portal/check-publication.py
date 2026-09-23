#!/usr/bin/env python3
"""Check the reviewed publication manifest against the staged commit."""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MANIFEST_PATH = "projects/portal/publication.json"
PUBLISHABLE_EXTENSIONS = {
    ".bin", ".css", ".glb", ".gltf", ".html", ".js", ".jpg", ".json",
    ".mjs", ".mp3", ".png", ".svg", ".txt", ".vtt", ".wav",
}
PRIVATE_ASSET_METADATA = {"asset.json", "package.json", "provenance.json", "sources.json"}
IMPORT_RE = re.compile(r'''(?:from\s*|import\s*(?:\(\s*)?)['"](\.[^'"]+)['"]''')


def index_bytes(name: str) -> bytes | None:
    result = subprocess.run(["git", "show", f":{name}"], cwd=ROOT, capture_output=True)
    return result.stdout if result.returncode == 0 else None


def file_bytes(name: str) -> bytes | None:
    # The index contains unchanged files too. Falling back to HEAD would revive
    # a staged deletion and allow a stale manifest to publish a missing asset.
    return index_bytes(name)


def staged_names() -> set[str]:
    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=d", "-z"],
        cwd=ROOT, check=True, capture_output=True,
    )
    return {name for name in result.stdout.decode().split("\0") if name}


def check_module_closure(files: set[str], errors: list[str]) -> None:
    for name in sorted(files):
        if not name.endswith(".mjs"):
            continue
        raw = file_bytes(name)
        if raw is None:
            continue
        for dependency in IMPORT_RE.findall(raw.decode()):
            target = (ROOT / Path(name).parent / dependency).resolve()
            try:
                dependency_name = target.relative_to(ROOT).as_posix()
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


def main() -> int:
    raw_manifest = file_bytes(MANIFEST_PATH)
    if raw_manifest is None:
        print(f"ERROR: missing {MANIFEST_PATH}", file=sys.stderr)
        return 1
    try:
        manifest = json.loads(raw_manifest)
    except json.JSONDecodeError as error:
        print(f"ERROR: invalid {MANIFEST_PATH}: {error}", file=sys.stderr)
        return 1

    errors: list[str] = []
    reviewed = manifest.get("reviewed_files", {})
    published: set[str] = set()
    for prototype in manifest.get("prototypes", []):
        published.update(prototype.get("files", []))

    staged = staged_names()

    for name in sorted(published | set(reviewed)):
        raw = file_bytes(name)
        if raw is None:
            errors.append(f"reviewed/public file is missing: {name}")
            continue
        expected = reviewed.get(name)
        if expected is None:
            errors.append(f"published file has no reviewed hash: {name}")
        elif hashlib.sha256(raw).hexdigest() != expected:
            errors.append(f"reviewed hash is stale: {name}")

    # The rebuild branch carries reviewed hashes for the published baseline and
    # additional feature-only modules that are intentionally not in the portal
    # file list yet. Check the full closure when the manifest changes; otherwise
    # check only published modules touched by this staged commit.
    closure_files = published if MANIFEST_PATH in staged else published & staged
    check_module_closure(closure_files, errors)
    for name in sorted(staged):
        path = Path(name)
        if is_publishable_prototype_change(name) and name not in published:
            errors.append(f"changed publishable file is not listed in the manifest: {name}")

    if errors:
        print("Publication review check failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        print("Inspect the public change and update projects/portal/publication.json before committing.", file=sys.stderr)
        return 1
    print(f"PASS: publication manifest hashes and module closure are current ({len(reviewed)} reviewed files).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
