import { IFloatingFilterParams } from '@ag-grid-community/core';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { finalize, Subscription } from 'rxjs';
import { IBankDropdown } from 'src/app/models/bank';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { UserManagementV35Service } from 'src/app/modules/user-management/service/user-management-v35.service';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { IDefaultPayload } from 'src/app/models/v3-datatable';

interface IUpdatedFloatingFilter extends IFloatingFilterParams {
  tableName?: string;
}

interface ICheckListPayload extends IDefaultPayload {
  bankIds?: string[];
}

@Component({
  selector: 'app-dt-multi-dropdown-cash',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgSelectModule,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MatTooltipModule
  ],
  templateUrl: './dt-multi-dropdown-cash.component.html',
  styleUrl: './dt-multi-dropdown-cash.component.scss'
})
export class DtMultiDropdownCashComponent implements OnDestroy {
  private v3DataTableService = inject(V3DataTableService);
  public sharedService = inject(SharedService);
  private dataTableService = inject(DataTableService);
  private userManagementV35Service = inject(UserManagementV35Service);
  private cashExpenseService = inject(CashExpenseService);

  @ViewChild('ngSelect') select: NgSelectComponent;
  searchTerm = '';
  showSearch = false;
  subscriptions: Subscription[] = [];
  isInFilterMode = signal<boolean>(false);
  params: IUpdatedFloatingFilter;
  searchTimeout: ReturnType<typeof setTimeout>;

  selectedBankNamesString: string;
  selectedBankIds: string[];
  selectedBanks: IBankDropdown[] = [];
  cellValue$ = toObservable(this.dataTableService.selectedCellValueSignal);

  // Bank accounts data as signal
  bankAccounts = signal<IBankDropdown[]>([]);
  page = 1;
  isLoading = false;
  permissionDenied = signal<boolean>(false);

  // Create a local FormControl for selected banks
  selectedBanksControl = new FormControl<IBankDropdown[] | null>(null);

  agInit(params: IUpdatedFloatingFilter): void {
    this.params = params;
    this.initBankAccounts();
    this.getBankId();
  }

  /**
   * @description Retrieves the bank ID from the selected cell value.
   */
  getBankId() {
    this.subscriptions.push(
      this.cellValue$.subscribe((res) => {
        if (res?.field === 'A/C' && res.filter) {
          const bankId: string[] = [];
          bankId.push(res.filter);
          // Find the bank object from the bank accounts list
          const bank = this.bankAccounts().find((b) => b.id === res.filter);
          if (bank) {
            this.onFilter(bankId, bank);
          }
        }
      })
    );
  }

  /**
   * Initializes bank accounts data and loads initial data.
   */
  initBankAccounts() {
    this.page = 1;
    this.loadBankAccounts();
  }

  /**
   * @description Loads bank accounts from the API.
   */
  loadBankAccounts() {
    this.isLoading = true;
    this.subscriptions.push(
      this.cashExpenseService
        .getBankAndCashAccounts(this.page, this.searchTerm, undefined, 1)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.bankAccounts.set(res.data);
              this.permissionDenied.set(false);
            }
          },
          error: (err) => {
            if (err.status === 403) {
              this.permissionDenied.set(true);
            }
          }
        })
    );
  }

  /**
   * @description Gets data based on search term.
   * @param event - event
   */
  search(event: KeyboardEvent | FocusEvent) {
    const inputValue = (event?.target as HTMLInputElement).value;
    
    // Only proceed if there's actual input or if it's a keyboard event (typing)
    if (event instanceof KeyboardEvent || inputValue.trim()) {
      clearTimeout(this.searchTimeout);
      this.searchTerm = inputValue;
      this.searchTimeout = setTimeout(() => {
        this.loadBankAccounts();
      }, 600);
    }
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onScrollToEnd() {    
    this.page += 1;
    this.subscriptions.push(
      this.cashExpenseService
        .getBankAndCashAccounts(this.page, this.searchTerm, undefined, 1)
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.bankAccounts.update((currentAccounts) => {
                // Filter out items that already exist in currentAccounts based on id
                const uniqueNewItems = res.data.filter((newItem: IBankDropdown) => 
                  !currentAccounts.some((existingItem: IBankDropdown) => existingItem.id === newItem.id)
                );
                
                return [
                  ...currentAccounts,
                  ...uniqueNewItems
                ];
              });
            }
          },
          error: () => {
            // Handle error silently
          }
        })
    );
  }

  /**
   * @description Clears the changes made.
   */
  clear() {
    if (this.isInFilterMode()) {
      if (this.params.tableName === 'check_list_table') {
        const payload = this.dataTableService
          .dataTablePayload as IDefaultPayload;
        payload.cashAccountIds = [];
        this.dataTableService.setRefreshStatus(true, 1);
      } else {
        this.v3DataTableService.defaultPayload = {
          ...this.v3DataTableService.defaultPayload,
          cashAccountIds: []
        };
        if (this.params.tableName === 'user-permission') {
          this.userManagementV35Service.refreshV3DataTable('bank-accounts');
        } else {
          this.v3DataTableService.refreshV3DataTable();
        }
      }
    }
    this.searchTerm = '';
    this.selectedBanksControl.reset();
    this.selectedBankNamesString = '';
    this.isInFilterMode.set(false);
    this.page = 1;
    this.loadBankAccounts();
    this.v3DataTableService?.gridApi?.deselectAll();
  }

  applyFilter() {
    this.selectedBankIds =
      this.selectedBanksControl?.value?.map((obj: IBankDropdown) => obj.id) ||
      [];

    if (this.params.tableName === 'check_list_table') {
      const payload = this.dataTableService.dataTablePayload as ICheckListPayload;
      payload.bankIds = this.selectedBankIds;
      this.dataTableService.setRefreshStatus(true, 1);
    } else {
      this.v3DataTableService.defaultPayload = {
        ...this.v3DataTableService.defaultPayload,
        cashAccountIds: this.selectedBankIds
      };
      if (this.params.tableName === 'user-permission') {
        this.userManagementV35Service.refreshV3DataTable('bank-accounts');
      } else {
        this.v3DataTableService.refreshV3DataTable();
      }
    }
    this.isInFilterMode.set(true);
    this.select.close();
    this.showSearch = false;
    this.page = 1;
  }

  onChange() {
    if (this.selectedBanksControl?.value) {
      this.selectedBankNamesString = this.selectedBanksControl.value
        .map((obj: IBankDropdown) => obj.nickName || obj.name)
        .join(', ');
    }
  }

  /**
   * @description Applies the filter based on the selected bank.
   * @param {string[]} bankId - An array of bank IDs to filter.
   * @param {IBankDropdown} bank - The bank object containing name and nickname
   */
  onFilter(bankId: string[], bank: IBankDropdown): void {
    this.selectedBanks = [];
    this.selectedBanks.push(bank);
    this.selectedBanksControl.setValue(this.selectedBanks);
    this.v3DataTableService.defaultPayload = {
      ...this.v3DataTableService.defaultPayload,
      cashAccountIds: bankId
    };
    this.v3DataTableService.refreshV3DataTable();
    this.isInFilterMode.set(true);
    this.select.close();
    this.showSearch = false;
  }

  isSelected(bank: IBankDropdown): boolean {
    const selectedBanks = this.selectedBanksControl.value;
    if (!selectedBanks || !Array.isArray(selectedBanks)) {
      return false;
    }
    return selectedBanks.some((b) => b.id === bank.id);
  }

  ngOnDestroy(): void {
    this.sharedService.setNewBankCreatedData();
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.clear();
  }
}
