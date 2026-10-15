import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IComment, IGetComment } from 'src/app/models/common';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { GetPaidByFormService } from 'src/app/shared/service/getPaidByForm/get-paid-by-form.service';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

/**
 * @description A component used to display recurring ACH payments details
 */
@Component({
  selector: 'app-ach-recurring-view',
  templateUrl: './ach-recurring-view.component.html',
  styleUrls: ['./ach-recurring-view.component.scss'],
  standalone: true,
  imports: [CommonBackButtonV35Component, NgClass, FormsModule]
})
export class AchRecurringViewComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  id: string;
  viewData: any;
  personalDetails: any;
  auditTrail: any;
  commentList: IGetComment[] = [];
  comment: string;
  isloading = false;
  recurringEventDetails: any[];

  constructor(
    public activatedRoute: ActivatedRoute,
    private _getPaidByFormService: GetPaidByFormService,
    private _sharedService: SharedService
  ) {
    this.activatedRoute.queryParams.subscribe((data) => {
      this.id = data.id;
    });
  }

  ngOnInit(): void {
    this.getCheckDetails(this.id);
    this.getAuditTrail(this.id);
    this.getPersonalDetails(this.id);
    this.getComments(this.id);
    this.getRecurringEventDetails(this.id);
  }

  getCheckDetails(id: any) {
    this.subscriptions.push(
      this._getPaidByFormService.viewRecurringDetails(id).subscribe((res) => {
        if (res.success) {
          this.viewData = res.data;
        }
      })
    );
  }

  getAuditTrail(id: any) {
    this.subscriptions.push(
      this._getPaidByFormService.getAuditTrail(id).subscribe((res) => {
        if (res.success) {
          this.auditTrail = res.data;
        }
      })
    );
  }

  getPersonalDetails(id: any) {
    this.subscriptions.push(
      this._getPaidByFormService.getPersonalDetails(id).subscribe((res) => {
        if (res.success) {
          this.personalDetails = res.data;
        }
      })
    );
  }

  getComments(id: any) {
    this.subscriptions.push(
      this._sharedService
        .getAllComments('ach-recurring', id)
        .pipe(
          catchError(() => {
            // this.__AlertService.confirmAlert(alert)
            return of(false);
          })
        )
        .subscribe((res) => {
          const response = res as IComment;
          if (response.success) {
            const commentData = response.data as IGetComment[];
            this.commentList = commentData;
          }
        })
    );
  }

  /**
   * @description Adds a comment to the recurring ACH payment.
   */
  addComment() {
    this.isloading = true;
    const data = {
      comment: this.comment
    };
    if (this.comment !== '' && this.comment) {
      this.subscriptions.push(
        this._sharedService
          .addComment('ach-recurring', this.id, data)
          .subscribe((res) => {
            if (res.success) {
              this.isloading = false;
              this.getComments(this.id);
              this.comment = '';
            }
          })
      );
    }
  }

  getRecurringEventDetails(id: string) {
    this.subscriptions.push(
      this._getPaidByFormService
        .getAchRecurringEvent(id)
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
