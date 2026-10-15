import { Component, HostBinding, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Clipboard } from '@angular/cdk/clipboard';
import { InvoiceBillStateService } from 'src/app/modules/bill/services/invoice-bill-state.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { V4ConfigureBillInboxComponent } from '../../modals/v4-configure-bill-inbox/v4-configure-bill-inbox.component';

@Component({
  selector: 'app-v4-bill-inbox-header',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, V4PageHeaderComponent],
  templateUrl: './v4-bill-inbox-header.component.html'
})
export class V4BillInboxHeaderComponent {
  @HostBinding('class') class = 'block';

  private invoiceBillStateService = inject(InvoiceBillStateService);
  private clipboard = inject(Clipboard);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);

  readonly mappedEmail = this.invoiceBillStateService.mappedEmail;

  // Hardcoded for now — to be connected to real data later
  totalBills = 3;
  needsReviewCount = 1;

  tooltip = signal('Copy');

  copyEmail(): void {
    const email = this.mappedEmail();
    if (email) {
      this.clipboard.copy(email);
      this.tooltip.set('Copied!');
      this.alertService.successAlert({
        content: 'Copied to clipboard',
        close: true,
        timeout: 2500
      });
      setTimeout(() => {
        this.tooltip.set('Copy');
      }, 2000);
    }
  }

  openSettings(): void {
    this.dialog.open(V4ConfigureBillInboxComponent, {
      maxWidth: '680px',
      width: '93%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: {
        mappedEmailToBill: this.mappedEmail(),
        isEmailToBillMapped: !!this.mappedEmail()
      }
    });
  }
}
