# Teaching edit and performance review

## Review method

Reviewed the official 218.84-second chapter as local frame sequences: the full chapter at four-second intervals, then closer sequences of the cheek illustration (60–70s, two frames/second), giving passage (76–92s, one frame/second), and judgment passage (162–176s, one frame/second). Compared those observations against the official English WebVTT to distinguish teaching from separate character dialogue. This is visual observation and subtitle-guided editing, not motion capture or a claim of manually verified phoneme alignment.

The source clip is in `.cache/film-review/`, excluded from version control. Its source remains the official chapter URL recorded in SOURCES.md. No downloaded reference frames are presented as original artwork.

## Observations applied to the animation

| Source-film time | Observed action | Adaptation in this scene |
| --- | --- | --- |
| 5–10s | Standing beside the shelter, restrained arms, addressing the people nearby | Still stance with a directed gaze |
| 21–37s | Approaches a group and looks between listeners | Short approach in the clear central aisle, then a pause |
| 39–54s | Moves through the crowd, turning toward people as he speaks | Slow movement between two positions; head and torso turn independently |
| 61–67s | Raises his right hand, touches/indicates a listener's cheek, then lowers it; the other hand holds fruit | Timed right-hand gesture around face level; no invented impact or invisible actor contact |
| 73–89s | Walks to a seated man, bends/lowers himself, extends a hand and gives fruit; then speaks from a lowered position | Approaches a seated listener, bends and lowers his posture, extends a hand. Does not reproduce the fruit handoff |
| 92–120s | Stands, turns, walks to another listener, and places a hand near her shoulder | Straightens, walks and briefly extends an arm; the separate interaction dialogue is omitted |
| 136–156s | Turns away from the earlier interaction and addresses another group with restrained gestures | Slow turn/approach, eye direction changes, small hand movement |
| 162–175s | Mostly upright and stationary, with emphatic speech, jaw motion and small head turns | Planted stance; emphasis through gaze, nods and speech-driven jaw motion |
| 182–203s | Turns and moves beside people; extends a hand; later addresses the group around the beam illustration | Short measured movement, lowered/open hand, and a final explanatory gesture. No beam interaction is invented |

The layout differs from the film. Path positions are hand-authored for the prototype's central aisle and interpolate continuously across audio cuts. The teacher does not teleport to the film's next camera position. There is no claim that every step, joint rotation, or mouth shape exactly reproduces the actor.

## Audio edit

`scripts/teaching-edit.json` is the authoritative editable source in/out list. `scripts/build_teaching_audio.py` makes eleven numbered PCM WAV files, corresponding VTT files, one continuous teaching WAV/VTT, an edit manifest, and a speech-energy envelope. Source order and spoken speed are preserved. Eight/twelve-millisecond edge fades prevent clicks; 320ms silent breathing spaces separate cuts. No crossfade obscures words.

Removed: opening bargaining, the laugh/reaction sequence, objections about touching/talking to a woman, shouted appeals to Jesus, long interaction pauses, and the final non-sermon tail. The response word preceding the second enemies/mercy section is also omitted, so it does not answer an absent crowd exchange.

The resulting edit is 136.210 seconds, with 43 caption cues. This is a selection of Jesus' dialogue from the original mix, not vocal-source separation: music and ambience under his speech remain. Cut points are subtitle-guided, with short margins. Listen to the individual clips for any further editorial refinement, particularly the closely spaced speaker changes at 120.64s and 174.85s in the original.

## Character animation

`blender/create_characters.py` exports eleven original articulated GLBs and `blender/sermon-characters.blend`. Ten crowd variants vary face proportions, nose shape, age cues, beard/hair, skin tone, shoulder width, body build, head cloths and garment colors. Instance scaling adds smaller variations without using identical whole-body proportions everywhere.

Each model has named torso, head, jaw, eyelid, upper-arm, forearm, lower-leg and foot joints. These are rigid articulated mesh parts, not a deforming skeletal/cloth simulation. Head/jaw/limb pivots are exported as glTF extras and retained for replacement models.

The teacher's broad performance follows the edited audio clock, so seeking restores the matching pose. Jaw opening follows RMS energy from the exact edited PCM and is gated by spoken captions; it closes while paused or during a gap. This is approximate speech animation, not phoneme/viseme lip sync.

Crowd breathing, blinks, glances, hand-rest poses and weight shifts use independent phases. Heads track the teacher within a limited comfortable angle, with occasional glances. One listener sits lower beside the giving passage. Crowd geometry is instanced per articulated part to preserve independent motion without one full draw-call set per person.

## Verification and limits

Automated checks cover edit ordering, all excluded subtitle exchanges, duration, subtitle bounds, source/edit-time conversion, continuous motion through cuts, significant observed pose beats, and GLB scale. Browser listening/visual comparison and physical headset comfort have not been certified. Rigid low-poly joints, approximate lowering/stepping, and a non-isolated soundtrack remain prototype limitations.
