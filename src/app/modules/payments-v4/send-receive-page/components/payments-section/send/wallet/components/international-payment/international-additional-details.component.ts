import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CircleAlert, LucideAngularModule, Plus } from 'lucide-angular';

import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

import { SpCategoryDropdownComponent } from '../../../dropdowns/sp-category-dropdown/sp-category-dropdown.component';
import { SpSelectDropdownComponent } from '../../../dropdowns/sp-select-dropdown/sp-select-dropdown.component';

import { WalletPaymentService } from '../../services/wallet-payment.service';
import { InternationalPaymentUiService } from '../../services/international-payment-ui.service';
import { ScheduleNotifyComponent } from '../../../schedule-notify/schedule-notify.component';

/**
 * The international rail's Additional Details half: payee bank account, purpose
 * of payment, source of cash and category. State comes from the same
 * `InternationalPaymentUiService` the recipient card above the memo uses.
 */
@Component({
  selector: 'app-international-additional-details',
  standalone: true,
  imports: [ScheduleNotifyComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    V4ControlMessageComponent,
    SpCategoryDropdownComponent,
    SpSelectDropdownComponent
  ],
  templateUrl: './international-additional-details.component.html'
})
export class InternationalAdditionalDetailsComponent {
  private readonly walletPaymentService = inject(WalletPaymentService);

  readonly intl = inject(InternationalPaymentUiService);
  readonly form = this.walletPaymentService.detailsForm;

  readonly AlertIcon = CircleAlert;
  readonly PlusIcon = Plus;
}
