import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RecurringService {
  toggleNumber = new BehaviorSubject(1); //  1 for GPBF Recurring
  //  2 for ACH Recurring

  setToggle(val: number) {
    this.toggleNumber.next(val);
  }

  getToggle() {
    return this.toggleNumber;
  }
}
