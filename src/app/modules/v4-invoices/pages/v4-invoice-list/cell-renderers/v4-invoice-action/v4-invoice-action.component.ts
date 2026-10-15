import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { AgRendererComponent } from '@ag-grid-community/angular';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { IInvoiceRowData } from 'src/app/modules/invoices/model/invoice';
import {
  groupV4ActionMenu,
  IV4ActionGroup
} from 'src/app/shared/V4/v4-dt-cellrenders/v4-action-menu-groups.util';

interface IInvoiceAction {
  label: string;
  icon: string;
}

interface IV4InvoiceActionParams extends ICellRendererParams {
  onViewClick: (row: IInvoiceRowData) => void;
  onActionClick: (row: IInvoiceRowData, label: string) => void;
  onMapClick: (row: IInvoiceRowData) => void;
}

const LUCIDE_ICONS: Record<string, string> = {
  Print: 'printer',
  'Mark Paid / Partially': 'circle-dollar-sign',
  'Resend Email': 'send',
  'Resend SMS': 'smartphone',
  'Add Comment': 'message-square',
  'Add Attachment': 'paperclip',
  'Invoice Audit Trail': 'history',
  Void: 'ban',
  Unvoid: 'ban',
  Edit: 'pencil',
  'Clone Invoice': 'copy',
  Delete: 'trash-2'
};

@Component({
  selector: 'app-v4-invoice-action',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatTooltip
  ],
  templateUrl: './v4-invoice-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4InvoiceActionComponent implements AgRendererComponent {
  private params!: IV4InvoiceActionParams;
  private rowData!: IInvoiceRowData;
  visibleActions: IInvoiceAction[] = [];

  get menuGroups(): IV4ActionGroup<IInvoiceAction>[] {
    return groupV4ActionMenu(this.visibleActions, (item) => item.label);
  }
  showMapButton = false;

  agInit(params: IV4InvoiceActionParams): void {
    this.params = params;
    this.rowData = params.data;
    this.showMapButton = !params.data?.bank_account_id;
    this.visibleActions = this.buildVisibleActions();
  }

  refresh(params: IV4InvoiceActionParams): boolean {
    this.params = params;
    this.rowData = params.data;
    this.showMapButton = !params.data?.bank_account_id;
    this.visibleActions = this.buildVisibleActions();
    return true;
  }

  onViewClick(): void {
    this.params.onViewClick?.(this.rowData);
  }

  onActionClick(label: string): void {
    this.params.onActionClick?.(this.rowData, label);
  }

  onMapClick(): void {
    this.params.onMapClick?.(this.rowData);
  }

  private makeAction(label: string): IInvoiceAction {
    return { label, icon: LUCIDE_ICONS[label] ?? 'circle' };
  }

  private buildVisibleActions(): IInvoiceAction[] {
    if (!this.rowData) {
      return [];
    }

    const {
      status,
      is_mailed: isMailed,
      is_emailed: isEmailed,
      isApprovedXero,
      paid
    } = this.rowData;
    const importStatuses = [7, 10, 11, 12, 13, 14];

    const hide = new Set<string>();

    if (status === 3) {
      // Voided: replace Void with Unvoid, hide Mark Paid + Resend
      hide.add('Void');
      hide.add('Mark Paid / Partially');
      hide.add('Resend Email');
      hide.add('Resend SMS');
    } else if (status === 2) {
      // Paid
      hide.add('Mark Paid / Partially');
      hide.add('Resend Email');
      hide.add('Resend SMS');
      hide.add('Void');
      hide.add('Edit');
    } else if (status === 11 && isApprovedXero === 0) {
      hide.add('Mark Paid / Partially');
      hide.add('Resend Email');
      hide.add('Resend SMS');
      hide.add('Void');
      hide.add('Edit');
      hide.add('Clone Invoice');
    } else if (
      ((importStatuses.slice(0, 3).includes(status) || (paid ?? 0) > 0) &&
        isMailed === 0) ||
      status === 14
    ) {
      // status in [7,10,11] or paid > 0 and not mailed, or Wave import
      hide.add('Resend Email');
      hide.add('Resend SMS');
      hide.add('Void');
      hide.add('Edit');
      hide.add('Clone Invoice');
    } else if (status === 13 && isMailed === 0) {
      hide.add('Resend Email');
      hide.add('Resend SMS');
      hide.add('Edit');
      hide.add('Clone Invoice');
    } else if (status === 12 && isMailed === 0) {
      hide.add('Void');
      hide.add('Edit');
      hide.add('Clone Invoice');
    } else if (importStatuses.includes(status) && isMailed === 1) {
      hide.add('Void');
      hide.add('Edit');
    } else if (status === 1 && isMailed === 1) {
      hide.add('Void');
      hide.add('Edit');
    } else if (status === 1 && isEmailed === 1) {
      hide.add('Resend Email');
      hide.add('Resend SMS');
      hide.add('Void');
      hide.add('Edit');
    } else {
      // Default: status 1, not mailed, not emailed
      hide.add('Resend Email');
      hide.add('Resend SMS');
    }

    const allActions: string[] = [
      'Print',
      'Mark Paid / Partially',
      'Resend Email',
      'Resend SMS',
      'Add Comment',
      'Add Attachment',
      'Invoice Audit Trail',
      status === 3 ? 'Unvoid' : 'Void',
      'Edit',
      'Clone Invoice',
      'Delete'
    ];

    return allActions
      .filter((label) => !hide.has(label))
      .map((label) => this.makeAction(label));
  }
}
