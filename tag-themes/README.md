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

## Linien der Mindmap stylen

Die Liste `LINKS` stylt die Verbindungslinien (Elternnotiz → Unternotiz) nach dem Tag-Paar. Beispiel: Tag `brick` zu
`wood` ergibt einen grauen Link, der zu Braun wird, rechtwinklig mit runden Ecken geführt:

```js
{ from: 'brick', to: 'wood',
  color: { light: ['#9aa0a6', '#8b5a2b'], dark: ['#7d848c', '#c58a50'] },
  shape: 'elbow', radius: 10, width: 3 }
```

| Feld | Bedeutung |
| --- | --- |
| `from`, `to` | Tag der Elternnotiz / der Unternotiz; `'*'` passt auf jede Notiz. Die erste passende Regel gewinnt |
| `color` | Farbverlauf Eltern → Kind: eine Farbe, eine Liste (auch mehr als zwei) oder `{ light, dark }` |
| `shape` | `'curve'` (Bézier, Standard), `'elbow'` (rechtwinklig) oder `'straight'` (direkt) |
| `radius` | Eckenradius bei `'elbow'` (0 = scharfe Ecken) |
| `width`, `dash`, `opacity` | Stärke, Strichart (z. B. `'6 4'`), Deckkraft |

Die Linien-Stile gelten nur auf dem Bildschirm, nicht in Export und Druck. Sie brauchen NoNotes mit dem Ereignis
`mindmap:rendered` und den Linien-Attributen `data-from`/`data-to` (siehe Branch-Änderung im NoNotes-Repo); in einer
älteren Version bleiben die Linien unverändert, die Tag-Designs funktionieren weiter.

Benötigt NoNotes mit Erweiterungs-Schnittstelle `api: 1`. Wie jede Erweiterung läuft sie mit allen Rechten der Seite.
