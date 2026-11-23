/**
 * Ejecuta `callback` cuando la página ya cargó y el hilo principal está
 * libre. Para lo decorativo (lluvia, scrubs de GSAP): no compite con el
 * primer pintado ni con la hidratación, que en un celular de gama media
 * es lo que Lighthouse mide como Total Blocking Time.
 *
 * Devuelve una función para cancelar.
 */
export function afterLoadIdle(callback: () => void, timeout = 2500): () => void {
  let cancelled = false;
  let idleId = 0;
  let timerId = 0;

  const run = () => { if (!cancelled) callback(); };
  const schedule = () => {
    if (cancelled) return;
    if (typeof window.requestIdleCallback === "function") idleId = window.requestIdleCallback(run, { timeout });
    else timerId = window.setTimeout(run, 1200);
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener("load", schedule);
    if (idleId && typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
    if (timerId) window.clearTimeout(timerId);
  };
}

/**
 * Ejecuta `callback` una sola vez, en la primera interacción del usuario
 * (scroll, rueda, toque, tecla). Si la página ya cargó desplazada (un ancla,
 * volver atrás), se ejecuta apenas el navegador esté libre.
 */
export function onFirstInteraction(callback: () => void): () => void {
  const events = ["scroll", "wheel", "touchstart", "pointerdown", "keydown"] as const;
  let done = false;
  let cancelIdle: (() => void) | null = null;
  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    callback();
  };
  const cleanup = () => {
    events.forEach((name) => window.removeEventListener(name, run));
    cancelIdle?.();
  };
  events.forEach((name) => window.addEventListener(name, run, { passive: true, once: true }));
  if (window.scrollY > 0) cancelIdle = afterLoadIdle(run);
  return () => { done = true; cleanup(); };
}
