# Informe · Fase 4 — TallerZur comercial

El sitio deja de ser una pieza de atmósfera con la agencia escondida y pasa a
vender, sin perder lo que lo hacía distinto: la lluvia real de Puerto Cisnes,
Fraunces/Inter, el tono oscuro y los paneles apilados. Rama
`feat/tallerzur-comercial`, sin push, sin DNS ni despliegue.

---

## Resumen

| | |
|---|---|
| Compilación | ✅ `npm run build:local` limpio |
| Tipos | ✅ `tsc --noEmit`: los mismos 3 errores previos del andamiaje D1 (`db/index.ts`, `worker/index.ts`), ninguno nuevo |
| Tests | ✅ **72/72** (`npm run test:unit`): 39 previos + 33 nuevos |
| Lighthouse móvil (build real, con compresión) | Accesibilidad **100** · Buenas prácticas **100** · SEO **100** · Performance **93–95** con CPU calibrada / **74–80** con el ×4 por defecto (ver §4) |
| Revisado en el navegador | ✅ 390 px y escritorio (1440 px), en dev y en el build de producción |

### Commits

| Commit | Qué |
|---|---|
| `27a9b1a` | Línea base: lo que estaba sin commitear (Fase 3 + pivote de identidad) |
| `fcb2189` | Fases 1 y 2: datos en `lib/`, imágenes, recorrido nuevo, servicios, proyectos, FAQ, navegación |
| `0a0673e` | Fase 3: route handler de contacto con Resend + tests |
| `cbbb4cf` | Fase 4: rendimiento (página de servidor, carga diferida) |
| `2515977` | Fase 5: redirecciones 301 y sitemap |

Las fases 1 y 2 van en un solo commit: la página nueva depende de los datos
nuevos y por separado no compilaba.

---

## 1. Recorrido nuevo

| # | Sección | Qué cambió |
|---|---|---|
| 1 | Hero `#inicio` | Se mantienen la foto, la lluvia y *"Donde el bosque toca el mar."*. Se agregan la línea de valor y dos CTA: **Hablemos por WhatsApp** y **Ver proyectos**. Ya no hay cargador de pantalla completa: el hero entra con CSS al pintarse. Pasa de 165 a 115 svh. |
| 2 | Franja de confianza | Hecho en Puerto Cisnes · Soporte por WhatsApp · Respuesta en menos de 24 h · Carga con mala señal. |
| 3 | Servicios `#servicios` | Cada panel tiene ahora qué incluye (4 puntos), para quién es y un CTA que preselecciona el servicio en el formulario. La mantención lleva el sello "Servicio estrella". |
| 4 | Mantención garantizada `#mantencion` | *"Si tu sitio se cae en enero, no esperas a marzo."* Promesas: < 24 h todo el año, < 4 h hábiles en temporada alta (dic–mar), WhatsApp directo y plan mensual sin cifra. |
| 5 | Proyectos `#proyectos` | Tarjetas con captura, año, rubro, el desafío que resolvía, stack y "Ver sitio en vivo". Los datos viven en `lib/projects.ts`: agregar un proyecto es agregar un objeto. |
| 6 | Nosotros `#nosotros` | Más corto (100 svh). Absorbe la frase de Esencia ("no vienes al sur solo para verlo: vienes a recordarlo"). El emblema pasa de P/C a T/Z. |
| 7 | Preguntas `#preguntas` | 6 preguntas en `<details>` y JSON-LD `FAQPage` generados del mismo arreglo (`lib/faq.ts`). Sin cifras. |
| 8 | Contacto `#contacto` | WhatsApp grande con mensaje según el servicio elegido, más un formulario completo (§2). |

- **Eliminadas:** la sección Esencia y el cargador.
- **Navegación:** header fijo con Servicios · Proyectos · Preguntas · Contacto y un botón de WhatsApp. En el celular, el menú a pantalla completa mantiene la trampa de foco, más un **WhatsApp flotante** que aparece después del hero y se esconde al llegar al contacto.
- **Preselección del servicio:** funciona con `?servicio=desarrollo|mantencion|digitales|asesoria`, sirve para los enlaces de tus correos de prospección y funciona sin JS.

## 1b. Tarjetas apiladas de "Tres maneras de sostener un sitio"

Se recuperó y modernizó el efecto en que las tarjetas se superponen al hacer scroll:

- **Cómo se ve:** cada servicio queda fijo bajo el header y el siguiente se desliza encima. El anterior se encoge desde arriba y se oscurece, y su borde superior asoma como en un mazo. Al entrar, la foto se abre desde un leve zoom y el texto sube en cascada.
- **Fluidez:** solo se animan `transform` y `opacity` (el oscurecido es una capa con opacidad, no `filter`), con scrub corto (0,5 s).
- **Pantallas:** funciona también en el celular. Ahí la foto es flexible y ocupa lo que deja el texto, para que la tarjeta entera quepa.
- **Red de seguridad:** si en alguna pantalla una tarjeta no cabe (por ejemplo, iPhone SE 375×667), el apilado se apaga solo y las tarjetas fluyen una tras otra. Nunca tapan un CTA.
- **Comprobado** con hit-test de los tres CTA en 330×640, 375×667, 390×844, 1366×700 y 1440×900. Con `prefers-reduced-motion` no hay apilado.

## 2. Contacto

- **Campos:** nombre, negocio, comuna (las 10 de Aysén + "Fuera de Aysén"), rubro, sitio actual (opcional), servicio, mensaje y "correo o WhatsApp". Todos tienen label, `autocomplete` e `inputmode` correctos, y fuente de 16 px para que iOS no haga zoom.
- **Validación:** `lib/contact.ts` es la misma en el navegador y en el servidor. Errores por campo con `aria-describedby`, y el foco salta al primer campo con error.
- **`POST /api/contacto`:**
  - Responde JSON al formulario con JS y una página HTML legible a navegadores sin JS.
  - Envía con `fetch` a la API de Resend, sin SDK, a **danielguz.ga@gmail.com** (correo provisorio hasta tener el corporativo; se cambia en `CONTACT_EMAIL`, en `lib/contact.ts`, y cambia en todo el sitio), con `reply_to` si la persona dejó correo.
  - Antispam: honeypot y marca de tiempo (rechaza envíos en menos de 3 s). A un bot se le responde "ok" sin enviar nada.
  - Sin `RESEND_API_KEY` responde 503 `no-config`.
- **Estados:** "Enviando…" · "Listo, {nombre}. Te respondemos en menos de 24 horas." · error. Si falla el envío o falta la clave, aparece un botón **"Enviar por WhatsApp" que ya lleva escrito lo que la persona puso en el formulario**.
- **Tests (17):** validación, honeypot, envío rápido, falta de clave, 422, JSON roto, envío correcto con Resend simulado, fallo de Resend y formulario sin JS.

## 3. SEO y migración

- **Título:** "TallerZur — Sitios web y mantención para pymes de Aysén". La descripción es nueva y la OG/Twitter usan un **JPEG 1200×630** dedicado (`public/images/og-tallerzur.jpg`).
- **JSON-LD `ProfessionalService`:**
  - `areaServed` incluye la región y las 10 comunas.
  - Se saca `priceRange`, porque el sitio ya no publica cifras.
  - Se agregan `contactPoint` y un `hasOfferCatalog` armado con los servicios reales.
- **Redirecciones 301** (en `worker/index.ts`, porque vinext convierte `permanent` en 308 en producción):
  - `/blog` → `/`
  - `cuanto-cuesta-pagina-web-aysen` → `/#preguntas`
  - `por-que-tu-sitio-necesita-mantenimiento` → `/#mantencion`
  - `5-herramientas-web-hostal-restaurante` → `/#servicios`
  - Además, los **otros 3 artículos** que tenía el blog viejo y que no estaban en la lista: `seo-local-como-aparecer-en-google` → `#servicios`, `velocidad-web-patagonia` → `#preguntas` y `whatsapp-business-vs-pagina-web` → `#preguntas`.
  - Cualquier otra URL bajo `/blog` va al inicio.
  - Verificado también contra workerd real.
- **Sitemap:** `lastModified` queda fijo (antes era `new Date()` en cada visita).

## 4. Rendimiento — qué se hizo y cómo leer los números

**Cambios:**
- **Página de servidor.** `page.tsx` deja de ser un solo componente cliente. Servicios, proyectos y preguntas llegan como HTML y no se hidratan. Las islas cliente son el header, el panel de contacto, el WhatsApp flotante, la lluvia y los efectos de scroll.
- **Lluvia.** Arranca después de `load` y con el hilo principal libre. En pantallas táctiles usa DPR 1,25. Tiene calidad adaptativa: si los cuadros tardan, baja partículas y después quita la niebla. Nunca bloquea contenido ni clics.
- **GSAP** (~110 KB) se carga en la primera interacción.
- **Niebla del hero:** degradado radial en vez de `filter: blur(80px)`.
- **Imágenes:** todas son AVIF + WebP con `srcset`, `width`/`height` y carga diferida bajo el pliegue. Ya no hay Wikimedia ni capturas pedidas en vivo a mshots.
- **`prefers-reduced-motion`:** sin GSAP, sin lluvia y sin apariciones; el sitio queda más corto y estático.

**Cómo se midió:** Lighthouse 12 en modo móvil contra el build real (`npm run preview`, el worker en workerd), detrás de un proxy local con brotli, porque el servidor local no comprime y Cloudflare sí.

| Corrida | Performance | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|
| Antes de optimizar (sin compresión) | 51 | 3,6 s | 4,4 s | 1.400 ms | 0 |
| Final, CPU ×2 (calibrada para este equipo) | 93–95 | 2,0 s | 2,0–2,2 s | 160–220 ms | 0 |
| Final, CPU ×4 (por defecto) | 74–80 | 1,8–2,1 s | 1,8–2,2 s | 640–1.250 ms | 0 |

Esta laptop (i5-8250U) marca un `benchmarkIndex` de ~650–740. El ×4 de
Lighthouse está calibrado para equipos de ~1.500 o más (como los servidores
de PageSpeed Insights), así que aquí sobrestima el costo de CPU casi al doble
y además varía mucho entre corridas. **La cifra que vale es la de PageSpeed
Insights sobre la URL publicada.** Es la primera verificación después de
desplegar. Accesibilidad, buenas prácticas y SEO dieron 100 en todas las
corridas finales.

## 5. Verificado en el navegador

En 390 px y 1440 px, en dev y en el build de producción:

- El hero muestra la línea de valor y los dos CTA en el primer pantallazo.
- El CTA "Quiero mantención" lleva al contacto con el servicio preseleccionado, URL `?servicio=mantencion#contacto` y foco en "Tu nombre".
- Enviar el formulario vacío muestra los errores por campo y lleva el foco al primero.
- Con datos válidos y sin clave aparece "no está conectado al correo" y el botón de WhatsApp con el mensaje armado (probado contra workerd real).
- El menú móvil abre y Escape lo cierra. El WhatsApp flotante aparece tras el hero.
- Los `<details>` abren.
- No hay scroll horizontal a 390 px.
- Los CTA de servicio son clicables a 800×600, 1440×780 y 390×844. Esta prueba destapó un bug: en pantallas bajas el panel sticky siguiente tapaba el CTA. Quedó corregido: el apilado solo se activa con 760 px de alto o más.
- Consola sin errores propios. El único fue el 503 esperado del envío sin clave; Open-Meteo a veces responde 503 por límite de uso y el sitio lo absorbe sin romperse.

**No verificado:** `prefers-reduced-motion` en vivo (no pude emularlo en el
panel; está cubierto por CSS y por las guardas en JS) y la sensación del
scroll en un celular real.

---

## 6. TODO — necesita tu decisión o tu ojo

1. **Proyectos: las descripciones heredadas estaban mal.** Al capturar los sitios vi que **nutme.cl** es el Núcleo Milenio de ecosistemas de arrecifes mesofóticos templados (no una "plataforma de nutrición") y que **subelab.com** es el Subtidal Ecology Laboratory (no un "laboratorio digital de servicios web"). Reescribí rubro y desafío según lo que muestran los sitios, sin cifras ni resultados. **Confírmalos o corrígelos** en `lib/projects.ts`.
2. **La captura de subelab.com muestra a un buzo** (el rostro no se ve, va con máscara). Es una captura del sitio de tu cliente, no una foto sacada de internet, pero confirma que estás de acuerdo con mostrarla.
3. **Plazos típicos** para la FAQ "¿Cuánto se demora?". Hoy dice que el plazo va por escrito en la cotización. Si me das un rango, lo agrego.
4. **Mantención a sitios hechos por otros.** En el plan propuse "la hayamos hecho nosotros o no". Como no lo confirmaste, el texto dice "cualquier negocio que ya tiene web y no puede quedarse sin ella en temporada". Si atiendes sitios de terceros, conviene decirlo explícito.
5. **Resend, antes de publicar:**
   - Mientras no haya dominio verificado, el remitente es `onboarding@resend.dev`, y Resend solo deja enviar al correo dueño de la cuenta: **crea la cuenta de Resend con danielguz.ga@gmail.com**.
   - Cuando tengas el correo corporativo: verificar `tallerzur.cl` en Resend, poner `CONTACT_FROM="TallerZur <web@tallerzur.cl>"` y cambiar `CONTACT_EMAIL`.
   - Cargar la clave con `wrangler secret put RESEND_API_KEY`.
   - Para probar en local, `.env.local` con `RESEND_API_KEY=...` (ya está en `.gitignore`).
   - Hacer un envío real de prueba.
6. **Límite de envíos por IP:** no hay (requeriría KV). Hoy protegen el honeypot, la marca de tiempo y la validación. Si llega spam, conviene una regla de rate limiting de Cloudflare sobre `/api/contacto`.
7. **PageSpeed Insights** sobre la URL publicada, para confirmar Performance ≥ 85 (§4).
8. **Fotografía propia** (`BRIEF-FOTOGRAFICO.md`). Wikimedia salió del sitio, pero las fotos siguen sin ser de Puerto Cisnes, y Nosotros repite la foto del bosque del panel 01.
9. **Coordenadas:** el TODO previo de confirmarlas contra IGM/BCN sigue abierto.
10. **Detalle menor previo:** al abrir el menú con el mouse, el foco queda en "cerrar" en vez del primer enlace. Con teclado funciona bien.

## 7. Para correrlo

```
npm run build:local      # build
npm run test:unit        # 72 tests (requieren el build)
npm run preview          # build real en workerd: http://localhost:4173 (o --port)
npm run dev              # desarrollo
```

`vinext start` **no sirve** los CSS, JS ni imágenes de este build (está hecho
para Cloudflare y espera el binding `ASSETS`). Para probar el build, usa
`npm run preview`.

Para regenerar imágenes (por ejemplo, al agregar un proyecto):
`node scripts/build-images.mjs <carpeta-con-capturas>`. Las instrucciones
para sacar capturas con Edge headless están dentro del script.

Fuera del repo cambió una sola cosa: agregué la entrada `cisnes-prod` (puerto 4340) a
`C:\dev\.claude\launch.json`.
