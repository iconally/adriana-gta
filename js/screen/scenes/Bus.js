// 4 etapas: Bėgimas iki autobuso.
// Adriana bėga automatiškai ir šokinėja (TARPAS / ↑). Klasiokai fone
// mėto gniūžtes, moja iš autobuso, šaukia. Tik "Vairuotojo draugai"
// šiek tiek padeda - prideda laiko (daugiausia +5 s).

import { cityBackdrop, headText, bodyText, banner, subtitle, floatText, missionCard, C } from '../fx.js';
import { Tribune, avatarKey } from '../tribune.js';
import { STAGES } from '../stages.js';
import { BUS_WINDOWS, BUS_DOOR, BUS_H } from '../art.js';

const STAGE = STAGES.autobusas;
const GROUND = 862; // Adrianos pėdų linija
const ADR_X = 380;
const GRAVITY = 2700;
const JUMP_V = 1180;
const RUN_SPEED = 560;
const GOAL_DIST = RUN_SPEED * 34;
const TIME_LIMIT = 45;
const MAX_BONUS = 5;
const DOOR_PRESSES_PER_SEC = 3;
const BUS_Y = GROUND - BUS_H + 6;

const OBSTACLES = {
  puddle: { tex: 'puddle', w: 190, h: 34, weight: 3, line: 'trip_puddle' },
  snowpile: { tex: 'snowpile', w: 160, h: 80, weight: 3, line: 'trip' },
  fence: { tex: 'fence', w: 130, h: 112, weight: 2, line: 'trip' },
  friend: { w: 80, h: 150, weight: 2, line: 'trip_friend' },
};
const DECOR = [
  { tex: 'tree', y: GROUND - 16, weight: 3 },
  { tex: 'lamp', y: GROUND - 14, weight: 3 },
  { tex: 'snowman', y: GROUND - 12, weight: 2 },
  { tex: 'stop', y: GROUND - 14, weight: 1 },
];
const KID_TINTS = [0xff6fb5, 0x6fe6ff, 0xffd166, 0xa98bff, 0x7dff9b, 0xff9a6b];

const rand = (a, b) => a + Math.random() * (b - a);
function weighted(list) {
  const total = list.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (const x of list) { r -= x.weight; if (r <= 0) return x; }
  return list[0];
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
    this.ground = this.add.tileSprite(960, GROUND - 30, 1920, 140, 'sidewalk').setOrigin(0.5, 0).setDepth(-40);
    this.add.rectangle(960, 1080, 1920, 120, 0x1d1233).setOrigin(0.5, 1).setDepth(-39);

    this.decor = [];
    this.obstacles = [];
    this.movers = [];
    for (let x = 200; x < 2300; x += rand(330, 520)) this.addDecor(x);

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
    this.stats = new Map(); // pid -> { name, mesti, mojuoti, duris, sauk }

    this.makeAdriana();
    this.makeHud();
    this.tribune = new Tribune(this, A.host, { y: 1006, maxSize: 64 });
    this.card = missionCard(this, {
      nr: STAGE.nr,
      mission: STAGE.mission,
      title: STAGE.title,
      tip: A.lines.pick('autobusas', 'intro'),
      controls: 'Adriana: šuolis - TARPAS arba ↑',
    });

    const kb = this.input.keyboard;
    kb.on('keydown-ENTER', () => this.onEnter());
    kb.on('keydown-SPACE', () => (this.mode === 'intro' ? this.onEnter() : this.jump()));
    kb.on('keydown-UP', () => this.jump());
    kb.on('keydown-W', () => this.jump());
    kb.on('keydown-R', () => this.scene.restart());

    const off = A.host.on('press', (e) => this.onPress(e));
    this.events.once('shutdown', off);
  }

  // ---------------- valdymas ----------------
  onEnter() {
    if (this.mode === 'intro') this.countdown();
    else if (this.mode === 'result') this.A.go('Lobby');
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
    if (this.trips <= 5) {
      const s = this.stars[this.trips - 1];
      s.setTexture('star');
      this.tweens.add({ targets: s, scale: 1.6, yoyo: true, duration: 180 });
    }
    const line = this.A.lines.pick('autobusas', ob.def.line, { vardas: ob.name || '' });
    subtitle(this, line, { color: C.orange });
    this.lastSub = this.time.now;
  }

  // ---------------- pasaulis ----------------
  addDecor(x) {
    const d = weighted(DECOR);
    const img = this.add.image(x, d.y, d.tex).setOrigin(0.5, 1).setDepth(-30);
    if (d.tex === 'tree') img.setScale(rand(0.85, 1.1));
    this.decor.push(img);
  }

  spawnObstacle() {
    const players = this.A.host.list();
    let type = weighted(Object.entries(OBSTACLES).map(([id, o]) => ({ id, ...o })));
    if (type.id === 'friend' && !players.length) type = { id: 'snowpile', ...OBSTACLES.snowpile };
    const x = 2100;
    let view;
    let name = '';
    if (type.id === 'friend') {
      const p = players[Math.floor(Math.random() * players.length)];
      name = p.name;
      view = this.add.container(x, GROUND).setDepth(200);
      const bodyImg = this.add.image(0, 0, 'kid_body').setOrigin(0.5, 1).setTint(KID_TINTS[Math.floor(Math.random() * KID_TINTS.length)]);
      const key = this.textures.exists(avatarKey(p.name)) ? avatarKey(p.name) : 'adr_head';
      const head = this.add.image(0, -170, key).setDisplaySize(96, 96);
      const tag = bodyText(this, 0, -232, p.name, 22, C.yellow);
      view.add([bodyImg, head, tag]);
      this.tweens.add({ targets: head, angle: { from: -8, to: 8 }, yoyo: true, repeat: -1, duration: 260 });
    } else {
      view = this.add.image(x, GROUND + (type.id === 'puddle' ? 14 : 4), type.tex).setOrigin(0.5, 1).setDepth(200);
    }
    this.obstacles.push({ def: type, view, x, w: type.w, h: type.h, name, hit: false });
  }

  // ---------------- klasiokų veiksmai (fonas) ----------------
  onPress({ player, action }) {
    const st = this.stats.get(player.pid) || { name: player.name, mesti: 0, mojuoti: 0, duris: 0, sauk: 0 };
    this.stats.set(player.pid, st);
    const live = this.mode === 'play' || this.mode === 'arrive';
    if (!live) { this.tribune.bounce(player.pid); return; }
    if (action === 'mesti') { st.mesti += 1; this.throwSnowball(player); }
    else if (action === 'mojuoti') { st.mojuoti += 1; this.wave(player); }
    else if (action === 'duris') { st.duris += 1; this.holdDoors(player); }
    else if (action === 'bek' || action === 'sok') {
      st.sauk += 1;
      this.tribune.bounce(player.pid);
      this.tribune.bubble(player.pid, this.A.lines.pick('autobusas', action === 'bek' ? 'cheer_bek' : 'cheer_sok'), C.teal);
    }
  }

  maybeSub(text, color = C.white, gap = 2600) {
    if (this.time.now - this.lastSub < gap) return;
    this.lastSub = this.time.now;
    subtitle(this, text, { color });
  }

  throwSnowball(player) {
    this.tribune.bounce(player.pid);
    const from = this.tribune.pos(player.pid);
    const aimAdriana = this.mode === 'play' && Math.random() < 0.12;
    const visible = this.decor.filter((d) => d.x > ADR_X + 160 && d.x < 1850);
    const target = aimAdriana || !visible.length ? null : visible[Math.floor(Math.random() * visible.length)];
    const offX = rand(-30, 30);
    const offY = target ? rand(0.35, 0.8) : 0;
    const where = () => (target
      ? { x: target.x + offX, y: target.y - target.displayHeight * offY }
      : { x: this.adr.x + 6, y: this.adr.y - 240 });

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
        this.splat(end.x, end.y, !target);
        floatText(this, end.x, end.y - 30, player.name, { color: C.white, size: 22, rise: 60 });
        if (!target) this.maybeSub(this.A.lines.pick('autobusas', 'snow_adriana', { vardas: player.name }), C.teal, 3500);
        else if (Math.random() < 0.3) {
          const cat = `snow_${target.texture.key}`;
          const line = this.A.lines.pick('autobusas', cat, { vardas: player.name }) || this.A.lines.pick('autobusas', 'snow', { vardas: player.name });
          this.maybeSub(line, C.white, 3000);
        }
      },
    });
  }

  splat(x, y, onAdriana) {
    this.A.sfx.splat();
    const s = this.add.image(x, y, 'splat').setDepth(onAdriana ? 310 : 150).setScale(0.2).setAngle(rand(0, 360));
    this.tweens.add({ targets: s, scale: onAdriana ? 0.6 : 0.8, duration: 120, ease: 'Back.Out' });
    this.tweens.add({ targets: s, alpha: 0, delay: onAdriana ? 500 : 1600, duration: 500, onComplete: () => s.destroy() });
    if (!onAdriana) this.movers.push(s);
    else {
      this.tweens.add({ targets: this.adrHead, angle: { from: -12, to: 12 }, yoyo: true, repeat: 1, duration: 80, onComplete: () => this.adrHead.setAngle(0) });
    }
  }

  wave(player) {
    this.tribune.bounce(player.pid);
    this.tribune.bubble(player.pid, '👋', C.white);
    const slot = this.windowSlot++ % this.hudWindows.length;
    const w = this.hudWindows[slot];
    if (w.img) w.img.destroy();
    const key = this.textures.exists(avatarKey(player.name)) ? avatarKey(player.name) : 'dot';
    w.img = this.add.image(w.x, w.y + 10, key).setDisplaySize(w.size, w.size).setDepth(760);
    w.img.setScale(0);
    this.tweens.add({ targets: w.img, scaleX: w.size / w.img.width, scaleY: w.size / w.img.height, y: w.y, duration: 240, ease: 'Back.Out' });
    this.tweens.add({ targets: w.img, angle: { from: -10, to: 10 }, yoyo: true, repeat: 3, duration: 160 });
    const img = w.img;
    this.time.delayedCall(2600, () => {
      if (w.img === img) { img.destroy(); w.img = null; }
    });
    if (Math.random() < 0.25) this.maybeSub(this.A.lines.pick('autobusas', 'wave', { vardas: player.name }));
  }

  holdDoors(player) {
    this.tribune.bounce(player.pid);
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
    this.add.image(bx, by, 'bus').setOrigin(0, 0).setScale(sc).setDepth(D);
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
  arrive() {
    this.mode = 'arrive';
    for (const o of this.obstacles) this.tweens.add({ targets: o.view, alpha: 0, duration: 300 });
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
        this.tweens.add({
          targets: [this.adr, this.shadow], x: stopX + doorX, duration: 1400, ease: 'Sine.InOut',
          onComplete: () => {
            this.tweens.add({ targets: this.adr, alpha: 0, scale: 0.85, duration: 250 });
            this.shadow.setVisible(false);
            this.time.delayedCall(350, () => {
              this.tweens.add({ targets: this.busDoor, scaleX: 1, duration: 250 });
              this.win(bus);
            });
          },
        });
      },
    });
  }

  makeBus(x) {
    const bus = this.add.container(x, BUS_Y).setDepth(250);
    bus.add(this.add.image(0, 0, 'bus').setOrigin(0, 0));
    const list = this.A.host.list();
    BUS_WINDOWS.forEach((w, i) => {
      const p = list[(i + this.windowSlot) % Math.max(list.length, 1)];
      if (!p || !this.textures.exists(avatarKey(p.name))) return;
      const img = this.add.image(w.x + w.w / 2, w.y + w.h / 2 + 4, avatarKey(p.name)).setDisplaySize(w.w - 10, w.w - 10);
      bus.add(img);
    });
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
    const bus = this.makeBus(1250);
    bus.setAlpha(0);
    this.tweens.add({ targets: bus, alpha: 1, duration: 300 });
    this.A.sfx.horn();
    this.tweens.add({ targets: bus, x: 2200, delay: 400, duration: 1800, ease: 'Cubic.In' });
    this.tweens.add({ targets: this.adr, angle: 10, yoyo: true, repeat: 2, duration: 200 });
    this.time.delayedCall(600, () => {
      this.A.sfx.fail();
      banner(this, 'AUTOBUSAS IŠVAŽIAVO', 'BET STILINGAI', { color: C.red, hold: 2600 });
      subtitle(this, this.A.lines.pick('autobusas', 'fail'), { color: C.orange });
    });
    this.time.delayedCall(3500, () => this.showResult(false));
  }

  showResult(ok) {
    this.mode = 'result';
    this.A.host.setPhase('result', STAGE);
    const box = this.add.container(960, 520).setDepth(950).setAlpha(0);
    box.add(this.add.rectangle(0, 0, 1180, 560, 0x0b0418, 0.88).setStrokeStyle(6, ok ? 0xffd23f : 0xff4d5e));
    box.add(headText(this, 0, -220, ok ? 'SPĖJO!' : 'BEVEIK SPĖJO!', 80, ok ? C.yellow : C.orange));

    const all = [...this.stats.values()];
    const sum = (k) => all.reduce((s, x) => s + x[k], 0);
    const best = (k) => all.filter((x) => x[k] > 0).sort((a, b) => b[k] - a[k])[0];
    const rows = [
      `Laikas: ${this.elapsed.toFixed(1).replace('.', ',')} s    ·    Kliūtys: ${this.trips}`,
      `Gniūžčių: ${sum('mesti')}    ·    Mojavimų: ${sum('mojuoti')}    ·    Šūksnių: ${sum('sauk')}`,
      `Durų laikytojai: +${this.bonus} s`,
    ];
    const thrower = best('mesti');
    if (thrower) rows.push(`Taikliausias metikas: ${thrower.name} (${thrower.mesti})`);
    const holder = best('duris');
    if (holder) rows.push(`Vairuotojo geriausias draugas: ${holder.name}`);
    rows.forEach((r, i) => box.add(bodyText(this, 0, -110 + i * 56, r, 34, i >= 3 ? C.teal : C.white)));
    const next = headText(this, 0, 220, 'ENTER - TOLIAU', 48, C.white);
    this.tweens.add({ targets: next, alpha: 0.3, yoyo: true, repeat: -1, duration: 650 });
    box.add(next);
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
  }

  // ---------------- ciklas ----------------
  update(_, deltaMs) {
    const dt = Math.min(deltaMs, 66) / 1000;
    const running = this.mode === 'play' || this.mode === 'arrive' || this.mode === 'count' || this.mode === 'intro';

    // greitis
    if (this.tripT > 0) { this.tripT -= dt; this.speedMul = 0.35; }
    else this.speedMul = Math.min(1, this.speedMul + dt * 1.6);
    if (this.invuln > 0) this.invuln -= dt;
    let speed = RUN_SPEED * this.speedMul;
    if (this.mode === 'intro' || this.mode === 'count') speed = 120;
    if (this.slowDown) {
      this.arriveMul = Math.max(0, (this.arriveMul ?? 1) - dt * 1.2);
      speed *= this.arriveMul;
    }
    if (this.mode === 'missed' || this.mode === 'result') speed = 0;

    if (running) {
      this.skyline.tilePositionX += speed * dt * 0.08;
      this.ground.tilePositionX += speed * dt;
      for (const d of this.decor) d.x -= speed * dt;
      const gone = this.decor.filter((d) => d.x < -260);
      if (gone.length) {
        const maxX = Math.max(...this.decor.map((d) => d.x));
        for (const d of gone) {
          this.decor.splice(this.decor.indexOf(d), 1);
          d.destroy();
          this.addDecor(Math.max(2150, maxX + rand(330, 520)));
        }
      }
      for (const m of this.movers) if (m.active) m.x -= speed * dt;
      this.movers = this.movers.filter((m) => m.active);
    }

    // laikas ir atstumas
    if (this.mode === 'play') {
      this.timeLeft -= dt;
      this.elapsed += dt;
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
      if (this.mode === 'play' && !o.hit && this.invuln <= 0) {
        const overlapX = Math.abs(o.x - ADR_X) < o.w * 0.38 + 30;
        if (overlapX && this.ay > GROUND - o.h) this.tripOver(o);
      }
    }
    const old = this.obstacles.filter((o) => o.x < -250);
    for (const o of old) o.view.destroy();
    this.obstacles = this.obstacles.filter((o) => o.x >= -250);

    // Adrianos šuolis
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
    this.animT += dt * (speed > 40 || this.mode === 'arrive' ? 1 : 0);
    if (this.mode !== 'result' && this.mode !== 'missed') {
      this.adrBody.setTexture(inAir ? 'adr_jump' : (Math.floor(this.animT / 0.13) % 2 ? 'adr_run1' : 'adr_run2'));
      this.adrHead.y = -196 + (inAir ? -4 : Math.sin(this.animT * 24) * 4);
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
