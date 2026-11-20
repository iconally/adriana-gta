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
    const PINK = '#ff8fc0';
    const wall = c.createLinearGradient(0, 0, 0, FLOOR_Y);
    wall.addColorStop(0, '#3a0d1e');
    wall.addColorStop(1, '#6b1530');
    c.fillStyle = wall;
    c.fillRect(0, 0, 1920, FLOOR_Y);
    // auksiniai debesėliai sienoje
    c.strokeStyle = 'rgba(232,182,58,.14)'; c.lineWidth = 3;
    for (let i = 0; i < 30; i++) {
      const x = rnd() * 1920; const y = 230 + rnd() * 430;
      c.beginPath(); c.arc(x, y, 14, Math.PI, 0); c.arc(x + 22, y, 10, Math.PI, 0); c.arc(x + 40, y + 4, 8, Math.PI, 0); c.stroke();
    }
    // apatinė sienos dalis su „回“ raštu
    c.fillStyle = '#4a0e1c'; c.fillRect(0, 680, 1920, FLOOR_Y - 680);
    c.fillStyle = GOLD; c.fillRect(0, 676, 1920, 6);
    c.strokeStyle = GOLD; c.lineWidth = 3;
    for (let x = 0; x < 1920; x += 40) {
      c.beginPath(); c.moveTo(x + 4, 724); c.lineTo(x + 4, 696); c.lineTo(x + 32, 696); c.lineTo(x + 32, 718); c.lineTo(x + 14, 718); c.lineTo(x + 14, 706); c.lineTo(x + 24, 706); c.stroke();
    }
    c.fillRect(0, 734, 1920, 3);

    // ---- langas su grotelėmis ir karpiniais ----
    const wx = 860; const wy = 250; const ww = 640; const wh = 380;
    shape(c, (p) => rr(p, wx - 16, wy - 16, ww + 32, wh + 32, 10), '#7a4a1c', 6);
    const sky = c.createLinearGradient(0, wy, 0, wy + wh);
    sky.addColorStop(0, '#120a35'); sky.addColorStop(1, '#3b2a7a');
    c.fillStyle = sky; c.fillRect(wx, wy, ww, wh);
    c.fillStyle = '#0c0626';
    const base = wy + wh;
    c.fillRect(wx, base - 60, ww, 60);
    for (const [x, h, w] of [[30, 90, 60], [110, 130, 40], [170, 70, 80], [300, 110, 50], [420, 80, 70], [520, 120, 50]]) c.fillRect(wx + x, base - h, w, h);
    for (const [x, h, w] of [[250, 200, 26], [232, 150, 18], [268, 150, 18]]) {
      c.beginPath(); c.moveTo(wx + x - w / 2, base - 60); c.lineTo(wx + x - w / 2, base - h + 40); c.lineTo(wx + x, base - h); c.lineTo(wx + x + w / 2, base - h + 40); c.lineTo(wx + x + w / 2, base - 60); c.fill();
    }
    c.beginPath(); c.ellipse(wx + 520, base - 40, 90, 50, 0, Math.PI, 0); c.fill();
    c.fillRect(wx + 505, base - 150, 32, 70);
    c.fillStyle = '#ffd23f'; c.fillRect(wx + 512, base - 168, 18, 4); c.fillStyle = '#2ea44f'; c.fillRect(wx + 512, base - 164, 18, 4); c.fillStyle = '#e2333a'; c.fillRect(wx + 512, base - 160, 18, 4);
    for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(255,214,120,.8)'; c.fillRect(wx + rnd() * ww, base - 20 - rnd() * 90, 5, 6); }
    for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.5})`; c.beginPath(); c.arc(wx + rnd() * ww, wy + rnd() * wh, 1 + rnd() * 2, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = '#7a4a1c'; c.lineWidth = 10;
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(wx + (ww * i) / 4, wy); c.lineTo(wx + (ww * i) / 4, wy + wh); c.stroke(); }
    c.beginPath(); c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke();
    // raudoni karpiniai (窗花) viršutiniuose languose
    const papercut = (x, y, r) => {
      c.fillStyle = RED; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1a0f40';
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; c.beginPath(); c.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.22, r * 0.1, a, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = RED; c.beginPath(); c.arc(x, y, r * 0.22, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#1a0f40'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * 0.82, 0, Math.PI * 2); c.stroke();
    };
    for (let i = 0; i < 4; i++) papercut(wx + (ww * (i + 0.5)) / 4, wy + 62, 36);
    // užuolaidėlė virš lango
    c.fillStyle = '#a0122e';
    c.beginPath(); c.moveTo(wx - 24, wy - 24);
    for (let x = wx - 24; x <= wx + ww + 24; x += 48) c.quadraticCurveTo(x + 24, wy + 16, x + 48, wy - 24);
    c.lineTo(wx + ww + 24, wy - 40); c.lineTo(wx - 24, wy - 40); c.closePath(); c.fill();
    c.fillStyle = GOLD; c.fillRect(wx - 24, wy - 44, ww + 48, 6);

    // ---- kupletai (春联) iš abiejų lango pusių: Konfucijaus mintys ----
    const couplet = (x, text) => {
      shape(c, (p) => rr(p, x - 28, 236, 56, 420, 4), '#c8102e', 4, GOLD);
      c.fillStyle = '#ffd23f';
      c.font = `bold 44px ${CJK_FONT}`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      [...text].forEach((ch, i) => c.fillText(ch, x, 280 + i * 82));
    };
    couplet(810, '学而时习之');
    couplet(1550, '温故而知新');

    // ---- atverta vėduoklė ----
    const fx = 640; const fy = 420;
    const fan = c.createLinearGradient(fx - 160, fy - 160, fx + 160, fy);
    fan.addColorStop(0, '#c8102e'); fan.addColorStop(1, '#ff7a3c');
    shape(c, (p) => { p.moveTo(fx, fy); p.arc(fx, fy, 160, Math.PI * 1.08, Math.PI * 1.92); p.closePath(); }, fan, 5);
    c.fillStyle = '#4a0e1c'; c.beginPath(); c.moveTo(fx, fy); c.arc(fx, fy, 50, Math.PI * 1.08, Math.PI * 1.92); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(20,8,31,.55)'; c.lineWidth = 2;
    for (let k = 0; k <= 12; k++) { const a = Math.PI * (1.08 + (0.84 * k) / 12); c.beginPath(); c.moveTo(fx + Math.cos(a) * 50, fy + Math.sin(a) * 50); c.lineTo(fx + Math.cos(a) * 160, fy + Math.sin(a) * 160); c.stroke(); }
    // slyvos šaka ant vėduoklės
    c.strokeStyle = '#3a1d0e'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(fx - 120, fy - 70); c.quadraticCurveTo(fx - 40, fy - 120, fx + 70, fy - 110); c.stroke();
    for (const [x, y] of [[fx - 90, fy - 92], [fx - 40, fy - 112], [fx + 10, fy - 118], [fx + 55, fy - 112]]) {
      for (let k = 0; k < 5; k++) { const a = (k * Math.PI * 2) / 5; c.fillStyle = '#ffd6e8'; c.beginPath(); c.arc(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = GOLD; c.beginPath(); c.arc(fx, fy, 8, 0, Math.PI * 2); c.fill();

    // ---- paveikslas: Didžioji kinų siena ----
    shape(c, (p) => rr(p, 500, 460, 270, 180, 6), '#7a4a1c', 6);
    const pg = c.createLinearGradient(0, 470, 0, 630);
    pg.addColorStop(0, '#fbe7c6'); pg.addColorStop(1, '#f0cf96');
    c.fillStyle = pg; c.fillRect(512, 472, 246, 156);
    c.fillStyle = '#7d9a6a';
    c.beginPath(); c.moveTo(512, 628); c.lineTo(560, 560); c.lineTo(610, 600); c.lineTo(670, 530); c.lineTo(758, 600); c.lineTo(758, 628); c.closePath(); c.fill();
    c.strokeStyle = '#8a5a3a'; c.lineWidth = 7;
    c.beginPath(); c.moveTo(512, 612); c.lineTo(560, 572); c.lineTo(610, 604); c.lineTo(670, 544); c.lineTo(758, 600); c.stroke();
    c.fillStyle = '#8a5a3a';
    for (const [x, y] of [[560, 560], [670, 532]]) c.fillRect(x - 8, y - 14, 16, 18);
    c.fillStyle = '#e2333a'; c.beginPath(); c.arc(500 + 255 - 30, 470 + 26, 14, 0, Math.PI * 2); c.fill();
    c.fillStyle = RED; c.fillRect(730, 600, 18, 18);

    // ---- kinų mazgas (中国结) dešinėje ----
    const kx = 1700; const ky = 340;
    c.strokeStyle = GOLD; c.lineWidth = 3; c.beginPath(); c.moveTo(kx, 220); c.lineTo(kx, ky - 70); c.stroke();
    c.save(); c.translate(kx, ky); c.rotate(Math.PI / 4);
    shape(c, (p) => rr(p, -48, -48, 96, 96, 10), RED, 5, '#8a0f1f');
    c.strokeStyle = '#ff5a6e'; c.lineWidth = 4;
    for (let k = -30; k <= 30; k += 15) { c.beginPath(); c.moveTo(k, -44); c.lineTo(k, 44); c.stroke(); c.beginPath(); c.moveTo(-44, k); c.lineTo(44, k); c.stroke(); }
    c.restore();
    for (const dx of [-62, 62]) shape(c, (p) => p.arc(kx + dx, ky, 18, 0, Math.PI * 2), RED, 4, '#8a0f1f');
    shape(c, (p) => p.arc(kx, ky - 78, 14, 0, Math.PI * 2), RED, 4, '#8a0f1f');
    shape(c, (p) => p.arc(kx, ky + 80, 10, 0, Math.PI * 2), GOLD, 3);
    c.strokeStyle = RED; c.lineWidth = 4;
    for (let k = -14; k <= 14; k += 4) { c.beginPath(); c.moveTo(kx, ky + 88); c.lineTo(kx + k, ky + 190); c.stroke(); }
    // ritinys 福
    shape(c, (p) => rr(p, 1600, 250, 60, 300, 6), '#f3e6c4', 5);
    shape(c, (p) => rr(p, 1592, 240, 76, 14, 6), '#5a3420', 4);
    shape(c, (p) => rr(p, 1592, 546, 76, 14, 6), '#5a3420', 4);
    c.fillStyle = OUT; c.font = `bold 50px ${CJK_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('福', 1630, 380);
    c.fillStyle = RED; c.fillRect(1621, 500, 18, 18);

    // ---- grindys ir raudonas kilimas ----
    const fl = c.createLinearGradient(0, FLOOR_Y, 0, 1080);
    fl.addColorStop(0, '#8a5a2b'); fl.addColorStop(1, '#4a2c12');
    c.fillStyle = fl;
    c.fillRect(0, FLOOR_Y, 1920, 1080 - FLOOR_Y);
    c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 3;
    for (let i = -14; i <= 14; i++) { c.beginPath(); c.moveTo(960 + i * 60, FLOOR_Y); c.lineTo(960 + i * 160, 1080); c.stroke(); }
    shape(c, (p) => rr(p, -10, FLOOR_Y - 10, 1940, 16, 4), '#2a0a14', 0);
    shape(c, (p) => { p.moveTo(700, 800); p.lineTo(1620, 800); p.lineTo(1760, 1070); p.lineTo(560, 1070); p.closePath(); }, '#a0122e', 5, '#5a0a14');
    c.strokeStyle = GOLD; c.lineWidth = 5;
    c.beginPath(); c.moveTo(722, 816); c.lineTo(1598, 816); c.lineTo(1726, 1060); c.lineTo(594, 1060); c.closePath(); c.stroke();
    c.strokeStyle = 'rgba(232,182,58,.45)'; c.lineWidth = 3;
    for (const [x, y] of [[860, 880], [1160, 900], [1460, 880], [980, 990], [1340, 990]]) {
      c.beginPath(); c.arc(x, y, 18, Math.PI, 0); c.arc(x + 28, y, 13, Math.PI, 0); c.arc(x + 52, y + 4, 10, Math.PI, 0); c.stroke();
    }

    // ---- žema lentyna po langu: knygos, arbatinukas, panda, vaza su slyva ----
    shape(c, (p) => rr(p, 870, 700, 620, 16, 4), '#5a3420', 4);
    for (const x of [890, 1460]) shape(c, (p) => rr(p, x, 712, 14, 56, 3), '#5a3420', 3);
    const bookCols = ['#c8102e', '#e8b63a', '#2a7a6a', '#3b2a7a', '#ff7a3c'];
    let bx = 900;
    for (let i = 0; i < 7; i++) { const h = 46 + (i % 3) * 10; shape(c, (p) => rr(p, bx, 700 - h, 20, h, 3), bookCols[i % 5], 3); bx += 22; }
    // arbatinukas ir puodeliai
    shape(c, (p) => p.ellipse(1110, 672, 34, 26, 0, 0, Math.PI * 2), '#f4f7ff', 4);
    c.strokeStyle = '#2f6bff'; c.lineWidth = 3; c.beginPath(); c.ellipse(1110, 672, 22, 12, 0, 0, Math.PI * 2); c.stroke();
    shape(c, (p) => { p.moveTo(1142, 668); p.lineTo(1166, 652); p.lineTo(1168, 660); p.lineTo(1144, 678); p.closePath(); }, '#f4f7ff', 3);
    shape(c, (p) => p.arc(1110, 644, 6, 0, Math.PI * 2), '#f4f7ff', 3);
    for (const x of [1180, 1212]) shape(c, (p) => rr(p, x, 680, 22, 20, 6), '#f4f7ff', 3);
    // panda
    shape(c, (p) => p.ellipse(1300, 664, 40, 36, 0, 0, Math.PI * 2), '#ffffff', 5);
    shape(c, (p) => p.arc(1300, 618, 30, 0, Math.PI * 2), '#ffffff', 5);
    for (const [x, y, r] of [[1277, 594, 10], [1323, 594, 10]]) shape(c, (p) => p.arc(x, y, r, 0, Math.PI * 2), OUT, 0);
    for (const [x, y] of [[1289, 618], [1311, 618]]) shape(c, (p) => p.ellipse(x, y, 7, 9, 0, 0, Math.PI * 2), OUT, 0);
    shape(c, (p) => p.ellipse(1300, 631, 5, 4, 0, 0, Math.PI * 2), OUT, 0);
    for (const x of [1266, 1334]) shape(c, (p) => p.ellipse(x, 680, 12, 16, 0, 0, Math.PI * 2), OUT, 0);
    // vaza su slyvos šaka
    shape(c, (p) => { p.moveTo(1400, 700); p.quadraticCurveTo(1374, 660, 1392, 630); p.lineTo(1408, 630); p.quadraticCurveTo(1426, 660, 1400, 700); p.closePath(); }, '#f4f7ff', 4);
    c.strokeStyle = '#2f6bff'; c.lineWidth = 3; c.beginPath(); c.moveTo(1388, 662); c.quadraticCurveTo(1400, 670, 1412, 662); c.stroke();
    c.strokeStyle = '#3a1d0e'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(1400, 632); c.quadraticCurveTo(1380, 560, 1420, 500); c.stroke();
    c.beginPath(); c.moveTo(1392, 590); c.lineTo(1440, 560); c.stroke();
    for (const [x, y] of [[1420, 502], [1398, 540], [1440, 560], [1386, 580], [1412, 528]]) {
      for (let k = 0; k < 5; k++) { const a = (k * Math.PI * 2) / 5; c.fillStyle = PINK; c.beginPath(); c.arc(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 5, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill();
    }

    // ---- gongas ant stovo ----
    shape(c, (p) => rr(p, 1640, 700, 12, 190, 4), '#5a3420', 4);
    shape(c, (p) => rr(p, 1788, 700, 12, 190, 4), '#5a3420', 4);
    shape(c, (p) => rr(p, 1630, 694, 180, 14, 5), '#7a4a1c', 4);
    c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.moveTo(1690, 708); c.lineTo(1704, 742); c.moveTo(1750, 708); c.lineTo(1736, 742); c.stroke();
    const gg = c.createRadialGradient(1712, 784, 6, 1720, 790, 50);
    gg.addColorStop(0, '#ffe9a0'); gg.addColorStop(1, '#c8902a');
    shape(c, (p) => p.arc(1720, 790, 50, 0, Math.PI * 2), gg, 5);
    c.strokeStyle = 'rgba(122,74,28,.6)'; c.lineWidth = 2;
    for (const r of [16, 30, 42]) { c.beginPath(); c.arc(1720, 790, r, 0, Math.PI * 2); c.stroke(); }
    // bambukas vazone
    shape(c, (p) => rr(p, 1830, 690, 70, 80, 10), '#2a7a6a', 5);
    c.strokeStyle = '#3ddc84'; c.lineWidth = 8;
    for (const [x, h] of [[1846, 300], [1866, 360], [1886, 270]]) {
      c.beginPath(); c.moveTo(x, 690); c.lineTo(x, 690 - h); c.stroke();
      for (let y = 690 - 40; y > 690 - h; y -= 46) { c.fillStyle = '#2b9a5a'; c.beginPath(); c.ellipse(x + 16, y, 20, 6, -0.4, 0, Math.PI * 2); c.fill(); }
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
