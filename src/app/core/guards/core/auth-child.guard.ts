import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { Redirections } from 'src/app/data/data/redirections';

/**
 * @description This function is used as a guard for child routes.
 * @param _childRoute - The child route.
 * @param state - The router state snapshot.
 * @returns A boolean indicating whether the user has access to the child route.
 */
export const authChildGuard = (
  _childRoute: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean => {
  /**
   * @description Injecting dependencies using inject method
   */
  const localStorageService = inject(LocalStorageService);
  const router = inject(Router);

  const restrictedURL = ['/manage/cheque/checkrecords'];

  /**
   * @description This function checks whether the user has access to the specified URL.
   * @param url - The URL to check.
   * @returns A boolean indicating whether the user has access to the URL.
   */
  function isAccessDenied(url: string): boolean {
    let isDenied = false;
    if (localStorageService.getItem('hideNavbars') === '1') {
      if (restrictedURL.includes(url)) isDenied = true;
      else isDenied = false;
    } else {
      isDenied = false;
    }
    return isDenied;
  }

  if (isAccessDenied(state.url)) {
    router.navigateByUrl(
      state.url.includes('v4') ? '/v4/manage/permission-denied' : '/manage/permission-denied'
    );
    return false;
  }

  const redirections = Redirections.v2RedirectionsInV3();
  const redirection =
    redirections.find((ele) => state.url.indexOf(ele.path) === 0) ?? false;

  if (redirection) {
    router.navigate([redirection.redirect]);
    return false;
  }
  return true;
};
