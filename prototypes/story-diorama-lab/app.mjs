import { StoryDiorama } from "./component/story-diorama.mjs";
import { story as original } from "./story.mjs";
const $ = (id) => document.getElementById(id),
  lab = document.body.dataset.lab === "true";
let story = structuredClone(original),
  player,
  mode = "auto",
  active = false;
const options = {
  mode: "auto",
  reveal: "typewriter",
  speed: 32,
  hold: 3500,
  fade: 700,
  transition: "dissolve",
  transitionMs: 1600,
  loop: false,
};
const chapterNames = [
  "The calling",
  "A living cargo",
  "The deep",
  "Remembered",
];
const transcript = $("transcript");
original.cues.forEach((c) => {
  const p = document.createElement("p");
  p.textContent = c.text + " — " + c.reference + " · " + c.version;
  transcript.append(p);
});
const chapters = document.querySelector(".chapters");
[0, 2, 4, 6].forEach((index, i) => {
  const button = document.createElement("button");
  button.className = "chapter";
  button.setAttribute("aria-label", "Jump to " + chapterNames[i]);
  const img = new Image();
  img.src = original.cues[index].image;
  img.alt = "";
  const label = document.createElement("span");
  label.textContent = `0${i + 1} / ${chapterNames[i]}`;
  button.append(img, label);
  button.onclick = () => {
    if (!active) start(mode);
    player.seek(index);
  };
  chapters.append(button);
});
function log(message) {
  const el = $("event-log");
  if (el) el.textContent = (message + "\n" + el.textContent).slice(0, 3500);
}
function setup() {
  player?.destroy();
  player = new StoryDiorama($("diorama"), story, options);
  player.setVolume(Number($("volume").value) / 100);
  player.setMuted($("mute").getAttribute("aria-pressed") === "true");
  player.addEventListener("state", ({ detail: s }) => {
    $("status").textContent =
      `${s.index + 1} / ${story.cues.length} · ${s.paused ? "Paused" : s.phase === "waiting" ? "Your pace" : s.phase}`;
    $("next").textContent =
      s.phase === "revealing"
        ? "Reveal text"
        : s.index === story.cues.length - 1
          ? "Finish →"
          : "Next →";
  });
  player.addEventListener("cue", ({ detail: { index, cue } }) => {
    [...chapters.children].forEach((el, i) =>
      el.classList.toggle("active", i === Math.floor(index / 2)),
    );
    log(`Cue ${index + 1}: ${cue.title}`);
  });
  player.addEventListener("music", ({ detail: c }) =>
    log(
      c.stop
        ? "Music → fade to silence"
        : `Music → ${c.name} · ${c.loop ? "loop" : "once"}`,
    ),
  );
  player.addEventListener("pause", ({ detail: value }) => {
    $("pause").textContent = value ? "Resume" : "Pause";
    log(value ? "Paused" : "Resumed");
  });
  player.addEventListener("complete", () => {
    active = false;
    $("pause").disabled = true;
    $("next").disabled = true;
    $("status").textContent = "Story complete · Replay anytime";
    log("Story complete");
  });
  player.addEventListener("audioerror", ({ detail: e }) => {
    $("audio-alert").hidden = false;
    $("audio-alert").querySelector("span").textContent = e.message;
  });
}
function start(selectedMode) {
  mode = selectedMode;
  active = true;
  $("start-card").hidden = true;
  ["pause", "next", "replay"].forEach((id) => ($(id).disabled = false));
  $("pause").textContent = "Pause";
  player.start({ ...options, mode });
  log(`Start → ${mode}`);
}
$("start-auto").onclick = () => start("auto");
$("start-manual").onclick = () => start("manual");
$("pause").onclick = () => player.pause();
$("next").onclick = () => player.next();
$("replay").onclick = () => start(mode);
$("mute").onclick = () => {
  const muted = $("mute").getAttribute("aria-pressed") !== "true";
  $("mute").setAttribute("aria-pressed", String(muted));
  $("mute").textContent = muted ? "Sound off" : "Sound on";
  player.setMuted(muted);
};
$("volume").oninput = () => player.setVolume(Number($("volume").value) / 100);
$("retry-audio").onclick = () => {
  $("audio-alert").hidden = true;
  player.retryAudio();
};
$("silent").onclick = () => {
  $("audio-alert").hidden = true;
  if ($("mute").getAttribute("aria-pressed") !== "true") $("mute").click();
};
document.addEventListener("keydown", (e) => {
  if (
    ["INPUT", "SELECT", "TEXTAREA", "BUTTON", "A", "SUMMARY"].includes(
      e.target.tagName,
    ) ||
    e.altKey ||
    e.metaKey ||
    e.ctrlKey
  )
    return;
  if (e.code === "Space" && active) {
    e.preventDefault();
    player.next();
  }
  if (e.code === "KeyP" && active) player.pause();
});
if (lab) {
  $("layout").className = "lab-grid";
  $("lab-panel").hidden = false;
  $("lab-panel").innerHTML =
    `<p class="eyebrow">The same component, under your control</p><h2>Playback studio</h2>
 <label>Advance<select id="mode"><option value="auto">Automatic · start to finish</option><option value="manual">Manual · wait for input</option></select></label>
 <label>Text presentation<select id="reveal"><option value="typewriter">Typewriter</option><option value="scroll">Vertical scroll</option><option value="instant">Instant</option></select></label>
 <label>Image transition<select id="transition"><option value="dissolve">Dissolve</option><option value="fade">Fade through black</option><option value="drift">Dissolve + gentle drift</option><option value="cut">Cut</option></select></label>
 <label>Reveal speed · characters/sec<input id="speed" type="number" min="1" max="200" value="32"></label>
 <label>Hold after reveal · seconds<input id="hold" type="number" min="0" max="60" step=".5" value="3.5"></label>
 <label>Text fade · seconds<input id="fade" type="number" min="0" max="5" step=".1" value=".7"></label>
 <label>Image transition · seconds<input id="transitionMs" type="number" min="0" max="10" step=".1" value="1.6"></label>
 <details class="music-settings"><summary>Soundtrack timing &amp; playback</summary><label>Music behavior<select id="music-mode"><option value="authored">Authored changes + silence</option><option value="continuous">One track across all cues</option><option value="each">Restart music on every cue</option><option value="none">Silence</option></select></label>
 <label>Music repeats<select id="music-loop"><option value="authored">As authored</option><option value="loop">Loop each track</option><option value="once">Play each track once</option></select></label>
 <label>Music delay · seconds<input id="music-delay" type="number" min="0" max="30" step=".5" value="0"></label>
 <label>Music fade · seconds<input id="music-fade" type="number" min="0" max="10" step=".5" value="2"></label>
 <label>Music excerpt · seconds (0 = whole track)<input id="music-duration" type="number" min="0" max="300" value="0"></label>
 <label>Start within track · seconds<input id="music-offset" type="number" min="0" max="200" value="0"></label>
 </details><label class="check"><input id="loop" type="checkbox"> Replay story continuously</label>
 <button id="apply" class="primary">Apply &amp; restart story</button><p>Settings take effect on restart. Pause freezes text, delays and music fades. Chapter cards jump to a scene. Vertical scroll uses longer passages below.</p>
 <details><summary>Cue &amp; music events</summary><pre id="event-log"></pre></details>`;
  const appearancePanel = document.createElement("details");
  appearancePanel.innerHTML = `<summary>Appearance &amp; game controls</summary>
    <label>Font family<input id="appearance-font" type="text" value="Georgia, serif" placeholder="YourGameFont, serif"></label>
    <p>Updates live. Use a CSS font stack; load custom font files in your game. Positions are relative to the diorama.</p>
    <div id="appearance-fields"></div>
    <p>Show game controls (the host owns these):</p><div id="appearance-controls"></div>
    <button id="appearance-reset" type="button">Reset presentation</button>`;
  $("apply").before(appearancePanel);
  const fieldNames = {
    number: "Scene number",
    title: "Scene title",
    text: "Passage text",
    reference: "Scripture reference",
    version: "Bible version",
  };
  const positions = {
    stack: null,
    "top-left": {
      left: "7%",
      right: "7%",
      top: "7%",
      bottom: "auto",
      maxWidth: "85%",
    },
    "top-right": {
      right: "7%",
      left: "auto",
      top: "7%",
      bottom: "auto",
      maxWidth: "85%",
    },
    "bottom-left": {
      left: "7%",
      right: "7%",
      bottom: "7%",
      top: "auto",
      maxWidth: "85%",
    },
    "bottom-right": {
      right: "7%",
      left: "auto",
      bottom: "7%",
      top: "auto",
      maxWidth: "85%",
    },
    center: {
      left: "10%",
      right: "10%",
      top: "45%",
      bottom: "auto",
      maxWidth: "80%",
    },
  };
  const refreshAppearance = () => {
    const appearance = { fontFamily: $("appearance-font").value };
    for (const name of Object.keys(fieldNames))
      appearance[name] = {
        visible: $("show-" + name).checked,
        position: positions[$("position-" + name).value],
      };
    // Preserve null position resets: returning to the stack must discard old offsets.
    for (const name of Object.keys(fieldNames))
      if (appearance[name].position)
        appearance[name].position = {
          ...appearance[name].position,
          transform: "none",
          width: "auto",
        };
    options.appearance = appearance;
    player.setAppearance(appearance);
  };
  for (const [name, label] of Object.entries(fieldNames)) {
    const row = document.createElement("div");
    row.innerHTML = `<label class="check"><input id="show-${name}" type="checkbox" checked>${label}</label><label>Position for ${label.toLowerCase()}<select id="position-${name}"><option value="stack">Default caption stack</option><option value="top-left">Top left</option><option value="top-right">Top right</option><option value="bottom-left">Bottom left</option><option value="bottom-right">Bottom right</option><option value="center">Center</option></select></label>`;
    $("appearance-fields").append(row);
    row.addEventListener("change", refreshAppearance);
  }
  $("appearance-font").addEventListener("input", refreshAppearance);
  const hosts = {
    pause: "Pause",
    next: "Next",
    replay: "Replay",
    mute: "Sound toggle",
    volume: "Volume",
    status: "Status",
    chapters: "Chapter cards",
  };
  const hostElement = (name) =>
    name === "chapters"
      ? chapters
      : name === "volume"
        ? $("volume").closest("label")
        : $(name);
  for (const [name, label] of Object.entries(hosts)) {
    const row = document.createElement("label");
    row.className = "check";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = true;
    input.id = "control-" + name;
    row.append(input, document.createTextNode(label));
    $("appearance-controls").append(row);
    input.onchange = () => (hostElement(name).hidden = !input.checked);
  }
  $("appearance-reset").onclick = () => {
    $("appearance-font").value = "";
    for (const name of Object.keys(fieldNames)) {
      $("show-" + name).checked = true;
      $("position-" + name).value = "stack";
    }
    for (const name of Object.keys(hosts)) {
      $("control-" + name).checked = true;
      hostElement(name).hidden = false;
    }
    refreshAppearance();
  };
  $("apply").onclick = () => {
    const numeric = [
      "speed",
      "hold",
      "fade",
      "transitionMs",
      "music-delay",
      "music-fade",
      "music-duration",
      "music-offset",
    ];
    if (numeric.some((id) => !$(id).reportValidity())) return;
    for (const key of ["mode", "reveal", "transition"])
      options[key] = $(key).value;
    for (const key of ["speed", "hold", "fade", "transitionMs"])
      options[key] = Number($(key).value) * (key === "speed" ? 1 : 1000);
    options.loop = $("loop").checked;
    story = structuredClone(original);
    // Long text genuinely overflows the scroll window, rather than merely sliding one short line.
    if (options.reveal === "scroll")
      story.cues.forEach((c, i) => {
        if (i % 2 === 0) {
          c.text += "\n\n" + original.cues[i + 1].text;
          c.reference += " + " + original.cues[i + 1].reference.split(" · ")[0];
        }
      });
    story.cues.forEach((c, i) => {
      delete c.options;
      const selection = $("music-mode").value;
      if (selection === "none") c.music = null;
      else if (selection === "continuous") {
        if (i === 0) c.music = structuredClone(original.cues[0].music);
        else delete c.music;
      } else if (selection === "each") {
        let inherited = original.cues
          .slice(0, i + 1)
          .reverse()
          .find((x) => x.music);
        c.music = structuredClone(inherited.music);
      }
      if (c.music) {
        c.music.delay = Number($("music-delay").value) * 1000;
        c.music.fade = Number($("music-fade").value) * 1000;
        c.music.offset = Number($("music-offset").value);
        const duration = Number($("music-duration").value);
        if (duration) c.music.duration = duration * 1000;
        const loop = $("music-loop").value;
        if (loop !== "authored") c.music.loop = loop === "loop";
      }
    });
    setup();
    start(options.mode);
  };
}
setup();
try {
  await player.preload((done, total) =>
    window.storyLoading.status(`Loading paintings · ${done} of ${total}`),
  );
  window.storyLoading.ready();
} catch (error) {
  window.storyLoading.fail(error.message + " · Reload to try again.");
}
