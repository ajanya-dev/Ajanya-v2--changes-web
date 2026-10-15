import { Injectable } from '@angular/core';

import { environment } from 'src/environments/environment';

export interface IShopifySessionStatus {
  shop: string;
  connected: boolean;
  storeName: string | null;
  lastImportedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class ShopifyEmbeddedService {
  /**
   * Native fetch on purpose: App Bridge patches the global fetch and attaches
   * the Shopify session token, which HttpClient (XHR) would bypass. No
   * Authorization header is set here — App Bridge only attaches a token when
   * the request does not already carry one.
   * @returns {Promise<IShopifySessionStatus | null>} Connection status, or null when unavailable.
   */
  async getSessionStatus(): Promise<IShopifySessionStatus | null> {
    try {
      const response = await fetch(`${environment.rootUrl}/shopify/embedded/session`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        return null;
      }

      const body = await response.json();
      return body?.data ?? null;
    } catch {
      return null;
    }
  }
}
