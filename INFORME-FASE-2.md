# Informe · Fase 2 — El agua como hilo continuo

## Qué se hizo

La lluvia dejó de ser un efecto del hero. Ahora una **sola capa atmosférica
recorre la página entera** y cambia de estado por capítulo, interpolando con el
scroll. Un mecanismo, seis estados.

| Capítulo | Estado del agua |
|---|---|
| Inicio · llegada | Lluvia densa, viento con rachas, algo de niebla |
| Esencia · el bosque | La lluvia amaina a garúa; la niebla sube |
| Territorio · el canal | El agua ya cayó: quietud, ondas lentas en la superficie |
| Nosotros · el refugio | Condensación en vidrio: gotas que resbalan y dejan reguero |
| Bosque · el dosel | Goteo denso y lento desde el borde superior |
| Llegar · escampa | Casi sin lluvia, aire limpio |

Entre capítulo y capítulo todo se cruza de forma continua: el capítulo salta
con el scroll, pero el agua persigue su objetivo con ~1,6 s de inercia, así que
nunca hay un corte seco.

## Arquitectura

- **`lib/weather-states.ts`** — el modelo: seis presets e interpolación. Puro,
  sin DOM. Es donde vive la narrativa; cambiar la sensación de un capítulo es
  cambiar siete números.
- **`components/WeatherLayer.tsx`** — mide el scroll, resuelve el estado y
  dibuja. Seis subsistemas (niebla, aire, lluvia, goteo, ondas, condensación),
  cada uno escalado por su parámetro: cuando vale ~0 no cuesta nada (se salta el
  bucle).

Cada efecto nuevo se apaga solo fuera de su capítulo, así que el coste sigue el
estado: el hero es casi todo lluvia, el refugio casi toda condensación.

## Verificado ✅

- **34 tests, todos pasando** (8 nuevos de la máquina de estados: coherencia de
  la narrativa, continuidad sin saltos en las fronteras, recorte en extremos,
  mapeo scroll→capítulo, casos límite).
- Tipos limpios (0 errores en código de aplicación).
- `vinext build` compila.
- Sin errores de consola ni de red.
- El canvas monta correcto: `fixed`, `z-18`, `pointer-events:none`, cursor
  propio activo.

## NO verificado — necesita tu ojo ⚠️

**No pude ver la Fase 2 en movimiento.** El panel de navegador de esta sesión
volvió a ocultarse, lo que congela `requestAnimationFrame`: el bucle de dibujo
no corre, así que ni captura ni lectura de píxeles sirven. La lógica está
probada; el aspecto no.

Dos cosas que revisar tú, por orden de importancia:

1. **Legibilidad sobre las secciones claras.** Es el riesgo real. El canvas está
   en `z-18`, por encima de todas las secciones. En «Territorio» y «Bosque»
   —fondos gris claro con texto oscuro— los efectos van en mezcla aditiva, que
   sobre fondo claro debería quedar muy sutil, pero **puede o bien no verse, o
   bien lavar levemente el texto**. Baja hasta esas dos secciones y comprueba
   que el texto se lee sin problema. Si algo estorba, se baja la opacidad de ese
   efecto (una constante) o se recorta el canvas a las zonas oscuras.

2. **Que cada capítulo se sienta distinto.** Baja despacio de arriba a abajo:
   ¿la lluvia amaina al entrar al bosque? ¿el canal se siente en calma? ¿se ve
   la condensación en «Nosotros» (que tiene fondo oscuro, ahí sí debería
   lucir)? ¿el goteo bajo el dosel? ¿escampa al final?

Si un capítulo no se siente bien, dime cuál: son siete números en
`lib/weather-states.ts`, se ajusta en un momento.

## Ajuste fino disponible

Todo el modelo está en la constante `CHAPTERS`. Por ejemplo, si «Esencia» te
parece poco lluviosa, subes su `rain`; si la niebla del bosque tapa demasiado,
bajas su `mist`. No hay que tocar el motor.
