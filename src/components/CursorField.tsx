import { useEffect, useRef } from 'react';

/**
 * CursorField — campo de partículas tipo constelación que reacciona al cursor.
 * - Desktop: el puntero repele/atrae las partículas y enciende las cercanas.
 * - Touch: sigue el dedo.
 * - Mobile sin touch: el giroscopio mueve un puntero virtual.
 * - Respeta prefers-reduced-motion (render estático, sin loop).
 * pointer-events: none → nunca bloquea clics del hero.
 */
export default function CursorField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    type P = { x: number; y: number; bx: number; by: number; vx: number; vy: number; r: number };
    let parts: P[] = [];

    const pointer = { x: -9999, y: -9999, active: false };
    const RADIUS = 150; // zona de influencia del cursor
    const LINK = 130; // distancia máxima para dibujar líneas

    function build() {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      // densidad adaptativa según área (mobile = menos partículas)
      const target = Math.min(Math.round((w * h) / 14000), 120);
      parts = Array.from({ length: target }, () => {
        const x = Math.random() * w;
        const y = Math.random() * h;
        return {
          x, y, bx: x, by: y,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.6 + 0.7,
        };
      });
    }

    function drawStatic() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(124,252,138,0.35)';
      for (const p of parts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    let raf = 0;
    let running = false;
    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (const p of parts) {
        // deriva + resorte hacia su posición base (no se escapan)
        p.vx += (p.bx - p.x) * 0.002;
        p.vy += (p.by - p.y) * 0.002;

        // fuerza del puntero (repulsión)
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < RADIUS && dist > 0.01) {
            const force = (1 - dist / RADIUS) * 2.4;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;
      }

      // líneas de conexión (constelación)
      for (let i = 0; i < parts.length; i++) {
        const a = parts[i];
        for (let j = i + 1; j < parts.length; j++) {
          const b = parts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK) {
            const o = (1 - d / LINK) * 0.18;
            ctx.strokeStyle = `rgba(124,252,138,${o})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // partículas (las cercanas al cursor brillan)
      for (const p of parts) {
        let glow = 0;
        if (pointer.active) {
          const d = Math.hypot(p.x - pointer.x, p.y - pointer.y);
          if (d < RADIUS) glow = 1 - d / RADIUS;
        }
        const alpha = 0.35 + glow * 0.65;
        ctx.fillStyle = `rgba(124,252,138,${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + glow * 1.6, 0, Math.PI * 2);
        ctx.fill();
        if (glow > 0.4) {
          ctx.fillStyle = `rgba(124,252,138,${glow * 0.15})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, (p.r + 2) * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (running) raf = requestAnimationFrame(frame);
    }

    // ── pointer mapping (relativo al canvas) ──────────────────────────
    const toLocal = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
      pointer.active =
        pointer.x >= -RADIUS && pointer.x <= w + RADIUS &&
        pointer.y >= -RADIUS && pointer.y <= h + RADIUS;
    };

    const onMove = (e: MouseEvent) => toLocal(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) toLocal(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onLeave = () => { pointer.active = false; };
    const onTilt = (e: DeviceOrientationEvent) => {
      // gamma: -90..90 (izq/der) · beta: -180..180 (frente/atrás)
      if (e.gamma == null || e.beta == null) return;
      pointer.x = w / 2 + (e.gamma / 45) * (w / 2);
      pointer.y = h / 2 + ((e.beta - 45) / 45) * (h / 2);
      pointer.active = true;
    };

    // Solo animamos en punteros finos (desktop). En táctil/sin puntero el loop
    // O(n²) no aporta y drena CPU/batería → render estático.
    const fine = window.matchMedia('(pointer: fine)').matches;
    const animated = !reduced && fine;

    const onResize = () => { build(); if (!animated) drawStatic(); };

    build();

    let io: IntersectionObserver | null = null;

    if (!animated) {
      drawStatic();
    } else {
      window.addEventListener('mousemove', onMove, { passive: true });
      window.addEventListener('touchmove', onTouch, { passive: true });
      window.addEventListener('mouseout', onLeave, { passive: true });
      window.addEventListener('deviceorientation', onTilt, { passive: true });

      // Pausar el rAF cuando el hero no está visible (ahorra hilo principal)
      const start = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
      const stop = () => { running = false; cancelAnimationFrame(raf); };
      io = new IntersectionObserver(
        ([e]) => (e.isIntersecting ? start() : stop()),
        { threshold: 0 }
      );
      io.observe(canvas);
    }
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('mouseout', onLeave);
      window.removeEventListener('deviceorientation', onTilt);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
