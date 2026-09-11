import type { StoryDiorama } from "./story-diorama.mjs";
export type ControlName =
  | "play"
  | "pause"
  | "next"
  | "replay"
  | "mute"
  | "volume";
export type ControlLabels = Partial<
  Record<ControlName | "resume" | "reveal" | "unmute" | "retryAudio", string>
>;
export interface Binding {
  destroy(): void;
}
export interface Controls extends Binding {
  element: HTMLDivElement;
}
export function bindControls(
  root: HTMLElement,
  player: StoryDiorama,
  options?: { labels?: ControlLabels },
): Binding;
export function createControls(
  root: HTMLElement,
  player: StoryDiorama,
  options?: {
    controls?: ControlName[];
    labels?: ControlLabels;
    label?: string;
  },
): Controls;
