import { Router } from '@angular/router';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WhatsNewService {
  private router = inject(Router);

  isVideoSeenFlag: boolean | undefined = undefined;
  isCompanyZero = false;
  isOnboarding = false;
  redirectToUrl = '';

  routeUserBasedOnVideoFlag(returnUrl: string, ifCompanyZeroReturnUrl: string) {
    if (this.isCompanyZero === false) {
      this.redirectToUrl = returnUrl || '/manage/company_management';
    } else {
      this.redirectToUrl = ifCompanyZeroReturnUrl;
    }
    // navigateByUrl parses query/fragment; navigate([str]) would percent-encode `?`.
    this.router.navigateByUrl(this.redirectToUrl);
  }
}
