// Klasės sąrašo įkėlimas. Sąrašas su gimimo datomis ir avatarais
// laikomas TIK pristatymo kompiuteryje, niekada ne GitHub.
//
// Aplanko turinys:
//   klase.json      - sąrašas (žr. demo/klase-demo.json)
//   jonas.png ...   - vaikų avatarai (failų vardai nurodyti klase.json)
//   adriana.png     - Adrianos galva (nebūtina)

import { normMD, isBoy } from '../common.js';

const AVATAR_SIZE = 128;

export async function loadRosterFromFiles(fileList) {
  const files = Array.from(fileList || []);
  const jsonFile = files.find((f) => /\.json$/i.test(f.name));
  if (!jsonFile) throw new Error('Aplanke nerastas klase.json failas.');
  const data = JSON.parse(await jsonFile.text());
  const byName = new Map(files.map((f) => [f.name.toLowerCase(), f]));
  const findImage = (name) => (name ? byName.get(String(name).toLowerCase()) : null);
  return buildRoster(data, async (fileName) => {
    const f = findImage(fileName);
    return f ? fileToAvatar(f) : null;
  });
}

export async function loadDemoRoster() {
  const res = await fetch('demo/klase-demo.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Nepavyko įkelti demo klasės.');
  return buildRoster(await res.json(), async () => null);
}

async function buildRoster(data, loadImage) {
  const list = Array.isArray(data.vaikai) ? data.vaikai : [];
  const seen = new Set();
  const kids = [];
  const problems = [];
  for (const [i, v] of list.entries()) {
    const name = String(v.vardas || '').trim();
    const md = normMD(v.gimimo_data);
    if (!name) { problems.push(`${i + 1} eilutė: nėra vardo`); continue; }
    if (!md) { problems.push(`${name}: neteisinga gimimo data "${v.gimimo_data}"`); continue; }
    if (seen.has(name.toLowerCase())) { problems.push(`${name}: vardas kartojasi (pridėk pavardės raidę)`); continue; }
    seen.add(name.toLowerCase());
    const avatar = (await loadImage(v.avataras)) || placeholderAvatar(name);
    kids.push({ name, md, avatar, teacher: !!v.mokytoja });
  }
  kids.sort((a, b) => a.name.localeCompare(b.name, 'lt'));
  const adriana = data.adriana ? await loadImage(data.adriana) : null;
  return { className: data.klase || '', kids, adriana, problems };
}

function fileToAvatar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = AVATAR_SIZE;
      const ctx = c.getContext('2d');
      const s = Math.min(img.width, img.height);
      const r = AVATAR_SIZE / 2;
      // Apvalus rėmelis - visi avatarai atrodo vienodai.
      ctx.fillStyle = '#14081f';
      ctx.beginPath(); ctx.arc(r, r, r - 1, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.beginPath(); ctx.arc(r, r, r - 6, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#2a0d45';
      ctx.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
      ctx.restore();
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`Nepavyko atidaryti ${file.name}`)); };
    img.src = url;
  });
}

const PALETTE = ['#ff3ea5', '#2de2e6', '#ffb000', '#8a5cff', '#3ddc84', '#ff6b3d', '#4da3ff', '#ff5c8a'];
const BOY_PALETTE = ['#2de2e6', '#ffb000', '#8a5cff', '#3ddc84', '#ff6b3d', '#4da3ff'];

export function placeholderAvatar(name) {
  const c = document.createElement('canvas');
  c.width = c.height = AVATAR_SIZE;
  const ctx = c.getContext('2d');
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pal = isBoy(name) ? BOY_PALETTE : PALETTE;
  const color = pal[h % pal.length];
  const r = AVATAR_SIZE / 2;
  ctx.fillStyle = '#14081f';
  ctx.beginPath(); ctx.arc(r, r, r - 2, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createLinearGradient(0, 0, 0, AVATAR_SIZE);
  g.addColorStop(0, color);
  g.addColorStop(1, '#2a0d45');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(r, r, r - 8, 0, Math.PI * 2); ctx.fill();
  const initials = name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  ctx.font = `bold ${Math.round(AVATAR_SIZE * 0.42)}px Anton, Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#14081f';
  ctx.strokeText(initials, r, r + 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(initials, r, r + 4);
  return c.toDataURL('image/png');
}
