import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { mapToV4Route } from 'src/app/shared/service/route/v4-route-mapper';

/**
 * Maps V3 third-party app sub-paths to V4 app IDs.
 * Only includes apps that have V4 settings components in the side drawer.
 */
const V3_PATH_TO_V4_APP_ID: Readonly<Record<string, string>> = {
  'quickBooks/quickbooks_online': 'qb-online',
  quickbooks_online: 'qb-online',
  'quickBooks/qb_desktop': 'qb-desktop',
  qb_desktop: 'qb-desktop',
  clio: 'clio',
  hubspot: 'hubspot',
  shopify: 'shopify',
  freshbooks: 'freshbook',
  gusto: 'gusto',
  zoho: 'zoho',
  'bill-dot-com': 'bill',
  'netsuite/home': 'netsuite'
};

/**
 * Redirects V4 users from V3 third-party app routes to the V4 integration
 * index page, preserving OAuth callback query parameters and passing the
 * target app ID so the side drawer auto-opens.
 *
 * For integrations without V4 settings components, falls back to
 * `mapToV4Route` which loads the V3 component inside the V4 layout.
 */
export const thirdPartyV4RedirectGuard = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);

  if (localStorageService.getItem('isV4LayoutEnabled') !== 1) {
    return true;
  }

  // Extract the sub-path after 'thirdparty_app/' and query string
  const { url } = state;
  const pathMatch = url.match(/thirdparty_app\/(.+?)(?:\?|$)/);
  const subPath = pathMatch?.[1];

  // Check if this sub-path maps to a V4 app with a settings drawer
  if (subPath) {
    const appId = V3_PATH_TO_V4_APP_ID[subPath];
    if (appId) {
      // Build redirect to V4 index with openApp param + original query params
      const queryIdx = url.indexOf('?');
      const existingQuery = queryIdx >= 0 ? url.slice(queryIdx + 1) : '';
      const openAppParam = `openApp=${appId}`;
      const query = existingQuery
        ? `${existingQuery}&${openAppParam}`
        : openAppParam;
      return router.parseUrl(`/v4/manage/thirdparty_app/index?${query}`);
    }
  }

  // Fallback: use mapToV4Route for unmapped paths (loads V3 component in V4 layout)
  const v4Url = mapToV4Route(url);
  if (v4Url && v4Url !== url) {
    return router.parseUrl(v4Url);
  }

  return true;
};
