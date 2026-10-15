import { finalize } from 'rxjs/operators';
import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { IRequestedDocsDetails } from 'src/app/models/docs';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { V35ControlMessageComponent } from '../../v3/control-message-v35/control-message-v35.component';
import { DocsUploadService } from '../../service/docs-upload/docs-upload.service';
import { AlertService } from '../../service/alert/alert.service';
import { CommonUploadButtonV35Component } from '../../v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';

/**
 * @description Component for uploading the requested documents by super admin
 */
@Component({
  selector: 'app-user-docs-upload-modal',
  templateUrl: './user-docs-upload-modal.component.html',
  styleUrls: ['./user-docs-upload-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    CommonUploadButtonV35Component,
    CommonButtonV35Component,
    V35ControlMessageComponent,
    FontAwesomeModule
  ]
})
export class UserDocsUploadModalComponent implements OnInit {
  private dialogData = inject(MAT_DIALOG_DATA);
  private docsUploadService = inject(DocsUploadService);
  private dialogRef = inject(MatDialogRef);
  private fb = inject(FormBuilder);
  private alertService = inject(AlertService);

  requestedAttachment: IRequestedDocsDetails;
  requiredAttachment: { [key: string]: File | undefined } = {};
  attachmentForm: FormGroup;
  loading = false;
  docsListLoading = false;

  ngOnInit(): void {
    this.getDocsDetails();
  }

  /**
   * @description Get the details of documents which requested by super admin
   */
  getDocsDetails() {
    this.docsListLoading = true;
    this.docsUploadService
      .getRequestedDocsDetails(
        this.dialogData.notification.attachment_data_uu_id,
        this.dialogData.notification.encrypted_user_id
      )
      .pipe(
        finalize(() => {
          this.docsListLoading = false;
        })
      )
      .subscribe((res) => {
        this.requestedAttachment = res.data;
        if (res.data) {
          const attachment = Object.keys(res.data.document_type);
          this.attachmentForm = this.fb.group({});
          attachment.forEach((item: string) => {
            this.requiredAttachment[item] = undefined;
            this.attachmentForm.addControl(
              item,
              new FormControl(undefined, Validators.required)
            );
          });
        }
      });
  }

  /**
   * @description Calls when a file is choosen.
   * @param event Event on file choose
   * @param field Name of the field for adding file
   * @returns
   */
  filePicked(event: File, field: string) {
    if (field === '') return;
    if (event.name) {
      this.requiredAttachment[field] = event;
      this.attachmentForm.controls[field].setValue(event.name);
      this.attachmentForm.controls[field].markAsTouched();
    }
  }

  /**
   * @description Checks wheather the fields is selected and upload wheather it is selected
   * else @returns
   */
  submit() {
    if (this.attachmentForm.invalid) {
      this.attachmentForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const formBody = this.createDocumentsFormData();
    this.docsUploadService
      .uploadRequestedDocuments(formBody)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        if (res) {
          const data = { content: 'Documents uploaded successfully' };
          const successAlert = this.alertService.successAlert(data);
          successAlert.afterClosed().subscribe(() => {
            this.dialogRef.close({ success: true });
          });
        }
      });
  }

  /**
   * @description Converts the files and fields for uploading to FormData
   * @returns formData
   */
  createDocumentsFormData() {
    const formData = new FormData();
    Object.keys(this.requiredAttachment).forEach((key) => {
      const value = this.requiredAttachment[key];
      if (value) {
        formData.append(`upload_file[${key}]`, value);
      }
    });
    formData.append('user_id', this.dialogData.notification.encrypted_user_id);
    formData.append('uuid', this.dialogData.notification.attachment_data_uu_id);
    formData.append('notification_id', this.dialogData.id);
    return formData;
  }
}
