import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { CommonToggleV4Component } from 'src/app/shared/V4/common-toggle-v4/common-toggle-v4.component';
import {
  LucideAngularModule,
  X,
  Share2,
  Link,
  Link2,
  Copy,
  Upload,
  Mail,
  MessageCircle,
  Shield,
  FileText,
  Clock
} from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
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
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { NgClass } from '@angular/common';
import { DocumentVaultService } from '../../v4-services/v4-document-vault.service';

@Component({
  selector: 'app-v4-share-file-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    CommonButtonV4Component,
    MatDialogClose,
    CommonToggleV4Component,
    MatTooltipModule,
    PhoneInputV4Component,
    NgClass,
    FaIconComponent,
    TruncatePipe
  ],
  templateUrl: './v4-share-file-modal.component.html',
  styleUrls: ['./v4-share-file-modal.component.scss']
})
export class V4ShareFileModalComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private data: {
    fileId?: string;
    folderId?: string;
    type: 'file' | 'folder';
  } = inject(MAT_DIALOG_DATA);

  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<V4ShareFileModalComponent>);
  private documentVaultService = inject(DocumentVaultService);
  private destroyRef = inject(DestroyRef);
  private alertService = inject(V4AlertService);

  readonly XIcon = X;
  readonly Share2Icon = Share2;
  readonly LinkIcon = Link;
  readonly Link2Icon = Link2;
  readonly CopyIcon = Copy;
  readonly UploadIcon = Upload;
  readonly MailIcon = Mail;
  readonly MessageCircleIcon = MessageCircle;
  readonly ShieldIcon = Shield;
  readonly FileTextIcon = FileText;
  readonly ClockIcon = Clock;

  readonly faShareNod = faShareNodes;
  readonly socialShareData = socialShareData;
  readonly quickShareIcons: Record<string, IconDefinition> = {
    whatsapp: faWhatsapp,
    facebook: faFacebookF,
    x: faXTwitter,
    linkedin: faLinkedinIn
  };

  shareForm: FormGroup;
  isSubmitting = signal(false);
  shareableLink = '';
  shareToken = '';
  loading = false;
  uploadedLogo: File | null = null;
  logoPreview: string | null = null;
  urlCopied = false;
  showShareOptions = false;
  showEmailInput = false;
  showPhoneInput = false;
  sendingEmail = false;
  sendingSMS = false;

  ngOnInit(): void {
    this.shareForm = this.fb.group({
      companyName: ['', [Validators.required]],
      message: [''],
      pinProtectionEnabled: [false],
      pinCode: ['', [Validators.pattern(/^(\d{4}|\d{6})$/)]],
      downloadLimitEnabled: [false],
      max_downloads: [1, [Validators.min(1)]],
      linkExpiryEnabled: [false],
      expiryDays: [7, [Validators.min(1)]],
      folder_id: [this.data.folderId || ''],
      file_id: [this.data.fileId || ''],
      emailToShare: [''],
      phoneToShare: ['']
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

    this.shareableLink = 'Generating link...';
    this.generateLink(false);
  }

  generateLink(validateForm: boolean = true): void {
    if (validateForm) {
      this.shareForm.markAllAsTouched();
      if (this.shareForm.invalid) return;
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
    } else if (formValue.file_id) {
      formData.append('file_id', formValue.file_id);
    }

    if (formValue.pinProtectionEnabled && formValue.pinCode) {
      formData.append('pin', formValue.pinCode);
    }

    if (formValue.downloadLimitEnabled) {
      formData.append('max_downloads', formValue.max_downloads.toString());
    }

    if (formValue.linkExpiryEnabled && formValue.expiryDays) {
      formData.append('expiry_days', formValue.expiryDays.toString());
    }

    if (this.uploadedLogo) {
      formData.append('logo', this.uploadedLogo);
    }

    const isVaultLevel = !formValue.folder_id && !formValue.file_id;
    const apiCall = isVaultLevel
      ? this.documentVaultService.generateVaultDownloadLink(formData)
      : this.documentVaultService.generateDownloadLink(formData);

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
              this.alertService.successAlert({
                content: isUpdate
                  ? 'Share link updated successfully'
                  : 'Share link created successfully',
                title: 'Success'
              });
            }
          }
        },
        error: (error) => {
          if (error.status === 403) {
            this.alertService.failedAlert({
              content: error.error.errorMsg || 'Access denied'
            });
            this.dialogRef.close();
          }
        }
      });
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

  incrementMaxDownloads(): void {
    const val = this.shareForm.get('max_downloads')?.value || 1;
    this.shareForm.patchValue({ max_downloads: val + 1 });
  }

  decrementMaxDownloads(): void {
    const val = this.shareForm.get('max_downloads')?.value || 1;
    if (val > 1) this.shareForm.patchValue({ max_downloads: val - 1 });
  }

  incrementExpiryDays(): void {
    const val = this.shareForm.get('expiryDays')?.value || 1;
    this.shareForm.patchValue({ expiryDays: val + 1 });
  }

  decrementExpiryDays(): void {
    const val = this.shareForm.get('expiryDays')?.value || 1;
    if (val > 1) this.shareForm.patchValue({ expiryDays: val - 1 });
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
    this.documentVaultService
      .sendDownloadLink(this.shareToken, {
        share_token: this.shareToken,
        email: emailControl.value,
        type: 1
      })
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
          }
        }
      });
  }

  shareViaSMS(): void {
    const phoneControl = this.shareForm.get('phoneToShare');
    phoneControl?.markAsTouched();
    if (!phoneControl || phoneControl.invalid || !this.shareToken) return;

    this.sendingSMS = true;
    this.documentVaultService
      .sendDownloadLink(this.shareToken, {
        share_token: this.shareToken,
        phone: phoneControl.value,
        type: 2
      })
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
          }
        }
      });
  }

  shareViaWhatsApp(): void {
    const message = encodeURIComponent(
      `Please use this link to download files: ${this.shareableLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  shareViaFacebook(): void {
    const url = encodeURIComponent(this.shareableLink);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank'
    );
  }

  shareViaX(): void {
    const url = encodeURIComponent(this.shareableLink);
    window.open(`https://x.com/share?url=${url}`, '_blank');
  }

  shareUrlDirect(url: string, name: string): void {
    if (!url) return;
    const item = this.socialShareData.find((i) => i.name === name);
    if (!item) return;
    const message = `Please use this link to download files.`;
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
      shareUrl = item.url
        .replace('{url}', encodeURIComponent(url))
        .replace('{text}', encodeURIComponent(message));
    } else {
      shareUrl = item.url.replace('{url}', encodeURIComponent(url));
    }
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  openSocialShareModal(url: string): void {
    if (!url) return;
    this.dialog.open(SocialShareModalComponent, {
      width: '448px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        url,
        title: 'Share Download Link'
      }
    });
  }

  toggleMoreShareCard(): void {
    this.showShareOptions = !this.showShareOptions;
  }
}
