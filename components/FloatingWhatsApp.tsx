"use client";

import { useEffect, useState } from "react";
import WhatsAppIcon from "@/components/WhatsAppIcon";

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
      <WhatsAppIcon size={26} />
      <span>WhatsApp</span>
    </a>
  );
}
