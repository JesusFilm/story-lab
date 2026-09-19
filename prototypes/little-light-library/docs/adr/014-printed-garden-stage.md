# Printed garden stage

Status: implemented; final visual and runtime acceptance recorded in the round20 review.

## Problem and decision

Eden's actors and tree stood on broad cream paper in front of a lush backcloth. Their shadows established contact, but the empty horizontal plane weakened the connection between characters and setting. Add an original painted garden floor to Eden01–05, using the same quiet gouache palette as the upright scenery. Exile and Noah scenes retain their existing staging.

Use two page-local planes with one shared texture and continuous full-image UV coordinates. Preserve a central gutter, cream outer margins, page thickness, ribbon and trim. The image has genuine alpha, with a quiet earth/grass center and irregular botanical edges. It is printed scenery, not an additional hinged actor or a replacement for character animation.

The floor lies at local z=.045: above the top paper surface at .039, below trim/ribbon and popup hinges at .075. Candidate01 used .02 and was invisible beneath the page; it was rejected. Static page surfaces are excluded from the popup depth offsets used by folded-print capture. This keeps the ground below folded actors while preserving the existing common spread projection.

## Loading and ownership

Load the 282,556byte WebP only when entering a garden spread. Await it before declaring that spread complete or capturing its print. Missing art falls back to the existing blank paper; story meaning and controls remain available. Generation checks dispose canceled late arrivals. Both panels share one caller-owned map, registered once in pageMaps; their geometries and distinct materials follow stage disposal. The renderer's existing bounded lifecycle keeps a closed stage hidden until replacement, rather than changing that behavior in this pass. Reduced motion uses the same static surface and existing retained-stage logic.

## Evidence and limits

Geometry tests check continuous UV projection, paper margins/gutter and borrowed-texture ownership. A regression test first failed because folded-print capture lifted the floor; the exclusion now passes. Browser checks exercise lazy loading, 404 fallback, held completion, supersession by another book, page navigation and reduced motion. Matched captures cover all16 spreads at three sizes; folding captures cover40 intermediate poses.

The [source and exact prompt](../../../../assets/textures/little-light-garden-floor/README.md) document built-in ImageGen provenance. This is invented scenic staging, not a scriptural or historical claim. Still images establish composition and layering; they do not establish continuous motion, sound or reference parity. See [the independent review](../quality-review-20.md) and [quality log](../../review/README.md) for the final retain/reject decision.
