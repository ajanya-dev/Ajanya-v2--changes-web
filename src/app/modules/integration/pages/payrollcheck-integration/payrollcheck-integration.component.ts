import { Component, OnInit, OnDestroy, inject, ViewChild, signal, computed } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl
} from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { MatTooltip } from '@angular/material/tooltip';
import { IGettingStartedAPI } from 'src/app/models/getting-started';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { VerificationMessageService } from 'src/app/shared/service/auth/verification-message.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { BankAcDropdownV3Component } from 'src/app/shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { IBankDropdown } from 'src/app/models/bank';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faGear,
  faCloudArrowUp,
  faCheckCircle,
  faFileLines,
  faCircleCheck,
  faDownload,
  faBuildingColumns,
  faSignature,
  faFilePdf,
  faLightbulb,
  faTriangleExclamation
} from '@fortawesome/pro-solid-svg-icons';
import { ContactSupportNewComponent } from 'src/app/shared/components/contact-support-new/contact-support-new.component';
import { NgClass } from '@angular/common';
import {
  IPayrollCheckValidateData,
  IPayrollCheckValidateRes
} from '../../model/integration';
import { OcwBackButtonComponent } from '../../../../shared/components/ocw-back-button/ocw-back-button.component';
import { DemoVideoComponent } from '../../../../shared/components/demo-video/demo-video.component';

/**
 * Interface representing sample files for different integrations.
 */
export interface ISampleFiles {
  quickbooksDesktop: string;
  quickbooksOnline: string;
  zoho: string;
  bill: string;
  newPayrolls: { [key: string]: string };
}

/**
 * Component for managing payroll check integration.
 */
@Component({
  selector: 'app-payrollcheck-integration',
  templateUrl: './payrollcheck-integration.component.html',
  styleUrls: ['./payrollcheck-integration.component.scss'],
  standalone: true,
  imports: [
    OcwBackButtonComponent,
    DemoVideoComponent,
    FormsModule,
    ReactiveFormsModule,
    BankAcDropdownV3Component,
    MatRadioGroup,
    MatRadioButton,
    MatTooltip,
    CommonButtonV35Component,
    CommonUploadButtonV35Component,
    FaIconComponent,
    V35ControlMessageComponent,
    ContactSupportNewComponent,
    NgClass,
  ]
})
export class PayrollcheckIntegrationComponent implements OnInit, OnDestroy {
  private localStorageService = inject(LocalStorageService);
  private verificationMessageService = inject(VerificationMessageService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private integrationService = inject(IntegrationService);
  private sanitizer = inject(DomSanitizer);
  private route = inject(ActivatedRoute);

  @ViewChild('bankAcDropDown')
  bankAcDropDownComponent: BankAcDropdownV3Component;

  // Icons
  faGear = faGear;
  faCloudArrowUp = faCloudArrowUp;
  faCheckCircle = faCheckCircle;
  faFileLines = faFileLines;
  faCircleCheck = faCircleCheck;
  faDownload = faDownload;
  faBuildingColumns = faBuildingColumns;
  faSignature = faSignature;
  faFilePdf = faFilePdf;
  faLightbulb = faLightbulb;
  faTriangleExclamation = faTriangleExclamation;

  subscriptions: Subscription[] = [];
  fileLink: SafeResourceUrl;
  sampleFiles: ISampleFiles;
  verificationDetails: IGettingStartedAPI;
  loading = {
    initialLoading: false,
    processing: false,
    createCheck: false,
    saveCheck: false
  };

  // File upload state
  uploadedFile: File = {} as File;
  selectedBankId: string = '';

  // Cost preview state - initialize with default values
  costPreview: IPayrollCheckValidateData | null = null;
  pendingPathName: string | null = null;
  insufficientBalance = false;
  insufficientBalanceError: string | null = null;

  // Display values (show $0.00 initially)
  displayTotalPages = 0;
  displayTotalCost = 0;
  isTrustBooks = signal(false);

  instructions = computed(() => [
    {
      text: 'Select the bank account to issue the check',
      icon: faBuildingColumns
    },
    { text: `Choose a signature option${this.isTrustBooks() ? '' : ' and payroll type'}`, icon: faSignature },
    { text: `Upload the PDF downloaded from ${this.isTrustBooks() ? 'Trustbooks' : 'a third-party application'}`, icon: faCloudArrowUp }
  ]);

  payrollType = [
    { value: '1', label: 'QuickBooks Desktop Payroll' },
    { value: '2', label: 'QuickBooks Online Payroll' },
    { value: '3', label: 'Zoho Payroll' },
    { value: '4', label: 'Custom Check Design' },
    { value: '5', label: 'Trustbooks Payroll' },
    { value: '6', label: 'Bills & Invoices' },
  ];

  /** Payroll types whose upload must also create a check payment on the server. */
  private readonly CHECK_PAYMENT_PAYROLL_TYPES: ReadonlySet<string> = new Set([
    '2',
    '5',
    '6'
  ]);

  /** Payroll types whose created checks can be paid straight from the success screen. */
  private readonly PAYABLE_PAYROLL_TYPES: ReadonlySet<string> = new Set([
    '2',
    '5'
  ]);

  /** Bills & Invoices ('6') uses a different flow — no print/proceed, Save instead. */
  get isBillsAndInvoices(): boolean {
    return this.payrollsCheck.value.payrollType === '6';
  }

  /** QuickBooks Online Payroll ('2') and Trustbooks Payroll ('5') create payable check payments. */
  get canPayCreatedCheck(): boolean {
    return this.PAYABLE_PAYROLL_TYPES.has(
      this.payrollsCheck.value.payrollType ?? ''
    );
  }

  /** MICR "Without Bank Account Number" ('0') is locked for Bills & Invoices. */
  isMicrOptionDisabled(value: string): boolean {
    return this.isBillsAndInvoices && value === '0';
  }

  /** Signature "Without Signature" ('0') is locked for Bills & Invoices. */
  isSignatureOptionDisabled(value: string): boolean {
    return this.isBillsAndInvoices && value === '0';
  }

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

  sampleFilesList = signal([
    {
      value: 'quickbooksDesktop',
      label: 'QuickBooks Desktop Payroll',
      file: '',
      color: 'green'
    },
    {
      value: 'quickbooksOnline',
      label: 'QuickBooks Online Payroll',
      file: '',
      color: 'blue'
    },
    { value: 'zoho', label: 'Zoho Payroll', file: '', color: 'yellow' },
    { value: 'trustbooks', label: 'Trustbooks Payroll', file: '', color: 'violet' },
    { value: 'bill', label: 'Bills & Invoices', file: '', color: 'red' }
  ]);

  payrollsCheck = new FormGroup({
    bankAccount: new FormControl('', [Validators.required]),
    file: new FormControl<File | null>(null, [Validators.required]),
    signature: new FormControl<string | null>(null, [Validators.required]),
    micrLine: new FormControl<string | null>(null, [Validators.required]),
    payrollType: new FormControl('1')
  });

  /** Tracks the previous payroll type to detect entering/leaving Bills & Invoices. */
  private previousPayrollType: string | null = '1';

  ngOnInit(): void {
    this.onLoadCheckSampleFiles();
    this.route.queryParams.subscribe((params) => {
      if(params.trust_books){
        this.payrollsCheck.controls.payrollType.setValue('5');
        this.isTrustBooks.set(true);
      }
    });
    // Bills & Invoices forces MICR to "With Bank Account Number" and Signature to
    // "With Signature" and locks them; leaving Bills & Invoices resets both so the
    // user must re-choose.
    this.subscriptions.push(
      this.payrollsCheck.controls.payrollType.valueChanges.subscribe((type) => {
        if (type === '6') {
          this.payrollsCheck.controls.micrLine.setValue('1');
          this.payrollsCheck.controls.signature.setValue('1');
        } else if (this.previousPayrollType === '6') {
          this.payrollsCheck.controls.micrLine.setValue(null);
          this.payrollsCheck.controls.signature.setValue(null);
        }
        this.previousPayrollType = type;
        this.reprocessFileOnPayrollTypeChange(type);
      })
    );
  }

  /**
   * Re-uploads the already-selected file when the payroll type changes to one that must
   * create a check payment, so the `demo` / `create_check_payment` fields sent with the
   * upload match the new selection. Other payroll types do not re-post.
   */
  private reprocessFileOnPayrollTypeChange(type: string | null): void {
    if (
      !this.CHECK_PAYMENT_PAYROLL_TYPES.has(type ?? '') ||
      !this.uploadedFile?.name ||
      !this.selectedBankId ||
      this.loading.processing ||
      this.fileLink
    ) {
      return;
    }
    this.clearCostPreview();
    this.checkVerification(this.uploadedFile);
  }

  /**
   * Loads sample files for payroll checks.
   */
  onLoadCheckSampleFiles(): void {
    this.loading.initialLoading = true;
    this.integrationService
      .getPayrollCheckSampleFiles()
      .pipe(
        finalize(() => {
          this.loading.initialLoading = false;
        })
      )
      .subscribe((res) => {
        if (res?.success) {
          this.sampleFiles = res.data;
          this.sampleFilesList.update( prev => prev.map((obj) => ({
            ...obj,
            file:
              (this.sampleFiles[obj.value as keyof ISampleFiles] as string) ||
              ''
          })));
        }
      });
  }

  /**
   * Handles the bank dropdown change event.
   * @param bank The selected bank account.
   */
  onBankChange(bank: IBankDropdown | null | undefined): void {
    if (bank?.id) {
      const previousBankId = this.selectedBankId;
      this.selectedBankId = bank.id;
      this.payrollsCheck.controls.bankAccount.setValue(bank.id);

      // If bank changed and a file is already uploaded, re-verify with new bank
      if (previousBankId !== bank.id && this.uploadedFile?.name) {
        this.checkVerification(this.uploadedFile);
      }
    } else {
      this.selectedBankId = '';
      this.payrollsCheck.controls.bankAccount.setValue('');
    }
  }

  /**
   * Handles the file selection from upload component.
   * @param file The selected file.
   */
  onFileSelected(file: File): void {
    this.uploadedFile = file;
    this.payrollsCheck.controls.file.setValue(file);
    this.checkVerification(file);
  }

  checkVerification(file: File): void {
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

  /**
   * Handles removing the uploaded file.
   */
  onFileRemoved(): void {
    this.payrollsCheck.controls.file.setValue(null);
    this.uploadedFile = {} as File;
    this.clearCostPreview();
    this.displayTotalPages = 0;
    this.displayTotalCost = 0;
  }

  verifyEmailAndMobile() {
    const ref = this.alertService.warningAlert({
      content: this.verificationMessageService.getVerificationMessage(),
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/manage/users/verify-email-phone'], {
          queryParams: {
            returnUrl: 'manage/thirdparty_app/payrollcheck'
          }
        });
      }
    });
  }

  /**
   * Sends the selected file to the server.
   * @param file The selected file to be sent.
   */
  sendFile(file: File): void {
    this.payrollsCheck.controls.file.setValue(file);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bankId', this.selectedBankId);
    if (this.CHECK_PAYMENT_PAYROLL_TYPES.has(this.payrollsCheck.value.payrollType ?? '')) {
      formData.append('create_check_payment', '1');
      formData.append('demo', this.payrollsCheck.value.payrollType ?? '');
    }
    this.loading.processing = true;
    this.subscriptions.push(
      this.integrationService.postPayrollCheckData(formData).subscribe({
        next: (res) => {
          if (res?.success) {
            this.validatePayrollCheckCost(res.data);
          } else {
            this.loading.processing = false;
          }
        },
        error: () => {
          this.loading.processing = false;
          this.selectedBankId = '';
          this.payrollsCheck.controls.bankAccount.setValue('');
          this.bankAcDropDownComponent.clearSelection();
        }
      })
    );
  }

  /**
   * Validates the payroll check cost before proceeding.
   * @param pathName The path to the payroll check file (ref_id from upload).
   */
  validatePayrollCheckCost(pathName: string): void {
    this.subscriptions.push(
      this.integrationService
        .validatePayrollCheck(pathName,this.isTrustBooks() ? 'payroll-check-from-pdf' : 'check-print-from-pdf')
        .pipe(
          finalize(() => {
            this.loading.processing = false;
          })
        )
        .subscribe((res: IPayrollCheckValidateRes) => {
          if (res?.success) {
            if (res.data.already_charged) {
              this.loadFilecheck(pathName);
            } else {
              this.showCostPreview(pathName, res);
            }
          } else {
            this.showInsufficientBalanceError(res);
          }
        })
    );
  }

  /**
   * Shows the cost preview inline instead of modal.
   * @param pathName The path to the payroll check file.
   * @param validateRes The validation response containing cost details.
   */
  showCostPreview(
    pathName: string,
    validateRes: IPayrollCheckValidateRes
  ): void {
    this.costPreview = validateRes.data;
    this.pendingPathName = pathName;
    this.insufficientBalance = false;
    this.insufficientBalanceError = null;
    // Update display values
    this.displayTotalPages = validateRes.data.total_pages;
    this.displayTotalCost = validateRes.data.total_cost;
  }

  /**
   * Shows insufficient balance error inline.
   * @param validateRes The validation response containing error details.
   */
  showInsufficientBalanceError(validateRes: IPayrollCheckValidateRes): void {
    this.costPreview = validateRes.errorCode as IPayrollCheckValidateData;
    this.pendingPathName = null;
    this.insufficientBalance = true;
    this.insufficientBalanceError =
      validateRes.errorMsg ||
      "You don't have enough 'My Credit' balance to do this transaction. Please recharge 'My Credit' and try again.";
    // Update display values
    this.displayTotalPages = validateRes.errorCode?.total_pages || 0;
    this.displayTotalCost = validateRes.errorCode?.total_cost || 0;
  }

  /**
   * Confirms the cost preview and proceeds to load the file.
   */
  confirmCostPreview(type?: string): void {
    this.payrollsCheck.markAllAsTouched();
    if (this.payrollsCheck.invalid || this.loading.processing) {
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
        this.loadFilecheck(this.pendingPathName);
      }
    }
  }

  /**
   * Cancels the cost preview and resets the state.
   */
  cancelCostPreview(): void {
    this.clearCostPreview();
  }

  /**
   * Clears the cost preview state.
   */
  private clearCostPreview(): void {
    this.costPreview = null;
    this.pendingPathName = null;
    this.insufficientBalance = false;
    this.insufficientBalanceError = null;
    this.displayTotalPages = 0;
    this.displayTotalCost = 0;
  }

  /**
   * Loads the payroll check file.
   * @param pathName The path to the payroll check file.
   */
  loadFilecheck(pathName: string): void {
    const path = pathName;
    const sign = Number(this.payrollsCheck.value.signature);
    const demo = Number(this.payrollsCheck.value.payrollType);
    const micr = Number(this.payrollsCheck.value.micrLine);
    this.loading.createCheck = true;
    this.subscriptions.push(
      this.integrationService
        .getPayrollCheckData({ path, demo, sign, micr })
        .pipe(
          finalize(() => {
            this.loading.createCheck = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.fileLink = this.sanitizer.bypassSecurityTrustResourceUrl(
              res.fileLink as string
            );
            this.clearCostPreview();
          }
        })
    );
  }

  /**
   * Saves the payroll check.
   * @param pathName The path to the payroll check file.
   */
  saveCheck(pathName: string): void {
    this.loading.saveCheck = true;
    const path = pathName;
    const sign = Number(this.payrollsCheck.value.signature);
    const demo = Number(this.payrollsCheck.value.payrollType);
    const micr = Number(this.payrollsCheck.value.micrLine);
    const payload = {
      path,
      sign,
      demo,
      micr,
    };
    this.subscriptions.push(
      this.integrationService.savePayrollCheck(payload)
        .pipe(finalize(() => { this.loading.saveCheck = false; }))
        .subscribe((res) => {
          if (res?.success) {
            this.alertService.successAlert({
              content: 'Payment saved successfully.'
            }).afterClosed().subscribe(() => {
              if (this.isTrustBooks() || this.isBillsAndInvoices) {
                this.router.navigate(['/manage/payments-table/check']);
              } else {
                this.router.navigate(['/manage/payments-table/index']);
              }
            });
          }
        })
    );
  }

  /**
   * Sends the user to the checks table where the created (pending) checks can be paid.
   */
  onPayCheck(): void {
    this.router.navigate(['/manage/payments-table/check']);
  }

  /**
   * Clears the form and file link to create another check.
   */
  onCreateAnotherCheck(): void {
    this.fileLink = '';
    this.selectedBankId = '';
    this.uploadedFile = {} as File;
    this.payrollsCheck.controls.bankAccount.setValue('');
    this.payrollsCheck.controls.file.setValue(null);
    this.payrollsCheck.markAsUntouched();
    this.bankAcDropDownComponent.clearSelection();
    this.clearCostPreview();
    this.displayTotalPages = 0;
    this.displayTotalCost = 0;
  }

  refillCreditWarning(msg: string) {
    const dref = this.alertService.warningAlert({
      content: msg,
      doneMsg: 'Recharge Now',
      cancelMsg: 'Not Now',
      isCancel: true
    });

    dref.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['manage/refill-credit']);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
