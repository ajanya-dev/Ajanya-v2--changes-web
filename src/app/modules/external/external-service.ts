import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ExternalRepository } from './external-repository';
import { ITrackingDetails } from './external-interface';

@Injectable({
  providedIn: 'root'
})
export class ExternalService {
  externalRepository = inject(ExternalRepository);
  /**
   * Retrieves mail tracking data for a specified tracking code.
   *
   * @param {string | null} trackingCode - The tracking code to query.
   * @returns {Observable<ITrackingDetails>} Observable emitting the tracking details.
   */
  getMailTrackingData(
    trackingCode: string | undefined
  ): Observable<ITrackingDetails> {
    return this.externalRepository.getMailTrackingDetails(trackingCode);
  }

  downloadProof(trackindCode: string) {
    return this.externalRepository.downloadMailTrackProof(trackindCode);
  }
}
