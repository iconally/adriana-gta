// 7 etapas: Kinų kalbos pamoka (Konfucijaus institutas) - „KINŲ KALBOS IŠŠŪKIS“.
//
// 5 raundai, po vieną žodį (雪 sniegas, 星 žvaigždė, 树 medis, 月 mėnulis, 火 ugnis):
//  1) Viktorina: ekrane hieroglifas ir pinjinis, telefonuose - 2 atsakymai. Adriana irgi spėja (← / →).
//  2) Atsakymas: kas atsakė teisingai - jų žibintai auksiniai, kas klydo - pilki.
//  3) Gaudymas: iš kiekvieno atsakiusio vaiko žibinto krenta tas hieroglifas, kurį jis pasirinko
//     (atsakė „Sniegas“ - krenta 雪, atsakė „Vanduo“ - krenta 水). Neatsakė - iš jo žibinto nekrenta nieko.
//     Teisingų visada daugiau nei klaidingų: teisingai atsakiusiųjų žibintai meta papildomų teisingų,
//     o likusį laiką krenta tik teisingi. Jei niekas neatsakė teisingai - teisingus meta Laoshi (iš viršaus).
//     Jei niekas neatsakė (pvz. nėra telefonų), krenta atsitiktiniai hieroglifai.
//     Adriana su raudonu dubeniu bėgioja ← → ir gaudo tik teisingus. Kiekvienas hieroglifas ištariamas kiniškai.
// Mokytoja - laoshi (老师): „Lėčiau!“ (hieroglifai krenta lėčiau) ir „Nǐ hǎo!“ (žibintai sumirksi).

import { headText, bodyText, banner, subtitle, missionCard, C } from '../fx.js';
import { Tribune, avatarKey } from '../tribune.js';
import { STAGES } from '../stages.js';
import { CJK_FONT, FLOOR_Y } from '../art-china.js';
import { shuffle } from '../../common.js';

const STAGE = STAGES.kinu;
const WORDS = [
  { ch: '雪', py: 'xuě', lt: 'Sniegas', em: '❄️' },
  { ch: '星', py: 'xīng', lt: 'Žvaigždė', em: '⭐' },
  { ch: '树', py: 'shù', lt: 'Medis', em: '🌲' },
  { ch: '月', py: 'yuè', lt: 'Mėnulis', em: '🌙' },
  { ch: '火', py: 'huǒ', lt: 'Ugnis', em: '🔥' },
];
// klaidinantys hieroglifai (be 木 - jis irgi „medis“)
const DISTRACT = [
  { ch: '人', lt: 'žmogus' }, { ch: '山', lt: 'kalnas' }, { ch: '水', lt: 'vanduo' }, { ch: '日', lt: 'saulė' },
  { ch: '大', lt: 'didelis' }, { ch: '口', lt: 'burna' }, { ch: '马', lt: 'arklys' }, { ch: '米', lt: 'ryžiai' },
];
const WRONG_MEANINGS = [
  { ch: '山', lt: 'Kalnas', em: '⛰️' }, { ch: '水', lt: 'Vanduo', em: '💧' }, { ch: '人', lt: 'Žmogus', em: '🧑' },
  { ch: '日', lt: 'Saulė', em: '☀️' }, { ch: '马', lt: 'Arklys', em: '🐴' },
];
const laoshiLabel = (name) => `Laoshi ${String(name || 'Daiva').replace(/mokytoja\s*/i, '')}`;
const QUIZ_MS = 4500;
const REVEAL_MS = 1100;
const CATCH_MS = 5500;
const SPAWN_MS = 420;
const FALL = 290; // px/s
const SLOW_FALL = 165;
const LANTERN = { y: 92, x0: 540, x1: 1780 };
const ADR_Y = 950;
const ADR_S = 0.62;
const X_MIN = 580;
const X_MAX = 1700;
const BASKET_HALF = 80;
const BOARD = { x: 60, y: 210, w: 400, h: 560 };

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class KinuScene extends Phaser.Scene {
  constructor() { super('Kinu'); }

  create() {
    const A = window.AGTA;
    this.A = A;
    this.mode = 'intro'; // intro -> count -> (quiz -> reveal -> catch) x5 -> finale -> end -> result
    A.host.setPhase('intro', STAGE);
    this.setButtons(null);
    A.host.lock('a', null, false);
    A.host.lock('b', null, false);

    // Phaser naudoja tą patį scenos objektą, todėl visą būseną nustatom iš naujo.
    this.round = -1;
    this.answers = new Map(); // pid -> { choice, ms }
    this.options = [];
    this.correctIdx = 0;
    this.adrPick = null;
    this.adrRight = 0;
    this.quizStart = 0;
    this.share = 0.5;
    this.shares = [];
    this.items = [];
    this.drops = [];
    this.fill = [];
    this.dropIdx = 0;
    this.spawnEvery = SPAWN_MS;
    this.totRight = 0;
    this.totAns = 0;
    this.spawnT = 0;
    this.catchEnd = 0;
    this.slowUntil = 0;
    this.caught = 0;
    this.ups = 0;
    this.adrX = 960;
    this.walkT = 0;
    this.lastSub = 0;
    this.elapsed = 0;
    this.stats = new Map();
    this.lanterns = new Map(); // pid -> žibintas
    this.autoplay = !!this.autoplay;
    this.autoPickAt = 0;

    this.add.image(960, 540, 'china_bg').setDepth(-100);
    this.makeLanterns();
    this.makeBoard();
    this.makeTeacher();
    this.makeAdriana();
    this.makeHud();

    this.tribune = new Tribune(this, A.host, { y: 1006, maxSize: 64 });
    this.card = missionCard(this, {
      nr: STAGE.nr,
      mission: STAGE.mission,
      title: STAGE.title,
      tip: A.lines.pick('kinu', 'intro'),
      controls: 'Klasė: atsakyk telefone, ką reiškia hieroglifas.   Adriana: spėk ← / →, paskui gaudyk ← → teisingus hieroglifus.',
    });
    this.card.setDepth(1900);

    const kb = this.input.keyboard;
    this.keysLR = kb.addKeys('LEFT,RIGHT,A,D');
    kb.on('keydown-ENTER', () => this.onEnter());
    kb.on('keydown-SPACE', () => { if (this.mode === 'intro') this.onEnter(); });
    kb.on('keydown-LEFT', () => this.adrianaPick(0));
    kb.on('keydown-A', () => this.adrianaPick(0));
    kb.on('keydown-RIGHT', () => this.adrianaPick(1));
    kb.on('keydown-D', () => this.adrianaPick(1));
    kb.on('keydown-R', () => this.scene.restart());

    const offs = [
      A.host.on('press', (e) => this.onPress(e)),
      A.host.on('join', (p) => this.onLateJoin(p)),
    ];
    // Virtualūs vaikai atsako per 0,5-3 s, dažniausiai teisingai.
    A.host.botFilter = (p, btn) => {
      if (btn === 'a' || btn === 'b') return this.mode === 'quiz';
      return Math.random() < 0.3;
    };
    A.host.botPick = (p) => {
      if (this.mode !== 'quiz' || A.host.roles[p.pid] !== 'mokinys' || this.answers.has(p.pid)) return null;
      if (this.time.now - this.quizStart < 700) return null;
      if (Math.random() > 0.3) return null;
      const right = Math.random() < 0.75;
      return (right ? this.correctIdx : 1 - this.correctIdx) === 0 ? 'a' : 'b';
    };
    this.events.once('shutdown', () => {
      offs.forEach((f) => f());
      A.host.botFilter = null;
      A.host.botPick = null;
      A.host.lock('a', undefined, false);
      A.host.lock('b', undefined, false);
      this.setButtons(null);
      A.host.setStatus(null);
      try { window.speechSynthesis?.cancel(); } catch { /* nieko */ }
    });
  }

  // Telefono mygtukai šiam raundui (null - numatytieji).
  setButtons(opts, word) {
    const r = STAGE.roles.mokinys;
    if (!opts) {
      r.emoji = '🐼';
      r.desc = 'Kinų kalbos viktorina! Kai ekrane pasirodys hieroglifas - atsakyk, ką jis reiškia.';
      r.buttons[0].label = '...'; r.buttons[0].emoji = '❓';
      r.buttons[1].label = '...'; r.buttons[1].emoji = '❓';
      return;
    }
    r.emoji = word.ch;
    r.desc = `Ką reiškia ${word.ch} (${word.py})?`;
    opts.forEach((o, i) => { r.buttons[i].label = o.lt; r.buttons[i].emoji = o.em; });
  }

  // ---------------- eiga ----------------
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
    const nums = ['3', '2', '1', '你好!'];
    nums.forEach((n, i) => {
      this.time.delayedCall(i * 700, () => {
        const last = i === nums.length - 1;
        const t = (last ? this.cjk(960, 470, n, 170, C.yellow) : headText(this, 960, 470, n, 240, C.white)).setDepth(1960);
        t.setScale(1.8).setAlpha(0);
        this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 200, ease: 'Back.Out' });
        this.tweens.add({ targets: t, alpha: 0, delay: 480, duration: 200, onComplete: () => t.destroy() });
        if (last) {
          this.A.sfx.go();
          this.A.host.setPhase('play', STAGE);
          this.sub(this.A.lines.pick('kinu', 'start'), C.yellow);
          this.time.delayedCall(500, () => this.startRound(0));
        } else this.A.sfx.count();
      });
    });
  }

  startRound(i) {
    this.round = i;
    const w = WORDS[i];
    // atsakymai: teisingas + vienas klaidingas, atsitiktine tvarka
    const wrongPool = [...WORDS.filter((x) => x !== w).map((x) => ({ ch: x.ch, lt: x.lt, em: x.em })), ...WRONG_MEANINGS];
    const opts = shuffle([{ ch: w.ch, lt: w.lt, em: w.em, ok: true }, { ...pick(wrongPool), ok: false }]);
    this.options = opts;
    this.correctIdx = opts.findIndex((o) => o.ok);
    this.answers = new Map();
    this.adrPick = null;
    this.autoPickAt = this.time.now + 1200;
    this.quizStart = this.time.now;
    this.mode = 'quiz';
    this.setButtons(opts, w);
    const host = this.A.host;
    host.lock('a', undefined, false);
    host.lock('b', undefined, false);
    const by = {};
    for (const p of host.list()) if (host.isTeacher(p.name)) by[p.pid] = { text: `Klasė spėja: ${w.ch} = ?`, tone: 'go' };
    host.setStatus({ text: `Ką reiškia ${w.ch}? Atsakyk!`, tone: 'go', holder: true }, by);
    for (const L of this.lanterns.values()) this.lanternState(L, 'idle');
    this.boardWord(w, false);
    this.say(`KĄ REIŠKIA ${w.ch}?`, C.yellow);
    this.maybeSub(this.A.lines.pick('kinu', 'quiz'), '#f1e6ff', 0);
    this.A.sfx.pop();
    this.zh(w.ch);
    this.quizTimer = this.time.delayedCall(QUIZ_MS, () => this.reveal());
  }

  adrianaPick(i) {
    if (this.mode !== 'quiz' || this.adrPick != null) return;
    this.adrPick = i;
    this.A.sfx.click();
    this.updateBoard();
  }

  answered() {
    // visi atsakė - neberaukiam
    const kids = this.A.host.list().filter((p) => this.A.host.roles[p.pid] === 'mokinys');
    if (this.mode === 'quiz' && kids.length && this.answers.size >= kids.length) {
      if (this.quizTimer) this.quizTimer.remove();
      this.quizTimer = this.time.delayedCall(600, () => this.reveal());
    }
  }

  reveal() {
    if (this.mode !== 'quiz') return;
    this.mode = 'reveal';
    const host = this.A.host;
    host.lock('a', null, false);
    host.lock('b', null, false);
    const w = WORDS[this.round];
    let right = 0;
    for (const [pid, a] of this.answers) {
      const ok = a.choice === this.correctIdx;
      if (ok) right += 1;

      const L = this.lanterns.get(pid);
      if (L) this.lanternState(L, ok ? 'right' : 'wrong');
    }
    this.share = this.answers.size ? right / this.answers.size : 0.5;
    this.shares.push(this.answers.size ? right / this.answers.size : null);
    this.totRight += right;
    this.totAns += this.answers.size;
    if (this.adrPick === this.correctIdx) this.adrRight += 1;
    // telefonams - ar atspėjo
    const by = {};
    const ans = `${w.ch} = ${w.lt.toLowerCase()} ${w.em}`;
    for (const p of host.list()) {
      const a = this.answers.get(p.pid);
      if (host.isTeacher(p.name)) by[p.pid] = { text: `${ans} · teisingai ${right} iš ${this.answers.size}`, tone: 'go' };
      else if (!a) by[p.pid] = { text: ans, tone: 'wait' };
      else by[p.pid] = a.choice === this.correctIdx ? { text: `Teisingai! ${ans}`, tone: 'go' } : { text: `Ne... ${ans}`, tone: 'wait' };
    }
    host.setStatus(null, by);
    this.boardWord(w, true);
    this.say(`${w.ch} = ${w.em} ${w.lt.toUpperCase()}`, C.green);
    this.sub(this.A.lines.pick('kinu', this.share >= 0.6 ? 'reveal_good' : 'reveal_bad'), this.share >= 0.6 ? C.green : C.orange);
    if (this.adrPick === this.correctIdx) this.time.delayedCall(500, () => this.maybeSub(this.A.lines.pick('kinu', 'adr_right'), C.pink, 0));
    this.A.sfx.plus();
    this.zh(w.ch);
    this.time.delayedCall(REVEAL_MS, () => this.startCatch());
  }

  startCatch() {
    this.mode = 'catch';
    this.spawnT = 0;
    const w = WORDS[this.round];
    const good = { pid: null, ch: w.ch, lt: w.lt.toLowerCase(), correct: true };
    // Kas ką atsakė, tas ir krenta iš jo žibinto. Neatsakiusiųjų žibintai tyli.
    const all = [...this.answers.entries()].map(([pid, a]) => {
      const o = this.options[a.choice];
      return { pid, ch: o.ch, lt: o.lt.toLowerCase(), correct: !!o.ok };
    });
    const right = all.filter((d) => d.correct);
    const wrong = all.length - right.length;
    // Teisingų visada bent 2 daugiau nei klaidingų - papildomus meta teisingai atsakiusiųjų žibintai
    // (jei tokių nėra - Laoshi iš viršaus).
    const extra = [];
    for (let i = 0; i < wrong + 2 - right.length; i++) extra.push(right.length ? right[i % right.length] : good);
    this.drops = shuffle([...all, ...extra]);
    this.fill = right.length ? right : [good];       // kai sąrašas baigiasi - krenta tik teisingi
    this.dropIdx = 0;
    const n = this.drops.length;
    const dur = n ? Phaser.Math.Clamp(n * 230 + 900, CATCH_MS, 8500) : CATCH_MS;
    this.catchEnd = this.time.now + dur;
    this.spawnEvery = n ? Phaser.Math.Clamp((dur - 900) / n, 200, SPAWN_MS) : SPAWN_MS;
    if (all.length && !right.length) this.time.delayedCall(900, () => this.teacherSay(`Gaudyk ${w.ch}!`, C.yellow));
    this.say(`GAUDYK ${w.ch} ${w.em}!`, C.yellow);
    this.maybeSub(this.A.lines.pick('kinu', 'catch', { ch: w.ch, lt: w.lt.toLowerCase() }), C.yellow, 2000);
  }

  endCatch() {
    this.mode = 'between';
    for (const it of this.items) this.tweens.add({ targets: it.box, alpha: 0, duration: 200, onComplete: () => it.box.destroy() });
    this.items = [];
    this.time.delayedCall(500, () => {
      if (this.round + 1 < WORDS.length) this.startRound(this.round + 1);
      else this.finale();
    });
  }

  spawn() {
    const w = WORDS[this.round];
    let d;
    if (this.drops.length) {
      // pirma visi atsakymai (sumaišyti), paskui - tik teisingi
      d = this.dropIdx < this.drops.length ? this.drops[this.dropIdx] : this.fill[(this.dropIdx - this.drops.length) % this.fill.length];
      this.dropIdx += 1;
    } else {
      // niekas neatsakė - atsitiktiniai hieroglifai (pusė teisingų)
      const correct = Math.random() < 0.5;
      const pool = [...DISTRACT, ...WORDS.filter((x2) => x2 !== w).map((x2) => ({ ch: x2.ch, lt: x2.lt.toLowerCase() }))];
      const o = correct ? { ch: w.ch, lt: w.lt.toLowerCase() } : pick(pool);
      d = { pid: null, ch: o.ch, lt: o.lt, correct };
    }
    const all = [...this.lanterns.values()];
    const L = d.pid ? this.lanterns.get(d.pid) : (!this.answers.size && all.length ? pick(all) : null);
    const x = L ? L.x : rand(X_MIN, X_MAX);
    const box = this.add.container(Phaser.Math.Clamp(x, X_MIN, X_MAX), LANTERN.y + 120).setDepth(900);
    const tile = this.add.image(0, 0, 'char_tile').setScale(0.95);
    const t = this.cjk(0, 2, d.ch, 54, '#14081f', { strokeThickness: 0 });
    box.add([tile, t]);
    box.setScale(0.3);
    this.tweens.add({ targets: box, scale: 1, duration: 160 });
    if (L) this.tweens.add({ targets: L.box, angle: { from: -10, to: 10 }, yoyo: true, duration: 120, onComplete: () => L.box.setAngle(0) });
    this.items.push({ box, correct: d.correct, ch: d.ch, lt: d.lt, owner: L ? L.pid : null, spin: rand(-30, 30) });
  }

  onCatch(it) {
    const p = { x: this.adrX, y: ADR_Y - 120 };
    this.zh(it.ch);
    if (it.correct) {
      this.caught += 1;
      this.A.sfx.plus();
      this.pop(p.x, p.y - 60, `${it.ch} ✓`, C.green);
      if (it.owner) {
        const L = this.lanterns.get(it.owner);
        if (L) { this.stat(L, 'padejo'); if (Math.random() < 0.35) this.maybeSub(`${L.name} padėjo!`, C.yellow, 2500); }
      }
      this.tweens.add({ targets: this.adrBox, y: ADR_Y - 10, yoyo: true, duration: 90 });
    } else {
      this.ups += 1;
      this.A.sfx.plunk();
      this.pop(p.x, p.y - 60, `${it.ch} = ${it.lt}`, C.red);
      this.maybeSub(this.A.lines.pick('kinu', 'ups', { ch: WORDS[this.round].ch }), C.red, 3000);
      this.cameras.main.shake(100, 0.003);
    }
  }

  finale() {
    this.mode = 'finale';
    this.A.host.setStatus({ text: '圣诞快乐! Linksmų Kalėdų!', tone: 'go' });
    this.say('圣诞快乐!', C.yellow);
    const big = this.cjk(1130, 420, '圣诞快乐', 150, C.yellow).setDepth(1700).setScale(0.3);
    const py = bodyText(this, 1130, 540, 'Shèngdàn kuàilè - Linksmų Kalėdų!', 44, C.white).setDepth(1700).setAlpha(0);
    this.tweens.add({ targets: big, scale: 1, duration: 500, ease: 'Back.Out' });
    this.tweens.add({ targets: py, alpha: 1, delay: 300, duration: 300 });
    this.time.addEvent({ delay: 260, repeat: 10, callback: () => this.firework(rand(620, 1680), rand(220, 600)) });
    for (const L of this.lanterns.values()) this.tweens.add({ targets: L.box, angle: { from: -12, to: 12 }, yoyo: true, repeat: 3, duration: 260 });
    this.A.sfx.win();
    this.time.delayedCall(2600, () => {
      this.tweens.add({ targets: [big, py], alpha: 0, duration: 300 });
      this.finish();
    });
  }

  finish() {
    this.mode = 'end';
    this.A.host.setStatus(null);
    this.bigBanner('MISIJA ĮVYKDYTA!', '+100 RESPEKTO', { color: C.yellow, hold: 2800 });
    this.time.delayedCall(1300, () => this.sub(this.A.lines.pick('kinu', 'success'), C.yellow));
    this.time.delayedCall(3600, () => this.showResult());
  }

  showResult() {
    this.mode = 'result';
    this.A.host.setPhase('result', STAGE);
    const box = this.add.container(960, 500).setDepth(1950).setAlpha(0);
    box.add(this.add.rectangle(0, 0, 1240, 620, 0x0b0418, 0.9).setStrokeStyle(6, 0xffd23f));
    box.add(headText(this, 0, -245, 'KINŲ KALBA ĮVEIKTA!', 66, C.yellow));
    const all = [...this.stats.values()];
    const rows = [
      [`Pagauta: ${this.caught}   ·   Ups: ${this.ups}   ·   Žodžiai: ${WORDS.map((w) => w.ch).join(' ')}`, C.white],
      [`Klasės atsakymai: ✓ ${this.totRight} iš ${this.totAns}   ·   Adriana atspėjo: ${this.adrRight} iš ${WORDS.length}`, C.white],
    ];
    const best = (k) => all.map((x) => [x, x.counts[k] || 0]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
    const right = best('teisingai');
    if (right) rows.push([`Daugiausiai teisingų: ${right[0].name} (${right[1]} iš ${WORDS.length})`, C.green]);
    const fast = all.filter((x) => x.fast != null).sort((a, b) => a.fast - b.fast)[0];
    if (fast) rows.push([`Greičiausiai atsakė teisingai: ${fast.name} (${(fast.fast / 1000).toFixed(1).replace('.', ',')} s)`, C.teal]);
    const helper = best('padejo');
    if (helper) rows.push([`Geriausias padėjėjas: ${helper[0].name} (${helper[1]} pagauti)`, C.yellow]);
    rows.slice(0, 6).forEach(([r, c], i) => box.add(bodyText(this, 0, -150 + i * 54, r, 30, c)));
    const next = headText(this, 0, 250, 'ENTER - TOLIAU', 48, C.white);
    this.tweens.add({ targets: next, alpha: 0.3, yoyo: true, repeat: -1, duration: 650 });
    box.add(next);
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
  }

  // ---------------- klasė ----------------
  stat(who, key) {
    const id = who.pid || who.name;
    const st = this.stats.get(id) || { name: who.name, counts: {} };
    st.counts[key] = (st.counts[key] || 0) + 1;
    this.stats.set(id, st);
    return st;
  }

  onPress({ player, action, role }) {
    this.tribune.bounce(player.pid);
    if (this.mode === 'intro' || this.mode === 'result') return;
    if (role === 'laoshi') { this.teacherAction(player, action); return; }
    if ((action !== 'a' && action !== 'b') || this.mode !== 'quiz' || this.answers.has(player.pid)) return;
    const choice = action === 'a' ? 0 : 1;
    const ms = this.time.now - this.quizStart;
    this.answers.set(player.pid, { choice, ms });
    if (choice === this.correctIdx) {
      const st = this.stat(player, 'teisingai');
      st.fast = st.fast == null ? ms : Math.min(st.fast, ms);
    }
    const L = this.lanterns.get(player.pid);
    if (L) { this.lanternState(L, 'answered'); this.tweens.add({ targets: L.box, y: L.y + 8, yoyo: true, duration: 120 }); }
    this.updateBoard();
    this.answered();
  }

  teacherAction(player, action) {
    const vars = { mokytoja: laoshiLabel(this.teacherName) };
    if (action === 'leciau') {
      this.slowUntil = this.time.now + 4000;
      this.teacherSay('Lėčiau!', C.teal);
      this.maybeSub(this.A.lines.pick('kinu', 'slow', vars), C.teal, 1500);
    } else if (action === 'nihao') {
      this.teacherSay('你好!', C.yellow);
      for (const L of this.lanterns.values()) this.tweens.add({ targets: L.img, alpha: 0.4, yoyo: true, repeat: 1, duration: 120 });
      this.maybeSub(this.A.lines.pick('kinu', 'nihao', vars), C.yellow, 4000);
    }
  }

  onLateJoin(player) {
    if (this.A.host.isTeacher(player.name)) return;
    this.makeLanterns();
  }

  // Ištarti kiniškai (naršyklės balsas zh-CN; jei jo nėra - tyliai).
  zh(text) {
    try {
      const ss = window.speechSynthesis;
      if (!ss || !window.SpeechSynthesisUtterance) return;
      if (!this.zhVoice) this.zhVoice = ss.getVoices().find((v) => /^zh(-|_)?(CN|Hans)?/i.test(v.lang)) || null;
      ss.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      if (this.zhVoice) u.voice = this.zhVoice;
      u.rate = 0.8;
      u.volume = 1;
      ss.speak(u);
    } catch { /* nieko */ }
  }

  // ---------------- piešimas ----------------
  cjk(x, y, text, size, color, opts = {}) {
    return this.add.text(x, y, text, {
      fontFamily: CJK_FONT, fontStyle: 'bold', fontSize: `${size}px`, color,
      stroke: '#14081f', strokeThickness: Math.max(3, Math.round(size / 10)), align: 'center', ...opts,
    }).setOrigin(0.5);
  }

  makeLanterns() {
    for (const L of this.lanterns.values()) { L.box.destroy(); L.tag.destroy(); }
    this.lanterns.clear();
    if (!this.lanternLine) {
      this.lanternLine = this.add.graphics().setDepth(40);
      this.lanternLine.lineStyle(4, 0xe8b63a, 1);
      this.lanternLine.beginPath();
      this.lanternLine.moveTo(LANTERN.x0 - 60, LANTERN.y - 6);
      for (let x = LANTERN.x0 - 60; x <= LANTERN.x1 + 60; x += 20) this.lanternLine.lineTo(x, LANTERN.y - 6 + Math.sin((x - LANTERN.x0) / 180) * 6);
      this.lanternLine.strokePath();
    }
    const host = this.A.host;
    const kids = host.list().filter((p) => !host.isTeacher(p.name));
    const n = Math.max(1, kids.length);
    kids.forEach((p, i) => {
      const x = n === 1 ? (LANTERN.x0 + LANTERN.x1) / 2 : LANTERN.x0 + ((LANTERN.x1 - LANTERN.x0) * i) / (n - 1);
      const box = this.add.container(x, LANTERN.y).setDepth(50);
      const glow = this.add.ellipse(0, 46, 74, 74, 0xffd23f, 0.7).setVisible(false);
      const img = this.add.image(0, 0, 'lantern').setOrigin(0.5, 0).setScale(0.8);
      const key = this.textures.exists(avatarKey(p.name)) ? avatarKey(p.name) : 'dot';
      const head = this.add.image(0, 41, key).setDisplaySize(36, 36);
      const mark = bodyText(this, 20, 14, '', 20, C.green).setVisible(false);
      box.add([glow, img, head, mark]);
      const tag = bodyText(this, x, LANTERN.y + 100, p.name, 15, C.yellow).setDepth(51);
      this.lanterns.set(p.pid, { pid: p.pid, name: p.name, x, y: LANTERN.y, box, glow, img, head, mark, tag, state: 'idle' });
    });
  }

  lanternState(L, state) {
    L.state = state;
    L.glow.setVisible(state === 'right' || state === 'answered').setFillStyle(state === 'right' ? 0xffd23f : 0x2de2e6, state === 'right' ? 0.75 : 0.35);
    L.box.setAlpha(state === 'wrong' ? 0.45 : 1);
    L.mark.setVisible(state === 'right' || state === 'wrong').setText(state === 'right' ? '✓' : '✗').setColor(state === 'right' ? C.green : C.red);
  }

  makeBoard() {
    const b = BOARD;
    this.add.rectangle(b.x + b.w / 2, b.y + b.h / 2, b.w + 24, b.h + 24, 0x7a4a1c).setStrokeStyle(5, 0x14081f).setDepth(10);
    this.add.rectangle(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h, 0x1f4a3c).setDepth(11);
    const cx = b.x + b.w / 2;
    this.bRound = bodyText(this, cx, b.y + 36, '', 26, '#d9c8ff').setDepth(12);
    this.bChar = this.cjk(cx, b.y + 160, '', 150, '#ffffff').setDepth(12);
    this.bPy = bodyText(this, cx, b.y + 262, '', 40, C.yellow).setDepth(12);
    this.bMeaning = headText(this, cx, b.y + 326, '', 44, C.green).setDepth(12);
    this.bOpt = [0, 1].map((i) => {
      const y = b.y + 392 + i * 52;
      const bg = this.add.rectangle(cx, y, b.w - 40, 44, 0x0b0418, 0.5).setStrokeStyle(3, 0x5b3fd6).setDepth(12);
      const t = bodyText(this, cx, y, '', 26, '#f1e6ff').setDepth(13);
      return { bg, t };
    });
    this.bCount = bodyText(this, cx, b.y + 510, '', 24, '#d9c8ff').setDepth(12);
  }

  boardWord(w, revealed) {
    this.bRound.setText(`ŽODIS ${this.round + 1}/${WORDS.length}`);
    this.bChar.setText(w.ch);
    this.bPy.setText(w.py);
    this.bMeaning.setText(revealed ? `= ${w.em} ${w.lt.toUpperCase()}` : '= ?').setColor(revealed ? C.green : C.yellow);
    this.updateBoard();
  }

  updateBoard() {
    const kids = this.A.host.list().filter((p) => this.A.host.roles[p.pid] === 'mokinys').length;
    const revealed = this.mode !== 'quiz';
    this.options.forEach((o, i) => {
      const B = this.bOpt[i];
      const arrow = i === 0 ? '← ' : '';
      const arrowR = i === 1 ? ' →' : '';
      B.t.setText(`${arrow}${o.em} ${o.lt}${arrowR}`);
      const chosen = this.adrPick === i;
      let col = 0x0b0418;
      if (revealed) col = o.ok ? 0x3ddc84 : 0x0b0418;
      B.bg.setFillStyle(col, revealed && o.ok ? 0.85 : 0.5).setStrokeStyle(chosen ? 6 : 3, chosen ? 0xff3ea5 : 0x5b3fd6);
      B.t.setColor(revealed && o.ok ? '#14081f' : '#f1e6ff');
    });
    const pickTxt = this.adrPick != null ? `   ·   Adriana: ${this.adrPick === 0 ? '←' : '→'}` : '';
    if (!revealed) { this.bCount.setText(`Atsakė: ${this.answers.size} iš ${kids}${pickTxt}`); return; }
    const right = [...this.answers.values()].filter((a) => a.choice === this.correctIdx).length;
    this.bCount.setText(`Atsakė ${this.answers.size} iš ${kids}:   ✓ ${right}   ✗ ${this.answers.size - right}`);
  }

  makeTeacher() {
    const t = this.A.host.teachers()[0];
    this.teacherName = t ? t.name : 'Daiva';
    const box = this.add.container(505, 925).setScale(0.6).setDepth(925);
    const body = this.add.image(0, 0, 'teacher_body').setOrigin(0.5, 1);
    const faceKey = t && this.textures.exists(avatarKey(t.name)) ? avatarKey(t.name) : 'teacher_face';
    const face = this.add.image(0, -290, faceKey).setDisplaySize(104, 104);
    box.add([body, face]);
    this.teacherBox = box;
    this.cjk(505, 946, `${laoshiLabel(this.teacherName)} 老师`, 22, C.yellow).setDepth(961);
  }

  teacherSay(text, color) {
    const t = this.cjk(505, 690, text, 40, color).setDepth(1600).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 180, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, delay: 800, duration: 300, onComplete: () => t.destroy() });
  }

  makeAdriana() {
    this.adrBox = this.add.container(this.adrX, ADR_Y).setScale(ADR_S).setDepth(950);
    this.adrBody = this.add.image(0, 0, 'adr_walk_a').setOrigin(0.5, 1);
    const face = this.textures.exists('adr_face');
    const head = this.add.image(2, -244, face ? 'adr_face' : 'adr_head').setOrigin(0.5, face ? 0.5 : 0.56);
    if (face) head.setDisplaySize(118, 118);
    const basket = this.add.image(0, -100, 'basket');
    this.adrBox.add([this.adrBody, head, basket]);
  }

  makeHud() {
    const D = 1800;
    headText(this, 40, 54, STAGE.mission, 46, C.yellow).setOrigin(0, 0.5).setDepth(D);
    this.scoreText = bodyText(this, 1880, 40, 'Pagauta: 0   Ups: 0', 26, '#f1e6ff').setOrigin(1, 0.5).setDepth(D);
    this.stateText = this.cjk(1130, 40, '', 40, C.yellow).setDepth(D);
  }

  say(text, color) { this.stateText.setText(text).setColor(color); }

  pop(x, y, text, color) {
    const t = this.cjk(x, y, text, 34, color).setDepth(1600).setScale(0.5);
    this.tweens.add({ targets: t, scale: 1, duration: 150, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: y - 50, delay: 500, duration: 300, onComplete: () => t.destroy() });
  }

  firework(x, y) {
    const cols = [0xffd23f, 0xff3ea5, 0x2de2e6, 0x3ddc84, 0xffffff, 0xff7a3c];
    const col = pick(cols);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const d = this.add.circle(x, y, 6, col).setDepth(1650);
      this.tweens.add({ targets: d, x: x + Math.cos(a) * rand(70, 130), y: y + Math.sin(a) * rand(70, 130), alpha: 0, scale: 0.4, duration: 800, ease: 'Quad.Out', onComplete: () => d.destroy() });
    }
    this.A.sfx.pop();
  }

  maybeSub(text, color = C.white, gap = 2600) {
    if (!text || this.time.now - this.lastSub < gap) return;
    this.lastSub = this.time.now;
    this.sub(text, color);
  }

  sub(text, color) {
    subtitle(this, text, { color, y: 300 });
    if (this._subtitle) this._subtitle.setDepth(1700).setX(1130);
  }

  bigBanner(title, sub, opts) {
    banner(this, title, sub, opts).setDepth(1900);
  }

  // ---------------- ciklas ----------------
  update(_, deltaMs) {
    const dt = Math.min(deltaMs, 66) / 1000;
    const now = this.time.now;
    const active = ['quiz', 'reveal', 'catch', 'between', 'finale'].includes(this.mode);
    if (active) this.elapsed += dt;

    // Adrianos judėjimas
    let dir = 0;
    if (this.mode === 'catch' || this.mode === 'between' || this.mode === 'reveal') {
      const k = this.keysLR;
      if (k.LEFT.isDown || k.A.isDown) dir -= 1;
      if (k.RIGHT.isDown || k.D.isDown) dir += 1;
    }
    if (this.autoplay) {
      if (this.mode === 'quiz' && this.adrPick == null && now > this.autoPickAt) this.adrianaPick(this.correctIdx);
      if (this.mode === 'catch') {
        const target = this.items.filter((it) => it.correct && it.box.y < ADR_Y - 90).sort((a, b) => b.box.y - a.box.y)[0];
        if (target && Math.abs(target.box.x - this.adrX) > 20) dir = target.box.x > this.adrX ? 1 : -1;
      }
    }
    if (dir) {
      this.adrX = Phaser.Math.Clamp(this.adrX + dir * 820 * dt, X_MIN, X_MAX);
      this.walkT += dt;
      if (this.walkT > 0.14) { this.walkT = 0; this.adrBody.setTexture(this.adrBody.texture.key === 'adr_walk_a' ? 'adr_walk_b' : 'adr_walk_a'); }
      this.adrBox.setScale(ADR_S * (dir < 0 ? -1 : 1), ADR_S);
    }
    this.adrBox.x = this.adrX;

    // hieroglifų lietus
    if (this.mode === 'catch') {
      this.spawnT += dt * 1000;
      if (this.spawnT >= this.spawnEvery && now < this.catchEnd - 900) { this.spawnT = 0; this.spawn(); }
    }
    const speed = now < this.slowUntil ? SLOW_FALL : FALL;
    const basketY = ADR_Y - 100 * ADR_S;
    for (const it of [...this.items]) {
      it.box.y += speed * dt;
      it.box.angle += it.spin * dt;
      if (it.box.y >= basketY - 30 && it.box.y <= basketY + 20 && Math.abs(it.box.x - this.adrX) < BASKET_HALF) {
        this.onCatch(it);
        it.box.destroy();
        this.items.splice(this.items.indexOf(it), 1);
      } else if (it.box.y > FLOOR_Y + 230) {
        it.box.destroy();
        this.items.splice(this.items.indexOf(it), 1);
      }
    }
    if (this.mode === 'catch' && now >= this.catchEnd && !this.items.length) this.endCatch();
    else if (this.mode === 'catch' && now >= this.catchEnd + 1800) this.endCatch();

    this.scoreText.setText(`Pagauta: ${this.caught}   Ups: ${this.ups}`);
  }
}
