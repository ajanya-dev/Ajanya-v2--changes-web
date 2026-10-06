// #004A7C as the app-wide primary: replaces the Slate primary literals left by
// zm-slate-sweep.mjs. Original ZilMoney Slate (pricing headers, v3 connect page) is kept.
// Usage: node tools/zm-primary-sweep.mjs
import fs from 'fs';
import path from 'path';

const MAP = { '415a80': '004a7c', '344866': '003a62' };
const EXCLUDE =
  /(email-template|check-template|check-design|print|pdf|signature|micr|pricing-page-header|connect-payment-source-ocw-v3)/i;
const walk = (d) =>
  fs
    .readdirSync(d, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

let hits = 0;
let files = 0;
for (const f of walk('src/app')) {
  if (!/\.(html|scss|ts)$/.test(f) || f.endsWith('.spec.ts') || EXCLUDE.test(f)) continue;
  const s = fs.readFileSync(f, 'utf8');
  const t = s.replace(/#(415a80|344866)([0-9a-f]{2})?\b/gi, (m, h, a) => {
    hits++;
    return `#${MAP[h.toLowerCase()]}${a || ''}`;
  });
  if (t !== s) {
    files++;
    fs.writeFileSync(f, t);
  }
}

let tw = fs.readFileSync('tailwind.config.js', 'utf8');
tw = tw
  .replaceAll('rgba(65, 90, 128,', 'rgba(0, 74, 124,')
  .replaceAll('rgba(52, 72, 102,', 'rgba(0, 58, 98,');
fs.writeFileSync('tailwind.config.js', tw);
console.log('replaced', hits, 'in', files, 'files');
