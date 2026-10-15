import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentType } from '@angular/cdk/portal';
import { ICustomDateRangeModel } from 'src/app/models/common';
import {
  IDtCellrendererBtn,
  IDtColumnFields,
  IDtFloatingFilterProp,
  IDtHeaderElements
} from 'src/app/modules/data-table/model/datatable';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { ICheckStatus } from 'src/app/modules/check/model/check';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ICoulmnDefFields, IDefaultPayload } from 'src/app/models/v3-datatable';
import {
  DTTableId,
  TTableIdValues
} from 'src/app/modules/data-table/data/table-id';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { V4BankDropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-bank-dropdown-floating-filter/v4-bank-dropdown-floating-filter.component';
import { DetailedTabV4Component } from 'src/app/modules/v4/payments-in/components/detailed-tab-v4/detailed-tab-v4.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { ICheckSummary } from '../../model/check';
import { CheckTableList } from '../../components/methods/check-methods';
import { V4CustomCheckReportData } from './v4-custom-check-report-data';
import { V4CustomCheckReportActionComponent } from './cell-renderers/v4-custom-check-report-action/v4-custom-check-report-action.component';
import { V4CheckStatusComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-check-list/cell-renderers/v4-check-status/v4-check-status.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { V4UpdatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-updated-at/v4-updated-at.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { SelectedService } from '../../../data-table/components/dt-date-range/selected.service';

@Component({
  selector: 'app-v4-custom-check-report',
  templateUrl: './v4-custom-check-report.component.html',
  styleUrls: ['./v4-custom-check-report.component.scss'],
  standalone: true,
  providers: [DatePipe, CurrencyPipe],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    CommonTabV4Component,
    CommonButtonV4Component,
    V4DataTableComponent,
    DetailedTabV4Component,
    V4DatePickerComponent,
    V4PageHeaderComponent
  ]
})
export class V4CustomCheckReportComponent implements OnInit {
  private checkService = inject(CheckService);
  private dataTableService = inject(DataTableService);
  private v3dataTableService = inject(V3DataTableService);
  private localStorageService = inject(LocalStorageService);
  private datePipe = inject(DatePipe);
  private currencyPipe = inject(CurrencyPipe);
  public selectedService = inject(SelectedService);
  destroyRef = inject(DestroyRef);

  tableData: V4CustomCheckReportData;
  date1 = new FormControl('', { nonNullable: true });
  date2 = new FormControl('', { nonNullable: true });
  activeTab = signal<'check' | 'receive'>('check');
  private tabDates: Record<'check' | 'receive', { from: string; to: string }> =
    {
      check: { from: '', to: '' },
      receive: { from: '', to: '' }
    };
  selectedDate = signal<{ endDate: string; startDate: string } | undefined>(
    undefined
  );

  public columnDefs: ICoulmnDefFields[];
  public columnFields: IDtColumnFields[];
  public headerElements: IV3DtHeaderElements | IDtHeaderElements;
  public frameworkComponents: Record<string, ComponentType<unknown>>;
  FloatingFilterComponent: IDtFloatingFilterProp;
  cellRenderer: IDtCellrendererBtn;

  public tableId: TTableIdValues = DTTableId.checkSummary;
  SummaryData: Record<(typeof this.statuses)[number]['value'], ICheckSummary>;
  receivePaymentsSummary: Record<
    (typeof this.receivePaymentsStatuses)[number]['value'],
    ICheckSummary
  >;

  loading = signal(false);
  cellRendererCheckStatuses: Record<string, ICheckStatus> = {};

  tabs: ITabItem[] = [
    { label: 'Check', value: 'check' },
    { label: 'Receive Payments', value: 'receive' }
  ];

  statuses = [
    { value: 'new', name: 'New', description: 'New Checks', color: 'info' },
    {
      value: 'printed',
      name: 'Printed',
      description: 'Printed Checks',
      color: 'info'
    },
    {
      value: 'voided',
      name: 'Void',
      description: 'Void Checks',
      color: 'warning'
    },
    {
      value: 'archieved',
      name: 'Archived',
      description: 'Archived Checks',
      color: 'info'
    },
    {
      value: 'printing',
      name: 'Printing',
      description: 'Printing Checks',
      color: 'info'
    },
    {
      value: 'mailed',
      name: 'Mailed',
      description: 'Mailed Checks',
      color: 'info'
    },
    {
      value: 'schedule',
      name: 'Scheduled',
      description: 'Scheduled Checks',
      color: 'info'
    },
    {
      value: 'emailed',
      name: 'Emailed',
      description: 'Emailed Checks',
      color: 'info'
    },
    {
      value: 'e-printed',
      name: 'E-Printed',
      description: 'E-Printed Checks',
      color: 'info'
    },
    {
      value: 'requested',
      name: 'Requested',
      description: 'Requested Checks',
      color: 'info'
    },
    { value: 'dd', name: 'DD', description: 'Direct Deposit', color: 'info' },
    {
      value: 'dd-funding',
      name: 'DD-FUNDING',
      description: 'Direct Deposit Funding Started',
      color: 'info'
    },
    {
      value: 'dd-failed',
      name: 'DD-FAILED',
      description: 'Direct Deposit Failed',
      color: 'error'
    },
    {
      value: 'ddw',
      name: 'DDW',
      description: 'Direct Deposit In Payee Wallet',
      color: 'info'
    },
    {
      value: 'dd-depositing',
      name: 'DD-DEPOSITING',
      description: 'Depositing Started',
      color: 'info'
    },
    {
      value: 'dd-depositing-failed',
      name: 'DD-DEPOSIT-F',
      description: 'Direct Deposit Failed',
      color: 'error'
    },
    {
      value: 'ddc',
      name: 'DDC',
      description: 'Direct Deposit Completed',
      color: 'success'
    },
    {
      value: 'posted',
      name: 'Posted',
      description: 'Posted',
      color: 'success'
    },
    {
      value: 'un_posted',
      name: 'Un-Posted',
      description: 'Un-Posted',
      color: 'warning'
    },
    {
      value: 'approval_required',
      name: 'Approval-required',
      description: 'Approval required',
      color: 'warning'
    },
    {
      value: 'unmapped-check',
      name: 'Unmapped',
      description: 'Unmapped Checks',
      color: 'warning'
    }
  ];

  receivePaymentsStatuses = [
    { value: 'new', name: 'New', description: '', color: 'info' },
    { value: 'pending', name: 'Pending', description: '', color: 'info' },
    { value: 'printed', name: 'Printed', description: '', color: 'info' },
    { value: 'requested', name: 'Requested', description: '', color: 'info' },
    { value: 'rejected', name: 'Rejected', description: '', color: 'error' },
    { value: 'canceled', name: 'Canceled', description: '', color: 'warning' },
    {
      value: 'dd_initiated',
      name: 'DD Initiated',
      description: '',
      color: 'info'
    },
    {
      value: 'dd_completed',
      name: 'DD Completed',
      description: '',
      color: 'success'
    },
    { value: 'dd_failed', name: 'DD Failed', description: '', color: 'error' },
    {
      value: 'dd_rejected',
      name: 'DD Rejected',
      description: '',
      color: 'error'
    }
  ];

  ngOnInit(): void {
    this.tableData = new V4CustomCheckReportData(this.currencyPipe);
    this.date1.setValue(
      this.datePipe.transform(new Date(), 'yyyy-MM-dd') ?? ''
    );
    this.date2.setValue(
      this.datePipe.transform(new Date(), 'yyyy-MM-dd') ?? ''
    );
    this.initDatatable();
    this.getCustomChecksReportSummary(this.date1.value, this.date2.value, 'check');
    this.getCustomChecksReportSummary(this.date1.value, this.date2.value, 'receive');
    this.getStatus();
    this.v3dataTableService.refreshV3DataTable();
    this.selectedDate.set({
      startDate: this.date1.value,
      endDate: this.date2.value
    });
  }

  toggleTab(tab: 'check' | 'receive') {
    const current = this.activeTab();
    this.tabDates[current] = {
      from: this.date1.value,
      to: this.date2.value
    };
    this.activeTab.set(tab);
    const next = this.tabDates[tab];
    const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd') ?? '';
    this.date1.setValue(next.from || today);
    this.date2.setValue(next.to || today);
    this.selectedDate.set({
      startDate: this.date1.value,
      endDate: this.date2.value
    });
    if (tab === 'check') {
      this.initDatatable();
    }
  }

  initDatatable() {
    this.frameworkComponents = {
      headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
      selectBoxComponent: V4DropdownFloatingFilterComponent,
      SearchBoxComponent: V4TextFloatingFilterComponent,
      bankAccountComponent: V4BankDropdownFloatingFilterComponent,
      payeeListComponent: V4PayeeMultiSelectFloatingFilterComponent,
      selectDateComponent: V4DateFloatingFilterComponent,
      v4CheckReportActionComponent: V4CustomCheckReportActionComponent,
      v4CheckStatusComponent: V4CheckStatusComponent,
      v4CreatedAtComponent: V4CreatedAtComponent,
      v4UpdatedAtComponent: V4UpdatedAtComponent
    };

    this.columnDefs = this.tableData.getColDef();
    this.headerElements = CheckTableList.HeaderElements();
    this.FloatingFilterComponent = CheckTableList.floatingFilterCompProp();
    this.FloatingFilterComponent.selectDate = [
      { id: 'cheques.updated_at', initialRange: 'All Time' },
      { id: 'cheques.created_at', initialRange: 'All Time' },
      {
        id: 'cheque_issue_date',
        initialRange: 'Custom',
        isPrimary: true,
        isCustomDateFilter: {
          enabled: true,
          prop: { startDate: this.date1.value, endDate: this.date2.value }
        }
      }
    ];
    this.selectedService.setCustomDateFilterArray({
      colId: 'cheque_issue_date',
      fromDate: this.date1.value,
      toDate: this.date2.value,
      dateRangeId: 'today'
    });
    this.columnFields = this.tableData.getColumnFields();
    this.cellRenderer = CheckTableList.cellRendererActionBtn();

    this.v3dataTableService.dataTablePayload = {
      ...this.v3dataTableService.dataTablePayload,
      filterModel: this.FloatingFilterComponent.selectDate
    } as IDefaultPayload;
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer
    );
    this.initializeV3DataTable();
  }

  initializeV3DataTable() {
    this.v3dataTableService.defaultPayload = {
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

  getCustomChecksReportSummary(fromDate: string, toDate: string, tab?: 'check' | 'receive') {
    const sendingData = {
      fromDate: `${fromDate} 00:00:00`,
      toDate: `${toDate} 00:00:00`
    };
    this.loading.set(true);
    const activeTab = tab || this.activeTab();
    if (activeTab === 'check') {
      this.checkService
        .getCustomChecksReportSummary(sendingData)
        .pipe(
          finalize(() => this.loading.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) this.SummaryData = res.data;
        });
    }
    if (activeTab === 'receive') {
      this.checkService
        .getRequestPaymentReportSummary(sendingData)
        .pipe(
          finalize(() => this.loading.set(false)),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) this.receivePaymentsSummary = res.data;
        });
    }
  }

  onFilterClicked() {
    if (this.date1.value && this.date2.value) {
      this.tabDates[this.activeTab()] = {
        from: this.date1.value,
        to: this.date2.value
      };
      this.getCustomChecksReportSummary(this.date1.value, this.date2.value);
      const dateFilterDetails: ICustomDateRangeModel = {
        fromDate: this.date1.value,
        toDate: this.date2.value,
        colId: 'cheque_issue_date'
      };
      this.selectedService.setCustomDateFilterArray(dateFilterDetails);
      this.selectedDate.set({
        startDate: this.date1.value,
        endDate: this.date2.value
      });
    }
  }

  getStatus() {
    if (this.localStorageService.getItem('check_status') != null) {
      const status: Record<string, ICheckStatus> =
        this.localStorageService.getItem('check_status');
      this.cellRendererCheckStatuses = status;
      this.tableData.cellRendererCheckStatus = status;
      return;
    }
    this.checkService
      .getCheckStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.localStorageService.setItem('check_status', res.data);
          this.cellRendererCheckStatuses = res.data;
          this.tableData.cellRendererCheckStatus = res.data;
        }
      });
  }

  handleFilterChange() {
    let dateFilter =
      this.v3dataTableService.defaultPayload.filterModel.cheque_issue_date;
    if (this.activeTab() === 'receive') {
      dateFilter =
        this.v3dataTableService.defaultPayload.filterModel[
          'received_check_lists.created_at'
        ];
    }
    if (dateFilter) {
      this.date1.setValue(dateFilter.dateFrom);
      this.date2.setValue(dateFilter.dateTo);
    } else {
      this.date1.setValue('2000-01-01');
      this.date2.setValue(
        this.datePipe.transform(new Date(), 'yyyy-MM-dd') ?? ''
      );
    }
    this.getCustomChecksReportSummary(this.date1.value, this.date2.value);
  }

}
