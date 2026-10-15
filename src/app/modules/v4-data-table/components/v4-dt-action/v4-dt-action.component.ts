import {
  Component,
  DestroyRef,
  OnInit,
  inject,
  InputSignal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICellRendererParams } from '@ag-grid-community/core';
import { AgRendererComponent } from '@ag-grid-community/angular';
import { NgStyle, NgClass } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { LucideAngularModule } from 'lucide-angular';
import { LUCIDE_ICONS_V4 } from 'src/app/shared/V4/lucide-icons';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import {
  IDtActionCompProp,
  IDtColumnFields
} from 'src/app/modules/data-table/model/datatable';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { Router } from '@angular/router';

interface IUpdatedCellRendererParams extends ICellRendererParams {
  tableName?: string;
  tableId?: string;
  isHideAction?: InputSignal<boolean>;
}

interface IGetData {
  data: IDtColumnFields[];
  values: IActionMenuItem[] | undefined;
}

interface IActionMenuItem {
  name: string;
  id: string;
  icon: string;
  color?: string;
  toolTip?: string | undefined;
  svg?: string | undefined;
  divider?: boolean;
}

/** A menu item paired with its index in the unfiltered action list. */
interface IIndexedMenuItem {
  item: IActionMenuItem;
  index: number;
}

/**
 * v3-era action lists still hand this menu FontAwesome class strings
 * ('fa fa-check', 'fa-solid fa-paper-plane'). `<lucide-icon>` throws on a name
 * it was never given, and that throw takes the row's other cells down with it —
 * which is why a grid can come up with every column blank. Translate the names
 * we know, and send anything still unregistered to a neutral dot so no single
 * icon can break a row again.
 */
const FA_TO_LUCIDE: Record<string, string> = {
  ban: 'ban',
  check: 'check',
  'check-circle': 'circle-check',
  'circle-check': 'circle-check',
  clone: 'copy',
  close: 'x',
  'clock-rotate-left': 'history',
  comment: 'message-square',
  comments: 'message-square',
  copy: 'copy',
  'credit-card': 'credit-card',
  download: 'download',
  envelope: 'mail',
  eye: 'eye',
  'file-lines': 'file-text',
  'file-text': 'file-text',
  history: 'history',
  paperclip: 'paperclip',
  'paper-plane': 'send',
  pencil: 'square-pen',
  'pen-to-square': 'square-pen',
  plus: 'plus',
  print: 'printer',
  receipt: 'receipt',
  times: 'x',
  trash: 'trash-2',
  'trash-can': 'trash-2',
  user: 'user',
  users: 'users',
  xmark: 'x'
};

/** FontAwesome style/sizing tokens that are never the icon's name. */
const FA_MODIFIERS = new Set([
  'solid',
  'regular',
  'light',
  'thin',
  'duotone',
  'brands',
  'fw',
  'xs',
  'sm',
  'lg',
  'xl',
  '2x',
  '3x',
  'spin'
]);

const ICON_FALLBACK = 'circle';

/** Match Lucide's own loose name matching: case- and separator-insensitive. */
const iconKey = (name: string): string =>
  name.replace(/[^a-z0-9]/gi, '').toLowerCase();

const REGISTERED_ICONS = new Set(Object.keys(LUCIDE_ICONS_V4).map(iconKey));

/** Row ⋮ menu is grouped (design O5): Actions · Documents · Proof. */
type TMenuGroup = 'ACTIONS' | 'DOCUMENTS' | 'PROOF';
const GROUP_ORDER: TMenuGroup[] = ['ACTIONS', 'DOCUMENTS', 'PROOF'];
const GROUP_LABEL: Record<TMenuGroup, string> = {
  ACTIONS: 'Actions',
  DOCUMENTS: 'Documents',
  PROOF: 'Proof'
};

/** Anything not listed here falls into Actions. */
const ACTION_GROUP: Record<string, TMenuGroup> = {
  'Payee Summary': 'DOCUMENTS',
  'Vendor Summary': 'DOCUMENTS',
  'Check Activity': 'DOCUMENTS',
  'Audit Trail': 'DOCUMENTS',
  'Add Comment': 'DOCUMENTS',
  'Add Attachment': 'DOCUMENTS',
  'Send Payment Proof': 'PROOF',
  'Send Mail Payment Proof': 'PROOF',
  'Get Signed Receipt': 'PROOF',
  'Proof of Mail': 'PROOF',
  'Add Proof of Delivery': 'PROOF'
};

/** Exact item order within each group, per design O5. */
const DESIGN_ORDER: Record<string, number> = [
  // Actions
  'Accept',
  'Approve',
  'Reject',
  'Print',
  'Edit',
  'Edit Payee',
  'Void',
  'Cancel',
  'Re-Email this Check',
  'Resend',
  'Delete',
  'Clone This Check',
  'Mark As Printed',
  'Mark as Forcefully Printed',
  'Pay by Credit Card',
  'Pause',
  'Resume',
  // Documents
  'Add Comment',
  'Add Attachment',
  'Payee Summary',
  'Vendor Summary',
  'Check Activity',
  'Audit Trail',
  // Proof
  'Send Payment Proof',
  'Send Mail Payment Proof',
  'Get Signed Receipt',
  'Proof of Mail',
  'Add Proof of Delivery'
].reduce((acc, label, i) => ({ ...acc, [label]: i }), {});

@Component({
  selector: 'app-v4-dt-action',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatTooltip,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    NgStyle,
    NgClass
  ],
  templateUrl: './v4-dt-action.component.html',
  styleUrl: './v4-dt-action.component.scss'
})
export class V4DtActionComponent implements AgRendererComponent, OnInit {
  private dataTableService = inject(DataTableService);
  private localStorageService = inject(LocalStorageService);
  private alertService = inject(V4AlertService);
  private paymentService = inject(PaymentsService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  params: IUpdatedCellRendererParams;
  getCurrentColumn: { [x: string]: unknown };
  getValues: IActionMenuItem[] | undefined;
  isDisableData: { isDisable: boolean; selectedIds: string[] };
  actionButtonMode: IDtActionCompProp | undefined;
  companyType = this.localStorageService.getItem('activeCompanyType');
  tableName: string;
  tableId: number | undefined;

  refresh(): boolean {
    return true;
  }

  agInit(params: IUpdatedCellRendererParams): void {
    this.params = params;
    this.tableId = (this.params?.colDef as Record<string, unknown>)?.tableId as number;
    this.tableName =
      this.params?.colDef?.floatingFilterComponentParams?.tableName;
    this.getCurrentColumn = { ...this.params.data, index: this.params.node.id };

    const getData: IGetData = this.dataTableService.getCellrendrerData(
      this.tableId
    );
    this.getValues = getData.values;
  }

  ngOnInit(): void {
    // One instance of this renderer exists per row, so an unterminated
    // subscription to a long-lived subject accumulates on every table refresh.
    this.dataTableService.isDisable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.isDisableData = res;
      });


    if (this.tableId) {
      this.actionButtonMode = this.dataTableService.getActionMode(this.tableId);
    } else {
      this.actionButtonMode = this.dataTableService.getActionMode();
    }
    this.setActionForInvoice();
  }

  private setActionForInvoice(): void {
    if (this.tableName === 'invoice_table') {
      if (this.params.data.enableTriangle === 1) {
        this.actionButtonMode = { bankNotVerified: true };
      } else {
        this.actionButtonMode = { eyeButton: true, actionButton: true };
      }
    } else if (this.tableName === 'check_list_table') {
      this.actionButtonMode = { ...this.actionButtonMode, cardButton: true };
    } else if (this.tableName === 'single_mail_history_table') {
      this.actionButtonMode = {
        ...this.actionButtonMode,
        eyeButton: true,
        actionButton: false
      };
    }
  }

  /**
   * @description Groups the ⋮ items into the design O5 sections, dropping the
   * ones this row hides. Read live off `getValues` (rather than snapshotted in
   * agInit) because callers mutate that list via `setCellRendererAction`.
   * Each entry keeps its index in the unfiltered list — the disable flags in
   * `isDisableData.selectedIds` are matched positionally against it.
   */
  get menuGroups(): { title: string; items: IIndexedMenuItem[] }[] {
    const rank = (name: string): number => DESIGN_ORDER[name] ?? 99;
    const visible = (this.getValues ?? [])
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => this.isItemVisible(item));

    return GROUP_ORDER.map((group) => ({
      title: GROUP_LABEL[group],
      items: visible
        .filter(({ item }) => (ACTION_GROUP[item.name] ?? 'ACTIONS') === group)
        .sort((a, b) => rank(a.item.name) - rank(b.item.name))
    })).filter((group) => group.items.length > 0);
  }

  /**
   * Resolves an action item's icon to a name `<lucide-icon>` will actually
   * find — translating a legacy FontAwesome class string on the way — and
   * falls back to a neutral dot rather than letting an unknown name throw.
   */
  iconName(item: IActionMenuItem): string {
    const raw = item.icon?.trim();
    if (!raw) return ICON_FALLBACK;
    const faName = raw
      .split(/\s+/)
      .filter((token) => token.startsWith('fa-'))
      .map((token) => token.slice(3))
      .find((token) => !FA_MODIFIERS.has(token));
    const name = faName ? (FA_TO_LUCIDE[faName] ?? '') : raw;
    return REGISTERED_ICONS.has(iconKey(name)) ? name : ICON_FALLBACK;
  }

  private isItemVisible(btn: IActionMenuItem): boolean {
    if (btn.id === 'RId_printReceipt' && this.params.data?.cheque_status !== 7) {
      return false;
    }
    if (btn.id === 'id_send_now' && this.params.data?.status !== 'pending') {
      return false;
    }
    return true;
  }

  actionButtonClick(): void {
    this.dataTableService.setDataFromActionComp(
      this.getCurrentColumn,
      '',
      this.tableId
    );
  }

  actionMoreClick(type: string): void {
    let id: string;
    switch (type) {
      case 's':
        id = 'id_setting_button';
        break;
      case 'd':
        id = 'id_danger_button';
        break;
      case 'e':
        id = 'id_edit_button';
        break;
      case 'dlt':
        id = 'id_delete_button';
        break;
      case 'bnv':
        id = 'id_bank_not_verified';
        this.dataTableService.setDataFromActionComp(this.getCurrentColumn, id);
        return;
      case 'audit':
        id = 'id_audit_trial';
        break;
      default:
        return;
    }
    this.dataTableService.setDataFromActionDangerComp(
      this.getCurrentColumn,
      id,
      this.tableId
    );
  }

  eyeButtonClick(): void {
    this.dataTableService.setDataFromActionViewComp(this.getCurrentColumn, '');
  }

  onButtonClick(
    id: string,
    index: number,
    name: string,
    event: Event,
    toolTip?: MatTooltip
  ): void {
    if (toolTip?.message === 'Coming Soon') {
      event.stopPropagation();
      toolTip.show();
      return;
    }
    if (
      this.isDisableData.isDisable &&
      this.isDisableData.selectedIds[index] === id
    ) {
      return;
    }
    this.dataTableService.setDataFromActionComp(this.getCurrentColumn, id);
  }

  isInvited(text: string): boolean {
    return (
      this.companyType === 'invcomp' &&
      (text === 'approve' || text === 'Reject')
    );
  }

  cardButtonClick(): void {
    const eligibleCheckStatus = [0, 1, 11, 440, 441, 502, 507, 807] as const;
    if (!eligibleCheckStatus.includes(this.params.data?.cheque_status)) {
      this.alertService.warningAlert({
        content: 'This action cannot be performed for this transaction.'
      });
      return;
    }
    const selectedPayee = {
      encryptedId: this.params.data?.payee_id,
      name: this.params.data.payee_name
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
