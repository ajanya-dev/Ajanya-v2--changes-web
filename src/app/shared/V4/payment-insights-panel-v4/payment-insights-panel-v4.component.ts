import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export interface IPaymentInsights {
  newCount: number;
  pendingCount: number;
  rejectedCount: number;
  highValueCount: number;
  highValueThreshold: number;
  recurringCount: number;
}

@Component({
  standalone: true,
  selector: 'app-payment-insights-panel-v4',
  templateUrl: './payment-insights-panel-v4.component.html',
  styleUrls: ['./payment-insights-panel-v4.component.scss'],
  imports: [LucideAngularModule]
})
export class PaymentInsightsPanelV4Component {
  insights = input.required<IPaymentInsights>();
  isLoading = input(false);

  formatThreshold(value: number): string {
    return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value);
  }
}
