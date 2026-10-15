import { Component, computed, input, output, signal } from '@angular/core';
import { LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular';
import {
  ICheckMailTrackDetails,
  ICheckCustomAddress,
  USPS_FIRST_CLASS_MAILED_TYPE
} from 'src/app/modules/check/model/check';

export interface IGroupMailingInfo {
  check_mailing_group_check_ids: string[];
  check_mailing_group_name: string;
  check_mailing_group_id: string;
}

@Component({
  standalone: true,
  selector: 'app-po-mail-details-list',
  templateUrl: './mail-details-list.component.html',
  styleUrls: ['./mail-details-list.component.scss'],
  imports: [LucideAngularModule]
})
export class PoMailDetailsListComponent {
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  collapsed = signal(false);

  mailDetails = input<ICheckMailTrackDetails | null>(null);
  customFromAddress = input<ICheckCustomAddress | null>(null);
  customToAddress = input<ICheckCustomAddress | null>(null);
  payeeAddress = input<{
    name?: string;
    companyName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  } | null>(null);

  groupMailingDetails = input<IGroupMailingInfo | null>(null);
  maxHeight = input<string | null>('400px');

  isImbLimitedTracking = computed(
    () => this.mailDetails()?.mailedType === USPS_FIRST_CLASS_MAILED_TYPE
  );

  closed = output<void>();
  trackClicked = output<void>();
  groupMailingClicked = output<string>();

  toggleFold(): void {
    this.collapsed.update((v) => !v);
  }
}
