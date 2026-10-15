import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CompanyManagementService } from 'src/app/shared/service/company/company-management.service';
import { IonBoardingDetails } from 'src/app/modules/onboarding/model/onBoarding';
import { environment } from 'src/environments/environment';
import { WhatsNewService } from '../../../shared/service/whats-new/whats-new.service';

/**
 * @description This function is a guard that checks if the user has selected a company.
 * If the user has not selected a company and is not in the onboarding process, it will redirect to the company management page.
 * If the user is in the onboarding process, it will redirect to the onboarding step 1 page.
 * If the user has completed onboarding step 1 and has logged in more than 5 times, it will redirect to onboarding step 2 page.
 */
export const companySwitchingGuard = (
  route: ActivatedRouteSnapshot
): boolean => {
  /**
   * @description Injecting dependencies using inject method
   */
  const companySwitchService = inject(CompanyManagementService);
  const alertService = inject(AlertService);
  const router = inject(Router);
  const localStorageService = inject(LocalStorageService);
  const whatsNewService = inject(WhatsNewService);

  const env = environment;

  /**
   * @description This function opens a warning alert when there is no active company selected.
   */
  function openWarningAlert() {
    const data = {
      content: 'You have to select one company'
    };
    return alertService.warningAlert(data);
  }

  /**
   * @description Check if the user has completed onboarding
   */
  const onboardingData: IonBoardingDetails =
    localStorageService.getOnboardingData();
  // eslint-disable-next-line eqeqeq
  if (localStorageService.getItem('policyPending') == '2') {
    router.navigateByUrl('/manage/onboarding/termsAndConditions');
  } else if (
    env.env_id !== 'compass' && env.env_id !== 'csnhc' &&
    onboardingData &&
    onboardingData.onBoardStatus === 'not_onboarded'
  ) {
    router.navigateByUrl('/manage/verification/index');
    whatsNewService.isOnboarding = true;
  } else if (
    env.env_id !== 'compass' && env.env_id !== 'csnhc' &&
    onboardingData &&
    (onboardingData.onBoardStatus === 'step1_completed' ||
      onboardingData.onBoardStatus === 'step1_skip_clicked' ||
      onboardingData.onBoardStatus === 'step1_no_clicked') &&
    onboardingData?.onBoardingLoginCount &&
    onboardingData?.onBoardingLoginCount[0] &&
    onboardingData.onBoardingLoginCount[0] > 5
  ) {
    whatsNewService.routeUserBasedOnVideoFlag('/manage/onboarding/step2', '');
  } else {
    if (companySwitchService.checkActiveCompanyIdExist()) {
      return true;
    }

    if (route.queryParams?.token) {
      // For switch live to beta mode
      return true;
    }

    /**
     * @description Check if the user is logged in.
     */
    if (localStorageService.appToken) {
      openWarningAlert();
      router.navigateByUrl('/manage/company_management');
    }
  }

  return true;
};
