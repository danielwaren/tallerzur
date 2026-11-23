import type { CSSProperties } from "react";
import WeatherLayer from "@/components/WeatherLayer";
import Picture from "@/components/Picture";
import SiteHeader from "@/components/SiteHeader";
import ContactPanel from "@/components/ContactPanel";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import PageEffects from "@/components/PageEffects";
import LiveWeather from "@/components/LiveWeather";
import { media } from "@/lib/media";
import { SERVICES, MAINTENANCE, TRUST, ABOUT } from "@/lib/services";
import { PROJECTS } from "@/lib/projects";
import { FAQ } from "@/lib/faq";
import { COORDS, professionalServiceJsonLd, faqJsonLd } from "@/lib/seo";
import { CONTACT_EMAIL, whatsappTextFor, whatsappUrl } from "@/lib/contact";

/**
 * Página de servidor. El contenido (servicios, proyectos, preguntas…) llega
 * como HTML y no se hidrata: en un celular de gama media, hidratar la página
 * entera era la tarea larga más pesada de la carga. Solo son islas cliente
 * el header/menú, el panel de contacto, el WhatsApp flotante, la lluvia y
 * los efectos de scroll.
 */
/** Orden del calendario: de julio a junio, la temporada alta queda al centro. */
const SEASON_ORDER = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }} />

      <a className="skip-link" href="#servicios">Saltar al contenido</a>
      <WeatherLayer />
      <SiteHeader />

      <main id="top" className="site">
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
            {SERVICES.map((service, index) => (
              <article
                className={`project-panel project-${service.tone}`}
                key={service.id}
                aria-labelledby={`servicio-${service.id}`}
                style={{ "--i": index } as CSSProperties}
              >
                <div className="project-inner">
                  <div className="project-media">
                    <Picture image={service.image} sizes="(max-width: 760px) 100vw, 62vw" alt="" />
                    <div className="project-veil" />
                    <span className="image-index" aria-hidden="true">{service.number} / 03</span>
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
                    <a className="text-link" href={`/?servicio=${service.id}#contacto`} data-servicio={service.id}>
                      {service.cta}<i aria-hidden="true">↗</i>
                    </a>
                  </div>
                  <div className="project-shade" aria-hidden="true" />
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
          <div className="care-body">
            <div className="care-incident" data-reveal>
              <p className="care-kicker">{MAINTENANCE.incidentTitle}</p>
              <ol className="incident">
                {MAINTENANCE.incident.map((step, index) => (
                  <li key={step.when} style={{ "--step": index } as CSSProperties}>
                    <span className="incident-when">{step.when}</span>
                    <strong>{step.title}</strong>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="care-side">
              {/* Ilustrativo: el "pulso" de un sitio monitoreado. */}
              <div className="monitor" data-reveal aria-hidden="true">
                <p className="monitor-status"><i />{MAINTENANCE.monitor}</p>
                <svg className="monitor-pulse" viewBox="0 0 320 64" preserveAspectRatio="none" focusable="false">
                  <path className="monitor-base" d="M0 32H320" />
                  <path className="monitor-beat" d="M0 32H96L106 32L114 14L124 54L134 6L144 46L152 32H210L216 32L222 22L230 40L236 32H320" />
                </svg>
                <p className="monitor-caption">Si el pulso se corta, la alerta nos llega a nosotros.</p>
              </div>
              <div className="year" data-reveal>
                <p className="care-kicker">{MAINTENANCE.yearTitle}</p>
                {/* Empieza en julio para que la temporada alta (dic–mar) quede seguida. */}
                <ol className="year-months" aria-label="Meses del año. Temporada alta de diciembre a marzo.">
                  {SEASON_ORDER.map((month, position) => {
                    const high = (MAINTENANCE.highSeason as readonly number[]).includes(month);
                    return (
                      <li key={month} className={high ? "is-high" : undefined} style={{ "--m": position } as CSSProperties}>
                        {MAINTENANCE.months[month]}
                      </li>
                    );
                  })}
                </ol>
                <dl className="year-legend">
                  <div className="is-high">
                    <dt>{MAINTENANCE.seasons.high.label}</dt>
                    <dd><strong>{MAINTENANCE.seasons.high.value}</strong> {MAINTENANCE.seasons.high.note}</dd>
                  </div>
                  <div>
                    <dt>{MAINTENANCE.seasons.low.label}</dt>
                    <dd><strong>{MAINTENANCE.seasons.low.value}</strong> {MAINTENANCE.seasons.low.note}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
          <div className="care-actions" data-reveal>
            <a className="btn btn-light" href="/?servicio=mantencion#contacto" data-servicio="mantencion">
              {MAINTENANCE.cta}<i aria-hidden="true">↗</i>
            </a>
            <a className="btn btn-ghost" href={whatsappUrl(whatsappTextFor("mantencion"))} target="_blank" rel="noopener">
              Preguntar por WhatsApp
            </a>
            <p className="care-note">{MAINTENANCE.note}</p>
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
            <p className="company-label"><span>nosotros</span><small>Puerto Cisnes · Aysén</small></p>
            <div className="company-grid">
              <div className="company-text" data-reveal>
                <span className="company-kicker">( no vienes al sur solo para verlo: vienes a recordarlo )</span>
                <h2 className="company-title" id="company-title">
                  Escribimos código a 44° sur, <em>con la lluvia en la ventana.</em>
                </h2>
                <p>{ABOUT.intro}</p>
              </div>
              <LiveWeather />
            </div>
            <ul className="principles">
              {ABOUT.principles.map((item, index) => (
                <li key={item.title} data-reveal style={{ transitionDelay: `${index * 90}ms` }}>
                  <small>{String(index + 1).padStart(2, "0")}</small>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
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
          <ContactPanel />
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

      <FloatingWhatsApp href={whatsappUrl()} />
      <PageEffects />
    </>
  );
}
