import assert from "node:assert/strict";
import test from "node:test";
import { createRainAudio, windToCutoff, intensityToGain, dropletRate, AUDIO } from "./rain-audio.mjs";
import { globalWind } from "./wind-field.mjs";

/* Web Audio no existe en Node: se stubea para verificar la forma del grafo,
   que los parámetros queden en rango y que no se generen NaN. Cómo suena no
   se puede testear aquí — eso lo juzga el oído. */
function stubAudio() {
  const created = [];
  const connections = [];
  const scheduled = [];

  class Param {
    constructor(name) { this.name = name; this.value = 0; }
    setValueAtTime(v, t) { scheduled.push([this.name, "set", v, t]); this.value = v; return this; }
    linearRampToValueAtTime(v, t) { scheduled.push([this.name, "linear", v, t]); this.value = v; return this; }
    exponentialRampToValueAtTime(v, t) { scheduled.push([this.name, "exp", v, t]); this.value = v; return this; }
    setTargetAtTime(v, t, c) { scheduled.push([this.name, "target", v, t, c]); this.value = v; return this; }
    cancelScheduledValues() { return this; }
  }

  class Node {
    constructor(type) { this.type_ = type; created.push(this); }
    connect(next) { connections.push([this.type_, next?.type_ ?? "destination"]); return next; }
    disconnect() {}
  }

  class Ctx {
    constructor() {
      this.sampleRate = 44100;
      this.currentTime = 0;
      this.state = "suspended";
      this.destination = new Node("destination");
    }
    async resume() { this.state = "running"; }
    createBuffer(channels, length) {
      const data = Array.from({ length: channels }, () => new Float32Array(length));
      return { length, numberOfChannels: channels, getChannelData: (i) => data[i] };
    }
    createBufferSource() {
      const n = new Node("bufferSource");
      n.buffer = null; n.loop = false; n.playbackRate = new Param("playbackRate");
      n.start = (t) => { n.startedAt = t; }; n.stop = (t) => { n.stoppedAt = t; };
      return n;
    }
    createGain() { const n = new Node("gain"); n.gain = new Param("gain"); return n; }
    createBiquadFilter() {
      const n = new Node("biquad");
      n.type = ""; n.frequency = new Param("frequency"); n.Q = new Param("Q");
      return n;
    }
    createStereoPanner() { const n = new Node("panner"); n.pan = new Param("pan"); return n; }
  }

  return { Ctx, created, connections, scheduled };
}

test("las curvas quedan dentro de rango con el viento real del sitio", () => {
  const [min, max] = AUDIO.hissLowpassRange;
  for (let t = 0; t < 400; t += 0.5) {
    const cutoff = windToCutoff(globalWind(t));
    assert.ok(Number.isFinite(cutoff), "el corte no puede ser NaN");
    assert.ok(cutoff >= min && cutoff <= max, `corte fuera de rango: ${cutoff}`);
  }
});

test("el viento modula el filtro de verdad (no es una constante disfrazada)", () => {
  const samples = [];
  for (let t = 0; t < 400; t += 0.5) samples.push(windToCutoff(globalWind(t)));
  const spread = Math.max(...samples) - Math.min(...samples);
  assert.ok(spread > 800, `la racha debe abrir y cerrar el filtro, recorrido ${spread.toFixed(0)} Hz`);
});

test("el volumen se mantiene discreto incluso al 200% de intensidad", () => {
  assert.ok(intensityToGain(2) < 0.09, `al 200% el master no debe pasar de ~0.09, da ${intensityToGain(2).toFixed(3)}`);
  assert.ok(intensityToGain(0.3) > 0.03, "al mínimo debe seguir siendo audible");
  assert.ok(intensityToGain(2) > intensityToGain(1), "más intensidad, más presencia");
});

test("la garúa no se va a la zona de fritura", () => {
  // Por encima de ~5 kHz el ruido filtrado deja de leerse como agua.
  const [, max] = AUDIO.hissLowpassRange;
  assert.ok(max <= 5000, `el techo de agudos no debe pasar de 5 kHz, está en ${max}`);
  let peak = 0;
  for (let t = 0; t < 400; t += 0.5) peak = Math.max(peak, windToCutoff(globalWind(t)));
  assert.ok(peak < 4600, `ni siquiera la racha más fuerte debe llegar ahí, llega a ${peak.toFixed(0)} Hz`);
});

test("la densidad de gotas sube con la intensidad", () => {
  assert.ok(dropletRate(2) > dropletRate(1) * 1.3, "al 200% deben caer bastantes más gotas");
  assert.ok(dropletRate(2) < 60, "sin desbocarse: cada gota es un nodo de audio");
});

test("el grafo se construye y arranca en silencio", async () => {
  const { Ctx, connections, created } = stubAudio();
  const rain = createRainAudio({ AudioContextCtor: Ctx });
  await rain.start();

  assert.equal(rain.context.state, "running", "debe reanudar el contexto");
  assert.ok(rain.running);

  const sources = created.filter((n) => n.type_ === "bufferSource");
  assert.equal(sources.length, 2, "dos capas de ruido: garúa y cuerpo");
  for (const source of sources) {
    assert.ok(source.loop, "las capas base deben ir en bucle");
    assert.equal(source.startedAt, 0);
  }
  const filters = created.filter((n) => n.type_ === "biquad").map((n) => n.type);
  assert.deepEqual(filters.sort(), ["highpass", "lowpass", "lowpass"]);
  assert.ok(connections.some(([, to]) => to === "destination"), "el master llega a la salida");
});

test("update() no produce NaN ni desborda con dt grandes", () => {
  const { Ctx, scheduled } = stubAudio();
  const rain = createRainAudio({ AudioContextCtor: Ctx });
  rain.start();
  for (let i = 0; i < 240; i++) {
    rain.context.currentTime += 1 / 60;
    rain.update(1 / 60, globalWind(i / 60), 2);
  }
  // un frame patológico (pestaña que vuelve del fondo)
  rain.update(4, globalWind(9), 2);
  for (const [, , value] of scheduled) {
    assert.ok(Number.isFinite(value), "ningún parámetro puede quedar en NaN");
  }
});

test("un dt enorme no dispara cientos de gotas de golpe", () => {
  const { Ctx, created } = stubAudio();
  const rain = createRainAudio({ AudioContextCtor: Ctx });
  rain.start();
  const before = created.filter((n) => n.type_ === "panner").length;
  rain.update(30, 0, 2);   // 30 segundos en un frame
  const after = created.filter((n) => n.type_ === "panner").length;
  assert.ok(after - before <= 12, `el guard debe limitar la ráfaga, creó ${after - before}`);
});

test("stop() baja el master a cero sin romper el contexto", () => {
  const { Ctx, scheduled } = stubAudio();
  const rain = createRainAudio({ AudioContextCtor: Ctx });
  rain.start();
  rain.stop();
  assert.equal(rain.running, false);
  const lastGain = [...scheduled].reverse().find(([name]) => name === "gain");
  assert.equal(lastGain[2], 0, "el último destino del master debe ser silencio");
  assert.ok(rain.context, "no se cierra el contexto: reanudar debe ser instantáneo");
});

test("setVolume acota: no se puede subir sin querer a niveles agresivos", () => {
  const { Ctx } = stubAudio();
  const rain = createRainAudio({ AudioContextCtor: Ctx });
  assert.equal(rain.setVolume(5), 0.3, "techo duro");
  assert.equal(rain.setVolume(-1), 0, "suelo duro");
});
