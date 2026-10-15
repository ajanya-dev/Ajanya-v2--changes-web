import { GoogleAddressService } from '../../../../core/services/google-address.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { AffiliateProgramsService } from 'src/app/shared/service/affiliate-programs/affiliate-programs.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { NgIf, CurrencyPipe } from '@angular/common';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';

/**
 * Angular component representing the Redeem page.
 * @class
 */
@Component({
  selector: 'app-radeem',
  templateUrl: './radeem.component.html',
  styleUrls: ['./radeem.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgIf,
    CurrencyPipe
  ]
})
export class RadeemComponent implements OnInit, OnDestroy {
  radeemForm: UntypedFormGroup;
  subscriptions: Subscription[] = [];
  balance: string;
  btnDisable = false;

  utils = Utils;

  /**
   * Constructor to create an instance of RadeemComponent.
   * @constructor
   * @param {UntypedFormBuilder} fb - An instance of UntypedFormBuilder for building forms.
   * @param {AffiliateProgramsService} _affiliateService - The affiliate programs service.
   * @param {GoogleAddressService} _googleAddressService - The Google Address service.
   * @param {AlertService} alertService - The alert service for displaying messages.
   * @param {Router} router - The Angular router service.
   */
  constructor(
    private fb: UntypedFormBuilder,
    private _affiliateService: AffiliateProgramsService,
    private _googleAddressService: GoogleAddressService,
    private alertService: AlertService,
    private router: Router
  ) {}

  /**
   * Angular lifecycle hook called when the component is initialized.
   * Initializes the form and fetches user details.
   * @method
   */
  ngOnInit(): void {
    this.initForm();
    this.getDetails();
    this._googleAddressService.resetGoogleAutocompleteAPI();
  }

  /**
   * Initializes the redemption form using UntypedFormBuilder.
   * @method
   */
  initForm() {
    this.radeemForm = this.fb.group({
      name: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      email: ['', [Validators.required, ValidationService.emailValidator]],
      address1: ['', [Validators.required]],
      address2: [''],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zip: ['', [Validators.required]],
      amount: ['', [Validators.required]]
    });
  }

  /**
   * Constructs the body of the redemption request.
   * @method
   * @returns {object} - The redemption request body.
   */
  formBody() {
    const data = this.radeemForm.value;
    return {
      amount: data.amount,
      name: data.name,
      phone: data.phone,
      email: data.email,
      addressLine_1: data.address1,
      addressLine_2: data.address,
      city: data.city,
      state: data.state,
      zip: data.zip
    };
  }

  /**
   * Fetches user details, including balance and pre-fills the redemption form.
   * @method
   */
  getDetails() {
    this.subscriptions.push(
      this._affiliateService.getRedeemerDetails().subscribe((res) => {
        const data = res.data[0];
        if (res.success) {
          this.balance = data.availableBalance;
          this.radeemForm.patchValue({
            name: data.name,
            phone: data.phone,
            email: data.email,
            address1: data.addressLine1,
            address2: data.addressLine2,
            city: data.city,
            state: data.state,
            zip: data.zip
          });
        }
      })
    );
  }

  /**
   * Submits the redemption request form.
   * @method
   */
  onSubmit() {
    this.radeemForm.markAllAsTouched();
    if (this.radeemForm.invalid) {
      return;
    }
    this.btnDisable = true;
    this.subscriptions.push(
      this._affiliateService
        .requestWithdraw(this.formBody())
        .pipe(
          finalize(() => {
            this.btnDisable = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const data = {
              title: 'Success',
              content: 'Withdrawal Requested',
              close: true,
              timeout: 1500
            };
            this.alertService.successAlert(data);
            this.router.navigateByUrl('/manage/affiliate/index');
          }
        })
    );
  }

  /**
   * Allows only numeric input for the 'amount' field.
   * @method
   * @param {object} event - The keyboard event.
   * @returns {boolean} - True if the input is numeric, false otherwise.
   */
  numberOnly(event: { which: number; keyCode: number }): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57) && charCode != 46) {
      return false;
    }
    return true;
  }

  /**
   * Loads the Google Address API for auto-completing address details.
   * @method
   * @param {HTMLInputElement} address - The address input element.
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this._googleAddressService.googleAutocomplete({ addressElement: address });

    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
        this.radeemForm.patchValue({
          address1: res.address,
          city: res.city,
          state: res.state,
          zip: res.zip
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * Angular lifecycle hook called when the component is destroyed.
   * Unsubscribes from all active subscriptions to prevent memory leaks.
   * @method
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
