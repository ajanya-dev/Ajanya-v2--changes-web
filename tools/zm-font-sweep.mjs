// ZilMoney rebrand: every UI font -> Inter (brand guide p.11). Signature/MICR fonts untouched.
// Usage: node tools/zm-font-sweep.mjs
import fs from 'fs'; import path from 'path';

const INTER = '"Inter", Arial, sans-serif';
const fv = 'src/assets/style_varients/_font-variables.scss';
let v = fs.readFileSync(fv, 'utf8');
v = v.replace(/^(\$(?:roboto|info-font|open_sans|muli|baloo|Roboto|light-font|inter|primary-font|secondary-font|semi-font)): [^;]+;/gm, `$1: ${INTER};`);
fs.writeFileSync(fv, v);

const EXCLUDE = /(_fonts\.scss|email-template|check-template|check-design|print|pdf|signature|micr)/i;
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
let n = 0, files = 0;
for (const f of [...walk('src/app'), ...walk('src/assets/style_varients')]) {
  if (!f.endsWith('.scss') || EXCLUDE.test(f)) continue;
  const s = fs.readFileSync(f, 'utf8');
  const t = s.replace(/font-family:\s*["']?(Open Sans|Roboto|Lato|Plus Jakarta Sans|Poppins|Funnel Display)["']?\s*(,[^;}\n]*)?(?=[;}\n])/g, () => (n++, `font-family: ${INTER}`));
  if (t !== s) { files++; fs.writeFileSync(f, t); }
}
console.log('font-family replaced', n, 'in', files, 'files');
