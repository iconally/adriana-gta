// Apkrovos ir srauto testas: ekranas + N virtualių telefonų.
//
// Paleidimas (iš projekto aplanko):
//   npm i -D playwright && npx playwright install chromium
//   python3 -m http.server 8765        (kitame terminale)
//   node tests/load-test.cjs
//
// Kintamieji:
//   BASE_URL=http://localhost:8765/   PHONES=18   NET=local|supabase
// Klasėje 17 vaikų (be Adrianos) ir mokytoja - todėl numatyta 18 telefonų.
//   HEADED=1 (rodyti naršyklę)   SHOTS=./shots (ekrano nuotraukų aplankas)
//
// NET=local - viskas vienoje naršyklėje (BroadcastChannel), Supabase nereikia.
// NET=supabase - kiekvienas telefonas atskirame kontekste per tikrą Supabase.

const { chromium } = require('playwright');
const fs = require('fs');

const BASE = (process.env.BASE_URL || 'http://localhost:8765/').replace(/\/?$/, '/');
const N = Number(process.env.PHONES || 18);
const NET = process.env.NET || 'local';
const SHOTS = process.env.SHOTS || './shots';
const PLAY_SECONDS = Number(process.env.PLAY_SECONDS || 60);
const q = NET === 'local' ? '&net=local' : '';

const errors = [];
const watch = (page, who) => {
  page.on('pageerror', (e) => errors.push(`${who}: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${who}: ${m.text()}`); });
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png` });

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch({ headless: !process.env.HEADED });
  const screenCtx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const screen = await screenCtx.newPage();
  watch(screen, 'ekranas');
  await screen.goto(`${BASE}screen.html${NET === 'local' ? '?net=local' : ''}`);
  await screen.waitForFunction(() => window.AGTA?.host && window.AGTA.game.scene.isActive('Lobby'));
  await screen.evaluate(() => localStorage.clear());
  await screen.reload();
  await screen.waitForFunction(() => window.AGTA?.host && window.AGTA.game.scene.isActive('Lobby'));
  await screen.click('#p-demo');
  await screen.waitForFunction(() => window.AGTA.host.roster.kids.length > 0);
  await screen.keyboard.press('h');
  const { room, kids } = await screen.evaluate(() => ({
    room: window.AGTA.room,
    kids: window.AGTA.host.roster.kids.map((k) => ({ name: k.name, md: k.md, teacher: !!k.teacher })),
  }));
  const count = Math.min(N, kids.length);
  const kidsOnly = kids.filter((k) => !k.teacher).length;
  console.log(`Kambarys ${room}, klasėje ${kidsOnly} vaikų + ${kids.length - kidsOnly} mokytoja, telefonų ${count}`);

  const phones = [];
  const join = async (i) => {
    const ctx = NET === 'local' ? screenCtx : await browser.newContext();
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 390, height: 780 });
    watch(page, `tel${i + 1}`);
    await page.goto(`${BASE}join.html?r=${room}${q}`);
    await page.waitForSelector('#s-names:not([hidden]) .name');
    const kid = kids[i];
    await page.locator('.name', { hasText: new RegExp(`^${kid.name}$`) }).click();
    const [mm, dd] = kid.md.split('-').map(Number);
    await page.selectOption('#month', String(mm));
    await page.selectOption('#day', String(dd));
    await page.click('#date-ok');
    await page.waitForSelector('#s-wait:not([hidden]), #s-role:not([hidden])', { timeout: 10000 });
    phones.push({ page, kid });
  };
  const t0 = Date.now();
  for (let i = 0; i < count - 1; i++) await join(i);

  // neteisinga data ir užrakinimas (paskutinis vaikas dar neprisijungęs)
  {
    const ctx = NET === 'local' ? screenCtx : await browser.newContext();
    const bad = await ctx.newPage();
    await bad.setViewportSize({ width: 390, height: 780 });
    watch(bad, 'blogas');
    await bad.goto(`${BASE}join.html?r=${room}${q}`);
    await bad.waitForSelector('#s-names:not([hidden]) .name');
    const kid = kids[count - 1];
    await bad.locator('.name', { hasText: new RegExp(`^${kid.name}$`) }).click();
    for (let k = 0; k < 3; k++) {
      await bad.selectOption('#month', '1');
      await bad.selectOption('#day', '1');
      await bad.click('#date-ok');
      await sleep(700);
    }
    console.log(`Bloga data: "${await bad.textContent('#date-err')}"`);
    await shot(bad, 'tel-bloga-data');
    await bad.close();
  }
  await sleep(15500); // užraktas 15 s
  await join(count - 1);
  const c = await screen.evaluate(() => window.AGTA.host.counts());
  console.log(`Prisijungė vaikų ${c.kidsIn}/${c.kidsTotal}${c.teacherIn ? ' + mokytoja' : ''} per ${((Date.now() - t0) / 1000).toFixed(1)} s (su 15 s užraktu)`);

  await sleep(2500);
  for (const p of phones.slice(0, 8)) await p.page.locator('.act').first().click();
  await sleep(300);
  await shot(screen, '10-laukiamasis');
  await shot(phones[0].page, 'tel-laukiamasis');

  // perkrovimas - turi grįžti be datos
  await phones[1].page.reload();
  await phones[1].page.waitForSelector('#s-role:not([hidden]), #s-wait:not([hidden])', { timeout: 10000 });
  console.log('Perkrautas telefonas grįžo be datos: OK');

  // 1 etapas: broliukai (ekranas turi būti priekyje, kitaip naršyklė jį sulėtina)
  await screen.bringToFront();
  await screen.keyboard.press('Enter'); // laukiamasis -> žemėlapis
  await screen.waitForFunction(() => window.AGTA.game.scene.getScene('Map')?.ready?.id === 'broliai', null, { timeout: 60000 });
  await shot(screen, '12-zemelapis-pradzia');
  await screen.keyboard.press('Enter'); // žemėlapis -> broliukai
  await sleep(1500);
  await shot(screen, '13-broliai-ivadas');
  await screen.keyboard.press('Enter');
  await sleep(3200);
  await screen.evaluate(() => { window.AGTA.game.scene.getScene('Broliai').autoplay = true; });
  {
    const endB = Date.now() + 40000;
    let shotB = false;
    while (Date.now() < endB) {
      const mode = await screen.evaluate(() => window.AGTA.game.scene.getScene('Broliai')?.mode);
      if (mode === 'result') break;
      const batch = phones.filter(() => Math.random() < 0.35);
      await Promise.all(batch.map(async (p) => {
        const btns = p.page.locator('.act:not(.off)');
        const n = await btns.count();
        if (n) await btns.nth(Math.floor(Math.random() * n)).click({ timeout: 1000 }).catch(() => {});
      }));
      if (!shotB) { shotB = true; await shot(screen, '14-broliai-zaidimas'); await shot(phones[3].page, 'tel-broliai'); }
      await sleep(400);
    }
    // jei per lėta aplinka - baigiam laiką
    await screen.evaluate(() => { const s = window.AGTA.game.scene.getScene('Broliai'); if (s.mode === 'play') s.timeLeft = 0.1; });
    await screen.waitForFunction(() => window.AGTA.game.scene.getScene('Broliai')?.mode === 'result', null, { timeout: 60000 });
    const rb = await screen.evaluate(() => { const s = window.AGTA.game.scene.getScene('Broliai'); return { delivered: s.delivered, tantrums: s.tantrums, elapsed: s.elapsed }; });
    console.log(`Broliukai: ${JSON.stringify(rb)}`);
    await shot(screen, '14-broliai-rezultatas');
    await screen.keyboard.press('Enter'); // -> žemėlapis
  }

  // 2 etapas: laiptai
  await screen.waitForFunction(() => window.AGTA.game.scene.getScene('Map')?.ready?.id === 'laiptai', null, { timeout: 60000 });
  await screen.keyboard.press('Enter'); // žemėlapis -> laiptai
  await sleep(1500);
  await shot(screen, '16-laiptai-ivadas');
  await screen.keyboard.press('Enter');
  await sleep(3200);
  await screen.evaluate(() => { window.AGTA.game.scene.getScene('Laiptai').autoplay = true; });
  {
    const endL = Date.now() + 40000;
    let shotL = false;
    while (Date.now() < endL) {
      const mode = await screen.evaluate(() => window.AGTA.game.scene.getScene('Laiptai')?.mode);
      if (mode === 'result') break;
      const batch = phones.filter(() => Math.random() < 0.35);
      await Promise.all(batch.map(async (p) => {
        const btns = p.page.locator('.act:not(.off)');
        const n = await btns.count();
        if (n) await btns.nth(Math.floor(Math.random() * n)).click({ timeout: 1000 }).catch(() => {});
      }));
      if (!shotL) { shotL = true; await shot(screen, '17-laiptai-zaidimas'); await shot(phones[4].page, 'tel-laiptai'); }
      await sleep(400);
    }
    await screen.evaluate(() => { const s = window.AGTA.game.scene.getScene('Laiptai'); if (s.mode === 'play') s.timeLeft = 0.1; });
    await screen.waitForFunction(() => window.AGTA.game.scene.getScene('Laiptai')?.mode === 'result', null, { timeout: 60000 });
    const rl = await screen.evaluate(() => { const s = window.AGTA.game.scene.getScene('Laiptai'); return { u: +s.ud.toFixed(1), books: s.books, pushes: s.pushes, stumbles: s.stumbles, elapsed: +s.elapsed.toFixed(1) }; });
    console.log(`Laiptai: ${JSON.stringify(rl)}`);
    await shot(screen, '18-laiptai-rezultatas');
    await screen.keyboard.press('Enter'); // -> žemėlapis
  }

  // 4 etapas: autobusas
  await screen.waitForFunction(() => window.AGTA.game.scene.getScene('Map')?.ready?.id === 'autobusas', null, { timeout: 60000 });
  await shot(screen, '15-zemelapis');
  await screen.keyboard.press('Enter'); // žemėlapis -> autobusas
  await sleep(1500);
  await shot(screen, '20-autobusas-ivadas');
  await shot(phones[0].page, 'tel-role-ivadas');
  await screen.keyboard.press('Enter');
  await sleep(3200);

  // "Adriana": šoka, kai kliūtis arti (kartais suklysta)
  await screen.evaluate(() => {
    window.__bot = setInterval(() => {
      const s = window.AGTA.game.scene.getScene('Bus');
      if (!s || s.mode !== 'play') return;
      const o = s.obstacles.find((x) => !x.hit && x.x > 380 && x.x - 380 < 150 + x.w / 2);
      if (o && s.ay >= 861 && !o.botSeen) {
        o.botSeen = true;
        if (Math.random() < 0.8) s.jump();
      }
    }, 30);
  });

  const end = Date.now() + PLAY_SECONDS * 1000;
  let presses = 0;
  let shotMid = false;
  while (Date.now() < end) {
    const mode = await screen.evaluate(() => window.AGTA.game.scene.getScene('Bus')?.mode);
    if (mode === 'result') break;
    const batch = phones.filter(() => Math.random() < 0.35);
    await Promise.all(batch.map(async (p) => {
      const btns = p.page.locator('.act:not(.off)');
      const n = await btns.count();
      if (n) { await btns.nth(Math.floor(Math.random() * n)).click({ timeout: 1000 }).catch(() => {}); presses += 1; }
    }));
    if (!shotMid && Date.now() > end - PLAY_SECONDS * 1000 + 15000) {
      shotMid = true;
      await shot(screen, '30-autobusas-zaidimas');
      await shot(phones[2].page, 'tel-role-zaidimas');
    }
    await sleep(400);
  }
  await sleep(1500);
  await shot(screen, '40-autobusas-rezultatas');
  const res = await screen.evaluate(() => {
    const s = window.AGTA.game.scene.getScene('Bus');
    return { mode: s.mode, trips: s.trips, bonus: s.bonus, elapsed: s.elapsed };
  });
  const fps = await screen.evaluate(() => Math.round(window.AGTA.game.loop.actualFps));
  console.log(`Paspaudimų: ${presses}. Ekrano FPS: ${fps}. Rezultatas: ${JSON.stringify(res)}`);

  await screen.keyboard.press('Enter');
  await sleep(1500);
  const back = await screen.evaluate(() => window.AGTA.game.scene.isActive('Map'));
  console.log(`Grįžo į žemėlapį: ${back}`);
  await sleep(4000);
  await shot(screen, '50-zemelapis-po-autobuso');

  console.log(errors.length ? `KLAIDOS (${errors.length}):\n${errors.slice(0, 30).join('\n')}` : 'Klaidų konsolėje nėra.');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
