import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IShopifySessionStatus, ShopifyEmbeddedService } from './shopify-embedded.service';

/**
 * The App URL page Shopify loads inside its admin iframe. On init it fires a
 * native-fetch request so App Bridge can attach the session token — this is
 * what the Partner Dashboard's session-token check looks for.
 */
@Component({
  selector: 'app-shopify-embedded',
  standalone: true,
  imports: [CommonButtonV4Component],
  templateUrl: './shopify-embedded.component.html'
})
export class ShopifyEmbeddedComponent implements OnInit {
  private readonly shopifyEmbeddedService = inject(ShopifyEmbeddedService);

  /**
   * Where the embedded page's "Open OnlineCheckWriter" button goes: the
   * Shopify connect screen. Held here rather than in the environment files:
   * the Shopify app is a single registered app pointing at the live site, so
   * this is one fixed address rather than a per-build one.
   */
  readonly ocwAppUrl = 'https://live.onlinecheckwriter.com/manage/thirdparty_app/shopify';

  status = signal<IShopifySessionStatus | null>(null);

  ngOnInit(): void {
    void this.shopifyEmbeddedService
      .getSessionStatus()
      .then((status) => this.status.set(status));
  }

  openOcw(): void {
    window.open(this.ocwAppUrl, '_blank');
  }
}
