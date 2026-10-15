import { CommonModule } from '@angular/common';
import {
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2,
  RendererFactory2,
  inject,
  signal
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronDown, faChevronUp, faCreditCard, faSpinner, faXmark } from '@fortawesome/pro-solid-svg-icons';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Subject, finalize, takeUntil, take } from 'rxjs';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { RecaptchaService } from 'src/app/core/services/recaptcha.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV35Component } from '../../v3/buttons/common-button-v35/common-button-v35.component';
import { CommonInputFieldComponent } from '../../v3/common-input-field/common-input-field.component';
import { AddCreditCardService } from './add-credit-card.service';
import { ValidationService } from '../../service/validation/validation.service';
import {
  IAddCardErrorResponse,
  IAddCardHttpError,
  IAddCardPayload,
  ICollectJSResponse,
  ICollectJSResponseCard,
  IExistingCardDetails
} from './add-credit-card.model';
import { AlertService } from '../../service/alert/alert.service';
import { V35CommonDropDownSelectorComponent } from '../../v3/v35-dropdown/v35-common-dropdown-selector.component';
import { V35ControlMessageComponent } from '../../v3/control-message-v35/control-message-v35.component';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import {
  ThreeDSComplete,
  ThreeDSError,
  ThreeDSFailure,
  ThreeDsInstance
} from 'src/app/modules/cards/components/v35/models/cards-ocw-v35.interface';
import { ThreeDSPayload } from 'src/app/modules/payments/model/payments';
import { CardPaymentService } from 'src/app/shared/service/card-payment/card-payment.service';
import * as CryptoJS from 'crypto-js';

declare let CollectJS: {
  configure: (config: Record<string, unknown>) => void;
  startPaymentRequest: (event?: unknown) => void;
};

declare let Gateway: {
  create: (token: string) => any;
};


declare let tabaPaySdk: {
  createIframe: (config: TabaPayConfig) => { element: HTMLElement; submit: () => void };
};

interface TabaPayConfig {
  unlimitedWidth: boolean;
  padding: string;
  cardNumberInput: { 
    invalidTextPosition: string;
    required:string;
  };
  expirationDateInput: { 
    placeholderText: string;
    labelText: string;
    required:string;
  };
  cscInput: { 
    labelText: string;
    required:string;
  };
  labelStyle: {
    fontWeight: string;
    textColor: string;  
    fontSize: string;
    letterSpacing: string;
    invalidTextColor: string;
  };
  inputStyle: {
    backgroundColor: string;
    borderRadius: string;
    textColor: string;
    fontSize: string;
    fontWeight: string;
    fontFamily: string;
    padding: string;
    borderStyle: string;
    borderColor: string;
    invalidBackgroundColor:string;
    invalidBorderColor: string;
    invalidBorder:string;
  };
  invalidStyle: {
    textColor: string;
  };
  insetFrame: {
    backgroundColor:string;
    minWidth: string;
    minHeight: string;
    maxWidth: string;
    maxHeight: string;
  };
  eventListeners: {
    focusChange: (focused: boolean) => void;
    submit: (encryptedData: string) => void;
    cancel: () => void;
  };
  clientId: string;
}

@Component({
  selector: 'app-add-credit-card',
  standalone: true,
  imports: [
    FontAwesomeModule,
    CommonModule,
    MatDialogModule,
    CommonButtonV35Component,
    CommonInputFieldComponent,
    FormsModule,
    V35CommonDropDownSelectorComponent,
    V35ControlMessageComponent,
    ReactiveFormsModule
  ],
  providers: [AddCreditCardService],
  templateUrl: './add-credit-card.component.html',
  styleUrl: './add-credit-card.component.scss'
})
export class AddCreditCardComponent implements OnInit, OnDestroy {
  private addCreditCardService = inject(AddCreditCardService);
  private rendererFactory = inject(RendererFactory2);
  private googleAddressService = inject(GoogleAddressService);
  private alertService = inject(AlertService);
  private dialogRef = inject(MatDialogRef);
  private router = inject(Router);
  private recaptchaService = inject(RecaptchaService);
  private localStorageService = inject(LocalStorageService);
  private ngZone = inject(NgZone);
  private headerService = inject(HeaderService);
  private cardPaymentService = inject(CardPaymentService);
  private dialogData = inject<{
    nickName: string;
    color: string;
    data: {
      success: boolean;
      token: string;
      amex_allowed: 0 | 1;
      gateway_type: 2 |4 | 5;
      gateway_url: string;
      user_application_id: string;
      user_application_iv: string;
      selectedProvider: string;
      amex_token:string;
    };
    prefillData?: IExistingCardDetails;
    allowSkipGatewayAddition?: boolean;
  }>(MAT_DIALOG_DATA);

  prefillHint: { lastDigits: string; expMonth: string; expYear: string } | null = null;
  allowSkipGatewayAddition = !!this.dialogData.allowSkipGatewayAddition;

  threeDsInstance: ThreeDsInstance | null = null;

  faXmark = faXmark;
  faSpinner = faSpinner;
  faChevronDown = faChevronDown;
  faChevronUp = faChevronUp;
  faCreditCard = faCreditCard;
  showWhyAccordion = true;
  destroy$ = new Subject<boolean>();
  submitting = false;
  renderer: Renderer2;
  showMoreAddress = signal(false);

  nmiFieldsReady = false;
  tabapayFieldsReady = signal(false);
  tabapayTimout = false;
  nmiTimout = false;
  nmiScript?: HTMLScriptElement;
  tabapayScript?: HTMLScriptElement;
  nmiErrors = {
    ccnumber: { status: false, message: '', isTouched: false },
    ccexp: { status: false, message: '', isTouched: false },
    cvv: { status: false, message: '', isTouched: false }
  };

  selectedColor: string;
  keys: string[] = [
    'z78Fh7vKwF893KN99WVzgL4r93B61k0d',
  ];

  tabapayClientId: string = '';

  form = new FormGroup({
    firstName: new FormControl('', Validators.required),
    lastName: new FormControl('', Validators.required),
    email: new FormControl('', [
      ValidationService.emailValidator,
      Validators.required
    ]),
    addressLine1: new FormControl('', Validators.required),
    addressLine2: new FormControl(''),
    city: new FormControl('', Validators.required),
    state: new FormControl('', Validators.required),
    zip: new FormControl('', [
      Validators.required,
      ValidationService.zipCodeValidator
    ]),
    country: new FormControl('', Validators.required)
  });

  isTabaPayActive = false;
  tabapayInitialized = false;
  showNickNameField = false;
  isGatewayFallback = signal(false);
  nickNameControl = new FormControl('', { nonNullable: true });
  private tabapayInstance?: ReturnType<typeof tabaPaySdk.createIframe>;
  private cardMetaData: ICollectJSResponseCard | undefined;

  /**
   * @description Validator used after error 678 ("does not match the existing
   * card") — the nickname must be present and must differ from the original
   * card's nickname so the new entry is treated as a separate card.
   */
  private differFromOriginalNickName = (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;
    const original = String(this.dialogData?.nickName ?? '').trim();
    return value === original ? { sameNickName: true } : null;
  };

  /**
   * @description Switches the verify-card flow into "add as new card" mode
   * after a 678 mismatch. Reveals an empty nickname input that must be filled
   * with a value different from the original card's nickname before the user
   * can resubmit.
   */
  private enterAddAsNewCardMode(): void {
    this.showNickNameField = true;
    this.nickNameControl.setValue('');
    this.nickNameControl.setValidators([Validators.required, this.differFromOriginalNickName]);
    this.nickNameControl.updateValueAndValidity();
    this.nickNameControl.markAsDirty();
    this.nickNameControl.markAsTouched();
  }

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  ngOnInit(): void {
    this.decryptTabapayClientId();
    this.observeAddressAutoComplete();

    this.dialogRef
      .beforeClosed()
      .pipe(take(1))
      .subscribe(() => {
        if (this.threeDsInstance) {
          this.threeDsInstance.unmount();
        }
      });

    if (this.dialogData.data.success && this.dialogData.data.token) {
      this.isTabaPayActive = this.dialogData.data.gateway_type === 5;

      this.appendScript(this.dialogData.data.token);
    }

    if (this.dialogData.prefillData) {
      this.applyPrefill(this.dialogData.prefillData);
    } else {
      const email = this.localStorageService.getItem('email');
      if (email) {
        this.form.patchValue({ email });
      }
    }

  }

  private applyPrefill(data: IExistingCardDetails): void {
    this.form.patchValue({
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      addressLine1: data.address_line_1,
      city: data.city,
      state: data.state,
      zip: data.zip,
      country: data.country
    });
    this.showMoreAddress.set(true);
    this.prefillHint = {
      lastDigits: data.card_last_digits,
      expMonth: data.card_exp_month,
      expYear: data.card_exp_year
    };
  }

  observeAddressAutoComplete() {
    this.googleAddressService.googleAddress$
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.form.patchValue({
          country: val.country,
          zip: val.zip,
          city: val.city,
          state: val.state,
          addressLine1: val.address
        });
      });
  }

  appendScript(token: string) {
    const tabapayScript: HTMLScriptElement = this.renderer.createElement('script');
    tabapayScript.src = 'https://iframes.sandbox.tabapay.net/TabaPaySDK.js';
    tabapayScript.onload = () => {
      this.tabapayInitialized = true;
      this.configureTabapay();
    };
    this.renderer.appendChild(document.head, tabapayScript);
    this.tabapayScript = tabapayScript;
    if (!this.isTabaPayActive) {
      this.loadCollectJsScript(token);
    }
  }

  private loadCollectJsScript(token: string) {
    if (this.nmiScript) {
      this.renderer.removeChild(document.head, this.nmiScript);
      this.nmiScript = undefined;
    }

    ['ccnumber', 'ccexp', 'cvv'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });

    const collectJsHost =
      this.dialogData.data.gateway_type === 5 || !this.dialogData.data.gateway_url
        ? null
        : this.dialogData.data.gateway_url;

    this.nmiScript = this.renderer.createElement('script');
    if (!this.nmiScript) return;
    this.nmiScript.src = collectJsHost
      ? `${collectJsHost}/token/Collect.js`
      : 'https://secure.nmi.com/token/Collect.js';
    this.nmiScript.setAttribute('data-tokenization-key', token);
    this.nmiScript.setAttribute('data-variant', 'inline');
    this.nmiScript.onload = () => this.configureCollectJs();
    this.renderer.appendChild(document.head, this.nmiScript);
  }

  private decryptTabapayClientId() {
    const {data} = this.dialogData;
    if (data.user_application_id && data.user_application_iv && data.gateway_type === 5) {
      const ciphertext = atob(data.user_application_id);
      const decrypted = CryptoJS.AES.decrypt(
        ciphertext,
        CryptoJS.enc.Utf8.parse(this.keys[0]),
        {
          iv: CryptoJS.enc.Base64.parse(data.user_application_iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );
      this.tabapayClientId = decrypted.toString(CryptoJS.enc.Utf8);
    } else {
      this.tabapayClientId = '';
    }
  }

  loadGoogleAddress(elm: HTMLInputElement) {
    this.showMoreAddress.set(!this.showMoreAddress());
    this.googleAddressService.googleAutocomplete({
      addressElement: elm,
      allowedCountries: ['us'],
      displayShortName: true
    });
  }

  changeAddressView() {
    this.showMoreAddress.set(!this.showMoreAddress());
  }


  /**
   * @description Two-step card registration is enabled for this account
   * (`credit_card_gateway_switching_status === 4` from the header API). Only the
   * CTA/title wording depends on this; the masked-card summaries do not.
   */
  get isTwoStepFlow(): boolean {
    return this.headerService.creditCardGatewaySwitchingStatus() === 4;
  }

  /** Reverification mode: an existing card is being re-registered on its missing gateway. */
  get isReverifyMode(): boolean {
    return !!this.prefillHint && !this.showNickNameField && !this.isGatewayFallback();
  }

  /** Masked last four for summaries — never the full number. */
  get maskedLast4(): string {
    return (this.prefillHint?.lastDigits ?? '').slice(-4);
  }

  /** MM/YY regardless of whether expYear arrived as 2 or 4 digits (fallback vs. reverify). */
  get maskedExpiry(): string {
    const { expMonth = '', expYear = '' } = this.prefillHint ?? {};
    return expMonth && expYear ? `${expMonth}/${expYear.slice(-2)}` : '';
  }

  get modalTitle(): string {
    if (this.isGatewayFallback()) return 'Confirm Card';
    if (this.prefillHint) {
      return this.isTwoStepFlow ? 'Complete Payment Reverification' : 'Complete Payment';
    }
    return 'Add Credit Card';
  }

  get primaryCtaText(): string {
    if (!this.isTwoStepFlow) return 'Submit';
    if (this.isGatewayFallback()) {
      return this.submitting ? 'Saving card…' : 'Confirm';
    }
    if (this.isReverifyMode) {
      return this.submitting ? 'Verifying Card..' : 'Verify & Pay';
    }
    return 'Continue';
  }

  configureCollectJs() {
    if (typeof CollectJS === 'undefined') {
      this.ngZone.run(() => {
        this.nmiTimout = true;
      });
      return;
    }

    CollectJS.configure({
      variant: 'inline',
      customCss: {
        'border-width': '1px',
        'border-color': '#dddddd',
        'border-radius': '0.35rem',
        height: '2.5rem',
        width: '100%',
        'padding-left': '10px',
        'padding-right': '10px',
        color: '#535353'
      },
      fields: {
        ccnumber: {
          selector: '#ccnumber',
          title: 'Card Number',
          placeholder: '0000 0000 0000 0000'
        },
        ccexp: {
          selector: '#ccexp',
          title: 'Card Expiration',
          placeholder: 'MM / YY'
        },
        cvv: {
          display: 'required',
          selector: '#cvv',
          title: 'CVV Code',
          placeholder: '***'
        }
      },
      validationCallback: (
        field: keyof typeof this.nmiErrors,
        status: boolean,
        message: string
      ) => {
        this.ngZone.run(() => {
          this.nmiErrors[field].status = status;
          this.nmiErrors[field].message = message;
          if (!this.nmiErrors[field].isTouched) {
            this.nmiErrors[field].isTouched = true;
          }
          if (!status) {
            this.submitting = false;
          }
        });
      },
      fieldsAvailableCallback: () => {
        this.ngZone.run(() => {
          this.nmiFieldsReady = true;
        });
      },
      timeoutCallback: () => {
        this.ngZone.run(() => {
          this.nmiTimout = true;
        });
      },
      callback: (response: ICollectJSResponse) => {
        this.ngZone.run(() => {
          if (response.token) {
            this.submitForm(response);
          } else {
            this.submitting = false;
          }
        });
      }
    });
  }

  togglePaymentProvider() {
    this.isTabaPayActive = !this.isTabaPayActive;
    if (this.isTabaPayActive && this.tabapayInitialized) {
      this.configureTabapay();
    }
  }

  /**
   * @description Marks the billing form (and the nickname field when it is in
   * play) as touched so every inline validator renders on submit, and expands
   * the collapsed address block so the city/state/zip/country errors are
   * actually on screen.
   */
  private validateBillingDetails(): boolean {
    let valid = true;

    if (this.form.invalid) {
      this.showMoreAddress.set(true);
      this.form.markAllAsTouched();
      valid = false;
    }

    if (this.showNickNameField && this.nickNameControl.invalid) {
      this.nickNameControl.markAsTouched();
      valid = false;
    }

    return valid;
  }

  /**
   * @description Seeds a "required" message for every Collect.js field that has
   * not reported a passing validation, so an untouched card number / expiry /
   * CVV shows a message on submit instead of an empty error slot.
   */
  private validateNmiCardFields(): boolean {
    const labels: Record<keyof typeof this.nmiErrors, string> = {
      ccnumber: 'Card number',
      ccexp: 'Expiration date',
      cvv: 'CVV'
    };

    let valid = true;
    (Object.keys(labels) as (keyof typeof labels)[]).forEach((field) => {
      if (this.nmiErrors[field].status) return;
      if (!this.nmiErrors[field].message) {
        this.nmiErrors[field].message = `${labels[field]} is required`;
      }
      this.nmiErrors[field].isTouched = true;
      valid = false;
    });

    return valid;
  }

  storeCardData() {
    const billingValid = this.validateBillingDetails();

    if (this.isTabaPayActive) {
      // TabaPay's fields live in a cross-origin iframe, so its own submit() is the
      // only way to trigger their inline "Required" messages. Its submit callback
      // re-checks the billing form before anything is posted.
      this.tabapayInstance?.submit();
      return;
    }

    this.storeCardDataNmi(billingValid);
  }

  /**
   * @description Close (X) / Cancel handler. In "Confirm Card" mode the card was
   * already stored on the first gateway, so leaving now strands it
   * unconfirmed — warn first, and close with `cardCreated` so callers can
   * refresh their card lists.
   */
  closeModal(): void {
    if (!this.isGatewayFallback()) {
      this.dialogRef.close(false);
      return;
    }
    this.alertService
      .warningAlert({
        title: 'Card Not Confirmed',
        content:
          "Do you want to cancel? This card can't be used for payments until you confirm your card number and CVV.",
        doneMsg: 'Confirm Now',
        cancelMsg: 'Yes, Cancel',
        isCancel: true
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmNow) => {
        if (!confirmNow) {
          this.dialogRef.close({ success: false, cardCreated: true });
        }
      });
  }

  skipGatewayAddition() {
    this.alertService
      .infoAlert({
        content:
          "This skip applies to this payment only. You'll be asked to verify this card again the next time you use it.",
        doneMsg: 'Pay Now, Verify Later',
        cancelMsg: 'Cancel',
        isCancel: true
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) {
          this.dialogRef.close({ skipGatewayAddition: true });
        }
      });
  }


  storeCardDataNmi(billingValid = true) {
    const cardFieldsValid = this.validateNmiCardFields();
    if (!billingValid || !cardFieldsValid) return;

    this.submitting = true;
    CollectJS.startPaymentRequest();
  }



  async submitForm(data: ICollectJSResponse) {
    const threeDS = await this.resolveThreeDs(data.token);
    if (!threeDS.ok) return;

    const payload = { ...this.buildPayload(data.token, data.card), ...threeDS.data };

    this.recaptchaService.recaptchaToken
      .pipe(takeUntil(this.destroy$))
      .subscribe((token: string | undefined) => {
        this.submitCard({ ...payload, recaptcha: token });
      });
  }

  private buildPayload(paymentToken: string, card?: ICollectJSResponseCard): IAddCardPayload {
    const formValue = this.form.value;
    const isVerifyFlow = !!this.dialogData.prefillData && !this.showNickNameField;
    
    // we want to resend card meta in add card api as tabapay res wont be giving this.
    if(card) this.cardMetaData = card;

    return {
      nickName: this.showNickNameField
        ? this.nickNameControl.value.trim()
        : this.dialogData.nickName,
      first_name: formValue.firstName,
      last_name: formValue.lastName,
      address1: formValue.addressLine1,
      address2: formValue.addressLine2,
      city: formValue.city,
      state: formValue.state,
      zip: ValidationService.sanitizeZipCode(formValue.zip),
      country: this.isTabaPayActive ? '840' : formValue.country,
      email: formValue.email,
      bgColor: this.dialogData.color,
      payment_token: paymentToken,
      card:this.cardMetaData ,
      ...(isVerifyFlow
        ? { is_card_verification: 1 as const, existing_card_id: this.dialogData.prefillData!.id }
        : {})
    } as IAddCardPayload;
  }

  private async resolveThreeDs(
    paymentToken: string
  ): Promise<{ ok: true; data?: ThreeDSPayload } | { ok: false }> {
    const headerData = this.headerService._headerData.value;
    if (!headerData || headerData.allow_three_ds_testing !== 1) {
      return { ok: true };
    }

    const { addressLine1, addressLine2, zip, ...rest } = this.form.value;
    const options = { ...rest, paymentToken };

    const res = await this.validateCardWith3ds(
      options,
      headerData.nmi_gatewayjs_checkout_key,
      (instance) => {
        this.threeDsInstance = instance;
      },
      () => {
        this.cardPaymentService.hasThreeDsChallenge.set(true);
      }
    );

    this.cardPaymentService.hasThreeDsChallenge.set(false);
    if (res.instance) {
      res.instance.unmount();
      this.threeDsInstance = null;
    }

    if (!res.success) {
      this.alertService.failedAlert({
        content: res.message || 'Something went wrong while verifying your card'
      });
      this.submitting = false;
      return { ok: false };
    }

    return {
      ok: true,
      data: {
        cavv: res.data.cavv,
        xid: res.data.xid,
        eci: res.data.eci,
        cardholder_auth: res.data.cardHolderAuth,
        three_ds_version: res.data.threeDsVersion,
        directory_server_id: res.data.directoryServerId,
        cardholder_info: res.data.cardHolderInfo
      }
    };
  }

  private submitCard(
    payload: IAddCardPayload & Partial<ThreeDSPayload> & { recaptcha?: string }
  ): void {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });

    this.addCreditCardService
      .addCard(payload, this.isTabaPayActive, headerOptions)
      .pipe(
        finalize(() => {
          this.submitting = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (val) => {
          if (val.success) {
            this.dialogRef.close({ success: true, data: val });
            return;
          }
          if (val?.errorCode === 1077) {
            this.handleGatewayFallback(val as unknown as IAddCardErrorResponse);
            return;
          }
          if (val?.errorCode === 677) {
            this.dialogRef.close({ success: false, errorCode: val?.errorCode });
          }
        },
        error: (err: IAddCardHttpError) => this.handleAddCardError(err)
      });
  }

  private handleAddCardError(err: IAddCardHttpError): void {
    const code = err.error.errorCode;

    if (code === 1007) {
      const ref = this.alertService.warningAlert({
        content: err.error?.errorMsg,
        doneMsg: 'Add As New Card',
        isCancel: true,
        cancelMsg: 'Cancel'
      });
      ref
        .afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          if (res) {
            this.enterAddAsNewCardMode();
          }
        });
      return;
    }

    if (code === 631) {
      const ref = this.alertService.warningAlert({
        content: err.error?.errorMsg,
        doneMsg: 'Verify Now',
        isCancel: true,
        cancelMsg: 'Cancel'
      });
      ref
        .afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          if (res) {
            this.router.navigate(['/manage/users/verify-email-phone']);
            this.dialogRef.close(false);
          }
        });
    } else if (err.status === 422 && err.error.errorMsg && err.error.errorCode !==205) {
      this.alertService.failedAlert({ content: err.error.errorMsg });
    }
  }

  private handleGatewayFallback(error: IAddCardErrorResponse): void {
    const details = error.metaData?.secondGatewayDetails;
    if (!details?.success || !details.gateway_type || !details.token) {
      // Nothing to switch to — surface a neutral failure rather than the 1077
      // "next verification step" copy, which would read as an error.
      this.alertService.failedAlert({
        content: "We couldn't verify this card. Please try again."
      });
      return;
    }

    this.switchToGateway(details.gateway_type, {
      token: details.token,
      amex_token: details.amex_token ?? '',
      amex_allowed: details.amex_allowed ?? 0,
      user_application_id: details.user_application_id ?? '',
      user_application_iv: details.user_application_iv ?? '',
      gateway_url: details.gateway_url ?? ''
    });
  }

  private switchToGateway(
    gatewayType: 2 | 4 | 5,
    creds: {
      token: string;
      amex_token: string;
      amex_allowed: 0 | 1;
      user_application_id: string;
      user_application_iv: string;
      gateway_url: string;
    }
  ): void {
    this.dialogData.data.token = creds.token;
    this.dialogData.data.amex_token = creds.amex_token;
    this.dialogData.data.amex_allowed = creds.amex_allowed;
    this.dialogData.data.user_application_id = creds.user_application_id;
    this.dialogData.data.user_application_iv = creds.user_application_iv;
    this.dialogData.data.gateway_url = creds.gateway_url;
    this.dialogData.data.gateway_type = gatewayType;
    this.dialogData.data.selectedProvider = '';

    this.submitting = false;
    this.resetCardFieldState();
    this.isTabaPayActive = gatewayType === 5;

    this.form.controls.zip.updateValueAndValidity();

    setTimeout(() => {
      if (this.isTabaPayActive) {
        this.decryptTabapayClientId();
        if (this.tabapayInitialized) {
          this.configureTabapay();
        }
      } else {
        this.loadCollectJsScript(this.dialogData.data.token);
      }
    });

    this.isGatewayFallback.set(true);
    if (this.cardMetaData) {
      this.prefillHint = {
        lastDigits: this.cardMetaData.number,
        expMonth: this.cardMetaData.exp?.slice(0, 2) ?? '',
        expYear: this.cardMetaData.exp?.slice(-2) ?? ''
      };
    }
  }

  private resetCardFieldState(): void {
    this.nmiErrors = {
      ccnumber: { status: false, message: '', isTouched: false },
      ccexp: { status: false, message: '', isTouched: false },
      cvv: { status: false, message: '', isTouched: false }
    };
    this.nmiFieldsReady = false;
    this.nmiTimout = false;
    this.tabapayFieldsReady.set(false);
  }

  /**
   * Experimental. should be removed or moved somewhere eles after testing
   *
   */
  validateCardWith3ds(
    options: Record<string, any>,
    publicKey: string,
    onReady: (instance: ThreeDsInstance) => void,
    challenge: () => void
  ) {
    return new Promise<
      | {
          success: true;
          data: ThreeDSComplete;
          instance: ThreeDsInstance | null;
        }
      | {
          success: false;
          message: string;
          instance: ThreeDsInstance | null;
        }
    >((res) => {
      const onload = () => {
        const gateway = Gateway.create(publicKey);

        gateway.on('error', () => {
          res({
            success: false,
            message: 'Something went wrong',
            instance: threeDSI
          });
        });

        const threeDS = gateway.get3DSecure();

        const threeDSI = threeDS.createUI({
          ...options,
          currency: 'USD',
          amount: '0.00'
        });

        onReady(threeDSI);

        threeDSI.start('#threeDSMountPoint');

        threeDSI.on('complete', (e: ThreeDSComplete) => {
          res({ success: true, data: e, instance: threeDSI });
        });

        threeDSI.on('challenge', challenge);

        threeDSI.on('_debug', (e: ThreeDSError) => {
          res({ success: false, message: e.message, instance: threeDSI });
        });

        threeDSI.on('failure', (e: ThreeDSFailure) => {
          res({ success: false, message: e.message, instance: threeDSI });
        });
      };

      if (document.getElementById('ocw-gateway-script')) {
        onload();
        return;
      }

      const script = this.renderer.createElement('script') as HTMLScriptElement;
      script.id = 'ocw-gateway-script';
      script.src = 'https://secure.networkmerchants.com/js/v1/Gateway.js';
      script.onload = onload;
      script.onerror = () => {
        res({
          success: false,
          message: 'Something went wrong',
          instance: null
        });
      };

      this.renderer.appendChild(document.head, script);
    });
  }

  configureTabapay() {
    const tabapayContainer = document.getElementById('tabapay-container');
    if (!tabapayContainer) return;
    

    const isDarkMode = this.localStorageService.getItem('user-theme') === 'dark-mode';
    
    const backgroundColor = isDarkMode ? '#1d2027' : 'transparent';
    const textColor = isDarkMode ? '#c9cfe0' : '#535353';
    const borderColor = isDarkMode ? '#3a3e47' : '#dddddd';
    const labelColor = isDarkMode ? '#798ba6' : '#75798c';
    const errorColor = isDarkMode ? '#eb2e2e' : '#fb5f5f';
    
    this.tabapayInstance = tabaPaySdk.createIframe({
      unlimitedWidth: true,
      padding: "0px",
      cardNumberInput: { 
        invalidTextPosition: "bottom-left",
        required:"Required"
      },
      expirationDateInput: { 
        placeholderText: "MM / YY", 
        labelText: "Expiration Date", 
        required:"Required"
      },
      cscInput: { 
        labelText: "CVV",
        required:"Required"
      },
      labelStyle: {
        fontWeight: "400",
        textColor: labelColor,
        fontSize: "14px",
        letterSpacing: "0.02em",
        invalidTextColor: errorColor
      },
      inputStyle: {
        backgroundColor,
        borderRadius: "6px",
        textColor,
        fontSize: "16px",
        fontWeight: "400",
        fontFamily: "Arial, sans-serif",
        padding: "12px",
        borderStyle: "1px solid",
        borderColor,
        invalidBackgroundColor: backgroundColor,
        invalidBorderColor: errorColor,
        invalidBorder: `1px solid ${errorColor}`
      },
      invalidStyle: {
        textColor: errorColor
      },
      insetFrame: {
        backgroundColor,
        minWidth: "100%",
        minHeight: "auto",
        maxWidth: "100%",
        maxHeight: "none",
      },
      eventListeners: {
        focusChange: () => {
          // Handle focus change
        },
        submit: (encryptedData: string) => {
          this.ngZone.run(() => {
            if (!this.validateBillingDetails()) return;
            this.handleTabaPaySubmit(encryptedData);
          });
        },
        cancel: () => {
          // handle cancel
        },
      },
      clientId: this.tabapayClientId || '',

    });

    tabapayContainer.innerHTML = '';
    tabapayContainer.appendChild(this.tabapayInstance.element);
    
    setTimeout(() => {
      this.tabapayFieldsReady.set(true);
    }, 3000);
  }

  private handleTabaPaySubmit(encryptedData: string): void {
    this.submitting = true;
    const payload = this.buildPayload(encryptedData);

    this.recaptchaService.recaptchaToken
      .pipe(takeUntil(this.destroy$))
      .subscribe((token: string | undefined) => {
        this.submitCard({ ...payload, recaptcha: token });
      });
  }
  
  ngOnDestroy(): void {
    if (this.nmiScript) {
      this.renderer.removeChild(document.head, this.nmiScript);
    }
    if (this.tabapayScript) {
      this.renderer.removeChild(document.head, this.tabapayScript);
    }
    this.googleAddressService.resetGoogleAutocompleteAPI();
    this.destroy$.next(true);
  }
}
