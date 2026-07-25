# Brief fotográfico — Bosques de Puerto Cisnes

Para el fotógrafo del proyecto. Lo que necesito, por qué, y en qué formato.

---

## 1. La idea que ordena todo: agua en todas las escalas

El sitio tiene una sola idea propia y es la lluvia. La propuesta de dirección
es llevarla de adorno del hero a columna vertebral: **el agua como hilo
continuo, recorrida de la escala más pequeña a la más grande.**

```
gota en una hoja  →  musgo empapado  →  helecho goteando  →  arroyo
      →  lluvia sobre el canal  →  niebla en la montaña  →  escampa
```

Eso es lo que ninguna foto de banco puede dar y lo que tú sí tienes. Y explica
la lista de tomas: **no necesito más paisajes anchos.** El sitio ya tiene tres y
le sobran dos. Lo que le falta es lo pequeño.

### Por qué esto arregla el problema real

Hoy hay **12 huecos de imagen y 6 fotografías**: casi todas repetidas, una de
ellas tres veces. Y tres de las seis son del Parque Nacional Queulat, que no es
Puerto Cisnes. El sitio parece un catálogo vacío porque lo es.

Con material propio de fauna y flora, el sitio deja de ser un paisaje genérico
del sur y pasa a ser **un lugar concreto documentado por alguien que estuvo
ahí**. Ese es el salto de calidad más grande disponible, muy por encima de
cualquier animación que yo pueda añadir.

---

## 2. Lo primero: los cisnes

El pueblo se llama **Puerto Cisnes**. El sitio no tiene un solo cisne.

Si tienes cisnes de cuello negro, esa es la imagen emblema del proyecto entero
— la que abre, la que se comparte, la que queda. Prioridad máxima.

Idealmente en tres registros:
- **Contexto:** cisnes en el agua con el paisaje detrás, horizontal
- **Retrato:** uno o dos animales, teleobjetivo, fondo limpio de agua
- **Gesto:** despegue, ala, estela en el agua, reflejo

Si además hay alguno con lluvia o neblina, ese es el que abre el sitio.

---

## 3. Lista de tomas por capítulo

Cantidades orientativas de **selección final**, no de disparo.

### Capítulo 1 · Llegada bajo lluvia (hero)
**1–2 imágenes.** Horizontal, ancha. Bosque + agua + montaña.

Requisito técnico particular: va a llevar un titular gigante encima y un
oscurecido fuerte, así que **necesita una zona tranquila** —cielo, niebla,
agua— en el tercio central-izquierdo donde el texto pueda respirar. Una toma
con detalle interesante en toda la superficie pelea contra la tipografía y
pierde. Mejor si el contraste es bajo y hay bruma.

### Capítulo 2 · El bosque respira (macro y detalle)
**8–12 imágenes.** Es el corazón del sitio y lo que hoy no existe.

- Gotas sobre hoja de nalca, coigüe, canelo — la gota como lente
- Musgo saturado, con brillo de agua
- Líquenes, barba de viejo colgando con humedad
- Helechos: el báculo enrollado, el envés, la costilla de vaca
- Hongos: digüeñes, cualquier cosa que salga con la lluvia
- Corteza mojada, textura, agua bajando por un tronco
- Un charco del suelo del bosque con reflejo de dosel

Cuanto más cerca, mejor. Aquí la profundidad de campo mínima y el fondo
disuelto es exactamente lo que quiero: contrasta con los planos anchos y da el
cambio de escala que sostiene la narrativa.

### Capítulo 3 · El canal (territorio)
**3–4 imágenes.** El Canal Puyuhuapi, no «el fiordo» — la corrección va también
en el texto.

Marea, costa, embarcaciones si las hay, la montaña cayendo al agua. Horizontal.
Al menos una en calma total, tipo espejo: el sitio necesita un momento de
quietud después del bosque denso.

### Capítulo 4 · Quién vive aquí (fauna)
**5–8 imágenes.** Lo que tengas: chucao, hued-hued, martín pescador, carpintero
negro, churrete, rapaces, delfines, lobos marinos, pudú.

Preferencia por **vertical o cuadrado** — van en fichas y hoy toda la
fotografía del sitio es apaisada, que es parte de por qué se siente monótono.

Un plano de fauna con lluvia visible o plumaje mojado vale por tres.

### Capítulo 5 · La humedad tiene memoria (dosel)
**3–4 imágenes.** Verticales pronunciadas.

Contrapicado hacia el dosel, luz filtrándose entre hojas, troncos altos,
verde denso. Estas van a pantalla completa en vertical y necesitan altura real.

### Capítulo 6 · Escampa (salida)
**2–3 imágenes.** La luz rompiendo, niebla levantando, el atardecer.

El sitio termina en un «vuelve al sur» y hoy no hay ninguna imagen que sugiera
apertura. Todo es cerrado y húmedo. Aquí hace falta aire.

---

## 4. Set especial · calibración de la lluvia

Esto es una petición técnica poco habitual y es la que más me interesa
después de los cisnes.

El motor de lluvia del sitio está construido con física real —el trazo se
dibuja en la dirección de la velocidad, y su largo es `velocidad × tiempo de
exposición`— pero **las constantes están estimadas por mí, no medidas.**

Si me traes fotografías de lluvia real de Puerto Cisnes con las gotas visibles
como trazos, puedo calibrar el motor contra ellas en vez de contra mi criterio:

- Fondo oscuro (bosque en sombra, agua) para que el trazo se lea
- **La misma escena a 2 o 3 velocidades de obturación** (p. ej. 1/60, 1/125,
  1/250) sin recortar
- EXIF intacto: necesito la velocidad, la focal y la distancia

Con eso puedo medir el largo real del trazo en píxeles a una exposición
conocida y derivar la constante en vez de inventarla. **La lluvia del sitio
pasaría a ser la lluvia de Puerto Cisnes, literalmente medida.** No conozco
ningún sitio que haya hecho eso.

## 5. Set especial · texturas

**4–6 imágenes**, para usar como capas y transiciones entre capítulos, no como
fotografías protagonistas:

- Agua sobre vidrio, condensación, gotas resbalando
- Agua desenfocada, bokeh de reflejos
- Niebla pura, casi sin sujeto, como degradado
- Superficie de agua en movimiento, abstracta

Estas resuelven un problema que hoy tapo con CSS: los cortes entre secciones
son bloques de color plano. Con textura real las transiciones dejan de parecer
un tema de plantilla.

---

## 6. Entrega

**Color**
- **sRGB**, no AdobeRGB ni ProPhoto. El navegador va a ignorar el perfil ancho
  y vas a ver tus colores apagarse sin saber por qué.
- Perfil incrustado.

**Resolución**
- Hero, dosel y planos a sangre: lado largo **≥ 4000 px**
- Todo lo demás: lado largo **≥ 2400 px**
- Yo genero AVIF y WebP en todos los tamaños responsivos. Tú entrega el máster.

**Formato**
- JPEG calidad 95+, o TIFF 16 bits si el archivo lo permite
- **Sin sharpening de salida** — lo aplico yo después del redimensionado, si
  lo hago antes se ve el halo
- Sin marca de agua, sin borde, sin firma incrustada

**Encuadre**
- Entrega con **margen de sobra**. El sitio recorta a 16:9, 4:5, 1:1 y 2:1
  según el sitio, y en móvil algunos van casi a 9:16.
- Si un encuadre es intocable, dímelo y lo respeto: construyo el bloque
  alrededor de la foto, no al revés.

**Metadatos**
- **Deja el EXIF.** Quiero fecha y coordenadas reales para los pies de foto.
  Que un pie diga «Canal Puyuhuapi · marzo, 6:40» es exactamente la autoridad
  que el sitio hoy simula y no tiene.

**Nombres**
```
capitulo-sujeto-nn.jpg
02-gota-nalca-01.jpg
04-chucao-03.jpg
cal-lluvia-1-125.jpg
```

---

## 7. Sobre el grado de color — esto te va a interesar

El sitio **está regradeando tus fotos en el navegador**, y con seis grados
distintos:

```css
filter: saturate(.72) brightness(.70) contrast(1.05)   /* hero */
filter: saturate(.68) brightness(.72) contrast(1.05)   /* manifiesto */
filter: saturate(.68) contrast(1.08)                   /* company */
filter: saturate(.72) contrast(1.05)                   /* paneles */
filter: saturate(.74) contrast(1.04)                   /* galería */
filter: brightness(.58) saturate(.60)                  /* interludio */
```

Tres problemas:

1. **Te está desaturando entre un 26% y un 40%** con una curva lineal tonta,
   que no es lo mismo que bajar saturación en Lightroom: `saturate()` de CSS
   opera sobre sRGB sin gestión de color y ensucia los verdes, que es
   justamente lo que este sitio tiene de sobra.
2. **Son seis grados distintos**, así que tus fotos no van a coincidir entre
   ellas dentro del propio sitio.
3. Aplicar `filter` a un `<img>` que además está siendo escalado y desplazado
   por GSAP en cada frame fuerza recomposición constante. Es coste de
   rendimiento a cambio de estropear la imagen.

**Mi propuesta:** el grado lo haces tú, en Lightroom o Capture One, una sola
vez, y el sitio muestra la foto tal cual. Yo elimino los `filter`. Si un bloque
necesita oscurecerse para que el texto se lea, lo hago con una capa de color
encima —que es una decisión de diseño y no toca el archivo— en vez de deformar
la fotografía.

Si quieres una identidad de color común —verde austral desaturado, sombras
frías— hazla como preset y aplícala tú a toda la serie. Va a quedar
infinitamente mejor que `saturate(.72)`.

---

## 8. Resumen de lo que pido

| Set | Cantidad | Orientación |
|---|---|---|
| Cisnes de cuello negro | 3–5 | mixta |
| Hero / llegada | 1–2 | horizontal, con zona tranquila |
| Macro y detalle del bosque | 8–12 | mixta, mucho cuadrado |
| Canal Puyuhuapi | 3–4 | horizontal |
| Fauna | 5–8 | vertical y cuadrado |
| Dosel | 3–4 | vertical pronunciado |
| Escampa / luz | 2–3 | horizontal |
| Calibración de lluvia | 3–6 | sin recortar, EXIF intacto |
| Texturas | 4–6 | mixta |

**Total: ~35–50 selecciones finales.**

Con menos también trabajo. Si tuviera que quedarme con tres sets: **cisnes,
macro del bosque y calibración de lluvia**. Esos tres cambian el proyecto de
categoría.
