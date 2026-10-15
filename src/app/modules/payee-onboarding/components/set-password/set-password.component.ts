import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { type ISetPasswordExternalPayload } from 'src/app/modules/auth/components/register/model/register';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { Router } from '@angular/router';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { IUserVerification } from 'src/app/models/user';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { Subject, finalize, takeUntil } from 'rxjs';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { faEye } from '@fortawesome/pro-solid-svg-icons';
import { CommonModule } from '@angular/common';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { PayeeOnboardingService } from '../../services/payee-onboarding.service';

interface IRegisterForm {
  email: FormControl<string | undefined | null>;
  password: FormControl<string | null>;
  passwordConfirmation: FormControl<string | null>;
  externalLogin: FormControl<string | null>;
}

@Component({
  selector: 'app-set-password',
  templateUrl: './set-password.component.html',
  styleUrls: ['./set-password.component.scss'],
  imports: [
    CommonModule,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    FontAwesomeModule,
    CommonButtonV35Component,
    FormsModule,
    ReactiveFormsModule
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SetPasswordComponent implements OnInit, OnDestroy {
  public payeeOnboardingService = inject(PayeeOnboardingService);
  private authService = inject(AuthService);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  private userProfileService = inject(UserProfileService);
  private bankAccountService = inject(BankAccountsService);

  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  showValidBox = false;
  userVerification?: IUserVerification;
  formSubmitting = false;
  isUserVerified = false;
  destroy$ = new Subject<boolean>();
  loading = false;
  faEye = faEye;

  passwordInputType: 'password' | 'text' = 'password';

  termsAndCondition = new FormControl<boolean>(false, [
    Validators.requiredTrue
  ]);

  userForm = new FormGroup<IRegisterForm>({
    email: new FormControl(
      this.payeeOnboardingService.userDetailsSignal()?.email,
      [Validators.required]
    ),
    password: new FormControl<string | null>('', [Validators.required]),
    passwordConfirmation: new FormControl<string | null>('', [
      Validators.required
    ]),
    externalLogin: new FormControl(
      this.payeeOnboardingService.payeeOnboardingSignal().externalToken ?? '',
      Validators.required
    )
  });

  passwordValidation = {
    password: false,
    passwordConfirmation: false,
    get passwordsMatch() {
      return this.password === this.passwordConfirmation;
    }
  };

  ngOnInit(): void {
    if (this.localStorageService.getItem('payeePasswordSet') === '1') {
      this.withdrawToBankAccount();
      return;
    }
    this.getPayeeData();
  }

  /**
   * @description Method to get wallet history details required to show wallet details of onboarding payee.
   */
  getPayeeData() {
    this.userProfileService
      .getPersonalInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.payeeOnboardingService.userDetailsSignal.set(res.data);
        this.userForm.controls.email.setValue(res.data.email);
        this.userForm.controls.externalLogin.setValue(
          this.payeeOnboardingService.payeeOnboardingSignal().externalToken ??
            ''
        );
      });
  }

  getIsUserVerified() {
    this.userProfileService.UserVerification$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((res) => {
      this.userVerification = res;
      if (
        this.userVerification.email_verified === 1 &&
        this.userVerification.phone_verified === 1
      ) {
        this.isUserVerified = true;
      }
    });
  }

  /**
   * @description Method to check if password and confirm passwords match.
   * @returns Boolean.
   */
  passWordMismatch() {
    if (
      !this.userForm.value.password &&
      !this.userForm.value.passwordConfirmation
    )
      return undefined;
    if (
      this.userForm.controls.passwordConfirmation.touched &&
      this.userForm.value.password !== this.userForm.value.passwordConfirmation
    ) {
      this.passwordValidation.passwordConfirmation = false;
      return true;
    }
    this.passwordValidation.passwordConfirmation = true;
    return false;
  }

  /**
   * @description Method to validate password in setting password page.
   */
  isPasswordValid() {
    const lowerCaseElement = document.getElementById('letter') as HTMLElement;
    const upperCaseElement = document.getElementById('capital') as HTMLElement;
    const numberElement = document.getElementById('number') as HTMLElement;
    const specialCharacterElement = document.getElementById(
      'specialCharacter'
    ) as HTMLElement;
    const minLengthElement = document.getElementById('length') as HTMLElement;

    const validateClass = (element: HTMLElement, isValid: boolean) => {
      if (isValid) {
        element.classList.remove('invalid');
        element.classList.add('valid');
      } else {
        element.classList.add('invalid');
        element.classList.remove('valid');
      }
    };

    const password = this.userForm?.value?.password;
    const lowerCaseLetters = /[a-z]/g;
    const lowerCaseMatch = !!password?.match(lowerCaseLetters);
    validateClass(lowerCaseElement, lowerCaseMatch);

    const upperCaseLetters = /[A-Z]/g;
    const upperCaseMatch = !!password?.match(upperCaseLetters);
    validateClass(upperCaseElement, upperCaseMatch);

    const numbers = /[0-9]/g;
    const numberMatch = !!password?.match(numbers);
    validateClass(numberElement, numberMatch);

    const specialCharacters = /[!"`'#%&,:;<>=@{}~$()*+/\\?[\]^|]+/g;
    const specialCharacterMatch = !!password?.match(specialCharacters);
    validateClass(specialCharacterElement, specialCharacterMatch);

    const minLengthMatch = !!password && password?.length >= 8;
    validateClass(minLengthElement, minLengthMatch);

    if (
      lowerCaseMatch &&
      upperCaseMatch &&
      numberElement &&
      specialCharacterMatch &&
      minLengthMatch
    ) {
      this.passwordValidation.password = true;
    } else {
      this.passwordValidation.password = false;
    }
  }

  /**
   * @description Method to set user account password.
   */
  setPayeePassword() {
    this.userForm.markAllAsTouched();
    this.termsAndCondition.markAsTouched();

    const isPasswordValid =
      this.passwordValidation.password &&
      this.passwordValidation.passwordConfirmation &&
      this.passwordValidation.passwordsMatch;

    if (this.userForm.value.password && !this.passwordValidation.password) {
      this.showValidBox = true;
    }

    if (
      this.userForm.invalid ||
      !isPasswordValid ||
      this.termsAndCondition.invalid
    )
      return;

    this.formSubmitting = true;

    this.authService
      .resetPasswordExternalLogin(
        this.userForm.value as ISetPasswordExternalPayload
      )
      .pipe(
        finalize(() => {
          this.formSubmitting = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.localStorageService.setItem('payeePasswordSet', '1');

          if (this.isUserVerified === false) {
            this.router.navigate(['/manage/users/verify-email-phone'], {
              queryParams: {
                returnUrl: this.router.url
              },
              replaceUrl: true
            });
            return;
          }

          if (this.isUserVerified === true) {
            this.withdrawToBankAccount();
          }
        }
      });
  }

  /**
   * @description Method invoked when withdraw to bank account is selected. Routes to the corresponding page.
   */
  withdrawToBankAccount() {
    this.loading = true;
    this.bankAccountService
      .getBankAccountList(1)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        const isDemoBankAccount = res.data?.some(
          (bankAccount) =>
            bankAccount?.name === 'Demo Bank Account 1' &&
            bankAccount?.bankName === 'Chase Bank' &&
            bankAccount?.nickName === 'Demo Bank Account-1'
        );
        if (res.data?.length && !isDemoBankAccount) {
          ['payeeObInitId', 'payeeObExtToken', 'payeeObInitFrom'].forEach(
            (val) => {
              this.localStorageService.removeItem(val);
            }
          );
          this.payeeOnboardingService.ngOnDestroy();
          this.router.navigate(['/manage/transfers/index'], {
            replaceUrl: true
          });
        } else {
          this.router.navigate(['/manage/users/add-bank-account'], {
            replaceUrl: true
          });
        }
      });
  }

  togglePassowrdType() {
    this.passwordInputType =
      this.passwordInputType === 'password' ? 'text' : 'password';
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
