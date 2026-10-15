import { Component, inject, OnDestroy } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { of, Subscription, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { faEnvelopeCircleCheck } from '@fortawesome/pro-regular-svg-icons';

/**
 * @description Modal component for two factor authentication
 */
@Component({
  selector: 'app-two-factor-otp-verify',
  templateUrl: './two-factor-otp-verify.component.html',
  styleUrls: ['./two-factor-otp-verify.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    CommonButtonV35Component,
    MatDialogClose
  ]
})
export class TwoFactorOtpVerifyComponent implements OnDestroy {
  public twoFactotpVerify = inject(UserProfileService);
  private dialogRef = inject(MatDialogRef<TwoFactorOtpVerifyComponent>);
  private alertService = inject(AlertService);
  private localStorageService = inject(LocalStorageService);
  public sharedService = inject(SharedService);
  public data: { mode: 'twofactor' | 'advancedtwofactor' } =
    inject(MAT_DIALOG_DATA);

  subscription: Subscription[] = [];
  submitBtnDisable = false;
  faXmark = faXmark;
  number: string[] = [];
  str: string;
  backValue = false;
  isClickPos = false;
  nextVal = false;

  faEnvelopeCircleCheck = faEnvelopeCircleCheck;

  otpForm = new FormGroup({
    otpNumber: new FormControl('', [
      Validators.required,
      Validators.maxLength(6),
      Validators.pattern('^[0-9]*$')
    ])
  });

  utils = Utils;

  /**
   * @description Tabs change between the input fields in the OTP form
   * @param eve - Event on current field
   * @param el1 - Next otp input fields template reference variable
   * @param el2 - previous otp input fields template reference variable
   * @param num - Index of otp
   */
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

      if (el1.value) {
        this.nextVal = true;
      } else {
        this.nextVal = false;
      }

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
  }

  /**
   * @description
   * @param sel Current input fields template reference variable
   */
  clickVal(sel: HTMLInputElement) {
    sel.select();
    this.isClickPos = true;
  }

  /**
   * @description Otp submission for two factor authentication
   * @returns
   */
  submit() {
    let otpStr = '';
    const inputArr =
      document.querySelectorAll<HTMLInputElement>('input.otp');
    inputArr.forEach((e: HTMLInputElement) => {
      otpStr += e.value;
    });

    if (otpStr.length === 0) {
      const msg = 'Please enter OTP';
      this.alertService.infoAlert({ content: msg });
      return;
    }

    if (otpStr.toString().length < 6) {
      const msg = 'Invalid OTP';
      this.alertService.infoAlert({ content: msg });
      return;
    }

    const datas = {
      otp: otpStr
    };

    if (this.data.mode === 'advancedtwofactor') {
      this.submitBtnDisable = true;
      this.subscription.push(
        this.twoFactotpVerify
          .advancedAuthentificationOff(datas)
          .pipe(
            catchError((err) => {
              if (err) {
                this.submitBtnDisable = false;
              }
              return EMPTY;
            })
          )
          .subscribe((res) => {
            this.submitBtnDisable = false;
            if (res.success) {
              const data = {
                title: 'Success',
                content: 'Advanced two factor authentication disabled',
                close: true,
                timeout: 2000
              };
              this.alertService.successAlert(data);
              const advancedTwoFactorEnabled = 0;
              this.localStorageService.setItem(
                'isAdvancedTwoFactorEnabled',
                String(advancedTwoFactorEnabled)
              );
              this.dialogRef.close({ success: true });
            }
          })
      );
    } else if (this.data.mode === 'twofactor') {
      this.submitBtnDisable = true;
      this.subscription.push(
        this.twoFactotpVerify
          .authentificationOff(datas)
          .pipe(
            catchError((err) => {
              if (err) {
                this.submitBtnDisable = false;
              }
              return of(false);
            })
          )
          .subscribe((res) => {
            this.submitBtnDisable = false;
            if (res.success) {
              const data = {
                title: 'Success',
                content: 'Two factor authentication disabled',
                close: true,
                timeout: 2000
              };
              this.alertService.successAlert(data);
              const twoFactorEnabled = 0;
              this.localStorageService.setItem(
                'isTwoFactorEnabled',
                twoFactorEnabled
              );
              this.dialogRef.close({ success: true });
            }
          })
      );
    }
  }

  /**
   * @description Unsubscribe all subscriptions when the component destroys
   */
  ngOnDestroy(): void {
    this.subscription.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
