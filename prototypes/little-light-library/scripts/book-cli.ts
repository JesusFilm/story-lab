import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  bookSchema,
  validateBook,
  validateBookAssets,
} from "../src/book-validation";
import type { BookAsset } from "../src/authored-book";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const [command, file, spreadId, segmentId, recording, voice] =
  process.argv.slice(2);
async function bytes(asset: BookAsset) {
  if (asset.src.startsWith("data:"))
    return Buffer.from(asset.src.split(",")[1], "base64");
  const resolved = await fs.realpath(path.join(publicRoot, asset.src));
  if (!resolved.startsWith(publicRoot + path.sep))
    throw Error("Asset escapes public root");
  return fs.readFile(resolved);
}
function wavDuration(buffer: Buffer) {
  if (
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WAVE"
  )
    throw Error(
      "CLI measurement requires PCM WAV; use reader validation for MP3/Ogg.",
    );
  let rate = 0,
    length = 0;
  for (let i = 12; i + 8 <= buffer.length; ) {
    const kind = buffer.toString("ascii", i, i + 4),
      size = buffer.readUInt32LE(i + 4);
    if (i + 8 + size > buffer.length) throw Error("Truncated WAV");
    if (kind === "fmt ") {
      if (size < 16 || buffer.readUInt16LE(i + 8) !== 1)
        throw Error("Only PCM WAV is supported by CLI measurement");
      rate = buffer.readUInt32LE(i + 16);
    }
    if (kind === "data") length += size;
    i += 8 + size + (size % 2);
  }
  if (!rate || !length) throw Error("Empty/invalid WAV");
  return length / rate;
}
async function probe(asset: BookAsset) {
  const buffer = await bytes(asset);
  if (buffer.length > 32 * 1024 * 1024) throw Error("Asset exceeds 32 MiB");
  if (asset.kind === "audio") return { duration: wavDuration(buffer) };
  const png = buffer
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  const webp =
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";
  if (!(png || jpeg || webp)) throw Error("Invalid PNG/JPEG/WebP header");
  return {};
}
try {
  if (command === "schema") {
    await fs.writeFile(
      path.join(root, "scripts/book.schema.json"),
      JSON.stringify(bookSchema, null, 2) + "\n",
    );
  } else {
    if (!file)
      throw Error(
        "Usage: book:validate -- book.json | book:replace-audio -- book.json spread-id segment-id audio/file.wav voice",
      );
    const input = JSON.parse(await fs.readFile(file, "utf8"));
    const result = validateBook(input);
    if (!result.book)
      throw Error(
        result.errors.map((i) => `${i.path}: ${i.message}`).join("\n"),
      );
    const book = result.book;
    if (command === "replace-audio") {
      if (!spreadId || !segmentId || !recording || !voice)
        throw Error("Provide spread-id segment-id public-relative.wav voice");
      const segment = book.spreads
        .find((s) => s.id === spreadId)
        ?.segments.find((s) => s.id === segmentId);
      if (!segment) throw Error("Unknown spread/segment ID");
      // A dedicated asset ID avoids altering another cue sharing the old asset.
      const base = `${spreadId}-${segmentId}-recording`.slice(0, 58);
      let id = base;
      for (let i = 2; Object.hasOwn(book.assets, id); i++) id = `${base}-${i}`;
      const asset: BookAsset = {
        kind: "audio",
        src: recording,
        attribution:
          "Creator-supplied recording; creator must provide appropriate attribution.",
      };
      book.assets[id] = asset;
      segment.narration = {
        asset: id,
        recordedText: segment.text,
        duration: 1,
        voice,
      };
      const check = validateBook(book);
      if (!check.book)
        throw Error(
          check.errors.map((i) => `${i.path}: ${i.message}`).join("\n"),
        );
      segment.narration.duration = wavDuration(await bytes(asset));
    } else if (command !== "validate")
      throw Error(`Unknown command: ${command}`);
    const checked = validateBook(book);
    if (!checked.book)
      throw Error(
        checked.errors.map((i) => `${i.path}: ${i.message}`).join("\n"),
      );
    const errors = await validateBookAssets(book, probe);
    if (errors.length)
      throw Error(errors.map((i) => `${i.path}: ${i.message}`).join("\n"));
    if (command === "replace-audio") {
      const temporary = `${file}.pending`;
      await fs.writeFile(temporary, JSON.stringify(book, null, 2) + "\n");
      await fs.rename(temporary, file);
      console.log(
        `Replaced only ${spreadId}/${segmentId}. Unchanged cue definitions and audio files were preserved.`,
      );
    }
    console.log(
      `Valid ${book.id}: ${book.spreads.length} spreads, ${Object.keys(book.assets).length} assets. Image headers checked; narration measured from WAV frames. Reader import additionally decodes images.`,
    );
    for (const warning of checked.warnings)
      console.warn(`WARNING ${warning.path}: ${warning.message}`);
  }
} catch (e) {
  console.error(String(e));
  process.exitCode = 1;
}
