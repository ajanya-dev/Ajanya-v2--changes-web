import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  IDtCellrendererBtn,
  IDtColumnFields
} from 'src/app/modules/data-table/model/datatable';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { ComponentType } from '@angular/cdk/portal';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ICoulmnDefFields, IDefaultPayload } from 'src/app/models/v3-datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import {
  DTTableId,
  TTableIdValues
} from 'src/app/modules/data-table/data/table-id';
import { CustomJobsReportData } from './custom-jobs-report-data';
import { IcellRendererActionClickEvent } from '../../model/all-reports';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';

/**
 * Angular component representing the Custom Jobs Report page.
 * @class
 */
@Component({
  selector: 'app-custom-jobs-report',
  templateUrl: './custom-jobs-report.component.html',
  styleUrls: ['./custom-jobs-report.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class CustomJobsReportComponent implements OnInit, OnDestroy {
  // TABLE RELATED DECLARATIONS
  /**
   * An array of column definitions for the Ag-Grid table.
   * @type {(ColDef | ColGroupDef)[] | null}
   */
  public columnDefs: ICoulmnDefFields[];

  /**
   * An array of column fields for the data table.
   * @type {IDtColumnFields[]}
   */
  public columnFields: IDtColumnFields[];

  /**
   * Framework components for custom Ag-Grid components.
   * @type {{ [p: string]: { new(): any; }; } | any}
   */
  public frameworkComponents: Record<string, ComponentType<unknown>>;

  /**
   * Floating filter components for specific columns.
   * @type {{ [p: string]: { id: string; initialRange: string; }[] } | undefined}
   */
  FloatingFilterComponent:
    | { [p: string]: { id: string; initialRange: string }[] }
    | undefined;

  /**
   * Configuration for the custom cell renderer component.
   * @type {IDtCellrendererBtn}
   */
  cellRenderer: IDtCellrendererBtn;

  /**
   * An array of subscriptions to manage subscriptions.
   * @type {Subscription[]}
   */
  subscriptions: Subscription[] = [];

  /**
   * The table ID for the data table.
   * @type {TTableIdValues}
   */
  public tableId: TTableIdValues = DTTableId.youngWilliamTextFiles; // Data Table Id

  // --------------------------------------------------Column Definitions----------------------------------------------------------------
  /**
   * Loading status for the page.
   * @type {boolean}
   */
  loading: boolean;

  /**
   * The data for the custom jobs report table.
   * @type {CustomJobsReportData}
   */
  tableData: CustomJobsReportData;

  /**
   * Properties for action components.
   * @type {{ actionButton: boolean; eyeButton: boolean; }}
   */
  actionComponentProp: { actionButton: boolean; eyeButton: boolean };

  /**
   * Constructor to create an instance of CustomJobsReportComponent.
   * @constructor
   * @param {DecimalPipe} decimal - An instance of the DecimalPipe for formatting numbers.
   * @param {DataTableService} dataTableService - The data table service.
   * @param {ReportsService} reportService - The reports service.
   */
  private dataTableService = inject(DataTableService);
  private reportService = inject(ReportsService);
  private v3DataTableService = inject(V3DataTableService);
  private decimal = inject(DecimalPipe);

  /**
   * Angular lifecycle hook called when the component is initialized.
   * Initializes the data table and its components.
   * @method
   */
  ngOnInit(): void {
    this.tableData = new CustomJobsReportData(this.decimal);
    this.initDatatable();
  }

  /**
   * Initializes the data table, its components, and configuration.
   * @method
   */
  initDatatable() {
    this.frameworkComponents = {
      headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
      selectDateComponent: DataRangeV35Component,
      actionComponent: DtActionComponent,
      SearchBoxComponent: DtSearchBoxComponent
    };

    this.columnDefs = this.tableData.getColDef();
    this.actionComponentProp = {
      actionButton: true,
      eyeButton: false
    };

    // FILTER CUSTOM COMPONENTS
    this.FloatingFilterComponent = {};
    this.FloatingFilterComponent.selectDate = [
      { id: 'created_at', initialRange: 'All Time' }
    ];
    // PASS  FIELD DATA
    this.columnFields = this.tableData.getColumnFields();

    // CELL RENDERER COMPONENT
    this.cellRenderer = {
      action: [
        {
          name: 'Job Details Report',
          id: 'id_report',
          icon: 'fa fa-file-chart-column'
        },
        {
          name: 'Job Audit Report',
          id: 'id_audit_report',
          icon: 'fa fa-file-chart-column'
        },
        {
          name: 'Download File',
          id: 'id_file',
          icon: 'fa fa-arrow-down-to-line'
        }
      ]
    };

    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.initializeV3DataTable();
  }

  /**
   * @description Setting up the payload  for loading ag grid
   */
  initializeV3DataTable() {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: []
    } as IDefaultPayload;
  }

  /**
   * Handles the click event of the action button in the cell renderer.
   * @param {IcellRendererActionClickEvent} event - The cell renderer action click event.
   */
  cellRendererActionClick(event: IcellRendererActionClickEvent) {
    if (event.id === 'id_report') {
      this.getJobDetailsReport(event.selectedRow.action);
    } else if (event.id === 'id_file') {
      this.getUploadedFile(event.selectedRow.action);
    } else if (event.id === 'id_audit_report') {
      this.getJobAuditReport(event.selectedRow.action);
    }
  }

  /**
   * Retrieves and opens the Job Details Report for a specific ID.
   * @param {string} id - The ID of the report.
   */
  getJobDetailsReport(id: string) {
    this.subscriptions.push(
      this.reportService
        .getJobDetailsReport(id)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            if (res?.data) {
              window.open(res?.data);
            }
          }
        })
    );
  }

  /**
   * Retrieves and opens the Job Audit Report for a specific ID.
   * @param {string} id - The ID of the report.
   */
  getJobAuditReport(id: string) {
    this.subscriptions.push(
      this.reportService
        .getJobAuditReport(id)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            if (res?.data) {
              window.open(res?.data);
            }
          }
        })
    );
  }

  /**
   * Retrieves and opens the Uploaded file for a specific ID.
   * @param {string} id - The ID of the report.
   */
  getUploadedFile(id: string) {
    this.subscriptions.push(
      this.reportService
        .getUploadedFile(id)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            if (res?.data) {
              window.open(res?.data);
            }
          }
        })
    );
  }

  /**
   * Angular lifecycle hook called when the component is destroyed.
   * Unsubscribes from all subscriptions to prevent memory leaks.
   * @method
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
