// 5 etapo "Mados šou" (Vingio estrada) laikini paveikslėliai, nupiešti kodu.
// Kiekvieną galima pakeisti tikru PNG per assets/manifest.json (tas pats raktas).

const OUT = '#14081f';

function tex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, w, h);
  const ctx = t.getContext();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx, w, h);
  t.refresh();
}

function shape(ctx, path, fill, lw = 6, stroke = OUT) {
  ctx.beginPath();
  path(ctx);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}

function rr(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// Podiumo geometrija (ją naudoja ir scena): u = 0 - scenoje, u = 1 - podiumo gale prie žiūrovų.
export const RUNWAY = { cx: 960, y0: 458, y1: 905, hw0: 110, hw1: 380 };
export const runwayY = (u) => RUNWAY.y0 + (RUNWAY.y1 - RUNWAY.y0) * u;
export const runwayHW = (u) => RUNWAY.hw0 + (RUNWAY.hw1 - RUNWAY.hw0) * u;

const PINK = '#ff3ea5';
const TEAL = '#2de2e6';
const SKIN = '#f5c9a6';

// Adriana iš priekio (podiumo suknelė, žieminiai batai). Galva - atskirai.
// legs: [[klubas x, pėda x, pėda y], ...], arms: [[petys x, alkūnė x, y, ranka x, y], ...]
function adrFront(c, { legs, arms }) {
  // kojos (pėdkelnės) ir balti batai
  for (const [hx, fx, fy] of legs) {
    c.lineWidth = 24; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(hx, 170); c.lineTo(fx, fy - 16); c.stroke();
    c.lineWidth = 14; c.strokeStyle = '#26306b';
    c.beginPath(); c.moveTo(hx, 170); c.lineTo(fx, fy - 16); c.stroke();
    shape(c, (x) => rr(x, fx - 15, fy - 30, 30, 30, 9), '#ffffff', 5);
    shape(c, (x) => rr(x, fx - 16, fy - 32, 32, 9, 4), TEAL, 3);
  }
  // rankos
  for (const [sx, ex, ey, hx, hy] of arms) {
    c.lineWidth = 22; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(sx, 58); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
    c.lineWidth = 13; c.strokeStyle = PINK;
    c.beginPath(); c.moveTo(sx, 58); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
    shape(c, (x) => x.arc(hx, hy, 10, 0, Math.PI * 2), TEAL, 5);
  }
  // liemuo
  shape(c, (x) => rr(x, 64, 46, 52, 60, 16), PINK);
  // suknelė su snaigėmis
  shape(c, (x) => { x.moveTo(62, 104); x.lineTo(118, 104); x.lineTo(140, 168); x.lineTo(40, 168); x.closePath(); }, PINK);
  c.strokeStyle = '#ffffff'; c.lineWidth = 2.5;
  for (const [sx, sy] of [[70, 122], [104, 128], [86, 148], [60, 156], [120, 154]]) {
    for (let a = 0; a < 3; a++) {
      const ang = (a * Math.PI) / 3;
      c.beginPath(); c.moveTo(sx - Math.cos(ang) * 6, sy - Math.sin(ang) * 6); c.lineTo(sx + Math.cos(ang) * 6, sy + Math.sin(ang) * 6); c.stroke();
    }
  }
  // kailiukas apačioje ir diržas
  shape(c, (x) => rr(x, 38, 162, 104, 16, 8), '#ffffff', 5);
  shape(c, (x) => rr(x, 62, 98, 56, 11, 5), TEAL, 4);
  // kailinė apykaklė
  shape(c, (x) => x.ellipse(90, 50, 32, 12, 0, 0, Math.PI * 2), '#ffffff', 5);
}

// Adriana iš nugaros: be veido detalių, su kaspinu ant nugaros.
function adrBack(c, { legs, arms }) {
  for (const [hx, fx, fy] of legs) {
    c.lineWidth = 24; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(hx, 170); c.lineTo(fx, fy - 16); c.stroke();
    c.lineWidth = 14; c.strokeStyle = '#26306b';
    c.beginPath(); c.moveTo(hx, 170); c.lineTo(fx, fy - 16); c.stroke();
    shape(c, (x) => rr(x, fx - 15, fy - 26, 30, 26, 9), '#ffffff', 5);
  }
  for (const [sx, ex, ey, hx, hy] of arms) {
    c.lineWidth = 22; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(sx, 58); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
    c.lineWidth = 13; c.strokeStyle = PINK;
    c.beginPath(); c.moveTo(sx, 58); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
    shape(c, (x) => x.arc(hx, hy, 10, 0, Math.PI * 2), TEAL, 5);
  }
  shape(c, (x) => rr(x, 64, 46, 52, 60, 16), PINK);
  shape(c, (x) => { x.moveTo(62, 104); x.lineTo(118, 104); x.lineTo(140, 168); x.lineTo(40, 168); x.closePath(); }, PINK);
  shape(c, (x) => rr(x, 38, 162, 104, 16, 8), '#ffffff', 5);
  shape(c, (x) => rr(x, 62, 98, 56, 11, 5), TEAL, 4);
  // kaspinas
  shape(c, (x) => { x.moveTo(90, 104); x.lineTo(66, 92); x.lineTo(66, 118); x.closePath(); }, TEAL, 4);
  shape(c, (x) => { x.moveTo(90, 104); x.lineTo(114, 92); x.lineTo(114, 118); x.closePath(); }, TEAL, 4);
  shape(c, (x) => x.arc(90, 104, 7, 0, Math.PI * 2), '#ffffff', 3);
  shape(c, (x) => x.ellipse(90, 50, 32, 12, 0, 0, Math.PI * 2), '#ffffff', 5);
}

export function generateShowArt(scene) {
  // ---------- fonas: Vingio estrada žiemos vakarą, podiumas ----------
  tex(scene, 'show_bg', 1920, 1080, (c) => {
    const rnd = seeded(55);
    const sky = c.createLinearGradient(0, 0, 0, 470);
    sky.addColorStop(0, '#0b0420');
    sky.addColorStop(1, '#3b1c6a');
    c.fillStyle = sky;
    c.fillRect(0, 0, 1920, 470);
    for (let i = 0; i < 140; i++) {
      c.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.6})`;
      c.beginPath(); c.arc(rnd() * 1920, rnd() * 380, 0.8 + rnd() * 1.8, 0, Math.PI * 2); c.fill();
    }
    // TV bokštas tolumoje
    c.fillStyle = '#20113f';
    c.fillRect(1702, 150, 8, 300);
    c.beginPath(); c.ellipse(1706, 250, 24, 10, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff3a6a'; c.fillRect(1703, 136, 6, 14);
    // Vingio parko pušys
    const pine = (x, base, h, col) => {
      c.fillStyle = col;
      for (let k = 0; k < 3; k++) {
        const w = h * (0.42 - k * 0.09);
        const top = base - h + k * h * 0.22;
        c.beginPath(); c.moveTo(x, top); c.lineTo(x + w, top + h * 0.5); c.lineTo(x - w, top + h * 0.5); c.closePath(); c.fill();
      }
      c.fillRect(x - 4, base - h * 0.12, 8, h * 0.14);
    };
    for (let x = -20; x < 1960; x += 34 + rnd() * 30) {
      if (x > 560 && x < 1360) continue;
      pine(x, 470, 120 + rnd() * 90, '#1b0f36');
    }
    for (let x = 0; x < 1960; x += 60 + rnd() * 50) {
      if (x > 520 && x < 1400) continue;
      pine(x, 480, 80 + rnd() * 70, '#24154a');
    }
    // sniegas (žemė)
    const g = c.createLinearGradient(0, 440, 0, 1080);
    g.addColorStop(0, '#4b3d8f');
    g.addColorStop(1, '#251852');
    c.fillStyle = g;
    c.fillRect(0, 440, 1920, 640);
    for (let i = 0; i < 420; i++) {
      c.fillStyle = `rgba(255,255,255,${0.15 + rnd() * 0.35})`;
      c.beginPath(); c.arc(rnd() * 1920, 450 + rnd() * 630, 0.8 + rnd() * 1.6, 0, Math.PI * 2); c.fill();
    }
    // estrados "kriauklė"
    const cx = 960;
    const base = 452;
    const shell = c.createLinearGradient(0, 180, 0, base);
    shell.addColorStop(0, '#ffffff');
    shell.addColorStop(1, '#c9bff0');
    shape(c, (x) => x.ellipse(cx, base, 400, 272, 0, Math.PI, 0), shell, 7);
    shape(c, (x) => x.ellipse(cx, base, 326, 214, 0, Math.PI, 0), '#2a1850', 5);
    c.strokeStyle = 'rgba(201,191,240,.55)'; c.lineWidth = 3;
    for (let a = 1; a < 10; a++) {
      const ang = Math.PI + (a * Math.PI) / 10;
      c.beginPath();
      c.moveTo(cx + Math.cos(ang) * 330, base + Math.sin(ang) * 216);
      c.lineTo(cx + Math.cos(ang) * 396, base + Math.sin(ang) * 268);
      c.stroke();
    }
    // vidaus šviesos ruožai
    for (let a = 1; a < 8; a++) {
      const ang = Math.PI + (a * Math.PI) / 8;
      c.strokeStyle = 'rgba(255,62,165,.12)'; c.lineWidth = 18;
      c.beginPath(); c.moveTo(cx, base); c.lineTo(cx + Math.cos(ang) * 320, base + Math.sin(ang) * 210); c.stroke();
    }
    // girlianda ant krašto
    const cols = ['#ffd23f', PINK, TEAL, '#ffffff', '#3ddc84'];
    for (let i = 0; i <= 40; i++) {
      const ang = Math.PI + (i * Math.PI) / 40;
      c.fillStyle = cols[i % cols.length];
      c.beginPath(); c.arc(cx + Math.cos(ang) * 400, base + Math.sin(ang) * 272, 6, 0, Math.PI * 2); c.fill();
    }
    // scenos grindys
    shape(c, (x) => rr(x, 580, base - 6, 760, 26, 6), '#3b2a6e', 5);
    // eglutė scenoje
    c.fillStyle = '#16402f';
    c.beginPath(); c.moveTo(700, base - 4); c.lineTo(750, base - 190); c.lineTo(800, base - 4); c.fill();
    for (let i = 0; i < 18; i++) {
      const t = rnd();
      c.fillStyle = cols[i % cols.length];
      c.beginPath(); c.arc(750 + (rnd() * 2 - 1) * (1 - t) * 44, base - 16 - t * 160, 4, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#ffd23f';
    c.beginPath(); c.arc(750, base - 196, 9, 0, Math.PI * 2); c.fill();
    // podiumas
    const { y0, y1, hw0, hw1 } = RUNWAY;
    shape(c, (x) => { x.moveTo(cx - hw1, y1); x.lineTo(cx + hw1, y1); x.lineTo(cx + hw1, y1 + 34); x.lineTo(cx - hw1, y1 + 34); x.closePath(); }, '#c22d82', 5);
    const rg = c.createLinearGradient(0, y0, 0, y1);
    rg.addColorStop(0, '#ffe3f4');
    rg.addColorStop(1, '#fff7fc');
    shape(c, (x) => { x.moveTo(cx - hw0, y0); x.lineTo(cx + hw0, y0); x.lineTo(cx + hw1, y1); x.lineTo(cx - hw1, y1); x.closePath(); }, rg, 6);
    c.strokeStyle = 'rgba(255,62,165,.35)'; c.lineWidth = 4;
    c.setLineDash([22, 18]);
    c.beginPath(); c.moveTo(cx, y0 + 8); c.lineTo(cx, y1 - 6); c.stroke();
    c.setLineDash([]);
    // sniego kauburėliai palei podiumą
    c.fillStyle = 'rgba(244,247,255,.9)';
    for (let i = 0; i <= 22; i++) {
      const u = i / 22;
      const y = y0 + (y1 - y0) * u;
      const hw = hw0 + (hw1 - hw0) * u;
      const r = 8 + u * 14;
      for (const side of [-1, 1]) {
        c.beginPath(); c.arc(cx + side * (hw + r * 0.8), y + 4, r, Math.PI, 0); c.fill();
      }
    }
  });

  // ---------- Adriana podiume ----------
  tex(scene, 'adr_walk_a', 180, 240, (c) => adrFront(c, {
    legs: [[78, 74, 238], [102, 108, 226]],
    arms: [[64, 46, 86, 50, 118], [116, 132, 82, 126, 110]],
  }));
  tex(scene, 'adr_walk_b', 180, 240, (c) => adrFront(c, {
    legs: [[78, 72, 226], [102, 106, 238]],
    arms: [[64, 48, 82, 54, 110], [116, 134, 86, 130, 118]],
  }));
  tex(scene, 'adr_pose', 180, 240, (c) => adrFront(c, {
    legs: [[80, 80, 238], [100, 126, 234]],
    arms: [[64, 36, 84, 64, 104], [116, 142, 32, 150, 6]],
  }));
  tex(scene, 'adr_back_a', 180, 240, (c) => adrBack(c, {
    legs: [[78, 74, 238], [102, 108, 228]],
    arms: [[64, 48, 86, 52, 116], [116, 132, 84, 128, 110]],
  }));
  tex(scene, 'adr_back_b', 180, 240, (c) => adrBack(c, {
    legs: [[78, 72, 228], [102, 106, 238]],
    arms: [[64, 48, 84, 52, 110], [116, 132, 86, 128, 116]],
  }));
  // galva iš nugaros (plaukai ir kepurė)
  tex(scene, 'adr_head_back', 150, 150, (c) => {
    shape(c, (x) => { x.moveTo(26, 80); x.quadraticCurveTo(16, 146, 60, 148); x.lineTo(96, 148); x.quadraticCurveTo(138, 146, 126, 80); x.closePath(); }, '#5a3420');
    shape(c, (x) => x.arc(76, 84, 48, 0, Math.PI * 2), '#5a3420');
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 3;
    for (const dx of [-18, 0, 18]) { c.beginPath(); c.moveTo(76 + dx, 70); c.quadraticCurveTo(76 + dx * 1.3, 110, 76 + dx * 1.1, 144); c.stroke(); }
    shape(c, (x) => { x.moveTo(26, 66); x.quadraticCurveTo(76, 0, 126, 66); x.closePath(); }, TEAL);
    shape(c, (x) => rr(x, 22, 56, 108, 20, 9), PINK, 5);
    shape(c, (x) => x.arc(76, 14, 13, 0, Math.PI * 2), '#ffffff', 5);
  });

  // ---------- komisijos stalas ----------
  tex(scene, 'jury_table', 340, 150, (c) => {
    shape(c, (x) => rr(x, 14, 30, 312, 112, 10), PINK);
    shape(c, (x) => rr(x, 4, 18, 332, 22, 8), '#ffffff', 5);
    c.fillStyle = '#ffffff';
    c.font = 'bold 40px Anton, Impact, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('KOMISIJA', 170, 92);
    // taurė ir lapai
    shape(c, (x) => rr(x, 250, 0, 40, 22, 4), '#ffffff', 3);
    shape(c, (x) => { x.moveTo(52, 20); x.lineTo(74, 20); x.lineTo(70, 0); x.lineTo(56, 0); x.closePath(); }, '#ffd23f', 3);
  });
  // balo kortelė
  tex(scene, 'score_card', 170, 200, (c) => {
    c.lineWidth = 12; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(85, 110); c.lineTo(85, 196); c.stroke();
    c.lineWidth = 6; c.strokeStyle = '#a8703f';
    c.beginPath(); c.moveTo(85, 110); c.lineTo(85, 194); c.stroke();
    shape(c, (x) => rr(x, 6, 6, 158, 112, 14), '#ffffff', 6);
    shape(c, (x) => rr(x, 14, 14, 142, 96, 10), null, 4, '#ffd23f');
  });
  // fotoaparato blykstė
  tex(scene, 'flash', 128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 2, 64, 64, 60);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(255,250,210,.8)');
    g.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    c.fillStyle = '#ffffff';
    c.beginPath(); c.moveTo(64, 2); c.lineTo(70, 58); c.lineTo(126, 64); c.lineTo(70, 70); c.lineTo(64, 126); c.lineTo(58, 70); c.lineTo(2, 64); c.lineTo(58, 58); c.closePath(); c.fill();
  });
  // vėjo gūsis
  tex(scene, 'wind_puff', 160, 70, (c) => {
    c.strokeStyle = 'rgba(255,255,255,.95)';
    for (const [y, w] of [[18, 120], [36, 150], [54, 100]]) {
      c.lineWidth = 6;
      c.beginPath(); c.moveTo(6, y); c.lineTo(w - 20, y); c.quadraticCurveTo(w, y, w - 6, y - 12); c.stroke();
    }
  });
  // sniego debesėlis
  tex(scene, 'snow_puff', 140, 90, (c) => {
    for (const [x, y, r] of [[40, 52, 26], [70, 38, 30], [100, 52, 26], [70, 62, 24], [24, 64, 14], [120, 64, 14]]) {
      shape(c, (p) => p.arc(x, y, r, 0, Math.PI * 2), '#f4f7ff', 3, '#b9c3ef');
    }
  });
  // švytintis pėdsakas podiume
  tex(scene, 'footprint', 44, 70, (c) => {
    c.fillStyle = '#ffffff';
    c.beginPath(); c.ellipse(22, 22, 15, 20, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(22, 56, 11, 12, 0, 0, Math.PI * 2); c.fill();
  });
}
