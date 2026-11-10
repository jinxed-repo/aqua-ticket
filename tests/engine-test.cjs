// Prints how sample phrases are understood. Usage: node tests/engine-test.cjs ["your phrase" ...]
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = html.slice(html.indexOf('/*ENGINE-START*/'), html.indexOf('/*ENGINE-END*/'));
const E = new Function(src + ';return Engine;')();
const ctx = { home: 19, origin: 19, dest: null };
const name = i => (i ? E.S[i].short : '-');
const phrases = process.argv.length > 2 ? process.argv.slice(2) : [
  'BKC', 'bkc la jaycha aahe', 'airport T2 jaana hai', 'airport', 'चर्चगेट वरून घरी',
  'Worli se Cuffe Parade', 'to BKC from Worli', 'मला दादरला जायचंय', 'from dadar to home',
  'बांद्रा', 'terminal 2', 'Mahalakshmi tak', 'Grant road se CSMT', 'कफ परेडला जायचे आहे',
  'mumbai central to bkc', 'seeps', 'Santacruise', 'T1 से घर', 'colaba', 'marol naka', 'hello',
];
for (const p of phrases) {
  const r = E.interpret(p, ctx);
  const out = !r.ok ? 'NO MATCH'
    : `${name(r.origin)} -> ${name(r.dest)}` + (r.ask ? `  (asks ${r.ask.role}: ${r.ask.ids.map(name).join(' / ')})` : '');
  console.log(JSON.stringify(p).padEnd(32), out);
}
