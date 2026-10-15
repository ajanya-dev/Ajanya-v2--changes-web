import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output
} from '@angular/core';
import { IBankData } from 'src/app/models/bank';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { Subject } from 'rxjs';
import { RowClickedEvent } from '@ag-grid-community/core';
import { UserPermissionDataTableComponent } from '../user-permission-data-table/user-permission-data-table.component';
import { UserManagementV35Service } from '../../service/user-management-v35.service';

@Component({
  selector: 'app-user-permission-bank-account',
  standalone: true,
  imports: [UserPermissionDataTableComponent],
  templateUrl: './user-permission-bank-account.component.html',
  styleUrl: './user-permission-bank-account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserPermissionBankAccountComponent implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private userManagementV35Service = inject(UserManagementV35Service);

  tableId = DTTableId.bankAccounts;
  destroy$ = new Subject();
  @Output() rowClicked = new EventEmitter();

  permissionName = input('');

  frameworkComponents = {
    SearchBoxComponent: DtSearchBoxComponent
  };

  colDefId = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'boxId',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: false,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    pinned: 'left',
    cellClass: 'flex flex-col justify-center pl-[6px]',
    headerClass: ' pl-[8px]'
  };

  colDefBankAccName = {
    headerName: 'Bank Account Name',
    field: 'bank_account_account_name',
    suppressFloatingFilterButton: true,
    minWidth: 250,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { data: IBankData }) =>
      params.data.bank_account_account_name
  };

  colDefNickName = {
    headerName: 'Bank Account Nick Name',
    field: 'bank_account_nick_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 250,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefBankName = {
    headerName: 'Bank Name',
    field: 'bank_name',
    suppressFloatingFilterButton: true,
    minWidth: 250,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,

    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { data: IBankData; value: string }): string =>
      params.value
  };

  colDefAccountNumber = {
    headerName: 'Bank Account Number',
    field: 'bank_account_account_number',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 250,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { data: IBankData }) =>
      params.data.truncatedBankAccNumber
  };

  columnDefs = [this.colDefId, this.colDefBankAccName, this.colDefNickName,this.colDefBankName,this.colDefAccountNumber];

  ngOnInit(): void {
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
    this.v3DataTableService.refreshV3DataTable();
  }

  onRowClicked(event: RowClickedEvent): void {
    const rowData = event.data;
    const currentPermissionName = this.permissionName();
    
    // Extract the unique identifier for the row
    const rowId = rowData?.encrypted_bankacc_id;
    
    // Update the permissionBankId signal
    this.userManagementV35Service.permissionBankId.update((currentValue) => {
      // Retrieve the current mapping for the permission
      const currentMapping = currentValue[currentPermissionName] || {};
      
      // Toggle the selection state of the row
      const newSelectionState = !currentMapping[rowId];
      
      // Return the updated state
      return {
        ...currentValue,
        [currentPermissionName]: {
          ...currentMapping,
          [rowId]: newSelectionState
        }
      };
    });
    this.rowClicked.emit(currentPermissionName);
  }
}
