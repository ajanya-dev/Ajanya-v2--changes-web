import {
  Component,
  DestroyRef,
  effect,
  HostBinding,
  inject,
  input,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import {
  IOverviewSummaryCard,
  OverviewCardsV4Component
} from 'src/app/shared/V4/overview-cards-v4/overview-cards-v4.component';
import { CashExpenseService } from 'src/app/shared/service/cashExpense/cash-expense.service';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { CashExpenseCreateModalV4Component } from '../../modals/cash-expense-create-modal-v4/cash-expense-create-modal-v4.component';
import { CashExpenseV4StateService } from '../../services/cash-expense-v4-state.service';

@Component({
  selector: 'app-cash-expense-header-v4',
  standalone: true,
  imports: [OverviewCardsV4Component, V4PageHeaderComponent],
  templateUrl: './cash-expense-header-v4.component.html',
  styleUrl: './cash-expense-header-v4.component.scss'
})
export class CashExpenseHeaderV4Component {
  @HostBinding('class') class = 'block';

  private cashExpenseService = inject(CashExpenseService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private stateService = inject(CashExpenseV4StateService);

  showCards = input(true);
  isLoading = signal(true);

  readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'new',
      text: 'New Cash Expense',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: 'Record A New Cash Income Or Expense Transaction'
    }
  ];

  onAction(id: string | number): void {
    if (id === 'new') this.onNewCashExpense();
  }

  summaryCards = signal<IOverviewSummaryCard[]>([
    {
      title: 'Total Income',
      primaryValue: '$0.00',
      secondaryValue: '',
      valueColor: 'green',
      showDollarIcon: true
    },
    {
      title: 'Total Expense',
      primaryValue: '$0.00',
      secondaryValue: '',
      valueColor: 'red',
      showDollarIcon: true
    },
    {
      title: 'Net Balance',
      primaryValue: '$0.00',
      secondaryValue: '',
      valueColor: 'green',
      showDollarIcon: true
    }
  ]);

  constructor() {
    this.loadSummary();
    effect(
      () => {
        if (this.stateService.refreshTrigger() > 0) {
          this.loadSummary();
        }
      },
      { allowSignalWrites: true }
    );
  }

  loadSummary(): void {
    this.isLoading.set(true);
    this.cashExpenseService
      .getCashExpenseSummary()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res?.success && res.data) {
          this.summaryCards.set([
            {
              title: 'Total Income',
              primaryValue: `$${res.data.income || '0.00'}`,
              secondaryValue: '',
              valueColor: 'green',
              showDollarIcon: true
            },
            {
              title: 'Total Expense',
              primaryValue: `$${res.data.expense || '0.00'}`,
              secondaryValue: '',
              valueColor: 'red',
              showDollarIcon: true
            },
            {
              title: 'Net Balance',
              primaryValue: `$${res.data.net || '0.00'}`,
              secondaryValue: '',
              valueColor: res.data.net?.startsWith('-') ? 'red' : 'green',
              showDollarIcon: true
            }
          ]);
        }
      });
  }

  onNewCashExpense(): void {
    const ref = this.dialog.open(CashExpenseCreateModalV4Component, {
      width: '100%',
      maxWidth: '680px',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded',
      data: { mode: 'create' }
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result?.success) {
          this.stateService.activeTab.set('transactions');
          this.stateService.refreshList();
          this.loadSummary();
        }
      });
  }
}
