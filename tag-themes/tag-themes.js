/* NoNotes-Erweiterung «Tag-Designs»: setzt pro Notiz ein Design, abhängig von ihren Tags.
   Solange eine Notiz im Editor offen ist, deren Tag in REGELN vorkommt, gilt das Design dieser Regel für die ganze
   Oberfläche. Beim Schliessen (oder ohne passendes Tag) gilt wieder das im Menü gewählte Design.

   Gibt es mehrere passende Tags, gewinnt die Regel, die in REGELN weiter oben steht.
   Die Hauptfarbe (Menü «Hauptfarbe») bleibt unberührt und gilt immer zusätzlich.
   Zusätzlich lassen sich die Verbindungslinien der Mindmap (Elternnotiz → Unternotiz) nach dem Tag-Paar stylen,
   siehe LINKS unten. Änderungen an REGELN und LINKS wirken nach dem Neuladen der Seite. */

/* ---- Konfiguration ---------------------------------------------------------------------------------------------
   tag    Name des Tags (ohne #, Gross-/Kleinschreibung egal)
   light  Variablen für die helle Systemeinstellung, dark für die dunkle
          erlaubt: bg, panel, text, muted, border, hover, danger, ok, warn, radius, shadow
   css    optional: zusätzliches CSS (ohne <style>)                                                                */
const REGELN = [
  {
    tag: 'wichtig',
    light: { bg: '#fbeaea', panel: '#fff5f5', text: '#3b1c1c', muted: '#8a5a5a', border: '#ecc9c9', hover: '#f6d9d9' },
    dark:  { bg: '#241414', panel: '#2d1a1a', text: '#f1d6d6', muted: '#c49a9a', border: '#4a2a2a', hover: '#382020' },
  },
  {
    tag: 'privat',
    light: { bg: '#f3ead8', panel: '#fbf6ea', text: '#3b2f1e', muted: '#7a6a52', border: '#e0d3b8', hover: '#efe3c8' },
    dark:  { bg: '#1c1710', panel: '#241e15', text: '#ece1c9', muted: '#b3a37f', border: '#3a3022', hover: '#2d261b' },
  },
  {
    tag: 'idee',
    light: { bg: '#e8f3ea', panel: '#f4faf5', text: '#1c3322', muted: '#5b7d63', border: '#c5dfca', hover: '#d9ecdd' },
    dark:  { bg: '#121c15', panel: '#18251c', text: '#d3ecd9', muted: '#8fb59a', border: '#25382b', hover: '#1e2e23' },
  },
];

/* ---- Linien der Mindmap -----------------------------------------------------------------------------------------
   Eine Linie führt von der Elternnotiz (from) zur Unternotiz (to). Passt das Tag-Paar, wird die Linie gestylt;
   die erste passende Regel gewinnt. Alle Felder ausser from und to sind optional.
   from, to  Tag der Elternnotiz bzw. der Unternotiz; '*' passt auf jede Notiz (auch ohne Tag)
   color     Farbverlauf vom Elternende zum Kindende: eine Farbe, eine Liste ['grau', 'braun'] (auch mehr als zwei)
             oder { light: [...], dark: [...] } für helle und dunkle Systemeinstellung
   shape     'curve' (Bézier, Standard der App), 'elbow' (rechtwinklig, mit Radius) oder 'straight' (direkt)
   radius    Eckenradius bei 'elbow' in Pixeln (0 = scharfe Ecken, Standard 10)
   width     Linienstärke in Pixeln (Standard der App: 2)
   dash      Strichart wie bei SVG stroke-dasharray, z. B. '6 4' (gestrichelt) oder '1 5' (gepunktet)
   opacity   Deckkraft 0 bis 1 (Standard 1)
   Beispiel: grauer Link, der zu Braun wird, quadratisch geführt – Tag «brick» zu «wood».
   Wirkt nur auf dem Bildschirm, nicht in Export und Druck. Benötigt das Ereignis «mindmap:rendered».          */
const LINKS = [
  {
    from: 'brick', to: 'wood',
    color: { light: ['#9aa0a6', '#8b5a2b'], dark: ['#7d848c', '#c58a50'] },
    shape: 'elbow', radius: 10, width: 3,
  },
  {
    from: 'wichtig', to: '*',
    color: '#d64545', shape: 'straight', width: 2.5, dash: '6 4',
  },
];
/* ------------------------------------------------------------------------------------------------------------- */

NoNotesPlugins.register({
  id: 'tag-designs',
  name: 'Tag-Designs',
  version: '1.1.0',
  api: 1,
  help: {
    de: `Setzt pro Notiz ein **Design** anhand ihrer Tags und stylt die **Linien der Mindmap**.

#### Design pro Notiz
Öffnest du eine Notiz mit einem Tag aus der Liste \`REGELN\` (oben in \`tag-themes.js\`), wechselt die ganze Oberfläche auf das Design dieser Regel. Beim Schliessen gilt wieder das Design aus dem Menü *Datenbank*. Bei mehreren passenden Tags gewinnt die Regel weiter oben in der Liste. Tag-Änderungen im Editor wirken sofort; die Hauptfarbe bleibt unberührt.

#### Linien der Mindmap
Die Liste \`LINKS\` stylt die Verbindung von der Elternnotiz zur Unternotiz nach dem Tag-Paar (\`from\` → \`to\`, \`'*'\` = jede Notiz): Farbverlauf (\`color\`, auch getrennt für hell und dunkel), Form (\`curve\`, \`elbow\`, \`straight\`), Eckenradius, Stärke, Strichart und Deckkraft. Nur auf dem Bildschirm, nicht in Export und Druck.

Änderungen an den Listen wirken nach dem Neuladen der Seite.`,
    en: `Sets a **theme** per note based on its tags and styles the **mind map lines**.

#### Theme per note
When you open a note that has a tag listed in \`REGELN\` (at the top of \`tag-themes.js\`), the whole interface switches to that rule's theme. Closing the note restores the theme chosen in the *Database* menu. With several matching tags, the rule higher up in the list wins. Tag changes in the editor take effect immediately; the accent colour is left alone.

#### Mind map lines
The \`LINKS\` list styles the connection from a parent note to a child note by their tag pair (\`from\` → \`to\`, \`'*'\` = any note): colour gradient (\`color\`, separately for light and dark), shape (\`curve\`, \`elbow\`, \`straight\`), corner radius, width, dash pattern and opacity. On screen only, not in export or print.

Changes to the lists take effect after reloading the page.`,
  },
  description: 'Setzt pro Notiz ein Design anhand ihrer Tags und stylt Mindmap-Linien nach Tag-Paaren (Zuordnung oben in der Datei).',

  activate(ctx) {
    const P = window.NoNotesPlugins;
    const STYLE_ID = 'tagDesignStyle';
    const bad = /[;{}<>]/;

    // Regeln prüfen und in Themes umwandeln; ungültige Regeln werden übersprungen und gemeldet
    const rules = [];
    for (const r of REGELN) {
      const tag = String((r && r.tag) || '').replace(/^#/, '').trim().toLowerCase();
      let problem = '';
      if (!tag) problem = 'Regel ohne tag';
      for (const mode of ['light', 'dark']) {
        for (const [k, v] of Object.entries((r && r[mode]) || {})) {
          if (!P.THEME_VARS.includes(k)) problem = `${tag}.${mode}.${k}: unbekannte Variable`;
          else if (typeof v !== 'string' || bad.test(v)) problem = `${tag}.${mode}.${k}: ungültiger Wert`;
        }
      }
      if (r && r.css != null && (typeof r.css !== 'string' || /<\/?style/i.test(r.css))) problem = `${tag}.css: ungültig`;
      if (problem) { console.warn('Tag-Designs: Regel übersprungen – ' + problem); continue; } // i18n-ignore
      rules.push({ tag, theme: { light: r.light, dark: r.dark, css: r.css || '' } });
    }

    let token = 0;       // verwirft veraltete Antworten, wenn schnell zwischen Notizen gewechselt wird
    let applied = null;  // Tag der gerade angewendeten Regel

    function clear() {
      applied = null;
      const old = document.getElementById(STYLE_ID);
      if (old) old.remove();
    }

    function paint(rule) {
      applied = rule.tag;
      let style = document.getElementById(STYLE_ID);
      if (!style) {
        style = document.createElement('style');
        style.id = STYLE_ID;
      }
      style.textContent = P.themeCss(rule.theme);
      // Reihenfolge: Basis < Design aus dem Menü < Tag-Design < Hauptfarbe (steht zuletzt und gewinnt)
      const accent = document.getElementById('accentStyle');
      if (accent) document.head.insertBefore(style, accent); else document.head.appendChild(style);
    }

    async function update(id) {
      const mine = ++token;
      if (id == null) return clear();
      const tags = (await ctx.backend.getTags(id)).map(x => String(x).toLowerCase());
      if (mine !== token) return;
      const rule = rules.find(r => tags.includes(r.tag));
      if (!rule) return clear();
      if (applied !== rule.tag || !document.getElementById(STYLE_ID)) paint(rule);
    }

    ctx.on('note:open', ({ id }) => update(id));
    ctx.on('note:saved', ({ id }) => { if (id === ctx.editor.noteId()) return update(id); });
    ctx.on('note:close', () => { token++; clear(); });
    ctx.on('database:replaced', () => { token++; clear(); });

    // Tag-Änderungen löst die App nicht als Ereignis aus (note:saved kommt nur beim Schreiben von Titel/Text);
    // darum die Tag-Leiste des Editors beobachten. Fehlt sie, bleibt es bei note:open und note:saved.
    const chips = document.getElementById('tagChips');
    if (chips) {
      new MutationObserver(() => {
        const id = ctx.editor.noteId();
        if (id != null) update(id);
      }).observe(chips, { childList: true });
    }

    // Beim Aktivieren ist eventuell schon eine Notiz offen
    const open = ctx.editor.noteId();
    if (open != null) update(open);

    activateLinks(ctx);
  },
});

/** Linien der Mindmap nach LINKS stylen. */
function activateLinks(ctx) {
  const P = window.NoNotesPlugins;
  if (!LINKS.length) return;
  if (!P.EVENTS.includes('mindmap:rendered')) {
    console.warn('Tag-Designs: Linien-Stile brauchen eine NoNotes-Version mit dem Ereignis mindmap:rendered'); // i18n-ignore
    return;
  }
  const SHAPES = ['curve', 'elbow', 'straight'];
  const SVGNS = 'http://www.w3.org/2000/svg';
  const STYLE_ID = 'tagLinkStyle';
  const DEFS_ID = 'tagLinkDefs';
  const safe = v => typeof v === 'string' && v.trim() && !/[;{}<>"'\\]/.test(v);
  const tagOf = v => String(v || '').replace(/^#/, '').trim().toLowerCase();

  const colorList = c => (Array.isArray(c) ? c : [c]).filter(safe).map(x => x.trim());

  // Regeln prüfen; ungültige Felder werden gemeldet und weggelassen
  const rules = [];
  for (const r of LINKS) {
    const from = tagOf(r && r.from), to = tagOf(r && r.to);
    if (!from || !to) { console.warn('Tag-Designs: Linien-Regel ohne from/to übersprungen'); continue; } // i18n-ignore
    const rule = { from, to, shape: 'curve', radius: 10, width: null, dash: '', opacity: null, light: [], dark: [] };
    if (r.shape != null) { if (SHAPES.includes(r.shape)) rule.shape = r.shape; else console.warn(`Tag-Designs: ${from}→${to}: unbekannte shape «${r.shape}»`); } // i18n-ignore
    if (Number.isFinite(r.radius) && r.radius >= 0) rule.radius = r.radius;
    if (Number.isFinite(r.width) && r.width > 0 && r.width <= 30) rule.width = r.width;
    if (typeof r.dash === 'string' && /^[\d\s,.]+$/.test(r.dash)) rule.dash = r.dash.trim();
    if (Number.isFinite(r.opacity) && r.opacity >= 0 && r.opacity <= 1) rule.opacity = r.opacity;
    const c = r.color;
    if (c && typeof c === 'object' && !Array.isArray(c)) {
      rule.light = colorList(c.light);
      rule.dark = colorList(c.dark);
      if (!rule.light.length) rule.light = rule.dark;
      if (!rule.dark.length) rule.dark = rule.light;
    } else {
      rule.light = rule.dark = colorList(c);
    }
    rules.push(rule);
  }
  if (!rules.length) return;

  const dark = window.matchMedia('(prefers-color-scheme: dark)');
  let token = 0;
  let tagsById = new Map();   // Kennung → Menge der kleingeschriebenen Tags (Stand der letzten Zeichnung)

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    // Beim Suchen werden nicht passende Linien abgeblendet; das gilt auch für gestylte Linien
    style.textContent = 'svg.has-matches .mm-edge.tl-edge { stroke-opacity: .25 !important; }\n';
    document.head.appendChild(style);
  }

  const matches = (rule, ptags, ctags) =>
    (rule.from === '*' || ptags.has(rule.from)) && (rule.to === '*' || ctags.has(rule.to));

  function pathData(shape, radius, x1, y1, x2, y2) {
    const mx = (x1 + x2) / 2;
    if (shape === 'straight') return `M ${x1} ${y1} L ${x2} ${y2}`;
    if (shape === 'elbow') {
      const dy = y2 - y1, dx = x2 - x1;
      const r = Math.min(radius, Math.abs(dy) / 2, Math.abs(dx) / 2);
      if (!(r > 0)) {
        if (dy === 0) return `M ${x1} ${y1} L ${x2} ${y2}`;
        return `M ${x1} ${y1} L ${mx} ${y1} L ${mx} ${y2} L ${x2} ${y2}`;
      }
      const sx = Math.sign(dx), sy = Math.sign(dy);
      return `M ${x1} ${y1} L ${mx - sx * r} ${y1} Q ${mx} ${y1} ${mx} ${y1 + sy * r} L ${mx} ${y2 - sy * r} Q ${mx} ${y2} ${mx + sx * r} ${y2} L ${x2} ${y2}`;
    }
    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`; // wie die App
  }

  function apply() {
    const edges = [...document.querySelectorAll('path.mm-edge[data-from]')];
    if (!edges.length) return;
    ensureStyle();
    const svg = edges[0].ownerSVGElement;
    let defs = document.getElementById(DEFS_ID);
    if (defs) defs.remove();
    defs = document.createElementNS(SVGNS, 'defs');
    defs.id = DEFS_ID;
    svg.insertBefore(defs, svg.firstChild);
    const isDark = dark.matches;
    let n = 0;
    for (const e of edges) {
      const ptags = tagsById.get(e.dataset.from) || new Set();
      const ctags = tagsById.get(e.dataset.to) || new Set();
      const rule = rules.find(r => matches(r, ptags, ctags));
      if (!rule) continue;
      const x1 = parseFloat(e.dataset.x1), y1 = parseFloat(e.dataset.y1), x2 = parseFloat(e.dataset.x2), y2 = parseFloat(e.dataset.y2);
      if (![x1, y1, x2, y2].every(Number.isFinite)) continue;
      e.setAttribute('d', pathData(rule.shape, rule.radius, x1, y1, x2, y2));
      e.classList.add('tl-edge');
      const colors = isDark ? rule.dark : rule.light;
      if (colors.length === 1) {
        e.style.setProperty('stroke', colors[0]);
      } else if (colors.length > 1) {
        // Verlauf entlang der Linie: in Seitenkoordinaten, damit auch waagerechte Linien einen Verlauf bekommen
        const g = document.createElementNS(SVGNS, 'linearGradient');
        const gid = `tagLinkGrad${n++}`;
        g.setAttribute('id', gid);
        g.setAttribute('gradientUnits', 'userSpaceOnUse');
        g.setAttribute('x1', x1); g.setAttribute('y1', y1); g.setAttribute('x2', x2); g.setAttribute('y2', y2);
        colors.forEach((c, i) => {
          const stop = document.createElementNS(SVGNS, 'stop');
          stop.setAttribute('offset', String(i / (colors.length - 1)));
          stop.setAttribute('stop-color', c);
          g.appendChild(stop);
        });
        defs.appendChild(g);
        e.style.setProperty('stroke', `url(#${gid})`);
      }
      e.style.setProperty('stroke-opacity', String(rule.opacity == null ? 1 : rule.opacity));
      if (rule.width != null) e.style.setProperty('stroke-width', String(rule.width));
      if (rule.dash) e.style.setProperty('stroke-dasharray', rule.dash);
      e.setAttribute('stroke-linecap', 'round');
    }
  }

  async function onRendered() {
    const mine = ++token;
    const edges = [...document.querySelectorAll('path.mm-edge[data-from]')];
    const ids = new Set(edges.flatMap(e => [e.dataset.from, e.dataset.to]).filter(id => id !== 'root'));
    const loaded = new Map();
    await Promise.all([...ids].map(async id => {
      loaded.set(id, new Set((await ctx.backend.getTags(Number(id))).map(x => String(x).toLowerCase())));
    }));
    if (mine !== token) return;
    tagsById = loaded;
    apply();
  }

  ctx.on('mindmap:rendered', onRendered);
  ctx.on('database:replaced', () => { token++; });
  // Wechselt die Systemeinstellung hell/dunkel, die Verläufe neu zeichnen (Zuordnung bleibt)
  if (dark.addEventListener) dark.addEventListener('change', onRendered);
  onRendered(); // die Mindmap ist beim Aktivieren eventuell schon gezeichnet
}
