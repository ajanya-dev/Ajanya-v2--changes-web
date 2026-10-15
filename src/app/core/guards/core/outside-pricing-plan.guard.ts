import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

/**
 * Guard to prevent access to the outside pricing plan route if an app token is present in local storage.
 *
 * @param {ActivatedRouteSnapshot} route - The current activated route snapshot.
 * @returns {boolean} - True if the route can be activated, false otherwise.
 */
export const outsidePricingPlanGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot
) => {
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);

  // Extract the 'from' query parameter from the current route
  const fromPage = route.queryParams.from;
  const returnUrl = route.queryParams.page;

  // Check if the app token is present in local storage
  if (!localStorageService.appToken) {
    // Allow the route to be activated if no app token is found
    return true;
  }

  // Navigate to the manage subscription plan change page if an app token is found
  router.navigateByUrl(
    `/manage/subscription/plan?redirected=1&from=${fromPage}&page=${
      returnUrl ?? ''
    }`
  );

  // Prevent the route from being activated
  return false;
};
