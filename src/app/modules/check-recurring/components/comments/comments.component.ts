import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ICheckAchRecurringComments, IGiftCardRecurringComment } from 'src/app/models/check-recurring';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { CheckListRecurringService } from 'src/app/shared/service/check-list-recurring/check-list-recurring.service';
import { NgFor } from '@angular/common';

/**
 * @description Represents the component for displaying and adding comments to recurring payments or check mailings.
 */
@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss'],
  standalone: true,
  imports: [NgFor]
})
export class CommentsComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  recurringID: string;
  comments: ICheckAchRecurringComments[];

  @Input() type: string;

  constructor(
    private ActivatedRoute: ActivatedRoute,
    public __dialog: MatDialog,
    private _checkListRecurringService: CheckListRecurringService
  ) {}

  ngOnInit(): void {
    this.ActivatedRoute.queryParamMap.subscribe((params) => {
      this.recurringID = params.get('id') || '0';
    });

    if (this.type === 'recurring') {
      this.getCommentsRecurring();
    } else if (this.type === 'gift-card-recurring') {
      this.getCommentsGiftCard();
    } else {
      this.getComments();
    }
  }

  /**
   * @description Retrieves recurring comments and assigns them to the component property.
   */
  getCommentsRecurring() {
    this.subscriptions.push(
      this._checkListRecurringService
        .getRecurringComment(this.recurringID)
        .subscribe((response) => {
          this.comments = response.data;
        })
    );
  }

  /**
   * @description Retrieves comments and assigns them to the component property.
   */
  getComments() {
    this.subscriptions.push(
      this._checkListRecurringService
        .getComments(this.recurringID)
        .subscribe((response) => {
          this.comments = response.data;
        })
    );
  }

  /**
   * @description Retrieves gift card recurring comments.
   * Maps created_at to formated_date since the gift card API returns ISO timestamps
   * instead of the pre-formatted date string returned by ACH/check-mailing recurring.
   */
  getCommentsGiftCard() {
    this.subscriptions.push(
      this._checkListRecurringService
        .getGiftCardComments(this.recurringID)
        .subscribe((response) => {
          this.comments = response.data.map(
            (c: IGiftCardRecurringComment) => ({
              ...c,
              formated_date: this.formatIsoDate(c.created_at),
              encrypted_id: '',
              user: c.user_name,
              status: ''
            })
          ) as unknown as ICheckAchRecurringComments[];
        })
    );
  }

  private formatIsoDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${d.getFullYear()}`;
  }

  /**
   * @description Opens a modal for adding a new comment based on the component's type.
   * For gift-card-recurring, delete is enabled and the recurring ID is forwarded so that:
   *   - POST body includes `id` (required by the gift card comments endpoint)
   *   - DELETE uses the correct /recurring/gift-card-recurring/{recurringId}/comments/{id} URL
   */
  addCommentModal() {
    if (this.type === 'recurring') {
      const dialog = this.__dialog.open(AddCommentsModalComponent, {
        maxWidth: '700px',
        width: '100%',
        data: { id: this.recurringID, type: 'check-mailing/recurring' }
      });
      dialog.afterClosed().subscribe((response) => {
        if (response) {
          this.getCommentsRecurring();
        }
      });
    } else if (this.type === 'gift-card-recurring') {
      const dialog = this.__dialog.open(AddCommentsModalComponent, {
        maxWidth: '700px',
        width: '100%',
        data: {
          id: this.recurringID,
          type: 'gift-card-recurring',
          enableDelete: true,
          recurringId: this.recurringID
        }
      });
      dialog.afterClosed().subscribe((response) => {
        if (response) {
          this.getCommentsGiftCard();
        }
      });
    } else {
      const dialog = this.__dialog.open(AddCommentsModalComponent, {
        maxWidth: '700px',
        width: '100%',
        data: { id: this.recurringID, type: 'ach-recurring' }
      });
      dialog.afterClosed().subscribe((response) => {
        if (response) {
          this.getComments();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
