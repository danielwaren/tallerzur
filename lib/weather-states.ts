/**
 * El agua como hilo continuo.
 *
 * En lugar de encender la lluvia solo en el hero y apagarla al salir, la capa
 * atmosférica recorre la página entera y cambia de estado por capítulo. Un
 * mecanismo, seis estados, transiciones ligadas al scroll.
 *
 * Puerto Cisnes son ~2.500 mm de lluvia al año: el agua *es* el lugar. La
 * narrativa la sigue de arriba abajo — cae, amaina, se posa, se condensa,
 * gotea, escampa.
 *
 * Este módulo es solo el modelo: tipos, presets e interpolación. Sin DOM, para
 * verificarlo en Node (lab/weather-states.test... vía tests). El componente
 * mide el scroll y pide el estado; aquí se decide cómo se mezcla.
 */

export type WeatherState = {
  /** Densidad de lluvia, 0..1 (fracción de las gotas activas). */
  rain: number;
  /** Multiplicador de velocidad de caída. */
  rainSpeed: number;
  /** Amplitud de la racha de viento. */
  wind: number;
  /** Niebla suspendida, 0..1. */
  mist: number;
  /** Superficie de agua en calma abajo, 0..1. */
  ripples: number;
  /** Condensación en vidrio: gotas que resbalan, 0..1. */
  condensation: number;
  /** Goteo lento y pesado desde el borde superior (dosel), 0..1. */
  drip: number;
};

export type Chapter = { id: string; state: WeatherState };

/**
 * Los seis capítulos. El orden importa: es el orden vertical de la página, y
 * la interpolación cruza entre vecinos según el scroll. La banda de
 * Mantención (entre servicios y proyectos) no es capítulo: hereda la mezcla.
 */
export const CHAPTERS: Chapter[] = [
  // Hero — la llegada bajo lluvia densa, viento con rachas.
  { id: "inicio", state: { rain: 1.0, rainSpeed: 1.0, wind: 1.0, mist: 0.28, ripples: 0, condensation: 0, drip: 0 } },
  // Servicios (territorio) — el agua ya cayó: el canal en calma, ondas lentas.
  { id: "servicios", state: { rain: 0.12, rainSpeed: 0.6, wind: 0.24, mist: 0.5, ripples: 0.82, condensation: 0, drip: 0 } },
  // Proyectos — bajo el dosel: goteo denso y lento desde las hojas.
  { id: "proyectos", state: { rain: 0.32, rainSpeed: 0.54, wind: 0.32, mist: 0.68, ripples: 0, condensation: 0, drip: 0.92 } },
  // Nosotros — la mesa, el refugio: condensación en el vidrio.
  { id: "nosotros", state: { rain: 0.05, rainSpeed: 0.6, wind: 0.18, mist: 0.32, ripples: 0.12, condensation: 0.9, drip: 0 } },
  // Preguntas — garúa leve, casi nada.
  { id: "preguntas", state: { rain: 0.16, rainSpeed: 0.58, wind: 0.2, mist: 0.24, ripples: 0, condensation: 0.1, drip: 0.2 } },
  // Contacto — escampa. Queda el aire limpio, nada encima del formulario.
  { id: "contacto", state: { rain: 0, rainSpeed: 0.6, wind: 0.14, mist: 0.1, ripples: 0.06, condensation: 0, drip: 0 } },
];

const KEYS: (keyof WeatherState)[] = ["rain", "rainSpeed", "wind", "mist", "ripples", "condensation", "drip"];

// Forma (1-t)a + tb, no a+(b-a)t: esta última produce -0 cuando b<a y t=0,
// y deepStrictEqual distingue -0 de 0. Además es exacta en los extremos.
const lerp = (a: number, b: number, t: number) => (1 - t) * a + t * b;

/** Mezcla lineal de dos estados. `t` fuera de [0,1] se recorta. */
export function blendStates(a: WeatherState, b: WeatherState, t: number): WeatherState {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  const out = {} as WeatherState;
  for (const key of KEYS) out[key] = lerp(a[key], b[key], k);
  return out;
}

/**
 * Índice fraccionario de capítulo → estado interpolado.
 *
 * `index` es una posición continua sobre CHAPTERS: 0 = primer capítulo, 2.4 =
 * 40 % del camino entre el tercero y el cuarto. Se recorta a los extremos, así
 * que sobre-scrollear arriba o abajo mantiene el primer/último estado en vez
 * de romperse.
 */
export function resolveWeather(index: number, chapters: Chapter[] = CHAPTERS): WeatherState {
  const last = chapters.length - 1;
  if (index <= 0) return { ...chapters[0].state };
  if (index >= last) return { ...chapters[last].state };
  const lower = Math.floor(index);
  return blendStates(chapters[lower].state, chapters[lower + 1].state, index - lower);
}

/**
 * Convierte los centros de sección (en Y absoluta de documento) y el centro
 * del viewport en un índice fraccionario. Puro para poder testearlo.
 *
 * Antes del primer centro → 0; después del último → N-1; en medio, interpola
 * linealmente entre los dos centros que rodean al viewport.
 */
export function chapterIndexFromScroll(viewportCenterY: number, centers: number[]): number {
  if (centers.length === 0) return 0;
  if (viewportCenterY <= centers[0]) return 0;
  const last = centers.length - 1;
  if (viewportCenterY >= centers[last]) return last;
  for (let i = 0; i < last; i++) {
    if (viewportCenterY < centers[i + 1]) {
      const span = centers[i + 1] - centers[i];
      return span > 0 ? i + (viewportCenterY - centers[i]) / span : i;
    }
  }
  return last;
}

/**
 * El clima real de Puerto Cisnes, multiplicado sobre la narrativa.
 *
 * No sustituye la historia por capítulo — el canal sigue en calma en
 * "servicios" aunque afuera esté lloviendo a cántaros — solo la intensifica o
 * la atenúa. `code` es el código WMO que devuelve Open-Meteo
 * (`weather_code`), la misma API que ya usa tallerzur.cl para su widget de
 * clima. Factor neutro (1,1,1) si no hay dato: el sitio se ve exactamente
 * como sin esto.
 */
export type LiveFactor = { rain: number; mist: number; wind: number };

export const NEUTRAL_LIVE_FACTOR: LiveFactor = { rain: 1, mist: 1, wind: 1 };

export function liveWeatherFactor(code: number): LiveFactor {
  if (code === 0) return { rain: 0.35, mist: 0.4, wind: 0.6 };   // despejado
  if (code <= 2) return { rain: 0.55, mist: 0.55, wind: 0.75 };  // parcial
  if (code === 3) return { rain: 0.75, mist: 0.85, wind: 0.85 }; // nublado
  if (code <= 48) return { rain: 0.7, mist: 1.35, wind: 0.7 };   // niebla real
  if (code <= 67) return { rain: 1.25, mist: 1.1, wind: 1.05 };  // lluvia real
  if (code <= 82) return { rain: 1.4, mist: 1.15, wind: 1.2 };   // chubascos
  if (code <= 86) return { rain: 0.9, mist: 1.2, wind: 1.0 };    // nieve
  return { rain: 1.5, mist: 1.2, wind: 1.5 };                    // tormenta
}

/** Aplica el factor sobre un estado ya resuelto, recortado a su rango 0..1. */
export function applyLiveFactor(state: WeatherState, factor: LiveFactor): WeatherState {
  return {
    ...state,
    rain: Math.min(1, state.rain * factor.rain),
    mist: Math.min(1, state.mist * factor.mist),
    wind: Math.min(1, state.wind * factor.wind),
  };
}
