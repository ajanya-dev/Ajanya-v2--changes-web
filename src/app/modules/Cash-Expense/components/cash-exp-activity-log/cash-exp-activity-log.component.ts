import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChange,
  SimpleChanges
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { DeviceModalComponent } from 'src/app/shared/modal/device-modal/device-modal/device-modal.component';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-cash-exp-activity-log',
  templateUrl: './cash-exp-activity-log.component.html',
  styleUrls: ['./cash-exp-activity-log.component.scss'],
  standalone: true,
  imports: [NgIf, NgFor]
})
export class CashExpActivityLogComponent implements OnChanges, OnDestroy {
  activityData: any;
  @Input() cashExpenseId: any;
  @Input() fromModal = false;
  subscriptions: Subscription[] = [];

  constructor(
    public __dialog: MatDialog,
    private _cashExpenseService: CashExpenseService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const cashExpenseId: SimpleChange = changes.cashExpenseId;
    this.cashExpenseId = cashExpenseId.currentValue;
    if (cashExpenseId != undefined) this.loadCashExpenseActivity();
  }
  editDeviceName(): void {
    this.__dialog.open(DeviceModalComponent, {
      maxWidth: '510px',
      width: '93%'
    });
  }

  loadCashExpenseActivity(): void {
    this.subscriptions.push(
      this._cashExpenseService
        .getCashExpenseActivity(this.cashExpenseId)
        .subscribe((res: any) => {
          if (res.success == true) {
            this.activityData = res.data;
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
