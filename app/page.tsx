"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import WeatherLayer from "@/components/WeatherLayer";
import { media, REMOTE_IMAGE_ORIGIN, PORTFOLIO, portfolioShot, PORTFOLIO_IMAGE_ORIGIN } from "@/lib/media";
import { SITE_URL } from "@/lib/site";

const WHATSAPP_URL = "https://wa.me/56940068228?text=Hola%20TallerZur,%20quiero%20una%20p%C3%A1gina%20web";
const CONTACT_EMAIL = "hola@tallerzur.cl";

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

/**
 * Las tres líneas de trabajo reales de TallerZur, escritas con la misma voz
 * específica del resto del sitio — nada de "soluciones digitales de
 * vanguardia". La imagen de fondo se queda siendo el paisaje: el oficio pasa
 * por debajo, no lo reemplaza.
 */
const projects = [
  {
    number: "01",
    eyebrow: "Desarrollo web",
    title: "Un sitio que carga incluso con la señal del sur.",
    text: "Landing pages, sitios y tiendas a medida — livianos, rápidos y pensados para vender desde el primer día, no para ganar premios de diseño.",
    image: media.bosqueHelechos,
    tone: "forest",
  },
  {
    number: "02",
    eyebrow: "Mantenimiento",
    title: "Un sitio abandonado se nota antes que uno mal hecho.",
    text: "Actualizaciones, respaldos y seguridad sin tickets eternos. Si algo falla, hablas con quien lo construyó, no con un formulario.",
    image: media.aguaCanal,
    tone: "water",
  },
  {
    number: "03",
    eyebrow: "Servicios digitales",
    title: "Reservas, catálogos y pagos, sin depender de una sola app.",
    text: "Herramientas hechas a medida de tu operación: lo que tu negocio necesita para crecer, no una plantilla genérica con tu logo encima.",
    image: media.heroFiordo,
    tone: "road",
  },
];

const sectionLinks = [
  { id: "inicio", label: "Inicio", number: "01" },
  { id: "esencia", label: "Esencia", number: "02" },
  { id: "territorio", label: "Territorio", number: "03" },
  { id: "nosotros", label: "Nosotros", number: "04" },
  { id: "bosque", label: "Proyectos", number: "05" },
  { id: "llegar", label: "Llegar", number: "06" },
];

/**
 * Comunas reales de la Región de Aysén — no toda la región de golpe. Google
 * y quien busca escriben el nombre del pueblo, no "Región de Aysén" (ver
 * src/content/blog/seo-local-como-aparecer-en-google.md en /tallerzur: "un
 * turista no escribe 'hospedaje turístico de calidad en la Región de
 * Aysén', escribe 'hostal Puerto Cisnes'"). `areaServed` lista las comunas
 * de mayor población / búsqueda primero.
 */
const AYSEN_COMUNAS = ["Coyhaique", "Puerto Aysén", "Puerto Cisnes", "Chile Chico", "Cochrane"];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "TallerZur",
  url: SITE_URL,
  description:
    "Desarrollo web, mantenimiento y servicios digitales para hostales, restaurantes, peluquerías y hoteles de la Región de Aysén. Hecho en Puerto Cisnes, Patagonia chilena.",
  email: CONTACT_EMAIL,
  telephone: "+56940068228",
  priceRange: "$150.000 - $500.000 CLP",
  areaServed: [
    { "@type": "AdministrativeArea", name: "Región de Aysén" },
    ...AYSEN_COMUNAS.map((name) => ({ "@type": "City", name })),
  ],
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
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Servicios de TallerZur",
    itemListElement: projects.map((project) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: project.eyebrow,
        description: project.text,
        areaServed: "Región de Aysén, Chile",
        provider: { "@type": "ProfessionalService", name: "TallerZur" },
      },
    })),
  },
};

/**
 * Preguntas reales, con respuestas honestas — no relleno para SEO. El
 * markup FAQPage solo es válido (y solo vale la pena) si corresponde a
 * contenido que la página también muestra; por eso vive junto al bloque
 * visible en "Llegar", no suelto en el `<head>`.
 */
const faq = [
  {
    q: "¿Cuánto cuesta una página web para mi hostal, restaurante o peluquería en Aysén?",
    a: "Una landing page profesional parte desde $150.000 CLP, un sitio completo desde $300.000 y una tienda online desde $500.000. Sin letra chica.",
  },
  {
    q: "¿Sirve una página web si ya tengo Instagram o WhatsApp Business?",
    a: "Sí — Instagram y WhatsApp dependen de un algoritmo y no aparecen en Google. Una página web es tuya, aparece en las búsquedas locales y es la base de todo lo demás.",
  },
  {
    q: "¿El sitio funciona bien con la conexión de la Patagonia?",
    a: "Lo construimos liviano a propósito: sabemos que la señal falla y que tu cliente te busca desde el celular con dos barras.",
  },
  {
    q: "¿Trabajan con negocios fuera de Puerto Cisnes?",
    a: "Sí, con toda la Región de Aysén — Coyhaique, Puerto Aysén, Chile Chico, Cochrane y más. La distancia no es un problema.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
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
            scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: .7 },
          });
          hero
            .fromTo(".hero-image", { scale: 1.14, yPercent: -4.5 }, { scale: 1.035, yPercent: 4.5, duration: 1, ease: "none" }, 0)
            .to(".hero-copy", { yPercent: -22, opacity: 0, duration: .38, ease: "power1.in" }, .12)
            .to(".hero-bottom", { opacity: 0, y: -30, duration: .32, ease: "power1.in" }, .18)
            .to(".hero-dark", { opacity: .92, duration: .58, ease: "none" }, .36)
            .to(".hero-media", { clipPath: "inset(0 2.2% 4% 2.2% round 0 0 2.4rem 2.4rem)", duration: .42, ease: "power2.inOut" }, .58);

          gsap.fromTo(".manifesto-copy p", { opacity: .12, y: 75 }, {
            opacity: 1, y: 0, stagger: .1, ease: "power3.out",
            scrollTrigger: { trigger: ".manifesto-copy", start: "top 82%", end: "bottom 55%", scrub: .6 },
          });

          gsap.utils.toArray<HTMLElement>(".manifesto-photo").forEach((photo, index) => {
            gsap.fromTo(photo, {
              yPercent: index % 2 ? -12 : 12,
              rotate: index === 1 ? 4 : -3,
            }, {
              yPercent: index % 2 ? 12 : -12,
              rotate: index === 1 ? -1 : 1,
              ease: "none",
              scrollTrigger: { trigger: ".manifesto", start: "top bottom", end: "bottom top", scrub: .8 + index * .1 },
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
              scrollTrigger: { trigger: panel, start: "top bottom", end: "top top", scrub: .9 },
            });
            gsap.fromTo(image, { scale: 1.16, yPercent: -5 }, {
              scale: 1.02, yPercent: 5, ease: "none",
              scrollTrigger: { trigger: panel, start: "top bottom", end: "bottom top", scrub: .8 },
            });
            gsap.fromTo(copy, { y: 48, opacity: .2 }, {
              y: 0, opacity: 1, ease: "power3.out",
              scrollTrigger: { trigger: panel, start: "top 76%", end: "top 22%", scrub: .7 },
            });
            if (index < panels.length - 1) {
              // Sin `blur`: animarlo con scrub en tres paneles a pantalla
              // completa es de los efectos más caros que existen y no se
              // compone barato en GPU. El oscurecido solo ya da la profundidad.
              gsap.fromTo(panel.querySelector(".project-inner"), {
                scale: 1, y: 0, opacity: 1, filter: "brightness(1) saturate(1)",
              }, {
                scale: .972, y: -10, opacity: .92, filter: "brightness(.78) saturate(.86)", ease: "none",
                scrollTrigger: { trigger: panels[index + 1], start: "top bottom", end: "top top", scrub: .9 },
              });
            }
          });

          // El clip-path circular de `.company` era puro efecto sin lectura
          // territorial (REVISION §5.2): se reemplaza por una entrada de luz
          // más simple y barata de componer.
          const company = gsap.timeline({
            scrollTrigger: { trigger: ".company", start: "top bottom", end: "bottom bottom", scrub: .8 },
          });
          company
            .fromTo(".company-bg", { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, ease: "none" }, 0)
            .fromTo(".company-bg img", { scale: 1.16, yPercent: -6 }, { scale: 1.02, yPercent: 4, ease: "none" }, 0)
            .fromTo(".company-emblem", { opacity: 0, scale: .8, rotate: -6 }, { opacity: 1, scale: 1, rotate: 0, ease: "power2.out" }, .12)
            .fromTo(".company-text > *", { opacity: 0, y: 28 }, { opacity: 1, y: 0, stagger: .05, ease: "power2.out" }, .18)
            .fromTo(".company-coordinate", { opacity: 0 }, { opacity: 1, ease: "none" }, .3)
            .to(".company-bg-shade", { opacity: .58, ease: "none" }, .38);

          gsap.utils.toArray<HTMLElement>(".gallery-shot").forEach((shot, index) => {
            gsap.fromTo(shot.querySelector("img"), { yPercent: -9, scale: 1.1 }, {
              yPercent: 9, scale: 1.01, ease: "none",
              scrollTrigger: { trigger: shot, start: "top bottom", end: "bottom top", scrub: .7 + index * .1 },
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
      <link rel="preconnect" href={PORTFOLIO_IMAGE_ORIGIN} crossOrigin="" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
        <a className="brand" href="#top" aria-label="TallerZur, volver al inicio"><span>TALLER</span><span>ZUR</span></a>
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

        <section id="territorio" className="projects" aria-label="Líneas de trabajo de TallerZur">
          <div className="projects-heading"><p className="section-label">territorio</p><h2>Tres maneras<br />de sostener un sitio.</h2><p>El código no es un adorno.<br />Es lo que sostiene el negocio.</p></div>
          <div className="projects-stack">
            {projects.map((project) => (
              <article className={`project-panel project-${project.tone}`} key={project.number}>
                <div className="project-inner">
                  <div className="project-media"><img src={project.image.src} alt={project.image.alt} loading="lazy" /><div className="project-veil" /><span className="image-index">{project.number} / 03</span></div>
                  <div className="project-copy">
                    <div className="project-heading"><span>{project.number}</span><p>{project.eyebrow}</p></div>
                    <h3>{project.title}</h3><p className="project-text">{project.text}</p>
                    <a className="text-link" href="#llegar">Cotizar este servicio<i aria-hidden="true">↗</i></a>
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
                <span className="company-kicker">( un estudio nacido del paisaje )</span>
                <h2 className="company-title" id="company-title">Quiénes somos</h2>
                <p>Somos TallerZur: desarrollo web hecho en Puerto Cisnes para negocios de la Región de Aysén. Sabemos que la señal falla y que tu cliente busca &ldquo;hostal en Coyhaique&rdquo; desde el celular con dos barras. Por eso construimos distinto.</p>
                <p>La lluvia que ves en esta página es la de ahora mismo, afuera de donde escribimos el código. Si aquí llueve, en el sitio llueve.</p>
              </div>
            </div>
            <p className="company-coordinate"><span>{COORDS.label.lat}</span><i /><span>{COORDS.label.lon}</span></p>
          </div>
        </section>

        <section id="bosque" className="forest-gallery" aria-label="Proyectos en producción de TallerZur">
          <div className="gallery-intro"><p className="section-label">proyectos</p><h2>Esto no<br />es un mockup.</h2></div>
          <div className="gallery-grid">
            {PORTFOLIO.map((project, index) => {
              const shotClass = index === 0 ? "gallery-shot-wide" : index === 1 ? "gallery-shot-tall" : "gallery-shot-small";
              return (
                <a
                  key={project.url}
                  className={`gallery-shot ${shotClass}`}
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img src={portfolioShot(project.url)} alt={`Captura de ${project.name}`} loading="lazy" />
                  <span className="gallery-caption">{project.name} · {project.desc}</span>
                </a>
              );
            })}
          </div>
        </section>

        <section id="llegar" className="arrival">
          <div className="arrival-top"><p className="section-label">hablemos</p><span>Puerto Cisnes, Aysén · Chile</span></div>
          <h2>Construyamos<br />desde el sur.</h2>
          <div className="arrival-bottom">
            <p>
              Sin tickets eternos.<br />Respondemos casi siempre el mismo día.
              <br /><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
            <a className="circle-link" href={WHATSAPP_URL} target="_blank" rel="noreferrer"><span>Escribir</span><i aria-hidden="true">↗</i></a>
          </div>

          {/* Preguntas reales: el markup FAQPage de arriba solo vale si
              corresponde a contenido visible, no a datos sueltos en el head. */}
          <dl className="faq">
            {faq.map(({ q, a }) => (
              <div className="faq-item" key={q}>
                <dt>{q}</dt>
                <dd>{a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer>
        <div className="footer-mark">TALLERZUR</div>
        <div className="photo-credits">
          Fotografías libres:{" "}
          <a href={media.queulatEncantado.credit!.href} target="_blank" rel="noreferrer">{media.queulatEncantado.credit!.name}</a>{" "}
          y{" "}
          <a href={media.queulatNuboso.credit!.href} target="_blank" rel="noreferrer">{media.queulatNuboso.credit!.name}</a>{" "}
          · CC BY-SA 4.0.
        </div>
        <div className="footer-row"><span>© 2026 TallerZur · Puerto Cisnes, Aysén</span><a href="#top">volver arriba ↑</a></div>
      </footer>
    </>
  );
}
