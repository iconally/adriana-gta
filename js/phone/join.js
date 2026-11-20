// Telefono puslapis: vardas + gimimo data -> avataras -> rolės mygtukai.

import { connectNet } from '../net.js';
import { MONTHS_LT, uid, mdFrom, netModeFromUrl } from '../common.js';
import { VERSION } from '../version.js';

// Vibracija tik po pirmo palietimo (kitaip naršyklė ją blokuoja ir rašo klaidą).
function buzz(pattern) {
  if (!navigator.vibrate) return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  navigator.vibrate(pattern);
}

const $ = (id) => document.getElementById(id);
document.getElementById('ver').textContent = VERSION;
const params = new URLSearchParams(location.search);
const room = (params.get('r') || '').toUpperCase();

const ui = {
  show(id) {
    for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== id;
  },
  msg(title, text = '', btn = null) {
    $('msg-title').textContent = title;
    $('msg-text').textContent = text;
    const b = $('msg-btn');
    b.hidden = !btn;
    if (btn) { b.textContent = btn.label; b.onclick = btn.onClick; }
    ui.show('s-msg');
  },
};

const state = {
  net: null,
  store: null,
  me: null, // { pid, token, name, avatar }
  pid: null,
  sync: null,
  picked: null,
  synced: false,
  waitingClaim: false,
  lastRoleKey: '',
};

if (!room) {
  ui.msg('Nuskenuok QR kodą', 'Šį puslapį reikia atidaryti per QR kodą, rodomą dideliame ekrane.');
} else {
  start();
}

async function start() {
  const net = await connectNet({ side: 'phone', room, mode: netModeFromUrl() });
  state.net = net;
  // Vietiniame režime kiekvienas skirtukas - atskiras "telefonas".
  state.store = net.mode === 'local' ? sessionStorage : localStorage;
  state.pid = params.get('pid') || state.store.getItem('agta.pid') || uid();
  state.store.setItem('agta.pid', state.pid);
  const saved = JSON.parse(state.store.getItem(`agta.me.${room}`) || 'null');

  net.onStatus((s) => {
    $('net').className = `net ${s}`;
    if (s === 'online') hello();
  });
  net.on('sync', onSync);
  net.on('claimed', onClaimed);
  net.on('cue', (d) => {
    if (d.pid !== state.pid) return;
    const el = $('cue');
    el.textContent = d.text;
    el.hidden = false;
    el.classList.remove('show', 'go', 'wait');
    if (d.tone) el.classList.add(d.tone); // go - žalia, wait - raudona
    void el.offsetWidth;
    el.classList.add('show');
    if (d.buzz !== false) buzz([120, 60, 120]);
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.hidden = true; }, d.ms || 3500);
  });
  net.on('kick', (d) => {
    if (d.pid !== state.pid) return;
    forget();
    const text = d.why === 'perimta'
      ? 'Tavo vardu prisijungta kitame telefone.'
      : 'Vedėja tave atjungė.';
    ui.msg('Atsijungei', text, { label: 'Prisijungti iš naujo', onClick: () => showNames() });
  });

  if (saved?.token) state.me = { ...saved, avatar: null };
  ui.msg('Jungiamės...', 'Laukiam didžiojo ekrano.');

  setInterval(() => {
    if (!state.synced || (state.me?.token && !state.me.avatar)) hello();
  }, 3000);
  setInterval(() => { if (state.me?.avatar) state.net.send('ping', { pid: state.pid }); }, 15000);
  // Grįžus į naršyklę (atrakinus telefoną) - iškart pranešam ekranui ir atsinaujinam.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (state.me?.avatar) state.net.send('ping', { pid: state.pid });
    hello();
  });
  buildDateSelects();
}

function hello() {
  if (state.me?.token && !state.me.avatar) {
    state.net.send('rejoin', { pid: state.pid, token: state.me.token, name: state.me.name });
  }
  state.net.send('hello', { pid: state.pid });
}

function forget() {
  state.me = null;
  state.store.removeItem(`agta.me.${room}`);
  state.lastRoleKey = '';
}

// ---------------- vardai ----------------
function onSync(d) {
  state.sync = d;
  state.synced = true;
  if (!state.me?.avatar) {
    if (!state.me?.token) {
      const onDate = !$('s-date').hidden;
      if (!onDate && !state.waitingClaim) showNames();
    }
    return;
  }
  render();
}

function showNames() {
  const box = $('names');
  box.innerHTML = '';
  const names = state.sync?.names || [];
  if (!names.length) {
    ui.msg('Palauk truputį', 'Ekrane dar neįkeltas klasės sąrašas.');
    return;
  }
  for (const n of names) {
    const b = document.createElement('button');
    b.className = `name${n.on ? ' on' : ''}`;
    b.textContent = n.n;
    if (n.on) b.title = 'Jau prisijungęs';
    b.onclick = () => pickName(n.n);
    box.appendChild(b);
  }
  ui.show('s-names');
}

function pickName(name) {
  state.picked = name;
  $('date-name').textContent = name;
  $('date-err').textContent = '';
  $('month').value = '';
  $('day').value = '';
  ui.show('s-date');
}

function buildDateSelects() {
  const m = $('month');
  const d = $('day');
  m.innerHTML = '<option value="">Mėnuo</option>' + MONTHS_LT.map((x, i) => `<option value="${i + 1}">${x}</option>`).join('');
  d.innerHTML = '<option value="">Diena</option>' + Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
  $('date-back').onclick = () => showNames();
  $('date-ok').onclick = () => {
    if (!m.value || !d.value) { $('date-err').textContent = 'Pasirink mėnesį ir dieną.'; return; }
    $('date-ok').disabled = true;
    $('date-err').textContent = '';
    state.waitingClaim = true;
    state.net.send('claim', { pid: state.pid, name: state.picked, md: mdFrom(m.value, d.value) });
    setTimeout(() => {
      if (state.waitingClaim) {
        state.waitingClaim = false;
        $('date-ok').disabled = false;
        $('date-err').textContent = 'Ekranas neatsako. Pabandyk dar kartą.';
      }
    }, 8000);
  };
}

function onClaimed(d) {
  if (d.pid !== state.pid) return;
  state.waitingClaim = false;
  $('date-ok').disabled = false;
  if (!d.ok) {
    if (d.err === 'rejoin') { forget(); if (state.synced) showNames(); return; }
    const errs = {
      data: 'Data nesutampa. Pabandyk dar kartą.',
      lock: `Per daug bandymų. Palauk ${d.wait || 15} s.`,
      nera: 'Tokio vardo sąraše nėra.',
    };
    $('date-err').textContent = errs[d.err] || 'Nepavyko. Pabandyk dar kartą.';
    return;
  }
  state.me = { pid: state.pid, token: d.token, name: d.name, avatar: d.avatar };
  state.store.setItem(`agta.me.${room}`, JSON.stringify({ token: d.token, name: d.name }));
  $('me-avatar').src = d.avatar || '';
  $('role-avatar').src = d.avatar || '';
  $('me-name').textContent = d.name;
  $('role-me').textContent = d.name;
  $('wait-text').textContent = 'Tu prisijungei! Žiūrėk į ekraną - ten tavo avataras.';
  ui.show('s-wait');
  buzz([40, 40, 40]);
  if (state.sync) setTimeout(render, 1200);
}

// ---------------- rolė ir mygtukai ----------------
function render() {
  const s = state.sync;
  if (!s || !state.me?.avatar) return;
  const roleId = s.roles?.map?.[state.pid];
  const role = roleId ? s.roles.defs[roleId] : null;

  if (s.phase === 'result' || !role) {
    $('wait-text').textContent = s.phase === 'result' ? 'Misija baigta! Žiūrėk į ekraną.' : 'Žiūrėk į ekraną!';
    $('me-name').textContent = state.me.name;
    ui.show('s-wait');
    state.lastRoleKey = '';
    return;
  }

  // raktas keičiasi ir tada, kai scena pakeičia klausimą ar mygtukų užrašus (pvz. kinų viktorina)
  const key = `${s.stage}:${roleId}:${role.emoji}:${role.desc}:${role.buttons.map((b) => `${b.emoji}${b.label}`).join('|')}`;
  if (key !== state.lastRoleKey) {
    state.lastRoleKey = key;
    $('role-emoji').textContent = role.emoji;
    $('role-name').textContent = role.name;
    $('role-name').hidden = !role.name;
    $('role-desc').textContent = role.desc;
    const box = $('buttons');
    box.innerHTML = '';
    for (const b of role.buttons) box.appendChild(makeButton(b));
    buzz(60);
  }
  const live = s.phase === 'play' || s.phase === 'lobby';
  $('role-state').textContent = {
    lobby: 'Laukiam pradžios. Gali pasisveikinti!',
    intro: 'Tuoj prasidės! Pasiruošk...',
    play: 'Spausk!',
  }[s.phase] || '';
  $('role-state').className = `state ${s.phase}`;
  // nuolatinė žinutė viršuje (pvz. „ATVIRUKAS PAS TAVE!“)
  const st = s.status;
  const mine = st ? (st.by && state.pid in st.by ? st.by[state.pid] : st.all) : null;
  const box = $('status');
  if (mine && mine.text && s.phase === 'play') {
    box.textContent = mine.text;
    box.className = `status ${mine.tone || ''}`;
    box.hidden = false;
    if (mine.holder && !state.wasHolder) buzz([150, 60, 150]);
  } else {
    box.hidden = true;
  }
  state.wasHolder = !!(mine && mine.holder && s.phase === 'play');
  for (const btn of document.querySelectorAll('#buttons .act')) {
    const id = btn.dataset.id;
    const locked = !!(s.locks && id in s.locks && s.locks[id] !== state.pid);
    btn.classList.toggle('off', !live || locked);
    btn.classList.toggle('locked', locked);
  }
  ui.show('s-role');
}

function makeButton(def) {
  const btn = document.createElement('button');
  btn.className = 'act';
  btn.dataset.id = def.id;
  btn.innerHTML = `<span class="emo">${def.emoji}</span><span class="lbl"></span><span class="ok"></span><span class="cd"></span>`;
  btn.querySelector('.lbl').textContent = def.label;
  let busyUntil = 0;
  const press = (ev) => {
    ev.preventDefault();
    if (btn.classList.contains('off')) return;
    const now = Date.now();
    if (now < busyUntil) return;
    busyUntil = now + (def.cd || 1200);
    state.net.send('press', { pid: state.pid, a: def.id });
    buzz(25);
    const ok = btn.querySelector('.ok');
    ok.textContent = def.ok || '✓';
    btn.classList.remove('pop');
    void btn.offsetWidth;
    btn.classList.add('pop');
    const cd = btn.querySelector('.cd');
    cd.style.transition = 'none';
    cd.style.transform = 'scaleX(1)';
    void cd.offsetWidth;
    cd.style.transition = `transform ${def.cd || 1200}ms linear`;
    cd.style.transform = 'scaleX(0)';
  };
  btn.addEventListener('pointerdown', press);
  btn.addEventListener('click', (e) => e.preventDefault());
  return btn;
}
