import { Component, inject, OnInit, signal, DestroyRef } from '@angular/core';
import { Location } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { DeveloperPanelService } from 'src/app/shared/service/developer-panel/developer-panel.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IApiSettingsDetails } from 'src/app/models/developer';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ApiLogDetailPanelV4Component,
  httpStatusTone
} from './api-log-detail-panel-v4/api-log-detail-panel-v4.component';
import { ApiLogViewButtonV4Component } from './api-log-view-button-v4/api-log-view-button-v4.component';
import { ApiLogTruncatedCellV4Component } from './api-log-truncated-cell-v4/api-log-truncated-cell-v4.component';

@Component({
  selector: 'app-api-logs-v4',
  templateUrl: './api-logs-v4.component.html',
  styleUrls: ['./api-logs-v4.component.scss'],
  standalone: true,
  imports: [
    LucideAngularModule,
    V4DataTableComponent,
    ApiLogDetailPanelV4Component,
    ApiLogViewButtonV4Component,
    ApiLogTruncatedCellV4Component,
    ReactiveFormsModule,
    CommonInputFieldV4Component,
    CommonButtonV4Component,
    V4PageHeaderComponent
  ]
})
export class ApiLogsV4Component implements OnInit {
  private location = inject(Location);
  private developerPanelService = inject(DeveloperPanelService);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private v4AlertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly tableId = DTTableId.apiRequestLog;

  isPanelOpen = signal(false);
  detailLoading = signal(false);
  selectedLog = signal<IApiSettingsDetails | null>(null);

  searchLoading = signal(false);
  searchForm = new FormGroup({
    eventId: new FormControl('', [
      Validators.required,
      ValidationService.noWhitespaceValidator
    ])
  });

  /**
   * @description Disable search while loading or until the user types something.
   * Whitespace-only input keeps the button enabled so the validation message
   * surfaces on submit.
   */
  get searchDisabled(): boolean {
    return this.searchLoading() || !this.searchForm.value.eventId;
  }

  frameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    SelectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent
  };

  floatingFilterComponent = {
    selectBox: [
      {
        id: 'http_method',
        values: [
          { value: 'GET', name: 'GET' },
          { value: 'POST', name: 'POST' },
          { value: 'PUT', name: 'PUT' },
          { value: 'DELETE', name: 'DELETE' },
          { value: 'PATCH', name: 'PATCH' }
        ]
      }
    ]
  };

  columnDefs: ColDef[] = [
    {
      headerName: 'Actions',
      field: 'view',
      minWidth: 80,
      width: 80,
      maxWidth: 80,
      flex: 0,
      pinned: 'left',
      lockPinned: true,
      lockPosition: true,
      suppressMovable: true,
      sortable: false,
      suppressFloatingFilterButton: true,
      suppressHeaderMenuButton: true,
      floatingFilter: false,
      cellClass: 'flex items-center',
      cellRenderer: ApiLogViewButtonV4Component
    },
    {
      headerName: 'Event ID',
      field: 'id',
      minWidth: 105,
      width: 115,
      maxWidth: 125,
      flex: 0,
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellClass: 'flex flex-col justify-center pl-2.5',
      headerClass: 'pl-3'
    },
    {
      headerName: 'IP',
      field: 'ip_address',
      minWidth: 130,
      width: 145,
      maxWidth: 160,
      flex: 0,
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellClass: 'flex flex-col justify-center pl-2.5',
      headerClass: 'pl-3',
      sortable: false
    },
    {
      headerName: 'Created At',
      field: 'created_at',
      minWidth: 165,
      width: 175,
      maxWidth: 185,
      flex: 0,
      suppressFloatingFilterButton: true,
      filter: 'agDateColumnFilter',
      floatingFilterComponent: 'selectDateComponent',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellClass: 'flex flex-col justify-center pl-2.5',
      headerClass: 'pl-3',
      cellRenderer: (params: ICellRendererParams) => {
        const createdAt = params.value?.toString();
        if (!createdAt) {
          return '';
        }
        // Date over time, matching the Updated/Created Date columns in Payments
        // Out. Written out here rather than reusing v4-updated-at.component,
        // which reads fixed field names off params.data.
        const [, date, time] = createdAt.match(/^(.*?)\s*-\s*(.*)$/) ?? [
          null,
          createdAt,
          ''
        ];
        return `
          <div style="display:flex;flex-direction:column;gap:1px;line-height:1.25;white-space:nowrap">
            <span>${date}</span>
            ${
              time
                ? `<span style="font-size:10px;color:var(--v4-secondary-text-color)">${time}</span>`
                : ''
            }
          </div>
        `;
      }
    },
    {
      headerName: 'Payload',
      field: 'request_body',
      minWidth: 160,
      flex: 2,
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellClass: 'flex flex-col justify-center pl-2.5',
      headerClass: 'pl-3',
      sortable: false,
      cellRenderer: ApiLogTruncatedCellV4Component
    },
    {
      headerName: 'End Point',
      field: 'full_url',
      minWidth: 220,
      flex: 3,
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellClass: 'flex flex-col justify-center pl-2.5',
      headerClass: 'pl-3',
      sortable: false,
      cellRenderer: ApiLogTruncatedCellV4Component
    },
    {
      headerName: 'Method',
      field: 'http_method',
      minWidth: 105,
      width: 115,
      maxWidth: 125,
      flex: 0,
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'SelectBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellClass: 'flex flex-col justify-center pl-2.5',
      headerClass: 'pl-3',
      sortable: false
    },
    {
      headerName: 'Response Status',
      field: 'response_status',
      minWidth: 145,
      width: 150,
      maxWidth: 150,
      flex: 0,
      pinned: 'right',
      lockPinned: true,
      lockPosition: 'right',
      suppressMovable: true,
      suppressFloatingFilterButton: true,
      floatingFilterComponent: 'SearchBoxComponent',
      filter: 'agTextColumnFilter',
      floatingFilter: true,
      suppressHeaderMenuButton: true,
      cellClass: 'flex flex-col justify-center pl-2.5',
      headerClass: 'pl-3',
      sortable: false,
      cellRenderer: (params: ICellRendererParams) =>
        this.responseStatusChip(params.value)
    }
  ];

  /**
   * @description Renders an HTTP response status as the shared square tint chip
   * (`.status-badge`, styled globally under `.ag-theme-v4`). The grid uses a plain
   * ag-grid string cellRenderer, so this returns HTML. The value is validated as a
   * three-digit HTTP code before interpolation, so no raw input reaches the DOM.
   */
  private responseStatusChip(status: string | number | undefined): string {
    const code = String(status ?? '').trim();
    if (!/^[0-9]{3}$/.test(code)) return '';
    const c = this.statusBadgeTokens(code);
    return `<span class="status-badge" style="background-color:${c.bg};color:${c.text}">${code}</span>`;
  }

  /** 2xx success, 3xx warning, 4xx/5xx error, else neutral — shared with the detail panel badge. */
  private statusBadgeTokens(status: string): { bg: string; text: string } {
    const tone = httpStatusTone(status);
    return {
      bg: `var(--v4-badge-${tone}-bg-color)`,
      text: `var(--v4-badge-${tone}-text-color)`
    };
  }

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterComponent
    );
  }

  onViewLog(event: { selectedRow?: { id?: string | number } }): void {
    const id = event?.selectedRow?.id;
    if (!id) return;
    this.openLogDetails(String(id));
  }

  /**
   * @description Quick search by event id. Resolves the detail endpoint directly
   * (bypassing the timeout-prone aggregated table filter) and opens the detail
   * panel when a matching log exists.
   */
  searchByEventId(): void {
    if (this.searchForm.invalid || this.searchLoading()) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const eventId = (this.searchForm.value.eventId ?? '').trim();
    if (!eventId) {
      this.searchForm.markAllAsTouched();
      return;
    }

    this.searchLoading.set(true);
    this.developerPanelService
      .apiSettingsDetails(eventId)
      .pipe(
        finalize(() => this.searchLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success && res.data) {
          this.selectedLog.set(res.data);
          this.isPanelOpen.set(true);
        }
      });
  }

  private openLogDetails(id: string): void {
    this.isPanelOpen.set(true);
    this.selectedLog.set(null);
    this.detailLoading.set(true);
    this.developerPanelService
      .apiSettingsDetails(id)
      .pipe(
        finalize(() => this.detailLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) this.selectedLog.set(res.data);
        },
        error: (err) => {
          this.v4AlertService.failedAlert({
            content: err.error?.errorMsg ?? 'Failed to load log details.'
          });
        }
      });
  }

  closePanel(): void {
    this.isPanelOpen.set(false);
    this.selectedLog.set(null);
  }

  goBack(): void {
    this.location.back();
  }
}
