import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LucideAngularModule, X, Info, Loader2 } from 'lucide-angular';
import { Store } from '@ngrx/store';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { BankDataV35Service } from 'src/app/modules/bank/bank-v3/v35-services/bank-data-v35.service';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';

export interface ConfirmMicroDepositData {
  bankAccountId: string;
}

@Component({
  selector: 'app-confirm-micro-deposit-modal-v4',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component
  ],
  templateUrl: './confirm-micro-deposit-modal-v4.component.html',
  styleUrl: './confirm-micro-deposit-modal-v4.component.scss'
})
export class ConfirmMicroDepositModalV4Component implements OnInit {
  readonly X = X;
  readonly Info = Info;
  readonly Loader2 = Loader2;

  private dialogRef = inject(MatDialogRef<ConfirmMicroDepositModalV4Component>);
  private data: ConfirmMicroDepositData = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private bankAccService = inject(BankAccountsService);
  private alertService = inject(V4AlertService);
  private gettingStartedService = inject(GettingStartedService);
  private localStorageService = inject(LocalStorageService);
  private headerService = inject(HeaderService);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private bankDataService = inject(BankDataV35Service);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  submitting = signal(false);
  attemptsLeft = signal(3);

  confirmForm: FormGroup = this.fb.group({
    bankAccNumber: [''],
    amount1: ['', [Validators.required]],
    amount2: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.getData();
  }

  private getData(): void {
    this.loading.set(true);
    this.bankAccService
      .getConfirmMicroDeposit(this.data.bankAccountId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.attemptsLeft.set(res.data.attemptLeft);
            this.confirmForm.patchValue({
              bankAccNumber: res.data.bankAccountNumber ?? ''
            });
          }
        }
      });
  }

  submit(): void {
    this.confirmForm.markAllAsTouched();

    if (this.confirmForm.invalid) {
      return;
    }

    this.submitting.set(true);

    const body = {
      bankAccountId: this.data.bankAccountId,
      amount1: Number(this.confirmForm.value.amount1),
      amount2: Number(this.confirmForm.value.amount2)
    };

    this.bankAccService
      .confirmMicroDeposit(body)
      .pipe(
        catchError((err) => {
          if (err.error?.success === false) {
            this.getData();
            this.dataTableService.setRefreshStatus(true);
            if (err.error.errorCode === 517) {
              this.alertService
                .infoAlert({
                  content:
                    'All attempts have been completed. Verification of your account has failed. Please contact our customer support for assistance.',
                  isOk: true,
                  isCancel: true,
                  doneMsg: 'Contact Now',
                  cancelMsg: 'Not Now'
                })
                .afterClosed()
                .subscribe((res) => {
                  if (res) {
                    this.dynamicWhiteLabelService.goToLiveChat();
                  }
                });
            }
          }
          this.v3DataTableService.refreshV3DataTable();
          return of(false);
        }),
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        const response = res as { success: boolean; data: string };
        if (response?.success) {
          this.v3DataTableService.refreshV3DataTable();
          this.dataTableService.setRefreshStatus(true);
          this.store.dispatch(bankAccountsActions.bankAccountsReset());
          this.headerService.onRefreshDynamicHeader = true;
          const gettingStarted = this.localStorageService.getItem('gettingStartedData');
          if (gettingStarted) {
            gettingStarted.bankAccount = 2;
            this.localStorageService.setItem('gettingStartedData', gettingStarted);
          }
          this.dialogRef.close({ success: true });
          this.alertService
            .successAlert()
            .afterClosed()
            .subscribe(() => {
              this.bankDataService.setAccounts();
              this.v3DataTableService.refreshV3DataTable();
              this.dataTableService.setRefreshStatus(true);
            });
          this.gettingStartedService.updatedGettingStartedData = 3;
        }
      });
  }

  close(): void {
    if (!this.submitting()) {
      this.dialogRef.close();
    }
  }
}
