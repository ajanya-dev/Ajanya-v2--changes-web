import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { faEye, faXmark, faCircleExclamation, faEyeSlash } from '@fortawesome/pro-solid-svg-icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ISetPasswordExternalPayload } from 'src/app/modules/auth/components/register/model/register';
import { finalize } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { environment } from 'src/environments/environment';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { ESignatureAgreementComponent } from 'src/app/modules/auth/modal/e-signature-agreement/e-signature-agreement.component';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IHeaderData } from 'src/app/layout/model/header';
import { AuthService } from '../../service/auth/auth.service';
import { AlertService } from '../../service/alert/alert.service';
import { 
  IResetPasswordConfig,
  IResetPasswordDialogData, 
  IResetPasswordResult
} from './reset-password-modal.interfaces';
import { HeaderService } from '../../service/header/header.service';


interface IResetPasswordForm {
  password: FormControl<string | null>;
    confirmPassword: FormControl<string | null>;
    email: FormControl<string | null>;
    externalLink: FormControl<string | null>;
    termsAndCondition: FormControl<boolean | null>; 
    eSign: FormControl<boolean | null>;
    ccpa: FormControl<boolean | null>;
}

@Component({
  selector: 'app-reset-password-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonInputFieldComponent,
    CommonButtonV35Component,
    V35ControlMessageComponent,
    NgClass,
    FaIconComponent
  ],
  templateUrl: './reset-password-modal.component.html',
  styleUrls: ['./reset-password-modal.component.scss']
})
export class ResetPasswordModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ResetPasswordModalComponent>);
  private appSettingService = inject(AppSettingsService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  
  // Inject dialog data
  private data = inject(MAT_DIALOG_DATA) as IResetPasswordDialogData | null;

  env = environment;
  isArcharina = environment.env_id === 'archarina' || environment.env_id === 'archarina-sandbox';
  // Icons
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faXmark = faXmark;
  faCircleExclamation = faCircleExclamation;
  
  // Component state
  formSubmitting = false;
  showValidBox = false;
  passwordInputType: 'password' | 'text' = 'password';

  // Form setup following SetPasswordComponent pattern
  resetPasswordForm = new FormGroup<IResetPasswordForm>({
    password: new FormControl<string | null>('', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]),
    confirmPassword: new FormControl<string | null>('', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]),
    email: new FormControl<string | null>(this.appSettingService.getInvitationState().email ?? '', [Validators.required, Validators.email]),
    externalLink: new FormControl<string | null>(this.appSettingService.getInvitationState().externalToken ?? '', [Validators.required]),
    termsAndCondition: new FormControl<boolean | null>(false, [Validators.requiredTrue]),
    eSign: new FormControl<boolean | null>(false),
    ccpa: new FormControl<boolean | null>(false)
  });

  // Password validation state (from SetPasswordComponent)
  passwordValidation = {
    password: false,
    passwordConfirmation: false
  };

  defaultConfig: IResetPasswordConfig = {
    title: 'Reset password',
    subtitle: 'Enter a new password for your account.',
    mainButtonText: 'Reset Password',
    secondaryButtonText: 'Cancel'
  };

  config: IResetPasswordConfig = this.defaultConfig;

  ngOnInit(): void {
    this.config = {
      title: this.data?.config?.title || this.defaultConfig.title,
      subtitle: this.data?.config?.subtitle || this.defaultConfig.subtitle,
      mainButtonText: this.data?.config?.mainButtonText || this.defaultConfig.mainButtonText,
      secondaryButtonText: this.data?.config?.secondaryButtonText || this.defaultConfig.secondaryButtonText
    };
    // Handle initial data from dialog injection first (takes priority)
    if (this.data?.initialData?.email) {
      this.resetPasswordForm.controls.email.setValue(this.data.initialData.email);
    }
    if (this.data?.initialData?.externalToken) {
      this.resetPasswordForm.controls.externalLink.setValue(this.data.initialData.externalToken);
    }
    
    // Fallback to existing logic if no dialog data provided
    if (!this.data?.initialData?.email && !this.data?.initialData?.externalToken) {
      const invitationObject: {externalToken: string, email: string, invitation: boolean} = JSON.parse(sessionStorage.getItem('invitationObject') ?? '{}');
      if (invitationObject && invitationObject.invitation) {
        this.resetPasswordForm.controls.externalLink.setValue(invitationObject.externalToken);
        this.resetPasswordForm.controls.email.setValue(invitationObject.email);
      }
    }
    
    // Prevent stale localStorage email from overriding the invited user's email
    if (!this.resetPasswordForm.controls.email.value) {
      this.setUserEmail();
    }
  }

  setUserEmail(): void {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const headerData = res as unknown as IHeaderData;
        if (headerData) {
          this.resetPasswordForm.controls.email.setValue(headerData.userInfo.email);
        } else {
          this.headerService.headerData()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((apiRes) => {
              if (apiRes?.data?.personalInfo?.email) {
                this.resetPasswordForm.controls.email.setValue(apiRes.data.personalInfo.email);
              }
            });
        }
      });
  }

  /**
   * Method to check if password and confirm passwords match (from SetPasswordComponent)
   */
  passWordMismatch() {
    if (
      !this.resetPasswordForm.value.password &&
      !this.resetPasswordForm.value.confirmPassword
    )
      return undefined;
    
    if (
      this.resetPasswordForm.controls.confirmPassword.touched &&
      this.resetPasswordForm.value.password !== this.resetPasswordForm.value.confirmPassword
    ) {
      this.passwordValidation.passwordConfirmation = false;
      return true;
    }
    
    this.passwordValidation.passwordConfirmation = true;
    return false;
  }

  /**
   * Method to validate password (adapted from SetPasswordComponent)
   */
  isPasswordValid() {
    const lowerCaseElement = document.getElementById('letter') as HTMLElement;
    const upperCaseElement = document.getElementById('capital') as HTMLElement;
    const numberElement = document.getElementById('number') as HTMLElement;
    const specialCharacterElement = document.getElementById('specialCharacter') as HTMLElement;
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

    const password = this.resetPasswordForm?.value?.password;
    
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
      numberMatch &&
      specialCharacterMatch &&
      minLengthMatch
    ) {
      this.passwordValidation.password = true;
      this.showValidBox = false;
    } else {
      this.passwordValidation.password = false;
      this.showValidBox = true;
    }
  }

  /**
   * Toggle password visibility (from SetPasswordComponent)
   */
  togglePasswordType() {
    this.passwordInputType = this.passwordInputType === 'password' ? 'text' : 'password';
  }

  /**
   * Handle password reset (adapted from SetPasswordComponent)
   */
  onReset(): void {
    this.resetPasswordForm.markAllAsTouched();
    const formValues = this.resetPasswordForm.value;
    const passwordsMatch = formValues.password === formValues.confirmPassword;

    this.passwordValidation.passwordConfirmation = passwordsMatch;
    
    const isPasswordValid =
      this.passwordValidation.password &&
      this.passwordValidation.passwordConfirmation &&
      passwordsMatch;    
    if (this.resetPasswordForm.value.password && !this.passwordValidation.password) {
      this.showValidBox = true;
    }

    if (!this.resetPasswordForm.value.eSign && !this.isArcharina && !this.env.isItWhiteLabel) {
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

    if (!this.resetPasswordForm.value.ccpa && !this.isArcharina) {
      this.alertService.warningAlert({
        isOk: true,
        doneMsg: 'OK',
        title: 'Accept California Consumer Privacy Act',
        content:
          'To continue, please confirm your acceptance of the California Consumer Privacy Act.'
      });
      return;
    }

    if (this.resetPasswordForm.invalid || !isPasswordValid) {
      return;
    }

    this.formSubmitting = true;

    const payload: ISetPasswordExternalPayload = {
      email: this.resetPasswordForm.value.email ?? '',
      password: this.resetPasswordForm.value.password ?? '',
      passwordConfirmation: this.resetPasswordForm.value.confirmPassword ?? '', 
      externalLogin: this.resetPasswordForm.value.externalLink ?? '', 
      termsAndCondition: this.resetPasswordForm.value.termsAndCondition ?? false
    };

    this.authService.resetPasswordExternalLogin(payload)
    .pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => { this.formSubmitting = false; }))
      .subscribe((res) => {
        if(res.success) { 
        const result: IResetPasswordResult = {
          action: 'reset',
          data: {
            password: this.resetPasswordForm.value.password || '',
            confirmPassword: this.resetPasswordForm.value.confirmPassword || ''
          }
        };
        this.dialogRef.close(result);
      } else {
        this.onCancel();
      }
      });
  }

  /**
   * Handle cancel action
   */
  onCancel(): void {
    const result: IResetPasswordResult = {
      action: 'cancel'
    };
    if(this.config.secondaryButtonText.toLowerCase() === 'logout') {
      result.action = 'logout';
    }
    this.dialogRef.close(result);
  }

  openTermsDialog(checked: boolean) {
    if (checked) {
      this.dialog.open(ESignatureAgreementComponent, {
        width: '600px',
        disableClose: true
      })
      .beforeClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.resetPasswordForm.controls.eSign.setValue(true);
        } else {
          this.resetPasswordForm.controls.eSign.setValue(false);
        }
      });
    } else {
      this.resetPasswordForm.controls.eSign.setValue(false);
    }
  }

  }