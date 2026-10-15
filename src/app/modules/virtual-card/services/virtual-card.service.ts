import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ICardOnBoardingStatus } from 'src/app/models/wallet';
import { IApiRes } from 'src/app/models/api';

@Injectable({ providedIn: 'root' })
export class VirtualCardService implements OnDestroy {
  private http = inject(HttpClient);

  private rootUrl = environment.rootUrl;

  esignAccepted = signal(false);
  termsAccepted = signal(false);
  termsAccepted5 = signal(false);
  termsAccepted6 = signal(false);

  getCardOnboardingStatus() {
    return this.http.get<IApiRes<ICardOnBoardingStatus>>(
      `${this.rootUrl}/banking-as-service/card-program-onboarding-status`
    );
  }

  mapWalletToBusiness(payload: { businessId: string; walletId: string[] }) {
    return this.http.post<IApiRes<never>>(
      `${this.rootUrl}/banking-as-service/map-wallet-to-business`,
      payload
    );
  }

  ngOnDestroy(): void {
    this.esignAccepted.set(false);
    this.termsAccepted.set(false);
    this.termsAccepted5.set(false);
    this.termsAccepted6.set(false);
  }
}
