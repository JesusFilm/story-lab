import { Timeline } from "./timeline.mjs";
import { applyAppearance, mergeAppearance } from "./appearance.mjs";
// All fades and cue delays use the same pausable story clock.
export class StoryDiorama extends EventTarget {
  constructor(root, story, options = {}) {
    super();
    if (!root || root.nodeType !== 1)
      throw new TypeError("StoryDiorama requires a dedicated HTML container.");
    this.timeline = new Timeline(story?.cues, options);
    this.root = root;
    this.story = story;
    this.options = { ...options };
    this.appearance = mergeAppearance(options.appearance);
    this.voices = [];
    this.muted = false;
    this.volume = 0.65;
    this.time = 0;
    this.running = false;
    this.destroyed = false;
    this.hadClass = root.classList.contains("story-diorama");
    root.classList.add("story-diorama");
    root.innerHTML =
      '<div class="sd-art"><img class="sd-back" alt=""><img class="sd-front" alt=""></div><div class="sd-shade"></div><div class="sd-caption"><div class="sd-stack"><div class="sd-heading"><p class="sd-number"></p><p class="sd-chapter"></p></div><div class="sd-window"><p class="sd-text" aria-hidden="true"></p></div><div class="sd-meta"><p class="sd-reference"></p><p class="sd-version"></p></div></div></div><p class="sd-sr" aria-live="polite"></p>';
    for (const name of [
      "back",
      "front",
      "shade",
      "caption",
      "stack",
      "heading",
      "meta",
      "number",
      "chapter",
      "text",
      "reference",
      "version",
      "window",
      "sr",
    ]) {
      this[name] = root.querySelector(".sd-" + name);
    }
    this.elements = {
      number: this.number,
      title: this.chapter,
      text: this.window,
      reference: this.reference,
      version: this.version,
    };
    this.homes = {
      number: this.heading,
      title: this.heading,
      text: this.stack,
      reference: this.meta,
      version: this.meta,
    };
    this.compact = root.clientWidth <= 650;
    // Observe the embedded player, not the browser viewport: a small game panel is compact too.
    this.resizeObserver = new ResizeObserver(([entry]) => {
      const compact = entry.contentRect.width <= 650;
      if (compact !== this.compact) {
        this.compact = compact;
        applyAppearance(this);
      }
    });
    this.resizeObserver.observe(root);
    this.preview();
    this.visibility = () => {
      if (document.hidden && this.running && !this.timeline.paused)
        this.pause(true);
    };
    document.addEventListener("visibilitychange", this.visibility);
  }
  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
  /** Snapshot for host-owned controls. Does not expose mutable timeline internals. */
  getState() {
    return {
      phase: this.started ? this.timeline.phase : "idle",
      index: this.timeline.index,
      progress: this.started ? this.timeline.progress : 0,
      paused: this.timeline.paused,
      running: this.running,
      muted: this.muted,
      volume: this.volume,
      total: this.story.cues.length,
    };
  }
  setAppearance(patch) {
    this.assertAlive();
    this.appearance = mergeAppearance(this.appearance, patch);
    applyAppearance(this);
    this.emit("appearance", this.resolvedAppearance);
  }
  assertAlive() {
    if (this.destroyed)
      throw new Error(
        "This StoryDiorama has been destroyed. Create a new instance.",
      );
  }
  preview() {
    const cue = this.timeline.cue;
    if (cue.image) {
      this.front.src = cue.image;
      this.front.alt = cue.alt || "";
      this.currentImage = cue.image;
    }
    this.imageStart = -Infinity;
    this.showContent();
    this.text.textContent = cue.text;
  }
  showContent() {
    const c = this.timeline.cue;
    for (const field of ["number", "title", "reference", "version"])
      this.elements[field].textContent = c[field] ?? "";
    this.sr.textContent = c.text;
    applyAppearance(this);
  }
  async preload(onProgress = () => {}) {
    this.assertAlive();
    const urls = [
      ...new Set(this.story.cues.map((c) => c.image).filter(Boolean)),
    ];
    let count = 0;
    await Promise.all(
      urls.map(
        (url) =>
          new Promise((resolve, reject) => {
            const img = new Image();
            const timeout = setTimeout(
              () => reject(new Error("Image timed out: " + url)),
              120000,
            );
            img.onload = () => {
              clearTimeout(timeout);
              onProgress(++count, urls.length);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(timeout);
              reject(new Error("Image could not load: " + url));
            };
            img.src = url;
          }),
      ),
    );
  }
  start(options = {}) {
    this.assertAlive();
    // Validate before stopping a currently playable story.
    const nextOptions = { ...this.options, ...options };
    const timeline = new Timeline(this.story.cues, nextOptions);
    this.stop();
    this.options = { ...this.options, ...options };
    this.timeline = timeline;
    if (options.appearance)
      this.appearance = mergeAppearance(this.appearance, options.appearance);
    this.started = true;
    this.currentImage = undefined;
    this.front.removeAttribute("src");
    this.back.removeAttribute("src");
    this.time = 0;
    this.finishing = false;
    this.running = true;
    this.last = performance.now();
    this.showCue();
    this.frame = requestAnimationFrame((t) => this.update(t));
  }
  releaseVoice(v) {
    v.audio.pause();
    v.audio.removeAttribute("src");
    v.audio.load();
  }
  stop() {
    cancelAnimationFrame(this.frame);
    this.voices.forEach((v) => this.releaseVoice(v));
    this.voices = [];
    this.pending = null;
    this.running = false;
    this.started = false;
    if (!this.destroyed) this.emit("state", this.getState());
  }
  destroy() {
    if (this.destroyed) return;
    this.stop();
    this.destroyed = true;
    document.removeEventListener("visibilitychange", this.visibility);
    this.resizeObserver.disconnect();
    this.root.replaceChildren();
    if (!this.hadClass) this.root.classList.remove("story-diorama");
    this.root.removeAttribute("data-phase");
    this.root.removeAttribute("data-sd-compact");
    this.emit("destroy", {});
  }
  pause(value = !this.timeline?.paused) {
    if (!this.running) return;
    this.timeline.paused = value;
    this.voices.forEach((v) => (value ? v.audio.pause() : this.play(v)));
    this.render();
    this.emit("pause", value);
  }
  setVolume(value) {
    if (!Number.isFinite(value))
      throw new TypeError("Volume must be a finite number.");
    this.volume = Math.max(0, Math.min(1, value));
    this.updateAudio(0);
    this.emit("state", this.getState());
  }
  setMuted(value) {
    this.muted = value;
    this.updateAudio(0);
    this.emit("state", this.getState());
  }
  play(v) {
    v.audio.play().catch((error) => {
      // A pause, seek or replay may cancel an in-flight play promise.
      if (error.name === "AbortError") return;
      if (this.voices.includes(v))
        this.emit("audioerror", {
          message: "Sound could not start. Use Retry sound or continue muted.",
          error,
        });
    });
  }
  retryAudio() {
    this.voices.forEach((v) => {
      v.audio.load();
      if (!this.timeline?.paused) this.play(v);
    });
  }
  next() {
    if (!this.running) return;
    if (this.timeline.next()) this.changed();
    else this.render();
  }
  seek(index) {
    if (!this.running) return;
    if (!Number.isInteger(index))
      throw new TypeError("Cue index must be an integer.");
    this.timeline.seek(index);
    index = this.timeline.index;
    this.finishing = false;
    this.voices.forEach((v) => this.releaseVoice(v));
    this.voices = [];
    this.pending = null;
    // Reconstruct inherited soundtrack when jumping into the middle of a section.
    let music;
    for (let i = 0; i <= index; i++)
      if (this.story.cues[i].music !== undefined)
        music = this.story.cues[i].music;
    // Reconstruct inherited visual content as well as the soundtrack.
    const visual = this.story.cues
      .slice(0, index + 1)
      .reverse()
      .find((c) => c.image);
    this.currentImage = visual?.image;
    if (visual) {
      this.front.src = visual.image;
      this.front.alt = visual.alt || "";
    } else {
      this.front.removeAttribute("src");
      this.back.removeAttribute("src");
    }
    this.showCue(music);
  }
  changed() {
    if (this.timeline.finished) {
      this.render();
      this.finishing = true;
      this.pending = null;
      this.cueMusic({ stop: true, fade: 1800 });
      this.emit("complete", {});
    } else this.showCue();
  }
  showCue(inherited) {
    const c = this.timeline.cue,
      s = this.timeline.settings;
    this.cueStart = this.time;
    const image = c.image || this.currentImage;
    this.transition = s.transition;
    this.transitionMs = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : s.transitionMs;
    if (image !== this.currentImage) {
      this.back.src = this.currentImage || image;
      this.front.src = image;
      this.front.alt = c.alt || "";
      this.currentImage = image;
      this.imageStart = this.time;
    } else this.imageStart = -Infinity;
    this.window.scrollTop = 0;
    this.showContent();
    const music = inherited === undefined ? c.music : inherited;
    if (music !== undefined) {
      this.pending = music
        ? { ...music, at: this.time + (music.delay || 0) }
        : { stop: true, at: this.time };
    }
    this.render();
    this.emit("cue", { index: this.timeline.index, cue: c });
  }
  cueMusic(c) {
    const fade = c.fade ?? 1800;
    this.voices.forEach((v) => {
      v.from = v.level;
      v.to = 0;
      v.age = 0;
      v.fade = fade;
    });
    if (c.stop) {
      this.emit("music", { ...c });
      return;
    }
    const audio = new Audio(c.src);
    // Native streaming decode is opaque. Record readiness/stalls, not invented
    // PCM bytes or decode duration, for the optional phone diagnostic export.
    for (const type of ["loadstart", "loadedmetadata", "canplay", "playing", "waiting", "stalled", "ended"])
      audio.addEventListener(type, () => window.shepherdStartup?.mark("story-audio-" + type, {
        readyState: audio.readyState, networkState: audio.networkState, mediaSeconds: audio.currentTime
      }));
    audio.loop = !!c.loop;
    audio.preload = "none";
    audio.volume = 0;
    audio.muted = this.muted;
    const v = {
      audio,
      level: 0,
      from: 0,
      to: c.volume ?? 0.55,
      age: 0,
      fade,
      life: 0,
      duration: c.duration,
      ending: false,
    };
    audio.addEventListener("error", () => {
      if (this.voices.includes(v))
        this.emit("audioerror", {
          message: "Music failed to load. Retry sound or continue muted.",
        });
    });
    if (c.offset)
      audio.addEventListener(
        "loadedmetadata",
        () => {
          audio.currentTime = Math.min(c.offset, audio.duration || c.offset);
        },
        { once: true },
      );
    this.voices.push(v);
    if (!this.timeline.paused) this.play(v);
    this.emit("music", { ...c });
  }
  updateAudio(dt) {
    this.voices = this.voices.filter((v) => {
      v.age += dt;
      v.life += dt;
      if (v.duration !== undefined && !v.ending && v.life >= v.duration) {
        v.ending = true;
        v.from = v.level;
        v.to = 0;
        v.age = 0;
      }
      const p = v.fade ? Math.min(1, v.age / v.fade) : 1;
      v.level = v.from + (v.to - v.from) * p;
      v.audio.volume = Math.max(0, Math.min(1, v.level * this.volume));
      v.audio.muted = this.muted;
      if ((v.to === 0 && p === 1) || v.audio.ended) {
        this.releaseVoice(v);
        return false;
      }
      return true;
    });
  }
  update(now) {
    if (!this.running) return;
    const dt = Math.min(now - this.last, 250);
    this.last = now;
    if (!this.timeline.paused) {
      this.time += dt;
      if (this.timeline.tick(dt)) this.changed();
      if (this.pending && this.time >= this.pending.at) {
        this.cueMusic(this.pending);
        this.pending = null;
      }
      this.updateAudio(dt);
      if (!this.finishing) this.render();
      if (this.finishing && !this.voices.length) this.running = false;
    }
    if (this.running) this.frame = requestAnimationFrame((t) => this.update(t));
  }
  render() {
    const t = this.timeline,
      c = t.cue,
      s = t.settings;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const progress = reduced ? 1 : t.progress;
    const chars = Array.from(c.text);
    this.text.textContent =
      s.reveal === "typewriter"
        ? chars.slice(0, Math.ceil(chars.length * progress)).join("")
        : c.text;
    if (s.reveal === "scroll" && t.phase === "revealing")
      this.window.scrollTop =
        Math.max(0, this.text.scrollHeight - this.window.clientHeight) *
        progress;
    else if (s.reveal === "typewriter" && t.phase === "revealing")
      this.window.scrollTop = this.text.scrollHeight;
    this.caption.style.opacity =
      t.phase === "fading"
        ? String(
            Math.max(
              0,
              1 - (t.elapsed - t.duration - s.hold) / Math.max(1, s.fade),
            ),
          )
        : "1";
    let p = this.transitionMs
      ? Math.min(1, (this.time - this.imageStart) / this.transitionMs)
      : 1;
    this.front.style.opacity =
      this.transition === "cut"
        ? "1"
        : String(this.transition === "fade" ? Math.max(0, p * 2 - 1) : p);
    this.back.style.opacity =
      this.transition === "fade" ? String(Math.max(0, 1 - p * 2)) : "1";
    this.front.style.transform =
      this.transition === "drift" && !reduced
        ? `scale(${1.04 - 0.04 * p})`
        : "none";
    this.root.dataset.phase = t.phase;
    this.emit("state", this.getState());
  }
}
