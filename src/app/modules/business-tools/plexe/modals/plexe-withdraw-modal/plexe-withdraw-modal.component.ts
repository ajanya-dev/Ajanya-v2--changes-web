import { finalize } from 'rxjs/operators';
import { PlexeService } from '../../../../../shared/service/plexe/plexe.service';
import { Subscription } from 'rxjs';
import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ICalculationData,
  IInitialWithdrawelData,
  ILoanData
} from 'src/app/modules/business-tools/plexe/model/plexe';
import { Utils } from 'src/app/data/utils';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Router } from '@angular/router';
import {
  MatSliderChange,
  MatSlider,
  MatSliderThumb
} from '@angular/material/slider';
import { WarningAlertComponent } from 'src/app/shared/alert/components/warning-alert/warning-alert.component';
import { TruncatePipe } from '../../../../../pipes/truncate.pipe';
import { NgxMaskDirective } from 'ngx-mask';
import { MatTooltip } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { NgStyle, NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-plexe-withdraw-modal',
  templateUrl: './plexe-withdraw-modal.component.html',
  styleUrls: ['./plexe-withdraw-modal.component.scss'],
  standalone: true,
  imports: [
    NgStyle,
    NgIf,
    FormsModule,
    MatSlider,
    MatSliderThumb,
    MatTooltip,
    NgClass,
    NgxMaskDirective,
    TruncatePipe
  ]
})
export class PlexeWithdrawModalComponent implements OnInit, OnDestroy {
  @ViewChild('withdrawAmount') withdrawAmountRef: ElementRef;
  step: 'AMOUNT_SELECTION' | 'VERIFICATION' | 'FINISH' = 'AMOUNT_SELECTION';
  isShowWithdrawAmountInput = false;
  withdrawAmountInput = 1;
  minWithdrawAmountLimit = 1;
  maxWithdrawAmountLimit: number;
  withdrawAmount = 1;
  minWeekLimit = 7;
  maxWeekLimit = 52;
  repaymentWeeks = 20;
  calculatedData: ICalculationData;
  isDisableSlider = false;
  initiateWithdrawalResponse: IInitialWithdrawelData;
  resendTimer = 300;
  timerInterval: ReturnType<typeof setInterval>;
  subscription: Subscription[] = [];
  otpSubmited = false;
  isOtpValid = false;
  showOTPIncorrect = false;
  isLoading = false;
  mode: boolean;
  showTime: string;

  constructor(
    private matDialogueRef: MatDialogRef<PlexeWithdrawModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public plexeData: {
      id: string;
      loanEnable: number;
      edit: boolean;
      status?: number;
      limit: number;
    },
    private _plexeService: PlexeService,
    private alertService: AlertService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this.calculate();
    this.mode = this.plexeData?.edit;
    this.maxWithdrawAmountLimit = this.plexeData?.limit;
  }

  /**
   * @description show withdraw amount input.
   *
   */
  showWithdrawAmountInput(): void {
    this.isShowWithdrawAmountInput = true;
    this.withdrawAmountRef.nativeElement.focus();
  }

  /**
   * @description adding loan amount.
   *
   */
  withdrawAmountChange(eventObj: MatSliderChange): void {
    if (eventObj.value) {
      this.withdrawAmount = eventObj.value;
      this.withdrawAmountInput = eventObj.value;
    }
  }

  /**
   * @description set the withdraw amount.
   *
   */
  withdrawAmountFromInput(): void {
    if (this.withdrawAmountInput) {
      let amount = this.withdrawAmountInput;
      if (
        amount >= this.minWithdrawAmountLimit &&
        amount <= this.maxWithdrawAmountLimit
      ) {
        this.setWithdrawAmount(amount);
      } else if (amount < this.minWithdrawAmountLimit) {
        amount = this.minWithdrawAmountLimit;
        this.setWithdrawAmount(amount);
      } else if (amount > this.maxWithdrawAmountLimit) {
        amount = this.maxWithdrawAmountLimit;
        this.setWithdrawAmount(amount);
      }
    }
  }

  /**
   * @description calculating the withdraw amount.
   *
   */
  setWithdrawAmount(amount: number): void {
    setTimeout(() => {
      this.withdrawAmount = amount;
      this.withdrawAmountInput = this.withdrawAmount;
      this.calculate();
    }, 0);
  }

  /**
   * @description Get plexe calculation with calculation data.
   *
   */
  calculate(): void {
    const calculationData = {
      amount: this.withdrawAmount,
      percentOfIncome: 1,
      terms: this.repaymentWeeks,
      fixedRepaymentCalculation: true
    };
    this.isDisableSlider = true;
    this.subscription.push(
      this._plexeService
        .getPlexiCalculation(this.plexeData.id, calculationData)
        .pipe(
          finalize(() => {
            this.isDisableSlider = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.calculatedData = res.data;
          }
        })
    );
  }

  /**
   * @description Get initial withdrawal and sending otp.
   *
   */
  getInitiateWithdrawalAndSendOTP(): void {
    if (!this.plexeData?.loanEnable) {
      this.openWarningAlert(
        'You line of credit application is under review. Please wait until it is approved'
      );
      return;
    }

    const withDrawData = {
      amount: this.withdrawAmount,
      percentOfIncome: 1,
      terms: this.repaymentWeeks,
      fixedRepaymentCalculation: true
    };
    this.isLoading = true;
    this.subscription.push(
      this._plexeService
        .getInitiateWithdrawalAndSendOTP(this.plexeData?.id, withDrawData)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.initiateWithdrawalResponse = res.data;
            this.step = 'VERIFICATION';
            this.setResendTimer();
          }
        })
    );
  }

  /**
   * @description Set resend timer.
   *
   */
  setResendTimer(): void {
    this.resendTimer = 300;
    this.timerInterval = setInterval(() => {
      const minutes = Math.floor(this.resendTimer / 60);
      const seconds = this.resendTimer % 60;
      this.resendTimer -= 1;
      if (this.resendTimer <= 0) {
        clearInterval(this.timerInterval);
      }
      this.showTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }, 1000);
  }

  /**
   * @description Resend withdrawal otp.
   *
   */
  resendWithdrawalOtp(): void {
    this.setResendTimer();
    this.subscription.push(
      this._plexeService.resendWithdrawalOtp(this.plexeData?.id).subscribe()
    );
  }

  /**
   * @description Verifying otp.
   *
   */
  verify(): void {
    const loanData: ILoanData = {
      advanceRate: this.calculatedData?.advanceRate
        ? this.calculatedData?.advanceRate
        : 0,
      amount: this.withdrawAmount,
      percentOfIncome: 1,
      otp: this.otpString,
      terms: this.calculatedData.terms,
      fixedRepaymentCalculation: true
    };

    this.isLoading = true;
    this.subscription.push(
      this._plexeService
        .getCompleteWithdrawalAndVerifyOTP(this.plexeData?.id, loanData)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            if (res.data.message == 'OTP incorrect') {
              this.showOTPIncorrect = true;
              this.alertService.failedAlert({
                close: false,
                content: 'OTP Incorrect'
              });
            } else {
              this.step = 'FINISH';
            }
          }
        })
    );
  }

  onKeyPress(event: KeyboardEvent): boolean {
    return Utils.numberOnly(event, 'numeric');
  }

  /**
   * @description checking submitted otp and change box.
   *
   */
  changeBox(
    event: { target: { value: string | number }; keyCode: number },
    prevBox: HTMLInputElement,
    nextBox: HTMLInputElement
  ): void {
    this.otpSubmited = false;
    const boxValue = event.target.value;

    if (this.otpString?.length === 4) {
      this.isOtpValid = true;
    } else {
      this.isOtpValid = false;
    }

    if (event.keyCode === 8 || event.keyCode === 229) {
      //Back Space
      prevBox?.focus();
      prevBox?.select();
      return;
    }

    if (event.keyCode === 37) {
      //Left arrow
      prevBox?.focus();
      prevBox?.select();
      return;
    }

    if (boxValue) {
      nextBox?.focus();
      nextBox?.select();
    }
  }

  get otpString(): string {
    const inputBox: NodeListOf<HTMLInputElement> =
      document.querySelectorAll('input.box');
    let otp = '';
    inputBox.forEach(
      (opeElement: HTMLInputElement) => (otp += opeElement.value)
    );
    return otp;
  }

  /**
   * @description Close modal.
   *
   */
  done(): void {
    this.matDialogueRef.close(true);
  }

  /**
   * @description go to next page.
   *
   */
  goto(): void {
    this._router.navigate(['/manage/working-capital/application-Setup'], {
      queryParams: { id: this.plexeData?.id }
    });
    this.done();
  }

  /**
   * @description Warning alert.
   *
   */
  openWarningAlert(
    content: string,
    doneMsg?: string
  ): MatDialogRef<WarningAlertComponent, boolean> {
    const data = {
      title: 'Error',
      content: content,
      doneMsg: doneMsg ? doneMsg : 'OK'
    };
    return this.alertService.warningAlert(data);
  }

  /**
   * @description Close modal.
   *
   */
  close(): void {
    this.matDialogueRef.close(false);
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
