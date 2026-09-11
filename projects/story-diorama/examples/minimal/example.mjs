import { StoryDiorama } from "../../src/story-diorama.mjs";
import { bindControls, createControls } from "../../src/controls.mjs";
const story = {
  cues: [
    {
      number: "01",
      title: "The far shore",
      text: "Every journey begins with a place you have not yet seen.",
      reference: "Original example text",
      version: "Story Lab",
      image: new URL("./horizon.svg", import.meta.url).href,
      alt: "Simple geometric mountains beneath a pale sun.",
    },
    {
      number: "02",
      title: "A quiet moment",
      text: "The same image can carry the next passage. Only the words need to change.",
      reference: "Original example text",
      appearance: { title: { visible: false }, text: { color: "#efe2b7" } },
    },
    {
      number: "03",
      title: "Your next scene",
      text: "Now the story returns control to your game.",
      reference: "Original example text",
    },
  ],
};
const player = new StoryDiorama(document.querySelector("#story"), story, {
  mode: "manual",
  speed: 38,
  appearance: {
    fontFamily: "system-ui, sans-serif",
    number: { visible: false },
    version: { visible: false },
    title: {
      fontFamily: "Georgia, serif",
      fontSize: "32px",
      position: { left: "7%", top: "7%", right: "7%" },
    },
    text: {
      fontSize: "clamp(20px, 3vw, 30px)",
      position: { left: "7%", right: "7%", bottom: "20%" },
    },
    reference: { position: { left: "7%", bottom: "7%", right: "7%" } },
    mobile: {
      title: { fontSize: "26px" },
      text: { fontSize: "22px", maxHeight: "240px" },
    },
  },
});
// The SVG icon and markup belong to the game, not to the library.
const custom = bindControls(document.querySelector("#game-controls"), player, {
  labels: {
    play: "Begin",
    resume: "Continue",
    next: "Continue",
    reveal: "Show full passage",
  },
});
const optional = createControls(
  document.querySelector("#optional-controls"),
  player,
  { controls: ["pause", "mute"] },
);
const status = document.querySelector("#status");
async function prepare() {
  document.querySelector('[data-sd-action="play"]').disabled = true;
  try {
    await player.preload(
      (n, total) => (status.textContent = `Loading artwork ${n}/${total}`),
    );
    status.textContent = "Ready. Begin when you choose.";
    document.querySelector('[data-sd-action="play"]').disabled = false;
    document.querySelector("#retry").hidden = true;
  } catch (error) {
    status.textContent = error.message;
    document.querySelector("#retry").hidden = false;
  }
}
player.addEventListener(
  "complete",
  () => (status.textContent = "Story complete. Your game can now continue."),
);
player.addEventListener(
  "audioerror",
  () => (document.querySelector("#audio-error").hidden = false),
);
document.querySelector("#retry").onclick = prepare;
document.querySelector("#sound-retry").onclick = () => {
  document.querySelector("#audio-error").hidden = true;
  player.retryAudio();
};
document.querySelector("#silent").onclick = () => {
  player.setMuted(true);
  document.querySelector("#audio-error").hidden = true;
};
await prepare();
// In a game, run this same cleanup when its story screen unmounts.
window.addEventListener(
  "pagehide",
  () => {
    custom.destroy();
    optional.destroy();
    player.destroy();
  },
  { once: true },
);
