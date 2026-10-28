/* NoNotes-Erweiterung «Farben über Tags»: färbt Knoten der Mindmap nach einem Tag wie «farbe:rot» (englisch «color:red»).

   - Fläche heller, Umrandung dunkler, der Titel in der Farbe der Umrandung; im dunklen Modus des Systems umgekehrt.
   - 16 Farben, siehe FARBEN unten. Gross-/Kleinschreibung ist egal, «farbe:grün» und «farbe:gruen» gehen beide.
   - «farbe-kinder:blau» («color-children:blue») färbt alle Unternotizen, die Notiz selbst nicht; mit «farbe:» zusammen
     können Notiz und Unternotizen verschiedene Farben haben. Eine Unternotiz mit eigener Farbe behält sie; hat sie selbst
     ein «farbe-kinder:», gilt das für ihren Teil des Baums.
   - Mehrere Farb-Tags derselben Art an einer Notiz: es gilt das erste in der Reihenfolge, in der der Editor die Tags zeigt.
   - Zusätze nach «+» am Farb-Tag (seit 2.1.0): «farbe:rot+schraffiert» («color:red+hatched») zeichnet die Fläche schraffiert,
     abwechselnd in der Farbe und einer daraus berechneten helleren Fassung; auch «farbe-kinder:blau+schraffiert».
   - Auf dem Schirm und beim Kopieren als Bild (seit 2.4.0, NoNotes ab 3.1.0; abschaltbar im Untermenü «Farbe ▸»): Export und Druck
     zeichnen die Mindmap ohne diese Farben. Die Wurzel bleibt, wie sie ist.
   - Rechtsklick auf einen Knoten (NoNotes ab 2.8.0): «Farbe ▸» mit je den 16 Farben, «Keine Farbe» und «Schraffiert» für die
     Notiz und für ihre Unternotizen.
     Gilt für alle ausgewählten Knoten, wenn der angeklickte dazugehört; danach ist die Auswahl aufgehoben (ab 2.8.1).
     Geschrieben wird in deutscher Oberfläche deutsch («farbe:rot»), in allen anderen Sprachen englisch («color:red»).
   Benötigt das Ereignis «mindmap:rendered» (NoNotes ab 1.8.0). */

/* ---- Farben ------------------------------------------------------------------------------------------------------
   id     Name im Tag (deutsch, ohne Umlaute; «ü» im Tag wird zu «ue»), en: englischer Name im Tag, name: Anzeige
   light  Flächen- und Linienfarbe für die helle Systemeinstellung, dark für die dunkle (Titel = Linienfarbe).
          Jede Linienfarbe hat auf ihrer Fläche einen Kontrast von mindestens 5:1.                                   */
const FARBEN = [
  { id: 'rot', en: 'red', name: 'Rot', light: { fill: '#fad6d6', line: '#9c1111' }, dark: { fill: '#421f1f', line: '#ef7171' } },
  { id: 'orange', en: 'orange', name: 'Orange', light: { fill: '#fde4d3', line: '#a24609' }, dark: { fill: '#442c1d', line: '#f79f64' } },
  { id: 'bernstein', en: 'amber', name: 'Bernstein', light: { fill: '#fdeed3', line: '#8c5b06' }, dark: { fill: '#44361d', line: '#f8c162' } },
  { id: 'gelb', en: 'yellow', name: 'Gelb', light: { fill: '#fdf6d3', line: '#7c6807' }, dark: { fill: '#443e1d', line: '#f7de64' } },
  { id: 'limette', en: 'lime', name: 'Limette', light: { fill: '#eef9d7', line: '#517210' }, dark: { fill: '#364120', line: '#c2eb70' } },
  { id: 'gruen', en: 'green', name: 'Grün', light: { fill: '#daf6df', line: '#1d742c' }, dark: { fill: '#233e28', line: '#7cde8d' } },
  { id: 'smaragd', en: 'emerald', name: 'Smaragd', light: { fill: '#d8f8eb', line: '#15754d' }, dark: { fill: '#214033', line: '#74e7b7' } },
  { id: 'tuerkis', en: 'teal', name: 'Türkis', light: { fill: '#d8f8f5', line: '#147369' }, dark: { fill: '#21403d', line: '#74e7db' } },
  { id: 'cyan', en: 'cyan', name: 'Cyan', light: { fill: '#d6f5fa', line: '#0e6f81' }, dark: { fill: '#1f3d42', line: '#6cdbef' } },
  { id: 'himmelblau', en: 'sky', name: 'Himmelblau', light: { fill: '#d5edfc', line: '#0d679c' }, dark: { fill: '#1e3543', line: '#68c0f3' } },
  { id: 'blau', en: 'blue', name: 'Blau', light: { fill: '#d6e2fa', line: '#11409c' }, dark: { fill: '#1f2b42', line: '#6e99ef' } },
  { id: 'indigo', en: 'indigo', name: 'Indigo', light: { fill: '#d9d9f7', line: '#1e1e8f' }, dark: { fill: '#22223f', line: '#8b8be6' } },
  { id: 'violett', en: 'violet', name: 'Violett', light: { fill: '#e4d8f8', line: '#471a93' }, dark: { fill: '#2c2140', line: '#a983e9' } },
  { id: 'purpur', en: 'purple', name: 'Purpur', light: { fill: '#f0d9f7', line: '#731e8f' }, dark: { fill: '#37223f', line: '#c97ae3' } },
  { id: 'pink', en: 'pink', name: 'Pink', light: { fill: '#f9d7e8', line: '#981657' }, dark: { fill: '#412030', line: '#eb70ad' } },
  { id: 'grau', en: 'gray', name: 'Grau', light: { fill: '#e6e7ea', line: '#4f545f' }, dark: { fill: '#2f3032', line: '#a6abb5' } },
];
const VORSILBEN = ['farbe', 'color', 'colour'];                           // vor dem Doppelpunkt: Farbe der Notiz
const VORSILBEN_KINDER = ['farbe-kinder', 'color-children', 'colour-children']; // Farbe aller Unternotizen
const MUSTER = [{ id: 'schraffiert', en: 'hatched' }];   // Zusätze nach «+»: farbe:rot+schraffiert
const STREIFEN = 4;                                        // Breite eines Streifens in Pixeln bei Zoom 100 % (wächst mit dem Zoom)
/* --------------------------------------------------------------------------------------------------------------- */

/** Zweite Streifenfarbe der Schraffur, aus der Farbe berechnet: hell zum Weiss hin, dunkel zur Linienfarbe hin, jeweils nur so
 *  weit, dass der Titel (Linienfarbe) auf dem Streifen mindestens 4.5:1 Kontrast behält. c: { fill, line }, scheme: light | dark. */
const tagFarbenStreifen = (() => {
  const rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
  const lum = h => { const c = rgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const kontrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  return (c, scheme) => {
    const ziel = scheme === 'dark' ? c.line : '#ffffff';
    for (let t = scheme === 'dark' ? 0.3 : 0.85; t > 0.001; t -= 0.01) {
      const s = mix(c.fill, ziel, t);
      if (kontrast(s, c.line) >= 4.5) return s;
    }
    return c.fill;
  };
})();

let ausschalten = null; // aus activate: nimmt Stylesheet und Klassen wieder weg
const LEGENDE_KEY = 'plugin:tag-farben:legende'; // Text der Legende in der Datenbank (meta), seit 2.2.0

const tagListe = sprache => FARBEN.map(f => `\`${sprache === 'en' ? 'color:' + f.en : 'farbe:' + f.id}\``).join(', ');

/* ---- Texte je Sprache --------------------------------------------------------------------------------------
   Schlüssel klein: 'de', 'de-de', 'en', 'fr', 'it', 'es', 'es-mx', 'pt', 'pt-br'. Gewählt wird die genaue Sprache der Oberfläche,
   dann die Sprache vor dem Bindestrich, dann Englisch. Im Hilfetext setzt die Erweiterung {TAGS_DE} und {TAGS_EN} ein (die Tags
   der 16 Farben). farben: Anzeigenamen der Farben (ohne Angabe: deutsch aus FARBEN, sonst englisch). Die Tags selbst schreibt
   die Erweiterung in deutscher Oberfläche deutsch (farbe:rot), in jeder anderen englisch (color:red); gelesen werden beide.
   Die weiteren Sprachen stammen aus .l10n/tag-colors/ (node .l10n/apply.cjs). */
const TF_TEXTE = {
  de: {
    name: 'Farben über Tags',
    description: 'Färbt Knoten der Mindmap über Tags wie «farbe:rot» (16 Farben); «farbe-kinder:blau» färbt die Unternotizen. Farbwahl per Rechtsklick (ab NoNotes 2.8.0), Legende über der Mindmap (ab 2.11.0).',
    help: `Färbt **Knoten der Mindmap** über ein Tag: Fläche heller, Umrandung dunkler, der Titel in der Farbe der Umrandung (im dunklen Modus umgekehrt).

- Tag an der Notiz setzen, zum Beispiel \`farbe:rot\` (englisch \`color:red\`). Gross-/Kleinschreibung ist egal.
- **Unternotizen färben:** \`farbe-kinder:blau\` (\`color-children:blue\`) färbt alle Unternotizen, die Notiz selbst nicht. Zusammen mit \`farbe:rot\` ist die Notiz rot und alles darunter blau; für dieselbe Farbe beide Tags mit derselben Farbe. Eine Unternotiz mit eigener Farbe behält sie, ein eigenes \`farbe-kinder:\` gilt für ihren Teil des Baums.
- Mehrere Farb-Tags derselben Art an einer Notiz: das erste gilt (Reihenfolge wie im Editor).
- **Schraffiert:** \`+schraffiert\` am Farb-Tag, etwa \`farbe:rot+schraffiert\` oder \`farbe-kinder:blau+schraffiert\` (englisch \`color:red+hatched\`). Die Fläche bekommt diagonale Streifen in der Farbe und einer helleren Fassung davon; der Titel bleibt lesbar, die Streifen wachsen mit dem Zoom.
- Auf dem Bildschirm und im kopierten Bild, nicht in Export und Druck. Die Wurzel bleibt, wie sie ist.

#### Beim Kopieren als Bild
*Als Bild kopieren* (Rechtsklick, \`Ctrl\`+\`C\` oder der Knopf in der Leiste der Mindmap) übernimmt die Farben ins Bild, schraffierte mit Streifen. Abschalten: Rechtsklick auf einen Knoten → **Farbe ▸** → **Farben beim Kopieren als Bild**; das gilt in diesem Browser und geht auch im Lesemodus. Braucht NoNotes 3.1.0 oder neuer (seit 2.4.0).

#### Per Rechtsklick
Rechtsklick auf einen Knoten → **Farbe ▸**: oben die Farbe der **Notiz**, unten die der **Unternotizen**, je eine der 16 Farben (ersetzt die bisherige, die Schraffur bleibt), **Keine Farbe** oder **Schraffiert** an- und abhaken (wirkt sofort, nur mit Farbe). Gehört der Knoten zur Mehrfachauswahl (\`Ctrl\`+Klick), gilt es für alle ausgewählten; danach ist die Auswahl aufgehoben. Die Tags werden in deutscher Oberfläche deutsch geschrieben, in allen anderen Sprachen englisch. Braucht NoNotes 2.8.0 oder neuer.

#### Legende
Der Knopf **Legende** in der Leiste der Mindmap blendet eine Notiz ein, die erklärt, was die Farben bedeuten (eine je Datenbank, für alle im Arbeitsbereich gleich). Ein Klick in die Legende bearbeitet sie: Markdown, \`Ctrl\`+\`B\`, \`Ctrl\`+\`I\`, \`Ctrl\`+\`K\`; \`Esc\` oder ein Klick daneben speichert. Farb-Tags im Text wie \`farbe:rot\` oder \`farbe:blau+schraffiert\` erscheinen als Farbfeld mit Namen. Ist sie leer, beginnt sie mit den Farben, die gerade benutzt werden. Kommen später Farben dazu, ergänzt der Knopf **+** im Kopf der Legende die fehlenden als neue Zeilen am Ende; was schon dasteht, bleibt unberührt (seit 2.3.0). Die Ecke (oben rechts, oben links, unten links, unten rechts) wählt die Auswahl im Kopf, **–** klappt sie ein; beides merkt sich der Browser. Im Markdown-Export und im Druck steht sie unter dem Mindmap-Bild. Braucht NoNotes 2.11.0 oder neuer.

#### Die 16 Farben
{TAGS_DE}

Englisch: {TAGS_EN}, dazu \`color:grey\`.`,
    ui: { farbe: 'Farbe', keine: 'Keine Farbe', notiz: 'Notiz', kinder: 'Unternotizen', kinderTitel: 'Farbe aller Unternotizen; eine Unternotiz mit eigener Farbe behält sie', schraffiert: 'Schraffiert', schraffiertTitel: 'Diagonale Streifen in der Farbe und einer helleren Fassung (braucht eine Farbe)',
      bild: 'Farben beim Kopieren als Bild', bildTitel: 'Als Bild kopieren (Rechtsklick, Ctrl+C oder der Knopf in der Leiste der Mindmap) übernimmt die Farben ins Bild; gilt in diesem Browser' },
    legende: { titel: 'Legende', knopf: 'Legende', knopfTitel: 'Legende ein- oder ausblenden: was die Farben bedeuten', zu: 'Einklappen', auf: 'Legende aufklappen', ecke: 'Lage der Legende',
      ergaenzen: 'Fehlende Farben ergänzen: benutzte Farben, die in der Legende noch fehlen, kommen als neue Zeilen ans Ende',
      ecken: { or: 'Oben rechts', ol: 'Oben links', ul: 'Unten links', ur: 'Unten rechts' }, leer: 'Klicken, um zu beschreiben, was die Farben bedeuten.',
      hinweis: 'Markdown · Ctrl+B, Ctrl+I, Ctrl+K · Esc oder Klick daneben speichert', schraffiert: 'schraffiert', kinder: 'Unternotizen', bedeutung: '…' },
    wort: { fett: 'fett', kursiv: 'kursiv' },
  },
  en: {
    name: 'Colours by tag',
    description: 'Colours mind map nodes by tags such as “color:red” (16 colours); “color-children:blue” colours the subnotes. Colour by right-click (NoNotes 2.8.0 or later), legend above the mind map (2.11.0 or later).',
    help: `Colours **mind map nodes** by tag: lighter fill, darker outline, the title in the outline colour (reversed in dark mode).

- Put a tag on the note, for example \`color:red\` (German \`farbe:rot\`). Case does not matter.
- **Colour subnotes:** \`color-children:blue\` (\`farbe-kinder:blau\`) colours all subnotes, not the note itself. Together with \`color:red\` the note is red and everything below it blue; for the same colour, use both tags with the same colour. A subnote with a colour of its own keeps it; its own \`color-children:\` applies to its part of the tree.
- Several colour tags of the same kind on one note: the first one wins (order as in the editor).
- **Hatched:** add \`+hatched\` to the colour tag, for example \`color:red+hatched\` or \`color-children:blue+hatched\` (German \`farbe:rot+schraffiert\`). The fill gets diagonal stripes in the colour and a lighter shade of it; the title stays legible, the stripes grow with the zoom.
- On screen and in the copied image, not in export and print. The root stays as it is.

#### When copying as an image
*Copy as image* (right-click, \`Ctrl\`+\`C\` or the button in the mind map toolbar) includes the colours in the image, hatched ones with stripes. To turn this off: right-click a node → **Colour ▸** → **Colours when copying as image**; it applies in this browser and also works in read-only mode. Needs NoNotes 3.1.0 or later (since 2.4.0).

#### By right-click
Right-click a node → **Colour ▸**: the colour of the **note** at the top, that of its **subnotes** below, each with the 16 colours (replaces the current one, hatching stays), **No colour** or tick **Hatched** (takes effect at once, only with a colour). If the node is part of the multiple selection (\`Ctrl\`+click), it applies to all selected nodes; the selection is cleared afterwards. Tags are written in German in a German interface and in English in all other languages. Needs NoNotes 2.8.0 or later.

#### Legend
The **Legend** button in the mind map toolbar shows a note that explains what the colours mean (one per database, the same for everyone in the workspace). Click into the legend to edit it: Markdown, \`Ctrl\`+\`B\`, \`Ctrl\`+\`I\`, \`Ctrl\`+\`K\`; \`Esc\` or a click outside saves. Colour tags in the text such as \`color:red\` or \`color:blue+hatched\` appear as a swatch with the name. When empty, it starts with the colours currently in use. When colours are added later, the **+** button in its header adds the missing ones as new lines at the end; what is already there stays untouched (since 2.3.0). The selector in its header picks the corner (top right, top left, bottom left, bottom right), **–** collapses it; the browser remembers both. In the Markdown export and in print it appears below the mind map image. Needs NoNotes 2.11.0 or later.

#### The 16 colours
{TAGS_EN}, also \`color:grey\`.

German: {TAGS_DE}.`,
    ui: { farbe: 'Colour', keine: 'No colour', notiz: 'Note', kinder: 'Subnotes', kinderTitel: 'Colour of all subnotes; a subnote with a colour of its own keeps it', schraffiert: 'Hatched', schraffiertTitel: 'Diagonal stripes in the colour and a lighter shade (needs a colour)',
      bild: 'Colours when copying as image', bildTitel: 'Copy as image (right-click, Ctrl+C or the button in the mind map toolbar) includes the colours; remembered in this browser' },
    legende: { titel: 'Legend', knopf: 'Legend', knopfTitel: 'Show or hide the legend: what the colours mean', zu: 'Collapse', auf: 'Expand legend', ecke: 'Position of the legend',
      ergaenzen: 'Add missing colours: colours in use that the legend does not mention yet come as new lines at the end',
      ecken: { or: 'Top right', ol: 'Top left', ul: 'Bottom left', ur: 'Bottom right' }, leer: 'Click to describe what the colours mean.',
      hinweis: 'Markdown · Ctrl+B, Ctrl+I, Ctrl+K · Esc or a click outside saves', schraffiert: 'hatched', kinder: 'subnotes', bedeutung: '…' },
    wort: { fett: 'bold', kursiv: 'italic' },
  },
  /* <uebersetzungen> */
  'de-de': {
    name: "Farben über Tags",
    description: "Färbt Knoten der Mindmap über Tags wie „farbe:rot“ (16 Farben); „farbe-kinder:blau“ färbt die Unternotizen. Farbwahl per Rechtsklick (ab NoNotes 2.8.0), Legende über der Mindmap (ab 2.11.0).",
    help: `Färbt **Knoten der Mindmap** über ein Tag: Fläche heller, Umrandung dunkler, der Titel in der Farbe der Umrandung (im dunklen Modus umgekehrt).

- Tag an der Notiz setzen, zum Beispiel \`farbe:rot\` (englisch \`color:red\`). Groß-/Kleinschreibung ist egal.
- **Unternotizen färben:** \`farbe-kinder:blau\` (\`color-children:blue\`) färbt alle Unternotizen, die Notiz selbst nicht. Zusammen mit \`farbe:rot\` ist die Notiz rot und alles darunter blau; für dieselbe Farbe beide Tags mit derselben Farbe. Eine Unternotiz mit eigener Farbe behält sie, ein eigenes \`farbe-kinder:\` gilt für ihren Teil des Baums.
- Mehrere Farb-Tags derselben Art an einer Notiz: das erste gilt (Reihenfolge wie im Editor).
- **Schraffiert:** \`+schraffiert\` am Farb-Tag, etwa \`farbe:rot+schraffiert\` oder \`farbe-kinder:blau+schraffiert\` (englisch \`color:red+hatched\`). Die Fläche bekommt diagonale Streifen in der Farbe und einer helleren Fassung davon; der Titel bleibt lesbar, die Streifen wachsen mit dem Zoom.
- Auf dem Bildschirm und im kopierten Bild, nicht in Export und Druck. Die Wurzel bleibt, wie sie ist.

#### Beim Kopieren als Bild
*Als Bild kopieren* (Rechtsklick, \`Ctrl\`+\`C\` oder der Knopf in der Leiste der Mindmap) übernimmt die Farben ins Bild, schraffierte mit Streifen. Abschalten: Rechtsklick auf einen Knoten → **Farbe ▸** → **Farben beim Kopieren als Bild**; das gilt in diesem Browser und geht auch im Lesemodus. Braucht NoNotes 3.1.0 oder neuer (seit 2.4.0).

#### Per Rechtsklick
Rechtsklick auf einen Knoten → **Farbe ▸**: oben die Farbe der **Notiz**, unten die der **Unternotizen**, je eine der 16 Farben (ersetzt die bisherige, die Schraffur bleibt), **Keine Farbe** oder **Schraffiert** an- und abhaken (wirkt sofort, nur mit Farbe). Gehört der Knoten zur Mehrfachauswahl (\`Ctrl\`+Klick), gilt es für alle ausgewählten; danach ist die Auswahl aufgehoben. Die Tags werden in deutscher Oberfläche deutsch geschrieben, in allen anderen Sprachen englisch. Braucht NoNotes 2.8.0 oder neuer.

#### Legende
Der Knopf **Legende** in der Leiste der Mindmap blendet eine Notiz ein, die erklärt, was die Farben bedeuten (eine je Datenbank, für alle im Arbeitsbereich gleich). Ein Klick in die Legende bearbeitet sie: Markdown, \`Ctrl\`+\`B\`, \`Ctrl\`+\`I\`, \`Ctrl\`+\`K\`; \`Esc\` oder ein Klick daneben speichert. Farb-Tags im Text wie \`farbe:rot\` oder \`farbe:blau+schraffiert\` erscheinen als Farbfeld mit Namen. Ist sie leer, beginnt sie mit den Farben, die gerade benutzt werden. Kommen später Farben dazu, ergänzt der Knopf **+** im Kopf der Legende die fehlenden als neue Zeilen am Ende; was schon dasteht, bleibt unberührt (seit 2.3.0). Die Ecke (oben rechts, oben links, unten links, unten rechts) wählt die Auswahl im Kopf, **–** klappt sie ein; beides merkt sich der Browser. Im Markdown-Export und im Druck steht sie unter dem Mindmap-Bild. Braucht NoNotes 2.11.0 oder neuer.

#### Die 16 Farben
{TAGS_DE}

Englisch: {TAGS_EN}, dazu \`color:grey\`.`,
    ui: {"farbe":"Farbe","keine":"Keine Farbe","notiz":"Notiz","kinder":"Unternotizen","kinderTitel":"Farbe aller Unternotizen; eine Unternotiz mit eigener Farbe behält sie","schraffiert":"Schraffiert","schraffiertTitel":"Diagonale Streifen in der Farbe und einer helleren Fassung (braucht eine Farbe)","bild":"Farben beim Kopieren als Bild","bildTitel":"Als Bild kopieren (Rechtsklick, Ctrl+C oder der Knopf in der Leiste der Mindmap) übernimmt die Farben ins Bild; gilt in diesem Browser"},
    legende: {"titel":"Legende","knopf":"Legende","knopfTitel":"Legende ein- oder ausblenden: was die Farben bedeuten","zu":"Einklappen","auf":"Legende aufklappen","ecke":"Lage der Legende","ergaenzen":"Fehlende Farben ergänzen: benutzte Farben, die in der Legende noch fehlen, kommen als neue Zeilen ans Ende","ecken":{"or":"Oben rechts","ol":"Oben links","ul":"Unten links","ur":"Unten rechts"},"leer":"Klicken, um zu beschreiben, was die Farben bedeuten.","hinweis":"Markdown · Ctrl+B, Ctrl+I, Ctrl+K · Esc oder Klick daneben speichert","schraffiert":"schraffiert","kinder":"Unternotizen","bedeutung":"…"},
    wort: {"fett":"fett","kursiv":"kursiv"},
  },
  'fr': {
    name: "Couleurs par étiquettes",
    description: "Colore les nœuds de la carte mentale à l’aide d’étiquettes comme « color:red » (16 couleurs) ; « color-children:blue » colore les sous-notes. Choix de la couleur par clic droit (à partir de NoNotes 2.8.0), légende au-dessus de la carte mentale (à partir de la 2.11.0).",
    help: `Colore les **nœuds de la carte mentale** à l’aide d’une étiquette : fond plus clair, contour plus foncé, titre dans la couleur du contour (inversé en mode sombre).

- Ajoutez une étiquette à la note, par exemple \`color:red\` (en allemand \`farbe:rot\`). Les majuscules et les minuscules n’ont pas d’importance.
- **Colorer les sous-notes :** \`color-children:blue\` (\`farbe-kinder:blau\`) colore toutes les sous-notes, mais pas la note elle-même. Avec \`color:red\`, la note est rouge et tout ce qui se trouve en dessous est bleu ; pour une seule et même couleur, mettez les deux étiquettes avec la même couleur. Une sous-note qui a sa propre couleur la conserve ; son propre \`color-children:\` s’applique à sa partie de l’arborescence.
- Plusieurs étiquettes de couleur du même type sur une note : la première l’emporte (dans l’ordre de l’éditeur).
- **Hachuré :** ajoutez \`+hatched\` à l’étiquette de couleur, par exemple \`color:red+hatched\` ou \`color-children:blue+hatched\` (en allemand \`farbe:rot+schraffiert\`). Le fond reçoit des rayures diagonales dans la couleur et dans une nuance plus claire de celle-ci ; le titre reste lisible, les rayures grandissent avec le zoom.
- À l’écran et dans l’image copiée, mais pas à l’exportation ni à l’impression. La racine reste telle quelle.

#### Lors de la copie en tant qu’image
*Copier en tant qu’image* (clic droit, \`Ctrl\`+\`C\` ou le bouton de la barre de la carte mentale) reprend les couleurs dans l’image, les hachurées avec leurs rayures. Pour désactiver cette fonction : clic droit sur un nœud → **Couleur ▸** → **Couleurs lors de la copie en tant qu’image** ; ce réglage vaut pour ce navigateur et fonctionne aussi en mode lecture seule. Nécessite NoNotes 3.1.0 ou une version ultérieure (depuis la 2.4.0).

#### Par clic droit
Clic droit sur un nœud → **Couleur ▸** : en haut la couleur de la **note**, en dessous celle des **sous-notes**, chaque fois avec les 16 couleurs (remplace la couleur actuelle, les hachures restent), **Aucune couleur** ou cocher et décocher **Hachuré** (effet immédiat, seulement avec une couleur). Si le nœud fait partie de la sélection multiple (\`Ctrl\`+clic), le choix s’applique à tous les nœuds sélectionnés ; la sélection est ensuite effacée. Les étiquettes sont écrites en anglais (en allemand dans l’interface allemande). Nécessite NoNotes 2.8.0 ou une version ultérieure.

#### Légende
Le bouton **Légende** de la barre de la carte mentale affiche une note qui explique ce que signifient les couleurs (une par base de données, la même pour tout le monde dans l’espace de travail). Un clic dans la légende permet de la modifier : Markdown, \`Ctrl\`+\`B\`, \`Ctrl\`+\`I\`, \`Ctrl\`+\`K\` ; \`Esc\` ou un clic à côté enregistre. Les étiquettes de couleur dans le texte, comme \`color:red\` ou \`color:blue+hatched\`, apparaissent sous forme de pastille de couleur avec son nom. Si la légende est vide, elle commence avec les couleurs utilisées actuellement. Si des couleurs s’ajoutent plus tard, le bouton **+** dans son en-tête ajoute les manquantes en nouvelles lignes à la fin ; ce qui s’y trouve déjà reste intact (depuis la 2.3.0). La liste de choix de l’en-tête définit le coin (en haut à droite, en haut à gauche, en bas à gauche, en bas à droite), **–** réduit la légende ; le navigateur mémorise les deux. Dans l’exportation Markdown et à l’impression, elle figure sous l’image de la carte mentale. Nécessite NoNotes 2.11.0 ou une version ultérieure.

#### Les 16 couleurs
{TAGS_EN}, ainsi que \`color:grey\`.

En allemand : {TAGS_DE}.`,
    ui: {"farbe":"Couleur","keine":"Aucune couleur","notiz":"Note","kinder":"Sous-notes","kinderTitel":"Couleur de toutes les sous-notes ; une sous-note qui a sa propre couleur la conserve","schraffiert":"Hachuré","schraffiertTitel":"Rayures diagonales dans la couleur et dans une nuance plus claire (nécessite une couleur)","bild":"Couleurs lors de la copie en tant qu’image","bildTitel":"Copier en tant qu’image (clic droit, Ctrl+C ou le bouton de la barre de la carte mentale) reprend les couleurs dans l’image ; vaut pour ce navigateur"},
    legende: {"titel":"Légende","knopf":"Légende","knopfTitel":"Afficher ou masquer la légende : ce que signifient les couleurs","zu":"Réduire","auf":"Développer la légende","ecke":"Position de la légende","ergaenzen":"Ajouter les couleurs manquantes : les couleurs utilisées qui ne figurent pas encore dans la légende sont ajoutées en nouvelles lignes à la fin","ecken":{"or":"En haut à droite","ol":"En haut à gauche","ul":"En bas à gauche","ur":"En bas à droite"},"leer":"Cliquez pour décrire ce que signifient les couleurs.","hinweis":"Markdown · Ctrl+B, Ctrl+I, Ctrl+K · Esc ou un clic à côté enregistre","schraffiert":"hachuré","kinder":"sous-notes","bedeutung":"…"},
    wort: {"fett":"gras","kursiv":"italique"},
  },
  'it': {
    name: "Colori tramite tag",
    description: "Colora i nodi della mappa mentale tramite tag come «color:red» (16 colori); «color-children:blue» colora le sottonote. Scelta del colore con il clic destro (da NoNotes 2.8.0), legenda sopra la mappa mentale (dalla 2.11.0).",
    help: `Colora i **nodi della mappa mentale** tramite un tag: riempimento più chiaro, bordo più scuro, il titolo nel colore del bordo (in modalità scura il contrario).

- Aggiungi un tag alla nota, ad esempio \`color:red\` (in tedesco \`farbe:rot\`). Maiuscole e minuscole non contano.
- **Colorare le sottonote:** \`color-children:blue\` (\`farbe-kinder:blau\`) colora tutte le sottonote, ma non la nota stessa. Insieme a \`color:red\` la nota è rossa e tutto ciò che sta sotto è blu; per lo stesso colore, usa entrambi i tag con lo stesso colore. Una sottonota con un colore proprio lo mantiene; un suo \`color-children:\` vale per la sua parte dell’albero.
- Più tag di colore dello stesso tipo su una nota: vale il primo (nell’ordine dell’editor).
- **Tratteggiato:** aggiungi \`+hatched\` al tag di colore, ad esempio \`color:red+hatched\` o \`color-children:blue+hatched\` (in tedesco \`farbe:rot+schraffiert\`). Il riempimento riceve strisce diagonali nel colore e in una sua tonalità più chiara; il titolo resta leggibile, le strisce crescono con lo zoom.
- Sullo schermo e nell’immagine copiata, non nell’esportazione né nella stampa. La radice resta com’è.

#### Quando copi come immagine
*Copia come immagine* (clic destro, \`Ctrl\`+\`C\` o il pulsante nella barra della mappa mentale) riporta i colori nell’immagine, quelli tratteggiati con le strisce. Per disattivarlo: clic destro su un nodo → **Colore ▸** → **Colori nella copia come immagine**; vale in questo browser e funziona anche in modalità di sola lettura. Richiede NoNotes 3.1.0 o successivo (dalla 2.4.0).

#### Con il clic destro
Clic destro su un nodo → **Colore ▸**: in alto il colore della **nota**, in basso quello delle **sottonote**, ognuno con i 16 colori (sostituisce quello attuale, il tratteggio resta), **Nessun colore** oppure spunta **Tratteggiato** (ha effetto subito, solo con un colore). Se il nodo fa parte della selezione multipla (\`Ctrl\`+clic), vale per tutti i nodi selezionati; poi la selezione viene annullata. I tag vengono scritti in inglese (in tedesco, se l’interfaccia è in tedesco). Richiede NoNotes 2.8.0 o successivo.

#### Legenda
Il pulsante **Legenda** nella barra della mappa mentale mostra una nota che spiega cosa significano i colori (una per database, uguale per tutti nell’area di lavoro). Un clic nella legenda la modifica: Markdown, \`Ctrl\`+\`B\`, \`Ctrl\`+\`I\`, \`Ctrl\`+\`K\`; \`Esc\` o un clic fuori salva. I tag di colore nel testo come \`color:red\` o \`color:blue+hatched\` compaiono come campione di colore con il nome. Se è vuota, inizia con i colori in uso al momento. Se in seguito si aggiungono colori, il pulsante **+** nella sua intestazione aggiunge quelli mancanti come nuove righe alla fine; ciò che c’è già resta invariato (dalla 2.3.0). Il selettore nella sua intestazione sceglie l’angolo (in alto a destra, in alto a sinistra, in basso a sinistra, in basso a destra), **–** la comprime; il browser memorizza entrambe le scelte. Nell’esportazione Markdown e nella stampa compare sotto l’immagine della mappa mentale. Richiede NoNotes 2.11.0 o successivo.

#### I 16 colori
{TAGS_EN}, inoltre \`color:grey\`.

In tedesco: {TAGS_DE}.`,
    ui: {"farbe":"Colore","keine":"Nessun colore","notiz":"Nota","kinder":"Sottonote","kinderTitel":"Colore di tutte le sottonote; una sottonota con un colore proprio lo mantiene","schraffiert":"Tratteggiato","schraffiertTitel":"Strisce diagonali nel colore e in una sua tonalità più chiara (richiede un colore)","bild":"Colori nella copia come immagine","bildTitel":"Copia come immagine (clic destro, Ctrl+C o il pulsante nella barra della mappa mentale) riporta i colori nell’immagine; vale in questo browser"},
    legende: {"titel":"Legenda","knopf":"Legenda","knopfTitel":"Mostra o nascondi la legenda: cosa significano i colori","zu":"Comprimi","auf":"Espandi la legenda","ecke":"Posizione della legenda","ergaenzen":"Aggiungi i colori mancanti: i colori in uso che la legenda non riporta ancora vengono aggiunti come nuove righe alla fine","ecken":{"or":"In alto a destra","ol":"In alto a sinistra","ul":"In basso a sinistra","ur":"In basso a destra"},"leer":"Clicca per descrivere cosa significano i colori.","hinweis":"Markdown · Ctrl+B, Ctrl+I, Ctrl+K · Esc o un clic fuori salva","schraffiert":"tratteggiato","kinder":"sottonote","bedeutung":"…"},
    wort: {"fett":"grassetto","kursiv":"corsivo"},
  },
  'es': {
    name: "Colores por etiqueta",
    description: "Colorea los nodos del mapa mental mediante etiquetas como «color:red» (16 colores); «color-children:blue» colorea las subnotas. Elección del color con clic derecho (NoNotes 2.8.0 o posterior) y leyenda sobre el mapa mental (2.11.0 o posterior).",
    help: `Colorea los **nodos del mapa mental** mediante una etiqueta: relleno más claro, borde más oscuro y el título del color del borde (al revés en el modo oscuro).

- Pon una etiqueta en la nota, por ejemplo \`color:red\` (en alemán, \`farbe:rot\`). Da igual usar mayúsculas o minúsculas.
- **Colorear las subnotas:** \`color-children:blue\` (\`farbe-kinder:blau\`) colorea todas las subnotas, pero no la propia nota. Junto con \`color:red\`, la nota queda roja y todo lo que hay debajo, azul; para un mismo color, pon las dos etiquetas con ese color. Una subnota con color propio lo conserva; su propio \`color-children:\` se aplica a su parte del árbol.
- Varias etiquetas de color del mismo tipo en una nota: vale la primera (en el orden del editor).
- **Rayado:** añade \`+hatched\` a la etiqueta de color, por ejemplo \`color:red+hatched\` o \`color-children:blue+hatched\` (en alemán, \`farbe:rot+schraffiert\`). El relleno lleva rayas diagonales del color y de un tono más claro; el título sigue siendo legible y las rayas crecen con el zoom.
- En pantalla y en la imagen copiada, no en la exportación ni en la impresión. La raíz no cambia.

#### Al copiar como imagen
*Copiar como imagen* (clic derecho, \`Ctrl\`+\`C\` o el botón de la barra del mapa mental) incluye los colores en la imagen, y los rayados, con rayas. Para desactivarlo: clic derecho en un nodo → **Color ▸** → **Colores al copiar como imagen**; se aplica en este navegador y también funciona en el modo de solo lectura. Requiere NoNotes 3.1.0 o posterior (desde la versión 2.4.0).

#### Con clic derecho
Clic derecho en un nodo → **Color ▸**: arriba, el color de la **nota**; abajo, el de las **subnotas**, cada uno con los 16 colores (sustituye al actual; el rayado se mantiene), **Sin color** o marcar y desmarcar **Rayado** (se aplica al instante, solo con color). Si el nodo forma parte de la selección múltiple (\`Ctrl\`+clic), se aplica a todos los nodos seleccionados; después se anula la selección. Las etiquetas se escriben en inglés (en alemán si la interfaz está en alemán). Requiere NoNotes 2.8.0 o posterior.

#### Leyenda
El botón **Leyenda** de la barra del mapa mental muestra una nota que explica qué significan los colores (una por base de datos, igual para todos en el espacio de trabajo). Haz clic en la leyenda para editarla: Markdown, \`Ctrl\`+\`B\`, \`Ctrl\`+\`I\`, \`Ctrl\`+\`K\`; \`Esc\` o un clic fuera guarda. Las etiquetas de color del texto, como \`color:red\` o \`color:blue+hatched\`, aparecen como una muestra de color con su nombre. Si está vacía, empieza con los colores que se usan en ese momento. Si más tarde se añaden colores, el botón **+** de su cabecera añade los que faltan como líneas nuevas al final; lo que ya hay no se toca (desde la versión 2.3.0). El selector de la cabecera elige la esquina (arriba a la derecha, arriba a la izquierda, abajo a la izquierda, abajo a la derecha) y **–** la contrae; el navegador recuerda ambas cosas. En la exportación a Markdown y en la impresión aparece debajo de la imagen del mapa mental. Requiere NoNotes 2.11.0 o posterior.

#### Los 16 colores
{TAGS_EN}, y además \`color:grey\`.

En alemán: {TAGS_DE}.`,
    ui: {"farbe":"Color","keine":"Sin color","notiz":"Nota","kinder":"Subnotas","kinderTitel":"Color de todas las subnotas; una subnota con color propio lo conserva","schraffiert":"Rayado","schraffiertTitel":"Rayas diagonales del color y de un tono más claro (requiere un color)","bild":"Colores al copiar como imagen","bildTitel":"Copiar como imagen (clic derecho, Ctrl+C o el botón de la barra del mapa mental) incluye los colores en la imagen; se aplica en este navegador"},
    legende: {"titel":"Leyenda","knopf":"Leyenda","knopfTitel":"Mostrar u ocultar la leyenda: qué significan los colores","zu":"Contraer","auf":"Desplegar la leyenda","ecke":"Posición de la leyenda","ergaenzen":"Añadir los colores que faltan: los colores en uso que aún no están en la leyenda se añaden como líneas nuevas al final","ecken":{"or":"Arriba a la derecha","ol":"Arriba a la izquierda","ul":"Abajo a la izquierda","ur":"Abajo a la derecha"},"leer":"Haz clic para describir qué significan los colores.","hinweis":"Markdown · Ctrl+B, Ctrl+I, Ctrl+K · Esc o un clic fuera guarda","schraffiert":"rayado","kinder":"subnotas","bedeutung":"…"},
    wort: {"fett":"negrita","kursiv":"cursiva"},
  },
  'es-mx': {
    name: "Colores por etiqueta",
    description: "Colorea los nodos del mapa mental con etiquetas como “color:red” (16 colores); “color-children:blue” colorea las subnotas. Color con clic derecho (a partir de NoNotes 2.8.0), leyenda sobre el mapa mental (a partir de 2.11.0).",
    help: `Colorea los **nodos del mapa mental** con una etiqueta: relleno más claro, borde más oscuro y el título en el color del borde (al revés en el modo oscuro).

- Pon una etiqueta en la nota, por ejemplo \`color:red\` (en alemán, \`farbe:rot\`). No importan las mayúsculas ni las minúsculas.
- **Colorear subnotas:** \`color-children:blue\` (\`farbe-kinder:blau\`) colorea todas las subnotas, pero no la nota misma. Junto con \`color:red\`, la nota queda roja y todo lo que está debajo, azul; para el mismo color, usa ambas etiquetas con el mismo color. Una subnota con color propio lo conserva; su propia \`color-children:\` se aplica a su parte del árbol.
- Varias etiquetas de color del mismo tipo en una nota: gana la primera (en el orden del editor).
- **Rayado:** agrega \`+hatched\` a la etiqueta de color, por ejemplo \`color:red+hatched\` o \`color-children:blue+hatched\` (en alemán, \`farbe:rot+schraffiert\`). El relleno lleva rayas diagonales en el color y en un tono más claro de este; el título sigue siendo legible y las rayas crecen con el zoom.
- En pantalla y en la imagen copiada, no en la exportación ni en la impresión. La raíz se queda como está.

#### Al copiar como imagen
*Copiar como imagen* (clic derecho, \`Ctrl\`+\`C\` o el botón de la barra del mapa mental) incluye los colores en la imagen, y los rayados, con rayas. Para desactivarlo: clic derecho en un nodo → **Color ▸** → **Colores al copiar como imagen**; se aplica en este navegador y también funciona en el modo de solo lectura. Requiere NoNotes 3.1.0 o posterior (desde 2.4.0).

#### Con clic derecho
Clic derecho en un nodo → **Color ▸**: arriba, el color de la **nota**; abajo, el de las **subnotas**, cada uno con los 16 colores (reemplaza el actual; el rayado se conserva), **Sin color** o marcar y desmarcar **Rayado** (se aplica de inmediato, solo con color). Si el nodo forma parte de la selección múltiple (\`Ctrl\`+clic), se aplica a todos los seleccionados; después se quita la selección. Las etiquetas se escriben en inglés. Requiere NoNotes 2.8.0 o posterior.

#### Leyenda
El botón **Leyenda** de la barra del mapa mental muestra una nota que explica qué significan los colores (una por base de datos, igual para todos en el espacio de trabajo). Haz clic en la leyenda para editarla: Markdown, \`Ctrl\`+\`B\`, \`Ctrl\`+\`I\`, \`Ctrl\`+\`K\`; \`Esc\` o un clic fuera guarda. Las etiquetas de color en el texto, como \`color:red\` o \`color:blue+hatched\`, aparecen como una muestra de color con su nombre. Si está vacía, empieza con los colores que se usan en ese momento. Si después se agregan colores, el botón **+** del encabezado de la leyenda agrega los que faltan como líneas nuevas al final; lo que ya está ahí no se toca (desde 2.3.0). El selector del encabezado elige la esquina (arriba a la derecha, arriba a la izquierda, abajo a la izquierda, abajo a la derecha) y **–** la contrae; el navegador recuerda ambas cosas. En la exportación a Markdown y en la impresión aparece debajo de la imagen del mapa mental. Requiere NoNotes 2.11.0 o posterior.

#### Los 16 colores
{TAGS_EN}, además de \`color:grey\`.

En alemán: {TAGS_DE}.`,
    ui: {"farbe":"Color","keine":"Sin color","notiz":"Nota","kinder":"Subnotas","kinderTitel":"Color de todas las subnotas; una subnota con color propio lo conserva","schraffiert":"Rayado","schraffiertTitel":"Rayas diagonales en el color y en un tono más claro (requiere un color)","bild":"Colores al copiar como imagen","bildTitel":"Copiar como imagen (clic derecho, Ctrl+C o el botón de la barra del mapa mental) incluye los colores en la imagen; se aplica en este navegador"},
    legende: {"titel":"Leyenda","knopf":"Leyenda","knopfTitel":"Mostrar u ocultar la leyenda: qué significan los colores","zu":"Contraer","auf":"Expandir leyenda","ecke":"Posición de la leyenda","ergaenzen":"Agregar colores faltantes: los colores en uso que aún no están en la leyenda se agregan como líneas nuevas al final","ecken":{"or":"Arriba a la derecha","ol":"Arriba a la izquierda","ul":"Abajo a la izquierda","ur":"Abajo a la derecha"},"leer":"Haz clic para describir qué significan los colores.","hinweis":"Markdown · Ctrl+B, Ctrl+I, Ctrl+K · Esc o un clic fuera guarda","schraffiert":"rayado","kinder":"subnotas","bedeutung":"…"},
    wort: {"fett":"negrita","kursiv":"cursiva"},
  },
  'pt': {
    name: "Cores por etiqueta",
    description: "Colore os nós do mapa mental através de etiquetas como «color:red» (16 cores); «color-children:blue» colore as subnotas. Escolha da cor com o botão direito (a partir do NoNotes 2.8.0), legenda por cima do mapa mental (a partir da 2.11.0).",
    help: `Colore os **nós do mapa mental** através de uma etiqueta: preenchimento mais claro, contorno mais escuro e o título na cor do contorno (no modo escuro, ao contrário).

- Coloque uma etiqueta na nota, por exemplo \`color:red\` (em alemão, \`farbe:rot\`). Maiúsculas e minúsculas são indiferentes.
- **Colorir as subnotas:** \`color-children:blue\` (\`farbe-kinder:blau\`) colore todas as subnotas, mas não a própria nota. Juntamente com \`color:red\`, a nota fica vermelha e tudo o que está abaixo dela fica azul; para a mesma cor, use as duas etiquetas com a mesma cor. Uma subnota com cor própria mantém-na; um \`color-children:\` próprio aplica-se à sua parte da árvore.
- Várias etiquetas de cor do mesmo tipo numa nota: vale a primeira (pela ordem do editor).
- **Às riscas:** acrescente \`+hatched\` à etiqueta de cor, por exemplo \`color:red+hatched\` ou \`color-children:blue+hatched\` (em alemão, \`farbe:rot+schraffiert\`). O preenchimento recebe riscas diagonais na cor e num tom mais claro dela; o título continua legível e as riscas crescem com o zoom.
- No ecrã e na imagem copiada, não na exportação nem na impressão. A raiz fica como está.

#### Ao copiar como imagem
*Copiar como imagem* (botão direito, \`Ctrl\`+\`C\` ou o botão na barra do mapa mental) inclui as cores na imagem, e as que estão às riscas com riscas. Para desativar: clique com o botão direito num nó → **Cor ▸** → **Cores ao copiar como imagem**; aplica-se neste navegador e funciona também no modo só de leitura. Requer o NoNotes 3.1.0 ou mais recente (desde a 2.4.0).

#### Com o botão direito
Clique com o botão direito num nó → **Cor ▸**: em cima, a cor da **nota**; em baixo, a das **subnotas**, cada uma com as 16 cores (substitui a atual, as riscas mantêm-se), **Sem cor** ou assinalar e desmarcar **Às riscas** (efeito imediato, só com cor). Se o nó fizer parte da seleção múltipla (\`Ctrl\`+clique), aplica-se a todos os nós selecionados; depois, a seleção é anulada. As etiquetas são escritas em inglês. Requer o NoNotes 2.8.0 ou mais recente.

#### Legenda
O botão **Legenda** na barra do mapa mental mostra uma nota que explica o significado das cores (uma por base de dados, igual para todos na área de trabalho). Um clique na legenda permite editá-la: Markdown, \`Ctrl\`+\`B\`, \`Ctrl\`+\`I\`, \`Ctrl\`+\`K\`; \`Esc\` ou um clique fora guarda. As etiquetas de cor no texto, como \`color:red\` ou \`color:blue+hatched\`, aparecem como amostra de cor com o nome. Se estiver vazia, começa com as cores que estão a ser usadas. Se mais tarde se acrescentarem cores, o botão **+** no cabeçalho da legenda acrescenta as que faltam como novas linhas no fim; o que já lá está fica intacto (desde a 2.3.0). A lista no cabeçalho escolhe o canto (em cima à direita, em cima à esquerda, em baixo à esquerda, em baixo à direita) e **–** recolhe a legenda; o navegador memoriza ambos. Na exportação para Markdown e na impressão, aparece por baixo da imagem do mapa mental. Requer o NoNotes 2.11.0 ou mais recente.

#### As 16 cores
{TAGS_EN} e ainda \`color:grey\`.

Em alemão: {TAGS_DE}.`,
    ui: {"farbe":"Cor","keine":"Sem cor","notiz":"Nota","kinder":"Subnotas","kinderTitel":"Cor de todas as subnotas; uma subnota com cor própria mantém-na","schraffiert":"Às riscas","schraffiertTitel":"Riscas diagonais na cor e num tom mais claro (requer uma cor)","bild":"Cores ao copiar como imagem","bildTitel":"Copiar como imagem (botão direito, Ctrl+C ou o botão na barra do mapa mental) inclui as cores na imagem; aplica-se neste navegador"},
    legende: {"titel":"Legenda","knopf":"Legenda","knopfTitel":"Mostrar ou ocultar a legenda: o significado das cores","zu":"Recolher","auf":"Expandir a legenda","ecke":"Posição da legenda","ergaenzen":"Acrescentar as cores em falta: as cores usadas que ainda não constam da legenda são acrescentadas como novas linhas no fim","ecken":{"or":"Em cima à direita","ol":"Em cima à esquerda","ul":"Em baixo à esquerda","ur":"Em baixo à direita"},"leer":"Clique para descrever o significado das cores.","hinweis":"Markdown · Ctrl+B, Ctrl+I, Ctrl+K · Esc ou um clique fora guarda","schraffiert":"às riscas","kinder":"subnotas","bedeutung":"…"},
    wort: {"fett":"negrito","kursiv":"itálico"},
  },
  'pt-br': {
    name: "Cores por tag",
    description: "Colore os nós do mapa mental por meio de tags como “color:red” (16 cores); “color-children:blue” colore as subnotas. Escolha da cor com clique direito (a partir do NoNotes 2.8.0), legenda acima do mapa mental (a partir da 2.11.0).",
    help: `Colore os **nós do mapa mental** por meio de uma tag: preenchimento mais claro, contorno mais escuro e o título na cor do contorno (no modo escuro, o contrário).

- Coloque uma tag na nota, por exemplo \`color:red\` (em alemão, \`farbe:rot\`). Maiúsculas e minúsculas não fazem diferença.
- **Colorir subnotas:** \`color-children:blue\` (\`farbe-kinder:blau\`) colore todas as subnotas, mas não a própria nota. Junto com \`color:red\`, a nota fica vermelha e tudo abaixo dela, azul; para a mesma cor, use as duas tags com a mesma cor. Uma subnota com cor própria a mantém; um \`color-children:\` próprio vale para a parte dela na árvore.
- Várias tags de cor do mesmo tipo em uma nota: vale a primeira (na ordem do editor).
- **Hachurado:** acrescente \`+hatched\` à tag de cor, por exemplo \`color:red+hatched\` ou \`color-children:blue+hatched\` (em alemão, \`farbe:rot+schraffiert\`). O preenchimento ganha listras diagonais na cor e em um tom mais claro dela; o título continua legível, e as listras crescem com o zoom.
- Na tela e na imagem copiada, não na exportação nem na impressão. A raiz fica como está.

#### Ao copiar como imagem
*Copiar como imagem* (clique direito, \`Ctrl\`+\`C\` ou o botão na barra do mapa mental) leva as cores para a imagem, e as hachuradas, com listras. Para desativar: clique direito em um nó → **Cor ▸** → **Cores ao copiar como imagem**; isso vale neste navegador e funciona também no modo somente leitura. Requer o NoNotes 3.1.0 ou mais recente (desde a versão 2.4.0).

#### Com clique direito
Clique direito em um nó → **Cor ▸**: em cima, a cor da **nota**; embaixo, a das **subnotas**, cada uma com as 16 cores (substitui a atual; o hachurado permanece), **Sem cor** ou marcar e desmarcar **Hachurado** (vale na hora, só com cor). Se o nó fizer parte da seleção múltipla (\`Ctrl\`+clique), vale para todos os selecionados; depois, a seleção é desfeita. As tags são escritas em inglês. Requer o NoNotes 2.8.0 ou mais recente.

#### Legenda
O botão **Legenda** na barra do mapa mental mostra uma nota que explica o que as cores significam (uma por banco de dados, igual para todos no espaço de trabalho). Um clique na legenda abre a edição: Markdown, \`Ctrl\`+\`B\`, \`Ctrl\`+\`I\`, \`Ctrl\`+\`K\`; \`Esc\` ou um clique fora dela salva. Tags de cor no texto, como \`color:red\` ou \`color:blue+hatched\`, aparecem como amostra de cor com o nome. Se estiver vazia, ela começa com as cores em uso no momento. Se depois surgirem outras cores, o botão **+** no cabeçalho da legenda acrescenta as que faltam como novas linhas no final; o que já está lá não é alterado (desde a versão 2.3.0). O seletor no cabeçalho escolhe o canto (superior direito, superior esquerdo, inferior esquerdo, inferior direito), e **–** recolhe a legenda; o navegador memoriza as duas coisas. Na exportação em Markdown e na impressão, ela aparece abaixo da imagem do mapa mental. Requer o NoNotes 2.11.0 ou mais recente.

#### As 16 cores
{TAGS_EN}, além de \`color:grey\`.

Em alemão: {TAGS_DE}.`,
    ui: {"farbe":"Cor","keine":"Sem cor","notiz":"Nota","kinder":"Subnotas","kinderTitel":"Cor de todas as subnotas; uma subnota com cor própria a mantém","schraffiert":"Hachurado","schraffiertTitel":"Listras diagonais na cor e em um tom mais claro dela (requer uma cor)","bild":"Cores ao copiar como imagem","bildTitel":"Copiar como imagem (clique direito, Ctrl+C ou o botão na barra do mapa mental) leva as cores para a imagem; vale neste navegador"},
    legende: {"titel":"Legenda","knopf":"Legenda","knopfTitel":"Mostrar ou ocultar a legenda: o que as cores significam","zu":"Recolher","auf":"Expandir legenda","ecke":"Posição da legenda","ergaenzen":"Acrescentar cores que faltam: as cores em uso que ainda não estão na legenda entram como novas linhas no final","ecken":{"or":"Canto superior direito","ol":"Canto superior esquerdo","ul":"Canto inferior esquerdo","ur":"Canto inferior direito"},"leer":"Clique para descrever o que as cores significam.","hinweis":"Markdown · Ctrl+B, Ctrl+I, Ctrl+K · Esc ou um clique fora salva","schraffiert":"hachurado","kinder":"subnotas","bedeutung":"…"},
    wort: {"fett":"negrito","kursiv":"itálico"},
  },
  /* </uebersetzungen> */
};
const tfJe = k => Object.fromEntries(Object.entries(TF_TEXTE).map(([l, v]) => [l, v[k]]));
const tfSprache = lang => { const l = String(lang || 'de').toLowerCase(); return TF_TEXTE[l] || TF_TEXTE[l.split('-')[0]] || TF_TEXTE.en; };
const tfHilfe = v => v.help.replace('{TAGS_DE}', tagListe('de')).replace('{TAGS_EN}', tagListe('en'));

NoNotesPlugins.register({
  id: 'tag-farben',
  name: TF_TEXTE.de.name,
  version: '2.5.0',
  api: 1,
  description: TF_TEXTE.de.description,
  names: tfJe('name'),
  descriptions: tfJe('description'),
  help: Object.fromEntries(Object.entries(TF_TEXTE).map(([l, v]) => [l, tfHilfe(v)])),

  activate(ctx) {
    const P = window.NoNotesPlugins;
    if (!P.EVENTS || !P.EVENTS.includes('mindmap:rendered')) {
      console.warn('Farben über Tags: braucht eine NoNotes-Version mit dem Ereignis mindmap:rendered'); // i18n-ignore
      return;
    }
    const STYLE_ID = 'tagFarbenStyle';
    const KLASSE = 'tf-';
    const byName = new Map();
    for (const f of FARBEN) { byName.set(f.id, f); byName.set(f.en, f); }
    byName.set('grey', byName.get('gray'));

    const musterName = new Map();
    for (const m of MUSTER) { musterName.set(m.id, m); musterName.set(m.en, m); }

    // «Farbe : Grün» → { art: 'notiz', farbe: Grün, schraffiert: false } · «color-children:blue+hatched» → { art: 'kinder',
    // farbe: Blau, schraffiert: true } · sonst null. Unbekannte Zusätze nach «+» zählen nicht, die Farbe gilt trotzdem.
    const fold = v => String(v).toLowerCase().trim().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/\s+/g, '-');
    function deuten(tag) {
      const m = /^([^:]+):(.+)$/.exec(String(tag || '').replace(/^#/, ''));
      if (!m) return null;
      const vor = fold(m[1]);
      const art = VORSILBEN.includes(vor) ? 'notiz' : VORSILBEN_KINDER.includes(vor) ? 'kinder' : null;
      const [name, ...zusatz] = m[2].split('+');
      const farbe = art && byName.get(fold(name));
      if (!farbe) return null;
      return { art, farbe, schraffiert: zusatz.some(z => (musterName.get(fold(z)) || {}).id === 'schraffiert') };
    }

    // Stylesheet: überschreibt nur den Grundzustand des Knotens. Darüber, Hover, Suche, Ziehen und Mehrfachauswahl der App
    // (stärkere Regeln) bleiben sichtbar; die Auswahl zeigt ihren Rand, die Fläche behält die Farbe.
    // Schraffiert: Muster aus dem <defs> der Mindmap (siehe musterZeichnen), mit :where() nicht stärker als die einfache Farbe
    const SCHRAFFIERT = KLASSE + 'schraffiert';
    const musterId = (f, scheme) => `tfSchraffur-${f.id}-${scheme}`;
    const regeln = scheme => FARBEN.map(f => {
      const c = f[scheme];
      return `g.${KLASSE}${f.id} > rect { fill: ${c.fill}; stroke: ${c.line}; }\n`
        + `g.mm-node.mm-selected.${KLASSE}${f.id} > rect { fill: ${c.fill}; }\n`
        + `g.${KLASSE}${f.id}:where(.${SCHRAFFIERT}) > rect { fill: url(#${musterId(f, scheme)}); }\n`
        + `g.mm-node.mm-selected.${KLASSE}${f.id}:where(.${SCHRAFFIERT}) > rect { fill: url(#${musterId(f, scheme)}); }\n`
        + `g.${KLASSE}${f.id} > text { fill: ${c.line}; }\n`;
    }).join('');
    // Farbfelder im Untermenü: gezeichnet wie ein gefärbter Knoten (Selektoren stärker als die Knöpfe des Kontextmenüs), mit
    // abgehakter Schraffur schraffiert
    const felder = scheme => FARBEN.map(f => {
      const c = f[scheme], st = tagFarbenStreifen(c, scheme);
      return `.tf-panel .tf-sw.tf-sw-${f.id}, .tf-legende .tf-lg-sw.tf-sw-${f.id} { background: ${c.fill}; border-color: ${c.line}; }\n`
        + `.tf-panel .tf-mit-schraffur .tf-sw.tf-sw-${f.id}, .tf-legende .tf-lg-sw.tf-lg-schraffiert.tf-sw-${f.id} { background: repeating-linear-gradient(45deg, ${c.fill} 0 ${STREIFEN}px, ${st} ${STREIFEN}px ${2 * STREIFEN}px); }\n`;
    }).join('');
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = regeln('light') + felder('light') + `@media (prefers-color-scheme: dark) {\n${regeln('dark')}${felder('dark')}}\n` + `
      .tf-panel { display: flex; flex-direction: column; gap: 4px; }
      .tf-panel .tf-grid { display: grid; grid-template-columns: repeat(4, auto); gap: 6px; padding: 4px 6px 6px; }
      .tf-panel .tf-sw { width: 34px; height: 26px; padding: 0; border: 2px solid; border-radius: 8px; display: block; cursor: pointer; }
      .tf-panel .tf-sw:hover { outline: 2px solid var(--muted); outline-offset: 2px; }
      .tf-panel .tf-sw[aria-pressed="true"] { outline: 2px solid var(--accent); outline-offset: 2px; }
      .tf-panel .tf-sw:focus-visible { outline: 2px solid var(--text); outline-offset: 2px; }
      .tf-panel .tf-teil { display: flex; flex-direction: column; gap: 4px; }
      .tf-panel .tf-titel { color: var(--muted); font-size: 12px; padding: 6px 10px 0; }
      .tf-panel .tf-check { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 6px; cursor: pointer; }
      .tf-panel .tf-check:hover { background: var(--hover); }
      .tf-panel .tf-check.tf-aus { opacity: .5; cursor: default; }
      .tf-panel .tf-check.tf-aus:hover { background: none; }
      .tf-legende { position: absolute; z-index: 6; width: 290px; max-height: calc(100% - var(--map-bar-bottom, 48px) - 24px); overflow: auto; background: var(--panel);
        color: var(--text); border: 1px solid var(--border); border-radius: 10px; box-shadow: var(--shadow); font-size: 13px; line-height: 1.45; }
      .tf-legende.tf-ecke-or { top: calc(var(--map-bar-bottom, 48px) + 8px); right: 12px; } .tf-legende.tf-ecke-ol { top: calc(var(--map-bar-bottom, 48px) + 8px); left: 12px; }
      .tf-legende.tf-ecke-ul { bottom: 12px; left: 12px; } .tf-legende.tf-ecke-ur { bottom: 12px; right: 12px; }
      .tf-legende .tf-lg-kopf { display: flex; align-items: center; gap: 6px; padding: 6px 8px 4px 10px; }
      .tf-legende .tf-lg-titel { all: unset; flex: 1; font-weight: 600; cursor: pointer; }
      .tf-legende .tf-lg-titel:focus-visible { outline: 2px solid var(--accent); border-radius: 4px; }
      .tf-legende .tf-lg-ecke { font-size: 11px; padding: 1px 2px; max-width: 105px; }
      .tf-legende .tf-lg-zu, .tf-legende .tf-lg-plus { padding: 0 8px; line-height: 1.4; }
      .tf-legende.tf-lg-eingeklappt .tf-lg-plus { display: none; }
      .tf-legende .tf-lg-inhalt { padding: 2px 12px 10px; cursor: text; }
      .tf-legende.tf-lg-nurlesen .tf-lg-inhalt { cursor: default; }
      .tf-legende .tf-lg-inhalt > :first-child { margin-top: 0; } .tf-legende .tf-lg-inhalt > :last-child { margin-bottom: 0; }
      .tf-legende .tf-lg-inhalt ul { padding-left: 18px; margin: 4px 0; }
      .tf-legende .tf-lg-leer { color: var(--muted); font-style: italic; }
      .tf-legende .tf-lg-sw { display: inline-block; width: 18px; height: 12px; border: 2px solid; border-radius: 4px; vertical-align: -2px; margin-right: 5px; }
      .tf-legende .tf-lg-sw.tf-lg-kinder { border-style: dashed; }
      .tf-legende .tf-lg-name { font-weight: 600; }
      .tf-legende .tf-lg-text { display: block; box-sizing: border-box; width: calc(100% - 16px); margin: 2px 8px 4px; min-height: 90px; font: 12px/1.45 ui-monospace, Menlo, Consolas, monospace; resize: vertical; }
      .tf-legende .tf-lg-hinweis { padding: 0 10px 8px; color: var(--muted); font-size: 11px; }
      .tf-legende.tf-lg-eingeklappt { width: auto; overflow: visible; }
      .tf-legende.tf-lg-eingeklappt .tf-lg-ecke, .tf-legende.tf-lg-eingeklappt .tf-lg-zu, .tf-legende.tf-lg-eingeklappt .tf-lg-inhalt { display: none; }
      .tf-legende.tf-lg-eingeklappt .tf-lg-titel::after { content: ' ▸'; }
      @media print { .tf-legende { display: none; } }
    `;
    document.head.appendChild(style);

    const leer = () => ({ notiz: new Map(), kinder: new Map() });
    let stand = leer(); // je Art: Notizkennung (Text) → { farbe, schraffiert } der Notiz bzw. ihrer Unternotizen
    let token = 0;
    let aktiv = true;

    /** Welche Notiz welches Farb-Tag hat: wenige Abfragen, unabhängig von der Zahl der Knoten (auch über das Netz). */
    async function laden() {
      const neu = leer(), erstesTag = { notiz: new Map(), kinder: new Map() };
      const tags = (await ctx.backend.listAllTags()).filter(t => t.count > 0).map(t => ({ name: t.name, d: deuten(t.name) })).filter(t => t.d);
      await Promise.all(tags.map(async ({ name, d }) => {
        const [lebend, archiv] = await Promise.all([
          ctx.backend.listNotes('', { tag: name }),
          ctx.backend.listNotes('', { tag: name, scope: 'archive' }),
        ]);
        for (const n of [...lebend, ...archiv]) {
          const id = String(n.id), erstes = erstesTag[d.art], vorher = erstes.get(id);
          if (vorher == null || name.toLowerCase() < vorher.toLowerCase()) { erstes.set(id, name); neu[d.art].set(id, { farbe: d.farbe, schraffiert: d.schraffiert }); }
        }
      }));
      return neu;
    }

    /** Farbe eines Knotens ({ farbe, schraffiert }): die eigene, sonst die Kinderfarbe der nächsten Elternnotiz, die eine hat. */
    function farbeVon(id, eltern) {
      const eigene = stand.notiz.get(id);
      if (eigene) return eigene;
      for (let p = eltern.get(id), n = 0; p && p !== 'root' && n < 10000; p = eltern.get(p), n++) {
        if (stand.kinder.has(p)) return stand.kinder.get(p);
      }
      return null;
    }

    /** Muster der Schraffur im <defs> der Mindmap: je Farbe hell und dunkel. In Einheiten der Mindmap, also mit dem Zoom wachsend. */
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const DEFS_ID = 'tagFarbenDefs';
    function musterZeichnen() {
      const svg = document.getElementById('mindmap');
      if (!svg || document.getElementById(DEFS_ID)) return;
      const make = (name, attrs) => { const e = document.createElementNS(SVG_NS, name); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
      const defs = make('defs', { id: DEFS_ID });
      for (const f of FARBEN) {
        for (const scheme of ['light', 'dark']) {
          const w = 2 * STREIFEN;
          const p = make('pattern', { id: musterId(f, scheme), patternUnits: 'userSpaceOnUse', width: w, height: w, patternTransform: 'rotate(45)' });
          p.append(make('rect', { width: w, height: w, fill: f[scheme].fill }), make('rect', { width: STREIFEN, height: w, fill: tagFarbenStreifen(f[scheme], scheme) }));
          defs.appendChild(p);
        }
      }
      svg.insertBefore(defs, svg.firstChild);
    }

    function malen() {
      if (aktiv) musterZeichnen();
      const eltern = new Map();
      for (const e of document.querySelectorAll('path.mm-edge[data-from][data-to]')) eltern.set(e.dataset.to, e.dataset.from);
      for (const g of document.querySelectorAll('g.mm-node[data-id]')) {
        const s = aktiv && !g.classList.contains('mm-root') ? farbeVon(g.dataset.id, eltern) : null;
        const soll = s ? [KLASSE + s.farbe.id, ...(s.schraffiert ? [SCHRAFFIERT] : [])] : [];
        for (const k of [...g.classList]) if (k.startsWith(KLASSE) && !soll.includes(k)) g.classList.remove(k);
        for (const k of soll) g.classList.add(k);
      }
    }

    // Beim Neuzeichnen sofort mit dem letzten Stand färben (kein Aufblitzen), dann die Tags neu lesen
    async function neu() {
      malen();
      const mine = ++token;
      let frisch;
      try { frisch = await laden(); } catch (e) { return; }
      if (mine !== token || !aktiv) return;
      stand = frisch;
      malen();
      if (legende) legende.auffrischen(); // der Knopf «+» hängt an den benutzten Farben
    }

    // ---- Rechtsklick auf einen Knoten (NoNotes ab 2.8.0): «Farbe ▸» --------------------------------------------------
    const englisch = !/^de\b/.test(ctx.language() || 'de'); // Tags englisch (color:…), ausser in deutscher Oberfläche
    const TX = tfSprache(ctx.language());
    const T = TX.ui;
    const anzeige = f => (TX.farben && TX.farben[f.id]) || (englisch ? f.en.charAt(0).toUpperCase() + f.en.slice(1) : f.name);
    const farbTag = (art, f) => (englisch ? `${art === 'kinder' ? 'color-children' : 'color'}:${f.en}`
      : `${art === 'kinder' ? 'farbe-kinder' : 'farbe'}:${f.name.toLowerCase()}`);
    const ohne = (art, tags) => tags.filter(t => { const d = deuten(t); return !(d && d.art === art); });
    const erstes = (art, tags) => tags.map(deuten).find(d => d && d.art === art) || null;
    /** Farb-Tag mit oder ohne «+schraffiert»; das Wort in der Sprache des Tags (farbe… deutsch, color… englisch). */
    function mitSchraffur(tag, an) {
      const i = tag.indexOf(':');
      const vor = tag.slice(0, i), [name, ...zusatz] = tag.slice(i + 1).split('+');
      const rest = zusatz.filter(z => (musterName.get(fold(z)) || {}).id !== 'schraffiert');
      if (an) rest.push(fold(vor).startsWith('farbe') ? 'schraffiert' : 'hatched');
      return [`${vor}:${name}`, ...rest].join('+');
    }

    /** Die Legende: Text (Markdown) in der Datenbank (meta LEGENDE_KEY, für alle im Arbeitsbereich gleich), Ecke und eingeklappt
     *  je Browser. Farb-Tags im Text («farbe:rot», «color:blue+hatched») erscheinen als Farbfeld. Ein Klick bearbeitet den Text
     *  (Ctrl+B, Ctrl+I, Ctrl+K), Esc oder ein Klick daneben speichert; während des Tippens wird nach kurzer Pause gespeichert.
     *  Im Export und Druck steht sie unter dem Mindmap-Bild, die Farben mit Namen. */
    function legendeAnlegen() {
      const L = TX.legende;
      const KEY = LEGENDE_KEY;
      const PREF = 'nonotes.tagFarben.legende';
      const E = window.NoNotesEditing, M = window.NoNotesMarkdown;
      const pref = (() => { try { return Object.assign({ ecke: 'or', zu: false, sichtbar: null }, JSON.parse(localStorage.getItem(PREF) || '{}')); } catch (e) { return { ecke: 'or', zu: false, sichtbar: null }; } })();
      const merken = () => { try { localStorage.setItem(PREF, JSON.stringify(pref)); } catch (e) { /* egal */ } };
      let text = '';
      let gelesen = false;
      let timer = null;
      let bearbeiten = false;

      const box = document.createElement('aside');
      box.className = 'tf-legende';
      box.setAttribute('aria-label', L.titel);
      const kopf = document.createElement('div');
      kopf.className = 'tf-lg-kopf';
      const titel = document.createElement('button');
      titel.type = 'button';
      titel.className = 'tf-lg-titel';
      titel.textContent = L.titel;
      const ecke = document.createElement('select');
      ecke.className = 'tf-lg-ecke';
      ecke.setAttribute('aria-label', L.ecke);
      ecke.title = L.ecke;
      for (const [k, v] of Object.entries(L.ecken)) { const o = document.createElement('option'); o.value = k; o.textContent = v; ecke.appendChild(o); }
      const zuKnopf = document.createElement('button');
      zuKnopf.type = 'button';
      zuKnopf.className = 'tf-lg-zu';
      zuKnopf.textContent = '–';
      zuKnopf.title = L.zu;
      zuKnopf.setAttribute('aria-label', L.zu);
      // Fehlende Farben ergänzen (2.3.0): nur sichtbar, wenn benutzte Farben in der Legende fehlen
      const plusKnopf = document.createElement('button');
      plusKnopf.type = 'button';
      plusKnopf.className = 'tf-lg-plus';
      plusKnopf.textContent = '+';
      plusKnopf.title = L.ergaenzen;
      plusKnopf.setAttribute('aria-label', L.ergaenzen);
      kopf.append(titel, plusKnopf, ecke, zuKnopf);
      const inhalt = document.createElement('div');
      inhalt.className = 'tf-lg-inhalt md';
      inhalt.tabIndex = 0;
      const feld = document.createElement('textarea');
      feld.className = 'tf-lg-text';
      feld.hidden = true;
      feld.setAttribute('aria-label', L.titel);
      const hinweis = document.createElement('div');
      hinweis.className = 'tf-lg-hinweis';
      hinweis.textContent = L.hinweis;
      hinweis.hidden = true;
      box.append(kopf, inhalt, feld, hinweis);
      const entfernen = ctx.ui.addMapOverlay(box);
      const knopf = ctx.ui.addMapButton({ label: L.knopf, title: L.knopfTitel, action: () => {
        pref.sichtbar = !istSichtbar();
        if (pref.sichtbar) pref.zu = false;
        merken();
        zeigen();
        if (pref.sichtbar && !text.trim() && !ctx.readOnly()) oeffnen();
      } });
      const offSection = ctx.export.addMapSection(() => (text.trim() ? { title: L.titel, markdown: fuerExport(text) } : null));

      const istSichtbar = () => (pref.sichtbar == null ? !!text.trim() : pref.sichtbar);

      /** «farbe:rot», «farbe-kinder:blau+schraffiert», «color:red» … im Text: [{ index, length, d }] */
      const TOKEN_RE = /(^|[^\w:])((?:farbe|color|colour)(?:-kinder|-children)?\s*:\s*[A-Za-zÄÖÜäöü-]+(?:\+[A-Za-zÄÖÜäöü-]+)*)/g;
      const name = d => anzeige(d.farbe) + (d.schraffiert ? ` (${L.schraffiert})` : '') + (d.art === 'kinder' ? ` – ${L.kinder}` : '');
      /** Für Export und Druck: Farb-Tags durch ihren Namen ersetzen. */
      function fuerExport(t) {
        return t.replace(TOKEN_RE, (all, vor, tok) => { const d = deuten(tok.replace(/\s+/g, '')); return d ? vor + '**' + name(d) + '**' : all; });
      }

      /** Text als Markdown, Farb-Tags als Farbfeld mit Namen. */
      function malenLegende() {
        if (!M) { inhalt.textContent = text; return; }
        inhalt.innerHTML = text.trim() ? M.render(text, {}) : `<p class="tf-lg-leer">${L.leer}</p>`;
        const walker = document.createTreeWalker(inhalt, NodeFilter.SHOW_TEXT);
        const nodes = [];
        for (let n = walker.nextNode(); n; n = walker.nextNode()) if (!n.parentElement.closest('code')) nodes.push(n);
        for (const node of nodes) {
          const s = node.nodeValue;
          TOKEN_RE.lastIndex = 0;
          const frag = document.createDocumentFragment();
          let last = 0, found = false;
          for (let m; (m = TOKEN_RE.exec(s));) {
            const d = deuten(m[2].replace(/\s+/g, ''));
            if (!d) continue;
            found = true;
            const start = m.index + m[1].length;
            frag.append(s.slice(last, start));
            const sw = document.createElement('span');
            sw.className = `tf-lg-sw tf-sw-${d.farbe.id}${d.schraffiert ? ' tf-lg-schraffiert' : ''}${d.art === 'kinder' ? ' tf-lg-kinder' : ''}`;
            sw.setAttribute('aria-hidden', 'true');
            const label = document.createElement('span');
            label.className = 'tf-lg-name';
            label.textContent = name(d);
            frag.append(sw, label);
            last = start + m[2].length;
          }
          if (!found) continue;
          frag.append(s.slice(last));
          node.replaceWith(frag);
        }
      }

      function zeigen() {
        const sicht = istSichtbar() || bearbeiten;
        box.hidden = !sicht;
        knopf.setAttribute('aria-pressed', String(sicht));
        knopf.hidden = ctx.readOnly() && !text.trim();
        box.className = `tf-legende tf-ecke-${pref.ecke}${pref.zu && !bearbeiten ? ' tf-lg-eingeklappt' : ''}${ctx.readOnly() ? ' tf-lg-nurlesen' : ''}`;
        ecke.value = pref.ecke;
        plusKnopf.hidden = ctx.readOnly() || !fehlende().length;
        titel.title = pref.zu ? L.auf : '';
        titel.setAttribute('aria-expanded', String(!pref.zu));
      }

      async function speichern() {
        clearTimeout(timer);
        timer = null;
        if (ctx.readOnly()) return;
        try { await ctx.backend.setMeta(KEY, text); } catch (e) { ctx.ui.setStatus(`${L.titel}: ${(e && e.message) || e}`, 'error'); }
      }

      /** Zeilen für die Farben, die gerade benutzt werden (je Farbe und Schraffur eine), ohne die in skip (Schlüssel «rot», «rot+»). */
      function zeilenFuer(skip) {
        const seen = new Map();
        for (const art of ['notiz', 'kinder']) for (const v of stand[art].values()) seen.set(v.farbe.id + (v.schraffiert ? '+' : ''), v);
        const tag = v => farbTag('notiz', v.farbe) + (v.schraffiert ? (englisch ? '+hatched' : '+schraffiert') : '');
        return [...seen.entries()].filter(([k]) => !(skip && skip.has(k))).map(([, v]) => v)
          .sort((a, b) => FARBEN.indexOf(a.farbe) - FARBEN.indexOf(b.farbe) || a.schraffiert - b.schraffiert).map(v => `- ${tag(v)}: ${L.bedeutung}`);
      }

      /** Vorlage für eine leere Legende: die Farben, die gerade benutzt werden. */
      function vorlage() { return zeilenFuer(null).join('\n'); }

      /** Farben, die der Text schon nennt (gleich ob für Notizen oder Unternotizen): Schlüssel «rot», «rot+» (schraffiert). */
      function genannt(t) {
        const out = new Set();
        TOKEN_RE.lastIndex = 0;
        for (let m; (m = TOKEN_RE.exec(t));) { const d = deuten(m[2].replace(/\s+/g, '')); if (d) out.add(d.farbe.id + (d.schraffiert ? '+' : '')); }
        return out;
      }

      /** Benutzte Farben, die in der Legende noch fehlen, als Zeilen. */
      const fehlende = () => (text.trim() ? zeilenFuer(genannt(text)) : []);

      /** Hängt die fehlenden Farben als neue Zeilen ans Ende; was dasteht, bleibt. Danach bearbeiten, die erste neue Bedeutung ausgewählt. */
      async function ergaenzen() {
        if (ctx.readOnly()) return;
        const neu = fehlende();
        if (!neu.length) { zeigen(); return; }
        const basis = bearbeiten ? feld.value : text;
        const davor = basis.replace(/\s+$/, '');
        const start = davor.length + (davor ? 1 : 0);
        text = (davor ? davor + '\n' : '') + neu.join('\n');
        if (bearbeiten) { feld.value = text; groesse(); await speichern(); } else { await speichern(); oeffnen(); }
        const i = feld.value.indexOf(L.bedeutung, start);
        feld.focus();
        if (i >= 0) feld.setSelectionRange(i, i + L.bedeutung.length);
        zeigen();
      }

      function oeffnen() {
        if (ctx.readOnly() || bearbeiten) return;
        bearbeiten = true;
        if (!text.trim()) text = vorlage();
        feld.value = text;
        inhalt.hidden = true;
        feld.hidden = false;
        hinweis.hidden = false;
        zeigen();
        groesse();
        feld.focus();
        const i = feld.value.indexOf(L.bedeutung);
        if (i >= 0) feld.setSelectionRange(i, i + L.bedeutung.length);
      }

      async function schliessen() {
        if (!bearbeiten) return;
        bearbeiten = false;
        text = feld.value.replace(/\s+$/, '');
        feld.hidden = true;
        hinweis.hidden = true;
        inhalt.hidden = false;
        if (text.trim() && pref.sichtbar === false) pref.sichtbar = true;
        malenLegende();
        zeigen();
        await speichern();
      }

      function groesse() { feld.style.height = 'auto'; feld.style.height = Math.min(feld.scrollHeight + 2, 360) + 'px'; }

      inhalt.addEventListener('click', e => { if (!e.target.closest('a')) oeffnen(); });
      inhalt.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); oeffnen(); } });
      feld.addEventListener('input', () => {
        text = feld.value;
        groesse();
        clearTimeout(timer);
        timer = setTimeout(speichern, 800);
      });
      feld.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); schliessen(); return; }
        const mod = e.ctrlKey || e.metaKey;
        if (!mod || !E) return;
        const k = e.key.toLowerCase();
        const s0 = feld.selectionStart, e0 = feld.selectionEnd;
        const r = k === 'b' ? E.wrap(feld.value, s0, e0, '**', '**', TX.wort.fett)
          : k === 'i' ? E.wrap(feld.value, s0, e0, '*', '*', TX.wort.kursiv)
          : k === 'k' ? E.link(feld.value, s0, e0) : null;
        if (!r) return;
        e.preventDefault();
        feld.value = r.text;
        feld.setSelectionRange(r.selStart, r.selEnd);
        feld.dispatchEvent(new Event('input'));
      });
      document.addEventListener('pointerdown', aussen, true);
      function aussen(e) { if (bearbeiten && !box.contains(e.target)) schliessen(); }
      titel.addEventListener('click', () => { pref.zu = !pref.zu; merken(); zeigen(); });
      zuKnopf.addEventListener('click', () => { pref.zu = true; merken(); zeigen(); });
      plusKnopf.addEventListener('click', () => { pref.zu = false; merken(); ergaenzen(); });
      ecke.addEventListener('change', () => { pref.ecke = ecke.value; merken(); zeigen(); });

      /** Text aus der Datenbank lesen (nach dem Einschalten, nach einem Wechsel der Datei, nach dem Neuzeichnen: im Dienst kann
       *  jemand anders ihn geändert haben). Während des Bearbeitens nicht. */
      async function nachladen(neuerBereich) {
        if (bearbeiten) return;
        let v = null;
        try { v = await ctx.backend.getMeta(KEY); } catch (e) { return; }
        if (bearbeiten) return;
        const next = v == null ? '' : String(v);
        if (gelesen && next === text && !neuerBereich) return;
        gelesen = true;
        text = next;
        malenLegende();
        zeigen();
      }

      zeigen();
      nachladen(true);
      return {
        nachladen,
        auffrischen: () => { if (!bearbeiten) zeigen(); },
        weg() { clearTimeout(timer); document.removeEventListener('pointerdown', aussen, true); offSection(); entfernen(); knopf.remove(); },
      };
    }

    /** Tags der Notizen ändern (nur wo sich etwas ändert), danach neu zeichnen. */
    async function aendern(ids, fn) {
      try {
        for (const id of ids) {
          const tags = await ctx.backend.getTags(id);
          const next = fn(tags);
          if (next.join('\n') !== tags.join('\n')) await ctx.backend.setTags(id, next);
        }
      } catch (e) {
        ctx.ui.setStatus(`${T.farbe}: ${(e && e.message) || e}`, 'error');
      }
      await ctx.refresh();
    }

    /** Das Untermenü: oben die Farbe der Notiz, unten die der Unternotizen. Ein Klick auf eine Farbe oder «Keine Farbe» ändert die
     *  Tags und schliesst das Menü (close(): die App hebt dann die Mehrfachauswahl auf, ab NoNotes 2.8.1); «Schraffiert» wirkt
     *  sofort und lässt das Menü offen (applied(), ab 2.8.1; die Auswahl wird beim Schliessen aufgehoben). */
    function farbFeld(target, close, applied) {
      const panel = document.createElement('div');
      panel.className = 'tf-panel';
      const knoepfe = { notiz: new Map(), kinder: new Map() };
      const haken = {};
      const nurLesen = !!(ctx.readOnly && ctx.readOnly()); // ctx.readOnly seit NoNotes 2.11.0
      for (const art of nurLesen ? [] : ['notiz', 'kinder']) {
        if (art === 'kinder') { const sep = document.createElement('div'); sep.className = 'sep'; panel.appendChild(sep); }
        const teil = document.createElement('div');
        teil.className = `tf-teil tf-${art}`;
        teil.setAttribute('role', 'group');
        const titel = document.createElement('div');
        titel.className = 'tf-titel';
        titel.id = `tf-titel-${art}`;
        titel.textContent = T[art];
        if (art === 'kinder') titel.title = T.kinderTitel;
        teil.setAttribute('aria-labelledby', titel.id);
        const grid = document.createElement('div');
        grid.className = 'tf-grid';
        for (const f of FARBEN) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = `tf-sw tf-sw-${f.id}`;
          b.dataset.farbe = f.id;
          b.title = anzeige(f);
          b.setAttribute('aria-label', anzeige(f));
          b.setAttribute('aria-pressed', 'false');
          // Neue Farbe, die Schraffur bleibt
          b.addEventListener('click', () => {
            close();
            aendern(target.ids, tags => { const alt = erstes(art, tags); return [...ohne(art, tags), mitSchraffur(farbTag(art, f), !!(alt && alt.schraffiert))]; });
          });
          knoepfe[art].set(f.id, b);
          grid.appendChild(b);
        }
        const keine = document.createElement('button');
        keine.type = 'button';
        keine.className = 'tf-none';
        keine.textContent = T.keine;
        keine.addEventListener('click', () => { close(); aendern(target.ids, tags => ohne(art, tags)); });
        const label = document.createElement('label');
        label.className = 'tf-check';
        label.title = T.schraffiertTitel;
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.className = 'tf-schraffur';
        box.disabled = true; // bis der Stand geladen ist
        box.addEventListener('change', () => {
          box.indeterminate = false;
          grid.classList.toggle('tf-mit-schraffur', box.checked);
          if (applied) applied();
          const an = box.checked;
          aendern(target.ids, tags => tags.map(t => { const d = deuten(t); return d && d.art === art ? mitSchraffur(t, an) : t; }));
        });
        label.append(box, T.schraffiert);
        haken[art] = { box, label, grid };
        teil.append(titel, grid, keine, label);
        panel.appendChild(teil);
      }

      // Farben beim Kopieren als Bild (2.4.0): ein Schalter für diesen Browser, auch im Lesemodus; wirkt sofort, das Menü bleibt offen
      if (kannBild) {
        if (!nurLesen) { const sep = document.createElement('div'); sep.className = 'sep'; panel.appendChild(sep); }
        const label = document.createElement('label');
        label.className = 'tf-check tf-bild';
        label.title = T.bildTitel;
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.checked = bildAn();
        box.addEventListener('change', () => bildSetzen(box.checked));
        label.append(box, T.bild);
        panel.appendChild(label);
      }
      if (nurLesen) { panel.dataset.stand = 'geladen'; return panel; }

      // Stand der gewählten Notizen: je Art die gemeinsame Farbe markieren (bei verschiedenen keine); Schraffiert an (alle mit Farbe),
      // aus oder gemischt; ohne Farbe in diesem Teil lässt sich nicht schraffieren
      Promise.all(target.ids.map(id => ctx.backend.getTags(id))).then(alle => {
        for (const art of ['notiz', 'kinder']) {
          const stile = alle.map(tags => erstes(art, tags));
          const farben = new Set(stile.map(d => (d ? d.farbe.id : '')));
          const k = farben.size === 1 && knoepfe[art].get([...farben][0]);
          if (k) k.setAttribute('aria-pressed', 'true');
          const mitFarbe = stile.filter(Boolean).length, mitMuster = stile.filter(d => d && d.schraffiert).length;
          const h = haken[art];
          h.box.disabled = mitFarbe === 0;
          h.label.classList.toggle('tf-aus', mitFarbe === 0);
          h.box.checked = mitMuster > 0 && mitMuster === mitFarbe;
          h.box.indeterminate = mitMuster > 0 && mitMuster < mitFarbe;
          h.grid.classList.toggle('tf-mit-schraffur', h.box.checked);
        }
        panel.dataset.stand = 'geladen';
      }).catch(() => {});
      return panel;
    }

    // ---- Farben im kopierten Bild (NoNotes ab 3.1.0: ctx.export.addMapStyle) --------------------------------------------------
    // Nur beim Kopieren als Bild und nur, wenn der Schalter im Untermenü an ist (Standard: an, je Browser). Das Bild ist immer hell,
    // darum die helle Fassung; schraffierte Knoten bekommen ein Muster wie auf dem Schirm bei Zoom 100 %. Export und Druck bleiben
    // ohne Farben.
    const BILD_PREF = 'nonotes.tagFarben.bild';
    const bildAn = () => { try { return localStorage.getItem(BILD_PREF) !== '0'; } catch (e) { return true; } };
    const bildSetzen = an => { try { localStorage.setItem(BILD_PREF, an ? '1' : '0'); } catch (e) { /* egal */ } };
    const kannBild = !!(ctx.export && ctx.export.addMapStyle);
    if (kannBild) {
      ctx.export.addMapStyle(async ({ target, ids }) => {
        if (target !== 'copy' || !aktiv || !bildAn()) return null;
        if (!stand.notiz.size && !stand.kinder.size) stand = await laden();
        const eltern = new Map((await ctx.backend.getTree({ archive: true })).map(r => [String(r.id), r.parent_id == null ? 'root' : String(r.parent_id)]));
        const nodes = {}, muster = new Map();
        for (const id of ids) {
          const st = farbeVon(String(id), eltern);
          if (!st) continue;
          const c = st.farbe.light, mid = `tfBild-${st.farbe.id}`;
          if (st.schraffiert) muster.set(mid, st.farbe);
          nodes[id] = { fill: st.schraffiert ? `url(#${mid})` : c.fill, stroke: c.line, text: c.line };
        }
        const w = 2 * STREIFEN;
        const defs = [...muster].map(([mid, f]) => `<pattern id="${mid}" patternUnits="userSpaceOnUse" width="${w}" height="${w}" patternTransform="rotate(45)">`
          + `<rect width="${w}" height="${w}" fill="${f.light.fill}"/><rect width="${STREIFEN}" height="${w}" fill="${tagFarbenStreifen(f.light, 'light')}"/></pattern>`).join('');
        return { nodes, defs };
      });
    }

    // Mit dem Schalter für das Bild gibt es das Untermenü auch im Lesemodus (dann nur mit dem Schalter)
    if (ctx.ui.addContextMenuItem) ctx.ui.addContextMenuItem({ label: T.farbe, write: !kannBild, panel: (target, api) => farbFeld(target, api.close, api.applied) });

    // ---- Legende (NoNotes ab 2.11.0): was die Farben bedeuten, oben rechts (oder in einer anderen Ecke) über der Mindmap ----------
    const legende = ctx.ui.addMapOverlay && ctx.export ? legendeAnlegen() : null;

    ctx.on('mindmap:rendered', () => { if (legende) legende.nachladen(); return neu(); });
    // Andere Datei oder anderer Bereich: dieselben Nummern sind andere Notizen. Den Stand verwerfen, sofort ohne Farben zeichnen
    // und neu laden (NoNotes ab 2.8.1 meldet das vor dem Zeichnen, ältere danach: dann korrigiert das hier die Farben)
    ctx.on('database:replaced', () => { token++; stand = leer(); if (legende) legende.nachladen(true); return neu(); });
    neu(); // die Mindmap ist beim Einschalten eventuell schon gezeichnet

    ausschalten = () => {
      aktiv = false;
      token++;
      malen();
      style.remove();
      if (legende) legende.weg();
      const defs = document.getElementById(DEFS_ID);
      if (defs) defs.remove();
    };
  },

  deactivate() {
    if (ausschalten) ausschalten();
    ausschalten = null;
  },
});
