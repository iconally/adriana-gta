// 1 etapo "Soskė broliukams" laikini paveikslėliai, nupiešti kodu.
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

// Lango anga kambario paveikslėlyje (ją naudoja ir scena).
export const HOME_WINDOW = { x: 760, y: 130, w: 400, h: 320 };

export function generateHomeArt(scene) {
  const W = HOME_WINDOW;

  // ---------- kambarys: siena, langas (skylė), užuolaidos, grindys ----------
  tex(scene, 'home_room', 1920, 1080, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 800);
    g.addColorStop(0, '#24113f');
    g.addColorStop(1, '#4b1f6b');
    c.fillStyle = g;
    c.fillRect(0, 0, 1920, 800);
    // tapetai: snaigės ir žvaigždutės
    const rnd = seeded(11);
    c.fillStyle = 'rgba(255,255,255,.06)';
    for (let y = 40; y < 780; y += 70) {
      for (let x = (y / 70) % 2 ? 0 : 35; x < 1920; x += 70) {
        c.beginPath(); c.arc(x, y, 4 + rnd() * 2, 0, Math.PI * 2); c.fill();
      }
    }
    // lubų juosta
    c.fillStyle = '#1a0b2e'; c.fillRect(0, 0, 1920, 18);
    // paveikslas su Vilniaus siluetu
    shape(c, (x) => rr(x, 300, 210, 220, 160, 10), '#ffd23f', 6);
    shape(c, (x) => rr(x, 316, 226, 188, 128, 6), '#2a1a5e', 4);
    c.fillStyle = '#ff3ea5';
    c.beginPath(); c.arc(410, 300, 34, Math.PI, 0); c.fill();
    c.fillStyle = OUT;
    c.fillRect(330, 300, 160, 50);
    c.fillRect(352, 268, 14, 40); c.fillRect(440, 258, 10, 50);
    c.beginPath(); c.moveTo(395, 300); c.lineTo(405, 250); c.lineTo(415, 300); c.fill();
    // laikrodis
    shape(c, (x) => x.arc(1530, 230, 56, 0, Math.PI * 2), '#f1e6ff', 6);
    c.lineWidth = 6; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(1530, 230); c.lineTo(1530, 196); c.moveTo(1530, 230); c.lineTo(1556, 242); c.stroke();
    c.fillStyle = OUT; c.beginPath(); c.arc(1530, 230, 6, 0, Math.PI * 2); c.fill();
    // grindys
    const fg = c.createLinearGradient(0, 800, 0, 1080);
    fg.addColorStop(0, '#6b3f2c');
    fg.addColorStop(1, '#3a2018');
    c.fillStyle = fg;
    c.fillRect(0, 800, 1920, 280);
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 3;
    for (let y = 836; y < 1080; y += 40) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(1920, y); c.stroke();
      const off = (y / 40) % 2 ? 0 : 120;
      for (let x = off; x < 1920; x += 240) { c.beginPath(); c.moveTo(x, y - 40); c.lineTo(x, y); c.stroke(); }
    }
    // grindjuostė
    c.fillStyle = '#f1e6ff'; c.fillRect(0, 792, 1920, 14);
    c.fillStyle = OUT; c.fillRect(0, 806, 1920, 4);
    // kilimas po maniežu
    c.save();
    c.translate(960, 900);
    c.scale(1, 0.22);
    shape(c, (x) => x.arc(0, 0, 380, 0, Math.PI * 2), '#2de2e6', 0);
    shape(c, (x) => x.arc(0, 0, 320, 0, Math.PI * 2), '#1aa3b8', 0);
    shape(c, (x) => x.arc(0, 0, 240, 0, Math.PI * 2), '#2de2e6', 0);
    c.restore();
    // lango rėmas ir palangė
    shape(c, (x) => rr(x, W.x - 26, W.y - 26, W.w + 52, W.h + 52, 12), '#f1e6ff', 6);
    c.globalCompositeOperation = 'destination-out';
    c.fillRect(W.x, W.y, W.w, W.h);
    c.globalCompositeOperation = 'source-over';
    c.lineWidth = 6; c.strokeStyle = OUT; c.strokeRect(W.x, W.y, W.w, W.h);
    // rėmo skersinis - dešinėje, kad neuždengtų TV bokšto
    c.fillStyle = '#f1e6ff'; c.fillRect(W.x + 274, W.y, 12, W.h);
    c.strokeRect(W.x + 274, W.y, 12, W.h);
    shape(c, (x) => rr(x, W.x - 50, W.y + W.h + 18, W.w + 100, 26, 8), '#f1e6ff', 6);
    // užuolaidos
    const curtain = (x0, dir) => {
      shape(c, (x) => {
        x.moveTo(x0, W.y - 40);
        x.lineTo(x0 + dir * 120, W.y - 40);
        x.quadraticCurveTo(x0 + dir * 70, W.y + 200, x0 + dir * 110, W.y + W.h + 70);
        x.lineTo(x0, W.y + W.h + 70);
        x.closePath();
      }, '#ff3ea5', 6);
      c.strokeStyle = 'rgba(20,8,31,.35)'; c.lineWidth = 4;
      for (const k of [30, 60, 90]) {
        c.beginPath(); c.moveTo(x0 + dir * k, W.y - 30); c.quadraticCurveTo(x0 + dir * (k * 0.6), W.y + 200, x0 + dir * (k * 0.9), W.y + W.h + 60); c.stroke();
      }
    };
    curtain(W.x - 70, 1);
    curtain(W.x + W.w + 70, -1);
    shape(c, (x) => rr(x, W.x - 110, W.y - 52, W.w + 220, 16, 8), '#ffd23f', 5);
  });

  // ---------- vaizdas pro langą (be TV bokšto) ----------
  tex(scene, 'home_sky', W.w, W.h, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1d1450');
    g.addColorStop(0.55, '#7a2f8f');
    g.addColorStop(1, '#ff8a5b');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    const rnd = seeded(3);
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) { c.globalAlpha = 0.3 + rnd() * 0.6; c.fillRect(rnd() * w, rnd() * h * 0.5, 2, 2); }
    c.globalAlpha = 1;
    // daugiabučiai su šviečiančiais langais
    for (const [bx, bw, bh] of [[0, 90, 80], [80, 70, 120], [250, 80, 95], [320, 90, 70]]) {
      c.fillStyle = '#1b1238'; c.fillRect(bx, h - bh, bw, bh);
      c.fillStyle = '#fff3a8';
      for (let y = h - bh + 12; y < h - 10; y += 20) {
        for (let x = bx + 8; x < bx + bw - 10; x += 16) if (rnd() < 0.45) c.fillRect(x, y, 7, 9);
      }
      c.fillStyle = '#eef3ff'; c.fillRect(bx, h - bh - 5, bw, 6);
    }
  });

  // ---------- TV bokštas ----------
  tex(scene, 'tv_tower', 110, 300, (c) => {
    const x = 55;
    c.fillStyle = '#cfc8ec'; c.strokeStyle = OUT; c.lineWidth = 4;
    c.beginPath(); c.moveTo(x - 30, 300); c.lineTo(x - 8, 210); c.lineTo(x + 8, 210); c.lineTo(x + 30, 300); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(x - 9, 214); c.lineTo(x - 6, 92); c.lineTo(x + 6, 92); c.lineTo(x + 9, 214); c.closePath(); c.fill(); c.stroke();
    shape(c, (p) => p.ellipse(x, 98, 34, 12, 0, 0, Math.PI * 2), '#e9e4ff', 4);
    shape(c, (p) => rr(p, x - 22, 72, 44, 22, 6), '#cfc8ec', 4);
    c.lineWidth = 5; c.beginPath(); c.moveTo(x, 72); c.lineTo(x, 8); c.stroke();
    c.lineWidth = 3; c.strokeStyle = '#ff3a6a'; c.beginPath(); c.moveTo(x, 40); c.lineTo(x, 8); c.stroke();
    c.fillStyle = '#ff3a6a'; c.beginPath(); c.arc(x, 8, 5, 0, Math.PI * 2); c.fill();
  });

  // ---------- baldai (slėptuvės) ----------
  tex(scene, 'home_sofa', 340, 220, (c) => {
    shape(c, (x) => rr(x, 20, 30, 300, 120, 30), '#b8327f');
    shape(c, (x) => rr(x, 6, 100, 328, 90, 24), '#d63f95');
    shape(c, (x) => rr(x, 0, 70, 60, 120, 24), '#b8327f');
    shape(c, (x) => rr(x, 280, 70, 60, 120, 24), '#b8327f');
    shape(c, (x) => rr(x, 66, 104, 100, 40, 14), '#ff6fb5', 5);
    shape(c, (x) => rr(x, 174, 104, 100, 40, 14), '#ff6fb5', 5);
    shape(c, (x) => rr(x, 210, 50, 70, 56, 16), '#2de2e6', 5);
    c.fillStyle = OUT; c.fillRect(30, 188, 20, 32); c.fillRect(290, 188, 20, 32);
  });

  tex(scene, 'home_toybox', 170, 160, (c) => {
    shape(c, (x) => rr(x, 30, 8, 40, 40, 6), '#3ddc84', 5);
    shape(c, (x) => rr(x, 80, 0, 36, 46, 6), '#ffd23f', 5);
    shape(c, (x) => x.arc(130, 36, 18, 0, Math.PI * 2), '#2de2e6', 5);
    shape(c, (x) => rr(x, 6, 40, 158, 116, 12), '#ff4d5e');
    shape(c, (x) => rr(x, 0, 32, 170, 26, 10), '#ff9a3c', 5);
    c.fillStyle = '#ffd23f';
    c.font = 'bold 44px Anton, Impact, sans-serif';
    c.textAlign = 'center';
    c.fillText('ŽAISLAI', 85, 124);
  });

  tex(scene, 'home_basket', 140, 140, (c) => {
    shape(c, (x) => { x.moveTo(10, 30); x.lineTo(130, 30); x.lineTo(118, 136); x.lineTo(22, 136); x.closePath(); }, '#d9a35b');
    c.strokeStyle = 'rgba(20,8,31,.45)'; c.lineWidth = 3;
    for (let y = 48; y < 134; y += 16) { c.beginPath(); c.moveTo(14, y); c.lineTo(126, y); c.stroke(); }
    for (let x = 30; x < 120; x += 18) { c.beginPath(); c.moveTo(x, 32); c.lineTo(x + 2, 134); c.stroke(); }
    shape(c, (x) => rr(x, 2, 20, 136, 20, 8), '#c48a40', 5);
    // kojinė iškritusi
    shape(c, (x) => { x.moveTo(104, 26); x.lineTo(118, 0); x.lineTo(132, 6); x.lineTo(124, 30); x.closePath(); }, '#2de2e6', 4);
    shape(c, (x) => { x.moveTo(30, 24); x.quadraticCurveTo(46, 2, 66, 22); x.closePath(); }, '#ffffff', 4);
  });

  tex(scene, 'home_xtree', 250, 410, (c) => {
    shape(c, (x) => rr(x, 108, 330, 34, 50, 6), '#7a4a2a');
    const tiers = [[125, 40, 70, 150], [125, 110, 95, 230], [125, 190, 118, 330]];
    for (const [cx, top, half, bottom] of tiers) {
      shape(c, (x) => { x.moveTo(cx, top); x.lineTo(cx + half, bottom); x.lineTo(cx - half, bottom); x.closePath(); }, '#1f8a5a');
    }
    const rnd = seeded(5);
    const cols = ['#ff3ea5', '#ffd23f', '#2de2e6', '#ff9a3c', '#ffffff'];
    for (let i = 0; i < 16; i++) {
      const y = 90 + rnd() * 230;
      const spread = (y - 40) * 0.36;
      shape(c, (x) => x.arc(125 + (rnd() * 2 - 1) * spread, y, 9, 0, Math.PI * 2), cols[i % cols.length], 3);
    }
    // žvaigždė
    shape(c, (x) => {
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 14 : 32;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        x.lineTo(125 + Math.cos(a) * r, 38 + Math.sin(a) * r);
      }
      x.closePath();
    }, '#ffd23f', 5);
    // dovanos
    shape(c, (x) => rr(x, 20, 340, 80, 66, 8), '#ff3ea5', 5);
    shape(c, (x) => rr(x, 150, 356, 76, 50, 8), '#2de2e6', 5);
    c.fillStyle = '#ffd23f'; c.fillRect(54, 340, 12, 66); c.fillRect(182, 356, 12, 50);
  });

  tex(scene, 'home_shelf', 210, 370, (c) => {
    shape(c, (x) => rr(x, 6, 6, 198, 360, 10), '#6b3f2c');
    shape(c, (x) => rr(x, 20, 20, 170, 330, 6), '#3a2018', 4);
    const rnd = seeded(9);
    const cols = ['#ff3ea5', '#2de2e6', '#ffd23f', '#3ddc84', '#a98bff', '#ff9a3c'];
    for (const y of [24, 134, 244]) {
      let x0 = 26;
      while (x0 < 170) {
        const bw = 14 + rnd() * 14;
        const bh = 70 + rnd() * 26;
        shape(c, (x) => rr(x, x0, y + 100 - bh, bw, bh, 3), cols[Math.floor(rnd() * cols.length)], 3);
        x0 += bw + 3;
      }
      c.fillStyle = '#6b3f2c'; c.fillRect(20, y + 100, 170, 10);
    }
  });

  tex(scene, 'home_fridge', 210, 430, (c) => {
    shape(c, (x) => rr(x, 8, 6, 194, 418, 18), '#e8f7ff');
    c.lineWidth = 5; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(8, 150); c.lineTo(202, 150); c.stroke();
    shape(c, (x) => rr(x, 172, 50, 12, 70, 6), '#9fb3c8', 4);
    shape(c, (x) => rr(x, 172, 180, 12, 90, 6), '#9fb3c8', 4);
    // magnetukai ir piešinys
    shape(c, (x) => rr(x, 40, 190, 90, 110, 4), '#ffffff', 4);
    c.strokeStyle = '#ff3ea5'; c.lineWidth = 5;
    c.beginPath(); c.arc(85, 235, 22, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#2de2e6';
    c.beginPath(); c.moveTo(60, 285); c.lineTo(110, 285); c.stroke();
    shape(c, (x) => x.arc(85, 186, 8, 0, Math.PI * 2), '#ffd23f', 3);
    shape(c, (x) => x.arc(60, 60, 12, 0, Math.PI * 2), '#ff3ea5', 3);
    shape(c, (x) => rr(x, 90, 50, 30, 22, 4), '#3ddc84', 3);
  });

  // ---------- maniežas (galinė ir priekinė dalys) ----------
  const pen = (key, front) => tex(scene, key, 440, 200, (c) => {
    if (!front) {
      shape(c, (x) => rr(x, 14, 150, 412, 40, 10), '#2de2e6', 5);
    }
    c.lineWidth = front ? 10 : 8;
    for (let x = 30; x <= 410; x += front ? 38 : 34) {
      c.strokeStyle = OUT; c.lineWidth = front ? 12 : 10;
      c.beginPath(); c.moveTo(x, 30); c.lineTo(x, 182); c.stroke();
      c.strokeStyle = front ? '#ffffff' : '#d9d2ee'; c.lineWidth = front ? 6 : 5;
      c.beginPath(); c.moveTo(x, 30); c.lineTo(x, 182); c.stroke();
    }
    shape(c, (x) => rr(x, 6, 16, 428, 26, 13), front ? '#ffd23f' : '#ffb03a', 5);
    if (front) shape(c, (x) => rr(x, 6, 172, 428, 22, 10), '#ffd23f', 5);
  });
  pen('home_pen_back', false);
  pen('home_pen_front', true);

  // ---------- broliukai ----------
  tex(scene, 'baby_body', 130, 130, (c) => {
    // rankutės iškeltos ant manieže turėklo
    for (const [sx, ex] of [[40, 14], [90, 116]]) {
      c.lineWidth = 22; c.strokeStyle = OUT;
      c.beginPath(); c.moveTo(sx, 40); c.lineTo(ex, 8); c.stroke();
      c.lineWidth = 13; c.strokeStyle = '#ffffff';
      c.beginPath(); c.moveTo(sx, 40); c.lineTo(ex, 8); c.stroke();
      shape(c, (x) => x.arc(ex, 8, 9, 0, Math.PI * 2), '#f5c9a6', 4);
    }
    shape(c, (x) => rr(x, 28, 26, 74, 100, 30), '#ffffff');
    shape(c, (x) => x.arc(65, 76, 9, 0, Math.PI * 2), '#ffd23f', 3);
  });

  const babyHead = (key, mood) => tex(scene, key, 140, 140, (c) => {
    // ausys, galva, plaukų kuodelis
    shape(c, (x) => x.arc(18, 80, 12, 0, Math.PI * 2), '#f5c9a6', 5);
    shape(c, (x) => x.arc(122, 80, 12, 0, Math.PI * 2), '#f5c9a6', 5);
    shape(c, (x) => x.arc(70, 76, 52, 0, Math.PI * 2), '#f5c9a6');
    shape(c, (x) => { x.moveTo(62, 30); x.quadraticCurveTo(54, 8, 80, 6); x.quadraticCurveTo(68, 16, 80, 30); x.closePath(); }, '#8a5a33', 4);
    c.fillStyle = 'rgba(255,90,140,.45)';
    c.beginPath(); c.arc(36, 96, 10, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(104, 96, 10, 0, Math.PI * 2); c.fill();
    c.fillStyle = OUT; c.strokeStyle = OUT; c.lineWidth = 5;
    if (mood === 'cry') {
      // užsimerkęs, burna atvira
      for (const ex of [48, 92]) { c.beginPath(); c.moveTo(ex - 12, 66); c.lineTo(ex + 12, 72); c.stroke(); }
      shape(c, (x) => x.ellipse(70, 104, 20, 16, 0, 0, Math.PI * 2), '#7a1030', 5);
      c.fillStyle = '#ff6f8a'; c.beginPath(); c.ellipse(70, 112, 10, 5, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#6fd3ff';
      for (const ex of [40, 100]) { c.beginPath(); c.ellipse(ex, 84, 6, 12, 0, 0, Math.PI * 2); c.fill(); }
    } else if (mood === 'sad') {
      for (const ex of [50, 90]) { c.beginPath(); c.arc(ex, 72, 7, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#6fd3ff';
      for (const ex of [48, 92]) { c.beginPath(); c.ellipse(ex, 84, 4, 6, 0, 0, Math.PI * 2); c.fill(); }
      c.beginPath(); c.arc(70, 116, 14, Math.PI + 0.4, -0.4); c.stroke();
      c.beginPath(); c.moveTo(38, 62); c.lineTo(58, 54); c.moveTo(102, 62); c.lineTo(82, 54); c.stroke();
    } else if (mood === 'scared') {
      for (const ex of [48, 92]) {
        shape(c, (x) => x.arc(ex, 70, 14, 0, Math.PI * 2), '#ffffff', 4);
        c.fillStyle = OUT; c.beginPath(); c.arc(ex, 72, 5, 0, Math.PI * 2); c.fill();
      }
      shape(c, (x) => x.ellipse(70, 106, 10, 13, 0, 0, Math.PI * 2), '#7a1030', 4);
    } else {
      // ramus su soske
      for (const ex of [48, 92]) { c.beginPath(); c.arc(ex, 72, 11, 0.2, Math.PI - 0.2); c.stroke(); }
      shape(c, (x) => x.ellipse(70, 104, 26, 14, 0, 0, Math.PI * 2), '#2de2e6', 5);
      shape(c, (x) => x.arc(70, 104, 7, 0, Math.PI * 2), '#ffffff', 4);
      c.lineWidth = 4; c.beginPath(); c.arc(70, 120, 10, 0, Math.PI * 2); c.stroke();
    }
  });
  babyHead('baby_cry', 'cry');
  babyHead('baby_sad', 'sad');
  babyHead('baby_scared', 'scared');
  babyHead('baby_calm', 'calm');

  tex(scene, 'tear', 18, 24, (c) => {
    shape(c, (x) => { x.moveTo(9, 2); x.quadraticCurveTo(18, 14, 15, 18); x.arc(9, 17, 6, 0, Math.PI); x.quadraticCurveTo(0, 14, 9, 2); }, '#6fd3ff', 2);
  });

  // ---------- soskė ----------
  tex(scene, 'soske', 80, 80, (c) => {
    c.lineWidth = 7; c.strokeStyle = OUT;
    c.beginPath(); c.arc(40, 60, 13, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 4; c.strokeStyle = '#ffd23f';
    c.beginPath(); c.arc(40, 60, 13, 0, Math.PI * 2); c.stroke();
    shape(c, (x) => x.ellipse(40, 40, 30, 16, 0, 0, Math.PI * 2), '#2de2e6', 5);
    shape(c, (x) => x.arc(40, 40, 8, 0, Math.PI * 2), '#ffffff', 4);
    shape(c, (x) => x.ellipse(40, 18, 10, 13, 0, 0, Math.PI * 2), '#ffe7b0', 4);
  });

  // ---------- pabaisos šešėlis ant sienos ----------
  tex(scene, 'home_monster', 420, 460, (c) => {
    c.fillStyle = 'rgba(8,2,20,.82)';
    c.beginPath();
    c.moveTo(60, 460);
    c.quadraticCurveTo(40, 260, 110, 170);
    c.lineTo(90, 40); c.lineTo(160, 140);
    c.quadraticCurveTo(210, 110, 260, 140);
    c.lineTo(330, 40); c.lineTo(310, 170);
    c.quadraticCurveTo(380, 260, 360, 460);
    c.closePath();
    c.fill();
    // rankos su nagais
    for (const dir of [-1, 1]) {
      const bx = dir < 0 ? 90 : 330;
      c.beginPath();
      c.moveTo(bx, 300);
      c.quadraticCurveTo(bx + dir * 80, 260, bx + dir * 80, 190);
      for (let k = 0; k < 3; k++) {
        c.lineTo(bx + dir * (70 + k * 14), 150 + k * 6);
        c.lineTo(bx + dir * (76 + k * 14), 196);
      }
      c.lineTo(bx + dir * 20, 330);
      c.closePath();
      c.fill();
    }
    c.fillStyle = '#ffd23f';
    for (const ex of [165, 255]) {
      c.beginPath(); c.ellipse(ex, 220, 22, 14, ex < 210 ? 0.3 : -0.3, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.moveTo(150, 290); c.lineTo(270, 290); c.lineTo(250, 320); c.lineTo(230, 296); c.lineTo(210, 322); c.lineTo(190, 296); c.lineTo(170, 320);
    c.closePath(); c.fill();
  });

  // ---------- tamsa su šviesos ratu aplink Adrianą ----------
  tex(scene, 'dark_hole', 640, 640, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 120, w / 2, h / 2, 300);
    g.addColorStop(0, 'rgba(5,1,13,0)');
    g.addColorStop(1, 'rgba(5,1,13,0.93)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });

  // ---------- šviesos jungiklis ----------
  const sw = (key, on) => tex(scene, key, 60, 90, (c) => {
    shape(c, (x) => rr(x, 4, 4, 52, 82, 10), '#f1e6ff', 5);
    shape(c, (x) => rr(x, 20, on ? 18 : 42, 20, 30, 6), on ? '#ffd23f' : '#8a7aa8', 4);
  });
  sw('switch_on', true);
  sw('switch_off', false);
}
