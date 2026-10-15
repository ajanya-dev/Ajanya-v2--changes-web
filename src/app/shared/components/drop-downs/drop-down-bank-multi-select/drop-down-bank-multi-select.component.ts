import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnChanges,
  ViewChild,
  inject,
  input,
  effect,
  SimpleChanges,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faSpinner } from '@fortawesome/pro-solid-svg-icons';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { debounceTime, distinctUntilChanged, finalize, Subject, Subscription } from 'rxjs';
import {
  IBankAccountEditDetails,
  IBankCreateRes,
  IBankDropdown
} from 'src/app/models/bank';
import { CloneDesignComponent } from 'src/app/modules/bank/bank-v2/modals/clone-design/clone-design.component';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';

/**
 * @description Drop down component for bank with multi select.
 */
@Component({
  standalone: true,
  imports: [
    NgSelectModule,
    FormsModule,
    CommonModule,
    FaIconComponent,
    MatTooltip
  ],
  selector: 'app-drop-down-bank-multi-select',
  templateUrl: './drop-down-bank-multi-select.component.html',
  styleUrls: ['./drop-down-bank-multi-select.component.scss']
})
export class DropDownBankMultiSelectComponent
  implements OnInit, OnChanges, OnDestroy
{
  private sharedService = inject(SharedService);
  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);
  private bankModalService = inject(BankModalService);
  private bankService = inject(BankAccountsService);

  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  @Input() placeholder = 'Select Your Bank Account';
  @Input() appendTo = 'ng-select';
  @Input() isMapping: string;
  @Input() showACHBadge = false;
  @Input() selectAll: boolean;
  @Input() routingNumber: number;
  @Input() selectedBankAccounts: IBankDropdown[] = [];
  @Output() selectionEvent = new EventEmitter();
  disableSelectionId = input<string>('');
  removedId = input<string>('');
  sliceNumber = input<number>(3);
  isSliceNeed = input<boolean>(false);
  enableAddNew = input<boolean>(false);
  isFromCloneCheck = input<boolean>(false);
  selectedBankAccountIds = input<string[]>([]);

  selectedItem: string | null;
  showSearch = false;
  page = 1;
  searchTerm = '';
  bankAccounts = signal<IBankDropdown[]>([]);
  searchTimeout: ReturnType<typeof setTimeout>;
  subscriptions: Subscription[] = [];
  isSelectedBankAccounts: IBankDropdown[] = [];
  isLoading = signal<boolean>(false);
  faSpinner = faSpinner;

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
  }

  ngOnInit(): void {
    this.loadBankAccounts();
    this.getNewCreatedBankData();
    this.debounceSearch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedBankAccounts) {
      this.loadSelectedBankAccounts();
    }
  }

  /**
   * @description Loads the bank accounts and sets it to `this.bankAccounts`.
   */
  loadBankAccounts() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.bankService
        .getBankAccounts(
          this.page,
          undefined,
          this.showACHBadge ? 1 : undefined,
          this.isMapping ? this.isMapping : undefined,
          this.routingNumber
        )
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          if (res?.success) {
            this.bankAccounts.set(res.data);
            this.addButton();
          }
        })
    );
  }

  addButton() {
    if (!this.enableAddNew()) return;
    const newItem = { id: 'new', nickName: 'New' } as IBankDropdown;
    const exists = this.bankAccounts().some((item) => item.id === newItem.id);

    if (!exists) {
      this.bankAccounts().unshift(newItem);
    }
  }

  /**
   * @description Load selected bank account
   */
  loadSelectedBankAccounts(): void {
    if (this.selectedBankAccounts?.length > 0) {
      // Remove duplicates based on id
      this.selectedBankAccounts = this.selectedBankAccounts.filter(
        (account, index, self) =>
          index === self.findIndex((t) => t.id === account.id)
      );

      this.isSelectedBankAccounts = this.selectedBankAccounts;
      this.selectionEvent.emit(this.selectedBankAccounts);
    }
    if (!this.selectAll) {
      this.isSelectedBankAccounts = [];
    }
  }

  /**
   * @description Gets newly created banka account data.
   */
  getNewCreatedBankData(): void {
    this.sharedService.getNewBankCreatedData().subscribe((result) => {
      if (!result) {
        this.selectedItem = null;
        return;
      }

      //* *****************for create new bank  and set that name automaticaly into the bank acc field******** */
      this.isLoading.set(true);
      this.subscriptions.push(
        this.bankService
          .getBankAccounts(
            this.page,
            undefined,
            this.showACHBadge ? 1 : undefined,
            this.isMapping ? this.isMapping : undefined,
            this.routingNumber
          )
          .pipe(finalize(() => this.isLoading.set(false)))
          .subscribe((res) => {
            this.bankAccounts.set(res.data);
            this.addButton();
          })
      );

      //* **********************in edit case use this section******************** */
      if (result) {
        if (result.bankAccountId !== undefined) {
          // Call API only when create new account
          this.subscriptions.push(
            this.bankService
              .viewBankById(result.bankAccountId)
              .subscribe((res) => {
                this.selectedItem = res.data.bankAccountNickName;
              })
          );
          return;
        }
        this.selectedItem = result.bankAccountNickName;
      }
    });
  }

  /**
   * @description Emits `selectionEvent` when selection is made.
   * @param event - selection event in template.
   */
  getChange(event: IBankDropdown[]) {
    if (Array.isArray(event)) {
      const btnItem = event.find((item) => item.id === 'new');
      if (btnItem) {
        this.ngSelectComponent.close();
        this.clearItem(btnItem.id);
        this.addNewBankAccount();
      } else {
        if(this.selectedBankAccounts.length || this.selectedBankAccountIds()?.length){
          this.removeDuplicatesAndRelated();
          return;
        }
        this.selectionEvent.emit(event);
      }
    }
  }

  removeDuplicatesAndRelated() {
    const seen = new Set<string>();
    const toRemove = new Set<string>();
    // eslint-disable-next-line no-restricted-syntax
    for (const account of this.isSelectedBankAccounts) {
      if (seen.has(account.id)) {
        toRemove.add(account.id);
      } else {
        seen.add(account.id);
      }
    }
    this.isSelectedBankAccounts = this.isSelectedBankAccounts.filter(account => !toRemove.has(account.id));
    this.selectionEvent.emit(this.isSelectedBankAccounts);
  }


  addNewBankAccount() {
    if (this.isFromCloneCheck()) {
      const dialogRef = this.dialog.open(CloneDesignComponent, {
        maxWidth: '510px',
        width: '100%',
        disableClose: true,
        autoFocus: false
      });
      dialogRef.afterClosed().subscribe((res) => {
        if (res?.success) {
          const bankDetails = this.convertIntoDropdownFormat(
            res.bankAcData as IBankCreateRes
          );
          this.isSelectedBankAccounts = [
            ...this.isSelectedBankAccounts,
            bankDetails
          ];
          this.selectionEvent.emit(this.isSelectedBankAccounts);
          this.bankAccounts().unshift(bankDetails);
          this.sharedService.setNewBankCreatedData({
            bankAccountId: res.id
          });
          this.headerService.refreshDynamicHeader.next(true);
        }
      });
      return;
    }
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.subscriptions.push(
      this.bankModalService
        .openAddBankOptimizedModal()
        .subscribe((bankModal) => {
          if (bankModal) {
            this.subscriptions.push(
              bankModal.afterClosed().subscribe((result) => {
                if (result?.success) {
                  const bankDetails = this.convertIntoDropdownFormat(
                    result.bankAcData as IBankCreateRes
                  );
                  this.isSelectedBankAccounts = [
                    ...this.isSelectedBankAccounts,
                    bankDetails
                  ];
                  this.selectionEvent.emit(this.isSelectedBankAccounts);
                  this.bankAccounts().unshift(bankDetails);
                  this.sharedService.setNewBankCreatedData({
                    bankAccountId: result.id
                  });
                  this.headerService.refreshDynamicHeader.next(true);
                }
              })
            );
          }
        })
    );
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

  clearSelection() {
    this.ngSelectComponent.handleClearClick();
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onScrollToEnd() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.bankService
        .getBankAccounts(
          this.page + 1,
          this.searchTerm,
          this.showACHBadge ? 1 : undefined,
          this.isMapping ? this.isMapping : undefined,
          this.routingNumber
        )
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          this.page += 1;
          const newUniqueAccounts = res.data.filter(
            (newAccount: IBankDropdown) =>
              !this.bankAccounts().some(
                (existingAccount) => existingAccount.id === newAccount.id
              )
          );
          this.bankAccounts.update((value) => [...value, ...newUniqueAccounts]);
          this.addButton();
        })
    );
  }

    subjectKeyUp = new Subject();
  /**
   * @description Gets data based on search term.
   * @param event - event
   */
  search(event: KeyboardEvent) {
    this.isLoading.set(true);
    this.searchTerm = (event?.target as HTMLInputElement).value;
    this.subjectKeyUp.next(this.searchTerm);
  }

  debounceSearch() {
    this.subjectKeyUp.pipe(debounceTime(600),distinctUntilChanged()).subscribe(() => {
      this.page = 1;
      this.subscriptions.push(
        this.bankService
          .getBankAccounts(
            this.page,
            this.searchTerm,
            undefined,
            this.isMapping ? this.isMapping : undefined,
            this.routingNumber
          )
          .pipe(finalize(() => this.isLoading.set(false)))
          .subscribe((res) => {
            this.bankAccounts.set(res.data);
            this.addButton();
          })
      );
    });
  }

  /**
   * @description Clears the changes made.
   */
  clear() {
    this.searchTerm = '';
    this.loadBankAccounts();
    this.isSelectedBankAccounts = [];
    this.selectedBankAccounts = [];
    this.selectionEvent.emit(this.selectedBankAccounts);
  }

  isItemSelected(item: IBankDropdown): boolean {
    return this.isSelectedBankAccounts.some(
      (selected) => selected.id === item.id
    );
  }

  /**
   * @description Compare function for ng-select to compare items by ID instead of reference
   */
  compareById = (a: IBankDropdown, b: IBankDropdown): boolean => a?.id === b?.id;

  clearItem(bankId: string) {
    this.isSelectedBankAccounts = this.isSelectedBankAccounts.filter(
      (selected) => selected.id !== bankId
    );
    this.selectionEvent.emit(this.isSelectedBankAccounts);
  }

  getMoreItemsTooltip(moreItems: IBankDropdown[]): string {
    return moreItems
      .map((item) => (item.nickName !== null ? item.nickName : item.bankName))
      .join(', ');
  }

  /**
   * @description Loads bank accounts by IDs and assigns to isSelectedBankAccounts
   * @param ids - array of bank account IDs
   */
  loadBankAccountsByIds(ids: string[]) {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.bankService
        .getBankAccountByIds(ids)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          if (res?.success && res.data?.length) {
            this.isSelectedBankAccounts = res.data;
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.sharedService.setNewBankCreatedData();
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
