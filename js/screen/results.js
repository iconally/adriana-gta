// Asmeninis rezultatas telefone po kiekvienos misijos.
// Ekrane - visos klasės rezultatai, telefone - ką padarė būtent tu:
// apdovanojimai (tie patys, kaip ekrane) ir 2-3 tavo skaičiai.

// Mygtukų paspaudimai būtuoju laiku („rolė:mygtukas“). Mokytojai - „jūs“ forma.
const DID = {
  'ramintojas:zaislas': '🧸 Davei žaisliuką',
  'ramintojas:lopsine': '🎵 Dainavai lopšinę',
  'gasdintojas:bu': '👻 Sušukai „BŪ!“',
  'gasdintojas:kaukti': '🐺 Kaukei kaip vilkas',
  'sviesa:isjungti': '🌑 Išjungei šviesą',
  'sviesa:girlianda': '✨ Įjungei girliandą',
  'stebukladare:skambutis': '🔔 Skambinote į duris',
  'krovikas:knyga': '📕 Įmetei knygą',
  'krovikas:mandarinas': '🍊 Įmetei mandariną',
  'begikas:begti': '🏃 Nubėgai žemyn',
  'begikas:paslysti': '💫 Paslydai',
  'budetoja:duris': '🚪 Laikėte duris',
  'budetoja:svilpukas': '📢 Švilpėte',
  'smalsuolis:klausti': '🙋 Klausei mokytojos',
  'mandarinas:mandarinas': '🍊 Valgei mandariną',
  'daina:dainuoti': '🎵 Dainavai dainelę',
  'snabzdukas:snabzdeti': '🤫 Šnabždėjai',
  'ciaudulys:ciaudeti': '🤧 Čiaudėjai',
  'penalas:penalas': '✏️ Numetei penalą',
  'mieguistas:ziovauti': '🥱 Žiovavai',
  'ranka:ranka': '✋ Kėlei ranką',
  'lenta:atsisukti': '👀 Atsisukote',
  'lenta:rasyti': '✏️ Rašėte lentoje',
  'kelyje:tupti': '🙇 Pritūpei',
  'lipdytojas:lipdyti': '⛄ Lipdei senį',
  'lipdytojas:mojuoti': '👋 Mojavai',
  'griovejas:spirti': '🦶 Spyrei senį',
  'griovejas:juoktis': '😂 Juokeisi',
  'ciuozejas:ciuozti': '⛸️ Čiuožei',
  'ciuozejas:griuti': '💫 Griuvai',
  'laukiantis:laikrodis': '⌚ Žiūrėjai į laikrodį',
  'laukiantis:skubek': '📣 Šaukei „Skubėk!“',
  'vairuotoja:pypseti': '📯 Pypsėjote',
  'vairuotoja:duris': '🚪 Laikėte duris',
  'keleivis:mojuoti': '👋 Mojavai pro langą',
  'keleivis:duris': '🚪 Laikei duris',
  'fotografas:ploti': '👏 Plojai',
  'fotografas:foto': '📸 Fotografavai',
  'vejas:ploti': '👏 Plojai',
  'vejas:vejas': '💨 Pūtei vėją',
  'sniegas:ploti': '👏 Plojai',
  'sniegas:sniegas': '❄️ Paleidai sniegą',
  'komisija:bravo': '🌟 „Bravo!“',
  'komisija:zvilgsnis': '🧐 Griežtas žvilgsnis',
  'varpeliai:nusilenkti': '🙇 Nusilenkei',
  'smuikai:nusilenkti': '🙇 Nusilenkei',
  'bugnai:nusilenkti': '🙇 Nusilenkei',
  'trimitai:nusilenkti': '🙇 Nusilenkei',
  'dirigente:visi': '🎼 „Visi kartu!“',
  'dirigente:tyliai': '🤫 „Ššš!“',
  'laoshi:leciau': '🐢 „Lėčiau!“',
  'laoshi:hongbao': '🧧 Hongbao',
  'teiseja:tyla': '🤫 „Tyla!“',
  'vadove:padeti': '🧹 „Padėti“',
  'vadove:greiciau': '⏩ „Greičiau“',
  'vedeja:skaiciuoti': '🎄 Skaičiavote „3-2-1“',
  'vedeja:muzika': '🎶 Muzika',
};

// Šių mygtukų paspaudimų neskaičiuojam - jų rezultatą etapas parodo tiksliau
// (pvz. ne kiek spaudei „Perduoti“, o kiek kartų tikrai perdavei atviruką).
const SKIP = new Set(['perduoti', 'mesti', 'groti', 'a', 'b', 'kaire', 'centras', 'desine', 'kasti', 'zaisliukas', 'izziebk', 'stebuklas', 'aut', 'fejerverkas']);

export const sec = (ms, d = 1) => `${(ms / 1000).toFixed(d).replace('.', ',')} s`;

// Geriausias pagal skaičių (tas pats, kas rodomas ekrane): [stat, n] arba undefined.
export const bestOf = (stats, fn) => [...stats.values()].map((x) => [x, typeof fn === 'string' ? (x.counts[fn] || 0) : fn(x)])
  .filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];

// Siunčia rezultatus telefonams.
//   head, ok - antraštė (kaip ekrane); headFor(p, role) - kitokia antraštė konkrečiam vaikui: [tekstas, ok]
//   rows(p, st, role) - etapo eilutės [[tekstas, reikšmė], ...] (rodomos pirmos)
//   awards - [[pid, emoji, tekstas vaikui, tekstas mokytojai?], ...]
//   foot - apačios užrašas; last - paskutinė misija (nebėra „kitos misijos“)
export function phoneResult(scene, { head, ok = true, headFor, rows, awards = [], foot, last = false }) {
  const host = scene.A.host;
  const stats = scene.stats || new Map();
  const stage = host.stage;
  const per = {};
  for (const p of host.list()) {
    const role = host.roles[p.pid];
    const teacher = host.isTeacher(p.name);
    const st = stats.get(p.pid) || null;
    const list = (rows ? rows(p, st, role, teacher) || [] : []).filter(Boolean);
    const pressed = host.presses[p.pid] || {};
    for (const b of stage.roles[role]?.buttons || []) {
      const n = pressed[b.id];
      if (!n || SKIP.has(b.id)) continue;
      list.push([DID[`${role}:${b.id}`] || `${b.emoji} ${b.label}`, String(n)]);
    }
    const h = headFor ? headFor(p, role, teacher) : null;
    per[p.pid] = { t: teacher ? 1 : 0, rows: list.slice(0, 3).map(([a, b]) => [a, b == null ? '' : String(b)]), aw: [], h: h || undefined };
  }
  const seen = new Set();
  for (const a of awards) {
    if (!a) continue;
    const [pid, i, kid, adult] = a;
    const r = pid && per[pid];
    if (!r || seen.has(`${pid}:${kid}`)) continue;
    seen.add(`${pid}:${kid}`);
    r.aw.push({ i, t: r.t && adult ? adult : kid });
  }
  host.setResult({ nr: stage.nr, title: stage.title, head, ok, foot: foot || 'Visi rezultatai - ekrane 👀', last, per });
}
