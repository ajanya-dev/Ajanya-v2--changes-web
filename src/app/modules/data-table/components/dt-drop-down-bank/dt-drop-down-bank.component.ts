import { V3DataTableService } from './../../../v3-data-table/services/v3-data-table.service';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { AgFloatingFilterComponent } from '@ag-grid-community/angular';
import { IBankDropdown } from 'src/app/models/bank';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { toObservable } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-dt-drop-down-bank',
  templateUrl: './dt-drop-down-bank.component.html',
  styleUrls: ['./dt-drop-down-bank.component.scss'],
  standalone: true,
  imports: [NgSelectModule, FormsModule,NgClass]
})
export class DtDropDownBankComponent
  implements AgFloatingFilterComponent, OnInit, OnDestroy
{
  private bankService = inject(BankAccountsService);
  private sharedService = inject(SharedService);
  public layoutService = inject(LayoutService);
  private dataTableService = inject(DataTableService);
  private v3dataTableService = inject(V3DataTableService);

  placeholder = 'Select Bank Account';
  selectedId!: string;
  addTag = false;
  name: string = 'id';
  verifyColor = false;
  selectedItem: IBankDropdown | string | undefined;
  page = 1;
  searchTerm: string = '';
  bankAccounts: IBankDropdown[] = [];
  subscriptions: Subscription[] = [];

  params: IFloatingFilterParams;
  currentValue = '';
  // getData!: any;
  // optionResult: any;
  getCurrentColumn: string;
  searchTimeout: ReturnType<typeof setTimeout>;
  cellValue$ = toObservable(this.dataTableService.selectedCellValueSignal);
  isFromDepositSlip = signal(false);

  ngOnInit(): void {
    this.getNewBankData();
    this.autoPopulate();
  }

  agInit(params: IFloatingFilterParams & { tableName: string }): void {
    this.params = params;
    this.getCurrentColumn = this.params.column.getColId();
    if (params?.tableName === 'check_list_table') {
      this.autoPopulate();
    }
    this.filterBankAccount();
    
    const colDef = params.column.getColDef();
    const renderedPage = colDef.floatingFilterComponentParams?.page;
    this.isFromDepositSlip.set(renderedPage === 'depositSlip');
    this.loadBankAccounts();

  }

  /**
   * @description Filters the bank account column in the data table based on the selected cell value.
   */
  filterBankAccount(): void {
    this.subscriptions.push(
      this.cellValue$.subscribe((res) => {
        if ((res?.field === 'bank' || res?.isBank) && res.filter) {
          this.selectedItem = res.filter;
          this.params.parentFilterInstance(
            (instance: {
              onFloatingFilterChanged: (type: string, filter: string) => void;
            }) => {
              instance.onFloatingFilterChanged('contains', res.filter);
            }
          );

          this.v3dataTableService.defaultPayload.filterModel[
            this.params.column.getColId()
          ] = {
            filter: res.filter,
            filterType: 'text',
            type: 'contains'
          };
          this.v3dataTableService.refreshV3DataTable();
        }
      })
    );
  }

  getNewBankData(): void {
    this.sharedService.getNewBankCreatedData().subscribe((result) => {
      if (result == null || result == undefined || result == '') {
        this.selectedItem = undefined;
        this.placeholder;
      }

      if (!result) {
        return;
      }

      //******************for create new bank  and set that name automaticaly into the bank acc field******** */
      this.subscriptions.push(
        this.bankService
          .getBankAccounts(this.page, undefined, this.addTag ? 1 : undefined,undefined,undefined,undefined,undefined,{fromDepositSlip: this.isFromDepositSlip() ? true : undefined}
        )
          .subscribe((res) => {
            this.bankAccounts = res.data;
          })
      );

      //***********************in edit case use this section******************** */
      if (result) {
        if (result.bankAccountId != undefined) {
          //Call API only when create new account
          this.subscriptions.push(
            this.bankService
              .viewBankById(result.bankAccountId)
              .subscribe((res) => {
                this.selectedItem = res.data.bankAccountName;
              })
          );
          return;
        }
        this.selectedItem = result.bankAccountName;
      }
    });
  }

  /**
   * Method for auto populating values if filter already exist
   */
  autoPopulate(): void {
    const payload = this.dataTableService.dataTablePayload;
    const filterName = this.params.column.getColId();
    if (payload) {
      if (
        payload?.filterModel?.bank_account_nick_name &&
        filterName === 'bank_account_nick_name'
      ) {
        this.selectedItem =
          payload?.filterModel?.bank_account_nick_name?.filter;
      }
    }
  }

  onParentModelChanged() {
    // When the filter is empty we will receive a null value here
    // if (!parentModel) {
    //   this.currentValue = null;
    // } else {
    //   this.currentValue = parentModel.filter;
    // }
  }

  valueChanged(): void {
    if (this.selectedItem == null) {
      // Remove the filter
      this.params.parentFilterInstance((instance) => {
        instance.onFloatingFilterChanged(null, null);
      });
      return;
    }

    this.params.parentFilterInstance(
      (instance: {
        onFloatingFilterChanged: (type: string, filter: string) => void;
      }) => {
        instance.onFloatingFilterChanged(
          'contains',
          typeof this.selectedItem === 'object'
            ? this.selectedItem?.nickName
            : ''
        );
      }
    );

    this.v3dataTableService.defaultPayload.filterModel[
      this.params.column.getColId()
    ] = {
      filter:
        typeof this.selectedItem === 'object'
          ? this.selectedItem?.nickName
          : '',
      filterType: 'text',
      type: 'contains'
    };
    this.v3dataTableService.refreshV3DataTable();
  }

  loadBankAccounts(): void {    
    this.subscriptions.push(
      this.bankService
        .getBankAccounts(this.page, undefined, this.addTag ? 1 : undefined,undefined,undefined,undefined,undefined,{fromDepositSlip: this.isFromDepositSlip() ? true : undefined}
      )
        .subscribe((res) => {
          if (res.success) {
            this.bankAccounts = res.data;
          }
        })
    );
  }

  //........get next 10 element on each scroll event.....................
  onScrollToEnd(): void {
    this.subscriptions.push(
      this.bankService
        .getBankAccounts(
          this.page + 1,
          this.searchTerm,
          this.addTag ? 1 : undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          {fromDepositSlip: this.isFromDepositSlip() ? true : undefined}
        )
        .subscribe((res) => {
          this.page++;

          const that = this;
          res.data.forEach((element: IBankDropdown) => {
            that.bankAccounts.push(element);
          });
        })
    );
  }

  //................get data based on search term........
  search(event: KeyboardEvent): void {
    clearTimeout(this.searchTimeout);

    this.searchTerm = (event?.target as HTMLInputElement).value;

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.subscriptions.push(
        this.bankService
          .getBankAccounts(this.page, this.searchTerm)
          .subscribe((res) => {
            this.bankAccounts = res.data;
          })
      );
    }, 600);
  }

  /**
   * @description CLears the changes made.
   */

  clear(): void {
    this.v3dataTableService.defaultPayload.filterModel = {};
    this.v3dataTableService?.gridApi?.deselectAll();
    this.v3dataTableService.refreshV3DataTable();
  }

  ngOnDestroy(): void {
    this.sharedService.setNewBankCreatedData();

    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
