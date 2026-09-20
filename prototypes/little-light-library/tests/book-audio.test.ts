import assert from "node:assert/strict";
import test from "node:test";
import { BookAudio, buildBookTimeline } from "../src/book-audio";
import type { AuthoredBook } from "../src/authored-book";

function book(): AuthoredBook {
  return {
    format: "little-light-book",
    version: 1,
    id: "audio-test",
    title: "Audio test",
    subtitle: "A test",
    locale: "en-US",
    status: "draft",
    source: "Test source",
    retellingNote: "Test retelling",
    cover: "picture",
    assets: {
      picture: { kind: "image", src: "art/picture.png", attribution: "Test" },
      first: { kind: "audio", src: "audio/first.wav", attribution: "Test" },
      second: { kind: "audio", src: "audio/second.wav", attribution: "Test" },
      music: { kind: "audio", src: "audio/music.mp3", attribution: "Test" },
    },
    spreads: [
      {
        id: "one",
        title: "One",
        source: "Test",
        stagingNote: "Test",
        seconds: 8,
        backdrop: { asset: "picture" },
        elements: [],
        segments: [
          {
            id: "first",
            text: "First line.",
            narration: {
              asset: "first",
              recordedText: "First line.",
              duration: 2,
              voice: "Test",
            },
          },
        ],
      },
      {
        id: "two",
        title: "Two",
        source: "Test",
        stagingNote: "Test",
        seconds: 2,
        backdrop: { asset: "picture" },
        elements: [],
        segments: [
          {
            id: "second",
            text: "Second line.",
            narration: {
              asset: "second",
              recordedText: "Second line.",
              duration: 3,
              voice: "Test",
            },
          },
        ],
      },
    ],
    narrationVolume: 0.75,
    soundtracks: [
      {
        id: "theme",
        label: "Theme",
        asset: "music",
        startPage: "one",
        endPage: "two",
        startOffset: 1,
        endOffset: 1,
        volume: 0.4,
        fadeIn: 2,
        fadeOut: 1,
        loop: false,
      },
    ],
  };
}

test("timeline uses measured narration, page minima, inclusive soundtrack ranges and natural ends", () => {
  const timeline = buildBookTimeline(book(), {
    first: 2.5,
    second: 3.5,
    music: 4,
  });
  assert.deepEqual(timeline.pages, [
    {
      id: "one",
      index: 0,
      start: 0,
      end: 8,
      duration: 8,
      segmentDurations: [2.5],
    },
    {
      id: "two",
      index: 1,
      start: 8,
      end: 11.5,
      duration: 3.5,
      segmentDurations: [3.5],
    },
  ]);
  assert.equal(timeline.total, 11.5);
  assert.deepEqual(
    timeline.clips.map(({ id, kind, start, end, volume, loop }) => ({
      id,
      kind,
      start,
      end,
      volume,
      loop,
    })),
    [
      {
        id: "one:first",
        kind: "narration",
        start: 0,
        end: 2.5,
        volume: 0.75,
        loop: false,
      },
      {
        id: "two:second",
        kind: "narration",
        start: 8,
        end: 11.5,
        volume: 0.75,
        loop: false,
      },
      {
        id: "theme",
        kind: "soundtrack",
        start: 1,
        end: 5,
        volume: 0.4,
        loop: false,
      },
    ],
  );
});

test("one missing or stale narration suppresses the whole page but preserves phrase timing", () => {
  const fixture = book();
  fixture.spreads[0].segments.push({ id: "silent", text: "No recording." });
  fixture.spreads[1].segments[0].narration!.recordedText = "Old words.";
  const timeline = buildBookTimeline(fixture, { first: 2.25, second: 3.25 });
  assert.deepEqual(timeline.pages[0].segmentDurations, [2.25, 0]);
  assert.deepEqual(timeline.pages[1].segmentDurations, [3.25]);
  assert.equal(
    timeline.clips.filter((clip) => clip.kind === "narration").length,
    0,
  );
});

test("looped soundtracks fill their trimmed page range and invalid timing throws", () => {
  const fixture = book();
  fixture.soundtracks![0].loop = true;
  const timeline = buildBookTimeline(fixture, { music: 0.5 });
  const theme = timeline.clips.find((clip) => clip.id === "theme")!;
  assert.deepEqual([theme.start, theme.end], [1, 10]);

  fixture.soundtracks![0].startOffset = 20;
  assert.throws(() => buildBookTimeline(fixture), /no playable time/);
  fixture.soundtracks![0].startOffset = -1;
  assert.throws(() => buildBookTimeline(fixture), /non-negative/);
});

type FakeParameter = {
  value: number;
  events: Array<[string, number, number?]>;
  cancelScheduledValues(time: number): void;
  setValueAtTime(value: number, time: number): void;
  linearRampToValueAtTime(value: number, time: number): void;
};

function fakeContext(durations = [2, 3, 4]) {
  const sources: Array<{
    buffer?: { duration: number };
    loop: boolean;
    playbackRate: { value: number };
    stopped: boolean;
    when?: number;
    offset?: number;
    duration?: number;
    connect(node: unknown): unknown;
    disconnect(): void;
    stop(): void;
    start(when: number, offset: number, duration: number): void;
  }> = [];
  const gains: Array<{
    gain: FakeParameter;
    connect(node: unknown): unknown;
    disconnect(): void;
  }> = [];
  let decodeIndex = 0;
  const parameter = (): FakeParameter => ({
    value: 1,
    events: [],
    cancelScheduledValues(time) {
      this.events.push(["cancel", time]);
    },
    setValueAtTime(value, time) {
      this.events.push(["set", time, value]);
    },
    linearRampToValueAtTime(value, time) {
      this.events.push(["ramp", time, value]);
    },
  });
  const context = {
    currentTime: 0,
    destination: {},
    resume: async () => {},
    createGain() {
      const gain = {
        gain: parameter(),
        connect: (node: unknown) => node,
        disconnect() {},
      };
      gains.push(gain);
      return gain;
    },
    createBufferSource() {
      const source = {
        loop: false,
        playbackRate: { value: 1 },
        stopped: false,
        connect: (node: unknown) => node,
        disconnect() {},
        stop() {
          this.stopped = true;
        },
        start(when: number, offset: number, duration: number) {
          Object.assign(this, { when, offset, duration });
        },
      };
      sources.push(source);
      return source;
    },
    async decodeAudioData() {
      return { duration: durations[decodeIndex++] };
    },
  };
  return { context, sources, gains };
}

async function withFetch(run: () => Promise<void>) {
  const original = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    return {
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(1),
    } as Response;
  };
  try {
    await run();
  } finally {
    globalThis.fetch = original;
  }
  return urls;
}

test("player loads serial assets and schedules bounded clips with fades and master volume", async () => {
  const fake = fakeContext();
  const player = new BookAudio(fake.context as unknown as AudioContext);
  const urls = await withFetch(async () => {
    assert.equal(await player.load(book()), true);
    player.setRange(0, 2);
    player.seek(0.5);
    player.volume(0.6, true);
    await player.play();
  });
  assert.deepEqual(urls, [
    "./audio/first.wav",
    "./audio/second.wav",
    "./audio/music.mp3",
  ]);
  assert.equal(fake.gains[0].gain.value, 0.6);
  assert.equal(fake.sources.length, 2);
  assert.deepEqual(
    fake.sources.map(({ when, offset, duration, loop, playbackRate }) => ({
      when,
      offset,
      duration,
      loop,
      rate: playbackRate.value,
    })),
    [
      { when: 0, offset: 0.5, duration: 1.5, loop: false, rate: 1 },
      { when: 0.5, offset: 0, duration: 1, loop: false, rate: 1 },
    ],
  );
  const soundtrackGain = fake.gains[2].gain.events;
  assert.deepEqual(soundtrackGain.slice(0, 2), [
    ["cancel", 0.5],
    ["set", 0.5, 0],
  ]);
});

test("resume midway through a fade, seek and speed reschedule from content time", async () => {
  const fake = fakeContext();
  const player = new BookAudio(fake.context as unknown as AudioContext);
  await withFetch(async () => player.load(book()).then(() => undefined));
  player.seek(1.5);
  await player.play();
  const soundtrack = fake.sources[2];
  assert.equal(soundtrack.offset, 0.5);
  assert.deepEqual(fake.gains[3].gain.events.slice(0, 2), [
    ["cancel", 0],
    ["set", 0, 0.1],
  ]);

  fake.context.currentTime = 0.5;
  assert.equal(player.position, 2);
  player.speed(2);
  assert.ok(fake.sources.slice(0, 3).every((source) => source.stopped));
  assert.equal(fake.sources[4].offset, 1);
  assert.equal(fake.sources[4].playbackRate.value, 2);
  assert.equal(fake.sources[4].duration, 1.5);
  player.seek(4);
  assert.equal(player.position, 4);
  player.pause();
  assert.equal(player.playing, false);
});

test("pause and stop invalidate late resume and load completions", async () => {
  const fake = fakeContext();
  const player = new BookAudio(fake.context as unknown as AudioContext);
  await withFetch(async () => player.load(book()).then(() => undefined));
  let releaseResume!: () => void;
  fake.context.resume = () =>
    new Promise<void>((resolve) => (releaseResume = resolve));
  const pendingPlay = player.play();
  player.pause();
  releaseResume();
  await pendingPlay;
  assert.equal(fake.sources.length, 0);

  let releaseFetch!: () => void;
  const original = globalThis.fetch;
  globalThis.fetch = () =>
    new Promise<Response>((resolve) => {
      releaseFetch = () =>
        resolve({
          ok: true,
          arrayBuffer: async () => new ArrayBuffer(1),
        } as Response);
    });
  try {
    const pendingLoad = player.load(book());
    player.stop();
    releaseFetch();
    assert.equal(await pendingLoad, false);
    assert.equal(player.timeline.total, 0);
  } finally {
    globalThis.fetch = original;
  }
});
