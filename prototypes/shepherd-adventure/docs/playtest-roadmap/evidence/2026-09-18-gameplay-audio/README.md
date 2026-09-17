# Gameplay audio first slice — 18 September 2026

This checkpoint implements the first bounded part of D032/I01 on
`codex/shepherd-feedback-house-handoffs`:

- a shared gameplay audio owner in `src/journey-audio.mjs`;
- a restrained synthesized night bed with wind and sparse insects;
- player footsteps driven by actual walking/running distance, including the
  running introduction;
- one quiet decision cue for meaningful buttons; and
- a gameplay sound control that mutes the shared bed and existing house, gate,
  stall and reunion effects together.

The intro-diorama → 3D audio handoff, loader behavior and resource unloading are
unchanged. Contextual proximity sources such as sheep and muffled house voices
are intentionally a later pass.

## Before and after

Before this slice, the rebuilt village had no shared gameplay audio owner or
player footsteps. House, gate, stall and reunion effects each managed their own
audio context. The legacy route contained a separate synthesized bed, but it was
not the owner for the rebuilt village.

After this slice, the rebuilt village starts gameplay audio on a user gesture,
suspends it on pause, visibility loss or mute, and resumes it without rebuilding
or duplicating the loop. Footsteps are scheduled from movement distance rather
than a render-frame timer. Existing scene effects consult the same mute state.

## Verification

Automated checks passed:

- `node --check` for the audio owner, village player and affected scene modules;
- `node checks/verify-journey-audio.mjs` for start, footsteps, decision cue,
  mute, pause and stop behavior;
- `node checks/verify-house-advice.mjs`;
- `node checks/verify-house-owner.mjs`;
- `node checks/verify-rehearsal.mjs`; and
- `git diff --check`.

The local rehearsal was checked in CUA at
`http://127.0.0.1:8766/rehearsal.html?point=7` using a 1082 × 1324 viewport at
DPR 1. The sound control began as **Sound on**, toggled to **Sound off** and
back to **Sound on**, and the House 8 flow still reached the two-page exchange,
`Thank you`, the stall reveal and `Go to the stall`. A fresh normal-player tab
also reached gameplay after skipping the story and introduction, and exposed the
same sound control. The rehearsal browser log remained empty.

## Acceptance limits

No audible recording or independent listening review was available in this
checkpoint. The technical checks establish scheduling and lifecycle behavior;
they do not establish that the bed, footsteps or cue feel natural, are quiet
enough, or suit the full route. The contextual animal/house sources and the
House 1 voice reliability repair remain open.

## Next review question

During a normal full-route playtest, does the night bed make the village feel
alive without becoming music, and do the footsteps and decision cue feel
supportive rather than game-like? If the first slice fits, add one proximity
source at the animal fold and one muffled lit-house source with smooth distance
attenuation.
