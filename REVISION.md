# Revisión de dirección — Bosques de Puerto Cisnes v7

Revisión previa a producción. Orden: primero lo que impide publicar, después
la lluvia (que es el corazón del encargo), después la narrativa.

> **Nota de contexto (posterior a la primera pasada).** El proyecto **no es para
> un cliente**: es una pieza de diseño de autor. Eso invalida parte de lo que
> escribí y queda corregido en §5.3. El resto de la auditoría se mantiene: una
> pieza de autor sigue teniendo que funcionar fuera de macOS, ser legible y no
> romperse con `prefers-reduced-motion`.
>
> Además, el autor **es fotógrafo profesional y tiene material propio de fauna y
> flora de Puerto Cisnes**. Eso convierte §10.1 y §10.2 —los hallazgos más
> incómodos— en la mayor oportunidad del proyecto. El encargo está en
> [BRIEF-FOTOGRAFICO.md](BRIEF-FOTOGRAFICO.md).

---

## 1. Veredicto

El trabajo está bien hecho a nivel de ejecución: el scroll no se traba, las
capas están ordenadas, el detalle de acabado (radios, sombras, blend del
header) demuestra oficio. **Pero no es un sitio, es un muestrario de
transiciones.** Cada sección estrena un recurso famoso distinto —panel sticky,
clip-path circular, palabra gigante en outline, galería flotante— y ninguno
sostiene al siguiente. En 2022 eso ganaba un Awwwards. En 2026 lee como
plantilla: el visitante reconoce los efectos antes que el lugar.

Y hay un problema editorial más serio debajo: **el sitio dice cuatro veces la
misma frase.** «ven despacio», «mira lento», «escucha», «recuérdalo». Cuatro
secciones de tipografía grande para un solo sentimiento, y cero información.
No hay qué hacer, cuándo venir, cuánto cuesta, quién recibe. La única
conversión del sitio entero es un `mailto:`. Para un destino de hospitalidad,
eso es un fallo de negocio disfrazado de proyecto de autor.

La buena noticia: **ya existe la idea propia y está apagada.** Es la lluvia.

No sale a producción todavía. Lo que sigue es lo que hay que arreglar.

---

## 2. Bloqueantes (no se publica así)

| # | Qué | Dónde |
|---|-----|-------|
| B1 | Metadata sigue siendo la del starter: `title: "Starter Project"`, `description: "A clean starting point…"`, y `<html lang="en">` en un sitio íntegramente en español. Sin OG image, sin canonical, sin `metadataBase`. | `app/layout.tsx:15-25,33` |
| B2 | La identidad tipográfica completa depende de `Iowan Old Style`, que **solo existe en macOS**. El resto del mundo recibe Times New Roman. El diseñador está diseñando en un Mac y enviando otro sitio a ~70% de los visitantes. | `app/globals.css:3` |
| B3 | Se descargan las fuentes `Geist` y `Geist_Mono` desde Google y **no se usan en ninguna parte**: el CSS solo referencia `--serif`/`--sans`. Dos familias en el waterfall crítico para nada. | `app/layout.tsx:5-13` |
| B4 | `body{cursor:none}` **no se revierte** en `prefers-reduced-motion`. Esa media query oculta `.cursor` pero deja el cursor del sistema apagado: el usuario se queda literalmente sin puntero. Mismo desenlace si el JS falla. | `app/globals.css:4,47` |
| B5 | Tres imágenes en hotlink directo a `upload.wikimedia.org` a 1920 px. Es un tercero sin `preconnect`, va contra la política de user-agent de Wikimedia para tráfico alto, y es un punto único de falla en dos secciones. | `app/page.tsx:415,442,460,461,462` |
| B6 | `.hero-copy` y `.hero-bottom` son `position:fixed`. Si GSAP no carga (chunk caído, error JS), el titular del hero queda flotando sobre todas las secciones siguientes para siempre. | `app/globals.css:12` |
| B7 | Marcador de desarrollo `codex-preview: development` embebido en el HTML de producción — y el único test del repo **exige que esté presente**. | `app/layout.tsx:19`, `tests/rendered-html.test.mjs` |
| B8 | El menú se oculta con `clip-path`, que no quita el foco: sus 4 enlaces siguen tabulables con el menú cerrado. `aria-hidden` sobre contenido enfocable es además una violación directa de ARIA. Necesita `inert`. | `app/page.tsx:394` |
| B9 | Cero estilos `:focus-visible` en todo el sitio. Con el cursor apagado y sin anillo de foco, la navegación por teclado es invisible. | `app/globals.css` |

---

## 3. La lluvia — el punto principal

Es lo que pediste que fuera lo mejor del sitio, así que aquí voy en detalle.
**Hoy no parece lluvia.** No es cuestión de gusto: hay cinco errores de física
concretos, y cuatro de ellos están en la misma línea de código.

### 3.1 Cae en cámara lenta

`drop.speed = .28 + depth*.92` en unidades normalizadas de alto de pantalla
(`page.tsx:211`). La capa más rápida cruza el viewport en **0,83 s**; la más
lenta tarda **3,6 s**. Una gota real cruza una pantalla en 0,2–0,4 s. A esa
velocidad el ojo no lee lluvia: lee ceniza cayendo, o nieve. Es el primer
motivo por el que el hero no convence.

### 3.2 Las gotas se bambolean, y la lluvia no se bambolea

```js
const sway = Math.sin(time * (.00026 + drop.speed*.00005) + drop.phase)
             * 10 * drop.drift * drop.wobble + gust * drop.depth;
```
Cada gota oscila con su propia fase, amplitud y frecuencia aleatorias. Eso es
comportamiento de nieve, de hoja o de insecto — de un cuerpo con arrastre alto.
La lluvia es balística: cae casi recta, con un ángulo de inclinación **común a
todo el campo**, y lo que cambia con la racha es el ángulo entero, no cada gota
por su lado. Ese balanceo individual es lo que hace que el cerebro diga «esto
es un canvas» aunque el usuario no sepa por qué.

### 3.3 El trazo apunta hacia abajo mientras la gota viaja en diagonal

Este es el peor, y es una línea:

```js
const endY = y + drop.length + pressureY + wakeY;   // page.tsx:277
```

El trazo siempre se dibuja **verticalmente** (`y + length`), pero la gota se
desplaza en horizontal por el `sway`. Resultado: guiones verticales
deslizándose de lado. La orientación del trazo nunca coincide con la dirección
real del movimiento. Un trazo de lluvia *es* desenfoque de movimiento: por
definición apunta en la dirección de la velocidad. Con esto roto, ningún ajuste
de color, densidad u opacidad va a salvar el efecto.

### 3.4 El largo del trazo es fijo

`length = 6 + depth*32` px, constante. Pero el desenfoque de movimiento es
`velocidad × tiempo de exposición`. Si el largo no depende de la velocidad, las
gotas parecen objetos sólidos flotando en vez de luz emborronada. El instinto
de ligar `depth` a velocidad/alfa/grosor estuvo bien; faltó cerrar el círculo.

### 3.5 No hay impacto

`if (drop.y > 1.1) { drop.y = -.1 …}` — la gota se teletransporta. Nada llega a
ninguna parte. Sin impacto la lluvia flota, y el hero pierde el suelo.

### 3.6 Además, tres problemas de ingeniería

- **Toda la interpolación depende del framerate.** `point.life -= .026`,
  `pointerVX *= .92`, `followerX += (…)*.085` — todo por frame, no por tiempo.
  En un monitor de 144 Hz el rastro muere 2,4× más rápido que en uno de 60 Hz.
  El sitio se ve distinto en cada máquina y el QA nunca va a cuadrar.
- **`getBoundingClientRect()` + `querySelector('.hero')` 60 veces por segundo**
  (`page.tsx:255`), forzando layout en cada frame, compitiendo con los scrubs
  de GSAP. Va con `IntersectionObserver`.
- **`document.elementFromPoint()` en cada `pointermove`** (`page.tsx:235`):
  hit-test sincrónico en un evento de alta frecuencia. Es `event.target.closest()`,
  que es gratis.
- 230 `beginPath()`/`stroke()` por frame, cada uno con `quadraticCurveTo` para
  dibujar una curva que es casi recta.

### 3.7 Lo que propongo

Reemplazar el motor, no parchearlo. Está escrito y verificado en
`lab/wind-field.mjs` (8 tests en Node, todos pasando):

- **Velocidad real:** `FALL = 1180 px/s` de referencia. La capa cercana cruza en
  ~0,5 s, la lejana en ~1,6 s. Se lee como agua.
- **Ángulo constante entre capas, magnitud por profundidad.** Así la
  perspectiva se sostiene y la lluvia se lee como *un* cuerpo, no como tres
  capas independientes.
- **Trazo colineal con la velocidad**, y largo `= |v| · exposición` (34 ms de
  obturador). Es desenfoque de movimiento de verdad.
- **Mezcla aditiva** (`globalCompositeOperation = "lighter"`): dos gotas
  superpuestas brillan, como luz atravesando agua. Mucho más creíble que subir
  el alfa.
- **Impacto:** micro-elipse que se abre y muere en ~280 ms.
- **3 `stroke()` por frame** en vez de 340, agrupando por banda de profundidad
  con un `Path2D` por banda.
- **Todo por delta-time**, con `Math.pow(k, dt)` para los decaimientos.

---

## 4. El cursor y la huella — aquí está la idea del sitio

### 4.1 El cursor actual no se puede usar

`followerX += (cursorX - followerX) * .085` con `body{cursor:none}`. Ese
factor tarda ~11 frames en cerrar el 63% de la distancia: durante un movimiento
rápido el anillo va **80 px o más** por detrás del puntero real. Y como el
punto (`.cursor i`) está *dentro* del anillo, la única señal visible de dónde
está el mouse está mal. En la práctica **no se puede hacer clic con precisión**.
Eso no es una elección estética, es un defecto.

Arreglo: dos capas. Un punto de 2 px en la posición **exacta**, sin
interpolación, que devuelve la precisión; y el anillo con retardo, que aporta
la sensación. Es lo estándar en 2025–26 justamente porque resuelve esto.

### 4.2 Ocho modos de cursor son ruido

`lluvia`, `pausa`, `mirar`, `escuchar`, `conocer`, `descubrir`, `llegar`,
`arriba`. Cada etiqueta es una micro-decisión que el usuario tiene que
descifrar, y ninguna cambia lo que pasa al hacer clic. Reducir a dos estados:
neutro y accionable. Como mucho tres.

### 4.3 La huella que pediste no está implementada

Esto es lo importante. Hoy la interacción es:

```js
const influence = distance < 155 ? Math.pow(1 - distance/155, 3) : 0;
```

Un empujón radial **instantáneo y sin memoria**, con corte duro a 155 px. En
cuanto el cursor se aleja, la influencia es exactamente cero y las gotas vuelven
a su sitio como si nada. No hay estela. No hay viento. No hay huella. Lo que
pediste —«el movimiento del cursor entremedio de esta lluvia dejando su huella,
como un leve viento mañanero en la Patagonia»— **requiere memoria**, y aquí no
existe.

**Lo que implementé** (`lab/wind-field.mjs`): un campo de momento sobre una
rejilla gruesa (celdas de 56 px).

1. El puntero **inyecta** su momento en el campo, más **un par de vórtices
   contrarrotantes** a los lados — que es lo que deja de verdad un cuerpo
   moviéndose por el aire. La huella se enrolla en vez de ser un empujón.
2. El campo **decae exponencialmente** (τ ≈ 1,15 s) y **difunde**: la estela se
   ensancha y se deshilacha sola. A los 0,5 s todavía hay huella clara; a los
   3 s está limpio. Eso es exactamente «un leve viento mañanero».
3. Las gotas **muestrean** el campo y responden **según su profundidad**: las
   cercanas se desvían mucho, las lejanas apenas. La perspectiva se mantiene.
4. **Motas de garúa suspendidas** (~130 partículas) advectadas solo por el
   campo. Sin ellas la estela solo se lee donde hay gotas; con ellas, el aire
   existe como material. Es lo que convierte el efecto en atmósfera.

Verificado en `lab/wind-field.test.mjs`:

```
✓ la huella persiste después de que el cursor se va
✓ la estela se ensancha: la difusión reparte hacia los lados
✓ los vórtices laterales rotan en sentidos opuestos
✓ el campo es estable a 30, 60 y 144 Hz
✓ una gota lejana se desvía menos que una cercana
✓ el trazo apunta en la dirección real de la velocidad
✓ el largo del trazo escala con la velocidad
✓ una gota cruza la pantalla en tiempo de lluvia, no de nieve
```

---

## 5. Narrativa visual: una idea, no seis efectos

### 5.1 La propuesta

**El agua es el hilo, y ya tienes la capa que lo lleva.** Hoy el canvas se apaga
en cuanto el hero sale de pantalla (`if (heroVisible)`). Ahí está el sitio que
nadie más tiene: **una sola capa atmosférica que recorre la página entera y
cambia de estado por capítulo.**

| Capítulo | Estado del agua |
|---|---|
| Hero — llegada | Lluvia densa, viento con rachas |
| Esencia — el bosque | La lluvia amaina a garúa; la niebla sube |
| Territorio — el fiordo | El agua ya cayó: quietud, ondas lentas |
| Nosotros — la mesa | Condensación en vidrio; gotas que resbalan |
| Bosque | Goteo desde las hojas, denso y lento |
| Llegar | Escampa. Queda el aire limpio |

Un mecanismo, seis estados, transiciones ligadas al scroll. Es coherente con el
territorio (Puerto Cisnes son ~2.500 mm de lluvia al año: el agua *es* el
lugar), es memorable, y es el 70% del trabajo ya hecho. Convierte el efecto de
adorno del hero en la columna vertebral del sitio.

### 5.2 Lo que corto

- **`.interlude` con «CISNES» gigante en outline.** El tipo gigante en contorno
  con parallax es el recurso más repetido de los últimos cuatro años. Fuera.
- **El clip-path circular de `.company`.** Es de 2021 y no dice nada del lugar.
  El capítulo funciona sin él.
- **Dos de las cuatro secciones de «tipografía grande + foto en parallax».**
  Manifiesto y territorio pueden decirlo una vez. Las otras dos que ganen su
  espacio con contenido real.
- **`.forest-gallery`:** tres fotos a `72vw`/`38vw`/`47vw` con márgenes
  arbitrarios no es una composición, es una disposición. Necesita una regla de
  ritmo o se va.
- **~15 alturas de viewport de scroll total.** Con seis capítulos y una idea, se
  sostiene en 8–9. La mitad del scroll actual es aire.

### 5.3 ~~Lo que falta, y es lo que paga el sitio~~ · RETIRADO

En la primera pasada escribí que la ausencia de precios, disponibilidad y
formulario era «un fallo de negocio disfrazado de proyecto de autor». **Me
equivoqué de premisa: el proyecto es exactamente un proyecto de autor**, sin
cliente ni objetivo comercial. Sin conversión que optimizar, esa crítica no
aplica y la retiro entera.

Lo que sí sobrevive del párrafo original, ya sin el argumento comercial: el
sitio dice cuatro veces la misma frase (§1). Eso sigue siendo un problema
**editorial**, no de negocio — cuatro secciones de tipografía grande para un
solo sentimiento cansan igual aunque no haya nada que vender. La solución
tampoco es meter precios: es que cada capítulo aporte algo que los demás no
tienen. Con material fotográfico propio de fauna y flora, ese «algo» pasa a ser
**el cambio de escala** (§5.1 y el brief): gota, musgo, helecho, arroyo, canal,
montaña. Un argumento visual en vez de cuatro variaciones del mismo suspiro.

---

## 6. Accesibilidad, tipografía y contraste

- **`.project-text` está en `display:none` en móvil** (`globals.css:24`). Todo el
  texto descriptivo de las tres secciones de territorio desaparece en el
  dispositivo mayoritario. Eso no es diseño responsive, es rendirse.
- **Contraste insuficiente:** `.project-text` es `#4e554d` sobre `#aeb4a8` =
  **3,62:1** a 12,8 px. AA exige 4,5:1. `.photo-credits` (`#747a72` sobre
  `#090b08`) da 4,49:1 a 9,3 px en mayúsculas: al límite y en el peor tamaño.
- **≈24 declaraciones de tipografía bajo 10 px.** `.company-coordinate` está a
  7,4 px; `.cursor span` a 7,7 px; `.header-context small` a 8 px. Con
  `letter-spacing` de .18–.22em encima. No es refinamiento, es ilegible.
- **`mix-blend-mode:difference` en el header** sobre una foto en movimiento hace
  el contraste impredecible; en algunos puntos del scroll va a fallar AA. Hay un
  intento de arreglo —ScrollTrigger conmuta la clase `.over-light`— pero
  **`.header.over-light` no está definida en el CSS**: el arreglo no existe.
- **Sin `scroll-margin-top`** en los destinos de ancla, bajo un header fijo.
- `<img>` en todas partes en vez de `next/image`: sin `srcset`, sin
  `width`/`height` (CLS), sin lazy loading. `cisnes-forest.webp` pesa 286 KB y
  se usa tres veces.
- **El preloader falso de 1,55 s** retrasa el LCP por decreto: da igual lo rápido
  que responda el servidor, el LCP nunca bajará de ~1,7 s. El ritual tiene valor
  narrativo aquí, pero tiene que colgar de la carga real de assets y no bloquear
  el primer pintado.
- `html{scroll-behavior:smooth}` peleando con los scrubs de ScrollTrigger es una
  combinación conocida de tirones en los saltos de ancla.
- El menú lista 4 secciones; el header indica 6. La arquitectura de información
  no coincide consigo misma.

---

## 7. Higiene del repositorio

- CSS muerto: `.company-grid` (4 reglas), `.company-mark` (6), `.header-place`
  (4) — ninguna de esas clases existe en el JSX.
- `db/`, `drizzle/`, `drizzle.config.ts`, `examples/d1/`, `app/chatgpt-auth.ts`,
  `worker/` con binding D1: andamiaje del starter que no se usa. `.openai/hosting.json`
  declara `d1: null`, `r2: null`. Fuera, es peso y superficie de ataque.
- `globals.css` importa Tailwind y no se usa ni una sola utilidad.
- El CSS está minificado a mano en 47 líneas de hasta 4.000 caracteres, con
  cuatro bloques que se sobrescriben entre sí (`.company{height:...}` aparece
  tres veces con tres valores distintos). Es imposible de revisar y va a ser
  imposible de mantener. Hay que romperlo en módulos por capítulo.
- Los scripts (`build`, `lint`, `install:ci`) exigen `bash`, `flock` y GNU
  `timeout`: no corren en Windows ni macOS. Si el equipo no es todo Linux, hay
  fricción garantizada.

---

## 8. Qué te dejo montado

```
bosques-puerto-cisnes/
├── REVISION.md              ← este documento
└── lab/
    ├── lluvia.html          ← comparador en vivo
    ├── wind-field.mjs       ← motor de viento con memoria (sin DOM, reusable en React)
    ├── wind-field.test.mjs  ← 8 tests
    ├── rain-audio.mjs       ← lluvia sintetizada con Web Audio (0 KB de assets)
    ├── rain-audio.test.mjs  ← 9 tests
    └── server.mjs           ← servidor estático del lab
```

El lab levanta con:

```bash
node bosques-puerto-cisnes/lab/server.mjs
```

Sobre la foto real del hero. La capa propuesta —aire, campo y cursor— se dibuja
en **los dos motores**, para que cada tecla aísle una sola variable:

| Tecla | Qué cambia |
|---|---|
| `A` | Motor de lluvia: v7 actual ↔ v8 propuesto. Solo la física de las gotas. |
| `W` | Aire: motas de garúa arrastradas por el campo |
| `V` | Vectores del campo dibujados literalmente: la huella se ve |
| `C` | Cursor: v8 preciso ↔ v7 con retardo |
| `↑ ↓` | Intensidad (30–200%): sube densidad **y** velocidad |
| `S` | Sonido de lluvia |
| `[ ]` | Volumen |

Los tests corren con:

```bash
node --test bosques-puerto-cisnes/lab/wind-field.test.mjs bosques-puerto-cisnes/lab/rain-audio.test.mjs
```

(Hay que nombrar los archivos: `node --test lab/` intentaría ejecutar también
`server.mjs` y se quedaría colgado levantando el servidor.)

### Sobre el sonido

Sintetizado, no un mp3. Un archivo de lluvia son 300–800 KB, se le oye el bucle
a los 20 s y no puede reaccionar a nada. Sintetizado pesa 0 KB y **respira con
la misma curva `globalWind(t)` que mueve las gotas**: cuando la racha las
inclina en pantalla, el filtro se abre y la lluvia se acerca. Ese acople es lo
que lo vuelve un solo fenómeno en vez de una pista de fondo.

Tres capas: garúa (ruido rosa en agudos), cuerpo (graves, la lluvia lejana
contra el bosque) y gotas individuales (transitorios cortos con paneo
aleatorio). La tercera es la que importa: sin transitorios el oído lo clasifica
como estática; con ellos, como agua.

El techo de volumen es duro —0,08 de ganancia al 200% de intensidad— y arranca
siempre con fundido de 2,4 s. Solo se activa desde la tecla `S`, que es el
gesto de usuario que exige la política de autoplay: nunca suena solo al cargar.

**Pendiente:** sustituir la síntesis por una grabación real de Puerto Cisnes.
Cuando llegue, la capa que se reemplaza es solo la base (garúa + cuerpo); la
capa de gotas y, sobre todo, **el acople con `globalWind(t)`** conviene
mantenerlos: un filtro pasabajos sobre la grabación, modulado por la misma
curva de viento, le da a un archivo estático la respiración que por sí solo no
tiene. Un `.mjs` de una sola capa desaprovecharía la grabación.

**Nota de honestidad:** verifiqué el motor numéricamente (los 8 tests pasan) y
confirmé que la página carga sin errores de consola ni de red, pero **no pude
verlo en movimiento**: el panel de navegador de esta sesión está oculto, lo que
congela `requestAnimationFrame` e impide capturas. El juicio visual final —si
la lluvia *se siente* como Puerto Cisnes— tiene que hacerlo un ojo humano en el
comparador. Los números garantizan que la física es correcta; no garantizan que
el ajuste fino esté bien.

---

## 9. Auditoría · parte 2

Segunda pasada, sobre lo que no cubría la primera. Todo verificado en el
código, no supuesto.

### 9.1 Un solo breakpoint para todo el sitio

```
3 × @media(max-width:760px)
1 × @media(pointer:coarse)
1 × @media(prefers-reduced-motion:reduce)
```

**No hay nada entre 761 px e infinito.** Un iPad en horizontal (1024), un
MacBook Air (1280), un portátil de 1366 y un monitor de 2560 reciben
exactamente la misma hoja de estilos, con medidas pensadas para pantalla ancha:

- `.projects-heading` es `grid-template-columns: 1fr 2.2fr 1fr` — a 1024 px la
  columna central queda en ~460 px para un `h2` de `clamp(4rem, 7.8vw, 8rem)`.
- `.header-context` tiene `min-width: 25rem` (400 px) dentro de un grid
  `1fr auto 1fr`: a 1024 px se come el 39% del header y aplasta marca y botón.
- `.project-inner` es `minmax(0,1.55fr) minmax(21rem,.72fr)`: el mínimo de
  21 rem en la columna de texto fuerza a la imagen por debajo de su proporción
  justo en el rango de tablet.
- `.manifesto-photo-a` a `19vw × 28vw` y `.gallery-shot-tall` a `38vw × 82svh`
  cambian de proporción con el ancho de ventana, sin control.

Faltan como mínimo dos breakpoints (≈1100 y ≈1440). Es el hueco de QA más
grande que tiene el proyecto: **el rango de 761–1100 px no lo ha visto nadie.**

### 9.2 Landmarks rotos

```jsx
<main ref={siteRef} id="top" className="site">
  <header className="header">…</header>
  <aside id="main-menu">…</aside>
  …
  <footer>…</footer>
</main>
```

`<header>`, `<aside>` y `<footer>` están **dentro de `<main>`**. Cuando son
descendientes de `main`, dejan de exponer los roles `banner`, `complementary` y
`contentinfo`. El resultado es un sitio con un único landmark: un lector de
pantalla no puede saltar a la navegación ni al pie. Los tres tienen que salir
de `<main>`, y `<main>` debe envolver solo el contenido.

### 9.3 `aria-live` en el indicador de sección

```jsx
<div className="header-context" aria-live="polite">
```

Ese bloque cambia cada vez que el `IntersectionObserver` detecta una sección
nueva — es decir, **varias veces por cada scroll**. Con `aria-live` activo, el
lector de pantalla anuncia «01 Inicio», «02 Esencia», «03 Territorio»…
interrumpiéndose a sí mismo mientras el usuario baja. Es exactamente el
antipatrón que `aria-live` documenta como uso incorrecto. Fuera; el indicador
es decorativo y ya hay encabezados reales para navegar.

### 9.4 Gestión de foco del menú

Cero manejo de foco: sin `Escape` para cerrar, sin trampa de foco dentro del
panel abierto, sin devolver el foco al botón al cerrar, y sin `inert` cuando
está cerrado (§B8). Un usuario de teclado que abre el menú queda tabulando por
detrás del panel, sobre contenido que no ve.

### 9.5 Anclas bajo el header fijo

Ni una sola declaración de `scroll-margin-top` en todo el CSS, con un header
`position:fixed` de ~5 rem. Cada enlace del menú deja su destino parcialmente
tapado. Es una línea de CSS.

### 9.6 El sitio no es indexable en serio

- Sin `robots.txt`, sin `sitemap.xml`, sin JSON-LD. Para un destino turístico,
  `TouristDestination` / `LodgingBusiness` con coordenadas es justo lo que
  Google usa para los paneles de lugar. Ya tienes las coordenadas en pantalla y
  no están en los datos.
- Sin imagen Open Graph: compartido en WhatsApp —el canal real de este
  público— sale sin miniatura.
- `public/` todavía arrastra `file.svg`, `globe.svg` y `window.svg`, los assets
  de ejemplo de Next. Se publican tal cual.

### 9.7 Cero cabeceras de seguridad

`worker/index.ts` no emite ninguna: sin CSP, sin `X-Content-Type-Options`, sin
`Referrer-Policy`, sin HSTS. Es un sitio estático, así que el riesgo real es
bajo, pero son diez líneas en el worker y hoy no están.

### 9.8 Imágenes: 10 etiquetas, 0 dimensiones

10 `<img>`, ninguno con `width`/`height`, ninguno con `srcset`, ninguno con
`loading="lazy"`, cero uso de `next/image` — teniendo el worker un endpoint de
optimización (`/_vinext/image`) ya montado y sin usar. Cada imagen aporta CLS,
y en móvil se descargan las de 1920 px completas.

### 9.9 La build no corre fuera de Linux

`scripts/install-ci.sh` usa `flock` tres veces. **`flock` no existe en Windows
ni en macOS** (lo verifiqué en esta máquina: `flock: NO`, `timeout: sí`).
`build-verified.sh` además aborta explícitamente si no encuentra GNU `timeout`.
Traducido: **en Windows y macOS no se puede instalar ni compilar este
proyecto.** Si el equipo no es todo Linux, cada incorporación se topa con esto
el primer día. Los scripts vienen del starter; conviene decidir si se asumen o
se reemplazan por comandos portables.

### 9.10 `prefers-reduced-motion` no está reducido, está roto

La media query desactiva transiciones y el `useEffect` de GSAP retorna antes de
registrar nada. Pero la estructura sigue siendo la de un sitio animado:

- `.hero` mantiene sus **230 svh** con la imagen en `sticky` y sin ninguna
  animación: dos pantallas y media de scroll donde no ocurre absolutamente
  nada.
- Los tres `.project-panel` siguen en `position:sticky` sin las animaciones que
  los diferenciaban: tres pantallas apiladas que se tapan entre sí.
- `.company-bg` conserva `clip-path: circle(8% at 50% 52%)` —declarado en CSS y
  no sobrescrito por ninguna de las tres reglas posteriores— y GSAP nunca lo
  abre. **La fotografía de fondo queda reducida a un círculo diminuto en mitad
  de la sección, de forma permanente.** El texto sí se ve (`.company-content`
  es hermano de `.company-bg`, no hijo), así que la sección no desaparece: se
  ve rota, con un recorte circular flotando sobre fondo oscuro.

Lo último es un fallo visual, no una degradación elegante. Reducir movimiento
tiene que dar un sitio más corto y estático, no uno con restos de animaciones
que nunca ocurrieron.

### 9.11 Detalles de interacción

- Los tres paneles de territorio repiten el **mismo enlace** (`href="#llegar"`)
  con el **mismo texto** («Seguir el recorrido»). Tres destinos anunciados, un
  solo destino real. Ambigüedad de propósito de enlace y promesa incumplida.
- El `IntersectionObserver` ordena por `Math.abs(boundingClientRect.top)`, pero
  el callback solo recibe las entradas **que cambiaron**, no todas las visibles.
  Con dos secciones largas en pantalla el indicador se queda en la equivocada.
- La carga de GSAP es un `import()` dinámico sin `catch`. Si el chunk falla, la
  promesa se rechaza en silencio y el sitio queda en su estado inicial — con
  §9.10 de por medio, eso deja el fondo de «Nosotros» recortado a un círculo
  para todo el mundo, no solo para `prefers-reduced-motion`.

---

## 10. Auditoría · parte 3 — contenido, territorio y cascada

Esta pasada es la que más me preocupa. Las dos anteriores eran deuda técnica;
esta toca la credibilidad del sitio ante alguien de la zona.

### 10.1 Doce huecos de imagen, seis fotografías

```
cisnes-forest.webp   ×3      Queulat_29.jpg          ×2
cisnes-water.webp    ×2      Bosque_Encantado_2.jpg  ×2
cisnes-hero.webp     ×2      Bosque_valdiviano.jpg   ×1
```

**Todas las imágenes menos una aparecen repetidas**, y `cisnes-forest.webp` sale
tres veces. El sitio aparenta un despliegue fotográfico que no tiene: es el
mismo helecho en el manifiesto, en el panel 01 y en el interludio. En scroll
largo el ojo lo detecta enseguida y el efecto es de catálogo vacío. Ninguna
cantidad de animación arregla esto — hace falta material.

### 10.2 Las fotografías no son de Puerto Cisnes

Tres de las seis son del **Parque Nacional Queulat** (así lo dicen los propios
créditos del pie y los nombres de archivo: `Queulat_29`,
`Bosque_Encantado_2_Parque_Nacional_Queulat`). Queulat está a un buen trecho al
norte de Puerto Cisnes y es una excursión de día aparte, no el paisaje que se
ve desde el pueblo.

Sin cliente de por medio ya no es una promesa comercial rota, así que baja de
gravedad. Pero sigue siendo el problema **de autoría** más serio del sitio: una
pieza que se titula «Bosques de Puerto Cisnes» e ilustra con Queulat es una
pieza sobre un lugar que no visitó. Para cualquiera de la región es
reconocible al instante, y ahí se cae la autoridad de todo lo demás.

**Resuelto por la vía buena:** hay material propio de Puerto Cisnes. Ver
[BRIEF-FOTOGRAFICO.md](BRIEF-FOTOGRAFICO.md). Sustituir las tres de Queulat es
el cambio individual con más impacto de toda la auditoría — muy por encima de
cualquier mejora de animación.

### 10.3 Las coordenadas parecen ser de otro pueblo

`45°24'06" S · 72°41'48" O` aparece tres veces: en el cargador, en el hero y en
la sección «Nosotros». Es el dato más «verificable» de todo el sitio, puesto
justo donde el visitante lo lee como sello de autenticidad.

Puerto Cisnes está en torno a **44°44′ S**. La latitud 45°24′ S con esa longitud
corresponde a **Puerto Aysén**, unos 70–75 km al sur. La longitud coincide
porque ambos pueblos están casi en el mismo meridiano, lo que hace el error
fácil de cometer y difícil de notar.

**Verificar contra una fuente oficial antes de publicar.** Si se confirma, hay
que corregirlo en los tres sitios: unas coordenadas equivocadas en un sitio de
territorio son la clase de error que un vecino comenta y ya no se olvida.

### 10.4 La palabra «company», en inglés, a la vista

```jsx
<div className="company-label"><span>company</span><small>04 / 06</small></div>
```

No es un nombre de clase: es **texto visible**, en inglés, en un sitio
íntegramente en español, en la etiqueta de sección del capítulo «Quiénes
somos». Es el residuo de la plantilla de la que se copió la sección, y es la
prueba más directa de lo que decía en el veredicto. Un visitante lo lee.

### 10.5 Textos alternativos que se contradicen

El mismo archivo `cisnes-forest.webp` se describe de tres maneras distintas:

- «Bosque húmedo y cubierto de musgo en la Patagonia»
- «Helechos húmedos en el sotobosque de Aysén»
- «Detalle de helechos mojados en el bosque»

Solo una puede ser correcta. El `alt` describe **la imagen**, no el hueco donde
se coloca; si la misma foto necesita tres descripciones, el problema real es
§10.1. Lo mismo ocurre con `Queulat_29.jpg`, que aparece dos veces con dos
descripciones.

### 10.6 Precisión territorial

Dos afirmaciones que conviene contrastar con alguien de la zona antes de
publicar:

- **«Fiordo Puyuhuapi».** Puerto Cisnes da al **Canal** Puyuhuapi; el fiordo
  propiamente dicho está en el brazo norte, hacia Puyuhuapi. Para un lector
  local la diferencia se nota.
- **«La Carretera Austral se abre paso…»** Puerto Cisnes no está sobre la
  Carretera Austral: se llega por un desvío de unos 35 km (Ruta X-25). El texto
  sugiere que se pasa por el pueblo de camino, y no es así — dato que además
  importa para planificar un viaje.

Un sitio que presume de conocer el territorio no puede fallar en esto.

### 10.7 La cascada del CSS está fuera de control

Selectores repetidos en el mismo archivo:

```
.company        ×6      .company-bg        ×5      .project-panel  ×4
.company-title  ×6      .company-mark      ×4      .project-inner  ×4
.company-content ×6     .company-grid      ×4      .project-media  ×4
```

`.company` se declara **seis veces** con tres valores distintos de `height`
(205svh → 230svh → 245svh). El valor efectivo depende del orden de líneas en un
archivo minificado a mano donde una línea puede tener 4.000 caracteres. Y
`.company-mark` y `.company-grid` acumulan 8 reglas entre las dos para
elementos que **no existen en el JSX**.

Nadie puede revisar esto en un pull request, y el próximo cambio en esa sección
va a romper algo por accidente. Hay que partirlo en módulos por capítulo antes
de tocar nada más ahí.

### 10.8 Coste de compositing

- **21 declaraciones de `will-change`.** `will-change` promueve a capa propia y
  reserva memoria de GPU; usado de forma permanente y masiva consigue lo
  contrario de lo que busca. La regla es aplicarlo justo antes de animar y
  quitarlo al terminar, no dejarlo escrito en la hoja de estilos.
- **≈23 ScrollTriggers en tiempo de ejecución** (11 configuraciones, varias
  dentro de bucles sobre 3 elementos), **prácticamente todos con `scrub`**. Cada
  uno recalcula en cada evento de scroll, y encima compiten con el
  `getBoundingClientRect()` por frame del canvas (§3.6) y con
  `scroll-behavior:smooth` (§6).
- Varios animan `filter: brightness() blur() saturate()` con `scrub`
  (`.project-inner`): **`blur` animado no se puede componer en GPU de forma
  barata** y es de los efectos más caros que hay. Tres paneles a pantalla
  completa haciéndolo a la vez es el punto donde más probable es que caigan
  fotogramas en un portátil sin GPU dedicada.

Esto hay que medirlo con un perfil real antes de decidir qué se recorta. Es lo
único de toda la auditoría que no puedo verificar leyendo: necesita
`performance.now()` sobre hardware real.

### 10.9 Nombres heredados de la plantilla

`id="proyectos"` y `className="projects"` para una sección que en pantalla se
llama «Territorio»; `.project-panel`, `.project-media`, `.project-copy` para
paisajes; `company` para «Quiénes somos». Nada de esto lo ve el visitante
—salvo §10.4— pero explica por qué el sitio se siente prestado: **la estructura
sigue siendo la de un portafolio de estudio de diseño**, con proyectos y
clientes, y encima se escribió un texto de destino turístico.

---

## 11. Orden de trabajo propuesto

**Fase 0 — Bloqueantes.** B1–B9, más los fallos funcionales de la parte 2:
`.company-bg` recortado sin GSAP (§9.10), landmarks fuera de `<main>` (§9.2),
`aria-live` del indicador (§9.3), `scroll-margin-top` (§9.5). Un día largo.
Sin esto no hay conversación de producción.

**Fase 1 — La lluvia.** Portar `wind-field.mjs` al componente, sustituir el
motor del hero, cursor de dos capas, cursor reducido a dos estados,
delta-time en todo, `IntersectionObserver` en lugar del rect por frame.

**Fase 2 — La atmósfera como espina dorsal.** Extender la capa de agua a toda
la página con los seis estados de la §5.1. Aquí es donde el sitio deja de
parecer una plantilla.

**Fase 3 — Poda narrativa.** Cortar interludio, clip-path circular y una de las
secciones de tipografía grande. Bajar de ~15 a ~9 alturas de viewport.

**Fase 4 — Contenido y conversión.** Lo que se hace, dónde se duerme, cuándo
venir, y un formulario de verdad. Aquí entra también la parte 3 completa:
verificar las coordenadas (§10.3), conseguir fotografías reales de Puerto
Cisnes (§10.1, §10.2), quitar «company» (§10.4), y contrastar las
afirmaciones territoriales con alguien de la zona (§10.6). **Esta fase no la
puede cerrar el equipo de desarrollo solo:** necesita fotógrafo y a alguien
del lugar.

**Fase 5 — Accesibilidad y rendimiento.** Contraste, escala tipográfica,
`next/image`, imágenes de Wikimedia auto-alojadas, foco visible, preloader
atado a carga real, gestión de foco del menú (§9.4).

**Fase 6 — Responsive de verdad.** Los dos breakpoints que faltan (§9.1). El
rango 761–1100 px no lo ha visto nadie todavía; hay que abrirlo antes de
prometer una fecha.

**Fase 7 — Indexación y entrega.** `robots.txt`, `sitemap.xml`, JSON-LD de
`TouristDestination`, imagen Open Graph, cabeceras de seguridad en el worker,
limpieza de `public/`, y decidir qué se hace con los scripts que solo corren en
Linux (§9.9).

Yo empezaría por la Fase 1: es la que pediste, es la que da identidad, y ya
está escrita y probada. Dime si arranco por ahí o prefieres que ataque primero
los bloqueantes.
