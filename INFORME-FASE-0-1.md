# Informe · Fase 0 y Fase 1

Qué debería estar funcionando, qué está verificado y qué necesita tu ojo.

---

## Resumen

| | |
|---|---|
| Compilación | ✅ `vinext build` completa |
| Tipos | ✅ 0 errores en código de aplicación |
| Tests | ✅ **26/26** |
| Consola y red al cargar | ✅ sin errores |
| Verificación **visual** | ❌ **no pude hacerla** — ver §5 |

---

## 1. Fase 0 · Bloqueantes

### B1 · Metadatos ✅
`title`, `description`, `lang="es-CL"`, `metadataBase`, canonical, Open Graph
completo, Twitter card, JSON-LD de `TouristDestination`, `theme-color`.
Se acabaron `"Starter Project"` y `lang="en"`.

> Pendiente menor: la imagen OG apunta al hero en WebP. **X/Twitter no acepta
> WebP.** Hace falta exportar un JPEG de 1200×630 — candidato natural para una
> de tus fotos.

### B2 · Tipografía fuera de macOS ✅ (con desvío)
`Iowan Old Style` era exclusiva de macOS: el resto del mundo recibía Times New
Roman. Ahora **Fraunces** (serif variable de display) e **Inter**.

**Encontré un fallo real durante la verificación.** Con `next/font/google`, el
artefacto compilado emitía:

```css
src: url(C:/Users/danig/OneDrive/Desktop/web/bosques-puerto-cisnes/.vinext/fonts/fraunces-5b3f113c.woff2)
```

Rutas absolutas de mi disco, en el CSS de producción. No habrían resuelto jamás
en un servidor — el sitio habría caído al fallback silenciosamente. Es un fallo
de `vinext` con `next/font` (los `.woff2` sí se emitían bien; solo el CSS
apuntaba mal).

**Solución:** se abandonó `next/font` y las fuentes se autoalojan en
`public/fonts/` con `@font-face` propios en `app/fonts.css`. Verificado sobre
el build: **0 rutas absolutas**, todo resuelve a `/fonts/*.woff2`.

Se podaron además los subconjuntos vietnamita, cirílico y griego: 10 archivos
→ **4**, de 293 KB a **199 KB**.

### B3 · Fuentes fantasma ✅
Geist y Geist Mono se descargaban y no se usaban en ninguna parte. Eliminadas.

### B4 · El usuario sin puntero ✅
`cursor:none` estaba en `body` sin condición: con el JS caído o con
`prefers-reduced-motion`, el visitante se quedaba sin cursor. Ahora solo se
oculta cuando el canvas ya dibuja el suyo (`body.has-custom-cursor`, que añade
el propio componente y solo si hay puntero fino).

### B5 · Imágenes de terceros ⚠️ **parcial**
Intenté autoalojar las tres de Wikimedia. **Wikimedia bloquea la descarga
automatizada** — devuelve una página de error, lo cual confirma de paso el
propio hallazgo. Hecho en su lugar:

- centralizadas en `lib/media.ts`, marcadas `pending: true`
- `<link rel="preconnect">` al origen remoto para amortiguar el coste
- cuando lleguen tus fotos, **se cambia ese archivo y nada más**

### B6 · El titular flotante ✅
`.hero-copy` y `.hero-bottom` pasan de `fixed` a `absolute` dentro de
`.hero-media`. Si GSAP no carga, el titular ya no queda flotando sobre todas
las secciones.

### B7 · Marcador de desarrollo ✅
Eliminado `codex-preview: development`. **El único test del repo exigía que
estuviera presente** — es decir, obligaba a publicarlo. Reescrito: ahora son 8
tests que comprueban lo contrario y el resto de la Fase 0.

### B8 · Menú tabulable con el menú cerrado ✅
`inert` en lugar de `aria-hidden` (que además era una violación de ARIA sobre
contenido enfocable). Añadidos `Escape` para cerrar, trampa de foco mientras
está abierto y devolución del foco al botón al cerrar.

### B9 · Foco invisible ✅
No existía ni una regla `:focus-visible`. Añadidas, con color adaptado a
secciones claras y oscuras.

### Además (parte 2 de la auditoría)

- **§9.2 Landmarks** ✅ `<header>`, `<aside>` y `<footer>` salen de `<main>`.
  Dentro de `main` perdían los roles `banner`/`complementary`/`contentinfo` y
  el sitio tenía un solo landmark.
- **§9.3 `aria-live`** ✅ eliminado del indicador de sección, que cambiaba
  varias veces por scroll y hacía que el lector se interrumpiera a sí mismo.
- **§9.5 `scroll-margin-top`** ✅ las anclas ya no quedan bajo el header fijo.
- **§9.10 `prefers-reduced-motion`** ✅ el `clip-path: circle(8%)` inicial sale
  del CSS (dejaba la foto de «Nosotros» recortada a un círculo diminuto **para
  siempre** si GSAP no corría). Y ahora reducir movimiento **acorta** el sitio:
  hero a 100svh, paneles apilados a rejilla, sin niebla.
- **§9.11 GSAP sin `catch`** ✅ añadido, con clase de respaldo.
- **§9.11 IntersectionObserver** ✅ mantiene el conjunto de secciones visibles
  en vez de ordenar solo las que cambiaron en ese callback.
- **§10.3 Coordenadas** ✅ `45°24′06″ S` era **Puerto Aysén**, ~70 km al sur.
  Corregidas a `44°44′24″ S` en los tres sitios y en el JSON-LD. Un test impide
  que las antiguas vuelvan. **Confírmalas contra fuente oficial.**
- **§10.4 «company» en inglés** ✅ ahora «nosotros».
- **§10.5 Alt contradictorios** ✅ un solo `alt` por archivo, en `lib/media.ts`.
- **§10.6 Territorio** ✅ «Fiordo Puyuhuapi» → «Canal Puyuhuapi»; el texto de la
  Carretera Austral ahora dice que se llega por un desvío de 35 km.
- **Contraste** ✅ `.project-text` de 3,62:1 a **4,64:1**; créditos de 4,49:1 a
  **6,1:1**.
- **Suelo tipográfico** ✅ nada baja de 10,2 px (había ~24 declaraciones por
  debajo de 10 px, una a 7,4 px).
- **`.project-text` en móvil** ✅ deja de estar en `display:none`.
- **`.header.over-light`** ✅ la clase se conmutaba desde ScrollTrigger pero
  nunca estuvo definida: el arreglo no existía.
- **CSS muerto** ✅ 16 reglas eliminadas (`.company-grid`, `.company-mark`,
  `.header-place`, `.company-stage::after`) más ~14 de `.cursor[data-mode]`.
- **Grado de color** ✅ eliminados los seis `filter:` que reinterpretaban tus
  fotos en el navegador. El oscurecido pasa a capas de color. Ver §5.

---

## 2. Fase 1 · El motor de lluvia

Portado a `lib/wind-field.ts` y `components/WeatherLayer.tsx`.

| Antes (v7) | Ahora |
|---|---|
| Trazo siempre vertical mientras la gota derivaba de lado | Trazo **colineal con la velocidad** |
| Largo fijo `6 + depth*32` px | Largo `= \|v\| · exposición` (34 ms) |
| Capa rápida cruzaba en 0,83 s; la lenta en 3,6 s | 0,5 s y 1,6 s |
| Balanceo senoidal por gota (nieve, no lluvia) | Ángulo común, racha coherente |
| Gotas que se teletransportan al llegar abajo | Impacto: micro-elipse que se abre |
| Empujón radial sin memoria, corte duro a 155 px | **Campo de viento con memoria** (τ≈1,15 s) + vórtices contrarrotantes |
| — | Motas de garúa que hacen visible el aire |
| Decaimientos por frame (144 Hz ≠ 60 Hz) | **Todo por delta-time** |
| `getBoundingClientRect()` 60 veces/s | `IntersectionObserver` |
| `elementFromPoint()` en cada `pointermove` | `event.target.closest()` |
| 230 `stroke()` + `quadraticCurveTo` por frame | **3 `stroke()`** por banda de profundidad |
| Anillo interpolado a `.085`, 80 px de retraso | **Punto exacto + anillo con retardo** |
| 8 modos de cursor | 2 estados: neutro y accionable |
| Mezcla normal | Aditiva: dos gotas superpuestas brillan |

Se quitó además el `filter: blur(3px)` animado con scrub en `.project-inner`:
tres paneles a pantalla completa animando desenfoque es de lo más caro que
existe en GPU. El oscurecido solo ya da la profundidad.

---

## 3. Verificado automáticamente

**26 tests, todos pasando.**

- 8 sobre el **HTML compilado de verdad** (`dist/server/index.js`): sin
  marcador de desarrollo, `lang` español, metadatos reales, Open Graph
  completo, JSON-LD con coordenadas dentro del rango de Puerto Cisnes, sin
  rastro de `45°24`, `inert` en el menú, y que «Nosotros» no dependa de GSAP.
- 8 de física del viento: persistencia de la huella, difusión, vórtices
  opuestos, estabilidad a 30/60/144 Hz, perspectiva por profundidad,
  colinealidad trazo-velocidad, escalado del trazo, tiempos de caída.
- 10 de audio del lab.

Más una lista de 16 comprobaciones sobre el HTML servido, todas OK.

```bash
node --test tests/rendered-html.test.mjs lab/wind-field.test.mjs lab/rain-audio.test.mjs
```

Para verlo:

```bash
npx vinext build && npx vinext start
```

---

## 4. Lo que NO se tocó

Fuera del alcance de Fase 0 y 1, sigue pendiente:

- **§9.1 Responsive** — sigue habiendo **un solo breakpoint** (760 px). El
  rango 761–1100 px sigue sin verse. Es la Fase 6 y es el mayor hueco.
- **§10.7 Cascada** — `.company` se sigue declarando seis veces. Eliminé lo
  muerto, no consolidé lo vivo: no puedo comprobar visualmente el resultado.
- **§10.8 `will-change`** — siguen 20 declaraciones permanentes.
- Fase 2 (agua como espina dorsal), Fase 3 (poda narrativa), Fase 5
  (`next/image`, preloader), Fase 7 (robots, sitemap, cabeceras de seguridad).
- Andamiaje D1 sin usar (`db/`, `drizzle/`, `examples/`, `chatgpt-auth.ts`):
  son los **3 únicos errores de tipos** que quedan, todos preexistentes.
- Los scripts siguen exigiendo Linux (`flock` no existe aquí). Compilé con
  `npx vinext build` directamente, saltándome `build-verified.sh`.

---

## 5. Lo que necesita tu ojo — no pude verificarlo

**El panel de navegador de esta sesión está oculto, lo que congela
`requestAnimationFrame` e impide capturas. No he visto el sitio ni una vez.**

Confirmé que compila, que los tipos están limpios, que el HTML servido contiene
lo que debe y que no hay errores de consola ni de red. Nada de eso dice cómo
se ve. Estos cambios son visuales y pueden haber salido mal:

1. **Fraunces en lugar de Iowan Old Style.** Métricas distintas. A
   `clamp(4.6rem, 11.4vw, 11.5rem)` con `line-height: .78` y
   `letter-spacing: -.07em`, un cambio de familia puede provocar colisiones
   entre líneas. **Mira el hero y el menú antes que nada.**
2. **Fotos sin `filter`.** Quité el oscurecido y la desaturación, y compensé
   con capas de color. Ajusté las opacidades a ojo. Si el hero sale demasiado
   claro y el titular pierde legibilidad, es esto — se toca `.hero-shade`.
3. **`prefers-reduced-motion`.** Reescribí la sección entera. Actívalo en el
   sistema y comprueba que el sitio se ve corto y estático, no roto.
4. **La lluvia dentro del sitio real**, con GSAP y el scroll compitiendo. En el
   lab está aislada; aquí no.
5. **Suelo tipográfico.** Subir ~24 tamaños puede haber roto alguna línea que
   dependía de ser diminuta — sospecha del `.header-context`, que además tiene
   `min-width: 25rem`.

Si algo de esto se ve mal, dime cuál y lo corrijo: son ajustes de valores, no
de estructura.
