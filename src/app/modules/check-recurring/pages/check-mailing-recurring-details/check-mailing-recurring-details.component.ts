import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { ICheckMailingRecurringJob, IRecurringCheck } from 'src/app/models/check-recurring';
import { CheckListRecurringService } from 'src/app/shared/service/check-list-recurring/check-list-recurring.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgFor, DatePipe, TitleCasePipe } from '@angular/common';
import { faCircleExclamation, faSpinner, faArrowsRotate } from '@fortawesome/pro-solid-svg-icons';
import { MatTooltip } from '@angular/material/tooltip';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { CommentsComponent } from '../../components/comments/comments.component';
import { AuditTrailTableComponent } from '../../components/audit-trail-table/audit-trail-table.component';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';

/**
 * @description Represents the component for displaying details of a recurring check mailing.
 */
@Component({
  selector: 'app-check-mailing-recurring-details',
  templateUrl: './check-mailing-recurring-details.component.html',
  styleUrls: ['./check-mailing-recurring-details.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    MatTabGroup,
    MatTab,
    MatTooltip,
    AuditTrailTableComponent,
    CommentsComponent,
    NgFor,
    FaIconComponent,
    DatePipe,
    TitleCasePipe
  ]
})
export class CheckMailingRecurringDetailsComponent
  implements OnInit, OnDestroy
{

  private router = inject(Router);

  subscriptions: Subscription[] = [];
  checkDetails: IRecurringCheck;
  recurringDetails: ICheckMailingRecurringJob[];
  data: string;
  cancelDate: string;
  type: string;
  selectedTabIndex = 0;
  isBankDeleted = false;
  isPayeeDeleted = false;
  isLoading = signal(false);
  faCircleExclamation = faCircleExclamation;
  faSpinner = faSpinner;
  faArrowsRotate = faArrowsRotate;
  retryingId = signal<string | null>(null);
  private alertService = inject(AlertService);
  constructor(
    private _checkListRecurringService: CheckListRecurringService,
    private ActivatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.ActivatedRoute.queryParamMap.subscribe((params) => {
      this.data = params.get('id') || '0';
      this.type = params.get('type') || '1';
      this.selectedTabIndex = params.get('openTab') === 'recurring' ? 2 : 0;
    });

    this.getRecurringDetails();
  }

  /**
   * @description Retrieves recurring check mailing details and assigns them to the component properties.
   */
  getRecurringDetails() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this._checkListRecurringService
        .viewRecurringDetails(this.data)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((response) => {
          this.cancelDate = response.data.cancelledDate;
          this.checkDetails = response.data.checks;
          this.recurringDetails = response.data.job;
          this.isBankDeleted = !!response.data.isBankDeleted;
          this.isPayeeDeleted = !!response.data.isPayeeDeleted;
        })
    );
  }

  /**
   * @description Retries a failed check mailing recurring event and refreshes the list on success.
   */
  retryEvent(id: string) {
    const isConfirm = this.alertService.confirmAlert({
      title: 'Confirm',
      content: 'Are you sure you want to retry this recurring payment?'
    });
    isConfirm.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.retryingId.set(id);
      this.subscriptions.push(
        this._checkListRecurringService
          .retryCheckMailingRecurringEvent(id)
          .pipe(finalize(() => this.retryingId.set(null)))
          .subscribe((response) => {
            if (response.success) {
              this.alertService.successAlert({ title: ' ', content: response.data });
              this.getRecurringDetails();
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
