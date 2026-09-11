# Initiative: experience the sermon from within the crowd

## Intent

Make a sermon accessible as a place: the listener stands among ordinary people and can look, move, hear the original English performance and read synchronized subtitles. Desktop interaction is the first entry point; stereoscopic WebXR is implemented for the headset phase.

## First prototype

- Original Blender human placeholders with tunics, mantles, head cloths, hair, faces, hands and sandals; ten varied, articulated crowd characters plus Jesus.
- Three.js terrain, grass, stone terraces, scattered rocks, olive trees, woven shade shelters and pottery.
- Warm sun, soft shadows, a hazy landscape and an earthy film-inspired palette.
- Eleven local teaching clips and a continuous edited track, with separate crowd dialogue removed.
- Official English captions retimed to the edit; synchronized on media.currentTime, including seek/pause.
- First-person mouse, keyboard and touch movement, collision circles and a 25m exploration boundary.
- WebXR stereo rendering, head tracking, movement, snap turning, controller play/pause and in-scene subtitles.
- Source notes and model replacement conventions within this folder.

## Deliberate limits

This is a low-poly artistic reconstruction, not photorealism or an archaeological survey. Actor likeness, exact film choreography, lip-sync and anatomical detail are not reconstructed. The soundtrack is an edit of Jesus’ dialogue with the original background sound beneath it, not a separated voice stem. Broad walking and gestures follow reviewed film moments, adapted to this layout; exact film steps and phonemes are not reproduced. Hard scene objects such as individual rocks and the cloth shelter do not have full physics collision; crowd figures and tree trunks have simple collision circles. Walking is bounded to the main gathering.

The generated teaching WAV and VTT play locally; rebuilding from the official caption source requires internet. Source URLs can change. Playback/caption failures are reported; the experience does not silently restore the unedited soundtrack. Initial seeking before the media has loaded is unavailable. No persistent user data or account system is added.

## Acceptance for a real headset

1. Open a trusted HTTPS URL on the target headset and verify Enter VR becomes available.
2. Play through all 2:16; compare a few early, middle and late captions with audible words.
3. Confirm scene scale, eye height, stereo captions, sound direction, left movement, right snap turn, and both trigger controls.
4. Enter/exit VR repeatedly, recenter, pause and seek, and recover after a network interruption.
5. Check sustained frame rate and comfort on the actual headset. Prefer teleportation and a movement vignette as a next comfort option.
6. Adjust font size and panel distance with the wearer; avoid peripheral unreadable captions.

No physical headset test has been performed in this development session. Browser interaction and visual QA are also not claimed by the build-only checks.

## Next phase

- Retain Jesus Film Project attribution for the teaching excerpts; a dialogue-only stem could improve the listening experience.
- Swap the teacher first for a detailed rigged GLB, then introduce limited crowd variations with LODs and instancing.
- Add a carefully timed animation track based on reviewed film blocking; optional lip-sync when suitable audio rights and stems exist.
- Add teleportation and seated accessibility after headset feedback.
- Review reconstructed clothing and ecology with a historical adviser before presenting it as an educational reconstruction.

## September 2026 performance revision

See `PERFORMANCE-REVIEW.md` for the eleven source cuts, observed film actions, articulated model changes, and remaining limits. The current app includes independent idle motion, coordinated teacher choreography, and approximate speech-energy mouth animation.
