import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { PdSkeletonComponent } from 'src/app/shared/V4/pd-skeleton/pd-skeleton.component';
import { PayeeDetailsV4Service } from '../../v4-services/payee-details-v4.service';
import { PayeeAccountActionsV4Service } from '../../v4-services/payee-account-actions-v4.service';
import {
  PayeeAccountFilter,
  PayeeAccountRow,
  countPayeeAccounts,
  countryName,
  filterPayeeAccounts,
  mergePayeeAccounts
} from '../../v4-components/payee-details-v4/payee-accounts.util';

export interface PayeeAccountsModalData {
  /** Filter to open on; the card passes its own so the modal continues it. */
  filter?: PayeeAccountFilter;
}

@Component({
  selector: 'app-payee-accounts-modal-v4',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    MatDialogClose,
    MatMenuModule,
    MatTooltip,
    LucideAngularModule,
    CommonTabV4Component,
    PdSkeletonComponent
  ],
  templateUrl: './payee-accounts-modal-v4.component.html',
  styleUrls: ['./payee-accounts-modal-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PayeeAccountsModalV4Component {
  private data = inject<PayeeAccountsModalData>(MAT_DIALOG_DATA, {
    optional: true
  });

  readonly detailsService = inject(PayeeDetailsV4Service);
  private actions = inject(PayeeAccountActionsV4Service);

  filter = signal<PayeeAccountFilter>(this.data?.filter ?? 'all');

  loading = computed(
    () =>
      this.detailsService.bankLoading() || this.detailsService.intlBankLoading()
  );

  allRows = computed(() =>
    mergePayeeAccounts(
      this.detailsService.bankAccounts(),
      this.detailsService.internationalAccounts()
    )
  );

  rows = computed(() => filterPayeeAccounts(this.allRows(), this.filter()));

  filterTabs = computed<ITabItem[]>(() => {
    const counts = countPayeeAccounts(this.allRows());
    const label = (name: string, count: number) =>
      this.loading() ? name : `${name} (${count})`;
    return [
      { label: label('All', counts.all), value: 'all' },
      { label: label('Domestic', counts.domestic), value: 'domestic' },
      { label: label('International', counts.international), value: 'international' }
    ];
  });

  emptyTitle = computed(() => {
    switch (this.filter()) {
      case 'domestic':
        return 'No domestic bank accounts yet';
      case 'international':
        return 'No international accounts yet';
      default:
        return 'No bank accounts yet';
    }
  });

  onFilterChange(value: string): void {
    this.filter.set(value as PayeeAccountFilter);
  }

  countryName(code: string): string {
    return code ? countryName(code) : '—';
  }

  defaultTooltip(row: PayeeAccountRow): string {
    if (row.kind === 'international') {
      const scope = row.international?.is_default_for_personal
        ? 'personal'
        : 'business';
      return `Default ${scope} account for international payments to this payee`;
    }
    return 'Default account for direct deposit / ACH to this payee';
  }

  onEdit(row: PayeeAccountRow): void {
    this.actions.edit(row);
  }

  onDelete(row: PayeeAccountRow): void {
    this.actions.delete(row);
  }

  onMakeDefault(row: PayeeAccountRow): void {
    this.actions.makeDefault(row);
  }
}
