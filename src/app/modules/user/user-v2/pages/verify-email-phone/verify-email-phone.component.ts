import {
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  Optional,
  inject
} from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import * as datas from 'src/app/data/data/country-list-json/country-list-code.json';
import { Location, NgClass, NgIf, NgFor } from '@angular/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { GettingStartedService } from 'src/app/shared/service/getting-started/getting-started.service';
import { CVSourceType } from 'src/app/modules/common-verification/model/common-verification';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { IAppState } from 'src/app/store/app-state.model';
import { Store } from '@ngrx/store';
import { UserManagementActions } from 'src/app/modules/store/userManagement/userManagement.actions';
import { selectUserVerification } from 'src/app/modules/store/userManagement/userManagement.selectors';
import { ICountryItem } from 'src/app/models/shared';
import { NgxMaskDirective } from 'ngx-mask';
import { SearchFilterPipe } from '../../../../../pipes/search-filter.pipe';
import { OutsideClickDirective } from '../../../../../directive/outside-click.directive';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

@Component({
  selector: 'app-verify-email-phone',
  templateUrl: './verify-email-phone.component.html',
  styleUrls: ['./verify-email-phone.component.scss'],
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    OutsideClickDirective,
    NgxMaskDirective,
    NgFor,
    SearchFilterPipe
  ]
})
export class VerifyEmailPhoneComponent implements OnInit, OnDestroy {
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  subscriptions: Subscription[] = [];

  verifyMobileMail = true;
  emailOTPSent = false;
  phoneOTPSent = false;
  userForm!: UntypedFormGroup;
  requestOtp!: UntypedFormGroup;
  message: string;
  display: string;
  btnDisable = false;
  btnDisable1 = false;
  btnDisable2 = false;
  emailVerified = false;
  phoneVerified = false;
  showTimer = false;
  resendLoader = false;
  countryList: ICountryItem[] = datas;
  selectedCountryFlag = 'https://flagcdn.com/w320/us.png';
  listShow = false;
  loading = true;
  country_code = '+1';
  showLoading = false;
  showList = false;
  public searchFilter = '';
  query = '';
  initialIndex = 0;
  directPlancode: string;
  returnUrl: string;
  phoneNumber: string;
  dialcode: string;

  sourceType: CVSourceType;
  bankAccountId: string;
  isModal: boolean;

  private alertService = inject(AlertService);
  private fb = inject(UntypedFormBuilder);
  private userService = inject(UserProfileService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private gettingStartedService = inject(GettingStartedService);
  private localStorageService = inject(LocalStorageService);
  private store = inject(Store<IAppState>);

  constructor(
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public dialogueData: Record<string, never>,
    @Optional() private matDialogueRef: MatDialogRef<VerifyEmailPhoneComponent>
  ) {}

  ngOnInit(): void {
    this.sourceType = this.route.snapshot.queryParams?.type;
    this.bankAccountId = this.route.snapshot.queryParams?.bankAccountId;

    this.initVerify();
    this.verifyOtp();
    this.setUserData();

    this.directPlancode = this.route.snapshot.queryParams?.plancode;
    this.returnUrl = this.route.snapshot.queryParams?.returnUrl;
  }

  /**
   * @description Function to hide list when click outside the phone input
   */
  handleChange() {
    if (this.listShow) {
      this.listShow = false;
    }
  }

  /**
   * @description Function is used to handle keyboard events and update the initial index value.
   * @param ev
   */
  filterFunction(ev: KeyboardEvent) {
    if (ev.keyCode === 40 || ev.keyCode === 39) {
      this.initialIndex += 1;
    } else if (ev.keyCode === 38 || ev.keyCode === 37) {
      if (this.initialIndex > 0) {
        this.initialIndex -= 1;
      }
    }
  }

  /**
   * @description Function is triggered when the Enter key is pressed. It is used to hide the list if it is shown
   */
  @HostListener('window:keydown.enter', ['$event'])
  handleKeyDown() {
    if (this.listShow) {
      this.listShow = false;
    }
  }

  /**
   * @description Getter @returns the form controls of the userForm.
   */
  get getControl() {
    return this.userForm.controls;
  }

  /**
   * @description Initializes the form groups for verifying email and phone OTP
   */
  initVerify() {
    if (this.dialogueData) {
      this.isModal = true;
    }
    this.userForm = this.fb.group({
      emailAddress: ['', [ValidationService.emailValidator]],
      phoneNumber: ['', [ValidationService.phoneNumberValidator]]
    });
  }

  /**
   * @description Initializes the form group for entering OTP codes
   */
  verifyOtp() {
    this.requestOtp = this.fb.group({
      enterMailOtp: [''],
      enterMobileOtp: ['']
    });
  }

  /**
   * @description Function sends a request to the server to send an OTP code to the user's email address
   */
  requestOtpEmail() {
    const data = this.userForm.value;
    this.subscriptions.push(
      this.userService
        .requestVerifyEmailOTP(data.emailAddress)
        .pipe(
          finalize(() => {
            this.resendLoader = false;
          }),
          catchError((err) => {
            if (err.error.success == false && err.error.errorCode) {
              this.btnDisable = true;
              this.btnDisable1 = true;
              this.showTimer = true;
              this.intervell(err.error.errorMsg);
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.timer?.diff) {
            this.btnDisable = true;
            this.showTimer = true;
            this.intervell(res.timer.diff);
          }
          this.btnDisable1 = false;
          if (res.success) {
            this.emailOTPSent = true;
            this.verifyMobileMail = false;
            this.message = res.message;
            this.alertService.successAlert({
              title: 'Success',
              content: 'OTP Sent Successfully',
              close: true
            });
          }
        })
    );
  }

  /**
   * @description Function sends a request to the server to send an OTP code to the user's phone number
   */
  requestOTPPhoneNumber() {
    const data = this.userForm.value;
    this.subscriptions.push(
      this.userService
        .requestVerifyPhoneOTP(this.country_code + data.phoneNumber)
        .pipe(
          finalize(() => {
            this.resendLoader = false;
          }),
          catchError((err) => {
            if (err.error.success == false && err.error.errorCode) {
              this.btnDisable = true;
              this.btnDisable1 = true;
              this.showTimer = true;
              this.intervell(err.error.errorMsg);
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.timer?.diff) {
            this.btnDisable = true;
            this.showTimer = true;
            this.intervell(res.timer.diff);
          }
          this.btnDisable1 = false;
          if (res.success) {
            this.phoneOTPSent = true;
            this.verifyMobileMail = false;
            this.message = res.message;
            this.alertService.successAlert({
              title: 'Success',
              content: 'OTP Sent Successfully',
              close: true
            });
          }
        })
    );
  }

  /**
   * @description Count down utility function
   * @param val
   * @returns
   */
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

  /**
   * @description Function sets up a timer to count down the seconds and update the display value
   * @param sec
   */
  intervell(sec: number) {
    let value: number[];
    const timer = setInterval(() => {
      value = this.countDown(sec);
      sec--;
      this.display = `${Math.floor(value[2]) < 10 ? '0' : ''}${isNaN(Math.floor(value[2])) ? '00' : Math.floor(value[2])}:${Math.floor(value[1]) < 10 ? '0' : ''}${isNaN(Math.floor(value[1])) ? '00' : Math.floor(value[1])}:${Math.floor(value[0]) < 10 ? '0' : ''}${Math.floor(value[0])}`;
      if (sec < 0) {
        clearInterval(timer);
        this.showTimer = false;
        this.btnDisable = false;
      }
    }, 1000);
  }

  /**
   * @description Function  is called when the user requests an OTP for email verification
   * @returns when invalid email address
   */
  onRequestEmailVerificationOTP() {
    this.userForm.controls.emailAddress.markAsTouched();
    if (this.userForm.controls.emailAddress.invalid) {
      return;
    }
    this.btnDisable1 = true;
    this.requestOtpEmail();
  }

  /**
   * @description Function  is called when the user requests an OTP for phone verification
   * @returns when invalid phone number
   */
  onRequestPhoneVerificationOTP() {
    this.userForm.controls.phoneNumber.markAsTouched();
    if (this.userForm.controls.phoneNumber.invalid) {
      return;
    }
    this.btnDisable1 = true;
    this.requestOTPPhoneNumber();
  }

  /**
   * @description Function for resending the otp into phone
   */
  resendOTPPhoneNumber() {
    this.resendLoader = true;
    this.requestOTPPhoneNumber();
  }

  /**
   * @description Function for resending the otp into email
   */
  resendOTPEmail() {
    this.resendLoader = true;
    this.requestOtpEmail();
  }

  /**
   * @description Function retrieves the user's verification data from the server and sets the initial values for the form
   */
  setUserData() {
    this.loading = true;
    this.userService.UserVerification$.subscribe(
      (res) => {
        this.loading = false;
        if (res.email_verified == 0) {
          this.userForm.controls.emailAddress.setValidators(
            Validators.required
          );
          this.userForm.controls.emailAddress.updateValueAndValidity();
          this.requestOtp.controls.enterMailOtp.setValidators(
            Validators.required
          );
          this.requestOtp.controls.enterMailOtp.updateValueAndValidity();
          this.emailVerified = false;
        } else if (res.email_verified == 1) {
          this.emailVerified = true;
          this.userForm.controls.emailAddress.clearValidators();
          this.userForm.controls.emailAddress.updateValueAndValidity();
          this.requestOtp.controls.enterMailOtp.clearValidators();
          this.requestOtp.controls.enterMailOtp.updateValueAndValidity();
        }

        if (res.phone_verified == 0) {
          this.userForm.controls.phoneNumber.setValidators(Validators.required);
          this.userForm.controls.phoneNumber.updateValueAndValidity();
          this.requestOtp.controls.enterMobileOtp.setValidators(
            Validators.required
          );
          this.requestOtp.controls.enterMobileOtp.updateValueAndValidity();
          this.phoneVerified = false;
        } else if (res.phone_verified == 1) {
          this.phoneVerified = true;
          this.userForm.controls.phoneNumber.clearValidators();
          this.userForm.controls.phoneNumber.updateValueAndValidity();
          this.requestOtp.controls.enterMobileOtp.clearValidators();
          this.requestOtp.controls.enterMobileOtp.updateValueAndValidity();
        }

        let num = res?.phone;
        let num1 = res?.phone;
        num = num.substring(num.length - 10, num.length);
        num1 = num1.substring(num1.length - 10, num1.length - 13);
        this.userForm.patchValue({
          emailAddress: res.email,
          phoneNumber: num || ''
        });

        const data = {
          dialcode: num1,
          phoneNumber: num
        };

        this.setNumber(data);
      },
      () => {
        this.loading = false;
      }
    );
  }

  /**
   * @description Function sets the dial code and phone number for the user.
   */
  setNumber(data: { dialcode: string; phoneNumber: string }) {
    this.dialcode = data?.dialcode;
    this.phoneNumber = data?.phoneNumber;
    this.setFlag();
  }

  /**
   * @description Function sets the selected country flag based on the dial code
   */
  setFlag() {
    this.countryList.forEach((el) => {
      if (!this.dialcode) {
        this.selectedCountryFlag = 'https://flagcdn.com/w320/us.png';
        this.country_code = '+1';
        return;
      }
      if (el.dial_code == this.dialcode) {
        this.selectedCountryFlag = el.flage_url;
        this.country_code = el.dial_code;
      }
    });
  }

  /**
   * @description Function is called when the user submits the email OTP form. It verifies the entered OTP code
   * @returns
   */
  submitEmailOtp() {
    this.requestOtp.controls.enterMailOtp.markAsTouched();
    if (this.requestOtp.controls.enterMailOtp.invalid) {
      return;
    }
    this.btnDisable2 = true;
    const sendingData = {
      email: this.userForm.controls.emailAddress.value,
      otp: this.requestOtp.controls.enterMailOtp.value
    };

    this.subscriptions.push(
      this.userService
        .verifyEmailOtp(sendingData)
        .pipe(
          catchError((err) => {
            this.btnDisable2 = false;
            if (err.error.success == false) {
              // this.timer(err.error.errorMsg)
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.success == true) {
            this.emailVerified = true;
            this.btnDisable2 = false;
            this.showTimer = false;
            this.message = res.message;
            this.store.dispatch(
              UserManagementActions.manualUpdateUserVerification({
                verificationState: {
                  email_verified: 1,
                  email: this.userForm.controls.emailAddress.value
                }
              })
            );
            this.alertService.successAlert({
              title: 'Success',
              content: 'Email Verified Successfully',
              close: true
            });
            this.store.select(selectUserVerification).subscribe((res) => {
              if (res?.phone_verified === 1) {
                this.router.navigateByUrl(
                  '/manage/verification/index'
                );
              }
            });

            if (this.localStorageService.getItem('phoneVerified') === '1') {
              this.router.navigateByUrl('/manage/verification/index');
            }
            this.localStorageService.setItem('emailVerified', 1);
            this.alertService.successAlert({
              title: 'Success',
              content: 'Email Verified Successfully',
              close: true
            });
            this.gettingStartedService.updatedGettingStartedData = 0;
          }
        })
    );
  }

  /**
   * @description Function is called when the user submits the phone OTP form. It verifies the entered OTP code
   * @returns
   */
  submitMobileOtp() {
    this.requestOtp.controls.enterMobileOtp.markAsTouched();
    if (this.requestOtp.controls.enterMobileOtp.invalid) {
      return;
    }
    this.btnDisable2 = true;
    const sendingData = {
      phone: this.userForm.controls.phoneNumber.value,
      otp: this.requestOtp.controls.enterMobileOtp.value
    };

    this.subscriptions.push(
      this.userService
        .verifyPhoneOTP(sendingData)
        .pipe(
          catchError((err) => {
            this.btnDisable2 = false;
            if (err.error.success == false) {
              // this.timer(err.error.errorMsg)
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.success == true) {
            this.gettingStartedService.updatedGettingStartedData = 1;
            this.btnDisable2 = false;
            this.message = res.message;
            this.store.dispatch(
              UserManagementActions.manualUpdateUserVerification({
                verificationState: {
                  email_verified: 1,
                  email: this.userForm.controls.emailAddress.value,
                  phone_verified: 1,
                  phone: this.userForm.controls.phoneNumber.value
                }
              })
            );
            if (this.dialogueData) {
              this.matDialogueRef.close(true);
              return;
            }
            this.localStorageService.setItem('phoneVerified', 1);
            if (this.directPlancode) {
              this.router.navigate(['/manage/subscription/plan'], {
                queryParams: { plancode: this.directPlancode }
              });
            } else if (this.returnUrl) {
              this.router.navigate([this.returnUrl], {
                queryParams: {
                  type: this.sourceType,
                  bankAccountId: this.bankAccountId
                }
              });
            } else {
              this.location.back();
            }
          }
        })
    );
  }

  /**
   * @description Function is triggered when the user clicks on the country code dropdown to show/hide the country list.
   */
  showLists() {
    if (!this.listShow) {
      this.showList = true;
      this.listShow = true;
    } else {
      this.listShow = false;
      this.showList = false;
    }
  }

  /**
   * @description Function is called when the user selects a country from the list
   * @param item Selected country
   */
  getSelectedItem(item: ICountryItem) {
    this.selectedCountryFlag = item.flage_url;
    this.showList = !this.showList;
    this.listShow = false;
    this.country_code = item.dial_code;
  }

  /**
   * @description Function restricts the input to numbers only
   * @param event Event on keypress
   * @returns
   */
  numberOnly(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * @description Unsubscribes from all subscriptions when the component destroys
   */
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
