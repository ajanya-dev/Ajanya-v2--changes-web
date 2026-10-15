import { Component } from '@angular/core';
import { LucideAngularModule, TriangleAlert } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { QboReconnectModalBase } from './qbo-reconnect-modal.base';

/**
 * @description The V4 "company access expired" prompt.
 *
 * Mirrors `v4-confirm-alert.component.html` — the same TriangleAlert badge and
 * button row — so it sits in the v4 app exactly like every other alert there.
 * The behaviour is `QboReconnectModalBase`, shared with the v3 dialog.
 */
@Component({
  selector: 'app-qbo-reconnect-modal',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component],
  template: `
    <div class="text-center font-funnel p-6">
      <div class="flex justify-center mb-4">
        <div
          class="w-16 h-16 rounded-full flex items-center justify-center"
          style="
            background-color: var(--v4-badge-warning-bg-color);
            color: var(--v4-badge-warning-text-color);
          "
        >
          <lucide-icon [img]="warnIcon" [size]="32"></lucide-icon>
        </div>
      </div>

      <h2 class="text-lg font-semibold text-v4-main-text-color mb-2">
        Reconnect QuickBooks
      </h2>

      <!-- errorMsg is HTML: it bolds the company name and breaks the line. -->
      <p
        class="text-sm text-v4-secondary-text-color max-w-[40ch] mx-auto break-words"
        [innerHTML]="message"
      ></p>

      <div class="flex gap-3 justify-center mt-6">
        <app-common-button-v4
          class="flex-1"
          [type]="{ style: 'outline', name: 'main' }"
          [text]="'Cancel'"
          [width]="'100%'"
          [disabled]="isReconnecting()"
          (clickEvent)="cancel()"
        />
        <app-common-button-v4
          class="flex-1"
          [type]="{ style: 'primary', name: 'main' }"
          [text]="isReconnecting() ? 'Reconnecting' : 'Reconnect'"
          [width]="'100%'"
          [loading]="isReconnecting()"
          [disabled]="isReconnecting()"
          (clickEvent)="reconnect()"
        />
      </div>
    </div>
  `
})
export class QboReconnectModalComponent extends QboReconnectModalBase {
  readonly warnIcon = TriangleAlert;
}
