# Publication-hook follow-up

This handoff records the adversarial-review fixes for the existing Shepherd
Adventure hooks change. Before editing, the expected remote branch revision was
verified and the complete change diff was inspected; it contained only the
hook, publication checker and setup script.

## Findings and fixes

- `reviewed_files` contains both portal inputs and deliberately reviewed feature
  inputs. The staged checker now treats `reviewed_files - published files` as
  feature-only: recorded hashes are still enforced, but a changed feature file
  does not need to be added to a prototype's public file list. The build path
  remains explicit-list-only, so reviewed rebuild modules are not copied into
  the portal accidentally.
- The normal hook is explicitly labelled a staged/development integrity check.
  It checks the complete set of recorded hashes and only the module nodes whose
  staged publication intent changed. `check-publication.py --strict` is
  available for the complete source module closure; `verify.py` remains the
  strict built-artifact guard. No publication file list was changed.
- `verify.py` now recognizes both static imports and dynamic
  `import('./module.mjs')` calls. Missing-dependency diagnostics include the
  missing path, referring document, deployment base and requested path.
- Fresh-clone setup instructions and focused regression tests were added. The
  hook setup script refuses to replace an existing non-default
  `core.hooksPath` or existing custom hook set unless `--replace` is supplied.

## Verification

Passing checks:

- `python3 -m unittest discover -s projects/portal/tests -p 'test_*.py'`
- `cd projects/portal && npm run test:guards`
- `cd projects/portal && npm run build`
- `python3 projects/portal/check-publication.py` (honest staged-integrity
  pass; it does not claim full release closure)
- `sh -n scripts/setup-git-hooks.sh && sh -n .githooks/pre-commit`
- `git diff --check`

The build emits existing Vite warnings about the classic loading script and a
CSS file left for runtime resolution, but completes successfully.

## Deferred release decision

Strict full publication closure remains blocked by the pre-existing active
Shepherd Adventure graph. The published `src/boot.mjs` dynamically imports
`src/village-game.mjs`, while the rebuild module and additional CSS/asset graph
are intentionally absent from `publication.json`. The strict source check
reports the missing `village-game.mjs`; the built-artifact verifier currently
reports the first missing CSS dependency (`house-sighting.css`) before it can
continue through the rest of the graph. This follow-up does not add unfinished
rebuild files to the publication manifest or switch the active experience to an
older route. An explicit content/release decision is still required before a
strict full-closure pass can be claimed.

Speculative hook-performance optimization was not attempted. No comment,
merge, deployment or production mutation was performed.
