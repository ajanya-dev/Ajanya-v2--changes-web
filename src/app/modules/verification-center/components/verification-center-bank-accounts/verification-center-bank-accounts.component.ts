/* eslint-disable no-param-reassign */
import { CurrencyPipe, NgClass } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleCheck, faClock } from '@fortawesome/pro-solid-svg-icons';
import { faBank } from '@fortawesome/pro-regular-svg-icons';
import { faCircleExclamation } from '@fortawesome/pro-thin-svg-icons';
import { finalize, Subscription } from 'rxjs';
import { IBankDropdown, IBusinessDetails } from 'src/app/models/bank';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { ConfirmMicroDepositModalComponent } from 'src/app/modules/bank/bank-v2/modals/confirm-micro-deposit-modal/confirm-micro-deposit-modal.component';
import { BankVerifyModalComponent } from 'src/app/shared/bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { YodleeParentModalComponent } from 'src/app/shared/yodlee/components/yodlee-parent-modal/yodlee-parent-modal.component';
import { Router } from '@angular/router';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { BankDataV35Service } from 'src/app/modules/bank/bank-v3/v35-services/bank-data-v35.service';
import { MatTooltip } from '@angular/material/tooltip';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { CommonTablePaginationComponent } from '../common-table-pagination/common-table-pagination.component';
import { BusinessListModalComponent } from '../../modals/business-list-modal/business-list-modal.component';

@Component({
  selector: 'app-verification-center-bank-accounts',
  standalone: true,
  imports: [
    FontAwesomeModule,
    MatTooltip,
    NgClass,
    CurrencyPipe,
    CommonTablePaginationComponent
  ],
  templateUrl: './verification-center-bank-accounts-new.component.html',
  styleUrl: './verification-center-bank-accounts.component.scss'
})
export class VerificationCenterBankAccountsComponent
  implements OnInit, OnDestroy
{
  private bankAccountsService = inject(BankAccountsService);
  private localStorageService = inject(LocalStorageService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private verificationService = inject(CommonVerificationService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  verificationStatus: IGettingStartedAPI;
  public bankDataService = inject(BankDataV35Service);
  private headerService = inject(HeaderService);
  private bankModalService = inject(BankModalService);

  subscriptions: Subscription[] = [];
  private cdRef = inject(ChangeDetectorRef);
  page = 1;
  perPage = 5;

  isLoadingContent = true;
  bankAccounts: IBankDropdown[] = [];
  faCheck = faCircleCheck;
  faClock = faClock;
  faBank = faBank;
  faExclamation = faCircleExclamation;
  isUserVerified = false;
  digitalPaymentLoading = false;
  showPagination = false;

  constructor() {
    this.verificationStatus =
      this.localStorageService.getItem('gettingStartedData');
    this.isUserVerified = this.verificationStatus?.verification === 1;
  }

  ngOnInit(): void {
    this.getBankAccounts();
  }

  /**
   * @description Fetches details of solid and other businesses.
   */
  getBankAccounts(): void {
    this.isLoadingContent = true;
    this.subscriptions.push(
      this.bankAccountsService
        .getBankAccounts(
          this.page,
          '',
          undefined,
          '',
          undefined,
          undefined,
          this.perPage,
          undefined,
          false
        )
        .pipe(
          finalize(() => {
            this.isLoadingContent = false;
            this.cdRef.detectChanges();
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.bankAccounts = res.data as IBankDropdown[];
          }
        })
    );
  }

  addNewBank() {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService
        .openAddBankOptimizedModal()
        .subscribe((bankModal) => {
          if (bankModal) {
            this.subscriptions.push(
              bankModal.afterClosed().subscribe((result) => {
                if (result?.success) {
                  this.getBankAccounts();
                  this.headerService.refreshDynamicHeader.next(true);
                }
              })
            );
          }
        })
    );
  }

  checkStatus(item: IBankDropdown): {
    status: string;
    actionName?: string;
    tooltip?: string;
  } {
    let status = '';
    let actionName = '';
    let tooltip = '';
    if (!item.verifiedBy && (item.verified === 0 || !item.verified)) {
      status = 'Verify Now';
    } else if (item.verified === 1 && item.achApplicationStatus !== 1) {
      status = 'Verified';
    } else if (item.verifiedBy === 3 && item.achApplicationStatus !== 1) {
      status = 'Confirm MD';
      tooltip = 'Confirm the 2 amounts deposited in your bank account.';
    } else if (item.verifiedBy === 4 && item.achApplicationStatus !== 1) {
      status = 'Pending';
      actionName = 'Pending';
      tooltip =
        'Verification is in progress. The micro deposit is being transferred to the specified bank account.';
    } else if (item.verifiedBy === 5 && item.achApplicationStatus !== 1) {
      status = 'Approved';
    } else if (
      (item.verifiedBy === 6 || item.verifiedBy === 10) &&
      item.achApplicationStatus !== 1
    ) {
      status = 'Rejected';
      if (item.verifiedBy === 6) {
        actionName = 'Verify Instantly';
      } else {
        actionName = 'Re-Apply';
      }
    } else if (item.verifiedBy === 12 && item.achApplicationStatus !== 1) {
      status = 'Failed';
      actionName = 'Verify Instantly';
    }

    return { status, actionName, tooltip };
  }

  onClick(type: string, bankAcData: IBankDropdown): void {
    if (type === 'Verify Now') {
      this.verifyNow(bankAcData);
    }

    if (type === 'Confirm MD') {
      this.microDeposit(bankAcData);
    }

    if (type === 'Rejected') {
      if (bankAcData.verifiedBy === 6) {
        this.verifyInstantly(bankAcData);
      } else if (bankAcData.verifiedBy === 10) {
        this.verifyNow(bankAcData);
      }
    }

    if (type === 'Failed') {
      this.verifyInstantly(bankAcData);
    }
  }

  verifyNow(bankAcData: IBankDropdown): void {
    const updatedData = {
      ...bankAcData,
      encrypted_bankacc_id: bankAcData.id
    };
    const dialog = this.dialog.open(BankVerifyModalComponent, {
      maxWidth: '500px',
      width: '95%',
      data: updatedData,
      disableClose: true
    });
    dialog.afterClosed().subscribe((res) => {
      if (res) {
        bankAcData.verified = 0;
        bankAcData.verifiedBy = 4;
      }
      /**
       * @description Checking if the status from response is true, and proceeding to all other operations if its true. else it refreshes the whole page for nothing
       */
    });
  }

  microDeposit(bankAcData: IBankDropdown) {
    const updatedData = {
      ...bankAcData,
      encrypted_bankacc_id: bankAcData.id
    };
    const dialog = this.dialog.open(ConfirmMicroDepositModalComponent, {
      maxWidth: '750px',
      width: '500px',
      data: updatedData
    });
    dialog.afterClosed().subscribe((res) => {
      if (res) bankAcData.verified = 1;
      this.localStorageService.updateNestedData(
        'gettingStartedData',
        'bankAccount',
        2
      );
    });
  }

  /**
   * @description Opens @component 'YodleeParentModalComponent' for bank verify instantly
   */
  verifyInstantly(bankAcData: IBankDropdown | undefined) {
    const updatedData = {
      ...bankAcData,
      encrypted_bankacc_id: bankAcData?.id
    };
    const data = {
      mode: 'verify_now',
      verifyNowAccountData: updatedData as IBankDropdown
    };
    const dialog = this.dialog.open(YodleeParentModalComponent, {
      disableClose: true,
      autoFocus: false,
      data,
      panelClass: 'yodlee-modal-new'
    });
    dialog.afterClosed().subscribe((res) => {
      if (bankAcData && res) {
        bankAcData.verified = 1;
      }
      this.localStorageService.updateNestedData(
        'gettingStartedData',
        'bankAccount',
        2
      );
    });
  }

  onClickEvent(clcikType: 'prev' | 'next'): void {
    if (this.isLoadingContent) {
      return;
    }

    if (clcikType === 'next') {
      this.page += 1;
    } else {
      this.page -= 1;
    }

    if (this.page > 1) {
      this.showPagination = true;
    } else {
      this.showPagination = false;
    }
    this.getBankAccounts();
  }

  enableCheck(): void {
    this.localStorageService.setItem('verificationStep', 'check');
    this.router.navigateByUrl('manage/verification/steps');
  }

  contactSupport(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  enableAch(item: IBankDropdown): void {
    if (
      !this.verificationStatus?.verification ||
      this.verificationStatus?.kycStatus === null ||
      this.verificationStatus?.kybStatus === null
    ) {
      this.localStorageService.setItem('verificationStep', 'payment');
      this.router.navigateByUrl('manage/verification/steps');
    } else if (
      this.verificationStatus?.verification &&
      this.verificationStatus?.kybStatus !== null &&
      this.verificationStatus?.kybStatus !== null
    ) {
      this.getBusinesses(item);
    }
  }

  getBusinesses(item: IBankDropdown & { loading?: boolean }) {
    item.loading = true;
    this.subscriptions.push(
      this.verificationService
        .getUserBusinesses()
        .pipe(
          finalize(() => {
            item.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.showBusiness(res.data, item);
          }
        })
    );
  }

  showBusiness(business: IBusinessDetails[], item: IBankDropdown): void {
    const dialog = this.dialog.open(BusinessListModalComponent, {
      width: '450px',
      disableClose: true,
      data: {
        business,
        bankId: item.id
      }
    });
    dialog.afterClosed().subscribe((res) => {
      if (res.success) {
        item.achApplicationStatus = 0;
      }
    });
  }

  viewAll(): void {
    this.router.navigateByUrl('manage/bank-accounts/index');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => {
      el.unsubscribe();
    });
  }
}
