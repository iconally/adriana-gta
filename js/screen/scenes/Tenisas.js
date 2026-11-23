// 8 etapas: "Tenisas" (Sereikiškių parkas, kortai tarp Gedimino kalno ir Vilnelės).
// Adriana prieš Sniego senį. Visa klasė - senio komanda: telefonuose balsuoja,
// kur senis muš kitą kamuoliuką (⬅️ kairė, ⬆️ centras, ➡️ dešinė). Dauguma laimi.
// Vienas taškas (~5 s):
//  1) klasė balsuoja 2,6 s - Adrianos pusėje šviečia trys zonos su balsų skaičiumi (keičiasi gyvai);
//  2) senis muša į laimėjusią zoną, kamuoliukas skrenda ~1,2 s;
//  3) Adriana ← → nubėga ir spaudžia TARPĄ, kai kamuoliukas pasiekia aukso ratą.
//     Atmušė - taškas Adrianai (tobulai - „ACE!“), nepataikė - taškas klasei.
// Vienas geimas tikru teniso skaičiavimu (15 - 30 - 40, lygu, persvara), ekrane vadinamas „mačas“.
// Visas etapas nuo „3-2-1“ iki rezultatų - ne ilgiau 40 s. Kai laiko lieka tik vienam taškui,
// skelbiamas „Paskutinis taškas!“; po jo laimi pirmaujantis, o esant lygiam - paskutinio taško laimėtojas.
// Mokytoja - teisėja ant bokštelio: „Aut! 🚩“ (kartą panaikina klasės tašką) ir
// „Tyla! 🤫“ (šio taško balsai slapti - Adriana nemato, kur krypsta dauguma).

import { headText, bodyText, banner, subtitle, missionCard, snow, C } from '../fx.js';
import { Tribune, avatarKey } from '../tribune.js';
import { STAGES } from '../stages.js';
import { proj } from '../art-tennis.js';

const STAGE = STAGES.tenisas;
const ZONES = [
  { id: 'kaire', u: -0.62, u0: -1, u1: -0.34, name: 'kairę', label: 'KAIRĖ', arrow: '⬅', emo: '⬅️' },
  { id: 'centras', u: 0, u0: -0.34, u1: 0.34, name: 'centrą', label: 'CENTRAS', arrow: '⬆', emo: '⬆️' },
  { id: 'desine', u: 0.62, u0: 0.34, u1: 1, name: 'dešinę', label: 'DEŠINĖ', arrow: '➡', emo: '➡️' },
];
const ZONE_BY_ID = Object.fromEntries(ZONES.map((z, i) => [z.id, i]));
const VOTE_MS = 2600;
const FLY1 = 1.0;             // s: nuo senio raketės iki atšokimo
const FLY2 = 0.48;            // s: nuo atšokimo iki Adrianos raketės
const THIT = FLY1 + FLY2;
const HIT_WIN = 0.2;          // s: kiek galima suklysti spaudžiant tarpą
const PERFECT = 0.07;         // s: tobulas smūgis - ACE
const REACH = 130;            // px: kiek toli nuo Adrianos kamuoliukas dar pasiekiamas
const RETURN_S = 0.7;
const POINT_MS = 1500;
const TOTAL_S = 40;          // visas etapas nuo 3-2-1 iki rezultatų lango
const POINT_EST = 6.4;       // s: vienas taškas (balsavimas + skrydis + pauzė)
const FINISH_S = 3.8;        // s: pergalės užrašas iki rezultatų
const ADR_D = -0.045;         // Adrianos linija (truputį už galinės linijos)
const HIT_H = 0.95;           // kamuoliuko aukštis smūgio metu
const BOUNCE_D = 0.28;
const ADR_S = 0.82;
const ADR_SPEED = 900;
const SNOW_D = 1.06;
const SNOW_S = 0.72;
const CHAIR = { x: 371, y: 576, s: 0.8 };
const SCORE = ['0', '15', '30', '40'];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const lerp = (a, b, t) => a + (b - a) * t;
const refLabel = (name) => `Teisėja ${String(name || 'Daiva').replace(/mokytoja\s*/i, '')}`;

export class TenisasScene extends Phaser.Scene {
  constructor() { super('Tenisas'); }

  create() {
    const A = window.AGTA;
    this.A = A;
    this.bornAt = Date.now();
    this.mode = 'intro'; // intro -> count -> (vote -> serve -> return|miss -> point) ... -> end -> result
    A.host.setPhase('intro', STAGE);
    this.lockVotes(true, false);
    A.host.lock('aut', undefined, false);

    // Phaser naudoja tą patį scenos objektą, todėl visą būseną nustatom iš naujo.
    this.adr = 0;
    this.klase = 0;
    this.served = 0;
    this.returned = 0;
    this.aces = 0;
    this.votes = new Map();     // pid -> zonos indeksas
    this.firstVote = new Map(); // pid -> ms
    this.switched = new Set();
    this.voteStart = 0;
    this.secret = false;
    this.secretNext = false;
    this.zone = 1;
    this.lastPoint = null;
    this.lastStrategists = [];
    this.autUsed = false;
    this.finalPoint = false;
    this.stageT = 0;
    this.stageStart = null;
    this.ball = null;
    // senas scenos paleidimas sunaikino kamuoliuką - kuriam iš naujo (kitaip antrą kartą jo nesimato)
    this.ballImg = null;
    this.ballShadow = null;
    this.ballGlow = null;
    this.trailT = 0;
    this.swingUntil = 0;
    this.adrX = 960;
    this.walkT = 0;
    this.celebrating = false;
    this.snowX = 960;
    this.elapsed = 0;
    this.lastSub = 0;
    this.stats = new Map();
    this.voteMarks = new Map();
    this.autoplay = !!this.autoplay;
    this.autoSwingAt = 0;

    this.add.image(960, 540, 'tennis_bg').setDepth(-100);
    snow(this, 700).setAlpha(0.6);
    this.zoneG = this.add.graphics().setDepth(5);
    this.zoneTxt = ZONES.map((z) => {
      const p = proj(z.u, 0.36);
      return headText(this, p.x, p.y, '', 64, C.white).setDepth(6).setAlpha(0.95);
    });
    this.ringG = this.add.graphics().setDepth(955);
    this.makeSnowman();
    this.makeReferee();
    this.makeAdriana();
    this.makeHud();

    this.tribune = new Tribune(this, A.host, { y: 1006, maxSize: 64 });
    this.card = missionCard(this, {
      nr: STAGE.nr,
      mission: STAGE.mission,
      title: `${STAGE.title} - Sereikiškių parkas`,
      tip: A.lines.pick('tenisas', 'intro'),
      controls: 'Klasė: balsuok telefone, kur muš Sniego senis (⬅️ ⬆️ ➡️).   Adriana: ← → bėk, TARPAS - smūgis, kai kamuoliukas pasiekia aukso ratą.',
    });
    this.card.setDepth(1900);

    const kb = this.input.keyboard;
    this.keysLR = kb.addKeys('LEFT,RIGHT,A,D');
    kb.on('keydown-ENTER', () => this.onEnter());
    kb.on('keydown-SPACE', () => { if (this.mode === 'intro') this.onEnter(); else this.swing(); });
    kb.on('keydown-R', () => this.scene.restart());

    const offs = [A.host.on('press', (e) => this.onPress(e))];
    // Virtualūs vaikai balsuoja patys; pusė jų „gudrūs“ - renkasi zoną toliausiai nuo Adrianos.
    A.host.botPick = (p) => {
      if (this.mode !== 'vote' || A.host.roles[p.pid] !== 'senio') return null;
      const t = this.time.now - this.voteStart;
      const cur = this.votes.get(p.pid);
      if (cur == null) {
        if (t < 350 || Math.random() > 0.3) return null;
        return Math.random() < 0.5 ? ZONES[this.farZone()].id : pick(ZONES).id;
      }
      if (t > VOTE_MS - 1200 && !this.switched.has(p.pid) && Math.random() < 0.05) {
        return pick(ZONES.filter((z, i) => i !== cur)).id;
      }
      return null;
    };
    A.host.botFilter = (p, btn) => {
      if (btn === 'aut') return this.lastPoint === 'klase' && !this.autUsed && Math.random() < 0.2;
      if (btn === 'tyla') return this.mode === 'vote' && Math.random() < 0.15;
      return false;
    };
    this.events.once('shutdown', () => {
      offs.forEach((f) => f());
      A.host.botFilter = null;
      A.host.botPick = null;
      for (const z of ZONES) A.host.lock(z.id, undefined, false);
      A.host.lock('aut', undefined, false);
      A.host.setStatus(null);
    });
  }

  lockVotes(locked, sync = true) {
    ZONES.forEach((z, i) => this.A.host.lock(z.id, locked ? null : undefined, sync && i === ZONES.length - 1));
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
    this.stageStart = this.game.loop.time; // tikras laikas (scenos laikrodis ką tik sukurtoje scenoje dar būna 0)
    this.tweens.add({ targets: this.card, alpha: 0, duration: 300, onComplete: () => this.card.destroy() });
    const nums = ['3', '2', '1', 'GO!'];
    nums.forEach((n, i) => {
      this.time.delayedCall(i * 700, () => {
        const t = headText(this, 960, 470, n, 240, i === nums.length - 1 ? C.yellow : C.white).setDepth(1960);
        t.setScale(1.8).setAlpha(0);
        this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 200, ease: 'Back.Out' });
        this.tweens.add({ targets: t, alpha: 0, delay: 480, duration: 200, onComplete: () => t.destroy() });
        if (i === nums.length - 1) {
          this.A.sfx.go();
          this.A.host.setPhase('play', STAGE);
          this.sub(this.A.lines.pick('tenisas', 'start'), C.yellow);
          this.time.delayedCall(500, () => this.startVote());
        } else this.A.sfx.count();
      });
    });
  }

  scoreInfo() {
    const a = this.adr; const k = this.klase;
    if (a >= 3 && k >= 3) {
      if (a === k) return { l: '40', r: '40', note: 'LYGU' };
      return a > k ? { l: 'P', r: '40', note: 'PERSVARA - ADRIANA' } : { l: '40', r: 'P', note: 'PERSVARA - KLASĖ' };
    }
    return { l: SCORE[Math.min(a, 3)], r: SCORE[Math.min(k, 3)], note: '' };
  }

  scoreStr() { const s = this.scoreInfo(); return `${s.l}:${s.r}`; }

  startVote() {
    this.mode = 'vote';
    this.votes = new Map();
    this.firstVote = new Map();
    this.switched = new Set();
    this.voteStart = this.time.now;
    this.secret = this.secretNext;
    this.secretNext = false;
    for (const m of this.voteMarks.values()) m.destroy();
    this.voteMarks.clear();
    const host = this.A.host;
    this.lockVotes(false, false);
    const by = {};
    for (const p of host.list()) if (host.isTeacher(p.name)) by[p.pid] = { text: `Klasė balsuoja · ${this.scoreStr()}`, tone: 'go' };
    host.setStatus({ text: 'Kur muš senis? Balsuok! ⬅️ ⬆️ ➡️', tone: 'go', holder: true }, by);
    this.say(this.secret ? 'BALSAI SLAPTI 🤫' : 'KLASĖ BALSUOJA!', C.yellow);
    this.maybeSub(this.A.lines.pick('tenisas', 'vote'), '#f1e6ff', 3000);
    this.A.sfx.pop();
    this.voteTimer = this.time.delayedCall(VOTE_MS, () => this.serve());
    this.tweens.add({ targets: this.snowBox, y: this.snowBox.y - 10, yoyo: true, repeat: 3, duration: 300 });
  }

  counts() {
    const n = [0, 0, 0];
    for (const z of this.votes.values()) n[z] += 1;
    return n;
  }

  farZone() {
    let best = 0; let bd = -1;
    ZONES.forEach((z, i) => { const d = Math.abs(proj(z.u, ADR_D).x - this.adrX); if (d > bd) { bd = d; best = i; } });
    return best;
  }

  serve() {
    if (this.mode !== 'vote') return;
    const n = this.counts();
    const max = Math.max(...n);
    const top = [0, 1, 2].filter((i) => n[i] === max);
    this.zone = pick(top);
    this.secret = false;
    this.mode = 'serve';
    this.served += 1;
    this.lockVotes(true, false);
    const z = ZONES[this.zone];
    this.A.host.setStatus({ text: `Senis muša į ${z.name}! ${z.emo}`, tone: 'wait' });
    this.say(`SENIS MUŠA Į ${z.label}! ${z.arrow}`, C.teal);
    // senis pasislenka ir muša
    const u0 = Phaser.Math.Clamp((this.snowX - 960) / 368 + rand(-0.15, 0.15), -0.6, 0.6);
    this.snowX = 960 + u0 * 368;
    this.tweens.add({ targets: this.snowBox, x: this.snowX, duration: 140 });
    this.tweens.add({ targets: this.snowArm, angle: { from: -80, to: 35 }, duration: 160, yoyo: true, hold: 60, onComplete: () => this.snowArm.setAngle(-30) });
    this.A.sfx.pok();
    const ut = z.u + rand(-0.08, 0.08);
    this.ball = { kind: 'in', t: 0, u0: u0 + 0.38, ut, hit: false };
    this.makeBall();
    this.ballImg.setVisible(true).setAlpha(1);
    this.ballGlow.setVisible(true).setAlpha(0.45);
    this.ballShadow.setVisible(true).setAlpha(1);
    this.bounced = false;
    this.target = { x: proj(ut, ADR_D).x, y: proj(ut, ADR_D, HIT_H).y, gy: proj(ut, ADR_D).y };
    this.autoSwingAt = Math.random() < 0.78 ? THIT + rand(-0.06, 0.06) : null;
    // vaikų rodyklės - kas balsavo už laimėjusią zoną
    for (const [pid, m] of this.voteMarks) m.setVisible(true).setAlpha(this.votes.get(pid) === this.zone ? 1 : 0.35);
  }

  makeBall() {
    if (this.ballImg) return;
    this.ballShadow = this.add.image(0, 0, 'tn_shadow').setDepth(330).setVisible(false);
    this.ballGlow = this.add.circle(0, 0, 30, 0xfff27a, 0.45).setDepth(958).setVisible(false);
    this.ballImg = this.add.image(0, 0, 'tn_ball').setDepth(960).setVisible(false);
  }

  // Kamuoliuko vieta pagal laiką (u, d, h -> ekranas).
  ballPos(b) {
    if (b.kind === 'in') {
      if (b.t <= FLY1) {
        const s = b.t / FLY1;
        return proj(lerp(b.u0, b.ut, s), lerp(1.0, BOUNCE_D, s), lerp(1.6, 0, s) + 1.0 * Math.sin(Math.PI * s));
      }
      const s = (b.t - FLY1) / FLY2;
      return proj(b.ut, lerp(BOUNCE_D, ADR_D, s), Math.max(0, HIT_H * Math.sin((Math.PI / 2) * s)));
    }
    // atgal pas senį
    const s = b.t / RETURN_S;
    return proj(lerp(b.ut, b.ur, s), lerp(ADR_D, 1.12, s), lerp(HIT_H, 0.3, s) + 1.1 * Math.sin(Math.PI * Math.min(s, 1)));
  }

  ballGround(b) {
    if (b.kind === 'in') {
      if (b.t <= FLY1) { const s = b.t / FLY1; return proj(lerp(b.u0, b.ut, s), lerp(1.0, BOUNCE_D, s)); }
      const s = (b.t - FLY1) / FLY2;
      return proj(b.ut, lerp(BOUNCE_D, ADR_D, s));
    }
    const s = b.t / RETURN_S;
    return proj(lerp(b.ut, b.ur, s), lerp(ADR_D, 1.12, s));
  }

  swing() {
    if (!['vote', 'serve', 'point'].includes(this.mode) || this.time.now < this.swingUntil) return;
    this.swingUntil = this.time.now + 350;
    const b = this.ball;
    const side = b && this.mode === 'serve' && this.target.x < this.adrX - 20 ? -1 : 1;
    this.racket.setX(side * 46).setScale(side, 1);
    this.tweens.killTweensOf(this.racket);
    this.racket.setAngle(side * -70);
    this.tweens.add({ targets: this.racket, angle: side * 80, duration: 140, yoyo: true, onComplete: () => this.racket.setAngle(side * 20) });
    this.A.sfx.whoosh();
    if (this.mode !== 'serve' || !b || b.kind !== 'in' || b.hit) return;
    const dt = b.t - THIT;
    const dx = Math.abs(this.target.x - this.adrX);
    if (Math.abs(dt) <= HIT_WIN && dx <= REACH) this.returnBall(Math.abs(dt) <= PERFECT);
  }

  returnBall(perfect) {
    const b = this.ball;
    b.hit = true;
    this.returned += 1;
    if (perfect) this.aces += 1;
    this.A.sfx.pok();
    this.ringG.clear();
    // senis bėga ne į tą pusę ir nepasiekia
    const ur = (this.snowX > 960 ? -1 : 1) * rand(0.45, 0.85);
    this.ball = { kind: 'out', t: 0, ut: b.ut, ur, ace: perfect };
    this.mode = 'return';
    const lunge = Phaser.Math.Clamp(this.snowX + (ur > 0 ? -90 : 90), 760, 1160);
    this.tweens.add({ targets: this.snowBox, x: lunge, angle: ur > 0 ? -18 : 18, duration: 260, yoyo: true, hold: 200, onComplete: () => this.snowBox.setAngle(0) });
    if (perfect) {
      this.pop(this.adrX, this.target.y - 80, 'ACE! 🔥', C.yellow, 64);
      this.cameras.main.shake(140, 0.004);
    } else this.pop(this.adrX, this.target.y - 70, 'ATMUŠTA!', C.pink, 44);
  }

  miss() {
    this.mode = 'miss';
    this.ringG.clear();
    this.A.sfx.plunk();
    this.pop(this.target.x, this.target.y - 60, 'PRALEISTA', C.teal, 40);
    this.time.delayedCall(450, () => this.endPoint('klase'));
  }

  endPoint(who, ace = false) {
    if (this.mode === 'point' || this.mode === 'end') return;
    this.mode = 'point';
    if (this.ballImg) this.tweens.add({ targets: [this.ballImg, this.ballShadow, this.ballGlow], alpha: 0, duration: 200 });
    this.ball = null;
    const host = this.A.host;
    this.lastPoint = who;
    this.lastStrategists = [];
    this.say(who === 'adr' ? (ace ? 'ACE! TAŠKAS ADRIANAI!' : 'TAŠKAS ADRIANAI!') : 'TAŠKAS KLASEI!', who === 'adr' ? C.pink : C.teal);
    if (who === 'adr') {
      this.adr += 1;
      this.A.sfx.plus();
      this.A.sfx.bravo();
      this.celebrate();
      this.tweens.add({ targets: this.snowBox, angle: { from: -14, to: 14 }, yoyo: true, repeat: 2, duration: 120, onComplete: () => this.snowBox.setAngle(0) });
      this.sub(this.A.lines.pick('tenisas', ace ? 'ace' : 'adr_point'), ace ? C.yellow : C.pink);
    } else {
      this.klase += 1;
      this.A.sfx.bravo();
      this.tweens.add({ targets: this.snowBox, y: this.snowBox.y - 34, yoyo: true, repeat: 1, duration: 170 });
      this.sub(this.A.lines.pick('tenisas', 'klase_point'), C.teal);
      for (const [pid, z] of this.votes) {
        if (z !== this.zone) continue;
        const p = host.players.get(pid);
        if (p) { this.stat(p, 'strateg'); this.lastStrategists.push(p); this.tribune.bounce(pid); }
      }
    }
    this.updateScore();
    this.time.delayedCall(450, () => this.callScore());
    const s = this.scoreStr();
    const by = {};
    for (const p of host.list()) {
      if (host.isTeacher(p.name)) by[p.pid] = { text: `${who === 'adr' ? 'Adrianos' : 'Klasės'} taškas · ${s}${who === 'klase' && !this.autUsed ? ' · galite „Aut!“' : ''}`, tone: 'go' };
      else if (who === 'klase' && this.votes.get(p.pid) === this.zone) by[p.pid] = { text: `Tavo balsas laimėjo! 🎉 ${s}`, tone: 'go' };
    }
    host.setStatus(who === 'klase' ? { text: `Taškas klasei! 🎉 ${s}`, tone: 'go' } : { text: `Adriana atmušė! ${s}`, tone: 'wait' }, by);
    this.time.delayedCall(POINT_MS, () => this.afterPoint());
  }

  // Teisėja garsiai paskelbia rezultatą (kaip tikra teniso teisėja).
  callScore() {
    if (this.mode !== 'point') return;
    const i = this.scoreInfo();
    const w = this.winner();
    let text = `${i.l} : ${i.r}`;
    if (w) text = 'MAČAS!';
    else if (i.note === 'LYGU') text = 'LYGU!';
    else if (i.note) text = this.adr > this.klase ? 'PERSVARA - ADRIANA!' : 'PERSVARA - KLASĖ!';
    this.refSay(text, C.white);
  }

  winner() {
    const a = this.adr; const k = this.klase;
    if (a >= 4 && a - k >= 2) return 'adr';
    if (k >= 4 && k - a >= 2) return 'klase';
    return null;
  }

  afterPoint() {
    if (this.mode !== 'point') return;
    let w = this.winner();
    const left = TOTAL_S - this.stageT - FINISH_S;
    if (!w && left < POINT_EST) {
      // laikas baigėsi: laimi pirmaujantis, esant lygiam - paskutinio taško laimėtojas
      if (this.adr !== this.klase) w = this.adr > this.klase ? 'adr' : 'klase';
      else w = this.lastPoint === 'klase' ? 'klase' : 'adr';
    }
    if (w) { this.finish(w); return; }
    if (left < 2 * POINT_EST) {
      this.finalPoint = true;
      this.updateScore();
      this.maybeSub(this.A.lines.pick('tenisas', 'last'), C.orange, 0); // nustato lastSub - balsavimo replika jo neperrašys
      this.startVote();
      return;
    }
    const info = this.scoreInfo();
    if (info.note === 'LYGU') this.maybeSub(this.A.lines.pick('tenisas', 'deuce'), C.yellow, 0);
    else if (info.note) this.maybeSub(this.A.lines.pick('tenisas', this.adr > this.klase ? 'adv_adr' : 'adv_klase'), C.yellow, 0);
    this.startVote();
  }

  celebrate() {
    this.celebrating = true;
    this.adrBody.setTexture('adr_pose');
    this.adrHeadBack.setVisible(false);
    this.adrHead.setVisible(true);
    this.racket.setVisible(false);
    this.tweens.add({ targets: this.adrBox, y: this.adrY - 26, yoyo: true, duration: 180, repeat: 1 });
    this.time.delayedCall(950, () => {
      this.celebrating = false;
      this.adrBody.setTexture('adr_back_a');
      this.adrHeadBack.setVisible(true);
      this.adrHead.setVisible(false);
      this.racket.setVisible(true).setAngle(20).setX(46).setScale(1, 1);
    });
  }

  finish(w) {
    this.mode = 'end';
    this.winnerSide = w;
    this.lockVotes(true);
    this.ringG.clear();
    this.zoneG.clear();
    this.zoneTxt.forEach((t) => t.setText(''));
    for (const m of this.voteMarks.values()) m.destroy();
    this.voteMarks.clear();
    // tablo: laimėtas mačas 1 : 0
    this.sbL.setText(w === 'adr' ? '1' : '0');
    this.sbR.setText(w === 'adr' ? '0' : '1');
    this.sbNote.setText(w === 'adr' ? 'MAČAS - ADRIANA!' : 'MAČAS - KLASĖ!');
    this.A.host.setStatus({ text: w === 'adr' ? 'Mačą laimėjo Adriana! Žiūrėk į ekraną' : 'Mačą laimėjo klasė! 🎉 Žiūrėk į ekraną', tone: 'go' });
    this.A.sfx.win();
    this.say('', C.yellow);
    if (w === 'adr') {
      this.bigBanner('MAČAS - ADRIANA!', '+100 RESPEKTO', { color: C.yellow, hold: 2800 });
      this.celebrate();
    } else {
      this.bigBanner('MAČAS - KLASĖ!', 'PUIKI KOVA! +100 RESPEKTO', { color: C.teal, hold: 2800 });
    }
    this.time.delayedCall(1300, () => this.sub(this.A.lines.pick('tenisas', w === 'adr' ? 'win_adr' : 'win_klase'), C.yellow, 760));
    this.time.delayedCall(3600, () => this.showResult());
  }

  showResult() {
    this.mode = 'result';
    this.A.host.setPhase('result', STAGE);
    const box = this.add.container(960, 500).setDepth(1950).setAlpha(0);
    box.add(this.add.rectangle(0, 0, 1240, 620, 0x0b0418, 0.9).setStrokeStyle(6, 0xffd23f));
    box.add(headText(this, 0, -245, 'TENISO MAČAS BAIGTAS!', 66, C.yellow));
    const all = [...this.stats.values()];
    const rows = [
      [`Mačą laimėjo: ${this.winnerSide === 'adr' ? 'Adriana' : 'klasė (Sniego senio komanda)'}   ·   Taškai ${this.adr} : ${this.klase}`, C.white],
      [`Adriana atmušė: ${this.returned} iš ${this.served}   ·   ACE: ${this.aces}`, C.white],
    ];
    const best = (k) => all.map((x) => [x, x.counts[k] || 0]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
    const strat = best('strateg');
    if (strat) rows.push([`Gudriausias strategas: ${strat[0].name} (${strat[1]} ${strat[1] === 1 ? 'taškas' : 'taškai'} klasei)`, C.teal]);
    const fast = all.filter((x) => x.fast != null).sort((a, b) => a.fast - b.fast)[0];
    if (fast) rows.push([`Greičiausias balsuotojas: ${fast.name} (${(fast.fast / 1000).toFixed(1).replace('.', ',')} s)`, C.green]);
    const sw = best('persigalvojo');
    if (sw) rows.push([`Daugiausia kartų persigalvojo: ${sw[0].name} (${sw[1]})`, C.yellow]);
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

  unstat(who, key) {
    const st = this.stats.get(who.pid || who.name);
    if (st && st.counts[key]) st.counts[key] -= 1;
  }

  onPress({ player, action, role }) {
    this.tribune.bounce(player.pid);
    if (this.mode === 'intro' || this.mode === 'result') return;
    if (role === 'teiseja') { this.refAction(player, action); return; }
    const zi = ZONE_BY_ID[action];
    if (zi == null || this.mode !== 'vote') return;
    const prev = this.votes.get(player.pid);
    if (prev === zi) return;
    if (prev == null) {
      const ms = this.time.now - this.voteStart;
      this.firstVote.set(player.pid, ms);
      const st = this.stat(player, 'balsavo');
      st.fast = st.fast == null ? ms : Math.min(st.fast, ms);
    } else {
      this.switched.add(player.pid);
      this.stat(player, 'persigalvojo');
    }
    this.votes.set(player.pid, zi);
    this.A.sfx.click();
    this.markVote(player.pid, zi);
  }

  markVote(pid, zi) {
    const pos = this.tribune.pos(pid);
    if (!pos) return;
    let m = this.voteMarks.get(pid);
    if (!m) {
      m = headText(this, pos.x, pos.y - 18, '', 30, C.yellow).setDepth(620);
      this.voteMarks.set(pid, m);
    }
    m.setText(ZONES[zi].arrow).setPosition(pos.x, pos.y - 18).setVisible(!this.secret);
    m.setScale(1.5);
    this.tweens.add({ targets: m, scale: 1, duration: 160 });
  }

  refAction(player, action) {
    const vars = { teiseja: refLabel(this.refName) };
    if (action === 'aut') {
      if (!this.autUsed && this.lastPoint === 'klase' && this.klase > 0 && this.mode !== 'end' && this.mode !== 'result') {
        this.autUsed = true;
        this.klase -= 1;
        this.lastPoint = null;
        for (const p of this.lastStrategists) this.unstat(p, 'strateg');
        this.lastStrategists = [];
        this.A.host.lock('aut', null);
        this.refSay('AUT! 🚩', C.orange);
        this.A.sfx.whistle();
        this.sub(this.A.lines.pick('tenisas', 'aut', vars), C.orange);
        this.updateScore();
      } else {
        this.refSay('👍', C.green);
        this.maybeSub(this.A.lines.pick('tenisas', 'aut_no', vars), C.green, 1500);
      }
    } else if (action === 'tyla') {
      if (this.mode === 'vote') this.secret = true; else this.secretNext = true;
      for (const m of this.voteMarks.values()) if (this.mode === 'vote') m.setVisible(false);
      if (this.mode === 'vote') this.say('BALSAI SLAPTI 🤫', C.yellow);
      this.refSay('Ššš! 🤫', C.teal);
      this.A.sfx.shh();
      this.maybeSub(this.A.lines.pick('tenisas', 'tyla', vars), C.teal, 1500);
    }
  }

  // ---------------- piešimas ----------------
  makeSnowman() {
    const p = proj(0, SNOW_D);
    this.snowBox = this.add.container(960, p.y).setScale(SNOW_S).setDepth(300);
    const body = this.add.image(0, 0, 'tn_snowman').setOrigin(0.5, 1);
    this.snowArm = this.add.image(44, -144, 'tn_snow_arm').setOrigin(6 / 210, 0.5).setAngle(-30);
    this.snowBox.add([body, this.snowArm]);
  }

  makeReferee() {
    const t = this.A.host.teachers()[0];
    this.refName = t ? t.name : 'Daiva';
    this.add.image(CHAIR.x, CHAIR.y, 'tn_chair').setOrigin(0.5, 1).setScale(CHAIR.s).setDepth(320);
    const box = this.add.container(CHAIR.x, 455).setScale(0.42).setDepth(321);
    const body = this.add.image(0, 0, 'teacher_body').setOrigin(0.5, 1);
    const faceKey = t && this.textures.exists(avatarKey(t.name)) ? avatarKey(t.name) : 'teacher_face';
    const face = this.add.image(0, -290, faceKey).setDisplaySize(104, 104);
    box.add([body, face]);
    this.refBox = box;
    this.add.image(CHAIR.x, 425, 'tn_chair_front').setScale(CHAIR.s).setDepth(322);
    bodyText(this, CHAIR.x, CHAIR.y + 22, refLabel(this.refName), 22, C.yellow).setDepth(323);
  }

  refSay(text, color) {
    const t = headText(this, CHAIR.x + 40, 290, text, 44, color).setDepth(1600).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 180, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, delay: 900, duration: 300, onComplete: () => t.destroy() });
    this.tweens.add({ targets: this.refBox, angle: { from: -6, to: 6 }, yoyo: true, duration: 120, onComplete: () => this.refBox.setAngle(0) });
  }

  makeAdriana() {
    this.adrY = proj(0, ADR_D).y;
    this.adrBox = this.add.container(this.adrX, this.adrY).setScale(ADR_S).setDepth(950);
    this.adrBody = this.add.image(0, 0, 'adr_back_a').setOrigin(0.5, 1);
    this.adrHeadBack = this.add.image(2, -244, 'adr_head_back').setOrigin(0.5, 0.56);
    const face = this.textures.exists('adr_face');
    this.adrHead = this.add.image(2, -244, face ? 'adr_face' : 'adr_head').setOrigin(0.5, face ? 0.5 : 0.56).setVisible(false);
    if (face) this.adrHead.setDisplaySize(118, 118);
    this.racket = this.add.image(46, -118, 'tn_racket').setOrigin(0.5, 0.94).setAngle(20);
    this.adrBox.add([this.adrBody, this.adrHeadBack, this.adrHead, this.racket]);
  }

  makeHud() {
    const D = 1800;
    headText(this, 40, 54, STAGE.mission, 46, C.yellow).setOrigin(0, 0.5).setDepth(D);
    const sb = this.add.container(1010, 54).setDepth(D);
    sb.add(this.add.rectangle(0, 0, 520, 80, 0x0b0418, 0.85).setStrokeStyle(4, 0xffd23f));
    this.sbL = headText(this, -60, 2, '0', 52, C.white);
    this.sbR = headText(this, 60, 2, '0', 52, C.white);
    sb.add([
      headText(this, -180, 2, 'ADRIANA', 34, C.pink),
      this.sbL,
      headText(this, 0, 0, ':', 48, C.white),
      this.sbR,
      headText(this, 180, 2, 'KLASĖ ⛄', 34, C.teal),
    ]);
    this.sbNote = headText(this, 1010, 112, '', 28, C.yellow).setDepth(D);
    this.timerText = bodyText(this, 1880, 40, '⏱ 0:40', 30, '#f1e6ff').setOrigin(1, 0.5).setDepth(D);
    this.stateText = headText(this, 1010, 160, '', 40, C.yellow).setDepth(D);
  }

  updateScore() {
    const s = this.scoreInfo();
    this.sbL.setText(s.l);
    this.sbR.setText(s.r);
    this.sbNote.setText(this.finalPoint ? `PASKUTINIS TAŠKAS${s.note ? ' · ' + s.note : ''}` : s.note);
    for (const t of [this.sbL, this.sbR]) { t.setScale(1.4); this.tweens.add({ targets: t, scale: 1, duration: 200 }); }
  }

  say(text, color) { this.stateText.setText(text).setColor(color); }

  pop(x, y, text, color, size = 40) {
    const t = headText(this, x, y, text, size, color).setDepth(1600).setScale(0.5);
    this.tweens.add({ targets: t, scale: 1, duration: 150, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: y - 60, delay: 600, duration: 300, onComplete: () => t.destroy() });
  }

  maybeSub(text, color = C.white, gap = 2600) {
    if (!text || this.time.now - this.lastSub < gap) return;
    this.lastSub = this.time.now;
    this.sub(text, color);
  }

  sub(text, color, y = 470) {
    subtitle(this, text, { color, y });
    if (this._subtitle) this._subtitle.setDepth(1700);
  }

  bigBanner(title, sub, opts) {
    banner(this, title, sub, opts).setDepth(1900);
  }

  drawZones() {
    const g = this.zoneG;
    g.clear();
    const voting = this.mode === 'vote';
    const serving = this.mode === 'serve' || this.mode === 'miss';
    if (!voting && !serving) { this.zoneTxt.forEach((t) => t.setText('')); return; }
    const n = this.counts();
    const total = Math.max(1, this.votes.size);
    const max = Math.max(...n);
    ZONES.forEach((z, i) => {
      const pts = [proj(z.u0, 0.47), proj(z.u1, 0.47), proj(z.u1, 0.03), proj(z.u0, 0.03)];
      let fill = 0x2de2e6; let alpha = 0.12; let line = 0x2de2e6; let lw = 3;
      if (voting && !this.secret) { alpha = 0.1 + 0.4 * (n[i] / total); if (max > 0 && n[i] === max) { fill = 0xffd23f; line = 0xffd23f; lw = 6; } }
      if (serving) { const on = i === this.zone; fill = on ? 0xffd23f : 0x2de2e6; alpha = on ? 0.4 : 0.05; line = on ? 0xffd23f : 0x2de2e6; lw = on ? 6 : 2; }
      g.fillStyle(fill, alpha);
      g.lineStyle(lw, line, 0.9);
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (const q of pts.slice(1)) g.lineTo(q.x, q.y);
      g.closePath();
      g.fillPath();
      g.strokePath();
      const txt = voting ? (this.secret ? `${z.arrow} ?` : `${z.arrow} ${n[i]}`) : (i === this.zone ? z.arrow : '');
      this.zoneTxt[i].setText(txt).setColor(voting && !this.secret && max > 0 && n[i] === max ? C.yellow : C.white);
    });
    if (voting) {
      const left = Math.max(0, Math.ceil((VOTE_MS - (this.time.now - this.voteStart)) / 1000));
      this.stateText.setText(`${this.secret ? 'BALSAI SLAPTI 🤫' : 'KLASĖ BALSUOJA!'}  ${left}`);
    }
  }

  // ---------------- ciklas ----------------
  update(_, deltaMs) {
    const dt = Math.min(deltaMs, 66) / 1000;
    const active = ['vote', 'serve', 'return', 'miss', 'point'].includes(this.mode);
    if (active) this.elapsed += dt;
    if (this.stageStart != null && this.mode !== 'result') this.stageT = (this.game.loop.time - this.stageStart) / 1000;
    const left = Math.max(0, TOTAL_S - this.stageT);
    this.timerText.setText(`⏱ ${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`).setColor(left <= 15 && this.mode !== 'result' ? C.red : '#f1e6ff');

    // Adrianos judėjimas
    let dir = 0;
    if (active && !this.celebrating) {
      const k = this.keysLR;
      if (k.LEFT.isDown || k.A.isDown) dir -= 1;
      if (k.RIGHT.isDown || k.D.isDown) dir += 1;
      if (this.autoplay) {
        let goal = null;
        if (this.mode === 'vote' && this.votes.size) { const n = this.counts(); goal = proj(ZONES[n.indexOf(Math.max(...n))].u, ADR_D).x; }
        if (this.mode === 'serve') goal = this.target.x - 70;
        if (goal != null && Math.abs(goal - this.adrX) > 14) dir = goal > this.adrX ? 1 : -1;
      }
    }
    if (dir) {
      const xMin = proj(-1.05, ADR_D).x; const xMax = proj(1.05, ADR_D).x;
      this.adrX = Phaser.Math.Clamp(this.adrX + dir * ADR_SPEED * dt, xMin, xMax);
      this.walkT += dt;
      if (this.walkT > 0.13) { this.walkT = 0; this.adrBody.setTexture(this.adrBody.texture.key === 'adr_back_a' ? 'adr_back_b' : 'adr_back_a'); }
    }
    this.adrBox.x = this.adrX;

    this.drawZones();

    // kamuoliukas: kol klasė balsuoja - senis jį muša į žemę prie savęs
    if (this.mode === 'vote') {
      this.makeBall();
      const bx = this.snowBox.x + 70;
      const by = proj(0, SNOW_D).y - 8 - Math.abs(Math.sin(this.time.now / 170)) * 46;
      this.ballImg.setVisible(true).setAlpha(1).setPosition(bx, by).setScale(0.75);
      this.ballGlow.setVisible(true).setAlpha(0.45).setPosition(bx, by).setScale(0.75);
      this.ballShadow.setVisible(true).setAlpha(1).setPosition(bx, proj(0, SNOW_D).y - 4).setScale(0.5);
    }
    const b = this.ball;
    if (b) {
      b.t += dt;
      const p = this.ballPos(b);
      const gnd = this.ballGround(b);
      const sc = Math.max(0.75, p.s * 1.35);
      this.ballImg.setPosition(p.x, p.y).setScale(sc).setAngle(this.ballImg.angle + 720 * dt);
      this.ballGlow.setPosition(p.x, p.y).setScale(sc);
      this.ballShadow.setPosition(gnd.x, gnd.y).setScale(Math.max(0.35, gnd.s));
      // šviesus pėdsakas - kad kamuoliuką būtų lengva sekti akimis
      this.trailT += dt;
      if (this.trailT > 0.03 && this.ballImg.visible) {
        this.trailT = 0;
        const f = this.add.circle(p.x, p.y, 11 * sc, 0xfff27a, 0.6).setDepth(957);
        this.tweens.add({ targets: f, alpha: 0, scale: 0.3, duration: 260, onComplete: () => f.destroy() });
      }
      if (b.kind === 'in') {
        if (!this.bounced && b.t >= FLY1) { this.bounced = true; this.A.sfx.tick(); }
        // laiko ratas: didelis ratas traukiasi iki aukso rato
        const g = this.ringG;
        g.clear();
        if (!b.hit && b.t < THIT + HIT_WIN) {
          const r0 = 46;
          const r = r0 + Math.max(0, 1 - b.t / THIT) * 150;
          g.fillStyle(0xffd23f, 0.25);
          g.fillEllipse(this.target.x, this.target.gy, 150, 34);
          g.lineStyle(6, 0xffd23f, 1);
          g.strokeCircle(this.target.x, this.target.y, r0);
          g.lineStyle(4, 0xffffff, 0.85);
          g.strokeCircle(this.target.x, this.target.y, r);
        }
        if (this.autoplay && this.autoSwingAt != null && b.t >= this.autoSwingAt) { this.autoSwingAt = null; this.swing(); }
        if (!b.hit && b.t > THIT + HIT_WIN + 0.02 && this.mode === 'serve') this.miss();
        if (b.t > THIT + 0.9) { this.ballImg.setVisible(false); this.ballGlow.setVisible(false); this.ballShadow.setVisible(false); }
      } else {
        if (b.ace && Math.random() < 0.8) {
          const f = this.add.circle(p.x + rand(-8, 8), p.y + rand(-8, 8), rand(6, 12), pick([0xff7a3c, 0xffd23f, 0xff3ea5]), 0.9).setDepth(955);
          this.tweens.add({ targets: f, alpha: 0, scale: 0.2, duration: 380, onComplete: () => f.destroy() });
        }
        if (b.t >= RETURN_S && this.mode === 'return') this.endPoint('adr', b.ace);
      }
    }
  }
}
