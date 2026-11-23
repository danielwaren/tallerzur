# Informe · Fase 3 — Poda narrativa y fluidez

Se pidió continuar con la Fase 3 (REVISION §5.2) y, además, resolver una
sensación de lentitud/forzosidad en el scroll. Las dos cosas comparten causa
en varios puntos, así que se atacaron juntas.

---

## Resumen

| | |
|---|---|
| Compilación | ✅ `vinext build` completa |
| Tipos | ✅ mismos 3 errores preexistentes de andamiaje D1, ninguno nuevo |
| Tests | ✅ **34/34**, corridos contra el build recién generado |
| Scroll total | **~15 pantallas → ~9,8** (footer aparte) |
| `will-change` permanente | **21 declaraciones → 8**, solo en lo que anima durante todo su recorrido |
| Verificación **visual en movimiento** | ❌ sigue bloqueada — ver §4 |

---

## 1. Poda narrativa (REVISION §5.2)

- **`.interlude` («CISNES» gigante en outline) — eliminado por completo.**
  Sección, JSX, CSS, sus dos ScrollTrigger y sus referencias en el CSS de
  `prefers-reduced-motion` y en el filtro de fotografía sin regrado.
- **Clip-path circular de `.company` — retirado.** Era el recurso más
  repetido de los últimos años y no decía nada del lugar (REVISION §5.2). La
  entrada de la sección «Nosotros» ahora es una aparición simple (opacidad +
  escala) sobre el mismo timeline de GSAP — más barata de componer que un
  `clip-path: circle()` animado a pantalla completa. El fallback
  `.motion-unavailable` se actualizó de `clip-path:none` a `opacity:1`.
- **`.forest-gallery` — retícula real en vez de disposición a ojo.** Los tres
  anchos en `vw` sueltos y el margen negativo en `svh` (`72vw`/`38vw`/`47vw`,
  `margin:-25svh...`) se reemplazaron por un grid real de 12 columnas
  (`.gallery-grid`): la foto ancha ocupa columnas 1→8, la vertical 8→13, y la
  pequeña se solapa en 4→10 con un margen negativo que es una regla del grid,
  no un número inventado por imagen.

## 2. Scroll total: de ~15 pantallas a ~9,8

Medido en el navegador con el sitio corriendo (no solo calculado en CSS):

| Sección | Antes | Ahora |
|---|---|---|
| Hero | 230svh | 165svh |
| Esencia (manifiesto) | 115svh | 100svh |
| Territorio (encabezado + 3 paneles) | ~400svh (100 + 3×100) | ~310svh (55 + 3×85) |
| Nosotros | 245svh | 120svh (130svh en móvil) |
| Bosque lluvioso | 250svh | ~177svh, sin forzar `min-height` |
| Interludio | 125svh | — (eliminado) |
| Llegar | 100svh | 100svh (sin cambios) |

Total narrativo medido: **7.032 px / 720 px de viewport ≈ 9,8 pantallas**
(objetivo de REVISION era 8–9; el footer añade otras ~0,65 pantallas aparte).

## 3. Por qué se sentía forzoso — y qué se cambió

Tres causas concretas, no una impresión:

1. **`html{scroll-behavior:smooth}` compitiendo con el scrub de GSAP
   ScrollTrigger.** Es una combinación que GSAP desaconseja explícitamente: el
   suavizado nativo del navegador reinterpola el scroll con su propia curva
   mientras ScrollTrigger ya lo está haciendo con la suya, y el resultado es
   el tirón que se notaba. **Eliminado.** Los saltos de ancla (menú, «desliza
   para entrar») ahora son instantáneos, que es además lo recomendado cuando
   hay scrubs pesados en la página.
2. **Valores de `scrub` demasiado altos.** Había desde `1.1` hasta `2.35`
   segundos de retardo entre el scroll y la animación — a esa magnitud el
   contenido se siente «remolcado» detrás del cursor en vez de seguirlo.
   Se bajaron todos a un rango **0,6–0,9**, que sigue suavizando sin
   desconectarse del gesto de scroll.
3. **21 `will-change` declarados de forma permanente en la hoja de estilos**
   (debía aplicarse solo mientras se anima, REVISION §10.8). Se redujeron a
   **8**, dejados únicamente en lo que se transforma durante *todo* el
   recorrido de su sección (`.hero-image`, `.project-media`/`img`,
   `.project-inner`, `.company-bg img`, `.gallery-shot img`,
   `.manifesto-photo`, `.loader-line`). El resto — revelados de una sola vez
   (`.hero-copy`, `.company-emblem`, `.manifesto-copy p`, etc.) — no
   necesitaban reservar una capa de composición para toda la vida de la
   página.

## 4. Bonus: cascada de `.company` consolidada (REVISION §10.7)

De paso, al tocar la altura de `.company` había que decidir cuál de las tres
declaraciones en cascada (205→230→245svh en escritorio; 185→210→225svh en
móvil) sobrevivía. Se dejó **una sola por breakpoint** en vez de tres
compitiendo por orden de aparición en el archivo.

## 5. Verificado automáticamente

- `vinext build` limpio.
- `tsc --noEmit`: mismos 3 errores preexistentes del andamiaje D1
  (`db/index.ts`, `worker/index.ts`), ninguno nuevo.
- **34/34 tests**, corridos contra el build reconstruido (no contra el
  artefacto viejo — importante, porque `rendered-html.test.mjs` lee
  `dist/server/index.js`).
- Consola y red sin errores al cargar, con HMR aplicando todos los cambios en
  vivo.
- Estructura confirmada por accesibilidad (`read_page`): el interludio ya no
  existe como región, `.gallery-grid` está presente con las tres fotos en las
  columnas esperadas, los landmarks y el menú siguen intactos.

## 6. Lo que necesita tu ojo — sigue bloqueado, no es un paso nuevo

**Sigue sin poder verse en movimiento.** El panel de esta sesión continúa sin
mostrarse, así que `document.hidden` es `true` y Chrome congela tanto
`requestAnimationFrame` como las transiciones/scrubs de CSS — el mismo
límite que en Fase 0-1 y Fase 2. Los cambios de fluidez están razonados sobre
causas conocidas y documentadas (GSAP desaconseja `scroll-behavior:smooth` +
ScrollTrigger; `scrub` alto es literalmente el retardo en segundos; los
`will-change` permanentes son el propio texto de REVISION §10.8), pero
**la sensación real solo se confirma con el panel visible o probándolo tú
mismo en `http://localhost:4331`.**

Si al probarlo un tramo concreto sigue sintiéndose lento, dime cuál: el
`scrub` de cada tramo es un solo número en `app/page.tsx`.
