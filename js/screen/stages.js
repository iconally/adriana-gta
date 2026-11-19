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
    roles: {
      sniegas: {
        name: 'Gniūžčių mėtytojas', emoji: '❄️', desc: 'Mėtyk gniūžtes į medžius, žibintus ir sniego senį!', weight: 5,
        buttons: [{ id: 'mesti', label: 'Mesti gniūžtę', emoji: '❄️', cd: 1500, ok: 'Skrenda!' }],
      },
      keleivis: {
        name: 'Keleivis', emoji: '🚌', desc: 'Tu jau autobuse! Mojuok pro langą.', weight: 2,
        buttons: [{ id: 'mojuoti', label: 'Mojuoti', emoji: '👋', cd: 2000, ok: 'Ieškok savęs lange!' }],
      },
      duris: {
        name: 'Vairuotojo draugas', emoji: '🚪', desc: 'Palaikyk autobuso duris - Adriana gaus daugiau laiko!', weight: 2, max: 4,
        buttons: [{ id: 'duris', label: 'Palaikyti duris', emoji: '🚪', cd: 1500, ok: 'Duris laikai!' }],
      },
      sirgalius: {
        name: 'Sirgalius', emoji: '📣', desc: 'Palaikyk Adrianą šūksniais!', weight: 2,
        buttons: [
          { id: 'bek', label: 'Bėk!', emoji: '🏃', cd: 1200, ok: 'Girdi!' },
          { id: 'sok', label: 'Šok!', emoji: '🦘', cd: 1200, ok: 'Girdi!' },
        ],
      },
    },
  },
};

// Visas dienos maršrutas žemėlapyje. "scene" - Phaser scena; null - dar kuriama
// (žemėlapyje toks etapas praleidžiamas). "pos" - taško vieta žemėlapyje (1920x1080).
export const ROUTE = [
  { id: 'broliai', nr: 1, title: 'Soskė broliukams', mission: 'NURAMINK BROLIUKUS', place: 'Namai', icon: '🏠', pos: [250, 800], scene: null },
  { id: 'laiptai', nr: 2, title: 'Laiptai su kuprine', mission: 'UŽLIPK Į MOKYKLĄ', place: 'Mokykla', icon: '🎒', pos: [470, 690], scene: null },
  { id: 'pamoka', nr: 3, title: 'Kai mokytoja nusisuka', mission: 'PERDUOK ATVIRUKĄ', place: 'Klasė', icon: '✏️', pos: [650, 790], scene: null },
  { id: 'autobusas', nr: 4, title: 'Bėgimas iki autobuso', mission: 'SPĖK Į AUTOBUSĄ', place: 'Stotelė', icon: '🚌', pos: [850, 680], scene: 'Bus' },
  { id: 'podiumas', nr: 5, title: 'Podiumas', mission: 'NENUGRIŪK PODIUME', place: 'Modelių būrelis', icon: '👗', pos: [1050, 790], scene: null },
  { id: 'pianinas', nr: 6, title: 'Pianinas', mission: 'SUGROK KALĖDAS', place: 'Muzikos būrelis', icon: '🎹', pos: [1270, 690], scene: null },
  { id: 'kinu', nr: 7, title: 'Kinų kalba', mission: 'KINŲ KALBOS IŠŠŪKIS', place: 'Kinų kalba', icon: '🐼', pos: [1500, 790], scene: null },
  { id: 'tenisas', nr: 8, title: 'Tenisas', mission: 'ATMUŠK KAMUOLIUKUS', place: 'Teniso kortas', icon: '🎾', pos: [1690, 640], scene: null },
  { id: 'robotas', nr: 9, title: 'Dovanų robotas', mission: 'UŽPROGRAMUOK ROBOTĄ', place: 'Programavimas', icon: '🤖', pos: [1520, 470], scene: null },
  { id: 'finalas', nr: 10, title: 'Finalas: eglė', mission: 'UŽDEK EGLĘ', place: 'Katedra', icon: '🎄', pos: [1180, 380], scene: null },
];

export const STAGE_ORDER = ROUTE.filter((r) => r.scene).map((r) => r.id);
