import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes, IApiResSuccessOnly } from 'src/app/models/api';
import { environment } from 'src/environments/environment';
import {
  IDocumentDetails,
  ICreateFieldRequest,
  ICreateFieldResponse,
  ISendDocumentRequest,
  ISendDocumentResponse,
  IRecipient,
  ISignatureField,
  ISubmitFieldValuesRequest,
  IFieldValue,
  IDocumentViewDetails,
  IActivity,
  IRequestSignResponse
} from '../model/zil-sing.model';

@Injectable({
  providedIn: 'root'
})
export class ZilSignService {
  private http = inject(HttpClient);
  ROOT_URL = environment.rootUrl;
  constructor() {}

  requestSign(data: FormData): Observable<IApiRes<IRequestSignResponse>> {
    return this.http.post<IApiRes<IRequestSignResponse>>(
      `${this.ROOT_URL}/zil-sign/request-sign`,
      data
    );
  }

  getDocumentDetails(
    documentId: string
  ): Observable<IApiRes<IDocumentDetails>> {
    return this.http.get<IApiRes<IDocumentDetails>>(
      `${this.ROOT_URL}/zil-sign/document/${documentId}`
    );
  }

  createField(
    documentId: string,
    fieldData: ICreateFieldRequest
  ): Observable<IApiRes<ICreateFieldResponse>> {
    return this.http.post<IApiRes<ICreateFieldResponse>>(
      `${this.ROOT_URL}/zil-sign/document/${documentId}/field`,
      fieldData
    );
  }

  updateField(
    documentId: string,
    fieldId: string,
    fieldData: Partial<ICreateFieldRequest>
  ): Observable<IApiRes<ICreateFieldResponse>> {
    return this.http.put<IApiRes<ICreateFieldResponse>>(
      `${this.ROOT_URL}/zil-sign/document/${documentId}/field/${fieldId}`,
      fieldData
    );
  }

  deleteField(
    documentId: string,
    fieldId: string
  ): Observable<IApiRes<string>> {
    return this.http.delete<IApiRes<string>>(
      `${this.ROOT_URL}/zil-sign/document/${documentId}/field/${fieldId}`
    );
  }

  saveFieldValue(
    documentId: string,
    fieldId: string,
    type: string,
    value: string,
    recipientId: number | null = null,
    filename?: string
  ): Observable<IApiRes<string>> {
    return this.http.put<IApiRes<string>>(
      `${this.ROOT_URL}/zil-sign/document/${documentId}/field/${fieldId}/value`,
      { type, value, recipientId, ...(filename ? { filename } : {}) }
    );
  }

  sendDocument(
    documentId: string,
    recipients: IRecipient[],
    fields: ISignatureField[]
  ): Observable<IApiRes<ISendDocumentResponse>> {
    const payload: ISendDocumentRequest = {
      documentId,
      recipients,
      fields
    };
    return this.http.post<IApiRes<ISendDocumentResponse>>(
      `${this.ROOT_URL}/zil-sign/document/${documentId}/send`,
      payload
    );
  }

  getDocumentByToken(token: string): Observable<IApiRes<IDocumentDetails>> {
    return this.http.get<IApiRes<IDocumentDetails>>(
      `${this.ROOT_URL}/zil-sign/sign/${token}`
    );
  }

  // Outside endpoint - no auth required
  getDocumentByTokenOutside(token: string): Observable<IApiRes<IDocumentDetails | IApiResSuccessOnly>> {
    return this.http.get<IApiRes<IDocumentDetails | IApiResSuccessOnly>>(
      `${this.ROOT_URL}/outside/zil-sign/sign/${token}`
    );
  }

  submitFieldValues(
    documentId: string,
    token: string,
    fields: IFieldValue[]
  ): Observable<IApiRes<string>> {
    const payload: ISubmitFieldValuesRequest = {
      documentId,
      token,
      fields
    };
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/zil-sign/document/${documentId}/submit-fields`,
      payload
    );
  }

  // Outside endpoint - no auth required
  submitFieldValuesOutside(
    documentId: string,
    token: string,
    fields: IFieldValue[]
  ): Observable<IApiRes<string>> {
    const payload: ISubmitFieldValuesRequest = {
      documentId,
      token,
      fields
    };
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/outside/zil-sign/document/${documentId}/submit-fields`,
      payload
    );
  }

  async fetchPdfData(pdfUrl: string): Promise<ArrayBuffer> {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.arrayBuffer();
  }

  // Document View APIs
  getDocumentViewDetails(
    documentId: string
  ): Observable<IApiRes<IDocumentViewDetails>> {
    return this.http.get<IApiRes<IDocumentViewDetails>>(
      `${this.ROOT_URL}/zil-sign/document/${documentId}/view`
    );
  }

  getDocumentActivities(documentId: string): Observable<IApiRes<IActivity[]>> {
    return this.http.get<IApiRes<IActivity[]>>(
      `${this.ROOT_URL}/zil-sign/document/${documentId}/activities`
    );
  }

  downloadDocument(documentId: string, fileId?: string): Observable<Blob> {
    const url = fileId
      ? `${this.ROOT_URL}/zil-sign/document/${documentId}/file/${fileId}/download`
      : `${this.ROOT_URL}/zil-sign/document/${documentId}/download`;
    return this.http.get(url, { responseType: 'blob' });
  }

  // Outside endpoint - no auth required - returns download URL
  getDownloadUrlOutside( token: string,): Observable<IApiRes<{ downloadUrl: string }>> {
    const url =`${this.ROOT_URL}/outside/zil-sign/document/${token}/download`;
    return this.http.get<IApiRes<{ downloadUrl: string }>>(url);
  }

  // Outside endpoint - no auth required - returns blob (kept for backward compatibility)
  downloadDocumentOutside(documentId: string, token: string, fileId?: string): Observable<Blob> {
    const url = fileId
      ? `${this.ROOT_URL}/outside/zil-sign/document/${documentId}/file/${fileId}/download?token=${token}`
      : `${this.ROOT_URL}/outside/zil-sign/document/${documentId}/download?token=${token}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  // Outside endpoint - email document to signee
  emailDocumentToSignee(token: string): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/outside/zil-sign/document/${token}/email-me`,
      {}
    );
  }

  resendDocument(documentId: string): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/zil-sign/document/${documentId}/resend`,
      {}
    );
  }

  cancelDocument(documentId: string): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/zil-sign/document/${documentId}/cancel`,
      {}
    );
  }

  duplicateDocument(documentId: string): Observable<IApiRes<{id: string}>> {
    return this.http.post<IApiRes<{id: string}>>(
      `${this.ROOT_URL}/zil-sign/document/${documentId}/duplicate`,
      {}
    );
  }

  deleteDocument(documentId: string): Observable<IApiRes<string>> {
    return this.http.delete<IApiRes<string>>(
      `${this.ROOT_URL}/zil-sign/document/${documentId}`
    );
  }

}
