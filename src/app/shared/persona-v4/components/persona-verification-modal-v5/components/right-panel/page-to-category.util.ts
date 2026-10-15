/**
 * Maps a Persona SDK page name/path to a high-level category used by the
 * Live Verification Summary timeline on the right panel.
 *
 * Order matters: "business address" must match address before "business".
 * Separators between words are matched as [_\s-] (snake_case / words /
 * hyphenated) — dots are escaped because the Persona SDK's page names are
 * snake_case, not dotted.
 * Ported from the reference prototype at /persona/index.html.
 *
 * Some templates name their pages generically ("ui_step_4"), so the human
 * `nameDisplay` ("US Business Details - 2 of 2") is matched alongside the
 * machine name rather than only as a fallback — otherwise those pages fall
 * through to null and the preview panel doesn't follow the user.
 *
 * @param name        Page name from the SDK page-change event
 * @param path        Optional page path from the SDK event
 * @param nameDisplay Optional human-readable page name from the SDK event
 * @returns One of 'Business Addresses' | 'Associated People' |
 *          'Associated People (continued)' | 'Documents' | 'KYC Details' |
 *          'Business Details' | 'Business Details (continued)',
 *          or null for uncategorized pages (review/summary/unknown).
 */
export function mapPersonaPageToCategory(
  name?: string,
  path?: string,
  nameDisplay?: string
): string | null {
  const n = `${name ?? ''} ${nameDisplay ?? ''} ${path ?? ''}`.toLowerCase();

  if (!n.trim()) return null;

  // A multi-page step is labelled "<step> of <total>" in nameDisplay. Anything
  // past the first page belongs to that category's "(continued)" bucket.
  const step = /(\d+)\s*of\s*(\d+)/.exec(nameDisplay ?? '');
  const isContinuation = !!step && Number(step[1]) > 1;

  if (/address/.test(n)) return 'Business Addresses';
  if (
    /ubo|beneficial[_\s-]owner|control[_\s-]person/.test(n) ||
    /form[_\s-]filler|associated/.test(n)
  )
    return isContinuation
      ? 'Associated People (continued)'
      : 'Associated People';
  if (/document|upload|id[_\s-]capture|photo[_\s-]id/.test(n))
    return 'Documents';
  if (
    /selfie|liveness|face|personal[_\s-]info|kyc|government[_\s-]id|identity|confirm[_\s-]your/.test(
      n
    )
  )
    return 'KYC Details';
  if (/country/.test(n) && !/business/.test(n)) return 'KYC Details';
  if (/industry|subindustry|website|description|formation/.test(n))
    return 'Business Details (continued)';
  if (/business|entity|company|ein|tax[_\s-]id/.test(n))
    return isContinuation
      ? 'Business Details (continued)'
      : 'Business Details';

  return null;
}
