import {
  CONTACT_EMAIL, buildEmail, isSpam, normalizeContact, validateContact,
  whatsappFallbackText, whatsappUrl, type ContactInput,
} from "@/lib/contact";

/**
 * POST /api/contacto
 *
 * - JSON (el formulario con JS) → responde JSON.
 * - application/x-www-form-urlencoded (navegador sin JS) → responde una
 *   página HTML mínima con el resultado y un enlace de vuelta.
 *
 * Envía con la API HTTP de Resend (un `fetch`, sin SDK). La clave vive en
 * `RESEND_API_KEY` (`.env.local` en desarrollo, `wrangler secret put` en
 * producción). Nunca en el código.
 */

const RESEND_URL = "https://api.resend.com/emails";
/** Requiere el dominio tallerzur.cl verificado en Resend. Se puede cambiar con CONTACT_FROM. */
const DEFAULT_FROM = "TallerZur web <web@tallerzur.cl>";
const MAX_BODY_BYTES = 32 * 1024;

type Result =
  | { ok: true }
  | { ok: false; code: "bad-request" | "too-large" | "invalid" | "no-config" | "send-failed"; message: string; errors?: Record<string, string | undefined> };

/**
 * Lee una variable de entorno: primero `process.env` (Node, tests y workerd
 * con nodejs_compat), después los bindings de `cloudflare:workers`. El
 * especificador va en una variable para que Vite no intente resolverlo.
 */
async function readEnv(name: string): Promise<string | undefined> {
  const fromProcess = typeof process !== "undefined" ? process.env?.[name] : undefined;
  if (fromProcess) return fromProcess;
  try {
    const specifier = "cloudflare:workers";
    const mod = (await import(/* @vite-ignore */ specifier)) as { env?: Record<string, unknown> };
    const value = mod.env?.[name];
    return typeof value === "string" && value ? value : undefined;
  } catch {
    return undefined;
  }
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

function htmlPage(status: number, result: Result, input?: ContactInput): Response {
  const title = result.ok ? "Mensaje enviado" : "No pudimos enviar tu mensaje";
  const body = result.ok
    ? "<p>Gracias. Te respondemos en menos de 24 horas, por el correo o teléfono que dejaste.</p>"
    : [
        `<p>${escapeHtml(result.message)}</p>`,
        result.errors
          ? `<ul>${Object.values(result.errors).filter(Boolean).map((e) => `<li>${escapeHtml(e!)}</li>`).join("")}</ul>`
          : "",
        `<p><a href="${escapeHtml(whatsappUrl(whatsappFallbackText(input ?? {})))}">Escríbenos por WhatsApp</a>, es lo más rápido.</p>`,
      ].join("");
  const html = `<!doctype html><html lang="es-CL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} · TallerZur</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#aeb4a8;color:#10130f;font:16px/1.6 Georgia,serif;padding:1.5rem}main{max-width:32rem}h1{font-weight:400;font-size:2.4rem;line-height:1;margin:0 0 1rem}a{color:inherit}</style></head><body><main><h1>${title}</h1>${body}<p><a href="/#contacto">Volver al sitio</a></p></main></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

function reply(asHtml: boolean, status: number, result: Result, input?: ContactInput): Response {
  if (asHtml) return htmlPage(status, result, input);
  return Response.json(result, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request): Promise<Response> {
  const type = request.headers.get("content-type") ?? "";
  const asHtml = type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return reply(asHtml, 413, { ok: false, code: "too-large", message: "El mensaje es demasiado largo." });
  }

  let raw: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return reply(asHtml, 413, { ok: false, code: "too-large", message: "El mensaje es demasiado largo." });
    }
    raw = asHtml ? Object.fromEntries(new URLSearchParams(text)) : JSON.parse(text);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("cuerpo no es un objeto");
  } catch {
    return reply(asHtml, 400, { ok: false, code: "bad-request", message: "No entendimos el formulario. Intenta de nuevo." });
  }

  const input = normalizeContact(raw);

  // A un bot no se le avisa que fue detectado: recibe el mismo "ok".
  if (isSpam(input)) return reply(asHtml, 200, { ok: true });

  const errors = validateContact(input);
  if (Object.keys(errors).length) {
    return reply(asHtml, 422, { ok: false, code: "invalid", message: "Revisa los campos marcados.", errors }, input);
  }

  const apiKey = await readEnv("RESEND_API_KEY");
  if (!apiKey) {
    return reply(asHtml, 503, {
      ok: false,
      code: "no-config",
      message: "El formulario todavía no está conectado al correo.",
    }, input);
  }

  const email = buildEmail(input);
  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: (await readEnv("CONTACT_FROM")) ?? DEFAULT_FROM,
        to: [CONTACT_EMAIL],
        subject: email.subject,
        text: email.text,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
    });
    if (!response.ok) {
      console.error("[contacto] Resend respondió", response.status, await response.text().catch(() => ""));
      return reply(asHtml, 502, { ok: false, code: "send-failed", message: "No pudimos enviar el mensaje." }, input);
    }
  } catch (error) {
    console.error("[contacto] fallo de red con Resend", error);
    return reply(asHtml, 502, { ok: false, code: "send-failed", message: "No pudimos enviar el mensaje." }, input);
  }

  return reply(asHtml, 200, { ok: true });
}
