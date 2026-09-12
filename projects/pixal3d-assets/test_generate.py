"""Offline failure-path checks; no SSH or generation requests."""
import contextlib
import hashlib
import io
import json
from pathlib import Path
import struct
import sys
import tempfile
import unittest
from unittest.mock import patch

import generate


class ClientChecks(unittest.TestCase):
    def test_truncated_glb_rejected(self):
        with self.assertRaises(RuntimeError):
            generate.validate_glb(struct.pack('<4sII', b'glTF', 2, 100) + b'12345678')

    def run_mock_job(self, mismatch=False, bad_download=False):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            image = root / 'input.png'
            image.write_bytes(b'reference')
            model = struct.pack('<4sII', b'glTF', 2, 20) + b'12345678'
            output = root / 'test.glb'
            job = {'id': 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'state': 'succeeded',
                   'input_sha256': 'wrong' if mismatch else hashlib.sha256(b'reference').hexdigest(),
                   'output_sha256': 'wrong' if bad_download else hashlib.sha256(model).hexdigest(),
                   'resolution': 1024, 'seed': 42, 'elapsed_seconds': 1}
            def fake_request(host, path, data=None):
                if path == '/health':
                    return b'{"service":"pixal3d","status":"ok"}'
                if path.endswith('/artifact'):
                    return model
                return json.dumps(job).encode()
            argv = ['generate.py', str(image), '--output', str(output), '--ssh', 'user@host',
                    '--state-dir', str(root / 'private'), '--resume', job['id']]
            with patch.object(sys, 'argv', argv), patch.object(generate, 'request', side_effect=fake_request), contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
                result = generate.main()
            self.assertEqual(result, 1 if mismatch or bad_download else 0)
            self.assertEqual(output.exists(), not (mismatch or bad_download))
            if output.exists():
                provenance = output.with_suffix('.provenance.json').read_text()
                self.assertNotIn(job['id'], provenance)
                self.assertNotIn('user@host', provenance)

    def test_resume_rejects_wrong_reference(self):
        self.run_mock_job(mismatch=True)

    def test_checksum_failure_leaves_no_model(self):
        self.run_mock_job(bad_download=True)

    def test_success_keeps_private_job_data_out_of_library(self):
        self.run_mock_job()


if __name__ == '__main__':
    unittest.main()
