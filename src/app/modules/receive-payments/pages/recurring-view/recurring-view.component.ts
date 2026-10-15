import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GetPaidByFormService } from 'src/app/shared/service/getPaidByForm/get-paid-by-form.service';
import { FormsModule } from '@angular/forms';
import { NgFor, NgClass, NgOptimizedImage } from '@angular/common';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

/**
 * @description Component is responsible for displaying and managing a table of recurring payment details
 */
@Component({
  selector: 'app-recurring-view',
  templateUrl: './recurring-view.component.html',
  styleUrls: ['./recurring-view.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    MatTabGroup,
    MatTab,
    NgFor,
    FormsModule,
    NgClass,
    NgOptimizedImage
  ]
})
export class RecurringViewComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  id: string;
  viewData: any;
  metaData: { key: string; value: string }[] = [];
  activityLog: any;
  commentList = [];
  comment: string;
  isloading = false;
  recurringEventDetails: any[];

  constructor(
    public activatedRoute: ActivatedRoute,
    private _getPaidByFormService: GetPaidByFormService
  ) {
    this.activatedRoute.queryParams.subscribe((data) => {
      this.id = data.id;
    });
  }

  ngOnInit(): void {
    this.getCheckDetails(this.id);
    this.getActivityLog(this.id);
    this.getComments(this.id);
    this.getRecurringEventDetails(this.id);
  }

  getCheckDetails(id: any) {
    this.subscriptions.push(
      this._getPaidByFormService.viewgpbfCheck(id).subscribe((res) => {
        if (res.success) {
          this.viewData = res.data;
          let parsedMetaData: Record<string, string> = {};

          if (typeof this.viewData.meta_data === 'string') {
            try {
              parsedMetaData = JSON.parse(this.viewData.meta_data);
            } catch (e) {
              parsedMetaData = {};
            }
          } else if (
            this.viewData.meta_data &&
            typeof this.viewData.meta_data === 'object'
          ) {
            parsedMetaData = this.viewData.meta_data;
          }
          this.metaData = Object.entries(parsedMetaData).map(([key, value]) => ({
            key,
            value: value as string
          }));
        }
      })
    );
  }

  getActivityLog(id: any) {
    this.subscriptions.push(
      this._getPaidByFormService.getgpbfActivityLog(id).subscribe((res) => {
        if (res.success) {
          this.activityLog = res.data;
        }
      })
    );
  }

  /**
   * @description Retrieves the comment associated with a specific recurring payment
   * @param id - The ID of the recurring payment for which to fetch the comments
   */
  getComments(id: any) {
    this.subscriptions.push(
      this._getPaidByFormService
        .getComment(id)
        .pipe(
          catchError(() => {
            // this.__AlertService.confirmAlert(alert)
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.commentList = res.data;
          }
        })
    );
  }

  /**
   * @description Adds a new comment to the recurring payment
   */
  addComment() {
    this.isloading = true;
    const data = {
      id: this.id,
      comment: this.comment
    };
    if (this.comment !== '' && this.comment) {
      this.subscriptions.push(
        this._getPaidByFormService.addComments(data).subscribe((res) => {
          if (res.success) {
            this.isloading = false;
            this.getComments(this.id);
            this.comment = '';
          }
        })
      );
    }
  }

  /**
   * @description Retrieves the details of a recurring event
   * @param id -The ID of the recurring event
   */
  getRecurringEventDetails(id: string) {
    this.subscriptions.push(
      this._getPaidByFormService
        .getRecurringEventDetails(id)
        .pipe(
          catchError(() => {
            // this.__AlertService.confirmAlert(alert)
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.recurringEventDetails = res.data;
          }
        })
    );
  }

  /**
   * @description Generates the URL for retrieving IP geolocation information
   */
  getIpNav(ip: string) {
    return 'https://ipapi.co/' + ip;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
