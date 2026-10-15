import { Component, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import {
  IFinancialStatementRowData,
  IJsonData
} from 'src/app/modules/financial-statement/model/financialstatement';

@Component({
  selector: 'app-financial-statement-drawer-v4',
  standalone: true,
  imports: [CurrencyPipe, LucideAngularModule],
  templateUrl: './financial-statement-drawer-v4.component.html',
  styleUrl: './financial-statement-drawer-v4.component.scss'
})
export class FinancialStatementDrawerV4Component {
  row = input<IFinancialStatementRowData | null>(null);
  isPanelExpanded = input<boolean>(false);

  collapsedCards = signal<Record<string, boolean>>({});

  toggleCard(key: string): void {
    this.collapsedCards.update(s => ({ ...s, [key]: !s[key] }));
  }

  isCardCollapsed(key: string): boolean {
    return !!this.collapsedCards()[key];
  }

  isGroupMode(json: IJsonData | undefined): boolean {
    return !!(json?.data && json.data.length > 0);
  }
}
