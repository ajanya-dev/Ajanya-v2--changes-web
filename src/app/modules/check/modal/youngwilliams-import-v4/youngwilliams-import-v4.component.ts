import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import {
  LucideAngularModule,
  X,
  ChevronRight
} from 'lucide-angular';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonUploadButtonV4Component } from 'src/app/shared/V4/buttons/common-upload-button-v4/common-upload-button-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { YoungwilliamsImportStep2V4Component } from './youngwilliams-import-step2-v4/youngwilliams-import-step2-v4.component';

@Component({
  standalone: true,
  selector: 'app-youngwilliams-import-v4',
  templateUrl: './youngwilliams-import-v4.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    CommonUploadButtonV4Component,
    BankAcDropdownV4Component,
    V4CommonDropDownSelectorComponent,
    YoungwilliamsImportStep2V4Component
  ]
})
export class YoungwilliamsImportV4Component {
  readonly XIcon = X;
  readonly ChevronRightIcon = ChevronRight;

  private dialogRef = inject(MatDialogRef<YoungwilliamsImportV4Component>);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  currentStep = signal<1 | 2>(1);
  submitting = signal(false);
  selectedFile = signal<File | null>(null);
  selectedFileName = signal('');
  bankAccountId = signal('');
  importType = signal('1');

  selectedBankControl = new FormControl<{ id: string } | null>(null);

  importTypes = [
    { value: '1', label: 'NIVD' },
    { value: '2', label: 'IVD' }
  ];

  constructor() {
    this.selectedBankControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bank) => {
        this.bankAccountId.set(bank?.id ?? '');
      });
  }

  onFileSelected(file: File): void {
    if (!file?.name) {
      this.selectedFile.set(null);
      this.selectedFileName.set('');
      return;
    }
    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);
  }

  onFileRemoved(): void {
    this.selectedFile.set(null);
    this.selectedFileName.set('');
  }

  onClearBank(): void {
    this.bankAccountId.set('');
    this.selectedBankControl.setValue(null);
  }

  onTypeChange(value: string): void {
    this.importType.set(value);
  }

  importChecks(): void {
    if (!this.bankAccountId()) {
      this.alertService.warningAlert({ content: 'Please select a bank account.' });
      return;
    }
    if (!this.selectedFile()?.name) {
      this.alertService.warningAlert({ content: 'Please select a .txt file.' });
      return;
    }

    const formData = new FormData();
    formData.append('bankAccount', this.bankAccountId());
    formData.append('type', this.importType());
    formData.append('file', this.selectedFile() as File);

    this.submitting.set(true);
    this.checkService
      .multiImportTxtToCheckstep1(formData)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.currentStep.set(2);
            this.dialogRef.addPanelClass('yw-step2-expanded');
            this.dialogRef.updateSize('95vw', '');
          }
        }
      });
  }

  onStep2Cancel(): void {
    this.currentStep.set(1);
    this.dialogRef.removePanelClass('yw-step2-expanded');
    this.dialogRef.updateSize('560px', '');
  }

  onStep2Submit(): void {
    this.dialogRef.close({ success: true });
  }

  goToJobsReport(): void {
    this.dialogRef.close(false);
    this.router.navigate(['/v4/manage/more/report/custom-jobs']);
  }
}
