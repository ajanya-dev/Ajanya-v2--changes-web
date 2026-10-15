import {
  Component,
  OnDestroy,
  OnInit,
  Signal,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ColDef, ICellRendererParams } from '@ag-grid-community/core';
import { firstValueFrom, of, Subject } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { IApiResMesssage } from 'src/app/models/api';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  faBan,
  faPlus,
  faPrint,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { CreditAuditTrailComponent } from '../../modals/credit-audit-trail/credit-audit-trail.component';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { CreditMemoAddAttachmentCommentComponent } from './addAttachmentComment';
import {
  ICreditMemoData,
  ICreditMemoDetail,
  IFloatingFilterComponent,
  IPrintData,
  IactionComponentProp,
  IcellRendererInvoice
} from '../../model/invoice';
import { AddCreditMemoComponent } from '../../modals/add-credit-memo/add-credit-memo.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { CurrencyPipe } from '@angular/common';

type TOpenDialog = [
  {
    id: string;
    type: string;
    enableDelete?: boolean;
  },
  { refresh: boolean }
];

/**
 * @description Angular component for the Credit Memo page.
 */
@Component({
  selector: 'app-credit-memo',
  templateUrl: './credit-memo.component.html',
  styleUrls: ['./credit-memo.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent],
  providers: [CurrencyPipe]
})
export class CreditMemoComponent implements OnInit, OnDestroy {
  v3DataTableService = inject(V3DataTableService);
  public dialog = inject(MatDialog);
  public alertService = inject(AlertService);
  private dataTableService = inject(DataTableService);
  private router = inject(Router);
  private creditMemoService = inject(InvoiceService);
  private sharedService = inject(SharedService);
  private currencyPipe = inject(CurrencyPipe);
  


  public tableId = DTTableId.creditMemo; // Data Table Id
  cellRendererId: string;
  selectedRows?: ICreditMemoData;
  invoicelist = false;
  creditmemo = true;
  rowIndex: number;
  err_msg: string;
  val: ICreditMemoDetail;
  selectedpanel = 'id_credit_memo';
  fieldsShownByDefault: string[] = [
    'payee_name',
    'amount',
    'boxId',
    'credit_source',
    'funding_source',
    'associated_account',
    'bank_name'
  ];
  destroy$ = new Subject<boolean>();
  actionComponentProp: IactionComponentProp = {
    actionButton: true,
    eyeButton: true
  };

  printLoading = signal(false);
  deleteLoading = signal(false);
  voidLoading = signal(false);

  public headerElements: Signal<IV3DtHeaderElements> = computed(() => ({
    panelButtons: [
      {
        name: 'Projects',
        id: 'id_projects'
      },
      {
        name: 'Proposals',
        id: 'id_proposals'
      },
      {
        name: 'Quotes',
        id: 'id_quotes'
      },
      {
        name: 'Tasks',
        id: 'id_tasks'
      },
      {
        name: 'Invoices',
        id: 'id_invoices'
      },
      {
        name: 'Credit Memo',
        id: 'id_credit_memo'
      }
    ],
    buttons: [
      {
        text: ' New',
        id: 'id_new',
        type: 'list',
        backGroundInput: 'var(--common-green-color)',
        isAddIcon: true,
        icon: faPlus
      },
      {
        text: ' Print',
        id: 'idprint',
        icon: faPrint,
        backGroundInput: 'var(--common-blue-color)',
        type: 'list',
        isAddIcon: true,
        loading: this.printLoading(),
        toolTip: 'Print your credit memo.'
      },
      {
        text: ' Delete',
        id: 'id_delete',
        icon: faTrash,
        type: 'list',
        backGroundInput: 'var(--common-red-color)',
        isAddIcon: true,
        loading: this.deleteLoading(),
        toolTip: 'Delete your credit memo.'
      },
      {
        text: '  Void',
        id: 'id_void',
        icon: faBan,
        type: 'list',
        backGroundInput: 'var(--common-yellow-color)',
        isAddIcon: true,
        loading: this.voidLoading(),
        toolTip: 'Void your credit memo.'
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
    videoButton: [
      {
        slug: 'creditmemo'
      }
    ]
  }));

  public frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    SelectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    attachmentCommentStatus: CreditMemoAddAttachmentCommentComponent,
    V3DTCommonFilterComponent
  };

  FloatingFilterComponent: IFloatingFilterComponent = {
    selectBox: [
      {
        id: 'credit_memos.status',
        values: [
          { value: 1, name: 'New' },
          { value: 2, name: 'Mark as Completed' },
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
      {
        name: 'Print',
        id: 'id_PrintRow',
        icon: 'fa fa-print'
      },
      {
        name: 'Mark as Completed',
        id: 'id_MarkAsCompletedRow',
        icon: 'fa fa-check'
      },
      {
        name: 'Add Comment',
        id: 'id_AddCommentRow',
        icon: 'fa fa-comments'
      },
      {
        name: 'Add Attachment',
        id: 'id_AddAttachmentRow',
        icon: 'fa fa-paperclip'
      },
      {
        name: 'Audit Trail',
        id: 'id_AuditTrailRow',
        icon: 'fa fa-history'
      },
      {
        name: 'Void',
        id: 'id_VoidRow',
        icon: 'fa fa-ban'
      },
      {
        name: 'Edit',
        id: 'id_EditRow_creditmemo',
        icon: 'fa fa-edit'
      },
      {
        name: 'Delete',
        id: 'id_DeleteRow',
        icon: 'fa fa-trash'
      }
    ]
  };

  /**
   * Initializes the component.
   */
  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      undefined,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.initializeV3DataTable();
    this.creditMemoService
      .getStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.statusArr = res.data;
      });
  }

  /**
   * @description Setting up the payload  for loading ag grid
   */
  initializeV3DataTable() {
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
  }

  /**
   * Handles click events on action buttons in the grid's cell renderer.
   * @param event - The event object containing information about the clicked action.
   */
  cellRendererActionClick(event: { id: string; selectedRow: ICreditMemoData }) {
    if (event.selectedRow) {
      const selectedItem = event.selectedRow;
      if (selectedItem.status === 3) {
        this.cellRenderer.action[5].name = 'Unvoid';
        this.cellRenderer.action[5].id = 'id_UnvoidRow';
        this.cellRenderer.action[5].icon = 'fa fa-ban';
      } else {
        this.cellRenderer.action[5].name = 'Void';
        this.cellRenderer.action[5].id = 'id_VoidRow';
        this.cellRenderer.action[5].icon = 'fa fa-ban';
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
          ''
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
        case 'id_AuditTrailRow':
          this.onAuditTrailRow(selectedItem);
          break;
        case 'id_AddAttachmentRow':
          this.onAddAttachmentRow(selectedItem);
          break;
        case 'id_AddCommentRow':
          this.onAddCommentRow(selectedItem);
          break;
        case 'id_PrintRow':
          this.onPrintRowsingle(selectedItem);
          break;
        default:
          break;
      }
    }
  }

  /**
   * Handles click events on view (eye) buttons in the grid's cell renderer.
   * @param event - The event object containing information about the clicked view action.
   */
  cellRendererViewClick(event: { selectedRow: ICreditMemoData }) {
    if (event.selectedRow) {
      this.router.navigate(['/manage/invoice/credit-view'], {
        queryParams: { id: event.selectedRow.action },
        state: { row: event.selectedRow }
      });
    }
  }

  /** ***********************FIND WHICH HEADER BUTTON IS CLICKED ***************************** */

  /**
   * Handles click events on header buttons.
   * @param event - The event object containing information about the clicked header button.
   */
  headerButtonClick(event: { id: string; selectedRows: ICreditMemoData[] }) {
    const { selectedRows } = event;

    switch (event.id) {
      case 'id_projects':
        this.openProjectsModal();
        break;
      case 'id_proposals':
        this.openProjectsModal();
        break;
      case 'id_quotes':
        this.openProjectsModal();
        break;
      case 'id_tasks':
        this.openProjectsModal();
        break;
      case 'id_new':
        this.openAddCreditMemo();
        break;
      case 'id_delete':
        this.onMultiDelete(selectedRows);
        break;
      case 'id_void':
        this.onMultiVoid(selectedRows);
        break;
      case 'id_invoices':
        this.openInvoiceList();
        break;
      case 'idprint':
        this.onMultiPrintRowCredit(selectedRows);
        break;
      case 'invoice_items':
        this.openInvoiceItem();
        break;
      case 'invoice_tax':
        this.openInvoiceTax();
        break;
      default:
        break;
    }
  }

  /**
   * Opens a modal for managing projects (Not yet implemented).
   */
  openProjectsModal() {
    this.selectedpanel = 'id_credit_memo';
    const data = {
      title: 'Coming Soon',
      doneMsg: 'OK',
      cancelMsg: 'cancel',
      timeout: 1000,
      close: true
    };
    this.alertService.infoAlert(data);
  }

  //= =====>For Template Responsive

  /**
   * Toggles the display of additional options in the mobile header.
   */
  mobileHeaderRightBtn() {
    const actionBtn = document.getElementById('mobile-header-right-btn');
    const ocwOverlay: HTMLElement | null = document.querySelector(
      '.ocw-overlay-righthead'
    );

    if (!actionBtn || !ocwOverlay) return;

    actionBtn.classList.toggle('mobile-head-rightshow');
    ocwOverlay.style.display = 'block';
  }

  /**
   * Closes the overlay for additional mobile header options.
   */
  ocwOverlayRightHeadClick() {
    const actionBtn = document.getElementById('mobile-header-right-btn');
    const ocwOverlay: HTMLElement | null = document.querySelector(
      '.ocw-overlay-righthead'
    );

    if (!actionBtn || !ocwOverlay) return;

    ocwOverlay.style.display = 'none';
    actionBtn.classList.remove('mobile-head-rightshow');
  }

  /** ***********************FIND WHICH ACTION BUTTON IS CLICKED ***************************** */

  /**
   * Opens a modal for adding a new credit memo.
   */
  openAddCreditMemo() {
    this.sharedService.setNewBankCreatedData();
    this.sharedService.setNewPayeeCreatedData(null);
    const dialogRef = this.dialog.open(AddCreditMemoComponent, {
      disableClose: true,
      maxWidth: '1010px',
      width: '93%'
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (val !== false) {
          this.refreshTable();
        }
      });
  }

  /**
   * Opens a modal to view the audit trail for a credit memo.
   * @param selectedItem - The selected credit memo item.
   */
  onAuditTrailRow(selectedItem: ICreditMemoData) {
    this.dialog.open(CreditAuditTrailComponent, {
      maxWidth: '1010px',
      width: '93%',
      data: selectedItem.action
    });
  }

  /**
   * Redirects to the invoice list page.
   */
  openInvoiceList() {
    this.router.navigate(['/manage/invoice']);
  }

  /**
   * Redirects to the invoice item page (Not yet implemented).
   */
  openInvoiceItem() {
    this.router.navigate(['/manage/invoice/items']);
  }

  /**
   * Redirects to the invoice tax page (Not yet implemented).
   */
  openInvoiceTax() {
    this.router.navigate(['/manage/invoice/taxes']);
  }

  /**
   * Handles a row click event.
   * @param event - The row index that was clicked.
   */
  rowClicked(event: number) {
    this.rowIndex = event;
  }

  onAddAttachmentRow(selectedItem: ICreditMemoData) {
    const dialogData = this.dialog.open<
      AddAttachmentModalComponent,
      TOpenDialog[0],
      TOpenDialog[1]
    >(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1350px',
      data: {
        id: selectedItem.action,
        type: 'credit-memos'
      }
    });

    dialogData
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (val?.refresh) {
          this.refreshTable();
        }
      });
  }

  /**
   * Opens a modal for adding an attachment to a credit memo.
   * @param selectedItem - The selected credit memo item.
   */
  onAddCommentRow(selectedItem: ICreditMemoData) {
    const dialogData = this.dialog.open<
      AddCommentsModalComponent,
      TOpenDialog[0],
      TOpenDialog[1]
    >(AddCommentsModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      data: {
        id: selectedItem.action,
        type: 'credit-memos',
        enableDelete: true
      }
    });

    dialogData
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if (val?.refresh) {
          this.refreshTable();
        }
      });
  }

  /**
   * Deletes a single credit memo.
   * @param selectedRow - The selected credit memo item.
   */
  async onDeleteRow(selectedRow: ICreditMemoData) {
    const data = {
      content: 'Are you sure you want to delete?'
    };

    const result = await firstValueFrom(
      this.alertService.confirmAlert(data).afterClosed()
    );

    if (!result) return;

    this.creditMemoService
      .deleteSingleCreditmemo(selectedRow.action)
      .pipe(
        catchError((error) => {
          this.err_msg = error.error.errorMsg;
          return of(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if ((res as IApiResMesssage).success) {
          this.openSuccess('Credit memo deleted ');
        }
      });
  }

  openSuccess(content: string) {
    const alertData = {
      title: 'Success',
      content,
      timeout: 2000,
      close: true
    };

    this.v3DataTableService.gridApi?.deselectAll();
    this.v3DataTableService.refreshV3DataTable();
    this.alertService.successAlert(alertData);
  }

  /** *********************** Single Void ***************************** */

  /**
   * Voids a single credit memo.
   * @param selectedRow - The selected credit memo item.
   */
  async onVoidRow(selectedRow: ICreditMemoData) {
    const data = {
      content: 'Are you sure you want to void?'
    };

    const result = await firstValueFrom(
      this.alertService.confirmAlert(data).afterClosed()
    );

    if (!result) return;

    this.creditMemoService
      .voidSingleCreditMemo(selectedRow.action)
      .pipe(
        catchError(() => of(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if ((res as IApiResMesssage).success) {
          this.openSuccess('Credit Memo Voided ');
        }
      });
  }

  /** *********************** Single Unvoid ***************************** */

  /**
   * Unvoids a single credit memo.
   * @param selectedRow - The selected credit memo item.
   */
  async onUnvoidRow(selectedRow: ICreditMemoData) {
    const data = {
      content: 'Are you Sure you want to unvoid?'
    };

    const result = await firstValueFrom(
      this.alertService.confirmAlert(data).afterClosed()
    );

    if (!result) return;

    this.creditMemoService
      .unvoidSingleCreditMemo(selectedRow.action)
      .pipe(
        catchError(() => of(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if ((res as IApiResMesssage).success) {
          this.openSuccess('Credit Memo Unvoided ');
        }
      });
  }

  /** *********************** Single MarkAsCompleted ***************************** */

  /**
   * Marks a single credit memo as completed.
   * @param selectedRow - The selected credit memo item.
   */
  async onMarkAsCompletedRow(selectedRow: ICreditMemoData) {
    const data = {
      content: 'Are you sure you want to Mark as Completed?'
    };

    const result = await firstValueFrom(
      this.alertService.confirmAlert(data).afterClosed()
    );

    if (!result) return;

    this.creditMemoService
      .markAsCompletedsingle(selectedRow.action)
      .pipe(
        catchError(() => of(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if ((res as IApiResMesssage).success) {
          this.openSuccess('Credit memo mark as completed');
        }
      });
  }

  /** *********************** Single print ***************************** */

  /**
   * Prints a single credit memo.
   * @param selectedItem - The selected credit memo item.
   */
  onPrintRowsingle(selectedItem: ICreditMemoData) {
    this.creditMemoService
      .singleprintCredit(selectedItem.action)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: { success: boolean; data: IPrintData }) => {
        if (res.success) {
          const iframe = document.createElement('iframe');
          iframe.srcdoc = res.data.printData;
          iframe.style.visibility = 'hidden';
          document.body.appendChild(iframe);
        }
      });
  }

  /** *********************** multi print ***************************** */

  /**
   * Prints multiple selected credit memos.
   * @param selectedRows - The selected credit memo items.
   */
  onMultiPrintRowCredit(selectedRows: ICreditMemoData[]) {
    const ids: string[] = [];
    selectedRows.forEach((el: ICreditMemoData) => {
      ids.push(el.action);
    });
    const itemIds = { ids };
    if (selectedRows.length === 0) {
      const infoData = {
        content: 'Please select at least one row'
      };
      this.alertService.infoAlert(infoData);
    } else {
      this.printLoading.set(true);
      this.creditMemoService
        .multiprintcredit(itemIds)
        .pipe(
          finalize(() => {
            this.printLoading.set(false);
          }),
          catchError(() => of(false)),
          takeUntil(this.destroy$)
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
  }

  /**
   * Deletes multiple selected credit memos.
   * @param selectedRow - The selected credit memo items.
   */
  async onMultiDelete(selectedRow: ICreditMemoData[]) {
    const ids: string[] = [];
    const itemIds = { ids };

    selectedRow.forEach((el: ICreditMemoData) => {
      itemIds.ids.push(el.action);
    });

    if (selectedRow.length === 0) {
      const infoData = {
        content: 'Please select at least one row'
      };
      this.alertService.infoAlert(infoData);
      return;
    }

    const confdata = {
      content: 'Are you sure you want to delete?'
    };

    const result = await firstValueFrom(
      this.alertService.confirmAlert(confdata).afterClosed()
    );

    if (!result) return;

    this.deleteLoading.set(true);
    this.creditMemoService
      .multiDelete(itemIds)
      .pipe(
        catchError(() => of(false)),
        finalize(() => {
          this.deleteLoading.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if ((res as IApiResMesssage).success) {
          this.openSuccess('Credit Memo deleted ');
        }
      });
  }

  /** *********************** Multi Void  ***************************** */

  /**
   * Voids multiple selected credit memos.
   * @param selectedRow - The selected credit memo items.
   */
  async onMultiVoid(selectedRow: ICreditMemoData[]) {
    const ids: string[] = [];
    const itemIds = { ids };

    selectedRow.forEach((el: ICreditMemoData) => {
      itemIds.ids.push(el.action);
    });

    if (selectedRow.length === 0) {
      const infoData = {
        content: 'Please select at least one row'
      };
      this.alertService.infoAlert(infoData);
    } else {
      const confdata = {
        content: 'Are you sure you want to void?'
      };

      const result = await firstValueFrom(
        this.alertService.confirmAlert(confdata).afterClosed()
      );

      if (!result) return;

      this.voidLoading.set(true);
      this.creditMemoService
        .multiVoid(itemIds)
        .pipe(
          catchError(() => of(false)),
          finalize(() => {
            this.voidLoading.set(false);
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((res) => {
          if ((res as IApiResMesssage).success) {
            this.openSuccess('Credit Memo Voided ');
          }
        });
    }
  }

  /** *********************** Multi Void  ***************************** */

  /**
   * Edits a single credit memo.
   * @param selectedRow - The selected credit memo item.
   */
  onEditRow(selectedRow: ICreditMemoData) {
    this.creditMemoService
      .getSinglecreditmemo(selectedRow.action)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.val = res.data;

        this.dialog.open(AddCreditMemoComponent, {
          maxWidth: '1010px',
          width: '93%',
          data: this.val
        });
      });
  }

  refreshTable() {
    this.v3DataTableService.gridApi.deselectAll();
    this.v3DataTableService.refreshV3DataTable();
  }

  colDefId: ColDef = {
    headerName: '',
    field: 'boxId',
    suppressFloatingFilterButton: true,
    minWidth: 20,
    maxWidth: 50,
    sortable: false,
    checkboxSelection: true,
    headerCheckboxSelection: true,
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    headerClass: 'fixed-size-header'
  };

  colDefCreditNo = {
    headerName: 'Credit Number',
    field: 'credit_memo_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100
  };

  colDefCreditSource = {
    headerName: 'Credit Source',
    field: 'credit_source',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
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
    minWidth: 100,
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
    minWidth: 100,
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
    minWidth: 100,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefpayeeName = {
    headerName: 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
    cellRenderer: 'V3DTCommonFilterComponent',
  };

  colDefDate = {
    headerName: 'Date',
    field: 'credit_memos.credit_memo_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 120,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams:{
      type: 'date'
    },
    cellRendererForExport: (params: ICellRendererParams) =>
      // Only For when Export Table data
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
    minWidth: 100,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams:{
      isAmountField: true
    },
  };

  colDefBalance = {
    headerName: 'Balance',
    field: 'balance',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
    maxWidth: 200,
    cellClass: 'ag-right-aligned-cell pr-3',
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

  statusArr: string[] = [];
  colDefStatus = {
    headerName: 'Status',
    field: 'credit_memos.status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 100,
    cellRenderer: 'attachmentCommentStatus',
    cellRendererForExport: (params: ICellRendererParams) => {
      const status = params?.data?.status;

      if (status === 1 && params.data.balance === params.data.amount) {
        return 'New';
      }
      if (status === 2) {
        return 'Marked as Reconciled';
      }
      if (status === 3) {
        return 'Voided';
      }
      if (params.data.balance !== params.data.amount && status !== 5) {
        return 'Partially Paid';
      }
      if (status === 5) {
        return 'Completed';
      }

      return '';
    }
  };

  colDefAction: ColDef = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    minWidth: 100,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  public columnDefs: ColDef[] = [
    this.colDefId,
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
    this.colDefStatus,
    this.colDefAction
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
      isDisabled: false,
      colDef: this.colDefMemo
    },

    {
      id: 'id_status',
      name: 'Status',
      isChecked: true,
      isDisabled: false,
      colDef: this.colDefStatus
    },
    {
      id: 'id_action',
      name: 'Action',
      isDisabled: false,
      isChecked: true,
      colDef: this.colDefAction
    }
  ];

  /**
   * Cleans up any subscriptions when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
