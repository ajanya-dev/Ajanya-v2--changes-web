import {
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { ColDef, ICellRendererParams, RowSelectedEvent } from '@ag-grid-community/core';
import {
  IDtFloatingFilterProp,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IDepositSlipRowData } from 'src/app/modules/deposit-slip/model/depositslips';
import { DepositSlipActionCellV4Component } from '../../v4-components/deposit-slip-action-cell-v4.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { ComponentType } from '@angular/cdk/portal';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import { MatDialog } from '@angular/material/dialog';
import { DepositSlipStatusCellV4Component } from '../../v4-components/deposit-slip-status-cell-v4.component';
import { V4DataTableComponent } from '../../../../v4-data-table/components/v4-data-table/v4-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { V4PayeeNameComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-payee-name/v4-payee-name.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { DepositSlipDetailPanelV4Component } from '../../v4-components/deposit-slip-detail-panel-v4/deposit-slip-detail-panel-v4.component';
import { EditStubModalV4Component } from '../../v4-modals/edit-stub-modal-v4/edit-stub-modal-v4.component';
import { CommonTabV4Component, ITabItem } from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { DepositSlipActionsService } from '../../services/deposit-slip-actions.service';

@Component({
  selector: 'app-deposit-slip-list-v4',
  templateUrl: './deposit-slip-list-v4.component.html',
  styleUrls: ['./deposit-slip-list-v4.component.scss'],
  standalone: true,
  imports: [
    V4DataTableComponent,
    DepositSlipDetailPanelV4Component,
    CommonTabV4Component
  ]
})
export class DepositSlipListV4Component implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private v4AlertService = inject(V4AlertService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private matDialog = inject(MatDialog);
  private depositSlipActionsService = inject(DepositSlipActionsService);

  // DATA TABLE VARIABLES
  public tableId = DTTableId.depositSlip;

  fieldsShownByDefault: string[] = ['id', 'total_amount', 'action', 'payee_name'];
  selectedPanelButton = signal('id_all');

  activeFilterTab = signal('all');
  filterTabs: ITabItem[] = [
    { label: 'All', value: 'all' },
    { label: 'Verified', value: 'verified' },
    { label: 'Unverified', value: 'unverified' },
    { label: 'Voided', value: 'voided' }
  ];

  printLoading = signal(false);
  verifyDisable = signal(false);
  verifyLoading = signal(false);
  deleteLoading = signal(false);
  voidLoading = signal(false);
  voidDisable = signal(false);
  cloneDisable = signal(true);

  // Detail panel signals
  isDetailPanelOpen = signal(false);
  selectedRow = signal<IDepositSlipRowData | null>(null);

  deselectedColumns: string[] = this.defaultDeselectedColumns();

  defaultDeselectedColumns() {
    if (window.innerWidth < 768) {
      return [
        'view',
        'status',
        'source_name',
        'source.source',
        'updated_at',
        'reference_no',
        'created_by',
        'description'
      ];
    }
    if (window.innerWidth < 1100) {
      return ['source_name', 'source.source', 'created_by', 'description'];
    }
    return [];
  }

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'New',
        id: 'id_new',
        icon: ['fas', 'plus'],
        isAddIcon: true,
        type: 'list',
        toolTip: 'New Deposit Slip',
        lucideIcon: 'plus'
      },
      {
        text: 'Verify',
        id: 'id_verify',
        icon: ['far', 'check'],
        isAddIcon: true,
        type: 'list',
        toolTip: 'Verify selected deposit slip',
        disabled: this.verifyDisable() || this.voidDisable(),
        loading: this.verifyLoading(),
        floatingBarVariant: 'filled-success',
        lucideIcon: 'circle-check'
      },
      {
        text: 'Clone',
        id: 'id_cloneMultiple',
        isAddIcon: true,
        icon: ['far', 'copy'],
        type: 'list',
        toolTip: 'Clone selected deposit slip',
        disabled: this.cloneDisable(),
        floatingBarVariant: 'outline-primary',
        lucideIcon: 'copy'
      },
      {
        text: 'Print',
        id: 'multiplePrint',
        isAddIcon: true,
        icon: ['far', 'print'],
        type: 'list',
        toolTip: 'Print selected deposit slip',
        loading: this.printLoading(),
        disabled: this.voidDisable() && !this.verifyDisable(),
        floatingBarVariant: 'outline-primary',
        lucideIcon: 'printer'
      },
      {
        text: 'Void',
        id: 'id_void',
        isAddIcon: true,
        icon: ['far', 'ban'],
        type: 'list',
        toolTip: 'Void selected deposit slip',
        loading: this.voidLoading(),
        disabled: this.voidDisable(),
        floatingBarVariant: 'danger-soft',
        lucideIcon: 'ban',
        textColorInput: 'var(--v4-insight-card-icon-red)'
      },
      {
        text: 'Delete',
        id: 'multipleDelete',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        type: 'list',
        toolTip: 'Delete selected deposit slip',
        loading: this.deleteLoading(),
        floatingBarVariant: 'filled-danger',
        lucideIcon: 'trash-2'
      }
    ]
  }));

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    SelectBoxComponent: V4DropdownFloatingFilterComponent,
    actionComponent: DepositSlipActionCellV4Component,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    v4CreatedAtComponent: V4CreatedAtComponent,
    bankAccountComponent: V4TextFloatingFilterComponent,
    attachmentCommentStatus: DepositSlipStatusCellV4Component,
    V3DTCommonFilterComponent,
    V4DTCommonFilterComponent,
    V3payeeListDropDownFilterComponent: V4PayeeMultiSelectFloatingFilterComponent,
    V3PayeeNameComponent : V4PayeeNameComponent
  };

  // FILTER CUSTOM COMPONENTS
  floatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'depositslips.status',
        values: [
          { value: 1, name: 'Verified' },
          { value: 0, name: 'Not Verified' },
          { value: 2, name: 'Voided' }
        ]
      }
    ],
    selectDate: [
      { id: 'deposit_date', initialRange: 'All Time' },
      {
        id: 'depositslips.created_at',
        initialRange: 'All Time',
        isPrimary: true
      },
      { id: 'verification_date', initialRange: 'All Time' }
    ]
  };


  // Column Definitions
  colDefId = {
    minWidth: 50,
    width: 50,
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    cellRenderer: () => '',
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    pinned: 'left'
  };

  colDefAccountName: ColDef = {
    headerName: 'Deposit To',
    field: 'bank_account_nick_name',
    suppressFloatingFilterButton: true,
    minWidth: 175,
    width: 175,
    maxWidth: 300,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'bankAccountComponent',
    floatingFilterComponentParams: { page: 'depositSlip' },
    filter: 'agTextColumnFilter',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      suffixOptionalField: 'bank_account_account_name',
      type: 'bank'
    }
  };

  colDefBank = {
    headerName: 'Bank',
    field: 'banks.bank_name',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    maxWidth: 250,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent',
    cellClass: 'flex justify-start',
    cellRendererForExport: (params: ICellRendererParams) => params?.data?.bank_name
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'total_amount',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    headerClass: 'v4-amount-col',
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { isAmountField: true }
  };

  colDefDepoFrom = {
    headerName: 'Deposit From',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 175,
    maxWidth: 300,
    floatingFilterComponent: 'V3payeeListDropDownFilterComponent',
    filter: 'agTextColumnFilter',
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: 'V3PayeeNameComponent'
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'comments',
    suppressFloatingFilterButton: true,
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 500,
    flex: 1,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefDepositBy = {
    headerName: 'Deposit by',
    field: 'name',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    width: 120,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { prefixOptionalField: 'nick_name' }
  };

  colDefVerifiedBy = {
    headerName: 'Verified By',
    field: 'depositslips.verified_by',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    width: 120,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererForExport: (params: ICellRendererParams) => params?.data?.verified_by
  };

  colDefDate = {
    headerName: 'Date',
    field: 'depositslips.created_at',
    suppressFloatingFilterButton: true,
    minWidth: 130,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: 'v4CreatedAtComponent',
    cellRendererForExport: (params: ICellRendererParams) => params?.data?.created_at
  };

  colDefVeriDate = {
    headerName: 'Verified Date',
    field: 'verification_date',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'v4DateRangeComponent',
    filter: 'agDateColumnFilter',
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: 'v4CreatedAtComponent'
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'depositslips.status',
    suppressFloatingFilterButton: true,
    minWidth: 200,
    width: 220,
    maxWidth: 300,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    cellRenderer: 'attachmentCommentStatus',
    cellRendererForExport: (params: ICellRendererParams) => {
      if (params?.data?.status === 0) return 'Not Verified';
      if (params?.data?.status === 1) return 'Verified';
      if (params?.data?.status === 2) return 'Voided';
      return '';
    },
    cellStyle: { display: 'flex', alignItems: 'center', paddingLeft: '12px', paddingRight: '12px' },
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true
  };

  colDefRefId = {
    headerName: 'Ref ID',
    field: 'ref_id',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    flex: 1,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  actionField = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 60,
    maxWidth: 80,
    pinned: 'left' as const,
    cellRenderer: 'actionComponent',
    cellRendererParams: {
      onViewClick: (row: Record<string, unknown>) => {
        this.openDetailPanel({ id: 'view', selectedRow: row } as ISelectedSingleRow);
      },
      onActionClick: (row: Record<string, unknown>, actionId: string, done?: () => void) => {
        this.cellRendererActionClick({ id: actionId, selectedRow: row } as ISelectedSingleRow, done);
      }
    },
    sortable: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  columnDefs = [
    this.colDefId,
    this.actionField,
    this.colDefDate,
    this.colDefAccountName,
    this.colDefBank,
    this.colDefAmount,
    this.colDefDepoFrom,
    this.colDefMemo,
    this.colDefDepositBy,
    this.colDefVerifiedBy,
    this.colDefVeriDate,
    this.colDefRefId,
    this.colDefStatus
  ];

  columnFields = [
    { id: 'id', name: '#', isDisabled: true, colDef: this.colDefId, isChecked: true },
    { id: 'action', name: 'Action', isDisabled: true, colDef: this.actionField, isChecked: true },
    { id: 'date', name: 'Date', isDisabled: false, colDef: this.colDefDate, isChecked: true },
    { id: 'account', name: 'Deposit To', isDisabled: false, colDef: this.colDefAccountName, isChecked: true },
    { id: 'bank', name: 'Bank Name', isDisabled: false, colDef: this.colDefBank, isChecked: true },
    { id: 'amount', name: 'Amount', isDisabled: true, colDef: this.colDefAmount, isChecked: true },
    { id: 'depo_date', name: 'Deposit From', isDisabled: true, colDef: this.colDefDepoFrom, isChecked: true },
    { id: 'memo', name: 'Memo', isDisabled: false, colDef: this.colDefMemo, isChecked: true },
    { id: 'deposit_created_by', name: 'Deposit By', isDisabled: false, colDef: this.colDefDepositBy, isChecked: true },
    { id: 'verfied_by', name: 'Verified By', isDisabled: false, colDef: this.colDefVerifiedBy, isChecked: true },
    { id: 'verfied_date', name: 'Verified Date', isDisabled: false, colDef: this.colDefVeriDate, isChecked: true },
    { id: 'ref_id', name: 'Ref ID', isDisabled: false, colDef: this.colDefRefId, isChecked: true },
    { id: 'status', name: 'Status', isDisabled: false, colDef: this.colDefStatus, isChecked: true }
  ];

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.floatingFilterComponent
    );
    this.refreshDataTable();
  }

  refreshDataTable(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  onFilterTabChange(tab: string): void {
    switch (tab) {
      case 'all':
        this.v3DataTableService.updateV3DataTableByRemovingFilter = ['depositslips.status'];
        break;
      case 'verified':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('1');
        break;
      case 'unverified':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('0');
        break;
      case 'voided':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('2');
        break;
      default:
        break;
    }
  }

  cellRendererActionClick(event: ISelectedSingleRow, done?: () => void): void {
    if (!event) return;

    const row = event.selectedRow;

    if (row?.status === 1) {
      this.dataTableService.setActionButtonDisable(true, ['', 'id_verify', 'id_void', 'id_edit', '']);
    } else if (row?.status === 0) {
      this.dataTableService.setActionButtonDisable(true, ['', '', '', '']);
    } else if (row?.status === 2) {
      this.dataTableService.setActionButtonDisable(true, ['id_printRow', 'id_verify', 'id_void', 'id_edit', '']);
    }

    switch (event.id) {
      case 'id_edit':
        this.editDepositSlip(row?.action);
        break;
      case 'id_Delete':
        this.deleteRow(row?.action, done);
        break;
      case 'id_printRow':
        this.printBulk([row?.action], done);
        break;
      case 'id_clone':
        this.cloneDS(row?.action);
        break;
      case 'id_comment':
        this.addComment(row?.action);
        break;
      case 'id_attachment':
        this.addAttachment(row?.action);
        break;
      case 'id_verify':
        this.verifySlip(row?.action, done);
        break;
      case 'id_void':
        this.multiVoid([row?.action], done);
        break;
      default:
        break;
    }
  }

  openDetailPanel(event: ISelectedSingleRow): void {
    if (!event?.selectedRow) return;
    this.selectedRow.set(event.selectedRow as IDepositSlipRowData);
    this.isDetailPanelOpen.set(true);
  }

  onPanelActionClicked(key: string): void {
    switch (key) {
      case 'Verify':
      case 'Void':
      case 'Print':
        this.refreshDataTable();
        break;
      case 'Delete':
        this.depositSlipActionsService.delete(this.selectedRow()?.action ?? '', {
          onSuccess: () => {
            this.refreshDataTable();
            this.isDetailPanelOpen.set(false);
          }
        });
        break;
      default:
        break;
    }
  }

  headerButtonClick(event: ISelectedSingleRow): void {
    if (!event.id) return;

    const ids: string[] = event?.selectedRows?.map<string>((e: Data) => e.action as string) as string[];

    switch (event.id) {
      case 'id_new':
        this.createDepositSlip();
        break;
      case 'id_cloneMultiple': {
        const selected = event?.selectedRows as Data[] | undefined;
        if (!selected?.length) {
          this.v4AlertService.warningAlert({ title: 'Error', content: 'Please select a deposit slip to clone.' });
        } else if (selected.length > 1) {
          this.v4AlertService.warningAlert({ title: 'Error', content: 'Please select only one deposit slip to clone.' });
        } else {
          this.cloneDS(selected[0].action as string);
        }
        break;
      }
      case 'multiplePrint':
        if (!ids?.length) {
          this.v4AlertService.warningAlert({ title: 'Error', content: 'Please select at least one deposit slip to print.' });
        } else {
          this.printBulk(ids);
        }
        break;
      case 'id_verify':
        if (!ids?.length) {
          this.v4AlertService.warningAlert({ title: 'Error', content: 'Please select at least one deposit slip to verify.' });
        } else if (this.includesVerified(event.selectedRows as (RowSelectedEvent | { status: number })[])) {
          this.v4AlertService.warningAlert({ title: 'Error', content: 'Some slips are already verified' });
        } else {
          this.multiVerify(ids);
        }
        break;
      case 'multipleDelete':
        if (!ids?.length) {
          this.v4AlertService.warningAlert({ title: 'Error', content: 'Please select at least one deposit slip to delete.' });
        } else {
          this.multiDelete(ids);
        }
        break;
      case 'stub':
        this.goToSettings();
        break;
      case 'id_void':
        if (!ids?.length) {
          this.v4AlertService.warningAlert({ title: 'Error', content: 'Please select at least one deposit slip to void.' });
        } else {
          this.multiVoid(ids);
        }
        break;
      default:
        break;
    }
  }

  setFilterPayload(filterValue: string): ISelectBoxFilterArray {
    const selectBoxFilterValues: ISelectBoxFilterValues | undefined = {
      filter: filterValue,
      filterType: 'text',
      type: 'equals'
    };
    const filterName = 'depositslips.status';
    return { [filterName]: { ...selectBoxFilterValues } };
  }

  onRowSelected(event: RowSelectedEvent): void {
    const rows = event.api.getSelectedRows();
    this.verifyDisable.set(this.includesVerified(rows));
    this.voidDisable.set(this.includesVoided(rows));
    this.cloneDisable.set(rows.length !== 1);
  }

  createDepositSlip(): void {
    this.router.navigate(['../create'], { relativeTo: this.activatedRoute });
  }

  editDepositSlip(id: string): void {
    this.router.navigate([`../edit/${id}`], { relativeTo: this.activatedRoute });
  }

  goToSettings(): void {
    this.matDialog.open(EditStubModalV4Component, {
      width: '680px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
    });
  }

  includesVerified(rows: (RowSelectedEvent | { status: number })[]): boolean {
    for (const row of rows) {
      if ((row as { status: number }).status === 1) return true;
    }
    return false;
  }

  includesVoided(rows: (RowSelectedEvent | { status: number })[]): boolean {
    return rows.some(
      row => (row as { status: number }).status === 1 || (row as { status: number }).status === 2
    );
  }

  cloneDS(id: string) {
    this.router.navigate([`../clone/${id}`], { relativeTo: this.activatedRoute });
  }

  addAttachment(id: string) {
    this.depositSlipActionsService.addAttachment(id, {
      onSuccess: () => this.v3DataTableService.refreshV3DataTable()
    });
  }

  addComment(id: string) {
    this.depositSlipActionsService.addComment(id, {
      onSuccess: () => this.v3DataTableService.refreshV3DataTable()
    });
  }

  verifySlip(id: string, done?: () => void): void {
    this.verifyLoading.set(true);
    this.depositSlipActionsService.verify(id, {
      onFinalize: () => {
        this.verifyLoading.set(false);
        done?.();
      },
      onSuccess: () => this.refreshDataTable()
    });
  }

  multiVerify(ids: string[]): void {
    this.verifyLoading.set(true);
    this.depositSlipActionsService.verifyMany(ids, {
      onFinalize: () => this.verifyLoading.set(false),
      onSuccess: () => this.refreshDataTable()
    });
  }

  deleteRow(id: string, done?: () => void): void {
    this.deleteLoading.set(true);
    this.depositSlipActionsService.delete(id, {
      onFinalize: () => {
        this.deleteLoading.set(false);
        done?.();
      },
      onSuccess: () => {
        this.refreshDataTable();
        this.isDetailPanelOpen.set(false);
      }
    });
  }

  multiDelete(ids: string[]): void {
    this.deleteLoading.set(true);
    this.depositSlipActionsService.deleteMany(ids, {
      onFinalize: () => this.deleteLoading.set(false),
      onSuccess: () => this.refreshDataTable()
    });
  }

  printBulk(ids: string[], done?: () => void): void {
    this.printLoading.set(true);
    this.depositSlipActionsService.print(ids, {
      onFinalize: () => {
        this.printLoading.set(false);
        this.v3DataTableService.v3RowSelectionData = [];
        this.v3DataTableService.gridApi?.deselectAll();
        done?.();
      }
    });
  }

  multiVoid(ids: string[], done?: () => void): void {
    this.voidLoading.set(true);
    this.depositSlipActionsService.void(ids, {
      onFinalize: () => {
        this.voidLoading.set(false);
        done?.();
      },
      onSuccess: () => this.refreshDataTable()
    });
  }
}
