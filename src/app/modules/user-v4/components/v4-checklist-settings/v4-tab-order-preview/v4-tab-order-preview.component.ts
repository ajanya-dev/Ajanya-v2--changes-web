import { Component, Input } from '@angular/core';
import { IUserTab } from 'src/app/modules/user/model/user';
import { TAB_ORDER_TEXT_V4 } from 'src/app/shared/utils/tab-order-text.util';

let previewInstanceId = 0;

/**
 * Read-only preview of the Check filter tab strip.
 *
 * It renders whatever it is handed and never writes back: no click, drag,
 * navigation, persistence or save behaviour, and no state of its own beyond
 * the label id used for the aria relationship.
 */
@Component({
  selector: 'app-v4-tab-order-preview',
  templateUrl: './v4-tab-order-preview.component.html',
  styleUrls: ['./v4-tab-order-preview.component.scss'],
  standalone: true
})
export class V4TabOrderPreviewComponent {
  /** Selected tabs in list order — index 0 becomes the leftmost pill. */
  @Input() selectedTabs: IUserTab[] = [];

  /** Identifier of the configured default tab, or null when none is set. */
  @Input() defaultTab: number | null = null;

  readonly tabOrderText = TAB_ORDER_TEXT_V4;

  readonly labelId = `tab-order-preview-label-${(previewInstanceId += 1)}`;

  get tabs(): IUserTab[] {
    return this.selectedTabs ?? [];
  }

  get isEmpty(): boolean {
    return this.tabs.length === 0;
  }

  /** True when a default is configured but is not among the selected tabs. */
  get isDefaultMissing(): boolean {
    return (
      this.defaultTab !== null &&
      this.defaultTab !== undefined &&
      !this.tabs.some((tab) => tab.number === this.defaultTab)
    );
  }

  isDefault(tab: IUserTab): boolean {
    return (
      this.defaultTab !== null &&
      this.defaultTab !== undefined &&
      tab.number === this.defaultTab
    );
  }
}
