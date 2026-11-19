// 2 etapo "Laiptai su kuprine" laikini paveikslėliai, nupiešti kodu.
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

export function generateSchoolArt(scene) {
  // ---------- sienos raštas (kartojasi) ----------
  tex(scene, 'school_wall_tile', 160, 160, (c, w, h) => {
    c.fillStyle = '#3a2768';
    c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.06)';
    for (const [x, y] of [[20, 20], [100, 60], [60, 120], [140, 140]]) {
      c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = 'rgba(0,0,0,.08)';
    c.fillRect(0, 0, w, 2);
  });

  // ---------- aprasojęs langas su žiemos vaizdu ----------
  tex(scene, 'school_window', 240, 280, (c, w, h) => {
    shape(c, (x) => rr(x, 4, 4, w - 8, h - 8, 14), '#f1e6ff', 6);
    const g = c.createLinearGradient(0, 20, 0, h - 20);
    g.addColorStop(0, '#2a1a5e');
    g.addColorStop(0.6, '#8a3f9f');
    g.addColorStop(1, '#ff9a6b');
    c.fillStyle = g;
    c.fillRect(20, 20, w - 40, h - 40);
    // snieguoti medžiai ir sniegas
    const rnd = seeded(21);
    c.fillStyle = '#eef3ff';
    c.beginPath(); c.moveTo(20, h - 70); c.quadraticCurveTo(w / 2, h - 100, w - 20, h - 64); c.lineTo(w - 20, h - 20); c.lineTo(20, h - 20); c.fill();
    for (let i = 0; i < 6; i++) {
      const x = 34 + rnd() * (w - 68);
      const y = h - 70 - rnd() * 10;
      c.fillStyle = '#163d33';
      c.beginPath(); c.moveTo(x, y - 50); c.lineTo(x + 18, y); c.lineTo(x - 18, y); c.closePath(); c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath(); c.moveTo(x, y - 50); c.lineTo(x + 7, y - 32); c.lineTo(x - 7, y - 32); c.closePath(); c.fill();
    }
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 30; i++) c.fillRect(24 + rnd() * (w - 48), 24 + rnd() * (h - 120), 3, 3);
    // rasa (balta migla)
    const f = c.createRadialGradient(w / 2, h / 2, 30, w / 2, h / 2, 170);
    f.addColorStop(0, 'rgba(255,255,255,.18)');
    f.addColorStop(1, 'rgba(255,255,255,.55)');
    c.fillStyle = f;
    c.fillRect(20, 20, w - 40, h - 40);
    c.lineWidth = 6; c.strokeStyle = OUT; c.strokeRect(20, 20, w - 40, h - 40);
    c.fillStyle = '#f1e6ff'; c.fillRect(w / 2 - 6, 20, 12, h - 40);
    c.strokeRect(w / 2 - 6, 20, 12, h - 40);
    // palangė
    shape(c, (x) => rr(x, 0, h - 26, w, 22, 6), '#f1e6ff', 5);
  });

  // ---------- 3 aukšto durys ----------
  tex(scene, 'school_door', 260, 330, (c, w, h) => {
    shape(c, (x) => rr(x, 6, 6, w - 12, h - 6, 10), '#3a2a6e', 6);
    for (const dx of [20, w / 2 + 4]) {
      shape(c, (x) => rr(x, dx, 22, w / 2 - 24, h - 30, 6), '#2de2e6', 5);
      shape(c, (x) => rr(x, dx + 14, 40, w / 2 - 52, 110, 4), '#cfe9ff', 4);
    }
    shape(c, (x) => rr(x, w / 2 - 22, 180, 12, 40, 5), '#ffd23f', 4);
    shape(c, (x) => rr(x, w / 2 + 10, 180, 12, 40, 5), '#ffd23f', 4);
  });

  // ---------- didelė kuprinė (ant Adrianos nugaros) ----------
  tex(scene, 'backpack_big', 120, 150, (c) => {
    shape(c, (x) => rr(x, 10, 14, 100, 130, 26), '#ffd23f');
    shape(c, (x) => rr(x, 18, 76, 84, 56, 16), '#ff9a3c', 5);
    shape(c, (x) => rr(x, 42, 92, 36, 8, 4), '#14081f', 0);
    shape(c, (x) => { x.moveTo(30, 18); x.quadraticCurveTo(60, -6, 90, 18); }, null, 8);
    shape(c, (x) => rr(x, 24, 30, 72, 30, 10), '#ff3ea5', 5);
    shape(c, (x) => x.arc(60, 45, 6, 0, Math.PI * 2), '#ffffff', 3);
  });

  // ---------- knyga (balta, spalvinama kode) ----------
  tex(scene, 'book', 70, 54, (c) => {
    shape(c, (x) => rr(x, 4, 6, 62, 42, 5), '#ffffff', 5);
    c.fillStyle = 'rgba(20,8,31,.25)'; c.fillRect(8, 40, 54, 6);
    c.fillStyle = '#ffffff'; c.fillRect(10, 42, 50, 3);
    c.lineWidth = 4; c.strokeStyle = OUT;
    c.beginPath(); c.moveTo(14, 6); c.lineTo(14, 48); c.stroke();
    c.beginPath(); c.moveTo(24, 18); c.lineTo(54, 18); c.moveTo(24, 26); c.lineTo(46, 26); c.stroke();
  });

  tex(scene, 'mandarin', 56, 56, (c) => {
    shape(c, (x) => x.arc(28, 31, 22, 0, Math.PI * 2), '#ff9a3c', 5);
    c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(20, 23, 6, 4, -0.6, 0, Math.PI * 2); c.fill();
    shape(c, (x) => { x.moveTo(28, 10); x.quadraticCurveTo(42, 0, 46, 10); x.quadraticCurveTo(36, 16, 28, 10); x.closePath(); }, '#3ddc84', 4);
  });

  // ---------- mokyklos skambutis (varpelis) ----------
  tex(scene, 'school_bell', 90, 90, (c) => {
    shape(c, (x) => { x.moveTo(20, 66); x.quadraticCurveTo(20, 18, 45, 16); x.quadraticCurveTo(70, 18, 70, 66); x.lineTo(78, 72); x.lineTo(12, 72); x.closePath(); }, '#ffd23f', 6);
    shape(c, (x) => x.arc(45, 12, 7, 0, Math.PI * 2), '#ffd23f', 5);
    shape(c, (x) => x.arc(45, 80, 8, 0, Math.PI * 2), '#ff9a3c', 5);
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(34, 40, 5, 14, 0.2, 0, Math.PI * 2); c.fill();
    // skambėjimo brūkšneliai iš šonų
    c.lineWidth = 5; c.strokeStyle = OUT;
    c.beginPath(); c.arc(45, 44, 44, Math.PI * 1.1, Math.PI * 1.35); c.stroke();
    c.beginPath(); c.arc(45, 44, 44, -0.35, -0.1); c.stroke();
  });

  // ---------- skelbimų lenta su piešiniais ----------
  tex(scene, 'school_board', 260, 170, (c, w, h) => {
    shape(c, (x) => rr(x, 4, 4, w - 8, h - 8, 10), '#b9783f', 6);
    shape(c, (x) => rr(x, 16, 16, w - 32, h - 32, 6), '#f2c79a', 4);
    const cols = ['#ff3ea5', '#2de2e6', '#ffd23f', '#3ddc84'];
    [[30, 28, -0.08], [104, 34, 0.06], [176, 26, -0.04]].forEach(([x0, y0, a], i) => {
      c.save(); c.translate(x0 + 30, y0 + 40); c.rotate(a);
      shape(c, (x) => rr(x, -30, -40, 60, 80, 3), '#ffffff', 4);
      c.fillStyle = cols[i]; c.beginPath(); c.arc(0, -8, 14, 0, Math.PI * 2); c.fill();
      c.fillRect(-18, 14, 36, 6);
      c.restore();
      shape(c, (x) => x.arc(x0 + 30, y0 + 4, 5, 0, Math.PI * 2), cols[(i + 2) % 4], 3);
    });
  });
}
