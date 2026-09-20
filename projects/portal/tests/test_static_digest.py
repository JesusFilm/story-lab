import struct
import sys
import tempfile
import unittest
import zlib
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))
from publication_utils import public_png, static_output_digest, static_source_exclusions


def chunk(kind, value):
    return struct.pack('>I', len(value)) + kind + value + struct.pack('>I', zlib.crc32(kind + value))


class StaticDigestTests(unittest.TestCase):
    def test_explicit_source_path_cannot_exclude_a_colliding_runtime_asset(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'assets').mkdir()
            (root / 'assets/art.png').write_bytes(b'runtime asset')
            proto = {'slug': 'example', 'files': [
                'prototypes/example/assets/art.png',
                'prototypes/example/src/main.ts',
            ]}
            self.assertEqual(static_source_exclusions(proto, root), ['src/main.ts'])

    def test_reviewed_source_matches_sanitized_upload_but_detects_changed_pixels(self):
        png = (b'\x89PNG\r\n\x1a\n'
               + chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
               + chunk(b'tEXt', b'Comment\0generation metadata')
               + chunk(b'IDAT', zlib.compress(b'\0\xff\x00\x00'))
               + chunk(b'IEND', b''))
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'source'
            upload = Path(directory) / 'upload'
            source.mkdir()
            upload.mkdir()
            (source / 'art.png').write_bytes(png)
            (upload / 'art.png').write_bytes(public_png(png))
            (source / 'index.html').write_text('reader')
            (upload / 'index.html').write_text('reader')
            reviewed = static_output_digest(source, sanitize_png=True)
            self.assertEqual(reviewed, static_output_digest(upload))
            self.assertNotEqual(reviewed, static_output_digest(source))
            (upload / 'review-source.txt').write_text('explicitly listed source')
            self.assertEqual(reviewed, static_output_digest(upload, ['review-source.txt']))
            (upload / 'index.html').write_text('changed reader')
            self.assertNotEqual(reviewed, static_output_digest(upload, ['review-source.txt']))
            (upload / 'index.html').write_text('reader')
            (upload / 'art.png').write_bytes(public_png(png).replace(zlib.compress(b'\0\xff\x00\x00'), zlib.compress(b'\0\x00\xff\x00')))
            self.assertNotEqual(reviewed, static_output_digest(upload, ['review-source.txt']))


if __name__ == '__main__':
    unittest.main()
