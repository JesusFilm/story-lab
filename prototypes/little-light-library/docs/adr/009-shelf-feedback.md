# ADR009 — shelf feedback stays with the object

Status: candidate03 retained after independent review at tactile4.0 (previously3.6); static and targeted shelf validation pass.

Shelf buttons were spatially separated from their objects, and rapid figurine switching could leave an earlier figure tilted. The scene now provides the same localized object label and material highlight for canvas hover and DOM keyboard focus. Existing controls remain available. Pointer picking ignores invisible fallback geometry and transparent image texels.

Figurines rotate only their painted body around its foot pivot; the brass base stays fixed. Every frame restores all nonselected pivots, so interrupting one acknowledgment cannot strand it. Reduced motion keeps the label/material response with no tilt. No new artwork, translations or audio recordings are needed.

The label uses the existing story title or character name, measured after localization and clamped by its actual width and height. Room styling is cleared on entering a book. Candidate01’s assumed maximum half-width incorrectly displaced short phone labels; candidate02 fixes that measured layout. Long book titles still covered figures above the shelf, so candidate03 anchors book labels below their covers.

Validation covers actual canvas picking and transparent margins, keyboard activation, rapid taps and exact settling, fixed bases, Japanese labels, narrow-screen anchoring, reduced motion and reading-view cleanup. Matched desktop/phone input-response captures support independent review. These checks do not establish listening quality or perceived continuous motion.
