// Ekrano paleidimas: ryšys, šeimininkas, Phaser žaidimas ir vedėjo pultas.

import { connectNet } from '../net.js';
import { randomRoom, baseUrl, netModeFromUrl } from '../common.js';
import { Host } from './host.js';
import { loadRosterFromFiles, loadDemoRoster } from './roster.js';
import { Lines } from './lines.js';
import { sfx } from './sfx.js';
import { STAGES, ROUTE } from './stages.js';
import { BootScene } from './scenes/Boot.js';
import { LobbyScene } from './scenes/Lobby.js';
import { BusScene } from './scenes/Bus.js';
import { BroliaiScene } from './scenes/Broliai.js';
import { LaiptaiScene } from './scenes/Laiptai.js';
import { PamokaScene } from './scenes/Pamoka.js';
import { PodiumasScene } from './scenes/Podiumas.js';
import { KoncertasScene } from './scenes/Koncertas.js';
import { KinuScene } from './scenes/Kinu.js';
import { TenisasScene } from './scenes/Tenisas.js';
import { RobotasScene } from './scenes/Robotas.js';
import { FinalasScene } from './scenes/Finalas.js';
import { MapScene } from './scenes/Map.js';
import { VERSION } from '../version.js';
import { Bots } from './bots.js';

const $ = (id) => document.getElementById(id);
const ROOM_KEY = 'agta.room';

const room = (new URLSearchParams(location.search).get('r') || localStorage.getItem(ROOM_KEY) || randomRoom()).toUpperCase();
localStorage.setItem(ROOM_KEY, room);

const net = await connectNet({ side: 'screen', room, mode: netModeFromUrl() });
const host = new Host(net, room);
const lines = await Lines.load(['common', 'broliai', 'laiptai', 'pamoka', 'autobusas', 'podiumas', 'koncertas', 'kinu', 'tenisas', 'robotas', 'finalas']);
const joinUrl = `${baseUrl()}join.html?r=${room}${net.mode === 'local' ? '&net=local' : ''}`;

// Palaukiam šriftų (iki 2 s), kad Phaser tekstai būtų gražūs.
try {
  await Promise.race([
    Promise.all([document.fonts.load('64px Anton'), document.fonts.load('bold 32px Rubik')]),
    new Promise((r) => setTimeout(r, 2000)),
  ]);
} catch { /* nieko */ }

const game = new Phaser.Game({
  // ?canvas - silpniems kompiuteriams be grafikos plokštės
  type: new URLSearchParams(location.search).has('canvas') ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  width: 1920,
  height: 1080,
  backgroundColor: '#1a0b2e',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, LobbyScene, MapScene, BroliaiScene, LaiptaiScene, PamokaScene, BusScene, PodiumasScene, KoncertasScene, KinuScene, TenisasScene, RobotasScene, FinalasScene],
});

function go(key) {
  for (const s of game.scene.getScenes(true)) {
    if (s.scene.key !== key && s.scene.key !== 'Boot') s.scene.stop();
  }
  game.scene.start(key);
}

const bots = new Bots(host);
window.AGTA = { net, host, lines, sfx, room, joinUrl, game, go, STAGES, ROUTE, bots };

// ---------------- garsas ----------------
const unlock = () => {
  if (sfx.unlock()) $('audio-unlock').hidden = true;
};
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);
setInterval(() => { if (sfx.ready) $('audio-unlock').hidden = true; }, 1000);

// ---------------- klavišai ----------------
window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === 'h' || e.key === 'H') togglePult();
  // F - visas ekranas, bet ne koncerte: ten F yra rojalio klavišas (Fa)
  if ((e.key === 'f' || e.key === 'F') && !game.scene.isActive('Koncertas')) game.scale.toggleFullscreen();
  if (e.key === 'Escape') { auto.stop(); go('Lobby'); }
});

// ---------------- vedėjo pultas ----------------
function togglePult(force) {
  const p = $('pult');
  p.hidden = force === undefined ? !p.hidden : !force;
}
$('pult-toggle').onclick = () => togglePult();

$('p-room').textContent = room;
$('ver').textContent = VERSION;
document.querySelector('#pult h2').insertAdjacentHTML('beforeend', ` <small style="font: 600 12px Rubik, sans-serif; color: #d8c4ff">${VERSION}</small>`);
$('p-link').href = joinUrl;
$('p-link').textContent = joinUrl;

net.onStatus((s) => {
  const mode = net.mode === 'local' ? 'Vietinis (tik šioje naršyklėje)' : 'Supabase';
  const txt = { online: 'prisijungta', connecting: 'jungiamasi...', offline: 'NĖRA RYŠIO' }[s] || s;
  $('p-net').innerHTML = `<span class="dot ${s}"></span> ${mode}: ${txt}`;
});

function renderClass() {
  const r = host.roster;
  $('p-class').textContent = r.kids.length
    ? `${r.className ? `${r.className} klasė, ` : ''}${host.counts().kidsTotal} vaikų${host.counts().hasTeacher ? ' + mokytoja' : ''}${r.adriana ? ', yra Adrianos galva' : ''}`
    : 'Sąrašas neįkeltas';
  $('p-problems').innerHTML = (r.problems || []).map((x) => `<div>⚠ ${x}</div>`).join('');
}

function renderPlayers() {
  const list = host.list();
  const c = host.counts();
  $('p-count').textContent = `${c.kidsIn} / ${c.kidsTotal}${c.teacherIn ? ' + mokytoja' : ''}`;
  $('p-players').innerHTML = '';
  for (const p of list) {
    const li = document.createElement('li');
    const kid = host.kid(p.name);
    li.innerHTML = `<img alt=""><span></span><button title="Atjungti">✕</button>`;
    li.querySelector('img').src = kid?.avatar || '';
    li.querySelector('span').textContent = `${p.name}${host.isTeacher(p.name) ? ' (mokytoja)' : ''}${p.bot ? ' 🤖' : ''}${host.isOnline(p) ? '' : ' (neaktyvus)'}`;
    li.querySelector('button').onclick = () => {
      if (confirm(`Atjungti ${p.name}?`)) host.kick(p.pid);
    };
    $('p-players').appendChild(li);
  }
}

function renderStages() {
  const box = $('p-stages');
  box.innerHTML = '';
  const add = (label, key) => {
    const b = document.createElement('button');
    b.className = 'btn ghost small';
    b.textContent = label;
    b.onclick = () => go(key);
    box.appendChild(b);
  };
  add('Laukiamasis', 'Lobby');
  add('Žemėlapis', 'Map');
  for (const r of ROUTE) if (r.scene) add(`${r.nr}. ${r.title}`, r.scene);
  const reset = document.createElement('button');
  reset.className = 'btn ghost small';
  reset.textContent = 'Maršrutas iš naujo';
  reset.onclick = () => {
    if (!confirm('Pradėti maršrutą nuo pradžių (visos misijos neįvykdytos)?')) return;
    host.resetProgress();
    go('Map');
  };
  box.appendChild(reset);
}

// ---------------- visas žaidimas automatiškai ----------------
// Įjungus: žemėlapis -> (po kelių s) misijos kortelė -> (po kelių s) etapas -> rezultatai ->
// (po kelių s) žemėlapis ... iki finalo nuotraukos. ENTER - nelaukti. Adrianą visada valdo žmogus.
const AUTO_MS = { map: 4000, intro: 5000, result: 6000, photoDone: 10000 };
const auto = {
  on: false, paused: false, demo: false, key: '', mode: '', since: 0,
  start(demo) {
    this.on = true; this.paused = false; this.demo = demo; this.key = ''; this.since = Date.now();
    host.resetProgress();
    togglePult(false);
    go('Map');
    renderAuto();
  },
  stop() {
    if (!this.on) return;
    this.on = false; this.paused = false;
    restoreEnterTexts();
    renderAuto();
  },
  pause(p) {
    this.paused = p;
    this.since = Date.now();
    if (p) restoreEnterTexts();
    renderAuto();
  },
};

function activeScene() {
  return game.scene.getScenes(true).find((sc) => sc.scene.key !== 'Boot');
}

function sceneState(sc) {
  if (!sc) return '';
  if (sc.scene.key === 'Map') {
    if (sc.nextIndex && sc.nextIndex() === -1) return 'done';
    return sc.ready ? 'map' : 'travel';
  }
  return sc.mode || '';
}

// „ENTER - ...“ užrašus automatikos metu keičiam į atgalinį skaičiavimą.
const enterTexts = new Set();
function walkTexts(list, fn) {
  for (const o of list) {
    if (o.type === 'Text') fn(o);
    if (o.list) walkTexts(o.list, fn);
  }
}
function showCountdown(sc, left) {
  walkTexts(sc.children.list, (t) => {
    const orig = t._enterOrig || t.text;
    const m = /^ENTER - (.+)$/.exec(orig);
    if (!m || !t.active) return;
    t._enterOrig = orig;
    enterTexts.add(t);
    const low = m[1] === m[1].toLowerCase();
    const label = sc.scene.key === 'Map' ? 'MISIJA PRASIDEDA' : m[1] === 'PRADĖTI' ? 'PRADEDAM' : m[1];
    t.setText(`${label}${low ? ' po' : ' PO'} ${left}...`);
  });
}
function restoreEnterTexts() {
  for (const t of enterTexts) if (t.active && t._enterOrig) t.setText(t._enterOrig);
  enterTexts.clear();
}

function renderAuto() {
  const badge = $('auto-badge');
  const pauseBtn = $('p-auto-pause');
  if (!auto.on) {
    $('p-auto').textContent = 'Automatika išjungta';
    badge.hidden = true;
    pauseBtn.hidden = true;
    return;
  }
  const sc = activeScene();
  const where = sc ? (STAGES[ROUTE.find((r) => r.scene === sc.scene.key)?.id]?.title || (sc.scene.key === 'Map' ? 'Žemėlapis' : sc.scene.key)) : '';
  $('p-auto').textContent = `${auto.demo ? 'Demo' : 'Žaidimas'}: ${auto.paused ? 'sustabdyta' : 'vyksta'} · ${where}`;
  badge.hidden = false;
  badge.classList.toggle('paused', auto.paused);
  badge.textContent = auto.paused ? '⏸ AUTO' : '▶ AUTO';
  pauseBtn.hidden = false;
  pauseBtn.textContent = auto.paused ? '▶ Tęsti automatiką' : '⏸ Sustabdyti automatiką';
}

setInterval(() => {
  if (!auto.on) return;
  const sc = activeScene();
  if (!sc) return;
  const key = sc.scene.key;
  const st = sceneState(sc);
  if (key !== auto.key || st !== auto.mode) {
    auto.key = key; auto.mode = st; auto.since = Date.now();
    enterTexts.clear();
    renderAuto();
  }
  if (auto.paused) return;
  if (key === 'Map' && st === 'done') { auto.stop(); $('p-auto').textContent = 'Žaidimas baigtas! 🎄'; return; }
  const wait = key === 'Map' ? (st === 'map' ? AUTO_MS.map : 0) : (AUTO_MS[st] || 0);
  if (!wait) return;
  const left = wait - (Date.now() - auto.since);
  if (left > 0) { showCountdown(sc, Math.ceil(left / 1000)); return; }
  auto.since = Date.now() + 1500; // kad nespaustų kelis kartus iš eilės
  restoreEnterTexts();
  sc.onEnter();
}, 200);

$('p-auto-real').onclick = () => {
  const c = host.counts();
  if (!host.roster.kids.length) { alert('Pirma įkelk klasę.'); return; }
  if (c.kidsIn < c.kidsTotal && !confirm(`Prisijungė ${c.kidsIn} iš ${c.kidsTotal} vaikų. Pradėti žaidimą nuo pirmo etapo?`)) return;
  if (c.kidsIn >= c.kidsTotal && !confirm('Pradėti žaidimą nuo pirmo etapo?')) return;
  auto.start(false);
};
$('p-auto-demo').onclick = async () => {
  if (!host.roster.kids.length) await applyRoster(loadDemoRoster());
  if (!host.roster.kids.length) return;
  bots.fill();
  $('p-auto').textContent = 'Jungiami virtualūs vaikai...';
  const t0 = Date.now();
  while (Date.now() - t0 < 8000) {
    const c = host.counts();
    if (c.kidsIn >= c.kidsTotal && c.teacherIn) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  auto.start(true);
};
$('p-auto-pause').onclick = () => auto.pause(!auto.paused);
window.AGTA.auto = auto;

async function applyRoster(promise) {
  try {
    const roster = await promise;
    host.setRoster(roster);
    renderClass();
  } catch (e) {
    alert(e.message || String(e));
  }
}

$('p-folder').onchange = (e) => applyRoster(loadRosterFromFiles(e.target.files));
$('p-files').onchange = (e) => applyRoster(loadRosterFromFiles(e.target.files));
$('p-demo').onclick = () => applyRoster(loadDemoRoster());
// Demo klasė naršyklėje galėjo likti sena (pvz. 26 vaikai) - visada įkeliam naujausią.
if (host.roster.demo || host.roster.className === 'Demo') {
  loadDemoRoster().then((r) => { host.setRoster(r); renderClass(); }).catch(() => {});
}
$('p-newroom').onclick = () => {
  if (!confirm('Sukurti naują kambario kodą? Visi telefonai turės prisijungti iš naujo.')) return;
  localStorage.setItem(ROOM_KEY, randomRoom());
  location.reload();
};
$('p-clear').onclick = () => {
  if (!confirm('Ištrinti klasės sąrašą, avatarus ir žaidėjus iš šios naršyklės?')) return;
  Host.clearStorage();
  localStorage.removeItem(ROOM_KEY);
  location.reload();
};

function renderBots() {
  const list = host.list().filter((p) => p.bot);
  const t = list.filter((p) => host.isTeacher(p.name)).length;
  const k = list.length - t;
  $('p-bots').textContent = list.length
    ? `Virtualių: ${k} vaikų${t ? ' + mokytoja' : ''} (spaudo mygtukus patys)`
    : 'Virtualių vaikų nėra';
}
$('p-bots-add').onclick = () => {
  if (!host.roster.kids.length) { alert('Pirma įkelk klasę (arba demo klasę).'); return; }
  bots.fill();
};
$('p-bots-del').onclick = () => bots.clear();
host.on('players', renderBots);

host.on('players', renderPlayers);
host.on('roster', renderClass);
setInterval(renderPlayers, 10000);
renderClass();
renderPlayers();
renderStages();
if (!host.roster.kids.length) togglePult(true);
