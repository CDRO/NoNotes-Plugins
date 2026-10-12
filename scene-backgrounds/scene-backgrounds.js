/* NoNotes-Erweiterung «Szenen-Hintergründe»: setzt hinter der Mindmap und dem Editor ein Hintergrundbild, das sich mit
   der gewählten Notiz ändert, je nach Tag.

   - Es gilt ein STANDARD-Bild (z. B. eine Taverne).
   - Wählst du in der Mindmap eine Notiz aus (oder öffnest sie im Editor, Bearbeiten wie Vorschau), prüft die
     Erweiterung zuerst die Tags dieser Notiz, dann die ihrer Eltern, dann deren Eltern usw. Das erste Tag, das in
     HINTERGRUENDE vorkommt, bestimmt das Bild. Alle Unternotizen erben es also, solange nichts anderes über ein Tag
     gesetzt wurde. Bei mehreren passenden Tags derselben Notiz gewinnt der Eintrag weiter oben in der Liste.
   - Ohne Auswahl und bei der Wurzel gilt das Standard-Bild.
   Änderungen an der Konfiguration wirken nach dem Neuladen der Seite. */

/* ---- Konfiguration ------------------------------------------------------------------------------------------- */
// Bilder: Pfad relativ zum Ordner plugins/, oder eine volle Adresse (https://…, data:…). SVG, PNG, JPG, WebP.
// null als Bild heisst: kein Hintergrund (das normale Design der App).
const STANDARD = 'hintergruende/taverne.svg';
const HINTERGRUENDE = [
  { tag: 'wald',   bild: 'hintergruende/wald.svg' },
  { tag: 'hoehle', bild: 'hintergruende/hoehle.svg' },
  // { tag: 'neutral', bild: null },
];
const VERBLASSEN = 0.30;       // 0 bis 0.9: wie stark die Farbe des Designs über das Bild gelegt wird (Lesbarkeit)
const EDITOR_KARTE = 0.80;     // 0 bis 1: Deckkraft der Karte hinter Titel und Text im Editor (1 = Bild nicht sichtbar)
const UEBERBLENDEN_MS = 500;   // Dauer des Überblendens beim Wechsel
/* --------------------------------------------------------------------------------------------------------------- */

NoNotesPlugins.register({
  id: 'szenen-hintergruende',
  name: 'Szenen-Hintergründe',
  version: '1.0.0',
  api: 1,
  help: {
    de: `Setzt hinter Mindmap und Editor ein **Hintergrundbild**, das mit der gewählten Notiz wechselt.

- Es gilt ein **Standard-Bild** (z. B. eine Taverne).
- Wählst du eine Notiz aus oder öffnest sie (Bearbeiten, Geteilt, Vorschau), prüft die Erweiterung zuerst ihre Tags, dann die der Elternnotizen nach oben. Das erste Tag aus \`HINTERGRUENDE\` bestimmt das Bild. **Unternotizen erben es**, solange kein eigenes Tag etwas anderes setzt.
- Bei mehreren passenden Tags derselben Notiz gewinnt der Eintrag weiter oben in der Liste. \`bild: null\` schaltet den Hintergrund ab.

#### Anpassen
Oben in \`scene-backgrounds.js\`: \`STANDARD\`, \`HINTERGRUENDE\` (Tag → Bild), \`VERBLASSEN\` (Schleier für die Lesbarkeit), \`EDITOR_KARTE\` (Karte hinter dem Text) und \`UEBERBLENDEN_MS\`. Eigene Bilder (SVG, PNG, JPG, WebP) kommen in den Ordner \`hintergruende/\`.`,
    en: `Puts a **background image** behind the mind map and the editor that changes with the selected note.

- A **default image** applies (e.g. a tavern).
- When you select or open a note (edit, split, preview), the extension checks its tags first, then those of its parents upwards. The first tag found in \`HINTERGRUENDE\` decides the image. **Subnotes inherit it** unless a tag of their own sets something else.
- With several matching tags on the same note, the entry higher up in the list wins. \`bild: null\` turns the background off.

#### Customising
At the top of \`scene-backgrounds.js\`: \`STANDARD\`, \`HINTERGRUENDE\` (tag → image), \`VERBLASSEN\` (veil for legibility), \`EDITOR_KARTE\` (card behind the text) and \`UEBERBLENDEN_MS\`. Put your own images (SVG, PNG, JPG, WebP) in the \`hintergruende/\` folder.`,
  },
  description: 'Hintergrundbild für Mindmap und Editor, je nach Tag der gewählten Notiz (erbt an Unternotizen).',

  activate(ctx) {
    const P = window.NoNotesPlugins;
    const clamp = (v, lo, hi, d) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
    const fade = clamp(VERBLASSEN, 0, 0.9, 0.3);
    const card = clamp(EDITOR_KARTE, 0, 1, 0.8);
    const ms = clamp(UEBERBLENDEN_MS, 0, 5000, 500);

    // Bild-Pfad → CSS-Wert url("…"); ungültige Pfade werden abgelehnt
    const base = (P.base && P.base()) || window.location.href;
    function cssUrl(path) {
      if (path == null) return null;
      if (typeof path !== 'string' || !path.trim() || /["\\\n\r<>]/.test(path)) return undefined;
      try { return `url("${new URL(path.trim(), base).href}")`; } catch (e) { return undefined; }
    }

    const standard = cssUrl(STANDARD);
    const rules = [];
    for (const r of HINTERGRUENDE) {
      const tag = String((r && r.tag) || '').replace(/^#/, '').trim().toLowerCase();
      const url = cssUrl(r && r.bild);
      if (!tag || url === undefined) { console.warn('Szenen-Hintergründe: Eintrag übersprungen', r); continue; } // i18n-ignore
      rules.push({ tag, url });
    }

    // Zwei Ebenen hinter dem Inhalt, die beim Wechsel überblendet werden
    const layout = document.querySelector('main.layout');
    if (!layout) { console.warn('Szenen-Hintergründe: Arbeitsbereich nicht gefunden'); return; } // i18n-ignore
    const style = document.createElement('style');
    style.id = 'sceneBgStyle';
    style.textContent = `
      main.layout { position: relative; isolation: isolate; }
      .sb-layer { position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: 0; background-size: cover; background-position: center; background-repeat: no-repeat; transition: opacity ${ms}ms ease; }
      .sb-layer.sb-on { opacity: 1; }
      /* Der Editor aus der Mindmap liegt als Vollbild-Ebene mit eigenem Hintergrund über dem Arbeitsbereich */
      body.sb-active:not(.view-list).editor-open .editor { background: var(--sb-bg) center / cover no-repeat, var(--bg); }
      body.sb-active #editorPane { background: color-mix(in srgb, var(--bg) ${Math.round(card * 100)}%, transparent); border-radius: var(--radius, 8px); }
      @media (prefers-reduced-motion: reduce) { .sb-layer { transition: none; } }
    `;
    document.head.appendChild(style);
    const layers = [0, 1].map(() => {
      const d = document.createElement('div');
      d.className = 'sb-layer';
      d.setAttribute('aria-hidden', 'true');
      layout.insertBefore(d, layout.firstChild);
      return d;
    });
    let front = 0;          // Ebene, die gerade sichtbar ist
    let shown;              // zuletzt gesetzter CSS-Wert (undefined = noch nichts)

    // Farbe des Designs als Schleier über dem Bild (hält Schrift und Knoten lesbar, hell wie dunkel)
    const veilOf = () => {
      const c = `color-mix(in srgb, var(--bg) ${Math.round(fade * 100)}%, transparent)`;
      return `linear-gradient(${c}, ${c})`;
    };

    function show(url) {
      if (url === shown) return;
      shown = url;
      const next = layers[1 - front], prev = layers[front];
      if (url) {
        next.style.backgroundImage = `${veilOf()}, ${url}`;
        next.classList.add('sb-on');
        prev.classList.remove('sb-on');
        front = 1 - front;
      } else {
        prev.classList.remove('sb-on');
      }
      document.body.classList.toggle('sb-active', !!url);
      if (url) document.documentElement.style.setProperty('--sb-bg', `${veilOf()}, ${url}`);
      else document.documentElement.style.removeProperty('--sb-bg');
    }

    // Bild für eine Notiz: eigene Tags, dann die der Eltern nach oben; sonst STANDARD
    async function sceneFor(id) {
      if (typeof id !== 'number') return standard;
      const chain = [id, ...(await ctx.backend.getPath(id)).map(p => p.id).reverse()];
      for (const nid of chain) {
        const tags = (await ctx.backend.getTags(nid)).map(x => String(x).toLowerCase());
        const rule = rules.find(r => tags.includes(r.tag));
        if (rule) return rule.url;
      }
      return standard;
    }

    let selected = null;   // Auswahl in der Mindmap
    let token = 0;
    async function update() {
      const mine = ++token;
      const open = ctx.editor.noteId();
      const id = open != null ? open : selected;
      let url;
      try { url = await sceneFor(id); } catch (e) { url = standard; }
      if (mine === token) show(url);
    }

    // Ältere NoNotes-Versionen kennen mindmap:select / mindmap:rendered nicht: dann wirkt nur das Öffnen im Editor
    const on = (event, fn) => { if (P.EVENTS.includes(event)) ctx.on(event, fn); };
    on('mindmap:select', ({ id }) => { selected = id; return update(); });
    on('note:open', () => update());
    on('note:close', () => update());
    on('note:saved', () => update());
    on('mindmap:rendered', () => update());
    on('database:replaced', () => { selected = null; return update(); });

    // Tag-Änderungen im Editor (die App meldet sie nicht als Ereignis): Tag-Leiste beobachten
    const chips = document.getElementById('tagChips');
    if (chips) new MutationObserver(() => update()).observe(chips, { childList: true });

    update();
  },
});
