// 5 etapas: Mados šou Vingio estradoje - „NENUGRIŪK PODIUME“.
//
// Adriana eina podiumu pagal muziką: ← ir → pakaitomis, kai taškas viršuje pasiekia
// apskritimą (kiekvienas taktas - vienas žingsnis). Ne į taktą, ta pati koja ar per greitai -
// ji sušlubuoja; per daug sušlubavus - suklumpa („Oi!“), atsistoja ir eina toliau.
// Podiumo gale - POZA: TARPAS, kai žiedas užsidaro. Tada apsisuka ir grįžta į sceną.
//
// Klasiokai stovi abipus podiumo. Visi turi „Ploti“ (plojimai ramina Adrianą) ir vieną savo mygtuką:
//  - fotografai: blykstė; per pozą nuotraukos skaičiuojamos (telefonuose - žalia „POZA!“);
//  - vėjas: gūsis stumia Adrianą į šoną;  - sniegas: trumpam slidu.
// Mokytoja - komisija: „Bravo!“ (stipriai ramina) ir griežtas žvilgsnis (sujaudina).
// Pabaigoje komisija parodo balą.

import { headText, bodyText, banner, subtitle, missionCard, snow, C } from '../fx.js';
import { Tribune, avatarKey } from '../tribune.js';
import { STAGES } from '../stages.js';
import { runwayY, runwayHW } from '../art-show.js';
import { isBoy, teacherLabel } from '../../common.js';

const STAGE = STAGES.podiumas;
const BPM = 100;
const BEAT = 60 / BPM; // 0,6 s
const COUNT_IN = 4; // „1, 2, 3, EINAM!“ - po jų pradedama eiti
const STEPS_OUT = 14;
const STEPS_BACK = 12;
const PERFECT = 0.09; // s nuo takto
const GOOD = 0.18;
const POSE_PERFECT = 0.13;
const POSE_GOOD = 0.26;
const POSE_WINDOW = 0.6;
const POSE_HOLD = 4; // taktai pozai (fotografuojama)
const S0 = 0.5; // Adrianos mastelis scenoje
const S1 = 1.28; // podiumo gale
// Pusiausvyra: kuo didesnis "drebulys", tuo labiau svyruoja; 100 - suklumpa.
const W = { miss: 22, foot: 12, fast: 14, perfect: -6, good: -2, clap: -3, wind: 8, snow: 5, bravo: -25, look: 15, decay: 6 };
const FALL_MS = 1500;
const TRACK = { x0: 560, x1: 1360, y: 140, target: 650, px: 150 };
const JURY = { x: 1745, y: 806 };
// Vietos abipus podiumo: priekinės eilės ir arčiau podiumo - pirmiau.
// Priekyje dešinėje mažiau vietų - ten komisijos stalas.
const SEATS = [];
for (const [u, left, right] of [[0.84, 4, 2], [0.54, 3, 3], [0.24, 3, 3]]) {
  const s = 0.5 + 0.4 * u;
  for (let col = 0; col < Math.max(left, right); col++) {
    for (const side of [-1, 1]) {
      if (col >= (side < 0 ? left : right)) continue;
      SEATS.push({ x: 960 + side * (runwayHW(u) + 68 * s + col * 150 * s), ground: runwayY(u) + 8, s, side });
    }
  }
}

const rand = (a, b) => a + Math.random() * (b - a);
const other = (f) => (f === 'L' ? 'R' : 'L');
// Mados šou - ryškūs neoniniai drabužiai (GTA stiliumi).
const SHOW_GIRL = [0xff3ea5, 0x2de2e6, 0xffd23f, 0xb06bff, 0x3ddc84, 0xff7a3c];
const SHOW_BOY = [0x2f8bff, 0x2de2e6, 0x3ddc84, 0xffd23f, 0xff7a3c, 0x8a5cff];
function tintOf(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const colors = isBoy(name) ? SHOW_BOY : SHOW_GIRL;
  return colors[h % colors.length];
}

export class PodiumasScene extends Phaser.Scene {
  constructor() { super('Podiumas'); }

  create() {
    const A = window.AGTA;
    this.A = A;
    this.mode = 'intro'; // intro -> count -> out -> pose -> back -> end -> result
    A.host.setPhase('intro', STAGE);

    // Phaser naudoja tą patį scenos objektą, todėl visą būseną nustatom iš naujo.
    this.audio = false;
    this.lat = 0;
    this.t0 = 0;
    this.nextSched = 0;
    this.musicEnd = Infinity;
    this.lastBeat = -1;
    this.u = 0;
    this.uView = 0;
    this.stepIdx = 0;
    this.walking = false;
    this.lastFoot = null;
    this.lastStepBeat = COUNT_IN - 1;
    this.wobble = 0;
    this.lean = 0;
    this.fallUntil = 0;
    this.slipUntil = 0;
    this.steps = 0;
    this.goodSteps = 0;
    this.perfects = 0;
    this.stumbles = 0;
    this.style = 0;
    this.poseBeat = 0;
    this.poseQ = null;
    this.photoOpen = false;
    this.posePhotos = 0;
    this.lastWind = 0;
    this.lastSnow = 0;
    this.lastFlash = 0;
    this.lastClapSfx = 0;
    this.clapTimes = [];
    this.lastSub = 0;
    this.idleSince = 0;
    this.startedAt = 0;
    this.elapsed = 0;
    this.stats = new Map();
    this.seats = new Map(); // pid -> žiūrovas
    this.autoplay = !!this.autoplay;

    this.add.image(960, 540, 'show_bg').setDepth(-100);
    this.sign = headText(this, 960, 236, 'MADOS ŠOU', 64, C.pink).setDepth(-50);
    this.makeLights();
    snow(this, 1200);
    this.placeKids();
    this.makeJury();
    this.makeAdriana();
    this.makeHud();

    this.tribune = new Tribune(this, A.host, { y: 1006, maxSize: 64 });
    this.card = missionCard(this, {
      nr: STAGE.nr,
      mission: STAGE.mission,
      title: STAGE.title,
      tip: A.lines.pick('podiumas', 'intro'),
      controls: 'Adriana: ← → pakaitomis pagal muziką, gale - TARPAS (poza).   Visi: plokit!',
    });
    this.card.setDepth(1900);

    const kb = this.input.keyboard;
    kb.on('keydown-ENTER', () => this.onEnter());
    kb.on('keydown-SPACE', (ev) => (this.mode === 'intro' ? this.onEnter() : this.onPoseKey(ev)));
    kb.on('keydown-LEFT', (ev) => this.onStepKey('L', ev));
    kb.on('keydown-A', (ev) => this.onStepKey('L', ev));
    kb.on('keydown-RIGHT', (ev) => this.onStepKey('R', ev));
    kb.on('keydown-D', (ev) => this.onStepKey('R', ev));
    kb.on('keydown-R', () => this.scene.restart());

    const offs = [
      A.host.on('press', (e) => this.onPress(e)),
      A.host.on('join', (p) => this.onLateJoin(p)),
    ];
    // Virtualūs vaikai: trukdo saikingai, o per pozą fotografai fotografuoja.
    A.host.botFilter = (p, btn) => {
      if (btn === 'vejas' || btn === 'sniegas') return Math.random() < 0.35;
      if (btn === 'zvilgsnis') return Math.random() < 0.3;
      if (btn === 'foto') return this.photoOpen || Math.random() < 0.3;
      return true;
    };
    A.host.botPick = (p) => (this.photoOpen && A.host.roles[p.pid] === 'fotografas' && Math.random() < 0.35 ? 'foto' : null);
    this.events.once('shutdown', () => {
      offs.forEach((f) => f());
      A.host.botFilter = null;
      A.host.botPick = null;
      A.host.setStatus(null);
    });
  }

  // ---------------- laikas ir muzika ----------------
  clock() {
    if (this.audio) {
      const t = this.A.sfx.clock();
      if (t != null) return t;
    }
    return performance.now() / 1000;
  }

  beatTime(k) { return this.t0 + k * BEAT; }

  // Kada žaidėjas GIRDI taktą (su garso vėlavimu).
  heardTime(k) { return this.beatTime(k) + this.lat; }

  // Paspaudimo laikas tuo pačiu laikrodžiu (klavišo įvykis apdorojamas kitame kadre).
  pressTime(ev) {
    const ago = ev && ev.timeStamp ? Math.max(0, Math.min(0.1, (performance.now() - ev.timeStamp) / 1000)) : 0;
    return this.clock() - ago;
  }

  startMusic() {
    this.audio = this.A.sfx.ready;
    this.lat = this.audio ? Math.min(0.12, this.A.sfx.latency()) : 0;
    this.t0 = this.clock() + 0.3;
    this.nextSched = 0;
    this.lastBeat = -1;
  }

  scheduleMusic(now) {
    if (!this.audio) return;
    const m = this.A.sfx.music;
    while (this.nextSched < this.musicEnd && this.beatTime(this.nextSched) < now + 0.3) {
      const k = this.nextSched;
      this.nextSched += 1;
      const t = this.beatTime(k);
      if (t < now - 0.02) continue;
      const bar = Math.floor(k / 4) % 4;
      const root = [130.81, 110, 87.31, 98][bar]; // C - Am - F - G
      m.kick(t);
      if (k % 4 === 1 || k % 4 === 3) m.snare(t);
      m.hat(t + BEAT / 2);
      m.bass(k % 2 ? root * 1.5 : root, t, BEAT * 0.8);
      if (k % 4 === 0) m.bell([1568, 1319, 1397, 1568][bar], t);
      if (k % 8 === 6) m.bell(2093, t + BEAT / 2);
    }
  }

  onBeat(k) {
    // šviesos mirksi pagal taktą
    this.bulbs.forEach((b, i) => b.setFillStyle((i + k) % 2 ? 0xffd23f : 0xff3ea5, (i + k) % 2 ? 1 : 0.55));
    this.tweens.add({ targets: this.sign, scale: 1.06, yoyo: true, duration: 110 });
    this.tweens.add({ targets: this.targetRing, scale: 1.25, yoyo: true, duration: 90 });
    if (!this.audio && this.mode !== 'intro') this.A.sfx.tick();
    if (this.mode === 'count') {
      if (k < COUNT_IN) {
        const last = k === COUNT_IN - 1;
        const t = headText(this, 960, 470, last ? 'EINAM!' : String(k + 1), last ? 170 : 210, last ? C.yellow : C.white).setDepth(1960);
        t.setScale(1.6).setAlpha(0);
        this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 160, ease: 'Back.Out' });
        this.tweens.add({ targets: t, alpha: 0, delay: 380, duration: 160, onComplete: () => t.destroy() });
      }
      if (k === COUNT_IN - 1) this.startWalking();
    }
  }

  // ---------------- valdymas ----------------
  onEnter() {
    if (this.mode === 'intro') this.countIn();
    else if (this.mode === 'result') {
      this.A.host.markDone(STAGE.id);
      this.A.go('Map');
    }
  }

  countIn() {
    this.mode = 'count';
    this.tweens.add({ targets: this.card, alpha: 0, duration: 300, onComplete: () => this.card.destroy() });
    this.startMusic();
    this.say('Klausyk muzikos...', C.white);
  }

  startWalking() {
    this.mode = 'out';
    this.A.host.setPhase('play', STAGE);
    this.startedAt = this.time.now;
    this.idleSince = this.time.now;
    this.say('EIK PAGAL MUZIKĄ: ← →', C.white);
    this.sub(this.A.lines.pick('podiumas', 'start'), C.yellow);
  }

  onStepKey(foot, ev) {
    if (this.mode !== 'out' && this.mode !== 'back') return;
    if (this.time.now < this.fallUntil || this.walking) return;
    this.step(foot, this.pressTime(ev));
  }

  step(foot, press) {
    this.idleSince = this.time.now;
    const kf = (press - this.lat - this.t0) / BEAT;
    const k = Math.round(kf);
    const err = (kf - k) * BEAT;
    if (k < COUNT_IN) { this.feedback('DAR NE!', C.orange); return; }
    if (this.lastFoot === foot) {
      this.shake(W.foot);
      this.feedback('KITA KOJA!', C.orange);
      return;
    }
    if (k <= this.lastStepBeat) {
      this.shake(W.fast);
      this.feedback('PER GREITAI!', C.red);
      return;
    }
    this.lastStepBeat = k;
    this.lastFoot = foot;
    this.steps += 1;
    const a = Math.abs(err);
    if (a <= PERFECT) {
      this.goodSteps += 1;
      this.perfects += 1;
      this.style += 10;
      this.shake(W.perfect);
      this.feedback('PUIKU!', C.green);
      if (this.perfects % 6 === 0) this.maybeSub(this.A.lines.pick('podiumas', 'perfect'), C.green, 3000);
    } else if (a <= GOOD) {
      this.goodSteps += 1;
      this.style += 5;
      this.shake(W.good);
      this.feedback('GERAI!', C.teal);
    } else {
      this.shake(W.miss * (this.time.now < this.slipUntil ? 1.6 : 1));
      this.feedback(err < 0 ? 'PER ANKSTI!' : 'PER VĖLAI!', C.red);
      this.maybeSub(this.A.lines.pick('podiumas', 'miss'), C.red, 5000);
    }
    this.advance(foot);
  }

  advance(foot) {
    this.stepIdx += 1;
    const out = this.mode === 'out';
    const total = out ? STEPS_OUT : STEPS_BACK;
    this.u = out ? this.stepIdx / STEPS_OUT : 1 - this.stepIdx / STEPS_BACK;
    const key = out ? (foot === 'L' ? 'adr_walk_a' : 'adr_walk_b') : (foot === 'L' ? 'adr_back_a' : 'adr_back_b');
    if (this.mode !== 'end') this.adrBody.setTexture(key);
    this.A.sfx.step();
    const last = this.stepIdx >= total;
    if (last) this.walking = true;
    this.tweens.add({
      targets: this, uView: this.u, duration: 220, ease: 'Sine.Out',
      onComplete: () => {
        if (!last) return;
        this.walking = false;
        if (out) this.startPose(); else this.finish();
      },
    });
    this.tweens.add({ targets: this.adrInner, y: -8, yoyo: true, duration: 110 });
  }

  // Pusiausvyra: + drebulys, - nurimsta. 100 - suklumpa.
  shake(d) {
    if (this.mode !== 'out' && this.mode !== 'back' && this.mode !== 'pose') return;
    this.wobble = Phaser.Math.Clamp(this.wobble + d, 0, 100);
    if (this.wobble >= 100 && this.time.now >= this.fallUntil && this.mode !== 'pose') this.stumble();
  }

  stumble() {
    this.stumbles += 1;
    this.fallUntil = this.time.now + FALL_MS;
    this.lastFoot = null;
    const dir = this.lean >= 0 ? 1 : -1;
    this.tweens.killTweensOf(this.adrInner);
    this.tweens.add({ targets: this.adrInner, angle: 72 * dir, y: 14, duration: 260, ease: 'Quad.In' });
    this.tweens.add({ targets: this.adrInner, angle: 0, y: 0, delay: 950, duration: 380, ease: 'Back.Out', onComplete: () => { this.wobble = 35; } });
    const p = this.adrPoint();
    const t = headText(this, p.x, p.y - 330 * p.s, 'OI!', 110, C.red).setDepth(1600).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 40, delay: 900, duration: 300, onComplete: () => t.destroy() });
    this.A.sfx.thud();
    this.A.sfx.ooo();
    this.cameras.main.shake(220, 0.006);
    this.say('OI! KELIASI...', C.red);
    this.time.delayedCall(FALL_MS, () => { if (this.mode === 'out' || this.mode === 'back') this.say(this.mode === 'out' ? 'EIK PAGAL MUZIKĄ: ← →' : 'ATGAL Į SCENĄ: ← →', C.white); });
    this.maybeSub(this.A.lines.pick('podiumas', 'stumble'), C.orange, 0);
  }

  // ---------------- poza ----------------
  startPose() {
    this.mode = 'pose';
    this.poseBeat = Math.ceil((this.clock() - this.lat - this.t0) / BEAT) + 2;
    this.poseQ = null;
    this.photoOpen = true;
    this.posePhotos = 0;
    this.adrBody.setTexture('adr_walk_a');
    this.say('POZA! TARPAS, KAI ŽIEDAS UŽSIDARYS!', C.yellow);
    this.sub(this.A.lines.pick('podiumas', 'pose'), C.yellow);
    // telefonuose: fotografams - „Fotografuok!“, kitiems - „Plok!“, mokytojai - „Bravo!“
    const host = this.A.host;
    const by = {};
    for (const pl of host.list()) {
      if (host.isTeacher(pl.name)) by[pl.pid] = { text: 'POZA! Bravo!', tone: 'go' };
      else if (host.roles[pl.pid] === 'fotografas') by[pl.pid] = { text: 'POZA! Fotografuok!', tone: 'go' };
    }
    host.setStatus({ text: 'POZA! Plok!', tone: 'go' }, by);
    this.poseRing.setVisible(true);
  }

  onPoseKey(ev) {
    if (this.mode !== 'pose' || this.poseQ) return;
    const err = this.pressTime(ev) - this.heardTime(this.poseBeat);
    if (err < -POSE_WINDOW) { this.feedback('DAR NE!', C.orange); return; }
    this.doPose(err);
  }

  doPose(err) {
    const a = err == null ? 9 : Math.abs(err);
    this.poseQ = a <= POSE_PERFECT ? 'perfect' : a <= POSE_GOOD ? 'good' : 'late';
    const info = {
      perfect: ['TOBULA POZA!', C.green, 50],
      good: ['GRAŽI POZA!', C.teal, 25],
      late: ['POZA!', C.orange, 8],
    }[this.poseQ];
    this.style += info[2];
    this.feedback(info[0], info[1]);
    this.poseRing.setVisible(false);
    this.adrBody.setTexture('adr_pose');
    this.tweens.add({ targets: this.adrInner, scale: 1.08, yoyo: true, duration: 160 });
    this.bigFlash(0.5);
    this.A.sfx.shutter();
    this.time.delayedCall(120, () => this.A.sfx.shutter());
    this.time.delayedCall(260, () => this.A.sfx.shutter());
    this.maybeSub(this.A.lines.pick('podiumas', `pose_${this.poseQ}`), info[1], 0);
    const p = this.adrPoint();
    const t = headText(this, p.x, p.y - 360 * p.s, info[0], 64, info[1]).setDepth(1600).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, delay: 1500, duration: 400, onComplete: () => t.destroy() });
    this.time.delayedCall(POSE_HOLD * BEAT * 1000, () => this.turnBack());
  }

  turnBack() {
    if (this.mode !== 'pose') return;
    this.photoOpen = false;
    this.A.host.setStatus(null);
    this.mode = 'back';
    this.stepIdx = 0;
    this.lastFoot = null;
    this.lastStepBeat = Math.round((this.clock() - this.lat - this.t0) / BEAT);
    this.idleSince = this.time.now;
    this.adrBody.setTexture('adr_back_a');
    this.adrHead.setVisible(false);
    this.adrHeadBack.setVisible(true);
    this.tweens.add({ targets: this.adrInner, scaleX: -1, yoyo: true, duration: 120 });
    this.say('ATGAL Į SCENĄ: ← →', C.white);
    this.sub(this.A.lines.pick('podiumas', 'back'), C.teal);
  }

  // ---------------- pabaiga ----------------
  finish() {
    this.mode = 'end';
    this.photoOpen = false;
    this.A.host.setStatus(null);
    this.musicEnd = this.nextSched + 2;
    this.adrHead.setVisible(true);
    this.adrHeadBack.setVisible(false);
    this.adrBody.setTexture('adr_pose');
    this.tweens.add({ targets: this.adrInner, scaleY: 0.9, yoyo: true, duration: 260, repeat: 1 });
    this.say('BRAVO!', C.yellow);
    this.A.sfx.win();
    this.A.sfx.bravo();
    this.scoreVal = this.score();
    this.time.delayedCall(700, () => this.showScoreCard());
    this.bigBanner('MISIJA ĮVYKDYTA!', '+100 RESPEKTO', { color: C.yellow, hold: 2800 });
    this.time.delayedCall(1300, () => this.sub(this.A.lines.pick('podiumas', 'success'), C.yellow));
    this.time.delayedCall(4200, () => this.showResult());
  }

  score() {
    const acc = this.steps ? this.goodSteps / this.steps : 0;
    let s = 5 + acc * 3.5;
    s += { perfect: 1.2, good: 0.7, late: 0.2 }[this.poseQ] || 0;
    s += Math.min(0.8, this.posePhotos / 20);
    s -= this.stumbles * 0.7;
    s = Phaser.Math.Clamp(s, 4, 10);
    return Math.round(s * 2) / 2;
  }

  fmtScore(v) { return String(v).replace('.', ','); }

  showScoreCard() {
    const j = this.jury;
    const box = this.add.container(j.x, j.head - 40).setDepth(1950);
    box.add(this.add.image(0, 0, 'score_card').setOrigin(0.5, 0.3));
    box.add(headText(this, 0, 0, this.fmtScore(this.scoreVal), 70, '#14081f', { strokeThickness: 0 }));
    box.setScale(0.3).setAlpha(0);
    this.tweens.add({ targets: box, y: j.head - 130, scale: 1, alpha: 1, duration: 420, ease: 'Back.Out' });
    this.tweens.add({ targets: box, angle: { from: -6, to: 6 }, yoyo: true, repeat: 3, duration: 160, delay: 420 });
    this.A.sfx.plus();
  }

  showResult() {
    this.mode = 'result';
    this.A.host.setPhase('result', STAGE);
    const box = this.add.container(960, 500).setDepth(1950).setAlpha(0);
    box.add(this.add.rectangle(0, 0, 1240, 620, 0x0b0418, 0.9).setStrokeStyle(6, 0xffd23f));
    box.add(headText(this, 0, -245, `KOMISIJOS BALAS: ${this.fmtScore(this.scoreVal)} / 10`, 66, C.yellow));
    const all = [...this.stats.values()];
    const poseTxt = { perfect: 'tobula', good: 'graži', late: 'pavėluota' }[this.poseQ] || '-';
    const rows = [
      [`Žingsniai į taktą: ${this.goodSteps}/${this.steps}   ·   Suklupo: ${this.stumbles} k.   ·   Laikas: ${this.elapsed.toFixed(1).replace('.', ',')} s`, C.white],
      [`Poza: ${poseTxt}   ·   Nuotraukų per pozą: ${this.posePhotos}`, C.white],
    ];
    const best = (k) => all.map((x) => [x, x.counts[k] || 0]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
    const foto = best('foto');
    if (foto) rows.push([`Daugiausiai nuotraukų: ${foto[0].name} (${foto[1]})`, C.green]);
    const clap = best('ploti');
    if (clap) rows.push([`Garsiausiai plojo: ${clap[0].name}`, C.yellow]);
    const wind = best('vejas');
    if (wind) rows.push([`Stipriausias vėjas: ${wind[0].name}`, C.teal]);
    const sn = best('sniegas');
    if (sn) rows.push([`Daugiausiai sniego: ${sn[0].name}`, '#f1e6ff']);
    rows.slice(0, 6).forEach(([r, c], i) => box.add(bodyText(this, 0, -150 + i * 54, r, 30, c)));
    const next = headText(this, 0, 250, 'ENTER - TOLIAU', 48, C.white);
    this.tweens.add({ targets: next, alpha: 0.3, yoyo: true, repeat: -1, duration: 650 });
    box.add(next);
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
  }

  // ---------------- klasiokų veiksmai ----------------
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
    this.stat(player, action);
    if (role === 'komisija') { this.juryAction(player, action); return; }
    const v = this.seats.get(player.pid);
    switch (action) {
      case 'ploti': this.clap(player, v); break;
      case 'foto': this.photo(player, v); break;
      case 'vejas': this.wind(player, v); break;
      case 'sniegas': this.snowCannon(player, v); break;
      default: break;
    }
  }

  clap(player, v) {
    const now = this.time.now;
    if (v) {
      this.tweens.add({ targets: v.box, y: v.y - 12 * v.s, yoyo: true, duration: 110 });
      this.kidBubble(v, 'Plo plo!', C.yellow, 26);
    }
    if (now - this.lastClapSfx > 120) { this.lastClapSfx = now; this.A.sfx.clap(); }
    this.clapTimes = this.clapTimes.filter((t) => now - t < 1000);
    if (this.clapTimes.length < 6) {
      this.clapTimes.push(now);
      this.shake(W.clap);
    }
    if (this.clapTimes.length >= 5) this.maybeSub(this.A.lines.pick('podiumas', 'clap'), C.yellow, 9000);
  }

  photo(player, v) {
    const now = this.time.now;
    if (this.photoOpen) this.posePhotos += 1;
    if (v) {
      const f = this.add.image(v.x, v.y - 110 * v.s, 'flash').setDepth(1450).setBlendMode(Phaser.BlendModes.ADD).setScale(0.2);
      this.tweens.add({ targets: f, scale: 1.3 * v.s + 0.3, alpha: 0, duration: 320, onComplete: () => f.destroy() });
      this.kidBubble(v, 'Klik!', C.white, 24);
    }
    if (now - this.lastFlash > 160) {
      this.lastFlash = now;
      this.A.sfx.shutter();
      this.bigFlash(this.photoOpen ? 0.22 : 0.1);
    }
  }

  wind(player, v) {
    const now = this.time.now;
    const from = v ? { x: v.x, y: v.y - 80 * v.s, side: v.side } : { x: rand(200, 1720), y: 700, side: Math.random() < 0.5 ? -1 : 1 };
    const p = this.adrPoint();
    const puff = this.add.image(from.x, from.y, 'wind_puff').setDepth(1400).setScale(0.6).setFlipX(from.side > 0);
    this.tweens.add({ targets: puff, x: p.x, y: p.y - 150 * p.s, scale: 1, duration: 420, ease: 'Sine.In' });
    this.tweens.add({ targets: puff, alpha: 0, delay: 380, duration: 220, onComplete: () => puff.destroy() });
    if (v) this.kidBubble(v, 'Fiuuu!', C.teal, 26);
    if (now - this.lastWind < 300) return;
    this.lastWind = now;
    this.time.delayedCall(400, () => {
      this.A.sfx.whoosh();
      if (this.mode === 'out' || this.mode === 'back' || this.mode === 'pose') this.lean += -from.side * 9;
      this.shake(W.wind);
      if (Math.random() < 0.3) this.maybeSub(this.A.lines.pick('podiumas', 'wind', { vardas: player.name }), C.teal, 4500);
    });
  }

  snowCannon(player, v) {
    const now = this.time.now;
    const from = v ? { x: v.x, y: v.y - 120 * v.s } : { x: rand(200, 1720), y: 700 };
    const p = this.adrPoint();
    const ahead = this.mode === 'back' ? -0.08 : 0.08;
    const u = Phaser.Math.Clamp(this.uView + ahead, 0, 1);
    const tx = 960 + rand(-0.5, 0.5) * runwayHW(u);
    const ty = runwayY(u);
    const puff = this.add.image(from.x, from.y, 'snow_puff').setDepth(1400).setScale(0.35);
    this.tweens.add({ targets: puff, x: tx, scale: 0.8, duration: 500 });
    this.tweens.add({ targets: puff, y: { value: ty - 30, ease: 'Quad.In' }, duration: 500 });
    this.tweens.add({
      targets: puff, alpha: 0, delay: 480, duration: 300,
      onComplete: () => {
        puff.destroy();
        const patch = this.add.ellipse(tx, ty, 150 * (S0 + (S1 - S0) * u), 36 * (S0 + (S1 - S0) * u), 0xf4f7ff, 0.95).setDepth(ty - 1);
        this.tweens.add({ targets: patch, alpha: 0, delay: 1200, duration: 600, onComplete: () => patch.destroy() });
      },
    });
    if (v) this.kidBubble(v, 'Sniegas!', '#f1e6ff', 26);
    this.A.sfx.snowPuff();
    if (now - this.lastSnow < 400) return;
    this.lastSnow = now;
    this.time.delayedCall(500, () => {
      this.slipUntil = this.time.now + 1500;
      this.shake(W.snow);
      if (this.mode === 'out' || this.mode === 'back') {
        const t = bodyText(this, p.x, p.y + 20, 'Slidu!', 30, C.teal).setDepth(1500);
        this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 900, onComplete: () => t.destroy() });
      }
      if (Math.random() < 0.3) this.maybeSub(this.A.lines.pick('podiumas', 'snow', { vardas: player.name }), '#f1e6ff', 4500);
    });
  }

  juryAction(player, action) {
    const j = this.jury;
    const vars = { mokytoja: teacherLabel(j.name) };
    if (action === 'bravo') {
      const t = headText(this, j.x, j.head - 90, 'BRAVO!', 64, C.yellow).setDepth(1600).setScale(0.4);
      this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.Out' });
      this.tweens.add({ targets: t, alpha: 0, y: t.y - 40, delay: 900, duration: 300, onComplete: () => t.destroy() });
      this.A.sfx.bravo();
      this.shake(W.bravo);
      this.maybeSub(this.A.lines.pick('podiumas', 'bravo', vars), C.yellow, 2000);
    } else if (action === 'zvilgsnis') {
      const t = bodyText(this, j.x, j.head - 90, 'Hmm...', 40, C.orange).setDepth(1600);
      this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, delay: 900, duration: 300, onComplete: () => t.destroy() });
      this.tweens.add({ targets: j.box, scaleX: j.scale * 1.08, yoyo: true, duration: 140 });
      if (this.mode === 'out' || this.mode === 'back') {
        const p = this.adrPoint();
        const o = bodyText(this, p.x + 80 * p.s, p.y - 300 * p.s, 'Oi...', 30, '#f1e6ff').setDepth(1500);
        this.tweens.add({ targets: o, alpha: 0, y: o.y - 30, delay: 700, duration: 300, onComplete: () => o.destroy() });
      }
      this.shake(W.look);
      this.maybeSub(this.A.lines.pick('podiumas', 'look', vars), C.orange, 2000);
    }
  }

  kidBubble(v, text, color = C.white, size = 26) {
    const t = bodyText(this, v.x, v.y - 175 * v.s - 10, text, size, color).setDepth(1500).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, y: t.y - 16, duration: 180, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, delay: 700, duration: 250, onComplete: () => t.destroy() });
  }

  bigFlash(alpha) {
    this.flashRect.setAlpha(alpha);
    this.tweens.killTweensOf(this.flashRect);
    this.tweens.add({ targets: this.flashRect, alpha: 0, duration: 160 });
  }

  // ---------------- piešimas ----------------
  makeLights() {
    // lemputės palei podiumo kraštus (mirksi pagal taktą)
    this.bulbs = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      for (const side of [-1, 1]) {
        const r = 4 + u * 5;
        const b = this.add.circle(960 + side * (runwayHW(u) - 6 - u * 4), runwayY(u) - 2, r, 0xffd23f).setDepth(runwayY(u) - 2);
        this.bulbs.push(b);
      }
    }
    this.spots = this.add.graphics().setDepth(40).setBlendMode(Phaser.BlendModes.ADD);
    this.foot = this.add.image(0, 0, 'footprint').setDepth(30).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    this.flashRect = this.add.rectangle(960, 540, 1920, 1080, 0xffffff, 1).setDepth(1940).setAlpha(0);
  }

  placeKids() {
    const host = this.A.host;
    for (const p of host.list()) if (!host.isTeacher(p.name)) this.addKid(p);
  }

  addKid(player) {
    if (this.seats.has(player.pid)) return null;
    const used = new Set([...this.seats.values()].map((v) => v.seat));
    const seat = SEATS.findIndex((_, i) => !used.has(i));
    if (seat < 0) return null;
    const S = SEATS[seat];
    const y = S.ground - 64 * S.s;
    const box = this.add.container(S.x, y).setScale(S.s).setDepth(S.ground);
    const body = this.add.image(0, 64, 'kid_body').setOrigin(0.5, 1).setTint(tintOf(player.name));
    const key = this.textures.exists(avatarKey(player.name)) ? avatarKey(player.name) : 'dot';
    const head = this.add.image(0, -110, key).setDisplaySize(96, 96);
    box.add([body, head]);
    const tag = bodyText(this, S.x, S.ground + 14 * S.s, player.name, Math.round(27 * S.s), C.yellow).setDepth(S.ground + 1);
    const v = { box, body, head, tag, name: player.name, pid: player.pid, x: S.x, y, s: S.s, side: S.side, seat };
    this.seats.set(player.pid, v);
    return v;
  }

  onLateJoin(player) {
    if (this.A.host.isTeacher(player.name)) return;
    this.addKid(player);
  }

  makeJury() {
    const t = this.A.host.teachers()[0];
    const name = t ? t.name : 'Daiva';
    const scale = 0.72;
    const box = this.add.container(JURY.x, JURY.y - 36).setScale(scale).setDepth(JURY.y - 2);
    const body = this.add.image(0, 0, 'teacher_body').setOrigin(0.5, 1);
    const faceKey = t && this.textures.exists(avatarKey(t.name)) ? avatarKey(t.name) : 'teacher_face';
    const face = this.add.image(0, -290, faceKey).setDisplaySize(104, 104);
    box.add([body, face]);
    this.add.image(JURY.x, JURY.y, 'jury_table').setOrigin(0.5, 1).setScale(0.8).setDepth(JURY.y);
    bodyText(this, JURY.x, JURY.y + 24, teacherLabel(name), 26, C.yellow).setDepth(JURY.y + 1);
    this.jury = { box, x: JURY.x, head: JURY.y - 36 - 290 * scale, name, scale };
  }

  makeAdriana() {
    const y = runwayY(0);
    this.adr = this.add.container(960, y).setScale(S0).setDepth(y + 5);
    this.adrInner = this.add.container(0, 0);
    this.adrBody = this.add.image(0, 0, 'adr_walk_a').setOrigin(0.5, 1);
    const face = this.textures.exists('adr_face');
    this.adrHead = this.add.image(2, -244, face ? 'adr_face' : 'adr_head').setOrigin(0.5, face ? 0.5 : 0.56);
    if (face) this.adrHead.setDisplaySize(118, 118);
    this.adrHeadBack = this.add.image(2, -244, 'adr_head_back').setOrigin(0.5, 0.56).setVisible(false);
    this.adrInner.add([this.adrBody, this.adrHead, this.adrHeadBack]);
    this.adr.add(this.adrInner);
    this.shadow = this.add.ellipse(960, y, 120, 26, 0x14081f, 0.35).setDepth(y + 4);
    this.poseRing = this.add.graphics().setDepth(1300).setVisible(false);
  }

  adrPoint() {
    const u = this.uView;
    return { x: 960, y: runwayY(u), s: S0 + (S1 - S0) * u };
  }

  makeHud() {
    const D = 1800;
    headText(this, 40, 54, STAGE.mission, 46, C.yellow).setOrigin(0, 0.5).setDepth(D);
    this.stumbleText = bodyText(this, 40, 108, 'Suklupo: 0', 26, '#f1e6ff').setOrigin(0, 0.5).setDepth(D);
    this.styleText = bodyText(this, 40, 142, 'Stilius: 0', 26, '#f1e6ff').setOrigin(0, 0.5).setDepth(D);
    // pusiausvyra
    bodyText(this, 1880, 40, 'Pusiausvyra', 24, '#f1e6ff').setOrigin(1, 0.5).setDepth(D);
    this.add.rectangle(1700, 76, 368, 26, 0x000000, 0.6).setStrokeStyle(3, 0x14081f).setDepth(D);
    this.balFill = this.add.rectangle(1518, 76, 360, 16, 0x3ddc84).setOrigin(0, 0.5).setDepth(D);
    // būsena
    this.stateText = headText(this, 960, 56, '', 44, C.white).setDepth(D);
    // ritmo juosta: taškai atkeliauja iš dešinės į apskritimą
    this.add.rectangle((TRACK.x0 + TRACK.x1) / 2, TRACK.y, TRACK.x1 - TRACK.x0, 76, 0x0b0418, 0.72).setStrokeStyle(4, 0xff3ea5).setDepth(D - 2);
    this.targetRing = this.add.circle(TRACK.target, TRACK.y, 31).setStrokeStyle(6, 0xffffff).setDepth(D);
    this.marks = [];
    for (let i = 0; i < 8; i++) {
      const c = this.add.container(0, TRACK.y).setDepth(D - 1).setVisible(false);
      const disc = this.add.circle(0, 0, 25, 0x2de2e6).setStrokeStyle(4, 0x14081f);
      const txt = headText(this, 0, -1, '←', 34, '#14081f', { strokeThickness: 0 });
      c.add([disc, txt]);
      this.marks.push({ c, disc, txt });
    }
    this.fb = headText(this, TRACK.target, TRACK.y + 64, '', 36, C.green).setDepth(D);
  }

  say(text, color) { this.stateText.setText(text).setColor(color); }

  feedback(text, color) {
    this.fb.setText(text).setColor(color).setAlpha(1).setScale(0.6);
    this.tweens.killTweensOf(this.fb);
    this.tweens.add({ targets: this.fb, scale: 1, duration: 120, ease: 'Back.Out' });
    this.tweens.add({ targets: this.fb, alpha: 0, delay: 500, duration: 250 });
  }

  maybeSub(text, color = C.white, gap = 2600) {
    if (!text || this.time.now - this.lastSub < gap) return;
    this.lastSub = this.time.now;
    this.sub(text, color);
  }

  sub(text, color) {
    subtitle(this, text, { color, y: 336 });
    if (this._subtitle) this._subtitle.setDepth(1700);
  }

  bigBanner(title, sub, opts) {
    banner(this, title, sub, opts).setDepth(1900);
  }

  updateTrack(now) {
    const walking = this.mode === 'out' || this.mode === 'back' || this.mode === 'count';
    const k0 = Math.max(COUNT_IN, Math.ceil((now - this.lat - this.t0 - 0.25) / BEAT));
    const next = this.lastFoot ? other(this.lastFoot) : 'L';
    const firstFree = Math.max(k0, this.lastStepBeat + 1);
    this.marks.forEach((m, i) => {
      const k = k0 + i;
      const x = TRACK.target + (this.heardTime(k) - now) / BEAT * TRACK.px;
      let show = x > TRACK.x0 + 20 && x < TRACK.x1 - 20;
      if (this.mode === 'pose') show = show && k === this.poseBeat && !this.poseQ;
      else if (!walking) show = false;
      m.c.setVisible(show);
      if (!show) return;
      m.c.x = x;
      if (this.mode === 'pose') {
        m.disc.setFillStyle(0xffd23f).setRadius(32);
        m.txt.setText('★');
      } else if (k <= this.lastStepBeat) {
        m.disc.setFillStyle(0x3ddc84).setRadius(25);
        m.txt.setText('✓');
      } else {
        const f = (k - firstFree) % 2 === 0 ? next : other(next);
        m.disc.setFillStyle(f === 'L' ? 0x2de2e6 : 0xff3ea5).setRadius(25);
        m.txt.setText(f === 'L' ? '←' : '→');
      }
      m.c.setAlpha(x < TRACK.target - 10 ? 0.4 : 1);
    });
  }

  // ---------------- ciklas ----------------
  update(_, deltaMs) {
    const dt = Math.min(deltaMs, 66) / 1000;
    const tnow = this.time.now;
    const live = this.mode !== 'intro';
    const now = live ? this.clock() : 0;

    if (live) {
      this.scheduleMusic(now);
      const k = Math.floor((now - this.lat - this.t0) / BEAT);
      if (k > this.lastBeat && k >= 0) {
        for (let b = this.lastBeat + 1; b <= k; b++) this.onBeat(b);
        this.lastBeat = k;
      }
    }

    const moving = this.mode === 'out' || this.mode === 'back';
    if (moving || this.mode === 'pose') {
      this.elapsed += dt;
      if (tnow >= this.fallUntil) this.wobble = Math.max(0, this.wobble - W.decay * dt);
    }
    this.lean -= this.lean * Math.min(1, dt * 2.5);

    // autoplay (testams): žingsniai tiksliai į taktą ir tobula poza
    if (this.autoplay && live) {
      if (moving && !this.walking && tnow >= this.fallUntil) {
        const k = this.lastStepBeat + 1;
        if (k >= COUNT_IN && now >= this.heardTime(k)) this.step(this.lastFoot ? other(this.lastFoot) : 'L', this.heardTime(k));
      } else if (this.mode === 'pose' && !this.poseQ && now >= this.heardTime(this.poseBeat)) {
        this.doPose(0);
      }
    }

    // poza: žiedas susitraukia iki takto; nepaspaudus - poza vis tiek padaroma
    if (this.mode === 'pose' && !this.poseQ) {
      const left = this.heardTime(this.poseBeat) - now;
      const p = this.adrPoint();
      const r = 70 + 260 * Phaser.Math.Clamp(left / (2 * BEAT), 0, 1);
      const cy = p.y - 150 * p.s;
      this.poseRing.clear();
      this.poseRing.lineStyle(10, 0xffd23f, 0.95).strokeCircle(p.x, cy, r);
      this.poseRing.lineStyle(4, 0xffffff, 0.8).strokeCircle(p.x, cy, 70);
      if (left < -POSE_WINDOW) this.doPose(null);
    }

    // Adriana: vieta, mastelis, svyravimas
    const p = this.adrPoint();
    this.adr.setPosition(p.x, p.y).setScale(p.s).setDepth(p.y + 5);
    this.shadow.setPosition(p.x, p.y + 2).setScale(p.s).setDepth(p.y + 4);
    if (tnow >= this.fallUntil && !this.tweens.isTweening(this.adrInner)) {
      const sway = (this.wobble / 100) * 12 * Math.sin(tnow / 1000 * 8);
      this.adrInner.angle = Phaser.Math.Clamp(this.lean + sway, -24, 24);
    }

    // švytintis kitas pėdsakas ir prožektoriai
    if (moving && live) {
      const phase = ((now - this.lat - this.t0) / BEAT) % 1;
      const out = this.mode === 'out';
      const nu = Phaser.Math.Clamp(this.uView + (out ? 1 / STEPS_OUT : -1 / STEPS_BACK), 0, 1);
      const ns = S0 + (S1 - S0) * nu;
      const nf = this.lastFoot ? other(this.lastFoot) : 'L';
      // iš priekio kairė koja ekrane kairėje, iš nugaros - atvirkščiai
      const side = (nf === 'L' ? -1 : 1) * (out ? 1 : -1);
      this.foot.setPosition(960 + side * 22 * ns, runwayY(nu) - 10 * ns).setScale(ns * 0.8)
        .setTint(nf === 'L' ? 0x2de2e6 : 0xff3ea5).setAlpha(0.25 + 0.6 * (1 - phase));
    } else {
      this.foot.setAlpha(0);
    }
    this.spots.clear();
    if (live && this.mode !== 'result') {
      const phase = ((now - this.lat - this.t0) / BEAT) % 1;
      const a = 0.06 + 0.08 * (1 - Math.max(0, phase));
      for (const sx of [380, 1540]) {
        this.spots.fillStyle(0xfff1c4, a);
        this.spots.fillTriangle(sx, -20, p.x - 90 * p.s, p.y + 10, p.x + 90 * p.s, p.y + 10);
      }
      this.spots.fillStyle(0xfff1c4, a * 0.7).fillEllipse(p.x, p.y, 220 * p.s, 46 * p.s);
    }

    // jei Adriana ilgai nežengia - priminimas
    if (moving && tnow - this.idleSince > 5000 && tnow >= this.fallUntil) {
      this.idleSince = tnow;
      this.feedback('SPAUSK ← →!', C.yellow);
    }

    if (live && this.mode !== 'result') this.updateTrack(now);
    else this.marks.forEach((m) => m.c.setVisible(false));

    const bal = 1 - this.wobble / 100;
    this.balFill.setSize(Math.max(1, 360 * bal), 16).setFillStyle(bal > 0.6 ? 0x3ddc84 : bal > 0.3 ? 0xff9a3c : 0xff4d5e);
    this.stumbleText.setText(`Suklupo: ${this.stumbles}`);
    this.styleText.setText(`Stilius: ${this.style}`);
  }
}
