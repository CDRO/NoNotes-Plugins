/* Test der Erweiterung «Farben über Tags» (tag-colors/) in der echten App: baut NoNotes mit diesem Repository
   (tools/build.cjs --plugins) und prüft im Browser Farben, Farbe der Unternotizen, Auswahl, hell/dunkel, Ausschalten,
   Rechtsklick, Legende, Farben beim Kopieren als Bild (NoNotes ab 3.1.0) und den Lesemodus.
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
  require('node:vm').runInNewContext(src + "\n;globalThis.__f = FARBEN.map(f => Object.assign({}, f, { streifen: { light: tagFarbenStreifen(f.light, 'light'), dark: tagFarbenStreifen(f.dark, 'dark') } }));", box);
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
    for (const s of ['light', 'dark']) {
      const st = c.streifen[s];
      assert.match(st, /^#[0-9a-f]{6}$/);
      assert.ok(contrast(st, c[s].line) >= 4.5, `${c.id} ${s}: Titel auf dem hellen Streifen lesbar (4.5:1)`);
      assert.ok(lum(st) > lum(c[s].fill), `${c.id} ${s}: Streifen heller als die Fläche`);
      assert.ok(contrast(st, c[s].fill) >= 1.07, `${c.id} ${s}: Streifen sichtbar (${contrast(st, c[s].fill).toFixed(2)})`);
    }
  }
  part('Farbtabelle: 16 Farben, eindeutige Namen, Titel lesbar (5:1), Fläche hell und Umrandung dunkel (dunkel umgekehrt); Schraffur heller, sichtbar, Titel darauf 4.5:1');

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

    // Baum: Projekt (rot, Unternotizen gelb) → Teil A (Unternotizen blau) → Detail; Projekt → Teil B (blau, eigene Farbe);
    // Andere (grün, dazu das alte «farbe:auch-kinder», das nicht mehr gilt) → Kind; Mehrere (gelb und blau: das erste in der
    // Reihenfolge des Editors); Ohne; Tippfehler (unbekannte Farbe)
    await newNote('Projekt');
    await newNote('Teil A', 'Projekt');
    await newNote('Detail', 'Teil A');
    await newNote('Teil B', 'Projekt');
    await newNote('Andere');
    await newNote('Kind', 'Andere');
    await newNote('Mehrere');
    await newNote('Ohne');
    await newNote('Tippfehler');
    await tag('Projekt', 'Farbe:Rot', 'Farbe-Kinder:Gelb');
    await tag('Teil A', 'color-children:blue');
    await tag('Teil B', 'color:blue');
    await tag('Andere', 'farbe:grün', 'farbe:auch-kinder');
    await tag('Mehrere', 'farbe:gelb', 'farbe:blau');
    await tag('Tippfehler', 'farbe:rosa', 'farbe : ');
    const deselect = async () => { await page.focus('#mindmap'); await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('g.mm-node.mm-selected, g.mm-node.mm-multi')); };
    await deselect(); // zurück in der Mindmap ist die zuletzt offene Notiz ausgewählt
    for (const [title, id] of [['Projekt', 'rot'], ['Teil A', 'gelb'], ['Detail', 'blau'], ['Teil B', 'blau'], ['Andere', 'gruen'], ['Kind', null],
      ['Mehrere', 'blau'], ['Ohne', null], ['Tippfehler', null]]) await expect(title, id, 'light');
    const root = await page.evaluate(() => getComputedStyle(document.querySelector('g.mm-root > rect')).fill);
    assert.equal(root, rgb('#2563eb'), 'die Wurzel bleibt in der Hauptfarbe');
    part('Farben: farbe:/color: und farbe-kinder:/color-children: in beiden Sprachen, Gross-/Kleinschreibung, Umlaut, Unternotizen in eigener Farbe, die nächste Kinderfarbe darüber gilt, eigene Farbe gewinnt, «auch-kinder» gilt nicht mehr, mehrere Tags: das erste, Unbekanntes nicht, Wurzel unverändert');

    // Schraffur (seit 2.1.0): «+schraffiert» am Farb-Tag, auch englisch und für Unternotizen; ein unbekannter Zusatz lässt die Farbe stehen
    await newNote('Markiert');
    await newNote('Markiert Kind', 'Markiert');
    await newNote('Unbekannt');
    await tag('Markiert', 'Farbe:Rot+Schraffiert', 'farbe-kinder:blau+hatched');
    await tag('Unbekannt', 'farbe:gelb+gepunktet');
    await deselect();
    const hatch = (title, id, scheme) => page.waitForFunction(([t, want]) => {
      const g = [...document.querySelectorAll('g.mm-node')].find(x => x.querySelector(':scope > text').textContent === t);
      return g && getComputedStyle(g.querySelector(':scope > rect')).fill.includes(want);
    }, [title, `tfSchraffur-${id}-${scheme}`], { timeout: 5000 });
    await hatch('Markiert', 'rot', 'light');
    await hatch('Markiert Kind', 'blau', 'light');
    await expect('Unbekannt', 'gelb', 'light');
    assert.equal(await node('Markiert').evaluate(g => getComputedStyle(g.querySelector(':scope > text')).fill), rgb(byId.rot.light.line), 'Titel in der Linienfarbe');
    const defs = await page.evaluate(() => {
      const d = document.querySelector('#mindmap > #tagFarbenDefs');
      const p = d && d.querySelector('pattern#tfSchraffur-rot-light');
      return d && { n: d.querySelectorAll('pattern').length, units: p.getAttribute('patternUnits'), w: p.getAttribute('width'), stripe: p.lastElementChild.getAttribute('width'), fills: [...p.children].map(r => r.getAttribute('fill')) };
    });
    assert.deepEqual(defs, { n: 32, units: 'userSpaceOnUse', w: '8', stripe: '4', fills: [byId.rot.light.fill, byId.rot.streifen.light] }, 'Muster je Farbe hell und dunkel, 4 px breite Streifen in Einheiten der Karte (wachsen mit dem Zoom)');
    await node('Markiert').click();
    await page.waitForFunction(() => document.querySelector('g.mm-node.mm-selected'));
    await hatch('Markiert', 'rot', 'light');
    await page.keyboard.press('Escape');
    part('Schraffur: farbe:rot+schraffiert und farbe-kinder:blau+hatched, Muster mit dem Zoom, Titel in der Linienfarbe, auch ausgewählt; unbekannter Zusatz: nur die Farbe');

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
    await page.click('button[aria-label="Tag Farbe-Kinder:Gelb entfernen"]');
    await page.waitForFunction(() => ![...document.querySelectorAll('.chip')].some(c => c.firstChild.textContent.toLowerCase() === 'farbe-kinder:gelb'));
    await page.waitForFunction(SAVED);
    await page.click('#backBtn');
    await page.waitForSelector('body:not(.editor-open)');
    await deselect();
    assert.equal(await page.evaluate(() => document.querySelectorAll('#tagFarbenStyle').length), 1, 'ein Stylesheet');
    await expect('Projekt', 'rot', 'light');
    await expect('Teil A', null, 'light');
    await expect('Detail', 'blau', 'light');
    await expect('Teil B', 'blau', 'light');
    part('Tag entfernt: ohne Kinderfarbe verlieren die Unternotizen die geerbte Farbe, eine Kinderfarbe weiter unten bleibt');

    // Dunkler Modus
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect('Projekt', 'rot', 'dark');
    await expect('Teil B', 'blau', 'dark');
    await expect('Andere', 'gruen', 'dark');
    await expect('Detail', 'blau', 'dark');
    await hatch('Markiert', 'rot', 'dark');
    await page.emulateMedia({ colorScheme: 'light' });
    part('Dunkler Modus: Fläche dunkel, Umrandung und Titel hell');

    // Neuladen: gleich gefärbt
    await page.reload();
    await page.waitForSelector(READY, { timeout: 30000 });
    await expect('Mehrere', 'blau', 'light');
    await expect('Teil B', 'blau', 'light');
    await expect('Detail', 'blau', 'light');
    part('Neuladen: dieselben Farben');

    // Ausschalten zur Laufzeit: alles zurück
    await page.click('#menuBtn');
    await page.click('#pluginsBtn');
    await page.waitForSelector('#pluginsDialog[open]');
    await page.uncheck(`#pluginList input[data-file="${FILE}"]`);
    await page.waitForFunction(() => !document.getElementById('tagFarbenStyle'));
    assert.equal(await page.evaluate(() => document.querySelectorAll('g.mm-node[class*="tf-"]').length), 0, 'keine Klassen mehr');
    assert.equal(await page.evaluate(() => !!document.getElementById('tagFarbenDefs')), false, 'keine Muster mehr');
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
    await hatch('Markiert', 'rot', 'light');
    part('Aus- und wieder einschalten zur Laufzeit: Farben und Muster weg und wieder da');

    // Rechtsklick (NoNotes ab 2.8.0): «Farbe ▸» mit den Teilen «Notiz» und «Unternotizen», je 16 Felder und «Keine Farbe»
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
      await page.waitForSelector('.context-sub .tf-panel[data-stand="geladen"]'); // die Markierung kommt nachgeladen
    }
    const panelState = () => page.evaluate(() => Object.fromEntries(['notiz', 'kinder'].map(art =>
      [art, [...document.querySelectorAll(`.tf-panel .tf-${art} .tf-sw[aria-pressed="true"]`)].map(b => b.dataset.farbe)])));
    await node('Ohne').click({ button: 'right' });
    await page.waitForSelector('#contextMenu:not([hidden])');
    const item = page.locator('#contextMenu button[data-plugin="tag-farben"]');
    assert.equal(await item.locator('span').first().innerText(), 'Farbe');
    assert.equal(await item.locator('.key').innerText(), '▸');
    await page.keyboard.press('Escape');
    await colorMenu('Ohne');
    assert.deepEqual(await page.locator('.tf-panel .tf-titel').allInnerTexts(), ['Notiz', 'Unternotizen'], 'zwei Teile');
    for (const art of ['notiz', 'kinder']) {
      assert.deepEqual(await page.locator(`.tf-panel .tf-${art} .tf-sw`).evaluateAll(b => b.map(x => x.title)), colors.map(c => c.name), `${art}: 16 Felder, Namen als Tooltip, in der Reihenfolge der Tabelle`);
      assert.equal(await page.locator(`.tf-panel .tf-${art} .tf-none`).innerText(), 'Keine Farbe');
    }
    assert.deepEqual(await panelState(), { notiz: [], kinder: [] }, 'ohne Farbe: nichts markiert');
    const sw = await page.locator('.tf-panel .tf-notiz .tf-sw-rot').evaluate(b => [getComputedStyle(b).backgroundColor, getComputedStyle(b).borderTopColor]);
    assert.deepEqual(sw, [rgb(byId.rot.light.fill), rgb(byId.rot.light.line)], 'Farbfeld gezeichnet wie ein gefärbter Knoten');
    await page.click('.tf-panel .tf-notiz .tf-sw-rot');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    await deselect();
    await expect('Ohne', 'rot', 'light');
    assert.deepEqual(await chips('Ohne'), ['farbe:rot'], 'Tag in der Sprache der Oberfläche');
    await colorMenu('Ohne');
    assert.deepEqual(await panelState(), { notiz: ['rot'], kinder: [] }, 'die aktuelle Farbe ist markiert');
    await page.click('.tf-panel .tf-notiz .tf-sw-gruen');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    await deselect();
    await expect('Ohne', 'gruen', 'light');
    assert.deepEqual(await chips('Ohne'), ['farbe:grün'], 'die neue Farbe ersetzt die alte');
    part('Rechtsklick: «Farbe ▸» mit «Notiz» und «Unternotizen», je 16 Felder wie Knoten, Namen als Tooltip, Wahl ersetzt die Farbe, aktuelle markiert, Tag in der Sprache der Oberfläche');

    // «Schraffiert» je Teil: nur mit Farbe, wirkt sofort, das Menü bleibt offen; eine neue Farbe behält die Schraffur
    const hatchState = () => page.evaluate(() => Object.fromEntries(['notiz', 'kinder'].map(art => {
      const b = document.querySelector(`.tf-panel .tf-${art} .tf-schraffur`);
      return [art, { on: b.checked, mixed: b.indeterminate, off: b.disabled, label: b.parentElement.textContent }];
    })));
    await colorMenu('Ohne');
    assert.deepEqual(await hatchState(), { notiz: { on: false, mixed: false, off: false, label: 'Schraffiert' }, kinder: { on: false, mixed: false, off: true, label: 'Schraffiert' } }, 'ohne Kinderfarbe lässt sich dort nicht schraffieren');
    await page.click('.tf-panel .tf-notiz .tf-schraffur');
    assert.equal(await page.locator('.context-sub').isVisible(), true, 'Untermenü bleibt offen');
    assert.equal(await page.locator('.tf-panel .tf-notiz .tf-grid.tf-mit-schraffur').count(), 1, 'die Felder zeigen die Schraffur');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await deselect();
    await hatch('Ohne', 'gruen', 'light');
    assert.deepEqual(await chips('Ohne'), ['farbe:grün+schraffiert']);
    await colorMenu('Ohne');
    assert.equal((await hatchState()).notiz.on, true, 'Häkchen zeigt den Stand');
    await page.click('.tf-panel .tf-notiz .tf-sw-orange');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    await deselect();
    await hatch('Ohne', 'orange', 'light');
    assert.deepEqual(await chips('Ohne'), ['farbe:orange+schraffiert'], 'neue Farbe, Schraffur bleibt');
    await colorMenu('Ohne');
    await page.click('.tf-panel .tf-notiz .tf-schraffur');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await deselect();
    assert.deepEqual(await chips('Ohne'), ['farbe:orange'], 'Häkchen weg: Schraffur weg');
    await colorMenu('Ohne');
    await page.click('.tf-panel .tf-notiz .tf-sw-gruen');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    await deselect();
    await expect('Ohne', 'gruen', 'light');
    // gemischt: Markiert (schraffiert) und Ohne (nicht)
    await node('Markiert').click({ modifiers: ['Control'] });
    await node('Ohne').click({ modifiers: ['Control'] });
    await page.waitForFunction(() => document.querySelectorAll('g.mm-node.mm-multi').length === 2);
    await colorMenu('Ohne');
    assert.deepEqual((await hatchState()).notiz, { on: false, mixed: true, off: false, label: 'Schraffiert' }, 'gemischter Stand');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await deselect();
    part('Rechtsklick: «Schraffiert» je Teil, nur mit Farbe, sofort und bei offenem Menü, gemischter Stand; neue Farbe behält die Schraffur');

    // Teil «Unternotizen»: farbe-kinder: in einer anderen Farbe als die Notiz; «Keine Farbe» dort nimmt nur dieses Tag weg
    await colorMenu('Andere');
    assert.deepEqual(await panelState(), { notiz: ['gruen'], kinder: [] }, 'das alte «farbe:auch-kinder» zählt nicht');
    await page.click('.tf-panel .tf-kinder .tf-sw-pink');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    await deselect();
    await expect('Kind', 'pink', 'light');
    await expect('Andere', 'gruen', 'light');
    assert.deepEqual((await chips('Andere')).sort(), ['farbe-kinder:pink', 'farbe:auch-kinder', 'farbe:grün'], 'Kinderfarbe dazu, die Farbe der Notiz und andere Tags bleiben');
    await colorMenu('Andere');
    assert.deepEqual(await panelState(), { notiz: ['gruen'], kinder: ['pink'] }, 'beide Farben markiert');
    await page.click('.tf-panel .tf-kinder .tf-none');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    await deselect();
    await expect('Kind', null, 'light');
    await expect('Andere', 'gruen', 'light');
    assert.deepEqual((await chips('Andere')).sort(), ['farbe:auch-kinder', 'farbe:grün'], '«Keine Farbe» bei den Unternotizen');
    part('Rechtsklick: «Unternotizen» setzt eine eigene Farbe für alles darunter (farbe-kinder:), «Keine Farbe» dort nimmt nur dieses Tag weg');

    // Mehrfachauswahl: alle ausgewählten; markiert ist nur, was alle haben; «Keine Farbe» bei der Notiz lässt die Kinderfarbe
    await tag('Teil B', 'farbe-kinder:rot');
    await deselect();
    await node('Teil B').click({ modifiers: ['Control'] });
    await node('Mehrere').click({ modifiers: ['Control'] });
    await page.waitForFunction(() => document.querySelectorAll('g.mm-node.mm-multi').length === 2);
    await colorMenu('Mehrere');
    assert.deepEqual(await panelState(), { notiz: ['blau'], kinder: [] }, 'beide blau, Kinderfarbe nur bei einem');
    await page.click('.tf-panel .tf-notiz .tf-sw-violett');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    assert.equal(await page.locator('g.mm-node.mm-multi').count(), 0, 'nach der Farbwahl ist die Mehrfachauswahl aufgehoben');
    await deselect();
    await expect('Mehrere', 'violett', 'light');
    await expect('Teil B', 'violett', 'light');
    assert.deepEqual(await chips('Mehrere'), ['farbe:violett'], 'beide Farb-Tags ersetzt');
    assert.deepEqual((await chips('Teil B')).sort(), ['farbe-kinder:rot', 'farbe:violett'], 'die Kinderfarbe bleibt');
    await colorMenu('Teil B');
    assert.deepEqual(await panelState(), { notiz: ['violett'], kinder: ['rot'] });
    await page.click('.tf-panel .tf-notiz .tf-none');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    await deselect();
    await expect('Teil B', null, 'light');
    assert.deepEqual(await chips('Teil B'), ['farbe-kinder:rot'], '«Keine Farbe» bei der Notiz nimmt nur deren Tag weg');
    await deselect();
    await page.click('.mm-root', { button: 'right' });
    assert.equal(await page.locator('#contextMenu button[data-plugin="tag-farben"]').count(), 0, 'nicht an der Wurzel');
    await page.keyboard.press('Escape');
    part('Rechtsklick: Mehrfachauswahl färbt alle ausgewählten, markiert nur Gemeinsames, «Keine Farbe» je Teil, nicht an der Wurzel');

    // Wechsel des Bereichs (Alt+Zahl): dieselben Nummern sind andere Notizen; nichts überträgt sich, die Farben stimmen
    const answers = [];
    page.on('dialog', d => d.accept(d.type() === 'prompt' ? (answers.shift() || '') : undefined));
    const label = () => page.evaluate(() => document.querySelector('#storageInfo .label').textContent);
    const tfNodes = () => page.evaluate(() => [...document.querySelectorAll('g.mm-node')].filter(g => [...g.classList].some(c => c.startsWith('tf-'))).map(g => g.querySelector(':scope > text').textContent).sort());
    const before = await tfNodes();
    assert.ok(before.length >= 4, 'im ersten Bereich sind Knoten gefärbt: ' + before.join(', '));
    await node('Ohne').click({ modifiers: ['Control'] });
    await node('Andere').click({ modifiers: ['Control'] });
    await page.waitForFunction(() => document.querySelectorAll('g.mm-node.mm-multi').length === 2);
    answers.push('Privat');
    await page.click('#storageInfo');
    await page.waitForSelector('#contextMenu:not([hidden])');
    await page.click('#contextMenu button:has-text("Neuer Bereich…")');
    await page.waitForFunction(() => /Privat/.test(document.querySelector('#storageInfo .label').textContent));
    assert.equal(await page.locator('#multiBar').isVisible(), false, 'die Mehrfachauswahl bleibt im alten Bereich');
    for (const t of ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9']) await newNote(t);
    await page.waitForTimeout(300);
    assert.deepEqual(await tfNodes(), [], 'neuer Bereich: keine Farben aus dem alten (gleiche Nummern)');
    await page.keyboard.press('Alt+1');
    await page.waitForFunction(() => !/Privat/.test(document.querySelector('#storageInfo .label').textContent));
    await page.waitForFunction(n => [...document.querySelectorAll('g.mm-node')].filter(g => [...g.classList].some(c => c.startsWith('tf-'))).length === n, before.length);
    assert.deepEqual(await tfNodes(), before, 'zurück im ersten Bereich: dieselben Farben wie vorher');
    await expect('Mehrere', 'violett', 'light');
    assert.equal(await page.locator('g.mm-node.mm-multi').count(), 0, 'keine Mehrfachauswahl über den Wechsel');
    await page.keyboard.press('Alt+2');
    await page.waitForFunction(() => /Privat/.test(document.querySelector('#storageInfo .label').textContent));
    await page.waitForTimeout(300);
    assert.deepEqual(await tfNodes(), [], 'wieder im zweiten Bereich: keine Farben');
    await node('P2').click({ button: 'right' });
    await page.hover('#contextMenu button[data-plugin="tag-farben"]');
    await page.waitForSelector('.tf-panel[data-stand="geladen"]');
    assert.deepEqual(await panelState(), { notiz: [], kinder: [] }, 'das Untermenü liest den Bereich, der offen ist');
    await page.click('.tf-panel .tf-notiz .tf-sw-pink');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    await deselect();
    await expect('P2', 'pink', 'light');
    assert.deepEqual(await tfNodes(), ['P2']);
    await page.keyboard.press('Alt+1');
    await page.waitForFunction(() => !/Privat/.test(document.querySelector('#storageInfo .label').textContent));
    await page.waitForFunction(n => [...document.querySelectorAll('g.mm-node')].filter(g => [...g.classList].some(c => c.startsWith('tf-'))).length === n, before.length);
    assert.deepEqual(await tfNodes(), before, 'die Farbe aus dem zweiten Bereich bleibt dort');
    await page.keyboard.press('Alt+2');
    await page.waitForFunction(() => /Privat/.test(document.querySelector('#storageInfo .label').textContent));
    await page.waitForFunction(() => [...document.querySelectorAll('g.mm-node')].filter(g => [...g.classList].some(c => c.startsWith('tf-'))).length === 1);
    assert.deepEqual(await tfNodes(), ['P2'], 'und ist wieder da');
    await page.keyboard.press('Alt+1');
    await page.waitForFunction(() => !/Privat/.test(document.querySelector('#storageInfo .label').textContent));
    part('Wechsel des Bereichs (Alt+Zahl): Farben stimmen in beiden Bereichen, nichts überträgt sich, keine Mehrfachauswahl über den Wechsel');

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
    assert.deepEqual(await en.locator('.tf-panel .tf-titel').allInnerTexts(), ['Note', 'Subnotes']);
    assert.equal(await en.locator('.tf-panel .tf-notiz .tf-none').innerText(), 'No colour');
    assert.equal(await en.locator('.tf-panel .tf-kinder .tf-sw-tuerkis').getAttribute('title'), 'Teal');
    await en.click('.tf-panel .tf-notiz .tf-sw-tuerkis');
    await en.waitForSelector('g.mm-node.tf-tuerkis'); // geschrieben und neu gezeichnet
    await plan.click({ button: 'right' });
    await en.hover('#contextMenu button[data-plugin="tag-farben"]');
    await en.waitForSelector('.tf-panel[data-stand="geladen"]');
    await en.click('.tf-panel .tf-kinder .tf-sw-indigo');
    await en.waitForSelector('#contextMenu', { state: 'hidden' });
    await en.waitForSelector('g.mm-node.tf-tuerkis');
    await plan.click({ button: 'right' });
    await en.hover('#contextMenu button[data-plugin="tag-farben"]');
    await en.waitForSelector('.tf-panel[data-stand="geladen"]');
    assert.equal(await en.locator('.tf-panel .tf-notiz .tf-check').innerText(), 'Hatched');
    assert.equal(await en.locator('.tf-panel .tf-bild').innerText(), 'Colours when copying as image');
    await en.click('.tf-panel .tf-notiz .tf-schraffur');
    await en.keyboard.press('Escape');
    await en.keyboard.press('Escape');
    await en.waitForSelector('g.mm-node.tf-tuerkis.tf-schraffiert');
    await plan.dblclick();
    await en.waitForFunction(() => document.body.classList.contains('editor-open'));
    await en.waitForFunction(() => document.querySelectorAll('#tagChips .chip').length === 2);
    assert.deepEqual((await en.evaluate(() => [...document.querySelectorAll('#tagChips .chip')].map(c => c.firstChild.textContent))).sort(), ['color-children:indigo', 'color:teal+hatched']);
    await ctxEn.close();
    part('Englische Oberfläche: «Colour ▸» mit «Note» und «Subnotes», «No colour», «Colours when copying as image», Tags color:teal+hatched und color-children:indigo');

    // Legende (NoNotes ab 2.11.0): Knopf in der Leiste, Vorlage mit den benutzten Farben, bearbeiten, Farbfelder, Ecke, einklappen,
    // nach dem Neuladen noch da, im Druck unter dem Bild
    const lg = page.locator('.map-plugin-btn', { hasText: 'Legende' });
    assert.equal(await lg.count(), 1, 'Knopf «Legende» in der Leiste');
    assert.equal(await page.locator('.tf-legende').isVisible(), false, 'leer: noch verborgen');
    await lg.click();
    await page.waitForSelector('.tf-legende .tf-lg-text:not([hidden])');
    const vorlage = await page.inputValue('.tf-legende .tf-lg-text');
    assert.match(vorlage, /^- farbe:rot: …$/m, 'Vorlage nennt benutzte Farben');
    assert.match(vorlage, /\+schraffiert: …$/m, 'und die schraffierten');
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('tf-lg-text')), true, 'Fokus im Text');
    await page.fill('.tf-legende .tf-lg-text', 'Neu');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Control+b');
    assert.equal(await page.inputValue('.tf-legende .tf-lg-text'), '**Neu**', 'Ctrl+B macht fett');
    await page.fill('.tf-legende .tf-lg-text', '- farbe:rot: dringend\n- farbe:blau+schraffiert: wartet\n- `farbe:grün` im Code bleibt Text\n\nDas *gilt* für alle.');
    await page.click('#mindmap', { position: { x: 600, y: 700 } }); // Klick daneben speichert
    await page.waitForSelector('.tf-legende .tf-lg-text', { state: 'hidden' });
    assert.deepEqual(await page.locator('.tf-legende .tf-lg-name').allInnerTexts(), ['Rot', 'Blau (schraffiert)']);
    assert.equal(await page.locator('.tf-legende .tf-lg-sw.tf-sw-blau.tf-lg-schraffiert').count(), 1);
    assert.ok((await page.locator('.tf-legende code').innerText()).includes('farbe:grün'), 'im Code kein Farbfeld');
    const swBg = await page.locator('.tf-legende .tf-lg-sw.tf-sw-rot').evaluate(e => getComputedStyle(e).backgroundColor);
    assert.equal(swBg, rgb(byId.rot.light.fill), 'Farbfeld in der Farbe');
    await page.selectOption('.tf-legende .tf-lg-ecke', 'ul');
    assert.ok(await page.locator('.tf-legende.tf-ecke-ul').isVisible(), 'unten links');
    const box = await page.locator('.tf-legende').boundingBox();
    const bar = await page.locator('.map-toolbar').boundingBox();
    await page.selectOption('.tf-legende .tf-lg-ecke', 'or');
    const boxOr = await page.locator('.tf-legende').boundingBox();
    assert.ok(boxOr.y >= bar.y + bar.height, 'oben rechts unter der Leiste');
    assert.ok(box.y > boxOr.y, 'unten liegt tiefer');
    await page.click('.tf-legende .tf-lg-zu');
    assert.ok(await page.locator('.tf-legende.tf-lg-eingeklappt').isVisible(), 'eingeklappt');
    await page.waitForFunction(SAVED, null, { timeout: 10000 });
    await page.reload();
    await page.waitForSelector(READY, { timeout: 30000 });
    await page.waitForSelector('.tf-legende.tf-lg-eingeklappt', { state: 'visible' });
    await page.click('.tf-legende .tf-lg-titel');
    assert.deepEqual(await page.locator('.tf-legende .tf-lg-name').allInnerTexts(), ['Rot', 'Blau (schraffiert)'], 'nach dem Neuladen aus der Datenbank');
    await page.evaluate(() => { window.__printed = []; window.print = () => window.__printed.push(document.getElementById('printArea').innerHTML); });
    await page.keyboard.press('Control+p');
    await page.waitForSelector('#printDialog[open]');
    await page.click('#printGoBtn');
    await page.waitForFunction(() => window.__printed.length === 1);
    const druck = await page.evaluate(() => window.__printed[0]);
    assert.match(druck, /<section class="print-map-section"><h2>Legende<\/h2><div class="md"><ul><li><strong>Rot<\/strong>: dringend<\/li><li><strong>Blau \(schraffiert\)<\/strong>: wartet<\/li>/, 'im Druck unter dem Bild, mit Namen');
    await lg.click();
    assert.equal(await page.locator('.tf-legende').isVisible(), false, 'Knopf blendet aus');
    await lg.click();
    assert.equal(await page.locator('.tf-legende').isVisible(), true, 'und wieder ein');
    part('Legende: Knopf, Vorlage mit den benutzten Farben, Ctrl+B, Klick daneben speichert, Farbfelder (nicht im Code), Ecke unter der Leiste, einklappen, nach dem Neuladen da, im Druck unter dem Bild');

    // Als Bild kopieren (NoNotes ab 3.1.0, Erweiterung ab 2.4.0): Farben im kopierten Bild in der hellen Fassung, schraffierte mit
    // Muster; nur die Knoten im Bild; abschaltbar im Untermenü «Farbe ▸», je Browser gemerkt; Druck ohne Farben
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
    const spy = () => page.evaluate(() => { const o = NoNotesMindmap.toSvgString; NoNotesMindmap.toSvgString = (r, opt) => (window.__svg = o(r, opt)); });
    const copyImage = async how => {
      await page.evaluate(() => { window.__svg = null; document.querySelector('#status').textContent = ''; });
      await how();
      await page.waitForFunction(() => window.__svg && /in die Zwischenablage kopiert/.test(document.querySelector('#status').textContent));
      return page.evaluate(() => window.__svg);
    };
    const inImage = (svg, title) => {
      const m = new RegExp(`<rect [^>]*fill="([^"]+)" stroke="([^"]+)"[^>]*/>\\s*<text [^>]*fill="([^"]+)"[^>]*>${title}</text>`).exec(svg);
      return m && { fill: m[1], stroke: m[2], text: m[3] };
    };
    const live = () => page.evaluate(k => Object.fromEntries([...document.querySelectorAll('g.mm-node:not(.mm-root)')].map(g => {
      const farbe = [...g.classList].find(c => c.startsWith(k) && c !== k + 'schraffiert');
      return [g.querySelector(':scope > text').textContent, farbe ? { farbe: farbe.slice(k.length), schraffiert: g.classList.contains(k + 'schraffiert') } : null];
    })), 'tf-');
    await spy();
    await deselect();
    const soll = await live();
    let svg = await copyImage(() => page.click('#mapCopyBtn'));
    const blank = Object.keys(soll).find(t => !soll[t]);
    assert.ok(blank, 'ein Knoten ohne Farbe ist dabei');
    const plain = inImage(svg, blank);
    assert.ok(plain && !colors.some(c => c.light.fill === plain.fill), 'ohne Farbe: wie die App');
    assert.ok(Object.values(soll).some(v => v && v.schraffiert), 'ein schraffierter Knoten ist dabei');
    for (const [title, st] of Object.entries(soll)) {
      const got = inImage(svg, title);
      assert.ok(got, `${title} im Bild`);
      if (!st) { assert.deepEqual(got, plain, `${title}: ohne Farbe`); continue; }
      const c = byId[st.farbe].light;
      assert.deepEqual(got, { fill: st.schraffiert ? `url(#tfBild-${st.farbe})` : c.fill, stroke: c.line, text: c.line }, `${title}: ${st.farbe} hell${st.schraffiert ? ', schraffiert' : ''}`);
    }
    const imgDefs = await page.evaluate(svg => {
      const d = new DOMParser().parseFromString(svg, 'image/svg+xml');
      return [...d.querySelectorAll('defs > pattern')].map(p => ({ id: p.id, w: p.getAttribute('width'), stripe: p.lastElementChild.getAttribute('width'), fills: [...p.children].map(r => r.getAttribute('fill')) }));
    }, svg);
    const hatched = [...new Set(Object.values(soll).filter(v => v && v.schraffiert).map(v => v.farbe))].sort();
    assert.deepEqual(imgDefs.map(p => p.id).sort(), hatched.map(f => 'tfBild-' + f), 'ein Muster je schraffierter Farbe im Bild');
    const pRot = imgDefs.find(p => p.id === 'tfBild-rot');
    assert.deepEqual(pRot, { id: 'tfBild-rot', w: '8', stripe: '4', fills: [byId.rot.light.fill, byId.rot.streifen.light] }, 'Muster wie auf dem Schirm (hell, Zoom 100 %)');
    await node('Projekt').click();
    svg = await copyImage(async () => { await page.focus('#mindmap'); await page.keyboard.press('Control+c'); });
    assert.ok(inImage(svg, 'Projekt') && !inImage(svg, 'Andere'), 'ab einem Knoten: nur der Ast');
    assert.equal(inImage(svg, 'Projekt').fill, byId[soll.Projekt.farbe].light.fill, 'auch ab einem Knoten');
    assert.ok(!druck.includes('tfBild') && !druck.includes(byId.rot.light.fill), 'der Druck bleibt ohne Farben');
    // Abschalten im Untermenü: wirkt sofort, das Menü bleibt offen, die Mindmap behält ihre Farben
    await node(blank).click({ button: 'right' });
    await page.hover('#contextMenu button[data-plugin="tag-farben"]');
    await page.waitForSelector('.tf-panel[data-stand="geladen"]');
    assert.equal(await page.locator('.tf-panel .tf-bild').innerText(), 'Farben beim Kopieren als Bild');
    assert.equal(await page.isChecked('.tf-panel .tf-bild input'), true, 'Standard: an');
    await page.uncheck('.tf-panel .tf-bild input');
    assert.equal(await page.locator('.tf-panel').isVisible(), true, 'das Untermenü bleibt offen');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    await deselect();
    svg = await copyImage(() => page.click('#mapCopyBtn'));
    assert.ok(!svg.includes('tfBild') && !colors.some(c => svg.includes(`fill="${c.light.fill}"`)), 'ausgeschaltet: keine Farben im Bild');
    await expect('Projekt', soll.Projekt.farbe, 'light');
    assert.equal(await page.evaluate(() => localStorage.getItem('nonotes.tagFarben.bild')), '0', 'je Browser gemerkt');
    await page.reload();
    await page.waitForSelector(READY, { timeout: 30000 });
    await node(blank).click({ button: 'right' });
    await page.hover('#contextMenu button[data-plugin="tag-farben"]');
    await page.waitForSelector('.tf-panel[data-stand="geladen"]');
    assert.equal(await page.isChecked('.tf-panel .tf-bild input'), false, 'nach dem Neuladen noch aus');
    await page.check('.tf-panel .tf-bild input');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.waitForSelector('#contextMenu', { state: 'hidden' });
    await spy();
    await deselect();
    svg = await copyImage(() => page.click('#mapCopyBtn'));
    assert.equal(inImage(svg, 'Projekt').fill, byId[soll.Projekt.farbe].light.fill, 'wieder an: Farben im Bild');
    part('Als Bild kopieren: Farben in der hellen Fassung, Muster für schraffierte, ab einem Knoten nur der Ast, Druck ohne Farben; Schalter im Untermenü wirkt sofort, je Browser gemerkt');

    // Lesemodus (etwa als Leserin im Dienst): «Farbe ▸» nur mit dem Schalter für das Bild, das Kopieren behält die Farben
    const ctxRo = await browser.newContext({ viewport: { width: 1400, height: 900 }, locale: 'de-CH', colorScheme: 'light' });
    await ctxRo.grantPermissions(['clipboard-read', 'clipboard-write']);
    await ctxRo.addInitScript(f => { try { if (!localStorage.getItem('nonotes.plugins')) localStorage.setItem('nonotes.plugins', JSON.stringify([f])); } catch (e) { /* egal */ } }, FILE);
    await ctxRo.addInitScript(() => { // wie test/collab.cjs im Kern: die Hülle meldet den Lesemodus, sobald __readonly gesetzt ist
      let edition;
      Object.defineProperty(window, 'NoNotesEdition', { configurable: true, get: () => edition, set: v => {
        edition = v;
        const make = v.createShell;
        v.createShell = host => { const shell = make(host); if (localStorage.getItem('__readonly') === '1') Object.defineProperty(shell, 'readOnly', { get: () => true }); return shell; };
      } });
    });
    const ro = await ctxRo.newPage();
    ro.on('pageerror', e => errors.push('pageerror (Lesemodus): ' + e.message));
    await ro.goto('file://' + path.join(out, 'index.html'));
    await ro.waitForSelector(READY, { timeout: 30000 });
    const roNode = t => ro.locator(`g.mm-node:has(> text:text-is("${t}"))`);
    await ro.click('#mindmap', { position: { x: 30, y: 700 } });
    await ro.keyboard.press('Tab');
    await ro.waitForSelector('#renameInput:not([hidden])');
    await ro.keyboard.type('Gelesen');
    await ro.keyboard.press('Enter');
    await roNode('Gelesen').dblclick();
    await ro.waitForFunction(() => document.body.classList.contains('editor-open'));
    await ro.fill('#tagInput', 'farbe:grün');
    await ro.keyboard.press('Enter');
    await ro.waitForFunction(SAVED);
    await ro.click('#backBtn');
    await ro.evaluate(() => localStorage.setItem('__readonly', '1'));
    await ro.reload();
    await ro.waitForSelector(READY, { timeout: 30000 });
    await ro.waitForSelector('g.mm-node.tf-gruen');
    await roNode('Gelesen').click({ button: 'right' });
    await ro.hover('#contextMenu button[data-plugin="tag-farben"]');
    await ro.waitForSelector('.tf-panel[data-stand="geladen"]');
    assert.equal(await ro.locator('.tf-panel .tf-sw').count(), 0, 'keine Farbfelder');
    assert.equal(await ro.locator('.tf-panel .sep').count(), 0, 'kein Trennstrich');
    assert.equal(await ro.isChecked('.tf-panel .tf-bild input'), true);
    await ro.keyboard.press('Escape');
    await ro.keyboard.press('Escape');
    await ro.waitForSelector('#contextMenu', { state: 'hidden' });
    await ro.evaluate(() => { const o = NoNotesMindmap.toSvgString; NoNotesMindmap.toSvgString = (r, opt) => (window.__svg = o(r, opt)); });
    await roNode('Gelesen').click();
    await ro.focus('#mindmap');
    await ro.keyboard.press('Control+c');
    await ro.waitForFunction(() => window.__svg && /in die Zwischenablage kopiert/.test(document.querySelector('#status').textContent));
    assert.equal(inImage(await ro.evaluate(() => window.__svg), 'Gelesen').fill, byId.gruen.light.fill, 'Farbe im Bild');
    await ctxRo.close();
    part('Lesemodus: «Farbe ▸» nur mit dem Schalter für das Bild, ohne Farbfelder; Kopieren mit Farben');

    // Hilfe
    await page.click('#menuBtn');
    await page.click('#menuHelpBtn');
    await page.waitForSelector('#helpDialog[open]');
    await page.click('#helpTabs button[data-tab="plugins"]');
    const help = await page.locator('#helpDialog .help-panel[data-panel="plugins"]').innerText();
    for (const s of ['Farben über Tags', 'farbe:rot', 'farbe-kinder:blau', 'farbe:grau', 'color-children:blue', 'farbe:rot+schraffiert', 'color:red+hatched', 'Legende', 'Beim Kopieren als Bild']) assert.ok(help.includes(s), 'Hilfe nennt ' + s);
    assert.ok(!help.includes('auch-kinder'), 'die alte Schreibweise nicht mehr');
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
