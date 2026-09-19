# ADR010 — quiet material detail around the illustrated book

Status: candidate02 retained after independent round16 review; room atmosphere3.7→4.0. Final scene acceptance passes.

The room’s large flat walls, blue window panes and hard quilt squares looked schematic beside the painted story art. A small original botanical wallpaper texture now gives the upper walls material character. Its world-scale UV mapping uses the same2.6-unit tile density and actual interior corner origins on adjoining walls. The prototype owns the WebP; source and exact built-in ImageGen prompt are retained in the asset library.

The wallpaper is optional decoration. A woven procedural wall remains visible and usable until the asynchronous texture succeeds, and remains if it fails. Texture ownership includes fallback replacement, disposal and late arrival after scene disposal. No story interaction waits for the image.

Window scenery is a restrained procedural cool gradient with softened distant trees. Existing quilt colors gain a woven/stitch texture and bounded top-surface puff, with perimeter fixed. Curtains use folded linen surfaces within their existing bounds. Furniture positions, book stage, camera and light setup are unchanged so visual comparisons isolate material improvements.

Validation includes15 matched settled captures across phone/tablet/desktop, exact runtime geometry tests for quilt center/edges and corner UV registration, and browser checks with successful, missing and held wallpaper requests. Perceived motion and sound are outside this evidence. The visual review decides whether the wallpaper adds atmosphere or competes with reading.
