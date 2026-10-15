import {
  AfterViewInit,
  Component,
  DestroyRef,
  HostBinding,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { forkJoin } from 'rxjs';
import { finalize, take } from 'rxjs/operators';
import {
  LucideAngularModule,
  ChevronLeft,
  ChevronRight,
  X,
  FileSpreadsheet,
  Download,
  Trash2
} from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { BankAcDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-ac-dropdown-v4/bank-ac-dropdown-v4.component';
import { WalletDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/wallet-dropdown-v4/wallet-dropdown-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { IMultiCheckImport } from 'src/app/modules/check/model/check';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { V4BulkPaymentService } from 'src/app/modules/v4-bulk-payment/services/v4-bulk-payment.service';
import { V4ExcelImportStep2Component } from '../v4-excel-import-step2/v4-excel-import-step2.component';
import { V4ExcelImportStep3Component } from '../v4-excel-import-step3/v4-excel-import-step3.component';

interface IImportForm {
  source: FormControl<string | null>;
  bankAccount: FormControl<string | null>;
  wallet: FormControl<string | null>;
  file: FormControl<File | null>;
  template: FormControl<string | null>;
  includeHeader: FormControl<string | null>;
  paymentMethod: FormControl<string | null>;
}

interface IFormData {
  source: string | null;
  bankAccount: string | null;
  wallet: string | null;
  file: File | null;
  template: string | null;
  includeHeader: string | null;
}

interface IWalletFormData {
  sourceType: string | null;
  sourceId: string | null;
  template: string | null;
  excelFile: File | null;
  includeHeader: string | null;
  transferType: string | null;
}

interface IFormBody {
  bankAccount: string | null | undefined;
  template: string | null | undefined;
  excelFile: File | null | undefined;
  includeHeader: string | null | undefined;
}

@Component({
  selector: 'app-v4-excel-import',
  templateUrl: './v4-excel-import.component.html',
  styleUrls: ['./v4-excel-import.component.scss'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    LucideAngularModule,
    CommonButtonV4Component,
    V4ControlMessageComponent,
    BankAcDropdownV4Component,
    WalletDropdownV4Component,
    V4CommonDropDownSelectorComponent,
    V4ExcelImportStep2Component,
    V4ExcelImportStep3Component
  ]
})
export class V4ExcelImportComponent implements OnInit, AfterViewInit {
  @HostBinding('class') readonly hostClass = 'v4-excel-import-host';
  @ViewChild('templateSelect') templateSelect: NgSelectComponent;

  private userProfileService = inject(UserProfileService);
  public fb = inject(FormBuilder);
  private checkService = inject(CheckService);
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<V4ExcelImportComponent>);
  private authDataService = inject(AuthDataService);
  private alertService = inject(V4AlertService);
  private bulkPaymentService = inject(V3BulkPaymentService);
  public data: {
    [key: string]: string | (() => void) | undefined;
    onStep2Open?: () => void;
  } = inject(MAT_DIALOG_DATA);

  private destroyRef = inject(DestroyRef);
  private v4bulkPaymentService = inject(V4BulkPaymentService);

  // Lucide icons
  readonly ChevronLeftIcon = ChevronLeft;
  readonly ChevronRightIcon = ChevronRight;
  readonly XIcon = X;
  readonly FileSpreadsheetIcon = FileSpreadsheet;
  readonly DownloadIcon = Download;
  readonly Trash2Icon = Trash2;

  submitting = false;
  fileName = '';
  importForm: FormGroup<IImportForm>;
  templates = [
    { id: '', templateName: 'No template' },
    { id: '', templateName: '-- DEFAULT --' }
  ];

  sampleFileUrl: string;
  walletSampleFileUrl: string;
  selectedBank = new FormControl();
  selectedWallet = new FormControl();
  selectedBankId: string | null;
  selectedWalletId: string | null;
  isDeleting = false;
  isSampleFileLoading = signal(false);

  // Step management
  currentStep = signal<1 | 2 | 3>(1);
  step2Data = signal<IMultiCheckImport | null>(null);
  step2TemplateName = signal('');
  step2Source = signal('');
  step3Source = signal('');

  sourceOptions = [
    { value: 'bankAccount', label: 'Bank Account' },
    { value: 'wallet', label: 'Wallet' }
  ];

  paymentMethodOptions = [
    { value: 'check_mail', label: 'Check Mail' },
    { value: 'check_print', label: 'Check Print' }
  ];

  headerOptions = [
    { value: 'no', label: 'No' },
    { value: 'yes', label: 'Yes' }
  ];

  ngOnInit(): void {
    this.initImportForm();
    this.getTemplates();
    this.getSelectedBank();
    this.getSelectedWallet();
    this.handleSourceChange();
  }

  initImportForm() {
    this.importForm = this.fb.group({
      source: ['bankAccount', [Validators.required]],
      bankAccount: ['', [Validators.required]],
      wallet: [''],
      file: [null, [Validators.required]],
      template: ['NOTEMPLATE'],
      includeHeader: ['no'],
      paymentMethod: ['check_mail']
    }) as FormGroup<IImportForm>;
  }

  ngAfterViewInit(): void {
    if (this.templateSelect && this.templates.length > 0) {
      this.templateSelect.writeValue(this.templates[0]);
    }
  }

  uploadEvent(files: File): void {
    if (files && files?.name) {
      this.fileName = files?.name;
      this.importForm.controls.file.setValue(files);
    } else {
      this.importForm.controls.file.setValue(null);
      this.importForm.controls.file.markAsTouched();
    }
  }

  onRemoveBank() {
    this.importForm.controls.bankAccount.setValue(null);
    this.importForm.controls.bankAccount.markAllAsTouched();
  }

  getTemplates() {
    this.isSampleFileLoading.set(true);
    const bankSampleFileApi = this.checkService.getTemplates('checks-import');
    const zilSampleFileApi = this.checkService.getTemplates('wallet-checks');
    forkJoin([bankSampleFileApi, zilSampleFileApi])
      .pipe(
        finalize(() => this.isSampleFileLoading.set(false)),
        take(1)
      )
      .subscribe(([bankData, zilData]) => {
        if (bankData?.success) {
          bankData?.data?.template.forEach((templates) =>
            this.templates.push(templates)
          );
          this.sampleFileUrl = bankData?.data?.sampleFileUrl;
        }
        if (zilData?.success) {
          this.walletSampleFileUrl = zilData?.data?.sampleFileUrl;
        }
      });
  }

  deleteTemplate(template: { templateName: string; id: string }, event: Event) {
    event.stopPropagation();
    if (this.isDeleting) {
      return;
    }
    const confirmMessage = {
      content: 'Are you sure you want to delete?'
    };
    this.isDeleting = true;
    const confirm = this.alertService.confirmAlert(confirmMessage);
    confirm.afterClosed().subscribe((result) => {
      this.isDeleting = false;
      if (result) {
        this.checkService
          .deleteTemplate({ id: template.id })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              if (res.success) {
                this.alertService.successAlert({
                  content: 'Successfully Deleted'
                });
                this.templates = this.templates.filter(
                  (templates) => templates.id !== template.id
                );
              }
            },
            error: () => {
              this.getTemplates();
            }
          });
      }
    });
  }

  getFormData(data: Partial<IFormData>) {
    const body: IFormBody = {
      bankAccount: data.bankAccount,
      template: data.template,
      excelFile: data.file,
      includeHeader: data.includeHeader
    };

    const formData = new FormData();
    Object.keys(body).forEach((k) => {
      const value = body[k as keyof IFormBody];
      if (value instanceof File) {
        formData.append(k, value, value.name);
      } else if (
        typeof value === 'string' ||
        value === null ||
        value === undefined
      ) {
        formData.append(k, value as string);
      }
    });
    return formData;
  }

  getWalletFormData() {
    const data = this.importForm.value;
    const body: IWalletFormData = {
      sourceType: 'wallet',
      sourceId: data.wallet ?? null,
      template: data.template ?? '',
      excelFile: data.file ?? null,
      includeHeader: data.includeHeader ?? 'no',
      transferType: data.paymentMethod ?? 'check_mail'
    };
    const formData = new FormData();
    Object.keys(body).forEach((k) => {
      const value = body[k as keyof IWalletFormData];
      if (value instanceof File) {
        formData.append(k, value, value.name);
      } else if (
        typeof value === 'string' ||
        value === null ||
        value === undefined
      ) {
        formData.append(k, value as string);
      }
    });
    return formData;
  }

  getSelectedBank() {
    this.selectedBank.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          if (res?.id === this.selectedBankId) {
            return;
          }
          this.importForm.controls.bankAccount.setValue(res?.id);
          this.importForm.controls.bankAccount.markAllAsTouched();
          this.selectedBankId = res.id;
        } else {
          this.importForm.controls.bankAccount.setValue(null);
          this.selectedBankId = null;
        }
      });
  }

  getSelectedWallet() {
    this.selectedWallet.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          if (res?.uuId === this.selectedWalletId) {
            return;
          }
          this.importForm.controls.wallet.setValue(res?.uuId);
          this.importForm.controls.wallet.markAllAsTouched();
          this.selectedWalletId = res.uuId;
        } else {
          this.importForm.controls.wallet.setValue(null);
          this.selectedWalletId = null;
        }
      });
  }

  handleSourceChange() {
    this.importForm.controls.source.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((source) => {
        if (source === 'bankAccount') {
          this.importForm.controls.bankAccount.setValidators([
            Validators.required
          ]);
          this.importForm.controls.bankAccount.updateValueAndValidity();
          this.importForm.controls.wallet.clearValidators();
          this.importForm.controls.wallet.setValue(null);
          this.importForm.controls.wallet.updateValueAndValidity();
          this.importForm.controls.paymentMethod.clearValidators();
          this.importForm.controls.paymentMethod.setValue(null);
          this.importForm.controls.paymentMethod.updateValueAndValidity();
          this.selectedWallet.setValue(null);
          this.selectedWalletId = null;
        } else if (source === 'wallet') {
          this.importForm.controls.wallet.setValidators([Validators.required]);
          this.importForm.controls.paymentMethod.setValidators([
            Validators.required
          ]);
          this.importForm.controls.wallet.updateValueAndValidity();
          this.importForm.controls.bankAccount.clearValidators();
          this.importForm.controls.bankAccount.setValue(null);
          this.importForm.controls.bankAccount.updateValueAndValidity();
          this.importForm.controls.paymentMethod.updateValueAndValidity();
          this.selectedBank.setValue(null);
          this.selectedBankId = null;
        }
      });
  }

  changeTemplate(template: { id: string; templateName: string }) {
    if (template.templateName === 'No template') {
      this.importForm.controls.template.setValue('NOTEMPLATE');
    } else if (template.templateName === '-- DEFAULT --') {
      this.importForm.controls.template.setValue('');
    } else {
      this.importForm.controls.template.setValue(template.id);
    }
  }

  submit() {
    this.importForm.markAllAsTouched();
    if (!this.importForm.valid) {
      return;
    }
    this.submitting = true;
    this.userProfileService
      .checkEmailAndPhoneVerified()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (
          'data' in res &&
          (res.data?.email_verified === 0 || res.data?.phone_verified === 0)
        ) {
          this.submitting = false;
          this.authDataService.verifyEmailAndMobile(
            this.authDataService.getVerificationMessage(res.data),
            'Not Now'
          );
          return;
        }
        if (this.importForm.controls.source.value === 'wallet') {
          this.processImportFromWallet();
          return;
        }
        this.processImport();
      });
  }

  downloadClick() {
    if (this.importForm.controls.source.value === 'bankAccount') {
      window.location.href = this.sampleFileUrl;
    } else if (this.importForm.controls.source.value === 'wallet') {
      window.location.href = this.walletSampleFileUrl;
    }
  }

  processImport() {
    const formData = this.getFormData(this.importForm.value);
    let templateName = '';
    if (this.importForm.controls.template.value) {
      const matchingTemplate = this.templates.find(
        (ele) => ele.id === this.importForm.controls.template.value
      );
      if (matchingTemplate) {
        templateName = matchingTemplate?.templateName;
      }
    } else if (this.importForm.controls.template.value === '') {
      templateName = 'Default template';
    }

    this.submitting = true;
    this.checkService
      .multiImportStep2(formData)
      .pipe(
        finalize(() => {
          this.submitting = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          this.step2Data.set(data?.data);
          this.step2TemplateName.set(templateName);
          this.step2Source.set('');
          this.currentStep.set(2);
          this.data?.onStep2Open?.();
          this.dialogRef.addPanelClass('v4-step2-expanded');
          this.dialogRef.updateSize('95vw', '');
        }
      });
  }

  processImportFromWallet() {
    const formData = this.getWalletFormData();
    let templateName = '';
    if (this.importForm.controls.template.value) {
      const matchingTemplate = this.templates.find(
        (ele) => ele.id === this.importForm.controls.template.value
      );
      if (matchingTemplate) {
        templateName = matchingTemplate?.templateName;
      }
    } else if (this.importForm.controls.template.value === '') {
      templateName = 'Default template';
    }
    this.submitting = true;
    this.checkService
      .multiImportStep2FromWallet(formData)
      .pipe(
        finalize(() => {
          this.submitting = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          this.step2Data.set(data?.data);
          this.step2TemplateName.set(templateName);
          this.step2Source.set('wallet');
          this.currentStep.set(2);
          this.data?.onStep2Open?.();
          this.dialogRef.addPanelClass('v4-step2-expanded');
          this.dialogRef.updateSize('95vw', '');
        }
      });
  }

  onStep2Back() {
    this.currentStep.set(1);
    this.dialogRef.removePanelClass('v4-step2-expanded');
    this.dialogRef.updateSize('500px', '');
  }

  onStep2SubmitSuccess(event: { source: string }) {
    this.step3Source.set(event.source);
    this.currentStep.set(3);
  }

  onStep3Cancel() {
    this.currentStep.set(1);
    this.step2Data.set(null);
    this.dialogRef.removePanelClass('v4-step2-expanded');
    this.dialogRef.updateSize('500px', '');
  }

  onStep3SubmitSuccess(_event: { source: string }) {
    this.dialogRef.close({ success: true });
    this.router.navigate(['/v4/manage/payments-out']);
  }

  async onStep3ProcessNow(event: { source: string; zilPaymentIds: string[] }) {
    this.dialogRef.close({ success: true });
    this.bulkPaymentService.initBulkPayment(event.zilPaymentIds);
    await this.v4bulkPaymentService.openBulkPaymentModals(event.zilPaymentIds);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.uploadEvent(file as File);
  }

  clearFile(fileInput: HTMLInputElement) {
    this.fileName = '';
    this.importForm.controls.file.setValue(null);
    this.importForm.controls.file.markAsTouched();
    const input = fileInput;
    input.value = '';
  }

  back() {
    this.dialogRef.close();
  }
}
