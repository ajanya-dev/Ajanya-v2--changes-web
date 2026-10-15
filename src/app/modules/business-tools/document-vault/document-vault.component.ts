import { Component, DestroyRef, inject, OnInit, OnDestroy, computed, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';  
import { ActivatedRoute, Router } from '@angular/router';
import { ICellRendererParams, ColDef, IRowNode, IsRowSelectable } from '@ag-grid-community/core';
import { MatDialog } from '@angular/material/dialog';
import { 
  faFolderPlus,
  faArrowUpFromLine,
} from '@fortawesome/pro-solid-svg-icons';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { environment } from 'src/environments/environment';
import { finalize } from 'rxjs';
import { DTTableId } from '../../data-table/data/table-id';
import { DtSearchBoxComponent } from '../../data-table/components/dt-search-box/dt-search-box.component';
import { DataTableModule } from '../../data-table/data-table.module';
import { V3DataTableComponent } from '../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3DataTableService } from '../../v3-data-table/services/v3-data-table.service';
import { V3DataTableModule } from '../../v3-data-table/v3-data-table.module';
import { IV3CommonButton, IV3DtHeaderElements } from '../../v3-data-table/models/v3-data-table';
import { UploadFileModalComponent } from './modals/upload-file-modal/upload-file-modal.component';
import { CreateFolderModalComponent } from './modals/create-folder-modal/create-folder-modal.component';
import { ShareCollectModalComponent } from './modals/share-collect-modal/share-collect-modal.component';
import { DocumentVaultActionComponent } from './components/document-vault-action/document-vault-action.component';
import { DocumentVaultNameCellComponent } from './components/document-vault-name-cell/document-vault-name-cell.component';
import { DocumentVaultMemoCellComponent } from './components/document-vault-memo-cell/document-vault-memo-cell.component';
import { DocumentVaultService } from './services/document-vault.service';
import { IBreadcrumb, IDocumentVaultItem, IStorageInfo } from './models/document-vault.models';
import { IDtFloatingFilterProp } from '../../data-table/model/datatable';

@Component({
  selector: 'app-document-vault',
  standalone: true,
  imports: [
    NgClass,
    V3DataTableComponent,
    DemoVideoComponent
  ],
  providers: [DataTableModule,V3DataTableModule,DatePipe],
  templateUrl: './document-vault.component.html',
  styleUrls: ['./document-vault.component.scss']
})
export class DocumentVaultComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);
  private alert = inject(AlertService);
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
  frameWorkComponents = {
    SearchBoxComponent: DtSearchBoxComponent,
    actionComponent: DocumentVaultActionComponent,
    nameCellRenderer: DocumentVaultNameCellComponent,
    memoCellRenderer: DocumentVaultMemoCellComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    v3DtCommonFilterComponent: V3DTCommonFilterComponent
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

  headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      ...(this.isMaxFolderLimit() ? [] : [{
        text: 'New Folder',
        id: 'new-folder',
        icon: faFolderPlus,
        isAddIcon: true,
        type: { style: 'filled-blue', name: 'action' },
        toolTip: 'Create new folder',
        backGroundInput: 'var(--common-blue-color)',
      } as IV3CommonButton]),
      ...(this.currentFolderId ? [{
        text: 'Upload File',
        id: 'upload-file',
        icon: faArrowUpFromLine,
        isAddIcon: true,
        type: { style: 'filled-green', name: 'action' },
        toolTip: 'Upload file',
        backGroundInput: 'var(--common-green-color)',
      } as IV3CommonButton] : []),
      {
        text: 'Request Files',
        id: 'share-collect',
        icon: ['fas', 'share-nodes'],
        isAddIcon: true,
        type: { style: 'filled-blue', name: 'action' },
        toolTip: 'Create shareable upload link',
        backGroundInput: 'var(--common-blue-color)',
      } as IV3CommonButton,
      ...([{
        text: 'Share ',
        id: 'request-files',
        icon: ['fas', 'share-nodes'],
        isAddIcon: true,
        type: { style: 'filled-blue', name: 'action' },
        toolTip: 'Create shareable upload link',
        backGroundInput: 'var(--common-blue-color)',
      } as IV3CommonButton] ),
    ]
  }));

  // Column Definitions
  colDefName = {
    headerName: 'Name',
    minWidth: 200,
    field: 'name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'nameCellRenderer'
  };

  colDefSerialNumber: ColDef = {
    headerName: 'File Serial Number',
    minWidth: 150,
    field: 'serial_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams<IDocumentVaultItem>) =>
      params.data?.type === 'file' ? (params.data?.serial_number ?? '-') : '-'
  };

  colDefType: ColDef = {
    headerName: 'Type',
    minWidth: 80,
    field: 'type',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params) => params.data?.type === 'folder' ? 'Folder' : 'File'
  };

  colDefSize = {
    headerName: 'Size',
    minWidth: 80,
    field: 'file_size',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams<IDocumentVaultItem>) => params.data?.file_size_formatted ?? '0 MB'
  };

  colDefUpdated = {
    headerName: 'Last Updated',
    minWidth: 150,
    field: 'updated_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams<IDocumentVaultItem>) => 
      this.datePipe.transform(params.data?.updated_at, 'MM/dd/yyyy, hh:mm a')
  };

  colDefMemo: ColDef = {
    headerName: 'Memo',
    minWidth: 200,
    field: 'memo_note',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'memoCellRenderer'
  };

  colDefAction: ColDef = {
    headerName: 'Actions',
    maxWidth: 150,
    field: 'action',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'actionComponent',
    cellRendererParams: () => ({
      folderId: this.currentFolderId,
      onItemDeleted: () => this.getBreadcrumbs()
    }),
    sortable: false
  };

  defaultColumnFields = [
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
    },
    {
      id: 'action',
      name: 'Actions',
      isDisabled: true,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  columnDefs = [
    this.colDefName,
    this.colDefSerialNumber,
    this.colDefMemo,
    this.colDefType,
    this.colDefSize,
    this.colDefUpdated,
    this.colDefAction
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
      
    // Initialize V3DataTable - Pass floatingFilterComponent to DataTableService
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

  // Refresh grid data
  refreshGrid(): void {
    this.v3DataTableService.refreshV3DataTable();
  }

  headerButtonClick(event: {id:string}): void {
    if (event.id === 'new-folder') {
      this.onNewFolder();
    } else if (event.id === 'upload-file') {
      this.onUploadFile();
    } else if (event.id === 'share-collect') {
      this.onShareCollect();
    }else if (event.id === 'request-files') {
      this.onRequestFiles();
    }
  }

  getBreadcrumbs(): void {
    this.isLoading.set(true);
    this.documentVaultService.getDocuments({ folder_id: this.currentFolderId })
      .pipe( finalize(() => {
        this.isLoading.set(false);
      }), takeUntilDestroyed(this.dextroyRef))
      .subscribe((response) => {
        if (response.success) {
          this.isMaxFolderLimit.set(response.breadcrumbs.length >= response.storage.max_folder_depth);
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
          { id: 0, name: 'Document Vault' },
          ...value.map((folder) => ({
            id: folder.id,
            name: folder.name
          }))
        ];
      }
    } else {
      this.breadcrumbs = [{ id: 0, name: 'Document Vault' }];
    }
  }

  /**
   * Navigate to a specific breadcrumb location
   */
  navigateToBreadcrumb(folderId: string): void {
    if (folderId) {
      this.router.navigate([
        '/manage/business-tools/document-vault/folder',
        folderId
      ]);
    } else {
      this.router.navigate(['/manage/business-tools/document-vault']);
    }
  }

  onNewFolder(): void {
    const dialogRef = this.dialog.open(CreateFolderModalComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'custom-modal-panel',
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
    const dialogRef = this.dialog.open(UploadFileModalComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'custom-modal-panel',
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
    const dialogRef = this.dialog.open(ShareCollectModalComponent, {
      width: '600px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'custom-modal-panel',
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
    this.dialog.open(ShareCollectModalComponent, {
      width: '600px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'custom-modal-panel',
      data: { currentFolderId: this.currentFolderId, mode: 'download' }
    });
  }

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }
}