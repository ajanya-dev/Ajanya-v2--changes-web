import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot
} from '@angular/router';
import { PayeeOnboardingService } from 'src/app/modules/payee-onboarding/services/payee-onboarding.service';

export const canActivatePayeeOnboarding: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const payeeOnBoardingService = inject(PayeeOnboardingService);

  const params = _route.queryParams;
  const hasQueryParams =
    params.initiator_id && params.externalToken && params.initiated_from;

  const signal = payeeOnBoardingService.payeeOnboardingSignal();
  const hasSignal =
    signal.initiatorId && signal.externalToken && signal.initiatedFrom;

  return hasQueryParams || hasSignal
    ? true
    : router.createUrlTree(['/manage/home']);
};
