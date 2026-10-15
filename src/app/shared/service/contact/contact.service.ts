import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import {
  IContactBody,
  IGetContact
} from 'src/app/shared/modal/add-contact/model/contact';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  addContact(
    type: string,
    id: string,
    data: IContactBody
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/${type}/${id}/contacts`,
      data
    );
  }

  getAllContact(type: string, id: string): Observable<IApiRes<IGetContact[]>> {
    return this.http.get<IApiRes<IGetContact[]>>(
      `${this.ROOT_URL}/${type}/${id}/contacts`
    );
  }

  updateContact(
    type: string,
    id: string,
    data: string,
    body: IContactBody
  ): Observable<IApiRes<string>> {
    return this.http.post<IApiRes<string>>(
      `${this.ROOT_URL}/${type}/${id}/contacts/${data}`,
      body
    );
  }

  deleteContact(
    type: string,
    id: string,
    data: string
  ): Observable<IApiRes<string>> {
    return this.http.delete<IApiRes<string>>(
      `${this.ROOT_URL}/${type}/${id}/contacts/${data}`
    );
  }
}
