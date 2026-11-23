"use client";

import { useCallback, useEffect, useState } from "react";
import ContactForm from "@/components/ContactForm";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import {
  CONTACT_EMAIL, WHATSAPP_DISPLAY, parseServicio, whatsappTextFor, whatsappUrl,
  type ServicioId,
} from "@/lib/contact";

/**
 * Contacto directo (WhatsApp) + formulario, compartiendo el servicio elegido.
 *
 * Los CTA de servicio del resto de la página son enlaces normales del
 * servidor (`/?servicio=x#contacto`, con `data-servicio`): funcionan sin JS.
 * Con JS, este componente los intercepta por delegación, preselecciona el
 * servicio sin recargar, deja la URL compartible y lleva la pantalla al
 * formulario (que cabe entero en una pantalla) con el foco en el primer campo.
 */
export default function ContactPanel() {
  const [servicio, setServicio] = useState<ServicioId | null>(null);
  const message = whatsappTextFor(servicio);

  const choose = useCallback((id: ServicioId) => {
    setServicio(id);
    window.history.replaceState(null, "", `?servicio=${id}#contacto`);
    const form = document.getElementById("contacto-form");
    (form ?? document.getElementById("contacto"))?.scrollIntoView({ block: "start" });
    window.setTimeout(() => document.getElementById("contacto-nombre")?.focus({ preventScroll: true }), 60);
  }, []);

  // `?servicio=` llega desde los correos de prospección o desde un CTA sin JS.
  useEffect(() => {
    const fromUrl = parseServicio(new URLSearchParams(window.location.search).get("servicio"));
    if (fromUrl) setServicio(fromUrl);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[data-servicio]");
      const id = parseServicio(link?.dataset.servicio);
      if (!link || !id) return;
      event.preventDefault();
      choose(id);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [choose]);

  return (
    <div className="contact-layout">
      <div className="contact-direct">
        <p className="contact-lead">La forma más rápida es WhatsApp. Si prefieres, déjanos tus datos y te escribimos nosotros.</p>

        {/* Botón de WhatsApp: sobrio en reposo; el movimiento está en los
            detalles (relleno que barre, flechas que se cruzan, punto en línea). */}
        <a className="wa-btn" href={whatsappUrl(message)} target="_blank" rel="noopener">
          <span className="wa-btn-icon"><WhatsAppIcon size={20} /></span>
          <span className="wa-btn-text">
            <span className="wa-btn-label">Escríbenos por WhatsApp</span>
            <span className="wa-btn-meta"><i className="wa-online" aria-hidden="true" />Respondemos en menos de 24 h</span>
          </span>
          <span className="wa-btn-arrow" aria-hidden="true"><i>→</i><i>→</i></span>
        </a>
        <p className="wa-btn-note">{WHATSAPP_DISPLAY} · el mensaje ya va escrito</p>

        <ul className="contact-facts">
          <li>Asesoría inicial gratis</li>
          <li>Correo: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
        </ul>
      </div>
      <ContactForm servicio={servicio} onServicioChange={setServicio} />
    </div>
  );
}
