import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import type { AuthoredBook } from "../src/authored-book";
import { parseCatalog } from "../src/book-catalog";
import { resolveBook } from "../src/book-localization";
import { stageDirections } from "../src/stage-direction";

const catalog = parseCatalog(
  JSON.parse(fs.readFileSync("public/books/catalog.json", "utf8")),
);
const english = JSON.parse(
  fs.readFileSync("public/content/en-US.json", "utf8"),
);
const audio = JSON.parse(fs.readFileSync("public/audio-manifest.json", "utf8"));
const repositoryFiles = (directory: string): string[] =>
  fs.existsSync(directory)
    ? fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const target = `${directory}/${entry.name}`;
        return entry.isDirectory() ? repositoryFiles(target) : [target];
      })
    : [];

test("each committed book index links every authoritative story and media source", () => {
  for (const entry of catalog) {
    const index = fs.readFileSync(`docs/books/${entry.id}.md`, "utf8");
    if (entry.legacyStory) {
      const story = english.stories.find(
        ({ id }: { id: string }) => id === entry.legacyStory,
      );
      assert.ok(story);
      for (const page of story.pages) {
        const stage = stageDirections[page.id];
        assert.ok(stage, `${entry.id}/${page.id} stage direction`);
        assert.ok(index.includes(page.id), `${entry.id}/${page.id} id`);
        assert.ok(index.includes(page.title), `${entry.id}/${page.id} title`);
        assert.ok(
          index.includes(page.passage),
          `${entry.id}/${page.id} source`,
        );
        assert.ok(index.includes(page.image), `${entry.id}/${page.id} artwork`);
        assert.ok(
          fs.existsSync(`public/${page.image}`),
          `${entry.id}/${page.id} artwork file exists`,
        );
        for (const segment of page.segments)
          assert.ok(
            index.includes(segment.text),
            `${entry.id}/${page.id} text`,
          );
        assert.ok(
          index.includes(`assets/art/theatre/${stage.background}.webp`),
          `${entry.id}/${page.id} backdrop`,
        );
        for (const actor of stage.actors)
          assert.ok(
            index.includes(`assets/art/theatre/${actor.kind}-poses.webp`),
            `${entry.id}/${page.id} ${actor.kind} pose atlas`,
          );
        for (const prop of stage.props ?? [])
          assert.ok(
            index.includes(`assets/art/theatre/${prop.file}.webp`),
            `${entry.id}/${page.id} ${prop.file} artwork`,
          );
      }
      for (const locale of fs
        .readdirSync("public/content")
        .filter((name) => name.endsWith(".json")))
        assert.ok(index.includes(`content/${locale}`), `${entry.id} ${locale}`);
      for (const [key, cue] of Object.entries(audio) as [
        string,
        { src: string },
      ][]) {
        if (key.split("/")[1] === entry.id) {
          assert.ok(
            fs.existsSync(`public/${cue.src}`),
            `${entry.id} audio file ${cue.src}`,
          );
          assert.ok(index.includes(cue.src), `${entry.id} audio ${key}`);
        }
      }
      assert.ok(index.includes("stage-direction.ts"));
      assert.ok(index.includes("paper-actor.ts"));
      assert.ok(index.includes("book-reader-audio.ts"));
    } else {
      const book = JSON.parse(
        fs.readFileSync(`public/books/${entry.path}`, "utf8"),
      ) as AuthoredBook;
      for (const spread of book.spreads) {
        assert.ok(index.includes(spread.id), `${book.id}/${spread.id} id`);
        assert.ok(
          index.includes(spread.title),
          `${book.id}/${spread.id} title`,
        );
        assert.ok(
          index.includes(spread.source),
          `${book.id}/${spread.id} source`,
        );
        assert.ok(
          index.includes(spread.stagingNote),
          `${book.id}/${spread.id} stage write-up`,
        );
        for (const segment of spread.segments)
          assert.ok(
            index.includes(segment.text),
            `${book.id}/${spread.id} text`,
          );
        for (const element of spread.elements)
          if (element.motion)
            assert.ok(
              index.includes(element.motion.preset),
              `${book.id}/${spread.id} motion ${element.motion.preset}`,
            );
      }
      for (const locale of book.languages ?? [book.locale]) {
        const localized = resolveBook(book, locale);
        assert.ok(
          index.includes(`### ${locale}:`),
          `${book.id} locale ${locale}`,
        );
        for (const spread of localized.spreads)
          for (const segment of spread.segments) {
            assert.ok(
              index.includes(segment.text),
              `${book.id}/${locale}/${spread.id} localized text`,
            );
            if (segment.narration)
              assert.ok(
                index.includes(book.assets[segment.narration.asset].src),
                `${book.id}/${locale}/${spread.id} localized voice file`,
              );
          }
      }
      for (const asset of Object.values(book.assets)) {
        assert.ok(
          fs.existsSync(`public/${asset.src}`),
          `${book.id} media file ${asset.src}`,
        );
        assert.ok(index.includes(asset.src), `${book.id} asset ${asset.src}`);
      }
      for (const source of repositoryFiles(`assets/books/${book.id}`))
        assert.ok(index.includes(source), `${book.id} source file ${source}`);
      assert.ok(index.includes("src/authored-stage.ts"));
      assert.ok(index.includes("src/book-animation.ts"));
      assert.ok(index.includes("src/book-reader-audio.ts"));
      for (const soundtrack of book.soundtracks ?? []) {
        assert.ok(index.includes(soundtrack.id), `${book.id} soundtrack ID`);
        assert.ok(
          index.includes(soundtrack.startPage),
          `${book.id} soundtrack start`,
        );
        assert.ok(
          index.includes(soundtrack.endPage),
          `${book.id} soundtrack end`,
        );
        assert.ok(index.includes(`${soundtrack.fadeIn}s fade in`));
        assert.ok(index.includes(`${soundtrack.fadeOut}s fade out`));
        assert.ok(
          index.includes(soundtrack.loop ? "loops" : "plays once"),
          `${book.id} soundtrack playback mode`,
        );
      }
    }
  }
});
