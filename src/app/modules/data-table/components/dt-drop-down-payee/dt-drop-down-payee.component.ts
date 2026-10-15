import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  IPayeeDropdown,
  IViewPayee
} from 'src/app/modules/payee/payee-v2/model/payee';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-dt-drop-down-payee',
  templateUrl: './dt-drop-down-payee.component.html',
  styleUrls: ['./dt-drop-down-payee.component.scss'],
  standalone: true,
  imports: [NgSelectModule, FormsModule, NgFor]
})
export class DtDropDownPayeeComponent implements OnInit, OnDestroy {
  selectedId!: string;
  selectedItem: any;

  page = 1;
  searchTerm: any = '';
  payees: IPayeeDropdown[] = [];
  subscriptions: Subscription[] = [];

  params!: any;
  currentValue = '';
  getData!: any;
  optionResult: any;
  getCurrentColumn: any;
  searchTimeout: any;

  constructor(
    private _payeeService: PayeeService,
    private _sharedService: SharedService,
    private dataTableService: DataTableService
  ) {}

  ngOnInit(): void {
    this._sharedService.getNewPayeeCreatedData().subscribe((result) => {
      if (result == null || result == undefined || result == '') {
        this.selectedItem = null;
      }

      if (!result) {
        return;
      }

      //******************for create new bank  and set that name automaticaly into the bank acc field******** */
      this.subscriptions.push(
        this._payeeService.getPayees(this.page).subscribe((res) => {
          this.payees = res.data;
        })
      );

      //***********************in edit case use this section******************** */
      if (result) {
        if (result.bankAccountId != undefined) {
          //Call API only when create new account
          this.subscriptions.push(
            this._payeeService.showPayee(result.payeeId).subscribe((res) => {
              const payeeDetails: IViewPayee = res.data;
              this.selectedItem = payeeDetails.name;
            })
          );
          return;
        }
        this.selectedItem = result.payeeName;
      }
    });
    this.autoPopulate();
  }

  agInit(params: any): void {
    this.params = params;
    this.loadPayees();

    this.getCurrentColumn = this.params.column.colId;
    if (params?.tableName === 'check_list_table') {
      this.autoPopulate();
    }
  }

  /**
   * Method for auto populating values if filter already exist
   */
  autoPopulate() {
    const payload = this.dataTableService.dataTablePayload;
    const filterName = this.params.column.getColId();
    if (payload) {
      if (payload?.filterModel?.payee_name && filterName === 'payee_name') {
        this.selectedItem = payload?.filterModel?.payee_name?.filter;
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

  valueChanged() {
    if (this.selectedItem == null) {
      // Remove the filter
      this.params.parentFilterInstance((instance: any) => {
        instance.onFloatingFilterChanged(null, null);
      });
      return;
    }

    this.params.parentFilterInstance((instance: any) => {
      instance.onFloatingFilterChanged('contains', this.selectedItem.name);
    });
  }

  loadPayees() {
    this.subscriptions.push(
      this._payeeService.getPayees(this.page).subscribe((res) => {
        if (res.success) {
          this.payees = res.data;
        }
      })
    );
  }

  //........get next 10 element on each scroll event.....................
  onScrollToEnd() {
    this.subscriptions.push(
      this._payeeService
        .getPayees(this.page + 1, this.searchTerm)
        .subscribe((res) => {
          this.page++;
          const that = this;
          res.data.forEach((element: any) => {
            that.payees.push(element);
          });
        })
    );
  }

  //................get data based on search term........
  search(event: any) {
    clearTimeout(this.searchTimeout);
    this.searchTerm = event.target.value;

    const data = this.searchTerm.replace(/&/g, '%26');
    this.searchTerm = data;

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.subscriptions.push(
        this._payeeService
          .getPayees(this.page, this.searchTerm)
          .subscribe((res) => {
            this.payees = res.data;
          })
      );
    }, 600);
  }

  clear() {
    this.searchTerm = '';
    this.loadPayees();
  }

  ngOnDestroy(): void {
    this._sharedService.setNewBankCreatedData();

    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
