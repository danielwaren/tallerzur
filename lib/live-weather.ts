/**
 * Clima real de Puerto Cisnes (Open-Meteo, sin API key).
 *
 * La usa la capa de lluvia para escalar la narrativa según el clima real.
 * La promesa se reutiliza mientras tenga menos de `maxAgeMs`. Si la red
 * falla, devuelve `null`; nunca lanza.
 */

export const LIVE_WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-44.7427&longitude=-72.6926" +
  "&current=weather_code,temperature_2m,wind_speed_10m,is_day&timezone=auto";

export type LiveWeather = {
  code: number;
  temperature: number;
  /** km/h */
  wind: number;
  /** Hora local de la medición, "HH:MM". */
  time: string;
  isDay: boolean;
};

/** Valida la respuesta de Open-Meteo. Pura: se prueba sin red. */
export function parseLiveWeather(data: unknown): LiveWeather | null {
  const current = (data as { current?: Record<string, unknown> } | null)?.current;
  if (!current) return null;
  const { weather_code: code, temperature_2m: temperature, wind_speed_10m: wind, time, is_day: isDay } = current;
  if (typeof code !== "number" || typeof temperature !== "number") return null;
  const hhmm = typeof time === "string" ? time.match(/T(\d{2}:\d{2})/)?.[1] ?? "" : "";
  return {
    code,
    temperature,
    wind: typeof wind === "number" ? wind : 0,
    time: hhmm,
    isDay: isDay !== 0,
  };
}

let pending: Promise<LiveWeather | null> | null = null;
let requestedAt = 0;

export function getLiveWeather(maxAgeMs = 10 * 60 * 1000): Promise<LiveWeather | null> {
  if (pending && Date.now() - requestedAt < maxAgeMs) return pending;
  requestedAt = Date.now();
  pending = fetch(LIVE_WEATHER_URL, { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : null))
    .then(parseLiveWeather)
    .catch(() => null);
  return pending;
}
