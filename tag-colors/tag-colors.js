/* NoNotes-Erweiterung «Farben über Tags»: färbt Knoten der Mindmap nach einem Tag wie «farbe:rot» (englisch «color:red»).

   - Fläche heller, Umrandung dunkler, der Titel in der Farbe der Umrandung; im dunklen Modus des Systems umgekehrt.
   - 16 Farben, siehe FARBEN unten. Gross-/Kleinschreibung ist egal, «farbe:grün» und «farbe:gruen» gehen beide.
   - «farbe:auch-kinder» («color:with-children») zusätzlich an derselben Notiz gibt ihre Farbe an alle Unternotizen weiter.
     Eine Unternotiz mit eigener Farbe behält sie; hat auch sie «auch-kinder», gilt ihre Farbe für ihren Teil des Baums.
   - Mehrere Farb-Tags an einer Notiz: es gilt das erste in der Reihenfolge, in der der Editor die Tags zeigt.
   - Nur auf dem Bildschirm: Export und Druck zeichnen die Mindmap ohne diese Farben. Die Wurzel bleibt, wie sie ist.
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
const VORSILBEN = ['farbe', 'color', 'colour'];          // vor dem Doppelpunkt
const AUCH_KINDER = ['auch-kinder', 'with-children'];    // nach dem Doppelpunkt: Farbe an die Unternotizen weitergeben
/* --------------------------------------------------------------------------------------------------------------- */

let ausschalten = null; // aus activate: nimmt Stylesheet und Klassen wieder weg

const tagListe = sprache => FARBEN.map(f => `\`${sprache === 'en' ? 'color:' + f.en : 'farbe:' + f.id}\``).join(', ');

NoNotesPlugins.register({
  id: 'tag-farben',
  name: 'Farben über Tags',
  version: '1.0.0',
  api: 1,
  help: {
    de: `Färbt **Knoten der Mindmap** über ein Tag: Fläche heller, Umrandung dunkler, der Titel in der Farbe der Umrandung (im dunklen Modus umgekehrt).

- Tag an der Notiz setzen, zum Beispiel \`farbe:rot\` (englisch \`color:red\`). Gross-/Kleinschreibung ist egal.
- **Unternotizen mitfärben:** zusätzlich \`farbe:auch-kinder\` (\`color:with-children\`). Eine Unternotiz mit eigener Farbe behält sie.
- Mehrere Farb-Tags an einer Notiz: das erste gilt (Reihenfolge wie im Editor).
- Nur auf dem Bildschirm, nicht in Export und Druck. Die Wurzel bleibt, wie sie ist.

#### Die 16 Farben
${tagListe('de')}

Englisch: ${tagListe('en')}, dazu \`color:grey\`.`,
    en: `Colours **mind map nodes** by tag: lighter fill, darker outline, the title in the outline colour (reversed in dark mode).

- Put a tag on the note, for example \`color:red\` (German \`farbe:rot\`). Case does not matter.
- **Colour subnotes too:** add \`color:with-children\` (\`farbe:auch-kinder\`). A subnote with a colour of its own keeps it.
- Several colour tags on one note: the first one wins (order as in the editor).
- On screen only, not in export and print. The root stays as it is.

#### The 16 colours
${tagListe('en')}, also \`color:grey\`.

German: ${tagListe('de')}.`,
  },
  description: 'Färbt Knoten der Mindmap über Tags wie «farbe:rot» (16 Farben); «farbe:auch-kinder» färbt die Unternotizen mit.',

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

    // «Farbe : Grün» → { farbe: Grün } · «color:with-children» → { auchKinder: true } · sonst null
    const fold = v => String(v).toLowerCase().trim().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/\s+/g, '-');
    function deuten(tag) {
      const m = /^([^:]+):(.+)$/.exec(String(tag || '').replace(/^#/, ''));
      if (!m || !VORSILBEN.includes(fold(m[1]))) return null;
      const wert = fold(m[2]);
      if (AUCH_KINDER.includes(wert)) return { auchKinder: true };
      const farbe = byName.get(wert);
      return farbe ? { farbe } : null;
    }

    // Stylesheet: überschreibt nur den Grundzustand des Knotens. Darüber, Hover, Suche, Ziehen und Mehrfachauswahl der App
    // (stärkere Regeln) bleiben sichtbar; die Auswahl zeigt ihren Rand, die Fläche behält die Farbe.
    const regeln = scheme => FARBEN.map(f => {
      const c = f[scheme];
      return `g.${KLASSE}${f.id} > rect { fill: ${c.fill}; stroke: ${c.line}; }\n`
        + `g.mm-node.mm-selected.${KLASSE}${f.id} > rect { fill: ${c.fill}; }\n`
        + `g.${KLASSE}${f.id} > text { fill: ${c.line}; }\n`;
    }).join('');
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = regeln('light') + `@media (prefers-color-scheme: dark) {\n${regeln('dark')}}\n`;
    document.head.appendChild(style);

    let stand = { farbe: new Map(), auchKinder: new Set() }; // Notizkennung (Text) → Farbe; Kennungen mit «auch-kinder»
    let token = 0;
    let aktiv = true;

    /** Welche Notiz welches Farb-Tag hat: wenige Abfragen, unabhängig von der Zahl der Knoten (auch über das Netz). */
    async function laden() {
      const farbe = new Map(), erstesTag = new Map(), auchKinder = new Set();
      const tags = (await ctx.backend.listAllTags()).filter(t => t.count > 0).map(t => ({ name: t.name, d: deuten(t.name) })).filter(t => t.d);
      await Promise.all(tags.map(async ({ name, d }) => {
        const [lebend, archiv] = await Promise.all([
          ctx.backend.listNotes('', { tag: name }),
          ctx.backend.listNotes('', { tag: name, scope: 'archive' }),
        ]);
        for (const n of [...lebend, ...archiv]) {
          const id = String(n.id);
          if (d.auchKinder) { auchKinder.add(id); continue; }
          const vorher = erstesTag.get(id);
          if (vorher == null || name.toLowerCase() < vorher.toLowerCase()) { erstesTag.set(id, name); farbe.set(id, d.farbe); }
        }
      }));
      return { farbe, auchKinder };
    }

    /** Farbe eines Knotens: die eigene, sonst die der nächsten Elternnotiz mit Farbe und «auch-kinder». */
    function farbeVon(id, eltern) {
      const eigene = stand.farbe.get(id);
      if (eigene) return eigene;
      for (let p = eltern.get(id), n = 0; p && p !== 'root' && n < 10000; p = eltern.get(p), n++) {
        if (stand.auchKinder.has(p) && stand.farbe.has(p)) return stand.farbe.get(p);
      }
      return null;
    }

    function malen() {
      const eltern = new Map();
      for (const e of document.querySelectorAll('path.mm-edge[data-from][data-to]')) eltern.set(e.dataset.to, e.dataset.from);
      for (const g of document.querySelectorAll('g.mm-node[data-id]')) {
        const f = aktiv && !g.classList.contains('mm-root') ? farbeVon(g.dataset.id, eltern) : null;
        for (const k of [...g.classList]) if (k.startsWith(KLASSE) && (!f || k !== KLASSE + f.id)) g.classList.remove(k);
        if (f) g.classList.add(KLASSE + f.id);
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

    ctx.on('mindmap:rendered', neu);
    ctx.on('database:replaced', () => { token++; stand = { farbe: new Map(), auchKinder: new Set() }; });
    neu(); // die Mindmap ist beim Einschalten eventuell schon gezeichnet

    ausschalten = () => {
      aktiv = false;
      token++;
      malen();
      style.remove();
    };
  },

  deactivate() {
    if (ausschalten) ausschalten();
    ausschalten = null;
  },
});
