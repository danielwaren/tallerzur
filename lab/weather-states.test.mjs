import assert from "node:assert/strict";
import test from "node:test";
import {
  CHAPTERS, blendStates, resolveWeather, chapterIndexFromScroll,
  liveWeatherFactor, applyLiveFactor, NEUTRAL_LIVE_FACTOR,
} from "../lib/weather-states.ts";

test("hay seis capítulos en orden vertical", () => {
  assert.equal(CHAPTERS.length, 6);
  assert.deepEqual(
    CHAPTERS.map((c) => c.id),
    ["inicio", "esencia", "territorio", "nosotros", "bosque", "llegar"],
  );
});

test("la narrativa del agua es coherente de arriba abajo", () => {
  const by = Object.fromEntries(CHAPTERS.map((c) => [c.id, c.state]));
  // Cae con fuerza en el hero y no queda nada al final.
  assert.equal(by.inicio.rain, 1);
  assert.equal(by.llegar.rain, 0);
  assert.ok(by.inicio.rain > by.esencia.rain, "la lluvia amaina tras el hero");
  // La niebla sube en el bosque, no en la llegada despejada.
  assert.ok(by.esencia.mist > by.llegar.mist);
  // Cada efecto especial vive en su capítulo y casi solo ahí.
  assert.ok(by.territorio.ripples > 0.6, "el canal en calma");
  assert.ok(by.nosotros.condensation > 0.6, "condensación en el refugio");
  assert.ok(by.bosque.drip > 0.6, "goteo bajo el dosel");
  assert.equal(by.inicio.ripples, 0);
  assert.equal(by.inicio.condensation, 0);
});

test("resolveWeather recorta en los extremos", () => {
  assert.deepEqual(resolveWeather(-3), CHAPTERS[0].state);
  assert.deepEqual(resolveWeather(0), CHAPTERS[0].state);
  assert.deepEqual(resolveWeather(5), CHAPTERS[5].state);
  assert.deepEqual(resolveWeather(99), CHAPTERS[5].state);
});

test("resolveWeather mezcla entre vecinos", () => {
  const mid = resolveWeather(0.5);
  assert.ok(mid.rain > CHAPTERS[1].state.rain && mid.rain < CHAPTERS[0].state.rain,
    "a mitad de camino la lluvia está entre ambos capítulos");
  // 0.25 debe estar más cerca del capítulo 0 que 0.75.
  assert.ok(resolveWeather(0.25).rain > resolveWeather(0.75).rain);
});

test("la transición es continua: sin saltos en las fronteras", () => {
  let prev = resolveWeather(0);
  for (let i = 0.02; i <= 5; i += 0.02) {
    const now = resolveWeather(i);
    for (const key of Object.keys(now)) {
      const jump = Math.abs(now[key] - prev[key]);
      assert.ok(jump < 0.06, `salto brusco en ${key} cerca de índice ${i.toFixed(2)}: ${jump.toFixed(3)}`);
    }
    prev = now;
  }
});

test("blendStates es simétrico en los extremos", () => {
  const a = CHAPTERS[0].state, b = CHAPTERS[3].state;
  assert.deepEqual(blendStates(a, b, 0), a);
  assert.deepEqual(blendStates(a, b, 1), b);
  assert.deepEqual(blendStates(a, b, -1), a, "t<0 se recorta");
  assert.deepEqual(blendStates(a, b, 2), b, "t>1 se recorta");
});

test("chapterIndexFromScroll mapea el viewport a un índice", () => {
  const centers = [500, 1500, 2500, 3500, 4500, 5500];
  assert.equal(chapterIndexFromScroll(0, centers), 0, "antes del primero");
  assert.equal(chapterIndexFromScroll(500, centers), 0);
  assert.equal(chapterIndexFromScroll(9999, centers), 5, "después del último");
  assert.equal(chapterIndexFromScroll(1000, centers), 0.5, "justo en medio de 0 y 1");
  assert.equal(chapterIndexFromScroll(2000, centers), 1.5);
});

test("chapterIndexFromScroll no se rompe con casos límite", () => {
  assert.equal(chapterIndexFromScroll(100, []), 0, "sin secciones");
  // centros pegados (secciones de altura cero) no dividen por cero
  const r = chapterIndexFromScroll(500, [500, 500, 1500]);
  assert.ok(Number.isFinite(r));
});

test("el factor neutro no cambia nada", () => {
  const state = CHAPTERS[0].state;
  assert.deepEqual(applyLiveFactor(state, NEUTRAL_LIVE_FACTOR), state);
});

test("liveWeatherFactor: lluvia real sube la lluvia, cielo despejado la apaga", () => {
  const clear = liveWeatherFactor(0);
  const rain = liveWeatherFactor(61);
  const storm = liveWeatherFactor(95);
  assert.ok(clear.rain < 1, "cielo despejado atenúa la lluvia guionizada");
  assert.ok(rain.rain > 1, "lluvia real la intensifica");
  assert.ok(storm.rain > rain.rain, "una tormenta pesa más que lluvia simple");
});

test("applyLiveFactor nunca saca rain o mist de su rango 0..1", () => {
  const saturated = { ...CHAPTERS[0].state, rain: 0.9, mist: 0.9 };
  const out = applyLiveFactor(saturated, liveWeatherFactor(95));
  assert.ok(out.rain <= 1 && out.rain >= 0);
  assert.ok(out.mist <= 1 && out.mist >= 0);
});

test("applyLiveFactor no toca la narrativa por capítulo, solo la escala", () => {
  // El canal sigue en calma en "territorio" aunque el factor suba: `ripples`
  // no es uno de los campos que el clima real modula.
  const territorio = CHAPTERS.find((c) => c.id === "territorio").state;
  const out = applyLiveFactor(territorio, liveWeatherFactor(65));
  assert.equal(out.ripples, territorio.ripples);
  assert.equal(out.condensation, territorio.condensation);
  assert.equal(out.drip, territorio.drip);
});
