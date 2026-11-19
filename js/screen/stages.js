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

export const STAGE_ORDER = ['autobusas'];
