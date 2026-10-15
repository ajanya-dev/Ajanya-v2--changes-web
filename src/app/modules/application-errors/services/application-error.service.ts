import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IApiRes } from 'src/app/models/api';
import { environment } from 'src/environments/environment';
import {
  IApplicationErrorData,
  IApplicationErrorStats
} from '../model/application-error';

@Injectable({
  providedIn: 'root'
})
export class ApplicationErrorService {
  private http = inject(HttpClient);

  rootUrl = environment.rootUrl;

  getApplicationErrors(id: string) {
    return this.http.get<IApiRes<IApplicationErrorData>>(
      `${this.rootUrl}/application-errors/${id}`
    );
  }

  getApplicationErrorStatus() {
    return this.http.get<IApiRes<IApplicationErrorStats>>(
      `${this.rootUrl}/application-errors/stats`
    );
  }
}
