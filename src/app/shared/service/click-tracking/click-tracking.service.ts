import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Interface for click tracking payload data.
 */
export interface IClickTracking {
  feature: number;
  txn_ref_id?: string;
  type: number;
}

/**
 * Enum for click tracking features.
 */
export enum ClickTrackFeatures {
  'card_toast' = 1,
  'book_a_demo' = 3,
  'international_payment' = 4
}

/**
 * Enum for click tracking types.
 */
export enum ClickTrackTypes {
  'txn_done' = 1,
  'txn_not_done' = 2,
  'no_txn' = 3
}

interface IClickTrackingRes {
  message: string;
  success: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ClickTrackingService {
  private http = inject(HttpClient);
  isClickedOnToast = signal(false);
  isPaymentDone = signal(false);
  ROOT_URL = environment.rootUrl;

  /** ===================================================================== For credit card section [ START ]===================================================================== */

  /**
   * Sets the status to indicate the toast was clicked and the payment is not done.
   */
  onTrackNow(): void {
    this.isClickedOnToast.set(true);
    this.isPaymentDone.set(false);
  }

  /**
   * Updates the signal status to indicate the payment is done and set toast is not clicked.
   */
  onUpdateSignalStaus(): void {
    this.isPaymentDone.set(true);
    this.isClickedOnToast.set(false);
  }

  /**
   * Checks if the toast was clicked but the payment was not done, updates the signals accordingly.
   * @returns {boolean} True if the toast was clicked and the payment was not done, otherwise false.
   */
  isCcToastClickedNoPaymentDone(): boolean {
    if (!this.isPaymentDone() && this.isClickedOnToast()) {
      this.isClickedOnToast.update(() => false);
      this.isPaymentDone.update(() => false);
      return true;
    }
    return false;
  }

  /**
   * Tracks the event when the toast is clicked but the payment is not done.
   * @returns {Observable<any> | null} Observable from the tracking request or null if the conditions are not met.
   */
  ccToastClickedNoPaymentDone(): Observable<IClickTrackingRes> | null {
    if (this.isCcToastClickedNoPaymentDone()) {
      return this.clickTracking({
        feature: ClickTrackFeatures.card_toast,
        type: ClickTrackTypes.txn_not_done
      });
    }
    return null;
  }

  /**
   * Tracks the event when the toast is clicked and the payment is done.
   * @param {string} txnRefId - The transaction reference ID.
   * @returns {Observable<any> | null} Observable from the tracking request or null if the toast was not clicked.
   */
  ccToastClickedPaymentDone(
    txnRefId: string
  ): Observable<IClickTrackingRes> | null {
    if (this.isClickedOnToast()) {
      this.onUpdateSignalStaus();
      return this.clickTracking({
        feature: ClickTrackFeatures.card_toast,
        type: ClickTrackTypes.txn_done,
        txn_ref_id: txnRefId
      });
    }
    return null;
  }

  /** ===================================================================== For credit card section [ END ]===================================================================== */

  /** ===================================================================== For Book a Demo [ START ]===================================================================== */

  /**
   * Tracks the event when clicked on book a demo.
   * @returns {Observable<any> | null} Observable from the tracking request or null if the toast was not clicked.
   */
  trackBookDemoClick(): Observable<IClickTrackingRes> {
    return this.clickTracking({
      feature: ClickTrackFeatures.book_a_demo,
      type: ClickTrackTypes.no_txn
    });
  }

  /** ===================================================================== For Book a Demo [ END ]===================================================================== */



    /** ===================================================================== For International Payment Tracking [ START ]===================================================================== */

  /**
   * Tracks the event when clicked on international payment.
   * @returns {Observable<any> | null} Observable from the tracking request or null if the toast was not clicked.
   */
  trackInternationalPaymentClick(): Observable<IClickTrackingRes> {
    return this.clickTracking({
      feature: ClickTrackFeatures.international_payment,
      type: ClickTrackTypes.no_txn
    });
  }

  /**
   * Tracks the event when clicked on international payment transaction done.
   * @returns {Observable<any> | null} Observable from the tracking request or null if the toast was not clicked.
   */
  trackInternationalPaymentTransactionDoneClick(txnRefId: string): Observable<IClickTrackingRes> {
    return this.clickTracking({
      feature: ClickTrackFeatures.international_payment,
      type: ClickTrackTypes.txn_done, 
      txn_ref_id: txnRefId
    });
  }


  /**
   * Tracks the event when clicked on international payment transaction not done.
   * @returns {Observable<any> | null} Observable from the tracking request or null if the toast was not clicked.
   */
  trackInternationalPaymentTransactionNotDoneClick(): Observable<IClickTrackingRes> {
    return this.clickTracking({
      feature: ClickTrackFeatures.international_payment,
      type: ClickTrackTypes.txn_not_done,
    });
  }

    /** ===================================================================== For International Payment Tracking [ END ]===================================================================== */


  /**
   * Sends a click tracking event to the server.
   * @param {IClickTracking} payloadData - The data payload for the tracking event.
   * @returns {Observable<any>} Observable from the HTTP POST request.
   */
  clickTracking(payloadData: IClickTracking): Observable<IClickTrackingRes> {
    return this.http.post<IClickTrackingRes>(
      `${this.ROOT_URL}/user-track/event`,
      payloadData
    );
  }
}
