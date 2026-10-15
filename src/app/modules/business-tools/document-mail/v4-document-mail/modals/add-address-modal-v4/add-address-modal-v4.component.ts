import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';

import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { Iv4ngSelectConfig } from 'src/app/shared/V4/v4-dropdown/models/v4-common-dropdown-selector.interface';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import { TDocumentMailAddAddress } from '../../../models/document-mail.model';
import { DocumentMailService } from '../../../services/document-mail.service';

type IAddressForm = Record<keyof TDocumentMailAddAddress, FormControl<string | null>>;

@Component({
  selector: 'app-add-address-modal-v4',
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    V4ControlMessageComponent,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    AddressAutocompleteV4Component,
    V4CommonDropDownSelectorComponent
  ],
  templateUrl: './add-address-modal-v4.component.html',
  styleUrl: './add-address-modal-v4.component.scss'
})
export class AddAddressModalV4Component implements OnInit {
  private documentMailService = inject(DocumentMailService);
  private dialogRef = inject(MatDialogRef);
  private destroyRef = inject(DestroyRef);

  addressForm!: FormGroup<IAddressForm>;
  loading = signal(false);

  sortedCountries = [
    { key: 'CA', value: 'Canada' },
    { key: 'US', value: 'United States' }
  ];

  countryDropdownConfig: Iv4ngSelectConfig = {
    placeholder: 'Country',
    displayField: 'value',
    outputField: 'value'
  };

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.addressForm = new FormGroup<IAddressForm>({
      payee_name: new FormControl('', Validators.required),
      payee_email: new FormControl('', [ValidationService.emailValidator]),
      payee_phone: new FormControl('', [ValidationService.phoneNumberValidator]),
      payee_city: new FormControl('', Validators.required),
      payee_state: new FormControl('', Validators.required),
      payee_company_name: new FormControl(''),
      payee_zip: new FormControl('', Validators.required),
      payee_country: new FormControl('', Validators.required),
      payee_address_line_1: new FormControl('', Validators.required),
      payee_address_line_2: new FormControl('')
    });
  }

  onAddressSelected(address: IGoogleAddress): void {
    this.addressForm.patchValue({
      payee_address_line_1: address.address ?? '',
      payee_city: address.city ?? '',
      payee_state: address.state ?? '',
      payee_country: address.country ?? '',
      payee_zip: address.zip ?? ''
    });
  }

  submit(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.documentMailService
      .addFromAddress(this.addressForm.value as TDocumentMailAddAddress)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((val) => {
        if (val.success) {
          this.dialogRef.close({ success: true, data: val.data });
        }
      });
  }
}
