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
     Geschrieben wird in der Sprache der Oberfläche («farbe:rot» bzw. «color:red»).
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

NoNotesPlugins.register({
  id: 'tag-farben',
  name: 'Farben über Tags',
  version: '2.4.0',
  api: 1,
  help: {
    de: `Färbt **Knoten der Mindmap** über ein Tag: Fläche heller, Umrandung dunkler, der Titel in der Farbe der Umrandung (im dunklen Modus umgekehrt).

- Tag an der Notiz setzen, zum Beispiel \`farbe:rot\` (englisch \`color:red\`). Gross-/Kleinschreibung ist egal.
- **Unternotizen färben:** \`farbe-kinder:blau\` (\`color-children:blue\`) färbt alle Unternotizen, die Notiz selbst nicht. Zusammen mit \`farbe:rot\` ist die Notiz rot und alles darunter blau; für dieselbe Farbe beide Tags mit derselben Farbe. Eine Unternotiz mit eigener Farbe behält sie, ein eigenes \`farbe-kinder:\` gilt für ihren Teil des Baums.
- Mehrere Farb-Tags derselben Art an einer Notiz: das erste gilt (Reihenfolge wie im Editor).
- **Schraffiert:** \`+schraffiert\` am Farb-Tag, etwa \`farbe:rot+schraffiert\` oder \`farbe-kinder:blau+schraffiert\` (englisch \`color:red+hatched\`). Die Fläche bekommt diagonale Streifen in der Farbe und einer helleren Fassung davon; der Titel bleibt lesbar, die Streifen wachsen mit dem Zoom.
- Auf dem Bildschirm und im kopierten Bild, nicht in Export und Druck. Die Wurzel bleibt, wie sie ist.

#### Beim Kopieren als Bild
*Als Bild kopieren* (Rechtsklick, \`Ctrl\`+\`C\` oder der Knopf in der Leiste der Mindmap) übernimmt die Farben ins Bild, schraffierte mit Streifen. Abschalten: Rechtsklick auf einen Knoten → **Farbe ▸** → **Farben beim Kopieren als Bild**; das gilt in diesem Browser und geht auch im Lesemodus. Braucht NoNotes 3.1.0 oder neuer (seit 2.4.0).

#### Per Rechtsklick
Rechtsklick auf einen Knoten → **Farbe ▸**: oben die Farbe der **Notiz**, unten die der **Unternotizen**, je eine der 16 Farben (ersetzt die bisherige, die Schraffur bleibt), **Keine Farbe** oder **Schraffiert** an- und abhaken (wirkt sofort, nur mit Farbe). Gehört der Knoten zur Mehrfachauswahl (\`Ctrl\`+Klick), gilt es für alle ausgewählten; danach ist die Auswahl aufgehoben. Die Tags werden in der Sprache der Oberfläche geschrieben. Braucht NoNotes 2.8.0 oder neuer.

#### Legende
Der Knopf **Legende** in der Leiste der Mindmap blendet eine Notiz ein, die erklärt, was die Farben bedeuten (eine je Datenbank, für alle im Arbeitsbereich gleich). Ein Klick in die Legende bearbeitet sie: Markdown, \`Ctrl\`+\`B\`, \`Ctrl\`+\`I\`, \`Ctrl\`+\`K\`; \`Esc\` oder ein Klick daneben speichert. Farb-Tags im Text wie \`farbe:rot\` oder \`farbe:blau+schraffiert\` erscheinen als Farbfeld mit Namen. Ist sie leer, beginnt sie mit den Farben, die gerade benutzt werden. Kommen später Farben dazu, ergänzt der Knopf **+** im Kopf der Legende die fehlenden als neue Zeilen am Ende; was schon dasteht, bleibt unberührt (seit 2.3.0). Die Ecke (oben rechts, oben links, unten links, unten rechts) wählt die Auswahl im Kopf, **–** klappt sie ein; beides merkt sich der Browser. Im Markdown-Export und im Druck steht sie unter dem Mindmap-Bild. Braucht NoNotes 2.11.0 oder neuer.

#### Die 16 Farben
${tagListe('de')}

Englisch: ${tagListe('en')}, dazu \`color:grey\`.`,
    en: `Colours **mind map nodes** by tag: lighter fill, darker outline, the title in the outline colour (reversed in dark mode).

- Put a tag on the note, for example \`color:red\` (German \`farbe:rot\`). Case does not matter.
- **Colour subnotes:** \`color-children:blue\` (\`farbe-kinder:blau\`) colours all subnotes, not the note itself. Together with \`color:red\` the note is red and everything below it blue; for the same colour, use both tags with the same colour. A subnote with a colour of its own keeps it; its own \`color-children:\` applies to its part of the tree.
- Several colour tags of the same kind on one note: the first one wins (order as in the editor).
- **Hatched:** add \`+hatched\` to the colour tag, for example \`color:red+hatched\` or \`color-children:blue+hatched\` (German \`farbe:rot+schraffiert\`). The fill gets diagonal stripes in the colour and a lighter shade of it; the title stays legible, the stripes grow with the zoom.
- On screen and in the copied image, not in export and print. The root stays as it is.

#### When copying as an image
*Copy as image* (right-click, \`Ctrl\`+\`C\` or the button in the mind map toolbar) includes the colours in the image, hatched ones with stripes. To turn this off: right-click a node → **Colour ▸** → **Colours when copying as image**; it applies in this browser and also works in read-only mode. Needs NoNotes 3.1.0 or later (since 2.4.0).

#### By right-click
Right-click a node → **Colour ▸**: the colour of the **note** at the top, that of its **subnotes** below, each with the 16 colours (replaces the current one, hatching stays), **No colour** or tick **Hatched** (takes effect at once, only with a colour). If the node is part of the multiple selection (\`Ctrl\`+click), it applies to all selected nodes; the selection is cleared afterwards. Tags are written in the language of the interface. Needs NoNotes 2.8.0 or later.

#### Legend
The **Legend** button in the mind map toolbar shows a note that explains what the colours mean (one per database, the same for everyone in the workspace). Click into the legend to edit it: Markdown, \`Ctrl\`+\`B\`, \`Ctrl\`+\`I\`, \`Ctrl\`+\`K\`; \`Esc\` or a click outside saves. Colour tags in the text such as \`color:red\` or \`color:blue+hatched\` appear as a swatch with the name. When empty, it starts with the colours currently in use. When colours are added later, the **+** button in its header adds the missing ones as new lines at the end; what is already there stays untouched (since 2.3.0). The selector in its header picks the corner (top right, top left, bottom left, bottom right), **–** collapses it; the browser remembers both. In the Markdown export and in print it appears below the mind map image. Needs NoNotes 2.11.0 or later.

#### The 16 colours
${tagListe('en')}, also \`color:grey\`.

German: ${tagListe('de')}.`,
  },
  description: 'Färbt Knoten der Mindmap über Tags wie «farbe:rot» (16 Farben); «farbe-kinder:blau» färbt die Unternotizen. Farbwahl per Rechtsklick (ab NoNotes 2.8.0), Legende über der Mindmap (ab 2.11.0).',

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
    const englisch = !/^de\b/.test(ctx.language() || 'de');
    const T = englisch
      ? { farbe: 'Colour', keine: 'No colour', notiz: 'Note', kinder: 'Subnotes', kinderTitel: 'Colour of all subnotes; a subnote with a colour of its own keeps it', schraffiert: 'Hatched', schraffiertTitel: 'Diagonal stripes in the colour and a lighter shade (needs a colour)',
        bild: 'Colours when copying as image', bildTitel: 'Copy as image (right-click, Ctrl+C or the button in the mind map toolbar) includes the colours; remembered in this browser' }
      : { farbe: 'Farbe', keine: 'Keine Farbe', notiz: 'Notiz', kinder: 'Unternotizen', kinderTitel: 'Farbe aller Unternotizen; eine Unternotiz mit eigener Farbe behält sie', schraffiert: 'Schraffiert', schraffiertTitel: 'Diagonale Streifen in der Farbe und einer helleren Fassung (braucht eine Farbe)',
        bild: 'Farben beim Kopieren als Bild', bildTitel: 'Als Bild kopieren (Rechtsklick, Ctrl+C oder der Knopf in der Leiste der Mindmap) übernimmt die Farben ins Bild; gilt in diesem Browser' };
    const anzeige = f => (englisch ? f.en.charAt(0).toUpperCase() + f.en.slice(1) : f.name);
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
      const L = englisch
        ? { titel: 'Legend', knopf: 'Legend', knopfTitel: 'Show or hide the legend: what the colours mean', zu: 'Collapse', auf: 'Expand legend', ecke: 'Position of the legend',
            ergaenzen: 'Add missing colours: colours in use that the legend does not mention yet come as new lines at the end',
            ecken: { or: 'Top right', ol: 'Top left', ul: 'Bottom left', ur: 'Bottom right' }, leer: 'Click to describe what the colours mean.',
            hinweis: 'Markdown · Ctrl+B, Ctrl+I, Ctrl+K · Esc or a click outside saves', schraffiert: 'hatched', kinder: 'subnotes', bedeutung: '…' }
        : { titel: 'Legende', knopf: 'Legende', knopfTitel: 'Legende ein- oder ausblenden: was die Farben bedeuten', zu: 'Einklappen', auf: 'Legende aufklappen', ecke: 'Lage der Legende',
            ergaenzen: 'Fehlende Farben ergänzen: benutzte Farben, die in der Legende noch fehlen, kommen als neue Zeilen ans Ende',
            ecken: { or: 'Oben rechts', ol: 'Oben links', ul: 'Unten links', ur: 'Unten rechts' }, leer: 'Klicken, um zu beschreiben, was die Farben bedeuten.',
            hinweis: 'Markdown · Ctrl+B, Ctrl+I, Ctrl+K · Esc oder Klick daneben speichert', schraffiert: 'schraffiert', kinder: 'Unternotizen', bedeutung: '…' };
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
        const r = k === 'b' ? E.wrap(feld.value, s0, e0, '**', '**', englisch ? 'bold' : 'fett')
          : k === 'i' ? E.wrap(feld.value, s0, e0, '*', '*', englisch ? 'italic' : 'kursiv')
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
