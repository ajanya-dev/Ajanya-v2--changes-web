import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ComplianceService } from './compliance.service';

/**
 * Allows access to /compliance-freeze only when the freeze flag is true.
 * Redirects to /dashboard otherwise.
 */
export const complianceFreezeGuard = (): boolean => {
  const complianceService = inject(ComplianceService);
  const router = inject(Router);

  if (complianceService.isFrozen) {
    return true;
  }

  router.navigate(['/manage/payments-table/index']);
  return false;
};
