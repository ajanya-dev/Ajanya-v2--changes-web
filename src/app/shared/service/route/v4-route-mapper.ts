/**
 * Single source of truth for V3 → V4 URL translation.
 *
 * Use this helper any time the `isV4LayoutEnabled` flag is on and the code
 * needs to navigate to a V4 page based on a V3-style URL. Hardcoding
 * `/v4/manage/...` at call sites or blindly prefixing `/v4/` is unsafe
 * because several V4 pages have renamed paths (e.g. `payee` → `payees`,
 * `bankaccount` → `bank-accounts`).
 */

import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

/** Default V4 landing page, used when a URL can't be mapped meaningfully. */
export const V4_HOME_URL = '/v4/manage/home';

/**
 * Maps a recurring notification's `grid_id` (the DTTableId of the sub-tab
 * grid the row lives in) to the `type`/`tab` number already used across the
 * recurring detail pages and the V4 recurring tab container.
 */
export const RECURRING_GRID_ID_TO_TYPE: Readonly<Record<number, number>> = {
  [DTTableId.checkRecurring]: 1,
  [DTTableId.achRecurring]: 2,
  [DTTableId.emailRecurring]: 3,
  [DTTableId.giftCardRecurring]: 4
};

/**
 * V4-native pages: V3 sub-paths are **dropped** and the request lands on the
 * V4 base page. Used when the V4 page doesn't share URL structure with V3.
 */
const V4_NATIVE_ROUTES: Readonly<Record<string, string>> = {
  'manage/bankaccount': '/v4/manage/bank-accounts',
  'manage/bank_accounts': '/v4/manage/bank-accounts',
  'manage/bank-accounts': '/v4/manage/bank-accounts',
  'manage/payee': '/v4/manage/payees',
  'manage/payees': '/v4/manage/payees',
  'manage/wallet': '/v4/manage/wallets',
  'manage/wallets': '/v4/manage/wallets',
  'manage/cards': '/v4/manage/cards',
  'manage/payment-links': '/v4/manage/payment-links',
  'manage/payments-in': '/v4/manage/payments-in',
  'manage/bulk-payments': '/v4/manage/bulk-payments',
  'manage/home': '/v4/manage/home',
  'manage/verification': '/v4/manage/verification',
  'manage/vendor-credit': '/v4/manage/vendor-credits',
  'manage/vendor-credits': '/v4/manage/vendor-credits',
  // payments-table exists under /v4/ but loads the V3 module; redirect to the
  // real V4 page (payments-out) and drop V3 sub-paths like /check, /index.
  'manage/payments-table': '/v4/manage/payments-out',
  'manage/payments-out': '/v4/manage/payments-out'
};

/**
 * Allowlist of sub-paths that should be preserved for otherwise V4-native
 * prefixes. Use when most V3 sub-paths must be dropped (because they don't
 * exist in V4) but a few specific ones are valid V4 child routes and should
 * pass through untouched.
 */
const V4_NATIVE_SUBPATH_ALLOWLIST: Readonly<Record<string, readonly RegExp[]>> = {
  'manage/payments-out': [/^overview$/, /^detailed(\/[^/]+)?$/]
};

/**
 * Shared routes: the V4 page shares URL structure with V3 — keep the sub-path
 * and only swap the `manage/...` prefix for `v4/manage/...`.
 */
const V4_SHARED_ROUTES: Readonly<Record<string, string>> = {
  'manage/more/notification': '/v4/manage/more/notification',
  'manage/cheque': '/v4/manage/cheque',
  'manage/bill': '/v4/manage/bill',
  'manage/receivedchecks': '/v4/manage/receivedchecks',
  'manage/checkdraft': '/v4/manage/checkdraft',
  'manage/invoice': '/v4/manage/invoice',
  'manage/cashexp': '/v4/manage/cashexp',
  'manage/central_accounting': '/v4/manage/central_accounting',
  'manage/depositslips': '/v4/manage/depositslips',
  'manage/checkcatagory': '/v4/manage/checkcatagory',
  'manage/transfers': '/v4/manage/transfers',
  'manage/users': '/v4/manage/users',
  'manage/payments': '/v4/manage/payments',
  'manage/settings': '/v4/manage/settings',
  'manage/company_management': '/v4/manage/company_management',
  'manage/subscription': '/v4/manage/subscription',
  'manage/payee-onboarding': '/v4/manage/payee-onboarding',
  'manage/financialstatement': '/v4/manage/financialstatement',
  'manage/fdicbankaccount': '/v4/manage/fdicbankaccount',
  'manage/design': '/v4/manage/design',
  'manage/thirdparty_app': '/v4/manage/thirdparty_app',
  'manage/search': '/v4/manage/search',
  'manage/user-support': '/v4/manage/user-support',
  'manage/positivepay': '/v4/manage/positivepay',
  'manage/bankingAch': '/v4/manage/bankingAch',
  'manage/shop': '/v4/manage/shop',
  'manage/developer': '/v4/manage/developer',
  'manage/coupon': '/v4/manage/coupon',
  'manage/checkmailing': '/v4/manage/checkmailing',
  'manage/more': '/v4/manage/more',
  'manage/affiliate': '/v4/manage/affiliate',
  'manage/business-tools': '/v4/manage/business-tools',
  'manage/group-payments': '/v4/manage/group-payments',
  'manage/cloud-bank': '/v4/manage/cloud-bank',
  'manage/international-payment': '/v4/manage/international-payment',
  'manage/manage-users': '/v4/manage/manage-users',
  'manage/user-profile': '/v4/manage/user-profile',
  'manage/verification/index': '/v4/manage/verification',
  'manage/payroll-card': '/v4/manage/payroll-card',
  'manage/virtual-card': '/v4/manage/virtual-card',
  'manage/application-error': '/v4/manage/application-error'
};

/**
 * Splits a URL into its path and suffix (query string + fragment) so the
 * suffix can be re-attached after translation.
 */
function splitUrlSuffix(url: string): { path: string; suffix: string } {
  const queryIdx = url.indexOf('?');
  const fragIdx = url.indexOf('#');
  const cutAt = [queryIdx, fragIdx].filter((i) => i >= 0).sort((a, b) => a - b)[0];
  if (cutAt === undefined) return { path: url, suffix: '' };
  return { path: url.slice(0, cutAt), suffix: url.slice(cutAt) };
}

/** Strip a leading `/` so paths compare cleanly against the map keys. */
function stripLeadingSlash(path: string): string {
  return path.replace(/^\/+/, '');
}

/** Ensure the returned URL has exactly one leading `/`. */
function withLeadingSlash(url: string): string {
  if (!url) return url;
  return url.startsWith('/') ? url : '/' + url;
}

/**
 * Translates a V3-style URL to its V4 equivalent using the shared maps.
 *
 * Rules (longest-prefix wins so `manage/more/notification` beats `manage/more`):
 *   1. If the URL is already under `/v4/...`, it's returned unchanged.
 *   2. If the URL matches a V4-native prefix, the V3 sub-path is **dropped**
 *      (because the V4 page has a different internal structure).
 *   3. If the URL matches a shared prefix, the `manage/...` segment is swapped
 *      for `v4/manage/...` and the sub-path is preserved.
 *   4. Otherwise the URL is returned unchanged — the caller decides whether
 *      to fall back (`toV4IfEnabled` falls back to V4 home in this case).
 *
 * Query strings and fragments are preserved for shared routes, for V4-native
 * routes hit at their base path (no sub-path to drop), and for V4-native
 * routes whose sub-path matches `V4_NATIVE_SUBPATH_ALLOWLIST`. They are
 * dropped only when a V3 sub-path itself is being dropped.
 */
export function mapToV4Route(url: string): string {
  if (!url) return url;
  if (/^\/?v4\//.test(url)) return withLeadingSlash(url);

  const { path, suffix } = splitUrlSuffix(url);
  const bare = stripLeadingSlash(path);

  const nativeMatch = Object.keys(V4_NATIVE_ROUTES)
    .sort((a, b) => b.length - a.length)
    .find((v3Path) => bare === v3Path || bare.startsWith(v3Path + '/'));
  if (nativeMatch) {
    const subpath = bare.slice(nativeMatch.length).replace(/^\/+/, '');
    const allowed = V4_NATIVE_SUBPATH_ALLOWLIST[nativeMatch];
    if (subpath && allowed?.some((re) => re.test(subpath))) {
      return withLeadingSlash(V4_NATIVE_ROUTES[nativeMatch] + '/' + subpath) + suffix;
    }
    // No sub-path: query/fragment apply to the base V4 page, so keep them.
    if (!subpath) return V4_NATIVE_ROUTES[nativeMatch] + suffix;
    return V4_NATIVE_ROUTES[nativeMatch];
  }

  const sharedMatch = Object.keys(V4_SHARED_ROUTES)
    .sort((a, b) => b.length - a.length)
    .find((v3Path) => bare === v3Path || bare.startsWith(v3Path + '/'));
  if (sharedMatch) {
    const replaced = V4_SHARED_ROUTES[sharedMatch] + bare.slice(sharedMatch.length);
    return withLeadingSlash(replaced) + suffix;
  }

  return url;
}

/**
 * Applies `mapToV4Route` when the user has opted into the V4 layout.
 *
 * @param url      V3-style URL (or any URL) to evaluate.
 * @param storage  Caller-supplied LocalStorageService — passed in so this
 *                 helper stays dependency-free and injectable-free.
 * @param fallback V4 URL to return when the input can't be mapped to a V4
 *                 route (defaults to the V4 home page).
 */
export interface IResolvedNotificationRoute {
  path: string;
  queryParams: Record<string, string>;
}

/**
 * Resolves a raw notification `action_link` URL to a v4 route + query params.
 * Handles old-style v3 paths, v4/manage/ paths, and legacy v4/[module]/view/[id] paths.
 * For cheque detail links, navigates to payments-out and passes checkId as a query param
 * so the detail panel can be auto-opened.
 */
export function resolveNotificationLink(actionLink: string): IResolvedNotificationRoute {
  const [, fullPath] = actionLink.split('.com/');
  if (!fullPath) return { path: V4_HOME_URL, queryParams: {} };

  const [path, queryString] = fullPath.split('?');
  let redirectPath = path.replace('/?id=/', '/');
  const queryParams: Record<string, string> = queryString
    ? Object.fromEntries(new URLSearchParams(queryString))
    : {};

  // Normalize all v4/ prefixed paths
  if (redirectPath.startsWith('v4/manage/')) {
    redirectPath = redirectPath.substring(3); // v4/manage/... → manage/...
  } else if (redirectPath.startsWith('v4/')) {
    redirectPath = `manage/${redirectPath.substring(3)}`; // v4/cheque/view/123 → manage/cheque/view/123
  }

  // Cheque/check detail view → navigate to payments-out and open drawer via checkId param
  const chequeViewMatch = redirectPath.match(/^manage\/cheque\/view\/(.+)$/);
  if (chequeViewMatch) {
    return {
      path: '/v4/manage/payments-out/detailed/check',
      queryParams: { ...queryParams, checkId: chequeViewMatch[1] }
    };
  }

  // Cheque check-records list → V4 payments-out detailed/check page
  if (/^manage\/cheque\/checkrecords(\/.*)?$/.test(redirectPath)) {
    return {
      path: '/v4/manage/payments-out/detailed/check',
      queryParams
    };
  }

  // Recurring payment notification → payments-out recurring tab, deep-linked
  // to the row's grid (via grid_id → tab) and detail panel (via initiator_id).
  if (
    redirectPath === 'manage/payments-out/detailed/recurring' &&
    queryParams.grid_id
  ) {
    const tab = RECURRING_GRID_ID_TO_TYPE[Number(queryParams.grid_id)];
    return {
      path: '/v4/manage/payments-out/detailed/recurring',
      queryParams: {
        ...(tab ? { tab: String(tab) } : {}),
        ...(queryParams.initiator_id ? { initiator_id: queryParams.initiator_id } : {})
      }
    };
  }

  // Standard v3 → v4 route mapping
  if (redirectPath.startsWith('manage/')) {
    redirectPath = mapToV4Route(redirectPath);
  }

  return { path: redirectPath, queryParams };
}

/**
 * Resolves a raw notification `action_link` URL to a V1/V3 recurring detail
 * route, for the same `payments-out/detailed/recurring?grid_id=&initiator_id=`
 * link shape handled by `resolveNotificationLink` for V4. Returns null for
 * any other link shape, so callers can fall back to their existing generic
 * `action_link` parsing.
 */
export function resolveV3RecurringNotificationLink(
  actionLink: string
): IResolvedNotificationRoute | null {
  const [, fullPath] = actionLink.split('.com/');
  if (!fullPath) return null;

  const [path, queryString] = fullPath.split('?');
  let redirectPath = path.replace('/?id=/', '/');
  if (redirectPath.startsWith('v4/manage/')) {
    redirectPath = redirectPath.substring(3);
  }
  if (redirectPath !== 'manage/payments-out/detailed/recurring') return null;

  const queryParams: Record<string, string> = queryString
    ? Object.fromEntries(new URLSearchParams(queryString))
    : {};
  const type = RECURRING_GRID_ID_TO_TYPE[Number(queryParams.grid_id)];
  if (!type) return null;

  const initiatorId = queryParams.initiator_id ?? '';
  if (type === 1) {
    return {
      path: 'manage/checkmailing/recurring/view',
      queryParams: { id: initiatorId, openTab: 'recurring' }
    };
  }
  return {
    path: 'manage/checkmailing/recurring/show',
    queryParams: { id: initiatorId, type: String(type), openTab: 'recurring' }
  };
}

/**
 * Resolves a bare relative `returnUrl` (as captured during login — no domain
 * to strip, unlike `resolveNotificationLink`/`resolveV3RecurringNotificationLink`
 * which parse a full notification `action_link`) for the recurring
 * `payments-out/detailed/recurring?grid_id=&initiator_id=` link shape, picking
 * the v1 or v4 target based on the user's stored layout preference — mirroring
 * the same choice the notification-click flow already makes by way of which
 * header component (v1 vs v4) is currently active. Returns null for any other
 * returnUrl shape, so the caller leaves returnUrl untouched.
 */
export function resolveRecurringReturnUrl(
  returnUrl: string,
  isV4LayoutEnabled: boolean
): string | null {
  if (!returnUrl) return null;

  const [path, queryString] = returnUrl.split('?');
  let bare = stripLeadingSlash(path);
  if (bare.startsWith('v4/manage/')) {
    bare = bare.substring(3);
  }
  if (bare !== 'manage/payments-out/detailed/recurring') return null;

  const queryParams: Record<string, string> = queryString
    ? Object.fromEntries(new URLSearchParams(queryString))
    : {};
  const type = RECURRING_GRID_ID_TO_TYPE[Number(queryParams.grid_id)];
  if (!type) return null;

  const initiatorId = queryParams.initiator_id ?? '';

  if (isV4LayoutEnabled) {
    const params = new URLSearchParams({ tab: String(type) });
    if (initiatorId) params.set('initiator_id', initiatorId);
    return `/v4/manage/payments-out/detailed/recurring?${params.toString()}`;
  }

  if (type === 1) {
    return `manage/checkmailing/recurring/view?id=${encodeURIComponent(initiatorId)}`;
  }
  return `manage/checkmailing/recurring/show?id=${encodeURIComponent(initiatorId)}&type=${type}&openTab=recurring`;
}

export function toV4IfEnabled(
  url: string,
  storage: LocalStorageService,
  fallback: string = V4_HOME_URL
): string {
  if (storage.getItem('isV4LayoutEnabled') !== 1) {
    return url;
  }
  const mapped = mapToV4Route(url);
  if (!mapped || mapped === url) {
    // Unmapped URL under /manage/ → fall back; v4 URLs pass through unchanged.
    if (/^\/?v4\//.test(url)) return withLeadingSlash(url);
    return fallback;
  }
  return mapped;
}
