// Generates the Help Center prototype from data.mjs.
// Usage: node docs/design-system/help-center/build.mjs [repoRoot]
// Writes to src/assets/help-center (served by `ng serve` at /assets/help-center/)
// and to docs/design-system/help-center/site (hand-off copy).
import { mkdirSync, writeFileSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOPICS, FEATURED, POPULAR, LINKS } from './data.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = process.argv[2] ?? join(here, '../../..');
const OUT_DIRS = [join(root, 'src/assets/help-center'), join(here, 'site')];

/* ---------- model ---------- */
const slugify = (s) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const seen = new Map();
const ARTICLES = [];
for (const t of TOPICS) {
  t.items = [];
  const groups = t.sections ? t.sections.map((s) => ({ section: s.name, articles: s.articles, sample: !!s.sample })) : [{ section: null, articles: t.articles || [], sample: false }];
  for (const g of groups) {
    for (const title of g.articles) {
      let slug = slugify(title) || 'article';
      const n = (seen.get(slug) || 0) + 1; seen.set(slug, n);
      if (n > 1) slug = `${slug}-${n}`;
      const a = { title, slug, topic: t, section: g.section, sample: g.sample };
      t.items.push(a); ARTICLES.push(a);
    }
  }
  t.count = t.items.length;
}
const TOTAL = ARTICLES.length;
const byTitle = (title) => ARTICLES.find((a) => a.title === title);
const topicUrl = (t, base) => `${base}topics/${t.slug}.html`;
const articleUrl = (a, base) => `${base}articles/${a.slug}.html`;

/* ---------- icons ---------- */
const ICONS = {
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  chev: '<polyline points="9 18 15 12 9 6"/>',
  'chev-l': '<polyline points="15 18 9 12 15 6"/>',
  arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/>',
  bank: '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  check: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="6" y1="10" x2="11" y2="10"/><line x1="6" y1="14" x2="14" y2="14"/><line x1="17" y1="14" x2="18" y2="14"/>',
  wallet: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 14h4"/><path d="M4 7V5a2 2 0 0 1 2-2h12"/>',
  card: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  play: '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  trending: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 0 1-12 0V8z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>',
  mailbox: '<path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5A5.5 5.5 0 0 1 7.5 4h9A5.5 5.5 0 0 1 22 9.5z"/><polyline points="15 9 18 9 18 11"/><path d="M2 9.5h11"/><path d="M13 4v15"/>',
  draft: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/>',
  tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  tools: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  chrome: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
  warn: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  up: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
  down: '<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  menu: '<line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>',
  access: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="7.5" r="1.25" fill="currentColor" stroke="none"/><path d="M7 10.5c2 .6 3.3.8 5 .8s3-.2 5-.8"/><path d="M12 11.3v3.2l-2 4.2"/><path d="M12 14.5l2 4.2"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
};
const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('')}</svg>`;
const ic = (name, cls = '') => `<svg class="i ${cls}"><use href="#i-${name}"/></svg>`;

/* ---------- shared chrome ---------- */
function header(base, current) {
  const item = (label, href, key, ext = false) =>
    `<a href="${href}"${current === key ? ' aria-current="page"' : ''}${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
  return `<header class="hc-header" id="hc-header">
  <div class="container">
    <a class="brand" href="${base}index.html" aria-label="OnlineCheckWriter Knowledge Base home">
      <img src="${base}checkwriter-logo.svg" alt="OnlineCheckWriter, powered by Zil Money">
      <span class="name">OnlineCheckWriter</span>
    </a>
    <nav class="hc-nav right" aria-label="Primary">
      ${item('Home', `${base}index.html`, 'home')}
      ${item('My Area', `${base}my-area.html`, 'myarea')}
      ${item('Knowledge Base', `${base}index.html`, 'kb')}
      ${item('Community', `${base}community.html`, 'community')}
      ${item('Sign In', `${base}sign-in.html`, 'signin')}
    </nav>
    <button class="icon-btn access-btn" type="button" aria-label="Accessibility options" title="Accessibility options">${ic('access')}</button>
    <button class="icon-btn menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="hc-header">${ic('menu')}</button>
  </div>
</header>`;
}

function footer(base) {
  return `<footer class="hc-footer">
  <div class="container">
    <div>© 2026 Zil Money Corporation. OnlineCheckWriter is a Zil Money product.</div>
    <nav aria-label="Footer">
      <a href="${LINKS.terms}" target="_blank" rel="noopener">Terms of use</a>
      <a href="${LINKS.privacy}" target="_blank" rel="noopener">Privacy</a>
      <a href="${LINKS.apiDocs}" target="_blank" rel="noopener">Developer docs</a>
      <a href="${base}community.html">Community</a>
      <a href="${base}submit-ticket.html">Submit a ticket</a>
      <a href="${base}index.html#contact">Contact support</a>
      <a href="${LINKS.app}">Back to app</a>
    </nav>
  </div>
</footer>`;
}

function page({ title, base, body, current, desc = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · OnlineCheckWriter Knowledge Base</title>
${desc ? `<meta name="description" content="${esc(desc)}">` : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${base}theme.css">
</head>
<body data-base="${base}">
<a class="skip-link" href="#main">Skip to content</a>
${sprite}
${header(base, current)}
${body}
${footer(base)}
<script src="${base}search-index.js" defer></script>
<script src="${base}hc.js" defer></script>
</body>
</html>
`;
}

const crumbs = (base, parts) => `<nav class="crumbs" aria-label="Breadcrumb">
  <a href="${base}index.html">${ic('home')}<span class="sr-only">Home</span></a>
  ${parts.map((p, i) => `${ic('chev')}${i === parts.length - 1 ? `<span aria-current="page">${esc(p.label)}</span>` : `<a href="${p.href}">${esc(p.label)}</a>`}`).join('\n  ')}
</nav>`;

const searchBox = (base, { id = 'q', placeholder, big = true, scope = '' }) => `<form class="search${big ? '' : ' compact'}" role="search" action="${base}index.html" data-scope="${scope}" autocomplete="off">
  ${ic('search')}
  <label class="sr-only" for="${id}">${esc(placeholder)}</label>
  <input id="${id}" name="q" type="search" placeholder="${esc(placeholder)}">
  ${big ? '<kbd>/</kbd><button class="btn btn-primary" type="submit">Search</button>' : ''}
  <div class="search-results" role="listbox" aria-label="Search results" hidden></div>
</form>`;

const rail = (base, activeSlug) => `<aside class="rail" aria-label="Topics">
  <p class="rail-title">Topics</p>
  <ul>
    ${TOPICS.map((t) => `<li><a href="${topicUrl(t, base)}"${t.slug === activeSlug ? ' aria-current="page"' : ''}>${esc(t.name)} <span class="n">${t.count}</span></a></li>`).join('\n    ')}
  </ul>
</aside>`;

/* ---------- home ---------- */
function homePage() {
  const base = '';
  const featured = FEATURED.map((s) => TOPICS.find((t) => t.slug === s));
  const popular = POPULAR.map(([label, title]) => { const a = byTitle(title); if (!a) throw new Error(`popular search not found: ${title}`); return `<a class="chip" href="${articleUrl(a, base)}">${esc(label)}</a>`; }).join('\n        ');
  const topicCard = (t) => `<article class="card topic">
          <div class="topic-head">
            <span class="ic">${ic(t.icon)}</span>
            <div><h3><a href="${topicUrl(t, base)}">${esc(t.name)}</a></h3><div class="count">${t.count} article${t.count === 1 ? '' : 's'}${t.sections ? ` in ${t.sections.length} section${t.sections.length === 1 ? '' : 's'}` : ''}</div></div>
          </div>
          <ul>
            ${t.items.slice(0, 5).map((a) => `<li><a href="${articleUrl(a, base)}">${ic('doc', 'sm')}${esc(a.title)}</a></li>`).join('\n            ')}
          </ul>
          <a class="more" href="${topicUrl(t, base)}">View all ${t.count} articles ${ic('arrow', 'sm')}</a>
        </article>`;
  const mostOpened = [
    'How to add a bank account?',
    'How to print my first check?',
    'How to make a credit card payment?',
    'How long does it take for ACH payments to complete?',
    'How can I get my API keys?',
  ].map((title) => { const a = byTitle(title); if (!a) throw new Error(`most opened not found: ${title}`); return a; });
  const body = `<main id="main">
  <section class="hero" aria-labelledby="hero-title">
    <div class="container hero-grid">
      <div class="hero-copy">
        <h1 id="hero-title">Everything about checks, payments and your account, answered.</h1>
        <p class="lead">Search ${TOTAL} articles written by the support team, or start from a topic below.</p>
        ${searchBox(base, { placeholder: 'Search, for example “add a bank account”' })}
        <div class="popular">
          <span>Common questions</span>
          ${popular}
        </div>
      </div>
      <aside class="asked" aria-labelledby="asked-title">
        <h2 id="asked-title">Most opened this week</h2>
        <ol>
          ${mostOpened.map((a) => `<li><a href="${articleUrl(a, base)}"><span class="t">${esc(a.title)}</span><span class="c">${esc(a.topic.name)}</span>${ic('arrow', 'sm')}</a></li>`).join('\n          ')}
        </ol>
        <p class="asked-foot">${TOTAL} articles in ${TOPICS.length} topics, kept current by the people who answer your tickets.</p>
      </aside>
    </div>
  </section>

  <section class="section" aria-label="Quick links">
    <div class="container">
      <div class="quick">
        <a href="topics/getting-started.html">
          <span class="ic">${ic('zap')}</span>
          <span><span class="t">Getting started</span><span class="d">Sign up, set up and make a first payment</span></span>
        </a>
        <a href="${LINKS.youtube}" target="_blank" rel="noopener">
          <span class="ic">${ic('play')}</span>
          <span><span class="t">Video tutorials</span><span class="d">Short walkthroughs on YouTube</span></span>
        </a>
        <a href="topics/api.html">
          <span class="ic">${ic('code')}</span>
          <span><span class="t">API and developers</span><span class="d">Keys, webhooks and mailing through the API</span></span>
        </a>
        <a href="#contact">
          <span class="ic">${ic('chat')}</span>
          <span><span class="t">Contact support</span><span class="d">Chat, email or call us</span></span>
        </a>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="topics-title">
    <div class="container">
      <div class="section-head">
        <div>
          <h2 id="topics-title">Browse by topic</h2>
          <p>Start with the topics people open most. All ${TOPICS.length} are listed further down.</p>
        </div>
        <a class="link" href="#all-topics">All topics ${ic('arrow', 'sm')}</a>
      </div>
      <div class="grid grid-3">
        ${featured.map(topicCard).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="all-title" id="all-topics">
    <div class="container">
      <div class="section-head">
        <div>
          <h2 id="all-title">All topics</h2>
          <p>${TOPICS.length} topics in the order they appear in the knowledge base.</p>
        </div>
      </div>
      <div class="all-topics">
        ${TOPICS.map((t) => `<a class="chip" href="${topicUrl(t, base)}">${esc(t.name)} <span class="n">${t.count}</span></a>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="contact-title" id="contact">
    <div class="container">
      <div class="card contact">
        <div class="contact-intro">
          <h2 id="contact-title">Still need help?</h2>
          <p>Pick the way that suits you. A person from the support team answers every ticket, chat and call.</p>
          <p class="hours"><span class="status-dot" aria-hidden="true"></span>Open now. Monday to Friday, 8 am to 6 pm Pacific.</p>
        </div>
        <div class="contact-opts">
          <a class="contact-opt" href="submit-ticket.html">
            <span class="ic">${ic('inbox')}</span>
            <span class="txt"><span class="t">Submit a ticket</span><span class="d">Reply by email, tracked in My Area</span></span>
            ${ic('chev', 'chev')}
          </a>
          <a class="contact-opt" href="${LINKS.liveChat}" target="_blank" rel="noopener">
            <span class="ic">${ic('chat')}</span>
            <span class="txt"><span class="t">Live chat</span><span class="d">Usually answered in a few minutes</span></span>
            ${ic('external', 'chev')}
          </a>
          <a class="contact-opt" href="mailto:${LINKS.email}">
            <span class="ic">${ic('mail')}</span>
            <span class="txt"><span class="t">Email us</span><span class="d">${LINKS.email}</span></span>
            ${ic('chev', 'chev')}
          </a>
          <a class="contact-opt" href="${LINKS.phoneHref}">
            <span class="ic">${ic('phone')}</span>
            <span class="txt"><span class="t">Call us</span><span class="d">${LINKS.phone}</span></span>
            ${ic('chev', 'chev')}
          </a>
        </div>
      </div>
    </div>
  </section>
</main>`;
  return page({ title: 'Help Center', base, body, current: 'kb', desc: 'OnlineCheckWriter knowledge base: checks, bank accounts, ACH, wire, payroll, API and more.' });
}

/* ---------- topic ---------- */
function topicPage(t) {
  const base = '../';
  const row = (a) => `<li><a class="row" href="${articleUrl(a, base)}" data-title="${esc(a.title.toLowerCase())}">
            <span class="ic">${ic('doc')}</span>
            <span><span class="t">${esc(a.title)}</span>${a.sample ? '<span class="m"><span class="badge badge-neutral">Sample title</span></span>' : ''}</span>
            ${ic('chev', 'chev')}
          </a></li>`;
  let list;
  if (t.restricted) {
    list = `<div class="card empty">
        <span class="ic">${ic('lock')}</span>
        <h2>Staff only</h2>
        <p>${esc(t.desc)}</p>
        <a class="btn btn-primary" href="${base}sign-in.html">Sign in</a>
      </div>`;
  } else if (t.videos) {
    list = `<div class="card empty">
        <span class="ic">${ic('play')}</span>
        <h2>Watch on YouTube</h2>
        <p>Our help videos live on the OnlineCheckWriter channel, grouped by product.</p>
        <a class="btn btn-primary" href="${LINKS.youtube}" target="_blank" rel="noopener">Open the channel ${ic('external', 'sm')}</a>
      </div>`;
  } else if (t.sections) {
    const secId = (s) => `s-${slugify(s.name)}`;
    list = `<div class="tabs" role="list">
        ${t.sections.map((s) => `<a role="listitem" href="#${secId(s)}">${esc(s.name)} <span class="n">${s.articles.length}</span></a>`).join('\n        ')}
      </div>
      ${t.sections.map((s) => `<h2 class="sec-title" id="${secId(s)}">${esc(s.name)}</h2>
      <div class="card list"><ol>
          ${t.items.filter((a) => a.section === s.name).map(row).join('\n          ')}
      </ol></div>`).join('\n      ')}`;
  } else {
    list = `<div class="card list"><ol>
          ${t.items.map(row).join('\n          ')}
      </ol></div>`;
  }
  const body = `<main id="main" class="container">
  ${crumbs(base, [{ label: 'Knowledge Base', href: `${base}index.html` }, { label: t.name }])}
  <div class="layout">
    ${rail(base, t.slug)}
    <section aria-labelledby="cat-title">
      <div class="topic-title">
        <span class="ic">${ic(t.icon, 'lg')}</span>
        <div>
          <h1 class="page-title" id="cat-title">${esc(t.name)}</h1>
          <p class="page-sub">${esc(t.desc)} ${t.count ? `${t.count} article${t.count === 1 ? '' : 's'}.` : ''}</p>
        </div>
      </div>
      ${t.count ? `<div class="toolbar">${searchBox(base, { placeholder: `Search in ${t.name}`, big: false, scope: 'topic' })}</div>` : ''}
      <p class="no-match" hidden>No articles in ${esc(t.name)} match that. <a href="${base}index.html">Search all topics</a>.</p>
      ${list}
    </section>
  </div>
</main>`;
  return page({ title: t.name, base, body, current: 'kb', desc: t.desc });
}

/* ---------- article ---------- */
function webhookBody() {
  return `<p>A webhook sends a message from your OnlineCheckWriter account to your own server the moment something changes, such as a check being printed or a payment changing status. This article covers how to turn webhooks on in the sandbox and how to confirm that each message really came from us.</p>
      <div class="callout callout-answer" role="note">
        ${ic('bulb')}
        <div>
          <div class="t">Quick answer</div>
          <p>Go to <strong>Settings → More → Developer Panel</strong> and open the <strong>Webhooks</strong> tab. Enter your endpoint URL and a secret key, set the status to <strong>Enabled</strong>, tick the events you want, and save.</p>
        </div>
      </div>
      <h2 id="steps">How to enable a webhook</h2>
      <ol class="steps">
        <li><h3>Open the Developer Panel</h3><p>In the left menu choose <strong>Settings</strong>, then <strong>More</strong>, then <strong>Developer Panel</strong>. Sandbox and live accounts each have their own panel, so make sure you are signed in to the sandbox.</p>
          <figure class="shot"><div class="bar"><i></i><i></i><i></i></div><div class="img">Screenshot: Settings menu with Developer Panel highlighted</div><figcaption>The Developer Panel entry under Settings → More.</figcaption></figure></li>
        <li><h3>Open the Webhooks tab</h3><p>Switch to the <strong>Webhooks</strong> tab. Paste the HTTPS URL that should receive events and choose a secret key. We sign every message with this key, so store it somewhere safe.</p>
          <figure class="shot"><div class="bar"><i></i><i></i><i></i></div><div class="img">Screenshot: Webhooks tab with URL and secret fields</div><figcaption>URL, secret key and the Enabled toggle.</figcaption></figure></li>
        <li><h3>Pick your events</h3><p>Tick only the events your integration needs, for example <code>check.printed</code>, <code>payment.completed</code> or <code>ach.returned</code>. Fewer events means fewer calls to your server and less noise in your logs.</p>
          <figure class="shot"><div class="bar"><i></i><i></i><i></i></div><div class="img">Screenshot: event checklist</div><figcaption>Events are grouped by product. The old event view is still available from the dropdown.</figcaption></figure></li>
        <li><h3>Save</h3><p>Set the status to <strong>Enabled</strong> and press <strong>Save</strong>. Use <strong>Send test event</strong> to fire a sample payload at your endpoint and confirm it answers with a 2xx status.</p></li>
      </ol>
      <div class="callout callout-note" role="note">
        ${ic('warn')}
        <div><div class="t">Using the Classic version?</div><p>In Classic, the Developer Panel sits under <strong>Settings → Integrations</strong>. The Webhooks tab and the fields are the same.</p></div>
      </div>
      <h2 id="signature">Webhook signature validation</h2>
      <p>Each request carries an <code>X-OCW-Signature</code> header: an HMAC SHA-256 of the raw request body, keyed with your secret. Recompute it on your side and compare the two values before you trust the payload.</p>
<pre><code>const crypto = require('crypto');

function isValid(rawBody, header, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(header));
}</code></pre>
      <h2 id="troubleshooting">Troubleshooting</h2>
      <ul>
        <li><strong>No events arrive.</strong> Confirm the status is Enabled and the URL is reachable from the public internet over HTTPS.</li>
        <li><strong>Signature never matches.</strong> Hash the raw bytes, not a re-serialised JSON object. Pretty-printing changes the body.</li>
        <li><strong>Events arrive twice.</strong> We retry when your server does not answer 2xx within 10 seconds. Answer fast and do the work asynchronously.</li>
      </ul>`;
}

function genericBody(a) {
  const t = a.topic;
  const others = t.items.filter((x) => x !== a).slice(0, 4);
  return `<p>This article answers <strong>“${esc(a.title)}”</strong> for the current version of OnlineCheckWriter. If your screen looks different you may be on the Classic layout; the steps are the same, only the menu names differ.</p>
      <div class="callout callout-answer" role="note">
        ${ic('bulb')}
        <div>
          <div class="t">Quick answer</div>
          <p>Open <strong>${esc(t.name)}</strong> from the left menu, choose the action you need from the toolbar, and confirm. Changes take effect immediately and show up in the activity log.</p>
        </div>
      </div>
      <h2 id="steps">Steps</h2>
      <ol class="steps">
        <li><h3>Open ${esc(t.name)}</h3><p>Sign in and choose <strong>${esc(t.name)}</strong> in the left menu. Use the search box at the top if you cannot see it.</p>
          <figure class="shot"><div class="bar"><i></i><i></i><i></i></div><div class="img">Screenshot: ${esc(t.name)} page</div><figcaption>The ${esc(t.name)} page in the current layout.</figcaption></figure></li>
        <li><h3>Choose the action</h3><p>Pick the action from the toolbar or the row menu. Required fields are marked; the form explains any limits that apply to your account.</p></li>
        <li><h3>Review and confirm</h3><p>Check the summary and press <strong>Confirm</strong>. You can track the result from the activity log on the same page.</p></li>
      </ol>
      <div class="callout callout-note" role="note">
        ${ic('warn')}
        <div><div class="t">Good to know</div><p>Limits, fees and processing times depend on your plan and verification status. The <a href="${topicUrl(TOPICS.find((x) => x.slug === 'pricing'), '../')}">Pricing</a> topic has the current numbers.</p></div>
      </div>
      ${others.length ? `<h2 id="related">Related questions</h2>
      <ul>
        ${others.map((o) => `<li><a href="${articleUrl(o, '../')}">${esc(o.title)}</a></li>`).join('\n        ')}
      </ul>` : ''}`;
}

function articlePage(a) {
  const base = '../';
  const t = a.topic;
  const idx = t.items.indexOf(a);
  const prev = t.items[idx - 1];
  const next = t.items[idx + 1];
  const special = a.title === 'How to enable webhook in sandbox?';
  const bodyHtml = special ? webhookBody() : genericBody(a);
  const toc = special
    ? [['#steps', 'How to enable a webhook'], ['#signature', 'Webhook signature validation'], ['#troubleshooting', 'Troubleshooting']]
    : [['#steps', 'Steps'], ...(t.items.length > 1 ? [['#related', 'Related questions']] : [])];
  const related = t.items.filter((x) => x !== a).slice(0, 5);
  const body = `<main id="main" class="container">
  ${crumbs(base, [{ label: 'Knowledge Base', href: `${base}index.html` }, { label: t.name, href: topicUrl(t, base) }, { label: a.title }])}
  <div class="layout article">
    <article class="card article-body">
      <div class="meta top">
        <a class="badge badge-info" href="${topicUrl(t, base)}">${ic(t.icon, 'sm')} ${esc(t.name)}</a>
        ${a.section ? `<span class="badge badge-neutral">${esc(a.section)}</span>` : ''}
        ${special ? '' : '<span class="badge badge-neutral" title="The final text comes from the Zoho article">Sample body</span>'}
      </div>
      <h1>${esc(a.title)}</h1>
      ${bodyHtml}
      <div class="feedback" data-feedback>
        <span class="q">Was this article helpful?</span>
        <div class="opts">
          <button class="btn btn-secondary btn-sm" type="button" data-vote="yes">${ic('up', 'sm')} Yes</button>
          <button class="btn btn-secondary btn-sm" type="button" data-vote="no">${ic('down', 'sm')} No</button>
        </div>
        <span class="note" data-thanks hidden>Thanks, your feedback helps us improve this article.</span>
      </div>
      <nav class="prevnext" aria-label="Previous and next article">
        ${prev ? `<a class="card" href="${articleUrl(prev, base)}"><span class="l">${ic('chev-l', 'sm')} Previous</span><span class="t">${esc(prev.title)}</span></a>` : '<span></span>'}
        ${next ? `<a class="card next" href="${articleUrl(next, base)}"><span class="l">Next ${ic('chev', 'sm')}</span><span class="t">${esc(next.title)}</span></a>` : ''}
      </nav>
    </article>
    <aside class="rail" aria-label="Article tools">
      <p class="rail-title">On this page</p>
      <ul class="toc">
        ${toc.map(([h, l], i) => `<li><a${i === 0 ? ' class="active"' : ''} href="${h}">${esc(l)}</a></li>`).join('\n        ')}
      </ul>
      ${related.length ? `<div class="card related">
        <h4>More in ${esc(t.name)}</h4>
        ${related.map((o) => `<a href="${articleUrl(o, base)}">${esc(o.title)}</a>`).join('\n        ')}
        <a class="all" href="${topicUrl(t, base)}">All ${t.count} articles ${ic('arrow', 'sm')}</a>
      </div>` : ''}
      <div class="rail-actions">
        <button class="btn btn-secondary btn-sm" type="button" data-copy>${ic('copy', 'sm')} Copy link</button>
        <a class="btn btn-ghost btn-sm" href="${base}submit-ticket.html">Ask support</a>
      </div>
    </aside>
  </div>
</main>`;
  return page({ title: a.title, base, body, current: 'kb', desc: `${a.title} — ${t.name}, OnlineCheckWriter knowledge base.` });
}

/* ---------- My Area, submit ticket, community, sign in ---------- */
const TICKETS = [
  { id: '48213', subject: 'Micro-deposits not showing for Chase account', topic: 'Bank Account', status: 'open', updated: 'Today, 09:12' },
  { id: '48190', subject: 'Check printed with the wrong routing number', topic: 'Check', status: 'progress', updated: 'Yesterday' },
  { id: '48102', subject: 'Webhook signature fails in sandbox', topic: 'API', status: 'waiting', updated: '2 days ago' },
  { id: '47988', subject: 'Invoice for October plan', topic: 'Pricing', status: 'closed', updated: '6 days ago' },
  { id: '47871', subject: 'Add second user with view-only access', topic: 'General', status: 'closed', updated: '2 weeks ago' },
];
const STATUS = { open: ['badge-info', 'Open'], progress: ['badge-sky', 'In progress'], waiting: ['badge-warning', 'Waiting on you'], closed: ['badge-neutral', 'Closed'] };

function myAreaPage() {
  const base = '';
  const row = (t) => `<li><a class="row ticket" href="submit-ticket.html#ticket-${t.id}">
          <span class="ic">${ic('inbox')}</span>
          <span>
            <span class="t">${esc(t.subject)}</span>
            <span class="m"><span class="badge ${STATUS[t.status][0]}">${STATUS[t.status][1]}</span><span>#${t.id}</span><span>${esc(t.topic)}</span><span>Updated ${esc(t.updated)}</span></span>
          </span>
          ${ic('chev', 'chev')}
        </a></li>`;
  const open = TICKETS.filter((t) => t.status !== 'closed');
  const body = `<main id="main" class="container">
  ${crumbs(base, [{ label: 'My Area' }])}
  <div class="page-head">
    <div>
      <h1 class="page-title">My Area</h1>
      <p class="page-sub">Your tickets, replies and the community posts you follow. Signed in as <strong>sample.user@company.com</strong>.</p>
    </div>
    <a class="btn btn-primary" href="submit-ticket.html">${ic('inbox', 'sm')} Submit a ticket</a>
  </div>
  <div class="stats">
    <div class="stat"><span class="n">${open.length}</span><span class="l">Open tickets</span></div>
    <div class="stat"><span class="n">1</span><span class="l">Waiting on you</span></div>
    <div class="stat"><span class="n">${TICKETS.length - open.length}</span><span class="l">Closed in the last 30 days</span></div>
    <div class="stat"><span class="n">4 h</span><span class="l">Typical first reply</span></div>
  </div>
  <div class="tabs" role="list">
    <a role="listitem" href="my-area.html" aria-current="page">Tickets <span class="n">${TICKETS.length}</span></a>
    <a role="listitem" href="community.html">Community posts <span class="n">2</span></a>
  </div>
  <div class="toolbar">
    ${searchBox(base, { id: 'tq', placeholder: 'Search your tickets', big: false, scope: 'topic' })}
    <div class="seg" role="group" aria-label="Filter by status">
      <button type="button" class="on">All</button><button type="button">Open</button><button type="button">Closed</button>
    </div>
  </div>
  <p class="no-match" hidden>No tickets match that.</p>
  <div class="card list"><ol>
        ${TICKETS.map((t) => row({ ...t })).join('\n        ')}
  </ol></div>
  <p class="foot-note">Sample tickets to show the layout. The real list comes from Zoho Desk.</p>
</main>`;
  return page({ title: 'My Area', base, body, current: 'myarea', desc: 'Your support tickets and community posts.' });
}

function submitTicketPage() {
  const base = '';
  const body = `<main id="main" class="container">
  ${crumbs(base, [{ label: 'My Area', href: 'my-area.html' }, { label: 'Submit a ticket' }])}
  <div class="layout article">
    <form class="card form" action="my-area.html" method="get" novalidate>
      <h1 class="page-title" style="margin-top:0">Submit a ticket</h1>
      <p class="page-sub">Tell us what happened and we will reply by email. You can follow the thread in My Area.</p>
      <div class="field">
        <label for="f-subject">Subject</label>
        <input id="f-subject" type="text" placeholder="One line that says what is wrong" required>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="f-topic">Topic</label>
          <select id="f-topic" required>
            <option value="">Choose a topic</option>
            ${TOPICS.filter((t) => !t.restricted).map((t) => `<option>${esc(t.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="f-priority">How urgent is it?</label>
          <select id="f-priority">
            <option>Normal, reply within a day</option>
            <option>High, a payment is stuck</option>
            <option>Low, a question</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label for="f-desc">What happened?</label>
        <textarea id="f-desc" rows="6" placeholder="What you were doing, what you expected, and what you saw instead. Include a check or payment number if you have one." required></textarea>
        <span class="hint">Do not paste full card or bank account numbers. The last four digits are enough.</span>
      </div>
      <div class="field">
        <span class="label">Attachments</span>
        <label class="drop" for="f-files">
          ${ic('copy')}
          <span><strong>Drop screenshots or PDFs here</strong>, or browse. Up to 10 MB each.</span>
          <input id="f-files" type="file" multiple class="sr-only">
        </label>
      </div>
      <div class="field check">
        <input id="f-cc" type="checkbox" checked>
        <label for="f-cc">Email me a copy and every reply</label>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary btn-lg" type="submit">Send ticket</button>
        <a class="btn btn-secondary btn-lg" href="my-area.html">Cancel</a>
      </div>
    </form>
    <aside class="rail" aria-label="Before you send">
      <div class="card related">
        <h4>These might answer it faster</h4>
        ${['How to verify your bank account?', 'Why were some checks rejected by the bank?', 'How long does it take for ACH payments to complete?', 'How to enable webhook in sandbox?'].map((t) => { const a = byTitle(t); return `<a href="${articleUrl(a, base)}">${esc(a.title)}</a>`; }).join('\n        ')}
      </div>
      <div class="card related" style="margin-top:16px">
        <h4>Other ways to reach us</h4>
        <a href="${LINKS.liveChat}" target="_blank" rel="noopener">Live chat, Mon to Fri 8 am to 6 pm PT</a>
        <a href="mailto:${LINKS.email}">${LINKS.email}</a>
        <a href="${LINKS.phoneHref}">${LINKS.phone}</a>
      </div>
    </aside>
  </div>
</main>`;
  return page({ title: 'Submit a ticket', base, body, current: 'myarea', desc: 'Send a support request to the OnlineCheckWriter team.' });
}

const THREADS = [
  { cat: 'Questions', title: 'Can I print checks from two different bank accounts in one batch?', who: 'Priya N.', replies: 6, when: '2 hours ago', answered: true },
  { cat: 'Questions', title: 'Positive Pay file format for Wells Fargo', who: 'Marcus H.', replies: 3, when: 'Yesterday', answered: true },
  { cat: 'Ideas', title: 'Let me schedule a check to print on a future date', who: 'Dana K.', replies: 14, when: '3 days ago', answered: false },
  { cat: 'Announcements', title: 'ACH same-day cut-off moves to 1:30 pm PT from 1 November', who: 'Zil Money team', replies: 0, when: '5 days ago', answered: false },
  { cat: 'Questions', title: 'Webhook retries: how many times and how far apart?', who: 'Tom R.', replies: 2, when: '1 week ago', answered: true },
];

function communityPage() {
  const base = '';
  const row = (t) => `<li><a class="row thread" href="community.html#thread">
          <span class="avatar" aria-hidden="true">${esc(t.who[0])}</span>
          <span>
            <span class="t">${esc(t.title)}</span>
            <span class="m"><span class="badge badge-neutral">${esc(t.cat)}</span>${t.answered ? '<span class="badge badge-success">Answered</span>' : ''}<span>${esc(t.who)}</span><span>${t.replies} ${t.replies === 1 ? 'reply' : 'replies'}</span><span>${esc(t.when)}</span></span>
          </span>
          ${ic('chev', 'chev')}
        </a></li>`;
  const body = `<main id="main" class="container">
  ${crumbs(base, [{ label: 'Community' }])}
  <div class="page-head">
    <div>
      <h1 class="page-title">Community</h1>
      <p class="page-sub">Questions, ideas and announcements from people who use OnlineCheckWriter every day.</p>
    </div>
    <a class="btn btn-primary" href="community.html#new">${ic('chat', 'sm')} Start a discussion</a>
  </div>
  <div class="layout">
    <aside class="rail" aria-label="Categories">
      <p class="rail-title">Categories</p>
      <ul>
        <li><a href="community.html" aria-current="page">All discussions <span class="n">${THREADS.length}</span></a></li>
        <li><a href="community.html#questions">Questions <span class="n">3</span></a></li>
        <li><a href="community.html#ideas">Ideas <span class="n">1</span></a></li>
        <li><a href="community.html#announcements">Announcements <span class="n">1</span></a></li>
      </ul>
      <p class="rail-title">Following</p>
      <ul>
        <li><a href="community.html#thread">Positive Pay file format for Wells Fargo</a></li>
        <li><a href="community.html#thread">Let me schedule a check to print on a future date</a></li>
      </ul>
    </aside>
    <section>
      <div class="toolbar">
        ${searchBox(base, { id: 'cq', placeholder: 'Search discussions', big: false, scope: 'topic' })}
        <div class="seg" role="group" aria-label="Sort">
          <button type="button" class="on">Latest</button><button type="button">Most replies</button><button type="button">Unanswered</button>
        </div>
      </div>
      <p class="no-match" hidden>No discussions match that.</p>
      <div class="card list"><ol>
        ${THREADS.map(row).join('\n        ')}
      </ol></div>
      <p class="foot-note">Sample discussions to show the layout. Threads come from the Zoho Desk community.</p>
    </section>
  </div>
</main>`;
  return page({ title: 'Community', base, body, current: 'community', desc: 'Questions, ideas and announcements from OnlineCheckWriter users.' });
}

function signInPage() {
  const base = '';
  const body = `<main id="main" class="container">
  <div class="auth">
    <form class="card form auth-card" action="my-area.html" method="get" novalidate>
      <h1 class="page-title" style="margin-top:0">Sign in</h1>
      <p class="page-sub">Use the same email and password as the OnlineCheckWriter app to see your tickets and post in the community.</p>
      <div class="field">
        <label for="s-email">Email</label>
        <input id="s-email" type="email" autocomplete="email" placeholder="you@company.com" required>
      </div>
      <div class="field">
        <div class="label-row"><label for="s-pass">Password</label><a href="sign-in.html#reset">Forgot password?</a></div>
        <input id="s-pass" type="password" autocomplete="current-password" required>
      </div>
      <div class="field check">
        <input id="s-keep" type="checkbox" checked>
        <label for="s-keep">Keep me signed in on this device</label>
      </div>
      <button class="btn btn-primary btn-lg" type="submit" style="width:100%">Sign in</button>
      <div class="or"><span>or</span></div>
      <button class="btn btn-secondary btn-lg" type="button" style="width:100%">Continue with Google</button>
      <p class="auth-foot">New here? Browse the <a href="index.html">knowledge base</a> without signing in, or <a href="${LINKS.app}">create an account in the app</a>.</p>
    </form>
  </div>
</main>`;
  return page({ title: 'Sign in', base, body, current: 'signin', desc: 'Sign in to the OnlineCheckWriter help centre.' });
}

/* ---------- scripts ---------- */
const searchIndex = `window.HC_INDEX = ${JSON.stringify(ARTICLES.map((a) => ({ t: a.title, u: `articles/${a.slug}.html`, c: a.topic.name, s: a.topic.slug })))};\n`;

const hcJs = `(function () {
  var base = document.body.getAttribute('data-base') || '';
  var index = window.HC_INDEX || [];

  /* mobile menu */
  var header = document.getElementById('hc-header');
  var menuBtn = header && header.querySelector('.menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', function () {
    var open = header.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });

  /* search with inline results */
  function norm(s) { return s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\\s+/g, ' ').trim(); }
  function score(words, title) {
    var t = norm(title), n = 0;
    for (var i = 0; i < words.length; i++) { if (t.indexOf(words[i]) === -1) return 0; n += t.indexOf(words[i]) === 0 ? 3 : 1; }
    return n;
  }
  document.querySelectorAll('form.search').forEach(function (form) {
    var input = form.querySelector('input');
    var box = form.querySelector('.search-results');
    var scope = form.getAttribute('data-scope');
    var topicSlug = (location.pathname.match(/topics\\/([a-z0-9-]+)\\.html/) || [])[1];
    function close() { box.hidden = true; box.innerHTML = ''; }
    function run() {
      var q = norm(input.value);
      if (scope === 'topic') {
        var rows = document.querySelectorAll('.list li');
        var any = false;
        rows.forEach(function (li) {
          var show = !q || li.querySelector('.row').getAttribute('data-title').indexOf(q) !== -1;
          li.hidden = !show; if (show) any = true;
        });
        document.querySelectorAll('.sec-title').forEach(function (h) {
          var next = h.nextElementSibling; var visible = next && next.querySelector('li:not([hidden])');
          h.hidden = !visible; if (next) next.hidden = !visible;
        });
        var nm = document.querySelector('.no-match'); if (nm) nm.hidden = any;
        return;
      }
      if (q.length < 2) { close(); return; }
      var words = q.split(' ');
      var hits = index.map(function (a) { return { a: a, s: score(words, a.t) }; })
        .filter(function (h) { return h.s > 0; })
        .sort(function (x, y) { return y.s - x.s; }).slice(0, 8);
      if (!hits.length) { box.innerHTML = '<div class="sr-empty">No articles match “' + input.value.replace(/</g, '&lt;') + '”. Try fewer words.</div>'; box.hidden = false; return; }
      box.innerHTML = hits.map(function (h) {
        return '<a role="option" href="' + base + h.a.u + '"><span class="t">' + h.a.t.replace(/</g, '&lt;') + '</span><span class="c">' + h.a.c + '</span></a>';
      }).join('');
      box.hidden = false;
    }
    input.addEventListener('input', run);
    input.addEventListener('focus', run);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (scope === 'topic') return;
      var first = box.querySelector('a'); if (first) location.href = first.getAttribute('href');
    });
    document.addEventListener('click', function (e) { if (!form.contains(e.target)) close(); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { close(); input.blur(); } });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { var f = document.querySelector('form.search input'); if (f) { e.preventDefault(); f.focus(); } }
  });

  /* article: feedback, copy link, TOC highlight */
  var fb = document.querySelector('[data-feedback]');
  if (fb) fb.querySelectorAll('[data-vote]').forEach(function (b) {
    b.addEventListener('click', function () {
      fb.querySelectorAll('[data-vote]').forEach(function (x) { x.classList.remove('selected'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('selected'); b.setAttribute('aria-pressed', 'true');
      fb.querySelector('[data-thanks]').hidden = false;
    });
  });
  var copy = document.querySelector('[data-copy]');
  if (copy) copy.addEventListener('click', function () {
    var done = function () { var old = copy.innerHTML; copy.textContent = 'Link copied'; setTimeout(function () { copy.innerHTML = old; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done); else done();
  });
  var toc = document.querySelectorAll('.toc a');
  if (toc.length && 'IntersectionObserver' in window) {
    var map = {};
    toc.forEach(function (a) { var el = document.querySelector(a.getAttribute('href')); if (el) map[el.id] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { toc.forEach(function (a) { a.classList.remove('active'); }); map[en.target.id].classList.add('active'); } });
    }, { rootMargin: '-80px 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }
})();
`;

/* ---------- write ---------- */
for (const out of OUT_DIRS) {
  if (existsSync(out)) rmSync(out, { recursive: true });
  mkdirSync(join(out, 'topics'), { recursive: true });
  mkdirSync(join(out, 'articles'), { recursive: true });
  writeFileSync(join(out, 'index.html'), homePage());
  writeFileSync(join(out, 'my-area.html'), myAreaPage());
  writeFileSync(join(out, 'submit-ticket.html'), submitTicketPage());
  writeFileSync(join(out, 'community.html'), communityPage());
  writeFileSync(join(out, 'sign-in.html'), signInPage());
  for (const t of TOPICS) writeFileSync(join(out, 'topics', `${t.slug}.html`), topicPage(t));
  for (const a of ARTICLES) writeFileSync(join(out, 'articles', `${a.slug}.html`), articlePage(a));
  writeFileSync(join(out, 'search-index.js'), searchIndex);
  writeFileSync(join(out, 'hc.js'), hcJs);
  copyFileSync(join(here, 'theme.css'), join(out, 'theme.css'));
  copyFileSync(join(here, 'checkwriter-logo.svg'), join(out, 'checkwriter-logo.svg'));
  console.log(`${out}: 1 home, ${TOPICS.length} topics, ${ARTICLES.length} articles`);
}
