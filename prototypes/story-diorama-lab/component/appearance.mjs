/** Public, content-agnostic presentation configuration. Positions use CSS lengths. */
export const fields = ["number", "title", "text", "reference", "version"];
const typography = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "lineHeight",
  "letterSpacing",
  "color",
  "textAlign",
];
const positions = [
  "top",
  "right",
  "bottom",
  "left",
  "width",
  "maxWidth",
  "height",
  "maxHeight",
  "transform",
];

export function mergeAppearance(...layers) {
  const result = {};
  for (const layer of layers) {
    if (!layer) continue;
    for (const [key, value] of Object.entries(layer)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[key] = mergeAppearance(result[key], value);
      } else result[key] = value;
    }
  }
  return result;
}

export function resolveAppearance(base, cue, compact) {
  const combined = mergeAppearance(base, cue);
  // Each cue, including its desktop settings, takes precedence over the player defaults.
  return compact
    ? mergeAppearance(base, base?.mobile, cue, cue?.mobile)
    : combined;
}

export function applyAppearance(player) {
  const config = resolveAppearance(
    player.appearance,
    player.timeline?.cue.appearance,
    player.compact,
  );
  player.resolvedAppearance = config;
  player.root.toggleAttribute("data-sd-compact", player.compact);
  for (const [field, element] of Object.entries(player.elements)) {
    const setting = config[field] || {};
    const content = player.timeline?.cue[field];
    element.hidden =
      setting.visible === false ||
      (field !== "text" && (content === undefined || content === ""));
    const text = field === "text" ? player.text : element;
    for (const key of typography)
      text.style[key] =
        setting[key] ?? (key === "fontFamily" ? (config.fontFamily ?? "") : "");
    const parent = setting.position ? player.caption : player.homes[field];
    // Rebuild default slot order so clearing an override never changes the reading order.
    parent.append(element);
    element.classList.toggle("sd-positioned", !!setting.position);
    for (const key of positions)
      element.style[key] = setting.position?.[key] ?? "";
    if (field === "text")
      element.style.maxHeight =
        setting.position?.maxHeight ?? setting.maxHeight ?? "";
  }
  player.stack.append(player.heading);
  if (player.window.parentElement === player.stack)
    player.stack.append(player.window);
  player.stack.append(player.meta);
  player.heading.hidden = ![player.number, player.chapter].some(
    (el) => el.parentElement === player.heading && !el.hidden,
  );
  player.meta.hidden = ![player.reference, player.version].some(
    (el) => el.parentElement === player.meta && !el.hidden,
  );
  player.sr.hidden =
    config.text?.visible === false || config.announceText === false;
  for (const image of [player.front, player.back]) {
    image.style.objectFit = config.image?.fit ?? "";
    image.style.objectPosition = config.image?.position ?? "";
  }
  player.shade.hidden = config.shade === false;
  player.shade.style.background =
    typeof config.shade === "string" ? config.shade : "";
}
