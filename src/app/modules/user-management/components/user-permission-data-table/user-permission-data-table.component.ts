/* eslint-disable @typescript-eslint/no-explicit-any */
import { finalize, debounceTime } from 'rxjs/operators';
import {
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
  Component,
  Input,
  input,
  signal,
  computed,
} from '@angular/core';
import {
  ICoulmnDefFields,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import { Subscription } from 'rxjs';
import {
  ColDef,
  Column,
  ColumnState,
  DomLayoutType,
  GetContextMenuItemsParams,
  GridApi,
  GridReadyEvent,
  IServerSideGetRowsParams,
  IsRowSelectable,
  MenuItemDef,
  PaginationChangedEvent,
  RowModelType,
  RowNode,
  RowSelectedEvent,
  GridOptions,
  RowClickedEvent
} from '@ag-grid-community/core';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { FormsModule } from '@angular/forms';
import { NgClass, NgStyle } from '@angular/common';
import { IReceivedTypes } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AgGridAngular } from '@ag-grid-community/angular';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableCacheService } from 'src/app/shared/service/indexedDb/data-table-cache.service';
import { UserManagementService } from 'src/app/shared/service/user/user-management.service';
import { IAccountsPermission } from 'src/app/models/user';
import {
  faAngleLeft,
  faAngleRight,
  faArrowsRotate,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { toObservable } from '@angular/core/rxjs-interop';
import { ICoulmnDefFieldsResponse } from '../../../../models/v3-datatable';
import { UserManagementV35Service } from '../../service/user-management-v35.service';

export interface ColStateType extends ColumnState {
  name?: string;
  cellRenderer?: (event?: {
    data: unknown;
    value: string;
    getData: boolean;
  }) => void;
}

export class CustomLoadingCellRenderer {
  eGui = document.createElement('div');
  init() {
    this.eGui.innerHTML = `
      <div class="ag-custom-loading-cell" style="padding-left: 10px; line-height: 25px;">
        <i class="fas fa-spinner fa-pulse"></i> <span>Loading..</span>
      </div>
    `;
  }

  getGui() {
    return this.eGui;
  }
}

export class NoRowsCellRenderer {
  eGui = document.createElement('div');
  init() {
    this.eGui.innerHTML = `
      <div class="ag-custom-loading-cell" style="padding-left: 10px; line-height: 25px;">
        <span>Sorry! No results found</span>
      </div>
    `;
  }

  getGui() {
    return this.eGui;
  }
}

@Component({
  selector: 'app-user-permission-data-table',
  templateUrl: './user-permission-data-table.component.html',
  styleUrls: ['./user-permission-data-table.component.scss'],
  standalone: true,
  imports: [NgClass, NgStyle, FaIconComponent, FormsModule, AgGridAngular]
})
export class UserPermissionDataTableComponent implements OnInit, OnDestroy {
  /* Injectors */
  public v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private dataTableCacheService = inject(DataTableCacheService);
  private userManagementV35Service = inject(UserManagementV35Service);
  private userService = inject(UserManagementService);

  /* Variables */
  isPaymentTableHavePermission = true;

  @Input() public columnDefs: ICoulmnDefFields[];
  /**
   * @description To select or deselect columns and also to control behavior of columns.
   * Make changes only if necessary. Try and use `this.filteredColumnFields` for mutating operations.
   */
  @Input() public defaultColumnFields: IDtColumnFields[];
  @Input() public frameworkComponents = {};
  @Input() public tableId: number;
  @Input() public domLayout: DomLayoutType = 'autoHeight';
  @Input() public rowHeight = 35;
  @Input() public isRowSelectable: IsRowSelectable;
  @Input() public paginationPageSize = 50;
  @Input() public rowSelection: 'single' | 'multiple' = 'multiple';
  @Input() public rowMultiSelectWithClick: boolean = true;
  @Input() public pinColumn: string | undefined;
  @Input() public appendStaticColumnFields: object;
  @Input() public tableHeight: string;
  @Input() paginationCurrentPageNumber = 1;

  @Output() rowSelected = new EventEmitter();
  @Output() rowClicked = new EventEmitter();
  @Output() permissionsLoaded = new EventEmitter();

  permissionName = input('');

  getAllColumns: Column[] | any;
  paginationSizeFilterOptions = [5, 10, 20, 50];
  paginationSizeSelection = 50;
  postData: { [key: string]: string | IReceivedTypes | undefined };

  public defaultColDef: ColDef = {
    width: 100,
    sortable: true,
    resizable: true,
    filter: false,
    flex: 1,
    minWidth: 100
  };

  selectBoxFilterChanges: ISelectBoxFilterValues | undefined;
  subscriptions: Subscription[] = [];

  private gridApi: GridApi;

  // paginationCurrentPageNumber = 1;
  paginationTotalRenderedPages: number;
  paginationTotalPageCount: number;
  paginationTotalRowCount = 50;
  paginationFirstRowOnPageIndex: number;
  paginationLastRowOnPageIndex: number;
  specificPageInput: number | undefined;

  paginationBoxOneNumber = 1;
  paginationBoxTwoNumber: number | undefined = undefined;
  paginationBoxThreeNumber: number | undefined = undefined;
  paginationBoxFourNumber: number | undefined = undefined;

  isV3DataTableLoading = true;
  selectedRowsData: RowNode[] = [];
  selectedRowCount: number = 0;

  filteredColumnFields: IDtColumnFields[] = [];
  filteredColumnDefs: ICoulmnDefFields[] = [];
  gridOptions: GridOptions = {};

  rowModelType: RowModelType = 'serverSide';
  initialLoad = true;
  dataLoaded = false;
  isEnableAllRowSelection: { [key: string]: boolean | undefined };
  isSelecetAll: { [key: string]: boolean | undefined };
  faArrowRotate = faArrowsRotate;
  faAngleLeft = faAngleLeft;
  faAngleRight = faAngleRight;
  faXmark = faXmark;

  getBankIds$ = toObservable(this.userManagementV35Service.permissionBankId);
  getPayeeIds$ = toObservable(this.userManagementV35Service.permissionPayeeId);
  getAllRowSelecton$ = toObservable(
    this.userManagementV35Service.selectAllPermission
  );

  showAllSelected = false;
  allSelectedNames: string[] = [];
  displayedSelectedNames: string[] = [];
  clientPermissionId: string;
  totalSelectedFromApi = 0;
  currentSelectedItemsPage = 1;
  isLoadingMoreSelectedItems = false;
  hasMoreSelectedItems = true;
  isLoadingAccountsPermission = signal(false);
  
  // Signals to store all loaded items with their selection state
  protected loadedItemsSignal = signal<Map<string, { name: string; selected: boolean }>>(new Map());
  
  // Computed signal to get selected names from stored items
  public selectedNamesComputed = computed(() => {
    const items = this.loadedItemsSignal();
    const selectedNames: string[] = [];
    
    items.forEach((item) => {
      if (item.selected && item.name) {
        // Don't filter duplicates - show all selected names
        selectedNames.push(item.name);
      }
    });
    
    return selectedNames;
  });
  
  // Computed signal for total selected count (combining grid selections and API data)
  public totalSelectedCountComputed = computed(() => {
    const currentPermission = this.permissionName();
    const items = this.loadedItemsSignal();
    let selectedCount = 0;
    
    // Count selected items from loaded data
    items.forEach((item) => {
      if (item.selected) {        
        selectedCount += 1;
      }
    });
    
    // Get count from permission signals for items not yet loaded
    const bankIds = this.userManagementV35Service.permissionBankId()[currentPermission] || {};
    const payeeIds = this.userManagementV35Service.permissionPayeeId()[currentPermission] || {};
    
    if (currentPermission === 'payee-accounts') {
      // Count selected payees that aren't in loaded items
      Object.entries(payeeIds).forEach(([id, selected]) => {
        // Skip undefined keys and only count valid selections
        if (id !== 'undefined' && id !== undefined && selected && !items.has(id)) {
          selectedCount += 1;
        }
      });
    } else {
      // Count selected banks that aren't in loaded items
      Object.entries(bankIds).forEach(([id, selected]) => {
        // Skip undefined keys and only count valid selections
        if (id !== 'undefined' && id !== undefined && selected && !items.has(id)) {
          selectedCount += 1;
        }
      });
    }
    
    return selectedCount;
  });

  // Computed signal to check if all items are selected
  public isAllItemsSelectedComputed = computed(() => {
    const currentPermission = this.permissionName();
    const bankIds = this.userManagementV35Service.permissionBankId()[currentPermission] || {};
    const payeeIds = this.userManagementV35Service.permissionPayeeId()[currentPermission] || {};
    
    if (currentPermission === 'payee-accounts') {
      // Filter out undefined keys and check if all valid entries are selected
      const payeeEntries = Object.entries(payeeIds).filter(([id]) => id !== 'undefined' && id !== undefined);
      return payeeEntries.length > 0 && payeeEntries.every(([, selected]) => selected === true);
    }
    
    // Filter out undefined keys and check if all valid entries are selected
    const bankEntries = Object.entries(bankIds).filter(([id]) => id !== 'undefined' && id !== undefined);
    return bankEntries.length > 0 && bankEntries.every(([, selected]) => selected === true);
  });

  ngOnInit(): void {
    this.subscriptions.push(
      this.dataTableService.paginationSizeController.subscribe((val) => {
        this.paginationPageSize = val;
      })
    );
    this.setGridOptions();
    this.setInitialColumns();
    this.selectBoxFilterChanges =
      this.v3DataTableService.initialSelectBoxFilter;
    this.setRowSelection();
    this.getTableDataOnPayloadUpdate();
    this.getClientId();
  }

  getClientId(){    
    this.subscriptions.push(this.userManagementV35Service.selectedUser$.subscribe((res) => {
      if (res) {
        this.clientPermissionId = res.client_id;
        this.accountsPermission();
      }
    }));
  }

  accountsPermission(): void {
    const currentPermission = this.permissionName();
    
    // Reset pagination state
    this.currentSelectedItemsPage = 1;
    this.hasMoreSelectedItems = true;
    this.isLoadingMoreSelectedItems = false;
    this.isLoadingAccountsPermission.set(true);
    
    const payload = {
      pagination:{
        [currentPermission]:{
          page:1,
          per_page:50  // Fetch more items to get all selected ones
        }
      }
    };

    this.subscriptions.push(
      this.userService.getAccountsPermission(this.clientPermissionId,payload)
      .pipe(
        finalize(() => {
          this.isLoadingAccountsPermission.set(false);
        })
      )
      .subscribe((res) => {
        if (res.success && res.data) {          
          // Initialize loaded items from API response
          this.initializeLoadedItemsFromApiResponse(res.data, currentPermission);
          
          // Set pagination state based on response
          const pagination = res.data[currentPermission]?.pagination;
          if (pagination) {
            this.hasMoreSelectedItems = pagination.last_page > 1;
          }
        }
      })
    );
  }

  private initializeLoadedItemsFromApiResponse(apiData: IAccountsPermission, currentPermission: string): void {
    if (!apiData || !apiData[currentPermission]) return;
    
    const permissionData = apiData[currentPermission];
    const currentLoadedItems = new Map(this.loadedItemsSignal());
    
    // Get the existing permission IDs to check selection status
    const existingBankIds = this.userManagementV35Service.permissionBankId()[currentPermission] || {};
    const existingPayeeIds = this.userManagementV35Service.permissionPayeeId()[currentPermission] || {};
    
    // Process the data array from API
    if (permissionData.data && Array.isArray(permissionData.data)) {
      permissionData.data.forEach((item: {id: string, name: string}) => {
        if (item.id && item.name) {
          // Check if this item is selected
          const isSelected = currentPermission === 'payee-accounts' 
            ? !!existingPayeeIds[item.id]
            : !!existingBankIds[item.id];
          
          // Only add selected items to the loaded items map
          if (isSelected) {
            currentLoadedItems.set(item.id, {
              name: item.name,
              selected: true
            });
          }
        }
      });
    }
    
    // Update the signal with new loaded items
    this.loadedItemsSignal.set(currentLoadedItems);
    
    // Update the total count from API response
    if (permissionData.pagination) {
      this.totalSelectedFromApi = permissionData.pagination.total || 0;
    }
  }

  setInitialColumns(): void {
    if (!this.defaultColumnFields) this.createDefaultFieldsObject();
    this.defaultColumnFields.forEach((columnField) => {
      this.filteredColumnFields.push(columnField);
      this.filteredColumnDefs.push(columnField.colDef);
    });
  }

  createDefaultFieldsObject() {
    if (!this.defaultColumnFields) this.defaultColumnFields = [];
    this.columnDefs.forEach((columnDef) => {
      const defaultDisabled = [
        'view',
        'amount',
        'view',
        'payee_name',
        'transaction_amount',
        'bank_account_account_name',
        'action',
        'boxId'
      ];
      const isDisabled = defaultDisabled.includes(columnDef.field);
      if (this.tableId !== 22) {
        this.defaultColumnFields.push({
          id: columnDef.field,
          name:
            columnDef.field === 'id' || columnDef.field === 'boxId'
              ? 'Check Box'
              : (columnDef.headerName as string),
          isDisabled,
          colDef: columnDef,
          isChecked: true
        });
      } else {
        this.defaultColumnFields.push({
          id: columnDef.field,
          name: columnDef.headerName as string,
          isDisabled,
          colDef: columnDef,
          isChecked: true
        });
      }
    });
  }

  /**
   * Initializing AGgrid.
   */
  setGridOptions() {
    this.gridOptions = {
      components: {
        ...this.frameworkComponents,
        NoRowsCellRenderer,
        CustomLoadingCellRenderer
      },
      noRowsOverlayComponent: NoRowsCellRenderer,
      loadingOverlayComponent: CustomLoadingCellRenderer,
      suppressDragLeaveHidesColumns: true,
      alwaysShowVerticalScroll: true,
      headerHeight: 35,
      floatingFiltersHeight: 30,
      loadingOverlayComponentParams: {
        isLoading: () => this.isV3DataTableLoading
      },
      getContextMenuItems: (
        params: GetContextMenuItemsParams
      ): (string | MenuItemDef)[] => {
        const defaultContextMenu = params.defaultItems;
        const customContextMenu = defaultContextMenu?.filter(
          (item) => item.toLocaleLowerCase() === 'copy'
        );
        return customContextMenu ?? [];
      }
    } as GridOptions;
  }

  /**
   * This function is automatically called by AG Grid when
   * the data is supplied from backend to the Grid.
   * @param params These are the params we are getting from AG
   * Grid.
   */
  onGridReady(params: GridReadyEvent) {
    this.gridApi = params.api;
    if (params.api.getColumns()) {
      this.getAllColumns = params.api.getAllDisplayedColumns();
    }
    this.v3DataTableService.gridApi = params.api;
    const columnApi = params.api;

    if (this.pinColumn) {
      columnApi.applyColumnState({
        state: [
          { colId: 'id', pinned: 'left' },
          { colId: this.pinColumn, pinned: 'left' }
        ],
        defaultState: { pinned: undefined }
      });
    } else {
      columnApi.applyColumnState({ defaultState: { pinned: undefined } });
    }
    this.gridApi?.setGridOption('columnDefs', this.filteredColumnDefs);
    this.getTableData();

    this.subscriptions.push(
      this.v3DataTableService.updateV3DataTable$.subscribe({
        next: (res) => {
          if (res) {
            this.selectBoxFilterChanges = res;
            this.updateDefaultPayload();
          }
        }
      })
    );

    this.subscriptions.push(
      this.userManagementV35Service.refreshV3DataTableSubject$.subscribe({
        next: (res) => {
          const permission = this.permissionName();
          if (res && Object.prototype.hasOwnProperty.call(res, permission)) {
            this.getTableData();
          }
        }
      })
    );

    this.subscriptions.push(
      this.v3DataTableService.updateV3DataTableByRemovingFilter$.subscribe({
        next: (res) => {
          this.updateDefaultPayload(res);
        }
      })
    );
  }

  /**
   * @description Get the sorted data's in alphabetical ascending and descending order based on the column
   */
  onSortChange(event: { columnApi: { getColumnState: () => ColumnState[] } }) {
    const sortedColumn = event.columnApi
      .getColumnState()
      .find((col) => Boolean(col.sort));
    if (sortedColumn) {
      const sortModel = { colId: sortedColumn.colId, sort: sortedColumn.sort };
      this.v3DataTableService.defaultPayload.sortModel = [sortModel];
    } else {
      this.v3DataTableService.defaultPayload.sortModel = [];
    }
    this.userManagementV35Service.refreshV3DataTable(this.permissionName());
  }

  /**
   * We refresh the data table when any function like
   * pagination is triggered so that we can display the
   * updated data.
   */
  refreshV3DataTable() {
    this.userManagementV35Service.refreshV3DataTable(this.permissionName());
  }

  /**
   * @description This function is automatically called by
   * AG Grid whenever we do any changes with pagination.
   * @param paginationChangedResponse Updates anytime a pagination action
   * is made.
   */
  onPaginationChanged(paginationChangedResponse: PaginationChangedEvent) {
    this.v3DataTableService.CurrentPage = this.paginationCurrentPageNumber;
    this.paginationFirstRowOnPageIndex =
      paginationChangedResponse.api.getFirstDisplayedRowIndex() + 1;
    this.paginationTotalRenderedPages =
      paginationChangedResponse.api.paginationGetTotalPages();
    paginationChangedResponse.api.updateGridOptions({
      paginationPageSize: this.paginationPageSize as number
    });
    this.paginationTotalPageCount = Math.ceil(
      this.paginationTotalRowCount / this.paginationPageSize
    );

    const isLastPage =
      this.paginationCurrentPageNumber === this.paginationTotalPageCount;
    const isLastTwoPages =
      this.paginationCurrentPageNumber > this.paginationTotalPageCount - 2;
    const isThirdLastPage =
      this.paginationCurrentPageNumber === this.paginationTotalPageCount - 2;
    const isLessThanFourPages = this.paginationTotalPageCount < 4;

    this.paginationBoxOneNumber = (() => {
      if (isLastTwoPages && !isLessThanFourPages) {
        return 1;
      }
      return this.paginationCurrentPageNumber;
    })();

    this.paginationBoxTwoNumber = (() => {
      if (isThirdLastPage && !isLessThanFourPages) {
        return undefined;
      }
      if (isLastPage) {
        return undefined;
      }
      return this.paginationBoxOneNumber + 1;
    })();

    this.paginationBoxThreeNumber = (() => {
      if (isLessThanFourPages) {
        if (isLastTwoPages) {
          return undefined;
        }
        return this.paginationTotalPageCount;
      }
      return this.paginationTotalPageCount - 1;
    })();

    this.paginationBoxFourNumber = (() => {
      if (isLessThanFourPages) {
        return undefined;
      }
      return this.paginationTotalPageCount;
    })();
  }

  /**
   * @description Method to handle selection and deselection of rows in the table.
   * The 'isSelected' method of node, returns true if selection is made and false if deselected).
   * Function is called by AG Grid automatically
   * whenever we select a row.
   * @param event We get information about which
   * row is selected and the data that is contained
   * in the selected row.
   */
  onRowSelected(event: RowSelectedEvent) {
    this.rowSelected.emit(event);
    const { node } = event;
    const currentPermission = this.permissionName();
    
    // Update loaded items signal when individual rows are selected
    const currentLoadedItems = new Map(this.loadedItemsSignal());
    const idToCheck = currentPermission === 'payee-accounts' 
      ? node.data?.encrypted_id 
      : node.data?.encrypted_bankacc_id;
    const itemName = currentPermission === 'payee-accounts' 
      ? node.data?.payee_name 
      : (node.data?.bank_account_nick_name || node.data?.bank_account_account_name);
    
    if (idToCheck && itemName) {
      currentLoadedItems.set(idToCheck, {
        name: itemName,
        selected: node.isSelected() as boolean
      });
      
      this.loadedItemsSignal.set(currentLoadedItems);
    }
    
    if (node.isSelected()) {
      const includes = this.selectedRowsData.some((el) =>
        el.data?.uu_id
          ? el.data?.uu_id === node.data?.uu_id
          : el.data?.id === node.data?.id
      );
      if (!includes) {
        this.v3DataTableService.v3RowSelectionData = [
          ...this.selectedRowsData,
          node as RowNode
        ];
      }
    } else {
      this.selectedRowsData.splice(
        this.selectedRowsData.indexOf(node as RowNode),
        1
      );
      this.v3DataTableService.v3RowSelectionData = [...this.selectedRowsData];
    }
    // Update selected names display when row selection changes
    setTimeout(() => this.getSelectedNames(), 0);
  }

  /**
   * @description Method to get table data.
   * @param type - Optional - If updating the table by setting filter etc.
   */
  async getTableData(type?: 'update') {
    if (this.v3DataTableService.defaultPayload?.startRow === 0) {
      this.paginationCurrentPageNumber = 1;
    }

    const requestPayload = {
      ...this.v3DataTableService.defaultPayload,
      ...this.postData
    };

    this.isV3DataTableLoading = true;
    if (!requestPayload.endRow) return;
    this.gridApi.showLoadingOverlay();
    this.resetData();
    this.subscriptions.push(
      this.v3DataTableService
        .getTableListData<any>(this.tableId, {
          ...requestPayload
        })
        .pipe(
          finalize(() => {
            if (type === 'update') {
              this.gridApi.paginationGoToPage(1);
              this.paginationCurrentPageNumber = 1;
            }
            this.isV3DataTableLoading = false;
            this.v3DataTableService.hardRefresh.set(false);
          })
        )
        .subscribe({
          next: async (res) => {
            const response = { ...res };
            await this.dataTableCacheService.addRowDataV3(
              this.tableId,
              requestPayload,
              response
            );
            this.appendTableRows(response);
            if (this.tableId === 34 && this.initialLoad) {
              this.initialLoad = !res.rowCount;
            }
            this.dataLoaded = true;
            this.v3DataTableService.hasV3DataTableLoaded = true;
          }
        })
    );
  }

  appendTableRows(res: ICoulmnDefFieldsResponse<any>) {
    if (this.appendStaticColumnFields) {
      this.v3DataTableService.rowData = res.rowData?.map((row) => ({
        ...row,
        ...this.appendStaticColumnFields
      }));
      // this.gridApi.sizeColumnsToFit();
    } else {
      this.v3DataTableService.rowData = res.rowData;
    }
    // supply rows for requested block to grid
    this.getAttachmentCommentStatus(res.rowData);
    this.setServerSideData(res);
    this.paginationTotalRowCount = res.rowCount;
    this.v3DataTableService.emptyRowData.next(res.rowCount);
    /**
     * @description - if permission is denied by the master user.
     */
    if (res.errorMsg === 'Not Authorized') {
      this.isPaymentTableHavePermission = false;
    }
    if (res.success === false) {
      this.v3DataTableService.rowData = [];
    }
  }

  getAttachmentCommentStatus(res: any) {
    const rowData = [...res];
    const statusArray = this.dataTableService.getA$Cstatus(this.tableId)[0];
    if (statusArray) {
      const dataIds: string[] = [];
      rowData.forEach((element: { [index: string]: any }) => {
        dataIds.push(element[statusArray.field]);
      });
      const data = { ids: dataIds };
      this.subscriptions.push(
        this.dataTableService
          .getAddAttachmentAddComment(statusArray.dataTableName, data)
          .subscribe((response) => {
            if (response.success) {
              this.dataTableService.setAttachmentCommentStatus(response.data);
            }
          })
      );
    }
  }

  setServerSideData(res: ICoulmnDefFieldsResponse<any>) {
    this.gridApi.hideOverlay();
    const datasource = {
      getRows: (params: IServerSideGetRowsParams) => {
        const response = { ...res };
        if (response.rowData?.length === 0) {
          params.api.showNoRowsOverlay();
        } else {
          params.api.hideOverlay();
        }
        if (response.rowData) {
          params.success({ rowData: response.rowData });
          const isAllSelect =
            this.isEnableAllRowSelection &&
            this.isEnableAllRowSelection[this.permissionName()];

          this.setPermissionIds(typeof isAllSelect === 'boolean', isAllSelect);
        } else {
          params.fail();
        }
      }
    };
    this.gridApi.setGridOption('serverSideDatasource', datasource);
  }

  setPermissionIds(isFromAllSelect = false, isAllSelect?: boolean): void {
    if (!this.gridApi) return;

    const currentPermission = this.permissionName();

    const updatedBankIds: { [key: string]: boolean | undefined } = {};
    const updatedPayeeIds: { [key: string]: boolean } = {};

    const existingBankIds =
      this.userManagementV35Service.permissionBankId()[currentPermission] || {};
    const existingPayeeIds =
      this.userManagementV35Service.permissionPayeeId()[currentPermission] || {};

    // Update loaded items signal with current grid data
    const currentLoadedItems = new Map(this.loadedItemsSignal());
    
    this.gridApi.forEachNode((node) => {
      const { data } = node;
      const idToCheck =
        currentPermission === 'payee-accounts'
          ? data.encrypted_id
          : data.encrypted_bankacc_id;
      
      // Store the item name for display
      const itemName = currentPermission === 'payee-accounts' 
        ? data?.payee_name 
        : (data?.bank_account_nick_name || data?.bank_account_account_name);

      if (isFromAllSelect) {
        // Apply isAllSelect to current grid node IDs
        if (
          this.userManagementV35Service.indexPermission()?.[
            currentPermission
          ] === false
        ) {
          updatedBankIds[idToCheck] =
            existingBankIds[idToCheck] !== undefined &&
            existingBankIds[idToCheck] !== true
              ? existingBankIds[idToCheck]
              : (isAllSelect ?? false);
          updatedPayeeIds[idToCheck] =
            existingPayeeIds[idToCheck] !== undefined &&
            existingPayeeIds[idToCheck] !== true
              ? existingPayeeIds[idToCheck]
              : (isAllSelect ?? false);
        } else {
          updatedBankIds[idToCheck] = isAllSelect ?? false;
          updatedPayeeIds[idToCheck] = isAllSelect ?? false;
        }
      } else {
        updatedBankIds[idToCheck] = existingBankIds[idToCheck] || false;
        updatedPayeeIds[idToCheck] = existingPayeeIds[idToCheck] || false;
      }
      
      // Store the item in the signal with its current selection state
      if (idToCheck && itemName) {
        // eslint-disable-next-line no-nested-ternary
        const isSelected = currentPermission === 'payee-accounts' 
          ? (isFromAllSelect ? (isAllSelect ?? false) : (existingPayeeIds[idToCheck] || false))
          : (isFromAllSelect ? (isAllSelect ?? false) : (existingBankIds[idToCheck] || false));
        
          currentLoadedItems.set(idToCheck, {
            name: itemName,
            selected: isSelected
          });
      }
    });
    
    // Update the signal with new loaded items
    this.loadedItemsSignal.set(currentLoadedItems);

    const mergedBankIds = { ...existingBankIds, ...updatedBankIds };
    const mergedPayeeIds = { ...existingPayeeIds, ...updatedPayeeIds };

    this.userManagementV35Service.permissionBankId.update((currentValue) => ({
      ...currentValue,
      [currentPermission]: mergedBankIds
    }));

    this.userManagementV35Service.permissionPayeeId.update((currentValue) => ({
      ...currentValue,
      [currentPermission]: mergedPayeeIds
    }));

    if (currentPermission === 'payee-accounts') {
      this.getPermssionPayees();
    } else {
      this.getPermssionBanks();
    }
  }

  getPermssionBanks() {
    this.subscriptions.push(
      this.getBankIds$.subscribe((res) => {
        if (res) {
          const allitemSelected = Object.keys(res[this.permissionName()]).every(
            (key) => res[this.permissionName()][key] === true
          );
          this.isSelecetAll = { [this.permissionName()]: allitemSelected };
          
          // Update loaded items with current selection state
          const currentLoadedItems = new Map(this.loadedItemsSignal());
          
          this.gridApi.forEachNode((node) => {
            const { data } = node;
            // Get permission mapping for current permission
            const permissionBankIds = res[this.permissionName()];

            // Determine which ID field to use based on permission name
            const idToCheck = data.encrypted_bankacc_id;

            // Check if the ID exists and is set to true in the permission mapping
            const shouldSelect = permissionBankIds
              ? !!permissionBankIds[idToCheck]
              : false;

            // Update the node's selection state
            node.setSelected(shouldSelect);
            
            // Update loaded items signal
            const itemName = data?.bank_account_nick_name || data?.bank_account_account_name;
            if (idToCheck && itemName) {
              currentLoadedItems.set(idToCheck, {
                name: itemName,
                selected: shouldSelect
              });
            }
          });
          
          // Also update items that are not currently in the grid but exist in permissions
          if (res[this.permissionName()]) {
            Object.entries(res[this.permissionName()]).forEach(([id, selected]) => {
              if (currentLoadedItems.has(id)) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const item = currentLoadedItems.get(id)!;
                currentLoadedItems.set(id, {
                  ...item,
                  selected: !!selected
                });
              }
            });
          }
          this.loadedItemsSignal.set(currentLoadedItems);
          // Update selected names display
          this.getSelectedNames();
        }
      })
    );
  }

  getPermssionPayees() {
    this.subscriptions.push(
      this.getPayeeIds$.subscribe((res) => {
        if (res) {
          const allitemSelected = Object.keys(res[this.permissionName()]).every(
            (key) => res[this.permissionName()][key] === true
          );
          this.isSelecetAll = { [this.permissionName()]: allitemSelected };
          
          // Update loaded items with current selection state
          const currentLoadedItems = new Map(this.loadedItemsSignal());
          
          this.gridApi.forEachNode((node) => {
            const { data } = node;

            // Get permission mapping for current permission
            const permissionBankIds = res[this.permissionName()];

            // Determine which ID field to use based on permission name
            const idToCheck = data.encrypted_id;

            // Check if the ID exists and is set to true in the permission mapping
            const shouldSelect = permissionBankIds
              ? !!permissionBankIds[idToCheck]
              : false;

            // Update the node's selection state
            node.setSelected(shouldSelect);
            
            // Update loaded items signal
            const itemName = data?.payee_name;
            if (idToCheck && itemName) {
              currentLoadedItems.set(idToCheck, {
                name: itemName,
                selected: shouldSelect
              });
            }
          });
          
          // Also update items that are not currently in the grid but exist in permissions
          if (res[this.permissionName()]) {
            Object.entries(res[this.permissionName()]).forEach(([id, selected]) => {
              if (currentLoadedItems.has(id)) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const item = currentLoadedItems.get(id)!;
                currentLoadedItems.set(id, {
                  ...item,
                  selected: !!selected
                });
              }
            });
          }

          this.loadedItemsSignal.set(currentLoadedItems);
          // Update selected names display
          this.getSelectedNames();
          this.permissionsLoaded.emit();
        }
      })
    );
  }

  setRowSelection() {
    this.subscriptions.push(
      this.getAllRowSelecton$.subscribe((res) => {
        if (res && typeof res[this.permissionName()] === 'boolean') {
          this.setPermissionIds(true, res[this.permissionName()]);
          this.isEnableAllRowSelection = res;
        } else {
          this.isEnableAllRowSelection = { [this.permissionName()]: undefined };
        }
      })
    );
  }

  updateDefaultPayload(removeFilter?: string[]) {
    if (this.selectBoxFilterChanges) {
      /**
       * @description If the user is adding multiple filters
       * we need to add them all together and store them in an
       * object.
       */
      this.v3DataTableService.defaultPayload = {
        ...this.v3DataTableService.defaultPayload,
        startRow: 0,
        endRow: this.paginationPageSize
      };

      this.v3DataTableService.defaultPayload.filterModel = {
        ...this.v3DataTableService.defaultPayload.filterModel,
        ...this.selectBoxFilterChanges
      };
      this.selectBoxFilterChanges = undefined;
    }

    /**
     * @description We are removing the filter from the payload if
     * the user removes the filter option by deleting the existing
     * entry from the payload.
     */
    if (removeFilter) {
      for (let i = 0; i < removeFilter.length; i += 1) {
        delete this.v3DataTableService.defaultPayload.filterModel[
          removeFilter[i]
        ];
      }
    }
    this.v3DataTableService.defaultPayloadUpdated = true;
  }

  getTableDataOnPayloadUpdate() {
    this.subscriptions.push(
      this.v3DataTableService.defaultPayloadUpdated$
        .pipe(debounceTime(600))
        .subscribe((res) => {
          if (res === true) {
            this.getTableData('update');
          }
        })
    );
  }

  /**
   * @description Reset data table when api call occur.
   */
  resetData() {
    const datasource = {
      getRows: (params: IServerSideGetRowsParams) => {
        params.success({ rowData: [] });
      }
    };
    this.gridApi.setGridOption('serverSideDatasource', datasource);
  }

  /**
   * @description Goes to the next page and dynamically
   * updates the start row and end row based on
   * the page number that the user types.
   */
  goToNextPage() {
    if (this.v3DataTableService.defaultPayload.endRow) {
      this.v3DataTableService.defaultPayload.endRow += this
        .paginationPageSize as number;
      this.v3DataTableService.defaultPayload.startRow =
        this.v3DataTableService.defaultPayload.endRow - this.paginationPageSize;
      this.userManagementV35Service.refreshV3DataTable(this.permissionName());
    }

    const tableLoadingSubscription =
      this.v3DataTableService.hasV3DataTableLoaded$
        .pipe(debounceTime(100))
        .subscribe({
          next: (res) => {
            if (res) {
              if (
                this.paginationCurrentPageNumber < this.paginationTotalPageCount
              )
                this.paginationCurrentPageNumber += 1;
              this.gridApi.paginationGoToPage(this.paginationCurrentPageNumber);
              tableLoadingSubscription.unsubscribe();
            }
          }
        });
  }

  /**
   * @description This goes to the previous page.
   */
  goToPreviousPage() {
    if (this.v3DataTableService.defaultPayload.endRow) {
      const pageSize = this.paginationPageSize as number;
      this.v3DataTableService.defaultPayload.endRow =
        this.v3DataTableService.defaultPayload.endRow >= 2 * pageSize
          ? this.v3DataTableService.defaultPayload.endRow - pageSize
          : pageSize;
      this.v3DataTableService.defaultPayload.startRow =
        this.v3DataTableService.defaultPayload.endRow - this.paginationPageSize;
      this.userManagementV35Service.refreshV3DataTable(this.permissionName());
    }

    const tableLoadingSubscription =
      this.v3DataTableService.hasV3DataTableLoaded$
        .pipe(debounceTime(100))
        .subscribe({
          next: (res) => {
            if (res) {
              if (this.paginationCurrentPageNumber >= 1) {
                this.paginationCurrentPageNumber -= 1;
              }
              this.gridApi.paginationGoToPage(this.paginationCurrentPageNumber);
              tableLoadingSubscription.unsubscribe();
            }
          }
        });
  }

  /**
   * @description Goes to a specific page
   * @param page The page number that is entered by the user
   */
  goToSpecificPage(page?: number) {
    let pageVariable = 1;

    if (page) {
      pageVariable = Math.abs(page);
    } else {
      if (!this.specificPageInput) return;
      pageVariable = Math.abs(this.specificPageInput);
    }

    if (!this.isV3DataTableLoading) {
      this.paginationPageSize = Number(this.paginationSizeSelection);

      this.paginationTotalPageCount = Math.ceil(
        this.paginationTotalRowCount / this.paginationPageSize
      );

      if (this.v3DataTableService.defaultPayload.endRow) {
        this.v3DataTableService.defaultPayload.endRow =
          pageVariable < this.paginationTotalPageCount
            ? pageVariable * this.paginationPageSize
            : this.paginationTotalRowCount;
        this.v3DataTableService.defaultPayload.startRow =
          pageVariable < this.paginationTotalPageCount
            ? this.v3DataTableService.defaultPayload.endRow -
              this.paginationPageSize
            : (pageVariable - 1) * this.paginationPageSize;
        this.userManagementV35Service.refreshV3DataTable(this.permissionName());
      }

      if (pageVariable > this.paginationTotalPageCount) {
        pageVariable = this.paginationTotalPageCount;
      }
      const tableLoadingSubscription =
        this.v3DataTableService.hasV3DataTableLoaded$
          .pipe(debounceTime(100))
          .subscribe({
            next: (res) => {
              if (res) {
                this.gridApi.paginationGoToPage(pageVariable);
                this.paginationCurrentPageNumber = pageVariable;
                tableLoadingSubscription.unsubscribe();
              }
            }
          });
    }
    if (this.specificPageInput !== undefined)
      this.specificPageInput = undefined;
  }

  /**
   * @description Handles the event when a row is clicked.
   * Emits an event indicating that a row has been clicked.
   * @param {RowClickedEvent<any>} event - The event object containing information about the clicked row.
   */
  onRowClick(event: RowClickedEvent): void {
    this.rowClicked.emit(event);
  }

  selectAll(event: Event,permission:string) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.userManagementV35Service.selectAllPermission.update((item) => ({
      ...item,
      [permission]: isChecked
    }));
    
    // Update loaded items signal
    const currentLoadedItems = new Map(this.loadedItemsSignal());
    currentLoadedItems.forEach((value, key) => {
      currentLoadedItems.set(key, { ...value, selected: isChecked });
    });
    this.loadedItemsSignal.set(currentLoadedItems);

    if (permission === 'payee-accounts') {
      this.userManagementV35Service.permissionPayeeId.update((currentValue) => {
        const updatedValue = { ...currentValue };
        Object.keys(updatedValue).forEach(() => {
          updatedValue[permission] = Object.keys(updatedValue[permission])
            .filter((innerKey) => innerKey !== 'undefined' && innerKey !== undefined)
            .reduce(
              (acc, innerKey) => {
                acc[innerKey] = isChecked;
                return acc;
              },
              {} as { [key: string]: boolean }
            );
        });
        return updatedValue;
      });
    } else {
      this.userManagementV35Service.permissionBankId.update((currentValue) => {
        const updatedValue = { ...currentValue };
        Object.keys(updatedValue).forEach(() => {
          updatedValue[permission] = Object.keys(updatedValue[permission])
            .filter((innerKey) => innerKey !== 'undefined' && innerKey !== undefined)
            .reduce(
              (acc, innerKey) => {
                acc[innerKey] = isChecked;
                return acc;
              },
              {} as { [key: string]: boolean | undefined }
            );
        });      
        return updatedValue;
      });
    }
  }

  getSelectedNames(): string[] {
    // Use the computed signal to get selected names from all loaded items
    const selectedNames = this.selectedNamesComputed();
    this.allSelectedNames = selectedNames;
    this.displayedSelectedNames = selectedNames.slice(0, 5);
    
    return this.showAllSelected ? this.allSelectedNames : this.displayedSelectedNames;
  }

  toggleShowAllSelected(): void {
    this.showAllSelected = !this.showAllSelected;
  }

  removeSelectedItem(itemName: string): void {
    const currentPermission = this.permissionName();
    
    // Find the item ID by name in the loaded items signal
    const currentLoadedItems = new Map(this.loadedItemsSignal());
    let itemIdToRemove: string | null = null;
    
    currentLoadedItems.forEach((value, key) => {
      if (value.name === itemName && value.selected) {
        itemIdToRemove = key;
      }
    });
    
    if (itemIdToRemove) {
      // Update the loaded items signal
      currentLoadedItems.set(itemIdToRemove, {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ...currentLoadedItems.get(itemIdToRemove as string)!,
        selected: false
      });
      this.loadedItemsSignal.set(currentLoadedItems);
      
      // Update the permission IDs
      if (currentPermission === 'payee-accounts') {
        this.userManagementV35Service.permissionPayeeId.update((currentValue) => {
          const updatedValue = { ...currentValue };
          if (updatedValue[currentPermission] && updatedValue[currentPermission][itemIdToRemove as string]) {
            updatedValue[currentPermission][itemIdToRemove as string] = false;
          }
          return updatedValue;
        });
        
        this.userManagementV35Service.permissionPayeeLimit.update((currentValue) => {
          return currentValue.filter((item) => item.id !== itemIdToRemove);
        });
      } else {
        this.userManagementV35Service.permissionBankId.update((currentValue) => {
          const updatedValue = { ...currentValue };
          if (updatedValue[currentPermission] && updatedValue[currentPermission][itemIdToRemove as string]) {
            updatedValue[currentPermission][itemIdToRemove as string] = false;
          }
          return updatedValue;
        });
      }
      
      // Deselect the row in the grid if it's currently visible
      this.gridApi?.forEachNode((node) => {
        const idToCheck = currentPermission === 'payee-accounts' 
          ? node.data?.encrypted_id 
          : node.data?.encrypted_bankacc_id;
        
        if (idToCheck === itemIdToRemove) {
          node.setSelected(false);
        }
      });
      
      // Update selected names display
      this.getSelectedNames();
    }
  }

  clearAllSelected(): void {
    const currentPermission = this.permissionName();
    
    // Clear the loaded items signal
    const currentLoadedItems = new Map(this.loadedItemsSignal());
    currentLoadedItems.forEach((value, key) => {
      currentLoadedItems.set(key, { ...value, selected: false });
    });
    this.loadedItemsSignal.set(currentLoadedItems);
    
    if (currentPermission === 'payee-accounts') {
      this.userManagementV35Service.permissionPayeeId.update((currentValue) => {
        const updatedValue = { ...currentValue };
        if (updatedValue[currentPermission]) {
          // Create a new object with all values set to false, filtering out undefined keys
          const clearedPermissions: { [key: string]: boolean } = {};
          Object.keys(updatedValue[currentPermission]).forEach((key) => {
            // Only process valid string keys, skip undefined keys
            if (key !== 'undefined' && key !== undefined) {
              clearedPermissions[key] = false;
            }
          });
          updatedValue[currentPermission] = clearedPermissions;
        }
        return updatedValue;
      });
      
      // Also clear all payee limit data when clearing all payees
      this.userManagementV35Service.permissionPayeeLimit.set([]);
    } else {
      this.userManagementV35Service.permissionBankId.update((currentValue) => {
        const updatedValue = { ...currentValue };
        if (updatedValue[currentPermission]) {
          // Create a new object with all values set to false, filtering out undefined keys
          const clearedPermissions: { [key: string]: boolean | undefined } = {};
          Object.keys(updatedValue[currentPermission]).forEach((key) => {
            // Only process valid string keys, skip undefined keys
            if (key !== 'undefined' && key !== undefined) {
              clearedPermissions[key] = false;
            }
          });
          updatedValue[currentPermission] = clearedPermissions;
        }
        return updatedValue;
      });
    }
    
    this.rowClicked.emit(currentPermission);
  }

  onScrollToEnd(event: Event): void {
    const element = event.target as HTMLElement;
    const threshold = 5; // pixels from bottom to trigger load
    
    // Check if user has scrolled to the bottom (with small threshold)
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - threshold) {      
      this.loadNextPageOfSelectedItems();
    }
  }

  loadNextPageOfSelectedItems(): void {    
    if (this.isLoadingMoreSelectedItems || !this.hasMoreSelectedItems || !this.clientPermissionId) {
      return;
    }

    this.isLoadingMoreSelectedItems = true;
    this.currentSelectedItemsPage += 1;

    const currentPermission = this.permissionName();
    const payload = {
      pagination: {
        [currentPermission]: {
          page: this.currentSelectedItemsPage,
          per_page: 50
        }
      }
    };

    this.subscriptions.push(
      this.userService.getAccountsPermission(this.clientPermissionId, payload)
        .pipe(
          finalize(() => {
            this.isLoadingMoreSelectedItems = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success && res.data) {
              // Check if there are more pages
              const pagination = res.data[currentPermission]?.pagination;
              if (pagination) {
                this.hasMoreSelectedItems = this.currentSelectedItemsPage < pagination.last_page;
                
                // Initialize loaded items from API response
                this.initializeLoadedItemsFromApiResponse(res.data, currentPermission);
              } else {
                this.hasMoreSelectedItems = false;
              }
            } else {
              this.hasMoreSelectedItems = false;
            }
          },
          error: () => {
            this.currentSelectedItemsPage -= 1; // Revert page increment on error
          }
        })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.v3DataTableService.rowData = [];
    this.dataTableService.selectedCellValueSignal.set(undefined);
  }
}
