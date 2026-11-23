import { whatsappUrl } from "@/lib/contact";
import { COORDS } from "@/lib/seo";

/**
 * 404 con la voz del sitio. Sin lluvia (no se monta WeatherLayer): es una
 * página de paso, tiene que cargar al instante y llevarte de vuelta.
 * Las URLs del blog viejo nunca llegan aquí: el worker las redirige (301).
 * vinext responde con estado 404 y agrega <meta name="robots" content="noindex">
 * por su cuenta (no toma `metadata` de este archivo).
 */

export default function NotFound() {
  return (
    <main className="lost">
      <a className="brand" href="/" aria-label="TallerZur, volver al inicio"><span>TALLER</span><span>ZUR</span></a>
      <div className="lost-body">
        <p className="section-label">404 · Puerto Cisnes</p>
        <h1>Este sendero<br /><em>no lleva a ninguna parte.</em></h1>
        <p className="lost-text">
          La página que buscas no existe o cambió de lugar. Puede que el enlace esté mal escrito; lo que buscabas
          seguramente está en el inicio.
        </p>
        <div className="lost-actions">
          <a className="btn btn-light" href="/">Volver al inicio<i aria-hidden="true">↗</i></a>
          <a className="btn btn-ghost" href={whatsappUrl("Hola TallerZur, llegué a una página que no existe en su sitio.")} target="_blank" rel="noopener">
            Escríbenos por WhatsApp
          </a>
        </div>
      </div>
      <p className="lost-coords">{COORDS.label.lat} · {COORDS.label.lon}</p>
    </main>
  );
}
