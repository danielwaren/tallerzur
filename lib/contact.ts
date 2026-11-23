/**
 * Contacto de TallerZur: datos reales, opciones del formulario y validación.
 *
 * La validación es pura y la usan los dos lados: el formulario (para avisar
 * antes de enviar) y `app/api/contacto/route.ts` (que es la que manda). Si
 * cambia una regla, cambia en un solo lugar.
 */

/**
 * Correo de contacto. Provisorio hasta tener el correo corporativo
 * (hola@tallerzur.cl): cambiarlo aquí lo cambia en todo el sitio, en el
 * JSON-LD y en el destino de los mensajes del formulario.
 */
export const CONTACT_EMAIL = "danielguz.ga@gmail.com";
export const WHATSAPP_NUMBER = "56940068228";
export const WHATSAPP_DISPLAY = "+56 9 4006 8228";
export const WHATSAPP_DEFAULT_TEXT = "Hola TallerZur, quiero conversar sobre una página web para mi negocio.";

export function whatsappUrl(text: string = WHATSAPP_DEFAULT_TEXT): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/** Las 10 comunas de la Región de Aysén, de norte a sur. */
export const AYSEN_COMUNAS = [
  "Guaitecas",
  "Cisnes",
  "Lago Verde",
  "Aysén",
  "Coyhaique",
  "Río Ibáñez",
  "Chile Chico",
  "Cochrane",
  "O'Higgins",
  "Tortel",
] as const;

export const OUTSIDE_AYSEN = "Fuera de Aysén";
export const COMUNA_OPTIONS: readonly string[] = [...AYSEN_COMUNAS, OUTSIDE_AYSEN];

export const RUBROS = [
  "Hostal, cabañas u hospedaje",
  "Hotel o lodge",
  "Restaurante, café o cocinería",
  "Turismo y excursiones",
  "Comercio o tienda",
  "Servicios profesionales",
  "Otro",
] as const;

export const SERVICIOS = [
  { id: "desarrollo", label: "Desarrollo web" },
  { id: "mantencion", label: "Mantención garantizada" },
  { id: "digitales", label: "Servicios digitales" },
  { id: "asesoria", label: "Todavía no sé, quiero asesoría" },
] as const;

export type ServicioId = (typeof SERVICIOS)[number]["id"];

export function parseServicio(value: unknown): ServicioId | null {
  return SERVICIOS.find((s) => s.id === value)?.id ?? null;
}

export function servicioLabel(id: string): string {
  return SERVICIOS.find((s) => s.id === id)?.label ?? "una página web";
}

/** Texto de WhatsApp según el servicio elegido en un CTA. */
export function whatsappTextFor(servicio: ServicioId | null): string {
  if (!servicio || servicio === "asesoria") return WHATSAPP_DEFAULT_TEXT;
  return `Hola TallerZur, quiero conversar sobre ${servicioLabel(servicio).toLowerCase()} para mi negocio.`;
}

/* ------------------------------------------------------------------ */

export type ContactInput = {
  nombre: string;
  negocio: string;
  comuna: string;
  rubro: string;
  sitio: string;
  servicio: string;
  mensaje: string;
  contacto: string;
  /** Honeypot: invisible para personas. Si viene lleno, es un bot. */
  website: string;
  /** Momento (ms) en que se mostró el formulario. */
  t: number | null;
};

export type ContactField = Exclude<keyof ContactInput, "website" | "t">;
export type ContactErrors = Partial<Record<ContactField, string>>;

export const LIMITS = {
  nombre: { min: 2, max: 80 },
  negocio: { min: 2, max: 120 },
  sitio: { min: 0, max: 200 },
  mensaje: { min: 10, max: 2000 },
  contacto: { min: 6, max: 120 },
} as const;

/** Menos de esto entre mostrar y enviar no lo hace una persona. */
export const MIN_FILL_MS = 3000;

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function normalizeContact(raw: Record<string, unknown>): ContactInput {
  const t = Number(raw.t);
  return {
    nombre: str(raw.nombre),
    negocio: str(raw.negocio),
    comuna: str(raw.comuna),
    rubro: str(raw.rubro),
    sitio: str(raw.sitio),
    servicio: str(raw.servicio),
    // El mensaje conserva saltos de línea; solo se recortan los extremos.
    mensaje: str(raw.mensaje).replace(/\r\n?/g, "\n"),
    contacto: str(raw.contacto),
    website: str(raw.website),
    t: Number.isFinite(t) && t > 0 ? t : null,
  };
}

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;
const SITE_RE = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;

export function contactKind(value: string): "email" | "telefono" | null {
  if (EMAIL_RE.test(value)) return "email";
  const digits = value.replace(/[\s()+.-]/g, "");
  if (/^\d{8,12}$/.test(digits) && /^[\d\s()+.-]+$/.test(value)) return "telefono";
  return null;
}

export function isSpam(input: ContactInput, now: number = Date.now()): boolean {
  if (input.website) return true;
  // Sin marca de tiempo no se castiga: puede venir de un navegador sin JS.
  if (input.t !== null && now - input.t < MIN_FILL_MS) return true;
  return false;
}

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};
  const length = (field: keyof typeof LIMITS, label: string, required = true) => {
    const value = input[field];
    const { min, max } = LIMITS[field];
    if (!value) {
      if (required) errors[field] = `Falta ${label}.`;
      return;
    }
    if (value.length < min) errors[field] = `${label[0].toUpperCase()}${label.slice(1)} es demasiado corto.`;
    else if (value.length > max) errors[field] = `Máximo ${max} caracteres.`;
  };

  length("nombre", "tu nombre");
  length("negocio", "el nombre de tu negocio");
  length("mensaje", "el mensaje");
  if (input.mensaje && input.mensaje.length < LIMITS.mensaje.min) {
    errors.mensaje = "Cuéntanos un poco más (al menos 10 caracteres).";
  }

  if (!input.comuna) errors.comuna = "Elige tu comuna.";
  else if (!COMUNA_OPTIONS.includes(input.comuna)) errors.comuna = "Elige una comuna de la lista.";

  if (!input.rubro) errors.rubro = "Elige el rubro de tu negocio.";
  else if (!(RUBROS as readonly string[]).includes(input.rubro)) errors.rubro = "Elige un rubro de la lista.";

  if (!input.servicio) errors.servicio = "Elige qué te interesa.";
  else if (!parseServicio(input.servicio)) errors.servicio = "Elige una opción de la lista.";

  length("sitio", "el sitio", false);
  if (input.sitio && !errors.sitio && !SITE_RE.test(input.sitio)) {
    errors.sitio = "Escribe la dirección completa, por ejemplo tunegocio.cl.";
  }

  length("contacto", "un correo o teléfono");
  if (input.contacto && !errors.contacto && !contactKind(input.contacto)) {
    errors.contacto = "Escribe un correo (nombre@dominio.cl) o un teléfono (+56 9 1234 5678).";
  }

  return errors;
}

/** Correo que recibe CONTACT_EMAIL. Texto plano: nada que escapar en HTML. */
export function buildEmail(input: ContactInput) {
  const subject = `Contacto web: ${input.negocio} (${input.comuna})`.slice(0, 160);
  const lines = [
    `Nombre: ${input.nombre}`,
    `Negocio: ${input.negocio}`,
    `Comuna: ${input.comuna}`,
    `Rubro: ${input.rubro}`,
    `Sitio actual: ${input.sitio || "no tiene / no indicó"}`,
    `Servicio: ${servicioLabel(input.servicio)}`,
    `Contacto: ${input.contacto}`,
    "",
    "Mensaje:",
    input.mensaje,
  ];
  const replyTo = contactKind(input.contacto) === "email" ? input.contacto : undefined;
  return { subject, text: lines.join("\n"), replyTo };
}

/** Si el envío falla, el mismo contenido viaja por WhatsApp. */
export function whatsappFallbackText(input: Partial<ContactInput>): string {
  const parts = [
    "Hola TallerZur,",
    input.nombre ? `soy ${input.nombre}` : "",
    input.negocio ? `de ${input.negocio}` : "",
    input.comuna ? `(${input.comuna}).` : "",
    input.servicio ? `Me interesa: ${servicioLabel(input.servicio)}.` : "",
    input.mensaje ?? "",
  ];
  return parts.filter(Boolean).join(" ").replace(/\s+\./g, ".").slice(0, 1500);
}
