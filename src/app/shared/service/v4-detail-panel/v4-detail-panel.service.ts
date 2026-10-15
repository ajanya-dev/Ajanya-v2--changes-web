import { Injectable, signal } from '@angular/core';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { ICheckListTableRowData } from 'src/app/modules/check/model/check';

/** Above the v4 chrome — header, sidebar and overlays sit at 10004-10020. */
const PANEL_Z_ABOVE_CHROME = 10002;

@Injectable({ providedIn: 'root' })
export class V4DetailPanelService {
  readonly isOpen = signal(false);
  readonly row = signal<ICommonTransactionTableData | null>(null);
  readonly uuid = signal<string>('');
  readonly hideActionButtons = signal(false);
  readonly hidePaymentProof = signal(false);
  /**
   * Backdrop layer for the layout-level host. Callers that need the panel
   * *below* the app chrome (the payments-out table) pass their own value.
   */
  readonly backdropZIndex = signal(PANEL_Z_ABOVE_CHROME);

  open(
    data: ICommonTransactionTableData,
    options?: { hideActionButtons?: boolean; backdropZIndex?: number }
  ): void {
    this.row.set(data);
    this.uuid.set(data.uu_id);
    this.hideActionButtons.set(options?.hideActionButtons ?? false);
    this.hidePaymentProof.set(false);
    this.backdropZIndex.set(options?.backdropZIndex ?? PANEL_Z_ABOVE_CHROME);
    this.isOpen.set(true);
  }

  openCheck(
    data: ICheckListTableRowData & { uu_id?: string },
    options?: { hidePaymentProof?: boolean; backdropZIndex?: number }
  ): void {
    const checkId = data.id ?? data.action;
    const mapped: ICommonTransactionTableData = {
      transfer_type: 'CHECK',
      transfer_type_code: 'check',
      transfer_id: checkId,
      uu_id: data.uu_id ?? checkId ?? '',
      amount: data.cheque_amount,
      source_name: data.bank_account_account_name,
      payee_name: data.payee_name,
      payee_id: data.payee_id,
      created_at: data.created_at,
      cheque_status: data.cheque_status,
      action: data.action,
      cheque_serial_number: data.cheque_serial_number
    } as unknown as ICommonTransactionTableData;
    this.row.set(mapped);
    this.uuid.set(mapped.uu_id);
    this.hideActionButtons.set(false);
    this.hidePaymentProof.set(options?.hidePaymentProof ?? false);
    this.backdropZIndex.set(options?.backdropZIndex ?? PANEL_Z_ABOVE_CHROME);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    // Reset uuid so reopening the same row re-triggers the panel's
    // toObservable(uuid) fetch (signals don't re-emit an unchanged value).
    // Without this, reopening a row after an action like Void shows stale
    // data (e.g. the check preview missing the VOIDED overlay) until a reload.
    this.uuid.set('');
  }
}
