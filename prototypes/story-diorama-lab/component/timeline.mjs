export const defaults = {
  mode: "auto",
  reveal: "typewriter",
  speed: 32,
  hold: 3500,
  fade: 700,
  transition: "dissolve",
  transitionMs: 1200,
  loop: false,
};
const enums = {
  mode: ["auto", "manual"],
  reveal: ["typewriter", "scroll", "instant"],
  transition: ["dissolve", "fade", "drift", "cut"],
};
function validateOptions(options, where) {
  for (const [key, values] of Object.entries(enums))
    if (options[key] !== undefined && !values.includes(options[key]))
      throw new TypeError(`${where}: invalid ${key}.`);
  for (const key of ["speed", "hold", "fade", "transitionMs"])
    if (
      options[key] !== undefined &&
      (!Number.isFinite(options[key]) ||
        options[key] < (key === "speed" ? 1 : 0))
    )
      throw new TypeError(
        `${where}: ${key} must be a finite ${key === "speed" ? "positive" : "non-negative"} number.`,
      );
  if (options.loop !== undefined && typeof options.loop !== "boolean")
    throw new TypeError(`${where}: loop must be boolean.`);
}
export class Timeline {
  constructor(cues, options = {}) {
    if (!Array.isArray(cues) || !cues.length)
      throw new Error("A story needs at least one cue.");
    cues.forEach((c, i) => {
      if (!c || typeof c.text !== "string")
        throw new Error(`Cue ${i + 1} needs text.`);
    });
    validateOptions(options, "Player options");
    cues.forEach((cue, index) => {
      validateOptions(cue.options || {}, `Cue ${index + 1}`);
      if (cue.options?.loop !== undefined)
        throw new TypeError(
          "Story loop belongs in player options, not cue options.",
        );
      if (cue.music !== undefined && cue.music !== null) {
        const music = cue.music;
        if (typeof music.src !== "string" || !music.src.trim())
          throw new TypeError(`Cue ${index + 1}: music needs a src URL.`);
        for (const key of ["fade", "delay", "duration", "offset", "volume"])
          if (
            music[key] !== undefined &&
            (!Number.isFinite(music[key]) ||
              music[key] < 0 ||
              (key === "volume" && music[key] > 1))
          )
            throw new TypeError(`Cue ${index + 1}: invalid music ${key}.`);
        if (music.loop !== undefined && typeof music.loop !== "boolean")
          throw new TypeError(`Cue ${index + 1}: music loop must be boolean.`);
      }
    });
    this.cues = cues;
    this.options = { ...defaults, ...options };
    this.index = 0;
    this.elapsed = 0;
    this.paused = false;
    this.finished = false;
    this.leaving = false;
  }
  get cue() {
    return this.cues[this.index];
  }
  get settings() {
    return { ...this.options, ...this.cue.options };
  }
  get duration() {
    const s = this.settings;
    return s.reveal === "instant"
      ? 0
      : (Array.from(this.cue.text).length / Math.max(1, s.speed)) * 1000;
  }
  get phase() {
    if (this.finished) return "complete";
    if (this.elapsed < this.duration) return "revealing";
    if (this.leaving) return "fading";
    if (this.settings.mode === "manual") return "waiting";
    if (this.elapsed < this.duration + this.settings.hold) return "holding";
    return "fading";
  }
  get progress() {
    return this.duration ? Math.min(1, this.elapsed / this.duration) : 1;
  }
  tick(ms) {
    if (this.paused || this.finished) return false;
    this.elapsed += Math.max(0, ms);
    if (
      (this.settings.mode === "auto" || this.leaving) &&
      this.elapsed >= this.duration + this.settings.hold + this.settings.fade
    )
      return this.advance();
    return false;
  }
  advance() {
    if (this.finished) return false;
    if (this.index === this.cues.length - 1) {
      if (this.options.loop) this.index = 0;
      else {
        this.finished = true;
        return true;
      }
    } else this.index++;
    this.elapsed = 0;
    this.leaving = false;
    return true;
  }
  next() {
    if (this.finished || this.paused) return false;
    if (this.progress < 1) {
      this.elapsed = this.duration;
      return false;
    }
    if (this.leaving) return false;
    if (this.settings.fade > 0) {
      this.leaving = true;
      this.elapsed = this.duration + this.settings.hold;
      return false;
    }
    return this.advance();
  }
  seek(index) {
    if (!Number.isInteger(index))
      throw new TypeError("Cue index must be an integer.");
    this.index = Math.max(0, Math.min(this.cues.length - 1, index));
    this.elapsed = 0;
    this.finished = false;
    this.leaving = false;
  }
}
