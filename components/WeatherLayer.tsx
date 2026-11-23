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
import { afterLoadIdle } from "@/lib/idle";
import { getLiveWeather } from "@/lib/live-weather";

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

    // `height` es el alto del lienzo (el mayor que ha tenido la ventana: así
    // cubre la pantalla aunque la barra del navegador móvil aparezca o se
    // esconda). `viewH` es el alto visible real, para saber qué capítulo hay
    // en el centro de la pantalla.
    let width = 0, height = 0, viewH = 0;
    // Calidad adaptativa: 1 = todo. Se interpola hacia `qualityTarget`, así
    // que los cambios nunca son de golpe (antes se truncaban los arreglos).
    let quality = 1;
    let qualityTarget = 1;
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
      const index = chapterIndexFromScroll(window.scrollY + viewH / 2, centers);
      target = applyLiveFactor(resolveWeather(index), live);
    };

    const pointer = { x: -999, y: -999, px: -999, py: -999, vx: 0, vy: 0, active: false };
    const ring = { x: -999, y: -999 };
    let actionable = false;
    let lastMoveAt = performance.now();

    /**
     * Sprites: la niebla y las gotas de condensación eran ~75 degradados
     * radiales creados en cada cuadro (y basura para el recolector, que se
     * notaba como tirones). Ahora se pintan una vez y se estampan con
     * drawImage + globalAlpha, que es lo más barato que hay en un canvas 2D.
     */
    const makeSprite = (size: number, paint: (g: CanvasRenderingContext2D, r: number) => void) => {
      const sprite = document.createElement("canvas");
      sprite.width = sprite.height = size;
      const g = sprite.getContext("2d");
      if (g) paint(g, size / 2);
      return sprite;
    };
    const fogSprite = makeSprite(256, (g, r) => {
      const grad = g.createRadialGradient(r, r, 0, r, r, r);
      grad.addColorStop(0, "rgba(210,222,214,1)");
      grad.addColorStop(1, "rgba(210,222,214,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, r * 2, r * 2);
    });
    const beadSprite = makeSprite(64, (g, r) => {
      const grad = g.createRadialGradient(r * 0.7, r * 0.7, 0, r, r, r);
      grad.addColorStop(0, "rgba(232,244,238,.5)");
      grad.addColorStop(0.7, "rgba(200,218,210,.22)");
      grad.addColorStop(1, "rgba(180,200,192,.05)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(r, r, r, 0, 6.2832);
      g.fill();
    });

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

    // Alto "grande" de la pantalla (100lvh): con la barra del navegador
    // escondida. Se mide una vez con un elemento de prueba.
    const largeViewportHeight = () => {
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;top:0;left:0;width:0;height:100lvh;visibility:hidden;pointer-events:none";
      document.body.appendChild(probe);
      const h = probe.getBoundingClientRect().height;
      probe.remove();
      return Math.max(window.innerHeight, h || 0);
    };

    const build = () => {
      // En pantallas táctiles (celulares) la lluvia no necesita retina: con
      // 1,25× se ve igual y se pintan ~2,5 veces menos píxeles por frame.
      const ratio = Math.min(window.devicePixelRatio || 1, finePointer ? 2 : 1.25);
      width = window.innerWidth;
      viewH = window.innerHeight;
      height = Math.round(largeViewportHeight());
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

    /**
     * Antes, cada `resize` reconstruía todo: en el celular la barra del
     * navegador cambia el alto al hacer scroll, y la lluvia se reiniciaba
     * (el "colapso"). Ahora solo se reconstruye si cambia el ancho o el alto
     * más de un 20 %; si no, el lienzo ya cubre el alto grande y solo se
     * actualiza el alto visible.
     */
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const widthChanged = window.innerWidth !== width;
        const bigHeightChange = Math.abs(window.innerHeight - viewH) > viewH * 0.2;
        if (widthChanged || bigHeightChange) build();
        else {
          viewH = window.innerHeight;
          // Si la ventana creció un poco por sobre el lienzo, se agranda solo
          // el lienzo: las gotas siguen donde estaban.
          if (viewH > height) {
            const ratio = canvas.width / width;
            height = viewH;
            canvas.height = Math.round(height * ratio);
            canvas.style.height = `${height}px`;
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            field = createField(width, height);
          }
          measure();
          updateTarget();
        }
      }, 150);
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
      // Con calidad baja la niebla se desvanece (antes se apagaba de golpe).
      const level = Math.min(1, Math.max(0, (quality - 0.45) / 0.3));
      const alpha = weather.mist * 0.05 * level;
      if (alpha < 0.0005) return;
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = alpha;
      for (const f of fogs) {
        f.x += f.vx * (0.4 + weather.mist * 0.6) * 60 * dt;
        if (f.x < -f.r) f.x = width + f.r; else if (f.x > width + f.r) f.x = -f.r;
        const drift = Math.sin(t * 0.2 + f.phase) * 14;
        ctx.drawImage(fogSprite, f.x - f.r, f.y + drift - f.r, f.r * 2, f.r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    // ── aire: motas de garúa arrastradas por el campo de viento ───────────
    const airBuckets = [
      { limit: 0.5, dot: 0.077, line: 0.089, width: 1.4, dots: new Path2D(), lines: new Path2D() },
      { limit: 0.78, dot: 0.095, line: 0.113, width: 1.85, dots: new Path2D(), lines: new Path2D() },
      { limit: 1.01, dot: 0.113, line: 0.137, width: 2.3, dots: new Path2D(), lines: new Path2D() },
    ];
    const drawAir = (windX: number, dt: number) => {
      for (const b of airBuckets) { b.dots = new Path2D(); b.lines = new Path2D(); }
      const count = Math.round(motes.length * (0.4 + quality * 0.6));
      for (let i = 0; i < count; i++) {
        const m = motes[i];
        sampleField(field, m.x, m.y, sampled);
        const respond = 0.55 + m.d * 1.05;
        m.x += (windX * 0.16 * m.d + sampled.x * respond) * dt;
        m.y += (7 * m.d + sampled.y * respond) * dt;
        if (m.x < -20) m.x = width + 20; else if (m.x > width + 20) m.x = -20;
        if (m.y < -20) m.y = height + 20; else if (m.y > height + 20) m.y = -20;
        const bucket = m.d < 0.5 ? airBuckets[0] : m.d < 0.78 ? airBuckets[1] : airBuckets[2];
        const carried = Math.hypot(sampled.x, sampled.y) * respond;
        if (carried > 40) {
          bucket.lines.moveTo(m.x, m.y);
          bucket.lines.lineTo(m.x - sampled.x * respond * 0.02, m.y - sampled.y * respond * 0.02);
        } else {
          const radius = m.s * (0.7 + m.d * 0.9);
          bucket.dots.moveTo(m.x + radius, m.y);
          bucket.dots.arc(m.x, m.y, radius, 0, 6.2832);
        }
      }
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (const b of airBuckets) {
        ctx.fillStyle = `rgba(214,232,220,${b.dot})`;
        ctx.fill(b.dots);
        ctx.strokeStyle = `rgba(206,236,220,${b.line})`;
        ctx.lineWidth = b.width;
        ctx.stroke(b.lines);
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
      const active = Math.round(drops.length * weather.rain * quality);
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
      const active = Math.round(beads.length * weather.condensation * quality);
      const alpha = weather.condensation;
      const trails = new Path2D();
      ctx.globalAlpha = alpha;
      for (let i = 0; i < active; i++) {
        const b = beads[i];
        if (!b.sliding) {
          b.hold -= dt;
          if (b.hold <= 0 && b.r > 3) b.sliding = true;
        } else {
          b.vy += 240 * dt;
          b.y += b.vy * dt;
          // reguero: línea fina que deja al bajar
          trails.moveTo(b.x, b.y);
          trails.lineTo(b.x, b.y - b.vy * dt - b.r);
          if (b.y > height + 10) Object.assign(b, newBead());
        }
        // la gota: brillo con realce arriba-izquierda, como vidrio real
        ctx.drawImage(beadSprite, b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(214,230,222,${alpha * 0.16})`;
      ctx.lineWidth = 1.3;
      ctx.lineCap = "round";
      ctx.stroke(trails);
    };

        // ── goteo: gotas pesadas y lentas desde el borde superior (dosel) ─────
    const drawDrip = (windX: number, dt: number) => {
      if (weather.drip < 0.01) return;
      const active = Math.round(drips.length * weather.drip * quality);
      const path = new Path2D();
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
        path.moveTo(d.x, d.y);
        path.lineTo(d.x, d.y - d.len - d.vy * EXPOSURE * 0.5);
      }
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(210,230,220,${weather.drip * 0.22})`;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.stroke(path);
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
    const bootedAt = performance.now();

    /**
     * Calidad adaptativa, versión tranquila: promedio largo del costo por
     * cuadro, sin medir los primeros 2 s (carga de imágenes y de GSAP) ni los
     * cuadros que vienen de una pestaña oculta. Baja de a 0,2 si el promedio
     * pasa de 11 ms y sube de a 0,1 si queda bajo 4,5 ms, con 3 s de pausa
     * entre ajustes. `quality` persigue al objetivo suavemente.
     */
    let frameCost = 0;
    let measured = 0;
    let lastAdjust = bootedAt;
    const adapt = (now: number, cost: number, rawDt: number, dt: number) => {
      if (rawDt < 0.05 && now - bootedAt > 2000) {
        frameCost = measured ? frameCost * 0.96 + cost * 0.04 : cost;
        measured++;
      }
      if (measured > 120 && now - lastAdjust > 3000) {
        if (frameCost > 11 && qualityTarget > 0.35) {
          qualityTarget = Math.max(0.35, qualityTarget - 0.2);
          lastAdjust = now; measured = 0;
        } else if (frameCost < 4.5 && qualityTarget < 1) {
          qualityTarget = Math.min(1, qualityTarget + 0.1);
          lastAdjust = now; measured = 0;
        }
      }
      quality += (qualityTarget - quality) * (1 - Math.pow(0.35, dt));
    };

    /**
     * El contacto va por encima del lienzo: mientras lo tapa entero, dibujar
     * es trabajo invisible (justo cuando la persona escribe en el formulario).
     * Se pausa el bucle y se reanuda al salir.
     */
    let covered = false;
    let running = false;
    const contact = document.getElementById("contacto");
    // Una lectura de rect por cuadro de scroll (ya limitado con rAF). Un
    // IntersectionObserver no sirve aquí: sus umbrales se miden sobre el alto
    // de la sección, que es más alta que la pantalla.
    const checkCover = () => {
      if (!contact) return;
      const rect = contact.getBoundingClientRect();
      covered = rect.top <= 0.5 && rect.bottom >= window.innerHeight - 0.5;
      if (!covered && !running) resume();
    };
    const resume = () => {
      if (running) return;
      running = true;
      last = performance.now();
      frame = window.requestAnimationFrame(draw);
    };

    const draw = (now: number) => {
      if (covered) {
        ctx.clearRect(0, 0, width, height);
        running = false;
        return;
      }
      const started = performance.now();
      const rawDt = (now - last) / 1000;
      const dt = Math.min(0.05, Math.max(0.004, rawDt));
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

      adapt(now, performance.now() - started, rawDt, dt);
      frame = window.requestAnimationFrame(draw);
    };

    let scrollTick = false;
    const onScroll = () => {
      if (scrollTick) return;
      scrollTick = true;
      window.requestAnimationFrame(() => { updateTarget(); checkCover(); scrollTick = false; });
    };

    let liveTimer = 0;
    // Petición cacheada en lib/live-weather.
    const fetchLiveWeather = async () => {
      const current = await getLiveWeather(LIVE_WEATHER_REFRESH_MS - 60_000);
      // Sin red, o Open-Meteo caído: se queda en el factor neutro y la
      // narrativa por scroll sigue funcionando igual que siempre.
      if (!current) return;
      live = liveWeatherFactor(current.code);
      updateTarget();
    };

    // La lluvia es decorado: arranca cuando la página ya cargó y el hilo
    // principal está libre. Antes empezaba al montar y competía con la
    // hidratación (Lighthouse móvil lo contaba como tiempo de bloqueo).
    let started = false;
    const start = () => {
      started = true;
      build();
      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", onScroll, { passive: true });
      if (finePointer) {
        window.addEventListener("pointermove", move, { passive: true });
        document.documentElement.addEventListener("pointerleave", leave);
        document.body.classList.add("has-custom-cursor");
      }
      resume();
      checkCover();
      void fetchLiveWeather();
      liveTimer = window.setInterval(fetchLiveWeather, LIVE_WEATHER_REFRESH_MS);
    };
    const cancelStart = afterLoadIdle(start);

    return () => {
      cancelStart();
      if (!started) return;
      window.cancelAnimationFrame(frame);
      window.clearInterval(liveTimer);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
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
