import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import {
  Validators,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormBuilder,
  FormsModule
} from '@angular/forms';
import { LucideAngularModule, X, Paperclip, Upload, CircleAlert } from 'lucide-angular';
import { finalize } from 'rxjs';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { UserSupportService } from 'src/app/shared/service/usersupport/user-support.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

interface ISeverityOption {
  label: string;
  value: string;
}

interface ISeverityMeta {
  label: string;
  bgColor: string;
  textColor: string;
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

@Component({
  selector: 'app-v4-add-question-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    V4CommonDropDownSelectorComponent
  ],
  templateUrl: './v4-add-question-modal.component.html',
  styleUrls: ['./v4-add-question-modal.component.scss']
})
export class V4AddQuestionModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<V4AddQuestionModalComponent>);
  private userSupportService = inject(UserSupportService);
  private v4AlertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);

  readonly closeIcon = X;
  readonly paperclipIcon = Paperclip;
  readonly uploadIcon = Upload;
  readonly infoIcon = CircleAlert;

  loading = false;
  fileName = '';
  attachmentIds: string[] = [];
  selectedSeverity = '';
  isDragging = false;

  messageLength = signal(0);

  severityOptions: ISeverityOption[] = [
    { label: 'Low', value: '1' },
    { label: 'Medium', value: '2' },
    { label: 'High', value: '3' }
  ];

  severityConfig: Iv4ngSelectConfig = {
    placeholder: 'Select severity',
    displayField: 'label',
    outputField: 'value'
  };

  private readonly severityMeta: Record<string, ISeverityMeta> = {
    '1': {
      label: 'Low',
      bgColor: 'var(--v4-badge-success-bg-color)',
      textColor: 'var(--v4-badge-success-text-color)'
    },
    '2': {
      label: 'Medium',
      bgColor: 'var(--v4-badge-info-bg-color)',
      textColor: 'var(--v4-badge-info-text-color)'
    },
    '3': {
      label: 'High',
      bgColor: 'var(--v4-badge-error-bg-color)',
      textColor: 'var(--v4-badge-error-text-color)'
    }
  };

  readonly selectedSeverityMeta = computed<ISeverityMeta | null>(() => {
    const value = this.selectedSeverityValue();
    return value ? this.severityMeta[value] ?? null : null;
  });

  private selectedSeverityValue = signal('');

  questionForm: FormGroup<{
    subject: FormControl<string | null>;
    severity: FormControl<string | null>;
    message: FormControl<string | null>;
  }>;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.questionForm = this.fb.group({
      subject: ['', [Validators.required, Validators.maxLength(40)]],
      severity: ['', Validators.required],
      message: [
        '',
        [Validators.required, Validators.maxLength(1000)]
      ]
    });

    this.questionForm.controls.message.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => this.messageLength.set(val?.length ?? 0));
  }

  onSubmit(): void {
    this.questionForm.markAllAsTouched();
    if (this.questionForm.valid) {
      this.save();
    }
  }

  private save(): void {
    const payload = {
      subject: this.questionForm.value.subject || '',
      severity: this.questionForm.value.severity || '',
      message: this.questionForm.value.message || '',
      attachmentIds: this.attachmentIds
    };

    this.loading = true;
    this.userSupportService
      .askQuestion(payload)
      .pipe(
        finalize(() => (this.loading = false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.dialogRef.close(true);
          this.v4AlertService.successAlert({
            content: 'Message Sent'
          });
        }
      });
  }

  uploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.handleFile(input.files[0]);
    input.value = '';
  }

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

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }

  clearAttachment(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.fileName = '';
    this.attachmentIds = [];
  }

  private handleFile(file: File): void {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension)) {
      this.v4AlertService.warningAlert({
        content: 'Only PDF, PNG, JPG, and JPEG files are allowed'
      });
      return;
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      this.v4AlertService.warningAlert({
        content: 'File size must be 10MB or less'
      });
      return;
    }

    this.fileName = file.name;

    const form = new FormData();
    form.append('attachment', file);

    this.userSupportService
      .addAttachments(form)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.attachmentIds = [res.data.id];
          }
        },
        error: () => {
          this.fileName = '';
        }
      });
  }

  onSeverityChange(value: string): void {
    this.questionForm.controls.severity.setValue(value);
    this.questionForm.controls.severity.markAsTouched();
    this.selectedSeverityValue.set(value ?? '');
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
