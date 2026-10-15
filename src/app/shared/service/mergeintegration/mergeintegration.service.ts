import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { IFreeAgentData } from 'src/app/modules/integration/model/integration';
import { environment } from 'src/environments/environment';
declare let MergeLink: any;

@Injectable({
  providedIn: 'root'
})
export class MergeintegrationService {
  isConnectedSuccess = new Subject<string>();
  private ROOT_URL = environment.rootUrl;
  previousToken: string;
  publicToken: string;

  constructor(private http: HttpClient) {}

  /**
   * @description Initializes and opens a merge link with the provided token.
   * If a token is available, it clears the stored link token, initializes MergeLink,
   * opens the link, and displays the corresponding iframe if hidden.
   *
   * @param  token - The merge link token.
   * @param  app - The name of the application.
   *
   */
  mergeLink(token: string, app: string): void {
    if (token) {
      MergeLink.linkToken = '';
      MergeLink.initialize({
        linkToken: token,
        onSuccess: (public_token: string) => this.onSuccesss(public_token, app),
        shouldSendTokenOnSuccessfulLink: false
      });
      MergeLink.openLink();
      const iframe = document.getElementById(
        'merge-link-iframe'
      ) as HTMLIFrameElement;
      if (iframe && iframe.style.display === 'none') {
        iframe.style.display = 'block';
      }
    }
  }

  /**
   * @description Handles the success callback after obtaining a token from MergeLink.
   * If the token is the same as the previous token, it returns early.
   * Updates the previous token with the current token.
   * Sets the public token and performs further actions if a token is available.
   * Sends the account token, notifies the successful connection, and unsubscribes from the accountToken subscription.
   *
   * @param  token - The public token obtained from MergeLink.
   * @param  app - The name of the application.
   */
  onSuccesss(token: string, app: string): void {
    if (token === this.previousToken) {
      return;
    }
    this.previousToken = token;

    this.publicToken = token;
    if (token) {
      const accountToken = this.sendAccountToken(token).subscribe(() => {
        this.isConnectedSuccess.next(app);

        accountToken.unsubscribe();
      });
    }
  }

  /**
   * @description Sends the account token to the backend API for connecting with a third-party application.
   * Performs the necessary HTTP request to establish the connection.
   *
   * @param token - The account token to be sent.
   */
  sendAccountToken(token: string): Observable<IApiRes<IFreeAgentData>> {
    return this.http.post<IApiRes<IFreeAgentData>>(
      `${this.ROOT_URL}/integrations/merge/get-unified-account-token/${token}`,
      {}
    );
  }
}
