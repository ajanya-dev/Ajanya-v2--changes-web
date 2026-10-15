import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

export const dynamicPolicyGuard: CanActivateFn = () => {
  const router = inject(Router);
  const localStorageService = inject(LocalStorageService);

  if (
    localStorageService.getItem('policyPending') === '1' ||
    localStorageService.getItem('policyPending') === '2'
  ) {
    router.navigateByUrl('/manage/company_management');
    return false;
  } else {
    return true;
  }
};
