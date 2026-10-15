import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { finalize, Subscription } from 'rxjs';
import { NewVendorCreditModalComponent } from 'src/app/shared/modal/vendor-credit-modal/new-vendor-credit-modal/new-vendor-credit-modal.component';
import { VendorService } from 'src/app/shared/service/vendor/vendor.service';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { ViewAuditTrailModalComponent } from 'src/app/shared/modal/common-modal/view-audit-trail-modal/view-audit-trail-modal.component';
import { DecimalPipe } from '@angular/common';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { ComponentType } from '@angular/cdk/portal';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DtDropDownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-dt-drop-down-payee/v3-dt-drop-down-payee.component';
import { IDtFloatingFilterProp } from 'src/app/modules/data-table/model/datatable';
import {
  DTTableId,
  TTableIdValues
} from 'src/app/modules/data-table/data/table-id';
import { VendorCreditStatusRendererComponent } from './vendorCreditStatusRenderer';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { IVendorCreditRowData } from '../../model/vendor';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-vendor-credit-list',
  templateUrl: './vendor-credit-list.component.html',
  styleUrls: ['./vendor-credit-list.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class VendorCreditListComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DatatableService = inject(V3DataTableService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private vendorService = inject(VendorService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  public decimalPipe = inject(DecimalPipe);

  public tableId: TTableIdValues = DTTableId.vendorCredit; // Data Table Id

  deleteLoading = signal(false);
  voidLoading = signal(false);
  subscriptions: Subscription[] = [];
  fieldsShownByDefault: string[] = ['payee_name', 'amount'];
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
        id: 'btn_new',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list'
      },
      {
        text: 'Void',
        id: 'btn_void',
        isAddIcon: true,
        icon: ['far', 'ban'],
        type: 'list',
        backGroundInput: 'var(--common-yellow-color)',
        loading: this.voidLoading()
      },
      {
        text: 'Delete',
        id: 'btn_delete',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
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
    ],
    videoButton: [
      {
        slug: 'vendorcredit'
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
          { value: 5, name: 'Mark as Reconciled' }
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
      {
        name: 'Add Comment',
        id: 'action_add_comm',
        icon: 'far fa-comments'
      },
      {
        name: 'Audit Trail',
        id: 'action_audit_trial',
        icon: 'far fa-history'
      },
      {
        name: 'Void',
        id: 'action_void',
        icon: 'far fa-times'
      },
      {
        name: 'Edit',
        id: 'action_edit',
        icon: 'far fa-edit'
      },
      {
        name: 'Delete',
        id: 'action_delete',
        icon: 'fa fa-trash'
      }
    ]
  };

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    SelectBoxComponent: V3DataTableSelectBoxComponent,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    selectDateComponent: DataRangeV35Component,
    statusRenderer: VendorCreditStatusRendererComponent,
    V3payeeListDropDownFilterComponent: V3DtDropDownPayeeComponent
  };

  colDefId = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    cellRenderer: () => ''
  };

  colDefPayee = {
    headerName: 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'V3payeeListDropDownFilterComponent'
  };

  colDefCreditNo = {
    headerName: 'Credit No',
    field: 'credit_no',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent'
  };

  colDefCreditDate = {
    headerName: 'Credit Date',
    field: 'credit_date',
    suppressFloatingFilterButton: true,
    minWidth: 120,
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
    minWidth: 80,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent'
  };

  colDefCreatedBy = {
    headerName: 'Created By',
    field: 'nick_name',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent'
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'vendor_credits.status',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilter: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agNumberColumnFilter',

    cellRenderer: 'statusRenderer',
    cellRendererForExport: (params: Params) =>
      ({
        1: 'New',
        2: 'Completed',
        3: 'Void',
        4: 'Partially Paid',
        5: 'Mark as Reconciled'
      })[params.data.status as keyof object]
  };

  actionField: ColDef = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    maxWidth: 120,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    minWidth: 90,
    maxWidth: 150,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filter: 'agNumberColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    cellRenderer: (params: ICellRendererParams) => `$${params.value}`,
    cellClass: 'ag-right-aligned-cell pr-3'
  };

  colDefCreditFor = {
    headerName: 'Credit For',
    field: 'is_bill',
    suppressFloatingFilterButton: true,
    minWidth: 90,
    maxWidth: 150,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agNumberColumnFilter',
    cellRenderer: (params: ICellRendererParams) => params.data?.is_bill === 1 ? 'Bill' : 'Payee',
    cellRendererForExport: (params: ICellRendererParams) => params.data?.is_bill === 1 ? 'Bill' : 'Payee',
  };

  colDefBalance = {
    headerName: 'Balance',
    field: 'balance',
    suppressFloatingFilterButton: true,
    minWidth: 90,
    maxWidth: 150,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filter: 'agNumberColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',

    cellClass: 'ag-right-aligned-cell pr-3'
  };

  columnDefs = [
    this.colDefId,
    this.colDefPayee,
    this.colDefAmount,
    this.colDefCreditFor,
    this.colDefBalance,
    this.colDefCreditNo,
    this.colDefCreditDate,
    this.colDefMemo,
    this.colDefCreatedBy,
    this.colDefStatus,
    this.actionField
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
      id: 'credit_no',
      name: 'Credit No',
      isDisabled: false,
      colDef: this.colDefCreditNo,
      isChecked: true
    },
    {
      id: 'balamce',
      name: 'Balance',
      isDisabled: false,
      colDef: this.colDefBalance,
      isChecked: true
    },
    {
      id: 'memo',
      name: 'Memo',
      isDisabled: false,
      colDef: this.colDefMemo,
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
      id: 'credit_date',
      name: 'Credit Date',
      isDisabled: false,
      colDef: this.colDefCreditDate,
      isChecked: true
    },
    {
      id: 'status',
      name: 'Status',
      isDisabled: false,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'action',
      name: 'Action',
      isDisabled: false,
      colDef: this.actionField,
      isChecked: true
    }
  ];

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

  refreshDataTable() {
    this.v3DatatableService.refreshV3DataTable();
    this.v3DatatableService.v3RowSelectionData = [];
    this.v3DatatableService.gridApi?.deselectAll();
  }

  headerButtonClick(event: {
    id: string;
    selectedRows: IVendorCreditRowData[];
    tableId: string;
  }) {
    const { selectedRows } = event;

    switch (event.id) {
      case 'btn_new':
        this.onNew();
        break;
      case 'btn_void':
        this.onVoid(selectedRows);
        break;
      case 'btn_delete':
        this.onDelete(selectedRows);
        break;
      case 'panel_bill_list':
        this.goToBillList();
        break;
      default:
    }
  }

  cellRendererActionClick(event: {
    id: string;
    selectedRow: IVendorCreditRowData;
    tableId: string;
  }) {
    if (!event?.selectedRow) {
      return;
    }
    const selectedItem = event.selectedRow;

    if (selectedItem?.status === 1) {
      // Disable Buttons for - new
      this.dataTableService.setActionButtonDisable(true, [
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]);
    }
    if (selectedItem?.status === 2) {
      // for Completed

      this.dataTableService.setActionButtonDisable(true, [
        'action_mark_recon',
        'action_add_attach',
        '',
        '',
        'action_void',
        'action_edit',
        'action_delete'
      ]);
    } else if (selectedItem?.status === 3) {
      // for Void
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
    } else if (selectedItem?.status === 4) {
      // Partialy Paid

      this.dataTableService.setActionButtonDisable(true, [
        'action_mark_recon',
        '',
        '',
        '',
        'action_void',
        'action_edit',
        'action_delete'
      ]);
    } else if (selectedItem?.status === 5) {
      // Mark as Reconciled

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
    // else {                                              //Enable All
    //   this.dataTableService.setActionButtonDisable(false, ['','','','','','','','','','','']);
    // }

    if (
      selectedItem?.status !== 3 &&
      this.cellRenderer.action[4].id !== 'action_void'
    ) {
      this.cellRenderer.action.splice(4, 1, {
        name: 'Void',
        id: 'action_void',
        icon: 'fa-solid fa-xmark'
      });
    }

    switch (event.id) {
      case 'action_mark_recon':
        this.markAsReconciled(selectedItem?.action);
        break;
      case 'action_void':
        this.markAsVoid(selectedItem?.action);
        break;
      case 'action_unvoid':
        this.markAsUnvoid(selectedItem?.action);
        break;
      case 'action_edit':
        this.editVendor(selectedItem?.action);
        break;
      case 'action_delete':
        this.deleteVendorCredit([selectedItem?.action]);
        break;
      case 'action_add_comm':
        this.onAddcomment(selectedItem);
        break;
      case 'action_add_attach':
        this.onAddattachment(selectedItem);
        break;
      case 'action_audit_trial':
        this.onAuditTrial(selectedItem);
        break;
      default:
    }
  }

  cellRendererViewEvent(event: {
    id: string;
    selectedRow: IVendorCreditRowData;
    tableId: string;
  }) {
    if (event?.selectedRow) {
      this.router.navigate([`../view/${event?.selectedRow.action}`], {
        relativeTo: this.activatedRoute
      });
    }
  }

  onNew() {
    const dialogRef = this.dialog.open(NewVendorCreditModalComponent, {
      maxWidth: '700px',
      width: '93%',
      autoFocus: false,
      disableClose: true,
      data: { mode: 'new' }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.refreshDataTable();
      }
    });
  }

  editVendor(vendorId: string) {
    const dialogRef = this.dialog.open(NewVendorCreditModalComponent, {
      maxWidth: '700px',
      width: '93%',
      autoFocus: false,
      disableClose: true,
      data: { vendorId, mode: 'edit' }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.refreshDataTable();
      }
    });
  }

  onVoid(rows: IVendorCreditRowData[]) {
    if (!rows.length) {
      this.alertService.warningAlert({
        title: 'Error',
        content: 'Please select credit to void'
      });
      return;
    }

    const vendorIds = rows.map((ele: IVendorCreditRowData) => ele.action);

    const ref = this.alertService.confirmAlert({
      content: 'Are you sure you want to void selected credits?',
      doneMsg: 'Yes',
      cancelMsg: 'No, cancel!'
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.voidLoading.set(true);
        this.subscriptions.push(
          this.vendorService
            .multiVoid(vendorIds)
            .pipe(
              finalize(() => {
                this.voidLoading.set(false);
              })
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
            })
        );
      }
    });
  }

  onDelete(rows: IVendorCreditRowData[]) {
    if (!rows.length) {
      this.alertService.warningAlert({
        title: 'Error!',
        content: 'Please select credit to delete'
      });
      return;
    }
    const vendorIds = rows.map((ele: IVendorCreditRowData) => ele.action);

    this.deleteVendorCredit(vendorIds);
  }

  markAsReconciled(vendorId: string) {
    const ref = this.alertService.confirmAlert({
      content: 'Are you sure you want to mark this credit as reconciled? ',
      doneMsg: 'Yes',
      cancelMsg: 'No, cancel!'
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.vendorService.markAsReconciled(vendorId).subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Marked as Reconciled !',
                close: true,
                timeout: 2000
              });
              this.refreshDataTable();
            }
          })
        );
      }
    });
  }

  markAsVoid(vendorId: string) {
    const ref = this.alertService.confirmAlert({
      content: 'Are you sure you want to void this credit?',
      doneMsg: 'Yes',
      cancelMsg: 'No, cancel!'
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.vendorService.markAsVoid(vendorId).subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Voided',
                close: true,
                timeout: 2000
              });
              this.refreshDataTable();
            }
          })
        );
      }
    });
  }

  markAsUnvoid(vendorId: string) {
    const ref = this.alertService.confirmAlert({
      content: 'Are you sure you want to unvoid this credit?',
      doneMsg: 'Yes',
      cancelMsg: 'No, cancel!'
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.vendorService.unVoid(vendorId).subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Unvoided',
                close: true,
                timeout: 2000
              });
              this.refreshDataTable();
            }
          })
        );
      }
    });
  }

  deleteVendorCredit(vendorIds: string[]) {
    const ref = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this credit?',
      doneMsg: 'Yes',
      cancelMsg: 'No, cancel!'
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.deleteLoading.set(true);
        this.subscriptions.push(
          this.vendorService
            .deleteVendorCredit(vendorIds)
            .pipe(
              finalize(() => {
                this.deleteLoading.set(false);
              })
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
            })
        );
      }
    });
  }

  onAddcomment(selectedItem: IVendorCreditRowData) {
    const alert = this.dialog.open(AddCommentsModalComponent, {
      // open modal
      maxWidth: '700px',
      width: '93%',
      data: { id: selectedItem.action, type: 'vendor-credits' }
    });

    alert.afterClosed().subscribe((result) => {
      if (result.refresh) {
        this.refreshDataTable();
      }
    });
  }

  onAddattachment(selectedItem: IVendorCreditRowData) {
    const alert = this.dialog.open(AddAttachmentModalComponent, {
      // open modal
      maxWidth: '700px',
      width: '93%',
      data: { id: selectedItem.action, type: 'vendor-credits' }
    });

    alert.afterClosed().subscribe((result) => {
      if (result.refresh) {
        this.refreshDataTable();
      }
    });
  }

  onAuditTrial(selectedItem: IVendorCreditRowData) {
    this.dialog.open(ViewAuditTrailModalComponent, {
      maxWidth: '700px',
      width: '93%',
      data: {
        heading: 'Vendor Credit',
        id: selectedItem.action,
        slug: 'vendor-credits'
      }
    });
  }

  goToBillList() {
    this.router.navigate(['manage/bill/index']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  //= =====>For Template Responsive
  mobileHeaderRightBtn() {
    const actionBtn = document.getElementById('mobile-header-right-btn');
    actionBtn?.classList.toggle('mobile-head-rightshow');

    const ocwOverlay: HTMLElement | null = document.querySelector(
      '.ocw-overlay-righthead'
    );
    if (ocwOverlay) ocwOverlay.style.display = 'block';
  }
}

// *****************************************************Data Table Column Fields*****************************************************
