import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { AgRendererComponent } from '@ag-grid-community/angular';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { ICreditMemoData } from 'src/app/modules/invoices/model/invoice';
import {
  groupV4ActionMenu,
  IV4ActionGroup
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-action-menu-groups.util';

interface ICreditMemoAction {
  label: string;
  icon: string;
}

interface IV4CreditMemoActionParams extends ICellRendererParams {
  onViewClick: (row: ICreditMemoData) => void;
  onActionClick: (row: ICreditMemoData, label: string) => void;
}

const LUCIDE_ICONS: Record<string, string> = {
  Print: 'printer',
  'Mark As Completed': 'circle-check',
  'Add Comment': 'message-square',
  'Add Attachment': 'paperclip',
  'Audit Trail': 'history',
  Void: 'ban',
  Unvoid: 'ban',
  Edit: 'pencil',
  Delete: 'trash-2'
};

@Component({
  selector: 'app-v4-credit-memo-action',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatTooltip
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-1 h-full">
      <button
        class="action-icon-btn"
        [matMenuTriggerFor]="menu"
        (click)="$event.stopPropagation()"
        matTooltip="Actions"
      >
        <lucide-icon name="ellipsis-vertical" [size]="16" />
      </button>

      <button
        class="action-icon-btn"
        (click)="onViewClick(); $event.stopPropagation()"
        matTooltip="View"
      >
        <lucide-icon name="eye" [size]="16" />
      </button>

      <mat-menu #menu="matMenu" class="v4-action-menu">
        @for (group of menuGroups; track group.title; let groupCount = $count) {
          @if (groupCount > 1) {
            <div class="v4-menu-group-label">{{ group.title }}</div>
          }
          @for (item of group.items; track item.label) {
            <button
              mat-menu-item
              [class.v4-menu-item-danger]="item.label === 'Delete'"
              (click)="onActionClick(item.label)"
            >
              <div class="v4-menu-item">
                <lucide-icon
                  [name]="item.icon"
                  [size]="16"
                  class="text-[color:var(--v4-primary-brand-bold-color)]"
                />
                <span>{{ item.label }}</span>
              </div>
            </button>
          }
        }
      </mat-menu>
    </div>
  `
})
export class V4CreditMemoActionComponent implements AgRendererComponent {
  private params!: IV4CreditMemoActionParams;
  private rowData!: ICreditMemoData;
  visibleActions: ICreditMemoAction[] = [];

  get menuGroups(): IV4ActionGroup<ICreditMemoAction>[] {
    return groupV4ActionMenu(this.visibleActions, (item) => item.label);
  }

  agInit(params: IV4CreditMemoActionParams): void {
    this.params = params;
    this.rowData = params.data;
    this.visibleActions = this.buildVisibleActions();
  }

  refresh(params: IV4CreditMemoActionParams): boolean {
    this.params = params;
    this.rowData = params.data;
    this.visibleActions = this.buildVisibleActions();
    return true;
  }

  onViewClick(): void {
    this.params.onViewClick?.(this.rowData);
  }

  onActionClick(label: string): void {
    this.params.onActionClick?.(this.rowData, label);
  }

  private makeAction(label: string): ICreditMemoAction {
    return { label, icon: LUCIDE_ICONS[label] ?? 'circle' };
  }

  private buildVisibleActions(): ICreditMemoAction[] {
    if (!this.rowData) return [];

    const { status } = this.rowData;
    const hide = new Set<string>();

    if (status === 2) {
      // Marked As Reconciled
      hide.add('Mark As Completed');
      hide.add('Add Attachment');
      hide.add('Void');
      hide.add('Edit');
      hide.add('Delete');
    } else if (status === 3) {
      // Voided
      hide.add('Mark As Completed');
      hide.add('Add Attachment');
      hide.add('Edit');
    } else if (status === 4) {
      // Partially Paid
      hide.add('Mark As Completed');
      hide.add('Void');
      hide.add('Edit');
      hide.add('Delete');
    } else if (status === 5) {
      // Completed
      hide.add('Mark As Completed');
      hide.add('Add Attachment');
      hide.add('Void');
      hide.add('Edit');
    }

    const allActions: string[] = [
      'Print',
      'Mark As Completed',
      'Add Comment',
      'Add Attachment',
      'Audit Trail',
      status === 3 ? 'Unvoid' : 'Void',
      'Edit',
      'Delete'
    ];

    return allActions
      .filter((label) => !hide.has(label))
      .map((label) => this.makeAction(label));
  }
}
