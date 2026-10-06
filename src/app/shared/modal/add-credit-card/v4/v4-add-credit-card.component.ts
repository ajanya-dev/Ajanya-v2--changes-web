import { CommonModule } from '@angular/common';
import {
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  Renderer2,
  RendererFactory2,
  ViewEncapsulation,
  inject,
  signal
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
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
import { LucideAngularModule, Loader2, X, ChevronDown, ChevronUp, ShieldCheck, CreditCard } from 'lucide-angular';
import { GoogleAddressService } from 'src/app/core/services/google-address.service';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { RecaptchaService } from 'src/app/core/services/recaptcha.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
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
import { AddressAutocompleteV4Component } from 'src/app/shared/V4/address-autocomplete-v4/address-autocomplete-v4.component';
import { IGoogleAddress } from 'src/app/modules/more/model/google-autocomplete';
import {
  IAddCardErrorResponse,
  IAddCardHttpError,
  IAddCardPayload,
  IAddCardResponse,
  ICollectJSResponse,
  ICollectJSResponseCard,
  IExistingCardDetails
} from '../add-credit-card.model';
import { AddCreditCardService } from '../add-credit-card.service';

declare let CollectJS: {
  configure: (config: Record<string, unknown>) => void;
  startPaymentRequest: (event?: unknown) => void;
};

declare let Gateway: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (token: string) => any;
};

declare let tabaPaySdk: {
  createIframe: (config: TabaPayConfig) => {
    element: HTMLElement;
    submit: () => void;
  };
};

type TNmiField = 'ccnumber' | 'ccexp' | 'cvv';

interface TabaPayConfig {
  unlimitedWidth: boolean;
  padding: string;
  cardNumberInput: { invalidTextPosition: string; required: string };
  expirationDateInput: {
    placeholderText: string;
    labelText: string;
    required: string;
  };
  cscInput: { labelText: string; required: string };
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
    invalidBackgroundColor: string;
    invalidBorderColor: string;
    invalidBorder: string;
  };
  invalidStyle: { textColor: string };
  insetFrame: {
    backgroundColor: string;
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
  selector: 'app-v4-add-credit-card',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatDialogClose,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    FormsModule,
    V4CommonDropDownSelectorComponent,
    V4ControlMessageComponent,
    AddressAutocompleteV4Component,
    ReactiveFormsModule
  ],
  providers: [AddCreditCardService],
  templateUrl: './v4-add-credit-card.component.html',
  styleUrl: './v4-add-credit-card.component.scss'
})
export class V4AddCreditCardComponent implements OnInit, OnDestroy {
  readonly Loader2Icon = Loader2;
  readonly XIcon = X;
  readonly ChevronDownIcon = ChevronDown;
  readonly ChevronUpIcon = ChevronUp;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly CreditCardIcon = CreditCard;
  showWhyAccordion = false;

  private addCreditCardService = inject(AddCreditCardService);
  private rendererFactory = inject(RendererFactory2);
  private googleAddressService = inject(GoogleAddressService);
  private alertService = inject(V4AlertService);
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
      gateway_type: 2 | 4 | 5;
      gateway_url: string;
      user_application_id: string;
      user_application_iv: string;
      selectedProvider: string;
      amex_token: string;
    };
    prefillData?: IExistingCardDetails;
    allowSkipGatewayAddition?: boolean;
  }>(MAT_DIALOG_DATA);

  prefillHint: { lastDigits: string; expMonth: string; expYear: string } | null = null;
  allowSkipGatewayAddition = !!this.dialogData.allowSkipGatewayAddition;
  showNickNameField = false;
  nickNameControl = new FormControl('', { nonNullable: true });

  private differFromOriginalNickName = (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();
    if (!value) return null;
    const original = String(this.dialogData?.nickName ?? '').trim();
    return value === original ? { sameNickName: true } : null;
  };

  private enterAddAsNewCardMode(): void {
    this.showNickNameField = true;
    this.nickNameControl.setValue('');
    this.nickNameControl.setValidators([Validators.required, this.differFromOriginalNickName]);
    this.nickNameControl.updateValueAndValidity();
    this.nickNameControl.markAsDirty();
    this.nickNameControl.markAsTouched();
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

  threeDsInstance: ThreeDsInstance | null = null;

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

  nmiCcnumberControl = new FormControl('');
  nmiCcexpControl = new FormControl('');
  nmiCvvControl = new FormControl('');

  selectedColor: string;
  keys: string[] = ['z78Fh7vKwF893KN99WVzgL4r93B61k0d'];

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
  isGatewayFallback = signal(false);
  private tabapayInstance?: ReturnType<typeof tabaPaySdk.createIframe>;
  private cardMetaData: ICollectJSResponseCard | undefined;

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

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  ngOnInit(): void {
    this.decryptTabapayClientId();
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

  appendScript(token: string) {
    const tabapayScript = this.renderer.createElement('script');
    tabapayScript.src = 'https://iframes.sandbox.tabapay.net/TabaPaySDK.js';
    tabapayScript.onload = () => {
      this.tabapayInitialized = true;
      this.configureTabapay();
    };
    this.renderer.appendChild(document.head, tabapayScript);
    this.tabapayScript = tabapayScript;

    // Collect.js (NMI) is only loaded for NMI gateways. Passing a TabaPay token to
    // Collect.js makes its Config.js throw "Invalid tokenization key format" and skip
    // defining the global CollectJS, which then surfaces as "CollectJS is not defined"
    // when configureCollectJs() runs on script load. The TabaPay SDK above stays loaded
    // unconditionally so a later gateway fallback to TabaPay still works.
    if (!this.isTabaPayActive) {
      this.loadCollectJsScript(token);
    }
  }

  private loadCollectJsScript(token: string) {
    if (this.nmiScript) {
      this.renderer.removeChild(document.head, this.nmiScript);
      this.nmiScript = undefined;
    }

    // Clear stale Collect.js iframes so the reloaded script re-mounts cleanly
    ['ccnumber', 'ccexp', 'cvv'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });

    // gateway_type 5: gateway_url is the Tabapay API base, not NMI — Collect.js must load from NMI
    const collectJsHost =
      this.dialogData.data.gateway_type === 5 ||
      !this.dialogData.data.gateway_url
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
    const { data } = this.dialogData;
    if (
      data.user_application_id &&
      data.user_application_iv &&
      data.gateway_type === 5
    ) {
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
        'border-style': 'solid',
        'border-color': '#d0d0d0',
        'border-radius': '10px',
        'background-color': '#ffffff',
        height: '2.25rem',
        width: '100%',
        'padding-left': '16px',
        'padding-right': '16px',
        color: '#111827',
        'font-size': '0.875rem',
        'box-shadow': '0 1px 2px 0 rgb(0 0 0 / 0.05)'
      },
      focusCss: {
        'border-width': '2px',
        'border-color': '#004a7c',
        outline: 'none'
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
          const nmiControlMap: Record<string, FormControl> = {
            ccnumber: this.nmiCcnumberControl,
            ccexp: this.nmiCcexpControl,
            cvv: this.nmiCvvControl
          };
          const ctrl = nmiControlMap[field];
          if (ctrl) {
            if (!status) {
              ctrl.setErrors({ nmiError: true });
              ctrl.markAsTouched();
            } else {
              ctrl.setErrors(null);
            }
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
   * @description Close (X) / Cancel handler. In "Confirm Card" mode the card
   * was already stored on the first gateway, so leaving now strands it
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
      .warningAlert({
        title: 'Skip verification?',
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
   * @description Marks every Collect.js field that has not reported a passing
   * validation as touched and errored, so an untouched card number / expiry /
   * CVV shows its message on submit instead of failing silently.
   */
  private validateNmiCardFields(): boolean {
    const fields: {
      key: TNmiField;
      control: FormControl;
      label: string;
    }[] = [
      { key: 'ccnumber', control: this.nmiCcnumberControl, label: 'Card number' },
      { key: 'ccexp', control: this.nmiCcexpControl, label: 'Expiration date' },
      { key: 'cvv', control: this.nmiCvvControl, label: 'CVV' }
    ];

    let valid = true;
    fields.forEach(({ key, control, label }) => {
      if (this.nmiErrors[key].status) return;
      if (!this.nmiErrors[key].message) {
        this.nmiErrors[key].message = `${label} is required`;
      }
      this.nmiErrors[key].isTouched = true;
      control.setErrors({ nmiError: true });
      control.markAsTouched();
      valid = false;
    });

    return valid;
  }

  storeCardData() {
    const billingValid = this.validateBillingDetails();

    if (this.isTabaPayActive) {
      this.tabapayInstance?.submit();
      return;
    }

    this.storeCardDataNmi(billingValid);
  }

  storeCardDataNmi(billingValid = true) {
    const cardFieldsValid = this.validateNmiCardFields();
    if (!billingValid || !cardFieldsValid) return;

    this.submitting = true;
    CollectJS.startPaymentRequest();
  }

  private buildPayload(
    paymentToken: string,
    card?: ICollectJSResponseCard
  ): IAddCardPayload {
    const formValue = this.form.value;
    const isVerifyFlow = !!this.dialogData.prefillData && !this.showNickNameField;

    // we want to resend card meta in add card api as tabapay res wont be giving this.
    if (card) this.cardMetaData = card;

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
      card: this.cardMetaData,
      ...(isVerifyFlow
        ? { is_card_verification: 1 as const, existing_card_id: this.dialogData.prefillData!.id }
        : {})
    } as IAddCardPayload;
  }

  async submitForm(data: ICollectJSResponse) {
    const formValue = this.form.value;
    const payload = this.buildPayload(data.token, data.card);

    // eslint-disable-next-line no-underscore-dangle
    const headerData = this.headerService._headerData.value;
    let threeDSRes: undefined | ThreeDSPayload;

    if (headerData && headerData.allow_three_ds_testing === 1) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { addressLine1, addressLine2, zip, ...rest } = formValue;
      const options = { ...rest, paymentToken: data.token };

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
          content:
            res.message || 'Something went wrong while verifying your card'
        });
        this.submitting = false;
        return;
      }

      threeDSRes = {
        cavv: res.data.cavv,
        xid: res.data.xid,
        eci: res.data.eci,
        cardholder_auth: res.data.cardHolderAuth,
        three_ds_version: res.data.threeDsVersion,
        directory_server_id: res.data.directoryServerId,
        cardholder_info: res.data.cardHolderInfo
      };
    }

    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });

    const httpRequest = (token: string) => {
      const sendingPayload = { ...payload, ...threeDSRes, recaptcha: token };

      this.addCreditCardService
        .addCard(sendingPayload, this.isTabaPayActive, headerOptions)
        .pipe(
          finalize(() => {
            this.submitting = false;
          }),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: (val) => this.handleAddCardResponse(val),
          error: (err: IAddCardHttpError) => this.handleAddCardError(err)
        });
    };

    this.recaptchaService.recaptchaToken
      .pipe(takeUntil(this.destroy$))
      .subscribe((res: string | undefined) => {
        httpRequest(res as string);
      });
  }

  validateCardWith3ds(
    options: Record<string, unknown>,
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
      | { success: false; message: string; instance: ThreeDsInstance | null }
    >((res) => {
      const onload = () => {
        const gateway = Gateway.create(publicKey);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let threeDSI: any = null;
        gateway.on('error', () => {
          res({
            success: false,
            message: 'Something went wrong',
            instance: threeDSI
          });
        });

        const threeDS = gateway.get3DSecure();
        threeDSI = threeDS.createUI({
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

    const isDarkMode =
      this.localStorageService.getItem('user-theme') === 'dark-mode';
    const backgroundColor = isDarkMode ? '#1c293c' : '#ffffff';
    const textColor = isDarkMode ? '#f8fafc' : '#111827';
    const borderColor = isDarkMode ? '#3a3e47' : '#d0d0d0';
    const labelColor = isDarkMode ? '#c9cfe0' : '#4b5563';
    const errorColor = isDarkMode ? '#eb2e2e' : '#fb5f5f';

    this.tabapayInstance = tabaPaySdk.createIframe({
      unlimitedWidth: true,
      padding: '0px',
      cardNumberInput: {
        invalidTextPosition: 'bottom-left',
        required: 'Required'
      },
      expirationDateInput: {
        placeholderText: 'MM / YY',
        labelText: 'Expiration Date',
        required: 'Required'
      },
      cscInput: { labelText: 'CVV', required: 'Required' },
      labelStyle: {
        fontWeight: '400',
        textColor: labelColor,
        fontSize: '14px',
        letterSpacing: '0.02em',
        invalidTextColor: labelColor
      },
      inputStyle: {
        backgroundColor,
        borderRadius: '10px',
        textColor,
        fontSize: '15px',
        fontWeight: '400',
        fontFamily: 'Arial, sans-serif',
        padding: '12px',
        borderStyle: '1px solid',
        borderColor,
        invalidBackgroundColor: backgroundColor,
        invalidBorderColor: borderColor,
        invalidBorder: `1px solid ${borderColor}`
      },
      invalidStyle: { textColor: errorColor },
      insetFrame: {
        backgroundColor,
        minWidth: '100%',
        minHeight: 'auto',
        maxWidth: '100%',
        maxHeight: 'none'
      },
      eventListeners: {
        focusChange: (_focused: boolean) => {},
        submit: (encryptedData: string) => {
          this.ngZone.run(() => {
            if (!this.validateBillingDetails()) return;
            this.handleTabaPaySubmit(encryptedData);
          });
        },
        cancel: () => {
          this.handleTabaPayCancel();
        }
      },
      clientId: this.tabapayClientId || ''
    });

    tabapayContainer.innerHTML = '';
    tabapayContainer.appendChild(this.tabapayInstance.element);
    setTimeout(() => {
      this.tabapayFieldsReady.set(true);
    }, 3000);
  }

  onAddressSelected(address: IGoogleAddress): void {
    const city = (address.city ?? '').trim();
    const state = (address.state ?? '').trim();
    const zip = (address.zip ?? '').trim();
    this.form.patchValue({
      addressLine1: address.address,
      city,
      state,
      zip,
      country: 'US'
    });

    this.form.controls.city.updateValueAndValidity();
    this.form.controls.state.updateValueAndValidity();
    this.form.controls.zip.updateValueAndValidity();
  }

  private handleTabaPaySubmit(encryptedData: string): void {
    this.submitting = true;
    // TabaPay returns no card meta — buildPayload resends the cached NMI meta
    const payload = this.buildPayload(encryptedData);

    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });

    this.recaptchaService.recaptchaToken
      .pipe(takeUntil(this.destroy$))
      .subscribe((token: string | undefined) => {
        const sendingPayload = { ...payload, recaptcha: token as string };

        this.addCreditCardService
          .addCard(sendingPayload, this.isTabaPayActive, headerOptions)
          .pipe(
            finalize(() => {
              this.submitting = false;
            }),
            takeUntil(this.destroy$)
          )
          .subscribe({
            next: (val) => this.handleAddCardResponse(val),
            error: (err: IAddCardHttpError) => this.handleAddCardError(err)
          });
      });
  }

  /**
   * @description Handles a 200 add-card response. On success closes with the
   * card; on 1077 switches gateways; on 677 closes with the code; any other
   * `success:false` payload carrying an `errorMsg` (e.g. "Card Already Added")
   * is surfaced in a failed alert above the modal.
   */
  private handleAddCardResponse(val: IAddCardResponse): void {
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
      return;
    }
    const errorMsg = (val as unknown as IAddCardErrorResponse)?.errorMsg;
    if (errorMsg) {
      this.alertService.failedAlert({ content: errorMsg });
    }
  }

  /**
   * @description Handles add-card HTTP errors (mirrors v3): 1077 is not a real
   * failure — the backend returns it (as 200 or 422 depending on the gateway) to
   * hand over second-gateway credentials, so it moves the modal to the confirm
   * step instead of alerting. 1007 offers "Add As New Card", 631 routes to
   * email/phone verification, and any other 422 with an `errorMsg` (except 205)
   * is surfaced in a failed alert above the modal.
   */
  private handleAddCardError(err: IAddCardHttpError): void {
    const code = err.error.errorCode;

    if (code === 1077) {
      this.handleGatewayFallback(err.error);
      return;
    }

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
    } else if (err.status === 422 && err.error.errorMsg && code !== 205) {
      this.alertService.failedAlert({ content: err.error.errorMsg });
    }
  }

  private handleTabaPayCancel(): void {}

  /**
   * @description Handles add-card errorCode 1077: not a real failure — the first
   * gateway rejected the card but the backend supplied credentials for a second
   * one, so the modal switches in place to "Confirm Card" mode on that gateway.
   * Gating matches v3: any 1077 carrying usable credentials is followed, however
   * many times it arrives. Its `errorMsg` ("Almost done — please complete the
   * next verification step") is never alerted, since it is not a failure.
   */
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
    Object.assign(this.dialogData.data, {
      ...creds,
      gateway_type: gatewayType,
      selectedProvider: ''
    });

    this.submitting = false;
    this.resetCardFieldState();
    this.isTabaPayActive = gatewayType === 5;

    this.form.controls.zip.updateValueAndValidity();

    // Let @if (isTabaPayActive) re-render the field containers before mounting
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
    [this.nmiCcnumberControl, this.nmiCcexpControl, this.nmiCvvControl].forEach(
      (ctrl) => {
        ctrl.setErrors(null);
        ctrl.markAsUntouched();
      }
    );
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
