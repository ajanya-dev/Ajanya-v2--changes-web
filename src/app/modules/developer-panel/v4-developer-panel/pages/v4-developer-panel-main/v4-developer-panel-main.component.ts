import { Component, signal } from '@angular/core';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { ApiSettingsV4Component } from '../../components/api-settings-v4/api-settings-v4.component';
import { SupportResourcesV4Component } from '../../components/support-resources-v4/support-resources-v4.component';
import { BankAccountsV4Component } from '../../components/bank-accounts-v4/bank-accounts-v4.component';
import { WebhooksV4Component } from '../../components/webhooks-v4/webhooks-v4.component';

@Component({
  selector: 'app-v4-developer-panel-main',
  templateUrl: './v4-developer-panel-main.component.html',
  styleUrls: ['./v4-developer-panel-main.component.scss'],
  standalone: true,
  imports: [CommonTabV4Component, V4PageHeaderComponent, ApiSettingsV4Component, SupportResourcesV4Component, BankAccountsV4Component, WebhooksV4Component]
})
export class V4DeveloperPanelMainComponent {
  activeTab = signal<string>('api-settings');

  tabs: ITabItem[] = [
    { label: 'API Settings', value: 'api-settings', lucideIcon: 'key' },
    { label: 'Webhooks', value: 'webhooks', lucideIcon: 'webhook' },
    { label: 'Bank Accounts', value: 'bank-accounts', lucideIcon: 'building-2' }
  ];

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
  }
}
