import { IApiRes } from './../../../models/api';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  IDeleteAccount,
  IReasonData,
  IReasonForClosing
} from 'src/app/models/user';

@Injectable({
  providedIn: 'root'
})
export class ColseAccountService {
  ROOT_URL = environment.rootUrl;

  constructor(private http: HttpClient) {}

  /**
   * @description Method for confirming password by submitting the username and password for account closing.
   * @param data - username and password.
   * @returns Observable with success status.
   */
  confirmPassword(data: {
    username: string;
    password: string;
  }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/close-account`,
      data
    );
  }

  deleteAccount(data: IReasonData): Observable<IDeleteAccount> {
    return this.http.post<IDeleteAccount>(
      `${this.ROOT_URL}/close-account/delete`,
      data
    );
  }

  /**
   * @description Method for restoring account by submitting the username and password.
   * @param data - username and password.
   * @returns Observable with success status.
   */
  restoreAccount(data: {
    username: string;
    password: string;
  }): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.ROOT_URL}/close-account/restore`,
      data
    );
  }

  reasonsforClosing(): Observable<IApiRes<IReasonForClosing[]>> {
    return this.http.get<IApiRes<IReasonForClosing[]>>(
      `${this.ROOT_URL}/close-account/reasons`
    );
  }
}
