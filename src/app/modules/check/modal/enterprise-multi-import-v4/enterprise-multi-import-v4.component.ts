import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialog, MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { VerificationRequiredModalComponent } from 'src/app/shared/modal/verification-required-modal/verification-required-modal.component';
import {
  LucideAngularModule,
  X,
  CircleCheck,
  ChevronRight
} from 'lucide-angular';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonUploadButtonV4Component } from 'src/app/shared/V4/buttons/common-upload-button-v4/common-upload-button-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';

@Component({
  standalone: true,
  selector: 'app-enterprise-multi-import-v4',
  templateUrl: './enterprise-multi-import-v4.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    CommonUploadButtonV4Component,
    BankAcDropdownV4Component
  ]
})
export class EnterpriseMultiImportV4Component implements OnInit {
  readonly XIcon = X;
  readonly CircleCheckIcon = CircleCheck;
  readonly ChevronRightIcon = ChevronRight;

  private dialogRef = inject(MatDialogRef<EnterpriseMultiImportV4Component>);
  private dialog = inject(MatDialog);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private localStorageService = inject(LocalStorageService);
  private destroyRef = inject(DestroyRef);

  currentStep = signal<1 | 2>(1);
  submitting = signal(false);
  selectedFile = signal<File | null>(null);
  selectedFileName = signal('');
  bankAccountId = signal('');

  selectedBankControl = new FormControl<{ id: string } | null>(null);

  ngOnInit(): void {
    this.selectedBankControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bank) => {
        this.bankAccountId.set(bank?.id ?? '');
      });
  }

  onFileSelected(file: File): void {
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

  importChecks(): void {
    if (!this.bankAccountId()) {
      this.alertService.warningAlert({ content: 'Please select a bank account.' });
      return;
    }
    if (!this.selectedFile()) {
      this.alertService.warningAlert({ content: 'Please select a .txt file.' });
      return;
    }

    const phoneVerified = this.localStorageService.getItem('phoneVerified');
    const emailVerified = this.localStorageService.getItem('emailVerified');
    if (phoneVerified === 0 || emailVerified === 0) {
      this.dialog.open(VerificationRequiredModalComponent, {
        width: '400px',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: { description: 'You need to verify your email and phone number to import checks.' }
      });
      return;
    }

    const formData = new FormData();
    formData.append('bankAccount', this.bankAccountId());
    formData.append('file', this.selectedFile() as File);

    this.submitting.set(true);
    this.checkService
      .enterpriseMultiImport(formData)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.currentStep.set(2);
          }
        },
        error: (err) => {
          this.alertService.failedAlert({
            content: err?.error?.message || err?.error?.errorMsg || 'Failed to import checks.'
          });
        }
      });
  }

  viewChecks(): void {
    this.dialogRef.close(true);
  }
}
