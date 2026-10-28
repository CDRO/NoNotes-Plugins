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

## Sprachen (seit 1.2.0)

Name, Beschreibung, Hilfe und Beschriftungen gibt es in den neun Sprachen von NoNotes: Deutsch (Schweiz und Deutschland),
Englisch, Französisch, Italienisch, Spanisch (Spanien und Mexiko), Portugiesisch (Portugal und Brasilien). Die Erweiterung
nimmt die Sprache der Oberfläche (`ctx.language()`), sonst die Sprache ohne Region, sonst Englisch. Name und Beschreibung im
Dialog *Erweiterungen…* folgen der Sprache ab NoNotes 3.1.1; ältere Versionen zeigen dort die deutschen.

Die Texte stehen oben in der Datei in einer Tabelle (Deutsch und Englisch von Hand, die übrigen aus `.l10n/scene-backgrounds/<sprache>.json`,
eingesetzt mit `node .l10n/apply.cjs`).

## Installieren

1. Den ganzen Ordner `scene-backgrounds/` (mit `scene-backgrounds.js` und `hintergruende/`) in den Ordner `plugins/` der App kopieren.
2. In `plugins/plugins.js` eintragen: `NoNotesPlugins.list(['scene-backgrounds/scene-backgrounds.js']);`
   (Liegen Skript und `hintergruende/` direkt in `plugins/`, genügt `'scene-backgrounds.js'`.)
3. Seite neu laden. Unter *Datenbank → Erweiterungen…* sollte «Szenen-Hintergründe» aktiv sein.

Mitgeliefert sind 19 Szenen (SVG). Ohne passendes Tag gilt die **Taverne** (Standard); mit einem dieser Tags wechselt
das Bild:

| Tag | Szene |
| --- | --- |
| `wald` | Wald |
| `hoehle` | Höhle mit Kristallen |
| `burg` | Burg / Thronsaal |
| `altstadt` | Altstadt |
| `bibliothek` | Bibliothek / Arbeitszimmer |
| `berg` | Berggipfel / Alpen |
| `strand` | Strand bei Sonnenuntergang |
| `unterwasser` | Unterwasserwelt |
| `garten` | Gewächshaus / Garten |
| `buero` | Büro |
| `meeting` | Corporate Meeting Room |
| `cafe` | Café / Küche |
| `labor` | Labor / Werkstatt |
| `stadt` | Modernes Stadtzentrum |
| `zukunft` | Futuristisches Stadtzentrum |
| `cyberpunk` | Cyberpunk-Gasse |
| `raumschiff` | Raumschiff-Brücke |
| `weltall` | Weltall |

Teste: Notiz mit Tag `wald` anlegen, eine Unternotiz darunter, beide auswählen. Unternotizen erben das Bild.

## Neu in 1.1.0

- 16 neue Szenen (siehe Tabelle), Taverne mit Stuhl, Bar und neuem Feuer, Höhle überarbeitet.
- Bildpfade gelten relativ zur Skriptdatei (behebt 404 bei Plugins in Unterordnern).

## Anpassen

Oben in der Datei:

| Name | Bedeutung |
| --- | --- |
| `STANDARD` | Bild für alle Notizen ohne passendes Tag (`null` = kein Hintergrund) |
| `HINTERGRUENDE` | Liste `{ tag, bild }`; `bild: null` schaltet den Hintergrund für dieses Tag und seine Unternotizen ab |
| `VERBLASSEN` | 0 bis 0.9: Stärke des Schleiers über dem Bild |
| `EDITOR_KARTE` | 0 bis 1: Deckkraft der Karte hinter Titel und Text im Editor (1 = Bild dort nicht sichtbar) |
| `UEBERBLENDEN_MS` | Dauer des Überblendens |

Bilder: Pfad relativ zur Skriptdatei `scene-backgrounds.js` (egal, in welchem Unterordner sie liegt) oder eine volle Adresse (`https://…`, `data:…`); SVG, PNG, JPG oder WebP.
Eigene Bilder einfach in `hintergruende/` ablegen und eintragen. Änderungen wirken nach dem Neuladen.

Benötigt NoNotes mit den Ereignissen `mindmap:select` und `mindmap:rendered` (api 1, neu in diesem Stand). In einer
älteren Version wirkt nur das Öffnen einer Notiz im Editor. Wie jede Erweiterung läuft sie mit allen Rechten der Seite.
