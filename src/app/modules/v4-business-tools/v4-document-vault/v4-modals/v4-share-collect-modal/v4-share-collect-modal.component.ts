import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
  signal
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faShareNodes } from '@fortawesome/pro-solid-svg-icons';
import {
  faWhatsapp,
  faFacebookF,
  faXTwitter,
  faLinkedinIn
} from '@fortawesome/free-brands-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { SocialShareModalComponent } from 'src/app/shared/modal/social-share-modal/social-share-modal.component';
import { socialShareData } from 'src/app/shared/modal/social-share-modal/share-url-builder.util';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonToggleV4Component } from 'src/app/shared/V4/common-toggle-v4/common-toggle-v4.component';
import {
  LucideAngularModule,
  X,
  Link,
  Link2,
  Copy,
  Mail,
  MessageCircle,
  Share2,
  Upload,
  Shield,
  FileText,
  Clock
} from 'lucide-angular';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { NgClass } from '@angular/common';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { DocumentVaultService } from '../../v4-services/v4-document-vault.service';

@Component({
  selector: 'app-v4-share-collect-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    LucideAngularModule,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    CommonButtonV4Component,
    PhoneInputV4Component,
    MatTooltipModule,
    CommonToggleV4Component,
    MatDialogClose,
    NgClass,
    FaIconComponent,
    TruncatePipe
  ],
  templateUrl: './v4-share-collect-modal.component.html',
  styleUrl: './v4-share-collect-modal.component.scss'
})
export class V4ShareCollectModalComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private data: { currentFolderId?: string; mode?: 'collect' | 'download' } =
    inject(MAT_DIALOG_DATA);

  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<V4ShareCollectModalComponent>);
  private documentVaultService = inject(DocumentVaultService);
  private destroyRef = inject(DestroyRef);
  private alertService = inject(V4AlertService);
  private payeeService = inject(PayeeService);

  // Lucide Icons
  readonly XIcon = X;
  readonly LinkIcon = Link;
  readonly Link2Icon = Link2;
  readonly CopyIcon = Copy;
  readonly MailIcon = Mail;
  readonly MessageCircleIcon = MessageCircle;
  readonly Share2Icon = Share2;
  readonly UploadIcon = Upload;
  readonly ShieldIcon = Shield;
  readonly FileTextIcon = FileText;
  readonly ClockIcon = Clock;

  mode: 'collect' | 'download' = 'collect';

  // Payee suggestions for email autocomplete
  payeeSuggestions = signal<IPayeeDropdown[]>([]);
  showPayeeSuggestions = signal(false);
  isLoadingPayees = signal(false);
  private emailSearchSubject = new Subject<string>();

  shareForm: FormGroup;
  loading = false;
  uploadedLogo: File | null = null;
  logoPreview: string | null = null;
  shareableLink: string = '';
  shareToken: string = '';
  companyInitial: string = 'Z';
  showShareOptions = false;
  showEmailInput = false;
  showPhoneInput = false;
  urlCopied = false;
  sendingEmail = false;
  sendingSMS = false;

  readonly faShareNod = faShareNodes;
  readonly socialShareData = socialShareData;
  readonly quickShareIcons: Record<string, IconDefinition> = {
    whatsapp: faWhatsapp,
    facebook: faFacebookF,
    x: faXTwitter,
    linkedin: faLinkedinIn
  };

  ngOnInit(): void {
    this.mode = this.data.mode || 'collect';

    this.shareForm = this.fb.group({
      companyName: ['', [Validators.required]],
      message: [''],
      pinProtectionEnabled: [false],
      pinCode: ['', [Validators.pattern(/^(\d{4}|\d{6})$/)]],
      uploadLimitEnabled: [false],
      maxFiles: [1, [Validators.min(1)]],
      linkExpiryEnabled: [false],
      expiryDays: [7, [Validators.min(1)]],
      folder_id: [this.data.currentFolderId || ''],
      emailToShare: ['', [ValidationService.emailValidator]],
      phoneToShare: ['']
    });

    this.shareableLink = 'Generating link...';

    this.shareForm.get('companyName')?.valueChanges.subscribe((value) => {
      if (value && value.length > 0) {
        this.companyInitial = value.charAt(0).toUpperCase();
      }
    });

    this.shareForm
      .get('pinProtectionEnabled')
      ?.valueChanges.subscribe((enabled) => {
        const pinControl = this.shareForm.get('pinCode');
        if (enabled) {
          pinControl?.setValidators([
            Validators.required,
            Validators.pattern(/^(\d{4}|\d{6})$/)
          ]);
        } else {
          pinControl?.setValidators([Validators.pattern(/^(\d{4}|\d{6})$/)]);
          pinControl?.setValue('');
        }
        pinControl?.updateValueAndValidity();
      });

    this.emailSearchSubject
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((searchTerm) => {
        this.searchPayees(searchTerm);
      });

    this.generateLink(false);
  }

  onEmailInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const { value } = input;
    if (value && value.length >= 2) {
      this.emailSearchSubject.next(value);
      this.showPayeeSuggestions.set(true);
    } else {
      this.payeeSuggestions.set([]);
      this.showPayeeSuggestions.set(false);
    }
  }

  searchPayees(term: string): void {
    if (!term || term.length < 2) {
      this.payeeSuggestions.set([]);
      return;
    }
    this.isLoadingPayees.set(true);
    this.payeeService
      .getPayees(1, term)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoadingPayees.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const payeesWithEmail = res.data.filter(
              (payee) => payee.email && payee.email.trim() !== ''
            );
            this.payeeSuggestions.set(payeesWithEmail);
          }
        }
      });
  }

  selectPayeeSuggestion(payee: IPayeeDropdown): void {
    if (payee.email) {
      this.shareForm.get('emailToShare')?.setValue(payee.email);
    }
    this.showPayeeSuggestions.set(false);
    this.payeeSuggestions.set([]);
  }

  hidePayeeSuggestions(): void {
    setTimeout(() => {
      this.showPayeeSuggestions.set(false);
    }, 200);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleLogoFile(input.files[0]);
      input.value = '';
    }
  }

  openFileBrowser(): void {
    this.fileInput.nativeElement.click();
  }

  handleLogoFile(file: File): void {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 20 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      this.alertService.failedAlert({
        content: 'Only PNG and JPEG images are allowed',
        title: 'Invalid File Type'
      });
      return;
    }

    if (file.size > maxSize) {
      this.alertService.failedAlert({
        content: 'Logo size must be less than 20MB',
        title: 'File Too Large'
      });
      return;
    }

    this.uploadedLogo = file;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.logoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.uploadedLogo = null;
    this.logoPreview = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  generateLink(validateForm: boolean = true): void {
    if (validateForm) {
      this.shareForm.markAllAsTouched();
      if (this.shareForm.invalid) {
        return;
      }
    }

    this.loading = true;
    const formValue = this.shareForm.value;
    const formData = new FormData();

    if (this.shareToken) {
      formData.append('share_token', this.shareToken);
    }

    formData.append('company_name', formValue.companyName);

    if (formValue.message) {
      formData.append('message', formValue.message);
    }

    if (formValue.folder_id) {
      formData.append('folder_id', formValue.folder_id);
    }

    if (formValue.pinProtectionEnabled && formValue.pinCode) {
      formData.append('pin', formValue.pinCode);
    }

    if (this.mode === 'collect' && formValue.uploadLimitEnabled) {
      formData.append('max_uploads', formValue.maxFiles.toString());
    } else if (this.mode === 'download' && formValue.uploadLimitEnabled) {
      formData.append('max_downloads', formValue.maxFiles.toString());
    }

    if (formValue.linkExpiryEnabled && formValue.expiryDays) {
      formData.append('expiry_days', formValue.expiryDays.toString());
    }

    if (this.uploadedLogo) {
      formData.append('logo', this.uploadedLogo);
    }

    const isVaultLevel = !formValue.folder_id;

    let apiCall;
    if (this.mode === 'collect') {
      apiCall = isVaultLevel
        ? this.documentVaultService.createVaultUploadLink(formData)
        : this.documentVaultService.createShareCollectLink(formData);
    } else {
      apiCall = isVaultLevel
        ? this.documentVaultService.generateVaultDownloadLink(formData)
        : this.documentVaultService.generateDownloadLink(formData);
    }

    apiCall
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            const isUpdate =
              this.shareableLink && this.shareableLink !== 'Generating link...';
            this.shareableLink = res.data.share_link;
            this.shareToken = res.data.share_token;

            if (this.shareForm.touched) {
              const linkType = this.mode === 'collect' ? 'Share' : 'Download';
              this.alertService.successAlert({
                content: isUpdate
                  ? `${linkType} link updated successfully`
                  : `${linkType} link created successfully`,
                title: 'Success'
              });
            }
          }
        }
      });
  }

  incrementMaxFiles(): void {
    const currentValue = this.shareForm.get('maxFiles')?.value || 1;
    this.shareForm.patchValue({ maxFiles: currentValue + 1 });
  }

  decrementMaxFiles(): void {
    const currentValue = this.shareForm.get('maxFiles')?.value || 1;
    if (currentValue > 1) {
      this.shareForm.patchValue({ maxFiles: currentValue - 1 });
    }
  }

  incrementExpiryDays(): void {
    const currentValue = this.shareForm.get('expiryDays')?.value || 1;
    this.shareForm.patchValue({ expiryDays: currentValue + 1 });
  }

  decrementExpiryDays(): void {
    const currentValue = this.shareForm.get('expiryDays')?.value || 1;
    if (currentValue > 1) {
      this.shareForm.patchValue({ expiryDays: currentValue - 1 });
    }
  }

  copyLink(): void {
    if (this.shareableLink) {
      navigator.clipboard.writeText(this.shareableLink).then(() => {
        this.urlCopied = true;
        this.alertService.successAlert({
          content: 'Link copied to clipboard',
          title: 'Success'
        });
        setTimeout(() => {
          this.urlCopied = false;
        }, 2000);
      });
    }
  }

  toggleEmailInput(): void {
    this.showEmailInput = !this.showEmailInput;
    this.showPhoneInput = false;
    if (this.showEmailInput) {
      this.shareForm
        .get('emailToShare')
        ?.setValidators([
          Validators.required,
          ValidationService.emailValidator
        ]);
    } else {
      this.shareForm.get('emailToShare')?.clearValidators();
      this.shareForm.get('emailToShare')?.setValue('');
    }
    this.shareForm.get('emailToShare')?.updateValueAndValidity();
  }

  togglePhoneInput(): void {
    this.showPhoneInput = !this.showPhoneInput;
    this.showEmailInput = false;
    if (this.showPhoneInput) {
      this.shareForm
        .get('phoneToShare')
        ?.setValidators([Validators.required, Validators.minLength(10)]);
    } else {
      this.shareForm.get('phoneToShare')?.clearValidators();
      this.shareForm.get('phoneToShare')?.setValue('');
    }
    this.shareForm.get('phoneToShare')?.updateValueAndValidity();
  }

  shareViaEmail(): void {
    const emailControl = this.shareForm.get('emailToShare');
    emailControl?.markAsTouched();
    if (!emailControl || emailControl.invalid || !this.shareToken) return;

    this.sendingEmail = true;
    const apiCall =
      this.mode === 'collect'
        ? this.documentVaultService.sendShareLink(this.shareToken, {
            share_token: this.shareToken,
            email: emailControl.value,
            type: 1
          })
        : this.documentVaultService.sendDownloadLink(this.shareToken, {
            share_token: this.shareToken,
            email: emailControl.value,
            type: 1
          });

    apiCall
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.sendingEmail = false;
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: `Link sent to ${emailControl.value}`,
              title: 'Success'
            });
            emailControl.setValue('');
            this.showEmailInput = false;
            this.dialogRef.close(true);
          }
        }
      });
  }

  shareViaSMS(): void {
    const phoneControl = this.shareForm.get('phoneToShare');
    phoneControl?.markAsTouched();
    if (!phoneControl || phoneControl.invalid || !this.shareToken) return;

    this.sendingSMS = true;
    const apiCall =
      this.mode === 'collect'
        ? this.documentVaultService.sendShareLink(this.shareToken, {
            share_token: this.shareToken,
            phone: phoneControl.value,
            type: 2
          })
        : this.documentVaultService.sendDownloadLink(this.shareToken, {
            share_token: this.shareToken,
            phone: phoneControl.value,
            type: 2
          });

    apiCall
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.sendingSMS = false;
        })
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.alertService.successAlert({
              content: `SMS sent to ${phoneControl.value}`,
              title: 'Success'
            });
            phoneControl.setValue('');
            this.showPhoneInput = false;
            this.dialogRef.close(true);
          }
        }
      });
  }

  shareViaWhatsApp(): void {
    const action = this.mode === 'collect' ? 'upload' : 'download';
    const message = encodeURIComponent(
      `Please use this link to ${action} files: ${this.shareableLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  shareUrlDirect(url: string, name: string): void {
    if (!url) return;
    const item = this.socialShareData.find((i) => i.name === name);
    if (!item) return;
    const action = this.mode === 'collect' ? 'upload' : 'download';
    const message = `Please use this link to ${action} files.`;
    let shareUrl: string;
    if (name === 'WhatsApp') {
      shareUrl = item.url.replace(
        '{url}',
        encodeURIComponent(`${message} ${url}`)
      );
    } else if (name === 'Facebook') {
      shareUrl = item.url.replace('{url}', encodeURIComponent(url));
      shareUrl += `&quote=${encodeURIComponent(message)}`;
    } else if (name === 'X') {
      shareUrl = item.url.replace('{url}', encodeURIComponent(url));
      shareUrl += `&text=${encodeURIComponent(message)}`;
    } else if (name === 'LinkedIn') {
      shareUrl = item.url.replace('{url}', encodeURIComponent(url));
      shareUrl += `&summary=${encodeURIComponent(message)}`;
    } else {
      shareUrl = item.url.replace('{url}', encodeURIComponent(url));
    }
    window.open(shareUrl, '_blank');
  }

  openSocialShareModal(url: string): void {
    if (!url) return;
    this.dialog.open(SocialShareModalComponent, {
      width: '448px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        url,
        title:
          this.mode === 'collect' ? 'Share Upload Link' : 'Share Download Link'
      }
    });
  }

  toggleMoreShareCard(): void {
    this.showShareOptions = !this.showShareOptions;
    // When the share row is collapsed, also hide any email/phone inputs that
    // were opened from inside it so nothing remains dangling below.
    if (!this.showShareOptions) {
      this.showEmailInput = false;
      this.showPhoneInput = false;
      this.shareForm.get('emailToShare')?.clearValidators();
      this.shareForm.get('emailToShare')?.setValue('');
      this.shareForm.get('emailToShare')?.updateValueAndValidity();
      this.shareForm.get('phoneToShare')?.clearValidators();
      this.shareForm.get('phoneToShare')?.setValue('');
      this.shareForm.get('phoneToShare')?.updateValueAndValidity();
    }
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
