// ZilMoney rebrand sweep: hard-coded legacy brand colours -> brand tokens/hex,
// low-contrast grey text -> subtle token, sub-12px text -> 12px.
// Usage: node tools/zm-rebrand-sweep.mjs [--dry]
import fs from 'fs'; import path from 'path';
const DRY = process.argv.includes('--dry');
const ROOT = 'src/app';
// User-designed / printed content keeps its own colours.
const EXCLUDE = /(email-template|check-template|check-design|print|pdf|signature|micr)/i;

const HEX = { // old -> new (alpha suffix preserved)
  '20319d': '007fa5', '5385f4': '007fa5', '075ffe': '007fa5', '318ffd': '007fa5',
  '0d70e3': '007fa5', '0753d8': '006a8a', '0eaf89': '007fa5', '5d6ccc': '007fa5',
  '3bf493': '00a5b2', '57f7a4': '4fc3d9',
  '273655': '415a80', '394173': '415a80', '202343': '2f4566',
  'f9f4ff': 'f4f8fa',
};
const TOKEN = { '20319d': 'v4-primary-brand-color', '3bf493': 'v4-secondary-brand-color' };
const LOW_GREY = '(?:9ca3af|999|999999|aaa|aaaaaa|b0b0b0|c4c4c4|a0a0a0|bdbdbd)';
const PREFIX = '(bg|text|border|border-[trblxy]|ring|fill|stroke|from|via|to|outline|divide|decoration|accent|caret)';

const log = {}; const bump = (k, n = 1) => (log[k] = (log[k] || 0) + n);
function walk(d, out = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else if (/\.(html|scss|ts)$/.test(e.name) && !e.name.endsWith('.spec.ts')) out.push(p); } return out; }

let files = 0;
for (const f of walk(ROOT)) {
  if (EXCLUDE.test(f)) continue;
  const src = fs.readFileSync(f, 'utf8'); let s = src;
  const isMarkup = /\.(html|ts)$/.test(f);
  if (isMarkup) {
    // exact brand hex in Tailwind arbitrary classes -> token class
    for (const [h, tok] of Object.entries(TOKEN))
      s = s.replace(new RegExp(`\b${PREFIX}-\[#${h}\]`, 'gi'), (_, p) => (bump(`class #${h} -> ${tok}`), `${p}-${tok}`));
    // low-contrast grey text classes -> subtle token (#6b7280, 4.8:1)
    s = s.replace(new RegExp(`\btext-\[#${LOW_GREY}\]`, 'gi'), () => (bump('text grey -> v4-subtle'), 'text-v4-subtle-text-color'));
    // text floor 12px
    s = s.replace(/\btext-\[(9|9\.5|10|10\.5|11|11\.5)px\]/g, () => (bump('text-[<12px] -> 12px'), 'text-[12px]'));
  } else {
    s = s.replace(new RegExp(`(^|[\s;{])color:\s*#${LOW_GREY}\b`, 'gim'), (_, p) => (bump('scss grey color -> subtle var'), `${p}color: var(--v4-subtle-text-color)`));
    s = s.replace(/font-size:\s*(9|9\.5|10|10\.5|11|11\.5)px/g, () => (bump('scss font-size <12 -> 12px'), 'font-size: 12px'));
  }
  // remaining literal hex everywhere (keeps 2-digit alpha suffix)
  s = s.replace(/#([0-9a-f]{6})([0-9a-f]{2})?\b/gi, (m, h, a) => { const n = HEX[h.toLowerCase()]; if (!n) return m; bump(`hex #${h.toLowerCase()} -> #${n}`); return `#${n}${a || ''}`; });
  if (s !== src) { files++; if (!DRY) fs.writeFileSync(f, s); }
}
console.log(JSON.stringify(log, null, 1)); console.log((DRY ? '[dry] ' : '') + 'files changed:', files);
