import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { LucideAngularModule, Mail } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-v4-bill-inbox-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CommonButtonV4Component],
  templateUrl: './v4-bill-inbox-banner.component.html',
  styleUrls: ['./v4-bill-inbox-banner.component.scss']
})
export class V4BillInboxBannerComponent {
  readonly Mail = Mail;

  setupBillInbox = output<void>();

  onSetupBillInbox(): void {
    this.setupBillInbox.emit();
  }
}
