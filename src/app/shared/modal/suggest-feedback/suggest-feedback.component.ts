import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { finalize, Subscription } from 'rxjs';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { ControlMessageComponent } from '../../components/control-message/control-message/control-message.component';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from '../../v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { AlertService } from '../../service/alert/alert.service';
import { UserSupportService } from '../../service/usersupport/user-support.service';

interface IFeedbackFormGroup {
  description: FormControl<string | null>;
  attachment: FormControl<File | null>;
}

interface IFeedbackForms {
  description: string;
  attachment: File;
}

@Component({
  selector: 'app-suggest-feedback',
  templateUrl: './suggest-feedback.component.html',
  styleUrls: ['./suggest-feedback.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class SuggestFeedbackComponent implements OnInit, OnDestroy {
  @ViewChild('descriptionTextarea')
  descriptionTextarea: ElementRef<HTMLTextAreaElement>;

  private userService = inject(UserSupportService);
  private alertService = inject(AlertService);
  feedbackForm: FormGroup<IFeedbackFormGroup>;
  public dialogRef = inject(MatDialogRef<SuggestFeedbackComponent>);
  subscriptions: Subscription[] = [];
  loading = signal<boolean>(false);
  faXmark = faXmark;
  acceptedFileTypes = [
    '.pdf',
    '.csv',
    '.xlsx',
    '.xls',
    '.docx',
    '.doc',
    '.rtf',
    '.txt',
    '.jpg',
    '.png'
  ];

  ngOnInit(): void {
    this.initFormGroup();
  }

  initFormGroup(): void {
    this.feedbackForm = new FormGroup<IFeedbackFormGroup>({
      description: new FormControl('', [Validators.required]),
      attachment: new FormControl(null)
    });
  }

  /**
   * @description Method to set the input file to the `feedbackForm`.
   * @param event - input event
   */
  uploadInput(files: File): void {
    if (files?.name) {
      this.feedbackForm.controls.attachment.setValue(files);
    } else {
      this.feedbackForm.controls.attachment.setValue(null);
      this.feedbackForm.controls.attachment.markAsTouched();
    }
  }

  getFormData(data: IFeedbackForms): FormData {
    const formData = new FormData();
    formData.append('description', data.description);
    if (data.attachment) {
      formData.append('attachment', data.attachment);
    }
    return formData;
  }

  onSave() {
    this.feedbackForm.markAllAsTouched();
    if (!this.feedbackForm.valid) {
      return;
    }
    const formData = this.getFormData(
      this.feedbackForm.value as IFeedbackForms
    );
    this.loading.set(true);
    this.subscriptions.push(
      this.userService
        .addFeedback(formData)
        .pipe(
          finalize(() => {
            this.loading.set(false);
          })
        )
        .subscribe((data) => {
          if (data?.success) {
            this.alertService.successAlert({
              content: 'Feedback submitted'
            });
            this.close();
          }
        })
    );
  }

  close() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
