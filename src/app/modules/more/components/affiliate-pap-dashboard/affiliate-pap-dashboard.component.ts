
import { CurrencyPipe, Location, NgClass, NgOptimizedImage } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  EventEmitter,
  Output,
  Input
} from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { IUserEarningData } from '../../model/affiliate';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AffiliatePapDashboardTableComponent } from '../affiliate-pap-dashboard-table/affiliate-pap-dashboard-table.component';
import { AffiliatePapMyLinkComponent } from '../affiliate-pap-my-link/affiliate-pap-my-link.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { faXmarkCircle } from '@fortawesome/pro-solid-svg-icons';
import { RouterLink } from '@angular/router';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { RequestToPayoutModalComponent } from '../../modals/request-to-payout-modal/request-to-payout-modal.component';
import { MatDialog } from '@angular/material/dialog';
import {AffiliateTreeComponent } from '../affiliate-tree/affiliate-tree.component';

/**
 * Component for displaying the affiliate program dashboard.
 */
@Component({
  selector: 'app-affiliate-pap-dashboard',
  templateUrl: './affiliate-pap-dashboard.component.html',
  styleUrls: ['./affiliate-pap-dashboard.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    NgClass,
    AffiliatePapMyLinkComponent,
    AffiliatePapDashboardTableComponent,
    CommonButtonV35Component,
    RouterLink,
    NgOptimizedImage,
    AffiliatePapDashboardTableComponent,
    NgOptimizedImage,
    CommonButtonV35Component,
    CurrencyPipe,
    CommonBackButtonV35Component,
    AffiliateTreeComponent
  ]
})
export class AffiliatePapDashboardComponent implements OnInit, OnDestroy {

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  
  /**
   * Event emitter for adding a coupon.
   */
  @Output() addCouponEvent = new EventEmitter();

  /**
   * Input to specify the dashboard tab to be shown.
   */
  @Input() dashboardTabToBeShown: 'coupon';


  private headerService = inject(HeaderService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  isActivePapAffiliateUser=0;
  faXmark = faXmarkCircle
  private location = inject(Location);
  private affilialteService = inject(AffiliateProgramsService);
  private matDialog = inject(MatDialog);

  /**
   * Array to hold active subscriptions.
   */
  subscriptions: Subscription[] = [];

  /**
   * Loading indicator for data retrieval.
   */
  loading = false;

  /**
   * Selected table tab
   */
  currentTableTab : string = 'click-details';

  /**
   * User earning data.
   */
  earningData: IUserEarningData;

  /**
   * Current active tab on the dashboard.
   */
  currentTab:
    | 'link'
    | 'insight'
    | 'coupon'
    | 'pay-history'
    | 'transaction-history' = 'link';

  /**
   * Available tabs on the dashboard.
   */
  tabs: {
    id: 'link' | 'insight' | 'coupon' | 'pay-history' | 'transaction-history';
    title: string;
  }[] = [
    { id: 'link', title: 'My link' },
    { id: 'insight', title: 'Insight' },
    // { id: 'coupon', title: 'Coupon' },
    { id: 'pay-history', title: 'Pay History' },
    { id: 'transaction-history', title: 'Transaction History' }
  ];

  tableTabs: {
    id: 'earnings' | 'pay-history' | 'click-details' ;
    title: string;
  }[] = [
    { id: 'click-details', title: 'Click Details' },
    { id: 'earnings', title: 'Earnings' },
    { id: 'pay-history', title: 'Withdrawal History' },
  ];

  /**
   * Initializes the component.
   */
  ngOnInit(): void {
    this.currentTab = this.dashboardTabToBeShown ?? 'link';
    this.getUserEarnings();
    this.checkIsActivePapAffiliateUser();
  }

  /**
   * Checks if the user is active or not
   */
  checkIsActivePapAffiliateUser():void{
    this.subscriptions.push(
      this.headerService._headerData.subscribe((res) => {
        const headerData = res as unknown as IHeaderData;
        this.isActivePapAffiliateUser = headerData.isActivePapAffiliateUser;
      })
    );
  }
  
  /**
   * Retrieves the user's earning data.
   */
  getUserEarnings() {
    this.loading = true;
    this.subscriptions.push(
      this.affilialteService
        .getUserEarnings()
        .pipe(finalize(() => {this.loading = false;}))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.earningData = res.data.rows;
            }
          }
        })
    );
  }

  /**
   * Event handler for adding a coupon.
   */
  addCoupon() {
    this.addCouponEvent.emit();
  }

  /**
   * Navigates back using the Angular Location service.
   */
  onBack() {
    this.location.back();
  }

      /**
   * Opens the request to payout modal dialog.
   */
    onWithdraw() {
      this.matDialog.open(RequestToPayoutModalComponent);
    }

    /**
   * Handles table tab switch
   */
    viewTable(){
     this.currentTab = 'pay-history';
    }

     /**
   * Handles back button event
   */
    goBack(isFromDashboard:boolean){
      if(isFromDashboard){
        this.onBack();
      }
      this.currentTab = 'link';
    }

  /**
   * Initiate  contact with customer support or live chat.
   */
  contactSupport() {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  /**
   * Cleans up all subscriptions to prevent memory leaks when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
