/* NoNotes-Erweiterung «Sprung zu Unternotizen»: springt per Tastenkürzel von einer Notiz zu einer ihrer Unternotizen.

   Beispiel: Eine Notiz endet mit «Wohin soll es gehen? Vorne, Hinten, Oben, Unten» und hat vier Unternotizen mit diesen
   Titeln. Im Editor öffnet Strg+Leertaste – in den Darstellungen Bearbeiten, Geteilt und Vorschau – ein Fenster mit der
   nummerierten Liste dieser Unternotizen. Zahl eingeben, Enter drücken: die Notiz öffnet sich.

   Welche Unternotizen erscheinen?
   - Die Unternotizen, deren Titel im Text der Notiz vorkommt (auch als [[Titel]]), in der Reihenfolge ihres Auftretens
     im Text. Ein Titel zählt nur als ganzes Wort («Oben» passt nicht auf «Obenauf»).
   - Nennt der Text keine einzige Unternotiz, erscheinen alle Unternotizen in der Reihenfolge der Mindmap.
   Archivierte Unternotizen werden nicht angeboten.

   Änderungen an der Konfiguration wirken nach dem Neuladen der Seite. */

/* ---- Konfiguration ------------------------------------------------------------------------------------------- */
const TASTE = { ctrl: true, shift: false, alt: false, code: 'Space' };  // Strg+Leertaste (code: KeyboardEvent.code)
const MODI = ['edit', 'split', 'preview'];   // Darstellungen, in denen das Kürzel gilt: 'edit' (Bearbeiten), 'split' (Geteilt), 'preview' (Vorschau)
/* --------------------------------------------------------------------------------------------------------------- */

/* ---- Texte je Sprache --------------------------------------------------------------------------------------
   Schlüssel klein: 'de', 'de-de', 'en', 'fr', 'it', 'es', 'es-mx', 'pt', 'pt-br'. Gewählt wird die genaue Sprache der Oberfläche,
   dann die Sprache vor dem Bindestrich, dann Englisch. Die weiteren Sprachen stammen aus .l10n/subnote-jump/ (node .l10n/apply.cjs). */
const SJ_TEXTE = {
  de: {
    name: 'Sprung zu Unternotizen',
    description: 'Strg+Leertaste im Editor (Bearbeiten, Geteilt, Vorschau) öffnet eine nummerierte Liste der Unternotizen; Zahl und Enter springen hin.',
    help: `Springt per Tastenkürzel von einer Notiz zu einer ihrer **Unternotizen**.

Im Editor (**Bearbeiten**, **Geteilt** und **Vorschau**) öffnet \`Strg\`+\`Leertaste\` ein Fenster mit einer nummerierten Liste. Nummer eingeben, \`Enter\` drücken: die Unternotiz öffnet sich. Ein Klick auf einen Eintrag geht auch, \`Esc\` bricht ab.

#### Welche Unternotizen erscheinen?
- Die Unternotizen, deren Titel im Text der Notiz vorkommt (auch als \`[[Titel]]\`), in der Reihenfolge ihres Auftretens. Ein Titel zählt nur als ganzes Wort.
- Nennt der Text keine Unternotiz, erscheinen alle in der Reihenfolge der Mindmap.
- Archivierte Unternotizen fehlen.

Beispiel: Endet eine Notiz mit «Wohin soll es gehen? Vorne, Hinten, Oben, Unten» und hat Unternotizen mit diesen Titeln, führt die Liste genau diese auf.

Kürzel und Darstellungen lassen sich oben in \`subnote-jump.js\` ändern (\`TASTE\`, \`MODI\`).`,
    ui: { title: 'Wohin soll es gehen?', hint: 'Nummer eingeben, dann Enter. Esc bricht ab.', label: 'Nummer', invalid: 'Bitte eine Nummer aus der Liste eingeben.', none: 'Diese Notiz hat keine Unternotizen.', untitled: 'Ohne Titel', go: 'Öffnen' },
  },
  en: {
    name: 'Jump to subnotes',
    description: 'Ctrl+Space in the editor (edit, split, preview) opens a numbered list of the subnotes; a number and Enter jump there.',
    help: `Jumps from a note to one of its **subnotes** with a keyboard shortcut.

In the editor (**edit**, **split** and **preview**), \`Ctrl\`+\`Space\` opens a window with a numbered list. Type a number and press \`Enter\`: the subnote opens. Clicking an entry works too, \`Esc\` cancels.

#### Which subnotes are listed?
- The subnotes whose title appears in the note's text (also as \`[[Title]]\`), in the order they appear. A title only counts as a whole word.
- If the text names no subnote, all of them are listed in mind map order.
- Archived subnotes are left out.

Example: if a note ends with "Where to? Front, Back, Up, Down" and has subnotes with these titles, the list shows exactly those.

The shortcut and the views can be changed at the top of \`subnote-jump.js\` (\`TASTE\`, \`MODI\`).`,
    ui: { title: 'Where to?', hint: 'Type a number, then Enter. Esc cancels.', label: 'Number', invalid: 'Please enter a number from the list.', none: 'This note has no subnotes.', untitled: 'Untitled', go: 'Open' },
  },
  /* <uebersetzungen> */
  'de-de': {
    name: "Sprung zu Unternotizen",
    description: "Strg+Leertaste im Editor (Bearbeiten, Geteilt, Vorschau) öffnet eine nummerierte Liste der Unternotizen; Zahl und Enter springen hin.",
    help: `Springt per Tastenkürzel von einer Notiz zu einer ihrer **Unternotizen**.

Im Editor (**Bearbeiten**, **Geteilt** und **Vorschau**) öffnet \`Strg\`+\`Leertaste\` ein Fenster mit einer nummerierten Liste. Nummer eingeben, \`Enter\` drücken: die Unternotiz öffnet sich. Ein Klick auf einen Eintrag geht auch, \`Esc\` bricht ab.

#### Welche Unternotizen erscheinen?
- Die Unternotizen, deren Titel im Text der Notiz vorkommt (auch als \`[[Titel]]\`), in der Reihenfolge ihres Auftretens. Ein Titel zählt nur als ganzes Wort.
- Nennt der Text keine Unternotiz, erscheinen alle in der Reihenfolge der Mindmap.
- Archivierte Unternotizen fehlen.

Beispiel: Endet eine Notiz mit „Wohin soll es gehen? Vorne, Hinten, Oben, Unten“ und hat Unternotizen mit diesen Titeln, führt die Liste genau diese auf.

Kürzel und Darstellungen lassen sich oben in \`subnote-jump.js\` ändern (\`TASTE\`, \`MODI\`).`,
    ui: {"title":"Wohin soll es gehen?","hint":"Nummer eingeben, dann Enter. Esc bricht ab.","label":"Nummer","invalid":"Bitte eine Nummer aus der Liste eingeben.","none":"Diese Notiz hat keine Unternotizen.","untitled":"Ohne Titel","go":"Öffnen"},
  },
  'fr': {
    name: "Saut vers les sous-notes",
    description: "Ctrl+Espace dans l’éditeur (Édition, Côte à côte, Aperçu) ouvre une liste numérotée des sous-notes ; un numéro suivi d’Enter y mène.",
    help: `Passe d’une note à l’une de ses **sous-notes** par un raccourci clavier.

Dans l’éditeur (**Édition**, **Côte à côte** et **Aperçu**), \`Ctrl\`+\`Espace\` ouvre une fenêtre avec une liste numérotée. Tapez un numéro et appuyez sur \`Enter\` : la sous-note s’ouvre. Un clic sur une entrée fonctionne aussi, \`Esc\` annule.

#### Quelles sous-notes apparaissent ?
- Les sous-notes dont le titre figure dans le texte de la note (aussi sous la forme \`[[Titre]]\`), dans leur ordre d’apparition. Un titre ne compte que s’il forme un mot entier.
- Si le texte ne mentionne aucune sous-note, elles apparaissent toutes, dans l’ordre de la carte mentale.
- Les sous-notes archivées sont omises.

Exemple : si une note se termine par « Où aller ? Devant, Derrière, Haut, Bas » et a des sous-notes portant ces titres, la liste affiche exactement celles-ci.

Le raccourci et les modes d’affichage se modifient en haut de \`subnote-jump.js\` (\`TASTE\`, \`MODI\`).`,
    ui: {"title":"Où aller ?","hint":"Tapez un numéro, puis Enter. Esc annule.","label":"Numéro","invalid":"Veuillez saisir un numéro de la liste.","none":"Cette note n’a pas de sous-notes.","untitled":"Sans titre","go":"Ouvrir"},
  },
  'it': {
    name: "Salto alle sottonote",
    description: "Ctrl+Spazio nell’editor (Modifica, Diviso, Anteprima) apre un elenco numerato delle sottonote; un numero ed Enter ti ci portano.",
    help: `Passa con una scorciatoia da tastiera da una nota a una delle sue **sottonote**.

Nell’editor (**Modifica**, **Diviso** e **Anteprima**) \`Ctrl\`+\`Spazio\` apre una finestra con un elenco numerato. Digita il numero e premi \`Enter\`: la sottonota si apre. Funziona anche un clic su una voce; \`Esc\` annulla.

#### Quali sottonote compaiono?
- Le sottonote il cui titolo compare nel testo della nota (anche come \`[[Titolo]]\`), nell’ordine in cui compaiono. Un titolo conta solo come parola intera.
- Se il testo non nomina nessuna sottonota, compaiono tutte nell’ordine della mappa mentale.
- Le sottonote archiviate non compaiono.

Esempio: se una nota termina con «Dove vuoi andare? Davanti, Dietro, Sopra, Sotto» e ha sottonote con questi titoli, l’elenco mostra esattamente quelle.

La scorciatoia e le visualizzazioni si possono cambiare in cima a \`subnote-jump.js\` (\`TASTE\`, \`MODI\`).`,
    ui: {"title":"Dove vuoi andare?","hint":"Digita un numero, poi Enter. Esc annulla.","label":"Numero","invalid":"Inserisci un numero dell’elenco.","none":"Questa nota non ha sottonote.","untitled":"Senza titolo","go":"Apri"},
  },
  'es': {
    name: "Saltar a subnotas",
    description: "Ctrl+Espacio en el editor (Editar, Dividida, Vista previa) abre una lista numerada de las subnotas; con un número y Enter saltas a ella.",
    help: `Salta con un atajo de teclado de una nota a una de sus **subnotas**.

En el editor (**Editar**, **Dividida** y **Vista previa**), \`Ctrl\`+\`Espacio\` abre una ventana con una lista numerada. Escribe un número y pulsa \`Enter\`: se abre la subnota. También puedes hacer clic en una entrada; \`Esc\` cancela.

#### ¿Qué subnotas aparecen?
- Las subnotas cuyo título aparece en el texto de la nota (también como \`[[Título]]\`), en el orden en que aparecen. Un título solo cuenta como palabra completa.
- Si el texto no menciona ninguna subnota, aparecen todas en el orden del mapa mental.
- Las subnotas archivadas no aparecen.

Ejemplo: si una nota termina con «¿Adónde vamos? Delante, Detrás, Arriba, Abajo» y tiene subnotas con esos títulos, la lista muestra exactamente esas.

El atajo y las vistas se pueden cambiar al principio de \`subnote-jump.js\` (\`TASTE\`, \`MODI\`).`,
    ui: {"title":"¿Adónde vamos?","hint":"Escribe un número y pulsa Enter. Esc cancela.","label":"Número","invalid":"Escribe un número de la lista.","none":"Esta nota no tiene subnotas.","untitled":"Sin título","go":"Abrir"},
  },
  'es-mx': {
    name: "Saltar a subnotas",
    description: "Ctrl+Espacio en el editor (Editar, Dividida, Vista previa) abre una lista numerada de las subnotas; un número y Enter te llevan ahí.",
    help: `Salta de una nota a una de sus **subnotas** con un atajo de teclado.

En el editor (**Editar**, **Dividida** y **Vista previa**), \`Ctrl\`+\`Espacio\` abre una ventana con una lista numerada. Escribe un número y presiona \`Enter\`: se abre la subnota. También puedes hacer clic en una entrada; \`Esc\` cancela.

#### ¿Qué subnotas aparecen?
- Las subnotas cuyo título aparece en el texto de la nota (también como \`[[Título]]\`), en el orden en que aparecen. Un título solo cuenta como palabra completa.
- Si el texto no menciona ninguna subnota, aparecen todas en el orden del mapa mental.
- Las subnotas archivadas no aparecen.

Ejemplo: si una nota termina con “¿A dónde vamos? Adelante, Atrás, Arriba, Abajo” y tiene subnotas con esos títulos, la lista muestra exactamente esas.

El atajo y las presentaciones se pueden cambiar al principio de \`subnote-jump.js\` (\`TASTE\`, \`MODI\`).`,
    ui: {"title":"¿A dónde vamos?","hint":"Escribe un número y luego Enter. Esc cancela.","label":"Número","invalid":"Escribe un número de la lista.","none":"Esta nota no tiene subnotas.","untitled":"Sin título","go":"Abrir"},
  },
  'pt': {
    name: "Saltar para subnotas",
    description: "Ctrl+Espaço no editor (Editar, Dividida, Pré-visualização) abre uma lista numerada das subnotas; um número e Enter levam até lá.",
    help: `Salta de uma nota para uma das suas **subnotas** com um atalho de teclado.

No editor (**Editar**, **Dividida** e **Pré-visualização**), \`Ctrl\`+\`Espaço\` abre uma janela com uma lista numerada. Escreva o número e prima \`Enter\`: a subnota abre-se. Também pode clicar numa entrada; \`Esc\` cancela.

#### Que subnotas aparecem?
- As subnotas cujo título surge no texto da nota (também como \`[[Título]]\`), pela ordem em que aparecem. Um título só conta como palavra inteira.
- Se o texto não mencionar nenhuma subnota, aparecem todas, pela ordem do mapa mental.
- As subnotas arquivadas não aparecem.

Exemplo: se uma nota terminar com «Para onde vamos? Frente, Trás, Cima, Baixo» e tiver subnotas com esses títulos, a lista mostra exatamente essas.

O atalho e os modos de apresentação podem ser alterados no topo de \`subnote-jump.js\` (\`TASTE\`, \`MODI\`).`,
    ui: {"title":"Para onde vamos?","hint":"Escreva o número e prima Enter. Esc cancela.","label":"Número","invalid":"Introduza um número da lista.","none":"Esta nota não tem subnotas.","untitled":"Sem título","go":"Abrir"},
  },
  'pt-br': {
    name: "Pular para subnotas",
    description: "Ctrl+Espaço no editor (Editar, Lado a lado, Prévia) abre uma lista numerada das subnotas; um número e Enter levam até lá.",
    help: `Pula de uma nota para uma das **subnotas** dela com um atalho de teclado.

No editor (**Editar**, **Lado a lado** e **Prévia**), \`Ctrl\`+\`Espaço\` abre uma janela com uma lista numerada. Digite o número e pressione \`Enter\`: a subnota se abre. Também dá para clicar em um item; \`Esc\` cancela.

#### Quais subnotas aparecem?
- As subnotas cujo título aparece no texto da nota (também como \`[[Título]]\`), na ordem em que aparecem. Um título só conta como palavra inteira.
- Se o texto não citar nenhuma subnota, aparecem todas, na ordem do mapa mental.
- Subnotas arquivadas ficam de fora.

Exemplo: se uma nota termina com “Para onde? Frente, Trás, Cima, Baixo” e tem subnotas com esses títulos, a lista mostra exatamente essas.

O atalho e as exibições podem ser alterados no início de \`subnote-jump.js\` (\`TASTE\`, \`MODI\`).`,
    ui: {"title":"Para onde?","hint":"Digite o número e pressione Enter. Esc cancela.","label":"Número","invalid":"Digite um número da lista.","none":"Esta nota não tem subnotas.","untitled":"Sem título","go":"Abrir"},
  },
  /* </uebersetzungen> */
};
const sjJe = k => Object.fromEntries(Object.entries(SJ_TEXTE).map(([l, v]) => [l, v[k]]));
const sjSprache = ctx => { const l = String(ctx.language() || 'de').toLowerCase(); return SJ_TEXTE[l] || SJ_TEXTE[l.split('-')[0]] || SJ_TEXTE.en; };

NoNotesPlugins.register({
  id: 'sprung-unternotiz',
  name: SJ_TEXTE.de.name,
  version: '1.2.0',
  api: 1,
  names: sjJe('name'),
  descriptions: sjJe('description'),
  help: sjJe('help'),
  description: SJ_TEXTE.de.description,

  activate(ctx) {
    const T = sjSprache(ctx).ui;

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
