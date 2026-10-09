// Slate (#415A80) as the app-wide primary: replaces the Cerulean literals left by
// zm-rebrand-sweep.mjs. Usage: node tools/zm-slate-sweep.mjs
import fs from 'fs'; import path from 'path';
const MAP = { '007fa5': '415a80', '006a8a': '344866' };
const EXCLUDE = /(email-template|check-template|check-design|print|pdf|signature|micr)/i;
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
let hits = 0, files = 0;
for (const f of walk('src/app')) {
  if (!/\.(html|scss|ts)$/.test(f) || f.endsWith('.spec.ts') || EXCLUDE.test(f)) continue;
  const s = fs.readFileSync(f, 'utf8');
  const t = s.replace(/#(007fa5|006a8a)([0-9a-f]{2})?\b/gi, (m, h, a) => (hits++, `#${MAP[h.toLowerCase()]}${a || ''}`));
  if (t !== s) { files++; fs.writeFileSync(f, t); }
}
let tw = fs.readFileSync('tailwind.config.js', 'utf8');
tw = tw.replaceAll('rgba(0, 127, 165,', 'rgba(65, 90, 128,').replaceAll('rgba(0, 106, 138,', 'rgba(52, 72, 102,');
fs.writeFileSync('tailwind.config.js', tw);
console.log('replaced', hits, 'in', files, 'files');
