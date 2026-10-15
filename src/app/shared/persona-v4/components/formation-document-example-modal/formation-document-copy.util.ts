import {
  FormationDocumentAccess,
  IFormationDocumentPage
} from '../../model/persona-v4';

/**
 * Turns the backend's formation-document config into copy a customer can act
 * on (OCW-23337).
 *
 * The config is written for us, not for them: `document_access` is one of five
 * internal labels and `limitation` is an operational note ("CAPTCHA (DataDome)
 * protection observed on the search portal"). Printing either verbatim tells
 * the customer nothing about the only question they have — which file do I
 * upload, and where do I get it.
 */

/** Trailing page markers: "1st page", "(2nd page)", "page 3", "- Page 2". */
const PAGE_ORDINAL = /[\s(,–—-]*\b(\d+)\s*(?:st|nd|rd|th)\s+page\b\)?\s*$/i;
const PAGE_NUMBER = /[\s(,–—-]*\bpage\s*(\d+)\b\)?\s*$/i;

/** The page number a label carries, or null when it names a whole document. */
function pageNumberOf(label: string): number | null {
  const match = PAGE_ORDINAL.exec(label) ?? PAGE_NUMBER.exec(label);
  return match ? Number(match[1]) : null;
}

/** The label with any trailing page marker removed. */
function stripPageMarker(label: string): string {
  return label.replace(PAGE_ORDINAL, '').replace(PAGE_NUMBER, '').trim();
}

/**
 * The distinct documents the example pages describe, in the order they appear.
 *
 * "Articles of Incorporation 1st page" + "…2nd page" + "Certificate of
 * Incorporation" collapses to ["Articles of Incorporation", "Certificate of
 * Incorporation"] — the answer to "what do I upload", which today is buried in
 * the image captions.
 */
export function documentNamesFromPages(
  pages: IFormationDocumentPage[]
): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  pages.forEach((page) => {
    const name = stripPageMarker(page.label);
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    names.push(name);
  });
  return names;
}

/** Short caption under a thumbnail; the full label stays as the tooltip. */
export function pageCaption(page: IFormationDocumentPage): string {
  const number = pageNumberOf(page.label);
  return number === null ? stripPageMarker(page.label) : `Page ${number}`;
}

/** What the customer can actually do on the state's own site. */
export function accessCopy(
  access: FormationDocumentAccess | undefined,
  stateName: string
): string {
  switch (access) {
    case 'Free download':
      return `You can download it free from ${stateName}'s business register.`;
    case 'View/download available':
      return `You can view and download it from ${stateName}'s business register.`;
    case 'Paid document order':
      return `${stateName} charges a fee for an official copy.`;
    case 'Entity details only':
      return `${stateName}'s site only lists business details, so you'll need your own copy of the document.`;
    case 'Account/login required':
      return `You'll need an account on ${stateName}'s site to get a copy.`;
    default:
      return `${stateName} issues this document.`;
  }
}

/**
 * The operational note, said plainly. First match wins.
 *
 * An unrecognised note returns null and is not shown at all: a customer is
 * better served by no warning than by one written for an engineer. If
 * compliance wants every note surfaced, soften the strings in the backend's
 * `formation_document.php` rather than widening this list indefinitely.
 */
const LIMITATION_RULES: { match: RegExp; copy: string }[] = [
  {
    match: /captcha|datadome|recaptcha|bot[\s-]*detection|human verification/i,
    copy: 'The site may ask you to complete a quick security check first.'
  },
  {
    match: /login|log[\s-]?in|sign[\s-]?in|account|credential|register an/i,
    copy: 'You may need to sign in or create an account on the site.'
  },
  {
    match: /payment|fee|paid|charge|purchase|cost|order/i,
    copy: 'Expect to pay a fee for an official copy.'
  },
  {
    match: /subscription/i,
    copy: 'Full documents may sit behind a subscription.'
  },
  {
    match: /automated access|scraping|crawl|prohibit/i,
    copy: 'Look the document up by hand — the state does not allow automated access.'
  }
];

export function limitationCopy(limitation: string | undefined): string | null {
  if (!limitation?.trim()) return null;
  const rule = LIMITATION_RULES.find((r) => r.match.test(limitation));
  return rule ? rule.copy : null;
}
