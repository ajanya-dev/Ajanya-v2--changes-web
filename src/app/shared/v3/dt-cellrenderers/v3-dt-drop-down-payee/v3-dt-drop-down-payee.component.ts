import { IFloatingFilterParams } from '@ag-grid-community/core';
import { Component, OnDestroy, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import {
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import {
  selectFilteredPayees,
  selectIsPayeesByIdLoading,
  selectIsPayeesFilterOn,
  selectIsPayeesLoading,
  selectPayees
} from 'src/app/modules/store/payees/payees.selectors';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';

interface IUpdatedFloatingFilter extends IFloatingFilterParams {
  tableName?: string;
}

@Component({
  selector: 'app-v3-dt-drop-down-payee',
  templateUrl: './v3-dt-drop-down-payee.component.html',
  styleUrls: ['./v3-dt-drop-down-payee.component.scss'],
  standalone: true,
  imports: [NgSelectModule, FormsModule, AsyncPipe, WhiteLabelPipe]
})
export class V3DtDropDownPayeeComponent implements OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private store = inject(Store);
  private sharedService = inject(SharedService);
  dropDownItem: IPayeeDropdown | string | undefined;
  currentValue = '';
  searchTerm = '';
  subscriptions: Subscription[] = [];
  params!: IUpdatedFloatingFilter;
  getCurrentColumn: string;
  searchTimeout: ReturnType<typeof setTimeout>;
  filterModelItem: ISelectBoxFilterArray;

  payees$: Observable<IPayeeDropdown[]>;
  payeesFiltered$: Observable<IPayeeDropdown[]>;
  selectIsPayeesFilterOn$: Observable<boolean>;
  selectIsPayeesLoading$: Observable<boolean>;
  selectIsPayeesByIdLoading$: Observable<boolean>;

  agInit(params: IUpdatedFloatingFilter): void {
    this.params = params;
    this.initStoreSelectors();
    this.getCurrentColumn = this.params.column.getColId();
    this.clearFilters();
  }

  /**
   * @description This function is specifically created for the payments table.
   * It is used to clear the selected payee when switching tabs.
   * Listens for tab switch changes from `switchPaymentTableTab$`.
   */
  clearFilters() {
    this.subscriptions.push(
      this.v3DataTableService.switchPaymentTableTab$.subscribe((res) => {
        if (res) {
          this.v3DataTableService.clearStoredData();
          this.dropDownItem = undefined;
        }
      })
    );
  }

  /**
   * Initializes store selectors and dispatches an action to load payees.
   */
  initStoreSelectors() {
    this.store.dispatch(payeesActions.loadPayees({ searchTerm: '' }));
    this.payees$ = this.store.select(selectPayees);
    this.payeesFiltered$ = this.store.select(selectFilteredPayees);
    this.selectIsPayeesFilterOn$ = this.store.select(selectIsPayeesFilterOn);
    this.selectIsPayeesLoading$ = this.store.select(selectIsPayeesLoading);
    this.selectIsPayeesByIdLoading$ = this.store.select(
      selectIsPayeesByIdLoading
    );
    if (
      this.v3DataTableService.selectedPayee &&
      this.params?.tableName === 'payment_table'
    ) {
      this.dropDownItem = this.v3DataTableService.selectedPayee.name;
    }
  }

  onParentModelChanged() {
    // This method is mandatory for this component. Use it if needed and remove this comment.
  }

  /**
   * @description Gets data based on search term.
   * @param event - event
   */
  search(event: KeyboardEvent | FocusEvent) {
    clearTimeout(this.searchTimeout);
    this.searchTerm = (event?.target as HTMLInputElement).value;
    const data = this.searchTerm.replace(/&/g, '%26');
    this.searchTerm = data;
    this.searchTimeout = setTimeout(() => {
      this.store.dispatch(
        payeesActions.loadPayees({ searchTerm: this.searchTerm })
      );
    }, 600);
  }

  /**
   * @description Method invoked on `ngModelChange`.
   */
  valueChanged() {
    if (this.params?.tableName === 'payment_table') {
      this.v3DataTableService.selectedPayee = this
        .dropDownItem as IPayeeDropdown;
    } else {
      this.v3DataTableService.selectedPayee = undefined;
    }
    this.currentValue = (this.dropDownItem as IPayeeDropdown)?.name ?? '';
    if (this.currentValue === '') {
      this.setFilterModel();
      return;
    }
    const filter = {
      filter: this.currentValue,
      filterType: 'text',
      type: 'contains'
    };
    this.setFilterModel(filter);
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onScrollToEnd() {
    this.store.dispatch(payeesActions.loadMorePayees({ skipEmpty: true }));
  }

  /**
   * @description CLears the changes made.
   */
  clear() {
    this.searchTerm = '';
    this.store.dispatch(
      payeesActions.loadPayees({ searchTerm: this.searchTerm })
    );
  }

  /**
   * @description Creates payload object for filtering and returns it.
   * @param filterValue - String representing value to be filtered.
   * @returns Filter payload object.
   */
  createFilterPayload(
    selectBoxFilterValues: ISelectBoxFilterValues | undefined,
    filterName: string
  ) {
    const filterPayloadForGrid: ISelectBoxFilterArray = {
      [filterName]: selectBoxFilterValues!
    };
    return filterPayloadForGrid;
  }

  /**
   * @description Method to update the filter in default payload and update the table.
   * @param filter - Parent filter model.
   * @param event Filter changed event from grid.
   */
  setFilterModel(filter?: ISelectBoxFilterValues | undefined) {
    const filterName = this.params.column.getColId();
    this.v3DataTableService.updatePayloadData();
    if (this.currentValue === '') {
      this.v3DataTableService.updateV3DataTableByRemovingFilter = [filterName];
      return;
    }
    if (filter) {
      this.filterModelItem = this.createFilterPayload(filter, filterName);
      this.v3DataTableService.updateV3DataTable = this.filterModelItem;
    }
  }

  ngOnDestroy(): void {
    this.sharedService.setNewBankCreatedData();
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
