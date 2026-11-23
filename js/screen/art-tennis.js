// 8 etapo "Tenisas" (Sereikiškių parkas) laikini paveikslėliai, nupiešti kodu.
// Kortai tarp Gedimino kalno ir Vilnelės; už upelio - Trijų kryžių kalnas.
// Kiekvieną paveikslėlį galima pakeisti tikru PNG per assets/manifest.json (tas pats raktas).

const OUT = '#14081f';
const PINK = '#ff3ea5';
const GX = 150; // Gedimino kalno poslinkis
const TEAL = '#2de2e6';

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

// ---------------- korto perspektyva ----------------
// u - skersai (-1 kairė dvejetų linija, +1 dešinė), d - išilgai (0 artimoji galinė linija, 1 tolimoji),
// h - aukštis virš žemės. Ta pati formulė ir fone, ir scenoje.
export const COURT = { cx: 960, H: -155.6, N: 900, ZF: 1.9, HW: 700, K: 140 };
export const zOf = (d) => 1 + (COURT.ZF - 1) * d;
export function proj(u, d, h = 0) {
  const z = zOf(d);
  return { x: COURT.cx + (u * COURT.HW) / z, y: COURT.H + (COURT.N - COURT.H) / z - (h * COURT.K) / z, s: 1 / z };
}
export const NET_H = 0.5;

function quad(c, pts, fill, lw = 0, stroke = OUT) {
  shape(c, (x) => { x.moveTo(pts[0].x, pts[0].y); for (const p of pts.slice(1)) x.lineTo(p.x, p.y); x.closePath(); }, fill, lw, stroke);
}

function line(c, a, b, w, col = '#ffffff') {
  c.strokeStyle = col; c.lineWidth = w;
  c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
}

function spruce(c, x, y, h, rnd) {
  const w = h * 0.42;
  c.fillStyle = '#123129';
  for (let i = 0; i < 3; i++) {
    const ty = y - h + (i * h) / 3.2;
    const bw = (w * (i + 1.4)) / 3.4;
    c.beginPath(); c.moveTo(x, ty); c.lineTo(x - bw, ty + h / 2.4); c.lineTo(x + bw, ty + h / 2.4); c.closePath(); c.fill();
    c.fillStyle = 'rgba(240,246,255,.85)';
    c.beginPath(); c.moveTo(x, ty + 2); c.lineTo(x - bw * 0.55, ty + h / 5); c.lineTo(x + bw * 0.4, ty + h / 6); c.closePath(); c.fill();
    c.fillStyle = '#123129';
  }
  if (rnd() < 0.5) { c.fillStyle = 'rgba(240,246,255,.9)'; c.beginPath(); c.arc(x, y - h + 3, 3, 0, Math.PI * 2); c.fill(); }
}

function bareTree(c, x, y, h, rnd) {
  c.strokeStyle = '#2a1c3a'; c.lineCap = 'round';
  c.lineWidth = Math.max(3, h / 18);
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rnd() - 0.5) * 6, y - h * 0.55); c.stroke();
  const branch = (bx, by, len, ang, depth) => {
    if (depth === 0 || len < 4) return;
    const ex = bx + Math.cos(ang) * len; const ey = by + Math.sin(ang) * len;
    c.lineWidth = Math.max(1.2, depth * 1.6);
    c.strokeStyle = '#2a1c3a';
    c.beginPath(); c.moveTo(bx, by); c.lineTo(ex, ey); c.stroke();
    // sniegas ant šakos
    c.strokeStyle = 'rgba(244,248,255,.9)'; c.lineWidth = Math.max(1, depth);
    c.beginPath(); c.moveTo(bx, by - 1.5); c.lineTo(ex, ey - 1.5); c.stroke();
    branch(ex, ey, len * 0.7, ang - 0.45 - rnd() * 0.2, depth - 1);
    branch(ex, ey, len * 0.68, ang + 0.4 + rnd() * 0.2, depth - 1);
  };
  const top = y - h * 0.55;
  branch(x, top, h * 0.28, -Math.PI / 2 - 0.5, 4);
  branch(x, top, h * 0.3, -Math.PI / 2 + 0.45, 4);
  branch(x, top + h * 0.1, h * 0.22, -Math.PI / 2 + 1.0, 3);
}

function lamp(c, x, y, h) {
  const g = c.createRadialGradient(x, y - h, 2, x, y - h, 46);
  g.addColorStop(0, 'rgba(255,214,120,.85)');
  g.addColorStop(1, 'rgba(255,214,120,0)');
  c.fillStyle = g; c.fillRect(x - 46, y - h - 46, 92, 92);
  c.strokeStyle = '#1b1030'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.stroke();
  shape(c, (p) => rr(p, x - 7, y - h - 14, 14, 16, 3), '#ffe39a', 3);
}

export function generateTennisArt(scene) {
  // ---------- fonas: kortas, Gedimino kalnas, Vilnelė, Trijų kryžių kalnas ----------
  tex(scene, 'tennis_bg', 1920, 1080, (c) => {
    const rnd = seeded(88);
    // dangus - žiemos vakaras
    const sky = c.createLinearGradient(0, 0, 0, 430);
    sky.addColorStop(0, '#120830');
    sky.addColorStop(0.5, '#43206f');
    sky.addColorStop(0.85, '#c8568f');
    sky.addColorStop(1, '#ff9ab8');
    c.fillStyle = sky;
    c.fillRect(0, 0, 1920, 430);
    for (let i = 0; i < 110; i++) {
      c.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.6})`;
      c.beginPath(); c.arc(rnd() * 1920, rnd() * 210, 0.8 + rnd() * 1.6, 0, Math.PI * 2); c.fill();
    }
    // mėnulis
    c.fillStyle = 'rgba(255,244,214,.18)'; c.beginPath(); c.arc(1420, 84, 50, 0, Math.PI * 2); c.fill();
    shape(c, (p) => p.arc(1420, 84, 28, 0, Math.PI * 2), '#fff4d6', 0);

    // Trijų kryžių kalnas (toli, dešinėje, už Vilnelės)
    const far = c.createLinearGradient(0, 160, 0, 420);
    far.addColorStop(0, '#2f3d66');
    far.addColorStop(1, '#3d4f80');
    shape(c, (p) => {
      p.moveTo(1080, 420); p.bezierCurveTo(1300, 330, 1480, 180, 1650, 176);
      p.bezierCurveTo(1780, 176, 1860, 230, 1920, 252); p.lineTo(1920, 420); p.closePath();
    }, far, 0);
    c.strokeStyle = 'rgba(235,242,255,.35)'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(1290, 330); c.bezierCurveTo(1430, 250, 1540, 196, 1650, 192); c.stroke();
    for (let i = 0; i < 26; i++) {
      const x = 1200 + rnd() * 720; const top = x < 1650 ? 176 + ((1650 - x) / 570) * 200 : 176 + ((x - 1650) / 270) * 76;
      const y = top + 20 + rnd() * (420 - top - 20);
      c.fillStyle = 'rgba(20,32,56,.75)';
      c.beginPath(); c.moveTo(x, y - 22); c.lineTo(x - 8, y); c.lineTo(x + 8, y); c.closePath(); c.fill();
    }
    // trys kryžiai (apšviesti)
    const glow = c.createRadialGradient(1650, 140, 4, 1650, 140, 90);
    glow.addColorStop(0, 'rgba(255,255,255,.35)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = glow; c.fillRect(1560, 50, 180, 180);
    for (const [x, h, tilt] of [[1622, 52, -0.06], [1650, 68, 0], [1678, 52, 0.06]]) {
      c.save(); c.translate(x, 180); c.rotate(tilt);
      shape(c, (p) => rr(p, -4, -h, 8, h, 2), '#f6f8ff', 2, '#9aa6c8');
      shape(c, (p) => rr(p, -15, -h + 12, 30, 7, 2), '#f6f8ff', 2, '#9aa6c8');
      c.restore();
    }

    // Sereikiškių parko medžiai tolimajame Vilnelės krante
    for (let i = 0; i < 22; i++) {
      const x = 880 + rnd() * 1060; const y = 326 + rnd() * 14;
      if (rnd() < 0.55) bareTree(c, x, y, 56 + rnd() * 44, rnd); else spruce(c, x, y, 40 + rnd() * 30, rnd);
    }

    // Vilnelė - vingiuoja iš dešinės ir dingsta už Gedimino kalno
    const river = [[1940, 352], [1700, 340], [1500, 362], [1290, 352], [1080, 366], [880, 356], [700, 368]];
    const stroke = (w, col) => {
      c.strokeStyle = col; c.lineWidth = w;
      c.beginPath(); c.moveTo(river[0][0], river[0][1]);
      for (let i = 1; i < river.length - 1; i++) {
        const mx = (river[i][0] + river[i + 1][0]) / 2; const my = (river[i][1] + river[i + 1][1]) / 2;
        c.quadraticCurveTo(river[i][0], river[i][1], mx, my);
      }
      c.lineTo(river[river.length - 1][0], river[river.length - 1][1]);
      c.stroke();
    };
    stroke(44, '#f2f6ff');      // snieguoti krantai
    stroke(30, '#24618f');
    stroke(14, '#3f8fc4');
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3;
    for (let i = 0; i < 16; i++) {
      const x = 760 + rnd() * 1150; const y = 350 + Math.sin(x / 140) * 6 + (rnd() - 0.5) * 8;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 12 + rnd() * 18, y); c.stroke();
    }
    // tiltelis per Vilnelę
    c.strokeStyle = '#3a2440'; c.lineWidth = 7;
    c.beginPath(); c.moveTo(1240, 368); c.quadraticCurveTo(1300, 322, 1360, 366); c.stroke();
    c.strokeStyle = '#f2f6ff'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(1240, 362); c.quadraticCurveTo(1300, 318, 1360, 360); c.stroke();
    c.strokeStyle = '#3a2440'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(1244, 348); c.quadraticCurveTo(1300, 300, 1356, 346); c.stroke();
    for (let i = 0; i <= 6; i++) {
      const t = i / 6; const x = 1244 + t * 112; const y = 348 - Math.sin(t * Math.PI) * 24;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 16); c.stroke();
    }

    // Gedimino kalnas (kairėje; pastumtas į dešinę, kad bokšto neuždengtų užrašai)
    c.save();
    c.translate(GX, 0);
    const hill = c.createLinearGradient(0, 190, 0, 430);
    hill.addColorStop(0, '#244a40');
    hill.addColorStop(1, '#1a3a33');
    shape(c, (p) => {
      p.moveTo(-10 - GX, 430); p.bezierCurveTo(60, 380, 220, 236, 330, 214);
      p.lineTo(640, 206); p.bezierCurveTo(740, 230, 820, 360, 960, 430); p.closePath();
    }, hill, 0);
    // sniegas šlaituose ir takas
    c.fillStyle = 'rgba(240,246,255,.85)';
    shape(c, (p) => { p.moveTo(320, 218); p.lineTo(648, 210); p.quadraticCurveTo(560, 236, 470, 230); p.quadraticCurveTo(380, 236, 320, 218); p.closePath(); }, 'rgba(240,246,255,.9)', 0);
    c.strokeStyle = 'rgba(240,246,255,.55)'; c.lineWidth = 6;
    c.beginPath(); c.moveTo(700, 420); c.lineTo(760, 380); c.lineTo(640, 330); c.lineTo(730, 290); c.lineTo(640, 240); c.stroke();
    for (let i = 0; i < 46; i++) {
      const x = 40 + rnd() * 880;
      const top = x < 330 ? 214 + ((330 - x) / 340) * 200 : x > 640 ? 206 + ((x - 640) / 320) * 220 : 214;
      const y = top + 30 + rnd() * Math.max(10, 420 - top - 30);
      if (x > 420 && x < 560 && y < 260) continue;
      if (rnd() < 0.6) spruce(c, x, y, 22 + rnd() * 26, rnd); else bareTree(c, x, y, 30 + rnd() * 30, rnd);
    }
    // pilies sienos likučiai
    c.fillStyle = '#8c3b2b';
    shape(c, (p) => rr(p, 360, 192, 70, 22, 3), '#9a4430', 4);
    shape(c, (p) => rr(p, 560, 190, 60, 20, 3), '#9a4430', 4);
    // Gedimino pilies bokštas (apšviestas)
    const tg = c.createRadialGradient(486, 130, 10, 486, 130, 150);
    tg.addColorStop(0, 'rgba(255,200,120,.45)');
    tg.addColorStop(1, 'rgba(255,200,120,0)');
    c.fillStyle = tg; c.fillRect(330, -20, 320, 300);
    const brick = c.createLinearGradient(430, 0, 545, 0);
    brick.addColorStop(0, '#b4553a');
    brick.addColorStop(0.55, '#d0704c');
    brick.addColorStop(1, '#8e3a28');
    shape(c, (p) => { p.moveTo(428, 210); p.lineTo(436, 126); p.lineTo(538, 126); p.lineTo(546, 210); p.closePath(); }, brick, 5);
    shape(c, (p) => { p.moveTo(442, 128); p.lineTo(446, 70); p.lineTo(528, 70); p.lineTo(532, 128); p.closePath(); }, brick, 5);
    // briaunos (aštuonkampis) ir plytų eilės
    c.strokeStyle = 'rgba(80,25,15,.45)'; c.lineWidth = 2;
    for (const x of [462, 512]) { c.beginPath(); c.moveTo(x, 72); c.lineTo(x + (x < 487 ? -6 : 6), 208); c.stroke(); }
    for (let y = 80; y < 208; y += 9) { c.beginPath(); c.moveTo(y < 128 ? 446 : 436, y); c.lineTo(y < 128 ? 528 : 538, y); c.stroke(); }
    // langai
    const win = (x, y, lit) => shape(c, (p) => { p.moveTo(x - 6, y + 14); p.lineTo(x - 6, y); p.arc(x, y, 6, Math.PI, 0); p.lineTo(x + 6, y + 14); p.closePath(); }, lit ? '#ffd88a' : '#3a1820', 3);
    win(470, 150, true); win(504, 150, false); win(487, 182, true); win(470, 92, false); win(504, 92, true);
    // apžvalgos aikštelė su turėklais
    shape(c, (p) => rr(p, 438, 60, 98, 12, 2), '#6d2b1f', 4);
    c.strokeStyle = OUT; c.lineWidth = 3;
    c.beginPath(); c.moveTo(440, 46); c.lineTo(534, 46); c.stroke();
    for (let x = 442; x <= 532; x += 10) { c.beginPath(); c.moveTo(x, 46); c.lineTo(x, 60); c.stroke(); }
    // vėliava - trispalvė
    c.strokeStyle = '#e8e8f0'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(487, 46); c.lineTo(487, -2 + 14); c.stroke();
    const fx = 489; const fy = 14;
    for (const [i, col] of [[0, '#fdb913'], [1, '#006a44'], [2, '#c1272d']]) {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(fx, fy + i * 9);
      c.quadraticCurveTo(fx + 22, fy + i * 9 - 5, fx + 44, fy + i * 9);
      c.lineTo(fx + 44, fy + i * 9 + 9);
      c.quadraticCurveTo(fx + 22, fy + i * 9 + 4, fx, fy + i * 9 + 9);
      c.closePath(); c.fill();
    }
    c.strokeStyle = OUT; c.lineWidth = 2; c.strokeRect(fx, fy, 44, 27);
    c.restore();

    // Sereikiškių parkas: keli medžiai ir žibintai artimajame krante (kad upelis matytųsi)
    for (const x of [930, 1050, 1420, 1560, 1690, 1830]) {
      if (rnd() < 0.6) bareTree(c, x + rnd() * 30, 398 + rnd() * 10, 64 + rnd() * 36, rnd); else spruce(c, x + rnd() * 30, 400, 46 + rnd() * 24, rnd);
    }
    for (let i = 0; i < 10; i++) bareTree(c, 20 + rnd() * 380, 400 + rnd() * 20, 70 + rnd() * 40, rnd);
    for (const x of [900, 1180, 1460, 1760]) lamp(c, x, 404, 54);

    // žemė - sniegas
    const snowG = c.createLinearGradient(0, 390, 0, 1080);
    snowG.addColorStop(0, '#e9efff');
    snowG.addColorStop(1, '#b7c3ee');
    c.fillStyle = snowG;
    c.fillRect(0, 392, 1920, 688);
    c.fillStyle = 'rgba(255,255,255,.7)';
    for (let i = 0; i < 30; i++) { c.beginPath(); c.ellipse(rnd() * 1920, 400 + rnd() * 30, 30 + rnd() * 60, 6, 0, 0, Math.PI * 2); c.fill(); }

    // korto aplinka (žalia) ir pats kortas (mėlynas)
    quad(c, [proj(-1.34, 1.16), proj(1.34, 1.16), proj(1.34, -0.2), proj(-1.34, -0.2)], '#2f7363', 6, '#1f4f45');
    quad(c, [proj(-1, 1), proj(1, 1), proj(1, 0), proj(-1, 0)], '#2b5fb8');
    // sniego kauburiai aplink kortą
    c.fillStyle = 'rgba(246,249,255,.95)';
    for (let i = 0; i <= 26; i++) {
      const d = 1.16 - (i / 26) * 1.36;
      for (const side of [-1, 1]) {
        const p = proj(side * 1.38, d);
        c.beginPath(); c.arc(p.x, p.y, 10 + p.s * 14 + rnd() * 6, Math.PI, 0); c.fill();
      }
    }
    // linijos
    const W = (d) => 7 / zOf(d);
    const L = (u0, d0, u1, d1, w) => line(c, proj(u0, d0), proj(u1, d1), w);
    L(-1, 1, 1, 1, W(1)); L(-1, 0, 1, 0, W(0) * 1.2);
    L(-1, 0, -1, 1, 4); L(1, 0, 1, 1, 4);
    L(-0.76, 0, -0.76, 1, 4); L(0.76, 0, 0.76, 1, 4);
    L(-0.76, 0.231, 0.76, 0.231, W(0.231)); L(-0.76, 0.769, 0.76, 0.769, W(0.769));
    L(0, 0.231, 0, 0.769, 4);
    L(0, 0, 0, 0.025, 4); L(0, 1, 0, 0.975, 3);
    // tolimoji tvora (permatoma)
    const fy0 = proj(0, 1.16).y; const fx0 = proj(-1.34, 1.16).x; const fx1 = proj(1.34, 1.16).x;
    c.strokeStyle = 'rgba(30,20,50,.28)'; c.lineWidth = 2;
    for (let x = fx0; x < fx1; x += 16) {
      c.beginPath(); c.moveTo(x, fy0); c.lineTo(x + 70, fy0 - 70); c.stroke();
      c.beginPath(); c.moveTo(x + 70, fy0); c.lineTo(x, fy0 - 70); c.stroke();
    }
    c.strokeStyle = '#2a2140'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(fx0, fy0 - 74); c.lineTo(fx1, fy0 - 74); c.stroke();
    for (let x = fx0; x <= fx1 + 1; x += (fx1 - fx0) / 8) { c.beginPath(); c.moveTo(x, fy0 + 2); c.lineTo(x, fy0 - 76); c.stroke(); }
    // tinklas
    const nl = proj(-1.08, 0.5); const nr = proj(1.08, 0.5);
    const nt = proj(0, 0.5, NET_H).y; const nb = nl.y;
    c.fillStyle = 'rgba(20,12,36,.55)';
    c.fillRect(nl.x, nt, nr.x - nl.x, nb - nt);
    c.strokeStyle = 'rgba(230,236,255,.35)'; c.lineWidth = 1.5;
    for (let x = nl.x; x <= nr.x; x += 10) { c.beginPath(); c.moveTo(x, nt); c.lineTo(x, nb); c.stroke(); }
    for (let y = nt; y <= nb; y += 8) { c.beginPath(); c.moveTo(nl.x, y); c.lineTo(nr.x, y); c.stroke(); }
    shape(c, (p) => rr(p, nl.x, nt - 3, nr.x - nl.x, 8, 3), '#ffffff', 2);
    for (const p0 of [nl, nr]) shape(c, (p) => rr(p, p0.x - 6, nt - 10, 12, nb - nt + 12, 3), '#2a2140', 3);
    // užrašas
    shape(c, (p) => rr(p, 1716, 470, 196, 66, 10), '#2a1840', 5);
    c.strokeStyle = '#3a2440'; c.lineWidth = 7;
    c.beginPath(); c.moveTo(1760, 536); c.lineTo(1760, 600); c.moveTo(1868, 536); c.lineTo(1868, 600); c.stroke();
    c.fillStyle = TEAL; c.font = 'bold 20px Rubik, Arial, sans-serif'; c.textAlign = 'center';
    c.fillText('SEREIKIŠKIŲ', 1814, 497);
    c.fillStyle = '#ffffff'; c.fillText('PARKAS · TENISAS', 1814, 524);
  });

  // ---------- Sniego senis su raketę ----------
  tex(scene, 'tn_snowman', 220, 290, (c) => {
    shape(c, (p) => p.arc(110, 230, 56, 0, Math.PI * 2), '#f4f7ff');
    shape(c, (p) => p.arc(110, 152, 44, 0, Math.PI * 2), '#f4f7ff');
    shape(c, (p) => p.arc(110, 76, 40, 0, Math.PI * 2), '#f4f7ff');
    // kairė ranka - šakelė
    c.strokeStyle = '#5a3420'; c.lineWidth = 6;
    c.beginPath(); c.moveTo(70, 146); c.lineTo(24, 112); c.moveTo(36, 121); c.lineTo(24, 132); c.moveTo(30, 116); c.lineTo(16, 104); c.stroke();
    // kepurė su bumbulu
    shape(c, (p) => { p.moveTo(74, 48); p.quadraticCurveTo(110, -14, 146, 48); p.closePath(); }, TEAL, 5);
    shape(c, (p) => rr(p, 70, 38, 80, 16, 7), PINK, 5);
    shape(c, (p) => p.arc(110, 12, 11, 0, Math.PI * 2), '#ffffff', 4);
    // veidas
    c.fillStyle = OUT;
    for (const [x, y] of [[96, 70], [124, 70]]) { c.beginPath(); c.arc(x, y, 5.5, 0, Math.PI * 2); c.fill(); }
    for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(94 + i * 8, 94 + Math.sin((i / 4) * Math.PI) * 5, 2.6, 0, Math.PI * 2); c.fill(); }
    shape(c, (p) => { p.moveTo(110, 76); p.lineTo(148, 82); p.lineTo(110, 87); p.closePath(); }, '#ff8a2a', 4);
    // šalikas
    shape(c, (p) => rr(p, 70, 110, 80, 16, 8), PINK, 5);
    shape(c, (p) => rr(p, 120, 118, 18, 44, 6), PINK, 5);
    c.strokeStyle = TEAL; c.lineWidth = 3;
    c.beginPath(); c.moveTo(124, 144); c.lineTo(134, 144); c.moveTo(124, 152); c.lineTo(134, 152); c.stroke();
    // anglies sagos
    c.fillStyle = OUT;
    for (const y of [150, 172, 214, 242]) { c.beginPath(); c.arc(106, y, 5, 0, Math.PI * 2); c.fill(); }
  });
  // dešinė ranka su raketę (sukasi apie petį: kairysis kraštas)
  tex(scene, 'tn_snow_arm', 210, 90, (c) => {
    c.strokeStyle = '#5a3420'; c.lineWidth = 6;
    c.beginPath(); c.moveTo(6, 45); c.lineTo(82, 45); c.stroke();
    shape(c, (p) => rr(p, 78, 39, 44, 12, 5), '#2a1840', 3);
    shape(c, (p) => p.ellipse(160, 45, 40, 32, 0, 0, Math.PI * 2), 'rgba(255,255,255,.18)', 7, TEAL);
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5;
    for (let i = -3; i <= 3; i++) {
      c.beginPath(); c.moveTo(160 + i * 10, 45 - Math.sqrt(Math.max(0, 1 - (i * 10 / 40) ** 2)) * 30); c.lineTo(160 + i * 10, 45 + Math.sqrt(Math.max(0, 1 - (i * 10 / 40) ** 2)) * 30); c.stroke();
      c.beginPath(); c.moveTo(160 - Math.sqrt(Math.max(0, 1 - (i * 8 / 32) ** 2)) * 38, 45 + i * 8); c.lineTo(160 + Math.sqrt(Math.max(0, 1 - (i * 8 / 32) ** 2)) * 38, 45 + i * 8); c.stroke();
    }
  });

  // ---------- Adrianos raketė (laikoma už rankenos apačioje) ----------
  tex(scene, 'tn_racket', 80, 180, (c) => {
    shape(c, (p) => rr(p, 33, 92, 14, 82, 6), '#2a1840', 4);
    c.strokeStyle = PINK; c.lineWidth = 3;
    for (let y = 104; y < 170; y += 10) { c.beginPath(); c.moveTo(34, y); c.lineTo(46, y + 6); c.stroke(); }
    shape(c, (p) => { p.moveTo(40, 92); p.lineTo(24, 74); p.moveTo(40, 92); p.lineTo(56, 74); }, null, 6, PINK);
    shape(c, (p) => p.ellipse(40, 46, 32, 42, 0, 0, Math.PI * 2), 'rgba(255,255,255,.2)', 8, PINK);
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.5;
    for (let i = -3; i <= 3; i++) {
      const dx = i * 8; const hy = Math.sqrt(Math.max(0, 1 - (dx / 32) ** 2)) * 40;
      c.beginPath(); c.moveTo(40 + dx, 46 - hy); c.lineTo(40 + dx, 46 + hy); c.stroke();
      const dy = i * 10; const hx = Math.sqrt(Math.max(0, 1 - (dy / 42) ** 2)) * 30;
      c.beginPath(); c.moveTo(40 - hx, 46 + dy); c.lineTo(40 + hx, 46 + dy); c.stroke();
    }
  });

  // ---------- kamuoliukas ir šešėlis ----------
  tex(scene, 'tn_ball', 44, 44, (c) => {
    shape(c, (p) => p.arc(22, 22, 18, 0, Math.PI * 2), '#d9f43a', 4);
    c.strokeStyle = '#ffffff'; c.lineWidth = 3;
    c.beginPath(); c.arc(4, 22, 14, -0.9, 0.9); c.stroke();
    c.beginPath(); c.arc(40, 22, 14, Math.PI - 0.9, Math.PI + 0.9); c.stroke();
  });
  tex(scene, 'tn_shadow', 60, 24, (c) => {
    c.fillStyle = 'rgba(10,6,30,.35)';
    c.beginPath(); c.ellipse(30, 12, 28, 10, 0, 0, Math.PI * 2); c.fill();
  });

  // ---------- teisėjos bokštelis ----------
  tex(scene, 'tn_chair', 160, 300, (c) => {
    c.strokeStyle = '#e8ecff'; c.lineWidth = 9;
    c.beginPath(); c.moveTo(30, 296); c.lineTo(46, 110); c.moveTo(130, 296); c.lineTo(114, 110); c.stroke();
    c.strokeStyle = OUT; c.lineWidth = 3;
    c.beginPath(); c.moveTo(30, 296); c.lineTo(46, 110); c.moveTo(130, 296); c.lineTo(114, 110); c.stroke();
    for (let y = 140; y < 290; y += 34) {
      const t = (y - 110) / 186; const x0 = 46 - t * 16; const x1 = 114 + t * 16;
      shape(c, (p) => rr(p, x0, y, x1 - x0, 7, 3), '#e8ecff', 3);
    }
    shape(c, (p) => rr(p, 28, 22, 104, 12, 4), '#e8ecff', 4);
    shape(c, (p) => rr(p, 28, 22, 10, 96, 4), '#e8ecff', 4);
    shape(c, (p) => rr(p, 122, 22, 10, 96, 4), '#e8ecff', 4);
    shape(c, (p) => rr(p, 22, 104, 116, 14, 4), '#c9d1f2', 4);
  });
  tex(scene, 'tn_chair_front', 130, 70, (c) => {
    shape(c, (p) => rr(p, 4, 4, 122, 62, 8), '#2a1840', 5);
    shape(c, (p) => rr(p, 12, 12, 106, 46, 6), null, 3, TEAL);
    c.fillStyle = '#ffffff'; c.font = 'bold 30px Rubik, Arial, sans-serif'; c.textAlign = 'center';
    c.fillText('🎾', 65, 46);
  });
}
