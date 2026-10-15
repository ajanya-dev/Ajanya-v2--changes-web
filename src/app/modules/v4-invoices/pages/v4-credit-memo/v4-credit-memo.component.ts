import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { firstValueFrom, of } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { catchError, finalize } from 'rxjs/operators';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { IApiResMesssage } from 'src/app/models/api';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { faBan, faPrint, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import {
  ICreditMemoData,
  ICreditMemoDetail,
  IFloatingFilterComponent,
  IPrintData,
  IactionComponentProp,
  IcellRendererInvoice
} from 'src/app/modules/invoices/model/invoice';
import { V4AddCreditMemoComponent } from 'src/app/modules/v4-invoices/modals/v4-add-credit-memo/v4-add-credit-memo.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { CurrencyPipe } from '@angular/common';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { V4CreditMemoActionComponent } from './cell-renderers/v4-credit-memo-action/v4-credit-memo-action.component';
import {
  V4CreditMemoDetailPanelComponent,
  ICreditMemoRowData,
  CreditMemoActionSection
} from './v4-credit-memo-detail-panel/v4-credit-memo-detail-panel.component';
import {
  V4CreditMemoStatusComponent,
  CreditMemoDetailTab
} from './cell-renderers/v4-credit-memo-status/v4-credit-memo-status.component';

@Component({
  selector: 'app-v4-credit-memo',
  templateUrl: './v4-credit-memo.component.html',
  styleUrls: ['./v4-credit-memo.component.scss'],
  standalone: true,
  imports: [
    V4DataTableComponent,
    V4CreditMemoDetailPanelComponent,
    V4PageHeaderComponent
  ],
  providers: [CurrencyPipe]
})
export class V4CreditMemoComponent implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  public dialog = inject(MatDialog);
  readonly alertService = inject(V4AlertService);
  private dataTableService = inject(DataTableService);
  private router = inject(Router);
  private creditMemoService = inject(InvoiceService);
  private currencyPipe = inject(CurrencyPipe);
  private destroyRef = inject(DestroyRef);

  public tableId = DTTableId.creditMemo;
  selectedRows?: ICreditMemoData;
  rowIndex: number;
  err_msg: string;
  val: ICreditMemoDetail;
  selectedpanel = 'id_credit_memo';

  readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'new',
      text: 'New Credit Memo',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: 'Create a new credit memo'
    }
  ];

  onHeaderAction(id: string | number): void {
    if (id === 'new') this.openAddCreditMemo();
  }

  fieldsShownByDefault: string[] = [
    'payee_name',
    'amount',
    'boxId',
    'credit_source',
    'funding_source',
    'associated_account',
    'bank_name'
  ];

  statusArr: string[] = [];

  actionComponentProp: IactionComponentProp = {
    actionButton: true,
    eyeButton: true
  };

  printLoading = signal(false);
  deleteLoading = signal(false);
  voidLoading = signal(false);

  HeaderButtonLoadingProp = { isLoading: false, btn_id: '', btn_name: '' };

  selectedCreditMemoRow = signal<ICreditMemoRowData | null>(null);
  isPanelOpen = signal(false);
  panelInitialSection = signal<CreditMemoActionSection | null>(null);

  public headerElements = signal<IV3DtHeaderElements>({
    buttons: [
      {
        text: ' Print',
        id: 'idprint',
        icon: faPrint,
        lucideIcon: 'printer',
        backGroundInput: 'var(--common-blue-color)',
        type: 'list',
        isAddIcon: true,
        toolTip: 'Print your credit memo.',
        floatingBarVariant: 'outline-primary'
      },
      {
        text: ' Delete',
        id: 'id_delete',
        icon: faTrash,
        lucideIcon: 'trash',
        type: 'list',
        backGroundInput: 'var(--common-red-color)',
        isAddIcon: true,
        toolTip: 'Delete your credit memo.',
        floatingBarVariant: 'filled-danger'
      },
      {
        text: '  Void',
        id: 'id_void',
        icon: faBan,
        lucideIcon: 'ban',
        type: 'list',
        backGroundInput: 'var(--common-yellow-color)',
        isAddIcon: true,
        toolTip: 'Void your credit memo.',
        floatingBarVariant: 'danger-soft'
      }
    ],
    topRightButtons: [
      {
        text: 'Invoice Items',
        id: 'invoice_items',
        icon: ['fas', 'list-alt'],
        type: { name: 'list', style: 'green' },
        backGroundInput: 'transparent',
        customClasses: 'font-extralight p-0',
        disableHoverEffect: false,
        isAddIcon: true
      },
      {
        text: 'Invoice Tax',
        id: 'invoice_tax',
        icon: ['fas', 'list-alt'],
        type: { name: 'list', style: 'green' },
        backGroundInput: 'transparent',
        customClasses: 'font-light p-0',
        disableHoverEffect: false,
        isAddIcon: true
      }
    ],
    videoButton: [{ slug: 'creditmemo' }]
  });

  public frameworkComponents = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    SelectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: V4DateFloatingFilterComponent,
    v4CreditMemoActionComponent: V4CreditMemoActionComponent,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    attachmentCommentStatus: V4CreditMemoStatusComponent,
    V3DTCommonFilterComponent: V4DTCommonFilterComponent,
    V4DTCommonFilterComponent
  };

  FloatingFilterComponent: IFloatingFilterComponent = {
    selectBox: [
      {
        id: 'credit_memos.status',
        values: [
          { value: 1, name: 'New' },
          { value: 2, name: 'Mark As Completed' },
          { value: 3, name: 'Void' },
          { value: 4, name: 'Partially Paid' },
          { value: 5, name: 'Completed' }
        ]
      }
    ],
    selectDate: [
      {
        id: 'credit_memos.credit_memo_date',
        initialRange: 'All Time',
        isPrimary: true
      }
    ]
  };

  cellRenderer: IcellRendererInvoice = {
    action: [
      { name: 'Print', id: 'id_PrintRow', icon: 'fa fa-print' },
      {
        name: 'Mark As Completed',
        id: 'id_MarkAsCompletedRow',
        icon: 'fa fa-check'
      },
      { name: 'Add Comment', id: 'id_AddCommentRow', icon: 'fa fa-comments' },
      {
        name: 'Add Attachment',
        id: 'id_AddAttachmentRow',
        icon: 'fa fa-paperclip'
      },
      { name: 'Audit Trail', id: 'id_AuditTrailRow', icon: 'fa fa-history' },
      { name: 'Void', id: 'id_VoidRow', icon: 'fa fa-ban' },
      { name: 'Edit', id: 'id_EditRow_creditmemo', icon: 'fa fa-edit' },
      { name: 'Delete', id: 'id_DeleteRow', icon: 'fa fa-trash' }
    ]
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      undefined,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
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
    this.creditMemoService
      .getStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.statusArr = res.data;
      });
  }

  cellRendererActionClick(event: { id: string; selectedRow: ICreditMemoData }) {
    if (event.selectedRow) {
      const selectedItem = event.selectedRow;

      if (selectedItem.status === 3) {
        this.cellRenderer.action[5].name = 'Unvoid';
        this.cellRenderer.action[5].id = 'id_UnvoidRow';
      } else {
        this.cellRenderer.action[5].name = 'Void';
        this.cellRenderer.action[5].id = 'id_VoidRow';
      }

      let disabledIds: string[];
      if (event.selectedRow?.status === 2) {
        disabledIds = [
          '',
          'id_MarkAsCompletedRow',
          '',
          'id_AddAttachmentRow',
          '',
          'id_VoidRow',
          'id_EditRow_creditmemo',
          'id_DeleteRow'
        ];
      } else if (selectedItem?.status === 3) {
        disabledIds = [
          '',
          'id_MarkAsCompletedRow',
          '',
          'id_AddAttachmentRow',
          '',
          '',
          'id_EditRow_creditmemo',
          ''
        ];
      } else if (selectedItem?.status === 4) {
        disabledIds = [
          '',
          'id_MarkAsCompletedRow',
          '',
          '',
          '',
          'id_VoidRow',
          'id_EditRow_creditmemo',
          'id_DeleteRow'
        ];
      } else if (selectedItem?.status === 5) {
        disabledIds = [
          '',
          'id_MarkAsCompletedRow',
          '',
          'id_AddAttachmentRow',
          '',
          'id_VoidRow',
          'id_EditRow_creditmemo',
          ''
        ];
      } else {
        disabledIds = ['', '', '', '', '', '', '', ''];
      }

      this.dataTableService.setActionButtonDisable(true, disabledIds);

      switch (event.id) {
        case 'id_DeleteRow':
          this.onDeleteRow(selectedItem);
          break;
        case 'id_VoidRow':
          this.onVoidRow(selectedItem);
          break;
        case 'id_UnvoidRow':
          this.onUnvoidRow(selectedItem);
          break;
        case 'id_MarkAsCompletedRow':
          this.onMarkAsCompletedRow(selectedItem);
          break;
        case 'id_EditRow_creditmemo':
          this.onEditRow(selectedItem);
          break;
        case 'id_PrintRow':
          this.onPrintRowsingle(selectedItem);
          break;
        default:
          break;
      }
    }
  }

  cellRendererViewClick(event: { selectedRow: ICreditMemoData }) {
    if (event.selectedRow) {
      this.openPanel(event.selectedRow, null);
    }
  }

  onActionByLabel(row: ICreditMemoData, label: string): void {
    switch (label) {
      case 'Print':
        this.onPrintRowsingle(row);
        break;
      case 'Mark As Completed':
        this.onMarkAsCompletedRow(row);
        break;
      case 'Add Comment':
        this.openPanel(row, 'comments');
        break;
      case 'Add Attachment':
        this.openPanel(row, 'attachments');
        break;
      case 'Audit Trail':
        this.openPanel(row, 'activity');
        break;
      case 'Void':
        this.onVoidRow(row);
        break;
      case 'Unvoid':
        this.onUnvoidRow(row);
        break;
      case 'Edit':
        this.onEditRow(row);
        break;
      case 'Delete':
        this.onDeleteRow(row);
        break;
      default:
        break;
    }
  }

  headerButtonClick(event: { id: string; selectedRows: ICreditMemoData[] }) {
    const { selectedRows } = event;

    switch (event.id) {
      case 'id_delete':
        this.onMultiDelete(selectedRows);
        break;
      case 'id_void':
        this.onMultiVoid(selectedRows);
        break;
      case 'id_invoices':
        this.router.navigate(['/v4/manage/invoice']);
        break;
      case 'idprint':
        this.onMultiPrintRowCredit(selectedRows);
        break;
      case 'invoice_items':
        this.router.navigate(['/v4/manage/invoice/items']);
        break;
      case 'invoice_tax':
        this.router.navigate(['/v4/manage/invoice/taxes']);
        break;
      default:
        break;
    }
  }

  openAddCreditMemo() {
    const dialogRef = this.dialog.open(V4AddCreditMemoComponent, {
      disableClose: true,
      maxWidth: '900px',
      width: '95%',
      height: '90vh',
      panelClass: 'paddingless-modal-rounded'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (val === true) {
          this.refreshTable();
        }
      });
  }

  async onDeleteRow(selectedRow: ICreditMemoData) {
    const result = await firstValueFrom(
      this.alertService
        .confirmAlert({ content: 'Are you sure you want to delete?' })
        .afterClosed()
    );
    if (!result) return;

    this.creditMemoService
      .deleteSingleCreditmemo(selectedRow.action)
      .pipe(
        catchError((error) => {
          this.err_msg = error.error.errorMsg;
          return of(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if ((res as IApiResMesssage).success) {
          this.openSuccess('Credit memo deleted ');
        }
      });
  }

  async onVoidRow(selectedRow: ICreditMemoData) {
    const result = await firstValueFrom(
      this.alertService
        .confirmAlert({ content: 'Are you sure you want to void?' })
        .afterClosed()
    );
    if (!result) return;

    this.creditMemoService
      .voidSingleCreditMemo(selectedRow.action)
      .pipe(
        catchError(() => of(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if ((res as IApiResMesssage).success) {
          this.openSuccess('Credit Memo Voided ');
        }
      });
  }

  async onUnvoidRow(selectedRow: ICreditMemoData) {
    const result = await firstValueFrom(
      this.alertService
        .confirmAlert({ content: 'Are you Sure you want to unvoid?' })
        .afterClosed()
    );
    if (!result) return;

    this.creditMemoService
      .unvoidSingleCreditMemo(selectedRow.action)
      .pipe(
        catchError(() => of(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if ((res as IApiResMesssage).success) {
          this.openSuccess('Credit Memo Unvoided ');
        }
      });
  }

  async onMarkAsCompletedRow(selectedRow: ICreditMemoData) {
    const result = await firstValueFrom(
      this.alertService
        .confirmAlert({
          content: 'Are you sure you want to Mark As Completed?'
        })
        .afterClosed()
    );
    if (!result) return;

    this.creditMemoService
      .markAsCompletedsingle(selectedRow.action)
      .pipe(
        catchError(() => of(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if ((res as IApiResMesssage).success) {
          this.openSuccess('Credit memo mark as completed');
        }
      });
  }

  onPrintRowsingle(selectedItem: ICreditMemoData) {
    this.creditMemoService
      .singleprintCredit(selectedItem.action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: { success: boolean; data: IPrintData }) => {
        if (res.success) {
          const iframe = document.createElement('iframe');
          iframe.srcdoc = res.data.printData;
          iframe.style.visibility = 'hidden';
          document.body.appendChild(iframe);
        }
      });
  }

  updateButtonLoading() {
    const headerElements = this.headerElements();
    if (headerElements && headerElements.buttons) {
      const button = headerElements.buttons.find(
        (b) => b.id === this.HeaderButtonLoadingProp.btn_id
      );
      if (button) {
        button.loading = this.HeaderButtonLoadingProp.isLoading;
      }
    }
  }

  onMultiPrintRowCredit(selectedRows: ICreditMemoData[]) {
    if (selectedRows.length === 0) {
      this.alertService.infoAlert({
        content: 'Please select at least one row'
      });
      return;
    }
    const ids = selectedRows.map((el) => el.action);
    this.printLoading.set(true);
    this.HeaderButtonLoadingProp.isLoading = true;
    this.HeaderButtonLoadingProp.btn_id = 'idprint';
    this.updateButtonLoading();
    this.creditMemoService
      .multiprintcredit({ ids })
      .pipe(
        finalize(() => {
          this.printLoading.set(false);
          this.HeaderButtonLoadingProp.isLoading = false;
          this.updateButtonLoading();
          this.HeaderButtonLoadingProp.btn_id = '';
        }),
        catchError(() => of(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if ((res as { success: boolean; data: IPrintData }).success) {
          const iframe = document.createElement('iframe');
          iframe.srcdoc = (
            res as { success: boolean; data: IPrintData }
          ).data.printData;
          iframe.style.visibility = 'hidden';
          document.body.appendChild(iframe);
        }
      });
  }

  async onMultiDelete(selectedRow: ICreditMemoData[]) {
    if (selectedRow.length === 0) {
      this.alertService.infoAlert({
        content: 'Please select at least one row'
      });
      return;
    }

    const result = await firstValueFrom(
      this.alertService
        .confirmAlert({ content: 'Are you sure you want to delete?' })
        .afterClosed()
    );
    if (!result) return;

    const ids = selectedRow.map((el) => el.action);
    this.deleteLoading.set(true);
    this.HeaderButtonLoadingProp.isLoading = true;
    this.HeaderButtonLoadingProp.btn_id = 'id_delete';
    this.updateButtonLoading();
    this.creditMemoService
      .multiDelete({ ids })
      .pipe(
        catchError(() => of(false)),
        finalize(() => {
          this.deleteLoading.set(false);
          this.HeaderButtonLoadingProp.isLoading = false;
          this.updateButtonLoading();
          this.HeaderButtonLoadingProp.btn_id = '';
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if ((res as IApiResMesssage).success) {
          this.openSuccess('Credit Memo deleted ');
        }
      });
  }

  async onMultiVoid(selectedRow: ICreditMemoData[]) {
    if (selectedRow.length === 0) {
      this.alertService.infoAlert({
        content: 'Please select at least one row'
      });
      return;
    }

    const result = await firstValueFrom(
      this.alertService
        .confirmAlert({ content: 'Are you sure you want to void?' })
        .afterClosed()
    );
    if (!result) return;

    const ids = selectedRow.map((el) => el.action);
    this.voidLoading.set(true);
    this.HeaderButtonLoadingProp.isLoading = true;
    this.HeaderButtonLoadingProp.btn_id = 'id_void';
    this.updateButtonLoading();
    this.creditMemoService
      .multiVoid({ ids })
      .pipe(
        catchError(() => of(false)),
        finalize(() => {
          this.voidLoading.set(false);
          this.HeaderButtonLoadingProp.isLoading = false;
          this.updateButtonLoading();
          this.HeaderButtonLoadingProp.btn_id = '';
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if ((res as IApiResMesssage).success) {
          this.openSuccess('Credit Memo Voided ');
        }
      });
  }

  onEditRow(selectedRow: ICreditMemoData) {
    this.creditMemoService
      .getSinglecreditmemo(selectedRow.action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.val = res.data;
        const dialogRef = this.dialog.open(V4AddCreditMemoComponent, {
          maxWidth: '900px',
          width: '95%',
          height: '90vh',
          data: this.val,
          panelClass: 'paddingless-modal-rounded'
        });

        dialogRef
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((val) => {
            if (val === true) {
              this.refreshTable();
            }
          });
      });
  }

  openSuccess(content: string) {
    this.v3DataTableService.gridApi?.deselectAll();
    this.v3DataTableService.refreshV3DataTable();
    this.alertService.successAlert({
      title: 'Success',
      content,
      timeout: 2000,
      close: true
    });
  }

  refreshTable() {
    this.v3DataTableService.gridApi?.deselectAll();
    this.v3DataTableService.refreshV3DataTable();
  }

  openPanel(row: ICreditMemoData, section: CreditMemoActionSection | null = null): void {
    this.selectedCreditMemoRow.set(row as unknown as ICreditMemoRowData);
    this.panelInitialSection.set(section);
    this.isPanelOpen.set(true);
  }

  onPanelActionClick(key: string, row: ICreditMemoRowData | null): void {
    if (!row) return;
    const data = row as unknown as ICreditMemoData;
    switch (key) {
      case 'Edit':
        this.onEditRow(data);
        break;
      case 'Void':
        this.onVoidRow(data);
        break;
      case 'Unvoid':
        this.onUnvoidRow(data);
        break;
      case 'Delete':
        this.onDeleteRow(data);
        break;
      default:
        break;
    }
  }

  onPanelClosed(): void {
    this.isPanelOpen.set(false);
    this.panelInitialSection.set(null);
  }

  colDefId: ColDef = {
    headerName: '',
    field: 'boxId',
    suppressFloatingFilterButton: true,
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    sortable: false,
    checkboxSelection: true,
    headerCheckboxSelection: true,
    floatingFilterComponent: 'headerCheckBoxComponent',
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    resizable: false,
    headerClass: 'pl-3.5',
    showDisabledCheckboxes: true,
    pinned: 'left' as const,
    cellClass: 'flex justify-center',
    cellRenderer: () => ''
  };

  colDefCreditNo = {
    headerName: 'Credit Number',
    field: 'credit_memo_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 140,
    maxWidth: 180
  };

  colDefpayeeName = {
    headerName: 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 175,
    maxWidth: 250,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefCreditSource = {
    headerName: 'Credit Source',
    field: 'credit_source',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 135,
    maxWidth: 200,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefFundingSource = {
    headerName: 'Funding Source',
    field: 'funding_source',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 145,
    maxWidth: 200,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefAssociatedAccount = {
    headerName: 'Associated Account',
    field: 'associated_account',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 175,
    maxWidth: 250,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefBankName = {
    headerName: 'Bank Name',
    field: 'bank_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 120,
    maxWidth: 200,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefDate = {
    headerName: 'Date',
    field: 'credit_memos.credit_memo_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
    maxWidth: 160,
    cellRenderer: 'V4DTCommonFilterComponent',
    cellRendererParams: { type: 'date' },
    valueFormatter: (params: { data: { credit_memo_date: string } }) =>
      params.data?.credit_memo_date
        ? params.data.credit_memo_date.replace(
            /^(\d{4})-(\d{2})-(\d{2})$/,
            '$2-$3-$1'
          )
        : '',
    cellRendererForExport: (params: ICellRendererParams) =>
      params?.data?.credit_memo_date
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 150,
    maxWidth: 200,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { isAmountField: true }
  };

  colDefBalance = {
    headerName: 'Balance',
    field: 'balance',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 150,
    maxWidth: 200,
    cellClass: 'flex justify-end pr-3 text-end v4-amount-col',
    headerClass: 'v4-amount-col',
    cellRenderer: (params: ICellRendererParams) =>
      this.currencyPipe.transform(params.value)
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'credit_memos.status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 130,
    width: 210,
    maxWidth: 300,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    cellRenderer: 'attachmentCommentStatus',
    cellRendererParams: {
      onCommentClick: (row: ICreditMemoData, tab: CreditMemoDetailTab) =>
        this.openPanel(row, tab as CreditMemoActionSection),
      onAttachmentClick: (row: ICreditMemoData, tab: CreditMemoDetailTab) =>
        this.openPanel(row, tab as CreditMemoActionSection)
    },
    cellRendererForExport: (params: ICellRendererParams) => {
      const status = params?.data?.status;
      if (status === 1 && params.data.balance === params.data.amount)
        return 'New';
      if (status === 2) return 'Marked As Reconciled';
      if (status === 3) return 'Voided';
      if (params.data.balance !== params.data.amount && status !== 5)
        return 'Partially Paid';
      if (status === 5) return 'Completed';
      return '';
    }
  };

  colDefAction: ColDef = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 90,
    maxWidth: 110,
    sortable: false,
    pinned: 'left' as const,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    resizable: false,
    cellClass: 'flex items-center',
    cellRenderer: 'v4CreditMemoActionComponent',
    cellRendererParams: {
      onViewClick: (row: ICreditMemoData) => this.openPanel(row, null),
      onActionClick: (row: ICreditMemoData, label: string) =>
        this.onActionByLabel(row, label)
    },
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  public columnDefs: ColDef[] = [
    this.colDefId,
    this.colDefAction,
    this.colDefCreditNo,
    this.colDefCreditSource,
    this.colDefFundingSource,
    this.colDefAssociatedAccount,
    this.colDefBankName,
    this.colDefpayeeName,
    this.colDefDate,
    this.colDefAmount,
    this.colDefBalance,
    this.colDefMemo,
    this.colDefStatus
  ];

  public columnFields: IDtColumnFields[] = [
    {
      id: 'boxId',
      name: '#',
      isDisabled: true,
      isChecked: true,
      colDef: this.colDefId
    },
    {
      id: 'id_action',
      name: 'Action',
      isDisabled: false,
      isChecked: true,
      colDef: this.colDefAction
    },
    {
      id: 'id_date',
      name: 'Date',
      isChecked: true,
      isDisabled: false,
      colDef: this.colDefDate
    },
    {
      id: 'id_credit_number',
      name: 'Credit Number',
      isDisabled: false,
      isChecked: true,
      colDef: this.colDefCreditNo
    },
    {
      id: 'id_credit_source',
      name: 'Credit Source',
      isDisabled: false,
      isChecked: true,
      colDef: this.colDefCreditSource
    },
    {
      id: 'id_funding_source',
      name: 'Funding Source',
      isDisabled: false,
      isChecked: true,
      colDef: this.colDefFundingSource
    },
    {
      id: 'id_associated_account',
      name: 'Associated Account',
      isDisabled: false,
      isChecked: true,
      colDef: this.colDefAssociatedAccount
    },
    {
      id: 'id_bank_name',
      name: 'Bank Name',
      isDisabled: false,
      isChecked: true,
      colDef: this.colDefBankName
    },
    {
      id: 'id_payeeName',
      name: 'Payee',
      isChecked: true,
      isDisabled: true,
      colDef: this.colDefpayeeName
    },
    {
      id: 'id_amount',
      name: 'Amount',
      isChecked: true,
      isDisabled: true,
      colDef: this.colDefAmount
    },
    {
      id: 'id_balance',
      name: 'Balance',
      isChecked: true,
      isDisabled: false,
      colDef: this.colDefBalance
    },
    {
      id: 'id_memo',
      name: 'Memo',
      isChecked: true,
      isDisabled: true,
      colDef: this.colDefMemo
    },
    {
      id: 'id_status',
      name: 'Status',
      isChecked: true,
      isDisabled: false,
      colDef: this.colDefStatus
    }
  ];
}
