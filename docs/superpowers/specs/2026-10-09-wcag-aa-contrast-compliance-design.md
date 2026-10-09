# WCAG 2.2 AA contrast & status compliance — design

Date: 2026-10-09 · Branch: `design/zilmoney-rebrand` (main copy, port 4200), synced to 4201 / 4202
Status: draft for review

## Goal

Make the v4 web app meet WCAG 2.2 AA for colour and status, app-wide, in every brand and in both themes:

- Normal text ≥ 4.5:1; large text (≥ 18.66px bold / 24px) ≥ 3:1.
- Non-text indicators a user needs (status icons, control boundaries, focus) ≥ 3:1 against what is next to them.
- No status, error or result conveyed by colour alone — always a word, icon + accessible name, or both.
- Fees, warnings, consent text and payment terms are never styled fainter than body copy.

Out of scope (cannot be verified in code — open item for PM / legal): bank, processor, co-branding and
partner agreements that may restrict colours or wording.

## Decisions already made (with the user, 2026-10-09)

1. **Approach A — fix at the token level first**, then sweep components. ~10 token value changes fix
   ~1,300 usages across every brand at once.
2. **Input borders are simply darkened** to pass 3:1 (no tinted-field alternative).
3. Hues stay the same; tokens only get darker (light) / lighter (dark) until they pass.

## Audit baseline (measured live on 4200, 2026-10-09)

Light 18/26 token pairs pass, dark 19/26. 4201 / 4202 share every non-brand token; all three brand
primaries pass (#004A7C, #20319D, #0F766E on white).

## Part 1 — token changes

### Light theme — `src/assets/style_varients/_v4-light-theme.scss`

| Token | Now | New | New ratio | Was | Usages |
|---|---|---|---|---|---|
| `$v4-common-green-color` | #08b160 | **#047857** | 5.48 on white | 2.81 | ~170 text, 42 bg/border |
| `$v4-common-yellow-color` | #fa9c10 | **#b45309** | 5.02 on white | 2.14 | ~63 text, 14 bg/border |
| `$v4-common-red-color` | #fb5f5f | **#dc2626** | 4.83 on white | 3.04 | ~528 text, 82 bg/border |
| `$v4-badge-error-text-color` | #eb2e2e | **#b91c1c** | 5.31 on #ffe2e2 | 3.47 | 118 |
| `$v4-badge-sky-text-color` | #0595e5 | **#0369a1** | 5.17 on #e0f2fe | 2.84 | 10 |
| `$v4-input-border-color` | #bfd2de | **#7c8fa3** | 3.33 on white, 3.08 on #f2f7fb | 1.56 | 413 |

Where these colours are used as **fills** with white text, the darker values improve contrast
(white on #047857 5.48, on #dc2626 4.83, on #b45309 5.02).

### Dark theme — `src/assets/style_varients/_v4-dark-theme.scss`

| Token | Now | New | New ratio on card #1c293c | Was |
|---|---|---|---|---|
| `$v4-common-green-color` | #099753 | **#34d399** | 7.63 | 3.89 |
| `$v4-common-red-color` | #eb2e2e | **#f87171** | 5.30 | 3.47 |
| `$v4-badge-error-text-color` | #eb2e2e | **#b91c1c** | 5.31 (badges stay light chips in dark) | 3.47 |
| `$v4-badge-sky-text-color` | #0595e5 | **#0369a1** | 5.17 (light chip) | 2.84 |

`$v4-primary-brand-color` (dark, #1d6aa5) is **not** changed: it is the fill behind white button text
(5.74, passes). Its failure is only when used *as text* (2.55). Fix in Part 2: text uses of the primary
in dark mode switch to the existing `--v4-primary-brand-bold-color` (#8ec5ec, 7.93).

### Palette preview — `src/assets/style_varients/_zm-palette-preview.scss`

`$zm-control-border` #bfd2de → **#7c8fa3** (same as the app token; the comment documenting the 1.56:1
"soft edge" decision is updated). Its success / warning / error values already pass.

### Theme copies

- 4201 (`angular-web-old-colors`) and 4202 (`angular-web-theme-teal`): pick up Part 1 via
  `node tools/sync-from-main.mjs`. Their restore scripts only swap the primary / page background, so
  the new status and border values carry over unchanged. Verify after sync that the swap scripts do
  not overwrite `$v4-input-border-color` (the teal copy defines its own field border #C3DDDB — it
  must also move to a ≥ 3:1 value: **#6a8f8c** — 3.55 on white, 3.31 on the teal page #F7F7F5).

## Part 2 — component sweep (after Part 1 lands)

1. **Dark-mode primary as text** — find `text-v4-primary-brand-color` used on dark surfaces (outline
   buttons in `CommonButtonV4Component`, links, tab underline labels) and use the bold token in dark.
   Fix in the shared component first; per-template only where needed.
2. **Colour-only status** — find and fix:
   - status dots / coloured circles with no text;
   - amounts coloured green / red with no sign or word (add +/−, "Credit"/"Debit", or "Failed");
   - icon-only status without `aria-label` / tooltip text (e.g. the verified tick already has both);
   - "Verify" / "Pending" links in the bank list that rely on orange alone (they have words — keep).
3. **Faint financial text** — fees, warnings, consent and payment terms using
   `text-v4-subtle-text-color`, `text-v4-tertiary-text-color` or < 12px: raise to secondary text or
   body size. List every hit; change only financial / consent copy, not decorative captions.
4. Hard-coded hex colours in v4 templates (29 found) — replace with tokens where they carry meaning.

Each finding is fixed in the shared component where one exists (badges, buttons, tables, alerts);
template-level fixes only when the colour is local.

## Part 3 — regression guard

`tools/contrast-check.mjs` (Node, no deps): reads the two v4 theme SCSS files plus the palette
preview, resolves each token pair in the audit table, prints ratio / required / pass, exits 1 on any
failure. Run manually and documented in the README colour section. (Hooking it into CI is a separate
decision for the team.)

## Verification

- Re-run the live audit script on 4200, 4201, 4202 in light and dark — target 26/26 (excluding the
  "plain border as control boundary" pair, which applies only where a border is a control's sole cue).
- Click through: bank accounts (list + Account card), send payment, dashboard, a form with inputs and
  an error state, a table with statuses — in light and dark, at 1536px and ≤785px.
- `npm run lint`, `npm test`.
- A white-label sanity check on one other brand build, since tokens ship to every brand.

## Risks

- Darker green / orange / red and darker field borders change the look app-wide (heavier inputs,
  deeper status colours). Accepted by the user for compliance.
- Some screens may hard-code the old hex values instead of tokens — Part 2 item 4 catches these.
- Brands with their own overrides of these tokens are not fixed by Part 1; the guard script lists them.
