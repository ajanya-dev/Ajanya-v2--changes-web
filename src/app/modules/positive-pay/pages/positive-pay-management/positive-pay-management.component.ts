import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { IPositivepayData } from 'src/app/models/bank';
import { IDtFloatingFilterProp } from 'src/app/modules/data-table/model/datatable';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { RowSelectedEvent } from '@ag-grid-community/core';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtPostivePayActionComponent } from '../../components/dt-components/dt-postivepay-action';
import { ExportModalComponent } from '../../modals/export-modal/export-modal.component';
import { GenerateSshModalComponent } from '../../modals/generate-ssh-modal/generate-ssh-modal.component';
import { SetPositivePayModalComponent } from '../../modals/set-positive-pay-modal/set-positive-pay-modal.component';
import { SettingsModalComponent } from '../../modals/settings-modal/settings-modal.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-positive-pay-management',
  templateUrl: './positive-pay-management.component.html',
  styleUrls: ['./positive-pay-management.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent, MatTooltipModule]
})
export class PositivePayManagementComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private positivePayService = inject(PositivePayService);
  private v3DataTableService = inject(V3DataTableService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);

  frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    SelectBoxComponent: V3DataTableSelectBoxComponent,
    actionComponent: DtActionComponent,
    viewLogComponent: DtPostivePayActionComponent,
    SearchBoxComponent: DtSearchBoxComponent
  };

  public tableId = DTTableId.positivePay;

  FloatingFilterComponent: IDtFloatingFilterProp | undefined;
  subscriptions: Subscription[] = [];
  isHeaderButtonDisable = signal(false);
  loading = signal(false);
  videoSlugEnv  = environment.env_id === 'zilMoney' ? 'positive_pay_zm' : 'positive_pay_ocw';

  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: '',
    ignoreColumns: ['boxId']
  };

  headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Set Positive Pay',
        id: 'id_set_positive_pay',
        icon: ['fas', 'clone'],
        isAddIcon: true,
        type: { style: 'green', name: 'money-action' },
        disabled: this.isHeaderButtonDisable(),
        toolTip:
          'Configure Positive Pay and enhance your transaction security. Ensure all setup details are accurate before proceeding.'
      },
      {
        text: 'Export',
        id: 'id_export',
        icon: ['fas', 'file-export'],
        isAddIcon: true,
        type: { style: 'blue', name: 'money-action' },
        disabled: this.isHeaderButtonDisable(),
        toolTip:
          'Click to export your Positive Pay file. This file will be used by your bank to verify your checks and ACH payments, helping to protect your account from fraud'
      },
      {
        text: 'Settings',
        id: 'id_settings',
        icon: ['fas', 'cog'],
        isAddIcon: true,
        type: { style: 'violet', name: 'money-action' },
        disabled: this.isHeaderButtonDisable()
      },
      {
        text: 'Generate SSH',
        id: 'id_generate_ssh',
        icon: ['fas', 'lock'],
        isAddIcon: true,
        type: 'list',
        backGroundInput: 'var(--common-yellow-color)'
      },
      {
        text: this.loading() ? 'Loading...' : 'Run Positive Pay',
        id: 'upload_to_bank',
        icon: ['fas', 'bank'],
        toolTip:
          'Run Positive Pay to securely submit your check or ACH payment details to your bank for fraud prevention',
        isAddIcon: true,
        type: { style: 'green', name: 'money-action' },
        disabled: this.isHeaderButtonDisable() || this.loading()
      }
    ],
    videoButton: [
      {
        slug: this.videoSlugEnv
      }
    ]
  }));

  actionComponentProp = {
    actionButton: true,
    eyeButton: false
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      undefined,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  /**
   * @description Handles row selection in the data table.
   * @param event - Row selected event containing selected rows.
   */
  onRowSelected(event: RowSelectedEvent) {
    const gridApi = event.api;
    const selectedRows = gridApi.getSelectedRows();
    if (selectedRows.length > 1) {
      this.isHeaderButtonDisable.set(true);
    } else {
      this.isHeaderButtonDisable.set(false);
    }
  }

  /**
   * @description Handles the click event of the header buttons on the table.
   * @param event - The header button click event.
   */
  headerButtonClick(event: { id: string; selectedRows: IPositivepayData[] }) {
    const { selectedRows } = event;

    switch (event.id) {
      case 'id_export':
        this.export(selectedRows);
        break;
      case 'id_set_positive_pay':
        this.setPositivePay(selectedRows);
        break;
      case 'id_settings':
        this.settings(selectedRows);
        break;
      case 'id_generate_ssh':
        this.generateSSH();
        break;
      case 'upload_to_bank':
        this.uploadToBank(selectedRows);
        break;
      default:
        break;
    }
  }

  /**
   * @description Opens a dialog for exporting data if the provided data array is not empty.
   * @param {IPositivepayData[]} val - Selcted Bank Data.
   */
  export(val: IPositivepayData[]) {
    if (this.isEmptyRowSelection(val)) {
      return;
    }
    this.dialog.open(ExportModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: val[0]
    });
  }

  /**
   * @description Open Set postive pay modal.
   * @param {IPositivepayData[]} val - Selcted Bank Data.
   */
  setPositivePay(val: IPositivepayData[]) {
    if (this.isEmptyRowSelection(val)) {
      return;
    }

    const action = this.dialog.open(SetPositivePayModalComponent, {
      maxWidth: '600px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: val[0]
    });
    action.afterClosed().subscribe((res) => {
      if (res.success) {
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  //* **********************settings********************* */

  /**
   * @description Open postive pay setting modal.
   * @param {IPositivepayData[]} val - Selcted Bank Data.
   */
  settings(val: IPositivepayData[]) {
    if (this.isEmptyRowSelection(val)) {
      return;
    }
    this.dialog.open(SettingsModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: val[0]
    });
  }

  /**
   * @description Used to generate ssh.
   */
  generateSSH() {
    this.dialog.open(GenerateSshModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false
    });
  }

  uploadToBank(val: IPositivepayData[]): void {
    if (this.isEmptyRowSelection(val)) {
      return;
    }

    const action = this.alertService.confirmAlert({
      content: `Are you sure you want to proceed?`
    });
    action.afterClosed().subscribe((res) => {
      if (res) {
        this.loading.set(true);
        this.subscriptions.push(
          this.positivePayService
            .uploadToBank(val[0]?.bank_routing_number)
            .pipe(
              finalize(() => {
                this.loading.set(false);
              })
            )
            .subscribe({
              next: (resp) => {
                if (resp.success) {
                  this.alertService.successAlert({
                    content: 'Succesfully Uploaded to Bank'
                  });
                }
              }
            })
        );
      }
    });
  }

  /**
   * @description Checks if the provided array of positive pay data is empty and displays a warning message if it is.
   * @param {IPositivepayData[]} bank - An array of positive pay data to check for emptiness.
   * @returns {boolean} - Returns true if the array is empty, otherwise returns false.
   */
  isEmptyRowSelection(bank: IPositivepayData[]): boolean {
    if (bank.length === 0) {
      const data = {
        content: 'Please select at least one row'
      };
      this.alertService.warningAlert(data);
      return true;
    }
    if (!bank[0]?.is_verified) {
      const data = {
        title: 'Error',
        content:
          'You must have at least one verified bank account with this bank. Please visit the bank accounts list to verify your account.',
        isCancel: true
      };
      this.alertService.warningAlert(data);
      return true;
    }
    if (!bank[0]?.is_eligible) {
      const data = {
        title: 'Error',
        content:
          'This bank is not eligible for Positive Pay setup. For further details, please contact our support team.',
        doneMsg: 'Contact Now',
        cancelMsg: 'Not Now',
        isCancel: true
      };
      const alert = this.alertService.warningAlert(data);
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.dynamicWhiteLabelService.goToLiveChat();
        }
      });
      return true;
    }
    return false;
  }

  colDefId = {
    headerName: '#',
    field: 'boxId',
    suppressFloatingFilterButton: true,
    maxWidth: 50,
    checkboxSelection: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    sortable: false,
    headerClass: 'fixed-size-header'
  };

  colDefBankAccName = {
    headerName: 'Name',
    field: 'routing_number_db.bank_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: { data: IPositivepayData }) =>
      params.data.real_bank_name
  };

  colDefRoutingNo = {
    headerName: 'Routing No',
    field: 'bank_routing_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: { data: IPositivepayData }) => {
      let returnValue = '';
      if (params.data.ftp_driver) {
        returnValue = `${
          params.data.bank_routing_number
        }<span class="text-[white] text-xs ml-5 px-[7px] uppercase py-px rounded-[3px] bg-[var(--common-v3-button-color)]">${
          params.data.ftp_driver ?? ''
        }</span>`;
      } else {
        returnValue = params.data.bank_routing_number;
      }
      return returnValue;
    }
  };

  colDefNumberOfAcc = {
    headerName: 'Number of Active Accounts',
    maxWidth: 200,
    field: 'bank_accounts_count',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefViewLog = {
    headerName: 'Action',
    field: 'id',
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    sortable: false,
    cellRenderer: 'viewLogComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  // SET COLUMN FEILDS
  columnDefs = [
    this.colDefId,
    this.colDefBankAccName,
    this.colDefRoutingNo,
    this.colDefNumberOfAcc,
    this.colDefViewLog
  ];

  columnFields = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'id_name',
      name: 'Name',
      isDisabled: true,
      colDef: this.colDefBankAccName,
      isChecked: true
    },
    {
      id: 'id_routing_no',
      name: 'Routing No',
      isDisabled: true,
      colDef: this.colDefRoutingNo,
      isChecked: true
    },
    {
      id: 'id_no_accounts',
      name: 'Number of Accounts',
      isDisabled: true,
      colDef: this.colDefNumberOfAcc,
      isChecked: true
    },
    {
      id: 'id_verified',
      name: 'Action',
      isDisabled: false,
      colDef: this.colDefViewLog,
      isChecked: true
    }
  ];

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
