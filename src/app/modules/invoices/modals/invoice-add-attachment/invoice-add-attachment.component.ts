import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions
} from '@angular/material/dialog';
import { Subject, Subscription } from 'rxjs';
import { IGetAttachment } from 'src/app/models/common';
import { IAttachments } from 'src/app/modules/invoices/model/invoice';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropZoneComponent } from '../../../../shared/components/drop-zone/drop-zone.component';

/**
 * Interface for the data passed to the Invoice Add Attachment Modal Component.
 */
interface IAttachmentData {
  id: string;
  acceptFormats: string;
  type: string;
  attachId: string;
}
@Component({
  selector: 'app-invoice-add-attachment',
  templateUrl: './invoice-add-attachment.component.html',
  styleUrls: ['./invoice-add-attachment.component.scss'],
  standalone: true,
  imports: [DropZoneComponent, FormsModule, NgClass, MatDialogActions]
})
export class InvoiceAddAttachmentModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];

  files: File[] = [];
  invalid = false;
  disabled = false;
  attachments: IGetAttachment[] = [];
  initialAttachments = 0;
  acceptFormats = '';
  checkedAttch: string[] = [];
  type: string;
  typeId: string;
  removeSubject = new Subject();

  public attachmentData: IAttachmentData = inject(MAT_DIALOG_DATA);
  private invoiceService = inject(InvoiceService);
  private alertService = inject(AlertService);
  private sharedService = inject(SharedService);
  private dialogRef = inject(MatDialogRef<InvoiceAddAttachmentModalComponent>);
  private dataTableService = inject(DataTableService);

  /**
   * Initializes the component.
   */
  ngOnInit(): void {
    this.typeId = this.attachmentData.id;
    this.type = this.attachmentData.type;
    this.acceptFormats = this.attachmentData.acceptFormats;
    this.getAttachment();
  }

  /**
   * Handles file selection in the dropzone.
   * @param event The file select result.
   */
  onSelect(event: File[]) {
    if (event?.length) {
      this.addAttachment(event[0]);
    }
  }

  /**
   * Retrieves the attachments for the current type and ID.
   */
  getAttachment() {
    this.subscriptions.push(
      this.sharedService
        .getAttachment(this.type, this.typeId)
        .subscribe((res) => {
          if (res?.success) {
            this.attachments = res.data;
            this.initialAttachments = res.data?.length;
            setTimeout(() => {
              this.checked();
            }, 1000);
          }
        })
    );
  }

  /**
   * Handles checking of attachments based on attachId.
   */
  checked() {
    if (this.attachmentData.attachId) {
      this.attachments.forEach((attachment) => {
        if (this.attachmentData.attachId?.includes(attachment.encrypted_id)) {
          this.checkedAttch.push(attachment.encrypted_id);
          const attachBox = document.getElementById(
            `attachId_${attachment.encrypted_id}`
          ) as HTMLInputElement;
          attachBox.checked = true;
        }
      });
    }
  }

  /**
   * Handles checking/unchecking a single attachment.
   * @param event The event object.
   * @param item The attachment item.
   */
  singlecheck(event: Event, item: IAttachments | IGetAttachment) {
    const isChecked = (<HTMLInputElement>event.target).checked;
    if (isChecked) {
      const format = item.file_name.split('.')[1];
      if ((format ?? '').toLowerCase() !== 'pdf') {
        this.alertService.warningAlert({
          content: 'Supported only pdf format'
        });
        const unCheck = document.getElementById(
          `attachId_${item.encrypted_id}`
        ) as HTMLInputElement;
        unCheck.checked = false;
      } else {
        this.checkedAttch.push(item.encrypted_id);
      }
    } else {
      this.checkedAttch.splice(this.checkedAttch.indexOf(item.encrypted_id), 1);
    }
  }

  /**
   * Handles checking a selected attachment.
   * @param id The ID of the attachment to check.
   */
  selectedcheck(id: string) {
    this.checkedAttch.push(id);
    this.checkedAttch.forEach((attachment) => {
      const attachBox = document.getElementById(
        `attachId_${attachment}`
      ) as HTMLInputElement;
      attachBox.checked = true;
    });
  }

  /**
   * Opens an attachment in a new window.
   * @param attachmentId The ID of the attachment to open.
   */
  openAttachment(attachmentId: string) {
    this.subscriptions.push(
      this.invoiceService
        .openAttachment(this.typeId, attachmentId)
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
   * Adds a new attachment.
   * @param addedFile The file to add as an attachment.
   */
  addAttachment(addedFile: File) {
    if (this.attachments.length >= 5) {
      this.alertService.warningAlert({
        content: 'Maximum 5 attachments only'
      });
    } else {
      const file = new FormData();
      file.append('image', addedFile);

      this.subscriptions.push(
        this.sharedService
          .addAttachment(this.type, this.typeId, file)
          .subscribe((data) => {
            if (data?.success) {
              this.attachments.push(data.data);
            }
            this.removeSubject.next(true);
            this.getAttachment();
            setTimeout(() => {
              this.selectedcheck(data.data.encrypted_id);
            }, 1000);
          })
      );
    }
  }

  /**
   * Deletes an attachment.
   * @param attachmentId The ID of the attachment to delete.
   */
  deleteAttachment(attachmentId: string) {
    this.disabled = true;
    this.subscriptions.push(
      this.sharedService
        .deleteAttachment(this.type, this.typeId, attachmentId)
        .subscribe((res) => {
          if (res?.success) {
            this.disabled = false;
            this.checkedAttch.splice(
              this.checkedAttch.indexOf(attachmentId),
              1
            );
            this.attachments = this.attachments.filter(
              (ele) => ele.encrypted_id !== attachmentId
            );
          }
        })
    );
  }

  /**
   * Closes the modal and returns selected attachments.
   */
  close() {
    const ids: string[] = [];
    let fileName = '';
    this.attachments.forEach((e) => {
      if (this.checkedAttch.includes(e.encrypted_id)) {
        ids.push(e.encrypted_id);
        fileName += `${e.file_name} , `;
      }
    });

    // If attachements change
    if (!this.initialAttachments !== !this.attachments.length) {
      this.dataTableService.setRefreshStatus(true);
    }

    this.dialogRef.close({ invoiceId: this.typeId, ids, fileName });
  }

  /**
   * Handles checking/unchecking all attachments.
   * @param event The event object.
   */
  checkAll(event: Event) {
    let count = false;
    const isChecked = (<HTMLInputElement>event.target).checked;
    if (isChecked) {
      for (let i = 0; i < this.attachments.length; i += 1) {
        const format = this.attachments[i].file_name.split('.')[1];
        if ((format ?? '').toLowerCase() !== 'pdf') {
          const unCheck = document.getElementById(
            `attachId_${this.attachments[i].encrypted_id}`
          ) as HTMLInputElement;
          unCheck.checked = false;
          if (!count) {
            this.alertService.warningAlert({
              content: 'Supported only pdf format'
            });
            count = true;
          }
        } else {
          const smsBox = document.querySelector(
            `#attachId_${this.attachments[i].encrypted_id}`
          ) as HTMLInputElement;
          smsBox.checked = true;
          this.attachments[i].checked = true;
          this.checkedAttch.push(this.attachments[i].encrypted_id);
        }
      }
    } else {
      this.checkedAttch = [];
      this.attachments.forEach((e, index: number) => {
        const smsBox = document.querySelector(
          `#attachId_${e.encrypted_id}`
        ) as HTMLInputElement;
        smsBox.checked = false;
        this.attachments[index].checked = false;
      });
    }
  }

  /**
   * Opens a warning alert with the given content.
   * @param content The content of the warning alert.
   */
  openWarningAlert(content: string): void {
    const data = {
      title: 'Error',
      content
    };
    this.alertService.warningAlert(data);
  }

  /**
   * Cleans up subscriptions when the component is destroyed.
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
