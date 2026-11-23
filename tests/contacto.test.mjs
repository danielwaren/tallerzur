import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeContact, validateContact, isSpam, contactKind, buildEmail,
  whatsappFallbackText, MIN_FILL_MS,
} from "../lib/contact.ts";

/**
 * Contacto: la validación pura (sin build) y el route handler real,
 * importado desde el worker compilado (`npm run build:local` antes).
 */

const valid = {
  nombre: "Ana Pérez",
  negocio: "Cabañas Río Cisnes",
  comuna: "Cisnes",
  rubro: "Hostal, cabañas u hospedaje",
  sitio: "",
  servicio: "mantencion",
  mensaje: "Quiero que mi sitio no se caiga en temporada alta.",
  contacto: "ana@example.com",
  website: "",
};

/* ── Validación pura ─────────────────────────────────────────────────── */

test("un formulario completo y correcto no tiene errores", () => {
  assert.deepEqual(validateContact(normalizeContact(valid)), {});
});

test("los campos requeridos se exigen con mensajes humanos", () => {
  const errors = validateContact(normalizeContact({}));
  for (const field of ["nombre", "negocio", "comuna", "rubro", "servicio", "mensaje", "contacto"]) {
    assert.ok(errors[field], `falta error para ${field}`);
  }
  assert.equal(errors.sitio, undefined, "el sitio actual es opcional");
  assert.match(errors.nombre, /Falta tu nombre/);
});

test("se recortan espacios y se validan largos", () => {
  const input = normalizeContact({ ...valid, nombre: "   A   ", mensaje: "corto", negocio: "x".repeat(121) });
  const errors = validateContact(input);
  assert.equal(input.nombre, "A");
  assert.ok(errors.nombre, "1 carácter no es un nombre");
  assert.match(errors.mensaje, /al menos 10/);
  assert.match(errors.negocio, /Máximo 120/);
});

test("correo o teléfono: acepta los dos formatos, rechaza basura", () => {
  assert.equal(contactKind("ana@example.com"), "email");
  assert.equal(contactKind("+56 9 4006 8228"), "telefono");
  assert.equal(contactKind("940068228"), "telefono");
  assert.equal(contactKind("hola"), null);
  assert.equal(contactKind("12345"), null);
  assert.ok(validateContact(normalizeContact({ ...valid, contacto: "no-es-nada" })).contacto);
});

test("comuna, rubro y servicio tienen que venir de la lista", () => {
  const errors = validateContact(normalizeContact({ ...valid, comuna: "Santiago", rubro: "Minería", servicio: "hackeo" }));
  assert.ok(errors.comuna);
  assert.ok(errors.rubro);
  assert.ok(errors.servicio);
  assert.deepEqual(validateContact(normalizeContact({ ...valid, comuna: "Fuera de Aysén" })), {});
});

test("el sitio actual, si viene, tiene forma de dirección web", () => {
  assert.deepEqual(validateContact(normalizeContact({ ...valid, sitio: "hostalmonchito.cl" })), {});
  assert.deepEqual(validateContact(normalizeContact({ ...valid, sitio: "https://www.nutme.cl/inicio" })), {});
  assert.ok(validateContact(normalizeContact({ ...valid, sitio: "mi página" })).sitio);
});

test("honeypot lleno o envío instantáneo = spam; sin marca de tiempo no se castiga", () => {
  const now = 1_000_000;
  assert.equal(isSpam(normalizeContact({ ...valid, website: "http://spam.example" }), now), true);
  assert.equal(isSpam(normalizeContact({ ...valid, t: now - 500 }), now), true, "medio segundo no lo llena una persona");
  assert.equal(isSpam(normalizeContact({ ...valid, t: now - MIN_FILL_MS - 1 }), now), false);
  assert.equal(isSpam(normalizeContact(valid), now), false, "sin JS no hay marca de tiempo");
});

test("el correo lleva todos los datos y reply_to solo si dejó correo", () => {
  const email = buildEmail(normalizeContact(valid));
  assert.match(email.subject, /Cabañas Río Cisnes \(Cisnes\)/);
  for (const piece of ["Ana Pérez", "Mantención garantizada", "ana@example.com", "no se caiga"]) {
    assert.ok(email.text.includes(piece), `falta ${piece}`);
  }
  assert.equal(email.replyTo, "ana@example.com");
  assert.equal(buildEmail(normalizeContact({ ...valid, contacto: "+56 9 4006 8228" })).replyTo, undefined);
});

test("si falla el envío, el mensaje viaja completo por WhatsApp", () => {
  const text = whatsappFallbackText(normalizeContact(valid));
  assert.match(text, /soy Ana Pérez de Cabañas Río Cisnes \(Cisnes\)\./);
  assert.match(text, /Mantención garantizada/);
});

/* ── Route handler real (worker compilado) ───────────────────────────── */

let worker;
async function post(body, { form = false } = {}) {
  if (!worker) {
    const url = new URL("../dist/server/index.js", import.meta.url);
    url.searchParams.set("test", `${process.pid}-contacto`);
    worker = (await import(url.href)).default;
  }
  const request = new Request("http://localhost/api/contacto", {
    method: "POST",
    headers: form
      ? { "content-type": "application/x-www-form-urlencoded" }
      : { "content-type": "application/json", accept: "application/json" },
    body: form ? new URLSearchParams(body).toString() : typeof body === "string" ? body : JSON.stringify(body),
  });
  return worker.fetch(
    request,
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

/** Simula Resend: registra las llamadas y deja pasar cualquier otra. */
function stubResend(status = 200) {
  const realFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.startsWith("https://api.resend.com/")) {
      calls.push({ url, init });
      return new Response(JSON.stringify({ id: "test" }), { status, headers: { "content-type": "application/json" } });
    }
    return realFetch(input, init);
  };
  return { calls, restore: () => { globalThis.fetch = realFetch; } };
}

function withKey(fn) {
  return async () => {
    process.env.RESEND_API_KEY = "re_test_clave_falsa";
    try { await fn(); } finally { delete process.env.RESEND_API_KEY; }
  };
}

test("ruta: sin RESEND_API_KEY responde 503 claro y no intenta enviar", async () => {
  delete process.env.RESEND_API_KEY;
  const resend = stubResend();
  try {
    const response = await post(valid);
    assert.equal(response.status, 503);
    const data = await response.json();
    assert.equal(data.ok, false);
    assert.equal(data.code, "no-config");
    assert.equal(resend.calls.length, 0);
  } finally { resend.restore(); }
});

test("ruta: datos inválidos → 422 con errores por campo", withKey(async () => {
  const resend = stubResend();
  try {
    const response = await post({ ...valid, comuna: "Santiago", contacto: "x" });
    assert.equal(response.status, 422);
    const data = await response.json();
    assert.equal(data.code, "invalid");
    assert.ok(data.errors.comuna);
    assert.ok(data.errors.contacto);
    assert.equal(resend.calls.length, 0);
  } finally { resend.restore(); }
}));

test("ruta: honeypot lleno → 200 'ok' sin enviar nada (el bot no se entera)", withKey(async () => {
  const resend = stubResend();
  try {
    const response = await post({ ...valid, website: "http://spam.example" });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(resend.calls.length, 0);
  } finally { resend.restore(); }
}));

test("ruta: envío demasiado rápido → tratado como bot", withKey(async () => {
  const resend = stubResend();
  try {
    const response = await post({ ...valid, t: String(Date.now()) });
    assert.equal(response.status, 200);
    assert.equal(resend.calls.length, 0);
  } finally { resend.restore(); }
}));

test("ruta: JSON roto → 400", async () => {
  const response = await post("{no es json");
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, "bad-request");
});

test("ruta: válido y con clave → un solo POST a Resend, a hola@tallerzur.cl", withKey(async () => {
  const resend = stubResend();
  try {
    const response = await post({ ...valid, t: String(Date.now() - 10_000) });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
    assert.equal(resend.calls.length, 1);
    const { url, init } = resend.calls[0];
    assert.equal(url, "https://api.resend.com/emails");
    assert.equal(init.method, "POST");
    assert.equal(init.headers.Authorization, "Bearer re_test_clave_falsa");
    const payload = JSON.parse(init.body);
    assert.deepEqual(payload.to, ["hola@tallerzur.cl"]);
    assert.equal(payload.reply_to, "ana@example.com");
    assert.match(payload.subject, /Cabañas Río Cisnes/);
    assert.match(payload.text, /Mantención garantizada/);
  } finally { resend.restore(); }
}));

test("ruta: si Resend falla → 502 y el formulario ofrece WhatsApp", withKey(async () => {
  const resend = stubResend(500);
  const quiet = console.error;
  console.error = () => {};
  try {
    const response = await post(valid);
    assert.equal(response.status, 502);
    assert.equal((await response.json()).code, "send-failed");
  } finally { resend.restore(); console.error = quiet; }
}));

test("ruta: formulario sin JS → página HTML legible, no JSON", async () => {
  delete process.env.RESEND_API_KEY;
  const response = await post(valid, { form: true });
  assert.equal(response.status, 503);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html/);
  const html = await response.text();
  assert.match(html, /lang="es-CL"/);
  assert.match(html, /wa\.me\/56940068228/);
  assert.match(html, /href="\/#contacto"/);
});
