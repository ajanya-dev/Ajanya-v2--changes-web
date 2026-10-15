import { Component, Inject, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose
} from '@angular/material/dialog';
import { BehaviorSubject, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { Utils } from 'src/app/data/utils';
import { IAddBankPayload, IBankData } from 'src/app/models/bank';
import { NewBankAccountModalComponent } from 'src/app/shared/bank-modal/modals/new-bank-account-modal/new-bank-account-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { NgxMaskDirective } from 'ngx-mask';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IConfirmAlert } from 'src/app/models/alert';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { Moengage } from 'src/app/data/data/moengage';

@Component({
  selector: 'app-clone-design',
  templateUrl: './clone-design.component.html',
  styleUrls: ['./clone-design.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    FaIconComponent,
    NgClass,
    ControlMessageComponent,
    NgxMaskDirective,
    CommonButtonV35Component
  ]
})
export class CloneDesignComponent implements OnInit, OnDestroy {
  private fb = inject(UntypedFormBuilder);
  private googleAddressService = inject(GoogleAddressService);
  private bankAccService = inject(BankAccountsService);
  public dialogRef = inject(MatDialogRef<NewBankAccountModalComponent>);
  private alertService = inject(AlertService);
  private postHogService = inject(PostHogService);

  utils = Utils;

  cloneForm!: UntypedFormGroup;
  subscriptions: Subscription[] = [];

  searchplace = new BehaviorSubject<boolean>(false);
  btnDesable = false;
  validRout: boolean;
  submitted = false;
  zipValid = false;
  bankZipValid = false;
  isPhoneValid = false;
  isEmailValid = false;
  countryType: string | number = 1;

  // Bank setup tracking
  bankSetupInitiatedTime = performance.now();
  stepsCompleted = signal(0);
  selectedBankName = signal<string | null>(null);
  isBankSetupCancelled = signal<boolean>(false);
  isFirstBankAttempt = signal<boolean>(false);
  bankCountBefore = signal<number>(0);
  isBankSetupInitiated = signal<boolean>(false);

  constructor(@Inject(MAT_DIALOG_DATA) public data: IBankData) {}

  ngOnInit(): void {
    this.bankSetupInitiatedTime = performance.now();
    this.initFormGroup();
    this.getBankData();
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }

  /**
   * @description Loads google address api and update `cloneForm`.
   * @param address - payee address.
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us', 'ca']
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.cloneForm.patchValue({
          AddressLine1: res.address,
          city: res.city,
          state: res.state,
          zip: res.zip
        });

        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description Loads google address API for bank address.
   * @param address - address input HTML element.
   * @param addressInstance - instance of address.
   */
  loadBankGoogleAddress(address: HTMLInputElement, addressInstance: number) {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      allowedCountries: ['us', 'ca'],
      addressInstance
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.cloneForm.patchValue({
          bankAddress: res.address,
          bankCity: res.city,
          bankState: res.state,
          bankZip: res.zip
        });

        googleAddressSubscription.unsubscribe();
      });
  }

  /** change country with input */

  /**
   * @description Handles the change event when selecting a country type.
   * @param {string | number} event - The selected country type.
   */
  onTapChange(event: string | number) {
    this.countryType = event;
    this.countryType = parseInt(this.countryType as string);
    if (this.countryType === 1) {
      this.cloneForm.reset();
      this.cloneForm.controls.bankAccountType.setValue('');
      this.cloneForm.controls.bankRoutingNumber.setValidators([
        Validators.required,
        ValidationService.routingNumberValidator
      ]);
      this.cloneForm.controls.bankRoutingNumber.updateValueAndValidity();
      this.cloneForm.controls.transitNumber.setValidators([]);
      this.cloneForm.controls.transitNumber.updateValueAndValidity();
      this.cloneForm.controls.finantialInstNumber.setValidators([]);
      this.cloneForm.controls.finantialInstNumber.updateValueAndValidity();
      this.cloneForm.controls.country.setValue('USA');
    } else if (this.countryType === 2) {
      this.cloneForm.reset();
      this.cloneForm.controls.bankAccountType.setValue('');
      this.cloneForm.controls.bankRoutingNumber.setValidators([]);
      this.cloneForm.controls.bankRoutingNumber.updateValueAndValidity();
      this.cloneForm.controls.transitNumber.setValidators([
        Validators.required
      ]);
      this.cloneForm.controls.finantialInstNumber.setValidators([
        Validators.required
      ]);
      this.cloneForm.controls.country.setValue('CANADA');
    }
  }

  //  ********************* initFormGroup ************************ //

  /**
   * @description Initializes the clone form.
   */
  initFormGroup() {
    this.cloneForm = this.fb.group({
      bankRoutingNumber: [
        '',
        [Validators.required, ValidationService.routingNumberValidator]
      ],
      bankAccountNumber: ['', [Validators.required, Validators.minLength(5)]],
      bankAccountName: ['', [Validators.required, ValidationService.personNameValidator, Validators.minLength(5)]],
      bankAccountNickName: ['', [Validators.required]],
      AddressLine1: ['', [Validators.required]],
      AddressLine2: [''],
      city: [''],
      state: [''],
      zip: ['', [ValidationService.zipValidator]],
      phone: ['', ValidationService.phoneNumberValidator],
      email: ['', [ValidationService.emailValidator]],
      bankName: ['', [Validators.required]],
      bankAddress: ['', [Validators.required]],
      bankCity: ['', [Validators.required]],
      bankState: ['', [Validators.required]],
      bankZip: ['', [Validators.required, ValidationService.zipValidator]],
      startSerialNo: [''],
      fractionalNo: [''],
      bankAccountType: [''],
      /** for canadian bank */
      transitNumber: [''],
      finantialInstNumber: [''],
      country: ['USA']
    });
  }
  //  ********************* END ************************ //

  get getControl() {
    return this.cloneForm.controls;
  }

  // ********************* Create bank Acount body ************************ //

  /**
   * @description Creates the request body for the clone form data.
   */
  createFormBody(allowDuplicate?: boolean) {
    const data = this.cloneForm.value;
    const formBody:IAddBankPayload = {
      bankAccountNickName: data.bankAccountNickName,
      bankAccountAddressLine1: data.AddressLine1,
      bankAccountAddressLine2: data.AddressLine2,
      bankAccountCity: data.city,
      bankAccountName: data.bankAccountName,
      bankAccountNumber: data.bankAccountNumber,
      bankAccountState: data.state,
      bankAccountZip: data.zip,
      bankAddress1: data.bankAddress,
      bankCity: data.bankCity,
      bankState: data.bankState,
      bankName: data.bankName,
      checkSerialNumber: data.startSerialNo ? data.startSerialNo : '1000',
      bankRoutingNumber: data.bankRoutingNumber,
      bankZip: data.bankZip,
      bankAccountType: data?.bankAccountType,
      transitNumber: data.transitNumber,
      financialNumber: data.finantialInstNumber,
      country: data.country,
      bankIdentity: data.fractionalNo
    };
  
    if (allowDuplicate) {
      formBody.allowDuplicate = '1';
    }
  
    return formBody;
  }

  /**
   * @description Retrieves the value of a form control by its name.
   * @param {string} name - The name of the form control.
   * @returns - The value of the form control.
   */
  getFormValue(name: string) {
    return this.cloneForm.get(name)?.value;
  }

  // ******************** get bank Account details with routing number ********************* //

  /**
   * @description Looks up the routing number and retrieves bank details.
   * @param {Event} event - The event triggered by the input element.
   */
  lookupRoutingNumber(event: Event) {
    const routNo = (event.target as HTMLInputElement).value;

    if (routNo.length > 8) {
      this.subscriptions.push(
        this.bankAccService.getroutingNumber(routNo).subscribe((res) => {
          const bankDetails = res.data;
          
          // Track bank name for abandonment
          this.selectedBankName.set(bankDetails.name);

          this.cloneForm.patchValue({
            bankName: bankDetails.name,
            bankAddress: bankDetails.address,
            bankCity: bankDetails.city,
            bankState: bankDetails.state,
            bankZip: bankDetails.zip
          });
        })
      );
    } else {
      this.cloneForm.patchValue({
        bankName: '',
        bankAddress: '',
        bankCity: '',
        bankState: '',
        bankZip: ''
      });
    }
  }

  // ******************** END ********************* //

  // ******************** number only function in text  ********************* //
  /**
   * @description  Allows only numeric input in an event based on the key code.
   * @param {object} event - The event object containing the key code.
   * @param {number} event.which - The key code of the pressed key.
   * @param {number} event.keyCode - The key code of the pressed key.
   * @returns {boolean} - Returns true if the key press is a numeric value, otherwise returns false.
   */
  numberOnly(event: { which: number; keyCode: number }): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  // ******************** END ********************* //

  /**
   * @description Submits the clone form data.
   */
  submit(allowDuplicate: boolean = false): void {
    this.cloneForm.markAllAsTouched();
  
    if (this.cloneForm.valid) {
      this.btnDesable = true;
      this.subscriptions.push(
        this.bankAccService
          .AddBank(this.createFormBody(allowDuplicate))
          .pipe(
            finalize(() => {
              this.btnDesable = false;
            })
          )
          .subscribe({
            next: (res) => {
              const {id} = res.data;
              // Mark as successfully completed to prevent abandonment tracking
              this.isBankSetupCancelled.set(true);
              this.dialogRef?.close({
                success: true,
                id,
                check_no: this.getFormValue('startSerialNo'),
                bankAcData: res.data
              });
              const data = {
                title: false,
                content: 'Successfully cloned.',
                close: true,
                timeout: 2000
              };
              this.alertService.successAlert(data);
            },
            error: (err) => {
              if (err?.error?.errorCode === 987) {
                const data: IConfirmAlert = {
                  title: 'The Bank Account already exists.',
                  content: 'Would You Like To Add It Again?',
                  doneMsg: 'Yes',
                  cancelMsg: 'No'
                };
                const response = this.alertService.confirmAlert(data);
                response.afterClosed().subscribe((result) => {
                  if (result) {
                    this.submit(true);
                  }
                });
              }
            }
          })
      );
    }
  }

  trackBankInitiation(): void {
    this.isBankSetupInitiated.set(true);
    this.postHogService.trackBankSetupInitiated({
      ...this.postHogService.customerPayloadFromStorage(),
      bank_add_method: 'manual',
      is_first_bank_attempt: this.isFirstBankAttempt(),
      bank_count_before: this.bankCountBefore()
    });
  }

  triggerBankSetupAbandoned(): void {
    const duration = performance.now() - this.bankSetupInitiatedTime;
    this.postHogService.trackBankSetupAbandoned({
      ...this.postHogService.customerPayloadFromStorage(),
      setup_duration_seconds: Math.round(duration / 1000),
      exit_reason: 'user_exit',
      bank_selected: this.selectedBankName(),
      steps_completed: this.stepsCompleted(),
      error_code: null,
      bank_selected_type: this.getBankSelectedType(this.selectedBankName()),
      bank_add_method: 'manual'
    });
  }

  getBankSelectedType(bankName: string | null): string | null {
    if(!bankName) {
      return null;
    }

    if(Moengage.creditUnionPatterns.some(pattern => bankName.toLowerCase().includes(pattern))) {
      return 'credit_union';
    }
    if(Moengage.majorPatterns.some(pattern => bankName.toLowerCase().includes(pattern))) {
      return 'major';
    }
    return 'regional';
  }

  getBankData(){
    this.subscriptions.push(
    this.bankAccService.getBankAccounts(1, '').subscribe({
      next: (res) => {
        if(res.success){
          const isFirstBankAttempt = this.isFirstBankAttemptChecker(res?.totalCount || 0, res?.data?.[0]?.fullAccountNumber || '');
          this.isFirstBankAttempt.set(isFirstBankAttempt);
          this.bankCountBefore.set(res?.totalCount || 0);
          this.trackBankInitiation();
        }
      }
    }));
  }

  isFirstBankAttemptChecker(totalCount: number, bankAccountNumber: string | number): boolean {
    if(totalCount === 0) return true;
    if(totalCount === 1 && (bankAccountNumber).toString() === '1111111111') return true;
    return false;
  }

  ngOnDestroy(): void {
    // Track abandonment only if setup was initiated but not successfully completed
    if (this.isBankSetupInitiated() && !this.isBankSetupCancelled()) {
      this.triggerBankSetupAbandoned();
    }
    
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
