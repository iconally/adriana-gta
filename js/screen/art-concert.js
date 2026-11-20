// 6 etapo "Kalėdinis koncertas" (Filharmonija) laikini paveikslėliai, nupiešti kodu.
// Kiekvieną galima pakeisti tikru PNG per assets/manifest.json (tas pats raktas).

const OUT = '#14081f';
const PINK = '#ff3ea5';
const TEAL = '#2de2e6';
const GOLD = '#e8b63a';

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

// Scenos grindų pradžia (ją naudoja ir scena).
export const FLOOR_Y = 500;

export function generateConcertArt(scene) {
  // ---------- fonas: Filharmonijos scena ----------
  tex(scene, 'concert_bg', 1920, 1080, (c) => {
    const rnd = seeded(66);
    // galinė siena
    const wall = c.createLinearGradient(0, 0, 0, FLOOR_Y);
    wall.addColorStop(0, '#2a0a20');
    wall.addColorStop(1, '#5a1636');
    c.fillStyle = wall;
    c.fillRect(0, 0, 1920, FLOOR_Y + 10);
    // auksinės ložės su žiūrovų siluetais
    for (const [x0, x1] of [[150, 560], [1360, 1770]]) {
      for (const [y0, h] of [[150, 110], [292, 110]]) {
        const n = 3;
        const w = (x1 - x0) / n;
        for (let i = 0; i < n; i++) {
          const x = x0 + i * w;
          shape(c, (p) => { p.moveTo(x + 8, y0 + h); p.lineTo(x + 8, y0 + 30); p.quadraticCurveTo(x + w / 2, y0 - 10, x + w - 8, y0 + 30); p.lineTo(x + w - 8, y0 + h); p.closePath(); }, '#1a0612', 5, GOLD);
          c.fillStyle = 'rgba(0,0,0,.35)';
          for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x + 28 + k * (w - 56) / 2, y0 + h - 22, 13, Math.PI, 0); c.fill(); c.fillRect(x + 15 + k * (w - 56) / 2, y0 + h - 22, 26, 22); }
          shape(c, (p) => rr(p, x + 4, y0 + h - 8, w - 8, 14, 4), GOLD, 3);
        }
      }
    }
    // galinė arka su girliandomis
    shape(c, (p) => { p.moveTo(620, FLOOR_Y); p.lineTo(620, 210); p.quadraticCurveTo(960, 40, 1300, 210); p.lineTo(1300, FLOOR_Y); }, '#3d0f2a', 8, GOLD);
    const cols = ['#ffd23f', PINK, TEAL, '#ffffff', '#3ddc84'];
    for (let i = 0; i <= 34; i++) {
      const t = i / 34;
      const x = 620 + 680 * t;
      const y = 210 - Math.sin(t * Math.PI) * 118 + Math.sin(t * Math.PI * 12) * 8;
      c.fillStyle = cols[i % cols.length];
      c.beginPath(); c.arc(x, y + 14, 6, 0, Math.PI * 2); c.fill();
    }
    // snaigės ant sienos
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3;
    for (let i = 0; i < 16; i++) {
      const x = 640 + rnd() * 640;
      const y = 200 + rnd() * 260;
      const r = 8 + rnd() * 10;
      for (let a = 0; a < 3; a++) {
        const ang = (a * Math.PI) / 3;
        c.beginPath(); c.moveTo(x - Math.cos(ang) * r, y - Math.sin(ang) * r); c.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r); c.stroke();
      }
    }
    // medinės scenos grindys su perspektyva
    const fl = c.createLinearGradient(0, FLOOR_Y, 0, 1080);
    fl.addColorStop(0, '#7a4322');
    fl.addColorStop(1, '#3a1d0e');
    c.fillStyle = fl;
    c.fillRect(0, FLOOR_Y, 1920, 1080 - FLOOR_Y);
    c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 3;
    for (let i = -14; i <= 14; i++) {
      c.beginPath(); c.moveTo(960 + i * 40, FLOOR_Y); c.lineTo(960 + i * 190, 1080); c.stroke();
    }
    c.fillStyle = 'rgba(255,220,160,.12)';
    c.beginPath(); c.ellipse(960, 760, 620, 170, 0, 0, Math.PI * 2); c.fill();
    shape(c, (p) => rr(p, -10, FLOOR_Y - 8, 1940, 14, 4), '#2a0a20', 0);
    // eglė dešinėje
    c.fillStyle = '#16402f';
    // pakopos: viršuje siauriausia, apačioje plačiausia
    for (let k = 0; k < 4; k++) {
      const w = 48 + k * 24;
      const top = 230 + k * 70;
      c.beginPath(); c.moveTo(1680, top - 40); c.lineTo(1680 + w, top + 110); c.lineTo(1680 - w, top + 110); c.closePath(); c.fill();
    }
    for (let i = 0; i < 30; i++) {
      const t = rnd();
      c.fillStyle = cols[i % cols.length];
      c.beginPath(); c.arc(1680 + (rnd() * 2 - 1) * (20 + t * 80), 210 + t * 300, 6, 0, Math.PI * 2); c.fill();
    }
    shape(c, (p) => { for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * 4 * Math.PI) / 5; p[k ? 'lineTo' : 'moveTo'](1680 + Math.cos(a) * 26, 186 + Math.sin(a) * 26); } p.closePath(); }, '#ffd23f', 4);
    // užuolaidos
    const curtain = (x0, x1, flip) => {
      const g = c.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, flip ? '#6e0a1f' : '#b0163a');
      g.addColorStop(1, flip ? '#b0163a' : '#6e0a1f');
      c.fillStyle = g;
      c.beginPath();
      // vidinis kraštas šiek tiek išlenktas, išorinis - iki pat ekrano krašto
      if (flip) { c.moveTo(x1, 0); c.lineTo(x0, 0); c.quadraticCurveTo(x0 + 40, 600, x0, 1080); c.lineTo(x1, 1080); }
      else { c.moveTo(x0, 0); c.lineTo(x1, 0); c.quadraticCurveTo(x1 - 40, 600, x1, 1080); c.lineTo(x0, 1080); }
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 6;
      for (let x = x0 + 22; x < x1 - 10; x += 34) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (flip ? -10 : 10), 1080); c.stroke(); }
    };
    curtain(0, 150, false);
    curtain(1770, 1920, true);
    c.fillStyle = '#a0122e';
    c.fillRect(0, 0, 1920, 70);
    c.fillStyle = GOLD;
    for (let x = 0; x < 1920; x += 26) { c.beginPath(); c.arc(x + 13, 72, 9, 0, Math.PI); c.fill(); }
    c.fillRect(0, 66, 1920, 6);
  });

  // ---------- rojalis (iš šono, klaviatūra kairėje) ----------
  tex(scene, 'grand_piano', 480, 330, (c) => {
    // atidarytas dangtis
    shape(c, (p) => { p.moveTo(70, 150); p.lineTo(300, 20); p.quadraticCurveTo(440, 30, 460, 150); p.closePath(); }, '#1b1426');
    c.strokeStyle = '#3c3350'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(110, 140); c.lineTo(300, 34); c.stroke();
    // atrama
    c.lineWidth = 6; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(330, 150); c.lineTo(300, 56); c.stroke();
    // korpusas
    shape(c, (p) => { p.moveTo(60, 150); p.lineTo(462, 150); p.quadraticCurveTo(478, 200, 440, 214); p.lineTo(60, 214); p.closePath(); }, '#110b1c');
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(70, 158, 380, 6);
    // natos ant pulto
    shape(c, (p) => rr(p, 84, 96, 64, 50, 4), '#fdf6e3', 4);
    c.fillStyle = OUT;
    for (let i = 0; i < 4; i++) c.fillRect(92, 106 + i * 10, 48, 2);
    for (const [x, y] of [[100, 104], [118, 114], [132, 124]]) { c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill(); }
    // klaviatūra
    shape(c, (p) => rr(p, 18, 150, 70, 26, 4), '#ffffff', 4);
    c.fillStyle = OUT;
    for (let i = 0; i < 5; i++) c.fillRect(26 + i * 12, 150, 6, 14);
    // kojos
    for (const x of [80, 270, 420]) shape(c, (p) => rr(p, x, 210, 22, 112, 6), '#110b1c', 5);
  });
  tex(scene, 'piano_bench', 130, 70, (c) => {
    shape(c, (p) => rr(p, 6, 6, 118, 22, 8), '#110b1c', 5);
    for (const x of [16, 100]) shape(c, (p) => rr(p, x, 24, 14, 42, 4), '#110b1c', 4);
  });

  // ---------- Adriana prie rojalio (iš šono, žiūri į dešinę; galva atskirai) ----------
  tex(scene, 'adr_piano', 200, 220, (c) => {
    // kojos ant pedalų
    c.lineWidth = 24; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(80, 150); c.lineTo(132, 154); c.lineTo(138, 206); c.stroke();
    c.lineWidth = 14; c.strokeStyle = '#26306b';
    c.beginPath(); c.moveTo(80, 150); c.lineTo(132, 154); c.lineTo(138, 206); c.stroke();
    shape(c, (p) => rr(p, 128, 196, 34, 18, 7), '#ffffff', 5);
    // suknelė ant suolo
    shape(c, (p) => { p.moveTo(56, 100); p.lineTo(108, 100); p.lineTo(140, 160); p.lineTo(40, 166); p.closePath(); }, PINK);
    shape(c, (p) => rr(p, 38, 158, 104, 14, 7), '#ffffff', 5);
    // liemuo
    shape(c, (p) => rr(p, 58, 40, 50, 66, 16), PINK);
    shape(c, (p) => rr(p, 56, 94, 54, 11, 5), TEAL, 4);
    // rankos į klavišus
    c.lineWidth = 22; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(92, 56); c.lineTo(126, 92); c.lineTo(170, 96); c.stroke();
    c.lineWidth = 13; c.strokeStyle = PINK;
    c.beginPath(); c.moveTo(92, 56); c.lineTo(126, 92); c.lineTo(170, 96); c.stroke();
    shape(c, (p) => p.arc(172, 96, 9, 0, Math.PI * 2), '#f5c9a6', 4);
    shape(c, (p) => p.ellipse(84, 44, 30, 11, 0, 0, Math.PI * 2), '#ffffff', 5);
  });

  // ---------- instrumentai ----------
  tex(scene, 'inst_bells', 100, 90, (c) => {
    for (const [x, y, a] of [[34, 48, -0.3], [68, 44, 0.3]]) {
      c.save(); c.translate(x, y); c.rotate(a);
      shape(c, (p) => rr(p, -5, -40, 10, 22, 4), '#a8703f', 3);
      shape(c, (p) => { p.moveTo(-20, 16); p.quadraticCurveTo(-18, -20, 0, -20); p.quadraticCurveTo(18, -20, 20, 16); p.closePath(); }, '#ffd23f', 4);
      shape(c, (p) => p.arc(0, 18, 5, 0, Math.PI * 2), '#e8b63a', 3);
      c.restore();
    }
  });
  tex(scene, 'inst_violin', 110, 90, (c) => {
    c.save(); c.translate(52, 50); c.rotate(-0.5);
    shape(c, (p) => { p.ellipse(0, 14, 20, 16, 0, 0, Math.PI * 2); }, '#b4622a', 4);
    shape(c, (p) => { p.ellipse(0, -12, 16, 14, 0, 0, Math.PI * 2); }, '#b4622a', 4);
    shape(c, (p) => rr(p, -4, -54, 8, 44, 3), '#3a1d0e', 3);
    c.fillStyle = OUT; c.fillRect(-1.5, -10, 3, 34);
    c.restore();
    c.lineWidth = 4; c.strokeStyle = '#3a1d0e';
    c.beginPath(); c.moveTo(10, 30); c.lineTo(100, 70); c.stroke();
  });
  tex(scene, 'inst_drum', 100, 90, (c) => {
    shape(c, (p) => rr(p, 14, 38, 72, 44, 8), TEAL, 5);
    shape(c, (p) => p.ellipse(50, 38, 36, 12, 0, 0, Math.PI * 2), '#f4f7ff', 5);
    c.strokeStyle = '#ffffff'; c.lineWidth = 3;
    for (let x = 22; x <= 78; x += 14) { c.beginPath(); c.moveTo(x, 46); c.lineTo(x + 7, 80); c.stroke(); }
    c.lineWidth = 5; c.strokeStyle = '#a8703f';
    c.beginPath(); c.moveTo(30, 6); c.lineTo(46, 34); c.stroke();
    c.beginPath(); c.moveTo(74, 6); c.lineTo(58, 34); c.stroke();
  });
  tex(scene, 'inst_trumpet', 120, 70, (c) => {
    shape(c, (p) => rr(p, 10, 30, 70, 12, 5), '#ffd23f', 4);
    shape(c, (p) => { p.moveTo(76, 30); p.lineTo(110, 12); p.lineTo(110, 60); p.lineTo(76, 42); p.closePath(); }, '#ffd23f', 4);
    for (const x of [34, 46, 58]) shape(c, (p) => rr(p, x, 18, 7, 14, 3), '#e8b63a', 3);
    shape(c, (p) => rr(p, 2, 32, 12, 8, 3), '#e8b63a', 3);
  });
  // dirigento pakyla
  tex(scene, 'podium_box', 220, 60, (c) => {
    shape(c, (p) => rr(p, 6, 10, 208, 44, 8), '#7a1530', 5);
    shape(c, (p) => rr(p, 4, 4, 212, 14, 6), GOLD, 4);
  });
  // rožė finalui
  tex(scene, 'rose', 40, 70, (c) => {
    c.lineWidth = 4; c.strokeStyle = '#2f7d3a';
    c.beginPath(); c.moveTo(20, 28); c.lineTo(20, 66); c.stroke();
    shape(c, (p) => p.ellipse(28, 46, 8, 4, -0.6, 0, Math.PI * 2), '#3ddc84', 2);
    shape(c, (p) => p.arc(20, 18, 14, 0, Math.PI * 2), '#e2333a', 3);
    c.strokeStyle = '#8a0f1f'; c.lineWidth = 2;
    c.beginPath(); c.arc(20, 18, 7, 0, Math.PI * 1.6); c.stroke();
  });
}
