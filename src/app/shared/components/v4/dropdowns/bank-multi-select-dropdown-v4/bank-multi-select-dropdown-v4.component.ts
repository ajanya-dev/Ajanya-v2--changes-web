import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { LucideAngularModule, Check, LoaderCircle } from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import {
  IBankAccountEditDetails,
  IBankCreateRes,
  IBankDropdown
} from 'src/app/models/bank';
import { CloneCheckDesignV4Component } from 'src/app/modules/bank/bank-v4/v4-modals/clone-check-design-v4/clone-check-design-v4.component';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';

/**
 * @description V4 Bank accounts multi-select dropdown (payee-multi-select UI pattern).
 */
@Component({
  standalone: true,
  imports: [
    NgSelectModule,
    FormsModule,
    CommonModule,
    MatTooltipModule,
    LucideAngularModule
  ],
  selector: 'app-bank-multi-select-dropdown-v4',
  templateUrl: './bank-multi-select-dropdown-v4.component.html',
  styleUrls: ['./bank-multi-select-dropdown-v4.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BankMultiSelectDropdownV4Component implements OnInit {
  private bankService = inject(BankAccountsService);
  private destroyRef = inject(DestroyRef);
  private sharedService = inject(SharedService);
  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);
  private bankModalService = inject(BankModalService);

  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  placeholder = input('All Bank Accounts');
  appendTo = input('body');
  sliceNumber = input<number>(5);
  isSliceNeed = input<boolean>(true);
  selectAll = input<boolean>();
  routingNumber = input<number>();
  selectedBankAccounts = input<IBankDropdown[]>([]);
  selectedBankAccountIds = input<string[]>([]);
  isMapping = input<string>();
  showACHBadge = input<boolean>(false);
  disableSelectionId = input<string>('');
  removedId = input<string>('');
  enableAddNew = input<boolean>(false);
  isFromCloneCheck = input<boolean>(false);

  selectionEvent = output<IBankDropdown[]>();

  readonly CheckIcon = Check;
  readonly LoaderIcon = LoaderCircle;

  isLoading = signal(false);
  page = 1;
  searchTerm = '';
  bankAccounts = signal<IBankDropdown[]>([]);
  isSelectedBankAccounts = signal<IBankDropdown[]>([]);
  selectedItem: string | null = null;

  bankAccountOptions = computed(() =>
    this.bankAccounts().map((item) => ({
      ...item,
      disabled: item.id === this.disableSelectionId()
    }))
  );

  private subjectKeyUp = new Subject<string>();

  constructor() {
    effect(
      () => {
        if (this.removedId()) {
          this.clearItem(this.removedId());
        }
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        const ids = this.selectedBankAccountIds();
        if (ids?.length) {
          this.loadBankAccountsByIds(ids);
        }
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        this.selectedBankAccounts();
        this.loadSelectedBankAccounts();
      },
      { allowSignalWrites: true }
    );

    this.destroyRef.onDestroy(() => {
      this.sharedService.setNewBankCreatedData();
    });
  }

  ngOnInit(): void {
    this.loadBankAccounts();
    this.getNewCreatedBankData();
    this.debounceSearch();
  }

  loadBankAccounts(): void {
    this.isLoading.set(true);
    this.bankService
      .getBankAccounts(
        this.page,
        undefined,
        this.showACHBadge() ? 1 : undefined,
        this.isMapping() ? this.isMapping() : undefined,
        this.routingNumber()
      )
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.bankAccounts.set(res.data);
          this.addButton();
        }
      });
  }

  /**
   * Prepends a synthetic "New" option to the list so users can open the add-bank flow
   * directly from the dropdown.
   */
  addButton(): void {
    if (!this.enableAddNew()) return;
    const newItem = { id: 'new', nickName: 'New' } as IBankDropdown;
    const exists = this.bankAccounts().some((item) => item.id === newItem.id);
    if (!exists) {
      this.bankAccounts.update((list) => [newItem, ...list]);
    }
  }

  private loadSelectedBankAccounts(): void {
    const accounts = this.selectedBankAccounts();
    if (accounts?.length > 0) {
      const unique = accounts.filter(
        (account, index, self) =>
          index === self.findIndex((t) => t.id === account.id)
      );
      this.isSelectedBankAccounts.set(unique);
      this.selectionEvent.emit(unique);
      return;
    }
    if (!this.selectAll()) {
      this.isSelectedBankAccounts.set([]);
    }
  }

  private loadBankAccountsByIds(ids: string[]): void {
    this.isLoading.set(true);
    this.bankService
      .getBankAccountByIds(ids)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success && res.data?.length) {
          this.isSelectedBankAccounts.set(res.data);
        }
      });
  }

  /**
   * Subscribes to newly-created bank events from elsewhere in the app so this dropdown
   * refreshes its list and highlights the new bank.
   */
  private getNewCreatedBankData(): void {
    this.sharedService
      .getNewBankCreatedData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result) {
          this.selectedItem = null;
          return;
        }
        this.isLoading.set(true);
        this.bankService
          .getBankAccounts(
            this.page,
            undefined,
            this.showACHBadge() ? 1 : undefined,
            this.isMapping() ? this.isMapping() : undefined,
            this.routingNumber()
          )
          .pipe(
            finalize(() => this.isLoading.set(false)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            this.bankAccounts.set(res.data);
            this.addButton();
          });

        if (result.bankAccountId !== undefined) {
          this.bankService
            .viewBankById(result.bankAccountId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              this.selectedItem = res.data.bankAccountNickName;
            });
          return;
        }
        this.selectedItem = result.bankAccountNickName;
      });
  }

  onChange(event: IBankDropdown[]): void {
    if (!Array.isArray(event)) return;
    const btnItem = event.find((item) => item.id === 'new');
    if (btnItem) {
      this.ngSelectComponent?.close();
      this.clearItem(btnItem.id);
      this.addNewBankAccount();
      return;
    }
    if (
      this.selectedBankAccounts().length ||
      this.selectedBankAccountIds()?.length
    ) {
      this.removeDuplicatesAndRelated();
      return;
    }
    this.isSelectedBankAccounts.set(event);
    this.selectionEvent.emit(event);
  }

  private removeDuplicatesAndRelated(): void {
    const seen = new Set<string>();
    const toRemove = new Set<string>();
    // eslint-disable-next-line no-restricted-syntax
    for (const account of this.isSelectedBankAccounts()) {
      if (seen.has(account.id)) {
        toRemove.add(account.id);
      } else {
        seen.add(account.id);
      }
    }
    this.isSelectedBankAccounts.set(
      this.isSelectedBankAccounts().filter((a) => !toRemove.has(a.id))
    );
    this.selectionEvent.emit(this.isSelectedBankAccounts());
  }

  /**
   * Opens the add-bank modal (or clone-design modal when invoked from the clone-check flow).
   * On success, converts the created bank and appends it to the selection.
   */
  addNewBankAccount(): void {
    if (this.isFromCloneCheck()) {
      const dialogRef = this.dialog.open(CloneCheckDesignV4Component, {
        maxWidth: '510px',
        width: '100%',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded'
      });
      dialogRef
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.success) {
            const bankDetails = this.convertIntoDropdownFormat(
              res.bankAcData as IBankCreateRes
            );
            this.isSelectedBankAccounts.set([
              ...this.isSelectedBankAccounts(),
              bankDetails
            ]);
            this.selectionEvent.emit(this.isSelectedBankAccounts());
            this.bankAccounts.update((list) => [bankDetails, ...list]);
            this.sharedService.setNewBankCreatedData({
              bankAccountId: res.id
            });
            this.headerService.refreshDynamicHeader.next(true);
          }
        });
      return;
    }
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.bankModalService
      .openAddBankOptimizedModal()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bankModal) => {
        if (!bankModal) return;
        bankModal
          .afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((result) => {
            if (result?.success) {
              const bankDetails = this.convertIntoDropdownFormat(
                result.bankAcData as IBankCreateRes
              );
              this.isSelectedBankAccounts.set([
                ...this.isSelectedBankAccounts(),
                bankDetails
              ]);
              this.selectionEvent.emit(this.isSelectedBankAccounts());
              this.bankAccounts.update((list) => [bankDetails, ...list]);
              this.sharedService.setNewBankCreatedData({
                bankAccountId: result.id
              });
              this.headerService.refreshDynamicHeader.next(true);
            }
          });
      });
  }

  convertIntoDropdownFormat(
    data: IBankCreateRes | IBankAccountEditDetails
  ): IBankDropdown {
    return {
      accountNumber: `xxxx${data.bankAccountNumber.slice(-4)}`,
      achApplicationStatus: 0,
      bankName: data.bankAccountName,
      cashAccount: 0,
      id: data.id,
      isItZil: 0,
      mAch: 0,
      name: '',
      nickName: data.bankAccountNickName,
      status: '',
      statusDescription: '',
      verified: 0,
      verifiedBy: '',
      payrollVerified: (data as IBankAccountEditDetails).payrollVerified ?? 0
    };
  }

  clearSelection(): void {
    this.ngSelectComponent?.handleClearClick();
  }

  isItemSelected(item: IBankDropdown): boolean {
    return this.isSelectedBankAccounts().some((s) => s.id === item.id);
  }

  onScrollToEnd(): void {
    this.isLoading.set(true);
    this.bankService
      .getBankAccounts(
        this.page + 1,
        this.searchTerm,
        this.showACHBadge() ? 1 : undefined,
        this.isMapping() ? this.isMapping() : undefined,
        this.routingNumber()
      )
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.page += 1;
        const newUnique = res.data.filter(
          (newAcc: IBankDropdown) =>
            !this.bankAccounts().some((existing) => existing.id === newAcc.id)
        );
        this.bankAccounts.update((value) => [...value, ...newUnique]);
        this.addButton();
      });
  }

  search(event: KeyboardEvent): void {
    this.searchTerm = (event?.target as HTMLInputElement)?.value ?? '';
    this.subjectKeyUp.next(this.searchTerm);
  }

  private debounceSearch(): void {
    this.subjectKeyUp
      .pipe(
        debounceTime(600),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.page = 1;
        this.isLoading.set(true);
        this.bankService
          .getBankAccounts(
            this.page,
            this.searchTerm,
            undefined,
            this.isMapping() ? this.isMapping() : undefined,
            this.routingNumber()
          )
          .pipe(
            finalize(() => this.isLoading.set(false)),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((res) => {
            if (res?.success) {
              this.bankAccounts.set(res.data);
              this.addButton();
            }
          });
      });
  }

  clear(): void {
    this.searchTerm = '';
    this.page = 1;
    this.isSelectedBankAccounts.set([]);
    this.loadBankAccounts();
    this.selectionEvent.emit([]);
  }

  clearItem(bankId: string): void {
    const next = this.isSelectedBankAccounts().filter((b) => b.id !== bankId);
    this.isSelectedBankAccounts.set(next);
    this.selectionEvent.emit(next);
  }

  compareById = (a: IBankDropdown, b: IBankDropdown): boolean =>
    a?.id === b?.id;

  getMoreItemsTooltip(items: IBankDropdown[]): string {
    return (items ?? [])
      .map((item) => (item.nickName !== null ? item.nickName : item.bankName))
      .join(', ');
  }
}
