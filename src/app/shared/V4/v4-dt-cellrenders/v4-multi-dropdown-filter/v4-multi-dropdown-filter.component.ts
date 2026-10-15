import { IFloatingFilterParams } from '@ag-grid-community/core';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, finalize, map, switchMap } from 'rxjs';
import { Store } from '@ngrx/store';

import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { IBankDropdown } from 'src/app/models/bank';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import {
  selectFilteredPayees,
  selectIsPayeesFilterOn,
  selectPayees
} from 'src/app/modules/store/payees/payees.selectors';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';

type FilterItem = IBankDropdown | IPayeeDropdown;

interface IV4FilterParams extends IFloatingFilterParams {
  /** 'bank' for cash/bank account filter, 'payee' for payee filter */
  filterType: 'bank' | 'payee';
}

@Component({
  selector: 'app-v4-multi-dropdown-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgSelectModule,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MatTooltipModule
  ],
  templateUrl: './v4-multi-dropdown-filter.component.html',
  styleUrl: './v4-multi-dropdown-filter.component.scss'
})
export class V4MultiDropdownFilterComponent implements OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private cashExpenseService = inject(CashExpenseService);
  private store = inject(Store);
  private sharedService = inject(SharedService);

  @ViewChild('ngSelect') select: NgSelectComponent;

  private filterType: 'bank' | 'payee' = 'bank';

  placeholder = 'Select...';
  showSearch = false;
  selectedNamesString = '';
  searchTerm = '';
  page = 1;
  isInFilterMode = signal(false);
  permissionDenied = signal(false);
  items = signal<FilterItem[]>([]);

  selectedItemsControl = new FormControl<FilterItem[] | null>(null);

  private subscriptions: Subscription[] = [];
  private searchTimeout: ReturnType<typeof setTimeout>;
  private cellValue$ = toObservable(this.dataTableService.selectedCellValueSignal);

  // Payee-specific observables
  private payeesToList$: Observable<IPayeeDropdown[]>;

  agInit(params: IV4FilterParams): void {
    this.filterType = params.filterType ?? 'bank';
    this.placeholder = this.filterType === 'bank' ? 'Select Bank Account' : 'Select Payee';

    if (this.filterType === 'bank') {
      this.initBankAccounts();
      this.listenBankCellValue();
    } else {
      this.initPayees();
      this.listenPayeeCellValue();
    }
  }

  // ─── Display ───

  getDisplayName(item: FilterItem): string {
    if (this.filterType === 'bank') {
      const bank = item as IBankDropdown;
      const name = (bank.nickName || bank.name) ?? '';
      return bank.verified === 1 ? `${name} [VERIFIED]` : name;
    }
    const payee = item as IPayeeDropdown;
    return payee.nickName ? `${payee.name} (${payee.nickName})` : payee.name;
  }

  // ─── Bank account logic ───

  private initBankAccounts(): void {
    this.page = 1;
    this.loadBankAccounts();
  }

  private loadBankAccounts(): void {
    this.subscriptions.push(
      this.cashExpenseService
        .getBankAndCashAccounts(this.page, this.searchTerm, undefined, 1)
        .pipe(finalize(() => {}))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.items.set(res.data);
              this.permissionDenied.set(false);
            }
          },
          error: (err) => {
            if (err.status === 403) this.permissionDenied.set(true);
          }
        })
    );
  }

  private listenBankCellValue(): void {
    this.subscriptions.push(
      this.cellValue$.subscribe((res) => {
        if (res?.field === 'A/C' && res.filter) {
          const bank = (this.items() as IBankDropdown[]).find((b) => b.id === res.filter);
          if (bank) {
            this.selectedItemsControl.setValue([bank]);
            this.applyFilterWithIds([res.filter], 'cashAccountIds');
          }
        }
      })
    );
  }

  // ─── Payee logic ───

  private initPayees(): void {
    this.store.dispatch(payeesActions.loadPayees({ searchTerm: '', skipEmpty: true, disablePermission: true }));
    const payees$ = this.store.select(selectPayees);
    const payeesFiltered$ = this.store.select(selectFilteredPayees);
    const isFilterOn$ = this.store.select(selectIsPayeesFilterOn);

    this.payeesToList$ = isFilterOn$.pipe(
      switchMap((on) => (on ? payeesFiltered$ : payees$))
    );

    this.subscriptions.push(
      this.payeesToList$.subscribe((payees) => this.items.set(payees))
    );

    this.sharedService.selectedPayees.reset();
  }

  private listenPayeeCellValue(): void {
    this.subscriptions.push(
      this.cellValue$.subscribe((res) => {
        if (res?.field === 'payee' && res.filter) {
          const payee = res.payee as IPayeeDropdown;
          if (payee) {
            this.sharedService.selectedPayees.setValue([payee]);
            this.selectedItemsControl.setValue([payee]);

            // Append payee to list if not present
            this.payeesToList$ = this.store.select(selectIsPayeesFilterOn).pipe(
              switchMap((on) =>
                on
                  ? this.store.select(selectFilteredPayees)
                  : this.store.select(selectPayees)
              ),
              map((payees) => [...payees, payee])
            );
            this.subscriptions.push(
              this.payeesToList$.subscribe((p) => this.items.set(p))
            );

            this.applyFilterWithIds([res.filter], 'payeeIds');
          }
        }
      })
    );
  }

  // ─── Common actions ───

  onSearch(event: KeyboardEvent | FocusEvent): void {
    const value = (event?.target as HTMLInputElement).value;

    if (this.filterType === 'bank') {
      if (event instanceof KeyboardEvent || value.trim()) {
        clearTimeout(this.searchTimeout);
        this.searchTerm = value;
        this.searchTimeout = setTimeout(() => this.loadBankAccounts(), 600);
      }
    } else {
      clearTimeout(this.searchTimeout);
      this.searchTerm = value.replace(/&/g, '%26');
      this.searchTimeout = setTimeout(() => {
        this.store.dispatch(payeesActions.loadPayees({ searchTerm: this.searchTerm, disablePermission: true }));
      }, 600);
    }
  }

  onScrollToEnd(): void {
    if (this.filterType === 'bank') {
      this.page += 1;
      this.subscriptions.push(
        this.cashExpenseService
          .getBankAndCashAccounts(this.page, this.searchTerm, undefined, 1)
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.items.update((current) => {
                  const existingIds = new Set(current.map((i) => i.id));
                  const unique = res.data.filter((item: IBankDropdown) => !existingIds.has(item.id));
                  return [...current, ...unique];
                });
              }
            }
          })
      );
    } else {
      this.store.dispatch(payeesActions.loadMorePayees({ skipEmpty: true }));
    }
  }

  onChange(): void {
    const values = this.selectedItemsControl.value;
    if (!values) return;

    if (this.filterType === 'payee') {
      this.sharedService.selectedPayees.setValue(values as IPayeeDropdown[]);
    }

    this.selectedNamesString = values.map((item) => this.getDisplayName(item)).join(', ');
  }

  applyFilter(): void {
    const values = this.selectedItemsControl.value;
    if (!values) return;

    const ids = values.map((item) => item.id);
    const payloadKey = this.filterType === 'bank' ? 'cashAccountIds' : 'payeeIds';
    this.applyFilterWithIds(ids, payloadKey);

    this.isInFilterMode.set(true);
    this.select.close();
    this.showSearch = false;
    this.page = 1;
  }

  clear(): void {
    if (this.isInFilterMode()) {
      const payloadKey = this.filterType === 'bank' ? 'cashAccountIds' : 'payeeIds';
      this.v3DataTableService.defaultPayload = {
        ...this.v3DataTableService.defaultPayload,
        [payloadKey]: []
      };
      this.v3DataTableService.refreshV3DataTable();
    }

    this.searchTerm = '';
    this.selectedItemsControl.reset();
    this.selectedNamesString = '';
    this.isInFilterMode.set(false);

    if (this.filterType === 'bank') {
      this.page = 1;
      this.loadBankAccounts();
    } else {
      this.sharedService.selectedPayees.reset();
      this.store.dispatch(payeesActions.loadPayees({ searchTerm: '', disablePermission: true }));
    }

    this.v3DataTableService?.gridApi?.deselectAll();
  }

  private applyFilterWithIds(ids: string[], payloadKey: string): void {
    this.v3DataTableService.defaultPayload = {
      ...this.v3DataTableService.defaultPayload,
      [payloadKey]: ids
    };
    this.v3DataTableService.refreshV3DataTable();
    this.isInFilterMode.set(true);
  }

  ngOnDestroy(): void {
    this.sharedService.setNewBankCreatedData();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.clear();
  }
}
