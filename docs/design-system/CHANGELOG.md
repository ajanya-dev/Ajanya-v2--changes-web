# UI change log

One entry per working day. Newest first. Each item names the screen, what changed and the files touched, so a reviewer can trace it without reading diffs.

Related: `docs/design-system/v4-ui-reference.md` (colour, button and component-state reference).

---

## 13/10/2026

Branch: `design/zilmoney-rebrand` (main copy, port 4200). Every change was also synced to the `design/zilmoney-rebrand-old-colors` (4201) and `design/zilmoney-rebrand-teal` (4202) worktrees with `tools/sync-from-main.mjs`.

### Dashboard

- **Bulk Payment Center**
  - Replaced the hard-coded indigo `#3746a7` on the three info tiles and the three secondary buttons with a 15% white tint over the card colour.
  - "Coming Soon" badge moved from hard-coded yellow hex values to the warning badge tokens.
  - "Go to Bulk Payment Center" changed from the invisible neon style to the secondary brand teal fill with white text.
  - Card background moved from the primary token to `--v4-cta-banner-bg-color` with a 15% white hairline, so dark mode renders a deep navy instead of a bright blue block.
  - File: `src/app/modules/v4-pages/v4-dashboard/components/bulk-payment-center/bulk-payment-center.component.ts`
- **Zil Money Wallet intro** added below the Bulk Payment Center, then removed again on request. The dashboard ends at the Bulk Payment Center.
  - Files: `src/app/modules/v4-pages/v4-dashboard/v4-dashboard.component.html`, `.ts`

### Main pages (Payables, Receivables, Business Tools, Accounts, Services, Settings)

- **Feature icon tiles**: every slate `--v4-accent-violet-color` tile became `--v4-primary-brand-color`. Started with Send Payment, Payroll by Credit Card and Bill Inbox on Payables, then applied to all 18 remaining tiles across the other pages.
  - File: `src/app/shared/components/v4/v4-main-page-layout/v4-main-page-data.ts`
- **CTA banners** ("Ready to send a payment?" etc.): the banner button first got a white border, then on review became the teal fill with white text and no border. Banner background moved to `--v4-cta-banner-bg-color` for dark mode.
  - Files: `src/app/shared/components/v4/v4-main-page-layout/v4-main-page-layout.component.html`, `v4-main-page-data.ts`
- **Accounts page**: the inline "Introducing Zil Money Wallet" block was extracted into a shared component and compacted (smaller padding, icon tiles, type scale, 36px Learn More button, teal CTA).
  - New: `src/app/shared/components/v4/zm-wallet-intro-v4/zm-wallet-intro-v4.component.ts`
  - Files: `src/app/modules/v4-main-pages/v4-accounts/v4-accounts.component.html`, `.ts`

### Theme tokens

- Dark theme `--v4-cta-banner-bg-color` set to `#0c3d63`, a deep navy counterpart of the light primary (white text 11.3:1, teal CTA 3.8:1).
  - File: `src/assets/style_varients/_v4-dark-theme.scss`
- Defined `--v4-hover-color` (alias of `--v4-list-hover-color`) in both themes and added the Tailwind key. Five templates and the table theme referenced it without a definition.
  - Files: `src/assets/style_varients/_v4-theme.scss`, `tailwind.config.js`
- Input border token left at `#7c8fa3`. A lighter value was tried and reverted because it fails the 3:1 field-on-page check in `tools/contrast-check.mjs`.

### Modals

- **Instant Demo (book a demo) modal**
  - "Free Demo?" heading, the five ticks and the eyebrow dot use a modal-scoped mint accent `#6ee7b7`; the theme green vanished on the blue panel.
  - "Talk to an expert now" text set to white, then promoted to the primary action: brand fill, white text, 48px, pulse animation. "Book Demo Now" is outline while an expert is online and primary otherwise.
  - Files: `src/app/modules/user-support/modals/v4/book-a-demo-modal-v4/book-a-demo-modal-v4.component.html`, `.scss`
- **Add Category modal**: header, body and footer on one popup surface; dividers removed.
  - File: `src/app/shared/modal/category-modal/category-add-modal-v4/category-add-modal-v4.component.html`
- **Add payee / customer / vendor / employee modal**
  - Container borders (Basic Information card, accordions, bank form, share link, send link card, type bar divider) moved from the field border token to `--v4-border-color`.
  - Restructured: separate Entity chooser (Individual / Business pills) under Basic Information; Company Name shows for both choices, required for Business; optional sections (Address, Bank account, More info) collapsed into one "Add optional details" chip row with single-open panels; Payee ID moved into More info; duplicate "Address is required" line removed.
  - Send a secure link: removed the non-functional email and phone checkboxes (they mirrored flags set by valid input). Added labels, a hint line and "Link will be emailed" / "Link will be texted" status under valid fields.
  - International bank list rows and inner accordion use the card border token.
  - Files: `src/app/modules/payee/payee-v4/modals/add-payee-modal-v4/add-payee-modal-v4.component.html`, `.scss`, `.ts`; `src/app/modules/payee/payee-v4/v4-components/add-payee-international-bank-v4/add-payee-international-bank-v4.component.scss`

### Lists

- **Wallet list** (Wallets page sidebar): row dividers moved to `--v4-border-color` to match Bank Accounts and My Cards; rows reserve a transparent 4px left rail so the selected rail no longer shifts content.
  - File: `src/app/modules/wallet/wallet-v4/v4-components/wallet-list-v4/wallet-list-v4.component.html`

### Send Payment dropdowns

- **Wallet rows**: masked number placed beside the name, balance on its own line.
- **Bank account rows**: aligned to the card and wallet row recipe (28px icon tile, 13px bold name, masked number beside it, 8px padding, 3px row gap, brand-tint selection with border).
- **Mask format** unified to "•••• 1234" across bank, wallet and card rows (was "••1234" and "**** 1234").
- **Add new tile**: the bank account dropdown's footer link replaced by the dashed green "Add New Bank Account" tile at the top, identical to the card, payee, payee bank, category and select dropdowns.
  - Files: `src/app/modules/payments-v4/send-receive-page/components/payments-section/send/dropdowns/sp-wallet-dropdown/*`, `sp-bank-ac-dropdown/*`

### Global consistency fixes from the audit

- Dropdown radius unified at 12px in the shared mixin and global overrides.
  - Files: `src/app/shared/components/v3/drop-downs/styles/drop-down-v4.scss`, `src/assets/style_varients/_overrides-v4.scss`
- `.v4-common-dropdown` trigger hover and panel row hover/selected replaced hard-coded `#d1d5db` and `#f3f4f6` with theme tokens.
- Three bulk check-mail ng-selects were missing `ng-dropdown-panel-v4`; added.
  - File: `src/app/modules/v4-bulk-payment/modals/v4-bulk-payment-modal/components/v4-check-mail-bulk/v4-check-mail-bulk.component.html`
- Native select in the check-draft import mapping: `bg-white` → `bg-v4-secondary-background-color`. Payment-links create: `focus:ring-[#004a7c]` → `focus:ring-v4-brand-focus-color`. Add contact modal: fixed `bg-v4-secondary-background-colorr` typo.
- Radio focus ring used an invalid `hsl()` on a hex token; now `color-mix`. `.v4-checkbox-sm` and `-md` unchecked border aligned to `--v4-input-border-color`. Added disabled styling for native v4 checkboxes and radios.
- Dropdown size documentation corrected to the real height tiers.
  - File: `src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface.ts`

### Documentation

- New `docs/design-system/v4-ui-reference.md`: colour theme, button styling, component states, today's changes and open items. Shared copies generated as Word, HTML and Markdown in `C:\Users\Ajanya\Downloads\ZilMoney-v4-UI-Reference.*`.
- New `docs/design-system/CHANGELOG.md` (this file).
-  gained a "5. Style samples" section: ten live-rendered examples (primary, outline and destructive buttons, compact and action buttons, buttons on a brand surface, form field states, dropdown with add-new tile and rows, status badges, choice pills and optional-detail chips, inline banners, modal shell with empty state). The Word and Markdown copies are unchanged.
- New  (22 pages): a phase-by-phase knowledge base in the company's 16-phase format, covering the whole programme from 2 to 13 October. Rendered from HTML with headless Chrome.
- Pushed to the design-snapshot repo  (): snapshot 4 (all code changes), 4.1 (PDF and reference copies), 4.2 (style samples), 4.3 (full-programme knowledge base). The snapshot holds every file that differs from the Bitbucket  branch.

### Open items noted, not changed

- 78 of 110 modal headers still use `bg-v4-secondary-background-color`; no shared modal shell component exists.
- Dropdown height tiers exist in two systems (global 44/40 vs mixin 32/38/48/54).
- 40 hand-rolled primary `<button>` elements across 24 v4 files.
- `app-control-message-v4` uses a FontAwesome icon; repo rule is Lucide only.
- `app-common-input-v4` applies a legacy red border class whenever a field is empty (visually overridden).
- White text on the teal secondary brand measures about 3:1 on banner CTAs, below the 4.5:1 text target.
