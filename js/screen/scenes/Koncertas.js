// 6 etapas: Kalėdinis koncertas Filharmonijoje - „SUGROK KALĖDAS“.
//
// Adriana - tai rojalis. Melodija „Skamba varpeliai“ (Jingle Bells, liaudies melodija)
// suskaidyta į 4 frazes. Eilė: 🎹 rojalis (Adriana) -> 🥁 būgnai -> 🎹 -> 🎺 trimitai ->
// 🎹 -> 🎻 smuikai -> 🎹 -> 🔔 varpeliai -> finalas (visi) -> nusilenkimas.
// Adriana groja pagal natų eilutę: šviečia kita nata su klavišu (A S D F G = Do Re Mi Fa Sol).
// Visa melodija trunka apie 40 s: jei Adriana per 4,5 s frazės nebaigia,
// rojalis pagroja likusias natas pats.
//
// Klasė - orkestras: kai groja jų grupė, telefonai žali („GROK!“), kitaip - raudoni („Tyliai“).
// Grojant savo metu kyla orkestro darna, ne laiku - netikra nata. Pabaigoje visi nusilenkia.
// Mokytoja - dirigentė: „Visi kartu!“ (kelias sekundes groja visi) ir „Ššš!“ (nutildo).

import { headText, bodyText, banner, subtitle, missionCard, C } from '../fx.js';
import { Tribune, avatarKey } from '../tribune.js';
import { STAGES } from '../stages.js';
import { isBoy, GIRL_COLORS, BOY_COLORS } from '../../common.js';

const STAGE = STAGES.pianinas;
const NOTE_F = { C: 523.25, D: 587.33, E: 659.25, F: 698.46, G: 783.99 };
const KEYS = ['C', 'D', 'E', 'F', 'G'];
const KEY_LABEL = ['A', 'S', 'D', 'F', 'G'];
const SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol'];
const CHORD = {
  C: [523.25, 659.25, 783.99],
  F: [698.46, 880, 523.25],
  G: [783.99, 987.77, 587.33],
};
const PHRASES = [
  { notes: 'EEEEEE', section: 'bugnai', chord: 'C' },
  { notes: 'EGCDE', section: 'trimitai', chord: 'C' },
  { notes: 'FFFFFEE', section: 'smuikai', chord: 'F' },
  { notes: 'EDDEDG', section: 'varpeliai', chord: 'G' },
];
const FINALE = { notes: 'EEEEEEEGCDE', dur: [1, 1, 2, 1, 1, 2, 1, 1, 1.5, 0.5, 4], q: 0.24 };
const SECTIONS = {
  varpeliai: { name: 'VARPELIAI', short: 'varpeliai', emoji: '🔔', color: 0xffd23f, css: C.yellow, tex: 'inst_bells' },
  smuikai: { name: 'SMUIKAI', short: 'smuikai', emoji: '🎻', color: 0xff7a3c, css: C.orange, tex: 'inst_violin' },
  bugnai: { name: 'BŪGNAI', short: 'būgnai', emoji: '🥁', color: 0x2de2e6, css: C.teal, tex: 'inst_drum' },
  trimitai: { name: 'TRIMITAI', short: 'trimitai', emoji: '🎺', color: 0xff3ea5, css: C.pink, tex: 'inst_trumpet' },
};
// Eilutė viršuje: kas groja dabar.
const LINEUP = [
  { id: 'rojalis', label: '🎹 Rojalis' },
  { id: 'bugnai', label: '🥁 Būgnai' },
  { id: 'trimitai', label: '🎺 Trimitai' },
  { id: 'smuikai', label: '🎻 Smuikai' },
  { id: 'varpeliai', label: '🔔 Varpeliai' },
];
const MELODY_S = 40; // visa melodija - apie 40 s
const ADR_LIMIT = 4500; // tiek ms Adriana turi frazei, paskui rojalis pagelbsti
const ORCH_MS = 2500; // kiek laiko groja orkestro grupė
// Orkestro vietos: kiekviena grupė stovi kartu.
const FRONT = { g: 724, s: 0.72 };
const BACK = { g: 530, s: 0.58 };
const SEATS = {
  varpeliai: [220, 320, 420, 520, 620].map((x) => ({ x, ...FRONT })),
  smuikai: [330, 425, 520, 615].map((x) => ({ x, ...BACK })),
  bugnai: [1290, 1385, 1480, 1575].map((x) => ({ x, ...BACK })),
  trimitai: [1300, 1400, 1500, 1600].map((x) => ({ x, ...FRONT })),
};
const OVERFLOW = [235, 1670, 700, 1220].map((x) => ({ x, ...FRONT, g: 790 }));
// Rojalis iš pianistės pusės (piano_back 760x440, apačios vidurys).
const PIANO = { x: 960, y: 720, s: 0.75 };
const P_LEFT = PIANO.x - 380 * PIANO.s;
const P_TOP = PIANO.y - 440 * PIANO.s;
const KEY_IDX = [7, 8, 9, 10, 11]; // baltieji klavišai Do Re Mi Fa Sol (antra oktava)
const KEY_Y = P_TOP + 344 * PIANO.s;
const keyWorldX = (i) => P_LEFT + (50 + KEY_IDX[i] * 44 + 22) * PIANO.s;
const ADR = { x: 850, y: 792, s: 0.62 };
const COND = { x: 960, y: 950, s: 0.65 }; // dirigentė - visada centre
const LINEUP_Y = 140;
const SHEET_Y = P_TOP + 89 * PIANO.s; // natų lapas ant rojalio pulto

const rand = (a, b) => a + Math.random() * (b - a);
function tintOf(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const colors = isBoy(name) ? BOY_COLORS : GIRL_COLORS;
  return colors[h % colors.length];
}
const conductorLabel = (name) => (/mokytoj|dirigent/i.test(name) ? name : `Dirigentė ${name}`);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export class KoncertasScene extends Phaser.Scene {
  constructor() { super('Koncertas'); }

  create() {
    const A = window.AGTA;
    this.A = A;
    this.mode = 'intro'; // intro -> count -> (play -> orch) x4 -> finale -> bow -> end -> result
    A.host.setPhase('intro', STAGE);
    A.host.lock('nusilenkti', null, false); // „Nusilenkti“ - tik pabaigoje

    // Phaser naudoja tą patį scenos objektą, todėl visą būseną nustatom iš naujo.
    this.phraseIdx = 0;
    this.pos = 0;
    this.mistakes = 0;
    this.phraseMistakes = 0;
    this.clean = 0;
    this.cued = null;
    this.tuttiUntil = 0;
    this.shushUntil = 0;
    this.harmony = 65;
    this.onTimes = [];
    this.offTimes = [];
    this.lastInst = {};
    this.lastSour = 0;
    this.lastShushText = 0;
    this.lastSub = 0;
    this.elapsed = 0;
    this.events_ = [];
    this.autoT = 0;
    this.melodyLeft = MELODY_S;
    this.phraseStart = 0;
    this.assisting = false;
    this.orchEnd = 0;
    this.stats = new Map();
    this.sectionHits = {};
    this.seats = new Map();
    this.autoplay = !!this.autoplay;

    this.add.image(960, 540, 'concert_bg').setDepth(-100);
    this.makeGlows();
    this.makePiano();
    this.placeKids();
    this.makeConductor();
    this.makeHud();

    this.tribune = new Tribune(this, A.host, { y: 1006, maxSize: 64 });
    this.card = missionCard(this, {
      nr: STAGE.nr,
      mission: STAGE.mission,
      title: STAGE.title,
      tip: A.lines.pick('koncertas', 'intro'),
      controls: 'Adriana - rojalis: spausk šviečiančios natos klavišą (A S D F G).   Orkestras: grok, kai telefonas žalias!',
    });
    this.card.setDepth(1900);

    const kb = this.input.keyboard;
    kb.on('keydown-ENTER', () => this.onEnter());
    kb.on('keydown-SPACE', () => { if (this.mode === 'intro') this.onEnter(); });
    ['A', 'S', 'D', 'F', 'G'].forEach((k, i) => kb.on(`keydown-${k}`, () => this.onKey(i)));
    ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'].forEach((k, i) => kb.on(`keydown-${k}`, () => this.onKey(i)));
    kb.on('keydown-R', () => this.scene.restart());

    const offs = [
      A.host.on('press', (e) => this.onPress(e)),
      A.host.on('join', (p) => this.onLateJoin(p)),
    ];
    // Virtualūs vaikai dažniausiai groja savo metu, kartais suklysta.
    A.host.botFilter = (p, btn) => {
      if (btn === 'groti') return this.isCued(A.host.roles[p.pid]) ? Math.random() < 0.9 : Math.random() < 0.06;
      if (btn === 'nusilenkti') return this.mode === 'bow';
      return Math.random() < 0.3;
    };
    A.host.botPick = (p) => {
      const r = A.host.roles[p.pid];
      if (this.mode === 'bow' && SECTIONS[r] && Math.random() < 0.3) return 'nusilenkti';
      if (SECTIONS[r] && this.isCued(r) && Math.random() < 0.3) return 'groti';
      return null;
    };
    this.events.once('shutdown', () => {
      offs.forEach((f) => f());
      A.host.botFilter = null;
      A.host.botPick = null;
      A.host.lock('nusilenkti', undefined, false);
      A.host.setStatus(null);
    });
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
    const nums = ['3', '2', '1', 'KONCERTAS!'];
    nums.forEach((n, i) => {
      this.time.delayedCall(i * 700, () => {
        const last = i === nums.length - 1;
        const t = headText(this, 960, 470, n, last ? 150 : 240, last ? C.yellow : C.white).setDepth(1960);
        t.setScale(1.8).setAlpha(0);
        this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 200, ease: 'Back.Out' });
        this.tweens.add({ targets: t, alpha: 0, delay: 480, duration: 200, onComplete: () => t.destroy() });
        if (last) { this.A.sfx.go(); this.startConcert(); } else this.A.sfx.count();
      });
    });
  }

  startConcert() {
    this.A.host.setPhase('play', STAGE);
    this.sub(this.A.lines.pick('koncertas', 'start'), C.yellow);
    this.startPhrase(0);
  }

  // Frazė: 1) Adriana (rojalis) groja pagal natas, 2) atsako orkestro grupė.
  startPhrase(i) {
    this.phraseIdx = i;
    this.phraseMistakes = 0;
    this.phraseText.setText(`Frazė ${i + 1}/${PHRASES.length}  ${'●'.repeat(i)}${'○'.repeat(PHRASES.length - i)}`);
    this.mode = 'play';
    this.pos = 0;
    this.assisting = false;
    this.phraseStart = this.time.now;
    this.cue(null);
    this.setLineup('rojalis');
    this.makeSheet(PHRASES[i]);
    this.cardState(0, 'next');
    this.glowNext();
    this.say('🎹 ADRIANA, GROK!', C.green);
    if (i === 0) this.maybeSub(this.A.lines.pick('koncertas', 'your_turn'), C.green, 0);
  }

  // Suplanuotas veiksmas, kurį galima atšaukti.
  later(ms, fn) {
    this.events_.push(this.time.delayedCall(ms, fn));
  }

  noteSound(n, color = 0x3ddc84) {
    this.A.sfx.piano(NOTE_F[n]);
    this.flashKey(KEYS.indexOf(n), color);
    this.tweens.add({ targets: this.adrBox, y: ADR.y - 5, yoyo: true, duration: 80 });
  }

  // Rojalio klavišas užsidega (paspaustas) arba šviečia geltonai (kitas).
  flashKey(i, color) {
    const k = this.pianoKeys[i];
    if (!k) return;
    if (k.timer) k.timer.remove();
    k.setFillStyle(color).setAlpha(0.85);
    k.timer = this.time.delayedCall(220, () => this.glowNext());
  }

  glowNext() {
    this.pianoKeys.forEach((k) => k.setAlpha(0));
    if (this.mode !== 'play' || this.assisting) return;
    const ph = PHRASES[this.phraseIdx];
    const i = KEYS.indexOf(ph.notes[this.pos]);
    if (this.pianoKeys[i]) this.pianoKeys[i].setFillStyle(0xffd23f).setAlpha(0.6);
  }

  onKey(i) {
    if (this.mode !== 'play' || this.assisting) return;
    const ph = PHRASES[this.phraseIdx];
    const want = ph.notes[this.pos];
    if (KEYS[i] === want) {
      this.noteSound(want);
      this.advanceNote();
      return;
    }
    // ne tas klavišas - netikra nata, bet tęsiam nuo tos pačios natos
    this.A.sfx.piano(NOTE_F[KEYS[i]]);
    this.flashKey(i, 0xff4d5e);
    this.A.sfx.plunk();
    this.mistakes += 1;
    this.phraseMistakes += 1;
    this.feedback('Ne ta nata!', C.red);
    const c = this.sheet[this.pos];
    if (c) this.tweens.add({ targets: c.box, x: c.box.x + 8, yoyo: true, repeat: 2, duration: 50 });
    this.maybeSub(this.A.lines.pick('koncertas', 'wrong'), C.orange, 3000);
  }

  advanceNote() {
    const ph = PHRASES[this.phraseIdx];
    this.cardState(this.pos, 'done');
    this.pos += 1;
    if (this.pos >= ph.notes.length) this.phraseDone();
    else this.cardState(this.pos, 'next');
  }

  // Adriana per ilgai - rojalis greitai pagroja likusias natas (kad melodija tilptų į 1 min).
  assist() {
    this.assisting = true;
    this.feedback('Rojalis padeda...', C.yellow);
    const ph = PHRASES[this.phraseIdx];
    for (let k = this.pos; k < ph.notes.length; k++) {
      this.later((k - this.pos) * 230, () => { this.noteSound(ph.notes[k]); this.advanceNote(); });
    }
  }

  phraseDone() {
    this.mode = 'orch';
    if (this.phraseMistakes === 0 && !this.assisting) this.clean += 1;
    const ok = this.phraseMistakes === 0 && !this.assisting;
    const t = headText(this, 960, 590, ok ? 'PUIKU!' : 'SUGROTA!', 110, ok ? C.green : C.teal).setDepth(1700).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: 550, delay: 600, duration: 300, onComplete: () => t.destroy() });
    this.A.sfx.plus();
    this.time.delayedCall(500, () => this.orchestraTurn());
  }

  orchestraTurn() {
    const sec = PHRASES[this.phraseIdx].section;
    const S = SECTIONS[sec];
    this.setLineup(sec);
    this.cue(sec);
    this.say(`${S.emoji} ${S.name}, GROKITE!`, S.css);
    this.orchEnd = this.time.now + ORCH_MS;
    this.orchBar.setVisible(true);
    this.orchBarBg.setVisible(true);
    // rojalis tyliai laiko akordą, kad orkestrui būtų smagiau
    const chord = CHORD[PHRASES[this.phraseIdx].chord];
    for (let b = 0; b < 5; b++) this.later(b * 700, () => this.A.sfx.piano(chord[b % 3] / 2));
    this.time.delayedCall(ORCH_MS, () => {
      this.orchBar.setVisible(false);
      this.orchBarBg.setVisible(false);
      for (const v of this.seats.values()) if (v.role === sec) this.tweens.add({ targets: v.box, y: v.y - 14 * v.s, yoyo: true, duration: 160 });
      if (this.phraseIdx + 1 < PHRASES.length) this.startPhrase(this.phraseIdx + 1);
      else this.startFinale();
    });
  }

  startFinale() {
    this.mode = 'finale';
    this.cue('visi');
    this.makeSheet(null);
    this.setLineup('visi');
    this.phraseText.setText(`FINALAS  ${'●'.repeat(PHRASES.length)}`);
    this.say('FINALAS! GROJA VISI!', C.yellow);
    this.sub(this.A.lines.pick('koncertas', 'finale'), C.yellow);
    let t = 300;
    [...FINALE.notes].forEach((n, k) => {
      const d = FINALE.dur[k] * FINALE.q * 1000;
      this.later(t, () => {
        this.noteSound(n);
        if (k % 2 === 0) this.A.sfx.instrument('bugnai', 0);
      });
      t += d;
    });
    this.later(t + 400, () => this.startBow());
  }

  startBow() {
    this.mode = 'bow';
    this.cue(null);
    this.setLineup(null);
    this.A.host.lock('nusilenkti', undefined, false);
    this.A.host.setStatus({ text: 'Nusilenk! 🙇', tone: 'go' });
    this.say('NUSILENKITE!', C.yellow);
    this.sub(this.A.lines.pick('koncertas', 'bow'), C.yellow);
    this.A.sfx.bravo();
    this.time.delayedCall(900, () => this.A.sfx.bravo());
    // Adriana atsistoja ir nusilenkia
    this.adrBox.setVisible(false);
    this.adrStand.setVisible(true);
    this.tweens.add({ targets: this.adrStand, scaleY: 0.6 * 0.86, y: ADR.y + 28, yoyo: true, hold: 500, duration: 300, repeat: 1 });
    this.roses = this.time.addEvent({ delay: 120, repeat: 30, callback: () => this.rose() });
    this.time.delayedCall(4200, () => this.finish());
  }

  finish() {
    this.mode = 'end';
    this.A.host.setStatus(null);
    this.A.host.lock('nusilenkti', null, false);
    this.say('BRAVO! BIS!', C.yellow);
    this.A.sfx.win();
    this.bigBanner('MISIJA ĮVYKDYTA!', '+100 RESPEKTO', { color: C.yellow, hold: 2800 });
    this.time.delayedCall(1300, () => this.sub(this.A.lines.pick('koncertas', 'success'), C.yellow));
    this.time.delayedCall(3600, () => this.showResult());
  }

  stars() {
    let s = 2 + this.clean * 0.5 + (this.harmony / 100) * 1.5 - Math.min(1.5, this.mistakes * 0.25);
    s = Math.round(Phaser.Math.Clamp(s, 1, 5));
    return '★'.repeat(s) + '☆'.repeat(5 - s);
  }

  showResult() {
    this.mode = 'result';
    this.A.host.setPhase('result', STAGE);
    const box = this.add.container(960, 500).setDepth(1950).setAlpha(0);
    box.add(this.add.rectangle(0, 0, 1240, 620, 0x0b0418, 0.9).setStrokeStyle(6, 0xffd23f));
    box.add(headText(this, 0, -245, `PUBLIKA: ${this.stars()}`, 66, C.yellow));
    const all = [...this.stats.values()];
    const rows = [
      [`Frazės be klaidų: ${this.clean}/${PHRASES.length}   ·   Klaidos: ${this.mistakes}   ·   Laikas: ${this.elapsed.toFixed(1).replace('.', ',')} s`, C.white],
      [`Orkestro darna: ${Math.round(this.harmony)}%`, C.white],
    ];
    // geriausia grupė - daugiausiai pataikymų vienam nariui
    const members = {};
    for (const v of this.seats.values()) members[v.role] = (members[v.role] || 0) + 1;
    const bestSec = Object.keys(SECTIONS).filter((k) => members[k] && this.sectionHits[k])
      .sort((a, b) => this.sectionHits[b] / members[b] - this.sectionHits[a] / members[a])[0];
    if (bestSec) rows.push([`Geriausiai grojo: ${SECTIONS[bestSec].emoji} ${SECTIONS[bestSec].name.charAt(0)}${SECTIONS[bestSec].name.slice(1).toLowerCase()}`, SECTIONS[bestSec].css]);
    const best = (k) => all.map((x) => [x, x.counts[k] || 0]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
    const hit = best('taiku');
    if (hit) rows.push([`Daugiausiai pataikė į savo eilę: ${hit[0].name} (${hit[1]})`, C.green]);
    const sour = best('netikra');
    if (sour) rows.push([`Netikriausia nata: ${sour[0].name}`, C.red]);
    const bow = best('nusilenkti');
    if (bow) rows.push([`Gražiausiai nusilenkė: ${bow[0].name}`, '#f1e6ff']);
    rows.slice(0, 6).forEach(([r, c], i) => box.add(bodyText(this, 0, -150 + i * 54, r, 30, c)));
    const next = headText(this, 0, 250, 'ENTER - TOLIAU', 48, C.white);
    this.tweens.add({ targets: next, alpha: 0.3, yoyo: true, repeat: -1, duration: 650 });
    box.add(next);
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
  }

  // ---------------- orkestras ----------------
  isCued(role) {
    if (!SECTIONS[role] || !this.cued) return false;
    return this.cued === 'visi' || this.cued === role || this.time.now < this.tuttiUntil;
  }

  setGlows(section) {
    for (const [k, g] of Object.entries(this.glows)) {
      const on = section === 'visi' || section === k;
      this.tweens.killTweensOf(g);
      g.setAlpha(on ? 0.5 : 0);
      if (on) this.tweens.add({ targets: g, alpha: 0.22, yoyo: true, repeat: -1, duration: 420 });
    }
  }

  cue(section) {
    this.cued = section;
    this.setGlows(section);
    if (section && SECTIONS[section]) {
      const S = SECTIONS[section];
      this.maybeSub(this.A.lines.pick('koncertas', 'section', { grupe: S.short, Grupe: cap(S.short) }), S.css, 0);
    }
    this.updatePhones();
  }

  // Telefonų viršuje: grojantiems - žalia „GROK!“, kitiems - raudona „Tyliai“.
  updatePhones() {
    const host = this.A.host;
    if (this.mode === 'bow' || this.mode === 'end' || this.mode === 'result') return;
    if (!this.cued) {
      // groja Adriana (rojalis) - visas orkestras tyli
      const who = 'Adriana 🎹';
      const by = {};
      for (const p of host.list()) if (host.isTeacher(p.name)) by[p.pid] = { text: `Tyla - groja ${who}`, tone: 'wait' };
      host.setStatus({ text: `Tyliai - groja ${who}`, tone: 'wait' }, by);
      return;
    }
    const tutti = this.cued === 'visi' || this.time.now < this.tuttiUntil;
    const S = SECTIONS[this.cued];
    const by = {};
    for (const p of host.list()) {
      const r = host.roles[p.pid];
      if (host.isTeacher(p.name)) by[p.pid] = { text: tutti ? 'Diriguok: groja VISI!' : `Diriguok: groja ${S.short}`, tone: 'go' };
      else if (this.isCued(r)) by[p.pid] = { text: `GROK! ${SECTIONS[r].emoji} Tavo eilė!`, tone: 'go', holder: true };
      else by[p.pid] = { text: `Tyliai - groja ${S ? S.short : 'kiti'}`, tone: 'wait' };
    }
    host.setStatus(null, by);
  }

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
    if (role === 'dirigente') { this.conductor(player, action); return; }
    const v = this.seats.get(player.pid);
    if (action === 'nusilenkti') {
      if (this.mode !== 'bow') return;
      this.stat(player, 'nusilenkti');
      if (v) {
        this.tweens.add({ targets: v.box, scaleY: v.s * 0.82, y: v.y + 10 * v.s, yoyo: true, duration: 220 });
        this.kidBubble(v, 'Ačiū!', C.yellow);
      }
      return;
    }
    if (action !== 'groti') return;
    const sec = SECTIONS[role] ? role : (v && v.role);
    const now = this.time.now;
    if (this.isCued(sec)) {
      this.stat(player, 'taiku');
      this.sectionHits[sec] = (this.sectionHits[sec] || 0) + 1;
      this.onTimes = this.onTimes.filter((t) => now - t < 1000);
      if (this.onTimes.length < 14) { this.onTimes.push(now); this.harmony = Math.min(100, this.harmony + 1.5); }
      if (!this.lastInst[sec] || now - this.lastInst[sec] > 90) {
        this.lastInst[sec] = now;
        const chord = CHORD[this.mode === 'finale' ? 'C' : PHRASES[this.phraseIdx].chord];
        this.A.sfx.instrument(sec, chord[Math.floor(Math.random() * chord.length)]);
      }
      if (v) this.playAnim(v, true);
    } else if (now < this.shushUntil) {
      if (v) this.kidBubble(v, 'Ššš...', '#d9c8ff', 22);
    } else {
      this.stat(player, 'netikra');
      // keli „triukšmadariai“ negali visiškai sugadinti koncerto: ne daugiau -6 per sekundę
      this.offTimes = this.offTimes.filter((t) => now - t < 1000);
      if (this.offTimes.length < 4) { this.offTimes.push(now); this.harmony = Math.max(0, this.harmony - 1.5); }
      if (now - this.lastSour > 150) { this.lastSour = now; this.A.sfx.sour(); }
      if (v) { this.playAnim(v, false); this.kidBubble(v, '✗', C.red, 30); }
      if (now - this.lastShushText > 1800 && Math.random() < 0.5) {
        this.lastShushText = now;
        this.condSay('Ššš!', C.orange);
      }
      this.maybeSub(this.A.lines.pick('koncertas', 'sour'), C.red, 6000);
    }
  }

  conductor(player, action) {
    const vars = { dirigente: conductorLabel(this.condName) };
    this.tweens.add({ targets: this.baton, angle: -70, yoyo: true, duration: 160, repeat: 1 });
    if (action === 'visi') {
      if (this.mode !== 'orch' && this.mode !== 'finale') { this.condSay('Palaukim...', '#f1e6ff'); return; }
      this.tuttiUntil = this.time.now + 4000;
      this.updatePhones();
      this.time.delayedCall(4050, () => this.updatePhones());
      this.setGlows('visi');
      this.time.delayedCall(4000, () => this.setGlows(this.cued));
      this.condSay('VISI KARTU!', C.yellow);
      this.maybeSub(this.A.lines.pick('koncertas', 'tutti', vars), C.yellow, 1500);
    } else if (action === 'tyliai') {
      this.shushUntil = this.time.now + 3000;
      this.condSay('Ššš!', '#d9c8ff');
      this.maybeSub(this.A.lines.pick('koncertas', 'shush', vars), '#d9c8ff', 1500);
    }
  }

  playAnim(v, good) {
    this.tweens.add({ targets: v.inst, angle: good ? 14 : -20, yoyo: true, duration: 90 });
    if (!good) return;
    this.tweens.add({ targets: v.box, y: v.y - 8 * v.s, yoyo: true, duration: 100 });
    const S = SECTIONS[v.role];
    const n = bodyText(this, v.x + rand(-20, 20), v.y - 150 * v.s, Math.random() < 0.5 ? '♪' : '♫', Math.round(40 * v.s + 8), S ? S.css : C.white).setDepth(1500);
    this.tweens.add({ targets: n, y: n.y - rand(70, 120), x: n.x + rand(-30, 30), alpha: 0, duration: 900, onComplete: () => n.destroy() });
  }

  kidBubble(v, text, color = C.white, size = 26) {
    const t = bodyText(this, v.x, v.y - 175 * v.s - 10, text, size, color).setDepth(1500).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, y: t.y - 16, duration: 180, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, delay: 700, duration: 250, onComplete: () => t.destroy() });
  }

  condSay(text, color) {
    const t = headText(this, COND.x + 120, COND.y - 250 * COND.s, text, 46, color).setDepth(1600).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 180, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, delay: 800, duration: 300, onComplete: () => t.destroy() });
  }

  rose() {
    const r = this.add.image(rand(300, 1620), -40, 'rose').setDepth(1450).setAngle(rand(-60, 60));
    this.tweens.add({ targets: r, y: rand(560, 760), angle: r.angle + rand(-180, 180), duration: rand(900, 1400), ease: 'Quad.In' });
    this.tweens.add({ targets: r, alpha: 0, delay: 2600, duration: 500, onComplete: () => r.destroy() });
  }

  // ---------------- piešimas ----------------
  makeGlows() {
    this.glows = {};
    for (const [k, seats] of Object.entries(SEATS)) {
      const xs = seats.map((p) => p.x);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const w = Math.max(...xs) - Math.min(...xs) + 140 * seats[0].s;
      this.glows[k] = this.add.ellipse(cx, seats[0].g, w, 60 * seats[0].s, SECTIONS[k].color, 1).setDepth(seats[0].g - 30).setAlpha(0);
      // grupės pavadinimas: galinei eilei - virš galvų, priekinei - po vardais
      const ly = seats[0].g === BACK.g ? seats[0].g - 245 * seats[0].s : seats[0].g + 42;
      bodyText(this, cx, ly, `${SECTIONS[k].emoji} ${SECTIONS[k].name}`, 24, SECTIONS[k].css).setDepth(seats[0].g + 2);
    }
  }

  makePiano() {
    this.add.image(PIANO.x, PIANO.y, 'piano_back').setOrigin(0.5, 1).setScale(PIANO.s).setDepth(PIANO.y - 200);
    // klavišų švytėjimas (Do Re Mi Fa Sol)
    this.pianoKeys = KEY_IDX.map((_, i) => this.add.rectangle(keyWorldX(i), KEY_Y, 40 * PIANO.s, 76 * PIANO.s, 0xffd23f).setAlpha(0).setDepth(PIANO.y - 199));
    const face = this.textures.exists('adr_face');
    const headKey = face ? 'adr_face' : 'adr_head';
    // Adriana prie rojalio - iš nugaros, žiūri į klavišus ir natas
    this.adrBox = this.add.container(ADR.x, ADR.y).setScale(ADR.s).setDepth(PIANO.y + 10);
    const body = this.add.image(0, 0, 'adr_piano_back').setOrigin(0.5, 1);
    const head = this.add.image(0, -196, 'adr_head_back').setOrigin(0.5, 0.56);
    this.adrBox.add([body, head]);
    // stovinti (nusilenkimui) - atsisuka į publiką
    this.adrStand = this.add.container(ADR.x - 150, ADR.y + 20).setScale(0.6).setDepth(PIANO.y + 90).setVisible(false);
    const sb = this.add.image(0, 0, 'adr_walk_a').setOrigin(0.5, 1);
    const sh = this.add.image(2, -244, headKey).setOrigin(0.5, face ? 0.5 : 0.56);
    if (face) sh.setDisplaySize(118, 118);
    this.adrStand.add([sb, sh]);
  }

  placeKids() {
    const host = this.A.host;
    for (const p of host.list()) if (!host.isTeacher(p.name)) this.addKid(p);
  }

  addKid(player) {
    if (this.seats.has(player.pid)) return null;
    const host = this.A.host;
    let role = host.roles[player.pid];
    if (!SECTIONS[role]) role = STAGE.slots[this.seats.size % STAGE.slots.length];
    const used = new Set([...this.seats.values()].map((v) => `${v.x}:${v.g}`));
    const S = (SEATS[role] || []).find((p) => !used.has(`${p.x}:${p.g}`)) || OVERFLOW.find((p) => !used.has(`${p.x}:${p.g}`));
    if (!S) return null;
    const y = S.g - 64 * S.s;
    const box = this.add.container(S.x, y).setScale(S.s).setDepth(S.g);
    const body = this.add.image(0, 64, 'kid_body').setOrigin(0.5, 1).setTint(tintOf(player.name));
    const key = this.textures.exists(avatarKey(player.name)) ? avatarKey(player.name) : 'dot';
    const head = this.add.image(0, -110, key).setDisplaySize(96, 96);
    const inst = this.add.image(0, role === 'bugnai' ? 20 : -6, SECTIONS[role].tex).setScale(0.85);
    box.add([body, head, inst]);
    bodyText(this, S.x, S.g + 14 * S.s, player.name, Math.round(27 * S.s), C.yellow).setDepth(S.g + 1);
    const v = { box, body, head, inst, name: player.name, pid: player.pid, x: S.x, y, g: S.g, s: S.s, role };
    this.seats.set(player.pid, v);
    return v;
  }

  onLateJoin(player) {
    if (this.A.host.isTeacher(player.name)) return;
    this.addKid(player);
    this.updatePhones();
  }

  makeConductor() {
    const t = this.A.host.teachers()[0];
    this.condName = t ? t.name : 'Daiva';
    this.add.image(COND.x, COND.y + 4, 'podium_box').setOrigin(0.5, 0.5).setScale(0.9).setDepth(COND.y - 1);
    const box = this.add.container(COND.x, COND.y).setScale(COND.s).setDepth(COND.y);
    const body = this.add.image(0, 0, 'teacher_back').setOrigin(0.5, 1);
    const hair = this.add.image(0, -292, 'teacher_hair').setTint(0x8a5a33).setScale(0.95);
    this.baton = this.add.rectangle(56, -200, 110, 7, 0xffffff).setOrigin(0, 0.5).setStrokeStyle(2, 0x14081f).setAngle(-30);
    box.add([this.baton, body, hair]);
    this.condBox = box;
    bodyText(this, COND.x, COND.y + 6, conductorLabel(this.condName), 26, C.yellow).setDepth(COND.y + 1);
  }

  makeHud() {
    const D = 1800;
    headText(this, 40, 54, STAGE.mission, 46, C.yellow).setOrigin(0, 0.5).setDepth(D);
    this.phraseText = bodyText(this, 40, 108, `Frazė 1/${PHRASES.length}  ${'○'.repeat(PHRASES.length)}`, 30, C.yellow).setOrigin(0, 0.5).setDepth(D);
    this.mistakeText = bodyText(this, 40, 142, 'Klaidos: 0', 26, '#f1e6ff').setOrigin(0, 0.5).setDepth(D);
    bodyText(this, 1880, 40, 'Orkestro darna', 24, '#f1e6ff').setOrigin(1, 0.5).setDepth(D);
    this.add.rectangle(1700, 76, 368, 26, 0x000000, 0.6).setStrokeStyle(3, 0x14081f).setDepth(D);
    this.harmFill = this.add.rectangle(1518, 76, 180, 16, 0x3ddc84).setOrigin(0, 0.5).setDepth(D);
    this.timeText = headText(this, 1880, 124, `⏱ ${MELODY_S} s`, 34, '#f1e6ff').setOrigin(1, 0.5).setDepth(D);
    this.stateText = headText(this, 960, 56, '', 44, C.white).setDepth(D);
    // eilutė: kas dabar groja
    this.lineup = LINEUP.map((L, i) => {
      const x = 960 + (i - 2) * 228;
      const bg = this.add.rectangle(x, LINEUP_Y, 212, 50, 0x0b0418, 0.85).setStrokeStyle(3, 0x5b3fd6).setDepth(D);
      const t = bodyText(this, x, LINEUP_Y, L.label, 26, '#9c8fd6', { strokeThickness: 0 }).setDepth(D);
      return { id: L.id, bg, t };
    });
    // orkestro laiko juosta (po eilute)
    this.orchBarBg = this.add.rectangle(960, LINEUP_Y + 40, 600, 12, 0x000000, 0.6).setDepth(D).setVisible(false);
    this.orchBar = this.add.rectangle(660, LINEUP_Y + 40, 592, 6, 0xffd23f).setOrigin(0, 0.5).setDepth(D).setVisible(false);
    this.fb = headText(this, 960, SHEET_Y - 100, '', 36, C.green).setDepth(D);
    this.sheet = [];
  }

  // Kas groja: 'rojalis', grupė, 'visi' arba null.
  setLineup(id) {
    this.lineup.forEach((L) => {
      const on = id === 'visi' || L.id === id;
      const col = L.id === 'rojalis' ? 0x3ddc84 : SECTIONS[L.id].color;
      L.bg.setFillStyle(on ? col : 0x0b0418, on ? 1 : 0.85).setStrokeStyle(on ? 5 : 3, on ? 0xffffff : 0x5b3fd6);
      L.t.setColor(on ? '#14081f' : '#9c8fd6');
      L.bg.setScale(1);
      L.t.setScale(1);
      if (on && id !== 'visi') this.tweens.add({ targets: [L.bg, L.t], scale: 1.1, yoyo: true, duration: 180 });
    });
  }

  // Natų eilutė: kortelės su klavišu ir nata (vienintelė „klaviatūra“ ekrane).
  makeSheet(ph) {
    (this.sheetObjs || []).forEach((o) => o.destroy());
    this.sheetObjs = [];
    this.sheet = [];
    if (!ph) return;
    const n = ph.notes.length;
    const w = 62;
    const bg = this.add.rectangle(960, SHEET_Y, n * (w + 6) + 20, 122, 0xfdf6e3, 1).setStrokeStyle(4, 0x14081f).setDepth(PIANO.y - 198);
    this.sheetObjs.push(bg);
    [...ph.notes].forEach((note, k) => {
      const i = KEYS.indexOf(note);
      const x = 960 + (k - (n - 1) / 2) * (w + 6);
      const box = this.add.container(x, SHEET_Y).setDepth(PIANO.y - 197);
      const r = this.add.rectangle(0, 0, w, 106, 0xffffff).setStrokeStyle(3, 0x14081f);
      const l = headText(this, 0, -12, KEY_LABEL[i], 46, '#14081f', { strokeThickness: 0 });
      const so = bodyText(this, 0, 32, SOLFEGE[i], 21, '#5b3fd6', { strokeThickness: 0 });
      box.add([r, l, so]);
      this.sheetObjs.push(box);
      this.sheet.push({ box, r });
    });
  }

  cardState(k, state) {
    const c = this.sheet[k];
    if (!c) return;
    const col = { idle: 0xffffff, next: 0xffd23f, done: 0x3ddc84 }[state];
    c.r.setFillStyle(col).setStrokeStyle(state === 'next' ? 7 : 3, 0x14081f);
    if (state === 'next') this.tweens.add({ targets: c.box, scale: 1.14, yoyo: true, duration: 150 });
  }

  say(text, color) { this.stateText.setText(text).setColor(color); }

  feedback(text, color) {
    this.fb.setText(text).setColor(color).setAlpha(1).setScale(0.6);
    this.tweens.killTweensOf(this.fb);
    this.tweens.add({ targets: this.fb, scale: 1, duration: 120, ease: 'Back.Out' });
    this.tweens.add({ targets: this.fb, alpha: 0, delay: 600, duration: 250 });
  }

  maybeSub(text, color = C.white, gap = 2600) {
    if (!text || this.time.now - this.lastSub < gap) return;
    this.lastSub = this.time.now;
    this.sub(text, color);
  }

  sub(text, color) {
    subtitle(this, text, { color, y: 252 });
    if (this._subtitle) this._subtitle.setDepth(1700);
  }

  bigBanner(title, sub, opts) {
    banner(this, title, sub, opts).setDepth(1900);
  }

  // ---------------- ciklas ----------------
  update(_, deltaMs) {
    const dt = Math.min(deltaMs, 66) / 1000;
    const melody = this.mode === 'play' || this.mode === 'orch' || this.mode === 'finale';
    const active = melody || this.mode === 'bow';
    if (active) this.elapsed += dt;
    if (melody) this.melodyLeft = Math.max(0, this.melodyLeft - Math.min(deltaMs, 250) / 1000);

    // autoplay (testams): groja be klaidų
    if (this.autoplay && this.mode === 'play' && !this.assisting) {
      this.autoT += dt;
      if (this.autoT > 0.3) {
        this.autoT = 0;
        this.onKey(KEYS.indexOf(PHRASES[this.phraseIdx].notes[this.pos]));
      }
    }
    // Adriana per ilgai groja frazę - rojalis padeda (visa melodija - iki 1 min)
    if (this.mode === 'play' && !this.assisting && this.time.now - this.phraseStart > ADR_LIMIT) this.assist();

    // dirigentė mojuoja lazdele
    if (active && this.mode !== 'bow' && !this.tweens.isTweening(this.baton)) {
      this.baton.angle = -30 + Math.sin(this.time.now / 1000 * 6) * 22;
    }
    if (this.mode === 'orch' && this.orchEnd) {
      const f = Phaser.Math.Clamp((this.orchEnd - this.time.now) / ORCH_MS, 0, 1);
      this.orchBar.setSize(Math.max(1, 592 * f), 6);
    }
    this.timeText.setText(`⏱ ${Math.ceil(this.melodyLeft)} s`).setColor(this.melodyLeft < 10 ? C.orange : '#f1e6ff');
    const h = this.harmony / 100;
    this.harmFill.setSize(Math.max(1, 360 * h), 16).setFillStyle(h > 0.6 ? 0x3ddc84 : h > 0.3 ? 0xff9a3c : 0xff4d5e);
    this.mistakeText.setText(`Klaidos: ${this.mistakes}`);
  }
}
