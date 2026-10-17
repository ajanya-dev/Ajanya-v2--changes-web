# Help Center redesign (Help / Tutorial) — design note

## Intent

The question-mark menu in the v4 app has a "Help / Tutorial" item. It opens
`https://support.onlinecheckwriter.com/portal/en/kb/online-check-writer-llc`,
a Zoho Desk help centre on Zoho's default theme with the old mint-green
branding. It was never touched by the rebrand and looks like a different
product. The user wants the whole help centre (home, every topic, every
article) to look modern and belong to the v4 app, using the logo teal as the
primary, with the existing header kept as it is.

## Where the pages live

The help centre is not in this repo. It is hosted by Zoho Desk and themed
through Help Center → Customize → Themes (custom HTML/CSS). This work
produces a complete static prototype that the Zoho theme can be built from.

- Source: `docs/design-system/help-center/` — `data.mjs` (content model),
  `build.mjs` (generator), `theme.css`, `checkwriter-logo.svg`.
- Build: `node docs/design-system/help-center/build.mjs` writes the site to
  `src/assets/help-center/` (served by `ng serve` at `/assets/help-center/`)
  and to `docs/design-system/help-center/site/` (hand-off copy).
- Dev wiring: `onHelpTutorial()` in `header-v4.component.ts` and
  `v4-help-button.component.ts` opens `/assets/help-center/index.html` when
  `isDevMode()` is true, so the dashboard's ? → Help / Tutorial shows the
  prototype on port 4200. Production keeps the Zoho portal URL.

## Goals

- Home, 32 topic pages and 325 article pages that read as the v4 app: Inter,
  white cards on `#f2f7fb`, 12–16px radii, `#e5e7eb` borders, v4 text greys.
- Header kept as the live portal has it: CheckWriter logo (powered by Zil
  Money), "OnlineCheckWriter" wordmark, right-aligned Home · My Area ·
  Knowledge Base · Community · Sign In, accessibility button. Only the styling
  follows the new theme.
- Primary colour from the Zil Money logo teal `#00A5B2` (user decision,
  17 Oct 2026).
- Every link resolves: topics, articles, popular searches, My Area,
  Community, Sign In, live chat, email, phone, YouTube, terms, privacy, API
  docs, back to app. Verified by a link check over the generated site.
- Working search: a client-side index of all article titles with inline
  results on the home page, and in-topic filtering on topic pages.
- WCAG 2.2 AA: text ≥ 4.5:1, UI boundaries ≥ 3:1, keyboard focus visible,
  skip link, labelled icon buttons, no colour-only status.

## Non-goals

- Changing the Zoho configuration or production app behaviour.
- Dark mode for the help centre (Zoho theme has no toggle today).
- Writing the article bodies. Only "How to enable webhook in sandbox?" has a
  real body; every other article shows a generic body marked "Sample body".

## Colour decisions (my calls, contrast-checked)

| Role | Hex | Ratio on white |
|---|---|---|
| Logo / accent teal (graphics, large fills, decorative) | `#00A5B2` | 2.99:1 (never for text) |
| Primary: buttons, links, active nav, focus ring | `#00747E` | 5.53:1 |
| Primary hover | `#006670` | 6.70:1 |
| Tint: icon tiles, hero band, selected rows | `#E6F6F7` | teal text on it 4.97:1 |
| Tint bold: chips, hover | `#CCEDF0` | teal text on it 4.46:1 (large/bold only) |

## Content

Topic names, slugs and article titles were read from the live portal on
17 Oct 2026. Where a live section exposes no titles (the 16 Third Party
Application integrations, three Business Tools sections) the single article
is marked `sample: true` and carries a "Sample title" chip. "For OCW
Employees" renders a staff-only empty state; "Help videos" links to the
YouTube channel.

## Pages

1. **Home**: header, two-column hero: left-aligned headline, search and
   common-question chips beside a deep-teal "Most opened this week" panel
   (`#0b3c44` with a logo-teal glow) listing five real articles; one
   quick-link strip with dividers (not four cards); six featured topics
   (Getting Started, Bank Account, Check, ACH, Pay By Credit Card, API);
   chip list of all 32 topics with counts; contact band; footer. No
   all-caps eyebrow, no middle-dot meta strings.
2. **Topic**: breadcrumb, sticky topic rail with counts, in-topic search,
   section tabs and grouped lists where the topic has sections, article rows.
3. **Article**: breadcrumb, topic and section badges, title, body, "Was this
   helpful?", previous/next within the topic, right rail with "On this page",
   "More in {topic}", Copy link and Ask support.
4. **Portal pages in the same template** so no header or action leaves the
   theme: **My Area** (stats, ticket list with status chips, filter),
   **Submit a ticket** (form with topic, urgency, description, attachments,
   plus "might answer it faster" articles), **Community** (categories rail,
   discussion list with Answered badges), **Sign in** (card with email,
   password, Google). Tickets and threads are sample data. Only YouTube, the
   chat widget, email, phone, terms, privacy and API docs stay external.
5. Responsive: single column under 960px, topic rail becomes a chip row,
   header collapses to logo, accessibility button and a working menu toggle
   under 900px.

## Left to the builder (Zoho theme)

- Map `theme.css` variables onto Zoho's theme CSS; upload the logo asset.
- Replace the client-side search with Zoho's `kb` search; counts come from
  Zoho.
- Replace generic article bodies with the Zoho article content.
