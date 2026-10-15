import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { IPayeeData } from '../../model/payee';

@Component({
  selector: 'app-payee-merge-modal',
  templateUrl: './payee-merge-modal.component.html',
  styleUrls: ['./payee-merge-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, MatDialogActions, CommonButtonV35Component, FontAwesomeModule, NgClass]
})
export class PayeeMergeModalComponent implements OnInit, OnDestroy {
  subscription: Subscription[] = [];
  selectedPayee: IPayeeData;
  payeeIds: string[] = [];
  loading: boolean = false;

  faXmark = faXmark;

  private payeeService = inject(PayeeService);
  public dialogRef = inject(MatDialogRef<PayeeMergeModalComponent>);
  public alertService = inject(AlertService);
  public payeeData = inject<IPayeeData[]>(MAT_DIALOG_DATA);

  ngOnInit(): void {
    this.payeeData.forEach((payee) => {
      this.payeeIds.push(payee.encrypted_id);
    });
  }

  mergePayee() {
    if (!this.selectedPayee) {
      this.alertService.warningAlert({
        content: 'Please select a master payee to merge'
      });
    } else {
      this.loading = true;
      this.subscription.push(
        this.payeeService
          .mergePayee({
            selectedMasterPayeeId: this.selectedPayee.encrypted_id,
            selectedPayeeIds: this.payeeIds
          })
          .pipe(
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe((response) => {
            if (response.success) {
              const data = {
                title: 'Success!',
                content: response.data,
                close: true,
                timeout: 3000
              };
              this.alertService.successAlert(data);
              this.dialogRef.close({ success: response.success });
            }
          })
      );
    }
  }

  selectPayee(event: Event, payee: IPayeeData) {
    this.selectedPayee = payee;
  }

  ngOnDestroy(): void {
    this.subscription.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
