# Nativity scene improvements — 12 September 2026

Status: revised after playtest feedback; approved single-gate route implemented and locally validated. Feature branch: `codex/shepherd-nativity-area`.

## Requested outcome

Move the Nativity animal stall away from the settlement into an isolated animal
area, following the [user-supplied layout](request-layout.png). The image is layout
reference material; the accompanying user request defines the work.

- Red: remove/alter the existing northern path and shelter.
- Brown: curved new approach to the relocated shelter.
- Dark blue: new animal-area walls; light blue: gate.
- Purple: larger animal stall hosting the Nativity, northwest of the settlement.
- Orange: animal pen within the new area. Green: surrounding trees.
- Generate Mary, Joseph and baby Jesus in a manger with Pixal3D, using the
  create-asset workflow and matching the actual ending diorama artwork.
- Reuse available sheep. Optional new animated donkey/ox models would use Tripo.
  Keep animals calm; any stall motion should be limited to basic idle/movement.
- Use a feature branch and maintain an auditable progress document.

## Implementation interpretation

Approximate map coordinates: shelter near (-33,-73), pen near (-35,-53),
area walls spanning x=-40 to -16 and z=-66 to -37, gate on the east side near
z=-56. The existing settlement fold and its discovery route remain useful.
The final approach curves north and then west outside the animal-area walls.
The family is a static posed tableau; sheep in the pen remain stationary.

## Progress

- [x] Inspect current world, route graph, asset conventions and ending artwork.
- [x] Create the requested feature branch and preserve the layout reference.
- [x] Generate and inspect family reference and Pixal3D model.
- [x] Prepare runtime model, headless renders and library catalogue entry.
- [x] Implement shelter, path, walls, gate, pen, trees and calm animals.
- [x] Update independent prototype assets and source records.
- [x] Regenerate settlement map and portal reviewed inputs.
- [x] Run relevant structural, gameplay and publication checks.

No commit, merge or deployment was requested.


## Delivered implementation

- Shelter at (-33,-73), east-facing, approximately 9 m wide by 7 m deep.
  The former shelter and straight northern trail are removed.
- Curved route from the rear passage reaches (-27,-72). Both followers and the
  player use the same authored route, preserving the gate welcome and ending.
- Stone enclosure walls meet the western boundary, with a closed timber gate
  near (-16,-56), an inner animal pen near (-35,-53), and four mapped trees.
- Static Pixal3D family: Mary seated in blue and cream, Joseph in brown and
  fleece, baby Jesus swaddled in a timber manger. The original generated model,
  reference, exact prompt, prepared derivative and render reviews are preserved.
- Three stationary sheep in the inner pen and two in the shelter. Existing sheep
  are held at a real idle pose; no additional Tripo jobs were needed.
- Independent runtime assets, source hashes, library/gallery entry and explicit
  portal dependencies updated. Map includes actual transformed sheep poses.

## Validation evidence

Passed: nativity-area geometry and wall clearance, both journey completion routes
and 75 knowledge states, companion sequences/pause/reset, HTTP model loading,
interactive village gate and fixed lights, settlement-map consistency and market
clearance, presentation and animation transitions. Camera sampling covers 304
configurations and 62,320 frames with no hidden player-chest frames.

The local portal build and verification passed: 237 files, dependency checks and
sensitive-content scan under `/`, `/story-lab/` and `/story-lab-demos/`.
No deployment was performed.

The pre-existing `verify-nature-assets.mjs` check fails because its provenance
contains stale hashes for eight PNG textures. All eight files were verified
byte-identical to `HEAD`; this feature does not alter them. That unrelated
provenance mismatch remains unresolved.

## Visual review and limits

[Family front render](../../../../assets/characters/nativity-family/runtime-front.png)
shows the exported textured runtime. [Area composition](area-composition.png) and
[shelter composition](shelter-composition.png) show actual game geometry rendered
in Blender with simplified environment materials and neutral review lighting.
They are not browser screenshots. Their plain ground is a review plane, not the
runtime terrain. The source/runtime family images use the actual textures.

The first selected-to-active texture bake was rejected because it produced black
patches. Retaining the original atlas fixed the frontal appearance. Small holes
remain in inferred rear cloth; this is a frontal static tableau, not a rigged or
fully finished character asset. No browser, mobile-device or cold-load/failure
playtest was performed in this feature pass. Existing loading/error infrastructure
continues to handle the newly declared local models.

The implementation remains uncommitted on the requested feature branch.


## Approved route revision — after player feedback

The first playtest found that the camera did not show the new sheep pen. The user
approved routing through the enclosure, with these changes to the proposal:
[approved annotation](approved-route-revision.png).

- Follow the light-blue path, entering from the southeast and curving past the pen.
- Only one animal-area gate. The proposed eastern entrance and northern exit are
  superseded by one open gate near (-21,-39).
- Extend the enclosure east/north so the Nativity shelter is inside it. Remove
  the old dividing wall entirely; the player stays inside after entering.
- Preserve the separate interactive village gate used earlier in the journey.

Implemented: smooth route through the gate, close pass east of the sheep, gradual
slowdown from running to 2 m/s, scenic camera framing and an updated final arrival
camera targeting the relocated family. Both companions follow the same route.
The game remains independently runnable; no new generated models are required.

### Revision validation

`verify-animal-route-view.mjs` projects the actual three pen sheep into the camera
at 16:9 and 390:844, checks wall/structure obstruction and raycasts against the pen
and gate. All three remain continuously visible for 7.0 seconds in landscape and
4.8 seconds in portrait. The shepherd remains within the view throughout. Camera
positions move continuously; the slow scenic section lasts about 8.8 seconds.
This validates composition geometry, not runtime illumination or physical devices.

Journey completion, companion continuity/pause/reset, nativity layout, single open
gate, wall/path clearance, map consistency, POI loading and camera checks were
rerun for this revision. The revised model map and Blender composition images
replace the earlier snapshots above. The earlier proposal map remains historical
and is not the implemented route.

Portal revision validation passed: 238 published files checked at all three base paths.


## Further playtest fixes

User-reported issues: black artifact by the enclosure wall; unfinished wooden
fence/gate ends; overlapping shepherds at the last stop; and an immediate outro
instead of a first-person Nativity reveal and a “heard the good news” button.

- [x] Move dark horizon geometry clear of the settlement. Its nearest bounds now
  end at z=-120 or farther, leaving 40 m beyond the north wall.
- [x] Add the gate leaf's vertical end posts and both fence entrance posts.
- [x] Give companions their own final approach endpoints, 2.2 m either side of
  the main shepherd, all facing the Nativity.
- [x] Add a six-second shoulder-to-eye-level camera reveal; keep pause/resume,
  restart and reduced motion supported. Clear grass from the shelter footprint.
- [x] Start the outro only from the requested button after the reveal. Preserve
  existing media prefetch and failure/retry handling.
- [x] Verify geometry, model state, browser flow and new first-person screenshots.

The browser checks cover landscape and 390×844 portrait, no automatic outro,
button text/action, hidden player body at eye level, pause/resume and restart with
zero page errors. The existing story-loading suite passes, including delayed
ending media, failed intro retry, blocked audio and reduced motion.

[Actual landscape arrival](arrival-landscape.png) ·
[Actual portrait arrival](arrival-portrait.png).
