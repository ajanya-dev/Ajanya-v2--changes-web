import { Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { ValueGetterParams } from '@ag-grid-community/core';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { Subject, takeUntil } from 'rxjs';
import { CheckAddAttachmentCommentComponent } from '../../../../check/pages/check-list/addAttachmentComment';
import { DtSearchBoxComponent } from '../../../../data-table/components/dt-search-box/dt-search-box.component';
import { NewInternationalAccountComponent } from '../../../payee-v2/modals/new-international-account/new-international-account.component';
import { PayeeDataV35Service } from '../../v35-services/payee-data-v35.service';
import { DtInternationalBankActionV35Component } from '../international-bank-action-v35/international-bank-action-v35.component';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

@Component({
  selector: 'app-payee-international-acc-v35',
  templateUrl: './payee-international-acc-v35.component.html',
  styleUrls: ['./payee-international-acc-v35.component.scss'],
  standalone: true,
  imports: [CommonButtonV35Component, V3DataTableComponent]
})
export class PayeeInternationalAccV35Component implements OnInit, OnDestroy {
  @Input() payeeId: string;
  /** dependancy injection using inject method */
  private v3DataTableService = inject(V3DataTableService);
  private dialog = inject(MatDialog);
  private payeeDataService = inject(PayeeDataV35Service);

  /** variables */

  destroy$ = new Subject();
  tableId = DTTableId.internationalPaymentPayeeAccount; // Data Table Id
  frameworkComponents = {
    actionComponent: DtInternationalBankActionV35Component,
    SearchBoxComponent: DtSearchBoxComponent,
    addAttachmentComment: CheckAddAttachmentCommentComponent
  };

  /**
   * @description column definitions
   */

  colDefAccountType = {
    headerName: 'Account Type',
    field: 'account_type',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    maxWidth: 300,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: true
  };

  colDefIdentifierType = {
    headerName: 'Identifier Type',
    field: 'bank_identifier_type',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    maxWidth: 300,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: true
  };

  colDefAccountNumber = {
    headerName: 'Account Number',
    field: 'account_number',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: true
  };

  colDefBankName = {
    headerName: 'Bank Name',
    field: 'bank_name',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: true
  };

  colDefcountry: ICoulmnDefFields = {
    headerName: 'Country',
    field: 'bank_account_details.beneficiary_country',
    suppressFloatingFilterButton: true,
    minWidth: 70,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: true,
    valueGetter: (params: ValueGetterParams) =>
      params.data?.bank_account_details?.beneficiary_country
  };

  colDefSwiftcode = {
    headerName: 'SWIFT / BIC',
    field: 'swift_or_bic',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: true
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

  columnDefs: ICoulmnDefFields[] = [
    this.actionField,
    this.colDefAccountNumber,
    this.colDefBankName,
    this.colDefAccountType,
    this.colDefIdentifierType,
    this.colDefSwiftcode,
    this.colDefcountry
  ];

  columnFields: IDtColumnFields[] = [
    {
      id: 'account_number',
      name: 'Account Number',
      colDef: this.colDefAccountNumber,
      isChecked: true
    },
    {
      id: 'bank_name',
      name: 'Bank Name',
      isDisabled: false,
      colDef: this.colDefBankName,
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
      colDef: this.colDefIdentifierType,
      id: 'bank_identifier_type',
      name: 'Identifier Type',
      isDisabled: false,
      isChecked: true
    },
    {
      colDef: this.colDefSwiftcode,
      id: 'swift_or_bic',
      name: 'SWIFT / BIC',
      isDisabled: false,
      isChecked: true
    },
    {
      colDef: this.colDefcountry,
      id: 'bank_account_details.beneficiary_country',
      name: 'Country',
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

  actionComponentProp = {
    deleteButton: true,
    editButton: true
  };

  ngOnInit(): void {
    this.payloadSetting();
  }

  /**
   * @description setting payload for loading ag grid and refreshing ag grid table
   */
  payloadSetting() {
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

  getSelectedPayee() {
    toObservable(this.payeeDataService.payeeDataSignal)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res?.encryptedId) {
          this.payeeId = res?.encryptedId;
          this.payloadSetting();
        }
      });
  }

  /**
   * @description to add new international bank account
   */
  addInternationalPayeeBankAc() {
    const dialogRef = this.dialog.open(NewInternationalAccountComponent, {
      maxWidth: '95%',
      width: '600px',
      disableClose: true,
      data: {
        editMode: false,
        id: this.payeeId
      }
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.v3DataTableService.refreshV3DataTable();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
