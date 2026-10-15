import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { IConfirmAlert, ISuccessAlert } from 'src/app/models/alert';
import { IApiResMesssage } from 'src/app/models/api';
import { MatTooltip } from '@angular/material/tooltip';
import { DatePipe, NgClass } from '@angular/common';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faAngleLeft,
  faAngleRight,
  faArrowRightFromBracket,
  faDesktop,
  faEye,
  faEyeSlash,
  faPeriod,
  faSpinner,
  faTrash
} from '@fortawesome/pro-solid-svg-icons';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { UserWhitelistIpComponent } from 'src/app/modules/user-management/components/user-whitelist-ip/user-whitelist-ip.component';
import { IDevices } from './security';
import { TwoFactorStep1Component } from '../../modals/two-factor-step1/two-factor-step1.component';

/**
 * @description Component for security section in profile section
 */
@Component({
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgClass,
    MatTooltip,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    CommonButtonV35Component,
    FaIconComponent,
    DatePipe
  ]
})
export class SecurityComponent implements OnInit, OnDestroy {
  private userService = inject(UserProfileService);
  private alert = inject(AlertService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);

  subscriptions: Subscription[] = [];
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  isLoading = signal(false);
  isSubmit = signal(false);
  showValidBox = signal(false);
  oldPasswordHide = signal(true);
  newPasswordHide = signal(true);
  confirmPasswordHide = signal(true);
  ipWhitelist = signal<{ip: string, nickname: string, created_at: string}[]>([]);
  isLoadIpWhitelist = signal(false);
  totalPageIpWhitelist = 0;
  initialCountIpWhitelist = 1;
  pageArrIpWhitelist: (number | string)[] = [];
  initialPageIpWhitelist = 1;
  modeIpWhitelist = 1;
  selectedValueIpWhitelist!: number;

  timer: string;
  isTwoFactorActive = signal(false);
  isAdvancedTwoFactorActive = signal(false);
  diasbleTwoFactorToggle = signal(false);
  diasbleAdvancedTwoFactorToggle = signal(false);
  isParentCompany = signal(false);

  connectedDevices: IDevices[] = [];
  totalPage = 0;
  initialCount = 1;
  pageArr: (number | string)[] = [];
  initialPage = 1;
  mode = 1;
  selectedValue!: number;
  paginationPage: number = 1;
  pseudoI!: number;
  devices = signal<IDevices[]>([]);
  isLoadActiveDevices = signal(false);
  isSingleDeviceLogout = signal(false);
  isLogout = signal(false);
  selectedDeviceId: string;
  faDesktop = faDesktop;
  faSignout = faArrowRightFromBracket;
  faPoint = faPeriod;
  faSpinner = faSpinner;
  faAngleLeft = faAngleLeft;
  faAngleRight = faAngleRight;
  faTrash = faTrash;

  securityForm = new FormGroup({
    oldPassword: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', [
      Validators.required,
      Validators.minLength(8)
    ]),
    confirmPassword: new FormControl('', [Validators.required])
  });

  ngOnInit(): void {
    this.isTwoFactor();
    this.isAdvancedTwoFactor();
    this.getAllActiveDevices();
    this.isParentCompany.set(this.localStorageService.getItem('isParentCompany') === 1);
    this.getIpWhitelist();
  }

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

    const password = this.securityForm?.value?.newPassword;
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
      this.showValidBox.set(false);
    } else {
      this.showValidBox.set(true);
    }
  }

  passWordMismatch() {
    if (
      !this.securityForm?.value?.newPassword &&
      !this.securityForm?.value?.confirmPassword
    )
      return undefined;
    if (
      this.securityForm.controls.confirmPassword.touched &&
      this.securityForm?.value?.confirmPassword !== '' &&
      this.securityForm?.value?.newPassword !==
        this.securityForm?.value?.confirmPassword
    ) {
      return true;
    }
    return false;
  }

  /**
   * @description Method to submit security form
   */
  securityFormSubmit() {
    this.securityForm.markAllAsTouched();
    if (this.securityForm.invalid || this.passWordMismatch()) return;
    const processedData = this.createSecurityFormBody();

    this.isSubmit.set(true);
    this.subscriptions.push(
      this.userService
        .security(processedData)
        .pipe(
          finalize(() => {
            this.isSubmit.set(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              const data = {
                title: 'Success',
                content: 'Password Updated!',
                doneMsg: 'OK',
                cancelMsg: 'cancel',
                close: true
              };
              this.getAllActiveDevices();
              this.alert.successAlert(data);
            }
            this.securityForm.reset();
          }
        })
    );
  }

  /**
   * @description Method to create securityForm payload.
   * @returns an object containing securityForm values.
   */
  createSecurityFormBody() {
    const data = this.securityForm.value;
    return {
      old: data.oldPassword,
      password: data.newPassword,
      passwordConfirmation: data.confirmPassword
    };
  }

  /**
   * @description Method to set 2FA status
   */
  isTwoFactor() {
    const currentStatus =
      this.localStorageService.getItem('isTwoFactorEnabled');
    this.isTwoFactorActive.set(currentStatus === 1);
  }

  /**
   * @description Method to set advanced 2FA status.
   */
  isAdvancedTwoFactor() {
    const currentStatus = this.localStorageService.getItem(
      'isAdvancedTwoFactorEnabled'
    );
    this.isAdvancedTwoFactorActive.set(currentStatus === 1);
  }

  turnOnTwoFactor() {
    this.diasbleTwoFactorToggle.set(true);
    this.subscriptions.push(
      this.userService
        .twofactorToggle()
        .pipe(
          finalize(() => {
            this.diasbleTwoFactorToggle.set(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
                this.openAuthenticationModal(2, res.data.timer, 'twofactor', this.isTwoFactorActive());
            }
          },
          error: (err) => {
            if (this.isTwoFactorActive()) {
              this.isTwoFactorActive.set(true);
            } else {
              this.isTwoFactorActive.set(false);
              if (err.error.errorCode === 1) {
                this.timer = err.error.errorMsg;
                this.openAuthenticationModal(
                  1,
                  err.error.errorMsg,
                  'twofactor'
                );
              } else if (err.error.errorCode === 106) {
                this.router.navigate(['manage/users/verify-email-phone'], {
                  queryParams: {
                    returnUrl: '/manage/user-profile/changepassword'
                  }
                });
              }
            }
          }
        })
    );
  }

  turnOnAdvancedTwoFactor() {
    this.diasbleAdvancedTwoFactorToggle.set(true);
    this.subscriptions.push(
      this.userService
        .advancedTwofactorToggle()
        .pipe(
          finalize(() => {
            this.diasbleAdvancedTwoFactorToggle.set(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
                this.openAuthenticationModal(
                  2,
                  res.data.timer,
                  'advancedtwofactor',
                  this.isAdvancedTwoFactorActive()
                );
            }
          },
          error: (err) => {
            if (this.isAdvancedTwoFactorActive()) {
              this.isAdvancedTwoFactorActive.set(true);
            } else {
              this.isAdvancedTwoFactorActive.set(false);
              if (err.error.errorCode === 1) {
                this.timer = err.error.errorMsg;
                this.openAuthenticationModal(
                  1,
                  err.error.errorMsg,
                  'advancedtwofactor'
                );
              } else if (err.error.errorCode === 106) {
                this.router.navigate(
                  ['manage/user-profile/verify-email-phone'],
                  {
                    queryParams: {
                      returnUrl: '/manage/user-profile/changepassword'
                    }
                  }
                );
              }
            }
          }
        })
    );
  }

  /**
   * @description Method to set step 1 of 2FA
   * @param type - 1 if errorCode is 1, else 2
   * @param timer - timer for current operation
   * @param mode - 2FA or advanced 2FA
   */
  openAuthenticationModal(
    type: number,
    timer: string,
    mode: 'twofactor' | 'advancedtwofactor',
    isToTurnOff?: boolean
  ) {
    const dialogRef = this.dialog.open(TwoFactorStep1Component, {
      maxWidth: '460px',
      width: '93%',
      disableClose: true,
      data: { type, timer, mode, isToTurnOff }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if(res) {
        if (isToTurnOff) {
          this.isTwoFactorActive.set(mode !== 'twofactor');
          this.isAdvancedTwoFactorActive.set(mode !== 'advancedtwofactor');
        } 
          this.isTwoFactor();
          this.isAdvancedTwoFactor();
      }
    });
  }

  /**
   * @description Method to route to account closing page
   */
  closeAccouont() {
    this.router.navigateByUrl('/manage/settings/closemyaccount');
  }

  /**
   * Method to get all logged Active Devices
   * @param {string} message - The message to display.
   */
  getAllActiveDevices() {
    this.isLoadActiveDevices.set(true);
    this.subscriptions.push(
      this.userService
        .getActiveDevices()
        .pipe(
          finalize(() => {
            this.isLoadActiveDevices.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.connectedDevices = res.data;
            this.totalPage = Math.ceil(this.connectedDevices.length / 10);
            this.connectedDevices.sort(
              (a, b) => b.isCurrentLogin - a.isCurrentLogin
            );

            const start = 0; // For the first page
            const end = 10; // Display 10 items per page

            const slicedDevices = this.connectedDevices.slice(start, end);
            this.devices.set(slicedDevices);

            this.paginationArray();
          }
        })
    );
  }

  /**
   * Displays a confirm alert message using the AlertService.
   * @param {string} message - The message to display.
   */
  confirmAlert(message: string) {
    const alertConfig: IConfirmAlert = {
      title: 'Sure?',
      content: message,
      close: false,
      doneMsg: 'Ok',
      isOk: true,
      cancelMsg: 'Cancel',
      isCancel: true
    };
    return this.alert.confirmAlert(alertConfig);
  }

  /**
   * Displays a success message using the AlertService.
   * @param {string} message - The success message to display.
   */
  showSuccessMessage(message: string) {
    const alertConfig: ISuccessAlert = {
      title: 'Success',
      content: message,
      close: true,
      doneMsg: 'Ok',
      isOk: true
    };
    this.alert.successAlert(alertConfig);
  }

  /**
   * Handles logout from other devices
   * @param {string} id - Id of the logged device
   */
  logout(id?: string) {
    if (this.devices().length <= 1) {
      return;
    }
    if (id) {
      this.selectedDeviceId = id;
      this.confirmAlert('Are you sure you want to log out?')
        .afterClosed()
        .subscribe((ans: boolean | undefined) => {
          if (ans) {
            const data = {
              ids: [id]
            };
            this.isSingleDeviceLogout.set(true);
            this.subscriptions.push(
              this.userService
                .logoutDevices(data)
                .pipe(
                  finalize(() => {
                    this.isSingleDeviceLogout.set(false);
                  })
                )
                .subscribe((res: IApiResMesssage) => {
                  if (res.success) {
                    this.showSuccessMessage('Successfully logged out');
                    this.getAllActiveDevices();
                  }
                })
            );
          }
        });
    } else {
      this.confirmAlert(
        'Are you sure you want to log out from All Other Devices?'
      )
        .afterClosed()
        .subscribe((ans: boolean | undefined) => {
          if (ans) {
            const ids = this.connectedDevices
              .filter((device) => device.isCurrentLogin !== 1)
              .map((device) => device.id);
            const data = {
              ids
            };
            this.isLogout.set(true);
            this.subscriptions.push(
              this.userService
                .logoutDevices(data)
                .pipe(
                  finalize(() => {
                    this.isLogout.set(false);
                  })
                )
                .subscribe((res: IApiResMesssage) => {
                  if (res.success) {
                    this.showSuccessMessage('Successfully logged out');
                    this.devices.set([]);
                    this.getAllActiveDevices();
                  }
                })
            );
          }
        });
    }
  }

  /**
   * Generates an array for pagination control based on the current mode.
   * @method
   */
  paginationArray() {
    switch (this.mode) {
      case 1:
        this.pageArr = [
          this.initialCount,
          this.initialCount + 1,
          this.initialCount + 2,
          this.initialCount + 3,
          this.initialCount + 4,
          '...',
          this.totalPage
        ];
        break;

      case 2:
        this.pageArr = [
          this.initialCount,
          '...',
          this.selectedValue - 1,
          this.selectedValue,
          this.selectedValue + 1,
          '...',
          this.totalPage
        ];
        break;

      case 3:
        this.pageArr = [
          this.initialCount,
          '...',
          this.totalPage - 4,
          this.totalPage - 3,
          this.totalPage - 2,
          this.totalPage - 1,
          this.totalPage
        ];
        break;
      default:
        break;
    }

    if (this.totalPage < 8) {
      this.pageArr = [];

      for (let i = 1; i <= this.totalPage; i += 1) {
        this.pageArr.push(i);
      }
    }
  }

  /**
   * Moves to the previous page of notifications.
   * @method
   */
  onPrevious() {
    if (this.initialPage > 1) {
      this.initialPage -= 1;
      this.getNextItems(this.initialPage);
    }
  }

  /**
   * Moves to the next page of notifications.
   * @method
   */
  onNext() {
    if (this.initialPage < this.totalPage) {
      this.initialPage += 1;
      this.getNextItems(this.initialPage);
    }
  }

  /**
   * Navigates to a specific page of notifications.
   * @method
   * @param {number | string} item - The page number to navigate to.
   */
  gotoPage(page: number | string) {
    const item = Number(page);
    if (item > 0) {
      this.initialPage = item;
      if (item < this.initialCount + 4) {
        this.mode = 1;
        this.paginationArray();
      } else if (item > this.initialCount + 3 && item < this.totalPage - 3) {
        this.selectedValue = item;
        this.mode = 2;
        this.paginationArray();
        this.pseudoI = 4;
      } else {
        this.mode = 3;
        this.paginationArray();
        this.pseudoI = 7 - (this.totalPage - item);
      }
    }

    this.getNextItems(item);
  }

  getNextItems(num: number) {
    this.devices.set([]);
    this.paginationPage = num;
    const start = num * 10 - 10;
    const end = num * 10;
    const slicedDevices = this.connectedDevices.slice(start, end);
    this.devices.set(slicedDevices);
  }

  getIpWhitelist() {
    this.isLoadIpWhitelist.set(true);
    this.subscriptions.push(
      this.userService.getIpWhitelist().pipe(finalize(() => {
        this.isLoadIpWhitelist.set(false);
      })).subscribe((res) => {
        if (res.success) {
          this.ipWhitelist.set(res.data || []);
        }
      })
    );
  }

  addIpWhitelist() {
    const dialogRef = this.dialog.open(UserWhitelistIpComponent, {
      maxWidth: '460px',
      width: '93%',
      disableClose: true,
      autoFocus: false,
      data: {
        clientId: this.localStorageService.getItem('userId'),
        source: 'profile'
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if(res) {
        this.getIpWhitelist();
      }
    });
  }

  removeIpWhitelist(ip: string) {
    const confirmAlert = this.confirmAlert('Are you sure you want to remove this IP address?');
    confirmAlert.afterClosed().subscribe((response) => {
      if(response) {
        this.subscriptions.push(
          this.userService.removeIpWhitelist({ip}).subscribe((res) => {
            if(res.success) {
              this.showSuccessMessage('IP Address Removed.');
              this.getIpWhitelist();
            }
          })
        );
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
