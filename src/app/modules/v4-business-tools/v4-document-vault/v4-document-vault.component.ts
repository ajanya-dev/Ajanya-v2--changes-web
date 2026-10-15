import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  OnDestroy,
  signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ICellRendererParams,
  ColDef,
  IRowNode,
  IsRowSelectable
} from '@ag-grid-community/core';
import { MatDialog } from '@angular/material/dialog';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { LucideAngularModule, Home } from 'lucide-angular';
import {
  DataTableService,
  IDtSelectSingleIdSubject
} from 'src/app/shared/service/data-table/data-table.service';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { stackedDateTimeHtml } from 'src/app/modules/v4-data-table/utils/stacked-date-time';
import { environment } from 'src/environments/environment';
import { finalize } from 'rxjs';
import { V4AddCommentCommonModalComponent } from 'src/app/shared/modal/v4-add-comment-common-modal/v4-add-comment-common-modal.component';
import { DTTableId } from '../../data-table/data/table-id';
import { DataTableModule } from '../../data-table/data-table.module';
import { V4DataTableComponent } from '../../v4-data-table/components/v4-data-table/v4-data-table.component';
import { IV4DataTableEmptyState } from '../../v4-data-table/components/v4-data-table-empty-state/v4-data-table-empty-state.component';
import { V3DataTableService } from '../../v3-data-table/services/v3-data-table.service';
import { V3DataTableModule } from '../../v3-data-table/v3-data-table.module';
import { V4UploadFileModalComponent } from './v4-modals/v4-upload-file-modal/v4-upload-file-modal.component';
import { V4CreateFolderModalComponent } from './v4-modals/v4-create-folder-modal/v4-create-folder-modal.component';
import { V4ShareCollectModalComponent } from './v4-modals/v4-share-collect-modal/v4-share-collect-modal.component';
import { V4ShareFileModalComponent } from './v4-modals/v4-share-file-modal/v4-share-file-modal.component';
import { V4ShareFileDirectModalComponent } from './v4-modals/v4-share-file-direct-modal/v4-share-file-direct-modal.component';
import { V4EditFolderModalComponent } from './v4-modals/v4-edit-folder-modal/v4-edit-folder-modal.component';
import { V4UserPermissionModalComponent } from './v4-modals/v4-user-permission-modal/v4-user-permission-modal.component';
import { IDtFloatingFilterProp } from '../../data-table/model/datatable';
import { V4DocumentVaultActionComponent } from './v4-components/v4-document-vault-action/v4-document-vault-action.component';
import { V4DocumentVaultNameCellComponent } from './v4-components/v4-document-vault-name-cell/v4-document-vault-name-cell.component';
import { V4DocumentVaultMemoCellComponent } from './v4-components/v4-document-vault-memo-cell/v4-document-vault-memo-cell.component';
import { DocumentVaultService } from './v4-services/v4-document-vault.service';
import {
  IBreadcrumb,
  IDocumentVaultItem,
  IStorageInfo
} from './v4-models/v4-document-vault.models';

@Component({
  selector: 'app-v4-document-vault',
  standalone: true,
  imports: [
    V4DataTableComponent,
    CommonButtonV4Component,
    V4PageHeaderComponent,
    LucideAngularModule
  ],
  providers: [DataTableModule, V3DataTableModule, DatePipe],
  templateUrl: './v4-document-vault.component.html',
  styleUrls: ['./v4-document-vault.component.scss']
})
export class V4DocumentVaultComponent implements OnInit, OnDestroy {
  readonly HomeIcon = Home;
  private dialog = inject(MatDialog);
  private alert = inject(V4AlertService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private documentVaultService = inject(DocumentVaultService);
  private dextroyRef = inject(DestroyRef);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private datePipe = inject(DatePipe);

  isMaxFolderLimit = signal<boolean>(false);
  storageInfo = signal<IStorageInfo | null>(null);

  env = environment;

  // V3DataTable properties
  tableId = DTTableId.documentVault;
  frameworkComponents = {
    SearchBoxComponent: V4TextFloatingFilterComponent,
    v4ActionComponent: V4DocumentVaultActionComponent,
    v4NameCellRenderer: V4DocumentVaultNameCellComponent,
    v4MemoCellRenderer: V4DocumentVaultMemoCellComponent,
    v4TextFloatingFilter: V4TextFloatingFilterComponent,
    v4DropdownFloatingFilter: V4DropdownFloatingFilterComponent,
    v4DateFloatingFilter: V4DateFloatingFilterComponent
  };

  isRowSelectable: IsRowSelectable = (_: IRowNode) => false;

  // Folder navigation and breadcrumbs
  currentFolderId: string = '';
  breadcrumbs: IBreadcrumb[] = [];

  // Keep only pagination size for ag-grid
  itemsPerPage = 50;
  isLoading = signal<boolean>(false);

  floatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'type',
        values: [
          { value: 'folder', name: 'Folder' },
          { value: 'file', name: 'File' }
        ]
      }
    ]
  };

  // Column Definitions
  //
  // Widths are explicit because the grid runs with [freeColumnResize]="false":
  // fixed columns hold themselves with flex: 0 + width, and Name / Memo carry the
  // flex weight, so the columns always fill the container instead of leaving a
  // gap on the right. Every minWidth fits the full header text plus the sort
  // indicator, so no header truncates.

  /** Row ⋮ column. A View column is pinned left, ahead of the data columns. */
  colDefView: ColDef = {
    headerName: 'Actions',
    field: 'action',
    width: 70,
    minWidth: 70,
    maxWidth: 70,
    flex: 0,
    pinned: 'left',
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    resizable: false,
    sortable: false,
    floatingFilter: false,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4ActionComponent',
    cellRendererParams: () => ({
      folderId: this.currentFolderId,
      onItemDeleted: () => this.getBreadcrumbs()
    })
  };

  colDefName: ColDef = {
    headerName: 'Name',
    minWidth: 220,
    flex: 3,
    field: 'name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4TextFloatingFilter',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4NameCellRenderer'
  };

  colDefSerialNumber: ColDef = {
    headerName: 'File Serial Number',
    minWidth: 165,
    width: 175,
    flex: 0,
    field: 'serial_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4TextFloatingFilter',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams<IDocumentVaultItem>) =>
      params.data?.type === 'file' ? (params.data?.serial_number ?? '') : ''
  };

  colDefMemo: ColDef = {
    headerName: 'Memo',
    minWidth: 200,
    flex: 2,
    field: 'memo_note',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4TextFloatingFilter',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4MemoCellRenderer'
  };

  colDefType: ColDef = {
    headerName: 'Type',
    minWidth: 100,
    width: 110,
    flex: 0,
    field: 'type',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'v4DropdownFloatingFilter',
    floatingFilterComponentParams: { placeholder: 'All' },
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params) =>
      params.data?.type === 'folder' ? 'Folder' : 'File'
  };

  colDefSize: ColDef = {
    headerName: 'Size',
    minWidth: 100,
    width: 110,
    flex: 0,
    field: 'file_size',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4TextFloatingFilter',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams<IDocumentVaultItem>) =>
      params.data?.file_size_formatted ?? '0 MB'
  };

  colDefUpdated: ColDef = {
    headerName: 'Last Updated',
    minWidth: 140,
    width: 150,
    maxWidth: 165,
    flex: 0,
    field: 'updated_at',
    cellClass: 'flex flex-col justify-center',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'v4DateFloatingFilter',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams<IDocumentVaultItem>) =>
      stackedDateTimeHtml(
        this.datePipe.transform(params.data?.updated_at, 'MM/dd/yyyy') ?? '',
        this.datePipe.transform(params.data?.updated_at, 'hh:mm a') ?? ''
      )
  };

  defaultColumnFields = [
    {
      id: 'action',
      name: 'Actions',
      isDisabled: true,
      colDef: this.colDefView,
      isChecked: true
    },
    {
      id: 'name',
      name: 'Name',
      isDisabled: true,
      colDef: this.colDefName,
      isChecked: true
    },
    {
      id: 'serial_number',
      name: 'File Serial Number',
      isDisabled: true,
      colDef: this.colDefSerialNumber,
      isChecked: true
    },
    {
      id: 'memo_note',
      name: 'Memo',
      isDisabled: true,
      colDef: this.colDefMemo,
      isChecked: true
    },
    {
      id: 'type',
      name: 'Type',
      isDisabled: true,
      colDef: this.colDefType,
      isChecked: true
    },
    {
      id: 'file_size',
      name: 'Size',
      isDisabled: true,
      colDef: this.colDefSize,
      isChecked: true
    },
    {
      id: 'updated_at',
      name: 'Last Updated',
      isDisabled: true,
      colDef: this.colDefUpdated,
      isChecked: true
    }
  ];

  columnDefs = [
    this.colDefView,
    this.colDefName,
    this.colDefSerialNumber,
    this.colDefMemo,
    this.colDefType,
    this.colDefSize,
    this.colDefUpdated
  ];

  ngOnInit(): void {
    // Subscribe to route parameter changes to detect folder navigation
    this.route.params
      .pipe(takeUntilDestroyed(this.dextroyRef))
      .subscribe((params) => {
        this.currentFolderId = params.folderId || '';
        // Update payload for folder context
        this.updatePayloadForFolder();
        this.getBreadcrumbs();
        this.refreshGrid();
      });

    // Initialize DataTable - Pass column fields and filters
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.floatingFilterComponent
    );
    this.initializeV3DataTable();
  }

  initializeV3DataTable() {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: this.itemsPerPage,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: [],
      ...(this.currentFolderId && { folder_id: this.currentFolderId })
    };
  }

  // Update payload when folder changes
  updatePayloadForFolder(): void {
    this.v3DataTableService.defaultPayload = {
      ...this.v3DataTableService.defaultPayload,
      ...(this.currentFolderId && { folder_id: this.currentFolderId })
    };
  }

  /**
   * Empty-state copy for the vault grid. At the root the first useful action is
   * creating a folder; inside a folder it is uploading a file.
   */
  get emptyStateConfig(): IV4DataTableEmptyState {
    return this.currentFolderId
      ? {
          icon: 'file-text',
          title: 'This folder is empty',
          description:
            'Upload a document to keep it stored securely and share it from here',
          buttonText: 'Upload File',
          buttonIcon: 'upload'
        }
      : {
          icon: 'folder-lock',
          title: 'No documents yet',
          description:
            'Create a folder to start storing and sharing your documents securely',
          buttonText: 'New Folder',
          buttonIcon: 'folder-plus'
        };
  }

  onEmptyStateAction(): void {
    if (this.currentFolderId) {
      this.onUploadFile();
    } else {
      this.onNewFolder();
    }
  }

  // Refresh grid data
  refreshGrid(): void {
    this.v3DataTableService.refreshV3DataTable();
  }

  headerButtonClick(event: { id: string }): void {
    if (event.id === 'new-folder') {
      this.onNewFolder();
    } else if (event.id === 'upload-file') {
      this.onUploadFile();
    } else if (event.id === 'share-collect') {
      this.onShareCollect();
    } else if (event.id === 'request-files') {
      this.onRequestFiles();
    }
  }

  getBreadcrumbs(): void {
    this.isLoading.set(true);
    this.documentVaultService
      .getDocuments({ folder_id: this.currentFolderId })
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
        takeUntilDestroyed(this.dextroyRef)
      )
      .subscribe((response) => {
        if (response.success) {
          this.isMaxFolderLimit.set(
            response.breadcrumbs.length >= response.storage.max_folder_depth
          );
          this.storageInfo.set(response.storage);
          this.loadBreadcrumbs(response.breadcrumbs);
        }
      });
  }

  /**
   * Load breadcrumbs for current folder
   */
  loadBreadcrumbs(value: IBreadcrumb[]): void {
    if (value.length) {
      if (value.length) {
        this.breadcrumbs = [
          { id: 0, name: 'Document Storage' },
          ...value.map((folder) => ({
            id: folder.id,
            name: folder.name
          }))
        ];
      }
    } else {
      this.breadcrumbs = [{ id: 0, name: 'Document Storage' }];
    }
  }

  /**
   * Navigate to a specific breadcrumb location
   */
  goBack(): void {
    this.router.navigate(['/v4/manage/v4-business-tools/more']);
  }

  navigateToBreadcrumb(folderId: string): void {
    if (folderId) {
      this.router.navigate([
        '/v4/manage/v4-business-tools/document-storage/folder',
        folderId
      ]);
    } else {
      this.router.navigate(['/v4/manage/v4-business-tools/document-storage']);
    }
  }

  onNewFolder(): void {
    const dialogRef = this.dialog.open(V4CreateFolderModalComponent, {
      width: '450px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: { currentFolderId: this.currentFolderId }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.dextroyRef))
      .subscribe((result) => {
        if (result && result.success) {
          this.alert.successAlert({
            content: result.message,
            doneMsg: 'OK',
            isOk: true,
            isCancel: false
          });
          this.refreshGrid();
        }
      });
  }

  onUploadFile(): void {
    const dialogRef = this.dialog.open(V4UploadFileModalComponent, {
      width: '550px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: { currentFolderId: this.currentFolderId }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.dextroyRef))
      .subscribe((result) => {
        if (result && result.success) {
          this.alert.successAlert({
            content: result.message,
            doneMsg: 'OK',
            isOk: true,
            isCancel: false
          });
          this.refreshGrid();
          this.getBreadcrumbs();
        }
      });
  }

  onShareCollect(): void {
    const dialogRef = this.dialog.open(V4ShareCollectModalComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: { currentFolderId: this.currentFolderId }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.dextroyRef))
      .subscribe((result) => {
        if (result && result.success) {
          this.refreshGrid();
        }
      });
  }

  onRequestFiles(): void {
    this.dialog.open(V4ShareFileModalComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: {
        folderId: this.currentFolderId,
        type: this.currentFolderId ? 'folder' : 'folder'
      }
    });
  }

  onActionClick(event: IDtSelectSingleIdSubject): void {
    const item = event.selectedRow as Record<string, string>;
    if (!item) return;

    switch (event.id) {
      case 'edit':
        this.dialog
          .open(V4EditFolderModalComponent, {
            width: '450px',
            disableClose: true,
            autoFocus: false,
            panelClass: 'paddingless-modal-rounded',
            data: {
              id: item.encrypted_id,
              currentName: item.name,
              type: item.type,
              serial_number: item.serial_number
            }
          })
          .afterClosed()
          .pipe(takeUntilDestroyed(this.dextroyRef))
          .subscribe((result) => {
            if (result?.success) {
              this.alert.successAlert({
                content: result.message || 'Renamed successfully',
                title: 'Success'
              });
              this.refreshGrid();
            }
          });
        break;

      case 'share':
        this.openShareModal(item);
        break;

      case 'download':
        if (item.type !== 'file') return;
        this.documentVaultService
          .downloadDocument(item.encrypted_id.toString())
          .pipe(takeUntilDestroyed(this.dextroyRef))
          .subscribe({
            next: (res) => {
              if (res.success && res.url) {
                window.open(res.url, '_blank');
              }
            },
            error: (err) => {
              if (err.status === 403) {
                this.alert.failedAlert({
                  content: err.error.errorMsg || 'Access denied'
                });
              }
            }
          });
        break;

      case 'add-comment':
        this.dialog.open(V4AddCommentCommonModalComponent, {
          maxWidth: '700px',
          width: '93%',
          disableClose: true,
          autoFocus: false,
          panelClass: 'paddingless-modal-rounded',
          data: {
            id: item.encrypted_id,
            type: 'document-vault',
            count: 0,
            existingData: [],
            enableDelete: true
          }
        });
        break;

      case 'user-permission':
        this.dialog.open(V4UserPermissionModalComponent, {
          width: '1070px',
          height: '700px',
          disableClose: true,
          autoFocus: false,
          panelClass: 'paddingless-modal-rounded',
          data: { folderId: item.encrypted_id }
        });
        break;

      case 'delete':
        this.deleteVaultItem(item);
        break;

      default:
        break;
    }
  }

  private openShareModal(item: Record<string, string>): void {
    const isFile = item.type === 'file';
    const dialogData = isFile
      ? { fileId: item.encrypted_id, type: 'file' as const }
      : { folderId: item.encrypted_id, type: 'folder' as const };

    this.dialog
      .open(V4ShareFileDirectModalComponent, {
        width: '490px',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: dialogData
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.dextroyRef))
      .subscribe((result) => {
        if (result?.success) {
          this.alert.successAlert({
            content:
              result.message ||
              `${isFile ? 'File' : 'Folder'} shared successfully`,
            title: 'Success'
          });
        }
      });
  }

  private deleteVaultItem(item: Record<string, string>): void {
    const confirmed = this.alert.confirmAlert({
      content: `Are you sure you want to delete "${item.name}"?`,
      doneMsg: 'Delete',
      cancelMsg: 'Cancel',
      isOk: true,
      isCancel: true
    });
    confirmed
      .afterClosed()
      .pipe(takeUntilDestroyed(this.dextroyRef))
      .subscribe((result) => {
        if (!result) return;
        this.documentVaultService
          .deleteItem(item.encrypted_id.toString())
          .pipe(takeUntilDestroyed(this.dextroyRef))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.alert.successAlert({
                  content: 'Item deleted successfully',
                  title: 'Success'
                });
                this.refreshGrid();
                this.getBreadcrumbs();
              }
            }
          });
      });
  }

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }
}
