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

// 3 etapo aprašas telefone visiems vaikams (rolių pavadinimų nerodom - skiriasi tik antras mygtukas).
const KLASE_DESC = 'Kai atvirukas bus pas tave, viršuje atsiras žinutė. Tada spausk PERDUOTI, kol mokytoja nemato!';

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
    // 13 krovikų ir 4 bėgikai - sumaišyta, kad ir su keliais vaikais būtų abiejų.
    slots: [
      'krovikas', 'krovikas', 'krovikas', 'begikas',
      'krovikas', 'krovikas', 'krovikas', 'begikas',
      'krovikas', 'krovikas', 'krovikas', 'begikas',
      'krovikas', 'krovikas', 'krovikas', 'begikas',
      'krovikas',
    ],
    fallback: 'krovikas',
    teacherRole: 'budetoja',
    roles: {
      krovikas: {
        name: 'Kuprinės krovikas', emoji: '📚', desc: 'Adrianos kuprinė per lengva! Įmesk knygą - ji lips lėčiau. Arba mandariną - tiesiog juokui.',
        buttons: [
          { id: 'knyga', label: 'Įmesti knygą', emoji: '📕', cd: 3500, ok: 'Sunkiau!' },
          { id: 'mandarinas', label: 'Įmesti mandariną', emoji: '🍊', cd: 1500, ok: 'Skanu!' },
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
        name: 'Budinti mokytoja', emoji: '🔔', desc: 'Jūs budite prie 3 aukšto durų. Palaikykite duris (+1 s) arba švilpkite - 5 sekundes niekas negalės mesti knygų!',
        buttons: [
          { id: 'duris', label: 'Laikyti duris', emoji: '🚪', cd: 2500, ok: '+1 s!' },
          { id: 'svilpukas', label: 'Švilpukas: nemėtyti!', emoji: '📢', cd: 10000, ok: 'FIIIT!' },
        ],
      },
    },
  },
  pamoka: {
    id: 'pamoka',
    nr: 3,
    title: 'Kai mokytoja nusisuka',
    mission: 'PERDUOK ATVIRUKĄ',
    // Visi vaikai turi mygtuką „Perduoti“, skiriasi tik antrasis.
    // Atvirukas keliauja atsitiktine tvarka (be pasikartojimų), paskutinė gauna mokytoja.
    slots: [
      'smalsuolis', 'mandarinas', 'ciaudulys', 'daina', 'penalas', 'snabzdukas', 'mieguistas', 'ranka',
      'mandarinas', 'smalsuolis', 'daina', 'ciaudulys', 'snabzdukas', 'penalas', 'ranka', 'mieguistas',
      'mandarinas',
    ],
    fallback: 'mandarinas',
    teacherRole: 'lenta',
    roles: {
      smalsuolis: {
        name: '', emoji: '✉️', desc: KLASE_DESC,
        buttons: [
          { id: 'perduoti', label: 'Perduoti', emoji: '✉️', cd: 1200, ok: 'Skrenda!' },
          { id: 'klausti', label: 'Paklausti mokytojos', emoji: '🙋', cd: 6000, ok: 'Mokytoja!' },
        ],
      },
      mandarinas: {
        name: '', emoji: '✉️', desc: KLASE_DESC,
        buttons: [
          { id: 'perduoti', label: 'Perduoti', emoji: '✉️', cd: 1200, ok: 'Skrenda!' },
          { id: 'mandarinas', label: 'Valgyti mandariną', emoji: '🍊', cd: 2000, ok: 'Skanu!' },
        ],
      },
      daina: {
        name: '', emoji: '✉️', desc: KLASE_DESC,
        buttons: [
          { id: 'perduoti', label: 'Perduoti', emoji: '✉️', cd: 1200, ok: 'Skrenda!' },
          { id: 'dainuoti', label: 'Dainuoti dainelę', emoji: '🎵', cd: 2500, ok: 'Din din don!' },
        ],
      },
      snabzdukas: {
        name: '', emoji: '✉️', desc: KLASE_DESC,
        buttons: [
          { id: 'perduoti', label: 'Perduoti', emoji: '✉️', cd: 1200, ok: 'Skrenda!' },
          { id: 'snabzdeti', label: 'Šnabždėti', emoji: '🤫', cd: 1500, ok: 'Ššš...' },
        ],
      },
      ciaudulys: {
        name: '', emoji: '✉️', desc: KLASE_DESC,
        buttons: [
          { id: 'perduoti', label: 'Perduoti', emoji: '✉️', cd: 1200, ok: 'Skrenda!' },
          { id: 'ciaudeti', label: 'Čiaudėti', emoji: '🤧', cd: 1500, ok: 'APČIHI!' },
        ],
      },
      penalas: {
        name: '', emoji: '✉️', desc: KLASE_DESC,
        buttons: [
          { id: 'perduoti', label: 'Perduoti', emoji: '✉️', cd: 1200, ok: 'Skrenda!' },
          { id: 'penalas', label: 'Numesti penalą', emoji: '✏️', cd: 2000, ok: 'Bum!' },
        ],
      },
      mieguistas: {
        name: '', emoji: '✉️', desc: KLASE_DESC,
        buttons: [
          { id: 'perduoti', label: 'Perduoti', emoji: '✉️', cd: 1200, ok: 'Skrenda!' },
          { id: 'ziovauti', label: 'Žiovauti', emoji: '🥱', cd: 2000, ok: 'Aaa...' },
        ],
      },
      ranka: {
        name: '', emoji: '✉️', desc: KLASE_DESC,
        buttons: [
          { id: 'perduoti', label: 'Perduoti', emoji: '✉️', cd: 1200, ok: 'Skrenda!' },
          { id: 'ranka', label: 'Kelti ranką', emoji: '✋', cd: 1500, ok: 'Aš! Aš!' },
        ],
      },
      lenta: {
        name: 'Mokytoja prie lentos', emoji: '👀', desc: 'Jūs rašote lentoje. Atsisukite ir pagaukite, kas perdavinėja atviruką! Arba rašykite toliau. Atvirukas galiausiai atkeliaus pas jus.',
        buttons: [
          { id: 'atsisukti', label: 'Atsisukti!', emoji: '👀', cd: 5000, ok: 'Kas čia vyksta?' },
          { id: 'rasyti', label: 'Rašyti toliau', emoji: '✏️', cd: 3000, ok: 'Rašau...' },
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
  podiumas: {
    id: 'podiumas',
    nr: 5,
    title: 'Mados šou Vingio estradoje',
    mission: 'NENUGRIŪK PODIUME',
    // Visi ploja (plojimai ramina Adrianą), o antras mygtukas skiriasi:
    // fotografai (pozos metu nuotraukos skaičiuojamos), vėjas ir sniegas (trukdo).
    slots: [
      'fotografas', 'vejas', 'sniegas', 'fotografas', 'vejas', 'sniegas',
      'fotografas', 'fotografas', 'vejas', 'sniegas', 'fotografas', 'vejas',
      'sniegas', 'fotografas', 'vejas', 'sniegas', 'fotografas',
    ],
    fallback: 'fotografas',
    teacherRole: 'komisija',
    roles: {
      fotografas: {
        name: '', emoji: '📸', desc: 'Adriana eina podiumu pagal muziką. Plok - jai bus drąsiau! Kai telefone užsidegs žalia „POZA!“ - greitai fotografuok!',
        buttons: [
          { id: 'ploti', label: 'Ploti', emoji: '👏', cd: 700, ok: 'Bravo!' },
          { id: 'foto', label: 'Fotografuoti', emoji: '📸', cd: 900, ok: 'Klik!' },
        ],
      },
      vejas: {
        name: '', emoji: '💨', desc: 'Adriana eina podiumu pagal muziką. Plok - jai bus drąsiau! Arba pūsk vėją ir pažiūrėk, ar ji išsilaikys.',
        buttons: [
          { id: 'ploti', label: 'Ploti', emoji: '👏', cd: 700, ok: 'Bravo!' },
          { id: 'vejas', label: 'Pūsti vėją', emoji: '💨', cd: 2500, ok: 'Fiuuu!' },
        ],
      },
      sniegas: {
        name: '', emoji: '❄️', desc: 'Adriana eina podiumu pagal muziką. Plok - jai bus drąsiau! Arba paleisk sniegą ant podiumo - bus slidu.',
        buttons: [
          { id: 'ploti', label: 'Ploti', emoji: '👏', cd: 700, ok: 'Bravo!' },
          { id: 'sniegas', label: 'Sniego patranka', emoji: '❄️', cd: 3000, ok: 'Slidu!' },
        ],
      },
      komisija: {
        name: 'Komisijos pirmininkė', emoji: '⭐', desc: 'Jūs - mados šou komisija! „Bravo!“ padrąsina Adrianą, o griežtas žvilgsnis ją sujaudina. Pabaigoje parodysite balą.',
        buttons: [
          { id: 'bravo', label: 'Bravo!', emoji: '🌟', cd: 5000, ok: 'Bravo!' },
          { id: 'zvilgsnis', label: 'Griežtas žvilgsnis', emoji: '🧐', cd: 6000, ok: 'Hmm...' },
        ],
      },
    },
  },
  pianinas: {
    id: 'pianinas',
    nr: 6,
    title: 'Kalėdinis koncertas Filharmonijoje',
    mission: 'SUGROK KALĖDAS',
    // Klasė - orkestras iš 4 grupių. Kiekvienoje frazėje groja viena grupė, finale - visi.
    slots: [
      'varpeliai', 'smuikai', 'bugnai', 'trimitai',
      'varpeliai', 'smuikai', 'bugnai', 'trimitai',
      'varpeliai', 'smuikai', 'bugnai', 'trimitai',
      'varpeliai', 'smuikai', 'bugnai', 'trimitai',
      'varpeliai',
    ],
    fallback: 'varpeliai',
    teacherRole: 'dirigente',
    roles: {
      varpeliai: {
        name: '', emoji: '🔔', desc: 'Tu - orkestre, groji varpeliais! Kai telefone užsidegs žalia „GROK!“ - spausk. Kol groja kiti - tyliai. Pabaigoje - nusilenk!',
        buttons: [
          { id: 'groti', label: 'Groti varpeliais', emoji: '🔔', cd: 300, ok: 'Din din!' },
          { id: 'nusilenkti', label: 'Nusilenkti', emoji: '🙇', cd: 1500, ok: 'Bravo!' },
        ],
      },
      smuikai: {
        name: '', emoji: '🎻', desc: 'Tu - orkestre, groji smuiku! Kai telefone užsidegs žalia „GROK!“ - spausk. Kol groja kiti - tyliai. Pabaigoje - nusilenk!',
        buttons: [
          { id: 'groti', label: 'Groti smuiku', emoji: '🎻', cd: 300, ok: 'Lia lia!' },
          { id: 'nusilenkti', label: 'Nusilenkti', emoji: '🙇', cd: 1500, ok: 'Bravo!' },
        ],
      },
      bugnai: {
        name: '', emoji: '🥁', desc: 'Tu - orkestre, groji būgnu! Kai telefone užsidegs žalia „GROK!“ - spausk. Kol groja kiti - tyliai. Pabaigoje - nusilenk!',
        buttons: [
          { id: 'groti', label: 'Mušti būgną', emoji: '🥁', cd: 300, ok: 'Bum bum!' },
          { id: 'nusilenkti', label: 'Nusilenkti', emoji: '🙇', cd: 1500, ok: 'Bravo!' },
        ],
      },
      trimitai: {
        name: '', emoji: '🎺', desc: 'Tu - orkestre, groji trimitu! Kai telefone užsidegs žalia „GROK!“ - spausk. Kol groja kiti - tyliai. Pabaigoje - nusilenk!',
        buttons: [
          { id: 'groti', label: 'Pūsti trimitą', emoji: '🎺', cd: 300, ok: 'Tu tu!' },
          { id: 'nusilenkti', label: 'Nusilenkti', emoji: '🙇', cd: 1500, ok: 'Bravo!' },
        ],
      },
      dirigente: {
        name: 'Dirigentė', emoji: '🎼', desc: 'Jūs - dirigentė! „Visi kartu!“ - kelias sekundes groja visas orkestras. „Ššš!“ - nutildo tuos, kas groja ne savo metu.',
        buttons: [
          { id: 'visi', label: 'Visi kartu!', emoji: '🎼', cd: 12000, ok: 'Groja visi!' },
          { id: 'tyliai', label: 'Ššš!', emoji: '🤫', cd: 6000, ok: 'Tyliau...' },
        ],
      },
    },
  },
  kinu: {
    id: 'kinu',
    nr: 7,
    title: 'Kinų kalbos pamoka',
    mission: 'KINŲ KALBOS IŠŠŪKIS',
    // Klasės viktorina: kiekviename raunde telefone - hieroglifas ir 2 atsakymai.
    // Mygtukų užrašus ir klausimą scena keičia kiekviename raunde.
    slots: Array(17).fill('mokinys'),
    fallback: 'mokinys',
    teacherRole: 'laoshi',
    roles: {
      mokinys: {
        name: '', emoji: '🐼', desc: 'Kinų kalbos viktorina! Kai ekrane pasirodys hieroglifas - atsakyk, ką jis reiškia.',
        buttons: [
          { id: 'a', label: '...', emoji: '❓', cd: 800, ok: 'Atsakyta!' },
          { id: 'b', label: '...', emoji: '❓', cd: 800, ok: 'Atsakyta!' },
        ],
      },
      laoshi: {
        name: 'Laoshi 老师', emoji: '🏮', desc: 'Jūs - laoshi (老师, kinų kalbos mokytoja)! „Lėčiau!“ - hieroglifai kelias sekundes krenta lėčiau. „Hongbao 🧧“ - per gaudymą numetate Adrianai 3 teisingus hieroglifus (kartą per žodį).',
        buttons: [
          { id: 'leciau', label: 'Lėčiau!', emoji: '🐢', cd: 12000, ok: 'Lėčiau...' },
          { id: 'hongbao', label: 'Hongbao', emoji: '🧧', cd: 11000, ok: '红包!' },
        ],
      },
    },
  },
  tenisas: {
    id: 'tenisas',
    nr: 8,
    title: 'Tenisas',
    mission: 'ATMUŠK KAMUOLIUKUS',
    // Visa klasė - Sniego senio komanda: balsuoja, kur senis muš kamuoliuką.
    slots: Array(17).fill('senio'),
    fallback: 'senio',
    teacherRole: 'teiseja',
    roles: {
      senio: {
        name: 'Senio komanda', emoji: '⛄', desc: 'Jūs - Sniego senio komanda prieš Adrianą! Kai telefone užsidegs „Balsuok!“ - rinkis, kur senis muš kamuoliuką. Kur balsuos dauguma, ten jis ir skris. Galima persigalvoti iki paskutinės sekundės!',
        buttons: [
          { id: 'kaire', label: 'Kairė', emoji: '⬅️', cd: 300, ok: 'Balsas: kairė!' },
          { id: 'centras', label: 'Centras', emoji: '⬆️', cd: 300, ok: 'Balsas: centras!' },
          { id: 'desine', label: 'Dešinė', emoji: '➡️', cd: 300, ok: 'Balsas: dešinė!' },
        ],
      },
      teiseja: {
        name: 'Teisėja', emoji: '🧑‍⚖️', desc: 'Jūs - teisėja ant bokštelio! „Aut!“ - kartą per žaidimą panaikinate klasės tašką (padeda Adrianai). „Tyla!“ - šio taško balsai slapti, Adriana nemato, kur krypsta dauguma (padeda klasei).',
        buttons: [
          { id: 'aut', label: 'Aut!', emoji: '🚩', cd: 3000, ok: 'Aut!' },
          { id: 'tyla', label: 'Tyla!', emoji: '🤫', cd: 15000, ok: 'Ššš...' },
        ],
      },
    },
  },
  robotas: {
    id: 'robotas',
    nr: 9,
    title: 'Dovanų robotas',
    mission: 'UŽPROGRAMUOK ROBOTĄ',
    // Visa klasė - testuotojai: spėja, ar Adrianos kodas veiks.
    slots: Array(17).fill('testuotojas'),
    fallback: 'testuotojas',
    teacherRole: 'vadove',
    roles: {
      testuotojas: {
        name: 'Testuotojas', emoji: '🔍', desc: 'Spėk, ar Adrianos kodas veiks! Gali persigalvoti, kol robotas pajudės. Atspėjai - taškas.',
        buttons: [
          { id: 'veiks', label: 'Veiks!', emoji: '✅', cd: 300, ok: 'Spėjimas: veiks!' },
          { id: 'klaida', label: 'Bus klaida!', emoji: '🐞', cd: 300, ok: 'Spėjimas: klaida!' },
        ],
      },
      vadove: {
        name: 'Būrelio vadovė', emoji: '👩‍💻', desc: 'Jūs - programavimo būrelio vadovė! „Užuomina 💡“ - kelias sekundes pašviečia kelią iki kitos dovanos. „Greičiau ⏩“ - robotas vykdo kodą dvigubai greičiau.',
        buttons: [
          { id: 'uzuomina', label: 'Užuomina', emoji: '💡', cd: 10000, ok: 'Užuomina!' },
          { id: 'greiciau', label: 'Greičiau', emoji: '⏩', cd: 12000, ok: 'Greičiau!' },
        ],
      },
    },
  },
};

// Visas dienos maršrutas žemėlapyje. "scene" - Phaser scena; null - dar kuriama
// (žemėlapyje toks etapas praleidžiamas). "pos" - taško vieta žemėlapyje (1920x1080).
export const ROUTE = [
  { id: 'broliai', nr: 1, title: 'Soskė broliukams', mission: 'NURAMINK BROLIUKUS', place: 'Namai', where: 'Namai', icon: '🏠', pos: [721, 212], scene: 'Broliai' },
  { id: 'laiptai', nr: 2, title: 'Laiptai su kuprine', mission: 'UŽLIPK Į MOKYKLĄ', place: 'Mokykla', where: 'Mokykla', icon: '🎒', pos: [493, 232], scene: 'Laiptai' },
  { id: 'pamoka', nr: 3, title: 'Kai mokytoja nusisuka', mission: 'PERDUOK ATVIRUKĄ', place: 'Klasė', where: 'Klasė', icon: '✏️', pos: [407, 232], scene: 'Pamoka' },
  { id: 'autobusas', nr: 4, title: 'Bėgimas iki autobuso', mission: 'SPĖK Į AUTOBUSĄ', place: 'Stotelė', where: 'Stotelė', icon: '🚌', pos: [321, 232], scene: 'Bus' },
  { id: 'podiumas', nr: 5, title: 'Mados šou Vingio estradoje', mission: 'NENUGRIŪK PODIUME', place: 'Mados šou', where: 'Vingio estrada', icon: '👗', pos: [564, 625], scene: 'Podiumas' },
  { id: 'pianinas', nr: 6, title: 'Kalėdinis koncertas Filharmonijoje', mission: 'SUGROK KALĖDAS', place: 'Piano koncertas', where: 'Filharmonija', icon: '🎹', pos: [1541, 793], scene: 'Koncertas' },
  { id: 'kinu', nr: 7, title: 'Kinų kalbos pamoka', mission: 'KINŲ KALBOS IŠŠŪKIS', place: 'Kinų kalbos pamoka', where: 'Konfucijaus institutas', icon: '🐼', pos: [1475, 692], scene: 'Kinu' },
  { id: 'tenisas', nr: 8, title: 'Tenisas', mission: 'ATMUŠK KAMUOLIUKUS', place: 'Teniso treniruotė', where: 'Sereikiškių parkas', icon: '🎾', pos: [1754, 592], scene: 'Tenisas' },
  { id: 'robotas', nr: 9, title: 'Dovanų robotas', mission: 'UŽPROGRAMUOK ROBOTĄ', place: 'Programavimo būrelis', where: 'Baltasis tiltas', icon: '🤖', pos: [1103, 387], scene: 'Robotas' },
  { id: 'finalas', nr: 10, title: 'Finalas: eglė', mission: 'UŽDEK EGLĘ', place: 'Kalėdinis klasės vakarėlis', where: 'Katedros aikštė', icon: '🎄', pos: [1492, 575], scene: null },
];

export const STAGE_ORDER = ROUTE.filter((r) => r.scene).map((r) => r.id);
