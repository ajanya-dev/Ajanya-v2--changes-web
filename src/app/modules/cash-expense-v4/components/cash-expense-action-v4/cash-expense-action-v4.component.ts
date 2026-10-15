import { Component, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { AgRendererComponent } from '@ag-grid-community/angular';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';

import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';

interface IActionItem {
  name: string;
  id: string;
  icon: string;
  color?: string;
}

type TMenuGroup = 'ACTIONS' | 'DOCUMENTS' | 'PROOF';

interface IActionGroup {
  title: TMenuGroup;
  items: IActionItem[];
}

const GROUP_ORDER: TMenuGroup[] = ['ACTIONS', 'DOCUMENTS', 'PROOF'];

const ACTION_GROUP: Record<string, TMenuGroup> = {
  RId_edit: 'ACTIONS',
  RId_clone: 'ACTIONS',
  RId_delete: 'ACTIONS',
  RId_audit: 'DOCUMENTS',
  RId_comments: 'DOCUMENTS',
  RId_attachment: 'DOCUMENTS',
  RId_proof: 'PROOF',
  RId_receipt: 'PROOF'
};

const DESIGN_ORDER: Record<string, number> = [
  'RId_edit',
  'RId_clone',
  'RId_delete',
  'RId_audit',
  'RId_comments',
  'RId_attachment',
  'RId_proof',
  'RId_receipt'
].reduce((acc, id, i) => ({ ...acc, [id]: i }), {});

@Component({
  selector: 'app-cash-expense-action-v4',
  standalone: true,
  imports: [LucideAngularModule, MatMenuTrigger, MatMenu, MatMenuItem, MatTooltip],
  template: `
    <div class="flex items-center gap-1 h-full">
      <button
        class="action-icon-btn"
        [matMenuTriggerFor]="menu"
        (click)="$event.stopPropagation()"
        matTooltip="Options"
      >
        <lucide-icon
          name="ellipsis-vertical"
          [size]="16"
          class="v4-action-icon"
        />
      </button>

      <button class="action-icon-btn" (click)="onEyeClick($event)" matTooltip="View">
        <lucide-icon name="eye" [size]="16" class="v4-action-icon" />
      </button>

      <mat-menu #menu="matMenu" xPosition="after" class="v4-action-menu">
        @for (group of groupedActions; track group.title) {
          <div class="v4-menu-group-label">{{ group.title }}</div>
          @for (item of group.items; track item.id) {
            <button
              mat-menu-item
              [class.v4-menu-item-danger]="item.color === 'red'"
              (click)="onActionClick(item.id)"
            >
              <div class="v4-menu-item">
                <lucide-icon [name]="item.icon" [size]="16" />
                <span>{{ item.name }}</span>
              </div>
            </button>
          }
        }
      </mat-menu>
    </div>
  `
})
export class CashExpenseActionV4Component implements AgRendererComponent {
  private dataTableService = inject(DataTableService);

  private params!: ICellRendererParams;
  private tableId: number | undefined;
  actions: IActionItem[] = [];
  groupedActions: IActionGroup[] = [];

  agInit(params: ICellRendererParams): void {
    this.params = params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.tableId = (params?.colDef as any)?.tableId;
    this.setActions();
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.setActions();
    return true;
  }

  private setActions(): void {
    const data = this.dataTableService.getCellrendrerData(this.tableId);
    this.actions = this.filterActions((data?.values ?? []) as IActionItem[]);
    this.groupedActions = this.groupActions(this.actions);
  }

  private groupActions(actions: IActionItem[]): IActionGroup[] {
    const sorted = [...actions].sort(
      (a, b) => (DESIGN_ORDER[a.id] ?? 99) - (DESIGN_ORDER[b.id] ?? 99)
    );
    return GROUP_ORDER.map((title) => ({
      title,
      items: sorted.filter((item) => (ACTION_GROUP[item.id] ?? 'ACTIONS') === title)
    })).filter((group) => group.items.length > 0);
  }

  private filterActions(actions: IActionItem[]): IActionItem[] {
    const isExpense = this.params.data?.transaction_type === 1;
    return actions.filter((item) => {
      if (item.id === 'RId_receipt' && !isExpense) return false;
      return true;
    });
  }

  private getCurrentRow(): Record<string, unknown> {
    return { ...(this.params.data ?? {}), index: this.params.node.id };
  }

  onEyeClick(event: Event): void {
    event.stopPropagation();
    this.dataTableService.setDataFromActionViewComp(this.getCurrentRow(), '');
  }

  onActionClick(id: string): void {
    this.dataTableService.setDataFromActionComp(this.getCurrentRow(), id, this.tableId);
  }
}
