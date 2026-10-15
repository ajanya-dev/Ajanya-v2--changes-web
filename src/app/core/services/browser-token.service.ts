import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap, timeout } from 'rxjs/operators';
import { IApiRes } from 'src/app/models/api';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { environment } from 'src/environments/environment';

type IBrowserTokenRes = IApiRes<{ 'browser-token': string }>;

/**
 * @description Single owner of the `browser-token` header value.
 * Keeps the token in memory so the interceptor never decrypts local storage per request,
 * and fetches it on demand (de-duplicated) when a session arrives without one.
 * The fetch uses HttpBackend so it bypasses the interceptor chain entirely.
 */
@Injectable({
  providedIn: 'root'
})
export class BrowserTokenService {
  private readonly localStorageService = inject(LocalStorageService);
  private readonly http = new HttpClient(inject(HttpBackend));

  private readonly TOKEN_URL = `${environment.rootUrl}/browser-auth`;
  private readonly FETCH_TIMEOUT_MS = 3000;
  private readonly FAILURE_COOLDOWN_MS = 60000;

  private token: string | null = this.readFromStorage();
  private inFlight$: Observable<string | null> | null = null;
  private cooldownUntil = 0;

  get value(): string | null {
    return this.token;
  }

  /**
   * @description Resolves the token without a network call when one is already known.
   * Only a session with no token pays a round trip, and concurrent callers share it.
   */
  ensure(): Observable<string | null> {
    if (this.token) {
      return of(this.token);
    }

    const stored = this.readFromStorage();
    if (stored) {
      this.token = stored;
      return of(stored);
    }

    return this.isCoolingDown() ? of(null) : this.fetch();
  }

  /**
   * @description Forces a new token, replacing any existing one. Used by flows that
   * start a different browser session (login page, account restore, app switch).
   */
  refresh(): Observable<string | null> {
    const request$ = this.fetch();
    request$.subscribe();
    return request$;
  }

  private fetch(): Observable<string | null> {
    if (!this.inFlight$) {
      this.inFlight$ = this.http
        .get<IBrowserTokenRes>(this.TOKEN_URL, { headers: this.fetchHeaders() })
        .pipe(
          timeout(this.FETCH_TIMEOUT_MS),
          map((res) =>
            res?.success ? res?.data?.['browser-token'] ?? null : null
          ),
          tap((token) => this.store(token)),
          catchError(() => {
            this.cooldownUntil = Date.now() + this.FAILURE_COOLDOWN_MS;
            return of(null);
          }),
          finalize(() => {
            this.inFlight$ = null;
          }),
          shareReplay({ bufferSize: 1, refCount: false })
        );
    }

    return this.inFlight$;
  }

  private isCoolingDown(): boolean {
    return Date.now() < this.cooldownUntil;
  }

  private fetchHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      Accept: 'application/json',
      ocw: '110',
      'api-request-from': 'web'
    });

    const { appToken } = this.localStorageService;
    if (appToken) {
      headers = headers.set('Authorization', `Bearer ${appToken} `);
    }

    return headers;
  }

  private store(token: string | null): void {
    if (!token) {
      return;
    }

    this.token = token;
    this.cooldownUntil = 0;
    this.localStorageService.setItem('browser-token', token);
  }

  private readFromStorage(): string | null {
    const stored = this.localStorageService.getItem('browser-token');
    return typeof stored === 'string' && stored ? stored : null;
  }
}
