import {
  Component,
  DestroyRef,
  ElementRef,
  HostBinding,
  inject,
  OnDestroy,
  signal,
  ViewChild
} from '@angular/core';
import { IFloatingFilterParams } from '@ag-grid-community/core';
import { DatePipe, NgClass } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Observable, switchMap, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import {
  selectFilteredPayees,
  selectIsPayeesFilterOn,
  selectIsPayeesLoading,
  selectPayees
} from 'src/app/modules/store/payees/payees.selectors';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { IDefaultPayload } from 'src/app/models/v3-datatable';

interface IPayeeFilterParams extends IFloatingFilterParams {
  tableName?: string;
  disablePermission?: boolean;
  tableId?: number;
  singleSelect?: boolean;
}

@Component({
  selector: 'app-v4-payee-multi-select-floating-filter',
  templateUrl: './v4-payee-multi-select-floating-filter.component.html',
  standalone: true,
  imports: [
    NgClass,
    OverlayModule,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4PayeeMultiSelectFloatingFilterComponent implements OnDestroy {
  @HostBinding('class') hostClass = 'w-full';
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private sharedService = inject(SharedService);
  public paymentsService = inject(PaymentsService);
  private userManagementV35Service = inject(UserManagementV35Service);
  private checkService = inject(CheckService);
  private datePipe = inject(DatePipe);
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  /** The field doubles as the search box (combobox pattern). */
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  params: IPayeeFilterParams;
  isOpen = false;
  hasSelection = false;
  displayText = '';
  placeholder = 'Select Payee';
  searchTerm = '';
  isLoading = signal(false);
  noPermission = false;
  singleSelect = false;

  payeeList: IPayeeDropdown[] = [];
  stagedSelections: IPayeeDropdown[] = [];
  appliedSelections: IPayeeDropdown[] = [];

  private hasMorePayees = true;
  private selectAllActive = false;
  private previousPayeeCount = 0;
  private searchTimeout: ReturnType<typeof setTimeout>;
  private payees$: Observable<IPayeeDropdown[]>;
  private payeesFiltered$: Observable<IPayeeDropdown[]>;
  private selectIsPayeesFilterOn$: Observable<boolean>;
  private payeesToList$: Observable<IPayeeDropdown[]>;
  private cellValue$ = toObservable(
    this.dataTableService.selectedCellValueSignal
  );

  overlayPositions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 2
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
      offsetY: 2
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
      offsetY: -2
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
      offsetY: -2
    }
  ];

  agInit(params: IPayeeFilterParams): void {
    this.params = params;
    this.singleSelect = !!params.singleSelect;

    // Permission check
    if (!this.paymentsService.hasPermission?.payee) {
      this.noPermission = true;
      this.placeholder = 'Permission Denied';
      return;
    }

    this.initStoreSelectors();
    this.listenForCellFilter();
  }

  onParentModelChanged(): void {}

  private initStoreSelectors(): void {
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

    this.payeesToList$ = this.selectIsPayeesFilterOn$.pipe(
      switchMap((isFilterOn) =>
        isFilterOn ? this.payeesFiltered$ : this.payees$
      )
    );

    this.payeesToList$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payees) => {
        this.payeeList = payees ?? [];
        if (this.payeeList.length === this.previousPayeeCount && this.previousPayeeCount > 0) {
          this.hasMorePayees = false;
        } else {
          this.hasMorePayees = true;
          this.previousPayeeCount = this.payeeList.length;
        }

        // When "Select All" is active, newly loaded payees (e.g. from
        // scroll pagination) must also be added to the staged selections.
        if (this.selectAllActive) {
          this.payeeList.forEach((payee) => {
            if (!this.stagedSelections.some((p) => p.id === payee.id)) {
              this.stagedSelections.push(payee);
            }
          });
        }
      });

    this.store
      .select(selectIsPayeesLoading)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading) => {
        this.isLoading.set(loading);
      });
  }

  openDropdown(): void {
    if (this.noPermission || this.isOpen) return;
    this.isOpen = true;
    // Copy applied to staged when opening
    this.selectAllActive = false;
    this.stagedSelections = [...this.appliedSelections];
    // Reset any previous search so the full list shows for a fresh search.
    if (this.searchTerm) {
      this.searchTerm = '';
      this.store.dispatch(
        payeesActions.loadPayees({ searchTerm: '', disablePermission: true })
      );
    }
    // Focus the field so typing searches immediately. Keyboard input still reaches
    // the focused field through the overlay's (pointer-only) transparent backdrop.
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }

  onBackdropClick(): void {
    // Revert staged to applied on outside click
    this.selectAllActive = false;
    this.stagedSelections = [...this.appliedSelections];
    this.isOpen = false;
  }

  isStaged(payee: IPayeeDropdown): boolean {
    return this.stagedSelections.some((p) => p.id === payee.id);
  }

  togglePayee(payee: IPayeeDropdown): void {
    if (this.singleSelect) {
      this.stagedSelections = [payee];
      this.onApply();
      return;
    }
    const index = this.stagedSelections.findIndex((p) => p.id === payee.id);
    if (index >= 0) {
      this.stagedSelections.splice(index, 1);
      // User manually unchecked an item, so we are no longer in
      // "select all" mode and should not auto-select newly loaded payees.
      this.selectAllActive = false;
    } else {
      this.stagedSelections.push(payee);
    }
  }

  selectAll(): void {
    this.selectAllActive = true;
    this.stagedSelections = [...this.payeeList];
  }

  deselectAll(): void {
    this.selectAllActive = false;
    this.stagedSelections = [];
  }

  onSearch(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    if (document.activeElement !== inputEl) {
      inputEl.value = this.isOpen ? this.searchTerm : this.displayText;
      return;
    }
    // Typing in the field is the search; ensure the list stays open.
    this.isOpen = true;
    const { value } = inputEl;
    this.searchTerm = value.replace(/&/g, '%26');

    clearTimeout(this.searchTimeout);
    this.hasMorePayees = true;
    this.previousPayeeCount = 0;
    // A new search resets the list, so stop auto-selecting new results.
    this.selectAllActive = false;
    this.searchTimeout = setTimeout(() => {
      this.store.dispatch(
        payeesActions.loadPayees({
          searchTerm: this.searchTerm,
          disablePermission: true
        })
      );
    }, 300);
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50 && this.hasMorePayees) {
      this.store.dispatch(payeesActions.loadMorePayees({ skipEmpty: true }));
    }
  }

  onApply(): void {
    this.appliedSelections = [...this.stagedSelections];
    this.hasSelection = this.appliedSelections.length > 0;
    this.updateDisplayText();

    if (this.singleSelect) {
      const payload = this.v3DataTableService.defaultPayload;
      if (this.appliedSelections.length > 0) {
        payload.filterModel = {
          ...payload.filterModel,
          payee_name: {
            filter: this.appliedSelections[0].name,
            filterType: 'text',
            type: 'contains'
          }
        };
      } else if (payload.filterModel?.payee_name) {
        delete payload.filterModel.payee_name;
      }
      this.v3DataTableService.refreshV3DataTable();
      this.isOpen = false;
      return;
    }

    const payeeIds = this.appliedSelections.map((p) => p.id);

    // Update SharedService for cross-component communication
    this.sharedService.selectedPayees.setValue(this.appliedSelections);

    if (this.params?.tableName === 'check_list_table') {
      // Route through DataTableService for the check-sum figure
      this.checkService.setTotalCheckSumPayeeIds(payeeIds);
      if (this.dataTableService.dataTablePayload) {
        (this.dataTableService.dataTablePayload as IDefaultPayload).payeeIds =
          payeeIds;
      }
      this.requestCheckListTotalCheckSum(payeeIds);
      // Triggers CheckListComponent filter subscription to call getTotalCheckSum().
      this.dataTableService.setMainFilter('filterChanged', 'agGridFilter');
      this.dataTableService.setRefreshStatus(true, 1);

      // Also filter the grid rows themselves via v3DataTableService
      this.v3DataTableService.defaultPayload = {
        ...this.v3DataTableService.defaultPayload,
        payeeIds,
        startRow: 0,
        endRow: 50
      };
      this.v3DataTableService.refreshV3DataTable();
    } else {
      // Route through UserManagementV35Service
      this.v3DataTableService.defaultPayload = {
        ...this.v3DataTableService.defaultPayload,
        payeeIds,
        startRow: 0,
        endRow: 50
      };
      if (this.params?.tableName === 'user-permission') {
        this.userManagementV35Service.refreshV3DataTable('payee-accounts');
      } else {
        this.v3DataTableService.refreshV3DataTable();
      }
    }
    this.isOpen = false;
  }

  onClear(): void {
    this.selectAllActive = false;
    this.stagedSelections = [];
    this.appliedSelections = [];
    this.hasSelection = false;
    this.displayText = '';

    if (this.singleSelect) {
      const payload = this.v3DataTableService.defaultPayload;
      if (payload.filterModel?.payee_name) {
        delete payload.filterModel.payee_name;
      }
      this.v3DataTableService.refreshV3DataTable();
      this.searchTerm = '';
      this.store.dispatch(
        payeesActions.loadPayees({ searchTerm: '', disablePermission: true })
      );
      this.isOpen = false;
      return;
    }

    // Clear SharedService
    this.sharedService.selectedPayees.setValue([]);

    if (this.params?.tableName === 'check_list_table') {
      this.checkService.setTotalCheckSumPayeeIds([]);
      if (this.dataTableService.dataTablePayload) {
        (this.dataTableService.dataTablePayload as IDefaultPayload).payeeIds =
          [];
      }
      this.dataTableService.setRefreshStatus(true, 1);

      this.v3DataTableService.defaultPayload = {
        ...this.v3DataTableService.defaultPayload,
        payeeIds: []
      };
      this.v3DataTableService.refreshV3DataTable();
    } else {
      this.v3DataTableService.defaultPayload = {
        ...this.v3DataTableService.defaultPayload,
        payeeIds: []
      };

      if (this.params?.tableName === 'user-permission') {
        this.userManagementV35Service.refreshV3DataTable('payee-accounts');
      } else {
        this.v3DataTableService.refreshV3DataTable();
      }
    }

    this.searchTerm = '';
    this.store.dispatch(
      payeesActions.loadPayees({ searchTerm: '', disablePermission: true })
    );
    this.isOpen = false;
  }

  clearFilter(event?: Event): void {
    event?.stopPropagation();
    this.onClear();
  }

  private updateDisplayText(): void {
    if (this.appliedSelections.length === 0) {
      this.displayText = '';
    } else if (this.appliedSelections.length === 1) {
      this.displayText = this.appliedSelections[0].name;
    } else {
      this.displayText = `${this.appliedSelections.length} selected`;
    }
  }

  private requestCheckListTotalCheckSum(payeeIds: (string | number)[]): void {
    const startDate = this.dataTableService.selectedDateRangeChequeCreated
      ?.start
      ? `${this.datePipe.transform(this.dataTableService.selectedDateRangeChequeCreated?.start, 'yyyy-MM-dd')} 00:00:00`
      : '';
    const endDate = this.dataTableService.selectedDateRangeChequeCreated?.end
      ? `${this.datePipe.transform(this.dataTableService.selectedDateRangeChequeCreated?.end, 'yyyy-MM-dd')} 00:00:00`
      : '';

    this.checkService
      .getTotalCheckSum({
        start_date: startDate,
        end_date: endDate,
        payee_ids: payeeIds
      })
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.checkService.setTotalCheckSumValue(res.data.total_amount);
        }
      });
  }

  private listenForCellFilter(): void {
    this.cellValue$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.field === 'payee' && res.filter && res.payee) {
          const payee = res.payee as IPayeeDropdown;
          this.stagedSelections = [payee];
          this.onApply();
        }
      });
  }

  ngOnDestroy(): void {
    // Clear payee filter on destroy
    if (this.hasSelection) {
      if (this.singleSelect) {
        const payload = this.v3DataTableService.defaultPayload;
        if (payload.filterModel?.payee_name) {
          delete payload.filterModel.payee_name;
        }
      } else {
        this.v3DataTableService.defaultPayload = {
          ...this.v3DataTableService.defaultPayload,
          payeeIds: []
        };
      }
    }
  }
}
