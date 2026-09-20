/** Version 1 is deliberately a bounded paper-stage format, not executable code. */
export interface BookAsset {
  kind: "image" | "audio";
  src: string;
  attribution: string;
}
export interface BookPlacement {
  x: number;
  depth: number;
  width: number;
  height: number;
  anchor?: "bottom" | "center";
  elevation?: number;
  rotation?: number;
}
export interface BookMotion {
  preset: "rock";
  trigger: "open" | "interaction" | "narration";
  segment?: string;
  delay?: number;
  duration: number;
  strength: number;
  repeat?: number;
}
export interface BookElement {
  id: string;
  label: string;
  kind: "actor" | "prop";
  asset: string;
  /** Horizontal atlas cell; no anatomical rig is inferred from an image. */
  pose?: { index: number; columns: number };
  placement: BookPlacement;
  motion?: BookMotion;
  interaction?: { label: string; response: string; sound?: "tap" };
}
export interface BookSegment {
  id: string;
  text: string;
  narration?: {
    asset: string;
    recordedText: string;
    duration: number;
    voice: string;
  };
}
export interface BookSpread {
  id: string;
  title: string;
  source: string;
  stagingNote: string;
  /** Minimum page time in seconds; narration may extend it. Default 8. */
  seconds?: number;
  segments: BookSegment[];
  backdrop: { asset: string };
  ground?: {
    asset: string;
    x: number;
    depth: number;
    width: number;
    height: number;
    rotation?: number;
    opacity?: number;
  };
  elements: BookElement[];
}
export interface BookTranslation {
  /** Fingerprint of all source-language text at translation time. */
  sourceFingerprint: string;
  title: string;
  subtitle: string;
  source: string;
  retellingNote: string;
  spreads: {
    id: string;
    title: string;
    source: string;
    segments: BookSegment[];
    elements: {
      id: string;
      label: string;
      interaction?: { label: string; response: string };
    }[];
  }[];
}
export interface BookSoundtrack {
  id: string;
  label: string;
  asset: string;
  /** Inclusive page IDs. Offsets trim seconds from the selected page range. */
  startPage: string;
  endPage: string;
  startOffset: number;
  endOffset: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
}
export interface BookReview {
  locale: string;
  pageId: string;
  fingerprint: string;
  reviewedAt: string;
}
export interface AuthoredBook {
  format: "little-light-book";
  version: 1;
  id: string;
  title: string;
  subtitle: string;
  locale: string;
  status: "draft";
  source: string;
  retellingNote: string;
  cover: string;
  assets: Record<string, BookAsset>;
  spreads: BookSpread[];
  /** Requested release languages, including the source locale. Defaults to [locale]. */
  languages?: string[];
  translations?: Record<string, BookTranslation>;
  soundtracks?: BookSoundtrack[];
  narrationVolume?: number;
  narrationSettings?: Record<string, { voice: string; speed: number }>;
  reviews?: BookReview[];
}
export interface BookIssue {
  path: string;
  message: string;
}
export function narrationIssues(book: AuthoredBook): BookIssue[] {
  return book.spreads.flatMap((spread, i) =>
    spread.segments.flatMap((segment, j) => {
      const path = `/spreads/${i}/segments/${j}/narration`;
      return !segment.narration
        ? [
            {
              path,
              message:
                "Missing narration: add a recording to hear this spread.",
            },
          ]
        : segment.narration.recordedText !== segment.text
          ? [
              {
                path,
                message:
                  "Stale narration: replace this recording for the changed text; unchanged recordings can be kept.",
              },
            ]
          : [];
    }),
  );
}
