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
// Langas iki grindų (balkono durys).
export const HOME_WINDOW = { x: 680, y: 110, w: 560, h: 690 };
// TV bokšto vieta lango vaizde (kalvos viršūnė) ir jo aukštis.
export const TOWER = { x: 160, y: 450, h: 430 };

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
    // lango rėmas (langas iki grindų)
    shape(c, (x) => rr(x, W.x - 26, W.y - 26, W.w + 52, W.h + 40, 12), '#f1e6ff', 6);
    c.globalCompositeOperation = 'destination-out';
    c.fillRect(W.x, W.y, W.w, W.h);
    c.globalCompositeOperation = 'source-over';
    c.lineWidth = 6; c.strokeStyle = OUT; c.strokeRect(W.x, W.y, W.w, W.h);
    // durų skersinis - dešinėje, kad neuždengtų TV bokšto
    c.fillStyle = '#f1e6ff'; c.fillRect(W.x + 380, W.y, 14, W.h);
    c.strokeRect(W.x + 380, W.y, 14, W.h);
    shape(c, (x) => rr(x, W.x + 360, W.y + 330, 10, 50, 5), '#ffd23f', 4);
    // užuolaidos iki grindų
    const curtain = (x0, dir) => {
      const bottom = W.y + W.h + 6;
      shape(c, (x) => {
        x.moveTo(x0, W.y - 40);
        x.lineTo(x0 + dir * 120, W.y - 40);
        x.quadraticCurveTo(x0 + dir * 60, W.y + 320, x0 + dir * 104, bottom);
        x.lineTo(x0, bottom);
        x.closePath();
      }, '#ff3ea5', 6);
      c.strokeStyle = 'rgba(20,8,31,.35)'; c.lineWidth = 4;
      for (const k of [30, 60, 90]) {
        c.beginPath(); c.moveTo(x0 + dir * k, W.y - 30); c.quadraticCurveTo(x0 + dir * (k * 0.55), W.y + 320, x0 + dir * (k * 0.9), bottom - 6); c.stroke();
      }
      shape(c, (x) => rr(x, Math.min(x0, x0 + dir * 70) - 4, W.y + 380, 78, 16, 8), '#ffd23f', 4);
    };
    curtain(W.x - 70, 1);
    curtain(W.x + W.w + 70, -1);
    shape(c, (x) => rr(x, W.x - 110, W.y - 52, W.w + 220, 16, 8), '#ffd23f', 5);
  });

  // ---------- vaizdas pro langą: dangus ir miškinga kalva (bokštas atskirai) ----------
  tex(scene, 'home_sky', W.w, W.h, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#140c3c');
    g.addColorStop(0.45, '#4a2389');
    g.addColorStop(0.75, '#c2457f');
    g.addColorStop(1, '#ff9a6b');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    const rnd = seeded(3);
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 70; i++) { c.globalAlpha = 0.3 + rnd() * 0.6; c.fillRect(rnd() * w, rnd() * h * 0.55, 2, 2); }
    c.globalAlpha = 1;
    // mėnulis
    shape(c, (x) => x.arc(w - 70, 90, 30, 0, Math.PI * 2), '#fff3c4', 0);
    c.fillStyle = '#140c3c'; c.beginPath(); c.arc(w - 58, 82, 26, 0, Math.PI * 2); c.fill();
    // tolimos kalvos
    const hill = (pts, col) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(0, h);
      for (const [x, y] of pts) c.lineTo(x, y);
      c.lineTo(w, h);
      c.closePath();
      c.fill();
    };
    hill([[0, 600], [120, 585], [300, 610], [460, 590], [w, 605]], '#3a2a6e');
    // kalva su TV bokštu (viršūnė ties TOWER.x, TOWER.y)
    const tx = TOWER.x;
    const ty = TOWER.y;
    const hillY = (x) => (x < tx
      ? ty + (650 - ty) * ((tx - x) / tx) ** 1.7
      : ty + (660 - ty) * ((x - tx) / (w - tx)) ** 1.7);
    c.fillStyle = '#eef3ff';
    c.beginPath();
    c.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) c.lineTo(x, hillY(x));
    c.lineTo(w, h);
    c.closePath();
    c.fill();
    c.lineWidth = 4; c.strokeStyle = OUT;
    c.beginPath();
    for (let x = 0; x <= w; x += 8) c.lineTo(x, hillY(x));
    c.stroke();
    // eglaitės ant kalvos (su sniegu)
    const pine = (x, y, k) => {
      c.fillStyle = '#163d33';
      c.beginPath(); c.moveTo(x, y - 34 * k); c.lineTo(x + 13 * k, y); c.lineTo(x - 13 * k, y); c.closePath(); c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.moveTo(x, y - 34 * k); c.lineTo(x + 5 * k, y - 22 * k); c.lineTo(x - 5 * k, y - 22 * k); c.closePath(); c.fill();
    };
    const trees = [];
    for (let i = 0; i < 60; i++) {
      const x = rnd() * w;
      if (Math.abs(x - tx) < 75) continue;
      trees.push([x, hillY(x) + 16 + rnd() * 90, 0.7 + rnd() * 0.6]);
    }
    trees.sort((p1, p2) => p1[1] - p2[1]).forEach(([x, y, k]) => pine(x, y, k));
  });

  // ---------- Vilniaus TV bokštas: platus pagrindas, plonas kamienas,
  // "lėkštė" per vidurį, viršuje raudonai baltas stiebas ----------
  tex(scene, 'tv_tower', 150, TOWER.h, (c, w, h) => {
    const x = w / 2;
    const conc = '#dcd7f0';
    c.lineWidth = 4; c.strokeStyle = OUT;
    // stiebas su raudonai baltomis juostomis
    const mastTop = 6;
    const mastBottom = Math.round(h * 0.4);
    for (let y = mastTop; y < mastBottom; y += 18) {
      c.fillStyle = Math.floor((y - mastTop) / 18) % 2 ? '#ffffff' : '#ff3a5a';
      c.fillRect(x - 3, y, 6, Math.min(18, mastBottom - y));
    }
    c.strokeRect(x - 3, mastTop, 6, mastBottom - mastTop);
    for (const y of [0.13, 0.25, 0.35].map((k) => Math.round(h * k))) { c.fillStyle = conc; c.fillRect(x - 9, y, 18, 4); c.strokeRect(x - 9, y, 18, 4); }
    c.fillStyle = '#ff3a5a'; c.beginPath(); c.arc(x, mastTop, 5, 0, Math.PI * 2); c.fill();
    // betoninis kamienas: nuo pagrindo siaurėja į viršų
    c.fillStyle = conc;
    c.beginPath();
    c.moveTo(x - 7, mastBottom);
    c.lineTo(x + 7, mastBottom);
    c.lineTo(x + 11, h - 100);
    c.quadraticCurveTo(x + 16, h - 26, x + 56, h - 6);
    c.lineTo(x - 56, h - 6);
    c.quadraticCurveTo(x - 16, h - 26, x - 11, h - 100);
    c.closePath();
    c.fill(); c.stroke();
    // pagrindo pastatas
    shape(c, (p) => rr(p, x - 70, h - 18, 140, 16, 5), '#b9b2d8', 4);
    // apžvalgos aikštelė ("lėkštė") per vidurį
    const py = h - Math.round(h * 0.5);
    shape(c, (p) => { p.moveTo(x - 10, py + 26); p.lineTo(x - 44, py + 10); p.lineTo(x + 44, py + 10); p.lineTo(x + 10, py + 26); p.closePath(); }, conc, 4);
    shape(c, (p) => rr(p, x - 46, py - 14, 92, 26, 6), conc, 4);
    c.fillStyle = '#2a3d6e'; c.fillRect(x - 42, py - 7, 84, 12);
    c.fillStyle = '#fff3a8';
    for (let k = -38; k <= 34; k += 9) c.fillRect(x + k, py - 4, 5, 6);
    shape(c, (p) => rr(p, x - 50, py - 20, 100, 8, 4), '#f1eeff', 4);
    shape(c, (p) => rr(p, x - 20, py - 34, 40, 14, 4), conc, 4);
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

  // ---------- broliukai (2 metų), sėdi ant grindų ----------
  const sit = (key, sweater, stripe) => tex(scene, key, 170, 130, (c) => {
    // kojos į šonus
    for (const [hx, fx] of [[66, 22], [104, 148]]) {
      c.lineWidth = 34; c.strokeStyle = OUT;
      c.beginPath(); c.moveTo(hx, 100); c.lineTo(fx, 112); c.stroke();
      c.lineWidth = 24; c.strokeStyle = '#3b4a8a';
      c.beginPath(); c.moveTo(hx, 100); c.lineTo(fx, 112); c.stroke();
      shape(c, (x) => x.ellipse(fx, 112, 15, 13, 0, 0, Math.PI * 2), '#ffffff', 5);
    }
    // megztinis
    shape(c, (x) => rr(x, 44, 22, 82, 92, 32), sweater);
    c.fillStyle = stripe; c.fillRect(48, 64, 74, 10);
    // rankutės laiko traukinuko vagonėlį
    for (const [sx, ex] of [[52, 58], [118, 112]]) {
      c.lineWidth = 20; c.strokeStyle = OUT;
      c.beginPath(); c.moveTo(sx, 40); c.lineTo(sx - (sx < 85 ? 10 : -10), 70); c.lineTo(ex, 92); c.stroke();
      c.lineWidth = 11; c.strokeStyle = sweater;
      c.beginPath(); c.moveTo(sx, 40); c.lineTo(sx - (sx < 85 ? 10 : -10), 70); c.lineTo(ex, 92); c.stroke();
    }
    shape(c, (x) => rr(x, 62, 84, 46, 26, 6), '#ffd23f', 4);
    c.fillStyle = OUT; c.beginPath(); c.arc(72, 112, 5, 0, Math.PI * 2); c.arc(98, 112, 5, 0, Math.PI * 2); c.fill();
    shape(c, (x) => x.arc(58, 92, 8, 0, Math.PI * 2), '#f5c9a6', 4);
    shape(c, (x) => x.arc(112, 92, 8, 0, Math.PI * 2), '#f5c9a6', 4);
  });
  sit('baby_sit1', '#2de2e6', '#1a8fb8');
  sit('baby_sit2', '#3ddc84', '#ffd23f');

  // plaukai (balti, spalvinami kode)
  tex(scene, 'baby_hair', 140, 140, (c) => {
    shape(c, (x) => {
      x.moveTo(20, 66);
      x.quadraticCurveTo(18, 16, 70, 14);
      x.quadraticCurveTo(122, 16, 120, 66);
      x.quadraticCurveTo(108, 46, 96, 50);
      x.quadraticCurveTo(86, 38, 74, 48);
      x.quadraticCurveTo(62, 36, 50, 48);
      x.quadraticCurveTo(36, 40, 20, 66);
      x.closePath();
    }, '#ffffff', 5);
    c.lineWidth = 5; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(70, 14); c.quadraticCurveTo(80, 0, 92, 6); c.stroke();
  });

  // ---------- medinis traukinukas ----------
  tex(scene, 'train_engine', 96, 70, (c) => {
    shape(c, (x) => rr(x, 6, 26, 84, 30, 6), '#e2333a', 5);
    shape(c, (x) => rr(x, 54, 4, 34, 30, 5), '#ffd23f', 5);
    c.fillStyle = '#9fd8ff'; c.fillRect(62, 11, 18, 12);
    shape(c, (x) => rr(x, 16, 8, 14, 20, 3), '#3b3b5c', 4);
    shape(c, (x) => rr(x, 12, 2, 22, 8, 3), '#3b3b5c', 4);
    for (const wx of [24, 50, 76]) shape(c, (x) => x.arc(wx, 58, 9, 0, Math.PI * 2), '#2a1a12', 4);
  });
  tex(scene, 'train_car', 76, 60, (c) => {
    shape(c, (x) => rr(x, 4, 22, 68, 24, 6), '#2f6bff', 5);
    shape(c, (x) => rr(x, 12, 6, 20, 18, 3), '#ffd23f', 4);
    shape(c, (x) => rr(x, 38, 4, 22, 20, 3), '#3ddc84', 4);
    for (const wx of [20, 56]) shape(c, (x) => x.arc(wx, 48, 9, 0, Math.PI * 2), '#2a1a12', 4);
  });

  const babyHead = (key, mood) => tex(scene, key, 140, 140, (c) => {
    // ausys, galva, plaukų kuodelis
    shape(c, (x) => x.arc(18, 80, 12, 0, Math.PI * 2), '#f5c9a6', 5);
    shape(c, (x) => x.arc(122, 80, 12, 0, Math.PI * 2), '#f5c9a6', 5);
    shape(c, (x) => x.arc(70, 76, 52, 0, Math.PI * 2), '#f5c9a6');
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
