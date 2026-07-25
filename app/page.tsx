"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WeatherLayer from "@/components/WeatherLayer";
import { media, REMOTE_IMAGE_ORIGIN } from "@/lib/media";

/**
 * Coordenadas de Puerto Cisnes.
 *
 * Las anteriores (45°24'06" S) correspondían a Puerto Aysén, unos 70 km al sur;
 * la longitud coincidía porque ambos pueblos están casi en el mismo meridiano,
 * lo que hacía el error invisible. Estas son las de Puerto Cisnes.
 *
 * TODO: confirmar contra fuente oficial (IGM / BCN) antes de publicar.
 */
const COORDS = {
  label: { lat: "44°44′24″ S", lon: "72°41′48″ O" },
  short: "44°44′ S",
  decimal: { lat: -44.7400, lon: -72.6967 },
};

const projects = [
  {
    number: "01",
    eyebrow: "Bosque siempreverde",
    title: "La lluvia no interrumpe el paisaje. Lo crea.",
    text: "Coigües, tepas, helechos y musgos guardan el agua como una memoria antigua. Aquí, caminar lento es otra forma de escuchar.",
    image: media.bosqueHelechos,
    tone: "forest",
  },
  {
    number: "02",
    eyebrow: "Canal Puyuhuapi",
    title: "El mar entra a la montaña y todo queda en silencio.",
    text: "Las mareas dibujan la costa de Puerto Cisnes. Entre neblina y cumbres, el agua refleja una Patagonia que todavía conserva su ritmo original.",
    image: media.aguaCanal,
    tone: "water",
  },
  {
    number: "03",
    eyebrow: "Ruta austral",
    title: "Llegar también es parte de la experiencia.",
    text: "Desde la Carretera Austral, un desvío de treinta y cinco kilómetros baja entre ríos y cascadas hasta el canal. Cada curva anticipa un lugar apartado de lo evidente.",
    image: media.heroFiordo,
    tone: "road",
  },
];

const sectionLinks = [
  { id: "inicio", label: "Inicio", number: "01" },
  { id: "esencia", label: "Esencia", number: "02" },
  { id: "territorio", label: "Territorio", number: "03" },
  { id: "nosotros", label: "Nosotros", number: "04" },
  { id: "bosque", label: "Bosque", number: "05" },
  { id: "llegar", label: "Llegar", number: "06" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TouristDestination",
  name: "Puerto Cisnes",
  description:
    "Territorio de bosque siempreverde, lluvia y canales en la Región de Aysén, Patagonia chilena.",
  geo: {
    "@type": "GeoCoordinates",
    latitude: COORDS.decimal.lat,
    longitude: COORDS.decimal.lon,
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Puerto Cisnes",
    addressRegion: "Región de Aysén",
    addressCountry: "CL",
  },
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("inicio");
  const siteRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * El cargador ya no es un temporizador fijo de 1,55 s: sube hasta el 92 % y
   * espera a que la página esté realmente cargada, con un tope duro por si un
   * recurso remoto nunca responde. Antes, el LCP no podía bajar de ~1,7 s
   * daba igual lo rápido que fuera el servidor.
   */
  useEffect(() => {
    let frame = 0;
    let settled = false;
    const started = performance.now();

    const finish = () => {
      if (settled) return;
      settled = true;
      setLoadProgress(100);
      window.setTimeout(() => setReady(true), 160);
    };

    const tick = (now: number) => {
      const linear = Math.min(1, (now - started) / 1400);
      const eased = 1 - Math.pow(1 - linear, 3);
      if (!settled) setLoadProgress(Math.floor(eased * 92));
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);

    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });
    const cap = window.setTimeout(finish, 3000);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(cap);
      window.removeEventListener("load", finish);
    };
  }, []);

  // `is-ready` va en <body> para que el cargador y el hero puedan vivir fuera
  // de <main> sin perder el gancho de las animaciones de entrada.
  useEffect(() => {
    document.body.classList.toggle("is-ready", ready);
  }, [ready]);

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
            scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 1.25 },
          });
          hero
            .fromTo(".hero-image", { scale: 1.14, yPercent: -4.5 }, { scale: 1.035, yPercent: 4.5, duration: 1, ease: "none" }, 0)
            .to(".hero-copy", { yPercent: -22, opacity: 0, duration: .38, ease: "power1.in" }, .12)
            .to(".hero-bottom", { opacity: 0, y: -30, duration: .32, ease: "power1.in" }, .18)
            .to(".hero-dark", { opacity: .92, duration: .58, ease: "none" }, .36)
            .to(".hero-media", { clipPath: "inset(0 2.2% 4% 2.2% round 0 0 2.4rem 2.4rem)", duration: .42, ease: "power2.inOut" }, .58);

          gsap.fromTo(".manifesto-copy p", { opacity: .12, y: 75 }, {
            opacity: 1, y: 0, stagger: .1, ease: "power3.out",
            scrollTrigger: { trigger: ".manifesto-copy", start: "top 82%", end: "bottom 55%", scrub: .9 },
          });

          gsap.utils.toArray<HTMLElement>(".manifesto-photo").forEach((photo, index) => {
            gsap.fromTo(photo, {
              yPercent: index % 2 ? -12 : 12,
              rotate: index === 1 ? 4 : -3,
            }, {
              yPercent: index % 2 ? 12 : -12,
              rotate: index === 1 ? -1 : 1,
              ease: "none",
              scrollTrigger: { trigger: ".manifesto", start: "top bottom", end: "bottom top", scrub: 1.3 + index * .2 },
            });
          });

          const panels = gsap.utils.toArray<HTMLElement>(".project-panel");
          panels.forEach((panel, index) => {
            gsap.set(panel, { zIndex: index + 1 });
            const mediaEl = panel.querySelector(".project-media");
            const image = panel.querySelector("img");
            const copy = panel.querySelector(".project-copy");
            gsap.fromTo(mediaEl, { clipPath: "inset(4% 2% 4% 2%)", scale: .98, y: 16 }, {
              clipPath: "inset(0% 0% 0% 0%)", scale: 1, y: 0, ease: "none",
              scrollTrigger: { trigger: panel, start: "top bottom", end: "top top", scrub: 2.2 },
            });
            gsap.fromTo(image, { scale: 1.16, yPercent: -5 }, {
              scale: 1.02, yPercent: 5, ease: "none",
              scrollTrigger: { trigger: panel, start: "top bottom", end: "bottom top", scrub: 1.55 },
            });
            gsap.fromTo(copy, { y: 48, opacity: .2 }, {
              y: 0, opacity: 1, ease: "power3.out",
              scrollTrigger: { trigger: panel, start: "top 76%", end: "top 22%", scrub: 1.8 },
            });
            if (index < panels.length - 1) {
              // Sin `blur`: animarlo con scrub en tres paneles a pantalla
              // completa es de los efectos más caros que existen y no se
              // compone barato en GPU. El oscurecido solo ya da la profundidad.
              gsap.fromTo(panel.querySelector(".project-inner"), {
                scale: 1, y: 0, opacity: 1, filter: "brightness(1) saturate(1)",
              }, {
                scale: .972, y: -10, opacity: .92, filter: "brightness(.78) saturate(.86)", ease: "none",
                scrollTrigger: { trigger: panels[index + 1], start: "top bottom", end: "top top", scrub: 2.35 },
              });
            }
          });

          gsap.fromTo(".interlude-image img", { yPercent: -9, scale: 1.12 }, {
            yPercent: 9, scale: 1, ease: "none",
            scrollTrigger: { trigger: ".interlude", start: "top bottom", end: "bottom top", scrub: 1.1 },
          });
          gsap.fromTo(".interlude-word", { xPercent: -8 }, {
            xPercent: 8, ease: "none",
            scrollTrigger: { trigger: ".interlude", start: "top bottom", end: "bottom top", scrub: 1.1 },
          });

          const company = gsap.timeline({
            scrollTrigger: { trigger: ".company", start: "top bottom", end: "bottom bottom", scrub: 1.7 },
          });
          company
            .fromTo(".company-bg", { clipPath: "circle(5% at 50% 49%)", scale: .88 }, { clipPath: "circle(76% at 50% 49%)", scale: 1, ease: "none" }, 0)
            .fromTo(".company-bg img", { scale: 1.24, yPercent: -7 }, { scale: 1.02, yPercent: 5, ease: "none" }, 0)
            .fromTo(".company-emblem", { opacity: 0, scale: .74, rotate: -8 }, { opacity: 1, scale: 1, rotate: 0, ease: "power2.out" }, .14)
            .fromTo(".company-text > *", { opacity: 0, y: 34 }, { opacity: 1, y: 0, stagger: .055, ease: "power2.out" }, .2)
            .fromTo(".company-coordinate", { opacity: 0 }, { opacity: 1, ease: "none" }, .34)
            .to(".company-bg-shade", { opacity: .63, ease: "none" }, .42);

          gsap.utils.toArray<HTMLElement>(".gallery-shot").forEach((shot, index) => {
            gsap.fromTo(shot.querySelector("img"), { yPercent: -9, scale: 1.1 }, {
              yPercent: 9, scale: 1.01, ease: "none",
              scrollTrigger: { trigger: shot, start: "top bottom", end: "bottom top", scrub: 1.1 + index * .15 },
            });
          });

          ScrollTrigger.create({
            trigger: ".manifesto", start: "top 25%", endTrigger: ".arrival", end: "top 15%",
            onToggle: ({ isActive }) => document.querySelector(".header")?.classList.toggle("over-light", isActive),
          });
        }, siteRef);
        cleanups.push(() => ctx.revert());
      })
      .catch(() => {
        // Si el chunk de GSAP no carga, el sitio se queda estático pero entero:
        // ningún estado inicial de animación vive ya solo en el CSS.
        document.documentElement.classList.add("motion-unavailable");
      });

    return () => { cancelled = true; cleanups.forEach((cleanup) => cleanup()); };
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
    // cambiaron en este callback: con dos secciones largas en pantalla el
    // indicador se quedaba en la equivocada.
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

  const currentSection = sectionLinks.find((section) => section.id === activeSection) ?? sectionLinks[0];

  return (
    <>
      <link rel="preconnect" href={REMOTE_IMAGE_ORIGIN} crossOrigin="" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="loader" aria-hidden="true">
        <p>Donde comienza el silencio</p>
        <strong>{String(loadProgress).padStart(3, "0")}</strong>
        <span>{COORDS.short}</span>
        <div className="loader-line" style={{ transform: `scaleX(${loadProgress / 100})` }} />
      </div>

      <WeatherLayer />
      <div ref={progressRef} className="progress" aria-hidden="true" />

      <header className="header">
        <a className="brand" href="#top" aria-label="Puerto Cisnes, volver al inicio"><span>PUERTO</span><span>CISNES</span></a>
        {/* Sin aria-live: cambiaba en cada scroll y el lector de pantalla se
            interrumpía a sí mismo anunciando cada sección. Es decorativo. */}
        <p className="header-context">
          <small>{currentSection.number}</small>
          <span className="header-context-divider" aria-hidden="true" />
          <strong key={currentSection.id}>{currentSection.label}</strong>
          <i aria-hidden="true" />
          <span className="header-context-meta">Entre bosque y canal</span>
        </p>
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
        <div className="header-progress" aria-hidden="true" />
      </header>

      {/* `inert` en lugar de `aria-hidden`: clip-path no quita el foco, así que
          los enlaces del menú cerrado seguían siendo tabulables. */}
      <aside
        id="main-menu"
        ref={menuRef}
        className={menuOpen ? "menu is-open" : "menu"}
        inert={!menuOpen}
      >
        <nav aria-label="Navegación principal">
          {sectionLinks.slice(1).map((section, index) => (
            <a key={section.id} href={`#${section.id}`} onClick={closeMenu}>
              <small>{String(index + 1).padStart(2, "0")}</small> {section.label}
            </a>
          ))}
        </nav>
        <div className="menu-meta"><span>Región de Aysén</span><span>Chile austral</span></div>
      </aside>

      <main ref={siteRef} id="top" className="site">
        <section id="inicio" className="hero" aria-labelledby="hero-title">
          <div className="hero-media">
            <img
              className="hero-image"
              src={media.heroFiordo.src}
              alt={media.heroFiordo.alt}
              width={1536}
              height={960}
              fetchPriority="high"
            />
            <div className="hero-shade" /><div className="hero-dark" /><div className="mist mist-one" /><div className="mist mist-two" />
            <div className="hero-copy">
              <p className="kicker reveal">Patagonia, sin prisa</p>
              <h1 id="hero-title" className="reveal reveal-delay">Donde el bosque<br />toca el mar.</h1>
              <p className="hero-intro reveal reveal-delay-two">Un territorio de lluvia, canales y montañas<br />que se revela a quien aprende a mirar lento.</p>
            </div>
            <div className="hero-bottom">
              <span>{COORDS.label.lat} · {COORDS.label.lon}</span>
              <a href="#esencia">desliza para entrar <i aria-hidden="true">↓</i></a>
            </div>
          </div>
        </section>

        <section id="esencia" className="manifesto">
          <p className="section-label">esencia</p>
          <figure className="manifesto-photo manifesto-photo-a"><img src={media.queulatNuboso.src} alt={media.queulatNuboso.alt} loading="lazy" /></figure>
          <figure className="manifesto-photo manifesto-photo-b"><img src={media.aguaCanal.src} alt={media.aguaCanal.alt} width={1536} height={1024} loading="lazy" /></figure>
          <figure className="manifesto-photo manifesto-photo-c"><img src={media.bosqueHelechos.src} alt={media.bosqueHelechos.alt} width={1122} height={1402} loading="lazy" /></figure>
          <div className="manifesto-copy"><p>No vienes al sur</p><p>solo para verlo.</p><p className="muted">Vienes a recordarlo.</p></div>
          <div className="manifesto-note"><span>( el paisaje interior )</span><p>Entre la cordillera y el Pacífico, Puerto Cisnes guarda una forma más quieta de estar en el mundo.</p></div>
        </section>

        <section id="territorio" className="projects" aria-label="Territorios de Puerto Cisnes">
          <div className="projects-heading"><p className="section-label">territorio</p><h2>Tres maneras<br />de entrar al paisaje.</h2><p>La naturaleza no es un fondo.<br />Es quien marca el ritmo.</p></div>
          <div className="projects-stack">
            {projects.map((project) => (
              <article className={`project-panel project-${project.tone}`} key={project.number}>
                <div className="project-inner">
                  <div className="project-media"><img src={project.image.src} alt={project.image.alt} loading="lazy" /><div className="project-veil" /><span className="image-index">{project.number} / 03</span></div>
                  <div className="project-copy">
                    <div className="project-heading"><span>{project.number}</span><p>{project.eyebrow}</p></div>
                    <h3>{project.title}</h3><p className="project-text">{project.text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="nosotros" className="company" aria-labelledby="company-title">
          <div className="company-stage">
            <div className="company-bg"><img src={media.queulatEncantado.src} alt={media.queulatEncantado.alt} loading="lazy" /><div className="company-bg-shade" /></div>
            <p className="company-label"><span>nosotros</span><small>04 / 06</small></p>
            <div className="company-content">
              <div className="company-emblem" aria-hidden="true"><span>P</span><i /><span>C</span></div>
              <div className="company-text">
                <span className="company-kicker">( una hospitalidad nacida del paisaje )</span>
                <h2 className="company-title" id="company-title">Quiénes somos</h2>
                <p>Somos agua, bosque y comunidad. Un territorio modelado por la lluvia, donde la mesa, el descanso y el paisaje comparten un mismo ritmo.</p>
                <p>En Puerto Cisnes, recibir es abrir una puerta al sur: cocina de origen, refugio sereno y una relación honesta con cada estación.</p>
              </div>
            </div>
            <p className="company-coordinate"><span>{COORDS.label.lat}</span><i /><span>{COORDS.label.lon}</span></p>
          </div>
        </section>

        <section id="bosque" className="forest-gallery" aria-label="Bosques lluviosos del sur de Chile">
          <div className="gallery-intro"><p className="section-label">bosque lluvioso</p><h2>La humedad<br />también tiene memoria.</h2></div>
          <figure className="gallery-shot gallery-shot-wide"><img src={media.queulatNuboso.src} alt={media.queulatNuboso.alt} loading="lazy" /><figcaption>{media.queulatNuboso.caption}</figcaption></figure>
          <figure className="gallery-shot gallery-shot-tall"><img src={media.bosqueValdiviano.src} alt={media.bosqueValdiviano.alt} loading="lazy" /><figcaption>{media.bosqueValdiviano.caption}</figcaption></figure>
          <figure className="gallery-shot gallery-shot-small"><img src={media.queulatEncantado.src} alt={media.queulatEncantado.alt} loading="lazy" /><figcaption>{media.queulatEncantado.caption}</figcaption></figure>
        </section>

        <section className="interlude" aria-label="Una invitación a detenerse">
          <div className="interlude-word" aria-hidden="true">CISNES</div>
          <div className="interlude-image"><img src={media.bosqueHelechos.src} alt="" width={1122} height={1402} loading="lazy" /></div>
          <blockquote>“Aquí la distancia<br />no separa.<br />Devuelve perspectiva.”</blockquote>
        </section>

        <section id="llegar" className="arrival">
          <div className="arrival-top"><p className="section-label">la invitación</p><span>Puerto Cisnes · Chile</span></div>
          <h2>Vuelve<br />al sur.</h2>
          <div className="arrival-bottom">
            <p>Trae tiempo.<br />El resto lo pone el paisaje.</p>
            <a className="circle-link" href="mailto:hola@puertocisnes.cl"><span>Escribir</span><i aria-hidden="true">↗</i></a>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-mark">PUERTO CISNES</div>
        <div className="photo-credits">
          Fotografías libres:{" "}
          <a href={media.queulatEncantado.credit!.href} target="_blank" rel="noreferrer">{media.queulatEncantado.credit!.name}</a>{" "}
          y{" "}
          <a href={media.queulatNuboso.credit!.href} target="_blank" rel="noreferrer">{media.queulatNuboso.credit!.name}</a>{" "}
          · CC BY-SA 4.0.
        </div>
        <div className="footer-row"><span>© 2026 · Patagonia chilena</span><a href="#top">volver arriba ↑</a></div>
      </footer>
    </>
  );
}
