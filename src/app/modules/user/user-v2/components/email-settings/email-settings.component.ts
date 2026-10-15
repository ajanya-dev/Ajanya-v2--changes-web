import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  inject
} from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl
} from '@angular/forms';
import { Subject, finalize, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { UserService } from 'src/app/shared/service/user/user.service';
import {
  MatRadioChange,
  MatRadioGroup,
  MatRadioButton
} from '@angular/material/radio';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, AsyncPipe } from '@angular/common';
import { NonNullableFormValue } from 'src/app/models/api';
import {
  ISmtpSettings,
  IUserEmailURL,
  IUserTemplateData
} from '../../../model/user';
import { V35ControlMessageComponent } from '../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';

/**
 * @description Component for email settings in application settings.
 */
@Component({
  selector: 'app-email-settings',
  templateUrl: './email-settings.component.html',
  styleUrls: ['./email-settings.component.scss'],
  standalone: true,
  imports: [
    CommonButtonV35Component,
    MatRadioGroup,
    MatRadioButton,
    NgClass,
    FaIconComponent,
    FormsModule,
    ReactiveFormsModule,
    V35ControlMessageComponent,
    AsyncPipe
  ]
})
export class EmailSettingsComponent implements OnDestroy {
  private commonService = inject(CommonOnInitService);
  public userService = inject(UserService);
  private alertService = inject(AlertService);
  public appSettings = inject(AppSettingsService);

  @Input() templateData: IUserTemplateData;
  @Input() temUrl: IUserEmailURL;
  @Output() refresh = new EventEmitter();

  isLoad = false;
  editOrCreateServer = false;
  mode = 'A';
  isAddLoad = false;
  selctedId: string;
  selectedIndex: number;
  btnDisable = false;
  smtpSettings: ISmtpSettings[] = [];
  selectedSMTPid: string;

  destroy$ = new Subject<boolean>();

  smtpServerForm = new FormGroup({
    host: new FormControl('', Validators.required),
    port: new FormControl<number | null>(null, Validators.required),
    encryptionType: new FormControl('ssl'),
    fromAddress: new FormControl('', Validators.required),
    fromName: new FormControl('', Validators.required),
    replyToAddress: new FormControl('', Validators.required),
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required)
  });

  /**
   * @description Method to convert a value to string
   * @param val - value to be converted
   * @returns string
   */
  getString(val: number) {
    return String(val);
  }

  /**
   * @description Method to update selection values
   * @param env - event
   * @param num - number to identify selection element
   */
  changeOption(env: MatRadioChange, num: number) {
    if (num === 1) {
      this.templateData.QueueEnable = env.value;
    } else if (num === 2) {
      this.templateData.SMTPEnable = env.value;
    } else {
      this.templateData.selectedSMTPid = env.value;
    }
  }

  /**
   * @description Method create payload and update email settings.
   */
  updateEmailSettings() {
    this.isLoad = true;
    this.userService
      .updateEmailSettings({
        isQueueEnabled: this.getString(this.templateData.QueueEnable),
        defaultSmtp: this.templateData.selectedSMTPid,
        isSmtpEnabled: this.getString(this.templateData.SMTPEnable)
      })
      .pipe(
        finalize(() => {
          this.isLoad = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Email settings updated',
            close: true
          });
        }
      });
  }

  /**
   * @description Sets the clicked smtpSetting's isDefault property's value to 1.
   * @param i
   */
  clickToRow(i: number) {
    this.templateData.smtpSettings.forEach((element: ISmtpSettings) => {
      // eslint-disable-next-line no-param-reassign
      element.isDefault = 0;
    });
    this.templateData.smtpSettings[i].isDefault = 1;
    if (this.editOrCreateServer) {
      this.editOrCreateServer = false;
    }
  }

  /**
   * @description Creates or edits the server on the basis of selected mode
   * @param mode - 'A' to add; 'E' to edit
   * @param i - index
   * @param data - setting
   */
  openServerForm(mode: string, i?: number, datas?: ISmtpSettings) {
    this.selectedIndex = i as number;
    const data = datas as ISmtpSettings;
    this.mode = mode;
    if (mode === 'E') {
      this.templateData.smtpSettings[this.selectedIndex].isDefault = 1;
      this.editOrCreateServer = !this.editOrCreateServer;
      this.smtpServerForm.patchValue({
        host: data.host,
        port: data.port,
        encryptionType: data.encryptionType,
        fromAddress: data.fromAddress,
        fromName: data.fromName,
        replyToAddress: data.replyToAddress,
        username: data.username,
        password: data.password
      });
      this.selctedId = data.id;
    } else {
      this.editOrCreateServer = !this.editOrCreateServer;
      this.smtpServerForm.reset();
    }
  }

  /**
   * @description Test assigned SMTP settings and open success alert if succeeded.
   */
  testSMTPsettings() {
    this.smtpServerForm.markAllAsTouched();
    if (this.smtpServerForm.invalid) {
      return;
    }
    this.btnDisable = true;
    this.userService
      .testSmtpServer(this.smtpServerForm.value)
      .pipe(
        finalize(() => {
          this.btnDisable = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.successAlert();
        }
      });
  }

  /**
   * @description Opens a new tab for the selected template type.
   * @param type - template type
   */
  openTemp(type: string) {
    if (this.templateData?.isTemplate) {
      this.commonService.contactAlert();
      return;
    }
    window.open(`/emailTemplate/mail_design/${type}`);
  }

  /**
   * @description Method to add new SMTP server and open success alert message on success.
   */
  addNewSMTPserver() {
    this.smtpServerForm.markAllAsTouched();
    if (this.smtpServerForm.invalid) {
      return;
    }
    if (this.mode === 'E') {
      this.updateSMTPserver();
      return;
    }
    this.isAddLoad = true;
    const msg = {
      title: 'Success',
      content: 'SMTP server Added',
      close: true
    };
    this.userService
      .addSmtpServer(this.smtpServerForm.value)
      .pipe(
        finalize(() => {
          this.isAddLoad = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert(msg);
          this.getEmailSettings();
        }
      });
  }

  /**
   * @description Method to update the smtp server and open success alert on success.
   */
  updateSMTPserver() {
    this.isAddLoad = true;
    const msg = {
      title: 'Success',
      content: 'SMTP server updated',
      close: true
    };
    this.userService
      .updateSmtpServer(this.smtpServerForm.value, this.selctedId)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.isAddLoad = false;
          this.alertService.successAlert(msg);
          const value = <
            NonNullableFormValue<typeof this.smtpServerForm.value>
          >this.smtpServerForm.value;
          this.templateData.smtpSettings[this.selectedIndex] = {
            ...this.templateData.smtpSettings[this.selectedIndex],
            ...value
          };
        }
      });
  }

  /**
   * @description Opens confirmation window to delete the smtp server and invokes deleteSMTP method to delete the server, upon confirmation.
   */
  deleteSMTPserver(i: number, id: string) {
    const msg = {
      title: 'Alert!',
      content: 'Are you sure you want to delete?',
      doneMsg: 'Yes, Delete it!',
      cancelMsg: 'No, Cancel!'
    };
    const response = this.alertService.confirmAlert(msg);
    response.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteSMTP(i, id);
      }
    });
  }

  /**
   * @description Method to delete the smtp server.
   */
  deleteSMTP(i: number, id: string) {
    const msg = {
      title: 'Success',
      content: 'Deleted!',
      close: true
    };
    this.userService
      .deleteSMTPserver(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert(msg);
          this.templateData.smtpSettings.splice(i, 1);
          this.editOrCreateServer = false;
          if (this.templateData.smtpSettings.length > 0) {
            this.templateData.smtpSettings[0].isDefault = 1;
          }
        }
      });
  }

  /**
   * @description Shows success alert window.
   */
  successAlert() {
    this.alertService.successAlert({
      title: 'Success',
      content: 'SMTP settings are valid!',
      close: true,
      timeout: 2000
    });
  }

  /**
   * @description Opens a new tab for chatting with the support team.
   */
  openSupportChat() {
    if (StaticWhiteLabelConditions.zohoSupportChat)
      window.open(StaticWhiteLabelConditions.zohoSupportChat);
    else window.open(StaticWhiteLabelConditions.helpWebsite);
  }

  /**
   * @description Gets email settings
   */
  getEmailSettings() {
    this.userService
      .getEmailSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.smtpSettings.forEach((element) => {
            if (element.isDefault === 1) {
              this.selectedSMTPid = element.id;
            }
          });
          this.editOrCreateServer = false;
          this.templateData = {
            isTemplate: res.data.enableEmailTemplate !== '1',
            isSMTP: res.data.enableSmtp === '1',
            smtpSettings: res.data.smtpSettings,
            QueueEnable: res.data.isQueueEnabled,
            SMTPEnable: 1,
            selectedSMTPid: this.selectedSMTPid,
            url: res.data.URL,
            customerSupport: res.data?.customerSupportURL
          };
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
