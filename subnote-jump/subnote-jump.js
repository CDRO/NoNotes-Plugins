/* NoNotes-Erweiterung «Sprung zu Unternotizen»: springt per Tastenkürzel von einer Notiz zu einer ihrer Unternotizen.

   Beispiel: Eine Notiz endet mit «Wohin soll es gehen? Vorne, Hinten, Oben, Unten» und hat vier Unternotizen mit diesen
   Titeln. Im Vorschaumodus öffnet Strg+Leertaste ein Fenster mit der nummerierten Liste dieser Unternotizen. Zahl
   eingeben, Enter drücken: die Notiz öffnet sich.

   Welche Unternotizen erscheinen?
   - Die Unternotizen, deren Titel im Text der Notiz vorkommt (auch als [[Titel]]), in der Reihenfolge ihres Auftretens
     im Text. Ein Titel zählt nur als ganzes Wort («Oben» passt nicht auf «Obenauf»).
   - Nennt der Text keine einzige Unternotiz, erscheinen alle Unternotizen in der Reihenfolge der Mindmap.
   Archivierte Unternotizen werden nicht angeboten.

   Änderungen an der Konfiguration wirken nach dem Neuladen der Seite. */

/* ---- Konfiguration ------------------------------------------------------------------------------------------- */
const TASTE = { ctrl: true, shift: false, alt: false, code: 'Space' };  // Strg+Leertaste (code: KeyboardEvent.code)
const MODI = ['preview'];   // Darstellungen, in denen das Kürzel gilt: 'preview' (Vorschau), 'split' (Geteilt), 'edit' (Bearbeiten)
/* --------------------------------------------------------------------------------------------------------------- */

NoNotesPlugins.register({
  id: 'sprung-unternotiz',
  name: 'Sprung zu Unternotizen',
  version: '1.0.0',
  api: 1,
  help: {
    de: `Springt per Tastenkürzel von einer Notiz zu einer ihrer **Unternotizen**.

In der **Vorschau** öffnet \`Strg\`+\`Leertaste\` ein Fenster mit einer nummerierten Liste. Nummer eingeben, \`Enter\` drücken: die Unternotiz öffnet sich. Ein Klick auf einen Eintrag geht auch, \`Esc\` bricht ab.

#### Welche Unternotizen erscheinen?
- Die Unternotizen, deren Titel im Text der Notiz vorkommt (auch als \`[[Titel]]\`), in der Reihenfolge ihres Auftretens. Ein Titel zählt nur als ganzes Wort.
- Nennt der Text keine Unternotiz, erscheinen alle in der Reihenfolge der Mindmap.
- Archivierte Unternotizen fehlen.

Beispiel: Endet eine Notiz mit «Wohin soll es gehen? Vorne, Hinten, Oben, Unten» und hat Unternotizen mit diesen Titeln, führt die Liste genau diese auf.

Kürzel und Darstellungen lassen sich oben in \`subnote-jump.js\` ändern (\`TASTE\`, \`MODI\`).`,
    en: `Jumps from a note to one of its **subnotes** with a keyboard shortcut.

In **preview**, \`Ctrl\`+\`Space\` opens a window with a numbered list. Type a number and press \`Enter\`: the subnote opens. Clicking an entry works too, \`Esc\` cancels.

#### Which subnotes are listed?
- The subnotes whose title appears in the note's text (also as \`[[Title]]\`), in the order they appear. A title only counts as a whole word.
- If the text names no subnote, all of them are listed in mind map order.
- Archived subnotes are left out.

Example: if a note ends with "Where to? Front, Back, Up, Down" and has subnotes with these titles, the list shows exactly those.

The shortcut and the views can be changed at the top of \`subnote-jump.js\` (\`TASTE\`, \`MODI\`).`,
  },
  description: 'Strg+Leertaste in der Vorschau öffnet eine nummerierte Liste der Unternotizen; Zahl und Enter springen hin.',

  activate(ctx) {
    const de = ctx.language() === 'de';
    const T = {
      title: de ? 'Wohin soll es gehen?' : 'Where to?',
      hint: de ? 'Nummer eingeben, dann Enter. Esc bricht ab.' : 'Type a number, then Enter. Esc cancels.',
      label: de ? 'Nummer' : 'Number',
      invalid: de ? 'Bitte eine Nummer aus der Liste eingeben.' : 'Please enter a number from the list.',
      none: de ? 'Diese Notiz hat keine Unternotizen.' : 'This note has no subnotes.',
      untitled: de ? 'Ohne Titel' : 'Untitled',
      go: de ? 'Öffnen' : 'Open',
    };

    const STYLE_ID = 'subnoteJumpStyle';
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        dialog.sj-dialog { border: 1px solid var(--border); border-radius: var(--radius, 8px); background: var(--panel); color: var(--text); padding: 18px 20px; min-width: 280px; max-width: min(92vw, 420px); box-shadow: 0 12px 40px rgba(0,0,0,.25); }
        dialog.sj-dialog::backdrop { background: rgba(0,0,0,.35); }
        .sj-dialog h2 { margin: 0 0 4px; font-size: 16px; }
        .sj-dialog .sj-hint { margin: 0 0 10px; color: var(--muted); font-size: 12px; }
        .sj-dialog ol { list-style: none; margin: 0 0 12px; padding: 0; max-height: 50vh; overflow: auto; }
        .sj-dialog li { display: flex; gap: 10px; align-items: baseline; padding: 6px 8px; border-radius: 6px; cursor: pointer; }
        .sj-dialog li:hover, .sj-dialog li.sj-pick { background: var(--hover); }
        .sj-dialog .sj-n { min-width: 1.8em; text-align: right; font-weight: 700; color: var(--accent); }
        .sj-dialog .sj-row { display: flex; gap: 8px; align-items: center; }
        .sj-dialog input { width: 5em; padding: 6px 8px; font: inherit; color: var(--text); background: var(--bg); border: 1px solid var(--border); border-radius: 6px; }
        .sj-dialog .sj-err { color: var(--danger); font-size: 12px; min-height: 1.2em; margin: 6px 0 0; }
      `;
      document.head.appendChild(style);
    }

    const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    /** Unternotizen der Notiz: die im Text genannten (in Textreihenfolge), sonst alle. */
    async function choices(noteId) {
      const rows = await ctx.backend.getTree({ archive: false });
      const kids = rows.filter(r => r.parent_id === noteId && !r.archived_at);
      if (!kids.length) return [];
      const note = await ctx.backend.getNote(noteId);
      const body = String((note && note.body) || '');
      const found = [];
      for (const k of kids) {
        const title = String(k.title || '').trim();
        if (!title) continue;
        const m = new RegExp('(?<![\\p{L}\\p{N}])' + escapeRe(title) + '(?![\\p{L}\\p{N}])', 'iu').exec(body);
        if (m) found.push({ k, pos: m.index });
      }
      if (found.length) return found.sort((a, b) => a.pos - b.pos).map(f => f.k);
      return kids;
    }

    let dialog = null;

    function close() {
      if (dialog) { dialog.close(); dialog.remove(); dialog = null; }
    }

    async function show(noteId) {
      const list = await choices(noteId);
      close();
      dialog = document.createElement('dialog');
      dialog.className = 'sj-dialog';
      const h = document.createElement('h2'); h.textContent = T.title;
      dialog.appendChild(h);
      if (!list.length) {
        const p = document.createElement('p'); p.className = 'sj-hint'; p.textContent = T.none;
        dialog.appendChild(p);
      } else {
        const hint = document.createElement('p'); hint.className = 'sj-hint'; hint.textContent = T.hint;
        const ol = document.createElement('ol');
        const err = document.createElement('p'); err.className = 'sj-err'; err.setAttribute('role', 'alert');
        const input = document.createElement('input');
        input.type = 'text'; input.inputMode = 'numeric'; input.autocomplete = 'off'; input.setAttribute('aria-label', T.label);
        const go = async n => {
          const target = list[n - 1];
          if (!target) { err.textContent = T.invalid; input.select(); return; }
          close();
          await ctx.openNote(target.id);
        };
        list.forEach((k, i) => {
          const li = document.createElement('li');
          const num = document.createElement('span'); num.className = 'sj-n'; num.textContent = String(i + 1);
          const name = document.createElement('span'); name.textContent = String(k.title || '').trim() || T.untitled;
          li.append(num, name);
          li.addEventListener('click', () => go(i + 1));
          ol.appendChild(li);
        });
        input.addEventListener('input', () => {
          input.value = input.value.replace(/\D/g, '');
          err.textContent = '';
          const n = Number(input.value);
          ol.querySelectorAll('li').forEach((li, i) => li.classList.toggle('sj-pick', input.value !== '' && i + 1 === n));
        });
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); go(input.value === '' ? NaN : Number(input.value)); }
        });
        const row = document.createElement('div'); row.className = 'sj-row';
        const lab = document.createElement('label'); lab.textContent = T.label;
        row.append(lab, input);
        dialog.append(hint, ol, row, err);
        dialog.addEventListener('close', () => { if (dialog) { dialog.remove(); dialog = null; } });
        document.body.appendChild(dialog);
        dialog.showModal();
        input.focus();
        return;
      }
      dialog.addEventListener('close', () => { if (dialog) { dialog.remove(); dialog = null; } });
      document.body.appendChild(dialog);
      dialog.showModal();
    }

    function inAllowedMode() {
      const pane = document.getElementById('editorPane');
      if (!pane || pane.hidden) return false;
      return MODI.some(m => pane.classList.contains('mode-' + m));
    }

    document.addEventListener('keydown', e => {
      if (e.code !== TASTE.code || e.ctrlKey !== !!TASTE.ctrl || e.shiftKey !== !!TASTE.shift || e.altKey !== !!TASTE.alt) return;
      if (dialog) { e.preventDefault(); return; }
      const id = ctx.editor.noteId();
      if (id == null || !inAllowedMode()) return;
      if (document.querySelector('dialog[open]')) return; // ein Dialog der App ist offen
      e.preventDefault();
      show(id).catch(err => ctx.ui.setStatus(String((err && err.message) || err), 'error'));
    });
  },
});
