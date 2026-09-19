# ADR 017 — local acting for the serpent and dove

Status: accepted after candidate 02 independent review and full scene acceptance.

Eden03’s serpent and Noah05’s dove carry important story actions, yet were static cutouts without interaction. Fresh reference play showed an independently tappable animal with local feedback. Round23 tests distinct local gestures and accessible activation for these two existing illustrations.

Use the original texture and a continuous segmented paper mesh. Recover source-pixel coordinates from each texture’s crop offset/repeat so authored anatomical masks remain aligned with the image. The serpent’s head and upper neck lean toward Eve while its support branch, leaves and lower coils remain fixed. The dove’s two wings move around shoulder regions while its body, head, olive sprig and tail remain fixed. Neither mesh translates from its authored support.

The serpent uses a 6.4-second rest/lean/hold/return cycle. The dove uses two wingbeats within a 3.2-second cycle and then pauses. Touch adds a local gesture even during idle portions; hover and activation add modest material warmth. These timings are implementation facts, not a perceived-motion quality judgment.

Actual painted-pixel raycasts and keyboard buttons activate the creatures. Each target has at least 44px height and a localized name in all nine existing locales. Activation uses the existing shared touch sound; no narration or name recordings were added. Reduced motion restores original geometry and provides static warmth/name feedback. Folding restores original geometry and neutral material to preserve the folded print. Buttons disappear during folding/loading and are removed on page or room change. Page-root traversal owns geometry/material disposal; textures remain in the existing page-map ownership path.

Acceptance requires readable local gestures without bent supports, torn or duplicated silhouettes, displaced anatomy, cropped neighbours or altered story meaning. Compare the fixed-time, folded and reduced views in the round 23 evidence, plus actual touch/keyboard/localization checks. Review supplemental maximum dove poses because ordinary samples can miss the beat peaks. Geometry assertions and stills cannot establish perceived movement or audio quality.

Candidate 01’s 0.24-radian dove peak was too subtle on a phone and was rejected. Candidate 02 uses a 0.4-radian idle peak with a further bounded 0.13-radian touch response. Matched stills, maximum-pose anatomy checks and final interaction tests pass. Do not infer continuous-motion or listening acceptance from these checks.
