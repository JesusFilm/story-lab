# Shepherd Adventure

- Status: current shepherd direction; specific mechanics remain experimental
- Owner: Jaco (direction); Codex (current prototype)
- Last updated: 2026-09-11
- Direction confirmed by Jaco on 11 September: distinguish this adventure from Shepherd Maze and preserve both playable experiences.

## Premise

After hearing the good news, a shepherd leaves the fields and explores Bethlehem
to find the baby lying in a manger. The destination and biblical story are shared
with [Shepherd Maze](../shepherd-maze/concept.md); the challenge comes from observing,
investigating and discovering how to proceed through the village.

The narrative draws on Luke 2:8–20. The lantern preparation, tracks, landmarks,
closed gate, route discoveries and notebook are creative game devices. They are
not claimed as events described in the passage or as historical reconstructions.

## Player experience

Move from the open fields into a quiet, lamplit village. Notice clues, inspect
places, and use discoveries to reach unfamiliar areas. A detour can yield information
or another route. Finding the Nativity should feel like the culmination of a search.

The [current prototype](../../prototypes/shepherd-adventure/README.md) implements:

- A short preparation sequence: find a linen wick and oil, then light a lamp at the hearth.
- Fourteen authored locations connected by paths, with untimed route choices.
- Environmental observations, including animal tracks and a misleading ordinary fold.
- Alternative discoveries at the overlook and fold that reveal ways around a barred gate.
- Opening the rear gate and lighting its lamp for the shepherds who follow.
- A notebook remembering inspected places and discovered connections.
- Completion when the player inspects the final shelter.

There is no fuel arithmetic, countdown, score or loss of lives in this candidate.
The player follows authored lanes with arrows and OK; free roaming, navigable
interiors and a general collision solver are not implemented. Progress is in memory.
The final scene uses a simple swaddled stand-in, not the completed Nativity cast.

## Decisions and open questions

Jaco selected exploration and reading clues after rejecting the earlier arithmetic
challenge. He accepted the night atmosphere and route-following camera; subsequent
revisions address camera stability, visibility, interactions and animation.
These decisions select a direction, not approval of every current mechanic.

Audience, pacing, depth of discovery, final controls, recovery, Scripture presentation,
physical-device performance and enjoyment still require design decisions and playtesting.
Do not carry maze-specific difficulty, lives or navigation rules into this concept by default.

## Continue here

- [Light and camera plan](2026-09-11-light-and-camera.md): current investigation revision and follow-ups.
- [Search and camera](2026-09-10-search-and-camera.md): exploration decision and alternative routes.
- [Lantern arithmetic round](2026-09-10-lantern-journey.md): superseded challenge, preserved history.
- [Well and gate assets](2026-09-11-well-and-gate-assets.md).
- [Shared shepherd catalog](../shepherd-maze/asset-catalog.md), [asset governance](../../assets/README.md), and [reference storyline](../../assets/references/reference-pack-v1/storyline-1-shepherd/README.md).

The existing catalog remains canonical for both shepherd concepts; no duplicate
asset library or new art approvals are introduced by this separation.
