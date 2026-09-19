import type { PaperActorKind, PaperActorMood } from "./paper-actor";
export interface ActorDirection {
  kind: PaperActorKind;
  pose: 0 | 1 | 2;
  x: number;
  depth: number;
  mood: PaperActorMood;
}
export interface StageProp {
  file: string;
  width: number;
  x: number;
  depth: number;
}
export interface StageDirection {
  background: string;
  props?: StageProp[];
  actors: ActorDirection[];
  tree?: number;
  waves?: boolean;
  ark?: boolean;
  family?: boolean;
  interior?: boolean;
  dove?: boolean;
  rainbow?: boolean;
  tint?: number;
}
const adam = (
  pose: 0 | 1 | 2,
  x = -0.8,
  depth = -0.5,
  mood: PaperActorMood = "welcome",
): ActorDirection => ({ kind: "adam", pose, x, depth, mood });
const eve = (
  pose: 0 | 1 | 2,
  x = 0.85,
  depth = -0.25,
  mood: PaperActorMood = "welcome",
): ActorDirection => ({ kind: "eve", pose, x, depth, mood });
const noah = (
  pose: 0 | 1 | 2,
  x = -0.9,
  depth = -0.5,
  mood: PaperActorMood = "work",
): ActorDirection => ({ kind: "noah", pose, x, depth, mood });
/** Each spread has authored blocking and a visible dramatic purpose. No invented divine figure. */
export const stageDirections: Record<string, StageDirection> = {
  "eden-01": { background: "garden", actors: [adam(0, -0.4)], tree: -2.15 },
  "eden-02": {
    background: "garden",
    actors: [adam(0, -0.65), eve(0, 0.8)],
    tree: -2.3,
  },
  "eden-03": {
    background: "garden",
    actors: [adam(0, -0.65, 0.05, "warn"), eve(1, 0.55, -0.7, "warn")],
    props: [{ file: "serpent-branch", width: 1.25, x: 1.75, depth: 0.1 }],
    tint: 0xffecc9,
  },
  "eden-04": {
    background: "garden",
    actors: [adam(1, -0.65, -0.45, "sad"), eve(2, 0.65, -0.5, "sad")],
    tree: 2.2,
    tint: 0xe4d2b4,
  },
  "eden-05": {
    background: "garden",
    actors: [adam(1, -0.7, -0.65, "sad"), eve(2, 0.6, -0.4, "sad")],
    tree: -2.1,
    tint: 0xb5bdad,
  },
  "eden-06": {
    background: "exile",
    actors: [adam(1, -0.85, -0.4, "sad"), eve(2, 0.8, -0.25, "sad")],
    tint: 0xe0d1b8,
  },
  "eden-07": {
    background: "exile",
    actors: [adam(1, -0.35, -0.75, "sad"), eve(2, 0.7, -0.3, "sad")],
  },
  "eden-08": {
    background: "exile",
    actors: [adam(2, -0.75, -0.4, "hope"), eve(0, 0.65, -0.25, "hope")],
    tree: -2.25,
  },
  "noah-01": {
    background: "shipyard",
    actors: [noah(2, -0.3, -0.5, "listen")],
  },
  "noah-02": {
    background: "shipyard",
    actors: [noah(0, -0.35, 0.1, "work")],
    props: [{ file: "timber-bench", width: 2.25, x: -0.45, depth: -0.35 }],
  },
  "noah-03": {
    background: "boarding",
    props: [{ file: "animal-pairs", width: 2.9, x: 0.2, depth: -1.15 }],
    actors: [noah(2, -1.75, -0.65, "welcome")],
    family: true,
  },
  "noah-04": {
    background: "storm-open-water",
    actors: [],
    waves: true,
    ark: true,
    tint: 0xc8d5d9,
  },
  "noah-05": {
    background: "receding-water",
    actors: [noah(1, -0.9, -0.5, "listen")],
    dove: true,
    interior: true,
    tint: 0xd9e6e9,
  },
  "noah-06": {
    background: "shore",
    actors: [noah(2, -1.8, -0.75, "hope")],
    family: true,
  },
  "noah-07": {
    background: "shore",
    actors: [noah(2, -0.75, -0.5, "hope")],
    rainbow: true,
  },
  "noah-08": {
    background: "shore",
    rainbow: true,
    actors: [noah(2, -1.8, -0.7, "hope")],
    family: true,
  },
};
