import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ICellRendererParams, RowSelectedEvent } from '@ag-grid-community/core';
import { ComponentType } from '@angular/cdk/portal';
import { finalize, forkJoin, skip } from 'rxjs';

import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { VendorService } from 'src/app/shared/service/vendor/vendor.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { IDtFloatingFilterProp } from 'src/app/modules/data-table/model/datatable';
import {
  DTTableId,
  TTableIdValues
} from 'src/app/modules/data-table/data/table-id';
import { IVendorCreditRowData } from 'src/app/modules/vendor-credit/model/vendor';

import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { V4PayeeNameComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-payee-name/v4-payee-name.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4ViewAuditTrailModalComponent } from 'src/app/shared/modal/v4-view-audit-trail-modal/v4-view-audit-trail-modal.component';
import { V4NewVendorCreditModalComponent } from '../../modals/v4-new-vendor-credit-modal/v4-new-vendor-credit-modal.component';
import { V4VendorCreditActionComponent } from './v4-vendor-credit-action.component';

import { V4VendorCreditsStateService } from '../../v4-vendor-credits-state.service';
import { V4VendorCreditStatusComponent } from './v4-vendor-credit-status.component';
import { V4VendorCreditsDetailPanelComponent } from '../v4-vendor-credits-detail-panel/v4-vendor-credits-detail-panel.component';

@Component({
  selector: 'app-v4-vendor-credits-table',
  standalone: true,
  imports: [V4DataTableComponent, V4VendorCreditsDetailPanelComponent],
  templateUrl: './v4-vendor-credits-table.component.html',
  styleUrls: ['./v4-vendor-credits-table.component.scss']
})
export class V4VendorCreditsTableComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DatatableService = inject(V3DataTableService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private vendorService = inject(VendorService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  stateService = inject(V4VendorCreditsStateService);

  tableId: TTableIdValues = DTTableId.vendorCredit;

  deleteLoading = signal(false);
  voidLoading = signal(false);
  selectedRows = signal<IVendorCreditRowData[]>([]);
  fieldsShownByDefault: string[] = ['payee_name', 'amount'];
  deselectedColumns: string[] = this.defaultDeselectedColumns();

  private defaultDeselectedColumns(): string[] {
    if (window.innerWidth < 768) {
      return ['status', 'nick_name', 'memo', 'credit_date', 'is_bill'];
    }
    if (window.innerWidth < 1100) {
      return ['nick_name', 'memo'];
    }
    return [];
  }

  private allSelectedAreVoided = computed(() => {
    const rows = this.selectedRows();
    return rows.length > 0 && rows.every((r) => r.status === 3);
  });

  headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: this.allSelectedAreVoided() ? 'Unvoid' : 'Void',
        id: this.allSelectedAreVoided() ? 'btn_unvoid' : 'btn_void',
        isAddIcon: false,
        lucideIcon: 'ban',
        type: 'list',
        floatingBarVariant: 'danger-soft',
        loading: this.voidLoading()
      },
      {
        text: 'Delete',
        id: 'btn_delete',
        isAddIcon: false,
        lucideIcon: 'trash-2',
        type: 'list',
        floatingBarVariant: 'filled-danger',
        loading: this.deleteLoading()
      }
    ],
    topRightButtons: [
      {
        text: 'Bill List',
        id: 'panel_bill_list',
        type: { name: 'list', style: 'blue' },
        backGroundInput: 'transparent',
        customClasses: 'font-extralight p-0',
        disableHoverEffect: false
      }
    ]
  }));

  floatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'vendor_credits.status',
        values: [
          { value: 1, name: 'New' },
          { value: 2, name: 'Completed' },
          { value: 3, name: 'Void' },
          { value: 4, name: 'Partially Paid' },
          { value: 5, name: 'Reconciled' }
        ]
      },
      {
        id: 'is_bill',
        values: [
          { value: 1, name: 'Bill' },
          { value: 0, name: 'Payee' }
        ]
      }
    ],
    selectDate: [
      { id: 'credit_date', initialRange: 'All Time', isPrimary: true }
    ]
  };

  actionComponentProp = {
    actionButton: true,
    eyeButton: true
  };

  cellRenderer: { action: { name: string; id: string; icon: string }[] } = {
    action: [
      {
        name: 'Mark As Reconciled',
        id: 'action_mark_recon',
        icon: 'far fa-money-bill'
      },
      {
        name: 'Add Attachment',
        id: 'action_add_attach',
        icon: 'far fa-paperclip'
      },
      { name: 'Add Comment', id: 'action_add_comm', icon: 'far fa-comments' },
      { name: 'Audit Trail', id: 'action_audit_trial', icon: 'far fa-history' },
      { name: 'Void', id: 'action_void', icon: 'far fa-times' },
      { name: 'Edit', id: 'action_edit', icon: 'far fa-edit' },
      { name: 'Delete', id: 'action_delete', icon: 'fa fa-trash' }
    ]
  };

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    SelectBoxComponent: V4DropdownFloatingFilterComponent,
    actionComponent: V4VendorCreditActionComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    V3payeeListDropDownFilterComponent:
      V4PayeeMultiSelectFloatingFilterComponent,
    statusRenderer: V4VendorCreditStatusComponent,
    v4PayeeNameComponent: V4PayeeNameComponent
  };

  // Column definitions
  colDefId = {
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    pinned: 'left' as const,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    resizable: false,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    cellRenderer: () => ''
  };

  colDefPayee = {
    headerName: 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    minWidth: 175,
    maxWidth: 250,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'V3payeeListDropDownFilterComponent',
    floatingFilterComponentParams: { singleSelect: true },
    cellRenderer: 'v4PayeeNameComponent',
    cellRendererParams: { hideFilter: true }
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filter: 'agNumberColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: (params: ICellRendererParams) => `$${params.value}`,
  };

  colDefCreditFor = {
    headerName: 'Credit For',
    field: 'is_bill',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    maxWidth: 150,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agNumberColumnFilter',
    cellRenderer: (params: ICellRendererParams) =>
      params.data?.is_bill === 1 ? 'Bill' : 'Payee',
    cellRendererForExport: (params: ICellRendererParams) =>
      params.data?.is_bill === 1 ? 'Bill' : 'Payee'
  };

  colDefBalance = {
    headerName: 'Balance',
    field: 'balance',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filter: 'agNumberColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: (params: ICellRendererParams) => `$${params.value}`
  };

  colDefCreditNo = {
    headerName: 'Credit No',
    field: 'credit_no',
    suppressFloatingFilterButton: true,
    minWidth: 130,
    maxWidth: 150,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent'
  };

  colDefCreditDate = {
    headerName: 'Credit Date',
    field: 'credit_date',
    suppressFloatingFilterButton: true,
    minWidth: 130,
    maxWidth: 160,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    filterParams: { newRowsAction: 'keep' },
    floatingFilter: true
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'memo',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent'
  };

  colDefCreatedBy = {
    headerName: 'Created By',
    field: 'nick_name',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    maxWidth: 180,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent'
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'vendor_credits.status',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    suppressHeaderMenuButton: true,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    floatingFilter: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agNumberColumnFilter',
    cellRenderer: 'statusRenderer',
    cellRendererForExport: (params: { data: IVendorCreditRowData }) =>
      ({
        1: 'New',
        2: 'Completed',
        3: 'Void',
        4: 'Partially Paid',
        5: 'Reconciled'
      })[params.data.status as keyof object]
  };

  actionField = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 90,
    maxWidth: 110,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    pinned: 'left' as const,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    resizable: false,
    cellClass: 'flex items-center'
  };

  columnDefs = [
    this.colDefId,
    this.actionField,
    this.colDefPayee,
    this.colDefAmount,
    this.colDefCreditFor,
    this.colDefBalance,
    this.colDefCreditNo,
    this.colDefCreditDate,
    this.colDefCreatedBy,
    this.colDefMemo,
    this.colDefStatus
  ];

  defaultColumnFields = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'action',
      name: 'Action',
      isDisabled: false,
      colDef: this.actionField,
      isChecked: true
    },
    {
      id: 'payees',
      name: 'Payee',
      isDisabled: true,
      colDef: this.colDefPayee,
      isChecked: true
    },
    {
      id: 'amount',
      name: 'Amount',
      isDisabled: true,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'is_bill',
      name: 'Credit For',
      isDisabled: false,
      colDef: this.colDefCreditFor,
      isChecked: true
    },
    {
      id: 'balance',
      name: 'Balance',
      isDisabled: false,
      colDef: this.colDefBalance,
      isChecked: true
    },
    {
      id: 'credit_no',
      name: 'Credit No',
      isDisabled: false,
      colDef: this.colDefCreditNo,
      isChecked: true
    },
    {
      id: 'credit_date',
      name: 'Credit Date',
      isDisabled: false,
      colDef: this.colDefCreditDate,
      isChecked: true
    },
    {
      id: 'created_by',
      name: 'Created By',
      isDisabled: false,
      colDef: this.colDefCreatedBy,
      isChecked: true
    },
    {
      id: 'memo',
      name: 'Memo',
      isDisabled: true,
      colDef: this.colDefMemo,
      isChecked: true
    },
    {
      id: 'status',
      name: 'Status',
      isDisabled: true,
      colDef: this.colDefStatus,
      isChecked: true
    }
  ];

  constructor() {
    toObservable(this.stateService.refreshTrigger)
      .pipe(skip(1), takeUntilDestroyed())
      .subscribe(() => this.refreshDataTable());
  }

  ngOnInit(): void {
    this.v3DatatableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.floatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.refreshDataTable();
  }

  refreshDataTable(): void {
    this.v3DatatableService.refreshV3DataTable();
    this.v3DatatableService.v3RowSelectionData = [];
    this.v3DatatableService.gridApi?.deselectAll();
  }

  headerButtonClick(event: {
    id: string;
    selectedRows: IVendorCreditRowData[];
    tableId: string;
  }): void {
    const { selectedRows } = event;
    switch (event.id) {
      case 'btn_void':
        this.onVoid(selectedRows);
        break;
      case 'btn_unvoid':
        this.onBulkUnvoid(selectedRows);
        break;
      case 'btn_delete':
        this.onDelete(selectedRows);
        break;
      case 'panel_bill_list':
        this.router.navigate(['/v4/manage/bill']);
        break;
      default:
        break;
    }
  }

  cellRendererActionClick(event: {
    id: string;
    selectedRow: IVendorCreditRowData;
    tableId: string;
  }): void {
    if (!event?.selectedRow) return;
    const selectedItem = event.selectedRow;

    this.updateActionButtonDisabling(selectedItem);

    switch (event.id) {
      case 'action_mark_recon':
        this.markAsReconciled(selectedItem.action);
        break;
      case 'action_void':
        this.markAsVoid(selectedItem.action);
        break;
      case 'action_unvoid':
        this.markAsUnvoid(selectedItem.action);
        break;
      case 'action_edit':
        this.editVendor(selectedItem.action);
        break;
      case 'action_delete':
        this.deleteVendorCredit([selectedItem.action]);
        break;
      case 'action_add_comm':
        this.onAddComment(selectedItem);
        break;
      case 'action_add_attach':
        this.onAddAttachment(selectedItem);
        break;
      case 'action_audit_trial':
        this.onAuditTrail(selectedItem);
        break;
      default:
        break;
    }
  }

  cellRendererViewEvent(event: {
    id: string;
    selectedRow: IVendorCreditRowData;
    tableId: string;
  }): void {
    if (event?.selectedRow) {
      this.stateService.openDetail(
        event.selectedRow.action,
        event.selectedRow.status
      );
    }
  }

  onRowSelected(event: RowSelectedEvent): void {
    const rows = event.api.getSelectedRows() as IVendorCreditRowData[];
    this.selectedRows.set(rows);
  }

  onExportData(_event: unknown): void {
    // Export handled by v4-data-table internally
  }

  // --- Actions ---

  onNew(): void {
    const dialogRef = this.dialog.open(V4NewVendorCreditModalComponent, {
      maxWidth: '700px',
      width: '93%',
      autoFocus: false,
      disableClose: true,
      data: { mode: 'new' },
      panelClass: 'paddingless-modal-rounded'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.success) this.refreshDataTable();
      });
  }

  private editVendor(vendorId: string): void {
    const dialogRef = this.dialog.open(V4NewVendorCreditModalComponent, {
      maxWidth: '700px',
      width: '93%',
      autoFocus: false,
      disableClose: true,
      data: { vendorId, mode: 'edit' },
      panelClass: 'paddingless-modal-rounded'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.success) this.refreshDataTable();
      });
  }

  private onVoid(rows: IVendorCreditRowData[]): void {
    if (!rows.length) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please select credit to void'
      });
      return;
    }

    const vendorIds = rows.map((r) => r.action);
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to void selected credits?',
        doneMsg: 'Yes',
        cancelMsg: 'No, cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.voidLoading.set(true);
        this.vendorService
          .multiVoid(vendorIds)
          .pipe(
            finalize(() => this.voidLoading.set(false)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Voided',
                close: true,
                timeout: 2000
              });
              this.refreshDataTable();
            }
          });
      });
  }

  private onBulkUnvoid(rows: IVendorCreditRowData[]): void {
    if (!rows.length) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please select credit to unvoid'
      });
      return;
    }

    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to unvoid selected credits?',
        doneMsg: 'Yes',
        cancelMsg: 'No, cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.voidLoading.set(true);
        const requests = rows.map((r) => this.vendorService.unVoid(r.action));

        forkJoin(requests)
          .pipe(
            finalize(() => {
              this.voidLoading.set(false);
              this.refreshDataTable();
            }),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((results) => {
            const allSuccess = results.every((data) => data?.success);
            if (allSuccess) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Unvoided',
                close: true,
                timeout: 2000
              });
            }
          });
      });
  }

  private onDelete(rows: IVendorCreditRowData[]): void {
    if (!rows.length) {
      this.alertService.warningAlert({
        title: 'Error!',
        content: 'Please select credit to delete'
      });
      return;
    }
    this.deleteVendorCredit(rows.map((r) => r.action));
  }

  private markAsReconciled(vendorId: string): void {
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to mark this credit as reconciled?',
        doneMsg: 'Yes',
        cancelMsg: 'No, cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.vendorService
          .markAsReconciled(vendorId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Marked as Reconciled!',
                close: true,
                timeout: 2000
              });
              this.refreshDataTable();
            }
          });
      });
  }

  private markAsVoid(vendorId: string): void {
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to void this credit?',
        doneMsg: 'Yes',
        cancelMsg: 'No, cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.vendorService
          .markAsVoid(vendorId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Voided',
                close: true,
                timeout: 2000
              });
              this.refreshDataTable();
            }
          });
      });
  }

  private markAsUnvoid(vendorId: string): void {
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to unvoid this credit?',
        doneMsg: 'Yes',
        cancelMsg: 'No, cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.vendorService
          .unVoid(vendorId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Unvoided',
                close: true,
                timeout: 2000
              });
              this.refreshDataTable();
            }
          });
      });
  }

  private deleteVendorCredit(vendorIds: string[]): void {
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this credit?',
        doneMsg: 'Yes',
        cancelMsg: 'No, cancel!'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.deleteLoading.set(true);
        this.vendorService
          .deleteVendorCredit(vendorIds)
          .pipe(
            finalize(() => this.deleteLoading.set(false)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Deleted',
                close: true,
                timeout: 2000
              });
              this.refreshDataTable();
            }
          });
      });
  }

  private onAddComment(selectedItem: IVendorCreditRowData): void {
    const ref = this.dialog.open(V4CheckAddCommentModalComponent, {
      width: '750px',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id: selectedItem.action,
        type: 'vendor-credits',
        enableDelete: true
      }
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.refresh) this.refreshDataTable();
      });
  }

  private onAddAttachment(selectedItem: IVendorCreditRowData): void {
    const ref = this.dialog.open(V4AddAttachmentModalComponent, {
      width: '750px',
      panelClass: 'paddingless-modal-rounded',
      data: { id: selectedItem.action, type: 'vendor-credits' }
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.refresh) this.refreshDataTable();
      });
  }

  private onAuditTrail(selectedItem: IVendorCreditRowData): void {
    this.dialog.open(V4ViewAuditTrailModalComponent, {
      maxWidth: '700px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        heading: 'Vendor Credit',
        id: selectedItem.action,
        slug: 'vendor-credits'
      }
    });
  }

  private updateActionButtonDisabling(
    selectedItem: IVendorCreditRowData
  ): void {
    const status = selectedItem?.status;

    if (status === 1) {
      // New - all enabled
      this.dataTableService.setActionButtonDisable(true, [
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]);
    } else if (status === 2) {
      // Completed
      this.dataTableService.setActionButtonDisable(true, [
        'action_mark_recon',
        'action_add_attach',
        '',
        '',
        'action_void',
        'action_edit',
        'action_delete'
      ]);
    } else if (status === 3) {
      // Void - swap to Unvoid
      this.cellRenderer.action.splice(4, 1, {
        name: 'Unvoid',
        id: 'action_unvoid',
        icon: 'fa-solid fa-xmark'
      });
      this.dataTableService.setActionButtonDisable(true, [
        'action_mark_recon',
        'action_add_attach',
        '',
        '',
        'action_void',
        'action_edit',
        ''
      ]);
    } else if (status === 4) {
      // Partially Paid
      this.dataTableService.setActionButtonDisable(true, [
        'action_mark_recon',
        '',
        '',
        '',
        'action_void',
        'action_edit',
        'action_delete'
      ]);
    } else if (status === 5) {
      // Reconciled
      this.dataTableService.setActionButtonDisable(true, [
        'action_mark_recon',
        'action_add_attach',
        '',
        '',
        'action_void',
        'action_edit',
        ''
      ]);
    }

    // Reset back to Void if not status 3
    if (status !== 3 && this.cellRenderer.action[4].id !== 'action_void') {
      this.cellRenderer.action.splice(4, 1, {
        name: 'Void',
        id: 'action_void',
        icon: 'far fa-times'
      });
    }
  }
}
