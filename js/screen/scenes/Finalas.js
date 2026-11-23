// 10 etapas: "Finalas: eglė" (Katedros aikštė, kalėdinis klasės vakarėlis).
// 1 dalis - puošiam eglę (vienu metu):
//   - vaikai telefone „Pakabink! 🎄“: iš tribūnos į eglę nuskrenda jo žaisliukas su jo veidu;
//     kiti paspaudimai prie žaisliuko prideda lempučių (iki 6);
//   - Adriana: virš eglės skraido dronas su žvaigžde, TARPAS - paleisti žvaigždę ant viršūnės.
// 2 dalis - įžiebimas „Visi kartu!“: mokytoja spaudžia „3-2-1 🎄“ (jei nespaudžia - prasideda pats),
//   ties „DABAR!“ visi spaudžia „ĮŽIEBK! 💡“ (Adriana - TARPĄ). Kuo daugiau kartu, tuo daugiau eglės
//   aukštų užsidega; jei kartu mažiau nei 80% - bandom dar (iš viso iki 3 kartų), po to eglė užsidega bet kokiu atveju.
// Pabaiga: fejerverkai virš Katedros, „klasės nuotrauka“ prie eglės ir rezultatai.
// Visas etapas nuo „3-2-1“ iki rezultatų - ne ilgiau 60 s.

import { headText, bodyText, banner, subtitle, missionCard, snow, C } from '../fx.js';
import { Tribune, avatarKey } from '../tribune.js';
import { STAGES } from '../stages.js';
import { TREE, treeHalfWidth } from '../art-final.js';
import { teacherLabel } from '../../common.js';

const STAGE = STAGES.finalas;
const TOTAL_S = 60;
const DECOR_MAX_S = 24;      // iki tiek puošiam; paskui žvaigždė ir žaisliukai pakimba patys
const FINALE_BY_S = 49;      // nuo tiek - eglė užsidega bet kokiu atveju
const COUNT_STEP = 800;
const WIN_PRE = 250;
const WIN_POST = 1500;
const SYNC_OK = 0.8;
const MAX_TRIES = 3;
const BULBS_MAX = 6;
const STAR_OK_DX = 32;
const DRONE = { y: 108, amp: 270, period: 2.6 };
const STAR_Y = TREE.top + 12;
const ADR = { x: 300, y: 930, s: 0.62 };
const TEACH = { x: 1700, y: 925, s: 0.5 };
const COLORS = [0xff3ea5, 0x2de2e6, 0xffd23f, 0x3ddc84, 0xff7a3c, 0x8a5cff, 0xff2bd6, 0x4da3ff];
const LIGHT_COLS = [0xffd23f, 0xff3ea5, 0x2de2e6, 0xffffff, 0xff7a3c, 0x3ddc84];
const ORDINAL = ['', 'pirmo', 'antro', 'trečio', 'ketvirto', 'penkto', 'šešto', 'septinto', 'aštunto', 'devinto', 'dešimto'];
// Žaisliukų vietos ant eglės (y ir kiekis eilėje) - 17 vietų
const SLOT_ROWS = [[330, 1], [420, 2], [510, 3], [600, 3], [690, 4], [785, 4]];
const LIGHT_ROWS = [292, 378, 468, 558, 650, 742, 832];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const hashCol = (name) => { let h = 0; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return COLORS[h % COLORS.length]; };

function slotList() {
  const out = [];
  for (const [y, k] of SLOT_ROWS) {
    const hw = treeHalfWidth(y);
    const span = k === 1 ? 0 : hw * (k >= 4 ? 1.45 : 1.25);
    for (let i = 0; i < k; i++) out.push({ x: TREE.x + (k === 1 ? 0 : -span / 2 + (span * i) / (k - 1)), y });
  }
  return out;
}

export class FinalasScene extends Phaser.Scene {
  constructor() { super('Finalas'); }

  create() {
    const A = window.AGTA;
    this.A = A;
    this.bornAt = Date.now();
    this.mode = 'intro'; // intro -> count -> decor -> ready -> sync (-> retry -> sync)... -> lit -> photo -> result
    A.host.setPhase('intro', STAGE);
    this.lockAll();

    // Phaser naudoja tą patį scenos objektą, todėl visą būseną nustatom iš naujo.
    this.orn = new Map();        // pid -> { slot, box, bulbs: [], hung }
    this.slots = [];
    this.starPlaced = false;
    this.starAuto = false;
    this.starTries = 0;
    this.starFalling = false;
    this.droneT = 0;
    this.tries = 0;
    this.best = 0;
    this.presses = new Map();    // pid -> ms nuo DABAR
    this.adrSync = false;
    this.dabarAt = 0;
    this.winOpen = false;
    this.readyAt = 0;
    this.stats = new Map();
    this.lastSub = 0;
    this.stageStart = null;
    this.stageT = 0;
    this.lightsOn = 0;
    this.autoplay = !!this.autoplay;
    this.autoMiss = false;
    this.autoSyncAt = 0;
    this.sleepy = new Set();

    this.add.image(960, 540, 'final_bg').setDepth(-100);
    snow(this, 700).setAlpha(0.7);
    this.treeImg = this.add.image(TREE.x, TREE.bottom, 'fn_tree').setOrigin(0.5, 1).setDepth(10);
    this.makeLights();
    this.makeDrone();
    this.makeTeacher();
    this.makeAdriana();
    this.makeHud();
    this.fx = this.add.container(0, 0).setDepth(5); // fejerverkai virš Katedros (už eglės)

    this.tribune = new Tribune(this, A.host, { y: 1006, maxSize: 64 });
    this.card = missionCard(this, {
      nr: STAGE.nr,
      mission: STAGE.mission,
      title: `${STAGE.title} - Katedros aikštė`,
      tip: A.lines.pick('finalas', 'intro'),
      controls: 'Klasė: pakabink savo žaisliuką 🎄, o kai bus DABAR! - visi kartu ĮŽIEBK!   Adriana: TARPAS - paleisti žvaigždę ant viršūnės, o per DABAR! - irgi TARPAS.',
    });
    this.card.setDepth(1900);

    const kb = this.input.keyboard;
    kb.on('keydown-ENTER', () => this.onEnter());
    kb.on('keydown-SPACE', () => { if (this.mode === 'intro') this.onEnter(); else this.adrSpace(); });
    kb.on('keydown-R', () => this.scene.restart());

    const offs = [A.host.on('press', (e) => this.onPress(e))];
    A.host.botPick = (p) => {
      if (A.host.roles[p.pid] !== 'puosejas') return null;
      if (this.mode === 'decor') {
        const o = this.orn.get(p.pid);
        if (!o || !o.hung) return Math.random() < 0.35 ? 'zaisliukas' : null;
        return o.bulbs.length < BULBS_MAX && Math.random() < 0.12 ? 'zaisliukas' : null;
      }
      if (this.mode === 'sync' && this.winOpen && !this.presses.has(p.pid)) {
        if (this.sleepy.has(p.pid) && this.tries < 2) return null;
        return Math.random() < 0.5 ? 'izziebk' : null;
      }
      return null;
    };
    A.host.botFilter = (p, btn) => {
      if (btn === 'skaiciuoti') return this.mode === 'ready' && Math.random() < 0.5;
      if (btn === 'muzika') return this.mode === 'decor' && Math.random() < 0.05;
      return false;
    };
    this.events.once('shutdown', () => {
      offs.forEach((f) => f());
      A.host.botFilter = null;
      A.host.botPick = null;
      A.host.lock('zaisliukas', undefined, false);
      A.host.lock('izziebk', undefined, false);
      A.host.setStatus(null);
    });
  }

  lockAll(sync = false) {
    this.A.host.lock('zaisliukas', null, false);
    this.A.host.lock('izziebk', null, sync);
  }

  // ---------------- eiga ----------------
  onEnter() {
    if (this.mode === 'intro') { if (Date.now() - this.bornAt > 500) this.countdown(); }
    else if (this.mode === 'result') {
      this.A.host.markDone(STAGE.id);
      this.A.go('Map');
    }
  }

  countdown() {
    this.mode = 'count';
    this.stageStart = this.game.loop.time;
    this.tweens.add({ targets: this.card, alpha: 0, duration: 300, onComplete: () => this.card.destroy() });
    const nums = ['3', '2', '1', 'PUOŠIAM!'];
    nums.forEach((n, i) => {
      this.time.delayedCall(i * 700, () => {
        const last = i === nums.length - 1;
        const t = headText(this, 960, 470, n, last ? 170 : 240, last ? C.yellow : C.white).setDepth(1960);
        t.setScale(1.8).setAlpha(0);
        this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 200, ease: 'Back.Out' });
        this.tweens.add({ targets: t, alpha: 0, delay: 480, duration: 200, onComplete: () => t.destroy() });
        if (last) {
          this.A.sfx.go();
          this.A.host.setPhase('play', STAGE);
          this.sub(this.A.lines.pick('finalas', 'start'), C.yellow);
          this.time.delayedCall(300, () => this.startDecor());
        } else this.A.sfx.count();
      });
    });
  }

  kids() {
    const host = this.A.host;
    return host.list().filter((p) => !host.isTeacher(p.name));
  }

  startDecor() {
    this.mode = 'decor';
    // vietos ant eglės - tiek, kiek vaikų (tolygiai iš 17)
    const all = slotList();
    const kids = Phaser.Utils.Array.Shuffle(this.kids());
    const n = Math.min(kids.length, all.length);
    this.slots = [];
    for (let k = 0; k < n; k++) this.slots.push(all[Math.floor(((k + 0.5) * all.length) / n)]);
    kids.slice(0, n).forEach((p, k) => {
      this.orn.set(p.pid, { pid: p.pid, name: p.name, slot: this.slots[k], box: null, bulbs: [], hung: false, col: hashCol(p.name) });
      if (p.bot && Math.random() < 0.2) this.sleepy.add(p.pid);
    });
    this.A.host.lock('zaisliukas', undefined, false);
    this.A.host.lock('izziebk', null, false);
    this.phoneStatus();
    this.say('PUOŠIAM EGLĘ! ADRIANA - ŽVAIGŽDĖ ⭐', C.yellow);
    this.updateCounter();
  }

  phoneStatus() {
    const host = this.A.host;
    const by = {};
    const tLabel = teacherLabel(this.teacherName);
    for (const p of host.list()) {
      if (host.isTeacher(p.name)) {
        by[p.pid] = this.mode === 'ready'
          ? { text: 'Eglė papuošta! Spauskite „3-2-1 🎄“', tone: 'go', holder: true }
          : { text: `Puošiam eglę · ${tLabel}: 🎶 muzika`, tone: 'go' };
        continue;
      }
      const o = this.orn.get(p.pid);
      if (this.mode === 'decor') {
        by[p.pid] = !o || !o.hung ? { text: 'Pakabink žaisliuką! 🎄', tone: 'go', holder: true } : { text: 'Spausk dar - lemputės 💡', tone: 'go' };
      } else if (this.mode === 'ready' || this.mode === 'retry') {
        by[p.pid] = { text: 'Spausk per DABAR! 💡', tone: 'go', holder: true };
      }
    }
    host.setStatus(null, by);
  }

  // ---------------- žaisliukai ----------------
  hang(o, auto = false) {
    if (o.hung) return;
    o.hung = true;
    const from = this.tribune.pos(o.pid);
    const box = this.add.container(from.x, from.y).setDepth(20 + o.slot.y * 0.01);
    const ring = this.add.circle(0, 0, 31, o.col).setStrokeStyle(4, 0x14081f);
    const key = this.textures.exists(avatarKey(o.name)) ? avatarKey(o.name) : 'dot';
    const face = this.add.image(0, 0, key).setDisplaySize(50, 50);
    if (key === 'dot') face.setTint(0x5a2a86);
    const shine = this.add.ellipse(-12, -14, 16, 9, 0xffffff, 0.55).setAngle(-30);
    const cap = this.add.image(0, -34, 'fn_cap');
    box.add([ring, face, shine, cap]);
    o.box = box;
    box.setScale(0.4);
    this.tweens.add({ targets: box, x: o.slot.x, y: o.slot.y, scale: 1, duration: auto ? 450 : 650, ease: 'Cubic.Out', onComplete: () => {
      this.tweens.add({ targets: box, angle: { from: -8, to: 8 }, yoyo: true, repeat: 1, duration: 180, onComplete: () => box.setAngle(0) });
    } });
    if (!auto) { this.A.sfx.jingle(); this.stat(o, 'pakabino'); }
    this.updateCounter();
  }

  addBulb(o) {
    if (!o.hung || o.bulbs.length >= BULBS_MAX) return;
    const k = o.bulbs.length;
    const a = -Math.PI / 2 + ((k + 0.5) / BULBS_MAX) * Math.PI * 2;
    const r = 46;
    const b = this.add.circle(o.slot.x + Math.cos(a) * r, o.slot.y + Math.sin(a) * r * 0.8, 7, o.col).setStrokeStyle(2, 0x14081f).setDepth(19).setAlpha(0.75);
    const glow = this.add.circle(b.x, b.y, 16, o.col, 0.45).setDepth(18).setBlendMode(Phaser.BlendModes.ADD).setVisible(this.lightsOn >= LIGHT_ROWS.length);
    o.bulbs.push({ b, glow });
    b.setScale(0.2);
    this.tweens.add({ targets: b, scale: 1, duration: 160, ease: 'Back.Out' });
    this.A.sfx.tick();
    this.stat(o, 'lemputes');
    this.updateCounter();
  }

  updateCounter() {
    const list = [...this.orn.values()];
    const hung = list.filter((o) => o.hung).length;
    const bulbs = list.reduce((s, o) => s + o.bulbs.length, 0);
    this.counterText.setText(list.length ? `🎄 ${hung}/${list.length}   💡 ${bulbs}   ⭐ ${this.starPlaced ? '✓' : '...'}` : '');
  }

  // ---------------- Adrianos žvaigždė ----------------
  adrSpace() {
    if (this.mode === 'decor' && !this.starPlaced && !this.starFalling) { this.dropStar(); return; }
    if (this.mode === 'sync' && this.winOpen && !this.adrSync) {
      this.adrSync = true;
      this.pop(ADR.x, ADR.y - 210, '✅', C.green, 44);
      this.A.sfx.click();
    }
  }

  dropStar(auto = false) {
    this.starTries += 1;
    this.starFalling = true;
    const x = this.drone.x;
    const ok = auto || Math.abs(x - TREE.x) <= STAR_OK_DX;
    this.droneStar.setVisible(false);
    const star = this.add.image(x, DRONE.y + 96, 'fn_star').setDepth(30);
    this.A.sfx.whoosh();
    if (ok) {
      this.tweens.add({ targets: star, x: TREE.x, y: STAR_Y, duration: 420, ease: 'Quad.In', onComplete: () => {
        star.destroy();
        this.starPlaced = true;
        this.starFalling = false;
        this.topStar.setVisible(true).setScale(1.4);
        this.tweens.add({ targets: this.topStar, scale: 1, duration: 260, ease: 'Back.Out' });
        this.A.sfx.plus();
        this.pop(TREE.x, STAR_Y - 70, '⭐', C.yellow, 60);
        this.sub(this.A.lines.pick('finalas', auto ? 'auto_star' : 'star_ok'), C.yellow);
        if (!auto) this.adrCelebrate();
        this.tweens.add({ targets: this.drone, y: -120, duration: 700, ease: 'Quad.In' });
        this.updateCounter();
      } });
    } else {
      const side = x < TREE.x ? -1 : 1;
      this.tweens.add({ targets: star, x: x + side * 60, y: 880, angle: side * 360, duration: 800, ease: 'Quad.In', onComplete: () => {
        this.A.sfx.thud();
        this.tweens.add({ targets: star, alpha: 0, duration: 300, onComplete: () => star.destroy() });
        this.time.delayedCall(500, () => { this.starFalling = false; if (!this.starPlaced) this.droneStar.setVisible(true); });
      } });
      this.maybeSub(this.A.lines.pick('finalas', 'star_miss'), C.orange, 1500);
    }
  }

  // ---------------- įžiebimas „Visi kartu!“ ----------------
  becomeReady() {
    if (this.mode !== 'decor') return;
    this.mode = 'ready';
    for (const o of this.orn.values()) if (!o.hung) this.hang(o, true);
    this.A.host.lock('zaisliukas', null, false);
    this.phoneStatus();
    const vars = { mokytoja: teacherLabel(this.teacherName) };
    this.say('EGLĖ PAPUOŠTA! LAUKIAM 3-2-1...', C.green);
    this.sub(this.A.lines.pick('finalas', 'ready', vars), C.yellow);
    const t = this.A.host.teachers()[0];
    const wait = t && this.A.host.isOnline(t) ? 6000 : 2500;
    this.readyTimer = this.time.delayedCall(wait, () => { if (this.mode === 'ready') this.syncCountdown(); });
  }

  syncCountdown() {
    if (this.mode !== 'ready' && this.mode !== 'retry') return;
    if (this.readyTimer) this.readyTimer.remove();
    this.mode = 'sync';
    this.tries += 1;
    this.presses = new Map();
    this.adrSync = false;
    this.winOpen = false;
    this.say(`VISI KARTU!${this.tries > 1 ? `  (${this.tries} bandymas)` : ''}`, C.yellow);
    const t0 = this.time.now;
    this.dabarAt = t0 + 3 * COUNT_STEP;
    const live = () => this.mode === 'sync';
    ['3', '2', '1'].forEach((n, i) => this.time.delayedCall(i * COUNT_STEP, () => { if (live()) this.bigNum(n, C.white); }));
    this.time.delayedCall(3 * COUNT_STEP - WIN_PRE, () => {
      if (!live()) return;
      this.winOpen = true;
      this.A.host.lock('izziebk', undefined);
      this.autoSyncAt = this.dabarAt + rand(60, 220);
    });
    this.time.delayedCall(3 * COUNT_STEP, () => {
      if (!live()) return;
      this.bigNum('DABAR!', C.yellow, 200);
      this.cameras.main.flash(120, 255, 240, 180);
      this.A.sfx.go();
    });
    this.time.delayedCall(3 * COUNT_STEP + WIN_POST, () => this.evaluate());
  }

  bigNum(n, color, size = 240) {
    const t = headText(this, 960, 470, n, size, color).setDepth(1960);
    t.setScale(1.8).setAlpha(0);
    this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 180, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, delay: 560, duration: 200, onComplete: () => t.destroy() });
    if (n.length === 1) this.A.sfx.count();
  }

  evaluate() {
    if (this.mode !== 'sync') return;
    this.winOpen = false;
    this.A.host.lock('izziebk', null, false);
    const n = Math.max(1, this.orn.size);
    const got = this.presses.size;
    this.best = Math.max(this.best, got);
    const ratio = this.orn.size ? got / n : 1;
    this.lightUp(Math.max(1, Math.round(ratio * LIGHT_ROWS.length)));
    const host = this.A.host;
    const by = {};
    for (const o of this.orn.values()) {
      by[o.pid] = this.presses.has(o.pid) ? { text: 'Pataikei į DABAR! ✅', tone: 'go' } : { text: 'Pavėlavai... kitą kartą - kartu!', tone: 'wait' };
    }
    host.setStatus(null, by);
    this.countText.setText(`Kartu paspaudė ${got} iš ${this.orn.size}${this.adrSync ? ' + Adriana' : ''}!`).setAlpha(1).setColor(ratio >= SYNC_OK ? C.green : C.orange);
    this.tweens.add({ targets: this.countText, alpha: 0, delay: 2000, duration: 400 });
    const last = ratio >= SYNC_OK || this.tries >= MAX_TRIES || this.stageT >= FINALE_BY_S - 6;
    if (last) { this.time.delayedCall(700, () => this.finale()); return; }
    this.mode = 'retry';
    this.say('DAR KARTĄ - VISI KARTU!', C.orange);
    this.sub(this.A.lines.pick('finalas', 'retry'), C.orange);
    this.phoneStatus();
    this.time.delayedCall(2300, () => this.syncCountdown());
  }

  // Užsidega eglės aukštai iš apačios į viršų.
  lightUp(rows) {
    const target = Math.min(LIGHT_ROWS.length, rows);
    for (let r = this.lightsOn; r < target; r++) {
      const row = this.lights[LIGHT_ROWS.length - 1 - r];
      this.time.delayedCall((r - this.lightsOn) * 120, () => {
        for (const L of row) {
          L.b.setFillStyle(L.col, 1);
          L.glow.setVisible(true).setAlpha(0);
          this.tweens.add({ targets: L.glow, alpha: { from: 0.3, to: 0.65 }, yoyo: true, repeat: -1, duration: rand(400, 900), delay: rand(0, 400) });
        }
        this.A.sfx.tick();
      });
    }
    this.lightsOn = Math.max(this.lightsOn, target);
  }

  finale() {
    if (this.mode === 'lit' || this.mode === 'photo' || this.mode === 'result') return;
    this.mode = 'lit';
    this.winOpen = false;
    this.lockAll(true);
    if (this.readyTimer) this.readyTimer.remove();
    if (!this.starPlaced) { this.starPlaced = true; this.starAuto = true; this.topStar.setVisible(true); this.droneStar.setVisible(false); }
    for (const o of this.orn.values()) if (!o.hung) this.hang(o, true);
    this.lightUp(LIGHT_ROWS.length);
    this.time.delayedCall(900, () => {
      for (const o of this.orn.values()) for (const B of o.bulbs) { B.b.setAlpha(1); B.glow.setVisible(true); this.tweens.add({ targets: B.glow, alpha: { from: 0.2, to: 0.6 }, yoyo: true, repeat: -1, duration: rand(400, 800) }); }
      this.starGlow.setVisible(true);
      this.tweens.add({ targets: this.starGlow, scale: { from: 0.8, to: 1.25 }, alpha: { from: 0.9, to: 0.5 }, yoyo: true, repeat: -1, duration: 600 });
      this.tweens.add({ targets: this.starRays, angle: 360, repeat: -1, duration: 6000 });
      this.starRays.setVisible(true);
    });
    for (let k = 0; k < 14; k++) this.time.delayedCall(300 + k * 150, () => this.firework(rand(380, 1540), rand(110, 330)));
    this.A.sfx.win();
    this.time.delayedCall(600, () => this.A.sfx.jingle());
    this.say('', C.yellow);
    this.A.host.setStatus({ text: 'Linksmų Kalėdų! 🎄 Žiūrėk į ekraną', tone: 'go' });
    this.bigBanner('LINKSMŲ KALĖDŲ!', 'EGLĖ ĮŽIEBTA', { color: C.yellow, hold: 2200, y: 330 });
    this.adrCelebrate();
    this.time.delayedCall(2700, () => this.photo());
  }

  // „Klasės nuotrauka“: visi avatarai prie eglės, Adriana per vidurį, blykstė.
  photo() {
    this.mode = 'photo';
    this.sub(this.A.lines.pick('finalas', 'photo'), C.white, 300);
    const kids = this.kids();
    const n = kids.length;
    const rows = n > 9 ? 2 : 1;
    const per = Math.ceil(n / rows);
    const GAP = 220; // vieta Adrianai per vidurį
    kids.forEach((p, i) => {
      const row = Math.floor(i / per);
      const k = i % per;
      const cnt = row === rows - 1 ? n - per * (rows - 1) : per;
      const half = Math.ceil(cnt / 2);
      const side = k < half ? -1 : 1;
      const j = side < 0 ? half - 1 - k : k - half; // atstumas nuo vidurio
      const x = 960 + side * (GAP / 2 + 48 + j * 96);
      const y = row === 0 ? 860 : 935;
      const from = this.tribune.pos(p.pid);
      const key = this.textures.exists(avatarKey(p.name)) ? avatarKey(p.name) : 'dot';
      const img = this.add.image(from.x, from.y, key).setDisplaySize(64, 64).setDepth(960 + row);
      this.tweens.add({ targets: img, x, y, displayWidth: 82, displayHeight: 82, duration: 600, delay: i * 30, ease: 'Cubic.Out' });
    });
    this.adrBox.setDepth(990);
    this.tweens.add({ targets: this.adrBox, x: 960, y: 1000, scale: 0.72, duration: 600, ease: 'Cubic.Out' });
    const edge = 960 + GAP / 2 + 48 + Math.ceil(per / 2) * 96 + 40;
    this.tweens.add({ targets: this.teachBox, x: Math.min(1840, edge), y: 925, duration: 600, ease: 'Cubic.Out' });
    this.tweens.add({ targets: this.teachTag, x: Math.min(1840, edge), alpha: 0, duration: 600 });
    this.time.delayedCall(1100, () => {
      this.cameras.main.flash(250, 255, 255, 255);
      this.A.sfx.shutter();
      const cls = this.A.host.roster.className;
      headText(this, 960, 150, `📸 ${cls ? `${cls} · ` : ''}KALĖDOS 2026`, 54, C.white).setDepth(1960);
    });
    this.time.delayedCall(2900, () => this.showResult());
  }

  showResult() {
    this.mode = 'result';
    this.A.host.setPhase('result', STAGE);
    const box = this.add.container(960, 470).setDepth(1950).setAlpha(0);
    box.add(this.add.rectangle(0, 0, 1240, 560, 0x0b0418, 0.88).setStrokeStyle(6, 0xffd23f));
    box.add(headText(this, 0, -215, 'EGLĖ ĮŽIEBTA! MISIJA ĮVYKDYTA!', 60, C.yellow));
    const list = [...this.orn.values()];
    const bulbs = list.reduce((s, o) => s + o.bulbs.length, 0);
    const byKids = [...this.stats.values()].filter((x) => x.counts.pakabino).length;
    const rows = [
      [`Žaisliukų ant eglės: ${list.length}${byKids < list.length ? ` (patys pakabino ${byKids})` : ''}   ·   Lempučių: ${bulbs} 💡`, C.white],
      [this.starAuto ? 'Žvaigždę nuleido dronas ⭐' : `Žvaigždę Adriana uždėjo iš ${ORDINAL[this.starTries] || `${this.starTries}-o`} karto ⭐`, C.white],
    ];
    if (this.tries) rows.push([`Įžiebimas: kartu paspaudė ${this.best} iš ${list.length}${this.tries > 1 ? ` (per ${this.tries} bandymus)` : ''}`, C.green]);
    const all = [...this.stats.values()];
    const lamp = all.map((x) => [x, x.counts.lemputes || 0]).filter(([, k]) => k > 0).sort((a, b) => b[1] - a[1])[0];
    if (lamp) rows.push([`Daugiausia lempučių: ${lamp[0].name} (${lamp[1]}) 💡`, C.yellow]);
    const fast = all.filter((x) => x.react != null).sort((a, b) => a.react - b.react)[0];
    if (fast) rows.push([`Greičiausias „DABAR!“: ${fast.name} (${(fast.react / 1000).toFixed(2).replace('.', ',')} s)`, C.teal]);
    rows.forEach(([r, c], i) => box.add(bodyText(this, 0, -130 + i * 56, r, 30, c)));
    const next = headText(this, 0, 225, 'ENTER - TOLIAU', 46, C.white);
    this.tweens.add({ targets: next, alpha: 0.3, yoyo: true, repeat: -1, duration: 650 });
    box.add(next);
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
  }

  // ---------------- klasė ----------------
  stat(who, k) {
    const id = who.pid || who.name;
    const st = this.stats.get(id) || { name: who.name, counts: {} };
    st.counts[k] = (st.counts[k] || 0) + 1;
    this.stats.set(id, st);
    return st;
  }

  onPress({ player, action, role }) {
    this.tribune.bounce(player.pid);
    if (this.mode === 'intro' || this.mode === 'result' || this.mode === 'count') return;
    if (role === 'vedeja') { this.teacherAction(action); return; }
    const o = this.orn.get(player.pid);
    if (action === 'zaisliukas' && this.mode === 'decor' && o) {
      if (!o.hung) { this.hang(o); this.phoneStatus(); } else this.addBulb(o);
      return;
    }
    if (action === 'izziebk' && this.mode === 'sync' && this.winOpen && o && !this.presses.has(player.pid)) {
      const ms = this.time.now - this.dabarAt;
      this.presses.set(player.pid, ms);
      if (ms >= 0) { const st = this.stat(player, 'kartu'); st.react = st.react == null ? ms : Math.min(st.react, ms); }
      if (o.box) { o.box.setScale(1.25); this.tweens.add({ targets: o.box, scale: 1, duration: 200 }); }
      this.countText.setText(`Kartu: ${this.presses.size} iš ${this.orn.size}`).setAlpha(1).setColor(C.yellow);
    }
  }

  teacherAction(action) {
    const vars = { mokytoja: teacherLabel(this.teacherName) };
    if (action === 'skaiciuoti') {
      if (this.mode === 'ready') { this.teacherSay('3-2-1! 🎄', C.yellow); this.syncCountdown(); return; }
      if (this.mode === 'decor') {
        if (!this.starPlaced) { this.teacherSay('⭐ Palaukim žvaigždės!', C.orange); return; }
        this.teacherSay('3-2-1! 🎄', C.yellow);
        this.becomeReady();
        this.syncCountdown();
      }
    } else if (action === 'muzika') {
      this.A.sfx.jingle();
      this.teacherSay('🎶', C.pink);
      this.maybeSub(this.A.lines.pick('finalas', 'music', vars), C.pink, 1500);
      for (const p of this.A.host.list()) this.tribune.wiggle(p.pid);
      for (let k = 0; k < 6; k++) {
        const t = headText(this, TREE.x + rand(-200, 200), 700, pick(['♪', '♫', '🎶']), 40, pick([C.pink, C.yellow, C.teal])).setDepth(1500);
        this.tweens.add({ targets: t, y: 380, x: t.x + rand(-60, 60), alpha: 0, duration: 1600, delay: k * 120, onComplete: () => t.destroy() });
      }
    }
  }

  // ---------------- piešimas ----------------
  makeLights() {
    this.lights = LIGHT_ROWS.map((y) => {
      const hw = treeHalfWidth(y) * 0.88;
      const n = Math.max(4, Math.round(hw / 30));
      const row = [];
      for (let i = 0; i < n; i++) {
        const u = n === 1 ? 0 : -1 + (2 * i) / (n - 1);
        const x = TREE.x + u * hw;
        const yy = y + 14 * (1 - u * u);
        const col = LIGHT_COLS[(i + Math.round(y)) % LIGHT_COLS.length];
        const glow = this.add.circle(x, yy, 15, col, 0.5).setDepth(11).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
        const b = this.add.circle(x, yy, 6, 0x34404f).setStrokeStyle(2, 0x14081f).setDepth(12);
        row.push({ b, glow, col });
      }
      return row;
    });
    // žvaigždė viršūnėje (kol nepadėta - nematoma) ir jos švytėjimas
    this.starRays = this.add.star(TREE.x, STAR_Y, 12, 30, 110, 0xfff3a6, 0.25).setDepth(13).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    this.starGlow = this.add.circle(TREE.x, STAR_Y, 60, 0xffd23f, 0.7).setDepth(14).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    this.topStar = this.add.image(TREE.x, STAR_Y, 'fn_star').setDepth(15).setVisible(false);
  }

  makeDrone() {
    this.drone = this.add.container(TREE.x, DRONE.y).setDepth(40);
    const rope = this.add.rectangle(0, 50, 3, 52, 0x14081f);
    this.droneStar = this.add.image(0, 96, 'fn_star').setScale(0.85);
    const body = this.add.image(0, 0, 'fn_drone');
    this.drone.add([rope, this.droneStar, body]);
  }

  makeTeacher() {
    const t = this.A.host.teachers()[0];
    this.teacherName = t ? t.name : 'Daiva';
    const box = this.add.container(TEACH.x, TEACH.y).setScale(TEACH.s).setDepth(940);
    const body = this.add.image(0, 0, 'teacher_body').setOrigin(0.5, 1);
    const faceKey = t && this.textures.exists(avatarKey(t.name)) ? avatarKey(t.name) : 'teacher_face';
    const face = this.add.image(0, -290, faceKey).setDisplaySize(104, 104);
    box.add([body, face]);
    this.teachBox = box;
    this.teachTag = bodyText(this, TEACH.x, TEACH.y + 22, teacherLabel(this.teacherName), 22, C.yellow).setDepth(941);
  }

  teacherSay(text, color) {
    const t = headText(this, this.teachBox.x - 10, this.teachBox.y - 200, text, 46, color).setDepth(1600).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 180, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, delay: 900, duration: 300, onComplete: () => t.destroy() });
    this.tweens.add({ targets: this.teachBox, angle: { from: -5, to: 5 }, yoyo: true, duration: 120, onComplete: () => this.teachBox.setAngle(0) });
  }

  makeAdriana() {
    this.adrBox = this.add.container(ADR.x, ADR.y).setScale(ADR.s).setDepth(950);
    this.adrBody = this.add.image(0, 0, 'adr_walk_a').setOrigin(0.5, 1);
    const face = this.textures.exists('adr_face');
    const head = this.add.image(2, -244, face ? 'adr_face' : 'adr_head').setOrigin(0.5, face ? 0.5 : 0.56);
    if (face) head.setDisplaySize(118, 118);
    // drono pultelis
    const remote = this.add.rectangle(4, -104, 64, 36, 0x2a1840).setStrokeStyle(5, 0x14081f);
    const btn = this.add.circle(18, -104, 7, 0xff3ea5);
    this.adrBox.add([this.adrBody, head, remote, btn]);
  }

  adrCelebrate() {
    this.adrBody.setTexture('adr_pose');
    this.tweens.add({ targets: this.adrBox, y: this.adrBox.y - 24, yoyo: true, duration: 180, repeat: 1 });
    this.time.delayedCall(1000, () => this.adrBody.setTexture('adr_walk_a'));
  }

  makeHud() {
    const D = 1800;
    headText(this, 40, 54, STAGE.mission, 46, C.yellow).setOrigin(0, 0.5).setDepth(D);
    this.counterText = headText(this, 1500, 54, '', 34, C.white).setDepth(D);
    this.timerText = bodyText(this, 1880, 40, '⏱ 1:00', 30, '#f1e6ff').setOrigin(1, 0.5).setDepth(D);
    this.stateText = headText(this, 960, 54, '', 34, C.yellow).setDepth(D); // viršuje - kad neuždengtų eglės viršūnės
    this.countText = headText(this, 960, 640, '', 56, C.yellow).setDepth(1955).setAlpha(0);
  }

  say(text, color) { this.stateText.setText(text).setColor(color); }

  pop(x, y, text, color, size = 40) {
    const t = headText(this, x, y, text, size, color).setDepth(1600).setScale(0.5);
    this.tweens.add({ targets: t, scale: 1, duration: 150, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: y - 60, delay: 700, duration: 300, onComplete: () => t.destroy() });
  }

  firework(x, y) {
    const col = pick([0xffd23f, 0xff3ea5, 0x2de2e6, 0x3ddc84, 0xffffff, 0xff7a3c]);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const d = this.add.circle(x, y, 6, col).setBlendMode(Phaser.BlendModes.ADD);
      this.fx.add(d);
      const r = rand(70, 120);
      this.tweens.add({ targets: d, duration: 1100, onComplete: () => d.destroy(), props: { x: { value: x + Math.cos(a) * r, ease: 'Quad.Out' }, y: { value: y + Math.sin(a) * r + 20, ease: 'Quad.Out' }, alpha: { value: 0, ease: 'Cubic.In' } } });
    }
    this.A.sfx.pop();
  }

  maybeSub(text, color = C.white, gap = 2600) {
    if (!text || this.time.now - this.lastSub < gap) return;
    this.lastSub = this.time.now;
    this.sub(text, color);
  }

  sub(text, color, y = 925) { // apačioje - kad neuždengtų žvaigždės kelio
    subtitle(this, text, { color, y });
    if (this._subtitle) this._subtitle.setDepth(1700);
  }

  bigBanner(title, sub, opts) {
    banner(this, title, sub, opts).setDepth(1900);
  }

  // ---------------- ciklas ----------------
  update(_, deltaMs) {
    if (this.stageStart != null && this.mode !== 'result') this.stageT = (this.game.loop.time - this.stageStart) / 1000;
    const left = Math.max(0, TOTAL_S - this.stageT);
    this.timerText.setText(`⏱ ${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`).setColor(left <= 15 && this.mode !== 'result' ? C.red : '#f1e6ff');
    const dt = Math.min(deltaMs || 16, 66) / 1000;

    // dronas su žvaigžde
    if (!this.starPlaced) {
      this.droneT += dt;
      this.drone.x = TREE.x + DRONE.amp * Math.sin((this.droneT * Math.PI * 2) / DRONE.period);
      this.drone.y = DRONE.y + Math.sin(this.droneT * 5) * 5;
    }

    if (this.mode === 'decor') {
      const list = [...this.orn.values()];
      const allHung = list.every((o) => o.hung);
      if (this.stageT >= DECOR_MAX_S && !this.starPlaced && !this.starFalling) this.dropStar(true);
      if (this.starPlaced && (allHung || this.stageT >= DECOR_MAX_S)) this.becomeReady();
      // automatinis režimas (testams): Adriana kartais pirmą kartą paleidžia per anksti
      if (this.autoplay && !this.starPlaced && !this.starFalling) {
        const dx = this.drone.x - TREE.x;
        if (!this.autoMiss && Math.abs(dx) > 110 && Math.abs(dx) < 130 && Math.random() < 0.5) { this.autoMiss = true; this.dropStar(); }
        else if (Math.abs(dx) < 14) { this.autoMiss = true; this.dropStar(); }
      }
    }
    if (this.autoplay && this.mode === 'sync' && this.winOpen && !this.adrSync && this.time.now >= this.autoSyncAt) this.adrSpace();
    if (this.stageStart != null && ['decor', 'ready', 'sync', 'retry'].includes(this.mode) && this.stageT >= FINALE_BY_S) this.finale();
  }
}
