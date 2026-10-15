import { Injectable, inject, signal } from '@angular/core';
import {
  Subscription,
  catchError,
  debounceTime,
  finalize,
  interval,
  of
} from 'rxjs';
import {
  ILoginPayload,
  IRegisterPayload,
  ISetNewPasswordForm
} from 'src/app/models/user';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { resolveRecurringReturnUrl } from 'src/app/shared/service/route/v4-route-mapper';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { ScriptService } from 'src/app/core/services/script.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { IAppConfig } from 'src/app/models/app_settings';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ChangeBaseUrlModalComponent } from 'src/app/shared/modal/change-base-url(staging)/change-base-url-modal/change-base-url-modal.component';
import { IApiResSuccessOnly } from 'src/app/models/api';
import { Login } from 'src/app/data/data/login';
import { EnvironmentId } from 'src/app/models/environment';
import { MatDialog } from '@angular/material/dialog';
import { RecaptchaService } from 'src/app/core/services/recaptcha.service';
import { IonBoardingDetails } from '../../onboarding/model/onBoarding';
import { AuthRepository } from '../repository/auth.repository';
import { DynamicWhiteLabelService } from '../../dynamic-white-label/service/dynamic-white-label.service';
import {
  ILoginDetails,
  ILoginSlider,
  ISliderData,
  ISocialIcon,
  ITwoFactorPayload,
  IResendOtpRes
} from '../model/login';
import { StaticWhiteLabelConditions } from '../../dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { WhiteLabel } from '../../dynamic-white-label/dynamic-white-label-data/dynamic-white-label-data';
import { IRegisterForm } from '../components/register/model/register';
import { IIpSecurity } from '../model/security';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { environment } from 'src/environments/environment';
import { toObservable } from '@angular/core/rxjs-interop';
import { BrowserTokenService } from 'src/app/core/services/browser-token.service';

@Injectable({
  providedIn: 'root'
})
export class AuthV3Service {
  private route = inject(ActivatedRoute);
  private recaptchaService = inject(RecaptchaService);
  private dialog = inject(MatDialog);
  private authRepository = inject(AuthRepository);
  private browserTokenService = inject(BrowserTokenService);
  private localStorageService = inject(LocalStorageService);
  private authDataService = inject(AuthDataService);
  private scriptService = inject(ScriptService);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private appSettingService = inject(AppSettingsService);
  private formBuilder = inject(FormBuilder);
  private headerService = inject(HeaderService);

  /** Login component varibles. */
  pageLabels = {
    title: 'Sign In',
    submitButton: 'Sign In',
    signInWith: {
      heading: 'Sign In'
    },
    signUpText: 'Sign Up'
  };

  sliderDetails: ISliderData[];
  hideDescription: boolean;
  appConfig: IAppConfig;
  sliderNum: number;
  loginSubscriptions: Subscription[] = [];
  isSocialLogin: boolean;
  inValid: boolean;
  loading: boolean;
  recaptchaToken: string | undefined;
  returnUrlIfCompanyZero: string;
  returnUrl: string;
  isTempPassword = 0;
  warningMsg = '';
  /** Getting Static Conditions */
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  socialLoginIcons: ISocialIcon[] = Login.socialIcons();
  selectedEnvironmentId: EnvironmentId =
    this.dynamicWhiteLabelService.localStorageGlobalEnvironmentId;

  /**
   * @property {IDynamicWhiteLabelAttributes[]} dynamicWhiteLabelData
   * An array of dynamic white label data retrieved from the `WhiteLabel` class.
   */
  dynamicWhiteLabelData = WhiteLabel.dynamicWhiteLabelData();

  /** Register component variables. */
  registerSubscriptions: Subscription[] = [];
  disabled = false;
  submitting = false;
  emailError: string;
  userNameError: string;
  passwordError: string;
  confirmPassowrdError: string;
  phoneError: string;

  /** Two Factor component variables.  */
  twoFactShow = false;
  twoFactorsubscriptions: Subscription[] = [];
  OTPNumber: string[] = [];
  showDays = false;
  showDays2 = false;
  btnDisable = false;
  btnDisable1 = false;
  submitBtnDisable = false;
  showTimer = true;
  twoAuthSection = true;
  display: string;
  str = '';
  rememberDeviceChecked = 0;
  rememberDevice = 0;
  deviceName = '';
  backupActivated = 0;
  backUpCode = '';
  useBackupCode = false;
  showSpinner = false;
  backValue = false;
  isClickPos = false;
  nextVal = false;
  selctedId: number;
  inputArr: HTMLInputElement[];
  days: number;
  twoFactorReturnUrlIfCompanyZero: string;
  twoFactorReturnUrl: string;
  setNewPasswordForm: FormGroup;
  password: string;
  confirmPassword: string;
  isConfirmPassword = false;
  isPasswordAssistanceShown = false;
  isPasswordSubmit = false;
  intervalTimer: ReturnType<typeof setInterval>;
  subscriptions: Subscription[] = [];
  timerExist = signal(false);
  displayTimer = signal('');
  timer: number;
  timerSubscription: Subscription;
  isUserExist = signal(false);
  isUserExist$ = toObservable(this.isUserExist);


  /** Login component related functions. */

  /**
   * @description Get and display an error alert based on query parameters in the route.
   */
  getErrorAlert() {
    this.loginSubscriptions.push(
      this.route.queryParams.subscribe((params) => {
        if (params.error_id) {
          this.loginSubscriptions.push(
            this.alertService
              .getErrorMsgData(params.error_id)
              .subscribe((res) => {
                if (res) {
                  this.alertService.failedAlert({
                    title: res?.title ? res.title : 'Error',
                    content: res?.errorMsg
                      ? res.errorMsg
                      : 'Something Went Wrong!'
                  });
                }
              })
          );
        }
      })
    );
  }

  /**
   * @description Load and populate data for a Swiper component on the login page.
   */
  loadSwiperData() {
    this.loginSubscriptions.push(
      this.authRepository.getLoginPageSliderDetails().subscribe({
        next: (res) => {
          if (res.success) {
            if (res.data?.length) {
              if (
                res.data.length > 0 &&
                this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
                  'isSliderDescriptionHidden'
                )
              ) {
                this.hideDescription = true;
              }
              this.sliderDetails = res.data;
            }
          }
          this.slider();
        },
        error: () => {
          this.slider();
        }
      })
    );
  }

  /**
   * @description This function is to change the loginpage right side image randomly
   */
  slider() {
    if (this.sliderDetails?.length) {
      this.sliderNum = Math.floor(Math.random() * this.sliderDetails.length);
    }
    return this.sliderNum;
  }

  /**
   * @description Navigate to the registration page if login is not restricted based on dynamic white-label flags.
   */
  register() {
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isLoginRestricted'
      )
    ) {
      return;
    }

    this.router.navigate(['register']);
  }

  /**
   * @description Check if a new password needs to be set based on query parameters in the route snapshot.
   */
  isSetNewPassword() {
    if (this.route.snapshot.queryParams?.force_change_pass) {
      this.isTempPassword = 1;
    }
  }

  /**
   * @description Determine the return URL based on query parameters in the route snapshot.
   */
  getReturnUrl() {
    if(environment.env_id !== 'compass' && environment.env_id !== 'csnhc'){
      this.returnUrl =
        this.route.snapshot.queryParams.returnUrl || '/manage/company_management';
    }else{
      this.returnUrl = '/manage/company_management';
    }
    const resolvedRecurringUrl = resolveRecurringReturnUrl(
      this.returnUrl,
      this.localStorageService.getItem('isV4LayoutEnabled') === 1
    );
    if (resolvedRecurringUrl) {
      this.returnUrl = resolvedRecurringUrl;
    }
    this.returnUrlIfCompanyZero = '/manage/company_management';
    this.returnUrl = this.withPayeeOnboardingParams(this.returnUrl);
  }

  /**
   * @description Carry the payee-onboarding magic-link params across login.
   *
  */

  private withPayeeOnboardingParams(returnUrl: string): string {
    const params = this.route.snapshot.queryParams;
    if (!params.initiator_id || !params.externalToken || !params.initiated_from) {
      return returnUrl;
    }
    // Links built by authGuard already nest the params inside returnUrl.
    if (returnUrl.includes('initiator_id=')) {
      return returnUrl;
    }
    const forwarded = new URLSearchParams({
      initiated_from: params.initiated_from,
      initiator_id: params.initiator_id,
      externalToken: params.externalToken
    });
    ['isNewUser', 'redirect_back'].forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        forwarded.set(key, params[key]);
      }
    });
    return `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}${forwarded}`;
  }

  /**
   * @description Handle the process of social login by making an HTTP request with provided user data.
   */
  onSocialLogin() {
    const doHttpRequest = () => {
      if (this.route.snapshot.queryParams.user) {
        const email = this.route.snapshot.queryParams.user;
        const { password } = this.route.snapshot.queryParams;
        this.isSocialLogin = true;
        this.inValid = false;
        this.loading = true;
        const loginContact = {
          username: email,
          password,
          recaptcha: this.recaptchaToken
        };
        const loginMethod = this.detectSocialProvider();
        this.loginSubscriptions.push(
          this.authRepository
            .socialLogin(loginContact)
            .pipe(
              catchError((err) => {
                if (err.error.errorCode === 350) {
                  this.ipAddressVerificationRequired(err.error);
                }
                return of(false);
              }),
              finalize(() => {
                this.loading = false;
              })
            )
            .subscribe((res) => {
              if (res && res !== true) {
                this.authDataService.afterLogin(
                  res as ILoginDetails,
                  this.returnUrlIfCompanyZero,
                  this.returnUrl,
                  undefined,
                  loginMethod,
                  email
                );
              } else {
                this.inValid = true;
              }
            })
        );
      }
    };
    this.loginSubscriptions.push(
      this.recaptchaService.recaptchaToken.subscribe(
        (res: string | undefined) => {
          this.recaptchaToken = res;
          doHttpRequest();
        }
      )
    );
  }

  private detectSocialProvider(): string {
    const referrer = (document.referrer || '').toLowerCase();
    const providers = [
      'google', 'microsoft', 'linkedin', 'amazon',
      'apple', 'twitter', 'xero', 'freshbooks', 'intuit', 'azure'
    ];
    return providers.find(p => referrer.includes(p)) || 'social';
  }

  getBrowserAuthToken(): void {
    this.browserTokenService.refresh();
  }

  /**
   * @description Handle the submission of a login form.
   * @param {ILoginPayload} loginBody - The login payload containing user credentials.
   * @param {FormGroup} loginForm - The Angular form group representing the login form.
   */
  submit(loginBody: ILoginPayload, loginForm: FormGroup): void {
    if (
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isLoginRestricted'
      )
    ) {
      return;
    }

    if (loginForm.invalid) {
      this.inValid = true;
      if (loginForm.controls.username.value === '') {
        this.warningMsg = 'User name is required';
      } else if (loginForm.controls.password.value === '') {
        this.warningMsg = 'Password is required';
      }
      return;
    }
    const doHttpRequest = () => {
      this.inValid = false;
      this.loading = true;
      const payload = {
        ...loginBody,
        recaptcha: this.recaptchaToken
      };
      this.loginSubscriptions.push(
        this.authRepository
          .login(payload)
          .pipe(
            catchError((err) => {
              this.getTimerSecond(err.error.message);

              if (err.error.errorCode === 110) {
                this.loading = false;
                this.inValid = true;
                this.warningMsg = 'Invalid Credentials';
              }
              if (err?.error?.errorCode === 350) {
                this.ipAddressVerificationRequired(err.error);
              }

              return of(false);
            }),
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe((res) => {
            const response = res as ILoginDetails;
            if (response.success) {
              this.authDataService.afterLogin(
                response,
                this.returnUrlIfCompanyZero,
                this.returnUrl,
                this.isTempPassword,
                'email',
                loginBody.username
              );
            } else {
              this.inValid = true;
            }
          })
      );
    };

    this.loginSubscriptions.push(
      this.recaptchaService.recaptchaToken.subscribe(
        (res: string | undefined) => {
          this.recaptchaToken = res;
          doHttpRequest();
        }
      )
    );
  }

  /**
   * @description Open a dialog to change the base URL, primarily used for testing purposes in staging environments.
   */
  onChangeBaseUrl(): void {
    this.dialog.open(ChangeBaseUrlModalComponent, {
      maxWidth: '500px',
      width: '93%'
    });
  }

  /**
   * @description Open a new browser window or tab to navigate to the website associated with the static white-label conditions.
   */
  onGoToWebsite(): void {
    window.open(this.staticWhiteLabelConditions.website);
  }

  /**
   * @description Set the global environment ID using the selected environment ID.
   */
  setGlobalEnvironmentId() {
    this.dynamicWhiteLabelService.setGlobalEnvironmentId(
      this.selectedEnvironmentId
    );
  }

  /**
   * @description  Handle a click on a social icon and perform the corresponding action.
   * @param url - The URL associated with the clicked social icon.
   */
  onClickSocialIcon(url: string): void {
    if (url === 'comingSoon') {
      this.alertService.infoAlert({ content: 'Coming Soon!', close: true });
      return;
    }
    if (url === 'loginwith/apple') {
      this.alertService.infoAlert({ content: 'Coming Soon!', close: true });
      return;
    }
    const baseUrl = `https://app.onlinecheckwriter.com/${url}`;
    const finalUrl = environment.env_id === 'zilMoney' ? `${baseUrl}?source=zilmoney` : baseUrl;

    window.open(finalUrl, '_self');
  }

  /**
   * @description Handle the click event for a login slider image.
   * @param {ILoginSlider} item - The login slider item representing the clicked image.
   */
  onClickSliderImg(item: ILoginSlider): void {
    if (!item.image.link) {
      return;
    }
    window.open(item.image.link, '_blank');
  }

  /**
   * @description Handle the requirement for IP address verification based on the provided error details.
   * @param {IIpSecurity} err - The IP security error details indicating the need for IP address verification.
   */
  ipAddressVerificationRequired(err: IIpSecurity): void {
    this.authDataService.ipAddressVerificationRequired(
      err,
      this.returnUrlIfCompanyZero,
      this.returnUrl
    );
  }

  /**
   * @description Unsubscribe from all login-related subscriptions to prevent memory leaks.
   */
  unSubscribeLoginSubscriptions() {
    this.loginSubscriptions.forEach((sub) => sub.unsubscribe());
  }

  /** Register component related functions. */

  /**
   * @description Checks whether the Single-Side User Interface is enabled based on the white label configuration.
   *
   * @returns {boolean} Returns `true` if the Single-Side UI is enabled in the white label configuration; otherwise, it returns `false`.
   */
  get isSingleSideUIEnabled(): boolean {
    return this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
      'isSingleSideUIEnabled'
    );
  }

  /**
   * @description Clears the user's theme settings stored in the local storage.
   */
  clearThemeSettings() {
    this.localStorageService.removeItem('user-theme');
  }

  /**
   * @description Subscribes to value changes in a FormGroup representing a registration form.
   * @param {FormGroup<IRegisterForm>} formGroup - The FormGroup instance containing the form controls.
   */
  valueChangesAction(formGroup: FormGroup<IRegisterForm>) {
    this.registerSubscriptions.push(
      formGroup.controls.email.valueChanges
        .pipe(debounceTime(600))
        .subscribe((value) => {
          this.onEmailChange(value as string, formGroup);
        }),

      formGroup.controls.password.valueChanges.subscribe((value) => {
        this.passwordChange(formGroup.controls.password.errors);
        if (
          value &&
          formGroup.controls.password_confirmation.value?.length &&
          formGroup.controls.password_confirmation.value?.length >= 8
        ) {
          if (value !== formGroup.controls.password_confirmation.value) {
            this.confirmPassowrdError = 'Password does not match';
          } else {
            this.confirmPassowrdError = '';
          }
        }
      }),

      formGroup.controls.password_confirmation.valueChanges.subscribe(
        (value) => {
          if (value !== formGroup.controls.password.value) {
            this.confirmPassowrdError = 'Password does not match';
          } else {
            this.confirmPassowrdError = '';
          }
        }
      ),

      formGroup.controls.phone_no.valueChanges.subscribe(() => {
        const formErrors = formGroup.controls.phone_no.errors;
        this.phoneError = formErrors?.invalidPhoneNumber
          ? 'Invalid phone no.'
          : '';
      }),

      formGroup.controls.name.valueChanges.subscribe(() => {
        this.onNameChange(formGroup.controls.name.errors);
      })
    );
  }

  /**
   * @description Handle errors related to name validation and update the user interface accordingly.
   * @param errors - An object representing validation errors for the user's name input.
   */
  onNameChange(errors: ValidationErrors | null) {
    if (errors?.required) {
      this.userNameError = 'Name is required';
    } else if (errors?.minlength) {
      this.userNameError = 'Name should be at least 3 character';
    } else {
      this.userNameError = '';
    }
  }

  /**
   * @description Handle errors related to email validation and update the user interface accordingly.
   * @param errors - An object representing validation errors for the email input.
   */
  onChangeEmail(errors: ValidationErrors | null) {
    if (errors?.required) {
      this.emailError = 'Email is required';
    } else if (errors?.invalidEmailAddress) {
      this.emailError = 'Invalid Email address';
    }
  }

  /**
   * @description Handle errors related to password validation and update the user interface accordingly.
   * @param errors @param errors - An object representing validation errors for the password input, including 'required' and 'minlength'.
   */
  passwordChange(errors: ValidationErrors | null) {
    if (errors) {
      if (errors.required) {
        this.passwordError = 'Password is required';
      } else if (errors.minlength) {
        this.passwordError = 'Password must be at least 8 characters';
      }
    } else {
      this.passwordError = '';
    }
  }

  /**
   * @description Handles changes in the email form control and invokes the appropriate actions based on the provided value.
   * @param {string} value - The new value of the email form control.
   */
  onEmailChange(value: string, formGroup: FormGroup<IRegisterForm>) {
    if (!formGroup.controls.email.errors && formGroup.controls.email.dirty) {
      this.emailError = '';
      this.OnCheckMail(value);
    }
  }

  /**
   * @description Register a user with the provided data and handle the registration process.
   * @param sendingData - The user registration data to be sent to the authentication repository.
   */
  /**
   * @param sendingData - The register payload sent to the backend.
   * @param tracking - Values the backend payload does not carry. `countryCode`
   * on the payload is really the dial code ('+1'), which cannot name a country,
   * so the picker's country name and ISO code are passed alongside it.
   */
  onRegister(
    sendingData: IRegisterPayload,
    tracking?: { countryName?: string; countryIso?: string }
  ) {
    this.disabled = true;
    this.registerSubscriptions.push(
      this.authRepository
        .register(sendingData)
        .pipe(
          catchError((err) => {
            this.disabled = false;
            return of(err);
          }),
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe(async (res) => {
          if (res?.success) {
            const queryParams = {
              returnUrl: this.route.snapshot.queryParams.returnUrl
            };
            
            try {
              await this.authDataService.onSignupSuccess(res, {
                email: sendingData.username,
                countryCode: sendingData.countryCode,
                countryName: tracking?.countryName,
                countryIso: tracking?.countryIso,
                hasCoupon: !!sendingData.coupon_code,
                referralCode: sendingData.adminRfCode || undefined,
                registrationMethod: 'email',
                isIntegrationSignup: false
              });
            } catch {
              // Intentionally ignore tracking failures.
            }

            const onboardingDetails: IonBoardingDetails = {
              onBoardStatus: 'whats_new_step_one'
            };
            this.headerService.hideNotShowDemoBtn = 1;
            this.localStorageService.setOnboardingData(onboardingDetails);
            if (res.termsAndCondition) {
              this.router.navigate(['/manage/onboarding/feature'], { queryParams });
            } else {
              this.router.navigate(['/manage/onboarding/termsAndConditions'], { queryParams });
            }
            // this.scriptService.trackMatomoEvent(
            //   'Registration',
            //   'Registration_Success',
            //   'Registration_Success',
            //   this.localStorageService.getItem('userId')
            // );
            this.scriptService.smartContainerScript();
          }
        })
    );
  }

  sendPreRegistrationEmailOtp(email: string,phone:string,providerType:string) {
    return this.authRepository.sendPreRegistrationEmailOtp(email,phone,providerType);
  }

  verifyPreRegistrationEmailOtp(email: string, otp: string) {
    return this.authRepository.verifyPreRegistrationEmailOtp(email, otp);
  }

  /**
   * @description Check the availability of an email address and update the user interface accordingly.
   * @param username - The email address (username) to be checked for availability.
   */
  OnCheckMail(username: string){
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.registerSubscriptions.push(
      this.authRepository.checkemail({ username }, headerOptions).subscribe({
        next: (res) => {
          if (res.success) {
            this.emailError = '';
          }
        },
        error: (err: HttpErrorResponse) => {
          if (err.error.errorMsg) {
            this.emailError = err.error.errorMsg;
            this.isUserExist.set(true);
          }
        }
      })
    );
  }

  /**
   * @description Unsubscribe from all register-related subscriptions to prevent memory leaks.
   */
  unSubscribeRegisterSubscriptions() {
    this.registerSubscriptions.forEach((sub) => sub.unsubscribe());
  }

  /** Two factor component related functions. */

  /**
   * @description Checks the browser tabs and initiates a two-factor authentication timer if the application token is present in the local storage.
   */
  checkBrowserTabs() {
    if (this.localStorageService.appToken) {
      this.requestTwoFactorTimer();
    } else {
      const warning = this.alertService.warningAlert({
        content:
          'Please close all other OnlineCheckWriter.com tabs or windows and try again!'
      });
      warning.afterClosed().subscribe((res) => {
        if (res) {
          this.router.navigateByUrl('/login');
        }
      });
    }
  }

  /**
   * @description Request a two-factor authentication timer from the authentication repository.
   */
  requestTwoFactorTimer() {
    this.btnDisable = true;
    this.twoFactorsubscriptions.push(
      this.authRepository.requestTwoFactorTimer().subscribe((res) => {
        if (!res.success) {
          if (res.backupActivated === 1) {
            this.useBackupCode = true;
          } else {
            this.useBackupCode = false;
          }
          this.btnDisable = true;
          this.btnDisable1 = false;
          this.showTimer = true;
          this.interval(res.errorMsg ?? res.timer);
        }
      })
    );
  }

  /**
   * @description Retrieve query parameters from the current route snapshot.
   */
  getQueryParams(): void {
    this.twoFactorReturnUrl = this.route.snapshot.params.returnUrl;
    this.twoFactorReturnUrlIfCompanyZero =
      this.route.snapshot.queryParams.returnUrlIfCompanyZero;
  }

  /**
   * @description Start a countdown timer with the specified duration in seconds.
   * @param {number} seconds - The duration of the countdown timer in seconds.
   */
  interval(seconds: number) {
    let value: number[];
    let sec = seconds;
    this.intervalTimer = setInterval(() => {
      value = this.countDown(sec);
      sec -= 1;
      this.display = `${Math.floor(value[2]) < 10 ? '0' : ''}${
        Number.isNaN(Number(Math.floor(value[2]))) ? '00' : Math.floor(value[2])
      }:${Math.floor(value[1]) < 10 ? '0' : ''}${
        Number.isNaN(Number(Math.floor(value[1]))) ? '00' : Math.floor(value[1])
      }:${Math.floor(value[0]) < 10 ? '0' : ''}${
        Number.isNaN(Number(Math.floor(value[0]))) ? '00' : Math.floor(value[0])
      }`;
      if (sec < 0) {
        clearInterval(this.intervalTimer);
        this.showTimer = false;
        this.btnDisable = false;
      }
    }, 1000);
  }

  /**
   * @description Convert a value representing time in seconds to an array of hours, minutes, and seconds.
   * @param {number} val - The time value in seconds to be converted.
   * @returns {number[]} - An array containing hours, minutes, and seconds in that order.
   */
  countDown(val: number): number[] {
    const arr: number[] = [];
    let n = val;
    while (n > 59) {
      arr.push(n % 60);
      n /= 60;
    }

    arr.push(n);
    return arr;
  }

  /**
   * @description Create an info object with the provided content.
   * @param {string} content - The content to be included in the info object.
   * @returns {Object} - An info object containing the provided content.
   */
  info(content: string): object {
    const data = {
      content
    };
    return data;
  }

  /**
   * @description Submit two-factor authentication with payload from component.
   * @param {ITwoFactorPayload} payload - The two-factor authentication payload.
   * @param {Function} clearOtpCallback - Optional callback to clear OTP fields on error.
   */
  submitTwoFactor(payload: ITwoFactorPayload, clearOtpCallback?: () => void): void {
    this.submitBtnDisable = true;
    this.twoFactorsubscriptions.push(
      this.authRepository
        .validateOtp(payload)
        .pipe(
          catchError((err) => {
            this.submitBtnDisable = false;
            // Check if it's an OTP expiration error - show modal with Cancel and Resend buttons
            if (err.error.errorCode === 247) {
              this.handleOtpExpirationModalWithCallback(err, clearOtpCallback);
              return of(false);
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          const apiResponse = res as IApiResSuccessOnly;
          if (!apiResponse.success) {
            this.submitBtnDisable = false;
          }
          if (apiResponse.success) {
            this.twoFactorsubscriptions.push(
              this.authRepository
                .getLoginDetailsUsingToken()
                .subscribe((response: ILoginDetails) => {
                  this.submitBtnDisable = false;
                  if (response.success) {
                    this.authDataService.afterLoginConfig(
                      response,
                      this.twoFactorReturnUrlIfCompanyZero,
                      this.twoFactorReturnUrl
                    );
                  }
                })
            );
          }
        })
    );
  }

  /**
   * @description Handle OTP expiration error with callback support
   * @param err - The error object
   * @param clearOtpCallback - Optional callback to clear OTP fields
   */
  private handleOtpExpirationModalWithCallback(err: HttpErrorResponse, clearOtpCallback?: () => void): void {
    const errorMessage =
      err?.error?.errorMsg || 'Your OTP has expired. Please resend a new OTP.';

    const dialogRef = this.alertService.warningAlert({
      title: 'OTP Expired',
      content: errorMessage,
      doneMsg: 'Resend',
      cancelMsg: 'Cancel',
      isCancel: true,
      isOk: true
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        if (clearOtpCallback) {
          clearOtpCallback();
        }
        this.resendOtpClick();
      }
    });
  }

  /**
   * @description Toggle the display of days selection based on the checkbox state.
   * @param {Event} ev - The click event triggered by the checkbox.
   */
  daysClickShow(ev: Event) {
    const inputChecked = (ev.target as HTMLInputElement).checked;
    if (inputChecked) {
      this.showDays = true;
      this.showDays2 = true;
      this.rememberDeviceChecked = 1;
    } else if (!inputChecked) {
      this.showDays = false;
      this.showDays2 = false;
      this.rememberDeviceChecked = 0;
      this.rememberDevice = 0;
    }
  }

  /**
   * @description Set the number of days to remember the device based on the checkbox state and type.
   * @param {Event} ev - The change event triggered by the checkbox.
   * @param {number} type - The type of days to remember the device (1 to 5).
   */
  rememberFor(ev: Event, type: number) {
    const inputChecked = (ev.target as HTMLInputElement).checked;
    if (type === 1) {
      this.days = 1;
    } else if (type === 2) {
      this.days = 2;
    } else if (type === 3) {
      this.days = 3;
    } else if (type === 4) {
      this.days = 4;
    } else if (type === 5) {
      this.days = 5;
    }

    if (inputChecked) {
      this.rememberDevice = type;
    } else if (!inputChecked) {
      this.rememberDevice = 0;
    }
  }

  /**
   * @description Update the device name based on user input.
   * @param {KeyboardEvent} event - The keyboard event triggered when the user enters a device name.
   */
  enterDeviceName(event: KeyboardEvent) {
    const targetValue = (event.target as HTMLInputElement).value;
    this.deviceName = targetValue;
  }

  /**
   * @description Update the backup code based on user input.
   * @param {KeyboardEvent} event - The keyboard event triggered when the user enters a backup code.
   */
  enterBackupCode(event: KeyboardEvent) {
    const targetValue = (event.target as HTMLInputElement).value;
    this.backUpCode = targetValue;
  }

  /**
   * @description Handle input and navigation between OTP input fields.
   * @param {KeyboardEvent} eve - The keyboard event triggered when a key is pressed.
   * @param {HTMLInputElement} el1 - The first OTP input field element.
   * @param {HTMLInputElement} el2 - The second OTP input field element.
   * @param {number} num - The position/index of the current input field in the OTP sequence.
   */
  tabChange(
    eve: KeyboardEvent,
    el1: HTMLInputElement,
    el2: HTMLInputElement,
    num: number
  ) {
    const targetValue = (eve.target as HTMLInputElement).value;
    const eventKeyCode = eve.keyCode;

    this.str = '';
    // eslint-disable-next-line no-new-wrappers
    const otp = new String(targetValue);

    if (otp.length > 0 && eventKeyCode !== 8) {
      if (this.backValue) {
        this.OTPNumber.splice(num, 1);
      }
      el1.focus();
      el1.select();

      if (el1.value) {
        this.nextVal = true;
      } else {
        this.nextVal = false;
      }

      if (this.OTPNumber.length <= 6) {
        if (this.isClickPos && this.OTPNumber.length > 1) {
          this.OTPNumber[num] = targetValue;
          this.isClickPos = false;
        } else if (this.nextVal) {
          this.OTPNumber[num] = targetValue;
          this.nextVal = false;
        } else {
          this.OTPNumber = [...this.OTPNumber, targetValue];
        }
      }
      this.backValue = false;
    }
    /**
     * @description eventKeyCode == 229 --> is only check for mobile phone
     */
    if (!this.isClickPos && (eventKeyCode === 8 || eventKeyCode === 229)) {
      this.backValue = true;

      if (el2.value !== '') {
        el2.focus();
        el2.select();
        this.OTPNumber.splice(num, 1);
      }
    }

    if (this.isClickPos && (eventKeyCode === 8 || eventKeyCode === 229)) {
      this.OTPNumber.splice(num, 1);
    }

    this.OTPNumber.forEach((el) => {
      this.str += el;
    });
  }


  /**
   * @description Handle the paste event to fill in OTP input fields.
   * @param {ClipboardEvent} event - The clipboard event.
   */
  handlePaste(event: ClipboardEvent, inputs: NodeListOf<HTMLInputElement>) {
    const pasteData = event.clipboardData?.getData('text') || '';

    if (pasteData.length <= inputs.length) {
      inputs.forEach((input, index) => {
        if (pasteData[index]) {
          input.value = pasteData[index];
          this.OTPNumber[index] = pasteData[index];
        }
      });
      event.preventDefault();
    }
  }

  /**
   * @description Handle the selection of an input field when clicked.
   * @param {HTMLInputElement} sel - The HTML input field element that is clicked.
   */
  clickVal(sel: HTMLInputElement) {
    sel.select();
    this.isClickPos = true;
  }

  /**
   * @description Toggle two-factor authentication mode.
   */
  twoAuth() {
    this.backupActivated = 1;
    this.twoFactShow = !this.twoFactShow;
  }

  /**
   * @description Toggle OTP authentication mode.
   */
  useOtp() {
    this.backupActivated = 0;
    this.twoFactShow = !this.twoFactShow;
  }

  /**
   * @description Clear all OTP input fields
   */
  clearOtpFields(): void {
    const otpInputs = document.querySelectorAll<HTMLInputElement>('.otp_box');
    otpInputs.forEach((input) => {
      input.value = '';
    });
    this.OTPNumber = [];
    if (otpInputs.length > 0) {
      otpInputs[0].focus();
    }
  }

  /**
   * @description Handle the request to resend the OTP.
   */
  resendOtpClick() {
    this.clearOtpFields();
    this.btnDisable = true;
    this.showSpinner = true;
    this.twoFactorsubscriptions.push(
      this.authRepository
        .resendMainPageOtp()
        .pipe(
          finalize(() => {
            this.showSpinner = false;
          }),
          catchError((err) => {
            if (!err.error.success && err.error.errorCode) {
              this.btnDisable1 = false;
              this.showTimer = true;
              this.interval(err.error.timer);
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          const response = res as IResendOtpRes;
          if (response.success) {
            this.btnDisable = true;
            this.btnDisable1 = false;
            this.showTimer = true;
            this.interval(response.timer);
          }
        })
    );
  }

  /**
   * @description Initiate a contact with customer support or live chat.
   */
  contactSupport() {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

  /**
   * @description Initialize the set new password form.
   */
  initForm(): void {
    this.setNewPasswordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      password: ['', Validators.required],
      passwordConfirmation: ['', Validators.required]
    });
  }

  /**
   * @description Extract form data into a structured object.
   * @returns {ISetNewPasswordForm} - A structured object containing password and password confirmation values.
   */
  formBody(): ISetNewPasswordForm {
    const setNewPassword = this.setNewPasswordForm?.value;
    return {
      currentPassword: setNewPassword.currentPassword,
      password: setNewPassword.password,
      confirmPassword: setNewPassword.passwordConfirmation
    };
  }

  /**
   * @description Check and validate the confirmation password.
   * @param {Event} [event] - The input event triggered when the user enters or updates the confirmation password.
   */
  checkConfirmPassword(event?: Event) {
    const eventTarget = event?.target as HTMLInputElement;
    const confirmPass = eventTarget.value;
    const val = String(confirmPass);
    if (this.password !== confirmPass && val.length > 0) {
      this.isConfirmPassword = true;
    } else {
      this.isConfirmPassword = false;
    }
    this.confirmPassword = confirmPass;
  }

  /**
   * @description Handle the submission of a new password form.
   */
  onPasswordSubmit(): void {
    if (this.isPasswordAssistanceShown === true) {
      return;
    }
    this.setNewPasswordForm.markAllAsTouched();
    if (this.setNewPasswordForm.invalid) {
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.isConfirmPassword = true;
      return;
    }

    this.isPasswordSubmit = true;

    this.twoFactorsubscriptions.push(
      this.authRepository
        .setNewPassword(this.formBody())
        .pipe(
          finalize(() => {
            this.isPasswordSubmit = false;
          })
        )
        .subscribe((res) => {
          if (res.success === false) {
            const errorData = {
              title: 'Error',
              content: res.data,
              doneMsg: 'Ok'
            };
            const dialog = this.alertService.warningAlert(errorData);
            dialog.afterClosed().subscribe((response) => {
              if (response) {
                this.router.navigateByUrl('/manage/company_management');
              }
            });
            return;
          }
          const resData = {
            title: 'Updated!',
            content: res.data,
            doneMsg: 'Ok'
          };
          const dialog = this.alertService.successAlert(resData);
          dialog.afterClosed().subscribe((dialogRes) => {
            if (dialogRes) {
              this.router.navigateByUrl('/manage/company_management');
            }
          });
        })
    );
  }

  /** Common Functions. */

  /**
   * @description Perform password validation and provide user feedback on password strength.
   * @param {Event} event - The input event triggered when the user enters or updates a password.
   */
  onPasswordValidation(event: Event) {
    const eventTarget = event.target as HTMLInputElement;
    const password = eventTarget.value;
    const val = String(password);

    if (val.length > 0) {
      this.isPasswordAssistanceShown = true;
    } else {
      this.isPasswordAssistanceShown = false;
    }
    const letter = document.getElementById('letter');
    const capital = document.getElementById('capital');
    const number = document.getElementById('number');
    const specialCharacter = document.getElementById('specialCharacter');
    const length = document.getElementById('length');
    const validateClass = (element: HTMLElement, isValid: boolean) => {
      if (isValid) {
        element.classList.remove('invalid');
        element.classList.add('valid');
      } else {
        element.classList.add('invalid');
        element.classList.remove('valid');
      }
    };

    const lowerCaseLetters = /[a-z]/g;
    validateClass(letter as HTMLElement, !!password.match(lowerCaseLetters));

    const upperCaseLetters = /[A-Z]/g;
    validateClass(capital as HTMLElement, !!password.match(upperCaseLetters));

    const numbers = /[0-9]/g;
    validateClass(number as HTMLElement, !!password.match(numbers));

    const specialcharacter = /[!"`'#%&,:;<>=@{}~$()*+/\\?[\]^|]+/g;
    validateClass(
      specialCharacter as HTMLElement,
      !!password.match(specialcharacter)
    );

    validateClass(length as HTMLElement, password?.length >= 8);

    if (
      password.match(lowerCaseLetters) &&
      password.match(upperCaseLetters) &&
      password.match(numbers) &&
      password.match(specialcharacter) &&
      password.length >= 8
    ) {
      this.isPasswordAssistanceShown = false;
    }
    this.password = password;
  }

  /**
   * @description Loads application settings and updates the component's state with the retrieved configuration.
   */
  loadAppSettings(): void {
    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe(
        (config: IAppConfig | null) => {
          if (config) {
            this.appConfig = config;
          }
        }
      )
    );
  }

  /**
   * converts time string to seconds
   */
  getTimerSecond(timeString: string) {
    const timeRegex = /(\d+)m (\d+)s/;
    const match = timeString?.match(timeRegex);

    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const totalTimeInSeconds = minutes * 60 + seconds;
      this.startTimer(totalTimeInSeconds);
    }
  }

  /**
   * @description This function countdown from the time we given as param (output format 'hh:mm:ss')
   * @param time The no of seconds
   */
  startTimer(time: number) {
    this.timer = time;
    const source = interval(1000);
    this.timerSubscription = source.subscribe(() => {
      if (this.timer > 0) {
        this.timerExist.set(true);
        this.timer -= 1;
        const hours = Math.floor(this.timer / 3600);
        const minutes = Math.floor((this.timer % 3600) / 60);
        const seconds = this.timer % 60;
        const timeToShow = `${hours < 10 ? '0' : ''}${hours}:${
          minutes < 10 ? '0' : ''
        }${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        this.displayTimer.set(timeToShow);
      } else {
        this.timerExist.set(false);
        this.timerSubscription.unsubscribe();
      }
    });
  }

  /**
   * @description Unsubscribe common subscriptions to prevent memory leaks.
   */
  unSubscibeCommonSubscription() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.intervalTimer) {
      this.display = '';
      clearInterval(this.intervalTimer);
    }
  }

  trackOutsideSignupPageVisit(page: string, email: string, phone?: string) {
    this.subscriptions.push(
    this.authRepository.trackOutsideSignupPageVisit({
      page,
        phone,
        email
      }).subscribe()
    );
  }

}
