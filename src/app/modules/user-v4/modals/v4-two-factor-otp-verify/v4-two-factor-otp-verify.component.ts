import { Component, inject, OnDestroy } from '@angular/core';
import {
  MatDialogRef,
  MatDialogClose,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { of, Subscription, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { LucideAngularModule, X, MailCheck } from 'lucide-angular';

@Component({
  selector: 'app-v4-two-factor-otp-verify',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component, MatDialogClose],
  templateUrl: './v4-two-factor-otp-verify.component.html',
  styleUrls: ['./v4-two-factor-otp-verify.component.scss']
})
export class V4TwoFactorOtpVerifyComponent implements OnDestroy {
  public twoFactotpVerify = inject(UserProfileService);
  private dialogRef = inject(MatDialogRef<V4TwoFactorOtpVerifyComponent>);
  private alertService = inject(V4AlertService);
  private localStorageService = inject(LocalStorageService);
  public sharedService = inject(SharedService);
  public data: { mode: 'twofactor' | 'advancedtwofactor' } =
    inject(MAT_DIALOG_DATA);

  readonly XIcon = X;
  readonly MailCheckIcon = MailCheck;

  subscription: Subscription[] = [];
  submitBtnDisable = false;
  number: string[] = [];
  str: string;
  backValue = false;
  isClickPos = false;
  nextVal = false;
  utils = Utils;

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
  }

  clickVal(sel: HTMLInputElement) {
    sel.select();
    this.isClickPos = true;
  }

  closeDialog() {
    this.dialogRef.close(false);
  }

  submit() {
    let otpStr = '';
    const inputArr = document.querySelectorAll<HTMLInputElement>('input.otp');
    inputArr.forEach((e: HTMLInputElement) => {
      otpStr += e.value;
    });

    if (otpStr.length === 0) {
      this.alertService.infoAlert({ content: 'Please enter OTP' });
      return;
    }
    if (otpStr.toString().length < 6) {
      this.alertService.infoAlert({ content: 'Invalid OTP' });
      return;
    }

    const datas = { otp: otpStr };

    if (this.data.mode === 'advancedtwofactor') {
      this.submitBtnDisable = true;
      this.subscription.push(
        this.twoFactotpVerify
          .advancedAuthentificationOff(datas)
          .pipe(
            catchError(() => {
              this.submitBtnDisable = false;
              return EMPTY;
            })
          )
          .subscribe((res) => {
            this.submitBtnDisable = false;
            if (res.success) {
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
            catchError(() => {
              this.submitBtnDisable = false;
              return of(false);
            })
          )
          .subscribe((res) => {
            this.submitBtnDisable = false;
            if (res.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Two factor authentication disabled',
                close: true,
                timeout: 2000
              });
              this.localStorageService.setItem('isTwoFactorEnabled', 0);
              this.dialogRef.close({ success: true });
            }
          })
      );
    }
  }

  ngOnDestroy(): void {
    this.subscription.forEach((s) => s.unsubscribe());
  }
}
