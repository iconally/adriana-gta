// 7 etapo "Kinų kalbos pamoka" (Konfucijaus institutas) laikini paveikslėliai, nupiešti kodu.
// Kiekvieną galima pakeisti tikru PNG per assets/manifest.json (tas pats raktas).

const OUT = '#14081f';
const RED = '#c8102e';
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

export const CJK_FONT = '"PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Microsoft YaHei", "Heiti SC", sans-serif';
export const FLOOR_Y = 770;

export function generateChinaArt(scene) {
  // ---------- fonas: kinų kalbos klasė su langu į snieguotą Vilnių ----------
  tex(scene, 'china_bg', 1920, 1080, (c) => {
    const rnd = seeded(77);
    const wall = c.createLinearGradient(0, 0, 0, FLOOR_Y);
    wall.addColorStop(0, '#3a0d1e');
    wall.addColorStop(1, '#6b1530');
    c.fillStyle = wall;
    c.fillRect(0, 0, 1920, FLOOR_Y);
    // raštas ant sienos (debesėliai)
    c.strokeStyle = 'rgba(232,182,58,.12)'; c.lineWidth = 3;
    for (let i = 0; i < 26; i++) {
      const x = rnd() * 1920; const y = 240 + rnd() * 480;
      c.beginPath(); c.arc(x, y, 14, Math.PI, 0); c.arc(x + 22, y, 10, Math.PI, 0); c.stroke();
    }
    // langas su grotelėmis
    const wx = 860; const wy = 250; const ww = 640; const wh = 380;
    shape(c, (p) => rr(p, wx - 16, wy - 16, ww + 32, wh + 32, 10), '#7a4a1c', 6);
    const sky = c.createLinearGradient(0, wy, 0, wy + wh);
    sky.addColorStop(0, '#120a35'); sky.addColorStop(1, '#3b2a7a');
    c.fillStyle = sky; c.fillRect(wx, wy, ww, wh);
    // Vilniaus siluetas
    c.fillStyle = '#0c0626';
    const base = wy + wh;
    c.fillRect(wx, base - 60, ww, 60);
    for (const [x, h, w] of [[30, 90, 60], [110, 130, 40], [170, 70, 80], [300, 110, 50], [420, 80, 70], [520, 120, 50]]) c.fillRect(wx + x, base - h, w, h);
    // Šv. Onos bokšteliai
    for (const [x, h, w] of [[250, 200, 26], [232, 150, 18], [268, 150, 18]]) {
      c.beginPath(); c.moveTo(wx + x - w / 2, base - 60); c.lineTo(wx + x - w / 2, base - h + 40); c.lineTo(wx + x, base - h); c.lineTo(wx + x + w / 2, base - h + 40); c.lineTo(wx + x + w / 2, base - 60); c.fill();
    }
    // Gedimino bokštas ant kalvos
    c.beginPath(); c.ellipse(wx + 520, base - 40, 90, 50, 0, Math.PI, 0); c.fill();
    c.fillRect(wx + 505, base - 150, 32, 70);
    c.fillStyle = '#ffd23f'; c.fillRect(wx + 512, base - 168, 18, 4); c.fillStyle = '#2ea44f'; c.fillRect(wx + 512, base - 164, 18, 4); c.fillStyle = '#e2333a'; c.fillRect(wx + 512, base - 160, 18, 4);
    // šviečiantys langeliai ir sniegas
    for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(255,214,120,.8)'; c.fillRect(wx + rnd() * ww, base - 20 - rnd() * 90, 5, 6); }
    for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.5})`; c.beginPath(); c.arc(wx + rnd() * ww, wy + rnd() * wh, 1 + rnd() * 2, 0, Math.PI * 2); c.fill(); }
    // grotelės
    c.strokeStyle = '#7a4a1c'; c.lineWidth = 10;
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(wx + (ww * i) / 4, wy); c.lineTo(wx + (ww * i) / 4, wy + wh); c.stroke(); }
    c.beginPath(); c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke();
    // kaligrafijos ritiniai
    for (const [x, ch] of [[1600, '学'], [1730, '福']]) {
      shape(c, (p) => rr(p, x - 46, 250, 92, 300, 6), '#f3e6c4', 5);
      shape(c, (p) => rr(p, x - 56, 238, 112, 16, 6), '#5a3420', 4);
      shape(c, (p) => rr(p, x - 56, 546, 112, 16, 6), '#5a3420', 4);
      c.fillStyle = OUT;
      c.font = `bold 72px ${CJK_FONT}`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(ch, x, 400);
      c.fillStyle = RED; c.fillRect(x - 12, 500, 24, 24);
    }
    // grindys
    const fl = c.createLinearGradient(0, FLOOR_Y, 0, 1080);
    fl.addColorStop(0, '#8a5a2b'); fl.addColorStop(1, '#4a2c12');
    c.fillStyle = fl;
    c.fillRect(0, FLOOR_Y, 1920, 1080 - FLOOR_Y);
    c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 3;
    for (let i = -14; i <= 14; i++) { c.beginPath(); c.moveTo(960 + i * 60, FLOOR_Y); c.lineTo(960 + i * 160, 1080); c.stroke(); }
    shape(c, (p) => rr(p, -10, FLOOR_Y - 10, 1940, 16, 4), '#2a0a14', 0);
    // panda ant lentynos
    shape(c, (p) => rr(p, 1520, 690, 170, 14, 4), '#5a3420', 4);
    shape(c, (p) => p.ellipse(1605, 650, 44, 40, 0, 0, Math.PI * 2), '#ffffff', 5);
    shape(c, (p) => p.arc(1605, 600, 32, 0, Math.PI * 2), '#ffffff', 5);
    for (const [x, y, r] of [[1580, 574, 11], [1630, 574, 11]]) shape(c, (p) => p.arc(x, y, r, 0, Math.PI * 2), OUT, 0);
    for (const [x, y] of [[1593, 600], [1617, 600]]) shape(c, (p) => p.ellipse(x, y, 8, 10, 0, 0, Math.PI * 2), OUT, 0);
    shape(c, (p) => p.ellipse(1605, 614, 6, 4, 0, 0, Math.PI * 2), OUT, 0);
    for (const x of [1568, 1642]) shape(c, (p) => p.ellipse(x, 668, 13, 18, 0, 0, Math.PI * 2), OUT, 0);
    // bambukas vazone
    shape(c, (p) => rr(p, 1800, 690, 80, 80, 10), '#2a7a6a', 5);
    c.strokeStyle = '#3ddc84'; c.lineWidth = 8;
    for (const [x, h] of [[1815, 300], [1840, 360], [1862, 270]]) {
      c.beginPath(); c.moveTo(x, 690); c.lineTo(x, 690 - h); c.stroke();
      for (let y = 690 - 40; y > 690 - h; y -= 46) { c.fillStyle = '#2b9a5a'; c.beginPath(); c.ellipse(x + 18, y, 22, 7, -0.4, 0, Math.PI * 2); c.fill(); }
    }
  });

  // ---------- raudonas žibintas ----------
  tex(scene, 'lantern', 76, 104, (c) => {
    c.lineWidth = 3; c.strokeStyle = GOLD;
    c.beginPath(); c.moveTo(38, 0); c.lineTo(38, 12); c.stroke();
    shape(c, (p) => rr(p, 22, 10, 32, 10, 3), GOLD, 3);
    shape(c, (p) => p.ellipse(38, 50, 34, 32, 0, 0, Math.PI * 2), RED, 4);
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2;
    for (const dx of [-18, 0, 18]) { c.beginPath(); c.ellipse(38, 50, Math.abs(dx) + 2, 31, 0, 0, Math.PI * 2); c.stroke(); }
    shape(c, (p) => rr(p, 22, 80, 32, 10, 3), GOLD, 3);
    c.strokeStyle = '#ffd23f'; c.lineWidth = 3;
    for (const dx of [-6, 0, 6]) { c.beginPath(); c.moveTo(38 + dx, 90); c.lineTo(38 + dx, 102); c.stroke(); }
  });
  // hieroglifo kortelė (ryžių popierius)
  tex(scene, 'char_tile', 92, 92, (c) => {
    shape(c, (p) => rr(p, 4, 4, 84, 84, 10), '#fdf3dc', 5, RED);
    c.strokeStyle = 'rgba(200,16,46,.35)'; c.lineWidth = 2;
    c.strokeRect(14, 14, 64, 64);
  });
  // krepšys (raudonas lakuotas dubuo su auksiniu kraštu)
  tex(scene, 'basket', 180, 90, (c) => {
    shape(c, (p) => { p.moveTo(8, 18); p.lineTo(172, 18); p.quadraticCurveTo(160, 86, 90, 86); p.quadraticCurveTo(20, 86, 8, 18); p.closePath(); }, RED, 5);
    shape(c, (p) => rr(p, 2, 10, 176, 14, 7), GOLD, 4);
    c.strokeStyle = 'rgba(255,214,120,.6)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(40, 50); c.quadraticCurveTo(90, 70, 140, 50); c.stroke();
  });
}
