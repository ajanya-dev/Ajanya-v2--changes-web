import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { Component, inject, OnDestroy } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormControl
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IBankData } from 'src/app/models/bank';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-change-starting-number',
  templateUrl: './change-starting-number.component.html',
  styleUrls: ['./change-starting-number.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    FaIconComponent
  ]
})
export class ChangeStartingNumberComponent implements OnDestroy {
  private bankAccService = inject(BankAccountsService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<ChangeStartingNumberComponent>);
  public injectData = inject<IBankData>(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  loading = false;
  faXmark = faXmark;
  checkNumber = new FormControl('', [Validators.required]);

  /**
   * @description  Submits the form data for changing the starting number.
   *
   */
  submit() {
    this.checkNumber.markAllAsTouched();
    if (this.checkNumber.invalid) {
      return;
    }
    const processeData = {
      newValue: this.checkNumber.value as string
    };
    this.loading = true;

    this.subscriptions.push(
      this.bankAccService
        .changeStartinNo(this.injectData.encrypted_bankacc_id, processeData)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const data = {
              title: false,
              content: 'Updated',
              close: true,
              timeout: 2000
            };
            this.alertService.successAlert(data);
            this.dialogRef.close(processeData);
          }
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
