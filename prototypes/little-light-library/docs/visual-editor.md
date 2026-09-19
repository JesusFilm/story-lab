# Edit directly on the book

Choose **Author** in Little Light Library. The default workspace shows the live
paper book, its story text and page thumbnails. It uses the same `AuthoredStage`
geometry, textures, pose selection and placement rules as the reader.

1. Start a **New blank book** or choose **Open Jonah** to work with an illustrated
   example. Import an existing book with **Import JSON**.
2. Choose **Background**, **Character**, **Image** or **Ground**. Click a picture
   in the tray, or **Upload image** to use a PNG, JPEG or WebP from your computer.
   It appears on the book as soon as the artwork loads.
3. Click artwork on the book and drag it. Drag its corner handle to resize it.
   The inspector offers immediate size, position, depth, lift and rotation sliders.
   Arrow keys nudge the selected artwork; Shift makes the nudge larger. The
   layer list selects art that overlaps another element.
4. Type the title and story lines directly beneath the scene. **Add a line**
   creates another phrase. Existing narration becomes stale if its text changes.
5. **Add page** inserts a new scene after the current page. Use the page thumbnails
   to navigate. Select **Background & page** in the layer list to duplicate,
   reorder or delete a page. **Undo** and **Redo** recover visual edits, including
   artwork removal and page deletion.
6. Enable **Gentle rocking**, then **Try motion** to see movement on the book.
   **Read book** validates the draft and opens the selected page in the normal
   reader, with its narration and interactions where supplied. Return through
   **Author** to continue editing the same draft.
7. **Export portable JSON** saves the current draft and embeds its media. It no
   longer requires a separate preview step. Export before closing or refreshing
   the browser: editing and undo history are currently held in the session.

**Book details** opens the detailed controls for source references, adaptation
notes, narration, exact dimensions, poses and interactions. **On the book** brings
those changes back into the live scene. These controls and the advanced JSON tab
edit the same versioned document; there is no separate visual-editor format.

The editor deliberately uses a close, fixed camera and a plain working book so
placement is easy to judge. The reader adds its room, lighting and page-turning
presentation. Geometry and authored coordinates remain identical. Page thumbnails
show background art; the cover thumbnail shows the selected cover image.

## Verification

The authoring browser suite includes a dedicated composition flow: start from a
blank book, add a background, character, image and ground, drag and resize artwork,
adjust a slider, undo/redo, create and switch pages, export the current draft, and
compare the reader's resulting positions and rotation. It also checks that reading
starts on the selected page and that the editor fits a narrow viewport.

A geometry test compares repeated live placement edits against a freshly loaded
reader stage for both bottom and center anchors, including size, lift and rotation.
It verifies that gestures do not reload image assets or accumulate scaling.

The existing authored-book checks retain invalid-definition/media rejection,
transactional reader recovery, narration timing, portable reimport and the legacy
books' nine locales. See `review/latest/authoring-results.json` for the latest
executed results rather than treating this description as a passing test result.

## Remaining boundaries

The live workspace edits the current paper-stage contract. It does not add a
recording studio, narration generation, image cropping, arbitrary animation rigs,
multi-locale editing or automatic publication. Touch and pointer use the same
gesture handlers; sliders and layer buttons also provide precise alternatives.
