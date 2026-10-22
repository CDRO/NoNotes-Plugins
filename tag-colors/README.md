# Farben über Tags

Erweiterung für [NoNotes](https://github.com/cdro/nonotes): färbt Knoten der Mindmap über ein Tag an der Notiz.
Die Fläche wird heller, die Umrandung dunkler, und der Titel steht in der Farbe der Umrandung. Im dunklen Modus des
Systems ist es umgekehrt: dunkle Fläche, helle Umrandung und heller Titel.

## Benutzen

- Ein Tag an der Notiz setzen, zum Beispiel `farbe:rot` oder englisch `color:red`. Gross-/Kleinschreibung ist egal,
  `farbe:grün` und `farbe:gruen` gehen beide.
- **Unternotizen mitfärben:** zusätzlich `farbe:auch-kinder` (`color:with-children`) an derselben Notiz. Dann gilt die
  Farbe für alle Unternotizen. Eine Unternotiz mit eigener Farbe behält sie; hat auch sie `auch-kinder`, gilt ihre Farbe
  für ihren Teil des Baums.
- Mehrere Farb-Tags an einer Notiz: Es gilt das erste in der Reihenfolge, in der der Editor die Tags zeigt.
- **Per Rechtsklick** (ab NoNotes 2.8.0): Rechtsklick auf einen Knoten → **Farbe ▸**. Das Untermenü zeigt die 16 Farben
  als Felder, so gezeichnet wie ein gefärbter Knoten (Name als Tooltip, die aktuelle Farbe ist markiert):
  - Ein Klick auf ein Feld ersetzt die Farbe.
  - **Keine Farbe** entfernt Farbe und Weitergabe.
  - **Auch Unternotizen** schaltet die Weitergabe sofort an oder ab; das Untermenü bleibt offen.
  - Gehört der Knoten zur Mehrfachauswahl (`Ctrl`+Klick), gilt alles für alle ausgewählten Knoten. Ein halb gefülltes
    Häkchen heisst, dass nur ein Teil davon die Farbe weitergibt. Schliesst sich das Menü nach einer Änderung, ist die
    Auswahl aufgehoben (ab NoNotes 2.8.1); wer mit `Esc` abbricht, behält sie.
  - Die Tags werden in der Sprache der Oberfläche geschrieben (`farbe:rot` oder `color:red`).
  - Im Lesemodus und an archivierten Notizen gibt es den Eintrag nicht.
  - Ältere NoNotes-Versionen färben weiter über Tags, nur ohne den Eintrag.
- Die Auswahl in der Mindmap zeigt weiterhin ihren Rand; die Fläche behält die Farbe. Suche, Ziehen und Mehrfachauswahl
  sehen aus wie immer.
- Nur auf dem Bildschirm: Export und Druck zeichnen die Mindmap ohne diese Farben. Die Wurzel bleibt in der Hauptfarbe.

## Die 16 Farben

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
`ctx.ui.addContextMenuItem` (NoNotes ab 2.8.0).

## Anpassen

Oben in `tag-colors.js` steht die Liste `FARBEN`: pro Farbe der Name im Tag (`id`, ohne Umlaute; `en` für Englisch), der
Anzeigename und je für `light` und `dark` die Flächenfarbe (`fill`) und die Farbe von Umrandung und Titel (`line`).
`VORSILBEN` legt fest, was vor dem Doppelpunkt stehen darf, `AUCH_KINDER` den Wert für das Mitfärben der Unternotizen.
Änderungen wirken nach dem Neuladen der Seite.

## Wie es funktioniert

Nach jedem Zeichnen der Mindmap färbt die Erweiterung sofort mit dem letzten bekannten Stand und liest dann die Tags neu:
einmal die Liste aller Tags, danach für jedes benutzte Farb-Tag die Notizen damit. Das sind wenige Abfragen, unabhängig
von der Zahl der Knoten, auch wenn die Daten auf einem Server liegen. Die Farben kommen als Klassen an die Knoten
(`tf-rot` …) und aus einem eigenen Stylesheet. Beim Ausschalten verschwinden beide sofort.

## Test

`NONOTES_CORE=../NoNotes node .test/tag-colors.cjs` baut NoNotes mit diesem Repository und prüft die Erweiterung im
Browser:
- Farbtabelle und Kontraste;
- Tags in beiden Sprachen;
- Weitergabe an Unternotizen;
- Auswahl;
- hell und dunkel;
- Neuladen;
- Aus- und Einschalten zur Laufzeit;
- Rechtsklick: Farbwahl, «Keine Farbe», «Auch Unternotizen», Mehrfachauswahl, englische Oberfläche;
- Hilfe.

Der Kern braucht `npm install` und Playwright mit Chromium. Der Ordner `.test/` geht nicht ins Paket.
