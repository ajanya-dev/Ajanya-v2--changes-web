import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import {
  ChevronRight,
  Download,
  FileSpreadsheet,
  LucideAngularModule,
  X
} from 'lucide-angular';

import { IBankDropdown } from 'src/app/models/bank';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';

interface IBeazleyImportForm {
  bankAccount: FormControl<string | null>;
  file: FormControl<File | null>;
}

@Component({
  standalone: true,
  selector: 'app-beazley-import-v4',
  templateUrl: './beazley-import-v4.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    BankAcDropdownV4Component,
    CommonButtonV4Component,
    V4ControlMessageComponent
  ]
})
export class BeazleyImportV4Component implements OnInit {
  readonly XIcon = X;
  readonly DownloadIcon = Download;
  readonly ChevronRightIcon = ChevronRight;
  readonly FileSpreadsheetIcon = FileSpreadsheet;

  private dialogRef = inject(MatDialogRef<BeazleyImportV4Component>);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);

  submitting = signal(false);
  loadingSampleFile = signal(false);
  sampleFileUrl = signal('');
  fileName = signal('');

  selectedBankControl = new FormControl<IBankDropdown | null>(null);

  importForm: FormGroup<IBeazleyImportForm> = this.fb.group<IBeazleyImportForm>({
    bankAccount: this.fb.control<string | null>(null, Validators.required),
    file: this.fb.control<File | null>(null, Validators.required)
  });

  ngOnInit(): void {
    this.fetchSampleFile();
    this.selectedBankControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bank) => {
        this.importForm.controls.bankAccount.setValue(bank?.id ?? null);
      });
  }

  private fetchSampleFile(): void {
    this.loadingSampleFile.set(true);
    this.checkService
      .getBeazleySampleFile()
      .pipe(
        finalize(() => this.loadingSampleFile.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.sampleFileUrl.set(res.data.sampleFileUrl);
        }
      });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.lis')) {
      this.alertService.failedAlert({
        content: 'Only .lis files are supported.'
      });
      input.value = '';
      return;
    }

    this.fileName.set(file.name);
    this.importForm.controls.file.setValue(file);
    this.importForm.controls.file.markAsTouched();
  }

  clearFile(fileInput: HTMLInputElement): void {
    this.fileName.set('');
    this.importForm.controls.file.setValue(null);
    fileInput.value = '';
  }

  onClearBank(): void {
    this.importForm.controls.bankAccount.setValue(null);
  }

  submit(): void {
    this.importForm.markAllAsTouched();
    if (this.importForm.invalid) return;

    const formData = new FormData();
    formData.append('file', this.importForm.controls.file.value as File);
    formData.append(
      'bankAccount',
      this.importForm.controls.bankAccount.value as string
    );

    this.submitting.set(true);
    this.checkService
      .importBeazleyChecks(formData)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dialogRef.close({ success: true });
          } else {
            this.alertService.failedAlert({
              content: res.message || 'Failed to import checks.'
            });
          }
        },
        error: (err) => {
          this.alertService.failedAlert({
            content:
              err?.error?.message ||
              err?.error?.errorMsg ||
              'Failed to import checks.'
          });
        }
      });
  }
}
