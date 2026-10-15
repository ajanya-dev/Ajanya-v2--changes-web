import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { Subscription, finalize } from 'rxjs';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { SubscriptionService } from '../../service/subscription/subscription.service';
import { NewPhoneInputComponent } from '../../components/new-phone-input/new-phone-input.component';
import { CommonButtonV35Component } from '../buttons/common-button-v35/common-button-v35.component';
import { ValidationService } from '../../service/validation/validation.service';
import { LocalStorageService } from '../../service/storage/local-storage.service';
import { V35ControlMessageComponent } from '../control-message-v35/control-message-v35.component';

@Component({
  selector: 'app-common-call-me',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FontAwesomeModule,
    NewPhoneInputComponent,
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    V35ControlMessageComponent
  ],
  templateUrl: './common-call-me.component.html',
  styleUrl: './common-call-me.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommonCallMeComponent implements OnInit, OnDestroy {
  private subscriptionService = inject(SubscriptionService);
  private dialogRef = inject(MatDialogRef<CommonCallMeComponent>);
  private formBuilder = inject(FormBuilder);
  private localStorageService = inject(LocalStorageService);
  private changeDetector = inject(ChangeDetectorRef);
  private router = inject(Router);
  isOutside = false;

  faXmark = faXmark;
  subscription: Subscription[] = [];
  loading = false;
  supportNo = StaticWhiteLabelConditions.customerSupportNo;
  currentCountryCode = '';
  currenCountryPhoneLength = {} as { min: number; max: number };
  phoneNumber = this.localStorageService.getItem('phone') ?? null;

  callForm = this.formBuilder.group({
    phoneNumber: new FormControl<string>(this.phoneNumber, [
      Validators.required,
      ValidationService.customMinLength(
        this.currenCountryPhoneLength?.min ?? 10
      )
    ])
  });

  ngOnInit(): void {
    this.isOutside = !!this.router.url.includes('/outside/pricing-plan');
  }

  /**
   * @description  Handles changes to the country code selection.
   * @param event - An object containing information about the selected country code.
   */
  countryChange(event: { length: { min: number; max: number }; code: string }) {
    this.currentCountryCode = event.code;
    this.currenCountryPhoneLength = event.length;
    this.callForm.controls.phoneNumber.setValidators([
      Validators.required,
      ValidationService.customMinLength(event.length?.min ?? 10)
    ]);
    this.callForm.controls.phoneNumber.updateValueAndValidity();
    this.changeDetector.detectChanges();
  }

  /**
   * @description Handles changes to the country code selection
   * @param event An object containing information about the selected country code.
   */
  countryCodeChange(event: { code: string; updateLocalStorage: boolean }) {
    this.currentCountryCode = event.code;
  }

  /**
   * @description Submits the call form data
   */
  submit(): void {
    this.callForm.markAllAsTouched();
    if (this.callForm.invalid) return;
    this.loading = true;
    this.changeDetector.detectChanges();
    const payload = {
      phone: this.callForm.controls.phoneNumber.value as string
    };
    this.subscription.push(
      this.subscriptionService
        .talkToSales(payload, this.isOutside)
        .pipe(
          finalize(() => {
            this.loading = false;
            this.changeDetector.detectChanges();
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.dialogRef.close(true);
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
