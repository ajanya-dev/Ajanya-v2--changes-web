import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
  ColDef,
  CheckboxSelectionCallbackParams
} from '@ag-grid-community/core';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { renderStackedDateTime } from 'src/app/modules/v4-data-table/utils/stacked-date-time';
import { DocumentMailFilesTableActionV4Component } from 'src/app/modules/business-tools/document-mail/v4-document-mail/components/document-mail-files-table-action-v4/document-mail-files-table-action-v4.component';
import { DocumentMailStatusBadgeV4Component } from 'src/app/modules/business-tools/document-mail/v4-document-mail/components/document-mail-status-badge-v4/document-mail-status-badge-v4.component';
import { DocumentMailDetailPanelV4Component } from 'src/app/modules/business-tools/document-mail/v4-document-mail/components/document-mail-detail-panel-v4/document-mail-detail-panel-v4.component';
import { IDocumentMailDataFilesTableRowData } from 'src/app/modules/business-tools/document-mail/models/document-mail.model';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { DocumentSendMailWizardV4Component } from 'src/app/modules/business-tools/document-mail/v4-document-mail/modals/document-send-mail-wizard-v4/document-send-mail-wizard-v4.component';
import { V4DocumentMailModalComponent } from 'src/app/modules/business-tools/document-mail/components/v4-document-mail-modal/v4-document-mail-modal.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';

@Component({
  selector: 'app-v4-document-mail-history',
  templateUrl: './v4-document-mail-history.component.html',
  styleUrls: ['./v4-document-mail-history.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    V4DataTableComponent,
    DocumentMailDetailPanelV4Component,
    V4PageHeaderComponent
  ]
})
export class V4DocumentMailHistoryComponent implements OnInit, OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  tableId = DTTableId.businessToolsDocumentMailingDocument;

  headerActions: IV4HeaderAction[] = [
    {
      id: 'send',
      text: 'Send',
      style: 'primary',
      lucideIcon: 'send',
      toolTip: 'Send a Document by Mail'
    }
  ];

  isPanelOpen = signal(false);
  selectedDocumentId = signal('');
  panelRefreshTrigger = signal(0);
  selectedRowData = signal<IDocumentMailDataFilesTableRowData[]>([]);

  headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Mail',
        id: 'id_mail',
        isAddIcon: false,
        lucideIcon: 'send',
        backGroundInput: 'var(--v4-common-green-color)',
        type: 'list',
        toolTip: 'Mail Selected Documents',
        floatingBarVariant: 'filled-success'
      }
    ]
  }));

  frameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    SelectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    actionComponent: DocumentMailFilesTableActionV4Component,
    statusBadgeV4: DocumentMailStatusBadgeV4Component
  };

  configs = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 0, name: 'New' },
          { value: 1, name: 'Pending' },
          { value: 2, name: 'Printed' },
          { value: 3, name: 'Envelop Printed' },
          { value: 4, name: 'Mail Sent' },
          { value: 8, name: 'Refunded' }
        ]
      }
    ],
    selectDate: [
      {
        id: 'created_at',
        initialRange: 'All Time'
      }
    ]
  };

  ngOnInit(): void {
    this.v3DataTableService.v3RowSelectionData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.selectedRowData.set(val.map((item) => item.data));
      });

    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.configs
    );
    this.initializeV3DataTable();
  }

  private initializeV3DataTable(): void {
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
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  // ==================== COLUMN DEFINITIONS ====================

  colDefId = {
    minWidth: 50,
    width: 50,
    maxWidth: 50,
    flex: 0,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: (params: CheckboxSelectionCallbackParams) =>
      params.data?.status === 0,
    showDisabledCheckboxes: true,
    cellRenderer: () => '',
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    pinned: 'left' as const
  };

  colDefTitle: ColDef = {
    headerName: 'Document Title',
    minWidth: 220,
    flex: 2,
    field: 'document_title',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefCreatedAt: ColDef = {
    headerName: 'Created At',
    minWidth: 140,
    maxWidth: 165,
    flex: 1,
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: renderStackedDateTime
  };

  colDefStatus: ColDef = {
    headerName: 'Status',
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    flex: 0,
    pinned: 'right',
    lockPinned: true,
    lockPosition: 'right',
    suppressMovable: true,
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'statusBadgeV4'
  };

  colDefAction: ColDef = {
    headerName: 'Actions',
    minWidth: 80,
    width: 90,
    maxWidth: 100,
    flex: 0,
    pinned: 'left',
    lockPinned: true,
    lockPosition: true,
    suppressMovable: true,
    field: 'action',
    suppressHeaderMenuButton: true,
    cellRenderer: 'actionComponent',
    cellRendererParams: () => ({
      onViewClick: (data: IDocumentMailDataFilesTableRowData) => {
        this.selectedDocumentId.set(data.id ?? '');
        this.isPanelOpen.set(true);
      },
      onCommentAdded: () => this.panelRefreshTrigger.update((v) => v + 1)
    }),
    sortable: false
  };

  defaultColumnFields = [
    {
      id: 'id',
      name: 'Checkbox',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'action',
      name: 'Actions',
      isDisabled: true,
      colDef: this.colDefAction,
      isChecked: true
    },
    {
      id: 'document_title',
      name: 'Document Title',
      isDisabled: true,
      colDef: this.colDefTitle,
      isChecked: true
    },
    {
      id: 'status',
      name: 'Status',
      isDisabled: true,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'created_at',
      name: 'Created At',
      isDisabled: true,
      colDef: this.colDefCreatedAt,
      isChecked: true
    }
  ];

  onViewDocument(id: string): void {
    this.selectedDocumentId.set(id);
    this.isPanelOpen.set(true);
  }

  closePanel(): void {
    this.isPanelOpen.set(false);
  }

  headerButtonClick(event: {
    id: string;
    selectedRows: Record<string, unknown>[];
  }): void {
    if (event.id === 'id_mail') {
      this.onMail();
    }
  }

  onMail(): void {
    const rows = this.selectedRowData();
    if (!rows.length) {
      this.alertService.warningAlert({
        content: 'Please select at least one row'
      });
      return;
    }
    if (rows.length > 10) {
      this.alertService.warningAlert({
        content: 'Maximum allowed files are 10'
      });
      return;
    }
    this.dialog
      .open(V4DocumentMailModalComponent, {
        disableClose: true,
        width: '1200px',
        maxWidth: '95vw',
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: { type: 'normal', documents: rows }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.status) this.initializeV3DataTable();
      });
  }

  onSendMail(): void {
    this.dialog
      .open(DocumentSendMailWizardV4Component, {
        maxWidth: '1200px',
        width: '95vw',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        autoFocus: false
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) this.initializeV3DataTable();
      });
  }

  goBack(): void {
    this.router.navigate(['/v4/manage/business-tools/mail-dashboard/index']);
  }

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }
}
