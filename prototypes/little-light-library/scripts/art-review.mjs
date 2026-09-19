import { chromium } from "playwright";
import fs from "node:fs";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
for (const story of ["eden", "noah"]) {
  const images = Array.from(
    { length: 8 },
    (_, i) => `${story}-${String(i + 1).padStart(2, "0")}`,
  );
  await page.setContent(
    `<body style="margin:0;background:#f5efdd;display:grid;grid-template-columns:repeat(2,1fr);gap:12px;font:20px Georgia">${images.map((id) => `<section>${id}<img style="width:100%;display:block" src="http://127.0.0.1:8771/assets/art/${id}.webp"></section>`).join("")}</body>`,
  );
  await page
    .locator("img")
    .evaluateAll((imgs) => Promise.all(imgs.map((img) => img.decode())));
  await page.screenshot({
    path: `docs/captures/${story}-contact.png`,
    fullPage: true,
  });
}
await browser.close();
