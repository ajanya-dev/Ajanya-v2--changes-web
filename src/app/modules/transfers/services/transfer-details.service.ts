import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ITransferDetails {
  /**
   * 1. Bank Accounts
   * 2. Wallet
   * 3. Cloud Bank
   */
  transferFrom: number;
  transferFromId: string;
  displayName: string;
  transferFromIdForCloud?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TransferDetailsService {
  private transferDetails$ = new BehaviorSubject({
    transferFrom: 2,
    transferFromId: '',
    displayName: ''
  });

  getData(): Observable<ITransferDetails> {
    return this.transferDetails$;
  }

  setData(value: ITransferDetails) {
    this.transferDetails$.next(value);
  }

  /**
   * @description reset the behaviour subject
   */
  resetData() {
    this.setData({
      transferFrom: 2,
      transferFromId: '',
      displayName: ''
    });
  }
}
