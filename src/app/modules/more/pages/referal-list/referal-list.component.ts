import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { IReferalDetails } from '../../model/all-reports';
import { NgFor } from '@angular/common';

/**
 * Angular component representing the Referral List page.
 * @class
 */
@Component({
  selector: 'app-referal-list',
  templateUrl: './referal-list.component.html',
  styleUrls: ['./referal-list.component.scss'],
  standalone: true,
  imports: [NgFor]
})
export class ReferalListComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  referalDetails: IReferalDetails[];

  /**
   * Constructor to create an instance of ReferalListComponent.
   * @constructor
   * @param {AffiliateProgramsService} _affiliateService - The affiliate programs service.
   * @param {Router} router - An instance of Router for navigation.
   */
  constructor(
    private _affiliateService: AffiliateProgramsService,
    private router: Router
  ) {}

  /**
   * Angular lifecycle hook called when the component is initialized.
   * Retrieves the referral list.
   * @method
   */
  ngOnInit(): void {
    this.getReferalList();
  }

  /**
   * Retrieves the referral list.
   * @method
   */
  getReferalList() {
    this.subscriptions.push(
      this._affiliateService.getReferalList().subscribe((res) => {
        if (res.success) {
          this.referalDetails = res.data;
        }
      })
    );
  }

  /**
   * Navigates to the 'Earning Details' page with the specified 'id' as a query parameter.
   * @method
   * @param {string} id - The ID of the referral for which to view earning details.
   */
  viewActivity(id: string) {
    this.router.navigate(['manage/affiliate/earningdetails'], {
      queryParams: { id: id }
    });
  }

  /**
   * Angular lifecycle hook called when the component is destroyed.
   * Unsubscribes from all active subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
