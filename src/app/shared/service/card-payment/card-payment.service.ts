import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Renderer2, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { IApiRes, IApiResMesssage, IApiResWithMsg } from 'src/app/models/api';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import {
  ThreeDSComplete,
  ThreeDSError,
  ThreeDSFailure,
  ThreeDsInstance
} from 'src/app/modules/cards/components/v35/models/cards-ocw-v35.interface';
import { MapSourceWithBusinessModalComponent } from 'src/app/modules/payments/shared/modal/map-source-with-business-modal/map-source-with-business-modal.component';
import { environment } from 'src/environments/environment';

interface ICardCredential {
  publishableKey: string;
}

declare let Gateway: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create: (token: string) => any;
};

@Injectable({
  providedIn: 'root'
})
export class CardPaymentService {
  ROOT_URL = environment.rootUrl;
  private dialog = inject(MatDialog);

  constructor(private http: HttpClient) {}

  private gatewayLoaded = false;

  hasThreeDsChallenge = signal(false);

  validateCardWith3ds(
    { customerVaultId, gatewayType }: IExistingCreditCards,
    amount: number | string,
    publicKey: string,
    renderer: Renderer2,
    onReady: (instance: ThreeDsInstance) => void,
    challenge: () => void | null
  ) {
    return new Promise<
      | {
          success: true;
          data: ThreeDSComplete | null;
          instance: ThreeDsInstance | null;
        }
      | {
          success: false;
          message: string;
          instance: ThreeDsInstance | null;
        }
    >((res) => {
      if (gatewayType !== 2) {
        res({ success: true, data: null, instance: null });
        return;
      }

      const onload = () => {
        this.gatewayLoaded = true;
        const gateway = Gateway.create(publicKey);

        const threeDS = gateway.get3DSecure();

        const threeDSI = threeDS.createUI({
          customerVaultId,
          currency: 'USD',
          amount
        });

        gateway.on('error', () => {
          res({
            success: false,
            message: 'Something went wrong',
            instance: threeDSI
          });
        });

        onReady(threeDSI);

        threeDSI.start('#threeDSMountPoint');

        threeDSI.on('challenge', challenge);

        threeDSI.on('complete', (e: ThreeDSComplete) => {
          threeDSI.unmount();
          res({ success: true, data: e, instance: threeDSI });
        });

        threeDSI.on('_debug', (e: ThreeDSError) => {
          res({ success: false, message: e.message, instance: threeDSI });
        });

        threeDSI.on('failure', (e: ThreeDSFailure) => {
          res({ success: false, message: e.message, instance: threeDSI });
        });
      };

      if (this.gatewayLoaded) {
        onload();
        return;
      }

      const script = this.createScriptTag(
        'https://secure.networkmerchants.com/js/v1/Gateway.js',
        renderer,
        'ocw-gateway-script'
      );

      script.onload = onload;
      script.onerror = () => {
        res({
          success: false,
          message: 'Something went wrong',
          instance: null
        });
      };

      renderer.appendChild(document.head, script);
    });
  }

  createScriptTag(
    src: string,
    renderer: Renderer2,
    id?: string,
    dataset?: Record<string, string>
  ) {
    const script = renderer.createElement('script') as HTMLScriptElement;
    script.src = src;

    if (id) {
      script.id = id;
    }

    if (dataset) {
      Object.assign(script.dataset, dataset);
    }

    return script;
  }

  getCredential(): Observable<IApiRes<ICardCredential>> {
    return this.http.get<IApiRes<ICardCredential>>(
      `${this.ROOT_URL}/card-payment/credential`
    );
  }

  completePayment(
    paymentIntentId: string
  ): Observable<IApiResWithMsg<{ transaction_id: string }>> {
    return this.http.post<IApiResWithMsg<{ transaction_id: string }>>(
      `${this.ROOT_URL}/card-payment/success`,
      { paymentIntentId },
      { headers: { 'X-Track-Payment-Timeout': 'true' } }
    );
  }

  paymentError(
    error: stripe.PaymentIntentResponse
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/card-payment/payment-error`,
      error
    );
  }

  deleteCard(cardId: string): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/card-payment/payment-method/${cardId}`
    );
  }

  completeCardMapping(cardId: string, kybId: string): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/payment-methods/card/map-card-to-kyb`,
      { card_id: cardId, kyb_id: kybId }
    );
  }

  openMapSourceWithBusinessModal(card: IExistingCreditCards) {
    return this.dialog.open(MapSourceWithBusinessModalComponent, {
      maxWidth: '430px',
      width: '100%',
      disableClose: true,
      autoFocus: false,
      panelClass: 'paddingless-modal',
      data: {
        type: 'card',
        card
      }
    });
  }
}
