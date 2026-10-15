import { CurrencyPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { CustomJobsReportActionV4Component } from './custom-jobs-report-action-v4/custom-jobs-report-action-v4.component';

interface ICustomJobsRow {
  action: string;
}

@Component({
  selector: 'app-custom-jobs-report-v4',
  standalone: true,
  imports: [V4DataTableComponent, V4PageHeaderComponent],
  templateUrl: './custom-jobs-report-v4.component.html',
  styleUrl: './custom-jobs-report-v4.component.scss',
  providers: [CurrencyPipe]
})
export class CustomJobsReportV4Component implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private reportService = inject(ReportsService);
  private currencyPipe = inject(CurrencyPipe);

  destroy$ = new Subject();
  loading = signal(false);

  public tableId = DTTableId.youngWilliamTextFiles;
  public columnDefs: ICoulmnDefFields[];
  public columnFields: IDtColumnFields[];

  // Locked into the column menu's "Always visible" group via defaultDisabledColumn
  // so "Hide all" can't collapse the grid to the 70px action column and leave the
  // row area blank. Also passed as fieldsShownByDefault so a visibility payload
  // saved before this lock existed can't restore them hidden.
  public alwaysShownFields = [
    'action',
    'filename',
    'total_amount',
    'young_william_text_files.created_at'
  ];

  frameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    customJobsActionComponent: CustomJobsReportActionV4Component
  };

  ngOnInit(): void {
    this.columnDefs = [
      this.colDefAction,
      this.colDefFileName,
      this.colDefAmount,
      this.colDefCheckCount,
      this.colDefUploadedBy,
      this.colDefCreatedAt
    ];

    this.columnFields = [
      {
        id: 'id_action',
        name: 'Action',
        isDisabled: true,
        colDef: this.colDefAction,
        isChecked: true
      },
      {
        id: 'filename',
        name: 'File Name',
        isDisabled: true,
        colDef: this.colDefFileName,
        isChecked: true
      },
      {
        id: 'total_amount',
        name: 'Total Amount',
        isDisabled: true,
        colDef: this.colDefAmount,
        isChecked: true
      },
      {
        id: 'records_count',
        name: 'Check Count',
        isDisabled: false,
        colDef: this.colDefCheckCount,
        isChecked: true
      },
      {
        id: 'name',
        name: 'Uploaded By',
        isDisabled: false,
        colDef: this.colDefUploadedBy,
        isChecked: true
      },
      {
        id: 'id_createdAt',
        name: 'Created Time',
        isDisabled: true,
        colDef: this.colDefCreatedAt,
        isChecked: true
      }
    ];

    this.dataTableService.setDataFromParent(
      this.columnFields,
      undefined,
      undefined
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  onAction(row: ICustomJobsRow, id: string): void {
    if (id === 'id_report') {
      this.openReport(this.reportService.getJobDetailsReport(row.action));
    } else if (id === 'id_audit_report') {
      this.openReport(this.reportService.getJobAuditReport(row.action));
    } else if (id === 'id_file') {
      this.openReport(this.reportService.getUploadedFile(row.action));
    }
  }

  private openReport(
    request$: ReturnType<ReportsService['getJobDetailsReport']>
  ): void {
    this.loading.set(true);
    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        if (res?.success && res?.data) {
          window.open(res.data);
        }
      });
  }

  colDefAction: ICoulmnDefFields = {
    headerName: 'Action',
    field: 'action',
    minWidth: 70,
    width: 70,
    maxWidth: 70,
    flex: 0,
    pinned: 'left',
    lockPinned: true,
    lockPosition: true,
    suppressMovable: true,
    suppressFloatingFilterButton: true,
    sortable: false,
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    cellRenderer: 'customJobsActionComponent',
    cellRendererParams: () => ({
      onActionClick: (row: ICustomJobsRow, id: string) => this.onAction(row, id)
    })
  };

  colDefFileName: ICoulmnDefFields = {
    headerName: 'File Name',
    field: 'filename',
    minWidth: 220,
    flex: 3,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true
  };

  colDefAmount: ICoulmnDefFields = {
    headerName: 'Total Amount',
    field: 'total_amount',
    minWidth: 150,
    flex: 1,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: (params: ICellRendererParams) =>
      this.currencyPipe.transform(params.value)
  };

  colDefCheckCount: ICoulmnDefFields = {
    headerName: 'Check Count',
    field: 'records_count',
    minWidth: 130,
    flex: 1,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true
  };

  colDefUploadedBy: ICoulmnDefFields = {
    headerName: 'Uploaded By',
    field: 'name',
    minWidth: 150,
    flex: 1.5,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    floatingFilter: true,
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true
  };

  colDefCreatedAt: ICoulmnDefFields = {
    headerName: 'Created Time',
    field: 'young_william_text_files.created_at',
    minWidth: 190,
    flex: 1.5,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      const createdAt = params?.data?.created_at?.toString();
      if (!createdAt) {
        return '';
      }
      const [date, time] = createdAt.split('_');
      // Date over time, matching the Updated/Created Date columns in Payments
      // Out. Styled inline rather than through v4-created-at.component: that
      // renderer splits on '-' via Utils.splitDate, and this endpoint joins the
      // two halves with '_'.
      return `
        <div style="display:flex;flex-direction:column;gap:1px;line-height:1.25;white-space:nowrap">
          <span>${date}</span>
          <span style="font-size:10px;color:var(--v4-secondary-text-color)">${time}</span>
        </div>
      `;
    }
  };

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
