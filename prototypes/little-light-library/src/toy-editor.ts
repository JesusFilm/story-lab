import { animationPresets } from "./book-animation";
import type { AuthoredBook, BookMotion, BookToy } from "./authored-book";

const html = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );

const options = (entries: [string, string][], selected: string | undefined) =>
  entries
    .map(
      ([value, label]) =>
        `<option value="${html(value)}" ${value === selected ? "selected" : ""}>${html(label)}</option>`,
    )
    .join("");

function nextId(book: AuthoredBook) {
  let number = 1;
  while (book.toys?.some(({ id }) => id === `toy-${number}`)) number++;
  return `toy-${number}`;
}

export function renderToyEditor(book: AuthoredBook): string {
  const toys = book.toys ?? [];
  const images = Object.entries(book.assets)
    .filter(([, asset]) => asset.kind === "image")
    .map(([id]) => [id, id] as [string, string]);
  const sounds = [
    ["", "No sound"] as [string, string],
    ...Object.entries(book.assets)
      .filter(([, asset]) => asset.kind === "audio")
      .map(([id]) => [id, id] as [string, string]),
  ];
  const rows = toys
    .map(
      (toy, index) =>
        `<fieldset class="editor-subcard"><legend>${html(toy.label)} <button type="button" data-toy-remove="${index}">Remove</button></legend><div class="editor-grid"><label class="editor-field"><span>Toy ID</span><input data-toy-index="${index}" data-toy-field="id" value="${html(toy.id)}"></label><label class="editor-field"><span>Short label</span><input data-toy-index="${index}" data-toy-field="label" maxlength="60" value="${html(toy.label)}"></label><label class="editor-field"><span>Artwork</span><select data-toy-index="${index}" data-toy-field="asset">${options(images, toy.asset)}</select></label><label class="editor-field"><span>Click animation</span><select data-toy-index="${index}" data-toy-field="animation">${options(
          animationPresets.map(([id, label]) => [id, label]),
          toy.animation,
        )}</select></label><label class="editor-field"><span>Sound effect</span><select data-toy-index="${index}" data-toy-field="sound">${options(sounds, toy.sound)}</select></label></div><label class="studio-check"><input type="checkbox" data-toy-pose="${index}" ${toy.pose ? "checked" : ""}> Use a horizontal pose sheet</label>${toy.pose ? `<div class="editor-grid"><label class="editor-field"><span>Frames across</span><input type="number" min="1" max="16" data-toy-index="${index}" data-toy-field="pose.columns" value="${toy.pose.columns}"></label><label class="editor-field"><span>Selected frame index</span><input type="number" min="0" max="${toy.pose.columns - 1}" data-toy-index="${index}" data-toy-field="pose.index" value="${toy.pose.index}"></label></div>` : ""}<p class="editor-muted">Clicking this figure on the room shelf plays one 1.4-second ${html(toy.animation)} animation${toy.sound ? " with its sound effect" : ""}.</p></fieldset>`,
    )
    .join("");
  return `<section class="editor-card toy-editor"><div class="editor-card-heading"><div><h2>Shelf toys</h2><p>Add up to four small figures displayed with this book in the room. Choose Read book, then Library to try their movement and sound.</p></div><button type="button" data-toy-add ${toys.length >= 4 || !images.length ? "disabled" : ""}>Add shelf toy</button></div>${rows || '<p class="editor-muted">No shelf toys yet. Add one from artwork already in this book.</p>'}</section>`;
}

export function handleToyEdit(book: AuthoredBook, event: Event): boolean {
  const target = event.target as HTMLElement;
  const add = target.closest<HTMLButtonElement>("[data-toy-add]");
  if (event.type === "click" && add) {
    const asset = Object.keys(book.assets).find(
      (id) => book.assets[id].kind === "image",
    );
    if (!asset || (book.toys?.length ?? 0) >= 4) return true;
    const toy: BookToy = {
      id: nextId(book),
      label: "Shelf toy",
      asset,
      animation: "rock",
    };
    (book.toys ??= []).push(toy);
    return true;
  }
  const remove = target.closest<HTMLButtonElement>("[data-toy-remove]");
  if (event.type === "click" && remove) {
    const index = Number(remove.dataset.toyRemove);
    if (Number.isInteger(index) && book.toys?.[index])
      book.toys.splice(index, 1);
    if (!book.toys?.length) delete book.toys;
    return true;
  }
  if (event.type !== "change") return false;
  const pose = target.closest<HTMLInputElement>("[data-toy-pose]");
  if (pose) {
    const toy = book.toys?.[Number(pose.dataset.toyPose)];
    if (toy) {
      if (pose.checked) toy.pose = { index: 0, columns: 1 };
      else delete toy.pose;
    }
    return true;
  }
  const field = target.closest<HTMLInputElement | HTMLSelectElement>(
    "[data-toy-index][data-toy-field]",
  );
  if (!field) return false;
  const toy = book.toys?.[Number(field.dataset.toyIndex)];
  if (!toy) return true;
  const name = field.dataset.toyField;
  if (name === "sound") {
    if (field.value) toy.sound = field.value;
    else delete toy.sound;
  } else if (name === "pose.columns" && toy.pose) {
    toy.pose.columns = Math.max(
      1,
      Math.min(16, Math.floor(Number(field.value)) || 1),
    );
    toy.pose.index = Math.min(toy.pose.index, toy.pose.columns - 1);
  } else if (name === "pose.index" && toy.pose) {
    toy.pose.index = Math.max(
      0,
      Math.min(toy.pose.columns - 1, Math.floor(Number(field.value)) || 0),
    );
  } else if (name === "animation")
    toy.animation = field.value as BookMotion["preset"];
  else if (name === "id" || name === "label" || name === "asset")
    toy[name] = field.value;
  return true;
}
