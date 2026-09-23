# Story Lab portal

A static portal for the prototypes and model gallery, built from this repository.

```sh
npm ci --ignore-scripts
npm run build
npm test
# Optional focused regression suite for the hook and verifier
npm run test:guards
```

After a fresh clone, enable the repository's staged-integrity hook from the
repository root:

```sh
sh scripts/setup-git-hooks.sh
```

The hook checks recorded hashes and staged publication changes. It does not
certify the complete release graph; run the strict artifact verification above
after building. To inspect the staged check directly, run
`python3 projects/portal/check-publication.py`. If a clone already has a custom
hooks path or hook, the setup script stops and explains the conflict; review it
before opting in with `sh scripts/setup-git-hooks.sh --replace`.

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
