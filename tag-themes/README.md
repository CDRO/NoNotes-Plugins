# Tag-Designs

Erweiterung für [NoNotes](https://github.com/cdro/nonotes): setzt pro Notiz ein Design anhand ihrer Tags.

- Öffnest du eine Notiz mit einem Tag aus der Zuordnung, wechselt die ganze Oberfläche auf das Design dieses Tags.
- Schliesst du die Notiz, gilt wieder das im Menü *Datenbank → Design* gewählte Design.
- Mehrere passende Tags: die Regel, die in der Datei weiter oben steht, gewinnt.
- Tag-Änderungen im Editor wirken sofort (die Erweiterung beobachtet dafür die Tag-Leiste).
- Die **Hauptfarbe** bleibt unberührt.

## Installieren

1. `tag-themes.js` in den Ordner `plugins/` der App kopieren.
2. In `plugins/plugins.js` eintragen: `NoNotesPlugins.list(['tag-themes.js']);`
3. Seite neu laden. Unter *Datenbank → Erweiterungen…* sollte «Tag-Designs» aktiv sein.

## Anpassen

Oben in `tag-themes.js` steht die Liste `REGELN`: pro Eintrag `tag`, Farben für `light` (helle Systemeinstellung) und
`dark` sowie optional `css`. Erlaubte Variablen: `bg`, `panel`, `text`, `muted`, `border`, `hover`, `danger`, `ok`,
`warn`, `radius`, `shadow`. Mitgeliefert sind `wichtig` (rötlich), `privat` (Sepia) und `idee` (grünlich).
Änderungen wirken nach dem Neuladen.

Benötigt NoNotes mit Erweiterungs-Schnittstelle `api: 1`. Wie jede Erweiterung läuft sie mit allen Rechten der Seite.
