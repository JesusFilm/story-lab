# Adam's articulated hand presentation

Status: retained candidate02; runtime acceptance and regression follow-up in the round21 quality log.

## Intent

Adam's early garden pose used broad mesh deformation around both arms. At normal phone size, the sampled gesture states were barely distinguishable. Give his image-right forearm and palm a deliberate presentation while keeping his feet, cuff and lower body fixed. Keep the existing head turn and nod. This is expressive staging, not a new narrated event.

## Construction

Use the existing original Adam atlas, with no new raster asset. Its pose0 alpha crop is x184,y18,width301,height854 in the1774×887 source. A traced concave skin outline is triangulated, then partitions the original mesh into complementary body and forearm geometry. Tests check unit UV area and exactly-once interior coverage, because matching area alone can conceal overlapping or missing triangles.

The forearm rotates about source coordinate(440,335). Since this palm overlaps the robe in the painting, the original skin footprint receives a small stationary underpatch that samples only opaque olive cloth from x400–432,y440–470. The patch remains under the moving hand. It is a limited material repair, not an independently authored garment layer; visual review must reject visible skin duplication, holes, stretched cloth or disconnected anatomy.

The joint is active only for Adam atlas pose0 in welcome/warn, used by Eden01–03. The6.4-second cycle pauses through.8s, rises through1.8s, holds until3.2s, returns by4.8s, then rests. Candidate01's-.65rad maximum was visually ineffective on phone and was rejected. Retained candidate02 uses-1.15rad. The complete original mesh remains authoritative for reduced motion, folded-page capture and other poses/moods. Head deformation stays above the fixed cuff; feet and root never translate during acting.

## Validation and limits

Meaningful tests cover UV coverage, rigid hand dimensions, finite bounded transforms, fixed feet/cuff, head motion, reduced-motion restoration, hidden-mesh raycast rejection, and unchanged other poses/moods. Matched captures include40 acting states and4folded states at phone/desktop sizes, with sad and hope controls. Raw recordings contain frozen comparison states followed by10seconds at real time. Browser checks activate Adam by touch and keyboard in normal/reduced welcome, warning and sorrow scenes.

Still states can establish a distinct pose, silhouette and joint continuity; they cannot establish smoothness, natural rhythm or perceived latency. Broader acting and sound quality remain separate open work. See [the independent review](../quality-review-21.md) and [iteration log](../../review/README.md) for retention and scores.
