import assert from "node:assert/strict";
import test from "node:test";

/**
 * El test anterior era el del starter: exigía que el HTML publicado llevara
 * `<meta name="codex-preview" content="development">`. Es decir, obligaba a
 * enviar un marcador de desarrollo a producción. Ahora comprueba lo contrario,
 * más lo que la Fase 0 tenía que arreglar.
 */

let cachedHtml = null;

async function renderHome() {
  if (cachedHtml) return cachedHtml;
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  cachedHtml = await response.text();
  return cachedHtml;
}

test("no se publica ningún marcador de desarrollo", async () => {
  const html = await renderHome();
  assert.doesNotMatch(html, /codex-preview/i, "el marcador de desarrollo no puede salir a producción");
});

test("el documento se declara en español", async () => {
  const html = await renderHome();
  assert.match(html, /<html[^>]*\slang=["']es(-CL)?["']/i, "el sitio es íntegramente en español");
});

test("los metadatos son los del sitio, no los del starter", async () => {
  const html = await renderHome();
  assert.doesNotMatch(html, /Starter Project/i);
  assert.doesNotMatch(html, /A clean starting point/i);
  assert.match(html, /<title>[^<]*Puerto Cisnes[^<]*<\/title>/i);
  assert.match(html, /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{80,}/i,
    "la descripción tiene que ser real, no un marcador");
});

test("se puede compartir: Open Graph completo", async () => {
  const html = await renderHome();
  for (const property of ["og:title", "og:description", "og:image", "og:type", "og:locale"]) {
    assert.match(html, new RegExp(`property=["']${property}["']`, "i"), `falta ${property}`);
  }
  assert.match(html, /name=["']twitter:card["']/i);
});

test("hay datos estructurados con las coordenadas correctas", async () => {
  const html = await renderHome();
  const match = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is);
  assert.ok(match, "falta el JSON-LD");
  const data = JSON.parse(match[1]);
  assert.equal(data["@type"], "TouristDestination");
  // Las anteriores (45°24' S) eran las de Puerto Aysén, ~70 km al sur.
  assert.ok(data.geo.latitude > -44.9 && data.geo.latitude < -44.6,
    `la latitud debe ser la de Puerto Cisnes, es ${data.geo.latitude}`);
  assert.ok(data.geo.longitude > -72.9 && data.geo.longitude < -72.5);
});

test("no queda rastro de las coordenadas equivocadas", async () => {
  const html = await renderHome();
  assert.doesNotMatch(html, /45°24/, "45°24' S es Puerto Aysén, no Puerto Cisnes");
});

test("el menú cerrado no es alcanzable con el tabulador", async () => {
  const html = await renderHome();
  const aside = html.match(/<aside[^>]*id=["']main-menu["'][^>]*>/i);
  assert.ok(aside, "falta el menú");
  assert.match(aside[0], /\binert\b/i, "clip-path no quita el foco: hace falta inert");
});

test("la sección Nosotros no depende de GSAP para verse", async () => {
  const html = await renderHome();
  // El clip-path inicial vivía en el CSS y nunca se abría sin GSAP.
  assert.doesNotMatch(html, /circle\(8% at 50% 52%\)/,
    "el estado inicial de la animación no puede vivir en el CSS");
});
