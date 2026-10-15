import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdpRunV2Service {

  ROOT_URL = environment.rootUrl;

  private http = inject(HttpClient);

  getDashboardData() {
    return this.http.get(`${this.ROOT_URL}/adprun/v2/dashboard`);
  }


  syncEmployee() {
    return this.http.post(`${this.ROOT_URL}/integrations/adp/runv2/sync_employee`, {});
  }
  
  getData() {
    return this.http.get(`${this.ROOT_URL}/adprun/v2/get_data`);
  }
}
