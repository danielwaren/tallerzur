"use client";

import { useEffect, useState } from "react";

/**
 * Botón de WhatsApp flotante, solo en el celular (el CSS lo oculta desde
 * 761 px). Aparece cuando el CTA del hero ya salió de la pantalla y se
 * esconde al llegar a #contacto, donde ya hay un WhatsApp grande: nunca dos
 * botones iguales a la vista, nunca tapando el formulario.
 */
export default function FloatingWhatsApp({ href }: { href: string }) {
  const [heroVisible, setHeroVisible] = useState(true);
  const [contactVisible, setContactVisible] = useState(false);

  useEffect(() => {
    const heroCta = document.querySelector(".hero-ctas");
    const contact = document.getElementById("contacto");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === heroCta) setHeroVisible(entry.isIntersecting);
        if (entry.target === contact) setContactVisible(entry.isIntersecting);
      }
    });
    if (heroCta) observer.observe(heroCta);
    if (contact) observer.observe(contact);
    return () => observer.disconnect();
  }, []);

  const visible = !heroVisible && !contactVisible;

  return (
    <a
      className={visible ? "wa-float is-visible" : "wa-float"}
      href={href}
      target="_blank"
      rel="noopener"
      aria-label="Escribir a TallerZur por WhatsApp"
      tabIndex={visible ? undefined : -1}
      aria-hidden={visible ? undefined : true}
    >
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.2-1.36A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.08.8.82-3-.2-.31a8.2 8.2 0 1 1 6.96 3.84Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.55.12-.16.25-.63.8-.78.96-.14.17-.29.19-.53.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.43.25-.4.72-1.34.08-.16.04-.3-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47a.9.9 0 0 0-.65.3 2.74 2.74 0 0 0-.85 2.03 4.76 4.76 0 0 0 1 2.53 10.9 10.9 0 0 0 4.17 3.69c1.55.67 2.16.73 2.94.61.47-.07 1.46-.6 1.66-1.17.2-.58.2-1.07.14-1.17-.06-.1-.22-.17-.47-.29Z"
        />
      </svg>
      <span>WhatsApp</span>
    </a>
  );
}
