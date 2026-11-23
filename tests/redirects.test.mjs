import assert from "node:assert/strict";
import test from "node:test";
import { legacyRedirect, BLOG_REDIRECTS } from "../lib/redirects.ts";

/**
 * Migración desde el sitio Astro: ninguna URL vieja del blog puede quedar en
 * 404. Mapa puro + worker compilado (`npm run build:local` antes).
 */

const OLD_URLS = {
  "/blog": "/",
  "/blog/": "/",
  "/blog/cuanto-cuesta-pagina-web-aysen/": "/#preguntas",
  "/blog/por-que-tu-sitio-necesita-mantenimiento/": "/#mantencion",
  "/blog/5-herramientas-web-hostal-restaurante/": "/#servicios",
  "/blog/seo-local-como-aparecer-en-google": "/#servicios",
  "/blog/velocidad-web-patagonia/": "/#preguntas",
  "/blog/whatsapp-business-vs-pagina-web/": "/#preguntas",
  "/blog/un-articulo-que-nunca-existio/": "/",
  "/blog/categoria/algo/": "/",
};

test("cada URL vieja tiene destino, con o sin barra final", () => {
  for (const [from, to] of Object.entries(OLD_URLS)) {
    assert.equal(legacyRedirect(from), to, from);
    assert.equal(legacyRedirect(from.replace(/\/$/, "")), to, `${from} sin barra`);
  }
});

test("los 6 artículos del blog viejo están mapeados", () => {
  assert.equal(Object.keys(BLOG_REDIRECTS).length, 6);
});

test("las URLs del sitio nuevo no se tocan", () => {
  for (const path of ["/", "/sitemap.xml", "/robots.txt", "/api/contacto", "/images/og-tallerzur.jpg", "/blogger"]) {
    assert.equal(legacyRedirect(path), null, path);
  }
});

let worker;
async function get(path) {
  if (!worker) {
    const url = new URL("../dist/server/index.js", import.meta.url);
    url.searchParams.set("test", `${process.pid}-redirects`);
    worker = (await import(url.href)).default;
  }
  return worker.fetch(
    new Request(`https://tallerzur.cl${path}`, { redirect: "manual" }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("el worker responde 301 (no 308) con Location absoluta", async () => {
  for (const [from, to] of Object.entries(OLD_URLS)) {
    const response = await get(from);
    assert.equal(response.status, 301, from);
    assert.equal(response.headers.get("location"), `https://tallerzur.cl${to}`, from);
  }
});

test("el inicio, el sitemap y robots siguen respondiendo 200", async () => {
  for (const path of ["/", "/sitemap.xml", "/robots.txt"]) {
    const response = await get(path);
    assert.equal(response.status, 200, path);
  }
  const sitemap = await (await get("/sitemap.xml")).text();
  assert.match(sitemap, /<loc>https:\/\/tallerzur\.cl\/?<\/loc>/);
  assert.match(sitemap, /<lastmod>2026-11-23/);
});
