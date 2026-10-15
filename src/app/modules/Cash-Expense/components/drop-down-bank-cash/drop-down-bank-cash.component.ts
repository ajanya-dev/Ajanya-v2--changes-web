import {
  Component,
  effect,
  EventEmitter,
  inject,
  input,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { finalize, Subscription } from 'rxjs';
import { IBankDropdown } from 'src/app/models/bank';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialog } from '@angular/material/dialog';
import { CashExpenseService } from '../../../../shared/service/cashExpense/cash-expense.service';
import { NewCashAccountModalComponent } from '../../modals/new-cash-account-modal/new-cash-account-modal.component';

@Component({
  selector: 'app-drop-down-bank-cash',
  templateUrl: './drop-down-bank-cash.component.html',
  styleUrls: ['./drop-down-bank-cash.component.scss'],
  standalone: true,
  imports: [NgSelectModule, FormsModule, FontAwesomeModule]
})
export class DropDownBankCashComponent implements OnInit, OnDestroy {
  private cashExpenseService = inject(CashExpenseService);
  private dialog = inject(MatDialog);

  @Input() placeholder = 'Select a Cash/Bank Account';
  @Input() enableAddNew = false;
  @Input() addTag = false;
  selectedBankId = input<string>();
  @Output() selectionEvent = new EventEmitter();

  selectedItem: IBankDropdown | null;
  page = 1;
  searchTerm = '';
  bankAndCashAccounts: IBankDropdown[] = [];
  subscriptions: Subscription[] = [];
  loading = false;

  constructor(){
    effect(() => {
      const selectedBankId = this.selectedBankId();
      if(selectedBankId){
        this.handleNewlyCreatedBankAccount(selectedBankId);
      }
    });
  }

  ngOnInit(): void {
    this.loadBankAccounts();
  }

  /**
   * Load bank accounts
   */
  loadBankAccounts() {
    this.loading = true;
    this.subscriptions.push(
      this.cashExpenseService
        .getBankAndCashAccounts(this.page, undefined, undefined, 1)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            this.bankAndCashAccounts = res.data;
          }
        })
    );
  }

  /**
   * Get a event aheny user selected a item
   * @param event IBankDropdown | null | undefined | 'add-new'
   */
  getChange(event: IBankDropdown | null | undefined | 'add-new') {
    if (event === 'add-new') {
      this.onAddNew();
      return;
    }
    this.selectionEvent.emit(event);
  }

  /**
   * Handle add new button click
   */
  onAddNew() {
    const dialogRef = this.dialog.open(NewCashAccountModalComponent, {
      maxWidth: '510px',
      width: '93%',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.success) {
        // If we have a newly created bank account, handle it
        if (result.id) {
          this.handleNewlyCreatedBankAccount(result.id);
        }
      } else {
        this.selectionEvent.emit(null);
        this.selectedItem = null;
      }
    });
  }

  /**
   * Handle newly created bank account
   * @param bankAccountId string
   */
  private handleNewlyCreatedBankAccount(bankAccountId: string) {
    // Get the newly created bank account details
    this.subscriptions.push(
      this.cashExpenseService
        .viewBankAndCashAccountById(bankAccountId)
        .pipe()
        .subscribe((res) => {
          if (res.data) {
            const newBankAccount = res.data;

            // Create a proper IBankDropdown object from the response
            const bankDropdownItem: IBankDropdown = {
              id: newBankAccount.id || bankAccountId,
              name: newBankAccount.bankAccountName || '',
              nickName:
                newBankAccount.bankAccountNickName ||
                newBankAccount.bankAccountName ||
                '',
              accountNumber: newBankAccount.bankAccountNumber || '',
              bankName: newBankAccount.bankId || '',
              verified: newBankAccount.bankAccountVerified || 0
            };

            // Add the new account to the beginning of the list
            this.bankAndCashAccounts.unshift(bankDropdownItem);

            // Auto-select the newly created account
            this.selectedItem = bankDropdownItem;

            // Emit the selection event
            this.selectionEvent.emit(bankDropdownItem);
          }
        })
    );
  }

  /**
   * Get next 10 element on each scroll event
   */
  onScrollToEnd() {
    this.page += 1;
    this.loading = true;
    this.subscriptions.push(
      this.cashExpenseService
        .getBankAndCashAccounts(this.page, undefined, undefined, 1)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            // Filter out items that already exist in bankAndCashAccounts based on id
            const uniqueNewItems = res.data.filter(
              (newItem: IBankDropdown) =>
                !this.bankAndCashAccounts.some(
                  (existingItem: IBankDropdown) =>
                    existingItem.id === newItem.id
                )
            );

            // Only push unique items
            uniqueNewItems.forEach((element: IBankDropdown) => {
              this.bankAndCashAccounts.push(element);
            });
          }
        })
    );
  }

  /**
   * Get data based on search term
   * @param event EventTarget
   */
  search(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.loading = true;
    this.subscriptions.push(
      this.cashExpenseService
        .getBankAndCashAccounts(1, this.searchTerm, undefined, 1)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (res) => {
            this.bankAndCashAccounts = res.data;
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.cashExpenseService.setNewCashAccountCreatedData(null);
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
