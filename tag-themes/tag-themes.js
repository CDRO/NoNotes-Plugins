/* NoNotes-Erweiterung «Tag-Designs»: setzt pro Notiz ein Design, abhängig von ihren Tags.
   Solange eine Notiz im Editor offen ist, deren Tag in REGELN vorkommt, gilt das Design dieser Regel für die ganze
   Oberfläche. Beim Schliessen (oder ohne passendes Tag) gilt wieder das im Menü gewählte Design.

   Gibt es mehrere passende Tags, gewinnt die Regel, die in REGELN weiter oben steht.
   Die Hauptfarbe (Menü «Hauptfarbe») bleibt unberührt und gilt immer zusätzlich.
   Änderungen an REGELN wirken nach dem Neuladen der Seite. */

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
/* ------------------------------------------------------------------------------------------------------------- */

NoNotesPlugins.register({
  id: 'tag-designs',
  name: 'Tag-Designs',
  version: '1.0.0',
  api: 1,
  description: 'Setzt pro Notiz ein Design anhand ihrer Tags (Zuordnung oben in der Datei).',

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
  },
});
