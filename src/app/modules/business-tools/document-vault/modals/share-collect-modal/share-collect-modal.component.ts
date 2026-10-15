import { Component, DestroyRef, ElementRef, inject, OnInit, ViewChild, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatDialogRef,  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark, faArrowUpFromLine, faShield, faFile, faClock, faCopy, faChevronUp, faChevronDown, faShareNodes, faLink, faEnvelope, faMessage, faEllipsis, faCircleQuestion, faDownload } from '@fortawesome/pro-solid-svg-icons';
import { faWhatsapp, faFacebook, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { NgClass } from '@angular/common';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { DocumentVaultService } from '../../services/document-vault.service';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';

@Component({
  selector: 'app-share-collect-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    FaIconComponent,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    CommonButtonV35Component,
    NewPhoneInputComponent,
    MatTooltipModule,
    NgClass
  ],
  templateUrl: './share-collect-modal.component.html',
  styleUrl: './share-collect-modal.component.scss'
})
export class ShareCollectModalComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private data: { currentFolderId?: string; mode?: 'collect' | 'download' } = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ShareCollectModalComponent>);
  private documentVaultService = inject(DocumentVaultService);
  private destroyRef = inject(DestroyRef);
  private alertService = inject(AlertService);
  private payeeService = inject(PayeeService);

  mode: 'collect' | 'download' = 'collect';

  // Payee suggestions for email autocomplete
  payeeSuggestions = signal<IPayeeDropdown[]>([]);
  showPayeeSuggestions = signal(false);
  isLoadingPayees = signal(false);
  private emailSearchSubject = new Subject<string>();

  faXmark = faXmark;
  faUpload = faArrowUpFromLine;
  faShield = faShield;
  faFile = faFile;
  faClock = faClock;
  faCopy = faCopy;
  faChevronUp = faChevronUp;
  faChevronDown = faChevronDown;
  faShareNodes = faShareNodes;
  faLink = faLink;
  faEnvelope = faEnvelope;
  faMessage = faMessage;
  faWhatsapp = faWhatsapp;
  faFacebook = faFacebook;
  faXTwitter = faXTwitter;
  faEllipsis = faEllipsis;
  faCircleQuestion = faCircleQuestion;
  faDownload = faDownload;
  faArrowUpFromLine = faArrowUpFromLine;

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

    this.shareForm.get('companyName')?.valueChanges.subscribe(value => {
      if (value && value.length > 0) {
        this.companyInitial = value.charAt(0).toUpperCase();
      }
    });

    this.shareForm.get('pinProtectionEnabled')?.valueChanges.subscribe(enabled => {
      const pinControl = this.shareForm.get('pinCode');
      if (enabled) {
        pinControl?.setValidators([Validators.required, Validators.pattern(/^(\d{4}|\d{6})$/)]);
      } else {
        pinControl?.setValidators([Validators.pattern(/^(\d{4}|\d{6})$/)]);
        pinControl?.setValue('');
      }
      pinControl?.updateValueAndValidity();
    });

    // Setup payee email search with debounce
    this.emailSearchSubject
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(searchTerm => {
        this.searchPayees(searchTerm);
      });

    this.generateLink(false);
  }

  /**
   * Handles email input changes and triggers payee search
   */
  onEmailInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && value.length >= 2) {
      this.emailSearchSubject.next(value);
      this.showPayeeSuggestions.set(true);
    } else {
      this.payeeSuggestions.set([]);
      this.showPayeeSuggestions.set(false);
    }
  }

  /**
   * Searches for payees based on the search term
   */
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
            // Filter payees that have an email
            const payeesWithEmail = res.data.filter(payee => payee.email && payee.email.trim() !== '');
            this.payeeSuggestions.set(payeesWithEmail);
          }
        }
      });
  }

  /**
   * Selects a payee from the suggestions and fills the email field
   */
  selectPayeeSuggestion(payee: IPayeeDropdown): void {
    if (payee.email) {
      this.shareForm.get('emailToShare')?.setValue(payee.email);
    }
    this.showPayeeSuggestions.set(false);
    this.payeeSuggestions.set([]);
  }

  /**
   * Hides the payee suggestions dropdown
   */
  hidePayeeSuggestions(): void {
    // Use setTimeout to allow click event on suggestion to fire first
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

    // Create preview
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
            const isUpdate = this.shareableLink && this.shareableLink !== 'Generating link...';
            this.shareableLink = res.data.share_link;
            this.shareToken = res.data.share_token;

            if (this.shareForm.touched) {
              const linkType = this.mode === 'collect' ? 'Share' : 'Download';
              this.alertService.successAlert({
                content: isUpdate ? `${linkType} link updated successfully` : `${linkType} link created successfully`,
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

  toggleShareOptions(): void {
    this.showShareOptions = !this.showShareOptions;
    if (!this.showShareOptions) {
      this.showEmailInput = false;
      this.showPhoneInput = false;
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
      this.shareForm.get('emailToShare')?.setValidators([Validators.required, ValidationService.emailValidator]);
      this.shareForm.get('phoneToShare')?.clearValidators();
    } else {
      this.shareForm.get('emailToShare')?.clearValidators();
      this.shareForm.get('emailToShare')?.setValue('');
    }
    this.shareForm.get('emailToShare')?.updateValueAndValidity();
    this.shareForm.get('phoneToShare')?.updateValueAndValidity();
  }

  togglePhoneInput(): void {
    this.showPhoneInput = !this.showPhoneInput;
    this.showEmailInput = false;
    if (this.showPhoneInput) {
      this.shareForm.get('phoneToShare')?.setValidators([Validators.required, Validators.minLength(10)]);
      this.shareForm.get('emailToShare')?.clearValidators();
    } else {
      this.shareForm.get('phoneToShare')?.clearValidators();
      this.shareForm.get('phoneToShare')?.setValue('');
    }
    this.shareForm.get('emailToShare')?.updateValueAndValidity();
    this.shareForm.get('phoneToShare')?.updateValueAndValidity();
  }

  shareViaEmail(): void {
    const emailControl = this.shareForm.get('emailToShare');
    emailControl?.markAsTouched();

    if (!emailControl || emailControl.invalid) {
      if (emailControl?.hasError('required')) {
        this.alertService.failedAlert({
          content: 'Please enter an email address',
          title: 'Validation Error'
        });
      } else if (emailControl?.hasError('email')) {
        this.alertService.failedAlert({
          content: 'Please enter a valid email address',
          title: 'Validation Error'
        });
      }
      return;
    }

    if (!this.shareToken) {
      this.alertService.failedAlert({
        content: 'Please generate a link first',
        title: 'Error'
      });
      return;
    }

    this.sendingEmail = true;
    const apiCall = this.mode === 'collect'
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
              content: `Link sent successfully to ${emailControl.value}`,
              title: 'Success'
            });
            emailControl.setValue('');
            this.showEmailInput = false;
            this.dialogRef.close(true);
          }
        },
      });
  }

  shareViaSMS(): void {
    const phoneControl = this.shareForm.get('phoneToShare');
    phoneControl?.markAsTouched();

    if (!phoneControl || phoneControl.invalid) {
      if (phoneControl?.hasError('required')) {
        this.alertService.failedAlert({
          content: 'Please enter a phone number',
          title: 'Validation Error'
        });
      } else if (phoneControl?.hasError('minlength')) {
        this.alertService.failedAlert({
          content: 'Please enter a valid phone number',
          title: 'Validation Error'
        });
      }
      return;
    }

    if (!this.shareToken) {
      this.alertService.failedAlert({
        content: 'Please generate a link first',
        title: 'Error'
      });
      return;
    }

      this.sendingSMS = true;
      const apiCall = this.mode === 'collect'
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
                content: `SMS sent successfully to ${phoneControl.value}`,
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
    const message = encodeURIComponent(`Please use this link to ${action} files: ${this.shareableLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  shareViaFacebook(): void {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareableLink)}`, '_blank');
  }

  shareViaTwitter(): void {
    const text = this.mode === 'collect' ? 'File Upload Request' : 'File Download Link';
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(this.shareableLink)}&text=${encodeURIComponent(text)}`, '_blank');
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
