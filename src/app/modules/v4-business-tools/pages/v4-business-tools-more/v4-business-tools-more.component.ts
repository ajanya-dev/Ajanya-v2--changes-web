import {
  Component,
  OnInit,
  OnDestroy,
  computed,
  inject,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { BusinessToolsService } from 'src/app/shared/service/business-tools/business-tools.service';
import { IBusinessTools } from 'src/app/modules/business-tools/model/business-tools';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

interface ToolIconInfo {
  icon: string;
  iconBg: string;
  iconBgLight: string;
}

const TOOL_COPY_OVERRIDES: Record<
  string,
  { product_name?: string; description?: string }
> = {
  'E-mail Writer': { product_name: 'Email Writer' },
  'Bank Data': {
    description:
      'Access real-time financial insights and analytics from all your bank accounts.'
  },
  'Zil Sign': {
    description:
      'Sign documents online easily and securely in just a few clicks.'
  },
  'New Payroll with filing (beta)': {
    description:
      'Streamline payroll processing with automatic tax filing – handles calculations, withholdings, and government filings.'
  }
};

function applyToolCopyOverride(tool: IBusinessTools): IBusinessTools {
  const override = TOOL_COPY_OVERRIDES[tool.product_name];
  return override ? { ...tool, ...override } : tool;
}

const TOOL_ICON_MAP: Record<string, ToolIconInfo> = {
  'Mailing Dashboard': {
    icon: 'mail',
    iconBg: 'var(--v4-accent-violet-color)',
    iconBgLight: 'rgba(121,36,255,0.12)'
  },
  'Mail Document': {
    icon: 'file-text',
    iconBg: 'var(--v4-common-sky-color)',
    iconBgLight: 'rgba(5,149,229,0.12)'
  },
  'Bank Data': {
    icon: 'database',
    iconBg: 'var(--v4-primary-brand-bold-color)',
    iconBgLight: 'rgba(32,49,157,0.12)'
  },
  'New Payroll with filing (beta)': {
    icon: 'dollar-sign',
    iconBg: 'var(--v4-common-sky-color)',
    iconBgLight: 'rgba(5,149,229,0.12)'
  },
  'Email Writer': {
    icon: 'pencil-line',
    iconBg: 'var(--v4-primary-brand-bold-color)',
    iconBgLight: 'rgba(32,49,157,0.12)'
  },
  'Positive Pay': {
    icon: 'shield-check',
    iconBg: 'var(--v4-secondary-brand-color)',
    iconBgLight: 'rgba(59,244,147,0.12)'
  },
  'Document Storage': {
    icon: 'folder-lock',
    iconBg: 'var(--v4-primary-brand-bold-color)',
    iconBgLight: 'rgba(32,49,157,0.12)'
  },
  'Zil Sign': {
    icon: 'pen-tool',
    iconBg: 'var(--v4-common-sky-color)',
    iconBgLight: 'rgba(5,149,229,0.12)'
  },
  'Group SMS': {
    icon: 'message-square',
    iconBg: 'var(--v4-common-sky-color)',
    iconBgLight: 'rgba(5,149,229,0.12)'
  },
  Fax: {
    icon: 'printer',
    iconBg: 'var(--v4-primary-brand-bold-color)',
    iconBgLight: 'rgba(32,49,157,0.12)'
  },
  Calendly: {
    icon: 'calendar',
    iconBg: 'var(--v4-common-yellow-color)',
    iconBgLight: 'rgba(245,158,11,0.12)'
  },
  Zoom: {
    icon: 'video',
    iconBg: 'var(--v4-common-sky-color)',
    iconBgLight: 'rgba(5,149,229,0.12)'
  },
  'Facebook Ad': {
    icon: 'megaphone',
    iconBg: 'var(--v4-primary-brand-bold-color)',
    iconBgLight: 'rgba(32,49,157,0.12)'
  },
  'Google Ad': {
    icon: 'target',
    iconBg: 'var(--v4-common-red-color)',
    iconBgLight: 'rgba(239,68,68,0.12)'
  },
  'Split Expense': {
    icon: 'layout-grid',
    iconBg: 'var(--v4-accent-violet-color)',
    iconBgLight: 'rgba(121,36,255,0.12)'
  },
  'Buy Insurance': {
    icon: 'shield',
    iconBg: 'var(--v4-common-sky-color)',
    iconBgLight: 'rgba(5,149,229,0.12)'
  },
  'Payroll (Beta)': {
    icon: 'dollar-sign',
    iconBg: 'var(--v4-common-sky-color)',
    iconBgLight: 'rgba(5,149,229,0.12)'
  },
  'Knowledge Base': {
    icon: 'file-text',
    iconBg: 'var(--v4-primary-brand-bold-color)',
    iconBgLight: 'rgba(32,49,157,0.12)'
  },
  'Shipping Label': {
    icon: 'truck',
    iconBg: 'var(--v4-common-green-color)',
    iconBgLight: 'rgba(8,177,96,0.12)'
  }
};

const DEFAULT_ICON: ToolIconInfo = {
  icon: 'settings',
  iconBg: 'var(--v4-primary-brand-color)',
  iconBgLight: 'rgba(32,49,157,0.12)'
};

@Component({
  selector: 'app-v4-business-tools-more',
  templateUrl: './v4-business-tools-more.component.html',
  styleUrls: ['./v4-business-tools-more.component.scss'],
  standalone: true,
  imports: [FormsModule, LucideAngularModule, CommonButtonV4Component]
})
export class V4BusinessToolsMoreComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private businessToolsService = inject(BusinessToolsService);
  private alert = inject(V4AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private headerService = inject(HeaderService);

  searchQuery = signal('');
  availableTools = signal<IBusinessTools[]>([]);
  upcomingTools = signal<IBusinessTools[]>([]);
  isDataLoaded = signal(false);
  isInfoAlertOpened = false;

  subscriptions: Subscription[] = [];
  dummyCards = Array.from({ length: 8 }, (_, i) => i + 1);

  getToolIcon(tool: IBusinessTools): ToolIconInfo {
    const name =
      tool.product_name === 'Document Vault'
        ? 'Document Storage'
        : tool.product_name;
    if (TOOL_ICON_MAP[name]) return TOOL_ICON_MAP[name];
    const key = Object.keys(TOOL_ICON_MAP).find((k) =>
      name.toLowerCase().startsWith(k.toLowerCase())
    );
    return key ? TOOL_ICON_MAP[key] : DEFAULT_ICON;
  }

  filteredAvailable = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.availableTools();
    return this.availableTools().filter(
      (tool) =>
        tool.product_name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q)
    );
  });

  filteredUpcoming = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.upcomingTools();
    return this.upcomingTools().filter(
      (tool) =>
        tool.product_name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.headerService.isSubHeaderVisible.next({
      hidden: false,
      animation: false
    });
    this.getBusinessTools();
  }

  getBusinessTools(): void {
    this.subscriptions.push(
      this.businessToolsService
        .getBusinessTools()
        .subscribe((res: IBusinessTools[]) => {
          const tools = res.map((t) => applyToolCopyOverride(t));
          tools.unshift({
            id: 'asdfafdasfds',
            isComingSoon: 0,
            icon: 'payroll.svg',
            is_applied: 2,
            product_name: 'Mail Document',
            routing: false,
            routing_link: '/v4/manage/business-tools/document-mail',
            description:
              'Upload and deliver documents to payees securely, with tracking confirmation.',
            allowedUser: 1,
            applicationStatus: 1,
            comming_soon: false,
            isApprovalRequired: 0
          });
          tools.unshift({
            id: 'groupmailing123',
            isComingSoon: 0,
            icon: 'group-email.svg',
            is_applied: 2,
            product_name: 'Mailing Dashboard',
            routing: false,
            routing_link: '/v4/manage/business-tools/mail-dashboard/index',
            description:
              'Track group mailings in one place: delivery status, costs, and performance.',
            allowedUser: 1,
            applicationStatus: 1,
            comming_soon: false,
            isApprovalRequired: 0
          });

          const available: IBusinessTools[] = [];
          const upcoming: IBusinessTools[] = [];
          tools.forEach((el) => {
            if (el.isComingSoon === 0) {
              available.push(el);
            } else {
              upcoming.push(el);
            }
          });
          this.availableTools.set(available);
          this.upcomingTools.set(upcoming);
          this.isDataLoaded.set(true);
        })
    );
  }

  onCardKeydown(event: KeyboardEvent, card: IBusinessTools): void {
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.key === ' ') event.preventDefault();
      this.checkBusinessToolsStatus(card);
    }
  }

  checkBusinessToolsStatus(card: IBusinessTools): void {
    if (card.routing_link === 'manage/working-capital/intro') {
      this.router.navigate(['/v4/manage/working-capital/intro']);
    } else if (card.product_name === 'Positive Pay') {
      this.router.navigate(['/v4/manage/positivepay/index']);
    } else if (card.product_name === 'Group SMS') {
      this.router.navigate(['/v4/manage/business-tools/sms-panel']);
    } else if (card.product_name === 'Mailing Dashboard') {
      this.headerService.isSubHeaderVisible.next({
        hidden: true,
        animation: false
      });
      this.router.navigate(['/v4/manage/business-tools/mail-dashboard/index']);
    } else if (
      card.product_name === 'Document Vault' ||
      card.product_name === 'Document Storage'
    ) {
      this.router.navigate(['/v4/manage/v4-business-tools/document-storage']);
    } else if (card.product_name === 'Bank Data') {
      this.router.navigate(['/v4/manage/coming-soon']);
      // this.router.navigate(['/v4/manage/v4-business-tools/bank-data']);
    } else if (card.product_name === 'Zil Sign') {
      this.router.navigate(['/v4/manage/v4-business-tools/zil-sign']);
    } else if (
      card.product_name === 'E-mail Writer' ||
      card.product_name === 'Email Writer'
    ) {
      this.router.navigate(['/v4/manage/v4-business-tools/article-writer']);
    } else if (
      card.product_name === 'Shipping Label' &&
      !(card.applicationStatus === 0 && card.isApprovalRequired === 1)
    ) {
      this.router.navigate(['/v4/manage/business-tools/shipping-label']);
    } else if (card.applicationStatus === 0 && card.isApprovalRequired === 1) {
      if (!this.isInfoAlertOpened) {
        this.openInfoAlert();
      }
    } else if (
      (card.isApprovalRequired === 0 &&
        (card.applicationStatus === 1 || card.applicationStatus === 2)) ||
      (card.isApprovalRequired === 1 && card.applicationStatus === 2) ||
      (card.applicationStatus === 0 && card.isApprovalRequired === 0)
    ) {
      this.router.navigate([this.toV4Link(card.routing_link)]);
    }
  }

  private toV4Link(routingLink: string): string {
    if (!routingLink) return routingLink;
    if (routingLink.startsWith('/v4/') || routingLink.startsWith('v4/')) {
      return routingLink.startsWith('/') ? routingLink : `/${  routingLink}`;
    }
    if (routingLink.startsWith('/manage/')) {
      return routingLink.replace('/manage/', '/v4/manage/');
    }
    if (routingLink.startsWith('manage/')) {
      return `/v4/${  routingLink}`;
    }
    return routingLink;
  }

  openInfoAlert(): void {
    this.isInfoAlertOpened = true;
    const data = {
      content:
        'You are not eligible for this feature. Please contact support for more information.',
      doneMsg: 'Contact Now',
      cancelMsg: 'Not Now',
      isOk: true,
      isCancel: true
    };
    const action = this.alert.infoAlert(data);
    action
      .afterClosed()
      .subscribe((res: boolean | { inputValue: string } | undefined) => {
        this.isInfoAlertOpened = false;
        if (res) {
          this.dynamicWhiteLabelService.goToLiveChat();
        }
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
