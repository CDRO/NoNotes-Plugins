# Tabellen formatieren

Erweiterung für [NoNotes](https://github.com/cdro/nonotes) ab 2.10.0: formatiert Tabellen in der Vorschau, mit Farbe, Fett,
Spaltenbreite, Zeilenhöhe und ganzer Breite.

## Benutzen

Rechtsklick auf ein Feld einer Tabelle in der Vorschau → **Formatieren ▸**. Das Untermenü hat zwei Teile:

- **Gilt für** Feld, Zeile oder Spalte des angeklickten Felds (in der Titelzeile heisst die Zeile «Titelzeile»):
  - **Farbe**: eine der 9 Farben oder **Keine** (das Feld mit dem roten Strich).
  - **Fett**.
  - Gilt mehreres für ein Feld, gewinnt das Feld vor der Zeile vor der Spalte. Die Farben gehen auch der Hervorhebung des
    Kerns (*Titel hervorheben*) vor.
- Für die Tabelle:
  - **Spaltenbreite** der angeklickten Spalte: Auto, Schmal (6em), Mittel (12em), Breit (20em). Längerer Inhalt kann eine
    Spalte breiter machen.
  - **Zeilenhöhe** der angeklickten Zeile: Auto, Hoch, Sehr hoch.
  - **Ganze Breite**: die Tabelle geht über die ganze Vorschau.

Jede Wahl wirkt sofort, das Untermenü bleibt offen; `Esc` oder ein Klick daneben schliesst es. Im Lesemodus gibt es den
Eintrag nicht, ebenso für Tabellen in Zitaten und Blöcken.

- Farben: Gelb, Orange, Rot, Pink, Violett, Blau, Türkis, Grün, Grau. Der Text bleibt in der Textfarbe der App und hat
  auf jeder Farbe mindestens 7:1 Kontrast, hell wie dunkel.
- Im dunklen Modus des Systems sind die Flächen dunkel. Gedruckt sind sie immer hell, auch bei dunkler Einstellung.
- Werden Zeilen oder Spalten eingefügt oder gelöscht (Rechtsklick, `Enter` im Text) oder die Titelzeile aus- und
  angeschaltet, behalten die übrigen ihr Format.

## Wo das Format steht

In der Zeile über der Tabelle, die NoNotes für das Format der Tabelle führt, unter der Kennung `table-format`:

```markdown
<!-- tabelle: {"kopfspalte":true,"table-format":{"voll":true,"cols":{"0":{"breite":"schmal"}},"rows":{"h":{"farbe":"blau"},"2":{"fett":true}},"cells":{"1,1":{"farbe":"rot"}}}} -->
| Phase   | Start  | Ende   |
| ------- | ------ | ------ |
| Analyse | 01.11. | 15.11. |
```

- `cols` je Spalte (ab 0): `breite`, `farbe`, `fett`.
- `rows` je Zeile (ab 0, `h` = Titelzeile): `hoehe`, `farbe`, `fett`.
- `cells` je Feld (`Zeile,Spalte`): `farbe`, `fett`.
- `voll`: ganze Breite.

Andere Markdown-Programme blenden die Zeile aus und zeigen die Tabelle ohne dieses Format. Ist die Erweiterung
ausgeschaltet, bleibt das Format im Text und wirkt wieder, sobald sie eingeschaltet ist.

## Sprachen (seit 1.1.0)

Name, Beschreibung, Hilfe und Beschriftungen gibt es in den neun Sprachen von NoNotes: Deutsch (Schweiz und Deutschland),
Englisch, Französisch, Italienisch, Spanisch (Spanien und Mexiko), Portugiesisch (Portugal und Brasilien). Die Erweiterung
nimmt die Sprache der Oberfläche (`ctx.language()`), sonst die Sprache ohne Region, sonst Englisch. Name und Beschreibung im
Dialog *Erweiterungen…* folgen der Sprache ab NoNotes 3.1.1; ältere Versionen zeigen dort die deutschen.

Das Format in der Notiz (`<!-- tabelle: … -->`) bleibt in jeder Sprache gleich; übersetzt sind nur die Namen im Menü.

Die Texte stehen oben in der Datei in einer Tabelle (Deutsch und Englisch von Hand, die übrigen aus `.l10n/table-format/<sprache>.json`,
eingesetzt mit `node .l10n/apply.cjs`).

## Installieren

Im Paket «NoNotes with Plugins» liegt die Erweiterung schon im Ordner `plugins/`. Sie wird unter
*Datenbank → Erweiterungen…* eingeschaltet; die Wahl merkt sich der Browser.

Von Hand: den Ordner `table-format/` in den Ordner `plugins/` der App kopieren und im selben Dialog bei «Weitere Datei
laden» `table-format/table-format.js` eingeben. Soll sie immer laufen, trägt man sie in `plugins/plugins.js` ein:
`NoNotesPlugins.list(['table-format/table-format.js']);`.

Die Erweiterung braucht `ctx.tables` und `ctx.ui.addTableMenuItem` (NoNotes ab 2.10.0). Ältere Versionen melden in der
Konsole, dass sie fehlen; sonst passiert nichts.

## Anpassen

Oben in `table-format.js` stehen die Listen `TBF_FARBEN` (Kennung, Name deutsch und englisch, Fläche hell und dunkel),
`TBF_BREITEN` und `TBF_HOEHEN` (Kennung, Namen, CSS-Wert). Gespeichert wird die Kennung; wer einen Wert ändert, ändert ihn
für alle Tabellen. Änderungen wirken nach dem Neuladen der Seite.

## Wie es funktioniert

`ctx.tables.format` bekommt für jede Tabelle das Format und die Grösse. Die Erweiterung rechnet daraus je Feld die
wirksame Farbe (Feld vor Zeile vor Spalte) und gibt sie als Klasse `tbf-<farbe>` zurück, Fett, Breite und Höhe als Werte.
Die Farben kommen aus einem eigenen Stylesheet, mit den dunklen Flächen in `@media screen and (prefers-color-scheme: dark)`.
Das Untermenü schreibt über `ctx.tables.update`, NoNotes richtet die Tabelle aus, speichert und zeichnet die Vorschau neu.
Beim Ausschalten verschwinden Stylesheet, Eintrag und Angaben sofort.

## Test

`NONOTES_CORE=../NoNotes node .test/table-format.cjs` baut NoNotes mit diesem Repository und prüft die Erweiterung im
Browser:
- reine Funktionen (Reihenfolge, Unbekanntes, leere Angaben);
- Paket;
- Untermenü für Feld, Zeile und Spalte, Fett, Breite, Höhe, ganze Breite;
- Mitwandern beim Einfügen von Zeilen und Spalten;
- Titelzeile gegen *Titel hervorheben*;
- hell und dunkel, Kontrast;
- Druck;
- Aus- und Einschalten zur Laufzeit;
- Hilfe;
- englische Oberfläche.

Der Kern braucht `npm install` und Playwright mit Chromium. Der Ordner `.test/` geht nicht ins Paket.
