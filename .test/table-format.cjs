/* Test der Erweiterung «Tabellen formatieren» (table-format/) in der echten App: baut NoNotes mit diesem Repository
   (tools/build.cjs --plugins) und prüft im Browser Farbe, Fett, Breite, Höhe und ganze Breite über das Untermenü, die
   Reihenfolge Feld vor Zeile vor Spalte, Mitwandern beim Einfügen, hell und dunkel, Druck, Ausschalten, Englisch, Hilfe.

   Aufruf: NONOTES_CORE=../NoNotes node .test/table-format.cjs   (der Kern ab 2.10.0 braucht npm install, Playwright mit Chromium) */
'use strict';

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const CORE = path.resolve(process.env.NONOTES_CORE || path.join(REPO, '..', 'NoNotes'));
const { chromium } = require(path.join(CORE, 'node_modules', 'playwright'));
const READY = 'body[data-ready="true"]';
const SAVED = () => document.querySelector('#status').dataset.state === 'saved';
const FILE = 'table-format/table-format.js';

/** Farben, Breiten und die reinen Funktionen aus der Datei, ohne Browser. */
function fromFile() {
  const box = { NoNotesPlugins: { register() {} }, console };
  box.window = box;
  vm.runInNewContext(fs.readFileSync(path.join(REPO, FILE), 'utf8') + '\n;globalThis.__x = { TBF_FARBEN, TBF_BREITEN, TBF_HOEHEN, tbfFormat, tbfChange };', box);
  return box.__x;
}
const json = v => JSON.parse(JSON.stringify(v));
const lum = h => { const n = parseInt(h.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const rgb = h => { const n = parseInt(h.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
const hexOf = s => '#' + s.match(/\d+/g).slice(0, 3).map(v => Number(v).toString(16).padStart(2, '0')).join('');

async function main() {
  const started = Date.now();
  const steps = [];
  const part = name => { steps.push(name); console.log('  ✓ ' + name); };

  // ---------- Reine Funktionen ----------
  const X = fromFile();
  assert.equal(new Set(X.TBF_FARBEN.map(f => f.id)).size, X.TBF_FARBEN.length);
  for (const f of X.TBF_FARBEN) assert.match(f.id, /^[a-z]+$/, f.id);
  const info = { header: true, rows: 2, cols: 3 };
  const mine = {
    voll: true,
    cols: { 0: { breite: 'schmal', farbe: 'grau' }, 2: { fett: true, breite: 'unsinn' } },
    rows: { h: { hoehe: 'hoch', farbe: 'blau' }, 1: { farbe: 'gelb', hoehe: 'sehr-hoch' } },
    cells: { '1,0': { farbe: 'rot' }, '0,1': { farbe: 'kaputt', fett: true } },
  };
  assert.deepEqual(json(X.tbfFormat(mine, info)), {
    table: { width: '100%' },
    columns: { 0: { width: '6em', minWidth: '6em' } },
    header: { height: '2.8em' },
    rows: { 1: { height: '4.5em' } },
    cells: {
      'h,0': { class: 'tbf-blau' }, 'h,1': { class: 'tbf-blau' }, 'h,2': { class: 'tbf-blau', fontWeight: 'bold' },
      '0,0': { class: 'tbf-grau' }, '0,1': { fontWeight: 'bold' }, '0,2': { fontWeight: 'bold' },
      '1,0': { class: 'tbf-rot' }, '1,1': { class: 'tbf-gelb' }, '1,2': { class: 'tbf-gelb', fontWeight: 'bold' },
    },
  }, 'Feld vor Zeile vor Spalte; Unbekanntes zählt nicht');
  assert.equal(X.tbfFormat(null, info), null);
  assert.deepEqual(json(X.tbfChange({ cells: { '0,0': { farbe: 'rot' } } }, 'cell', '0,0', e => { e.farbe = null; })), null, 'leer: nichts übrig');
  assert.deepEqual(json(X.tbfChange({ voll: true }, 'row', 'h', e => { e.fett = true; })), { voll: true, rows: { h: { fett: true } } });
  assert.deepEqual(json(X.tbfChange({ voll: true, rows: { h: { fett: true } } }, null, null, m => { m.voll = null; })), { rows: { h: { fett: true } } });
  part('Reine Funktionen: Reihenfolge Feld, Zeile, Spalte; Breite, Höhe, ganze Breite; Unbekanntes zählt nicht; leere Angaben fallen weg');

  // ---------- App mit diesem Repository bauen ----------
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nonotes-table-format-'));
  const out = path.join(tmp, 'app');
  const built = spawnSync(process.execPath, [path.join(CORE, 'tools', 'build.cjs'), '--plugins', REPO, '--out', out], { cwd: CORE, encoding: 'utf8' });
  assert.equal(built.status, 0, built.stderr || built.stdout);
  assert.ok(fs.existsSync(path.join(out, 'plugins', FILE)), 'die Erweiterung ist im Paket');
  assert.ok(!fs.existsSync(path.join(out, 'plugins', '.test')), 'der Test nicht');
  assert.match(fs.readFileSync(path.join(out, 'plugins', 'plugins.js'), 'utf8'), /"id":"table-format","name":"Tabellen formatieren","version":"1\.0\.1","api":1,"description":"Farbe, Fett[^"]+"/, 'im Verzeichnis der Erweiterungen, mit Beschreibung');
  part('Paket: Erweiterung im Ordner plugins/ und im Verzeichnis, der Test nicht');

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, locale: 'de-CH', colorScheme: 'light' });
    await ctx.addInitScript(f => {
      try { if (!localStorage.getItem('nonotes.plugins')) localStorage.setItem('nonotes.plugins', JSON.stringify([f])); } catch (e) { /* egal */ }
      window.__printed = [];
      window.print = () => { window.__printed.push(document.getElementById('printArea').innerHTML); };
    }, FILE);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
    await page.goto('file://' + path.join(out, 'index.html'));
    await page.waitForSelector(READY, { timeout: 30000 });
    await page.waitForSelector('#tableFormatStyle', { state: 'attached' });

    // Notiz mit Tabelle, in der Vorschau
    await page.click('#mindmap', { position: { x: 30, y: 700 } });
    await page.keyboard.press('Tab');
    await page.keyboard.type('Plan');
    await page.keyboard.press('Enter');
    await page.dblclick('g.mm-node:has(> text:text-is("Plan"))');
    await page.waitForSelector('body.editor-open');
    await page.fill('#body', 'Ablauf\n\n| Phase | Start | Wer |\n|---|---|---|\n| Analyse | 01.11. | Anna |\n| Konzept | 16.11. | Ben |\n| Test | 01.02. | Cem |\n');
    await page.click('[data-mode="preview"]');
    await page.waitForSelector('#preview table.md-table');
    const body = () => page.inputValue('#body');
    const metaOf = async () => { const m = /<!-- tabelle: (\{.*\}) -->/.exec(await body()); return m ? JSON.parse(m[1]) : null; };
    const cellSel = (r, c) => (r === 'h' ? `#preview thead th[data-col="${c}"]` : `#preview tbody tr[data-row="${r}"] > [data-col="${c}"]`);
    const bg = (r, c) => page.locator(cellSel(r, c)).evaluate(e => getComputedStyle(e).backgroundColor);
    const openPanel = async (r, c) => {
      await page.locator(cellSel(r, c)).click({ button: 'right' });
      await page.waitForSelector('#contextMenu:not([hidden])');
      await page.hover('#contextMenu button:has-text("Formatieren")');
      await page.waitForSelector('.context-sub .tbf-panel');
    };
    const pick = sel => page.click(`.context-sub ${sel}`);
    const scope = label => page.click(`.context-sub .tbf-seg button:has-text("${label}")`);
    const settle = () => page.waitForFunction(SAVED, null, { timeout: 10000 });
    const byId = Object.fromEntries(X.TBF_FARBEN.map(f => [f.id, f]));

    // Feld, dann Zeile, dann Spalte, alles im selben offenen Untermenü
    await openPanel(1, 1);
    assert.deepEqual(await page.locator('.context-sub .tbf-seg >> nth=0').locator('button').allInnerTexts(), ['Feld', 'Zeile', 'Spalte']);
    assert.equal(await page.getAttribute('.context-sub .tbf-seg button:has-text("Feld")', 'aria-pressed'), 'true');
    await pick('.tbf-swatch.tbf-rot');
    await page.waitForFunction(() => document.querySelector('#preview tbody tr[data-row="1"] > [data-col="1"]').classList.contains('tbf-rot'));
    assert.equal(await page.locator('.context-sub').isVisible(), true, 'das Untermenü bleibt offen');
    await scope('Zeile');
    assert.equal(await page.getAttribute('.context-sub .tbf-swatch.tbf-none', 'aria-pressed'), 'true', 'die Zeile hat noch keine Farbe');
    await pick('.tbf-swatch.tbf-gelb');
    await pick('.tbf-fett');
    await scope('Spalte');
    await pick('.tbf-swatch.tbf-blau');
    await page.click('.context-sub .tbf-seg button:has-text("Schmal")');
    await page.click('.context-sub .tbf-seg button:has-text("Hoch")');
    await pick('.tbf-voll');
    await scope('Feld');
    assert.equal(await page.getAttribute('.context-sub .tbf-swatch.tbf-rot', 'aria-pressed'), 'true', 'zurück beim Feld: rot markiert');
    await page.keyboard.press('Escape');
    await settle();
    assert.deepEqual((await metaOf())['table-format'], {
      voll: true,
      cells: { '1,1': { farbe: 'rot' } },
      rows: { 1: { farbe: 'gelb', fett: true, hoehe: 'hoch' } },
      cols: { 1: { farbe: 'blau', breite: 'schmal' } },
    });
    assert.equal(await bg(1, 1), rgb(byId.rot.light), 'Feld vor Zeile');
    assert.equal(await bg(1, 0), rgb(byId.gelb.light), 'Zeile vor Spalte');
    assert.equal(await bg(0, 1), rgb(byId.blau.light), 'Spalte');
    assert.equal(await bg('h', 1), rgb(byId.blau.light), 'die Spalte gilt auch in der Titelzeile');
    assert.equal(await page.locator(cellSel(1, 2)).evaluate(e => getComputedStyle(e).fontWeight), '700', 'Zeile fett');
    assert.equal(await page.locator(cellSel(1, 2)).evaluate(e => Math.round(e.getBoundingClientRect().height)) >= 40, true, 'Zeile hoch');
    assert.equal(await page.locator('#preview table.md-table').evaluate(t => Math.abs(t.getBoundingClientRect().width - t.parentElement.clientWidth + 36) < 3), true, 'ganze Breite');
    assert.equal(await page.locator(cellSel(0, 1)).getAttribute('style'), 'width: 6em; min-width: 6em');
    const textColor = await page.locator(cellSel(1, 1)).evaluate(e => getComputedStyle(e).color);
    for (const f of X.TBF_FARBEN) assert.ok(contrast(f.light, hexOf(textColor)) >= 7, `${f.id} hell: Text lesbar`);
    part('Untermenü: Farbe für Feld, Zeile und Spalte, Fett, Breite, Höhe, ganze Breite; Feld vor Zeile vor Spalte; bleibt offen');

    // Kern: Zeile darüber einfügen, Spalte links einfügen → die Angaben wandern mit
    await page.locator(cellSel(0, 0)).click({ button: 'right' });
    await page.click('#contextMenu button:has-text("Zeile darüber einfügen")');
    await page.locator(cellSel(0, 0)).click({ button: 'right' });
    await page.click('#contextMenu button:has-text("Spalte links einfügen")');
    await settle();
    assert.deepEqual((await metaOf())['table-format'], {
      voll: true, cells: { '2,2': { farbe: 'rot' } }, rows: { 2: { farbe: 'gelb', fett: true, hoehe: 'hoch' } }, cols: { 2: { farbe: 'blau', breite: 'schmal' } },
    });
    assert.equal(await bg(2, 2), rgb(byId.rot.light), 'das rote Feld ist mitgewandert');
    part('Zeilen und Spalten einfügen: Farben, Breite und Höhe wandern mit');

    // Titelzeile: «Zeile» heisst dort «Titelzeile»; Farbe gegen die Hervorhebung des Kerns
    await page.locator(cellSel('h', 0)).click({ button: 'right' });
    await page.click('#contextMenu button:has-text("Titel hervorheben")');
    await openPanel('h', 0);
    assert.deepEqual(await page.locator('.context-sub .tbf-seg >> nth=0').locator('button').allInnerTexts(), ['Feld', 'Titelzeile', 'Spalte']);
    await scope('Titelzeile');
    await pick('.tbf-swatch.tbf-gruen');
    await page.keyboard.press('Escape');
    await settle();
    assert.equal(await bg('h', 0), rgb(byId.gruen.light), 'Farbe der Erweiterung vor «Titel hervorheben»');
    assert.equal(await bg('h', 2), rgb(byId.gruen.light), 'auch in der Titelzeile: Zeile vor Spalte');
    part('Titelzeile: eigener Name im Untermenü, Farbe schlägt die Hervorhebung');

    // Dunkel
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForFunction(c => getComputedStyle(document.querySelector('#preview tbody tr[data-row="2"] > [data-col="2"]')).backgroundColor === c, rgb(byId.rot.dark));
    const darkText = await page.locator(cellSel(2, 2)).evaluate(e => getComputedStyle(e).color);
    for (const f of X.TBF_FARBEN) assert.ok(contrast(f.dark, hexOf(darkText)) >= 7, `${f.id} dunkel: Text lesbar (${contrast(f.dark, hexOf(darkText)).toFixed(1)})`);
    assert.equal(await bg('h', 0), rgb(byId.gruen.dark));
    part('Dunkle Einstellung: dunkle Flächen, Text lesbar (7:1)');

    // Druck: immer hell, auch gegen die Flächen des Drucks für Titel
    await page.keyboard.press('Control+p');
    await page.waitForSelector('#printDialog[open]');
    await page.click('#printGoBtn');
    await page.waitForFunction(() => window.__printed.length === 1);
    const printed = await page.evaluate(() => window.__printed[0]);
    assert.ok(printed.includes('class="tbf-rot"') && printed.includes('width: 100%'), 'Angaben im Druck');
    await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
    const inPrint = await page.evaluate(html => {
      const area = document.getElementById('printArea');
      area.innerHTML = html;
      const c = sel => getComputedStyle(area.querySelector(sel)).backgroundColor;
      const out = { feld: c('tbody tr[data-row="2"] > [data-col="2"]'), titel: c('thead th[data-col="0"]') };
      area.innerHTML = '';
      return out;
    }, printed);
    await page.emulateMedia({ media: 'screen', colorScheme: 'light' });
    assert.deepEqual(inPrint, { feld: rgb(byId.rot.light), titel: rgb(byId.gruen.light) }, 'gedruckt hell, auch die Titelzeile');
    part('Druck: Klassen und Breite dabei, Farben hell (auch bei dunkler Einstellung), Titel in der Farbe der Erweiterung');

    // Ausschalten zur Laufzeit: Vorschau ohne Angaben, das Format bleibt im Text
    const before = await metaOf();
    const toggle = async on => {
      await page.click('#backBtn');
      await page.waitForSelector('body:not(.editor-open)');
      await page.click('#menuBtn');
      await page.click('#pluginsBtn');
      await page.waitForSelector('#pluginsDialog[open]');
      if (on) await page.check(`#pluginList input[data-file="${FILE}"]`); else await page.uncheck(`#pluginList input[data-file="${FILE}"]`);
      await page.waitForFunction(want => !!document.getElementById('tableFormatStyle') === want, on);
      await page.keyboard.press('Escape');
      await page.dblclick('g.mm-node:has(> text:text-is("Plan"))');
      await page.waitForSelector('#preview table.md-table');
    };
    await toggle(false);
    await page.waitForFunction(() => !document.querySelector('#preview [class*="tbf-"]') && !document.querySelector('#preview table.md-table[style]'));
    assert.deepEqual(await metaOf(), before, 'das Format bleibt im Text');
    await page.locator(cellSel(0, 0)).click({ button: 'right' });
    await page.waitForSelector('#contextMenu:not([hidden])');
    assert.equal(await page.locator('#contextMenu button:has-text("Formatieren")').count(), 0, 'kein Eintrag mehr');
    await page.keyboard.press('Escape');
    await toggle(true);
    await page.waitForFunction(() => !!document.querySelector('#preview .tbf-rot'));
    part('Aus- und wieder einschalten: Vorschau ohne und wieder mit Angaben, Format bleibt im Text, Eintrag weg und wieder da');

    // Hilfe
    await page.click('#backBtn');
    await page.waitForSelector('body:not(.editor-open)');
    await page.click('#menuBtn');
    await page.click('#menuHelpBtn');
    await page.waitForSelector('#helpDialog[open]');
    await page.click('#helpTabs button[data-tab="plugins"]');
    const help = await page.locator('#helpDialog .help-panel[data-panel="plugins"]').innerText();
    for (const t of ['Tabellen formatieren', 'Formatieren ▸', 'Spaltenbreite', 'Zeilenhöhe', 'Ganze Breite', 'Gelb']) assert.ok(help.includes(t), 'Hilfe nennt ' + t);
    await page.keyboard.press('Escape');
    part('Hilfe: Abschnitt mit Bedienung und Farben');
    assert.deepEqual(errors, [], 'keine Fehler und Warnungen im Browser');
    await ctx.close();

    // Englisch
    const ctxEn = await browser.newContext({ viewport: { width: 1400, height: 900 }, locale: 'en-GB', colorScheme: 'light' });
    await ctxEn.addInitScript(f => { try { if (!localStorage.getItem('nonotes.plugins')) { localStorage.setItem('nonotes.plugins', JSON.stringify([f])); localStorage.setItem('nonotes.lang', 'en'); } } catch (e) { /* egal */ } }, FILE);
    const en = await ctxEn.newPage();
    const errorsEn = [];
    en.on('pageerror', e => errorsEn.push('pageerror: ' + e.message));
    await en.goto('file://' + path.join(out, 'index.html'));
    await en.waitForSelector(READY, { timeout: 30000 });
    await en.click('#mindmap', { position: { x: 30, y: 700 } });
    await en.keyboard.press('Tab');
    await en.keyboard.type('Plan');
    await en.keyboard.press('Enter');
    await en.dblclick('g.mm-node:has(> text:text-is("Plan"))');
    await en.waitForSelector('body.editor-open');
    await en.fill('#body', '| A | B |\n|---|---|\n| 1 | 2 |\n');
    await en.click('[data-mode="preview"]');
    await en.locator('#preview tbody td >> nth=0').click({ button: 'right' });
    await en.waitForSelector('#contextMenu:not([hidden])');
    const labels = await en.evaluate(() => [...document.querySelectorAll('#contextMenu button')].map(b => b.textContent.trim()));
    assert.deepEqual(labels.slice(0, 3), ['Header row', 'Header column', 'Highlight headers'], 'Menü des Kerns auf Englisch');
    assert.ok(labels.includes('Insert row above') && labels.includes('Delete column') && labels.some(l => l.startsWith('Format')), labels.join(' | '));
    await en.hover('#contextMenu button:has-text("Format")');
    await en.waitForSelector('.context-sub .tbf-panel');
    const panelText = await en.locator('.context-sub .tbf-panel').innerText();
    for (const t of ['Applies to', 'Cell', 'Row', 'Column', 'Colour', 'Bold', 'Column width', 'Narrow', 'Row height', 'Tall', 'Full width']) assert.ok(panelText.includes(t), 'englisch: ' + t);
    assert.equal(await en.getAttribute('.context-sub .tbf-swatch.tbf-gelb', 'aria-label'), 'Yellow');
    assert.deepEqual(errorsEn, []);
    await ctxEn.close();
    part('Englische Oberfläche: «Format ▸» mit englischen Beschriftungen, Menü des Kerns englisch');
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`\nTest «Tabellen formatieren» bestanden (${steps.length} Teile, ${Math.round((Date.now() - started) / 1000)} s).`);
}

main().catch(e => { console.error('\nTest «Tabellen formatieren» FEHLGESCHLAGEN'); console.error(e); process.exit(1); });
