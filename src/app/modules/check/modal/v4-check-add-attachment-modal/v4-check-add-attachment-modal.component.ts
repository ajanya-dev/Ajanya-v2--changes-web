import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject, Subscription, finalize } from 'rxjs';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule,
  X,
  Upload,
  Trash2,
  ExternalLink
} from 'lucide-angular';

import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICheckAttachmentData } from '../../model/check';

@Component({
  selector: 'app-v4-check-add-attachment-modal',
  templateUrl: './v4-check-add-attachment-modal.component.html',
  styleUrls: ['./v4-check-add-attachment-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgClass,
    LucideAngularModule,
    CommonButtonV4Component,
    MatTooltipModule
  ]
})
export class V4CheckAddAttachmentModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];

  files: File[] = [];
  isLoading = true;
  invalid = false;
  disabled = false;
  submitting = false;
  attachments: ICheckAttachmentData[] = [];
  initialAttachments = 0;
  acceptFormats = '';
  checkedAttch: string[] = [];
  removeSubject = new Subject();
  validateFileSize = false;

  // Drag-drop state
  isDragging = false;
  selectedFileName = '';
  private fileInput: HTMLInputElement;

  // Lucide icons
  readonly XIcon = X;
  readonly UploadIcon = Upload;
  readonly Trash2Icon = Trash2;
  readonly ExternalLinkIcon = ExternalLink;

  public data = inject(MAT_DIALOG_DATA);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<V4CheckAddAttachmentModalComponent>);
  private dataTableService = inject(DataTableService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.acceptFormats = this.data.acceptFormats;
    this.validateFileSize = !!this.data?.validateFileSize;
    if (this.data.type === 'group_payments') {
      this.getGroupPaymentsAttachment(this.data.checkId);
    } else {
      this.getAttachment(this.data.checkId);
    }
  }

  get currentAcceptedFormat(): string {
    return this.acceptFormats || '.pdf';
  }

  // --- Drag-and-drop ---

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  triggerFileInput(): void {
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = this.currentAcceptedFormat;
      this.fileInput.addEventListener('change', (e) =>
        this.onFileInputChange(e)
      );
    }
    this.fileInput.accept = this.currentAcceptedFormat;
    this.fileInput.click();
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
      input.value = '';
    }
  }

  handleFileSelection(file: File): void {
    // Check file size limit (10MB) only when enabled by config or in group_payments mode
    if (this.validateFileSize || this.data.type === 'group_payments') {
      const maxFileSizeInBytes = 10 * 1024 * 1024;
      if (file.size > maxFileSizeInBytes) {
        this.alertService.warningAlert({
          content: 'Maximum file size is 10MB. Please select a smaller file.'
        });
        return;
      }
    }

    this.selectedFileName = file.name;
    this.files = [file];
    this.addAttachment(file);
  }

  // --- Attachments CRUD ---

  getAttachment(checkId: string) {
    this.subscriptions.push(
      this.checkService.getCheckAttachment(checkId).subscribe((res) => {
        if (res?.success) {
          this.attachments = res.data;
          this.initialAttachments = res.data?.length;
          setTimeout(() => {
            this.checked();
            this.isLoading = false;
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
            this.isLoading = false;
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
        if (attachBox) {
          attachBox.checked = true;
          if (this.data.type === 'group_payments') {
            attachBox.disabled = true;
          }
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
      if (attachBox) {
        attachBox.checked = true;
      }
    });
  }

  openAttachment(attachmentId: string) {
    if (this.data.type === 'group_payments') {
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

  addAttachment(file: File) {
    if (this.attachments.length >= 5) {
      this.alertService.warningAlert({
        content: 'Maximum 5 attachments only'
      });
      return;
    }
    if (this.data.type === 'group_payments') {
      this.checkAddGroupPaymentsAttachment(file);
    } else {
      this.checkAddAttachment(file);
    }
  }

  checkAddAttachment(file: File) {
    this.submitting = true;
    this.subscriptions.push(
      this.checkService
        .addCheckAttachment(this.data.checkId, file)
        .pipe(
          finalize(() => {
            this.submitting = false;
            this.selectedFileName = '';
            this.files = [];
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

  checkAddGroupPaymentsAttachment(file: File) {
    const formData = new FormData();
    formData.append('image', file);
    this.submitting = true;
    this.subscriptions.push(
      this.checkService
        .groupMailAddAttachments(this.data.checkId, formData)
        .pipe(
          finalize(() => {
            this.submitting = false;
            this.selectedFileName = '';
            this.files = [];
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

  deleteAttachment(attachmentId: string) {
    if (this.data.type === 'group_payments') {
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
      this.checkService
        .deleteGroupPaymentsAttachment(attachmentId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.success) {
            this.attachments = this.attachments.filter(
              (ele) => ele.id !== attachmentId
            );
          }
        })
    );
  }

  getGroupPaymentsAttachmentData(attachmentId: string) {
    this.subscriptions.push(
      this.checkService
        .getGroupPaymentsAttachment(attachmentId)
        .pipe(takeUntilDestroyed(this.destroyRef))
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

  close() {
    const ids: string[] = [];
    let fileName = '';

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
          if (unCheck) unCheck.checked = false;
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
          if (smsBox) {
            smsBox.checked = true;
            this.attachments[i].checked = true;
          }
          this.checkedAttch.push(this.attachments[i].id);
        }
      }
    } else {
      this.checkedAttch = [];
      this.attachments.forEach((e, index: number) => {
        const smsBox = document.querySelector(
          `#attachId_${e.id}`
        ) as HTMLInputElement;
        if (smsBox) {
          smsBox.checked = false;
          this.attachments[index].checked = false;
        }
      });
    }
  }

  openWarningAlert(content: string): void {
    this.alertService.warningAlert({ content });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
