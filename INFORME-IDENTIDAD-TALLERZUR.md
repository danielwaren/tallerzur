# Informe · Pivote de identidad — TallerZur

El sitio deja de ser una pieza de autor sobre un destino turístico y pasa a
ser la página oficial de **TallerZur**, el estudio que lo construyó — mismo
lugar, mismas coordenadas, mismo clima. Se hizo con perfil mínimo: la mayoría
del scroll sigue siendo pura atmósfera, y la identidad de agencia se
concentra en los capítulos que ya se habían decidido con el usuario
(territorio, nosotros, proyectos, llegar) más el encabezado/pie, que
cualquier sitio real necesita.

---

## Resumen

| | |
|---|---|
| Compilación | ✅ `vinext build` completa |
| Tipos | ✅ mismos 3 errores preexistentes de andamiaje D1 |
| Tests | ✅ **39/39** (5 nuevos: contacto real, factor de clima en vivo) |
| Clima real de Puerto Cisnes | ✅ confirmado en el navegador: la API responde con datos reales |
| Capturas del portafolio | ✅ confirmado que cargan (1200×900) |

---

## 1. Qué se mantuvo sin tocar

Hero y Esencia siguen siendo 100 % lugar — cero mención a agencia, ningún
cambio de texto. Eso fue explícito en la decisión: el sitio no debe "gritar"
que es de una agencia.

## 2. Qué cambió, capítulo por capítulo

- **Territorio** — las tres fichas de paisaje (bosque, canal, ruta) pasan a
  ser las tres líneas de trabajo reales (desarrollo, mantenimiento, servicios
  digitales), con la misma foto de fondo: el oficio pasa por debajo del
  paisaje, no lo reemplaza. Cada ficha suma un CTA real ("Cotizar este
  servicio" → `#llegar`), usando `.text-link`, que ya existía en el CSS sin
  usarse.
- **Nosotros** — el texto pasa a ser la identidad real del estudio, con la
  frase más específica y menos genérica que tiene TallerZur ("tu cliente
  busca 'hostal en Coyhaique' desde el celular con dos barras"), y una línea
  que revela el gancho técnico: *"La lluvia que ves en esta página es la de
  ahora mismo, afuera de donde escribimos el código."*
- **Proyectos** (antes "bosque lluvioso") — la galería de tres fotos
  prestadas de Queulat se reemplaza por el portafolio real: nutme.cl,
  subelab.com y hostalmonchito.cl, con capturas en vivo (mshots, sin API key,
  misma técnica que ya usa tallerzur.cl) en la misma retícula de 12 columnas
  de la Fase 3. Cada tarjeta es un link real al sitio en producción.
- **Llegar** — el `mailto:hola@puertocisnes.cl` placeholder se reemplaza por
  el contacto real: WhatsApp (`wa.me/56940068228`) como CTA principal, y
  `hola@tallerzur.cl` como alternativa visible.
- **Encabezado y pie** — la marca pasa de "PUERTO CISNES" a "TALLER/ZUR"; el
  pie dice "© 2026 TallerZur · Puerto Cisnes, Aysén".
- **Metadatos y JSON-LD** — título, descripción, Open Graph y Twitter Card
  ahora describen TallerZur. El JSON-LD pasa de `TouristDestination` a
  `ProfessionalService`, con nombre, teléfono, correo y área de servicio
  reales. Esto no es visible en el scroll — es lo que ven Google y WhatsApp al
  compartir el link, y tenía que ser preciso.

## 3. El gancho técnico: clima real de Puerto Cisnes

`lib/weather-states.ts` gana dos funciones puras y testeadas
(`liveWeatherFactor`, `applyLiveFactor`) que **escalan** la narrativa por
capítulo según el clima real — no la sustituyen. El canal sigue en calma en
"territorio" aunque afuera llueva a cántaros; lo que cambia es cuánta lluvia,
niebla y viento hay de fondo en cada capítulo.

`components/WeatherLayer.tsx` consulta Open-Meteo (mismas coordenadas que ya
usa el widget de clima de tallerzur.cl) al montar y cada 15 minutos. Si no
hay red, el factor se queda neutro y el sitio se ve exactamente igual que
antes — nunca rompe, nunca bloquea la animación por scroll.

**Verificado en el navegador, no solo en el modelo:** la llamada real se
disparó y devolvió el clima actual de Puerto Cisnes (despejado, código WMO 0,
23 ago 2026 ~11:45 hora local). El modelo puro tiene 5 tests nuevos
(factor neutro no cambia nada, lluvia real sube la lluvia, tormenta pesa más
que lluvia simple, nunca se sale del rango 0..1, no toca los campos que no le
corresponden).

## 4. Higiene

- `bosqueValdiviano` (la foto que solo se usaba en la galería del bosque, sin
  crédito) se retiró de `lib/media.ts` por quedar sin uso — ya no hay que
  mantenerla ni marcarla como pendiente.
- El resto del material de Wikimedia (`queulatNuboso`, `queulatEncantado`)
  sigue en uso en Esencia y Nosotros, así que los créditos del pie no
  cambian. Sigue pendiente el material fotográfico propio de
  `BRIEF-FOTOGRAFICO.md`.

## 5. Pendiente — no es código, es una decisión de negocio

**El dominio.** `tallerzur.cl` hoy apunta al sitio Astro en `/tallerzur`
(Vercel). Este proyecto es un stack distinto (vinext/Cloudflare). Dejé
`SITE_URL` apuntando a `https://tallerzur.cl` en `app/layout.tsx` con un
comentario `TODO`, pero **no se puede migrar el DNS sin que decidas** qué pasa
con el sitio Astro actual: ¿se reemplaza, queda de respaldo, o convive en otra
ruta? Es la única pieza de esta tarea que no pude ni debía resolver por mi
cuenta.

## 6. Lo que sigue sin poder verificar yo

Igual que en las fases anteriores: el panel del navegador de esta sesión
sigue sin mostrarse, así que no puedo confirmar cómo se *ve* — solo que la
estructura, los datos y la lógica están correctos. Antes de publicar, dale
una pasada visual a Territorio, Nosotros y Proyectos.
