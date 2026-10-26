/* NoNotes-Erweiterung «Farben über Tags»: färbt Knoten der Mindmap nach einem Tag wie «farbe:rot» (englisch «color:red»).

   - Fläche heller, Umrandung dunkler, der Titel in der Farbe der Umrandung; im dunklen Modus des Systems umgekehrt.
   - 16 Farben, siehe FARBEN unten. Gross-/Kleinschreibung ist egal, «farbe:grün» und «farbe:gruen» gehen beide.
   - «farbe-kinder:blau» («color-children:blue») färbt alle Unternotizen, die Notiz selbst nicht; mit «farbe:» zusammen
     können Notiz und Unternotizen verschiedene Farben haben. Eine Unternotiz mit eigener Farbe behält sie; hat sie selbst
     ein «farbe-kinder:», gilt das für ihren Teil des Baums.
   - Mehrere Farb-Tags derselben Art an einer Notiz: es gilt das erste in der Reihenfolge, in der der Editor die Tags zeigt.
   - Zusätze nach «+» am Farb-Tag (seit 2.1.0): «farbe:rot+schraffiert» («color:red+hatched») zeichnet die Fläche schraffiert,
     abwechselnd in der Farbe und einer daraus berechneten helleren Fassung; auch «farbe-kinder:blau+schraffiert».
   - Nur auf dem Bildschirm: Export und Druck zeichnen die Mindmap ohne diese Farben. Die Wurzel bleibt, wie sie ist.
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

const tagListe = sprache => FARBEN.map(f => `\`${sprache === 'en' ? 'color:' + f.en : 'farbe:' + f.id}\``).join(', ');

NoNotesPlugins.register({
  id: 'tag-farben',
  name: 'Farben über Tags',
  version: '2.1.0',
  api: 1,
  help: {
    de: `Färbt **Knoten der Mindmap** über ein Tag: Fläche heller, Umrandung dunkler, der Titel in der Farbe der Umrandung (im dunklen Modus umgekehrt).

- Tag an der Notiz setzen, zum Beispiel \`farbe:rot\` (englisch \`color:red\`). Gross-/Kleinschreibung ist egal.
- **Unternotizen färben:** \`farbe-kinder:blau\` (\`color-children:blue\`) färbt alle Unternotizen, die Notiz selbst nicht. Zusammen mit \`farbe:rot\` ist die Notiz rot und alles darunter blau; für dieselbe Farbe beide Tags mit derselben Farbe. Eine Unternotiz mit eigener Farbe behält sie, ein eigenes \`farbe-kinder:\` gilt für ihren Teil des Baums.
- Mehrere Farb-Tags derselben Art an einer Notiz: das erste gilt (Reihenfolge wie im Editor).
- **Schraffiert:** \`+schraffiert\` am Farb-Tag, etwa \`farbe:rot+schraffiert\` oder \`farbe-kinder:blau+schraffiert\` (englisch \`color:red+hatched\`). Die Fläche bekommt diagonale Streifen in der Farbe und einer helleren Fassung davon; der Titel bleibt lesbar, die Streifen wachsen mit dem Zoom.
- Nur auf dem Bildschirm, nicht in Export und Druck. Die Wurzel bleibt, wie sie ist.

#### Per Rechtsklick
Rechtsklick auf einen Knoten → **Farbe ▸**: oben die Farbe der **Notiz**, unten die der **Unternotizen**, je eine der 16 Farben (ersetzt die bisherige, die Schraffur bleibt), **Keine Farbe** oder **Schraffiert** an- und abhaken (wirkt sofort, nur mit Farbe). Gehört der Knoten zur Mehrfachauswahl (\`Ctrl\`+Klick), gilt es für alle ausgewählten; danach ist die Auswahl aufgehoben. Die Tags werden in der Sprache der Oberfläche geschrieben. Braucht NoNotes 2.8.0 oder neuer.

#### Die 16 Farben
${tagListe('de')}

Englisch: ${tagListe('en')}, dazu \`color:grey\`.`,
    en: `Colours **mind map nodes** by tag: lighter fill, darker outline, the title in the outline colour (reversed in dark mode).

- Put a tag on the note, for example \`color:red\` (German \`farbe:rot\`). Case does not matter.
- **Colour subnotes:** \`color-children:blue\` (\`farbe-kinder:blau\`) colours all subnotes, not the note itself. Together with \`color:red\` the note is red and everything below it blue; for the same colour, use both tags with the same colour. A subnote with a colour of its own keeps it; its own \`color-children:\` applies to its part of the tree.
- Several colour tags of the same kind on one note: the first one wins (order as in the editor).
- **Hatched:** add \`+hatched\` to the colour tag, for example \`color:red+hatched\` or \`color-children:blue+hatched\` (German \`farbe:rot+schraffiert\`). The fill gets diagonal stripes in the colour and a lighter shade of it; the title stays legible, the stripes grow with the zoom.
- On screen only, not in export and print. The root stays as it is.

#### By right-click
Right-click a node → **Colour ▸**: the colour of the **note** at the top, that of its **subnotes** below, each with the 16 colours (replaces the current one, hatching stays), **No colour** or tick **Hatched** (takes effect at once, only with a colour). If the node is part of the multiple selection (\`Ctrl\`+click), it applies to all selected nodes; the selection is cleared afterwards. Tags are written in the language of the interface. Needs NoNotes 2.8.0 or later.

#### The 16 colours
${tagListe('en')}, also \`color:grey\`.

German: ${tagListe('de')}.`,
  },
  description: 'Färbt Knoten der Mindmap über Tags wie «farbe:rot» (16 Farben); «farbe-kinder:blau» färbt die Unternotizen. Farbwahl per Rechtsklick (ab NoNotes 2.8.0).',

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
      return `.tf-panel .tf-sw.tf-sw-${f.id} { background: ${c.fill}; border-color: ${c.line}; }\n`
        + `.tf-panel .tf-mit-schraffur .tf-sw.tf-sw-${f.id} { background: repeating-linear-gradient(45deg, ${c.fill} 0 ${STREIFEN}px, ${st} ${STREIFEN}px ${2 * STREIFEN}px); }\n`;
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
    }

    // ---- Rechtsklick auf einen Knoten (NoNotes ab 2.8.0): «Farbe ▸» --------------------------------------------------
    const englisch = !/^de\b/.test(ctx.language() || 'de');
    const T = englisch
      ? { farbe: 'Colour', keine: 'No colour', notiz: 'Note', kinder: 'Subnotes', kinderTitel: 'Colour of all subnotes; a subnote with a colour of its own keeps it', schraffiert: 'Hatched', schraffiertTitel: 'Diagonal stripes in the colour and a lighter shade (needs a colour)' }
      : { farbe: 'Farbe', keine: 'Keine Farbe', notiz: 'Notiz', kinder: 'Unternotizen', kinderTitel: 'Farbe aller Unternotizen; eine Unternotiz mit eigener Farbe behält sie', schraffiert: 'Schraffiert', schraffiertTitel: 'Diagonale Streifen in der Farbe und einer helleren Fassung (braucht eine Farbe)' };
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
      for (const art of ['notiz', 'kinder']) {
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

    if (ctx.ui.addContextMenuItem) ctx.ui.addContextMenuItem({ label: T.farbe, panel: (target, api) => farbFeld(target, api.close, api.applied) });

    ctx.on('mindmap:rendered', neu);
    // Andere Datei oder anderer Bereich: dieselben Nummern sind andere Notizen. Den Stand verwerfen, sofort ohne Farben zeichnen
    // und neu laden (NoNotes ab 2.8.1 meldet das vor dem Zeichnen, ältere danach: dann korrigiert das hier die Farben)
    ctx.on('database:replaced', () => { token++; stand = leer(); return neu(); });
    neu(); // die Mindmap ist beim Einschalten eventuell schon gezeichnet

    ausschalten = () => {
      aktiv = false;
      token++;
      malen();
      style.remove();
      const defs = document.getElementById(DEFS_ID);
      if (defs) defs.remove();
    };
  },

  deactivate() {
    if (ausschalten) ausschalten();
    ausschalten = null;
  },
});
