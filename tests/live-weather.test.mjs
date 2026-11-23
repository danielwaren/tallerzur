import assert from "node:assert/strict";
import test from "node:test";
import { parseLiveWeather } from "../lib/live-weather.ts";

/** Clima real para la capa de lluvia: parseo de la respuesta de Open-Meteo. */

test("parsea la respuesta real de Open-Meteo", () => {
  const data = {
    current: { time: "2026-11-23T17:00", weather_code: 80, temperature_2m: 9.6, wind_speed_10m: 10.4, is_day: 1 },
  };
  assert.deepEqual(parseLiveWeather(data), { code: 80, temperature: 9.6, wind: 10.4, time: "17:00", isDay: true });
});

test("respuestas rotas no rompen nada: devuelve null", () => {
  assert.equal(parseLiveWeather(null), null);
  assert.equal(parseLiveWeather({}), null);
  assert.equal(parseLiveWeather({ current: { weather_code: "lluvia" } }), null);
  assert.equal(parseLiveWeather({ current: { weather_code: 3 } }), null, "sin temperatura, se descarta");
});
