/**
 * Campo de viento con memoria.
 *
 * Una rejilla gruesa de momento (vx, vy) que el puntero perturba y que luego
 * decae y difunde por su cuenta. Es la diferencia entre "las gotas se apartan
 * mientras pasa el mouse" (v7, sin memoria) y "el cursor deja una huella que
 * sobrevive dos segundos y se deshilacha", que es lo que pide el brief.
 *
 * Sin dependencias del DOM a propósito: se testea en Node y se reusa tal cual
 * dentro del componente React.
 */

export const CELL = 56;

export function createField(width, height, cell = CELL) {
  const cols = Math.ceil(width / cell) + 1;
  const rows = Math.ceil(height / cell) + 1;
  const size = cols * rows;
  return {
    cols, rows, cell,
    fx: new Float32Array(size), fy: new Float32Array(size),
    tx: new Float32Array(size), ty: new Float32Array(size),
  };
}

/** Inyecta momento con caída gaussiana alrededor de (px, py). */
export function splat(field, px, py, vx, vy, radius, gain) {
  const { cols, rows, cell, fx, fy } = field;
  const c0 = Math.max(0, Math.floor((px - radius) / cell));
  const c1 = Math.min(cols - 1, Math.ceil((px + radius) / cell));
  const r0 = Math.max(0, Math.floor((py - radius) / cell));
  const r1 = Math.min(rows - 1, Math.ceil((py + radius) / cell));
  const r2 = radius * radius;
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const dx = c * cell - px, dy = r * cell - py;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const falloff = Math.exp(-d2 / (r2 * 0.32));
      const i = r * cols + c;
      fx[i] += vx * falloff * gain;
      fy[i] += vy * falloff * gain;
    }
  }
}

/**
 * Estela de un cuerpo que se mueve por el aire: empuje frontal más un par de
 * vórtices contrarrotantes a los lados. Es lo que hace que la huella se
 * enrolle en vez de ser un simple empujón radial.
 */
export function splatWake(field, px, py, vx, vy, dt) {
  const speed = Math.hypot(vx, vy);
  if (speed < 12) return false;
  const nx = vx / speed, ny = vy / speed;
  const push = Math.min(900, speed) * 0.42;
  splat(field, px, py, nx * push, ny * push, 120, dt * 6);
  const off = 52, curl = push * 0.55;
  splat(field, px - ny * off, py + nx * off, ny * curl, -nx * curl, 78, dt * 5);
  splat(field, px + ny * off, py - nx * off, -ny * curl, nx * curl, 78, dt * 5);
  return true;
}

/** Decaimiento exponencial (tau ≈ 1.15 s de memoria) + difusión. */
export function stepField(field, dt, tau = 1.15) {
  const { cols, rows, fx, fy, tx, ty } = field;
  const decay = Math.exp(-dt / tau);
  const k = Math.min(0.22, dt * 9);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const l = c > 0 ? i - 1 : i, rr = c < cols - 1 ? i + 1 : i;
      const u = r > 0 ? i - cols : i, d = r < rows - 1 ? i + cols : i;
      tx[i] = (fx[i] + k * (fx[l] + fx[rr] + fx[u] + fx[d] - 4 * fx[i])) * decay;
      ty[i] = (fy[i] + k * (fy[l] + fy[rr] + fy[u] + fy[d] - 4 * fy[i])) * decay;
    }
  }
  fx.set(tx); fy.set(ty);
}

/** Muestreo bilineal en píxeles. Escribe en `out` para no asignar por gota. */
export function sampleField(field, px, py, out) {
  const { cols, rows, cell, fx, fy } = field;
  const gx = Math.min(cols - 1.001, Math.max(0, px / cell));
  const gy = Math.min(rows - 1.001, Math.max(0, py / cell));
  const c = gx | 0, r = gy | 0, sx = gx - c, sy = gy - r;
  const i00 = r * cols + c, i10 = i00 + 1, i01 = i00 + cols, i11 = i01 + 1;
  const w00 = (1 - sx) * (1 - sy), w10 = sx * (1 - sy), w01 = (1 - sx) * sy, w11 = sx * sy;
  out.x = fx[i00] * w00 + fx[i10] * w10 + fx[i01] * w01 + fx[i11] * w11;
  out.y = fy[i00] * w00 + fy[i10] * w10 + fy[i01] * w01 + fy[i11] * w11;
  return out;
}

/** Energía total del campo. Útil para tests y para dormir el bucle. */
export function fieldEnergy(field) {
  const { fx, fy } = field;
  let sum = 0;
  for (let i = 0; i < fx.length; i++) sum += Math.abs(fx[i]) + Math.abs(fy[i]);
  return sum;
}

/** Viento global: dos armónicos lentos + racha. No sopla, respira. */
export function globalWind(t) {
  return -34 + Math.sin(t * 0.11) * 46 + Math.sin(t * 0.037) * 78 + Math.sin(t * 0.29 + 1.7) * 22;
}
