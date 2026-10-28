/* NoNotes-Erweiterung «Tabellen formatieren»: Rechtsklick auf eine Tabelle in der Vorschau → «Formatieren ▸».

   - Farbe und Fett für das angeklickte Feld, seine Zeile oder seine Spalte (in der Titelzeile: die Titelzeile). Gilt mehreres,
     gewinnt das Feld vor der Zeile vor der Spalte.
   - Spaltenbreite (Auto, Schmal, Mittel, Breit), Zeilenhöhe (Auto, Hoch, Sehr hoch) und «Ganze Breite» für die Tabelle.
   - Jede Wahl wirkt sofort, das Untermenü bleibt offen.
   - Gespeichert wird im Format der Tabelle, in der Zeile «<!-- tabelle: {…} -->» darüber, unter der Kennung «table-format»:
     { voll, cols: { "0": { breite, farbe, fett } }, rows: { "h" | "0": { hoehe, farbe, fett } }, cells: { "0,1": { farbe, fett } } }.
     NoNotes verschiebt rows, cols und cells mit, wenn Zeilen oder Spalten dazukommen oder wegfallen.
   - Farben als Klassen mit eigenem Stylesheet: hell, in der dunklen Systemeinstellung dunkel; gedruckt immer hell.
   Benötigt NoNotes 2.10.0 (ctx.tables, ctx.ui.addTableMenuItem). */

/* ---- Anpassen ----------------------------------------------------------------------------------------------------
   FARBEN  id (im Format gespeichert), Fläche hell und dunkel (Text bleibt in der Textfarbe der App); Namen in TBF_TEXTE
   BREITEN Spaltenbreiten, HOEHEN Zeilenhöhen (CSS-Werte; «Auto» heisst: keine Angabe)                                 */
const TBF_FARBEN = [
  { id: 'gelb', light: '#fdf3c4', dark: '#443e1d' },
  { id: 'orange', light: '#fde2cf', dark: '#462c1a' },
  { id: 'rot', light: '#fad3d3', dark: '#451e1e' },
  { id: 'pink', light: '#f9d5e7', dark: '#43202f' },
  { id: 'violett', light: '#e3d6f8', dark: '#2d2142' },
  { id: 'blau', light: '#d4e1fa', dark: '#1f2b44' },
  { id: 'tuerkis', light: '#d3f5f1', dark: '#1f3f3b' },
  { id: 'gruen', light: '#d7f4dc', dark: '#223f27' },
  { id: 'grau', light: '#e5e7eb', dark: '#30333a' },
];
const TBF_BREITEN = [{ id: 'schmal', css: '6em' }, { id: 'mittel', css: '12em' }, { id: 'breit', css: '20em' }];
const TBF_HOEHEN = [{ id: 'hoch', css: '2.8em' }, { id: 'sehr-hoch', css: '4.5em' }];
/* --------------------------------------------------------------------------------------------------------------- */

/** Wirksame Angaben je Feld aus dem Format der Erweiterung: Farbe (Feld vor Zeile vor Spalte), fett (irgendwo an), Breite der
 *  Spalten, Höhe der Zeilen, ganze Breite. Als Angaben für ctx.tables.format. Reine Funktion (auch im Test benutzt). */
function tbfFormat(mine, info) {
  if (!mine || typeof mine !== 'object') return null;
  const cols = mine.cols || {}, rows = mine.rows || {}, cells = mine.cells || {};
  const farbe = id => TBF_FARBEN.some(f => f.id === id) ? id : null;
  const out = { columns: {}, rows: {}, cells: {} };
  if (mine.voll === true) out.table = { width: '100%' };
  for (const [c, v] of Object.entries(cols)) {
    const b = v && TBF_BREITEN.find(x => x.id === v.breite);
    if (b) out.columns[c] = { width: b.css, minWidth: b.css };
  }
  const rowKeys = (info.header ? ['h'] : []).concat(Array.from({ length: info.rows }, (_, r) => String(r)));
  for (const r of rowKeys) {
    const h = rows[r] && TBF_HOEHEN.find(x => x.id === rows[r].hoehe);
    if (h) {
      if (r === 'h') out.header = { height: h.css };
      else out.rows[r] = { height: h.css };
    }
    for (let c = 0; c < info.cols; c++) {
      const cell = cells[`${r},${c}`] || {}, row = rows[r] || {}, col = cols[c] || {};
      const f = farbe(cell.farbe) || farbe(row.farbe) || farbe(col.farbe);
      const fett = cell.fett === true || row.fett === true || col.fett === true;
      if (!f && !fett) continue;
      out.cells[`${r},${c}`] = Object.assign(f ? { class: 'tbf-' + f } : {}, fett ? { fontWeight: 'bold' } : {});
    }
  }
  return out;
}

/** Ändert in mine (dem Format der Erweiterung) den Eintrag eines Bereichs: scope 'cell' | 'row' | 'col', key wie «0,1», «h», «2»;
 *  set(entry) ändert ihn. Leere Einträge und leere Bereiche fallen weg; liefert mine oder null, wenn nichts mehr übrig ist. */
function tbfChange(mine, scope, key, set) {
  const m = mine && typeof mine === 'object' ? JSON.parse(JSON.stringify(mine)) : {};
  const map = scope === 'cell' ? 'cells' : scope === 'row' ? 'rows' : scope === 'col' ? 'cols' : null;
  if (map) {
    const all = m[map] || {};
    const entry = Object.assign({}, all[key]);
    set(entry);
    for (const k of Object.keys(entry)) if (entry[k] == null || entry[k] === false || entry[k] === '') delete entry[k];
    if (Object.keys(entry).length) all[key] = entry; else delete all[key];
    if (Object.keys(all).length) m[map] = all; else delete m[map];
  } else set(m);
  if (m.voll !== true) delete m.voll;
  return Object.keys(m).length ? m : null;
}

let tbfAusschalten = null;

/* ---- Texte je Sprache --------------------------------------------------------------------------------------
   Schlüssel klein: 'de', 'de-de', 'en', 'fr', 'it', 'es', 'es-mx', 'pt', 'pt-br'. Gewählt wird die genaue Sprache der Oberfläche,
   dann die Sprache vor dem Bindestrich, dann Englisch. Im Hilfetext setzt die Erweiterung {FARBEN}, {BREITEN} und {HOEHEN} ein.
   Die weiteren Sprachen stammen aus .l10n/table-format/ (node .l10n/apply.cjs). */
const TBF_TEXTE = {
  de: {
    name: 'Tabellen formatieren',
    description: 'Farbe, Fett, Spaltenbreite, Zeilenhöhe und ganze Breite für Tabellen in der Vorschau, per Rechtsklick auf ein Feld (ab NoNotes 2.10.0).',
    help: `Formatiert **Tabellen** in der Vorschau: Rechtsklick auf ein Feld → **Formatieren ▸**.

- **Gilt für** Feld, Zeile oder Spalte (in der Titelzeile: die Titelzeile). Dafür **Farbe** ({FARBEN} oder keine) und **Fett**. Gilt mehreres, gewinnt das Feld vor der Zeile vor der Spalte.
- **Spaltenbreite**: Auto, {BREITEN}. **Zeilenhöhe**: Auto, {HOEHEN}. **Ganze Breite** zieht die Tabelle über die ganze Vorschau.
- Jede Wahl wirkt sofort, das Untermenü bleibt offen.
- Gespeichert wird in der Zeile \`<!-- tabelle: … -->\` über der Tabelle; Zeilen und Spalten behalten ihr Format, wenn andere dazukommen oder wegfallen. Andere Markdown-Programme zeigen die Tabelle ohne dieses Format.
- Im dunklen Modus sind die Farben dunkel, gedruckt immer hell.`,
    ui: { menu: 'Formatieren', scope: 'Gilt für', cell: 'Feld', row: 'Zeile', header: 'Titelzeile', col: 'Spalte', farbe: 'Farbe', keine: 'Keine', fett: 'Fett', breite: 'Spaltenbreite', hoehe: 'Zeilenhöhe', auto: 'Auto', voll: 'Ganze Breite' },
    farben: { gelb: 'Gelb', orange: 'Orange', rot: 'Rot', pink: 'Pink', violett: 'Violett', blau: 'Blau', tuerkis: 'Türkis', gruen: 'Grün', grau: 'Grau' },
    breiten: { schmal: 'Schmal', mittel: 'Mittel', breit: 'Breit' },
    hoehen: { hoch: 'Hoch', 'sehr-hoch': 'Sehr hoch' },
  },
  en: {
    name: 'Format tables',
    description: 'Colour, bold, column width, row height and full width for tables in the preview, by right-clicking a cell (NoNotes 2.10.0 or later).',
    help: `Formats **tables** in the preview: right-click a cell → **Format ▸**.

- **Applies to** the cell, its row or its column (in the header row: the header row). Choose a **colour** ({FARBEN} or none) and **bold**. If several apply, the cell wins over the row over the column.
- **Column width**: Auto, {BREITEN}. **Row height**: Auto, {HOEHEN}. **Full width** stretches the table across the preview.
- Every choice applies at once; the submenu stays open.
- Stored in the line \`<!-- tabelle: … -->\` above the table; rows and columns keep their format when others are added or removed. Other Markdown programs show the table without this format.
- In dark mode the colours are dark; printed they are always light.`,
    ui: { menu: 'Format', scope: 'Applies to', cell: 'Cell', row: 'Row', header: 'Header row', col: 'Column', farbe: 'Colour', keine: 'None', fett: 'Bold', breite: 'Column width', hoehe: 'Row height', auto: 'Auto', voll: 'Full width' },
    farben: { gelb: 'Yellow', orange: 'Orange', rot: 'Red', pink: 'Pink', violett: 'Violet', blau: 'Blue', tuerkis: 'Teal', gruen: 'Green', grau: 'Gray' },
    breiten: { schmal: 'Narrow', mittel: 'Medium', breit: 'Wide' },
    hoehen: { hoch: 'Tall', 'sehr-hoch': 'Very tall' },
  },
  /* <uebersetzungen> */
  'de-de': {
    name: "Tabellen formatieren",
    description: "Farbe, Fett, Spaltenbreite, Zeilenhöhe und ganze Breite für Tabellen in der Vorschau, per Rechtsklick auf ein Feld (ab NoNotes 2.10.0).",
    help: `Formatiert **Tabellen** in der Vorschau: Rechtsklick auf ein Feld → **Formatieren ▸**.

- **Gilt für** Feld, Zeile oder Spalte (in der Titelzeile: die Titelzeile). Dafür **Farbe** ({FARBEN} oder keine) und **Fett**. Gilt mehreres, gewinnt das Feld vor der Zeile vor der Spalte.
- **Spaltenbreite**: Auto, {BREITEN}. **Zeilenhöhe**: Auto, {HOEHEN}. **Ganze Breite** zieht die Tabelle über die ganze Vorschau.
- Jede Wahl wirkt sofort, das Untermenü bleibt offen.
- Gespeichert wird in der Zeile \`<!-- tabelle: … -->\` über der Tabelle; Zeilen und Spalten behalten ihr Format, wenn andere dazukommen oder wegfallen. Andere Markdown-Programme zeigen die Tabelle ohne dieses Format.
- Im dunklen Modus sind die Farben dunkel, gedruckt immer hell.`,
    ui: {"menu":"Formatieren","scope":"Gilt für","cell":"Feld","row":"Zeile","header":"Titelzeile","col":"Spalte","farbe":"Farbe","keine":"Keine","fett":"Fett","breite":"Spaltenbreite","hoehe":"Zeilenhöhe","auto":"Auto","voll":"Ganze Breite"},
    farben: {"gelb":"Gelb","orange":"Orange","rot":"Rot","pink":"Pink","violett":"Violett","blau":"Blau","tuerkis":"Türkis","gruen":"Grün","grau":"Grau"},
    breiten: {"schmal":"Schmal","mittel":"Mittel","breit":"Breit"},
    hoehen: {"hoch":"Hoch","sehr-hoch":"Sehr hoch"},
  },
  'fr': {
    name: "Mise en forme des tableaux",
    description: "Couleur, gras, largeur de colonne, hauteur de ligne et pleine largeur pour les tableaux de l’aperçu, par clic droit sur une cellule (à partir de NoNotes 2.10.0).",
    help: `Met en forme les **tableaux** dans l’aperçu : clic droit sur une cellule → **Mettre en forme ▸**.

- **S’applique à** la cellule, la ligne ou la colonne (dans la ligne d’en-tête : la ligne d’en-tête). Pour ce choix : **Couleur** ({FARBEN} ou aucune) et **Gras**. Si plusieurs réglages s’appliquent, la cellule l’emporte sur la ligne, qui l’emporte sur la colonne.
- **Largeur de colonne** : Auto, {BREITEN}. **Hauteur de ligne** : Auto, {HOEHEN}. **Pleine largeur** étend le tableau sur toute la largeur de l’aperçu.
- Chaque choix s’applique immédiatement ; le sous-menu reste ouvert.
- Le format est enregistré dans la ligne \`<!-- tabelle: … -->\` au-dessus du tableau ; les lignes et les colonnes conservent leur format lorsque d’autres sont ajoutées ou supprimées. Les autres programmes Markdown affichent le tableau sans ce format.
- En mode sombre, les couleurs sont foncées ; à l’impression, elles sont toujours claires.`,
    ui: {"menu":"Mettre en forme","scope":"S’applique à","cell":"Cellule","row":"Ligne","header":"Ligne d’en-tête","col":"Colonne","farbe":"Couleur","keine":"Aucune","fett":"Gras","breite":"Largeur de colonne","hoehe":"Hauteur de ligne","auto":"Auto","voll":"Pleine largeur"},
    farben: {"gelb":"Jaune","orange":"Orange","rot":"Rouge","pink":"Rose","violett":"Violet","blau":"Bleu","tuerkis":"Turquoise","gruen":"Vert","grau":"Gris"},
    breiten: {"schmal":"Étroite","mittel":"Moyenne","breit":"Large"},
    hoehen: {"hoch":"Haute","sehr-hoch":"Très haute"},
  },
  'it': {
    name: "Formatta tabelle",
    description: "Colore, grassetto, larghezza delle colonne, altezza delle righe e larghezza intera per le tabelle nell’anteprima, con un clic destro su una cella (da NoNotes 2.10.0).",
    help: `Formatta le **tabelle** nell’anteprima: clic destro su una cella → **Formatta ▸**.

- **Vale per** la cella, la sua riga o la sua colonna (nella riga di intestazione: la riga di intestazione). Per questo scegli un **colore** ({FARBEN} o nessuno) e il **grassetto**. Se vale più di una scelta, la cella prevale sulla riga e la riga sulla colonna.
- **Larghezza colonna**: Auto, {BREITEN}. **Altezza riga**: Auto, {HOEHEN}. **Larghezza intera** estende la tabella su tutta l’anteprima.
- Ogni scelta ha effetto subito; il sottomenu resta aperto.
- Il formato viene salvato nella riga \`<!-- tabelle: … -->\` sopra la tabella; righe e colonne mantengono il loro formato quando se ne aggiungono o se ne tolgono altre. Altri programmi Markdown mostrano la tabella senza questo formato.
- In modalità scura i colori sono scuri, in stampa sempre chiari.`,
    ui: {"menu":"Formatta","scope":"Vale per","cell":"Cella","row":"Riga","header":"Riga di intestazione","col":"Colonna","farbe":"Colore","keine":"Nessuno","fett":"Grassetto","breite":"Larghezza colonna","hoehe":"Altezza riga","auto":"Auto","voll":"Larghezza intera"},
    farben: {"gelb":"Giallo","orange":"Arancione","rot":"Rosso","pink":"Rosa","violett":"Viola","blau":"Blu","tuerkis":"Turchese","gruen":"Verde","grau":"Grigio"},
    breiten: {"schmal":"Stretta","mittel":"Media","breit":"Larga"},
    hoehen: {"hoch":"Alta","sehr-hoch":"Molto alta"},
  },
  'es': {
    name: "Formato de tablas",
    description: "Color, negrita, ancho de columna, alto de fila y ancho completo para las tablas de la vista previa, con clic derecho en una celda (NoNotes 2.10.0 o posterior).",
    help: `Da formato a las **tablas** de la vista previa: clic derecho en una celda → **Formato ▸**.

- **Aplicar a** la celda, la fila o la columna (en la fila de encabezado: la fila de encabezado). Para ello, **Color** ({FARBEN} o ninguno) y **Negrita**. Si se aplican varios, la celda prevalece sobre la fila y la fila sobre la columna.
- **Ancho de columna**: Automático, {BREITEN}. **Alto de fila**: Automático, {HOEHEN}. **Ancho completo** extiende la tabla a toda la vista previa.
- Cada opción se aplica al instante y el submenú sigue abierto.
- Se guarda en la línea \`<!-- tabelle: … -->\` encima de la tabla; las filas y columnas conservan su formato cuando se añaden o se quitan otras. Otros programas de Markdown muestran la tabla sin este formato.
- En el modo oscuro, los colores son oscuros; al imprimir, siempre claros.`,
    ui: {"menu":"Formato","scope":"Aplicar a","cell":"Celda","row":"Fila","header":"Fila de encabezado","col":"Columna","farbe":"Color","keine":"Ninguno","fett":"Negrita","breite":"Ancho de columna","hoehe":"Alto de fila","auto":"Automático","voll":"Ancho completo"},
    farben: {"gelb":"Amarillo","orange":"Naranja","rot":"Rojo","pink":"Rosa","violett":"Violeta","blau":"Azul","tuerkis":"Turquesa","gruen":"Verde","grau":"Gris"},
    breiten: {"schmal":"Estrecho","mittel":"Medio","breit":"Ancho"},
    hoehen: {"hoch":"Alto","sehr-hoch":"Muy alto"},
  },
  'es-mx': {
    name: "Formato de tablas",
    description: "Color, negrita, ancho de columna, alto de fila y ancho completo para las tablas de la vista previa, con clic derecho en una celda (a partir de NoNotes 2.10.0).",
    help: `Da formato a las **tablas** en la vista previa: clic derecho en una celda → **Formato ▸**.

- **Aplica a** la celda, la fila o la columna (en la fila de encabezado: la fila de encabezado). Ahí eliges **Color** ({FARBEN} o ninguno) y **Negrita**. Si aplican varios, gana la celda sobre la fila y la fila sobre la columna.
- **Ancho de columna**: Automático, {BREITEN}. **Alto de fila**: Automático, {HOEHEN}. **Ancho completo** extiende la tabla a todo el ancho de la vista previa.
- Cada elección se aplica de inmediato y el submenú sigue abierto.
- Se guarda en la línea \`<!-- tabelle: … -->\` encima de la tabla; las filas y columnas conservan su formato cuando se agregan o se quitan otras. Otros programas de Markdown muestran la tabla sin este formato.
- En el modo oscuro los colores son oscuros; al imprimir, siempre claros.`,
    ui: {"menu":"Formato","scope":"Aplica a","cell":"Celda","row":"Fila","header":"Fila de encabezado","col":"Columna","farbe":"Color","keine":"Ninguno","fett":"Negrita","breite":"Ancho de columna","hoehe":"Alto de fila","auto":"Automático","voll":"Ancho completo"},
    farben: {"gelb":"Amarillo","orange":"Naranja","rot":"Rojo","pink":"Rosa","violett":"Violeta","blau":"Azul","tuerkis":"Turquesa","gruen":"Verde","grau":"Gris"},
    breiten: {"schmal":"Angosto","mittel":"Medio","breit":"Ancho"},
    hoehen: {"hoch":"Alto","sehr-hoch":"Muy alto"},
  },
  'pt': {
    name: "Formatar tabelas",
    description: "Cor, negrito, largura da coluna, altura da linha e largura total para tabelas na pré-visualização, com o botão direito numa célula (a partir do NoNotes 2.10.0).",
    help: `Formata **tabelas** na pré-visualização: clique com o botão direito numa célula → **Formatar ▸**.

- **Aplica-se a** célula, linha ou coluna (na linha de cabeçalho: a linha de cabeçalho). Para isso, **Cor** ({FARBEN} ou nenhuma) e **Negrito**. Se se aplicarem várias, a célula prevalece sobre a linha e a linha sobre a coluna.
- **Largura da coluna**: Auto, {BREITEN}. **Altura da linha**: Auto, {HOEHEN}. **Largura total** estende a tabela por toda a pré-visualização.
- Cada escolha tem efeito imediato e o submenu fica aberto.
- O formato é guardado na linha \`<!-- tabelle: … -->\` por cima da tabela; as linhas e colunas mantêm o formato quando se acrescentam ou removem outras. Outros programas de Markdown mostram a tabela sem este formato.
- No modo escuro, as cores são escuras; na impressão, são sempre claras.`,
    ui: {"menu":"Formatar","scope":"Aplica-se a","cell":"Célula","row":"Linha","header":"Linha de cabeçalho","col":"Coluna","farbe":"Cor","keine":"Nenhuma","fett":"Negrito","breite":"Largura da coluna","hoehe":"Altura da linha","auto":"Auto","voll":"Largura total"},
    farben: {"gelb":"Amarelo","orange":"Laranja","rot":"Vermelho","pink":"Rosa","violett":"Violeta","blau":"Azul","tuerkis":"Turquesa","gruen":"Verde","grau":"Cinzento"},
    breiten: {"schmal":"Estreita","mittel":"Média","breit":"Larga"},
    hoehen: {"hoch":"Alta","sehr-hoch":"Muito alta"},
  },
  'pt-br': {
    name: "Formatar tabelas",
    description: "Cor, negrito, largura da coluna, altura da linha e largura total para tabelas na prévia, com um clique direito em uma célula (a partir do NoNotes 2.10.0).",
    help: `Formata **tabelas** na prévia: clique direito em uma célula → **Formatar ▸**.

- **Aplicar a** célula, linha ou coluna (na linha de cabeçalho: a linha de cabeçalho). Para isso, **Cor** ({FARBEN} ou nenhuma) e **Negrito**. Se mais de uma opção valer, a célula tem prioridade sobre a linha, e a linha sobre a coluna.
- **Largura da coluna**: Automática, {BREITEN}. **Altura da linha**: Automática, {HOEHEN}. **Largura total** estende a tabela por toda a prévia.
- Cada escolha vale na hora; o submenu continua aberto.
- O formato é salvo na linha \`<!-- tabelle: … -->\` acima da tabela; linhas e colunas mantêm o formato quando outras são acrescentadas ou removidas. Outros programas de Markdown mostram a tabela sem esse formato.
- No modo escuro, as cores são escuras; na impressão, sempre claras.`,
    ui: {"menu":"Formatar","scope":"Aplicar a","cell":"Célula","row":"Linha","header":"Linha de cabeçalho","col":"Coluna","farbe":"Cor","keine":"Nenhuma","fett":"Negrito","breite":"Largura da coluna","hoehe":"Altura da linha","auto":"Automática","voll":"Largura total"},
    farben: {"gelb":"Amarelo","orange":"Laranja","rot":"Vermelho","pink":"Rosa","violett":"Violeta","blau":"Azul","tuerkis":"Turquesa","gruen":"Verde","grau":"Cinza"},
    breiten: {"schmal":"Estreita","mittel":"Média","breit":"Larga"},
    hoehen: {"hoch":"Alta","sehr-hoch":"Muito alta"},
  },
  /* </uebersetzungen> */
};
const tbfJe = k => Object.fromEntries(Object.entries(TBF_TEXTE).map(([l, v]) => [l, v[k]]));
const tbfSprache = lang => { const l = String(lang || 'de').toLowerCase(); return TBF_TEXTE[l] || TBF_TEXTE[l.split('-')[0]] || TBF_TEXTE.en; };
/** Hilfetext einer Sprache mit den Namen der Farben, Breiten und Höhen. */
const tbfHilfe = v => v.help.replace('{FARBEN}', Object.values(v.farben).join(', ')).replace('{BREITEN}', Object.values(v.breiten).join(', ')).replace('{HOEHEN}', Object.values(v.hoehen).join(', '));

NoNotesPlugins.register({
  id: 'table-format',
  name: TBF_TEXTE.de.name,
  version: '1.1.0',
  api: 1,
  description: TBF_TEXTE.de.description,
  names: tbfJe('name'),
  descriptions: tbfJe('description'),
  help: Object.fromEntries(Object.entries(TBF_TEXTE).map(([l, v]) => [l, tbfHilfe(v)])),

  activate(ctx) {
    if (!ctx.tables || !ctx.ui.addTableMenuItem) {
      console.warn('Tabellen formatieren: braucht NoNotes 2.10.0 oder neuer'); // i18n-ignore
      return;
    }
    const ID = ctx.id;
    const TX = tbfSprache(ctx.language());
    const T = TX.ui;
    const name = (x, art) => TX[art][x.id] || x.id;

    const style = document.createElement('style');
    style.id = 'tableFormatStyle';
    // #printArea: der Druck setzt eigene Flächen für die Titel, die Farben der Erweiterung gehen vor
    const flaeche = s => TBF_FARBEN.map(f => `table.md-table tr > .tbf-${f.id}, #printArea table.md-table tr > .tbf-${f.id} { background: ${f[s]}; }`).join('\n');
    style.textContent = `${flaeche('light')}
@media screen and (prefers-color-scheme: dark) {
${flaeche('dark')}
}
.tbf-panel { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; min-width: 250px; font-size: 13px; }
.tbf-panel .tbf-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.tbf-panel .tbf-label { color: var(--muted); min-width: 92px; }
.tbf-panel .tbf-seg { display: inline-flex; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
.tbf-panel .tbf-seg button { all: unset; cursor: pointer; padding: 3px 8px; font-size: 12px; color: var(--text); }
.tbf-panel .tbf-seg button + button { border-left: 1px solid var(--border); }
.tbf-panel .tbf-seg button[aria-pressed="true"] { background: var(--accent); color: var(--accent-contrast, #fff); }
.tbf-panel .tbf-seg button:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }
.tbf-panel .tbf-swatches { display: grid; grid-template-columns: repeat(5, 22px); gap: 5px; }
.tbf-panel .tbf-swatch { all: unset; box-sizing: border-box; width: 22px; height: 22px; border-radius: 5px; border: 1px solid var(--border); cursor: pointer; }
.tbf-panel .tbf-swatch[aria-pressed="true"] { outline: 2px solid var(--accent); outline-offset: 1px; }
.tbf-panel .tbf-swatch:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.tbf-panel .tbf-none { background: linear-gradient(135deg, transparent 45%, var(--danger, #c00) 46%, var(--danger, #c00) 54%, transparent 55%), var(--panel); }
${TBF_FARBEN.map(f => `.tbf-panel .tbf-swatch.tbf-${f.id} { background: ${f.light}; }`).join('\n')}
@media (prefers-color-scheme: dark) {
${TBF_FARBEN.map(f => `.tbf-panel .tbf-swatch.tbf-${f.id} { background: ${f.dark}; }`).join('\n')}
}
.tbf-panel hr { border: 0; border-top: 1px solid var(--border); margin: 2px 0; width: 100%; }
.tbf-panel label { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }`;
    document.head.appendChild(style);

    const offFormat = ctx.tables.format(info => tbfFormat(info.meta[ID], info));

    /** Untermenü für das angeklickte Feld. Hält das eigene Format mit, damit die Knöpfe nach jeder Wahl stimmen. */
    function feld(target, api) {
      let mine = JSON.parse(JSON.stringify(target.meta[ID] || {}));
      let scope = 'cell';
      const rowKey = target.row < 0 ? 'h' : String(target.row);
      const keyOf = s => (s === 'cell' ? `${rowKey},${target.col}` : s === 'row' ? rowKey : String(target.col));
      const entry = (s, k) => ((mine[s === 'cell' ? 'cells' : s === 'row' ? 'rows' : 'cols'] || {})[k || keyOf(s)] || {});

      const panel = document.createElement('div');
      panel.className = 'tbf-panel';
      const line = label => { const d = document.createElement('div'); d.className = 'tbf-row'; const l = document.createElement('span'); l.className = 'tbf-label'; l.textContent = label; d.appendChild(l); panel.appendChild(d); return d; };
      const seg = (row, items, onPick) => {
        const box = document.createElement('div');
        box.className = 'tbf-seg';
        box.setAttribute('role', 'group');
        const buttons = items.map(it => {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = it.label;
          b.dataset.value = it.value;
          b.addEventListener('click', () => onPick(it.value));
          box.appendChild(b);
          return b;
        });
        row.appendChild(box);
        return value => buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.value === value)));
      };

      const save = (s, k, set) => {
        mine = tbfChange(mine, s, k, set) || {};
        if (api.applied) api.applied();
        paint();
        return ctx.tables.update(target, meta => { meta[ID] = tbfChange(meta[ID], s, k, set); });
      };

      const scopeRow = line(T.scope);
      const paintScope = seg(scopeRow, [{ value: 'cell', label: T.cell }, { value: 'row', label: target.row < 0 ? T.header : T.row }, { value: 'col', label: T.col }],
        v => { scope = v; paint(); });

      const farbRow = line(T.farbe);
      const swatches = document.createElement('div');
      swatches.className = 'tbf-swatches';
      const farbKnoepfe = [{ id: '', label: T.keine }].concat(TBF_FARBEN.map(f => ({ id: f.id, label: name(f, 'farben') }))).map(f => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'tbf-swatch ' + (f.id ? 'tbf-' + f.id : 'tbf-none');
        b.title = f.label;
        b.setAttribute('aria-label', f.label);
        b.dataset.farbe = f.id;
        b.addEventListener('click', () => save(scope, keyOf(scope), e => { e.farbe = f.id || null; }));
        swatches.appendChild(b);
        return b;
      });
      farbRow.appendChild(swatches);

      const fettRow = line('');
      const fettLabel = document.createElement('label');
      const fett = document.createElement('input');
      fett.type = 'checkbox';
      fett.className = 'tbf-fett';
      fett.addEventListener('change', () => save(scope, keyOf(scope), e => { e.fett = fett.checked || null; }));
      fettLabel.append(fett, T.fett);
      fettRow.appendChild(fettLabel);

      panel.appendChild(document.createElement('hr'));
      const paintBreite = seg(line(T.breite), [{ value: '', label: T.auto }].concat(TBF_BREITEN.map(b => ({ value: b.id, label: name(b, 'breiten') }))),
        v => save('col', String(target.col), e => { e.breite = v || null; }));
      const paintHoehe = seg(line(T.hoehe), [{ value: '', label: T.auto }].concat(TBF_HOEHEN.map(h => ({ value: h.id, label: name(h, 'hoehen') }))),
        v => save('row', rowKey, e => { e.hoehe = v || null; }));
      const vollRow = line('');
      const vollLabel = document.createElement('label');
      const voll = document.createElement('input');
      voll.type = 'checkbox';
      voll.className = 'tbf-voll';
      voll.addEventListener('change', () => save(null, null, m => { m.voll = voll.checked || null; }));
      vollLabel.append(voll, T.voll);
      vollRow.appendChild(vollLabel);

      function paint() {
        paintScope(scope);
        const e = entry(scope);
        for (const b of farbKnoepfe) b.setAttribute('aria-pressed', String((e.farbe || '') === b.dataset.farbe));
        fett.checked = e.fett === true;
        paintBreite(entry('col', String(target.col)).breite || '');
        paintHoehe(entry('row', rowKey).hoehe || '');
        voll.checked = mine.voll === true;
      }
      paint();
      return panel;
    }

    ctx.ui.addTableMenuItem({ label: T.menu, panel: (target, api) => feld(target, api) });

    tbfAusschalten = () => { offFormat(); style.remove(); };
  },

  deactivate() {
    if (tbfAusschalten) tbfAusschalten();
    tbfAusschalten = null;
  },
});
