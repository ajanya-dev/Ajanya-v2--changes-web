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
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { LucideAngularModule, X } from 'lucide-angular';
import { finalize } from 'rxjs';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { SubscriptionService } from 'src/app/shared/service/subscription/subscription.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { PhoneInputV4Component } from 'src/app/shared/V4/v4-phone-input/v4-phone-input.component';

@Component({
  selector: 'app-v4-call-back-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    V4ControlMessageComponent,
    PhoneInputV4Component
  ],
  templateUrl: './v4-call-back-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4CallBackModalComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private dialogRef = inject(MatDialogRef<V4CallBackModalComponent>);
  private fb = inject(FormBuilder);
  private localStorageService = inject(LocalStorageService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private alertService = inject(V4AlertService);

  readonly closeIcon = X;
  loading = signal(false);
  isOutside = false;
  supportNo = StaticWhiteLabelConditions.customerSupportNo;
  currenCountryPhoneLength = {} as { min: number; max: number };

  callForm = this.fb.group({
    phoneNumber: new FormControl<string>(
      this.localStorageService.getItem('phone') ?? '',
      [
        Validators.required,
        ValidationService.customMinLength(
          this.currenCountryPhoneLength?.min ?? 10
        )
      ]
    )
  });

  ngOnInit(): void {
    this.isOutside = !!this.router.url.includes('/outside/pricing-plan');
  }

  countryChange(event: {
    length?: { min: number | undefined; max: number | undefined };
    code?: string;
  }): void {
    if (event.length) {
      this.currenCountryPhoneLength = {
        min: event.length.min ?? 10,
        max: event.length.max ?? 15
      };
      this.callForm.controls.phoneNumber.setValidators([
        Validators.required,
        ValidationService.customMinLength(event.length.min ?? 10)
      ]);
      this.callForm.controls.phoneNumber.updateValueAndValidity();
    }
  }

  submit(): void {
    this.callForm.markAllAsTouched();
    if (this.callForm.invalid) return;

    this.loading.set(true);
    const payload = {
      phone: this.callForm.controls.phoneNumber.value as string
    };

    this.subscriptionService
      .talkToSales(payload, this.isOutside, true)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dialogRef.close({ success: true });
          }
        },
        error: (err) => {
          const msg = err.error?.errorMsg || err.error?.message || 'Something went wrong';
          this.alertService.warningAlert({ content: msg });
        }
      });
  }
}
