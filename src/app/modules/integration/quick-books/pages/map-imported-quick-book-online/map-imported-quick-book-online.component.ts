import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  switchMap,
  tap
} from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/company-select-modal/company-select-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { MapBankAccountModalComponent } from '../../../modals/map-bank-account-modal/map-bank-account-modal.component';
import {
  IQBBankData,
  IQbConnectedCompany,
  IQuickBookOnlineData
} from '../../../model/integration';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonBackButtonV35Component } from '../../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import {
  faDownToLine,
  faMagnifyingGlass,
  faSpinner,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { Iv35ngSelectConfig, TListData } from 'src/app/shared/v3/v35-dropdown/models/v35-common-dropdown-selector.interface';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

/**
 * Component for mapping imported QuickBooks Online accounts.
 */
@Component({
  selector: 'app-map-imported-quick-book-online',
  templateUrl: './map-imported-quick-book-online.component.html',
  styleUrls: ['./map-imported-quick-book-online.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    MatTooltip,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    V35CommonDropDownSelectorComponent,
    CommonButtonV35Component
  ]
})
export class MapImportedQuickBookOnlineComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private localStorageService = inject(LocalStorageService);
  quickBookOnlineData: IQuickBookOnlineData;
  isConnected: number;
  QBConnectedData = signal<IQbConnectedCompany[]>([]);
  QBCompanyDetails = signal<IQbConnectedCompany[]>([]);
  loading: string | undefined = undefined;
  bulkDeleteLoading = false;
  initialLoading = signal(true);
  faSpinner = faSpinner;
  faDownToLine = faDownToLine;
  faTrash = faTrash;
  faMagnifyingGlass = faMagnifyingGlass;
  selectedRows = new Set<string>();
  isPlugginEnabled = false;
  
  // Dropdown configuration
  companyDropdownConfig: Iv35ngSelectConfig = {
    placeholder: 'All QuickBooks Companies',
    displayField: 'companyName',
    outputField: 'realmId',
    style: {
      size: 2,
      enableLabelIcon: true,
      labelIconData: {
        icon_fa: ['fas', 'building'],
        color: 'common-blue-color'
      }
    }
  };
  companyDropdownList: TListData[] = [];
  selectedCompanyId: string | null = 'all';

  bankSearchLoading = signal(false);

  searchControl = new FormControl('', { nonNullable: true });

  get displayedCompanies(): IQbConnectedCompany[] {
    if (!this.selectedCompanyId || this.selectedCompanyId === 'all') {
      return this.QBConnectedData();
    }
    return this.QBConnectedData().filter(
      (c) => c.realmId === this.selectedCompanyId
    );
  }

  /**
   * Loading states for different QuickBooks operations
   */
  quickBooksLoading = {
    bank: false,
    payee: false,
    category: false,
    class: false,
    location: false
  };

  constructor(
    public __dialog: MatDialog,
    public _alertService: AlertService,
    private _integrationService: IntegrationService
  ) {
    this.isPlugginEnabled = this.localStorageService.getItem('userPlugins')?.includes('qb-auto-sub-account-mapping') ?? false;
  }

  /**
   * Initialize the component.
   */
  ngOnInit(): void {
    this._integrationService.getQuickBookOnlineData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.quickBookOnlineData = res.data;
          this.isConnected = res.data.companyCount;
          this.buildCompanyDropdownList();
        }
      });
    this.loadBankAccountMappingData();
    this.listenForBankSearch();
  }

  private listenForBankSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => {
          this.selectedRows.clear();
          this.bankSearchLoading.set(true);
        }),
        switchMap((term) => this.fetchBankAccountMappingData(term)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.bankSearchLoading.set(false);
          if (res.success) {
            this.QBConnectedData.set(res.data);
            this.QBCompanyDetails.set(res.data);
          }
        },
        error: () => this.bankSearchLoading.set(false)
      });
  }

  /**
   * Build the company dropdown list from available companies.
   */
  buildCompanyDropdownList(): void {
    this.companyDropdownList = [
      { companyName: 'All QuickBooks Companies', realmId: 'all' },
      ...(this.quickBookOnlineData?.companies ?? [])
    ];
  }

  private fetchBankAccountMappingData(
    term: string
  ): Observable<{ success: boolean; data: IQbConnectedCompany[] }> {
    // Reset search filters and pagination state
    this.companySearchFilters.clear();
    this.companyPerPage.clear();

    const params: { per_page: number; search?: string } = { per_page: 10 };
    const search = term.trim();
    if (search) {
      params.search = search;
    }

    return this._integrationService
      .getBankAccountMappingData(params)
      .pipe(finalize(() => this.initialLoading.set(false)));
  }

  loadBankAccountMappingData(): void {
    this.bankSearchLoading.set(true);
    this.fetchBankAccountMappingData(this.searchControl.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.bankSearchLoading.set(false))
      )
      .subscribe((res) => {
        if (res.success) {
          this.QBConnectedData.set(res.data);
          this.QBCompanyDetails.set(res.data);
        }
      });
  }

  /**
   * Handle company selection from dropdown.
   * @param companyId - The selected company ID or 'all'
   */
  onCompanySelect(companyId: string | null): void {
    this.selectedCompanyId = companyId ?? 'all';
    this.selectedRows.clear(); // Clear selections on filter change
  }

  /********************************************** Per-Company Pagination *******************************/

  // Per-page options for pagination
  perPageOptions = [10, 25, 50, 100];
  // Track per-page setting for each company
  companyPerPage = new Map<string, number>();
  // Track pagination loading state per company
  paginationLoading = new Map<string, boolean>();
  // Track search filters per company
  companySearchFilters = new Map<string, {
    quickBookId: string;
    quickBookAccount: string;
    ocwBankAccount: string;
    ocwBankNickName: string;
  }>();
  // Debounce timer for search
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Check if pagination is loading for a company.
   * @param realmId - The company realm ID
   */
  isPaginationLoading(realmId: string): boolean {
    return this.paginationLoading.get(realmId) ?? false;
  }

  /**
   * Get search filters for a company, initializing if needed.
   * @param realmId - The company realm ID
   */
  getSearchFilters(realmId: string): { quickBookId: string; quickBookAccount: string; ocwBankAccount: string; ocwBankNickName: string } {
    if (!this.companySearchFilters.has(realmId)) {
      this.companySearchFilters.set(realmId, {
        quickBookId: '',
        quickBookAccount: '',
        ocwBankAccount: '',
        ocwBankNickName: ''
      });
    }
    return this.companySearchFilters.get(realmId)!;
  }

  /**
   * Handle search input change with debounce.
   * @param realmId - The company realm ID
   * @param field - The search field being updated
   * @param value - The new search value
   */
  onSearchChange(realmId: string, field: 'quickBookId' | 'quickBookAccount' | 'ocwBankAccount' | 'ocwBankNickName', value: string): void {
    const filters = this.getSearchFilters(realmId);
    filters[field] = value;

    // Clear existing timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    // Debounce the search
    this.searchDebounceTimer = setTimeout(() => {
      this.loadCompanyBankAccounts(realmId, 1);
    }, 500);
  }

  /**
   * Clear all search filters for a company.
   * @param realmId - The company realm ID
   */
  clearSearchFilters(realmId: string): void {
    this.companySearchFilters.set(realmId, {
      quickBookId: '',
      quickBookAccount: '',
      ocwBankAccount: '',
      ocwBankNickName: ''
    });
    this.loadCompanyBankAccounts(realmId, 1);
  }

  /**
   * Get per-page value for a company.
   * @param realmId - The company realm ID
   */
  getPerPageForCompany(realmId: string): number {
    return this.companyPerPage.get(realmId) ?? 10;
  }

  /**
   * Handle per-page change for a specific company.
   * @param perPage - The new per-page value
   * @param realmId - The company realm ID
   */
  onPerPageChangeForCompany(perPage: number, realmId: string): void {
    this.companyPerPage.set(realmId, perPage);
    // Reset to page 1 when changing per-page
    this.loadCompanyBankAccounts(realmId, 1, perPage);
  }

  /**
   * Handle page input change for a specific company.
   * @param event - The input event
   * @param realmId - The company realm ID
   * @param lastPage - The last page number
   */
  onPageInputForCompany(event: Event, realmId: string, lastPage: number): void {
    const input = event.target as HTMLInputElement;
    let pageNum = parseInt(input.value, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      pageNum = 1;
    } else if (pageNum > lastPage) {
      pageNum = lastPage;
    }

    input.value = pageNum.toString();
    this.gotoPageForCompany(pageNum, realmId);
  }

  /**
   * Handle page change for a specific company (server-side pagination).
   * @param direction - 'prev' or 'next'
   * @param realmId - The company realm ID
   */
  onPageChangeForCompany(direction: 'prev' | 'next', realmId: string): void {
    const company = this.QBConnectedData().find(c => c.realmId === realmId);
    if (!company?.pagination) return;

    const currentPage = company.pagination.current_page;
    const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;

    if (newPage < 1 || newPage > company.pagination.last_page) return;

    // Load data for the specific company with new page
    const perPage = this.getPerPageForCompany(realmId);
    this.loadCompanyBankAccounts(realmId, newPage, perPage);
  }

  /**
   * Go to a specific page for a company.
   * @param page - The page number to go to
   * @param realmId - The company realm ID
   */
  gotoPageForCompany(page: number | string, realmId: string): void {
    const pageNum = Number(page);
    if (pageNum > 0) {
      const perPage = this.getPerPageForCompany(realmId);
      this.loadCompanyBankAccounts(realmId, pageNum, perPage);
    }
  }

  /**
   * Generate pagination array for a company.
   * @param currentPage - Current page number
   * @param totalPages - Total number of pages
   */
  getPaginationArray(currentPage: number, totalPages: number): (number | string)[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  }

  /**
   * Load bank accounts for a specific company with pagination and search filters.
   * @param realmId - The company realm ID
   * @param page - The page number to load
   * @param perPage - The number of items per page
   */
  loadCompanyBankAccounts(realmId: string, page: number, perPage?: number): void {
    const per_page = perPage ?? this.getPerPageForCompany(realmId);
    const filters = this.getSearchFilters(realmId);

    // Build query params including search filters
    const params: {
      realmId?: string;
      page?: number;
      per_page?: number;
      quickBookId?: string;
      quickBookAccount?: string;
      ocwBankAccount?: string;
      ocwBankNickName?: string;
      search?: string;
    } = {
      realmId,
      page,
      per_page
    };

    if (this.searchControl.value.trim()) {
      params.search = this.searchControl.value.trim();
    }

    // Add search filters if they have values
    if (filters.quickBookId?.trim()) {
      params.quickBookId = filters.quickBookId.trim();
    }
    if (filters.quickBookAccount?.trim()) {
      params.quickBookAccount = filters.quickBookAccount.trim();
    }
    if (filters.ocwBankAccount?.trim()) {
      params.ocwBankAccount = filters.ocwBankAccount.trim();
    }
    if (filters.ocwBankNickName?.trim()) {
      params.ocwBankNickName = filters.ocwBankNickName.trim();
    }

    this.paginationLoading.set(realmId, true);
    this._integrationService.getBankAccountMappingData(params)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.paginationLoading.set(realmId, false))
      )
      .subscribe((res) => {
        if (res.success && res.data.length > 0) {
          // Update the specific company's data
          this.QBConnectedData.update((companies) =>
            companies.map((company) =>
              company.realmId === realmId ? res.data[0] : company
            )
          );
        }
      });
  }

  /********************************************** Per-Company Selection *******************************/

  /**
   * Get selected count for a specific company.
   * @param realmId - The company realm ID
   */
  getSelectedCountForCompany(realmId: string): number {
    const company = this.QBConnectedData().find(c => c.realmId === realmId);
    if (!company) return 0;
    return company.data.filter(bank => this.selectedRows.has(bank.id)).length;
  }

  /**
   * Check if all rows are selected for a specific company.
   * @param realmId - The company realm ID
   */
  isAllSelectedForCompany(realmId: string): boolean {
    const company = this.QBConnectedData().find(c => c.realmId === realmId);
    if (!company || company.data.length === 0) return false;
    return company.data.every(bank => this.selectedRows.has(bank.id));
  }

  /**
   * Toggle select all rows for a specific company.
   * @param realmId - The company realm ID
   */
  toggleSelectAllForCompany(realmId: string): void {
    const company = this.QBConnectedData().find(c => c.realmId === realmId);
    if (!company) return;

    if (this.isAllSelectedForCompany(realmId)) {
      // Deselect all for this company
      company.data.forEach(bank => this.selectedRows.delete(bank.id));
    } else {
      // Select all for this company
      company.data.forEach(bank => this.selectedRows.add(bank.id));
    }
  }

  /**
   * Bulk delete for a specific company.
   * @param realmId - The company realm ID
   */
  onBulkDeleteForCompany(realmId: string): void {
    const company = this.QBConnectedData().find(c => c.realmId === realmId);
    if (!company) return;

    const selectedIds = company.data
      .filter(bank => this.selectedRows.has(bank.id))
      .map(bank => bank.id);

    if (selectedIds.length === 0) {
      this._alertService.failedAlert({
        content: 'Please select at least one row'
      });
      return;
    }

    const confirm = this._alertService.confirmAlert({
      content: `Are you sure you want to delete ${selectedIds.length} selected bank account(s)?`
    });

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.bulkDeleteLoading = true;
        this._integrationService
          .bulkDeleteBankAccMapping(selectedIds)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => (this.bulkDeleteLoading = false))
          )
          .subscribe((res) => {
            if (res.success) {
              selectedIds.forEach(id => this.selectedRows.delete(id));
              this.loadBankAccountMappingData();
              this.openSuccessAlert('Deleted Successfully');
            }
          });
      }
    });
  }

  /**
   * Open the bank account mapping modal.
   * @param {string} id - The QuickBooks ID.
   * @param {IQBBankData} data - Additional data.
   * @param {string} ismapping - The mapping status.
   */
  openBankAccountMappingModal(
    id: string,
    data: IQBBankData,
    ismapping: string,
    companyId: string
  ): void {
    const dialogRef = this.__dialog.open(MapBankAccountModalComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: { qbId: id, data, ismapping, companyId }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadBankAccountMappingData();
      }
    });
  }

  /**
   * Remove bank account mapping by ID.
   * @param {string} id - The ID of the bank account mapping to remove.
   */
  removeMapping(id: string): void {
    const data = {
      content:
        'This will remove your current bank account mapping. Are you sure you want to continue?'
    };

    const confirm = this._alertService.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this._integrationService
          .removeBankAccMapping({ id })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res.success) {
              this.openSuccessAlert('Mapping cleared successfully.');
              this.loadBankAccountMappingData();
            }
          });
      }
    });
  }

  /*************************FIND WHICH ACTION BUTTON IS CLICKED ******************************/

  /**
   * Import bank accounts from QuickBooks.
   */
  ImportBank() {
    const sendingData = {
      mode: 'Bank',
      companyList: this.quickBookOnlineData?.companies
    };

    if (this.isConnected) {
      const dialogRef = this.__dialog.open(CompanySelectModalComponent, {
        maxWidth: '510px',
        width: '93%',
        data: sendingData,
        disableClose: true
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          if (sendingData.mode == 'Bank') {
            this.importBankFromCompany(res.realmId);
          }
        }
      });
    }
  }

  /**
   * Import bank accounts from a specific QuickBooks company.
   * @param {string} realmId - The realm ID of the QuickBooks company to import bank accounts from.
   */
  importBankFromCompany(realmId: string): void {
    this.quickBooksLoading.bank = true;
    this._integrationService
      .importQuickbookBanks(realmId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.quickBooksLoading.bank = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.openSuccessAlert('Successfully Imported.');
          this.loadBankAccountMappingData();
        }
      });
  }

  /********************************************** Delete *******************************/

  /**
   * Delete a bank account mapping by ID.
   * @param {string} id - The ID of the bank account mapping to delete.
   */
  onDeleteRow(id: string): void {
    const data = {
      content: 'Are you sure you want to delete this bank account?'
    };

    const confirm = this._alertService.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.loading = id;
        this._integrationService
          .deleteBankAccMapping(id)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => (this.loading = undefined))
          )
          .subscribe((res) => {
            if (res.success) {
              this.loadBankAccountMappingData();
              this.openSuccessAlert('Deleted Successfully');
            }
          });
      }
    });
  }

  /********************************************** Edit *******************************/

  /**
   * Edit a bank account mapping by opening the mapping modal.
   * @param {string} id - The ID of the bank account mapping to edit.
   * @param {IQBBankData} data - Additional data.
   * @param {string} ismapping - The mapping status.
   * @param {string} companyId - The company realm ID.
   */
  onEditRow(id: string, data: IQBBankData, ismapping: string, companyId: string): void {
    const dialogRef = this.__dialog.open(MapBankAccountModalComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      data: { qbId: id, data, mode: 'edit', ismapping, companyId }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadBankAccountMappingData();
      }
    });
  }

  /********************************************** Checkbox Selection *******************************/

  /**
   * Toggle selection of a row.
   * @param {string} id - The ID of the row to toggle.
   */
  toggleRowSelection(id: string): void {
    if (this.selectedRows.has(id)) {
      this.selectedRows.delete(id);
    } else {
      this.selectedRows.add(id);
    }
  }

  /**
   * Check if a row is selected.
   * @param {string} id - The ID of the row to check.
   */
  isRowSelected(id: string): boolean {
    return this.selectedRows.has(id);
  }

  /**
   * Clear all selected rows.
   */
  clearSelection(): void {
    this.selectedRows.clear();
  }

  /**
   * Open a success alert dialog with the given content.
   * @param {string} content - The content to display in the success alert.
   */
  openSuccessAlert(content: string) {
    const data = {
      content: content,
      close: true
    };
    return this._alertService.successAlert(data);
  }
}
