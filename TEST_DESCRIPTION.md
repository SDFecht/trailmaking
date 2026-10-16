# Trail Making — test description / tesztleírás

[English](#english) | [Magyar](#magyar)

## English

**Test software author:** Fecht Szilárd Dávid  
**Contact:** [fecht@inf.elte.hu](mailto:fecht@inf.elte.hu)  
**Project:** AdaPsyd — Trail Making, standalone version  
**Package version:** 1.0.0

### General description

This program is a standalone, browser-based version of the AdaPsyd Trail Making test. The participant clicks or touches circles on the screen in the order specified by the task. The program draws a path through correctly selected points, measures completion time and records incorrect selections.

The interface offers two task groups: **cognitive flexibility** and **inhibition**. The first requires following numerical order or alternating between numbers and letters. In the second, circle size determines the order; in task D, participants must disregard the numbers printed inside the circles. The package implements the A–D tasks described below and a separate baseline task for the inhibition group.

The interface is available in English and Hungarian. The program exports raw measurement data; it does not calculate T scores, percentiles or other normative scores.

### Tasks and required order

| Task | Display and rule | Under 12 years | 12 years and older |
| --- | --- | --- | --- |
| **A — Numbers** | Select equally sized, numbered circles in ascending numerical order: `1 → 2 → 3 → …`. | 15 points | 25 points |
| **B — Numbers and letters** | Select equally sized circles by alternating numbers and letters: `1 → A → 2 → B → 3 → C → …`. | 15 points | 25 points |
| **Separate inhibition baseline** | Follow numerical order using the same rule as task A, with a fixed number of points. Internal identifier: `inhibition_baseline_15`. | 15 points | 15 points |
| **C — Circles** | Select unlabelled circles in ascending size order, from the smallest to the largest. | 15 points | 15 points |
| **D — Circles and numbers** | Circles of different sizes contain randomly assigned numbers. The required order is ascending circle size; the printed numbers do not determine the order. | 15 points | 15 points |

In task B, the 15-point sequence ends with `8`, and the 25-point sequence ends with `13`.

#### Selecting the inhibition baseline

Tasks C and D become available once a completed A result or a separate inhibition baseline is available. If an A result exists, the program uses it as the baseline. Otherwise, the participant must complete the separate 15-point numerical-order task. If A is completed later, its result takes precedence over the separate baseline.

Task A has 25 points for participants aged 12 and older, while the separate baseline still has 15 points in this age group. The CSV therefore includes the baseline source and timing data so that task length can be considered during analysis.

### Measurement procedure

1. On the setup page, choose the age group and language. The program does not request a participant identifier, date of birth or exact age.
2. After loading the test, use the fullscreen start button to enter the task menu.
3. Choose a task group and a task, then press **Test** to start the countdown. **Back** returns to the previous menu without starting the task.
4. The measurement task starts after the countdown. The entire field is visible at once. The first required circle is highlighted in coral; the other circles are turquoise.
5. The participant selects the points in the required order. The program connects consecutively accepted points with lines.
6. The final correct selection stops the timer. The **Done** button then appears and returns to the relevant menu or the task-group completion screen.
7. Once at least one task group is complete, **Save data** downloads the raw data as a CSV file.

The cognitive flexibility group requires completed A and B tasks. The inhibition group requires an available baseline and completed C and D tasks. Both groups may be completed in the same session; the export contains the data collected up to that point.

### Timing and error handling

The measurement timer starts at the end of the countdown and stops when the final required point is selected correctly. The exported result is an integer number of milliseconds. Waiting to press **Done** is excluded from completion time. Time spent correcting errors is included because the timer continues after an incorrect selection.

A selection is registered when the mouse button is pressed or a touch begins (`pointerdown`). Selecting a circle other than the next required one produces an error tone, increments the measurement error count and leaves the same next point expected. Selecting an already completed circle again is also an error while the task is in progress. Clicking the empty background does not increase the error count, but the event is logged.

The program generates error feedback using Web Audio: a short, 150-millisecond sine tone decreases in volume and pitch. It uses no recording or separate audio file. Clicks within the field after task completion and before leaving the field are also logged without changing the completed result.

On restart, the affected final result is cleared or replaced according to the test's restart rules. The standalone version also preserves earlier attempts' layouts and clicks for export. The `retained` field indicates whether a measurement attempt's result has been retained; the `task` rows contain the final result snapshot.

### Random layout generation and the reused algorithm

**The random closed-shape generator comes from an external source: [Kelvin Au — Random-Irregular-Polygon](https://github.com/kelvinau/Random-Irregular-Polygon).** The polygon-generation, space-partitioning and point-ordering procedures in the `Point` and `RIP` classes were taken from that project. Kelvin Au is the polygon generator's author; the reused algorithm is not an original algorithm by the test software author.

The source revision inspected for comparison is [`ccff28233f637084559d69da43073be965d4ba57`](https://github.com/kelvinau/Random-Irregular-Polygon/tree/ccff28233f637084559d69da43073be965d4ba57). This is a verification reference, not a record of the original import date or commit. The original JavaScript source is available [here](https://github.com/kelvinau/Random-Irregular-Polygon/blob/ccff28233f637084559d69da43073be965d4ba57/src/random-irregular-polygon.js).

The integrated version extends the reused algorithm with separate horizontal and vertical coordinate limits and checks for a minimum distance between point centres. It is therefore a version of the original library adapted to the test. The library is MIT-licensed; its original copyright notice and license text are included in [vendor/random-irregular-polygon/LICENSE.md](vendor/random-irregular-polygon/LICENSE.md).

During generation, the program selects random points within the configured bounds, checks their separation and orders them using the reused procedure. Each new measurement field receives a new layout. The required selection order follows the numbers, letters or increasing circle sizes assigned to that point order.

The generator was designed to produce the vertices of a closed polygon. In the test, however, the participant proceeds from the first point to the last: returning to the first point is not required, and the program does not draw that closing segment.

#### Current layout parameters

The field uses a **1024 × 672** logical coordinate system. The program scales it proportionally to the available display area.

| Parameter | A, B and separate baseline | C and D |
| --- | --- | --- |
| Horizontal range of point centres | 50–974 | 75–949 |
| Vertical range of point centres | 50–622 | 75–597 |
| Minimum distance between centres | 100 units | 150 units |
| Circle radius | 30 units | 16 to 72 units, in steps of 4 |

The table gives logical units, not physical millimetres. Layout generation does not use a fixed or exported random seed. The actual field can be reconstructed from the exported coordinates, order, labels and radii.

The original library's documentation identifies Thomas Auer and Martin Held's *Heuristics for the Generation of Random Polygons* as the algorithmic reference. The paper is also [included in the source project](https://github.com/kelvinau/Random-Irregular-Polygon/blob/ccff28233f637084559d69da43073be965d4ba57/paper/Heuristics%20for%20the%20Generation%20of%20Random%20Polygons.pdf).

### Raw data and CSV export

**Save data** creates a single UTF-8, comma-separated CSV file containing:

- The automatically generated session identifier, language, age group and timestamps.
- Final raw task durations, error counts and detailed error records.
- Every started measurement attempt, including restarted or incomplete attempts.
- The order, label, coordinates and radius of every generated point.
- Every detected circle and background press within the task field: click position, timestamp, elapsed time, expected and selected points, correctness and whether it counted as an error.
- Field clicks after completion and the display dimensions at the time of each click.

Menu clicks are not part of this field-event log. The same error may appear in both the complete click log and the final detailed error records; these two row types must not be added together.

For exact column definitions, row types, time bases and flags, see [DATA_FORMAT.md](DATA_FORMAT.md#english).

Measurement data stays in browser memory until downloaded. The program does not send it to a server or save it in persistent browser storage. Reloading or closing the page discards data that has not been downloaded. After saving, the CSV can be downloaded again or a new session can be started.

### Running the program and technical details

The program consists of static HTML, CSS and JavaScript files. Rendering uses the bundled **Phaser 4.2.1**; the browser generates the error tone. The package contains no image, video or audio recordings. Laravel, PHP, a database and a build step are not required.

Run `npm start` inside the folder, then open `http://localhost:8080`. This requires Node.js 22 or newer; `npm install` is not needed. Any other static HTTP server may also be used. Detailed instructions for running and publishing the package are in [README.md](README.md#english).

### Authorship and licenses

The AdaPsyd Trail Making test software was created by **Fecht Szilárd Dávid**, contact [fecht@inf.elte.hu](mailto:fecht@inf.elte.hu). The standalone package derives from the AdaPsyd implementation and includes a detailed field-event log and CSV export.

The test's own source code and documentation may be freely used, modified and redistributed, including commercially, under the [MIT License](LICENSE.md). **The author credit — Fecht Szilárd Dávid, fecht@inf.elte.hu — and license text must be retained in copies or substantial portions of the software.** Preserve the copyright headers in the source files as well.

Phaser and Random-Irregular-Polygon are included with separate author credits and their own MIT licenses. Their original notices and license texts must also be retained. Detailed attribution for external components is provided in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md#english).

Suggested short software citation: **Fecht Szilárd Dávid. Trail Making — AdaPsyd standalone. Version 1.0.0. Software.** The final public repository URL, release year and an optional DOI can be added upon publication.

---

## Magyar

**A tesztprogram készítője:** Fecht Szilárd Dávid  
**Kapcsolat:** [fecht@inf.elte.hu](mailto:fecht@inf.elte.hu)  
**Projekt:** AdaPsyd – Trail Making, önállóan futtatható változat  
**Csomagverzió:** 1.0.0

### Általános leírás

Ez a program az AdaPsyd rendszer Trail Making tesztjének böngészőben futó, önálló változata. A résztvevőnek a képernyőn elhelyezett körökre kell kattintania vagy érintenie, a feladat által meghatározott sorrendben. A program a helyes választásokból útvonalat rajzol, méri a teljesítés idejét, és rögzíti a hibás választásokat.

A felület két feladatcsoportot kínál: **kognitív flexibilitás** és **gátlás**. Az előbbiben a számok sorrendjét, illetve a számok és betűk váltakozását kell követni. Az utóbbiban a körök mérete határozza meg a sorrendet; a D feladatban a körökre írt számoktól el kell tekinteni. A csomag az itt ismertetett A–D feladatokat és a gátlási feladatcsoport külön alapmérését valósítja meg.

A kezelőfelület magyarul és angolul érhető el. A program nyers mérési adatokat exportál; T-értéket, percentilist vagy más normaértéket nem számít.

### Feladatok és helyes sorrend

| Feladat | Megjelenítés és szabály | 12 éves kor alatt | 12 éves kortól |
| --- | --- | --- | --- |
| **A – Számok** | Azonos méretű, számozott körök kiválasztása növekvő számsorrendben: `1 → 2 → 3 → …`. | 15 pont | 25 pont |
| **B – Számok és betűk** | Azonos méretű körök kiválasztása váltakozó szám- és betűsorrendben: `1 → A → 2 → B → 3 → C → …`. | 15 pont | 25 pont |
| **Külön gátlási alapmérés** | Az A feladattal azonos szabályú számsorrend, rögzített ponthosszal. Belső azonosítója: `inhibition_baseline_15`. | 15 pont | 15 pont |
| **C – Körök** | Felirat nélküli körök kiválasztása méret szerint, a legkisebbtől a legnagyobbig. | 15 pont | 15 pont |
| **D – Körök és számok** | Különböző méretű, véletlenszerűen kiosztott számokat tartalmazó körök. A helyes sorrend a méret szerinti növekedés; a számfeliratok nem határozzák meg a sorrendet. | 15 pont | 15 pont |

A B feladatban a 15 pontos sorozat `8`-cal, a 25 pontos sorozat `13`-mal végződik.

#### A gátlási alapmérés kiválasztása

A C és D feladat akkor indítható, ha már rendelkezésre áll befejezett A eredmény vagy külön gátlási alapmérés. Ha van A eredmény, a program azt használja alapértékként. Ennek hiányában a külön, 15 pontos számsorrend-feladatot kell elvégezni. Ha később az A is elkészül, annak eredménye elsőbbséget kap a külön alapméréssel szemben.

Az A feladat 12 éves kortól 25 pontos, a külön alapmérés ebben a korcsoportban is 15 pontos. A CSV ezért az alapérték forrását és időeredményét is tartalmazza; ezeket az elemzéskor a feladathosszal együtt lehet figyelembe venni.

### Egy mérés menete

1. A kezdőlapon ki kell választani a korcsoportot és a nyelvet. A program résztvevői azonosítót, születési dátumot és pontos életkort nem kér.
2. A teszt betöltése után a teljes képernyős indítógombbal lehet a feladatmenübe lépni.
3. A feladatcsoport és a konkrét feladat kiválasztása után a **Teszt** gomb indítja a visszaszámlálást. A **Vissza** gombbal a feladat elindítása nélkül lehet visszalépni.
4. A mérési feladat visszaszámlálás után indul. A teljes pálya egyszerre látható, az elsőként kiválasztandó kör eltérő, korallszínű jelölést kap. A további körök türkizszínűek.
5. A résztvevő az előírt sorrendben kiválasztja a pontokat. A program a helyesen kiválasztott szomszédos pontokat vonallal összeköti.
6. Az utolsó helyes választás lezárja az időmérést. Ekkor jelenik meg a **Vége** gomb, amellyel vissza lehet térni a megfelelő menübe vagy a feladatcsoport lezáró képernyőjére.
7. Legalább egy teljes feladatcsoport elvégzése után az **Adatok mentése** gomb letölti a nyers adatokat CSV-fájlként.

A kognitív feladatcsoporthoz A és B befejezése szükséges. A gátlási feladatcsoporthoz használható alapmérés, valamint C és D befejezése szükséges. Ugyanabban a mérésben mindkét csoport is elvégezhető; az export az addig összegyűjtött adatokat tartalmazza.

### Időmérés és hibakezelés

A mérési idő a visszaszámlálás végén indul, és az utolsó szükséges pont helyes kiválasztásakor áll meg. Az eredmény egész milliszekundumban kerül az exportba. A **Vége** gomb megnyomásáig eltelt további várakozás nem része a teljesítési időnek. A hibák javítására fordított idő viszont beleszámít, mert a mérés hibás kattintáskor tovább fut.

A választás az egérgomb lenyomásakor vagy az érintés kezdetekor történik (`pointerdown`). Ha a résztvevő nem a következő szükséges körre kattint, hibajelző hang szól, a mérésben nő a hibaszám, és a program ugyanazt a következő pontot várja. Egy korábban már teljesített kör ismételt kiválasztása is hibás választás, amíg a feladat tart. Az üres háttérre kattintás nem növeli a hibaszámot, de az eseménynaplóba bekerül.

A hibajelző hangot a program Web Audio segítségével állítja elő: egy rövid, 150 milliszekundumos, halkuló és mélyülő szinuszhang szólal meg. Ehhez nem használ felvételt vagy külön hangfájlt. A feladat befejezése és a pálya elhagyása közötti további pályakattintások is naplózódnak, a már lezárt eredményt nem módosítják.

Újrakezdéskor az érintett végső eredmény a teszt újrakezdési szabályai szerint törlődik vagy lecserélődik. Az önálló változat a korábbi próbálkozások pályáit és kattintásait is megőrzi az exporthoz. A `retained` mező jelzi, hogy egy mérési próbálkozás eredménye megmaradt-e; a végső eredményállapotot a `task` sorok tartalmazzák.

### Véletlen pályagenerálás és az átvett algoritmus

**A véletlen zárt alakzatot generáló kód külső forrásból származik: [Kelvin Au – Random-Irregular-Polygon](https://github.com/kelvinau/Random-Irregular-Polygon).** A `Point` és `RIP` osztályok alakzatgeneráló, térfelosztó és pontrendező eljárásai ebből a projektből kerültek átvételre. Az alakzatgenerátor szerzője Kelvin Au; az átvett algoritmus nem a tesztprogram készítőjének saját algoritmusa.

A forrás összehasonlításához használt állapot: [`ccff28233f637084559d69da43073be965d4ba57`](https://github.com/kelvinau/Random-Irregular-Polygon/tree/ccff28233f637084559d69da43073be965d4ba57). Ez ellenőrzési hivatkozás, nem az eredeti átvétel időpontjának vagy commitjának megjelölése. Az eredeti JavaScript-forrás [itt olvasható](https://github.com/kelvinau/Random-Irregular-Polygon/blob/ccff28233f637084559d69da43073be965d4ba57/src/random-irregular-polygon.js).

A tesztbe épített változat az átvett algoritmust külön vízszintes és függőleges koordinátahatárokkal, valamint a pontközéppontok minimális távolságának ellenőrzésével egészíti ki. A beépített kód ezért az eredeti könyvtár teszthez illesztett változata. A könyvtár MIT-licencű; az eredeti szerzői jogi és licencszöveg a [vendor/random-irregular-polygon/LICENSE.md](vendor/random-irregular-polygon/LICENSE.md) fájlban található.

A generálás során a program véletlen pontokat választ a megadott határok között, ellenőrzi a ponttávolságot, majd az átvett eljárással rendezi a pontokat. Minden új mérési pálya új elrendezést kap. A szükséges választási sorrend ehhez a pontsorrendhez rendelt számokból, betűkből vagy növekvő körméretekből adódik.

A generátor zárt sokszög csúcsainak előállítására készült, de a tesztben a résztvevő az első ponttól az utolsóig halad: az utolsó pont után nem kell visszakattintani az elsőre, és a program ezt a záró szakaszt nem rajzolja meg.

#### Az aktuális pályaparaméterek

A pálya logikai koordinátarendszere **1024 × 672** egység. A program ezt arányosan méretezi a rendelkezésre álló képernyőterületre.

| Paraméter | A, B és külön alapmérés | C és D |
| --- | --- | --- |
| Pontközéppontok vízszintes tartománya | 50–974 | 75–949 |
| Pontközéppontok függőleges tartománya | 50–622 | 75–597 |
| Középpontok minimális távolsága | 100 egység | 150 egység |
| Körsugár | 30 egység | 16-tól 72 egységig, 4 egységes lépésekben |

A táblázat logikai egységeket ad meg, nem fizikai millimétereket. A véletlen elrendezésekhez nincs rögzített vagy exportált véletlenmag; a tényleges pálya az exportált koordinátákból, sorrendből, feliratokból és sugarakból rekonstruálható.

Az eredeti könyvtár dokumentációja Thomas Auer és Martin Held *Heuristics for the Generation of Random Polygons* című munkáját nevezi meg algoritmikus előzményként. A tanulmány a [forrásprojektben is megtalálható](https://github.com/kelvinau/Random-Irregular-Polygon/blob/ccff28233f637084559d69da43073be965d4ba57/paper/Heuristics%20for%20the%20Generation%20of%20Random%20Polygons.pdf).

### Nyers adatok és CSV-export

Az **Adatok mentése** egyetlen, UTF-8 kódolású, vesszővel tagolt CSV-fájlt hoz létre. A fájl az alábbiakat tartalmazza:

- A mérés automatikusan generált azonosítóját, a nyelvet, a korcsoportot és az időbélyegeket.
- A végső nyers feladatidőket, hibaszámokat és részletes hibarekordokat.
- Minden elindított mérési próbálkozást, az újrakezdett vagy befejezetlen próbálkozásokat is.
- Minden létrehozott pont sorrendjét, feliratát, koordinátáit és sugarát.
- A feladatpályán észlelt minden kör- és háttérkattintást: a kattintás helyét, időpontját, eltelt idejét, a várt és választott pontot, a helyességet és azt, hogy beleszámított-e a hibaszámba.
- A feladat befejezése utáni pályakattintásokat, valamint a kattintáskori megjelenítési méretet.

A menükben végzett kattintások nem részei ennek a pályaesemény-naplónak. Ugyanaz a hiba a teljes kattintásnaplóban és a végső részletes hibarekordok között is megjelenhet; a két sortípust nem szabad összeadni.

Az oszlopok, sortípusok, időalapok és jelölések pontos leírása: [DATA_FORMAT.md](DATA_FORMAT.md#magyar).

A mérési adatok a böngésző memóriájában maradnak a letöltésig. A program nem küldi őket szerverre, és nem menti őket böngészős tartós tárhelyre. Az oldal újratöltése vagy bezárása a még le nem töltött adatokat elveszíti. A mentés után a CSV ismét letölthető, illetve új mérés indítható.

### Futtatás és technikai háttér

A program statikus HTML-, CSS- és JavaScript-fájlokból áll. A megjelenítést a csomagban mellékelt **Phaser 4.2.1** végzi; a hibajelző csipogást a böngésző állítja elő. A csomag nem tartalmaz kép-, videó- vagy hangfelvételeket. Laravel, PHP, adatbázis és fordítási lépés nem szükséges.

A mappában futtatott `npm start` után a program a `http://localhost:8080` címen nyitható meg. Ehhez Node.js 22 vagy újabb szükséges; az `npm install` nem szükséges. Más statikus HTTP-kiszolgáló is használható. A részletes indítási és közzétételi útmutató a [README.md](README.md#magyar) fájlban található.

### Szerzői megjelölés és licencek

Az AdaPsyd Trail Making tesztprogram készítője **Fecht Szilárd Dávid**, elérhetősége [fecht@inf.elte.hu](mailto:fecht@inf.elte.hu). Az önálló csomag az AdaPsyd megvalósításából készült, részletes pályaesemény-naplóval és CSV-exporttal.

A teszt saját forráskódja és dokumentációja [MIT-licenc](LICENSE.md) alatt szabadon használható, módosítható és továbbadható, kereskedelmi célra is. **A szerzői megjelölést – Fecht Szilárd Dávid, fecht@inf.elte.hu – és a licencszöveget kötelező megtartani a másolatokban vagy a szoftver lényegi részeinek átvételekor.** A forrásfájlok szerzői fejléceit is meg kell őrizni.

A Phaser és a Random-Irregular-Polygon külön szerzői megjelöléssel és saját MIT-licenccel szerepelnek a csomagban. Ezek eredeti megjelöléseit és licencszövegeit szintén meg kell tartani. A külső összetevők részletes forrásmegjelölése: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md#magyar).

Javasolt rövid szoftverhivatkozás: **Fecht Szilárd Dávid. Trail Making – AdaPsyd standalone. 1.0.0 verzió. Szoftver.** A nyilvános repository végleges címe, a kiadás éve és egy esetleges DOI a közzétételkor egészítheti ki a hivatkozást.
