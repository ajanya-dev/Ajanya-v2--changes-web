import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

interface npsResponse {
  success: boolean;
}

interface npsFormBody {
  score: number;
  comment: any;
}

@Injectable({
  providedIn: 'root'
})
export class NpsService {
  constructor(private http: HttpClient) {}
  ROOT_URL = environment.rootUrl;

  private showNps$ = new BehaviorSubject<boolean>(false);

  /**
   * @description API function to handles the showing of nps page.
   * @returns boolean
   */
  getNPSVal(): Observable<boolean> {
    return this.showNps$.asObservable();
  }

  /**
   * @description API function to handles the showing of nps page.
   * @returns boolean
   */
  setNPSVal(value: boolean): void {
    this.showNps$.next(value);
  }

  /**
   * @description API function to Save nps score.
   * @param data -Payload for the API
   */
  saveNpsScore(data: npsFormBody): Observable<npsResponse> {
    return this.http.post<npsResponse>(`${this.ROOT_URL}/nps/`, data);
  }

  /**
   * @description API function to handles nps remider close action.
   * @param data -Payload for the API
   */
  remindMeLater(data: undefined): Observable<npsResponse> {
    return this.http.post<npsResponse>(
      `${this.ROOT_URL}/nps/remind-later/`,
      data
    );
  }
}
