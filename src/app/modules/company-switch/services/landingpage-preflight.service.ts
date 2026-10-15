import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { environment } from 'src/environments/environment';

/**
 * @description Service for landing page prerequisite data
 * like plugins and etc...
 * @class Service Class
 */
@Injectable({
  providedIn: 'root'
})
export class LandingPagePreflightService {
  constructor(private http: HttpClient) {}

  ROOT_URL = environment.rootUrl;

  /**
   * @description Api for getting user plugins data.
   * we get all of the user plugins from bankend with this api
   * @returns - an observable containing user plugins array in data key of response.
   */
  getPluginsCollectionApi(): Observable<IApiRes<string[]>> {
    return this.http.get<IApiRes<string[]>>(
      `${this.ROOT_URL}/user-profile/enabled-plugins`
    );
  }
}
