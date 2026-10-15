import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IPayeeBankVerificationReminderRes } from 'src/app/models/payee-bank-verification';

@Injectable({
  providedIn: 'root'
})
export class PayeeBankVerificationService {
  private http = inject(HttpClient);
  private root = environment.rootUrl;

  /**
   * Resends the payee bank verification reminder for a ZilPayment.
   * Route: POST /api/v4/zil-payments/{uu_id}/resend-payee-bank-verification
   */
  resendPayeeBankVerification(uuId: string) {
    return this.http.post<IPayeeBankVerificationReminderRes>(
      `${this.root}/zil-payments/${uuId}/resend-payee-bank-verification`,
      {}
    );
  }
}
