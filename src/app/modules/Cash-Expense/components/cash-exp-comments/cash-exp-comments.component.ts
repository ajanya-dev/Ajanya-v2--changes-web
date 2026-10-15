import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { Subscription } from 'rxjs';
import { commentInterface } from 'src/app/models/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { NgIf, NgFor } from '@angular/common';

@Component({
  selector: 'app-cash-exp-comments',
  templateUrl: './cash-exp-comments.component.html',
  styleUrls: ['./cash-exp-comments.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgFor
  ]
})
export class CashExpCommentsComponent implements OnInit, OnDestroy {
  commentForm: UntypedFormGroup;
  @Input() cashExpenseId: any;
  @Input() fromModal = false;
  subscriptions: Subscription[] = [];
  commentsData: any;

  constructor(
    private _cashExpenseService: CashExpenseService,
    private _sharedService: SharedService,
    private _alertService: AlertService,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.loadCashExpenseComments();
    this.initFormGroup();
  }

  loadCashExpenseComments() {
    this.subscriptions.push(
      this._cashExpenseService
        .getCashExpenseComments(this.cashExpenseId)
        .subscribe((res) => {
          if (res.success) {
            this.commentsData = res.data;
          }
        })
    );
  }

  initFormGroup() {
    this.commentForm = this.fb.group({
      comment: ['', Validators.required]
    });
  }

  createCommentBody(): commentInterface {
    const data = this.commentForm.value;
    return {
      comment: data.comment
    };
  }

  onAddComment() {
    this.commentForm.markAllAsTouched();
    if (!this.commentForm.invalid) {
      this.subscriptions.push(
        this._sharedService
          .addComment(
            'cash-expenses',
            this.cashExpenseId,
            this.createCommentBody()
          )
          .subscribe((res: any) => {
            if (res.success == true) {
              this.successAlert();
              this.loadCashExpenseComments();
            }
          })
      );
      this.commentForm.reset();
    } else return false;
    return true;
  }

  successAlert() {
    const data = {
      title: 'Success!',
      content: 'Comment added.',
      close: true
    };
    this._alertService.successAlert(data);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
