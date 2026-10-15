import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import {
  AccuntNoValidator,
  ValidationService
} from 'src/app/shared/service/validation/validation.service';
import { IYodleeProfile, yodleeAccDetails } from 'src/app/models/yodlee';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';

/**
 * @description Component for filling bank account details through Yodlee.
 */
@Component({
  selector: 'app-account-details-form-modal',
  templateUrl: './account-details-form-modal.component.html',
  styleUrls: ['./account-details-form-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    FaIconComponent,
    CommonButtonV35Component
  ]
})
export class AccountDetailsFormModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private bankAccService = inject(BankAccountsService);
  public dialogRef = inject(MatDialogRef<AccountDetailsFormModalComponent>);
  private googleAddressService = inject(GoogleAddressService);
  public datas: yodleeAccDetails = inject(MAT_DIALOG_DATA);
  private alertService = inject(AlertService);

  bankForm: FormGroup;
  subscriptions: Subscription[] = [];
  accountData: yodleeAccDetails;
  showAllAddress = false;
  isShowAccountName = false;
  isShowAccountNickName = false;
  faXmark = faXmark;

  utils = Utils;

  ngOnInit(): void {
    this.initializeForm();
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.onCheckBankData();
  }

  /**
   * @description Used to check hide and show accountname and nickname field based on given data.
   */
  onCheckBankData() {
    if (this.datas.bankFormData.bankAccountName) {
      this.isShowAccountName = false;
    } else {
      this.isShowAccountName = true;
    }

    if (this.datas.bankFormData.bankAccountNickName) {
      this.isShowAccountNickName = false;
    } else {
      this.isShowAccountNickName = true;
    }
  }

  /**
   * @description Initializes bank form.
   */
  initializeForm() {
    this.accountData = this.datas;
    this.bankForm = this.fb.group({
      bankRoutingNumber: new UntypedFormControl('', [
        Validators.required,
        ValidationService.routingNumberValidator
      ]),
      bankAccountNumber: new UntypedFormControl('', [
        Validators.required,
        Validators.minLength(5),
        AccuntNoValidator(this.accountData.accountNo4Validation)
      ]),
      bankAccountName: new UntypedFormControl('', [Validators.required, ValidationService.personNameValidator]),
      bankAccountNickName: new UntypedFormControl('', [Validators.required]),
      bankAccountAddressLine1: new UntypedFormControl('', [
        Validators.required
      ]),
      bankAccountAddressLine2: new UntypedFormControl(''),
      bankAccountCity: new UntypedFormControl('', [Validators.required]),
      bankAccountState: new UntypedFormControl('', [Validators.required]),
      bankAccountCountry: new UntypedFormControl('', [Validators.required]),
      bankAccountZip: new UntypedFormControl('', [
        Validators.required,
        ValidationService.zipValidator
      ])
    });
    this.bankForm.setValue(this.accountData.bankFormData);
    if (this.accountData?.isVerificationRequired === 0) {
      this.bankForm?.controls?.bankAccountNumber?.setValue(
        this.accountData?.fullAccountNumber
      );
    } else {
      this.bankForm?.controls?.bankAccountNumber.markAllAsTouched();
    }
    const profile = this.accountData?.profile as IYodleeProfile;
    this.bankForm?.controls?.bankAccountAddressLine1?.setValue(
      profile?.address
    );
    this.bankForm?.controls?.bankAccountAddressLine2?.setValue(
      profile?.address2
    );
    this.bankForm?.controls?.bankAccountCity?.setValue(profile?.city);
    this.bankForm?.controls?.bankAccountState?.setValue(profile?.state);
    this.bankForm?.controls?.bankAccountZip?.setValue(profile?.zip);
    this.bankForm?.controls?.bankAccountCountry?.setValue('US');
    this.bankForm?.controls?.bankAccountAddressLine1.markAllAsTouched();
    this.bankForm.controls.bankRoutingNumber.disable();
    if (this.datas.isChase) {
      this.bankForm.controls.bankRoutingNumber.setValue(null);
      this.bankForm.controls.bankRoutingNumber.enable();
    }
  }

  /**
   * @description Looks up routing number, gets bank details and updates bank form with it.
   * @param event - keyup event.
   */
  lookupRoutingNumber(rout_no: string) {
    if (rout_no.length >= 9) {
      this.subscriptions.push(
        this.bankAccService.getroutingNumber(rout_no).subscribe(() => {
        })
      );
    }
  }

  /**
   * @description Allows only numbers in input.
   * @param event - keypress event.
   * @returns boolean representing number or not.
   */
  numberOnly(event: { which: number; keyCode: number }): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  /**
   * @description Returns false if backtick is given as input.
   * @param event - keypress event.
   * @returns boolean
   */
  backtickDesble(evt: { which: number; keyCode: number }): boolean {
    const charCode = evt.which ? evt.which : evt.keyCode;
    if (charCode === 96) {
      return false;
    }
    return true;
  }

  /**
   * @description Method invoked when 'save' is clicked.
   * Sets the bank form value to `this.accountData.bankFormData` and closes the dialog.
   */
  onSave() {
    if (this.bankForm.controls.bankAccountName.invalid) {
      this.isShowAccountName = true;
    } else {
      this.isShowAccountName = false;
    }

    if (this.bankForm.controls.bankAccountNickName.invalid) {
      this.isShowAccountNickName = true;
    } else {
      this.isShowAccountNickName = false;
    }

    if (this.bankForm.valid) {
      if(this.datas.isChase){
        const alertData = {
          content: 'Please verify that the entered details are correct?',
          cancelMsg: 'Cancel',
          doneMsg: 'Yes,Correct'
        };
        const action = this.alertService.confirmAlert(alertData);
        action.afterClosed().subscribe((res) => {
          if(res){
            this.bankForm.enable();
            this.accountData.bankFormData = this.bankForm.value;
            this.dialogRef.close(this.bankForm.value);
          }
        });
      }else{
        this.bankForm.enable();
        this.accountData.bankFormData = this.bankForm.value;
        this.dialogRef.close(this.bankForm.value);
      }
    } else {
      this.bankForm.markAllAsTouched();
    }
  }

  /**
   * @description Loads Google Address API.
   * @param address - address input HTML element.
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us', 'ca']
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.bankForm.patchValue({
          bankAccountAddressLine1: res.address,
          bankAccountAddressLine2: '',
          bankAccountCity: res.city,
          bankAccountState: res.state,
          bankAccountZip: res.zip,
          bankAccountCountry: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description Returns last 2 digits of account number.
   * @param accNo - account number.
   * @returns last 2 digits of account number.
   */
  getLast2Digit(accNo: string): string {
    const accountNumber = accNo;
    const lastTwoDigits = accountNumber?.slice(-2);
    return lastTwoDigits;
  }

  /**
   * @description Sets `this.showAllAddress` to true, when address line 1 is focused in template.
   * Results in showing all address fields.
   */
  address1Focused(): void {
    this.showAllAddress = true;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}
