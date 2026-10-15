import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Landmark,
  Plus,
  TriangleAlert,
  Wallet
} from 'lucide-angular';

import { PaymentsPayeeBankListComponent } from 'src/app/modules/payments-v4/shared/components/payments-payee-bank-list/payments-payee-bank-list.component';
import { SpDropdownShellComponent } from '../dropdown-shell/sp-dropdown-shell.component';

/** A row of the list, whether or not it is one of the payee's own accounts. */
interface IAccountRow {
  id: string;
  label: string;
  sub: string;
  isWallet: boolean;
}

/** The wallet row's own id, which is never a bank's. */
const WALLET_ROW_ID = '__wallet__';

@Component({
  selector: 'app-sp-payee-bank-dropdown',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SpDropdownShellComponent],
  templateUrl: './sp-payee-bank-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpPayeeBankDropdownComponent extends PaymentsPayeeBankListComponent {
  readonly BankIcon = Landmark;
  readonly PlusIcon = Plus;
  readonly WalletIcon = Wallet;
  override readonly TriangleAlertIcon = TriangleAlert;

  readonly label = input('Payee Bank Account');
  readonly tooltip = input(
    `Select the bank account where the money will be sent, or choose “Add New” to add a new account.`
  );

  readonly required = input(false);
  readonly placeholderText = input('Select or search a bank account');

  readonly searchPlaceholderText = input('Search or add payee bank accounts');

  /**
   * The page is re-reading the payee. The list is about to be replaced and the
   * account re-selected, so the bar shimmers rather than reading as empty —
   * which is what had users pressing Confirm into a refusal that was about to
   * answer itself.
   */
  readonly externalLoading = input(false);

  readonly resolving = computed(() => this.loading() || this.externalLoading());

  readonly awaitingPayee = computed(() => !this.payeeId());

  readonly awaitingPayeeHint = input(
    'Select a payee first — their bank accounts will appear here.'
  );

  readonly open = signal(false);

  /**
   * The shell owns the input and drops the term when the panel closes, so this
   * only ever holds what is being typed against the open list.
   */
  readonly term = signal('');

  /**
   * Offer the payee's wallet beside their accounts, the way the deposit list
   * does — `direct-deposit-v4` carries it in the same dropdown as a row whose
   * `value` is `0`, not as a second control.
   *
   * It is not an account: it is the absence of one. A deposit with no account
   * named waits in the payee's wallet until they withdraw it, which is what
   * this flow already sends when nothing is chosen. So the row selects nothing;
   * it gives the state of selecting nothing a name and a place to be chosen
   * from, instead of leaving it as an empty box the user has to infer.
   */
  readonly walletOption = input(false);
  readonly walletOptionLabel = input('Master Wallet');

  /**
   * Not offered once the wallet is on the list. The list has stopped being a
   * list of bank accounts by then — it is where the money goes — and "Add New
   * Bank Account" reads as the way to answer that, which it is not: a deposit
   * needs no account at all.
   */
  readonly showsAddNew = computed(
    () => !!this.addBankPayeeId() && !this.walletOption()
  );

  readonly options = computed<IAccountRow[]>(() => {
    const banks = this.banks().map((bank) => {
      const masked = this.getMaskedAccountNumber(bank);
      return {
        id: String(bank.id),
        label: this.getDisplayName(bank) || masked || 'Bank Account',
        sub: masked,
        isWallet: false
      };
    });

    if (!this.walletOption()) {
      return banks;
    }

    return [
      {
        id: WALLET_ROW_ID,
        label: this.walletOptionLabel(),
        sub: 'Held until they withdraw it',
        isWallet: true
      },
      ...banks
    ];
  });

  /**
   * The account number is searched alongside the name: it is on the row as the
   * masked `*****1234`, which is what someone reading off a statement types.
   */
  readonly filteredOptions = computed<IAccountRow[]>(() => {
    const term = this.term().trim().toLowerCase();
    const rows = this.options();
    if (!term) {
      return rows;
    }
    return rows.filter(
      (row) =>
        row.label.toLowerCase().includes(term) ||
        row.sub.toLowerCase().includes(term)
    );
  });

  readonly selectedOption = computed<IAccountRow | null>(() => {
    const id = this.selectedBankId();
    const rows = this.options();

    if (this.awaitingPayee()) return null;

    if (id === null || id === undefined) {
      // Nothing chosen IS the wallet, wherever the wallet is on offer.
      return rows.find((row) => row.isWallet) ?? null;
    }
    return rows.find((row) => row.id === String(id)) ?? null;
  });

  onSelectRow(row: IAccountRow): void {
    this.open.set(false);
    if (row.isWallet) {
      this.onDropdownChange(null);
      return;
    }
    this.onDropdownChange(row.id);
  }

  override addNewBankAccount(): void {
    this.open.set(false);
    super.addNewBankAccount();
  }

  override openWireDetails(): void {
    this.open.set(false);
    super.openWireDetails();
  }
}
