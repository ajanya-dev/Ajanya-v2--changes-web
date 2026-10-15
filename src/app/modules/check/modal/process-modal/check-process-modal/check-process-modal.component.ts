import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { DefaultPaymentMethodComponent } from 'src/app/shared/modal/payee-modal/default-payment-method/default-payment-method.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTriangleExclamation, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CheckProcessService } from '../../../services/check-process.service';
import { ICheckProcessData, ICheckProcessError, ICheckProcessErrorValue, ICheckProcessModalData, IProcessCheck } from '../../../model/check';

interface ICheckData {
  checkId: string;
  payMethod: string | number;
  payeeEmail: string;
 }

@Component({
  selector: 'app-check-process-modal',
  templateUrl: './check-process-modal.component.html',
  styleUrls: ['./check-process-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose,FontAwesomeModule,CommonButtonV35Component]
})
export class CheckProcessModalComponent implements OnInit, OnDestroy {

  private checkProcessService = inject(CheckProcessService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<CheckProcessModalComponent>);
  private alertservice = inject(AlertService);
  private checkService = inject(CheckService);
  public data: ICheckProcessModalData = inject(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  getprocessdata: ICheckProcessData[];
  checkData: IProcessCheck;
  ismodal = false;
  default = false;
  error = false;
  err: ICheckProcessError;
  erroeArr: ICheckProcessErrorValue[] = [];
  checkNo: string;
  method: boolean;
  faXmark = faXmark;
  faExclamation = faTriangleExclamation;
  loading = false;

  ngOnInit(): void {
    this.getCheckProcessData();    
  }

  /** Get Check process Data  */

  getCheckProcessData() {
    const data:{cheque_id:string[]} = {cheque_id:[]};
    this.data.data.forEach((el) => {
      data.cheque_id.push(el);
    });
    this.loading = true;
    this.subscriptions.push(
      this.checkService.getprocesscheck(data).pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        this.getprocessdata = res.data;
      })
    );
  }

  /** Set Method  */

  checkMethod(data: string | number, CheckNo: string, item: ICheckProcessData):string {
    const paymentMetthod = Number(data);
    if (paymentMetthod === 1) {
      this.default = false;
      return 'printable check';
    } if (paymentMetthod === 2) {
      this.default = false;
      return 'Mail check';
    } if (paymentMetthod === 3) {
      this.default = false;
      return 'DD check';
    } if (paymentMetthod === 4) {
      this.default = false;
      return 'Email check';
    } if ((data == null || data === '') && item.payee.payeeId) {
      this.default = true;
      this.checkNo = CheckNo;
      return 'No Default Payment Method';
    } if (paymentMetthod === 5 && !item.payee.payeeId) {
      this.default = true;
      return 'Blank check';
    }
    return '';
  }

  editpayee(payeeId: string) {
    const dialogRef = this.dialog.open(DefaultPaymentMethodComponent, {
      width: '550px',
      disableClose: true,
      data: {
        payeeId
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getCheckProcessData();
      }
    });
  }

  /** process Data */

  processNow() {
    const processData = {
      processCheckTemplete: 1,
      data: [] as ICheckData[]
    };

    this.getprocessdata.forEach((el) => {
      if (el.paymentMethod == null || el.paymentMethod === '') {
        this.method = true;
      } else {
        this.method = false;
        processData.data.push({
          checkId: el.id,
          payMethod: el.paymentMethod,
          payeeEmail: el.payee.payeeEmail
        });
      }
    });

    if (this.method) {
      this.alertservice.warningAlert({
        content:
          'Unable to process. Update any of the payment methods for all the checks'
      });
    } else {
      this.subscriptions.push(
        this.checkService
          .processchecks(processData)
          .pipe(
            catchError((err) => {
              this.erroeArr = err.error.errorMsg.values;
              for (let index = 0; index < this.getprocessdata.length; index += 1) {
                this.erroeArr.forEach((val) => {
                  if (this.getprocessdata[index].id === val.checkId) {
                    this.getprocessdata[index].errorMsg = val.errorMsg
                      ? val.errorMsg
                      : 'Not processable';
                  }
                });
              }

              this.err = err.error;
              if (this.err.success === false) {
                this.error = true;
              }
              return of(err);
            })
          )
          .subscribe((res) => {
            this.checkData = res.data;
            if (res.success) {
              this.checkProcessService.openCheckProcessLoadingModal(this.checkData,this.data.RowData,this.data.status);
              this.dialogRef.close();
            }
          })
      );
    }
  }

  removedata(i: number) {
    this.getprocessdata.splice(i, 1);
    if (this.getprocessdata.length === 0) {
      this.dialogRef.close();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
