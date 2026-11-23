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

        {/* Botón de WhatsApp como vista previa del chat: muestra el mensaje
            que ya va escrito (cambia según el servicio elegido). */}
        <a className="wa-chat" href={whatsappUrl(message)} target="_blank" rel="noopener" data-reveal>
          <span className="wa-chat-head">
            <span className="wa-avatar"><WhatsAppIcon size={24} /></span>
            <span className="wa-chat-id">
              <strong>TallerZur</strong>
              <small><i className="wa-online" aria-hidden="true" />responde en menos de 24 h</small>
            </span>
            <i className="wa-chat-arrow" aria-hidden="true">↗</i>
          </span>
          <span className="wa-thread" aria-hidden="true">
            <span className="wa-typing" key={`typing-${servicio ?? "general"}`}><i /><i /><i /></span>
            <span className="wa-bubble" key={`bubble-${servicio ?? "general"}`}>
              {message}
              <small>ahora ✓✓</small>
            </span>
          </span>
          <span className="wa-chat-cta">
            Abrir WhatsApp<span className="wa-chat-number">{WHATSAPP_DISPLAY}</span>
          </span>
          <span className="sr-only">: el mensaje ya va escrito.</span>
        </a>

        <ul className="contact-facts">
          <li>Asesoría inicial gratis</li>
          <li>Correo: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
        </ul>
      </div>
      <ContactForm servicio={servicio} onServicioChange={setServicio} />
    </div>
  );
}
