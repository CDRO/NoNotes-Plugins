# Szenen-Hintergründe

Erweiterung für [NoNotes](https://github.com/cdro/nonotes): setzt hinter der Mindmap und dem Editor ein Hintergrundbild
(z. B. eine Taverne), das sich ändert, wenn du eine Notiz mit einem passenden Tag auswählst (z. B. ein Wald).

- Es gilt ein **Standard-Bild**.
- Wählst du in der Mindmap eine Notiz aus oder öffnest sie im Editor (Bearbeiten, Geteilt und Vorschau), prüft die
  Erweiterung die Tags der Notiz, dann die ihrer Eltern, dann deren Eltern usw. Das erste Tag aus der Zuordnung bestimmt
  das Bild. **Alle Unternotizen erben es**, solange nichts anderes über ein Tag gesetzt wurde.
- Mehrere passende Tags an derselben Notiz: der Eintrag weiter oben in `HINTERGRUENDE` gewinnt.
- Ohne Auswahl und bei der Wurzel gilt das Standard-Bild. Tag-Änderungen im Editor wirken sofort.
- Beim Wechsel wird weich überblendet. Ein Schleier in der Farbe des Designs (hell/dunkel) hält Knoten und Text lesbar.

## Installieren

1. `scene-backgrounds.js` **und den Ordner `hintergruende/`** in den Ordner `plugins/` der App kopieren.
2. In `plugins/plugins.js` eintragen: `NoNotesPlugins.list(['scene-backgrounds.js']);`
3. Seite neu laden. Unter *Datenbank → Erweiterungen…* sollte «Szenen-Hintergründe» aktiv sein.

Mitgeliefert sind drei einfache Beispielbilder (SVG): `taverne` (Standard), `wald` (Tag `wald`) und `hoehle`
(Tag `hoehle`). Teste: Notiz mit Tag `wald` anlegen, eine Unternotiz darunter, beide auswählen.

## Anpassen

Oben in der Datei:

| Name | Bedeutung |
| --- | --- |
| `STANDARD` | Bild für alle Notizen ohne passendes Tag (`null` = kein Hintergrund) |
| `HINTERGRUENDE` | Liste `{ tag, bild }`; `bild: null` schaltet den Hintergrund für dieses Tag und seine Unternotizen ab |
| `VERBLASSEN` | 0 bis 0.9: Stärke des Schleiers über dem Bild |
| `EDITOR_KARTE` | 0 bis 1: Deckkraft der Karte hinter Titel und Text im Editor (1 = Bild dort nicht sichtbar) |
| `UEBERBLENDEN_MS` | Dauer des Überblendens |

Bilder: Pfad relativ zum Ordner `plugins/` oder eine volle Adresse (`https://…`, `data:…`); SVG, PNG, JPG oder WebP.
Eigene Bilder einfach in `hintergruende/` ablegen und eintragen. Änderungen wirken nach dem Neuladen.

Benötigt NoNotes mit den Ereignissen `mindmap:select` und `mindmap:rendered` (api 1, neu in diesem Stand). In einer
älteren Version wirkt nur das Öffnen einer Notiz im Editor. Wie jede Erweiterung läuft sie mit allen Rechten der Seite.
