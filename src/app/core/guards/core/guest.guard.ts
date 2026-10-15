import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { resolveRecurringReturnUrl } from 'src/app/shared/service/route/v4-route-mapper';
import { environment } from 'src/environments/environment';

/**
 * @description This is a guard function that checks if the user is a guest
 * @returns A boolean indicating whether the user has access to the route.
 */
export const guestGuard = (route: ActivatedRouteSnapshot):
  | Observable<boolean | UrlTree>
  | Promise<boolean | UrlTree>
  | boolean
  | UrlTree => {
  /**
   * @description Injecting dependencies using inject method
   */
  const router = inject(Router);
  const localStorageService = inject(LocalStorageService);

  /**
   * @description Check for cardProgramWalletGiftCard redirect first
   */
  const initiatedFrom = route.queryParams?.initiated_from;
  if (initiatedFrom && initiatedFrom === 'cardProgramWalletGiftCard' && window.innerWidth < 768 && Utils.isMobile()) {
    const str = [];
    for (let i = 0; i < Object.entries(route.queryParams).length; i += 1) {
      const el = Object.entries(route.queryParams)[i];
      str.push(`${encodeURIComponent(el[0])}=${encodeURIComponent(el[1])}`);
    }

    const ocwUrl = environment.env_id === 'production' ? 'https://virtual-card.zil.us' :'https://staging-card.zil.us';
    
    const redirectUrl = environment.env_id === 'zilMoney'
      ? `https://virtual-card.zil.us?${str.join('&')}`
      : `${ocwUrl}?${str.join('&')}`;

    window.location.href = redirectUrl; 
    return false;
  }

  /**
   * @description Check if the user is logged in.
   */
  const {appToken} = localStorageService;
  const {returnUrl} = route.queryParams;

  if (appToken) {
    const resolvedRecurringUrl = returnUrl
      ? resolveRecurringReturnUrl(
          returnUrl,
          localStorageService.getItem('isV4LayoutEnabled') === 1
        )
      : null;
    const destinationUrl =
      resolvedRecurringUrl || returnUrl || 'manage/cheque/checkrecords';
    router.navigateByUrl(destinationUrl);
    return false;
  }

  return true;
};
