# Gate wall and urgent movement trial

The gate wing now joins the gate-side front corner of Empty stall 1 instead of continuing diagonally through its interior. The attachment is defined in the actual stall transform, and the same wall geometry supplies occlusion and the rehearsal map. The original experience keeps its existing wall layout.

Movement now starts into a run, accelerates toward 4.6 m/s, and changes to walking for the last three metres of each leg. Walking targets 2 m/s and eases down near the stopping point. After entering the final sheep enclosure (z < -42), walking continues to the shelter. Existing normalized 0.16-second animation blending is reused; no new animation assets or instant model swaps are introduced.

Recommendation: retain running for travel and the short walking arrival. Browser pose samples on the House 1 replay show the running and walking states without an obvious broken pose. The synthetic animation-transition regression checks normalized blending and bind-pose leakage; it does not prove subjective smoothness or foot planting. The user's normal-speed review remains the acceptance step. Running makes the existing unattached carried-lantern placement more conspicuous; hand attachment is still separate scene/character work.

Checks: all ten legs run then walk without switching back, running changes physical speed, route clearance and portrait/landscape camera samples pass, and gate-wing samples do not cross the stall's central interior. The branch remains local and unpublished.

Review: replay point 02 for departure and house arrival; point 08 for stall construction; point 10 for the sustained quiet approach. Judge the short gait change in motion. If it reads as a distracting hitch, prefer running to stops and retain only the final deliberate slowdown.
