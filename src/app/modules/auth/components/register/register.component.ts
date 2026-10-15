import {
  AfterViewInit,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { RecaptchaService } from 'src/app/core/services/recaptcha.service';
import { ThemeService } from 'src/app/shared/service/theme/theme.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, NgStyle, NgOptimizedImage } from '@angular/common';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { faPhone } from '@fortawesome/pro-solid-svg-icons';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { WhiteLabelPipe } from '../../../../pipes/white-label.pipe';
import { AuthV3Service } from '../../services/auth-v3.service';
import { ESignatureAgreementComponent } from '../../modal/e-signature-agreement/e-signature-agreement.component';
import {
  IRegisterEmailVerifyModalData,
  RegisterEmailVerifyModalComponent
} from '../../modal/register-email-verify-modal/register-email-verify-modal.component';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    FaIconComponent,
    NgStyle,
    MatTooltip,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    NgOptimizedImage,
    WhiteLabelPipe,
    NewPhoneInputComponent,
    NgOptimizedImage,
    V35ControlMessageComponent
  ]
})
export class RegisterComponent implements OnInit, OnDestroy, AfterViewInit {
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private fb = inject(FormBuilder);
  private scriptService = inject(ScriptService);
  private recaptchaService = inject(RecaptchaService);
  private themeService = inject(ThemeService);
  private layoutservice = inject(LayoutService);
  public authV3Service = inject(AuthV3Service);
  public localStorageService = inject(LocalStorageService);
  public activatedRoute = inject(ActivatedRoute);
  private alertService = inject(AlertService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

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
  isArcharina = environment.env_id === 'archarina' || environment.env_id === 'archarina-sandbox';

  benefits = [
    'Trial Period Valid for 15 Days From Registration Date.',
    "Trial doesn't require a credit card or payment setup.",
    'Trial period comes with full features. : unlimited checks, bank accounts, users/ employees, etc.'
  ];

  currenCountryPhoneLength = {} as { min: number; max: number };
  env = environment;
  email = this.route.snapshot.queryParams.email;
  name = this.route.snapshot.queryParams.name;
  returnUrl = this.route.snapshot.queryParams.returnUrl;
  adminRfCode = this.route.snapshot.queryParams.ref;
  page = this.route.snapshot.queryParams.from;
  phone = this.route.snapshot.queryParams.phone;
  papVisitorId = this.route.snapshot.queryParams.visitorId;

  /** Marketing/tracking query params forwarded to the backend on registration. */
  readonly MARKETING_PARAM_KEYS = [
    'gclid',
    'utm_source',
    'utm_medium',
    'utm_term',
    'utm_campaign',
    'utm_content',
    'fbclid',
    'msclkid'
  ];

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
      const environmentId =  this.env.env_id.includes('sandbox') ? this.env.env_id.replace('-sandbox', '') : this.env.env_id;
      this.logoPath = `assets/white_label/${environmentId}/assets/app_logo.png`;
    } else {
      this.logoPath =
        this.authV3Service.appConfig?.websiteLogo ?? 'assets/main/app_logo.svg';
    }

    if(this.email){
      this.checkEmailExists();
    }

    if(this.page){
      this.authV3Service.trackOutsideSignupPageVisit(this.page, this.email, this.phone);
    }
  }

  checkEmailExists() {
    this.authV3Service.OnCheckMail(this.email);
    this.authV3Service.isUserExist$.subscribe((res) => {
      if (res) {
        this.router.navigate(['login'], { queryParams: { email: this.email, returnUrl: this.returnUrl, existingAccount: 'true' } });
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
      ccpa: [false],

    });

    // Add custom validator for password confirmation
    this.userForm.get('password_confirmation')?.setValidators([
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
  passwordMatchValidator(control: UntypedFormControl): { [key: string]: boolean } | null {
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
        .open(ESignatureAgreementComponent, {
          width: '600px',
          disableClose: true
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

    if (!this.userForm.value.eSign && !this.isArcharina && !this.env.isItWhiteLabel) {
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

  private readonly OTP_NOT_REQUIRED_CODE = 651;

  private sendEmailOtpAndVerify(): void {
    const email = this.getFormValue('email') as string;
    const phone = this.getFormValue('phone_no') ? `${this.getFormValue('phone_no')}` : '';

    this.authV3Service
      .sendPreRegistrationEmailOtp(email,phone,environment.providerType||'zilmoney')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.authV3Service.submitting = false;
          if (res?.success) {
            this.openEmailVerifyModal(email,phone, res?.timer?.diff);
          }
        },
        error: (err: HttpErrorResponse) => {
          if (Number(err?.error?.errorCode) === this.OTP_NOT_REQUIRED_CODE) {
            this.registerUser();
          } else {
            this.authV3Service.submitting = false;
          }
        }
      });
  }

  private registerUser(): void {
    this.authV3Service.submitting = true;
    this.recaptchaService.recaptchaToken
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((token: string | undefined) => {
        this.recaptchaToken = token;
        this.authV3Service.onRegister(this.CreateregisterBody(), {
          countryName: this.currentCountryName,
          countryIso: this.currentCountryIso
        });
      });
  }

  private openEmailVerifyModal(
    email: string,
    phone:string,
    initialTimerSeconds?: number
  ): void {
    this.dialog
      .open<
        RegisterEmailVerifyModalComponent,
        IRegisterEmailVerifyModalData,
        boolean
      >(RegisterEmailVerifyModalComponent, {
        width: '385px',
        maxWidth: '92vw',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        autoFocus: false,
        data: { email, initialTimerSeconds, phone, logoPath: this.logoPath ,envId:environment.providerType}
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((verified) => {
        if (!verified) return;
        this.registerUser();
      });
  }

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
      extraData: this.getExtraData(),
      recaptcha: this.recaptchaToken,
      countryCode: this.currentCountryCode,
      termsAndCondition: this.getFormValue('termsAndCondition'),
      adminRfCode: this.adminRfCode,
      utmParams: this.getUtmParams()
    };
  }

  /**
   * @description Picks the whitelisted marketing/tracking params (gclid, utm_*, etc.)
   * that are present in the current URL so they can be sent with the register payload.
   * @returns A map of the marketing params found in the URL; empty when none are present.
   */
  private getUtmParams(): Record<string, string> {
    const params = this.route.snapshot.queryParams;
    return this.MARKETING_PARAM_KEYS.reduce((acc, key) => {
      if (params[key]) {
        acc[key] = params[key];
      }
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * @description Builds the extraData payload: all browser cookies plus the Post Affiliate Pro
   * visitor id from the URL, when present.
   * @returns The cookie map, with PAPVisitorId added only when the visitorId query param exists.
   */
  private getExtraData(): Record<string, string> {
    const extraData = Utils.getAllCookies();
    if (this.papVisitorId) {
      extraData.PAPVisitorId = this.papVisitorId;
    }
    return extraData;
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
   * @description Handles a user's click on a social media icon by invoking the corresponding action in the 'authV3Service'.
   * @param {string} url - The URL associated with the clicked social media icon.
   */
  onClickSocialIcon(url: string): void {
    this.authV3Service.onClickSocialIcon(url);
  }

  /**
   * @description Handles changes in the phone number and dial code received from a phone number input component.
   * @param {Object} phone - An object containing phone-related information, including dial code and phone number.
   */
  phoneNumChange(phone: {
    dialCode: string;
    fullPhoneNo: string;
    phone: string;
  }) {
    this.userForm.controls.phone_no.setValue(phone?.phone);
    this.dialCode = phone?.dialCode;
  }

  countryChange(event: { length: { min: number; max: number }; code: string }) {
    this.currenCountryPhoneLength = event.length;
    this.userForm.controls.phone_no.setValidators([
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.userForm.controls.phone_no.updateValueAndValidity();
  }

  countryCodeChange(event: { code: string; name?: string; iso?: string; updateLocalStorage: boolean }) {
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
