import { DOCUMENT } from '@angular/common';
import { inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Observable } from 'rxjs';
import { IPlaidMetaData } from '../model/paid-data';

interface PlaidCreateOptions {
  token: string;
  onLoad?: () => void;
  onSuccess: (publicToken: string, metadata: IPlaidMetaData) => void;
  onExit?: (err: unknown, metadata: IPlaidMetaData) => void;
}

interface PlaidHandler {
  open: () => void;
  destroy: () => void;
}

declare const Plaid: {
  create: (options: PlaidCreateOptions) => PlaidHandler;
};

export interface IPlaidOutsideSuccess {
  publicToken: string;
  metadata: IPlaidMetaData;
}

/**
 * Drives the Plaid Link widget on public `/outside/` pages. Unlike PlaidModalComponent,
 * it injects no authenticated services and fires no MoEngage/bank-account calls — it
 * only loads the SDK and opens Link, emitting the raw `onSuccess` result so the caller
 * can run its own token-exchange endpoint. Emits `null` if the user exits without connecting.
 */
@Injectable({ providedIn: 'root' })
export class PlaidOutsideService {
  private readonly PLAID_CDN_LINK =
    'https://cdn.plaid.com/link/v2/stable/link-initialize.js';

  private document = inject<Document>(DOCUMENT);
  private renderer: Renderer2;
  private plaidHandler: PlaidHandler | null = null;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  open(linkToken: string): Observable<IPlaidOutsideSuccess | null> {
    return new Observable<IPlaidOutsideSuccess | null>((subscriber) => {
      this.loadScript()
        .then(() => {
          this.destroyHandler();
          this.plaidHandler = Plaid.create({
            token: linkToken,
            onSuccess: (publicToken, metadata) => {
              subscriber.next({ publicToken, metadata });
              subscriber.complete();
            },
            onExit: () => {
              subscriber.next(null);
              subscriber.complete();
            }
          });
          this.plaidHandler.open();
        })
        .catch((err) => subscriber.error(err));

      return () => this.destroyHandler();
    });
  }

  private loadScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.document.querySelector(`script[src="${this.PLAID_CDN_LINK}"]`)) {
        resolve();
        return;
      }
      const script = this.renderer.createElement('script');
      script.type = 'text/javascript';
      script.src = this.PLAID_CDN_LINK;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Plaid script'));
      this.renderer.appendChild(this.document.body, script);
    });
  }

  private destroyHandler(): void {
    if (this.plaidHandler) {
      this.plaidHandler.destroy();
      this.plaidHandler = null;
    }
  }
}
