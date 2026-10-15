import { Component } from '@angular/core';
import { QboReconnectModalBase } from './qbo-reconnect-modal.base';

/**
 * @description The V3 "company access expired" prompt.
 *
 * Mirrors the v3 confirm alert's markup — the shaking warn icon, the title and
 * content block, and the global `ocw-btn` modal buttons — so it sits in the v3
 * app exactly like every other alert there. The behaviour is
 * `QboReconnectModalBase`, shared with the v4 dialog.
 */
@Component({
  selector: 'app-qbo-reconnect-modal-v35',
  standalone: true,
  template: `
    <div class="alert_wrapper">
      <div class="alert_icon">
        <img src="assets/images/alert-icons/warn-icon.svg" alt="" />
      </div>

      <div class="alert_body">
        <h2 class="title">Reconnect QuickBooks</h2>
        <!-- errorMsg is HTML: it bolds the company name and breaks the line. -->
        <div class="content" [innerHTML]="message"></div>
      </div>

      <div class="alert_button_wrapper">
        <button
          type="button"
          class="ocw-btn ocw-btn-modal-bordered"
          [disabled]="isReconnecting()"
          (click)="cancel()"
        >
          Cancel
        </button>
        <button
          type="button"
          class="ocw-btn ocw-btn-modal-blue"
          [disabled]="isReconnecting()"
          (click)="reconnect()"
        >
          @if (isReconnecting()) {
            <span class="loadingSpinner"></span>
            Reconnecting
          } @else {
            Reconnect
          }
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .alert_wrapper {
        padding: 24px 20px;
        text-align: center;
        background-color: var(--main-background-color);
      }

      .alert_icon {
        display: flex;
        justify-content: center;
        margin-bottom: 12px;

        img {
          width: 56px;
          height: 56px;
        }
      }

      .title {
        font-family: var(--roboto);
        font-size: 18px;
        font-weight: 600;
        color: var(--main-text-color);
        margin-bottom: 6px;
      }

      .content {
        font-family: var(--roboto);
        font-size: 14px;
        color: var(--secondary-text-color);
        line-height: 1.5;
      }

      .alert_button_wrapper {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-top: 22px;

        .ocw-btn {
          min-width: 130px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .ocw-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        // Sized down from the page-level spinner and recoloured for the filled
        // button it sits on.
        .loadingSpinner::after {
          width: 14px;
          height: 14px;
          border-width: 2px;
          border-color: #fff transparent #fff transparent;
        }
      }
    `
  ]
})
export class QboReconnectModalV35Component extends QboReconnectModalBase {}
