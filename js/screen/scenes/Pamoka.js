// 3 etapas: Kai mokytoja nusisuka.
//
// Klasė slapta perduoda kalėdinį atviruką mokytojai. Atvirukas keliauja per visus
// prisijungusius vaikus atsitiktine tvarka (be pasikartojimų), paskutinė jį gauna mokytoja.
// Pas ką atvirukas - tas vaikas paryškintas ekrane ir gauna žinutę telefone; jis spaudžia
// „Perduoti“. Adriana pradeda (→ arba TARPAS) ir gali padėti, jei kas užsižiopsojo.
// Mokytoja rašo lentoje, kartais sustoja („Hmm?“) ir atsisuka. Jei tada atvirukas
// skrenda - PAGAVO, atvirukas grįžta vienu vaiku atgal. Laiko riba nėra - misija baigiasi,
// kai atvirukas pasiekia mokytoją (laikas tik skaičiuojamas).
// Kiekvienas vaikas turi „Perduoti“ ir vieną savo mygtuką:
//  - paklausti mokytojos (ji iškart atsisuka!), valgyti mandariną, dainuoti, šnabždėti,
//    čiaudėti, numesti penalą, žiovauti, kelti ranką (fonas);
//  - mokytoja: atsisukti (bando pagauti), rašyti toliau.

import { headText, bodyText, banner, subtitle, missionCard, C } from '../fx.js';
import { Tribune, avatarKey } from '../tribune.js';
import { STAGES } from '../stages.js';
import { BOARD } from '../art-class.js';
import { isBoy, GIRL_COLORS, BOY_COLORS, shuffle, teacherLabel } from '../../common.js';

const STAGE = STAGES.pamoka;
const CAUGHT_BACK = 1;
const FREEZE_MS = 1200;
const HELP_MS = 3000; // tiek palaukus Adriana gali perduoti už užsižiopsojusį
const WRITE = [3.5, 6.0]; // kiek sekundžių rašo lentoje
const WARN = 0.8; // „Hmm?“ prieš atsisukant
const FACE = [1.2, 2.0]; // kiek žiūri į klasę
const CALM_MS = 1500; // ką tik pradėjusios rašyti mokytojos neatsuksi
const QUESTION_GAP = 9000;

// Suolų eilės: y - suolo viršus, s - mastelis (toliau - mažesni).
const ROWS = {
  B: { y: 520, s: 0.56 },
  M: { y: 690, s: 0.66 },
  F: { y: 862, s: 0.78 },
};
const ADRIANA_SEAT = ['M', 190];
// Vaikų vietos: pirmiau arčiau esančios.
const SEATS = [
  ['F', 347], ['F', 661], ['M', 504], ['M', 819], ['F', 504], ['F', 819], ['M', 347], ['M', 661],
  ['F', 190], ['F', 976], ['M', 976], ['M', 1133],
  ['B', 150], ['B', 330], ['B', 510], ['B', 690], ['B', 870], ['B', 1050],
];
const TEACHER_DESK = { x: 1330, y: 770 };
const CARD_END = { x: 1320, y: 632 };
const TEACHER = { x: 1650, y: 670, s: 1.0 };
const BOARD_LINES = ['PAMOKA', 'log₂(x³ - 7x) = ∫ sin²θ dθ', 'Σ 1/n² = π²/6', 'lim (1 + 1/n)ⁿ = e', '∂²u/∂t² = c²·∇²u'];

const rand = (a, b) => a + Math.random() * (b - a);
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
    A.host.lock('perduoti', null); // „Perduoti“ aktyvus tik tam, pas kurį atvirukas

    // Phaser naudoja tą patį scenos objektą, todėl visą būseną nustatom iš naujo.
    this.seq = []; // atviruko kelias: Adriana, vaikai atsitiktine tvarka, mokytoja
    this.idx = 0; // pas ką dabar atvirukas
    this.flight = null; // { from, to, t, dur }
    this.holderSince = 0;
    this.freezeUntil = 0;
    this.caught = 0;
    this.caughtWho = new Map();
    this.questions = 0;
    this.helps = 0;
    this.lastQuestion = -99999;
    this.elapsed = 0;
    this.lastSub = 0;
    this.stats = new Map();
    this.seats = new Map(); // pid -> sėdintis vaikas
    this.autoplay = !!this.autoplay;
    this.autoT = 0;
    this.boardChars = 0;
    this.boardT = 0;
    this.botWait = 0;

    this.add.image(960, 540, 'class_room').setDepth(-100);
    this.add.image(BOARD.x + BOARD.w / 2, BOARD.y + BOARD.h / 2, 'chalkboard').setDepth(-90);
    this.boardText = bodyText(this, BOARD.x + 36, BOARD.y + 34, '', 27, '#f4f7ff', {
      align: 'left', strokeThickness: 0, lineSpacing: 10, fontStyle: 'bold',
    }).setOrigin(0, 0).setDepth(-89);

    this.makeDesks();
    this.placeKids();
    this.makeTeacher();
    this.makeHud();
    this.buildSeq();
    this.makeCard();
    this.teacherWrite();

    this.tribune = new Tribune(this, A.host, { y: 1006, maxSize: 64 });
    this.card = missionCard(this, {
      nr: STAGE.nr,
      mission: STAGE.mission,
      title: STAGE.title,
      tip: A.lines.pick('pamoka', 'intro'),
      controls: 'Visi: kai atvirukas pas tave - PERDUOTI, kol mokytoja rašo.   Adriana: → arba TARPAS',
    });
    this.card.setDepth(1900); // virš suolų ir HUD

    const kb = this.input.keyboard;
    kb.on('keydown-ENTER', () => this.onEnter());
    kb.on('keydown-SPACE', () => (this.mode === 'intro' ? this.onEnter() : this.adrianaPass()));
    kb.on('keydown-RIGHT', () => this.adrianaPass());
    kb.on('keydown-D', () => this.adrianaPass());
    kb.on('keydown-R', () => this.scene.restart());

    const offs = [
      A.host.on('press', (e) => this.onPress(e)),
      A.host.on('join', (p) => this.onLateJoin(p)),
    ];
    // Virtualūs vaikai dažniausiai perduoda tik tada, kai mokytoja rašo (kartais suklysta).
    A.host.botFilter = (p, btn) => btn !== 'perduoti'
      || (this.seq[this.idx]?.pid === p.pid && (this.teacher.state === 'writing' || Math.random() < 0.1));
    // Virtualus vaikas, pas kurį atvirukas, perduoda po 0,8-2 s, kai mokytoja rašo.
    A.host.botPick = (p) => {
      const h = this.seq[this.idx];
      if (!h || h.pid !== p.pid || this.flight || this.teacher.state !== 'writing') return null;
      if (!this.botWait) this.botWait = rand(800, 2000);
      if (this.time.now - this.holderSince < this.botWait) return null;
      this.botWait = 0;
      return 'perduoti';
    };
    this.events.once('shutdown', () => {
      offs.forEach((f) => f());
      A.host.botFilter = null;
      A.host.botPick = null;
      A.host.lock('perduoti', undefined, false);
      A.host.setStatus(null);
    });
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
    this.holderSince = this.time.now;
    this.highlightHolder();
    this.sub(this.A.lines.pick('pamoka', 'start'), C.yellow);
  }

  // Adriana: perduoda, kai atvirukas pas ją, arba padeda užsižiopsojusiam.
  adrianaPass() {
    if (this.mode !== 'play' || this.flight) return;
    const h = this.seq[this.idx];
    if (!h || h.type === 'teacher') return;
    if (h.type === 'adriana') { this.pass('Adriana'); return; }
    if (this.time.now - this.holderSince >= HELP_MS) {
      this.helps += 1;
      this.maybeSub(this.A.lines.pick('pamoka', 'help', { vardas: h.name }), C.teal, 0);
      this.pass('Adriana');
    }
  }

  // ---------------- klasė ----------------
  makeDesks() {
    const desk = (r, x) => {
      const row = ROWS[r];
      this.add.image(x, row.y, 'desk').setOrigin(0.5, 0.1).setScale(row.s * 1.1).setDepth(row.y + 1);
    };
    for (const [r, x] of [ADRIANA_SEAT, ...SEATS]) desk(r, x);
    this.add.image(TEACHER_DESK.x, TEACHER_DESK.y, 'teacher_desk').setOrigin(0.5, 1).setDepth(TEACHER_DESK.y);
    // Adriana
    const [r, x] = ADRIANA_SEAT;
    const row = ROWS[r];
    const box = this.add.container(x, row.y).setScale(row.s * 1.1).setDepth(row.y);
    // kuprinė stovi ant grindų prie suolo
    this.add.image(x - 108, row.y + 84 * row.s * 1.1, 'backpack_big').setOrigin(0.5, 1).setScale(row.s * 0.7).setDepth(row.y + 2);
    const body = this.add.image(0, 70, 'adr_sit').setOrigin(0.5, 1);
    const face = this.textures.exists('adr_face');
    const head = this.add.image(4, -130, face ? 'adr_face' : 'adr_head').setOrigin(0.5, face ? 0.5 : 0.56);
    if (face) head.setDisplaySize(124, 124);
    box.add([body, head]);
    this.namePlate(x, row, 'Adriana', C.pink);
    this.adr = { box, x, y: row.y, s: row.s * 1.1, name: 'Adriana' };
  }

  // Vardo kortelė ant savo suolo priekio (ne virš galvos - kad nepatektų ant kito suolo).
  namePlate(x, row, name, color) {
    const k = row.s * 1.1;
    return bodyText(this, x, row.y + 36 * k, name, Math.round(31 * row.s), color).setDepth(row.y + 3);
  }

  makeSeatedKid(player, r, x) {
    const row = ROWS[r];
    const box = this.add.container(x, row.y).setScale(row.s).setDepth(row.y);
    const body = this.add.image(0, 64, 'kid_body').setOrigin(0.5, 1).setTint(tintOf(player.name));
    const key = this.textures.exists(avatarKey(player.name)) ? avatarKey(player.name) : 'dot';
    const head = this.add.image(0, -110, key).setDisplaySize(96, 96);
    box.add([body, head]);
    const tag = this.namePlate(x, row, player.name, C.yellow);
    return { box, body, head, tag, name: player.name, pid: player.pid, x, y: row.y, s: row.s };
  }

  placeKids() {
    const host = this.A.host;
    for (const p of host.list()) {
      if (!host.isTeacher(p.name)) this.addKid(p);
    }
  }

  addKid(player) {
    if (this.seats.has(player.pid)) return null;
    const taken = new Set([...this.seats.values()].map((v) => `${v.x}:${v.y}`));
    const free = SEATS.find(([r, x]) => !taken.has(`${x}:${ROWS[r].y}`));
    if (!free) return null;
    const v = this.makeSeatedKid(player, free[0], free[1]);
    this.seats.set(player.pid, v);
    return v;
  }

  onLateJoin(player) {
    if (this.A.host.isTeacher(player.name)) return;
    const v = this.addKid(player);
    if (!v) return;
    // vėliau atėjęs vaikas įterpiamas į dar nepraeitą kelio dalį (prieš mokytoją)
    const at = this.idx + 1 + Math.floor(Math.random() * Math.max(1, this.seq.length - 1 - (this.idx + 1)));
    this.seq.splice(Math.min(at, this.seq.length - 1), 0, { type: 'kid', ...this.kidPoint(v) });
    this.updateHud();
  }

  kidPoint(v) {
    return { pid: v.pid, name: v.name, v, x: v.x, y: v.y - 16 * v.s, s: v.s };
  }

  // Atsitiktinė tvarka be pasikartojimų: Adriana -> visi vaikai -> mokytoja.
  buildSeq() {
    const kids = shuffle([...this.seats.values()]).map((v) => ({ type: 'kid', ...this.kidPoint(v) }));
    this.seq = [
      { type: 'adriana', name: 'Adriana', x: this.adr.x, y: this.adr.y - 16 * ROWS.M.s, s: ROWS.M.s },
      ...kids,
      { type: 'teacher', name: this.teacherName, x: CARD_END.x, y: CARD_END.y, s: 1 },
    ];
    this.idx = 0;
  }

  // ---------------- mokytoja ----------------
  makeTeacher() {
    const t = this.A.host.teachers()[0];
    this.teacherName = t ? t.name : 'Daiva';
    const box = this.add.container(TEACHER.x, TEACHER.y).setScale(TEACHER.s).setDepth(TEACHER.y + 40);
    const body = this.add.image(0, 0, 'teacher_back').setOrigin(0.5, 1);
    const faceKey = t && this.textures.exists(avatarKey(t.name)) ? avatarKey(t.name) : 'teacher_face';
    const face = this.add.image(0, -290, faceKey).setDisplaySize(104, 104).setVisible(false);
    const hair = this.add.image(0, -292, 'teacher_hair').setTint(0x8a5a33).setScale(0.95);
    const tag = bodyText(this, 0, 26, teacherLabel(this.teacherName), 28, C.yellow); // po kojomis - kad neuždengtų lentos
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
    const b = bodyText(this, t.box.x - 110, t.box.y - 470, text, 30, color, { wordWrap: { width: 360 }, backgroundColor: 'rgba(20,8,31,.85)', padding: { x: 14, y: 8 } }).setDepth(1500);
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
    if (this.stateText) this.stateText.setText('Mokytoja rašo - perduok!').setColor(C.green);
    if (this.seq) this.updateStatus();
  }

  teacherWarn(ms = WARN * 1000) {
    const t = this.teacher;
    if (t.state !== 'writing') return;
    t.state = 'warning';
    t.since = this.time.now;
    t.until = this.time.now + ms;
    t.hair.setX(-10);
    this.teacherSay(this.A.lines.pick('pamoka', 'warn'), C.yellow, ms);
    this.stateText.setText('HMM? NEPERDUOK!').setColor(C.orange);
    this.tweens.add({ targets: this.stateText, scale: 1.25, yoyo: true, duration: 120 });
    this.A.sfx.pop();
    this.updateStatus();
  }

  teacherFace() {
    const t = this.teacher;
    t.state = 'facing';
    t.since = this.time.now;
    t.until = this.time.now + rand(FACE[0], FACE[1]) * 1000;
    t.body.setTexture('teacher_body');
    t.face.setVisible(true);
    t.hair.setVisible(false);
    this.stateText.setText('ŽIŪRI!').setColor(C.red);
    this.tweens.add({ targets: t.box, scaleX: TEACHER.s * 0.9, yoyo: true, duration: 90 });
    this.updateStatus();
  }

  // ---------------- atvirukas ----------------
  makeCard() {
    const h = this.seq[0];
    this.cardImg = this.add.image(h.x, h.y, 'xmas_card').setDepth(1200).setScale(0.8 * h.s * 1.1);
    this.ring = this.add.ellipse(h.x, h.y + 10, 160, 50, 0x3ddc84, 0.35).setDepth(1150).setStrokeStyle(4, 0x3ddc84);
    this.tweens.add({ targets: this.ring, alpha: 0.15, yoyo: true, repeat: -1, duration: 400 });
    // Žinutės viršuje po mokytojos būsena: kas turi atviruką ir ar reikia Adrianos pagalbos.
    this.holderTag = headText(this, 960, 264, '', 40, C.green).setDepth(1800).setVisible(false);
    this.helpTag = headText(this, 960, 316, '', 32, C.teal).setDepth(1800).setVisible(false);
    this.tweens.add({ targets: this.helpTag, alpha: 0.45, yoyo: true, repeat: -1, duration: 420 });
  }

  holderPos(i) {
    const h = this.seq[i];
    return h ? { x: h.x, y: h.y, s: h.s * 1.1 } : { x: CARD_END.x, y: CARD_END.y, s: 1 };
  }

  highlightHolder() {
    const h = this.seq[this.idx];
    if (!h) return;
    const p = this.holderPos(this.idx);
    const last = h.type === 'teacher';
    this.ring.setPosition(p.x, p.y + 12).setSize(170 * p.s, 54 * p.s).setVisible(!last);
    this.holderTag.setText(h.type === 'adriana' ? 'ADRIANA TURI ATVIRUKĄ! SPAUSK →' : `${h.name.toUpperCase()} TURI ATVIRUKĄ!`).setVisible(!last);
    this.helpTag.setVisible(false);
    this.updateStatus();
    if (h.type === 'kid' && this.mode === 'play') {
      this.tweens.add({ targets: h.v.box, y: h.v.y - 12, yoyo: true, duration: 140 });
      this.stat(h, 'gavo');
    }
  }

  // Telefonų viršuje nuolatinė žinutė: turėtojui - žalia „Greičiau perduok!“ arba
  // raudona „Mokytoja žiūri - lauk!“; kitiems - raudona, kai mokytoja žiūri.
  // Kartu užrakinamas „Perduoti“ visiems, išskyrus turėtoją.
  updateStatus() {
    const host = this.A.host;
    if (this.mode !== 'play') {
      host.lock('perduoti', null, false);
      host.setStatus(null);
      return;
    }
    const looking = this.teacher.state !== 'writing';
    const by = {};
    for (const t of host.teachers()) by[t.pid] = null;
    const h = this.seq[this.idx];
    const holder = h && h.type === 'kid' && !this.flight ? h.pid : null;
    if (holder) {
      by[holder] = looking
        ? { text: 'ATVIRUKAS PAS TAVE! Mokytoja žiūri - lauk!', tone: 'wait', holder: true }
        : { text: 'ATVIRUKAS PAS TAVE! Greičiau perduok!', tone: 'go', holder: true };
    }
    host.lock('perduoti', holder, false);
    host.setStatus(looking ? { text: 'Mokytoja žiūri!', tone: 'wait' } : null, by);
  }

  // Perdavimas iš dabartinio į kitą (atvirukas skrenda lanku).
  pass(byName) {
    if (this.flight || this.mode !== 'play' || this.time.now < this.freezeUntil) return;
    const from = this.idx;
    const to = Math.min(this.idx + 1, this.seq.length - 1);
    const a = this.holderPos(from);
    const b = this.holderPos(to);
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    this.flight = { from, to, t: 0, dur: 0.35 + dist / 2500, by: byName, reaction: this.time.now - this.holderSince };
    this.ring.setVisible(false);
    this.holderTag.setVisible(false);
    this.helpTag.setVisible(false);
    this.updateStatus();
    this.A.sfx.throw();
    // perduoti, kai mokytoja jau žiūri - iškart pagauna
    if (this.teacher.state === 'facing') this.caughtNow();
  }

  landed() {
    const f = this.flight;
    this.flight = null;
    this.idx = f.to;
    this.holderSince = this.time.now;
    const h = this.seq[f.from];
    if (h && h.type === 'kid') {
      const st = this.stat(h, 'perdavimai');
      st.best = Math.min(st.best ?? 1e9, f.reaction);
    }
    this.A.sfx.pop();
    if (this.idx >= this.seq.length - 1) { this.win(); return; }
    const next = this.seq[this.idx];
    if (Math.random() < 0.35) this.maybeSub(this.A.lines.pick('pamoka', 'your_turn', { vardas: next.name }), C.yellow, 3000);
    this.highlightHolder();
  }

  caughtNow() {
    const f = this.flight;
    this.flight = null;
    this.caught += 1;
    this.freezeUntil = this.time.now + FREEZE_MS;
    const who = this.seq[f ? f.from : this.idx];
    const name = who ? who.name : 'Adriana';
    this.caughtWho.set(name, (this.caughtWho.get(name) || 0) + 1);
    const at = this.cardImg;
    const t = headText(this, at.x, at.y - 70, 'PAGAVO!', 80, C.red).setDepth(1600).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 40, delay: 900, duration: 300, onComplete: () => t.destroy() });
    this.A.sfx.boo();
    this.cameras.main.shake(220, 0.006);
    const line = this.A.lines.pick('pamoka', 'caught', { vardas: name });
    this.teacherSay(line, C.red, 1600);
    this.maybeSub(line, C.red, 0);
    // atvirukas grįžta atgal
    const back = Math.max(0, (f ? f.from : this.idx) - CAUGHT_BACK);
    const p = this.holderPos(back);
    this.tweens.add({
      targets: this.cardImg, x: p.x, y: p.y, scale: 0.8 * p.s, duration: 600, ease: 'Quad.InOut',
      onComplete: () => {
        this.idx = back;
        this.holderSince = this.time.now;
        this.highlightHolder();
      },
    });
    this.ring.setVisible(false);
    this.holderTag.setVisible(false);
  }

  // ---------------- klasiokų veiksmai ----------------
  stat(who, key) {
    const id = who.pid || who.name;
    const st = this.stats.get(id) || { name: who.name, counts: {} };
    st.counts[key] = (st.counts[key] || 0) + 1;
    this.stats.set(id, st);
    return st;
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
    subtitle(this, text, { color, y: 382 });
    if (this._subtitle) this._subtitle.setDepth(1700);
  }

  bigBanner(title, sub, opts) {
    banner(this, title, sub, opts).setDepth(1900);
  }

  onPress({ player, action, role }) {
    this.tribune.bounce(player.pid);
    if (this.mode !== 'play' && this.mode !== 'end') return;
    if (role === 'lenta') return this.teacherAction(player, action);
    this.stat(player, action);
    const v = this.seats.get(player.pid);
    switch (action) {
      case 'perduoti': return this.kidPass(player, v);
      case 'klausti': return this.ask(player, v);
      case 'mandarinas': return this.mandarin(player, v);
      case 'dainuoti': return this.sing(player, v);
      case 'snabzdeti': return this.whisper(player, v);
      case 'ranka': if (v) { this.tweens.add({ targets: v.box, y: v.y - 14, yoyo: true, duration: 140 }); this.kidBubble(v, 'Aš! Aš!', C.yellow); } return undefined;
      case 'ziovauti': if (v) { this.kidBubble(v, 'Aaaa...', '#d9c8ff'); this.tweens.add({ targets: v.box, scaleY: v.s * 1.08, yoyo: true, duration: 400 }); } return undefined;
      case 'ciaudeti': return this.sneeze(player, v);
      case 'penalas': return this.dropCase(player, v);
      default: return undefined;
    }
  }

  kidPass(player, v) {
    const h = this.seq[this.idx];
    if (!h || h.pid !== player.pid || this.flight) {
      if (v) this.wiggle(v, 5); // ne pas jį - tik sukruta
      return;
    }
    if (v) this.wiggle(v, 14);
    this.pass(player.name);
  }

  ask(player, v) {
    if (v) {
      this.tweens.add({ targets: v.box, y: v.y - 18, yoyo: true, duration: 160 });
      this.kidBubble(v, 'Mokytoja!', C.orange, 30);
    }
    const now = this.time.now;
    const t = this.teacher;
    if (this.mode !== 'play' || now - this.lastQuestion < QUESTION_GAP || t.state !== 'writing' || now - t.since < CALM_MS) return;
    this.lastQuestion = now;
    this.questions += 1;
    this.stat(player, 'klausimai');
    this.maybeSub(this.A.lines.pick('pamoka', 'question', { vardas: player.name }), C.orange, 0);
    this.teacherWarn(550);
  }

  // mandarinas: „Skanu!“, žievelės skrenda į šalis
  mandarin(player, v) {
    this.A.sfx.rustle();
    if (!v) return;
    this.kidBubble(v, 'Skanu!', C.orange);
    for (let i = 0; i < 3; i++) {
      const p = this.add.image(v.x, v.y - 60 * v.s, 'mandarin').setDepth(1100).setScale(v.s * 0.45);
      this.tweens.add({ targets: p, x: v.x + rand(-90, 90) * v.s, y: v.y + rand(10, 60) * v.s, angle: rand(-200, 200), duration: 600, ease: 'Quad.Out' });
      this.tweens.add({ targets: p, alpha: 0, delay: 900, duration: 400, onComplete: () => p.destroy() });
    }
    if (Math.random() < 0.25) this.maybeSub(this.A.lines.pick('pamoka', 'mandarin'), C.orange, 4000);
  }

  // dainelė: „Din din don!“ ir natos
  sing(player, v) {
    this.A.sfx.jingle();
    if (!v) return;
    this.kidBubble(v, 'Din din don!', C.teal);
    for (let i = 0; i < 3; i++) {
      const n = bodyText(this, v.x + rand(-40, 40) * v.s, v.y - 120 * v.s, i % 2 ? '♫' : '♪', Math.round(40 * v.s + 10), C.teal).setDepth(1100);
      this.tweens.add({ targets: n, y: n.y - rand(60, 110), x: n.x + rand(-30, 30), alpha: 0, delay: i * 140, duration: 1100, onComplete: () => n.destroy() });
    }
    this.tweens.add({ targets: v.box, angle: { from: -6, to: 6 }, yoyo: true, repeat: 2, duration: 160, onComplete: () => v.box.setAngle(0) });
    if (Math.random() < 0.25) this.maybeSub(this.A.lines.pick('pamoka', 'song'), C.teal, 4000);
  }

  // šnabždesys: „Ššš...“ ir pasilenkia prie suolo draugo
  whisper(player, v) {
    this.A.sfx.shh();
    if (!v) return;
    this.kidBubble(v, 'Ššš...', '#d9c8ff');
    this.tweens.add({ targets: v.box, angle: Math.random() < 0.5 ? -12 : 12, yoyo: true, hold: 300, duration: 180 });
    if (Math.random() < 0.25) this.maybeSub(this.A.lines.pick('pamoka', 'whisper'), '#d9c8ff', 4000);
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
    this.timerText = headText(this, 960, 70, '0:00', 92, C.white).setDepth(D);
    const w = 560;
    this.add.rectangle(960, 140, w + 8, 22, 0x000000, 0.6).setStrokeStyle(3, 0x14081f).setDepth(D);
    this.barFill = this.add.rectangle(960 - w / 2, 140, 1, 12, 0xffd23f).setOrigin(0, 0.5).setDepth(D);
    this.barW = w;
    this.cardIcon = this.add.image(960 - w / 2, 136, 'xmas_card').setScale(0.5).setDepth(D + 1);
    this.passText = bodyText(this, 960 + w / 2 + 20, 140, '', 24, '#f1e6ff').setOrigin(0, 0.5).setDepth(D);
    // tamsus fonas po žinutėmis, kad jos būtų įskaitomos ant langų ir plakato
    this.add.rectangle(960, 264, 1060, 164, 0x0b0418, 0.62).setStrokeStyle(3, 0x14081f).setDepth(D - 10);
    this.stateText = headText(this, 960, 210, 'Mokytoja rašo - perduok!', 40, C.green).setDepth(D);
  }

  updateHud() {
    // laiko riba nėra - laikrodis tik skaičiuoja, kiek užtruko
    const s = Math.floor(this.elapsed);
    this.timerText.setText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
    const total = Math.max(1, this.seq.length - 1);
    const done = this.flight ? this.flight.from + this.flight.t : this.idx;
    const f = Phaser.Math.Clamp(done / total, 0, 1);
    this.barFill.setSize(Math.max(1, this.barW * f), 12);
    this.cardIcon.x = 960 - this.barW / 2 + this.barW * f;
    this.passText.setText(`${Math.min(this.idx, total)}/${total}`);
    this.caughtText.setText(`Pagavo: ${this.caught}`);
  }

  // ---------------- pabaiga ----------------
  win() {
    this.mode = 'end';
    this.updateStatus();
    this.ring.setVisible(false);
    this.holderTag.setVisible(false);
    this.helpTag.setVisible(false);
    this.hearts(CARD_END.x, CARD_END.y, 6, 0); // širdelės iškart nuo atviruko ant stalo
    this.time.delayedCall(500, () => {
      this.teacherFace();
      this.stateText.setText('AČIŪ!').setColor(C.yellow);
      this.teacherSay('AČIŪ! Linksmų Kalėdų!', C.yellow, 2600);
      // širdelės aplink mokytoją ir atviruką, kol rodomas rezultatas
      this.time.addEvent({ delay: 160, repeat: 18, callback: () => {
        if (Math.random() < 0.4) this.hearts(CARD_END.x + rand(-50, 50), CARD_END.y + rand(-10, 20), 1, 0);
        else this.hearts(TEACHER.x + rand(-110, 110), TEACHER.y - rand(60, 300), 1, 0);
      } });
    });
    this.A.sfx.win();
    this.bigBanner('MISIJA ĮVYKDYTA!', '+100 RESPEKTO', { color: C.yellow, hold: 2800 });
    this.time.delayedCall(1300, () => this.sub(this.A.lines.pick('pamoka', 'success'), C.yellow));
    this.time.delayedCall(3600, () => this.showResult(true));
  }

  // Širdelės kyla aukštyn virš reklamjuostės.
  hearts(x, y, n, gap = 90) {
    for (let i = 0; i < n; i++) {
      const s = rand(0.7, 1.25);
      const h = this.add.image(x + (n > 1 ? rand(-60, 60) : 0), y, 'heart').setDepth(1920).setScale(0.2).setAngle(rand(-15, 15));
      this.tweens.add({ targets: h, scale: s, duration: 220, delay: i * gap, ease: 'Back.Out' });
      this.tweens.add({ targets: h, y: y - rand(140, 260), x: h.x + rand(-40, 40), alpha: 0, delay: i * gap + 300, duration: 1500, ease: 'Sine.In', onComplete: () => h.destroy() });
    }
  }

  showResult(ok) {
    this.mode = 'result';
    this.A.host.setPhase('result', STAGE);
    const box = this.add.container(960, 500).setDepth(1950).setAlpha(0);
    box.add(this.add.rectangle(0, 0, 1240, 600, 0x0b0418, 0.9).setStrokeStyle(6, ok ? 0xffd23f : 0xff4d5e));
    box.add(headText(this, 0, -235, ok ? 'ATVIRUKAS PAS MOKYTOJĄ!' : 'BEVEIK!', 72, ok ? C.yellow : C.orange));
    const all = [...this.stats.values()];
    const total = Math.max(1, this.seq.length - 1);
    const rows = [
      [`Laikas: ${this.elapsed.toFixed(1).replace('.', ',')} s   ·   Perduota: ${Math.min(this.idx, total)}/${total}   ·   Pagavo: ${this.caught} k.`, C.white],
      [`Klausimai mokytojai: ${this.questions}   ·   Adriana padėjo: ${this.helps} k.`, C.white],
    ];
    const fastest = all.filter((x) => x.best != null).sort((a, b) => a.best - b.best)[0];
    if (fastest) rows.push([`Greičiausias perdavėjas: ${fastest.name} (${(fastest.best / 1000).toFixed(1).replace('.', ',')} s)`, C.green]);
    const caughtMost = [...this.caughtWho.entries()].sort((a, b) => b[1] - a[1])[0];
    if (caughtMost) rows.push([`Mokytoja pagavo: ${caughtMost[0]}${caughtMost[1] > 1 ? ` (${caughtMost[1]} k.)` : ''}`, C.red]);
    const best = (k) => all.map((x) => [x, x.counts[k] || 0]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
    const asker = best('klausimai');
    if (asker) rows.push([`Didžiausias smalsuolis: ${asker[0].name}`, C.orange]);
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
      this.elapsed += dt;
      // mokytojos ciklas: rašo -> „Hmm?“ -> žiūri -> vėl rašo
      if (t.state === 'writing' && now >= t.until) this.teacherWarn();
      else if (t.state === 'warning' && now >= t.until) this.teacherFace();
      else if (t.state === 'facing' && now >= t.until) this.teacherWrite();
      // automatinis žaidėjas (testams): perduoda, kai mokytoja rašo
      if (this.autoplay && !this.flight && t.state === 'writing' && now - t.since > 250 && now > this.freezeUntil) {
        this.autoT -= dt;
        if (this.autoT <= 0) {
          this.autoT = rand(0.4, 1.2);
          this.pass('auto');
        }
      }
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

    // atvirukas skrenda arba guli pas turėtoją
    if (this.flight) {
      const f = this.flight;
      f.t = Math.min(1, f.t + dt / f.dur);
      const a = this.holderPos(f.from);
      const b = this.holderPos(f.to);
      const x = a.x + (b.x - a.x) * f.t;
      const y = a.y + (b.y - a.y) * f.t - Math.sin(f.t * Math.PI) * 140;
      this.cardImg.setPosition(x, y).setScale(0.8 * (a.s + (b.s - a.s) * f.t)).setAngle(f.t * 360);
      if (play && t.state === 'facing') this.caughtNow();
      else if (f.t >= 1) { this.cardImg.setAngle(0); this.landed(); }
    } else if (!this.tweens.isTweening(this.cardImg)) {
      const p = this.holderPos(this.idx);
      this.cardImg.setPosition(p.x, p.y + Math.sin(now / 200) * 3).setScale(0.8 * p.s);
    }

    // jei turėtojas užsižiopsojo - Adriana gali padėti
    // (rodoma tik kol mokytoja rašo - kitaip padėdama Adriana būtų pagauta)
    const h = this.seq[this.idx];
    const help = play && !this.flight && h && h.type === 'kid' && t.state === 'writing' && now - this.holderSince >= HELP_MS;
    if (help !== this.helpTag.visible) {
      this.helpTag.setVisible(help);
      if (help) this.helpTag.setText(`${h.name.toUpperCase()} UŽSIŽIOPSOJO - ADRIANA, PADĖK! →`);
    }

    this.updateHud();
  }
}
