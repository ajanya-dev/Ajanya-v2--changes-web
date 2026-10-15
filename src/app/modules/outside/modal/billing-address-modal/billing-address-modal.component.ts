import countryData from 'src/app/data/data/country-list-json/country-list-code.json';
import { NgClass } from '@angular/common';
import { Component, inject, OnDestroy, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogRef
} from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subject, takeUntil } from 'rxjs';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { ICountry } from 'src/app/shared/components/phone-input/phone-input.component';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';

@Component({
  selector: 'app-billing-address-modal',
  standalone: true,
  imports: [
    CommonButtonV35Component,
    FaIconComponent,
    MatDialogClose,
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    FormsModule,
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './billing-address-modal.component.html',
  styleUrl: './billing-address-modal.component.scss'
})
export class BillingAddressModalComponent implements OnDestroy {
  private injectData = inject<string>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef);
  private outsideService = inject(OutsideService);
  private googleAddressService = inject(GoogleAddressService);

  isSubmit = signal(false);
  destroy$ = new Subject();
  countryList: ICountry[] = countryData;
  faXmark = faXmark;

  addressForm = new FormGroup({
    line1: new FormControl('', Validators.required),
    line2: new FormControl(''),
    city: new FormControl('', Validators.required),
    state: new FormControl('', Validators.required),
    postal_code: new FormControl('', Validators.required),
    country: new FormControl('', Validators.required)
  });

  onSubmit() {
    this.addressForm.markAllAsTouched();
    if (this.addressForm.invalid) return;

    this.isSubmit.set(true);
    this.outsideService
      .updateBillingAddress(this.injectData, {
        billing_address: this.addressForm.value
      })
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dialogRef.close({ address: this.addressForm.value });
          }
        }
      });
  }

  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: undefined,
      displayShortName: true
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.addressForm.patchValue({
          line1: res.address,
          city: res.city,
          state: res.state,
          postal_code: res.zip,
          country: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
