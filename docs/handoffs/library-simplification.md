# Library simplification

## Result

- One shared Follow the Light style guide and four grounding images under `styles/`.
- Thirty asset folders flattened, retaining distinct references, models and clips.
- Legacy style snapshots, provider jobs, approval records and pipeline machinery
  removed. Useful concepts, catalog descriptions and retrospectives retained.
- Current gallery prompt paths updated. The portal explicitly includes the missing
  Adventure lantern, boundaries and nature dependencies, including their licenses.
- PNG metadata stripped without recompressing pixels. Seven editable Blender files
  sanitized and reopened successfully. See the sermon Blender README for its two
  pre-existing missing source textures; runtime model exports remain intact.
- Sermon audio/captions retained with Jesus Film Project attribution.

## Validation

The portal builds 200 files (168.7 MB) and passes sensitive-content and dependency
checks at `/`, `/story-lab/`, and `/story-lab-demos/`. All nine gallery models finish
loading without captured browser errors. Rebuilt Adventure opens its automatic
story and then its separate game opening under the portal path.

Story Diorama's 9 unit tests and the sermon's 28 tests passed in the preceding
verification pass. Adventure's 12 model checks passed again after cleanup. Maze
controller checks and browser movement passed. V1 is deliberately the maze default.
The current source snapshot passes Gitleaks with no findings; the metadata audit
finds no remaining real personal workstation paths. Pattern matches in scanner
code, image prompts and nontext Blender bytes were distinguished from disclosures.

This is desktop smoke and automated verification, not a fresh full gameplay run,
headset certification or exhaustive mobile/performance testing.

## Hosting

The Pages workflow builds and deploys from this repository. Verify the deployed
site after the visibility/Pages transition. Keep the former demo repository intact.
Private backups and migration/audit working files remain outside the repository.
