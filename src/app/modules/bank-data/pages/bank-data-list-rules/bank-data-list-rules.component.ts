import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankDataService } from 'src/app/shared/service/bank-data/bank-data.service';
import { NgFor, NgIf, NgClass } from '@angular/common';
interface IGetRules {
  bank_accounts: {
    '': [{ id: string; account_name: string; status: number }];
    toeleasdas: {
      619: [
        {
          id: string;
          account_name: string;
          status: number;
        }
      ];
    };
    categories: [
      {
        id: string;
        name: string;
      }
    ];
    rules: string;
    rules_data: string[];
  };
}
@Component({
  selector: 'app-list-rules',
  templateUrl: './bank-data-list-rules.component.html',
  styleUrls: ['./bank-data-list-rules.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [NgFor, NgIf, NgClass]
})
export class ListRulesComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];

  rules: IGetRules[] = [];
  loading = false;

  constructor(
    private _bankDataService: BankDataService,
    private _alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.getMyRules();
  }

  /**
   * @description  To get rules.
   *
   */
  getMyRules() {
    this.loading = true;

    this.subscriptions.push(
      this._bankDataService
        .getMyRules()
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((data) => {
          if (data?.success) {
            this.rules = data.data.rules_data;
          }
        })
    );
  }

  /**
   * @description  To delete rule.
   *
   */
  deleteRule(id: string, index: number) {
    const dRef = this._alertService.confirmAlert({
      title: 'Are you sure',
      content: 'You want to delete this rule ?',
      doneMsg: 'Yes'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this._bankDataService.deleteRule(id).subscribe((data) => {
            if (data?.success) {
              this._alertService.successAlert({
                title: 'Deleted !',
                content: 'Rule deleted'
              });
              this.rules.splice(index, 1);
            }
          })
        );
      }
    });
  }

  /**
   * @description  To reapply rules.
   *
   */
  reapplyRules() {
    this.subscriptions.push(
      this._bankDataService.reapplyRules().subscribe((data) => {
        if (data?.success) {
          this._alertService.successAlert({
            title: 'Success',
            content: 'Rules re-applied successfully',
            close: true,
            timeout: 2000
          });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
