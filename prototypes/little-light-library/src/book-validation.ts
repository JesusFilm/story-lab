import Ajv from "ajv";
import {
  narrationIssues,
  type AuthoredBook,
  type BookIssue,
} from "./authored-book";

const text = { type: "string", minLength: 1, maxLength: 4000 };
const id = { type: "string", pattern: "^[a-z][a-z0-9-]{0,63}$" };
const num = (minimum: number, maximum: number) => ({
  type: "number",
  minimum,
  maximum,
});
const choice = (...values: string[]) => ({ enum: values });
const object = (
  properties: Record<string, unknown>,
  required = Object.keys(properties),
) => ({ type: "object", properties, required, additionalProperties: false });
const list = (items: unknown, maxItems: number, minItems = 0) => ({
  type: "array",
  items,
  minItems,
  maxItems,
});
const motion = object(
  {
    preset: choice("rock"),
    trigger: choice("open", "interaction", "narration"),
    segment: id,
    delay: num(0, 60),
    duration: num(0.2, 30),
    strength: num(0, 20),
    repeat: { type: "integer", minimum: 1, maximum: 10 },
  },
  ["preset", "trigger", "duration", "strength"],
);
const placement = object(
  {
    x: num(-2.8, 2.8),
    depth: num(-1.2, 1.2),
    width: num(0.1, 5.6),
    height: num(0.1, 2.7),
    anchor: choice("bottom", "center"),
    elevation: num(0, 2),
    rotation: num(-45, 45),
  },
  ["x", "depth", "width", "height"],
);
export const bookSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Little Light Library book v1",
  ...object({
    format: { const: "little-light-book" },
    version: { const: 1 },
    id,
    title: text,
    subtitle: text,
    locale: { type: "string", pattern: "^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$" },
    status: { const: "draft" },
    source: text,
    retellingNote: text,
    cover: id,
    assets: {
      type: "object",
      minProperties: 1,
      maxProperties: 128,
      propertyNames: id,
      additionalProperties: object({
        kind: choice("image", "audio"),
        src: { type: "string", minLength: 1 },
        attribution: text,
      }),
    },
    spreads: list(
      object(
        {
          id,
          title: text,
          source: text,
          stagingNote: text,
          segments: list(
            object(
              {
                id,
                text,
                narration: object({
                  asset: id,
                  recordedText: text,
                  duration: num(0.05, 180),
                  voice: text,
                }),
              },
              ["id", "text"],
            ),
            12,
            1,
          ),
          backdrop: object({ asset: id }),
          ground: object(
            {
              asset: id,
              x: num(-2.8, 2.8),
              depth: num(-1.2, 1.2),
              width: num(0.1, 5.6),
              height: num(0.1, 2.4),
              opacity: num(0, 1),
            },
            ["asset", "x", "depth", "width", "height"],
          ),
          elements: list(
            object(
              {
                id,
                label: text,
                kind: choice("actor", "prop"),
                asset: id,
                pose: object({
                  index: { type: "integer", minimum: 0, maximum: 15 },
                  columns: { type: "integer", minimum: 1, maximum: 16 },
                }),
                placement,
                motion,
                interaction: object(
                  { label: text, response: text, sound: choice("tap") },
                  ["label", "response"],
                ),
              },
              ["id", "label", "kind", "asset", "placement"],
            ),
            16,
          ),
        },
        [
          "id",
          "title",
          "source",
          "stagingNote",
          "segments",
          "backdrop",
          "elements",
        ],
      ),
      40,
      1,
    ),
  }),
};
const schemaValidate = new Ajv({ allErrors: true, strict: false }).compile(
  bookSchema,
);
export function safeAssetSource(src: string, kind: "image" | "audio") {
  const inline =
    kind === "image"
      ? /^data:image\/(png|webp|jpeg);base64,[A-Za-z0-9+/]+=*$/
      : /^data:audio\/(wav|x-wav|mpeg|ogg);base64,[A-Za-z0-9+/]+=*$/;
  if (src.startsWith("data:")) return inline.test(src);
  return (
    /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)+\.(webp|png|jpe?g|wav|mp3|ogg)$/.test(
      src,
    ) && !src.split("/").some((part) => part === ".." || part === ".")
  );
}
export function validateBook(input: unknown): {
  book?: AuthoredBook;
  errors: BookIssue[];
  warnings: BookIssue[];
} {
  if (!schemaValidate(input))
    return {
      errors: (schemaValidate.errors || []).map((e) => ({
        path: e.instancePath || "/",
        message: `SCHEMA: ${e.message}${e.params.additionalProperty ? ` (${e.params.additionalProperty})` : ""}. Use the v1 contract.`,
      })),
      warnings: [],
    };
  const book = input as unknown as AuthoredBook;
  const errors: BookIssue[] = [];
  const error = (path: string, message: string) =>
    errors.push({ path, message });
  if (["eden", "noah"].includes(book.id))
    error(
      "/id",
      "RESERVED_ID: Choose a new ID; Eden and Noah cannot be replaced.",
    );
  const ref = (asset: string, kind: "image" | "audio", path: string) => {
    if (!Object.hasOwn(book.assets, asset))
      error(path, `ASSET_REFERENCE: '${asset}' is missing from /assets.`);
    else if (book.assets[asset].kind !== kind)
      error(path, `ASSET_KIND: '${asset}' must be ${kind}.`);
  };
  const unique = (values: { id: string }[], path: string) => {
    const seen = new Set<string>();
    values.forEach((value, i) => {
      if (seen.has(value.id))
        error(
          `${path}/${i}/id`,
          `DUPLICATE_ID: '${value.id}' must be unique here.`,
        );
      seen.add(value.id);
    });
  };
  for (const [key, asset] of Object.entries(book.assets))
    if (!safeAssetSource(asset.src, asset.kind))
      error(
        `/assets/${key}/src`,
        "UNSAFE_ASSET: Use a public-root relative media path or supported embedded media; external URLs, traversal and scripts are unsupported.",
      );
  ref(book.cover, "image", "/cover");
  unique(book.spreads, "/spreads");
  book.spreads.forEach((spread, i) => {
    const p = `/spreads/${i}`;
    ref(spread.backdrop.asset, "image", `${p}/backdrop/asset`);
    if (spread.ground) ref(spread.ground.asset, "image", `${p}/ground/asset`);
    unique(spread.segments, `${p}/segments`);
    unique(spread.elements, `${p}/elements`);
    spread.segments.forEach((segment, j) => {
      if (segment.narration)
        ref(
          segment.narration.asset,
          "audio",
          `${p}/segments/${j}/narration/asset`,
        );
    });
    spread.elements.forEach((element, j) => {
      const ep = `${p}/elements/${j}`;
      ref(element.asset, "image", `${ep}/asset`);
      if (element.pose && element.pose.index >= element.pose.columns)
        error(
          `${ep}/pose/index`,
          "POSE: index must be smaller than columns (zero-based).",
        );
      const m = element.motion;
      if (m?.trigger === "interaction" && !element.interaction)
        error(
          `${ep}/motion/trigger`,
          "INTERACTION: Add interaction labels/response for this trigger.",
        );
      if (
        m?.trigger === "narration" &&
        !spread.segments.some((s) => s.id === m.segment)
      )
        error(
          `${ep}/motion/segment`,
          "SEGMENT_REFERENCE: Choose a segment ID on this spread.",
        );
      if (m?.trigger !== "narration" && m?.segment)
        error(
          `${ep}/motion/segment`,
          "SEGMENT_TRIGGER: segment only applies to narration triggers.",
        );
    });
  });
  return {
    book: errors.length ? undefined : book,
    errors,
    warnings: narrationIssues(book),
  };
}
export type AssetProbe = (
  asset: AuthoredBook["assets"][string],
) => Promise<{ duration?: number }>;
export async function validateBookAssets(
  book: AuthoredBook,
  probe: AssetProbe,
): Promise<BookIssue[]> {
  const errors: BookIssue[] = [];
  // Serial reads bound decoding memory for large embedded packages.
  for (const [id, asset] of Object.entries(book.assets)) {
    try {
      const measured = await probe(asset);
      if (asset.kind === "audio")
        for (const [i, spread] of book.spreads.entries())
          for (const [j, segment] of spread.segments.entries()) {
            if (
              segment.narration?.asset === id &&
              (measured.duration === undefined ||
                Math.abs(measured.duration - segment.narration.duration) > 0.04)
            )
              errors.push({
                path: `/spreads/${i}/segments/${j}/narration/duration`,
                message: `AUDIO_DURATION: '${id}' measures ${measured.duration?.toFixed(4) ?? "unknown"} seconds; update its measured duration.`,
              });
          }
    } catch (e) {
      errors.push({
        path: `/assets/${id}/src`,
        message: `MISSING_OR_INVALID_ASSET: ${String(e)}. Replace the file or fix its src.`,
      });
    }
  }
  return errors;
}
