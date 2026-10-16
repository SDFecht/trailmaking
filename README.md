# Trail Making — standalone

[English](#english) | [Magyar](#magyar)

## English

Standalone copy of the AdaPsyd Trail Making test, prepared for a public research repository. It runs as a static HTML/JavaScript application with a bundled **Phaser 4.2.1**. PHP, Laravel, an application database, npm dependencies and a build step are not required.

**Test software author:** Fecht Szilárd Dávid  
**Contact:** [fecht@inf.elte.hu](mailto:fecht@inf.elte.hu)

The general description, task rules, measurement procedure and generator attribution are documented in English and Hungarian in [TEST_DESCRIPTION.md](TEST_DESCRIPTION.md#english).

### Run locally

With Node.js 22 or newer, open a terminal **inside this directory**:

```sh
npm start
```

Open **http://localhost:8080**. No `npm install` is needed. Set the `PORT` environment variable to use another port.

Alternatively, serve this directory using Python:

```sh
python -m http.server 8080
```

Use an HTTP server; opening `index.html` directly as a `file://` URL does not support the JavaScript module and asset loading used here.

The user interface is available in English and Hungarian.

### Run a measurement

1. Choose the age group and select Hungarian or English. No participant identifier is requested.
2. Load the test, then use its fullscreen start button.
3. Choose a cognitive flexibility or inhibition task, then press **Test / Teszt** to start its countdown. Complete the desired task group or both groups.
4. Use the test's **Save data / Adatok mentése** button. A CSV downloads automatically. The result screen also offers the same download again.
5. Choose **New session / Új mérés** for another participant.

The age group selects the same task lengths as the original implementation: A and B use 15 points below age 12 and 25 points from age 12; the separate inhibition baseline, C and D use 15 points. A previously completed A result can serve as the inhibition baseline, following the original rules. The standalone form asks for the age group rather than a date of birth.

### Raw CSV

The CSV contains:

- Final raw task times, error counters and the original detailed error rows.
- Every measurement attempt, including restarted and abandoned attempts.
- Each generated point's label, logical position and radius, in the actual required order.
- Every press on a task node, plus background presses in the task field.
- Expected and selected points, correctness, whether the press counted as an error, click coordinates, elapsed time and viewport size.
- An automatically generated session identifier, language, age group, timestamps and raw baseline metadata.

Menu interactions are excluded. The original measurement timing remains unchanged. The `retained` flag distinguishes an attempt whose result is still retained from a previous attempt cleared by a restart; see [DATA_FORMAT.md](DATA_FORMAT.md) for details.

Data is kept in memory until downloaded. There is no upload, analytics, browser storage or server-side result collection. Reloading or closing the page discards a measurement that has not been downloaded. No T scores or other normative scores are calculated in this package.

### Publish the folder

Copy the **complete contents of this directory** into the root of the new public repository. The Phaser distribution is included. All imports use relative URLs and can also run below a repository path on a static host such as GitHub Pages. Keep `.nojekyll`, `src/` and `vendor/` together with `index.html`, the license and the documentation.

All visual elements are drawn by the program. Wrong selections produce a short tone synthesized through Web Audio; no image, video or audio files are needed.

CSV downloads are excluded by this directory's `.gitignore`.

### Tests

```sh
npm test
```

The tests use the built-in Node.js test runner and require no dependency installation.

### Source and third-party files

The test and its shared runtime helpers were copied from the AdaPsyd project. Standalone adaptations select the age group directly, record measurement events, export CSV and synthesize error feedback. The original application files are separate from this directory.

The polygon-generation algorithm is taken from [Kelvin Au's Random-Irregular-Polygon](https://github.com/kelvinau/Random-Irregular-Polygon), with task-specific coordinate bounds and minimum point-distance checks. Its MIT license is included at [vendor/random-irregular-polygon/LICENSE.md](vendor/random-irregular-polygon/LICENSE.md).

The bundled Phaser distribution is MIT-licensed; its license is included at [vendor/phaser/LICENSE.md](vendor/phaser/LICENSE.md). See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

### License and required attribution

The test's own source code and documentation are released under the [MIT License](LICENSE). Use, modification and redistribution, including commercial use, are permitted provided that the copyright notice and license text are preserved in copies or substantial portions of the software.

**Required author credit: Fecht Szilárd Dávid — fecht@inf.elte.hu.** Preserve the copyright headers in the source and include `LICENSE` when redistributing the software. The separately credited Phaser and Random-Irregular-Polygon components retain their own authorship and MIT license notices.

### Cite this software

For articles or other research outputs using this test, copy the following entry into your project's `.bib` file, for example `references.bib`. The same entry is available as [CITATION.bib](CITATION.bib).

```bibtex
@misc{fecht2026trailmaking,
  author       = {Fecht, Szil{\'a}rd D{\'a}vid},
  title        = {{Trail Making -- AdaPsyd standalone}},
  year         = {2026},
  howpublished = {\url{https://github.com/SDFecht/trailmaking}},
  note         = {Computer software, version 1.0.0}
}
```

Cite it in the text with:

```latex
\cite{fecht2026trailmaking}
```

If your document already has a bibliography setup, use its existing style and configuration. For a basic LaTeX + BibTeX setup, load the URL package in the preamble:

```latex
\usepackage{url}
```

Then place the following before `\end{document}`:

```latex
\bibliographystyle{plain}
\bibliography{references}
```

Use `\bibliography{CITATION}` if you use the included file directly rather than copying the entry into `references.bib`. Run LaTeX, BibTeX, LaTeX and LaTeX again, or use your editor's automatic bibliography build.

For a document using `biblatex`, load the file with `\addbibresource{references.bib}` in the preamble and place `\printbibliography` where the bibliography should appear; `\cite{fecht2026trailmaking}` is the same.

This entry cites the test software by Fecht Szilárd Dávid. The polygon generator's separate attribution remains in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md#english).


---

## Magyar

Az AdaPsyd Trail Making tesztjének önálló változata, nyilvános kutatási repositoryhoz előkészítve. Statikus HTML- és JavaScript-alkalmazásként fut, a csomagban mellékelt **Phaser 4.2.1** használatával. PHP, Laravel, alkalmazás-adatbázis, npm-függőségek és fordítási lépés nem szükséges.

**A tesztprogram készítője:** Fecht Szilárd Dávid  
**Kapcsolat:** [fecht@inf.elte.hu](mailto:fecht@inf.elte.hu)

Az általános leírás, a feladatszabályok, a mérés menete és az alakzatgenerátor forrásmegjelölése angolul és magyarul a [TEST_DESCRIPTION.md](TEST_DESCRIPTION.md#magyar) fájlban olvasható.

### Helyi futtatás

Node.js 22 vagy újabb használatával nyiss terminált **ebben a mappában**:

```sh
npm start
```

Nyisd meg a **http://localhost:8080** címet. Az `npm install` nem szükséges. Másik portot a `PORT` környezeti változóval adhatsz meg.

Alternatívaként Pythonnal is kiszolgálhatod ezt a mappát:

```sh
python -m http.server 8080
```

HTTP-kiszolgálót használj; az `index.html` közvetlen, `file://` URL-ként történő megnyitása nem támogatja az itt használt JavaScript-modulok és állományok betöltését.

A kezelőfelület angolul és magyarul érhető el.

### Egy mérés elvégzése

1. Válaszd ki a korcsoportot és az angol vagy magyar nyelvet. Résztvevői azonosítót nem kér a program.
2. Töltsd be a tesztet, majd használd a teljes képernyős indítógombot.
3. Válassz kognitív flexibilitási vagy gátlási feladatot, majd a **Test / Teszt** gombbal indítsd a visszaszámlálást. Végezd el a kívánt feladatcsoportot vagy mindkettőt.
4. Használd a teszt **Save data / Adatok mentése** gombját. A CSV automatikusan letöltődik; az eredményképernyőről ugyanaz a fájl ismét letölthető.
5. Másik résztvevőhöz válaszd a **New session / Új mérés** lehetőséget.

A korcsoport az eredeti megvalósítással azonos feladathosszakat választja ki: az A és B feladat 12 éves kor alatt 15, 12 éves kortól 25 pontos; a külön gátlási alapmérés, valamint C és D 15 pontos. Egy korábban befejezett A eredmény az eredeti szabályok szerint gátlási alapértékként is használható. Az önálló változat űrlapja születési dátum helyett korcsoportot kér.

### Nyers CSV

A CSV az alábbiakat tartalmazza:

- A végső nyers feladatidőket, hibaszámlálókat és az eredeti részletes hibarekordokat.
- Minden mérési próbálkozást, az újrakezdett és félbehagyott próbálkozásokat is.
- Minden generált pont feliratát, logikai helyzetét és sugarát, a ténylegesen előírt sorrendben.
- A feladatpontokon és a feladatmező üres hátterén végzett minden lenyomást.
- A várt és választott pontokat, a helyességet, a hibába történő beszámítást, a kattintás koordinátáit, az eltelt időt és a megjelenítési terület méretét.
- A mérés automatikusan generált azonosítóját, a nyelvet, a korcsoportot, az időbélyegeket és a nyers alapmérési metaadatokat.

A menüműveletek nem kerülnek a naplóba. Az eredeti mérési időzítés változatlan. A `retained` jelző megkülönbözteti a megőrzött eredményű próbálkozást egy korábbi, újrakezdéssel törölt eredményű próbálkozástól; a részletek a [DATA_FORMAT.md](DATA_FORMAT.md#magyar) fájlban találhatók.

Az adatok a letöltésig a memóriában maradnak. Nincs feltöltés, analitika, böngészős tartós tárolás vagy szerveroldali eredménygyűjtés. Az oldal újratöltése vagy bezárása elveszíti a még le nem töltött mérést. A csomag nem számít T-értékeket vagy más normaértékeket.

### A mappa közzététele

Másold **ennek a mappának a teljes tartalmát** az új nyilvános repository gyökerébe. A Phaser futtatókörnyezete a csomag része. Minden import relatív URL-t használ, így az alkalmazás repository-útvonal alatt is futtatható statikus tárhelyen, például GitHub Pagesen. A `.nojekyll`, `src/` és `vendor/` maradjon együtt az `index.html`, a licenc és a dokumentáció fájljaival.

A program minden vizuális elemet maga rajzol. A hibás választásokhoz Web Audio segítségével rövid hangot állít elő; kép-, videó- és hangfájlokra nincs szükség.

A mappa `.gitignore` fájlja kizárja a letöltött CSV-ket a verziókövetésből.

### Tesztek

```sh
npm test
```

A tesztek a Node.js beépített tesztfuttatóját használják, függőségek telepítése nélkül.

### Forrás és külső összetevők

A teszt és a közös futtatási segédfüggvények az AdaPsyd projektből származnak. Az önálló változat közvetlenül választ korcsoportot, rögzíti a mérési eseményeket, CSV-t exportál, és szintetizálja a hibajelző hangot. Az eredeti alkalmazás fájljai ettől a mappától külön találhatók.

Az alakzatgeneráló algoritmus [Kelvin Au Random-Irregular-Polygon könyvtárából](https://github.com/kelvinau/Random-Irregular-Polygon) származik, feladatspecifikus koordinátahatárokkal és minimális ponttávolság-ellenőrzéssel kiegészítve. MIT-licence a [vendor/random-irregular-polygon/LICENSE.md](vendor/random-irregular-polygon/LICENSE.md) fájlban szerepel.

A mellékelt Phaser futtatókörnyezet MIT-licencű; licence a [vendor/phaser/LICENSE.md](vendor/phaser/LICENSE.md) fájlban található. További forrásmegjelölések: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md#magyar).

### Licenc és kötelező szerzői megjelölés

A teszt saját forráskódja és dokumentációja [MIT-licenc](LICENSE) alatt érhető el. Használata, módosítása és továbbadása kereskedelmi célra is engedélyezett, ha a szerzői jogi közleményt és a licencszöveget megőrzik a másolatokban vagy a szoftver lényegi részeinek átvételekor.

**Kötelező szerzői megjelölés: Fecht Szilárd Dávid — fecht@inf.elte.hu.** Őrizd meg a forrás szerzői jogi fejléceit, és továbbadáskor mellékeld a `LICENSE` fájlt. A külön megjelölt Phaser és Random-Irregular-Polygon összetevők saját szerzői megjelölése és MIT-licencközleménye szintén megőrzendő.

### Hivatkozás a szoftverre

A tesztet használó cikkben vagy más kutatási közleményben másold az alábbi bejegyzést a projekt `.bib` fájljába, például a `references.bib` fájlba. Ugyanez a bejegyzés külön fájlként is elérhető: [CITATION.bib](CITATION.bib).

```bibtex
@misc{fecht2026trailmaking,
  author       = {Fecht, Szil{\'a}rd D{\'a}vid},
  title        = {{Trail Making -- AdaPsyd standalone}},
  year         = {2026},
  howpublished = {\url{https://github.com/SDFecht/trailmaking}},
  note         = {Computer software, version 1.0.0}
}
```

A szövegben így hivatkozz rá:

```latex
\cite{fecht2026trailmaking}
```

Ha a dokumentum bibliográfiája már be van állítva, használd a meglévő stílust és konfigurációt. Egy egyszerű LaTeX + BibTeX beállításhoz töltsd be az URL-csomagot a preambulumban:

```latex
\usepackage{url}
```

Ezután a `\end{document}` elé kerüljön:

```latex
\bibliographystyle{plain}
\bibliography{references}
```

Ha a mellékelt fájlt közvetlenül használod, és nem másolod a bejegyzést a `references.bib` fájlba, akkor `\bibliography{CITATION}` szükséges. A fordítás sorrendje: LaTeX, BibTeX, LaTeX, majd ismét LaTeX; vagy használd a szerkesztő automatikus bibliográfia-fordítását.

Ha a dokumentum `biblatex` csomagot használ, a preambulumban a `\addbibresource{references.bib}` tölti be a fájlt, a bibliográfia helyén pedig a `\printbibliography` jeleníti meg a hivatkozásjegyzéket; a szövegbeli parancs ugyanúgy `\cite{fecht2026trailmaking}`.

Ez a bejegyzés Fecht Szilárd Dávid tesztprogramjára hivatkozik. Az alakzatgenerátor külön szerzői megjelölése a [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md#magyar) fájlban marad meg.
