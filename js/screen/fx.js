// Bendri ekrano efektai: GTA stiliaus tekstai, juostos, subtitrai,
// misijos įžangos kortelė.

export const FONT_HEAD = 'Anton, Impact, "Arial Black", sans-serif';
export const FONT_BODY = 'Rubik, "Arial Rounded MT Bold", Arial, sans-serif';

export const C = {
  pink: '#ff3ea5',
  teal: '#2de2e6',
  yellow: '#ffd23f',
  orange: '#ff9a3c',
  ink: '#14081f',
  white: '#ffffff',
  red: '#ff4d5e',
  green: '#3ddc84',
};

export function headText(scene, x, y, text, size = 64, color = C.white, opts = {}) {
  const t = scene.add.text(x, y, text, {
    fontFamily: FONT_HEAD,
    fontSize: `${size}px`,
    color,
    stroke: C.ink,
    strokeThickness: Math.max(4, Math.round(size / 7)),
    align: 'center',
    ...opts,
  });
  t.setShadow(0, Math.round(size / 14), 'rgba(0,0,0,.55)', 0, true, true);
  return t.setOrigin(0.5);
}

export function bodyText(scene, x, y, text, size = 28, color = C.white, opts = {}) {
  return scene.add.text(x, y, text, {
    fontFamily: FONT_BODY,
    fontStyle: 'bold',
    fontSize: `${size}px`,
    color,
    stroke: C.ink,
    strokeThickness: Math.max(3, Math.round(size / 6)),
    align: 'center',
    ...opts,
  }).setOrigin(0.5);
}

export function gradientFill(textObj, stops) {
  const ctx = textObj.context;
  const h = textObj.height || textObj.style.fontSize;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
  textObj.setFill(g);
  return textObj;
}

// GTA "MISSION PASSED" stiliaus juosta.
export function banner(scene, title, sub = '', { color = C.yellow, hold = 2600, y = 430 } = {}) {
  const box = scene.add.container(960, y).setDepth(900);
  const band = scene.add.rectangle(0, 20, 1920, sub ? 250 : 190, 0x000000, 0.55);
  const t = headText(scene, 0, 0, title, 128, color);
  box.add([band, t]);
  if (sub) box.add(headText(scene, 0, 104, sub, 54, C.white));
  box.setScale(1.6).setAlpha(0);
  scene.tweens.add({ targets: box, scale: 1, alpha: 1, duration: 260, ease: 'Back.Out' });
  if (hold > 0) {
    scene.tweens.add({ targets: box, alpha: 0, delay: hold, duration: 400, onComplete: () => box.destroy() });
  }
  return box;
}

// Subtitrai ekrano apačioje (viena eilutė vienu metu).
export function subtitle(scene, text, { color = C.white, ms = 2600, y = 905 } = {}) {
  if (!text) return;
  if (!scene._subtitle) {
    scene._subtitle = bodyText(scene, 960, y, '', 40, C.white, { wordWrap: { width: 1500 } }).setDepth(800);
  }
  const s = scene._subtitle;
  s.setText(text).setColor(color).setAlpha(1).setY(y);
  scene.tweens.killTweensOf(s);
  scene.tweens.add({ targets: s, alpha: 0, delay: ms, duration: 350 });
}

export function floatText(scene, x, y, text, { color = C.white, size = 30, rise = 80, ms = 1100 } = {}) {
  const t = bodyText(scene, x, y, text, size, color).setDepth(850);
  scene.tweens.add({ targets: t, y: y - rise, alpha: 0, duration: ms, ease: 'Cubic.Out', onComplete: () => t.destroy() });
  return t;
}

// Fonas: dangus, saulė, siluetas, sniegas.
export function cityBackdrop(scene, { skylineY = 760, sunX = 1460, sunY = 400 } = {}) {
  scene.add.image(960, 540, 'sky').setDepth(-100);
  scene.add.image(sunX, sunY, 'sun').setDepth(-95).setAlpha(0.95);
  const skyline = scene.add.tileSprite(960, skylineY, 1920, 420, 'skyline').setOrigin(0.5, 1).setDepth(-90);
  snow(scene);
  return { skyline };
}

export function snow(scene, depth = 700) {
  return scene.add.particles(0, 0, 'flake', {
    x: { min: -100, max: 2020 },
    y: -20,
    lifespan: 9000,
    speedY: { min: 50, max: 130 },
    speedX: { min: -40, max: 10 },
    scale: { min: 0.5, max: 1.6 },
    alpha: { min: 0.5, max: 1 },
    quantity: 2,
    frequency: 90,
  }).setDepth(depth);
}

// Misijos įžanga ("loading screen").
export function missionCard(scene, { nr, mission, title, tip, controls }) {
  const box = scene.add.container(0, 0).setDepth(950);
  const dim = scene.add.rectangle(960, 540, 1920, 1080, 0x0b0418, 0.78);
  const stripe = scene.add.rectangle(960, 430, 1920, 330, 0x000000, 0.45);
  const kicker = headText(scene, 960, 300, `MISIJA ${nr}`, 48, C.teal);
  const big = headText(scene, 960, 400, mission, 130, C.yellow);
  gradientFill(big, ['#fff07a', '#ffb03a', '#ff3ea5']);
  const small = bodyText(scene, 960, 510, title, 36, C.white);
  const tipT = bodyText(scene, 960, 660, tip, 34, '#f1e6ff', { wordWrap: { width: 1400 } });
  const ctrl = bodyText(scene, 960, 760, controls, 30, C.teal);
  const go = headText(scene, 960, 900, 'ENTER - PRADĖTI', 56, C.white);
  scene.tweens.add({ targets: go, alpha: 0.25, yoyo: true, repeat: -1, duration: 650 });
  box.add([dim, stripe, kicker, big, small, tipT, ctrl, go]);
  return box;
}
