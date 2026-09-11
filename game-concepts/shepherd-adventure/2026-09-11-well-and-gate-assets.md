# Journey well and gate assets

- Status: done — both models generated and integrated into the walkthrough; programmatic verification passed, artistic visual review pending.
- Owner: Codex asset task; Jaco accepts art. Parent journey task owns all prototype code and the gameplay plan.
- Last updated: 11 September 2026.
- Objective: matching native ImageGen/Tripo well and gate visuals for the journey prototype.
- Scope delivered: one static `stone-well` and one static `timber-gate` leaf, no rigs or clips, no extra paid models.
- Related game: [shepherd maze](../shepherd-maze/concept.md). [Catalog](../shepherd-maze/asset-catalog.md), [governance](../../assets/README.md).

## Outputs

| Asset | Reference lineage | Model and integration |
|---|---|---|
| stone-well | Native ImageGen ref-001 → ref-29371164-0dcc-4074-a8ed-01287f94e8e1 | [Canonical GLB, measured fit and verification](../../assets/structures/stone-well/README.md) |
| timber-gate | Native ImageGen ref-001 → ref-28599664-7057-4ff6-bbb2-606d9f3bf5d0 | [Canonical GLB, hinge fit and verification](../../assets/structures/timber-gate/README.md) |

Machine-readable model paths, costs and full verification. Original native ImageGen PNGs and exact prompts remain beside each ref-001. Production reference records preserve their lineage and matching image hashes.

## Authorization and process

Jaco requested references first, then these two static Tripo models, with credit awareness. After both images were displayed and saved, he directed proceeding with the work. Scoped follow-the-light-aa v004 preserves the v003 visual rules and authorizes only these two model inputs. The exact upload/charge confirmation is retained in each model-request.json: Jaco approved uploading the two shown well/gate references to Tripo and spending up to 60 API credits total. This is input and generation authorization, not final artistic model acceptance.

Native ImageGen created one candidate per asset. Inspected anchors: Follow the light village scene, low-wall-kit ref-001 and market-stall ref-001. Prompts, PNGs, immutable style snapshot, dimensions and SHA-256 hashes are retained. These are creative game assets, not historical verification.

The existing designated runner submitted each job once, using the earlier user-selected workspace .env override without printing or copying credentials. Profile: v3.1-20260211, standard geometry/texture, PBR, 30,000 face limit. Saved task IDs were resumed through download. No failed provider submissions or duplicates occurred.

## Results and credits

- Well: 29,455 triangles, 2,086,868 bytes. One mesh/material, three embedded textures, no skeleton/clips. All 25 center rays missed the model; all 12 rim rays hit stone, verifying the sampled through-opening. At 2.2 m outer diameter, horizontal samples measure about 1.40–1.49 m inner opening. Grounded 0.85 m-height fitting instructions retained.
- Gate: 26,564 triangles, 1,802,148 bytes. One mesh/material, three embedded textures, no skeleton/clips. 188 of 576 rays pass through barred gaps. Export width lies along Z; recorded transform produces actual bounds 3 m wide × 1.9 m high × 0.15 m deep. Place the leaf in a moving hinge group while keeping support posts fixed. Hinge fitting side, swing direction and artistic appearance await visual integration review.
- Preflight balance 785, final authenticated balance 725, frozen 0. Actual charges: 30 + 30 = **60 API credits**. No rigging, animation, additional models, paid image API calls or credit purchases.
- [Official pricing](https://developers.tripo3d.ai/en/pricing), checked 11 September 2026, matched the recorded charges.

## Verification and remaining work

Saved image/prompt/style/anchor hashes and candidate registration passed reference checks. Both GLBs pass header/hash, embedded resources, finite positions, valid indices, and static mesh checks. Actual geometry was used for the opening/gap and fit measurements. Reproduction script uses the existing local viewer Three.js runtime. No Computer Use or desktop screenshots were used; visual quality is unreviewed.

The walkthrough now loads canonical exports using the fitted dimensions recorded in the per-asset integration.json manifests. Water/underground shaft, fixed gate posts, rigid hinge animation and collision remain runtime-owned. The initial generation phase edited no prototype files. Jaco subsequently requested integration, recorded below. The game geometry, camera, swing clearance and visual quality need in-game evaluation; no final acceptance pointer was set for either mesh.

## Approval-system limitation

Earlier cross-task handoff calls were rejected by automatic approval review. The first Tripo command was also rejected before execution, so it produced no upload, task or charge. Jaco's subsequent explicit upload/charge approval allowed both jobs to complete. No alternative route was used to bypass a rejected call.

Jaco also requested removal of the approval mechanism. The installed config/CLI and [official configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference) were checked. This task has an active managed automatic reviewer, which cannot be removed from inside the task. No global permissions or active managed restrictions were changed. Outputs remain available in this task and in the canonical shared library.

## Walkthrough integration — 11 September 2026

Jaco explicitly requested this task to replace the existing low-quality well/gate models in the walkthrough. The earlier asset-only boundary is superseded for this integration. The gameplay task is idle; this change owns only model loading, fitting, existing well/gate placement, and relevant server routes/checks/docs. Scope: use canonical exports without copying them; retain water and stationary gate posts, keep existing hinge behavior. Completion checks: actual GLB loading, fitted dimensions, no placeholder duplicate, open/closed gate clearance and static post positions, HTTP routes, existing journey state/camera checks. Visual quality remains unreviewed unless manually inspected.

Integration completed: [runtime module](../../prototypes/shepherd-adventure/src/journey-poi-models.mjs), [world placement](../../prototypes/shepherd-adventure/src/journey-world.mjs), [checks and limitations](../../prototypes/shepherd-adventure/review/2026-09-11-well-and-gate/README.md). The local server was restarted for the two allowlisted GLB routes. Existing journey progression and camera checks pass.
