import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import {
  ICheckRecurringAch,
  ICheckRecurringEventDetails,
  ICheckRecurringPayeeDetails,
  IGiftCardRecurringDetails
} from 'src/app/models/check-recurring';
import { CheckListRecurringService } from 'src/app/shared/service/check-list-recurring/check-list-recurring.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation, faSpinner, faArrowsRotate } from '@fortawesome/pro-solid-svg-icons';
import { CommentsComponent } from '../../components/comments/comments.component';
import { AuditTrailTableComponent } from '../../components/audit-trail-table/audit-trail-table.component';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

/**
 * @description Represents the component for viewing recurring payment details.
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
    MatTooltip,
    FaIconComponent,
    AuditTrailTableComponent,
    CommentsComponent
  ]
})
export class RecurringViewComponent implements OnInit, OnDestroy {
  private checkListRecurringService =  inject(CheckListRecurringService);
  private ActivatedRoute =  inject(ActivatedRoute);
  private router = inject(Router);
  private alertService = inject(AlertService);

  recurringID: string;
  achRecurringData: ICheckRecurringAch;
  giftCardRecurringData: IGiftCardRecurringDetails;
  payeeDetails: ICheckRecurringPayeeDetails;
  recurringEventDetails: ICheckRecurringEventDetails[];
  subscriptions: Subscription[] = [];
  type: string;
  selectedTabIndex = 0;
  recurringDataLoading = signal(false);
  retryingCheckId = signal<string | null>(null);
  faCircleExclamation = faCircleExclamation;
  faSpinner = faSpinner;
  faArrowsRotate = faArrowsRotate;

  viewPageTitle: Record<string, string> = { 
    "2": "ACH Recurring",
    "3": "Email Recurring",
    "4": "Gift Card Recurring"
  };

  ngOnInit(): void {
    this.ActivatedRoute.queryParamMap.subscribe((params) => {
      this.recurringID = params.get('id') || '0';
      this.type = params.get('type') || '2';
      this.selectedTabIndex = params.get('openTab') === 'recurring' ? 2 : 0;
    });

    if (this.type === '4') {
      this.getGiftCardRecurring();
      this.getGiftCardEventDetails();
    } else {
      this.getAchRecurring();
      this.getPayeeDetails();
      this.getEventDetails();
    }
  }

  /**
   * @description Retrieves ACH recurring payment details and assigns them to the component property.
   */
  getAchRecurring() {
    this.recurringDataLoading.set(true);
    this.subscriptions.push(
      this.checkListRecurringService
        .viewAchRecurringDetails(this.recurringID)
        .subscribe((response) => {
          this.achRecurringData = response.data;
          this.recurringDataLoading.set(false);
        })
    );
  }

  /**
   * @description Retrieves payee details for the recurring payment and assigns them to the component property.
   */
  getPayeeDetails() {
    this.subscriptions.push(
      this.checkListRecurringService
        .getPayeeDetails(this.recurringID)
        .subscribe((response) => {
          this.payeeDetails = response.data;
        })
    );
  }

  /**
   * @description Retrieves event details for the recurring payment and assigns them to the component property.
   */
  getEventDetails() {
    this.subscriptions.push(
      this.checkListRecurringService
        .getRecurringEventDetails(this.recurringID)
        .subscribe((res) => {
          this.recurringEventDetails = res.data;
        })
    );
  }

  getGiftCardRecurring() {
    this.recurringDataLoading.set(true);
    this.subscriptions.push(
      this.checkListRecurringService
        .viewGiftCardRecurringDetails(this.recurringID)
        .subscribe((response) => {
          this.giftCardRecurringData = response.data;
          this.recurringDataLoading.set(false);
        })
    );
  }

  getGiftCardEventDetails() {
    this.subscriptions.push(
      this.checkListRecurringService
        .getGiftCardRecurringEventDetails(this.recurringID)
        .subscribe((res) => {
          this.recurringEventDetails = res.data;
        })
    );
  }

  /**
   * @description Retries a failed recurring event and refreshes the event list on success.
   */
  retryEvent(checkId: string) {
    const isConfirm = this.alertService.confirmAlert({
      title: 'Confirm',
      content: 'Are you sure you want to retry this recurring payment?'
    });
    isConfirm.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.retryingCheckId.set(checkId);
      const retryCall =
        this.type === '4'
          ? this.checkListRecurringService.retryGiftCardRecurringEvent(checkId)
          : this.checkListRecurringService.retryRecurringEvent(checkId);
      this.subscriptions.push(
        retryCall
          .pipe(finalize(() => this.retryingCheckId.set(null)))
          .subscribe((response) => {
            if (response.success) {
              this.alertService.successAlert({ title: ' ', content: response.data });
              if (this.type === '4') {
                this.getGiftCardEventDetails();
              } else {
                this.getEventDetails();
              }
            }
          })
      );
    });
  }

  backButtonClick() {
    this.router.navigate(['/manage/payments-table/recurring'], {
      queryParams: {
        tab: Number(this.type)
      }
    });
  }

  getViewPageTitle(type: string) {
    return this.viewPageTitle[type];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
