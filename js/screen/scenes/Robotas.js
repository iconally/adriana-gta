// 9 etapas: "Dovanų robotas" (programavimo būrelis prie Baltojo tilto).
// Vienas sudėtingesnis žemėlapis: vingiuotas kelias iki eglės su keliomis aklavietėmis.
// Kelio valytojai: kiekvienas prisijungęs vaikas turi savo pusnį ant to kelio. Šalia pusnies -
// besmegenis su vaiko veidu ir kastuvu; vaikas spaudžia „Kasti ❄️“, besmegenis kasa, pusnis mažėja,
// po 8 kasimų pusnis ir besmegenis dingsta. Kelias vienas, todėl reikia išvalyti VISAS pusnis.
// Adriana programuoja robotą: rodyklės - komandos (vienodos iš eilės sujungiamos: ➡×4),
// BACKSPACE - ištrinti paskutinę, TARPAS (ar ENTER) - ▶ PALEISTI. Robotas, užvažiavęs ant neišvalytos
// pusnies, į gilų sniegą ar nuo kilimėlio - „BUG! 🐞“: grįžta į startą, kodas lieka.
// Mokytoja - būrelio vadovė: „Padėti 🧹“ (artimiausiai neišvalytai pusniai - 5 s; jei vaikas
// neišvalo, išvalo mokytoja) ir „Greičiau ⏩“. Atsijungusio vaiko pusnis po 5 s ištirpsta pati.
// Kas išvalė savo pusnį - leidžia fejerverkus virš Baltojo tilto (savo spalva ir su vardu).
// Visas etapas nuo „3-2-1“ iki rezultatų - ne ilgiau 45 s.

import { headText, bodyText, banner, subtitle, missionCard, C } from '../fx.js';
import { Tribune, avatarKey } from '../tribune.js';
import { STAGES } from '../stages.js';
import { MAT, matProj, cellU, cellD, cellCenter } from '../art-robot.js';

const STAGE = STAGES.robotas;
// Kelias nuo starto iki eglės (stulpelis c 0-7, eilė r 0-5; r = 0 - tolimiausia).
// 18 žingsnių (➡×6 ⬆×2 ⬅×4 ⬆×2 ➡×4), viduryje 17 langelių - po vieną pusnį kiekvienam vaikui.
const ROUTE = [
  [0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [6, 4], [6, 3], [5, 3], [4, 3], [3, 3],
  [2, 3], [2, 2], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1],
];
// Aklavietės: kelio gabaliukai, kurie niekur neveda (kad žemėlapis nebūtų per lengvas).
const SPURS = [[7, 5], [7, 3], [1, 3], [3, 0]];
const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
const BLOCK = {
  U: { arrow: '⬆', col: 0x1fc2c6 },
  D: { arrow: '⬇', col: 0xff9a3c },
  L: { arrow: '⬅', col: 0xff3ea5 },
  R: { arrow: '➡', col: 0x8a5cff },
};
const MAX_STEPS = 40;
const MAX_BLOCKS = 13;
const DIG_HITS = 8;
const HELP_MS = 5000;
const STEP_MS = 300;
const TOTAL_S = 45;
const FINISH_S = 3.8;
const BAR = { x: 960, y: 160, w: 1320, h: 100, size: 74, gap: 10 };
const PANEL = { x: 1700, y: 300 };
const ADR = { x: 115, y: 935, s: 0.62 };
const TEACH = { x: 1800, y: 790, s: 0.5 };
const SKY = { x: 600, y: 240, w: 720, h: 280 }; // lango į Baltąjį tiltą vieta fone
const FW_COLORS = [0xff3ea5, 0x2de2e6, 0xffd23f, 0x3ddc84, 0xff7a3c, 0x8a5cff, 0xffffff, 0xff2bd6];
const ORDINAL = ['', 'pirmo', 'antro', 'trečio', 'ketvirto', 'penkto', 'šešto', 'septinto', 'aštunto', 'devinto', 'dešimto'];

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const key = (c, r) => `${c},${r}`;
const leaderLabel = (name) => `Vadovė ${String(name || 'Daiva').replace(/mokytoja\s*/i, '')}`;
const START = ROUTE[0];
const GOAL = ROUTE[ROUTE.length - 1];
const ROAD = new Set([...ROUTE, ...SPURS].map(([c, r]) => key(c, r)));

export class RobotasScene extends Phaser.Scene {
  constructor() { super('Robotas'); }

  create() {
    const A = window.AGTA;
    this.A = A;
    this.bornAt = Date.now();
    this.mode = 'intro'; // intro -> count -> (edit -> run -> bug)... -> end -> result
    A.host.setPhase('intro', STAGE);

    // Phaser naudoja tą patį scenos objektą, todėl visą būseną nustatom iš naujo.
    this.code = [];
    this.blocks = [];
    this.piles = [];            // { pid, name, idx, c, r, hits, cleared, ... }
    this.pileAt = new Map();    // "c,r" -> pusnis
    this.runs = 0;
    this.bugs = 0;
    this.won = false;
    this.fast = false;
    this.stepIdx = 0;
    this.digStart = 0;
    this.teacherCleared = 0;
    this.stats = new Map();
    this.lastSub = 0;
    this.stageStart = null;
    this.stageT = 0;
    this.offlineCheck = 0;
    this.fwActive = 0;
    this.fwSoundAt = 0;
    this.fwNagAt = new Map();
    this.autoplay = !!this.autoplay;
    this.autoPlan = null;
    this.autoNextAt = 0;
    this.autoMistake = false;

    this.add.image(960, 540, 'robot_bg').setDepth(-100);
    this.matG = this.add.graphics().setDepth(2);
    this.drawMat();
    this.makeSky();
    this.makeCodeBar();
    this.makePanel();
    this.makeTeacher();
    this.makeAdriana();
    this.makeHud();
    const gp = cellCenter(...GOAL);
    this.goalImg = this.add.image(gp.x, gp.y, 'rb_goal').setOrigin(0.5, 0.85).setScale(0.95 * gp.s).setDepth(100 + gp.y * 0.1);
    this.robot = this.add.container(0, 0);
    this.robotImg = this.add.image(0, 0, 'rb_robot').setOrigin(0.5, 0.92);
    this.robotGift = this.add.image(0, -70, 'rb_gift').setScale(0.42);
    this.robot.add([this.robotImg, this.robotGift]);
    this.placeRobot(...START);
    this.makePiles();

    this.tribune = new Tribune(this, A.host, { y: 1006, maxSize: 64 });
    this.card = missionCard(this, {
      nr: STAGE.nr,
      mission: STAGE.mission,
      title: `${STAGE.title} - programavimo būrelis prie Baltojo tilto`,
      tip: A.lines.pick('robotas', 'intro'),
      controls: 'Klasė: kask savo pusnį telefone (❄️ 8 kartus) - be visų robotas eglės nepasieks!   Adriana: ← ↑ → ↓ - kodas, BACKSPACE - trinti, TARPAS - ▶ paleisti.',
    });
    this.card.setDepth(1900);

    const kb = this.input.keyboard;
    const arrow = (d) => (e) => { if (!e.repeat) this.addStep(d); };
    kb.on('keydown-UP', arrow('U'));
    kb.on('keydown-DOWN', arrow('D'));
    kb.on('keydown-LEFT', arrow('L'));
    kb.on('keydown-RIGHT', arrow('R'));
    kb.on('keydown-BACKSPACE', () => this.delStep());
    kb.on('keydown-ENTER', () => { if (this.mode === 'edit') this.run(); else this.onEnter(); });
    kb.on('keydown-SPACE', () => { if (this.mode === 'intro') this.onEnter(); else this.run(); });
    kb.on('keydown-R', () => this.scene.restart());
    // atsarginis „Padėti“ vedėjai (jei mokytojos telefonas neprisijungęs)
    kb.on('keydown-P', () => { if (['edit', 'run', 'bug'].includes(this.mode)) this.leaderAction('padeti'); });

    const offs = [A.host.on('press', (e) => this.onPress(e))];
    // Virtualūs vaikai kasa patys; vienas „užsižiopsojęs“ pradeda kasti tik kai mokytoja paragina.
    A.host.botPick = (p) => {
      if (this.mode !== 'edit' && this.mode !== 'run' && this.mode !== 'bug') return null;
      const pile = this.piles.find((x) => x.pid === p.pid);
      if (!pile || pile.cleared) return Math.random() < 0.08 ? 'fejerverkas' : null;
      if (pile.lazy && !pile.helpUntil) return null;
      return Math.random() < 0.35 ? 'kasti' : null;
    };
    A.host.botFilter = (p, btn) => {
      if (btn === 'padeti') return this.mode !== 'count' && this.piles.some((x) => !x.cleared && x.lazy && !x.helpUntil) && Math.random() < 0.6;
      if (btn === 'greiciau') return this.mode === 'run' && Math.random() < 0.15;
      return false;
    };
    this.events.once('shutdown', () => {
      offs.forEach((f) => f());
      A.host.botFilter = null;
      A.host.botPick = null;
      A.host.setStatus(null);
    });
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
    this.makePiles(); // pusnys - tiek, kiek vaikų prisijungę dabar
    this.tweens.add({ targets: this.card, alpha: 0, duration: 300, onComplete: () => this.card.destroy() });
    const nums = ['3', '2', '1', 'KASAM!'];
    nums.forEach((n, i) => {
      this.time.delayedCall(i * 700, () => {
        const t = headText(this, 960, 470, n, i === nums.length - 1 ? 180 : 240, i === nums.length - 1 ? C.yellow : C.white).setDepth(1960);
        t.setScale(1.8).setAlpha(0);
        this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 200, ease: 'Back.Out' });
        this.tweens.add({ targets: t, alpha: 0, delay: 480, duration: 200, onComplete: () => t.destroy() });
        if (i === nums.length - 1) {
          this.A.sfx.go();
          this.A.host.setPhase('play', STAGE);
          this.digStart = this.time.now;
          this.sub(this.A.lines.pick('robotas', 'start'), C.yellow);
          this.time.delayedCall(300, () => this.startEdit());
        } else this.A.sfx.count();
      });
    });
  }

  // Kilimėlis: kelias (tamsus) ir gilus sniegas aplink.
  drawMat() {
    const g = this.matG;
    g.clear();
    const corner = (c, r) => matProj(cellU(c), cellD(r));
    for (let r = 0; r < MAT.rows; r++) {
      for (let c = 0; c < MAT.cols; c++) {
        const road = ROAD.has(key(c, r));
        const isStart = c === START[0] && r === START[1];
        g.fillStyle(isStart ? 0x3ddc84 : road ? ((c + r) % 2 ? 0x34406e : 0x3a487a) : ((c + r) % 2 ? 0xeaf2ff : 0xf6faff), 1);
        g.fillPoints([corner(c, r), corner(c + 1, r), corner(c + 1, r + 1), corner(c, r + 1)], true);
      }
    }
    g.lineStyle(2, 0x9fb4e6, 0.6);
    for (let c = 0; c <= MAT.cols; c++) g.lineBetween(corner(c, 0).x, corner(c, 0).y, corner(c, MAT.rows).x, corner(c, MAT.rows).y);
    for (let r = 0; r <= MAT.rows; r++) g.lineBetween(corner(0, r).x, corner(0, r).y, corner(MAT.cols, r).x, corner(MAT.cols, r).y);
    // kelio vidurio brūkšneliai
    g.lineStyle(3, 0xffd23f, 0.55);
    for (let i = 0; i < ROUTE.length - 1; i++) {
      const a = cellCenter(...ROUTE[i]); const b = cellCenter(...ROUTE[i + 1]);
      g.lineBetween(a.x + (b.x - a.x) * 0.3, a.y + (b.y - a.y) * 0.3, a.x + (b.x - a.x) * 0.7, a.y + (b.y - a.y) * 0.7);
    }
    g.lineStyle(8, 0x2de2e6, 1);
    g.strokePoints([corner(0, 0), corner(MAT.cols, 0), corner(MAT.cols, MAT.rows), corner(0, MAT.rows)], true);
    const sp = cellCenter(...START);
    if (!this.startTxt) this.startTxt = bodyText(this, sp.x, sp.y + 26 * sp.s, 'START', Math.round(17 * sp.s), '#14081f', { strokeThickness: 0 }).setDepth(4);
  }

  // Pusnys: po vieną kiekvienam prisijungusiam vaikui, tolygiai išdėstytos ant kelio.
  makePiles() {
    for (const p of this.piles) { p.img.destroy(); p.fig.destroy(); if (p.tag) p.tag.destroy(); if (p.helpTxt) p.helpTxt.destroy(); }
    this.piles = [];
    this.pileAt.clear();
    const host = this.A.host;
    const kids = Phaser.Utils.Array.Shuffle(host.list().filter((p) => !host.isTeacher(p.name)));
    const inner = ROUTE.length - 2; // be starto ir eglės
    const n = Math.min(kids.length, inner);
    const lazyIdx = n >= 5 ? Math.floor(Math.random() * n) : -1;
    for (let k = 0; k < n; k++) {
      const idx = 1 + Math.floor(((k + 0.5) * inner) / n);
      const [c, r] = ROUTE[idx];
      const kid = kids[k];
      const p = cellCenter(c, r);
      const s = p.s;
      const img = this.add.image(p.x + 16 * s, p.y + 6 * s, 'rb_pile').setOrigin(0.5, 0.8).setScale(0.62 * s).setDepth(100 + p.y * 0.1 + 0.02);
      const fig = this.add.container(p.x - 44 * s, p.y + 10 * s).setScale(0.82 * s).setDepth(100 + p.y * 0.1 + 0.01);
      const body = this.add.image(0, 0, 'rb_digger').setOrigin(0.5, 1);
      const avKey = this.textures.exists(avatarKey(kid.name)) ? avatarKey(kid.name) : 'dot';
      const head = this.add.image(0, -86, avKey).setDisplaySize(46, 46);
      if (avKey === 'dot') head.setTint(0x5a2a86);
      const shovel = this.add.image(26, -58, 'rb_shovel').setOrigin(0.5, 0.08).setAngle(-25);
      fig.add([body, head, shovel]);
      const tag = bodyText(this, p.x - 44 * s, p.y + 20 * s, kid.name, Math.round(15 * s), C.white).setDepth(100 + p.y * 0.1 + 0.03);
      const pile = { pid: kid.pid, name: kid.name, idx, c, r, hits: 0, cleared: false, img, fig, shovel, tag, base: 0.62 * s, lazy: !!kid.bot && k === lazyIdx, helpUntil: 0, helpTxt: null };
      this.piles.push(pile);
      this.pileAt.set(key(c, r), pile);
    }
    this.updatePanel();
  }

  placeRobot(c, r) {
    this.rc = c; this.rr = r;
    const p = cellCenter(c, r);
    this.robot.setPosition(p.x, p.y).setScale(0.72 * p.s).setDepth(100 + p.y * 0.1 + 0.05).setAlpha(1);
  }

  remaining() { return this.piles.filter((p) => !p.cleared); }

  phoneStatus() {
    const host = this.A.host;
    const by = {};
    const left = this.remaining().length;
    for (const p of this.piles) {
      if (p.cleared) by[p.pid] = { text: p.byTeacher ? 'Tavo pusnį išvalė mokytoja. Leisk fejerverkus! 🎆' : 'Tavo pusnis išvalyta! ✅ Leisk fejerverkus 🎆', tone: 'go' };
      else if (p.helpUntil) by[p.pid] = { text: '⏳ Kask greičiau! Mokytoja padės po 5 s', tone: 'go', holder: true };
      else by[p.pid] = { text: `Kask savo pusnį! ❄️ Spausk „Kasti“ ${DIG_HITS} kartus`, tone: 'go', holder: !p.hits };
    }
    for (const p of host.list()) if (host.isTeacher(p.name)) by[p.pid] = { text: `Liko pusnių: ${left} iš ${this.piles.length} · 🧹 Padėti tam, kas nekasa`, tone: 'go' };
    const all = this.mode === 'run' ? { text: 'Robotas važiuoja... 🤖', tone: 'wait' } : { text: left ? 'Kaskite pusnis! ❄️' : 'Kelias išvalytas! 🎉', tone: 'go' };
    host.setStatus(all, by);
  }

  startEdit() {
    this.mode = 'edit';
    this.phoneStatus();
    this.say(this.code.length ? 'PATAISYK KODĄ IR PALEISK!' : 'RAŠYK KODĄ: ← ↑ → ↓', C.yellow);
    this.autoNextAt = this.time.now + 600;
  }

  // ---------------- kodas ----------------
  blocksOf(code) {
    const out = [];
    code.forEach((d, i) => {
      const last = out[out.length - 1];
      if (last && last.d === d) { last.n += 1; last.to = i; } else out.push({ d, n: 1, from: i, to: i });
    });
    return out;
  }

  addStep(d) {
    if (this.mode !== 'edit') return;
    const bl = this.blocksOf([...this.code, d]);
    if (this.code.length >= MAX_STEPS || bl.length > MAX_BLOCKS) { this.A.sfx.sour(); return; }
    this.code.push(d);
    this.A.sfx.click();
    this.redrawBar(true);
  }

  delStep() {
    if (this.mode !== 'edit' || !this.code.length) return;
    this.code.pop();
    this.A.sfx.pop();
    this.redrawBar();
  }

  // Kodo vykdymas be animacijos (automatiniam režimui).
  simulate(code) {
    let [c, r] = START;
    for (let i = 0; i < code.length; i++) {
      const [dc, dr] = DIRS[code[i]];
      c += dc; r += dr;
      if (c < 0 || r < 0 || c >= MAT.cols || r >= MAT.rows) return { ok: false, at: i, why: 'wall' };
      if (!ROAD.has(key(c, r))) return { ok: false, at: i, why: 'snow' };
      const pile = this.pileAt.get(key(c, r));
      if (pile && !pile.cleared) return { ok: false, at: i, why: 'pile' };
      if (c === GOAL[0] && r === GOAL[1]) return { ok: true, at: i };
    }
    return { ok: false, at: code.length, why: 'end' };
  }

  routeCode() {
    const out = [];
    for (let i = 1; i < ROUTE.length; i++) {
      const dc = ROUTE[i][0] - ROUTE[i - 1][0]; const dr = ROUTE[i][1] - ROUTE[i - 1][1];
      out.push(Object.keys(DIRS).find((d) => DIRS[d][0] === dc && DIRS[d][1] === dr));
    }
    return out;
  }

  run() {
    if (this.mode !== 'edit') return;
    if (!this.code.length) { this.pop(BAR.x, BAR.y + 80, 'Pirma parašyk kodą!', C.orange, 34); this.A.sfx.sour(); return; }
    this.mode = 'run';
    this.runs += 1;
    this.phoneStatus();
    this.say(`▶ VYKDOMA${this.fast ? '  ⏩ x2' : ''}`, C.green);
    this.maybeSub(this.A.lines.pick('robotas', 'run'), C.green, 2000);
    this.stepIdx = 0;
    this.redrawBar();
    this.time.delayedCall(250, () => this.step());
  }

  stepMs() { return this.fast ? STEP_MS / 2 : STEP_MS; }

  step() {
    if (this.mode !== 'run') return;
    const i = this.stepIdx;
    if (i >= this.code.length) { this.bug('end', i); return; }
    this.markStep(i, 'run');
    const [dc, dr] = DIRS[this.code[i]];
    const nc = this.rc + dc; const nr = this.rr + dr;
    const off = nc < 0 || nr < 0 || nc >= MAT.cols || nr >= MAT.rows;
    const snow = !off && !ROAD.has(key(nc, nr));
    const pile = !off && this.pileAt.get(key(nc, nr));
    const blocked = pile && !pile.cleared;
    const ms = this.stepMs();
    if (off || blocked) {
      // pajuda link kliūties ir atšoka
      const p0 = cellCenter(this.rc, this.rr);
      const p1 = off ? { x: p0.x + dc * 60, y: p0.y + dr * 40 } : cellCenter(nc, nr);
      this.tweens.add({ targets: this.robot, x: p0.x + (p1.x - p0.x) * 0.4, y: p0.y + (p1.y - p0.y) * 0.4, duration: ms * 0.5, yoyo: true, onComplete: () => this.bug(off ? 'wall' : 'pile', i, pile) });
      return;
    }
    const p = cellCenter(nc, nr);
    this.A.sfx.step();
    if (snow) {
      // įklimpsta giliame sniege
      this.tweens.add({ targets: this.robot, x: p.x, y: p.y + 14 * p.s, scale: 0.72 * p.s, duration: ms * 0.85, ease: 'Sine.Out', onComplete: () => { this.rc = nc; this.rr = nr; this.bug('snow', i); } });
      return;
    }
    this.tweens.add({ targets: this.robot, x: p.x, y: p.y, scale: 0.72 * p.s, duration: ms * 0.85, ease: 'Sine.InOut' });
    this.tweens.add({ targets: this.robotImg, y: -12, duration: ms * 0.42, yoyo: true });
    this.time.delayedCall(ms * 0.88, () => {
      if (this.mode !== 'run') return;
      this.rc = nc; this.rr = nr;
      this.robot.setDepth(100 + p.y * 0.1 + 0.05);
      if (nc === GOAL[0] && nr === GOAL[1]) { this.success(); return; }
      this.stepIdx += 1;
      this.time.delayedCall(ms * 0.12, () => this.step());
    });
  }

  bug(why, i, pile) {
    if (this.mode !== 'run') return;
    this.mode = 'bug';
    this.bugs += 1;
    this.fast = false;
    this.robotImg.setTexture('rb_robot_bug');
    this.markStep(Math.min(i, this.code.length - 1), 'bug');
    this.A.sfx.fail();
    this.cameras.main.shake(160, 0.004);
    const p = cellCenter(this.rc, this.rr);
    this.pop(p.x, p.y - 150 * p.s, 'BUG! 🐞', C.red, 60);
    const texts = { end: 'KODAS BAIGĖSI PER ANKSTI 🐞', snow: 'ĮKLIMPO SNIEGE 🐞', wall: 'NUO KILIMĖLIO! 🐞', pile: 'PUSNIS KELYJE! 🐞' };
    this.say(texts[why], C.red);
    if (why === 'pile' && pile) {
      this.sub(`${pile.name}, kask! Tavo pusnis dar kelyje! ❄️`, C.orange);
      this.tweens.add({ targets: pile.fig, angle: { from: -12, to: 12 }, yoyo: true, repeat: 3, duration: 90, onComplete: () => pile.fig.setAngle(0) });
      this.A.host.cue(pile.pid, 'Robotas atsitrenkė į tavo pusnį - kask! ❄️', { tone: 'go' });
    } else this.sub(this.A.lines.pick('robotas', `bug_${why}`), C.orange);
    this.time.delayedCall(1300, () => {
      if (this.mode !== 'bug') return;
      this.tweens.add({
        targets: this.robot, alpha: 0, duration: 180, onComplete: () => {
          this.placeRobot(...START);
          this.robotImg.setTexture('rb_robot');
          this.robot.setAlpha(0);
          this.tweens.add({ targets: this.robot, alpha: 1, duration: 180 });
          this.maybeSub(this.A.lines.pick('robotas', 'fix'), C.yellow, 0);
          this.startEdit();
        },
      });
    });
  }

  success() {
    this.mode = 'win';
    this.won = true;
    this.robotImg.setTexture('rb_robot_joy');
    this.goalImg.setTexture('rb_goal_lit');
    this.tweens.add({ targets: this.goalImg, scale: this.goalImg.scale * 1.2, yoyo: true, duration: 200, repeat: 1 });
    // dovanos po egle
    const g = cellCenter(...GOAL);
    this.tweens.add({ targets: this.robotGift, alpha: 0, duration: 200 });
    for (let k = 0; k < 4; k++) {
      const gi = this.add.image(g.x + (k - 1.5) * 26 * g.s, g.y + 8 * g.s, 'rb_gift').setScale(0).setDepth(this.goalImg.depth + 0.01);
      this.tweens.add({ targets: gi, scale: 0.4 * g.s, delay: k * 120, duration: 220, ease: 'Back.Out' });
    }
    for (let k = 0; k < 6; k++) this.time.delayedCall(k * 160, () => this.firework(g.x + rand(-160, 160), g.y - rand(100, 260) * g.s));
    // didysis finalas virš Baltojo tilto
    for (let k = 0; k < 16; k++) this.time.delayedCall(k * 110, () => this.firework2(null, true));
    this.A.sfx.win();
    this.say('VEIKIA! ✅', C.green);
    this.sub(this.A.lines.pick('robotas', 'win'), C.green);
    this.celebrate();
    this.time.delayedCall(1200, () => this.finish('win'));
  }

  // ---------------- pusnių kasimas ----------------
  dig(pile, by = 'kid') {
    if (pile.cleared) return;
    if (by === 'kid') {
      pile.hits += 1;
      pile.lastHitAt = this.time.now;
      this.tweens.killTweensOf(pile.shovel);
      pile.shovel.setAngle(-25);
      this.tweens.add({ targets: pile.shovel, angle: 55, duration: 110, yoyo: true });
      const left = Math.max(0, 1 - pile.hits / DIG_HITS);
      pile.img.setScale(pile.base * (0.35 + 0.65 * left));
      for (let k = 0; k < 4; k++) {
        const f = this.add.circle(pile.img.x + rand(-20, 20), pile.img.y - 20, rand(3, 6), 0xffffff).setDepth(1500);
        this.tweens.add({ targets: f, x: f.x + rand(-50, 50), y: f.y - rand(30, 70), alpha: 0, duration: 420, onComplete: () => f.destroy() });
      }
      this.A.sfx.snowPuff();
      if (pile.hits < DIG_HITS) return;
    }
    pile.cleared = true;
    pile.byTeacher = by !== 'kid';
    pile.helpUntil = 0;
    if (pile.helpTxt) { pile.helpTxt.destroy(); pile.helpTxt = null; }
    if (by === 'kid') {
      const st = this.stat({ pid: pile.pid, name: pile.name }, 'isvale');
      st.ms = this.time.now - this.digStart;
      this.firework2(pile.name);
    } else this.teacherCleared += 1;
    this.tweens.add({ targets: [pile.img, pile.fig, pile.tag], scale: 0, alpha: 0, duration: 320, ease: 'Back.In' });
    const p = cellCenter(pile.c, pile.r);
    this.pop(p.x, p.y - 70 * p.s, by === 'kid' ? '✅' : by === 'sun' ? '☀️' : '🧹', C.green, 44);
    this.A.sfx.plus();
    this.tribune.bounce(pile.pid);
    const left = this.remaining().length;
    if (!left) {
      this.say('KELIAS IŠVALYTAS! 🎉', C.green);
      this.maybeSub(this.A.lines.pick('robotas', 'all_clear'), C.green, 0);
      this.A.sfx.bravo();
    } else if (left <= 3) this.maybeSub(`Liko ${left}: ${this.remaining().map((x) => x.name).join(', ')}!`, C.yellow, 1500);
    this.updatePanel();
    this.phoneStatus();
  }

  // Mokytoja (ar saulė - atsijungusiam vaikui) pažymi artimiausią neišvalytą pusnį: 5 s vaikui, paskui išvalo pati.
  help(by = 'teacher') {
    // artimiausia pusnis, kurios vaikas nekasa (2 s nespaudė); jei visi kasa - tiesiog artimiausia
    const now = this.time.now;
    const open = this.remaining().filter((p) => !p.helpUntil).sort((a, b) => a.idx - b.idx);
    const cand = open.find((p) => !p.lastHitAt || now - p.lastHitAt > 2000) || open[0];
    if (!cand) return false;
    cand.helpUntil = now + HELP_MS;
    cand.helpBy = by;
    const p = cellCenter(cand.c, cand.r);
    cand.helpTxt = headText(this, p.x - 20 * p.s, p.y - 120 * p.s, '⏳ 5', 34, C.yellow).setDepth(1550);
    this.tweens.add({ targets: cand.fig, y: cand.fig.y - 10, yoyo: true, repeat: 2, duration: 120 });
    this.A.host.cue(cand.pid, by === 'sun' ? 'Tavo pusnis tirpsta pati ☀️' : '⏳ Kask greičiau! Mokytoja padės po 5 s', { tone: 'go' });
    this.phoneStatus();
    return true;
  }

  // ---------------- klasė ----------------
  stat(who, k) {
    const id = who.pid || who.name;
    const st = this.stats.get(id) || { name: who.name, counts: {} };
    st.counts[k] = (st.counts[k] || 0) + 1;
    this.stats.set(id, st);
    return st;
  }

  onPress({ player, action, role }) {
    this.tribune.bounce(player.pid);
    if (this.mode === 'intro' || this.mode === 'result' || this.mode === 'count') return;
    if (role === 'vadove') { this.leaderAction(action); return; }
    if (action === 'fejerverkas') {
      const own = this.piles.find((x) => x.pid === player.pid);
      if (own && !own.cleared) {
        // pirma - darbas: fejerverkai tik išvalius savo pusnį
        const now = this.time.now;
        if (now - (this.fwNagAt.get(player.pid) || 0) > 3000) {
          this.fwNagAt.set(player.pid, now);
          const p = cellCenter(own.c, own.r);
          this.pop(p.x - 30 * p.s, p.y - 110 * p.s, 'Pirma kask! ❄️', C.orange, 24);
          this.A.host.cue(player.pid, 'Pirma išvalyk savo pusnį! ❄️', { tone: 'go' });
        }
        return;
      }
      this.stat(player, 'fejerverkai');
      this.firework2(player.name);
      return;
    }
    if (action !== 'kasti' || this.mode === 'end') return;
    const pile = this.piles.find((x) => x.pid === player.pid);
    if (pile) this.dig(pile);
  }

  leaderAction(action) {
    const vars = { vadove: leaderLabel(this.teacherName) };
    if (action === 'padeti' && this.mode !== 'end') {
      if (this.help('teacher')) {
        this.teacherSay('🧹', C.yellow);
        this.maybeSub(this.A.lines.pick('robotas', 'help', vars), C.yellow, 1500);
      } else this.teacherSay('👍', C.green);
    } else if (action === 'greiciau') {
      this.fast = true;
      this.teacherSay('⏩', C.teal);
      if (this.mode === 'run') this.say('▶ VYKDOMA  ⏩ x2', C.green);
      this.maybeSub(this.A.lines.pick('robotas', 'fast', vars), C.teal, 1500);
    }
  }

  celebrate() {
    this.adrBody.setTexture('adr_pose');
    this.tweens.add({ targets: this.adrBox, y: ADR.y - 24, yoyo: true, duration: 180, repeat: 1 });
    this.time.delayedCall(1000, () => this.adrBody.setTexture('adr_walk_a'));
  }

  finish(why) {
    if (this.mode === 'end' || this.mode === 'result') return;
    this.mode = 'end';
    this.A.host.setStatus({ text: 'Misija baigta! Žiūrėk į ekraną', tone: 'go' });
    if (why === 'win') {
      this.bigBanner('DOVANOS PO EGLE!', '+100 RESPEKTO', { color: C.yellow, hold: 2400 });
    } else {
      this.A.sfx.win();
      this.bigBanner('LAIKAS!', `Išvalyta pusnių: ${this.piles.length - this.remaining().length} iš ${this.piles.length} · +100 RESPEKTO`, { color: C.teal, hold: 2600 });
      this.time.delayedCall(1300, () => this.sub(this.A.lines.pick('robotas', 'timeout'), C.yellow, 760));
    }
    this.time.delayedCall(why === 'win' ? 2600 : FINISH_S * 1000 - 200, () => this.showResult());
  }

  showResult() {
    this.mode = 'result';
    this.A.host.setPhase('result', STAGE);
    const box = this.add.container(960, 500).setDepth(1950).setAlpha(0);
    box.add(this.add.rectangle(0, 0, 1240, 620, 0x0b0418, 0.9).setStrokeStyle(6, 0xffd23f));
    box.add(headText(this, 0, -245, this.won ? 'ROBOTAS PASIEKĖ EGLĘ!' : 'ROBOTAS UŽPROGRAMUOTAS!', 66, C.yellow));
    const n = this.piles.length;
    const byKids = this.piles.filter((p) => p.cleared && !p.byTeacher).length;
    const rows = [
      [`Pusnys: vaikai išvalė ${byKids} iš ${n}${this.teacherCleared ? `   ·   padėjo mokytoja: ${this.teacherCleared}` : ''}`, C.white],
      [this.won
        ? `Adrianos kodas: ${this.code.length} žingsniai - pavyko iš ${ORDINAL[this.runs] || `${this.runs}-o`} karto!`
        : `Paleidimai: ${this.runs}`, C.white],
    ];
    if (n && byKids === n) rows.push([`Komandinis darbas: visi ${n} išvalė kelią patys! 💪`, C.green]);
    const all = [...this.stats.values()];
    const fastest = all.filter((x) => x.ms != null).sort((a, b) => a.ms - b.ms)[0];
    if (fastest) rows.push([`Greičiausias kasėjas: ${fastest.name} (${(fastest.ms / 1000).toFixed(1).replace('.', ',')} s)`, C.teal]);
    const fw = all.map((x) => [x, x.counts.fejerverkai || 0]).filter(([, k]) => k > 0).sort((a, b) => b[1] - a[1])[0];
    if (fw) rows.push([`Daugiausia fejerverkų: ${fw[0].name} (${fw[1]}) 🎆`, C.yellow]);
    rows.forEach(([r, c], i) => box.add(bodyText(this, 0, -150 + i * 58, r, 32, c)));
    const next = headText(this, 0, 250, 'ENTER - TOLIAU', 48, C.white);
    this.tweens.add({ targets: next, alpha: 0.3, yoyo: true, repeat: -1, duration: 650 });
    box.add(next);
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
  }

  // ---------------- fejerverkai virš Baltojo tilto ----------------
  makeSky() {
    this.skyBox = this.add.container(0, 0).setDepth(-50);
    const m = this.make.graphics({ add: false });
    m.fillStyle(0xffffff);
    m.fillRect(SKY.x + 8, SKY.y + 8, SKY.w - 16, SKY.h - 16);
    this.skyBox.setMask(m.createGeometryMask());
  }

  // Fejerverkas: raketa kyla nuo tilto ir sprogsta vaiko spalva; virš - jo vardas.
  firework2(name, big = false) {
    if (this.fwActive > 14) return;
    this.fwActive += 1;
    let h = 0;
    for (const ch of String(name || Math.random())) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const col = FW_COLORS[h % FW_COLORS.length];
    const x = rand(SKY.x + 60, SKY.x + SKY.w - 60);
    const y = rand(SKY.y + 40, SKY.y + 140);
    const rocket = this.add.circle(x + rand(-30, 30), SKY.y + SKY.h - 40, 4, col);
    this.skyBox.add(rocket);
    const now = this.time.now;
    if (now - this.fwSoundAt > 160) { this.fwSoundAt = now; this.A.sfx.throw(); }
    this.tweens.add({
      targets: rocket, x, y, duration: 520, ease: 'Quad.Out', onComplete: () => {
        rocket.destroy();
        if (this.time.now - this.fwSoundAt > 120) { this.fwSoundAt = this.time.now; this.A.sfx.pop(); }
        const n = big ? 24 : 18;
        const r = big ? rand(90, 130) : rand(65, 100);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const d = this.add.circle(x, y, big ? 7 : 6, col).setBlendMode(Phaser.BlendModes.ADD);
          this.skyBox.add(d);
          // skrieja greitai, o užgęsta tik pabaigoje - kad būtų ryškiau
          this.tweens.add({
            targets: d, duration: 1100, onComplete: () => d.destroy(),
            props: { x: { value: x + Math.cos(a) * r, ease: 'Quad.Out' }, y: { value: y + Math.sin(a) * r + 18, ease: 'Quad.Out' }, alpha: { value: 0, ease: 'Cubic.In' }, scale: { value: 0.4, ease: 'Cubic.In' } },
          });
        }
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + 0.4;
          const d = this.add.circle(x, y, 4, 0xffffff);
          this.skyBox.add(d);
          this.tweens.add({ targets: d, x: x + Math.cos(a) * r * 0.5, y: y + Math.sin(a) * r * 0.5, alpha: 0, duration: 800, ease: 'Quad.Out', onComplete: () => d.destroy() });
        }
        const flash = this.add.circle(x, y, 18, 0xffffff, 0.8);
        this.skyBox.add(flash);
        this.tweens.add({ targets: flash, scale: 2.2, alpha: 0, duration: 260, onComplete: () => flash.destroy() });
        if (name) {
          const t = bodyText(this, x, y, name, 20, '#ffffff');
          this.skyBox.add(t);
          this.tweens.add({ targets: t, y: y - 26, alpha: 0, delay: 500, duration: 500, onComplete: () => t.destroy() });
        }
        this.time.delayedCall(900, () => { this.fwActive = Math.max(0, this.fwActive - 1); });
      },
    });
  }

  // ---------------- piešimas ----------------
  makeCodeBar() {
    const b = BAR;
    this.add.rectangle(b.x, b.y, b.w, b.h, 0x0b0418, 0.88).setStrokeStyle(4, 0x2de2e6).setDepth(1500);
    headText(this, b.x - b.w / 2 + 70, b.y, 'KODAS', 30, C.teal).setDepth(1501);
    this.barHint = bodyText(this, b.x + 40, b.y, '← ↑ → ↓ - rašyk kodą   ·   BACKSPACE - trinti   ·   TARPAS - ▶ PALEISTI', 26, '#9b8cc6').setDepth(1501);
    this.stepsText = bodyText(this, b.x + b.w / 2 - 120, b.y, '', 22, '#9b8cc6').setDepth(1501);
    headText(this, b.x + b.w / 2 - 50, b.y, '▶', 48, C.green).setDepth(1501);
  }

  redrawBar(popLast = false) {
    for (const bl of this.blocks) bl.destroy();
    this.blocks = [];
    const b = BAR;
    const x0 = b.x - b.w / 2 + 150;
    const groups = this.blocksOf(this.code);
    groups.forEach((g, i) => {
      const box = this.add.container(x0 + i * (b.size + b.gap) + b.size / 2, b.y).setDepth(1502);
      const bg = this.add.rectangle(0, 0, b.size, b.size, BLOCK[g.d].col).setStrokeStyle(4, 0x14081f);
      const t = headText(this, 0, g.n > 1 ? -8 : 2, BLOCK[g.d].arrow, g.n > 1 ? 38 : 46, C.white);
      box.add([bg, t]);
      if (g.n > 1) box.add(headText(this, 0, 24, `×${g.n}`, 24, C.yellow));
      box.bg = bg;
      box.from = g.from;
      box.to = g.to;
      this.blocks.push(box);
      if (popLast && i === groups.length - 1) { box.setScale(0.7); this.tweens.add({ targets: box, scale: 1, duration: 120, ease: 'Back.Out' }); }
    });
    this.barHint.setVisible(!this.code.length);
    this.stepsText.setText(this.code.length ? `${this.code.length} žingsn.` : '');
  }

  markStep(i, state) {
    this.blocks.forEach((bl) => {
      const on = i >= bl.from && i <= bl.to;
      if (on) {
        bl.bg.setStrokeStyle(state === 'bug' ? 8 : 6, state === 'bug' ? 0xff4d5e : 0xffffff);
        bl.setScale(1.12).setAlpha(1);
      } else if (state === 'run') { bl.bg.setStrokeStyle(4, 0x14081f); bl.setScale(1).setAlpha(bl.to < i ? 0.55 : 1); }
    });
  }

  makePanel() {
    const v = PANEL;
    const box = this.add.container(v.x, v.y).setDepth(1400);
    box.add(this.add.rectangle(0, 0, 360, 150, 0x0b0418, 0.88).setStrokeStyle(4, 0x2de2e6));
    box.add(headText(this, 0, -50, 'KELIO VALYTOJAI', 28, C.teal));
    this.pCount = bodyText(this, 0, -12, '', 28, C.white);
    this.pBar = this.add.graphics();
    this.pWho = bodyText(this, 0, 48, '', 18, C.yellow, { wordWrap: { width: 340 } });
    box.add([this.pCount, this.pBar, this.pWho]);
  }

  updatePanel() {
    const n = this.piles.length;
    const left = this.remaining();
    this.pCount.setText(n ? `Išvalyta ${n - left.length} iš ${n} ❄️` : 'Laukiam vaikų...');
    const g = this.pBar;
    g.clear();
    g.fillStyle(0x3a2a5e, 1); g.fillRect(-150, 12, 300, 12);
    if (n) { g.fillStyle(0x3ddc84, 1); g.fillRect(-150, 12, (300 * (n - left.length)) / n, 12); }
    const names = left.map((p) => p.name);
    this.pWho.setText(!n ? '' : left.length ? `Dar kasa: ${names.slice(0, 5).join(', ')}${names.length > 5 ? ` +${names.length - 5}` : ''}` : 'Kelias išvalytas! 🎉').setColor(left.length ? C.yellow : C.green);
    this.levelText.setText(n ? `PUSNYS: liko ${left.length} iš ${n}` : '');
  }

  makeTeacher() {
    const t = this.A.host.teachers()[0];
    this.teacherName = t ? t.name : 'Daiva';
    const box = this.add.container(TEACH.x, TEACH.y).setScale(TEACH.s).setDepth(940);
    const body = this.add.image(0, 0, 'teacher_body').setOrigin(0.5, 1);
    const faceKey = t && this.textures.exists(avatarKey(t.name)) ? avatarKey(t.name) : 'teacher_face';
    const face = this.add.image(0, -290, faceKey).setDisplaySize(104, 104);
    box.add([body, face]);
    this.teacherBox = box;
    bodyText(this, TEACH.x, TEACH.y + 22, leaderLabel(this.teacherName), 22, C.yellow).setDepth(941);
  }

  teacherSay(text, color) {
    const t = headText(this, TEACH.x - 20, TEACH.y - 200, text, 56, color).setDepth(1600).setScale(0.4);
    this.tweens.add({ targets: t, scale: 1, duration: 180, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 30, delay: 800, duration: 300, onComplete: () => t.destroy() });
    this.tweens.add({ targets: this.teacherBox, angle: { from: -5, to: 5 }, yoyo: true, duration: 120, onComplete: () => this.teacherBox.setAngle(0) });
  }

  makeAdriana() {
    this.adrBox = this.add.container(ADR.x, ADR.y).setScale(ADR.s).setDepth(950);
    this.adrBody = this.add.image(0, 0, 'adr_walk_a').setOrigin(0.5, 1);
    const face = this.textures.exists('adr_face');
    const head = this.add.image(2, -244, face ? 'adr_face' : 'adr_head').setOrigin(0.5, face ? 0.5 : 0.56);
    if (face) head.setDisplaySize(118, 118);
    // planšetė rankose
    const tab = this.add.rectangle(4, -104, 74, 50, 0x0e1a3a).setStrokeStyle(5, 0x14081f);
    const scr = this.add.rectangle(4, -104, 60, 36, 0x2de2e6, 0.85);
    this.adrBox.add([this.adrBody, head, tab, scr]);
    bodyText(this, ADR.x, ADR.y + 18, 'Adriana', 22, C.pink).setDepth(951);
  }

  makeHud() {
    const D = 1800;
    headText(this, 40, 54, STAGE.mission, 46, C.yellow).setOrigin(0, 0.5).setDepth(D);
    this.levelText = headText(this, 1060, 54, '', 40, C.white).setDepth(D);
    this.timerText = bodyText(this, 1880, 40, '⏱ 0:45', 30, '#f1e6ff').setOrigin(1, 0.5).setDepth(D);
    this.stateText = headText(this, 960, 248, '', 36, C.yellow).setDepth(D);
  }

  say(text, color) { this.stateText.setText(text).setColor(color); }

  pop(x, y, text, color, size = 40) {
    const t = headText(this, x, y, text, size, color).setDepth(1600).setScale(0.5);
    this.tweens.add({ targets: t, scale: 1, duration: 150, ease: 'Back.Out' });
    this.tweens.add({ targets: t, alpha: 0, y: y - 60, delay: 700, duration: 300, onComplete: () => t.destroy() });
  }

  firework(x, y) {
    const cols = [0xffd23f, 0xff3ea5, 0x2de2e6, 0x3ddc84, 0xffffff, 0xff7a3c];
    const col = pick(cols);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const d = this.add.circle(x, y, 6, col).setDepth(1650);
      this.tweens.add({ targets: d, x: x + Math.cos(a) * rand(60, 110), y: y + Math.sin(a) * rand(60, 110), alpha: 0, scale: 0.4, duration: 700, ease: 'Quad.Out', onComplete: () => d.destroy() });
    }
  }

  maybeSub(text, color = C.white, gap = 2600) {
    if (!text || this.time.now - this.lastSub < gap) return;
    this.lastSub = this.time.now;
    this.sub(text, color);
  }

  sub(text, color, y = 300) {
    subtitle(this, text, { color, y });
    if (this._subtitle) this._subtitle.setDepth(1700);
  }

  bigBanner(title, sub, opts) {
    banner(this, title, sub, opts).setDepth(1900);
  }

  // ---------------- ciklas ----------------
  update() {
    if (this.stageStart != null && this.mode !== 'result') this.stageT = (this.game.loop.time - this.stageStart) / 1000;
    const left = Math.max(0, TOTAL_S - this.stageT);
    this.timerText.setText(`⏱ ${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`).setColor(left <= 15 && this.mode !== 'result' ? C.red : '#f1e6ff');
    const playing = ['edit', 'run', 'bug'].includes(this.mode);
    if (this.stageStart != null && playing && this.stageT >= TOTAL_S - FINISH_S) this.finish('time');

    // mokytojos (ar saulės) 5 s atskaita
    const now = this.time.now;
    for (const p of this.piles) {
      if (p.cleared || !p.helpUntil) continue;
      const s = Math.ceil((p.helpUntil - now) / 1000);
      if (p.helpTxt) p.helpTxt.setText(`${p.helpBy === 'sun' ? '☀️' : '⏳'} ${Math.max(0, s)}`);
      if (now >= p.helpUntil) this.dig(p, p.helpBy === 'sun' ? 'sun' : 'teacher');
    }
    // atsijungusio vaiko pusnis ištirpsta pati
    if (playing && now > this.offlineCheck) {
      this.offlineCheck = now + 1000;
      const host = this.A.host;
      for (const p of this.piles) {
        if (p.cleared || p.helpUntil) continue;
        const pl = host.players.get(p.pid);
        if (!pl || !host.isOnline(pl)) {
          p.helpUntil = now + HELP_MS; p.helpBy = 'sun';
          const c = cellCenter(p.c, p.r);
          p.helpTxt = headText(this, c.x - 20 * c.s, c.y - 120 * c.s, '☀️ 5', 34, C.yellow).setDepth(1550);
        }
      }
    }

    // automatinis režimas (testams): parašo kelią (kartais su klaida), paleidžia, kai kelias išvalytas
    if (this.autoplay && this.mode === 'edit' && now >= this.autoNextAt) {
      this.autoNextAt = now + 240;
      if (!this.autoPlan) {
        const plan = this.routeCode();
        if (!this.autoMistake && Math.random() < 0.6) { this.autoMistake = true; plan[9] = plan[9] === 'L' ? 'U' : 'L'; }
        this.autoPlan = plan;
      }
      const plan = this.autoPlan;
      const prefixOk = this.code.every((d, i) => plan[i] === d);
      if (!prefixOk) this.delStep();
      else if (this.code.length < plan.length) this.addStep(plan[this.code.length]);
      else if (!this.remaining().length || this.autoMistake === true) { if (this.autoMistake === true) this.autoMistake = 'done'; this.run(); }
    }
    if (this.autoplay && this.mode === 'bug') this.autoPlan = this.routeCode();
  }
}
