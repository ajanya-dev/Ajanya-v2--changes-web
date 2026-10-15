import { DataTableService } from './../../../../../shared/service/data-table/data-table.service';
import { ICellRendererParams } from '@ag-grid-community/core';
import { NgClass, NgStyle, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { statusCodesWithFilter } from 'src/app/modules/check/components/methods/check-methods';
import { paymentsTableStatus } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table-data';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';
import { PaidStatementModalComponent } from 'src/app/shared/v3/paid-statement-modal/paid-statement-modal.component';

interface ICellRendererParamsExtended extends ICellRendererParams {
  tableType?: string;
  checkStatus?: { value: string; color: string };
  onStatusIconClick?: (
    accountId: string,
    type: 'attachment' | 'comment'
  ) => void;
}

@Component({
  selector: 'app-v35-payee-status',
  standalone: true,
  imports: [MatTooltip, NgStyle, NgClass, CommonFilterIconComponent],
  providers: [TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex gap-2 items-center status-container"
      (mouseenter)="showFilterIconForRow(true)"
      (mouseleave)="showFilterIconForRow()"
    >
      <div
        class="statement-container"
        [matTooltip]="toolTip"
        role="presentation"
        (click)="openStatement()"
      >
        <button
          class="status-field"
          [ngStyle]="{ color: dynamicFontColor }"
          [ngClass]="{
            'text-common-red-color':
              dynamicFontColor === 'failed' || dynamicFontColor === 'canceled',
            'text-common-green-color':
              dynamicFontColor === 'approved' ||
              dynamicFontColor === 'completed' ||
              dynamicFontColor === 'settled' ||
              dynamicFontColor === 'paid',
            'text-common-yellow-color': transferModeStatus === 'Pending',
            '!underline !text-common-green-color': trackingUrl,
            'text-common-blue-color':
              dynamicFontColor === 'processing' ||
              dynamicFontColor === 'refund',
            '!cursor-default': mailingType === 'First Class'
          }"
        >
          {{ transferModeStatus }}
        </button>
      </div>
      @if (
        commonTransactionTableRowData.transfer_type_code === 'print' &&
        commonTransactionTableRowData?.status !== 'CANCELED'
      ) {
        <div class="transfer-mode">
          <h2>{{ commonTransactionTableRowData?.transfer_mode }}</h2>
        </div>
      }
      @if (showFilterIcon) {
        <app-common-filter-icon (filterEvent)="onFilterClicked()" />
      }
    </div>
  `
})
export class V35PayeeStatusComponent {
  private dialog = inject(MatDialog);
  private titleCasePipe = inject(TitleCasePipe);
  private checkService = inject(CheckService);
  private dataTableService = inject(DataTableService);

  dynamicFontColor: string = '';
  mailingType: string = '';
  toolTip: string = '';
  subscriptions: Subscription[] = [];
  isTrackingMail = false;
  trackingUrl: string = '';
  showFilterIcon = false;
  otherPaymentsStatus = paymentsTableStatus;
  checkstatusList = statusCodesWithFilter;

  agGridCellRendererParams: ICellRendererParamsExtended;
  commonTransactionTableRowData: ICommonTransactionTableData;

  /**
   * This function is called on initialisation of the floating component.
   * @param agGridCellRendererParams This contains the row data
   * we are getting from the backend.
   */
  agInit(agGridCellRendererParams: ICellRendererParamsExtended) {
    if (agGridCellRendererParams.data) {
      this.agGridCellRendererParams = agGridCellRendererParams;
      this.commonTransactionTableRowData = agGridCellRendererParams.data;
      if (agGridCellRendererParams.data.transfer_type_code !== 'check') {
        this.dynamicFontColor =
          this.commonTransactionTableRowData?.status?.toLowerCase() ?? '';
      } else {
        this.dynamicFontColor =
          agGridCellRendererParams.checkStatus?.color ?? '';
      }
      this.getCheckTrackingUrls();
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
        }
      })
    );
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
    if (this.commonTransactionTableRowData.transfer_type_code === 'check') {
      return checkStatusArray?.value ?? this.undersquareToWhitespace(status);
    }
    return this.undersquareToWhitespace(status);
  }

  /**
   * Returns a string after replacing all "_" with whitespaces from a given string.
   */
  undersquareToWhitespace(value?: string) {
    return value ? value.replace(/_/, ' ') : undefined;
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
    const uuid = this.commonTransactionTableRowData?.uu_id;
    this.dialog.open(PaidStatementModalComponent, {
      maxWidth: '900px',
      width: '93%',
      data: { uuid }
    });
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

  showFilterIconForRow(show?: boolean) {
    if (show) {
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
