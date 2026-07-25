/**
 * Lluvia sintetizada con Web Audio.
 *
 * Sin archivo de audio: un mp3 de lluvia son 300–800 KB, se nota el bucle a los
 * 20 s y no puede reaccionar a nada. Sintetizada pesa 0 KB, no tiene bucle
 * audible, y —lo importante— **respira con la misma curva de viento que la
 * imagen**: cuando la racha inclina las gotas en pantalla, el filtro se abre y
 * el sonido se acerca. Ese acople es lo que hace que se lea como un solo
 * fenómeno y no como una pista de fondo.
 *
 * Tres capas:
 *   1. garúa   — ruido filtrado en agudos: la textura fina, el "shhh"
 *   2. cuerpo  — ruido en graves: el peso, la lluvia lejana contra el bosque
 *   3. gotas   — transitorios cortos con paneo aleatorio. Sin esta capa el
 *                oído lo clasifica como estática; con ella, como agua.
 *
 * El contexto se construye por inyección para poder verificar el grafo en Node.
 */

export const AUDIO = {
  baseVolume: 0.055,        // "levemente": techo bajo a propósito
  fadeSeconds: 2.4,
  hissHighpass: 900,
  // Techo de agudos más bajo: por encima de ~3.5 kHz la garúa deja de sonar a
  // agua y empieza a sonar a fritura. Ahí estaba la dureza.
  hissLowpassBase: 3300,
  hissLowpassPerWind: 9,
  hissLowpassRange: [1400, 5000],
  bodyLowpass: 420,
  hissGain: 0.40,
  bodyGain: 0.30,
  dropletsPerSecond: 19,
  dropletBand: [600, 3400],
  dropletDecay: [0.03, 0.13],
  dropletPeak: [0.09, 0.24],
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/** La racha abre el filtro: la lluvia "se acerca" cuando el viento aprieta. */
export function windToCutoff(wind) {
  const [min, max] = AUDIO.hissLowpassRange;
  return clamp(AUDIO.hissLowpassBase + wind * AUDIO.hissLowpassPerWind, min, max);
}

/** Misma perilla de intensidad que la imagen, para que no se desincronicen. */
export function intensityToGain(intensity, volume = AUDIO.baseVolume) {
  return volume * (0.55 + intensity * 0.45);
}

export function dropletRate(intensity) {
  return AUDIO.dropletsPerSecond * (0.5 + intensity * 0.6);
}

function makeNoiseBuffer(ctx, seconds = 3) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    // Ruido rosa aproximado (Voss-McCartney simplificado): el blanco puro
    // suena a estática de TV; la lluvia real tiene más energía en graves.
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.2965164;
      b2 = 0.57000 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.22;
    }
  }
  return buffer;
}

export function createRainAudio({ AudioContextCtor = globalThis.AudioContext } = {}) {
  let ctx = null;
  let master = null;
  let hissFilter = null;
  let bodyGain = null;
  let sources = [];
  let dropletAccumulator = 0;
  let volume = AUDIO.baseVolume;
  let running = false;

  function build() {
    ctx = new AudioContextCtor();
    const noise = makeNoiseBuffer(ctx);

    master = ctx.createGain();
    master.gain.value = 0;                       // siempre entra con fundido
    master.connect(ctx.destination);

    // 1 · garúa
    const hissSrc = ctx.createBufferSource();
    hissSrc.buffer = noise; hissSrc.loop = true;
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass"; highpass.frequency.value = AUDIO.hissHighpass;
    hissFilter = ctx.createBiquadFilter();
    hissFilter.type = "lowpass"; hissFilter.frequency.value = AUDIO.hissLowpassBase;
    const hissGain = ctx.createGain();
    hissGain.gain.value = AUDIO.hissGain;
    hissSrc.connect(highpass).connect(hissFilter).connect(hissGain).connect(master);

    // 2 · cuerpo
    const bodySrc = ctx.createBufferSource();
    bodySrc.buffer = noise; bodySrc.loop = true;
    bodySrc.playbackRate.value = 0.83;           // decorrela las dos capas
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = "lowpass"; bodyFilter.frequency.value = AUDIO.bodyLowpass;
    bodyGain = ctx.createGain();
    bodyGain.gain.value = AUDIO.bodyGain;
    bodySrc.connect(bodyFilter).connect(bodyGain).connect(master);

    sources = [hissSrc, bodySrc];
    for (const source of sources) source.start(0);
  }

  /** 3 · una gota: transitorio corto, banda aleatoria, paneo aleatorio. */
  function droplet(at) {
    const burst = ctx.createBufferSource();
    const length = Math.floor(ctx.sampleRate * 0.14);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    burst.buffer = buffer;

    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    const [lo, hi] = AUDIO.dropletBand;
    band.frequency.value = lo + Math.random() * (hi - lo);
    band.Q.value = 3 + Math.random() * 6;

    const env = ctx.createGain();
    const [dMin, dMax] = AUDIO.dropletDecay;
    const decay = dMin + Math.random() * (dMax - dMin);
    const [pMin, pMax] = AUDIO.dropletPeak;
    const peak = pMin + Math.random() * (pMax - pMin);
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(peak, at + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, at + decay);

    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.7 - 0.85;

    burst.connect(band).connect(env).connect(pan).connect(master);
    burst.start(at);
    burst.stop(at + decay + 0.02);
  }

  return {
    get running() { return running; },
    get context() { return ctx; },

    /** Debe llamarse desde un gesto del usuario (política de autoplay). */
    async start() {
      if (running) return;
      // El estado se fija ANTES del await: si el usuario pulsa S dos veces
      // rápido, el stop() no puede perder la carrera contra resume().
      running = true;
      if (!ctx) build();
      if (ctx.state === "suspended") await ctx.resume();
      if (!running) return;                       // stop() ganó mientras tanto
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(intensityToGain(1, volume), ctx.currentTime, AUDIO.fadeSeconds / 3);
    },

    stop() {
      running = false;
      if (!ctx) return;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    },

    setVolume(next) {
      volume = clamp(next, 0, 0.3);
      return volume;
    },
    get volume() { return volume; },

    /** Se llama cada frame desde el mismo bucle que dibuja. */
    update(dt, wind, intensity) {
      if (!running || !ctx) return;
      const t = ctx.currentTime;
      hissFilter.frequency.setTargetAtTime(windToCutoff(wind), t, 0.35);
      bodyGain.gain.setTargetAtTime(AUDIO.bodyGain * (0.7 + intensity * 0.3), t, 0.4);
      master.gain.setTargetAtTime(intensityToGain(intensity, volume), t, 0.3);

      dropletAccumulator += dropletRate(intensity) * dt;
      let guard = 0;
      while (dropletAccumulator >= 1 && guard++ < 12) {
        dropletAccumulator -= 1;
        droplet(t + Math.random() * 0.05);
      }
    },
  };
}
