import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import {
  Observable,
  combineLatest,
  debounceTime,
  filter,
  map,
  take,
  timeout
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule,
  Search,
  X,
  Landmark,
  Plus,
  ArrowLeft,
  Building2
} from 'lucide-angular';

import { IBankCreateRes, IBankDropdown } from 'src/app/models/bank';
import { bankAccountsActions } from 'src/app/modules/store/bankAccounts/bank-accounts.actions';
import {
  selectBankAccounts,
  selectBankAccountsState,
  selectFilteredBankAccounts,
  selectIsBankAccountsByIdLoading,
  selectIsBankAccountsFilterOn,
  selectIsBankAccountsLoading
} from 'src/app/modules/store/bankAccounts/bank-accounts.selectors';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { ScrollToEndDirective } from 'src/app/directive/scroll-to-end.directive';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.service';
import { AddNewBankV4ModalComponent } from 'src/app/modules/bank/bank-v4/v4-modals/add-new-bank-v4-modal/add-new-bank-v4-modal.component';
import { BankVerificationModalV4Component } from 'src/app/modules/user/user-v4/modals/bank-verification-modal-v4/bank-verification-modal-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { AchVerificationRequiredModalComponent } from '../../modals/ach-verification-required-modal/ach-verification-required-modal.component';
import { IBankAccountsState } from 'src/app/models/bank';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';

@Component({
  selector: 'app-payments-bank-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ScrollToEndDirective,
    LucideAngularModule,
    AddNewBankV4ModalComponent
  ],
  templateUrl: './payments-bank-list.component.html',
  styleUrl: './payments-bank-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentsBankListComponent implements OnInit {
  private store = inject(Store);
  private headerService = inject(HeaderService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private doubleSideModalService = inject(CustomDoubleSideModalService);
  public paymentsService = inject(PaymentsService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private bankAccountsService = inject(BankAccountsService);

  bankAccountId = input<string | null>(null);
  placeholder = input<string>('Select Your Bank');
  bankValidationMethod = input<string | null>(null);
  requestContext = input<'payment' | 'cashExpense' | 'checkDraft'>('payment');
  /** When true, emits addNewClicked instead of showing inline bank form */
  useExternalAddNew = input(false);
  addNewLabel = input<string>('Add New Bank Account');
  addNewSubLabel = input<string>('Connect a new bank account for payments');
  bankSelected = output<IBankDropdown | null>();
  addNewClicked = output<void>();

  bankAccounts$: Observable<IBankDropdown[]> =
    this.store.select(selectBankAccounts);

  displayedBankAccounts$: Observable<IBankDropdown[]> = this.bankAccounts$.pipe(
    map((banks) => {
      const favorites = banks.filter((b) => b.isFavorite === 1);
      const others = banks.filter((b) => b.isFavorite !== 1);
      // Initial dropdown state should only show a compact preview list.
      // Full/filtered results are shown via search mode.
      return [...favorites, ...others].slice(0, 3);
    })
  );

  filteredBankAccounts$: Observable<IBankDropdown[]> = this.store.select(
    selectFilteredBankAccounts
  );

  isFilterOn$: Observable<boolean> = this.store.select(
    selectIsBankAccountsFilterOn
  );

  isLoading$: Observable<boolean> = this.store.select(
    selectIsBankAccountsLoading
  );

  selectedBank = signal<IBankDropdown | null>(null);
  searchTerm = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // Lucide icons
  readonly SearchIcon = Search;
  readonly XIcon = X;
  readonly LandmarkIcon = Landmark;
  readonly PlusIcon = Plus;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly building2 = Building2;

  showAddBankForm = signal(false);

  private getRequestContext(): IBankAccountsState['context'] {
    if(this.requestContext() === 'cashExpense') {
      return { forCashExpense: true };
    }
    if(this.requestContext() === 'checkDraft') {
      return { forCheckDraft: true };
    }
    return { forPayment: true };
  }

  ngOnInit(): void {
    this.store.select(selectBankAccountsState).pipe(take(1)).subscribe((state) => {
      if (!state.bankAccounts.length && !state.isLoading) {
        this.store.dispatch(
          bankAccountsActions.loadBankAccounts({
            searchTerm: '',
            context: this.getRequestContext()
          })
        );
      }
    });

    if (this.bankAccountId()) {
      this.setBankById(this.bankAccountId());
    }
  }

  setBankById(id: string | null): void {
    if (!id) return;

    combineLatest([this.bankAccounts$, this.filteredBankAccounts$])
      .pipe(
        filter(([bankAccounts]) => !!bankAccounts?.length),
        debounceTime(100),
        take(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(([bankAccounts]) => {
        const item = bankAccounts.find((b) => b.id === id);
        if (item) {
          this.selectBank(item);
        } else {
          this.loadItemsById(id);
        }
      });
  }

  /** Reload the bank list from API, then select the bank by ID */
  refreshAndSelectBank(id: string): void {
    this.store.dispatch(
      bankAccountsActions.loadBankAccounts({
        searchTerm: '',
        isReload: true,
        context: this.getRequestContext()
      })
    );
    this.loadItemsById(id);
  }

  /** Directly select a newly created cash account without relying on the bank accounts store */
  selectCashAccount(account: IBankDropdown): void {
    this.selectedBank.set(account);
    this.bankSelected.emit(account);
  }

  private loadItemsById(id: string): void {
    this.store.dispatch(
      bankAccountsActions.loadBankAccountsByIds({
        ids: [id],
        context: this.getRequestContext()
      })
    );

    combineLatest([
      this.bankAccounts$,
      this.store.select(selectIsBankAccountsByIdLoading)
    ])
      .pipe(
        debounceTime(100),
        filter(([bankAccounts, isLoading]) => !isLoading && !!bankAccounts.find((b) => b.id === id)),
        take(1),
        timeout(10000),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(([bankAccounts]) => {
        const item = bankAccounts.find((b) => b.id === id);
        if (item) {
          this.selectBank(item);
        }
      });
  }

  clearSearch(): void {
    this.searchTerm = '';
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
    this.store.dispatch(bankAccountsActions.bankAccountsReset());
    this.store.dispatch(
      bankAccountsActions.loadBankAccounts({
        searchTerm: '',
        context: this.getRequestContext()
      })
    );
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    const term = this.searchTerm.replace(/&/g, '%26');
    this.searchTimeout = setTimeout(() => {
      this.store.dispatch(bankAccountsActions.bankAccountsReset());
      this.store.dispatch(
        bankAccountsActions.loadBankAccounts({
          searchTerm: term,
          context: this.getRequestContext()
        })
      );
    }, 600);
  }

  onScrollToEnd(): void {
    this.store.dispatch(bankAccountsActions.loadMoreBankAccounts());
  }

  selectBank(bank: IBankDropdown): void {
    this.selectedBank.set(bank);
    const method = this.bankValidationMethod();

    if (method && bank.country === 'Canada') {
      this.showCanadianBankBlockedAlert(method);
      return;
    }

    if (method && !this.isAchVerified(bank)) {
      if (bank.verified === 1) {
        this.showNotAchApprovedAlert();
        return;
      }
      this.showAchRequiredModal(bank, method);
      return;
    }

    this.bankSelected.emit(bank);
  }

  removeSelectedBank(): void {
    this.selectedBank.set(null);
    this.bankSelected.emit(null);
  }

  /**
   * Re-validate the currently selected bank against the current method.
   * Called by parent when payment method changes after bank is already selected.
   */
  revalidateBank(): void {
    const bank = this.selectedBank();
    const method = this.bankValidationMethod();
    if (!bank || !method) return;

    if (bank.country === 'Canada') {
      this.showCanadianBankBlockedAlert(method);
      return;
    }

    if (!this.isAchVerified(bank)) {
      if (bank.verified === 1) {
        this.showNotAchApprovedAlert();
      } else {
        this.showAchRequiredModal(bank, method);
      }
    }
  }

  private showCanadianBankBlockedAlert(method: string): void {
    const messages: Record<string, string> = {
      ach: 'Sending ACH payments from Canadian bank accounts is not allowed. Please select a US bank account to proceed with ACH payments.',
      'same-ach':
        'Sending ACH payments from Canadian bank accounts is not allowed. Please select a US bank account to proceed with ACH payments.',
      wire: 'Sending wire transfers from Canadian bank accounts is not allowed. Please select a US bank account to proceed.',
      'virtual-card':
        'Sending virtual cards from Canadian bank accounts is not allowed. Please select a US bank account to proceed.'
    };

    const dialogRef = this.alertService.infoAlert({
      title: 'Canadian Bank Account',
      content:
        messages[method] ||
        'This payment method is not available for Canadian bank accounts. Please select a US bank account to proceed.',
      doneMsg: 'OK',
      isCancel: false
    });

    dialogRef.afterClosed().subscribe(() => {
      this.removeSelectedBank();
    });
  }

  private showNotAchApprovedAlert(): void {
    const dialogRef = this.alertService.warningAlert({
      title: 'Error',
      content: 'This bank account is not approved for ACH. Please check your bank list to see the status.',
      doneMsg: 'View bank list',
      cancelMsg: 'Cancel',
      isCancel: true
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      this.selectedBank.set(null);
      if (confirmed) {
        this.doubleSideModalService.closeAll();
        this.router.navigateByUrl('/v4/manage/bank-accounts/index');
      }
    });
  }

  private showAchRequiredModal(bank: IBankDropdown, method: string): void {
    const dialogRef = this.dialog.open(AchVerificationRequiredModalComponent, {
      width: '448px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        bankName: this.getDisplayName(bank),
        accountNumber: bank.accountNumber ?? '',
        method
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.verify) {
        this.openVerificationModal(bank);
      } else {
        this.selectedBank.set(null);
      }
    });
  }

  private openVerificationModal(bank: IBankDropdown): void {
    const dialogRef = this.dialog.open(BankVerificationModalV4Component, {
      width: '448px',
      maxWidth: '95vw',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        bankId: bank.id,
        bankDetails: { verifiedBy: bank.verifiedBy, country: bank.country }
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.refreshBankAfterVerification(bank.id);
      } else {
        this.selectedBank.set(null);
      }
    });
  }

  /**
   * Refresh bank list from API after a verification flow completes.
   * If the bank is now ACH-verified, select and emit it.
   * If still pending, deselect so the user cannot proceed with an unverified bank.
   */
  private refreshBankAfterVerification(bankId: string): void {
    this.store.dispatch(
      bankAccountsActions.loadBankAccounts({
        searchTerm: '',
        isReload: true,
        context: this.getRequestContext()
      })
    );

    this.store.dispatch(
      bankAccountsActions.loadBankAccountsByIds({
        ids: [bankId],
        context: this.getRequestContext()
      })
    );

    combineLatest([
      this.bankAccounts$,
      this.store.select(selectIsBankAccountsByIdLoading)
    ])
      .pipe(
        debounceTime(100),
        filter(
          ([bankAccounts, isLoading]) =>
            !isLoading && !!bankAccounts.find((b) => b.id === bankId)
        ),
        take(1),
        timeout(10000),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(([bankAccounts]) => {
        const updatedBank = bankAccounts.find((b) => b.id === bankId);
        if (updatedBank && this.isAchVerified(updatedBank)) {
          this.selectedBank.set(updatedBank);
          this.bankSelected.emit(updatedBank);
        } else {
          this.selectedBank.set(null);
        }
      });
  }

  addNewBankAccount(): void {
    this.bankAccountsService.checkPermissionToCreateBank().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((apiRes) => {
      if (apiRes.success) {
        if (this.useExternalAddNew()) {
          this.addNewClicked.emit();
          return;
        }
        this.showAddBankForm.set(true);
      }
    });
  }

  onBankCreated(res: {
    success: boolean;
    id: string;
    check_no: string;
    bankAcData: IBankCreateRes;
  }): void {
    if (res?.success) {
      const bankAccount = {
        accountNumber: `xxxx${(res.bankAcData as IBankCreateRes)?.bankAccountNumber.slice(-4)}`,
        achApplicationStatus: null,
        bankName: res.bankAcData?.bankName,
        cashAccount: 0,
        id: res.bankAcData?.id,
        isItZil: 0,
        mAch: 0,
        name: (res.bankAcData as IBankCreateRes)?.bankAccountName,
        nickName: (res.bankAcData as IBankCreateRes)?.bankAccountNickName,
        routingNumber: res.bankAcData?.routingNumber,
        status: '',
        statusDescription: '',
        verifiedBy: null,
        verified: 0
      } as unknown as IBankDropdown;
      this.store.dispatch(
        bankAccountsActions.addCreatedBankAccountIntoBankAccounts({
          bankAccount
        })
      );
      this.selectBank(bankAccount);
      this.showAddBankForm.set(false);
      this.headerService.refreshDynamicHeader.next(true);
    }
  }

  cancelAddBank(): void {
    this.showAddBankForm.set(false);
  }

  getDisplayName(bank: IBankDropdown): string {
    return bank.nickName ?? bank.name ?? '';
  }

  getSubText(bank: IBankDropdown): string {
    const bankName = bank.bankName ?? '';
    const accountNumber = bank.accountNumber ?? '';
    return `${bankName} ${accountNumber}`.trim();
  }

  isAchVerified(bank: IBankDropdown): boolean {
    return !!(bank.isItZil || bank.achApplicationStatus === 1);
  }

  getBankVerificationStatus(bank: IBankDropdown): 'achVerified' | 'verified' | 'confirmMD' | 'pending' | 'notVerified' | null {
    if (this.isAchVerified(bank)) return 'achVerified';
    if (bank.verified === 1) return 'verified';
    if (!this.bankValidationMethod()) return null;
    const vb = Number(bank.verifiedBy);
    if (vb === 3) return 'confirmMD';
    if (vb === 4) return 'pending';
    return 'notVerified';
  }
}
