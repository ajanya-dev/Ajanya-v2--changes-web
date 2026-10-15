import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IBankData } from 'src/app/models/bank';

@Injectable({
  providedIn: 'root'
})
export class UserV3DataService {
  bankData$ = new BehaviorSubject<IBankData>({} as IBankData);

  setBankData(data: IBankData) {
    this.bankData$.next(data);
  }

  getBankData() {
    return this.bankData$;
  }
}
