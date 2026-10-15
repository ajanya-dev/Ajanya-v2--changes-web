import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule,
  Layers,
  SquarePen,
  Download,
  FolderOpen,
  Code,
  Plus,
  Mail,
  ArrowLeft,
  Check
} from 'lucide-angular';
import { GroupPaymentExcelMappedData } from 'src/app/modules/group-payments/models/group-payments.models';
import { take } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { IBillBulkPaymentData } from 'src/app/modules/bill/model/Bill';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { VerificationRequiredModalComponent } from 'src/app/shared/modal/verification-required-modal/verification-required-modal.component';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import {
  CommonTabV4Component,
  ITabItem
} from '../../../../shared/V4/common-tab-v4/common-tab-v4.component';
import { V4GroupPaymentsTableComponent } from '../../components/v4-group-payments-table/v4-group-payments-table.component';
import { V4GroupPaymentComponent } from '../../components/v4-group-payment/v4-group-payment.component';
import { BulkImportFromExcelModalComponent } from '../../modals/bulk-import-from-excel-modal/bulk-import-from-excel-modal.component';

@Component({
  selector: 'app-v4-bulk-payment-center',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    CommonTabV4Component,
    V4GroupPaymentsTableComponent,
    V4GroupPaymentComponent,
    CommonButtonV4Component,
    NgTemplateOutlet
  ],
  templateUrl: './v4-bulk-payment-center.component.html',
  styleUrl: './v4-bulk-payment-center.component.scss'
})
export class V4BulkPaymentCenterComponent implements OnInit {
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private billService = inject(BillService);
  private localStorageService = inject(LocalStorageService);
  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  // Lucide Icons
  readonly LayersIcon = Layers;
  readonly SquarePenIcon = SquarePen;
  readonly downloadIcon = Download;
  readonly FolderOpenIcon = FolderOpen;
  readonly CodeIcon = Code;
  readonly PlusIcon = Plus;
  readonly MailIcon = Mail;
  readonly arrowLeftIcon = ArrowLeft;
  readonly CheckIcon = Check;

  // State
  activeTab = 'create';
  selectedMethod: string | null = null;
  selectedGroupId = signal<string | null>(null);
  importedExcelData: GroupPaymentExcelMappedData[] | null = null;
  private isExcelImportModalOpen = false;
  // Bill data fetched when navigated here from the Bill list with multiple
  // payees. Passed to <app-v4-group-payment> to prefill one row per payee.
  billBulkData = signal<IBillBulkPaymentData | null>(null);

  tabs: ITabItem[] = [
    { label: 'CREATE', value: 'create', lucideIcon: 'plus' },
    { label: 'MY GROUPS', value: 'my-groups', lucideIcon: 'folder-open' },
    { label: 'SCHEDULED', value: 'scheduled', lucideIcon: 'calendar' }
  ];

  methods = [
    {
      value: 'manual-entry',
      icon: this.SquarePenIcon,
      title: 'Manual Entry',
      subtitle: 'Enter payments one by one or in batches',
      badgeBg: 'bg-v4-badge-info-bg-color',
      badgeHoverBg: 'group-hover:bg-v4-primary-brand-color',
      iconColor: 'text-v4-primary-brand-color',
      iconHoverColor: 'group-hover:text-white',
      ctaText: 'Start Entry',
      ctaIcon: this.PlusIcon,
      ctaColor: 'v4-primary-brand-bold-color'
    },
    {
      value: 'import-excel',
      icon: this.downloadIcon,
      title: 'Import Excel/CSV',
      subtitle: 'Upload file with 200+ payments',
      badgeBg: 'bg-v4-badge-success-bg-color',
      badgeHoverBg: 'group-hover:bg-v4-common-green-color',
      iconColor: 'text-v4-common-green-color',
      iconHoverColor: 'group-hover:text-white',
      ctaText: 'Upload File',
      ctaIcon: this.downloadIcon,
      ctaColor: 'v4-primary-brand-bold-color'
    },
    {
      value: 'load-group',
      icon: this.FolderOpenIcon,
      title: 'Load Group',
      subtitle: 'Use saved template',
      badgeBg: 'bg-v4-badge-accent-bg-color',
      badgeHoverBg: 'group-hover:bg-v4-accent-violet-color',
      iconColor: 'text-v4-accent-violet-color',
      iconHoverColor: 'group-hover:text-white',
      ctaText: 'Browse',
      ctaIcon: this.FolderOpenIcon,
      ctaColor: 'v4-primary-brand-bold-color'
    },
    {
      value: 'api-integration',
      icon: this.CodeIcon,
      title: 'API Integration',
      subtitle: 'Integrate with your system',
      badgeBg: 'bg-v4-badge-warning-bg-color',
      badgeHoverBg: 'group-hover:bg-v4-common-yellow-color',
      iconColor: 'text-v4-common-yellow-color',
      iconHoverColor: 'group-hover:text-white',
      ctaText: 'Contact Sales',
      ctaIcon: this.MailIcon,
      ctaColor: 'v4-primary-brand-bold-color'
    }
  ];

  apiIntegrationFeatures = [
    'RESTful API with full documentation',
    'Webhook support for real-time updates',
    'Batch payment processing (1000+ payments)',
    'OAuth 2.0 authentication',
    'Sandbox environment for testing',
    'Dedicated technical support'
  ] as const;

  ngOnInit(): void {
    // Subscribe to queryParams (not snapshot) so deep-links also work when the
    // user is already on this page — e.g. opening Send Payment > Import Check
    // while standing on the Bulk Payment Center navigates to the same route with
    // only the query string changed, which does not re-create the component.
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params?.tab) {
          this.activeTab = params.tab;
        }
        // When navigated from the Bill list with multiple payees, load the
        // grouped bill data and open manual entry directly (skips the
        // method-selection grid).
        if (params?.billId) {
          this.loadBillBulkData(params.billId);
          return;
        }
        if (params?.method) {
          this.selectMethod(params.method);
        }
      });
  }

  private loadBillBulkData(billId: string): void {
    if (!this.checkPhoneAndEmailVerification()) return;
    const billIds = billId.split(',');
    this.billService.billId.set(billIds);
    // Go straight into manual entry (skip the method-selection grid). The
    // prefill happens once the grouped bill data resolves.
    this.activeTab = 'create';
    this.selectedMethod = 'manual-entry';
    this.billService
      .getBillBulkPaymentData(billIds)
      .pipe(take(1))
      .subscribe((res) => {
        if (res?.data) {
          this.billBulkData.set(res.data);
        }
      });
  }

  selectMethod(value: string): void {
    if (!this.checkPhoneAndEmailVerification()) return;
    if (value === 'import-excel') {
      this.importFromExcel();
      return;
    }
    this.selectedMethod = value;
  }

  onTabChange(tab: string): void {
    if (!this.checkPhoneAndEmailVerification()) {
      this.activeTab = 'create';
      return;
    }
    this.activeTab = tab;
    this.selectedMethod = null;
    this.importedExcelData = null;
  }

  onChangeInputMethod(): void {
    this.selectedMethod = null;
    this.importedExcelData = null;
    this.selectedGroupId.set(null);
  }

  importFromExcel(): void {
    // Guard against re-opening when queryParams re-emits while the modal is open.
    if (this.isExcelImportModalOpen) return;
    this.isExcelImportModalOpen = true;

    // Strip the deep-link params as soon as the modal opens so a page refresh
    // (or back navigation) while it is open does not re-trigger it via ngOnInit's
    // queryParams subscription.
    this.clearImportExcelQueryParams();

    const ref = this.dialog.open<
      BulkImportFromExcelModalComponent,
      unknown,
      false | { success: true; data: GroupPaymentExcelMappedData[] }
    >(BulkImportFromExcelModalComponent, {
      minWidth: '500px',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });

    ref
      .afterClosed()
      .pipe(take(1))
      .subscribe((res) => {
        this.isExcelImportModalOpen = false;
        this.clearImportExcelQueryParams();
        if (!res) return;

        this.importedExcelData = res.data;
        this.selectedMethod = 'import-excel';
      });
  }

  /**
   * Strip the deep-link params (?tab=create&method=import-excel) that opened this modal so a reload/back doesn't re-trigger it.
   */
  private clearImportExcelQueryParams(): void {
    const params = this.route.snapshot.queryParams;
    if (!params?.tab && !params?.method) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: null, method: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  onSelectedGroupId(id: string | null): void {
    this.selectedGroupId.set(id);
    this.activeTab = 'create';
    this.selectedMethod = 'manual-entry';
  }

  onContactSalesTeam(): void {
    window.open(
      `mailto:${this.staticWhiteLabelConditions.customerSupportEmail}`,
      '_self'
    );
  }

  onVisitDeveloperPanel(): void {
    this.router.navigate(['/v4/manage/developer/index']);
  }

  checkPhoneAndEmailVerification(): boolean {
    const phoneVerified = this.localStorageService.getItem('phoneVerified');
    const emailVerified = this.localStorageService.getItem('emailVerified');

    if (phoneVerified === 0 || emailVerified === 0) {
      this.dialog.open(VerificationRequiredModalComponent, {
        width: '400px',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          description:
            'You need to verify your email and phone number to create payment groups.'
        }
      });
      return false;
    }
    return true;
  }

  onCreateGroup(): void {
    this.selectedMethod = 'manual-entry';
    this.activeTab = 'create';
  }
}
