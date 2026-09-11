# Gospel interactive experiences — Reference pack v1

Created 8 September 2026. Seven generated scene references and one reproducible maze design, organized by storyline. The pack is retained as a cross-game reference collection.

## Status within Watch Game

The [shepherd maze](../../../game-concepts/shepherd-maze/concept.md) is the primary direction;
its detailed control proposals remain open. The [Jerusalem search](../../../game-concepts/jerusalem-search/concept.md)
is **DRAFT — mechanics undetermined**. All witness, route, control and duration
suggestions for that storyline are exploratory. These concept documents record the
current direction; the pack preserves reference explorations.

## Browse the work

- [Storyline 1: Follow the light](storyline-1-shepherd/README.md) — three inspiration images, map, navigation data and control proposal.
- [Storyline 2: Where is Jesus?](storyline-2-temple/README.md) — four inspiration images and a creative witness-and-landmark search concept.
- [Visual gallery](gallery.html) — a local, self-contained index that loads this folder's images; open in a browser.
- [Visual review](VISUAL-REVIEW.md) — what was inspected and limitations.
- [Maze verification](storyline-1-shepherd/map/verification.json) — all 14 core checks passed; wall-following results included.
- [File verification](artifact-verification.json) — image dimensions, format, checksums and required-file checks.

## Main results

The shepherd map spans **140 × 140 m**, with three illustrated successful routes, **32 dead ends**, eight independent loops, and six jump/duck placements. Estimated travel is 4.3–5.4 minutes at 3.2 m/s; including brief junction choices brings the three routes to 4.8–6.1 minutes. Detours add time.

The Jerusalem concept uses an ochre-canopy market, an olive courtyard and Temple steps as recognizable landmarks. Conversations guide the parents toward Jesus; two proposed paths converge. A compact district with calm, persistent choices suits remote input. This storyline is inspiration and design direction, without a verified navigation map.

## Generation and verification

Artwork was generated with the built-in `image_gen` tool, one call per scene, with saved prompts beside each storyline. The existing shepherd sheet informed all three shepherd frames; the travelers' rest image supplied Mary/Joseph continuity for subsequent character scenes. The machine-readable manifest records provenance markers found in the delivered PNGs.

The map was drawn programmatically as a precise diagram, rather than relying on a generated picture to establish connectivity. Its PNG, SVG, walkability mask and JSON come from a deterministic graph. Generation and verification code is in `scripts/`.

All seven scenes were visually inspected for subjects, composition, lighting, character readability, broad continuity and obvious modern intrusions. File verification decodes all PNGs and records SHA-256 hashes. Maze verification checks graph and floorplan connectivity, route validity, dead ends, openings, defaults and obstacle placement.

These are visual references for subsequent modeling, not finished 3D assets. Engine collisions, camera/beacon visibility, exact historical accuracy and real-device latency are not established by these files. Scripture-based beats and creative additions are distinguished in each storyline's notes, with source links.

## Directory layout

```text
reference-pack-v1/
  README.md
  gallery.html
  VISUAL-REVIEW.md
  artifact-verification.json
  storyline-1-shepherd/
    README.md
    images/       3 generated PNGs
    prompts/      3 final prompts
    map/          annotated + clean PNG/SVG, mask, JSON, verification
  storyline-2-temple/
    README.md
    images/       4 generated PNGs
    prompts/      4 final prompts
  scripts/
    build_maze.py
    verify_pack.py
```
