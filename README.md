# GTA - Garsioji Talentingoji Adriana

Kalėdinis klasės vakarėlio žaidimas. Adriana žaidžia dideliame ekrane, o klasiokai per QR kodą prisijungia telefonais, mato save tribūnoje ir fone kuria šurmulį.

## Kas jau veikia

- Laukiamasis su QR kodu, logotipu ir tribūna su visų prisijungusiųjų avatarais.
- Prisijungimas telefonu: vardas iš klasės sąrašo + gimimo data (mėnuo ir diena). 3 klaidos - 15 s pertrauka. Perkrovus telefoną, jis grįžta be datos. Jei vaikas jungiasi iš kito telefono, senasis atjungiamas.
- Telefono mygtukai keičiasi pagal etapą (laukiamajame: "Labas!" ir "Pašokti").
- 4 etapas "Bėgimas iki autobuso": Adriana šokinėja per balas, pusnis, tvoras ir draugus. Klasiokai mėto gniūžtes, moja iš autobuso, šaukia, o "vairuotojo draugai" prideda iki +5 s.
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
- Pulte spausk **Įkelti klasės aplanką**. Sąrašas išsaugomas tik šios naršyklės atmintyje. Po vakarėlio spausk **Ištrinti visus duomenis**.

## Vakarėlio metu

| Klavišas | Veiksmas |
| --- | --- |
| ENTER | laukiamasis → žemėlapis → misija → žemėlapis |
| TARPAS arba ↑ | Adrianos šuolis |
| R | kartoti etapą |
| ESC | į laukiamąjį |
| H | vedėjo pultas |
| F | visas ekranas |

Jei kompiuteris silpnas, atidaryk `screen.html?canvas`.

## Testas su Playwright (30 virtualių telefonų)

```bash
npm i -D playwright && npx playwright install chromium
python3 -m http.server 8765          # kitame terminale
PHONES=26 node tests/load-test.cjs   # vietinis režimas
NET=supabase BASE_URL=https://<vartotojas>.github.io/adriana-gta/ node tests/load-test.cjs
```

Ekrano nuotraukos išsaugomos `shots/` aplanke.

## Replikos

`lines/<etapas>.json`. Vardą įterpia `{vardas}`. Vardas visada rašomas vardininku, todėl replikas verta kurti taip, kad vardas būtų sakinio veikėjas ("{vardas} laiko duris!"), o ne kreipinys.

## Logotipas ir žemėlapis

- `assets/logo.svg` - logotipas (tekstas paverstas kontūrais iš šrifto Anton, SIL Open Font License).
- `assets/map.svg` - stilizuotas žiemos Vilniaus žemėlapis be užrašų. Taškų vietos, pavadinimai ir ikonos - `js/screen/stages.js` (`ROUTE`).
- Norint žemėlapį pakeisti AI sugeneruotu paveikslėliu: įdėk `assets/map.png` (1920×1080) ir `assets/manifest.json` įrašyk `"map": "assets/map.png"`.
- Žemėlapyje etapai, kurie dar nesukurti, praleidžiami automatiškai. Pulte **Maršrutas iš naujo** grąžina žymą į pradžią.

## Tikri paveikslėliai

Kol kas visi paveikslėliai nupiešti kodu (`js/screen/art.js`). Kai turėsit tikrus PNG, įdėkit juos į `assets/` ir įrašykit į `assets/manifest.json`:

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

## Struktūra

```
screen.html, join.html, config.js
js/net.js            ryšys (Supabase arba vietinis)
js/common.js         bendros funkcijos
js/phone/join.js     telefono puslapis
js/screen/main.js    ekrano paleidimas ir vedėjo pultas
js/screen/host.js    žaidėjai, vardų tikrinimas, rolės
js/screen/stages.js  etapų rolės ir mygtukai
js/screen/scenes/    Boot, Lobby, Bus
lines/               replikų biblioteka
vendor/              Phaser 3.90, supabase-js, qrcode-generator (MIT)
```
