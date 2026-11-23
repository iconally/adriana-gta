// Paprasti garso efektai, sugeneruoti naršyklėje (failų nereikia).
// Naršyklė leidžia garsą tik po pirmo paspaudimo - todėl unlock().

let ctx = null;
let master = null;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
  return ctx;
}

function tone(freq, dur, { type = 'square', vol = 0.25, slide = 0, delay = 0 } = {}) {
  const c = ensure();
  if (!c || c.state !== 'running') return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(dur, { vol = 0.3, freq = 1200, delay = 0 } = {}) {
  const c = ensure();
  if (!c || c.state !== 'running') return;
  const t = c.currentTime + delay;
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

// Nuolatinis mažylio verksmas: "uaaa" bangomis. Garsumas ir aukštis priklauso
// nuo level (0 - tylu, 1 - garsiausiai). Kuo didesnis level, tuo ilgesni ir
// garsesni "uaaa", o pauzės įkvėpti trumpesnės.
export class CryVoice {
  constructor(c, base, dest = master) {
    this.c = c;
    this.base = base;
    this.level = 0;
    this.burstLevel = 0;
    this.nextAt = 0;
    this.osc = c.createOscillator();
    this.osc.type = 'sawtooth';
    this.osc.frequency.value = base;
    // drebėjimas balse
    this.vib = c.createOscillator();
    this.vib.frequency.value = 6.5;
    this.vibGain = c.createGain();
    this.vibGain.gain.value = base * 0.025;
    this.vib.connect(this.vibGain).connect(this.osc.frequency);
    // "a" garso formantės
    this.f1 = c.createBiquadFilter();
    this.f1.type = 'bandpass';
    this.f1.frequency.value = 1000;
    this.f1.Q.value = 3;
    this.f2 = c.createBiquadFilter();
    this.f2.type = 'bandpass';
    this.f2.frequency.value = 1600;
    this.f2.Q.value = 4;
    this.dry = c.createBiquadFilter();
    this.dry.type = 'lowpass';
    this.dry.frequency.value = 2400;
    this.dryGain = c.createGain();
    this.dryGain.gain.value = 0.45;
    this.env = c.createGain();
    this.env.gain.value = 0.0001;
    this.osc.connect(this.f1).connect(this.env);
    this.osc.connect(this.f2).connect(this.env);
    this.osc.connect(this.dry).connect(this.dryGain).connect(this.env);
    this.env.connect(dest);
    this.osc.start();
    this.vib.start();
  }

  // Kviečiama dažnai (kiekviename kadre); naujas "uaaa" pradedamas, kai baigiasi senas,
  // arba iškart, jei verksmas staiga sustiprėjo (pvz. po "BŪ!").
  update(level) {
    const c = this.c;
    const now = c.currentTime;
    this.level = Math.max(0, Math.min(1, level));
    if (this.level < 0.02) {
      if (this.burstLevel > 0) {
        this.env.gain.cancelScheduledValues(now);
        this.env.gain.setTargetAtTime(0.0001, now, 0.08);
        this.burstLevel = 0;
        this.nextAt = now + 0.3;
      }
      return;
    }
    const jump = this.level - this.burstLevel > 0.22;
    if (now < this.nextAt && !jump) return;
    const L = this.level;
    const t = now + 0.02;
    const dur = 0.45 + 0.75 * L + Math.random() * 0.25;
    const gap = 0.45 - 0.3 * L + Math.random() * 0.15;
    const peak = (0.1 + 0.35 * L) * 1.3; // garsiau nei kiti efektai - verksmas svarbiausias
    const f0 = this.base * (1 + 0.3 * L) * (0.95 + Math.random() * 0.1);
    const fr = this.osc.frequency;
    fr.cancelScheduledValues(t);
    fr.setValueAtTime(f0 * 0.8, t);
    fr.linearRampToValueAtTime(f0 * 1.12, t + dur * 0.3);
    fr.linearRampToValueAtTime(f0 * 0.78, t + dur);
    const f1 = this.f1.frequency;
    f1.cancelScheduledValues(t);
    f1.setValueAtTime(650, t);
    f1.linearRampToValueAtTime(1150, t + 0.12);
    f1.linearRampToValueAtTime(900, t + dur);
    const g = this.env.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(0.0001, g.value), t);
    g.linearRampToValueAtTime(peak, t + 0.07);
    g.linearRampToValueAtTime(peak * 0.75, t + dur * 0.8);
    g.linearRampToValueAtTime(0.0001, t + dur);
    this.burstLevel = L;
    this.nextAt = t + dur + gap;
  }

  stop() {
    const now = this.c.currentTime;
    this.env.gain.cancelScheduledValues(now);
    this.env.gain.setTargetAtTime(0.0001, now, 0.05);
    this.osc.stop(now + 0.4);
    this.vib.stop(now + 0.4);
  }
}

export const sfx = {
  unlock() {
    const c = ensure();
    if (c && c.state !== 'running') c.resume();
    return c?.state === 'running';
  },
  get ready() { return ctx?.state === 'running'; },
  // Garso laikrodis (s) - muzikos taktams; null, jei garsas neįjungtas.
  clock() { return ctx?.state === 'running' ? ctx.currentTime : null; },
  latency() { return ctx ? (ctx.outputLatency || ctx.baseLatency || 0) : 0; },
  // 5 etapo podiumo muzika: kiekvienas garsas suplanuojamas tiksliu laiku t (garso laikrodžiu).
  music: {
    kick(t) { tone(130, 0.2, { type: 'sine', vol: 0.42, slide: -85, delay: Math.max(0, t - ctx.currentTime) }); },
    snare(t) { noise(0.14, { vol: 0.2, freq: 2600, delay: Math.max(0, t - ctx.currentTime) }); },
    hat(t) { noise(0.035, { vol: 0.06, freq: 9000, delay: Math.max(0, t - ctx.currentTime) }); },
    bass(f, t, dur) { tone(f, dur, { type: 'triangle', vol: 0.2, delay: Math.max(0, t - ctx.currentTime) }); },
    bell(f, t) {
      const d = Math.max(0, t - ctx.currentTime);
      tone(f, 0.25, { type: 'triangle', vol: 0.06, delay: d });
      noise(0.08, { vol: 0.05, freq: 7000, delay: d });
    },
  },
  shutter() { tone(2400, 0.02, { type: 'square', vol: 0.06 }); noise(0.05, { vol: 0.12, freq: 5000, delay: 0.02 }); },
  clap() { noise(0.05, { vol: 0.14, freq: 3200 }); noise(0.05, { vol: 0.1, freq: 2600, delay: 0.06 }); },
  whoosh() { noise(0.6, { vol: 0.12, freq: 700 }); tone(300, 0.5, { type: 'sine', vol: 0.04, slide: 200 }); },
  snowPuff() { noise(0.35, { vol: 0.14, freq: 3500 }); },
  ooo() { tone(330, 0.6, { type: 'triangle', vol: 0.12, slide: -120 }); tone(415, 0.6, { type: 'triangle', vol: 0.08, slide: -150 }); },
  // 6 etapas: koncertas
  piano(f, delay = 0) {
    tone(f, 0.9, { type: 'triangle', vol: 0.22, delay });
    tone(f * 2, 0.45, { type: 'sine', vol: 0.05, delay });
    tone(f / 2, 0.6, { type: 'sine', vol: 0.05, delay });
  },
  plunk() { tone(110, 0.45, { type: 'sawtooth', vol: 0.12, slide: -25 }); tone(117, 0.45, { type: 'sawtooth', vol: 0.1, slide: -25 }); },
  instrument(kind, f) {
    if (kind === 'varpeliai') { tone(f * 2, 0.5, { type: 'triangle', vol: 0.06 }); tone(f * 3, 0.3, { type: 'sine', vol: 0.03 }); noise(0.05, { vol: 0.03, freq: 8000 }); }
    else if (kind === 'smuikai') { tone(f, 0.4, { type: 'sawtooth', vol: 0.04, slide: 5 }); tone(f * 1.003, 0.4, { type: 'sawtooth', vol: 0.03 }); }
    else if (kind === 'bugnai') { tone(115, 0.18, { type: 'sine', vol: 0.3, slide: -60 }); noise(0.1, { vol: 0.12, freq: 1500 }); }
    else if (kind === 'trimitai') { tone(f, 0.26, { type: 'square', vol: 0.045 }); tone(f * 2, 0.2, { type: 'square', vol: 0.015 }); }
  },
  sour() { const f = 160 + Math.random() * 120; tone(f, 0.32, { type: 'sawtooth', vol: 0.06, slide: -70 }); tone(f * 1.07, 0.32, { type: 'sawtooth', vol: 0.05, slide: -80 }); },
  bravo() { for (let i = 0; i < 16; i++) noise(0.05, { vol: 0.1 + Math.random() * 0.06, freq: 2400 + Math.random() * 1500, delay: i * 0.07 + Math.random() * 0.03 }); },
  pop() { tone(660, 0.08, { type: 'sine', vol: 0.2, slide: 400 }); },
  hello() { tone(523, 0.08, { type: 'triangle', vol: 0.15 }); tone(784, 0.1, { type: 'triangle', vol: 0.15, delay: 0.07 }); },
  jump() { tone(300, 0.18, { type: 'square', vol: 0.12, slide: 500 }); },
  hit() { tone(160, 0.25, { type: 'sawtooth', vol: 0.18, slide: -90 }); noise(0.12, { vol: 0.2, freq: 500 }); },
  throw() { noise(0.12, { vol: 0.12, freq: 2500 }); },
  splat() { noise(0.18, { vol: 0.25, freq: 900 }); },
  tick() { tone(1200, 0.04, { type: 'square', vol: 0.08 }); },
  pok() { tone(560, 0.07, { type: 'sine', vol: 0.25, slide: -260 }); noise(0.04, { vol: 0.14, freq: 1800 }); },
  plus() { tone(880, 0.07, { type: 'triangle', vol: 0.18 }); tone(1320, 0.1, { type: 'triangle', vol: 0.18, delay: 0.06 }); },
  horn() { tone(330, 0.35, { type: 'sawtooth', vol: 0.12 }); tone(415, 0.35, { type: 'sawtooth', vol: 0.1 }); },
  count() { tone(440, 0.15, { type: 'square', vol: 0.15 }); },
  go() { tone(880, 0.3, { type: 'square', vol: 0.15 }); },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, { type: 'square', vol: 0.12, delay: i * 0.11 }));
    tone(1046, 0.6, { type: 'triangle', vol: 0.15, delay: 0.44 });
  },
  // 1 etapas: broliukai
  cryVoice(base = 450) {
    const c = ensure();
    if (!c || c.state !== 'running') return null;
    return new CryVoice(c, base);
  },
  cry() { tone(520, 0.5, { type: 'sawtooth', vol: 0.07, slide: 160 }); tone(680, 0.45, { type: 'sawtooth', vol: 0.06, slide: -220, delay: 0.42 }); },
  boo() { tone(110, 0.45, { type: 'sawtooth', vol: 0.16, slide: -50 }); noise(0.3, { vol: 0.15, freq: 300 }); },
  howl() { tone(380, 0.35, { type: 'sine', vol: 0.14, slide: 260 }); tone(640, 0.6, { type: 'sine', vol: 0.12, slide: -300, delay: 0.32 }); },
  bell() { tone(988, 0.35, { type: 'sine', vol: 0.2 }); tone(784, 0.55, { type: 'sine', vol: 0.2, delay: 0.3 }); },
  click() { tone(1800, 0.03, { type: 'square', vol: 0.12 }); noise(0.04, { vol: 0.1, freq: 3000 }); },
  rustle() { noise(0.35, { vol: 0.12, freq: 1800 }); },
  jingle() { [1319, 1319, 988].forEach((f, i) => tone(f, i === 2 ? 0.4 : 0.16, { type: 'sine', vol: 0.09, delay: i * 0.17 })); },
  shh() { noise(0.55, { vol: 0.05, freq: 4200 }); },
  lullaby() { [659, 587, 523].forEach((f, i) => tone(f, 0.28, { type: 'sine', vol: 0.1, delay: i * 0.22 })); },
  twinkle() { [1319, 1568, 1760, 2093].forEach((f, i) => tone(f, 0.12, { type: 'triangle', vol: 0.07, delay: i * 0.07 })); },
  miracle() { [523, 659, 784, 1046, 1319].forEach((f, i) => tone(f, 0.5, { type: 'sine', vol: 0.12, delay: i * 0.12 })); },
  // 2 etapas: laiptai
  step() { tone(220 + Math.random() * 40, 0.05, { type: 'triangle', vol: 0.12 }); noise(0.04, { vol: 0.08, freq: 700 }); },
  thud() { tone(140, 0.16, { type: 'sine', vol: 0.25, slide: -60 }); noise(0.1, { vol: 0.18, freq: 400 }); },
  whistle() { tone(2100, 0.5, { type: 'sine', vol: 0.12, slide: 120 }); tone(2300, 0.5, { type: 'sine', vol: 0.06, slide: 120 }); },
  // mokyklos skambutis "dzin dzin": du trumpi skambėjimai (urgent - garsiau ir ilgiau)
  dzin(urgent = false) {
    const n = urgent ? 12 : 8;
    for (const start of [0, n * 0.045 + 0.15]) {
      for (let i = 0; i < n; i++) {
        tone(1320, 0.04, { type: 'square', vol: urgent ? 0.09 : 0.07, delay: start + i * 0.045 });
        tone(1760, 0.035, { type: 'triangle', vol: 0.05, delay: start + i * 0.045 + 0.01 });
      }
    }
  },
  schoolBell() { for (let i = 0; i < 14; i++) tone(1250, 0.06, { type: 'square', vol: 0.07, delay: i * 0.07 }); },
  fail() { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.25, { type: 'triangle', vol: 0.15, delay: i * 0.16 })); },
};
