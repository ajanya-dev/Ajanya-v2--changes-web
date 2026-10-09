import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { take, timeout } from 'rxjs';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import {
  LucideAngularModule,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Loader2,
  Zap
} from 'lucide-angular';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { PlaidHelperService } from 'src/app/shared/plaid/service/plaid-helper.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { VerificationMessageService } from 'src/app/shared/service/auth/verification-message.service';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import { selectBankAccountsState } from 'src/app/modules/store/bankAccounts/bank-accounts.selectors';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { IBankDropdown } from 'src/app/models/bank';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import {
  MicroDepositModalV4Component,
  MicroDepositModalV4Data
} from '../micro-deposit-modal-v4/micro-deposit-modal-v4.component';
import { ConfirmMicroDepositModalV4Component } from '../confirm-micro-deposit-modal-v4/confirm-micro-deposit-modal-v4.component';
import { EditBankAccountModalV4Component } from '../edit-bank-account-modal-v4/edit-bank-account-modal-v4.component';

export type VerificationStatus = 'idle' | 'success' | 'error' | 'pending';

export type BankVerificationAccount = Pick<
  IBankDropdown,
  'id' | 'verifiedBy' | 'country'
>;

export interface BankVerificationModalData {
  bankId?: string;
  bankDetails?: Omit<BankVerificationAccount, 'id'>;
}

@Component({
  selector: 'app-bank-verification-modal-v4',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideAngularModule,
    CommonButtonV4Component,
    BankAcDropdownV4Component
  ],
  templateUrl: './bank-verification-modal-v4.component.html',
  styleUrl: './bank-verification-modal-v4.component.scss'
})
export class BankVerificationModalV4Component {
  readonly X = X;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly Clock = Clock;
  readonly Building2 = Building2;
  readonly Loader2 = Loader2;
  readonly Zap = Zap;

  private dialogRef = inject(MatDialogRef<BankVerificationModalV4Component>);
  private dialog = inject(MatDialog);
  private data = inject<BankVerificationModalData>(MAT_DIALOG_DATA, {
    optional: true
  });

  private plaidHelperService = inject(PlaidHelperService);
  private headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);
  private verificationMessageService = inject(VerificationMessageService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private destroyRef = inject(DestroyRef);
  private store = inject(Store);
  private actions$ = inject(Actions);
  private router = inject(Router);
  private alertService = inject(V4AlertService);
  private bankAccountsService = inject(BankAccountsService);

  private bankAccountsState = toSignal(
    this.store.select(selectBankAccountsState),
    { initialValue: undefined }
  );

  private initialLoadDone = signal(false);

  private preselectionSettled = signal(false);

  noBankAccounts = computed(
    () =>
      !this.bankAccountId() &&
      this.initialLoadDone() &&
      this.bankAccountsState()?.bankAccounts.length === 0
  );

  readonly contentReady = computed(() =>
    this.bankAccountId() ? this.preselectionSettled() : this.initialLoadDone()
  );

  constructor() {
    const preselectedBankId = this.data?.bankId;
    const preselectedDetails = this.data?.bankDetails;

    if (preselectedBankId && preselectedDetails) {
      this.selectedAccount.set({
        id: preselectedBankId,
        ...preselectedDetails
      });
      this.preselectionSettled.set(true);
    } else if (preselectedBankId) {
      const knownAccount = this.findLoadedAccount(preselectedBankId);

      if (knownAccount) {
        this.selectedAccount.set(knownAccount);
        this.preselectionSettled.set(true);
      } else {
        this.loadPreselectedAccount(preselectedBankId);
      }
    } else {
      this.store.dispatch(
        bankAccountsActions.loadBankAccounts({
          searchTerm: '',
          context: { forPayment: true }
        })
      );
    }

    effect(
      () => {
        if (preselectedBankId) return;
        const state = this.bankAccountsState();
        if (state && !state.isLoading && !this.initialLoadDone()) {
          this.initialLoadDone.set(true);
        }
      },
      { allowSignalWrites: true }
    );
  }

  verificationStatus = signal<VerificationStatus>('idle');
  selectedAccount = signal<BankVerificationAccount | null>(null);
  errorMessage = signal<string | null>(null);
  bankAccountId = signal<string | undefined>(this.data?.bankId);

  readonly isCanadianBank = computed(
    () => this.selectedAccount()?.country === 'Canada'
  );

  get isPending(): boolean {
    return Number(this.selectedAccount()?.verifiedBy) === 4;
  }

  get isConfirmMD(): boolean {
    return Number(this.selectedAccount()?.verifiedBy) === 3;
  }

  private findLoadedAccount(bankId: string): BankVerificationAccount | null {
    const state = this.bankAccountsState();
    const loaded = [
      ...(state?.bankAccounts ?? []),
      ...(state?.bankAccountsFiltered ?? [])
    ].find((account) => account.id === bankId);

    return loaded
      ? {
          id: loaded.id,
          verifiedBy: loaded.verifiedBy,
          country: loaded.country
        }
      : null;
  }

  private loadPreselectedAccount(bankId: string): void {
    this.bankAccountsService
      .getBankAccountByIds([bankId])
      .pipe(timeout(15000), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const rows = res?.data ?? [];
          const account =
            rows.find((item) => item.id === bankId) ??
            (rows.length === 1 ? rows[0] : undefined);

          if (account) {
            this.selectedAccount.set(account);
          } else {
            this.showPreselectionError();
          }
          this.preselectionSettled.set(true);
        },
        error: () => {
          this.showPreselectionError();
          this.preselectionSettled.set(true);
        }
      });
  }

  private showPreselectionError(): void {
    this.errorMessage.set("We couldn't load the selected bank account.");
    this.verificationStatus.set('error');
  }

  onAccountSelect(account: IBankDropdown | null | undefined): void {
    this.selectedAccount.set(account ?? null);
    this.verificationStatus.set('idle');
    this.errorMessage.set(null);
  }

  private isEmailAndPhoneVerified(): boolean {
    const verificationDetails: IGettingStartedAPI =
      this.localStorageService.getItem('gettingStartedData');
    return verificationDetails?.verification !== 0;
  }

  private dispatchLoadAndCloseOnSuccess(delayMs: number = 0): void {
    this.actions$
      .pipe(
        ofType(bankAccountsActions.loadBankAccountsSuccess),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        setTimeout(() => {
          this.dialogRef.close({ success: true });
        }, delayMs);
      });

    this.store.dispatch(
      bankAccountsActions.loadBankAccounts({
        searchTerm: '',
        isReload: true,
        context: { forPayment: true }
      })
    );
  }

  private showVerifyEmailPhoneAlert(): void {
    const ref = this.alertService.warningAlert({
      content: this.verificationMessageService.getVerificationMessage(),
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.dialog.closeAll();
        this.router.navigate(['/v4/manage/verification/index'], {
          queryParams: { openVerificationModal: true }
        });
      }
    });
  }

  verifyInstant(): void {
    const account = this.selectedAccount();
    if (!account) return;

    if (!this.isEmailAndPhoneVerified()) {
      this.showVerifyEmailPhoneAlert();
      return;
    }

    this.errorMessage.set(null);

    this.plaidHelperService
      .openPlaidModal({
        isVerify: true,
        selectedBankId: account.id,
        sourceType: 2,
        isV4: true
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.verificationStatus.set('success');
            this.headerService.onRefreshDynamicHeader = true;
            const gettingStarted =
              this.localStorageService.getItem('gettingStartedData');
            if (gettingStarted) {
              gettingStarted.bankAccount = 2;
              this.localStorageService.setItem(
                'gettingStartedData',
                gettingStarted
              );
            }

            this.dispatchLoadAndCloseOnSuccess(1500);
          }
        }
      });
  }

  verifyMicroDeposit(): void {
    const account = this.selectedAccount();
    if (!account) return;

    if (!this.isEmailAndPhoneVerified()) {
      this.showVerifyEmailPhoneAlert();
      return;
    }

    if (this.isConfirmMD) {
      this.dialogRef.close();
      const confirmRef = this.dialog.open(ConfirmMicroDepositModalV4Component, {
        width: '448px',
        maxWidth: '95vw',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: { bankAccountId: account.id }
      });

      confirmRef.afterClosed().subscribe((res) => {
        if (res?.success) {
          this.dispatchLoadAndCloseOnSuccess();
        }
      });
    } else {
      this.openMicroDepositModal({ encrypted_bankacc_id: account.id });
    }
  }

  private openMicroDepositModal(bankData: MicroDepositModalV4Data): void {
    const mdRef = this.dialog.open(MicroDepositModalV4Component, {
      maxWidth: '510px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: bankData
    });

    mdRef.afterClosed().subscribe((res) => {
      if (res?.errorCode === 10021) {
        this.handleErrorCode10021(
          res.bankData,
          res.bankAccId,
          res.selectedBusiness,
          res.uploadedFiles,
          res.businessName
        );
        return;
      }

      if (res === true) {
        this.store.dispatch(
          bankAccountsActions.loadBankAccounts({
            searchTerm: '',
            isReload: true,
            context: { forPayment: true }
          })
        );
        this.dialogRef.close({ success: true });
      }
    });
  }

  private handleErrorCode10021(
    bankData: MicroDepositModalV4Data,
    bankAccId: string,
    selectedBusiness: string,
    uploadedFiles?: { bankStatement?: File; selectedFileNames?: string[] },
    businessName?: string
  ): void {
    const editRef = this.dialog.open(EditBankAccountModalV4Component, {
      maxWidth: '510px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: { id: bankAccId, businessName }
    });

    editRef.afterClosed().subscribe((updatedData) => {
      if (updatedData) {
        this.openMicroDepositModal({
          ...bankData,
          selectedBusiness,
          uploadedFiles
        });
      }
    });
  }

  retryVerification(): void {
    this.verificationStatus.set('idle');
    this.errorMessage.set(null);

    const bankId = this.bankAccountId();
    if (bankId && !this.selectedAccount()) {
      this.preselectionSettled.set(false);
      this.loadPreselectedAccount(bankId);
    }
  }

  contactSupport(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  close(): void {
    const status = this.verificationStatus();
    if (status === 'idle' || status === 'pending') {
      this.dialogRef.close(
        status === 'pending' ? { success: true } : undefined
      );
    }
  }

  goToAddBank(): void {
    this.dialogRef.close();
    this.router.navigate(['/v4/manage/bank-accounts/index'], {
      queryParams: { action: 'addBank' }
    });
  }
}
