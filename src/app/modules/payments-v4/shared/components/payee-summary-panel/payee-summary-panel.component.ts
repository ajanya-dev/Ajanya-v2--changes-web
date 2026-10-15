import { Component, computed, inject, Signal } from '@angular/core';
import { LucideAngularModule, ChartColumn } from 'lucide-angular';
import type { IOtherDetails } from 'src/app/modules/check/model/check';
import type { IPayeeDropdown } from 'src/app/modules/payee/payee-v2/model/payee';
import { DOUBLE_SIDE_PANEL_DATA } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.tokens';

export interface IPayeeSummaryPanelData {
  payee: Signal<IPayeeDropdown | null>;
  payeeSummary: Signal<IOtherDetails | null>;
}

@Component({
  selector: 'app-payee-summary-panel',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './payee-summary-panel.component.html'
})
export class PayeeSummaryPanelComponent {
  private panelData = inject<IPayeeSummaryPanelData | null>(
    DOUBLE_SIDE_PANEL_DATA,
    { optional: true }
  );

  readonly chartIcon = ChartColumn;

  readonly payee = computed(() => this.panelData?.payee() ?? null);
  readonly summary = computed(() => this.panelData?.payeeSummary() ?? null);
}
