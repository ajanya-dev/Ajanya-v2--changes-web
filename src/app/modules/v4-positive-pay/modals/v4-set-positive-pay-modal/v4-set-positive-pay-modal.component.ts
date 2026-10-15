import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { MatTooltip } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LucideAngularModule, X, Info, Trash2, Plus } from 'lucide-angular';

import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { UserService } from 'src/app/shared/service/user/user.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { BankMultiSelectDropdownV4Component } from 'src/app/shared/components/v4/dropdowns/bank-multi-select-dropdown-v4/bank-multi-select-dropdown-v4.component';
import { IBankDropdown } from 'src/app/models/bank';
import { ITimeZone } from 'src/app/modules/user/model/user';
import { IExportModalData } from '../../../positive-pay/model/postive-pay';
import { V4GenerateSshModalComponent } from '../v4-generate-ssh-modal/v4-generate-ssh-modal.component';
import { V4SettingsModalComponent } from '../v4-settings-modal/v4-settings-modal.component';

@Component({
  selector: 'app-v4-set-positive-pay-modal',
  templateUrl: './v4-set-positive-pay-modal.component.html',
  styleUrls: ['./v4-set-positive-pay-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    MatTooltip,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    V4CommonDropDownSelectorComponent,
    BankMultiSelectDropdownV4Component
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4SetPositivePayModalComponent implements OnInit {
  private userService = inject(UserService);
  private localStorageService = inject(LocalStorageService);
  private positivePayService = inject(PositivePayService);
  private alertService = inject(V4AlertService);
  private bankService = inject(BankAccountsService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<V4SetPositivePayModalComponent>);
  private destroyRef = inject(DestroyRef);
  public injectData: IExportModalData = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;
  readonly InfoIcon = Info;
  readonly Trash2Icon = Trash2;
  readonly PlusIcon = Plus;

  bankAccounts = signal<IBankDropdown[]>([]);
  allBankAccounts = signal<IBankDropdown[]>([]);
  totalBankAccountsCount: number;
  bankAccountIds: string[] = [];
  timeZoneList: ITimeZone[];
  uploadTimesArray: string[] = [];
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

  driverOptions: { [key: string]: string } = {
    1: 'FTP',
    2: 'SFTP',
    3: 'Email'
  };

  fileTypes: { [key: string]: string } = { 1: 'TXT', 2: 'CSV', 3: 'EXCEL' };

  readonly logonTypeOptions = [
    { label: 'Password', value: '1' },
    { label: 'SSH', value: '2' }
  ];

  get driverOptionsList() {
    return Object.entries(this.driverOptions).map(([key, value]) => ({
      label: value,
      value: key
    }));
  }

  get fileTypesList() {
    return Object.entries(this.fileTypes).map(([key, value]) => ({
      label: value,
      value: key
    }));
  }

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
    this.getUserSSh();
    this.getTimezone();
    this.getSetupMethod();
    this.getFtpSettings();
    const savedTimezone =
      this.localStorageService.getItem('timezone') || 'America/Chicago';
    this.positivePayForm.patchValue({ time_zone: savedTimezone });
  }

  loadBankAccounts(): void {
    this.positivePayService
      .getPositivePayBankAccounts(this.injectData.bank_routing_number)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          this.bankAccounts.set(res?.data?.bankAccounts ?? []);
          this.totalBankAccountsCount = res?.data?.totalAccounts;
          if (this.bankAccounts().length === this.totalBankAccountsCount) {
            this.isSelectAll = true;
          }
          this.getAllBankAccounts();
        }
      });
  }

  getAllBankAccounts(): void {
    this.bankService
      .getBankAccountsPerPage(
        this.totalBankAccountsCount,
        this.injectData.bank_routing_number
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.allBankAccounts.set(res?.data ?? []);
      });
  }

  selectAll(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target?.checked) {
      const current = [...this.bankAccounts()];
      this.allBankAccounts().forEach((res) => {
        if (!this.bankAccountIds?.includes(res?.id)) {
          current.push(res);
        }
      });
      this.bankAccounts.set(current);
      this.isChecked.set(true);
    } else {
      this.bankAccounts.set([]);
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

  getUserSSh() {
    this.positivePayService
      .getUserSsh()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.sshList = res.data;
        const foundSsh = this.sshList.find(
          (item) => item.nickName === this.newSsh
        );
        if (foundSsh) {
          const newValue = JSON.stringify(foundSsh);
          this.sshItem = newValue;
          this.onChangeSsh(this.sshItem);
        }
      });
  }

  AddNewSSH() {
    this.dialog
      .open(V4GenerateSshModalComponent, {
        maxWidth: '510px',
        width: '100%',
        disableClose: true,
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded'
      })
      .afterClosed()
      .subscribe((res) => {
        if (res?.success) {
          this.newSsh = res.name;
          this.getUserSSh();
        }
      });
  }

  openSettingModal() {
    this.dialog.open(V4SettingsModalComponent, {
      maxWidth: '510px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal-rounded',
      data: this.injectData
    });
  }

  observeFormChanges() {
    const controls = [
      this.positivePayForm.controls.host,
      this.positivePayForm.controls.port,
      this.positivePayForm.controls.userName,
      this.positivePayForm.controls.email,
      this.positivePayForm.controls.password,
      this.positivePayForm.controls.ssh
    ];

    this.positivePayForm.controls.driver.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (String(val) === '3') {
          this.positivePayForm.controls.host.clearValidators();
          this.positivePayForm.controls.port.clearValidators();
          this.positivePayForm.controls.userName.clearValidators();
          this.positivePayForm.controls.password.clearValidators();
          this.positivePayForm.controls.ssh.clearValidators();
          this.positivePayForm.controls.email.addValidators(
            Validators.required
          );
        } else {
          this.positivePayForm.controls.host.setValidators(Validators.required);
          this.positivePayForm.controls.port.setValidators(Validators.required);
          this.positivePayForm.controls.userName.setValidators(
            Validators.required
          );
          this.positivePayForm.controls.email.clearValidators();
          if (this.positivePayForm.controls.logonType.value === '1') {
            this.positivePayForm.controls.password.setValidators(
              Validators.required
            );
          } else {
            this.positivePayForm.controls.ssh.setValidators(
              Validators.required
            );
          }
        }
        controls.forEach((control) => control.updateValueAndValidity());
      });

    this.positivePayForm.controls.logonType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.onChange(val ?? '1');
        if (val === '1') {
          this.positivePayForm.controls.ssh.clearValidators();
          this.positivePayForm.controls.password.addValidators(
            Validators.required
          );
        } else {
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
          .map((control) => control.value)
          .filter((email) => email && email.trim())
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
    forkJoin([
      this.positivePayService.setPositivePay(this.fromBody()),
      this.positivePayService.setPositivePayBankAccounts(payload)
    ])
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(([res1, res2]) => {
        if (res1.success && res2.success) {
          this.localStorageService.setItem(
            'timezone',
            this.positivePayForm.controls.time_zone.value
          );
          this.dialogRef.close({ success: true });
          this.alertService.successAlert({
            content: res1.message,
            close: true
          });
        }
      });
  }

  getFtpSettings(): void {
    this.fetchData.set(true);
    this.positivePayService
      .getFtpSettings(this.injectData?.bank_routing_number)
      .pipe(
        finalize(() => this.fetchData.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            const response = res.data;
            if (response?.running_times?.length > 0) {
              this.showScheduleTime.set(true);
              this.uploadTimesArray = res.data?.running_times;
            }
            if (response?.ftp_driver) {
              this.positivePayForm.patchValue({
                driver: String(response.ftp_driver),
                host: response?.ftp_host,
                port: response?.port,
                userName: response?.ftp_username,
                fileType:
                  response?.file_type != null
                    ? String(response.file_type)
                    : null,
                timeToUpload: response?.schedule_time,
                password: response?.ftp_password,
                ssh: null,
                running_times: response?.running_times
              });
            }
            if (response?.additional_emails?.length > 0) {
              this.showMoreEmails = true;
              this.additionalEmailsArray.clear();
              response.additional_emails.forEach((email: string[]) => {
                this.additionalEmailsArray.push(
                  new FormControl(email[0], [
                    Validators.required,
                    Validators.email
                  ])
                );
              });
            }
          }
        }
      });
  }

  getSetupMethod() {
    this.isLoadingFileTypes.set(true);
    this.positivePayService
      .getMethods(this.injectData?.bank_routing_number)
      .pipe(
        finalize(() => this.isLoadingFileTypes.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          if (res.data.setupMethods !== null) {
            this.driverOptions = res.data.setupMethods;
          }
          if (res.data.fileTypes !== null) {
            this.fileTypes = res.data.fileTypes;
          }
        }
      });
  }

  getTimezone() {
    this.userService
      .getTimeZone()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          this.timeZoneList = res.data;
        }
      });
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
      while (this.additionalEmailsArray.length > 0) {
        this.additionalEmailsArray.removeAt(0);
      }
    } else {
      this.addEmailField();
    }
  }

  addEmailField(): void {
    if (this.additionalEmailsArray.length >= 5) {
      return;
    }
    this.additionalEmailsArray.push(
      new FormControl('', [Validators.required, Validators.email])
    );
  }

  removeEmailField(index: number): void {
    this.additionalEmailsArray.removeAt(index);
    if (this.additionalEmailsArray.length === 0) {
      this.showMoreEmails = false;
    }
  }
}
