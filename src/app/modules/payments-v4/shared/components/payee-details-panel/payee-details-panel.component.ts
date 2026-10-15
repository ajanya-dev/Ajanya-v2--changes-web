import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  computed,
  signal,
  Signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  User
} from 'lucide-angular';
import type {
  IPayeeBankDetails,
  IPayeeDropdown
} from 'src/app/modules/payee/payee-v2/model/payee';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { DOUBLE_SIDE_PANEL_DATA } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';

export interface IPayeeBankDetailsExt extends IPayeeBankDetails {
  bankInstitutionName?: string;
  name?: string;
  accountName?: string;
}

export interface IPayeeBankDropdownConfig {
  options: Signal<{ value: string; label: string }[]>;
  control: FormControl<string>;
  config: Iv4ngSelectConfig;
  loading: Signal<boolean>;
  onAddBank?: () => void;
}

export interface IPayeePanelData {
  payee: Signal<IPayeeDropdown | null>;
  showEditButton?: boolean;
  onEdit?: () => void;
  onBankEdit?: () => void;
  bankData?: Signal<IPayeeBankDetailsExt | null>;
  bankLoading?: Signal<boolean>;
  bankDropdown?: IPayeeBankDropdownConfig;
  /** When true, all interactive elements (edit buttons, dropdowns) are disabled */
  disabled?: Signal<boolean>;
}

@Component({
  selector: 'app-payee-details-panel',
  standalone: true,
  imports: [
    LucideAngularModule,
    ReactiveFormsModule,
    V4CommonDropDownSelectorComponent
  ],
  templateUrl: './payee-details-panel.component.html',
  styleUrl: './payee-details-panel.component.scss'
})
export class PayeeDetailsPanelComponent {
  private panelData = inject<IPayeePanelData | null>(DOUBLE_SIDE_PANEL_DATA, {
    optional: true
  });
  private bankAccountsService = inject(BankAccountsService);
  private destroyRef = inject(DestroyRef);

  // Inputs (for template-based usage)
  payeeInput = input<IPayeeDropdown | null>(null);
  showEditButtonInput = input(true);
  edit = output<void>();

  // Resolved values — injection takes precedence over inputs
  payee = computed(() => this.panelData?.payee() ?? this.payeeInput());
  showEditButton = computed(
    () => this.panelData?.showEditButton ?? this.showEditButtonInput()
  );
  readonly disabled = computed(() => this.panelData?.disabled?.() ?? false);

  readonly buildingIcon = Building2;
  readonly mailIcon = Mail;
  readonly phoneIcon = Phone;
  readonly mapPinIcon = MapPin;
  readonly pencilIcon = Pencil;
  readonly userIcon = User;
  readonly plusIcon = Plus;

  // Bank data — read from parent-owned signals (no fetching here)
  readonly bankData = computed(() => this.panelData?.bankData?.() ?? null);
  readonly bankLoading = computed(
    () => this.panelData?.bankLoading?.() ?? false
  );

  // Bank dropdown — optional, only shown when provided (e.g. check draft)
  readonly bankDropdown = computed(() => this.panelData?.bankDropdown ?? null);

  // Payee type label
  readonly payeeTypeLabel = computed(() => {
    const map: Record<string, string> = {
      1: 'Customer',
      2: 'Vendor',
      3: 'Employee'
    };
    return map[this.payee()?.payeeTypeId ?? ''] ?? '';
  });

  // Masked account number
  readonly maskedAccountNumber = computed(() => {
    const num = String(this.bankData()?.accountNumber ?? '');
    return num.length >= 4 ? `****${num.slice(-4)}` : num;
  });

  // bankName field on IPayeeBankDetails = account holder name (API naming matches V35's bank_name)
  readonly accountHolderName = computed(() => this.bankData()?.bankName || '');

  // Institution name fetched via routing number lookup (matching V35 behavior)
  readonly bankInstitutionName = signal('');

  private lastLookedUpRouting = '';

  constructor() {
    effect(() => {
      const bank = this.bankData();
      const routing = String(bank?.routingNumber ?? '');
      if (!routing || routing === this.lastLookedUpRouting) return;
      this.lastLookedUpRouting = routing;
      this.bankInstitutionName.set('');
      this.fetchBankName(routing, bank);
    }, { allowSignalWrites: true });
  }

  private fetchBankName(routing: string, bank: IPayeeBankDetailsExt | null): void {
    this.bankAccountsService
      .getroutingNumber(routing)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const name = res?.data?.name;
          if (name && name !== 'Bank Name') {
            this.bankInstitutionName.set(name);
          } else {
            this.bankInstitutionName.set(
              bank?.bankInstitutionName || bank?.name || bank?.accountName || ''
            );
          }
        }
      });
  }

  // Nickname (payee.nickName is optional, and may come as empty/whitespace)
  readonly nickNameValue = computed(() => {
    const v = this.payee()?.nickName;
    if (v == null) return '';
    return String(v).trim();
  });

  // Bank edit button visible only when callback provided
  readonly showBankEditButton = computed(() => !!this.panelData?.onBankEdit);

  formatAccountType(value: string): string {
    return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
  }

  readonly addressLines = computed(() => {
    const p = this.payee();
    if (!p) return [];
    const lines: string[] = [];
    if (p.addressLine1) lines.push(String(p.addressLine1));
    const cityStateZip = [p.city, p.state, p.zip].filter(Boolean).join(', ');
    if (cityStateZip) lines.push(cityStateZip);
    if (p.country) lines.push(p.country);
    return lines;
  });

  onEditClick(): void {
    if (this.panelData?.onEdit) {
      this.panelData.onEdit();
    } else {
      this.edit.emit();
    }
  }

  onBankEditClick(): void {
    this.panelData?.onBankEdit?.();
  }
}
