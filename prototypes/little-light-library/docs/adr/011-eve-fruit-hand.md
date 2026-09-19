# 011 — A rigid fruit-hand gesture for Eve

Eden03’s painted fruit pose is recognizable, but the generic mesh sway does not express a distinct action. Reuse the existing triangle-clipping articulation used for Noah’s hammer to separate the exposed forearm and fruit from Eve’s middle atlas pose. Select it through explicit pose metadata, character and mood, rather than guessing from texture coordinates.

The forearm rotates outward at the elbow, holds and returns over a 6.4-second cycle. This is invented visual staging of contemplation; it is not synchronized to a particular narrated sentence and does not depict repeated eating. Keep the cuff/body stationary to protect the joint, preserve the original painted hand and fruit without stretching, and share material feedback for touch. The tradeoff is that this pose loses the generic head/breathing deformation while the dedicated action is active.

The complete original mesh is restored during folding and reduced motion. Other Eve poses/moods and Noah’s existing action retain their behavior. No new images or narration assets are required. Partition bounds are authored against the current cropped atlas; replacing that artwork requires reviewing these bounds.

Meaningful tests cover complementary UV coverage, rigid geometry, planted body/root, return to rest, reduced-motion restoration, pose/mood gating, hidden-mesh raycasting and caller-owned texture lifetime. Matched desktop/phone acting and folded captures, independent visual review and assembled normal/reduced activation checks determine retention; passing geometry tests alone does not establish a natural joint or perceived motion quality.
