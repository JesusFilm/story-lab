"""Strictly audit the actual upload artifact and its static dependency paths."""

from __future__ import annotations

import hashlib
import json
import re
import struct
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit


HERE = Path(__file__).resolve().parent
OUT = HERE / "dist"
MANIFEST_PATH = HERE / "publication.json"
MODULE_IMPORT_RE = re.compile(r'''(?:from\s*|import\s*(?:\(\s*)?)['"](\.[^'"]+)['"]''')
PUBLIC_SUFFIXES = {
    ".html", ".css", ".mjs", ".js", ".json", ".jpg", ".glb", ".txt",
    ".wav", ".vtt", ".svg", ".md", ".png", ".mp3", ".gltf", ".bin", "",
}
SENSITIVE_PATTERNS = {
    "email": r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}",
    "credential": r"(?i)(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|(?<![A-Za-z0-9_-])sk-[A-Za-z0-9_-]{20,}|-----BEGIN .*PRIVATE KEY|AKIA[A-Z0-9]{16})",
    "personal/internal": r"(?i)(jacobus|\bJaco\b|/Users/|/home/|\bconfidential\b|\binternal only\b|credits_consumed|task_id|source_candidate)",
    "private/local link": r"(?i)(localhost|127\.0\.0\.1|github\.com/JesusFilm/story-lab|/api/library)",
}


def module_dependencies(text: str) -> list[str]:
    """Return relative static and dynamic JavaScript module imports.

    The optional parenthesis is significant: ``import('./module.mjs')`` is a
    runtime dependency just as much as ``from './module.mjs'`` is.
    """
    return MODULE_IMPORT_RE.findall(text)


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(self, tag, attrs):
        del tag
        self.links += [value for key, value in attrs if key in ["href", "src", "data-model", "data-entry"] and value]


def check(base: str, document: str, target: str, out: Path = OUT) -> None:
    if target.startswith(("http:", "https:", "data:", "#", "blob:")):
        return
    result = unquote(urlsplit(urljoin("https://example.test" + base + document, target)).path)
    if not result.startswith(base):
        raise AssertionError(f"Escaped deployment base: {document}: {target}")
    path = out / result[len(base):]
    if path.is_dir():
        path = path / "index.html"
    if not path.is_file():
        try:
            missing = path.relative_to(out).as_posix()
        except ValueError:
            missing = str(path)
        raise AssertionError(
            f"Missing dependency {missing} referenced by {document} "
            f"under {base} (requested {target})"
        )


def verify_publication(out: Path = OUT, manifest: dict | None = None) -> None:
    """Run the strict release-artifact validation, raising on any failure."""
    if manifest is None:
        manifest = json.loads(MANIFEST_PATH.read_text())

    files = sorted(path for path in out.rglob("*") if path.is_file())
    assert files, "The publication artifact is empty"
    for path in files:
        relative = path.relative_to(out)
        assert not any(part in relative.parts for part in ["provenance", "review", "checks", "learnings", ".git", "node_modules"])
        assert path.suffix in PUBLIC_SUFFIXES
        assert path.name not in {"sources.json", "publication.json", "asset.json", "package.json"}
        if path.suffix in {".png", ".mp3"}:
            assert relative.as_posix() in manifest["reviewed_files"], f"Unreviewed media: {relative}"
        if relative.parts[0] == "vendor":
            continue  # Pinned upstream runtime and its required license.
        if path.suffix == ".glb":
            raw = path.read_bytes()
            assert raw[:4] == b"glTF"
            length = struct.unpack_from("<I", raw, 12)[0]
            text = raw[20 : 20 + length].decode()
            data = json.loads(text)
            assert all("uri" not in item for kind in ["images", "buffers"] for item in data.get(kind, [])), path
        elif path.suffix in {".html", ".css", ".mjs", ".js", ".json", ".gltf"}:
            text = path.read_text()
        else:
            continue
        for label, pattern in SENSITIVE_PATTERNS.items():
            assert not re.search(pattern, text), f"{label} found in {relative}; inspect privately before publication"

    def check_gltf_dependencies(name: str, path: Path, base: str) -> None:
        data = json.loads(path.read_text())
        for kind in ["images", "buffers"]:
            for item in data.get(kind, []):
                if "uri" in item:
                    check(base, name, item["uri"], out)

    for base in ["/", "/story-lab/", "/story-lab-demos/"]:
        for path in files:
            name = path.relative_to(out).as_posix()
            if path.suffix == ".gltf":
                check_gltf_dependencies(name, path, base)
            elif path.suffix == ".html":
                parser = Links()
                parser.feed(path.read_text())
                for target in parser.links:
                    check(base, name, target, out)
            elif path.suffix in {".mjs", ".js"}:
                text = path.read_text()
                for target in module_dependencies(text):
                    check(base, name, target, out)
                # Prototype asset/fetch paths are relative to the document,
                # not the source module.
                if name.startswith("prototypes/"):
                    document = "/".join(name.split("/")[:2]) + "/index.html"
                    for target in re.findall(r'''["'](\./(?:assets|maps)/[^"']+)["']''', text):
                        if target.endswith("/"):
                            assert (out / Path(document).parent / target).is_dir(), target
                        else:
                            check(base, document, target, out)

    for prototype in manifest["prototypes"]:
        if prototype["slug"] == "story-diorama-lab":
            root = out / "prototypes" / prototype["slug"]
            for filename in ["building.png", "animals.png", "flood.png", "promise.png", "reverie.mp3", "childhood.mp3", "hiraeth.mp3"]:
                assert (root / "assets" / filename).is_file()
            for page in ["index.html", "noah.html"]:
                assert "CC BY 4.0" in (root / page).read_text()
            assert "reusable storytelling component" in prototype["description"]
        if prototype.get("retrospective"):
            target = f"prototypes/{prototype['slug']}/retrospective.html"
            assert (out / target).is_file()
            assert f'href="{target}"' in (out / "index.html").read_text()
        for name, expected in prototype.get("static_outputs", {}).items():
            output = out / "prototypes" / prototype["slug"] / name
            assert hashlib.sha256(output.read_bytes()).hexdigest() == expected, name
        for name in prototype["files"]:
            assert (out / name).is_file(), name

    # The portal exposes one entry per experience; model versions belong inside it.
    index = (out / "index.html").read_text()
    for prototype in manifest["prototypes"]:
        assert index.count(f'aria-label="Play {prototype["title"]}"') == 1
        if prototype.get("static_build"):
            root = out / "prototypes" / prototype["slug"]
            for required in [
                "audio/sermon-teaching.wav", "audio/sermon-teaching.vtt",
                "audio/speech-envelope.json", "models-v2/motions.json", "models-v2/CREDITS.md",
            ]:
                assert (root / required).stat().st_size > 0
            for segment in json.loads((root / "audio/edit-manifest.json").read_text())["segments"]:
                assert (root / segment["audio"].lstrip("/")).is_file()
    for asset in manifest["assets"]:
        assert (out / asset["model"]).is_file()
    size = sum(path.stat().st_size for path in files)
    assert size < 1_000_000_000

    # Kept outside dist: an exact evidence inventory, never part of the public site.
    (HERE / "publication-inventory.json").write_text(json.dumps({
        "bytes": size,
        "files": {str(path.relative_to(out)): hashlib.sha256(path.read_bytes()).hexdigest() for path in files},
    }, indent=2) + "\n")
    print(
        f"PASS: strict full publication artifact: {len(files)} files, "
        f"{size / 1_000_000:.1f} MB; sensitive-content and dependency checks "
        "passed at /, /story-lab/ and /story-lab-demos/."
    )


if __name__ == "__main__":
    verify_publication()
