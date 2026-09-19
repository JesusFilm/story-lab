import fs from "node:fs";
import path from "node:path";
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else files.push({ file: p, bytes: fs.statSync(p).size });
  }
}
walk("public/assets");
const totals = {};
for (const f of files) {
  const category = f.file.split(path.sep)[2];
  totals[category] = (totals[category] || 0) + f.bytes;
}
const report = {
  totals,
  largest: files.sort((a, b) => b.bytes - a.bytes).slice(0, 5),
  notes:
    "Source PNGs and Blender editable files stay outside runtime. Runtime loads shelf previews and only the selected page/narration. DPR is capped at1.5, reduced to1 with shadows disabled on sustained slow frames.",
};
fs.writeFileSync(
  "docs/asset-budget.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(totals);
