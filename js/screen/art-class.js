// 3 etapo "Kai mokytoja nusisuka" laikini paveikslėliai, nupiešti kodu.
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

// Lentos vieta klasės paveikslėlyje (ją naudoja ir scena).
export const BOARD = { x: 1440, y: 150, w: 450, h: 330 };

export function generateClassArt(scene) {
  // ---------- klasė: siena, langai, grindys, lenta ----------
  tex(scene, 'class_room', 1920, 1080, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 760);
    g.addColorStop(0, '#2c1d5c');
    g.addColorStop(1, '#4a2a7a');
    c.fillStyle = g;
    c.fillRect(0, 0, 1920, 760);
    c.fillStyle = '#1a0b2e'; c.fillRect(0, 0, 1920, 16);
    // apatinė sienos dalis
    c.fillStyle = '#3a2468'; c.fillRect(0, 560, 1920, 200);
    c.fillStyle = '#ff3ea5'; c.fillRect(0, 556, 1920, 8);
    // langai kairėje su sniegu
    const rnd = seeded(31);
    for (const x0 of [60, 420, 780]) {
      shape(c, (x) => rr(x, x0, 90, 260, 300, 10), '#f1e6ff', 6);
      const sg = c.createLinearGradient(0, 110, 0, 370);
      sg.addColorStop(0, '#2a1a5e'); sg.addColorStop(1, '#ff9a6b');
      c.fillStyle = sg; c.fillRect(x0 + 18, 108, 224, 264);
      c.fillStyle = '#eef3ff';
      c.beginPath(); c.moveTo(x0 + 18, 330); c.quadraticCurveTo(x0 + 130, 300, x0 + 242, 335); c.lineTo(x0 + 242, 372); c.lineTo(x0 + 18, 372); c.fill();
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 14; i++) c.fillRect(x0 + 22 + rnd() * 216, 112 + rnd() * 200, 3, 3);
      c.lineWidth = 6; c.strokeStyle = OUT; c.strokeRect(x0 + 18, 108, 224, 264);
      c.fillStyle = '#f1e6ff'; c.fillRect(x0 + 124, 108, 12, 264); c.strokeRect(x0 + 124, 108, 12, 264);
    }
    // laikrodis ir plakatas
    shape(c, (x) => x.arc(1365, 92, 46, 0, Math.PI * 2), '#f1e6ff', 6);
    c.lineWidth = 6; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(1365, 92); c.lineTo(1365, 62); c.moveTo(1365, 92); c.lineTo(1387, 104); c.stroke();
    shape(c, (x) => rr(x, 1110, 220, 180, 230, 8), '#ffd23f', 5);
    c.fillStyle = OUT; c.font = 'bold 34px Anton, Impact, sans-serif'; c.textAlign = 'center';
    c.fillText('A B C', 1200, 280);
    c.fillText('1 2 3', 1200, 340);
    c.fillStyle = '#ff3ea5'; c.fillText('★', 1200, 410);
    // grindys
    const fg = c.createLinearGradient(0, 760, 0, 1080);
    fg.addColorStop(0, '#7a4a32'); fg.addColorStop(1, '#3a2018');
    c.fillStyle = fg; c.fillRect(0, 760, 1920, 320);
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 3;
    for (let y = 790; y < 1080; y += 36) { c.beginPath(); c.moveTo(0, y); c.lineTo(1920, y); c.stroke(); }
    c.fillStyle = '#f1e6ff'; c.fillRect(0, 752, 1920, 12);
    c.fillStyle = OUT; c.fillRect(0, 764, 1920, 4);
  });

  tex(scene, 'chalkboard', 460, 340, (c, w, h) => {
    shape(c, (x) => rr(x, 4, 4, w - 8, h - 30, 10), '#b9783f', 6);
    shape(c, (x) => rr(x, 20, 20, w - 40, h - 62, 4), '#1f5a4a', 5);
    c.fillStyle = 'rgba(255,255,255,.07)';
    c.fillRect(40, 40, 120, 50); c.fillRect(260, 120, 140, 60);
    shape(c, (x) => rr(x, 30, h - 36, w - 60, 14, 5), '#b9783f', 4);
    c.fillStyle = '#ffffff'; c.fillRect(70, h - 42, 26, 8);
    c.fillStyle = '#ffd23f'; c.fillRect(110, h - 42, 20, 8);
  });

  // ---------- mokinio suolas (priekis) ----------
  tex(scene, 'desk', 180, 96, (c, w) => {
    c.fillStyle = OUT;
    c.fillRect(22, 40, 12, 56); c.fillRect(w - 34, 40, 12, 56);
    shape(c, (x) => rr(x, 10, 26, w - 20, 40, 6), '#b9783f', 5);
    shape(c, (x) => rr(x, 4, 8, w - 8, 22, 6), '#e0a868', 5);
    c.fillStyle = 'rgba(20,8,31,.2)'; c.fillRect(20, 46, w - 40, 6);
  });

  // ---------- mokytojos stalas ----------
  tex(scene, 'teacher_desk', 250, 170, (c, w) => {
    // knygų krūvelė ir obuolys ant stalo
    shape(c, (x) => rr(x, 30, 22, 70, 16, 3), '#2de2e6', 4);
    shape(c, (x) => rr(x, 36, 8, 60, 16, 3), '#ff3ea5', 4);
    shape(c, (x) => x.arc(190, 30, 16, 0, Math.PI * 2), '#e2333a', 4);
    shape(c, (x) => { x.moveTo(190, 14); x.quadraticCurveTo(198, 2, 206, 8); }, null, 4);
    shape(c, (x) => rr(x, 6, 44, w - 12, 26, 6), '#e0a868', 5);
    shape(c, (x) => rr(x, 16, 68, w - 32, 96, 6), '#8a5a33', 5);
    shape(c, (x) => rr(x, 40, 86, w - 80, 30, 4), '#b9783f', 4);
    shape(c, (x) => rr(x, w / 2 - 12, 96, 24, 8, 4), '#ffd23f', 3);
  });

  // ---------- mokytoja iš nugaros (rašo lentoje) ----------
  tex(scene, 'teacher_back', 150, 250, (c) => {
    for (const x0 of [56, 84]) {
      c.lineWidth = 22; c.strokeStyle = OUT;
      c.beginPath(); c.moveTo(x0 + 5, 180); c.lineTo(x0 + 5, 236); c.stroke();
      c.lineWidth = 13; c.strokeStyle = '#3b3b5c';
      c.beginPath(); c.moveTo(x0 + 5, 180); c.lineTo(x0 + 5, 236); c.stroke();
      shape(c, (x) => rr(x, x0 - 6, 230, 28, 16, 6), '#14081f', 3);
    }
    shape(c, (x) => { x.moveTo(48, 14); x.lineTo(102, 14); x.lineTo(118, 196); x.lineTo(32, 196); x.closePath(); }, '#7d5cff');
    c.fillStyle = '#5b3fd6'; c.fillRect(46, 120, 58, 8);
    // kairė ranka nuleista, dešinė pakelta su kreida (rašo)
    c.lineWidth = 22; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(50, 26); c.lineTo(32, 110); c.stroke();
    c.beginPath(); c.moveTo(100, 26); c.lineTo(132, -4 + 20); c.stroke();
    c.lineWidth = 13; c.strokeStyle = '#7d5cff';
    c.beginPath(); c.moveTo(50, 26); c.lineTo(32, 110); c.stroke();
    c.beginPath(); c.moveTo(100, 26); c.lineTo(132, 16); c.stroke();
    shape(c, (x) => x.arc(32, 114, 9, 0, Math.PI * 2), '#f5c9a6', 4);
    shape(c, (x) => x.arc(134, 14, 9, 0, Math.PI * 2), '#f5c9a6', 4);
  });

  // plaukai iš nugaros (balti, spalvinami kode)
  tex(scene, 'teacher_hair', 120, 130, (c) => {
    shape(c, (x) => { x.moveTo(14, 60); x.quadraticCurveTo(12, 6, 60, 6); x.quadraticCurveTo(108, 6, 106, 60); x.quadraticCurveTo(112, 110, 84, 124); x.lineTo(36, 124); x.quadraticCurveTo(8, 110, 14, 60); x.closePath(); }, '#ffffff', 6);
    c.lineWidth = 4; c.strokeStyle = 'rgba(20,8,31,.35)';
    for (const dx of [-20, 0, 20]) { c.beginPath(); c.moveTo(60 + dx, 16); c.quadraticCurveTo(60 + dx * 1.4, 70, 60 + dx, 118); c.stroke(); }
    shape(c, (x) => x.arc(60, 18, 16, 0, Math.PI * 2), '#ffffff', 5);
  });

  // mokytojos veidas, kol nėra jos avataro
  tex(scene, 'teacher_face', 120, 120, (c) => {
    shape(c, (x) => x.arc(60, 64, 46, 0, Math.PI * 2), '#f5c9a6');
    shape(c, (x) => { x.moveTo(14, 66); x.quadraticCurveTo(10, 10, 60, 12); x.quadraticCurveTo(110, 10, 106, 66); x.quadraticCurveTo(92, 34, 60, 36); x.quadraticCurveTo(28, 34, 14, 66); x.closePath(); }, '#8a5a33', 5);
    c.lineWidth = 4; c.strokeStyle = OUT;
    for (const ex of [42, 78]) { c.beginPath(); c.arc(ex, 66, 11, 0, Math.PI * 2); c.stroke(); }
    c.beginPath(); c.moveTo(53, 66); c.lineTo(67, 66); c.stroke();
    c.fillStyle = OUT; c.beginPath(); c.arc(42, 67, 4, 0, Math.PI * 2); c.arc(78, 67, 4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(60, 88, 12, 0.2, Math.PI - 0.2); c.stroke();
  });

  // ---------- kalėdinis atvirukas ----------
  tex(scene, 'xmas_card', 80, 60, (c) => {
    shape(c, (x) => rr(x, 4, 4, 72, 52, 6), '#e2333a', 5);
    c.fillStyle = '#1f8a5a';
    c.beginPath(); c.moveTo(40, 12); c.lineTo(56, 44); c.lineTo(24, 44); c.closePath(); c.fill();
    c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(40, 12, 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffffff';
    for (const [x, y] of [[14, 14], [66, 18], [62, 46], [16, 44]]) { c.beginPath(); c.arc(x, y, 2.5, 0, Math.PI * 2); c.fill(); }
  });

  // ---------- penalas (krenta ant grindų) ----------
  tex(scene, 'pencil_case', 70, 30, (c) => {
    shape(c, (x) => rr(x, 4, 4, 62, 22, 10), '#2de2e6', 4);
    c.lineWidth = 3; c.strokeStyle = OUT; c.beginPath(); c.moveTo(10, 15); c.lineTo(60, 15); c.stroke();
  });
}
