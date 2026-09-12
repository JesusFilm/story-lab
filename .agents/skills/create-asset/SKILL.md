---
name: create-asset
description: Create a Story Lab 3D asset from a short subject such as market stall. Ask where it will be used, apply the visual style, generate a reference image and Pixal3D or Tripo model, add both to the asset library, and optionally integrate into a named prototype. Use for new or replacement 3D assets in Story Lab, not unrelated images or gameplay changes.
---

# Create a Story Lab asset

Turn the named subject into a reusable, reviewed 3D asset. The user should not
need to explain the style → reference image → model → library process again.
Resolve Story Lab from this skill's repository, even when invoked inside a prototype.
Read [project instructions](../../../AGENTS.md) and [asset conventions](../../../assets/README.md).

## First ask where it will be used

If the request does not already specify both the destination and intended use,
ask one concise question before generating:

> Where should I use the market stall? Tell me the prototype and what to add or
> replace, or say “library only” to save it without using it yet.

Substitute the actual subject. Use the current task and
[prototype index](../../../prototypes/README.md) to suggest relevant destinations;
include “Library only — don't use it yet.” Keep a free-text route for placement,
replacement, scale, interaction or animation instructions. If the user names a
prototype but leaves the role unclear, ask only about that missing role.
If they already say “replace the market stall in Shepherd Adventure” or “library
only,” accept that answer without reconfirmation.

Wait for the answer before generation or prototype edits. While waiting, inspect
existing assets, style references and relevant prototype files. “Library only”
means create and catalogue the asset, with no prototype code or asset-copy changes.
Do not interpret the current working directory alone as permission to integrate.

## Resolve style and the asset brief

Read the chosen prototype's instructions, README and current placement/model code.
Carry forward its standing style choice. Shepherd Adventure uses
[Follow the Light](../../../styles/follow-the-light/README.md); do not ask the user
to select that style again. For library-only work, use Follow the Light unless the
user requests another style. Other prototypes' explicit art direction takes precedence.
Inspect the guide's actual reference images rather than relying only on its text.

Inspect any matching library asset before creating a descriptive sibling variant.
Reuse existing source/reference material when it fits the request, but do not
substitute an old model when the user explicitly wants a new one.
Summarize the practical brief: subject, materials, silhouette, dimensions, separate
parts and any required animation. Infer ordinary details from the destination;
ask only about a material ambiguity. Keep modular joins, traversable openings and
interactive parts compatible with the prototype. Do not promise image reconstruction
will enforce exact dimensions or produce working hinges or rigs.

## Generate the reference and model

Use native ImageGen (and its available imagegen skill) for one isolated reference.
Follow the style guide's reference-presentation rules: neutral lighting and clear
base colors; one complete subject with unclipped margins; no scene dressing or
multiple views on one input. Save the actual image and exact final prompt under
`assets/<category>/<asset>/` using descriptive filenames. Inspect the image for
silhouette, openings, pose and style before passing that exact file to model generation.
An existing suitable reference may be reused if the request allows it.

Honor an explicitly named generator. Otherwise use **Pixal3D** for a static model;
“Pixel3D” in a request means Pixal3D. Use Tripo when requested, or discuss it when
required rigging/animation cannot be supplied by the static Pixal3D path. Do not
silently switch to a paid provider when the server is unavailable.

- **Pixal3D:** Read [the maintained client workflow](../../../projects/pixal3d-assets/README.md).
  Use its `generate.py` with a new output filename and the selected reference.
  Discover the existing SSH address from local operator context instead of asking
  the user to repeat known access details. The current service uses SSH; no LiteLLM
  token or `.env` read is needed. Resume an existing job after interruption rather
  than resubmitting it.
- **Tripo:** Discover an available supported client/connector and read its current
  help or official API documentation before choosing settings. The old
  `projects/asset-pipeline/cli.mjs` is absent in this checkout; do not assume legacy
  Watch Game commands or approval databases exist. Use the repository-root `.env`
  as the credential source only through the client's credential loader; never
  inspect, print or include its contents in model context. Respect any explicit
  write-only restriction; if it prevents loading a credential, use an already
  configured credential source or surface the blocker. Honor the user's selected
  stage/budget and any actual reference-review requirement of the chosen runner.
  A named Tripo generation request authorizes that work; don't ask to authorize it
  again. Otherwise establish paid-provider scope before submission. Record recovery
  state outside the repository, resume by the actual job ID, and never buy credits
  or run extra paid candidates without authorization.

Once destination and provider scope are settled, carry the work through without
per-step confirmations. Show actual outputs when a user decision is needed; never
record the agent's technical review as the user's approval. Stop on a quality or
compatibility failure that would make the requested use unsuitable, or an unresolved
submission. Keep useful completed work and report the specific remaining decision.

## Prepare, render and catalogue

Preserve the original downloaded model. Prepare a separate runtime derivative
with suitable scale, pivot, triangle/texture budget and materials. For opaque,
nonmetallic static props, use the existing Pixal3D `prepare.py` procedure; it welds,
simplifies, unwraps and bakes source appearance. Choose dimensions and orientation
for this asset, not the oil jar example. Rigged, emissive, transparent or metallic
assets need appropriate preparation that preserves those properties.

Inspect simple headless model renders from useful angles and check geometry, UVs,
textures and dimensions. Verify animations when required; a still cannot establish
motion quality. Use file checks and renders, not computer use or browser automation,
unless the user explicitly requests browser verification. Repair clear problems
locally where practical; retain source files and disclose remaining limitations.

Every completed asset gets a library folder containing the reference image, exact
prompt, original model, useful runtime derivative, review renders and a short README
linking to the current style guide. Keep concise generator/settings/hash provenance
and required licenses. Exclude provider job IDs, server addresses, credentials,
credit balances, approval conversations and temporary paths from library records.
Add a discoverable library link and the local portal gallery entry when applicable,
using the explicit model/prompt/reference fields in
[publication.json](../../../projects/portal/publication.json). This also applies to
library-only assets: the gallery can point directly at a library model.

## Integrate only where requested

For a selected prototype, copy runtime files and necessary attribution into that
prototype's own `assets/`. Implement the specified placement or replacement, keeping
loading/error handling, routes, interactions and animation behavior functional.
Update its source records and README. Library files must not become live runtime
dependencies. Update the portal's reviewed file list/hashes for changed published
inputs and any new dependencies, then run the relevant checks and portal validation.

For library-only work, leave every prototype untouched. Updating the asset catalogue
or building the local portal does not authorize deployment. Do not infer a commit,
merge or publish request from asset creation.

Deliver links to the reference, model and useful render, plus a brief account of
where it was added (or “library only”), validation and any remaining limitations.
