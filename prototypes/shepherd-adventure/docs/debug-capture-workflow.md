# Scene inspector and annotated captures

## Request and reason — 12 September 2026

Repeatedly playing the journey to investigate a particular area, especially the
Nativity, makes visual iteration slow. The requested tool gives direct access to
any scene, a highly maneuverable WASD/mouse camera, and a way to freeze, mark up,
and save an image so improvement requests can point to exact visual problems.
This document records the request, implementation and verification.

## Delivered behavior

Open the local prototype with `?debug` appended to its URL. This skips the opening
and the journey and frames the Nativity immediately. The scene uses the game's
actual models and lighting. The game simulation stays frozen while inspecting;
this is an environment review, not a staged completion of the story.

- WASD flies forward/backward and sideways; Space moves up and Left Shift moves down.
- Hold the right mouse button and drag to look in any direction. Pitch is limited
  just short of vertical to avoid flipping; there are no camera collision limits.
- Hold Ctrl for four times the speed. The wheel or speed slider sets 1–60 m/s.
- Scene shortcuts: Nativity, Animal pen, Village, Overview and Start.
- Freeze & annotate locks the frame. Choose Pen, Arrow, Line, Rectangle or Ellipse,
  any pen color, and one of three widths. Undo removes the last mark; Clear removes
  all marks. Resume camera returns to free flight and the next freeze starts fresh.
- Capture saves the frozen scene and its annotations as a PNG, without the toolbar.
  Capture from flight freezes first. A status message confirms the relative path
  or explains any save failure. Return to game reloads the normal opening.

Run `python3 serve.py --port 8876` from this prototype, then open
`http://127.0.0.1:8876/?debug`. Local images are written into `captures/` with UTC
timestamps and unique suffixes. The directory is ignored by Git and excluded from
the portal export. Keep or attach the images you need; they are not automatically
published. Static hosted previews download the PNG through the browser instead,
because they cannot write into the local checkout.

The loopback server accepts same-origin PNG uploads only at a fixed capture
endpoint, caps each request at 32 MiB, and chooses the destination filename itself.
It does not accept a client filesystem path or overwrite previous captures.

## Verification

`checks/verify-debug-capture.mjs` exercises the real browser and local server:
scene shortcuts, WASD flight, mouse look, elevation, frozen camera position,
colored drawing, every shape, undo, PNG encoding, and local save. It reads the
saved file and compares its bytes against the annotation canvas, then removes
that test capture. It also checks foreign-origin uploads are refused and that no
browser errors occurred. The captured UI was visually reviewed at 1280 × 800.

Normal arrival/outro browser regression checks passed, including pause, restart,
portrait and reduced motion. Journey state and Nativity geometry checks passed.
The portal built and verified 240 files across all three supported base paths. The public export includes the inspector module, but never captures or
the local write endpoint. The Nativity work was committed separately as
`39b58d2`; this inspector is developed on `codex/shepherd-debug-capture`.

## Control revision — 12 September 2026

Requested Space/Left Shift in place of Q/E. Space now rises and Left Shift
descends; the speed boost moves to Ctrl to avoid conflicting with descent.
