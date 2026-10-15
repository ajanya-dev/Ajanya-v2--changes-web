import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from '../storage/local-storage.service';

export interface IEmailPhoneVerificationState {
  email_verified?: number | null;
  phone_verified?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class VerificationMessageService {
  private localStorageService = inject(LocalStorageService);

  /**
   * @description Builds the warning message naming only the credentials that are still unverified.
   * @param state - User verification state. When omitted, the `emailVerified` and
   * `phoneVerified` local storage flags are used instead.
   */
  getVerificationMessage(state?: IEmailPhoneVerificationState | null): string {
    const isEmailVerified = state
      ? !!state.email_verified
      : this.localStorageService.getItem('emailVerified') === 1;
    const isPhoneVerified = state
      ? !!state.phone_verified
      : this.localStorageService.getItem('phoneVerified') === 1;

    if (!isEmailVerified && !isPhoneVerified) {
      return 'Please verify email and phone number.';
    }

    return isEmailVerified
      ? 'Please verify phone number.'
      : 'Please verify email.';
  }
}
