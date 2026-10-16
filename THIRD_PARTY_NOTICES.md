# Third-party notices / Külső összetevők forrásmegjelölése

[English](#english) | [Magyar](#magyar)

## English

### Phaser 4.2.1

The file `vendor/phaser/phaser.esm.min.js` is the unmodified Phaser 4.2.1 ES module distribution copied from the installed `phaser` package.

- Project: https://phaser.io/
- Source: https://github.com/phaserjs/phaser
- License: MIT, reproduced in `vendor/phaser/LICENSE.md`.

### Random-Irregular-Polygon

The `Point` and `RIP` classes embedded in `src/games/trail.phaser4.js` originate from **Kelvin Au's Random-Irregular-Polygon**. Its polygon-generation, space-partitioning and point-ordering procedures were copied into the test; they are not an original algorithm by the test software author.

- Project: [kelvinau/Random-Irregular-Polygon](https://github.com/kelvinau/Random-Irregular-Polygon).
- Author and copyright: Kelvin Au; Copyright (c) 2017 Kelvin Au.
- Reference source inspected for this notice: [`src/random-irregular-polygon.js` at `ccff28233f637084559d69da43073be965d4ba57`](https://github.com/kelvinau/Random-Irregular-Polygon/blob/ccff28233f637084559d69da43073be965d4ba57/src/random-irregular-polygon.js). This identifies the comparison source, not the historical import revision, which is not recorded locally.
- License: MIT, reproduced in [vendor/random-irregular-polygon/LICENSE.md](vendor/random-irregular-polygon/LICENSE.md).

The integrated version adds separate horizontal/vertical coordinate limits and minimum point-distance checks, and adapts module placement and formatting for the test. It is therefore an adapted copy of the library rather than a byte-for-byte copy of the upstream source file.

The upstream README attributes the algorithm to Thomas Auer and Martin Held's *Heuristics for the Generation of Random Polygons*; the paper is included in the upstream repository's `paper/` directory.

### Test implementation

The AdaPsyd Trail Making test software was created by **Fecht Szilárd Dávid**, [fecht@inf.elte.hu](mailto:fecht@inf.elte.hu). The third-party components credited above retain their respective authorship and licenses.

The test implementation and runtime helpers originate from the AdaPsyd project. The test's own source code and documentation are released under the [MIT License](LICENSE), with the required copyright notice **Copyright (c) 2026 Fecht Szilárd Dávid <fecht@inf.elte.hu>**. Preserve that notice and the license text when copying or redistributing the software or substantial portions of it.

The package contains no image, video or audio recordings. Error feedback is generated programmatically using Web Audio. No application database, application credentials or participant datasets are part of this package.

---

## Magyar

### Phaser 4.2.1

A `vendor/phaser/phaser.esm.min.js` fájl a telepített `phaser` csomagból másolt, változatlan Phaser 4.2.1 ES-modulos futtatókörnyezet.

- Projekt: https://phaser.io/
- Forrás: https://github.com/phaserjs/phaser
- Licenc: MIT; szövege a `vendor/phaser/LICENSE.md` fájlban található.

### Random-Irregular-Polygon

A `src/games/trail.phaser4.js` fájlba beépített `Point` és `RIP` osztályok **Kelvin Au Random-Irregular-Polygon könyvtárából** származnak. Az alakzatgeneráló, térfelosztó és pontrendező eljárások onnan kerültek a tesztbe; ezek nem a tesztprogram készítőjének saját algoritmusai.

- Projekt: [kelvinau/Random-Irregular-Polygon](https://github.com/kelvinau/Random-Irregular-Polygon).
- Szerző és szerzői jogi megjelölés: Kelvin Au; Copyright (c) 2017 Kelvin Au.
- A forrásmegjelöléshez ellenőrzött változat: [`src/random-irregular-polygon.js`, `ccff28233f637084559d69da43073be965d4ba57`](https://github.com/kelvinau/Random-Irregular-Polygon/blob/ccff28233f637084559d69da43073be965d4ba57/src/random-irregular-polygon.js). Ez az összehasonlítás forrását jelöli, nem az eredeti átvétel változatát, amely helyben nincs rögzítve.
- Licenc: MIT; szövege a [vendor/random-irregular-polygon/LICENSE.md](vendor/random-irregular-polygon/LICENSE.md) fájlban található.

A beépített változat külön vízszintes és függőleges koordinátahatárokkal, valamint minimális ponttávolság-ellenőrzéssel egészíti ki a könyvtárat, és a teszthez igazítja a modul elhelyezését és formázását. Ezért az eredeti forrásfájl teszthez illesztett változata, nem annak bájtról bájtra azonos másolata.

Az eredeti README Thomas Auer és Martin Held *Heuristics for the Generation of Random Polygons* című munkáját jelöli meg az algoritmus forrásaként; a tanulmány az eredeti repository `paper/` mappájában található.

### A teszt megvalósítása

Az AdaPsyd Trail Making tesztprogram készítője **Fecht Szilárd Dávid**, [fecht@inf.elte.hu](mailto:fecht@inf.elte.hu). A fent megjelölt külső összetevők saját szerzői megjelölése és licence megmarad.

A teszt megvalósítása és futtatási segédfüggvényei az AdaPsyd projektből származnak. A teszt saját forráskódja és dokumentációja [MIT-licenc](LICENSE) alatt érhető el, az alábbi kötelező szerzői jogi megjelöléssel: **Copyright (c) 2026 Fecht Szilárd Dávid <fecht@inf.elte.hu>**. A szoftver vagy lényegi részei másolásakor és továbbadásakor ezt a közleményt és a licencszöveget meg kell őrizni.

A csomag nem tartalmaz kép-, videó- vagy hangfelvételeket. A hibajelzést a program Web Audio segítségével állítja elő. Alkalmazás-adatbázis, alkalmazás-hitelesítési adatok és résztvevői adatkészletek nem részei a csomagnak.
