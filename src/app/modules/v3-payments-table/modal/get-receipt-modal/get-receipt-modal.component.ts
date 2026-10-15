import { CheckService } from 'src/app/shared/service/check/check.service';
import { faXmark, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
  HostListener
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { trigger, style, transition, animate } from '@angular/animations';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { finalize, Subject, takeUntil, Subscription } from 'rxjs';
import { IPaymentsProofPayload } from 'src/app/modules/payments/model/payments';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CommonModule, DatePipe, NgOptimizedImage } from '@angular/common';
import { MatLabel } from '@angular/material/form-field';
import {
  faEye,
  faMagicWandSparkles,
  faPlus,
  faCheck,
  faTrash,
  faImage,
  faCircleMinus
} from '@fortawesome/pro-solid-svg-icons';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  LogoCropperComponent,
  CroppedLogoResult
} from 'src/app/shared/components/logo-cropper/logo-cropper.component';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { environment } from 'src/environments/environment';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { IAppConfig } from 'src/app/models/app_settings';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';

interface IPreviewData {
  senderName: string;
  payeeName: string;
  amount: string;
  address: string;
  type: string;
  paymentDate: string;
}
interface IInjectData {
  transactionId: string;
  zilId: string;
  payee: { email: string; phone: string };
  previewData: IPreviewData;
  canSubmitSignedReceiptRequest: boolean;
}

interface IAttachment {
  file: File;
  name: string;
  size: string;
  type: string;
}

interface ICheckAttachmentData {
  id: string;
  fileName: string;
  formated_date: string;
  user_name: string;
  pageCount: number;
  check_id: number;
  encrypted_id: string;
  file_name: string;
}

@Component({
  selector: 'app-get-receipt-modal',
  standalone: true,
  imports: [
    FaIconComponent,
    MatDialogClose,
    CommonButtonV35Component,
    NewPhoneInputComponent,
    V35ControlMessageComponent,
    CommonInputFieldComponent,
    MatRadioGroup,
    MatRadioButton,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MatLabel,
    MatCheckbox,
    MatTooltipModule,
    NgOptimizedImage,
    LogoCropperComponent,
    WhiteLabelDirective
  ],
  templateUrl: './get-receipt-modal.component.html',
  styleUrl: './get-receipt-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [animate('200ms ease-out', style({ opacity: 0 }))])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' }),
        animate(
          '300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({ opacity: 1, transform: 'scale(1) translateY(0)' })
        )
      ]),
      transition(':leave', [
        animate(
          '200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({ opacity: 0, transform: 'scale(0.95) translateY(10px)' })
        )
      ])
    ])
  ]
})
export class GetReceiptModalComponent implements OnInit, OnDestroy {
  private injectData = inject<IInjectData>(MAT_DIALOG_DATA);
  private paymentsService = inject(PaymentsService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef<GetReceiptModalComponent>);
  private checkService = inject(CheckService);
  private shareService = inject(SharedService);
  private datePipe = inject(DatePipe);
  canSubmitSignedReceiptRequest = false;
  payerNamePreview = '';
  payeeNamePreview = '';
  private appSettingsService = inject(AppSettingsService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private themeService = inject(ThemeService);

  destroy$ = new Subject();
  phoneCountryDropdownOpen = signal(false);
  isSubmit = signal(false);
  faXmark = faXmark;
  faCircleMinus = faCircleMinus;
  receiptType: 'sms' | 'email' = 'sms';
  payeeName = '';
  faPlus = faPlus;
  faCheck = faCheck;
  faTrash = faTrash;
  amount = '';
  appConfig: IAppConfig;
  env = environment;
  isWhiteLabel =
    this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker('isWhiteLabel');

  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  // Attachment related properties
  selectedAttachment = signal<IAttachment | null>(null);
  showAttachmentUploader = false;
  subscriptions: Subscription[] = [];
  removeSubject = new Subject();
  attachments: (ICheckAttachmentData & { checked?: boolean })[] = [];
  checkedAttch: string[] = [];
  disabled = false;

  receiptForm = new FormGroup({
    smsEnabled: new FormControl(true),
    emailEnabled: new FormControl(false),
    phone: new FormControl({ value: '', disabled: false }),
    email: new FormControl({ value: '', disabled: true }),
    memo: new FormControl('', [Validators.maxLength(500)]),
    payerName: new FormControl(''),
    payeeName: new FormControl('')
  });

  isAttchmentUploading = signal(false);

  certifications = [
    {
      name: 'SOC1',
      image: 'assets/images/certifications/SOC1.png'
    },
    {
      name: 'SOC2',
      image: 'assets/images/certifications/SOC2.png'
    },
    {
      name: 'ISO9001',
      image: 'assets/images/certifications/ISO9001.png'
    },
    {
      name: 'PCIDSS',
      image: 'assets/images/certifications/PCIDSS.png'
    },
    {
      name: 'ISO27001',
      image: 'assets/images/certifications/ISO27001.png'
    },
    {
      name: 'GDPR',
      image: 'assets/images/certifications/GDPR.png'
    },
    {
      name: 'HIPPA',
      image: 'assets/images/certifications/HIPPA.png'
    },
    {
      name: 'ISO2200',
      image: 'assets/images/certifications/ISO2200.png'
    },
    {
      name: '53A',
      image: 'assets/images/certifications/53A.png'
    },
    {
      name: 'CCPA',
      image: 'assets/images/certifications/CCPA.png'
    }
  ];

  showReceiptPreview = false;
  showLogoCropper = false;
  previewData: IPreviewData;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  dateToday: string = this.datePipe.transform(new Date(), 'MM/dd/yyyy') || '';
  description: string;
  faMagicWandSparkles = faMagicWandSparkles;
  faImage = faImage;
  private redrafting = signal(false);
  selectedLogo: CroppedLogoResult | null = null;
  isArcharina =
    environment.env_id === 'archarina' ||
    environment.env_id === 'archarina-sandbox';

  isDarkMode = signal(false);
  private lightLogoUrl = computed(() =>
    this.isArcharina
      ? 'assets/white_label/archarina.io/assets/app_logo.png'
      : 'assets/main/zil_Money_logo.svg'
  );
  private darkLogoUrl = computed(() =>
    this.isArcharina
      ? 'assets/white_label/archarina.io/assets/app_logo_white.png'
      : 'assets/white_label/zilmoney/assets/app_logo_white.svg'
  );
  brandLogoUrl = computed(() =>
    this.isDarkMode() ? this.darkLogoUrl() : this.lightLogoUrl()
  );

  ngOnInit(): void {
    this.isDarkMode.set(this.themeService.getInitialColourTheme());
    this.themeService
      .getThemeSwitch()
      .pipe(takeUntil(this.destroy$))
      .subscribe((dark) => this.isDarkMode.set(dark));

    this.receiptForm.patchValue({
      email: this.injectData.payee?.email,
      phone: this.injectData.payee?.phone
    });
    this.canSubmitSignedReceiptRequest =
      this.injectData.canSubmitSignedReceiptRequest;
    this.previewData = this.injectData.previewData;
    this.previewData.paymentDate = this.previewData.paymentDate
      ? this.previewData.paymentDate.split('-')[0]
      : this.dateToday;
    this.receiptForm.patchValue({
      payerName: this.previewData.senderName,
      payeeName: this.previewData.payeeName
    });
    this.payerNamePreview = this.previewData.senderName;
    this.payeeNamePreview = this.previewData.payeeName;

    // Subscribe to appConfig for whitelabel logo
    this.appSettingsService.appConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => {
        if (config) {
          this.appConfig = config;
        }
      });

    this.receiptForm
      .get('smsEnabled')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((checked) => {
        const phoneControl = this.receiptForm.get('phone');
        if (checked) {
          phoneControl?.enable();
          phoneControl?.setValidators([
            Validators.required,
            Validators.minLength(10)
          ]);
        } else {
          phoneControl?.enable();
          phoneControl?.clearValidators();
        }

        phoneControl?.updateValueAndValidity();
      });

    this.receiptForm
      .get('emailEnabled')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((checked) => {
        const emailControl = this.receiptForm.get('email');
        if (checked) {
          emailControl?.enable();
          emailControl?.setValidators([
            Validators.required,
            ValidationService.emailValidator
          ]);
        } else {
          emailControl?.enable();
          emailControl?.clearValidators();
        }
        emailControl?.updateValueAndValidity();
      });
  }

  countryChanges(event: { isOpen: boolean }) {
    if (event.isOpen) {
      this.phoneCountryDropdownOpen.set(true);
    } else {
      this.phoneCountryDropdownOpen.set(false);
    }
  }

  get transactionId() {
    return this.injectData.transactionId;
  }

  submit() {
    if (!this.canSubmitSignedReceiptRequest) {
      this.alertService.warningAlert({
        content:
          'Your payment is currently pending. A receipt will be issued once the payment is successfully verified and completed.'
      });
      return;
    }
    // Set up validators for each field based on checkbox state
    const { email, phone, smsEnabled, emailEnabled } =
      this.receiptForm.controls;

    if (emailEnabled.value) {
      email.setValidators([
        Validators.required,
        ValidationService.emailValidator
      ]);
    } else {
      email.clearValidators();
    }

    if (smsEnabled.value) {
      phone.setValidators([Validators.required, Validators.minLength(10)]);
    } else {
      phone.clearValidators();
    }

    email.updateValueAndValidity();
    phone.updateValueAndValidity();

    if (!smsEnabled.value && !emailEnabled.value) {
      this.alertService.warningAlert({
        content: 'Please select at least one notification method (SMS or Email)'
      });
      return;
    }

    this.receiptForm.markAllAsTouched();
    if (this.receiptForm.invalid) return;

    let type: IPaymentsProofPayload['type'] = ['email', 'sms'];

    if (smsEnabled.value) {
      type = ['sms'];
    }

    if (emailEnabled.value) {
      type = ['email'];
    }

    if (smsEnabled.value && emailEnabled.value) {
      type = ['email', 'sms'];
    }

    const payload: IPaymentsProofPayload = {
      type,
      is_signature_request: true,
      memo: this.receiptForm.value.memo as string,
      payerName: this.receiptForm.value.payerName as string,
      payeeName: this.receiptForm.value.payeeName as string
    };

    if (this.selectedLogo) {
      payload.logo = this.selectedLogo.base64;
    }

    // Add attachment if available
    if (this.attachments.length > 0) {
      const attachment = this.attachments[0];
      if (this.selectedAttachment()) {
        const selectedAttach = this.selectedAttachment();
        if (selectedAttach) {
          if (this.previewData.type === 'CHECK') {
            payload.attachment_ids = [attachment.id];
          } else {
            payload.attachment_ids = [attachment.encrypted_id];
          }
        }
      }
    }

    if (emailEnabled.value) {
      payload.email = this.receiptForm.value.email as string;
    }
    if (smsEnabled.value) {
      payload.phone = this.receiptForm.value.phone as string;
    }

    this.sendReceipt(payload);
  }

  private sendReceipt(payload: IPaymentsProofPayload) {
    this.isSubmit.set(true);
    this.paymentsService
      .sendPaymentReceipt(this.injectData.transactionId, payload)
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({ timeout: 1500 });
          this.dialogRef.close({ success: true });
        }
      });
  }

  onInput(e: Event) {
    this.description = (e.target as HTMLInputElement).value;
  }

  isRedrafting(): boolean {
    return this.redrafting();
  }

  redraftError = signal(false);

  redraft() {
    if (
      !this.description ||
      this.description.length < 5 ||
      this.isRedrafting()
    ) {
      this.redraftError.set(true);
      return;
    }

    this.redrafting.set(true);
    this.redraftError.set(false);
    this.paymentsService
      .redraftSigedRecieptDescription(this.description)
      .pipe(
        finalize(() => this.redrafting.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.description = res.data.corrected;
            this.receiptForm.patchValue({
              memo: this.description
            });
          } else {
            this.alertService.warningAlert({
              content: 'Failed to redraft description'
            });
          }
        },
        error: () => {
          this.alertService.warningAlert({
            content: 'Failed to redraft description'
          });
        }
      });
  }

  addLogo() {
    this.showLogoCropper = true;
  }

  onDescriptionChange(event: string) {
    this.description = event;
    this.receiptForm.patchValue({
      memo: this.description
    });
  }

  onPayerNameChange(event: string) {
    this.payerNamePreview = event;
    this.receiptForm.patchValue({
      payerName: this.payerNamePreview
    });
  }

  onPayeeNameChange(event: string) {
    this.payeeNamePreview = event;
    this.receiptForm.patchValue({
      payeeName: this.payeeNamePreview
    });
  }

  onLogoCropped(result: CroppedLogoResult) {
    this.selectedLogo = result;
    this.showLogoCropper = false;
  }

  onLogoCancel() {
    this.showLogoCropper = false;
  }

  removeLogo() {
    this.selectedLogo = null;
  }

  addAttachment(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.csv,.xls,.xlsx,.txt,.rtf';
    fileInput.style.display = 'none';

    fileInput.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.handleAttachmentSelection(file);
      }
      document.body.removeChild(fileInput);
    };

    document.body.appendChild(fileInput);
    fileInput.click();
  }

  handleAttachmentSelection(file: File): void {
    if (file.size > 10 * 1024 * 1024) {
      this.alertService.warningAlert({
        content: 'File size must be less than 10MB'
      });
      return;
    }

    this.saveAttachment(file);
    this.selectedAttachment.set({
      file,
      name: file.name,
      size: this.formatFileSize(file.size),
      type: file.type
    });
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k**i).toFixed(2))  } ${  sizes[i]}`;
  }

  removeAttachment() {
    if (this.attachments.length > 0) {
      this.deleteAttachment(this.attachments[0].id);
    }
    this.selectedAttachment.set(null);
  }

  viewAttachment() {
    const attachment = this.selectedAttachment();
    if (!attachment) return;

    const blobUrl = URL.createObjectURL(attachment.file);

    const newWindow = window.open(blobUrl, '_blank');

    if (
      !newWindow ||
      newWindow.closed ||
      typeof newWindow.closed === 'undefined'
    ) {
      this.alertService.warningAlert({
        content:
          'A popup blocker may be preventing the application from opening the file. Please allow popups for this site.'
      });
    }

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = [];
  }

  saveAttachment(file: File) {
    if (this.previewData.type === 'CHECK') {
      this.isAttchmentUploading.set(true);
      this.subscriptions.push(
        this.checkService
          .addCheckAttachment(this.injectData.zilId, file)
          .pipe(
            finalize(() => {
              this.isAttchmentUploading.set(false);
              this.removeSubject.next(true);
            })
          )
          .subscribe((data) => {
            if (data?.success) {
              this.attachments.push(data.data);
              this.selectedAttachment.set({
                file,
                name: data.data.fileName,
                size: this.formatFileSize(file.size),
                type: file.type
              });
            }
          })
      );
    } else {
      this.isAttchmentUploading.set(true);
      this.subscriptions.push(
        this.shareService
          .addNonCheckAttachment(file, this.injectData.zilId)
          .pipe(
            finalize(() => {
              this.removeSubject.next(true);
              this.isAttchmentUploading.set(false);
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.attachments.push(res.data);
              this.selectedAttachment.set({
                file,
                name: res.data.file_name,
                size: this.formatFileSize(file.size),
                type: file.type
              });
            }
          })
      );
    }
  }

  /** *******************************************delete Attachment ****************************** */

  deleteAttachment(attachmentId: string) {
    this.disabled = true;
    this.subscriptions.push(
      this.checkService
        .deleteCheckAttachment(this.injectData.zilId, attachmentId)
        .subscribe((res) => {
          if (res?.success) {
            this.disabled = false;
            this.checkedAttch.splice(
              this.checkedAttch.indexOf(attachmentId),
              1
            );
            this.attachments = this.attachments.filter(
              (ele) => ele.id !== attachmentId
            );
            // Clear the selected attachment if it was the one deleted
            const currentAttachment = this.selectedAttachment();
            if (currentAttachment && this.attachments.length === 0) {
              this.selectedAttachment.set(null);
            }
          }
        })
    );
  }

  // Handle escape key to close preview
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showReceiptPreview) {
      event.preventDefault();
      this.showReceiptPreview = false;
    }
  }
}
