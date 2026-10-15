import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { Subscription } from 'rxjs';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  ICurrentSubscriptionPlan,
  ILatestInvoice,
  IPaymentType,
  ISubscriptionData
} from 'src/app/modules/subscription/model/subscription';
import { finalize } from 'rxjs/operators';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { NgClass, NgFor } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatIconButton } from '@angular/material/button';
import { InvoiceTableSubscriptionComponent } from '../invoice-table-subscription/invoice-table-subscription.component';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { SubscriptionRenewModalComponent } from '../../modals/subscription-renew-modal/subscription-renew-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  V4SubscriptionAddonsFlowModalComponent,
  IAddonFlowModalData
} from 'src/app/modules/user-v4/modals/v4-subscription-addons-flow-modal/v4-subscription-addons-flow-modal.component';
import {
  V4ChangePaymentMethodModalComponent,
  IChangePaymentModalData
} from 'src/app/modules/user-v4/modals/v4-change-payment-method-modal/v4-change-payment-method-modal.component';
import { V4SubscriptionRenewModalComponent } from 'src/app/modules/user-v4/modals/v4-subscription-renew-modal/v4-subscription-renew-modal.component';

/**
 * @description Component for subscription details.
 */
@Component({
  selector: 'app-subscription-dash-board',
  templateUrl: './subscription-dash-board.component.html',
  styleUrls: ['./subscription-dash-board.component.scss'],
  standalone: true,
  imports: [
    MatIconButton,
    MatMenuTrigger,
    MatIcon,
    MatMenu,
    MatMenuItem,
    FaIconComponent,
    NgClass,
    CommonButtonV35Component,
    NgFor,
    InvoiceTableSubscriptionComponent
  ]
})
export class SubscriptionDashBoardComponent implements OnInit, OnDestroy {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private dialog = inject(MatDialog);
  private activatedRoute = inject(ActivatedRoute);
  headerService = inject(HeaderService);
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private v3DataTableService = inject(V3DataTableService);
  private alertService = inject(AlertService);

  readonly isV4LayoutEnabled = this.localStorageService.getItem('isV4LayoutEnabled') === 1;

  subscriptions: Subscription[] = [];
  currentPlan: ISubscriptionData;
  email: string;

  public staticWhiteLabelConditions = StaticWhiteLabelConditions;

  defaultPayment: IPaymentType = {
    paywith_check: 'check',
    paywith_wallet: 'wallet',
    authorize_net: 'Card',
    payflow_pro: 'Paypal'
  };

  isLoading = false;
  isDisable = false;
  statusCssClass: string;
  expiryMonth: string;
  isCheckRenewalStatus = signal(false);

  ngOnInit(): void {
    this.getCurrentPlan();
    this.email = this.localStorageService.getItem('email')
      ? this.localStorageService.getItem('email')
      : '';

    this.getRouteParams();
    this.listenForRenewClicks();
  }

  getRouteParams() {
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe(params => {
        if (params?.type) {
          this.handleTypeSpecificAction(params);
        }
      })
    );
  }

  /**
   * @description Re-runs the renewal check when the header re-emits a renew click on the same route.
   */
  listenForRenewClicks() {
    this.subscriptions.push(
      this.headerService.renewClicked$.subscribe(() => {
        this.checkRenewalStatus();
      })
    );
  }

  /**
   * @description Method to get the currently used plan.
   */
  getCurrentPlan(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.subscriptionService
        .getCurrentlyUsedPlans()
        .pipe(
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
            this.removeLoadedSkelton();
            if (this.currentPlan?.subscription?.cardExpireMonth) {
              if (
                this.currentPlan?.subscription?.cardExpireMonth.length === 1
              ) {
                this.expiryMonth = `0${this.currentPlan?.subscription?.cardExpireMonth}`;
              } else {
                this.expiryMonth =
                  this.currentPlan?.subscription?.cardExpireMonth;
              }
            }
          }
        })
    );
  }

  /**
   * @description Method to get the subscription status
   * @returns subscription status as string
   */
  getSubscriptionStatus() {
    if (this.currentPlan?.subscription?.status === 0) {
      this.statusCssClass = 'expired-status';
      return 'Expired';
    }
    if (this.currentPlan?.subscription?.status === 1) {
      this.statusCssClass = 'live-status';
      return 'Live';
    }
    if (this.currentPlan?.subscription?.status === 2) {
      this.statusCssClass = 'inactive-status';
      return 'Inactive';
    }
    if (this.currentPlan?.subscription?.status === 3) {
      this.statusCssClass = 'pause-status';
      return 'Paused';
    }
    return '';
  }

  /**
   * @description Method to redirect to plan change page.
   */
  onChanagePlan(): void {
    this.router.navigate(['manage/subscription/plan/change'], {
      state: { returnUrl: this.router.url }
    });
  }

  /**
   * @description Method to redirect to payment method change page.
   */
  onChangePaymentMethod(): void {
    if (this.isV4LayoutEnabled) {
      this.openV4ChangePaymentModal('change-payment');
      return;
    }
    this.router.navigate(['/manage/subscription/plan/change-payment']);
  }

  /**
   * @description Method to redirect to card update/add page.
   */
  onUpdateCard(): void {
    if (this.isV4LayoutEnabled) {
      this.openV4ChangePaymentModal('update-card');
      return;
    }
    this.router.navigate(['/manage/subscription/plan/change-payment/card']);
  }

  private openV4ChangePaymentModal(mode: 'change-payment' | 'update-card'): void {
    const dialogRef = this.dialog.open(V4ChangePaymentMethodModalComponent, {
      width: '960px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { mode } as IChangePaymentModalData
    });

    this.subscriptions.push(
      dialogRef.afterClosed().subscribe((shouldRefresh) => {
        if (shouldRefresh) this.getCurrentPlan();
      })
    );
  }

  /**
   * @description Method to remove the loading skeleton animation.
   */
  removeLoadedSkelton() {
    const mainCommonModule: NodeListOf<HTMLElement> | null =
      document.querySelectorAll('.skelton');
    if (mainCommonModule) {
      mainCommonModule.forEach((item) => item.classList.remove('skelton'));
    }
  }

  /**
   * @description Method to redirect to plan addon change page
   */
  onSelectedPlan() {
    if (this.isV4LayoutEnabled) {
      const dialogRef = this.dialog.open(V4SubscriptionAddonsFlowModalComponent, {
        width: '960px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          initialPlanCode: this.currentPlan.subscription.plan,
          initialIntervalType: this.currentPlan.subscription.intervalUnit as 'months' | 'years',
          currentPlan: this.currentPlan as unknown as ICurrentSubscriptionPlan
        } as IAddonFlowModalData
      });
      this.subscriptions.push(
        dialogRef.afterClosed().subscribe((shouldRefresh) => {
          if (shouldRefresh) this.getCurrentPlan();
        })
      );
      return;
    }
    this.router.navigate(['manage/subscription/plan/change-addon'], {
      state: { returnUrl: this.router.url }
    });
  }

  /**
   * @description Method to send support email
   */
  onSupportMail(): void {
    window.location.href = `mailto:${this.email}`;
  }

  /**
   * @description Method to open live chat
   */
  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  /**
   * @description Method to handle type-specific actions
   */
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

  /**
   * @description Method to check the renewal status
   */
  checkRenewalStatus(): void {
    this.isCheckRenewalStatus.set(true);
    this.subscriptionService.checkRenewalStatus()
    .pipe(finalize(() => this.isCheckRenewalStatus.set(false)))
    .subscribe((res) => {
      if (res?.success && res?.data?.renewalRequired) {
        this.openRenewalModal(res?.data?.latestInvoice);
      }
    });
  }

  /**
   * @description Method to open the renewal modal
   */
  openRenewalModal(latestInvoice: ILatestInvoice): void {
    if (this.isV4LayoutEnabled) {
      this.dialog.open(V4SubscriptionRenewModalComponent, {
        width: '500px',
        maxWidth: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: latestInvoice
      });
      return;
    }
    this.dialog.open(SubscriptionRenewModalComponent, {
      width: '500px',
      maxWidth: '93%',
      disableClose: true,
      data: latestInvoice
    });
  }

  /**
   * @description Method to sync the overdue status
   */
  syncOverdueStatus(hostedpage_id: string): void {
    this.subscriptions.push(
      this.subscriptionService.checkOverdueStatus(hostedpage_id)
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({content: 'Payment completed successfully', close: true});
          this.getCurrentPlan();
          this.v3DataTableService.refreshV3DataTable();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.localStorageService.removeItem('autoClickPlan');
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
