import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { IBankData, IBusinessDetails } from 'src/app/models/bank';
import { IUserVerification } from 'src/app/models/user';
import { environment } from 'src/environments/environment';

import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';

import {
  CVSourceType,
  IActionLoaderData,
  ISelectBizData
} from 'src/app/modules/common-verification/model/common-verification';

import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { ConfirmMicroDepositModalV4Component } from 'src/app/modules/user/user-v4/modals/confirm-micro-deposit-modal-v4/confirm-micro-deposit-modal-v4.component';
import { EditBankAccountModalV4Component } from 'src/app/modules/user/user-v4/modals/edit-bank-account-modal-v4/edit-bank-account-modal-v4.component';
import { SelectBusinessV4Component } from '../v4-modals/select-business-v4/select-business-v4.component';
import { V4LoaderModalComponent } from 'src/app/shared/modal/v4-loader-modal/v4-loader-modal.component';
import { VirtualAccountConfirmationModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/virtual-account-confirmation-modal-v4/virtual-account-confirmation-modal-v4.component';

import { BankDataV35Service } from '../../bank-v3/v35-services/bank-data-v35.service';

export type FetchBankRecordsHandler = () => void;
export type FetchBankRecordsState = () => { canFetch: boolean; loading: boolean };

@Injectable({
  providedIn: 'root'
})
export class BankDataV4Service {
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private alertService = inject(V4AlertService);
  private bankDataService = inject(BankDataV35Service);
  private userProfileService = inject(UserProfileService);
  private commonVerificationService = inject(CommonVerificationService);
  private personaHelperService = inject(PersonaHelperService);
  private commonOnInitService = inject(CommonOnInitService);

  /**
   * Fired when something outside the bank detail card wants the "Send" flow —
   * today the v4 transactions grid's empty-state CTA. The flow itself (payment
   * payload from the selected account, route) stays in
   * `BankDetailsV4Component`, which is always mounted alongside the grid, so
   * there is exactly one copy of it.
   */
  readonly sendPaymentRequested$ = new Subject<void>();

  selectedDetailsTab = signal<'account' | 'audit-trail' | 'all'>('all');
  lastTransactionDate = signal<string | undefined>(undefined);
  lastTransactionFetched = signal(false);

  private kycKybStatus: { kycStatus: number; kybStatus: number };

  private fetchBankRecordsHandler: FetchBankRecordsHandler | null = null;
  private fetchBankRecordsState: FetchBankRecordsState | null = null;

  registerFetchBankRecords(
    handler: FetchBankRecordsHandler,
    getState: FetchBankRecordsState
  ): void {
    this.fetchBankRecordsHandler = handler;
    this.fetchBankRecordsState = getState;
  }

  unregisterFetchBankRecords(): void {
    this.fetchBankRecordsHandler = null;
    this.fetchBankRecordsState = null;
  }

  fetchBankRecords(): void {
    this.fetchBankRecordsHandler?.();
  }

  getFetchBankRecordsState(): { canFetch: boolean; loading: boolean } | null {
    return this.fetchBankRecordsState?.() ?? null;
  }

  openBankVerifyModal(bankAcData: IBankData): void {
    const dialog = this.dialog.open(BankVerificationModalV4Component, {
      width: '100%',
      maxWidth: '480px',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        bankId: bankAcData.encrypted_bankacc_id,
        bankDetails: {
          verifiedBy: bankAcData.verified_by ?? undefined,
          country: bankAcData.bank_account_country
        }
      }
    });
    dialog.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.bankDataService.setAccounts();
      }
    });
  }

  microDeposit(val: IBankData | undefined): void {
    if (!val?.encrypted_bankacc_id) {
      this.alertService.warningAlert({
        content: 'Please select a bank account first.'
      });
      return;
    }
    const dialog = this.dialog.open(ConfirmMicroDepositModalV4Component, {
      width: '100%',
      maxWidth: '448px',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: { bankAccountId: val.encrypted_bankacc_id }
    });
    dialog.afterClosed().subscribe(() => {
      this.bankDataService.setAccounts();
    });
  }

  // ===== Enable ACH Flow (V4) =====

  applyAchClick(selectedAccount: IBankData): void {
    if (selectedAccount.bank_account_country === 'Canada') {
      this.alertService.warningAlert({
        content: 'Verification for Canadian bank accounts is not permitted.'
      });
      return;
    }

    let type = 0;
    if (selectedAccount.ach_application_status === 1) {
      type = 1;
    } else if (selectedAccount.ach_application_status === 0) {
      type = 2;
    } else if (selectedAccount.ach_application_status === 2) {
      type = 3;
    } else if (
      selectedAccount.ach_application_status === null &&
      selectedAccount.mark_as_verified === 1
    ) {
      type = 4;
    } else if (selectedAccount.ach_application_status === 3) {
      type = 5;
    }
    if (
      selectedAccount.bank_account_nature_type === 2 ||
      selectedAccount.bank_name === 'ZilBank'
    ) {
      type = 6;
    }

    if (type === 4 || type === 5) {
      this.isEmailAndPhoneVerified(
        selectedAccount.encrypted_bankacc_id,
        selectedAccount
      );
    } else {
      this.bankVerificationRequiredConfirm(selectedAccount);
    }
  }

  private isEmailAndPhoneVerified(
    encryptedBankaccId: string,
    data: IBankData
  ): void {
    this.bankDataService.isFromService = 'manual';
    this.bankDataService.selectedBankId.set(encryptedBankaccId);

    this.userProfileService
      .checkEmailAndPhoneVerified()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          const verification = (res as { data: IUserVerification }).data;
          if (verification.email_verified === 0 || verification.phone_verified === 0) {
            this.verifyPhoneEmail(verification);
          } else {
            this.getUserKycKybStatus(encryptedBankaccId, data);
          }
        }
      });
  }

  private bankVerificationRequiredConfirm(bankAcData: IBankData): void {
    if (bankAcData?.verified_by === 4) {
      this.alertService.warningAlert({
        content: 'The bank account you have chosen has not been verified.'
      });
      return;
    }

    const ref = this.alertService.warningAlert({
      content: 'Please verify your bank account',
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        if (
          (bankAcData?.verified_by === 6 || bankAcData?.verified_by === 12) &&
          bankAcData?.ach_application_status !== 1
        ) {
          this.bankDataService.verifyInstantly(bankAcData);
          return;
        }
        this.openBankVerifyModal(bankAcData);
      }
    });
  }

  private verifyPhoneEmail(res: IUserVerification): void {
    const msg = (): string => {
      if (!res.email_verified && !res.phone_verified) return 'Phone and Email';
      if (!res.phone_verified) return 'Phone';
      return 'Email';
    };

    const ref = this.alertService.warningAlert({
      content: `Please verify your ${msg()}`,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((response) => {
      if (response) {
        this.commonOnInitService.openEmailPhoneVerificationModal();
      }
    });
  }

  private getUserKycKybStatus(
    encryptedBankaccId: string,
    bankDetails: IBankData
  ): void {
    this.bankDataService.statusFetchingSignal.set({ loading: true });

    this.commonVerificationService
      .applicationStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.kycKybStatus = res.data;
          this.checkVirtualAccount(encryptedBankaccId, bankDetails);
        }
      });
  }

  private checkVirtualAccount(
    encryptedBankaccId: string,
    bankDetails: IBankData
  ): void {
    if (bankDetails.is_virtual_account) {
      this.alertService
        .warningAlert({
          content:
            'Since you added your Bank account using instant verification, we received a virtual account number. You won\'t be able to apply for ACH application with this account, please confirm your original account number to use it for checks.',
          doneMsg: 'Update',
          isCancel: true
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.openVirtualAccountConfirmationModal(
              encryptedBankaccId,
              bankDetails
            );
          } else {
            this.bankDataService.statusFetchingSignal.set({ loading: false });
          }
        });
    } else if (
      bankDetails.mark_as_verified === 0 &&
      bankDetails.verified_by === 88
    ) {
      this.alertService
        .warningAlert({
          content:
            'Your Bank account verification was rejected. You won\'t be able to apply for ACH application with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.',
          doneMsg: 'Update',
          isCancel: true
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.openVirtualAccountConfirmationModal(
              encryptedBankaccId,
              bankDetails
            );
          } else {
            this.bankDataService.statusFetchingSignal.set({ loading: false });
          }
        });
    } else {
      this.getBusinesses(encryptedBankaccId, bankDetails);
    }
  }

  private openVirtualAccountConfirmationModal(
    encryptedBankaccId: string,
    bankDetails: IBankData
  ): void {
    const confirmationDialog = this.dialog.open(
      VirtualAccountConfirmationModalV4Component,
      {
        maxWidth: '1200px',
        width: '100%',
        disableClose: true,
        data: { bankAccountIds: [encryptedBankaccId] }
      }
    );
    confirmationDialog.afterClosed().subscribe((result) => {
      if (result && result.success) {
        this.getBusinesses(encryptedBankaccId, bankDetails);
      } else {
        this.bankDataService.setAccounts();
        this.bankDataService.statusFetchingSignal.set({ loading: false });
      }
    });
  }

  private getBusinesses(
    encryptedBankaccId: string,
    bankDetails: IBankData
  ): void {
    this.commonVerificationService
      .getUserBusinesses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          const businessDetails = res?.data;
          this.bankDataService.statusFetchingSignal.set({ loading: false });

          if (businessDetails?.length) {
            this.selectBusiness(encryptedBankaccId, {
              ...bankDetails,
              businessDetails
            });
          } else if (this.kycKybStatus?.kycStatus !== null) {
            if (environment.isV4Persona) {
              this.personaHelperService
                .openModal('kyb', CVSourceType.add_new_business)
                .subscribe((resp) => {
                  if (resp?.data.inquiry_id) {
                    this.bankDataService.statusFetchingSignal.set({
                      loading: true,
                      autoClick: true
                    });
                  }
                });
            } else {
              this.router.navigate(['/v4/manage/users/verify-user-id'], {
                queryParams: { type: 7 }
              });
            }
          } else if (environment.isV4Persona) {
            this.personaHelperService
              .openModal('kyc', CVSourceType.ACH)
              .subscribe((response) => {
                if (response?.data.inquiry_type === 'kyb') {
                  this.bankDataService.statusFetchingSignal.set({
                    loading: true,
                    autoClick: true
                  });
                }
              });
          } else {
            this.router.navigate(['/v4/manage/users/verify-user-id'], {
              queryParams: { type: 2 }
            });
          }
        }
      });
  }

  private selectBusiness(
    bankAccountId: string,
    data: IBankData & { businessDetails: IBusinessDetails[] }
  ): void {
    const { url } = this.router;
    let word = '';
    if (url) {
      const parts = url.split('manage/');
      if (parts[1]) {
        word = parts[1].split('/')[0];
      }
    }

    const ref = this.dialog.open<SelectBusinessV4Component, ISelectBizData>(
      SelectBusinessV4Component,
      {
        width: '450px',
        maxWidth: '95%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          bankData: data,
          applicationStatus: this.kycKybStatus,
          sourceType: CVSourceType.ACH,
          from: word
        }
      }
    );

    ref.afterClosed().subscribe((res) => {
      if (res?.businessId) {
        this.openLoaderModal(
          res.businessId,
          bankAccountId,
          res.selectedBusiness
        );
      // } else if (data?.is_virtual_account === 0) {
      //   this.bankDataService.setAccounts();
      }
    });
  }

  private openLoaderModal(
    businessId: string,
    bankAccountId: string,
    selectedBusiness?: string
  ): void {
    const loader = this.dialog.open<V4LoaderModalComponent, IActionLoaderData>(
      V4LoaderModalComponent,
      {
        maxWidth: '400px',
        width: '80%',
        minHeight: '200px',
        height: 'unset',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { type: { ach: { businessId, bankAccountId } } }
      }
    );

    loader.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.bankDataService.setAccounts();
      } else if (res?.errorCode === 10021) {
        const editDialogRef = this.dialog.open(
          EditBankAccountModalV4Component,
          {
            width: '100%',
            maxWidth: '510px',
            panelClass: 'paddingless-modal',
            disableClose: true,
            data: { id: bankAccountId, businessName: selectedBusiness }
          }
        );
        editDialogRef.afterClosed().subscribe((updatedData) => {
          if (updatedData) {
            this.openLoaderModal(businessId, bankAccountId, selectedBusiness);
          }
        });
      }
    });
  }
}
