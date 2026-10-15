import { IGetAttachment, IGetComment } from 'src/app/models/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {  ICellRendererParams, RowSelectedEvent } from '@ag-grid-community/core';
import { finalize, firstValueFrom,  mergeMap, Subscription, take } from 'rxjs';

import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import {
  IDtFloatingFilterProp,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { ICoulmnDefFieldsResponse } from 'src/app/models/v3-datatable';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { ICashExpenseExport, IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { environment } from 'src/environments/environment';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DtMultiDropdownCashComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-cash/dt-multi-dropdown-cash.component';
import { faDollarSign } from '@fortawesome/pro-solid-svg-icons';
import { NgClass } from '@angular/common';
import { AuditTrailModalComponent } from '../../modals/audit-trail-modal/audit-trail-modal.component';
import { CashExpenseGetReceiptModalComponent } from '../../modals/cash-expense-get-receipt-modal/cash-expense-get-receipt-modal.component';
import { CashExpenseAddAttachmentsCommentsComponent } from './cash-exp-add-attachments-comments';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from '../../../data-table/data/table-id';
import { ExpensePaymentProofModalComponent } from '../../modals/expense-payment-proof-modal/expense-payment-proof-modal.component';
import { CashExpenseBankTableComponent } from '../../components/cash-expense-bank-table/cash-expense-bank-table.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';


interface CashExpenseInterface {
  value: string | number;
  name: string;
}

interface CashExpenseData {
  id: number;
  amount: number;
  bank_account_nick_name: string;
  payee_name: string;
  memo: string;
  transaction_date: string;
  serial_no: string;
  'users.name': string;
  catagory_name: string;
  transaction_type: string;
  account_no: string;
  invoice_no: string;
  'cash_expenses.created_at': string;
  order_for_bank: string;
  action: string;
  previous_balance: string;
  current_balance: string;
}
@Component({
  selector: 'app-cash-expense-list',
  templateUrl: './cash-expense-list.component.html',
  styleUrls: ['./cash-expense-list.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent,CashExpenseBankTableComponent,FaIconComponent,NgClass]
})
export class CashExpenseListComponent implements OnDestroy, OnInit {
  // DATA TABLE VARAIBLES

  public tableId = DTTableId.cashExpense; // Data Table Id
  // --------------------------------------->
  selectedRows!: ISelectedSingleRow['selectedRows'];
  subscriptions: Subscription[] = [];
  exportLoading = signal<boolean>(false);
  cashExpenseSummary = signal<{income: string; expense: string;net: string}>({income: '0', expense: '0', net: '0'});
  cashExpenseType: CashExpenseInterface[] = [
    { value: '1', name: 'Expense' },
    { value: '2', name: 'Income' }
  ];

  selectedRow: ISelectedSingleRow['selectedRow'];
  selectedPanelButton = 'transaction_list';
  isSendProof = signal<boolean>(false);
  isPrintReceipt = signal<boolean>(false);
  isSummaryLoading = signal<boolean>(false);


  faDollarSign = faDollarSign;

  getReceiptObj = {
    name: 'Get Signed Receipt',
    id: 'RId_getReceipt',
    icon: 'fa fa-receipt'
  };

  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: '',
    ignoreColumns: ['action', 'id']
  };

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    panelButtons: [
      {
        name: 'Transaction',
        id: 'transaction_list'
      },
      {
        name: 'Cash Accounts',
        id: 'bank_accounts'
      }
    ],
    buttons: [
      {
        text: 'New',
        id: 'id_btnNew',
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        isAddIcon: true,
        toolTip: 'New Cash Expense',
        customClasses: '!px-5 !py-1'
      },
      {
        text: 'Get Signed Receipt',
        id: 'id_receipt',
        toolTip: 'Get Signed Receipt',
        isAddIcon: true,
        icon: ['fas', 'receipt'],
        type: { style: 'violet', name: 'money-action' },
        disabled: this.isPrintReceipt(),
      },
      {
        text: 'Send Payment Proof',
        id: 'id_paymentProof',
        icon: ['fas', 'paper-plane'],
        type: 'list',
        toolTip: 'Send Payment Proof',
        isAddIcon: true,
        disabled: this.isSendProof()
      },
      {
        id: 'id_btnTrash',
        roundIcon: ['fas', 'trash'],
        customClasses: 'bg-common-secondary-red-color text-common-red-color',
        toolTip: 'Delete your cash expense'
      }
    ]
  }));

  FloatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'transaction_type',
        values: this.cashExpenseType
      }
    ],
    selectDate: [
      {
        id: 'cash_expenses.created_at',
        initialRange: 'All Time',
        isPrimary: true
      },
      { id: 'transaction_date', initialRange: 'All Time' }
    ]
  };

  cellRenderer = {
    action: [
      {
        name: 'Edit',
        id: 'RId_edit',
        icon: 'fa fa-edit'
      },
      {
        name: 'Clone',
        id: 'RId_clone',
        icon: 'fa fa-clone'
      },
      {
        name: 'Delete',
        id: 'RId_delete',
        icon: 'fa fa-trash'
      },
      {
        name: 'Audit Trail',
        id: 'RId_audit',
        icon: 'fa fa-user'
      },
      {
        name: 'Add Comments',
        id: 'RId_comments',
        icon: 'fa fa-comments'
      },
      {
        name: 'Add Attachment',
        id: 'RId_attachment',
        icon: 'fa fa-paperclip'
      },
      {
        name: 'Send Payment Proof',
        id: 'RId_proof',
        icon: 'fa fa-paper-plane'
      },
    ]
  };

  // ACTION COMPONENT PROPERTIES
  actionComponentProp = {
    actionButton: true,
    eyeButton: true
  };

  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private cashexpService = inject(CashExpenseService);
  private router = inject(Router);
  private v3DataTableService = inject(V3DataTableService);
  private localStorageService = inject(LocalStorageService);
  
  isCashExpenseBalanceEnabled = signal(false);

  constructor(){
   const userPlugins = this.localStorageService.getItem('userPlugins');
   this.isCashExpenseBalanceEnabled.set(userPlugins?.includes('cash-expense-balance'));
  }

  ngOnInit(): void {
    if(!this.isCashExpenseBalanceEnabled()){
      this.columnFields = this.columnFields.filter((column) => column.id !== 'id_previous_balance' && column.id !== 'id_current_balance');
      this.columnDefs = this.columnDefs.filter((column) => column.field !== 'previous_balance' && column.field !== 'current_balance');
    }
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
    this.getCashExpenseSummary();
  }

  // EXTERNAL CHILD COMPONENTS
  frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    cashExpenseAddAttachmentsComments:
      CashExpenseAddAttachmentsCommentsComponent,
    payeeListDropDownFilterComponent: DtMultiDropdownPayeeComponent,
    V3PayeeNameComponent,
    V3DTCommonFilterComponent,
    dtMultiDropdownCashComponent:DtMultiDropdownCashComponent,
  };

  // CONSTRUCTOR END

  // //======>For Template Responsive

  ocwOverlayRightHeadClick() {
    const ocwOverlay = document.querySelector(
      '.ocw-overlay-righthead'
    ) as HTMLElement;
    if (ocwOverlay) ocwOverlay.style.display = 'none';

    const actionBtn = document.getElementById('mobile-header-right-btn');
    actionBtn?.classList.remove('mobile-head-rightshow');
  }

  // FIND WHICH HEADER BUTTON IS CLICKED
  headerButtonClick(event: {
    id: string;
    selectedRows: ISelectedSingleRow['selectedRows'];
    tableId: number;
  }) {
    const { selectedRows } = event;

    switch (event.id) {
      // panel Filters

      // Buttons

      case 'id_btnNew':
        this.onNewCashExpense();
        break;
      case 'id_btnTrash':
        this.onDeleteMultipleCashExpense(selectedRows);

        break;
      case 'id_paymentProof':
        if (selectedRows && selectedRows.length > 0) {
          this.sendPaymentProof(selectedRows[0].id);
        } else {
          this.openWarningAlert(
            'Please select at least one entry'
          );
        }
        break;
      case 'id_receipt':
        if (selectedRows && selectedRows.length > 0) {
          this.getReceipt(selectedRows[0]);
        } else {
          this.openWarningAlert(
            'Please select at least one entry'
          );
        }
        break;
      case 'bank_accounts':
        this.selectedPanelButton = 'bank_accounts';
        break;
      case 'transaction_list':
        this.selectedPanelButton = 'transaction_list';
        break;
      default:
        break;
    }
  }

  formatPostData(selectedIds: string[]) {
    return {
      ids: selectedIds
    };
  }


  // FIND WHICH CELL ACTION BUTTON IS CLICKED
  cellRendererActionClick(event: ISelectedSingleRow) {
    const selectedItem = event.selectedRow;
    if (
      !(
        selectedItem !== undefined &&
        selectedItem?.transaction_type !== undefined
      )
    ) {
      return;
    }
    if (selectedItem.transaction_type === 1) {
      const exisIndex = this.cellRenderer.action.indexOf(this.getReceiptObj);
      if (exisIndex < 0) {
        this.cellRenderer.action.unshift(this.getReceiptObj);
      }
    } else {
      const exisIndex = this.cellRenderer.action.indexOf(this.getReceiptObj);
      if (exisIndex >= 0) {
        // this.getReceiptObj
        this.cellRenderer.action.splice(exisIndex, 1);
      }
      if (this.cellRenderer.action.find((e) => e.id === 'RId_getReceipt'))
        return;
    }
    switch (event?.id) {
      case 'id_new':
        this.onNewCashExpense();
        break;
      case 'RId_delete':
        this.onSingleDelete(selectedItem);
        break;
      case 'RId_attachment':
        this.openAddAttachmentModal(selectedItem);
        break;
      case 'RId_comments':
        this.openAddCommandModal(selectedItem);
        break;
      case 'RId_audit':
        this.openAuditTrailModal(selectedItem);
        break;
      case 'RId_proof':
        this.sendPaymentProof(selectedItem.id as string);
        break;
      case 'RId_edit':
        this.onEditCashExpense(selectedItem);
        break;
      case 'RId_getReceipt':
        if (
          selectedItem?.transaction_type !== 'undefined' &&
          selectedItem?.transaction_type === 1
        ) {
          this.getReceipt(selectedItem);
        }
        break;
      case 'RId_clone':
        this.clone(selectedItem);
        break;
      default:
        break;
    }
  }

  // View Check Action Button
  cellRendererActionView(event: ISelectedSingleRow) {
    const selectedItem = event.selectedRow;
    if (event.selectedRow?.action) {
      this.router.navigate(['/manage/cashexp/view/', selectedItem?.action]);
    }
  }

  onRowSelected(event: RowSelectedEvent) {    
    const gridApi = event.api;
    this.selectedRow = gridApi.getSelectedRows();
    if( this.selectedRow&& this.selectedRow.length === 1) {      
      this.isSendProof.set(false);
      if(this.selectedRow[0]?.transaction_type !== 1){
        this.isPrintReceipt.set(true);
      }else{
        this.isPrintReceipt.set(false);
      }
    }else if(this.selectedRow&& this.selectedRow.length > 1){
      this.isSendProof.set(true);
      this.isPrintReceipt.set(true);
    }else{
      this.isSendProof.set(false);
      this.isPrintReceipt.set(false);
    }
  }

  onEditCashExpense(selectedItem: ISelectedSingleRow['selectedRow']) {
    const cashExpenseId = selectedItem?.id;
    this.router.navigate(['/manage/cashexp/new-cash'], {
      queryParams: { id: cashExpenseId }
    });
  }

  onNewCashExpense() {
    this.router.navigateByUrl('/manage/cashexp/new-cash');
  }

  onDeleteMultipleCashExpense(
    selectedItems: ISelectedSingleRow['selectedRow']
  ) {
    if (selectedItems?.length === 0) {
      const content = 'Please select at least one entry to delete.';
      this.openWarningAlert(content);
      return;
    }
    const itemIds: { ids: string[] } = { ids: [] };
    selectedItems?.forEach((val: { action: string }) => {
      itemIds.ids.push(val.action);
    });
    const confirmContent = 'Are you sure you want to delete?';
    const cancelMsg = 'No, Cancel!';
    const doneMsg = 'Yes';
    const alert = this.openConfirmAlert(
      confirmContent,
      cancelMsg,
      doneMsg,
      'Confirm'
    );
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.deleteMultiCashExpenseAction(itemIds);
        }
      })
    );
  }

  deleteMultiCashExpenseAction(itemIds: { ids: string[] }) {
    this.subscriptions.push(
      this.cashexpService.bulkDeleteCashexpense(itemIds).subscribe((res) => {
        if (res.success === true) {
          this.dataTableService.setRefreshStatus(true);
          const successContent = 'Cash Expense Entries Deleted.';
          this.openSuccessAlert(successContent);
          this.v3DataTableService.refreshV3DataTable();
          this.v3DataTableService.gridApi?.deselectAll();
          this.getCashExpenseSummary();
        }
      })
    );
  }

  // ----------------->Cell Renderer
  onSingleDelete(selectedItem: ISelectedSingleRow['selectedRow']): void {
    const selectedId = selectedItem?.action;
    const confirmContent = 'Are you sure you want to delete?';
    const cancelMsg = 'No, Cancel!';
    const doneMsg = 'Yes, Delete it!';
    const alert = this.openConfirmAlert(
      confirmContent,
      cancelMsg,
      doneMsg,
      'Confirm'
    );
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.subscriptions.push(
            this.cashexpService
              .deleteCashexpense(selectedId)
              .subscribe((res) => {
                if (res.success === true) {
                  this.dataTableService.setRefreshStatus(true);
                  const successContent = 'Cash Expense Entry Deleted.';
                  this.openSuccessAlert(successContent);
                  this.v3DataTableService.refreshV3DataTable();
                  this.getCashExpenseSummary();
                }
              })
          );
        }
      })
    );
  }

  openAddCommandModal(selectedItem: ISelectedSingleRow['selectedRow']): void {
    const dialogRef = this.dialog.open(AddCommentsModalComponent, {
      maxWidth: '800px',
      width: '93%',
      data: {
        slug: 'cashexp',
        id: selectedItem?.id,
        type: 'cash-expenses',
        enableDelete: true
      }
    });

    dialogRef
      .afterClosed()
      .subscribe((res: { listData: IGetComment[]; refresh: boolean }) => {
        this.checkAndRefreshDataTable(res);
        this.refreshTable();
      });
  }

  refreshTable() {
    this.dataTableService.setRefreshStatus(true);
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  openAddAttachmentModal(
    selectedItem: ISelectedSingleRow['selectedRow']
  ): void {
    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      maxWidth: '600px',
      width: '93%',
      data: { slug: 'cashexp', id: selectedItem?.id, type: 'cash-expenses' }
    });

    dialogRef
      .afterClosed()
      .subscribe((res: { listData: IGetAttachment[]; refresh: boolean }) => {
        this.checkAndRefreshDataTable(res);
        this.refreshTable();
      });
  }

  openInfoAlert(content: string) {
    const data = {
      content
    };
    return this.alertService.infoAlert(data);
  }

  openConfirmAlert(
    content: string,
    cancelMsg?: string,
    doneMsg?: string,
    title = 'Are You Sure ?'
  ) {
    const data = {
      title,
      content,
      cancelMsg: cancelMsg || 'Cancel',
      doneMsg: doneMsg || 'OK'
    };
    return this.alertService.confirmAlert(data);
  }
  //= =====>Header Button Click

  openWarningAlert(content: string): void {
    const data = {
      title: 'Error',
      content
    };
    this.alertService.warningAlert(data);
  }

  openSuccessAlert(content: string): void {
    const data = {
      title: 'Success!',
      content,
      close: true
    };
    this.alertService.successAlert(data);
  }

  openAuditTrailModal(selectedItem: ISelectedSingleRow['selectedRow']): void {
    this.dialog.open(AuditTrailModalComponent, {
      maxWidth: '800px',
      width: '93%',
      data: { slug: 'cashexp', cashExpenseData: selectedItem, fromModal: true }
    });
  }

  getReceipt(selectedItem: ISelectedSingleRow['selectedRow']): void {
    if (selectedItem?.transaction_type === 1 && selectedItem.signature_url === null) {
      this.dialog.open(CashExpenseGetReceiptModalComponent, {
        maxWidth: '500px',
        width: '93%',
        data: { slug: 'cashexp', cashExpenseData: selectedItem }
      });
    } else if(selectedItem?.transaction_type === 1 && selectedItem.signature_url !== null) {
      this.getSignOnReceipt(selectedItem);
    } else{
      this.openInfoAlert('Income entries are currently unavailable at this facility.');
    }
  }

  getSignOnReceipt(selectedItem: ISelectedSingleRow['selectedRow']): void {
    this.dialog.open(ExpensePaymentProofModalComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: {
        id: selectedItem?.id,
        type:'receipt'
      }
    });

  }

  sendPaymentProof(selectedItem: string): void {
    this.dialog.open(ExpensePaymentProofModalComponent, {
      maxWidth: '500px',
      width: '93%',
      data: {
        id: selectedItem,
        type:'proof'
      },
      disableClose: true
    });
  }

  checkAndRefreshDataTable(
    res:
      | { listData: IGetAttachment[]; refresh: boolean }
      | { listData: IGetComment[]; refresh: boolean }
  ) {
    if (res?.refresh) {
      this.dataTableService.setRefreshStatus(true);
    }
  }

  clone(selectedItem: ISelectedSingleRow['selectedRow']): void {
    const cashExpenseId = selectedItem?.id;
    this.router.navigate(['/manage/cashexp/new-cash'], {
      queryParams: { id: cashExpenseId , isClone: true}
    });
  }

  onCashExpenseExport(event: ICashExpenseExport) {
    this.exportLoading.set(true);
    this.cashexpService.exportCashExpense(event)
    .pipe(finalize(() => this.exportLoading.set(false)),take(1))
    .subscribe((res) => {
      if(res.success){
        window.open(res.data.url, '_blank');
      }
    });
  }

  showCashExpenseTransaction(event:boolean){
    this.selectedPanelButton = event ? 'transaction_list' : 'bank_accounts';
  }

  getCashExpenseSummary() {
    this.isSummaryLoading.set(true);
    this.subscriptions.push(
      this.cashexpService.getCashExpenseSummary()
      .pipe(finalize(() => this.isSummaryLoading.set(false)))
      .subscribe((res) => {
        if(res.success){
          this.cashExpenseSummary.set(res.data);
        }
      })
    );
  }


  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }

  // PARENT CLASS END

  colDefId = {
    minWidth: 30,
    headerName: '',
    field: 'id',
    suppressFloatingFilterButton: true,
    maxWidth: 50,
    checkboxSelection: true,
    floatingFilterComponent: 'headerCheckBoxComponent',
    filter: 'agTextColumnFilter',
    headerCheckboxSelection: true,
    showDisabledCheckboxes: true,
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    sortable: false,
    cellRenderer: () => ''
  };

  colDefAmount = {
    minWidth: 80,
    maxWidth: 120,
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      isAmountField: true
    }
  };

  colDefAcc = {
    minWidth: 175,
    headerName: 'A/C',
    field: 'bank_account_nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dtMultiDropdownCashComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    // cellRenderer: 'V3DTCommonFilterComponent',
    // cellRendererParams: {
    //   suffixOptionalField: 'bank_account_account_name'
    // }
  };

  colDefPayee = {
    minWidth: 175,
    headerName: environment.env_id === 'compass' ? 'Vendor' : 'Payee',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'payeeListDropDownFilterComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3PayeeNameComponent',
    cellRendererParams: {
      payeeField: 'encrypted_payee_id'
    }
  };

  colDefMemo = {
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 400,
    headerName: 'Memo',
    field: 'memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefDate = {
    minWidth: 120,
    headerName: 'Date',
    field: 'transaction_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      type: 'date'
    }
  };

  colDefSerialNo = {
    minWidth: 80,
    headerName: 'Serial No',
    field: 'serial_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefBy = {
    minWidth: 80,
    headerName: 'By',
    field: 'users.name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererForExport: (params: ICellRendererParams) => 
      // Only For when Export Table data
       params?.data?.name
  };

  colDefCategory = {
    minWidth: 70,
    headerName: 'Category',
    field: 'catagory_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefType = {
    minWidth: 130,
    headerName: 'Type',
    field: 'transaction_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'cashExpenseAddAttachmentsComments',
    cellRendererForExport: (params: ICellRendererParams) => {
      // Only For when Export Table data
      const value = params?.data?.transaction_type;
      let status = '';
      if (value === 1) {
        status = 'Expense';
      } else if (value === 2) {
        status = 'Income';
      }
      return status;
    }
  };

  colDefPayeeAcNo = {
    minWidth: 80,
    headerName: 'Payee A/c No',
    field: 'account_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefInvoiceNo = {
    minWidth: 80,
    headerName: 'Invoice No',
    field: 'invoice_no',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefCreatedAt = {
    minWidth: 120,
    headerName: 'Created Time',
    field: 'cash_expenses.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date', isFormatDate: true },
    cellRendererForExport: (params: ICellRendererParams) => 
      // Only For when Export Table data
       params?.data?.created_at
  };

  colDefOrderForBank = {
    minWidth: 40,
    headerName: 'Order',
    field: 'order_for_bank',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefAction = {
    minWidth: 80,
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 150,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };


  colDefPreviousBalance ={
    minWidth: 40,
    headerName: 'Previous Balance',
    field: 'previous_balance',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    sortable: false,
  }
  colDefCurrentBalance ={
    minWidth: 40,
    headerName: 'Current Balance',
    field: 'current_balance',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    sortable: false,
  }
  // SET COLUMN FEILDS
  columnDefs = [
    this.colDefId,
    this.colDefAction,
    this.colDefAmount,
    this.colDefAcc,
    this.colDefPayee,
    this.colDefMemo,
    this.colDefDate,
    this.colDefSerialNo,
    this.colDefBy,
    this.colDefCategory,
    this.colDefCreatedAt,
    this.colDefType,
    this.colDefPayeeAcNo,
    this.colDefInvoiceNo,
    this.colDefOrderForBank,
    this.colDefPreviousBalance,
    this.colDefCurrentBalance
  ];

  columnFields = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'id_amount',
      name: 'Amount',
      isDisabled: true,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'id_acc',
      name: 'A/C',
      isDisabled: false,
      colDef: this.colDefAcc,
      isChecked: true
    },
    {
      id: 'id_payee',
      name: 'Payee',
      isDisabled: true,
      colDef: this.colDefPayee,
      isChecked: true
    },
    {
      id: 'id_memo',
      name: 'Memo',
      isDisabled: false,
      colDef: this.colDefMemo,
      isChecked: true
    },
    {
      id: 'id_date',
      name: 'Date',
      isDisabled: false,
      colDef: this.colDefDate,
      isChecked: true
    },
    {
      id: 'id_serialNo',
      name: 'Serial No',
      isDisabled: false,
      colDef: this.colDefSerialNo,
      isChecked: true
    },
    {
      id: 'id_by',
      name: 'By',
      isDisabled: false,
      colDef: this.colDefBy,
      isChecked: true
    },
    {
      id: 'id_category',
      name: 'Category',
      isDisabled: false,
      colDef: this.colDefCategory,
      isChecked: true
    },
    {
      id: 'id_type',
      name: 'Type',
      isDisabled: false,
      colDef: this.colDefType,
      isChecked: true
    },
    {
      id: 'id_payeeAcNo',
      name: 'Payee A/c No',
      isDisabled: false,
      colDef: this.colDefPayeeAcNo,
      isChecked: true
    },
    {
      id: 'id_invoiceNo',
      name: 'Invoice No',
      isDisabled: false,
      colDef: this.colDefInvoiceNo,
      isChecked: true
    },
    {
      id: 'id_createdAt',
      name: 'Created Time',
      isDisabled: false,
      colDef: this.colDefCreatedAt,
      isChecked: true
    },
    {
      id: 'id_order',
      name: 'Order',
      isDisabled: false,
      colDef: this.colDefOrderForBank,
      isChecked: true
    },
    {
      id: 'id_action',
      name: 'Action',
      isDisabled: true,
      colDef: this.colDefAction,
      isChecked: true
    },
    {
      id: 'id_previous_balance',
      name: 'Previous Balance',
      isDisabled: false,
      colDef: this.colDefPreviousBalance,
      isChecked: true
    },
    {
      id: 'id_current_balance',
      name: 'Current Balance',
      isDisabled: false,
      colDef: this.colDefCurrentBalance,
      isChecked: true
    }
  ];


/**
 * @description
 * Mapper function to get the balance of the cash expense, passing a
 * mergeMap as input to the common data table and use tap operator to get the balance of the cash expense
 * append the balance to the row data. the async function will take row data as input and return the row data with balance.
 * use firstValueFrom to get the balance of the cash expense.
 * @param val
 * @returns
 */
  mapper = mergeMap(async (val: ICoulmnDefFieldsResponse<CashExpenseData>) => {

    if (!val.rowData.length) return val;

    const bankIds = val.rowData.map((item: CashExpenseData) => item.id.toString());
    const balancePromise = firstValueFrom(
      this.cashexpService.getCashExpenseBalance(bankIds,1),
    );
    const [balancesResult] = await Promise.allSettled([balancePromise]);
    
    if (balancesResult.status === 'fulfilled' && balancesResult.value.success) {
      const balances = balancesResult.value.data.balances;
      const balanceData = Object.keys(balances);
      
      val.rowData.forEach((el: CashExpenseData) => {
        balanceData.forEach((item: string) => {
          if (el?.id.toString() === item) {
            el.previous_balance = balances[item].previous_balance || '0';
            el.current_balance = balances[item].current_balance || '0';
          }
        });
      });
    }
    return val;
  });

}
