import fs from "node:fs";
import assert from "node:assert/strict";
import { stageDirections } from "../src/stage-direction";
const content = JSON.parse(
  fs.readFileSync("public/content/en-US.json", "utf8"),
);
const pageIds: string[] = content.stories.flatMap(
  (s: { pages: { id: string }[] }) => s.pages.map((p) => p.id),
);
assert.deepEqual(
  Object.keys(stageDirections).sort(),
  pageIds.sort(),
  "Every spread needs explicit theatre direction",
);
const files = new Set<string>();
for (const [id, shot] of Object.entries(stageDirections)) {
  files.add(`${shot.background}.webp`);
  if (shot.background === "garden") files.add("garden-floor.webp");
  for (const prop of shot.props || []) {
    files.add(`${prop.file}.webp`);
    assert.ok(prop.width > 0 && prop.width < 5.8, `${id}: prop fits the book`);
    assert.ok(
      Math.abs(prop.x) + prop.width / 2 < 3.1,
      `${id}: prop stays inside pages`,
    );
  }
  for (const actor of shot.actors) {
    files.add(`${actor.kind}-poses.webp`);
    assert.ok(Math.abs(actor.x) < 2.5, `${id}: actor stays on page`);
    assert.ok(actor.pose >= 0 && actor.pose < 3);
  }
  if (shot.dove) files.add("dove-olive.webp");
  if (shot.ark) files.add("ark.webp");
  if (shot.family) files.add("family-seven.webp");
}
for (const file of files)
  assert.ok(
    fs.statSync(`public/assets/art/theatre/${file}`).size > 1000,
    `Missing theatre asset: ${file}`,
  );
console.log(
  `Validated ${pageIds.length} directed spreads and ${files.size} theatre plates/atlases.`,
);
