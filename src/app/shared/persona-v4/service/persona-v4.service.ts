// import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Channel } from 'pusher-js';
import { Observable } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import {
  IInquiryDetails,
  INewPersonaInquiryRes,
  IPriorKycCheck,
  ISubmissionInfo
} from '../model/persona-v4';

@Injectable({
  providedIn: 'root'
})
export class PersonaV4Service {
  ROOT_URL = environment.rootUrl;

  private http = inject(HttpClient);
  private localStorageService = inject(LocalStorageService);
  pusherChannels: Channel[] = [];

  /**
   * Checks whether the current user has a prior KYC from another business
   * they own. Called once on modal open to decide whether to prompt the user
   * to reuse the prior KYC. Rejected KYC is filtered out server-side, so a
   * truthy `has_prior_kyc` always represents a reusable KYC.
   */
  checkPriorKyc(): Observable<IApiRes<IPriorKycCheck>> {
    return this.http.get<IApiRes<IPriorKycCheck>>(
      `${this.ROOT_URL}/persona-verifications/inquiry/check-prior-kyc`
    );
  }

  getInquiryIdNewPersona(
    inquiryType: 'kyc' | 'kyb' | 'kyc_kyb',
    sourceType: string,
    isTryAgain?: boolean,
    reVerificationId?: string,
    priorKyc?: 'apply'
  ): Observable<IApiRes<INewPersonaInquiryRes>> {
    let url = `${this.ROOT_URL}/persona-verifications/inquiry/create`;

    // If isTryAgain is true, append retry=1 to the URL
    if (isTryAgain) {
      url += '?retry=1';
    }

    const body: {
      inquiry_type: string;
      source: string;
      ui_version: string;
      re_verification_id?: string;
      prior_kyc?: string;
    } = {
      inquiry_type: inquiryType,
      source: sourceType,
      ui_version:
        this.localStorageService.getItem('isV4LayoutEnabled') === 1
          ? 'V2'
          : 'V1'
    };

    if (reVerificationId) {
      body.re_verification_id = reVerificationId;
    }

    if (priorKyc) {
      body.prior_kyc = priorKyc;
    }

    return this.http.post<IApiRes<INewPersonaInquiryRes>>(url, body);
  }

  getSubmissionInfo(inquiryId: string): Observable<IApiRes<ISubmissionInfo>> {
    return this.http.get<IApiRes<ISubmissionInfo>>(
      `${this.ROOT_URL}/persona-verifications/inquiry/${inquiryId}/submission-info`
    );
  }

  getInquiryDetails(inquiryId: string): Observable<IApiRes<IInquiryDetails>> {
    return this.http.get<IApiRes<IInquiryDetails>>(
      `${this.ROOT_URL}/persona-verifications/inquiry/${inquiryId}/inquiry-details`
    );
  }
}
