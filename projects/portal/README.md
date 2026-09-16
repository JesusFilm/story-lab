# Story Lab portal

A static portal for the prototypes and model gallery, built from this repository.

## Run locally

From the repository root, install the dependencies and build the reviewed public site:

```sh
cd prototypes/sermon-in-the-crowd && npm ci --ignore-scripts
cd ../../projects/portal && npm ci --ignore-scripts
npm run build
npm run preview
```

Open **http://127.0.0.1:8768/story-lab/**. The preview stays running until you
press Ctrl+C. To use another port, run `python3 serve.py --port 8879` instead of
`npm run preview`. Re-run `npm run build` after changing portal source files, then
refresh the browser. The server uses the same `/story-lab/` path as GitHub Pages.

## Checks

```sh
npm test
npm run test:unit
```

`publication.json` lists the files needed by each demo and gallery entry. Reviewed
hashes prevent accidentally exporting changed content. Review the actual change
before updating its hash. Include runtime dependencies and license files explicitly.
`build.py` builds the sermon client and writes `dist/`; `verify.py` checks its links,
model dependencies and sensitive-content patterns under both root and project paths.

`npm run test:shepherd-adventure` is the focused browser regression check. It serves
the built artifact under the real `/story-lab/` deployment prefix, opens Shepherd
Adventure, skips the opening story, and requires the 3D game and controls to become
playable without a fatal script or loader error. The Pages deployment runs this as
a release gate. Pull requests run the same check when Shepherd Adventure or its
portal publication inputs change; a failed run uploads a diagnostic screenshot.

The GitHub Actions workflow deploys the validated artifact to this repository's
GitHub Pages site. The source repository and the Pages artifact are both intended
for public sharing. The artifact contains the files needed to run the demos.
