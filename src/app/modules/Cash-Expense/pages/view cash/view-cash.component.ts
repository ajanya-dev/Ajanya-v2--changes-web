import {
  faCopy,
  faPenToSquare,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { formatNumber, CurrencyPipe } from '@angular/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { MatTabGroup, MatTab, MatTabLabel } from '@angular/material/tabs';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CashExpDetailComponent } from '../../components/cash-exp-detail/cash-exp-detail.component';
import { CashExpLastTransactionComponent } from '../../components/cash-exp-last-transaction/cash-exp-last-transaction.component';
import { CashExpAttachmentComponent } from '../../components/cash-exp-attachment/cash-exp-attachment.component';
import { CashExpCommentsComponent } from '../../components/cash-exp-comments/cash-exp-comments.component';
import { CashExpActivityLogComponent } from '../../components/cash-exp-activity-log/cash-exp-activity-log.component';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import {
  ICashExpenseDetails,
  ICashexpensePayeeSummary
} from '../../model/CashExpense';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-view-cash-view',
  templateUrl: './view-cash.component.html',
  styleUrls: ['./view-cash.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    FaIconComponent,
    MatTabGroup,
    MatTab,
    MatTabLabel,
    CashExpActivityLogComponent,
    CashExpCommentsComponent,
    CashExpAttachmentComponent,
    CashExpLastTransactionComponent,
    CashExpDetailComponent,
    CurrencyPipe,
    CommonButtonV35Component
  ]
})
export class ViewCashComponent implements OnInit, OnDestroy {
  public dialog = inject(MatDialog);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private cashExpenseService = inject(CashExpenseService);
  private alertService = inject(AlertService);

  faPenToSquare = faPenToSquare;
  faTrash = faTrash;
  faCopy = faCopy;

  cashExpenseId: string;
  cashExpenseData: ICashExpenseDetails;
  payeeSummaryData: ICashexpensePayeeSummary;

  subscriptions: Subscription[] = [];
  payeeId: string;
  cashExpenseDisplayTotal = '0';
  deleteLoading: boolean = false;

  ngOnInit(): void {
    this.getCashExpenseData();
    this.loadCashExpenseData();
  }

  getCashExpenseData() {
    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe((params) => {
        this.cashExpenseId = params.get('id') as string;
      })
    );
  }

  loadCashExpenseData() {
    this.subscriptions.push(
      this.cashExpenseService
        .getCashExpensesById(this.cashExpenseId)
        .subscribe((res) => {
          if (res.success === true) {
            this.cashExpenseData = res.data as ICashExpenseDetails;
            this.cashExpenseDisplayTotal =
              this.cashExpenseData.grandTotal !== 'undefined'
                ? formatNumber(
                    this.cashExpenseData.grandTotal as number,
                    'en-US',
                    '1.2-2'
                  )
                : '0';

            this.payeeId = this.cashExpenseData.payee.payeeId;

            this.loadPayeeSummary();
          }
        })
    );
  }

  loadPayeeSummary() {
    this.subscriptions.push(
      this.cashExpenseService
        .getPayeeSummary(this.cashExpenseData.payee.payeeId)
        .subscribe((res) => {
          if (res.success === true) {
            this.payeeSummaryData = res.data;
          }
        })
    );
  }

  onEditCashExpense() {
    this.router.navigate(['/manage/cashexp/new-cash'], {
      queryParams: { id: this.cashExpenseId }
    });
  }

  onDeleteCashExpense() {
    const confirmContent = 'You want to delete this cash expense entry?';
    const cancelMsg = 'No, Cancel!';
    const doneMsg = 'Yes, Delete it!';
    const alert = this.openConfirmAlert(confirmContent, cancelMsg, doneMsg);
    this.subscriptions.push(
      alert.afterClosed().subscribe((result) => {
        if (result) {
          this.deleteLoading = true;
          this.subscriptions.push(
            this.cashExpenseService
              .deleteCashexpense(this.cashExpenseId)
              .pipe(
                finalize(() => {
                  this.deleteLoading = false;
                })
              )
              .subscribe((res) => {
                if (res.success === true) {
                  const successContent = 'Cash Expense Deleted.';
                  this.successAlert(successContent);
                  this.router.navigateByUrl('/manage/cashexp');
                }
              })
          );
        }
      })
    );
  }

  openConfirmAlert(content: string, cancelMsg?: string, doneMsg?: string) {
    const data = {
      title: 'Are You Sure ?',
      content,
      cancelMsg: cancelMsg || 'cancel!',
      doneMsg: doneMsg || 'OK'
    };
    return this.alertService.confirmAlert(data);
  }

  successAlert(content: string): void {
    const data = {
      title: 'Success!',
      content,
      close: true
    };
    this.alertService.successAlert(data);
  }

  onClickTransAmount(ev: string) {
    if (ev) {
      this.cashExpenseId = ev;
      this.loadCashExpenseData();
    }
  }

  clone(): void {
    this.router.navigate(['/manage/cashexp/new-cash'], {
      queryParams: { id: this.cashExpenseId, isClone: true }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
