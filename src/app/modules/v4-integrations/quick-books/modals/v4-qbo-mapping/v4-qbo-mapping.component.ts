import {
  Component,
  DestroyRef,
  OnInit,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import {
  MatDialog,
  MatDialogClose,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  switchMap,
  tap
} from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { V4CompanySelectModalComponent } from 'src/app/shared/modal/common-modal/v4-company-select-modal/v4-company-select-modal.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import {
  IQBBankData,
  IQbConnectedCompany,
  IQuickBookOnlineData
} from 'src/app/modules/integration/model/integration';
import { V4MapBankAccountComponent } from '../../../modals/v4-map-bank-account/v4-map-bank-account.component';

@Component({
  selector: 'app-v4-qbo-mapping',
  templateUrl: './v4-qbo-mapping.component.html',
  styleUrls: ['./v4-qbo-mapping.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    MatDialogClose,
    MatTooltip,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent
  ]
})
export class V4QboMappingComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4QboMappingComponent>);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private integrationService = inject(IntegrationService);
  private alertService = inject(V4AlertService);
  private localStorageService = inject(LocalStorageService);
  public data: IQuickBookOnlineData = inject(MAT_DIALOG_DATA);

  // Core data
  QBConnectedData: IQbConnectedCompany[] = [];
  initialLoading = true;
  loading: string | undefined = undefined;
  bulkDeleteLoading = false;
  isPlugginEnabled = false;

  // Company filter
  selectedCompanyId: string | null = 'all';

  // Checkbox selection
  selectedRows = new Set<string>();

  // Company filter dropdown
  companyFilterConfig = {
    placeholder: 'All QuickBooks Companies',
    displayField: 'name',
    outputField: 'id'
  };

  companyFilterList: { name: string; id: string }[] = [];

  // Per-page dropdown
  perPageConfig = { placeholder: 'Select', style: { size: 1 as const } };
  perPageOptions = ['10', '25', '50', '100'];
  companyPerPage = new Map<string, number>();
  paginationLoading = new Map<string, boolean>();

  // Per-company search
  companySearchFilters = new Map<
    string,
    {
      quickBookId: string;
      quickBookAccount: string;
      ocwBankAccount: string;
      ocwBankNickName: string;
    }
  >();

  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    bankSearchLoading = false;

  searchControl = new FormControl('', { nonNullable: true });

  // Import loading
  quickBooksLoading = signal({ bank: false });

  get displayedCompanies(): IQbConnectedCompany[] {
    if (!this.selectedCompanyId || this.selectedCompanyId === 'all') {
      return this.QBConnectedData;
    }
    return this.QBConnectedData.filter(
      (c) => c.realmId === this.selectedCompanyId
    );
  }

  ngOnInit(): void {
    this.isPlugginEnabled =
      this.localStorageService
        .getItem('userPlugins')
        ?.includes('qb-auto-sub-account-mapping') ?? false;
    this.companyFilterList = [
      { name: 'All QuickBooks Companies', id: 'all' },
      ...(this.data?.companies?.map((c) => ({
        name: c.companyName,
        id: c.realmId
      })) ?? [])
    ];
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
          this.bankSearchLoading = true;
        }),
        switchMap((term) => this.fetchBankAccountMappingData(term)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.bankSearchLoading = false;
          if (res.success) {
            this.QBConnectedData = res.data;
          }
        },
        error: () => {
          this.bankSearchLoading = false;
        }
      });
  }

  private fetchBankAccountMappingData(
    term: string
  ): Observable<{ success: boolean; data: IQbConnectedCompany[] }> {
    this.companySearchFilters.clear();
    this.companyPerPage.clear();

    const params: { per_page: number; search?: string } = { per_page: 10 };
    const search = term.trim();
    if (search) {
      params.search = search;
    }

    return this.integrationService
      .getBankAccountMappingData(params)
      .pipe(
        finalize(() => {
          this.initialLoading = false;
        })
      );
  }

  loadBankAccountMappingData(): void {
    this.bankSearchLoading = true;
    this.fetchBankAccountMappingData(this.searchControl.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.bankSearchLoading = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.QBConnectedData = res.data;
        }
      });
  }

  clearBankSearch(): void {
    if (!this.searchControl.value) {
      return;
    }

    this.searchControl.setValue('', { emitEvent: false });
    this.selectedRows.clear();
    this.loadBankAccountMappingData();
  }

  onCompanySelect(companyId: string | null): void {
    this.selectedCompanyId = companyId ?? 'all';
    this.selectedRows.clear();
  }

  refreshData(): void {
    this.initialLoading = true;
    this.loadBankAccountMappingData();
  }

  /** ****************************** Pagination ******************************* */

  isPaginationLoading(realmId: string): boolean {
    return this.paginationLoading.get(realmId) ?? false;
  }

  getPerPageForCompany(realmId: string): number {
    return this.companyPerPage.get(realmId) ?? 10;
  }

  getPerPageStringForCompany(realmId: string): string {
    return String(this.companyPerPage.get(realmId) ?? 10);
  }

  onPerPageChangeForCompany(perPage: string | number, realmId: string): void {
    const perPageNum = +perPage;
    this.companyPerPage.set(realmId, perPageNum);
    this.loadCompanyBankAccounts(realmId, 1, perPageNum);
  }

  onPageChangeForCompany(direction: 'prev' | 'next', realmId: string): void {
    const company = this.QBConnectedData.find((c) => c.realmId === realmId);
    if (!company?.pagination) return;

    const currentPage = company.pagination.current_page;
    const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;

    if (newPage < 1 || newPage > company.pagination.last_page) return;

    const perPage = this.getPerPageForCompany(realmId);
    this.loadCompanyBankAccounts(realmId, newPage, perPage);
  }

  gotoPageForCompany(page: number | string, realmId: string): void {
    const pageNum = Number(page);
    if (pageNum > 0) {
      const perPage = this.getPerPageForCompany(realmId);
      this.loadCompanyBankAccounts(realmId, pageNum, perPage);
    }
  }

  onPageInputForCompany(
    input: HTMLInputElement,
    realmId: string,
    lastPage: number
  ): void {
    let pageNum = parseInt(input.value, 10);

    if (Number.isNaN(pageNum) || pageNum < 1) {
      pageNum = 1;
    } else if (pageNum > lastPage) {
      pageNum = lastPage;
    }

    // eslint-disable-next-line no-param-reassign
    input.value = pageNum.toString();
    this.gotoPageForCompany(pageNum, realmId);
  }

  getPaginationArray(
    currentPage: number,
    totalPages: number
  ): (number | string)[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        '...',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      ];
    }

    return [
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages
    ];
  }

  loadCompanyBankAccounts(
    realmId: string,
    page: number,
    perPage?: number
  ): void {
    const perPageNum = perPage ?? this.getPerPageForCompany(realmId);
    const filters = this.getSearchFilters(realmId);

    const params: {
      realmId?: string;
      page?: number;
      per_page?: number;
      quickBookId?: string;
      quickBookAccount?: string;
      ocwBankAccount?: string;
      ocwBankNickName?: string;
      search?: string;
    } = { realmId, page, per_page: perPageNum };

    if (this.searchControl.value.trim()) {
      params.search = this.searchControl.value.trim();
    }

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
    this.integrationService
      .getBankAccountMappingData(params)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.paginationLoading.set(realmId, false))
      )
      .subscribe((res) => {
        if (res.success && res.data.length > 0) {
          const companyIndex = this.QBConnectedData.findIndex(
            (c) => c.realmId === realmId
          );
          if (companyIndex !== -1) {
            this.QBConnectedData[companyIndex] = res.data[0];
          }
        }
      });
  }

  /** ****************************** Search ******************************* */

  getSearchFilters(realmId: string): {
    quickBookId: string;
    quickBookAccount: string;
    ocwBankAccount: string;
    ocwBankNickName: string;
  } {
    if (!this.companySearchFilters.has(realmId)) {
      this.companySearchFilters.set(realmId, {
        quickBookId: '',
        quickBookAccount: '',
        ocwBankAccount: '',
        ocwBankNickName: ''
      });
    }
    return (
      this.companySearchFilters.get(realmId) ?? {
        quickBookId: '',
        quickBookAccount: '',
        ocwBankAccount: '',
        ocwBankNickName: ''
      }
    );
  }

  onSearchChange(
    realmId: string,
    field:
      | 'quickBookId'
      | 'quickBookAccount'
      | 'ocwBankAccount'
      | 'ocwBankNickName',
    value: string
  ): void {
    const filters = this.getSearchFilters(realmId);
    filters[field] = value;

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(() => {
      this.loadCompanyBankAccounts(realmId, 1);
    }, 500);
  }

  /** ****************************** Selection ******************************* */

  toggleRowSelection(id: string): void {
    if (this.selectedRows.has(id)) {
      this.selectedRows.delete(id);
    } else {
      this.selectedRows.add(id);
    }
  }

  isRowSelected(id: string): boolean {
    return this.selectedRows.has(id);
  }

  isAllSelectedForCompany(realmId: string): boolean {
    const company = this.QBConnectedData.find((c) => c.realmId === realmId);
    if (!company || company.data.length === 0) return false;
    return company.data.every((bank) => this.selectedRows.has(bank.id));
  }

  toggleSelectAllForCompany(realmId: string): void {
    const company = this.QBConnectedData.find((c) => c.realmId === realmId);
    if (!company) return;

    if (this.isAllSelectedForCompany(realmId)) {
      company.data.forEach((bank) => this.selectedRows.delete(bank.id));
    } else {
      company.data.forEach((bank) => this.selectedRows.add(bank.id));
    }
  }

  getSelectedCountForCompany(realmId: string): number {
    const company = this.QBConnectedData.find((c) => c.realmId === realmId);
    if (!company) return 0;
    return company.data.filter((bank) => this.selectedRows.has(bank.id)).length;
  }

  /** ****************************** Actions ******************************* */

  openBankAccountMappingModal(
    id: string,
    data: IQBBankData,
    ismapping: string,
    companyId: string
  ): void {
    const dialogRef = this.dialog.open(V4MapBankAccountComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { app: 'QBO', qbId: id, data, ismapping, companyId }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadBankAccountMappingData();
      }
    });
  }

  onEditRow(
    id: string,
    data: IQBBankData,
    ismapping: string,
    companyId: string
  ): void {
    const dialogRef = this.dialog.open(V4MapBankAccountComponent, {
      maxWidth: '500px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { app: 'QBO', qbId: id, data, mode: 'edit', ismapping, companyId }
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadBankAccountMappingData();
      }
    });
  }

  removeMapping(id: string): void {
    const confirm = this.alertService.confirmAlert({
      content:
        'This will remove your current bank account mapping. Are you sure you want to continue?'
    });

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.integrationService
          .removeBankAccMapping({ id })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res.success) {
              this.alertService.successAlert({
                content: 'Mapping cleared successfully.',
                close: true
              });
              this.loadBankAccountMappingData();
            }
          });
      }
    });
  }

  onDeleteRow(id: string): void {
    const confirm = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this bank account?'
    });

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.loading = id;
        this.integrationService
          .deleteBankAccMapping(id)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => {
              this.loading = undefined;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.loadBankAccountMappingData();
              this.alertService.successAlert({
                content: 'Deleted Successfully',
                close: true
              });
            }
          });
      }
    });
  }

  onBulkDeleteForCompany(realmId: string): void {
    const company = this.QBConnectedData.find((c) => c.realmId === realmId);
    if (!company) return;

    const selectedIds = company.data
      .filter((bank) => this.selectedRows.has(bank.id))
      .map((bank) => bank.id);

    if (selectedIds.length === 0) {
      this.alertService.failedAlert({
        content: 'Please select at least one row'
      });
      return;
    }

    const confirm = this.alertService.confirmAlert({
      content: `Are you sure you want to delete ${selectedIds.length} selected bank account(s)?`
    });

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.bulkDeleteLoading = true;
        this.integrationService
          .bulkDeleteBankAccMapping(selectedIds)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => {
              this.bulkDeleteLoading = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              selectedIds.forEach((id) => this.selectedRows.delete(id));
              this.loadBankAccountMappingData();
              this.alertService.successAlert({
                content: 'Deleted Successfully',
                close: true
              });
            }
          });
      }
    });
  }

  /** ****************************** Import ******************************* */

  ImportBank(): void {
    const sendingData = {
      mode: 'Bank',
      companyList: this.data?.companies
    };

    if (this.data?.companyCount) {
      const dialogRef = this.dialog.open(V4CompanySelectModalComponent, {
        maxWidth: '510px',
        width: '93%',
        data: sendingData,
        disableClose: true,
        panelClass: 'paddingless-modal-rounded'
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res) {
          this.importBankFromCompany(res.realmId);
        }
      });
    }
  }

  private importBankFromCompany(realmId: string): void {
    this.quickBooksLoading.update((l) => ({ ...l, bank: true }));
    this.integrationService
      .importQuickbookBanks(realmId)
      .pipe(
        finalize(() =>
          this.quickBooksLoading.update((l) => ({ ...l, bank: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            content: 'Successfully Imported.',
            close: true
          });
          this.loadBankAccountMappingData();
        }
      });
  }

  /** ****************************** Dialog ******************************* */

  close(): void {
    this.dialogRef.close(true);
  }
}
