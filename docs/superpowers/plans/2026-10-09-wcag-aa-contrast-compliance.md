# WCAG 2.2 AA Contrast & Status Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every v4 colour token pair and every status indicator in the OCW web app meet WCAG 2.2 AA, in light and dark, in all three local copies.

**Architecture:** A dependency-free Node checker (`tools/contrast-check.mjs`) parses the theme SCSS files and asserts every text/indicator pair; it is the test for the token tasks (red → fix tokens → green). Token values change in the SCSS theme files only, so ~1,300 template usages update at once. A one-rule CSS override fixes dark-mode primary-as-text. A targeted template sweep then fixes colour-only status dots and faint financial copy.

**Tech Stack:** Angular 17, Tailwind (tokens via CSS variables), SCSS theme files, Node 24 (no Python on this machine).

**Spec:** `docs/superpowers/specs/2026-10-09-wcag-aa-contrast-compliance-design.md`

## Global Constraints

- Normal text ≥ 4.5:1; large text (≥ 18.66px bold or ≥ 24px) ≥ 3:1.
- Needed non-text indicators (status icons, control boundaries, focus) ≥ 3:1 against adjacent colour.
- Status never by colour alone — a word, or an icon with an accessible name.
- Fees, warnings, consent text and payment terms are never fainter than `text-v4-secondary-text-color` or smaller than 12px.
- Hues stay the same; tokens only darken (light) / lighten (dark).
- Every change lands in all three locals (4200 main, 4201 indigo, 4202 teal) via `node tools/sync-from-main.mjs` in each worktree; they differ only in colour.
- v4 tokens only in templates; Lucide icons; no inline SVG; no `console` statements.
- The working tree already holds uncommitted bank-details work (4 files under `src/app/modules/bank/bank-v4/`). Never stage those files in this plan's commits — always `git add` explicit paths.

## Review Focus

1. **Brand primary as a fill under white text in dark mode** — `#1d6aa5` must not change (white on it is 5.74). Task 3's override must not recolour button text on primary fills. Pinned by the checker pair `#ffffff on dark primary ≥ 4.5` in Task 1.
2. **Badges in dark mode stay light chips** — error/sky badge text is checked against the light chip bg, not the dark card. Pinned by Task 1 pairs using `badge-*-bg-color`.
3. **Status colours used as fills with white text** — darkening green/red/orange must keep white text ≥ 4.5 (light: Task 1 `white on fill` pairs). In dark, the lightened green/red would drop white text to ~2:1 on the 15 `bg-…green/red + text-white` elements — pinned by the Task 3 override and its spot-check step.
4. **Teal copy's own field border** — its restore map turns `bfd2de` into `c3dddb`; after the main copy moves to `7c8fa3` the map must translate the new value, or 4202 ends with the indigo-neutral grey. Pinned by running the checker inside the teal worktree in Task 5.
5. **Field border on the page background, not only on white** — `#f2f7fb` (main), `#f9f4ff` (indigo), `#f7f7f5` (teal) pages. Pinned by Task 1 pairs on `main-background-color` and Task 5 runs.

---

### Task 1: Contrast checker (the failing test)

**Files:**
- Create: `tools/contrast-check.mjs`

**Interfaces:**
- Produces: CLI `node tools/contrast-check.mjs [repoRoot]` → prints one line per pair, exits `0` if all pass, `1` otherwise. Reads `src/assets/style_varients/_v4-light-theme.scss`, `_v4-dark-theme.scss`, `_zm-palette-preview.scss`, `_light-theme-v35.scss` relative to `repoRoot` (default `process.cwd()`).

- [ ] **Step 1: Write the checker**

```js
// tools/contrast-check.mjs
// WCAG 2.2 AA guard for the v4 colour tokens. Exits 1 if any pair fails.
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
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function ratio(a, b) {
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
];
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
    if (!fg || !bg) { console.log(`  ?   ${label.padEnd(8)} ${use}: missing ${!fg ? f : b}`); fails++; continue; }
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
const v35 = tokens('_light-theme-v35.scss');

let fails = 0;
fails += check('light', light, [...PAIRS, ...LIGHT_FILLS]);
fails += check('dark', dark, PAIRS);
fails += check('palette', { ...light, 'v4-input-border-color': zm['zm-control-border'], 'v4-main-background-color': zm['zm-page'] },
  [['v4-input-border-color', 'v4-input-background-color', 3, 'palette field border'],
   ['v4-input-border-color', 'v4-main-background-color', 3, 'palette field border on page']]);
fails += check('v3.5', { 'input-border-color': v35['input-border-color'] },
  [['input-border-color', WHITE, 3, 'v3.5 field border']]);

console.log(fails ? `\n${fails} pair(s) below WCAG 2.2 AA` : '\nAll pairs pass WCAG 2.2 AA');
process.exit(fails ? 1 : 0);
```

- [ ] **Step 2: Run it — it must fail on today's tokens**

Run: `node tools/contrast-check.mjs`
Expected: exit code 1. FAIL lines include at least: light green 2.81, light red 3.04, light orange 2.14, light error badge 3.47, light/dark sky badge 2.84, light field border 1.56, dark green 3.89, dark red 3.47, dark error badge 3.47, palette field border 1.56, v3.5 field border 1.56. `white text on primary fill` must show `ok` in both themes (light 9.25, dark 5.74). If a token reports `missing`, fix the regex/name — do not proceed until the only FAILs are the expected ones.

- [ ] **Step 3: Commit**

```bash
git add tools/contrast-check.mjs
git commit -m "chore(a11y): add WCAG AA contrast checker for v4 tokens"
```

---

### Task 2: Light theme and v3.5 tokens

**Files:**
- Modify: `src/assets/style_varients/_v4-light-theme.scss` (lines 14, 17, 18, 38, 49, 59)
- Modify: `src/assets/style_varients/_light-theme-v35.scss:6`
- Modify: `src/assets/style_varients/_zm-palette-preview.scss:11`

**Interfaces:**
- Consumes: `tools/contrast-check.mjs` (Task 1).

- [ ] **Step 1: Change the values**

In `_v4-light-theme.scss`:
```scss
  $v4-common-green-color: #047857 !global; // WCAG AA: 5.48:1 on white (was #08b160, 2.81)
  $v4-common-red-color: #dc2626 !global; // WCAG AA: 4.83:1 on white (was #fb5f5f, 3.04)
  $v4-common-yellow-color: #b45309 !global; // WCAG AA: 5.02:1 on white (was #fa9c10, 2.14)
  $v4-input-border-color: #7c8fa3 !global; // WCAG 1.4.11: 3.33:1 on white, 3.08 on page (was #bfd2de, 1.56)
  $v4-badge-error-text-color: #b91c1c !global; // WCAG AA: 5.31:1 on #ffe2e2 (was #eb2e2e, 3.47)
  $v4-badge-sky-text-color: #0369a1 !global; // WCAG AA: 5.17:1 on #e0f2fe (was #0595e5, 2.84)
```
In `_light-theme-v35.scss` line 6:
```scss
  $input-border-color: #7c8fa3 !global; // matches v4 input border; WCAG 1.4.11 3.33:1 on white
```
In `_zm-palette-preview.scss` line 11:
```scss
$zm-control-border: #7c8fa3; // WCAG 1.4.11: 3.33:1 on white, 3.08 on page
```

- [ ] **Step 2: Run the checker**

Run: `node tools/contrast-check.mjs`
Expected: every `light`, `palette` and `v3.5` line is `ok`; remaining FAILs are only `dark` lines (fixed in Task 3). Exit 1 is expected here.

- [ ] **Step 3: Rebuild and eyeball**

The 4200 dev server rebuilds automatically (`npm run serve -- --port 4200` if not running). Open `http://localhost:4200/v4/manage/bank-accounts` (dismiss staging "500" dialogs with OK). Check: list row "ACH"/"Verified" text is deeper green; "Pending" is dark amber; search field outline is clearly visible. Expected: no layout change, colours only.

- [ ] **Step 4: Commit**

```bash
git add src/assets/style_varients/_v4-light-theme.scss src/assets/style_varients/_light-theme-v35.scss src/assets/style_varients/_zm-palette-preview.scss
git commit -m "fix(a11y): light theme status, badge and field-border tokens meet WCAG AA"
```

---

### Task 3: Dark theme tokens and dark primary-as-text

**Files:**
- Modify: `src/assets/style_varients/_v4-dark-theme.scss` (lines 14, 17, 49, 59)
- Modify: `src/assets/style_varients/_v4-theme.scss` (append one rule at the end of the file)

**Interfaces:**
- Consumes: `tools/contrast-check.mjs`.

- [ ] **Step 1: Change the dark values**

```scss
  $v4-common-green-color: #34d399 !global; // WCAG AA: 7.63:1 on #1c293c (was #099753, 3.89)
  $v4-common-red-color: #f87171 !global; // WCAG AA: 5.30:1 on #1c293c (was #eb2e2e, 3.47)
  $v4-badge-error-text-color: #b91c1c !global; // badges stay light chips in dark: 5.31:1 on #ffe2e2
  $v4-badge-sky-text-color: #0369a1 !global; // light chip: 5.17:1 on #e0f2fe
```
Do **not** change `$v4-primary-brand-color` (#1d6aa5): white button text on it is 5.74:1.

- [ ] **Step 2: Add the dark primary-as-text rule**

Append to the end of `_v4-theme.scss`:
```scss
// WCAG AA: the dark primary (#1d6aa5) is a fill colour; as text on dark cards it is only 2.55:1.
// Text set in the primary uses the bold token in dark mode instead (#8ec5ec, 7.93:1).
.dark-mode .text-v4-primary-brand-color {
  color: var(--v4-primary-brand-bold-color);
}
// Dark green/red are lightened for use as text; where they are a fill under white text
// (15 places), keep the AA-safe light-theme shades so white stays ≥ 4.5:1.
.dark-mode .bg-v4-common-green-color.text-white {
  background-color: #047857; // white 5.48:1
}
.dark-mode .bg-v4-common-red-color.text-white {
  background-color: #dc2626; // white 4.83:1
}
```

Find the 15 fill usages to spot-check after the rebuild:
```bash
grep -rnE 'bg-v4-common-(green|red)-color[^"]*text-white|text-white[^"]*bg-v4-common-(green|red)-color' --include=*.html src/app
```
Open two of them in dark mode (e.g. the header and the subscription-completed page) and confirm the fill is the deep green/red with white text.

- [ ] **Step 3: Run the checker**

Run: `node tools/contrast-check.mjs`
Expected: exit 0, last line `All pairs pass WCAG 2.2 AA`.

- [ ] **Step 4: Verify the override in the browser**

On 4200 toggle dark mode (moon icon in the header). On Bank Accounts: tab labels / links that were dim blue are now light blue; the navy "Send" button and "Clone design" button still have white text on the same fill. Run in DevTools console:
```js
getComputedStyle(document.querySelector('.dark-mode .text-v4-primary-brand-color')).color
```
Expected: `rgb(142, 197, 236)`.

- [ ] **Step 5: Commit**

```bash
git add src/assets/style_varients/_v4-dark-theme.scss src/assets/style_varients/_v4-theme.scss
git commit -m "fix(a11y): dark theme status tokens and primary-as-text meet WCAG AA"
```

---

### Task 4: Colour-only status dots

**Files (all `src/app/`):**
- Modify: `layout/v4-layout/header-v4/header-v4.component.html`
- Modify: `modules/bank/bank-v4/v4-components/bank-list-v4/bank-list-v4.component.html`
- Modify: `modules/bank-data-v4/pages/tabs/overview-tab/cash-flow-forecast/cash-flow-forecast.component.html`
- Modify: `modules/payments-v4/send-receive-page/components/payment-details-section/payment-details-section.component.html`
- Modify: `modules/user-management-v4/v4-components/user-list-v4/user-list-v4.component.html`
- Modify: `modules/user-support/modals/v4/book-a-demo-modal-v4/book-a-demo-modal-v4.component.html`
- Modify: `modules/user-support/modals/v4/international-payment-welcome-modal-v4/international-payment-welcome-modal-v4.component.html`
- Modify: `modules/user-v4/components/v4-security/v4-security.component.html`
- Modify: `modules/user-v4/components/v4-subscription-dash-board/v4-subscription-dash-board.component.html`
- Modify: `modules/user-v4/modals/v4-subscription-addons-flow-modal/v4-subscription-addons-flow-modal.component.html`
- Modify: `modules/user-v4/pages/v4-subscription-completed/v4-subscription-completed.component.html`

- [ ] **Step 1: List every dot (the failing check)**

Run from the repo root:
```bash
grep -rnE 'class="[^"]*\b(w-1\.5|w-2|w-2\.5|size-2)\b[^"]*rounded-full[^"]*bg-v4-(common|badge)-' --include=*.html src/app
```
Expected: matches in the 11 files above. Save the output; each line is one item to resolve.

- [ ] **Step 2: Apply the rule to each match**

Read 6 lines around each match and classify:

(a) **Dot sits next to a visible word that states the same status** (e.g. `● Active`) — it is decorative. Add `aria-hidden="true"` to the dot:
```html
<span class="w-2 h-2 rounded-full bg-v4-common-green-color" aria-hidden="true"></span>
<span>Active</span>
```
(b) **Dot is the only status cue** (no word next to it) — add a visible word if there is room; otherwise give the dot an accessible name and tooltip:
```html
<span class="w-2 h-2 rounded-full bg-v4-common-green-color" role="img" aria-label="Online" matTooltip="Online"></span>
```
(If the component does not already import `MatTooltip`, add it to the component's standalone `imports` array: `import { MatTooltip } from '@angular/material/tooltip';`.)
(c) **Dot is purely decorative** (a bullet in a feature list, a step marker beside its own text) — add `aria-hidden="true"` only.

Use the status word already present in the component's data (e.g. the same field that picks the colour) — never invent a new status label.

- [ ] **Step 3: Verify**

Re-run the Step 1 command and pipe to a check that every match now carries `aria-hidden="true"` or `aria-label=`:
```bash
grep -rnE 'class="[^"]*\b(w-1\.5|w-2|w-2\.5|size-2)\b[^"]*rounded-full[^"]*bg-v4-(common|badge)-' --include=*.html src/app | grep -vE 'aria-hidden="true"|aria-label='
```
Expected: no output. If a dot's attributes are on the following line (multi-line tag), open the file and confirm by eye; the grep is single-line. Then load Bank Accounts and the header on 4200: nothing changes visually except any newly added status words.

- [ ] **Step 4: Commit**

```bash
git add <the 11 files above>
git commit -m "fix(a11y): status dots carry a word or accessible name, not colour alone"
```
Note: `bank-list-v4.component.html` is not among the pre-existing uncommitted bank files, so it is safe to stage.

---

### Task 5: Faint financial copy and hard-coded colours

**Files:** determined by the two listings in Step 1 (v4 templates under `src/app`).

- [ ] **Step 1: List candidates**

```bash
# Financial / consent copy styled faintly (≈19 hits)
grep -rniE 'text-v4-(subtle|tertiary)-text-color[^"]*"[^<]*>[^<]*(fee|charge|terms|consent|agree|authori[sz]e|non-refundable|warning)' --include=*.html src/app
# Same words at <12px
grep -rniE 'text-\[(9|10|11)px\][^"]*"[^<]*>[^<]*(fee|charge|terms|consent|agree|authori[sz]e|non-refundable|warning)' --include=*.html src/app
# Hard-coded hex colours in v4 templates (≈29 hits)
grep -rnoE '(text|bg|border)-\[#[0-9a-fA-F]{3,8}\]' --include=*.html $(find src/app -type d -name '*v4*')
```

- [ ] **Step 2: Fix financial / consent hits**

For each hit whose text is a fee, charge, payment term, consent, authorisation or warning:
- replace `text-v4-subtle-text-color` / `text-v4-tertiary-text-color` with `text-v4-secondary-text-color`;
- raise `text-[9px]`/`text-[10px]`/`text-[11px]` to `text-[12px]`.
Leave decorative captions (timestamps, "Powered by", counters) unchanged — the rule is about financial meaning, not every small label.

- [ ] **Step 3: Fix hard-coded colours that carry meaning**

For each hex hit: if it is a status/error/success/warning colour, replace with the token (`text-v4-common-red-color`, `text-v4-common-green-color`, `text-v4-badge-warning-text-color`, etc.); if it is a brand illustration or chart series, leave it and note it in the commit message. To measure a kept text colour, add a temporary line to `PAIRS` in `tools/contrast-check.mjs`, e.g. `['#6b7280', '#ffffff', 4.5, 'temp check'],`, run `node tools/contrast-check.mjs`, read the ratio, then delete the line.

- [ ] **Step 4: Verify**

Re-run the three Step 1 commands. Expected: no remaining financial/consent hits; remaining hex hits are only illustration/chart colours. Click through on 4200 in light and dark: Send Payment (fee lines), subscription / add-ons modal (pricing and terms), Bank Accounts (callouts).

- [ ] **Step 5: Commit**

```bash
git add <the changed templates>
git commit -m "fix(a11y): fees, terms and consent copy at readable contrast; tokens over hard-coded colours"
```

---

### Task 6: Sync the 4201 and 4202 copies

**Files:**
- Modify: `C:\Users\Ajanya\Downloads\angular-web-theme-teal\tools\zm-teal-restore.mjs:10`
- Synced (by script): every file changed in Tasks 1–5, into both worktrees.

- [ ] **Step 1: Teach the teal swap the new border value**

In `angular-web-theme-teal/tools/zm-teal-restore.mjs` line 10, add the new border mapping (keep the old one for safety):
```js
const MAP = { '004a7c': '0f766e', '003a62': '115e59', 'e6eff6': 'e0f2f1', 'bfd2de': 'c3dddb', '7c8fa3': '6a8f8c' };
```
(`#6a8f8c`: 3.55:1 on white, 3.31:1 on the teal page `#f7f7f5`.)

- [ ] **Step 2: Sync both worktrees**

```bash
cd /c/Users/Ajanya/Downloads/angular-web-old-colors && node tools/sync-from-main.mjs
cd /c/Users/Ajanya/Downloads/angular-web-theme-teal && node tools/sync-from-main.mjs
```
Expected: each prints `copied N files` and `replaced … in … files`.

- [ ] **Step 3: Run the checker in each copy**

```bash
node /c/Users/Ajanya/Downloads/angular-web.onlinecheckwriter.com/tools/contrast-check.mjs /c/Users/Ajanya/Downloads/angular-web-old-colors
node /c/Users/Ajanya/Downloads/angular-web.onlinecheckwriter.com/tools/contrast-check.mjs /c/Users/Ajanya/Downloads/angular-web-theme-teal
```
Expected: both exit 0. In the teal run the field border lines show `#6a8f8c`. If the indigo copy's page (`#f9f4ff`) makes `field border on page` fail, darken that copy's border via its restore map the same way and re-run.

- [ ] **Step 4: Confirm both dev servers rebuilt cleanly**

Ports 4201 and 4202 (`npm run serve -- --port 4201` / `4202` in each worktree if not running). Expected: `Application bundle generation complete.` and no `ERROR` lines.

---

### Task 7: Final verification

- [ ] **Step 1: Live audit on all three ports, light and dark**

Paste the audit snippet from the spec session (reads computed `--v4-*` variables and computes ratios) into the console on `http://localhost:4200/v4/manage/bank-accounts`, then toggle dark and repeat; same on 4201 and 4202 (log in on each origin first). Expected: every text and indicator pair passes; the only allowed fail is "plain border as control boundary" (`--v4-border-color`), which is decorative card edging, not a control.

- [ ] **Step 2: Click-through**

Light and dark, at 1536px and ≤785px: Bank Accounts (list, Account card, a "Confirm micro deposit" account), Send Payment, Dashboard, one form with a validation error, one table with statuses. Expected: all status text readable, every field outline visible, no white-on-light text on primary buttons.

- [ ] **Step 3: Quality gates**

```bash
npm run lint
npm test -- --watch=false --browsers=ChromeHeadless
```
Expected: lint clean for the touched files; tests green (record any pre-existing failures separately — do not fix unrelated ones).

- [ ] **Step 4: White-label sanity**

`npm run build-zilmoney` (or one other brand script from `package.json`) completes. Tokens ship to every brand; any brand file that overrides these tokens is listed by grepping `src/environments` and brand SCSS for the old hex values (`08b160|fb5f5f|fa9c10|bfd2de|eb2e2e|0595e5`) — report hits rather than changing brand files without the user.

- [ ] **Step 5: Report** — list ratios before/after, files changed per task, anything left (brand overrides, partner-agreement check for PM/legal).
