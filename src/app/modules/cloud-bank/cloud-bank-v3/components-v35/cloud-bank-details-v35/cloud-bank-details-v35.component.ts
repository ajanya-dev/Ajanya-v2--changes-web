import {
  Component,
  OnInit,
  inject,
  OnDestroy,
  ViewChild,
  ElementRef
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import {
  faCaretDown,
  faCaretUp,
  faDownload,
  faEye,
  faGear,
  faPenToSquare,
  faPlus
} from '@fortawesome/pro-solid-svg-icons';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { TransferDetailsService } from 'src/app/modules/transfers/services/transfer-details.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import {
  NgClass,
  NgStyle,
  NgOptimizedImage,
  SlicePipe,
  TitleCasePipe,
  CurrencyPipe
} from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ICloudBankAccountDetailsAirwallex } from '../../../model/cloudbank';
import { CloudBankDetailsDataV35Service } from '../../services/cloud-bank-details-data-v35.service';
import { CloudAccountInfoModalComponent } from '../../modals/cloud-account-info-modal/cloud-account-info-modal.component';
import { CloudListV35Service } from '../../services/cloud-list-v35.service';
import { DownloadStatementComponent } from '../../../cloud-bank-v2/modals/download-statement/download-statement.component';
import { NickNameComponent } from '../../../cloud-bank-v2/modals/nick-name/nick-name.component';
import { WhiteLabelPipe } from '../../../../../pipes/white-label.pipe';
import { TruncatePipe } from '../../../../../pipes/truncate.pipe';
import { ManageCloudCardV35Component } from '../manage-cloud-card-v35/manage-cloud-card-v35.component';
import { CloudAccountDataTableV3Component } from '../../components/cloud-account-data-table-v3/cloud-account-data-table-v3.component';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ScrollListenerDirective } from '../../../../../directive/scroll-listner.directive';

@Component({
  selector: 'app-cloud-bank-details-v35',
  templateUrl: './cloud-bank-details-v35.component.html',
  styleUrls: ['./cloud-bank-details-v35.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    ScrollListenerDirective,
    CommonButtonV35Component,
    MatTooltip,
    FaIconComponent,
    NgStyle,
    NgOptimizedImage,
    CloudAccountDataTableV3Component,
    ManageCloudCardV35Component,
    SlicePipe,
    TitleCasePipe,
    CurrencyPipe,
    TruncatePipe,
    WhiteLabelPipe
  ]
})
export class CloudBankDetailsV35Component implements OnInit, OnDestroy {
  public cloudBankService = inject(CloudBankService);
  private matDialog = inject(MatDialog);
  private router = inject(Router);
  private paymentsService = inject(PaymentsService);
  public cloudListV35Service = inject(CloudListV35Service);
  public cloudBankDetailsDataV35Service = inject(
    CloudBankDetailsDataV35Service
  );

  private payeeService = inject(PayeeService);
  private transferDetailsService = inject(TransferDetailsService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  @ViewChild('mainSection') mainSection: ElementRef<HTMLDivElement>;

  tabs = [
    {
      label: 'Account',
      value: 'account'
    },
    {
      label: 'Cards',
      value: 'card'
    }
  ] as const;

  currentTab: 'account' | 'card' = 'account';
  destroy$ = new Subject<boolean>();
  tabBottomShadow = false;
  showAccountNumber = false;

  faEye = faEye;
  faDownload = faDownload;
  faCaretDown = faCaretDown;
  faCaretUp = faCaretUp;
  faPenToSquare = faPenToSquare;
  faGear = faGear;
  faPlus = faPlus;

  ngOnInit(): void {
    this.getSelectedTab();
    this.cloudListV35Service.getAccountBalance();
    this.cloudBankDetailsDataV35Service.getSelectedAccountInfo();
  }

  getSelectedTab() {
    this.cloudBankService.selectedCloudTab$
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.currentTab = val.tab;
      });
  }

  /**
   * @description routes to create card page.
   */
  createCardPage(accountId: string): void {
    this.router.navigate(['/manage/cloud-bank/card/create-card'], {
      queryParams: { id: accountId }
    });
  }

  toggleAccountDetails(tab: 'account' | 'card'): void {
    this.currentTab = tab;
    this.cloudBankService.selectedCloudTab = {
      tab: this.currentTab
    };
  }

  /**
   * @description routes to add fund page.
   */
  openAddFundPage() {
    return;
    this.cloudBankService.selectedAccountData = {
      accountId: this.cloudListV35Service.selectedAccountSignal()?.id,
      transferToId:
        this.cloudListV35Service.selectedAccountSignal()?.localBankAccountId ??
        ''
    };
    this.router.navigate([`/manage/cloud-bank/add-fund`]);
  }

  /**
   * @description routes to payment component send payment page.
   */
  sendMoney() {
    return;
    this.paymentsService.initiatePaymentForm = {
      cloud: this.cloudListV35Service.selectedAccountSignal()
    };
    this.router.navigate(['/manage/payments/main/pay/cloud/ach'], {
      state: { backUrl: this.router.url }
    });
    this.payeeService.fromCloudSendBtn.next(true);
  }

  /**
   * @description routes to transfer component and sets default values in the service.
   */
  transferMoney(): void {
    return;
    this.transferDetailsService.setData({
      transferFrom: 3,
      transferFromId:
        this.cloudListV35Service.selectedAccountSignal()?.id ?? '',
      displayName: '',
      transferFromIdForCloud:
        this.cloudListV35Service.selectedAccountSignal()?.localBankAccountId ??
        ''
    });
    this.router.navigate(['/manage/transfers']);
  }

  /**
   * @description download account statement.
   * @param type - optional string.
   */
  downloadStatement(): void {
    this.matDialog.open(DownloadStatementComponent, {
      width: '500px',
      maxWidth: '95%',
      autoFocus: false
    });
  }

  get cardSize() {
    if (window.innerWidth < 1366) {
      return '0.9rem';
    }
    return '1.1rem';
  }

  onScroll() {
    const mainSectionElement = this.mainSection?.nativeElement;
    if ((mainSectionElement?.scrollTop ?? 0) > 0) {
      this.tabBottomShadow = true;
    } else {
      this.tabBottomShadow = false;
    }
  }

  accountInfo(selectedAccount: ICloudBankAccountDetailsAirwallex) {
    return;
    this.matDialog.open(CloudAccountInfoModalComponent, {
      width: '500px',
      maxWidth: '90%',
      data: selectedAccount,
      disableClose: true
    });
  }

  contactNow() {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  /**
   * @description Opens the nick name modal for a selected account.
   * @param {string}accountId - ID of the selected account.
   * @param {string}mode - The type of operation: 'add' or 'update'.
   * @param {string}name - The entered nickname.
   */
  addNickNameModal(accountId: string, mode: string, name?: string) {
    return;
    this.matDialog
      .open(NickNameComponent, {
        maxWidth: '440px',
        width: '95%',
        disableClose: true,
        autoFocus: false,
        data: { accountId, mode, name }
      })
      .afterClosed()
      .subscribe((res) => {
        if (res.sucees) {
          (
            this.cloudListV35Service.selectedAccountSignal() as ICloudBankAccountDetailsAirwallex
          ).accountNickName = res.nickName;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.cloudListV35Service.resetSubscriptions();
    this.cloudBankDetailsDataV35Service.resetSubscriptions();
  }
}
