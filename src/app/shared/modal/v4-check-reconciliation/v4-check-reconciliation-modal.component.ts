import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, X, ChevronLeft, Download, ChevronRight } from 'lucide-angular';
import { finalize } from 'rxjs';
import { IReconciliationData } from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { CommonUploadButtonV4Component } from 'src/app/shared/V4/buttons/common-upload-button-v4/common-upload-button-v4.component';
import { V4CheckReconciliationStep2Component } from './v4-check-reconciliation-step2/v4-check-reconciliation-step2.component';
import { V4CheckReconciliationStep3Component } from './v4-check-reconciliation-step3/v4-check-reconciliation-step3.component';

@Component({
  selector: 'app-v4-check-reconciliation-modal',
  standalone: true,
  templateUrl: './v4-check-reconciliation-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    V4ControlMessageComponent,
    BankAcDropdownV4Component,
    CommonUploadButtonV4Component,
    V4CheckReconciliationStep2Component,
    V4CheckReconciliationStep3Component
  ]
})
export class V4CheckReconciliationModalComponent implements OnInit {
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private dialogRef = inject(MatDialogRef<V4CheckReconciliationModalComponent>);
  private destroyRef = inject(DestroyRef);

  readonly XIcon = X;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly ChevronRightIcon = ChevronRight;
  readonly DownloadIcon = Download;

  currentStep = signal<1 | 2 | 3>(1);
  step2Data = signal<IReconciliationData | null>(null);
  isSampleFileLoading = signal(false);
  isSubmit = signal(false);
  sampleFileUrl = '';

  selectedBank = new FormControl();

  importForm = new FormGroup({
    bankAccount: new FormControl<string | null>(null, Validators.required),
    file: new FormControl<File | null>(null, Validators.required)
  });

  ngOnInit(): void {
    this.getSampleFile();
    this.getSelectedBank();
  }

  private getSelectedBank(): void {
    this.selectedBank.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.importForm.controls.bankAccount.setValue(res?.id ?? null);
          this.importForm.controls.bankAccount.markAllAsTouched();
        }
      });
  }

  private getSampleFile(): void {
    this.isSampleFileLoading.set(true);
    this.checkService
      .getReconciliationSampleFile()
      .pipe(
        finalize(() => this.isSampleFileLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.sampleFileUrl = res.data.sampleFileUrl;
        }
      });
  }

  onRemoveBank(): void {
    this.importForm.controls.bankAccount.setValue(null);
    this.importForm.controls.bankAccount.markAllAsTouched();
  }

  onFileSelect(file: File): void {
    if (file?.name) {
      this.importForm.controls.file.setValue(file);
    } else {
      this.importForm.controls.file.setValue(null);
      this.importForm.controls.file.markAsTouched();
    }
  }

  downloadSample(): void {
    if (this.sampleFileUrl) {
      window.location.href = this.sampleFileUrl;
    }
  }

  submit(): void {
    this.importForm.markAllAsTouched();
    if (!this.importForm.valid) return;

    const { bankAccount, file } = this.importForm.value;
    const formData = new FormData();
    formData.append('bankAccount', bankAccount as string);
    formData.append('excelFile', file as File);

    this.isSubmit.set(true);
    this.checkService
      .importReconciliationFile(formData)
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.step2Data.set(res.data);
          this.dialogRef.updateSize('900px', '');
          this.currentStep.set(2);
        }
      });
  }

  goToStep1(): void {
    this.dialogRef.updateSize('700px', '');
    this.currentStep.set(1);
  }

  goToStep2(): void {
    this.currentStep.set(2);
  }

  goToStep3(): void {
    this.currentStep.set(3);
  }

  onComplete(message: string): void {
    this.alertService.successAlert({ content: message });
    this.dialogRef.close({ success: true });
  }

  close(): void {
    this.dialogRef.close();
  }
}
