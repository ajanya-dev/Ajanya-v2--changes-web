import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormArray
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialog
} from '@angular/material/dialog';
import { forkJoin, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  FtpSettings,
  PositivePayService
} from 'src/app/shared/service/positive-pay/positive-pay.service';
import { NgSelectModule } from '@ng-select/ng-select';
import { UserService } from 'src/app/shared/service/user/user.service';
import { ITimeZone } from 'src/app/modules/user/model/user';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { faCircleInfo, faXmark, faTrash, faPlus } from '@fortawesome/pro-solid-svg-icons';
import { DropDownBankMultiSelectComponent } from 'src/app/shared/components/drop-downs/drop-down-bank-multi-select/drop-down-bank-multi-select.component';
import { IBankDropdown } from 'src/app/models/bank';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { MatTooltip } from '@angular/material/tooltip';
import { KeyValuePipe } from '@angular/common';
import { GenerateSshModalComponent } from '../generate-ssh-modal/generate-ssh-modal.component';
import { IExportModalData } from '../../model/postive-pay';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';

@Component({
  selector: 'app-set-positive-pay-modal',
  templateUrl: './set-positive-pay-modal.component.html',
  styleUrls: ['./set-positive-pay-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    NgSelectModule,
    FaIconComponent,
    CommonButtonV35Component,
    V35CommonDropDownSelectorComponent,
    V35ControlMessageComponent,
    DropDownBankMultiSelectComponent,
    CommonInputFieldComponent,
    MatTooltip,
    KeyValuePipe
  ]
})
export class SetPositivePayModalComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private localStorageService = inject(LocalStorageService);
  private positivePayService = inject(PositivePayService);
  private alertService = inject(AlertService);
  private bankService = inject(BankAccountsService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<SetPositivePayModalComponent>);
  public injectData: IExportModalData = inject(MAT_DIALOG_DATA);

  subscriptions: Subscription[] = [];
  bankAccounts: IBankDropdown[] = [];
  allBankAccounts: IBankDropdown[] = [];
  totalBankAccountsCount: number;
  bankAccountIds: string[] = [];
  timeZoneList: ITimeZone[];
  uploadTimesArray: string[] = [];
  timezone: string;
  sshList: { id: string; nickName: string }[] = [];
  newSsh: string;
  sshItem: { id: string; nickName: string } | string;
  showMoreEmails = false;

  isChecked = signal(true);
  isSelectAll = false;
  showPasswordField = signal(true);
  showSshField = signal(false);
  loading = signal(false);
  showScheduleTime = signal(false);
  fetchData = signal(false);
  isLoadingFileTypes = signal(false);

  faXmark = faXmark;
  faCircleInfo = faCircleInfo;
  faTrash = faTrash;
  faPlus = faPlus;

  driverOptions:{[key: string]:string} = {1: 'FTP', 2: 'SFTP',3:'Email'};
  fileTypes:{[key: string]:string} = {1: 'TXT', 2: 'CSV', 3:'EXCEL'};

  // Time 2 through Time 14 (13 extra slots, index 0-12)
  extraTimeSlots = Array.from({ length: 13 }, (_, i) => ({ index: i, label: i + 2 }));

  positivePayForm = new FormGroup({
    driver: new FormControl('', [Validators.required]),
    host: new FormControl('', [Validators.required]),
    port: new FormControl('', [Validators.required]),
    userName: new FormControl('', [Validators.required]),
    logonType: new FormControl('1'),
    password: new FormControl('', [Validators.required]),
    fileType: new FormControl('', [Validators.required]),
    timeToUpload: new FormControl('', [Validators.required]),
    ssh: new FormControl(''),
    email: new FormControl(''),
    time_zone: new FormControl(''),
    running_times: new FormControl(['']),
    bankAccounts: new FormControl(this.bankAccountIds, [Validators.required]),
    additionalEmails: new FormArray([])
  });

  get additionalEmailsArray(): FormArray {
    return this.positivePayForm.get('additionalEmails') as FormArray;
  }

  ngOnInit(): void {
    this.loadBankAccounts();
    this.observeFormChanges();
    this.loadSshListAndFtpSettings();
    this.getTimezone();
    this.getSetupMethod();
    this.timezone = this.localStorageService.getItem('timezone');
    if (!this.timezone) {
      this.timezone = 'America/Chicago';
    }
  }

  loadBankAccounts(): void {
    this.subscriptions.push(
      this.positivePayService
        .getPositivePayBankAccounts(this.injectData.bank_routing_number)
        .pipe()
        .subscribe((res) => {
          if (res?.success) {
            this.bankAccounts = res?.data?.bankAccounts;
            this.totalBankAccountsCount = res?.data?.totalAccounts;
            if (this.bankAccounts?.length === this.totalBankAccountsCount) {
              this.isSelectAll = true;
            }
            this.getAllBankAccounts();
          }
        })
    );
  }

  getAllBankAccounts(): void {
    this.subscriptions.push(
      this.bankService
        .getBankAccountsPerPage(
          this.totalBankAccountsCount,
          this.injectData.bank_routing_number
        )
        .subscribe((res) => {
          this.allBankAccounts = res?.data;
        })
    );
  }

  selectAll(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target?.checked) {
      this.allBankAccounts.forEach((res) => {
        if (!this.bankAccountIds?.includes(res?.id)) {
          this.bankAccounts.push(res);
        }
      });
      this.bankAccounts = [...this.bankAccounts];
      this.isChecked.set(true);
    } else {
      this.bankAccounts = [];
      this.bankAccountIds = [];
      this.isChecked.set(false);
    }
    this.positivePayForm.controls.bankAccounts.setValue(this.bankAccountIds);
  }

  bankSlectionEvent(bankEvent: IBankDropdown[]): void {
    this.bankAccountIds = [];
    bankEvent?.forEach((element) => {
      if (this.bankAccountIds?.indexOf(element?.id) === -1) {
        this.bankAccountIds?.push(element?.id);
      }
    });
    if (this.bankAccountIds?.length === this.totalBankAccountsCount) {
      this.isSelectAll = true;
    } else {
      this.isSelectAll = false;
    }
    this.positivePayForm.controls.bankAccounts.setValue(this.bankAccountIds);
  }

  onChangeSsh(val: string) {
    if (val) {
      const selectedSsh = JSON.parse(val);
      this.positivePayForm.controls.ssh.setValue(selectedSsh.id);
    }
  }

  /**
   * Refetch SSH keys (e.g. after generating a new key). Does not reload FTP settings.
   */
  getUserSSh(): void {
    this.subscriptions.push(
      this.positivePayService.getUserSsh().subscribe((res) => {
        this.sshList = res?.data ?? [];
        const foundSsh = this.sshList.find(
          (item) => item.nickName === this.newSsh
        );
        if (foundSsh) {
          const newValue = JSON.stringify(foundSsh);
          this.sshItem = newValue;
          this.onChangeSsh(this.sshItem);
        }
      })
    );
  }

  AddNewSSH() {
    this.dialog
      .open(GenerateSshModalComponent, {
        maxWidth: '510px',
        width: '100%',
        disableClose: true,
        autoFocus: false
      })
      .afterClosed()
      .subscribe((res) => {
        if (res.success) {
          this.newSsh = res.name;
          this.getUserSSh();
        }
      });
  }

  openSettingModal() {
    this.dialog.open(SettingsModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      data: this.injectData
    });
  }

  /**
   * @description Set validations for driver type 3
   */
  observeFormChanges() {
    const controls = [
      this.positivePayForm.controls.host,
      this.positivePayForm.controls.port,
      this.positivePayForm.controls.userName,
      this.positivePayForm.controls.email,
      this.positivePayForm.controls.password,
      this.positivePayForm.controls.ssh
    ];

    this.positivePayForm.controls.driver.valueChanges.subscribe((val) => {
      if (String(val) === '3') {
        this.positivePayForm.controls.host.clearValidators();
        this.positivePayForm.controls.port.clearValidators();
        this.positivePayForm.controls.userName.clearValidators();
        this.positivePayForm.controls.password.clearValidators();
        this.positivePayForm.controls.ssh.clearValidators();
        this.positivePayForm.controls.email.addValidators(Validators.required);
      } else {
        this.positivePayForm.controls.host.setValidators(Validators.required);
        this.positivePayForm.controls.port.setValidators(Validators.required);
        this.positivePayForm.controls.userName.setValidators(
          Validators.required
        );
        this.positivePayForm.controls.email.clearValidators();
        if (String(this.positivePayForm.controls.logonType.value) === '1') {
          this.positivePayForm.controls.password.setValidators(
            Validators.required
          );
        } else {
          this.positivePayForm.controls.ssh.setValidators(Validators.required);
        }
      }

      controls.forEach((control) => {
        control.updateValueAndValidity();
      });
    });

    this.positivePayForm.controls.logonType.valueChanges.subscribe((val) => {
      if (String(val) === '1' && String(this.positivePayForm.controls.driver.value) !== '3') {
        this.positivePayForm.controls.ssh.clearValidators();
        this.positivePayForm.controls.password.addValidators(
          Validators.required
        );
      } else if (String(val) === '2' && String(this.positivePayForm.controls.driver.value) !== '3') {
        this.positivePayForm.controls.password.clearValidators();
        this.positivePayForm.controls.ssh.addValidators(Validators.required);
      }
      this.positivePayForm.controls.password.updateValueAndValidity();
      this.positivePayForm.controls.ssh.updateValueAndValidity();
    });
  }

  fromBody() {
    const data = this.positivePayForm.value;
    let { userName } = data;
    if (data.driver === '3') {
      userName = data.email;
    }
    return {
      driver: data.driver,
      host: data.host,
      port: data.port,
      userName,
      credentialType: data.logonType,
      fileType: Number(data.fileType),
      scheduleTime: (data.timeToUpload as string).substring(0, 5),
      ssh: data.ssh,
      password: data.password,
      routingNumber: this.injectData.bank_routing_number,
      ...(this.uploadTimesArray.length > 0 && {
        running_times: this.uploadTimesArray
      }),
      ...(this.additionalEmailsArray.length > 0 && {
        additional_emails: this.additionalEmailsArray.controls
          .map(control => control.value)
          .filter(email => email && email.trim())
      })
    };
  }

  onChange(authType: string) {
    if (authType === '1') {
      this.showPasswordField.set(true);
      this.showSshField.set(false);
    } else if (authType === '2') {
      this.showSshField.set(true);
      this.showPasswordField.set(false);
    }
  }

  submit() {
    this.positivePayForm.markAllAsTouched();

    if (this.positivePayForm.invalid) {
      return;
    }

    const payload = {
      routingNumber: this.injectData?.bank_routing_number,
      bankAccountIds: this.bankAccountIds
    };

    this.loading.set(true);
    this.subscriptions.push(
      forkJoin([
        this.positivePayService.setPositivePay(this.fromBody()),
        this.positivePayService.setPositivePayBankAccounts(payload)
      ])
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe(([res1, res2]) => {
          if (res1.success && res2.success) {
            this.localStorageService.setItem(
              'timezone',
              this.positivePayForm.controls?.time_zone?.value
            );
            this.dialogRef.close({ success: true });

            const data = {
              content: res1.message,
              close: true,
              timeout: 1500
            };

            this.alertService.successAlert(data);
          }
        })
    );
  }

  /**
   * Loads SSH keys and saved FTP settings in one step.
   * Both are needed so we can match `key_id` from the server to a row in `sshList` for the dropdown.
   */
  private loadSshListAndFtpSettings(): void {
    this.fetchData.set(true);
    this.subscriptions.push(
      forkJoin({
        sshRes: this.positivePayService.getUserSsh(),
        ftpRes: this.positivePayService.getFtpSettings(
          this.injectData.bank_routing_number
        )
      })
        .pipe(finalize(() => this.fetchData.set(false)))
        .subscribe(({ sshRes, ftpRes }) => {
          this.sshList = sshRes?.data ?? [];
          if (ftpRes?.success && ftpRes.data) {
            this.applyFtpSettingsToForm(ftpRes.data);
            this.syncSshDropdownToSavedKey(ftpRes.data.key_id);
          }
        })
    );
  }

  private applyFtpSettingsToForm(response: FtpSettings): void {
    if (response?.running_times?.length > 0) {
      this.showScheduleTime.set(true);
      this.uploadTimesArray = response.running_times;
    }
    if (response?.ftp_driver) {
      const isEmailDriver = String(response.ftp_driver) === '3';
      this.positivePayForm.patchValue({
        driver: response.ftp_driver,
        host: response?.ftp_host,
        port: response?.port,
        userName: response?.ftp_username,
        email: isEmailDriver ? response?.ftp_username : '',
        fileType: response?.file_type ?? null,
        timeToUpload: response?.schedule_time,
        password: response?.ftp_password,
        ssh: response?.key_id ?? null,
        logonType: response?.credential_type ?? '1',
        running_times: response?.running_times
      });
      if (!isEmailDriver) {
        this.onChange(
          String(this.positivePayForm.controls.logonType.value ?? '1')
        );
      }
    }
    if (response?.additional_emails?.length > 0) {
      this.showMoreEmails = true;
      this.additionalEmailsArray.clear();
      response.additional_emails.forEach((email: string[]) => {
        this.additionalEmailsArray.push(
          new FormControl(email[0], [Validators.required, Validators.email])
        );
      });
    }
  }

  /** Sets the SSH dropdown to the key returned by the server (list must already be loaded). */
  private syncSshDropdownToSavedKey(keyId: string | null | undefined): void {
    if (keyId == null || keyId === '') {
      return;
    }
    const found = this.sshList.find(
      (item) => String(item.id) === String(keyId)
    );
    if (!found) {
      return;
    }
    const json = JSON.stringify(found);
    this.sshItem = json;
    this.onChangeSsh(json);
  }

  getSetupMethod(){
    this.isLoadingFileTypes.set(true);
    this.subscriptions.push(
      this.positivePayService.getMethods(this.injectData?.bank_routing_number)
      .pipe(finalize(() => this.isLoadingFileTypes.set(false)))
      .subscribe((res) => {
        if(res.success){
          if(res.data.setupMethods !== null){
            this.driverOptions = res.data.setupMethods;
          }
          if(res.data.fileTypes !== null){
            this.fileTypes = res.data.fileTypes;          
          }
        }
      })
    );
  }

  /**
   * @description Method to get the time zone.
   */
  getTimezone() {
    this.subscriptions.push(
      this.userService.getTimeZone().subscribe((res) => {
        if (res.success) {
          this.timeZoneList = res.data;
        }
      })
    );
  }

  extraTimesToUpload(): void {
    this.showScheduleTime.set(!this.showScheduleTime());
    if (!this.showScheduleTime()) {
      this.uploadTimesArray = [];
    }
  }

  selectDate(ev: Event, index: number): void {
    const inputElement = ev.target as HTMLInputElement;
    this.uploadTimesArray[index] = inputElement?.value;
  }

  toggleMoreEmails(): void {
    if (!this.showMoreEmails) {
      // Clear all email fields when unchecking
      while (this.additionalEmailsArray.length > 0) {
        this.additionalEmailsArray.removeAt(0);
      }
    } else {
      // Add first email field when checking
      this.addEmailField();
    }
  }

  addEmailField(): void {
    if (this.additionalEmailsArray.length >= 5) {
      return;
    }
    const emailControl = new FormControl('', [
      Validators.required,
      Validators.email
    ]);
    this.additionalEmailsArray.push(emailControl);
  }

  removeEmailField(index: number): void {
    this.additionalEmailsArray.removeAt(index);
    // If no email fields left, uncheck the checkbox
    if (this.additionalEmailsArray.length === 0) {
      this.showMoreEmails = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
