import {
  AfterViewInit,
  Component,
  DestroyRef,
  HostListener,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Utils } from 'src/app/data/utils';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCheck,
  faKey,
  faMessageDots
} from '@fortawesome/pro-regular-svg-icons';
import {
  faEnvelope,
  faHeadset,
  faMessage
} from '@fortawesome/pro-solid-svg-icons';
import { NgOptimizedImage } from '@angular/common';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { LocalStorageService } from '../../../../shared/service/storage/local-storage.service';
import { AuthV3Service } from '../../services/auth-v3.service';
import { ITwoFactorPayload } from '../../model/login';

@Component({
  selector: 'app-two-factor-auth',
  templateUrl: './two-factor-auth.component.html',
  styleUrls: ['./two-factor-auth.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    NgOptimizedImage,
    ReactiveFormsModule,
    V35ControlMessageComponent,
    WhiteLabelDirective,
    CommonButtonV35Component,
    CommonInputFieldComponent
  ]
})
export class TwoFactorAuthComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  public authV3Service = inject(AuthV3Service);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private fb = inject(FormBuilder);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private destroy$ = inject(DestroyRef);

  faArrowLeft = faArrowLeft;
  faCheck = faCheck;
  faMessageDots = faMessageDots;
  faKey = faKey;
  faMessage = faMessage;
  faEnvelope = faEnvelope;
  faHeadset = faHeadset;
  utils = Utils;
  public staticWhiteLabelConditions = StaticWhiteLabelConditions;

  // Component state
  twoFactShow = false;
  showDays = false;
  days = 1;
  rememberDeviceChecked = false;

  // Error states
  otpError = '';
  backupCodeError = '';

  // Track empty OTP boxes for red border
  emptyOtpBoxes: boolean[] = [false, false, false, false, false, false];

  // Duration options for remember device
  durationOptions = [
    { value: 1, label: '1 Day' },
    { value: 2, label: '1 Week' },
    { value: 3, label: '2 Weeks' },
    { value: 4, label: '1 Month' },
    { value: 5, label: '6 Months' }
  ];

  // Form
  twoFactorForm = new FormGroup({
    otpCode: new FormControl('', [Validators.required]),
    backupCode: new FormControl('', [
      Validators.minLength(8),
      Validators.maxLength(8),
      Validators.required
    ]),
    deviceName: new FormControl(''),
    rememberDevice: new FormControl(false),
    dateFrequency: new FormControl(1)
  });

  ngOnInit(): void {
    this.authV3Service.loadAppSettings();
    this.authV3Service.checkBrowserTabs();
    this.authV3Service.getQueryParams();
    this.initForm();
  }

  ngAfterViewInit() {
    this.addEnterKeyListener();
  }

  /**
   * Initialize the reactive form
   */
  initForm(): void {
    this.twoFactorForm = this.fb.group({
      otpCode: ['', [Validators.required]],
      backupCode: [
        '',
        [Validators.minLength(8), Validators.maxLength(8), Validators.required]
      ],
      deviceName: [''],
      rememberDevice: [false],
      dateFrequency: [1]
    });

    // Watch for remember device changes
    this.twoFactorForm
      .get('rememberDevice')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroy$))
      .subscribe((checked) => {
        this.rememberDeviceChecked = checked || false;
        if (checked) {
          this.showDays = true;
          this.days = 1;
          this.twoFactorForm.patchValue({ dateFrequency: 1 });
        } else {
          this.showDays = false;
        }
      });

    // Watch for date frequency changes
    this.twoFactorForm
      .get('dateFrequency')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroy$))
      .subscribe((value) => {
        this.days = value || 1;
      });

    // Clear backup code error when user types
    this.twoFactorForm
      .get('backupCode')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroy$))
      .subscribe(() => {
        this.backupCodeError = '';
      });
  }

  /**
   * Get OTP string from input boxes
   */
  getOtpString(): string {
    let otpStr = '';
    for (let i = 1; i <= 6; i += 1) {
      const input = document.getElementById(`otp${i}`) as HTMLInputElement;
      if (input) {
        otpStr += input.value || '';
      }
    }
    return otpStr;
  }

  /**
   * Update otpCode form control from input boxes
   */
  updateOtpFormControl(): void {
    const otpStr = this.getOtpString();
    this.twoFactorForm.patchValue({ otpCode: otpStr });
    // Clear error and empty box tracking when user types
    this.otpError = '';
    this.emptyOtpBoxes = [false, false, false, false, false, false];
  }

  /**
   * Switch to SMS Code tab
   */
  useOtp(): void {
    this.twoFactShow = false;
    this.otpError = '';
    this.backupCodeError = '';
    this.emptyOtpBoxes = [false, false, false, false, false, false];
  }

  /**
   * Switch to Backup Code tab
   */
  twoAuth(): void {
    this.twoFactShow = true;
    this.otpError = '';
    this.backupCodeError = '';
    this.emptyOtpBoxes = [false, false, false, false, false, false];
  }

  /**
   * Select days for remember device
   */
  selectDays(frequency: number): void {
    this.days = frequency;
    this.twoFactorForm.patchValue({ dateFrequency: frequency });
  }

  /**
   * Handle OTP keyup for navigation
   */
  onKeyUpEvent(
    event: KeyboardEvent,
    nextInput: HTMLInputElement,
    prevInput: HTMLInputElement
  ): void {
    const input = event.target as HTMLInputElement;
    const { value } = input;

    // Update form control
    this.updateOtpFormControl();

    if (event.key === 'Backspace' && !value && prevInput) {
      prevInput.focus();
      prevInput.select();
    } else if (value && nextInput && nextInput !== input) {
      nextInput.focus();
      nextInput.select();
    }
  }

  /**
   * Handle paste event for OTP inputs
   */
  handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);

    if (digits.length > 0) {
      digits.split('').forEach((digit, index) => {
        const input = document.getElementById(
          `otp${index + 1}`
        ) as HTMLInputElement;
        if (input) {
          input.value = digit;
        }
      });

      // Update form control
      this.updateOtpFormControl();

      // Focus last filled input or the next empty one
      const focusIndex = Math.min(digits.length, 6);
      const nextInput = document.getElementById(
        `otp${focusIndex}`
      ) as HTMLInputElement;
      nextInput?.focus();
    }
  }

  /**
   * Clear OTP fields
   */
  clearOtpFields(): void {
    for (let i = 1; i <= 6; i += 1) {
      const input = document.getElementById(`otp${i}`) as HTMLInputElement;
      if (input) {
        input.value = '';
      }
    }
    this.twoFactorForm.patchValue({ otpCode: '' });
    this.otpError = '';
    this.emptyOtpBoxes = [false, false, false, false, false, false];

    const firstInput = document.getElementById('otp1') as HTMLInputElement;
    firstInput?.focus();
  }

  /**
   * Resend OTP
   */
  resendOtp(): void {
    this.clearOtpFields();
    this.authV3Service.resendOtpClick();
  }

  /**
   * Validate OTP and mark empty boxes
   */
  validateOtp(): boolean {
    const otpString = this.getOtpString();

    // Check which boxes are empty
    const newEmptyBoxes: boolean[] = [];
    for (let i = 1; i <= 6; i += 1) {
      const input = document.getElementById(`otp${i}`) as HTMLInputElement;
      newEmptyBoxes.push(!input?.value);
    }
    this.emptyOtpBoxes = newEmptyBoxes;

    if (otpString.length === 0) {
      this.otpError = 'OTP is required';
      return false;
    }
    if (otpString.length < 6) {
      this.otpError = 'Invalid OTP';
      return false;
    }
    this.otpError = '';
    this.emptyOtpBoxes = [false, false, false, false, false, false];
    return true;
  }

  /**
   * Validate Backup Code
   */
  validateBackupCode(): boolean {
    const backupCode = this.twoFactorForm.get('backupCode')?.value || '';
    if (!backupCode) {
      this.backupCodeError = 'Please enter backup code';
      return false;
    }
    if (backupCode.length < 8) {
      this.backupCodeError = 'Invalid backup code';
      return false;
    }
    this.backupCodeError = '';
    return true;
  }

  /**
   * Submit the form
   */
  onSubmit(): void {
    const formValue = this.twoFactorForm.value;
    const isBackupMode = this.twoFactShow;
    this.twoFactorForm.markAllAsTouched();

    // Validation
    if (!isBackupMode) {
      if (!this.validateOtp()) {
        return;
      }
    } else if (!this.validateBackupCode()) {
      return;
    }

    const otpString = this.getOtpString();
    const payload: ITwoFactorPayload = {
      otpCode: isBackupMode ? '' : otpString,
      rememberDevice: formValue.rememberDevice ? 1 : 0,
      dateFrequency: formValue.rememberDevice
        ? (formValue.dateFrequency ?? 0)
        : 0,
      deviceName: formValue.deviceName || '',
      backupActivated: isBackupMode ? 1 : 0,
      backupCode: isBackupMode ? Number(formValue.backupCode) : 0
    };
    this.authV3Service.submitTwoFactor(payload, () => this.clearOtpFields());
  }

  @HostListener('window:popstate')
  onPopState() {
    this.localStorageService.clearLocalStorage();
    this.router.navigateByUrl('/login');
  }

  addEnterKeyListener() {
    const inputs = document.querySelectorAll<HTMLInputElement>('.otp-input');

    if (inputs) {
      inputs.forEach((input) => {
        input.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            this.onSubmit();
          }
        });
      });
    }
  }

  /**
   * Open live chat
   */
  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  ngOnDestroy(): void {
    this.authV3Service.twoFactorsubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.authV3Service.unSubscibeCommonSubscription();
  }
}
