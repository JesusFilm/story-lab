# Prototype instructions

## Shepherd Adventure: standing art direction

For `shepherd-adventure/`, the entire prototype uses **Follow the Light AA**,
style ID `follow-the-light-aa`, revision **v003**. The style specification is
[Follow the Light AA v003](../styles/follow-the-light/README.md).

Jaco explicitly selected this style for the entire prototype on 11 September 2026.
This is standing authorization for its characters, props (including new lanterns),
structures, terrain, reference generation, replacement models and scene presentation.
Apply its natural proportions, tactile materials, readable silhouettes, cool blue
night lighting and warm amber local lights consistently across the experience.

Do not ask Jaco to choose or reconfirm this style for each asset or subsequent
iteration. This prototype-wide instruction expands the style selection beyond the
historical asset scope listed in v003; preserve that immutable document and record
this authorization in new asset provenance where needed. If a workflow requires
an explicitly selected style, this instruction supplies that selection. Ask about
a different style only when the user requests a change or gives conflicting direction.

Style selection does not constitute approval of a particular generated reference
or model, authorize unrelated paid jobs, or waive exact-output review requirements.
Keep references and provenance in the asset library and copy runtime models into
this prototype so it remains independently runnable.

This rule applies to Shepherd Adventure. Other prototypes retain their own art direction.

## Tripo runner configuration

For this workspace's Tripo asset work, Jaco identified the repository-root `.env`
as the credential file. Pass its absolute path with the asset-pipeline CLI's
`--env` option; do not assume `~/.config/watch-game/.env` has the key. Never print,
copy into a prototype, or publish the credential file.
