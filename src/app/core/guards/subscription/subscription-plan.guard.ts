import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

/**
 * @description This is a guard function that checks if the user has a subscription plan
 * @param _route - The activated route snapshot.
 * @param state - The router state snapshot.
 * @returns A boolean indicating whether the user has access to the route.
 */
export const SubscriptionPlanGuard = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
):
  | Observable<boolean | UrlTree>
  | Promise<boolean | UrlTree>
  | boolean
  | UrlTree => {
  /**
   * @description Injecting dependencies using inject method
   */
  const router = inject(Router);
  const headerService = inject(HeaderService);
  const localStorageService = inject(LocalStorageService);

  /**
   * @description Get the user's subscription data
   */
  return headerService.hearderdata().pipe(
    map((e) => {
      const url = state.url.split('?')[0];
      const queryParams = new URLSearchParams(state.url.split('?')[1] || '');
      const type = queryParams?.get('type');
      const isV4 = localStorageService.getItem('isV4LayoutEnabled') === 1;
      const prefix = isV4 ? 'v4/manage' : 'manage';

      /**
       * @description Check if the user is on the subscription plan page
       */
      if (url === '/manage/subscription/plan' || url === '/v4/manage/subscription/plan') {
        /**
         * @description If the user is not subscribed or their subscription has ended, allow them to access the page
         */
        if (!e?.data?.isSubscribed && !e?.data?.isSubscribedEnd) {
          return true;
        }
        /**
         * @description If the user is subscribed or their subscription has not ended, redirect them to the dashboard
         */
        const navigationExtras: { queryParams?: { type: string } } = {};
        if (type) {
          navigationExtras.queryParams = { type };
        }
        if (isV4) {
          router.navigate(['/v4/manage/user-profile/index'], { queryParams: { tab: 'myPlan' } });
        } else {
          router.navigate(['manage/subscription/dashboard'], navigationExtras);
        }
        return false;
      }

      /**
       * @description If the user is subscribed or their subscription has not ended, allow them to access the page
       */
      if (e?.data?.isSubscribed || e?.data?.isSubscribedEnd) {
        return true;
      }

      /**
       * @description If the user is not subscribed or their subscription has ended, redirect them to the subscription plan page
       */
      const navigationExtras: { queryParams?: { type: string } } = {};
      if (type) {
        navigationExtras.queryParams = { type };
      }
      router.navigate([`${prefix}/subscription/plan`], navigationExtras);
      return false;
    })
  );
};
