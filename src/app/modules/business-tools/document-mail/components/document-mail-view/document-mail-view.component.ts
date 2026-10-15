import { CommonModule, DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentMailService } from '../../services/document-mail.service';
import { finalize, Subscription } from 'rxjs';
import { faSpinner, faExternalLinkAlt } from '@fortawesome/pro-solid-svg-icons';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  IDocumentMailActivityLog,
  IDocumentMailById,
  IDocumentMailComments
} from '../../models/document-mail.model';
import { IApiRes } from 'src/app/models/api';

@Component({
  selector: 'app-document-mail-view',
  standalone: true,
  imports: [
    MatTabGroup,
    MatTab,
    FaIconComponent,
    OcwBackButtonComponent,
    CommonModule,
    CommonButtonV35Component,
    NgOptimizedImage,
    FaIconComponent
  ],
  templateUrl: './document-mail-view.component.html',
  styleUrl: './document-mail-view.component.scss'
})
export class DocumentMailViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private datePipe = inject(DatePipe);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private documentMailService = inject(DocumentMailService);

  subscription: Subscription[] = [];
  isRecurrig = false;
  Id: string;
  viewData: IDocumentMailById;
  activityLogs: IDocumentMailActivityLog[] = [];
  commentsList: IDocumentMailComments[] = [];
  isLoading = signal(false);
  isActivityLoading = signal(false);
  isCommentLoading = signal(false);
  attachmentsList = [];

  faSpinner = faSpinner;
  faExternalLinkAlt = faExternalLinkAlt;

  readonly fields = [
    { label: 'Document Title', key: 'document_title' },
    { label: 'Document Name', key: 'document_name' },
    { label: 'Document URL', key: 'document_url' },
    { label: 'Status', key: 'status' },
    { label: 'Page Count', key: 'count_page' },
    { label: 'Created Date', key: 'created_at' }
  ];

  readonly trackingFieldsLeft = [
    { label: 'Tracking Code', key: 'tracking_code' },
    { label: 'Payee Name', key: 'payee_name' },
    { label: 'Status', key: 'status_name' },
    { label: 'Payee Email', key: 'payee_email' },
    { label: 'Shipping Cost', key: 'shipping_cost' },
    { label: 'Payee Phone', key: 'payee_phone' }
  ];
  readonly trackingFieldsRight = [
    { label: 'Mail Type', key: 'mail_type_name' },
    { label: 'Payee Country', key: 'payee_country' },
    { label: 'Total Fee', key: 'total_fee' }
  ];

  readonly statusMapper = {
    0: 'New',
    1: 'Pending',
    2: 'Printed',
    3: 'Envelop Printed',
    4: 'Mail Sent',
    5: 'Refunded'
  };

  ngOnInit(): void {
    this.Id = this.route.snapshot.paramMap.get('id') as string;
    this.getViewData();
    this.getDocumentMailLogActivity();
    this.getComments();
  }

  /**
   * @description Fetches the view data for the document mail.
   */
  getViewData() {
    this.isLoading.set(true);
    this.subscription.push(
      this.documentMailService
        .getDocumentMailById(this.Id)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          this.viewData = res.data;
          this.viewData.status =
            this.statusMapper[
              this.viewData.status as keyof typeof this.statusMapper
            ];
        })
    );
  }

  goBack() {
    this.router.navigate(['manage/business-tools/document-mail']);
  }

  /**
   * @description Fetches the activity logs for the document mail.
   */
  getDocumentMailLogActivity() {
    this.isActivityLoading.set(true);
    this.subscription.push(
      this.documentMailService
        .getDocumentMailActivityLogs(this.Id)
        .pipe(finalize(() => this.isActivityLoading.set(false)))
        .subscribe((res: IApiRes<IDocumentMailActivityLog[]>) => {
          this.activityLogs = res.data;
        })
    );
  }

  /**
   * @description Fetches the comments for the document mail.
   */
  getComments() {
    this.isCommentLoading.set(true);
    this.subscription.push(
      this.documentMailService
        .getComments(this.Id)
        .pipe(finalize(() => this.isCommentLoading.set(false)))
        .subscribe((res) => {
          this.commentsList = res.data;
        })
    );
  }

  /**
   * @description Opens the "Add Comments" modal and refreshes the comments list after the modal is closed.
   */
  addcomments() {
    const dialogRef = this.dialog.open(AddCommentsModalComponent, {
      width: '100%',
      maxWidth: '700px',
      data: {
        id: this.Id,
        type: 'document-mailing'
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getComments();
      this.getDocumentMailLogActivity();
    });
  }

  /**
   * @description Formats a date string using the datePipe.
   * @param date - The date string to be formatted.
   * @returns - The formatted date string.
   */
  formatedDate(date: string) {
    return this.datePipe.transform(date, 'MM/dd/yyyy');
  }

  ngOnDestroy(): void {
    this.subscription.forEach((el) => el.unsubscribe());
  }
}
