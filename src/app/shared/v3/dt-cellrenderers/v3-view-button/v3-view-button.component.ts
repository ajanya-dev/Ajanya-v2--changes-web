import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatDialog } from '@angular/material/dialog';
import { WalletActionViewModalComponent } from 'src/app/shared/modal/wallet-modal/wallet-action-view-modal/wallet-action-view-modal.component';
import { CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-comment-modal/check-add-comment-modal.component';
import { CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { CheckActivityModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-activity-modal/check-activity-modal.component';
import { Subscription } from 'rxjs';
import {
  ICheckActionList,
  IPayAsItem,
  IPaymentsProofPayload
} from 'src/app/modules/payments/model/payments';
import { ScriptService } from 'src/app/core/services/script.service';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { IAttachmentItem } from 'src/app/models/common';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { VerificationMessageService } from 'src/app/shared/service/auth/verification-message.service';
import { ICheckAttachmentData } from 'src/app/modules/check/model/check';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { V3PaymentsTableData } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table-data';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload, faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';

import { SendPaymentProofModalComponent } from 'src/app/shared/modal/send-payment-proof-modal/send-payment-proof-modal.component';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { PayeeDataV35Service } from 'src/app/modules/payee/payee-v3/v35-services/payee-data-v35.service';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { Store } from '@ngrx/store';
import { GetReceiptModalComponent } from 'src/app/modules/v3-payments-table/modal/get-receipt-modal/get-receipt-modal.component';
import { SendReceiptModalComponent } from 'src/app/modules/v3-payments-table/modal/send-receipt-modal/send-receipt-modal.component';
import { VirtualAccountConfirmationModalComponent } from 'src/app/modules/bank/bank-v2/modals/virtual-account-confirmation-modal/virtual-account-confirmation-modal.component';
import { environment } from 'src/environments/environment';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { V3DataTableService } from '../../../../modules/v3-data-table/services/v3-data-table.service';
import { ActionItems } from './v3-view-actions';

/**
 * @description interface to include 'viewButtonType' which is passed in as 'cellRendererParams' in 'colDef'.
 */
interface ICellRendererParamsExtended extends ICellRendererParams {
  viewButtonType?: number;
  tableId?: number;
  tableName?: string;
  onCloudViewAction: (selectedRowData: unknown, buttonLabel: string) => void;
  checkStatus?: { value: string; color: string };
  disableToolTip?: boolean;
  hideMenuOption?: boolean;
  disableHover?: boolean;
  showApproveRejectOptions?: boolean;
  onViewClick?: (row: unknown) => void;
  from?: string;
}
@Component({
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FontAwesomeModule,
    NgOptimizedImage,
    WhiteLabelDirective
  ],
  selector: 'app-v3-view-button',
  templateUrl: './v3-view-button.component.html',
  styleUrls: ['./v3-view-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V3ViewButtonComponent implements OnInit, OnDestroy {
  /* Injectors */
  protected dialog = inject(MatDialog);
  protected router = inject(Router);
  protected alertService = inject(AlertService);
  protected v3DataTableService = inject(V3DataTableService);
  private v3PaymentsService = inject(PaymentsService);
  private checkService = inject(CheckService);
  private v3PaymentsTableService = inject(V3PaymentsTableService);
  private scriptService = inject(ScriptService);
  private localStorageService = inject(LocalStorageService);
  protected verificationMessageService = inject(VerificationMessageService);
  private cloudService = inject(CloudBankService);
  protected cdr = inject(ChangeDetectorRef);
  private paymentsService = inject(PaymentsService);
  private payeeService = inject(PayeeService);
  private payeeDataService = inject(PayeeDataV35Service);
  protected payeeModalService = inject(PayeeModalService);
  protected store = inject(Store);
  protected headerService = inject(HeaderService);
  private walletService = inject(WalletService);

  /* Variables */
  commonTransactionTableRowData: ICellRendererParamsExtended;
  isVerticalEllipsisDisabled = true;
  isSignedReceiptForCheckEnabled = true;
  paymentCompleted = true;
  isTypeCheck = false;
  createdExistingAttachments: IAttachmentItem[] = [];
  createdExistingComments: IComments[] = [];
  checkActionItems =
    environment.env_id === 'csnhc'
      ? ActionItems.checkActionsItemsForCSNHC()
      : ActionItems.checkActionsItems();

  subscriptions: Subscription[] = [];
  isMaping = false;
  companyType: string;
  agGridCellRendererParams: ICellRendererParamsExtended;
  isPendingChecks?: number;
  isClosed = false;
  emailTTP: boolean = false;
  existingDocumentsData: {
    attachments?: IAttachmentItem[] | ICheckAttachmentData[];
    comments?: IComments[];
  } = {};

  demoCheck: boolean;
  payFromItems = V3PaymentsTableData.getPayFromItems();
  shouldEyeDisabled = false;
  isResentable = false;
  isPodCompleted = true;
  isRtpPayment: boolean;
  podItem = {
    label: 'Sent Proof of Delivery',
    icon: 'receipt',
    disableAt: {
      COMPLETED: [],
      PENDING: [],
      PROCESSING: [],
      CANCELED: [],
      FAILED: []
    }
  };

  canSubmitSignedReceiptRequest: boolean = true;

  isFromInternationalPayment=signal<boolean>(false);

  /** Wallet transaction types that have a funding application form to download. */
  private static readonly FUNDING_APPLICATION_TRANSACTION_TYPES = [4, 12, 13, 14];
  faDownload = faDownload;
  faSpinner = faSpinner;
  isDownloadingApplication = false;

  /* Functions */

  /**
   * This function is called on initialisation of the floating component.
   * @param agGridCellRendererParams This contains data like ```rowNode``` as well as the row data
   * we are getting from the backend.
   */
  agInit(agGridCellRendererParams: ICellRendererParamsExtended) {
    this.isFromInternationalPayment.set(agGridCellRendererParams.from === 'international-payment-transactions' || agGridCellRendererParams.data?.transfer_mode === 'INTERNATIONAL PAYMENT');
    this.v3DataTableService.v3EyeButton = false;
    this.agGridCellRendererParams = agGridCellRendererParams;
    if (agGridCellRendererParams.data) {
      if (
        agGridCellRendererParams.data?.source_name !== 'Demo Bank Account 1'
      ) {
        this.demoCheck = true;
      } else if (
        agGridCellRendererParams.data?.third_party_name !== null &&
        agGridCellRendererParams.data?.third_party_name !== '' &&
        agGridCellRendererParams.data?.source?.name !== ''
      ) {
        this.isMaping = true;
        this.isVerticalEllipsisDisabled = true;
      } else {
        this.isMaping = false;
      }
      // this.getData = this._dataTableData.getCellrendrerData(this.tableId);
      this.commonTransactionTableRowData = agGridCellRendererParams;

      if (
        agGridCellRendererParams.data.status === 'PENDING' ||
        (agGridCellRendererParams.data.transfer_type_code === 'check' &&
          agGridCellRendererParams.data.source.source?.toLowerCase() !==
            'wallet')
      ) {
        this.isVerticalEllipsisDisabled = false;
      }

      if (
        agGridCellRendererParams.data.status === 'COMPLETED' ||
        (agGridCellRendererParams.data.status === 'PROCESSING' &&
          (agGridCellRendererParams.data.transfer_type_code === 'wire' ||
            agGridCellRendererParams.data.transfer_type_code === 'ach'))
      ) {
        this.paymentCompleted = false;
      }

      if (
        (agGridCellRendererParams.data.transfer_type_code === 'check' &&
          agGridCellRendererParams.data.source.source?.toLowerCase() !==
            'wallet') ||
        agGridCellRendererParams.data.transfer_type_code === 'checkMail'
      ) {
        this.isTypeCheck = true;
        const checkStatus = this.agGridCellRendererParams?.data.transfer.status;
        if (checkStatus === 504) {
          this.emailTTP = true;
        }
      }

      if (agGridCellRendererParams.data.pod_status === 0) {
        this.isPodCompleted = false;
      }
    }

    this.v3PaymentsTableService.isPendingChecks$.subscribe((val) => {
      this.isPendingChecks = val;
    });
    this.isRtpPayment =
      this.commonTransactionTableRowData?.data?.transfer_mode === 'RTP' ||
      this.commonTransactionTableRowData?.data?.transfer_mode ===
        'RIPPLE INTERNATIONAL PAYMENT';
    this.isResend();
    if (
      this.commonTransactionTableRowData?.showApproveRejectOptions &&
      this.commonTransactionTableRowData?.data?.cheque_status === 622
    ) {
      const commonDisableAt = {
        COMPLETED: [],
        PENDING: [],
        PROCESSING: [],
        CANCELED: [],
        FAILED: [],
        SCHEDULED: []
      };

      this.checkActionItems = [
        { label: 'Approve', icon: 'check', disableAt: commonDisableAt },
        { label: 'Reject', icon: 'close', disableAt: commonDisableAt },
        ...this.checkActionItems
      ];
    }
  }

  ngOnInit(): void {    
    this.subscriptions.push(
      this.cloudService.isSelectedClosedAccount$.subscribe((res) => {
        this.isClosed = res;
      })
    );
    if (environment.env_id === 'csnhc') {
      this.subscriptions.push(
        // eslint-disable-next-line no-underscore-dangle
        this.headerService._headerData.subscribe((res) => {
          if (res && (res as unknown as IHeaderData).isLoggedInAsClient) {
            this.checkActionItems = ActionItems.checkActionsItemsForCSNHCClient();
            this.cdr.markForCheck();
          }
        })
      );
    }
    this.listenForSourceTypeChange();
    this.listenForSourceSelect();
  }

  /**
   * @description This function subscribes to the getter that gets fired when the
   * source type is changed.
   */
  listenForSourceTypeChange() {
    this.subscriptions.push(
      this.v3PaymentsTableService.dynamicSourceNameClearing$.subscribe({
        next: (res) => {
          this.sourceChecker(res);
        }
      })
    );
  }

  /**
   * @description This method will trigger the sourceChecker() when there is a change in the source.
   * eg: Changing 'Bank Accounts', 'Wallets', 'Cards' etc ..
   */
  listenForSourceSelect() {
    this.subscriptions.push(
      this.v3PaymentsTableService.isSourceSelected.subscribe({
        next: (res) => {
          this.sourceChecker(res);
          if (
            res.transferType.length &&
            res.uuid === this.commonTransactionTableRowData.data.uu_id
          ) {
            this.commonTransactionTableRowData.data.transfer_type =
              res.transferType.toUpperCase();
          }
          if (res.transferId.length) {
            if (res.uuid === this.commonTransactionTableRowData.data.uu_id) {
              this.commonTransactionTableRowData.data.transfer_id =
                res.transferId;
            }
          }
        }
      })
    );
  }

  /**
   * @description This method decides whether the eye button should be enabled or disabled based on the source and type.
   * @param res @type {uuid:string}
   */
  sourceChecker(res: { uuid: string }) {
    if (res.uuid === this.commonTransactionTableRowData.data.uu_id) {
      const payOptions = this.payFromItems.filter(
        (elem) =>
          elem.id === this.commonTransactionTableRowData.data.source.source
      )[0]?.payOptions as IPayAsItem[];
      if (payOptions?.length) {
        this.shouldEyeDisabled =
          payOptions.filter(
            (elem) =>
              elem.id ===
              this.commonTransactionTableRowData.data.transfer_type_code
          ).length === 0 || this.checkValidation() === true;
      }
      this.cdr.detectChanges();
    }
  }

  /**
   * @description Check if the fields are valid or not
   * @returns -Returns false if all fields are present
   */
  checkValidation() {
    const sourceType = this.commonTransactionTableRowData.data?.source?.source;
    const sourceId = this.commonTransactionTableRowData.data?.source_id;
    const transferType =
      this.commonTransactionTableRowData.data.transfer_type_code;

    if (!sourceType || !sourceId || !transferType) {
      return true;
    }
    return false;
  }

  /**
   * @description Fired when we click the edit
   * button.
   */
  onEditButtonClick() {
    const checkStatus = this.commonTransactionTableRowData.data?.cheque_status;
    this.router.navigate(
      [
        `/manage/payments/main/edit/${this.commonTransactionTableRowData.data?.uu_id}`
      ],
      { state: { backUrl: this.router.url }, queryParams: { checkStatus } }
    );
  }

  clonePayment() {
    if(this.router.url.includes('international-payment')) {
      this.router.navigate(
        [
          `/manage/international-payment/main/clone/${this.commonTransactionTableRowData.data?.uu_id}`
        ],
        { state: { backUrl: this.router.url, tab: 'new-payment', from: 'recent-transactions' } }
      );
    }else{
    this.router.navigate(
      [
        `/manage/payments/main/clone/${this.commonTransactionTableRowData.data?.uu_id}`
      ],
      { state: { backUrl: this.router.url } }
    );
    }
  }

  /**
   * @description Fired when we click the comment
   * icon.
   */
  openCommentModal() {
    if (this.isTypeCheck) {
      this.checkCommentModal();
    } else {
      this.checkCommentModal();
    }
  }

  checkCommentModal() {
    let mode: string | undefined ;
    if(this.isFromInternationalPayment()) {
      mode = 'international_payments';
    } else if(this.commonTransactionTableRowData.data.transfer_type_code === 'check') {
      mode = undefined;
    } else {
      mode = 'zil_payments';
    }
    const dialogRef = this.dialog.open(CheckAddCommentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      data: {
        id:
          this.commonTransactionTableRowData.data.transfer_type_code === 'check'
            ? this.commonTransactionTableRowData.data.transfer_id
            : this.commonTransactionTableRowData.data.zilpayment_id,
        mode,
        existingData: this.existingDocumentsData.comments
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.isRefresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
      this.existingDocumentsData.comments = res.existingData;
    });
  }

  zilPaymentCommentModal() {
    this.v3PaymentsService
      .openAddComment(
        this.createdExistingComments,
        this.commonTransactionTableRowData.data?.zilpayment_id
      )
      .subscribe((comments: IComments[]) => {
        this.createdExistingComments = comments;
      });
  }

  /**
   * @description Fired when we click the attachment
   * icon.
   */
  openAttachmentModal() {
    if (this.isTypeCheck) {
      this.checkAttachmentModal();
    } else {
      this.checkAttachmentModal();
    }
  }

  /**
   * @description Opens the attachment modal for Check transactions.
   */
  checkAttachmentModal() {
    let mode: string | undefined ;
    if(this.isFromInternationalPayment()) {
      mode = 'international_payments';
    } else if(this.commonTransactionTableRowData.data.transfer_type_code === 'check') {
      mode = undefined;
    } else {
      mode = 'zil_payments';
    }
    const dialogRef = this.dialog.open(CheckAddAttachmentCommonModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      data: {
        id:
          this.commonTransactionTableRowData.data.transfer_type_code === 'check'
            ? this.commonTransactionTableRowData.data.transfer_id
            : this.commonTransactionTableRowData.data.zilpayment_id,
        mode,
        existingData: this.existingDocumentsData.attachments
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.isRefresh) {
        this.v3DataTableService.refreshV3DataTable();
      }

      this.existingDocumentsData.attachments = res?.existingData;
    });
  }

  /**
   * @description Opens the attachment modal for non Check transactions.
   */
  zilPaymentAttachmentModal() {
    this.v3PaymentsService
      .openAddAttachment(
        this.createdExistingAttachments,
        this.commonTransactionTableRowData.data?.zilpayment_id
      )
      .subscribe((attachments: IComments[]) => {
        this.createdExistingAttachments = attachments;
      });
  }

  voidPayment() {
    if (this.commonTransactionTableRowData.data?.uu_id) {
      const id = this.commonTransactionTableRowData.data?.uu_id;
      const chequeStatus = this.commonTransactionTableRowData.data?.cheque_status;
      const content = chequeStatus === 7 || chequeStatus === 505
        ? 'This check is voided only within this platform. It may still be delivered to the payee and could still be presented to the bank. Are you sure you want to void this check?'
        : 'Are you sure you want to void this payment?';
      const response = this.alertService.confirmAlert({
        content,
        cancelMsg: 'No, cancel',
        doneMsg: 'Yes'
      });
      response.afterClosed().subscribe((result) => {
        if (result) {
          if (
            this.commonTransactionTableRowData.data?.transfer_type ===
              'CHECK' &&
            this.commonTransactionTableRowData.data?.source.source?.toLowerCase() !==
              'wallet'
          ) {
            const transferId =
              this.commonTransactionTableRowData.data?.transfer_id;
            this.subscriptions.push(
              this.checkService.voidCheck(transferId).subscribe({
                next: (res) => {
                  if (res) {
                    this.alertService.successAlert({
                      content: 'Voided Successfully'
                    });
                    this.v3DataTableService.refreshV3DataTable();
                  }
                },
              })
            );
          } else {
            this.subscriptions.push(
              this.v3PaymentsService.cancelPayment(id).subscribe({
                next: (res) => {
                  if (res) {
                    this.alertService.successAlert({
                      content: 'Voided Successfully'
                    });
                    this.v3DataTableService.refreshV3DataTable();
                  }
                },
              })
            );
          }
        }
      });
    }
  }

  /**
   *
   * @description Determines whether the  action should be disabled based on the status and transfer mode of the common transaction row data.
   */
  isDisable() {
    const status = this.commonTransactionTableRowData?.data?.status;
    const transferMode =
      this.commonTransactionTableRowData?.data?.transfer_mode;
    if (status === 'COMPLETED') {
      switch (transferMode) {
        case 'EMAIL CHECK':
          return true;
        case 'MAIL CHECK':
          return true;
        default:
          return false;
      }
    } else if (status === 'PROCESSING' && transferMode === 'ACH') {
      return true;
    }
    return this.isVerticalEllipsisDisabled;
  }

  deletePayment() {
    if (this.commonTransactionTableRowData.data?.uu_id) {
      const id = this.commonTransactionTableRowData.data?.uu_id;
      const response = this.alertService.confirmAlert();
      response.afterClosed().subscribe((result) => {
        if (result) {
          if (
            this.commonTransactionTableRowData.data?.transfer_type ===
              'CHECK' &&
            this.commonTransactionTableRowData.data?.transfer_id
          ) {
            const transferId =
              this.commonTransactionTableRowData.data?.transfer_id;
            this.subscriptions.push(
              this.checkService.deleteCheck(transferId).subscribe((res) => {
                if (res) {
                  this.alertService.successAlert({
                    content: 'Deleted Successfully'
                  });
                  this.v3DataTableService.refreshV3DataTable();
                }
              })
            );
          } else {
            this.subscriptions.push(
              this.v3PaymentsService.deletePayment(id).subscribe((res) => {
                if (res) {
                  this.alertService.successAlert({
                    content: 'Deleted Successfully'
                  });
                  this.v3DataTableService.refreshV3DataTable();
                }
              })
            );
          }
        }
      });
    }
  }

  /**
   *
   * @description Check whether the check is ready to be re-emailed or not.
   */
  isResend() {
    const status = this.commonTransactionTableRowData?.data?.status;
    const transferMode =
      this.commonTransactionTableRowData?.data?.transfer_mode;
    if (status === 'COMPLETED' && transferMode === 'EMAIL CHECK') {
      this.isResentable = true;
    } else {
      this.isResentable = false;
    }
  }

  /**
   * @description -Checks if confirmation is required for a transaction based on its status.
   * @returns Returns `true` if confirmation is required, `false` otherwise.
   */
  confirmCheck() {
    this.companyType = this.localStorageService.getItem('activeCompanyType');
    const status = this.commonTransactionTableRowData?.data?.status;
    if (status === 'APPROVAL_REQUIRED' && this.companyType === 'owncmp') {
      return true;
    }
    return false;
  }

  /**
   * Checks if a row's approval and rejection actions are disabled or not.
   * @returns - true if disabled. else false;
   */
  isApprovalRejectDisalbed(): boolean {
    return (
      this.isPendingChecks === 0 &&
      this.commonTransactionTableRowData?.data?.status === 'APPROVAL_REQUIRED'
    );
  }

  /**
   * @description  Handles the click event of an action button.
   * @param action - The action associated with the clicked button.
   */
  onActionButtonClick(action: string) {
    switch (action) {
      case 'Print':
        this.singleCheckPrint();
        break;
      case 'Edit':
        this.onEditButtonClick();
        break;
      case 'Void':
        this.voidPayment();
        break;
      case 'Delete':
        this.deletePayment();
        break;
      case 'Add Comment':
        this.openCommentModal();
        break;
      case 'Add Attachment':
        this.openAttachmentModal();
        break;
      case 'Check Activity':
      case 'Audit Activity':
        this.activityModal();
        break;
      case 'Payee Summary':
        this.goToPayeeSummary();
        break;
      case 'Clone This Check':
        this.cloneThecheck();
        break;
      case 're-email':
        this.reEmailCheck();
        break;
      case 'approve':
        this.manageCheckApprove();
        break;
      case 'reject':
        this.manageCheckReject();
        break;
      case 'force-email':
        this.forceEmail();
        break;
      case 'Send Payment Proof':
        this.sendPaymentProof('pp');
        break;
      case 'Send Mail Payment Proof':
        this.sendMailPaymentProof();
        break;
      case 'Edit Payee':
        this.editPayee();
        break;
      case 'Get Signed Receipt':
        this.getReceipt();
        break;
      case 'View Receipt':
        this.getReceipt();
        break;
      case 'Approve':
        this.v3PaymentsTableService.handleReprintCheckRequest(
          [this.commonTransactionTableRowData.data?.transfer_id],
          'approve',
          false
        );
        break;
      case 'Reject':
        this.v3PaymentsTableService.handleReprintCheckRequest(
          [this.commonTransactionTableRowData.data?.transfer_id],
          'reject',
          false
        );
        break;
      default:
        break;
    }
  }

  /**
   * @description -Method to force email a check
   */
  forceEmail() {
    const checkId = this.commonTransactionTableRowData.data?.transfer_id;
    this.v3PaymentsService.checkForceEmail(checkId);
  }

  /**
   * @description -Initiates the reject process for a check based on user confirmation.
   */
  manageCheckApprove() {
    const checkId = this.commonTransactionTableRowData.data?.transfer_id;
    this.v3PaymentsService.processCheckApproval([checkId]);
  }

  manageCheckReject() {
    const checkId = this.commonTransactionTableRowData.data?.transfer_id;
    this.v3PaymentsService.processCheckReject([checkId]);
  }

  /**
   *
   * @description Determines whether the check action should be disabled based on the status and transfer mode of the common transaction row data.
   */
  IsActionDisable(item: ICheckActionList) {
    const status = this.commonTransactionTableRowData?.data?.status;
    const checkStatus = this.commonTransactionTableRowData?.data?.cheque_status;
    const podStatus = this.commonTransactionTableRowData?.data?.pod_status;
    const transferMode =
      this.commonTransactionTableRowData?.data?.transfer_mode;
    const checkStatusValue = this.agGridCellRendererParams?.checkStatus?.value;
    const transferTypeCode =
      this.commonTransactionTableRowData?.data?.transfer_type_code;
    if (checkStatusValue?.startsWith('DD') && item.label === 'Print') {
      return true;
    }

    if (
      status === 'SCHEDULED' &&
      (item.label === 'Print' ||
        item.label === 'Edit' ||
        item.label === 'Void' ||
        item.label === 'Edit Payee' ||
        item.label === 'Delete')
    ) {
      return true;
    }

    if (
      (this.commonTransactionTableRowData?.data?.transfer?.status === 507 ||
        this.commonTransactionTableRowData?.data?.transfer?.status === 807) &&
      item.label === 'Print'
    ) {
      return true;
    }

    if (
      this.commonTransactionTableRowData?.data?.transfer_type === 'MAIL' &&
      (item.label === 'Check Activity' || item.label === 'Audit Activity')
    ) {
      return true;
    }

    if (
      transferTypeCode === 'checkMail' ||
      (this.commonTransactionTableRowData?.data?.transfer?.status === 1002 &&
        (item.label === 'Print' ||
          ((item.label === 'Edit' ||
            item.label === 'Void' ||
            item.label === 'Edit Payee') &&
            status !== 'PENDING')))
    ) {
      return true;
    }

    if (
      item.label === 'Send Payment Proof' &&
      status !== 'COMPLETED' &&
      status !== 'PROCESSING' &&
      checkStatusValue !== 'Mailed'
    ) {
      return true;
    }

    if (
      item.label === 'Send Mail Payment Proof' &&
      checkStatusValue !== 'Mailed'
    ) {
      this.checkActionItems = this.checkActionItems.filter(
        (data) => data.label !== 'Send Mail Payment Proof'
      );
      return true;
    }

    if (
      item.label === 'Sent Proof of Delivery' &&
      ((status !== 'COMPLETED' && checkStatusValue !== 'Mailed') ||
        podStatus === 1)
    ) {
      return true;
    }

    if (
      item.label === 'Get Signed Receipt' &&
      ((status !== 'COMPLETED' && checkStatusValue !== 'Mailed') ||
        podStatus === 1)
    ) {
      this.isSignedReceiptForCheckEnabled = false;
      return false;
    }

    if (
      (item.label === 'Edit' ||
        item.label === 'Void' ||
        item.label === 'Edit Payee') &&
      (status === 'CANCELED' || checkStatus === 807)
    ) {
      return true;
    }
    if (item.label === 'Cancel' && status === 'APPROVAL_REQUIRED') {
      return true;
    }
    if (
      item.label === 'Delete' &&
      (status === 'CANCELED' || checkStatus === 807)
    ) {
      return true;
    }

    if (
      transferMode === 'MAIL CHECK' &&
      [52, 151].includes(checkStatus) &&
      status === 'PENDING' &&
      (item.label === 'Edit' ||
        item.label === 'Delete' ||
        item.label === 'Edit Payee')
    ) {
      return true;
    }
    if (
      this.commonTransactionTableRowData.data.transfer_type === 'CHECK' &&
      this.commonTransactionTableRowData.data.source.source === 'WALLET' &&
      item.label === 'Print'
    ) {
      return true;
    }

    if (
      this.commonTransactionTableRowData.data.transfer_type === 'CHECK' &&
      this.commonTransactionTableRowData.data.source.source === 'WALLET' &&
      this.commonTransactionTableRowData.data.transfer.status === 1 &&
      (item.label === 'Edit' ||
        item.label === 'Delete' ||
        item.label === 'Void')
    ) {
      return true;
    }

    if (
      transferMode === 'MAIL CHECK' &&
      [50].includes(checkStatus) &&
      status === 'PENDING' &&
      (item.label === 'Delete' || item.label === 'Edit Payee')
    ) {
      return true;
    }

    if (status && transferMode && ![50, 52, 151]?.includes(checkStatus)) {
      return item.disableAt[status]?.includes(transferMode);
    }

    if (
      this.commonTransactionTableRowData?.data?.third_party_name !== null &&
      this.commonTransactionTableRowData?.data?.source?.name === ''
    ) {
      return true;
    }
    return false;
  }

  /**
   * @description re-email the check
   */
  reEmailCheck() {
    const checkId = this.commonTransactionTableRowData.data?.transfer_id;
    if (checkId) {
      this.subscriptions.push(
        this.checkService.reEmailCheck(checkId).subscribe((data) => {
          if (data?.success) {
            this.alertService.successAlert({
              content: 'Emailed',
              close: true,
              timeout: 1500
            });
          }
        })
      );
    }
  }

  singleCheckPrint() {
    const isVirtualAccount =
      this.commonTransactionTableRowData?.data?.source?.info?.isVirtualAccount;
    if (isVirtualAccount) {
      const notification = this.alertService.infoAlert({
        content: `Since you added your Bank account using instant verification, we received a virtual account number. This works for ACH and wire transfers, but won't work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.`,
        doneMsg: 'Update',
        isCancel: true
      });
      notification.afterClosed().subscribe((res) => {
        if (res) {
          const confirmationDialog = this.dialog.open(
            VirtualAccountConfirmationModalComponent,
            {
              maxWidth: '1200px',
              width: '100%',
              disableClose: true,
              data: {
                bankAccountIds: [
                  this.commonTransactionTableRowData?.data?.source_id
                ]
              }
            }
          );

          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.processSingleCheckPrint();
            }
          });
        }
      });
    } else if (
      this.commonTransactionTableRowData?.data?.source?.info?.verifiedBy ===
        88 &&
      this.commonTransactionTableRowData?.data?.source?.info?.verified === 0
    ) {
      this.alertService
        .failedAlert({
          content:
            'Your Bank account verification was rejected. You won’t be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.',
          doneMsg: 'Update',
          isCancel: true
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            const confirmationDialog = this.dialog.open(
              VirtualAccountConfirmationModalComponent,
              {
                maxWidth: '1200px',
                width: '100%',
                disableClose: true,
                data: {
                  bankAccountIds: [
                    this.commonTransactionTableRowData?.data?.source_id
                  ]
                }
              }
            );

            confirmationDialog.afterClosed().subscribe((result) => {
              if (result && result.refreshTable) {
                this.v3DataTableService.refreshV3DataTable();
              }
              if (result && result.success) {
                this.processSingleCheckPrint();
              }
            });
          }
        });
    } else {
      this.processSingleCheckPrint();
    }
  }

  /**
   * @description Print single check
   */
  processSingleCheckPrint() {
    const verificationDetails: IGettingStartedAPI =
      this.localStorageService.getItem('gettingStartedData');
    if (verificationDetails.verification === 0) {
      this.verifyEmailAndMobile();
      return;
    }
    const checkId = this.commonTransactionTableRowData.data?.transfer_id;
    const checkAmount = this.commonTransactionTableRowData.data?.amount;
    if (checkId) {
      this.subscriptions.push(
        this.checkService.printSingleCheck(checkId).subscribe({
          next: (res) => {
            if (res.success) {
              this.scriptService.gtagEventScript('check-printed', {
                amount: checkAmount
              });
              const urlLoaded = window.open(res.data.url);
              if (urlLoaded) {
                this.v3DataTableService.refreshV3DataTable();
              }
              if (
                !urlLoaded ||
                urlLoaded.closed ||
                typeof urlLoaded.closed === 'undefined'
              ) {
                const dref = this.openWarningAlert(
                  'A popup blocker may be preventing the application from opening the pdf file. You may disable popup blocker from your browser settings',
                  'Try Again'
                );
                dref.afterClosed().subscribe(() => {
                  window.open(res.data.url);
                  this.v3DataTableService.refreshV3DataTable();
                });
              }
            }
          },
          error: (err) => {
            if (
              (err.error.errorMsg ===
                'Sorry,You are not authorized to this resource' && !this.router.url.includes('/v4/')) ||
              err.error.errorCode === 127
            ) {
              this.alertService.warningAlert({
                content: "You don't have permission to do this action."
              });
            } else if (err.error.errorCode === 125) {
              this.alertService.warningAlert({
                content: `This check cannot be printed. Administrator approval is required before proceeding.`
              });
            } else if (err.error.errorCode === 129) {
              this.alertService.warningAlert({
                content: `The check is not eligible for printing`
              });
            } else if (err.error.errorCode === 123) {
              const accountType = err.error.errorMsg.chimeSerialNumber
                ? 'Neo-bank'
                : 'Zil';
              this.alertService.warningAlert({
                content: `This check cannot be printed. Currently, the ${accountType} account is only set up for ACH/Direct Deposit.`
              });
            } else if (err.error.errorCode === 621) {
              const alert = this.alertService.warningAlert({
                content: `${err.error.errorMsg}. Please request re-print approval from your administrator.`,
                doneMsg: 'Request Re-print',
                isCancel: true
              });
              alert.afterClosed().subscribe((res) => {
                if (res) {
                  this.v3PaymentsTableService.requestRePrintApproval(
                    [this.commonTransactionTableRowData.data?.transfer_id],
                    false
                  );
                }
              });
            } else if (
              typeof err.error.errorMsg === 'string' &&
              err.error.errorType !== 'subscription' && !err.error.permissionType
            ) {
              this.alertService.warningAlert({ content: err.error.errorMsg });
            }
          }
        })
      );
    }
  }

  goToPayeeSummary() {
    const payeeId = this.commonTransactionTableRowData.data?.payee_id;
    this.payeeDetailsFormat(payeeId);
    this.router.navigate(['/manage/payees']);
  }

  /**
   * @returns  the formatted payee details for show data in payeeTable
   */
  payeeDetailsFormat(payeeId: string) {
    this.subscriptions.push(
      this.payeeService.getPayeeEditData(payeeId).subscribe((res) => {
        const payeeDetails: IPayeeDropdown = {
          addressLine1: res.data.payeeAddressLine1,
          addressLine2: res.data.payeeAddressLine2,
          city: res.data.payeeCity,
          company: res.data.payeeCompanyName,
          country: res.data.payeeCountry,
          email: res.data.payeeEmail,
          encryptedId: payeeId,
          id: payeeId,
          name: res.data.name,
          nickName: res.data.payeeNickName,
          payeeTypeId: res.data.payeeTypeId,
          phone: res.data.payeePhone,
          state: res.data.payeeState,
          zip: res.data.payeeZip
        };
        this.payeeDataService.actionSignal.update(() => 'details');
        this.payeeDataService.payeeDataSignal.set(payeeDetails);
        this.payeeDataService.setPayeeView(true);
        this.payeeDataService.isFromPayeeSummary.set(true);
      })
    );
  }

  cloneThecheck() {
    this.router.navigate(
      [
        `/manage/payments/main/clone/${this.commonTransactionTableRowData.data?.uu_id}`
      ],
      { state: { backUrl: this.router.url } }
    );
  }

  /**
   * @description Open the activity modal to display all check activities.
   */
  activityModal(): void {
    this.dialog.open(CheckActivityModalComponent, {
      width: '70%',
      data: this.commonTransactionTableRowData.data?.transfer_id,
      disableClose: true
    });
  }

  /**
   * @description- Opens a warning alert dialog with the specified content and optional custom "Done" button text.
   * @param content - The content/message to be displayed in the warning alert.
   * @param doneMsg - Optional. The custom text for the "Done" button. If not provided, defaults to 'OK'.
   * @returns - The result of the warning alert dialog
   */
  openWarningAlert(content: string, doneMsg?: string) {
    const data = {
      title: 'Error',
      content,
      doneMsg: doneMsg || 'OK'
    };
    return this.alertService.warningAlert(data);
  }

  /**
   * @description This is a dynamic common function that we are getting
   * from the column definition. We can change the functionality of the
   * function by passing in a different value in the column definition of
   * ```viewButtonType```.
   */
  viewButtonAction() {
    if (
      this.commonTransactionTableRowData?.onViewClick &&
      this.commonTransactionTableRowData?.data
    ) {
      this.commonTransactionTableRowData.onViewClick(
        this.commonTransactionTableRowData.data
      );
      return;
    }
    if (
      this.commonTransactionTableRowData.tableId === 86 ||
      this.commonTransactionTableRowData.tableId === 87
    ) {
      window.open(
        `/manage/wallet/view/${this.commonTransactionTableRowData.data?.uu_id}`
      );
      return;
    }

    if (this.commonTransactionTableRowData.tableId === 91) {
      this.router.navigate(['manage/developer/api-log-details'], {
        queryParams: { id: this.commonTransactionTableRowData.data.id }
      });
      return;
    }

    this.paymentsService.isFromViewPage = true;
    if (this.isClosed) {
      this.alertService.infoAlert({
        content: 'This account is closed. You can only access the statement.'
      });
      return;
    }
    if (
      this.isMaping ||
      this.shouldEyeDisabled ||
      (this.checkValidation() &&
        this.commonTransactionTableRowData.tableId !== 20)
    ) {
      return;
    }
    if (this.agGridCellRendererParams?.tableName === 'payment_table') {
      this.v3DataTableService.v3EyeButton = true;
    } else {
      this.v3DataTableService.v3EyeButton = false;
    }
    if (this.commonTransactionTableRowData) {
      const { viewButtonType } = this.commonTransactionTableRowData;
      const checkStatusValue =
        this.agGridCellRendererParams?.checkStatus?.value;
      const status = this.commonTransactionTableRowData?.data?.status;
      if (viewButtonType === 0) {
        if (
          this.commonTransactionTableRowData?.data?.transfer_type === 'CHECK' &&
          this.commonTransactionTableRowData?.data?.source?.source !== 'WALLET'
        ) {
          const checkId = this.commonTransactionTableRowData?.data?.transfer_id;
          const uuid = this.commonTransactionTableRowData?.data?.uu_id;
          let zilId: string | null = null;
          if (status !== 'COMPLETED' && checkStatusValue !== 'Mailed') {
            zilId = null;
          } else {
            zilId = this.commonTransactionTableRowData?.data?.action;
          }
          const queryParams: { uuid: string; zilId?: string } = { uuid };

          if (zilId !== null) {
            queryParams.zilId = zilId;
          }
          this.router.navigate(['/manage/cheque/view/', checkId], {
            state: {
              backUrl: this.router.url,
              signatureUrl:
                this.commonTransactionTableRowData?.data?.signature_url
            },
            queryParams
          });
        } else {
          const uuid = this.commonTransactionTableRowData?.data?.uu_id;
          this.router.navigate(['/manage/payments-table/payment-view', uuid], {
            state: { backUrl: this.router.url }
          });
        }
      }
      if (viewButtonType === 1) {
        const id = this.commonTransactionTableRowData?.data?.id;
        this.dialog.open(WalletActionViewModalComponent, {
          maxWidth: '900px',
          width: '93%',
          data: { id }
        });
      }
    }
  }

  /**
   * Method for handling send payment proof action
   * @param {}mode - pp indicates Payment proof and pod indicate Proof of Delivery
   */
  sendPaymentProof(mode: 'pp' | 'pod') {
    this.dialog.open(SendPaymentProofModalComponent, {
      maxWidth: '500px',
      width: '93%',
      data: {
        checkStatus: this.commonTransactionTableRowData?.checkStatus,
        uuId: this.commonTransactionTableRowData.data?.uu_id,
        encryptedId: this.commonTransactionTableRowData.data?.zilpayment_id,
        mode,
        payee: {
          email: this.commonTransactionTableRowData.data?.payee_email,
          phone: this.commonTransactionTableRowData.data?.payee_phone
        },
        amount: this.commonTransactionTableRowData.data.amount
      },
      disableClose: true
    });
  }

  /**
   * Method for handling send mail payment proof action
   */
  sendMailPaymentProof() {
    this.dialog.open(SendPaymentProofModalComponent, {
      maxWidth: '500px',
      width: '93%',
      data: {
        checkStatus: this.commonTransactionTableRowData?.checkStatus,
        uuId: this.commonTransactionTableRowData.data?.uu_id,
        encryptedId: this.commonTransactionTableRowData.data?.zilpayment_id,
        isMailProof: true,
        amount: this.commonTransactionTableRowData.data.amount,
        mode: 'pp'
      },
      disableClose: true
    });
  }

  /**
   * @description Method invoked when view action button is clicked (for cloud data table).
   * @param buttonLabel - Label of action button.
   */
  onCloudViewAction(buttonLabel: string) {
    this.agGridCellRendererParams.onCloudViewAction(
      this.agGridCellRendererParams.data,
      buttonLabel
    );
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
        this.router.navigate(['/manage/users/verify-email-phone'], {
          queryParams: {
            returnUrl: 'manage/payments-table/index'
          }
        });
      }
    });
  }

  editPayee() {
    const payeeId = this.commonTransactionTableRowData.data?.payee_id;
    this.subscriptions.push(
      this.payeeModalService
        .openEditPayee(payeeId, undefined, {
          edit: true,
          id: payeeId,
          type: 'string'
        })
        .subscribe((payeeModal) => {
          if (payeeModal) {
            this.subscriptions.push(
              payeeModal.afterClosed().subscribe((res) => {
                if (res?.success) {
                  this.v3DataTableService.refreshV3DataTable();
                  this.store.dispatch(
                    payeesActions.loadPayees({
                      searchTerm: '',
                      skipEmpty: true,
                      isReload: true
                    })
                  );
                }
              })
            );
          }
        })
    );
  }

  getReceipt() {
    if (
      ((this.paymentCompleted || this.isPodCompleted || this.isRtpPayment) &&
        !this.isTypeCheck) ||
      (!this.isSignedReceiptForCheckEnabled && this.isTypeCheck)
    ) {
      this.canSubmitSignedReceiptRequest = false;
    }

    if (this.commonTransactionTableRowData.data?.signature_url === null) {
      this.dialog
        .open(GetReceiptModalComponent, {
          maxWidth: '550px',
          width: '93%',
          disableClose: true,
          panelClass: 'paddingless-modal',
          data: {
            canSubmitSignedReceiptRequest: this.canSubmitSignedReceiptRequest,
            transactionId: this.commonTransactionTableRowData.data?.uu_id,
            zilId: this.commonTransactionTableRowData.data?.zilpayment_id,
            payee: {
              email: this.commonTransactionTableRowData.data?.payee_email,
              phone: this.commonTransactionTableRowData.data?.payee_phone
            },
            previewData: {
              senderName: this.commonTransactionTableRowData.data?.source_name,
              payeeName: this.commonTransactionTableRowData.data?.payee_name,
              amount: this.commonTransactionTableRowData.data?.amount,
              type: this.commonTransactionTableRowData.data?.transfer_type,
              address:
                this.commonTransactionTableRowData.data?.payee_address_line1,
              reference: this.commonTransactionTableRowData.data?.reference_no,
              paymentDate: this.commonTransactionTableRowData.data?.created_at
            }
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res && res.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.cdr.detectChanges();
          }
        });
    } else {
      this.dialog.open(SendReceiptModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        data: {
          transactionId: this.commonTransactionTableRowData.data?.uu_id,
          payee: {
            email: this.commonTransactionTableRowData.data?.payee_email,
            phone: this.commonTransactionTableRowData.data?.payee_phone
          }
        }
      });
    }
  }

  viewSignedReceipt() {
    const payload: IPaymentsProofPayload = {
      type: ['download'],
      is_signature_request: false
    };
    this.subscriptions.push(
      this.paymentsService
        .sendPaymentReceipt(
          this.commonTransactionTableRowData.data?.uu_id,
          payload
        )
        .subscribe((res) => {
          window.open(res.data, '_blank');
        })
    );
  }

  /**
   * @description Whether the wallet transaction has a funding application form to download.
   */
  get showFundingApplication(): boolean {
    return (
      this.commonTransactionTableRowData?.tableId === 20 &&
      this.commonTransactionTableRowData?.data?.status === 1 &&
      V3ViewButtonComponent.FUNDING_APPLICATION_TRANSACTION_TYPES.includes(
        this.commonTransactionTableRowData?.data?.transaction_type
      )
    );
  }

  /**
   * @description Asks for confirmation, then fetches the funding application
   * form url of the wallet transaction and opens it in a new tab.
   */
  downloadFundingApplication() {
    if (this.isDownloadingApplication) {
      return;
    }
    this.alertService
      .confirmAlert({
        content: 'Do you want to download the application?',
        doneMsg: 'Yes',
        cancelMsg: 'No, cancel'
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.isDownloadingApplication = true;
        this.cdr.detectChanges();
        this.subscriptions.push(
          this.walletService
            .getFundingApplicationForm(
              this.commonTransactionTableRowData.data?.uu_id
            )
            .subscribe({
              next: (res) => {
                this.isDownloadingApplication = false;
                this.cdr.detectChanges();
                if (res?.data?.url) {
                  window.open(res.data.url, '_blank');
                }
              },
              error: () => {
                this.isDownloadingApplication = false;
                this.cdr.detectChanges();
              }
            })
        );
      });
  }

  /**
   * @description To Destroy the existing subscriptions
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
