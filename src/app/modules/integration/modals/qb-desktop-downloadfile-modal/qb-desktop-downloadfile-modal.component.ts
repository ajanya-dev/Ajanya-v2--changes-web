import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { finalize } from 'rxjs/operators';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { IFileData } from '../../model/integration';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { NgIf } from '@angular/common';

/**
 * Component for downloading and resetting files in QuickBooks Desktop integration.
 */
@Component({
  selector: 'app-qb-desktop-downloadfile-modal',
  templateUrl: './qb-desktop-downloadfile-modal.component.html',
  styleUrls: ['./qb-desktop-downloadfile-modal.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent
  ]
})
export class QBDesktopDownloadfileModalComponent implements OnInit, OnDestroy {
  fileCreationForm: UntypedFormGroup;
  loading: boolean;
  subscriptions: Subscription[] = [];

  constructor(
    private integrationService: IntegrationService,
    private dialogueRef: MatDialogRef<QBDesktopDownloadfileModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public dialogueData: { mode: string; fileDetails: IFileData }
  ) {}

  /**
   * Initializes the component and the form.
   */
  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initializes the form with form controls and optionally disables the file name field in edit mode.
   */
  initializeForm() {
    this.fileCreationForm = new UntypedFormGroup({
      fileName: new UntypedFormControl('', [Validators.required]),
      password1: new UntypedFormControl('', [Validators.required]),
      password2: new UntypedFormControl('', [Validators.required])
    });
    if (this.dialogueData?.mode == 'edit') {
      this.fileCreationForm.controls.fileName.setValue(
        this.dialogueData?.fileDetails?.nick_name
      );
      this.fileCreationForm.controls.fileName.disable();
    }
  }

  /**
   * Handles the download button click event.
   * If the form is valid, it sends a request to download the file with provided data.
   */
  onDownloadClicked() {
    if (this.fileCreationForm.invalid) {
      this.fileCreationForm.markAllAsTouched();
    } else {
      const data = new FormData();
      data.append('file_name', this.fileCreationForm.controls.fileName.value);
      data.append('password', this.fileCreationForm.controls.password1.value);
      data.append(
        'confirm_password',
        this.fileCreationForm.controls.password2.value
      );
      this.loading = true;
      this.subscriptions.push(
        this.integrationService
          .downloadWebConnectorFile(data)
          .pipe(
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.downloadURI(res.data);
              this.dialogueRef.close(true);
            }
          })
      );
    }
  }

  /**
   * Downloads a file from the provided URI.
   * @param uri The URI of the file to download.
   */
  downloadURI(uri: string) {
    const link = document.createElement('a');
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Handles the reset button click event.
   * If the form is valid, it sends a request to reset the password of the QuickBooks Desktop file.
   */
  onResetClicked() {
    if (this.fileCreationForm.valid) {
      this.loading = true;
      const sendingData = new FormData();
      sendingData.append('file_id', this.dialogueData?.fileDetails?.id);
      sendingData.append(
        'new_password',
        this.fileCreationForm.controls.password1.value
      );
      sendingData.append(
        'confirm_password',
        this.fileCreationForm.controls.password2.value
      );
      this.subscriptions.push(
        this.integrationService
          .resetPasswordOfQBDFile(sendingData)
          .pipe(
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.dialogueRef.close(true);
            }
          })
      );
    } else {
      this.fileCreationForm.markAllAsTouched();
    }
  }

  /**
   * Cleans up resources when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
