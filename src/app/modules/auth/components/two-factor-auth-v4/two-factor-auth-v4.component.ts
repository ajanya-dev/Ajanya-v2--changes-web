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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { catchError, of } from 'rxjs';
import {
  LucideAngularModule,
  ArrowLeft,
  ShieldCheck,
  Phone,
  Building2,
  UserCheck,
  Shield,
  Key,
  CreditCard,
  Globe,
  FileText
} from 'lucide-angular';
import { Utils } from 'src/app/data/utils';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Subscription } from 'rxjs';
import { LocalStorageService } from '../../../../shared/service/storage/local-storage.service';
import { AuthV3Service } from '../../services/auth-v3.service';
import { AuthRepository } from '../../repository/auth.repository';
import { AuthDataService } from '../../../../shared/service/auth/auth-data.service';
import { V4AlertService } from '../../../../shared/service/alert/v4-alert.service';
import { ILoginDetails, ITwoFactorPayload } from '../../model/login';
import { IApiResSuccessOnly } from '../../../../models/api';
import { CommonInputFieldV4Component } from '../../../../shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from '../../../../shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from '../../../../shared/V4/control-message-v4/control-message-v4.component';
import { V4ContactSupportModalComponent } from '../../../../shared/modal/v4-contact-support-modal/v4-contact-support-modal.component';

@Component({
  selector: 'app-two-factor-auth-v4',
  templateUrl: './two-factor-auth-v4.component.html',
  styleUrls: ['./two-factor-auth-v4.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    ReactiveFormsModule,
    LucideAngularModule,
    WhiteLabelDirective,
    CommonInputFieldV4Component,
    CommonButtonV4Component,
    V4ControlMessageComponent,
    NgOptimizedImage
  ]
})
export class TwoFactorAuthV4Component
  implements OnInit, OnDestroy, AfterViewInit
{
  public authV3Service = inject(AuthV3Service);
  private authRepository = inject(AuthRepository);
  private authDataService = inject(AuthDataService);
  private v4AlertService = inject(V4AlertService);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  private fb = inject(FormBuilder);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private appSettingService = inject(AppSettingsService);
  private dialog = inject(MatDialog);
  private destroy$ = inject(DestroyRef);

  readonly ArrowLeftIcon = ArrowLeft;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly PhoneIcon = Phone;
  readonly Building2Icon = Building2;
  readonly UserCheckIcon = UserCheck;
  readonly ShieldIcon = Shield;
  readonly KeyIcon = Key;
  readonly CreditCardIcon = CreditCard;
  readonly GlobeIcon = Globe;
  readonly FileTextIcon = FileText;

  utils = Utils;
  public staticWhiteLabelConditions = StaticWhiteLabelConditions;
  isZilMoneyLogoVisible = this.staticWhiteLabelConditions.zilMoneyLogoVisible;
  appConfig: any = {};
  currentYear = new Date().getFullYear();
  private subscriptions: Subscription[] = [];

  twoFactShow = false;
  showDays = false;
  days = 1;
  rememberDeviceChecked = false;

  otpError = '';
  backupCodeError = '';

  emptyOtpBoxes: boolean[] = [false, false, false, false, false, false];

  durationOptions = [
    { value: 1, label: '1 Day' },
    { value: 2, label: '1 Week' },
    { value: 3, label: '2 Weeks' },
    { value: 4, label: '1 Month' },
    { value: 5, label: '6 Months' }
  ];

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

    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe((config) => {
        if (config) {
          this.appConfig = config;
        }
      })
    );
  }

  ngAfterViewInit() {
    this.addEnterKeyListener();
  }

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

    this.twoFactorForm
      .get('dateFrequency')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroy$))
      .subscribe((value) => {
        this.days = value || 1;
      });

    this.twoFactorForm
      .get('backupCode')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroy$))
      .subscribe(() => {
        this.backupCodeError = '';
      });
  }

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

  updateOtpFormControl(): void {
    const otpStr = this.getOtpString();
    this.twoFactorForm.patchValue({ otpCode: otpStr });
    this.otpError = '';
    this.emptyOtpBoxes = [false, false, false, false, false, false];
  }

  useOtp(): void {
    this.twoFactShow = false;
    this.otpError = '';
    this.backupCodeError = '';
    this.emptyOtpBoxes = [false, false, false, false, false, false];
  }

  twoAuth(): void {
    this.twoFactShow = true;
    this.otpError = '';
    this.backupCodeError = '';
    this.emptyOtpBoxes = [false, false, false, false, false, false];
  }

  selectDays(frequency: number): void {
    this.days = frequency;
    this.twoFactorForm.patchValue({ dateFrequency: frequency });
  }

  onKeyUpEvent(
    event: KeyboardEvent,
    nextInput: HTMLInputElement,
    prevInput: HTMLInputElement
  ): void {
    const input = event.target as HTMLInputElement;
    const { value } = input;

    this.updateOtpFormControl();

    if (event.key === 'Backspace' && !value && prevInput) {
      prevInput.focus();
      prevInput.select();
    } else if (value && nextInput && nextInput !== input) {
      nextInput.focus();
      nextInput.select();
    }
  }

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

      this.updateOtpFormControl();

      const focusIndex = Math.min(digits.length, 6);
      const nextInput = document.getElementById(
        `otp${focusIndex}`
      ) as HTMLInputElement;
      nextInput?.focus();
    }
  }

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

  resendOtp(): void {
    this.clearOtpFields();
    this.authV3Service.resendOtpClick();
  }

  validateOtp(): boolean {
    const otpString = this.getOtpString();

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

  onSubmit(): void {
    const formValue = this.twoFactorForm.value;
    const isBackupMode = this.twoFactShow;
    this.twoFactorForm.markAllAsTouched();

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
    this.submitTwoFactorV4(payload);
  }

  private submitTwoFactorV4(payload: ITwoFactorPayload): void {
    this.authV3Service.submitBtnDisable = true;
    this.authV3Service.twoFactorsubscriptions.push(
      this.authRepository
        .validateOtp(payload)
        .pipe(
          catchError((err: HttpErrorResponse) => {
            this.authV3Service.submitBtnDisable = false;
            if (err?.error?.errorCode === 247) {
              this.showOtpExpiredV4Modal(err);
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          const apiResponse = res as IApiResSuccessOnly;
          if (!apiResponse.success) {
            this.authV3Service.submitBtnDisable = false;
            return;
          }
          this.authV3Service.twoFactorsubscriptions.push(
            this.authRepository
              .getLoginDetailsUsingToken()
              .subscribe((response: ILoginDetails) => {
                this.authV3Service.submitBtnDisable = false;
                if (response.success) {
                  this.authDataService.afterLoginConfig(
                    response,
                    this.authV3Service.twoFactorReturnUrlIfCompanyZero,
                    this.authV3Service.twoFactorReturnUrl
                  );
                }
              })
          );
        })
    );
  }

  private showOtpExpiredV4Modal(err: HttpErrorResponse): void {
    const errorMessage =
      err?.error?.errorMsg ||
      'Your OTP has expired. Please resend a new OTP.';

    const dialogRef = this.v4AlertService.warningAlert({
      title: 'OTP Expired',
      content: errorMessage,
      doneMsg: 'Resend',
      cancelMsg: 'Cancel',
      isCancel: true,
      isOk: true
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.clearOtpFields();
        this.authV3Service.resendOtpClick();
      }
    });
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

  goToLiveChat(): void {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  openContactSupport(): void {
    this.dialog.open(V4ContactSupportModalComponent, {
      width: '540px',
      maxWidth: '95%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true,
      data: {
        title: 'Contact Support',
        subtitle: "Choose how you'd like to reach our support team.",
        hideSubmitTicket: true
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.authV3Service.twoFactorsubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.authV3Service.unSubscibeCommonSubscription();
  }
}
