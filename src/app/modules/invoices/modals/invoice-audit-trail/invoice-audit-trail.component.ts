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
  IAuditTrailList,
  ICommentList
} from '../../model/invoice';
import { NgFor, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Component for displaying the audit trail of an invoice.
 */
@Component({
  selector: 'app-invoice-audit-trail',
  templateUrl: './invoice-audit-trail.component.html',
  styleUrls: ['./invoice-audit-trail.component.scss'],
  standalone: true,
  imports: [MatDialogClose, FormsModule, NgFor, MatDialogActions, TitleCasePipe]
})
export class InvoiceAuditTrailComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  auditList: IAuditList[] = [];
  commentsList: ICommentList[] = [];
  attachmentsList: IAttachmentsList[] = [];

  /**
   * Initializes a new instance of the InvoiceAuditTrailComponent.
   * @param dialog The MatDialog service for displaying dialogs.
   * @param data Data injected into the component via MAT_DIALOG_DATA.
   * @param _InvoiceAuditTrailService The service for retrieving invoice audit trail data.
   */
  constructor(
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: string,
    private _InvoiceAuditTrailService: InvoiceService
  ) {}

  /**
   * Lifecycle hook called after component initialization.
   */
  ngOnInit(): void {
    this.invoiceAuditTrail();
    this.getComments();
    this.getAttachments();
  }

  /************************************** Get Data *************************************/

  /**
   * Retrieves comments for the invoice.
   */
  getComments() {
    this.subscriptions.push(
      this._InvoiceAuditTrailService
        .getComments(this.data)
        .subscribe((response: { data: ICommentList[] }) => {
          this.commentsList = response.data;
        })
    );
  }

  /**
   * Retrieves the audit trail for the invoice.
   */
  invoiceAuditTrail() {
    this.subscriptions.push(
      this._InvoiceAuditTrailService
        .auditTrailInvoice(this.data)
        .subscribe((res: { data: IAuditTrailList[] }) => {
          this.auditList = res.data;
        })
    );
  }

  /**
   * Retrieves attachments associated with the invoice.
   */
  getAttachments() {
    this.subscriptions.push(
      this._InvoiceAuditTrailService
        .getAttachments(this.data)
        .subscribe((response: { data: IAttachmentsList[] }) => {
          this.attachmentsList = response.data;
        })
    );
  }

  /**
   * Lifecycle hook called before the component is destroyed.
   * Unsubscribes from subscriptions to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
