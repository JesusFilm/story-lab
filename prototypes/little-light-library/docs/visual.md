# Visual production and checks

The 16 original spread paintings, two transparent foreground cutouts, and three transparent character illustrations were generated with the built-in ImageGen tool. The runtime WebP files are under `public/assets/art/`; exact original PNG outputs are preserved under `../../../assets/references/little-light-library/`. The [current style guide](../../../styles/little-light-library/README.md) governs the set. All covers remain live localized canvas text.

Each backdrop depicts the named narrative moment. The browser maps the same page ID to `assets/art/<page-id>.webp`, so missing art is detected by the manifest validator. The original large painting spans both leaves of a physical 3D book. A separate image with an alpha channel sits forward from the page to create actual paper-theater depth. Simple Three.js geometry builds the bedroom, book, shelf and figurines. The scene preserves a low pixel ratio and caps anisotropy for low-spec devices.

## Exact ImageGen prompts

For `eden-01`, the complete prompt was:

> Use case: illustration-story. Asset type: Little Light Library, Eden spread 1, original painted backdrop for a dimensional open book. A lush ancient garden at dawn, four gentle rivers winding through terraces of fig trees, pomegranates, broad leaves and flowers; warm gold light through jade foliage, sandstone hills far away. Empty foreground clearing for separate cutout figures. Rich gouache and watercolor on textured paper, expressive hand-painted shapes, sophisticated children's picture book for ages 4–8. Landscape wide composition with complete scene and no border. No human figures, no text, no letters, no watermarks, no UI, no book mockup. Treat biblical setting with dignity.

For `eden-02` through `eden-07`, the exact prompt was the following prefix followed immediately by the suffix in the table (including the space after the prefix):

> Use case: illustration-story. Original landscape painting for Little Light Library, a serious but accessible Bible picture book for ages 4–8. Consistent rich gouache and watercolor on textured paper, sculpted foliage and fabric shapes, warm natural color, Middle Eastern people with expressive restrained faces and historically plausible simple linen. Wide composition, painterly edges, clear dramatic silhouette, no border. No text, letters, logos, watermarks, UI or book mockup. No gore.

| Asset | Exact suffix |
|---|---|
| eden-02 | In Eden at morning, Adam and Eve together beneath lush garden trees, wearing modest simple woven garments; the great central tree distinct in the distance, with an atmosphere of trust and wonder. |
| eden-03 | The serpent coiled along the branch of a laden fruit tree speaking to Eve, Adam close by, their expressions troubled and thoughtful as they face a real choice; Eden light becomes subtly uncertain, not comic or cute. |
| eden-04 | Adam and Eve after disobeying, hiding among broad leaves in a dimming garden; their faces show shame and fear, garments modest, warm light visible far behind them, visual tone compassionate and serious. |
| eden-05 | God addresses Adam and Eve among the garden trees after their disobedience; show only a shaft of solemn light and their sorrowful posture, no human depiction of God. The serpent retreats into shadow; the moment holds consequences and grief. |
| eden-06 | Adam and Eve leaving the lush garden through a distant stone-and-foliage entrance, two small figures in woven garments walking into a stony landscape; one angelic guardian silhouette at the garden threshold with radiant light, restrained and solemn. |
| eden-07 | Life outside Eden: Adam and Eve working the difficult dry ground together, with small cultivated plants and a modest shelter, expressions weary yet enduring; the garden appears far on the horizon. |

For `eden-08`, `noah-01`, `noah-02`, and `noah-06` through `noah-08`, the exact prefix was:

> Use case: illustration-story. Original landscape painting for Little Light Library, a serious but accessible Bible picture book for ages 4–8. Consistent rich gouache and watercolor on textured paper, warm natural colors and dramatic clear silhouettes. Middle Eastern people with expressive restrained faces and historically plausible simple linen. Wide composition, painterly edges, no border. No text, letters, logos, watermarks, UI or book mockup. No gore.

| Asset | Exact suffix |
|---|---|
| eden-08 | Adam and Eve standing together at dusk beyond Eden, their faces carrying sorrow and a small measure of hope; a narrow warm shaft of light on the path ahead, the lost garden distant behind them. No depiction of God. |
| noah-01 | Ancient settlement in a broad landscape under a troubled sky; people turning against one another in distant silhouettes, Noah and family apart in a modest home, solemn atmosphere of a world grown violent without depicting injury. |
| noah-02 | A truly enormous timber ark under construction on dry land, towering over small human figures and trees; Noah and family working at beams and ramps, villagers far away, expansive wide composition conveying massive scale. |
| noah-06 | The immense ark rests on new dry ground; Noah, family, and animals step out onto a changed quiet landscape with receded waters and driftwood, their faces serious with gratitude and memory of great loss. |
| noah-07 | Noah and his family beside a simple stone altar on restored earth as a broad rainbow begins across clearing clouds; respectful, quiet scene of God's covenant, no depiction of God. |
| noah-08 | A vast radiant rainbow spanning an open landscape with families and animals small beneath it, huge ark still visible on distant grounded hillside; hopeful but reflective aftermath, clear sign of remembrance. |

For `noah-03` through `noah-05`, the exact prefix was:

> Use case: illustration-story. Original landscape painting for Little Light Library, a serious but accessible Bible picture book for ages 4–8. Consistent rich gouache and watercolor on textured paper, warm natural colors and dramatic clear silhouettes. Middle Eastern people with expressive restrained faces and historically plausible simple linen. Wide composition, painterly edges, no border. No text, letters, logos, watermarks, UI or book mockup. No gore. The ark is enormous, sturdy, and true to scale, never a tiny toy boat.

| Asset | Exact suffix |
|---|---|
| noah-03 | Animals in pairs enter a colossal timber ark via a wide raised ramp while Noah and family look back at dark clouds gathering; elephants, antelope, birds in dignified painted forms, clear scale and urgency. |
| noah-04 | The great flood at its most dangerous: enormous dark waves under storm clouds, a massive ark riding the water with its high hull dwarfing nearby trees; on a distant ridge tiny people are overwhelmed by rising water, conveyed solemnly and without graphic detail. The loss outside the ark must be unmistakable. |
| noah-05 | After long days on a vast receding flood, a dove returning with a small fresh leaf toward the ark window; mountain tops emerging from gray water, gentle first light and cautious hope. |

The transparent cutout prompts were:

- `eden-tree`: Use case: illustration-story. Asset type: transparent paper-theater foreground cutout for Little Light Library Eden book. One complete lush fig tree with twisting trunk, layered jade leaves, a few figs, visible roots, painted in rich gouache and watercolor on textured paper, warm daylight, expressive silhouette. Full object with generous unclipped margins. Actual transparent background and clean alpha edges. No ground rectangle, no text, no border, no people, no watermark.
- `noah-wave`: Use case: illustration-story. Asset type: transparent paper-theater foreground cutout for Little Light Library Noah flood book. One wide cresting slate-blue storm wave with foamy ivory edge and deep painterly shadows, restrained yet frightening, rich gouache and watercolor on textured paper. Full object with generous unclipped margins. Actual transparent background and clean alpha edges. No boat, no people, no text, no border, no watermark.

## 3D asset preparation status

A reusable 0.45 m shelf book was built with Blender 5.1.2 from [`build.py`](../../../assets/objects/little-light-book/build.py). Its editable `.blend` source and runtime GLB are in the asset library; the GLB was copied to `public/assets/models/little-light-book.glb` and appears as decorative volumes on the room shelf. Six separate meshes form page block, two boards, spine and two inlaid lines. The exported GLB has 648 triangles after bevel modifiers. The model is plain, with runtime covers and picture layers supplied independently by the app. Blender initially crashed with exit 139 inside the file sandbox, including a minimal startup check. Running the same command with approved unsandboxed execution succeeded and exported the model. Pixal3D still needs a configured SSH host; none was present in the process environment or SSH config, so no Pixal job was submitted and no paid service substituted. Resume that optional model branch when an authorized host is available.

## Review notes

The image set was inspected for alpha format and the first integrated Eden screenshot. The first render had a blank left page and an accidental repeated-image layer; the scene was changed to full-spread painting and a separately generated transparent cutout. Runtime capture of that revised scene and a complete all-page visual review remain verification tasks for the integration owner. The flood painting should be checked especially for unmistakable ark scale, peril and non-graphic loss at final display size.

The three figurine cutouts used this exact common prefix followed immediately by the suffix in the table:

> Use case: illustration-story. Asset type: single transparent paper figurine for a child's Bible storybook shelf. One full-body adult Middle Eastern person, natural anatomy and expressive gentle face, simple historically plausible modest linen clothing, painted in rich gouache and watercolor with visible paper texture. Standing straight, full figure including feet, clean silhouette, generous margins, neutral soft light. Actual transparent background with clean alpha edges. No text, no border, no watermark, no props, no additional person.

| Asset | Exact suffix |
|---|---|
| adam-figurine | Adam in warm cream and olive linen, short dark wavy hair and beard, thoughtful hopeful expression. |
| eve-figurine | Eve in muted terracotta and sage linen, dark hair in a simple loose braid, compassionate attentive expression. |
| noah-figurine | Older Noah in worn blue-gray and ochre linen, silver-streaked dark beard and hair, dignified weathered expression. |

## Noah image corrections

After inspecting a contact sheet, `noah-03`, `noah-05`, `noah-06`, `noah-07`, and `noah-08` were edited with ImageGen using each prior original PNG as the edit target. The prior original paintings are not retained separately; the current `*-source.png` files are the final full-resolution edited outputs. `noah-04` was likewise edited to close the ark doorway. The exact edit prompts were:

| Asset | Exact ImageGen edit prompt |
|---|---|
| noah-03 | Edit this painting only where human figures appear. Replace the two child-looking people near Noah with adult sons and adult daughters-in-law in modest ancient linen. Noah's household is eight adults total: Noah, his wife, three adult sons, and three adult wives. The scene may show a subset, but show no children or babies. Preserve the immense ark, ramp, animals, storm, camera, painterly texture, and overall composition exactly. No text. |
| noah-04 | Edit the ark only: close and seal the large side doorway so no animals or open interior are visible while the ark is afloat in the deadly flood. Preserve the huge hull, terrifying waves, dark sky, distant people in peril, composition, color and painted texture exactly. No gore, no text. |
| noah-05 | Edit only the people visible in the ark window. Replace child-looking faces with adult sons and adult daughters-in-law. Noah's household consists of eight adults total: Noah, his wife, three adult sons and their adult wives. A subset may appear at the window. Preserve the dove with leaf, water, ark, mountains, light and painterly style exactly. No children or babies; no text. |
| noah-06 | Edit only the human figures leaving the ark. Remove child-looking people and babies; depict Noah, his wife, their three adult sons, and their three adult daughters-in-law: exactly eight adults if all the household is visible. Keep the elderly Noah prominent. Preserve animals, enormous ark, rainbow, receding water, landscape, lighting, composition and textured gouache painting. No text. |
| noah-07 | Edit only the human figures at the altar. Replace the small children with adult sons and adult daughters-in-law. Noah's household is exactly eight adults: Noah, his wife, three sons and three wives. If everyone is in frame, depict exactly eight adults. Preserve altar, ark, animals, rainbow, mountains, painterly composition and light. No babies, no children, no text. |
| noah-08 | Edit only the human figures in the foreground. Replace child-looking people with adult sons and daughters-in-law; Noah's household is exactly eight adults: Noah, wife, three sons and three wives. A subset may be visible, but no children or babies. Preserve vast rainbow, distant ark, animals, camera, landscape, painterly color and reflective mood exactly. No text. |

The revised six images were inspected together in a contact sheet. Noah's household now reads as adults in the revised scenes; the flood ark door is closed. As with all painted biblical staging, crowd counts and facial ages are visually approximate and should be checked during external editorial review.

## Shelf book model reference

The isolated ImageGen reference, exact prompt, Blender editable source, runtime GLB, review render, build scripts and mesh report are in [`assets/objects/little-light-book`](../../../assets/objects/little-light-book/README.md). The reference image informed the material and silhouette brief; Blender's six simple meshes were authored manually rather than reconstructed from the image. The review render was inspected from a three-quarter front angle and confirmed an upright book with complete boards, page block, spine and trim.

## Final integration refinements

The integration pass split each painting into two mapped 3D page leaves, with a 450 ms right-leaf fold for opening/page turns; reduced motion removes the fold. The original image is not duplicated on either leaf: each samples its corresponding half. Separate foreground artwork remains raised above those leaves. Camera framing updates with container size, including device rotation. Removed page/cover geometry, materials and texture derivatives are disposed. Decorative cover and figurine image failures preserve book selection and readable titles.

## Round16 room wallpaper

An original botanical wallpaper tile was generated with built-in ImageGen. The [source and exact prompt](../../../assets/textures/little-light-botanical-wallpaper/README.md) are preserved outside runtime; `public/assets/art/room/botanical-wallpaper.webp` is an independently owned1024×1024 quality84 derivative (119,974bytes). Original output was1254×1254. No reference image was supplied. Wall repeat continuity/scale and surrounding procedural cloth/window materials are reviewed in the round16 evidence; a generated tile alone is not acceptance.

## Garden stage floor

Original built-in ImageGen ground artwork connects Eden01–05 actors to the garden. [Source, exact prompt and runtime derivation](../../../assets/textures/little-light-garden-floor/README.md). The 1536×1024 source has genuine alpha; the prototype owns a 1024×683 quality84 WebP copy (282,556bytes). No third-party source image was supplied. A two-panel projection leaves paper margins and the gutter visible; the artwork is painted staging, not a scriptural assertion. Candidate01 was hidden below the paper and rejected; candidate02 places the print above paper and beneath trim, ribbon and actors. Matched review determines retention.
