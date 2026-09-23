import type { ActorDirection, StageDirection } from "./stage-direction-types";

const gardenGround = "assets/art/theatre/continuous-garden-ground.webp";
const exileGround = "assets/art/theatre/exile-earth-ground.webp";
const adam = (
  pose: 0 | 1 | 2,
  x = -0.8,
  depth = -0.5,
  mood: ActorDirection["mood"] = "welcome",
): ActorDirection => ({ kind: "adam", pose, x, depth, mood });
const eve = (
  pose: 0 | 1 | 2,
  x = 0.85,
  depth = -0.25,
  mood: ActorDirection["mood"] = "welcome",
  flipX = false,
): ActorDirection => ({ kind: "eve", pose, x, depth, mood, flipX });

/**
 * Eden page blocking is authored separately from the Noah legacy directions so
 * the two books can be reviewed and adjusted independently. The p6 firelight is
 * a symbolic stage image for the guarded way; it does not depict God or an angel.
 */
export const edenStageDirections: Record<string, StageDirection> = {
  "eden-01": {
    background: "garden",
    ground: gardenGround,
    actors: [adam(0, -0.4)],
    tree: -2.15,
  },
  "eden-02": {
    background: "garden",
    ground: gardenGround,
    actors: [adam(0, -0.65), eve(0, 0.8, -0.25, "welcome", true)],
    tree: -2.3,
  },
  "eden-03": {
    background: "garden",
    ground: gardenGround,
    actors: [adam(0, -0.65, 0.05, "warn"), eve(1, 0.55, -0.7, "warn")],
    props: [
      {
        file: "serpent-branch",
        creature: "serpent",
        width: 1.25,
        x: 1.75,
        depth: 0.1,
      },
    ],
    tint: 0xffecc9,
  },
  "eden-04": {
    background: "garden",
    ground: gardenGround,
    actors: [adam(1, -0.65, -0.45, "sad"), eve(2, 0.65, -0.5, "sad")],
    props: [
      {
        file: "assets/art/theatre/fig-leaf-hiding-screen.webp",
        width: 4.9,
        x: 0,
        depth: -0.55,
        motion: { kind: "sway", strength: 0.12, periodSeconds: 5.1 },
      },
    ],
    tree: 2.2,
    tint: 0xe4d2b4,
  },
  "eden-05": {
    background: "garden",
    ground: gardenGround,
    actors: [adam(1, -0.7, -0.65, "sad"), eve(2, 0.6, -0.4, "sad")],
    tree: -2.1,
    tint: 0xb5bdad,
  },
  "eden-06": {
    background: "assets/art/theatre/eden-guarded-way-backcloth.webp",
    ground: exileGround,
    actors: [adam(1, -0.85, -0.4, "sad"), eve(2, 0.8, -0.25, "sad")],
    tint: 0xe0d1b8,
  },
  "eden-07": {
    background: "exile",
    ground: exileGround,
    actors: [adam(0, -0.45, -0.75, "work"), eve(0, 0.45, -0.45, "work")],
    props: [
      {
        file: "assets/art/theatre/fieldwork-tools.webp",
        width: 1.75,
        x: 1.65,
        depth: -1.05,
      },
    ],
  },
  "eden-08": {
    background: "exile",
    ground: exileGround,
    actors: [adam(2, -0.75, -0.4, "hope"), eve(0, 0.65, -0.25, "hope")],
  },
};
