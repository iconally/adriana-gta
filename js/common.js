// Bendros pagalbinės funkcijos ekranui ir telefonui.

export const MONTHS_LT = [
  'sausis', 'vasaris', 'kovas', 'balandis', 'gegužė', 'birželis',
  'liepa', 'rugpjūtis', 'rugsėjis', 'spalis', 'lapkritis', 'gruodis',
];

export function uid(len = 12) {
  const abc = 'abcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => abc[b % abc.length]).join('');
}

export function randomRoom() {
  const abc = 'ABCDEFGHJKLMNPRSTUVZ';
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (b) => abc[b % abc.length]).join('');
}

// "2016-03-14", "03-14", "3-14" -> "03-14". Kitaip null.
export function normMD(value) {
  if (!value) return null;
  const s = String(value).trim();
  let m = s.match(/^\d{4}-(\d{1,2})-(\d{1,2})$/) || s.match(/^(\d{1,2})-(\d{1,2})$/);
  if (!m) return null;
  const mm = Number(m[1]);
  const dd = Number(m[2]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  return `${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

export function mdFrom(month, day) {
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Lietuviški berniukų vardai baigiasi -s (Jonas, Matas, Herkus...).
export function isBoy(name) {
  const first = String(name || '').trim().split(/\s+/)[0].toLowerCase();
  return first.endsWith('s');
}

// Drabužių spalvos: berniukams be rožinės.
export const GIRL_COLORS = [0xff6fb5, 0x6fe6ff, 0xffd166, 0xa98bff, 0x7dff9b, 0xff9a6b];
export const BOY_COLORS = [0x4da3ff, 0x6fe6ff, 0x7dff9b, 0xffd166, 0xff9a6b, 0x8a7dff];

// Mokytojos užrašas ekrane: "Daiva" -> "Mokytoja Daiva" (jei sąraše jau parašyta "Mokytoja ..." - paliekam).
export function teacherLabel(name) {
  if (!name) return 'Mokytoja';
  return /mokytoj/i.test(name) ? name : `Mokytoja ${name}`;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fill(template, vars = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

export class EventBus {
  constructor() { this._h = new Map(); }
  on(type, fn) {
    if (!this._h.has(type)) this._h.set(type, new Set());
    this._h.get(type).add(fn);
    return () => this._h.get(type)?.delete(fn);
  }
  emit(type, data) {
    for (const fn of this._h.get(type) || []) {
      try { fn(data); } catch (e) { console.error(`[bus] ${type}`, e); }
    }
  }
}

export function baseUrl() {
  const cfg = window.AGTA_CONFIG || {};
  if (cfg.PUBLIC_BASE_URL) return cfg.PUBLIC_BASE_URL.replace(/\/?$/, '/');
  return new URL('./', location.href).href;
}

export function netModeFromUrl() {
  const p = new URLSearchParams(location.search).get('net');
  return p === 'local' ? 'local' : 'auto';
}
