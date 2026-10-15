import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { YodleeParentModalComponent } from 'src/app/shared/yodlee/components/yodlee-parent-modal/yodlee-parent-modal.component';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { AdpService } from 'src/app/shared/service/integration/adp.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { Router } from '@angular/router';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { environment } from 'src/environments/environment';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { PlaidHelperService } from 'src/app/shared/plaid/service/plaid-helper.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { VerificationMessageService } from 'src/app/shared/service/auth/verification-message.service';
import { MicroDepositModalComponent } from '../../../../modules/bank/bank-v2/modals/micro-deposit-modal/micro-deposit-modal.component';
import { EditBankAccountModalComponent } from '../../../../modules/bank/bank-v2/modals/edit-bank-account-modal/edit-bank-account-modal.component';
import { OcwPreventMultiClickDirective } from '../../../../directive/ocw-prevent-multi-click.directive';
import { CommonButtonV35Component } from '../../../v3/buttons/common-button-v35/common-button-v35.component';

/**
 * @description Modal component for bank account verification.
 */
@Component({
  selector: 'app-bank-verify-modal',
  templateUrl: './bank-verify-modal.component.html',
  styleUrls: ['./bank-verify-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    MatRadioGroup,
    MatRadioButton,
    MatDialogActions,
    OcwPreventMultiClickDirective,
    MatTooltip,
    FaIconComponent,
    CommonButtonV35Component
  ]
})
export class BankVerifyModalComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private personaHelperService = inject(PersonaHelperService);
  private alertService = inject(AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private dialog = inject(MatDialog);
  private bankAccService = inject(BankAccountsService);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private adpService = inject(AdpService);
  private dialogRef = inject(MatDialogRef<BankVerifyModalComponent>);
  public datas = inject(MAT_DIALOG_DATA);
  private plaidHelperService = inject(PlaidHelperService);
  public headerService = inject(HeaderService);
  private localStorageService = inject(LocalStorageService);
  private verificationMessageService = inject(VerificationMessageService);

  subscriptions: Subscription[] = [];
  isADPMarketPlaceUser: boolean;
  linkInstant = true;
  manual = false;
  isLoading = false;
  faXmark = faXmark;

  constructor() {
    this.processADPUserDetails();
  }

  ngOnInit(): void {
    if (this.datas.openInstantVerificationOnly) {
      this.linkInstant = true;
      this.continue();
    }
  }

  /**
   * @description Checks for adp marketplace user and if true, sets `this.isADPMarketPlaceUser` to true.
   */
  processADPUserDetails() {
    this.subscriptions.push(
      this.adpService.adpUserDetails.subscribe((res) => {
        if (res?.adpMarketPlaceUser === 1) {
          this.isADPMarketPlaceUser = true;
        }
      })
    );
  }

  /**
   * @description Method invoked when switching selection between manual and instant verification options.
   * @param event - selection event.
   */
  onChange(event: { value: number }) {
    this.linkInstant = false;
    this.manual = false;

    if (Number(event.value) === 1) {
      this.linkInstant = true;
    } else if (Number(event.value) === 2) {
      this.manual = true;
    }
  }

  checkVerificationStatus() {
    const verificationDetails: IGettingStartedAPI | null =
      this.localStorageService.getItem('gettingStartedData');

    if (verificationDetails?.verification === 0) {
      this.verifyEmailAndMobile();
      return;
    }
    this.continue();
  }

  verifyEmailAndMobile() {
    const ref = this.alertService.warningAlert({
      content: this.verificationMessageService.getVerificationMessage(),
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.dialogRef.close({ phoneAndEmailVerified: false });
        this.router.navigate(['/manage/users/verify-email-phone'], {
          queryParams: {
            returnUrl: 'manage/bank-accounts/index'
          }
        });
      }
    });
  }

  isPhoneAndEmailVerified() {
    this.subscriptions.push(
      this.bankAccService.getUnlinkedAccounts().subscribe({
        next: (res) => {
          const unverifiedError = res as unknown as { errorCode: string };
          if (unverifiedError.errorCode === '106' && this.linkInstant) {
            this.dialogRef.close({ phoneAndEmailVerified: false });
            this.router.navigate(['/manage/users/verify-email-phone'], {
              queryParams: { returnUrl: '/manage/wallet/transactions' }
            });
          } else {
            this.continue();
          }
        },
        error: (err) => {
          if (err.error.errorCode === 517) {
            if (environment.isV4Persona) {
              this.personaHelperService
                .openModal('kyc', CVSourceType.getting_started_v3)
                .subscribe();
            } else {
              this.router.navigateByUrl('/manage/users/verify-user-id?type=8');
            }
          } else if (err.error.errorCode === 520) {
            this.handleVerificationError(
              'Your personal verification is under the verification process .Please contact our support team for faster approval.'
            );
          } else if (err.error.errorCode === 521) {
            this.handleVerificationError(
              'Your personal verification has been rejected.Please contact support team for more information.'
            );
          }
        }
      })
    );
  }

  handleVerificationError(msg: string): void {
    const action = this.alertService.infoAlert({
      content: `${msg}`,
      cancelMsg: 'Not Now',
      isCancel: true,
      isOk: true,
      doneMsg: 'Contact Now'
    });
    action.afterClosed().subscribe((res) => {
      if (res) {
        this.dynamicWhiteLabelService.goToLiveChat();
      }
    });
  }

  /**
   * @description Method invoked when submit is clicked.
   * Verifies bank account and refreshes data table.
   */
  continue() {
    if (this.linkInstant) {
      // this.dialogRef.close();
      this.plaidHelperService
        .openPlaidModal({
          isVerify: true,
          selectedBankId: this.datas.encrypted_bankacc_id,
          sourceType: 2
        })
        .subscribe({
          next: (res) => {
            if (res?.success) {
              this.dialogRef.close({ success: res.success });
              this.headerService.onRefreshDynamicHeader = true;
              this.router.navigate(['manage/bank-accounts/index']);
              this.v3DataTableService.refreshV3DataTable();
              this.alertService.successAlert({
                content: 'Bank accounts verified successfully.'
              });
            } else {
              this.dialogRef.close({ success: false });
            }
          }
        });
      return;
      this.isLoading = true;
      this.bankAccService
        .verifyBankAccount(this.datas.encrypted_bankacc_id)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          }),
          catchError((err) => {
            if (!err.error.success) {
              const data = {
                mode: 'verify_now',
                verifyNowAccountData: this.datas
              };
              this.dialog
                .open(YodleeParentModalComponent, {
                  disableClose: true,
                  autoFocus: false,
                  data,
                  panelClass: 'yodlee-modal-new'
                })
                .afterClosed()
                .subscribe((res) => {
                  if (res) {
                    this.dialogRef.close({ success: res.success });
                  }
                });
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.dataTableService.setRefreshStatus(true);
            this.dialogRef.close({ success: true });
          }
        });
    }
    if (this.manual) {
      this.openMicroDepositModal(this.datas);
    }
  }

  /**
   * @description Opens the micro deposit modal and handles the result.
   * @param bankData - The bank data to pass to the modal.
   */
  openMicroDepositModal(bankData: typeof this.datas) {
    const dialogRef = this.dialog.open(MicroDepositModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: bankData
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res?.errorCode === 10021) {
        this.handleErrorCode10021(res.bankData, res.bankAccId, res.selectedBusiness, res.uploadedFiles, res.businessName);
      } else if (res) {
        this.dialogRef.close({ success: true });
      }
    });
  }

  /**
   * @description Handles error code 10021 by opening edit modal and reopening micro deposit modal after update.
   * @param bankData - The bank data to pass to the edit modal.
   * @param bankAccId - The bank account ID.
   * @param selectedBusiness - The selected business ID.
   * @param uploadedFiles - The previously uploaded files to restore.
   * @param businessName - The selected business name for validation.
   */
  handleErrorCode10021(
    bankData: typeof this.datas,
    bankAccId: string,
    selectedBusiness: string,
    uploadedFiles?: {
      bankStatement?: File;
      selectedFileNames?: string[];
    },
    businessName?: string
  ) {
    const editDialogRef = this.dialog.open(EditBankAccountModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: { id: bankAccId, businessName }
    });

    editDialogRef.afterClosed().subscribe((updatedData) => {
      if (updatedData) {
        this.openMicroDepositModal({ ...bankData, selectedBusiness, uploadedFiles });
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
