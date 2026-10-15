import { Component, OnDestroy, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import {
  LucideAngularModule,
  Eye,
  EyeOff,
  Monitor,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Shield,
  ShieldCheck,
  KeyRound,
  Plus,
  Loader2,
  CircleDot
} from 'lucide-angular';
import { Subscription, finalize } from 'rxjs';
import { IConfirmAlert, ISuccessAlert } from 'src/app/models/alert';
import { IApiResMesssage } from 'src/app/models/api';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4UserWhitelistIpComponent } from 'src/app/modules/user-v4/modals/v4-user-whitelist-ip/v4-user-whitelist-ip.component';
import { IDevices } from 'src/app/modules/user/user-v2/components/security/security';
import { V4TwoFactorStep1Component } from 'src/app/modules/user-v4/modals/v4-two-factor-step1/v4-two-factor-step1.component';
import { V4AccountCloseComponent } from 'src/app/modules/user-v4/modals/v4-account-close/v4-account-close.component';

@Component({
  selector: 'app-v4-security',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    MatTooltip,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    DatePipe
  ],
  templateUrl: './v4-security.component.html',
  styleUrls: ['./v4-security.component.scss']
})
export class V4SecurityComponent implements OnInit, OnDestroy {
  private userService = inject(UserProfileService);
  private alert = inject(V4AlertService);
  private commonOnInitService = inject(CommonOnInitService);
  private dialog = inject(MatDialog);
  private localStorageService = inject(LocalStorageService);

  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly MonitorIcon = Monitor;
  readonly LogOutIcon = LogOut;
  readonly ChevronLeftIcon = ChevronLeft;
  readonly ChevronRightIcon = ChevronRight;
  readonly TrashIcon = Trash2;
  readonly ShieldIcon = Shield;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly KeyRoundIcon = KeyRound;
  readonly PlusIcon = Plus;
  readonly LoaderIcon = Loader2;
  readonly CircleDotIcon = CircleDot;

  subscriptions: Subscription[] = [];
  isLoading = signal(false);
  isSubmit = signal(false);
  showValidBox = signal(false);
  oldPasswordHide = signal(true);
  newPasswordHide = signal(true);
  confirmPasswordHide = signal(true);
  ipWhitelist = signal<{ ip: string; nickname: string; created_at: string }[]>(
    []
  );

  isLoadIpWhitelist = signal(false);

  timer = '';
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
  paginationPage = 1;
  pseudoI!: number;
  devices = signal<IDevices[]>([]);
  isLoadActiveDevices = signal(false);
  isSingleDeviceLogout = signal(false);
  isLogout = signal(false);
  selectedDeviceId = '';

  hasLowerCase = signal(false);
  hasUpperCase = signal(false);
  hasNumber = signal(false);
  hasSpecialChar = signal(false);
  hasMinLength = signal(false);

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
    this.isParentCompany.set(
      this.localStorageService.getItem('isParentCompany') === 1
    );
    this.getIpWhitelist();
  }

  isPasswordValid(): void {
    const password = this.securityForm?.value?.newPassword || '';
    this.hasLowerCase.set(/[a-z]/.test(password));
    this.hasUpperCase.set(/[A-Z]/.test(password));
    this.hasNumber.set(/[0-9]/.test(password));
    this.hasSpecialChar.set(
      /[!"`'#%&,:;<>=@{}~$()*+/\\?[\]^|]+/.test(password)
    );
    this.hasMinLength.set(password.length >= 8);

    if (
      this.hasLowerCase() &&
      this.hasUpperCase() &&
      this.hasNumber() &&
      this.hasSpecialChar() &&
      this.hasMinLength()
    ) {
      this.showValidBox.set(false);
    } else {
      this.showValidBox.set(true);
    }
  }

  passWordMismatch(): boolean | undefined {
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

  securityFormSubmit(): void {
    this.securityForm.markAllAsTouched();
    if (this.securityForm.invalid || this.passWordMismatch()) return;
    const processedData = this.createSecurityFormBody();

    this.isSubmit.set(true);
    this.subscriptions.push(
      this.userService
        .security(processedData)
        .pipe(finalize(() => this.isSubmit.set(false)))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.alert.successAlert({
                title: 'Success',
                content: 'Password Updated!',
                doneMsg: 'OK',
                cancelMsg: 'cancel',
                close: true
              });
              this.getAllActiveDevices();
            }
            this.securityForm.reset();
          }
        })
    );
  }

  createSecurityFormBody() {
    const data = this.securityForm.value;
    return {
      old: data.oldPassword,
      password: data.newPassword,
      passwordConfirmation: data.confirmPassword
    };
  }

  isTwoFactor(): void {
    const currentStatus =
      this.localStorageService.getItem('isTwoFactorEnabled');
    this.isTwoFactorActive.set(currentStatus === 1);
  }

  isAdvancedTwoFactor(): void {
    const currentStatus = this.localStorageService.getItem(
      'isAdvancedTwoFactorEnabled'
    );
    this.isAdvancedTwoFactorActive.set(currentStatus === 1);
  }

  turnOnTwoFactor(): void {
    this.diasbleTwoFactorToggle.set(true);
    this.subscriptions.push(
      this.userService
        .twofactorToggle()
        .pipe(finalize(() => this.diasbleTwoFactorToggle.set(false)))
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.openAuthenticationModal(
                2,
                res.data.timer,
                'twofactor',
                this.isTwoFactorActive()
              );
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
                this.commonOnInitService.openEmailPhoneVerificationModal();
              }
            }
          }
        })
    );
  }

  turnOnAdvancedTwoFactor(): void {
    this.diasbleAdvancedTwoFactorToggle.set(true);
    this.subscriptions.push(
      this.userService
        .advancedTwofactorToggle()
        .pipe(finalize(() => this.diasbleAdvancedTwoFactorToggle.set(false)))
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
                this.commonOnInitService.openEmailPhoneVerificationModal();
              }
            }
          }
        })
    );
  }

  openAuthenticationModal(
    type: number,
    timer: string,
    mode: 'twofactor' | 'advancedtwofactor',
    isToTurnOff?: boolean
  ): void {
    const dialogRef = this.dialog.open(V4TwoFactorStep1Component, {
      maxWidth: '460px',
      width: '93%',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { type, timer, mode, isToTurnOff }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        if (isToTurnOff) {
          this.isTwoFactorActive.set(mode !== 'twofactor');
          this.isAdvancedTwoFactorActive.set(mode !== 'advancedtwofactor');
        }
        this.isTwoFactor();
        this.isAdvancedTwoFactor();
      }
    });
  }

  closeAccount(): void {
    this.dialog.open(V4AccountCloseComponent, {
      maxWidth: '700px',
      width: '93%',
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  getAllActiveDevices(): void {
    this.isLoadActiveDevices.set(true);
    this.subscriptions.push(
      this.userService
        .getActiveDevices()
        .pipe(finalize(() => this.isLoadActiveDevices.set(false)))
        .subscribe((res) => {
          if (res.success) {
            this.connectedDevices = res.data;
            this.totalPage = Math.ceil(this.connectedDevices.length / 10);
            this.connectedDevices.sort(
              (a, b) => b.isCurrentLogin - a.isCurrentLogin
            );
            this.devices.set(this.connectedDevices.slice(0, 10));
            this.paginationArray();
          }
        })
    );
  }

  confirmAlert(message: string) {
    const alertConfig: IConfirmAlert = {
      title: 'Sure?',
      content: message,
      close: false,
      doneMsg: 'OK',
      isOk: true,
      cancelMsg: 'Cancel',
      isCancel: true
    };
    return this.alert.confirmAlert(alertConfig);
  }

  showSuccessMessage(message: string): void {
    const alertConfig: ISuccessAlert = {
      title: 'Success',
      content: message,
      close: true,
      doneMsg: 'Ok',
      isOk: true
    };
    this.alert.successAlert(alertConfig);
  }

  logout(id?: string): void {
    if (this.devices().length <= 1) return;

    if (id) {
      this.selectedDeviceId = id;
      this.confirmAlert('Are you sure you want to log out?')
        .afterClosed()
        .subscribe((ans: boolean | undefined) => {
          if (ans) {
            this.isSingleDeviceLogout.set(true);
            this.subscriptions.push(
              this.userService
                .logoutDevices({ ids: [id] })
                .pipe(finalize(() => this.isSingleDeviceLogout.set(false)))
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
              .filter((d) => d.isCurrentLogin !== 1)
              .map((d) => d.id);
            this.isLogout.set(true);
            this.subscriptions.push(
              this.userService
                .logoutDevices({ ids })
                .pipe(finalize(() => this.isLogout.set(false)))
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

  paginationArray(): void {
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

  onPrevious(): void {
    if (this.initialPage > 1) {
      this.initialPage -= 1;
      this.getNextItems(this.initialPage);
    }
  }

  onNext(): void {
    if (this.initialPage < this.totalPage) {
      this.initialPage += 1;
      this.getNextItems(this.initialPage);
    }
  }

  gotoPage(page: number | string): void {
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

  getNextItems(num: number): void {
    this.devices.set([]);
    this.paginationPage = num;
    const start = num * 10 - 10;
    const end = num * 10;
    this.devices.set(this.connectedDevices.slice(start, end));
  }

  getIpWhitelist(): void {
    this.isLoadIpWhitelist.set(true);
    this.subscriptions.push(
      this.userService
        .getIpWhitelist()
        .pipe(finalize(() => this.isLoadIpWhitelist.set(false)))
        .subscribe((res) => {
          if (res.success) {
            this.ipWhitelist.set(res.data || []);
          }
        })
    );
  }

  addIpWhitelist(): void {
    const dialogRef = this.dialog.open(V4UserWhitelistIpComponent, {
      maxWidth: '460px',
      width: '93%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: {
        clientId: this.localStorageService.getItem('userId')
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.getIpWhitelist();
      }
    });
  }

  removeIpWhitelist(ip: string): void {
    this.confirmAlert('Are you sure you want to remove this IP address?')
      .afterClosed()
      .subscribe((response) => {
        if (response) {
          this.subscriptions.push(
            this.userService.removeIpWhitelist({ ip }).subscribe((res) => {
              if (res.success) {
                this.showSuccessMessage('IP Address Removed.');
                this.getIpWhitelist();
              }
            })
          );
        }
      });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
