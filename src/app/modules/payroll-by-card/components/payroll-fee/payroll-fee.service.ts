import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class PayrollFeeService {
  amount = signal<{ amount: number | undefined; rowId: string | undefined }>({
    amount: undefined,
    rowId: undefined
  });

  newAmount$ = toObservable(this.amount);
}
