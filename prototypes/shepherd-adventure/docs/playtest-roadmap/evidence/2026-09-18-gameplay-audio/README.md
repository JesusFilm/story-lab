# Gameplay audio revision — 18 September 2026

This checkpoint revises the first bounded part of D032/I01 under D033 on
`codex/shepherd-feedback-house-handoffs`:

- a shared gameplay audio owner in `src/journey-audio.mjs`;
- a still night bed led by sparse filtered-noise cricket chirps and occasional
  quiet breeze rustle, with no continuous wind layer;
- player footsteps driven by actual walking/running distance, including the
  running introduction;
- one low-volume wood/stone-like tap for meaningful buttons, with an even softer
  assembly variant for repeated lantern actions;
- distance-attenuated sheep near the animal pen and muffled low voices near lit
  houses; and
- a gameplay sound control that mutes the shared bed and existing house, gate,
  stall and reunion effects together.

The intro-diorama → 3D audio handoff, loader behavior and resource unloading are
unchanged. This revision keeps those transitions out of the scope.

## Before and after

Before the original slice, the rebuilt village had no shared gameplay audio owner
or player footsteps. House, gate, stall and reunion effects each managed their own
audio context. The legacy route contained a separate synthesized bed, but it was
not the owner for the rebuilt village.

The first slice's continuous wind was too busy, and its effect gains and cricket
root gain made footsteps, cues and insects difficult to hear. Its clean oscillator
pair also read as an electronic chime. After this revision,
the rebuilt village starts the same owner on a user gesture in both the normal
player and rehearsal route, suspends it on pause, visibility loss or mute, and
resumes it without rebuilding or duplicating the graph. Footsteps are scheduled
from movement distance rather than a render-frame timer. Existing scene effects
consult the same mute state. Cricket chirps use short filtered noise bursts rather
than clean pitched oscillators; breeze rustle is quieter. Button feedback uses a
short filtered transient rather than a rising digital tone, with a softer variant
for repeated lantern assembly clicks. Contextual sheep and house voices now
schedule only when the player is inside their radius, with a smooth distance
falloff.

## Verification

Automated checks passed:

- `node --check` for the audio owner, village player and affected scene modules;
- `node checks/verify-journey-audio.mjs` for start, footsteps, decision cue,
  crickets, breeze, proximity sheep/voices, mute, pause and stop behavior;
- `node checks/verify-house-advice.mjs`;
- `node checks/verify-house-owner.mjs`;
- `node checks/verify-rehearsal.mjs`; and
- `git diff --check`.

The local rehearsal was reloaded and checked in CUA at
`http://127.0.0.1:8766/rehearsal.html?point=7` using a 1082 × 1324 viewport at
DPR 1. The first pointer gesture started the route owner; the sound control began
as **Sound on**, toggled to **Sound off** and back to **Sound on**, and the House 8
flow still reached the two-page exchange, `Thank you`, the stall reveal and `Go to
the stall`. A fresh normal-player tab also reached gameplay after skipping the
story and introduction, and exposed the same sound control. The rehearsal browser
log remained empty.

## Acceptance limits

No audible recording or independent listening review was available in this
checkpoint. The technical checks establish scheduling, gain paths and lifecycle
behavior; they do not establish that the bed, footsteps, contextual sources or
cue feel natural, remain quiet enough, or suit the full route. The House 1 voice
reliability repair remains open.

## Next review question

During a normal full-route playtest, does the revised bed feel still and alive
without becoming music? Can footsteps and button cues be heard at a comfortable
level, and do sheep/voices grow and fade naturally as you approach and leave? If
the mix fits, add regional fire or animal detail only where it earns its place.
