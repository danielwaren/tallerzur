"use client";

import { useEffect, useRef, useState } from "react";
import { getLiveWeather, type LiveWeather as Weather } from "@/lib/live-weather";
import { describeWeather, isWet } from "@/lib/weather-states";

type State = { status: "loading" } | { status: "ok"; data: Weather } | { status: "error" };

/**
 * "En vivo · Puerto Cisnes": el clima real de afuera de donde se escribe el
 * código. Es la prueba concreta de lo que la página dice ("si aquí llueve,
 * en el sitio llueve"). Consulta recién cuando la tarjeta se acerca a la
 * pantalla y comparte la petición con la capa de lluvia. Sin red, lo dice.
 */
export default function LiveWeather() {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let alive = true;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void getLiveWeather().then((data) => {
        if (alive) setState(data ? { status: "ok", data } : { status: "error" });
      });
    }, { rootMargin: "400px 0px" });
    observer.observe(element);
    return () => { alive = false; observer.disconnect(); };
  }, []);

  const data = state.status === "ok" ? state.data : null;
  const wet = data ? isWet(data.code) : false;

  return (
    // El `data-reveal` va en un envoltorio: React reescribe el className de
    // la tarjeta al cambiar de estado y borraría la clase `is-in`.
    <div className="live-wrap" data-reveal>
      <aside ref={ref} className={`live live-${state.status}${wet ? " is-wet" : ""}`} aria-label="Clima ahora en Puerto Cisnes" aria-live="polite">
        <span className="live-rain" aria-hidden="true" />
        <p className="live-label"><i className="live-dot" aria-hidden="true" />En vivo · Puerto Cisnes</p>
        <p className="live-temp">{data ? `${Math.round(data.temperature)}°` : "—°"}</p>
        <p className="live-desc">
          {data ? describeWeather(data.code) : state.status === "error" ? "No pudimos consultar el cielo ahora." : "Mirando por la ventana…"}
        </p>
        {data && (
          <dl className="live-meta">
            <div><dt>Viento</dt><dd>{Math.round(data.wind)} km/h</dd></div>
            {data.time && <div><dt>Hora local</dt><dd>{data.time}</dd></div>}
          </dl>
        )}
        <p className="live-note">
          {wet
            ? "Afuera está lloviendo. Por eso llueve en esta página."
            : "Si aquí llueve, en esta página llueve: es el mismo cielo, consultado ahora."}
        </p>
      </aside>
    </div>
  );
}
