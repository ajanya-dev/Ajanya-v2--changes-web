import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  inject,
  signal
} from '@angular/core';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IPayrollApps } from 'src/app/modules/payroll/model/payroll';
import { Subscription, delay, of } from 'rxjs';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { ColDef } from '@ag-grid-community/core';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import { V3PayrollActionComponent } from '../v3-payroll-action/v3-payroll-action.component';
import { TableInputFieldComponent } from '../table-input-field/table-input-field.component';
import { PayrollFeeComponent } from '../payroll-fee/payroll-fee.component';
import { PayrollService } from '../../services/payroll.service';
import { DateInputFieldComponent } from '../date-input-field.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { PayrollRunCodeComponent } from '../payroll-run-code.component';

@Component({
  selector: 'app-payroll-transactions-table',
  templateUrl: './payroll-transactions-table.component.html',
  styleUrls: ['./payroll-transactions-table.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class PayrollTransactionsTableComponent
  implements OnInit, OnChanges, OnDestroy
{
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private payrollService = inject(PayrollService);
  private gettingStartedService = inject(GettingStartedService);
  private personaHelperService = inject(PersonaHelperService);
  private router = inject(Router);

  @Input() selectedApp: IPayrollApps;
  @Input() paymentMethodChanged : boolean;
  @Input() selectedPaymentMethod: number;

  public tableId: number;
  rowHeight = '45';
  dynamicHeaderText: 'Payroll Details';
  manualApp = false;
  subscriptions: Subscription[] = [];
  isLoading = false;
  exportConfig = { ignoreColumns: ['status'] };

  kycCompleted = signal<number | undefined>(undefined);

  frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    SelectBoxComponent: V3DataTableSelectBoxComponent,
    actionComponent: V3PayrollActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    inputFieldComponent: TableInputFieldComponent,
    feeComponent: PayrollFeeComponent,
    dateRangeSelector: DataRangeV35Component,
    dateInputFieldComponent: DateInputFieldComponent,
    runCodeComponent: PayrollRunCodeComponent
  };

  floatingFilterConfigurations = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 0, name: 'Pending' },
          { value: 1, name: 'Processing' },
          { value: 2, name: 'Completed' },
          { value: 3, name: 'Tried to pay' },
          { value: 4, name: 'Failed' },
          { value: 5, name: 'Automatic payment initiated' },
          { value: 6, name: 'Rejected' }
        ]
      }
    ]
  };

  ngOnInit(): void {
    if (this.selectedApp) {
      this.setDataToTableService();
      this.initializeAccountDataTable(this.selectedApp.id);
    }
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

  ngOnChanges(change: SimpleChanges): void {
    if (change?.selectedApp || change?.selectedPaymentMethod) {
      this.tableId = this.selectedApp.manual
        ? DTTableId.manualPayrollData
        : DTTableId.mergeUnifiedPayroll;
      of(1)
        .pipe(delay(1000))
        .subscribe(() => {
          if (this.selectedApp.id) {
            this.initializeAccountDataTable(this.selectedApp.id);
            this.v3DataTableService.refreshV3DataTable();
          }
        });
      this.manualApp = !!this.selectedApp.manual;
    }else if(change?.paymentMethodChanged !== undefined ){
      this.v3DataTableService.refreshV3DataTable();
    }
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
    this.v3DataTableService.defaultPayload = {
      transfer_type: this.selectedPaymentMethod?.toString(),
      app_id: appId,
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
            this.router.navigateByUrl('/manage/home');
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
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    headerClass: 'fixed-size-header',
    cellRenderer: 'runCodeComponent'
  };

  colDefCheckDate = {
    headerName: 'Payroll Date',
    field: 'check_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeSelector',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    floatingFilterComponentParams: {
      v2Table: true,
      tableName: 'payroll_details_table'
    },
    headerClass: 'fixed-size-header',
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
    minWidth: 80,
    maxWidth: 200,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    headerClass: 'fixed-size-header',
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
    minWidth: 150,
    maxWidth: 200,
    sortable: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    headerClass: 'fixed-size-header',
    cellRenderer: 'inputFieldComponent',
  };

  colChargeCard = {
    headerName: 'Total Sum',
    field: 'processed_amount',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    maxWidth: 200,
    sortable: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    headerClass: 'fixed-size-header',
    cellRenderer: 'feeComponent',
    cellRendererParams: {
      type: 'total'
    }
  };

  colActionField: ColDef = {
    headerName: 'Action',
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    minWidth: 150,
    maxWidth: 200,
    cellRenderer: 'actionComponent',
    cellRendererParams: {
      kycCompleted: this.kycCompleted,
      personaVerify: () => {
        this.openPersonaVerificationModal();
      }
    },
    cellStyle: { display: 'flex', 'justify-content': 'flex-end' }
  };

  colDefFee = {
    headerName: 'Fees',
    field: 'gross_pay',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    maxWidth: 200,
    sortable: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    headerClass: 'fixed-size-header ',
    cellRenderer: 'feeComponent',
    cellRendererParams: {
      type: 'fee'
    }
  };

  columnDefs = [
    this.colDefPayrollRunCode,
    this.colDefCheckDate,
    this.colDefGrossPay,
    this.colDefFee,
    this.colProcessAmount,
    this.colChargeCard,
    this.colActionField
  ];

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
