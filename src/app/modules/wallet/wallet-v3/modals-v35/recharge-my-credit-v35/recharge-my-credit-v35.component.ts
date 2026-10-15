import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import {
  IRechargeCredits,
  IRechargeWalletForm,
  IWalletData
} from 'src/app/models/wallet';
import { CalculatorComponent } from 'src/app/shared/components/calculator/calculator.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from '../../../../../shared/v3/common-input-field/common-input-field.component';
import { AmountInputComponent } from '../../../../../shared/components/amount-input/amount-input.component';
import { V35ControlMessageComponent } from '../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { WalletDropdownV3Component } from '../../../../../shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-recharge-my-credit-v35',
  templateUrl: './recharge-my-credit-v35.component.html',
  styleUrls: ['./recharge-my-credit-v35.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    WalletDropdownV3Component,
    V35ControlMessageComponent,
    AmountInputComponent,
    CommonInputFieldComponent,
    CommonButtonV35Component
  ]
})
export class RechargeMyCreditV35Component implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private walletService = inject(WalletService);
  private dataTableService = inject(DataTableService);
  public wallet: IWalletData = inject(MAT_DIALOG_DATA);
  private authDataService = inject(AuthDataService);

  selectedWallet: FormControl<IWalletData> = new FormControl();
  rechargeMyCreditsForm: FormGroup<IRechargeWalletForm> = this.fb.group({
    amount: [null, [Validators.required]],
    fromWallet: [null, [Validators.required]],
    comment: ['', [Validators.required]]
  }) as FormGroup<IRechargeWalletForm>;

  isLoading = false;
  subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.changeWallet();
    this.selectedWallet.setValue(this.wallet);
  }

  /**
   * @description Changes the selected wallet and updates the corresponding form control.
   * @param {IWalletData} wallet - The selected wallet data
   */
  changeWallet() {
    this.selectedWallet.valueChanges.subscribe((walletItem) => {
      if (walletItem === null || walletItem === undefined) return;
      this.rechargeMyCreditsForm.controls.fromWallet.setValue(walletItem.uuId);
    });
  }

  /**
   * @description Constructs an object containing recharge credit information from the form values.
   * @returns {IRechargeCredits} An object representing the recharge credit information
   */
  formBody(): IRechargeCredits {
    const formValue = this.rechargeMyCreditsForm.value;
    return {
      amount: formValue.amount,
      comment: formValue.comment,
      fromWallet: formValue.fromWallet
    } as IRechargeCredits;
  }

  /**
   * @description Handles the submission of the recharge credits form.
   */
  onSubmit() {
    const alertData = {
      title: 'Success!',
      content: 'Your Credits have been Recharged Successfully.',
      close: true
    };

    this.rechargeMyCreditsForm.markAllAsTouched();
    if (this.rechargeMyCreditsForm.invalid) {
      return;
    }
    this.isLoading = true;
    this.subscriptions.push(
      this.walletService
        .rechargeCredits(this.formBody())
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.dialog.closeAll();
              this.dataTableService.setRefreshStatus(true, 20);
              this.alertService.successAlert(alertData);
              this.rechargeMyCreditsForm.reset();
            }
          },
          error: (err) => {
            if (err.error.errorCode === 631) {
              this.dialog.closeAll();
              this.authDataService.verifyEmailAndMobile(err.error.errorMsg);
            }
          }
        })
    );
  }

  openCalculator() {
    const dialogRef = this.dialog.open(CalculatorComponent, {
      maxWidth: '286px',
      width: '95%',
      data: {addAmountButton : true}
    });

    dialogRef.afterClosed().subscribe((calculatedValue) => {
      if (calculatedValue) {
        this.rechargeMyCreditsForm.patchValue({ amount: calculatedValue });
      }
    });
  }

  /**
   * @description Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
