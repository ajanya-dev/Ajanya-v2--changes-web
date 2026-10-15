import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { IRequestedDocsDetails } from 'src/app/models/docs';
// import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DocsUploadService {
  private _http = inject(HttpClient);

  ROOT_URL = environment.rootUrl;

  getRequestedDocsDetails(uuid: string, userId: string) {
    return this._http.get<IApiRes<IRequestedDocsDetails>>(
      `${this.ROOT_URL}/user-profile/requested-document/${userId}/${uuid}`
    );
  }

  uploadRequestedDocuments(data: FormData): Observable<IApiRes<string>> {
    return this._http.post<IApiRes<string>>(
      `${this.ROOT_URL}/user-profile/requested-document/upload`,
      data
    );
  }
}
