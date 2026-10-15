import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IBank } from 'src/app/models/bank';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { HttpErrorResponse } from '@angular/common/http';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { NgxMaskDirective } from 'ngx-mask';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';
import { MatRadioButton } from '@angular/material/radio';
import { NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { PostHogService } from 'src/app/core/services/posthog.service';
import { signal } from '@angular/core';
import { Moengage } from 'src/app/data/data/moengage';

/**
 * @description Modal component for new bank account.
 */
@Component({
  selector: 'app-new-bank-account-modal',
  templateUrl: './new-bank-account-modal.component.html',
  styleUrls: ['./new-bank-account-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    FaIconComponent,
    NgClass,
    MatRadioButton,
    ControlMessageComponent,
    NgxMaskDirective,
    MatDialogActions
  ]
})
export class NewBankAccountModalComponent implements OnInit, OnDestroy {
  bankForm!: UntypedFormGroup;
  loading = false;
  subscriptions: Subscription[] = [];
  countryType: string | number = 1;
  private formStarted = false;

  utils = Utils;

  // Bank setup tracking
  bankSetupInitiatedTime = performance.now();
  stepsCompleted = signal(0);
  selectedBankName = signal<string | null>(null);
  isBankSetupCancelled = signal<boolean>(false);
  isFirstBankAttempt = signal<boolean>(false);
  bankCountBefore = signal<number>(0);

  private postHogService = inject(PostHogService);


  constructor(
    private fb: UntypedFormBuilder,
    private _googleAddressService: GoogleAddressService,
    private _bankAccService: BankAccountsService,
    private alertService: AlertService,
    public dialogRef: MatDialogRef<NewBankAccountModalComponent>,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    this.bankSetupInitiatedTime = performance.now();
    this.getBankData();
    this.initFormGroup();
    this._googleAddressService.resetGoogleAutocompleteAPI();

    // Track when user starts interacting with the form
    this.bankForm.valueChanges.subscribe(() => {
      if (!this.formStarted) {
        this.formStarted = true;
      }
    });
  }

  /**
   * @description Initializes bank form.
   */
  initFormGroup() {
    this.bankForm = this.fb.group({
      bankRoutingNumber: new UntypedFormControl('', [
        Validators.required,
        ValidationService.routingNumberValidator
      ]),
      bankAccountNumber: new UntypedFormControl('', [
        Validators.required,
        Validators.minLength(5)
      ]),
      confirmAccountNumber: new UntypedFormControl('', [
        Validators.required,
        ValidationService.isMatchingValidator(
          'bankAccountNumber',
          'Account number does not match'
        )
      ]),
      bankAccountName: new UntypedFormControl('', [
        Validators.required,
        ValidationService.personNameValidator,
        Validators.minLength(5)
      ]),
      bankAccountNickName: new UntypedFormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator,
        Validators.minLength(3),
      ]),
      bankAccountAddressLine1: new UntypedFormControl('', [
        Validators.required
      ]),
      bankAccountAddressLine2: new UntypedFormControl('', []),
      bankAccountCity: new UntypedFormControl('', [Validators.required]),
      bankAccountState: new UntypedFormControl('', [Validators.required]),
      bankAccountZip: new UntypedFormControl('', [
        Validators.required,
        ValidationService.zipValidator
      ]),
      bankAccountPhone: new UntypedFormControl('', [
        ValidationService.phoneNumberValidator
      ]),
      bankAccountEmail: new UntypedFormControl('', [
        ValidationService.emailValidator
      ]),

      bankName: new UntypedFormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      bankAddress1: new UntypedFormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      bankCity: new UntypedFormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      bankState: new UntypedFormControl('', [
        Validators.required,
        ValidationService.noWhitespaceValidator
      ]),
      bankZip: new UntypedFormControl('', [
        Validators.required,
        ValidationService.zipValidator,
        ValidationService.noWhitespaceValidator
      ]),
      bankStartingCheckNumber: new UntypedFormControl(''),
      bankFractionalNumber: new UntypedFormControl('', []),
      //........For Canadian Bank......................//
      transitNumber: new UntypedFormControl(''),
      financialNumber: new UntypedFormControl(''),
      country: new UntypedFormControl('USA'),
      bankAccountType: new UntypedFormControl('')
    });
  }

  /**
   * @description Getter method for getting bank form controls.
   */
  get getControl() {
    return this.bankForm.controls;
  }

  /**
   * @description Creates an object with bank form values and returns it.
   * @returns bank form body object.
   */
  createBankAccountBody(): IBank {
    let number;
    const data = this.getFormValue('bankAccountPhone');

    if (!data) {
      number = '';
    } else {
      const num = String(data);
      const num1 = num.substring(0, 3);
      const num2 = num.substring(3, 6);
      const num3 = num.substring(6, 10);
      number = '(' + num1 + ') ' + num2 + '-' + num3;
    }

    return {
      bankRoutingNumber: this.getFormValue('bankRoutingNumber'),
      bankAccountNumber: this.getFormValue('bankAccountNumber'),
      bankAccountName: this.getFormValue('bankAccountName'),
      bankAccountNickName: this.getFormValue('bankAccountNickName'),
      bankAccountAddressLine1: this.getFormValue('bankAccountAddressLine1'),
      bankAccountAddressLine2: this.getFormValue('bankAccountAddressLine2'),
      bankAccountCity: this.getFormValue('bankAccountCity'),
      bankAccountState: this.getFormValue('bankAccountState'),
      bankAccountZip: this.getFormValue('bankAccountZip'),
      bankAccountPhone: number,
      bankAccountEmail: this.getFormValue('bankAccountEmail'),
      bankAccountType: this.getFormValue('bankAccountType'),

      bankName: this.getFormValue('bankName'),
      bankAddress1: this.getFormValue('bankAddress1'),
      bankCity: this.getFormValue('bankCity'),
      bankState: this.getFormValue('bankState'),
      bankZip: this.getFormValue('bankZip'),
      checkSerialNumber: this.getFormValue('bankStartingCheckNumber'),
      bankIdentity: this.getFormValue('bankFractionalNumber'),
      //........For Canadian Bank......................//
      transitNumber: String(this.getFormValue('transitNumber')),
      financialNumber: String(this.getFormValue('financialNumber')),
      country: this.getFormValue('country'),
      allowDuplicate: this.getFormValue('allowDuplicate')
    };
  }

  /**
   * @description Method to get form values.
   * @param name - bank form field name.
   * @returns - value of the field with given name.
   */
  getFormValue(name: string) {
    return this.bankForm.get(name)?.value;
  }

  /**
   * @description Method invoked when selecting country (USA or CANADA). Resets and updates bank form according to selection.
   * @param event - selection event.
   */
  onTabChange(event: string | number) {
    this.countryType = event;
    if (this.countryType == 1) {
      this.bankForm.reset();
      this.bankForm.controls.bankRoutingNumber.setValidators([
        Validators.required,
        ValidationService.routingNumberValidator
      ]);
      this.bankForm.controls.bankRoutingNumber.updateValueAndValidity();
      this.bankForm.controls.transitNumber.setValidators([]);
      this.bankForm.controls.transitNumber.updateValueAndValidity();
      this.bankForm.controls.financialNumber.setValidators([]);
      this.bankForm.controls.financialNumber.updateValueAndValidity();
      this.bankForm.controls.country.setValue('USA');
      this.bankForm.controls.bankAccountType.setValue('');
    } else if (this.countryType == 2) {
      this.bankForm.reset();
      this.bankForm.controls.bankRoutingNumber.setValidators([]);
      this.bankForm.controls.bankRoutingNumber.updateValueAndValidity();
      this.bankForm.controls.transitNumber.setValidators([
        Validators.required,
        Validators.minLength(5)
      ]);
      this.bankForm.controls.financialNumber.setValidators([
        Validators.required,
        Validators.minLength(3)
      ]);
      this.bankForm.controls.country.setValue('CANADA');
      this.bankForm.controls.bankAccountType.setValue('');
    }
  }

  /**
   * @description Looks up routing number, gets bank details and updates bank form with it.
   * @param event - keyup event.
   */
  lookupRoutingNumber(event: KeyboardEvent) {
    if (event?.target == null) return;
    const rout_no = (event.target as HTMLInputElement).value;

    if (rout_no.length >= 9) {
      this.subscriptions.push(
        this._bankAccService.getroutingNumber(rout_no).subscribe((res) => {
          const bank_details = res.data;
          
          // Track bank name for abandonment
          this.selectedBankName.set(bank_details.name);

          this.bankForm.patchValue({
            bankName: bank_details.name?.trim(),
            bankAddress1: bank_details.address?.trim(),
            bankCity: bank_details.city?.trim(),
            bankState: bank_details.state?.trim(),
            bankZip: bank_details.zip?.toString()
          });
        })
      );
    } else {
      this.bankForm.patchValue({
        bankName: '',
        bankAddress1: '',
        bankCity: '',
        bankState: '',
        bankZip: ''
      });
    }
  }

  /**
   * @description Method to submit form and create new bank account.
   */
  submit(): void {
    this.bankForm.markAllAsTouched();

    if (this.bankForm.valid) {
      this.loading = true;
      this.subscriptions.push(
        this._bankAccService
          .AddBank(this.createBankAccountBody())
          .pipe(
            catchError((err: HttpErrorResponse) => {
              this.loading = false;
              // Track error for abandonment
              
              if (err.error.errorCode == 987) {
                const data = {
                  title: 'The Bank Account already exist.',
                  content: 'Would You Like To Add It Again',
                  width: '370px',
                  doneMsg: 'Yes',
                  cancelMsg: 'No'
                };
                const response = this.alertService.confirmAlert(data);
                response.afterClosed().subscribe((result) => {
                  if (result) {
                    this.bankForm.addControl(
                      'allowDuplicate',
                      this.fb.control('1')
                    );
                    this.submit();
                  }
                });
              }
              return of(false);
            })
          )
          .subscribe((res) => {
            if (res) {
              const id = res.data.id;
              this.loading = false;
              if (res.success == true) {
                // Mark as successfully completed to prevent abandonment tracking
                this.isBankSetupCancelled.set(true);
                this.dialogRef.close({
                  success: true,
                  id: id,
                  res: res.data,
                  check_no: this.getFormValue('bankStartingCheckNumber')
                });
                this.onSuccessAlert();
                this.headerService.refreshDynamicHeader.next(true);
              }
            }
          })
      );
    }
  }

  /**
   * @description Shows alert dialog upon successful bank account creation.
   */
  onSuccessAlert() {
    const data = {
      close: true,
      timeout: 2000,
      title: 'Success!',
      content: 'Bank Account Added.'
    };
    this.alertService.successAlert(data);
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
   * @description Returns false if backtick is given as input. Otherwise returns true.
   * @param event - keypress event.
   * @returns boolean
   */
  disbleBacktick(event: { which: number; keyCode: number }): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode == 192) {
      return false;
    }
    return true;
  }

  /**
   * @description Loads Google Address API.
   * @param address - address input HTML element.
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this._googleAddressService.googleAutocomplete({ addressElement: address });

    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
        this.bankForm.patchValue({
          bankAccountAddressLine1: res.address,
          bankAccountCity: res.city,
          bankAccountState: res.state,
          bankAccountZip: res.zip
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
    this._googleAddressService.googleAutocomplete({
      addressElement: address,
      addressInstance: addressInstance
    });

    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
        this.bankForm.patchValue({
          bankAddress1: res.address,
          bankCity: res.city,
          bankState: res.state,
          bankZip: res.zip
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description Returns false if backtick is given as input.
   * @param event - keypress event.
   * @returns boolean
   */
  backtickDesble(evt: { which: number; keyCode: number }): boolean {
    const charCode = evt.which ? evt.which : evt.keyCode;
    if (charCode == 96) {
      return false;
    } else {
      return true;
    }
  }

  trackBankInitiation(): void {
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
    this._bankAccService.getBankAccounts(1, '').subscribe({
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

  ngOnDestroy() {
    // Track abandonment if setup was not successfully completed
    if (!this.isBankSetupCancelled()) {
      this.triggerBankSetupAbandoned();
    }
    
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
