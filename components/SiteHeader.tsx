"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { whatsappUrl } from "@/lib/contact";

/** Secciones que sigue el indicador del header (en orden vertical). */
const sectionLinks = [
  { id: "inicio", label: "Inicio" },
  { id: "servicios", label: "Servicios" },
  { id: "proyectos", label: "Proyectos" },
  { id: "nosotros", label: "Nosotros" },
  { id: "preguntas", label: "Preguntas" },
  { id: "contacto", label: "Contacto" },
];

/** Navegación visible: lo que un dueño de negocio viene a buscar. */
const NAV_LINKS = [
  { id: "servicios", label: "Servicios" },
  { id: "proyectos", label: "Proyectos" },
  { id: "preguntas", label: "Preguntas" },
  { id: "contacto", label: "Contacto" },
];

/**
 * Header fijo, menú móvil y barra de progreso. Es la única parte de la
 * navegación que necesita JS; el resto de la página llega como HTML del
 * servidor y no se hidrata.
 */
export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");
  const headerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const whatsappHref = whatsappUrl();

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { closeMenu(); return; }
      if (event.key !== "Tab") return;
      // Trampa de foco: con el menú abierto, tabular no puede salirse a
      // contenido que el usuario no ve.
      const focusables = menuRef.current?.querySelectorAll<HTMLElement>("a[href], button");
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      progressRef.current?.style.setProperty("--progress", String(ratio));
      headerRef.current?.style.setProperty("--page-progress", String(ratio));
      headerRef.current?.classList.toggle("is-scrolled", window.scrollY > 42);
      ticking = false;
    };
    const onScroll = () => { if (!ticking) { window.requestAnimationFrame(update); ticking = true; } };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = sectionLinks
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length) return;
    // Se mantiene el conjunto completo de secciones visibles, no solo las que
    // cambiaron en este callback.
    const visible = new Set<HTMLElement>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target as HTMLElement);
        else visible.delete(entry.target as HTMLElement);
      }
      const nearest = [...visible].sort(
        (a, b) => Math.abs(a.getBoundingClientRect().top) - Math.abs(b.getBoundingClientRect().top),
      )[0];
      if (nearest?.id) setActiveSection(nearest.id);
    }, { rootMargin: "-34% 0px -54% 0px", threshold: [0, .1, .35] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const currentIndex = Math.max(0, sectionLinks.findIndex((section) => section.id === activeSection));
  const currentSection = sectionLinks[currentIndex];

  return (
    <>
      <div ref={progressRef} className="progress" aria-hidden="true" />
      <header ref={headerRef} className="header">
        <a className="brand" href="#top" aria-label="TallerZur, volver al inicio"><span>TALLER</span><span>ZUR</span></a>
        {/* Sin aria-live: cambiaba en cada scroll. Es decorativo. */}
        <p className="header-context" aria-hidden="true">
          <small>{String(currentIndex + 1).padStart(2, "0")}</small>
          <span className="header-context-divider" />
          <strong key={currentSection.id}>{currentSection.label}</strong>
          <i />
          <span className="header-context-meta">Entre bosque y canal</span>
        </p>
        <div className="header-actions">
          <nav className="header-nav" aria-label="Secciones">
            {NAV_LINKS.map((link) => (
              <a key={link.id} href={`#${link.id}`} aria-current={activeSection === link.id ? "true" : undefined}>{link.label}</a>
            ))}
          </nav>
          <a className="header-wa" href={whatsappHref} target="_blank" rel="noopener">WhatsApp<i aria-hidden="true">↗</i></a>
          <button
            ref={menuButtonRef}
            className="menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="main-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>{menuOpen ? "cerrar" : "menú"}</span><i aria-hidden="true" />
          </button>
        </div>
        <div className="header-progress" aria-hidden="true" />
      </header>

      {/* `inert` en lugar de `aria-hidden`: clip-path no quita el foco. */}
      <aside id="main-menu" ref={menuRef} className={menuOpen ? "menu is-open" : "menu"} inert={!menuOpen}>
        <nav aria-label="Navegación principal">
          {NAV_LINKS.map((link, index) => (
            <a key={link.id} href={`#${link.id}`} onClick={closeMenu}>
              <small>{String(index + 1).padStart(2, "0")}</small> {link.label}
            </a>
          ))}
        </nav>
        <div className="menu-meta">
          <a className="btn btn-dark" href={whatsappHref} target="_blank" rel="noopener">Hablemos por WhatsApp<i aria-hidden="true">↗</i></a>
          <span>Puerto Cisnes · Región de Aysén</span>
        </div>
      </aside>
    </>
  );
}
