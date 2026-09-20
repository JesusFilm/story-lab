# Books and toys in the room

The room shelf holds **six books**. The full creator collection remains in **Author → My books**.
Choose **Add to room** on a saved book to put it on the physical shelf. Imported portable
JSON books use the same action. **Remove from room** frees a place without deleting the
book. The built-in Eden and Noah books can also be removed and restored. A bookend fills
out an underfilled shelf. Shelf membership saves on this device; it is separate from
exported book content and survives browser refresh.

Click or keyboard-focus a physical cover. It slides clear of the shelf, then turns toward
you. **Read** moves it onto the table and opens it. **Return** (or Escape) puts it back.
The previous room heading, look-around buttons, book cards and character-name buttons
have been removed. Direct pointer orbit remains available.

While reading, **Library** brings the room back into view with the current book still on
the table. Its raised paper scenery is hidden so it cannot cover the shelf. **Continue reading** returns to the same page and paused narration position.
You can inspect another cover without disturbing that book. Choosing Read performs this
sequence:

1. Stop narration and toy audio, and move the old toys away.
2. Fold the current scene, close the book and return it to its shelf position.
3. Move the chosen closed book onto the table, then unfold its reading scene.
4. Bring that book's toys onto the lower shelf.

Only one copy of a book is visible. Its shelf space stays reserved while it is being
previewed or read. Inputs are locked while books move, so rapid taps cannot start
competing transfers. Reduced motion performs the same state changes without travel.
A previewed cover's Return leaves the table book and its toys unchanged. Changing a
book's room membership takes effect when the author editor closes; removing the table
book closes it before removing its shelf slot.

## Authoring toys

Open a book, choose **Book details**, then the **Book details** tab and **Shelf toys**.
Add up to four toys. Each has a short label, artwork from this book, one click animation
(Rock, Float, Sway, Pulse or Spin) and an optional audio asset. Pose-sheet controls select
one horizontal atlas frame. Import additional artwork or audio through **Assets**.
Click animations play for 1.4 seconds and return to rest; another click restarts them.
Sound effects obey the reader's mute and volume settings and stop when changing books,
opening the editor or hiding the tab.

Choose **Read book**, then **Library** to try the toys in the room. Toys appear only for
the current table book; inspecting a different cover does not replace them. The original
Eden and Noah books have compatibility toy definitions; authored books without `toys`
show none. Toys are painted standees on small physical bases, using the supplied art;
the editor does not infer a sculpted 3D model or a rig from the image.

The optional `toys` array is part of the shared v1 format, so portable exports preserve
labels, art, poses, animation and sound. Authored toy labels currently use the source
language in every reading language. Toy art/audio cannot be removed while referenced.
Toy changes also invalidate review fingerprints, including changes to their media.

## Implementation and checks

`room-library.ts` stores ordered stable saved-book keys (not authored IDs) in IndexedDB,
which allows two imported copies with the same book ID. `room-shelf.ts` owns physical
book slots and transfer poses. `scene.ts` manages table folding and toys. `main.ts`
serializes the room workflow. `room-toys.ts` adapts authored toys and compatibility data;
`shelf-toy-audio.ts` isolates effect playback from narration.

Run `npm run check:fast`, `npm run build`, then `npm run test:room` for current room
acceptance. `review/latest/room-results.json` records executed browser checks. Older
historical room reviews targeting the removed footer controls are not current acceptance
for this new flow. No publishing, accounts or remote storage are introduced.
