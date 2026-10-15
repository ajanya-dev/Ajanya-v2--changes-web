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
import { Router } from '@angular/router';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import {
  LucideAngularModule,
  X,
  Download,
  CircleCheck,
  ChevronRight
} from 'lucide-angular';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { CommonUploadButtonV4Component } from 'src/app/shared/V4/buttons/common-upload-button-v4/common-upload-button-v4.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';

@Component({
  standalone: true,
  selector: 'app-spectrum-import-v4',
  templateUrl: './spectrum-import-v4.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    BankAcDropdownV4Component,
    CommonUploadButtonV4Component
  ]
})
export class SpectrumImportV4Component implements OnInit {
  readonly XIcon = X;
  readonly DownloadIcon = Download;
  readonly CircleCheckIcon = CircleCheck;
  readonly ChevronRightIcon = ChevronRight;

  private dialogRef = inject(MatDialogRef<SpectrumImportV4Component>);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private v3DataTableService = inject(V3DataTableService);

  currentStep = signal<1 | 2>(1);
  submitting = signal(false);
  loadingSampleFile = signal(false);
  selectedFile = signal<File | null>(null);
  sampleFileUrl = signal<string>('');
  bankAccountId = signal<string>('');

  // Needed only for the bank dropdown CVA binding
  selectedBankControl = new FormControl<{ id: string } | null>(null);

  ngOnInit(): void {
    this.fetchSampleFile();
    this.selectedBankControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((bank) => {
        this.bankAccountId.set(bank?.id ?? '');
      });
  }

  private fetchSampleFile(): void {
    this.loadingSampleFile.set(true);
    this.checkService
      .getSpectrumSampleFile()
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

  onFileSelected(file: File): void {
    this.selectedFile.set(file);
  }

  onClearBank(): void {
    this.bankAccountId.set('');
  }

  importChecks(isProceedAnyWay = false): void {
    if (!this.bankAccountId()) {
      this.alertService.warningAlert({ content: 'Please select a bank account.' });
      return;
    }
    if (!this.selectedFile()) {
      this.alertService.warningAlert({ content: 'Please select a CSV file.' });
      return;
    }

    const formData = new FormData();
    formData.append('bankAccount', this.bankAccountId());
    formData.append('file', this.selectedFile() as File);
    formData.append('proceedForCheckNumber', isProceedAnyWay ? '1' : '0');

    this.submitting.set(true);
    this.checkService
      .importSpectrumChecks(formData)
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
          if (err?.error?.errorCode === 191) {
            const ref = this.alertService.confirmAlert({
              title: 'Check Number Conflict',
              content: this.formatValidationErrors(err.error.errorMsg),
              doneMsg: 'Proceed Anyway',
              cancelMsg: 'Cancel'
            });
            ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
              if (confirmed) this.importChecks(true);
            });
          } else {
            this.alertService.failedAlert({
              content: err?.error?.errorMsg || err?.error?.message || 'Failed to import checks.'
            });
          }
        }
      });
  }

  private formatValidationErrors(errors: any[]): string {
    return errors
      .map((e) => {
        const messages = Object.values(e.validationError).join(', ');
        return `Row ${e.row_number}: ${messages}`;
      })
      .join('\n');
  }

  viewChecks(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.dialogRef.close(true);
    this.router.navigate(['/v4/manage/payments-out/detailed/check']);
  }
}
