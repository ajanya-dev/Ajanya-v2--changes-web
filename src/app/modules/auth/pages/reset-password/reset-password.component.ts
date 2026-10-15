import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { RecaptchaService } from 'src/app/core/services/recaptcha.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { ILoginDetails } from 'src/app/modules/auth/model/login';
import { AuthDataService } from 'src/app/shared/service/auth/auth-data.service';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { NgClass, NgIf } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/pro-solid-svg-icons';
import { LocalStorageKeys } from 'src/app/models/local-storage';
import { BrowserTokenService } from 'src/app/core/services/browser-token.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgClass, NgIf, FontAwesomeModule]
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  isPasswordAssistanceShown = false;
  isValid = true;
  isuserName = false;
  isPassWdMatch = false;
  isPasswordShow = false;
  isConfirmPasswordShow = false;
  ispassword = false;
  isConpass = false;
  password: string = '';
  confirmPassword: string = '';
  emailData: string | undefined;
  token: string | null;

  returnUrl: string;
  returnUrlIfCompanyZero: string;
  appConfig: IAppConfig;

  subscriptions: Subscription[] = [];
  submitBtnProp = {
    text: 'Reset Now',
    disabled: false
  };

  recaptchaToken: string | undefined;

  user = document.getElementById('username');
  pswd = document.getElementById('password');
  cnfPswd = document.getElementById('cpassword');

  faEye = faEye;
  faEyeSlash = faEyeSlash;

  private fb = inject(UntypedFormBuilder);
  private activatedRoute = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private browserTokenService = inject(BrowserTokenService);
  private appSettingService = inject(AppSettingsService);
  private authDataService = inject(AuthDataService);
  private localStorageService = inject(LocalStorageService);
  private recaptchaService = inject(RecaptchaService);

  constructor() {
    this.subscriptions.push(
      this.activatedRoute.queryParams.subscribe((data) => {
        if (data) {
          this.emailData = data.email;
        }
      })
    );
  }

  resetPassword: FormGroup = this.fb.group({
    username: new UntypedFormControl('', [
      Validators.required,
      Validators.minLength(3)
    ]),
    password: new UntypedFormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(100)
    ]),
    passwordConfirmation: new UntypedFormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(100)
    ])
  });

  ngOnInit(): void {
    this.loadAppSettings();
    this.token = this.activatedRoute.snapshot.paramMap.get('id');
    this.returnUrl =
      this.activatedRoute.snapshot.queryParams.returnUrl ||
      '/manage/company_management';
    this.returnUrlIfCompanyZero =
      this.activatedRoute.snapshot.queryParams.returnUrl ||
      'manage/company_management';
    if (this.emailData) {
      this.resetPassword.controls.username.patchValue(this.emailData);
    }
    this.getBrowserAuthToken();
  }

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

  onKeyUp(x: any) {
    const pswd = x.target.value;
    const val = String(pswd);

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

    // Validate lowercase letters
    const lowerCaseLetters = /[a-z]/g;
    if (pswd.match(lowerCaseLetters)) {
      letter?.classList.remove('invalid');
      letter?.classList.add('valid');
    } else {
      letter?.classList.remove('valid');
      letter?.classList.add('invalid');
    }

    // Validate capital letters
    const upperCaseLetters = /[A-Z]/g;
    if (pswd.match(upperCaseLetters)) {
      capital?.classList.remove('invalid');
      capital?.classList.add('valid');
    } else {
      capital?.classList.remove('valid');
      capital?.classList.add('invalid');
    }

    // Validate numbers
    const numbers = /[0-9]/g;
    if (pswd.match(numbers)) {
      number?.classList.remove('invalid');
      number?.classList.add('valid');
    } else {
      number?.classList.remove('valid');
      number?.classList.add('invalid');
    }

    // Validate special character
    const specialcharacter = /[!"`'#%&,:;<>=@{}~\$\(\)\*\+\/\\\?\[\]\^\|]+/g;
    if (pswd.match(specialcharacter)) {
      specialCharacter?.classList.remove('invalid');
      specialCharacter?.classList.add('valid');
    } else {
      specialCharacter?.classList.remove('valid');
      specialCharacter?.classList.add('invalid');
    }

    // validate length
    if (pswd.length >= 8) {
      length?.classList.remove('invalid');
      length?.classList.add('valid');
    } else {
      length?.classList.remove('valid');
      length?.classList.add('invalid');
    }

    if (
      pswd.match(lowerCaseLetters) &&
      pswd.match(upperCaseLetters) &&
      pswd.match(numbers) &&
      pswd.match(specialcharacter) &&
      pswd.length >= 8
    ) {
      this.isPasswordAssistanceShown = false;
    }

    this.password = pswd;

    if (x.keyCode === 13 && x.target.value !== '') {
      this.cnfPswd?.focus();
    }
    if (this.confirmPassword !== '') {
      this.validatePasswords();
    }
  }

  KeyUp(env: any, type: any) {
    const value = String(env.target.value);
    if (value.length >= 1) {
      if (type === 'u') {
        this.isuserName = false;
      } else {
        if (this.password !== '') {
          if (value !== this.password) {
            this.isPassWdMatch = true;
          } else {
            this.isPassWdMatch = false;
          }
        }
        this.confirmPassword = value;
      }
    } else if (type === 'u') {
      this.isuserName = true;
    } else {
      this.confirmPassword = value;
      this.isPassWdMatch = true;
    }

    if (env.keyCode === 13 && env.target.value !== '') {
      if (type === 'u') {
        this.pswd?.focus();
      } else {
        this.submit();
      }
    }
  }

  validatePasswords() {
    if (this.password.length >= 1 && this.confirmPassword.length >= 1) {
      this.isPassWdMatch = this.password !== this.confirmPassword;
    } else {
      this.isPassWdMatch = true;
    }
  }

  getStatus() {
    if (this.confirmPassword === '') {
      return 'Confirm password is required';
    }
    return 'Password does not match';
  }

  submit() {
    this.isValid = true;
    if (
      this.resetPassword.value.username === null ||
      this.resetPassword.value.username === undefined ||
      this.resetPassword.value.username === ''
    ) {
      this.isuserName = true;
      this.isValid = false;
    }

    if (
      this.resetPassword.value.password === null ||
      this.resetPassword.value.password === undefined ||
      this.resetPassword.value.password === ''
    ) {
      this.ispassword = true;
      this.isValid = false;
    }
    if (
      this.resetPassword.value.password === null ||
      this.resetPassword.value.password === undefined ||
      this.resetPassword.value.password === ''
    ) {
      this.isPassWdMatch = true;
      this.isValid = false;
    }

    if (this.resetPassword.value.passwordConfirmation !== '') {
      if (
        this.resetPassword.value.password !=
        this.resetPassword.value.passwordConfirmation
      ) {
        this.isPassWdMatch = true;
        this.isValid = false;
      }
    } else {
      this.isPassWdMatch = true;
      this.isValid = false;
    }

    if (!this.isValid) {
      return;
    }

    if (this.resetPassword.invalid) {
      return;
    }
    const doResetRequest = () => {
      this.resetPassword.value.token = this.token;
      this.resetPassword.value.recaptcha = this.recaptchaToken;
      this.submitBtnProp.disabled = true;
      this.subscriptions.push(
        this.authService.resetPassword(this.resetPassword.value).subscribe(
          (res: any) => {
            if (res.success) {
              this.submitBtnProp.text = 'Logging in...';
              this.subscriptions.push(
                this.authService
                  .login({
                    username: this.resetPassword.value.username,
                    password: this.resetPassword.value.password,
                    recaptcha: this.recaptchaToken
                  })
                  .pipe(catchError(() => of(false)))
                  .subscribe((response: ILoginDetails) => {
                    if (response.success) {
                      this.authDataService.afterLogin(
                        response,
                        this.returnUrlIfCompanyZero,
                        this.returnUrl,
                        undefined,
                        'email',
                        this.resetPassword.value.username
                      );
                    }
                    /** *********************Invalid Credential************************ */
                  })
              );
            }
          },
          () => {
            this.submitBtnProp = {
              text: 'Reset Now',
              disabled: false
            };
          }
        )
      );
    };
    this.subscriptions.push(
      this.recaptchaService.recaptchaToken.subscribe(
        (res: string | undefined) => {
          this.recaptchaToken = res;
          doResetRequest();
        }
      )
    );
  }

  getBrowserAuthToken(): void {
    this.browserTokenService.refresh();
  }

  setStorage(key: LocalStorageKeys, value: any) {
    this.localStorageService.setItem(key, value);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
