import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4DataTableEmptyStateComponent } from 'src/app/modules/v4-data-table/components/v4-data-table-empty-state/v4-data-table-empty-state.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankDataV4RulesService } from '../../../services/bank-data-v4-rules.service';
import { BankDataV4TransactionsStateService } from '../../../services/bank-data-v4-transactions-state.service';
import { BankDataV4CreateProcessingRuleModalComponent } from '../../../modals/create-processing-rule-modal/bank-data-v4-create-processing-rule-modal.component';

interface IProcessingRuleCardVM {
  id: string;
  name: string;
  conditionHtml: string;
  actionHtml: string;
  isActive: boolean;
  timesTriggered: number;
}

@Component({
  selector: 'app-bank-data-v4-rules-tab',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    CommonButtonV4Component,
    V4DataTableEmptyStateComponent
  ],
  templateUrl: './bank-data-v4-rules-tab.component.html'
})
export class BankDataV4RulesTabComponent implements OnInit {
  rulesService = inject(BankDataV4RulesService);
  state = inject(BankDataV4TransactionsStateService);
  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);

  isReapplying = signal(false);
  deletingRuleId = signal<string | null>(null);

  /** Card view-models for the Processing list. */
  processingCards = computed<IProcessingRuleCardVM[]>(() =>
    this.rulesService.cards().map((c, idx) => ({
      id: c.id,
      name: `Rule #${idx + 1}`,
      conditionHtml: c.conditionHtml,
      actionHtml: c.actionHtml,
      isActive: true,
      timesTriggered: 0
    }))
  );

  ngOnInit(): void {
    this.rulesService.loadRules();
    this.state.loadIndex();
  }

  onCreateRule(): void {
    const ref = this.dialog.open(BankDataV4CreateProcessingRuleModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      panelClass: 'paddingless-modal-rounded',
      autoFocus: false,
      disableClose: true,
      data: {
        accounts: this.state.accountOptions()
      }
    });

    ref.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.rulesService.refreshRules();
      }
    });
  }

  onEdit(card: IProcessingRuleCardVM): void {
    if (!card?.id) return;
    this.rulesService.getRule(card.id).subscribe((res) => {
      if (!res?.success || !res.data) return;
      let parsed: { ifs?: unknown[]; thens?: unknown[] } = {};
      try {
        parsed = JSON.parse(res.data.rule_data || '{}');
      } catch {
        parsed = {};
      }

      const ref = this.dialog.open(
        BankDataV4CreateProcessingRuleModalComponent,
        {
          width: '900px',
          maxWidth: '95vw',
          panelClass: 'paddingless-modal-rounded',
          autoFocus: false,
          disableClose: true,
          data: {
            accounts: this.state.accountOptions(),
            editRule: {
              id: res.data.id ?? card.id,
              name: res.data.name,
              description: res.data.description,
              ruleData: parsed
            }
          }
        }
      );

      ref.afterClosed().subscribe((r) => {
        if (r?.success) this.rulesService.refreshRules();
      });
    });
  }

  onReapplyAll(): void {
    this.isReapplying.set(true);
    this.rulesService
      .reapplyAll()
      .pipe(finalize(() => this.isReapplying.set(false)))
      .subscribe((res) => {
        if (res?.success) {
          this.alertService.successAlert({
            content: 'Rules re-applied successfully'
          });
        }
      });
  }

  onDelete(id: string): void {
    if (!id) return;
    const dRef = this.alertService.confirmAlert({
      title: 'Are you sure',
      content: 'You want to delete this rule?',
      doneMsg: 'Yes'
    });

    dRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.deletingRuleId.set(id);
      this.rulesService.deleteRule(id).subscribe({
        next: (res) => {
          this.deletingRuleId.set(null);
          if (res?.success) {
            this.alertService.successAlert({ content: 'Rule deleted' });
            this.rulesService.removeRule(id);
          }
        },
        error: () => this.deletingRuleId.set(null)
      });
    });
  }
}
