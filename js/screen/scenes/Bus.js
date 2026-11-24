// 4 etapas: Bėgimas iki autobuso.
//
// Adriana bėga automatiškai: šokinėja (TARPAS / ↑) ir pritūpia (↓).
// Klasiokai:
//  - "kelyje" - stovi ant šaligatvio kaip kliūtis; gali mesti gniūžtę
//    Adrianai į galvą arba pritūpti, kad būtų lengviau peršokti;
//  - fono grupės kieme: lipdytojai, griovėjai, čiuožėjai, laukiantys stotelėje;
//  - keleiviai - moja iš autobuso ir laiko duris (+1 s, daugiausia +5 s).
// Kiekvienas turi po 2 mygtukus (žr. stages.js).

import { cityBackdrop, headText, bodyText, banner, subtitle, floatText, missionCard, C } from '../fx.js';
import { Tribune, avatarKey } from '../tribune.js';
import { STAGES } from '../stages.js';
import { BUS_WINDOWS, BUS_DOOR, BUS_H } from '../art.js';
import { shuffle, isBoy, GIRL_COLORS, BOY_COLORS } from '../../common.js';
import { phoneResult } from '../results.js';

const STAGE = STAGES.autobusas;
const GROUND = 862; // Adrianos pėdų linija
const ADR_X = 380;
const GRAVITY = 2700;
const JUMP_V = 1180;
const RUN_SPEED = 560;
const GOAL_DIST = RUN_SPEED * 34;
const TIME_LIMIT = 40;
const MAX_BONUS = 5;
const DOOR_PRESSES_PER_SEC = 3;
const BUS_Y = GROUND - BUS_H + 6;
const YARD_Y = 792; // kiemo vaikų pėdos
const KID_S = 0.58; // kiemo vaikų mastelis (toliau)
const BALL_Y = GROUND - 190; // Adrianos galvos aukštis
const BALL_SPEED = 700;

const OBSTACLES = {
  puddle: { tex: 'puddle', w: 190, h: 34, weight: 3, line: 'trip_puddle' },
  snowpile: { tex: 'snowpile', w: 160, h: 80, weight: 3, line: 'trip' },
  fence: { tex: 'fence', w: 130, h: 112, weight: 2, line: 'trip' },
  friend: { w: 80, h: 150, weight: 3, line: 'trip_friend' },
};
// Šaligatvio dekoracijos retesnės ir mažesnės, kad neuždengtų kiemo vaikų.
const DECOR = [
  { tex: 'tree', y: GROUND - 16, weight: 1 },
  { tex: 'lamp', y: GROUND - 14, weight: 3 },
];
// Kiemo grupės: vaikų vietos (x) ir jų rekvizitas.
const YARD = {
  lipdytojas: { xs: [585, 655, 815], prop: 735 },
  griovejas: { xs: [925, 1090, 1160], prop: 1010 },
  ciuozejas: { xs: [1260, 1330, 1400], prop: 1330 },
  laukiantis: { xs: [1600, 1670, 1740, 1810], prop: 1705 },
};
const DRIVER_WIN = { x: 704, y: 116, size: 50 }; // autobuso priekinis langas (vairuotoja)
const BUILD_PER_STAGE = 3;
const WRECK_HP = 12;

const rand = (a, b) => a + Math.random() * (b - a);
function weighted(list) {
  const total = list.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const x of list) { r -= x.weight; if (r <= 0) return x; }
  return list[0];
}
function tintOf(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const colors = isBoy(name) ? BOY_COLORS : GIRL_COLORS;
  return colors[h % colors.length];
}

export class BusScene extends Phaser.Scene {
  constructor() { super('Bus'); }

  create() {
    const A = window.AGTA;
    this.A = A;
    this.mode = 'intro'; // intro -> count -> play -> arrive|missed -> result
    A.host.setPhase('intro', STAGE);

    const { skyline } = cityBackdrop(this, { skylineY: GROUND - 40 });
    this.skyline = skyline;
    this.makeYard();
    this.ground = this.add.tileSprite(960, GROUND - 30, 1920, 140, 'sidewalk').setOrigin(0.5, 0).setDepth(-40);
    this.add.rectangle(960, 1080, 1920, 120, 0x1d1233).setOrigin(0.5, 1).setDepth(-39);

    // Phaser naudoja tą patį scenos objektą, todėl visą būseną nustatom iš naujo.
    this.decor = [];
    this.obstacles = [];
    this.movers = [];
    this.balls = [];
    this.kids = new Map(); // pid -> kiemo vaiko vaizdas
    this.ay = GROUND;
    this.vy = 0;
    this.speedMul = 1;
    this.tripT = 0;
    this.invuln = 0;
    this.dist = 0;
    this.timeLeft = TIME_LIMIT;
    this.elapsed = 0;
    this.bonus = 0;
    this.doorPresses = 0;
    this.trips = 0;
    this.spawnIn = 1.6;
    this.jumpBuffer = 0;
    this.animT = 0;
    this.lastSub = 0;
    this.lastTick = 99;
    this.windowSlot = 0;
    this.slowDown = false;
    this.arriveMul = 1;
    this.timerDanger = undefined;
    this.duckKey = false;
    this.ducking = false;
    this.build = { progress: 0, stage: 0, done: 0, resetAt: 0 };
    this.wreck = { hp: WRECK_HP, stage: 6, done: 0, rebuildAt: 0 };
    this.stats = new Map(); // pid -> { name, counts, hits }

    for (let x = 200; x < 2300; x += rand(480, 700)) this.addDecor(x);
    this.makeYardProps();
    for (const role of Object.keys(YARD)) {
      A.host.playersWithRole(role).forEach((p, i) => this.addYardKid(p, role, i));
    }
    this.pathQueue = shuffle(A.host.playersWithRole('kelyje'));
    this.pathShown = 0;
    this.lastFriend = false;

    this.makeAdriana();
    this.makeHud();
    this.tribune = new Tribune(this, A.host, { y: 1006, maxSize: 64 });
    this.card = missionCard(this, {
      nr: STAGE.nr,
      mission: STAGE.mission,
      title: STAGE.title,
      tip: A.lines.pick('autobusas', 'intro'),
      controls: 'Adriana: šuolis - TARPAS arba ↑   ·   pritūpti - ↓',
    });

    const kb = this.input.keyboard;
    kb.on('keydown-ENTER', () => this.onEnter());
    kb.on('keydown-SPACE', () => (this.mode === 'intro' ? this.onEnter() : this.jump()));
    kb.on('keydown-UP', () => this.jump());
    kb.on('keydown-W', () => this.jump());
    kb.on('keydown-DOWN', () => { this.duckKey = true; });
    kb.on('keyup-DOWN', () => { this.duckKey = false; });
    kb.on('keydown-S', () => { this.duckKey = true; });
    kb.on('keyup-S', () => { this.duckKey = false; });
    kb.on('keydown-R', () => this.scene.restart());

    const offs = [
      A.host.on('press', (e) => this.onPress(e)),
      A.host.on('join', (p) => this.onLateJoin(p)),
    ];
    this.events.once('shutdown', () => offs.forEach((f) => f()));
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
    const nums = ['3', '2', '1', 'BĖK!'];
    nums.forEach((n, i) => {
      this.time.delayedCall(i * 700, () => {
        const last = i === nums.length - 1;
        const t = headText(this, 960, 470, n, last ? 200 : 240, last ? C.yellow : C.white).setDepth(900);
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
    subtitle(this, this.A.lines.pick('autobusas', 'start'), { color: C.yellow });
  }

  jump() {
    if (this.mode !== 'play') return;
    if (this.ay >= GROUND - 1) {
      this.vy = -JUMP_V;
      this.A.sfx.jump();
    } else {
      this.jumpBuffer = 0.14;
    }
  }

  // ---------------- Adriana ----------------
  makeAdriana() {
    const box = this.add.container(ADR_X, GROUND).setDepth(300);
    this.adrBody = this.add.image(0, 0, 'adr_run1').setOrigin(0.5, 1);
    const hasFace = this.textures.exists('adr_face');
    this.adrHead = this.add.image(4, -196, hasFace ? 'adr_face' : 'adr_head').setOrigin(0.5, hasFace ? 0.5 : 0.56);
    if (hasFace) this.adrHead.setDisplaySize(124, 124);
    this.shadow = this.add.ellipse(ADR_X, GROUND + 4, 120, 22, 0x000000, 0.35).setDepth(290);
    box.add([this.adrBody, this.adrHead]);
    this.adr = box;
  }

  tripOver(ob) {
    ob.hit = true;
    this.trips += 1;
    this.tripT = 0.6;
    this.invuln = 1.1;
    this.A.sfx.hit();
    this.cameras.main.shake(180, 0.006);
    this.tweens.add({ targets: this.adr, angle: -24, yoyo: true, duration: 220, ease: 'Quad.Out' });
    this.tweens.add({ targets: this.adr, alpha: 0.4, yoyo: true, repeat: 4, duration: 90, onComplete: () => this.adr.setAlpha(1) });
    this.addStar();
    subtitle(this, this.A.lines.pick('autobusas', ob.def.line, { vardas: ob.name || '' }), { color: C.orange });
    this.lastSub = this.time.now;
  }

  addStar() {
    const lit = this.stars.filter((s) => s.texture.key === 'star').length;
    if (lit >= this.stars.length) return;
    const s = this.stars[lit];
    s.setTexture('star');
    this.tweens.add({ targets: s, scale: 1.6, yoyo: true, duration: 180 });
  }

  // ---------------- kiemas (fono grupės) ----------------
  makeYard() {
    const g = this.add.graphics().setDepth(-60);
    const top = (x) => 708 + Math.sin(x / 150) * 10 + Math.sin(x / 47) * 4;
    g.fillStyle(0xdfe8ff, 1);
    g.beginPath();
    g.moveTo(0, 840);
    for (let x = 0; x <= 1920; x += 40) g.lineTo(x, top(x));
    g.lineTo(1920, 840);
    g.closePath();
    g.fillPath();
    g.lineStyle(5, 0x14081f, 0.5);
    g.beginPath();
    g.moveTo(0, top(0));
    for (let x = 40; x <= 1920; x += 40) g.lineTo(x, top(x));
    g.strokePath();
    g.fillStyle(0xbfd0f5, 1);
    g.fillRect(0, 812, 1920, 30);
    g.fillStyle(0xffffff, 0.8);
    for (let i = 0; i < 70; i++) g.fillCircle(rand(0, 1920), rand(730, 805), rand(1.5, 3.5));
  }

  makeYardProps() {
    // lipdomas sniego senis
    this.buildG = this.add.graphics().setDepth(-52);
    this.drawSnowman(this.buildG, YARD.lipdytojas.prop, YARD_Y, 0);
    // griaunamas sniego senis
    this.wreckG = this.add.graphics().setDepth(-52);
    this.drawSnowman(this.wreckG, YARD.griovejas.prop, YARD_Y, 6);
    // ledas
    const ice = this.add.graphics().setDepth(-56);
    ice.fillStyle(0xa8e4ff, 0.95).fillEllipse(YARD.ciuozejas.prop, YARD_Y - 4, 300, 44);
    ice.lineStyle(4, 0x14081f, 0.6).strokeEllipse(YARD.ciuozejas.prop, YARD_Y - 4, 300, 44);
    ice.lineStyle(3, 0xffffff, 0.9);
    ice.lineBetween(YARD.ciuozejas.prop - 90, YARD_Y - 10, YARD.ciuozejas.prop - 40, YARD_Y - 14);
    ice.lineBetween(YARD.ciuozejas.prop + 30, YARD_Y - 2, YARD.ciuozejas.prop + 90, YARD_Y - 6);
    // stotelė: suolas ir ženklas
    const bx = 1570;
    const bench = this.add.graphics().setDepth(-45);
    bench.fillStyle(0x14081f, 1).fillRect(bx + 10, YARD_Y - 34, 10, 34).fillRect(bx + 250, YARD_Y - 34, 10, 34);
    bench.fillStyle(0x8a5a33, 1).fillRoundedRect(bx, YARD_Y - 52, 270, 20, 6);
    bench.lineStyle(4, 0x14081f, 1).strokeRoundedRect(bx, YARD_Y - 52, 270, 20, 6);
    bench.fillStyle(0xffffff, 1).fillRoundedRect(bx + 4, YARD_Y - 58, 262, 8, 4);
    this.add.image(1890, YARD_Y + 6, 'stop').setOrigin(0.5, 1).setScale(0.62).setDepth(-48);
  }

  drawSnowman(g, x, y, stage) {
    g.clear();
    const ball = (cy, r) => {
      g.fillStyle(0xf4f7ff, 1).fillCircle(x, cy, r);
      g.lineStyle(4, 0x14081f, 1).strokeCircle(x, cy, r);
    };
    if (stage <= 0) {
      g.fillStyle(0xf4f7ff, 1).fillEllipse(x, y - 8, 70, 22);
      g.lineStyle(4, 0x14081f, 0.8).strokeEllipse(x, y - 8, 70, 22);
      return;
    }
    const r1 = stage === 1 ? 22 : 32;
    ball(y - r1, r1);
    if (stage >= 3) ball(y - 2 * 32 - 20, 22);
    if (stage >= 4) ball(y - 2 * 32 - 44 - 16, 16);
    const hy = y - 2 * 32 - 44 - 16;
    if (stage >= 5) {
      g.fillStyle(0x14081f, 1).fillCircle(x - 6, hy - 3, 2.6).fillCircle(x + 6, hy - 3, 2.6);
      g.fillStyle(0xff8a2a, 1).fillTriangle(x, hy + 1, x + 18, hy + 4, x, hy + 7);
    }
    if (stage >= 6) {
      g.fillStyle(0xff3ea5, 1).fillRect(x - 22, hy + 13, 44, 8);
      g.fillStyle(0x14081f, 1).fillRect(x - 17, hy - 18, 34, 6).fillRect(x - 11, hy - 36, 22, 20);
    }
  }

  makeKid(player, x, y, s, depth) {
    const box = this.add.container(x, y).setDepth(depth).setScale(s);
    const body = this.add.image(0, 0, 'kid_body').setOrigin(0.5, 1).setTint(tintOf(player.name));
    const key = this.textures.exists(avatarKey(player.name)) ? avatarKey(player.name) : 'dot';
    const head = this.add.image(0, -170, key).setDisplaySize(96, 96);
    const tag = bodyText(this, 0, -238, player.name, 28, C.yellow);
    box.add([body, head, tag]);
    this.tweens.add({ targets: head, y: -175, yoyo: true, repeat: -1, duration: rand(420, 620), ease: 'Sine.InOut' });
    return { box, body, head, tag, name: player.name, pid: player.pid, s };
  }

  addYardKid(player, role, idx) {
    if (this.kids.has(player.pid)) return;
    const cfg = YARD[role];
    const x = cfg.xs[idx] ?? cfg.xs[cfg.xs.length - 1] + 55 * (idx - cfg.xs.length + 1);
    const v = this.makeKid(player, x, YARD_Y, KID_S, -50);
    v.role = role;
    v.baseX = x;
    v.tag.setY(idx % 2 ? -266 : -238); // kaimynų vardai skirtingame aukštyje
    v.dir = idx % 2 ? -1 : 1;
    this.kids.set(player.pid, v);
    v.box.setAlpha(0);
    this.tweens.add({ targets: v.box, alpha: 1, duration: 300 });
  }

  onLateJoin(player) {
    const role = this.A.host.roles[player.pid];
    if (YARD[role]) this.addYardKid(player, role, this.A.host.playersWithRole(role).length - 1);
    else if (role === 'kelyje') this.pathQueue.push(player);
  }

  kidBubble(v, text, color = C.yellow, size = 26) {
    const x = v.box.x;
    const y = v.box.y - 260 * v.s;
    const t = bodyText(this, x, y, text, size, color).setDepth(860).setOrigin(0.5, 1).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, y: y - 22, duration: 220, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, delay: 1200, duration: 300, onComplete: () => t.destroy() });
  }

  // ---------------- pasaulis ----------------
  addDecor(x) {
    const d = weighted(DECOR);
    const img = this.add.image(x, d.y, d.tex).setOrigin(0.5, 1).setDepth(-30);
    if (d.tex === 'tree') img.setScale(rand(0.6, 0.75));
    if (d.tex === 'lamp') img.setScale(0.85);
    this.decor.push(img);
  }

  spawnObstacle() {
    const q = this.pathQueue;
    const unseen = this.pathShown < q.length;
    const wantFriend = q.length && !this.lastFriend && (unseen || Math.random() < 0.3);
    const type = wantFriend
      ? { id: 'friend', ...OBSTACLES.friend }
      : weighted(Object.entries(OBSTACLES).filter(([id]) => id !== 'friend').map(([id, o]) => ({ id, ...o })));
    this.lastFriend = type.id === 'friend';
    const x = 2100;
    if (type.id === 'friend') {
      const p = q[this.pathShown % q.length];
      this.pathShown += 1;
      const v = this.makeKid(p, x, GROUND, 1, 200);
      const ob = { def: type, view: v.box, body: v.body, head: v.head, x, w: type.w, h: type.h, name: p.name, pid: p.pid, crouch: 0, hit: false };
      this.obstacles.push(ob);
      this.A.host.cue(p.pid, 'TU ADRIANOS KELYJE! Mesk gniūžtę arba pritūpk!');
      this.maybeSub(this.A.lines.pick('autobusas', 'in_path', { vardas: p.name }), C.yellow, 2000);
      return;
    }
    const view = this.add.image(x, GROUND + (type.id === 'puddle' ? 14 : 4), type.tex).setOrigin(0.5, 1).setDepth(200);
    this.obstacles.push({ def: type, view, x, w: type.w, h: type.h, name: '', hit: false });
  }

  // ---------------- klasiokų veiksmai ----------------
  stat(player, key) {
    const st = this.stats.get(player.pid) || { pid: player.pid, name: player.name, counts: {}, hits: 0 };
    st.counts[key] = (st.counts[key] || 0) + 1;
    this.stats.set(player.pid, st);
    return st;
  }

  onPress({ player, action, role }) {
    this.stat(player, action);
    this.tribune.bounce(player.pid);
    const live = this.mode === 'play' || this.mode === 'arrive' || this.mode === 'count' || this.mode === 'intro';
    if (!live) return;
    const v = this.kids.get(player.pid);
    const L = this.A.lines;
    switch (role) {
      case 'kelyje': return this.pathAction(player, action);
      case 'lipdytojas':
        if (action === 'lipdyti') return this.buildPress(v);
        return this.wave(v);
      case 'griovejas':
        if (action === 'spirti') return this.kickPress(v);
        if (v) { this.shake(v); this.kidBubble(v, L.pick('autobusas', 'laugh'), C.white); }
        return undefined;
      case 'ciuozejas':
        if (!v) return undefined;
        if (action === 'ciuozti') return this.slide(v);
        return this.fall(v, player);
      case 'laukiantis':
        if (!v) return undefined;
        if (action === 'laikrodis') {
          this.tweens.add({ targets: v.head, angle: { from: -16, to: 16 }, yoyo: true, repeat: 1, duration: 140, onComplete: () => v.head.setAngle(0) });
          return this.kidBubble(v, `⌚ ${L.pick('autobusas', 'watch')}`, C.teal);
        }
        this.shake(v);
        return this.kidBubble(v, L.pick('autobusas', 'shout'), C.yellow, 32);
      case 'keleivis':
        if (action === 'duris') return this.holdDoors(player);
        return this.waveFromBus(player);
      case 'vairuotoja':
        if (action === 'duris') return this.holdDoors(player);
        return this.honk();
      default:
        return undefined;
    }
  }

  wave(v) {
    if (!v) return;
    this.tweens.add({ targets: v.box, angle: { from: -8, to: 8 }, yoyo: true, repeat: 2, duration: 110, onComplete: () => v.box.setAngle(0) });
    this.kidBubble(v, '👋', C.white);
  }

  shake(v) {
    this.tweens.add({ targets: v.box, x: v.baseX + 6, yoyo: true, repeat: 3, duration: 50, onComplete: () => v.box.setX(v.baseX) });
  }

  buildPress(v) {
    if (v) this.tweens.add({ targets: v.box, scaleY: KID_S * 0.85, yoyo: true, duration: 120 });
    const b = this.build;
    if (b.stage >= 6) {
      if (v) this.kidBubble(v, '❤', C.pink);
      return;
    }
    b.progress += 1;
    const stage = Math.min(6, Math.floor(b.progress / BUILD_PER_STAGE));
    if (stage !== b.stage) {
      b.stage = stage;
      this.drawSnowman(this.buildG, YARD.lipdytojas.prop, YARD_Y, stage);
      this.A.sfx.pop();
      if (stage === 6) {
        b.done += 1;
        b.resetAt = this.time.now + 4500;
        this.A.sfx.plus();
        floatText(this, YARD.lipdytojas.prop, YARD_Y - 180, '⛄ PASTATYTA!', { color: C.yellow, size: 30 });
        this.maybeSub(this.A.lines.pick('autobusas', 'built'), C.yellow, 1500);
      }
    }
  }

  kickPress(v) {
    const w = this.wreck;
    if (v) {
      const toward = YARD.griovejas.prop > v.baseX ? 1 : -1;
      this.tweens.add({ targets: v.box, x: v.baseX + toward * 18, angle: -12 * toward, yoyo: true, duration: 130, onComplete: () => v.box.setAngle(0).setX(v.baseX) });
    }
    if (w.hp <= 0) return;
    w.hp -= 1;
    const stage = Math.ceil(w.hp / (WRECK_HP / 6));
    this.tweens.add({ targets: this.wreckG, x: { from: -5, to: 5 }, yoyo: true, repeat: 1, duration: 50, onComplete: () => this.wreckG.setX(0) });
    if (stage !== w.stage) {
      w.stage = stage;
      this.drawSnowman(this.wreckG, YARD.griovejas.prop, YARD_Y, stage);
      this.flyChunk(YARD.griovejas.prop, YARD_Y - 60 - stage * 12);
      this.A.sfx.splat();
    }
    if (w.hp <= 0) {
      w.done += 1;
      w.rebuildAt = this.time.now + 3500;
      floatText(this, YARD.griovejas.prop, YARD_Y - 120, 'SUGRIAUTA!', { color: C.orange, size: 30 });
      this.maybeSub(this.A.lines.pick('autobusas', 'destroyed'), C.orange, 1500);
    }
  }

  flyChunk(x, y) {
    const c = this.add.image(x, y, 'snowball').setDepth(-20).setScale(0.8);
    const dx = rand(-140, 140);
    this.tweens.add({ targets: c, x: x + dx, duration: 600, ease: 'Linear' });
    this.tweens.add({ targets: c, y: y - 80, duration: 280, ease: 'Quad.Out', yoyo: true, onComplete: () => c.destroy() });
  }

  slide(v) {
    v.dir = -v.dir;
    const to = Phaser.Math.Clamp(v.baseX + v.dir * 90, YARD.ciuozejas.prop - 130, YARD.ciuozejas.prop + 130);
    this.tweens.killTweensOf(v.box);
    this.tweens.add({ targets: v.box, x: to, angle: v.dir * 12, duration: 450, ease: 'Sine.InOut', onComplete: () => { v.baseX = to; v.box.setAngle(0); } });
    this.kidBubble(v, 'Vžžž!', C.teal, 22);
  }

  fall(v, player) {
    this.tweens.killTweensOf(v.box);
    this.tweens.add({ targets: v.box, angle: v.dir * 80, duration: 180, ease: 'Quad.In' });
    this.tweens.add({ targets: v.box, angle: 0, delay: 900, duration: 300, ease: 'Back.Out' });
    this.kidBubble(v, '💫', C.white);
    this.maybeSub(this.A.lines.pick('autobusas', 'skate_fall', { vardas: player.name }), C.white, 4000);
  }

  pathAction(player, action) {
    const ob = this.obstacles.find((o) => o.pid === player.pid && !o.hit && o.x > ADR_X + 40 && o.x < 1900);
    if (ob && this.mode === 'play') {
      if (action === 'mesti') {
        if (ob.thrownAt && this.time.now - ob.thrownAt < 900) return;
        ob.thrownAt = this.time.now;
        this.stat(player, 'iAdriana');
        this.tweens.add({ targets: ob.head, angle: { from: 18, to: -10 }, yoyo: true, duration: 120, onComplete: () => ob.head.setAngle(0) });
        const ball = this.add.image(ob.x - 34, BALL_Y, 'snowball').setDepth(320).setScale(1.2);
        this.balls.push({ sprite: ball, pid: player.pid, name: player.name, resolved: false });
        this.A.sfx.throw();
      } else {
        ob.crouch = 1.6;
        this.maybeSub(this.A.lines.pick('autobusas', 'crouch', { vardas: player.name }), C.teal, 2500);
      }
      return;
    }
    // Kol nesi ekrane - gniūžtė skrenda į medį ar žibintą.
    if (action === 'mesti') this.throwSnowball(player);
    else this.tribune.bubble(player.pid, '🙇', C.white);
  }

  ballHit(b) {
    b.sprite.destroy();
    const st = this.stats.get(b.pid);
    if (st) st.hits += 1;
    this.A.sfx.splat();
    this.tripT = Math.max(this.tripT, 0.3);
    const s = this.add.image(this.adr.x + 4, this.adr.y - 196, 'splat').setDepth(310).setScale(0.2);
    this.tweens.add({ targets: s, scale: 0.6, duration: 120, ease: 'Back.Out' });
    this.tweens.add({ targets: s, alpha: 0, delay: 500, duration: 400, onComplete: () => s.destroy() });
    this.tweens.add({ targets: this.adrHead, angle: { from: -14, to: 14 }, yoyo: true, repeat: 1, duration: 80, onComplete: () => this.adrHead.setAngle(0) });
    floatText(this, this.adr.x, this.adr.y - 270, b.name, { color: C.white, size: 24, rise: 60 });
    this.maybeSub(this.A.lines.pick('autobusas', 'ball_hit', { vardas: b.name }), C.teal, 2000);
  }

  maybeSub(text, color = C.white, gap = 2600) {
    if (!text || this.time.now - this.lastSub < gap) return;
    this.lastSub = this.time.now;
    subtitle(this, text, { color });
  }

  // Gniūžtė lanku iš tribūnos į medį ar žibintą (fonas).
  throwSnowball(player) {
    const from = this.tribune.pos(player.pid);
    const visible = this.decor.filter((d) => d.x > ADR_X + 160 && d.x < 1850);
    if (!visible.length) return;
    const target = visible[Math.floor(Math.random() * visible.length)];
    const offX = rand(-30, 30);
    const offY = rand(0.35, 0.8);
    const where = () => ({ x: target.x + offX, y: target.y - target.displayHeight * offY });
    const ball = this.add.image(from.x, from.y, 'snowball').setDepth(820);
    this.A.sfx.throw();
    const start = { x: from.x, y: from.y };
    this.tweens.addCounter({
      from: 0, to: 1, duration: 650, ease: 'Linear',
      onUpdate: (tw) => {
        const t = tw.getValue();
        const end = where();
        const cx = (start.x + end.x) / 2;
        const cy = Math.min(start.y, end.y) - 320;
        const u = 1 - t;
        ball.x = u * u * start.x + 2 * u * t * cx + t * t * end.x;
        ball.y = u * u * start.y + 2 * u * t * cy + t * t * end.y;
        ball.angle += 18;
        ball.setScale(1 + Math.sin(t * Math.PI) * 0.6);
      },
      onComplete: () => {
        ball.destroy();
        const end = where();
        this.A.sfx.splat();
        const s = this.add.image(end.x, end.y, 'splat').setDepth(150).setScale(0.2).setAngle(rand(0, 360));
        this.tweens.add({ targets: s, scale: 0.8, duration: 120, ease: 'Back.Out' });
        this.tweens.add({ targets: s, alpha: 0, delay: 1600, duration: 500, onComplete: () => s.destroy() });
        this.movers.push(s);
        floatText(this, end.x, end.y - 30, player.name, { color: C.white, size: 22, rise: 60 });
      },
    });
  }

  waveFromBus(player) {
    this.tribune.bubble(player.pid, '👋', C.white);
    const slot = this.windowSlot++ % this.hudWindows.length;
    const w = this.hudWindows[slot];
    if (w.img) w.img.destroy();
    const key = this.textures.exists(avatarKey(player.name)) ? avatarKey(player.name) : 'dot';
    w.img = this.add.image(w.x, w.y + 10, key).setDisplaySize(w.size, w.size).setDepth(760);
    const sx = w.img.scaleX;
    const sy = w.img.scaleY;
    w.img.setScale(0);
    this.tweens.add({ targets: w.img, scaleX: sx, scaleY: sy, y: w.y, duration: 240, ease: 'Back.Out' });
    this.tweens.add({ targets: w.img, angle: { from: -10, to: 10 }, yoyo: true, repeat: 3, duration: 160 });
    const img = w.img;
    this.time.delayedCall(2600, () => {
      if (w.img === img) { img.destroy(); w.img = null; }
    });
    if (Math.random() < 0.25) this.maybeSub(this.A.lines.pick('autobusas', 'wave', { vardas: player.name }));
  }

  honk() {
    this.A.sfx.horn();
    this.tweens.add({ targets: this.hudBus, scale: this.hudBus.scale * 1.06, yoyo: true, duration: 120 });
    floatText(this, 1700, 230, 'PYP PYP!', { color: C.yellow, size: 34 });
  }

  driverImage(container, x, y, size) {
    const t = this.A.host.teachers()[0];
    if (!t || !this.textures.exists(avatarKey(t.name))) return null;
    const img = this.add.image(x, y, avatarKey(t.name)).setDisplaySize(size, size);
    if (container) container.add(img);
    return img;
  }

  holdDoors(player) {
    this.tribune.bubble(player.pid, '🚪', C.green);
    if (this.mode !== 'play') return;
    this.doorPresses += 1;
    if (this.doorPresses % DOOR_PRESSES_PER_SEC !== 0) return;
    if (this.bonus >= MAX_BONUS) {
      this.maybeSub(this.A.lines.pick('autobusas', 'doors_max'), C.orange, 5000);
      return;
    }
    this.bonus += 1;
    this.timeLeft += 1;
    this.A.sfx.plus();
    floatText(this, 960, 200, '+1 s', { color: C.green, size: 54 });
    this.bonusText.setText(`Durų laikytojai: +${this.bonus} s`);
    this.maybeSub(this.A.lines.pick('autobusas', 'doors', { vardas: player.name }), C.green, 1500);
  }

  // ---------------- HUD ----------------
  makeHud() {
    const D = 750;
    headText(this, 40, 54, STAGE.mission, 46, C.yellow).setOrigin(0, 0.5).setDepth(D);
    bodyText(this, 40, 110, 'Mamos skambučiai', 22, '#f1e6ff').setOrigin(0, 0.5).setDepth(D);
    this.stars = [0, 1, 2, 3, 4].map((i) => this.add.image(268 + i * 46, 108, 'star_off').setDepth(D).setScale(0.8));

    this.timerText = headText(this, 960, 70, '0:45', 92, C.white).setDepth(D);
    this.bonusText = bodyText(this, 960, 182, '', 24, C.green).setDepth(D);
    const barW = 640;
    this.add.rectangle(960, 140, barW + 10, 26, 0x000000, 0.6).setDepth(D).setStrokeStyle(3, 0x14081f);
    this.barFill = this.add.rectangle(960 - barW / 2, 140, 1, 16, 0xff3ea5).setOrigin(0, 0.5).setDepth(D);
    this.barW = barW;
    this.add.image(960 + barW / 2 + 40, 132, 'bus').setScale(0.09).setDepth(D);
    const face = this.textures.exists('adr_face');
    this.barRunner = this.add.image(960 - barW / 2, face ? 140 : 128, face ? 'adr_face' : 'adr_head').setScale(face ? 0.36 : 0.28).setDepth(D + 1);

    // mažas autobusas su langais keleiviams
    const bx = 1500;
    const by = 40;
    const sc = 0.52;
    this.hudBus = this.add.image(bx, by, 'bus').setOrigin(0, 0).setScale(sc).setDepth(D);
    const drv = this.driverImage(null, bx + DRIVER_WIN.x * sc, by + DRIVER_WIN.y * sc, DRIVER_WIN.size * sc);
    if (drv) drv.setDepth(D + 1);
    this.hudWindows = BUS_WINDOWS.map((w) => ({
      x: bx + (w.x + w.w / 2) * sc,
      y: by + (w.y + w.h / 2) * sc,
      size: Math.min(w.w, w.h) * sc - 4,
      img: null,
    }));
    bodyText(this, bx + 200, by + 190, 'Keleiviai moja!', 20, '#f1e6ff').setDepth(D);
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
    }
    const f = Math.min(1, this.dist / GOAL_DIST);
    this.barFill.setSize(Math.max(1, this.barW * f), 16);
    this.barRunner.x = 960 - this.barW / 2 + this.barW * f;
  }

  // ---------------- pabaiga ----------------
  passengers() {
    const host = this.A.host;
    const first = [...host.playersWithRole('laukiantis'), ...host.playersWithRole('keleivis')];
    const rest = host.list().filter((p) => !first.includes(p) && !host.isTeacher(p.name));
    return [...first, ...rest];
  }

  arrive() {
    this.mode = 'arrive';
    for (const o of this.obstacles) this.tweens.add({ targets: o.view, alpha: 0, duration: 300 });
    for (const b of this.balls) b.sprite.destroy();
    this.balls = [];
    subtitle(this, this.A.lines.pick('autobusas', 'near'), { color: C.yellow });
    const bus = this.makeBus(2000);
    this.slowDown = true;
    const doorX = BUS_DOOR.x + BUS_DOOR.w / 2;
    const stopX = 1150;
    this.tweens.add({
      targets: bus, x: stopX, duration: 1500, ease: 'Cubic.Out',
      onComplete: () => {
        this.A.sfx.horn();
        this.tweens.add({ targets: this.busDoor, scaleX: 0.05, duration: 300 });
        this.boardWaiting(stopX + doorX);
        this.tweens.add({
          targets: [this.adr, this.shadow], x: stopX + doorX, duration: 1400, ease: 'Sine.InOut',
          onComplete: () => {
            this.tweens.add({ targets: this.adr, alpha: 0, scale: 0.85, duration: 250 });
            this.shadow.setVisible(false);
            this.time.delayedCall(450, () => {
              this.tweens.add({ targets: this.busDoor, scaleX: 1, duration: 250 });
              this.win(bus);
            });
          },
        });
      },
    });
  }

  // Laukiantys stotelėje lipa į autobusą kartu su Adriana.
  boardWaiting(doorX) {
    const waiting = [...this.kids.values()].filter((v) => v.role === 'laukiantis');
    if (!waiting.length) return;
    this.maybeSub(this.A.lines.pick('autobusas', 'board'), C.teal, 0);
    waiting.forEach((v, i) => {
      v.box.setDepth(260);
      this.tweens.add({
        targets: v.box, x: doorX, y: GROUND - 10, scale: KID_S * 1.1, delay: i * 180, duration: 700, ease: 'Sine.InOut',
        onComplete: () => this.tweens.add({ targets: v.box, alpha: 0, duration: 200 }),
      });
    });
  }

  makeBus(x) {
    const bus = this.add.container(x, BUS_Y).setDepth(250);
    bus.add(this.add.image(0, 0, 'bus').setOrigin(0, 0));
    const list = this.passengers();
    BUS_WINDOWS.forEach((w, i) => {
      const p = list[i];
      if (!p || !this.textures.exists(avatarKey(p.name))) return;
      bus.add(this.add.image(w.x + w.w / 2, w.y + w.h / 2 + 4, avatarKey(p.name)).setDisplaySize(w.w - 10, w.w - 10));
    });
    this.driverImage(bus, DRIVER_WIN.x, DRIVER_WIN.y, DRIVER_WIN.size);
    this.busDoor = this.add.image(BUS_DOOR.x, BUS_DOOR.y, 'bus_door').setOrigin(0, 0);
    bus.add(this.busDoor);
    return bus;
  }

  win(bus) {
    this.A.sfx.win();
    banner(this, 'MISIJA ĮVYKDYTA!', '+100 RESPEKTO', { color: C.yellow, hold: 2800 });
    this.time.delayedCall(1200, () => subtitle(this, this.A.lines.pick('autobusas', 'success'), { color: C.yellow }));
    this.time.delayedCall(1400, () => {
      this.tweens.add({ targets: bus, x: 2200, duration: 2200, ease: 'Cubic.In' });
    });
    this.time.delayedCall(3600, () => this.showResult(true));
  }

  missed() {
    this.mode = 'missed';
    for (const o of this.obstacles) this.tweens.add({ targets: o.view, alpha: 0, duration: 300 });
    for (const b of this.balls) b.sprite.destroy();
    this.balls = [];
    const bus = this.makeBus(1250);
    bus.setAlpha(0);
    this.tweens.add({ targets: bus, alpha: 1, duration: 300 });
    this.A.sfx.horn();
    this.boardWaiting(1250 + BUS_DOOR.x + BUS_DOOR.w / 2);
    this.tweens.add({ targets: bus, x: 2200, delay: 1400, duration: 1800, ease: 'Cubic.In' });
    this.tweens.add({ targets: this.adr, angle: 10, yoyo: true, repeat: 2, duration: 200 });
    this.time.delayedCall(600, () => {
      this.A.sfx.fail();
      banner(this, 'AUTOBUSAS IŠVAŽIAVO', 'BET STILINGAI', { color: C.red, hold: 2600 });
      subtitle(this, this.A.lines.pick('autobusas', 'fail'), { color: C.orange });
    });
    this.time.delayedCall(3800, () => this.showResult(false));
  }

  showResult(ok) {
    this.mode = 'result';
    this.A.host.setPhase('result', STAGE);
    const box = this.add.container(960, 500).setDepth(950).setAlpha(0);
    box.add(this.add.rectangle(0, 0, 1240, 600, 0x0b0418, 0.9).setStrokeStyle(6, ok ? 0xffd23f : 0xff4d5e));
    box.add(headText(this, 0, -235, ok ? 'SPĖJO!' : 'BEVEIK SPĖJO!', 80, ok ? C.yellow : C.orange));

    const all = [...this.stats.values()];
    const sum = (k) => all.reduce((s, x) => s + (x.counts[k] || 0), 0);
    const hits = all.reduce((s, x) => s + x.hits, 0);
    const best = (fn) => all.map((x) => [x, fn(x)]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
    const rows = [
      [`Laikas: ${this.elapsed.toFixed(1).replace('.', ',')} s   ·   Kliūtys: ${this.trips}   ·   Gniūžtės į Adrianą: ${sum('iAdriana')} (pataikė ${hits})`, C.white],
      [`Sniego seniai: pastatyta ${this.build.done}   ·   sugriauta ${this.wreck.done}   ·   Durų laikytojai: +${this.bonus} s`, C.white],
    ];
    const sniper = best((x) => x.hits);
    if (sniper) rows.push([`Taikliausias metikas: ${sniper[0].name} (${sniper[1]})`, C.teal]);
    const skater = best((x) => (x.counts.ciuozti || 0) + (x.counts.griuti || 0));
    if (skater) rows.push([`Ledo žvaigždė: ${skater[0].name}`, C.teal]);
    const loud = best((x) => x.counts.skubek || 0);
    if (loud) rows.push([`Garsiausiai šaukė: ${loud[0].name}`, C.teal]);
    phoneResult(this, {
      head: ok ? 'SPĖJO!' : 'BEVEIK SPĖJO!', ok,
      rows: (p, st) => [
        st?.counts.iAdriana && ['❄️ Gniūžtės į Adrianą', st.counts.iAdriana],
        st?.counts.iAdriana && ['🎯 Pataikei', st.hits],
      ],
      awards: [
        sniper && [sniper[0].pid, '🎯', 'Taikliausias metikas!'],
        skater && [skater[0].pid, '⛸️', 'Ledo žvaigždė!'],
        loud && [loud[0].pid, '📣', 'Garsiausiai šaukei!'],
      ],
    });
    rows.slice(0, 5).forEach(([r, c], i) => box.add(bodyText(this, 0, -130 + i * 56, r, 30, c)));
    const next = headText(this, 0, 240, 'ENTER - TOLIAU', 48, C.white);
    this.tweens.add({ targets: next, alpha: 0.3, yoyo: true, repeat: -1, duration: 650 });
    box.add(next);
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
  }

  // ---------------- ciklas ----------------
  update(_, deltaMs) {
    const dt = Math.min(deltaMs, 66) / 1000;
    const rdt = Math.min(deltaMs, 250) / 1000; // laikrodžiui - tikras laikas (ir lėtame kompiuteryje 40 s = 40 s)
    const now = this.time.now;

    // kiemo sniego seniai: atsistato
    if (this.build.stage >= 6 && this.build.resetAt && now > this.build.resetAt) {
      this.build.progress = 0;
      this.build.stage = 0;
      this.build.resetAt = 0;
      this.drawSnowman(this.buildG, YARD.lipdytojas.prop, YARD_Y, 0);
    }
    if (this.wreck.hp <= 0 && this.wreck.rebuildAt && now > this.wreck.rebuildAt) {
      this.wreck.hp = WRECK_HP;
      this.wreck.stage = 6;
      this.wreck.rebuildAt = 0;
      this.drawSnowman(this.wreckG, YARD.griovejas.prop, YARD_Y, 6);
      this.maybeSub(this.A.lines.pick('autobusas', 'rebuilt'), C.white, 3000);
    }

    // greitis
    if (this.tripT > 0) { this.tripT -= dt; this.speedMul = 0.35; }
    else this.speedMul = Math.min(1, this.speedMul + dt * 1.6);
    if (this.invuln > 0) this.invuln -= dt;
    let speed = RUN_SPEED * this.speedMul;
    if (this.mode === 'intro' || this.mode === 'count') speed = 120;
    if (this.slowDown) {
      this.arriveMul = Math.max(0, this.arriveMul - dt * 1.2);
      speed *= this.arriveMul;
    }
    if (this.mode === 'missed' || this.mode === 'result') speed = 0;

    this.skyline.tilePositionX += speed * dt * 0.08;
    this.ground.tilePositionX += speed * dt;
    for (const d of this.decor) d.x -= speed * dt;
    const gone = this.decor.filter((d) => d.x < -260);
    if (gone.length) {
      const maxX = Math.max(...this.decor.map((d) => d.x));
      for (const d of gone) {
        this.decor.splice(this.decor.indexOf(d), 1);
        d.destroy();
        this.addDecor(Math.max(2150, maxX + rand(480, 700)));
      }
    }
    for (const m of this.movers) if (m.active) m.x -= speed * dt;
    this.movers = this.movers.filter((m) => m.active);

    // laikas ir atstumas
    if (this.mode === 'play') {
      this.timeLeft -= rdt;
      this.elapsed += rdt;
      this.dist += speed * dt;
      this.spawnIn -= dt * this.speedMul;
      if (this.spawnIn <= 0 && this.dist < GOAL_DIST - RUN_SPEED * 3) {
        this.spawnObstacle();
        this.spawnIn = rand(1.2, 1.9);
      }
    }

    // kliūtys
    for (const o of this.obstacles) {
      if (this.mode === 'play' || this.mode === 'arrive') o.x -= speed * dt;
      o.view.x = o.x;
      if (o.body) {
        if (o.crouch > 0) o.crouch -= dt;
        const down = o.crouch > 0;
        o.h = down ? 70 : OBSTACLES.friend.h;
        o.body.scaleY += ((down ? 0.55 : 1) - o.body.scaleY) * Math.min(1, dt * 14);
        o.head.y += ((down ? -100 : -170) - o.head.y) * Math.min(1, dt * 14);
      }
      if (this.mode === 'play' && !o.hit && this.invuln <= 0) {
        const overlapX = Math.abs(o.x - ADR_X) < o.w * 0.38 + 30;
        if (overlapX && this.ay > GROUND - o.h) this.tripOver(o);
      }
    }
    const old = this.obstacles.filter((o) => o.x < -250);
    for (const o of old) o.view.destroy();
    this.obstacles = this.obstacles.filter((o) => o.x >= -250);

    // gniūžtės iš kelyje stovinčių vaikų
    for (const b of this.balls) {
      if (!b.sprite.active) continue;
      b.sprite.x -= (speed + BALL_SPEED) * dt;
      b.sprite.angle -= 14;
      if (!b.resolved && b.sprite.x <= ADR_X + 34) {
        b.resolved = true;
        const dodged = this.ducking || this.ay < GROUND - 150 || this.mode !== 'play';
        if (dodged) {
          floatText(this, ADR_X + 40, BALL_Y - 30, 'Pro šalį!', { color: C.green, size: 26 });
          if (Math.random() < 0.4) this.maybeSub(this.A.lines.pick('autobusas', 'ball_miss'), C.green, 2500);
        } else {
          this.ballHit(b);
        }
      }
      if (b.sprite.active && b.sprite.x < -60) b.sprite.destroy();
    }
    this.balls = this.balls.filter((b) => b.sprite.active);

    // Adrianos šuolis ir pritūpimas
    if (this.mode === 'play' || this.mode === 'arrive') {
      this.vy += GRAVITY * dt;
      this.ay = Math.min(GROUND, this.ay + this.vy * dt);
      if (this.ay >= GROUND) {
        this.vy = 0;
        if (this.jumpBuffer > 0 && this.mode === 'play') { this.vy = -JUMP_V; this.A.sfx.jump(); }
      }
      this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
      this.adr.y = this.ay;
    }
    const inAir = this.ay < GROUND - 2;
    this.ducking = this.duckKey && !inAir && this.mode === 'play';
    this.animT += dt * (speed > 40 || this.mode === 'arrive' ? 1 : 0);
    if (this.mode !== 'result' && this.mode !== 'missed') {
      let tex = Math.floor(this.animT / 0.13) % 2 ? 'adr_run1' : 'adr_run2';
      if (inAir) tex = 'adr_jump';
      if (this.ducking) tex = 'adr_duck';
      this.adrBody.setTexture(tex);
      this.adrHead.y = this.ducking ? -162 : -196 + (inAir ? -4 : Math.sin(this.animT * 24) * 4);
    }
    const h = (GROUND - this.ay) / 260;
    this.shadow.setScale(1 - h * 0.5).setAlpha(0.35 - h * 0.2);

    this.updateHud();
    if (this.mode === 'play') {
      if (this.dist >= GOAL_DIST) this.arrive();
      else if (this.timeLeft <= 0) this.missed();
    }
  }
}
