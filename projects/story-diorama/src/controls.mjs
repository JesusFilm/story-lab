/** Optional transport UI. Importing the player alone never creates buttons. */
const defaults = {
  play: "Play",
  pause: "Pause",
  resume: "Resume",
  next: "Next",
  reveal: "Reveal text",
  replay: "Replay",
  mute: "Mute sound",
  unmute: "Enable sound",
  volume: "Volume",
  retryAudio: "Retry sound",
};
const names = ["play", "pause", "next", "replay", "mute", "volume"];

/** Bind your own markup. No global keyboard handlers, HTML replacement, or global IDs. */
export function bindControls(root, player, options = {}) {
  const labels = { ...defaults, ...options.labels };
  const nodes = [...root.querySelectorAll("[data-sd-action]")];
  const removers = [];
  let removed = false;
  const act = {
    play: () =>
      player.getState().paused ? player.pause(false) : player.start(),
    pause: () => player.pause(),
    next: () => player.next(),
    replay: () => player.start(),
    mute: () => player.setMuted(!player.getState().muted),
    volume: (event) => player.setVolume(Number(event.currentTarget.value)),
    retryAudio: () => player.retryAudio(),
  };
  for (const node of nodes) {
    const name = node.dataset.sdAction;
    if (!act[name]) continue;
    const type = name === "volume" ? "input" : "click";
    node.addEventListener(type, act[name]);
    removers.push(() => node.removeEventListener(type, act[name]));
  }
  const update = () => {
    const s = player.getState();
    const live = s.running && s.phase !== "complete";
    for (const node of nodes) {
      const name = node.dataset.sdAction;
      const text =
        name === "pause" && s.paused
          ? labels.resume
          : name === "mute" && s.muted
            ? labels.unmute
            : name === "next" && s.phase === "revealing"
              ? labels.reveal
              : labels[name];
      if (text) {
        node.setAttribute("aria-label", text);
        // Only opt-in label spans change: SVG icons and custom markup are preserved.
        const span = node.querySelector("[data-sd-label]");
        if (span && span.textContent !== text) span.textContent = text;
      }
      if (name === "pause" || name === "next")
        node.disabled = !live || (name === "next" && s.paused);
      if (name === "play") node.disabled = live && !s.paused;
      if (name === "mute") node.setAttribute("aria-pressed", String(s.muted));
      if (name === "volume") node.value = String(s.volume);
    }
  };
  const destroy = () => {
    if (removed) return;
    removed = true;
    removers.forEach((remove) => remove());
    for (const event of ["state", "pause", "complete"])
      player.removeEventListener(event, update);
    player.removeEventListener("destroy", destroy);
  };
  for (const event of ["state", "pause", "complete"])
    player.addEventListener(event, update);
  player.addEventListener("destroy", destroy);
  update();
  return { destroy };
}

/** Create only the controls explicitly requested (defaults to all six). */
export function createControls(root, player, options = {}) {
  const controls = options.controls ?? names;
  if (
    !Array.isArray(controls) ||
    controls.some((name) => !names.includes(name))
  )
    throw new TypeError("Unknown Story Diorama control.");
  const bar = document.createElement("div");
  bar.className = "sd-controls";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", options.label || "Story controls");
  const labels = { ...defaults, ...options.labels };
  for (const name of controls) {
    if (name === "volume") {
      const label = document.createElement("label");
      label.textContent = labels.volume;
      const input = document.createElement("input");
      input.type = "range";
      input.min = "0";
      input.max = "1";
      input.step = ".01";
      input.dataset.sdAction = name;
      label.append(input);
      bar.append(label);
    } else {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.sdAction = name;
      const span = document.createElement("span");
      span.dataset.sdLabel = "";
      span.textContent = labels[name];
      button.append(span);
      bar.append(button);
    }
  }
  root.append(bar);
  const binding = bindControls(bar, player, options);
  const destroy = () => {
    binding.destroy();
    bar.remove();
    player.removeEventListener("destroy", destroy);
  };
  player.addEventListener("destroy", destroy);
  return { element: bar, destroy };
}
