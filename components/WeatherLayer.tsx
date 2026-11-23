"use client";

import { useEffect, useRef } from "react";
import {
  createField, splatWake, stepField, sampleField, globalWind,
  type Field, type Vec,
} from "@/lib/wind-field";
import {
  CHAPTERS, resolveWeather, chapterIndexFromScroll, applyLiveFactor,
  liveWeatherFactor, NEUTRAL_LIVE_FACTOR, type WeatherState, type LiveFactor,
} from "@/lib/weather-states";

// Mismas coordenadas que usa el widget de clima de tallerzur.cl.
const LIVE_WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-44.7427&longitude=-72.6926&current=weather_code&timezone=auto";
const LIVE_WEATHER_REFRESH_MS = 15 * 60 * 1000;

const FALL = 1180;        // px/s de caída de referencia
const EXPOSURE = 0.034;   // "obturador": largo del trazo = |v| · t

type Drop = { x: number; y: number; d: number; scale: number; jitter: number };
type Mote = { x: number; y: number; d: number; s: number };
type Splash = { x: number; y: number; life: number; d: number };
type Fog = { x: number; y: number; r: number; vx: number; phase: number };
type Bead = { x: number; y: number; r: number; hold: number; sliding: boolean; vy: number };
type Drip = { x: number; y: number; vy: number; len: number };

/**
 * Capa atmosférica única, para toda la página.
 *
 * El agua es el hilo del sitio: cae en el hero, amaina en el bosque, se posa
 * en el canal, se condensa en el refugio, gotea bajo el dosel y escampa al
 * final. En vez de encender la lluvia solo en el hero, un mismo canvas cruza
 * los seis capítulos y su estado se interpola con el scroll (lib/weather-states).
 *
 * Física de la lluvia (frente al motor anterior): trazo colineal con la
 * velocidad y de largo |v|·exposición; ángulo común entre capas; huella del
 * cursor con memoria; todo por delta-time; 3 stroke() por frame.
 *
 * El clima real de Puerto Cisnes (Open-Meteo, sin API key, misma coordenada
 * que usa el widget de tallerzur.cl) escala la narrativa por capítulo cada
 * 15 minutos: si allá está lloviendo, acá llueve más. Si no hay red, se queda
 * en el factor neutro — nunca rompe ni bloquea la animación por scroll.
 */
export default function WeatherLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const finePointer = window.matchMedia("(pointer: fine)").matches;

    let width = 0, height = 0;
    let field: Field = createField(1, 1);
    let drops: Drop[] = [];
    let motes: Mote[] = [];
    let splashes: Splash[] = [];
    let fogs: Fog[] = [];
    let beads: Bead[] = [];
    let drips: Drip[] = [];
    const sampled: Vec = { x: 0, y: 0 };

    // Estado del agua según el capítulo en pantalla. Se interpola hacia el
    // objetivo cada frame para que un scroll brusco no lo haga saltar.
    let weather: WeatherState = { ...CHAPTERS[0].state };
    let target: WeatherState = { ...CHAPTERS[0].state };
    let centers: number[] = [];
    // Clima real de Puerto Cisnes: escala la narrativa, no la reemplaza. Si
    // la API no responde, se queda en neutro y el sitio se ve exactamente
    // igual que sin esto.
    let live: LiveFactor = NEUTRAL_LIVE_FACTOR;

    const measure = () => {
      centers = CHAPTERS.map(({ id }) => {
        const el = document.getElementById(id);
        if (!el) return Number.POSITIVE_INFINITY;
        const rect = el.getBoundingClientRect();
        return rect.top + window.scrollY + rect.height / 2;
      }).filter((n) => Number.isFinite(n));
    };
    const updateTarget = () => {
      const index = chapterIndexFromScroll(window.scrollY + height / 2, centers);
      target = applyLiveFactor(resolveWeather(index), live);
    };

    const pointer = { x: -999, y: -999, px: -999, py: -999, vx: 0, vy: 0, active: false };
    const ring = { x: -999, y: -999 };
    let actionable = false;
    let lastMoveAt = performance.now();

    const newDrop = (scatter: boolean): Drop => {
      const d = Math.pow(Math.random(), 1.55);   // más gotas lejanas que cercanas
      return {
        x: Math.random() * width * 1.35 - width * 0.2,
        y: scatter ? Math.random() * height : -Math.random() * height * 0.3 - 20,
        d,
        scale: 0.42 + d * 1.05,
        jitter: 0.86 + Math.random() * 0.28,
      };
    };
    const newBead = (): Bead => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.9,
      r: 1.5 + Math.random() * 4,
      hold: 1 + Math.random() * 6,
      sliding: false,
      vy: 0,
    });

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      field = createField(width, height);
      drops = Array.from({ length: Math.round(Math.min(340, width / 4.4)) }, () => newDrop(true));
      motes = Array.from({ length: 190 }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        d: 0.25 + Math.random() * 0.75, s: 0.45 + Math.random() * 1.25,
      }));
      fogs = Array.from({ length: 5 }, (_, i) => ({
        x: Math.random() * width, y: height * (0.25 + Math.random() * 0.6),
        r: height * (0.35 + Math.random() * 0.4),
        vx: (0.4 + Math.random() * 0.7) * (i % 2 ? 1 : -1), phase: Math.random() * 6.28,
      }));
      beads = Array.from({ length: 70 }, newBead);
      drips = Array.from({ length: 60 }, () => ({
        x: Math.random() * width, y: -Math.random() * height, vy: 0,
        len: 5 + Math.random() * 9,
      }));
      splashes = [];
      measure();
      updateTarget();
    };

    const move = (event: PointerEvent) => {
      const now = performance.now();
      if (pointer.active) {
        const gap = Math.min(0.1, Math.max(0.008, (now - lastMoveAt) / 1000));
        pointer.vx = (event.clientX - pointer.px) / gap;
        pointer.vy = (event.clientY - pointer.py) / gap;
      } else {
        ring.x = event.clientX; ring.y = event.clientY;
        pointer.active = true;
      }
      lastMoveAt = now;
      pointer.x = pointer.px = event.clientX;
      pointer.y = pointer.py = event.clientY;
      const el = event.target as Element | null;
      actionable = !!el?.closest("a, button, [data-cursor='accion']");
    };
    const leave = () => { pointer.active = false; };

    // ── niebla: manchas suaves que suben y derivan ────────────────────────
    const drawFog = (dt: number, t: number) => {
      if (weather.mist < 0.01) return;
      ctx.globalCompositeOperation = "lighter";
      for (const f of fogs) {
        f.x += f.vx * (0.4 + weather.mist * 0.6) * 60 * dt;
        if (f.x < -f.r) f.x = width + f.r; else if (f.x > width + f.r) f.x = -f.r;
        const drift = Math.sin(t * 0.2 + f.phase) * 14;
        const g = ctx.createRadialGradient(f.x, f.y + drift, 0, f.x, f.y + drift, f.r);
        const a = weather.mist * 0.05;
        g.addColorStop(0, `rgba(210,222,214,${a})`);
        g.addColorStop(1, "rgba(210,222,214,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y + drift, f.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    // ── aire: motas de garúa arrastradas por el campo de viento ───────────
    const drawAir = (windX: number, dt: number) => {
      ctx.globalCompositeOperation = "lighter";
      for (const m of motes) {
        sampleField(field, m.x, m.y, sampled);
        const respond = 0.55 + m.d * 1.05;
        m.x += (windX * 0.16 * m.d + sampled.x * respond) * dt;
        m.y += (7 * m.d + sampled.y * respond) * dt;
        if (m.x < -20) m.x = width + 20; else if (m.x > width + 20) m.x = -20;
        if (m.y < -20) m.y = height + 20; else if (m.y > height + 20) m.y = -20;
        const radius = m.s * (0.7 + m.d * 0.9);
        const carried = Math.hypot(sampled.x, sampled.y) * respond;
        if (carried > 40) {
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x - sampled.x * respond * 0.02, m.y - sampled.y * respond * 0.02);
          ctx.strokeStyle = `rgba(206,236,220,${0.05 + m.d * 0.09})`;
          ctx.lineWidth = radius * 1.5;
          ctx.lineCap = "round";
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(m.x, m.y, radius, 0, 6.2832);
          ctx.fillStyle = `rgba(214,232,220,${0.05 + m.d * 0.07})`;
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const bands = [
      { limit: 0.34, w: 0.55, a: 0.055, path: new Path2D(), n: 0 },
      { limit: 0.72, w: 0.95, a: 0.10, path: new Path2D(), n: 0 },
      { limit: 1.01, w: 1.45, a: 0.17, path: new Path2D(), n: 0 },
    ];

    // ── lluvia: densidad y velocidad las marca el capítulo ────────────────
    const drawRain = (windX: number, dt: number) => {
      const active = Math.round(drops.length * weather.rain);
      if (active > 0) {
        ctx.globalCompositeOperation = "lighter";
        ctx.lineCap = "round";
        for (const band of bands) { band.path = new Path2D(); band.n = 0; }

        for (let i = 0; i < active; i++) {
          const drop = drops[i];
          sampleField(field, drop.x, drop.y, sampled);
          const respond = 0.3 + drop.d * 0.95;
          const vx = (windX * drop.scale + sampled.x * respond) * drop.jitter;
          const vy = FALL * drop.scale * weather.rainSpeed + sampled.y * respond * 0.55;
          drop.x += vx * dt;
          drop.y += vy * dt;

          if (drop.y > height + 40) {
            if (Math.random() < 0.16 + drop.d * 0.3) {
              splashes.push({ x: drop.x, y: height - Math.random() * 6, life: 1, d: drop.d });
            }
            Object.assign(drop, newDrop(false));
            continue;
          }
          if (drop.x < -width * 0.25) drop.x += width * 1.35;
          else if (drop.x > width * 1.15) drop.x -= width * 1.35;

          const band = drop.d < 0.34 ? bands[0] : drop.d < 0.72 ? bands[1] : bands[2];
          band.path.moveTo(drop.x, drop.y);
          band.path.lineTo(drop.x - vx * EXPOSURE, drop.y - vy * EXPOSURE);
          band.n++;
        }
        for (const band of bands) {
          if (!band.n) continue;
          ctx.strokeStyle = `rgba(206,228,214,${band.a})`;
          ctx.lineWidth = band.w;
          ctx.stroke(band.path);
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // Impactos: sobreviven aunque la lluvia baje, así el cambio no es seco.
      if (splashes.length) {
        ctx.globalCompositeOperation = "lighter";
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          s.life -= dt * 3.6;
          if (s.life <= 0) { splashes.splice(i, 1); continue; }
          const grow = (1 - s.life) * (5 + s.d * 11);
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, grow, grow * 0.3, 0, 0, 6.2832);
          ctx.strokeStyle = `rgba(206,228,214,${s.life * 0.13 * (0.4 + s.d)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
        ctx.globalCompositeOperation = "source-over";
      }
    };

    // ── ondas: el canal en calma, líneas horizontales que respiran ────────
    const drawRipples = (t: number) => {
      if (weather.ripples < 0.01) return;
      const base = height * 0.62;
      const bandH = height * 0.34;
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 7; i++) {
        const p = i / 6;
        const y = base + p * bandH;
        const sway = Math.sin(t * 0.5 + i * 0.9) * (6 + p * 10);
        const a = weather.ripples * 0.05 * (1 - p * 0.5);
        ctx.beginPath();
        ctx.moveTo(-20, y + sway);
        ctx.bezierCurveTo(width * 0.33, y - sway, width * 0.66, y + sway * 1.3, width + 20, y - sway);
        ctx.strokeStyle = `rgba(200,220,214,${a})`;
        ctx.lineWidth = 1 + p * 1.5;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    // ── condensación: gotas en el vidrio que resbalan y dejan reguero ─────
    const drawCondensation = (dt: number) => {
      if (weather.condensation < 0.01) return;
      const active = Math.round(beads.length * weather.condensation);
      const alpha = weather.condensation;
      for (let i = 0; i < active; i++) {
        const b = beads[i];
        if (!b.sliding) {
          b.hold -= dt;
          if (b.hold <= 0 && b.r > 3) b.sliding = true;
        } else {
          b.vy += 240 * dt;
          b.y += b.vy * dt;
          // reguero: línea fina que deja al bajar
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x, b.y - b.vy * dt - b.r);
          ctx.strokeStyle = `rgba(214,230,222,${alpha * 0.16})`;
          ctx.lineWidth = b.r * 0.5;
          ctx.lineCap = "round";
          ctx.stroke();
          if (b.y > height + 10) Object.assign(b, newBead());
        }
        // la gota: brillo con realce arriba-izquierda, como vidrio real
        const g = ctx.createRadialGradient(b.x - b.r * 0.3, b.y - b.r * 0.3, 0, b.x, b.y, b.r);
        g.addColorStop(0, `rgba(232,244,238,${alpha * 0.5})`);
        g.addColorStop(0.7, `rgba(200,218,210,${alpha * 0.22})`);
        g.addColorStop(1, `rgba(180,200,192,${alpha * 0.05})`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, 6.2832);
        ctx.fill();
      }
    };

    // ── goteo: gotas pesadas y lentas desde el borde superior (dosel) ─────
    const drawDrip = (windX: number, dt: number) => {
      if (weather.drip < 0.01) return;
      const active = Math.round(drips.length * weather.drip);
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < active; i++) {
        const d = drips[i];
        d.vy += 520 * dt;
        d.y += d.vy * dt;
        d.x += windX * 0.04 * dt;
        if (d.y > height + 20) {
          if (Math.random() < 0.5) splashes.push({ x: d.x, y: height - Math.random() * 5, life: 1, d: 0.9 });
          d.x = Math.random() * width; d.y = -10 - Math.random() * height * 0.5; d.vy = 0;
          d.len = 5 + Math.random() * 9;
        }
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x, d.y - d.len - d.vy * EXPOSURE * 0.5);
        ctx.strokeStyle = `rgba(210,230,220,${weather.drip * 0.22})`;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const drawCursor = (dt: number) => {
      if (!pointer.active) return;
      const speed = Math.hypot(pointer.vx, pointer.vy);
      const push = Math.min(1, speed / 900);

      const haloR = 54 + push * 46;
      const halo = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, haloR);
      halo.addColorStop(0, `rgba(206,232,216,${0.05 + push * 0.07})`);
      halo.addColorStop(0.55, `rgba(196,226,208,${0.018 + push * 0.03})`);
      halo.addColorStop(1, "rgba(196,226,208,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, haloR, 0, 6.2832);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      const k = 1 - Math.pow(0.0006, dt);
      ring.x += (pointer.x - ring.x) * k;
      ring.y += (pointer.y - ring.y) * k;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, (actionable ? 21 : 30) + push * 10, 0, 6.2832);
      ctx.strokeStyle = `rgba(230,242,234,${(actionable ? 0.5 : 0.3) + push * 0.22})`;
      ctx.lineWidth = actionable ? 1.5 : 1.1;
      ctx.stroke();

      // El punto NO interpola: aquí está el mouse de verdad, y por eso se
      // puede volver a hacer clic con precisión.
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 2.6, 0, 6.2832);
      ctx.fillStyle = "rgba(240,248,242,.95)";
      ctx.fill();
    };

    let frame = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.004, (now - last) / 1000));
      last = now;
      const t = now / 1000;

      // El estado real persigue al objetivo: el capítulo cambia de golpe con
      // el scroll, el agua no. ~1.6 s de constante de tiempo.
      const ease = 1 - Math.pow(0.28, dt);
      for (const key of Object.keys(weather) as (keyof WeatherState)[]) {
        weather[key] += (target[key] - weather[key]) * ease;
      }

      const windX = globalWind(t) * (0.35 + weather.wind * 0.65);

      if (pointer.active) {
        splatWake(field, pointer.x, pointer.y, pointer.vx, pointer.vy, dt);
        const decay = Math.pow(0.02, dt);
        pointer.vx *= decay; pointer.vy *= decay;
      }
      stepField(field, dt);

      ctx.clearRect(0, 0, width, height);
      drawFog(dt, t);
      drawRipples(t);
      drawAir(windX, dt);
      drawRain(windX, dt);
      drawDrip(windX, dt);
      drawCondensation(dt);
      drawCursor(dt);
      frame = window.requestAnimationFrame(draw);
    };

    let scrollTick = false;
    const onScroll = () => {
      if (scrollTick) return;
      scrollTick = true;
      window.requestAnimationFrame(() => { updateTarget(); scrollTick = false; });
    };

    let liveTimer = 0;
    const fetchLiveWeather = async () => {
      try {
        const res = await fetch(LIVE_WEATHER_URL, { cache: "no-store" });
        const data = await res.json();
        const code = data?.current?.weather_code;
        if (typeof code === "number") {
          live = liveWeatherFactor(code);
          updateTarget();
        }
      } catch {
        // Sin red, o Open-Meteo caído: se queda en el factor neutro y la
        // narrativa por scroll sigue funcionando igual que siempre.
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    if (finePointer) {
      window.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", leave);
      document.body.classList.add("has-custom-cursor");
    }
    frame = window.requestAnimationFrame(draw);
    void fetchLiveWeather();
    liveTimer = window.setInterval(fetchLiveWeather, LIVE_WEATHER_REFRESH_MS);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(liveTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      if (finePointer) {
        window.removeEventListener("pointermove", move);
        document.documentElement.removeEventListener("pointerleave", leave);
        document.body.classList.remove("has-custom-cursor");
      }
    };
  }, []);

  return <canvas ref={canvasRef} className="weather-canvas" aria-hidden="true" />;
}
