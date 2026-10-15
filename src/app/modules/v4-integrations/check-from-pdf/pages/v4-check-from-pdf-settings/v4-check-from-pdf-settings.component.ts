import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { VerificationMessageService } from 'src/app/shared/service/auth/verification-message.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { IBankDropdown } from 'src/app/models/bank';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import {
  IPayrollCheckValidateData,
  IPayrollCheckValidateRes
} from 'src/app/modules/integration/model/integration';

@Component({
  selector: 'app-v4-check-from-pdf-settings',
  templateUrl: './v4-check-from-pdf-settings.component.html',
  styleUrls: ['./v4-check-from-pdf-settings.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonButtonV4Component,
    BankAcDropdownV4Component,
    V4ControlMessageComponent
  ]
})
export class V4CheckFromPdfSettingsComponent implements OnInit {
  private integrationService = inject(IntegrationService);
  private localStorageService = inject(LocalStorageService);
  private verificationMessageService = inject(VerificationMessageService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private destroyRef = inject(DestroyRef);

  /** When true, operates in TrustBooks mode: hides payroll type, auto-sets to '5', uses different feature code, adds Save button */
  isTrustBooks = false;

  /** Payroll types whose created checks can be paid straight from the success screen. */
  private readonly PAYABLE_PAYROLL_TYPES: ReadonlySet<string> = new Set([
    '2',
    '5'
  ]);

  /** Bills & Invoices ('6') uses a different flow — no PDF upload / print. */
  get isBillsAndInvoices(): boolean {
    return this.payrollsCheck.value.payrollType === '6';
  }

  /** QuickBooks Online Payroll ('2') and Trustbooks Payroll ('5') create payable check payments. */
  get canPayCreatedCheck(): boolean {
    return this.PAYABLE_PAYROLL_TYPES.has(
      this.payrollsCheck.value.payrollType ?? ''
    );
  }

  @ViewChild('bankAcDropDown')
  bankAcDropDownComponent!: BankAcDropdownV4Component;

  private readonly MAX_FILE_SIZE_MB = 50;

  uploadedFile: File = {} as File;
  selectedBankId = '';
  fileLink: SafeResourceUrl = '';
  fileLinkRaw = '';
  isDragOver = false;

  costPreview: IPayrollCheckValidateData | null = null;
  pendingPathName: string | null = null;
  insufficientBalance = false;
  insufficientBalanceError: string | null = null;
  displayTotalPages = 0;
  displayTotalCost = 0;

  loading = signal({
    processing: false,
    createCheck: false,
    saveCheck: false
  });

  payrollType = [
    { value: '1', label: 'QuickBooks Desktop Payroll' },
    { value: '2', label: 'QuickBooks Online Payroll' },
    { value: '3', label: 'Zoho Payroll' },
    { value: '4', label: 'Custom Check Design' },
    { value: '5', label: 'Trustbooks Payroll' },
    { value: '6', label: 'Bills & Invoices' }
  ];

  /** Payroll types whose upload must also create a check payment on the server. */
  private readonly CHECK_PAYMENT_PAYROLL_TYPES: ReadonlySet<string> = new Set([
    '2',
    '5',
    '6'
  ]);

  signature = [
    { value: '1', label: 'With Signature' },
    { value: '0', label: 'Without Signature' }
  ];

  micrLine = [
    {
      value: '1',
      label: 'With Bank Account Number',
      tooltip: 'You can print on the blank check paper.'
    },
    {
      value: '0',
      label: 'Without Bank Account Number',
      tooltip:
        'If you have a pre printed check, we can print on that. We will not print bank account number.'
    }
  ];

  payrollsCheck = new FormGroup({
    bankAccount: new FormControl('', [Validators.required]),
    file: new FormControl<File | null>(null, [Validators.required]),
    signature: new FormControl<string | null>(null, [Validators.required]),
    micrLine: new FormControl<string | null>(null, [Validators.required]),
    payrollType: new FormControl<string | null>(null, [Validators.required])
  });

  ngOnInit(): void {
    if (this.isTrustBooks) {
      this.payrollsCheck.controls.payrollType.setValue('5');
    }
  }

  onBankChange(bank: IBankDropdown | null | undefined): void {
    if (bank?.id) {
      const previousBankId = this.selectedBankId;
      this.selectedBankId = bank.id;
      this.payrollsCheck.controls.bankAccount.setValue(bank.id);

      if (previousBankId !== bank.id && this.uploadedFile?.name) {
        this.checkVerification(this.uploadedFile);
      }
    } else {
      this.selectedBankId = '';
      this.payrollsCheck.controls.bankAccount.setValue('');
    }
  }

  onSignatureSelect(value: string): void {
    // Signature is locked to "With Signature" for Bills & Invoices.
    if (this.isBillsAndInvoices && value === '0') return;
    this.payrollsCheck.controls.signature.setValue(value);
    this.processUploadedFileWhenReady();
  }

  onMicrSelect(value: string): void {
    // MICR is locked to "With Bank Account Number" for Bills & Invoices.
    if (this.isBillsAndInvoices && value === '0') return;
    this.payrollsCheck.controls.micrLine.setValue(value);
    this.processUploadedFileWhenReady();
  }

  onPayrollTypeSelect(value: string): void {
    const wasBills = this.payrollsCheck.value.payrollType === '6';
    this.payrollsCheck.controls.payrollType.setValue(value);
    // Bills & Invoices forces MICR to "With Bank Account Number" and Signature to
    // "With Signature" and locks them; leaving Bills & Invoices resets both.
    if (value === '6') {
      this.payrollsCheck.controls.micrLine.setValue('1');
      this.payrollsCheck.controls.signature.setValue('1');
    } else if (wasBills) {
      this.payrollsCheck.controls.micrLine.setValue(null);
      this.payrollsCheck.controls.signature.setValue(null);
    }
    this.reprocessFileOnPayrollTypeChange(value);
  }

  onNativeFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.validateFile(file)) return;
    this.onFileSelected(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    if (!this.validateFile(file)) return;
    this.onFileSelected(file);
  }

  private validateFile(file: File): boolean {
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (ext !== '.pdf') {
      this.alertService.warningAlert({
        content:
          'The file format you selected is not supported. Please choose a PDF file.',
        isCancel: false
      });
      return false;
    }
    if (file.size / 1e6 > this.MAX_FILE_SIZE_MB) {
      this.alertService.warningAlert({
        content: `The selected file size should be less than ${this.MAX_FILE_SIZE_MB}MB`,
        isCancel: false
      });
      return false;
    }
    return true;
  }

  onFileSelected(file: File): void {
    this.uploadedFile = file;
    this.payrollsCheck.controls.file.setValue(file);
    this.checkVerification(file);
  }

  onFileRemoved(): void {
    this.payrollsCheck.controls.file.setValue(null);
    this.uploadedFile = {} as File;
    this.clearCostPreview();
  }

  checkVerification(file: File): void {
    this.payrollsCheck.markAllAsTouched();
    if (this.payrollsCheck.invalid || this.loading().processing) {
      return;
    }

    const verificationDetails =
      this.localStorageService.getItem('gettingStartedData');
    if (verificationDetails?.verification === 0) {
      this.verifyEmailAndMobile();
      this.onCreateAnotherCheck();
      return;
    }
    if (file?.name && this.selectedBankId) {
      this.sendFile(file);
    }
  }

  sendFile(file: File): void {
    this.payrollsCheck.controls.file.setValue(file);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bankId', this.selectedBankId);
    if (
      this.isTrustBooks ||
      this.CHECK_PAYMENT_PAYROLL_TYPES.has(
        this.payrollsCheck.value.payrollType || ''
      )
    ) {
      formData.append('create_check_payment', '1');
      formData.append('demo', this.payrollsCheck.value.payrollType || '');
    }
    this.loading.update((l) => ({ ...l, processing: true }));
    this.integrationService
      .postPayrollCheckData(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.validatePayrollCheckCost(res.data);
          } else {
            this.loading.update((l) => ({ ...l, processing: false }));
          }
        },
        error: () => {
          this.loading.update((l) => ({ ...l, processing: false }));
          this.selectedBankId = '';
          this.payrollsCheck.controls.bankAccount.setValue('');
          this.bankAcDropDownComponent.clearSelection();
        }
      });
  }

  validatePayrollCheckCost(pathName: string): void {
    this.integrationService
      .validatePayrollCheck(
        pathName,
        this.isTrustBooks ? 'payroll-check-from-pdf' : 'check-print-from-pdf'
      )
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, processing: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: IPayrollCheckValidateRes) => {
        if (res?.success) {
          if (res.data.already_charged) {
            this.loadFileCheck(pathName);
          } else {
            this.showCostPreview(pathName, res);
          }
        } else {
          this.showInsufficientBalanceError(res);
        }
      });
  }

  showCostPreview(
    pathName: string,
    validateRes: IPayrollCheckValidateRes
  ): void {
    this.costPreview = validateRes.data;
    this.pendingPathName = pathName;
    this.insufficientBalance = false;
    this.insufficientBalanceError = null;
    this.displayTotalPages = validateRes.data.total_pages;
    this.displayTotalCost = validateRes.data.total_cost;
  }

  showInsufficientBalanceError(validateRes: IPayrollCheckValidateRes): void {
    this.costPreview = validateRes.errorCode as IPayrollCheckValidateData;
    this.pendingPathName = null;
    this.insufficientBalance = true;
    this.insufficientBalanceError =
      validateRes.errorMsg ||
      "You don't have enough 'My Credit' balance to do this transaction. Please recharge 'My Credit' and try again.";
    this.displayTotalPages = validateRes.errorCode?.total_pages || 0;
    this.displayTotalCost = validateRes.errorCode?.total_cost || 0;
  }

  confirmCostPreview(type?: string): void {
    this.payrollsCheck.markAllAsTouched();
    if (this.payrollsCheck.invalid || this.loading().processing) {
      return;
    }
    if (this.insufficientBalance) {
      this.refillCreditWarning(this.insufficientBalanceError || '');
      return;
    }
    if (this.pendingPathName) {
      if (type === 'save') {
        this.saveCheck(this.pendingPathName);
      } else {
        this.loadFileCheck(this.pendingPathName);
      }
    }
  }

  saveCheck(pathName: string): void {
    this.loading.update((l) => ({ ...l, saveCheck: true }));
    const sign = Number(this.payrollsCheck.value.signature);
    const demo = Number(this.payrollsCheck.value.payrollType);
    const micr = Number(this.payrollsCheck.value.micrLine);
    this.integrationService
      .savePayrollCheck({ path: pathName, sign, demo, micr })
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, saveCheck: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.alertService
            .successAlert({ content: 'Payment saved successfully.' })
            .afterClosed()
            .subscribe(() => {
              if (this.isTrustBooks || this.isBillsAndInvoices) {
                this.router.navigate(
                  ['/v4/manage/payments-out/detailed/check'],
                  { queryParams: { tab: 'new' } }
                );
              } else {
                this.router.navigate(['/v4/manage/payments-out']);
              }
            });
        }
      });
  }

  loadFileCheck(pathName: string): void {
    const sign = Number(this.payrollsCheck.value.signature);
    const demo = Number(this.payrollsCheck.value.payrollType);
    const micr = Number(this.payrollsCheck.value.micrLine);
    this.loading.update((l) => ({ ...l, createCheck: true }));
    this.integrationService
      .getPayrollCheckData({ path: pathName, demo, sign, micr })
      .pipe(
        finalize(() =>
          this.loading.update((l) => ({ ...l, createCheck: false }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success) {
          this.fileLinkRaw = res.fileLink as string;
          this.fileLink = this.sanitizer.bypassSecurityTrustResourceUrl(
            `${this.fileLinkRaw}#toolbar=0&navpanes=0&scrollbar=1`
          );
          this.clearCostPreview();
        }
      });
  }

  onDownload(): void {
    if (!this.fileLinkRaw) return;
    fetch(this.fileLinkRaw)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'check.pdf';
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  /** Sends the user to the checks table where the created (pending) checks can be paid. */
  onPayCheck(): void {
    this.router.navigate(['/v4/manage/payments-out/detailed/check'], {
      queryParams: { tab: 'new' }
    });
  }

  onCreateAnotherCheck(): void {
    this.fileLink = '';
    this.fileLinkRaw = '';
    this.selectedBankId = '';
    this.uploadedFile = {} as File;
    this.payrollsCheck.controls.bankAccount.setValue('');
    this.payrollsCheck.controls.file.setValue(null);
    this.payrollsCheck.markAsUntouched();
    this.bankAcDropDownComponent?.clearSelection();
    this.clearCostPreview();
  }

  private clearCostPreview(): void {
    this.costPreview = null;
    this.pendingPathName = null;
    this.insufficientBalance = false;
    this.insufficientBalanceError = null;
    this.displayTotalPages = 0;
    this.displayTotalCost = 0;
  }

  private processUploadedFileWhenReady(): void {
    if (
      !this.uploadedFile?.name ||
      this.loading().processing ||
      this.loading().createCheck ||
      this.loading().saveCheck ||
      this.costPreview ||
      this.pendingPathName ||
      this.fileLink
    ) {
      return;
    }

    this.checkVerification(this.uploadedFile);
  }

  /**
   * Re-uploads the already-selected file when the payroll type changes to one that must
   * create a check payment, so the `demo` / `create_check_payment` fields sent with the
   * upload match the new selection. Other payroll types do not re-post.
   * Unlike `processUploadedFileWhenReady`, an existing cost preview does not block the
   * re-upload — it is cleared, since it belongs to the previous payroll type.
   */
  private reprocessFileOnPayrollTypeChange(type: string | null): void {
    const { processing, createCheck, saveCheck } = this.loading();
    if (
      !this.CHECK_PAYMENT_PAYROLL_TYPES.has(type ?? '') ||
      !this.uploadedFile?.name ||
      processing ||
      createCheck ||
      saveCheck ||
      this.fileLink
    ) {
      return;
    }
    this.clearCostPreview();
    this.checkVerification(this.uploadedFile);
  }

  private verifyEmailAndMobile(): void {
    const ref = this.alertService.warningAlert({
      content: this.verificationMessageService.getVerificationMessage(),
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });
    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/v4/manage/verification'], {
          queryParams: {
            openVerificationModal: 'true',
            returnUrl: '/v4/manage/thirdparty_app/index'
          }
        });
      }
    });
  }

  private refillCreditWarning(msg: string): void {
    const dref = this.alertService.warningAlert({
      content: msg,
      doneMsg: 'Recharge Now',
      cancelMsg: 'Not Now',
      isCancel: true
    });
    dref.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/v4/manage/refill-credit']);
      }
    });
  }
}
