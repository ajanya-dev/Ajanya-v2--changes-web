import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes, IApiResMesssage } from 'src/app/models/api';
import {
  ICheckDesignData,
  IImageCategories
} from 'src/app/models/check-design';
import {
  ICustomData,
  ICustomRestrictions
} from 'src/app/modules/check/model/check';
import { IGetExistLogo } from 'src/app/models/common';
import { IPremadeCheckTemplates } from 'src/app/modules/check-design/model/check-template';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CheckDesignService {
  ROOT_URL = environment.rootUrl;

  private http = inject(HttpClient);

  getDesign(bankAccountId: string) {
    return this.http.get<IApiRes<ICheckDesignData>>(
      `${this.ROOT_URL}/check-designs/${bankAccountId}`
    );
  }

  getTemplate(
    bankAccountId: string,
    templateId?: string,
    preTemplateId?: number
  ) {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    let params = new HttpParams();
    if (preTemplateId !== undefined) {
      params = params.append('preTemplateId', preTemplateId);
    }
    return this.http.get<IApiRes<ICheckDesignData>>(
      `${this.ROOT_URL}/check-designs/${bankAccountId}${
        templateId ? `/${templateId}` : ''
      }?${params}`,
      { headers: headerOptions }
    );
  }

  getImagesCategories(type: number) {
    return this.http.get<IApiRes<IImageCategories[]>>(
      `${this.ROOT_URL}/check-design-categories?type=${type}`
    );
  }

  /**
   * @description Method to get logos.
   * @param page - Pagination page number.
   * @param type - Type of logos.
   * @param table - Table number.
   * @param folder - Folder number.
   * @param category - Category number.
   * @returns Observable with list of logos.
   */
  getImages(
    page: number,
    type: number,
    table = 1,
    folder = 1,
    category?: number
  ): Observable<IApiRes<IGetExistLogo[]>> {
    return this.http.get<IApiRes<IGetExistLogo[]>>(
      `${this.ROOT_URL}/check-design-images?page=${page}&type=${type}&table=${table}&folder=${folder}&category=${category}`
    );
  }

  saveDesign(bankAccountId: string, body: any): Observable<any> {
    return this.http.post(
      `${this.ROOT_URL}/check-designs/${bankAccountId}`,
      body
    );
  }

  uploadImage(type: number, photo: File, nickName = ''): Observable<any> {
    const body = new FormData();
    body.append('photo', photo);
    body.append('nickName', nickName);
    return this.http.post(
      `${this.ROOT_URL}/check-design-images?type=${type}`,
      body
    );
  }

  saveSignOnScreen(signature: string, nickName: string) {
    const formData = new FormData();
    formData.append('signature', signature);
    formData.append('nickName', nickName);
    return this.http.post<IApiRes<IGetExistLogo>>(
      `${this.ROOT_URL}/signature`,
      formData
    );
  }

  sendSms(bankAccountId: string, phone: string): Observable<any> {
    const body = new FormData();
    body.append('phone', phone);
    return this.http.post(
      `${this.ROOT_URL}/signature/${bankAccountId}/send-sms`,
      body
    );
  }

  sendEmail(bankAccountId: string, email: string): Observable<any> {
    const body = new FormData();
    body.append('email', email);
    return this.http.post(
      `${this.ROOT_URL}/signature/${bankAccountId}/send-email`,
      body
    );
  }

  editNickName(id: string, nickName: string): Observable<any> {
    return this.http.put(
      `${this.ROOT_URL}/check-design-images/${id}/nickname`,
      { nickName }
    );
  }

  deleteImage(id: string, type: number): Observable<any> {
    return this.http.delete(
      `${this.ROOT_URL}/check-design-images/${id}?type=${type}`
    );
  }

  updateRouting(
    bankAccountId: string,
    data: string,
    type: number
  ): Observable<any> {
    const body = { bankAccountId, data, type };
    return this.http.put(`${this.ROOT_URL}/check-designs`, body);
  }

  updateDynamic(
    bankAccountId: string,
    data: string,
    type: string
  ): Observable<any> {
    const body = new FormData();
    body.append('bankAccountId', bankAccountId);
    body.append('data', data);
    body.append('type', type.toString());

    return this.http.post(
      `${this.ROOT_URL}/check-designs/dynamic-update`,
      body
    );
  }

  getPremadeTemplates(): Observable<IApiRes<IPremadeCheckTemplates>> {
    return this.http.get<IApiRes<IPremadeCheckTemplates>>(
      `${this.ROOT_URL}/check-designs/premade-templates`
    );
  }
  /**
   *add custom element
   */
  addCustomElement(data: {
    bankAccountId: string;
    customElement: string;
  }): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/check-designs/custom-elements`,
      data
    );
  }

  /**
   *edit custom element
   */
  editCustomElement(
    data: { bankAccountId: string; customElement: string },
    id: number
  ): Observable<IApiResMesssage> {
    return this.http.post<IApiResMesssage>(
      `${this.ROOT_URL}/check-designs/custom-elements/${id}`,
      data
    );
  }
  /**
   *delete custom element
   */
  deleteCustomElement(id: number): Observable<IApiResMesssage> {
    return this.http.delete<IApiResMesssage>(
      `${this.ROOT_URL}/check-designs/custom-element/delete/${id}`
    );
  }
  /**
   *get custom element
   */
  getCustomElements(): Observable<IApiRes<ICustomData>> {
    return this.http.get<IApiRes<ICustomData>>(
      `${this.ROOT_URL}/check-designs/custom-elements`
    );
  }
  /**
   *get user custom elements restriction
   */
  getCustomRestriction(): Observable<IApiRes<ICustomRestrictions>> {
    return this.http.get<IApiRes<ICustomRestrictions>>(
      `${this.ROOT_URL}/check-designs/custom-elements/user/restrictions`
    );
  }

  /**
   *get user custom elements restriction
   */
  cloneCheckDesign(data: {
    bankId: string;
    cloneToBankIds: string[];
  }): Observable<IApiRes<IApiResMesssage>> {
    return this.http.post<IApiRes<IApiResMesssage>>(
      `${this.ROOT_URL}/bank-clone-design/multi-clone`,
      data
    );
  }
}
