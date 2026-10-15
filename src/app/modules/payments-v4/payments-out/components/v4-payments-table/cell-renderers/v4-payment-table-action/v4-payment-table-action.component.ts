import { Subscription } from 'rxjs';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  inject
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ICommentsAndAttachmentsCount,
  ICommonTransactionTableData
} from 'src/app/models/v3-common';
import { ICellRendererParams } from '@ag-grid-community/core';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { V4CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-attachment-common-modal/v4-check-add-attachment-common-modal.component';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { IAttachmentItem } from 'src/app/models/common';
import { ICheckAttachmentData } from 'src/app/modules/check/model/check';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import {
  checkStatus,
  statusCodesWithFilter
} from 'src/app/modules/check/components/methods/check-methods';
import { paymentsTableStatus } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table-data';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PaidStatementModalV4Component } from 'src/app/shared/v3/paid-statement-modal/v4/paid-statement-modal-v4.component';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { SendPaymentMode } from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';

/**
 * @description Interface to include 'cellRendererParams' in 'agGridCellRendererParams' in agInit.
 */
interface ICellRendererParamsExtended extends ICellRendererParams {
  tableType?: string;
  checkStatus?: { value: string; color: string };
  getCommentsAndAttachmentsCount?: () => ICommentsAndAttachmentsCount[];
  onStatusIconClick?: (
    accountId: string,
    type: 'attachment' | 'comment'
  ) => void;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    CommonButtonV4Component,
    CommonFilterIconComponent,
    FontAwesomeModule,
    MatTooltipModule
  ],
  providers: [TitleCasePipe],
  selector: 'app-v4-payment-table-action',
  templateUrl: './v4-payment-table-action.component.html',
  styleUrls: ['./v4-payment-table-action.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4PaymentTableActionComponent implements OnDestroy {
  /* Injectors */
  private dialog = inject(MatDialog);
  private v3DataTableService = inject(V3DataTableService);
  private v3PaymentsTableService = inject(V3PaymentsTableService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private titleCasePipe = inject(TitleCasePipe);
  private alertService = inject(V4AlertService);
  private checkService = inject(CheckService);
  private dataTableService = inject(DataTableService);
  private paymentsV4Service = inject(PaymentsV4Service);

  /* Variables */
  commonTransactionTableRowData: ICommonTransactionTableData;
  dynamicFontColor = '';
  areAttachmentsPresent = false;
  areCommentsPresent = false;
  subscriptions: Subscription[] = [];
  isPaymentTypeCheck = false;
  agGridCellRendererParams: ICellRendererParamsExtended;
  commentsAndAttachmentsCount: ICommentsAndAttachmentsCount[];
  existingDocumentsData: {
    attachments?: IAttachmentItem[] | ICheckAttachmentData[];
    comments?: IComments[];
  } = {};

  isFieldInvalid = false;
  invalidField = 'source';
  toolTip: string;
  isTrackingMail = false;
  trackingUrl: string;
  subscription: Subscription[] = [];
  mailingType: string;
  checkstatusList = statusCodesWithFilter;
  statuscode = checkStatus;
  otherPaymentsStatus = paymentsTableStatus;
  isBillTable = false;

  /* Functions */

  /**
   * This function is called on initialisation of the floating component.
   * @param agGridCellRendererParams This contains the row data
   * we are getting from the backend.
   */
  agInit(agGridCellRendererParams: ICellRendererParamsExtended) {
    if (agGridCellRendererParams.data) {
      this.agGridCellRendererParams = agGridCellRendererParams;
      this.commonTransactionTableRowData = agGridCellRendererParams.data;
      if (
        agGridCellRendererParams.data.transfer_type_code === 'check' &&
        agGridCellRendererParams.data?.source?.source?.toLowerCase() !==
          'wallet'
      ) {
        this.dynamicFontColor =
          agGridCellRendererParams.checkStatus?.color ?? '';
      } else {
        this.dynamicFontColor =
          this.commonTransactionTableRowData?.status?.toLowerCase() ?? '';
      }
      if (
        agGridCellRendererParams.data?.third_party_name !== null &&
        agGridCellRendererParams.data?.source?.name === ''
      ) {
        this.isFieldInvalid = true;
      }
      /**
       * @description Only required for payments table. 'tableType' is passed in to 'cellRendererParams' in the respective ColDef
       */
      if (agGridCellRendererParams.tableType === 'payments-table') {
        this.getCheckCommentsAndAttachments(
          agGridCellRendererParams.data.transfer_id,
          agGridCellRendererParams.data.zilpayment_id
        );
        this.listenForGetCountCompletion();
        this.getCheckTrackingUrls();
      }
      if (agGridCellRendererParams.tableType === 'bill_table') {
        this.isBillTable = true;
      }
      this.getCheckStatus();
    }
  }

  /**
   * @description Get check mailing tracking url.
   */
  getCheckTrackingUrls() {
    this.subscriptions.push(
      this.checkService.checkTrackingUrls.subscribe((res) => {
        if (res === null) return;
        if (
          res[this.commonTransactionTableRowData.transfer_id]?.chequeId ===
          this.commonTransactionTableRowData.transfer_id
        ) {
          this.toolTip = res[this.commonTransactionTableRowData.transfer_id]
            .mailedUsing as string;
          this.mailingType = res[this.commonTransactionTableRowData.transfer_id]
            .mailedUsing as string;
          this.isTrackingMail = true;
          this.trackingUrl = res[this.commonTransactionTableRowData.transfer_id]
            .trackingUrl as string;
          this.changeDetectorRef.markForCheck();
        }
      })
    );
  }

  /**
   * @description Function in which we subscribe to the getter
   * which is fired when the Get Count API is completed.
   */
  listenForGetCountCompletion() {
    this.subscriptions.push(
      this.v3PaymentsTableService.updateOnGetCountAPICompletion$.subscribe({
        next: (isCompleted) => {
          if (isCompleted) {
            this.getCheckCommentsAndAttachments(
              this.commonTransactionTableRowData.transfer_id,
              this.commonTransactionTableRowData.zilpayment_id
            );
          }
        }
      })
    );
  }

  /**
   * @description In this function we check if each row has either
   * an attachment or comment and we assign it.
   */
  getCheckCommentsAndAttachments(checkId: string, zilPayId = '') {
    this.v3PaymentsTableService.attachmentsAndCommentsList?.forEach((item) => {
      if (checkId === item.id || zilPayId === item.id) {
        if (item.attachment === 1) {
          this.areAttachmentsPresent = true;
        } else {
          this.areAttachmentsPresent = false;
        }
        if (item.comment === 1) {
          this.areCommentsPresent = true;
        } else {
          this.areCommentsPresent = false;
        }
      }
    });
    this.changeDetectorRef.markForCheck();
  }

  /**
   * Returns a string after replacing all "_" with whitespaces from a given string.
   */
  undersquareToWhitespace(value?: string) {
    return value ? value.replace(/_/, ' ') : undefined;
  }

  /**
   * @description Opens the attachment modal.
   */
  openAttachmentModal() {
    const dialogRef = this.dialog.open(
      V4CheckAddAttachmentCommonModalComponent,
      {
        maxWidth: '700px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          id:
            this.commonTransactionTableRowData.transfer_type_code === 'check'
              ? this.commonTransactionTableRowData.transfer_id
              : this.commonTransactionTableRowData.zilpayment_id,
          mode:
            this.commonTransactionTableRowData.transfer_type_code === 'check'
              ? undefined
              : 'zil_payments',
          existingData: this.existingDocumentsData.attachments
        }
      }
    );

    dialogRef.afterClosed().subscribe((res) => {
      if (res.isRefresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
      this.areAttachmentsPresent = (res.existingData?.length ?? 0) > 0;
      this.existingDocumentsData.attachments = res.existingData;
    });
  }

  /**
   * @description Opens the comment modal
   */
  openCommentModal() {
    const dialogRef = this.dialog.open(V4CheckAddCommentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      data: {
        id:
          this.commonTransactionTableRowData.transfer_type_code === 'check'
            ? this.commonTransactionTableRowData.transfer_id
            : this.commonTransactionTableRowData.zilpayment_id,
        mode:
          this.commonTransactionTableRowData.transfer_type_code === 'check'
            ? undefined
            : 'zil_payments',
        existingData: this.existingDocumentsData.comments
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.isRefresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
      this.areCommentsPresent = (res.existingData?.length ?? 0) > 0;
      this.existingDocumentsData.comments = res.existingData;
    });
  }

  /**
   * @description Opens the statement modal
   */
  openStatement() {
    if (
      this.mailingType === 'First Class' ||
      (this.mailingType &&
        this.mailingType !== 'First Class' &&
        !this.trackingUrl)
    )
      return;
    if (this.isTrackingMail) {
      this.getCheckTrackDetails();
      return;
    }
    let uuid = this.commonTransactionTableRowData?.uu_id;
    if (
      this.isBillTable &&
      this.commonTransactionTableRowData?.zil_payment_uu_id
    ) {
      uuid = this.commonTransactionTableRowData?.zil_payment_uu_id;
    }
    this.dialog.open(PaidStatementModalV4Component, {
      maxWidth: '900px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: { uuid }
    });
  }

  /**
   * Getter for transfer mod text. returns value with given conditions.
   * To be called in template.
   */
  get transferModeStatus(): string | undefined {
    const checkStatusArray = this.agGridCellRendererParams?.checkStatus;
    const status = this.titleCasePipe.transform(
      this.commonTransactionTableRowData?.status
    );
    if (
      this.agGridCellRendererParams.data?.is_voided_scheduled_check === true &&
      this.agGridCellRendererParams?.data?.cheque_status === 2
    ) {
      return 'Mail Scheduled-Void';
    }
    // Display "Void" for cheque_status 807 (voided pending approval)
    if (this.agGridCellRendererParams?.data?.cheque_status === 807) {
      return 'Mailed & Voided';
    }

    if (this.commonTransactionTableRowData.transfer_type_code === 'check') {
      return checkStatusArray?.value ?? this.undersquareToWhitespace(status);
    }
    return this.undersquareToWhitespace(status);
  }

  /**
   * @returns Invalid if any field is empty or null
   */
  checkValidation() {
    const sourceType = this.commonTransactionTableRowData.source.source;
    const sourceId = this.commonTransactionTableRowData.source_id;
    const transferType = this.commonTransactionTableRowData.transfer_type_code;

    if (!sourceType || !sourceId || !transferType) {
      if (!transferType) {
        this.invalidField = 'type';
      } else {
        this.invalidField = 'source';
      }
      return true;
    }

    return false;
  }

  /**
   * @description We show that fields are not validated if any one item is missing.
   */
  checkIfFieldsAreUpdated() {
    this.v3PaymentsTableService.triggerPaymentsTableValidation$.subscribe({
      next: (res) => {
        if (res) {
          this.isFieldInvalid = this.checkValidation();
          this.changeDetectorRef.markForCheck();
        }
      }
    });
  }

  /**
   * @description Gets triggered if we click on the pay button and opens the send payment
   * modal if all the fields are valid.
   */
  onPayButtonClick() {
    this.isFieldInvalid = this.checkValidation();
    if (
      this.commonTransactionTableRowData?.third_party_name !== null &&
      this.commonTransactionTableRowData?.source?.name === ''
    ) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please map the bank account for further processing.',
        doneMsg: 'Ok'
      });
      return;
    }

    if (!this.isFieldInvalid) {
      this.paymentsV4Service.openSendModal({
        mode: SendPaymentMode.Edit,
        paymentId: this.commonTransactionTableRowData.uu_id
      });
    } else {
      this.alertService.warningAlert({
        content: `Please select a ${this.invalidField} for payment`
      });
    }
  }

  /**
   * @description Gets and processes the check status for a common transaction table row.
   * sets the tooltip using the provided check status value.
   */
  getCheckStatus() {
    const checkStatusArray = this.agGridCellRendererParams?.checkStatus;
    if (this.commonTransactionTableRowData.transfer_type_code === 'check') {
      const checkStatusValue = checkStatusArray?.value;
      if (checkStatusValue?.startsWith('DD')) {
        this.toolTip = this.getTooltipText(checkStatusValue);
      }
    }
  }

  /**
   * @description Returns a tooltip text based on the provided check status.
   * @param {string} status - The check status for which the tooltip text is needed.
   * @returns {string} The tooltip text corresponding to the provided check status.
   */
  getTooltipText(status: string): string {
    switch (status) {
      case 'DD':
        return 'Direct Deposit Initiated';
      case 'DD-FUNDING':
        return 'Funding Started';
      case 'DD Failed':
        return 'DD Funding Failed';
      case 'DDW':
        return 'Payment Completed';
      case 'DD-DEPOSITING':
        return 'Depositing Started';
      case 'DD-DEPOSIT-F':
        return 'Direct Deposit Failed';
      case 'DDC':
        return 'Direct Deposit Completed & It Is In Payee Bank Account';
      default:
        return '';
    }
  }

  /**
   * @description Get check mail track details.
   */
  getCheckTrackDetails() {
    if (!this.checkService.isLoading) {
      this.checkService.getCheckTrackingUrls(
        this.commonTransactionTableRowData.transfer_id
      );
    }
  }

  /**
   * @description Triggered when a cell filter is clicked.
   */
  onFilterClicked(): void {
    const otherStatus = this.otherPaymentsStatus.filter(
      (item) =>
        item.name.toLowerCase() === this.transferModeStatus?.toLowerCase()
    )[0]?.name;
    const selectedStatusValue = this.getKeyForStatusCode(
      this.agGridCellRendererParams.data.cheque_status
    );
    const cellValue = {
      filter: otherStatus ?? (selectedStatusValue as string),
      field: this.agGridCellRendererParams.colDef?.headerName as string,
      payee: undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }

  /**
   * @description Retrieves the key (filter name) corresponding to a given check status code.
   * @param {number} statusCode - The check status code for which the filter name is to be retrieved.
   * @returns {string | null} The filter name corresponding to the provided status code, or null if not found.
   */
  getKeyForStatusCode(statusCode: number): string | null {
    const entry = Object.entries(this.checkstatusList).find(([_, codes]) =>
      codes.includes(statusCode)
    );
    return entry ? entry[0] : null;
  }

  ngOnDestroy() {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
    this.checkService.unSubscribe();
  }
}
