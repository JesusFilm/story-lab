import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import type { AuthoredBook } from "../src/authored-book";
import { translateBook, translationSlots } from "../src/book-generation";
import { sourceTranslation } from "../src/book-localization";

const source = fs.readFileSync("public/books/quiet-garden.book.json", "utf8");
const fixture = () => JSON.parse(source) as AuthoredBook;
const settings = { key: "sk-browser-only-secret", model: "test/model" };
const originalFetch = globalThis.fetch;

const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const translatedTexts = (book: AuthoredBook) => {
  const translation = sourceTranslation(book);
  return translationSlots(translation).map((slot) => slot.get());
};

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("malformed OpenRouter envelopes keep the previous translation", async () => {
  const cases: [string, unknown][] = [
    ["null response", null],
    ["missing choices", {}],
    ["unfinished response", { choices: [{ finish_reason: "length" }] }],
  ];
  for (const [name, payload] of cases) {
    const book = fixture();
    const previous = sourceTranslation(book);
    previous.title = "Existing translation";
    book.translations = { fr: previous };
    globalThis.fetch = async () => response(payload);
    await assert.rejects(
      translateBook(book, "fr", settings),
      /previous language version has been kept/i,
      name,
    );
    assert.equal(book.translations.fr.title, "Existing translation", name);
  }
});

test("translation retains matching narration by stable page and segment IDs", async () => {
  const book = fixture();
  const previous = sourceTranslation(book);
  for (const page of previous.spreads)
    for (const segment of page.segments)
      segment.narration = {
        asset: `audio-${page.id}-${segment.id}`,
        recordedText: segment.text,
        duration: 1.25,
        voice: `voice-${segment.id}`,
      };
  previous.spreads.reverse();
  previous.spreads.forEach((page) => page.segments.reverse());
  book.translations = { fr: previous };
  globalThis.fetch = async () =>
    response({
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: JSON.stringify({ texts: translatedTexts(book) }),
          },
        },
      ],
    });

  const translated = await translateBook(book, "fr", settings);
  for (const page of translated.spreads)
    for (const segment of page.segments) {
      assert.equal(segment.narration?.asset, `audio-${page.id}-${segment.id}`);
      assert.equal(segment.narration?.voice, `voice-${segment.id}`);
    }
});

test("OpenRouter input contains every text slot and excludes media and narration", async () => {
  const book = fixture();
  book.assets["private-media-sentinel"] = {
    kind: "audio",
    src: "data:audio/wav;base64,PRIVATE_MEDIA_SENTINEL",
    attribution: "PRIVATE_ATTRIBUTION_SENTINEL",
  };
  book.spreads[0].segments[0].narration = {
    asset: "private-media-sentinel",
    recordedText: "PRIVATE_RECORDED_TEXT_SENTINEL",
    duration: 1,
    voice: "PRIVATE_VOICE_SENTINEL",
  };
  const expected = translatedTexts(book);
  let requestBody = "";
  globalThis.fetch = async (_input, init) => {
    requestBody = String(init?.body);
    return response({
      choices: [
        {
          finish_reason: "stop",
          message: { content: JSON.stringify({ texts: expected }) },
        },
      ],
    });
  };

  await translateBook(book, "fr", settings);
  const request = JSON.parse(requestBody);
  assert.deepEqual(JSON.parse(request.messages[1].content), {
    texts: expected,
  });
  assert.doesNotMatch(
    requestBody,
    /PRIVATE_MEDIA_SENTINEL|PRIVATE_ATTRIBUTION_SENTINEL|PRIVATE_RECORDED_TEXT_SENTINEL|PRIVATE_VOICE_SENTINEL|private-media-sentinel/,
  );
});

test("abort, timeout and provider failures never include the API key", async () => {
  const book = fixture();
  for (const name of ["AbortError", "TimeoutError"]) {
    const controller = new AbortController();
    globalThis.fetch = async (_input, init) => {
      assert.ok(init?.signal);
      if (name === "AbortError") controller.abort();
      throw new DOMException(
        name === "AbortError"
          ? "The operation was aborted"
          : "The operation timed out",
        name,
      );
    };
    await assert.rejects(
      translateBook(book, "fr", settings, controller.signal),
      (error: Error) => {
        assert.equal(error.name, name);
        assert.doesNotMatch(String(error), /sk-browser-only-secret/);
        return true;
      },
    );
  }

  globalThis.fetch = async () =>
    new Response("echo sk-browser-only-secret", { status: 401 });
  await assert.rejects(translateBook(book, "fr", settings), (error: Error) => {
    assert.match(error.message, /HTTP 401/);
    assert.doesNotMatch(error.message, /sk-browser-only-secret/);
    return true;
  });
});
