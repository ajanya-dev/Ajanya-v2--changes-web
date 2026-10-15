import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ElementRef,
  ViewChild
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { UserSupportService } from 'src/app/shared/service/usersupport/user-support.service';
import { LoomService } from 'src/app/modules/loom-video/loom/service/loom.service';
import { TruncatePipe } from '../../../pipes/truncate.pipe';
import { CommonUploadButtonV35Component } from '../../v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';
import { ControlMessageComponent } from '../../components/control-message/control-message/control-message.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

/**
 * @description Modal component for requesting features.
 */
@Component({
  selector: 'app-feature-request-modal',
  templateUrl: './feature-request-modal.component.html',
  styleUrls: ['./feature-request-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    FaIconComponent,
    ControlMessageComponent,
    CommonButtonV35Component,
    CommonUploadButtonV35Component,
    TruncatePipe
  ]
})
export class FeatureRequestModalComponent implements OnInit, OnDestroy {
  private data: { formData: { description: string; attachment: string[] } } =
    inject(MAT_DIALOG_DATA);
  @ViewChild('descriptionTextarea')
  descriptionTextarea: ElementRef<HTMLTextAreaElement>;
  private fb = inject(UntypedFormBuilder);
  private userSupportService = inject(UserSupportService);
  private alertService = inject(AlertService);
  public dialogRef = inject(MatDialogRef<FeatureRequestModalComponent>);
  public loomService = inject(LoomService);

  loomVideos: string[] = [];

  buttonId = 'loom-record-sdk-button';

  featureForm: UntypedFormGroup;
  loading = false;
  subscriptions: Subscription[] = [];
  form: FormData;
  isRefresh = false;
  btnId: string = '';
  attachment: string[];

  ngOnInit() {
    this.initFormGroup();
    this.patchForm();
  }

  patchForm() {
    if (this.data) {
      this.featureForm.patchValue({
        description: this.data.formData?.description,
        attachment: this.data.formData?.attachment
      });
      this.attachment = this.data.formData?.attachment;
    }
  }

  removeVideo(video: string) {
    const data = { content: 'Are you sure you want to delete?' };
    const alert = this.alertService.confirmAlert(data);
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.loomService.removeVideo(video);
        this.alertService.successAlert({ content: 'Successfully Deleted' });
      }
    });
  }

  /**
   * @description Initializes feature form.
   */
  initFormGroup() {
    this.featureForm = this.fb.group({
      description: new UntypedFormControl('', [Validators.required]),
      attachment: ['']
    });
  }

  /**
   * @description Method to set the input file to the `featureForm`.
   * @param event - input event
   */
  uploadInput(file: File): void {
    if (!file) {
      this.featureForm.controls.attachment.setValue(null);
      return;
    }
    this.form = new FormData();
    if (file) {
      this.featureForm.controls.attachment.setValue(file);
    }
  }

  /**
   * @description Method invoked when submit is clicked.
   * Creates payload and posts it to the `featureRequest` method of `this.userSupportService`.
   */
  onSave() {
    if (this.featureForm.invalid) {
      this.featureForm.markAllAsTouched();
      return;
    }

    if (!this.featureForm.invalid) {
      const formData = new FormData();
      const featureFormValues = this.featureForm.value;
      formData?.append('description', featureFormValues.description);
      if (
        featureFormValues?.attachment !== '' ||
        featureFormValues?.attachment !== null
      ) {
        formData?.append('attachment', featureFormValues.attachment);
      }
      if (this.loomService.loomVideos) {
        this.loomService.loomVideos.forEach((video) => {
          formData.append('links[]', video);
        });
      }
      this.loading = true;
      this.subscriptions.push(
        this.userSupportService.featureRequest(formData).subscribe((res) => {
          this.loading = false;
          if (res.success) {
            this.dialogRef.close();
            this.alertService.successAlert({
              content: 'Your request has been sent'
            });
          }
        })
      );
    }
  }

  /**
   * Sets `this.isRefresh` to false.
   */
  closeFeatureRequestModal() {
    this.isRefresh = false;
  }

  openLoom() {
    const featureFormValues = this.featureForm.value;
    this.loomService.formData = featureFormValues;
    this.loomService.buttonId = this.buttonId;
    this.loomService.takeLoom();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
