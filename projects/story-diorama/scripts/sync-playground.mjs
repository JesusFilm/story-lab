import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
const root = new URL("../", import.meta.url),
  target = new URL("../../../prototypes/story-diorama-lab/", import.meta.url);
await mkdir(target, { recursive: true });
await cp(new URL("examples/noah/", root), target, { recursive: true });
await cp(new URL("src/", root), new URL("component/", target), {
  recursive: true,
});
const html = await readFile(new URL("index.html", target), "utf8");
await writeFile(
  new URL("index.html", target),
  html
    .replace("../../src/", "./component/")
    .replace("<body>", '<body data-lab="true">')
    .replace(
      "Story Diorama · Through the waters",
      "Story Diorama · Options playground",
    )
    .replace(
      "A storytelling component / Example 01",
      "Component playground / Prototype 04",
    )
    .replace(
      "An illustrated telling of Noah, the ark, and the flood.",
      "Explore images, text, timing, and music with the Noah story.",
    )
    .replace(
      'href="../../../../prototypes/story-diorama-lab/"',
      'href="./noah.html"',
    )
    .replace("Options playground ↗", "Noah story ↗"),
);
await writeFile(
  new URL("noah.html", target),
  html
    .replace("../../src/", "./component/")
    .replace(
      'href="../../../../prototypes/story-diorama-lab/"',
      'href="./index.html"',
    ),
);
const app = await readFile(new URL("app.mjs", target), "utf8");
await writeFile(
  new URL("app.mjs", target),
  app.replace("../../src/story-diorama.mjs", "./component/story-diorama.mjs"),
);
console.log(
  "Copied component, Noah example and assets into standalone playground.",
);
