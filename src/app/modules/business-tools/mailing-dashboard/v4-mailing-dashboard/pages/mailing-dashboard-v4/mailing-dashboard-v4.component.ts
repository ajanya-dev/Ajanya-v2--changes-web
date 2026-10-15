import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LucideAngularModule } from 'lucide-angular';
import { finalize } from 'rxjs/operators';
import { ICheckShipingTypes } from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { LoomService } from 'src/app/modules/loom-video/loom/service/loom.service';
import { V4ExcelImportComponent } from 'src/app/shared/modal/v4-thirdparty-imports/v4-excel-import/v4-excel-import/v4-excel-import.component';

interface IDashboardCard {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  iconBgLight: string;
  comingSoon?: boolean;
  id:
    | 'feedback'
    | 'report'
    | 'group-history'
    | 'single-mail'
    | 'group-mail'
    | 'call'
    | 'import'
    | 'document-mailing'
    | 'documentation'
    | 'partner'
    | 'reseller'
    | 'single-mail-history'
    | 'bulk-import'
    | 'document-mailing-history';
}

interface IKeyFeature {
  icon: string;
  text: string;
}

@Component({
  selector: 'app-mailing-dashboard-v4',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './mailing-dashboard-v4.component.html',
  styleUrl: './mailing-dashboard-v4.component.scss'
})
export class MailingDashboardV4Component implements OnInit {
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private checkService = inject(CheckService);
  private headerService = inject(HeaderService);
  private loomService = inject(LoomService);
  private destroyRef = inject(DestroyRef);

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  shippingTypeList = signal<ICheckShipingTypes[]>([]);
  isLoading = signal(false);

  keyFeatures: IKeyFeature[] = [
    { icon: 'package', text: 'Bundle checks, cut postage costs instantly' },
    { icon: 'file-text', text: 'Send Checks with Attachments' },
    { icon: 'truck', text: 'Tracking Available' },
    { icon: 'code', text: 'Developer API' }
  ];

  dashboardCards: IDashboardCard[] = [
    {
      title: 'Single Mail',
      description: 'Send a single check via mail to a payee',
      id: 'single-mail',
      icon: 'mail',
      iconColor: 'var(--v4-primary-brand-bold-color)',
      iconBgLight: 'rgba(32, 49, 157, 0.12)',
    },
    {
      title: 'Group Mail',
      description: 'Send multiple checks in a single batch',
      id: 'group-mail',
      icon: 'users',
      iconColor: 'var(--v4-accent-violet-color)',
      iconBgLight: 'rgba(121, 36, 255, 0.12)',
    },
    {
      title: 'Multi Check Import',
      description: 'Import multiple checks from file',
      id: 'bulk-import',
      icon: 'download',
      iconColor: 'var(--v4-common-sky-color)',
      iconBgLight: 'rgba(5, 149, 229, 0.12)',
    },
    {
      title: 'Single Mail History',
      description: 'View history of single mail items',
      id: 'single-mail-history',
      icon: 'clock',
      iconColor: 'var(--v4-common-yellow-color)',
      iconBgLight: 'rgba(245, 158, 11, 0.12)',
    },
    {
      title: 'Group History',
      description: 'View history of group mailings',
      id: 'group-history',
      icon: 'history',
      iconColor: 'var(--v4-secondary-brand-color)',
      iconBgLight: 'rgba(59, 244, 147, 0.12)',
    },
    {
      title: 'Import Excel/CSV',
      description: 'Import data from spreadsheets',
      id: 'import',
      icon: 'file-text',
      iconColor: 'var(--v4-primary-brand-bold-color)',
      iconBgLight: 'rgba(32, 49, 157, 0.12)',
    },
    {
      title: 'Document Mailing',
      description: 'Upload and mail documents to payees',
      id: 'document-mailing',
      icon: 'file-text',
      iconColor: 'var(--v4-common-sky-color)',
      iconBgLight: 'rgba(5, 149, 229, 0.12)',
    },
    {
      title: 'Document Mailing History',
      description: 'View history of document mailings',
      id: 'document-mailing-history',
      icon: 'history',
      iconColor: 'var(--v4-accent-violet-color)',
      iconBgLight: 'rgba(121, 36, 255, 0.12)',
    },
    {
      title: 'Reporting',
      description: 'Generate reports for your mailings',
      id: 'report',
      icon: 'bar-chart-3',
      iconColor: 'var(--v4-primary-brand-bold-color)',
      iconBgLight: 'rgba(32, 49, 157, 0.12)',
    },
    {
      title: 'Developer Documentation',
      description: 'API docs for developers',
      id: 'documentation',
      icon: 'code',
      iconColor: 'var(--v4-common-yellow-color)',
      iconBgLight: 'rgba(245, 158, 11, 0.12)',
    },
    {
      title: 'Become Partner',
      description: 'Join our partner program',
      id: 'partner',
      icon: 'handshake',
      iconColor: 'var(--v4-secondary-brand-color)',
      iconBgLight: 'rgba(59, 244, 147, 0.12)',
    },
    {
      title: 'Become Reseller',
      description: 'Start reselling our services',
      id: 'reseller',
      icon: 'building',
      iconColor: 'var(--v4-primary-brand-bold-color)',
      iconBgLight: 'rgba(32, 49, 157, 0.12)',
    },
    {
      title: 'Feedback/ Suggestion',
      description: 'Share your feedback with us',
      id: 'feedback',
      icon: 'message-square',
      iconColor: 'var(--v4-common-sky-color)',
      iconBgLight: 'rgba(5, 149, 229, 0.12)',
    },
    {
      title: 'Talk To Live Agent Now',
      description: 'Get instant support from our team',
      id: 'call',
      icon: 'headphones',
      iconColor: 'var(--v4-primary-brand-bold-color)',
      iconBgLight: 'rgba(32, 49, 157, 0.12)',
    }
  ];

  ngOnInit(): void {
    this.headerService.isSubHeaderVisible.next({ hidden: true, animation: false });
    this.getShippingType();
  }

  getShippingType(): void {
    this.isLoading.set(true);
    this.checkService
      .getShippingType()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success && res.data.length) {
          this.shippingTypeList.set(res.data);
        }
      });
  }

  getShippingIcon(name: string): string {
    if (!name) return 'mail';
    const lower = name.toLowerCase();
    if (lower.includes('international')) return 'globe';
    if (lower.includes('canada')) return 'globe';
    return 'mail';
  }

  getShippingName(name: string, amount: string): string {
    if (!name) return '';
    const cleanedName = name.replace(amount, '').trim();
    const amountPattern = /\$[\d,]+\.?\d*/g;
    let result = cleanedName.replace(amountPattern, '').trim();
    result = result.replace(/[-–—]\s*$/, '').trim();
    result = result.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    result = result.replace(/\busps\b/gi, 'USPS');
    result = result.replace(/\bfedex\b/gi, 'FedEx');
    result = result.replace(/\bups\b/gi, 'UPS');
    return result;
  }

  goBack(): void {
    this.router.navigate(['/v4/manage/v4-business-tools/more']);
  }

  onCardClick(card: IDashboardCard): void {
    if (card.comingSoon) return;
    this.navigateById(card.id);
  }

  private navigateById(btnId: IDashboardCard['id']): void {
    switch (btnId) {
      case 'feedback':
        this.onFeatureRequest();
        break;
      case 'report':
        this.router.navigate(['/v4/manage/business-tools/mail-dashboard/report']);
        break;
      case 'group-history':
        this.router.navigate(['/v4/manage/business-tools/mail-dashboard/group-mailing'], { queryParams: { from: 'mail-dashboard' } });
        break;
      case 'single-mail':
        this.router.navigate(['/v4/manage/business-tools/mail-dashboard/single-mail']);
        break;
      case 'group-mail':
        this.router.navigate(['/v4/manage/business-tools/mail-dashboard/bulk-mail']);
        break;
      case 'call':
        this.goToLiveChat();
        break;
      case 'import':
        this.openExcelImportModal();
        break;
      case 'document-mailing':
        this.router.navigate(['/v4/manage/business-tools/document-mail/index'], {
          queryParams: { from: 'mail-dashboard' }
        });
        break;
      case 'documentation':
        window.open('https://apiv3.onlinecheckwriter.com/', '_blank');
        break;
      case 'partner':
        window.open('https://onlinecheckwriter.com/contact/', '_blank');
        break;
      case 'reseller':
        window.open('https://onlinecheckwriter.com/contact/', '_blank');
        break;
      case 'bulk-import':
        this.router.navigate(['/v4/manage/business-tools/mail-dashboard/multi-check-mail-table']);
        break;
      case 'single-mail-history':
        this.router.navigate(['/v4/manage/business-tools/mail-dashboard/single-mail-history']);
        break;
      case 'document-mailing-history':
        this.router.navigate(['/v4/manage/business-tools/mail-dashboard/document-mail-history']);
        break;
    }
  }

  private openExcelImportModal(): void {
    this.dialog.open(V4ExcelImportComponent, {
      maxWidth: '500px',
      disableClose: true,
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: {}
    });
  }

  private async onFeatureRequest(): Promise<void> {
    this.loomService.loomVideos = [];
    const { FeatureRequestModalV4Component } = await import(
      'src/app/shared/modal/feature-request-modal-v4/feature-request-modal-v4.component'
    );
    this.dialog.open(FeatureRequestModalV4Component, {
      maxWidth: '510px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: {}
    });
  }

  private goToLiveChat(): void {
    if (this.staticWhiteLabelConditions.zohoSupportChat) {
      const chatBox = document.getElementById('zsiq_float');
      if (chatBox) chatBox.click();
      return;
    }
    window.open(this.staticWhiteLabelConditions?.helpWebsite, '_blank');
  }
}
