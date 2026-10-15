import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AgRendererComponent } from '@ag-grid-community/angular';
import { ICellRendererParams } from '@ag-grid-community/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IVendorCreditRowData } from 'src/app/modules/vendor-credit/model/vendor';
import {
  groupV4ActionMenu,
  IV4ActionGroup
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-action-menu-groups.util';

interface IActionItem {
  label: string;
  id: string;
  icon: string;
  disabled?: boolean;
  isDanger?: boolean;
}

const LUCIDE_ICONS: Record<string, string> = {
  'Mark As Reconciled': 'check-square',
  'Add Attachment': 'paperclip',
  'Add Comment': 'message-square',
  'Audit Trail': 'history',
  Void: 'ban',
  Unvoid: 'ban',
  Edit: 'pencil',
  Delete: 'trash-2'
};

@Component({
  selector: 'app-v4-vendor-credit-action',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatTooltip
  ],
  template: `
    <div class="flex items-center gap-1 h-full">
      <button
        class="action-icon-btn"
        [matMenuTriggerFor]="menu"
        (click)="$event.stopPropagation()"
        matTooltip="Actions"
      >
        <lucide-icon name="ellipsis-vertical" [size]="16"></lucide-icon>
      </button>

      <button
        class="action-icon-btn"
        (click)="onViewClick(); $event.stopPropagation()"
        matTooltip="View"
      >
        <lucide-icon name="eye" [size]="16"></lucide-icon>
      </button>

      <mat-menu #menu="matMenu" xPosition="before" class="v4-action-menu">
        @for (group of menuGroups; track group.title; let groupCount = $count) {
          @if (groupCount > 1) {
            <div class="v4-menu-group-label">{{ group.title }}</div>
          }
          @for (item of group.items; track item.id) {
            <button
              mat-menu-item
              [disabled]="item.disabled"
              [class.v4-menu-item-danger]="item.isDanger"
              (click)="onActionClick(item.id)"
            >
              <div class="v4-menu-item">
                <lucide-icon [name]="item.icon" [size]="16"></lucide-icon>
                <span>{{ item.label }}</span>
              </div>
            </button>
          }
        }
      </mat-menu>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        height: 100%;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4VendorCreditActionComponent implements AgRendererComponent {
  private dataTableService = inject(DataTableService);
  private params!: ICellRendererParams;
  private currentColumn!: { [x: string]: unknown };
  visibleActions: IActionItem[] = [];

  get menuGroups(): IV4ActionGroup<IActionItem>[] {
    return groupV4ActionMenu(this.visibleActions, (item) => item.label);
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.currentColumn = { ...params.data, index: params.node?.id };
    this.visibleActions = this.buildActions();
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.currentColumn = { ...params.data, index: params.node?.id };
    this.visibleActions = this.buildActions();
    return true;
  }

  onViewClick(): void {
    this.dataTableService.setDataFromActionViewComp(this.currentColumn, '');
  }

  onActionClick(actionId: string): void {
    this.dataTableService.setDataFromActionComp(this.currentColumn, actionId);
  }

  private buildActions(): IActionItem[] {
    const row = this.params.data as IVendorCreditRowData;
    const status = row?.status;
    const isVoid = status === 3;

    const disabledIds = this.getDisabledIds(status);

    return [
      {
        label: 'Mark As Reconciled',
        id: 'action_mark_recon',
        icon: LUCIDE_ICONS['Mark As Reconciled'],
        disabled: disabledIds.has('action_mark_recon')
      },
      {
        label: 'Add Attachment',
        id: 'action_add_attach',
        icon: LUCIDE_ICONS['Add Attachment'],
        disabled: disabledIds.has('action_add_attach')
      },
      {
        label: 'Add Comment',
        id: 'action_add_comm',
        icon: LUCIDE_ICONS['Add Comment'],
        disabled: disabledIds.has('action_add_comm')
      },
      {
        label: 'Audit Trail',
        id: 'action_audit_trial',
        icon: LUCIDE_ICONS['Audit Trail'],
        disabled: disabledIds.has('action_audit_trial')
      },
      {
        label: isVoid ? 'Unvoid' : 'Void',
        id: isVoid ? 'action_unvoid' : 'action_void',
        icon: LUCIDE_ICONS.Void,
        isDanger: true,
        disabled: isVoid
          ? disabledIds.has('action_unvoid')
          : disabledIds.has('action_void')
      },
      {
        label: 'Edit',
        id: 'action_edit',
        icon: LUCIDE_ICONS.Edit,
        disabled: disabledIds.has('action_edit')
      },
      {
        label: 'Delete',
        id: 'action_delete',
        icon: LUCIDE_ICONS.Delete,
        isDanger: true,
        disabled: disabledIds.has('action_delete')
      }
    ];
  }

  private getDisabledIds(status: number): Set<string> {
    // Disable based on status — matches v3 exactly
    switch (status) {
      case 2:
        // Completed — disable: mark_recon, add_attach, void, edit, delete
        return new Set([
          'action_mark_recon',
          'action_add_attach',
          'action_void',
          'action_edit',
          'action_delete'
        ]);
      case 3:
        // Void — disable: mark_recon, add_attach, edit; unvoid & delete enabled
        return new Set([
          'action_mark_recon',
          'action_add_attach',
          'action_edit'
        ]);
      case 4:
        // Partially Paid — disable: mark_recon, void, edit, delete; add_attach enabled
        return new Set([
          'action_mark_recon',
          'action_void',
          'action_edit',
          'action_delete'
        ]);
      case 5:
        // Reconciled — disable: mark_recon, add_attach, void, edit; delete enabled
        return new Set([
          'action_mark_recon',
          'action_add_attach',
          'action_void',
          'action_edit'
        ]);
      default:
        // New (status 1) or unknown — all enabled
        return new Set();
    }
  }
}
