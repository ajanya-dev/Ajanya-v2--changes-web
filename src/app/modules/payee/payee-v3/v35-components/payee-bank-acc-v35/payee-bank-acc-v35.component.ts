import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IBank } from 'src/app/models/bank';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { NewBankAccountModalComponent } from 'src/app/shared/bank-modal/modals/new-bank-account-modal/new-bank-account-modal.component';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { CheckAddAttachmentCommentComponent } from '../../../../check/pages/check-list/addAttachmentComment';
import { DtSearchBoxComponent } from '../../../../data-table/components/dt-search-box/dt-search-box.component';
import { DtBankActionButtonV35Component } from '../bank-action-button-v35/bank-action-button-v35.component';
import { PayeeDataV35Service } from '../../v35-services/payee-data-v35.service';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-payee-bank-acc-v35',
  templateUrl: './payee-bank-acc-v35.component.html',
  styleUrls: ['./payee-bank-acc-v35.component.scss'],
  standalone: true,
  imports: [CommonButtonV35Component, V3DataTableComponent]
})
export class PayeeBankAccV35Component implements OnDestroy, OnInit {
  /** Dependancy injection using inject method */
  public dialogRef = inject(MatDialog);
  public alertService = inject(AlertService);
  private v3DataTableService = inject(V3DataTableService);
  public payeeDataService = inject(PayeeDataV35Service);

  @Input() payeeId: string;

  tableId = DTTableId.payeeBankAccounts; // Data Table Id
  destroy$ = new Subject();
  selectedRows: IBank[];

  frameworkComponents = {
    actionComponent: DtBankActionButtonV35Component,
    SearchBoxComponent: DtSearchBoxComponent,
    addAttachmentComment: CheckAddAttachmentCommentComponent,
    V3DTCommonFilterComponent
  };

  /**
   * @description each column descritions
   */
  colDefAccountHolderName = {
    headerName: 'Bank Account Holder Name',
    field: 'bank_name',
    suppressFloatingFilterButton: true,
    minWidth: 220,
    maxWidth: 300,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: true,
    headerClass: 'pl-[12px]',
    cellClass: 'pl-[10px] flex flex-col justify-center',
    cellRenderer: 'V3DTCommonFilterComponent',
  };

  colDefRoutingNumber = {
    headerName: 'Routing Number',
    field: 'routing_number',
    suppressFloatingFilterButton: true,
    minWidth: 160,
    maxWidth: 300,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'V3DTCommonFilterComponent',
  };

  colDefAccountNumber = {
    headerName: 'Account Number',
    field: 'account_number',
    suppressFloatingFilterButton: true,
    minWidth: 160,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'V3DTCommonFilterComponent',
  };

  colDefAccountType = {
    headerName: 'Account Type',
    field: 'account_type',
    suppressFloatingFilterButton: true,
    minWidth: 110,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'V3DTCommonFilterComponent',
  };

  colDefDefaultForDD = {
    headerName: 'Default For DD',
    field: 'is_default_for_direct_deposit',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { value: number; getData: boolean }) => {
      if (params.getData) {
        if (params.value === 1) {
          return 'Yes';
        }
        return '';
      }
      if (params.value === 1) {
        return ' <i class="fa-solid fa-check"></i>   <i  title="This will be used as default Bank Account for Direct Deposit/ACH to this Payee" class="fas fa-question-circle cursor-pointer "></i> ';
      }
      return '';
    }
  };

  actionField = {
    headerName: 'Action',
    field: 'id',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    maxWidth: 120,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false
  };

  /**
   * @description column definitions
   */
  columnDefs: ICoulmnDefFields[] = [
    this.actionField,
    this.colDefAccountHolderName,
    this.colDefRoutingNumber,
    this.colDefAccountNumber,
    this.colDefAccountType,
    this.colDefDefaultForDD
  ];

  // PASS  FIELD DATA
  columnFields = [
    {
      id: 'bank_name',
      name: 'Bank Account Holder Name',
      colDef: this.colDefAccountHolderName,
      isChecked: true
    },
    {
      id: 'routing_number',
      name: 'Routing Number',
      isDisabled: false,
      colDef: this.colDefRoutingNumber,
      isChecked: true
    },
    {
      id: 'account_number',
      name: 'Account Number',
      isDisabled: false,
      colDef: this.colDefAccountNumber,
      isChecked: true
    },
    {
      colDef: this.colDefAccountType,
      id: 'account_type',
      name: 'Account Type',
      isDisabled: false,
      isChecked: true
    },
    {
      colDef: this.colDefDefaultForDD,
      id: 'is_default_for_direct_deposit',
      name: 'Default For DD',
      isDisabled: false,
      isChecked: true
    },
    {
      colDef: this.actionField,
      id: 'id',
      name: 'Action',
      isDisabled: true,
      isChecked: true
    }
  ];

  /** filter for default direct deposit */
  FloatingFilterComponent = {
    selectBox: [
      {
        id: 'is_default_for_direct_deposit',
        values: [{ value: '1', name: ' Default DD ' }]
      }
    ]
  };

  actionComponentProp = {
    actionButton: true,
    eyeButton: false
  };

  constructor() {
    this.getPayeeData();
  }

  ngOnInit(): void {
    this.initializeDataTable();
  }

  /**
   * Method to get payeeData subject value
   */
  getPayeeData() {
    toObservable(this.payeeDataService.payeeDataSignal)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.payeeId = res.encryptedId || '';
          this.initializeDataTable();
        }
      });
  }

  /**
   * @description Setting default payload for loading ag grid and after setting refreshing the ag grid table
   */
  initializeDataTable() {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      payeeId: this.payeeId,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: []
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  /**
   * @description here this @function newBankAccount will open a modal for creating new bank account
   */
  newBankAccount() {
    const dialogRef = this.dialogRef.open(NewBankAccountModalComponent, {
      maxWidth: '95%',
      width: '500px',
      data: {
        editMode: false,
        id: this.payeeId
      },
      disableClose: true
    });
    dialogRef.afterClosed().subscribe((response) => {
      if (response?.success) {
        this.alertService.successAlert({
          title: 'Success',
          content: ' Bank account added successfully',
          close: true
        });
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  /**
   * @descripiton unsubscribe the whole subscritions subscribed from this component
   * when the component is destroyed
   */
  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
