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
import { MapScene } from './scenes/Map.js';
import { VERSION } from '../version.js';
import { Bots } from './bots.js';

const $ = (id) => document.getElementById(id);
const ROOM_KEY = 'agta.room';

const room = (new URLSearchParams(location.search).get('r') || localStorage.getItem(ROOM_KEY) || randomRoom()).toUpperCase();
localStorage.setItem(ROOM_KEY, room);

const net = await connectNet({ side: 'screen', room, mode: netModeFromUrl() });
const host = new Host(net, room);
const lines = await Lines.load(['common', 'broliai', 'laiptai', 'autobusas']);
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
  scene: [BootScene, LobbyScene, MapScene, BroliaiScene, LaiptaiScene, BusScene],
});

function go(key) {
  for (const s of game.scene.getScenes(true)) {
    if (s.scene.key !== key && s.scene.key !== 'Boot') s.scene.stop();
  }
  game.scene.start(key);
}

const bots = new Bots(host);
window.AGTA = { net, host, lines, sfx, room, joinUrl, game, go, STAGES, bots };

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
  if (e.key === 'f' || e.key === 'F') game.scale.toggleFullscreen();
  if (e.key === 'Escape') go('Lobby');
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
  const n = bots.count;
  $('p-bots').textContent = n ? `Virtualių vaikų: ${n} (spaudo mygtukus patys)` : 'Virtualių vaikų nėra';
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
