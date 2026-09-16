# Shared game UI — working contract

17 September 2026 · D021–D023 · accepted UI baseline.

Scene modules supply text, speaker, actions and enabled state. `village-game.mjs`
selects a semantic `data-ui-panel` variant; `player.css` owns shared placement,
surface, spacing and button treatment. Do not add coordinates per house or beat.

| Component | Placement and content | Behavior |
| --- | --- | --- |
| Exploration prompt | Upper-middle (top at 32% viewport height), centered dark panel; short primary action, optional necessary clue | Action advances the scene. Panel hidden during route travel. Action-only prompts retain their panel, padding and border. |
| House approach/status | Top-center below the menu, lowered by half its own height from the D021 position; same dark panel/button | Current knock/wait/response text and timed progression preserved. Shared by all five houses. Disabled actions remain hidden. |
| Preparation card | Centered linen panel, item illustration/title and one primary action | Forward-only lamp sequence; pause resumes the same step; explicit final collection. |
| Spoken exchange | Upper reading zone with speaker/text/action | Existing companion sequence unchanged. |
| Illustrated house conversation | Existing large illustrated overlay and forward-only meaningful action | Content, pacing and image handoff remain pending user review. Uses the same primary button treatment, not an individual coordinate per page. |
| Scripture | Existing illustration and linen verse panel; small address below text | Title before Start; scripture wording preserved; backward navigation remains pending. |

Use one 48px-minimum primary button style, a continuous rounded 1px border and
visible keyboard focus. Panel padding must separate buttons/focus rings from the
panel's overflow clip. The prior bare-button wrapper had a larger rounded clipping
boundary flush with the button, which cut off its corner border.

Player overlays now use the full-height world viewport on narrow screens too;
only rehearsal keeps its historical bottom-panel camera reservation. Short-screen
panels have a bounded scroll area. The header and Pause control remain reachable.

These positions are shared screen-space zones, not actor-tracked speech bubbles.
They require playtesting across the route and aspect ratios; a future overlap
problem should refine the component/camera contract rather than introduce a
coordinate exception for one scene.

D022: hide gameplay branding; a 44px hamburger opens the existing pause/options
dialog (Continue, Start again, Reduced motion). Lower exploration and house/spoken
panels by half their own height relative to D021; preparation stays centered.
Opening story title remains. Accepted in D023; house dialogue/sequence review remains open.
