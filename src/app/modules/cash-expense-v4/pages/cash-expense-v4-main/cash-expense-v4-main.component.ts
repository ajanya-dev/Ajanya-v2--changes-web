import { Component, inject, OnInit } from '@angular/core';
import {
  CommonTabV4Component,
  ITabItem
} from 'src/app/shared/V4/common-tab-v4/common-tab-v4.component';
import { CashExpenseHeaderV4Component } from '../../components/cash-expense-header-v4/cash-expense-header-v4.component';
import { CashExpenseListV4Component } from '../../components/cash-expense-list-v4/cash-expense-list-v4.component';
import { CashExpenseDetailPanelV4Component } from '../../components/cash-expense-detail-panel-v4/cash-expense-detail-panel-v4.component';
import { CashExpenseBankTableV4Component } from '../../components/cash-expense-bank-table-v4/cash-expense-bank-table-v4.component';
import { CashExpenseV4StateService } from '../../services/cash-expense-v4-state.service';

@Component({
  selector: 'app-cash-expense-v4-main',
  standalone: true,
  imports: [
    CommonTabV4Component,
    CashExpenseHeaderV4Component,
    CashExpenseListV4Component,
    CashExpenseDetailPanelV4Component,
    CashExpenseBankTableV4Component
  ],
  templateUrl: './cash-expense-v4-main.component.html',
  styleUrl: './cash-expense-v4-main.component.scss'
})
export class CashExpenseV4MainComponent implements OnInit {
  stateService = inject(CashExpenseV4StateService);

  activeTab = this.stateService.activeTab;

  readonly tabs: ITabItem[] = [
    { label: 'Transactions', value: 'transactions', lucideIcon: 'receipt' },
    { label: 'Cash Accounts', value: 'accounts', lucideIcon: 'dollar-sign' }
  ];

  ngOnInit(): void {
    this.stateService.activeTab.set('transactions');
  }

  onTabChange(value: string): void {
    this.activeTab.set(value);
  }
}
