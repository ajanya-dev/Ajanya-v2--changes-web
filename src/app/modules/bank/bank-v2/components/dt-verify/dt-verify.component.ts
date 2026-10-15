import { Component, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { BankVerifyModalComponent } from '../../../../../shared/bank-modal/modals/bank-verify-modal/bank-verify-modal.component';
import { ConfirmMicroDepositModalComponent } from '../../modals/confirm-micro-deposit-modal/confirm-micro-deposit-modal.component';
import { YodleeParentModalComponent } from 'src/app/shared/yodlee/components/yodlee-parent-modal/yodlee-parent-modal.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { IBankData } from 'src/app/models/bank';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonFilterIconComponent } from 'src/app/shared/components/common-filter-icon/common-row-filter.component';

interface isDisableInterface {
  isDisable: boolean;
  selectedIds: string[];
}

@Component({
  selector: 'app-dt-verify',
  templateUrl: './dt-verify.component.html',
  styleUrls: ['./dt-verify.component.scss'],
  standalone: true,
  imports: [FontAwesomeModule, CommonFilterIconComponent]
})
export class DtVerifyComponent implements ICellRendererAngularComp, OnInit {
  type: number;
  refresh(): boolean {
    return true;
    // throw new Error('Method not implemented.');
  }

  // afterGuiAttached?(params?: IAfterGuiAttachedParams): void {
  //   throw new Error('Method not implemented.')
  // }

  public cellValue!: string;
  getCurrentColumn: IBankData;
  params: ICellRendererParams;
  getData: {
    data: IDtColumnFields[];
    values: { name: string; id: string; icon: string }[] | undefined;
  };
  getValues: { name: string; id: string; icon: string }[] | undefined;
  isDisableData: isDisableInterface;

  label: string;
  spanLabel: string;
  title: string;
  class: string;
  spanClass: string;
  spanTitle: string;
  iconClassL: string;
  iconClassR: string;
  showFilterIcon = false;

  private alertService = inject(AlertService);
  private dataTableData = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  public dialog = inject(MatDialog);

  // gets called once before the renderer is used
  agInit(params: ICellRendererParams<IBankData>) {
    this.params = params;
    this.cellValue = this.getValueToDisplay(params);
    this.getCurrentColumn = this.params.data;

    this.getData = this.dataTableData.getCellrendrerData();
    this.getValues = this.getData.values;

    if (
      (this.params.data.bank_account_account_number == 1111111111 ||
        this.params.data.bank_account_account_number == '1111111111') &&
      (this.params.data.bank_routing_number == 322271627 ||
        this.params.data.bank_routing_number == '322271627')
    ) {
      this.label = 'Verify Now';
      this.type = 1;
      this.class = 'success';
      this.iconClassL =
        'fa fa-triangle-exclamation text-common-yellow-color pr-1';
    } else if (
      params.data?.mark_as_verified == 1 &&
      params.data?.verified_by == 1
    ) {
      this.label = 'Verified';
      this.type = 2;
      this.class = 'success';
      this.iconClassL =
        'verified fa fa-circle-check pr-1 text-common-green-color';
    } else if (
      params.data?.mark_as_verified == 1 &&
      params.data?.verified_by == 2
    ) {
      this.label = 'Verified';
      this.title = 'Verified by micro deposit (to mail & eMail check only )';
      this.type = 3;
      this.class = 'success';
      this.spanClass = '';
      this.iconClassL =
        'verified fa fa-circle-check pr-1 text-common-green-color';
    } else if (
      params.data?.mark_as_verified == 1 &&
      params.data?.verified_by == 7
    ) {
      this.label = 'Verified';
      this.title = 'verified Instantly';
      this.type = 4;
      this.iconClassL =
        'verified fa fa-circle-check pr-1 text-common-green-color';
      this.class = 'success';
    } else if (
      params.data?.mark_as_verified == 1 &&
      params.data?.verified_by == 8
    ) {
      this.label = 'Verified';
      this.title = 'verified by Admin';
      this.type = 5;
      this.class = 'success';
      this.iconClassL =
        'verified fa fa-circle-check pr-1 text-common-green-color';
    } else if (
      params.data?.mark_as_verified == 1 &&
      params.data?.verified_by == 81
    ) {
      this.label = 'Verified';
      this.title = 'To Mail check only';
      this.type = 6;
      this.class = 'success';
      this.iconClassL =
        'verified fa fa-circle-check pr-1 text-common-green-color';
    } else if (
      params.data?.mark_as_verified == 1 &&
      params.data?.verified_by == 82
    ) {
      this.label = 'Verified';
      this.title = 'To eMail checks only';
      this.type = 7;
      this.class = 'success';
      this.iconClassL =
        'verified fa fa-circle-check pr-1 text-common-green-color';
    } else if (
      params.data?.mark_as_verified == 1 &&
      params.data?.verified_by == 83
    ) {
      this.label = 'Verified';
      this.title = 'To Mail & eMail check only';
      this.type = 8;
      this.class = 'success';
      this.iconClassL =
        'verified fa fa-circle-check pr-1 text-common-green-color';
    } else if (
      params.data?.mark_as_verified == 1 &&
      params.data?.verified_by == 13
    ) {
      this.label = 'Verified';
      this.type = 9;
      this.class = 'success';
      this.iconClassL = 'fa fa-circle-check pr-1 text-common-green-color';
    } else if (
      params.data?.mark_as_verified == 1 &&
      params.data?.verified_by == 84
    ) {
      this.label = 'Verified';
      this.title = 'To DD,Mail,Email';
      this.type = 10;
      this.class = 'success';
      this.iconClassL = 'fa fa-circle-check pr-1 text-common-green-color';
    } else if (
      params.data?.mark_as_verified == 1 &&
      params.data?.verified_by == 11
    ) {
      this.label = 'Verified';
      this.title = 'Account number not fully verified';
      this.type = 11;
      this.class = 'success';
      this.iconClassL = 'fa fa-circle-check text-common-green-color';
    } else if (params.data?.verified_by == 3) {
      this.label = 'Confirm Micro Deposit';
      this.class = 'confirm-1 cursor';
      this.iconClassL =
        'fa fa-triangle-exclamation text-common-yellow-color pr-1';
      this.type = 12;
    } else if (params.data?.verified_by == 4) {
      this.label = 'Pending';
      this.title = 'Waiting for Confirmation';
      this.type = 13;
      this.class = 'warning';
      this.iconClassL = 'fa fa-circle-check text-common-yellow-color pr-1';
    } else if (params.data?.verified_by == 5) {
      this.label = 'Approved';
      this.title = 'Your application has been approved.';
      this.type = 14;
      this.class = 'success';
    } else if (params.data?.verified_by == 6) {
      this.label = 'Rejected';
      this.spanLabel = 'Verify Instantly';
      this.title = 'Your application has been rejected.';
      this.type = 15;
      this.class = 'text-danger';
      this.spanClass = 'verify_instantly cursor';
      this.spanTitle = 'You can verify by linking your account';
      this.iconClassL = 'fa fa-triangle-exclamation text-common-red-color pr-1';
    } else if (params.data?.verified_by == 10) {
      this.label = 'Rejected';
      this.title = 'Your application has been rejected.';
      this.spanLabel = 'Reapply';
      this.type = 16;
      this.class = 'text-danger';
      this.spanClass = 'reapply cursor';
      this.spanTitle = 'You can Reapply';
      this.iconClassL = 'fa fa-triangle-exclamation text-common-red-color pr-1';
    } else if (params.data?.verified_by == 12) {
      this.label = 'Verification failed';
      this.spanLabel = 'Verify Instantly';
      this.title = 'You can verify by linking your account';
      this.type = 17;
      this.class = 'text-danger';
      this.spanClass = 'verify_instantly cursor';
      this.spanTitle = 'You can verify by linking your account';
      this.iconClassL = 'fa fa-triangle-exclamation text-common-red-color pr-1';
    } else if (params.data?.mark_as_verified == 1) {
      this.type = 18;
      this.label = 'Verified';
      this.class = 'success';
      this.iconClassL = 'fa fa-circle-check text-common-green-color';
    } else {
      this.label = 'Verify Now';
      this.class = 'cursor verify-now';
      this.type = 19;
      this.iconClassL =
        'fa fa-triangle-exclamation text-common-yellow-color pr-1';
    }
  }

  ngOnInit(): void {
    this.dataTableData.isDisable.subscribe((res) => {
      this.isDisableData = res;
    });
  }

  /**
   * @description  Retrieves the value to display in a cell renderer, prioritizing the formatted value if available.
   * @param {ICellRendererParams} params - The parameters for the cell renderer.
   * @returns - The value to display in the cell renderer.
   */
  getValueToDisplay(params: ICellRendererParams) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  /**
   * @description  Open the Bank verification modal.
   */
  openBankVerifyModal() {
    if (this.params.data.bank_account_country === 'Canada') {
      this.alertService.warningAlert({
        content: 'Verification for Canadian bank accounts is not permitted.'
      });
      return;
    }
    this.dialog.open(BankVerifyModalComponent, {
      maxWidth: '500px',
      width: '95%',
      data: this.params.data,
      disableClose: true
    });
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description  Open Micro Deposit Modal.
   */
  microDeposit() {
    this.dialog.open(ConfirmMicroDepositModalComponent, {
      maxWidth: '750px',
      width: '500px',
      data: this.params.data
    });
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description  Initiates instant verification process.
   */
  verifyInstantly() {
    /**
     * @description - Creates the data object containing the verification mode and account data to send YodleeParentModalComponent.
     */
    const data = {
      mode: 'verify_now',
      verifyNowAccountData: this.params.data
    };
    this.dialog.open(YodleeParentModalComponent, {
      disableClose: true,
      autoFocus: false,
      data: data,
      panelClass: 'yodlee-modal-new'
    });
    this.v3DataTableService.refreshV3DataTable();
  }

  onFilterClicked(): void {
    const status = Number(this.params?.data?.verified_by);

    let filter = '';
    if (status === 0) {
      filter = 'Verify Now';
    } else if (status === 1) {
      filter = 'Verified';
    } else if (status === 4) {
      filter = 'Pending';
    } else if (status === 3) {
      filter = 'Confirm MD';
    } else if (status === 6) {
      filter = 'Rejected- Verify instantly';
    } else if (status === 10) {
      filter = 'Rejected- Reapply';
    } else if (status === 12) {
      filter = 'failed';
    } else if (this.params.data?.mark_as_verified) {
      filter = 'Verified';
    }
    const cellValue = {
      filter: filter as string,
      field: this.params?.colDef?.headerName as string
    };
    this.dataTableService.selectedCellValueSignal.set(cellValue);
  }

  showFilterIconForRow(show?: boolean) {
    if (show) {
      this.showFilterIcon = true;
    } else {
      this.showFilterIcon = false;
    }
  }

  /**
   * @description  Performs a process based on the given type.
   * @param {number} type - The type of process to be performed.
   */
  doProcess(type: number) {
    if (type == 1 || type == 16 || type == 19) {
      this.openBankVerifyModal();
    } else if (type == 12) {
      this.microDeposit();
    } else if (type == 15 || type == 17) {
      this.verifyInstantly();
    }
  }
}
