// 1 etapas: Soskė broliukams.
//
// Adriana (← →) bėgioja po kambarį ir ieško dviejų soskių (↓ arba TARPAS),
// radusi neša jas broliukams į maniežą. Laiko - 30 s.
// Klasiokų namuose nesimato, matosi tik jų veiksmai:
//  - ramintojai: žaisliukas (ašaros mažėja), lopšinė;
//  - gąsdintojai: BŪ! (pabaisos šešėlis, ašaros didėja), kaukimas;
//  - prie jungiklio: išjungti šviesą (lieka šviesos ratas aplink Adrianą), girlianda;
//  - mokytoja: vienas stebuklas (TV bokštas užsidega kaip eglė), durų skambutis.
// Jei broliuko ašarų matuoklis prisipildo - verksmo priepuolis, Adriana sekundę užsikemša ausis.
// Broliukai (2 metų) sėdi prie medinio traukinuko bėgių prieš didelį langą su TV bokštu.
// Jų verksmas girdisi visą laiką: kuo daugiau ašarų (ir kuo daugiau gąsdina), tuo garsiau.

import { headText, bodyText, banner, subtitle, floatText, missionCard, C } from '../fx.js';
import { Tribune } from '../tribune.js';
import { STAGES } from '../stages.js';
import { HOME_WINDOW, TOWER } from '../art-home.js';
import { phoneResult } from '../results.js';

const STAGE = STAGES.broliai;
const FLOOR = 905; // Adrianos pėdų linija
const SPEED = 640;
const TIME_LIMIT = 30;
const SEARCH_TIME = 0.55;
const STUN_TIME = 1.0;
const KIDS_X = 960; // broliukų vieta (prie traukinuko)
const KIDS_HALF = 230; // kiek arti broliukų reikia būti, kad atiduotum soskę
const BABY_Y = 884; // sėdinčių broliukų apačia
const TRACK = { x: 960, y: 872, rx: 250, ry: 58 }; // medinių bėgių ovalas
const TRAIN_SPEED = 0.55; // rad/s

const TEARS_START = 30;
const TEARS_RATE = 2.0; // per sekundę
const TEARS_AFTER_TANTRUM = 60;
const SCARE = 10;
const SCARE_GAP = 1400; // ms tarp BŪ! (visiems kartu)
const HOWL = 2;
const TOY = 8;
const TOY_GAP = 900;
const LULLABY = 2;
const BELL = 8;
const MIRACLE = 25;
const MIRACLE_FREEZE = 5000;
const DARK_MS = 3000;
const DARK_MAX = 4500;
const DARK_REST = 2500;

// Slėptuvės: x - centras, w - plotis (paieškos zona).
const SPOTS = [
  { id: 'sofa', tex: 'home_sofa', x: 200, w: 340 },
  { id: 'zaislai', tex: 'home_toybox', x: 470, w: 170 },
  { id: 'krepsys', tex: 'home_basket', x: 640, w: 140 },
  { id: 'egle', tex: 'home_xtree', x: 1310, w: 250 },
  { id: 'lentyna', tex: 'home_shelf', x: 1550, w: 210 },
  { id: 'saldytuvas', tex: 'home_fridge', x: 1790, w: 210 },
];
const BROTHERS = [
  { x: 875, tex: 'baby_sit1', hair: 0x8a5a33, voice: 430 },
  { x: 1045, tex: 'baby_sit2', hair: 0xe0b45c, voice: 500 },
];
const TOYS = ['toy_bear', 'toy_duck', 'toy_ball', 'toy_dino', 'toy_bunny', 'toy_car', 'toy_rattle', 'toy_blocks'];
const SWITCH = { x: 500, y: 560 };
const MONSTER_AT = [{ x: 420, y: 500 }, { x: 1520, y: 470 }];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export class BroliaiScene extends Phaser.Scene {
  constructor() { super('Broliai'); }

  create() {
    const A = window.AGTA;
    this.A = A;
    this.mode = 'intro'; // intro -> count -> play -> end -> result
    A.host.setPhase('intro', STAGE);

    // Phaser naudoja tą patį scenos objektą, todėl visą būseną nustatom iš naujo.
    this.timeLeft = TIME_LIMIT;
    this.elapsed = 0;
    this.lastTick = 99;
    this.timerDanger = undefined;
    this.saidTen = false;
    this.lastSub = 0;
    this.dir = 1;
    this.walkT = 0;
    this.searchT = 0;
    this.searchSpot = null;
    this.stunT = 0;
    this.carrying = 0;
    this.delivered = 0;
    this.giving = false;
    this.tantrums = 0;
    this.found = 0;
    this.lastScare = 0;
    this.lastToy = 0;
    this.lastHowl = 0;
    this.freezeUntil = 0;
    this.miracleUsed = false;
    this.miracleBy = '';
    this.dark = { on: false, start: 0, until: 0, ready: 0 };
    this.garlandUntil = 0;
    this.wasParty = false;
    this.voices = null;
    this.toys = [];
    this.stats = new Map();
    this.autoplay = !!this.autoplay;

    this.makeRoom();
    this.makeSpots();
    this.makeBrothers();
    this.makeAdriana();
    this.makeDarkness();
    this.makeGarland();
    this.makeHud();
    this.hideSoskes();
    this.tribune = new Tribune(this, A.host, { y: 1006, maxSize: 64 });
    this.card = missionCard(this, {
      nr: STAGE.nr,
      mission: STAGE.mission,
      title: STAGE.title,
      tip: A.lines.pick('broliai', 'intro'),
      controls: 'Adriana: bėgti - ← →   ·   ieškoti - ↓ arba TARPAS',
    });

    const kb = this.input.keyboard;
    this.keys = kb.addKeys({ left: 'LEFT', right: 'RIGHT', a: 'A', d: 'D' });
    kb.on('keydown-ENTER', () => this.onEnter());
    kb.on('keydown-SPACE', (e) => { if (this.mode === 'intro') this.onEnter(); else if (!e.repeat) this.search(); });
    kb.on('keydown-DOWN', (e) => { if (!e.repeat) this.search(); });
    kb.on('keydown-S', (e) => { if (!e.repeat) this.search(); });
    kb.on('keydown-R', () => this.scene.restart());

    const off = A.host.on('press', (e) => this.onPress(e));
    this.events.once('shutdown', () => { off(); this.stopCrying(); });
  }

  // ---------------- valdymas ----------------
  onEnter() {
    if (this.mode === 'intro') this.countdown();
    else if (this.mode === 'result') {
      this.A.host.markDone(STAGE.id);
      this.A.go('Map');
    }
  }

  countdown() {
    this.mode = 'count';
    this.tweens.add({ targets: this.card, alpha: 0, duration: 300, onComplete: () => this.card.destroy() });
    const nums = ['3', '2', '1', 'IEŠKOK!'];
    nums.forEach((n, i) => {
      this.time.delayedCall(i * 700, () => {
        const last = i === nums.length - 1;
        const t = headText(this, 960, 470, n, last ? 190 : 240, last ? C.yellow : C.white).setDepth(900);
        t.setScale(1.8).setAlpha(0);
        this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 200, ease: 'Back.Out' });
        this.tweens.add({ targets: t, alpha: 0, delay: 480, duration: 200, onComplete: () => t.destroy() });
        if (last) { this.A.sfx.go(); this.startPlay(); } else this.A.sfx.count();
      });
    });
  }

  startPlay() {
    this.mode = 'play';
    this.A.host.setPhase('play', STAGE);
    this.A.sfx.cry();
    subtitle(this, this.A.lines.pick('broliai', 'start'), { color: C.yellow });
  }

  // ---------------- kambarys ----------------
  makeRoom() {
    const W = HOME_WINDOW;
    this.add.image(W.x + W.w / 2, W.y + W.h / 2, 'home_sky').setDisplaySize(W.w, W.h).setDepth(-120);
    this.towerX = W.x + TOWER.x;
    this.towerY = W.y + TOWER.y + 6;
    this.add.image(this.towerX, this.towerY, 'tv_tower').setOrigin(0.5, 1).setDepth(-115);
    this.towerLights = this.add.container(0, 0).setDepth(-114).setVisible(false);
    // sniegas už lango
    this.add.particles(0, 0, 'flake', {
      x: { min: W.x, max: W.x + W.w }, y: W.y - 10, lifespan: 9000,
      speedY: { min: 40, max: 90 }, speedX: { min: -20, max: 10 }, scale: { min: 0.4, max: 1 },
      quantity: 1, frequency: 160,
    }).setDepth(-113);
    this.add.image(960, 540, 'home_room').setDepth(-100);
    this.switchImg = this.add.image(SWITCH.x, SWITCH.y, 'switch_on').setDepth(-90);
  }

  makeSpots() {
    this.spots = SPOTS.map((s) => {
      const img = this.add.image(s.x, FLOOR, s.tex).setOrigin(0.5, 1).setDepth(100);
      return { ...s, img, top: FLOOR - img.height, has: false, searched: false, mark: null };
    });
    this.hint = headText(this, 0, 0, '↓', 54, C.yellow).setDepth(560).setVisible(false);
    this.tweens.add({ targets: this.hint, scale: 1.2, yoyo: true, repeat: -1, duration: 350 });
  }

  hideSoskes() {
    const order = Phaser.Utils.Array.Shuffle([...this.spots]);
    order[0].has = true;
    order[1].has = true;
  }

  makeBrothers() {
    this.makeTrain();
    this.brothers = BROTHERS.map((b, i) => {
      const body = this.add.image(b.x, BABY_Y, b.tex).setOrigin(0.5, 1).setDepth(160);
      const head = this.add.image(0, 0, 'baby_sad');
      const hair = this.add.image(0, 0, 'baby_hair').setTint(b.hair);
      const hb = this.add.container(b.x, BABY_Y - 162, [head, hair]).setDepth(165).setScale(i ? 0.94 : 1);
      const y = 628;
      const bg = this.add.rectangle(b.x, y, 140, 22, 0x0b0418, 0.85).setStrokeStyle(4, 0x14081f).setDepth(190);
      const fill = this.add.rectangle(b.x - 66, y, 1, 12, 0x6fd3ff).setOrigin(0, 0.5).setDepth(191);
      const drop = this.add.image(b.x - 88, y, 'tear').setDepth(192).setScale(1.2);
      const calm = bodyText(this, b.x, y, 'Ramus 😴', 24, C.green).setDepth(192).setVisible(false);
      return {
        ...b, i, body, head, hb, bg, fill, drop, calm,
        tears: TEARS_START + i * 8, isCalm: false, scaredUntil: 0, tearT: 0, crying: false, face: 'baby_sad',
      };
    });
  }

  // ---------------- Adriana ----------------
  makeAdriana() {
    const box = this.add.container(KIDS_X - 420, FLOOR).setDepth(300);
    this.adrBody = this.add.image(0, 0, 'adr_run1').setOrigin(0.5, 1);
    const hasFace = this.textures.exists('adr_face');
    this.adrHead = this.add.image(4, -196, hasFace ? 'adr_face' : 'adr_head').setOrigin(0.5, hasFace ? 0.5 : 0.56);
    if (hasFace) this.adrHead.setDisplaySize(124, 124);
    box.add([this.adrBody, this.adrHead]);
    this.adr = box;
    this.shadow = this.add.ellipse(box.x, FLOOR + 4, 120, 22, 0x000000, 0.35).setDepth(290);
    // nešamos soskės virš galvos
    this.carryIcons = [0, 1].map((k) => this.add.image(0, 0, 'soske').setDepth(310).setScale(0.8).setVisible(false));
  }

  spotAt(x) {
    return this.spots.find((s) => Math.abs(x - s.x) < s.w / 2);
  }

  search() {
    if (this.mode !== 'play' || this.searchT > 0 || this.stunT > 0) return;
    const s = this.spotAt(this.adr.x);
    if (!s) return;
    if (s.searched) {
      floatText(this, s.x, s.top - 40, this.A.lines.pick('broliai', 'searched'), { color: C.white, size: 28 });
      return;
    }
    this.searchT = SEARCH_TIME;
    this.searchSpot = s;
    this.A.sfx.rustle();
    this.tweens.add({ targets: s.img, angle: { from: -3, to: 3 }, yoyo: true, repeat: 2, duration: 80, onComplete: () => s.img.setAngle(0) });
    for (let k = 0; k < 5; k++) {
      const p = this.add.image(s.x + rand(-s.w / 3, s.w / 3), FLOOR - 40, 'flake').setDepth(305).setScale(rand(1, 2)).setTint(0xd9c8ff);
      this.tweens.add({ targets: p, y: p.y - rand(60, 120), x: p.x + rand(-40, 40), alpha: 0, duration: 500, onComplete: () => p.destroy() });
    }
  }

  reveal(s) {
    s.searched = true;
    if (s.has) {
      s.has = false;
      this.found += 1;
      this.A.sfx.plus();
      const p = this.add.image(s.x, s.top + 30, 'soske').setDepth(320).setScale(0.4);
      this.tweens.add({ targets: p, y: s.top - 60, scale: 1.4, duration: 260, ease: 'Back.Out' });
      this.tweens.add({
        targets: p, x: this.adr.x, y: this.adr.y - 300, scale: 0.8, delay: 420, duration: 260,
        onComplete: () => { p.destroy(); this.carrying += 1; },
      });
      floatText(this, s.x, s.top - 110, 'SOSKĖ!', { color: C.yellow, size: 46, rise: 60, ms: 1300 });
      this.maybeSub(this.A.lines.pick('broliai', 'found'), C.yellow, 0);
    } else {
      floatText(this, s.x, s.top - 50, this.A.lines.pick('broliai', 'junk'), { color: C.white, size: 30, rise: 70, ms: 1600 });
    }
    s.mark = bodyText(this, s.x, s.top - 18, '✗', 30, '#b9a6dd').setDepth(120).setAlpha(0.85);
  }

  giveSoske() {
    const b = this.brothers.filter((x) => !x.isCalm).sort((p, q) => q.tears - p.tears)[0];
    if (!b) return;
    this.giving = true;
    this.carrying -= 1;
    const p = this.add.image(this.adr.x, this.adr.y - 300, 'soske').setDepth(330).setScale(0.8);
    this.tweens.add({
      targets: p, x: b.x, y: b.hb.y + 30, duration: 320, ease: 'Quad.Out',
      onComplete: () => {
        p.destroy();
        this.giving = false;
        b.isCalm = true;
        b.calm.setVisible(true);
        b.bg.setVisible(false);
        b.fill.setVisible(false);
        b.drop.setVisible(false);
        this.tweens.add({ targets: b, tears: 0, duration: 600 });
        this.delivered += 1;
        this.soskeIcons[this.delivered - 1].clearTint().setAlpha(1);
        this.tweens.add({ targets: this.soskeIcons[this.delivered - 1], scale: 1.3, yoyo: true, duration: 160 });
        this.A.sfx.plus();
        floatText(this, b.x, b.hb.y - 80, '😴', { size: 60, rise: 50 });
        this.maybeSub(this.A.lines.pick('broliai', 'give'), C.green, 0);
        if (this.delivered >= 2 && this.mode === 'play') this.win();
      },
    });
  }

  tantrum(b) {
    this.tantrums += 1;
    b.tears = TEARS_AFTER_TANTRUM;
    this.stunT = STUN_TIME;
    this.searchT = 0;
    this.searchSpot = null;
    this.A.sfx.cry();
    this.cameras.main.shake(320, 0.008);
    const t = headText(this, b.x, b.hb.y - 120, 'WAAAAH!', 70, C.red).setDepth(560).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1.1, duration: 200, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 40, delay: 700, duration: 400, onComplete: () => t.destroy() });
    floatText(this, this.adr.x, this.adr.y - 330, '🙉', { size: 56, rise: 40 });
    this.maybeSub(this.A.lines.pick('broliai', 'tantrum'), C.orange, 1500);
  }

  // ---------------- tamsa ir girlianda ----------------
  makeDarkness() {
    const col = 0x05010d;
    const a = 0.93;
    this.darkBox = this.add.container(0, 0).setDepth(500).setAlpha(0);
    this.darkHole = this.add.image(0, 0, 'dark_hole');
    this.darkRects = [0, 1, 2, 3].map(() => this.add.rectangle(0, 0, 10, 10, col, a).setOrigin(0));
    this.darkBox.add([this.darkHole, ...this.darkRects]);
  }

  placeDarkness() {
    const R = 320;
    const cx = Math.round(this.adr.x);
    const cy = Math.round(this.adr.y - 150);
    this.darkHole.setPosition(cx, cy);
    const [top, bottom, left, right] = this.darkRects;
    top.setPosition(0, 0).setSize(1920, Math.max(0, cy - R));
    bottom.setPosition(0, cy + R).setSize(1920, Math.max(0, 1080 - cy - R));
    left.setPosition(0, cy - R).setSize(Math.max(0, cx - R), 2 * R);
    right.setPosition(cx + R, cy - R).setSize(Math.max(0, 1920 - cx - R), 2 * R);
  }

  lightsOff(player) {
    const now = this.time.now;
    const d = this.dark;
    this.A.sfx.click();
    this.switchImg.setTexture('switch_off');
    this.label(SWITCH.x, SWITCH.y - 70, `${player.name}: spragt!`, C.white);
    if (this.mode !== 'play') return;
    if (d.on) {
      d.until = Math.min(d.until + 1000, d.start + DARK_MAX);
      return;
    }
    if (now < d.ready) return;
    d.on = true;
    d.start = now;
    d.until = now + DARK_MS;
    this.stat(player, 'tamsa');
    this.tweens.killTweensOf(this.darkBox);
    this.tweens.add({ targets: this.darkBox, alpha: 1, duration: 150 });
    this.maybeSub(this.A.lines.pick('broliai', 'dark', { vardas: player.name }), C.teal, 1500);
  }

  lightsOn() {
    const d = this.dark;
    d.on = false;
    d.ready = this.time.now + DARK_REST;
    this.switchImg.setTexture('switch_on');
    this.tweens.killTweensOf(this.darkBox);
    this.tweens.add({ targets: this.darkBox, alpha: 0, duration: 250 });
  }

  makeGarland() {
    this.bulbs = [];
    const g = this.add.graphics().setDepth(520);
    g.lineStyle(4, 0x14081f, 1);
    const COLORS = [0xff3ea5, 0xffd23f, 0x2de2e6, 0x3ddc84, 0xff9a3c];
    const hooks = [[430, 590], [1370, 1620, 1880]];
    let k = 0;
    for (const xs of hooks) {
      for (let h = 0; h < xs.length - 1; h++) {
        const x0 = xs[h];
        const x1 = xs[h + 1];
        const curve = new Phaser.Curves.QuadraticBezier(
          new Phaser.Math.Vector2(x0, 34), new Phaser.Math.Vector2((x0 + x1) / 2, 96), new Phaser.Math.Vector2(x1, 34),
        );
        curve.draw(g, 24);
        const n = Math.round((x1 - x0) / 46);
        for (let i = 1; i < n; i++) {
          const p = curve.getPoint(i / n);
          const col = COLORS[k % COLORS.length];
          const glow = this.add.circle(p.x, p.y + 10, 16, col, 0.25).setDepth(519);
          const bulb = this.add.circle(p.x, p.y + 10, 8, col).setStrokeStyle(3, 0x14081f).setDepth(521);
          this.bulbs.push({ bulb, glow, col, k });
          k += 1;
        }
      }
    }
  }

  garlandParty(player) {
    this.garlandUntil = this.time.now + 2500;
    this.A.sfx.twinkle();
    const b = pick(this.bulbs);
    this.label(b.bulb.x, b.bulb.y + 46, `${player.name} ✨`, C.yellow);
    if (Math.random() < 0.3) this.maybeSub(this.A.lines.pick('broliai', 'garland'), C.yellow, 4000);
  }

  // ---------------- klasiokų veiksmai ----------------
  stat(player, key) {
    const st = this.stats.get(player.pid) || { pid: player.pid, name: player.name, counts: {} };
    st.counts[key] = (st.counts[key] || 0) + 1;
    this.stats.set(player.pid, st);
  }

  label(x, y, text, color = C.white, size = 26) {
    floatText(this, x, y, text, { color, size, rise: 50, ms: 1400 }).setDepth(860);
  }

  maybeSub(text, color = C.white, gap = 2600) {
    if (!text || this.time.now - this.lastSub < gap) return;
    this.lastSub = this.time.now;
    subtitle(this, text, { color });
  }

  crying() {
    return this.brothers.filter((b) => !b.isCalm);
  }

  addTears(b, n) {
    if (b.isCalm || this.mode !== 'play') return;
    b.tears = Phaser.Math.Clamp(b.tears + n, 0, 100);
  }

  onPress({ player, action, role }) {
    this.stat(player, action);
    this.tribune.bounce(player.pid);
    if (this.mode !== 'play' && this.mode !== 'end') return;
    switch (action) {
      case 'zaislas': return this.toy(player);
      case 'lopsine': return this.lullaby(player);
      case 'bu': return this.boo(player);
      case 'kaukti': return this.howl(player);
      case 'isjungti': return this.lightsOff(player);
      case 'girlianda': return this.garlandParty(player);
      case 'stebuklas': return this.miracle(player);
      case 'skambutis': return this.doorbell(player);
      default: return role && undefined;
    }
  }

  toy(player) {
    const now = this.time.now;
    if (now - this.lastToy < TOY_GAP) {
      this.tribune.bubble(player.pid, '🧸', C.white);
      return;
    }
    this.lastToy = now;
    this.stat(player, 'zaislai');
    const target = this.crying().sort((p, q) => q.tears - p.tears)[0] || pick(this.brothers);
    const x = Phaser.Math.Clamp(target.x + rand(-100, 100), KIDS_X - 220, KIDS_X + 220);
    const ly = rand(866, 905);
    const t = this.add.image(x, -60, pick(TOYS)).setOrigin(0.5, 1).setScale(0.85).setDepth(ly > TRACK.y ? 172 : 158);
    this.tweens.add({
      targets: t, y: ly, angle: rand(-30, 30), duration: 650, ease: 'Bounce.Out',
      onComplete: () => {
        this.addTears(target, -TOY);
        this.A.sfx.pop();
        this.label(x, 800, player.name, C.green);
      },
    });
    this.toys.push(t);
    if (this.toys.length > 9) {
      const old = this.toys.shift();
      this.tweens.killTweensOf(old);
      old.destroy();
    }
    this.maybeSub(this.A.lines.pick('broliai', 'toy', { vardas: player.name }), C.green, 4000);
  }

  lullaby(player) {
    this.A.sfx.lullaby();
    const sx = rand(300, 1620);
    ['♪', '♫', '♪'].forEach((n, i) => {
      const t = bodyText(this, sx + i * 40, 200, n, 46, C.teal).setDepth(530).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 200, delay: i * 120 });
      this.tweens.add({
        targets: t, x: KIDS_X + rand(-140, 140), y: 700, delay: i * 120, duration: 1100, ease: 'Sine.InOut',
        onComplete: () => t.destroy(),
      });
    });
    this.time.delayedCall(900, () => this.crying().forEach((b) => this.addTears(b, -LULLABY)));
    this.label(sx, 160, player.name, C.teal, 22);
  }

  boo(player) {
    const now = this.time.now;
    if (now - this.lastScare < SCARE_GAP) {
      this.tribune.bubble(player.pid, 'bū...', C.white);
      return;
    }
    this.lastScare = now;
    this.stat(player, 'gasdino');
    const at = pick(MONSTER_AT);
    const m = this.add.image(at.x, at.y, 'home_monster').setDepth(-50).setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: m, scale: 1.05, alpha: 1, duration: 260, ease: 'Back.Out' });
    this.tweens.add({ targets: m, alpha: 0, delay: 900, duration: 350, onComplete: () => m.destroy() });
    const t = headText(this, at.x, at.y - 40, 'BŪ!', 110, C.red).setDepth(560).setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, delay: 800, duration: 300, onComplete: () => t.destroy() });
    this.label(at.x, at.y + 90, player.name, C.white, 30);
    this.A.sfx.boo();
    for (const b of this.crying()) {
      b.scaredUntil = now + 900;
      this.addTears(b, SCARE);
      this.tweens.add({ targets: b.hb, y: BABY_Y - 186, yoyo: true, duration: 120 });
    }
    this.maybeSub(this.A.lines.pick('broliai', 'scare', { vardas: player.name }), C.red, 3000);
  }

  howl(player) {
    const now = this.time.now;
    if (now - this.lastHowl < 1000) {
      this.tribune.bubble(player.pid, '🐺', C.white);
      return;
    }
    this.lastHowl = now;
    this.A.sfx.howl();
    const W = HOME_WINDOW;
    const t = headText(this, W.x + 400 + rand(-40, 40), W.y + 140, 'AUUU! 🐺', 54, C.white).setDepth(560).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, y: t.y - 30, duration: 300 });
    this.tweens.add({ targets: t, alpha: 0, delay: 900, duration: 300, onComplete: () => t.destroy() });
    this.label(t.x, W.y + 210, player.name, C.white, 22);
    for (const b of this.crying()) {
      this.addTears(b, HOWL);
      this.tweens.add({ targets: b.hb, angle: -14, yoyo: true, duration: 260, onComplete: () => b.hb.setAngle(0) });
    }
    if (Math.random() < 0.3) this.maybeSub(this.A.lines.pick('broliai', 'howl'), C.white, 4000);
  }

  doorbell(player) {
    this.A.sfx.bell();
    const t = headText(this, 150, 520, '🔔 DING-DONG!', 52, C.yellow).setDepth(560).setScale(0.5);
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.Out' });
    this.tweens.add({ targets: t, angle: { from: -6, to: 6 }, yoyo: true, repeat: 3, duration: 90 });
    this.tweens.add({ targets: t, alpha: 0, delay: 1100, duration: 300, onComplete: () => t.destroy() });
    t.setX(Math.max(t.width / 2 + 20, 150));
    this.label(t.x, 630, player.name, C.white, 24);
    for (const b of this.crying()) this.addTears(b, BELL);
    this.maybeSub(this.A.lines.pick('broliai', 'doorbell'), C.orange, 2000);
  }

  miracle(player) {
    if (this.miracleUsed) {
      this.tribune.bubble(player.pid, '🎄', C.white);
      return;
    }
    this.miracleUsed = true;
    this.miracleBy = player.name;
    this.freezeUntil = this.time.now + MIRACLE_FREEZE;
    this.A.sfx.miracle();
    this.lightTower();
    for (const b of this.crying()) this.addTears(b, -MIRACLE);
    const W = HOME_WINDOW;
    floatText(this, W.x + W.w / 2, W.y + 80, '✨ STEBUKLAS ✨', { color: C.yellow, size: 48, rise: 40, ms: 2200 }).setDepth(860);
    this.maybeSub(this.A.lines.pick('broliai', 'miracle', { vardas: player.name }), C.yellow, 0);
  }

  // TV bokštas tampa egle: lemputės kūgiu aplink bokštą ir žvaigždė viršuje.
  lightTower() {
    const box = this.towerLights;
    box.removeAll(true);
    box.setVisible(true);
    const x = this.towerX;
    const top = this.towerY - TOWER.h;
    const COLORS = [0xff3ea5, 0xffd23f, 0x2de2e6, 0x3ddc84, 0xffffff];
    box.add(this.add.ellipse(x, top + TOWER.h * 0.6, 220, TOWER.h * 0.9, 0xffd23f, 0.1));
    const rows = 18;
    for (let row = 0; row < rows; row++) {
      const y = top + 14 + row * ((TOWER.h - 40) / (rows - 1));
      const half = 5 + row * 5;
      const n = 3 + Math.floor(row / 3);
      for (let k = 0; k <= n; k++) {
        const dot = this.add.circle(x - half + (2 * half * k) / n, y, 4, COLORS[(row + k) % COLORS.length]);
        box.add(dot);
        this.tweens.add({ targets: dot, alpha: 0.3, yoyo: true, repeat: -1, duration: 260 + ((row * 3 + k) % 5) * 90 });
      }
    }
    const star = this.add.star(x, top - 4, 5, 9, 20, 0xffd23f).setStrokeStyle(3, 0x14081f);
    box.add(star);
    this.tweens.add({ targets: star, angle: 360, repeat: -1, duration: 4000 });
    box.setAlpha(0);
    this.tweens.add({ targets: box, alpha: 1, duration: 500 });
  }

  // Mediniai bėgiai ovalu ir traukinukas, kuris važinėja aplink broliukus.
  makeTrain() {
    const T = TRACK;
    const g = this.add.graphics().setDepth(95);
    g.lineStyle(34, 0x14081f, 1).strokeEllipse(T.x, T.y, T.rx * 2, T.ry * 2);
    g.lineStyle(26, 0xd9a35b, 1).strokeEllipse(T.x, T.y, T.rx * 2, T.ry * 2);
    g.lineStyle(3, 0x8a5a33, 0.9);
    g.strokeEllipse(T.x, T.y, T.rx * 2 - 12, T.ry * 2 - 12);
    g.strokeEllipse(T.x, T.y, T.rx * 2 + 12, T.ry * 2 + 12);
    this.trainT = 0;
    this.train = ['train_engine', 'train_car', 'train_car'].map((k) => this.add.image(0, 0, k).setOrigin(0.5, 0.9));
    this.placeTrain();
  }

  placeTrain() {
    const T = TRACK;
    this.train.forEach((img, k) => {
      const a = this.trainT - k * 0.42;
      const sin = Math.sin(a);
      img.setPosition(T.x + T.rx * Math.cos(a), T.y + T.ry * sin + 6);
      const dx = -Math.sin(a); // judėjimo kryptis pagal x
      const sc = 0.62 + 0.14 * sin;
      img.setScale(dx < 0 ? -sc : sc, sc);
      img.setDepth(sin > 0 ? 170 : 150);
    });
  }

  // ---------------- HUD ----------------
  makeHud() {
    const D = 750;
    headText(this, 40, 54, STAGE.mission, 46, C.yellow).setOrigin(0, 0.5).setDepth(D);
    bodyText(this, 40, 114, 'Soskės', 26, '#f1e6ff').setOrigin(0, 0.5).setDepth(D);
    this.soskeIcons = [0, 1].map((i) => this.add.image(178 + i * 64, 112, 'soske').setDepth(D).setScale(0.75).setTint(0x4a3a66).setAlpha(0.8));
    this.timerText = headText(this, 960, 70, '0:30', 92, C.white).setDepth(D);
  }

  updateHud() {
    const t = Math.max(0, this.timeLeft);
    const s = Math.ceil(t);
    this.timerText.setText(`0:${String(s).padStart(2, '0')}`);
    const danger = t <= 10 && this.mode === 'play';
    if (danger !== this.timerDanger) {
      this.timerDanger = danger;
      this.timerText.setColor(danger ? C.red : C.white);
    }
    if (danger && s !== this.lastTick) {
      this.lastTick = s;
      this.A.sfx.tick();
      this.tweens.add({ targets: this.timerText, scale: 1.18, yoyo: true, duration: 120 });
      if (!this.saidTen && s >= 9) { this.saidTen = true; this.maybeSub(this.A.lines.pick('broliai', 'ten'), C.red, 0); }
    }
  }

  // ---------------- pabaiga ----------------
  // Verksmo garsas: kiekvienam broliukui savas balsas.
  updateCrying() {
    const sfx = this.A.sfx;
    const live = this.mode === 'play' || this.mode === 'end';
    if (!this.voices) {
      if (!live || !sfx.ready) return;
      this.voices = this.brothers.map((b) => sfx.cryVoice(b.voice));
      if (this.voices.some((v) => !v)) { this.stopCrying(); return; }
    }
    const now = this.time.now;
    this.brothers.forEach((b, i) => {
      let level = 0;
      if (live && !b.isCalm) {
        level = Phaser.Math.Clamp((b.tears - 15) / 85, 0.06, 1);
        if (now < b.scaredUntil) level = Math.min(1, level + 0.3);
      }
      this.voices[i].update(level);
    });
  }

  stopCrying() {
    if (this.voices) this.voices.forEach((v) => v && v.stop());
    this.voices = null;
  }

  endPlay() {
    this.mode = 'end';
    if (this.dark.on) this.lightsOn();
    this.hint.setVisible(false);
  }

  win() {
    this.endPlay();
    this.A.sfx.win();
    banner(this, 'MISIJA ĮVYKDYTA!', '+100 RESPEKTO', { color: C.yellow, hold: 2800 });
    this.time.delayedCall(1200, () => subtitle(this, this.A.lines.pick('broliai', 'success'), { color: C.yellow }));
    this.time.delayedCall(3400, () => this.showResult(true));
  }

  fail() {
    this.endPlay();
    this.A.sfx.fail();
    banner(this, 'BROLIUKAI VERKIA', 'BET LABAI MIELAI', { color: C.red, hold: 2600 });
    this.time.delayedCall(1000, () => subtitle(this, this.A.lines.pick('broliai', 'fail'), { color: C.orange }));
    this.time.delayedCall(3400, () => this.showResult(false));
  }

  showResult(ok) {
    this.mode = 'result';
    this.stopCrying();
    this.A.host.setPhase('result', STAGE);
    const box = this.add.container(960, 500).setDepth(950).setAlpha(0);
    box.add(this.add.rectangle(0, 0, 1240, 600, 0x0b0418, 0.9).setStrokeStyle(6, ok ? 0xffd23f : 0xff4d5e));
    box.add(headText(this, 0, -235, ok ? 'BROLIUKAI RAMŪS!' : 'BEVEIK!', 80, ok ? C.yellow : C.orange));
    const all = [...this.stats.values()];
    const sum = (k) => all.reduce((s, x) => s + (x.counts[k] || 0), 0);
    const best = (k) => all.map((x) => [x, x.counts[k] || 0]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
    const rows = [
      [`Laikas: ${this.elapsed.toFixed(1).replace('.', ',')} s   ·   Soskės: ${this.delivered}/2   ·   Verksmo priepuoliai: ${this.tantrums}`, C.white],
      [`Žaisliukai: ${sum('zaislai')}   ·   BŪ!: ${sum('gasdino')}   ·   Tamsa: ${sum('tamsa')} k.`, C.white],
    ];
    const calm = best('zaislai');
    if (calm) rows.push([`Geriausias ramintojas: ${calm[0].name} (${calm[1]})`, C.green]);
    const scary = best('gasdino');
    if (scary) rows.push([`Baisiausias šešėlis: ${scary[0].name} (${scary[1]})`, C.red]);
    const lights = best('tamsa');
    if (lights) rows.push([`Šviesų meistras: ${lights[0].name}`, C.teal]);
    if (this.miracleBy) rows.push([`TV bokštą uždegė: ${this.miracleBy}`, C.yellow]);
    const pidOf = (name) => this.A.host.playerByName(name)?.pid;
    phoneResult(this, {
      head: ok ? 'BROLIUKAI RAMŪS!' : 'BEVEIK!', ok,
      awards: [
        calm && [calm[0].pid, '🧸', 'Geriausias ramintojas!'],
        scary && [scary[0].pid, '👻', 'Baisiausias šešėlis!'],
        lights && [lights[0].pid, '💡', 'Šviesų meistras!'],
        this.miracleBy && [pidOf(this.miracleBy), '🗼', 'Uždegei TV bokštą!', 'Uždegėte TV bokštą!'],
      ],
    });
    rows.slice(0, 6).forEach(([r, c], i) => box.add(bodyText(this, 0, -140 + i * 54, r, 30, c)));
    const next = headText(this, 0, 240, 'ENTER - TOLIAU', 48, C.white);
    this.tweens.add({ targets: next, alpha: 0.3, yoyo: true, repeat: -1, duration: 650 });
    box.add(next);
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
  }

  // Automatinis žaidėjas (testams ir repeticijai be klaviatūros).
  autoMove() {
    if (this.carrying > 0 || this.giving) return KIDS_X;
    const left = this.spots.filter((s) => !s.searched);
    if (!left.length) return this.adr.x;
    const s = left.sort((a, b) => Math.abs(a.x - this.adr.x) - Math.abs(b.x - this.adr.x))[0];
    if (Math.abs(s.x - this.adr.x) < s.w / 4) { this.search(); return this.adr.x; }
    return s.x;
  }

  // ---------------- ciklas ----------------
  update(_, deltaMs) {
    const dt = Math.min(deltaMs, 66) / 1000;
    const now = this.time.now;
    const play = this.mode === 'play';

    if (play) {
      this.timeLeft -= dt;
      this.elapsed += dt;
    }

    // Adrianos judėjimas
    let move = 0;
    if (play && this.searchT <= 0 && this.stunT <= 0) {
      if (this.autoplay) {
        const tx = this.autoMove();
        if (Math.abs(tx - this.adr.x) > 8) move = Math.sign(tx - this.adr.x);
      } else {
        if (this.keys.left.isDown || this.keys.a.isDown) move -= 1;
        if (this.keys.right.isDown || this.keys.d.isDown) move += 1;
      }
    }
    if (move) {
      this.dir = move;
      this.adr.x = Phaser.Math.Clamp(this.adr.x + move * SPEED * dt, 70, 1850);
      this.walkT += dt;
    }
    this.adr.setScale(this.dir, 1);
    this.shadow.x = this.adr.x;

    if (this.stunT > 0) this.stunT -= dt;
    if (this.searchT > 0) {
      this.searchT -= dt;
      if (this.searchT <= 0 && this.searchSpot) {
        const s = this.searchSpot;
        this.searchSpot = null;
        if (play) this.reveal(s);
      }
    }
    let tex = 'adr_run1';
    if (this.searchT > 0) tex = 'adr_duck';
    else if (this.stunT > 0) tex = 'adr_jump';
    else if (move) tex = Math.floor(this.walkT / 0.13) % 2 ? 'adr_run1' : 'adr_run2';
    this.adrBody.setTexture(tex);
    this.adrHead.y = this.searchT > 0 ? -162 : -196 + (move ? Math.sin(this.walkT * 24) * 4 : 0);
    if (this.stunT > 0) this.adrHead.setAngle(Math.sin(now / 40) * 8);
    else this.adrHead.setAngle(0);

    // nešamos soskės
    this.carryIcons.forEach((ic, k) => {
      ic.setVisible(k < this.carrying);
      ic.setPosition(this.adr.x + (k - (this.carrying - 1) / 2) * 50, this.adr.y - 330 + Math.sin(now / 160 + k) * 6);
    });

    // atiduoti soskę
    if (play && this.carrying > 0 && !this.giving && this.stunT <= 0 && Math.abs(this.adr.x - KIDS_X) < KIDS_HALF) this.giveSoske();

    // užuomina "↓" virš slėptuvės
    const spot = play && this.searchT <= 0 ? this.spotAt(this.adr.x) : null;
    if (spot && !spot.searched) this.hint.setVisible(true).setPosition(spot.x, spot.top - 40);
    else this.hint.setVisible(false);

    // broliukai
    const frozen = now < this.freezeUntil;
    for (const b of this.brothers) {
      if (play && !b.isCalm && !frozen) b.tears = Math.min(100, b.tears + TEARS_RATE * dt);
      if (play && !b.isCalm && b.tears >= 100) this.tantrum(b);
      let face = 'baby_sad';
      if (b.isCalm) face = 'baby_calm';
      else if (now < b.scaredUntil) face = 'baby_scared';
      else if (b.tears >= 55) face = 'baby_cry';
      if (face !== b.face) { b.face = face; b.head.setTexture(face); }
      const crying = face === 'baby_cry';
      b.hb.x = b.x + (crying ? Math.sin(now / 45 + b.i) * 4 : 0);
      b.body.y = BABY_Y + (crying ? Math.abs(Math.sin(now / 120 + b.i)) * -8 : 0);
      if (crying && this.mode !== 'result') {
        b.tearT -= dt;
        if (b.tearT <= 0) {
          b.tearT = 0.16;
          for (const side of [-1, 1]) {
            const d = this.add.image(b.hb.x + side * 32, b.hb.y + 12, 'tear').setDepth(175);
            this.tweens.add({ targets: d, x: d.x + side * rand(30, 70), y: d.y + rand(90, 140), alpha: 0, duration: 600, ease: 'Quad.In', onComplete: () => d.destroy() });
          }
        }
      }
      if (!b.isCalm) {
        const f = b.tears / 100;
        b.fill.setSize(Math.max(1, 132 * f), 12);
        const col = f < 0.5 ? 0x6fd3ff : f < 0.8 ? 0xffd23f : 0xff4d5e;
        if (col !== b.col) { b.col = col; b.fill.setFillStyle(col); }
      }
    }

    // traukinukas
    this.trainT += TRAIN_SPEED * dt;
    this.placeTrain();

    // tamsa
    if (this.dark.on && now > this.dark.until) this.lightsOn();
    if (this.darkBox.alpha > 0) this.placeDarkness();

    // girlianda
    const party = now < this.garlandUntil;
    if (party || this.wasParty) {
      for (const b of this.bulbs) {
        const on = !party || Math.floor(now / 140 + b.k) % 2 === 0;
        b.bulb.setAlpha(on ? 1 : 0.25);
        b.glow.setRadius(party && on ? 24 : 16).setAlpha(party && on ? 0.5 : 0.25);
      }
      this.wasParty = party;
    }

    this.updateCrying();
    this.updateHud();
    if (play) {
      if (this.timeLeft <= 0) this.fail();
    }
  }
}
