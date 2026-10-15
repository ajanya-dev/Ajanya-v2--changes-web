import {
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IPayrollApps } from 'src/app/modules/payroll/model/payroll';
import { Subscription } from 'rxjs';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { ColDef, GridApi } from '@ag-grid-community/core';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { V4PayrollActionComponent } from '../v4-payroll-action/v4-payroll-action.component';
import { TableInputFieldV4Component } from '../table-input-field-v4/table-input-field-v4.component';
import { PayrollFeeV4Component } from '../payroll-fee-v4/payroll-fee-v4.component';
import { PayrollService } from '../../../payroll-by-card/services/payroll.service';
import { DateInputFieldV4Component } from '../date-input-field-v4.component';
import { V4DataTableComponent } from '../../../v4-data-table/components/v4-data-table/v4-data-table.component';
import { PayrollRunCodeV4Component } from '../payroll-run-code-v4.component';

@Component({
  selector: 'app-payroll-transactions-table-v4',
  templateUrl: './payroll-transactions-table-v4.component.html',
  styleUrls: ['./payroll-transactions-table-v4.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent]
})
export class PayrollTransactionsTableV4Component implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private payrollService = inject(PayrollService);
  private gettingStartedService = inject(GettingStartedService);
  private personaHelperService = inject(PersonaHelperService);
  private router = inject(Router);

  selectedApp = input<IPayrollApps>();
  paymentMethodChanged = input<number>();
  toolbarRightTemplate = input<TemplateRef<unknown> | undefined>(undefined);
  newPayrollClick = output<void>();
  /** Rendered in the toolbar's left slot - used to sit the table heading inline with the filter buttons. */
  toolbarLeftTemplate = input<TemplateRef<unknown> | undefined>(undefined);

  public tableId: number;
  dynamicHeaderText: 'Payroll Details';
  manualApp = false;
  subscriptions: Subscription[] = [];
  isLoading = false;
  exportConfig = { ignoreColumns: ['status', 'view'] };

  // Always-visible columns. Actions + Status hold the row actions (kebab,
  // Confirm Payment); Run code + Payroll Amount identify the row and are the
  // only unpinned locked columns, so they flex to fill the grid after Hide all
  // instead of leaving a blank band between the two pinned columns.
  lockedColumns = ['view', 'payroll_run_code', 'gross_pay', 'status'];

  kycCompleted = signal<number | undefined>(undefined);

  frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    actionComponent: V4PayrollActionComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    inputFieldComponent: TableInputFieldV4Component,
    feeComponent: PayrollFeeV4Component,
    selectDateComponent: V4DateFloatingFilterComponent,
    dateInputFieldComponent: DateInputFieldV4Component,
    runCodeComponent: PayrollRunCodeV4Component
  };

  floatingFilterConfigurations = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 0, name: 'Pending' },
          { value: 1, name: 'Processing' },
          { value: 2, name: 'Completed' },
          { value: 3, name: 'Tried to Pay' },
          { value: 4, name: 'Failed' },
          { value: 5, name: 'Automatic Payment Initiated' },
          { value: 6, name: 'Rejected' }
        ]
      }
    ],
    selectDate: [
      { id: 'check_date', initialRange: 'All Time', isPrimary: true }
    ]
  };

  ngOnInit(): void {
    this.setDataToTableService();
    this.getServiceFee();
    this.v3DataTableService.v3RowSelectionData = [];
    this.gettingStartedService.getGettingStarted().subscribe((response) => {
      if (response) {
        this.kycCompleted.update(() => response.kycStatus ?? undefined);
      }
    });
  }

  getServiceFee() {
    this.subscriptions.push(
      this.payrollService.getFeeDetails().subscribe((res) => {
        this.payrollService.creditCardFee = res.data.serviceFeePercentage;
      })
    );
  }

  private previousAppId: string | undefined;
  private gridApi: GridApi | undefined;
  // Set when the effect wants to load before the grid exists. The grid's own
  // initial load is deferred (see the template), so this component is the
  // only thing that ever requests rows — and it must do so exactly once per
  // company/transfer-mode pair.
  private pendingLoad = false;

  constructor() {
    effect(
      () => {
        const app = this.selectedApp();
        const method = this.paymentMethodChanged();
        if (!app) return;

        this.tableId = app.manual
          ? DTTableId.manualPayrollData
          : DTTableId.mergeUnifiedPayroll;
        this.manualApp = !!app.manual;

        const appChanged = this.previousAppId !== app.id;

        // The parent clears the transfer mode while it fetches the new
        // company's settings. Until it arrives there is nothing correct to
        // request, so cover the previous company's rows instead of loading
        // them under the new company's name.
        if (method === undefined) {
          if (appChanged) this.gridApi?.showLoadingOverlay();
          return;
        }

        const payload = this.v3DataTableService.defaultPayload;
        if (appChanged || payload?.app_id !== app.id) {
          // Write the payload synchronously so the refresh (and the grid's own
          // initial load) can only ever see this company's app_id.
          this.previousAppId = app.id;
          this.initializeAccountDataTable(app.id);
        } else {
          payload.transfer_type = method.toString();
        }
        this.loadTable();
      },
      { allowSignalWrites: true }
    );
  }

  /**
   * @description Requests rows for the current payload. The grid only listens
   * for refreshes once it is ready, so a request made before that is parked
   * and replayed from `onGridReady` instead of being dropped.
   */
  private loadTable(): void {
    if (!this.gridApi) {
      this.pendingLoad = true;
      return;
    }
    this.v3DataTableService.refreshV3DataTable();
  }

  onGridReady(api: GridApi): void {
    this.gridApi = api;
    if (this.pendingLoad) {
      this.pendingLoad = false;
      // The data table subscribes to the refresh subject right after emitting
      // gridReadyOutput, so the replay has to land on the next microtask.
      queueMicrotask(() => this.v3DataTableService.refreshV3DataTable());
      return;
    }
    // Nothing to request yet (the parent is still fetching the company's
    // transfer mode); keep the shell covered rather than showing "no rows".
    api.showLoadingOverlay();
  }

  /**
   * @description -This function sets the data for the table service.
   * The table service uses this data to render the data table.
   */
  setDataToTableService(): void {
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterConfigurations
    );
  }

  /**
   * @description This function initializes the account data table.
   * It sets the default payload for the data table
   */
  initializeAccountDataTable(appId: string): void {
    const method = this.paymentMethodChanged();
    this.v3DataTableService.defaultPayload = {
      app_id: appId,
      transfer_type: method?.toString() ?? '1',
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: []
    };
  }

  openPersonaVerificationModal() {
    if (environment.isV4Persona) {
      this.personaHelperService
        .openModal('kyc', CVSourceType.other)
        .subscribe((res) => {
          if (res?.data.inquiry_type === 'kyb') {
            this.router.navigateByUrl('/v4/manage/home');
          }
        });
    } else {
      this.router.navigateByUrl('/manage/users/verify-user-id?type=8');
    }
  }

  /**
   * @description These objects defines the column definition for each column in the data table.
   */
  colDefPayrollRunCode = {
    headerName: 'Payroll Run code',
    field: 'payroll_run_code',
    suppressFloatingFilterButton: true,
    minWidth: 180,
    flex: 1,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'runCodeComponent'
  };

  colDefCheckDate = {
    headerName: 'Payroll Date',
    field: 'check_date',
    suppressFloatingFilterButton: true,
    minWidth: 190,
    flex: 1,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    floatingFilterComponentParams: {
      v2Table: true,
      tableName: 'payroll_details_table'
    },
    cellRenderer: 'dateInputFieldComponent',
    cellRendererParams: {
      onUpdate: () => {
        this.v3DataTableService.refreshV3DataTable();
      }
    }
  };

  colDefGrossPay = {
    headerName: 'Payroll Amount',
    field: 'gross_pay',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    flex: 1,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'inputFieldComponent',
    cellRendererParams: {
      columnName: 'gross_pay',
      onUpdate: () => {
        this.v3DataTableService.refreshV3DataTable();
      }
    }
  };

  colProcessAmount = {
    headerName: 'Total Charge to My Card',
    field: 'processed_amount',
    suppressFloatingFilterButton: true,
    minWidth: 180,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    flex: 1,
    sortable: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'inputFieldComponent'
  };

  colChargeCard = {
    headerName: 'Total Sum',
    field: 'total_sum',
    suppressFloatingFilterButton: true,
    minWidth: 130,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    flex: 1,
    sortable: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'feeComponent',
    cellRendererParams: {
      type: 'total'
    }
  };

  // Actions column: one kebab button holding View / Delete, pinned left and
  // first. The button itself is only 20px, so the width is driven by the
  // 'Actions' header text plus the 8px cell padding each side.
  colDefView: ColDef = {
    headerName: 'Actions',
    field: 'view',
    colId: 'view',
    suppressFloatingFilterButton: true,
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    sortable: false,
    minWidth: 76,
    width: 76,
    maxWidth: 76,
    pinned: 'left',
    lockPinned: true,
    lockPosition: true,
    suppressMovable: true,
    cellRenderer: 'actionComponent',
    cellRendererParams: {
      mode: 'view',
      kycCompleted: this.kycCompleted,
      personaVerify: () => {
        this.openPersonaVerificationModal();
      }
    },
    cellStyle: { display: 'flex', 'align-items': 'center' }
  };

  // Status owns the right edge. Fixed width so the gutter left of the Confirm
  // Payment button matches the one right of it — leftover width all lands right.
  colDefStatus: ColDef = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    minWidth: 156,
    width: 156,
    maxWidth: 156,
    pinned: 'right',
    lockPinned: true,
    lockPosition: 'right',
    suppressMovable: true,
    cellRenderer: 'actionComponent',
    cellRendererParams: {
      mode: 'status',
      kycCompleted: this.kycCompleted,
      personaVerify: () => {
        this.openPersonaVerificationModal();
      }
    },
    cellStyle: { display: 'flex', 'align-items': 'center' }
  };

  colDefFee = {
    headerName: 'Fees',
    field: 'fee',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    flex: 1,
    sortable: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'feeComponent',
    cellRendererParams: {
      type: 'fee'
    }
  };

  columnDefs = [
    this.colDefView,
    this.colDefPayrollRunCode,
    this.colDefCheckDate,
    this.colDefGrossPay,
    this.colDefFee,
    this.colProcessAmount,
    this.colChargeCard,
    this.colDefStatus
  ];

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
