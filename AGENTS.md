# Story Lab

Story Lab is a loose collection of biblical stories, 3D experiments and tools.
[README.md](README.md) is the directory index.

- `assets/`: source models, imagery and references to browse and copy.
- `docs/`: technical explanations and requested handoffs.
- `game-concepts/`: story and gameplay ideas.
- `projects/`: tools and utilities, with their own setup instructions.
- `prototypes/`: playable experiments with their own code and asset copies.

Prototypes own their assets; root assets are starting material, not live dependencies.
Contributors can copy and adapt existing work independently.

## Adding prototypes

Keep each prototype independently runnable, with a short README explaining the
experience, controls and setup. Consider a **Back to Story Lab** link on its main
screen so visitors can easily return to the portal; make its URL work in the
hosted deployment as well as the local preview.

When a prototype is ready to share, you're encouraged—but not required—to add a
tile to the [public Story Lab portal](https://jesusfilm.github.io/story-lab/).
For a listing:

- Capture a clear title, a one-line description and basic play instructions.
- Select or capture representative prototype art or a gameplay screenshot for the
  tile, with useful alt text. Label older or illustrative imagery accurately.
- If there is a retrospective, include a short readable account of what was tried,
  learned and remains uncertain, and link it from the tile. A retrospective is
  encouraged when useful, not a prerequisite for sharing a prototype.
- Make the tile open a working, self-contained static demo. Verify that scripts,
  models, textures and other assets load under the GitHub Pages deployment path,
  without localhost services or credentials. Show loading progress or status and
  a useful error/retry message rather than leaving visitors on a silent loading
  screen. Check the deployed tile-to-play flow in a browser.
- Review all public text, imagery, retrospectives and runtime files for personal
  details, secrets and internal information. Follow the portal's explicit reviewed
  file list; never publish a prototype folder or the private checkout wholesale.

See the [publication handoff](docs/handoffs/github-pages-portal.md) and the portal's
own instructions when available for listing, validation and publishing steps.
Story Lab is intended to be public. GitHub Pages publishes the reviewed portal
build from this repository; keep source files suitable for public sharing too.

## Prototype loading screens

Use the dependency-free animated loaders in `assets/loading-indicators/` for every
prototype. Copy the CSS/JS into the prototype so it remains independently runnable.
Render the overlay in the initial HTML and start its classic script before the 3D
module downloads; do not wait for React, Three.js, models, or textures to show it.

Assign options by the stable creation number in `prototypes/README.md`:
`option = ((prototypeNumber - 1) % 3) + 1`.
The cycle is **1 Sheep theatre → 2 Follow the lantern → 3 A village unfolds**.
Thus prototype 4 uses option 1, prototype 5 uses option 2. Append new numbers;
do not renumber existing prototypes when sorting or retiring an entry.
All three options remain in each copied loader; set `data-loading-option` to select.

Keep animation independent of real loading progress: no invented percentage or
minimum wait. Update `#loading-text` with real phases/resource counts, hide the
overlay only when playable, and retain pause, reduced-motion and retry support.
Stop animation when hidden. Include copied runtime files in the portal's explicit
publication review and test cold-load, failure, mobile and deployment-path behavior.

## Simple asset library direction

For new or replacement 3D assets, use the project-local
[`create-asset` skill](.agents/skills/create-asset/SKILL.md). A short request such as
`$create-asset market stall` starts the style/reference/model/library workflow and
asks where to use the result, including a library-only option.

Use `styles/<style>/README.md` as the single current visual guide with a small set
of reference images. Link to it relatively from asset descriptions. New assets
should use descriptive filenames under their category and asset name. Preserve
useful references, models, textures, animations, editable sources and required
licenses/attribution. Do not add conversation quotes, approval histories, provider
job IDs, credit balances, temporary paths or copied style snapshots to the library.
Paid-job recovery state belongs outside the repository; do not delete active
recovery state as part of library cleanup. Prototypes retain independent assets.
The legacy nested asset layout is being migrated; do not extend that layout.
