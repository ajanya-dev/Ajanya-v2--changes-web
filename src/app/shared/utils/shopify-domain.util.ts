/**
 * Shopify store domains must reach the API as a bare, fully qualified
 * `*.myshopify.com` host — Shopify's OAuth authorize URL is built per shop,
 * so a protocol, trailing slash or mixed case breaks the redirect.
 *
 * Users typically paste one of: `mystore`, `mystore.myshopify.com`,
 * `https://mystore.myshopify.com/`. All of them normalize to the same host.
 */

const SHOPIFY_DOMAIN_SUFFIX = '.myshopify.com';

/**
 * @description Normalizes a user supplied Shopify store domain.
 * @param value - Raw value typed into the connect form
 * @returns Bare `<store>.myshopify.com` host
 */
export function normalizeShopifyDomain(value: string): string {
  const trimmed = (value || '').trim().toLowerCase();
  if (!trimmed) return '';

  const host = trimmed
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .split('/')[0];

  if (!host) return '';

  return host.endsWith(SHOPIFY_DOMAIN_SUFFIX)
    ? host
    : `${host}${SHOPIFY_DOMAIN_SUFFIX}`;
}
