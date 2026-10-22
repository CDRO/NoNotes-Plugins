/* Test der Erweiterung «Farben über Tags» (tag-colors/) in der echten App: baut NoNotes mit diesem Repository
   (tools/build.cjs --plugins) und prüft im Browser Farben, Weitergabe an Unternotizen, Auswahl, hell/dunkel, Ausschalten.
   Der Ordner .test/ geht nicht ins Paket (der Build überspringt Ordner mit Punkt).

   Aufruf: NONOTES_CORE=../NoNotes node .test/tag-colors.cjs   (der Kern braucht npm install, Playwright mit Chromium) */
'use strict';

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const REPO = path.resolve(__dirname, '..');
const CORE = path.resolve(process.env.NONOTES_CORE || path.join(REPO, '..', 'NoNotes'));
const { chromium } = require(path.join(CORE, 'node_modules', 'playwright'));
const READY = 'body[data-ready="true"]';
const SAVED = () => document.querySelector('#status').dataset.state === 'saved';
const FILE = 'tag-colors/tag-colors.js';

/** Die Farbtabelle aus der Datei, ohne Browser. */
function colorsOfFile() {
  const src = fs.readFileSync(path.join(REPO, FILE), 'utf8');
  const box = { NoNotesPlugins: { register() {} }, console };
  box.window = box;
  require('node:vm').runInNewContext(src + '\n;globalThis.__f = FARBEN;', box);
  return JSON.parse(JSON.stringify(box.__f)); // als Daten dieses Kontexts (Arrays aus vm haben einen anderen Prototyp)
}

const lum = h => { const n = parseInt(h.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const rgb = h => { const n = parseInt(h.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };

async function main() {
  const started = Date.now();
  const steps = [];
  const part = name => { steps.push(name); console.log('  ✓ ' + name); };

  // ---------- Farbtabelle ----------
  const colors = colorsOfFile();
  assert.equal(colors.length, 16, '16 Farben');
  assert.equal(new Set(colors.map(c => c.id)).size, 16, 'deutsche Namen eindeutig');
  assert.equal(new Set(colors.map(c => c.en)).size, 16, 'englische Namen eindeutig');
  for (const c of colors) {
    assert.match(c.id + c.en, /^[a-z]+$/, `${c.id}: nur Kleinbuchstaben`);
    for (const s of ['light', 'dark']) {
      assert.ok(contrast(c[s].fill, c[s].line) >= 5, `${c.id} ${s}: Titel auf der Fläche lesbar (5:1)`);
    }
    assert.ok(lum(c.light.fill) > lum(c.light.line), `${c.id} hell: Fläche heller als die Umrandung`);
    assert.ok(lum(c.dark.fill) < lum(c.dark.line), `${c.id} dunkel: Fläche dunkler als die Umrandung`);
  }
  part('Farbtabelle: 16 Farben, eindeutige Namen, Titel lesbar (5:1), Fläche hell und Umrandung dunkel (dunkel umgekehrt)');

  // ---------- App mit diesem Repository bauen ----------
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nonotes-tag-colors-'));
  const out = path.join(tmp, 'app');
  const built = spawnSync(process.execPath, [path.join(CORE, 'tools', 'build.cjs'), '--plugins', REPO, '--out', out], { cwd: CORE, encoding: 'utf8' });
  assert.equal(built.status, 0, built.stderr || built.stdout);
  assert.ok(fs.existsSync(path.join(out, 'plugins', FILE)), 'die Erweiterung ist im Paket');
  assert.ok(!fs.existsSync(path.join(out, 'plugins', '.test')), 'der Test nicht');
  const catalog = fs.readFileSync(path.join(out, 'plugins', 'plugins.js'), 'utf8');
  assert.match(catalog, /"id":"tag-farben"/, 'im Verzeichnis der Erweiterungen');
  part('Paket: Erweiterung im Ordner plugins/ und im Verzeichnis, der Test nicht');

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, locale: 'de-CH', colorScheme: 'light' });
    await ctx.addInitScript(f => { try { if (!localStorage.getItem('nonotes.plugins')) localStorage.setItem('nonotes.plugins', JSON.stringify([f])); } catch (e) { /* egal */ } }, FILE);
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
    await page.goto('file://' + path.join(out, 'index.html'));
    await page.waitForSelector(READY, { timeout: 30000 });
    await page.waitForSelector('#tagFarbenStyle', { state: 'attached' });

    const node = title => page.locator(`g.mm-node:has(> text:text-is("${title}"))`);
    async function newNote(title, parent) {
      if (parent) await node(parent).click();
      else await page.click('#mindmap', { position: { x: 30, y: 700 } });
      await page.keyboard.press('Tab');
      await page.waitForSelector('#renameInput:not([hidden])');
      await page.keyboard.type(title);
      await page.keyboard.press('Enter');
      await node(title).waitFor();
    }
    async function tag(title, ...tags) {
      await node(title).dblclick();
      await page.waitForFunction(t => document.body.classList.contains('editor-open') && document.querySelector('#title').value === t, title);
      for (const t of tags) { await page.fill('#tagInput', t); await page.keyboard.press('Enter'); }
      await page.waitForFunction(SAVED);
      await page.click('#backBtn');
      await page.waitForSelector('body:not(.editor-open)');
    }
    const look = title => node(title).evaluate(g => {
      const r = getComputedStyle(g.querySelector(':scope > rect')), t = getComputedStyle(g.querySelector(':scope > text'));
      return { fill: r.fill, stroke: r.stroke, text: t.fill };
    });
    const byId = Object.fromEntries(colors.map(c => [c.id, c]));
    // Die App blendet Rand und Fläche über (transition): auf den Endwert warten, dann vergleichen
    const settle = (title, want) => page.waitForFunction(([t, w]) => {
      const g = [...document.querySelectorAll('g.mm-node')].find(x => x.querySelector(':scope > text').textContent === t);
      if (!g) return false;
      const r = getComputedStyle(g.querySelector(':scope > rect')), x = getComputedStyle(g.querySelector(':scope > text'));
      return Object.entries(w).every(([k, v]) => ({ fill: r.fill, stroke: r.stroke, text: x.fill })[k] === v);
    }, [title, want], { timeout: 5000 }).catch(() => {});
    const expect = async (title, id, scheme) => {
      await settle(title, id ? { fill: rgb(byId[id][scheme].fill), stroke: rgb(byId[id][scheme].line), text: rgb(byId[id][scheme].line) } : { fill: 'rgb(255, 255, 255)' });
      const l = await look(title);
      if (!id) { assert.equal(l.fill, 'rgb(255, 255, 255)', `${title}: ohne Farbe`); return; }
      const c = byId[id][scheme];
      assert.deepEqual(l, { fill: rgb(c.fill), stroke: rgb(c.line), text: rgb(c.line) }, `${title}: ${id} (${scheme})`);
    };

    // Baum: Projekt (rot, auch-kinder) → Teil A → Detail; Projekt → Teil B (blau, eigene Farbe); Andere (grün, ohne Weitergabe) → Kind;
    // Mehrere (gelb und blau: das erste in der Reihenfolge des Editors); Ohne; Tippfehler (unbekannte Farbe)
    await newNote('Projekt');
    await newNote('Teil A', 'Projekt');
    await newNote('Detail', 'Teil A');
    await newNote('Teil B', 'Projekt');
    await newNote('Andere');
    await newNote('Kind', 'Andere');
    await newNote('Mehrere');
    await newNote('Ohne');
    await newNote('Tippfehler');
    await tag('Projekt', 'Farbe:Rot', 'farbe:auch-kinder');
    await tag('Teil B', 'color:blue');
    await tag('Andere', 'farbe:grün');
    await tag('Mehrere', 'farbe:gelb', 'farbe:blau');
    await tag('Tippfehler', 'farbe:rosa', 'farbe : ');
    const deselect = async () => { await page.focus('#mindmap'); await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('g.mm-node.mm-selected, g.mm-node.mm-multi')); };
    await deselect(); // zurück in der Mindmap ist die zuletzt offene Notiz ausgewählt
    for (const [title, id] of [['Projekt', 'rot'], ['Teil A', 'rot'], ['Detail', 'rot'], ['Teil B', 'blau'], ['Andere', 'gruen'], ['Kind', null],
      ['Mehrere', 'blau'], ['Ohne', null], ['Tippfehler', null]]) await expect(title, id, 'light');
    const root = await page.evaluate(() => getComputedStyle(document.querySelector('g.mm-root > rect')).fill);
    assert.equal(root, rgb('#2563eb'), 'die Wurzel bleibt in der Hauptfarbe');
    part('Farben: Tag farbe:/color: in beiden Sprachen, Gross-/Kleinschreibung, Umlaut, auch-kinder färbt alle Unternotizen, eigene Farbe gewinnt, ohne Weitergabe nicht, mehrere Tags: das erste, Unbekanntes nicht, Wurzel unverändert');

    // Auswahl: die Fläche behält die Farbe, der Rand zeigt die Auswahl
    await node('Andere').click();
    await page.waitForFunction(() => document.querySelector('g.mm-node.mm-selected'));
    await settle('Andere', { stroke: rgb('#2563eb') });
    const sel = await look('Andere');
    assert.equal(sel.fill, rgb(byId.gruen.light.fill), 'ausgewählt: Fläche in der Farbe');
    assert.equal(sel.stroke, rgb('#2563eb'), 'ausgewählt: Rand in der Hauptfarbe');
    await page.keyboard.press('Escape');
    part('Auswahl: Fläche bleibt gefärbt, der Rand zeigt die Auswahl');

    // Tag entfernen: nach dem Schliessen des Editors ohne Farbe; Unternotizen verlieren die geerbte Farbe
    await node('Projekt').dblclick();
    await page.waitForFunction(() => document.body.classList.contains('editor-open'));
    await page.click('button[aria-label="Tag farbe:auch-kinder entfernen"]');
    await page.waitForFunction(() => ![...document.querySelectorAll('.chip')].some(c => c.firstChild.textContent === 'farbe:auch-kinder'));
    await page.waitForFunction(SAVED);
    await page.click('#backBtn');
    await page.waitForSelector('body:not(.editor-open)');
    await deselect();
    assert.equal(await page.evaluate(() => document.querySelectorAll('#tagFarbenStyle').length), 1, 'ein Stylesheet');
    await expect('Projekt', 'rot', 'light');
    await expect('Teil A', null, 'light');
    await expect('Detail', null, 'light');
    await expect('Teil B', 'blau', 'light');
    part('Tag entfernt: ohne «auch-kinder» behalten nur Notizen mit eigener Farbe ihre Farbe');

    // Dunkler Modus
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect('Projekt', 'rot', 'dark');
    await expect('Teil B', 'blau', 'dark');
    await expect('Andere', 'gruen', 'dark');
    await page.emulateMedia({ colorScheme: 'light' });
    part('Dunkler Modus: Fläche dunkel, Umrandung und Titel hell');

    // Neuladen: gleich gefärbt
    await page.reload();
    await page.waitForSelector(READY, { timeout: 30000 });
    await expect('Mehrere', 'blau', 'light');
    await expect('Teil B', 'blau', 'light');
    part('Neuladen: dieselben Farben');

    // Ausschalten zur Laufzeit: alles zurück
    await page.click('#menuBtn');
    await page.click('#pluginsBtn');
    await page.waitForSelector('#pluginsDialog[open]');
    await page.uncheck(`#pluginList input[data-file="${FILE}"]`);
    await page.waitForFunction(() => !document.getElementById('tagFarbenStyle'));
    assert.equal(await page.evaluate(() => document.querySelectorAll('g.mm-node[class*="tf-"]').length), 0, 'keine Klassen mehr');
    await page.keyboard.press('Escape');
    await expect('Teil B', null, 'light');
    // und wieder ein
    await page.click('#menuBtn');
    await page.click('#pluginsBtn');
    await page.waitForSelector('#pluginsDialog[open]');
    await page.check(`#pluginList input[data-file="${FILE}"]`);
    await page.waitForSelector('#tagFarbenStyle', { state: 'attached' });
    await page.keyboard.press('Escape');
    await expect('Teil B', 'blau', 'light');
    part('Aus- und wieder einschalten zur Laufzeit: Farben weg und wieder da');

    // Rechtsklick (NoNotes ab 2.8.0): «Farbe ▸» mit 16 Feldern, «Keine Farbe», «Auch Unternotizen»
    const chips = async title => {
      await node(title).dblclick();
      await page.waitForFunction(t => document.body.classList.contains('editor-open') && document.querySelector('#title').value === t, title);
      // Tags gelten je Datei ohne Unterschied der Schreibweise: ein schon vorhandenes «Farbe:Rot» wird übernommen
      const out = await page.evaluate(() => [...document.querySelectorAll('#tagChips .chip')].map(c => c.firstChild.textContent.toLowerCase()));
      await page.click('#backBtn');
      await page.waitForSelector('body:not(.editor-open)');
      return out;
    };
    async function colorMenu(title) {
      await node(title).click({ button: 'right' });
      await page.waitForSelector('#contextMenu:not([hidden])');
      await page.hover('#contextMenu button[data-plugin="tag-farben"]');
      await page.waitForSelector('.context-sub .tf-panel[data-stand="geladen"]'); // Markierung und Häkchen kommen nachgeladen
    }
    const panelState = () => page.evaluate(() => {
      const box = document.querySelector('.tf-panel .tf-kinder');
      return { pressed: [...document.querySelectorAll('.tf-panel .tf-sw[aria-pressed="true"]')].map(b => b.dataset.farbe), checked: box.checked, mixed: box.indeterminate };
    });
    await node('Ohne').click({ button: 'right' });
    await page.waitForSelector('#contextMenu:not([hidden])');
    const item = page.locator('#contextMenu button[data-plugin="tag-farben"]');
    assert.equal(await item.locator('span').first().innerText(), 'Farbe');
    assert.equal(await item.locator('.key').innerText(), '▸');
    await page.keyboard.press('Escape');
    await colorMenu('Ohne');
    assert.equal(await page.locator('.tf-panel .tf-sw').count(), 16, '16 Farbfelder');
    assert.deepEqual(await page.locator('.tf-panel .tf-sw').evaluateAll(b => b.map(x => x.title)), colors.map(c => c.name), 'Namen als Tooltip, in der Reihenfolge der Tabelle');
    assert.deepEqual(await panelState(), { pressed: [], checked: false, mixed: false }, 'ohne Farbe: nichts markiert');
    const sw = await page.locator('.tf-panel .tf-sw-rot').evaluate(b => [getComputedStyle(b).backgroundColor, getComputedStyle(b).borderTopColor]);
    assert.deepEqual(sw, [rgb(byId.rot.light.fill), rgb(byId.rot.light.line)], 'Farbfeld gezeichnet wie ein gefärbter Knoten');
    await page.click('.tf-panel .tf-sw-rot');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    await deselect();
    await expect('Ohne', 'rot', 'light');
    assert.deepEqual(await chips('Ohne'), ['farbe:rot'], 'Tag in der Sprache der Oberfläche');
    await colorMenu('Ohne');
    assert.deepEqual((await panelState()).pressed, ['rot'], 'die aktuelle Farbe ist markiert');
    await page.click('.tf-panel .tf-sw-gruen');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    await deselect();
    await expect('Ohne', 'gruen', 'light');
    assert.deepEqual(await chips('Ohne'), ['farbe:grün'], 'die neue Farbe ersetzt die alte');
    part('Rechtsklick: «Farbe ▸» mit 16 Feldern wie Knoten, Namen als Tooltip, Wahl ersetzt die Farbe, aktuelle markiert, Tag in der Sprache der Oberfläche');

    // «Auch Unternotizen»: wirkt sofort, das Untermenü bleibt offen; wieder weg
    await colorMenu('Andere');
    assert.deepEqual(await panelState(), { pressed: ['gruen'], checked: false, mixed: false });
    await page.click('.tf-panel .tf-kinder');
    assert.equal(await page.locator('.context-sub').isVisible(), true, 'Untermenü bleibt offen');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await deselect();
    await expect('Kind', 'gruen', 'light');
    await colorMenu('Andere');
    assert.equal((await panelState()).checked, true, 'Häkchen zeigt den Stand');
    await page.click('.tf-panel .tf-kinder');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await deselect();
    await expect('Kind', null, 'light');
    await expect('Andere', 'gruen', 'light');
    part('Rechtsklick: «Auch Unternotizen» wirkt sofort und zeigt den Stand, Untermenü bleibt offen');

    // Mehrfachauswahl: alle ausgewählten; gemischter Stand der Weitergabe; «Keine Farbe» entfernt Farbe und Weitergabe
    await tag('Teil B', 'farbe:auch-kinder');
    await deselect();
    await node('Teil B').click({ modifiers: ['Control'] });
    await node('Mehrere').click({ modifiers: ['Control'] });
    await page.waitForFunction(() => document.querySelectorAll('g.mm-node.mm-multi').length === 2);
    await colorMenu('Mehrere');
    assert.deepEqual(await panelState(), { pressed: ['blau'], checked: false, mixed: true }, 'beide blau, Weitergabe gemischt');
    await page.click('.tf-panel .tf-sw-violett');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    await deselect();
    await expect('Mehrere', 'violett', 'light');
    await expect('Teil B', 'violett', 'light');
    assert.deepEqual(await chips('Mehrere'), ['farbe:violett'], 'beide Farb-Tags ersetzt');
    await deselect();
    await colorMenu('Teil B');
    await page.click('.tf-panel .tf-none');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    await deselect();
    await expect('Teil B', null, 'light');
    assert.deepEqual(await chips('Teil B'), [], '«Keine Farbe» entfernt Farbe und Weitergabe');
    await deselect();
    await page.click('.mm-root', { button: 'right' });
    assert.equal(await page.locator('#contextMenu button[data-plugin="tag-farben"]').count(), 0, 'nicht an der Wurzel');
    await page.keyboard.press('Escape');
    part('Rechtsklick: Mehrfachauswahl färbt alle ausgewählten, gemischte Weitergabe erkennbar, «Keine Farbe» entfernt beide Tags, nicht an der Wurzel');

    // Englische Oberfläche: Beschriftung und Tags auf Englisch
    const ctxEn = await browser.newContext({ viewport: { width: 1400, height: 900 }, locale: 'en-US' });
    await ctxEn.addInitScript(f => { try { if (!localStorage.getItem('nonotes.plugins')) { localStorage.setItem('nonotes.plugins', JSON.stringify([f])); localStorage.setItem('nonotes.lang', 'en'); } } catch (e) { /* egal */ } }, FILE);
    const en = await ctxEn.newPage();
    await en.goto('file://' + path.join(out, 'index.html'));
    await en.waitForSelector(READY, { timeout: 30000 });
    await en.click('#mindmap', { position: { x: 30, y: 700 } });
    await en.keyboard.press('Tab');
    await en.waitForSelector('#renameInput:not([hidden])');
    await en.keyboard.type('Plan');
    await en.keyboard.press('Enter');
    const plan = en.locator('g.mm-node:has(> text:text-is("Plan"))');
    await plan.waitFor();
    await plan.click({ button: 'right' });
    await en.hover('#contextMenu button[data-plugin="tag-farben"]');
    await en.waitForSelector('.tf-panel');
    assert.equal(await en.locator('#contextMenu button[data-plugin="tag-farben"] span').first().innerText(), 'Colour');
    assert.equal(await en.locator('.tf-panel .tf-none').innerText(), 'No colour');
    assert.match(await en.locator('.tf-panel .tf-check').innerText(), /Subnotes too/);
    assert.equal(await en.locator('.tf-panel .tf-sw-tuerkis').getAttribute('title'), 'Teal');
    await en.click('.tf-panel .tf-kinder');
    await en.click('.tf-panel .tf-sw-tuerkis');
    await plan.dblclick();
    await en.waitForFunction(() => document.body.classList.contains('editor-open'));
    await en.waitForFunction(() => document.querySelectorAll('#tagChips .chip').length === 2);
    assert.deepEqual(await en.evaluate(() => [...document.querySelectorAll('#tagChips .chip')].map(c => c.firstChild.textContent)), ['color:teal', 'color:with-children']);
    await ctxEn.close();
    part('Englische Oberfläche: «Colour ▸», «No colour», «Subnotes too», Tags color:teal und color:with-children');

    // Hilfe
    await page.click('#menuBtn');
    await page.click('#menuHelpBtn');
    await page.waitForSelector('#helpDialog[open]');
    await page.click('#helpTabs button[data-tab="plugins"]');
    const help = await page.locator('#helpDialog .help-panel[data-panel="plugins"]').innerText();
    for (const s of ['Farben über Tags', 'farbe:rot', 'farbe:auch-kinder', 'farbe:grau', 'color:with-children']) assert.ok(help.includes(s), 'Hilfe nennt ' + s);
    part('Hilfe: Abschnitt mit allen Tags');

    assert.deepEqual(errors, [], 'keine Fehler und Warnungen im Browser');
    await ctx.close();
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`\nTest «Farben über Tags» bestanden (${steps.length} Teile, ${Math.round((Date.now() - started) / 1000)} s).`);
}

main().catch(e => { console.error('\nTest «Farben über Tags» FEHLGESCHLAGEN'); console.error(e); process.exit(1); });
