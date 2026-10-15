import { NgClass, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBuildingColumns } from '@fortawesome/pro-thin-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/pro-solid-svg-icons';
import { MatCheckbox } from '@angular/material/checkbox';
import { NgxMaskDirective } from 'ngx-mask';
import { finalize, Subject, takeUntil } from 'rxjs';
import { Utils } from 'src/app/data/utils';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { AuthV3Service } from 'src/app/modules/auth/services/auth-v3.service';
import { IPlaidMetaData } from 'src/app/shared/plaid/model/paid-data';
import {
  IPlaidCallBackResAccount,
  PlaidService
} from 'src/app/shared/plaid/service/plaid.service';
import { OutsideService } from 'src/app/shared/service/outisde/outside.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { CommonCountrySelectComponent } from 'src/app/shared/v3/common-country-select/common-country-select.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { CommonStateSelectComponent } from 'src/app/shared/v3/common-state-select/common-state-select.component';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { environment } from 'src/environments/environment';

interface PlaidCreateOptions {
  token: string;
  onLoad?: () => void;
  onSuccess: (publicToken: string, metadata: IPlaidMetaData) => void;
  onExit?: (err: unknown, metadata: IPlaidMetaData) => void;
  onEvent?: (
    eventName: 'TRANSITION_VIEW' | 'EXIT' | 'HANDOFF',
    metadata: IPlaidMetaData
  ) => void;
}

interface PlaidHandler {
  open: () => void;
  destroy: () => void;
}

declare const Plaid: {
  create: (options: PlaidCreateOptions) => PlaidHandler;
};

@Component({
  selector: 'app-external-bank',
  standalone: true,
  imports: [
    CommonInputFieldComponent,
    V35ControlMessageComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV35Component,
    NgOptimizedImage,
    NgxMaskDirective,
    FaIconComponent,
    NgClass,
    MatCheckbox,
    CommonCountrySelectComponent,
    CommonStateSelectComponent
  ],
  templateUrl: './external-bank.component.html',
  styleUrl: './external-bank.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExternalBankComponent implements OnInit, OnDestroy {
  private outsideService = inject(OutsideService);
  private route = inject(ActivatedRoute);
  private plaidService = inject(PlaidService);
  private googleAddressService = inject(GoogleAddressService);
  private appSettingService = inject(AppSettingsService);
  public authV3Service = inject(AuthV3Service);

  private plaidHandler: PlaidHandler | null = null;
  transactionId: string;
  ddTransactionId: string;
  env = environment;
  logoPath = signal('assets/main/app_logo.svg');
  isApiLogo = signal(false);
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  showAccountNumber = false;
  showConfirmAccountNumber = false;
  customPatternAccount = { 0: { pattern: /\d/, symbol: 'X' } };
  customPatternConfirm  = { 0: { pattern: /\d/, symbol: 'X' } };
  isLoading = signal(false);
  isSubmit = signal(false);
  linkNotExpired = signal(false);
  bankAdded = signal(false);
  isLoadingPlaid = signal(false);
  isCompassCustomer = signal(false);
  payeeToken = input('');
  payeeEmail = input<string | undefined>(undefined);
  payeeName = input('');
  destroy$ = new Subject();
  utils = Utils;
  selectedType: 'manual' | 'instant' = 'manual';
  selectedPayee: { payeeEmail: string; payeeId: string };
  faBuildingColumns = faBuildingColumns;
  showWireInfo = signal(false);

  
  isPlaidVerified = signal(false);
  isDirectDeposit = signal(false);
  plaid_account_id = signal<string | undefined>(undefined);
  plaid_provider_id = signal<string | undefined>(undefined);
  account_number_last4 = signal<string | undefined>(undefined);
  account_address = signal<string | undefined>(undefined);
  bankOptions = [
    {
      id: 'manual',
      icon: 'fa-building-columns',
      title: 'Add Manually',
      content: 'Add by providing account details manually'
    },
    {
      id: 'instant',
      svg: true,
      title: 'Connect Instantly',
      content: 'Add with your net banking username & password'
    }
  ];

  bankForm = new FormGroup({
    holderName: new FormControl('', [
      Validators.required,
      ValidationService.personNameValidator,
      ValidationService.legalNameMatchValidator(() => this.payeeName())
    ]),
    routingNumber: new FormControl('', [
      Validators.required,
      ValidationService.routingNumberValidator
    ]),
    accountNumber: new FormControl('', [
      Validators.required,
      Validators.minLength(5)
    ]),
    confirmAccountNumber: new FormControl('', [
      Validators.required,
      ValidationService.isMatchingValidator(
        'accountNumber',
        'Account number does not match'
      )
    ]),
    accountType: new FormControl('', [Validators.required]),
    // Wire info - Beneficiary Details
    bankAccountFirstName: new FormControl('', [ValidationService.personNamePartValidator]),
    bankAccountLastName: new FormControl('', [ValidationService.personNamePartValidator]),
    bankAccountAddress1: new FormControl(''),
    bankAccountAddress2: new FormControl(''),
    bankAccountCity: new FormControl(''),
    bankAccountState: new FormControl(''),
    bankAccountZip: new FormControl(''),
    bankAccountCountry: new FormControl('')
  });

  wireInfoFields = [
    'bankAccountFirstName',
    'bankAccountAddress1',
    'bankAccountCity',
    'bankAccountState',
    'bankAccountZip',
    'bankAccountCountry'
  ];

  bankAccountType = [
    { value: 'businessChecking', name: 'Business Checking' },
    { value: 'businessSavings', name: 'Business Savings' },
    { value: 'personalChecking', name: 'Personal Checking' },
    { value: 'personalSavings', name: 'Personal Savings' },
  ];

  // Matches the previous app-common-country-drop-down's default restriction.
  beneficiaryAllowedCountries = { US: 'United States', CA: 'Canada' };

  ngOnInit(): void {
    this.transactionId = this.payeeToken() || this.route.snapshot.params?.id;
    // check if direct deposit is available in the params
    this.ddTransactionId = this.route.snapshot.queryParamMap?.get('transaction') || '';
    const isDirectDeposit = this.route.snapshot.queryParamMap?.get('directDeposit') ?? false;
    this.isDirectDeposit.set(!!isDirectDeposit); 

    this.linkNotExpired.set(this.isDirectDeposit());
    if(!this.isDirectDeposit()) {
      this.getLinkStatus(this.transactionId);
    }
    this.loadLogo();
    this.googleAddressService.resetGoogleAutocompleteAPI();
  }

  private loadLogo(): void {
    if (this.env.isItWhiteLabel) {
      this.logoPath.set(
        `assets/white_label/${this.env.env_id}/assets/app_logo.png`
      );
      return;
    }

    this.appSettingService.appConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => {
        if (!config || this.isApiLogo()) return;
        this.logoPath.set(
          config.websiteLogo || config.zilMoneyLogo || 'assets/main/app_logo.svg'
        );
      });
  }

  getLinkStatus(id: string) {
    this.isLoading.set(true);
    this.outsideService
      .externalBankStatus(id)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.linkNotExpired.set(res.success);
        if (res.success && res.data?.email) {
          this.selectedPayee = {
            payeeEmail: res.data.email as string,
            payeeId: res.data.payee_id as string
          };
          this.isCompassCustomer.set(res?.data?.plugins.includes('enterprise-compass'));
          if(this.isCompassCustomer() && res?.data?.logo) {
            this.logoPath.set(res.data.logo);
            this.isApiLogo.set(true);
          }
        }
      });
  }

  onSelectType(type: 'manual' | 'instant') {
    this.selectedType = type;
    if (type === 'instant') {
      this.openPlaidModal();
    }
  }

  openPlaidModal() {
    const getPlaidData = this.isDirectDeposit()
      ? this.outsideService.getPlaidConnectionDataDirectDeposit({user_id: this.ddTransactionId})
      : this.outsideService.getPlaidConnectionData({
        email: this.selectedPayee?.payeeEmail,
        ref_id: this.selectedPayee?.payeeId,
        ref_type: 'payee'
      });
    
    this.isLoadingPlaid.set(true);
    getPlaidData
      .pipe(finalize(() => this.isLoadingPlaid.set(false)), takeUntil(this.destroy$))
      .subscribe((val) => {
        if (!val.success || !val.data.token) return;
        this.initializePlaidScript(() => this.startPlaid(val.data.token, val.data.key));
      });
  }


  private initializePlaidScript(callback: () => void) {
    const plaidScript = document.querySelector(
      `script[src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"]`
    );

    if (plaidScript) {
      callback();
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.onload = callback;
    document.body.appendChild(script);
  }
  
  startPlaid(linkToken: string, key: string) {
    this.isLoadingPlaid.set(true);
    if (this.plaidHandler) this.plaidHandler.destroy();
    this.plaidHandler = null;

    this.plaidHandler = Plaid.create({
      token: linkToken,
      onLoad: () => {
        this.isLoadingPlaid.set(false);
      },
      onSuccess: async (publicToken: string, metadata: IPlaidMetaData) => {
        const payload = {
          public_token: publicToken,
          institutionName: metadata.institution?.name || null,
          institutionId: metadata.institution?.institution_id || null,
          metadata,
          key
        };

        this.isLoadingPlaid.set(true);
        this.plaidService
          .outsideCallBack(payload)
          .pipe(
            finalize(() => {
              this.isLoadingPlaid.set(false);
            }
          ),
          takeUntil(this.destroy$)
          )
          .subscribe((res) => {
            if (!res.success || !res.data.accounts.length) return;

            this.setFormValue(res.data.accounts[0]);
          });
      }
    });

    this.plaidHandler.open();
  }

  setFormValue(plaidAccount: IPlaidCallBackResAccount) {
    this.bankForm.patchValue({
      holderName: plaidAccount.bank_account_account_name,
      routingNumber: plaidAccount.routing_number,
      accountNumber: plaidAccount.account_number,
      confirmAccountNumber: plaidAccount.account_number
    });
    if(plaidAccount.account_sub_type === 'checking') {
      this.bankForm.controls.accountType.setValue('businessChecking');
    } else if(plaidAccount.account_sub_type === 'savings') {
      this.bankForm.controls.accountType.setValue('personalSavings');
    }
    this.plaid_account_id.set(plaidAccount.plaid_account_id);
    this.plaid_provider_id.set(plaidAccount.institution_id);
    this.account_number_last4.set(plaidAccount.account_number.slice(-4));
    this.account_address.set(plaidAccount.account_address);
    this.isPlaidVerified.set(true);

    this.bankForm.controls.holderName.disable();
    this.bankForm.controls.routingNumber.disable();
    this.bankForm.controls.accountNumber.disable();
    this.bankForm.controls.confirmAccountNumber.disable();
    this.bankForm.controls.accountType.disable();
  }

  submit() {
    this.bankForm.controls.holderName.updateValueAndValidity();
    this.bankForm.markAllAsTouched();
    if (this.bankForm.invalid) return;
    
    this.isSubmit.set(true);
    
    const submitRequest = this.isDirectDeposit()
      ? this.outsideService.addDirectDepositBank(this.getDirectDepositPayload())
      : this.outsideService.addExternalBank(this.transactionId, this.getExternalBankPayload());

    submitRequest
      .pipe(
        finalize(() => this.isSubmit.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.bankAdded.set(true);
        }
      });
  }

  private getDirectDepositPayload() {
    const formValue = this.bankForm.value;
    return {
      uniqueId: this.ddTransactionId,
      account_name: formValue.holderName as string,
      routing_number: formValue.routingNumber as string,
      account_number: formValue.accountNumber as string,
      account_type: formValue.accountType as string,
      plaid_account_id: this.isPlaidVerified() ? this.plaid_account_id() : undefined,
      plaid_provider_id: this.isPlaidVerified() ? this.plaid_provider_id() : undefined,
      account_number_last4: this.isPlaidVerified() ? this.account_number_last4() : undefined,
      account_address: this.isPlaidVerified() ? this.account_address() : undefined
    };
  }

  private getExternalBankPayload() {
    const formValue = this.bankForm.getRawValue();
    const basePayload = {
      bank_name: formValue.holderName as string,
      routing_number: formValue.routingNumber as string,
      account_number: formValue.accountNumber as string,
      account_type: formValue.accountType as string,
      plaid_account_id: this.isPlaidVerified() ? this.plaid_account_id() : undefined
    };

    if (this.showWireInfo()) {
      return {
        ...basePayload,
        is_allow_wire: 1,
        bank_account_first_name: formValue.bankAccountFirstName,
        bank_account_last_name: formValue.bankAccountLastName,
        bank_account_address1: formValue.bankAccountAddress1,
        bank_account_address2: formValue.bankAccountAddress2,
        bank_account_city: formValue.bankAccountCity,
        bank_account_state: formValue.bankAccountState,
        bank_account_zip: formValue.bankAccountZip,
        bank_account_country: formValue.bankAccountCountry
      };
    }

    return basePayload;
  }

  onAccountNumberFocus() {
    this.customPatternAccount = { 0: { pattern: /\d/, symbol: '' } };
  }

  onAccountNumberBlur() {
    if (!this.showAccountNumber) {
      this.customPatternAccount = { 0: { pattern: /\d/, symbol: 'X' } };
    }
  }

  toggleAccountNumber() {
    this.showAccountNumber = !this.showAccountNumber;
    this.customPatternAccount = { 0: { pattern: /\d/, symbol: this.showAccountNumber ? '' : 'X' } };
  }

  onConfirmAccountNumberFocus() {
    this.customPatternConfirm = { 0: { pattern: /\d/, symbol: '' } };
  }

  onConfirmAccountNumberBlur() {
    if (!this.showConfirmAccountNumber) {
      this.customPatternConfirm = { 0: { pattern: /\d/, symbol: 'X' } };
    }
  }

  toggleConfirmAccountNumber() {
    this.showConfirmAccountNumber = !this.showConfirmAccountNumber;
    this.customPatternConfirm = { 0: { pattern: /\d/, symbol: this.showConfirmAccountNumber ? '' : 'X' } };
  }

  onWireInfoChange(checked: boolean): void {
    this.showWireInfo.set(checked);
    this.wireInfoFields.forEach((field) => {
      const control = this.bankForm.get(field);
      if (control) {
        const nameValidators =
          field === 'bankAccountFirstName'
            ? [ValidationService.personNamePartValidator]
            : [];
        if (checked) {
          control.setValidators([Validators.required, ...nameValidators]);
        } else {
          control.setValidators(nameValidators);
        }
        control.updateValueAndValidity();
      }
    });
  }

  loadGoogleAddress(address: HTMLInputElement): void {
    this.googleAddressService.googleAutocomplete({
      addressElement: address,
      displayShortName: true
    });

    const googleAddressSubscription =
      this.googleAddressService.googleAddress$.subscribe((res) => {
        this.bankForm.patchValue({
          bankAccountAddress1: res.address,
          bankAccountCity: res.city,
          bankAccountState: res.state,
          bankAccountZip: res.zip,
          bankAccountCountry: res.country
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  getZipPlaceholder() {
    return this.bankForm.get('bankAccountCountry')?.value === 'US' || this.bankForm.get('bankAccountCountry')?.value === '' || this.bankForm.get('bankAccountCountry')?.value === 'United States' ? 'Zip' : 'Postal Code';
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
