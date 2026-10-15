import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { V4BillsTableComponent } from '../v4-bills-table/v4-bills-table.component';
import { V4BillInboxBannerComponent } from '../v4-bill-inbox-banner/v4-bill-inbox-banner.component';
import { V4ConfigureBillInboxComponent } from '../../modals/v4-configure-bill-inbox/v4-configure-bill-inbox.component';
import { InvoiceBillStateService } from '../../../services/invoice-bill-state.service';

@Component({
  selector: 'app-v4-bills-detailed-tab',
  standalone: true,
  imports: [
    CommonModule,
    CommonButtonV4Component,
    CommonTabV4Component,
    V4BillsTableComponent,
    V4BillInboxBannerComponent
  ],
  templateUrl: './v4-bills-detailed-tab.component.html',
  styleUrls: ['./v4-bills-detailed-tab.component.scss']
})
export class V4BillsDetailedTabComponent {
  private invoiceBillStateService = inject(InvoiceBillStateService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  constructor() {
    effect(
      () => {
        const trigger = this.invoiceBillStateService.billSavedTrigger();
        if (trigger > 0) {
          this.activeStatus.set('id_all');
        }
      },
      { allowSignalWrites: true }
    );
  }

  readonly billAutomationEnabled =
    this.invoiceBillStateService.billAutomationEnabled;

  readonly isEmailToBillMapped =
    this.invoiceBillStateService.isEmailToBillMapped;

  readonly isBillAutomationCallDone =
    this.invoiceBillStateService.isBillAutomationCallDone;

  activeStatus = signal('id_all');

  readonly statusTabs: ITabItem[] = [
    { label: 'All Bills', value: 'id_all' },
    { label: 'Paid Bills', value: 'id_paid' },
    { label: 'Bills To Pay', value: 'id_topay' },
    { label: 'Voided Bills', value: 'id_stvoid' }
  ];

  selectStatus(status: string): void {
    this.activeStatus.set(status);
  }

  navigateToBillInbox(): void {
    this.router.navigate(['/v4/manage/bill/inbox']);
  }

  onBillInbox(): void {
    this.dialog.open(V4ConfigureBillInboxComponent, {
      maxWidth: '680px',
      width: '93%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: {
        mappedEmailToBill: null,
        isEmailToBillMapped: false
      }
    });
  }
}
