// Checks how phrases are understood.
//   node tests/engine-test.cjs                 run every check below; exits 1 if any fails
//   node tests/engine-test.cjs "your phrase"   just print how that phrase is understood
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = html.slice(html.indexOf('/*ENGINE-START*/'), html.indexOf('/*ENGINE-END*/'));
const E = new Function(src + ';return Engine;')();
const ctx = { home: 19, origin: 19, dest: null }; // home = Jagannath Shankar Sheth
const name = i => (i ? E.S[i].short : '-');
const show = r => (!r.ok ? 'NO STATION' : `${name(r.origin)} -> ${name(r.dest)}`)
  + (r.ask ? `  (asks ${r.ask.role}: ${r.ask.ids.map(name).join(' / ')})` : '')
  + `  | tickets ${r.count ?? '-'}${r.over ? ' (asked for more than 6)' : ''} | ${r.ret === true ? 'return' : r.ret === false ? 'single' : '-'}`;

if (process.argv.length > 2) {
  for (const p of process.argv.slice(2)) console.log(JSON.stringify(p).padEnd(40), show(E.interpret(p, ctx)));
  process.exit(0);
}

// Each check: phrase, then only the parts that matter for it.
// o/d = station ids, n = tickets (null = not said), ret = true/false/null, ask = ids offered, ok = any station found.
const cases = [
  // plain destinations and directions
  ['BKC', { o: 19, d: 10, n: null, ret: null }],
  ['bkc la jaycha aahe', { o: 19, d: 10 }],
  ['airport T2 jaana hai', { d: 5 }],
  ['चर्चगेट वरून घरी', { o: 25, d: 19 }],
  ['Worli se Cuffe Parade', { o: 15, d: 27 }],
  ['to BKC from Worli', { o: 15, d: 10 }],
  ['मला दादरला जायचंय', { d: 13 }],
  ['from dadar to home', { o: 13, d: 19 }],
  ['Mahalakshmi tak', { d: 18 }],
  ['Grant road se CSMT', { o: 20, d: 23 }],
  ['कफ परेडला जायचे आहे', { d: 27 }],
  ['mumbai central to bkc', { o: 19, d: 10 }],
  ['T1 से घर', { o: 7, d: 19 }],
  ['colaba', { d: 27 }],
  ['marol naka', { d: 4 }],
  ['terminal 2', { d: 5, n: null }],
  // ambiguous names ask instead of guessing
  ['airport', { ask: [5, 7] }],
  ['बांद्रा', { ask: [9, 10] }],
  // ticket counts
  ['two tickets to CSMT', { o: 19, d: 23, n: 2 }],
  ['2 tickets to CST', { d: 23, n: 2 }],
  ['book three tickets for Worli', { d: 15, n: 3 }],
  ['one ticket to Siddhivinayak', { d: 14, n: 1 }],
  ['Bandra Kurla complex for two people', { d: 10, n: 2 }],
  ['airport terminal 2 two tickets', { d: 5, n: 2 }],
  ['do log worli se cuffe parade', { o: 15, d: 27, n: 2 }],
  ['hum teen log worli se cuffe parade', { o: 15, d: 27, n: 3 }],
  ['चर्चगेट वरून घरी 2 जण', { o: 25, d: 19, n: 2 }],
  ['दोन तिकीट दादर', { d: 13, n: 2 }],
  ['bkc for two', { d: 10, n: 2 }],
  ['tickets for 4 to siddhivinayak', { d: 14, n: 4 }],
  ['3 of us to dadar', { d: 13, n: 3 }],
  ['a couple of tickets to worli', { d: 15, n: 2 }],
  ['2 bkc', { d: 10, n: 2 }],
  ['dadar to bkc 2', { o: 13, d: 10, n: 2 }],
  ['8 tickets to dadar', { d: 13, n: 6, over: true }],
  ['metro line 3 ticket to bkc', { d: 10, n: null }],
  ['a b k c ticket', { d: 10 }],
  // numbers the dictation gets wrong
  ['to tickets to see SMT', { d: 23, n: 2 }],
  ['tu ticket to church gate', { d: 25, n: 2 }],
  // return and single
  ['two return tickets from BKC', { o: 10, d: 19, n: 2, ret: true }],
  ['mumbai central to bkc 2 tickets return', { o: 19, d: 10, n: 2, ret: true }],
  ['dadar return', { d: 13, ret: true }],
  ['return ticket to dadar', { d: 13, ret: true }],
  ['round trip to cuffe parade for 2', { d: 27, n: 2, ret: true }],
  ['दादर रिटर्न तिकीट', { d: 13, ret: true }],
  ['return from bkc', { o: 10, d: 19, ret: null }],
  ['i want to return home from worli', { o: 15, d: 19, ret: null }],
  ['one way to dadar', { d: 13, n: null, ret: false }],
  ['two one way tickets to dadar', { d: 13, n: 2, ret: false }],
  // misheard and split-up station names
  ['seeps', { d: 2 }],
  ['Santacruise', { d: 8 }],
  ['be kay see', { d: 10 }],
  ['b k c', { d: 10 }],
  ['mid c', { d: 3 }],
  ['cafe parade', { d: 27 }],
  ['gurgaon', { d: 21 }],
  ['varli', { d: 15 }],
  ['maha lux mi', { d: 18 }],
  ['sid hi vinayak', { d: 14 }],
  ['sheetal devi', { d: 12 }],
  ['vidan bavan', { d: 26 }],
  ['hutatma chauk', { d: 24 }],
  // nothing to go on, or only part of a trip
  ['hello', { ok: false, n: null, ret: null }],
  ['two tickets', { ok: false, n: 2 }],
  ['return', { ok: false, ret: true }],
  ['do you have tickets', { ok: false, n: null }],
];

let bad = 0;
for (const [p, want] of cases) {
  const r = E.interpret(p, ctx);
  const errs = [];
  if ('ok' in want && r.ok !== want.ok) errs.push(`ok=${r.ok}, wanted ${want.ok}`);
  if ('o' in want && r.origin !== want.o) errs.push(`from ${name(r.origin)}, wanted ${name(want.o)}`);
  if ('d' in want && r.dest !== want.d) errs.push(`to ${name(r.dest)}, wanted ${name(want.d)}`);
  if ('n' in want && r.count !== want.n) errs.push(`tickets ${r.count}, wanted ${want.n}`);
  if ('ret' in want && r.ret !== want.ret) errs.push(`return ${r.ret}, wanted ${want.ret}`);
  if ('over' in want && r.over !== want.over) errs.push(`over ${r.over}, wanted ${want.over}`);
  if ('ask' in want && JSON.stringify(r.ask && r.ask.ids) !== JSON.stringify(want.ask)) errs.push(`asks ${JSON.stringify(r.ask && r.ask.ids)}, wanted ${JSON.stringify(want.ask)}`);
  if (errs.length) bad++;
  console.log((errs.length ? 'FAIL ' : 'ok   ') + JSON.stringify(p).padEnd(42), show(r) + (errs.length ? '\n       ^ ' + errs.join('; ') : ''));
}
// ---- train times (the Extra block) ----
// Only the first and last train at the two ends of the line are published, so the checks on other stations use ranges.
const xsrc = html.slice(html.indexOf('/*EXTRA-START*/'), html.indexOf('/*EXTRA-END*/'));
const X = new Function(xsrc + ';return Extra;')();
const at = s => new Date(s + '+05:30'); // Mumbai time
const hm = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
const between = (v, lo, hi) => v >= lo && v <= hi;
const T = (o, d, when) => X.trains(o, d, at(when));
const timeCases = [
  ['Cuffe Parade to Aarey: exact first 5:55 and last 22:30', () => { const t = T(27, 1, '2026-11-12T12:00'); return t.exact && t.first === 355 && t.last === 1350 && t.towards === 1 && t.ride === 54; }],
  ['Aarey to Cuffe Parade: exact first 5:55 and last 22:30', () => { const t = T(1, 27, '2026-11-12T12:00'); return t.exact && t.first === 355 && t.last === 1350 && t.towards === 27; }],
  ['home to BKC: towards Aarey, ride about 20 min', () => { const t = T(19, 10, '2026-11-12T12:00'); return !t.exact && t.towards === 1 && t.from === 27 && between(t.ride, 18, 24); }],
  ['home to BKC: first train 6:05–6:20, last 22:38–22:55', () => { const t = T(19, 10, '2026-11-12T12:00'); return between(t.first, 365, 380) && between(t.last, 1358, 1375); }],
  ['home to CSMT: towards Cuffe Parade', () => { const t = T(19, 23, '2026-11-12T12:00'); return t.towards === 27 && t.from === 1; }],
  ['later stations get later trains', () => T(10, 1, '2026-11-12T12:00').last > T(19, 1, '2026-11-12T12:00').last],
  ['Thursday noon: running, every 4–7 min', () => { const t = T(19, 10, '2026-11-12T12:00'); return t.state === 'running' && t.gap.join() === '4,7'; }],
  ['Saturday: every 6–10 min', () => T(19, 10, '2026-11-14T12:00').gap.join() === '6,10'],
  ['Sunday: every 10 min', () => T(19, 10, '2026-11-15T12:00').gap.join() === '10,10'],
  ['4:00 AM: before the first train', () => T(19, 10, '2026-11-12T04:00').state === 'before'],
  ['12:30 AM: before the first train', () => T(19, 10, '2026-11-12T00:30').state === 'before'],
  ['10:20 PM at Cuffe Parade: last train in 10 min', () => { const t = T(27, 1, '2026-11-12T22:20'); return t.state === 'ending' && t.left === 10; }],
  ['10:45 PM at home: the last train may still be coming', () => T(19, 10, '2026-11-12T22:45').state === 'ending'],
  ['10:31 PM at Cuffe Parade: closed', () => T(27, 1, '2026-11-12T22:31').state === 'closed'],
  ['11:30 PM: closed', () => T(19, 10, '2026-11-12T23:30').state === 'closed'],
  ['Google Maps link uses transit and both stations', () => { const u = X.mapsUrl(19, 10); return u.startsWith('https://www.google.com/maps/dir/?api=1&origin=18.970603%2C72.821382&destination=19.060417%2C72.85492') && u.endsWith('&travelmode=transit'); }],
];
console.log('');
for (const [label, fn] of timeCases) {
  let pass = false, err = '';
  try { pass = !!fn(); } catch (e) { err = '  (error: ' + e.message + ')'; }
  if (!pass) bad++;
  console.log((pass ? 'ok   ' : 'FAIL ') + label + err);
}
{ const t = T(19, 10, '2026-11-12T12:00'); console.log(`     (home to BKC works out as: first ${hm(t.first)}, last ${hm(t.last)}, ride ${t.ride} min)`); }

const total = cases.length + timeCases.length;
console.log(`\n${total - bad} of ${total} checks passed`);
process.exit(bad ? 1 : 0);
