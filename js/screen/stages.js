// Etapų aprašai: pavadinimai ir klasiokų rolės.
// Kiekviena rolė turi 1-2 mygtukus. "cd" - pertrauka tarp paspaudimų (ms),
// "ok" - trumpas tekstas telefone po paspaudimo.
// Dauguma rolių yra FONINĖS (tik matomos ekrane). Įtakos rolėms
// nurodomas "max", kad jų nebūtų per daug.

export const LOBBY = {
  id: 'lobby',
  title: 'Laukiamasis',
  roles: {
    svecias: {
      name: 'Svečias', emoji: '🎄', desc: 'Pasisveikink su visais, kol laukiam pradžios!', weight: 1,
      buttons: [
        { id: 'labas', label: 'Labas!', emoji: '👋', cd: 1500, ok: 'Ekrane matai save?' },
        { id: 'sokti', label: 'Pašokti', emoji: '🕺', cd: 1500, ok: 'Šoki!' },
      ],
    },
  },
};

export const STAGES = {
  autobusas: {
    id: 'autobusas',
    nr: 4,
    title: 'Bėgimas iki autobuso',
    mission: 'SPĖK Į AUTOBUSĄ',
    // 17 vietų pagal prioritetą (klasėje 17 vaikų be Adrianos). Vaikai išdalijami
    // atsitiktinai, o vietos pildomos iš eilės: pirma 2 kelyje (žaidimui būtini),
    // tada pilnos bendros grupės, tada dar 2 kelyje, stotelė ir keleivis.
    // Neprisijungęs vaikas tiesiog nerodomas.
    slots: [
      'kelyje', 'kelyje',
      'lipdytojas', 'lipdytojas', 'lipdytojas',
      'griovejas', 'griovejas', 'griovejas',
      'ciuozejas', 'ciuozejas', 'ciuozejas',
      'kelyje', 'kelyje',
      'laukiantis', 'laukiantis', 'laukiantis',
      'keleivis',
    ],
    fallback: 'keleivis',
    teacherRole: 'vairuotoja',
    roles: {
      kelyje: {
        name: 'Adrianos kelyje', emoji: '🧍', desc: 'Stovi ant šaligatvio. Kai ekrane pasirodysi, mesk gniūžtę arba pritūpk, kad Adriana lengviau peršoktų!',
        buttons: [
          { id: 'mesti', label: 'Mesti gniūžtę', emoji: '❄️', cd: 1500, ok: 'Skrenda!' },
          { id: 'tupti', label: 'Pritūpti', emoji: '🙇', cd: 1500, ok: 'Pritūpei!' },
        ],
      },
      lipdytojas: {
        name: 'Sniego senio lipdytojas', emoji: '⛄', desc: 'Su draugais lipdykit sniego senį kieme!',
        buttons: [
          { id: 'lipdyti', label: 'Lipdyti', emoji: '⛄', cd: 900, ok: 'Auga!' },
          { id: 'mojuoti', label: 'Mojuoti', emoji: '👋', cd: 1500, ok: 'Labas!' },
        ],
      },
      griovejas: {
        name: 'Sniego senio griovėjas', emoji: '🦶', desc: 'Jūsų sniego senis per gražus. Sugriaukit jį!',
        buttons: [
          { id: 'spirti', label: 'Spirti', emoji: '🦶', cd: 900, ok: 'Bum!' },
          { id: 'juoktis', label: 'Juoktis', emoji: '😂', cd: 1500, ok: 'Cha cha!' },
        ],
      },
      ciuozejas: {
        name: 'Čiuožėjas', emoji: '⛸️', desc: 'Čiuožk ant ledo kieme. Atsargiai!',
        buttons: [
          { id: 'ciuozti', label: 'Čiuožti', emoji: '⛸️', cd: 1300, ok: 'Vžžž!' },
          { id: 'griuti', label: 'Griūti', emoji: '💫', cd: 1800, ok: 'Ai!' },
        ],
      },
      laukiantis: {
        name: 'Laukia stotelėje', emoji: '🚏', desc: 'Sėdi stotelėje ir lauki Adrianos. Kai atvažiuos autobusas, įlipsit kartu!',
        buttons: [
          { id: 'laikrodis', label: 'Žiūrėti į laikrodį', emoji: '⌚', cd: 1500, ok: 'Tik-tak!' },
          { id: 'skubek', label: 'Šaukti „Skubėk!“', emoji: '📣', cd: 1500, ok: 'Girdi!' },
        ],
      },
      vairuotoja: {
        name: 'Autobuso vairuotoja', emoji: '🚍', desc: 'Jūs vairuojate Adrianos autobusą! Pypsėkit ir palaikykit duris.',
        buttons: [
          { id: 'pypseti', label: 'Pypsėti', emoji: '📯', cd: 1500, ok: 'PYP PYP!' },
          { id: 'duris', label: 'Laikyti duris', emoji: '🚪', cd: 1200, ok: 'Laukiam!' },
        ],
      },
      keleivis: {
        name: 'Keleivis', emoji: '🚌', desc: 'Tu jau autobuse! Mojuok pro langą ir laikyk duris, kad Adriana spėtų.',
        buttons: [
          { id: 'mojuoti', label: 'Mojuoti', emoji: '👋', cd: 1800, ok: 'Ieškok savęs lange!' },
          { id: 'duris', label: 'Laikyti duris', emoji: '🚪', cd: 1500, ok: 'Duris laikai!' },
        ],
      },
    },
  },
};

// Visas dienos maršrutas žemėlapyje. "scene" - Phaser scena; null - dar kuriama
// (žemėlapyje toks etapas praleidžiamas). "pos" - taško vieta žemėlapyje (1920x1080).
export const ROUTE = [
  { id: 'broliai', nr: 1, title: 'Soskė broliukams', mission: 'NURAMINK BROLIUKUS', place: 'Namai', icon: '🏠', pos: [1161, 176], scene: null },
  { id: 'laiptai', nr: 2, title: 'Laiptai su kuprine', mission: 'UŽLIPK Į MOKYKLĄ', place: 'Mokykla', icon: '🎒', pos: [363, 258], scene: null },
  { id: 'pamoka', nr: 3, title: 'Kai mokytoja nusisuka', mission: 'PERDUOK ATVIRUKĄ', place: 'Klasė', icon: '✏️', pos: [458, 333], scene: null },
  { id: 'autobusas', nr: 4, title: 'Bėgimas iki autobuso', mission: 'SPĖK Į AUTOBUSĄ', place: 'Stotelė prie Akropolio', icon: '🚌', pos: [844, 216], scene: 'Bus' },
  { id: 'podiumas', nr: 5, title: 'Podiumas', mission: 'NENUGRIŪK PODIUME', place: 'Vingio estrada', icon: '👗', pos: [526, 646], scene: null },
  { id: 'pianinas', nr: 6, title: 'Pianinas', mission: 'SUGROK KALĖDAS', place: 'Filharmonija', icon: '🎹', pos: [1465, 796], scene: null },
  { id: 'kinu', nr: 7, title: 'Kinų kalba', mission: 'KINŲ KALBOS IŠŠŪKIS', place: 'Konfucijaus institutas', icon: '🐼', pos: [1382, 713], scene: null },
  { id: 'tenisas', nr: 8, title: 'Tenisas', mission: 'ATMUŠK KAMUOLIUKUS', place: 'Kalnų parkas', icon: '🎾', pos: [1759, 491], scene: null },
  { id: 'robotas', nr: 9, title: 'Dovanų robotas', mission: 'UŽPROGRAMUOK ROBOTĄ', place: 'Baltasis tiltas', icon: '🤖', pos: [1011, 409], scene: null },
  { id: 'finalas', nr: 10, title: 'Finalas: eglė', mission: 'UŽDEK EGLĘ', place: 'Katedros aikštė', icon: '🎄', pos: [1403, 590], scene: null },
];

export const STAGE_ORDER = ROUTE.filter((r) => r.scene).map((r) => r.id);
