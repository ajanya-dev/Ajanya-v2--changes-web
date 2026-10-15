import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import { finalize } from 'rxjs';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { UserSupportService } from 'src/app/shared/service/usersupport/user-support.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { LoomService } from 'src/app/modules/loom-video/loom/service/loom.service';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';

@Component({
  selector: 'app-feature-request-modal-v4',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    V4ControlMessageComponent,
    TruncatePipe
  ],
  templateUrl: './feature-request-modal-v4.component.html',
  styleUrls: ['./feature-request-modal-v4.component.scss']
})
export class FeatureRequestModalV4Component implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<FeatureRequestModalV4Component>);
  private userSupportService = inject(UserSupportService);
  private v4AlertService = inject(V4AlertService);
  public loomService = inject(LoomService);
  private destroyRef = inject(DestroyRef);
  private data: { formData?: { description: string; attachment: string[] } } =
    inject(MAT_DIALOG_DATA);

  readonly closeIcon = X;

  loading = false;
  btnDisable = false;
  fileName = '';
  buttonId = 'loom-record-sdk-button-v4';

  featureForm: FormGroup<{
    description: FormControl<string | null>;
    attachment: FormControl<File | string | null>;
  }>;

  ngOnInit(): void {
    this.initForm();
    this.patchForm();
  }

  private initForm(): void {
    this.featureForm = this.fb.group({
      description: ['', [Validators.required, Validators.maxLength(240)]],
      attachment: [null as File | string | null]
    });
  }

  private patchForm(): void {
    if (this.data?.formData) {
      this.featureForm.patchValue({
        description: this.data.formData.description
      });
    }
  }

  onSubmit(): void {
    this.featureForm.markAllAsTouched();
    if (this.featureForm.valid) {
      this.save();
    }
  }

  private save(): void {
    const formData = new FormData();
    const values = this.featureForm.value;
    formData.append('description', values.description || '');
    if (values.attachment) {
      formData.append('attachment', values.attachment);
    }
    if (this.loomService.loomVideos?.length) {
      this.loomService.loomVideos.forEach((video) => {
        formData.append('links[]', video);
      });
    }

    this.loading = true;
    this.userSupportService
      .featureRequest(formData)
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.dialogRef.close(true);
          this.v4AlertService.successAlert({
            content: 'Your request has been sent'
          });
        }
      });
  }

  uploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.fileName = file.name;
    this.featureForm.controls.attachment.setValue(file);
  }

  openLoom(): void {
    const values = this.featureForm.value;
    this.loomService.formData = {
      description: values.description ? [values.description] : undefined,
      attachment: undefined
    };
    this.loomService.buttonId = this.buttonId;
    this.loomService.takeLoom({
      component: FeatureRequestModalV4Component,
      config: {
        maxWidth: '510px',
        width: '93%',
        panelClass: 'paddingless-modal-rounded'
      },
      data: { formData: values }
    });
  }

  removeVideo(video: string): void {
    this.loomService.removeVideo(video);
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
