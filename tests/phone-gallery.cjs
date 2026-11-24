// Telefonų vaizdų galerija: ką mato vaikai ir mokytoja kiekviename žaidimo žingsnyje.
//
// Paleidimas (iš projekto aplanko):
//   python3 -m http.server 8765        (kitame terminale)
//   node tests/phone-gallery.cjs
// Rezultatas: shots/telefonai/index.html - atsidaryk naršyklėje. Trunka ~20-30 min
// (prisijungia 17 vaikų ir mokytoja, Adriana žaidžia pati - autopilotas).
//
// Kintamieji:
//   BASE_URL=http://localhost:8765/   OUT=./shots/telefonai   HEADED=1 (rodyti naršyklę)
//   ONLY=Pamoka,Kinu   - tik šie etapai (scenų vardai: Broliai, Laiptai, Pamoka, Bus, Podiumas,
//                        Koncertas, Kinu, Tenisas, Robotas, Finalas)
//
// Kiekvienam etapui galerijoje:
//   - prieš etapą (vaiko ir mokytojos telefonas);
//   - per žaidimą - kiekviena rolė ir kiekviena skirtinga telefono būsena (pvz. „Tavo eilė“,
//     „GROK!“ / „Tyliai“, klausimas ir atsakymas), skaičiai nesiskaito kaip nauja būsena;
//   - kiekvienai rolei - telefonas iškart paspaudus mygtuką;
//   - rezultatai (telefonai ir didysis ekranas).
// Pradžioje - prisijungimas (vardai, data, klaida, laukimas), laukiamasis ir žemėlapis.

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = (process.env.BASE_URL || 'http://localhost:8765/').replace(/\/?$/, '/');
const OUT = process.env.OUT || './shots/telefonai';
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map((x) => x.trim()) : null;
const MAX_VARIANTS = 30; // daugiausia skirtingų būsenų viename etape
const STAGE_LIST = [
  ['Broliai', 'broliai'], ['Laiptai', 'laiptai'], ['Pamoka', 'pamoka'], ['Bus', 'autobusas'],
  ['Podiumas', 'podiumas'], ['Koncertas', 'pianinas'], ['Kinu', 'kinu'], ['Tenisas', 'tenisas'],
  ['Robotas', 'robotas'], ['Finalas', 'finalas'],
];

const errors = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sections = [];
let cur = null;
let n = 0;

function section(title, note = '') {
  cur = { title, note, items: [] };
  sections.push(cur);
  console.log(`== ${title}`);
}

async function cap(page, caption, sub = '', opts = {}) {
  n += 1;
  const file = `${String(n).padStart(3, '0')}.jpg`;
  await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 82, fullPage: !opts.wide }).catch((e) => errors.push(`shot: ${e.message}`));
  cur.items.push({ file, caption, sub, wide: !!opts.wide });
}

// Kas dabar rodoma telefone.
const phoneInfo = (page) => page.evaluate(() => {
  const $ = (id) => document.getElementById(id);
  const vis = (el) => el && !el.hidden && el.offsetParent !== null;
  const screen = [...document.querySelectorAll('.screen')].find((s) => !s.hidden)?.id || '';
  const btns = [...document.querySelectorAll('#buttons .act')].map((b) => ({ label: b.querySelector('.lbl')?.textContent || '', off: b.classList.contains('off') }));
  return {
    screen,
    role: $('role-name')?.textContent || '',
    emoji: $('role-emoji')?.textContent || '',
    status: vis($('status')) ? $('status').textContent : '',
    state: $('role-state')?.textContent || '',
    cue: vis($('cue')) ? $('cue').textContent : '',
    photo: $('photo') ? !$('photo').hidden : false,
    btns,
  };
}).catch(() => null);

const roleLabel = (i) => `${i.emoji || ''} ${i.role || 'Vaikas'}`.trim();

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  for (const f of fs.readdirSync(OUT)) if (/\.(jpg|html)$/.test(f)) fs.unlinkSync(path.join(OUT, f));
  const browser = await chromium.launch({ headless: !process.env.HEADED });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const screen = await ctx.newPage();
  screen.on('pageerror', (e) => errors.push(`ekranas: ${e.message}`));
  await screen.goto(`${BASE}screen.html?net=local`);
  await screen.waitForFunction(() => window.AGTA?.host && window.AGTA.game.scene.isActive('Lobby'));
  await screen.evaluate(() => localStorage.clear());
  await screen.reload();
  await screen.waitForFunction(() => window.AGTA?.host && window.AGTA.game.scene.isActive('Lobby'));
  await screen.evaluate(() => { document.getElementById('pult').hidden = false; });
  await screen.click('#p-demo');
  await screen.waitForFunction(() => window.AGTA.host.roster.kids.length > 0);
  await screen.evaluate(() => { document.getElementById('pult').hidden = true; });
  const { room, kids } = await screen.evaluate(() => ({
    room: window.AGTA.room,
    kids: window.AGTA.host.roster.kids.map((k) => ({ name: k.name, md: k.md, teacher: !!k.teacher })),
  }));
  // mokytoja - paskutinė
  kids.sort((a, b) => Number(a.teacher) - Number(b.teacher));

  // ---------------- prisijungimas ----------------
  section('Prisijungimas', 'Vaikas nuskenuoja QR kodą, pasirenka vardą ir įveda gimtadienį.');
  const phones = [];
  const open = async () => {
    const page = await ctx.newPage();
    await page.setViewportSize({ width: 390, height: 780 });
    page.on('pageerror', (e) => errors.push(`telefonas: ${e.message}`));
    await page.goto(`${BASE}join.html?r=${room}&net=local`);
    await page.waitForSelector('#s-names:not([hidden]) .name');
    return page;
  };
  const join = async (page, kid, shots) => {
    if (shots) await cap(page, 'Vardų sąrašas', 'Pasirink savo vardą');
    await page.locator('.name', { hasText: new RegExp(`^${kid.name}$`) }).click();
    if (shots) {
      await cap(page, 'Gimtadienio įvedimas', 'Mėnuo ir diena');
      await page.selectOption('#month', '1');
      await page.selectOption('#day', '1');
      await page.click('#date-ok');
      await sleep(800);
      await cap(page, 'Neteisinga data', '3 klaidos - 15 s pertrauka');
    }
    const [mm, dd] = kid.md.split('-').map(Number);
    await page.selectOption('#month', String(mm));
    await page.selectOption('#day', String(dd));
    await page.click('#date-ok');
    await page.waitForSelector('#s-wait:not([hidden]), #s-role:not([hidden])', { timeout: 10000 });
    if (shots) await cap(page, 'Prisijungta', 'Laukimo ekranas');
  };
  for (let i = 0; i < kids.length; i++) {
    const page = await open();
    await join(page, kids[i], i === 0);
    const pid = await page.evaluate(() => sessionStorage.getItem('agta.pid'));
    phones.push({ page, kid: kids[i], pid });
  }
  const kidPhone = phones[0];
  const teacherPhone = phones.find((p) => p.kid.teacher) || phones[phones.length - 1];
  await screen.bringToFront();
  await sleep(2500);

  // ---------------- laukiamasis ----------------
  section('Laukiamasis', 'Kol visi jungiasi. Didysis ekranas rodo QR kodą ir tribūną.');
  await cap(kidPhone.page, 'Vaikas', 'Laukiamojo mygtukai');
  await cap(teacherPhone.page, 'Mokytoja', 'Laukiamojo mygtukai');
  await kidPhone.page.locator('.act').first().click();
  await sleep(150);
  await cap(kidPhone.page, 'Vaikas - paspaudus „Labas!“', 'Avataras ekrane pašoka');
  await cap(screen, 'Didysis ekranas', 'Laukiamasis', { wide: true });

  // ---------------- žemėlapis ----------------
  section('Žemėlapis', 'Tarp etapų: Adriana keliauja žemėlapiu į kitą vietą.');
  await screen.evaluate(() => window.AGTA.go('Map'));
  await screen.waitForFunction(() => window.AGTA.game.scene.getScene('Map')?.ready, null, { timeout: 60000 });
  await sleep(800);
  await cap(kidPhone.page, 'Vaikas', 'Žemėlapio metu');
  await cap(teacherPhone.page, 'Mokytoja', 'Žemėlapio metu');
  await cap(screen, 'Didysis ekranas', 'Žemėlapis', { wide: true });

  // ---------------- etapai ----------------
  for (const [scene, id] of STAGE_LIST) {
    if (ONLY && !ONLY.includes(scene)) continue;
    const title = await screen.evaluate((i) => window.AGTA.STAGES[i]?.title || i, id);
    const nr = STAGE_LIST.findIndex((x) => x[0] === scene) + 1;
    // Adriana - autopilotas (pamokoje ne: ten atviruką turi perduoti patys vaikai)
    await screen.evaluate((k) => { const s = window.AGTA.game.scene.getScene(k); s.autoplay = k !== 'Pamoka'; window.AGTA.go(k); }, scene);
    await sleep(1800);

    section(`${nr}. ${title} - prieš etapą`, 'Misijos kortelė ekrane, telefonai laukia.');
    await cap(kidPhone.page, 'Vaikas', (await phoneInfo(kidPhone.page))?.state || '');
    await cap(teacherPhone.page, 'Mokytoja', (await phoneInfo(teacherPhone.page))?.state || '');

    await screen.keyboard.press('Enter');
    if (scene === 'Bus') {
      // autobuse Adrianos autopiloto nėra - šokinėja testas
      await screen.evaluate(() => {
        setInterval(() => {
          const s = window.AGTA.game.scene.getScene('Bus');
          if (!s || s.mode !== 'play') return;
          const o = s.obstacles.find((x) => !x.hit && x.x > 380 && x.x - 380 < 150 + x.w / 2);
          if (o && s.ay >= 861 && !o.botSeen) { o.botSeen = true; s.jump(); }
        }, 30);
      });
    }

    section(`${nr}. ${title} - per žaidimą`, 'Kiekviena rolė ir kiekviena skirtinga telefono būsena. „Paspaudus“ - iškart po mygtuko paspaudimo.');
    const seen = new Set();
    const pressedRoles = new Set();
    let variants = 0;
    const t0 = Date.now();
    while (Date.now() - t0 < 240000) {
      const mode = await screen.evaluate((k) => window.AGTA.game.scene.getScene(k)?.mode, scene);
      if (mode === 'result') break;
      if (scene === 'Bus' && Date.now() - t0 > 45000) await screen.evaluate(() => { const s = window.AGTA.game.scene.getScene('Bus'); if (s.mode === 'play') s.dist = 1e9; });
      const live = !['intro', 'count'].includes(mode);
      const roles = await screen.evaluate(() => ({ ...window.AGTA.host.roles }));
      // naujos būsenos (tik žaidimo metu - būsena prieš etapą rodoma atskirai)
      for (const p of phones) {
        if (!live || variants >= MAX_VARIANTS) break;
        const i = await phoneInfo(p.page);
        if (!i || i.screen !== 's-role') continue;
        // skaičiai ir hieroglifai (kinų žodžiai) nauja būsena nelaikomi - kitaip kartotųsi kiekviename raunde
        const norm = (t) => t.replace(/\d+([,.]\d+)?/g, '#').replace(/[\u3400-\u9fff]/g, '字').replace(/\s+=\s+\S+/g, ' = …');
        const key = `${roles[p.pid] || i.role}|${norm(i.status)}|${i.btns.map((b) => (b.off ? '-' : '+')).join('')}`;
        if (seen.has(key)) continue;
        seen.add(key);
        variants += 1;
        await cap(p.page, `${roleLabel(i)}${p.kid.teacher ? ' (mokytoja)' : ''}`, [i.status, i.cue, `mygtukai: ${i.btns.map((b) => b.label).join(' / ')}`].filter(Boolean).join(' · '));
      }
      // vienam kiekvienos rolės telefonui - paspaudimas
      if (live) {
        for (const p of phones) {
          const i = await phoneInfo(p.page);
          if (!i || i.screen !== 's-role') continue;
          const rid = roles[p.pid] || i.role;
          if (pressedRoles.has(rid)) continue;
          const idx = i.btns.findIndex((b) => !b.off);
          if (idx < 0) continue;
          pressedRoles.add(rid);
          await p.page.locator('#buttons .act').nth(idx).click({ timeout: 1000 }).catch(() => {});
          await sleep(160);
          const j = await phoneInfo(p.page);
          await cap(p.page, `${roleLabel(i)}${p.kid.teacher ? ' (mokytoja)' : ''} - paspaudus „${i.btns[idx].label}“`, [j?.status, j?.cue].filter(Boolean).join(' · '));
        }
      }
      // kiti vaikai spaudo atsitiktinai - kad žaidimas vyktų
      const batch = phones.filter(() => Math.random() < 0.45);
      await Promise.all(batch.map(async (p) => {
        const btns = p.page.locator('#buttons .act:not(.off)');
        const k = await btns.count().catch(() => 0);
        if (k) await btns.nth(scene === 'Robotas' && Math.random() < 0.85 ? 0 : Math.floor(Math.random() * k)).click({ timeout: 800 }).catch(() => {});
      }));
      await sleep(350);
    }
    console.log(`   ${variants} būsenų, ${pressedRoles.size} rolių paspaudimai`);

    section(`${nr}. ${title} - rezultatai`, 'Kiekvieno telefone - jo asmeninis rezultatas.');
    await sleep(1200);
    // po vieną kiekvienos rūšies: su apdovanojimu, be apdovanojimo, nieko nespaudęs
    const kinds = {};
    for (const ph of phones) {
      if (ph.kid.teacher) continue;
      const k = await ph.page.evaluate(() => {
        if (document.getElementById('s-result').hidden) return 'old';
        if (document.querySelector('#res-aw .award')) return 'award';
        return document.querySelector('#res-mine .row') ? 'rows' : 'none';
      }).catch(() => null);
      if (k && !kinds[k]) kinds[k] = ph;
    }
    const KIND = { award: 'Vaikas su apdovanojimu', rows: 'Vaikas be apdovanojimo', none: 'Vaikas, kuris nieko nespaudė', old: 'Vaikas' };
    const resInfo = (page) => page.evaluate(() => [...document.querySelectorAll('#res-aw .award, #res-mine .row')].map((e) => e.textContent).join(' · ')).catch(() => '');
    for (const k of ['award', 'rows', 'none', 'old']) {
      if (kinds[k]) await cap(kinds[k].page, `${KIND[k]} (${kinds[k].kid.name})`, await resInfo(kinds[k].page));
    }
    await cap(teacherPhone.page, 'Mokytoja', await resInfo(teacherPhone.page));
    await cap(screen, 'Didysis ekranas', 'Rezultatai', { wide: true });

    if (scene === 'Finalas') {
      section('10. Finalas - klasės nuotrauka', 'Po rezultatų - fotosesija; nuotrauka atkeliauja į kiekvieno telefoną.');
      await screen.keyboard.press('Enter');
      await sleep(1500);
      await cap(kidPhone.page, 'Vaikas - fotosesijos metu', (await phoneInfo(kidPhone.page))?.status || '');
      await screen.waitForFunction(() => window.AGTA.game.scene.getScene('Finalas')?.mode === 'photoDone', null, { timeout: 60000 }).catch(() => {});
      await kidPhone.page.waitForSelector('#photo:not([hidden])', { timeout: 20000 }).catch(() => errors.push('nuotrauka neatkeliavo į telefoną'));
      await sleep(600);
      await cap(kidPhone.page, 'Vaikas - nuotrauka telefone', 'Išsaugoti / Dalintis');
      await cap(screen, 'Didysis ekranas', 'Nuotrauka', { wide: true });
    }
  }

  // ---------------- pabaiga: visos misijos įvykdytos ----------------
  if (!ONLY) {
    section('Žaidimo pabaiga', 'Visos misijos įvykdytos - žemėlapis ir telefonai.');
    await screen.evaluate(() => { for (const r of window.AGTA.ROUTE) window.AGTA.host.done.add(r.id); window.AGTA.go('Map'); });
    await sleep(3000);
    for (const ph of [kidPhone, teacherPhone]) await ph.page.evaluate(() => { document.getElementById('photo').hidden = true; });
    await cap(kidPhone.page, 'Vaikas', 'Visos misijos įvykdytos');
    await cap(teacherPhone.page, 'Mokytoja', 'Visos misijos įvykdytos');
  }

  // ---------------- puslapis ----------------
  const html = `<!DOCTYPE html>
<html lang="lt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>GTA - telefonų vaizdai</title>
<style>
  body { margin: 0; padding: 24px 28px 60px; background: #12051f; color: #f1e6ff; font: 15px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; }
  h1 { margin: 0 0 4px; color: #ffd23f; font-size: 28px; }
  .meta { color: #a78bd0; margin-bottom: 18px; }
  nav { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 24px; }
  nav a { padding: 4px 10px; border-radius: 999px; background: #2a1450; color: #f1e6ff; text-decoration: none; font-size: 13px; }
  nav a:hover { background: #ff3ea5; }
  h2 { margin: 34px 0 4px; padding-top: 6px; border-top: 2px solid #3a1e66; color: #2de2e6; font-size: 20px; }
  .note { color: #a78bd0; margin-bottom: 12px; }
  .grid { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
  figure { margin: 0; width: 210px; }
  figure.wide { width: 520px; }
  figure img { width: 100%; border-radius: 14px; border: 2px solid #3a1e66; cursor: zoom-in; display: block; }
  figcaption { margin-top: 6px; font-weight: 600; }
  figcaption small { display: block; font-weight: 400; color: #c9b5ee; }
  #zoom { position: fixed; inset: 0; background: rgba(8,2,16,.92); display: none; align-items: center; justify-content: center; z-index: 9; }
  #zoom img { max-width: 96vw; max-height: 94vh; border-radius: 12px; }
</style></head><body>
<h1>GTA - ką mato telefonai</h1>
<div class="meta">Sugeneruota ${esc(new Date().toLocaleString('lt-LT'))} · demo klasė (17 vaikų + mokytoja) · paspausk nuotrauką - padidės</div>
<nav>${sections.map((s, i) => `<a href="#s${i}">${esc(s.title)}</a>`).join('')}</nav>
${sections.map((s, i) => `<h2 id="s${i}">${esc(s.title)}</h2>${s.note ? `<div class="note">${esc(s.note)}</div>` : ''}
<div class="grid">${s.items.map((it) => `<figure${it.wide ? ' class="wide"' : ''}><img loading="lazy" src="${it.file}" alt=""><figcaption>${esc(it.caption)}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</figcaption></figure>`).join('')}</div>`).join('\n')}
<div id="zoom"><img alt=""></div>
<script>
  const z = document.getElementById('zoom');
  document.addEventListener('click', (e) => {
    if (e.target.matches('figure img')) { z.firstElementChild.src = e.target.src; z.style.display = 'flex'; }
    else if (e.target.closest('#zoom')) z.style.display = 'none';
  });
</script>
</body></html>`;
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
  console.log(`\nNuotraukų: ${n}. Puslapis: ${path.join(OUT, 'index.html')}`);
  console.log(errors.length ? `KLAIDOS (${errors.length}):\n${[...new Set(errors)].slice(0, 30).join('\n')}` : 'Klaidų nėra.');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
