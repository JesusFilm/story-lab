import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch
spec = importlib.util.spec_from_file_location('publication_check_local', Path(__file__).parents[1] / 'check-publication.py')
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)
class LocalPrototypeTests(unittest.TestCase):
    def run_check(self, local, files=None):
        manifest = json.dumps({'prototypes': [{'files': files or []}], 'reviewed_files': {}, 'local_only_prototypes': local}).encode()
        with patch.object(check, 'file_bytes', side_effect=lambda name: manifest if name == check.MANIFEST_PATH else b''), patch.object(check, 'staged_names', return_value={'prototypes/little-light-library/src/main.ts'}):
            return check.main()
    def test_explicit_local_prototype_can_be_committed_without_publishing(self):
        self.assertEqual(self.run_check(['little-light-library']), 0)
    def test_unregistered_prototype_is_still_rejected(self):
        self.assertEqual(self.run_check([]), 1)
    def test_local_prototype_cannot_also_be_published(self):
        self.assertEqual(self.run_check(['little-light-library'], ['prototypes/little-light-library/src/main.ts']), 1)
    def test_local_scope_must_be_one_exact_slug(self):
        self.assertEqual(self.run_check(['../']), 1)
