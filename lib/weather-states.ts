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
 * la interpolación cruza entre vecinos según el scroll.
 */
export const CHAPTERS: Chapter[] = [
  // Hero — la llegada bajo lluvia densa, viento con rachas.
  { id: "inicio", state: { rain: 1.0, rainSpeed: 1.0, wind: 1.0, mist: 0.28, ripples: 0, condensation: 0, drip: 0 } },
  // Esencia — la lluvia amaina a garúa; la niebla sube entre los árboles.
  { id: "esencia", state: { rain: 0.42, rainSpeed: 0.72, wind: 0.5, mist: 0.85, ripples: 0, condensation: 0, drip: 0.18 } },
  // Territorio — el agua ya cayó: el canal en calma, ondas lentas.
  { id: "territorio", state: { rain: 0.12, rainSpeed: 0.6, wind: 0.24, mist: 0.5, ripples: 0.82, condensation: 0, drip: 0 } },
  // Nosotros — la mesa, el refugio: condensación en el vidrio.
  { id: "nosotros", state: { rain: 0.05, rainSpeed: 0.6, wind: 0.18, mist: 0.32, ripples: 0.12, condensation: 0.9, drip: 0 } },
  // Bosque — bajo el dosel: goteo denso y lento desde las hojas.
  { id: "bosque", state: { rain: 0.32, rainSpeed: 0.54, wind: 0.32, mist: 0.68, ripples: 0, condensation: 0, drip: 0.92 } },
  // Llegar — escampa. Queda el aire limpio.
  { id: "llegar", state: { rain: 0, rainSpeed: 0.6, wind: 0.14, mist: 0.1, ripples: 0.06, condensation: 0, drip: 0 } },
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
