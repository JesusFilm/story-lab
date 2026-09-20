# Edit directly on the book

Choose **Author** to open **My books**, the editor's home page. Each book has
**Edit book** and **Delete** actions. Deleted books move to **Recently deleted**,
where **Restore book** brings them back, including after a browser refresh.

1. Choose **New book**, enter a title, and choose **Create book**. You start on one
   blank page with no suggested story or artwork. **Import book** adds an existing
   JSON book as a separate library entry. Quiet Garden and Jonah are included as
   editable examples; their pictures are only offered when editing those books.
2. Choose **Background**, **Character**, **Image** or **Ground**. The tray shows
   only this book's artwork. **Upload image** adds a PNG, JPEG or WebP from your
   computer. It appears on the book as soon as the artwork loads.
3. Click artwork and drag it. Drag its corner handle to resize it. The inspector
   offers size, position, depth, lift and rotation sliders. Arrow keys nudge the
   selected artwork; Shift makes the nudge larger. Clicking overlapping artwork
   opens an on-canvas chooser; **Alt-click** cycles through the images at that point.
   A selected rear image stays selected when you drag, and its green name handle
   gives you a separate grab point. The layer list remains another way to select.
   Height can reach **3.60 units**; the front/back control reaches the page's front
   edge at **−1.575**.
4. Select **Ground artwork** in the layer list (or click the ground) to adjust
   proportional scale, width, depth, position, rotation and opacity. **Page guides**
   shows the available **6.10 × 3.15** paper area and **5.80 × 2.70** upright backdrop.
   Ground rotation or offsets can extend beyond the paper; guides are editing aids,
   not clipping masks. The backdrop fills its fixed rectangle.
5. For art with several side-by-side poses, open **Picture / pose frames**.
   **Frames across** configures the sheet; **Selected frame index** or a picture
   button picks the pose. Indexes start at zero. Thumbnails show the selected pose.
   Adam and Eve's three images are alternative still poses, not a timed animation:
   there is no frame-speed setting. **Gentle rocking** moves the selected whole card.
6. Fill in the page title and story lines beneath the scene. Text fields grow as you
   type and shrink when text is removed; no line has its own scrollbars or resize
   handle. The composition pane scrolls as a whole when needed. **Add a line** creates
   another phrase. Existing narration becomes stale if its text changes.
7. **Add page** inserts a new scene after the current page. **Previous page**,
   **Next page** and the thumbnails navigate the book. Select **Background & page**
   to duplicate, reorder or delete a page. **Undo** and **Redo** recover visual edits.
8. Choose **Preview page** to review the scene, motion, text and interactions without
   editing controls. Previous/Next stay in preview mode; **Back to editing** makes
   the current page editable again. **Read book** validates the draft and opens the
   selected page in the full reader, including supplied narration. Return through
   **Author → Edit book** to continue.
9. **My books** saves and returns to the book list. Edits and uploaded media save
   automatically in this browser on this device; check the save status in the
   toolbar. **Export portable JSON** embeds the current draft's media for backup
   or transfer. Browser storage is local, not an account or cloud backup. Clearing
   site data removes saved books; undo history remains session-only.

The live paper workspace uses the same `AuthoredStage` geometry, textures, pose
selection and placement rules as the reader.

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
compare the reader's resulting positions and rotation. A library check covers neutral
new books, unique identities, artwork isolation, sequential page previews, refresh
persistence, recoverable deletion and the phone book-list layout. It also checks that reading
starts on the selected page and that the editor fits a narrow viewport.

A geometry test compares repeated live placement edits against a freshly loaded
reader stage for both bottom and center anchors, including size, lift and rotation.
It verifies that gestures do not reload image assets or accumulate scaling.

The existing authored-book checks retain invalid-definition/media rejection,
transactional reader recovery, narration timing, portable reimport and the legacy
books' nine locales. See `review/latest/authoring-results.json` for the latest
executed results rather than treating this description as a passing test result.
The editor-controls check additionally exercises overlap choosing/cycling and rear-art
movement, expanded limits, ground rotation in the reader, pose selection, portable
export parity and growing non-overlapping text at three viewport widths.

## Remaining boundaries

The live workspace edits the current paper-stage contract. It does not add a
recording studio, narration generation, image cropping, arbitrary animation rigs,
multi-locale editing or automatic publication. Touch and pointer use the same
gesture handlers; sliders and layer buttons also provide precise alternatives.
