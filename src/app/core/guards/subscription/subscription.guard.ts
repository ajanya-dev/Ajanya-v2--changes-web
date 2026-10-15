import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HeaderService } from 'src/app/shared/service/header/header.service';

/**
 * @description This is a guard function that checks if the user has a subscription
 * @returns  A boolean indicating whether the user has access to the route.
 */
export const SubscriptionGuard = ():
  | Observable<boolean | UrlTree>
  | Promise<boolean | UrlTree>
  | boolean
  | UrlTree => {
  /**
   * @description Injecting dependencies using inject method
   */
  const headerService = inject(HeaderService);
  const router = inject(Router);

  /**
   * @description Get the user's subscription data
   */
  return headerService.hearderdata().pipe(
    map((e) => {
      if (e?.data?.isSubscribed) {
        return true;
      } else {
        /**
         * @description If the user is not subscribed, redirect them to the subscription page
         */
        router.navigate(['manage/subscription-required']);
        return false;
      }
    })
  );
};
