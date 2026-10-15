import { Component, OnDestroy, OnInit, Renderer2, inject, signal } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { finalize, Subscription, timer } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { CloudBankService } from 'src/app/shared/service/cloud-bank/cloud-bank.service';
import { FormsModule } from '@angular/forms';
import { NgStyle, NgIf, NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CybersourceService } from 'src/app/shared/service/cybersource/cybersource.service';
import { CommonButtonV35Component } from "../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component";

/**
 * @description Component for handling OTP (One-Time Password) validation in a modal dialog.
 */
@Component({
  selector: 'app-otp-modal',
  templateUrl: './otp-modal.component.html',
  styleUrls: ['./otp-modal.component.scss'],
  standalone: true,
  imports: [NgStyle, MatDialogClose, FormsModule, NgIf, FaIconComponent, CommonButtonV35Component,NgClass]
})
export class OtpModalComponent implements OnInit, OnDestroy {
  public data: Record<string, unknown> = inject(MAT_DIALOG_DATA);
  private cloudAccService = inject(CloudBankService);
  public dialogRef = inject(MatDialogRef<OtpModalComponent>);
  private cybersourceService = inject(CybersourceService);
  public renderer = inject(Renderer2);

  number: string[] = [];
  subscriptions: Subscription[] = [];
  btnDisable = false;
  str = '';
  backValue = false;
  isClickPos = false;
  nextVal = false;
  otpBtnText = 'Submit OTP';
  otpSendTime = '';
  countdownTimer: number = 120;
  otpValidationError = '';
  formattedTime: string = '02:00';
  isResendDisabled = signal(true);
  sendResendOtp = signal(false);
  private countdownSubscription?: Subscription;

  utils = Utils;

  ngOnInit() {
    if (this.data.type === 'card-transaction') {
      this.startCountdown();
    }
  }

  startCountdown() {
    this.isResendDisabled.set(true);
    this.countdownTimer = 120;
    this.updateFormattedTime();
    this.countdownSubscription = timer(0, 1000).subscribe(() => {
      if (this.countdownTimer > 0) {
        this.countdownTimer -= 1;
        this.updateFormattedTime();
      } else {
        this.isResendDisabled.set(false);
        this.countdownSubscription?.unsubscribe();
      }
    });
  }

  private updateFormattedTime() {
    const minutes = Math.floor(this.countdownTimer / 60);
    const seconds = this.countdownTimer % 60;
    this.formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  resendOtp() {
    if (!this.isResendDisabled()) {
      // Clearing on the click, not on the response: the old code is dead the
      // moment a new one is asked for, and leaving it in the boxes lets a
      // stale digit string be submitted against the fresh OTP.
      this.clearOtpInputs();
      const body = {
        category: this.data.category ?? '',
        otp_type: this.data.mode,
        session_key: this.data.session_key,
        email_otp_session_key:'',
        phone_otp_session_key:'',
        resend_otp:1
      };
      this.sendResendOtp.set(true);
      this.subscriptions.push(
        this.cybersourceService.capturePayment(body)
        .pipe(
          finalize(() => {
            this.sendResendOtp.set(false);
          })
        )
        .subscribe({
          error: (err) => {            
            if (err.error.errorCode === '112') {
              this.data.session_key = err.error.session_key;
              this.startCountdown();
            }
          }
        })
      );
    }
  }

  /**
   * @description Handles the submission of the OTP.
   */
  submit() {
    let otpStr = '';
    const inputArr =
      document.querySelectorAll<HTMLInputElement>('input.otp_box');
    inputArr.forEach((e) => {
      if(e.value === ''){
        this.renderer.setStyle(e, 'border', '1px solid red');
      }else{
        this.renderer.setStyle(e, 'border', '1px solid #ced4da');
      }
      otpStr += e.value;
    });

    if (otpStr.length === 6) {
      this.otpValidationError = '';
      this.btnDisable = true;
      const processedData = {
        session_key: this.data.session_key,
        otp: otpStr
      };
      this.subscriptions.push(
        this.cloudAccService.confirmOtp(processedData)
        .pipe(
          finalize(() => {
            this.btnDisable = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            if(this.data.type === 'card-transaction'){
              this.dialogRef.close({success:true,session_key:this.data.session_key});
            }else{
              this.dialogRef.close(true);
            }
          } else if (!res.success) {
            // Shown in this modal rather than in a second alert dialog on top
            // of it, so the OTP boxes stay visible next to the reason.
            this.otpValidationError =
              res.errorMsg || 'Invalid OTP. Please check and try again.';
          }
        })
      );
    } else {
      this.otpValidationError = 'OTP is required';
    }
  }

  /**
   * @description Handles the change in the OTP input.
   * @param eve - Keyboard event.
   * @param el1 - Reference to the current input element.
   * @param el2 - Reference to the next input element.
   * @param num - Index of the OTP digit.
   */
  tabChange(
    eve: KeyboardEvent & { target: HTMLInputElement },
    el1: HTMLInputElement,
    el2: HTMLInputElement,
    num: number
  ) {
    this.str = '';
    this.otpValidationError = '';
    const otp = new String(eve.target.value);

    if (otp.length > 0 && eve.keyCode != 8) {
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
          this.number[num] = eve.target.value;
          this.isClickPos = false;
        } else {
          if (this.nextVal) {
            this.number[num] = eve.target.value;
            this.nextVal = false;
          } else {
            this.number.push(eve.target.value);
          }
        }
      }
      this.backValue = false;
    }

    if (!this.isClickPos && (eve.keyCode == 8 || eve.keyCode == 229)) {
      //eve.keyCode == 229 --> is only check for mobile phone
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

    this.autoSubmitWhenComplete();
  }

  /**
   * @description Handles the click event on an OTP input.
   * @param sel - Reference to the selected input element.
   */
  clickVal(sel: HTMLInputElement) {
    sel.select();
    this.isClickPos = true;
  }

  /**
   * @description Fills the boxes from a pasted code and submits once complete.
   * Handled here instead of SharedService.onPaste, which leaves the browser's
   * own paste running; codes copied from SMS or email often carry spaces,
   * dashes or a newline, so only the digits are kept.
   * @param event - The paste event from an OTP box.
   */
  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    this.otpValidationError = '';
    const digits = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '');
    if (!digits) return;

    const boxes = this.getOtpBoxes();
    const startIndex =
      digits.length >= boxes.length
        ? 0
        : Math.max(0, boxes.indexOf(event.target as HTMLInputElement));
    const written = digits.slice(0, boxes.length - startIndex).split('');
    written.forEach((digit, offset) => {
      const box = boxes[startIndex + offset];
      this.renderer.setProperty(box, 'value', digit);
      this.renderer.setStyle(box, 'border', '1px solid #ced4da');
    });
    boxes[startIndex + written.length - 1]?.focus();

    this.autoSubmitWhenComplete();
  }

  /** The code last sent by auto-submit, so a stray keyup cannot resend it. */
  private lastAutoSubmittedOtp = '';

  /**
   * @description Empties the OTP boxes and returns the caret to the first one.
   * Also drops lastAutoSubmittedOtp, so the same digits typed against a new
   * code still trigger the auto-submit.
   * @returns {void}
   */
  private clearOtpInputs(): void {
    const boxes = Array.from(
      document.querySelectorAll<HTMLInputElement>('input.otp_box')
    );
    for (let i = 0; i < boxes.length; i += 1) {
      boxes[i].value = '';
    }
    this.lastAutoSubmittedOtp = '';
    this.otpValidationError = '';
    boxes[0]?.focus();
  }

  /**
   * @description Submits as soon as every box holds a digit, the same as
   * pressing Submit OTP. The boxes are read on keyup, which also fires for
   * keys that change nothing, so a code is auto-submitted only once.
   */
  private autoSubmitWhenComplete(): void {
    if (this.btnDisable) return;
    const boxes = this.getOtpBoxes();
    if (!boxes.length || !boxes.every((box) => /^\d$/.test(box.value))) return;

    const otp = boxes.map((box) => box.value).join('');
    if (otp === this.lastAutoSubmittedOtp) return;
    this.lastAutoSubmittedOtp = otp;
    this.submit();
  }

  private getOtpBoxes(): HTMLInputElement[] {
    return Array.from(document.querySelectorAll<HTMLInputElement>('input.otp_box'));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscriptions) => {
      subscriptions.unsubscribe();
    });
    this.countdownSubscription?.unsubscribe();
  }
}
