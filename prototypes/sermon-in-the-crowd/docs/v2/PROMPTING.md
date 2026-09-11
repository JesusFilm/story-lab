# Getting better characters with less iteration

Start with a usable asset contract and a small acceptance scene. Vague instructions such as “make the people more realistic” let an agent spend time polishing a fundamentally unsuitable mesh. More detail in the prompt only helps if it changes the method or defines a testable result.

## A reusable brief

> Adapt an existing artist-made, redistributable humanoid mesh. Do not construct human anatomy from primitive shapes. Before integrating a crowd, validate one fully dressed adult with a continuous skinned body and compatible clothing. Use human proportions, first-century Galilean-inspired plain woven garments, muted natural dyes, and simple footwear. Avoid fantasy armour, insignia, conspicuous buckles, modern fasteners, and pointed wizard hats.
>
> Deliver GLB with a named humanoid skeleton, correctly normalized scale and ground contact, idle and walking clips, independent head/eye controls, and either jaw/blink controls or facial blendshapes. State explicitly which facial capabilities are present. A rigged body does not imply speech-ready facial anatomy.
>
> Render front, side, back, close-up, walking, and seated/crouching poses before creating variants. Check connected hips/knees/ankles, garment clipping, feet contacting ground, neck seams, eyes, and mouth closure. Explicitly request browser testing of the actual Three.js scene at the intended viewing distance; include switching versions during playback, paused close-ups, and seated poses. Use the same framing, lighting and pose for before/after comparisons. Fix the highest-impact failed criterion, then repeat only that check.
>
> Keep geometry, asset adaptation, animation, audio timing, and rendering as separate modules. Reuse one compatible skeleton and animation library across the crowd. Choose variation from intentional age, proportions, hairstyle and clothing combinations rather than arbitrary scaling. Keep the old version selectable without restarting playback or moving the camera.
>
> Spend one bounded pass on adaptation. If the base mesh lacks the required anatomy, garment topology, or facial controls, replace the source asset instead of repeatedly patching it. Record sources, licenses and modifications.

## Where prompting saves work

1. **Constrain the method:** source, adapt, rig, retarget; do not invent anatomy in code.
2. **Front-load incompatibility checks:** inspect skeleton, bind pose, coordinate system, texture channels, mouth geometry and animation clips before making variants.
3. **Use reference frames and timecodes:** “right hand near cheek at source 62–65 seconds” is more actionable than “animate expressively.” Preserve the mapping from edited audio to source film time.
4. **Use a quality gate before multiplication:** one proven character and one short scene before fifty listeners. Crowd duplication amplifies every defect.
5. **Ask for a diagnosis, then a bounded repair:** name the visible defect, expected behavior and accepted evidence. Do not request a general refinement loop.
6. **Separate fidelity from rendering:** better lighting cannot repair missing anatomy; a detailed face without lip controls can look less convincing than a restrained stylized face.

No prompt guarantees realism. Good source topology, skin weights and motion data remove entire categories of work that prompting alone cannot solve. Blender remains useful for deterministic conversion and garment adaptation; it need not be used to author every human from scratch.
