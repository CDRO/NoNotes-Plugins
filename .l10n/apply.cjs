#!/usr/bin/env node
/* Übersetzungen der Erweiterungen einsetzen (seit Herbst 2026).

   node .l10n/apply.cjs                       alle Erweiterungen dieses Repositorys
   node .l10n/apply.cjs <datei.js> <ordner>   eine Datei mit den Übersetzungen aus <ordner> (z. B. die Beispiele des Kerns)
   node .l10n/apply.cjs --source <datei.js>   die deutschen und englischen Texte einer Datei als JSON (Vorlage zum Übersetzen)
   node .l10n/apply.cjs --check <datei.js> <ordner> [sprache]   nur prüfen, nichts schreiben

   Jede Erweiterung hat eine Tabelle XX_TEXTE mit de und en im Quelltext; die weiteren Sprachen liegen als JSON in
   .l10n/<ordner>/<sprache>.json (Sprache klein: de-de, fr, it, es, es-mx, pt, pt-br) und kommen zwischen die Marken
   /* <uebersetzungen> *\/ und /* </uebersetzungen> *\/. Jede Datei hat dieselben Schlüssel wie en. Danach den Test laufen lassen. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const CODES = ['de-de', 'fr', 'it', 'es', 'es-mx', 'pt', 'pt-br'];
const START = '/* <uebersetzungen> */', END = '/* </uebersetzungen> */';

/** Die Tabelle XX_TEXTE einer Datei (ohne Browser ausgewertet). */
function table(file) {
  const src = fs.readFileSync(file, 'utf8');
  const name = (/const ([A-Z]+_TEXTE) = \{/.exec(src) || [])[1];
  if (!name) throw new Error(`${file}: keine Tabelle XX_TEXTE`);
  const box = { NoNotesPlugins: { register() {}, API: 1 }, console, document: {} };
  box.window = box;
  vm.runInNewContext(src + `\n;globalThis.__t = ${name};`, box, { filename: file });
  return JSON.parse(JSON.stringify(box.__t));
}

const lit = v => (typeof v === 'string' && v.includes('\n')
  ? '`' + v.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`'
  : JSON.stringify(v));

/** Gleiche Schlüssel (tief) wie die Vorlage, nur Texte. */
function sameShape(a, b, where, errors) {
  for (const k of Object.keys(a)) {
    if (!(k in b)) { errors.push(`${where}.${k} fehlt`); continue; }
    if (a[k] && typeof a[k] === 'object') sameShape(a[k], b[k] || {}, `${where}.${k}`, errors);
    else if (typeof b[k] !== 'string' || !b[k].trim()) errors.push(`${where}.${k}: leer`);
    else {
      const ph = s => [...s.matchAll(/\{[A-Za-z_]+\}/g)].map(m => m[0]).sort().join(',');
      if (ph(a[k]) !== ph(b[k])) errors.push(`${where}.${k}: Platzhalter ${ph(b[k])} statt ${ph(a[k])}`);
      const code = s => (s.match(/`/g) || []).length;
      if (code(a[k]) % 2 === 0 && code(b[k]) % 2 !== 0) errors.push(`${where}.${k}: ungerade Zahl von Backticks`);
    }
  }
  for (const k of Object.keys(b)) if (!(k in a)) errors.push(`${where}.${k}: unbekannt`);
}

function apply(file, dir, { check = false, only = null } = {}) {
  const t = table(file);
  const errors = [];
  const entries = [];
  for (const code of only ? [only] : CODES) {
    const f = path.join(dir, code + '.json');
    if (!fs.existsSync(f)) { if (only) errors.push(`${f} fehlt`); continue; }
    let data;
    try { data = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { errors.push(`${f}: kein gültiges JSON (${e.message})`); continue; }
    sameShape(t.en, data, `${path.basename(dir)}/${code}`, errors);
    const body = Object.entries(data).map(([k, v]) => `    ${k}: ${lit(v)},`).join('\n');
    entries.push(`  '${code}': {\n${body}\n  },`);
  }
  if (errors.length) { for (const e of errors) console.error('Fehler: ' + e); process.exitCode = 1; return; }
  if (check) { console.log(`${path.basename(dir)}: ${entries.length} Sprachen in Ordnung`); return; }
  let src = fs.readFileSync(file, 'utf8');
  const a = src.indexOf(START), b = src.indexOf(END);
  if (a < 0 || b < a) throw new Error(`${file}: Marken ${START} … ${END} fehlen`);
  src = src.slice(0, a + START.length) + (entries.length ? '\n' + entries.join('\n') + '\n  ' : '\n  ') + src.slice(b);
  fs.writeFileSync(file, src);
  table(file); // lässt sich noch auswerten
  console.log(`${path.relative(ROOT, file) || file}: ${entries.length} Sprachen eingesetzt`);
}

const args = process.argv.slice(2);
if (args[0] === '--source') {
  const t = table(path.resolve(args[1]));
  console.log(JSON.stringify({ de: t.de, en: t.en }, null, 2));
} else if (args[0] === '--check') {
  apply(path.resolve(args[1]), path.resolve(args[2]), { check: true, only: args[3] || null });
} else if (args.length === 2) {
  apply(path.resolve(args[0]), path.resolve(args[1]));
} else {
  for (const d of fs.readdirSync(__dirname, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const file = path.join(ROOT, d.name, d.name + '.js');
    if (fs.existsSync(file)) apply(file, path.join(__dirname, d.name));
  }
}
