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
  // El título lleva la keyword de mayor intención de negocio (hostales),
  // no solo el nombre del pueblo — es lo que la gente escribe en Google.
  assert.match(html, /<title>[^<]*TallerZur[^<]*<\/title>/i);
  assert.match(html, /<title>[^<]*Aysén[^<]*<\/title>/i);
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
  // Pivote de identidad: el sitio pasó de ser un destino turístico a ser la
  // página oficial de TallerZur, el estudio que lo construyó — mismo lugar,
  // mismas coordenadas, otro tipo de negocio.
  assert.equal(data["@type"], "ProfessionalService");
  assert.equal(data.name, "TallerZur");
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

test("el contacto es el real de TallerZur, no el placeholder de Puerto Cisnes", async () => {
  const html = await renderHome();
  assert.doesNotMatch(html, /hola@puertocisnes\.cl/, "ese buzón no existe, era el placeholder del destino turístico");
  assert.match(html, /danielguz\.ga@gmail\.com/i, "correo provisorio hasta el corporativo");
  assert.match(html, /wa\.me\/56940068228/);
});

/* ── Fase 4 · comercial ─────────────────────────────────────────────── */

const jsonLdBlocks = (html) =>
  [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis)].map((m) => JSON.parse(m[1]));

test("el hero vende en el primer pantallazo: línea de valor y dos CTA", async () => {
  const html = await renderHome();
  const hero = html.match(/<section[^>]*id="inicio"[\s\S]*?<\/section>/i)?.[0] ?? "";
  assert.match(hero, /Sitios web y mantención para hostales/i, "falta la línea de valor");
  assert.match(hero, /href="https:\/\/wa\.me\/56940068228[^"]*"[^>]*>\s*Hablemos por WhatsApp/i);
  assert.match(hero, /href="#proyectos"[^>]*>\s*Ver proyectos/i);
  assert.match(hero, /Donde el bosque/i, "el titular poético se mantiene");
});

test("ya no hay cargador bloqueante ni sección Esencia", async () => {
  const html = await renderHome();
  assert.doesNotMatch(html, /class="loader"/);
  assert.doesNotMatch(html, /id="esencia"/);
});

test("navegación a Servicios, Proyectos, Preguntas y Contacto", async () => {
  const html = await renderHome();
  for (const id of ["servicios", "proyectos", "preguntas", "contacto"]) {
    assert.match(html, new RegExp(`id="${id}"`), `falta la sección #${id}`);
  }
  const nav = html.match(/<nav[^>]*class="header-nav"[\s\S]*?<\/nav>/i)?.[0] ?? "";
  for (const id of ["servicios", "proyectos", "preguntas", "contacto"]) {
    assert.match(nav, new RegExp(`href="#${id}"`), `el header no enlaza a #${id}`);
  }
});

test("cada servicio tiene un CTA que preselecciona el servicio en el contacto", async () => {
  const html = await renderHome();
  for (const id of ["desarrollo", "mantencion", "digitales"]) {
    assert.match(html, new RegExp(`href="/\\?servicio=${id}#contacto"`), `falta el CTA de ${id}`);
  }
  assert.match(html, /Servicio estrella/i, "la mantención va destacada");
  assert.match(html, /menos de 4 horas hábiles/i);
});

test("proyectos con captura autoalojada, año, stack y enlace en vivo", async () => {
  const html = await renderHome();
  for (const site of ["hostalmonchito.cl", "subelab.com", "nutme.cl"]) {
    assert.match(html, new RegExp(`href="https://www\\.${site.replace(".", "\\.")}"`), `falta ${site}`);
  }
  assert.match(html, /\/images\/proyectos\/hostalmonchito\.avif/);
  assert.doesNotMatch(html, /s\.wordpress\.com\/mshots/, "las capturas ya no se piden en vivo");
});

test("todas las imágenes declaran width y height", async () => {
  const html = await renderHome();
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  assert.ok(imgs.length >= 7);
  for (const img of imgs) {
    assert.match(img, /\bwidth="\d+"/, `sin width: ${img.slice(0, 80)}`);
    assert.match(img, /\bheight="\d+"/, `sin height: ${img.slice(0, 80)}`);
  }
});

test("sin terceros en la ruta crítica de imágenes (Wikimedia retirado)", async () => {
  const html = await renderHome();
  assert.doesNotMatch(html, /upload\.wikimedia\.org/);
});

test("preguntas frecuentes en <details> y JSON-LD FAQPage con las mismas preguntas", async () => {
  const html = await renderHome();
  const details = html.match(/<details\b/gi) ?? [];
  assert.ok(details.length >= 5, `hay ${details.length} preguntas`);
  const faq = jsonLdBlocks(html).find((d) => d["@type"] === "FAQPage");
  assert.ok(faq, "falta FAQPage");
  assert.equal(faq.mainEntity.length, details.length);
  for (const q of faq.mainEntity) {
    const visible = q.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(html, new RegExp(`<summary[^>]*>${visible}`), `pregunta sin versión visible: ${q.name}`);
  }
});

test("ProfessionalService sirve a las 10 comunas de Aysén y no publica precios", async () => {
  const html = await renderHome();
  const org = jsonLdBlocks(html).find((d) => d["@type"] === "ProfessionalService");
  const names = org.areaServed.map((a) => a.name).join(" | ");
  for (const comuna of ["Guaitecas", "Cisnes", "Lago Verde", "Aysén", "Coyhaique", "Río Ibáñez", "Chile Chico", "Cochrane", "O'Higgins", "Tortel"]) {
    assert.ok(names.includes(`Comuna de ${comuna}`), `falta ${comuna}`);
  }
  assert.equal(org.priceRange, undefined, "el sitio no publica cifras");
});

test("la imagen para compartir es un JPEG 1200×630", async () => {
  const html = await renderHome();
  assert.match(html, /property="og:image"[^>]+content="[^"]+\/images\/og-tallerzur\.jpg"/i);
  assert.match(html, /property="og:image:width"[^>]+content="1200"/i);
  assert.match(html, /property="og:image:height"[^>]+content="630"/i);
});

test("formulario de contacto completo, con honeypot y comunas de Aysén", async () => {
  const html = await renderHome();
  const form = html.match(/<form[^>]*class="contact-form"[\s\S]*?<\/form>/i)?.[0] ?? "";
  assert.match(form, /action="\/api\/contacto"/);
  assert.match(form, /method="post"/i);
  for (const name of ["nombre", "negocio", "comuna", "rubro", "sitio", "servicio", "mensaje", "contacto", "website"]) {
    assert.match(form, new RegExp(`name="${name}"`), `falta el campo ${name}`);
  }
  for (const name of ["nombre", "negocio", "comuna", "rubro", "sitio", "servicio", "mensaje", "contacto"]) {
    assert.match(form, new RegExp(`<label[^>]+for="contacto-${name}"`), `el campo ${name} no tiene label`);
  }
  assert.equal((form.match(/<option value="(Guaitecas|Cisnes|Lago Verde|Aysén|Coyhaique|Río Ibáñez|Chile Chico|Cochrane|O&#x27;Higgins|O'Higgins|Tortel)"/g) ?? []).length, 10);
});

/* ── Mantención, Nosotros y contacto (rediseño) ─────────────────────── */

test("sin la sección de mantención ni el clima en vivo de Nosotros", async () => {
  const html = await renderHome();
  assert.doesNotMatch(html, /id="mantencion"/);
  assert.doesNotMatch(html, /En vivo · Puerto Cisnes/);
  const about = html.match(/<section[^>]*id="nosotros"[\s\S]*?<\/section>/i)?.[0] ?? "";
  assert.equal((about.match(/<li[^>]*data-reveal/g) ?? []).length, 3, "tres principios");
});

test("proyectos: tarjetas apiladas como los servicios", async () => {
  const html = await renderHome();
  const work = html.match(/<section[^>]*id="proyectos"[\s\S]*?<\/section>/i)?.[0] ?? "";
  assert.match(work, /class="projects-stack"/);
  assert.equal((work.match(/class="project-panel project-work/g) ?? []).length, 3);
  assert.equal((work.match(/class="project-shade"/g) ?? []).length, 3);
});

test("contacto: botón de WhatsApp con el mensaje ya escrito", async () => {
  const html = await renderHome();
  const button = html.match(/<a[^>]*class="wa-btn"[\s\S]*?<\/a>/i)?.[0] ?? "";
  assert.match(button, /href="https:\/\/wa\.me\/56940068228\?text=Hola/);
  assert.match(button, /Escríbenos por WhatsApp/);
  assert.match(html, /<form[^>]*id="contacto-form"/, "el formulario es destino del scroll");
});

test("la etiqueta de servicios coincide con el menú", async () => {
  const html = await renderHome();
  const services = html.match(/<section[^>]*id="servicios"[\s\S]*?<\/section>/i)?.[0] ?? "";
  assert.match(services, /<p class="section-label">servicios<\/p>/);
  assert.doesNotMatch(html, />territorio</);
});
