import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
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
  Upload,
  CircleCheck,
  Info,
  FileText
} from 'lucide-angular';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';

@Component({
  standalone: true,
  selector: 'app-salesforce-import-v4',
  templateUrl: './salesforce-import-v4.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    BankAcDropdownV4Component
  ]
})
export class SalesforceImportV4Component implements OnInit {
  readonly XIcon = X;
  readonly DownloadIcon = Download;
  readonly UploadIcon = Upload;
  readonly CircleCheckIcon = CircleCheck;
  readonly InfoIcon = Info;
  readonly FileTextIcon = FileText;

  private readonly acceptedExtension = '.xlsx';

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private dialogRef = inject(MatDialogRef<SalesforceImportV4Component>);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  currentStep = signal<1 | 2>(1);
  submitting = signal(false);
  loadingSampleFile = signal(false);
  selectedFile = signal<File | null>(null);
  selectedFileName = signal('');
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
      .getSalesForceSampleFile()
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

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const extension = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
    if (extension !== this.acceptedExtension) {
      this.alertService.failedAlert({
        title: 'Error!',
        content:
          'The file format you selected is not supported. Please choose a different file and try again.'
      });
      input.value = '';
      return;
    }
    this.selectedFile.set(file);
    this.selectedFileName.set(file.name);
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.selectedFileName.set('');
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
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
      this.alertService.warningAlert({ content: 'Please select an xlsx file.' });
      return;
    }

    const formData = new FormData();
    formData.append('bankAccount', this.bankAccountId());
    formData.append('file', this.selectedFile() as File);
    formData.append('proceedForCheckNumber', isProceedAnyWay ? '1' : '0');

    this.submitting.set(true);
    this.checkService
      .importSalesForceChecks(formData)
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
          if (err?.error?.errorCode === 190) {
            const ref = this.alertService.confirmAlert({
              title: err.error.errorMsg || 'Confirm',
              content: 'Do you want to proceed anyway?',
              doneMsg: 'OK',
              cancelMsg: 'Cancel'
            });
            ref.afterClosed()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((confirmed) => {
                if (confirmed) this.importChecks(true);
              });
          } else {
            this.alertService.failedAlert({
              content:
                err?.error?.errorMsg ||
                err?.error?.message ||
                'Failed to import checks.'
            });
          }
        }
      });
  }

  viewChecks(): void {
    this.dialogRef.close(true);
    this.router.navigate(['/v4/manage/payments-out/detailed/check']);
  }
}
