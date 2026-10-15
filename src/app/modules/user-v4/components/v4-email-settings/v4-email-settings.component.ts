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
import { Router } from '@angular/router';
import { Subject, finalize, takeUntil } from 'rxjs';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { UserService } from 'src/app/shared/service/user/user.service';
import {
  MatRadioChange,
  MatRadioGroup,
  MatRadioButton
} from '@angular/material/radio';

import { NgClass, AsyncPipe } from '@angular/common';
import { NonNullableFormValue } from 'src/app/models/api';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import {
  LucideAngularModule,
  Save,
  Loader,
  SquarePen,
  Trash2
} from 'lucide-angular';
import {
  ISmtpSettings,
  IUserEmailURL,
  IUserTemplateData
} from '../../../user/model/user';

type IV4UserEmailURL = IUserEmailURL & { letVendorDecide?: string };

@Component({
  selector: 'app-v4-email-settings',
  templateUrl: './v4-email-settings.component.html',
  styleUrls: ['./v4-email-settings.component.scss'],
  standalone: true,
  imports: [
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent,
    MatRadioGroup,
    MatRadioButton,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    V4ControlMessageComponent,
    AsyncPipe,
    LucideAngularModule
  ]
})
export class V4EmailSettingsComponent implements OnDestroy {
  public userService = inject(UserService);
  private alertService = inject(V4AlertService);
  public appSettings = inject(AppSettingsService);
  private router = inject(Router);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  readonly SaveIcon = Save;
  readonly LoaderIcon = Loader;
  readonly EditIcon = SquarePen;
  readonly TrashIcon = Trash2;

  @Input() templateData: IUserTemplateData;
  @Input() temUrl: IV4UserEmailURL;
  @Input() isTemplateLoading = false;
  @Output() refresh = new EventEmitter();

  readonly templateSkeletons = [0, 1, 2, 3, 4];

  get hasLetVendorDecideTemplate(): boolean {
    return !!this.temUrl?.letVendorDecide;
  }

  isLoad = false;
  editOrCreateServer = false;
  mode = 'A';
  isAddLoad = false;
  selctedId: string;
  selectedIndex: number;
  btnDisable = false;
  encryptionTypes = [
    { value: 'ssl', name: 'SSL' },
    { value: 'tls', name: 'TLS' }
  ];
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

  getString(val: number) {
    return String(val);
  }

  changeOption(env: MatRadioChange, num: number) {
    if (num === 1) {
      this.templateData.QueueEnable = env.value;
    } else if (num === 2) {
      this.templateData.SMTPEnable = env.value;
    } else {
      this.templateData.selectedSMTPid = env.value;
    }
  }

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

  openTemp(type: string) {
    if (this.templateData?.isTemplate) {
      this.alertService
        .infoAlert({
          content:
            'Please contact our customer support to enable this feature.',
          isOk: true,
          isCancel: true,
          doneMsg: 'Contact Now',
          cancelMsg: 'Not Now'
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            this.openSupportChat();
          }
        });
      return;
    }
    // returnUrl tells the template editor's back button to come back to the V4
    // settings page instead of falling back to the V3 one.
    const returnUrl = encodeURIComponent(this.router.url);
    window.open(`/v4/emailTemplate/mail_design/${type}?returnUrl=${returnUrl}`);
  }

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

  successAlert() {
    this.alertService.successAlert({
      title: 'Success',
      content: 'SMTP settings are valid!',
      close: true,
      timeout: 2000
    });
  }

  openSupportChat() {
    this.dynamicWhiteLabelService.goToLiveChat();
  }

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
