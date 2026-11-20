# GTA - Garsioji Talentingoji Adriana

Kalėdinis klasės vakarėlio žaidimas. Adriana žaidžia dideliame ekrane, o klasiokai per QR kodą prisijungia telefonais, mato save tribūnoje ir fone kuria šurmulį.

## Kas jau veikia

- Laukiamasis su QR kodu, logotipu ir tribūna su visų prisijungusiųjų avatarais.
- Prisijungimas telefonu: vardas iš klasės sąrašo + gimimo data (mėnuo ir diena). 3 klaidos - 15 s pertrauka. Perkrovus telefoną, jis grįžta be datos. Jei vaikas jungiasi iš kito telefono, senasis atjungiamas.
- Telefono mygtukai keičiasi pagal etapą (laukiamajame: "Labas!" ir "Pašokti").
- 4 etapas "Bėgimas iki autobuso": Adriana šokinėja per balas, pusnis, tvoras ir draugus. Klasiokai mėto gniūžtes, moja iš autobuso, šaukia, o "vairuotojo draugai" prideda iki +5 s.
- 5 etapas "Mados šou Vingio estradoje": Adriana eina podiumu pagal muziką (← → pakaitomis į taktą), gale - poza (TARPAS). Klasiokai ploja (ramina), fotografuoja, pučia vėją ir leidžia sniegą; mokytoja - komisija, pabaigoje parodo balą.
- 6 etapas "Kalėdinis koncertas Filharmonijoje": kiekviena frazė („Skamba varpeliai“) eina iš eilės - 1) rojalis pagroja, 2) Adriana groja pagal natų korteles klavišais A S D F G (Do Re Mi Fa Sol; šviečia kita nata ir jos klavišas), 3) atsako viena orkestro grupė (varpeliai, smuikai, būgnai ar trimitai - jų telefonai žali, kitų raudoni). Finale groja visi, pabaigoje visi nusilenkia. Mokytoja - dirigentė.
- Vedėjo pultas (klavišas H), replikų biblioteka, garso efektai, vietinis testavimo režimas.

## Darbas su VS Code

1. Atidaryk failą `adriana-gta.code-workspace` (dukart spustelėk arba **File → Open Workspace from File**). Jame yra VS Code nustatymai ir užduotys.
2. VS Code pasiūlys rekomenduojamą plėtinį **Live Server** - įdiek.
3. Apačioje spausk **Go Live** (arba dešiniu pelės mygtuku ant `index.html` → *Open with Live Server*). Atsidarys `http://127.0.0.1:8765/`, ten spausk **Ekranas: vietinis testas**.
4. Be plėtinio: **Terminal → Run Task → Paleisti serverį (8765)** ir naršyklėje atidaryk `http://localhost:8765/`.
5. Į GitHub: kairėje **Source Control** → *Publish to GitHub* (pasirink *public*, kad veiktų GitHub Pages).

Testams: terminale `npm install` ir `npx playwright install chromium`, tada **Run Task → Testas: 26 virtualūs telefonai** (serveris turi veikti).

## Greitas testas savo kompiuteryje (be Supabase)

1. Terminale, projekto aplanke: `python3 -m http.server 8765`
2. Naršyklėje atidaryk: <http://localhost:8765/screen.html?net=local>
3. Pulte (H) spausk **Demo klasė**.
4. Pulte spausk telefono nuorodą - atsidarys naujas skirtukas, tai bus "telefonas". Pasirink pvz. **Agnė**, data **sausio 15** (visos demo datos yra `demo/klase-demo.json`). Gali atidaryti kelis tokius skirtukus.
5. Grįžk į ekrano skirtuką ir spausk **ENTER** - prasidės autobuso etapas.

Vietiniame režime ekranas ir "telefonai" susikalba tik tos pačios naršyklės skirtukuose.

## Paruošimas tikriems telefonams

### 1. Supabase (nemokamai, apie 5 min)

1. Eik į [supabase.com](https://supabase.com), prisijunk (galima per GitHub) ir sukurk naują projektą (New project). Regionas - Europe.
2. Kai projektas paruoštas: **Project Settings → API** ir nukopijuok **Project URL** bei **anon public** raktą (naujesnėje sąsajoje gali vadintis **publishable** raktas).
3. Įrašyk abu į `config.js`.
4. Realtime nustatymuose turi būti leidžiami vieši kanalai (pagal nutylėjimą leidžiami).
5. Nemokamas projektas užmiega po savaitės neveiklos - prieš vakarėlį atsidaryk jį Supabase svetainėje.

Duomenų bazės lentelių kurti nereikia: naudojamas tik Realtime Broadcast.

### 2. GitHub Pages

1. Sukurk repozitoriją (pvz. `adriana-gta`) ir įkelk visus failus. **Klasės aplanko nekelk.**
2. **Settings → Pages → Build and deployment**: Source - *Deploy from a branch*, šaka `main`, aplankas `/ (root)`.
3. Po minutės žaidimas bus adresu `https://<vartotojas>.github.io/adriana-gta/screen.html`.

### 3. Klasės aplankas (tik pristatymo kompiuteryje)

Aplanke turi būti `klase.json` ir avatarų paveikslėliai:

```json
{
  "klase": "4A",
  "adriana": "adriana.png",
  "vaikai": [
    { "vardas": "Jonas", "gimimo_data": "2016-03-14", "avataras": "jonas.png" },
    { "vardas": "Agnė P.", "gimimo_data": "05-30", "avataras": "agne.png" }
  ]
}
```

- Data: `2016-03-14` arba `03-14` (metai nesvarbūs).
- Jei du vaikai tuo pačiu vardu, pridėk pavardės raidę.
- Avataras - kvadratinis PNG ar JPG, bus apkarpytas į apskritimą. Jei avataro nėra, rodomos vardo raidės.
- `adriana.png` - Adrianos galva, dedama ant bėgančio kūno.
- Mokytojai pridėk `"mokytoja": true` - ji neužims vaikų vietų, o kiekviename etape gaus savo rolę (namuose - stebukladarė, laiptuose - budėtoja, klasėje - prie lentos, autobuse - vairuotoja).
- Pulte spausk **Įkelti klasės aplanką**. Sąrašas išsaugomas tik šios naršyklės atmintyje. Po vakarėlio spausk **Ištrinti visus duomenis**.

## Vakarėlio metu

| Klavišas | Veiksmas |
| --- | --- |
| ENTER | laukiamasis → žemėlapis → misija → žemėlapis |
| ← → | Adriana bėga po kambarį (1 etapas) |
| ↓ arba TARPAS | ieškoti soskės (1 etapas) |
| ← → paeiliui | lipti laiptais (2 etapas); ta pati rodyklė du kartus - suklumpa |
| → arba TARPAS | Adriana perduoda atviruką (3 etapas); jei kas užsižiopsojo 3 s - perduoda už jį |
| TARPAS arba ↑ | Adrianos šuolis (autobusas) |
| ← → pakaitomis į taktą | žingsniai podiumu (5 etapas); podiumo gale TARPAS - poza, kai žiedas užsidaro |
| A S D F G (arba 1-5) | rojalio klavišai Do Re Mi Fa Sol (6 etapas) - spausk tą, kurio natos kortelė šviečia |
| R | kartoti etapą |
| ESC | į laukiamąjį |
| H | vedėjo pultas |
| F | visas ekranas (koncerto etape F - rojalio klavišas, todėl neveikia) |

Jei kompiuteris silpnas, atidaryk `screen.html?canvas`.

## Testas su Playwright (18 virtualių telefonų: 17 vaikų ir mokytoja)

```bash
npm i -D playwright && npx playwright install chromium
python3 -m http.server 8765          # kitame terminale
node tests/load-test.cjs             # vietinis režimas
NET=supabase BASE_URL=https://<vartotojas>.github.io/adriana-gta/ node tests/load-test.cjs
```

Ekrano nuotraukos išsaugomos `shots/` aplanke.

## Replikos

`lines/<etapas>.json`. Vardą įterpia `{vardas}`. Vardas visada rašomas vardininku, todėl replikas verta kurti taip, kad vardas būtų sakinio veikėjas ("{vardas} laiko duris!"), o ne kreipinys.

## Logotipas ir žemėlapis

- `assets/logo.svg` - logotipas (tekstas paverstas kontūrais iš šrifto Anton, SIL Open Font License).
- `assets/map.svg` - tikras Vilniaus žemėlapis iš OpenStreetMap duomenų (gatvės, Neris, parkai), senamiestis išdidintas. Užrašai ir taškai piešiami žaidime.
- `assets/map-layout.json` - taškų vietos ekrane, pavadinimai ir orientyrai. Žaidimas jas paima vietoj `ROUTE.pos` iš `js/screen/stages.js`.
- Abu failai sugeneruojami iš naujo: `python3 tools/make_map_osm.py tools/vilnius.json` (taškų koordinatės - failo viršuje). `tools/vilnius.json` (OSM duomenys) į GitHub nekeliamas.
- Namų ir mokyklos taškai - tik apytiksliai rajonai (svetainė vieša).
- Žemėlapio duomenys: © OpenStreetMap contributors (ODbL) - užrašas rodomas ekrano kampe.
- Norint žemėlapį pakeisti AI sugeneruotu paveikslėliu: įdėk `assets/map.png` (1920×1080) ir `assets/manifest.json` įrašyk `"map": "assets/map.png"`.
- Žemėlapyje etapai, kurie dar nesukurti, praleidžiami automatiškai. Pulte **Maršrutas iš naujo** grąžina žymą į pradžią.

## Tikri paveikslėliai

Kol kas visi paveikslėliai nupiešti kodu (`js/screen/art.js`, 1 etapo - `js/screen/art-home.js`, 2 etapo - `js/screen/art-school.js`). Kai turėsit tikrus PNG, įdėkit juos į `assets/` ir įrašykit į `assets/manifest.json`:

```json
{ "images": { "bus": "assets/bus.png", "tree": "assets/tree.png" } }
```

| Raktas | Dydis, px | Pastaba |
| --- | --- | --- |
| sky | 1920×1080 | dangus |
| sun | 440×440 | saulė |
| skyline | 1600×420 | Vilniaus siluetas, kartojasi horizontaliai |
| sidewalk | 256×140 | šaligatvis, kartojasi |
| adr_run1, adr_run2, adr_jump | 150×200 | Adrianos kūnas be galvos |
| adr_head | 150×150 | galva, jei nėra adriana.png |
| kid_body | 120×150 | draugo kūnas (baltas, spalvinamas kode) |
| fence, puddle, snowpile | 150×124, 210×48, 186×100 | kliūtys |
| tree, lamp, snowman, stop | 250×370, 100×390, 180×240, 140×330 | dekoracijos |
| bus, bus_door | 760×320, 92×196 | langų ir durų vietos - `art.js` |
| snowball, splat, star, star_off | 40, 120, 54, 54 | smulkmenos |
| adr_duck | 150×200 | Adriana pritūpusi (ieško, išsisuka) |
| home_room | 1920×1080 | 1 etapo kambarys; langas iki grindų permatomas (`HOME_WINDOW` - `art-home.js`) |
| home_sky, tv_tower | 560×690, 150×430 | vaizdas pro langą (kalva) ir Vilniaus TV bokštas (`TOWER`) |
| home_sofa, home_toybox, home_basket | 340×220, 170×160, 140×140 | slėptuvės |
| home_xtree, home_shelf, home_fridge | 250×410, 210×370, 210×430 | slėptuvės |
| baby_sit1, baby_sit2 | 170×130 | sėdintys broliukai (kūnas be galvos) |
| baby_sad, baby_cry, baby_scared, baby_calm | 140×140 | broliuko galva be plaukų |
| baby_hair | 140×140 | plaukai (balti, spalvinami kode) |
| train_engine, train_car | 96×70, 76×60 | medinis traukinukas (bėgiai piešiami kode) |
| soske, tear, home_monster | 80×80, 18×24, 420×460 | soskė, ašara, pabaisos šešėlis |
| toy_bear, toy_duck, toy_ball, toy_dino, toy_bunny, toy_car, toy_rattle, toy_blocks | apie 90×90 | ramintojų žaisliukai |
| school_wall_tile | 160×160 | 2 etapo siena (kartojasi) |
| school_window, school_door, school_board | 240×280, 260×330, 260×170 | aprasojęs langas, 3 aukšto durys, skelbimų lenta |
| school_door_open | 260×330 | atidarytos durys į klasę (Adrianai užlipus) |
| class_room | 1920×1080 | 3 etapo klasė (siena, langai, grindys) |
| chalkboard | 460×340 | lenta (tekstas rašomas kode, vieta - `BOARD` iš `art-class.js`) |
| desk, teacher_desk | 180×96, 250×170 | mokinio suolas, mokytojos stalas |
| teacher_back, teacher_hair, teacher_face | 150×250, 120×130, 120×120 | mokytoja iš nugaros, plaukai (spalvinami), veidas be avataro |
| xmas_card, pencil_case | 80×60, 70×30 | kalėdinis atvirukas, penalas |
| teacher_body | 150×250 | budinčios mokytojos kūnas be galvos (galva - jos avataras) |
| backpack_big | 120×150 | didelė kuprinė (didėja nuo knygų) |
| book, mandarin | 70×54, 56×56 | knyga (balta, spalvinama kode), mandarinas |
| school_bell | 90×90 | mokyklos skambutis ("DZIN DZIN!") |
| show_bg | 1920×1080 | 5 etapo fonas: Vingio estrada ir podiumas (podiumo vieta - `RUNWAY` iš `art-show.js`) |
| adr_walk_a, adr_walk_b, adr_pose | 180×240 | Adriana podiume iš priekio (be galvos): žingsniai ir poza |
| adr_back_a, adr_back_b, adr_head_back | 180×240, 150×150 | Adriana iš nugaros ir galva iš nugaros |
| jury_table, score_card | 340×150, 170×200 | komisijos stalas, balo kortelė (skaičius rašomas kode) |
| flash, wind_puff, snow_puff, footprint | 128×128, 160×70, 140×90, 44×70 | blykstė, vėjo gūsis, sniegas, švytintis pėdsakas |
| concert_bg | 1920×1080 | 6 etapo Filharmonijos scena (ložės, užuolaidos, grindys) |
| grand_piano, piano_bench, adr_piano | 480×330, 130×70, 200×220 | rojalis, suoliukas, Adriana prie rojalio (be galvos) |
| inst_bells, inst_violin, inst_drum, inst_trumpet | apie 100×80 | orkestro instrumentai |
| podium_box, rose | 220×60, 40×70 | dirigentės pakyla, rožė finale |

## Struktūra

```
screen.html, join.html, config.js
js/net.js            ryšys (Supabase arba vietinis)
js/common.js         bendros funkcijos
js/phone/join.js     telefono puslapis
js/screen/main.js    ekrano paleidimas ir vedėjo pultas
js/screen/host.js    žaidėjai, vardų tikrinimas, rolės
js/screen/stages.js  etapų rolės ir mygtukai
js/screen/scenes/    Boot, Lobby, Map, Broliai, Laiptai, Pamoka, Bus, Podiumas, Koncertas
lines/               replikų biblioteka
vendor/              Phaser 3.90, supabase-js, qrcode-generator (MIT)
```
