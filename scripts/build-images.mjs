/**
 * Genera las imágenes optimizadas del sitio (AVIF + WebP) y la OG 1200×630.
 *
 * Uso:  node scripts/build-images.mjs <carpeta-con-capturas-png>
 *
 * Las capturas de proyectos se sacan con Edge/Chrome headless a 1280×960:
 *   msedge --headless=new --hide-scrollbars --window-size=1280,960 \
 *     --virtual-time-budget=10000 --screenshot=<carpeta>/<slug>.png https://www.<sitio>
 * (mshots de WordPress.com devuelve 403 a descargas automáticas.)
 *
 * `sharp` no es dependencia directa: llega como transitiva de next/miniflare.
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const sharp = require("sharp");
const PUB = fileURLToPath(new URL("../public/images", import.meta.url));
const SHOTS = process.argv[2];
if (!SHOTS) { console.error("Falta la carpeta de capturas"); process.exit(1); }
mkdirSync(`${PUB}/proyectos`, { recursive: true });

async function variants(input, name, widths, { q = 62, aq = 48 } = {}) {
  for (const w of widths) {
    const base = sharp(input).resize({ width: w, withoutEnlargement: true });
    const a = await base.clone().avif({ quality: aq, effort: 6 }).toFile(`${PUB}/${name}-${w}.avif`);
    const b = await base.clone().webp({ quality: q }).toFile(`${PUB}/${name}-${w}.webp`);
    console.log(name, w, `${a.width}x${a.height}`, "avif", a.size, "webp", b.size);
  }
}

await variants(`${PUB}/cisnes-hero.webp`, "hero", [768, 1536]);
await variants(`${PUB}/cisnes-forest.webp`, "forest", [720, 960, 1122], { q: 55, aq: 38 });
await variants(`${PUB}/cisnes-water.webp`, "water", [768, 1536]);

for (const n of ["nutme", "subelab", "hostalmonchito"]) {
  const base = sharp(`${SHOTS}/${n}.png`).resize(800, 600, { fit: "cover", position: "top" });
  const a = await base.clone().avif({ quality: 50, effort: 6 }).toFile(`${PUB}/proyectos/${n}.avif`);
  const b = await base.clone().webp({ quality: 70 }).toFile(`${PUB}/proyectos/${n}.webp`);
  console.log(n, "avif", a.size, "webp", b.size);
}

// OG 1200×630: recorte del hero + degradado + texto (Georgia: librsvg no lee woff2).
const W = 1200, H = 630;
const overlay = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#080a07" stop-opacity=".88"/><stop offset=".62" stop-color="#080a07" stop-opacity=".35"/><stop offset="1" stop-color="#080a07" stop-opacity=".05"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="72" y="118" font-family="Arial, sans-serif" font-size="20" letter-spacing="6" fill="#c9ccbf">TALLERZUR · PUERTO CISNES, AYSÉN</text>
  <text x="68" y="300" font-family="Georgia, serif" font-size="92" fill="#efefe8">Sitios web</text>
  <text x="68" y="400" font-family="Georgia, serif" font-size="92" font-style="italic" fill="#efefe8">y mantención</text>
  <text x="72" y="478" font-family="Georgia, serif" font-size="34" fill="#d9dccf">para hostales, restaurantes y pymes de Aysén.</text>
  <text x="72" y="566" font-family="Arial, sans-serif" font-size="22" letter-spacing="2" fill="#aaaca3">tallerzur.cl</text>
</svg>`);
const og = await sharp(`${PUB}/cisnes-hero.webp`).resize(W, H, { fit: "cover", position: "centre" })
  .composite([{ input: overlay }]).jpeg({ quality: 82, mozjpeg: true }).toFile(`${PUB}/og-tallerzur.jpg`);
console.log("og", og.width, og.height, og.size);
