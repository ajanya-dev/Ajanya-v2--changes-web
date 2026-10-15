import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  UntypedFormControl,
  Validators,
  FormGroup,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { Utils } from 'src/app/data/utils';
import {
  IRegisterForm,
  ISocialIcon
} from 'src/app/modules/auth/components/register/model/register';
import { register } from 'src/app/data/data/register';
import { IRegisterPayload } from 'src/app/models/user';
// import { RecaptchaService } from 'src/app/core/services/recaptcha.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, NgStyle, NgOptimizedImage } from '@angular/common';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { faPhone } from '@fortawesome/pro-solid-svg-icons';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
// import { HttpErrorResponse } from '@angular/common/http';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { WhiteLabelPipe } from '../../../../pipes/white-label.pipe';
import { AuthV3Service } from '../../services/auth-v3.service';
import { ESignatureAgreementV4Component } from '../../modal/e-signature-agreement-v4/e-signature-agreement-v4.component';
// import {
//   IRegisterEmailVerifyModalData,
//   RegisterEmailVerifyModalV4Component
// } from '../../modal/register-email-verify-modal-v4/register-email-verify-modal-v4.component';

@Component({
  selector: 'app-register-v4',
  templateUrl: './register-v4.component.html',
  styleUrls: ['./register-v4.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NgStyle,
    FaIconComponent,
    MatTooltip,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    NgOptimizedImage,
    WhiteLabelPipe,
    CommonInputFieldV4Component,
    CommonButtonV4Component,
    PhoneInputV4Component
  ]
})
export class RegisterV4Component implements OnInit, OnDestroy, AfterViewInit {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private fb = inject(FormBuilder);
  private scriptService = inject(ScriptService);
  // private recaptchaService = inject(RecaptchaService);
  private themeService = inject(ThemeService);
  private layoutservice = inject(LayoutService);
  public authV3Service = inject(AuthV3Service);
  public localStorageService = inject(LocalStorageService);
  public activatedRoute = inject(ActivatedRoute);
  private alertService = inject(AlertService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  // private destroyRef = inject(DestroyRef);

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  socialLoginIcons: ISocialIcon[] = register.socialIcons();
  namevalid = false;
  emailError: string;
  showValidBox = false;
  passwordHide = true;
  recaptchaToken: string | undefined;
  isSingleSideUIEnabledVariable = false;

  termsAccepted = signal(false);

  userForm: FormGroup<IRegisterForm>;
  dialCode = '+1';
  currentCountryCode: string;

  /** Country name and ISO code for the selected dial code, for tracking. */
  currentCountryName = '';

  currentCountryIso = '';
  supportNo = StaticWhiteLabelConditions.customerSupportNo;
  faPhone = faPhone;
  logoPath = 'assets/main/app_logo.svg';
  isArcharina =
    environment.env_id === 'archarina' ||
    environment.env_id === 'archarina-sandbox';

  benefits = [
    'Trial Period Valid for 15 Days',
    'No credit card required',
    'Full features included'
  ];

  currenCountryPhoneLength = {} as { min: number; max: number };
  env = environment;
  email = this.route.snapshot.queryParams.email;
  name = this.route.snapshot.queryParams.name;
  returnUrl = this.route.snapshot.queryParams.returnUrl;
  adminRfCode = this.route.snapshot.queryParams.ref;
  page = this.route.snapshot.queryParams.from;
  phone = this.route.snapshot.queryParams.phone;

  constructor() {
    this.themeService.disableTheme();
  }

  ngOnInit(): void {
    this.authV3Service.emailError = '';
    this.authV3Service.loadAppSettings();
    this.initFormGroup();
    setTimeout(() => {
      this.authV3Service.valueChangesAction(this.userForm);
    }, 1050);
    this.authV3Service.clearThemeSettings();
    this.layoutservice.enableUseMobileAppPage();
    this.isSingleSideUIEnabledVariable =
      this.authV3Service.isSingleSideUIEnabled;
    this.getCoupon();
    if (this.env.isItWhiteLabel) {
      const environmentId = this.env.env_id.includes('sandbox')
        ? this.env.env_id.replace('-sandbox', '')
        : this.env.env_id;
      this.logoPath = `assets/white_label/${environmentId}/assets/app_logo.png`;
    } else {
      this.logoPath =
        this.authV3Service.appConfig?.websiteLogo ?? 'assets/main/app_logo.svg';
    }

    if (this.email) {
      this.checkEmailExists();
    }

    if (this.page) {
      this.authV3Service.trackOutsideSignupPageVisit(
        this.page,
        this.email,
        this.phone
      );
    }
  }

  checkEmailExists() {
    this.authV3Service.OnCheckMail(this.email);
    this.authV3Service.isUserExist$.subscribe((res) => {
      if (res) {
        this.router.navigate(['login'], {
          queryParams: {
            email: this.email,
            returnUrl: this.returnUrl,
            existingAccount: 'true'
          }
        });
        this.authV3Service.emailError = '';
      }
    });
  }

  /**
   * @description Get coupon code from url and set to coupon field.
   */
  getCoupon(): void {
    const couponCode = this.activatedRoute.snapshot.queryParams.coupon ?? '';
    this.userForm.controls.coupon_code.setValue(couponCode);
  }

  initFormGroup(): void {
    this.userForm = this.fb.group({
      name: new UntypedFormControl('', [
        Validators.required,
        Validators.minLength(3)
      ]),
      email: new UntypedFormControl('', [
        Validators.required,
        ValidationService.emailValidator
      ]),
      password: new UntypedFormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100)
      ]),
      password_confirmation: new UntypedFormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100)
      ]),
      phone: new UntypedFormControl(''),
      coupon_code: new UntypedFormControl(''),
      phone_no: [
        '',
        [
          ValidationService.customMinLength(
            this.currenCountryPhoneLength?.min ?? 10
          )
        ]
      ],
      termsAndCondition: [false],
      eSign: [false],
      ccpa: [false]
    });

    // Add custom validator for password confirmation
    this.userForm
      .get('password_confirmation')
      ?.setValidators([
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        this.passwordMatchValidator.bind(this)
      ]);

    // Update password confirmation validation when password changes
    this.userForm.get('password')?.valueChanges.subscribe(() => {
      this.userForm.get('password_confirmation')?.updateValueAndValidity();
    });
  }

  /**
   * Custom validator to check if password and confirm password match
   */
  passwordMatchValidator(
    control: UntypedFormControl
  ): { [key: string]: boolean } | null {
    if (!control.parent) {
      return null;
    }

    const password = control.parent.get('password')?.value;
    const confirmPassword = control.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { confirmPassword: true };
    }

    return null;
  }

  openTermsDialog(checked: boolean) {
    if (checked) {
      this.dialog
        .open(ESignatureAgreementV4Component, {
          width: '640px',
          maxWidth: '92vw',
          panelClass: 'paddingless-modal-rounded',
          disableClose: true,
          autoFocus: false,
          data: { signupTheme: true }
        })
        .beforeClosed()
        .subscribe((res) => {
          if (res) {
            this.termsAccepted.set(true);
            this.userForm.controls.eSign.setValue(true);
          } else {
            this.termsAccepted.set(false);
            this.userForm.controls.eSign.setValue(false);
          }
        });
    } else {
      this.termsAccepted.set(false);
      this.userForm.controls.eSign.setValue(false);
    }
  }

  /**
   * @description Handles the submission of the user registration form.
   */
  submit() {
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isLoginRestricted'
      )
    ) {
      return;
    }

    this.userForm.markAllAsTouched();

    if (this.userForm.invalid) {
      this.authV3Service.onNameChange(this.userForm.controls.name.errors);
      this.authV3Service.passwordChange(this.userForm.controls.password.errors);
      if (
        this.userForm.controls.password_confirmation.invalid ||
        this.userForm.value.password_confirmation !==
          this.userForm.value.password
      ) {
        this.authV3Service.confirmPassowrdError = 'Password does not match';
      }
      return;
    }

    const str = String(this.userForm.value.name);

    if (str.trim() === '') {
      this.namevalid = true;
      return;
    }

    if (
      !this.userForm.value.eSign &&
      !this.isArcharina &&
      !this.env.isItWhiteLabel
    ) {
      this.alertService.warningAlert({
        isOk: true,
        doneMsg: 'OK',
        title: 'Accept E-Signature Agreement',
        content:
          'To continue, please confirm your acceptance of the E-Signature Agreement.'
      });
      return;
    }

    if (!this.userForm.value.termsAndCondition) {
      this.alertService.warningAlert({
        isOk: true,
        doneMsg: 'OK',
        title: 'Accept Terms to Continue',
        content:
          'To continue, please confirm your acceptance of the terms and conditions.'
      });
      return;
    }

    if (!this.userForm.value.ccpa && !this.isArcharina) {
      this.alertService.warningAlert({
        isOk: true,
        doneMsg: 'OK',
        title: 'Accept California Consumer Privacy Act',
        content:
          'To continue, please confirm your acceptance of the California Consumer Privacy Act.'
      });
      return;
    }

    this.authV3Service.submitting = true;
    this.sendEmailOtpAndVerify();
  }

  /** Error code returned by send-otp when email verification isn't required — register directly. */
  // private readonly OTP_NOT_REQUIRED_CODE = 651;

  private sendEmailOtpAndVerify(): void {
    // const email = this.getFormValue('email') as string;

    // this.authV3Service
    //   .sendPreRegistrationEmailOtp(email, environment.providerType || 'zilmoney')
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe({
    //     next: (res) => {
    //       this.authV3Service.submitting = false;
    //       if (res?.success) {
    //         this.openEmailVerifyModal(email, res?.timer?.diff);
    //       }
    //     },
    //     error: (err: HttpErrorResponse) => {
    //       // Code 651 means OTP verification isn't required — skip the modal and register directly.
    //       if (Number(err?.error?.errorCode) === this.OTP_NOT_REQUIRED_CODE) {
    //         this.registerUser();
    //       } else {
    //         this.authV3Service.submitting = false;
    //       }
    //     }
    //   });
  }

  // /** Generates a fresh reCAPTCHA token and submits the registration request. */
  // private registerUser(): void {
  //   this.authV3Service.submitting = true;
  //   this.recaptchaService.recaptchaToken
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe((token: string | undefined) => {
  //       this.recaptchaToken = token;
  //       this.authV3Service.onRegister(this.CreateregisterBody());
  //     });
  // }

  // private openEmailVerifyModal(
  //   email: string,
  //   initialTimerSeconds?: number
  // ): void {
  //   this.dialog
  //     .open<
  //       RegisterEmailVerifyModalV4Component,
  //       IRegisterEmailVerifyModalData,
  //       boolean
  //     >(RegisterEmailVerifyModalV4Component, {
  //       width: '385px',
  //       maxWidth: '92vw',
  //       panelClass: 'paddingless-modal-rounded',
  //       disableClose: true,
  //       autoFocus: false,
  //       data: { email, initialTimerSeconds }
  //     })
  //     .afterClosed()
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe((verified) => {
  //       if (!verified) return;
  //       this.registerUser();
  //     });
  // }

  /**
   * @description Creates a registration payload based on the values entered in the user registration form.
   * @returns {IRegisterPayload} The registration payload with the specified fields.
   */
  CreateregisterBody(): IRegisterPayload {
    return {
      name: this.getFormValue('name'),
      username: this.getFormValue('email'),
      password: this.getFormValue('password'),
      password_confirmation: this.getFormValue('password_confirmation'),
      phone: this.getFormValue('phone_no')
        ? `${this.getFormValue('phone_no')}`
        : '',
      coupon_code: this.getFormValue('coupon_code'),
      phone_no: this.getFormValue('phone_no'),
      extraData: Utils.getAllCookies(),
      recaptcha: this.recaptchaToken,
      countryCode: this.currentCountryCode,
      termsAndCondition: this.getFormValue('termsAndCondition'),
      adminRfCode: this.adminRfCode
    };
  }

  /**
   * @description Retrieves the current value of a specific form control by its name from the user registration form.
   * @param {string} name - The name of the form control to retrieve the value from.
   * @returns The current value of the specified form control, or undefined if the control does not exist.
   */
  getFormValue(name: string) {
    return this.userForm.get(name)?.value;
  }

  /**
   * @description Called after the view and child views are initialized.
   */
  ngAfterViewInit() {
    Utils.showRecaptcheBadge();
    setTimeout(() => {
      this.userForm.controls.email.setValue(this.email ?? '');
      this.userForm.controls.name.setValue(this.name ?? '');
      this.userForm.controls.password.setValue('');
    }, 1000);
  }

  /**
   * @description Used to hide and show the password validation box.
   */
  passwordFocus() {
    this.showValidBox = !this.showValidBox;
  }

  /**
   * @description Adapts the v4 input's emitted element to the shared password
   * validation handler (which expects a DOM Event).
   * @param {HTMLInputElement} input - The password input element emitted by app-common-input-v4.
   */
  onPasswordInput(input: HTMLInputElement) {
    this.authV3Service.onPasswordValidation({ target: input } as unknown as Event);
  }

  /**
   * @description Handles a user's click on a social media icon by invoking the corresponding action in the 'authV3Service'.
   * @param {string} url - The URL associated with the clicked social media icon.
   */
  onClickSocialIcon(url: string): void {
    this.authV3Service.onClickSocialIcon(url);
  }

  countryChange(event: {
    isOpen: boolean;
    length?: { min: number | undefined; max: number | undefined };
    code?: string;
  }) {
    this.currenCountryPhoneLength = {
      min: event.length?.min ?? 10,
      max: event.length?.max ?? 10
    };
    this.userForm.controls.phone_no.setValidators([
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.userForm.controls.phone_no.updateValueAndValidity();
  }

  countryCodeChange(event: { code: string; name?: string; iso?: string; updateLocalStorage?: boolean }) {
    if (event.updateLocalStorage) {
      this.localStorageService.setItem('selected_dial_code', event.code);
    }
    this.currentCountryCode = event.code;
    // A dial code alone cannot name a country: +1 is both the US and Canada,
    // so the name and ISO come from the picker rather than being derived.
    this.currentCountryName = event.name ?? this.currentCountryName;
    this.currentCountryIso = event.iso ?? this.currentCountryIso;
  }

  ngOnDestroy(): void {
    this.scriptService.hideZohoChat();
    Utils.showRecaptcheBadge(false);
    this.authV3Service.unSubscribeRegisterSubscriptions();
    this.authV3Service.unSubscibeCommonSubscription();
    this.localStorageService.removeItem('returnUrl');
  }
}
