import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { IV4DataTableEmptyState } from 'src/app/modules/v4-data-table/components/v4-data-table-empty-state/v4-data-table-empty-state.component';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankActionButtonV4Component } from './bank-action-button-v4.component';
import { PayeeDataV35Service } from '../../../payee-v3/v35-services/payee-data-v35.service';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';

@Component({
  selector: 'app-bank-account-table-v4',
  standalone: true,
  imports: [V4DataTableComponent],
  templateUrl: './bank-account-table-v4.component.html',
  styleUrls: ['./bank-account-table-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [V3DataTableService]
})
export class BankAccountTableV4Component implements OnInit {
  private payeeDataService = inject(PayeeDataV35Service);
  private bankModalService = inject(BankModalService);
  private alertService = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private destroyRef = inject(DestroyRef);

  payeeId = input<string>();

  additionalPayload = computed(() => {
    const id = this.payeeId();
    return id ? { payeeId: id } : undefined;
  });

  private onClickNewButton$ = toObservable(
    computed(() => this.payeeDataService.payeeBankTableActions().onClickNewBank)
  );

  colDefBankName: ICoulmnDefFields = {
    headerName: 'Bank Account Holder Name',
    field: 'bank_name',
    minWidth: 200,
    flex: 2,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilter: false
  };

  colDefRoutingNumber: ICoulmnDefFields = {
    headerName: 'Routing Number',
    field: 'routing_number',
    minWidth: 140,
    flex: 1,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilter: false
  };

  colDefAccountNumber: ICoulmnDefFields = {
    headerName: 'Account Number',
    field: 'account_number',
    minWidth: 140,
    flex: 1,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilter: false
  };

  colDefAccountType: ICoulmnDefFields = {
    headerName: 'Account Type',
    field: 'account_type',
    minWidth: 130,
    flex: 1,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilter: false,
    cellRenderer: (params: ICellRendererParams) =>
      this.getAccountType(params.value)
  };

  colDefDefaultDD: ICoulmnDefFields = {
    headerName: 'Default For DD',
    field: 'is_default_for_direct_deposit',
    minWidth: 120,
    flex: 1,
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    floatingFilter: false,
    cellRenderer: (params: ICellRendererParams) => {
      if (params.value === 1) {
        return `<span class="text-v4-badge-success-text-color">Yes</span>`;
      }
      return '-';
    }
  };

  // Kebab-only cell, so this is a View column, not an Actions column: it pins
  // left and sits first. The right-edge rule covers Status / Actions columns,
  // and this grid has neither.
  colDefView: ICoulmnDefFields = {
    headerName: 'View',
    field: 'action',
    sortable: false,
    minWidth: 76,
    maxWidth: 88,
    cellRenderer: 'bankActionButton',
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    suppressMovable: true,
    pinned: 'left',
    lockPosition: true,
    lockPinned: true
  };

  columnDefs: ICoulmnDefFields[] = [
    this.colDefView,
    this.colDefBankName,
    this.colDefRoutingNumber,
    this.colDefAccountNumber,
    this.colDefAccountType,
    this.colDefDefaultDD
  ];

  readonly emptyStateConfig: IV4DataTableEmptyState = {
    icon: 'landmark',
    title: 'No bank accounts yet',
    description: 'Add a bank account to pay this payee by direct deposit or ACH',
    buttonText: 'Add Bank Account',
    buttonIcon: 'plus',
    // Embedded grid inside the payee modal — the viewport-derived default
    // height would overflow the dialog.
    compact: true
  };

  frameworkComponents = {
    bankActionButton: BankActionButtonV4Component
  };

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.listenForNewBankAction();
  }

  private listenForNewBankAction(): void {
    this.onClickNewButton$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((action) => {
        if (action === 'domestic') {
          this.openAddBankModal();
        }
      });
  }

  onEmptyStateAdd(): void {
    this.openAddBankModal();
  }

  openAddBankModal(): void {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.bankModalService
      .openAddBankNormalModalV4({
        payeeId: this.payeeDataService.payeeDataSignal()?.encryptedId ?? ''
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bankModal) => {
        if (bankModal) {
          bankModal
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
              if (result?.success) {
                this.alertService.successAlert({ title: 'Success' });
                this.v3DataTableService.refreshV3DataTable();
              }
            });
        }
      });
  }

  private getAccountType(accountType: string): string {
    const typeMap: Record<string, string> = {
      CHECKING: 'Checking',
      SAVINGS: 'Savings',
      BUSINESS: 'Business',
      personalChecking: 'Personal Checking',
      businessChecking: 'Business Checking',
      personalSavings: 'Personal Savings',
      businessSavings: 'Business Savings'
    };
    return typeMap[accountType] ?? accountType ?? '';
  }
}
