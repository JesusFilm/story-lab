# Shepherd asset catalog

Characters and scenery for the announcement, village and Nativity. This describes
the concept; consult each [asset folder](../../assets/README.md) for available files.
Use the [Follow the Light guide](../../styles/follow-the-light/README.md).

## Characters and animals

One base model per ID per selected style. Pose/clip variants reuse that base rather
than creating a new Tripo mesh. Additional wardrobe/color variations can be explicit
later variants; do not silently multiply the requested roster.

| ID | Required subject / reuse | Required reference | Motion/pose requirement |
|---|---|---|---|
| `shepherd` | Player character | Isolated front T-pose | Idle, walk and run suggested from the older humanoid catalog; select exact clips at request, use in-place locomotion for route-controlled movement. |
| `angel` | Appears to shepherd with the good news | Isolated humanoid front T-pose; appearance details set in brief | Select suitable supported posture/gesture/idle at request. Announcement is a narrative role, not a verified talking preset. Flight/wing flapping are not initial requirements. |
| `joseph` | Nativity arrival | Isolated front T-pose | Select held pose/idle at request; kneeling is not assumed to exist as a preset. |
| `mary` | Nativity arrival | Isolated front T-pose | Select held pose/idle at request; baby remains a separate model. |
| `baby-jesus-swaddled` | Swaddled baby in manger | Isolated intended resting pose | Static initially; no humanoid locomotion rig required. |
| `extra-man-01` | Reusable adult male | Isolated front T-pose | Seated/meal poses with subtle pose-preserving idle movement. |
| `extra-man-02` | Second distinguishable adult male | Isolated front T-pose | Same reuse requirement; appearance distinction defined in brief. |
| `extra-woman-01` | Reusable adult female | Isolated front T-pose | Seated/meal poses with subtle pose-preserving idle movement. |
| `extra-woman-02` | Second distinguishable adult female | Isolated front T-pose | Same reuse requirement; appearance distinction defined in brief. |
| `extra-boy-01` | Reusable boy | Age-appropriate isolated front T-pose | Suitable seated/idle pose variants; keep child proportions. |
| `extra-girl-01` | Reusable girl | Age-appropriate isolated front T-pose | Suitable seated/idle pose variants; keep child proportions. |
| `sheep` | Repeated in pens/Nativity vicinity | Isolated standing quadruped, three-quarter | Walk and idle requested 10 September 2026: Tripo quadruped v2.5 rig and walk; locally authored skeletal idle (no provider quadruped idle preset). Visual/motion acceptance pending. |
| `donkey` | Nativity vicinity | Isolated standing quadruped, three-quarter | Static initially. |
| `ox` | Nativity vicinity | Isolated standing quadruped, three-quarter | Static initially. |

Characters use `assets/characters/<id>/`; the last three rows use
`assets/animals/<id>/`. All use ImageGen references and Tripo base models. These are
eleven human/angel character entries and three animal entries, including exactly
six extras, with no additional unspecified seventh child extra.

Extras must feel occupied and alive. Sitting at a table with a plate is sufficient
to suggest a meal; dedicated eating/utensil cycles are not required. A frozen pose
does not pass. Preview available clips; manually prepare subtle pose-preserving idle
when needed.

## Objects

Default to one isolated three-quarter reference and one Tripo base model per row.
Props remain independent of people/structures for reuse. Basic furniture can use
dimension-controlled procedural construction when needed; record that deliberate
method choice in its asset brief rather than mislabeling it as Tripo output.

| ID | Required object | Assembly/acceptance notes |
|---|---|---|
| `manger` | Manger with bedding | Baby separate; sized to contain the accepted baby pose without intersections. |
| `seat` | Bench or stool | Select initial form in brief; stable seat height/contacts for extra poses. Additional seating types are variants. |
| `meal-table` | Small table | Compatible with seated extra poses; reusable across open structures. |
| `plate` | Plate | Separate placement; no hands or food fused into the model. |
| `bowl` | Bowl | Separate reusable meal prop. |
| `bread` | Bread | Separate food prop; one reusable design initially. |
| `structure-lamp` | Wall/structure-mounted lamp | Separate mount orientation; light emission/spill is authored in the runtime, not guaranteed by a GLB. |

## Structures, modular walls and terrain

These use ImageGen for appearance references and **procedural/dimension-controlled
construction** for delivered geometry. Their technical profile is authoritative for
footprint and joints; a generated picture must not redefine the maze.

| ID | Required design/reference | Delivered model/behavior |
|---|---|---|
| `market-stall` | Isolated three-quarter open-market design | Partially open scenery with visible extras/furniture placed separately; fit assigned blocked footprint. |
| `animal-pen` | Isolated three-quarter pen/shelter design | Partially open enclosure attached to/associated with structures; animals placed separately. |
| `house-01` | First isolated house design, doors/windows readable | Shallow visible interior details and warm door/window glow; no navigable interior. |
| `house-02` | Second distinguishable house design | Same lighting/footprint contract; variation in facade/roof/openings within the style. |
| `nativity-shelter` | Isolated three-quarter arrival-shelter design | Manger, characters and animals separately placeable; preserve the goal approach. |
| `low-wall-kit` | One appearance reference plus authored dimension/connector sheet | Straight modules, corner/junction and end treatments; quarter-turn rotation and visually clean joins. |
| `ground-surface` | One neutral ground/material appearance reference | Procedural ground and maze geometry profile; texture scale/tiling and collision separate from image reference. |

Use `assets/structures/<id>/` for the first six rows and
`assets/terrain/ground-surface/` for the last. Multiple instances and wall lengths
are configured placement/kit outputs, not dozens of independent image generations.

Open structures are visually open, **not enterable** in this scope. Warm house
interiors are shallow visual dressing/window-door glow; full interiors and physically
accurate light transport are not required. Preserve visibility from the game camera
without putting geometry/people into clear maze passages.

[Maze Foundry](../../projects/maze-foundry/README.md) remains authoritative for layout,
metres, obstacle footprints and navigation. The current prototype's 4 m passages,
0.5 m thin walls and approximately 0.99 m low-wall height are calibration starting
points, not permanent game-wide requirements. Exported collision rectangles overlap
at junctions; that does not prove visual model seams. Define model pivots, endpoints,
quarter-turn rotations, connector treatment and dimensions in the kit profile, then
verify straight joins, corners, T/cross junctions, end caps and clearance. Reuse the
existing Foundry adapter contract rather than assuming every rectangle is a prefab.

## Narrative provenance

The angel's good news to shepherds and the manger arrival draw on Luke 2:8–20;
Mary, Joseph and the baby in the manger are identified in Luke 2:16. The village
maze, reusable extras/meal scenes, specific building arrangements and animal roster
are creative game adaptation. Angel appearance, costumes and environments are art
direction choices, not historical verification. No exact invented dialogue or
additional mechanics are approved by this asset list.

## Well and gate

| ID | Required design/reference | Delivered model/behavior |
|---|---|---|
| `stone-well` | Low rustic limestone well with visible open center | One static masonry curb; water/underground shaft remain separate. [Candidate and status](../../assets/structures/stone-well/README.md). |
| `timber-gate` | Timber barred village gate for roughly a 3 m opening | One isolated gate leaf; fixed posts and rigid hinge opening remain runtime-owned. [Candidate and status](../../assets/structures/timber-gate/README.md). |
