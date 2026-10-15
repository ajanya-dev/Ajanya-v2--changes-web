import { Injectable, inject } from '@angular/core';
import { Params } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IntegrationService } from './integration.service';

export interface IOAuthCallbackResult {
  success: boolean;
  message?: string;
}

interface IOAuthCallbackHandler {
  readonly requiredParams: readonly string[];
  execute(params: Params): Observable<IOAuthCallbackResult>;
}

/**
 * Centralized OAuth callback handling for V4 integration apps.
 *
 * After an external provider (QuickBooks, Xero, Zoho, etc.) redirects back
 * to our app, the V4 integration index page consults this service to:
 *
 *   1. Detect whether the URL holds OAuth params for the redirected app
 *      via `canHandle(appId, queryParams)`.
 *   2. Exchange the code for an access token via `handle(appId, queryParams)`.
 *
 * To support a new app, register it in `handlers` below — either via
 * `providerHandler(providerCode)` for the generic
 * `/integrations/thirdparty-app/callback/{provider}` endpoint, or by
 * supplying a custom `execute` that wraps a service method.
 */
@Injectable({ providedIn: 'root' })
export class IntegrationOAuthCallbackService {
  private integrationService = inject(IntegrationService);

  private handlers: Record<string, IOAuthCallbackHandler> = {
    'qb-online': {
      requiredParams: ['code', 'state', 'realmId'],
      execute: (params) =>
        this.normalize(
          this.integrationService.quickBookCallBack(this.toQueryString(params))
        )
    },
    freshbook: this.providerHandler('freshbooks'),
    zoho: this.providerHandler('zoho_books'),
    'Zoho-payroll': this.providerHandler('zoho_payroll'),
    gusto: this.providerHandler('gusto'),
    xero: this.providerHandler('xero'),
    'sage-business': this.providerHandler('sage_business'),
    hubspot: {
      requiredParams: ['code', 'state'],
      execute: (params) =>
        this.normalize(
          this.integrationService.hubSpotCallback(params.code, params.state)
        )
    },
    clio: {
      requiredParams: ['code', 'state'],
      execute: (params) =>
        this.normalize(
          this.integrationService.clioCallback(params.code, params.state)
        )
    },
    // Shopify also returns `shop`, which the generic handler forwards along
    // with the rest of the callback query string.
    shopify: this.providerHandler('shopify')
  };

  /** True when the URL holds the OAuth params this app needs. */
  canHandle(appId: string | undefined, queryParams: Params): boolean {
    if (!appId) return false;
    const handler = this.handlers[appId];
    if (!handler) return false;
    return handler.requiredParams.every((p) => !!queryParams[p]);
  }

  /** Performs the OAuth exchange and normalizes the response. */
  handle(appId: string, queryParams: Params): Observable<IOAuthCallbackResult> {
    const handler = this.handlers[appId];
    if (!handler) {
      return of({ success: false, message: 'Unsupported integration app.' });
    }
    return handler.execute(queryParams);
  }

  /**
   * Param keys to strip from the URL after the exchange completes. Covers the
   * union of every registered handler's required params plus common provider
   * extras (scope, session_state, location) that may ride along.
   */
  callbackParamKeys(): readonly string[] {
    const keys = new Set<string>();
    Object.values(this.handlers).forEach((h) =>
      h.requiredParams.forEach((p) => keys.add(p))
    );
    ['scope', 'session_state', 'location', 'shop', 'hmac', 'timestamp', 'host'].forEach(
      (k) => keys.add(k)
    );
    return Array.from(keys);
  }

  private providerHandler(providerCode: string): IOAuthCallbackHandler {
    return {
      requiredParams: ['code', 'state'],
      execute: (params) =>
        this.normalize(
          this.integrationService.connectCallBack(
            this.toQueryString(params),
            providerCode
          )
        )
    };
  }

  private toQueryString(params: Params): string {
    return Object.entries(params)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
      )
      .join('&');
  }

  private normalize(
    source: Observable<{ success: boolean; message?: string }>
  ): Observable<IOAuthCallbackResult> {
    return source.pipe(
      map((res) => ({ success: !!res?.success, message: res?.message })),
      catchError((err: { error?: { message?: string } }) =>
        of({
          success: false,
          message: err?.error?.message ?? 'Connection failed.'
        })
      )
    );
  }
}
