import { DatePipe, CurrencyPipe, NgClass } from '@angular/common';
import { Component, DestroyRef, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  UntypedFormControl,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
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
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { ICoulmnDefFields, IDefaultPayload } from 'src/app/models/v3-datatable';
import { ComponentType } from '@angular/cdk/portal';
import { V3DtDropDownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-dt-drop-down-payee/v3-dt-drop-down-payee.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import {
  DTTableId,
  TTableIdValues
} from 'src/app/modules/data-table/data/table-id';
import { MatTooltip } from '@angular/material/tooltip';
import { ReceivedChecksComponent } from 'src/app/modules/receive-payments/pages/received-checks/received-checks.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ICheckSummary } from '../../model/check';
import { CheckAddAttachmentCommentComponent } from '../check-list/addAttachmentComment';
import { CheckTableList } from '../../components/methods/check-methods';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { SelectedService } from '../../../data-table/components/dt-date-range/selected.service';
import { DtDropDownBankComponent } from '../../../data-table/components/dt-drop-down-bank/dt-drop-down-bank.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { CustomCheckReportData } from './custom-check-reportData';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-custom-check-report',
  templateUrl: './custom-check-report.component.html',
  styleUrls: ['./custom-check-report.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatTooltip,
    V3DataTableComponent,
    NgClass,
    ReceivedChecksComponent,
    CommonButtonV35Component
  ]
})
export class CustomCheckReportComponent implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private dataTableService = inject(DataTableService);
  private v3dataTableService = inject(V3DataTableService);
  private localStorageService = inject(LocalStorageService);
  public datePipe = inject(DatePipe);
  public currencyPipe = inject(CurrencyPipe);
  public selectedService = inject(SelectedService);

  tableData: CustomCheckReportData;
  date1 = new UntypedFormControl('');
  date2 = new UntypedFormControl('');
  activeTab: 'check' | 'receive' = 'check';
  selectedDate = signal<{ endDate: string; startDate: string } | undefined>(
    undefined
  );

  // TABLE RELATED DECLARATIONS
  public columnDefs: ICoulmnDefFields[];
  public columnFields: IDtColumnFields[];
  public headerElements: IV3DtHeaderElements | IDtHeaderElements;
  public frameworkComponents: Record<string, ComponentType<unknown>>;
  FloatingFilterComponent: IDtFloatingFilterProp;
  cellRenderer: IDtCellrendererBtn;
  subscriptions: Subscription[] = [];
  destroyRef = inject(DestroyRef);

  public tableId: TTableIdValues = DTTableId.checkSummary; // Data Table Id
  SummaryData: Record<(typeof this.statuses)[number]['value'], ICheckSummary>;
  receivePaymentsSummary: Record<
    (typeof this.receivePaymentsStatuses)[number]['value'],
    ICheckSummary
  >;

  loading: boolean;
  cellRendererCheckStatuses: Record<string, ICheckStatus> = {};

  statuses = [
    { value: 'new', name: 'New', description: 'New Checks' },
    { value: 'printed', name: 'Printed', description: 'Printed Checks' },
    { value: 'voided', name: 'Void', description: 'Void Checks' },
    { value: 'archieved', name: 'Archived', description: 'Archived Checks' },
    { value: 'printing', name: 'Printing', description: 'Printing Checks' },
    { value: 'mailed', name: 'Mailed', description: 'Mailed Checks' },
    { value: 'schedule', name: 'Scheduled', description: 'Scheduled Checks' },
    { value: 'emailed', name: 'Emailed', description: 'Emailed Checks' },
    { value: 'e-printed', name: 'E-Printed', description: 'E-Printed Checks' },
    { value: 'requested', name: 'Requested', description: 'Requested Checks' },
    { value: 'dd', name: 'DD', description: 'Direct Deposit' },
    {
      value: 'dd-funding',
      name: 'DD-FUNDING',
      description: 'Direct Deposit Funding Started'
    },
    {
      value: 'dd-failed',
      name: 'DD-FAILED',
      description: 'Direct Deposit Failed'
    },
    {
      value: 'ddw',
      name: 'DDW',
      description: 'Direct Deposit In Payee Wallet'
    },
    {
      value: 'dd-depositing',
      name: 'DD-DEPOSITING',
      description: 'Depositing Started'
    },
    {
      value: 'dd-depositing-failed',
      name: 'DD-DEPOSIT-F',
      description: 'Direct Deposit Failed'
    },
    { value: 'ddc', name: 'DDC', description: 'Direct Deposit Completed' },
    { value: 'posted', name: 'Posted', description: 'Posted' },
    { value: 'un_posted', name: 'Un-Posted', description: 'Un-Posted' },
    {
      value: 'approval_required',
      name: 'Approval-required',
      description: '	Approval required'
    },
    {
      value: 'unmapped-check',
      name: 'Unmapped',
      description: 'Unmapped Checks'
    }
  ];

  receivePaymentsStatuses = [
    { value: 'new', name: 'New', description: '' },
    { value: 'pending', name: 'Pending', description: '' },
    { value: 'printed', name: 'Printed', description: '' },
    { value: 'requested', name: 'Requested', description: '' },
    { value: 'rejected', name: 'Rejected', description: '' },
    { value: 'canceled', name: 'Canceled', description: '' },
    { value: 'dd_initiated', name: 'DD Initiated', description: '' },
    { value: 'dd_completed', name: 'DD Completed', description: '' },
    { value: 'dd_failed', name: 'DD Failed', description: '' },
    { value: 'dd_rejected', name: 'DD Rejected', description: '' },
  ];

  ngOnInit(): void {
    this.tableData = new CustomCheckReportData(this.currencyPipe);
    this.date1.setValue(this.datePipe.transform(new Date(), 'yyyy-MM-dd'));
    this.date2.setValue(this.datePipe.transform(new Date(), 'yyyy-MM-dd'));
    this.initDatatable();
    this.getCustomChecksReportSummary(this.date1.value, this.date2.value);
    this.getStatus();
    this.v3dataTableService.refreshV3DataTable();
    this.selectedDate.set({
      startDate: this.date1.value,
      endDate: this.date2.value
    });
    this.v3dataTableService.refreshV3DataTableSubject$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((res) => {
      if (res) {
        this.handleFilterChange();
      }
    });
  }

  initDatatable() {
    this.frameworkComponents = {
      headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
      selectBoxComponent: V3DataTableSelectBoxComponent,
      actionComponent: DtActionComponent,
      SearchBoxComponent: DtSearchBoxComponent,
      bankAccountComponent: DtDropDownBankComponent,
      payeeListComponent: V3DtDropDownPayeeComponent,
      addAttachmentComment: CheckAddAttachmentCommentComponent,
      selectDateComponent: DataRangeV35Component
    };

    this.columnDefs = this.tableData.getColDef();

    // HEADER ELEMENTS PROPERTIES
    this.headerElements = CheckTableList.HeaderElements();

    // FILTER CUSTOM COMPONENTS
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
    // PASS  FIELD DATA
    this.columnFields = this.tableData.getColumnFields();

    // CELL RENDERER COMPONENT
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

  /**
   * @description Setting up the payload  for loading ag grid
   */
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

  getCustomChecksReportSummary(fromDate: string, toDate: string) {
    const sendingData = {
      fromDate: `${fromDate} 00:00:00`,
      toDate: `${toDate} 00:00:00`
    };
    this.loading = true;
    this.subscriptions.push(
      this.checkService
        .getCustomChecksReportSummary(sendingData)
        .subscribe((res) => {
          if (res.success) {
            this.SummaryData = res.data;
          }
        }),
      this.checkService
        .getRequestPaymentReportSummary(sendingData)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.receivePaymentsSummary = res.data;
          }
        })
    );
  }

  onFilterClicked() {
    if (this.date1.value && this.date2.value) {
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
      // get status from local storage
      const status: Record<string, ICheckStatus> =
        this.localStorageService.getItem('check_status');
      this.cellRendererCheckStatuses = status;
      this.tableData.cellRendererCheckStatus = status;
      return;
    }

    this.subscriptions.push(
      this.checkService.getCheckStatus().subscribe((res) => {
        if (res.success) {
          this.localStorageService.setItem('check_status', res.data);
          this.cellRendererCheckStatuses = res.data;
          this.tableData.cellRendererCheckStatus = res.data;
        }
      })
    );
  }


  handleFilterChange() {
    let dateFilter = this.v3dataTableService.defaultPayload.filterModel.cheque_issue_date;

    if(this.activeTab === 'receive') {
      dateFilter = this.v3dataTableService.defaultPayload.filterModel['received_check_lists.created_at'];
    }


    if (dateFilter) {
      this.date1.setValue(dateFilter.dateFrom);
      this.date2.setValue(dateFilter.dateTo);
    } else {
      this.date1.setValue('2000-01-01');
      this.date2.setValue(this.datePipe.transform(new Date(), 'yyyy-MM-dd'));
    }
    this.getCustomChecksReportSummary(this.date1.value, this.date2.value);
  }

  toggleTab(tab: 'check' | 'receive') {
    this.activeTab = tab;
    if (tab === 'check') {
      this.date1.setValue(this.datePipe.transform(new Date(), 'yyyy-MM-dd'));
      this.date2.setValue(this.datePipe.transform(new Date(), 'yyyy-MM-dd'));
      this.initDatatable();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
