import assert from "node:assert/strict";
import test from "node:test";
import { createField, splat, splatWake, stepField, sampleField, fieldEnergy, globalWind } from "./wind-field.mjs";

const out = { x: 0, y: 0 };
const step60 = 1 / 60;

test("la huella persiste después de que el cursor se va", () => {
  const field = createField(1440, 900);
  splatWake(field, 700, 450, 600, 0, step60);
  const justAfter = fieldEnergy(field);
  assert.ok(justAfter > 0, "el puntero debe inyectar momento");

  // 30 frames (~0.5 s) sin ningún input
  for (let i = 0; i < 30; i++) stepField(field, step60);
  const halfSecond = fieldEnergy(field);
  assert.ok(halfSecond > justAfter * 0.4, `a 0.5s debe quedar huella clara, quedó ${(halfSecond / justAfter * 100).toFixed(0)}%`);

  // 3 s en total: ya debe estar prácticamente limpio
  for (let i = 0; i < 150; i++) stepField(field, step60);
  const threeSeconds = fieldEnergy(field);
  assert.ok(threeSeconds < justAfter * 0.1, `a 3s debe estar casi limpio, quedó ${(threeSeconds / justAfter * 100).toFixed(0)}%`);
});

test("la estela se ensancha: la difusión reparte hacia los lados", () => {
  const field = createField(1440, 900);
  splat(field, 700, 450, 500, 0, 120, 1);
  const far = { x: 700 + 200, y: 450 };
  sampleField(field, far.x, far.y, out);
  const before = Math.abs(out.x);
  for (let i = 0; i < 24; i++) stepField(field, step60);
  sampleField(field, far.x, far.y, out);
  assert.ok(Math.abs(out.x) > before, "el momento debe propagarse más allá del radio de inyección");
});

test("los vórtices laterales rotan en sentidos opuestos", () => {
  const field = createField(1440, 900);
  // movimiento horizontal hacia la derecha
  splatWake(field, 700, 450, 800, 0, step60);
  const above = sampleField(field, 700, 450 - 52, { x: 0, y: 0 });
  const below = sampleField(field, 700, 450 + 52, { x: 0, y: 0 });
  assert.ok(above.y * below.y < 0, `los lados deben curvarse en sentidos opuestos (arriba ${above.y.toFixed(2)}, abajo ${below.y.toFixed(2)})`);
});

test("el campo es estable a 30, 60 y 144 Hz (independiente del framerate)", () => {
  const energies = [30, 60, 144].map((hz) => {
    const field = createField(1440, 900);
    splat(field, 700, 450, 500, 0, 120, 1);
    const dt = 1 / hz;
    for (let i = 0; i < hz; i++) stepField(field, dt); // exactamente 1 segundo
    return fieldEnergy(field);
  });
  const [a, b, c] = energies;
  const spread = (Math.max(a, b, c) - Math.min(a, b, c)) / Math.max(a, b, c);
  assert.ok(spread < 0.25, `tras 1s real la energía debe coincidir entre framerates, dispersión ${(spread * 100).toFixed(0)}%`);
});

test("una gota lejana se desvía menos que una cercana (perspectiva coherente)", () => {
  const field = createField(1440, 900);
  splat(field, 700, 450, 600, 0, 140, 1);
  const deflect = (depth) => {
    const respond = 0.3 + depth * 0.95;
    sampleField(field, 700, 450, out);
    return Math.abs(out.x * respond);
  };
  assert.ok(deflect(1) > deflect(0.15) * 2, "la capa cercana debe reaccionar claramente más que la lejana");
});

test("el trazo apunta en la dirección real de la velocidad", () => {
  const EXPOSURE = 0.034, FALL = 1180;
  const field = createField(1440, 900);
  splat(field, 700, 450, 700, 0, 140, 1);
  const drop = { x: 700, y: 450, d: 0.9, scale: 0.42 + 0.9 * 1.05, jitter: 1 };
  sampleField(field, drop.x, drop.y, out);
  const respond = 0.3 + drop.d * 0.95;
  const vx = globalWind(0) * drop.scale + out.x * respond;
  const vy = FALL * drop.scale + out.y * respond * 0.55;
  const tail = { x: drop.x - vx * EXPOSURE, y: drop.y - vy * EXPOSURE };
  const streakAngle = Math.atan2(drop.y - tail.y, drop.x - tail.x);
  const velocityAngle = Math.atan2(vy, vx);
  assert.ok(Math.abs(streakAngle - velocityAngle) < 1e-9, "trazo y velocidad deben ser colineales");
  // y con viento lateral fuerte el trazo NO puede ser vertical
  assert.ok(Math.abs(vx) > 60, "debe haber componente horizontal real");
});

test("el largo del trazo escala con la velocidad (motion blur, no guiones fijos)", () => {
  const EXPOSURE = 0.034, FALL = 1180;
  const len = (depth) => {
    const scale = 0.42 + depth * 1.05;
    return Math.hypot(globalWind(0) * scale, FALL * scale) * EXPOSURE;
  };
  assert.ok(len(1) > len(0.1) * 2.4, "la capa rápida debe dejar un trazo mucho más largo");
});

test("una gota cruza la pantalla en tiempo de lluvia, no de nieve", () => {
  const FALL = 1180, H = 900;
  const near = H / (FALL * (0.42 + 1 * 1.05));   // capa cercana
  const far = H / (FALL * (0.42 + 0.05 * 1.05)); // capa lejana
  assert.ok(near > 0.3 && near < 0.75, `la capa cercana debe cruzar en ~0.5s, cruza en ${near.toFixed(2)}s`);
  assert.ok(far < 2, `la capa lejana no debe flotar, cruza en ${far.toFixed(2)}s`);

  // el motor v7, para contraste: y en unidades normalizadas, speed 0.28..1.20
  const v7Near = 1 / 1.2, v7Far = 1 / 0.28;
  assert.ok(v7Near > near, "v7 es más lento que la propuesta incluso en su capa más rápida");
  assert.ok(v7Far > 3, `v7 tarda ${v7Far.toFixed(1)}s en su capa lenta: eso es ceniza, no lluvia`);
});
