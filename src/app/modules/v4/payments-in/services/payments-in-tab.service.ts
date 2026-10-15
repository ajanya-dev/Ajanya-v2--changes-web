import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface PaymentsInTabSwitch {
  tab: string;
  subTab?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsInTabService {
  private tabSwitch$ = new Subject<PaymentsInTabSwitch>();

  readonly onTabSwitch = this.tabSwitch$.asObservable();

  switchTab(data: PaymentsInTabSwitch): void {
    this.tabSwitch$.next(data);
  }
}
