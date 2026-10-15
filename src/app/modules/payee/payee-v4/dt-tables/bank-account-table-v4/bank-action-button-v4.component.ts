import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICellRendererParams } from '@ag-grid-community/core';
import { finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from 'src/environments/environment';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { BankModalService } from 'src/app/shared/bank-modal/service/bank-modal.service';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';
import { PayeeDataV35Service } from '../../../payee-v3/v35-services/payee-data-v35.service';
import { IPayeeBank } from '../../../payee-v2/model/payee';

interface BankAction {
  name: string;
  id: string;
  icon: string;
  /** Says what the option does — every menu item carries one. */
  tooltip: string;
}

@Component({
  selector: 'app-bank-action-button-v4',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatTooltipModule
  ],
  template: `
    <div class="action-cell">
      <button
        [matMenuTriggerFor]="menu"
        class="action-icon menu-trigger"
        matTooltip="Actions"
      >
        <lucide-icon name="ellipsis-vertical" [size]="14"></lucide-icon>
      </button>
    </div>

    <mat-menu #menu="matMenu" class="v4-action-menu">
      <div class="v4-menu-group-label">Actions</div>
      @for (btn of actions; track btn.id) {
        <button
          mat-menu-item
          (click)="onCellActionClick(btn.id)"
          [matTooltip]="btn.tooltip"
          matTooltipPosition="right"
          [class.v4-menu-item-danger]="btn.id === 'id_deleteRow'"
        >
          <div class="v4-menu-item">
            <lucide-icon [name]="btn.icon" [size]="16"></lucide-icon>
            <span>{{ btn.name }}</span>
          </div>
        </button>
      }
    </mat-menu>
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        height: 100%;
      }
    `
  ]
})
export class BankActionButtonV4Component {
  private payeeService = inject(PayeeService);
  private alertService = inject(V4AlertService);
  private v3DataTableService = inject(V3DataTableService);
  private payeeDataService = inject(PayeeDataV35Service);
  private bankModalService = inject(BankModalService);
  private destroyRef = inject(DestroyRef);

  params: ICellRendererParams;
  payeeIdSignal = computed(
    () => this.payeeDataService.payeeDataSignal()?.encryptedId
  );

  actions: BankAction[] = [
    {
      name: 'Edit',
      id: 'id_editRow',
      icon: 'square-pen',
      tooltip: "Edit this bank account's routing and account details"
    },
    {
      name: 'Delete',
      id: 'id_deleteRow',
      icon: 'trash-2',
      tooltip: 'Remove this bank account from the payee'
    },
    {
      name: 'Make Default For DD',
      id: 'default_dd',
      icon: 'check',
      tooltip: 'Use this account by default for direct deposit payments'
    }
  ];

  agInit(params: ICellRendererParams): void {
    this.params = params;
    if (environment.env_id === 'compass') {
      this.actions.push({
        name: 'Sync',
        id: 'id_sync',
        icon: 'refresh-cw',
        tooltip: 'Sync Bank Account with NetSuite'
      });
    }
  }

  refresh(): boolean {
    return false;
  }

  onCellActionClick(id: string): void {
    switch (id) {
      case 'id_editRow':
        this.onEditRow(this.params.data);
        break;
      case 'id_deleteRow':
        this.onDeleteRow(this.params.data.id);
        break;
      case 'default_dd':
        this.makeDefaultDDAccount(this.params.data.id);
        break;
      case 'id_sync':
        this.netsuiteSync(this.params.data.id);
        break;
      default:
        break;
    }
  }

  private makeDefaultDDAccount(id: string): void {
    this.payeeService
      .setDefaultDDBankAcc({ bankId: id, payeeId: this.payeeIdSignal() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (response.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: response.message
          });
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  private onEditRow(selectedItem: IPayeeBank): void {
    if (this.bankModalService.isBankPermissionChecking()) return;
    this.bankModalService
      .openAddBankNormalModalV4({
        payeeId: this.payeeIdSignal() ?? '',
        edit: true,
        bankId: selectedItem.id
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

  private onDeleteRow(id: string): void {
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this bank account?'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.payeeService
            .deletePayeeBank(this.payeeIdSignal() ?? '', id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => {
              if (response.success) {
                this.alertService.successAlert({
                  title: 'Success',
                  content: response.message
                });
                this.v3DataTableService.refreshV3DataTable();
              }
            });
        }
      });
  }

  private netsuiteSync(payeeBankId: string): void {
    this.payeeDataService.isSyncBank.set(true);
    this.payeeService
      .syncWithNetSuite(payeeBankId)
      .pipe(
        finalize(() => this.payeeDataService.isSyncBank.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ content: 'Syncing Completed.' });
        }
      });
  }
}
