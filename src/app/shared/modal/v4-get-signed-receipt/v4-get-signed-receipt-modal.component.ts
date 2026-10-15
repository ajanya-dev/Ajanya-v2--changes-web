import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
  computed
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyPipe, DatePipe, NgOptimizedImage } from '@angular/common';
import { finalize } from 'rxjs';
import {
  Check,
  CircleMinus,
  Eye,
  EyeOff,
  Image,
  Plus,
  Trash2,
  WandSparkles,
  X,
  LucideAngularModule
} from 'lucide-angular';

import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { IPaymentsProofPayload } from 'src/app/modules/payments/model/payments';
import { IApiRes } from 'src/app/models/api';
import { IAppConfig } from 'src/app/models/app_settings';
import { environment } from 'src/environments/environment';
import {
  CroppedLogoResult,
  V4LogoCropperComponent
} from '../../components/v4-logo-cropper/v4-logo-cropper.component';
import { PaymentsService } from '../../service/payments/payments.service';
import { CheckService } from '../../service/check/check.service';
import { SharedService } from '../../service/common/shared/shared.service';
import { V4AlertService } from '../../service/alert/v4-alert.service';
import { ThemeService } from '../../service/theme/theme.service';
import { ValidationService } from '../../service/validation/validation.service';
import { CommonButtonV4Component } from '../../V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from '../../V4/common-input-field-v4/common-input-field.component-v4';
import { PhoneInputV4Component } from '../../V4/v4-phone-input/v4-phone-input.component';
import { V4ControlMessageComponent } from '../../V4/control-message-v4/control-message-v4.component';

interface IPreviewData {
  senderName: string;
  payeeName: string;
  amount: string;
  address: string;
  type: string;
  paymentDate: string;
  reference?: string;
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
  selector: 'app-v4-get-signed-receipt-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    NgOptimizedImage,
    MatCheckbox,
    MatTooltipModule,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    PhoneInputV4Component,
    V4ControlMessageComponent,
    V4LogoCropperComponent
  ],
  templateUrl: './v4-get-signed-receipt-modal.component.html',
  styleUrl: './v4-get-signed-receipt-modal.component.scss'
})
export class V4GetSignedReceiptModalComponent implements OnInit {
  readonly injectData = inject<IInjectData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<V4GetSignedReceiptModalComponent>);
  private paymentsService = inject(PaymentsService);
  private checkService = inject(CheckService);
  private shareService = inject(SharedService);
  private v4AlertService = inject(V4AlertService);
  private appSettingsService = inject(AppSettingsService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private themeService = inject(ThemeService);
  private datePipe = inject(DatePipe);
  private destroyRef = inject(DestroyRef);

  // Lucide icons
  readonly XIcon = X;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly Wand2Icon = WandSparkles;
  readonly PlusIcon = Plus;
  readonly ImageIcon = Image;
  readonly Trash2Icon = Trash2;
  readonly CheckIcon = Check;
  readonly CircleMinusIcon = CircleMinus;

  // Signals
  isSubmitting = signal(false);
  isRedrafting = signal(false);
  redraftError = signal(false);
  showPreview = signal(false);
  showLogoCropper = signal(false);
  isAttachmentUploading = signal(false);
  selectedAttachment = signal<IAttachment | null>(null);
  attachments = signal<ICheckAttachmentData[]>([]);
  phoneCountryDropdownOpen = signal(false);

  // Local file map for viewing uploaded attachments (id → { file, size, type })
  private localFileMap = new Map<
    string,
    { file: File; size: string; type: string }
  >();

  // Data
  previewData: IPreviewData;
  canSubmitSignedReceiptRequest = false;
  payerNamePreview = '';
  payeeNamePreview = '';
  description = '';
  selectedLogo: CroppedLogoResult | null = null;
  appConfig: IAppConfig;
  dateToday: string = this.datePipe.transform(new Date(), 'MM/dd/yyyy') ?? '';

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

  isWhiteLabel =
    this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker('isWhiteLabel');

  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  certifications = [
    { name: 'SOC1', image: 'assets/images/certifications/SOC1.png' },
    { name: 'SOC2', image: 'assets/images/certifications/SOC2.png' },
    { name: 'ISO9001', image: 'assets/images/certifications/ISO9001.png' },
    { name: 'PCIDSS', image: 'assets/images/certifications/PCIDSS.png' },
    { name: 'ISO27001', image: 'assets/images/certifications/ISO27001.png' },
    { name: 'GDPR', image: 'assets/images/certifications/GDPR.png' },
    { name: 'HIPPA', image: 'assets/images/certifications/HIPPA.png' },
    { name: 'ISO2200', image: 'assets/images/certifications/ISO2200.png' },
    { name: '53A', image: 'assets/images/certifications/53A.png' },
    { name: 'CCPA', image: 'assets/images/certifications/CCPA.png' }
  ];

  receiptForm = new FormGroup({
    smsEnabled: new FormControl(true),
    emailEnabled: new FormControl(false),
    phone: new FormControl({ value: '', disabled: false }),
    email: new FormControl({ value: '', disabled: true }),
    memo: new FormControl('', [Validators.maxLength(500)]),
    payerName: new FormControl(''),
    payeeName: new FormControl('')
  });

  ngOnInit(): void {
    this.isDarkMode.set(this.themeService.getInitialColourTheme());
    this.themeService
      .getThemeSwitch()
      .pipe(takeUntilDestroyed(this.destroyRef))
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

    this.appSettingsService.appConfig$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((config) => {
        if (config) this.appConfig = config;
      });

    this.receiptForm.controls.smsEnabled.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((checked) => {
        const phoneControl = this.receiptForm.get('phone');
        phoneControl?.enable();
        if (checked) {
          phoneControl?.setValidators([
            Validators.required,
            Validators.minLength(10)
          ]);
        } else {
          phoneControl?.clearValidators();
        }
        phoneControl?.updateValueAndValidity();
      });

    this.receiptForm.controls.emailEnabled.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((checked) => {
        const emailControl = this.receiptForm.get('email');
        emailControl?.enable();
        if (checked) {
          emailControl?.setValidators([
            Validators.required,
            ValidationService.emailValidator
          ]);
        } else {
          emailControl?.clearValidators();
        }
        emailControl?.updateValueAndValidity();
      });
  }

  get transactionId() {
    return this.injectData.transactionId;
  }

  countryChanges(event: { isOpen: boolean }) {
    this.phoneCountryDropdownOpen.set(event.isOpen);
  }

  submit() {
    if (!this.canSubmitSignedReceiptRequest) {
      this.v4AlertService.warningAlert({
        content:
          'Your payment is currently pending. A receipt will be issued once the payment is successfully verified and completed.'
      });
      return;
    }

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
      this.v4AlertService.warningAlert({
        content: 'Please select at least one notification method (SMS or Email)'
      });
      return;
    }

    this.receiptForm.markAllAsTouched();
    if (this.receiptForm.invalid) return;

    let type: IPaymentsProofPayload['type'] = ['email', 'sms'];
    if (smsEnabled.value && !emailEnabled.value) type = ['sms'];
    if (emailEnabled.value && !smsEnabled.value) type = ['email'];
    if (smsEnabled.value && emailEnabled.value) type = ['email', 'sms'];

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

    const currentAttachments = this.attachments();
    if (currentAttachments.length > 0) {
      payload.attachment_ids = currentAttachments.map((a) =>
        this.previewData.type === 'CHECK' ? a.id : a.encrypted_id
      );
    }

    if (emailEnabled.value)
      payload.email = this.receiptForm.value.email as string;
    if (smsEnabled.value)
      payload.phone = this.receiptForm.value.phone as string;

    this.isSubmitting.set(true);
    this.paymentsService
      .sendPaymentReceipt(this.injectData.transactionId, payload)
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.v4AlertService.successAlert({ timeout: 1500 });
          this.dialogRef.close({ success: true });
        }
      });
  }

  onInput(e: Event) {
    this.description = (e.target as HTMLInputElement).value;
  }

  redraft() {
    if (
      !this.description ||
      this.description.length < 5 ||
      this.isRedrafting()
    ) {
      this.redraftError.set(true);
      return;
    }
    this.isRedrafting.set(true);
    this.redraftError.set(false);
    this.paymentsService
      .redraftSigedRecieptDescription(this.description)
      .pipe(
        finalize(() => this.isRedrafting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.description = res.data.corrected;
            this.receiptForm.patchValue({ memo: this.description });
          } else {
            this.v4AlertService.warningAlert({
              content: 'Failed to redraft description'
            });
          }
        },
        error: () => {
          this.v4AlertService.warningAlert({
            content: 'Failed to redraft description'
          });
        }
      });
  }

  addLogo() {
    this.showLogoCropper.set(true);
  }

  onLogoCropped(result: CroppedLogoResult) {
    this.selectedLogo = result;
    this.showLogoCropper.set(false);
  }

  onLogoCancel() {
    this.showLogoCropper.set(false);
  }

  onLogoRemoved() {
    this.selectedLogo = null;
    this.showLogoCropper.set(false);
  }

  removeLogo() {
    this.selectedLogo = null;
  }

  onPayerNameChange(event: string) {
    this.payerNamePreview = event;
    this.receiptForm.patchValue({ payerName: event });
  }

  onPayeeNameChange(event: string) {
    this.payeeNamePreview = event;
    this.receiptForm.patchValue({ payeeName: event });
  }

  onDescriptionChange(event: string) {
    this.description = event;
    this.receiptForm.patchValue({ memo: event });
  }

  addAttachment(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.csv,.xls,.xlsx,.txt,.rtf';
    fileInput.style.display = 'none';
    fileInput.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) this.handleAttachmentSelection(file);
      document.body.removeChild(fileInput);
    };
    document.body.appendChild(fileInput);
    fileInput.click();
  }

  handleAttachmentSelection(file: File): void {
    if (file.size > 10 * 1024 * 1024) {
      this.v4AlertService.warningAlert({
        content: 'File size must be less than 10MB'
      });
      return;
    }

    // Clear existing attachment before adding new one (single attachment only)
    const existing = this.attachments();
    if (existing.length > 0) {
      const id = existing[0].id || existing[0].encrypted_id;
      this.attachments.set([]);
      this.localFileMap.delete(id);
    }

    this.selectedAttachment.set({
      file,
      name: file.name,
      size: this.formatFileSize(file.size),
      type: file.type
    });
    this.saveAttachment(file);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  saveAttachment(file: File): void {
    this.isAttachmentUploading.set(true);
    const upload$ =
      this.previewData.type === 'CHECK'
        ? this.checkService.addCheckAttachment(this.injectData.zilId, file)
        : this.shareService.addNonCheckAttachment(file, this.injectData.zilId);

    upload$
      .pipe(
        finalize(() => this.isAttachmentUploading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: IApiRes<ICheckAttachmentData>) => {
        if (res?.success) {
          this.attachments.set([res.data]);
          const attachmentId = res.data.id || res.data.encrypted_id;
          if (attachmentId)
            this.localFileMap.set(attachmentId, {
              file,
              size: this.formatFileSize(file.size),
              type: file.type || 'Unknown'
            });
          this.selectedAttachment.set(null);
        }
      });
  }

  removeAttachment(attachment: ICheckAttachmentData): void {
    const attachmentId = attachment.id || attachment.encrypted_id;
    this.v4AlertService
      .confirmAlert({
        title: 'Delete Attachment',
        content: 'Are you sure you want to remove this attachment?',
        doneMsg: 'Delete',
        cancelMsg: 'Cancel'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.attachments.update((list) =>
            list.filter((a) => (a.id || a.encrypted_id) !== attachmentId)
          );
          this.localFileMap.delete(attachmentId);
        }
      });
  }

  getAttachmentSize(attachment: ICheckAttachmentData): string {
    const id = attachment.id || attachment.encrypted_id;
    return this.localFileMap.get(id)?.size ?? '--';
  }

  getAttachmentType(attachment: ICheckAttachmentData): string {
    const id = attachment.id || attachment.encrypted_id;
    return this.localFileMap.get(id)?.type ?? 'Unknown';
  }

  viewAttachment(attachment: ICheckAttachmentData): void {
    const attachmentId = attachment.id || attachment.encrypted_id;
    const entry = this.localFileMap.get(attachmentId);
    if (!entry) return;
    const blobUrl = URL.createObjectURL(entry.file);
    const newWindow = window.open(blobUrl, '_blank');
    if (
      !newWindow ||
      newWindow.closed ||
      typeof newWindow.closed === 'undefined'
    ) {
      this.v4AlertService.warningAlert({
        content:
          'A popup blocker may be preventing the application from opening the file. Please allow popups for this site.'
      });
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showPreview()) {
      event.preventDefault();
      this.showPreview.set(false);
    }
  }
}
