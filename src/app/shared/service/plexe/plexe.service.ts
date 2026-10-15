import { IApiRes } from 'src/app/models/api';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  IAgreementData,
  IApplicationData,
  IApplicationDetails,
  IApplicationStatus,
  ICalcSendData,
  ICalculationData,
  IInitialWithdrawelData,
  ILoanData,
  IOtpResponse,
  IPrimaryBankData,
  IRequiredDocument,
  ITransactionData,
  IVerifiedBankList,
  IWithdrawData
} from 'src/app/modules/business-tools/plexe/model/plexe';

@Injectable({
  providedIn: 'root'
})
export class PlexeService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  getAllYodleeConnectedBanks(): Observable<IApiRes<IVerifiedBankList[]>> {
    return this.http.get<IApiRes<IVerifiedBankList[]>>(
      `${this.ROOT_URL}/working-capital/on-board/not-verified-and-yodlee-banks`
    );
  }

  applicationSumbit(applicationData: {
    businessKybId: string;
    bankAccount: string[];
  }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/working-capital/on-board`,
      applicationData
    );
  }

  getApllicationStatus(): Observable<{ success: boolean; status: number }> {
    return this.http.get<{ success: boolean; status: number }>(
      `${this.ROOT_URL}/working-capital/application/application-status`
    );
  }

  getUserApplications(): Observable<IApiRes<IApplicationStatus[]>> {
    return this.http.get<IApiRes<IApplicationStatus[]>>(
      `${this.ROOT_URL}/working-capital/application`
    );
  }

  getApplicationsDetails(
    onboardId: string
  ): Observable<IApiRes<IApplicationDetails>> {
    return this.http.get<IApiRes<IApplicationDetails>>(
      `${this.ROOT_URL}/working-capital/application/offer/${onboardId}`
    );
  }

  addPrimaryDetails(
    onboardId: string,
    applicationData: IApplicationData
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/working-capital/application/add-primary-applicant-details/${onboardId}`,
      applicationData
    );
  }

  gePrimarytBankList(onboardId: string): Observable<IApiRes<IPrimaryBankData>> {
    return this.http.get<IApiRes<IPrimaryBankData>>(
      `${this.ROOT_URL}/working-capital/application/get-all-bank-accounts/${onboardId}`
    );
  }

  setPrimaryBank(
    onboardId: string,
    bankData: { bankId: string }
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/working-capital/application/set-primary-bank/${onboardId}`,
      bankData
    );
  }

  gePlexeAgreement(onboardId: string): Observable<IApiRes<IAgreementData>> {
    return this.http.get<IApiRes<IAgreementData>>(
      `${this.ROOT_URL}/working-capital/application/get-contract-details/${onboardId}`
    );
  }

  setSignContract(
    onboardId: string,
    signData: { signature: string; signature2: string }
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/working-capital/application/sign-contract/${onboardId}`,
      signData
    );
  }

  getRequiredDocuments(
    onboardId: string
  ): Observable<IApiRes<IRequiredDocument[]>> {
    return this.http.get<IApiRes<IRequiredDocument[]>>(
      `${this.ROOT_URL}/working-capital/application/get-required-documents/${onboardId}`
    );
  }

  addDocument(
    onboardId: string,
    documentData: FormData
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.ROOT_URL}/working-capital/application/submit-required-document/${onboardId}`,
      documentData
    );
  }

  getPlexiCalculation(
    applicationId: string,
    calculateData: ICalcSendData
  ): Observable<IApiRes<ICalculationData>> {
    return this.http.post<IApiRes<ICalculationData>>(
      `${this.ROOT_URL}/working-capital/application/application-loc-calculation/${applicationId}`,
      calculateData
    );
  }

  getInitiateWithdrawalAndSendOTP(
    applicationId: string,
    calculateData: ICalcSendData
  ): Observable<IApiRes<IInitialWithdrawelData>> {
    return this.http.post<IApiRes<IInitialWithdrawelData>>(
      `${this.ROOT_URL}/working-capital/application/make-credit-withdrawal/${applicationId}`,
      calculateData
    );
  }

  getCompleteWithdrawalAndVerifyOTP(
    applicationId: string,
    sendingData: ILoanData
  ): Observable<IOtpResponse> {
    return this.http.post<IOtpResponse>(
      `${this.ROOT_URL}/working-capital/application/confirm-credit-withdrawal/${applicationId}`,
      sendingData
    );
  }

  resendWithdrawalOtp(applicationId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/working-capital/application/resend-credit-withdrawal-otp/${applicationId}`,
      {}
    );
  }

  getPlexeTransactions(
    loanId: string,
    skip: number | undefined,
    take: number | undefined
  ): Observable<IApiRes<ITransactionData>> {
    return this.http.get<IApiRes<ITransactionData>>(
      `${this.ROOT_URL}/working-capital/transaction/get-transactions/${loanId}?skip=${skip}&take=${take}`
    );
  }

  getPlexeWithdrawels(
    loanId: string,
    skip: number,
    take: number
  ): Observable<IApiRes<IWithdrawData>> {
    return this.http.get<IApiRes<IWithdrawData>>(
      `${this.ROOT_URL}/working-capital/transaction/get-withdrawals/${loanId}?skip=${skip}&take=${take}`
    );
  }

  checkKybEin(loanId: string): Observable<{ success: boolean }> {
    return this.http.get<{ success: boolean }>(
      `${this.ROOT_URL}/working-capital/application/check-kyb-ein/${loanId}`
    );
  }

  updateBankAccounts(
    onboardId: string,
    applicationData: { bankAccountIds: string[] }
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/working-capital/application/update-bank-accounts/${onboardId}`,
      applicationData
    );
  }
}
