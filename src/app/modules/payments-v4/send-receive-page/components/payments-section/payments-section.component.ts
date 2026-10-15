import { Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';

import { SendReceivePageService } from '../../services/send-receive-page.service';
import { SendComponent } from './send/send.component';
import { ReceiveComponent } from './receive/receive.component';

/**
 * Owns which half of the page is on screen: it renders Send or Receive from the
 * mode the route published, and passes nothing down.
 */
@Component({
  selector: 'app-payments-section',
  standalone: true,
  imports: [CommonModule, SendComponent, ReceiveComponent],
  templateUrl: './payments-section.component.html',
  styleUrls: ['./payments-section.component.scss']
})
export class PaymentsSectionComponent {
  private page = inject(SendReceivePageService);

  readonly mode = this.page.pageMode;
}
