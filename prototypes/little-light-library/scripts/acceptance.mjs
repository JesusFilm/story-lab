import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(Error(`${command} ${args.join(" ")} exited ${code}`)),
    );
  });
}
const sceneOnly = process.argv.includes("--scene");
const root = path.resolve("dist"),
  prefix = "/review/little-light-library/";
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wav": "audio/wav",
  ".webp": "image/webp",
  ".glb": "model/gltf-binary",
};
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  if (!pathname.startsWith(prefix)) {
    res.writeHead(404).end();
    return;
  }
  const file = path.resolve(
    root,
    decodeURIComponent(pathname.slice(prefix.length)) || "index.html",
  );
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (e, data) => {
    if (e) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    });
    res.end(data);
  });
});
try {
  await run("npm", ["run", "verify"]);
  await run("node", ["scripts/browser-check.mjs"]);
  await run("node", ["scripts/garden-performance.mjs"]);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const env = {
    ...process.env,
    LIBRARY_URL: `http://127.0.0.1:${server.address().port}${prefix}`,
  };
  for (const script of [
    "failure-check",
    "timing-check",
    "continuity-check",
    "race-check",
    "touch-check",
    "eve-touch-check",
    "adam-touch-check",
    "reading-focus-check",
    "creature-touch-check",
    "shelf-feedback-check",
    "room-orbit-check",
    "room-material-check",
    "garden-floor-check",
    "spread-loading-review",
    "spread-reveal-race",
    "retained-stage-race",
  ].filter(
    (script) =>
      !sceneOnly || !["timing-check", "continuity-check"].includes(script),
  ))
    await run("node", [`scripts/${script}.mjs`], env);
  console.log(
    sceneOnly
      ? "PASS: scene acceptance (journey, performance, recovery, touch, loading and races). Narration timing/continuity were not rerun; listening remains unverified."
      : "PASS: complete automated acceptance suite. Listening review remains a separate unverified requirement.",
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  server.close();
}
