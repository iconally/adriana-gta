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

export const sfx = {
  unlock() {
    const c = ensure();
    if (c && c.state !== 'running') c.resume();
    return c?.state === 'running';
  },
  get ready() { return ctx?.state === 'running'; },
  pop() { tone(660, 0.08, { type: 'sine', vol: 0.2, slide: 400 }); },
  hello() { tone(523, 0.08, { type: 'triangle', vol: 0.15 }); tone(784, 0.1, { type: 'triangle', vol: 0.15, delay: 0.07 }); },
  jump() { tone(300, 0.18, { type: 'square', vol: 0.12, slide: 500 }); },
  hit() { tone(160, 0.25, { type: 'sawtooth', vol: 0.18, slide: -90 }); noise(0.12, { vol: 0.2, freq: 500 }); },
  throw() { noise(0.12, { vol: 0.12, freq: 2500 }); },
  splat() { noise(0.18, { vol: 0.25, freq: 900 }); },
  tick() { tone(1200, 0.04, { type: 'square', vol: 0.08 }); },
  plus() { tone(880, 0.07, { type: 'triangle', vol: 0.18 }); tone(1320, 0.1, { type: 'triangle', vol: 0.18, delay: 0.06 }); },
  horn() { tone(330, 0.35, { type: 'sawtooth', vol: 0.12 }); tone(415, 0.35, { type: 'sawtooth', vol: 0.1 }); },
  count() { tone(440, 0.15, { type: 'square', vol: 0.15 }); },
  go() { tone(880, 0.3, { type: 'square', vol: 0.15 }); },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, { type: 'square', vol: 0.12, delay: i * 0.11 }));
    tone(1046, 0.6, { type: 'triangle', vol: 0.15, delay: 0.44 });
  },
  fail() { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.25, { type: 'triangle', vol: 0.15, delay: i * 0.16 })); },
};
