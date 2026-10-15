import { HttpErrorResponse } from '@angular/common/http';
import { GoogleAddressService } from './../../../../core/services/google-address.service';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
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
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { MatTabChangeEvent, MatTabGroup, MatTab } from '@angular/material/tabs';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  ICard,
  IFundWalletResponse,
  IUserDetails
} from 'src/app/models/wallet';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CardPaymentService } from 'src/app/shared/service/card-payment/card-payment.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { StripeScriptTag } from 'stripe-angular';
import { ControlMessageComponent } from '../../../components/control-message/control-message/control-message.component';
import { NgIf, NgFor, NgClass } from '@angular/common';

/**
 * @description Modal component for credit/debit card payment.
 */
@Component({
  selector: 'app-card-payment-modal',
  templateUrl: './card-payment-modal.component.html',
  styleUrls: ['./card-payment-modal.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    MatTabGroup,
    NgIf,
    MatTab,
    NgFor,
    NgClass,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    MatDialogActions
  ]
})
export class CardPaymentModalComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];

  selectedCard: ICard | null;
  selectedTabIndex = 0;
  card: any;
  stripe: stripe.Stripe;
  publishableKey: string;
  cardDetailsForm: UntypedFormGroup;

  error: string | null;
  cardHandler = this.onChange.bind(this);
  loading = true;

  // Stripe card elements
  @ViewChild('cardNumber') cardNumber: ElementRef;
  @ViewChild('cardExpiry') cardExpiry: ElementRef;
  @ViewChild('cardCvc') cardCvc: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA) public fundWallet: IFundWalletResponse,
    private cd: ChangeDetectorRef,
    private _dialogRef: MatDialogRef<CardPaymentModalComponent>,
    private _cardPaymentService: CardPaymentService,
    private _alertService: AlertService,
    private _stripeScriptTag: StripeScriptTag,
    public fb: UntypedFormBuilder,
    private _googleAddressService: GoogleAddressService
  ) {}

  ngOnInit(): void {
    this.getCredential();
    this.initCardDetailsForm(this.fundWallet?.data?.user_details);
    this._googleAddressService.resetGoogleAutocompleteAPI();
  }

  /**
   * @description Initialize card details form.
   * @param data
   */
  initCardDetailsForm(data: IUserDetails) {
    this.cardDetailsForm = this.fb.group({
      name: [data?.name, [Validators.required]],
      email: [
        data?.email,
        [Validators.required, ValidationService.emailValidator]
      ],
      address: this.fb.group({
        line1: [data?.address1, [Validators.required]],
        city: [data?.city, [Validators.required]],
        state: [data?.state, [Validators.required]],
        postal_code: [
          data?.zip,
          [Validators.required, ValidationService.zipValidator]
        ]
      })
    });
  }

  /**
   * @description Sets the selected card to `this.selectedCard`.
   * @param card
   */
  cardChange(card: ICard) {
    this.selectedCard = card;
  }

  /**
   * @description Sets the index of the selected index to `this.selectedIndex`.
   * @param event - selectedTabChange event.
   */
  onTabChange(event: MatTabChangeEvent) {
    this.selectedTabIndex = event?.index;
  }

  /**
   * @description loads credentials from card payment service and invokes `this.setPushlishableKey` method with the data, to set stripe publishable key from API.
   */
  getCredential() {
    this.subscriptions.push(
      this._cardPaymentService
        .getCredential()
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((data) => {
          if (data?.success) {
            this.publishableKey = data.data.publishableKey;
            this.setPushlishableKey(this.publishableKey);
          }
        })
    );
  }

  /**
   * @description Loads Google Address API.
   * @param address - address input HTML element.
   */
  loadGoogleAddress(address: HTMLInputElement) {
    this._googleAddressService.googleAutocomplete({ addressElement: address });

    const googleAddressSubscription =
      this._googleAddressService.googleAddress$.subscribe((res) => {
        this.cardDetailsForm.patchValue({
          address: {
            line1: res.address,
            city: res.city,
            state: res.state,
            postal_code: res.zip,
            country: res.country
          }
        });
        googleAddressSubscription.unsubscribe();
      });
  }

  /**
   * @description Sets stripe publishable key from API.
   * @param publishableKey - key from credentials data.
   */
  setPushlishableKey(publishableKey: string) {
    this._stripeScriptTag.setPublishableKey(publishableKey).then((stripe) => {
      this.stripe = stripe;
      const elements = stripe.elements();
      this.card = elements.create('cardNumber', { style: customStyle });
      const expiry = elements.create('cardExpiry', { style: customStyle });
      const cvc = elements.create('cardCvc', { style: customStyle });

      this.card.mount(this.cardNumber.nativeElement);
      expiry.mount(this.cardExpiry.nativeElement);
      cvc.mount(this.cardCvc.nativeElement);

      this.card.addEventListener('change', this.cardHandler);
    });
  }

  /**
   * @description Method invoked on Stripe input element change.
   * @param error - error object
   */
  onChange({ error }: HttpErrorResponse) {
    this.error = error ? error.message : null;
    this.cd.detectChanges();
  }

  /**
   * @description Creates data object for initiating stripe payment.
   */
  createPaymentBody() {
    let data = {};
    if (this.selectedTabIndex === 0 && this.fundWallet?.data?.cards?.length) {
      if (!this.selectedCard) {
        this._alertService.warningAlert({
          title: 'Error',
          content: 'Please select a card'
        });
        return;
      }
      data = { payment_method: this.selectedCard.id };
    } else {
      if (this.cardDetailsForm.invalid || this.error) {
        this.cardDetailsForm.markAllAsTouched();
        return;
      }
      data = {
        payment_method: {
          card: this.card,
          billing_details: this.cardDetailsForm.value
        },
        setup_future_usage: 'off_session'
      };
    }

    this.initiatePayment(data);
  }

  /**
   * @description Initiates Stripe payment.
   * @param data - data for initiating Stripe payment.
   */
  async initiatePayment(data: stripe.ConfirmCardPaymentData | undefined) {
    this.loading = true;
    const response = await this.stripe.confirmCardPayment(
      this.fundWallet?.data?.client_secret,
      data
    );
    if (response?.error) {
      this.postPaymentError(response);
      this._alertService.failedAlert({ content: response.error.message });
      this.loading = false;
    } else if (response?.paymentIntent) {
      this.completePayment(response.paymentIntent.id);
    }
  }

  /**
   * @description Method invoked
   * @param paymentIndentId - paymentIntent id received from response of  confirm card payment in `this.initiatePayment` method.
   */
  completePayment(paymentIndentId: string) {
    this.subscriptions.push(
      this._cardPaymentService
        .completePayment(paymentIndentId)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((data) => {
          if (data?.success) {
            this._dialogRef.close(data);
            this._alertService.successAlert({
              content: 'Payment successfull',
              close: true,
              timeout: 3000
            });
          }
        })
    );
  }

  /**
   * @description Sends Stripe payment error to server.
   * @param error - error object.
   */
  postPaymentError(error: stripe.PaymentIntentResponse) {
    this.subscriptions.push(
      this._cardPaymentService
        .paymentError(error)
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        .subscribe(
          () => {},
          (error) => {
            if (error.error?.errorCode) {
              this._alertService.failedAlert({
                title: 'Error',
                content: error.error?.errorMsg
              });
              this._dialogRef.close();
            }
          }
        )
    );
  }

  /**
   * @description Method invoked when delete card is clicked in template. Deletes selected card by invoking `this.deleteCard` method.
   * @param id - ID of selected card.
   * @param index - index.
   */
  deleteCardClick(id: string, index: number) {
    const confirmRef = this._alertService.confirmAlert({
      content: 'Are you sure you want to delete this card?',
      doneMsg: 'Yes',
      cancelMsg: 'No, cancel'
    });
    confirmRef.afterClosed().subscribe((res) => {
      if (res) {
        this.deleteCard(id, index);
      }
    });
  }

  /**
   * @description Method to delete saved cards.
   * @param id - ID of card.
   * @param index - index.
   */
  deleteCard(id: string, index: number) {
    this.loading = true;
    this.subscriptions.push(
      this._cardPaymentService
        .deleteCard(id)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe((data) => {
          if (data?.success) {
            this._alertService.successAlert({
              title: 'Success',
              content: 'Payment method deleted',
              close: true,
              timeout: 2000
            });
            this.fundWallet?.data?.cards.splice(index, 1);
            if (this.selectedCard?.id === id) {
              this.selectedCard = null;
            }
          }
        })
    );
  }

  ngOnDestroy(): void {
    this.card.removeEventListener('change', this.cardHandler);
    this.card.destroy();
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}

// Custom style for stripe input elements
const customStyle = {
  base: {
    fontWeight: '400',
    fontFamily: 'Roboto, sans-serif',
    fontSize: '15px',
    fontSmoothing: 'antialiased',
    ':-webkit-autofill': {
      color: '#fce883'
    },
    '::placeholder': {
      color: '#b2b5ce'
    }
  },

  invalid: {
    iconColor: '#FFC7EE',
    color: '#f84444'
  }
};
