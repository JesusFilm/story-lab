import hashlib
import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
CHECK_PATH = REPOSITORY_ROOT / "projects/portal/check-publication.py"
VERIFY_PATH = REPOSITORY_ROOT / "projects/portal/verify.py"
SETUP_PATH = REPOSITORY_ROOT / "scripts/setup-git-hooks.sh"


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    return module


publication_checks = load_module(CHECK_PATH, "publication_checks")
portal_verify = load_module(VERIFY_PATH, "portal_verify")


class GitFixture:
    def __init__(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        self.git("init", "-q")
        self.git("config", "user.email", "tests@example.invalid")
        self.git("config", "user.name", "Publication guard tests")

    def git(self, *args: str) -> subprocess.CompletedProcess:
        return subprocess.run(
            ["git", *args],
            cwd=self.root,
            check=True,
            capture_output=True,
            text=True,
        )

    def write(self, name: str, content: str | bytes) -> None:
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(content, bytes):
            path.write_bytes(content)
        else:
            path.write_text(content)

    def create_publication(self, published: list[str], feature_only: list[str]) -> None:
        for name in published:
            if not (self.root / name).exists():
                self.write(name, f"<!doctype html><title>{name}</title>\n")
        for name in feature_only:
            if not (self.root / name).exists():
                self.write(name, f"// reviewed feature input: {name}\n")
        reviewed = {
            name: hashlib.sha256((self.root / name).read_bytes()).hexdigest()
            for name in [*published, *feature_only]
        }
        self.write(
            "projects/portal/publication.json",
            json.dumps(
                {
                    "prototypes": [{"slug": "fixture", "files": published}],
                    "reviewed_files": reviewed,
                    "assets": [],
                },
                indent=2,
            )
            + "\n",
        )
        self.git("add", "-A")
        self.git("commit", "-q", "-m", "fixture")

    def update_hash(self, name: str) -> None:
        manifest_path = self.root / "projects/portal/publication.json"
        manifest = json.loads(manifest_path.read_text())
        manifest["reviewed_files"][name] = hashlib.sha256((self.root / name).read_bytes()).hexdigest()
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")

    def stage(self, *names: str) -> None:
        self.git("add", *names)

    def close(self) -> None:
        self.directory.cleanup()


class PublicationGuardTests(unittest.TestCase):
    def test_reviewed_feature_source_and_asset_do_not_need_publication_listing(self):
        fixture = GitFixture()
        self.addCleanup(fixture.close)
        feature_source = "prototypes/shepherd-adventure/src/village-game.mjs"
        feature_asset = "prototypes/shepherd-adventure/assets/unfinished-scene.glb"
        static_source = "prototypes/sermon-in-the-crowd/static.tsx"
        fixture.write(feature_source, "export const revision = 2;\n")
        fixture.write(feature_asset, b"reviewed feature asset\n")
        fixture.write(static_source, "export const revision = 2;\n")
        fixture.create_publication(
            ["prototypes/shepherd-adventure/index.html"],
            [feature_source, feature_asset, static_source],
        )

        fixture.write(feature_source, "export const revision = 3;\n")
        fixture.write(feature_asset, b"reviewed feature asset revision 3\n")
        fixture.write(static_source, "export const revision = 3;\n")
        fixture.update_hash(feature_source)
        fixture.update_hash(feature_asset)
        fixture.update_hash(static_source)
        fixture.stage(feature_source, feature_asset, static_source, "projects/portal/publication.json")

        self.assertEqual(publication_checks.check_publication(fixture.root), [])

    def test_recorded_feature_hash_still_rejects_unrecorded_edit(self):
        fixture = GitFixture()
        self.addCleanup(fixture.close)
        feature_source = "prototypes/shepherd-adventure/src/village-game.mjs"
        fixture.create_publication(["prototypes/shepherd-adventure/index.html"], [feature_source])
        fixture.write(feature_source, "export const revision = 2;\n")
        fixture.stage(feature_source)

        errors = publication_checks.check_publication(fixture.root)

        self.assertTrue(any("reviewed hash is stale" in error and feature_source in error for error in errors))

    def test_staged_published_change_requires_and_accepts_new_hash(self):
        fixture = GitFixture()
        self.addCleanup(fixture.close)
        published = "prototypes/shepherd-adventure/index.html"
        fixture.create_publication([published], [])
        fixture.write(published, "<!doctype html><title>reviewed revision</title>\n")
        fixture.stage(published)
        errors = publication_checks.check_publication(fixture.root)
        self.assertTrue(any("reviewed hash is stale" in error and published in error for error in errors))

        fixture.update_hash(published)
        fixture.stage("projects/portal/publication.json")
        self.assertEqual(publication_checks.check_publication(fixture.root), [])

    def test_unreviewed_rebuild_module_is_not_silently_accepted(self):
        fixture = GitFixture()
        self.addCleanup(fixture.close)
        fixture.create_publication(["prototypes/shepherd-adventure/index.html"], [])
        unfinished = "prototypes/shepherd-adventure/src/unfinished-rebuild.mjs"
        fixture.write(unfinished, "export const unfinished = true;\n")
        fixture.stage(unfinished)

        errors = publication_checks.check_publication(fixture.root)

        self.assertTrue(any("not listed in the manifest" in error and unfinished in error for error in errors))

    def test_strict_check_reports_known_baseline_dynamic_dependency(self):
        fixture = GitFixture()
        self.addCleanup(fixture.close)
        boot = "prototypes/shepherd-adventure/src/boot.mjs"
        unfinished = "prototypes/shepherd-adventure/src/village-game.mjs"
        fixture.write(boot, "export const start = () => import('./village-game.mjs');\n")
        fixture.write(unfinished, "export const unfinished = true;\n")
        fixture.create_publication([boot], [unfinished])

        self.assertEqual(publication_checks.check_publication(fixture.root), [])
        errors = publication_checks.check_publication(fixture.root, strict=True)

        self.assertTrue(any(unfinished in error and "dependency is not listed" in error for error in errors))


class PortalVerifierTests(unittest.TestCase):
    def test_dynamic_import_is_scanned_and_missing_name_is_reported(self):
        self.assertEqual(
            portal_verify.module_dependencies("import('./missing.mjs'); import {ok} from './present.mjs';"),
            ["./missing.mjs", "./present.mjs"],
        )
        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory)
            (out / "entry.mjs").write_text("export const entry = true;\n")
            with self.assertRaisesRegex(AssertionError, r"Missing dependency .*missing\.mjs"):
                portal_verify.check("/", "entry.mjs", "./missing.mjs", out)


class HookSetupTests(unittest.TestCase):
    def test_fresh_clone_setup_and_explicit_custom_replacement(self):
        fixture = GitFixture()
        self.addCleanup(fixture.close)
        fixture.write("README.md", "fixture\n")
        fixture.git("add", "README.md")
        fixture.git("commit", "-q", "-m", "initial")

        first = subprocess.run(["sh", str(SETUP_PATH)], cwd=fixture.root, capture_output=True, text=True)
        self.assertEqual(first.returncode, 0, first.stderr)
        self.assertEqual(fixture.git("config", "--get", "core.hooksPath").stdout.strip(), ".githooks")

        fixture.git("config", "core.hooksPath", ".custom-hooks")
        refused = subprocess.run(["sh", str(SETUP_PATH)], cwd=fixture.root, capture_output=True, text=True)
        self.assertNotEqual(refused.returncode, 0)
        self.assertIn("Refusing to replace", refused.stderr)
        self.assertEqual(fixture.git("config", "--get", "core.hooksPath").stdout.strip(), ".custom-hooks")

        replaced = subprocess.run(["sh", str(SETUP_PATH), "--replace"], cwd=fixture.root, capture_output=True, text=True)
        self.assertEqual(replaced.returncode, 0, replaced.stderr)
        self.assertEqual(fixture.git("config", "--get", "core.hooksPath").stdout.strip(), ".githooks")

        existing_hook_fixture = GitFixture()
        self.addCleanup(existing_hook_fixture.close)
        existing_hook_fixture.write("README.md", "fixture\n")
        existing_hook_fixture.git("add", "README.md")
        existing_hook_fixture.git("commit", "-q", "-m", "initial")
        existing_hook_fixture.write(".git/hooks/pre-commit", "#!/bin/sh\nexit 0\n")
        refused_existing = subprocess.run(
            ["sh", str(SETUP_PATH)],
            cwd=existing_hook_fixture.root,
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(refused_existing.returncode, 0)
        self.assertIn("existing custom hook", refused_existing.stderr)


if __name__ == "__main__":
    unittest.main()
