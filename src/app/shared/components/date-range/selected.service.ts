import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SelectedDateService {
  selectedValue = new BehaviorSubject<string>('All Time');
  status = new BehaviorSubject<boolean>(true);
  valueArray = new BehaviorSubject<number>(0);

  setValue(val: string): void {
    this.selectedValue.next(val);
  }

  getValue(): Observable<string> {
    return this.selectedValue;
  }

  setStatus(val: boolean): void {
    this.status.next(val);
  }

  getStatus(): Observable<boolean> {
    return this.status;
  }
}
