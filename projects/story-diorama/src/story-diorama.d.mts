export interface Position {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  width?: string;
  maxWidth?: string;
  height?: string;
  maxHeight?: string;
  transform?: string;
}
export interface TextAppearance {
  visible?: boolean;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  color?: string;
  textAlign?: string;
  /** Null restores the default caption stack. All lengths use CSS strings. */
  position?: Position | null;
  /** Scroll viewport height. Relevant to the text slot only. */
  maxHeight?: string;
}
export interface Appearance {
  fontFamily?: string;
  number?: TextAppearance;
  title?: TextAppearance;
  text?: TextAppearance;
  reference?: TextAppearance;
  version?: TextAppearance;
  image?: {
    fit?: "cover" | "contain" | "fill" | "none" | "scale-down";
    position?: string;
  };
  shade?: string | false;
  announceText?: boolean;
  /** Applied when the component container is at most 650 CSS pixels wide. */
  mobile?: Omit<Appearance, "mobile">;
}
export interface PlaybackOptions {
  mode?: "auto" | "manual";
  reveal?: "typewriter" | "scroll" | "instant";
  speed?: number;
  /** Durations are milliseconds. */
  hold?: number;
  fade?: number;
  transitionMs?: number;
  transition?: "dissolve" | "fade" | "drift" | "cut";
  loop?: boolean;
}
export interface PlayerOptions extends PlaybackOptions {
  appearance?: Appearance;
}
export interface MusicCue {
  src: string;
  name?: string;
  loop?: boolean;
  volume?: number;
  /** Milliseconds. */
  fade?: number;
  delay?: number;
  duration?: number;
  /** Seconds within the file. */
  offset?: number;
}
export interface Cue {
  text: string;
  number?: string | number;
  title?: string;
  reference?: string;
  version?: string;
  image?: string;
  alt?: string;
  /** Undefined keeps music; null fades to silence. */
  music?: MusicCue | null;
  options?: Omit<PlaybackOptions, "loop">;
  appearance?: Appearance;
}
export interface Story {
  title?: string;
  cues: Cue[];
}
export interface PlayerState {
  phase: "idle" | "revealing" | "holding" | "waiting" | "fading" | "complete";
  index: number;
  progress: number;
  paused: boolean;
  running: boolean;
  muted: boolean;
  volume: number;
  total: number;
}
export interface DioramaEvents {
  state: PlayerState;
  cue: { index: number; cue: Cue };
  pause: boolean;
  music: MusicCue | { stop: true; fade?: number };
  complete: Record<string, never>;
  destroy: Record<string, never>;
  appearance: Appearance;
  audioerror: { message: string; error?: unknown };
}
export class StoryDiorama extends EventTarget {
  constructor(root: HTMLElement, story: Story, options?: PlayerOptions);
  preload(onProgress?: (loaded: number, total: number) => void): Promise<void>;
  start(options?: PlayerOptions): void;
  next(): void;
  seek(index: number): void;
  pause(value?: boolean): void;
  stop(): void;
  destroy(): void;
  setVolume(value: number): void;
  setMuted(value: boolean): void;
  retryAudio(): void;
  setAppearance(patch: Appearance): void;
  getState(): PlayerState;
  addEventListener<K extends keyof DioramaEvents>(
    type: K,
    callback: ((event: CustomEvent<DioramaEvents[K]>) => void) | null,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void;
}
