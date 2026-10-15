import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faDownload,
  faEnvelope,
  faSpinner,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subscription } from 'rxjs';
import { IGetAttachment } from 'src/app/models/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';

/**
 * @description Component for viewing attachments in checks etc.
 */
@Component({
  standalone: true,
  imports: [CommonModule, FontAwesomeModule,NgOptimizedImage],
  selector: 'app-view-attachments',
  templateUrl: './view-attachments.component.html',
  styleUrls: ['./view-attachments.component.scss']
})
export class ViewAttachmentsComponent implements OnChanges, OnDestroy {
  @Input() slug: string; // Options - bills, vendor-credits ...
  @Input() id: string; //             👆 ids

  subscriptions: Subscription[] = [];
  headers = ['Date', 'User', 'File', 'Action'];
  attachmentInfo: IGetAttachment[] = [];
  isLoading = signal(false);

  faEnvelope = faEnvelope;
  faDownload = faDownload;
  faTrash = faTrash;
  faSpinner = faSpinner;

  private sharedService = inject(SharedService);
  public alertService = inject(AlertService);

  ngOnChanges(): void {
    if (this.id) {
      this.getData();
    }
  }

  /**
   * @description Gets attachments data
   */
  getData() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.sharedService.getAttachment(this.slug, this.id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((data) => {
        if (data?.success) {
          this.attachmentInfo = data.data;
        }
      })
    );
  }

  /**
   * @description Opens the attachment in a new window.
   * @param attachmentId - ID of the attachment.
   */
  openAttachment(attachmentId: string) {
    this.subscriptions.push(
      this.sharedService
        .openAttachment(this.slug, this.id, attachmentId)
        .subscribe((data) => {
          if (data?.success) {
            const urlLoaded = window.open(data.data);
            if (
              !urlLoaded ||
              urlLoaded.closed ||
              typeof urlLoaded.closed === 'undefined'
            ) {
              this.openWarningAlert(
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window'
              );
            }
          }
        })
    );
  }

  /**
   * @description Method for deleting attachment.
   * @param attachmentId - ID of the attachment.
   */
  deleteAttachment(attachmentId: string) {
    const ref = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this attachment?',
      cancelMsg: 'No, cancel',
      doneMsg: 'Yes'
    });
    this.subscriptions.push(
      ref.afterClosed().subscribe((res) => {
        if (res) {
          this.subscriptions.push(
            this.sharedService
              .deleteAttachment(this.slug, this.id, attachmentId)
              .subscribe((data) => {
                if (data?.success) {
                  this.alertService.successAlert({});
                  this.onDeleteSuccess(attachmentId);
                }
              })
          );
        }
      })
    );
  }

  /**
   * @description Updates the data array by removing the deleted item.
   * @param attachmentId - ID of the attachment.
   */
  onDeleteSuccess(attachmentId: string) {
    this.attachmentInfo = this.attachmentInfo.filter(
      (ele) => ele.encrypted_id !== attachmentId
    );
  }

  /**
   * @description Opens warning alert.
   * @param content - content for the alert dialog.
   */
  openWarningAlert(content: string): void {
    const data = {
      title: 'Error',
      content
    };
    this.alertService.warningAlert(data);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
