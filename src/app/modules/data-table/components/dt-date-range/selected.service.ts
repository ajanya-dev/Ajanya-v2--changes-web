import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  ICustomDateRangeModel,
  ISetCustomDateRange
} from 'src/app/models/common';

@Injectable({
  providedIn: 'root'
})
export class SelectedService {
  selectedValue = new BehaviorSubject<any>('Last 3 Months');
  status = new BehaviorSubject<any>(true);
  valueArray = new BehaviorSubject<any>([]);
  primaryDateRange = new BehaviorSubject<any>('All Time');
  customDateFilterArray = new BehaviorSubject<ICustomDateRangeModel>({
    fromDate: '',
    toDate: '',
    colId: ''
  });
  private selectedDate$ = new BehaviorSubject<ISetCustomDateRange>({
    fromDate: '',
    toDate: '',
    filterType: ''
  });
  //dateFilter = new BehaviorSubject<any>(true);

  setValue(val: any): void {
    this.selectedValue.next(val);
  }

  getValue(): Observable<any> {
    return this.selectedValue;
  }

  setStatus(val: any): void {
    this.status.next(val);
  }

  getStatus(): Observable<any> {
    return this.status;
  }

  setIndex(val: any): void {
    this.valueArray.next(val);
  }

  getIndex(): Observable<any> {
    return this.valueArray;
  }

  setDataTableDateRange(val: any) {
    this.primaryDateRange.next(val);
  }

  getDataTableDateRange(): Observable<any> {
    return this.primaryDateRange;
  }

  getCustomDateFilterArray() {
    return this.customDateFilterArray;
  }

  setCustomDateFilterArray(val: ICustomDateRangeModel) {
    this.customDateFilterArray.next(val);
  }
  // setDate(val: any): void {
  //   this.dateFilter.next(val);
  // }

  // getDate(): Observable<any> {
  //   return this.dateFilter;
  // }

  set selectedDateRange(data: ISetCustomDateRange) {
    this.selectedDate$.next(data);
  }

  get selectedDateRange$(): Observable<ISetCustomDateRange> {
    return this.selectedDate$.asObservable();
  }
}
