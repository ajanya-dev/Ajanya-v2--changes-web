import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatDivider } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IPaymentLinksListItem } from 'src/app/modules/data-table/components/data-table/data-table.model';
import { getPaymentLinkStatus, STATUS_CONFIG, PaymentLinkStatus } from '../../models/v4-payment-links.model';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
@Component({
  selector: 'app-v4-list-panel',
  standalone: true,
  imports: [
    NgClass,
    FormsModule,
    LucideAngularModule,
    MatDivider,
    MatMenuModule,
    MatTooltip,
    CommonButtonV4Component
  ],
  templateUrl: './list-panel.component.html',
  styleUrls: ['./list-panel.component.scss']
})
export class ListPanelComponent {
  links = input<IPaymentLinksListItem[]>([]);
  loading = input(false);
  selectedLinkId = input<string>('');
  totalCount = input(0);
  collapsed = input(false);
  hideCollapseToggle = input(false);
  selectedListTab = input<'active' | 'archived'>('active');
  searchTerm = input('');
  selectLink = output<IPaymentLinksListItem>();
  editLink = output<IPaymentLinksListItem>();
  copyLink = output<IPaymentLinksListItem>();
  shareLink = output<IPaymentLinksListItem>();
  archiveLink = output<IPaymentLinksListItem>();
  restoreLink = output<IPaymentLinksListItem>();
  viewDetails = output<IPaymentLinksListItem>();
  viewAuditTrail = output<IPaymentLinksListItem>();
  searchChange = output<string>();
  loadMore = output<void>();
  createNew = output<void>();
  toggleCollapse = output<void>();
  tabChange = output<'active' | 'archived'>();

  readonly tabs: { label: string; value: 'active' | 'archived' }[] = [
    { label: 'Active', value: 'active' },
    { label: 'Archived', value: 'archived' }
  ];

  getStatus(item: IPaymentLinksListItem): PaymentLinkStatus {
    return getPaymentLinkStatus(item);
  }

  getStatusConfig(item: IPaymentLinksListItem) {
    return STATUS_CONFIG[this.getStatus(item)];
  }

  onSearch(term: string) {
    this.searchChange.emit(term);
  }

  onScroll(event: Event) {
    const el = event.target as HTMLElement;
    const threshold = 80;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      this.loadMore.emit();
    }
  }

  getFullUrl(link: IPaymentLinksListItem): string {
    return `${StaticWhiteLabelConditions.paymentShortLink}/${link.shortUrl}`;
  }
}
