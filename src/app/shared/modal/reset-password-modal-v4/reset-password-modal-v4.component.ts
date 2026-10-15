import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';
import { LucideAngularModule, Eye, EyeOff, Lock } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { type ISetPasswordExternalPayload } from 'src/app/modules/auth/components/register/model/register';
import { ESignatureAgreementV4Component } from 'src/app/modules/auth/modal/e-signature-agreement-v4/e-signature-agreement-v4.component';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { environment } from 'src/environments/environment';

import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

import { PayeeOnboardingService } from 'src/app/modules/payee-onboarding/services/payee-onboarding.service';
import { V4AlertService } from '../../service/alert/v4-alert.service';

interface IResetPasswordV4Form {
  email: FormControl<string | null>;
  password: FormControl<string | null>;
  passwordConfirmation: FormControl<string | null>;
  externalLogin: FormControl<string | null>;
  termsAndCondition: FormControl<boolean | null>;
  eSign: FormControl<boolean | null>;
  ccpa: FormControl<boolean | null>;
}

export interface IResetPasswordModalV4Data {
  email?: string;
  externalToken?: string;
}

@Component({
  selector: 'app-reset-password-modal-v4',
  standalone: true,
  templateUrl: './reset-password-modal-v4.component.html',
  styleUrls: ['./reset-password-modal-v4.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    CommonButtonV4Component
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordModalV4Component implements OnInit {
  private dialogRef = inject(MatDialogRef<ResetPasswordModalV4Component>);
  private data = inject(MAT_DIALOG_DATA) as IResetPasswordModalV4Data | null;
  public payeeOnboardingService = inject(PayeeOnboardingService);
  private authService = inject(AuthService);
  private alertService = inject(V4AlertService);
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);
  private userProfileService = inject(UserProfileService);
  private destroyRef = inject(DestroyRef);

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  env = environment;

  readonly LockIcon = Lock;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;

  showValidBox = false;
  formSubmitting = signal(false);
  passwordInputType: 'password' | 'text' = 'password';

  resetPasswordForm = new FormGroup<IResetPasswordV4Form>({
    email: new FormControl<string | null>('', [Validators.required]),
    password: new FormControl<string | null>('', [Validators.required]),
    passwordConfirmation: new FormControl<string | null>('', [
      Validators.required
    ]),
    externalLogin: new FormControl<string | null>('', [Validators.required]),
    termsAndCondition: new FormControl<boolean>(false, [
      Validators.requiredTrue
    ]),
    eSign: new FormControl<boolean>(false, [Validators.requiredTrue]),
    ccpa: new FormControl<boolean>(false, [Validators.requiredTrue])
  });

  passwordValidation = {
    password: false,
    passwordConfirmation: false,
    get passwordsMatch() {
      return this.password === this.passwordConfirmation;
    }
  };

  ngOnInit(): void {
    this.seedForm();
    this.loadPayeeProfile();
  }

  private seedForm(): void {
    const email =
      this.data?.email ||
      this.payeeOnboardingService.userDetailsSignal()?.email ||
      this.localStorageService.getItem('email') ||
      '';
    const externalToken =
      this.data?.externalToken ||
      this.payeeOnboardingService.payeeOnboardingSignal().externalToken ||
      '';

    this.resetPasswordForm.controls.email.setValue(email);
    this.resetPasswordForm.controls.externalLogin.setValue(externalToken);
  }

  private loadPayeeProfile(): void {
    if (this.payeeOnboardingService.userDetailsSignal()?.email) return;
    this.userProfileService
      .getPersonalInfo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.payeeOnboardingService.userDetailsSignal.set(res.data);
        if (!this.resetPasswordForm.controls.email.value) {
          this.resetPasswordForm.controls.email.setValue(res.data.email);
        }
      });
  }

  passWordMismatch() {
    if (
      !this.resetPasswordForm.value.password &&
      !this.resetPasswordForm.value.passwordConfirmation
    )
      return undefined;
    if (
      this.resetPasswordForm.controls.passwordConfirmation.touched &&
      this.resetPasswordForm.value.password !==
        this.resetPasswordForm.value.passwordConfirmation
    ) {
      this.passwordValidation.passwordConfirmation = false;
      return true;
    }
    this.passwordValidation.passwordConfirmation = true;
    return false;
  }

  isPasswordValid() {
    const ids = ['letter', 'capital', 'number', 'specialCharacter', 'length'];
    const [lowerCase, upperCase, numberEl, specialEl, lengthEl] = ids.map(
      (id) => document.getElementById(id)
    );

    const validateClass = (el: HTMLElement | null, ok: boolean) => {
      if (!el) return;
      if (ok) {
        el.classList.remove('invalid');
        el.classList.add('valid');
      } else {
        el.classList.add('invalid');
        el.classList.remove('valid');
      }
    };

    const password = this.resetPasswordForm.value.password ?? '';
    const lowerCaseMatch = !!password.match(/[a-z]/g);
    const upperCaseMatch = !!password.match(/[A-Z]/g);
    const numberMatch = !!password.match(/[0-9]/g);
    const specialMatch = !!password.match(
      /[!"`'#%&,:;<>=@{}~$()*+/\\?[\]^|]+/g
    );
    const lengthMatch = password.length >= 8;

    validateClass(lowerCase, lowerCaseMatch);
    validateClass(upperCase, upperCaseMatch);
    validateClass(numberEl, numberMatch);
    validateClass(specialEl, specialMatch);
    validateClass(lengthEl, lengthMatch);

    this.passwordValidation.password =
      lowerCaseMatch &&
      upperCaseMatch &&
      numberMatch &&
      specialMatch &&
      lengthMatch;
  }

  togglePasswordType() {
    this.passwordInputType =
      this.passwordInputType === 'password' ? 'text' : 'password';
  }

  openTermsDialog(checked: boolean): void {
    if (!checked) {
      this.resetPasswordForm.controls.eSign.setValue(false);
      return;
    }
    this.dialog
      .open(ESignatureAgreementV4Component, {
        width: '720px',
        maxWidth: '95vw',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true
      })
      .beforeClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.resetPasswordForm.controls.eSign.setValue(!!res);
      });
  }

  onReset(): void {
    this.resetPasswordForm.markAllAsTouched();

    const isPasswordValid =
      this.passwordValidation.password &&
      this.passwordValidation.passwordConfirmation &&
      this.passwordValidation.passwordsMatch;

    if (this.resetPasswordForm.value.password && !this.passwordValidation.password) {
      this.showValidBox = true;
    }

    if (this.resetPasswordForm.invalid || !isPasswordValid) return;

    if (!this.resetPasswordForm.value.eSign) {
      this.alertService.warningAlert({
        isOk: true,
        doneMsg: 'OK',
        title: 'Accept E-Signature Agreement',
        content:
          'To continue, please confirm your acceptance of the E-Signature Agreement.'
      });
      return;
    }

    if (!this.resetPasswordForm.value.termsAndCondition) {
      this.alertService.warningAlert({
        isOk: true,
        doneMsg: 'OK',
        title: 'Accept Terms to Continue',
        content:
          'To continue, please confirm your acceptance of the terms and conditions.'
      });
      return;
    }

    if (!this.resetPasswordForm.value.ccpa) {
      this.alertService.warningAlert({
        isOk: true,
        doneMsg: 'OK',
        title: 'Accept California Consumer Privacy Act',
        content:
          'To continue, please confirm your acceptance of the California Consumer Privacy Act.'
      });
      return;
    }

    this.formSubmitting.set(true);

    const payload: ISetPasswordExternalPayload = {
      email: this.resetPasswordForm.value.email ?? '',
      password: this.resetPasswordForm.value.password ?? '',
      passwordConfirmation:
        this.resetPasswordForm.value.passwordConfirmation ?? '',
      externalLogin: this.resetPasswordForm.value.externalLogin ?? '',
      termsAndCondition: this.resetPasswordForm.value.termsAndCondition ?? false
    };

    this.authService
      .resetPasswordExternalLogin(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.formSubmitting.set(false))
      )
      .subscribe((res) => {
        if (res.success) {
          this.localStorageService.setItem('payeePasswordSet', '1');
          this.clearOnboardingState();
          this.alertService.successAlert({
            title: 'Account Setup Complete',
            content:
              'Your password has been set successfully. You can now access all features of your account.'
          });
          this.dialogRef.close(true);
        }
      });
  }

  private clearOnboardingState(): void {
    ['payeeObInitId', 'payeeObExtToken', 'payeeObInitFrom', 'payeeObIsNewUser']
      .forEach((key) => this.localStorageService.removeItem(key as never));
    this.payeeOnboardingService.payeeOnboardingSignal.set({});
  }
}
