import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { HttpHeaders } from '@angular/common/http';
import { finalize, map } from 'rxjs/operators';
import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Params, Router } from '@angular/router';
import {
  ICurrentSubscriptionPlan,
  ILatestInvoice,
  IPaymentType,
  ISubscriptionData
} from 'src/app/modules/subscription/model/subscription';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4SubscriptionRenewModalComponent } from 'src/app/modules/user-v4/modals/v4-subscription-renew-modal/v4-subscription-renew-modal.component';
import {
  V4SubscriptionAddonsFlowModalComponent,
  IAddonFlowModalData
} from 'src/app/modules/user-v4/modals/v4-subscription-addons-flow-modal/v4-subscription-addons-flow-modal.component';
import {
  V4ChangePaymentMethodModalComponent,
  IChangePaymentModalData
} from 'src/app/modules/user-v4/modals/v4-change-payment-method-modal/v4-change-payment-method-modal.component';
import {
  LucideAngularModule,
  Plus,
  Info,
  MessageCircle,
  Mail,
  Headphones,
  Loader2
} from 'lucide-angular';
import { V4InvoiceTableComponent } from './v4-invoice-table/v4-invoice-table.component';

@Component({
  selector: 'app-v4-subscription-dash-board',
  templateUrl: './v4-subscription-dash-board.component.html',
  styleUrls: ['./v4-subscription-dash-board.component.scss'],
  standalone: true,
  imports: [
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component,
    V4InvoiceTableComponent
  ]
})
export class V4SubscriptionDashBoardComponent implements OnInit, OnDestroy {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private dialog = inject(MatDialog);
  headerService = inject(HeaderService);
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private destroyRef = inject(DestroyRef);
  private alertService = inject(AlertService);
  private v3DataTableService = inject(V3DataTableService);

  readonly PlusIcon = Plus;
  readonly InfoIcon = Info;
  readonly MessageCircleIcon = MessageCircle;
  readonly MailIcon = Mail;
  readonly HeadphonesIcon = Headphones;
  readonly LoaderIcon = Loader2;

  currentPlan!: ISubscriptionData;
  email = '';

  public staticWhiteLabelConditions = StaticWhiteLabelConditions;

  defaultPayment: IPaymentType = {
    paywith_check: 'check',
    paywith_wallet: 'wallet',
    authorize_net: 'Card',
    payflow_pro: 'Paypal'
  };

  isLoading = false;
  isDisable = false;
  statusBgColor = '';
  statusTextColor = '';
  expiryMonth = '';
  isCheckingSubscription = signal(true);
  isCheckRenewalStatus = signal(false);
  isSubscribed = signal(false);

  ngOnInit(): void {
    this.getCurrentPlan();
    this.checkSubscriptionStatus();
    this.email = this.localStorageService.getItem('email')
      ? this.localStorageService.getItem('email')
      : '';

    this.getRouteParams();
  }

  private checkSubscriptionStatus(): void {
    this.headerService
      .hearderdata()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((res) => !!(res?.data?.isSubscribed || res?.data?.isSubscribedEnd))
      )
      .subscribe((subscribed) => {
        this.isSubscribed.set(subscribed);
        if (!subscribed) {
          this.router.navigate(['/v4/manage/subscription/plan']);
        } else {
          this.isCheckingSubscription.set(false);
        }
      });
  }

  getRouteParams(): void {
    const params = this.router.parseUrl(this.router.url).queryParams;
    if (params?.type) {
      this.handleTypeSpecificAction(params);
    }
  }

  getCurrentPlan(): void {
    this.isLoading = true;
    // New users (no subscription yet) get a 422 "not found" from
    // GET /subscription. The v4 global error interceptor's generic
    // 422 fallthrough (v4-error-handling.interceptor.ts:200-204) would
    // pop a "Warning: not found" modal on top of the dashboard, even
    // though checkSubscriptionStatus() is already routing them away
    // to manage/subscription/plan in parallel.
    //
    // The interceptor honors an opt-out header (`isDisable422: true`,
    // line 191 of the same file). Pass it here so unsubscribed users
    // never see the warning. The component already handles the empty
    // currentPlan case gracefully.
    const skipWarningHeaders = new HttpHeaders({ isDisable422: 'true' });
    this.subscriptionService
      .getCurrentlyUsedPlans(skipWarningHeaders)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.headerService.isRenewloading.set(false);
          this.isLoading = false;
        })
      )
      .subscribe((res) => {
        if (res?.success) {
          this.currentPlan = res.data;
          if (this.currentPlan?.subscription?.status === 3) {
            this.isDisable = true;
          } else {
            this.isDisable = false;
          }
          if (this.currentPlan?.subscription?.cardExpireMonth) {
            if (this.currentPlan?.subscription?.cardExpireMonth.length === 1) {
              this.expiryMonth = `0${this.currentPlan?.subscription?.cardExpireMonth}`;
            } else {
              this.expiryMonth =
                this.currentPlan?.subscription?.cardExpireMonth;
            }
          }
        }
      });
  }

  getSubscriptionStatus(): string {
    if (this.currentPlan?.subscription?.status === 0) {
      this.statusBgColor = 'var(--v4-badge-error-bg-color)';
      this.statusTextColor = 'var(--v4-common-red-color)';
      return 'Expired';
    }
    if (this.currentPlan?.subscription?.status === 1) {
      this.statusBgColor = 'var(--v4-badge-success-bg-color)';
      this.statusTextColor = 'var(--v4-common-green-color)';
      return 'Live';
    }
    if (this.currentPlan?.subscription?.status === 2) {
      this.statusBgColor = 'var(--v4-badge-info-bg-color)';
      this.statusTextColor = 'var(--v4-common-blue-color)';
      return 'Inactive';
    }
    if (this.currentPlan?.subscription?.status === 3) {
      this.statusBgColor = 'var(--v4-badge-warning-bg-color)';
      this.statusTextColor = 'var(--v4-common-yellow-color)';
      return 'Paused';
    }
    return '';
  }

  onChanagePlan(): void {
    this.router.navigate(['/v4/manage/subscription/plan/change'], {
      state: { returnUrl: this.router.url }
    });
  }

  onChangePaymentMethod(): void {
    this.openChangePaymentModal('change-payment');
  }

  onUpdateCard(): void {
    this.openChangePaymentModal('update-card');
  }

  private openChangePaymentModal(mode: 'change-payment' | 'update-card'): void {
    const dialogRef = this.dialog.open(V4ChangePaymentMethodModalComponent, {
      width: '960px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { mode } as IChangePaymentModalData
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((shouldRefresh) => {
        if (shouldRefresh) {
          this.getCurrentPlan();
        }
      });
  }

  onSelectedPlan(): void {
    if (!this.isSubscribed()) {
      this.router.navigate(['/v4/manage/subscription/plan']);
      return;
    }

    const dialogRef = this.dialog.open(V4SubscriptionAddonsFlowModalComponent, {
      width: '960px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        initialPlanCode: this.currentPlan.subscription.plan,
        initialIntervalType: this.currentPlan.subscription.intervalUnit as 'months' | 'years',
        currentPlan: this.currentPlan as unknown as ICurrentSubscriptionPlan,
        preSelectAddons: false,
        isFromProfile:true,
      } as IAddonFlowModalData
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((shouldRefresh) => {
        if (shouldRefresh) {
          this.getCurrentPlan();
        }
      });
  }

  onSupportMail(): void {
    window.location.href = `mailto:${this.email}`;
  }

  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  handleTypeSpecificAction(params: Params): void {
    const type = params?.type;
    const hostedPageId = params?.hostedpage_id;
    if (type) {
      switch (type) {
        case 'renew':
          this.checkRenewalStatus();
          break;
        case 'sync':
          this.syncOverdueStatus(hostedPageId);
          break;
        default:
          break;
      }
    }
  }

  checkRenewalStatus(): void {
    this.isCheckRenewalStatus.set(true);
    this.subscriptionService
      .checkRenewalStatus()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isCheckRenewalStatus.set(false))
      )
      .subscribe((res) => {
        if (res?.success && res?.data?.hasPendingInvoice) {
          this.openRenewalModal(res?.data?.latestInvoice);
        }
      });
  }

  openRenewalModal(latestInvoice: ILatestInvoice): void {
    this.dialog.open(V4SubscriptionRenewModalComponent, {
      width: '500px',
      maxWidth: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: latestInvoice
    });
  }

  syncOverdueStatus(hostedpage_id: string): void {
    this.subscriptionService
      .checkOverdueStatus(hostedpage_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: 'Payment completed successfully',
            close: true
          });
          this.getCurrentPlan();
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  ngOnDestroy(): void {
    this.localStorageService.removeItem('autoClickPlan');
  }
}
