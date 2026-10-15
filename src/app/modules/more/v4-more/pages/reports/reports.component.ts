import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { LUCIDE_ICONS_V4 } from 'src/app/shared/V4/lucide-icons';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { TReportIds } from 'src/app/modules/more/model/all-reports';
import { ReportsService } from 'src/app/shared/service/all-reports/reports.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { FormNecReportModalV4Component } from 'src/app/modules/payee/payee-v4/modals/form-nec-report-modal-v4/form-nec-report-modal-v4.component';
import { PayeeReportModalV4Component } from '../../modals/reports/payee-report-modal-v4/payee-report-modal-v4.component';
import { CommonReportModalV4Component } from '../../modals/reports/common-report-modal-v4/common-report-modal-v4.component';
import { PaymentReportModalV4Component } from '../../modals/reports/payment-report-modal-v4/payment-report-modal-v4.component';
import {
  IV4Report,
  v4CustomReportList,
  v4ReportList
} from './reports-list.data';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, CommonButtonV4Component],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit, OnDestroy {
  readonly icons = LUCIDE_ICONS_V4;

  private router = inject(Router);
  private dialog = inject(MatDialog);
  private reportsService = inject(ReportsService);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);

  private subscriptions: Subscription[] = [];

  searchQuery = signal('');
  isLoading = signal(true);
  isViewPayeeDisabled = signal(false);
  reportItems = signal<IV4Report[]>([...v4ReportList]);

  filteredReports = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const items = this.reportItems();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.checkPermission();
    this.loadHeaderDataAndProcess();
  }

  goBack(): void {
    this.router.navigateByUrl('/v4/manage/more/index');
  }

  getReport(id: TReportIds): void {
    switch (id) {
      case 'payee-report':
        this.openPayeeReportModal();
        break;
      case 'nec':
        this.openNECFormModal();
        break;
      case 'void-report':
        this.navigateCheckHistoryPage('void');
        break;
      case 'delete-report':
        this.navigateCheckHistoryPage('delete');
        break;
      case 'payment':
        this.openPaymentReportModal();
        break;
      case 'central-report':
        this.navigateToCentralReport();
        break;
      case 'check-register-report':
      case 'job-processing-summary':
      case 'user-summary-report':
        this.openCommonReportModal(id);
        break;
      default:
        break;
    }
  }

  private checkPermission(): void {
    this.subscriptions.push(
      this.reportsService
        .getReportPermission()
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          if (res?.payee_view_permission === 0) {
            this.isViewPayeeDisabled.set(true);
          }
        })
    );
  }

  private loadHeaderDataAndProcess(): void {
    // eslint-disable-next-line no-underscore-dangle
    const headerSub = this.headerService._headerData.subscribe((headerData) => {
      if (headerData && headerData.personalInfo?.isLegalEnabled === '1') {
        this.addCustomReports();
        headerSub.unsubscribe();
      }
    });
    this.subscriptions.push(headerSub);
  }

  private addCustomReports(): void {
    const current = this.reportItems();
    const newReports = v4CustomReportList.filter(
      (r) => !current.some((existing) => existing.id === r.id)
    );
    if (newReports.length) {
      this.reportItems.set([...current, ...newReports]);
    }
  }

  private openPayeeReportModal(): void {
    if (this.isViewPayeeDisabled()) {
      this.alertService.warningAlert({
        content: `You don't have permission to view payee. Please contact the company owner.`
      });
      return;
    }
    this.dialog.open(PayeeReportModalV4Component, {
      width: '480px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  private openNECFormModal(): void {
    if (this.isViewPayeeDisabled()) {
      this.alertService.warningAlert({
        content: `You don't have permission to view payee. Please contact the company owner.`
      });
      return;
    }
    this.dialog.open(FormNecReportModalV4Component, {
      width: '480px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: null
    });
  }

  private openPaymentReportModal(): void {
    this.dialog.open(PaymentReportModalV4Component, {
      width: '480px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  private openCommonReportModal(reportId: TReportIds): void {
    this.dialog.open(CommonReportModalV4Component, {
      width: '480px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { reportId }
    });
  }

  private navigateCheckHistoryPage(type: 'void' | 'delete'): void {
    this.router.navigateByUrl(`/v4/manage/more/report/${type}`);
  }

  private navigateToCentralReport(): void {
    this.router.navigateByUrl('/v4/manage/central_accounting/index');
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
