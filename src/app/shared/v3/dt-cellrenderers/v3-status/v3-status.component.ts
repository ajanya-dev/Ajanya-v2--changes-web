import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { Subscription } from 'rxjs';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ICommentsAndAttachmentsCount,
  ICommonTransactionTableData
} from 'src/app/models/v3-common';
import { ICellRendererParams } from '@ag-grid-community/core';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/check-add-comment-modal/check-add-comment-modal.component';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { IAttachmentItem } from 'src/app/models/common';
import { ICheckAttachmentData } from 'src/app/modules/check/model/check';
import { IComments } from 'src/app/data/data/cloud-quick-pay';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faFilterList,
  faMessageExclamation,
  faPaperclip
} from '@fortawesome/pro-solid-svg-icons';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from '../../../../modules/v3-data-table/services/v3-data-table.service';
import { PaidStatementModalComponent } from '../../paid-statement-modal/paid-statement-modal.component';

/**
 * @description Interface to include 'cellRendererParams' in 'agGridCellRendererParams' in agInit.
 */
interface ICellRendererParamsExtended extends ICellRendererParams {
  tableType?: string;
  tableId?: number;
  isStatementDisable?: boolean;
  checkStatus?: { value: string; color: string };
  isApplyTitleCase?: string;
  hideFilterButton?:boolean;
  getCommentsAndAttachmentsCount?: () => ICommentsAndAttachmentsCount[];
  onStatusIconClick?: (
    accountId: string,
    type: 'attachment' | 'comment'
  ) => void;
}

@Component({
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, MatTooltipModule,CommonFilterIconComponent],
  providers: [TitleCasePipe],
  selector: 'app-v3-status',
  templateUrl: './v3-status.component.html',
  styleUrls: ['./v3-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V3StatusComponent {
  /* Injectors */
  private dialog = inject(MatDialog);
  private titleCasePipe = inject(TitleCasePipe);
  private v3DataTableService = inject(V3DataTableService);
  private v3PaymentsTableService = inject(V3PaymentsTableService);
  private changeDetectorRef = inject(ChangeDetectorRef);
  private dataTableService = inject(DataTableService);

  faFilterList = faFilterList;
  faMessageExclamation = faMessageExclamation;
  faPaperclip = faPaperclip;

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

  statusProps = { color: '', status: '' };
  isStatementDisable = false;
  hideFilterButton = false;
  showFilterIcon = false;

  isIntHasAttachments = signal<boolean>(false);
  isIntHasComments = signal<boolean>(false);

  /* Functions */

  /**
   * This function is called on initialisation of the floating component.
   * @param agGridCellRendererParams This contains data like ```rowNode``` as well as the row data
   * we are getting from the backend.
   */
  agInit(agGridCellRendererParams: ICellRendererParamsExtended) {
    if (agGridCellRendererParams.data) {
      this.setPropsDynamically(agGridCellRendererParams.data.status);
      this.agGridCellRendererParams = agGridCellRendererParams;
      this.commonTransactionTableRowData = agGridCellRendererParams.data;
      /**
       * @description Only required for payments table. 'tableType' is passed in to 'cellRendererParams' in the respective ColDef
       */
      if (agGridCellRendererParams.tableType === 'payments-table') {
        this.getCheckCommentsAndAttachments(
          agGridCellRendererParams.data.transfer_id,
          agGridCellRendererParams.data.zilpayment_id
        );
        this.listenForGetCountCompletion();
      }
      if (agGridCellRendererParams.tableType === 'international-payment-transactions') {
        this.isIntHasAttachments.set(agGridCellRendererParams.data.attachment);
        this.isIntHasComments.set(agGridCellRendererParams.data.comment);
      }
    }

    this.isStatementDisable =
      agGridCellRendererParams?.isStatementDisable as boolean;
      this.hideFilterButton = agGridCellRendererParams?.hideFilterButton as boolean;
    if (
      agGridCellRendererParams?.tableId === 27 ||
      agGridCellRendererParams?.tableId === 28
    ) {
      this.getCommentsAndAttachmentsCount(
        agGridCellRendererParams.tableId as number
      );
      this.listenForCommentsAndAttachmentsLoad();
    }
  }

  /**
   * @description Dynamically sets properties for a status value.
   * @param {0|1|2|3|'settled'|'active'|'inactive'|'pending'|'PENDING'|'PROCESSING'|'COMPLETED'|'APPROVAL_REQUIRED'|'REJECTED'} statusValue - The status value to be processed.
   */
  setPropsDynamically(
    statusValue:
      | 0
      | 1
      | 2
      | 3
      | 'settled'
      | 'active'
      | 'inactive'
      | 'pending'
      | 'PENDING'
      | 'PROCESSING'
      | 'COMPLETED'
      | 'APPROVAL_REQUIRED'
      | 'REJECTED'
      | 'CANCELED'
      | 'FAILED'
      | 'APPROVED'
      | 'RETURNED'
      | 'completed'
      | 'declined'
      | 'Paid'
  ): void {
    switch (statusValue) {
      case 0:
        this.statusProps = {
          color: 'var(--common-yellow-color)',
          status: 'Pending'
        };
        break;
      case 1:
        this.statusProps = {
          color: 'var(--common-blue-color)',
          status: 'Processing'
        };
        break;
      case 2:
        this.statusProps = {
          color: 'var(--common-green-color)',
          status: 'Success'
        };
        break;
      case 3:
        this.statusProps = {
          color: 'var(--common-red-color)',
          status: 'Failed'
        };
        break;
      case 'settled':
        this.statusProps = {
          color: 'var(--common-green-color)',
          status: 'Settled'
        };
        break;
      case 'active':
        this.statusProps = {
          color: 'var(--common-green-color)',
          status: 'Active'
        };
        break;
      case 'inactive':
        this.statusProps = {
          color: 'var(--common-red-color)',
          status: 'Inactive'
        };
        break;
      case 'pending':
        this.statusProps = {
          color: 'var(--common-yellow-color)',
          status: 'Pending'
        };
        break;
      case 'PENDING':
        this.statusProps = {
          color: 'var(--common-yellow-color)',
          status: 'Pending'
        };
        break;
      case 'PROCESSING':
        this.statusProps = {
          color: 'var(--common-blue-color)',
          status: 'Processing'
        };
        break;
      case 'COMPLETED':
        this.statusProps = {
          color: 'var(--common-green-color)',
          status: 'Completed'
        };
        break;
      case 'completed':
        this.statusProps = {
          color: 'var(--common-green-color)',
          status: 'Completed'
        };
        break;
      case 'APPROVAL_REQUIRED':
        this.statusProps = {
          color: 'var(--common-yellow-color)',
          status: 'Approval required'
        };
        break;
      case 'REJECTED':
        this.statusProps = {
          color: 'var(--common-red-color)',
          status: 'Rejected'
        };
        break;
      case 'CANCELED':
        this.statusProps = {
          color: 'var(--common-red-color)',
          status: 'Canceled'
        };
        break;
      case 'FAILED':
        this.statusProps = {
          color: 'var(--common-red-color)',
          status: 'Failed'
        };
        break;
      case 'RETURNED':
        this.statusProps = {
          color: 'var(--common-red-color)',
          status: 'Returned'
        };
        break;
      case 'APPROVED':
        this.statusProps = {
          color: 'var(--common-green-color)',
          status: 'Approved'
        };
        break;
      case 'declined':
        this.statusProps = {
          color: 'var(--common-red-color)',
          status: 'Declined'
        };
        break;
      case 'Paid':
        this.statusProps = {
          color: 'var(--common-green-color)',
          status: 'Paid'
        };
        break;
      default: {
        this.statusProps = { color: '', status: '' };
      }
    }
  }

  /**
   * @description Function in which we subscribe to the getter
   * which is fired when the Get Count API is completed.
   */
  listenForGetCountCompletion() {
    this.subscriptions.push(
      this.v3PaymentsTableService.updateOnGetCountAPICompletion$.subscribe({
        next: () => {
          this.getCheckCommentsAndAttachments(
            this.commonTransactionTableRowData.transfer_id,
            this.commonTransactionTableRowData.zilpayment_id
          );
        }
      })
    );
  }

  /**
   * @description In this function we check if each row has either
   * an attachment or comment and we assign it.
   * @param checkId The check Id we get from AG Grid Table 62 API if the
   * ```transfer_type_code``` is ```check``` or ```checkMail```.
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
   * @param value - value to be modified.
   * @returns
   */
  undersquareToWhitespace(value?: string) {
    return value ? value.replace(/_/, ' ') : undefined;
  }

  /**
   * @description Opens the attachment modal.
   */
  openAttachmentModal() {
    const isCloud = this.onCloudCommentOrAttachment('attachment');
    if (isCloud) return;
    const dialogRef = this.dialog.open(CheckAddAttachmentCommonModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      data: {
        id:
          this.commonTransactionTableRowData.transfer_type_code === 'check'
            ? this.commonTransactionTableRowData.transfer_id
            : this.commonTransactionTableRowData.zilpayment_id,
        mode:
          this.getPaymentMode(),
        existingData: this.existingDocumentsData.attachments
      }
    });

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
    const isCloud = this.onCloudCommentOrAttachment('comment');
    if (isCloud) return;
    const dialogRef = this.dialog.open(CheckAddCommentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      data: {
        id:
          this.commonTransactionTableRowData.transfer_type_code === 'check'
            ? this.commonTransactionTableRowData.transfer_id
            : this.commonTransactionTableRowData.zilpayment_id,
        mode:
          this.getPaymentMode(),
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
    if (this.isStatementDisable) return;
    const uuid = this.commonTransactionTableRowData?.uu_id;
    this.dialog.open(PaidStatementModalComponent, {
      maxWidth: '900px',
      width: '93%',
      data: { uuid }
    });
  }

  /**
   * @description Method for cloud comment or attachment icon click from status column.
   * @returns Boolean indicating cloud or not.
   */
  onCloudCommentOrAttachment(type: 'attachment' | 'comment') {
    if (this.agGridCellRendererParams.tableId === 27) {
      this.agGridCellRendererParams.onStatusIconClick!(
        this.agGridCellRendererParams.data?.id,
        type
      );
      return true;
    } else if (this.agGridCellRendererParams.tableId === 28) {
      this.agGridCellRendererParams.onStatusIconClick!(
        this.agGridCellRendererParams.data?.action,
        type
      );
      return true;
    }
    return false;
  }

  /**
   * @description Method to update comments and attachments when data is loaded from api.
   */
  listenForCommentsAndAttachmentsLoad() {
    this.subscriptions.push(
      this.v3DataTableService.commentsAndAttachmentsLoaded$.subscribe({
        next: () => {
          this.getCommentsAndAttachmentsCount(
            this.agGridCellRendererParams.tableId as number
          );
        }
      })
    );
  }

  /**
   * @description Method to set comments and attachments status, based on data from parent component.
   * Can be used for other data tables as well for get count by setting the proper tableId, rowItemId etc.
   */
  getCommentsAndAttachmentsCount(tableId: number) {
    this.commentsAndAttachmentsCount =
      this.agGridCellRendererParams.getCommentsAndAttachmentsCount!();
    let rowItemId = '';
    if (tableId === 28) {
      rowItemId = this.agGridCellRendererParams.data.action;
    } else if (tableId === 27) {
      rowItemId = this.agGridCellRendererParams.data.id;
    } else {
      return;
    }
    this.commentsAndAttachmentsCount.forEach((item) => {
      if (rowItemId === item.id) {
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

  onFilterClicked(): void {
    const cellValue = {
      filter: this.agGridCellRendererParams?.isApplyTitleCase
        ? this.titleCasePipe.transform(this.statusProps.status ?? '')
        : this.statusProps.status.toUpperCase(),
      field: this.agGridCellRendererParams.colDef?.headerName as string,
      payee: undefined
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }

  getPaymentMode() {
    if(this.agGridCellRendererParams.tableType === 'international-payment-transactions') {
      return 'international_payments';
    } 
    if(this.commonTransactionTableRowData.transfer_type_code === 'check') {
        return undefined;
    }
    return 'zil_payments';
  }

  showFilterIconForRow(show?:boolean){
    if(this.hideFilterButton) return;
    if(show){
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }
}
