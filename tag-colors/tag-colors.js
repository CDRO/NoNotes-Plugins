/* NoNotes-Erweiterung «Farben über Tags»: färbt Knoten der Mindmap nach einem Tag wie «farbe:rot» (englisch «color:red»).

   - Fläche heller, Umrandung dunkler, der Titel in der Farbe der Umrandung; im dunklen Modus des Systems umgekehrt.
   - 16 Farben, siehe FARBEN unten. Gross-/Kleinschreibung ist egal, «farbe:grün» und «farbe:gruen» gehen beide.
   - «farbe-kinder:blau» («color-children:blue») färbt alle Unternotizen, die Notiz selbst nicht; mit «farbe:» zusammen
     können Notiz und Unternotizen verschiedene Farben haben. Eine Unternotiz mit eigener Farbe behält sie; hat sie selbst
     ein «farbe-kinder:», gilt das für ihren Teil des Baums.
   - Mehrere Farb-Tags derselben Art an einer Notiz: es gilt das erste in der Reihenfolge, in der der Editor die Tags zeigt.
   - Nur auf dem Bildschirm: Export und Druck zeichnen die Mindmap ohne diese Farben. Die Wurzel bleibt, wie sie ist.
   - Rechtsklick auf einen Knoten (NoNotes ab 2.8.0): «Farbe ▸» mit je den 16 Farben und «Keine Farbe» für die Notiz und für
     ihre Unternotizen.
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
/* --------------------------------------------------------------------------------------------------------------- */

let ausschalten = null; // aus activate: nimmt Stylesheet und Klassen wieder weg

const tagListe = sprache => FARBEN.map(f => `\`${sprache === 'en' ? 'color:' + f.en : 'farbe:' + f.id}\``).join(', ');

NoNotesPlugins.register({
  id: 'tag-farben',
  name: 'Farben über Tags',
  version: '2.0.0',
  api: 1,
  help: {
    de: `Färbt **Knoten der Mindmap** über ein Tag: Fläche heller, Umrandung dunkler, der Titel in der Farbe der Umrandung (im dunklen Modus umgekehrt).

- Tag an der Notiz setzen, zum Beispiel \`farbe:rot\` (englisch \`color:red\`). Gross-/Kleinschreibung ist egal.
- **Unternotizen färben:** \`farbe-kinder:blau\` (\`color-children:blue\`) färbt alle Unternotizen, die Notiz selbst nicht. Zusammen mit \`farbe:rot\` ist die Notiz rot und alles darunter blau; für dieselbe Farbe beide Tags mit derselben Farbe. Eine Unternotiz mit eigener Farbe behält sie, ein eigenes \`farbe-kinder:\` gilt für ihren Teil des Baums.
- Mehrere Farb-Tags derselben Art an einer Notiz: das erste gilt (Reihenfolge wie im Editor).
- Nur auf dem Bildschirm, nicht in Export und Druck. Die Wurzel bleibt, wie sie ist.

#### Per Rechtsklick
Rechtsklick auf einen Knoten → **Farbe ▸**: oben die Farbe der **Notiz**, unten die der **Unternotizen**, je eine der 16 Farben (ersetzt die bisherige) oder **Keine Farbe**. Gehört der Knoten zur Mehrfachauswahl (\`Ctrl\`+Klick), gilt es für alle ausgewählten; danach ist die Auswahl aufgehoben. Die Tags werden in der Sprache der Oberfläche geschrieben. Braucht NoNotes 2.8.0 oder neuer.

#### Die 16 Farben
${tagListe('de')}

Englisch: ${tagListe('en')}, dazu \`color:grey\`.`,
    en: `Colours **mind map nodes** by tag: lighter fill, darker outline, the title in the outline colour (reversed in dark mode).

- Put a tag on the note, for example \`color:red\` (German \`farbe:rot\`). Case does not matter.
- **Colour subnotes:** \`color-children:blue\` (\`farbe-kinder:blau\`) colours all subnotes, not the note itself. Together with \`color:red\` the note is red and everything below it blue; for the same colour, use both tags with the same colour. A subnote with a colour of its own keeps it; its own \`color-children:\` applies to its part of the tree.
- Several colour tags of the same kind on one note: the first one wins (order as in the editor).
- On screen only, not in export and print. The root stays as it is.

#### By right-click
Right-click a node → **Colour ▸**: the colour of the **note** at the top, that of its **subnotes** below, each with the 16 colours (replaces the current one) or **No colour**. If the node is part of the multiple selection (\`Ctrl\`+click), it applies to all selected nodes; the selection is cleared afterwards. Tags are written in the language of the interface. Needs NoNotes 2.8.0 or later.

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

    // «Farbe : Grün» → { art: 'notiz', farbe: Grün } · «color-children:blue» → { art: 'kinder', farbe: Blau } · sonst null
    const fold = v => String(v).toLowerCase().trim().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/\s+/g, '-');
    function deuten(tag) {
      const m = /^([^:]+):(.+)$/.exec(String(tag || '').replace(/^#/, ''));
      if (!m) return null;
      const vor = fold(m[1]);
      const art = VORSILBEN.includes(vor) ? 'notiz' : VORSILBEN_KINDER.includes(vor) ? 'kinder' : null;
      const farbe = art && byName.get(fold(m[2]));
      return farbe ? { art, farbe } : null;
    }

    // Stylesheet: überschreibt nur den Grundzustand des Knotens. Darüber, Hover, Suche, Ziehen und Mehrfachauswahl der App
    // (stärkere Regeln) bleiben sichtbar; die Auswahl zeigt ihren Rand, die Fläche behält die Farbe.
    const regeln = scheme => FARBEN.map(f => {
      const c = f[scheme];
      return `g.${KLASSE}${f.id} > rect { fill: ${c.fill}; stroke: ${c.line}; }\n`
        + `g.mm-node.mm-selected.${KLASSE}${f.id} > rect { fill: ${c.fill}; }\n`
        + `g.${KLASSE}${f.id} > text { fill: ${c.line}; }\n`;
    }).join('');
    // Farbfelder im Untermenü: gezeichnet wie ein gefärbter Knoten (Selektoren stärker als die Knöpfe des Kontextmenüs)
    const felder = scheme => FARBEN.map(f => `.tf-panel .tf-sw.tf-sw-${f.id} { background: ${f[scheme].fill}; border-color: ${f[scheme].line}; }\n`).join('');
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
    `;
    document.head.appendChild(style);

    const leer = () => ({ notiz: new Map(), kinder: new Map() });
    let stand = leer(); // je Art: Notizkennung (Text) → Farbe der Notiz bzw. ihrer Unternotizen
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
          if (vorher == null || name.toLowerCase() < vorher.toLowerCase()) { erstes.set(id, name); neu[d.art].set(id, d.farbe); }
        }
      }));
      return neu;
    }

    /** Farbe eines Knotens: die eigene, sonst die Kinderfarbe der nächsten Elternnotiz, die eine hat. */
    function farbeVon(id, eltern) {
      const eigene = stand.notiz.get(id);
      if (eigene) return eigene;
      for (let p = eltern.get(id), n = 0; p && p !== 'root' && n < 10000; p = eltern.get(p), n++) {
        if (stand.kinder.has(p)) return stand.kinder.get(p);
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

    // ---- Rechtsklick auf einen Knoten (NoNotes ab 2.8.0): «Farbe ▸» --------------------------------------------------
    const englisch = !/^de\b/.test(ctx.language() || 'de');
    const T = englisch
      ? { farbe: 'Colour', keine: 'No colour', notiz: 'Note', kinder: 'Subnotes', kinderTitel: 'Colour of all subnotes; a subnote with a colour of its own keeps it' }
      : { farbe: 'Farbe', keine: 'Keine Farbe', notiz: 'Notiz', kinder: 'Unternotizen', kinderTitel: 'Farbe aller Unternotizen; eine Unternotiz mit eigener Farbe behält sie' };
    const anzeige = f => (englisch ? f.en.charAt(0).toUpperCase() + f.en.slice(1) : f.name);
    const farbTag = (art, f) => (englisch ? `${art === 'kinder' ? 'color-children' : 'color'}:${f.en}`
      : `${art === 'kinder' ? 'farbe-kinder' : 'farbe'}:${f.name.toLowerCase()}`);
    const ohne = (art, tags) => tags.filter(t => { const d = deuten(t); return !(d && d.art === art); });

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

    /** Das Untermenü: oben die Farbe der Notiz, unten die der Unternotizen. Ein Klick ändert die Tags und schliesst das Menü
     *  (close(): die App hebt dann die Mehrfachauswahl auf, ab NoNotes 2.8.1). */
    function farbFeld(target, close) {
      const panel = document.createElement('div');
      panel.className = 'tf-panel';
      const knoepfe = { notiz: new Map(), kinder: new Map() };
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
          b.addEventListener('click', () => { close(); aendern(target.ids, tags => [...ohne(art, tags), farbTag(art, f)]); });
          knoepfe[art].set(f.id, b);
          grid.appendChild(b);
        }
        const keine = document.createElement('button');
        keine.type = 'button';
        keine.className = 'tf-none';
        keine.textContent = T.keine;
        keine.addEventListener('click', () => { close(); aendern(target.ids, tags => ohne(art, tags)); });
        teil.append(titel, grid, keine);
        panel.appendChild(teil);
      }

      // Stand der gewählten Notizen: je Art die gemeinsame Farbe markieren (bei verschiedenen keine)
      Promise.all(target.ids.map(id => ctx.backend.getTags(id))).then(alle => {
        for (const art of ['notiz', 'kinder']) {
          const farben = new Set(alle.map(tags => { const d = tags.map(deuten).find(x => x && x.art === art); return d ? d.farbe.id : ''; }));
          const k = farben.size === 1 && knoepfe[art].get([...farben][0]);
          if (k) k.setAttribute('aria-pressed', 'true');
        }
        panel.dataset.stand = 'geladen';
      }).catch(() => {});
      return panel;
    }

    if (ctx.ui.addContextMenuItem) ctx.ui.addContextMenuItem({ label: T.farbe, panel: (target, api) => farbFeld(target, api.close) });

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
    };
  },

  deactivate() {
    if (ausschalten) ausschalten();
    ausschalten = null;
  },
});
