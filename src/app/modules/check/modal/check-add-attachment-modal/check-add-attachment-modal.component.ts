import { Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions
} from '@angular/material/dialog';
import { Subject, Subscription, finalize } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ICheckAttachmentData } from '../../model/check';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropZoneComponent } from '../../../../shared/components/drop-zone/drop-zone.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-check-add-attachment-modal',
  templateUrl: './check-add-attachment-modal.component.html',
  styleUrls: ['./check-add-attachment-modal.component.scss'],
  standalone: true,
  imports: [DropZoneComponent, FormsModule, NgClass, MatDialogActions]
})
export class CheckAddAttachmentModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];

  files: File[] = [];
  invalid = false;
  disabled = false;
  attachments: ICheckAttachmentData[] = [];
  initialAttachments = 0;
  acceptFormats = '';
  checkedAttch: string[] = [];
  removeSubject = new Subject();
  validateFileSize = false;

  public data = inject(MAT_DIALOG_DATA); // check id
  private checkService = inject(CheckService);
  public alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<CheckAddAttachmentModalComponent>);
  private dataTableService = inject(DataTableService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.acceptFormats = this.data.acceptFormats;
    this.validateFileSize = !!this.data?.validateFileSize;
    if(this.data.type === 'group_payments'){
      this.getGroupPaymentsAttachment(this.data.checkId);
    }else{
      this.getAttachment(this.data.checkId);
    }
  }

  onSelect(event: File[]) {
    if (event?.length) {
      // Check file size limit (10MB) only when enabled by config or in group_payments mode
      if (this.validateFileSize || this.data.type === 'group_payments') {
        const maxFileSizeInBytes = 10 * 1024 * 1024; // 10MB
        if (event[0].size > maxFileSizeInBytes) {
          this.alertService.warningAlert({
            content: 'Maximum file size is 10MB. Please select a smaller file.'
          });
          this.removeSubject.next(true);
          return;
        }
      }
      this.addAttachment(event[0]);
    }
  }

  /** **************************************get Attachment ************************* */

  getAttachment(checkId: string) {
    this.subscriptions.push(
      this.checkService.getCheckAttachment(checkId).subscribe((res) => {
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

  getGroupPaymentsAttachment(checkId: string) {
    this.subscriptions.push(
      this.checkService.groupMailGetAttachments(checkId).subscribe((res) => {
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

  checked() {
    this.attachments.forEach((attachment) => {
      if (this.data?.attachId?.includes(attachment.id)) {
        this.checkedAttch.push(attachment.id);
        const attachBox = document.getElementById(
          `attachId_${attachment.id}`
        ) as HTMLInputElement;
        attachBox.checked = true;
        if(this.data.type === 'group_payments'){
          attachBox.disabled = true;
        }
      }
    });
  }

  singlecheck(event: Event, item: (typeof this.attachments)[number]) {
    if ((event.target as HTMLInputElement).checked) {
      const splited = item.fileName.split('.');
      const format = splited?.length > 0 ? splited[splited.length - 1] : '';

      if ((format ?? '').toLowerCase() !== 'pdf') {
        this.alertService.warningAlert({
          content: 'Supported only pdf format'
        });
        const unCheck = document.getElementById(
          `attachId_${item.id}`
        ) as HTMLInputElement;
        unCheck.checked = false;
      } else {
        this.checkedAttch.push(item.id);
      }
    } else {
      this.checkedAttch.splice(this.checkedAttch.indexOf(item.id), 1);
    }
  }

  selectedCheck(id: string) {
    this.checkedAttch.push(id);
    this.checkedAttch.forEach((attachment) => {
      const attachBox = document.getElementById(
        `attachId_${attachment}`
      ) as HTMLInputElement;
      attachBox.checked = true;
    });
  }

  /** *************************************open Attachment ************************************ */

  openAttachment(attachmentId: string) {

    if(this.data.type === 'group_payments'){
      this.getGroupPaymentsAttachmentData(attachmentId);
      return;
    }

    this.subscriptions.push(
      this.checkService
        .openCheckAttachment(this.data.checkId, attachmentId)
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

  /** *************************************add Attachment ************************************ */

  addAttachment(file: File) {
    if (this.attachments.length >= 5) {
      this.alertService.warningAlert({
        content: 'Maximum 5 attachments only'
      });
      return;
    }
    if(this.data.type === 'group_payments'){
      this.checkAddGroupPaymentsAttachment( file);
    }else{
      this.checkAddAttachment(file);
    }
  }

  checkAddAttachment( file: File) {
    this.subscriptions.push(
      this.checkService
        .addCheckAttachment(this.data.checkId, file)
        .pipe(
          finalize(() => {
            this.removeSubject.next(true);
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.attachments.push(data.data);
          }
          this.getAttachment(this.data.checkId);
          setTimeout(() => {
            if (this.data.type === 'mail') {
              if (file.name.toLowerCase().endsWith('.pdf')) {
                this.selectedCheck(data.data.id);
              }
            } else {
              this.selectedCheck(data.data.id);
            }
          }, 1000);
        })
    );
  }

  checkAddGroupPaymentsAttachment( file: File) {
    const formData = new FormData();
    formData.append('image', file);
    this.subscriptions.push(
      this.checkService
        .groupMailAddAttachments(this.data.checkId, formData)
        .pipe(
          finalize(() => {
            this.removeSubject.next(true);
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.attachments.push(data.data);
          }
          this.getGroupPaymentsAttachment(this.data.checkId);
          setTimeout(() => {
            if (this.data.type === 'mail') {
              if (file.name.toLowerCase().endsWith('.pdf')) {
                this.selectedCheck(data.data.id);
              }
            } else {
              this.selectedCheck(data.data.id);
            }
          }, 1000);
        })
    );
  }

  /** *******************************************delete Attachment ****************************** */

  deleteAttachment(attachmentId: string) {

    if(this.data.type === 'group_payments'){
      this.deleteGroupPaymentsAttachment(attachmentId);
      return;
    }

    this.disabled = true;
    this.subscriptions.push(
      this.checkService
        .deleteCheckAttachment(this.data.checkId, attachmentId)
        .subscribe((res) => {
          if (res?.success) {
            this.disabled = false;
            this.checkedAttch.splice(
              this.checkedAttch.indexOf(attachmentId),
              1
            );
            this.attachments = this.attachments.filter(
              (ele) => ele.id !== attachmentId
            );
          }
        })
    );
  }


  deleteGroupPaymentsAttachment(attachmentId: string) {
    this.subscriptions.push(
      this.checkService.deleteGroupPaymentsAttachment(attachmentId).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((res) => {
        if(res?.success){
          this.attachments = this.attachments.filter(ele => ele.id !== attachmentId);
        }
      })
    );
  }
  
  getGroupPaymentsAttachmentData(attachmentId: string) {
    this.subscriptions.push(
      this.checkService.getGroupPaymentsAttachment(attachmentId).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe((data) => {
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

  close() {
    const ids: string[] = [];
    let fileName = '';

    // For group_payments, return all attachments instead of only checked ones
    if (this.data.type === 'group_payments') {
      this.attachments.forEach((e) => {
        ids.push(e.id);
        fileName += `${e.fileName} , `;
      });
    } else {
      this.attachments.forEach((e) => {
        if (this.checkedAttch.includes(e.id)) {
          ids.push(e.id);
          fileName += `${e.fileName} , `;
        }
      });
    }

    // If attachements change
    if (!!this.initialAttachments !== !!this.attachments.length) {
      this.dataTableService.setRefreshStatus(true);
    }

    this.dialogRef.close({ checkId: this.data.checkId, ids, fileName });
  }

  checkAll(event: Event) {
    let count = false;
    if ((event?.target as HTMLInputElement)?.checked) {
      for (let i = 0; i < this.attachments.length; i += 1) {
        const splited = this.attachments[i].fileName.split('.');
        const format = splited?.length > 0 ? splited[splited.length - 1] : '';
        if (format.toLowerCase() !== 'pdf') {
          const unCheck = document.getElementById(
            `attachId_${this.attachments[i].id}`
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
            `#attachId_${this.attachments[i].id}`
          ) as HTMLInputElement;
          smsBox.checked = true;
          this.attachments[i].checked = true;
          this.checkedAttch.push(this.attachments[i].id);
        }
      }
    } else {
      this.checkedAttch = [];
      this.attachments.forEach((e, index: number) => {
        const smsBox = document.querySelector(
          `#attachId_${e.id}`
        ) as HTMLInputElement;
        smsBox.checked = false;
        this.attachments[index].checked = false;
      });
    }
  }

  openWarningAlert(content: string): void {
    const data = {
      title: 'Error',
      content
    };
    this.alertService.warningAlert(data);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

// data: {
//   checkId,
//   acceptFormats: '.pdf, .xlsx, .xls, .csv, .docx, .doc, .rtf',
// }
