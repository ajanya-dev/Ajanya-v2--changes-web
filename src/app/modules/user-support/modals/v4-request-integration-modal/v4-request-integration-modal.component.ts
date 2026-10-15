import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import {
  Validators,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormBuilder
} from '@angular/forms';
import { LucideAngularModule, X, PhoneIncoming, Info } from 'lucide-angular';
import { finalize } from 'rxjs';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';
import { V4DatePickerComponent } from 'src/app/shared/V4/v4-date-picker/v4-date-picker.component';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';

@Component({
  selector: 'app-v4-request-integration-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    MatDialogClose,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4ControlMessageComponent,
    PhoneInputV4Component,
    V4DatePickerComponent
  ],
  templateUrl: './v4-request-integration-modal.component.html',
  styleUrls: ['./v4-request-integration-modal.component.scss']
})
export class V4RequestIntegrationModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<V4RequestIntegrationModalComponent>);
  private subscriptionService = inject(SubscriptionService);
  private localStorageService = inject(LocalStorageService);
  private data = inject(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  readonly closeIcon = X;
  readonly phoneIcon = PhoneIncoming;
  readonly infoIcon = Info;

  type = signal<string>('');
  currentCountryCode = '';
  currenCountryPhoneLength = {} as { min: number; max: number };
  minDate = new Date().toISOString().split('T')[0];
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

  private initForm(): void {
    this.integrationForm = this.fb.group({
      appName: [this.data?.appName ?? ''],
      phoneNumber: [this.localStorageService.getItem('phone') ?? null],
      requirements: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(500)
        ]
      ],
      desiredStartDate: ['', Validators.required]
    });
    if (this.type() === 'call-back') {
      this.integrationForm.get('appName')?.addValidators([Validators.required]);
      this.integrationForm
        .get('phoneNumber')
        ?.addValidators([Validators.required]);
      this.integrationForm.get('appName')?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    this.integrationForm.markAllAsTouched();
    if (this.integrationForm.valid) {
      const formData = {
        appName: this.integrationForm.value.appName || '',
        phoneNumber: this.integrationForm.value.phoneNumber || '',
        requirements: this.integrationForm.value.requirements || '',
        desiredStartDate: this.integrationForm.value.desiredStartDate || ''
      };
      this.talkToSales(
        this.type() === 'call-back' ? formData.appName : this.data.requestedId,
        formData
      );
    }
  }

  private talkToSales(
    requestedId: string,
    data: {
      appName: string;
      phoneNumber: string;
      requirements: string;
      desiredStartDate: string;
    }
  ): void {
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
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.dialogRef.close({ success: res.success });
      });
  }

  countryChange(event: {
    length: { min: number; max: number };
    code: string;
  }): void {
    this.currentCountryCode = event.code;
    this.currenCountryPhoneLength = event.length;
    this.integrationForm.controls.phoneNumber.setValidators([
      Validators.required,
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.integrationForm.controls.phoneNumber.updateValueAndValidity();
  }

  countryCodeChange(event: {
    code: string;
    updateLocalStorage: boolean;
  }): void {
    this.currentCountryCode = event.code;
  }

  close(): void {
    this.dialogRef.close({ success: false });
  }
}
