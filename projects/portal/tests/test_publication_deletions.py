import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("publication_check", Path(__file__).parents[1] / "check-publication.py")
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)

class PublicationDeletionTests(unittest.TestCase):
    def test_staged_delete_cannot_fall_back_to_head(self):
        with patch.object(check, "index_bytes", return_value=None), patch.object(check.subprocess, "run", side_effect=AssertionError("must not read HEAD")):
            self.assertIsNone(check.file_bytes("prototypes/example/assets/removed.mp3"))

    def test_removed_asset_and_manifest_entry_are_valid(self):
        manifest = b'{"prototypes": [{"files": []}], "reviewed_files": {}}'
        with patch.object(check, "file_bytes", return_value=manifest), patch.object(check, "staged_names", return_value=set()):
            self.assertEqual(check.main(), 0)

    def test_stale_manifest_still_rejects_deleted_asset(self):
        name = "prototypes/example/assets/removed.mp3"
        manifest = ('{"prototypes": [{"files": ["' + name + '"]}], "reviewed_files": {}}').encode()
        with patch.object(check, "file_bytes", side_effect=lambda path: manifest if path == check.MANIFEST_PATH else None), patch.object(check, "staged_names", return_value=set()):
            self.assertEqual(check.main(), 1)

    def test_deletion_filter_keeps_added_file_review(self):
        from types import SimpleNamespace
        with patch.object(check.subprocess, "run", return_value=SimpleNamespace(stdout=b"prototypes/example/assets/new.mp3\0")) as run:
            self.assertEqual(check.staged_names(), {"prototypes/example/assets/new.mp3"})
            self.assertIn("--diff-filter=d", run.call_args.args[0])

if __name__ == "__main__":
    unittest.main()
