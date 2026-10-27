# Farben über Tags

Erweiterung für [NoNotes](https://github.com/cdro/nonotes): färbt Knoten der Mindmap über ein Tag an der Notiz.
Die Fläche wird heller, die Umrandung dunkler, und der Titel steht in der Farbe der Umrandung. Im dunklen Modus des
Systems ist es umgekehrt: dunkle Fläche, helle Umrandung und heller Titel.

## Benutzen

- Ein Tag an der Notiz setzen, zum Beispiel `farbe:rot` oder englisch `color:red`. Gross-/Kleinschreibung ist egal,
  `farbe:grün` und `farbe:gruen` gehen beide.
- **Unternotizen färben:** `farbe-kinder:blau` (englisch `color-children:blue`) färbt alle Unternotizen, die Notiz
  selbst nicht:
  - `farbe:rot` und `farbe-kinder:blau` zusammen: die Notiz ist rot, alles darunter blau.
  - Für dieselbe Farbe setzt man beide Tags mit derselben Farbe.
  - Eine Unternotiz mit eigener Farbe behält sie.
  - Hat eine Unternotiz selbst ein `farbe-kinder:`, gilt das für ihren Teil des Baums.
- Mehrere Farb-Tags derselben Art an einer Notiz: Es gilt das erste in der Reihenfolge, in der der Editor die Tags zeigt.
- **Schraffiert** (seit 2.1.0): `+schraffiert` am Farb-Tag, etwa `farbe:rot+schraffiert` oder
  `farbe-kinder:blau+schraffiert` (englisch `color:red+hatched`), hebt einen Knoten hervor:
  - Die Fläche bekommt diagonale Streifen, 4 px breit bei Zoom 100 %. Sie wachsen und schrumpfen mit dem Zoom.
  - Die Streifen wechseln zwischen der Farbe und einer helleren Fassung davon. Diese wird aus der Farbe berechnet: hell
    zum Weiss hin, dunkel zur Linienfarbe hin.
  - Der Titel behält auf beiden Streifen mindestens 4.5:1 Kontrast.
  - Ein unbekannter Zusatz nach `+` zählt nicht; die Farbe gilt trotzdem.
- **Umstieg von 1.x:** `farbe:auch-kinder` (`color:with-children`) wird nicht mehr ausgewertet. Statt `farbe:rot` mit
  `farbe:auch-kinder` schreibt man `farbe:rot` und `farbe-kinder:rot`.
- **Per Rechtsklick** (ab NoNotes 2.8.0): Rechtsklick auf einen Knoten → **Farbe ▸**. Das Untermenü hat zwei Teile,
  oben **Notiz** (`farbe:`), unten **Unternotizen** (`farbe-kinder:`). Jeder zeigt die 16 Farben als Felder, so
  gezeichnet wie ein gefärbter Knoten (Name als Tooltip, die aktuelle Farbe ist markiert):
  - Ein Klick auf ein Feld ersetzt die Farbe dieses Teils und schliesst das Menü.
  - **Keine Farbe** entfernt nur das Tag dieses Teils.
  - **Schraffiert** schaltet die Schraffur dieses Teils sofort an oder ab; das Untermenü bleibt offen. Es geht nur, wenn
    dort eine Farbe gesetzt ist. Bei einer Mehrfachauswahl heisst ein halb gefülltes Häkchen «nur ein Teil davon».
  - Eine neue Farbe behält die Schraffur.
  - Gehört der Knoten zur Mehrfachauswahl (`Ctrl`+Klick), gilt alles für alle ausgewählten Knoten. Markiert ist eine
    Farbe nur, wenn alle sie haben. Schliesst sich das Menü nach einer Änderung, ist die Auswahl aufgehoben (ab NoNotes
    2.8.1); wer mit `Esc` abbricht, behält sie.
  - Die Tags werden in der Sprache der Oberfläche geschrieben (`farbe:rot` und `farbe-kinder:rot`, englisch `color:red`
    und `color-children:red`).
  - Im Lesemodus und an archivierten Notizen gibt es den Eintrag nicht.
  - Ältere NoNotes-Versionen färben weiter über Tags, nur ohne den Eintrag.
- Die Auswahl in der Mindmap zeigt weiterhin ihren Rand; die Fläche behält die Farbe. Suche, Ziehen und Mehrfachauswahl
  sehen aus wie immer.
- Nur auf dem Bildschirm: Export und Druck zeichnen die Mindmap ohne diese Farben. Die Wurzel bleibt in der Hauptfarbe.

## Legende (seit 2.2.0, NoNotes ab 2.11.0)

Was eine Farbe bedeutet, steht in der **Legende** über der Mindmap:

- Der Knopf **Legende** in der Leiste der Mindmap blendet sie ein oder aus. Ist sie noch leer, öffnet sie sich gleich zum
  Bearbeiten, mit einer Vorlage: je benutzte Farbe eine Zeile wie `- farbe:rot: …` (schraffierte mit `+schraffiert`).
- **Fehlende Farben ergänzen (seit 2.3.0):** Kommt später eine Farbe dazu, erscheint im Kopf der Legende der Knopf **+**. Er hängt
  für jede benutzte Farbe, die der Text noch nicht nennt, eine Zeile wie `- farbe:grün: …` ans Ende und öffnet die Legende zum
  Bearbeiten, die erste neue Bedeutung ausgewählt. Was schon dasteht (Reihenfolge, Texte, Farben, die gerade nicht benutzt
  werden), bleibt unberührt. Genannt ist eine Farbe, wenn ihr Tag irgendwo im Text steht (`farbe:` oder `farbe-kinder:`, mit
  oder ohne Schraffur getrennt gezählt). Im Lesemodus gibt es den Knopf nicht.
- **Bearbeiten:** ein Klick in die Legende zeigt den Text (Markdown). `Ctrl+B`, `Ctrl+I` und `Ctrl+K` setzen fett, kursiv und
  einen Link, eine Toolleiste gibt es nicht. `Esc` oder ein Klick daneben speichert; beim Tippen wird nach kurzer Pause
  gespeichert.
- **Farbfelder:** Farb-Tags im Text (`farbe:rot`, `farbe:blau+schraffiert`, `farbe-kinder:grün`, englisch `color:red` …)
  erscheinen als Farbfeld mit dem Namen der Farbe, schraffierte gestreift, die der Unternotizen gestrichelt umrandet. In Code
  (`` `farbe:rot` ``) bleibt der Text, wie er ist.
- **Lage:** Die Auswahl im Kopf setzt die Ecke (oben rechts, oben links, unten links, unten rechts), **–** klappt die Legende
  zu einem Knopf ein. Beides merkt sich der Browser; oben steht sie unter der Leiste der Mindmap.
- **Gespeichert** wird der Text in der Datenbank (Einstellung `plugin:tag-farben:legende`): er reist mit der Datei, und im Dienst
  sehen alle im Arbeitsbereich dieselbe Legende. Im Lesemodus lässt sie sich nicht bearbeiten; ist sie dann leer, fehlt der Knopf.
- **Export und Druck:** Im Markdown-Export (`index.md` bzw. die eine Datei) und im Druck mit Mindmap-Bild steht sie als Abschnitt
  «Legende» direkt unter dem Bild; die Farben erscheinen dort mit ihrem Namen.
- Ist die Erweiterung ausgeschaltet, bleibt der Text in der Datenbank, wird aber weder gezeigt noch exportiert.

## Die 16 Farben

Für die Unternotizen steht `farbe-kinder:` statt `farbe:` (englisch `color-children:` statt `color:`).

| Farbe | Tag | englisch |
| --- | --- | --- |
| Rot | `farbe:rot` | `color:red` |
| Orange | `farbe:orange` | `color:orange` |
| Bernstein | `farbe:bernstein` | `color:amber` |
| Gelb | `farbe:gelb` | `color:yellow` |
| Limette | `farbe:limette` | `color:lime` |
| Grün | `farbe:grün` | `color:green` |
| Smaragd | `farbe:smaragd` | `color:emerald` |
| Türkis | `farbe:türkis` | `color:teal` |
| Cyan | `farbe:cyan` | `color:cyan` |
| Himmelblau | `farbe:himmelblau` | `color:sky` |
| Blau | `farbe:blau` | `color:blue` |
| Indigo | `farbe:indigo` | `color:indigo` |
| Violett | `farbe:violett` | `color:violet` |
| Purpur | `farbe:purpur` | `color:purple` |
| Pink | `farbe:pink` | `color:pink` |
| Grau | `farbe:grau` | `color:gray` (oder `color:grey`) |

Jede Farbe hat eine helle und eine dunkle Fassung. Der Titel hat auf seiner Fläche in beiden einen Kontrast von
mindestens 5:1.

## Installieren

Im Paket «NoNotes with Plugins» liegt die Erweiterung schon im Ordner `plugins/`. Sie wird unter
*Datenbank → Erweiterungen…* eingeschaltet; die Wahl merkt sich der Browser.

Von Hand: den Ordner `tag-colors/` in den Ordner `plugins/` der App kopieren und im selben Dialog bei «Weitere Datei
laden» `tag-colors/tag-colors.js` eingeben. Soll sie immer laufen, trägt man sie in `plugins/plugins.js` ein:
`NoNotesPlugins.list(['tag-colors/tag-colors.js']);`.

Die Erweiterung braucht das Ereignis `mindmap:rendered` (NoNotes ab 1.8.0), für den Rechtsklick
`ctx.ui.addContextMenuItem` (NoNotes ab 2.8.0), für die Legende `ctx.ui.addMapOverlay`, `ctx.ui.addMapButton` und `ctx.export.addMapSection` (NoNotes ab 2.11.0).

## Anpassen

Oben in `tag-colors.js` steht die Liste `FARBEN`: pro Farbe der Name im Tag (`id`, ohne Umlaute; `en` für Englisch), der
Anzeigename und je für `light` und `dark` die Flächenfarbe (`fill`) und die Farbe von Umrandung und Titel (`line`).
`VORSILBEN` legt fest, was vor dem Doppelpunkt stehen darf, `VORSILBEN_KINDER` dasselbe für die Farbe der Unternotizen.
`MUSTER` nennt die Zusätze nach `+` (heute `schraffiert`/`hatched`), `STREIFEN` die Breite eines Streifens in Pixeln.
Änderungen wirken nach dem Neuladen der Seite.

## Wie es funktioniert

Nach jedem Zeichnen der Mindmap färbt die Erweiterung sofort mit dem letzten bekannten Stand und liest dann die Tags neu:
einmal die Liste aller Tags, danach für jedes benutzte Farb-Tag die Notizen damit. Das sind wenige Abfragen, unabhängig
von der Zahl der Knoten, auch wenn die Daten auf einem Server liegen. Die Farben kommen als Klassen an die Knoten
(`tf-rot` …, dazu `tf-schraffiert`) und aus einem eigenen Stylesheet. Die Schraffur ist ein SVG-Muster je Farbe (hell und
dunkel) im `<defs>` der Mindmap, in Einheiten der Karte, darum wächst sie mit dem Zoom. Beim Ausschalten verschwinden
Klassen, Stylesheet und Muster sofort.

## Test

`NONOTES_CORE=../NoNotes node .test/tag-colors.cjs` baut NoNotes mit diesem Repository und prüft die Erweiterung im
Browser:
- Farbtabelle und Kontraste;
- Tags in beiden Sprachen;
- Farbe der Unternotizen, auch eine andere als die der Notiz;
- Schraffur: Streifenfarben (heller, sichtbar, Titel 4.5:1), Muster in der Karte, hell und dunkel, Rechtsklick;
- Auswahl;
- hell und dunkel;
- Neuladen;
- Aus- und Einschalten zur Laufzeit;
- Rechtsklick: Farbwahl für Notiz und Unternotizen, «Keine Farbe», Mehrfachauswahl, englische Oberfläche;
- Legende: Knopf, Vorlage, Ctrl+B, Speichern, Farbfelder, Ecke, einklappen, Neuladen, Druck;
- Hilfe.

Der Kern braucht `npm install` und Playwright mit Chromium. Der Ordner `.test/` geht nicht ins Paket.
