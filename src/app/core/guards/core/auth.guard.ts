import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { Utils } from 'src/app/data/utils';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { environment } from 'src/environments/environment';

/**
 * @description This function is used to check if the user is authorized to access the page.
 * @param route - The route to be checked.
 * @param state - The state of the router.
 * @returns - Returns true if the user is authorized, false otherwise.
 */
export const authGuard = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean => {
  /**
   * @description Injecting dependencies using inject method
   */
  const router = inject(Router);
  const localStorageService = inject(LocalStorageService);
  const postHogService = inject(PostHogService);

  /**
   * @description sets localStorage based on query params.
   */
  if (route.queryParams['ocw-admin']) {
    localStorageService.setItem('ocw-admin', route.queryParams['ocw-admin']);
    Utils.setCookie('isAdmin', '1');
    postHogService.stopForAdminSession();
  }

  /**
   * @description Check if the user is logged in.
   */
  if (
    localStorageService.appToken &&
    !route.queryParams?.token &&
    !route.queryParams?.customToken
  ) {
    return true;
  }

  const initiatedFrom = route.queryParams?.initiated_from;

  if (
    initiatedFrom &&
    (initiatedFrom === 'directDepositReceiving' ||
      initiatedFrom === 'microDepositProcessed') &&
    window.innerWidth < 768 &&
    Utils.isMobile()
  ) {
    const str = [];
    for (let i = 0; i < Object.entries(route.queryParams).length; i += 1) {
      const el = Object.entries(route.queryParams)[i];
      str.push(`${encodeURIComponent(el[0])}=${encodeURIComponent(el[1])}`);
    }
    window.location.href = `https://m.onlinecheckwriter.com/#/payee-experience?${str.join('&')}`;
    return false;
  }

  if (route.queryParams?.token || route.queryParams?.customToken) {
    if (route.queryParams?.isDeeplink) {
      localStorageService.setItem('isDeeplink', route.queryParams.isDeeplink);
    }

    /**
     * @description Used for hiding the side bar and header
     */
    if (route.queryParams?.hideNavbars === '1') {
      localStorageService.setItem('hideNavbars', '1');
    } else {
      localStorageService.getItem('hideNavbars');
      localStorageService.setItem('hideNavbars', '0');
    }

    const token = route.queryParams?.token;
    const customToken = route.queryParams?.customToken;
    const companyId = route.queryParams?.companyId;
    const params = JSON.stringify(route.queryParams);
    router.navigate(['/switch-app'], {
      queryParams: {
        returnUrl: state.url,
        token,
        customToken,
        companyId,
        params
      }
    });
    return false;
  }

  const queryParams =
    environment.env_id === 'compass-sandbox'
      ? undefined
      : { returnUrl: state.url };

  router.navigate(['/login'], {
    queryParams
  });

  return false;
};
