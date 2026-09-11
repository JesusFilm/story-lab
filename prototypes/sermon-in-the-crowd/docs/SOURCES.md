# Sources and scene decisions

Research checked 10 September 2026 (Pacific/Auckland).

## Media

- [Official English JESUS chapter](https://www.jesusfilm.org/watch/jesus.html/sermon-on-the-mount-2/english.html): chapter title, 3:39 duration, Luke 6 reference, source identity.
- [Official English full film](https://www.jesusfilm.org/watch/jesus.html/english.html): full-film context.
- [HLS manifest](https://stream.mux.com/qWaCGua8Z5Ctfbbvd02FDerilCGgwJX1iUPT5tSngATo.m3u8): obtained from the chapter's public VideoObject metadata. Stream includes English audio and video. The app plays its sound; no soundtrack extraction is distributed. It uses the stable master URL, not expiring signed rendition URLs.
- [English WebVTT](https://api-media-core.jesusfilm.org/1_jf6112-0-0/editions/ot/subtitles/1_jf6112-0-0_ot_529.vtt): explicitly identified as English in the official page's caption metadata. This is the chapter-specific track, not a hand-retimed full-film transcript.
- [English audio story](https://www.jesusfilm.org.za/digital/): the South African ministry also links an English MP3 “Story of Jesus.” That longer audio edition was not chosen because the chapter stream and chapter VTT provide a directly matched performance and timeline.
- [Publisher FAQ](https://www.jesusfilm.org/about/faq/): source and adaptation restrictions. The publisher says its English film uses the Good News Translation. Do not describe the film's spoken text as a public-domain Bible translation.

## Film observations

Reference thumbnails from the official chapter stream at approximately 42s, 100s and 210s were inspected during development. They show a dense standing crowd, Jesus in a pale textured tunic with dark hair/beard, muted cream/brown/sage/blue garments, head coverings, warm outdoor daylight, rocky terraces, plants, timber supports and dark woven cloth shelters. No film still is bundled or used as interface artwork.

The prototype takes those broad visual cues. It adds walkable spacing and a distant hazy landscape for navigation and depth. Sun angle, layout, height contours, exact tree positions and most props are artistic choices, not claims about a documented location. The scene is not a boat sermon or an Olivet Discourse reconstruction.

## Period considerations

The reference contains prickly pear cactus. [Kew's species record](https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:1151735-2) identifies Opuntia ficus-indica as native to Mexico. Because the user prioritizes period-appropriate details, the prototype omits this film-background plant and uses olive-like trees and grass/shrub cover instead. This choice deliberately follows period plausibility rather than reproducing every film-background detail.

Simple tunics, mantles, cloth head coverings, cord belts, leather sandals, earthenware and fieldstone are used as plausible visual placeholders. Exact garment cuts, colors and social distribution remain interpretive. For comparative clothing evidence, see [Clothing and Textiles in the New Testament](https://rsc.byu.edu/sites/default/files/pub_content/pdf/36%20Clothing%20and%20Textiles%20in%20the%20New%20Testament.pdf), which also discusses the limitations of surviving textile evidence.

## Technical references

- [Three.js VR guide](https://threejs.org/manual/en/webxr-basics.html): immersive sessions and secure-context requirements.
- [Three.js VRButton](https://threejs.org/docs/pages/VRButton.html).
- [Three.js PositionalAudio](https://threejs.org/docs/pages/PositionalAudio.html).
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html).

All generated model geometry is original to this prototype. Blender is actually executed by the reproducible script; the GLBs are not stand-ins for an unperformed Blender export.

## V2 free model comparison

V1 source geometry remains unchanged. V2 combines the CC0 Standard editions of Quaternius' Universal Base Characters, Modular Character Outfits – Fantasy and Universal Animation Library with the original CC0 Monk robe by CDmir / TinyWorlds. Source pages, exact uses, licenses, adaptations and limitations are recorded in [V2 credits](../public/models-v2/CREDITS.md) and [the asset research](v2/ASSET-RESEARCH.md). The small connecting sash and facial morph controls are local adaptations. V2 continues to use the same teaching edit and source-film choreography notes.
