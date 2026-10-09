# ZilMoney rebrand + UX baseline — design spec

Date: 2026-10-02 · Branch: `design/zilmoney-rebrand` · Status: local design exploration (not for merge as-is)

## Goal

Re-skin the whole web app to the ZILMONEY brand (guide v1.0 draft + `ZM-Orginal 8.svg`) and fix the
baseline UX problems found in the audit: low-contrast text, undersized inputs, text below 12px,
placeholder-only fields. All builds share the same tokens; this branch recolors every white-label
build, which is acceptable because it is a local exploration.

## Brand inputs

| Role (guide p.10) | Color | Use in product |
|---|---|---|
| Cerulean — action | `#007FA5` | Primary button fills, active nav pill, checkboxes, toggles |
| Cerulean-700 (derived) | `#006A8A` | Brand-colored **text**, links, icons, outline buttons (6.1:1 on white, 5.5:1 on `#EAF4F7`) |
| Cerulean-800 (derived) | `#005873` | Pressed state |
| Slate — structure | `#415A80` | Headings accent, navy badges, chart primary series, dark brand areas |
| Teal — accent | `#00A5B2` | Decorative only: icon details, dots, chart series, highlight bars. Never text (2.99:1) |
| Light background | `#EAF4F7` | Brand tint surfaces (selected rows, info boxes) |
| Neon green `#3BF493`, violet, `#20319D` navy | removed as brand colors | → Teal / Cerulean |

Font: **Inter** for everything (guide p.11). All font tokens (`--roboto`, `--font-funnel`, `--font-peridot`)
resolve to Inter; signature font unchanged. The guide's 56px/18px scale is a marketing scale; the
product keeps a product scale (14px body).

Shape: radius **8px** (`--ui-radius: 0.5rem`), thin light-gray borders, line icons.

## Contrast-verified text tokens (light)

| Token | Old | New | On white |
|---|---|---|---|
| main text | `#111827` | `#111827` | 17.7 |
| secondary text (labels) | `#4B5563` | `#374151` | 10.3 |
| tertiary text | `#6B7280` | `#4B5563` | 7.6 |
| subtle text | `#9CA3AF` (2.5 ✗) | `#6B7280` | 4.8 |
| placeholder | `#9CA3AF` (2.5 ✗) | `#6B7280` | 4.8 |
| input border | `#D0D0D0` (1.5 ✗) | `#8A93A2` | 3.1 (WCAG 1.4.11) |
| input background | `#F3F4F6` | `#FFFFFF` | — (placeholder on grey fell to 4.4) |
| page background | `#F9F4FF` lavender | `#F4F8FA` (brand-tinted, lighter than `#EAF4F7` so subtle text stays ≥4.5) | — |

Dark mode: surfaces unchanged (`#162034` / `#1C293C`); primary fill stays Cerulean `#007FA5`;
brand text/bold `#7DD3E0` (8.6:1 on card); focus/border `#4FC3D9` (7.1:1); subtle `#A8B4C8` (7.0:1).

## Sizing standard (decided from competitor measurement, see below)

| Tier | Where | Height | Text | Button |
|---|---|---|---|---|
| Form | login, modals, drawers, settings, forms | 44px | 14px desktop / 16px mobile | 44px |
| Dense | filters, toolbars, pagination, search | 40px | 14px | 40px |
| In-table | inputs inside grid cells only | 32px | 13px | 32px |

Labels always visible: 14px / 500 / `#374151`. Focus: 2px Cerulean ring. Text floor: 12px
(all `text-[9px]`–`text-[11px]` → `text-[12px]`).

### Competitor evidence (measured live 2026-10-02, login pages, 1440px)

| Product | Input h | Input text | Label | Radius | Button h |
|---|---|---|---|---|---|
| OCW (current) | 38 | 15 Roboto | none | 4 | 45 (green) |
| Bill.com | 36 | 16 | 16 | 8 | 36 |
| Melio | 48 | 16 | 12/600 | 8 | 48 |
| Mercury | 40 | 15 | 13 | 8 | 40 |
| Brex | 40 | 14 | 16/600 | 8 | 40 |
| QuickBooks | 36 | 16 | 14 | 4 | 36 |
| Stripe | 44 | 16 | 14 | 6 | 44 |
| Relay | 44 | 14 | 14/700 | 0 | 40 |
| Checkbook.io | 39 | 16 | 14/500 | 8 | 37 |

Design-system references: IBM Carbon 40 (32/48), Atlassian 40, Material 56 (40 dense), WCAG/Apple 44 touch.

## Implementation plan (approach A)

1. **Tokens** — `_v4-light-theme.scss`, `_v4-dark-theme.scss`, `_light-theme-v35.scss`
   (legacy blue `#318FFD` → Cerulean, sidebar navy → Slate, text greys → new scale),
   `_angular-custom-material-theme-v35.scss` (`#0D70E3` → Cerulean), `_font-variables-v4.scss`
   (fonts → Inter, radius 8px), `styles.scss` body font, `tailwind.config.js` shadow rgba.
2. **Components** — `common-input-field-v4` (44/40/32 tiers, label 14/500), ng-select heights in
   `_overrides-v4.scss`, `common-button-v4` neon variant → Teal with dark ink, ag-grid v4 font floor.
3. **Sweeps** (scripted, logged) — hard-coded brand hexes (`#20319D`, `#3BF493`, `#5385F4`, `#075FFE`,
   `#318FFD`, `#0D70E3`, `#0EAF89` login green) → tokens in `.html`/`.scss`, brand hex in `.ts`;
   `text-[9|10|11px]` → `text-[12px]`; low-contrast greys (`#9CA3AF`, `#999`, `#B0B0B0`, `#C4C4C4` text).
4. **Verify** — `ng build` compiles, headless screenshots of public pages + theme showcase,
   contrast re-check; audit findings list for pages behind login.

Out of scope: per-brand theme layer, logo swap in other white-label builds, marketing type scale,
redesigning page layouts (later, page by page).
