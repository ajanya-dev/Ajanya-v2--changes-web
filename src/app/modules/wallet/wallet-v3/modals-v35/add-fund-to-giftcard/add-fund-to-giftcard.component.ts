import { Component, inject, OnDestroy } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormControl,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { finalize, Subscription } from 'rxjs';
import { AmountInputComponent } from 'src/app/shared/components/amount-input/amount-input.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { IAddFund } from 'src/app/models/wallet';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { WalletDataV35Service } from '../../services/wallet-data-v35.service';

@Component({
  selector: 'app-add-fund-to-giftcard',
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    V35ControlMessageComponent,
    AmountInputComponent,
    CommonButtonV35Component
  ],
  templateUrl: './add-fund-to-giftcard.component.html',
  styleUrl: './add-fund-to-giftcard.component.scss'
})
export class AddFundToGiftcardComponent implements OnDestroy {
  // private fb = inject(FormBuilder);
  private walletService = inject(WalletService);
  private dialogRef = inject(MatDialogRef<AddFundToGiftcardComponent>);
  private authDataService = inject(AuthDataService);
  private alertService = inject(AlertService);
  private walletDataService = inject(WalletDataV35Service);
  public cardId: string = inject(MAT_DIALOG_DATA);

  amount = new UntypedFormControl(null, [Validators.required]);

  isLoading = false;
  subscriptions: Subscription[] = [];

  faXMark = faXmark;

  formBody(): IAddFund {
    return {
      cardId:
        this.cardId ??
        this.walletDataService.selectedGiftCardSignal()?.id ??
        '',
      amount: this.amount.value
    };
  }

  addFund() {
    this.amount.markAllAsTouched();
    if (this.amount.valid) {
      const confirmRef = this.alertService.confirmAlert({
        content: 'You want to Recharge the Gift Card '
      });
      confirmRef.afterClosed().subscribe((res) => {
        if (res) {
          this.onSubmit();
        }
      });
    }
  }

  onSubmit() {
    this.isLoading = true;
    this.subscriptions.push(
      this.walletService
        .addFundToGiftCard(this.formBody())
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              // Close this dialog with success result
              this.dialogRef.close({ success: true });

              this.alertService.successAlert({
                content: 'The Gift card has been recharged successfully.',
                close: true,
                timeout: 2500
              });
              this.amount.reset();
            }
          },
          error: (err) => {
            if (err.error.errorCode === 631) {
              this.dialogRef.close();
              this.authDataService.verifyEmailAndMobile(err.error.errorMsg);
            }
          }
        })
    );
  }

  get controlMessage() {
    const { invalid, value } = this.amount;
    if (invalid && !value) {
      return 'Amount is required';
    }
    return '';
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
