# Shepherd companion — stocky

Supporting shepherd from the opening departure artwork, distinct from the playable
fleece-vest shepherd. [Follow the Light style](../../../styles/follow-the-light/README.md).
Used in Shepherd Adventure's opening approach and gate welcome.

- [Isolated reference](reference.png) · [exact native ImageGen prompt](reference-prompt.txt)
- [Original textured model](source-pbr_model.glb) · [original rig](rig-model.glb)
- [Original animated export](animated-model.glb) · [runtime model](runtime.glb)
- [Front render](review-front.png) · [back render](review-back.png)
- [Idle sample](review-preset-idle-0.png) · [running sample](review-preset-run-2.png)
- [Settings, preparation and hashes](provenance.json)

Tripo image-to-model, biped rig and in-place `preset:idle` / `preset:run` clips.
Runtime preparation preserves geometry, skinning, textures and animation, sets
height to 1.66 metres, faces +Z, and corrects the running clip's constant
vertical offset. Each original export remains unchanged. Runtime is approximately
2.3 MiB, with about 19,000 triangles.

Technical review sampled both clips at 24 times each and rendered four poses per
clip plus front/back views. Ground contact, finite deformation bounds and playback
transitions pass. Wool and tunic deform with the skeleton; no cloth simulation.
The illustrated staff is omitted to keep hands free for running. Appearance is a
generated interpretation of the diorama character, not an exact reconstruction.

Generated with native ImageGen and Tripo; no third-party model was incorporated.
Provider terms apply to generated outputs. No separate third-party attribution
was supplied with the exports.
