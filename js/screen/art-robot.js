// 9 etapo "Dovanų robotas" (programavimo būrelis prie Baltojo tilto) laikini paveikslėliai, nupiešti kodu.
// Kiekvieną galima pakeisti tikru PNG per assets/manifest.json (tas pats raktas).

const OUT = '#14081f';
const PINK = '#ff3ea5';
const TEAL = '#2de2e6';
const YEL = '#ffd23f';

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

// ---------------- kilimėlio perspektyva ----------------
// Kilimėlis: COLS x ROWS langelių. u - skersai (-1..1), d - gylis (0 artimas kraštas, 1 tolimas).
export const MAT = { cols: 8, rows: 6, cx: 960, H: -821.7, N: 955, ZF: 1.3, HW: 760 };
export const matZ = (d) => 1 + (MAT.ZF - 1) * d;
export function matProj(u, d) {
  const z = matZ(d);
  return { x: MAT.cx + (u * MAT.HW) / z, y: MAT.H + (MAT.N - MAT.H) / z, s: 1 / z };
}
// langelio (stulpelis c, eilė r; r = 0 - tolimiausia) kraštai u/d koordinatėmis
export const cellU = (c) => -1 + (2 * c) / MAT.cols;
export const cellD = (r) => 1 - r / MAT.rows;
export function cellCenter(c, r) {
  return matProj(-1 + (2 * c + 1) / MAT.cols, 1 - (2 * r + 1) / (2 * MAT.rows));
}

function laptop(c, x, y, s, rnd) {
  shape(c, (p) => { p.moveTo(x - 46 * s, y); p.lineTo(x + 46 * s, y); p.lineTo(x + 56 * s, y + 10 * s); p.lineTo(x - 56 * s, y + 10 * s); p.closePath(); }, '#3a3550', 3);
  shape(c, (p) => rr(p, x - 40 * s, y - 56 * s, 80 * s, 54 * s, 5), '#24203a', 3);
  const g = c.createLinearGradient(0, y - 52 * s, 0, y - 6 * s);
  g.addColorStop(0, '#1b3b5a'); g.addColorStop(1, '#0e2236');
  c.fillStyle = g; c.fillRect(x - 35 * s, y - 51 * s, 70 * s, 44 * s);
  const cols = [TEAL, PINK, YEL, '#3ddc84', '#ffffff'];
  for (let i = 0; i < 6; i++) {
    c.fillStyle = cols[Math.floor(rnd() * cols.length)];
    c.fillRect(x - 31 * s + (i % 2) * 8 * s, y - 47 * s + i * 7 * s, (12 + rnd() * 34) * s, 3 * s);
  }
}

export function generateRobotArt(scene) {
  // ---------- fonas: būrelio klasė su langu į Baltąjį tiltą ----------
  tex(scene, 'robot_bg', 1920, 1080, (c) => {
    const rnd = seeded(99);
    const FLOOR = 545;
    const wall = c.createLinearGradient(0, 0, 0, FLOOR);
    wall.addColorStop(0, '#160a32');
    wall.addColorStop(1, '#2c1456');
    c.fillStyle = wall;
    c.fillRect(0, 0, 1920, FLOOR);
    // tinklelio raštas sienoje
    c.strokeStyle = 'rgba(45,226,230,.06)'; c.lineWidth = 2;
    for (let x = 0; x < 1920; x += 48) { c.beginPath(); c.moveTo(x, 90); c.lineTo(x, FLOOR); c.stroke(); }
    for (let y = 90; y < FLOOR; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(1920, y); c.stroke(); }
    // neoninės juostos
    for (const [y, col] of [[224, PINK], [FLOOR - 6, TEAL]]) {
      c.strokeStyle = col; c.lineWidth = 5; c.shadowColor = col; c.shadowBlur = 18;
      c.beginPath(); c.moveTo(0, y); c.lineTo(1920, y); c.stroke();
      c.shadowBlur = 0;
    }

    // ----- langas į Baltąjį tiltą -----
    const WX = 600; const WY = 240; const WW = 720; const WH = 280;
    c.save();
    c.beginPath(); c.rect(WX, WY, WW, WH); c.clip();
    const sky = c.createLinearGradient(0, WY, 0, WY + WH);
    sky.addColorStop(0, '#0b0826');
    sky.addColorStop(0.6, '#2a1a5e');
    sky.addColorStop(1, '#5a2d82');
    c.fillStyle = sky; c.fillRect(WX, WY, WW, WH);
    for (let i = 0; i < 50; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.5})`; c.fillRect(WX + rnd() * WW, WY + rnd() * 90, 2, 2); }
    // dangoraižiai kitame Neries krante
    const towers = [
      [640, 150, 60], [705, 120, 46], [760, 190, 70], [842, 96, 54], [905, 230, 40], // Europa - aukščiausias
      [955, 150, 66], [1030, 176, 58], [1098, 110, 48], [1150, 200, 74], [1232, 132, 56], [1290, 90, 50],
    ];
    const baseY = WY + 214;
    for (const [x, h, w] of towers) {
      const g = c.createLinearGradient(x, 0, x + w, 0);
      g.addColorStop(0, '#2c3a78'); g.addColorStop(1, '#1a2250');
      c.fillStyle = g;
      c.beginPath();
      if (h > 200) { c.moveTo(x, baseY); c.lineTo(x, baseY - h + 26); c.lineTo(x + w * 0.65, baseY - h); c.lineTo(x + w, baseY - h + 14); c.lineTo(x + w, baseY); }
      else { c.rect(x, baseY - h, w, h); }
      c.fill();
      for (let yy = baseY - h + 30; yy < baseY - 6; yy += 12) {
        for (let xx = x + 6; xx < x + w - 6; xx += 10) {
          if (rnd() < 0.45) { c.fillStyle = rnd() < 0.8 ? 'rgba(255,214,120,.85)' : 'rgba(45,226,230,.8)'; c.fillRect(xx, yy, 5, 6); }
        }
      }
    }
    // Neris su atspindžiais
    const river = c.createLinearGradient(0, baseY, 0, WY + WH);
    river.addColorStop(0, '#16245a'); river.addColorStop(1, '#0c1336');
    c.fillStyle = river; c.fillRect(WX, baseY, WW, WY + WH - baseY);
    for (let i = 0; i < 40; i++) {
      const x = WX + rnd() * WW; const y = baseY + 10 + rnd() * 50;
      c.fillStyle = rnd() < 0.7 ? 'rgba(255,214,120,.5)' : 'rgba(255,62,165,.5)';
      c.fillRect(x, y, 2 + rnd() * 10, 2);
    }
    // Baltasis tiltas
    const deck = (x) => WY + 236 - Math.sin(((x - WX) / WW) * Math.PI) * 14;
    for (const px of [WX + 150, WX + 360, WX + 570]) {
      shape(c, (p) => { p.moveTo(px - 10, deck(px) + 8); p.lineTo(px + 10, deck(px) + 8); p.lineTo(px + 14, WY + WH); p.lineTo(px - 14, WY + WH); p.closePath(); }, '#d9deee', 0);
    }
    c.strokeStyle = '#f5f7ff'; c.lineWidth = 12;
    c.beginPath(); for (let x = WX - 10; x <= WX + WW + 10; x += 10) { if (x === WX - 10) c.moveTo(x, deck(x) + 6); else c.lineTo(x, deck(x) + 6); } c.stroke();
    c.strokeStyle = '#ffffff'; c.lineWidth = 3;
    c.beginPath(); for (let x = WX - 10; x <= WX + WW + 10; x += 10) { if (x === WX - 10) c.moveTo(x, deck(x) - 12); else c.lineTo(x, deck(x) - 12); } c.stroke();
    for (let x = WX; x <= WX + WW; x += 18) { c.beginPath(); c.moveTo(x, deck(x) - 12); c.lineTo(x, deck(x)); c.stroke(); }
    for (let x = WX + 40; x < WX + WW; x += 120) {
      const lg = c.createRadialGradient(x, deck(x) - 30, 1, x, deck(x) - 30, 22);
      lg.addColorStop(0, 'rgba(255,230,160,.9)'); lg.addColorStop(1, 'rgba(255,230,160,0)');
      c.fillStyle = lg; c.fillRect(x - 22, deck(x) - 52, 44, 44);
      c.strokeStyle = '#e8ecff'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, deck(x) - 12); c.lineTo(x, deck(x) - 30); c.stroke();
    }
    // sniegas už lango
    for (let i = 0; i < 70; i++) { c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(WX + rnd() * WW, WY + rnd() * WH, 1 + rnd() * 2, 0, Math.PI * 2); c.fill(); }
    c.restore();
    // rėmas
    c.strokeStyle = '#0b0418'; c.lineWidth = 16; c.strokeRect(WX, WY, WW, WH);
    c.lineWidth = 8;
    c.beginPath(); c.moveTo(WX + WW / 3, WY); c.lineTo(WX + WW / 3, WY + WH); c.moveTo(WX + (2 * WW) / 3, WY); c.lineTo(WX + (2 * WW) / 3, WY + WH); c.stroke();
    shape(c, (p) => rr(p, WX - 20, WY + WH - 2, WW + 40, 16, 4), '#3a2a5e', 4);
    // užrašas ant palangės
    c.fillStyle = '#ffffff'; c.font = 'bold 15px Rubik, Arial, sans-serif'; c.textAlign = 'center';
    c.fillText('BALTASIS TILTAS · NERIS', WX + WW / 2, WY + WH + 11);

    // ----- kairė siena: neoninis užrašas, plakatas su kodu, lentyna -----
    c.textAlign = 'center';
    c.font = 'bold 34px Rubik, Arial, sans-serif';
    c.shadowColor = TEAL; c.shadowBlur = 16; c.fillStyle = TEAL;
    c.fillText('PROGRAMAVIMO', 300, 280);
    c.shadowColor = PINK; c.fillStyle = PINK;
    c.fillText('BŪRELIS</>', 300, 322);
    c.shadowBlur = 0;
    shape(c, (p) => rr(p, 120, 344, 230, 108, 10), '#0e0a24', 5, TEAL);
    c.textAlign = 'left'; c.font = 'bold 19px Menlo, Consolas, monospace';
    const code = [['if', PINK, ' (sniegas) {'], ['  kalėdos', YEL, '();'], ['}', '#ffffff', '']];
    code.forEach(([a, col, b], i) => {
      c.fillStyle = col; c.fillText(a, 136, 376 + i * 28);
      const w = c.measureText(a).width;
      c.fillStyle = '#d9c8ff'; c.fillText(b, 136 + w, 376 + i * 28);
    });
    // pikselinė širdelė
    const heart = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
    heart.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') { c.fillStyle = PINK; c.fillRect(400 + i * 12, 368 + j * 12, 11, 11); } }));

    // ----- dešinė siena: lentelė „KODAS“ ir lentyna -----
    shape(c, (p) => rr(p, 1420, 440, 440, 12, 3), '#5a3a78', 4);
    for (let i = 0; i < 4; i++) {
      // mažas robotukas ant lentynos
      const x = 1460 + i * 105;
      shape(c, (p) => rr(p, x, 400, 40, 40, 6), ['#c9d1f2', '#ffd23f', '#2de2e6', '#ff3ea5'][i], 3);
      c.fillStyle = OUT; c.fillRect(x + 9, 414, 6, 6); c.fillRect(x + 25, 414, 6, 6);
      c.strokeStyle = OUT; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 20, 400); c.lineTo(x + 20, 388); c.stroke();
      c.fillStyle = YEL; c.beginPath(); c.arc(x + 20, 386, 4, 0, Math.PI * 2); c.fill();
    }

    // ----- grindys -----
    const floor = c.createLinearGradient(0, FLOOR, 0, 1080);
    floor.addColorStop(0, '#2a2140');
    floor.addColorStop(1, '#3d2f5c');
    c.fillStyle = floor; c.fillRect(0, FLOOR, 1920, 1080 - FLOOR);
    c.strokeStyle = 'rgba(255,255,255,.05)'; c.lineWidth = 2;
    for (let i = -20; i < 40; i++) { c.beginPath(); c.moveTo(960 + i * 90, FLOOR); c.lineTo(960 + i * 200, 1080); c.stroke(); }
    // stalai su kompiuteriais palei sienas
    for (const [x0, x1] of [[20, 470], [1450, 1900]]) {
      shape(c, (p) => rr(p, x0, FLOOR - 30, x1 - x0, 22, 4), '#4b3a6e', 4);
      c.fillStyle = '#2a2140'; c.fillRect(x0 + 16, FLOOR - 8, 12, 46); c.fillRect(x1 - 28, FLOOR - 8, 12, 46);
      for (let x = x0 + 70; x < x1 - 40; x += 150) laptop(c, x, FLOOR - 30, 0.9, rnd);
    }
  });

  // ---------- robotas (3 veidai) ----------
  const robot = (face) => (c) => {
    // ratukai
    for (const x of [40, 110]) { shape(c, (p) => p.arc(x, 162, 16, 0, Math.PI * 2), '#2a2140', 5); shape(c, (p) => p.arc(x, 162, 6, 0, Math.PI * 2), '#c9d1f2', 2); }
    // kūnas
    shape(c, (p) => rr(p, 22, 98, 106, 62, 14), '#e8ecff', 6);
    shape(c, (p) => rr(p, 54, 112, 42, 30, 6), face === 'bug' ? '#ff4d5e' : PINK, 4);
    c.fillStyle = '#ffffff'; c.font = 'bold 20px Rubik, Arial, sans-serif'; c.textAlign = 'center';
    c.fillText('</>', 75, 134);
    // rankos
    c.strokeStyle = OUT; c.lineWidth = 6;
    c.beginPath(); c.moveTo(22, 116); c.lineTo(6, 136); c.moveTo(128, 116); c.lineTo(144, 136); c.stroke();
    c.strokeStyle = TEAL; c.lineWidth = 3;
    c.beginPath(); c.moveTo(22, 116); c.lineTo(6, 136); c.moveTo(128, 116); c.lineTo(144, 136); c.stroke();
    // galva
    shape(c, (p) => rr(p, 30, 30, 90, 70, 16), '#e8ecff', 6);
    shape(c, (p) => rr(p, 40, 40, 70, 48, 10), face === 'bug' ? '#4a0d1e' : '#0e1a3a', 4);
    c.lineWidth = 5;
    if (face === 'bug') {
      c.strokeStyle = '#ff4d5e';
      for (const x of [58, 92]) { c.beginPath(); c.moveTo(x - 7, 52); c.lineTo(x + 7, 66); c.moveTo(x + 7, 52); c.lineTo(x - 7, 66); c.stroke(); }
      c.beginPath(); c.moveTo(62, 80); c.quadraticCurveTo(75, 72, 88, 80); c.stroke();
    } else if (face === 'joy') {
      c.strokeStyle = YEL;
      for (const x of [58, 92]) { c.beginPath(); c.moveTo(x - 8, 62); c.lineTo(x, 52); c.lineTo(x + 8, 62); c.stroke(); }
      c.beginPath(); c.moveTo(60, 72); c.quadraticCurveTo(75, 86, 90, 72); c.stroke();
    } else {
      c.fillStyle = TEAL;
      for (const x of [58, 92]) c.fillRect(x - 6, 52, 12, 16);
      c.strokeStyle = TEAL;
      c.beginPath(); c.moveTo(62, 76); c.quadraticCurveTo(75, 84, 88, 76); c.stroke();
    }
    // antena su žvaigžde
    c.strokeStyle = OUT; c.lineWidth = 5;
    c.beginPath(); c.moveTo(75, 30); c.lineTo(75, 12); c.stroke();
    c.fillStyle = YEL; c.strokeStyle = OUT; c.lineWidth = 3;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? 5 : 11;
      const x = 75 + Math.cos(a) * r; const y = 10 + Math.sin(a) * r;
      if (i) c.lineTo(x, y); else c.moveTo(x, y);
    }
    c.closePath(); c.fill(); c.stroke();
  };
  tex(scene, 'rb_robot', 150, 180, robot('ok'));
  tex(scene, 'rb_robot_bug', 150, 180, robot('bug'));
  tex(scene, 'rb_robot_joy', 150, 180, robot('joy'));

  // ---------- dovana ----------
  tex(scene, 'rb_gift', 90, 90, (c) => {
    shape(c, (p) => rr(p, 12, 34, 66, 50, 6), PINK, 5);
    shape(c, (p) => rr(p, 8, 24, 74, 16, 5), '#ff7ac4', 5);
    c.fillStyle = YEL; c.fillRect(39, 26, 12, 56);
    c.strokeStyle = OUT; c.lineWidth = 3; c.strokeRect(39, 26, 12, 56);
    shape(c, (p) => { p.ellipse(33, 16, 13, 8, -0.5, 0, Math.PI * 2); }, YEL, 3);
    shape(c, (p) => { p.ellipse(57, 16, 13, 8, 0.5, 0, Math.PI * 2); }, YEL, 3);
  });
  // ---------- pusnis (kliūtis) ----------
  tex(scene, 'rb_pile', 150, 90, (c) => {
    shape(c, (p) => { p.moveTo(6, 84); p.quadraticCurveTo(20, 30, 54, 36); p.quadraticCurveTo(76, 4, 104, 30); p.quadraticCurveTo(140, 30, 144, 84); p.closePath(); }, '#f4f7ff', 5);
    c.strokeStyle = 'rgba(120,140,200,.5)'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(40, 64); c.quadraticCurveTo(70, 50, 100, 62); c.stroke();
    c.fillStyle = '#9fd8ff';
    for (const [x, y] of [[60, 30], [90, 24], [120, 44]]) { c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill(); }
  });
  // ---------- eglutė (tikslas), užgesusi ir uždegta ----------
  const tree = (lit) => (c) => {
    shape(c, (p) => rr(p, 58, 128, 24, 22, 3), '#6b3b1f', 4);
    const tiers = [[70, 26, 30, 64], [70, 50, 44, 96], [70, 78, 58, 130]];
    for (const [x, top, hw, bot] of tiers) {
      shape(c, (p) => { p.moveTo(x, top); p.lineTo(x - hw, bot); p.lineTo(x + hw, bot); p.closePath(); }, '#1f8a5a', 5);
    }
    const cols = lit ? [YEL, PINK, TEAL, '#ffffff', '#ff7a3c'] : ['#3a5a4a'];
    const pts = [[60, 60], [82, 66], [52, 90], [74, 94], [92, 86], [44, 120], [66, 122], [90, 118], [104, 124]];
    pts.forEach(([x, y], i) => {
      if (lit) { c.fillStyle = 'rgba(255,240,150,.35)'; c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = cols[i % cols.length]; c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
    });
    c.fillStyle = lit ? YEL : '#6b6b4a'; c.strokeStyle = OUT; c.lineWidth = 3;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? 7 : 16;
      const x = 70 + Math.cos(a) * r; const y = 20 + Math.sin(a) * r;
      if (i) c.lineTo(x, y); else c.moveTo(x, y);
    }
    c.closePath(); c.fill(); c.stroke();
  };
  tex(scene, 'rb_goal', 140, 152, tree(false));
  tex(scene, 'rb_goal_lit', 140, 152, tree(true));

  // ---------- besmegenis kasėjas (galva - vaiko avataras, dedama kode) ----------
  tex(scene, 'rb_digger', 80, 92, (c) => {
    shape(c, (p) => p.arc(40, 64, 26, 0, Math.PI * 2), '#f4f7ff', 5);
    shape(c, (p) => p.arc(40, 28, 19, 0, Math.PI * 2), '#f4f7ff', 5);
    shape(c, (p) => rr(p, 20, 6, 40, 11, 5), PINK, 4);
    c.fillStyle = OUT;
    for (const y of [26, 40, 60, 74]) { c.beginPath(); c.arc(40, y, 3.2, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = '#5a3420'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(22, 30); c.lineTo(6, 18); c.stroke();
  });
  // ---------- kastuvas (sukasi apie rankenos viršų) ----------
  tex(scene, 'rb_shovel', 34, 84, (c) => {
    c.strokeStyle = '#7a4a1c'; c.lineWidth = 6;
    c.beginPath(); c.moveTo(17, 6); c.lineTo(17, 56); c.stroke();
    c.strokeStyle = OUT; c.lineWidth = 3;
    c.beginPath(); c.moveTo(9, 6); c.lineTo(25, 6); c.stroke();
    shape(c, (p) => { p.moveTo(5, 54); p.lineTo(29, 54); p.lineTo(27, 78); p.quadraticCurveTo(17, 84, 7, 78); p.closePath(); }, TEAL, 4);
  });
}
