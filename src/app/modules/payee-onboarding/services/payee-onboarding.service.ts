import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { IPersonalInfo } from 'src/app/layout/model/header';
import { IOnBoardingPayeeWalletDetails } from 'src/app/models/wallet';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

export interface IPayeeOnBoardingDetails {
  initiatedFrom: 'directDepositReceiving' | 'microDepositProcessed';
  initiatorId: string;
  externalToken: string;
  isNewUser: number;
}

@Injectable({
  providedIn: 'root'
})
export class PayeeOnboardingService implements OnDestroy {
  private localStorageService = inject(LocalStorageService);

  public payeeOnboardingSignal = signal<Partial<IPayeeOnBoardingDetails>>({
    initiatorId: this.localStorageService.getItem('payeeObInitId'),
    externalToken: this.localStorageService.getItem('payeeObExtToken'),
    initiatedFrom: this.localStorageService.getItem('payeeObInitFrom'),
    isNewUser: this.localStorageService.getItem('payeeObIsNewUser')
  });

  payeeWalletDataSignal = signal<IOnBoardingPayeeWalletDetails | undefined>(
    undefined
  );

  /** Set on magic-link arrival so the wallets page opens the withdraw modal once. */
  openWithdrawOnArrival = signal(false);

  public userDetailsSignal = signal<IPersonalInfo | undefined>(undefined);

  ngOnDestroy(): void {
    [this.payeeWalletDataSignal, this.userDetailsSignal].forEach((val) =>
      val.set(undefined)
    );
    this.payeeOnboardingSignal.set({});
    this.openWithdrawOnArrival.set(false);
  }
}
