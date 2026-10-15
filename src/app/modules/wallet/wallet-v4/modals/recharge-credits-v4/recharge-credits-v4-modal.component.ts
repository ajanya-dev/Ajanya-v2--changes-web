import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { debounceTime, finalize, take } from 'rxjs';
import {
  IRechargeCredits,
  IRechargeWalletForm,
  IWalletData
} from 'src/app/models/wallet';
import { CalculatorComponent } from 'src/app/shared/components/calculator/calculator.component';
import { WalletDataV35Service } from 'src/app/modules/wallet/wallet-v3/services/wallet-data-v35.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonAmountInputV4Component } from 'src/app/shared/V4/common-amount-input-v4/common-amount-input-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { WalletDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/wallet-dropdown-v4/wallet-dropdown-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LucideAngularModule, X, Calculator } from 'lucide-angular';

@Component({
  selector: 'app-recharge-credits-v4-modal',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatDialogModule,
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    WalletDropdownV4Component,
    V4ControlMessageComponent,
    CommonAmountInputV4Component,
    CommonInputFieldV4Component,
    CommonButtonV4Component
  ],
  templateUrl: './recharge-credits-v4-modal.component.html',
  styleUrls: ['./recharge-credits-v4-modal.component.scss']
})
export class RechargeCreditsV4ModalComponent implements OnInit {
  readonly XIcon = X;
  readonly CalculatorIcon = Calculator;

  private fb = inject(FormBuilder);
  private walletService = inject(WalletService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<RechargeCreditsV4ModalComponent>);
  private walletDataService = inject(WalletDataV35Service);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  wallet: IWalletData = inject(MAT_DIALOG_DATA);

  selectedWallet: FormControl<IWalletData> = new FormControl();
  rechargeMyCreditsForm: FormGroup<IRechargeWalletForm> = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
    fromWallet: [null, [Validators.required]],
    comment: ['', [Validators.required]]
  }) as FormGroup<IRechargeWalletForm>;

  loading = signal(false);

  private selectedWalletData: IWalletData | null = null;
  private isInsufficientBalanceAlertShowing = false;

  ngOnInit(): void {
    this.changeWallet();
    this.handleAmountChange();
    this.selectedWallet.setValue(this.wallet);
  }

  changeWallet(): void {
    this.selectedWallet.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((walletItem) => {
        if (walletItem === null || walletItem === undefined) return;
        this.selectedWalletData = walletItem;
        this.rechargeMyCreditsForm.controls.fromWallet.setValue(
          walletItem.uuId
        );
        this.checkInsufficientBalance();
      });
  }

  private handleAmountChange(): void {
    this.rechargeMyCreditsForm.controls.amount.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.checkInsufficientBalance());
  }

  private checkInsufficientBalance(): void {
    if (!this.selectedWalletData || this.isInsufficientBalanceAlertShowing) {
      return;
    }
    const amount = Number(this.rechargeMyCreditsForm.controls.amount.value) || 0;
    const availableBalance =
      parseFloat(this.selectedWalletData.availableBalance) || 0;
    if (amount > 0 && amount > availableBalance) {
      this.isInsufficientBalanceAlertShowing = true;
      this.alertService
        .infoAlert({
          content:
            'Insufficient balance on wallet. Please choose another wallet.',
          doneMsg: 'OK'
        })
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.isInsufficientBalanceAlertShowing = false;
          this.selectedWalletData = null;
          this.selectedWallet.reset();
          this.rechargeMyCreditsForm.controls.fromWallet.setValue(null);
        });
    }
  }

  formBody(): IRechargeCredits {
    const formValue = this.rechargeMyCreditsForm.value;
    return {
      amount: formValue.amount,
      comment: formValue.comment,
      fromWallet: formValue.fromWallet
    } as IRechargeCredits;
  }

  onSubmit(): void {
    this.rechargeMyCreditsForm.markAllAsTouched();
    if (this.rechargeMyCreditsForm.invalid) return;

    this.loading.set(true);
    this.walletService
      .rechargeCredits(this.formBody())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dialogRef.close();
            this.walletDataService
              .refreshWalletDataAndStore()
              .pipe(take(1))
              .subscribe();
            this.alertService.successAlert({
              content: 'Your Credits have been Recharged Successfully.',
              close: true,
              timeout: 3000
            });
            this.rechargeMyCreditsForm.reset();
          }
        },
        error: (err) => {
          if (err.error.errorCode === 631) {
            this.alertService
              .warningAlert({
                content: err.error.errorMsg,
                doneMsg: 'Verify Now',
                isCancel: true,
                cancelMsg: 'Cancel'
              })
              .afterClosed()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((res) => {
                if (res) {
                  this.dialog.closeAll();
                  this.router.navigate(['/v4/manage/verification/index'], {
                    queryParams: { openVerificationModal: true }
                  });
                }
              });
          }
        }
      });
  }

  openCalculator(): void {
    this.dialog
      .open(CalculatorComponent, {
        maxWidth: '286px',
        width: '95%',
        data: { addAmountButton: true }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((calculatedValue) => {
        if (calculatedValue) {
          this.rechargeMyCreditsForm.patchValue({ amount: calculatedValue });
        }
      });
  }
}
