import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { IAffiliateReferralActivity } from '../../model/affiliate';

/**
 * Angular component representing the Referral Activity page.
 * @class
 */
@Component({
  selector: 'app-referal-activity',
  templateUrl: './referal-activity.component.html',
  styleUrls: ['./referal-activity.component.scss'],
  standalone: true
})
export class ReferalActivityComponent implements OnInit, OnDestroy {
  referalDetails: IAffiliateReferralActivity;
  subscriptions: Subscription[] = [];
  id: string;

  /**
   * Constructor to create an instance of ReferalActivityComponent.
   * @constructor
   * @param {ActivatedRoute} activatedRoute - An instance of ActivatedRoute to access route parameters.
   * @param {AffiliateProgramsService} _affiliateService - The affiliate programs service.
   */
  constructor(
    private activatedRout: ActivatedRoute,
    private _affiliateService: AffiliateProgramsService
  ) {}

  /**
   * Angular lifecycle hook called when the component is initialized.
   * Retrieves the referral activity details based on the route parameter 'id'.
   * @method
   */
  ngOnInit(): void {
    this.activatedRout.queryParamMap.subscribe((res: Params) => {
      // this.getReferalActivity(res.params.id)
      this.id = res.params.id;
    });

    this.getReferalActivity(this.id);
  }

  /**
   * Retrieves referral activity details based on the provided 'id'.
   * @method
   * @param {string} id - The referral activity ID.
   */
  getReferalActivity(id: string) {
    this.subscriptions.push(
      this._affiliateService.getReferalActivity(id).subscribe((res) => {
        this.referalDetails = res.data;
      })
    );
  }

  /**
   * Angular lifecycle hook called when the component is destroyed.
   * Unsubscribes from all active subscriptions to prevent memory leaks.
   * @method
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
