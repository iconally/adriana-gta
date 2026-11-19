// Laikini (placeholder) paveikslėliai, nupiešti kodu.
// Kai turėsit tikrus PNG, įrašykit juos į assets/manifest.json
// (raktas -> failas), ir šie piešiniai bus pakeisti automatiškai.

export const BUS_W = 760;
export const BUS_H = 320;
// Autobuso langai (avatarams) ir durys, koordinatės nuo autobuso kairio viršaus.
export const BUS_WINDOWS = [0, 1, 2, 3, 4].map((i) => ({ x: 52 + i * 96, y: 66, w: 82, h: 86 }));
export const BUS_DOOR = { x: 568, y: 66, w: 92, h: 196 };

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

export function generateArt(scene) {
  // ---------- dangus ir saulė ----------
  tex(scene, 'sky', 1920, 1080, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#160a33');
    g.addColorStop(0.32, '#4f1a86');
    g.addColorStop(0.58, '#d8307e');
    g.addColorStop(0.74, '#ff6f45');
    g.addColorStop(0.86, '#ffb45c');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    const rnd = seeded(7);
    c.fillStyle = 'rgba(255,255,255,.8)';
    for (let i = 0; i < 90; i++) {
      const x = rnd() * w;
      const y = rnd() * h * 0.35;
      c.globalAlpha = 0.3 + rnd() * 0.7;
      c.fillRect(x, y, 2 + rnd() * 2, 2 + rnd() * 2);
    }
    c.globalAlpha = 1;
  });

  tex(scene, 'sun', 440, 440, (c) => {
    const g = c.createLinearGradient(0, 20, 0, 420);
    g.addColorStop(0, '#fff07a');
    g.addColorStop(0.5, '#ffb03a');
    g.addColorStop(1, '#ff3ea5');
    c.fillStyle = g;
    c.beginPath(); c.arc(220, 220, 200, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 7; i++) {
      const y = 250 + i * 26;
      c.fillRect(0, y, 440, 4 + i * 2.2);
    }
    c.globalCompositeOperation = 'source-over';
  });

  // ---------- Vilniaus siluetas (kartojasi horizontaliai) ----------
  tex(scene, 'skyline', 1600, 420, (c, w, h) => {
    const base = '#2a0f45';
    const rnd = seeded(42);
    const win = (x, y, bw, bh) => {
      for (let yy = y + 14; yy < y + bh - 10; yy += 26) {
        for (let xx = x + 10; xx < x + bw - 12; xx += 22) {
          if (rnd() < 0.55) {
            c.fillStyle = rnd() < 0.8 ? '#ffcf6b' : '#ff7ad1';
            c.fillRect(xx, yy, 8, 11);
          }
        }
      }
    };
    c.fillStyle = base;
    // žemė per visą plotį, kad siūlė nesimatytų
    c.fillRect(0, h - 70, w, 70);
    // Gedimino kalnas ir pilis
    c.beginPath(); c.moveTo(120, h - 60); c.quadraticCurveTo(300, h - 230, 480, h - 60); c.fill();
    c.fillRect(268, h - 300, 70, 120);
    c.fillRect(262, h - 312, 82, 16);
    for (let i = 0; i < 4; i++) c.fillRect(262 + i * 22, h - 326, 12, 16);
    c.fillRect(300, h - 380, 4, 70);
    c.fillStyle = '#ffd23f'; c.fillRect(304, h - 380, 30, 7);
    c.fillStyle = '#2ea44f'; c.fillRect(304, h - 373, 30, 7);
    c.fillStyle = '#e2333a'; c.fillRect(304, h - 366, 30, 7);
    c.fillStyle = '#ffcf6b'; c.fillRect(290, h - 270, 10, 14); c.fillRect(312, h - 240, 10, 14);
    c.fillStyle = base;
    // Katedros varpinė
    c.fillRect(560, h - 300, 64, 240);
    c.fillRect(570, h - 350, 44, 50);
    c.beginPath(); c.moveTo(570, h - 350); c.lineTo(592, h - 410); c.lineTo(614, h - 350); c.fill();
    c.fillRect(590, h - 440, 4, 32);
    win(560, h - 290, 64, 200);
    c.fillStyle = base;
    // Senamiesčio namai
    const houses = [[640, 150, 120], [770, 120, 140], [920, 170, 110]];
    for (const [x, bh, bw] of houses) {
      c.fillRect(x, h - 60 - bh, bw, bh);
      c.beginPath(); c.moveTo(x - 8, h - 60 - bh); c.lineTo(x + bw / 2, h - 110 - bh); c.lineTo(x + bw + 8, h - 60 - bh); c.fill();
      win(x, h - 60 - bh, bw, bh);
      c.fillStyle = base;
    }
    // Šv. Onos bažnyčios bokšteliai
    const spire = (x, top, wdt) => {
      c.beginPath(); c.moveTo(x - wdt / 2, h - 60); c.lineTo(x - wdt / 2, h - top + 60); c.lineTo(x, h - top); c.lineTo(x + wdt / 2, h - top + 60); c.lineTo(x + wdt / 2, h - 60); c.fill();
    };
    spire(1080, 330, 46); spire(1040, 260, 34); spire(1120, 260, 34); spire(1010, 200, 24); spire(1150, 200, 24);
    // Kalėdų eglė
    c.fillStyle = '#16402f';
    c.beginPath(); c.moveTo(1230, h - 60); c.lineTo(1290, h - 290); c.lineTo(1350, h - 60); c.fill();
    for (let i = 0; i < 26; i++) {
      const t = rnd();
      const yy = h - 80 - t * 190;
      const half = (1 - t) * 52;
      c.fillStyle = ['#ffd23f', '#ff3ea5', '#2de2e6', '#ffffff'][i % 4];
      c.beginPath(); c.arc(1290 + (rnd() * 2 - 1) * half, yy, 3.5, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#ffd23f';
    c.beginPath(); c.arc(1290, h - 296, 8, 0, Math.PI * 2); c.fill();
    c.fillStyle = base;
    // Televizijos bokštas
    c.fillRect(1470, h - 400, 10, 340);
    c.beginPath(); c.ellipse(1475, h - 300, 34, 14, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff3a6a'; c.fillRect(1472, h - 410, 6, 12);
    c.fillStyle = base;
    c.fillRect(1400, h - 150, 60, 90); win(1400, h - 150, 60, 90);
    c.fillStyle = base;
    c.fillRect(1500, h - 120, 80, 60); win(1500, h - 120, 80, 60);
  });

  // ---------- šaligatvis ----------
  tex(scene, 'sidewalk', 256, 140, (c, w) => {
    c.fillStyle = '#4b3a6b';
    c.fillRect(0, 26, w, 114);
    c.fillStyle = '#3a2b57';
    for (let x = 0; x < w; x += 64) c.fillRect(x, 40, 4, 100);
    c.fillRect(0, 88, w, 4);
    c.fillStyle = '#5c4a80';
    c.fillRect(0, 26, w, 10);
    const g = c.createLinearGradient(0, 0, 0, 30);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#bfd2ff');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(0, 30);
    for (let x = 0; x <= w; x += 32) c.quadraticCurveTo(x + 16, 4 + (x % 64 ? 6 : 0), x + 32, 28);
    c.lineTo(w, 30); c.lineTo(0, 30); c.fill();
  });

  // ---------- Adrianos kūnas (galva atskirai) ----------
  const body = (key, pose) => tex(scene, key, 150, 200, (c) => {
    const legs = {
      run1: [[70, 112, 40, 150, 26, 186], [80, 112, 104, 146, 118, 178]],
      run2: [[70, 112, 98, 150, 112, 184], [80, 112, 58, 148, 34, 172]],
      jump: [[70, 112, 50, 140, 70, 168], [80, 112, 100, 138, 112, 160]],
    }[pose];
    // kuprinė
    shape(c, (x) => rr(x, 22, 38, 40, 62, 10), '#ffd23f');
    shape(c, (x) => rr(x, 26, 56, 32, 14, 5), '#ff9a3c', 4);
    // kojos
    for (const [hx, hy, kx, ky, fx, fy] of legs) {
      c.lineWidth = 26; c.strokeStyle = OUT;
      c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
      c.lineWidth = 16; c.strokeStyle = '#26306b';
      c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
      shape(c, (x) => rr(x, fx - 14, fy - 10, 32, 18, 7), '#ffffff', 5);
    }
    // striukė
    shape(c, (x) => rr(x, 46, 30, 62, 92, 18), '#ff3ea5');
    c.fillStyle = '#ff7ac4'; c.fillRect(54, 40, 10, 70);
    // šalikas
    shape(c, (x) => rr(x, 48, 24, 58, 18, 9), '#2de2e6', 5);
    shape(c, (x) => { x.moveTo(52, 34); x.lineTo(14, pose === 'jump' ? 22 : 40); x.lineTo(18, pose === 'jump' ? 34 : 54); x.lineTo(56, 44); x.closePath(); }, '#2de2e6', 5);
    // rankos
    const arms = pose === 'run1' ? [[100, 46, 128, 70, 140, 52]] : pose === 'run2' ? [[100, 46, 120, 84, 138, 96]] : [[100, 46, 126, 30, 138, 8]];
    for (const [sx, sy, ex, ey, hx, hy] of arms) {
      c.lineWidth = 22; c.strokeStyle = OUT;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
      c.lineWidth = 13; c.strokeStyle = '#ff3ea5';
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
      shape(c, (x) => x.arc(hx, hy, 10, 0, Math.PI * 2), '#2de2e6', 5);
    }
  });
  body('adr_run1', 'run1');
  body('adr_run2', 'run2');
  body('adr_jump', 'jump');

  // pritūpusi Adriana (išsisukinėja nuo gniūžčių)
  tex(scene, 'adr_duck', 150, 200, (c) => {
    shape(c, (x) => rr(x, 20, 84, 40, 58, 10), '#ffd23f');
    for (const [hx, hy, kx, ky, fx, fy] of [[66, 140, 100, 152, 74, 186], [84, 140, 118, 160, 112, 186]]) {
      c.lineWidth = 26; c.strokeStyle = OUT;
      c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
      c.lineWidth = 16; c.strokeStyle = '#26306b';
      c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
      shape(c, (x) => rr(x, fx - 14, fy - 10, 32, 18, 7), '#ffffff', 5);
    }
    shape(c, (x) => rr(x, 44, 68, 66, 80, 18), '#ff3ea5');
    shape(c, (x) => rr(x, 46, 62, 60, 18, 9), '#2de2e6', 5);
    for (const [sx, sy, ex, ey, hx, hy] of [[100, 84, 126, 108, 138, 92]]) {
      c.lineWidth = 22; c.strokeStyle = OUT;
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
      c.lineWidth = 13; c.strokeStyle = '#ff3ea5';
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx, hy); c.stroke();
      shape(c, (x) => x.arc(hx, hy, 10, 0, Math.PI * 2), '#2de2e6', 5);
    }
  });

  tex(scene, 'adr_head', 150, 150, (c) => {
    shape(c, (x) => { x.moveTo(30, 80); x.quadraticCurveTo(20, 140, 60, 142); x.lineTo(96, 142); x.quadraticCurveTo(132, 140, 122, 80); x.closePath(); }, '#5a3420');
    shape(c, (x) => x.arc(76, 84, 46, 0, Math.PI * 2), '#f5c9a6');
    c.fillStyle = '#5a3420';
    c.beginPath(); c.moveTo(32, 76); c.quadraticCurveTo(70, 96, 118, 70); c.lineTo(118, 58); c.lineTo(34, 58); c.fill();
    shape(c, (x) => { x.moveTo(26, 66); x.quadraticCurveTo(76, 0, 126, 66); x.closePath(); }, '#2de2e6');
    shape(c, (x) => rr(x, 22, 56, 108, 20, 9), '#ff3ea5', 5);
    shape(c, (x) => x.arc(76, 14, 13, 0, Math.PI * 2), '#ffffff', 5);
    c.fillStyle = OUT;
    c.beginPath(); c.arc(62, 90, 6, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(94, 90, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,90,140,.45)';
    c.beginPath(); c.arc(50, 104, 8, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(104, 104, 8, 0, Math.PI * 2); c.fill();
    c.lineWidth = 5; c.strokeStyle = OUT;
    c.beginPath(); c.arc(78, 104, 13, 0.2, Math.PI - 0.2); c.stroke();
  });

  // ---------- draugas (kliūtis), atspalvis keičiamas kode ----------
  tex(scene, 'kid_body', 120, 150, (c) => {
    for (const [x1, x2] of [[48, 40], [72, 82]]) {
      c.lineWidth = 24; c.strokeStyle = OUT;
      c.beginPath(); c.moveTo(x1, 96); c.lineTo(x2, 140); c.stroke();
      c.lineWidth = 14; c.strokeStyle = '#3b3b5c';
      c.beginPath(); c.moveTo(x1, 96); c.lineTo(x2, 140); c.stroke();
    }
    shape(c, (x) => rr(x, 30, 22, 60, 82, 18), '#f2f2f2');
    for (const [sx, ex, ey] of [[34, 10, 0], [86, 110, 0]]) {
      c.lineWidth = 20; c.strokeStyle = OUT;
      c.beginPath(); c.moveTo(sx, 34); c.lineTo(ex, ey + 8); c.stroke();
      c.lineWidth = 11; c.strokeStyle = '#f2f2f2';
      c.beginPath(); c.moveTo(sx, 34); c.lineTo(ex, ey + 8); c.stroke();
    }
  });

  // ---------- kliūtys ----------
  tex(scene, 'fence', 150, 124, (c) => {
    for (const x of [14, 66, 118]) shape(c, (p) => rr(p, x, 22, 18, 100, 4), '#8a5a33');
    shape(c, (p) => rr(p, 6, 46, 138, 16, 4), '#a8703f');
    shape(c, (p) => rr(p, 6, 84, 138, 16, 4), '#a8703f');
    c.fillStyle = '#ffffff';
    for (const x of [14, 66, 118]) { c.beginPath(); c.ellipse(x + 9, 22, 15, 8, 0, Math.PI, 0); c.fill(); }
    c.beginPath(); c.ellipse(75, 46, 70, 5, 0, Math.PI, 0); c.fill();
  });

  tex(scene, 'puddle', 210, 48, (c) => {
    shape(c, (p) => p.ellipse(105, 26, 98, 18, 0, 0, Math.PI * 2), '#2b6fa8', 5);
    c.fillStyle = '#6fc3ff';
    c.beginPath(); c.ellipse(105, 23, 84, 12, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.fillRect(60, 18, 34, 4); c.fillRect(120, 24, 22, 3);
  });

  tex(scene, 'snowpile', 186, 100, (c) => {
    shape(c, (p) => { p.moveTo(6, 96); p.quadraticCurveTo(30, 20, 80, 30); p.quadraticCurveTo(110, 0, 150, 34); p.quadraticCurveTo(184, 50, 180, 96); p.closePath(); }, '#f4f7ff');
    c.fillStyle = '#bfd2ff';
    c.beginPath(); c.moveTo(20, 94); c.quadraticCurveTo(70, 70, 176, 94); c.fill();
    c.lineWidth = 6; c.strokeStyle = '#5a3a1e';
    c.beginPath(); c.moveTo(120, 30); c.lineTo(140, 2); c.stroke();
  });

  // ---------- dekoracijos (taikiniai gniūžtėms) ----------
  tex(scene, 'tree', 250, 370, (c) => {
    shape(c, (p) => rr(p, 110, 300, 30, 66, 6), '#6b3f22');
    const tiers = [[125, 20, 70, 140], [125, 90, 100, 230], [125, 170, 120, 320]];
    for (const [cx, top, half, bottom] of tiers.reverse()) {
      shape(c, (p) => { p.moveTo(cx, top); p.lineTo(cx + half, bottom); p.lineTo(cx - half, bottom); p.closePath(); }, '#1f6b4f');
      c.fillStyle = '#ffffff';
      c.beginPath(); c.moveTo(cx, top + 4); c.lineTo(cx + half * 0.45, top + (bottom - top) * 0.45); c.lineTo(cx - half * 0.45, top + (bottom - top) * 0.45); c.fill();
    }
    const rnd = seeded(3);
    for (let i = 0; i < 18; i++) {
      c.fillStyle = ['#ffd23f', '#ff3ea5', '#2de2e6'][i % 3];
      c.beginPath(); c.arc(70 + rnd() * 110, 120 + rnd() * 180, 6, 0, Math.PI * 2); c.fill();
    }
    shape(c, (p) => {
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? 9 : 20;
        p.lineTo(125 + Math.cos(a) * r, 22 + Math.sin(a) * r);
      }
      p.closePath();
    }, '#ffd23f', 4);
  });

  tex(scene, 'lamp', 100, 390, (c) => {
    shape(c, (p) => rr(p, 42, 60, 16, 326, 6), '#2a2140');
    shape(c, (p) => rr(p, 30, 372, 40, 16, 6), '#2a2140');
    shape(c, (p) => { p.moveTo(50, 64); p.quadraticCurveTo(50, 20, 86, 26); p.lineTo(86, 36); p.quadraticCurveTo(60, 34, 58, 64); p.closePath(); }, '#2a2140', 4);
    shape(c, (p) => rr(p, 66, 30, 32, 22, 8), '#ffe27a', 4);
    const glow = c.createRadialGradient(82, 50, 4, 82, 50, 60);
    glow.addColorStop(0, 'rgba(255,226,122,.55)');
    glow.addColorStop(1, 'rgba(255,226,122,0)');
    c.fillStyle = glow;
    c.fillRect(20, 0, 80, 120);
    for (let i = 0; i < 8; i++) {
      c.fillStyle = ['#ff3ea5', '#2de2e6', '#ffd23f'][i % 3];
      c.beginPath(); c.arc(i % 2 ? 62 : 38, 120 + i * 30, 6, 0, Math.PI * 2); c.fill();
    }
  });

  tex(scene, 'snowman', 180, 240, (c) => {
    shape(c, (p) => p.arc(90, 176, 58, 0, Math.PI * 2), '#f4f7ff');
    shape(c, (p) => p.arc(90, 100, 42, 0, Math.PI * 2), '#f4f7ff');
    shape(c, (p) => p.arc(90, 50, 32, 0, Math.PI * 2), '#f4f7ff');
    shape(c, (p) => rr(p, 54, 70, 72, 16, 8), '#ff3ea5', 5);
    shape(c, (p) => { p.moveTo(90, 52); p.lineTo(130, 58); p.lineTo(90, 62); p.closePath(); }, '#ff8a2a', 4);
    shape(c, (p) => rr(p, 58, 4, 64, 16, 4), OUT, 0);
    shape(c, (p) => rr(p, 68, -20, 44, 30, 4), OUT, 0);
    c.fillStyle = OUT;
    for (const [x, y] of [[78, 42], [102, 42], [90, 100], [90, 124], [90, 160]]) { c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill(); }
  });

  tex(scene, 'stop', 140, 330, (c) => {
    shape(c, (p) => rr(p, 62, 90, 16, 236, 6), '#c7cbe0');
    shape(c, (p) => rr(p, 14, 8, 112, 112, 16), '#2f6bff');
    shape(c, (p) => rr(p, 30, 34, 80, 50, 10), '#ffffff', 4);
    c.fillStyle = '#2f6bff';
    c.fillRect(38, 42, 26, 18); c.fillRect(70, 42, 32, 18);
    c.fillStyle = OUT;
    c.beginPath(); c.arc(46, 88, 8, 0, Math.PI * 2); c.arc(94, 88, 8, 0, Math.PI * 2); c.fill();
    c.font = 'bold 18px Rubik, Arial, sans-serif';
    c.textAlign = 'center';
    c.fillStyle = '#ffffff';
    c.fillText('STOTELĖ', 70, 112);
  });

  // ---------- autobusas ----------
  tex(scene, 'bus', BUS_W, BUS_H, (c) => {
    const g = c.createLinearGradient(0, 30, 0, 280);
    g.addColorStop(0, '#ffe066');
    g.addColorStop(1, '#ff9a3c');
    shape(c, (p) => rr(p, 10, 30, 730, 240, 34), g, 7);
    c.fillStyle = '#ff3ea5';
    c.fillRect(14, 200, 722, 20);
    for (const w of BUS_WINDOWS) {
      shape(c, (p) => rr(p, w.x, w.y, w.w, w.h, 12), '#1a2a4a', 5);
      c.fillStyle = 'rgba(255,255,255,.18)';
      c.beginPath(); c.moveTo(w.x + 10, w.y + w.h - 10); c.lineTo(w.x + 40, w.y + 8); c.lineTo(w.x + 56, w.y + 8); c.lineTo(w.x + 26, w.y + w.h - 10); c.fill();
    }
    shape(c, (p) => rr(p, BUS_DOOR.x, BUS_DOOR.y, BUS_DOOR.w, BUS_DOOR.h, 8), '#0d1426', 5);
    shape(c, (p) => rr(p, 676, 66, 56, 100, 14), '#1a2a4a', 5);
    shape(c, (p) => rr(p, 120, 36, 300, 24, 6), OUT, 0);
    c.font = 'bold 20px Rubik, Arial, sans-serif';
    c.fillStyle = '#ffb000';
    c.textAlign = 'center';
    c.fillText('4  BŪRELIAI', 270, 55);
    shape(c, (p) => p.arc(708, 230, 12, 0, Math.PI * 2), '#fff6b0', 4);
    for (const x of [150, 600]) {
      shape(c, (p) => p.arc(x, 274, 40, 0, Math.PI * 2), '#1b1b28');
      shape(c, (p) => p.arc(x, 274, 16, 0, Math.PI * 2), '#c7cbe0', 4);
    }
  });

  tex(scene, 'bus_door', BUS_DOOR.w, BUS_DOOR.h, (c, w, h) => {
    shape(c, (p) => rr(p, 3, 3, w / 2 - 4, h - 6, 6), '#5aa9e6', 4);
    shape(c, (p) => rr(p, w / 2 + 1, 3, w / 2 - 4, h - 6, 6), '#5aa9e6', 4);
    c.fillStyle = 'rgba(255,255,255,.35)';
    c.fillRect(12, 14, 6, h - 40); c.fillRect(w / 2 + 10, 14, 6, h - 40);
  });

  // ---------- smulkmenos ----------
  tex(scene, 'snowball', 40, 40, (c) => {
    shape(c, (p) => p.arc(20, 20, 15, 0, Math.PI * 2), '#ffffff', 4);
    c.fillStyle = '#c9dbff';
    c.beginPath(); c.arc(24, 24, 8, 0, Math.PI * 2); c.fill();
  });

  tex(scene, 'splat', 120, 120, (c) => {
    shape(c, (p) => {
      for (let i = 0; i < 16; i++) {
        const a = (i * Math.PI) / 8;
        const r = i % 2 ? 26 : 52;
        p.lineTo(60 + Math.cos(a) * r, 60 + Math.sin(a) * r);
      }
      p.closePath();
    }, '#ffffff', 4, '#9db6e8');
  });

  tex(scene, 'flake', 12, 12, (c) => {
    const g = c.createRadialGradient(6, 6, 0, 6, 6, 6);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 12, 12);
  });

  tex(scene, 'star', 54, 54, (c) => {
    shape(c, (p) => {
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? 10 : 23;
        p.lineTo(27 + Math.cos(a) * r, 28 + Math.sin(a) * r);
      }
      p.closePath();
    }, '#ffd23f', 4);
  });

  tex(scene, 'star_off', 54, 54, (c) => {
    shape(c, (p) => {
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 ? 10 : 23;
        p.lineTo(27 + Math.cos(a) * r, 28 + Math.sin(a) * r);
      }
      p.closePath();
    }, 'rgba(255,255,255,.12)', 3, 'rgba(255,255,255,.45)');
  });

  tex(scene, 'dot', 8, 8, (c) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 8, 8); });
}
