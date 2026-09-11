# Loading theatre

Three lightweight canvas scenes with no external art, fonts or dependencies:
1. Sheep theatre — a flock takes different leaps over a fence.
2. Follow the lantern — a wandering light, fireflies and village homes.
3. A village unfolds — a miniature village assembles, with trees and sheep.

Copy `loading-theatre.css` and `loading-theatre.js` into the new prototype
(or its public directory). Copy the overlay from `example.html` into the initial
HTML, load its CSS, then load its classic script immediately after the overlay,
before the main application module. For server-rendered apps also include the
overlay and script in the document layout, outside the application root.

Assign the next permanent number in `prototypes/README.md` and select
`data-loading-option="((number - 1) % 3) + 1"` using the computed integer.
Update the heading to match the selected scene. All copies contain all options.
These are copied assets, not a shared runtime dependency.

Set `window.storyLoading.status('Loading models…')` for actual loading phases,
`window.storyLoading.fail('A model could not load. Please retry.')` on failure,
and `window.storyLoading.ready()` when playable. Existing shepherd code can keep
updating `#loading-text` and setting `#loading.hidden`. Do not equate elapsed time
or animation position with download progress. Do not delay readiness for animation.

Pause and system reduced-motion preference keep the scene still. A clock and
slow-load explanation remain independent of motion; reload appears for errors
or after one minute. Animation stops when the overlay is hidden and suspends
while the browser tab is hidden. The village repeats its construction on long waits.

For changes, update this source and copy it explicitly to each prototype, then
review those files for the portal manifest. Never add a cross-prototype import.
