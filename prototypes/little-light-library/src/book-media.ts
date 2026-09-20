import type { AuthoredBook } from "./authored-book";

export function assetReferences(book: AuthoredBook, id: string) {
  let count = Number(book.cover === id);
  for (const page of book.spreads) {
    count +=
      Number(page.backdrop.asset === id) + Number(page.ground?.asset === id);
    for (const element of page.elements) count += Number(element.asset === id);
    for (const segment of page.segments)
      count += Number(segment.narration?.asset === id);
  }
  for (const translation of Object.values(book.translations ?? {}))
    for (const page of translation.spreads)
      for (const segment of page.segments)
        count += Number(segment.narration?.asset === id);
  for (const track of book.soundtracks ?? [])
    count += Number(track.asset === id);
  return count;
}
export function checkMediaCapacity(
  count: number,
  bytes: number,
  addedBytes: number,
  removedBytes?: number,
) {
  if (addedBytes > 32 * 1024 * 1024)
    throw Error("A single recording must be smaller than 32 MiB.");
  if (count + 1 - Number(removedBytes !== undefined) > 1024)
    throw Error(
      "This book has reached 1,024 assets. Remove unused assets or split it before adding more audio. Completed recordings were kept.",
    );
  if (bytes + addedBytes - (removedBytes ?? 0) > 96 * 1024 * 1024)
    throw Error(
      "This book has reached the 96 MiB portable-media limit. Use smaller media or split it before continuing. Completed recordings were kept.",
    );
}
export async function mediaSizes(book: AuthoredBook, signal?: AbortSignal) {
  const sizes = new Map<string, number>();
  for (const [id, asset] of Object.entries(book.assets)) {
    signal?.throwIfAborted();
    const response = await fetch(
      asset.src.startsWith("data:") ? asset.src : `./${asset.src}`,
      { signal },
    );
    if (!response.ok)
      throw Error(`Cannot load asset '${id}' before adding audio.`);
    const size = (await response.blob()).size;
    sizes.set(id, size);
  }
  return sizes;
}
