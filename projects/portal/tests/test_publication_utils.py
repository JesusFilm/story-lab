import json
import sys
import unittest
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from publication_utils import asset_category, directory, page, prototype_card


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.links.append(dict(attrs).get('href'))


class DirectoryRenderingTests(unittest.TestCase):
    def test_soundtrack_generator_is_reviewed_but_not_exported(self):
        portal = Path(__file__).resolve().parents[1]
        manifest = json.loads((portal / 'publication.json').read_text())
        prototype = next(
            item for item in manifest['prototypes'] if item['slug'] == 'little-light-library'
        )
        generator = (
            'prototypes/little-light-library/assets/books/jonah-and-the-whale/'
            'audio/generate_soundtracks.py'
        )

        self.assertNotIn(generator, prototype['files'])
        self.assertIn(generator, manifest['reviewed_files'])

    def test_eden_character_source_art_stays_reviewed_but_is_not_exported(self):
        portal = Path(__file__).resolve().parents[1]
        manifest = json.loads((portal / 'publication.json').read_text())
        prototype = next(
            item for item in manifest['prototypes'] if item['slug'] == 'little-light-library'
        )
        character_sources = {
            name for name in manifest['reviewed_files']
            if '/assets/books/eden/source-art/' in name
            and Path(name).name.startswith(('adam-', 'eve-'))
        }

        self.assertEqual(len(character_sources), 14)
        self.assertTrue(character_sources.isdisjoint(prototype['files']))

    def test_prototype_row_escapes_content_and_preserves_entry(self):
        proto = {
            'slug': 'story-diorama-lab',
            'title': 'Story <Diorama>',
            'description': 'Images & sound',
            'entry': 'noah.html',
        }
        markup = prototype_card(proto)
        links = Links()
        links.feed(markup)
        self.assertEqual(links.links, ['prototypes/story-diorama-lab/noah.html'] * 3)
        self.assertIn('Story &lt;Diorama&gt;', markup)
        self.assertIn('Images &amp; sound', markup)
        self.assertIn('Watch the story', markup)
        self.assertNotIn('<Diorama>', markup)

    def test_prototype_row_supports_reviewed_image_path(self):
        markup = prototype_card({
            'slug': 'little-light-library',
            'title': 'Little Light Library',
            'description': 'A storybook.',
            'image': 'prototypes/little-light-library/docs/captures/room-1366.png',
        })
        self.assertIn('src="prototypes/little-light-library/docs/captures/room-1366.png"', markup)

    def test_asset_category_uses_path_segment(self):
        self.assertEqual(asset_category('assets/animals/sheep/reference-prompt.txt'), 'Animals')
        self.assertEqual(asset_category('assets/structures/animal-pen/reference-prompt.txt'), 'Structures')
        self.assertEqual(asset_category('assets/animalistic/study.txt'), 'Other')

    def test_directory_starts_with_all_filter_and_zero_state(self):
        markup = directory('Asset library', 'Reference art', [], [('All', 'All assets'), ('Animals', 'Animals')], 'asset')
        self.assertIn('data-filter="All" aria-pressed="true"', markup)
        self.assertIn('data-filter="Animals" aria-pressed="false"', markup)
        self.assertIn('0 assets', markup)
        self.assertIn('id="empty" hidden', markup)

    def test_nested_page_navigation_points_to_portal_root(self):
        markup = page('Asset library', '<h1>Assets</h1>', '../')
        self.assertIn('href="../"', markup)
        self.assertIn('href="../contribute.html"', markup)
        self.assertIn('href="../library/" aria-current="page"', markup)


if __name__ == '__main__':
    unittest.main()
