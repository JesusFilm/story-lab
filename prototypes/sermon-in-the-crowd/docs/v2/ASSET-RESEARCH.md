# Free asset search and V2 decision

Researched 10 September 2026. The goal was an inspectable web/VR prototype with real skinning and reusable motion, while retaining V1 for comparison.

## Selected

- [Quaternius Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html): CC0. Actual free Standard download contains two athletic bases and a small hairstyle selection; the advertised full six-body / twenty-style set includes paid content. V2 uses only the free archive.
- [Quaternius Modular Character Outfits – Fantasy](https://quaternius.com/packs/modularcharacteroutfitsfantasy.html): CC0. Actual free Standard archive supplies ranger and peasant clothing. V2 uses the plain male peasant tunic/sleeves on both body types, avoiding the female outfit’s corset/gloves and the ranger armour. A small local cloth sash covers the join to the sourced skirt.
- [Quaternius Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html): CC0. Actual free archive contains 43 clips, including talking, idle, walking, crouching and sitting. V2 retains seven relevant clips. “Compatible humanoid rig” still requires rest-pose correction; it does not mean every unmodified track fits every mesh.
- [CDmir / TinyWorlds Monk](https://opengameart.org/content/monk): CC0 original Blender asset, with an authored long robe and packed cloth textures. V2 adapts its lower robe, avoiding a complete new clothing mesh.

The human models have eyes and brows but no native jaw/viseme blendshapes. V2 therefore adds modest facial deformation, rather than claiming that a talking body animation includes lip sync. Speech energy controls mouth movement; it is still visibly approximate up close.

## Alternatives investigated

- [MakeHuman](https://static.makehumancommunity.org/makehuman/faq/are_makehuman_files_free.html): official core assets are CC0 and offer much broader human variation. A plausible next source for less athletic bodies and more comprehensive facial control, but it introduces a character-generation/export workflow and per-garment fit work. Community asset licenses must be checked individually.
- [Adobe Mixamo](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html): free with an Adobe ID and usable in games; useful animation source. It requires an account, and its raw-asset redistribution rules differ from CC0. We did not use it or access an account.
- [Ready Player Me facial targets](https://docs.readyplayer.me/ready-player-me/api-reference/avatars/morph-targets): documentation describes ARKit and Oculus lip-sync targets. These are relevant capabilities to require in a future face asset, but period clothing, current service access and model redistribution terms would need separate verification. No RPM assets were imported.
- [Monk animated](https://opengameart.org/content/monk-animated): useful existing walk/idle work, but the derivative is CC-BY-SA 3.0. The original CC0 robe plus the Quaternius CC0 motion library kept this V2's model licensing consistent.

## What this comparison can establish

V1 and V2 share scenery, film edit, subtitles, time, camera and broad choreography. The switch isolates character construction and animation. V2 should show the value of authored topology, skinned deformation and real motion clips. It does not compare engines, cinematic facial capture or a finished historically accurate character art set.

The remaining investment is art direction, period clothing and facial performance, plus headset profiling. Changing engines would not remove these tasks. Free sourcing reduces anatomy/rig authoring; combining authors still introduces fitting, visual consistency and retargeting work.
