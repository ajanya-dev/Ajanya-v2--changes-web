import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { CheckboxSelectionCallbackParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';
import { renderStackedDateTime } from 'src/app/modules/v4-data-table/utils/stacked-date-time';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonTabV4Component } from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import {
  IDocumentMailDataTableRowData,
  IDocumentMailDataFilesTableRowData
} from '../../../models/document-mail.model';
import { DocumentMailService } from '../../../services/document-mail.service';
import { V4DocumentMailModalComponent } from '../../../components/v4-document-mail-modal/v4-document-mail-modal.component';
import { DocumentMailFilesTableActionV4Component } from '../../components/document-mail-files-table-action-v4/document-mail-files-table-action-v4.component';
import { DocumentMailTableActionV4Component } from '../../components/document-mail-table-action-v4/document-mail-table-action-v4.component';
import { DocumentMailStatusBadgeV4Component } from '../../components/document-mail-status-badge-v4/document-mail-status-badge-v4.component';
import { UploadDocumentModalV4Component } from '../../modals/upload-document-modal-v4/upload-document-modal-v4.component';
import { DocumentSendMailWizardV4Component } from '../../modals/document-send-mail-wizard-v4/document-send-mail-wizard-v4.component';
import { DocumentMailDetailPanelV4Component } from '../../components/document-mail-detail-panel-v4/document-mail-detail-panel-v4.component';

@Component({
  selector: 'app-document-mail-list-v4',
  standalone: true,
  imports: [
    CurrencyPipe,
    LucideAngularModule,
    V4DataTableComponent,
    CommonTabV4Component,
    V4PageHeaderComponent,
    DocumentMailDetailPanelV4Component
  ],
  templateUrl: './document-mail-list-v4.component.html',
  styleUrl: './document-mail-list-v4.component.scss'
})
export class DocumentMailListV4Component implements OnInit {
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private documentMailService = inject(DocumentMailService);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private destroyRef = inject(DestroyRef);
  private headerService = inject(HeaderService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  selectedTab = signal<string>('files');

  readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'upload',
      text: 'Upload Files',
      toolTip: 'Add a document from your computer to mail it out.',
      style: 'navy',
      lucideIcon: 'plus'
    },
    {
      id: 'bulk_mail',
      text: 'Bulk Mail',
      toolTip: 'Send several documents to different addresses in one batch.',
      style: 'navy',
      lucideIcon: 'mails'
    },
    {
      id: 'send',
      text: 'Send',
      toolTip: 'Send',
      style: 'primary',
      lucideIcon: 'send'
    }
  ];

  onHeaderAction(id: string | number): void {
    if (id === 'upload') this.onUpload();
    if (id === 'bulk_mail') this.onMail('bulk');
    if (id === 'send') this.onSendMail();
  }

  // Summary cards — populated from GET /document-mailing/doc/statistics
  summaryCounts = signal<{
    total: number;
    new: number;
    mailed: number;
    shippingCost: number;
  }>({ total: 0, new: 0, mailed: 0, shippingCost: 0 });

  tabItems = [
    { label: 'Files', value: 'files' },
    { label: 'Mailed', value: 'mail' }
  ];

  deleteLoading = signal(false);
  selectedRowData = signal<IDocumentMailDataTableRowData[]>([]);

  // ── Detail Panel ───────────────────────────────────────────────────
  isPanelOpen = signal(false);
  selectedDocumentId = signal('');
  /** Bumped when the same document is re-opened, so the panel re-fetches what changed while it was closed (e.g. comments). */
  panelRefresh = signal(0);

  // ── Files Table Config ─────────────────────────────────────────────
  filesTableId = DTTableId.businessToolsDocumentMailingDocument;

  filesFrameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    DropdownFilterComponent: V4DropdownFloatingFilterComponent,
    DateFilterComponent: V4DateFloatingFilterComponent,
    statusBadgeV4: DocumentMailStatusBadgeV4Component,
    filesActionV4: DocumentMailFilesTableActionV4Component
  };

  filesFloatingFilterComponent = {
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
    ]
  };

  filesHeaderElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Mail',
        id: 'id_mail',
        isAddIcon: false,
        icon: ['fas', 'envelope'],
        lucideIcon: 'send',
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: 'Mail Selected Documents',
        floatingBarVariant: 'filled-success'
      },
      {
        text: 'Delete',
        id: 'multipleDelete',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        lucideIcon: 'trash-2',
        backGroundInput: 'var(--v4-common-red-color)',
        type: 'list',
        loading: this.deleteLoading(),
        toolTip: 'Delete Selected Documents',
        floatingBarVariant: 'filled-danger'
      }
    ]
  }));

  filesColDefId = {
    maxWidth: 50,
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

  filesColDefTitle = {
    headerName: 'Document Title',
    field: 'document_title',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    flex: 1,
    minWidth: 150
  };

  filesColDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'DropdownFilterComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'statusBadgeV4',
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    pinned: 'right' as const,
    lockPinned: true,
    lockPosition: 'right' as const,
    suppressMovable: true
  };

  filesColDefCreatedAt = {
    headerName: 'Created At',
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'DateFilterComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    flex: 1,
    minWidth: 130,
    cellRenderer: renderStackedDateTime
  };

  filesColDefAction = {
    headerName: 'Actions',
    sortable: false,
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 90,
    maxWidth: 100,
    pinned: 'left' as const,
    lockPinned: true,
    lockPosition: true,
    suppressMovable: true,
    cellRenderer: 'filesActionV4',
    cellRendererParams: () => ({
      onViewClick: (row: IDocumentMailDataFilesTableRowData) =>
        this.onViewDocument(row.id)
    }),
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  filesColumnFields = [
    {
      id: 'id',
      name: 'Checkbox',
      colDef: this.filesColDefId,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_action',
      name: 'Actions',
      colDef: this.filesColDefAction,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_document_title',
      name: 'Document Title',
      colDef: this.filesColDefTitle,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_status',
      name: 'Status',
      colDef: this.filesColDefStatus,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_created_at',
      name: 'Created At',
      colDef: this.filesColDefCreatedAt,
      isChecked: true,
      isDisabled: true
    }
  ];

  // ── Mailed Table Config ────────────────────────────────────────────
  mailedTableId = DTTableId.businessToolsDocumentMailing;

  shippingTypes = [
    { name: 'First Class 1.25', value: 1 },
    { name: 'First Class with Tracking 6.99', value: 3 },
    { name: 'Priority Mail USPS 11.99', value: 4 },
    { name: 'Express Mail USPS 34.99', value: 5 },
    { name: 'First Class Canada 2.99', value: 14 },
    { name: 'First Class With Tracking (international) 4.99', value: 17 }
  ];

  mailedFrameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    DropdownFilterComponent: V4DropdownFloatingFilterComponent,
    statusBadgeV4: DocumentMailStatusBadgeV4Component,
    mailedActionV4: DocumentMailTableActionV4Component
  };

  mailedFloatingFilterComponent = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 0, name: 'New' },
          { value: 1, name: 'Pending' },
          { value: 2, name: 'Printed' },
          { value: 3, name: 'Envelop Printed' },
          { value: 4, name: 'Completed' },
          { value: 8, name: 'Refunded' }
        ]
      },
      {
        id: 'mail_type',
        values: this.shippingTypes
      }
    ]
  };

  mailedHeaderElements = computed<IV3DtHeaderElements>(() => ({
    buttons: []
  }));

  mailedColDefTitle = {
    headerName: 'Document Title',
    field: 'document_title',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    flex: 1,
    minWidth: 150
  };

  mailedColDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'DropdownFilterComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'statusBadgeV4',
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    pinned: 'right' as const,
    lockPinned: true,
    lockPosition: 'right' as const,
    suppressMovable: true
  };

  mailedColDefPayee = {
    headerName: 'To',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    flex: 1,
    minWidth: 120
  };

  mailedColDefMailType = {
    headerName: 'Mail Type',
    field: 'mail_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'DropdownFilterComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: { value: number }) =>
      this.shippingTypes.find((val) => val.value === params.value)?.name ||
      params.value,
    flex: 1,
    minWidth: 150
  };

  mailedColDefAction = {
    headerName: 'Actions',
    sortable: false,
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 90,
    maxWidth: 100,
    pinned: 'left' as const,
    lockPinned: true,
    lockPosition: true,
    suppressMovable: true,
    cellRenderer: 'mailedActionV4',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  mailedColumnFields = [
    {
      id: 'id_action',
      name: 'Actions',
      colDef: this.mailedColDefAction,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_document_title',
      name: 'Document Title',
      colDef: this.mailedColDefTitle,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_status',
      name: 'Status',
      colDef: this.mailedColDefStatus,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_payee',
      name: 'To',
      colDef: this.mailedColDefPayee,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_mail_type',
      name: 'Mail Type',
      colDef: this.mailedColDefMailType,
      isChecked: true,
      isDisabled: true
    }
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────

  ngOnInit(): void {
    if (window.history.state.source === 'Mailing Dashboard') {
      this.headerService.isSubHeaderVisible.next({
        hidden: false,
        animation: false
      });
    }

    this.v3DataTableService.v3RowSelectionData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.selectedRowData.set(val.map((item) => item.data));
      });

    this.initFilesTable();
    this.loadSummary();
  }

  private loadSummary(): void {
    this.documentMailService
      .getMailingSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (!res?.success || !res.data) return;
        this.summaryCounts.set({
          total: res.data.total_documents ?? 0,
          new: res.data.new_documents ?? 0,
          mailed: res.data.mailed_documents ?? 0,
          shippingCost: Number(res.data.total_shipping_cost ?? 0)
        });
      });
  }

  /**
   * Points the shared table services at the Files table.
   *
   * Deliberately does not refresh: the grid this configures is always created
   * *after* this call (first render, or the tab swap below), and it loads itself
   * on grid-ready. Refreshing here would only hit the grid on its way out.
   */
  private initFilesTable(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      this.filesColumnFields,
      this.filesFloatingFilterComponent,
      undefined,
      undefined,
      this.filesTableId
    );
  }

  /** Mailed-table counterpart of {@link initFilesTable} - same no-refresh rule. */
  private initMailedTable(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      this.mailedColumnFields,
      this.mailedFloatingFilterComponent,
      undefined,
      undefined,
      this.mailedTableId
    );
  }

  // ── Tab Switching ──────────────────────────────────────────────────

  onTabChange(tab: string): void {
    if (this.selectedTab() === tab) return;
    this.removeRowSelectionData();
    // Configure the services before the signal swaps the template, so the
    // incoming grid reads the right tableId and payload on grid-ready.
    if (tab === 'files') {
      this.initFilesTable();
    } else {
      this.initMailedTable();
    }
    this.selectedTab.set(tab);
    this.loadSummary();
  }

  // ── Table Helpers ──────────────────────────────────────────────────

  refreshDataTable(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
    this.loadSummary();
  }

  private removeRowSelectionData(): void {
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
    this.selectedRowData.set([]);
  }

  // ── Header Button Events ──────────────────────────────────────────

  headerButtonClick(event: {
    id: string;
    selectedRows: Record<string, unknown>[];
  }): void {
    switch (event.id) {
      case 'id_send':
        this.onSendMail();
        break;
      case 'id_upload':
        this.onUpload();
        break;
      case 'id_mail':
        this.onMail('normal');
        break;
      case 'id_bulk_mail':
        this.onMail('bulk');
        break;
      case 'multipleDelete':
        this.bulkDelete(
          event.selectedRows as unknown as IDocumentMailDataTableRowData[]
        );
        break;
      default:
        break;
    }
  }

  // ── Actions ────────────────────────────────────────────────────────

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
        if (res?.success) this.refreshDataTable();
      });
  }

  onUpload(): void {
    this.dialog
      .open(UploadDocumentModalV4Component, {
        width: '750px',
        maxWidth: '95%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        autoFocus: false
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) this.refreshDataTable();
      });
  }

  onMail(type: 'bulk' | 'normal'): void {
    const rows = this.selectedRowData();

    if (!rows.length && type === 'normal') {
      this.alertService.warningAlert({
        content: 'Please select at least one row'
      });
      return;
    }

    if (rows.length > 10 && type === 'normal') {
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
        data: {
          type,
          documents: rows
        }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.status) this.refreshDataTable();
      });
  }

  bulkDelete(selectedRows: IDocumentMailDataTableRowData[]): void {
    const rows = selectedRows?.length ? selectedRows : this.selectedRowData();
    if (!rows?.length) {
      this.alertService.warningAlert({
        content: 'Please select files to delete'
      });
      return;
    }

    const confirmRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete these files?'
    });

    confirmRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          const mailIds: string[] = [];
          let showError = false;

          rows.forEach((row: IDocumentMailDataTableRowData) => {
            if (row.status !== 0) {
              showError = true;
            } else {
              mailIds.push(row.id);
            }
          });

          if (showError) {
            this.alertService.warningAlert({
              content:
                rows.length === 1
                  ? "Selected file can't be deleted."
                  : "Some of the files can't be deleted."
            });
            this.removeRowSelectionData();
            return;
          }

          if (mailIds.length) {
            this.deleteLoading.set(true);
            this.documentMailService
              .deleteMultipleDocuments(mailIds)
              .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.deleteLoading.set(false))
              )
              .subscribe((res) => {
                if (res.success) {
                  this.alertService.successAlert({
                    title: 'Success',
                    content: 'Files deleted successfully',
                    timeout: 2000,
                    close: true
                  });
                  this.refreshDataTable();
                }
              });
          }

          this.removeRowSelectionData();
        }
      });
  }

  get isFromMailDashboard(): boolean {
    return this.route.snapshot.queryParamMap.get('from') === 'mail-dashboard';
  }

  goBack(): void {
    this.router.navigate(['/v4/manage/business-tools/mail-dashboard/index']);
  }

  // ── Detail Panel ───────────────────────────────────────────────────

  onViewDocument(id: string): void {
    if (this.selectedDocumentId() === id) this.panelRefresh.update((v) => v + 1);
    this.selectedDocumentId.set(id);
    this.isPanelOpen.set(true);
  }

  closePanelAndReset(): void {
    this.isPanelOpen.set(false);
  }
}
