import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { closeOnOutsideScroll } from 'src/app/shared/utils/close-on-outside-scroll.util';
import { Store } from '@ngrx/store';
import { Observable, Subscription, map, switchMap, take } from 'rxjs';
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
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IDefaultPayload } from 'src/app/models/v3-datatable';
import { WhiteLabelPipe } from 'src/app/pipes/white-label.pipe';
import { toObservable } from '@angular/core/rxjs-interop';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CommonButtonV35Component } from '../../../buttons/common-button-v35/common-button-v35.component';

interface IUpdatedFloatingFilter extends IFloatingFilterParams {
  tableName?: string;
  disablePermission?: boolean;
}

@Component({
  selector: 'app-dt-multi-dropdown-payee',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgSelectModule,
    FormsModule,
    AsyncPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltipModule,
    WhiteLabelPipe,
    CommonButtonV35Component
  ],
  templateUrl: './dt-multi-dropdown-payee.component.html',
  styleUrl: './dt-multi-dropdown-payee.component.scss'
})
export class DtMultiDropdownPayeeComponent implements OnDestroy {
  @ViewChild('ngSelect') select: NgSelectComponent;

  private v3DataTableService = inject(V3DataTableService);
  private store = inject(Store);
  public sharedService = inject(SharedService);
  private dataTableService = inject(DataTableService);
  public paymentsService = inject(PaymentsService);
  private checkService = inject(CheckService);
  private datePipe = inject(DatePipe);
  private userManagementV35Service = inject(UserManagementV35Service);
  private ngZone = inject(NgZone);
  private removeScrollListener?: () => void;

  searchTerm = '';
  showSearch = false;
  subscriptions: Subscription[] = [];
  isInFilterMode = signal<boolean>(false);
  params: IUpdatedFloatingFilter;
  searchTimeout: ReturnType<typeof setTimeout>;
  payees$: Observable<IPayeeDropdown[]>;
  payeesToList$: Observable<IPayeeDropdown[]>;
  payeesFiltered$: Observable<IPayeeDropdown[]>;
  selectIsPayeesFilterOn$: Observable<boolean>;
  selectIsPayeesLoading$: Observable<boolean>;
  selectIsPayeesByIdLoading$: Observable<boolean>;
  isV3table = false;

  selectedPayeeNamesString: string;
  selectedPayeesId: string[];
  selectedPayees: IPayeeDropdown[] = [];
  cellValue$ = toObservable(this.dataTableService.selectedCellValueSignal);

  agInit(params: IUpdatedFloatingFilter): void {
    this.params = params;
    this.initStoreSelectors();
    this.sharedService.selectedPayees.reset();
    this.getPayeeId();
  }

  /**
   * @description Retrieves the payee ID from the selected cell value.
   */
  getPayeeId() {
    this.subscriptions.push(
      this.cellValue$.subscribe((res) => {
        if (res?.field === 'payee' && res.filter) {
          const payeeId: string[] = [];
          payeeId.push(res.filter);
          this.onFilter(payeeId, res.payee as IPayeeDropdown);
        }
      })
    );
  }

  /**
   * Initializes store selectors and dispatches an action to load payees.
   */
  initStoreSelectors() {
    this.store.dispatch(
      payeesActions.loadPayees({
        searchTerm: '',
        skipEmpty: true,
        disablePermission: true
      })
    );
    this.payees$ = this.store.select(selectPayees);
    this.payeesFiltered$ = this.store.select(selectFilteredPayees);
    this.selectIsPayeesFilterOn$ = this.store.select(selectIsPayeesFilterOn);
    this.selectIsPayeesLoading$ = this.store.select(selectIsPayeesLoading);
    this.selectIsPayeesByIdLoading$ = this.store.select(
      selectIsPayeesByIdLoading
    );
    this.payeesToList$ = this.selectIsPayeesFilterOn$.pipe(
      switchMap((isFilterOn) =>
        isFilterOn ? this.payeesFiltered$ : this.payees$
      )
    );
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
        payeesActions.loadPayees({
          searchTerm: this.searchTerm,
          disablePermission: true
        })
      );
    }, 600);
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
    if (this.isInFilterMode()) {
      if (this.params.tableName === 'check_list_table') {
        this.dataTableService.dataTablePayload = {
          ...this.dataTableService.dataTablePayload,
          payeeIds: []
        } as IDefaultPayload;
        this.checkService.setTotalCheckSumPayeeIds([]);
        this.dataTableService.setRefreshStatus(true, 1);
      } else {
        this.v3DataTableService.defaultPayload = {
          ...this.v3DataTableService.defaultPayload,
          payeeIds: []
        };
        if (this.params.tableName === 'user-permission') {
          this.userManagementV35Service.refreshV3DataTable('payee-accounts');
        } else {
          this.v3DataTableService.refreshV3DataTable();
        }
      }
    }
    this.searchTerm = '';
    this.sharedService.selectedPayees.reset();
    this.selectedPayeeNamesString = '';
    this.isInFilterMode.set(false);
    this.store.dispatch(
      payeesActions.loadPayees({
        searchTerm: this.searchTerm,
        disablePermission: true
      })
    );
    this.v3DataTableService?.gridApi?.deselectAll();
  }

  applyFilter() {
    this.selectedPayeesId = this.sharedService.selectedPayees?.value.map(
      (obj) => obj.id
    );

    if (this.params.tableName === 'check_list_table') {
      this.checkService.setTotalCheckSumPayeeIds(this.selectedPayeesId);
      this.dataTableService.dataTablePayload = {
        ...this.dataTableService.dataTablePayload,
        payeeIds: this.selectedPayeesId
      } as IDefaultPayload;
      this.requestCheckListTotalCheckSum(this.selectedPayeesId);
      // Triggers CheckListComponent filter subscription to call getTotalCheckSum().
      this.dataTableService.setMainFilter('filterChanged', 'agGridFilter');
      this.dataTableService.setRefreshStatus(true, 1);
    } else {
      this.v3DataTableService.defaultPayload = {
        ...this.v3DataTableService.defaultPayload,
        payeeIds: this.selectedPayeesId
      };
      if (this.params.tableName === 'user-permission') {
        this.userManagementV35Service.refreshV3DataTable('payee-accounts');
      } else {
        this.v3DataTableService.refreshV3DataTable();
      }
    }
    this.isInFilterMode.set(true);
    this.select.close();
    this.showSearch = false;
  }

  onChange() {
    if (this.sharedService.selectedPayees?.value) {
      this.selectedPayeeNamesString = this.sharedService.selectedPayees?.value
        .map((obj) => obj.name)
        .join(', ');
    }
  }

  /**
   * @description Applies the filter based on the selected payee.
   * @param {string[]} payeeId - An array of payee IDs to filter.
   * @param {IPayeeDropdown} payee - The payee object containing name and nickname
   */
  onFilter(payeeId: string[], payee: IPayeeDropdown): void {
    this.selectedPayees = [];
    this.payeesToList$ = this.selectIsPayeesFilterOn$.pipe(
      switchMap((isFilterOn) =>
        isFilterOn ? this.payeesFiltered$ : this.payees$
      ),
      map((payees: IPayeeDropdown[]) => [...payees, payee])
    );
    this.selectedPayees.push(payee);
    this.sharedService.selectedPayees.setValue(this.selectedPayees);
    if (this.params.tableName === 'check_list_table') {
      this.checkService.setTotalCheckSumPayeeIds(payeeId);
      this.dataTableService.dataTablePayload = {
        ...this.dataTableService.dataTablePayload,
        payeeIds: payeeId
      } as IDefaultPayload;
      this.requestCheckListTotalCheckSum(payeeId);
      // Keep checksum in sync for single-payee quick filter flows.
      this.dataTableService.setMainFilter('filterChanged', 'agGridFilter');
      this.dataTableService.setRefreshStatus(true, 1);
    } else {
      this.v3DataTableService.defaultPayload = {
        ...this.v3DataTableService.defaultPayload,
        payeeIds: payeeId
      };
      if (this.params.tableName === 'user-permission') {
        this.userManagementV35Service.refreshV3DataTable('payee-accounts');
      } else {
        this.v3DataTableService.refreshV3DataTable();
      }
    }
    this.isInFilterMode.set(true);
    this.select.close();
    this.showSearch = false;
  }

  isSelected(payee: IPayeeDropdown): boolean {
    const selectedPayees = this.sharedService.selectedPayees.value;
    if (!selectedPayees || !Array.isArray(selectedPayees)) {
      return false;
    }
    return selectedPayees.some((p) => p.id === payee.id);
  }

  private requestCheckListTotalCheckSum(payeeIds: (string | number)[]): void {
    const startDate = this.dataTableService.selectedDateRangeChequeCreated
      ?.start
      ? `${this.datePipe.transform(this.dataTableService.selectedDateRangeChequeCreated?.start, 'yyyy-MM-dd')} 00:00:00`
      : '';
    const endDate = this.dataTableService.selectedDateRangeChequeCreated?.end
      ? `${this.datePipe.transform(this.dataTableService.selectedDateRangeChequeCreated?.end, 'yyyy-MM-dd')} 00:00:00`
      : '';

    this.subscriptions.push(
      this.checkService
        .getTotalCheckSum({
          start_date: startDate,
          end_date: endDate,
          payee_ids: payeeIds
        })
        .pipe(take(1))
        .subscribe((res) => {
          if (res?.success) {
            this.checkService.setTotalCheckSumValue(res.data.total_amount);
          }
        })
    );
  }

  onOpen(): void {
    this.showSearch = true;
    this.removeScrollListener?.();
    this.removeScrollListener = closeOnOutsideScroll(this.ngZone, () =>
      this.select?.close()
    );
  }

  onClose(): void {
    this.showSearch = false;
    this.removeScrollListener?.();
    this.removeScrollListener = undefined;
  }

  ngOnDestroy(): void {
    this.removeScrollListener?.();
    this.sharedService.setNewBankCreatedData();
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.clear();
  }
}
