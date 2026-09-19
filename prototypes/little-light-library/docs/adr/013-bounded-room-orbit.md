# 013 — Let families inspect the room from a nearby viewpoint

Add a small, deliberate room-only orbit around the existing shelf focus. Horizontal dragging follows a grab convention, with a six-pixel intent threshold, horizontal dominance and a bounded ±0.12-radian yaw. The left/right controls choose the corresponding viewpoint; the center control restores the original view. These controls are keyboard accessible and localized in all nine locales.

The user explicitly suggested room camera movement. A fresh reference shelf drag did not establish free orbit, so this is an extension of the requested spatial interaction rather than a claim about reference implementation.

Keep camera distance and focus fixed. Preserve the established reading camera by resetting orbit on room/spread changes. Reduced motion snaps to the user-selected viewpoint; low-quality mode retains explicit orbit while optional passive drift can stop. No inertia or automatic orbit is added.

A small gesture state machine distinguishes tap, drag, vertical intent, cancellation and multiple pointers. Capture only after horizontal intent; preserve vertical touch gestures through `touch-action: pan-y`. Dragged/canceled releases cannot activate books or figurines, including a late release after entering a spread. Unpressed mouse movement restores hover after cancellation without losing late-release protection. Dispose all listeners with the scene.

Verify through unit gesture/geometry tests and real browser mouse, keyboard and CDP touch input. Check all three sizes, reduced motion, Japanese UI, grounded figurines, tap recovery, reset, and book entry. Matched room views establish visual containment; stills and event traces do not establish perceived drag smoothness or sound quality. Further yaw expansion would need another framing review.
