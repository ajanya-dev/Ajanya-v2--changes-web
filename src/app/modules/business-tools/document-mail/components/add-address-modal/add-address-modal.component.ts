import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { Subject, finalize, takeUntil } from 'rxjs';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { MatDialogRef, MatDialogClose } from '@angular/material/dialog';
import { Utils } from 'src/app/data/utils';
import { DocumentMailService } from '../../services/document-mail.service';
import { TDocumentMailAddAddress } from '../../models/document-mail.model';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';

type IAddressForm = Record<
  keyof TDocumentMailAddAddress,
  FormControl<string | null>
>;

@Component({
  selector: 'app-add-address-modal',
  templateUrl: './add-address-modal.component.html',
  styleUrls: ['./add-address-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent
  ]
})
export class AddAddressModalComponent implements OnInit, OnDestroy {
  private documentMailService = inject(DocumentMailService);
  private dialogRef = inject(MatDialogRef);
  private googleAddressService = inject(GoogleAddressService);

  addressForm: FormGroup<IAddressForm>;
  destroy$ = new Subject<boolean>();
  loading = false;
  utils = Utils;

  ngOnInit(): void {
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.initForm();
  }

  /**
   * Initializes the address form with form controls and validators.
   *
   * @memberof AddAddressModalComponent
   */
  initForm() {
    this.addressForm = new FormGroup<IAddressForm>({
      payee_name: new FormControl('', Validators.required),
      payee_email: new FormControl('', [ValidationService.emailValidator]),
      payee_phone: new FormControl('', [
        ValidationService.phoneNumberValidator
      ]),
      payee_city: new FormControl('', Validators.required),
      payee_state: new FormControl('', Validators.required),
      payee_company_name: new FormControl(''),
      payee_zip: new FormControl('', Validators.required),
      payee_country: new FormControl('', Validators.required),
      payee_address_line_1: new FormControl('', Validators.required),
      payee_address_line_2: new FormControl('')
    });
  }

  /**
   * Loads address details from the Google Autocomplete service based on the provided HTML input element.
   *
   * @param {HTMLInputElement} address - HTML input element for the address.
   * @memberof AddAddressModalComponent
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us', 'ca']
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.addressForm.patchValue({
          payee_address_line_1: res.address,
          payee_city: res.city,
          payee_state: res.state,
          payee_country: res.country,
          payee_zip: res.zip
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * Submits the address form. If the form is invalid, marks all controls as touched.
   * Calls the DocumentMailService to add a new from address and closes the dialog if successful.
   *
   * @memberof AddAddressModalComponent
   */
  submit() {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.documentMailService
      .addFromAddress(this.addressForm.value as TDocumentMailAddAddress)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((val) => {
        if (val.success) {
          this.dialogRef.close({ success: true , data : val.data});
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
