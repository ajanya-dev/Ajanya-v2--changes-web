import { CommonModule } from '@angular/common';
import {
  Component,
  InputSignal,
  inject,
  input,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal,
  OnChanges
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { finalize, Subscription } from 'rxjs';
import { OpenAttachmentModalComponent } from 'src/app/modules/check/modal/open-attachment-modal/open-attachment-modal.component';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatTooltipModule,
    CommonButtonV35Component
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-depositSlip-attachments',
  templateUrl: './depositSlip-attachments.component.html',
  styleUrls: ['./depositSlip-attachments.component.scss']
})
export class DepositSlipAttachmentsComponent implements OnChanges {
  slipId: InputSignal<string> = input<string>('');
  private depositSlipService = inject(DepositSlipsService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);

  subscriptions: Subscription[] = [];

  depositSlipAttachmentData: { [key: string]: string }[] = [];
  isLoading = signal(false);

  /** component init method */
  ngOnChanges() {
    if (this.slipId()) {
      this.loadAttachments();
    }
  }

  /** Method used for load attachment */
  loadAttachments() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.depositSlipService
        .getDepositSlipAttachments(this.slipId())
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe((res) => {
          if (res?.success) {
            this.depositSlipAttachmentData = res.data;
            this.cdr.detectChanges();
          }
        })
    );
  }

  /** Method used for add attachment */
  addAttachment() {
    const dialogRef = this.dialog.open(AddAttachmentModalComponent, {
      maxWidth: '600px',
      width: '93%',
      data: {
        id: this.slipId(),
        type: 'deposit-slips',
        enableDelete: true
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      this.loadAttachments();
    });
  }

  /** Method for delete attachment */
  onDeleteAttachment(id: string) {
    const attachmentId = id;
    const alert = this.openConfirmAlert();
    this.subscriptions.push(
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.subscriptions.push(
            this.depositSlipService
              .deleteDepositSlipAttachment(this.slipId(), attachmentId)
              .subscribe((res) => {
                if (res.success === true) {
                  this.openSuccessAlert();
                  for (const [
                    i,
                    value
                  ] of this.depositSlipAttachmentData.entries()) {
                    if (value.encrypted_id === attachmentId)
                      this.depositSlipAttachmentData.splice(i, 1);
                  }
                  this.cdr.detectChanges();
                }
              })
          );
        }
      })
    );
  }

  /** Confirm alert */
  openConfirmAlert() {
    const data = {
      title: 'Confirm',
      content: 'Are you sure you want to delete this deposit slip attachment?',
      cancelMsg: 'No, Cancel!',
      doneMsg: 'Yes, Delete it!'
    };
    return this.alertService.confirmAlert(data);
  }

  /** Success alert */
  openSuccessAlert() {
    const data = {
      title: 'Success!',
      content: 'Attachment deleted',
      close: true
    };
    return this.alertService.successAlert(data);
  }

  /** Method handles attachment view */
  openAttachment(id: string, openInModal: boolean) {
    const attachmentId = id;
    this.subscriptions.push(
      this.depositSlipService
        .openDepositSlipAttachment(this.slipId(), attachmentId)
        .subscribe((res) => {
          if (res.success === true) {
            const link = res.data;
            const ext = link.split('.').pop();
            if (ext) {
              const fileExtention = ext.substring(0, 3);
              if (
                openInModal &&
                (fileExtention ?? '').toLowerCase() === 'pdf'
              ) {
                this.openAttachmentModal(link);
                return;
              }
            }
            window.open(link);
          }
        })
    );
  }

  /** Method used to open attachments in modal */
  openAttachmentModal(link: string) {
    this.dialog.open(OpenAttachmentModalComponent, {
      maxWidth: '1100px',
      width: '95%',
      height: '90%',
      data: { link }
    });
  }

  /** destroyer */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
