// 2 etapas: Laiptai su kuprine.
//
// Adriana lipa mokyklos laiptais į 3 aukštą: ← → paeiliui (kairė, dešinė...).
// Du kartus ta pati rodyklė - suklumpa. Kuo sunkesnė kuprinė, tuo lėčiau.
// Laiko 30 s, pabaigoje skambutis.
// Klasiokai matosi ant laiptų:
//  - krovikai: įmeta knygą (kuprinė sunkėja) arba mandariną (juokui);
//  - stūmikai: pastumia iš apačios (Adriana pajuda į priekį), šaukia „Pirmyn!“;
//  - bėgikai per pertrauką: nubėga žemyn pro šalį, paslysta (fonas);
//  - prie lango: piešia ant aprasojusio lango, moja (fonas);
//  - mokytoja (budėtoja prie 3 aukšto durų): laiko duris (+1 s), švilpukas (stūmikai stumia 2x).

import { headText, bodyText, banner, subtitle, floatText, missionCard, C } from '../fx.js';
import { Tribune, avatarKey } from '../tribune.js';
import { STAGES } from '../stages.js';
import { isBoy, GIRL_COLORS, BOY_COLORS } from '../../common.js';

const STAGE = STAGES.laiptai;
const RUN = 84; // laiptelio plotis
const RISE = 46; // laiptelio aukštis
// Kelias: lygios vietos (flat) ir laiptai (up), matuojama "žingsniais".
const PATH = [
  { flat: 2 }, { up: 12 }, { flat: 3 }, { up: 12 }, { flat: 3, floor: 2 },
  { up: 12 }, { flat: 3 }, { up: 12 }, { flat: 5, floor: 3 },
];
const FLOOR2_U = 29; // 2 aukšto aikštelės pradžia
const GOAL_U = 61.6; // prie 3 aukšto durų
const DOOR_U = 62.4;
const START_U = 0.3;
const ANCHOR = { x: 620, y: 800 }; // Adrianos pėdos ekrane
const ADR_S = 0.9;
const KID_S = 0.78;
const TIME_LIMIT = 30;
const MAX_BONUS = 5;
const BOOK_W = 0.15; // kiek viena knyga sulėtina (14 knygų - 3 kartus lėčiau)
const MAX_BOOKS = 14;
const BOOK_GAP = 1200; // ms tarp knygų (visiems kartu)
const PUSH = 0.5; // kiek žingsnių pastumia stūmikas
const PUSH_GAP = 1000;
const WHISTLE_MS = 4000;
const STUMBLE_T = 0.4;
const WINDOWS = [4, 9.5, 15.5, 21, 26.5, 34, 39.5, 45.5, 51, 56.5];
const BOOK_COLORS = [0xff3ea5, 0x2de2e6, 0xffd23f, 0x3ddc84, 0xa98bff, 0xff9a3c];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
function tintOf(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const colors = isBoy(name) ? BOY_COLORS : GIRL_COLORS;
  return colors[h % colors.length];
}

const xAt = (u) => u * RUN;
// Pėdų aukštis kelyje u (laiptai - nuolydis, prieš laiptus - pusės žingsnio įsibėgėjimas).
function yAt(u) {
  let y = 0;
  let u0 = 0;
  for (let i = 0; i < PATH.length; i++) {
    const seg = PATH[i];
    const len = seg.up || seg.flat;
    const t = u - u0;
    if (t <= len || i === PATH.length - 1) {
      if (seg.up) return y - RISE * Phaser.Math.Clamp(t + 0.5, 0, len);
      const next = PATH[i + 1];
      if (next && next.up && t > len - 0.5) return y - RISE * (t - (len - 0.5));
      return y;
    }
    if (seg.up) y -= RISE * len;
    u0 += len;
  }
  return y;
}

export class LaiptaiScene extends Phaser.Scene {
  constructor() { super('Laiptai'); }

  create() {
    const A = window.AGTA;
    this.A = A;
    this.mode = 'intro'; // intro -> count -> play -> end -> result
    A.host.setPhase('intro', STAGE);

    // Phaser naudoja tą patį scenos objektą, todėl visą būseną nustatom iš naujo.
    this.u = START_U; // tikslas
    this.ud = START_U; // rodoma (sklandžiai)
    this.lastFoot = null;
    this.stumbleT = 0;
    this.stumbles = 0;
    this.steps = 0;
    this.books = 0;
    this.mandarins = 0;
    this.pile = []; // knygos, kyšančios iš kuprinės
    this.tilt = { a: 0 }; // suklupimo pasvirimas
    this.sweatT = 0;
    this.pushes = 0;
    this.lastBook = 0;
    this.lastPush = 0;
    this.whistleUntil = 0;
    this.bonus = 0;
    this.timeLeft = TIME_LIMIT;
    this.elapsed = 0;
    this.lastTick = 99;
    this.timerDanger = undefined;
    this.saidTen = false;
    this.saidFloor = false;
    this.saidNear = false;
    this.lastSub = 0;
    this.walkT = 0;
    this.autoT = 0;
    this.stats = new Map();
    this.windowKids = new Map(); // pid -> { v, w }
    this.windowTaken = new Set();
    this.autoplay = !!this.autoplay;

    this.wall = this.add.tileSprite(960, 540, 1920, 1080, 'school_wall_tile').setDepth(-60);
    this.L = {};
    for (const [k, d] of [['bg', -50], ['stairs', -40], ['back', -20], ['adr', 0], ['fx', 20]]) {
      this.L[k] = this.add.container(0, 0).setDepth(d);
    }
    this.makeWorld();
    this.makeAdriana();
    this.makeHud();
    this.placeWindowKids();
    this.cam = { x: xAt(this.ud) - ANCHOR.x, y: yAt(this.ud) - ANCHOR.y };
    this.applyCam();

    this.tribune = new Tribune(this, A.host, { y: 1006, maxSize: 64 });
    this.card = missionCard(this, {
      nr: STAGE.nr,
      mission: STAGE.mission,
      title: STAGE.title,
      tip: A.lines.pick('laiptai', 'intro'),
      controls: 'Adriana: lipti - ← → paeiliui (kairė, dešinė, kairė...)',
    });

    const kb = this.input.keyboard;
    kb.on('keydown-ENTER', () => this.onEnter());
    kb.on('keydown-SPACE', () => { if (this.mode === 'intro') this.onEnter(); });
    for (const k of ['LEFT', 'A']) kb.on(`keydown-${k}`, (e) => { if (!e.repeat) this.foot('L'); });
    for (const k of ['RIGHT', 'D']) kb.on(`keydown-${k}`, (e) => { if (!e.repeat) this.foot('R'); });
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
    const nums = ['3', '2', '1', 'LIPK!'];
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
    subtitle(this, this.A.lines.pick('laiptai', 'start'), { color: C.yellow });
  }

  factor() {
    return 1 + BOOK_W * this.books;
  }

  foot(k) {
    if (this.mode !== 'play' || this.stumbleT > 0) return;
    if (k === this.lastFoot) { this.stumble(); return; }
    this.lastFoot = k;
    this.steps += 1;
    this.u = Math.min(GOAL_U + 0.3, this.u + 1 / this.factor());
    this.A.sfx.step();
    this.adrBody.setTexture(k === 'L' ? 'adr_run1' : 'adr_run2');
    this.updateKeys();
  }

  stumble() {
    this.stumbles += 1;
    this.stumbleT = STUMBLE_T;
    this.lastFoot = null;
    this.A.sfx.hit();
    this.tweens.add({ targets: this.tilt, a: 16, yoyo: true, duration: 140 });
    this.worldText(this.adr.x + 60, this.adr.y - 300, 'Oi!', C.orange, 40);
    this.maybeSub(this.A.lines.pick('laiptai', 'stumble'), C.orange, 2500);
    this.updateKeys();
  }

  // ---------------- pasaulis ----------------
  makeWorld() {
    const bg = this.L.bg;
    const lastU = PATH.reduce((s, p) => s + (p.up || p.flat), 0);
    const from = -20;
    const to = lastU + 26;
    // apatinė sienos dalis (dažyta juosta pagal laiptus) su neono linija
    const band = this.add.graphics();
    const top = [];
    for (let u = from; u <= to; u += 0.5) top.push([xAt(u), yAt(Math.max(0, Math.min(lastU, u))) - 250]);
    band.fillStyle(0x251848, 1);
    band.beginPath();
    band.moveTo(top[0][0], top[0][1]);
    for (const [x, y] of top) band.lineTo(x, y);
    band.lineTo(top[top.length - 1][0], 800);
    band.lineTo(top[0][0], 800);
    band.closePath();
    band.fillPath();
    band.lineStyle(8, 0xff3ea5, 1);
    band.beginPath();
    band.moveTo(top[0][0], top[0][1]);
    for (const [x, y] of top) band.lineTo(x, y);
    band.strokePath();
    bg.add(band);

    // langai, užrašai, skelbimų lenta, durys
    this.windows = WINDOWS.map((wu) => {
      const x = xAt(wu);
      const y = yAt(wu) - 360;
      const img = this.add.image(x, y, 'school_window');
      bg.add(img);
      return { u: wu, x, y, img };
    });
    const sign = (u, text, dy = -420) => {
      const x = xAt(u);
      const y = yAt(u) + dy;
      const box = this.add.rectangle(x, y, text.length * 26 + 50, 76, 0x14081f, 0.9).setStrokeStyle(5, 0xffd23f);
      const t = headText(this, x, y - 2, text, 50, C.yellow, { strokeThickness: 0 });
      t.setShadow(0, 0, 'rgba(0,0,0,0)');
      bg.add([box, t]);
    };
    sign(-1, '1 AUKŠTAS', -300);
    sign(30.5, '2 AUKŠTAS', -300);
    sign(DOOR_U, '3 AUKŠTAS', -430);
    const board = this.add.image(xAt(-6), yAt(0) - 330, 'school_board');
    bg.add(board);
    const warn = this.add.rectangle(xAt(12.5), yAt(12.5) - 290, 236, 50, 0xff4d5e).setStrokeStyle(5, 0x14081f);
    const warnT = bodyText(this, xAt(12.5), yAt(12.5) - 290, 'NEBĖGIOK LAIPTAIS!', 19, C.white);
    bg.add([warn, warnT]);
    this.door = this.add.image(xAt(DOOR_U), yAt(DOOR_U) + 4, 'school_door').setOrigin(0.5, 1);
    bg.add(this.door);

    // turėklas ant sienos
    const rail = this.add.graphics();
    const pts = [];
    for (let u = -2; u <= lastU; u += 0.5) pts.push([xAt(u), yAt(u) - 120]);
    rail.lineStyle(14, 0x14081f, 1);
    rail.beginPath(); rail.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts) rail.lineTo(x, y); rail.strokePath();
    rail.lineStyle(7, 0xffd23f, 1);
    rail.beginPath(); rail.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts) rail.lineTo(x, y); rail.strokePath();
    for (let u = -1; u < lastU; u += 2.5) {
      rail.fillStyle(0x14081f, 1).fillRect(xAt(u) - 4, yAt(u) - 120, 8, 26);
    }
    bg.add(rail);

    // laiptai
    const g = this.add.graphics();
    const prof = [];
    let u0 = 0;
    let y = 0;
    prof.push([xAt(from), 0]);
    for (const seg of PATH) {
      const len = seg.up || seg.flat;
      if (seg.flat) {
        prof.push([xAt(u0 + len), y]);
      } else {
        for (let k = 0; k < len; k++) {
          prof.push([xAt(u0 + k), y - (k + 1) * RISE]);
          prof.push([xAt(u0 + k + 1), y - (k + 1) * RISE]);
        }
        y -= len * RISE;
      }
      u0 += len;
    }
    prof.push([xAt(to), y]);
    // užpildas po laiptais
    g.fillStyle(0x1d1238, 1);
    g.beginPath();
    g.moveTo(prof[0][0], prof[0][1]);
    for (const [px, py] of prof) g.lineTo(px, py);
    g.lineTo(xAt(to), 900);
    g.lineTo(xAt(from), 900);
    g.closePath();
    g.fillPath();
    // pakopos: priekinė dalis ir paviršius
    u0 = 0;
    y = 0;
    for (const seg of PATH) {
      const len = seg.up || seg.flat;
      if (seg.up) {
        for (let k = 0; k < len; k++) {
          const x0 = xAt(u0 + k);
          const ty = y - (k + 1) * RISE;
          g.fillStyle(0x8f84bd, 1).fillRect(x0, ty, RUN, RISE);
          g.fillStyle(0xe9e4ff, 1).fillRect(x0 - 4, ty - 6, RUN + 8, 14);
          g.fillStyle(0xffd23f, 1).fillRect(x0 - 4, ty - 6, 12, 14);
          g.lineStyle(4, 0x14081f, 1).strokeRect(x0 - 4, ty - 6, RUN + 8, 14);
        }
        y -= len * RISE;
      } else {
        g.fillStyle(0xe9e4ff, 1).fillRect(xAt(u0) - 4, y - 6, len * RUN + 8, 14);
        g.lineStyle(4, 0x14081f, 1).strokeRect(xAt(u0) - 4, y - 6, len * RUN + 8, 14);
      }
      u0 += len;
    }
    g.fillStyle(0xe9e4ff, 1).fillRect(xAt(from), -6, xAt(0) - xAt(from), 14);
    g.lineStyle(4, 0x14081f, 1).strokeRect(xAt(from), -6, xAt(0) - xAt(from), 14);
    this.L.stairs.add(g);
  }

  applyCam() {
    const x = Math.round(-this.cam.x);
    const y = Math.round(-this.cam.y);
    for (const l of Object.values(this.L)) l.setPosition(x, y);
    this.wall.setTilePosition(this.cam.x * 0.6, this.cam.y * 0.6);
  }

  // ---------------- Adriana ----------------
  makeAdriana() {
    const box = this.add.container(xAt(this.ud), yAt(this.ud));
    const inner = this.add.container(0, 0).setScale(ADR_S);
    this.backpack = this.add.image(-40, -128, 'backpack_big').setOrigin(0.62, 0.5).setScale(0.85);
    this.adrBody = this.add.image(0, 0, 'adr_run1').setOrigin(0.5, 1);
    const hasFace = this.textures.exists('adr_face');
    this.adrHead = this.add.image(4, -196, hasFace ? 'adr_face' : 'adr_head').setOrigin(0.5, hasFace ? 0.5 : 0.56);
    if (hasFace) this.adrHead.setDisplaySize(124, 124);
    inner.add([this.backpack, this.adrBody, this.adrHead]);
    box.add(inner);
    this.shadow = this.add.ellipse(box.x, box.y + 2, 110, 18, 0x000000, 0.35);
    this.L.adr.add([this.shadow, box]);
    this.adr = box;
    this.adrInner = inner;
  }

  backpackWorld() {
    return { x: this.adr.x - 40 * ADR_S, y: this.adr.y - 128 * ADR_S };
  }

  // ---------------- klasiokai ----------------
  makeKid(player, u, layer = this.L.back) {
    const box = this.add.container(xAt(u), yAt(u)).setScale(KID_S);
    const body = this.add.image(0, 0, 'kid_body').setOrigin(0.5, 1).setTint(tintOf(player.name));
    const key = this.textures.exists(avatarKey(player.name)) ? avatarKey(player.name) : 'dot';
    const head = this.add.image(0, -170, key).setDisplaySize(96, 96);
    const tag = bodyText(this, 0, -240, player.name, 28, C.yellow);
    box.add([body, head, tag]);
    layer.add(box);
    return { box, body, head, tag, name: player.name, pid: player.pid, u };
  }

  setKidU(v, u) {
    v.u = u;
    v.box.setPosition(xAt(u), yAt(u));
  }

  fadeKid(v, delay) {
    this.tweens.add({ targets: v.box, alpha: 0, delay, duration: 300, onComplete: () => v.box.destroy() });
  }

  placeWindowKids() {
    this.A.host.playersWithRole('langas').forEach((p, i) => this.addWindowKid(p, i));
  }

  addWindowKid(player, i) {
    if (this.windowKids.has(player.pid)) return;
    const w = this.windows[i] || this.freeWindowAhead(this.ud + 3);
    if (!w) return;
    this.windowTaken.add(w);
    const v = this.makeKid(player, w.u + 0.6);
    this.windowKids.set(player.pid, { v, w });
  }

  freeWindowAhead(minU) {
    return this.windows.find((w) => w.u > minU && !this.windowTaken.has(w)) || null;
  }

  // Kai langas lieka toli už Adrianos, vaikas "persikelia" prie kito lango priekyje.
  moveWindowKids() {
    for (const k of this.windowKids.values()) {
      if (k.w.u > this.ud - 9) continue;
      const nw = this.freeWindowAhead(this.ud + 8);
      if (!nw) continue;
      this.windowTaken.delete(k.w);
      this.windowTaken.add(nw);
      k.w = nw;
      this.setKidU(k.v, nw.u + 0.6);
    }
  }

  onLateJoin(player) {
    if (this.A.host.roles[player.pid] === 'langas') this.addWindowKid(player, 99);
  }

  stat(player, key) {
    const st = this.stats.get(player.pid) || { name: player.name, counts: {} };
    st.counts[key] = (st.counts[key] || 0) + 1;
    this.stats.set(player.pid, st);
  }

  worldText(x, y, text, color = C.white, size = 30) {
    const t = bodyText(this, x, y, text, size, color);
    this.L.fx.add(t);
    this.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 1300, ease: 'Cubic.Out', onComplete: () => t.destroy() });
    return t;
  }

  maybeSub(text, color = C.white, gap = 2600) {
    if (!text || this.time.now - this.lastSub < gap) return;
    this.lastSub = this.time.now;
    subtitle(this, text, { color });
  }

  onPress({ player, action }) {
    this.stat(player, action);
    this.tribune.bounce(player.pid);
    if (this.mode !== 'play' && this.mode !== 'end') return;
    switch (action) {
      case 'knyga': return this.throwItem(player, true);
      case 'mandarinas': return this.throwItem(player, false);
      case 'stumti': return this.push(player);
      case 'pirmyn': return this.cheer(player);
      case 'begti': return this.runDown(player, false);
      case 'paslysti': return this.runDown(player, true);
      case 'piesti': return this.draw(player);
      case 'mojuoti': return this.wave(player);
      case 'duris': return this.holdDoors(player);
      case 'svilpukas': return this.whistle(player);
      default: return undefined;
    }
  }

  throwItem(player, book) {
    const now = this.time.now;
    if (book && now - this.lastBook < BOOK_GAP) {
      this.tribune.bubble(player.pid, '📕', C.white);
      return;
    }
    if (book) this.lastBook = now;
    const v = this.makeKid(player, this.ud + rand(3.6, 4.8));
    this.tweens.add({ targets: v.box, angle: -12, yoyo: true, duration: 140 });
    this.fadeKid(v, 1800);
    const sx = v.box.x - 20;
    const sy = v.box.y - 150 * KID_S;
    const item = this.add.image(sx, sy, book ? 'book' : 'mandarin').setScale(book ? 0.9 : 0.8);
    if (book) item.setTint(pick(BOOK_COLORS));
    this.L.fx.add(item);
    this.A.sfx.throw();
    this.tweens.addCounter({
      from: 0, to: 1, duration: 520,
      onUpdate: (tw) => {
        const t = tw.getValue();
        const end = this.backpackWorld();
        const cx = (sx + end.x) / 2;
        const cy = Math.min(sy, end.y) - 160;
        const a = 1 - t;
        item.x = a * a * sx + 2 * a * t * cx + t * t * end.x;
        item.y = a * a * sy + 2 * a * t * cy + t * t * end.y;
        item.angle -= 12;
      },
      onComplete: () => this.itemLanded(player, item, book),
    });
  }

  itemLanded(player, item, book) {
    if (this.mode === 'result') { item.destroy(); return; }
    if (book && this.books >= MAX_BOOKS) {
      // kuprinė pilna - knyga atšoka
      this.tweens.add({ targets: item, x: item.x - 120, y: item.y + 260, angle: -300, alpha: 0, duration: 700, ease: 'Quad.In', onComplete: () => item.destroy() });
      this.maybeSub(this.A.lines.pick('laiptai', 'full'), C.white, 3000);
      return;
    }
    item.destroy();
    this.A.sfx.thud();
    const bw = this.backpackWorld();
    if (book) {
      this.books += 1;
      this.stat(player, 'knygos');
      this.worldText(bw.x, bw.y - 70, player.name, C.white, 24);
      this.maybeSub(this.A.lines.pick('laiptai', 'book', { vardas: player.name }), C.orange, 3000);
    } else {
      this.mandarins += 1;
      this.worldText(bw.x, bw.y - 70, `${player.name}: mandarinas!`, C.orange, 22);
      if (Math.random() < 0.3) this.maybeSub(this.A.lines.pick('laiptai', 'mandarin'), C.orange, 4000);
    }
    this.growBackpack(book);
    this.updateWeight();
  }

  bagScale() {
    return 0.85 + 0.08 * this.books; // 14 knygų - beveik 2 kartus didesnė
  }

  // Kuprinė didėja, o iš viršaus kyšo vis daugiau knygų.
  growBackpack(book) {
    const sc = this.bagScale();
    this.tweens.killTweensOf(this.backpack);
    this.tweens.add({ targets: this.backpack, scale: sc * 1.18, duration: 110, yoyo: true, onComplete: () => this.backpack.setScale(sc) });
    if (book) {
      const b = this.add.image(0, 0, 'book').setTint(pick(BOOK_COLORS)).setOrigin(0.5, 0.8);
      b.rot = rand(-35, 35);
      this.adrInner.addAt(b, 0); // už kuprinės - atrodo, lyg kyšotų iš jos
      this.pile.push(b);
    }
    this.layoutPile(sc);
    const marks = { 5: 'SUNKU!', 10: 'LABAI SUNKU!', [MAX_BOOKS]: 'PILNA!' };
    if (book && marks[this.books]) {
      this.worldText(this.adr.x - 60, this.adr.y - 380, marks[this.books], this.books >= 10 ? C.red : C.orange, 44);
    }
  }

  layoutPile(sc) {
    const cx = -40 - 14 * sc; // kuprinės vidurys
    const top = -128 - 62 * sc; // kuprinės viršus
    this.pile.forEach((b, i) => {
      const row = Math.floor(i / 3);
      const col = (i % 3) - 1;
      b.setPosition(cx + col * 30 * sc, top + 18 - row * 16 * sc);
      b.setScale(0.75 * sc).setAngle(b.rot + col * 12);
    });
  }

  push(player) {
    const now = this.time.now;
    if (now - this.lastPush < PUSH_GAP) {
      this.tribune.bubble(player.pid, '💪', C.white);
      return;
    }
    this.lastPush = now;
    const v = this.makeKid(player, Math.max(-1.5, this.ud - 1.4));
    this.tweens.add({ targets: v.box, angle: 18, x: v.box.x + 30, duration: 160, yoyo: true });
    this.fadeKid(v, 1200);
    if (this.mode !== 'play') return;
    const boost = now < this.whistleUntil ? 2 : 1;
    this.u = Math.min(GOAL_U + 0.3, this.u + PUSH * boost);
    this.pushes += 1;
    this.stat(player, 'stumimai');
    this.worldText(this.adr.x - 90, this.adr.y - 200, boost > 1 ? 'HOP HOP!' : 'Hop!', C.green, 34);
    if (Math.random() < 0.4) this.maybeSub(this.A.lines.pick('laiptai', 'push', { vardas: player.name }), C.green, 3000);
  }

  cheer(player) {
    this.tribune.bubble(player.pid, 'Pirmyn!', C.yellow);
    if (Math.random() < 0.15) this.maybeSub(this.A.lines.pick('laiptai', 'cheer'), C.yellow, 4000);
  }

  runDown(player, slip) {
    const u0 = this.ud + (slip ? 5.5 : 10);
    const v = this.makeKid(player, u0);
    this.stat(player, slip ? 'slydo' : 'bego');
    const runTo = (from, to, ms) => {
      this.tweens.addCounter({
        from, to, duration: ms,
        onUpdate: (tw) => {
          this.setKidU(v, tw.getValue());
          v.body.y = -Math.abs(Math.sin(tw.getValue() * 3)) * 10;
        },
        onComplete: () => v.box.destroy(),
      });
    };
    if (!slip) {
      runTo(u0, this.ud - 12, 2400);
      if (Math.random() < 0.35) this.maybeSub(this.A.lines.pick('laiptai', 'run', { vardas: player.name }), C.white, 3500);
      return;
    }
    this.tweens.add({ targets: v.box, angle: -80, duration: 180, ease: 'Quad.In' });
    this.tweens.addCounter({
      from: u0, to: u0 - 1.6, duration: 380, ease: 'Quad.Out',
      onUpdate: (tw) => this.setKidU(v, tw.getValue()),
      onComplete: () => {
        this.worldText(v.box.x, v.box.y - 120, 'Oi!', C.white, 30);
        this.time.delayedCall(800, () => {
          if (!v.box.active) return;
          this.tweens.add({ targets: v.box, angle: 0, duration: 250, ease: 'Back.Out' });
          runTo(v.u, v.u - 14, 2600);
        });
      },
    });
    this.maybeSub(this.A.lines.pick('laiptai', 'slip', { vardas: player.name }), C.white, 3500);
  }

  kidWindow(player) {
    const k = this.windowKids.get(player.pid);
    if (k) return k;
    // jei vaikas atėjo vėliau, nei buvo vietos - pridedam
    this.addWindowKid(player, 99);
    return this.windowKids.get(player.pid) || null;
  }

  draw(player) {
    const k = this.kidWindow(player);
    if (!k) return;
    const { w } = k;
    const x = w.x + rand(-70, 70);
    const y = w.y + rand(-80, 50);
    const g = this.add.graphics({ x, y });
    g.lineStyle(6, 0xffffff, 0.95);
    const kind = Math.floor(Math.random() * 5);
    if (kind === 0) { // širdelė
      g.beginPath(); g.moveTo(0, 18); g.lineTo(-20, -2); g.arc(-10, -8, 11, Math.PI * 0.8, Math.PI * 1.95); g.arc(10, -8, 11, Math.PI * 1.05, Math.PI * 0.2); g.lineTo(0, 18); g.strokePath();
    } else if (kind === 1) { // snaigė
      for (let a = 0; a < 3; a++) {
        const ang = (a * Math.PI) / 3;
        g.lineBetween(-Math.cos(ang) * 20, -Math.sin(ang) * 20, Math.cos(ang) * 20, Math.sin(ang) * 20);
      }
    } else if (kind === 2) { // šypsenėlė
      g.strokeCircle(0, 0, 20);
      g.fillStyle(0xffffff, 0.95).fillCircle(-7, -5, 3).fillCircle(7, -5, 3);
      g.beginPath(); g.arc(0, 2, 10, 0.3, Math.PI - 0.3); g.strokePath();
    } else if (kind === 3) { // žvaigždutė
      g.beginPath();
      for (let i = 0; i <= 5; i++) {
        const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
        if (i === 0) g.moveTo(Math.cos(a) * 20, Math.sin(a) * 20); else g.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
      }
      g.strokePath();
    } else { // eglutė
      g.beginPath(); g.moveTo(0, -22); g.lineTo(16, 14); g.lineTo(-16, 14); g.closePath(); g.strokePath();
      g.lineBetween(0, 14, 0, 22);
    }
    g.setScale(0.2);
    this.L.bg.add(g);
    this.tweens.add({ targets: g, scale: 1, duration: 220, ease: 'Back.Out' });
    this.tweens.add({ targets: k.v.box, angle: { from: -6, to: 6 }, yoyo: true, repeat: 1, duration: 100, onComplete: () => k.v.box.setAngle(0) });
    this.stat(player, 'piesiniai');
    if (Math.random() < 0.2) this.maybeSub(this.A.lines.pick('laiptai', 'draw', { vardas: player.name }), C.teal, 5000);
  }

  wave(player) {
    const k = this.kidWindow(player);
    if (!k) return;
    this.tweens.add({ targets: k.v.box, angle: { from: -10, to: 10 }, yoyo: true, repeat: 2, duration: 110, onComplete: () => k.v.box.setAngle(0) });
    this.worldText(k.v.box.x, k.v.box.y - 230, '👋', C.white, 30);
  }

  holdDoors(player) {
    this.tribune.bubble(player.pid, '🚪', C.green);
    if (this.mode !== 'play') return;
    if (this.bonus >= MAX_BONUS) {
      this.maybeSub(this.A.lines.pick('laiptai', 'doors_max'), C.orange, 5000);
      return;
    }
    this.bonus += 1;
    this.timeLeft += 1;
    this.A.sfx.plus();
    floatText(this, 960, 200, '+1 s', { color: C.green, size: 54 });
    this.bonusText.setText(`Budėtoja laiko duris: +${this.bonus} s`);
    this.maybeSub(this.A.lines.pick('laiptai', 'doors'), C.green, 2000);
  }

  whistle() {
    this.whistleUntil = this.time.now + WHISTLE_MS;
    this.A.sfx.whistle();
    floatText(this, this.teacherHud ? 1700 : 960, 230, 'FIIIT!', { color: C.yellow, size: 44 });
    this.maybeSub(this.A.lines.pick('laiptai', 'whistle'), C.yellow, 1500);
  }

  // ---------------- HUD ----------------
  makeHud() {
    const D = 750;
    headText(this, 40, 54, STAGE.mission, 46, C.yellow).setOrigin(0, 0.5).setDepth(D);
    this.add.image(62, 118, 'backpack_big').setScale(0.36).setDepth(D);
    this.weightText = bodyText(this, 94, 116, '', 28, '#f1e6ff').setOrigin(0, 0.5).setDepth(D);
    this.updateWeight();

    this.timerText = headText(this, 960, 70, '0:30', 92, C.white).setDepth(D);
    this.bonusText = bodyText(this, 960, 182, '', 24, C.green).setDepth(D);
    const barW = 640;
    this.add.rectangle(960, 140, barW + 10, 26, 0x000000, 0.6).setDepth(D).setStrokeStyle(3, 0x14081f);
    this.barFill = this.add.rectangle(960 - barW / 2, 140, 1, 16, 0xff3ea5).setOrigin(0, 0.5).setDepth(D);
    this.barW = barW;
    [[START_U, '1'], [FLOOR2_U, '2'], [GOAL_U, '3']].forEach(([u, n]) => {
      const x = 960 - barW / 2 + (barW * (u - START_U)) / (GOAL_U - START_U);
      this.add.circle(x, 140, 15, 0xffd23f).setStrokeStyle(3, 0x14081f).setDepth(D + 1);
      bodyText(this, x, 141, n, 18, C.ink, { strokeThickness: 0 }).setDepth(D + 2);
    });
    const face = this.textures.exists('adr_face');
    this.barRunner = this.add.image(960 - barW / 2, face ? 140 : 128, face ? 'adr_face' : 'adr_head').setScale(face ? 0.36 : 0.28).setDepth(D + 3);

    // budėtoja (mokytoja) dešiniame kampe
    const t = this.A.host.teachers()[0];
    if (t) {
      const key = this.textures.exists(avatarKey(t.name)) ? avatarKey(t.name) : 'dot';
      this.add.circle(1800, 92, 50, 0x0b0418, 0.85).setStrokeStyle(5, 0xffd23f).setDepth(D);
      this.add.image(1800, 92, key).setDisplaySize(86, 86).setDepth(D + 1);
      bodyText(this, 1800, 164, 'BUDĖTOJA', 20, C.yellow).setDepth(D);
      this.teacherHud = true;
    }

    // rodyklių užuominos po Adriana
    const key = (x, label) => {
      const bgk = this.add.rectangle(x, 890, 74, 64, 0x0b0418, 0.85).setStrokeStyle(5, 0x14081f).setDepth(D);
      const tx = headText(this, x, 888, label, 44, C.white, { strokeThickness: 0 }).setDepth(D + 1);
      tx.setShadow(0, 0, 'rgba(0,0,0,0)');
      return { bgk, tx };
    };
    this.keyL = key(ANCHOR.x - 50, '←');
    this.keyR = key(ANCHOR.x + 50, '→');
    this.updateKeys();
  }

  updateKeys() {
    const next = this.lastFoot === 'L' ? 'R' : this.lastFoot === 'R' ? 'L' : null;
    for (const [k, v] of [['L', this.keyL], ['R', this.keyR]]) {
      const on = (!next || next === k) && this.stumbleT <= 0;
      v.bgk.setFillStyle(on ? 0xff3ea5 : 0x0b0418, on ? 0.95 : 0.6).setStrokeStyle(5, on ? 0xffd23f : 0x14081f);
      v.tx.setAlpha(on ? 1 : 0.4);
    }
  }

  updateWeight() {
    const kg = 6 + this.books * 1.5 + this.mandarins * 0.2;
    this.weightText.setText(`Kuprinė: ${kg.toFixed(1).replace('.', ',')} kg`);
    this.weightText.setColor(this.books >= MAX_BOOKS ? C.red : this.books > 6 ? C.orange : '#f1e6ff');
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
      if (!this.saidTen && s >= 9) { this.saidTen = true; this.maybeSub(this.A.lines.pick('laiptai', 'ten'), C.red, 0); }
    }
    const f = Phaser.Math.Clamp((this.ud - START_U) / (GOAL_U - START_U), 0, 1);
    this.barFill.setSize(Math.max(1, this.barW * f), 16);
    this.barRunner.x = 960 - this.barW / 2 + this.barW * f;
  }

  // ---------------- pabaiga ----------------
  hideKeys() {
    for (const v of [this.keyL, this.keyR]) { v.bgk.setVisible(false); v.tx.setVisible(false); }
  }

  win() {
    this.mode = 'end';
    this.hideKeys();
    this.A.sfx.win();
    this.tweens.add({ targets: this.door, scaleX: 0.15, duration: 300 });
    this.tweens.add({
      targets: this.adr, x: xAt(DOOR_U), duration: 600, ease: 'Sine.InOut',
      onComplete: () => this.tweens.add({ targets: this.adr, alpha: 0, duration: 250 }),
    });
    banner(this, 'MISIJA ĮVYKDYTA!', '+100 RESPEKTO', { color: C.yellow, hold: 2800 });
    this.time.delayedCall(1200, () => subtitle(this, this.A.lines.pick('laiptai', 'success'), { color: C.yellow }));
    this.time.delayedCall(3400, () => this.showResult(true));
  }

  fail() {
    this.mode = 'end';
    this.hideKeys();
    this.A.sfx.schoolBell();
    this.time.delayedCall(600, () => this.A.sfx.fail());
    banner(this, 'SKAMBUTIS!', 'BET KUPRINĖ - LEGENDA', { color: C.red, hold: 2600 });
    this.time.delayedCall(1000, () => subtitle(this, this.A.lines.pick('laiptai', 'fail'), { color: C.orange }));
    this.time.delayedCall(3400, () => this.showResult(false));
  }

  showResult(ok) {
    this.mode = 'result';
    this.A.host.setPhase('result', STAGE);
    const box = this.add.container(960, 500).setDepth(950).setAlpha(0);
    box.add(this.add.rectangle(0, 0, 1240, 600, 0x0b0418, 0.9).setStrokeStyle(6, ok ? 0xffd23f : 0xff4d5e));
    box.add(headText(this, 0, -235, ok ? 'UŽLIPO!' : 'BEVEIK UŽLIPO!', 80, ok ? C.yellow : C.orange));
    const all = [...this.stats.values()];
    const best = (k) => all.map((x) => [x, x.counts[k] || 0]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
    const kg = 6 + this.books * 1.5 + this.mandarins * 0.2;
    const rows = [
      [`Laikas: ${this.elapsed.toFixed(1).replace('.', ',')} s   ·   Žingsniai: ${this.steps}   ·   Suklupo: ${this.stumbles} k.`, C.white],
      [`Kuprinė: ${kg.toFixed(1).replace('.', ',')} kg   ·   Knygos: ${this.books}   ·   Mandarinai: ${this.mandarins}   ·   Stūmimai: ${this.pushes}`, C.white],
    ];
    const loader = best('knygos');
    if (loader) rows.push([`Sunkiausias krovikas: ${loader[0].name} (${loader[1]})`, C.orange]);
    const pusher = best('stumimai');
    if (pusher) rows.push([`Stipriausias stūmikas: ${pusher[0].name} (${pusher[1]})`, C.green]);
    const artist = best('piesiniai');
    if (artist) rows.push([`Lango menininkas: ${artist[0].name}`, C.teal]);
    if (this.bonus) rows.push([`Budėtoja laikė duris: +${this.bonus} s`, C.yellow]);
    rows.slice(0, 6).forEach(([r, c], i) => box.add(bodyText(this, 0, -140 + i * 54, r, 30, c)));
    const next = headText(this, 0, 240, 'ENTER - TOLIAU', 48, C.white);
    this.tweens.add({ targets: next, alpha: 0.3, yoyo: true, repeat: -1, duration: 650 });
    box.add(next);
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
  }

  // ---------------- ciklas ----------------
  update(_, deltaMs) {
    const dt = Math.min(deltaMs, 66) / 1000;
    const play = this.mode === 'play';

    if (play) {
      this.timeLeft -= dt;
      this.elapsed += dt;
      if (this.autoplay) {
        this.autoT -= dt;
        if (this.autoT <= 0) {
          this.autoT = 0.17;
          const same = Math.random() < 0.04;
          this.foot(same ? (this.lastFoot || 'L') : (this.lastFoot === 'L' ? 'R' : 'L'));
        }
      }
    }
    if (this.stumbleT > 0) {
      this.stumbleT -= dt;
      if (this.stumbleT <= 0) this.updateKeys();
    }

    // Adrianos judėjimas (sklandžiai link tikslo)
    const prev = this.ud;
    if (this.mode !== 'end' && this.mode !== 'result') this.ud += (this.u - this.ud) * Math.min(1, dt * 10);
    const moving = this.ud - prev > 0.002;
    if (moving) this.walkT += dt;
    if (this.mode !== 'end' || this.adr.alpha === 1) {
      const x = xAt(this.ud);
      const y = yAt(this.ud) + (moving ? -Math.abs(Math.sin(this.walkT * 18)) * 6 : 0);
      if (this.mode !== 'end') this.adr.setPosition(x, y);
      this.shadow.setPosition(this.adr.x, yAt(this.ud) + 2);
    }
    this.adrHead.y = -196 + (moving ? Math.sin(this.walkT * 24) * 3 : 0);
    // kuo sunkesnė kuprinė, tuo labiau pasilenkusi ir prakaituoja
    this.adrInner.setAngle(Math.min(14, this.books) + this.tilt.a);
    if (this.books >= 7 && moving && this.mode === 'play') {
      this.sweatT -= dt;
      if (this.sweatT <= 0) {
        this.sweatT = this.books >= 11 ? 0.25 : 0.45;
        const d = this.add.image(this.adr.x + rand(10, 40), this.adr.y - 300 * ADR_S, 'tear').setScale(0.9);
        this.L.fx.add(d);
        this.tweens.add({ targets: d, x: d.x + rand(20, 50), y: d.y + rand(40, 80), alpha: 0, duration: 500, ease: 'Quad.In', onComplete: () => d.destroy() });
      }
    }

    if (play) {
      if (!this.saidFloor && this.ud >= FLOOR2_U) {
        this.saidFloor = true;
        this.worldText(this.adr.x, this.adr.y - 340, '2 AUKŠTAS!', C.yellow, 46);
        this.maybeSub(this.A.lines.pick('laiptai', 'floor'), C.yellow, 0);
      }
      if (!this.saidNear && this.ud >= GOAL_U - 7) {
        this.saidNear = true;
        this.maybeSub(this.A.lines.pick('laiptai', 'near'), C.yellow, 1000);
      }
    }

    // kamera seka Adrianą
    const tx = xAt(this.ud) - ANCHOR.x;
    const ty = yAt(this.ud) - ANCHOR.y;
    this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 6);
    this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 6);
    this.applyCam();
    this.moveWindowKids();

    this.updateHud();
    if (play) {
      if (this.ud >= GOAL_U) this.win();
      else if (this.timeLeft <= 0) this.fail();
    }
  }
}
