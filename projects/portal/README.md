# Story Lab portal

A static portal for the prototypes and model gallery, built from this repository.

```sh
npm ci --ignore-scripts
npm run build
npm test
```

Install the sermon prototype dependencies separately before the first build:
`npm ci --ignore-scripts` in `prototypes/sermon-in-the-crowd`.

`publication.json` lists the files needed by each demo and gallery entry. Reviewed
hashes prevent accidentally exporting changed content. Review the actual change
before updating its hash. Include runtime dependencies and license files explicitly.
`build.py` builds the sermon client and writes `dist/`; `verify.py` checks its links,
model dependencies and sensitive-content patterns under both root and project paths.

The GitHub Actions workflow deploys the validated artifact to this repository's
GitHub Pages site. The source repository and the Pages artifact are both intended
for public sharing. The artifact contains the files needed to run the demos.
