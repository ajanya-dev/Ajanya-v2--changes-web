import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { UserService } from 'src/app/shared/service/user/user.service';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { LucideAngularModule, Save, Loader } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

import { IGeneralSettings, ITimeZone } from '../../../user/model/user';
import { IGeneralSettingsForm } from './v4-general-settings.model';
import { currencyFormats } from './v4-general-settings.data';

@Component({
  selector: 'app-v4-general-settings',
  templateUrl: './v4-general-settings.component.html',
  styleUrls: ['./v4-general-settings.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    V4CommonDropDownSelectorComponent,
    V4ControlMessageComponent,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4GeneralSettingsComponent implements OnInit, OnDestroy {
  public userService = inject(UserService);
  private alertService = inject(V4AlertService);
  private formBuilder = inject(FormBuilder);
  generalSettingsForm: FormGroup;

  destroy$ = new Subject<boolean>();

  isShowAll = false;
  generalSettingsFormData: IGeneralSettingsForm;

  readonly SaveIcon = Save;
  readonly LoaderIcon = Loader;

  timeZoneLoading = signal(false);
  loading = signal(false);

  timeZone: ITimeZone[];
  currencyFormat = currencyFormats;
  serialNumberFormatting = [
    { name: 'Exact Number (eg. 1234)', value: 1 },
    { name: 'Extended Number (eg. 100.00)', value: 2 }
  ];

  amountFormat = [
    { name: 'Exact Number(eg. 100.00)', value: 1 },
    { name: 'Extended Number(eg. *******1234*)', value: 2 },
    { name: 'Extended Number(eg. **1234**)', value: 3 },
    { name: 'Extended Number(eg. 1234*)', value: 4 },
    { name: 'Extended Number(eg. **1234)', value: 5 },
    { name: 'Extended Number(eg. *1234*)', value: 6 }
  ];

  payeeFormat = [
    { name: 'Exact Name (eg. abc inc.)', value: 1 },
    { name: 'Extended Name (eg. abc inc.************)', value: 2 }
  ];

  amountWordingFormat = [
    { name: 'With No * (eg. Twenty-Five 10/100)', value: 1 },
    { name: 'Extended Number(eg. Twenty-Five and 10/100*****)', value: 2 },
    {
      name: 'With full line(eg. Twenty-Five 10/100***************************************)',
      value: 3
    },
    { name: '******Twenty-Five 10/100', value: 4 },
    { name: 'Twenty-Five Dollars and 10/100*****', value: 6 }
  ];

  dateFormate = [
    { name: 'mm/dd/yyyy', value: 1 },
    { name: 'yyyy/mm/dd', value: 2 },
    { name: 'dd/mm/yyyy', value: 3 },
    { name: 'yyyy-mm-dd', value: 5 },
    { name: 'mm-dd-yyyy', value: 6 },
    { name: 'dd-mm-yyyy', value: 7 },
    { name: 'eg. January 01,Year', value: 4 }
  ];

  languages = [
    { name: 'English', value: 'en' },
    { name: 'French', value: 'fr' }
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.getTimezone();
  }

  initializeForm(): void {
    this.generalSettingsForm = this.formBuilder.group({
      systemTimezone: ['', [Validators.required]],
      serialFormatting: ['', [Validators.required]],
      amountFormatting: ['', [Validators.required]],
      payeeFormatting: ['', [Validators.required]],
      amountWordingFormatting: ['', [Validators.required]],
      systemDateFormat: ['', [Validators.required]],
      userCurrency: ['', [Validators.required]],
      userLanguage: ['', [Validators.required]]
    });
  }

  getTimezone() {
    this.timeZoneLoading.set(true);
    this.userService
      .getTimeZone()
      .pipe(
        finalize(() => {
          this.timeZoneLoading.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.getGeneralSettings();
          this.timeZone = res.data;
        }
      });
  }

  getGeneralSettings() {
    this.userService
      .getGeneralSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.patchValue(res.data);
        }
      });
  }

  patchValue({
    systemTimezone,
    serialFormatting,
    amountFormatting,
    payeeFormatting,
    amountWordingFormatting,
    systemDateFormat,
    userCurrency,
    userLanguage
  }: IGeneralSettings) {
    this.generalSettingsForm.patchValue({
      systemTimezone: this.findValue(this.timeZone, systemTimezone),
      serialFormatting: this.findValue(
        this.serialNumberFormatting,
        serialFormatting
      ),
      amountFormatting: this.findValue(this.amountFormat, amountFormatting),
      payeeFormatting: this.findValue(this.payeeFormat, payeeFormatting),
      amountWordingFormatting: this.findValue(
        this.amountWordingFormat,
        amountWordingFormatting
      ),
      systemDateFormat: this.findValue(this.dateFormate, systemDateFormat),
      userCurrency: this.findValue(this.currencyFormat, userCurrency),
      userLanguage: this.findValue(this.languages, userLanguage)
    });
  }

  findValue(
    source: { name: string; value: string | number }[],
    term: string | number
  ): string {
    // eslint-disable-next-line eqeqeq
    return JSON.stringify(source.find((el) => el.value == term));
  }

  updateGeneralSettings() {
    this.generalSettingsForm.markAllAsTouched();

    if (this.generalSettingsForm.invalid) {
      return;
    }

    const formValues = this.generalSettingsForm.value;
    const data: IGeneralSettingsForm = {
      serialFormatting: this.parseString(formValues.serialFormatting),
      systemTimezone: this.parseString(formValues.systemTimezone),
      payeeFormatting: this.parseString(formValues.payeeFormatting),
      amountFormatting: this.parseString(formValues.amountFormatting),
      amountWordingFormatting: this.parseString(
        formValues.amountWordingFormatting
      ),
      userCurrency: this.parseString(formValues.userCurrency),
      systemDateFormat: this.parseString(formValues.systemDateFormat),
      userLanguage: this.parseString(formValues.userLanguage)
    };

    if (JSON.stringify(this.generalSettingsFormData) === JSON.stringify(data)) {
      return;
    }

    this.loading.set(true);
    this.userService
      .updateGeneralSettings(data)
      .pipe(
        finalize(() => {
          this.loading.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.loading.set(false);
          this.generalSettingsFormData = data;
          this.alertService.successAlert({
            title: 'Success',
            content: 'Updated',
            close: true
          });
        }
      });
  }

  parseString(val: string): string {
    try {
      const obj = JSON.parse(val);
      if (
        typeof obj === 'object' &&
        !Array.isArray(obj) &&
        obj !== null &&
        obj.value
      ) {
        return `${obj.value}`;
      }
      return '';
    } catch {
      return '';
    }
  }

  getFormControl(controlName: string) {
    return this.generalSettingsForm.get(controlName);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
