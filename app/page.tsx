"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import WeatherLayer from "@/components/WeatherLayer";
import Picture from "@/components/Picture";
import ContactForm from "@/components/ContactForm";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { media } from "@/lib/media";
import { SERVICES, MAINTENANCE, TRUST } from "@/lib/services";
import { PROJECTS } from "@/lib/projects";
import { FAQ } from "@/lib/faq";
import { COORDS, professionalServiceJsonLd, faqJsonLd } from "@/lib/seo";
import {
  CONTACT_EMAIL, WHATSAPP_DISPLAY, parseServicio, whatsappTextFor, whatsappUrl,
  type ServicioId,
} from "@/lib/contact";

/** Secciones que sigue el indicador del header (en orden vertical). */
const sectionLinks = [
  { id: "inicio", label: "Inicio" },
  { id: "servicios", label: "Servicios" },
  { id: "mantencion", label: "Mantención" },
  { id: "proyectos", label: "Proyectos" },
  { id: "nosotros", label: "Nosotros" },
  { id: "preguntas", label: "Preguntas" },
  { id: "contacto", label: "Contacto" },
];

/** Navegación visible: lo que un dueño de negocio viene a buscar. */
const navLinks = [
  { id: "servicios", label: "Servicios" },
  { id: "proyectos", label: "Proyectos" },
  { id: "preguntas", label: "Preguntas" },
  { id: "contacto", label: "Contacto" },
];

const jsonLd = professionalServiceJsonLd();
const faqLd = faqJsonLd();

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");
  const [servicio, setServicio] = useState<ServicioId | null>(null);
  const siteRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // `?servicio=` llega desde los correos de prospección o desde un CTA sin JS.
  useEffect(() => {
    const fromUrl = parseServicio(new URLSearchParams(window.location.search).get("servicio"));
    if (fromUrl) setServicio(fromUrl);
  }, []);

  /**
   * CTA de servicio: el `href` (`/?servicio=x#contacto`) funciona sin JS; con
   * JS se evita recargar la página, se preselecciona el servicio, la URL queda
   * compartible y el foco va al primer campo.
   */
  const chooseServicio = useCallback((id: ServicioId) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setServicio(id);
    window.history.replaceState(null, "", `?servicio=${id}#contacto`);
    const contact = document.getElementById("contacto");
    contact?.scrollIntoView({ block: "start" });
    window.setTimeout(() => document.getElementById("contacto-nombre")?.focus({ preventScroll: true }), 60);
  }, []);

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

  /**
   * Scrubs con GSAP solo si el usuario no pidió menos movimiento. El chunk se
   * carga después de pintar: nada del contenido depende de él.
   */
  useEffect(() => {
    if (!siteRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
      .then(([gsapModule, scrollModule]) => {
        if (cancelled || !siteRef.current) return;
        const gsap = gsapModule.gsap;
        const ScrollTrigger = scrollModule.ScrollTrigger;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          const hero = gsap.timeline({
            scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: .6 },
          });
          hero
            .fromTo(".hero-image", { scale: 1.1, yPercent: -3 }, { scale: 1.02, yPercent: 5, duration: 1, ease: "none" }, 0)
            .to(".hero-copy", { yPercent: -10, opacity: 0, duration: .45, ease: "power1.in" }, .3)
            .to(".hero-bottom", { opacity: 0, y: -20, duration: .3, ease: "power1.in" }, .2)
            .to(".hero-dark", { opacity: .85, duration: .6, ease: "none" }, .4);

          const panels = gsap.utils.toArray<HTMLElement>(".project-panel");
          panels.forEach((panel, index) => {
            const image = panel.querySelector("img");
            gsap.fromTo(image, { scale: 1.12, yPercent: -4 }, {
              scale: 1.02, yPercent: 4, ease: "none",
              scrollTrigger: { trigger: panel, start: "top bottom", end: "bottom top", scrub: .8 },
            });
            if (index < panels.length - 1) {
              // Sin `blur`: el oscurecido solo ya da la profundidad y se
              // compone barato en GPU.
              gsap.fromTo(panel.querySelector(".project-inner"), {
                scale: 1, opacity: 1, filter: "brightness(1)",
              }, {
                scale: .975, opacity: .92, filter: "brightness(.8)", ease: "none",
                scrollTrigger: { trigger: panels[index + 1], start: "top bottom", end: "top top", scrub: .8 },
              });
            }
          });

          const company = gsap.timeline({
            scrollTrigger: { trigger: ".company", start: "top bottom", end: "bottom bottom", scrub: .7 },
          });
          company
            .fromTo(".company-bg", { opacity: .2, scale: 1.04 }, { opacity: 1, scale: 1, ease: "none" }, 0)
            .fromTo(".company-bg img", { scale: 1.12, yPercent: -5 }, { scale: 1.02, yPercent: 3, ease: "none" }, 0)
            .fromTo(".company-emblem", { opacity: 0, scale: .85, rotate: -6 }, { opacity: 1, scale: 1, rotate: 0, ease: "power2.out" }, .1);
        }, siteRef);
        cleanups.push(() => ctx.revert());
      })
      .catch(() => {
        // Si el chunk de GSAP no carga, el sitio se queda estático pero entero.
        document.documentElement.classList.add("motion-unavailable");
      });

    return () => { cancelled = true; cleanups.forEach((cleanup) => cleanup()); };
  }, []);

  /**
   * Apariciones suaves de los bloques comerciales. La clase `js-reveal` solo
   * se pone con JS y sin reduced-motion: sin ella, todo está visible desde el
   * primer pintado.
   */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px" });
    // Lo que ya está en pantalla al cargar no se esconde.
    items.forEach((item) => {
      if (item.getBoundingClientRect().top < window.innerHeight) item.classList.add("is-in");
      else observer.observe(item);
    });
    root.classList.add("js-reveal");
    return () => { observer.disconnect(); root.classList.remove("js-reveal"); };
  }, []);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      progressRef.current?.style.setProperty("--progress", String(ratio));
      const header = document.querySelector<HTMLElement>(".header");
      header?.style.setProperty("--page-progress", String(ratio));
      header?.classList.toggle("is-scrolled", window.scrollY > 42);
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
  const whatsappHref = whatsappUrl(whatsappTextFor(servicio));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <a className="skip-link" href="#servicios">Saltar al contenido</a>
      <WeatherLayer />
      <div ref={progressRef} className="progress" aria-hidden="true" />

      <header className="header">
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
            {navLinks.map((link) => (
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
          {navLinks.map((link, index) => (
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

      <main ref={siteRef} id="top" className="site">
        <section id="inicio" className="hero" aria-labelledby="hero-title">
          <div className="hero-media">
            <Picture image={media.heroFiordo} sizes="100vw" className="hero-image" priority />
            <div className="hero-shade" /><div className="hero-dark" /><div className="mist mist-one" /><div className="mist mist-two" />
            <div className="hero-copy">
              <p className="kicker reveal">TallerZur · Puerto Cisnes, Aysén</p>
              <h1 id="hero-title" className="reveal-rise">Donde el bosque<br />toca el mar.</h1>
              <div className="hero-pitch reveal reveal-delay">
                <p className="hero-value">
                  Sitios web y mantención para hostales, cabañas, restaurantes y pymes de Aysén.{" "}
                  <span>Hechos para cargar aunque la señal no ayude.</span>
                </p>
                <div className="hero-ctas">
                  <a className="btn btn-light" href={whatsappUrl()} target="_blank" rel="noopener">
                    Hablemos por WhatsApp<i aria-hidden="true">↗</i>
                  </a>
                  <a className="btn btn-ghost" href="#proyectos">Ver proyectos<i aria-hidden="true">↓</i></a>
                </div>
              </div>
            </div>
            <div className="hero-bottom">
              <span>{COORDS.label.lat} · {COORDS.label.lon}</span>
              <a href="#servicios">qué hacemos <i aria-hidden="true">↓</i></a>
            </div>
          </div>
        </section>

        <section className="trust" aria-label="Por qué TallerZur">
          <ul>
            {TRUST.map((item, index) => (
              <li key={item.title} data-reveal style={{ transitionDelay: `${index * 70}ms` }}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <strong>{item.title}</strong>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="servicios" className="projects" aria-labelledby="servicios-title">
          <div className="projects-heading">
            <p className="section-label">territorio</p>
            <h2 id="servicios-title">Tres maneras<br />de sostener un sitio.</h2>
            <p>El código no es un adorno.<br />Es lo que sostiene el negocio.</p>
          </div>
          <div className="projects-stack">
            {SERVICES.map((service) => (
              <article className={`project-panel project-${service.tone}`} key={service.id} aria-labelledby={`servicio-${service.id}`}>
                <div className="project-inner">
                  <div className="project-media">
                    <Picture image={service.image} sizes="(max-width: 760px) 100vw, 62vw" />
                    <div className="project-veil" />
                    <span className="image-index">{service.number} / 03</span>
                  </div>
                  <div className="project-copy">
                    <div className="project-heading">
                      <span>{service.number}</span>
                      <p>{service.eyebrow}</p>
                      {service.featured && <em className="badge">Servicio estrella</em>}
                    </div>
                    <h3 id={`servicio-${service.id}`}>{service.title}</h3>
                    <p className="project-text">{service.text}</p>
                    <ul className="includes" aria-label={`Qué incluye ${service.eyebrow}`}>
                      {service.includes.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                    <p className="for-who"><strong>Para quién:</strong> {service.forWho}</p>
                    <a className="text-link" href={`/?servicio=${service.id}#contacto`} onClick={chooseServicio(service.id)}>
                      {service.cta}<i aria-hidden="true">↗</i>
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="mantencion" className="care" aria-labelledby="mantencion-title">
          <div className="care-head" data-reveal>
            <p className="section-label">servicio estrella · mantención garantizada</p>
            <h2 id="mantencion-title">{MAINTENANCE.heading}</h2>
            <p className="care-lead">{MAINTENANCE.lead}</p>
          </div>
          <dl className="care-grid">
            {MAINTENANCE.guarantees.map((item, index) => (
              <div key={item.label} data-reveal style={{ transitionDelay: `${index * 80}ms` }}>
                <dt><span>{item.value}</span>{item.label}</dt>
                <dd>{item.note}</dd>
              </div>
            ))}
          </dl>
          <div className="care-actions" data-reveal>
            <a className="btn btn-light" href="/?servicio=mantencion#contacto" onClick={chooseServicio("mantencion")}>
              {MAINTENANCE.cta}<i aria-hidden="true">↗</i>
            </a>
            <a className="btn btn-ghost" href={whatsappUrl(whatsappTextFor("mantencion"))} target="_blank" rel="noopener">
              Preguntar por WhatsApp
            </a>
          </div>
        </section>

        <section id="proyectos" className="work" aria-labelledby="proyectos-title">
          <div className="work-intro" data-reveal>
            <p className="section-label">proyectos</p>
            <h2 id="proyectos-title">Esto no<br />es un mockup.</h2>
            <p>Sitios reales, en producción. Entra y pruébalos desde tu celular.</p>
          </div>
          <div className="work-grid">
            {PROJECTS.map((project, index) => (
              <article className="work-card" key={project.slug} data-reveal style={{ transitionDelay: `${index * 90}ms` }}>
                <a className="work-shot" href={project.url} target="_blank" rel="noopener" tabIndex={-1} aria-hidden="true">
                  <picture>
                    <source type="image/avif" srcSet={project.image.avif} />
                    <img src={project.image.webp} alt="" width={project.image.width} height={project.image.height} loading="lazy" decoding="async" />
                  </picture>
                </a>
                <p className="work-meta"><span>{project.year}</span><span>{project.rubro}</span></p>
                <h3>{project.name}</h3>
                <p className="work-problem"><strong>El desafío:</strong> {project.problema}</p>
                <ul className="work-stack" aria-label="Tecnologías">
                  {project.stack.map((tag) => <li key={tag}>{tag}</li>)}
                </ul>
                <a className="text-link" href={project.url} target="_blank" rel="noopener">
                  Ver sitio en vivo<span className="sr-only"> ({project.name}, se abre en otra pestaña)</span><i aria-hidden="true">↗</i>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="nosotros" className="company" aria-labelledby="company-title">
          <div className="company-stage">
            <div className="company-bg">
              <Picture image={media.bosqueHelechos} sizes="100vw" alt="" />
              <div className="company-bg-shade" />
            </div>
            <p className="company-label"><span>nosotros</span><small>Puerto Cisnes</small></p>
            <div className="company-content">
              <div className="company-emblem" aria-hidden="true"><span>T</span><i /><span>Z</span></div>
              <div className="company-text">
                <span className="company-kicker">( no vienes al sur solo para verlo: vienes a recordarlo )</span>
                <h2 className="company-title" id="company-title">Quiénes somos</h2>
                <p>Somos TallerZur: desarrollo web hecho en Puerto Cisnes para negocios de la Región de Aysén. Sabemos que la señal falla y que tu cliente busca &ldquo;hostal en Coyhaique&rdquo; desde el celular con dos barras. Por eso construimos distinto.</p>
                <p>La lluvia que ves en esta página es la de ahora mismo, afuera de donde escribimos el código. Si aquí llueve, en el sitio llueve.</p>
              </div>
            </div>
            <p className="company-coordinate"><span>{COORDS.label.lat}</span><i /><span>{COORDS.label.lon}</span></p>
          </div>
        </section>

        <section id="preguntas" className="faq-section" aria-labelledby="preguntas-title">
          <div className="faq-intro" data-reveal>
            <p className="section-label">preguntas</p>
            <h2 id="preguntas-title">Lo que suelen<br />preguntarnos.</h2>
            <p>¿Otra duda? <a href={whatsappUrl("Hola TallerZur, tengo una pregunta:")} target="_blank" rel="noopener">Pregúntanos por WhatsApp</a>.</p>
          </div>
          <div className="faq-list">
            {FAQ.map(({ q, a }) => (
              <details key={q} data-reveal>
                <summary>{q}<i aria-hidden="true" /></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="contacto" className="arrival" aria-labelledby="contacto-title">
          <div className="arrival-top"><p className="section-label">hablemos</p><span>Puerto Cisnes, Aysén · Chile</span></div>
          <h2 id="contacto-title">Construyamos<br />desde el sur.</h2>
          <div className="contact-layout">
            <div className="contact-direct">
              <p className="contact-lead">La forma más rápida es WhatsApp. Si prefieres, déjanos tus datos y te escribimos nosotros.</p>
              <a className="wa-big" href={whatsappHref} target="_blank" rel="noopener">
                <span className="wa-big-label">Hablemos por WhatsApp</span>
                <span className="wa-big-number">{WHATSAPP_DISPLAY}</span>
                <i aria-hidden="true">↗</i>
              </a>
              <ul className="contact-facts">
                <li>Respuesta en menos de 24 h</li>
                <li>Asesoría inicial gratis</li>
                <li>Correo: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
              </ul>
            </div>
            <ContactForm servicio={servicio} onServicioChange={setServicio} />
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-mark" aria-hidden="true">TALLERZUR</div>
        <div className="footer-row">
          <span>© 2026 TallerZur · Puerto Cisnes, Aysén</span>
          <span className="footer-links">
            <a href={whatsappUrl()} target="_blank" rel="noopener">WhatsApp</a>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <a href="#top">volver arriba ↑</a>
          </span>
        </div>
      </footer>

      <FloatingWhatsApp href={whatsappHref} />
    </>
  );
}
