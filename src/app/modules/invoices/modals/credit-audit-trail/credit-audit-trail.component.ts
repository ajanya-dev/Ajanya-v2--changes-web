import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import {
  IAttachmentsList,
  IAuditList,
  ICommentList
} from '../../model/invoice';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-credit-audit-trail',
  templateUrl: './credit-audit-trail.component.html',
  styleUrls: ['./credit-audit-trail.component.scss'],
  standalone: true,
  imports: [MatDialogClose, FormsModule, NgFor, MatDialogActions]
})
export class CreditAuditTrailComponent implements OnInit, OnDestroy {
  /**
   * Array to hold subscriptions for cleanup.
   */
  subscriptions: Subscription[] = [];

  /**
   * List of audit trail entries.
   */
  auditList: IAuditList[] = [];

  /**
   * List of comments associated with the credit invoice.
   */
  commentsList: ICommentList[] = [];

  /**
   * List of attachments associated with the credit invoice.
   */
  attachmentsList: IAttachmentsList[] = [];

  /**
   * Constructor for the CreditAuditTrailComponent.
   *
   * @param dialog - MatDialog for displaying dialogs.
   * @param data - Data passed to the dialog.
   * @param _auditTrailService - InvoiceService for interacting with the invoice service.
   */
  constructor(
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: string,
    private _auditTrailService: InvoiceService
  ) {}

  /**
   * Lifecycle hook called after the component is initialized.
   * Retrieves and populates the audit trail, comments, and attachments.
   */
  ngOnInit(): void {
    this.auditTrail();
    this.getCreditComments();
    this.getCreditattachments();
  }

  /**
   * Retrieves the audit trail for the credit invoice.
   */
  auditTrail() {
    this.subscriptions.push(
      this._auditTrailService.auditTrailCredit(this.data).subscribe((res) => {
        this.auditList = res.data;
      })
    );
  }

  /**
   * Retrieves the comments associated with the credit invoice.
   */
  getCreditComments() {
    this.subscriptions.push(
      this._auditTrailService
        .getCreditComments(this.data)
        .subscribe((response) => {
          this.commentsList = response.data;
        })
    );
  }

  /**
   * Retrieves the attachments associated with the credit invoice.
   */
  getCreditattachments() {
    this.subscriptions.push(
      this._auditTrailService
        .getCreditattachments(this.data)
        .subscribe((response) => {
          this.attachmentsList = response.data;
        })
    );
  }

  /**
   * Lifecycle hook called when the component is destroyed.
   * Unsubscribes from all subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
