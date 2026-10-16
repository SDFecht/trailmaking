# CSV format / CSV-formátum

[English](#english) | [Magyar](#magyar)

## English

Encoding: UTF-8 with a BOM for spreadsheet compatibility. Separator: comma. Line ending: CRLF. Quotes, commas and line breaks inside text are escaped using CSV double-quote rules. Text beginning with a spreadsheet formula prefix (`=`, `+`, `-`, `@`, including after whitespace) receives a leading apostrophe; numeric values are exported as numbers.

Export schema: `trail-making-csv-v3`. The original game schema is preserved separately in `game_schema_version`.

### Row types

| `record_type` | Meaning |
| --- | --- |
| `session` | One session metadata row. |
| `task` | Five rows with the original final raw values: A, B, inhibition_baseline_15, C and D. A zero task time has the original meaning: no retained completed result. |
| `error` | Detailed error rows from the original final `records.errorRows` array. |
| `attempt` | One row for every started measurement field, including incomplete or restarted attempts. |
| `node` | The ordered point layout for an attempt. |
| `click` | A node or background press within a measurement field. |

The same error can appear in a `click` row and an `error` row. **Do not add those row types together.** Filter `record_type == "click"` to analyze the event log, or use `task` and `error` to reproduce the original raw result.

### Shared metadata

`session_id` is an automatically generated UUID for each measurement session. It identifies the session, not the participant; every row in that session's CSV shares this value. No participant identifier is requested or exported. `language` is `hu` or `en`; `age_group` is `child` (below 12) or `adult` (12 and older). `is_for_children` preserves the raw boolean used by the test. Date-time columns contain ISO 8601 UTC timestamps from the client computer.

`session_started_at` is when the test is loaded. `submitted_at` is when Save is pressed. Neither is the start of an individual timed task. `exported_at` is when the CSV is constructed.

`completed_section`, `baseline_source`, `baseline_raw_ms` and `baseline_superseded` preserve the game's own completion and baseline fields. A completed A result can supersede a separately measured inhibition baseline. An A result can also be copied to the raw inhibition baseline during a cognitive-group restart, following the original game behavior.

### Attempts and retained results

`attempt_id` is unique within the session; `task_attempt` counts measurement attempts for that task. `attempt_started_at` is when its field is created. `completed` indicates that all required nodes were selected. `retained` indicates that a measurement's task result has not subsequently been cleared by the game's restart rules. Incomplete attempts have `retained = false`.

Layouts and clicks from old attempts remain in the export even after their final task time and error rows have been reset. The final `task` rows remain the authoritative snapshot of the original game's raw result. If the game preserves an old A time as the inhibition baseline during a restart, the original A attempt remains in the log even though the A result itself has been cleared.

### Points and coordinates

`point_index`, `expected_index` and `selected_index` are **zero-based**. Their labels are in `point_label`, `expected_label` and `selected_label`. Point order is the required selection order; in D, the displayed numbers do not define the required order.

Node `x`, `y` and `radius` use the game's **1024 × 672 logical coordinate system**. Click `x` and `y` are transformed back into that same coordinate system. They can fall outside the logical field when the display has margins. `stage_width` and `stage_height` record the Phaser stage dimensions at the click.

### Clicks and time

`sequence_number` is one-based within an attempt. `click_target` is `node` or `background`. `click_phase` is `measurement` or `after_completion` (the time after the last correct node and before leaving the field).

During measurement, a node press has `correct = true` or `false`. A wrong node also has `counted_as_error = true`. Background presses and presses after completion are logged without changing the game's error counters; their `correct` value is empty. This logging does not add any new debounce or change the original click handling.

`elapsed_ms` uses the same task clock as the original error recording: time since the countdown ends. `time_ms` on a measurement attempt is the original task duration at the final correct node. Waiting for the Done button is excluded from the attempt duration. Clicks after completion can have larger elapsed times.

`error_number`, `task_error_number`, `step_number`, `expected_index`, `selected_index`, labels and `elapsed_ms` on `error` rows directly map to the corresponding original raw error fields. Error numbers and step numbers are one-based.

---

## Magyar

Kódolás: UTF-8, a táblázatkezelőkkel való kompatibilitást segítő BOM-mal. Elválasztó: vessző. Sorvég: CRLF. A szövegen belüli idézőjelek, vesszők és sortörések a CSV idézőjeles szabályai szerint kerülnek a fájlba. A táblázatkezelők képletkezdő karaktereivel (`=`, `+`, `-`, `@`, akár szóközök után) kezdődő szöveg elé aposztróf kerül; a számértékek számként exportálódnak.

Exportséma: `trail-making-csv-v3`. Az eredeti játékséma külön, a `game_schema_version` mezőben marad meg.

### Sortípusok

| `record_type` | Jelentés |
| --- | --- |
| `session` | Egy sor a mérés metaadataival. |
| `task` | Öt sor az eredeti végső nyers értékekkel: A, B, inhibition_baseline_15, C és D. A nulla feladatidő eredeti jelentése: nincs megőrzött, befejezett eredmény. |
| `error` | Az eredeti végső `records.errorRows` tömb részletes hibasorai. |
| `attempt` | Egy sor minden elindított mérési pályához, a befejezetlen és újrakezdett próbálkozásokat is beleértve. |
| `node` | Egy próbálkozás pontelrendezése, a szükséges sorrendben. |
| `click` | Egy ponton vagy a háttéren végzett lenyomás a mérési pályán. |

Ugyanaz a hiba egy `click` és egy `error` sorban is megjelenhet. **A két sortípust ne add össze.** Az eseménynapló elemzéséhez szűrj a `record_type == "click"` sorokra, az eredeti nyers eredmény visszaállításához pedig a `task` és `error` sorokat használd.

### Közös metaadatok

A `session_id` minden méréshez automatikusan generált UUID. A mérést azonosítja, nem a résztvevőt; az adott mérés CSV-jének minden sora ugyanazt az értéket tartalmazza. A program résztvevői azonosítót nem kér és nem exportál. A `language` értéke `hu` vagy `en`; az `age_group` értéke `child` (12 éves kor alatt) vagy `adult` (12 éves kortól). Az `is_for_children` a tesztben használt eredeti logikai értéket őrzi meg. A dátumot és időt tartalmazó oszlopok a kliensgép órájából származó, ISO 8601 formátumú UTC-időbélyegeket tartalmaznak.

A `session_started_at` a teszt betöltésének időpontja. A `submitted_at` a mentés megnyomásának időpontja. Egyik sem az adott időméréses feladat kezdete. Az `exported_at` a CSV előállításának időpontja.

A `completed_section`, `baseline_source`, `baseline_raw_ms` és `baseline_superseded` a játék saját befejezési és alapmérési mezőit őrzi meg. Egy befejezett A eredmény elsőbbséget kaphat a külön mért gátlási alapértékkel szemben. A kognitív feladatcsoport újrakezdésekor az A eredmény át is másolódhat a nyers gátlási alapmérésbe, az eredeti játék működésének megfelelően.

### Próbálkozások és megőrzött eredmények

Az `attempt_id` a mérésen belül egyedi; a `task_attempt` az adott feladat mérési próbálkozásait számlálja. Az `attempt_started_at` a pálya létrehozásának időpontja. A `completed` azt jelzi, hogy minden szükséges pontot kiválasztottak-e. A `retained` azt jelzi, hogy a mérési próbálkozás feladateredményét a játék újrakezdési szabályai később törölték-e. A befejezetlen próbálkozásoknál `retained = false`.

A korábbi próbálkozások pályái és kattintásai akkor is az exportban maradnak, ha a végső feladatidejüket és hibasoraikat már visszaállították. Az eredeti játék végső nyers eredményének irányadó pillanatképét a `task` sorok adják. Ha a játék újrakezdéskor egy korábbi A időeredményt gátlási alapértékként megőriz, az eredeti A próbálkozás a naplóban marad akkor is, ha magát az A feladateredményt törölték.

### Pontok és koordináták

A `point_index`, `expected_index` és `selected_index` **nullától számozott** indexek. A hozzájuk tartozó feliratok a `point_label`, `expected_label` és `selected_label` mezőkben találhatók. A pontok sorrendje a szükséges kiválasztási sorrend; a D feladatban ezt nem a megjelenített számok határozzák meg.

A pontok `x`, `y` és `radius` értékei a játék **1024 × 672 méretű logikai koordinátarendszerét** használják. A kattintások `x` és `y` koordinátái ugyanebbe a koordinátarendszerbe vannak visszatranszformálva. Ha a megjelenítés mellett margók vannak, a logikai pályán kívülre is eshetnek. A `stage_width` és `stage_height` a Phaser megjelenítési területének kattintáskori méretét rögzíti.

### Kattintások és idő

A `sequence_number` a próbálkozáson belül egytől számozott. A `click_target` értéke `node` (pont) vagy `background` (háttér). A `click_phase` értéke `measurement` (mérés) vagy `after_completion` (az utolsó helyes pont és a pálya elhagyása közötti szakasz).

Mérés közben egy ponton végzett lenyomásnál a `correct` értéke `true` vagy `false`. Hibás pontnál a `counted_as_error` is `true`. A háttérkattintások és a befejezés utáni kattintások a játék hibaszámlálóinak módosítása nélkül kerülnek a naplóba; a `correct` mezőjük üres. Ez a naplózás nem vezet be új kattintásszűrést, és nem változtatja meg az eredeti kattintáskezelést.

Az `elapsed_ms` ugyanazt a feladatórát használja, mint az eredeti hibarögzítés: a visszaszámlálás végétől eltelt időt. Egy mérési próbálkozás `time_ms` értéke az utolsó helyes pontnál rögzített eredeti feladatidő. A **Vége** gombra várakozás nem része a próbálkozás időtartamának. A befejezés utáni kattintások eltelt ideje ennél nagyobb is lehet.

Az `error` sorok `error_number`, `task_error_number`, `step_number`, `expected_index`, `selected_index`, felirat- és `elapsed_ms` mezői közvetlenül a megfelelő eredeti nyers hibamezőknek felelnek meg. A hibák és lépések számozása egytől indul.
