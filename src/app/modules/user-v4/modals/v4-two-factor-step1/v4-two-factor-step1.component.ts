import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal
} from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatDialogClose,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { of, Observable, Subscription, EMPTY } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { Utils } from 'src/app/data/utils';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { AuthService } from 'src/app/shared/service/auth/auth.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IAppConfig } from 'src/app/models/app_settings';
import { NgClass } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import {
  LucideAngularModule,
  X,
  MailCheck,
  Eye,
  EyeOff,
  Clock,
  Lock
} from 'lucide-angular';
import { V4TwoFactorTurnonComponent } from '../v4-two-factor-turnon/v4-two-factor-turnon.component';

@Component({
  selector: 'app-v4-two-factor-step1',
  standalone: true,
  imports: [
    NgClass,
    LucideAngularModule,
    CommonButtonV4Component,
    MatDialogClose,
    ReactiveFormsModule,
    CommonInputFieldV4Component
  ],
  templateUrl: './v4-two-factor-step1.component.html',
  styleUrls: ['./v4-two-factor-step1.component.scss']
})
export class V4TwoFactorStep1Component implements OnInit, OnDestroy {
  public data: {
    type: number;
    timer: number;
    mode: 'twofactor' | 'advancedtwofactor';
    isToTurnOff?: boolean;
  } = inject(MAT_DIALOG_DATA);

  public authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private matDialogRef = inject(MatDialogRef<V4TwoFactorStep1Component>);
  private alertService = inject(V4AlertService);
  private appSettingService = inject(AppSettingsService);
  private localStorageService = inject(LocalStorageService);
  public sharedService = inject(SharedService);
  private userProfileService = inject(UserProfileService);
  private elementRef = inject(ElementRef<HTMLElement>);

  readonly XIcon = X;
  readonly MailCheckIcon = MailCheck;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly ClockIcon = Clock;
  readonly LockIcon = Lock;

  subscriptions: Subscription[] = [];
  btnDisable = false;
  btnDisable1 = false;
  showTimer = true;
  display: string;
  number: string[] = [];
  passwordControl = new FormControl('');
  str: string;
  submitBtnDisable = false;
  backValue = false;
  isClickPos = false;
  nextVal = false;
  resendOtpLoading = false;
  passwordHide = signal<boolean>(true);
  isToTurnOff = signal<boolean>(false);
  /** True once two-factor/verify-otp has accepted the code. Web activation only. */
  isOtpVerified = signal<boolean>(false);
  /** True while the verify-otp call is in flight. */
  isVerifyingOtp = signal<boolean>(false);
  /**
   * The error shown inside this modal. Everything that used to open a second
   * alert dialog on top of this one writes here instead, so the user reads the
   * problem next to the field that caused it and the OTP stays on screen.
   */
  formError = signal<string>('');
  /** The OTP last sent automatically, so a stray keyup cannot resend it. */
  private lastAutoSubmittedOtp = '';
  appConfig: IAppConfig;
  utils = Utils;

  ngOnInit(): void {
    if (this.data.timer) {
      this.intervell(this.data.timer);
    }
    if (this.data.isToTurnOff) {
      this.isToTurnOff.set(this.data.isToTurnOff);
    }
    this.subscriptions.push(
      this.appSettingService.appConfig$.subscribe((res) => {
        this.appConfig = res as IAppConfig;
      })
    );
  }

  countDown(val: number) {
    const arr: number[] = [];
    let n = val;
    while (n > 59) {
      arr.push(n % 60);
      n /= 60;
    }
    arr.push(n);
    return arr;
  }

  intervell(seconds: number) {
    this.btnDisable = true;
    let remaining = seconds;
    let value: number[];
    const timer = setInterval(() => {
      value = this.countDown(remaining);
      remaining -= 1;
      this.display = `${Math.floor(value[2]) < 10 ? '0' : ''}${Number.isNaN(Math.floor(value[2])) ? '00' : Math.floor(value[2])}:${Math.floor(value[1]) < 10 ? '0' : ''}${Number.isNaN(Math.floor(value[1])) ? '00' : Math.floor(value[1])}:${Math.floor(value[0]) < 10 ? '0' : ''}${Math.floor(value[0])}`;
      if (remaining === 0) {
        clearInterval(timer);
        this.showTimer = false;
        this.btnDisable = false;
        if (this.data?.type === 1) {
          this.matDialogRef.close();
        }
      }
    }, 1000);
  }

  resendOtpClick() {
    // A new code cancels any verification already made against the old one, so
    // the modal goes back to the OTP step.
    this.resetOtpStep();
    if (this.data.mode === 'advancedtwofactor') {
      this.resendOtpLoading = true;
      this.subscriptions.push(
        this.authService
          .advancedTwoFactorResendOtp()
          .pipe(
            finalize(() => {
              this.resendOtpLoading = false;
            }),
            catchError((err) => {
              if (!err.error.success && err.error.errorCode) {
                this.btnDisable = true;
                this.btnDisable1 = false;
                this.showTimer = true;
                this.intervell(err.error.errorMsg);
              }
              return EMPTY;
            })
          )
          .subscribe((res) => {
            if (res?.success && res.data) {
              this.btnDisable1 = true;
              this.intervell(res.data);
              this.showTimer = true;
            }
          })
      );
    } else {
      this.resendOtpLoading = true;
      this.subscriptions.push(
        this.authService
          .resendOtp()
          .pipe(
            finalize(() => {
              this.resendOtpLoading = false;
            }),
            catchError((err) => {
              if (!err.error.success && err.error.errorCode) {
                this.btnDisable = true;
                this.btnDisable1 = false;
                this.showTimer = true;
                this.intervell(err.error.errorMsg);
              }
              return of(false);
            })
          )
          .subscribe((res) => {
            if (res.success && res.data) {
              this.btnDisable1 = true;
              this.intervell(res.data);
              this.showTimer = true;
            }
          })
      );
    }
  }

  tabChange(
    eve: KeyboardEvent,
    el1: HTMLInputElement,
    el2: HTMLInputElement,
    num: number
  ) {
    this.str = '';
    const otp = String((eve.target as HTMLInputElement).value);

    if (otp.length > 0 && eve.keyCode !== 8) {
      if (this.backValue) {
        this.number.splice(num, 1);
      }
      el1.focus();
      el1.select();
      this.nextVal = !!el1.value;

      if (this.number.length <= 6) {
        if (this.isClickPos && this.number.length > 1) {
          this.number[num] = (eve.target as HTMLInputElement).value;
          this.isClickPos = false;
        } else if (this.nextVal) {
          this.number[num] = (eve.target as HTMLInputElement).value;
          this.nextVal = false;
        } else {
          this.number.push((eve.target as HTMLInputElement).value);
        }
      }
      this.backValue = false;
    }

    if (!this.isClickPos && (eve.keyCode === 8 || eve.keyCode === 229)) {
      this.backValue = true;
      if (el2.value !== '') {
        el2.focus();
        el2.select();
        this.number.splice(num, 1);
      }
    }

    this.number.forEach((el) => {
      this.str += el;
    });

    this.formError.set('');
    this.maybeAutoSubmitOtp();
  }

  clickVal(sel: HTMLInputElement) {
    sel.select();
    this.isClickPos = true;
  }

  /**
   * @description Whether this modal is turning two-factor on — regular or
   * advanced. Both verify the OTP on its own before the password is asked for,
   * each against its own verify route. Disabling still posts the OTP and the
   * password together, because there the code is the whole form.
   * @returns True for the two-step web activation flow.
   */
  isTwoStepActivation(): boolean {
    return !this.isToTurnOff();
  }

  /** @returns Whether this modal is driving the advanced flow. */
  private isAdvanced(): boolean {
    return this.data?.mode === 'advancedtwofactor';
  }

  /**
   * @description Reads the six OTP boxes belonging to this modal.
   * @returns The digits entered so far, concatenated.
   */
  private readOtp(): string {
    let otp = '';
    (
      this.elementRef.nativeElement as HTMLElement
    ).querySelectorAll<HTMLInputElement>('input.otp').forEach((el) => {
      otp += el.value;
    });
    return otp;
  }

  /**
   * @description Acts as soon as all six digits are present, so the user never
   * presses a button to submit an OTP: activation verifies the code, disabling
   * sends it straight off since the code is the whole form there.
   *
   * `tabChange` runs on every keyup, arrow and tab keys included, so the same
   * six digits are only ever sent once — otherwise a stray keypress over a
   * rejected code would resend it on each stroke.
   */
  private maybeAutoSubmitOtp(): void {
    if (this.isVerifyingOtp() || this.submitBtnDisable) return;
    const otp = this.readOtp();
    if (otp.length !== 6 || otp === this.lastAutoSubmittedOtp) return;

    if (this.isTwoStepActivation()) {
      if (this.isOtpVerified()) return;
      this.lastAutoSubmittedOtp = otp;
      this.verifyOtp(otp);
      return;
    }

    if (this.isToTurnOff()) {
      this.lastAutoSubmittedOtp = otp;
      this.submit();
    }
  }

  /**
   * @description Step 1: validates the OTP. On success the password field is
   * revealed; on failure it stays hidden and the digits stay in the boxes for
   * the user to correct.
   * @param otp - The six digits entered.
   */
  private verifyOtp(otp: string): void {
    this.isVerifyingOtp.set(true);
    // Verifications are per-flow: a code verified on one route cannot activate
    // the other, so each flow verifies where its OTP came from.
    const verify$ = this.isAdvanced()
      ? this.authService.advancedVerifyTwoFactorOtp({ otp })
      : this.authService.verifyTwoFactorOtp({ otp });

    this.subscriptions.push(
      verify$
        .pipe(
          finalize(() => {
            this.isVerifyingOtp.set(false);
          }),
          // The verify call opts out of the interceptor dialog, so the reason
          // is shown here instead. returnToOtpStep() leaves the digits alone,
          // so only the verification and the password are undone.
          catchError((err) => {
            this.returnToOtpStep();
            this.formError.set(
              err?.error?.errorMsg ||
                err?.error?.message ||
                'Invalid OTP. Please check and try again.'
            );
            return of(null);
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.isOtpVerified.set(true);
            return;
          }
          this.returnToOtpStep();
          this.formError.set(
            res?.message || 'Invalid OTP. Please check and try again.'
          );
        })
    );
  }

  /**
   * @description Undoes the verification without touching the boxes, so a
   * rejected code stays on screen for the user to correct the digit they got
   * wrong. `lastAutoSubmittedOtp` is left set on purpose: the digits are still
   * there, and clearing it would let the next keyup resend the same code.
   */
  private returnToOtpStep(): void {
    this.isOtpVerified.set(false);
    this.passwordControl.setValue('');
  }

  /**
   * @description Returns the modal to a blank OTP step: clears the boxes and
   * the password, hides the password field and focuses the first box. For a
   * code that is gone rather than wrong — a resend, or a verification the
   * server no longer holds.
   */
  private resetOtpStep(): void {
    this.isOtpVerified.set(false);
    this.formError.set('');
    this.lastAutoSubmittedOtp = '';
    this.number = [];
    this.str = '';
    this.passwordControl.setValue('');
    const boxes = Array.from(
      (
        this.elementRef.nativeElement as HTMLElement
      ).querySelectorAll<HTMLInputElement>('input.otp')
    );
    for (let i = 0; i < boxes.length; i += 1) {
      boxes[i].value = '';
    }
    boxes[0]?.focus();
  }

  closeDialog() {
    this.matDialogRef.close(false);
  }

  /**
   * @description Step 2 of web two-factor activation. The OTP was already
   * accepted by verify-otp, so only the password is sent.
   */
  private submitActivationPassword(): void {
    const password = this.passwordControl.value || '';
    if (!password) {
      this.formError.set('Please enter password');
      return;
    }
    const advanced = this.isAdvanced();
    this.submitBtnDisable = true;
    // Both web activate routes take the password alone: the OTP was already
    // accepted by the matching verify call, and the backend pairs the two by
    // the `api-request-from: web` header.
    const activate$: Observable<{ success?: boolean } | null> = advanced
      ? this.authService.advancedTwoFactroActivateSend({ password })
      : this.authService.activateSend({ password });

    this.subscriptions.push(
      activate$
        .pipe(
          finalize(() => {
            this.submitBtnDisable = false;
          }),
          catchError((err) => {
            // 1001 means the verification is missing or has expired (10 min), or
            // a newer OTP was sent — the user has to verify again. The
            // interceptor skips codes it does not own, so this one is shown here.
            // Any other error keeps the verification, so the user can just retry
            // the password.
            if (Number(err?.error?.errorCode) === 1001) {
              this.formError.set(
                err?.error?.errorMsg ||
                  'Please verify the OTP before activating two-factor authentication'
              );
              this.resetOtpStep();
            }
            return of(null);
          })
        )
        .subscribe((res) => {
          if (!res?.success) {
            return;
          }

          if (advanced) {
            this.localStorageService.setItem('isAdvancedTwoFactorEnabled', 1);
            this.matDialogRef.close(true);
            return;
          }

          this.localStorageService.setItem('isTwoFactorEnabled', 1);
          this.matDialogRef.close(true);
          this.dialog.open(V4TwoFactorTurnonComponent, {
            maxWidth: '460px',
            width: '93%',
            disableClose: true,
            panelClass: 'paddingless-modal-rounded'
          });
        })
    );
  }

  submit() {
    // Turning regular two-factor on verifies the OTP first, so by this point only
    // the password is left to send. Every other flow still posts both together.
    if (this.isTwoStepActivation()) {
      this.submitActivationPassword();
      return;
    }

    let otpStr = '';
    const inputArr = document.querySelectorAll<HTMLInputElement>('input.otp');
    inputArr.forEach((e: HTMLInputElement) => {
      otpStr += e.value;
    });

    const data: { otp: string; password?: string } = { otp: otpStr };
    if (!this.isToTurnOff()) {
      data.password = this.passwordControl.value || '';
    }
    if (data.otp.length === 0) {
      this.formError.set('Please enter OTP');
      return;
    }
    if (data.otp.toString().length < 6) {
      this.formError.set('Invalid OTP');
      return;
    }
    if (
      !this.isToTurnOff() &&
      (data.password === undefined ||
        data.password === '' ||
        data.password === null)
    ) {
      this.formError.set('Please enter password');
      return;
    }

    if (this.data.mode === 'advancedtwofactor') {
      this.submitBtnDisable = true;
      const apiCall = this.isToTurnOff()
        ? this.userProfileService.advancedAuthentificationOff({ otp: otpStr })
        : this.authService.advancedTwoFactroActivateSend({
            password: this.passwordControl.value || ''
          });
      this.subscriptions.push(
        apiCall
          .pipe(
            catchError(() => {
              this.submitBtnDisable = false;
              return EMPTY;
            })
          )
          .subscribe((res) => {
            this.submitBtnDisable = false;
            if (res.success) {
              if (this.isToTurnOff()) {
                this.alertService.successAlert({
                  title: 'Success',
                  content: 'Advanced two factor authentication disabled',
                  close: true,
                  timeout: 2000
                });
                this.localStorageService.setItem(
                  'isAdvancedTwoFactorEnabled',
                  String(0)
                );
              } else {
                this.localStorageService.setItem(
                  'isAdvancedTwoFactorEnabled',
                  1
                );
              }
              this.matDialogRef.close(true);
            }
          })
      );
    } else if (this.data.mode === 'twofactor') {
      this.submitBtnDisable = true;
      const apiCall = this.isToTurnOff()
        ? this.userProfileService.authentificationOff({ otp: otpStr })
        : this.authService.activateSend({
            otp: otpStr,
            password: this.passwordControl.value || ''
          });
      this.subscriptions.push(
        apiCall
          .pipe(
            catchError(() => {
              this.submitBtnDisable = false;
              return of(false);
            })
          )
          .subscribe((res) => {
            this.submitBtnDisable = false;
            if (res.success) {
              if (this.isToTurnOff()) {
                this.alertService.successAlert({
                  title: 'Success',
                  content: 'Two factor authentication disabled',
                  close: true,
                  timeout: 2000
                });
                this.localStorageService.setItem('isTwoFactorEnabled', 0);
                this.matDialogRef.close(true);
              } else {
                this.localStorageService.setItem('isTwoFactorEnabled', 1);
                this.matDialogRef.close(true);
                this.dialog.open(V4TwoFactorTurnonComponent, {
                  maxWidth: '460px',
                  width: '93%',
                  disableClose: true,
                  panelClass: 'paddingless-modal-rounded'
                });
              }
            }
          })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
