// WCAG 2.2 AA guard for the V2 (v4) colour tokens. The classic v3.5 theme is out of scope. Exits 1 if any pair fails.
// Usage: node tools/contrast-check.mjs [repoRoot]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? process.cwd();
const dir = join(root, 'src/assets/style_varients');

/** Parse `$name: #hex` (v4 themes) or `$zm-name: #hex` (palette) into a map. */
function tokens(file) {
  const map = {};
  const src = readFileSync(join(dir, file), 'utf8');
  for (const m of src.matchAll(/\$([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{6})\b/g)) map[m[1]] = m[2].toLowerCase();
  return map;
}

function lum(hex) {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function ratio(a, b) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const WHITE = '#ffffff';
// [fg, bg, required, use] — fg/bg are token names (without $) or literal hex.
const PAIRS = [
  ['v4-main-text-color', 'v4-secondary-background-color', 4.5, 'body text on card'],
  ['v4-secondary-text-color', 'v4-secondary-background-color', 4.5, 'secondary text on card'],
  ['v4-tertiary-text-color', 'v4-secondary-background-color', 4.5, 'labels on card'],
  ['v4-subtle-text-color', 'v4-secondary-background-color', 4.5, 'helper text on card'],
  ['v4-placeholder-text-color', 'v4-input-background-color', 4.5, 'placeholder'],
  ['v4-secondary-text-color', 'v4-main-background-color', 4.5, 'subtitle on page'],
  ['v4-tertiary-text-color', 'v4-tertiary-background-color', 4.5, 'labels on grey strip'],
  ['v4-primary-brand-bold-color', 'v4-secondary-background-color', 4.5, 'brand text (bold token)'],
  [WHITE, 'v4-primary-brand-color', 4.5, 'white text on primary fill'],
  ['v4-common-green-color', 'v4-secondary-background-color', 4.5, 'green status text'],
  ['v4-common-red-color', 'v4-secondary-background-color', 4.5, 'red error text'],
  ['v4-common-yellow-color', 'v4-secondary-background-color', 4.5, 'orange status text'],
  ['v4-badge-success-text-color', 'v4-badge-success-bg-color', 4.5, 'success badge'],
  ['v4-badge-warning-text-color', 'v4-badge-warning-bg-color', 4.5, 'warning badge'],
  ['v4-badge-error-text-color', 'v4-badge-error-bg-color', 4.5, 'error badge'],
  ['v4-badge-info-text-color', 'v4-badge-info-bg-color', 4.5, 'info badge'],
  ['v4-badge-neutral-text-color', 'v4-badge-neutral-bg-color', 4.5, 'neutral badge'],
  ['v4-badge-accent-text-color', 'v4-badge-accent-bg-color', 4.5, 'accent badge'],
  ['v4-badge-sky-text-color', 'v4-badge-sky-bg-color', 4.5, 'sky badge'],
  ['v4-text-success', 'v4-secondary-background-color', 4.5, 'success text'],
  ['v4-text-warning', 'v4-secondary-background-color', 4.5, 'warning text'],
  ['v4-input-border-color', 'v4-input-background-color', 3, 'field border on field'],
  ['v4-input-border-color', 'v4-main-background-color', 3, 'field border on page'],
  ['v4-favorite-star-color', 'v4-secondary-background-color', 3, 'favorite star (state indicator)'],
];
// Insight cards: label + number are text on the card tint, the icon is a 3:1 graphic.
for (const c of ['red', 'orange', 'blue', 'purple', 'green']) {
  const bg = `v4-insight-card-background-${c}`;
  PAIRS.push(
    [`v4-insight-card-label-text-${c}`, bg, 4.5, `insight card ${c} label`],
    [`v4-insight-card-main-number-${c}`, bg, 4.5, `insight card ${c} number`],
    [`v4-insight-card-icon-${c}`, bg, 3, `insight card ${c} icon`]
  );
}
// Light theme only: status colours are also used as fills under white text.
const LIGHT_FILLS = [
  [WHITE, 'v4-common-green-color', 4.5, 'white on green fill'],
  [WHITE, 'v4-common-red-color', 4.5, 'white on red fill'],
  [WHITE, 'v4-common-yellow-color', 4.5, 'white on orange fill'],
];

function check(label, map, pairs) {
  let fails = 0;
  for (const [f, b, need, use] of pairs) {
    const fg = f.startsWith('#') ? f : map[f];
    const bg = b.startsWith('#') ? b : map[b];
    if (!fg || !bg) {
      console.log(`  ?    ${label.padEnd(8)} ${use}: missing ${!fg ? f : b}`);
      fails++;
      continue;
    }
    const r = ratio(fg, bg);
    const ok = r >= need;
    if (!ok) fails++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(8)} ${r.toFixed(2).padStart(5)} ≥ ${need}  ${use}  (${fg} on ${bg})`);
  }
  return fails;
}

const light = tokens('_v4-light-theme.scss');
const dark = tokens('_v4-dark-theme.scss');
const zm = tokens('_zm-palette-preview.scss');

let fails = 0;
fails += check('light', light, [...PAIRS, ...LIGHT_FILLS]);
fails += check('dark', dark, PAIRS);
fails += check(
  'palette',
  { ...light, 'v4-input-border-color': zm['zm-control-border'], 'v4-main-background-color': zm['zm-page'] },
  [
    ['v4-input-border-color', 'v4-input-background-color', 3, 'palette field border'],
    ['v4-input-border-color', 'v4-main-background-color', 3, 'palette field border on page'],
  ]
);

console.log(fails ? `\n${fails} pair(s) below WCAG 2.2 AA` : '\nAll pairs pass WCAG 2.2 AA');
process.exit(fails ? 1 : 0);
