import { NgOptimizedImage } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  Validators,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormBuilder
} from '@angular/forms';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import {
  faXmark,
  faCircleInfo,
  faCalendar,
  faMessageQuestion
} from '@fortawesome/pro-regular-svg-icons';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { finalize, take } from 'rxjs';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { faPhoneVolume } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-request-integration-modal',
  standalone: true,
  imports: [
    FaIconComponent,
    CommonButtonV35Component,
    MatDialogClose,
    ReactiveFormsModule,
    NgOptimizedImage,
    V35ControlMessageComponent,
    NewPhoneInputComponent
  ],
  templateUrl: './request-integration-modal.component.html',
  styleUrl: './request-integration-modal.component.scss'
})
export class RequestIntegrationModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<RequestIntegrationModalComponent>);
  private subscriptionService = inject(SubscriptionService);
  private localStorageService = inject(LocalStorageService);
  private data = inject(MAT_DIALOG_DATA);

  type = signal<string>('');
  currentCountryCode = '';
  currenCountryPhoneLength = {} as { min: number; max: number };

  minDate = new Date().toISOString().split('T')[0];
  faXmark = faXmark;
  faCircleQuestion = faMessageQuestion;
  faCircleInfo = faCircleInfo;
  faCalendar = faCalendar;
  faPhoneVolume = faPhoneVolume;
  loading = false;

  integrationForm: FormGroup<{
    appName: FormControl<string | null>;
    phoneNumber: FormControl<string | null>;
    requirements: FormControl<string | null>;
    desiredStartDate: FormControl<string | null>;
  }>;

  ngOnInit(): void {
    if (this.data?.type) {
      this.type.set(this.data.type);
    }
    this.initForm();
  }

  initForm(): void {
    this.integrationForm = this.fb.group({
      appName: [this.data?.appName ?? ''],
      phoneNumber: [this.localStorageService.getItem('phone') ?? null],
      requirements: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      desiredStartDate: ['', Validators.required]
    });
    if (this.type() === 'call-back') {
      this.integrationForm.get('appName')?.addValidators([Validators.required]);
      this.integrationForm.get('phoneNumber')?.addValidators([Validators.required]);
      this.integrationForm.get('appName')?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    this.integrationForm.markAllAsTouched();
    if (this.integrationForm.valid) {
      const formData: { appName: string; phoneNumber: string; requirements: string; desiredStartDate: string } = {
        appName: this.integrationForm.value.appName || '',
        phoneNumber: this.integrationForm.value.phoneNumber || '',
        requirements: this.integrationForm.value.requirements || '',
        desiredStartDate: this.integrationForm.value.desiredStartDate || ''
      };
      this.talkToSales(this.type() === 'call-back' ? formData.appName : this.data.requestedId, formData);
    }
  }

  talkToSales(
    requestedId: string,
    data: { appName: string; phoneNumber: string; requirements: string; desiredStartDate: string }
  ) {
    const payload = {
      type: 2,
      app_name: requestedId,
      phone: data.phoneNumber,
      note: data.requirements,
      feature_desired_date: data.desiredStartDate
    };

    this.loading = true;
    this.subscriptionService
      .talkToSales(payload, false)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        take(1)
      )
      .subscribe((res) => {
        if (res.success) {
          this.dialogRef.close({ success: true });
        } else {
          this.dialogRef.close({ success: false });
        }
      });
  }

  /**
   * @description  Handles changes to the country code selection.
   * @param event - An object containing information about the selected country code.
   */
  countryChange(event: { length: { min: number; max: number }; code: string }) {
    this.currentCountryCode = event.code;
    this.currenCountryPhoneLength = event.length;
    this.integrationForm.controls.phoneNumber.setValidators([
      Validators.required,
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.integrationForm.controls.phoneNumber.updateValueAndValidity();
  }

  /**
   * @description Handles changes to the country code selection
   * @param event An object containing information about the selected country code.
   */
  countryCodeChange(event: { code: string; updateLocalStorage: boolean }) {
    this.currentCountryCode = event.code;
  }

  onCancel(): void {
    this.dialogRef.close({ success: false });
  }
}
