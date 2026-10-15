import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ICheckRecurringAuditTrialTable } from 'src/app/models/check-recurring';
import { CheckListRecurringService } from 'src/app/shared/service/check-list-recurring/check-list-recurring.service';
import { NgFor } from '@angular/common';

/**
 * @description Represents the AuditTrailTableComponent class that implements the OnInit and OnDestroy interfaces.
 */
@Component({
  selector: 'app-audit-trail-table',
  templateUrl: './audit-trail-table.component.html',
  styleUrls: ['./audit-trail-table.component.scss'],
  standalone: true,
  imports: [NgFor]
})
export class AuditTrailTableComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  recurringID: string;
  auditTrail: ICheckRecurringAuditTrialTable[];

  @Input() type: string;

  constructor(
    private ActivatedRoute: ActivatedRoute,
    private _checkListRecurringService: CheckListRecurringService
  ) {}

  ngOnInit(): void {
    this.ActivatedRoute.queryParamMap.subscribe((params) => {
      this.recurringID = params.get('id') || '0';
    });

    this.getAchAuditTrail();
  }

  /**
   * @description Fetches the audit trail data for the recurring item.
   */
  getAchAuditTrail() {
    this.subscriptions.push(
      this._checkListRecurringService
        .getAchAuditTrail(this.type, this.recurringID)
        .subscribe((response) => {
          this.auditTrail = response.data;
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
