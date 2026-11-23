"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AYSEN_COMUNAS, OUTSIDE_AYSEN, RUBROS, SERVICIOS, LIMITS,
  normalizeContact, validateContact, whatsappUrl, whatsappFallbackText,
  type ContactErrors, type ContactField, type ContactInput, type ServicioId,
} from "@/lib/contact";

type Status = "idle" | "sending" | "sent" | "error" | "no-config";

/** Con dos barras de señal, 20 s es un límite razonable antes de ofrecer WhatsApp. */
const TIMEOUT_MS = 20000;

const FIELD_ORDER: ContactField[] = ["nombre", "negocio", "comuna", "rubro", "sitio", "servicio", "mensaje", "contacto"];

type Props = {
  servicio: ServicioId | null;
  onServicioChange: (servicio: ServicioId | null) => void;
};

export default function ContactForm({ servicio, onServicioChange }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [lastInput, setLastInput] = useState<Partial<ContactInput>>({});
  const [sentName, setSentName] = useState("");
  // Marca de tiempo antispam: se fija al montar, no en el render del servidor.
  const [shownAt, setShownAt] = useState<number | null>(null);

  useEffect(() => { setShownAt(Date.now()); }, []);

  const focusFirstError = (errs: ContactErrors) => {
    const first = FIELD_ORDER.find((field) => errs[field]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const raw = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const input = normalizeContact(raw);
    setLastInput(input);

    const errs = validateContact(input);
    setErrors(errs);
    if (Object.keys(errs).length) { focusFirstError(errs); return; }

    setStatus("sending");
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch("/api/contacto", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(raw),
        signal: controller.signal,
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; code?: string; errors?: ContactErrors };
      if (response.ok && data.ok) {
        setSentName(input.nombre.split(/\s+/)[0] ?? "");
        setStatus("sent");
        formRef.current?.reset();
        onServicioChange(null);
      } else if (response.status === 422 && data.errors) {
        setErrors(data.errors);
        setStatus("idle");
        focusFirstError(data.errors);
      } else {
        setStatus(data.code === "no-config" ? "no-config" : "error");
      }
    } catch {
      setStatus("error");
    } finally {
      window.clearTimeout(timer);
    }
  }

  const describedBy = (field: ContactField, hint?: boolean) =>
    [hint ? `${field}-hint` : "", errors[field] ? `${field}-error` : ""].filter(Boolean).join(" ") || undefined;

  const fieldProps = (field: ContactField, hint = false) => ({
    id: `contacto-${field}`,
    name: field,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": describedBy(field, hint),
    onInput: () => errors[field] && setErrors((current) => ({ ...current, [field]: undefined })),
  });

  const error = (field: ContactField) =>
    errors[field] ? <p className="field-error" id={`${field}-error`}>{errors[field]}</p> : null;

  if (status === "sent") {
    return (
      <div className="form-done" role="status" aria-live="polite">
        <p className="section-label">mensaje enviado</p>
        <p className="form-done-title">Listo{sentName ? `, ${sentName}` : ""}.</p>
        <p>Te respondemos en menos de 24 horas, por el correo o teléfono que dejaste.</p>
        <button className="text-link" type="button" onClick={() => setStatus("idle")}>
          Enviar otro mensaje<i aria-hidden="true">↺</i>
        </button>
      </div>
    );
  }

  const failed = status === "error" || status === "no-config";

  return (
    <form ref={formRef} className="contact-form" action="/api/contacto" method="post" noValidate onSubmit={onSubmit}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="contacto-nombre">Tu nombre</label>
          <input {...fieldProps("nombre")} type="text" autoComplete="name" maxLength={LIMITS.nombre.max} required />
          {error("nombre")}
        </div>
        <div className="field">
          <label htmlFor="contacto-negocio">Tu negocio</label>
          <input {...fieldProps("negocio")} type="text" autoComplete="organization" maxLength={LIMITS.negocio.max} placeholder="Hostal, cabañas, restaurante…" required />
          {error("negocio")}
        </div>
        <div className="field">
          <label htmlFor="contacto-comuna">Comuna</label>
          <select {...fieldProps("comuna")} defaultValue="" required>
            <option value="" disabled>Elige tu comuna</option>
            <optgroup label="Región de Aysén">
              {AYSEN_COMUNAS.map((comuna) => <option key={comuna} value={comuna}>{comuna}</option>)}
            </optgroup>
            <option value={OUTSIDE_AYSEN}>{OUTSIDE_AYSEN}</option>
          </select>
          {error("comuna")}
        </div>
        <div className="field">
          <label htmlFor="contacto-rubro">Rubro</label>
          <select {...fieldProps("rubro")} defaultValue="" required>
            <option value="" disabled>Elige tu rubro</option>
            {RUBROS.map((rubro) => <option key={rubro} value={rubro}>{rubro}</option>)}
          </select>
          {error("rubro")}
        </div>
        <div className="field">
          <label htmlFor="contacto-servicio">Qué te interesa</label>
          <select
            {...fieldProps("servicio")}
            value={servicio ?? ""}
            onChange={(event) => onServicioChange((event.target.value || null) as ServicioId | null)}
            required
          >
            <option value="" disabled>Elige una opción</option>
            {SERVICIOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {error("servicio")}
        </div>
        <div className="field">
          <label htmlFor="contacto-sitio">Sitio web actual <span>(opcional)</span></label>
          <input {...fieldProps("sitio")} type="text" inputMode="url" autoComplete="url" autoCapitalize="none" spellCheck={false} maxLength={LIMITS.sitio.max} placeholder="tunegocio.cl" />
          {error("sitio")}
        </div>
        <div className="field field-wide">
          <label htmlFor="contacto-mensaje">Cuéntanos qué necesitas</label>
          <textarea {...fieldProps("mensaje")} rows={5} maxLength={LIMITS.mensaje.max} placeholder="Por ejemplo: tengo un hostal en Puyuhuapi y quiero que me encuentren en Google y recibir reservas." required />
          {error("mensaje")}
        </div>
        <div className="field field-wide">
          <label htmlFor="contacto-contacto">Correo o WhatsApp para responderte</label>
          <input {...fieldProps("contacto", true)} type="text" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={LIMITS.contacto.max} placeholder="nombre@tunegocio.cl o +56 9 1234 5678" required />
          <p className="field-hint" id="contacto-hint">Solo lo usamos para responderte.</p>
          {error("contacto")}
        </div>
      </div>

      {/* Honeypot: fuera de la vista y del tabulador. Las personas no lo llenan. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="contacto-website">No llenar este campo</label>
        <input id="contacto-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <input type="hidden" name="t" value={shownAt ?? ""} readOnly />

      <div className="form-actions">
        <button className="btn btn-dark" type="submit" disabled={status === "sending"} aria-busy={status === "sending"}>
          {status === "sending" ? "Enviando…" : "Enviar mensaje"}
        </button>
        <p className="form-note">Te respondemos en menos de 24 h. La asesoría inicial es gratis.</p>
      </div>

      <div className="form-status" role="status" aria-live="polite">
        {status === "sending" && <p>Enviando tu mensaje… si la señal está lenta, puede tardar unos segundos.</p>}
        {failed && (
          <div className="form-error">
            <p>
              {status === "no-config"
                ? "El formulario todavía no está conectado al correo. Escríbenos por WhatsApp, es lo más rápido: tu mensaje ya va escrito."
                : "No pudimos enviar el mensaje. Escríbenos por WhatsApp, es lo más rápido: tu mensaje ya va escrito."}
            </p>
            <a className="btn btn-dark" href={whatsappUrl(whatsappFallbackText(lastInput))} target="_blank" rel="noopener">
              Enviar por WhatsApp<i aria-hidden="true">↗</i>
            </a>
          </div>
        )}
      </div>
    </form>
  );
}
