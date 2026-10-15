import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { AgRendererComponent } from '@ag-grid-community/angular';
import { LucideAngularModule } from 'lucide-angular';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { environment } from 'src/environments/environment';
import {
  ICheckListTableRowData,
  ICheckStatus
} from 'src/app/modules/check/model/check';
import { ICheckActionList } from 'src/app/modules/payments/model/payments';
import { ACTION_TOOLTIPS } from 'src/app/shared/v3/dt-cellrenderers/v4-view-button/v4-view-actions';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { Router } from '@angular/router';

interface IV4CheckActionParams extends ICellRendererParams {
  checkStatusMap: Record<number, ICheckStatus>;
  isHamaspik: boolean;
  onViewClick: (row: ICheckListTableRowData) => void;
  onActionClick: (row: ICheckListTableRowData, label: string) => void;
}

const LUCIDE_ICONS: Record<string, string> = {
  Print: 'printer',
  Edit: 'pencil',
  Void: 'ban',
  Delete: 'trash-2',
  'Pay by Credit Card': 'credit-card',
  'Clone This Check': 'copy',
  'Payee Summary': 'circle-user',
  'Vendor Summary': 'circle-user',
  'Audit Activity': 'activity',
  'Add Comment': 'message-square',
  'Add Attachment': 'paperclip',
  'Proof of Mail': 'receipt',
  Approve: 'check',
  Reject: 'x',
  'Re-Email this Check': 'send',
  'Mark as Forcefully Printed': 'check'
};

/** Row ⋮ menu is grouped (design O5): Actions · Documents · Proof. */
type TMenuGroup = 'ACTIONS' | 'DOCUMENTS' | 'PROOF';
const GROUP_ORDER: TMenuGroup[] = ['ACTIONS', 'DOCUMENTS', 'PROOF'];
const ACTION_GROUP: Record<string, TMenuGroup> = {
  Approve: 'ACTIONS',
  Reject: 'ACTIONS',
  Print: 'ACTIONS',
  Edit: 'ACTIONS',
  'Edit Payee': 'ACTIONS',
  Void: 'ACTIONS',
  Delete: 'ACTIONS',
  'Pay by Credit Card': 'ACTIONS',
  'Clone This Check': 'ACTIONS',
  'Mark as Forcefully Printed': 'ACTIONS',
  'Re-Email this Check': 'ACTIONS',
  'Payee Summary': 'DOCUMENTS',
  'Vendor Summary': 'DOCUMENTS',
  'Audit Activity': 'DOCUMENTS',
  'Add Comment': 'DOCUMENTS',
  'Add Attachment': 'DOCUMENTS',
  'Proof of Mail': 'PROOF'
};

/** Exact item order within each group, per design O5. */
const DESIGN_ORDER: Record<string, number> = [
  // Actions
  'Approve',
  'Reject',
  'Print',
  'Edit',
  'Void',
  'Re-Email this Check',
  'Delete',
  'Clone This Check',
  'Mark as Forcefully Printed',
  'Pay by Credit Card',
  'Edit Payee',
  // Documents
  'Add Comment',
  'Add Attachment',
  'Payee Summary',
  'Vendor Summary',
  'Audit Activity',
  // Proof
  'Send Payment Proof',
  'Send Mail Payment Proof',
  'Get Signed Receipt',
  'Proof of Mail'
].reduce((acc, label, i) => ({ ...acc, [label]: i }), {});

@Component({
  selector: 'app-v4-check-action',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatTooltip
  ],
  templateUrl: './v4-check-action.component.html',
  styleUrls: ['./v4-check-action.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4CheckActionComponent implements AgRendererComponent {
  private alertService = inject(V4AlertService);
  private paymentService = inject(PaymentsService);
  private router = inject(Router);

  private params!: IV4CheckActionParams;
  private rowData!: ICheckListTableRowData;
  visibleActions: ICheckActionList[] = [];
  groupedActions: { title: TMenuGroup; items: ICheckActionList[] }[] = [];
  isCompass = environment.env_id === 'compass';

  private checkStatusMap: Record<number, ICheckStatus> = {};
  private isHamaspik = false;

  agInit(params: IV4CheckActionParams): void {
    this.params = params;
    this.rowData = params.data;
    this.checkStatusMap = params.checkStatusMap ?? {};
    this.isHamaspik = params.isHamaspik ?? false;
    this.visibleActions = this.buildVisibleActions();
    this.groupedActions = this.buildGroupedActions();
  }

  refresh(params: IV4CheckActionParams): boolean {
    this.params = params;
    this.rowData = params.data;
    this.checkStatusMap = params.checkStatusMap ?? {};
    this.isHamaspik = params.isHamaspik ?? false;
    this.visibleActions = this.buildVisibleActions();
    this.groupedActions = this.buildGroupedActions();
    return true;
  }

  private buildGroupedActions(): {
    title: TMenuGroup;
    items: ICheckActionList[];
  }[] {
    const rank = (label: string): number => DESIGN_ORDER[label] ?? 99;
    return GROUP_ORDER.map((title) => ({
      title,
      items: this.visibleActions
        .filter((a) => (ACTION_GROUP[a.label] ?? 'ACTIONS') === title)
        .sort((a, b) => rank(a.label) - rank(b.label))
    })).filter((g) => g.items.length > 0);
  }

  onViewClick(): void {
    this.params.onViewClick?.(this.rowData);
  }

  onActionClick(label: string): void {
    this.params.onActionClick?.(this.rowData, label);
  }

  getActionTooltip(label: string): string {
    return (ACTION_TOOLTIPS[label] ?? '').replace('{{itemType}}', 'check');
  }

  isActionDisabled(item: ICheckActionList): boolean {
    const status = this.checkStatusMap[this.rowData?.cheque_status];
    const isImported = this.rowData?.create_check_from === 1;

    if (item.label === 'Print') {
      if (
        !status?.isItPrintAble ||
        this.rowData?.bank_account_nature_type === 2 ||
        isImported
      ) {
        return true;
      }
    }

    if (item.label === 'Edit' || item.label === 'Edit Payee') {
      if (status?.isItEditAble === 0 || isImported) return true;
    }

    if (item.label === 'Void') {
      if (status?.isItVoidAble === 0 || isImported) return true;
    }

    if (item.label === 'Delete') {
      if (status?.isItDeleteAble === 0 || isImported) return true;
    }

    if (item.label === 'Clone This Check' && isImported) {
      return true;
    }

    return false;
  }

  private buildVisibleActions(): ICheckActionList[] {
    const base = this.getBaseActions();
    const chequeStatus = this.rowData?.cheque_status;
    const actions: ICheckActionList[] = [];

    if (chequeStatus === 35 && !this.isHamaspik) {
      actions.push(this.makeAction('Approve'), this.makeAction('Reject'));
    }

    actions.push(...base);

    const deleteIdx = actions.findIndex((a) => a.label === 'Delete');

    if (chequeStatus === 504 && deleteIdx !== -1) {
      actions.splice(
        deleteIdx + 1,
        0,
        this.makeAction('Mark as Forcefully Printed')
      );
    }

    if (chequeStatus >= 500 && chequeStatus <= 506 && deleteIdx !== -1) {
      const offset = chequeStatus === 504 ? 2 : 1;
      actions.splice(
        deleteIdx + offset,
        0,
        this.makeAction('Re-Email this Check')
      );
    }

    return actions.filter((a) => {
      if (a.label === 'Proof of Mail' && chequeStatus !== 7) return false;

      const summaryLabel =
        environment.env_id === 'compass' ? 'Vendor Summary' : 'Payee Summary';
      if (a.label === summaryLabel && !this.rowData?.payee_id) return false;

      return true;
    });
  }

  private getBaseActions(): ICheckActionList[] {
    const noDisable = {
      COMPLETED: [] as string[],
      PENDING: [] as string[],
      PROCESSING: [] as string[],
      CANCELED: [] as string[],
      FAILED: [] as string[],
      SCHEDULED: [] as string[]
    };

    if (environment.env_id === 'csnhc') {
      return [
        { label: 'Print', icon: 'printer', disableAt: noDisable },
        { label: 'Edit', icon: 'pencil', disableAt: noDisable },
        { label: 'Delete', icon: 'trash-2', disableAt: noDisable }
      ];
    }

    const summaryLabel =
      environment.env_id === 'compass' ? 'Vendor Summary' : 'Payee Summary';

    return [
      { label: 'Print', icon: 'printer', disableAt: noDisable },
      { label: 'Edit', icon: 'pencil', disableAt: noDisable },
      { label: 'Void', icon: 'ban', disableAt: noDisable },
      { label: 'Delete', icon: 'trash-2', disableAt: noDisable },
      {
        label: 'Pay by Credit Card',
        icon: 'credit-card',
        disableAt: noDisable
      },
      { label: 'Clone This Check', icon: 'copy', disableAt: noDisable },
      { label: summaryLabel, icon: 'circle-user', disableAt: noDisable },
      { label: 'Audit Activity', icon: 'activity', disableAt: noDisable },
      { label: 'Add Comment', icon: 'message-square', disableAt: noDisable },
      { label: 'Add Attachment', icon: 'paperclip', disableAt: noDisable },
      { label: 'Proof of Mail', icon: 'receipt', disableAt: noDisable }
    ];
  }

  private makeAction(label: string): ICheckActionList {
    return {
      label,
      icon: LUCIDE_ICONS[label] ?? 'circle',
      disableAt: {
        COMPLETED: [],
        PENDING: [],
        PROCESSING: [],
        CANCELED: [],
        FAILED: [],
        SCHEDULED: []
      }
    };
  }

  cardButtonClick(): void {
    const eligibleCheckStatus = [0, 1, 11, 440, 441, 502, 507, 807] as const;
    if (!eligibleCheckStatus.includes(this.params.data?.cheque_status)) {
      this.alertService.failedAlert({
        content: 'This action cannot be performed for this transaction.'
      });
      return;
    }
    const selectedPayee = {
      encryptedId: this.params.data?.payee_id,
      name: this.params.data?.payee_name
    };
    const sendData = {
      amount: this.params.data.cheque_amount,
      memo: this.params.data.cheque_memo,
      invoiceNumber: this.params.data.cheque_invoice_number,
      payee: selectedPayee
    };
    this.paymentService.initiatePaymentForm = sendData;
    this.router.navigate(['/v4/manage/payments/pay/card/ach'], {
      state: { backUrl: this.router.url }
    });
  }
}
