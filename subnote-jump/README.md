# Sprung zu Unternotizen

Erweiterung für [NoNotes](https://github.com/cdro/nonotes): springt per Tastenkürzel von einer Notiz zu einer ihrer
Unternotizen.

**Beispiel:** Eine Notiz endet mit «Wohin soll es gehen? Vorne, Hinten, Oben, Unten» und hat vier Unternotizen mit diesen
Titeln. Im Editor öffnet **Strg+Leertaste** ein Fenster mit der nummerierten Liste, in allen drei Darstellungen
(Bearbeiten, Geteilt, Vorschau). Zahl eingeben, **Enter**: die Unternotiz öffnet sich. Ein Klick auf einen Eintrag
funktioniert auch, **Esc** bricht ab.

## Welche Unternotizen erscheinen?

- Die Unternotizen, deren Titel im Text der Notiz vorkommt (auch als `[[Titel]]`), in der Reihenfolge ihres Auftretens
  im Text. Ein Titel zählt nur als ganzes Wort («Oben» passt nicht auf «Obenauf»), Gross-/Kleinschreibung ist egal.
- Nennt der Text keine Unternotiz, erscheinen alle direkten Unternotizen in der Reihenfolge der Mindmap.
- Archivierte Unternotizen werden nicht angeboten.

## Installieren

1. `subnote-jump.js` in den Ordner `plugins/` der App kopieren.
2. In `plugins/plugins.js` eintragen: `NoNotesPlugins.list(['subnote-jump.js']);`
3. Seite neu laden. Unter *Datenbank → Erweiterungen…* sollte «Sprung zu Unternotizen» aktiv sein.

## Anpassen

Oben in der Datei: `TASTE` (Standard Strg+Leertaste, `code` ist ein `KeyboardEvent.code`) und `MODI` (Darstellungen, in
denen das Kürzel gilt; Standard alle drei: `'edit'`, `'split'`, `'preview'`; wer es nur in der Vorschau will, lässt
`'preview'` allein stehen).

Hinweis: Unter manchen Systemen belegt das Betriebssystem Strg+Leertaste (z. B. Eingabemethode umschalten); dann in
`TASTE` ein anderes Kürzel eintragen.

Das Plugin läuft wie jede Erweiterung mit allen Rechten der Seite und benötigt die Schnittstelle `api: 1`.
