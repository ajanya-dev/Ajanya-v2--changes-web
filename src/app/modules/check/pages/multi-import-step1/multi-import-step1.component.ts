import { faAngleRight, faCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { forkJoin, Subscription } from 'rxjs';
import { finalize, take } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { environment } from 'src/environments/environment';
import { CommonButtonV35Component } from '../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonUploadButtonV35Component } from '../../../../shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { BankAcDropdownV3Component } from '../../../../shared/components/v3/drop-downs/bank-ac-dropdown-v3/bank-ac-dropdown-v3.component';
import { WalletDropdownV3Component } from '../../../../shared/components/v3/drop-downs/wallet-dropdown-v3/wallet-dropdown-v3.component';

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
  selector: 'app-multi-import-step1',
  templateUrl: './multi-import-step1.component.html',
  styleUrls: ['./multi-import-step1.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BankAcDropdownV3Component,
    WalletDropdownV3Component,
    ControlMessageComponent,
    CommonUploadButtonV35Component,
    NgSelectModule,
    FaIconComponent,
    CommonButtonV35Component,
    DemoVideoComponent
  ]
})
export class MultiImportStep1Component
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('templateSelect') templateSelect: NgSelectComponent;

  private userProfileService = inject(UserProfileService);
  public fb = inject(FormBuilder);
  private checkService = inject(CheckService);
  private router = inject(Router);
  private authDataService = inject(AuthDataService);
  private alertService = inject(AlertService);

  environment = environment;

  faAngleRight = faAngleRight;
  faCircleInfo = faCircleInfo;

  subscriptions: Subscription[] = [];
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
  sourceOptions = [
    { value: 'bankAccount', label: 'Bank Account' },
    { value: 'wallet', label: 'Wallet' }
  ];

  paymentMethodOptions = [
    { value: 'check_mail', label: 'Check Mail' },
    { value: 'check_print', label: 'Check Print' }
    // { value: 'check_email', label: 'Check Email' },
  ];

  ngOnInit(): void {
    this.initImportForm();
    this.getTemplates();
    this.getSelectedBank();
    this.getSelectedWallet();
    this.handleSourceChange();
  }

  /**
   * @description Initializes the importForm FormGroup.
   */
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

  /**
   * @description Handles the event when files are selected for upload.
   * @param {File[]} files - An array of selected File objects for upload.
   */
  uploadEvent(files: File): void {
    if (files && files?.name) {
      this.fileName = files?.name;
      this.importForm.controls.file.setValue(files);
    } else {
      this.importForm.controls.file.setValue(null);
      this.importForm.controls.file.markAsTouched();
    }
  }

  /**
   * clear bank selection
   */
  onRemoveBank() {
    this.importForm.controls.bankAccount.setValue(null);
    this.importForm.controls.bankAccount.markAllAsTouched();
  }

  /**
   * @description Triggers a click event on the file input element with the ID 'file_select_multi_import_check'.
   */
  choose() {
    document.getElementById('file_select_multi_import_check')?.click();
  }

  /**
   * @description  Fetches templates from the checkService and updates component properties accordingly.
   */
  getTemplates() {
    this.isSampleFileLoading.set(true);
    const bankSampleFileApi = this.checkService.getTemplates('checks-import');
    const zilSampleFileApi = this.checkService.getTemplates('wallet-checks');
    forkJoin([bankSampleFileApi, zilSampleFileApi])
    .pipe(finalize(() => this.isSampleFileLoading.set(false)),take(1))
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
        this.subscriptions.push(
          this.checkService.deleteTemplate({ id: template.id }).subscribe({
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
          })
        );
      }
    });
  }

  /**
   * @description Creates a FormData object based on provided partial form data.
   * @param {Partial<IFormData>} data - Partial form data containing source, bankAccount/wallet, template, file, and includeHeader.
   * @returns {FormData} formData - FormData object for HTTP requests.
   */
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
      transferType: data.paymentMethod ?? 'check_mail',
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

  /**
   * Method to get selected bank from dropdown
   */
  getSelectedBank() {
    this.subscriptions.push(
      this.selectedBank.valueChanges.subscribe((res) => {
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
      })
    );
  }

  /**
   * Method to get selected wallet from dropdown
   */
  getSelectedWallet() {
    this.subscriptions.push(
      this.selectedWallet.valueChanges.subscribe((res) => {
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
      })
    );
  }

  /**
   * Handle source change and update validators
   */
  handleSourceChange() {
    this.subscriptions.push(
      this.importForm.controls.source.valueChanges.subscribe((source) => {
        if (source === 'bankAccount') {
          this.importForm.controls.bankAccount.setValidators([Validators.required]);
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
          this.importForm.controls.paymentMethod.setValidators([Validators.required]);
          this.importForm.controls.wallet.updateValueAndValidity();
          this.importForm.controls.bankAccount.clearValidators();
          this.importForm.controls.bankAccount.setValue(null);
          this.importForm.controls.bankAccount.updateValueAndValidity();
          this.importForm.controls.paymentMethod.updateValueAndValidity();
          this.selectedBank.setValue(null);
          this.selectedBankId = null;
        }
      })
    );
  }

  /**
   * Method to get template change from dropdown
   */
  changeTemplate(template: { id: string; templateName: string }) {
    if (template.templateName === 'No template') {
      this.importForm.controls.template.setValue('NOTEMPLATE');
    } else if (template.templateName === '-- DEFAULT --') {
      this.importForm.controls.template.setValue('');
    } else {
      this.importForm.controls.template.setValue(template.id);
    }
  }

  /**
   * @description Initiates the submission process for the import form.
   */
  submit() {
    this.importForm.markAllAsTouched();
    if (!this.importForm.valid) {
      return;
    }
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        if (res.email_verified === 0 || res.phone_verified === 0) {
          this.authDataService.verifyEmailAndMobile(
            this.authDataService.getVerificationMessage(res),
            'Not Now'
          );
          return;
        }
        if (this.importForm.controls.source.value === 'wallet') {
          this.processImportFromWallet();
          return;
        }
        this.processImport();
      })
    );
  }

  /**
   * handles download button click event
   */
  downloadClick() {
    if (this.importForm.controls.source.value === 'bankAccount') {
      window.location.href = this.sampleFileUrl;
    } else if (this.importForm.controls.source.value === 'wallet') {
      window.location.href = this.walletSampleFileUrl;
    }
  }

  /**
   * @description Initiates the import process.
   */
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
    this.subscriptions.push(
      this.checkService
        .multiImportStep2(formData)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((data) => {
          this.router.navigate(['manage/cheque/multi_import/step2'], {
            state: { res: JSON.stringify(data?.data), templateName }
          });
        })
    );
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
    this.subscriptions.push(
      this.checkService.multiImportStep2FromWallet(formData)
        .pipe(finalize(() => {this.submitting = false;}))
        .subscribe((data) => {
          this.router.navigate(['manage/cheque/multi_import/step2'], {
            state: { res: JSON.stringify(data?.data), templateName,source:'wallet' }
          });
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
