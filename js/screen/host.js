// Ekrano "šeimininkas": žaidėjai, vardų tikrinimas, rolės, paspaudimai.
// Ekranas yra vienintelis tiesos šaltinis - telefonai tik siunčia norus.

import { EventBus, uid, shuffle } from '../common.js';
import { LOBBY } from './stages.js';

const STORE_KEY = 'agta.screen.v1';
const MAX_FAILS = 3;
const LOCK_MS = 15000;
const MIN_PRESS_GAP = 600;
const ONLINE_MS = 120000; // telefonas su užrakintu ekranu ar fone dar nelaikomas atsijungusiu

export class Host extends EventBus {
  constructor(net, room) {
    super();
    this.net = net;
    this.room = room;
    this.roster = { className: '', kids: [], adriana: null, problems: [] };
    this.players = new Map(); // pid -> player
    this.fails = new Map(); // vardas -> { n, until }
    this.phase = 'lobby';
    this.stage = LOBBY;
    this.roles = {}; // pid -> roleId
    this.done = new Set(); // įvykdytų etapų id (žemėlapio maršrutas)
    this._syncTimer = null;
    this.restore();
    this.assignAll();

    net.on('hello', (d) => { this.touch(d.pid); this.syncSoon(); });
    net.on('ping', (d) => this.touch(d.pid));
    net.on('claim', (d) => this.onClaim(d));
    net.on('rejoin', (d) => this.onRejoin(d));
    net.on('press', (d) => this.onPress(d));
  }

  // ---------- saugojimas (tik šioje naršyklėje) ----------
  restore() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!s || s.room !== this.room) return;
      if (s.roster) this.roster = s.roster;
      if (Array.isArray(s.done)) this.done = new Set(s.done);
      for (const p of s.players || []) {
        if (this.kid(p.name)) this.players.set(p.pid, { ...p, lastSeen: 0, lastPress: 0, joinedAt: p.joinedAt || Date.now() });
      }
    } catch (e) { console.warn('[host] restore', e); }
  }

  save() {
    const players = [...this.players.values()].filter((p) => !p.bot).map(({ pid, name, token, joinedAt }) => ({ pid, name, token, joinedAt }));
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ room: this.room, roster: this.roster, players, done: [...this.done] }));
    } catch (e) { console.warn('[host] save', e); }
  }

  static clearStorage() { localStorage.removeItem(STORE_KEY); }

  // ---------- sąrašas ----------
  setRoster(roster) {
    this.roster = roster;
    for (const p of [...this.players.values()]) {
      if (!this.kid(p.name)) this.players.delete(p.pid);
    }
    this.save();
    this.emit('roster', roster);
    this.emit('players');
    this.syncNow();
  }

  kid(name) {
    return this.roster.kids.find((k) => k.name === name) || null;
  }

  playerByName(name) {
    for (const p of this.players.values()) if (p.name === name) return p;
    return null;
  }

  list() {
    return [...this.players.values()].sort((a, b) => a.joinedAt - b.joinedAt);
  }

  isOnline(p) { return Date.now() - (p.lastSeen || 0) < ONLINE_MS; }

  avatarOf(name) { return this.kid(name)?.avatar || null; }

  isTeacher(name) { return !!this.kid(name)?.teacher; }

  teachers() { return this.list().filter((p) => this.isTeacher(p.name)); }
  // Skaičiai be mokytojos: kiek vaikų sąraše ir kiek jų prisijungė.
  counts() {
    const kidsTotal = this.roster.kids.filter((k) => !k.teacher).length;
    const hasTeacher = this.roster.kids.some((k) => k.teacher);
    const list = this.list();
    const teacherIn = list.some((p) => this.isTeacher(p.name));
    return { kidsTotal, kidsIn: list.length - (teacherIn ? 1 : 0), hasTeacher, teacherIn };
  }

  touch(pid) {
    const p = this.players.get(pid);
    if (p) {
      const wasOff = !this.isOnline(p);
      p.lastSeen = Date.now();
      if (wasOff) this.emit('players');
    }
  }

  // ---------- prisijungimas ----------
  onClaim({ pid, name, md }) {
    if (!pid || !name) return;
    const reply = (extra) => this.net.send('claimed', { pid, ...extra });
    const kid = this.kid(name);
    if (!kid) return reply({ ok: false, err: 'nera' });

    const f = this.fails.get(name);
    if (f && f.until > Date.now()) {
      return reply({ ok: false, err: 'lock', wait: Math.ceil((f.until - Date.now()) / 1000) });
    }
    if (kid.md !== md) {
      const n = (f?.n || 0) + 1;
      this.fails.set(name, { n: n >= MAX_FAILS ? 0 : n, until: n >= MAX_FAILS ? Date.now() + LOCK_MS : 0 });
      return reply({ ok: false, err: n >= MAX_FAILS ? 'lock' : 'data', wait: Math.ceil(LOCK_MS / 1000) });
    }
    this.fails.delete(name);

    // Vardą anksčiau turėjęs telefonas atjungiamas (pvz. išsikrovė).
    const old = this.playerByName(name);
    if (old && old.pid !== pid) {
      this.players.delete(old.pid);
      this.net.send('kick', { pid: old.pid, why: 'perimta' });
    }
    // Tas pats telefonas galėjo turėti kitą vardą.
    const prev = this.players.get(pid);
    if (prev && prev.name !== name) this.players.delete(pid);

    const player = {
      pid, name, token: uid(16), joinedAt: Date.now(), lastSeen: Date.now(), lastPress: 0,
    };
    this.players.set(pid, player);
    this.save();
    reply({ ok: true, token: player.token, name, avatar: kid.avatar });
    this.assignOne(player);
    this.emit('join', player);
    this.emit('players');
    this.syncSoon();
  }

  onRejoin({ pid, token, name }) {
    const p = this.playerByName(name);
    if (!p || p.token !== token) {
      return this.net.send('claimed', { pid, ok: false, err: 'rejoin' });
    }
    if (p.pid !== pid) {
      this.players.delete(p.pid);
      p.pid = pid;
      this.players.set(pid, p);
      this.save();
    }
    p.lastSeen = Date.now();
    if (!this.roles[pid]) this.assignOne(p);
    this.net.send('claimed', { pid, ok: true, token: p.token, name: p.name, avatar: this.avatarOf(p.name) });
    this.emit('players');
    this.syncSoon();
  }

  // ---------- virtualūs vaikai testavimui ----------
  addBot(kid) {
    if (this.playerByName(kid.name)) return null;
    const p = {
      pid: `bot-${uid(6)}`, name: kid.name, token: uid(8), joinedAt: Date.now(), lastSeen: Date.now(), lastPress: 0, bot: true,
    };
    this.players.set(p.pid, p);
    this.assignOne(p);
    this.emit('join', p);
    this.emit('players');
    this.syncSoon();
    return p;
  }

  removeBots() {
    for (const p of [...this.players.values()]) {
      if (!p.bot) continue;
      this.players.delete(p.pid);
      delete this.roles[p.pid];
    }
    this.emit('players');
    this.syncSoon();
  }

  kick(pid, why = 'vedeja') {
    const p = this.players.get(pid);
    if (!p) return;
    this.players.delete(pid);
    delete this.roles[pid];
    this.save();
    this.net.send('kick', { pid, why });
    this.emit('players');
    this.syncSoon();
  }

  // ---------- maršrutas ----------
  markDone(id) {
    this.done.add(id);
    this.save();
    this.emit('progress');
  }

  resetProgress() {
    this.done.clear();
    this.save();
    this.emit('progress');
  }

  // ---------- etapai ir rolės ----------
  setPhase(phase, stage = this.stage) {
    const stageChanged = stage !== this.stage;
    this.phase = phase;
    this.stage = stage;
    if (stageChanged || !Object.keys(this.roles).length) this.assignAll();
    this.emit('phase', { phase, stage });
    this.syncNow();
  }

  assignAll() {
    this.roles = {};
    const counts = {};
    const all = shuffle(this.list());
    // Mokytoja gauna savo specialią rolę ir neužima vaikų vietų.
    for (const t of all.filter((p) => this.isTeacher(p.name))) {
      const id = this.stage.teacherRole || this.pickRole(counts);
      this.roles[t.pid] = id;
      counts[id] = (counts[id] || 0) + 1;
    }
    const players = all.filter((p) => !this.isTeacher(p.name));
    if (this.stage.slots) {
      players.forEach((p, i) => { this.roles[p.pid] = this.stage.slots[i] || this.stage.fallback; });
      return;
    }
    for (const p of players) {
      const id = this.pickRole(counts);
      this.roles[p.pid] = id;
      counts[id] = (counts[id] || 0) + 1;
    }
  }

  assignOne(player) {
    const counts = {};
    for (const id of Object.values(this.roles)) counts[id] = (counts[id] || 0) + 1;
    if (this.isTeacher(player.name)) {
      this.roles[player.pid] = this.stage.teacherRole || this.pickRole(counts);
      return;
    }
    if (this.stage.slots) {
      const seen = {};
      for (const id of this.stage.slots) {
        seen[id] = (seen[id] || 0) + 1;
        if ((counts[id] || 0) < seen[id]) { this.roles[player.pid] = id; return; }
      }
      this.roles[player.pid] = this.stage.fallback;
      return;
    }
    this.roles[player.pid] = this.pickRole(counts);
  }

  pickRole(counts) {
    const entries = Object.entries(this.stage.roles).filter(([id, r]) => !r.max || (counts[id] || 0) < r.max);
    const total = entries.reduce((s, [, r]) => s + (r.weight || 1), 0);
    let x = Math.random() * total;
    for (const [id, r] of entries) {
      x -= r.weight || 1;
      if (x <= 0) return id;
    }
    return entries[0][0];
  }

  playersWithRole(roleId) {
    return this.list().filter((p) => this.roles[p.pid] === roleId);
  }

  // Asmeninis signalas vienam telefonui (pvz. "Tu Adrianos kelyje!").
  cue(pid, text) {
    this.net.send('cue', { pid, text });
  }

  roleOf(pid) {
    const id = this.roles[pid];
    return id ? { id, ...this.stage.roles[id] } : null;
  }

  onPress({ pid, a }) {
    const p = this.players.get(pid);
    if (!p) return this.net.send('claimed', { pid, ok: false, err: 'rejoin' });
    p.lastSeen = Date.now();
    const role = this.roleOf(pid);
    const btn = role && role.buttons.find((b) => b.id === a);
    if (!btn) return;
    const now = Date.now();
    if (now - p.lastPress < MIN_PRESS_GAP) return;
    // Mygtuko pertrauka tikrinama ir čia (telefonas gali vėluoti, botai jos nežino).
    p.btnAt = p.btnAt || {};
    if (btn.cd && now - (p.btnAt[a] || 0) < btn.cd * 0.85) return;
    p.btnAt[a] = now;
    p.lastPress = now;
    this.emit('press', { player: p, action: a, role: role.id });
  }

  // ---------- sinchronizacija su telefonais ----------
  syncPayload() {
    const defs = {};
    for (const [id, r] of Object.entries(this.stage.roles)) {
      defs[id] = { name: r.name, emoji: r.emoji, desc: r.desc, buttons: r.buttons };
    }
    return {
      cls: this.roster.className,
      names: this.roster.kids.map((k) => ({ n: k.name, on: !!this.playerByName(k.name) })),
      phase: this.phase,
      stage: this.stage.id,
      title: this.stage.title,
      roles: { map: this.roles, defs },
    };
  }

  syncNow() {
    clearTimeout(this._syncTimer);
    this._syncTimer = null;
    this.net.send('sync', this.syncPayload());
  }

  syncSoon() {
    if (this._syncTimer) return;
    this._syncTimer = setTimeout(() => this.syncNow(), 400);
  }
}
