import { IApiRes, IApiResSuccessOnly } from './../../../models/api';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { IPersonaVerificationStatus } from 'src/app/models/user';
import { IBusinessDetails } from 'src/app/models/bank';
import { IUserBusiness } from 'src/app/modules/common-verification/model/common-verification';

@Injectable({
  providedIn: 'root'
})
export class CommonVerificationService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  kycVerification(data: FormData): Observable<any> {
    return this.http.post<any>(
      `${this.ROOT_URL}/common-verification/kyc`,
      data
    );
  }

  kybVerification(data: FormData): Observable<IApiRes<{ id: string }>> {
    return this.http.post<IApiRes<{ id: string }>>(
      `${this.ROOT_URL}/common-verification/kyb`,
      data
    );
  }

  applicationStatus(): Observable<
    IApiRes<{ kybStatus: number; kycStatus: number }>
  > {
    return this.http.get<any>(
      `${this.ROOT_URL}/common-verification/application-status`
    );
  }

  getUserBusinesses() {
    return this.http.get<IApiRes<IBusinessDetails[]>>(
      `${this.ROOT_URL}/common-verification/kyb`
    );
  }

  getUserBusinessesList(
    page?: number,
    term?: string
  ): Observable<IApiRes<IUserBusiness[]>> {
    let params = new HttpParams();
    if (page) {
      params = params.append('page', page);
    }
    if (term) {
      params = params.append('term', term);
    }
    return this.http.get<IApiRes<IUserBusiness[]>>(
      `${this.ROOT_URL}/common-verification/kyb-business-list`,
      { params }
    );
  }

  bankAchApplication(body: { businessId: string; bankAccountId?: string }) {
    return this.http.post<any>(
      `${this.ROOT_URL}/banking-ach-application/apply-ach`,
      body
    );
  }

  checkPersonaVerificationStatus(): Observable<
    IApiRes<IPersonaVerificationStatus>
  > {
    return this.http.get<IApiRes<IPersonaVerificationStatus>>(
      `${this.ROOT_URL}/persona-verifications`
    );
  }

  getUserBusinessName(id: string) {
    return this.http.get<IApiRes<IBusinessDetails>>(
      `${this.ROOT_URL}/common-verification/kyb/${id}`
    );
  }

  /**
   * Resumes the EDD verification process using Persona.
   * @param eddInquiryId - The ID of the EDD inquiry to resume.
   * @returns An observable of the API response.
   */
  resumeEddVerification(eddInquiryId: string): Observable<IApiRes<{ success: boolean; data: { inquiry_id: string; session_token: string } }>> {
    return this.http.post<IApiRes<{ success: boolean; data: { inquiry_id: string; session_token: string } }>>(
      `${this.ROOT_URL}/persona-verifications/inquiry/${eddInquiryId}/resume`,
      {}
    );
  }

  /**
   * Completes the EDD verification process using the API.
   * @param inquiryId - The ID of the EDD inquiry to complete.
   * @returns An observable of the API response.
   */
  completeEddVerification(inquiryId: string): Observable<IApiRes<void>> {
    return this.http.post<IApiRes<void>>(
      `${this.ROOT_URL}/persona-verifications/edd-inquiry-success/${inquiryId}`,
      {}
    );
  }

    /**
   * Resumes the enterprise verification process using Persona.
   * @param eddInquiryId - The inquiry Id to resume.
   * @returns An observable of the API response.
   */
    resumeEnterpriseVerification(eddInquiryId: string): Observable<IApiRes< { inquiry_id: string; session_token: string } >> {
      return this.http.post<IApiRes<{  inquiry_id: string; session_token: string  }>>(
        `${this.ROOT_URL}/persona-verifications/inquiry/${eddInquiryId}/onboarding-session`,
        {}
      );
    }

    /**
   * Complete the enterprise verification process using Persona.
   * @param eddInquiryId - The inquiry Id to mark completion.
   * @returns An observable of the API response.
   */
    completeEnterpriseVerification(inquiryId:string){
      return this.http.post<IApiResSuccessOnly>(`${this.ROOT_URL}/persona-verifications/inquiry/${inquiryId}/onboarding-save`,{});
    }
}
