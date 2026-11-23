import assert from "node:assert/strict";
import test from "node:test";
import { parseLiveWeather } from "../lib/live-weather.ts";
import { describeWeather, isWet } from "../lib/weather-states.ts";

/** Tarjeta "En vivo · Puerto Cisnes": parseo de Open-Meteo y textos en español. */

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
  assert.equal(parseLiveWeather({ current: { weather_code: 3 } }), null, "sin temperatura no hay tarjeta");
});

test("códigos WMO en español de Chile", () => {
  assert.equal(describeWeather(0), "Despejado");
  assert.equal(describeWeather(3), "Nublado");
  assert.equal(describeWeather(45), "Niebla");
  assert.equal(describeWeather(61), "Lluvia ligera");
  assert.equal(describeWeather(65), "Lluvia intensa");
  assert.equal(describeWeather(80), "Chubascos");
  assert.equal(describeWeather(95), "Tormenta");
  assert.equal(describeWeather(1234), "Tiempo variable", "un código desconocido no muestra un número");
});

test("isWet: solo cuando cae agua o nieve", () => {
  for (const code of [51, 61, 63, 65, 80, 82, 71, 95]) assert.equal(isWet(code), true, `código ${code}`);
  for (const code of [0, 1, 2, 3, 45, 48]) assert.equal(isWet(code), false, `código ${code}`);
});
