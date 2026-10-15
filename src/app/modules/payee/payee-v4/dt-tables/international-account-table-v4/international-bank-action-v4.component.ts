import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { AddPayeeInternationalBankV4Component } from '../../v4-components/add-payee-international-bank-v4/add-payee-international-bank-v4.component';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';
import { PayeeDataV35Service } from '../../../payee-v3/v35-services/payee-data-v35.service';

interface IntlBankAction {
  name: string;
  id: string;
  icon: string;
}

@Component({
  selector: 'app-international-bank-action-v4',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatTooltip
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
          [class.v4-menu-item-danger]="btn.id === 'id_delete_button'"
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
export class InternationalBankActionV4Component {
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private payeeService = inject(PayeeService);
  private walletService = inject(WalletService);
  private v3DataTableService = inject(V3DataTableService);
  private payeeDataService = inject(PayeeDataV35Service);
  private destroyRef = inject(DestroyRef);

  params: ICellRendererParams;
  payeeIdSignal = computed(
    () => this.payeeDataService.payeeDataSignal()?.encryptedId
  );

  actions: IntlBankAction[] = [
    { name: 'Edit', id: 'id_edit_button', icon: 'square-pen' },
    { name: 'Delete', id: 'id_delete_button', icon: 'trash-2' },
    { name: 'Make As Default Account', id: 'id_default_account', icon: 'check' }
  ];

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(): boolean {
    return false;
  }

  onCellActionClick(id: string): void {
    switch (id) {
      case 'id_edit_button':
        this.openEditInternationalBankAccount(this.params.data.id);
        break;
      case 'id_delete_button':
        this.onDeleteRow(this.params.data.id);
        break;
      case 'id_default_account':
        this.makeDefaultInternationalAccount(this.params.data.id);
        break;
      default:
        break;
    }
  }

  private onDeleteRow(id: string): void {
    this.alertService
      .confirmAlert({ content: 'Are you sure to delete?' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.payeeService
            .DeletePayeeIPBank(id)
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

  private openEditInternationalBankAccount(bankAcId: string): void {
    const dialogRef = this.dialog.open(AddPayeeInternationalBankV4Component, {
      width: '100%',
      maxWidth: '800px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        payeeId: this.payeeIdSignal(),
        edit: true,
        bankId: bankAcId,
        accordionMode: true
      }
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response: { success: boolean }) => {
        if (response?.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Bank account updated successfully'
          });
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  private makeDefaultInternationalAccount(id: string): void {
    this.walletService
      .setDefaultBank({
        accountId: id,
        payeeId: this.payeeIdSignal() as string,
        type: this.params.data?.account_type ?? ''
      })
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
}
