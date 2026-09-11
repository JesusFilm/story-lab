# V2 validation — 10 September 2026

## Evidence

- Fixed two runtime defects reported during viewing: procedural bone rotations could accumulate when Three.js skipped unchanged animation tracks; facial keys created from Blender's current mix included earlier mouth deformation in later blinks. The animation layer now restores the last unmodified clip rotations before each sample, and each facial key is created independently from the basis at zero influence. Facial controls also use each model's own eye height.
- Regression checks exercise the complete 136-second sermon at 60 updates per second, compare sampled poses with fresh actors, hold poses for 600 frames, pause with continuing idle time, seek backward/forward, and repeat standing/seated crowd updates. Blinks on all six actual GLBs must stay within the eye region and below 25 mm displacement. These checks pass; the whole project has 28 passing tests.
- Actual Three.js runtime geometry (skinning, morphs and procedural gestures after 600 repeated frames) is baked by `scripts/capture-v2-runtime-poses.ts` and rendered by `blender/render_v2_runtime_checks.py`: [held teacher gesture](qa/runtime-teacher-held-gesture.png), [teacher crouch](qa/runtime-teacher-crouch.png), [listener blink](qa/runtime-listener-blink.png). These isolated model renders verify posed geometry, not browser rendering or frame rate.

- Six exported GLBs use actual skin weights and full hip/thigh/calf/foot/toe skeleton chains. Facial morphs start neutral.
- Automated checks exercise every teacher timeline sample at 1.5-second spacing, verify finite world transforms, preserve bone lengths, and check foot/toe contact with the ground.
- Independent SkeletonUtils clones animate separately. Jaw influence returns to zero when speech stops. Walking phase follows accumulated travel distance and supports seeking.
- Original V1 geometry, teaching edit and caption checks remain in the test suite.
- Offline Blender pose renders use the exported V2 GLBs and the retargeted motion library: [teacher idle](qa/teacher-idle.png), [walk](qa/teacher-walk.png), [seated](qa/teacher-seated.png), [female listener](qa/listener-idle.png). These are model checks, not screenshots of the web experience. The isolated seated pose has no seat; the app adds a field stone and adjusts ground contact.
- The preview page, teacher GLB and motion JSON returned HTTP 200 at localhost:3001. TypeScript and the production build pass. The build reports the expected large Three.js client chunk warning.

## Limits

Browser UI interactions and immersive headset rendering were not visually tested in this pass. Test audio permission, V1/V2 switching during playback, actual frame rate, controllers, stereo captions and close-up clipping in the target browser/headset before deployment.

The free assets provide stylized athletic anatomy and two base faces. Hair, body width, palette, posture and sex provide variation; this is not a scanned historical crowd. The plain upper garment and robe skirt are still adapted clothing, with a locally added sash. Some intersections can remain in bent/seated poses, especially where hands meet cloth. The mouth is closed geometry with subtle jaw/width deformation; it has no animated teeth/tongue or phoneme recognition. Do not describe it as cinematic lip sync or exact recreation of the film performance.

V2 renders individual skinned characters rather than V1's instanced rigid parts. Real-headset profiling and LODs remain necessary for a production crowd budget.
