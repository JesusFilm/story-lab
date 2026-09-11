# Mixed-thickness village walkthrough

- Status: done — implemented and verified; awaiting playtest
- Owner: Codex
- Last updated: 2026-09-08
- Objective: replace the walkthrough map with a newly generated Maze Foundry village: see-over low thin walls and homes, animal stalls and markets on thick footprints.
- Accepted scope: requested by Jaco in this task on 2026-09-08. Supersedes keeping the old map for this prototype; the source reference map remains preserved.
- Implementation assumptions: 12 × 10 cells, 4 m passages, mixed 0.5 / 4 m walls, waist-high thin walls. These dimensions and visual styling await playtest.
- Dependencies: existing [Maze Foundry](../../projects/maze-foundry/README.md), Blender 5.1.2, existing walkthrough controller and Three.js runtime.

## Completed scope

1. Preserve the previous prototype source/world and generate verified PNG + manifest using Maze Foundry.
2. Adapt the manifest graph/raster for the player and its map; retain generation provenance.
3. Build a separate editable village world with low stone divisions, plaster homes, awnings, market produce and animal pens. Decorations must stay within blocked footprints; goal shelter must leave the arrival path clear.
4. Verify every imported passage and loaded geometry, traverse successful routes, exercise browser controls and inspect desktop/mobile views.
5. Update prototype reproduction instructions and open the playable village.

## Completion checks

Foundry acceptance, exact raster/geometry footprint agreement, runtime collision clearance, guided route completion, retained difficulty/choice controls, visible low walls and distinct village structures, browser errors and performance sample. Physical-device playtesting and Forge integration remain outside this task. Buildings/animals are creative scene design, not historical verification or new narrative content.

## Results

- Foundry seed `bethlehem-village-02`: 100 × 84 m, 120 cells, 121 open graph edges, three verified routes (208/224/240 m).
- 56 see-over stone walls at 0.99 m; 9 homes, 17 markets, 15 animal stalls, low planted courtyard supports and a closed low perimeter. Thick-segment scenery stays inside its blocked footprints.
- Every one of 134,400 raster pixels matches the modeled obstacle union. All 121 edges pass 19,481 circle-clearance samples; all 87 directed junction approaches preserve waiting/early taps. Guidance passes from 242 edge positions.
- First choice at 8 m / 2.11 simulated seconds; previous map 112 m / 19.59 seconds. Human difficulty/pacing remains unverified.
- Headless Chrome validates all 244 loaded obstacle bounds, input/menu/difficulty/assistance flows, completion, reset and mobile touch. No browser errors. Desktop and 390 × 844 captures inspected. Short frame sample 16.7 ms median/p95, not a physical-device benchmark.
- Camera fading includes the entire multi-material structure, so its roof fades with the facade.
- Original reference map, world, character and source builder retained; previous player files and world also archived before editing. New map provenance, sources, Blender file, GLB and reproduction commands are owned by the existing prototype.

Records and commands: [prototype README](../../prototypes/shepherd-maze/README.md).

## Next actions and limits

Jaco: playtest the village’s appearance and route pacing. Unassigned: physical-device testing and Forge integration. Houses and markets are not enterable or interactive systems. The later V2 environment comparison gives one sheep per pen a cosmetic contained idle/walk cycle; V1 sheep remain static and neither version has animal gameplay. The character still moves on graph centrelines; limbs/staff can intersect scenery. Low walls are impassable. Numeric map settings and art styling are implementation choices, not final game-wide approvals.
