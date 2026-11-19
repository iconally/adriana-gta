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
  broliai: {
    id: 'broliai',
    nr: 1,
    title: 'Soskė broliukams',
    mission: 'NURAMINK BROLIUKUS',
    // Klasiokų namuose nesimato - matosi tik jų veiksmai.
    // Grupės sumaišytos, kad ir su keliais vaikais būtų visko po truputį:
    // 8 ramintojai, 5 gąsdintojai, 4 prie šviesos jungiklio.
    slots: [
      'ramintojas', 'gasdintojas', 'sviesa',
      'ramintojas', 'gasdintojas', 'ramintojas', 'sviesa',
      'ramintojas', 'gasdintojas', 'ramintojas', 'sviesa',
      'ramintojas', 'gasdintojas', 'ramintojas', 'sviesa',
      'ramintojas', 'gasdintojas',
    ],
    fallback: 'ramintojas',
    teacherRole: 'stebukladare',
    roles: {
      ramintojas: {
        name: 'Ramintojas', emoji: '🧸', desc: 'Padėk Adrianai! Mesk broliukams žaisliuką arba dainuok lopšinę - jie verks mažiau.',
        buttons: [
          { id: 'zaislas', label: 'Duoti žaisliuką', emoji: '🧸', cd: 2500, ok: 'Pagavo!' },
          { id: 'lopsine', label: 'Lopšinė', emoji: '🎵', cd: 1500, ok: '♪ ♫' },
        ],
      },
      gasdintojas: {
        name: 'Gąsdintojas', emoji: '👻', desc: 'Tu - šešėlis už kampo. Gąsdink broliukus, kad verktų dar garsiau!',
        buttons: [
          { id: 'bu', label: 'BŪ!', emoji: '👻', cd: 4000, ok: 'BŪ!' },
          { id: 'kaukti', label: 'Kaukti kaip vilkas', emoji: '🐺', cd: 2000, ok: 'AUUU!' },
        ],
      },
      sviesa: {
        name: 'Šviesos jungiklis', emoji: '💡', desc: 'Tu prie jungiklio! Išjunk šviesą - Adrianai bus tamsu ieškoti. Arba įjunk kalėdinę girliandą.',
        buttons: [
          { id: 'isjungti', label: 'Išjungti šviesą', emoji: '🌑', cd: 6000, ok: 'Tamsu!' },
          { id: 'girlianda', label: 'Girlianda', emoji: '✨', cd: 1500, ok: 'Mirga!' },
        ],
      },
      stebukladare: {
        name: 'Kalėdų stebukladarė', emoji: '🗼', desc: 'Jūs turite vieną stebuklą: uždekite TV bokštą kaip eglę ir broliukai nurims. Arba paskambinkite į duris...',
        buttons: [
          { id: 'stebuklas', label: 'Stebuklas (1 kartą)', emoji: '🎄', cd: 30000, ok: 'Bokštas šviečia!' },
          { id: 'skambutis', label: 'Skambinti į duris', emoji: '🔔', cd: 5000, ok: 'DING-DONG!' },
        ],
      },
    },
  },
  laiptai: {
    id: 'laiptai',
    nr: 2,
    title: 'Laiptai su kuprine',
    mission: 'UŽLIPK Į MOKYKLĄ',
    // 5 stūmikai, 4 krovikai, 4 prie lango, 4 bėgikai - sumaišyta, kad
    // ir su keliais vaikais būtų visko po truputį.
    slots: [
      'stumikas', 'krovikas', 'langas', 'begikas',
      'stumikas', 'krovikas', 'langas', 'begikas',
      'stumikas', 'krovikas', 'langas', 'begikas',
      'stumikas', 'krovikas', 'langas', 'begikas',
      'stumikas',
    ],
    fallback: 'stumikas',
    teacherRole: 'budetoja',
    roles: {
      stumikas: {
        name: 'Stūmikas', emoji: '💪', desc: 'Padėk Adrianai užlipti: pastumk ją iš apačios arba šauk „Pirmyn!“',
        buttons: [
          { id: 'stumti', label: 'Pastumti', emoji: '💪', cd: 2000, ok: 'Hop!' },
          { id: 'pirmyn', label: 'Šaukti „Pirmyn!“', emoji: '📣', cd: 1500, ok: 'Pirmyn!' },
        ],
      },
      krovikas: {
        name: 'Kuprinės krovikas', emoji: '📚', desc: 'Adrianos kuprinė per lengva! Įmesk knygą - ji lips lėčiau. Arba mandariną - tiesiog juokui.',
        buttons: [
          { id: 'knyga', label: 'Įmesti knygą', emoji: '📕', cd: 3500, ok: 'Sunkiau!' },
          { id: 'mandarinas', label: 'Įmesti mandariną', emoji: '🍊', cd: 1500, ok: 'Skanu!' },
        ],
      },
      langas: {
        name: 'Prie lango', emoji: '🪟', desc: 'Stovi prie aprasojusio lango. Piešk ant jo pirštu arba mojuok Adrianai!',
        buttons: [
          { id: 'piesti', label: 'Piešti ant lango', emoji: '✏️', cd: 1500, ok: 'Gražu!' },
          { id: 'mojuoti', label: 'Mojuoti', emoji: '👋', cd: 1500, ok: 'Labas!' },
        ],
      },
      begikas: {
        name: 'Bėgikas per pertrauką', emoji: '🏃', desc: 'Pertrauka! Lėk laiptais žemyn pro Adrianą arba... paslysk.',
        buttons: [
          { id: 'begti', label: 'Nubėgti žemyn', emoji: '🏃', cd: 2000, ok: 'Vžžž!' },
          { id: 'paslysti', label: 'Paslysti', emoji: '💫', cd: 2500, ok: 'Oi!' },
        ],
      },
      budetoja: {
        name: 'Budinti mokytoja', emoji: '🔔', desc: 'Jūs budite prie 3 aukšto durų. Palaikykite duris (+1 s) arba švilpkite - stūmikai stums stipriau!',
        buttons: [
          { id: 'duris', label: 'Laikyti duris', emoji: '🚪', cd: 2500, ok: '+1 s!' },
          { id: 'svilpukas', label: 'Švilpukas', emoji: '📢', cd: 8000, ok: 'FIIIT!' },
        ],
      },
    },
  },
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
  { id: 'broliai', nr: 1, title: 'Soskė broliukams', mission: 'NURAMINK BROLIUKUS', place: 'Namai', where: 'Namai', icon: '🏠', pos: [1016, 183], scene: 'Broliai' },
  { id: 'laiptai', nr: 2, title: 'Laiptai su kuprine', mission: 'UŽLIPK Į MOKYKLĄ', place: 'Mokykla', where: 'Mokykla', icon: '🎒', pos: [331, 256], scene: 'Laiptai' },
  { id: 'pamoka', nr: 3, title: 'Kai mokytoja nusisuka', mission: 'PERDUOK ATVIRUKĄ', place: 'Klasė', where: 'Klasė', icon: '✏️', pos: [426, 331], scene: null },
  { id: 'autobusas', nr: 4, title: 'Bėgimas iki autobuso', mission: 'SPĖK Į AUTOBUSĄ', place: 'Stotelė', where: 'Stotelė prie Akropolio', icon: '🚌', pos: [725, 219], scene: 'Bus' },
  { id: 'podiumas', nr: 5, title: 'Podiumas', mission: 'NENUGRIŪK PODIUME', place: 'Mados šou', where: 'Vingio estrada', icon: '👗', pos: [464, 644], scene: null },
  { id: 'pianinas', nr: 6, title: 'Pianinas', mission: 'SUGROK KALĖDAS', place: 'Piano koncertas', where: 'Filharmonija', icon: '🎹', pos: [1407, 796], scene: null },
  { id: 'kinu', nr: 7, title: 'Kinų kalba', mission: 'KINŲ KALBOS IŠŠŪKIS', place: 'Kinų kalbos pamoka', where: 'Konfucijaus institutas', icon: '🐼', pos: [1297, 715], scene: null },
  { id: 'tenisas', nr: 8, title: 'Tenisas', mission: 'ATMUŠK KAMUOLIUKUS', place: 'Teniso treniruotė', where: 'Kalnų parkas', icon: '🎾', pos: [1755, 475], scene: null },
  { id: 'robotas', nr: 9, title: 'Dovanų robotas', mission: 'UŽPROGRAMUOK ROBOTĄ', place: 'Programavimo būrelis', where: 'Baltasis tiltas', icon: '🤖', pos: [863, 392], scene: null },
  { id: 'finalas', nr: 10, title: 'Finalas: eglė', mission: 'UŽDEK EGLĘ', place: 'Kalėdinis klasės vakarėlis', where: 'Katedros aikštė', icon: '🎄', pos: [1325, 582], scene: null },
];

export const STAGE_ORDER = ROUTE.filter((r) => r.scene).map((r) => r.id);
