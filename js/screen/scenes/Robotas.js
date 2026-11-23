// 9 etapas: "Dovanų robotas" (programavimo būrelis prie Baltojo tilto).
// Adriana programuoja robotą: rodyklės ↑ ↓ ← → prideda komandas į kodo juostą,
// BACKSPACE ištrina paskutinę, TARPAS (ar ENTER) - ▶ PALEISTI. Robotas vykdo kodą žingsnis po žingsnio,
// renka 🎁 dovanas ir turi pasiekti eglę. Atsitrenkė į pusnį, nuvažiavo nuo kilimėlio ar kodas
// baigėsi per anksti - „BUG! 🐞“: robotas grįžta į startą, kodas lieka - pataisyk ir bandyk dar.
// 3 lygiai, visas etapas nuo „3-2-1“ iki rezultatų - ne ilgiau 60 s.
// Klasė - testuotojai: kol Adriana rašo kodą, spėja telefone „✅ Veiks!“ arba „🐞 Bus klaida!“
// (galima persigalvoti iki paleidimo). Atspėjo - taškas.
// Mokytoja - būrelio vadovė: „Užuomina 💡“ (pašviečia kelią iki kitos dovanos) ir „Greičiau ⏩“.

import { headText, bodyText, banner, subtitle, missionCard, C } from '../fx.js';
import { Tribune, avatarKey } from '../tribune.js';
import { STAGES } from '../stages.js';
import { MAT, matProj, cellU, cellD, cellCenter } from '../art-robot.js';

const STAGE = STAGES.robotas;
// Lygiai: stulpelis c (0-7), eilė r (0 - tolimiausia, 4 - arčiausia). Trumpiausi sprendimai: 5, 7, 9 komandos.
const LEVELS = [
  { start: [1, 2], goal: [6, 2], piles: [], gifts: [[3, 2]] },
  { start: [2, 3], goal: [5, 3], piles: [[3, 2], [3, 3], [3, 4], [4, 3]], gifts: [[3, 1]] },
  { start: [1, 4], goal: [6, 0], piles: [[2, 3], [2, 4], [4, 1], [4, 0], [3, 1], [5, 3]], gifts: [[2, 2], [5, 2]] },
];
const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
const BLOCK = {
  U: { arrow: '⬆', col: 0x1fc2c6 },
  D: { arrow: '⬇', col: 0xff9a3c },
  L: { arrow: '⬅', col: 0xff3ea5 },
  R: { arrow: '➡', col: 0x8a5cff },
};
const MAX_CODE = 14;
const STEP_MS = 330;
const MIN_VOTE_MS = 3000;   // testuotojams bent tiek laiko spėti, net jei Adriana labai greita
const TOTAL_S = 60;
const FINISH_S = 3.8;
const BAR = { x: 960, y: 160, w: 1320, h: 100, size: 74, gap: 10 };
const VOTE = { x: 1700, y: 300 };
const ADR = { x: 115, y: 935, s: 0.62 };
const TEACH = { x: 1800, y: 790, s: 0.5 };

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const key = (c, r) => `${c},${r}`;
const leaderLabel = (name) => `Vadovė ${String(name || 'Daiva').replace(/mokytoja\s*/i, '')}`;

export class RobotasScene extends Phaser.Scene {
  constructor() { super('Robotas'); }

  create() {
    const A = window.AGTA;
    this.A = A;
    this.bornAt = Date.now();
    this.mode = 'intro'; // intro -> count -> (edit -> run -> bug|levelok)... -> end -> result
    A.host.setPhase('intro', STAGE);
    this.lockVotes(true, false);

    // Phaser naudoja tą patį scenos objektą, todėl visą būseną nustatom iš naujo.
    this.level = 0;
    this.code = [];
    this.blocks = [];
    this.levelObjs = [];
    this.giftObjs = new Map();
    this.collected = new Set();
    this.giftsTotal = LEVELS.reduce((n, l) => n + l.gifts.length, 0);
    this.giftsGot = 0;
    this.levelsDone = 0;
    this.runs = 0;
    this.bugs = 0;
    this.votes = new Map();
    this.voteMarks = new Map();
    this.vRight = 0;
    this.vTotal = 0;
    this.fast = false;
    this.stepIdx = 0;
    this.editStart = 0;
    this.runQueued = false;
    this.stats = new Map();
    this.lastSub = 0;
    this.stageStart = null;
    this.stageT = 0;
    this.autoplay = !!this.autoplay;
    this.autoPlan = null;
    this.autoNextAt = 0;
    this.autoMistake = new Set();

    this.add.image(960, 540, 'robot_bg').setDepth(-100);
    this.matG = this.add.graphics().setDepth(2);
    this.hintG = this.add.graphics().setDepth(3);
    this.makeCodeBar();
    this.makeVotePanel();
    this.makeTeacher();
    this.makeAdriana();
    this.makeHud();
    this.robot = this.add.container(0, 0);
    this.robotImg = this.add.image(0, 0, 'rb_robot').setOrigin(0.5, 0.92);
    this.robot.add(this.robotImg);
    this.buildLevel(0, false);

    this.tribune = new Tribune(this, A.host, { y: 1006, maxSize: 64 });
    this.card = missionCard(this, {
      nr: STAGE.nr,
      mission: STAGE.mission,
      title: `${STAGE.title} - programavimo būrelis prie Baltojo tilto`,
      tip: A.lines.pick('robotas', 'intro'),
      controls: 'Adriana: ← ↑ → ↓ - rašyk kodą, BACKSPACE - trinti, TARPAS - ▶ paleisti.   Klasė: spėk telefone - ✅ veiks ar 🐞 bus klaida?',
    });
    this.card.setDepth(1900);

    const kb = this.input.keyboard;
    const arrow = (d) => (e) => { if (!e.repeat) this.addBlock(d); };
    kb.on('keydown-UP', arrow('U'));
    kb.on('keydown-DOWN', arrow('D'));
    kb.on('keydown-LEFT', arrow('L'));
    kb.on('keydown-RIGHT', arrow('R'));
    kb.on('keydown-BACKSPACE', () => this.delBlock());
    kb.on('keydown-ENTER', () => { if (this.mode === 'edit') this.run(); else this.onEnter(); });
    kb.on('keydown-SPACE', () => { if (this.mode === 'intro') this.onEnter(); else this.run(); });
    kb.on('keydown-R', () => this.scene.restart());

    const offs = [A.host.on('press', (e) => this.onPress(e))];
    // Virtualūs testuotojai „skaito“ kodą: jei jis jau veda iki eglės - dažniau spėja „veiks“.
    A.host.botPick = (p) => {
      if (this.mode !== 'edit' || A.host.roles[p.pid] !== 'testuotojas') return null;
      const cur = this.votes.get(p.pid);
      const guess = () => {
        const ok = this.simulate(this.code).ok;
        return Math.random() < 0.8 ? (ok ? 'veiks' : 'klaida') : (ok ? 'klaida' : 'veiks');
      };
      if (!cur) return Math.random() < 0.2 ? guess() : null;
      if (Math.random() < 0.03) { const g = guess(); return g !== cur ? g : null; }
      return null;
    };
    A.host.botFilter = (p, btn) => {
      if (btn === 'uzuomina') return this.mode === 'edit' && Math.random() < 0.08;
      if (btn === 'greiciau') return this.mode === 'run' && Math.random() < 0.15;
      return false;
    };
    this.events.once('shutdown', () => {
      offs.forEach((f) => f());
      A.host.botFilter = null;
      A.host.botPick = null;
      A.host.lock('veiks', undefined, false);
      A.host.lock('klaida', undefined, false);
      A.host.setStatus(null);
    });
  }

  lockVotes(locked, sync = true) {
    this.A.host.lock('veiks', locked ? null : undefined, false);
    this.A.host.lock('klaida', locked ? null : undefined, sync);
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
    const nums = ['3', '2', '1', 'RUN!'];
    nums.forEach((n, i) => {
      this.time.delayedCall(i * 700, () => {
        const t = headText(this, 960, 470, n, 240, i === nums.length - 1 ? C.yellow : C.white).setDepth(1960);
        t.setScale(1.8).setAlpha(0);
        this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 200, ease: 'Back.Out' });
        this.tweens.add({ targets: t, alpha: 0, delay: 480, duration: 200, onComplete: () => t.destroy() });
        if (i === nums.length - 1) {
          this.A.sfx.go();
          this.A.host.setPhase('play', STAGE);
          this.sub(this.A.lines.pick('robotas', 'start'), C.yellow);
          this.time.delayedCall(400, () => this.startEdit(true));
        } else this.A.sfx.count();
      });
    });
  }

  // Kilimėlis ir jo daiktai lygiui.
  buildLevel(i, animate = true) {
    this.level = i;
    this.autoPlan = null;
    const L = LEVELS[i];
    for (const o of this.levelObjs) o.destroy();
    this.levelObjs = [];
    this.giftObjs.clear();
    this.collected = new Set();
    this.hintG.clear();
    // langeliai
    const g = this.matG;
    g.clear();
    const corner = (c, r) => matProj(cellU(c), cellD(r));
    for (let r = 0; r < MAT.rows; r++) {
      for (let c = 0; c < MAT.cols; c++) {
        const isStart = c === L.start[0] && r === L.start[1];
        g.fillStyle(isStart ? 0x8affc1 : (c + r) % 2 ? 0xdbe9ff : 0xeef5ff, 1);
        const a = corner(c, r); const b = corner(c + 1, r); const d = corner(c + 1, r + 1); const e = corner(c, r + 1);
        g.fillPoints([a, b, d, e], true);
      }
    }
    g.lineStyle(2, 0x6f8fd6, 0.8);
    for (let c = 0; c <= MAT.cols; c++) g.lineBetween(corner(c, 0).x, corner(c, 0).y, corner(c, MAT.rows).x, corner(c, MAT.rows).y);
    for (let r = 0; r <= MAT.rows; r++) g.lineBetween(corner(0, r).x, corner(0, r).y, corner(MAT.cols, r).x, corner(MAT.cols, r).y);
    g.lineStyle(8, 0x2de2e6, 1);
    g.strokePoints([corner(0, 0), corner(MAT.cols, 0), corner(MAT.cols, MAT.rows), corner(0, MAT.rows)], true);
    const sp = cellCenter(...L.start);
    const startTxt = bodyText(this, sp.x, sp.y + 30 * sp.s, 'START', Math.round(18 * sp.s), '#14081f', { strokeThickness: 0 }).setDepth(4);
    this.levelObjs.push(startTxt);
    const put = (tex, c, r, s) => {
      const p = cellCenter(c, r);
      const img = this.add.image(p.x, p.y, tex).setOrigin(0.5, 0.85).setScale(s * p.s).setDepth(100 + p.y * 0.1);
      this.levelObjs.push(img);
      return img;
    };
    for (const [c, r] of L.piles) put('rb_pile', c, r, 0.95);
    for (const [c, r] of L.gifts) this.giftObjs.set(key(c, r), put('rb_gift', c, r, 0.8));
    this.goalImg = put('rb_goal', L.goal[0], L.goal[1], 0.85);
    this.placeRobot(...L.start);
    this.robotImg.setTexture('rb_robot');
    if (animate) {
      for (const o of this.levelObjs) { const s = o.scale; o.setScale(0); this.tweens.add({ targets: o, scale: s, duration: 260, ease: 'Back.Out' }); }
    }
    this.levelText.setText(`LYGIS ${i + 1}/${LEVELS.length}   ·   🎁 ${this.giftsGot}/${this.giftsTotal}`);
  }

  placeRobot(c, r) {
    this.rc = c; this.rr = r;
    const p = cellCenter(c, r);
    this.robot.setPosition(p.x, p.y).setScale(0.78 * p.s).setDepth(100 + p.y * 0.1 + 0.05).setAlpha(1);
  }

  startEdit(first = false) {
    this.mode = 'edit';
    this.votes = new Map();
    for (const m of this.voteMarks.values()) m.destroy();
    this.voteMarks.clear();
    this.lockVotes(false, false);
    const host = this.A.host;
    const by = {};
    for (const p of host.list()) if (host.isTeacher(p.name)) by[p.pid] = { text: `Lygis ${this.level + 1}/${LEVELS.length} · 💡 užuomina, ⏩ greičiau`, tone: 'go' };
    host.setStatus({ text: 'Ar Adrianos kodas veiks? Spėk! ✅ / 🐞', tone: 'go', holder: true }, by);
    this.updateVotes();
    this.say(this.code.length ? 'PATAISYK KODĄ IR PALEISK!' : 'RAŠYK KODĄ: ← ↑ → ↓', C.yellow);
    if (first) this.time.delayedCall(1600, () => this.maybeSub(this.A.lines.pick('robotas', 'level', { n: this.level + 1 }), C.teal, 0));
    this.autoNextAt = this.time.now + 500;
    this.editStart = this.time.now;
    this.runQueued = false;
  }

  addBlock(d) {
    if (this.mode !== 'edit') return;
    if (this.runQueued) { this.runQueued = false; this.say('RAŠYK KODĄ: ← ↑ → ↓', C.yellow); }
    if (this.code.length >= MAX_CODE) { this.A.sfx.sour(); return; }
    this.code.push(d);
    this.A.sfx.click();
    this.redrawBar(true);
  }

  delBlock() {
    if (this.mode !== 'edit' || !this.code.length) return;
    if (this.runQueued) { this.runQueued = false; this.say('RAŠYK KODĄ: ← ↑ → ↓', C.yellow); }
    this.code.pop();
    this.A.sfx.pop();
    this.redrawBar();
  }

  // Kodo vykdymas be animacijos (botams ir automatiniam režimui).
  simulate(code) {
    const L = LEVELS[this.level];
    const piles = new Set(L.piles.map(([c, r]) => key(c, r)));
    let [c, r] = L.start;
    for (let i = 0; i < code.length; i++) {
      const [dc, dr] = DIRS[code[i]];
      const nc = c + dc; const nr = r + dr;
      if (nc < 0 || nr < 0 || nc >= MAT.cols || nr >= MAT.rows) return { ok: false, at: i, why: 'wall' };
      if (piles.has(key(nc, nr))) return { ok: false, at: i, why: 'pile' };
      c = nc; r = nr;
      if (c === L.goal[0] && r === L.goal[1]) return { ok: true, at: i };
    }
    return { ok: false, at: code.length, why: 'end' };
  }

  // Trumpiausias kelias (užuominai ir automatiniam režimui).
  path(from, to) {
    const L = LEVELS[this.level];
    const piles = new Set(L.piles.map(([c, r]) => key(c, r)));
    const q = [[from[0], from[1], []]];
    const seen = new Set([key(...from)]);
    while (q.length) {
      const [c, r, p] = q.shift();
      if (c === to[0] && r === to[1]) return p;
      for (const [d, [dc, dr]] of Object.entries(DIRS)) {
        const nc = c + dc; const nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= MAT.cols || nr >= MAT.rows || piles.has(key(nc, nr)) || seen.has(key(nc, nr))) continue;
        seen.add(key(nc, nr));
        q.push([nc, nr, [...p, d]]);
      }
    }
    return [];
  }

  run() {
    if (this.mode !== 'edit') return;
    if (!this.code.length) { this.pop(BAR.x, BAR.y + 80, 'Pirma parašyk kodą!', C.orange, 34); this.A.sfx.sour(); return; }
    // per greitai - testuotojai dar nespėjo: robotas pajudės, kai baigsis spėjimo laikas
    const wait = MIN_VOTE_MS - (this.time.now - this.editStart);
    if (wait > 120) {
      if (!this.runQueued) {
        this.runQueued = true;
        this.say('TESTUOTOJAI DAR SPĖJA... ⏳', C.pink);
        this.time.delayedCall(wait, () => { if (this.runQueued && this.mode === 'edit') { this.runQueued = false; this.run(); } });
      }
      return;
    }
    this.runQueued = false;
    this.mode = 'run';
    this.runs += 1;
    this.lockVotes(true, false);
    this.hintG.clear();
    const host = this.A.host;
    const by = {};
    for (const [pid, v] of this.votes) by[pid] = { text: `Robotas vykdo kodą... Tavo spėjimas: ${v === 'veiks' ? '✅ veiks' : '🐞 klaida'}`, tone: 'wait' };
    host.setStatus({ text: 'Robotas vykdo kodą... 🤖', tone: 'wait' }, by);
    this.updateVotes();
    this.say(`▶ VYKDOMA${this.fast ? '  ⏩ x2' : ''}`, C.green);
    this.maybeSub(this.A.lines.pick('robotas', 'run'), C.green, 2000);
    this.stepIdx = 0;
    this.redrawBar();
    this.time.delayedCall(250, () => this.step());
  }

  stepMs() { return this.fast ? STEP_MS / 2 : STEP_MS; }

  step() {
    if (this.mode !== 'run') return;
    const L = LEVELS[this.level];
    const i = this.stepIdx;
    if (i >= this.code.length) { this.bug('end', i); return; }
    this.markBlock(i, 'run');
    const [dc, dr] = DIRS[this.code[i]];
    const nc = this.rc + dc; const nr = this.rr + dr;
    const off = nc < 0 || nr < 0 || nc >= MAT.cols || nr >= MAT.rows;
    const pile = !off && L.piles.some(([c, r]) => c === nc && r === nr);
    const ms = this.stepMs();
    if (off || pile) {
      // pajuda link kliūties ir atšoka
      const p0 = cellCenter(this.rc, this.rr);
      const p1 = off ? { x: p0.x + dc * 60, y: p0.y + dr * 40 } : cellCenter(nc, nr);
      this.tweens.add({ targets: this.robot, x: p0.x + (p1.x - p0.x) * 0.4, y: p0.y + (p1.y - p0.y) * 0.4, duration: ms * 0.5, yoyo: true, onComplete: () => this.bug(off ? 'wall' : 'pile', i) });
      return;
    }
    const p = cellCenter(nc, nr);
    this.A.sfx.step();
    this.tweens.add({ targets: this.robot, x: p.x, y: p.y, scale: 0.78 * p.s, duration: ms * 0.85, ease: 'Sine.InOut' });
    this.tweens.add({ targets: this.robotImg, y: -14, duration: ms * 0.42, yoyo: true });
    this.time.delayedCall(ms * 0.88, () => {
      if (this.mode !== 'run') return;
      this.rc = nc; this.rr = nr;
      this.robot.setDepth(100 + p.y * 0.1 + 0.05);
      const g = this.giftObjs.get(key(nc, nr));
      if (g && !this.collected.has(key(nc, nr))) {
        this.collected.add(key(nc, nr));
        this.giftsGot += 1;
        this.A.sfx.plus();
        this.tweens.add({ targets: g, y: g.y - 80, alpha: 0, scale: g.scale * 1.4, duration: 400 });
        this.pop(p.x, p.y - 120 * p.s, '+🎁', C.yellow, 44);
        this.maybeSub(this.A.lines.pick('robotas', 'gift'), C.yellow, 1500);
        this.levelText.setText(`LYGIS ${this.level + 1}/${LEVELS.length}   ·   🎁 ${this.giftsGot}/${this.giftsTotal}`);
      }
      if (nc === L.goal[0] && nr === L.goal[1]) { this.levelOk(); return; }
      this.stepIdx += 1;
      this.time.delayedCall(ms * 0.12, () => this.step());
    });
  }

  bug(why, i) {
    if (this.mode !== 'run') return;
    this.mode = 'bug';
    this.bugs += 1;
    this.fast = false;
    this.robotImg.setTexture('rb_robot_bug');
    this.markBlock(Math.min(i, this.code.length - 1), 'bug');
    this.A.sfx.fail();
    this.cameras.main.shake(160, 0.004);
    const p = cellCenter(this.rc, this.rr);
    this.pop(p.x, p.y - 150 * p.s, 'BUG! 🐞', C.red, 60);
    this.say(why === 'end' ? 'KODAS BAIGĖSI PER ANKSTI 🐞' : 'BUG! 🐞', C.red);
    this.sub(this.A.lines.pick('robotas', why === 'end' ? 'bug_end' : why === 'wall' ? 'bug_wall' : 'bug_pile'), C.orange);
    this.resolveVotes(false);
    this.time.delayedCall(1300, () => {
      if (this.mode !== 'bug') return;
      this.tweens.add({
        targets: this.robot, alpha: 0, duration: 180, onComplete: () => {
          this.placeRobot(...LEVELS[this.level].start);
          this.robotImg.setTexture('rb_robot');
          this.robot.setAlpha(0);
          this.tweens.add({ targets: this.robot, alpha: 1, duration: 180 });
          this.maybeSub(this.A.lines.pick('robotas', 'fix'), C.yellow, 0);
          this.startEdit();
        },
      });
    });
  }

  levelOk() {
    this.mode = 'levelok';
    this.fast = false;
    this.levelsDone += 1;
    this.robotImg.setTexture('rb_robot_joy');
    this.goalImg.setTexture('rb_goal_lit');
    this.tweens.add({ targets: this.goalImg, scale: this.goalImg.scale * 1.2, yoyo: true, duration: 200, repeat: 1 });
    this.A.sfx.win();
    this.say('VEIKIA! ✅', C.green);
    this.sub(this.A.lines.pick('robotas', 'level_ok'), C.green);
    this.celebrate();
    const g = cellCenter(...LEVELS[this.level].goal);
    for (let k = 0; k < 5; k++) this.time.delayedCall(k * 160, () => this.firework(g.x + rand(-120, 120), g.y - rand(120, 260) * g.s));
    this.resolveVotes(true);
    this.time.delayedCall(1700, () => {
      if (this.mode !== 'levelok') return;
      if (this.level + 1 >= LEVELS.length) { this.finish('win'); return; }
      this.code = [];
      this.redrawBar();
      this.buildLevel(this.level + 1);
      this.startEdit(true);
    });
  }

  resolveVotes(worked) {
    const host = this.A.host;
    let right = 0;
    const by = {};
    for (const [pid, v] of this.votes) {
      const ok = (v === 'veiks') === worked;
      const p = host.players.get(pid);
      if (ok) { right += 1; if (p) this.stat(p, 'atspejo'); this.tribune.bounce(pid); }
      by[pid] = ok ? { text: `Atspėjai! 🎉 ${worked ? 'Kodas veikė' : 'Buvo klaida'}`, tone: 'go' } : { text: `Neatspėjai... ${worked ? 'Kodas veikė' : 'Buvo klaida'}`, tone: 'wait' };
    }
    for (const [pid, m] of this.voteMarks) m.setAlpha((this.votes.get(pid) === 'veiks') === worked ? 1 : 0.3);
    this.vRight += right;
    this.vTotal += this.votes.size;
    host.setStatus({ text: worked ? 'Kodas veikė! ✅' : 'Buvo klaida! 🐞', tone: worked ? 'go' : 'wait' }, by);
    if (this.votes.size) this.voteResult.setText(`Atspėjo ${right} iš ${this.votes.size}!`).setColor(right * 2 >= this.votes.size ? C.green : C.orange);
  }

  celebrate() {
    this.adrBody.setTexture('adr_pose');
    this.tweens.add({ targets: this.adrBox, y: ADR.y - 24, yoyo: true, duration: 180, repeat: 1 });
    this.time.delayedCall(1000, () => this.adrBody.setTexture('adr_walk_a'));
  }

  finish(why) {
    if (this.mode === 'end' || this.mode === 'result') return;
    this.mode = 'end';
    this.lockVotes(true);
    this.hintG.clear();
    for (const m of this.voteMarks.values()) m.destroy();
    this.voteMarks.clear();
    this.A.host.setStatus({ text: 'Misija baigta! Žiūrėk į ekraną', tone: 'go' });
    this.A.sfx.win();
    this.say('', C.yellow);
    if (why === 'win') {
      this.bigBanner('ROBOTAS ATNEŠĖ DOVANAS!', '+100 RESPEKTO', { color: C.yellow, hold: 2800 });
      this.celebrate();
    } else {
      this.bigBanner('LAIKAS!', `Įveikta lygių: ${this.levelsDone} iš ${LEVELS.length} · +100 RESPEKTO`, { color: C.teal, hold: 2800 });
    }
    this.time.delayedCall(1300, () => this.sub(this.A.lines.pick('robotas', why === 'win' ? 'win' : 'timeout'), C.yellow, 760));
    this.time.delayedCall(FINISH_S * 1000 - 200, () => this.showResult());
  }

  showResult() {
    this.mode = 'result';
    this.A.host.setPhase('result', STAGE);
    const box = this.add.container(960, 500).setDepth(1950).setAlpha(0);
    box.add(this.add.rectangle(0, 0, 1240, 620, 0x0b0418, 0.9).setStrokeStyle(6, 0xffd23f));
    box.add(headText(this, 0, -245, 'ROBOTAS UŽPROGRAMUOTAS!', 66, C.yellow));
    const rows = [
      [`Lygiai: ${this.levelsDone} iš ${LEVELS.length}   ·   Dovanos: 🎁 ${this.giftsGot} iš ${this.giftsTotal}`, C.white],
      [`Paleidimai: ${this.runs}   ·   Bugai: 🐞 ${this.bugs}`, C.white],
    ];
    if (this.vTotal) rows.push([`Testuotojai atspėjo: ${this.vRight} iš ${this.vTotal}`, C.green]);
    const all = [...this.stats.values()];
    const best = all.map((x) => [x, x.counts.atspejo || 0]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
    if (best) rows.push([`Geriausias testuotojas: ${best[0].name} (atspėjo ${best[1]} k.)`, C.teal]);
    rows.forEach(([r, c], i) => box.add(bodyText(this, 0, -150 + i * 58, r, 32, c)));
    const next = headText(this, 0, 250, 'ENTER - TOLIAU', 48, C.white);
    this.tweens.add({ targets: next, alpha: 0.3, yoyo: true, repeat: -1, duration: 650 });
    box.add(next);
    this.tweens.add({ targets: box, alpha: 1, duration: 300 });
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
    if (this.mode === 'intro' || this.mode === 'result') return;
    if (role === 'vadove') { this.leaderAction(action); return; }
    if ((action !== 'veiks' && action !== 'klaida') || this.mode !== 'edit') return;
    if (this.votes.get(player.pid) === action) return;
    this.votes.set(player.pid, action);
    this.A.sfx.click();
    const pos = this.tribune.pos(player.pid);
    let m = this.voteMarks.get(player.pid);
    if (!m) { m = headText(this, pos.x, pos.y - 18, '', 28, C.white).setDepth(620); this.voteMarks.set(player.pid, m); }
    m.setText(action === 'veiks' ? '✅' : '🐞').setPosition(pos.x, pos.y - 18).setAlpha(1).setScale(1.5);
    this.tweens.add({ targets: m, scale: 1, duration: 160 });
    this.updateVotes();
  }

  leaderAction(action) {
    const vars = { vadove: leaderLabel(this.teacherName) };
    if (action === 'uzuomina' && (this.mode === 'edit' || this.mode === 'run')) {
      const L = LEVELS[this.level];
      const next = L.gifts.find(([c, r]) => !this.collected.has(key(c, r))) || L.goal;
      const steps = this.path(L.start, next);
      let [c, r] = L.start;
      const cells = [];
      for (const d of steps) { c += DIRS[d][0]; r += DIRS[d][1]; cells.push([c, r]); }
      this.showHint(cells);
      this.teacherSay('💡', C.yellow);
      this.A.sfx.twinkle();
      this.maybeSub(this.A.lines.pick('robotas', 'hint', vars), C.yellow, 1500);
    } else if (action === 'greiciau') {
      this.fast = true;
      this.teacherSay('⏩', C.teal);
      if (this.mode === 'run') this.say('▶ VYKDOMA  ⏩ x2', C.green);
      this.maybeSub(this.A.lines.pick('robotas', 'fast', vars), C.teal, 1500);
    }
  }

  showHint(cells) {
    const g = this.hintG;
    g.clear();
    const corner = (c, r) => matProj(cellU(c), cellD(r));
    g.fillStyle(0xffd23f, 0.55);
    g.lineStyle(4, 0xffb03a, 1);
    for (const [c, r] of cells) {
      const pts = [corner(c, r), corner(c + 1, r), corner(c + 1, r + 1), corner(c, r + 1)];
      g.fillPoints(pts, true);
      g.strokePoints(pts, true);
    }
    g.setAlpha(1);
    this.tweens.killTweensOf(g);
    this.tweens.add({ targets: g, alpha: 0.35, yoyo: true, repeat: 3, duration: 300, onComplete: () => g.clear().setAlpha(1) });
  }

  // ---------------- piešimas ----------------
  makeCodeBar() {
    const b = BAR;
    this.add.rectangle(b.x, b.y, b.w, b.h, 0x0b0418, 0.88).setStrokeStyle(4, 0x2de2e6).setDepth(1500);
    headText(this, b.x - b.w / 2 + 70, b.y, 'KODAS', 30, C.teal).setDepth(1501);
    this.barHint = bodyText(this, b.x + 40, b.y, '← ↑ → ↓ - rašyk kodą   ·   BACKSPACE - trinti   ·   TARPAS - ▶ PALEISTI', 26, '#9b8cc6').setDepth(1501);
    this.runBtn = headText(this, b.x + b.w / 2 - 80, b.y, '▶', 52, C.green).setDepth(1501);
  }

  redrawBar(popLast = false) {
    for (const bl of this.blocks) bl.destroy();
    this.blocks = [];
    const b = BAR;
    const x0 = b.x - b.w / 2 + 150;
    this.code.forEach((d, i) => {
      const box = this.add.container(x0 + i * (b.size + b.gap) + b.size / 2, b.y).setDepth(1502);
      const bg = this.add.rectangle(0, 0, b.size, b.size, BLOCK[d].col).setStrokeStyle(4, 0x14081f);
      const t = headText(this, 0, 2, BLOCK[d].arrow, 46, C.white);
      box.add([bg, t]);
      box.bg = bg;
      this.blocks.push(box);
      if (popLast && i === this.code.length - 1) { box.setScale(0.3); this.tweens.add({ targets: box, scale: 1, duration: 140, ease: 'Back.Out' }); }
    });
    this.barHint.setVisible(!this.code.length);
  }

  markBlock(i, state) {
    this.blocks.forEach((bl, j) => {
      if (j === i) {
        bl.bg.setStrokeStyle(state === 'bug' ? 8 : 6, state === 'bug' ? 0xff4d5e : 0xffffff);
        bl.setScale(1.15);
      } else if (state === 'run') { bl.bg.setStrokeStyle(4, 0x14081f); bl.setScale(1).setAlpha(j < i ? 0.55 : 1); }
    });
  }

  makeVotePanel() {
    const v = VOTE;
    const box = this.add.container(v.x, v.y).setDepth(1400);
    box.add(this.add.rectangle(0, 0, 360, 150, 0x0b0418, 0.88).setStrokeStyle(4, 0xff3ea5));
    box.add(headText(this, 0, -50, 'TESTUOTOJAI', 30, C.pink));
    this.vOk = bodyText(this, -80, -6, '✅ 0', 34, C.green);
    this.vBug = bodyText(this, 80, -6, '🐞 0', 34, C.orange);
    this.vBar = this.add.graphics();
    this.voteResult = bodyText(this, 0, 50, 'Spėkite telefone!', 22, '#d9c8ff');
    box.add([this.vOk, this.vBug, this.vBar, this.voteResult]);
  }

  updateVotes() {
    let ok = 0;
    for (const v of this.votes.values()) if (v === 'veiks') ok += 1;
    const bad = this.votes.size - ok;
    this.vOk.setText(`✅ ${ok}`);
    this.vBug.setText(`🐞 ${bad}`);
    const g = this.vBar;
    g.clear();
    const W = 300; const x0 = -150; const y = 22;
    const tot = Math.max(1, ok + bad);
    g.fillStyle(0x3ddc84, 1); g.fillRect(x0, y, (W * ok) / tot, 12);
    g.fillStyle(0xff9a3c, 1); g.fillRect(x0 + (W * ok) / tot, y, (W * bad) / tot, 12);
    if (!ok && !bad) { g.fillStyle(0x3a2a5e, 1); g.fillRect(x0, y, W, 12); }
    if (this.mode === 'edit') this.voteResult.setText('Spėkite telefone!').setColor('#d9c8ff');
    else if (this.mode === 'run') this.voteResult.setText('Spėjimai užfiksuoti 🔒').setColor('#d9c8ff');
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
    this.timerText = bodyText(this, 1880, 40, '⏱ 1:00', 30, '#f1e6ff').setOrigin(1, 0.5).setDepth(D);
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
  update(_, deltaMs) {
    if (this.stageStart != null && this.mode !== 'result') this.stageT = (this.game.loop.time - this.stageStart) / 1000;
    const left = Math.max(0, TOTAL_S - this.stageT);
    this.timerText.setText(`⏱ ${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`).setColor(left <= 15 && this.mode !== 'result' ? C.red : '#f1e6ff');
    if (this.stageStart != null && ['edit', 'run', 'bug', 'levelok'].includes(this.mode) && this.stageT >= TOTAL_S - FINISH_S) this.finish('time');

    // automatinis režimas (testams): rašo trumpiausią kodą; pirmą kartą kartais su klaida
    if (this.autoplay && this.mode === 'edit' && this.time.now >= this.autoNextAt) {
      this.autoNextAt = this.time.now + 260;
      const L = LEVELS[this.level];
      if (!this.autoPlan) {
        const plan = this.path(L.start, L.goal);
        if (!this.autoMistake.has(this.level) && Math.random() < 0.5) {
          this.autoMistake.add(this.level);
          if (Math.random() < 0.5) plan.pop(); else plan[Math.floor(plan.length / 2)] = plan[Math.floor(plan.length / 2)] === 'U' ? 'R' : 'U';
        }
        this.autoPlan = plan;
      }
      const plan = this.autoPlan;
      const prefixOk = this.code.every((d, i) => plan[i] === d);
      if (!prefixOk) this.delBlock();
      else if (this.code.length < plan.length) this.addBlock(plan[this.code.length]);
      else { this.autoMistake.add(this.level); this.run(); }
    }
    if (this.autoplay && this.mode === 'bug') this.autoPlan = this.path(LEVELS[this.level].start, LEVELS[this.level].goal);
  }
}
