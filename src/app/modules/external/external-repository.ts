import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IApiRes } from 'src/app/models/api';
import { ITrackingDetails } from './external-interface';

@Injectable({
  providedIn: 'root'
})
export class ExternalRepository {
  private ROOT_URL = environment.rootUrl;
  private http = inject(HttpClient);

  /**
   * Fetches tracking details for a given mail shipment.
   *
   * @param {string | undefined} trackingCode - The tracking code of the shipment.
   * @returns {Observable<ITrackingDetails>} An Observable that emits the tracking details.
   */
  getMailTrackingDetails(
    trackingCode: string | undefined
  ): Observable<ITrackingDetails> {
    return this.http.get<ITrackingDetails>(
      `${this.ROOT_URL}/outside/mail-tracking?tracking_code=${trackingCode}`
    );
  }

  downloadMailTrackProof(trackingCode: string) {
    return this.http.get<IApiRes<string>>(
      `${this.ROOT_URL}/outside/mail-delivery-proof?tracking_code=${trackingCode}`
    );
  }
}
