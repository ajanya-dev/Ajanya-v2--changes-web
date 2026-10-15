import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { Location } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { IPositivepayData } from 'src/app/models/bank';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { RowSelectedEvent } from '@ag-grid-community/core';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { DtV4PositivePayActionComponent } from '../../components/dt-v4-positivepay-action/dt-v4-positivepay-action.component';
import { V4ExportModalComponent } from '../../modals/v4-export-modal/v4-export-modal.component';
import { V4GenerateSshModalComponent } from '../../modals/v4-generate-ssh-modal/v4-generate-ssh-modal.component';
import { V4SetPositivePayModalComponent } from '../../modals/v4-set-positive-pay-modal/v4-set-positive-pay-modal.component';
import { V4SettingsModalComponent } from '../../modals/v4-settings-modal/v4-settings-modal.component';

@Component({
  selector: 'app-v4-positive-pay-management',
  templateUrl: './v4-positive-pay-management.component.html',
  standalone: true,
  imports: [V4DataTableComponent, V4PageHeaderComponent, LucideAngularModule]
})
export class V4PositivePayManagementComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private location = inject(Location);

  goBack(): void { this.location.back(); }

  pageHeaderActions: IV4HeaderAction[] = [
    { id: 'id_generate_ssh', text: 'Generate SSH', lucideIcon: 'key', isAddIcon: true, toolTip: 'Generate an SSH key to securely connect to your bank for Positive Pay file transfers.' }
  ];

  onPageHeaderAction(id: string | number): void {
    this.headerButtonClick({ id: id as string, selectedRows: [] });
  }
  private alertService = inject(V4AlertService);
  private positivePayService = inject(PositivePayService);
  private v3DataTableService = inject(V3DataTableService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private destroyRef = inject(DestroyRef);

  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    SelectBoxComponent: V4DropdownFloatingFilterComponent,
    actionComponent: DtActionComponent,
    viewLogComponent: DtV4PositivePayActionComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent
  };

  public tableId = DTTableId.positivePay;

  loading = signal(false);
  selectedRows = signal<IPositivepayData[]>([]);
  isMultiSelected = signal(false);

  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: '',
    ignoreColumns: ['boxId']
  };

  headerElements = computed<IV3DtHeaderElements>(() => ({
    titleButtons: [
      {
        text: 'Generate SSH',
        id: 'id_generate_ssh',
        lucideIcon: 'key',
        type: 'list',
        backGroundInput: 'var(--v4-primary-brand-color)',
        textColorInput: 'white',
        textClasses: 'text-sm',
        toolTip: 'Generate an SSH key to securely connect to your bank for Positive Pay file transfers.'
      }
    ],
    buttons: [
      {
        text: 'Set Positive Pay',
        id: 'id_set_positive_pay',
        lucideIcon: 'settings',
        floatingBarVariant: 'primary',
        toolTip: this.isMultiSelected() ? '' : 'Configure Positive Pay and enhance your transaction security.',
        disabled: this.isMultiSelected()
      },
      {
        text: 'Export',
        id: 'id_export',
        lucideIcon: 'download',
        floatingBarVariant: 'outline-primary',
        toolTip: this.isMultiSelected() ? '' : 'Export your Positive Pay file for bank fraud prevention.',
        disabled: this.isMultiSelected()
      },
      {
        text: 'Settings',
        id: 'id_settings',
        lucideIcon: 'settings',
        floatingBarVariant: 'outline-primary',
        toolTip: this.isMultiSelected() ? '' : 'Configure your Positive Pay upload settings.',
        disabled: this.isMultiSelected()
      },
      {
        text: this.loading() ? 'Loading...' : 'Run Positive Pay',
        id: 'upload_to_bank',
        lucideIcon: 'play',
        floatingBarVariant: 'outline-danger',
        disabled: this.loading() || this.isMultiSelected(),
        toolTip: (this.loading() || this.isMultiSelected()) ? '' : 'Submit your check or ACH payment details to your bank for fraud prevention.'
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
      undefined,
      undefined,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  onRowSelected(event: RowSelectedEvent) {
    const selectedRows = event.api.getSelectedRows() as IPositivepayData[];
    this.selectedRows.set(selectedRows);
    this.isMultiSelected.set(selectedRows.length > 1);
  }

  headerButtonClick(event: { id: string; selectedRows: IPositivepayData[] }) {
    const { selectedRows } = event;

    switch (event.id) {
      case 'id_generate_ssh':
        this.generateSSH();
        break;
      case 'id_export':
        this.export(selectedRows);
        break;
      case 'id_set_positive_pay':
        this.setPositivePay(selectedRows);
        break;
      case 'id_settings':
        this.settings(selectedRows);
        break;
      case 'upload_to_bank':
        this.uploadToBank(selectedRows);
        break;
      default:
        break;
    }
  }

  export(val: IPositivepayData[]) {
    if (this.isEmptyRowSelection(val)) return;
    this.dialog.open(V4ExportModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: val[0]
    });
  }

  setPositivePay(val: IPositivepayData[]) {
    if (this.isEmptyRowSelection(val)) return;
    const action = this.dialog.open(V4SetPositivePayModalComponent, {
      maxWidth: '600px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: val[0]
    });
    action.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  settings(val: IPositivepayData[]) {
    if (this.isEmptyRowSelection(val)) return;
    this.dialog.open(V4SettingsModalComponent, {
      maxWidth: '400px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: val[0]
    });
  }

  generateSSH() {
    this.dialog.open(V4GenerateSshModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  uploadToBank(val: IPositivepayData[]): void {
    if (this.isEmptyRowSelection(val)) return;
    const action = this.alertService.confirmAlert({
      content: 'Are you sure you want to proceed?'
    });
    action.afterClosed().subscribe((res) => {
      if (res) {
        this.loading.set(true);
        this.positivePayService
          .uploadToBank(val[0]?.bank_routing_number)
          .pipe(
            finalize(() => {
              this.loading.set(false);
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe({
            next: (resp) => {
              if (resp.success) {
                this.alertService.successAlert({
                  content: 'Successfully Uploaded to Bank'
                });
              }
            }
          });
      }
    });
  }

  isEmptyRowSelection(bank: IPositivepayData[]): boolean {
    if (bank.length === 0) {
      this.alertService.warningAlert({
        content: 'Please select at least one row'
      });
      return true;
    }
    if (!bank[0]?.is_verified) {
      this.alertService.warningAlert({
        title: 'Error',
        content:
          'You must have at least one verified bank account with this bank. Please visit the bank accounts list to verify your account.',
        isCancel: true
      });
      return true;
    }
    if (!bank[0]?.is_eligible) {
      const alert = this.alertService.warningAlert({
        title: 'Error',
        content:
          'This bank is not eligible for Positive Pay setup. For further details, please contact our support team.',
        doneMsg: 'Contact Now',
        cancelMsg: 'Not Now',
        isCancel: true
      });
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
    minWidth: 50,
    maxWidth: 50,
    checkboxSelection: true,
    headerCheckboxSelection: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    sortable: false,
    pinned: 'left' as const,
    cellClass: 'flex justify-center',
    headerClass: 'pl-3.5'
  };

  colDefBankAccName = {
    headerName: 'Name',
    field: 'routing_number_db.bank_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    flex: 1,
    cellClass: 'text-left',
    cellRenderer: (params: { data: IPositivepayData }) => {
      if (!params.data) return '';
      const name = params.data.real_bank_name || params.data.bank_name || '';
      if (params.data.ftp_driver) {
        return `${name}<span class="text-[var(--v4-badge-success-text-color)] text-xs ml-2 px-[7px] uppercase py-px rounded-[3px] bg-[var(--v4-badge-success-bg-color)]">${params.data.ftp_driver}</span>`;
      }
      return name;
    }
  };

  colDefRoutingNo = {
    headerName: 'Routing No',
    field: 'bank_routing_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    flex: 1,
    cellClass: 'text-left',
    cellRenderer: (params: { data: IPositivepayData }) =>
      params.data?.bank_routing_number ?? ''
  };

  colDefNumberOfAcc = {
    headerName: 'Number of Active Accounts',
    field: 'bank_accounts_count',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'text-left'
  };

  colDefAction = {
    headerName: 'Action',
    field: 'id',
    suppressFloatingFilterButton: true,
    minWidth: 90,
    maxWidth: 90,
    sortable: false,
    cellRenderer: 'viewLogComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    pinned: 'left' as const,
    lockPosition: true
  };

  columnDefs = [
    this.colDefId,
    this.colDefAction,
    this.colDefBankAccName,
    this.colDefRoutingNo,
    this.colDefNumberOfAcc
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
      id: 'id_action',
      name: 'Action',
      isDisabled: false,
      colDef: this.colDefAction,
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
    }
  ];
}
