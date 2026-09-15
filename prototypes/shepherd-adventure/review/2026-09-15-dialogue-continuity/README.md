# House dialogue continuity — 15 September 2026

Restored the three gate-wing runs beside the timber gate, including the
connection toward the empty stall and the return on the other side. The newer
decorative wall connections remain. [Restored gate in the player view](house-0-player.png).

## Camera references

The rehearsal uses the same village-game renderer and camera as normal play.
At each settled conversation stop, a 1536×1024 capture records the real player
view. Matching architectural plates hide only the shepherd and carried-lantern
geometry for the existing offscreen-speaker presentation; camera, field of view,
world geometry and lighting are unchanged. Camera transforms are saved alongside
each plate. This avoids manually approximating the viewpoint with the debug camera.

| House | Actual player view | Architectural plate | Current conversation images |
|---|---|---|---|
| 3 | [Player](house-3-player.png) | [Plate](house-3-plate.png) | [Closed](../../assets/house-3/lit-door-v3.png), [opening](../../assets/house-3/opening-door-v3.png), [speaking](../../assets/house-3/helpful-resident-v3.png) |
| 8 | [Player](house-8-player.png) | [Plate](house-8-plate.png) | [Closed](../../assets/house-8/closed-door-v2.png), [open](../../assets/house-8/open-door-v2.png) |
| 9 | [Player](house-9-player.png) | [Plate](house-9-plate.png) | [Opening](../../assets/house-9/opening-door-v2.png), [speaking](../../assets/house-9/talking-owner-v2.png), [pointing](../../assets/house-9/pointing-left-v2.png) |

Native ImageGen edits use these plates for architecture and the previous
illustrations for resident identity. Subsequent poses use the new first frame
so camera and scene dressing stay consistent. Exact prompts accompany each image.
The originals remain available. Fine generated surface textures vary slightly;
these are illustrations anchored to the current geometry, not pixel-identical
renders of the 3D assets.

House 3 includes its right annex, two foreground wall runs and left decoration.
House 8 includes both front clusters and surrounding walls/buildings; its rear
annex is occluded from this camera. House 9 includes its left annex, both clusters
and the animal-area background. Door hinge/ring sides and the owner's pointing
direction are retained. No dialogue text, chronology or character design changed.

House 1's refusal uses live 3D lighting and voice with no illustration. House 5
has no owner exchange or illustrated diorama. Both were audited without adding
unrequested images.

## Validation

- [Route/state geometry](geometry-and-state.json), including restored gate walls.
- [Camera checks](camera-samples.json).
- [Browser checks](browser-checks.json): all twelve pages across the three
  conversations, replacement image loading, return to play, mobile layout.
- [Mobile dialogue capture](mobile-house-8-dialogue.png).

The public portal build still has a pre-existing review-hash mismatch beginning
with `index.html`. Changed runtime inputs have current publication hashes. The
changes are local; no deployment or user acceptance is implied.
