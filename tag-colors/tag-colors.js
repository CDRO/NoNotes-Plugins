/* NoNotes-Erweiterung «Farben über Tags»: färbt Knoten der Mindmap nach einem Tag wie «farbe:rot» (englisch «color:red»).

   - Fläche heller, Umrandung dunkler, der Titel in der Farbe der Umrandung; im dunklen Modus des Systems umgekehrt.
   - 16 Farben, siehe FARBEN unten. Gross-/Kleinschreibung ist egal, «farbe:grün» und «farbe:gruen» gehen beide.
   - «farbe:auch-kinder» («color:with-children») zusätzlich an derselben Notiz gibt ihre Farbe an alle Unternotizen weiter.
     Eine Unternotiz mit eigener Farbe behält sie; hat auch sie «auch-kinder», gilt ihre Farbe für ihren Teil des Baums.
   - Mehrere Farb-Tags an einer Notiz: es gilt das erste in der Reihenfolge, in der der Editor die Tags zeigt.
   - Nur auf dem Bildschirm: Export und Druck zeichnen die Mindmap ohne diese Farben. Die Wurzel bleibt, wie sie ist.
   - Rechtsklick auf einen Knoten (NoNotes ab 2.8.0): «Farbe ▸» mit den 16 Farben, «Keine Farbe» und «Auch Unternotizen».
     Gilt für alle ausgewählten Knoten, wenn der angeklickte dazugehört. Geschrieben wird in der Sprache der Oberfläche
     («farbe:rot» bzw. «color:red»).
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
  version: '1.1.0',
  api: 1,
  help: {
    de: `Färbt **Knoten der Mindmap** über ein Tag: Fläche heller, Umrandung dunkler, der Titel in der Farbe der Umrandung (im dunklen Modus umgekehrt).

- Tag an der Notiz setzen, zum Beispiel \`farbe:rot\` (englisch \`color:red\`). Gross-/Kleinschreibung ist egal.
- **Unternotizen mitfärben:** zusätzlich \`farbe:auch-kinder\` (\`color:with-children\`). Eine Unternotiz mit eigener Farbe behält sie.
- Mehrere Farb-Tags an einer Notiz: das erste gilt (Reihenfolge wie im Editor).
- Nur auf dem Bildschirm, nicht in Export und Druck. Die Wurzel bleibt, wie sie ist.

#### Per Rechtsklick
Rechtsklick auf einen Knoten → **Farbe ▸**: eine der 16 Farben wählen (ersetzt die bisherige), **Keine Farbe** (entfernt Farbe und Weitergabe) oder **Auch Unternotizen** an- und abhaken (wirkt sofort). Gehört der Knoten zur Mehrfachauswahl (\`Ctrl\`+Klick), gilt es für alle ausgewählten. Die Tags werden in der Sprache der Oberfläche geschrieben. Braucht NoNotes 2.8.0 oder neuer.

#### Die 16 Farben
${tagListe('de')}

Englisch: ${tagListe('en')}, dazu \`color:grey\`.`,
    en: `Colours **mind map nodes** by tag: lighter fill, darker outline, the title in the outline colour (reversed in dark mode).

- Put a tag on the note, for example \`color:red\` (German \`farbe:rot\`). Case does not matter.
- **Colour subnotes too:** add \`color:with-children\` (\`farbe:auch-kinder\`). A subnote with a colour of its own keeps it.
- Several colour tags on one note: the first one wins (order as in the editor).
- On screen only, not in export and print. The root stays as it is.

#### By right-click
Right-click a node → **Colour ▸**: pick one of the 16 colours (replaces the current one), **No colour** (removes colour and passing-on) or tick **Subnotes too** (takes effect at once). If the node is part of the multiple selection (\`Ctrl\`+click), it applies to all selected nodes. Tags are written in the language of the interface. Needs NoNotes 2.8.0 or later.

#### The 16 colours
${tagListe('en')}, also \`color:grey\`.

German: ${tagListe('de')}.`,
  },
  description: 'Färbt Knoten der Mindmap über Tags wie «farbe:rot» (16 Farben); «farbe:auch-kinder» färbt die Unternotizen mit. Farbwahl per Rechtsklick (ab NoNotes 2.8.0).',

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
      .tf-panel .tf-check { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 6px; cursor: pointer; }
      .tf-panel .tf-check:hover { background: var(--hover); }
    `;
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

    // ---- Rechtsklick auf einen Knoten (NoNotes ab 2.8.0): «Farbe ▸» --------------------------------------------------
    const englisch = !/^de\b/.test(ctx.language() || 'de');
    const T = englisch
      ? { farbe: 'Colour', keine: 'No colour', kinder: 'Subnotes too', kinderTitel: 'Pass the colour on to all subnotes' }
      : { farbe: 'Farbe', keine: 'Keine Farbe', kinder: 'Auch Unternotizen', kinderTitel: 'Die Farbe an alle Unternotizen weitergeben' };
    const anzeige = f => (englisch ? f.en.charAt(0).toUpperCase() + f.en.slice(1) : f.name);
    const farbTag = f => (englisch ? `color:${f.en}` : `farbe:${f.name.toLowerCase()}`);
    const kinderTag = () => (englisch ? 'color:with-children' : 'farbe:auch-kinder');
    const ohneFarbe = tags => tags.filter(t => { const d = deuten(t); return !d || d.auchKinder; });
    const ohneWeitergabe = tags => tags.filter(t => { const d = deuten(t); return !(d && d.auchKinder); });

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

    function farbFeld(target, close) {
      const panel = document.createElement('div');
      panel.className = 'tf-panel';
      const grid = document.createElement('div');
      grid.className = 'tf-grid';
      grid.setAttribute('role', 'group');
      grid.setAttribute('aria-label', T.farbe);
      const knoepfe = new Map();
      for (const f of FARBEN) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `tf-sw tf-sw-${f.id}`;
        b.dataset.farbe = f.id;
        b.title = anzeige(f);
        b.setAttribute('aria-label', anzeige(f));
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => { close(); aendern(target.ids, tags => [...ohneFarbe(tags), farbTag(f)]); });
        knoepfe.set(f.id, b);
        grid.appendChild(b);
      }
      const keine = document.createElement('button');
      keine.type = 'button';
      keine.className = 'tf-none';
      keine.textContent = T.keine;
      keine.addEventListener('click', () => { close(); aendern(target.ids, tags => ohneWeitergabe(ohneFarbe(tags))); });
      const label = document.createElement('label');
      label.className = 'tf-check';
      label.title = T.kinderTitel;
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.className = 'tf-kinder';
      box.addEventListener('change', () => {
        box.indeterminate = false;
        const an = box.checked;
        aendern(target.ids, tags => (an ? [...ohneWeitergabe(tags), kinderTag()] : ohneWeitergabe(tags)));
      });
      label.append(box, T.kinder);
      panel.append(grid, keine, label);

      // Stand der gewählten Notizen: gemeinsame Farbe markieren, Weitergabe an (alle), aus (keine) oder gemischt
      Promise.all(target.ids.map(id => ctx.backend.getTags(id))).then(alle => {
        const farben = new Set(), mitKindern = alle.filter(tags => tags.some(t => { const d = deuten(t); return d && d.auchKinder; })).length;
        for (const tags of alle) {
          const eigene = tags.map(deuten).filter(d => d && d.farbe);
          farben.add(eigene.length ? eigene[0].farbe.id : '');
        }
        if (farben.size === 1) { const k = knoepfe.get([...farben][0]); if (k) k.setAttribute('aria-pressed', 'true'); }
        box.checked = mitKindern > 0 && mitKindern === alle.length;
        box.indeterminate = mitKindern > 0 && mitKindern < alle.length;
        panel.dataset.stand = 'geladen';
      }).catch(() => {});
      return panel;
    }

    if (ctx.ui.addContextMenuItem) ctx.ui.addContextMenuItem({ label: T.farbe, panel: (target, { close }) => farbFeld(target, close) });

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
