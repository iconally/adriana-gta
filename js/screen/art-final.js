// 10 etapo "Finalas: eglė" (Katedros aikštė) laikini paveikslėliai, nupiešti kodu.
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

function starPath(c, x, y, r1, r2, n = 5) {
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const r = i % 2 ? r2 : r1;
    const px = x + Math.cos(a) * r; const py = y + Math.sin(a) * r;
    if (i) c.lineTo(px, py); else c.moveTo(px, py);
  }
  c.closePath();
}

// Eglės geometrija (ekrano koordinatės): apačia, viršūnė ir pusplotis tam tikrame aukštyje.
export const TREE = { x: 960, top: 205, bottom: 905, hw: 300 };
export const treeHalfWidth = (y) => (TREE.hw * Math.max(0, y - TREE.top)) / (TREE.bottom - 60 - TREE.top);

export function generateFinalArt(scene) {
  // ---------- fonas: Katedros aikštė naktį ----------
  tex(scene, 'final_bg', 1920, 1080, (c) => {
    const rnd = seeded(2026);
    const GROUND = 785;
    const sky = c.createLinearGradient(0, 0, 0, GROUND);
    sky.addColorStop(0, '#0a0826');
    sky.addColorStop(0.6, '#2a145a');
    sky.addColorStop(1, '#5a2a7e');
    c.fillStyle = sky; c.fillRect(0, 0, 1920, GROUND);
    for (let i = 0; i < 140; i++) {
      c.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.6})`;
      c.beginPath(); c.arc(rnd() * 1920, rnd() * 380, 0.8 + rnd() * 1.6, 0, Math.PI * 2); c.fill();
    }
    // Gedimino kalnas su bokštu (fone, kairėje)
    shape(c, (p) => { p.moveTo(-20, GROUND); p.bezierCurveTo(60, 420, 200, 360, 300, 370); p.bezierCurveTo(400, 380, 470, 520, 560, GROUND); p.closePath(); }, '#1b2a48', 0);
    c.fillStyle = 'rgba(240,246,255,.5)';
    c.beginPath(); c.moveTo(150, 386); c.quadraticCurveTo(230, 360, 330, 372); c.quadraticCurveTo(240, 384, 150, 392); c.fill();
    const tg = c.createRadialGradient(250, 320, 4, 250, 320, 90);
    tg.addColorStop(0, 'rgba(255,200,120,.45)'); tg.addColorStop(1, 'rgba(255,200,120,0)');
    c.fillStyle = tg; c.fillRect(160, 230, 180, 180);
    shape(c, (p) => { p.moveTo(228, 372); p.lineTo(232, 312); p.lineTo(268, 312); p.lineTo(272, 372); p.closePath(); }, '#b4553a', 3);
    shape(c, (p) => rr(p, 230, 304, 40, 10, 2), '#6d2b1f', 3);
    c.strokeStyle = '#e8e8f0'; c.lineWidth = 3; c.beginPath(); c.moveTo(250, 304); c.lineTo(250, 276); c.stroke();
    [['#fdb913', 0], ['#006a44', 5], ['#c1272d', 10]].forEach(([col, dy]) => { c.fillStyle = col; c.fillRect(251, 277 + dy, 20, 5); });
    c.fillStyle = '#ffd88a'; c.fillRect(246, 330, 6, 9); c.fillRect(246, 350, 6, 9);

    // Katedra
    const cream = c.createLinearGradient(0, 300, 0, GROUND);
    cream.addColorStop(0, '#f6f1ff'); cream.addColorStop(1, '#cfc6ea');
    // šoniniai korpusai
    for (const [x0, x1] of [[440, 610], [1310, 1480]]) {
      shape(c, (p) => p.rect(x0, 470, x1 - x0, GROUND - 470), cream, 4);
      shape(c, (p) => p.rect(x0 - 6, 456, x1 - x0 + 12, 16), '#e8e2f8', 4);
      for (let k = 0; k < 2; k++) {
        const wx = x0 + 34 + k * 70;
        shape(c, (p) => { p.moveTo(wx, 620); p.lineTo(wx, 540); p.arc(wx + 18, 540, 18, Math.PI, 0); p.lineTo(wx + 36, 620); p.closePath(); }, '#ffd88a', 3);
        shape(c, (p) => rr(p, wx - 2, 650, 40, 90, 4), 'rgba(120,100,170,.35)', 2);
      }
      // statula ant korpuso kampo
      const sx = x0 < 960 ? x0 + 20 : x1 - 20;
      shape(c, (p) => { p.moveTo(sx - 10, 456); p.lineTo(sx - 7, 420); p.lineTo(sx + 7, 420); p.lineTo(sx + 10, 456); p.closePath(); }, '#e8e2f8', 3);
      shape(c, (p) => p.arc(sx, 412, 8, 0, Math.PI * 2), '#e8e2f8', 3);
    }
    // pagrindinis korpusas
    shape(c, (p) => p.rect(600, 440, 720, GROUND - 440), cream, 4);
    // frontonas
    shape(c, (p) => rr(p, 586, 398, 748, 46, 4), '#efe9fb', 5);
    shape(c, (p) => { p.moveTo(596, 400); p.lineTo(960, 292); p.lineTo(1324, 400); p.closePath(); }, '#f6f1ff', 5);
    shape(c, (p) => { p.moveTo(660, 388); p.lineTo(960, 306); p.lineTo(1260, 388); p.closePath(); }, '#e2daf6', 3);
    // trys statulos ant frontono (šv. Elena su kryžiumi - viduryje)
    for (const [sx, sy, cross] of [[960, 292, true], [600, 398, false], [1320, 398, false]]) {
      shape(c, (p) => { p.moveTo(sx - 12, sy); p.lineTo(sx - 8, sy - 44); p.lineTo(sx + 8, sy - 44); p.lineTo(sx + 12, sy); p.closePath(); }, '#efe9fb', 3);
      shape(c, (p) => p.arc(sx, sy - 52, 9, 0, Math.PI * 2), '#efe9fb', 3);
      if (cross) {
        c.strokeStyle = YEL; c.lineWidth = 4;
        c.beginPath(); c.moveTo(sx + 16, sy - 30); c.lineTo(sx + 16, sy - 84); c.moveTo(sx + 6, sy - 70); c.lineTo(sx + 26, sy - 70); c.stroke();
      }
    }
    // kolonos
    for (let k = 0; k < 6; k++) {
      const x = 640 + k * 120;
      const colG = c.createLinearGradient(x, 0, x + 50, 0);
      colG.addColorStop(0, '#ffffff'); colG.addColorStop(1, '#c9bfe6');
      shape(c, (p) => p.rect(x, 448, 50, GROUND - 468), colG, 3);
      shape(c, (p) => rr(p, x - 6, 444, 62, 12, 3), '#f6f1ff', 3);
      shape(c, (p) => rr(p, x - 6, GROUND - 26, 62, 12, 3), '#f6f1ff', 3);
      c.strokeStyle = 'rgba(120,100,170,.25)'; c.lineWidth = 2;
      for (const dx of [14, 25, 36]) { c.beginPath(); c.moveTo(x + dx, 460); c.lineTo(x + dx, GROUND - 30); c.stroke(); }
    }
    // durys tarp kolonų
    shape(c, (p) => { p.moveTo(925, GROUND - 14); p.lineTo(925, 640); p.arc(960, 640, 35, Math.PI, 0); p.lineTo(995, GROUND - 14); p.closePath(); }, '#ffcf6b', 4);
    // laiptai
    shape(c, (p) => p.rect(570, GROUND - 14, 780, 14), '#d9d2ef', 3);

    // Varpinė (dešinėje)
    const bx = 1600; const bw = 130;
    const tiers = [[bx, 470, bw, GROUND - 470], [bx + 12, 330, bw - 24, 140], [bx + 24, 228, bw - 48, 102], [bx + 36, 176, bw - 72, 52]];
    tiers.forEach(([x, y, w, h], i) => {
      shape(c, (p) => p.rect(x, y, w, h), cream, 4);
      shape(c, (p) => rr(p, x - 6, y - 8, w + 12, 12, 3), '#efe9fb', 3);
      if (i < 3) {
        const n = i === 0 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const ww = 26; const wx = x + (w - n * ww - (n - 1) * 18) / 2 + k * (ww + 18);
          const wy = y + h * 0.3;
          shape(c, (p) => { p.moveTo(wx, wy + h * 0.45); p.lineTo(wx, wy); p.arc(wx + ww / 2, wy, ww / 2, Math.PI, 0); p.lineTo(wx + ww, wy + h * 0.45); p.closePath(); }, i === 1 ? '#3a2a5e' : '#ffd88a', 3);
        }
      }
    });
    // laikrodis
    shape(c, (p) => p.arc(bx + bw / 2, 262, 18, 0, Math.PI * 2), '#ffffff', 3);
    c.strokeStyle = OUT; c.lineWidth = 2; c.beginPath(); c.moveTo(bx + bw / 2, 262); c.lineTo(bx + bw / 2, 250); c.moveTo(bx + bw / 2, 262); c.lineTo(bx + bw / 2 + 8, 266); c.stroke();
    c.strokeStyle = '#d9d2ef'; c.lineWidth = 5; c.beginPath(); c.moveTo(bx + bw / 2, 168); c.lineTo(bx + bw / 2, 112); c.stroke();
    c.strokeStyle = YEL; c.lineWidth = 4; c.beginPath(); c.moveTo(bx + bw / 2, 118); c.lineTo(bx + bw / 2, 88); c.moveTo(bx + bw / 2 - 10, 100); c.lineTo(bx + bw / 2 + 10, 100); c.stroke();

    // prožektorių šviesa ant pastatų
    const fl = c.createRadialGradient(960, GROUND, 40, 960, GROUND, 560);
    fl.addColorStop(0, 'rgba(160,200,255,.18)'); fl.addColorStop(1, 'rgba(160,200,255,0)');
    c.fillStyle = fl; c.fillRect(260, 200, 1400, GROUND - 200);

    // Kalėdų mugės nameliai
    const hut = (x, w, col) => {
      shape(c, (p) => p.rect(x, GROUND - 70, w, 70), '#6b3b1f', 3);
      shape(c, (p) => { p.moveTo(x - 10, GROUND - 68); p.lineTo(x + w / 2, GROUND - 108); p.lineTo(x + w + 10, GROUND - 68); p.closePath(); }, '#f4f7ff', 3);
      shape(c, (p) => rr(p, x + 10, GROUND - 56, w - 20, 26, 3), '#ffd88a', 2);
      for (let k = 0; k <= 6; k++) { c.fillStyle = [PINK, TEAL, YEL][k % 3]; c.beginPath(); c.arc(x + (w * k) / 6, GROUND - 66 + Math.sin(k) * 2, 3.5, 0, Math.PI * 2); c.fill(); }
      c.fillStyle = col;
    };
    hut(40, 130, PINK); hut(200, 120, TEAL); hut(1740, 150, YEL);

    // aikštė: sniegas ir grindinys
    const g = c.createLinearGradient(0, GROUND, 0, 1080);
    g.addColorStop(0, '#dfe8ff'); g.addColorStop(1, '#a9b6e6');
    c.fillStyle = g; c.fillRect(0, GROUND, 1920, 1080 - GROUND);
    c.strokeStyle = 'rgba(90,100,160,.18)'; c.lineWidth = 2;
    for (let y = GROUND + 18; y < 1080; y += 22 + (y - GROUND) * 0.06) { c.beginPath(); c.moveTo(0, y); c.lineTo(1920, y); c.stroke(); }
    for (let i = -30; i < 30; i++) { c.beginPath(); c.moveTo(960 + i * 60, GROUND); c.lineTo(960 + i * 140, 1080); c.stroke(); }
    // žibintai
    for (const x of [420, 1500]) {
      const lg = c.createRadialGradient(x, GROUND - 190, 4, x, GROUND - 190, 70);
      lg.addColorStop(0, 'rgba(255,214,120,.8)'); lg.addColorStop(1, 'rgba(255,214,120,0)');
      c.fillStyle = lg; c.fillRect(x - 70, GROUND - 260, 140, 140);
      c.strokeStyle = '#1b1030'; c.lineWidth = 7; c.beginPath(); c.moveTo(x, GROUND + 20); c.lineTo(x, GROUND - 180); c.stroke();
      shape(c, (p) => rr(p, x - 12, GROUND - 206, 24, 28, 4), '#ffe39a', 4);
    }
  });

  // ---------- didžioji eglė (neįžiebta) ----------
  tex(scene, 'fn_tree', 640, 720, (c) => {
    const cx = 320;
    shape(c, (p) => p.rect(cx - 34, 640, 68, 70), '#6b3b1f', 5);
    shape(c, (p) => rr(p, cx - 90, 690, 180, 26, 6), '#c8102e', 5);
    const tiers = [[0, 150, 70], [80, 270, 120], [180, 400, 180], [300, 530, 240], [420, 660, 300]];
    for (const [top, bot, hw] of tiers) {
      const g = c.createLinearGradient(cx - hw, 0, cx + hw, 0);
      g.addColorStop(0, '#0f5a3a'); g.addColorStop(0.5, '#1f8a5a'); g.addColorStop(1, '#0c4a30');
      shape(c, (p) => { p.moveTo(cx, top); p.quadraticCurveTo(cx - hw * 0.4, (top + bot) / 2, cx - hw, bot); p.quadraticCurveTo(cx, bot + 26, cx + hw, bot); p.quadraticCurveTo(cx + hw * 0.4, (top + bot) / 2, cx, top); p.closePath(); }, g, 6);
      // sniegas ant šakų krašto
      c.strokeStyle = 'rgba(244,248,255,.9)'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(cx - hw + 10, bot - 4); c.quadraticCurveTo(cx, bot + 20, cx + hw - 10, bot - 4); c.stroke();
    }
  });

  // ---------- žvaigždė ----------
  tex(scene, 'fn_star', 130, 130, (c) => {
    shape(c, (p) => starPath(p, 65, 68, 58, 25), YEL, 7);
    shape(c, (p) => starPath(p, 65, 68, 34, 14), '#fff3a6', 0);
  });

  // ---------- Adrianos dronas ----------
  tex(scene, 'fn_drone', 240, 80, (c) => {
    c.strokeStyle = OUT; c.lineWidth = 6;
    c.beginPath(); c.moveTo(40, 30); c.lineTo(200, 30); c.stroke();
    for (const x of [40, 200]) {
      shape(c, (p) => rr(p, x - 6, 20, 12, 24, 3), '#2a1840', 3);
      shape(c, (p) => p.ellipse(x, 16, 38, 7, 0, 0, Math.PI * 2), 'rgba(45,226,230,.45)', 3, TEAL);
    }
    shape(c, (p) => rr(p, 84, 22, 72, 36, 12), PINK, 5);
    c.fillStyle = TEAL; c.fillRect(100, 34, 12, 8); c.fillRect(128, 34, 12, 8);
    c.fillStyle = YEL; c.beginPath(); c.arc(120, 62, 5, 0, Math.PI * 2); c.fill();
  });

  // ---------- žaisliuko kepurėlė ----------
  tex(scene, 'fn_cap', 30, 26, (c) => {
    c.strokeStyle = '#d9c38a'; c.lineWidth = 3; c.beginPath(); c.arc(15, 7, 5, Math.PI, 0); c.stroke();
    shape(c, (p) => rr(p, 4, 10, 22, 14, 3), YEL, 3);
  });
}
