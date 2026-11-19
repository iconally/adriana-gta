// 3 etapas: Kai mokytoja nusisuka.
//
// Klasė slapta perduoda kalėdinį atviruką per suolus nuo Adrianos iki mokytojos stalo.
// Kol Adriana laiko → (arba TARPĄ), atvirukas keliauja; paleidus - sustoja.
// Mokytoja rašo lentoje, kartais sustoja („Hmm?“) ir atsisuka. Jei tada atvirukas
// juda - PAGAVO, atvirukas grįžta 2 suolus atgal. Laiko 40 s.
// Klasiokai sėdi suoluose:
//  - perdavėjai (6): jų suolai atviruko kelyje - perduoti greičiau, paslėpti po knyga;
//  - klausinėtojai (4): klausti (mokytoja iškart atsisuka!), kelti ranką;
//  - uolūs mokiniai (4): rašyti uoliai (mokytoja ilgiau rašo), žiovauti;
//  - triukšmadariai (3): čiaudėti, numesti penalą (fonas);
//  - mokytoja: atsisukti (bando pagauti), rašyti toliau.

import { headText, bodyText, banner, subtitle, missionCard, C } from '../fx.js';
import { Tribune, avatarKey } from '../tribune.js';
import { STAGES } from '../stages.js';
import { BOARD } from '../art-class.js';
import { isBoy, GIRL_COLORS, BOY_COLORS } from '../../common.js';

const STAGE = STAGES.pamoka;
const TIME_LIMIT = 40;
const CARD_SPEED = 0.75; // suolų per sekundę, kol Adriana laiko
const BOOST = 0.45; // perdavėjo „Perduoti“
const HIDE_MS = 3000;
const CAUGHT_BACK = 2;
const FREEZE_MS = 1200;
const WRITE = [3.0, 5.0]; // kiek sekundžių rašo lentoje
const WARN = 0.8; // „Hmm?“ prieš atsisukant
const FACE = [1.4, 2.2]; // kiek žiūri į klasę
const CALM_MS = 1500; // ką tik pradėjusios rašyti mokytojos klausimais neatsuksi
const DILIGENT_ADD = 0.8; // uolus mokinys prailgina rašymą
const DILIGENT_MAX = 2.4;
const QUESTION_GAP = 9000;

// Suolų eilės: y - suolo viršus, s - mastelis (toliau - mažesni).
const ROWS = {
  B: { y: 520, s: 0.56 },
  M: { y: 690, s: 0.66 },
  F: { y: 862, s: 0.78 },
};
// Atviruko kelias: Adrianos suolas, 6 perdavėjų suolai, mokytojos stalas.
const PATH_SEATS = [['M', 190], ['F', 347], ['M', 504], ['F', 661], ['M', 819], ['F', 976], ['M', 1133]];
const TEACHER_DESK = { x: 1300, y: 902 };
const CARD_END = { x: 1290, y: 760 };
// Kitos vietos (kiti vaikai): pirmiau arčiau esančios.
const OTHER_SEATS = [
  ['M', 347], ['M', 661], ['M', 976], ['F', 190], ['F', 504], ['F', 819],
  ['B', 150], ['B', 330], ['B', 510], ['B', 690], ['B', 870], ['B', 1050],
];
const TEACHER = { x: 1610, y: 884, s: 1.15 };
const BOARD_LINES = ['KALĖDŲ PAMOKA', '2 + 2 = 4', 'Linksmų Kalėdų!'];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
function tintOf(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const colors = isBoy(name) ? BOY_COLORS : GIRL_COLORS;
  return colors[h % colors.length];
}

export class PamokaScene extends Phaser.Scene {
  constructor() { super('Pamoka'); }

  create() {
    const A = window.AGTA;
    this.A = A;
    this.mode = 'intro'; // intro -> count -> play -> end -> result
    A.host.setPhase('intro', STAGE);

    // Phaser naudoja tą patį scenos objektą, todėl visą būseną nustatom iš naujo.
    this.c = 0; // atviruko vieta kelyje (0 - Adriana, 7 - mokytojos stalas)
    this.boost = 0;
    this.hiddenUntil = 0;
    this.hiddenBy = null;
    this.freezeUntil = 0;
    this.caught = 0;
    this.questions = 0;
    this.hides = 0;
    this.passes = 0;
    this.lastQuestion = -99999;
    this.lastDiligent = 0;
    this.lastNode = 0;
    this.timeLeft = TIME_LIMIT;
    this.elapsed = 0;
    this.lastTick = 99;
    this.timerDanger = undefined;
    this.saidTen = false;
    this.saidNear = false;
    this.lastSub = 0;
    this.stats = new Map();
    this.seats = new Map(); // pid -> sėdintis vaikas
    this.pathKids = new Array(PATH_SEATS.length).fill(null); // kelio suolas -> vaikas
    this.autoplay = !!this.autoplay;
    this.boardChars = 0;
    this.boardT = 0;

    this.add.image(960, 540, 'class_room').setDepth(-100);
    this.add.image(BOARD.x + BOARD.w / 2, BOARD.y + BOARD.h / 2, 'chalkboard').setDepth(-90);
    this.boardText = bodyText(this, BOARD.x + 40, BOARD.y + 50, '', 34, '#f4f7ff', {
      align: 'left', strokeThickness: 0, lineSpacing: 14, fontStyle: 'bold',
    }).setOrigin(0, 0).setDepth(-89);

    this.nodes = PATH_SEATS.map(([r, x]) => ({ x, y: ROWS[r].y - 16 * ROWS[r].s, s: ROWS[r].s }));
    this.nodes.push({ ...CARD_END, s: 1 });
    this.makeDesks();
    this.placeKids();
    this.makeTeacher();
    this.makeCard();
    this.makeHud();
    this.teacherWrite();

    this.tribune = new Tribune(this, A.host, { y: 1006, maxSize: 64 });
    this.card = missionCard(this, {
      nr: STAGE.nr,
      mission: STAGE.mission,
      title: STAGE.title,
      tip: A.lines.pick('pamoka', 'intro'),
      controls: 'Adriana: laikyk → arba TARPĄ - atvirukas keliauja. Paleisk, kai mokytoja atsisuka!',
    });
    this.card.setDepth(1900); // virš suolų ir HUD

    const kb = this.input.keyboard;
    this.keys = kb.addKeys({ right: 'RIGHT', d: 'D', space: 'SPACE' });
    kb.on('keydown-ENTER', () => this.onEnter());
    kb.on('keydown-SPACE', () => { if (this.mode === 'intro') this.onEnter(); });
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
    const nums = ['3', '2', '1', 'TYLIAI!'];
    nums.forEach((n, i) => {
      this.time.delayedCall(i * 700, () => {
        const last = i === nums.length - 1;
        const t = headText(this, 960, 470, n, last ? 190 : 240, last ? C.yellow : C.white).setDepth(1960);
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
    this.teacherWrite();
    this.sub(this.A.lines.pick('pamoka', 'start'), C.yellow);
  }

  holding() {
    if (this.autoplay) return this.teacher.state === 'writing' && this.time.now - this.teacher.since > 250;
    return this.keys.right.isDown || this.keys.d.isDown || this.keys.space.isDown;
  }

  // ---------------- klasė ----------------
  makeDesks() {
    this.deskImgs = [];
    const desk = (r, x) => {
      const row = ROWS[r];
      const d = this.add.image(x, row.y, 'desk').setOrigin(0.5, 0.1).setScale(row.s * 1.1).setDepth(row.y + 1);
      this.deskImgs.push(d);
    };
    for (const [r, x] of [...PATH_SEATS, ...OTHER_SEATS]) desk(r, x);
    this.add.image(TEACHER_DESK.x, TEACHER_DESK.y, 'teacher_desk').setOrigin(0.5, 1).setDepth(TEACHER_DESK.y);
    // Adriana prie pirmo kelio suolo
    const [r, x] = PATH_SEATS[0];
    const row = ROWS[r];
    const box = this.add.container(x, row.y).setScale(row.s * 1.1).setDepth(row.y);
    const body = this.add.image(0, 70, 'adr_run2').setOrigin(0.5, 1);
    const face = this.textures.exists('adr_face');
    const head = this.add.image(4, -130, face ? 'adr_face' : 'adr_head').setOrigin(0.5, face ? 0.5 : 0.56);
    if (face) head.setDisplaySize(124, 124);
    box.add([body, head]);
    this.adr = { box, head };
  }

  seatPos(r, x) {
    const row = ROWS[r];
    return { x, y: row.y, s: row.s };
  }

  makeSeatedKid(player, r, x) {
    const p = this.seatPos(r, x);
    const box = this.add.container(p.x, p.y).setScale(p.s).setDepth(p.y);
    const body = this.add.image(0, 64, 'kid_body').setOrigin(0.5, 1).setTint(tintOf(player.name));
    const key = this.textures.exists(avatarKey(player.name)) ? avatarKey(player.name) : 'dot';
    const head = this.add.image(0, -110, key).setDisplaySize(96, 96);
    const tag = bodyText(this, 0, -180, player.name, 30, C.yellow);
    box.add([body, head, tag]);
    return { box, body, head, tag, name: player.name, pid: player.pid, x: p.x, y: p.y, s: p.s };
  }

  placeKids() {
    const host = this.A.host;
    host.playersWithRole('perdavejas').forEach((p, i) => {
      if (i + 1 >= PATH_SEATS.length) return this.addOtherKid(p);
      const [r, x] = PATH_SEATS[i + 1];
      const v = this.makeSeatedKid(p, r, x);
      v.path = i + 1;
      this.pathKids[i + 1] = v;
      this.seats.set(p.pid, v);
      return v;
    });
    for (const role of ['klausinetojas', 'uolus', 'triuksmadarys']) {
      host.playersWithRole(role).forEach((p) => this.addOtherKid(p));
    }
    // jei perdavėjų mažiau - laisvi kelio suolai lieka tušti (atvirukas slysta per juos)
  }

  addOtherKid(player) {
    if (this.seats.has(player.pid)) return;
    const taken = new Set([...this.seats.values()].map((v) => `${v.x}:${v.y}`));
    const free = OTHER_SEATS.find(([r, x]) => !taken.has(`${x}:${ROWS[r].y}`));
    if (!free) return;
    const v = this.makeSeatedKid(player, free[0], free[1]);
    this.seats.set(player.pid, v);
  }

  onLateJoin(player) {
    const role = this.A.host.roles[player.pid];
    if (role === 'perdavejas') {
      const i = this.pathKids.findIndex((k, j) => j > 0 && !k);
      if (i > 0) {
        const [r, x] = PATH_SEATS[i];
        const v = this.makeSeatedKid(player, r, x);
        v.path = i;
        this.pathKids[i] = v;
        this.seats.set(player.pid, v);
        return;
      }
    }
    if (role && role !== 'lenta') this.addOtherKid(player);
  }

  // ---------------- mokytoja ----------------
  makeTeacher() {
    const t = this.A.host.teachers()[0];
    this.teacherName = t ? t.name : 'Mokytoja';
    const box = this.add.container(TEACHER.x, TEACHER.y).setScale(TEACHER.s).setDepth(TEACHER.y + 40);
    const body = this.add.image(0, 0, 'teacher_back').setOrigin(0.5, 1);
    const faceKey = t && this.textures.exists(avatarKey(t.name)) ? avatarKey(t.name) : 'teacher_face';
    const face = this.add.image(0, -290, faceKey).setDisplaySize(104, 104).setVisible(false);
    const hair = this.add.image(0, -292, 'teacher_hair').setTint(0x8a5a33).setScale(0.95);
    const tag = bodyText(this, 0, -372, this.teacherName, 28, C.yellow);
    box.add([body, face, hair, tag]);
    this.teacher = { box, body, face, hair, state: 'writing', since: 0, until: 0, extra: 0, avatarKey: t ? avatarKey(t.name) : null };
    if (t) {
      const onTex = (k) => {
        if (k === this.teacher.avatarKey && face.active) face.setTexture(k).setDisplaySize(104, 104);
      };
      this.textures.on('addtexture', onTex);
      this.events.once('shutdown', () => this.textures.off('addtexture', onTex));
    }
    this.bubble = null;
  }

  teacherSay(text, color = C.white, ms = 1300) {
    if (this.bubble) this.bubble.destroy();
    const t = this.teacher;
    const b = bodyText(this, t.box.x - 110, t.box.y - 470, text, 30, color, { wordWrap: { width: 360 } }).setDepth(1500);
    b.setScale(0.4);
    this.tweens.add({ targets: b, scale: 1, duration: 180, ease: 'Back.Out' });
    this.tweens.add({ targets: b, alpha: 0, delay: ms, duration: 250, onComplete: () => { if (this.bubble === b) this.bubble = null; b.destroy(); } });
    this.bubble = b;
  }

  teacherWrite() {
    const t = this.teacher;
    t.state = 'writing';
    t.since = this.time.now;
    t.until = this.time.now + rand(WRITE[0], WRITE[1]) * 1000;
    t.extra = 0;
    t.body.setTexture('teacher_back');
    t.face.setVisible(false);
    t.hair.setVisible(true).setX(0);
    this.stateText.setText('Mokytoja rašo').setColor(C.green);
  }

  teacherWarn(ms = WARN * 1000) {
    const t = this.teacher;
    if (t.state !== 'writing') return;
    t.state = 'warning';
    t.since = this.time.now;
    t.until = this.time.now + ms;
    t.hair.setX(-10);
    this.teacherSay(this.A.lines.pick('pamoka', 'warn'), C.yellow, ms);
    this.stateText.setText('HMM?').setColor(C.orange);
    this.tweens.add({ targets: this.stateText, scale: 1.25, yoyo: true, duration: 120 });
    this.A.sfx.pop();
  }

  teacherFace() {
    const t = this.teacher;
    this.boost = 0;
    t.state = 'facing';
    t.since = this.time.now;
    t.until = this.time.now + rand(FACE[0], FACE[1]) * 1000;
    t.body.setTexture('teacher_body');
    t.face.setVisible(true);
    t.hair.setVisible(false);
    this.stateText.setText('ŽIŪRI!').setColor(C.red);
    this.tweens.add({ targets: t.box, scaleX: TEACHER.s * 0.9, yoyo: true, duration: 90 });
  }

  // ---------------- atvirukas ----------------
  makeCard() {
    const n = this.nodes[0];
    this.cardImg = this.add.image(n.x, n.y, 'xmas_card').setDepth(1200).setScale(0.8);
    this.cover = this.add.image(n.x, n.y - 4, 'book').setDepth(1201).setScale(0.9).setTint(0x2de2e6).setVisible(false);
  }

  cardXY(c) {
    const i = Math.min(this.nodes.length - 2, Math.floor(c));
    const f = Phaser.Math.Clamp(c - i, 0, 1);
    const a = this.nodes[i];
    const b = this.nodes[i + 1];
    return {
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f - Math.sin(f * Math.PI) * 50,
      s: (a.s + (b.s - a.s) * f) * 1.1,
    };
  }

  nodeKid() {
    const i = Math.round(this.c);
    return this.pathKids[i] || null;
  }

  caughtNow() {
    this.caught += 1;
    this.freezeUntil = this.time.now + FREEZE_MS;
    this.boost = 0;
    const kid = this.nodeKid();
    const who = kid ? kid.name : 'Adriana';
    const from = this.cardXY(this.c);
    const t = headText(this, from.x, from.y - 70, 'PAGAVO!', 80, C.red).setDepth(1600).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 40, delay: 900, duration: 300, onComplete: () => t.destroy() });
    this.A.sfx.boo();
    this.cameras.main.shake(220, 0.006);
    this.teacherSay(this.A.lines.pick('pamoka', 'caught', { vardas: who }), C.red, 1600);
    this.maybeSub(this.A.lines.pick('pamoka', 'caught', { vardas: who }), C.red, 0);
    const back = Math.max(0, Math.floor(this.c) - CAUGHT_BACK);
    this.tweens.addCounter({
      from: this.c, to: back, duration: 600, ease: 'Quad.InOut',
      onUpdate: (tw) => { this.c = tw.getValue(); },
    });
  }

  // ---------------- klasiokų veiksmai ----------------
  stat(player, key) {
    const st = this.stats.get(player.pid) || { name: player.name, counts: {} };
    st.counts[key] = (st.counts[key] || 0) + 1;
    this.stats.set(player.pid, st);
  }

  kidBubble(v, text, color = C.white, size = 28) {
    const t = bodyText(this, v.x, v.y - 200 * v.s - 20, text, size, color).setDepth(1500).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, y: t.y - 20, duration: 200, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, delay: 1100, duration: 300, onComplete: () => t.destroy() });
  }

  wiggle(v, angle = 10) {
    this.tweens.add({ targets: v.box, angle: { from: -angle, to: angle }, yoyo: true, repeat: 1, duration: 90, onComplete: () => v.box.setAngle(0) });
  }

  maybeSub(text, color = C.white, gap = 2600) {
    if (!text || this.time.now - this.lastSub < gap) return;
    this.lastSub = this.time.now;
    this.sub(text, color);
  }

  // subtitrai ir juostos virš suolų (šioje scenoje daug sluoksnių)
  sub(text, color) {
    subtitle(this, text, { color });
    if (this._subtitle) this._subtitle.setDepth(1700);
  }

  bigBanner(title, sub, opts) {
    banner(this, title, sub, opts).setDepth(1900);
  }

  onPress({ player, action, role }) {
    this.stat(player, action);
    this.tribune.bounce(player.pid);
    if (this.mode !== 'play' && this.mode !== 'end') return;
    const v = this.seats.get(player.pid);
    if (role === 'lenta') return this.teacherAction(player, action);
    switch (action) {
      case 'perduoti': return this.passCard(player, v);
      case 'slepti': return this.hideCard(player, v);
      case 'klausti': return this.ask(player, v);
      case 'ranka': if (v) { this.tweens.add({ targets: v.box, y: v.y - 14, yoyo: true, duration: 140 }); this.kidBubble(v, 'Aš! Aš!', C.yellow); } return undefined;
      case 'rasyti': return this.diligent(player, v);
      case 'ziovauti': if (v) { this.kidBubble(v, 'Aaaa...', '#d9c8ff'); this.tweens.add({ targets: v.box, scaleY: v.s * 1.08, yoyo: true, duration: 400 }); } return undefined;
      case 'ciaudeti': return this.sneeze(player, v);
      case 'penalas': return this.dropCase(player, v);
      default: return undefined;
    }
  }

  // Ar atvirukas dabar prie šio perdavėjo suolo?
  atKid(v) {
    return v && v.path && Math.abs(this.c - v.path) < 0.55;
  }

  passCard(player, v) {
    // perduoti galima tik kol mokytoja rašo (kitaip vaikas tik sukruta - „ne dabar“)
    if (!this.atKid(v) || this.mode !== 'play' || this.time.now < this.freezeUntil || this.teacher.state !== 'writing') {
      if (v) this.wiggle(v, 6);
      return;
    }
    this.boost = Math.max(this.boost, BOOST);
    this.passes += 1;
    this.stat(player, 'perdavimai');
    this.hiddenUntil = 0;
    this.wiggle(v, 14);
    this.kidBubble(v, 'Op!', C.green);
    if (Math.random() < 0.4) this.maybeSub(this.A.lines.pick('pamoka', 'pass', { vardas: player.name }), C.green, 3000);
  }

  hideCard(player, v) {
    if (!this.atKid(v) || this.mode !== 'play') {
      if (v) this.wiggle(v, 6);
      return;
    }
    this.hiddenUntil = this.time.now + HIDE_MS;
    this.hiddenBy = player.name;
    this.hides += 1;
    this.stat(player, 'slepe');
    this.kidBubble(v, 'Ššš...', C.teal);
    this.maybeSub(this.A.lines.pick('pamoka', 'hide', { vardas: player.name }), C.teal, 2500);
  }

  ask(player, v) {
    if (v) {
      this.tweens.add({ targets: v.box, y: v.y - 18, yoyo: true, duration: 160 });
      this.kidBubble(v, 'Mokytoja!', C.orange, 30);
    }
    const now = this.time.now;
    const t = this.teacher;
    if (now - this.lastQuestion < QUESTION_GAP || t.state !== 'writing' || now - t.since < CALM_MS) return;
    this.lastQuestion = now;
    this.questions += 1;
    this.stat(player, 'klausimai');
    this.maybeSub(this.A.lines.pick('pamoka', 'question', { vardas: player.name }), C.orange, 0);
    this.teacherWarn(550);
  }

  diligent(player, v) {
    if (v) this.tweens.add({ targets: v.box, angle: { from: -4, to: 4 }, yoyo: true, repeat: 3, duration: 60, onComplete: () => v.box.setAngle(0) });
    const t = this.teacher;
    const now = this.time.now;
    if (t.state !== 'writing' || now - this.lastDiligent < 1000 || t.extra >= DILIGENT_MAX) return;
    this.lastDiligent = now;
    t.extra += DILIGENT_ADD;
    t.until += DILIGENT_ADD * 1000;
    this.stat(player, 'uolumas');
    if (v) this.kidBubble(v, '✎ ✎ ✎', C.green, 24);
    if (Math.random() < 0.25) this.maybeSub(this.A.lines.pick('pamoka', 'diligent', { vardas: player.name }), C.green, 4000);
  }

  sneeze(player, v) {
    this.A.sfx.splat();
    if (v) {
      this.kidBubble(v, 'APČIHI!', C.white, 34);
      this.tweens.add({ targets: v.box, angle: 14, yoyo: true, duration: 120 });
    }
    if (Math.random() < 0.3) this.maybeSub(this.A.lines.pick('pamoka', 'sneeze'), C.white, 4000);
  }

  dropCase(player, v) {
    this.A.sfx.thud();
    const x = v ? v.x + rand(-30, 30) : rand(300, 1100);
    const y0 = v ? v.y : 700;
    const pc = this.add.image(x, y0 - 10, 'pencil_case').setDepth(1100).setScale(v ? v.s * 1.2 : 0.9);
    this.tweens.add({ targets: pc, y: Math.min(1000, y0 + 120), angle: rand(-60, 60), duration: 450, ease: 'Bounce.Out' });
    this.tweens.add({ targets: pc, alpha: 0, delay: 1800, duration: 400, onComplete: () => pc.destroy() });
    if (v) this.kidBubble(v, 'Bum!', C.white);
    if (Math.random() < 0.3) this.maybeSub(this.A.lines.pick('pamoka', 'drop'), C.white, 4000);
  }

  teacherAction(player, action) {
    if (this.mode !== 'play') return;
    if (action === 'atsisukti') {
      if (this.teacher.state === 'writing' && this.time.now - this.teacher.since > CALM_MS) {
        this.stat(player, 'atsisuko');
        this.maybeSub(this.A.lines.pick('pamoka', 'teacher_turn', { vardas: player.name }), C.orange, 1500);
        this.teacherWarn(450);
      }
    } else if (action === 'rasyti' && this.teacher.state === 'facing') {
      this.teacherWrite();
      this.maybeSub(this.A.lines.pick('pamoka', 'keep_writing'), C.green, 1500);
    }
  }

  // ---------------- HUD ----------------
  makeHud() {
    const D = 1800;
    headText(this, 40, 54, STAGE.mission, 46, C.yellow).setOrigin(0, 0.5).setDepth(D);
    this.caughtText = bodyText(this, 40, 112, 'Pagavo: 0', 26, '#f1e6ff').setOrigin(0, 0.5).setDepth(D);
    this.timerText = headText(this, 960, 70, `0:${TIME_LIMIT}`, 92, C.white).setDepth(D);
    // atviruko kelias (suolai)
    const n = this.nodes.length;
    const w = 560;
    this.dots = [];
    for (let i = 0; i < n; i++) {
      const x = 960 - w / 2 + (w * i) / (n - 1);
      this.dots.push(this.add.circle(x, 140, i === n - 1 ? 13 : 9, 0x0b0418, 0.8).setStrokeStyle(3, 0xffd23f).setDepth(D));
    }
    this.add.rectangle(960, 140, w, 4, 0xffd23f, 0.5).setDepth(D - 1);
    this.cardIcon = this.add.image(960 - w / 2, 136, 'xmas_card').setScale(0.5).setDepth(D + 1);
    this.dotsW = w;
    this.stateText = headText(this, 960, 210, 'Mokytoja rašo', 40, C.green).setDepth(D);
    // klavišo užuomina prie Adrianos
    const n0 = this.nodes[0];
    this.keyHint = this.add.container(n0.x + 150, n0.y - 20).setDepth(D);
    const bgk = this.add.rectangle(0, 0, 90, 64, 0xff3ea5, 0.95).setStrokeStyle(5, 0xffd23f);
    const tx = headText(this, 0, -2, '→', 46, C.white, { strokeThickness: 0 });
    tx.setShadow(0, 0, 'rgba(0,0,0,0)');
    const lab = bodyText(this, 0, 48, 'LAIKYK', 20, C.yellow);
    this.keyHint.add([bgk, tx, lab]);
    this.keyBg = bgk;
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
      if (!this.saidTen && s >= 9) { this.saidTen = true; this.maybeSub(this.A.lines.pick('pamoka', 'ten'), C.red, 0); }
    }
    const f = this.c / (this.nodes.length - 1);
    this.cardIcon.x = 960 - this.dotsW / 2 + this.dotsW * f;
    this.dots.forEach((d, i) => d.setFillStyle(i <= this.c + 0.01 ? 0xffd23f : 0x0b0418, i <= this.c + 0.01 ? 1 : 0.8));
    this.caughtText.setText(`Pagavo: ${this.caught}`);
  }

  // ---------------- pabaiga ----------------
  win() {
    this.mode = 'end';
    this.keyHint.setVisible(false);
    // mokytoja atsisuka ir randa atviruką
    this.time.delayedCall(500, () => {
      this.teacherFace();
      this.stateText.setText('AČIŪ!').setColor(C.yellow);
      this.teacherSay('AČIŪ! Linksmų Kalėdų!', C.yellow, 2600);
      for (let i = 0; i < 8; i++) {
        const h = bodyText(this, TEACHER.x + rand(-80, 80), TEACHER.y - 340 + rand(-40, 40), '❤', rand(30, 50), C.pink).setDepth(1500);
        this.tweens.add({ targets: h, y: h.y - rand(80, 160), alpha: 0, delay: i * 90, duration: 1200, onComplete: () => h.destroy() });
      }
    });
    this.A.sfx.win();
    this.bigBanner('MISIJA ĮVYKDYTA!', '+100 RESPEKTO', { color: C.yellow, hold: 2800 });
    this.time.delayedCall(1300, () => this.sub(this.A.lines.pick('pamoka', 'success'), C.yellow));
    this.time.delayedCall(3600, () => this.showResult(true));
  }

  fail() {
    this.mode = 'end';
    this.keyHint.setVisible(false);
    this.A.sfx.schoolBell();
    this.time.delayedCall(600, () => this.A.sfx.fail());
    this.bigBanner('PAMOKA BAIGĖSI', 'ATVIRUKAS - PO PAMOKŲ', { color: C.red, hold: 2600 });
    this.time.delayedCall(1000, () => this.sub(this.A.lines.pick('pamoka', 'fail'), C.orange));
    this.time.delayedCall(3400, () => this.showResult(false));
  }

  showResult(ok) {
    this.mode = 'result';
    this.A.host.setPhase('result', STAGE);
    const box = this.add.container(960, 500).setDepth(1950).setAlpha(0);
    box.add(this.add.rectangle(0, 0, 1240, 600, 0x0b0418, 0.9).setStrokeStyle(6, ok ? 0xffd23f : 0xff4d5e));
    box.add(headText(this, 0, -235, ok ? 'ATVIRUKAS PAS MOKYTOJĄ!' : 'BEVEIK!', 72, ok ? C.yellow : C.orange));
    const all = [...this.stats.values()];
    const best = (k) => all.map((x) => [x, x.counts[k] || 0]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
    const steps = this.nodes.length - 1;
    const rows = [
      [`Laikas: ${this.elapsed.toFixed(1).replace('.', ',')} s   ·   Atvirukas: ${Math.floor(this.c)}/${steps}   ·   Pagavo: ${this.caught} k.`, C.white],
      [`Perdavimai: ${this.passes}   ·   Paslėpta: ${this.hides}   ·   Klausimai: ${this.questions}`, C.white],
    ];
    const passer = best('perdavimai');
    if (passer) rows.push([`Greičiausias perdavėjas: ${passer[0].name} (${passer[1]})`, C.green]);
    const asker = best('klausimai');
    if (asker) rows.push([`Didžiausias smalsuolis: ${asker[0].name} (${asker[1]})`, C.orange]);
    const writer = best('uolumas');
    if (writer) rows.push([`Uoliausias mokinys: ${writer[0].name}`, C.teal]);
    const sneezer = best('ciaudeti');
    if (sneezer) rows.push([`Garsiausiai čiaudėjo: ${sneezer[0].name}`, C.white]);
    rows.slice(0, 6).forEach(([r, c], i) => box.add(bodyText(this, 0, -140 + i * 54, r, 30, c)));
    const next = headText(this, 0, 240, 'ENTER - TOLIAU', 48, C.white);
    this.tweens.add({ targets: next, alpha: 0.3, yoyo: true, repeat: -1, duration: 650 });
    box.add(next);
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
  }

  // ---------------- ciklas ----------------
  update(_, deltaMs) {
    const dt = Math.min(deltaMs, 66) / 1000;
    const now = this.time.now;
    const play = this.mode === 'play';
    const t = this.teacher;

    if (play) {
      this.timeLeft -= dt;
      this.elapsed += dt;
      // mokytojos ciklas: rašo -> „Hmm?“ -> žiūri -> vėl rašo
      if (t.state === 'writing' && now >= t.until) this.teacherWarn();
      else if (t.state === 'warning' && now >= t.until) this.teacherFace();
      else if (t.state === 'facing' && now >= t.until) this.teacherWrite();
    }

    // lenta: kol rašo - atsiranda raidės
    if (t.state === 'writing' && this.mode !== 'result') {
      this.boardT += dt;
      const full = BOARD_LINES.join('\n');
      if (this.boardT > 0.11) {
        this.boardT = 0;
        this.boardChars = this.boardChars >= full.length + 12 ? 0 : this.boardChars + 1;
        this.boardText.setText(full.slice(0, this.boardChars));
        t.body.y = Math.sin(now / 60) * 2;
      }
    }

    // atvirukas
    const hidden = now < this.hiddenUntil && this.nodeKid() && Math.abs(this.c - Math.round(this.c)) < 0.55;
    const frozen = now < this.freezeUntil;
    const prev = this.c;
    if (play && !hidden && !frozen) {
      if (this.holding()) this.c += CARD_SPEED * dt;
      if (this.boost > 0) {
        const step = Math.min(this.boost, dt * 2.5);
        this.c += step;
        this.boost -= step;
      }
      this.c = Math.min(this.c, this.nodes.length - 1);
    }
    const moving = this.c - prev > 0.0005;
    if (play && moving && t.state === 'facing') this.caughtNow();

    const p = this.cardXY(this.c);
    this.cardImg.setPosition(p.x, p.y).setScale(0.8 * p.s);
    this.cardImg.angle = moving ? Math.sin(now / 50) * 10 : 0;
    this.cover.setVisible(!!hidden).setPosition(p.x, p.y - 6).setScale(0.9 * p.s);
    this.keyBg.setFillStyle(this.holding() && play ? 0x3ddc84 : 0xff3ea5, 0.95);

    // perdavėjui telefone: „ATVIRUKAS PAS TAVE!“
    const node = Math.round(this.c);
    if (node !== this.lastNode) {
      this.lastNode = node;
      const kid = this.pathKids[node];
      if (kid && play) {
        this.A.host.cue(kid.pid, 'ATVIRUKAS PAS TAVE! Perduok arba paslėpk!');
        this.tweens.add({ targets: kid.box, y: kid.y - 10, yoyo: true, duration: 140 });
      }
      if (node === this.nodes.length - 2 && !this.saidNear) {
        this.saidNear = true;
        this.maybeSub(this.A.lines.pick('pamoka', 'near'), C.yellow, 1000);
      }
    }

    this.updateHud();
    if (play) {
      if (this.c >= this.nodes.length - 1) this.win();
      else if (this.timeLeft <= 0) this.fail();
    }
  }
}
