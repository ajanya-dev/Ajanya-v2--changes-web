import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { CurrencyPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DefaultPaymentMethodV4Component } from 'src/app/shared/modal/payee-modal/default-payment-method-v4/default-payment-method-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CheckProcessService } from '../../../services/check-process.service';
import {
  ICheckProcessData,
  ICheckProcessErrorValue,
  ICheckProcessModalData,
  IProcessCheck
} from '../../../model/check';

interface ICheckData {
  checkId: string;
  payMethod: string | number;
  payeeEmail: string;
}

@Component({
  selector: 'app-check-process-modal-v4',
  templateUrl: './check-process-modal-v4.component.html',
  styleUrls: ['./check-process-modal-v4.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    CurrencyPipe
  ]
})
export class CheckProcessModalV4Component implements OnInit, OnDestroy {
  private checkProcessService = inject(CheckProcessService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<CheckProcessModalV4Component>);
  private alertService = inject(V4AlertService);
  private checkService = inject(CheckService);
  public data: ICheckProcessModalData = inject(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  getprocessdata: ICheckProcessData[] = [];
  checkData: IProcessCheck;
  showUpdateBtn = false;
  updateCheckNo = '';
  loading = signal(false);

  ngOnInit(): void {
    this.getCheckProcessData();
  }

  getCheckProcessData(): void {
    const payload: { cheque_id: string[] } = { cheque_id: [] };
    this.data.data.forEach((el) => payload.cheque_id.push(el));
    this.loading.set(true);
    this.subscriptions.push(
      this.checkService
        .getprocesscheck(payload)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe((res) => {
          this.getprocessdata = res.data;
        })
    );
  }

  getMethodLabel(
    data: string | number,
    checkNo: string,
    item: ICheckProcessData
  ): string {
    const method = Number(data);
    if (method === 1) {
      this.showUpdateBtn = false;
      return 'Print Check';
    }
    if (method === 2) {
      this.showUpdateBtn = false;
      return 'Mail Check';
    }
    if (method === 3) {
      this.showUpdateBtn = false;
      return 'Direct Deposit';
    }
    if (method === 4) {
      this.showUpdateBtn = false;
      return 'Email Check';
    }
    if (method === 5 && !item.payee.payeeId) {
      this.showUpdateBtn = true;
      return 'Blank Check';
    }
    if ((data == null || data === '') && item.payee.payeeId) {
      this.showUpdateBtn = true;
      this.updateCheckNo = checkNo;
      return 'No Default Payment Method';
    }
    return '';
  }

  editPayee(payeeId: string): void {
    const dialogRef = this.dialog.open(DefaultPaymentMethodV4Component, {
      width: '550px',
      disableClose: true,
      data: { payeeId },
      panelClass: 'paddingless-modal-rounded'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getCheckProcessData();
      }
    });
  }

  processNow(): void {
    const processData = {
      processCheckTemplete: 1,
      data: [] as ICheckData[]
    };

    let hasNoMethod = false;
    this.getprocessdata.forEach((el) => {
      if (el.paymentMethod == null || el.paymentMethod === '') {
        hasNoMethod = true;
      } else {
        processData.data.push({
          checkId: el.id,
          payMethod: el.paymentMethod,
          payeeEmail: el.payee.payeeEmail
        });
      }
    });

    if (hasNoMethod) {
      this.alertService.warningAlert({
        content:
          'Unable to process. Update any of the payment methods for all the checks'
      });
      return;
    }

    this.loading.set(true);
    this.subscriptions.push(
      this.checkService
        .processchecks(processData)
        .pipe(
          finalize(() => this.loading.set(false)),
          catchError((err) => {
            const errValues: ICheckProcessErrorValue[] =
              err.error?.errorMsg?.values ?? [];
            this.getprocessdata = this.getprocessdata.map((row) => {
              const match = errValues.find((v) => v.checkId === row.id);
              if (match) {
                return {
                  ...row,
                  errorMsg: match.errorMsg || 'Not processable'
                };
              }
              return row;
            });
            return of(err);
          })
        )
        .subscribe((res) => {
          this.checkData = res.data;
          if (res.success) {
            this.checkProcessService.openCheckProcessLoadingModalV4(
              this.checkData,
              this.data.RowData,
              this.data.status
            );
            this.dialogRef.close();
          }
        })
    );
  }

  removeRow(index: number): void {
    this.getprocessdata.splice(index, 1);
    if (this.getprocessdata.length === 0) {
      this.dialogRef.close();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
