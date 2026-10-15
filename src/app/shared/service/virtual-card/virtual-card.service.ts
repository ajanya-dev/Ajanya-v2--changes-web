import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ISendRecievedVirtualCardInfo,
  ISendReceiveVirtualCard,
  IVirtualCardTxn
} from 'src/app/data/data/virtual-card';
import { IApiRes } from 'src/app/models/api';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VirtualCardService {
  ROOT_URL = environment?.rootUrl;

  constructor(private http: HttpClient) {}

  private headerOptions = new HttpHeaders({
    'Content-Type': 'application/json',
    isDisable422: 'true'
  });

  getRecievedCards(term: string = ''): Observable<{
    success: boolean;
    total: number;
    data: ISendReceiveVirtualCard[];
    message?: string;
  }> {
    return this.http.get<{
      success: boolean;
      total: number;
      data: ISendReceiveVirtualCard[];
      message?: string;
    }>(`${this.ROOT_URL}/virtual-card/recieved?term=${term}`, {
      headers: this.headerOptions
    });
  }

  recievedCardDetails(
    card_id: string
  ): Observable<IApiRes<ISendRecievedVirtualCardInfo>> {
    return this.http.get<IApiRes<ISendRecievedVirtualCardInfo>>(
      `${this.ROOT_URL}/virtual-card/recieved/${card_id}`,
      { headers: this.headerOptions }
    );
  }

  sendCards(): Observable<{
    success: boolean;
    total: number;
    data: ISendReceiveVirtualCard[];
  }> {
    return this.http.get<{
      success: boolean;
      total: number;
      data: ISendReceiveVirtualCard[];
    }>(`${this.ROOT_URL}/virtual-card/send`, { headers: this.headerOptions });
  }

  recievedTransaction(
    card_id: string,
    page: number,
    limit: number
  ): Observable<{ success: boolean; total: number; data: IVirtualCardTxn[] }> {
    return this.http.get<{
      success: boolean;
      total: number;
      data: IVirtualCardTxn[];
    }>(
      `${this.ROOT_URL}/virtual-card/recieved/${card_id}/transactions?limit=${limit}&page=${page}`,
      { headers: this.headerOptions }
    );
  }

  sendeCardDetails(
    card_id: string
  ): Observable<IApiRes<ISendRecievedVirtualCardInfo>> {
    return this.http.get<IApiRes<ISendRecievedVirtualCardInfo>>(
      `${this.ROOT_URL}/virtual-card/send/${card_id}`,
      { headers: this.headerOptions }
    );
  }

  sendTransaction(
    card_id: string,
    page: number,
    limit: number
  ): Observable<{ success: boolean; total: number; data: IVirtualCardTxn[] }> {
    return this.http.get<{
      success: boolean;
      total: number;
      data: IVirtualCardTxn[];
    }>(
      `${this.ROOT_URL}/virtual-card/send/${card_id}/transactions?limit=${limit}&page=${page}`,
      { headers: this.headerOptions }
    );
  }
}
