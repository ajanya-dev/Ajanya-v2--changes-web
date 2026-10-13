# Zil Money / OCW v4 UI Reference

Colour theme, button styling, component states, and the changes made in the October 2026 rebrand pass.

- App: `angular-web.onlinecheckwriter.com`, Angular 17, Tailwind 3, SCSS
- Design branch: `design/zilmoney-rebrand` (main copy, port 4200). Colour-comparison worktrees: `design/zilmoney-rebrand-old-colors` (indigo, 4201) and `design/zilmoney-rebrand-teal` (teal, 4202). They differ from the main copy only in colour.
- Source of truth for every value below: `src/assets/style_varients/_v4-light-theme.scss`, `_v4-dark-theme.scss`, `_v4-theme.scss`, `_overrides-v4.scss`, `tailwind.config.js`, and the shared components under `src/app/shared/V4/`.
- Prepared 13 October 2026.

---

## 1. Colour theme

### 1.1 How colours work

- Every colour is a SCSS variable in the light and dark theme files, emitted as a CSS custom property (`--v4-*`) by `_v4-theme.scss`, and exposed to Tailwind as `bg-v4-*`, `text-v4-*`, `border-v4-*` classes.
- Components never hard-code hex values. They use the Tailwind class or `var(--v4-*)`.
- Dark mode is a token swap on the same DOM. No `dark:` Tailwind variants are needed.
- Accessibility target: WCAG 2.2 AA app-wide. Text is at least 4.5:1, non-text UI boundaries (field borders, icons) at least 3:1. `tools/contrast-check.mjs` verifies the pairs listed in that script. Status is never conveyed by colour alone (a tick icon or label accompanies every colour).

### 1.2 Brand colours

| Token | Tailwind class suffix | Light | Dark | Use |
|---|---|---|---|---|
| `--v4-primary-brand-color` | `v4-primary-brand-color` | `#004a7c` | `#1d6aa5` | Primary buttons, selected states, brand banners, icon tiles |
| `--v4-primary-brand-bold-color` | `v4-primary-brand-bold-color` | `#004a7c` | `#8ec5ec` | Brand text and icons on surfaces (readable in dark mode) |
| `--v4-secondary-brand-color` | `v4-secondary-brand-color` | `#00a5b2` | `#00a5b2` | Teal accent: banner CTA buttons, secondary icon tiles |
| `--v4-cta-banner-bg-color` | `v4-cta-banner-bg-color` | `#004a7c` | `#0c3d63` | Large promotional cards and banners; deep navy in dark mode |
| `--v4-cta-banner-circle-color` | `v4-cta-banner-circle-color` | `#ffffff1a` | `#ffffff0f` | Decorative circles on banners |
| `--v4-brand-border-color` | `v4-brand-border-color` | `#004a7c` | `#6fb1e3` | Focused field border, highlighted banner border |
| `--v4-brand-focus-color` | `v4-brand-focus-color` | `#004a7c` | `#6fb1e3` | Keyboard focus ring |
| `--v4-accent-violet-color` | `v4-accent-violet-color` | `#415a80` | `#9fb3d1` | Slate accent (no longer used for feature icon tiles) |

### 1.3 Semantic colours

| Token | Light | Dark | Use |
|---|---|---|---|
| `--v4-common-green-color` | `#047857` | `#34d399` | Success icon/text |
| `--v4-common-red-color` | `#dc2626` | `#f87171` | Error text, destructive buttons, required asterisk |
| `--v4-common-yellow-color` | `#b45309` | `#f2a735` | Warning icon/text |
| `--v4-common-blue-color` | `#004a7c` | `#1d6aa5` | Info icon/text |
| `--v4-common-sky-color` | `#00a5b2` | `#00a5b2` | Sky/teal icon tiles |
| `--v4-common-violet-color` | `#9672df` | `#9672df` | Accent icon/text |
| `--v4-favorite-star-color` | `#b98900` | `#ffc83d` | Favourite star |

### 1.4 Text colours

| Token | Light | Dark | Use |
|---|---|---|---|
| `--v4-main-text-color` | `#111827` | `#f8fafc` | Headings, values, primary body |
| `--v4-secondary-text-color` | `#374151` | `#c9cfe0` | Body copy, field labels |
| `--v4-tertiary-text-color` | `#4b5563` | `#94a3b8` | Captions, hints, section labels |
| `--v4-subtle-text-color` | `#6b7280` | `#a8b4c8` | Subtitles, muted meta |
| `--v4-placeholder-text-color` | `#6b7280` | `#a8b4c8` | Input placeholders |

### 1.5 Background and border colours

| Token | Light | Dark | Use |
|---|---|---|---|
| `--v4-main-background-color` | `#f2f7fb` | `#162034` | Page background |
| `--v4-secondary-background-color` | `#ffffff` | `#1c293c` | Cards, list rows, inputs |
| `--v4-tertiary-background-color` | `#fbfbfb` | `#1c293c` | Table header band, hover fills |
| `--v4-popup-background-color` | `#fbfbfb` | `#1c293c` | Modal surface (header, body and footer) |
| `--v4-popup-header-footer-color` | `#ffffff` | `#162034` | Legacy modal header/footer band (see 3.4) |
| `--v4-input-background-color` | `#ffffff` | `#1c293c` | Field background, selected list row |
| `--v4-input-border-color` | `#7c8fa3` | `#6b7a90` | Field borders only (3.33:1 on white, 3.08:1 on page) |
| `--v4-border-color` | `#e5e7eb` | `#3a3e47` | Card, panel, divider and container borders |
| `--v4-border-subtle-color` | `#f1f2f4` | `#2b303b` | Hairline separators |
| `--v4-list-hover-color` / `--v4-hover-color` | 8% tint of main text | same | Row and menu hover |

Rule: containers (cards, accordions, list rows, dividers) use `--v4-border-color`. Only form controls use `--v4-input-border-color`, because fields must meet the 3:1 boundary rule.

### 1.6 Status colours

Badges and chips (background / text):

| Status | Light bg / text | Dark bg / text |
|---|---|---|
| success | `#d1fae5` / `#047857` | `#d1fae5` / `#065f46` |
| info | `#e6eff6` / `#004a7c` | same |
| error | `#ffe2e2` / `#b91c1c` | same |
| warning | `#fef9c2` / `#a16207` | same |
| neutral | `#f3f4f6` / `#364153` | same |
| accent | `#f3e8ff` / `#7924ff` | same |
| approver | `#f3e8ff` / `#6b21a8` | `#3a2a52` / `#e9d5ff` |
| sky | `#e0f2fe` / `#0369a1` | same |

Chips stay light in dark mode on purpose so they remain readable on dark cards.

Large status surfaces (banners, step cards, info boxes):

| Token | Light | Dark |
|---|---|---|
| `--v4-surface-success` / `-bold` | `#ecfdf5` / `#d1fae5` | emerald-900 at 20% / 30% |
| `--v4-border-success` / `-subtle` | `#6ee7b7` / `#a7f3d0` | `#047857` / `#065f46` |
| `--v4-text-success` | `#047857` | `#34d399` |
| `--v4-surface-warning` / `-bold` | `#fffbeb` / `#fef3c7` | amber-900 at 20% / 30% |
| `--v4-border-warning` / `-subtle` | `#fcd34d` / `#fde68a` | `#b45309` / `#92400e` |
| `--v4-text-warning` | `#b45309` | `#fbbf24` |

Error surfaces borrow the error badge tokens (`bg-v4-badge-error-bg-color`, `border-v4-common-red-color`, `text-v4-common-red-color`). There is no dedicated error surface token yet.

Tone rules: compliance notices (re-verification, missing details) are neutral, never red. Only Enhanced Due Diligence uses amber. Success is emerald.

Insight cards (Overdue red, Due this week orange, Upcoming blue, Duplicates purple, High value green) have their own `--v4-insight-card-*` set: background, border, icon, label text, main number, sub number. In dark mode all five share the card surface `#162034` and border `#3a3e47`; only the icon and number colours change.

### 1.7 Dark and light theme behaviour

- `ThemeService` reads the `user-theme` key from localStorage (default `light-mode`) and puts that class on `<body>`. The header's moon/sun button toggles it and persists the choice.
- `_v4-theme.scss` emits the full `--v4-*` set under `.light-mode` and `.dark-mode`. Tailwind colours map to those variables, so every component re-themes automatically.
- What changes in dark mode: page `#162034`, cards and inputs `#1c293c`, borders `#3a3e47`, primary fill `#1d6aa5`, brand text `#8ec5ec`. Badges stay light chips. Charts are recoloured. The primary button stays a filled brand button.
- Brand banners (Bulk Payment Center, "Ready to send a payment?", Zil Money Wallet) use `--v4-cta-banner-bg-color`, which is the primary in light mode and a deep navy `#0c3d63` in dark mode (white text 11.3:1, teal CTA 3.8:1), so they keep the brand colour without glowing.
- Fixed-colour exceptions: the Free Demo modal's left panel is brand blue in both themes, so its highlight text and ticks use a panel-scoped mint `#6ee7b7` (6.07:1 on the light primary, 3.77:1 on the dark primary).

### 1.8 Typography, radius, shadow

- Fonts: `--font-funnel` for headings and labels, `--font-peridot` for body. Both currently resolve to Inter. Tailwind: `font-funnel`, `font-peridot`.
- Radius tokens: `--ui-radius: 0.5rem`; `rounded-lg` = 8px, `rounded-md` = 6px, `rounded-sm` = 4px. Cards and modals use 12px to 20px (`rounded-xl`, `rounded-2xl`, modal shell 20px). Dropdown controls and panels use 12px (0.75rem).
- Shadows: `shadow-common-button` `0 4px 4px rgba(0,74,124,.25)`, `shadow-v4-popup` `0 20px 60px rgba(17,24,39,.18)`, `shadow-v4-card`, `shadow-v4-card-hover`.

---

## 2. Button styling

All v4 buttons use `<app-common-button-v4>` (`src/app/shared/V4/buttons/common-button-v4/`). Do not hand-roll `<button class="bg-v4-primary-brand-color ...">`.

### 2.1 Types and variants

| Type input | Background | Text | Border | Height | Font | Radius |
|---|---|---|---|---|---|---|
| `{ name: 'main', style: 'primary' }` | primary brand | white | none | 44px | 14px / 600 | 8px |
| `{ name: 'main', style: 'secondary' }` | secondary background | main text | none | 44px | 14px / 600 | 8px |
| `{ name: 'main', style: 'outline' }` | secondary background | brand bold | 2px primary | 44px | 14px / 600 | 8px |
| `{ name: 'main', style: 'destructive' }` | common red | white | none | 44px | 14px / 600 | 8px |
| `{ name: 'main', style: 'warning' }` | secondary background | warning badge text | 2px warning | 44px | 14px / 600 | 8px |
| `{ name: 'main', style: 'neon' }` | primary brand (retired alias of primary) | white | none | 44px | 14px / 600 | 8px |
| `{ name: 'compact', style: 'primary' }` | primary brand | white | none | 32px | 13px / 500 | 4px |
| `{ name: 'compact', style: 'outline' }` | input background | secondary text | 1px input border | 32px | 13px / 500 | 4px |
| `{ name: 'action' \| 'list', style: 'green' \| 'blue' \| 'violet' \| 'red' }` | matching badge bg | matching common colour | none | 32px | 14 / 13px, 600 | 8px |
| `{ name: 'action' \| 'list', style: 'filled-green' \| 'filled-blue' \| 'filled-red' }` | matching common colour | white | none | 32px | 14 / 13px, 600 | 8px |
| `{ name: 'money-action', style: 'green' \| 'blue' \| 'violet' }` | matching common colour | white | none | 32px | 14px / 600 | 8px |
| `{ name: 'v4-tab', style: 'active' \| 'inactive' }` | primary / popup | white / main text | 2px primary / 2px input border | 44px | 13px / 600 | 6px |
| `{ name: 'v4-toggle', style: 'active' \| 'inactive' }` | primary / transparent | white / main text | none | 38px | 14px / 600 | 6px |
| `'borderless'` | transparent | inherits | none | 44px | 14px / 600 | 8px |
| `{ name: 'v2-1', size: 'md' \| 'sm', style: 'primary' \| 'navy' \| 'danger' \| 'danger-strong' \| 'success' \| 'muted' }` | per style (SCSS `.v21-btn`) | per style | 1px | padding 8/14 or 6/12 | 12px / 600 | 8px |

Link-style actions use `'borderless'` or a plain `<a>` with `text-v4-primary-brand-bold-color underline-offset-[3px] hover:underline`.

Custom colours: `backGroundInput` and `textColorInput` accept any CSS colour, including `var(--v4-*)`. Use them only for the teal banner CTA pattern (`var(--v4-secondary-brand-color)` with white text) and white-tint buttons on brand surfaces (`rgba(255,255,255,0.15)`).

Compact height for toolbars and banners: `[customHeight]="'36px'"` (font drops to 13px at 32px).

### 2.2 States

| State | Behaviour |
|---|---|
| Default | Values above. Letter spacing 0.5px, peridot font, padding `0 10px` (tabs `0 16px`) |
| Hover | `filter: brightness(0.92)`, `transform: scale(1.02)`, shadow `0 4px 8px rgba(0,0,0,.15)`. Outline main: hover fill `--v4-badge-info-bg-color`. Compact primary: opacity 0.9. Compact outline: tertiary background. v2-1: no transform. `hoverStyle` input overrides colours |
| Focus | Global rule: `outline: 2px solid var(--v4-brand-focus-color); outline-offset: 2px` on `:focus-visible` (keyboard only) |
| Active / pressed | `scale(0.98)`, `brightness(0.88)`, shadow `0 2px 4px rgba(0,0,0,.1)`, 100ms transition |
| Disabled | `[disabled]="true"`: `cursor: not-allowed; opacity: 0.45; filter: grayscale(0.4)`. v2-1: opacity 0.5, pointer-events none |
| Loading | `[loading]="true"`: button is disabled, label stays, a 16px `loader-circle` Lucide icon spins after the label in the text colour. With `spinIconOnLoading` the leading icon spins instead |

### 2.3 Dimensions, spacing, typography, icons, alignment

- Heights: 44px default, 38px segmented toggle, 36px banner/toolbar CTA, 32px compact and action, 28px list.
- Width: `width` input (`'100%'`, `'120px'`); `minWidth` defaults to fit-content. Modal footers use 120px Cancel and primary buttons.
- Label: sentence case. 14px / 600 for main, 13px / 500 for compact.
- Icons: Lucide via `lucideIcon="send"` with `lucideIconSize` (15 default; 14 in compact, 16 in 44px CTAs). `iconPosition` `'start'` (default) or `'end'` (arrow-right on "Learn more" and banner CTAs). Gap between icon and label is 4px. FontAwesome icons are legacy (`isAddIcon` + `icon`); do not add new ones.
- Alignment: content is centred. Footer actions are right-aligned with a 12px gap, Cancel (outline) before the primary. Banners put the CTA at the far right.
- Tooltips on icon-only buttons via `toolTip`; `ariaLabel` falls back to the tooltip.

### 2.4 Button hierarchy rules

- One filled primary per view or modal. Secondary actions are outline. Tertiary actions are borderless or text links.
- On brand-coloured surfaces (banners, promo cards) the primary action is the teal fill with white text; supporting actions are 15% white tint with a 30% white border.
- Destructive actions use the destructive style and sit left of Cancel only in confirm dialogs.
- The Instant Demo modal: "Talk to an expert now" is the primary (brand fill, 48px, pulse) while an expert is online; "Book Demo Now" drops to outline. When nobody is online, "Book Demo Now" becomes primary again.

---

## 3. Component states

### 3.1 Form fields (`app-common-input-v4`, `app-phone-input-v4`)

| State | Appearance |
|---|---|
| Default | 44px (compact 40px, table 32px), 1px `--v4-input-border-color`, 8px radius (phone wrapper 10px), white/`#1c293c` background, 14px text, placeholder `--v4-placeholder-text-color` |
| Label | 14px / 500 `--v4-secondary-text-color`, 6px above the field. Required fields append a red asterisk (`isFieldRequired`, default true). Optional fields say "(optional)" in the label |
| Focus | Border `--v4-brand-border-color` plus a 2px ring of the same colour; no outline |
| Hover | No change (border stays) |
| Error | Border `--v4-common-red-color` when `isInvalid`; message from `app-control-message-v4`: red 12px text with a shaking exclamation icon, shown once the control is touched. Default copy "This field is required", or the validator's message, or `customMessages[key]` |
| Disabled | Opacity 0.5, control disabled; phone input also `pointer-events-none` |
| Read-only | `isApprovedReadOnly`: disabled background, `cursor: no-drop` |
| Info | `showInfoIcon` + `tooltip`: 14px info icon inside the field (or beside the label with `infoInLabel`), tooltip class `v4-info-tooltip` (220px max) |
| Validation timing | Messages appear on blur (touched). Submit marks all controls touched and opens the section that contains the first invalid field, scrolls to it and shakes it |

Checkbox, radio, toggle:

| Control | Default | Checked | Focus | Disabled |
|---|---|---|---|---|
| `.v4-checkbox-sm` (18px) / `-md` (20px) native | 1.5px `--v4-input-border-color`, 4px radius | primary fill, white tick | 2px primary outline, 1px offset | opacity 0.5, not-allowed |
| `.v4-checkbox` (mat-checkbox, 20px) | 1.5px input border | primary fill | global focus ring | not styled (use native) |
| `.v4-radio-sm` (16px) / `-md` (20px) | 2px `--v4-subtle-text-color` | brand bold | 2px ring, brand bold at 25% | opacity 0.5, not-allowed |
| `app-v4-radio-group` | 18px circle, 2px border | 9px brand-bold dot | global focus ring | opacity 0.4 |
| `app-common-toggle-v4` (40×22 switch, `role="switch"`) | track `--v4-border-color`, white thumb | track primary | 2px brand-bold outline | opacity 0.5 |

Segmented choice (e.g. Entity: Individual / Business): pill buttons 36px, 1px input border, selected = primary fill with white text, `role="radio"` + `aria-checked`, hover brand border, global focus ring.

### 3.2 Dropdowns

Standard control: `<app-v4-common-dropdown>` (`src/app/shared/V4/v4-dropdown/`), an ng-select wrapper.

| State | Appearance |
|---|---|
| Default | 44px (`size: 0`), 1px `--v4-input-border-color`, 12px radius, secondary background, placeholder `--v4-subtle-text-color` 14px, arrow in subtle text colour |
| Hover | Border turns brand |
| Open / focused | 2px brand border; panel below with 5px gap |
| Has value | 2px brand border, value in peridot 500, arrow hidden, clear icon on the right (`clearable`) |
| Panel | `ng-dropdown-panel-v4`: 12px radius, 1px input border, shadow, options as 44px rows with 8px gap, marked and selected rows use tertiary background with a brand border, 240px max height with scroll, z-index 10015 when `appendTo="body"` |
| Searchable | Caret hidden while typing; "No items found" (or `notFoundText`) in muted text; loading spinner in theme colour |
| Add new | Optional dashed header row (`enableAddNew`) that emits `buttonClick` |
| Invalid | `isInvalid` adds a red border; message via `app-control-message-v4` |
| Disabled | `isDisabled`; rows can be individually disabled with a tooltip |
| Compact | `variant="compact"`: 44px, 1.5px `--v4-border-color`, 12px radius, 3px focus ring, no clear icon |

Rules for consistency:

- Inside modals and scrollable panels set `appendTo="body"` so the panel is never clipped.
- Raw `<ng-select>` must be wrapped in `.angular-ocw-v4-ng-select-dropdown` and carry `class="ng-dropdown-panel-v4"` with a `height-0` or `height-1` tier, otherwise it renders with the default ng-select theme. Prefer the shared component.
- Height tiers: `height-0` 44px (default), `height-1` 40px. The older mixin tiers (32/38/48/54) are deprecated.
- Native `<select>` is allowed only for simple mapping tables; style it `h-[44px] rounded-lg border border-v4-input-border-color bg-v4-secondary-background-color text-sm` and never with `bg-white` or hard-coded focus colours.
- Overflow (⋮) menus: mat-menu with class `v4-action-menu` (secondary background, 1px `--v4-border-color`, 12px radius, shadow). Custom CDK or absolute panels use the same look: `bg-v4-popup-background-color rounded-xl border border-v4-border-color shadow-lg py-1`.
- Send-payment source pickers use `app-sp-dropdown-shell` (49px trigger, 12px radius, `--v4-border-color`, open = brand border plus 3px ring, inline panel with 15px radius).

### 3.3 Empty, loading, success and error states

Empty:

- Page or table level: `app-v4-data-table-empty-state`. White card, 1px `--v4-border-color`, 12px radius. 60px icon circle (brand at 9% fill, brand at 22% ring) with a 26px Lucide icon in brand, 18px title, 13px description up to 420px wide, ONE compact primary CTA. Optional link row, source chip and a right-hand "How it works" aside with a video row and three tick steps.
- Detail panel level: `app-pd-empty-state`. 32px neutral icon circle, 12px bold title, 11px hint, CTA slot.
- Never keep a fake list or detail skeleton on an empty page. Zero records = one empty panel.
- Inside ag-grid without config: the overlay prints "No results found".

Loading:

- Tables: `V4TableSkeletonOverlay` shimmer rows (checkbox, pill and stacked shapes per column, max 20 rows).
- Panels and sections: `app-pd-skeleton` with `panel` and `section` variants (`.pd-skeleton-bar`, `animate-pulse`).
- Full-screen: `app-loading-overlay-v4`: fixed overlay, `bg-black/20`, 2px blur, 48px spinning `loader-circle` in brand bold.
- Inline: a `loader-circle` Lucide icon with `animate-spin`. Buttons use the `loading` input. Modals show a `py-12` strip with the spinner and "Loading…" text in place of the body.
- Templates gate with `@if (isLoading()) { skeleton } @else { content }`.

Success, error, info, warning dialogs (`V4AlertService`): `successAlert`, `failedAlert`, `infoAlert`, `warningAlert`, `confirmAlert`. Centred dialog, 370px, 64px icon circle in the matching badge colours (`circle-check-big`, `circle-x`, `info`, `triangle-alert`), funnel 18px title, 14px body, one full-width primary button. Success, failed, info and warning auto-close after 1 s when `close` is set (success defaults to auto-close). Confirm waits 6 s. There is no toast or snackbar in v4.

Inline banners:

- Success: `rounded-lg bg-v4-surface-success px-2.5 py-1.5` with a 14px `circle-check-big` in `text-v4-text-success`.
- Warning: `rounded-lg border border-v4-border-warning bg-v4-surface-warning p-2.5`, title in `text-v4-text-warning`, `triangle-alert` icon.
- Error: `rounded-lg border border-v4-common-red-color bg-v4-badge-error-bg-color px-3 py-2`, icon and text in `text-v4-common-red-color`.
- Info / promo: `rounded-lg border border-v4-brand-border-color` on a 10% brand tint, e.g. "Don't know the payee's details? Send a link".

Status badges (tables): `.status-badge`, 12px peridot, 8px radius, `4px 12px` padding. Mapping: pending/approval = warning, processing = info, success/settled/paid/printed = success, failed/rejected/voided = error, new = accent. Verified bank accounts show a tick icon and a short "ACH" chip, never the word "Verified".

### 3.4 Modals

- Opened with `MatDialog` and `panelClass: 'paddingless-modal-rounded'`: 20px radius, no padding, surface `--v4-popup-background-color`, max height 95%, body font peridot, headings funnel. Common widths: 500px, 700px, 900px, `93%` with `maxWidth: '95vw'`.
- Shell recipe (single surface, as in the Add Category modal):
  - Header: `flex justify-between px-6 py-4 bg-v4-popup-background-color`, title `text-xl font-semibold text-v4-main-text-color font-funnel`, subtitle `text-xs text-v4-subtle-text-color`, close = 36px `rounded-lg` icon button with `x`, hover tertiary background.
  - Body: `px-6` on the same surface. Sections are white cards (`form-card`) with 1px `--v4-border-color`.
  - Footer: `flex justify-end gap-3 px-6 py-5`, Cancel outline then primary, both 120px, primary carries `loading`/`disabled`.
- Large modals keep header and footer fixed and scroll the body. Submit disables the primary and shows the spinner.
- Confirm/alert dialogs use `v4_alert_wrapper` (16px radius, centred layout, 370px).
- Known inconsistency: of 110 modal templates, 78 headers still use `bg-v4-secondary-background-color` and 16 use `bg-v4-popup-header-footer-color`. In dark mode the latter produces a visible inner panel. New and touched modals should follow the single-surface recipe above.

### 3.5 Tooltips

- `matTooltip` with the global v4 style: black surface, white 11.5px text, letter spacing 0.3px, up to 600px wide, pre-line wrapping, peridot font.
- `matTooltipClass="v4-info-tooltip"` for field help: 220px max width, normal wrapping.
- Tooltips over a detail panel are lifted to z-index 10020.

### 3.6 Tables (`app-v4-data-table`, ag-grid `ag-theme-v4`)

- Header 36px band in `--v4-tertiary-background-color`, 13px / 600 secondary text, 1px bottom border. Compact mode (default) removes the band and sits the header on the surface.
- Per-column floating filter row, 44px (text, date, dropdown, amount, bank, payee, source, wallet type).
- Rows 35px (component default), 13px peridot, 1px `--v4-border-color` dividers, no zebra. Hover and selected rows are an 18% brand tint with a 200ms transition.
- Selection checkbox first (pinned left), Action column immediately after it: ⋮ first, then icon buttons, then the primary action or status badge last.
- Toolbar right side: Refresh (spins while loading) · rows per page (5/10/20/50, default 50) · Manage columns · Export (CSV, Excel, PDF, print, email). Collapses into a ⋮ menu below `md`.
- Bulk selection shows the floating action bar on the left of the toolbar.
- Pager: "Showing X to Y of N results", previous/next, up to four page boxes with ellipsis, "Page / Go" input.
- Loading: shimmer skeleton overlay. Empty: `No results found` or the configured empty-state card.

### 3.7 Accordions, chips and optional sections

Long forms no longer stack identical accordions. The Add payee modal pattern:

- Required fields in one card. The entity choice (Individual / Business) is a separate card with pill buttons; choosing Business reveals Company Name as required, choosing Individual shows it as optional.
- Optional sections (Address, Bank account, More info) are a single row: label "Add optional details" and dashed chips (32px, 1px dashed input border, 13px / 600). Active chip: solid brand border on a 10% brand tint. Completed chip: solid success border with a tick. Required-but-missing chip: red border with a "Required" tag.
- Only one optional panel opens at a time, directly below the row, with its own title and close (x) button.

---

## 4. Changes in this pass (October 2026)

### 4.1 Dashboard and main pages

- Bulk Payment Center: tiles and secondary buttons moved from hard-coded indigo `#3746a7` to 15% white tint; "Coming Soon" badge to warning badge tokens; card background to `--v4-cta-banner-bg-color` with a 15% white hairline, a deep navy in dark mode; "Go to Bulk Payment Center" is the teal fill with white text.
- Main-page CTA banners ("Ready to send a payment?" etc.) now use `--v4-cta-banner-bg-color`; the banner button is the teal fill with white text and no border.
- Feature icon tiles on Payables, Receivables, Business Tools, Accounts, Services and Settings: every slate `--v4-accent-violet-color` tile became `--v4-primary-brand-color`. Pages now use three tile colours: primary, sky, secondary teal.
- New shared component `app-zm-wallet-intro-v4` ("Introducing Zil Money Wallet": brand card with three stats plus a 2×2 grid of value cards). Used on the Accounts page. Removed from the dashboard on request. Compacted spacing and type.

### 4.2 Modals

- Instant Demo modal: "Free Demo?" heading, ticks and the live dot use a panel-scoped mint accent (the theme green vanished on the blue panel). "Talk to an expert now" is now the primary action (brand fill, white text, 48px, pulse); "Book Demo Now" is outline while an expert is online and primary otherwise.
- Add Category modal: header, body and footer on one popup surface, dividers removed.
- Add payee / customer / vendor / employee modal:
  - Container borders (Basic Information card, accordions, bank form, share link) moved from the field border token to `--v4-border-color`.
  - Restructured as described in 3.7: separate Entity chooser, Company Name shown for both choices (required for Business), optional-details chip row, single-open panels, Payee ID moved into More info, duplicate "Address is required" line removed.
  - Send a secure link: the non-functional email/phone checkboxes were removed. They mirrored the send-by-email / send-by-SMS flags, which the code sets from a valid value. The form now labels Email and Mobile number, explains that the link goes to every channel filled in, and shows "Link will be emailed" / "Link will be texted" under a valid field.
  - International bank list rows and inner accordion use the card border token.

### 4.3 Lists

- Wallet list: row dividers moved to `--v4-border-color` to match Bank Accounts and My Cards. Rows reserve a transparent 4px left rail so the selected rail no longer shifts content.

### 4.4 Global consistency fixes from the audit

- Defined `--v4-hover-color` (alias of `--v4-list-hover-color`) in both themes and added the Tailwind key. Five templates and the table theme referenced it without a definition.
- Dropdown radius unified at 12px in the shared mixin and global overrides (components previously overrode 8px to 12px one by one).
- `.v4-common-dropdown` trigger hover and panel row hover/selected replaced hard-coded `#d1d5db` / `#f3f4f6` with `--v4-input-border-color` / `--v4-tertiary-background-color` (now dark-mode safe).
- Three ng-selects in the bulk check-mail step were missing `ng-dropdown-panel-v4`; added, so their body-appended panels get the v4 theme and z-index.
- Native select in the check-draft import mapping: `bg-white` → `bg-v4-secondary-background-color`. Payment-links create: `focus:ring-[#004a7c]` → `focus:ring-v4-brand-focus-color`. Add contact modal: fixed `bg-v4-secondary-background-colorr` typo.
- Radio focus ring used an invalid `hsl(var(--hex) / 0.2)`; now `color-mix(... 25%, transparent)`.
- `.v4-checkbox-sm` / `-md` unchecked border aligned to `--v4-input-border-color` (was main text colour). Added disabled styling for native v4 checkboxes and radios.
- Dropdown size documentation corrected to the real tiers.

### 4.5 Open items (not changed, for review)

- Modal shells: 78 of 110 modal headers still use `bg-v4-secondary-background-color`; there is no shared modal shell component. Recommend extracting one and migrating.
- Dropdown height tiers still exist in two systems (global 44/40 vs mixin 32/38/48/54). Pick one and delete the other.
- 40 hand-rolled primary `<button>`s across 24 v4 files (email settings, user profile, verify card modal, signature upload, date picker selected day) with mixed radius (8/12/16px), hover (opacity 90/80) and disabled opacity (0.2/0.6/none). Migrate to `app-common-button-v4`.
- `app-control-message-v4` uses a FontAwesome icon; the repo rule is Lucide only.
- `app-common-input-v4` applies a legacy `border-common-red-color` class whenever a field is empty (`!inputValue.value`). It is overridden visually but should be removed.
- Two legacy ag-grid themes (`ag-theme-material`, bare `ag-theme-alpine`) remain on five grids.
- Country/state selects and three modals use raw ng-select without the shared mixin, so they lack the has-value and hover states.
- Field border lightening: the current `#7c8fa3` sits at 3.08:1 on the page background. Any lighter value fails the 3:1 boundary check in `tools/contrast-check.mjs`. If a softer field edge is wanted app-wide, that rule needs an explicit exception.
- White text on the teal secondary brand (`#00a5b2`) measures about 3:1. It is used on banner CTAs by request; it is below the 4.5:1 text target.
