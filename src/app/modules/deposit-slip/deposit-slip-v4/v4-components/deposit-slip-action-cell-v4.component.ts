import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { AgRendererComponent } from '@ag-grid-community/angular';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';

interface IDepositSlipActionParams extends ICellRendererParams {
  onViewClick: (row: Record<string, unknown>) => void;
  onActionClick: (row: Record<string, unknown>, actionId: string, done?: () => void) => void;
}

interface IActionItem {
  label: string;
  id: string;
  icon: string;
  isDanger?: boolean;
}

interface IActionGroup {
  title: string;
  items: IActionItem[];
}

@Component({
  selector: 'app-deposit-slip-action-cell-v4',
  standalone: true,
  imports: [LucideAngularModule, MatMenuTrigger, MatMenu, MatMenuItem, MatTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './deposit-slip-action-cell-v4.component.html',
  styleUrls: ['./deposit-slip-action-cell-v4.component.scss']
})
export class DepositSlipActionCellV4Component implements AgRendererComponent {
  private params!: IDepositSlipActionParams;
  private rowData!: Record<string, unknown>;
  private cdr = inject(ChangeDetectorRef);

  private readonly apiActions = new Set(['id_printRow', 'id_verify', 'id_void', 'id_Delete']);
  actionLoading = false;

  groupedActions: IActionGroup[] = [
    {
      title: 'ACTIONS',
      items: [
        { label: 'Verify', id: 'id_verify', icon: 'circle-check' },
        { label: 'Edit', id: 'id_edit', icon: 'square-pen' },
        { label: 'Clone', id: 'id_clone', icon: 'copy' },
        { label: 'Print', id: 'id_printRow', icon: 'printer' },
        { label: 'Void', id: 'id_void', icon: 'ban', isDanger: true },
        { label: 'Delete', id: 'id_Delete', icon: 'trash-2', isDanger: true }
      ]
    },
    {
      title: 'DOCUMENTS',
      items: [
        { label: 'Add Comments', id: 'id_comment', icon: 'message-square' },
        { label: 'Add Attachment', id: 'id_attachment', icon: 'paperclip' }
      ]
    }
  ];

  agInit(params: IDepositSlipActionParams): void {
    this.params = params;
    this.rowData = params.data;
  }

  refresh(params: IDepositSlipActionParams): boolean {
    this.params = params;
    this.rowData = params.data;
    return true;
  }

  onViewClick(): void {
    this.params.onViewClick?.(this.rowData);
  }

  onActionClick(actionId: string): void {
    if (this.apiActions.has(actionId)) {
      this.actionLoading = true;
      this.cdr.markForCheck();
      this.params.onActionClick?.(this.rowData, actionId, () => {
        this.actionLoading = false;
        this.cdr.markForCheck();
      });
      return;
    }
    this.params.onActionClick?.(this.rowData, actionId);
  }

  /**
   * Same disable logic as data table row actions:
   * - status 0 (Not Verified): all enabled
   * - status 1 (Verified): verify, void, edit disabled
   * - status 2 (Voided): print, verify, void, edit disabled
   */
  isActionDisabled(actionId: string): boolean {
    const status = this.rowData?.status;
    if (status === 1) {
      return ['id_verify', 'id_void', 'id_edit'].includes(actionId);
    }
    if (status === 2) {
      return ['id_printRow', 'id_verify', 'id_void', 'id_edit'].includes(actionId);
    }
    return false;
  }
}
