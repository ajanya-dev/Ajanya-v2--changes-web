# UI change log

One entry per working day. Newest first. Each item names the screen, what changed and the files touched, so a reviewer can trace it without reading diffs.

Related: `docs/design-system/v4-ui-reference.md` (colour, button and component-state reference).

---

## 15/10/2026

Branch: `design/zilmoney-rebrand` (main copy, port 4200), synced to 4201 and 4202.

### Send Payment, International rail: a refused Confirm lands on the field

A review asked whether Confirm Payment Details on the International rail ever leaves the user with an alert and no way to the field. Four cases did; all are closed, and one of the fixes applies to every rail. The rule is now written up as section 3.8 of `v4-ui-reference.md`.

- **No exchange rate at Confirm.** Validation passed, the confirmation modal opened, and only after the user confirmed did a "Could not price this payment" dialog appear. Confirm is now refused before the modal: a red line under the recipient block says "No exchange rate yet. Check the amount (at least $10), the recipient type and the destination currency, then confirm again." (or "Still getting the exchange rate. Try again in a moment." while a quote is in flight) and the page scrolls to it. The line clears when a quote arrives.
- **Unresolved transaction limit at Confirm.** Was an error dialog repeating the limit card's message. Now scrolls to the limit card, which holds the message and the Edit amount button.
- **Purpose category** (required, derived from the chosen purpose, no field of its own) pointed at the payee row when it blocked. Now points at the Purpose field.
- **Stored payee email that fails the check** (malformed, or the account holder's own address) shook the payee row with no word on why. On the wallet rails it now gets the calm prompt "Payee email address needs attention" with Update email (opens the payee editor on the email page) and Not now (points at the payee field), the same pattern as missing details.
- **Several invalid fields, every rail.** The page used to land on whichever control was declared first in the form, which could be lower on the page than another empty field. It now collects every invalid control and lands on the top-most one in document order; the next Confirm moves to the next. New `send/field-focus/invalid-fields.ts` (`invalidControlKeys`, `firstInDocumentOrder`) with `invalid-fields.spec.ts` (6 cases, green); `requestFieldFocus` accepts a list; `firstInvalidKey` kept for the check flow's own ordering.
- **Follow-up from the user's review screenshot**: with no payee selected, Confirm on the International rail opened the new "Payee email address needs attention" prompt, and Update email had no payee to open. Cause: the hidden `payeeEmail` control is required, so it was invalid merely for being empty. The prompt now runs only when a payee is selected and the stored email has a value that fails (`send/shared/payee-email-check.ts`, `payee-email-check.spec.ts`, 4 cases); with no payee the generic branch lands on the payee field as before.
- Checked and left as they are: the card minimum amount is caught inline by the amount validator before the card gate's dialog can run; "cannot be saved as a draft" (international, virtual card) and "payee temporarily restricted" stay dialogs because there is no field to land on.
- Verification: the dev server rebuilt clean after each step; the spec passes; ESLint on every touched file shows only findings that were already present on the committed versions (dependency cycle, import order, a fallthrough and two nested ternaries in the wallet service), and two pre-existing loop findings in the send state service were removed on the way. Not clicked through on staging in this session (no login available); the QA cases are listed in the knowledge base.
- Note: the repo has no unit-test target (no Karma or Jasmine installed, no `test` entry in `angular.json`), although `CLAUDE.md` says `npm test` runs Karma. The spec was run through esbuild and a small Node runner in the session scratchpad.
  - Files: `send/field-focus/invalid-fields.ts`, `invalid-fields.spec.ts`, `send/shared/services/send-state.service.ts`, `send/send.component.ts`, `send/wallet/services/wallet-payment.service.ts`, `send/wallet/components/international-payment/international-payment.component.ts`, `.html`, `send/bank/services/bank-payment.service.ts`, `send/bank/services/bank-check.service.ts`, `send/card/services/card-payment.service.ts`, `send/bank/components/export-check-section/export-check-section.component.ts`

### Docs

- **Knowledge base brought up to date.** `ZilMoney-v4-UI-Knowledge-Base.pdf` regenerated to cover the whole programme from 2 to 14 October: a sixth stage (14 October polish), the bank account card rebuild and Verification Center severity model inside stage 4, the field-border decision and its exception, the softened dark-mode text, the Send Payment heights and missing-details prompt, the Add Payee entity card and send-link defaults, four new decision rules, updated colour cards, FAQ, compliance, development, QA and support phases, and the open-items table. The HTML source now lives beside the PDF as `ZilMoney-v4-UI-Knowledge-Base.html` so the next update edits a file in the repo instead of rebuilding from scratch. Copies in Downloads as `ZilMoney-v4-UI-Knowledge-Base.pdf` and `.html`.
- **Change log backfilled.** Entries added below for 10, 9, 7, 6, 5, 3 and 2 October, reconstructed from the branch commits, the design-snapshot history, the specs and plans under `docs/superpowers`, and the session notes, so every working day of the programme has an entry.
- `v4-ui-reference.md` and `.html`: a pointer under section 4 to the earlier passes in this change log; "updated" date moved to 15 October. Token tables unchanged (already current as of 14 October). The `.docx` was not regenerated. Later the same day: new section 3.8 "Blocked submit: where the user lands" and 4.7 for the Send Payment fix above; the knowledge base gained a seventh stage for it and was re-rendered. The knowledge base carries no calendar dates by request. Its QA Scheduled and In QA phases were then rewritten around the user's criterion: every Send Payment journey and modal is checked and nothing may break; fixes change behaviour only where a journey was broken, and the UX must not change anywhere else.
- Pushed to the design-snapshot repo `ajanya-dev/Ajanya-v2--changes-web` (`main`) as snapshot 6: the Send Payment fix and its follow-up with both specs, the knowledge base HTML and PDF, the Add payee and Add customer modal state sheets, the WCAG spec and plan, and this change log.

## 14/10/2026

Branch: `design/zilmoney-rebrand` (main copy, port 4200). Synced to the 4201 and 4202 worktrees with `tools/sync-from-main.mjs`.

### App-wide

- **Field border lightened**: `--v4-input-border-color` (light) and `$zm-control-border` from `#7c8fa3` to `#d1d5db` at the user's request, after trying `#8395a8`, `#8a9bad` and the staging grey `#e5e7eb` (a touch too faint). 1.47:1 on white, 1.37:1 on the page tint; WCAG 1.4.11 knowingly not met for field borders, recorded as a documented exception in the contrast guard. Colour only; radius, height and padding untouched. Dark theme unchanged. Same grey in all three worktrees.
  - Files: `src/assets/style_varients/_v4-light-theme.scss`, `_zm-palette-preview.scss`, `tools/contrast-check.mjs`

### Dark theme

- **Main text softened**: `--v4-main-text-color` (dark) from `#f8fafc` to `#e2e8f0` (slate-200). Reported on Send Payment, Pay from and Select a wallet: the bold wallet names read as glaring pure white in dark mode. 11.9:1 on the card surface, 13.2:1 on the page, still well above AA. Light theme unchanged.
  - File: `src/assets/style_varients/_v4-dark-theme.scss`

### Send Payment, field heights

- **Two heights on the page, by request.** The four main dropdowns (Pay from, Select a bank account / card / wallet, Who are you paying, How would you like to send it) are 44px, down from 49px. Everything under Additional details is 40px: the payee bank, category and select dropdowns (the shared bar takes a `barHeight` input, 44px by default, 40px there), the Payee ID, Invoice number and the other text inputs on every rail, the receive side and the check/notify/recurring modals (from the 44px default), and the Memo box minimum (from 45px).
  - Files: `sp-dropdown-shell.component.ts/.html`, `sp-payee-bank-dropdown`, `sp-category-dropdown`, `sp-select-dropdown`, `send.component.html`, and every `app-common-input-v4` call under `send-receive-page`

### Send Payment, missing payee details

- **Fix: the prompt now fires when the email is missing (bank, wallet, card).** The payee email is a required form control on those rails, so a missing email failed the form first and Confirm only shook the field; the "Payee details are missing" prompt never ran. The missing-payee check now runs before the form check on all three rails. The address-only case had passed because address is not a form control.
  - Files: `bank-payment.service.ts`, `wallet-payment.service.ts`, `card-payment.service.ts`
- **Inline nudge names every gap.** "Missing email address and address details · Add now" instead of only the first; Add now walks through the gaps the same way the prompt does, asking for the next one after each save.
  - Files: `send.component.ts` (`missingPayeeSummary`), `send.component.html`

- **Confirm with a payee gap no longer dead-ends.** Pressing Confirm Payment Details (or Save) with the payee's address, email or company missing now opens a calm info prompt, "Payee address is missing. This payment needs the payee's address. Add it now to continue." with **Add address** and **Not now**. Add opens the payee editor on that section and the form re-reads the payee afterwards; Not now returns to the form and points at the payee field. When more than one detail is missing (address and email, say) the prompt names them all, "Payee details are missing. This payment needs the payee's address and email address. Add them now to continue." with **Add details**; after the first save is read back, whatever is still missing is prompted for in turn, so the user is walked to each field. Before, the submit was refused with a shake and no words. Applies to the bank, wallet and card rails.
- **Nudge under the payee** ("Missing address details") now uses the error colour (`--v4-common-red-color`) with the alert icon and an underlined "Add now", so the gap is noticed; the prompt and editor make the fix one click away. (Tried first as a neutral notice, changed to red on request.)
- **Payment details panel**: the "Missing details for this payment" amber box is now a neutral card, "A few payee details are needed", with the same Add links.
  - Files: `send-state.service.ts` (prompt + editor request), `bank-payment.service.ts`, `wallet-payment.service.ts`, `card-payment.service.ts`, `send.component.ts/.html`, `payment-details-section.component.ts/.html`

### Payees, Add Payee modal

- **Secure link: a checkbox beside Email and beside Mobile number, both on by default.** A ticked box means "send here once this is filled in"; it can be unticked to keep the value but not send there, and it unticks itself if the value is invalid. A tick over an empty field sends nothing, so the "enter either Email or Phone Number" guard still applies, and the "Link will be emailed / texted" line appears only once the field is filled. Labelled for screen readers ("Send the link by email" / "…by text message"); the "Link will be emailed / texted" line stays as confirmation.
  - Files: `add-payee-modal-v4.component.html`, `.scss`
- **Secure link: "Request … to add bank account" is on by default.** The checkbox is always present and now starts checked for every payee type, so the generated link asks for bank details unless the user unticks it. It was unchecked by default, so most links went out without the bank step.
  - File: `add-payee-modal-v4.component.ts` (`addPayeeBank = true`)

- **Entity card**: Business now shows the address fields inline under Company Name, all required; the Address chip leaves the optional row. Individual keeps the optional Address chip. Typed address survives switching back to Individual. State and Country labels carry the required asterisk for a business. Save validation points at the Entity card for a business.
- **Payee ID/Acc Number** moved from More info to the Entity card beside Company Name (Individual and Business), labelled optional.
- **Entity card copy**: for an Individual the subtitle "Company name is optional for an individual" was removed and the field label became "Company Name (optional)". Business keeps the required subtitle.
- **Entity explanation as a tooltip**: the subtitle under "Entity" is gone. An info icon beside the title (keyboard-focusable) shows: "Who you are paying. Individual: a person, paid under their own name. Business: a company or organisation. Company name and address are required." Tried first as a subtitle, moved to a tooltip on request to keep the card to one line.
- **Optional-details chips** (Address, Bank account, More info): dashed edge now a 40% mix of the secondary text colour over the surface, white fill and main text colour, so they stay visible against the lighter field border. Active, done and error states unchanged.
- **Control heights**: all modal controls (phone, date picker, address line, state, country, ng-select triggers, category dropdown) raised from 34px to the 40px compact height the shared text input renders, so Email and Phone match. Phone wrapper radius 8px to match; Phone label "Phone (optional)" styled like Email.
- **Send a secure link**: note copy is now "Fill in an email address, a mobile number, or both — we’ll send the link wherever you choose." (was "Enter an email, a mobile number, or both. The link goes to every channel you fill in."). Hint restyled as a brand-tinted note with an info icon, 12px from the header and the Email field (was 16px and 28px). "Back to manual entry" restyled as an outline pill; gap below it 12px (was 24px).
  - Files: `src/app/modules/payee/payee-v4/modals/add-payee-modal-v4/add-payee-modal-v4.component.html`, `.ts`, `.scss`

### Docs

- `add-payee-modal-states.html`: standalone HTML of the Add Payee modal in ten states (default, Individual, Business, Save with gaps, Address panel, address done/required chip, Bank account panel, More info panel, Send a secure link filled and empty) with a light/dark toggle and Vendor/Customer/Employee labels, for hand-off on its own. Copy in Downloads as `ZilMoney-AddPayee-modal-states.html`.
- `add-customer-modal-states.pdf`: the Add customer modal in five states (Individual, Business, Address panel, Bank account panel, More info panel), one per A4 page with a cover, rendered from the HTML above in print mode (`?print=1&type=customer&states=2,3,5,7,8`) with headless Chrome. Copy in Downloads as `ZilMoney-AddCustomer-modal-states.pdf`.
- `v4-ui-reference.md` and `.html`: token table, open item 4.5 and new section 4.6 updated for the field border; this change log entry added. The `.docx` and knowledge-base PDF were not regenerated.

## 13/10/2026

Branch: `design/zilmoney-rebrand` (main copy, port 4200). Every change was also synced to the `design/zilmoney-rebrand-old-colors` (4201) and `design/zilmoney-rebrand-teal` (4202) worktrees with `tools/sync-from-main.mjs`.

### Dashboard

- **Bulk Payment Center**
  - Replaced the hard-coded indigo `#3746a7` on the three info tiles and the three secondary buttons with a 15% white tint over the card colour.
  - "Coming Soon" badge moved from hard-coded yellow hex values to the warning badge tokens.
  - Later the same day the "Coming Soon" badge was restyled to match the card: a translucent white pill (15% white fill, 30% white border, 11px white text, rounded-full) instead of the yellow warning chip, which stood out on the navy surface in both themes.
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
- `docs/design-system/v4-ui-reference.html` gained a "5. Style samples" section: ten live-rendered examples (primary, outline and destructive buttons, compact and action buttons, buttons on a brand surface, form field states, dropdown with add-new tile and rows, status badges, choice pills and optional-detail chips, inline banners, modal shell with empty state). The Word and Markdown copies are unchanged.
- New `docs/design-system/ZilMoney-v4-UI-Knowledge-Base.pdf` (22 pages): a phase-by-phase knowledge base in the company's 16-phase format, covering the whole programme from 2 to 13 October. Rendered from HTML with headless Chrome.
- Pushed to the design-snapshot repo `ajanya-dev/Ajanya-v2--changes-web` (`main`): snapshot 4 (all code changes), 4.1 (PDF and reference copies), 4.2 (style samples), 4.3 (full-programme knowledge base), 4.4 (this change log). The snapshot holds every file that differs from the Bitbucket `staging` branch.

### Open items noted, not changed

- 78 of 110 modal headers still use `bg-v4-secondary-background-color`; no shared modal shell component exists.
- Dropdown height tiers exist in two systems (global 44/40 vs mixin 32/38/48/54).
- 40 hand-rolled primary `<button>` elements across 24 v4 files.
- `app-control-message-v4` uses a FontAwesome icon; repo rule is Lucide only.
- `app-common-input-v4` applies a legacy red border class whenever a field is empty (visually overridden).
- White text on the teal secondary brand measures about 3:1 on banner CTAs, below the 4.5:1 text target.

## 10/10/2026

Branch: `design/zilmoney-rebrand` (main copy, port 4200), synced to 4201 and 4202. Written up on 15/10/2026 from the session's edit scripts, the Verification Center source and the review notes of the day.

### Verification Center

- **Compliance cases get a severity, and a calm tone.** The action-required panel built on 9 October showed every open case (enhanced due diligence, re-verification, missing details) as a red "Action needed on your account" state. On review the user rejected it: re-verification and missing details are requests the customer can do when convenient, not mandatory. Cases now carry `severity: 'info' | 'warning'`. Info cases render as a neutral brand-tinted strip with an outline button; the step cards stay Done and the headline stays "fully set up". Only EDD (`eddRequestData`, which has a deadline and pauses payments) is `warning`: it reopens the business step with an amber badge, a days-left pill and the amber surface. The unused red tokens on the panel were dropped.
- **Step card: action-required renders as Done, only the badge differs.** Icon tile back to the Done styling; the status pill is the one element that changes ("Action needed", amber, alert icon). Unlock chip keeps its calm Done styling while the step is reopened. The eyebrow label is uppercase.
- **Documents listed up front.** `RERUN_KYB_DOCS` and `EDD_DOCS` constants list what each case will ask for, so the panel can say "have these ready" before the modal opens.
  - Files: `src/app/modules/verification-center-v4/verification-center-v4.component.html`, `.ts`, `components/verification-action-required/*` (new), `components/current-step-focus/*`, `constants/verification-v4.constants.ts`, `data/verification-v4.data.ts`, `models/verification-v4.model.ts`

### Theme tokens

- **Success family moved to emerald** app-wide, in both themes: text `#047857`, surface `#ecfdf5`, bold surface `#d1fae5`, borders `#6ee7b7` / `#a7f3d0`, badge `#047857` on `#d1fae5` (light); `#34d399` text and emerald-900 tinted surfaces (dark). Replaces the Tailwind green family so success reads calmer beside the navy.
  - Files: `src/assets/style_varients/_v4-light-theme.scss`, `_v4-dark-theme.scss`

### Bank accounts, Account card

- **Pencil beside the name** edits the account details and nothing else; the top-right button cluster is gone.
- **Balance and Nickname are labelled grid items** (Balance first, then Nickname), so the subtitle line is free. The second and third information tiers became one aligned definition grid.
  - Files: `src/app/modules/bank/bank-v4/v4-components/bank-details-v4/bank-details-v4.component.html`, `.ts`

## 09/10/2026

Branch: `design/zilmoney-rebrand` (main copy, port 4200), synced to 4201 and 4202. Pushed as design snapshot 3 ("WCAG 2.2 AA (V2), bank account card, Info tab merge"). Written up on 15/10/2026 from the spec and plan under `docs/superpowers`, the sweep scripts and the diff.

### Accessibility: WCAG 2.2 AA, app-wide (V2 / v4 layout only)

The user pasted a compliance requirement (DOJ contrast guidance, FTC dark-pattern guidance) and made WCAG 2.2 AA the bar for the whole web app: text 4.5:1, needed icons and control boundaries 3:1, no status by colour alone, and fees, warnings, consent and payment terms never fainter than body text. Approach A was agreed: fix tokens first, then sweep components. Spec: `docs/superpowers/specs/2026-10-09-wcag-aa-contrast-compliance-design.md`. Plan: `docs/superpowers/plans/2026-10-09-wcag-aa-contrast-compliance.md`. Baseline audit on 4200: light 18/26 token pairs passing, dark 19/26.

- **Light tokens**: `$v4-common-green-color` `#08b160` → `#047857` (5.48:1), `$v4-common-yellow-color` `#fa9c10` → `#b45309` (5.02:1), `$v4-common-red-color` `#fb5f5f` → `#dc2626` (4.83:1), `$v4-badge-error-text-color` `#eb2e2e` → `#b91c1c` (5.31:1 on the chip), `$v4-badge-sky-text-color` `#0595e5` → `#0369a1` (5.17:1), `$v4-favorite-star-color` `#f5b301` → `#b98900` (3.16:1 boundary), `$v4-input-border-color` `#bfd2de` → `#7c8fa3` (3.33:1 on white, 3.08:1 on the page). Palette `$zm-control-border` matched; the teal worktree's own field border moved to `#6a8f8c`. Insight-card reds matched.
- **Dark tokens**: green `#099753` → `#34d399` (7.63:1 on the card), red `#eb2e2e` → `#f87171` (5.30:1), badge error and sky text as in light (chips stay light in dark), insight-card reds `#f87171`. The dark primary `#1d6aa5` stays as a fill; as text it switches to the bold token `#8ec5ec` (7.93:1) through a global rule, except on white tiles and while a hover colour applies.
- **Fills under white text** in dark mode keep the AA-safe light shades (`#047857`, `#dc2626`) so white stays at least 4.5:1.
- **Keyboard focus ring**: every button, link, tab, menu item and tabbable control inside the v4 layout (and its modals) shows a 2px bold-brand outline with 2px offset on `:focus-visible`. Classic screens untouched.
- **Status dots named**: the verified / not verified / pending / failed dots on the bank list and the coloured dots in the bank cards carry `role="img"`, an `aria-label` and a tooltip, or are hidden from assistive tech when a word sits beside them. 31 such edits.
- **Icon-only buttons named**: 263 `aria-label`s added across the v4 header, sidebar (expand/collapse state announced), data table toolbar and pager, detail side panel, list headers, bank, bill, check, document mail, mailing dashboard, cash expense, cards, payment links, payroll, user management, integrations, wallet and support modals. Shared `app-common-button-v4` gained an `ariaLabel` input that falls back to the tooltip when the button has no text, with a spec.
- **Primary buttons with a forced teal label** lost that override so their white text shows (for example "Sync payroll data" in the integration settings).
- **Faint financial and consent copy** raised to body weight and size: 25 hits across the ACH authorisation form, check mail modal, verify card modal (agreement text), payment details ("First Class, No Charge"), bulk payment fees, Shopify domain modal, invoice credit tooltip, wallet fund and withdraw fees, and the Rain terms modal.
- **Hard-coded hex colours** in v4 templates (29 found) replaced with tokens where they carried meaning; the favourite-star `#fdc700` and star `#00c950` in the sidebar became tokens.
- **Regression guard**: new `tools/contrast-check.mjs` (Node, no dependencies) reads the two theme files and the palette preview, resolves every audited pair, prints ratio / required / pass and exits 1 on failure.
  - Files: `src/assets/style_varients/_v4-light-theme.scss`, `_v4-dark-theme.scss`, `_v4-theme.scss`, `_overrides-v4.scss`, `_zm-palette-preview.scss`, `tailwind.config.js`, `src/app/shared/V4/buttons/common-button-v4/*`, `tools/contrast-check.mjs`, plus about 150 v4 templates (see snapshot 3)

### Bank accounts, Account card redesign

- **Info merged into Account.** The detail panel's Info tab (check printing and holder details: next check number, fractional, transit and institution numbers, phone, email, holder address) now sits on the Account tab; the tab list is Account and Audit Trail. Designed as a mockup on 8 October (`info-tab.html`, `account-card.html`, `account-card-v2.html`), built on 9 October.
- **Copy buttons** on the account and routing numbers in the meta line, with the icon turning into a tick for 1.5 seconds. Holder address joins its parts on one line, skipping empty ones.
  - Files: `src/app/modules/bank/bank-v4/v4-components/bank-details-v4/bank-details-v4.component.html` (about 1,100 lines changed), `.ts`

### Verification Center

- **Action-required panel** (first version). A new `app-verification-action-required` component lists every open compliance case with why it is needed, what to have ready and one button that opens the same flow the header badge opens. New `action-required` step status and `VerificationActionCase` model. Toned down the next day (see 10/10/2026).

## 07/10/2026

Branch: `design/zilmoney-rebrand`, commit `c2fd8f7d` "compact bank verification modal, favorites only via +, Send Payment dropdown polish" (126 files). Synced to 4201 and 4202.

### Modals

- **Verify Your Bank Account modal compacted**: icon-and-text intro row, 24px padding, 12px button gap, the boxed "Recommended" panel replaced by a one-line hint; the same trim on its success, error, pending and empty states.
- **Compact dialog rhythm rule** added to the shared `modal_common.scss` so every v4 dialog shares the same header, body and footer spacing.

### Header

- **Standalone Favourites star removed.** The user asked to "only stay with the plus": favourites live inside the "+" quick-actions panel (its All actions / Favourites switch); pinned favourite chips still render right after "+". `toggleFavorites()` deleted.
  - Files: `src/app/layout/v4-layout/header-v4/header-v4.component.html`, `favorites-drawer-v4/*`

### Send Payment dropdowns

- Bank account, cards and wallet dropdown refinements: a tick icon (18px) for verified, a short "ACH" chip, favourite stars. Rule recorded: never the word "Verified" as a badge, never "Verified" and "ACH verified" side by side (see 05/10/2026).

### Tooling

- `tools/zm-primary-sweep.mjs`: re-sweeps primary-coloured literals after a primary change.

## 06/10/2026

Branch: `design/zilmoney-rebrand`. Pushed as design snapshot 1 (12:44) and snapshot 2 (23:38) to the design-snapshot repo. Written up on 15/10/2026 from the snapshot messages and the session notes.

### Palette

- **Main copy moved to the navy primary `#004a7c`** with the light-blue page background `#f2f7fb` (hover `#003a62`-range, dark fill `#1d6aa5`). Comparison worktrees created so palettes can be judged on identical screens: `angular-web-old-colors` (port 4201, branch `design/zilmoney-rebrand-old-colors`, the pre-rebrand indigo `#20319d` / hover `#182577` on the pink-tinted `#f9f4ff` page) and `angular-web-theme-teal` (port 4202, branch `design/zilmoney-rebrand-teal`, calm teal `#0f766e` / hover `#115e59` on warm off-white `#f7f7f5` with a teal-tinted field border `#c3dddb`), the latter proposed from a competitor scan (Mercury, Brex, Ramp all sit one restrained accent on a near-neutral canvas). Both share `node_modules` by junction.
- **Rule**: every UI change is made in the main copy, then `node tools/sync-from-main.mjs` in each worktree copies every changed file and re-runs that copy's colour swap (`zm-indigo-restore.mjs`, `zm-teal-restore.mjs`), so the three differ only in colour.

### Snapshot 1 (morning): Send Payment fields, payee and card modals, header, sidebar, Verification Center, section hub cards, light-blue page background.

### Snapshot 2 (evening)

- **Modals app-wide**: compact dialog rhythm and unified field labels.
- **Bank accounts**: Edit Bank Account modal regrouped into sections; detail panel gained Account and Info tabs.
- **Section hub pages**: section-page cards and banner rebalanced; CTA banner on the primary colour.
- **Dashboard**: wallet and upcoming-payment cards.
- **Send Payment**: first-view compaction; one-line account rows.
- **Fields**: softer field strokes (`#bfd2de`, 25% primary on white). Reverted to a 3:1 value on 9 October, then set to `#d1d5db` by decision on 14 October.

## 05/10/2026

Branch: `design/zilmoney-rebrand` (working changes, committed on 07/10/2026). Written up on 15/10/2026 from the review notes.

### Send Payment, "Select a bank account" dropdown

- **Verified is a tick, not a word.** The user, noting they had said it many times, asked that verified status be drawn as a tick icon only (18px, slightly larger than the text, with "Verified" as tooltip and accessible name), never the word "Verified" as a badge, and never "Verified" next to "ACH verified". ACH-enabled accounts get a short "ACH" chip with no "verified" in it. Applied to the bank, card and wallet rows.
  - Files: `src/app/modules/payments-v4/send-receive-page/components/payments-section/send/dropdowns/sp-bank-ac-dropdown/*`, `sp-wallet-dropdown/*`, card dropdown

## 03/10/2026

Branch: `design/zilmoney-rebrand`, nine commits (`7d81ee4a` to `bbcfb58b`). Written up on 15/10/2026 from the commit messages.

### Palette exploration

- **Deep teal preview** (`7d81ee4a`): the `#145e68` palette from the "Zil Money web-app colour recommendation" PDF applied in light mode to the sidebar, header, dashboard and Send Payment through `_zm-palette-preview.scss`, as a revertable commit. A follow-up (`854af4f5`) fixed an invalid sidebar selector that blocked the rebuild.
- **Slate `#415a80` as the app-wide primary** (`c4997a28`, 50 files): buttons, links, focus and selection. Light fill `#415a80` (white 7.0:1), hover `#344866`; dark fill `#4f6b96` (white 5.4:1, 3:1 against the surface), dark text `#a9bbd6`. Cerulean literals swept by `tools/zm-slate-sweep.mjs`. Chosen after Cerulean, the OCW green and the `#145e68` teal were tried.

### Bank accounts

- **Compact "All Bank Accounts" summary strip** (`00db5143`): the stat boxes and full-width buttons (about 280px tall) became one row of about 64px so the transactions table sits higher.
- **Transactions heading in the toolbar row** (`798078a7`): the shared `v4-data-table` gained an optional `toolbarLeftTemplate` slot (left of the toolbar when idle); `common-layout-v4` gained an opt-in `compactSpacing` (gap-3 instead of gap-6); the bank transactions page uses both and keeps the toolbar on the empty state.

### Sidebar

- **Solid primary fill restored** for the selected item (`1fab1039`).

### Header

- **"+" quick-actions launcher** (`59ff1636`, 16 files): launcher icon changed from a star to a plus ("create new" is the familiar meaning); pinned favourites follow it. New `--v4-favorite-star-color` (gold) used by every favourite and default star. "Pin to header" became "Pin to the top bar (next to +)" with an explainer line. Per-tile descriptions in plain English as tooltips, also matched by search.
- **Gold Favourites button next to "+"** (`bbcfb58b`): a star button that opened the quick-actions panel on a Favourites view; the panel gained an All actions / Favourites pill switch and an empty state. Removed again on 07/10/2026.

### Send Payment

- **Taller dropdown triggers**: `sp-dropdown-shell` trigger 44px → 50px (`bbcfb58b`). Later 49px, then 44px on 14/10/2026.

## 02/10/2026

Branch: `design/zilmoney-rebrand` created from `staging`; eight commits (`2a9a8030` to `5926843a`). Spec: `docs/superpowers/specs/2026-10-02-zilmoney-rebrand-design.md`. Written up on 15/10/2026 from the spec and the commit messages.

### Brand tokens and baseline (approach A: tokens first)

- **Design spec** (`2a9a8030`): goal, brand inputs from the ZILMONEY guide (Cerulean `#007fa5` action, Slate `#415a80` structure, Teal `#00a5b2` decorative only, light background `#eaf4f7`; neon green, violet and the `#20319d` navy retired), Inter for everything, 8px radius, contrast-verified text tokens, and a sizing standard measured live against nine competitors (Bill.com, Melio, Mercury, Brex, QuickBooks, Stripe, Relay, Checkbook.io and the current OCW): **44px form tier, 40px dense tier, 32px in-table tier**, labels always visible at 14px/500, 2px focus ring, 12px text floor.
- **Brand tokens** (`3a52ac91`, 8 files): Zil Money brand colours, Inter, 8px radius (`--ui-radius: 0.5rem`), AA text greys (secondary `#374151`, tertiary `#4b5563`, subtle and placeholder `#6b7280`), white input background, brand-tinted page background. Legacy blue `#318ffd` / `#0d70e3` → Cerulean in the v3.5 and Material themes.
- **Input and button sizing tiers** (`c2e8edbb`, 6 files): the 44/40/32 tiers in `common-input-field-v4` and the ng-select overrides, white-on-brand button text, the focus ring, AA placeholders; the neon button variant became Teal with dark ink.
- **Scripted sweep** (`df98ecf0`, 389 files, `tools/zm-rebrand-sweep.mjs`): legacy brand hexes (`#20319d`, `#3bf493`, `#5385f4`, `#075ffe`, `#318ffd`, `#0d70e3`, `#0eaf89`), low-contrast greys (`#9ca3af`, `#999`, `#b0b0b0`, `#c4c4c4`) and `text-[9|10|11px]` → tokens and `text-[12px]`. Check, email and print templates excluded.
- **Font sweep** (`27a216dc`, 70 files, `tools/zm-font-sweep.mjs`): legacy font variables and literal `font-family` values → Inter; Slate hero on the v4 login page.

### Send Payment

- **Bank account dropdown decluttered** (`c3aa8347`): status pills replaced by a verified icon and an amber Verify link that opens the existing verification modals; ACH moved into the detail line; the star shows only for the default account or on hover; add-account moved to a one-line footer.
- **100% zoom tried and reverted** (`edefdf08`, `5926843a`): the page's `zoom: 0.85` was removed so text renders at true size and the account was masked in the trigger; the user found it "bulky", so the 0.85 zoom was restored the same evening. Rule recorded: declutter first, propose size increases only as an optional step.
