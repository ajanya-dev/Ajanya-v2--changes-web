import { finalize } from 'rxjs/operators';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { Location, NgClass, NgIf } from '@angular/common';
import { AffiliatePapDashboardComponent } from '../../components/affiliate-pap-dashboard/affiliate-pap-dashboard.component';
import { AffiliatePapSetCouponComponent } from '../../components/affiliate-pap-set-coupon/affiliate-pap-set-coupon.component';
import { AffiliatePapWelcomeComponent } from '../../components/affiliate-pap-welcome/affiliate-pap-welcome.component';

/**
 * Angular component representing the Affiliate Program Dashboard.
 * @class
 */
@Component({
  selector: 'app-affiliate-pap',
  templateUrl: './affiliate-pap.component.html',
  styleUrls: ['./affiliate-pap.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    AffiliatePapWelcomeComponent,
    AffiliatePapSetCouponComponent,
    AffiliatePapDashboardComponent
  ]
})
export class AffiliatePapComponent implements OnInit, OnDestroy {
  /**
   * Injected instance of the AffiliateProgramsService.
   * @type {AffiliateProgramsService}
   * @private
   */
  private _affiliateService = inject(AffiliateProgramsService);

  /**
   * Injected instance of the Location service.
   * @type {Location}
   * @private
   */
  private _location = inject(Location);

  /**
   * Injected instance of the Location service.
   * @type {Location}
   * @private
   */
  subscriptions: Subscription[] = [];

  /**
   * The current page to show in the affiliate program interface.
   * @type {'welcome' | 'set-coupon' | 'dashboard'}
   */
  pageToShow: 'welcome' | 'set-coupon' | 'dashboard' = 'welcome';

  /**
   * Flag indicating whether the component is in a loading state.
   * @type {boolean}
   */
  loading = false;

  /**
   * The user mode, either 'new-user' or 'existing-user'.
   * @type {'new-user' | 'existing-user'}
   */
  userMode: 'new-user' | 'existing-user' = 'new-user';

  /**
   * The tab to be shown in the dashboard view.
   * @type {'coupon'}
   */
  dashboardTabToBeShown: 'coupon';

  /**
   * Angular lifecycle hook called when the component is initialized.
   * Checks if the user is an affiliate.
   * @method
   */
  ngOnInit(): void {
    this.isUserAffiliate();
  }

  /**
   * Checks if the user is an affiliate.
   * @method
   */
  isUserAffiliate() {
    this.loading = true;
    this.subscriptions.push(
      this._affiliateService
        .getIsUserAffiliate()
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((res) => {
          if (res.success) {
            this.pageToShow = 'dashboard';
            this.userMode = 'existing-user';
          }
        })
    );
  }

  /**
   * Handles the "Next" button click event.
   * @method
   * @param {{ registered: boolean }} data - Data indicating whether the user is registered.
   */
  onNext(data: { registered: boolean }) {
    if (data?.registered) {
      this.userMode = 'existing-user';
    }

    if (this.pageToShow === 'welcome') {
      this.pageToShow = 'dashboard';
    }
    // else if (
    //   this.pageToShow === 'set-coupon' &&
    //   this.userMode === 'existing-user'
    // ) {
    //   this.pageToShow = 'dashboard';
    //   this.dashboardTabToBeShown = 'coupon';
    // }
    else {
      this.pageToShow = 'dashboard';
    }
  }

  /**
   * Navigates to the "Set Coupon" page.
   * @method
   */
  addCoupon() {
    this.pageToShow = 'set-coupon';
  }

  /**
   * Handles the "Back" button click event.
   * @method
   */
  onBack() {
    if (this.pageToShow === 'set-coupon' && this.userMode === 'existing-user') {
      this.dashboardTabToBeShown = 'coupon';
      this.pageToShow = 'dashboard';
    } else {
      this._location.back();
    }
  }

  /**
   * Angular lifecycle hook called when the component is destroyed.
   * Unsubscribes from all subscriptions to prevent memory leaks.
   * @method
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
