import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { catchError, of } from 'rxjs';

import type { IRemittanceDetails } from 'src/app/models/bank';
import type { IGetAttachment, IGetComment } from 'src/app/models/common';
import type { IPaymentDetails } from 'src/app/modules/payments/model/payments';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-attachment-common-modal/v4-check-add-attachment-common-modal.component';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { AddRemittanceV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/add-remittance-v4/add-remittance-v4.component';

import { PaymentFeeService } from './payment-fee.service';
import { SendSourceRegistryService } from './send-source-registry.service';
import { SendStateService } from './send-state.service';
import { ExportCheckService } from '../../bank/services/export-check.service';
import { IActivityResource } from '../models/send-source.model';

interface ICommentModalResult {
  success?: boolean;
  existingData?: IGetComment[];
}

interface IAttachmentModalResult {
  existingData?: IGetAttachment[];
}

/** One attachment, as the envelope picker and the confirmation modal list it. */
export interface IAttachmentItem {
  id: string;
  name: string;
  pageCount?: number;
}

/**
 * The file's own name. The list and the upload response disagree on which key
 * carries it, and a nickname is what the user typed, so it wins over both.
 */
function attachmentName(a: IGetAttachment): string {
  return (
    a.file_nick_name?.trim() ||
    a.fileName?.trim() ||
    a.file_name?.trim() ||
    'Attachment'
  );
}

/** What the remittance modal hands back. `remittanceType` is set only by Submit. */
interface IRemittanceModalResult {
  data?: IRemittanceDetails[];
  grandTotal: number;
  paymentTotal: number;
  insert: boolean;
  format: boolean;
  remittanceType?: number;
}

/**
 * The attachments, comments and remittance hanging off a payment: loading them, opening
 * the three modals, and keeping the active source's id arrays in step.
 */
@Injectable()
export class PaymentActivityService {
  private dialog = inject(MatDialog);
  private shared = inject(SharedService);
  private checks = inject(CheckService);
  private bills = inject(BillService);
  private payments = inject(PaymentsService);
  private state = inject(SendStateService);
  private sources = inject(SendSourceRegistryService);
  private fees = inject(PaymentFeeService);
  private destroyRef = inject(DestroyRef);
  private exports = inject(ExportCheckService);

  private comments: IGetComment[] = [];
  private attachments: IGetAttachment[] = [];

  /** Badge counts on the Attach / Comment buttons. */
  readonly attachmentCount = signal(0);
  readonly commentCount = signal(0);

  /**
   * The files themselves, named. The envelope picker and the confirmation modal
   * both list them, and a list of ids can only say "Attachment" four times.
   */
  readonly attachmentItems = signal<IAttachmentItem[]>([]);
  /** A tick over the Remittance button once the payment has line items. */
  readonly hasRemittance = signal(false);

  /**
   * How many line items the remittance holds. The button reads it the way Attach
   * and Comment read theirs — a bare tick said only "something is here", which on
   * a 16px badge is an unreadable dot.
   */
  readonly remittanceCount = signal(0);

  /** Totals the modal owns; the payload itself lives on the source service. */
  private remittancePaymentTotal = 0;
  private remittanceGrandTotal = 0;
  private remittanceFormat = true;
  selectedZilPaymentId: string|number = 0;
  selectedCheckPaymentId: string|number = 0;

  /**
   * Load what is already attached to a payment being edited. Without it an update
   * writes empty id arrays back, stripping everything attached to the payment.
   */
  loadForPayment(details: IPaymentDetails): void {
    // A check's files and comments hang off the *check*, not off the payment it
    // was written from.
    if (this.sources.isBankCheck()) {
      const checkId = details.transfer?.id;
      this.selectedCheckPaymentId = checkId;
      this.exports.hasQboExportData.set(details?.hasQboExportData === 1);
      if (checkId) {
        this.loadForCheck(checkId);
      }
      return;
    }

    const zilId = details.zilpaymentId || details.id;
    if (!zilId) {
      return;
    }
    this.selectedZilPaymentId = zilId;
    this.loadZilAttachments(zilId);
    this.loadZilComments(zilId);
    this.loadZilRemittance(zilId);
  }

  private loadZilAttachments(zilId: string): void {
    this.shared
      .getAttachment('zil-payments', zilId)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.applyAttachments(res?.data ?? []));
  }

  private loadZilComments(zilId: string): void {
    this.shared
      .getZilPaymentsComments(zilId)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.applyComments((res?.data ?? []) as IGetComment[]));
  }

  private loadZilRemittance(zilId: string): void {
    this.shared
      .getZilPaymentsRemitance(zilId)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const items = (res?.data?.items_by_array ?? []) as IRemittanceDetails[];
        if (!items.length) {
          return;
        }
        const source = this.sources.active();
        source.remittanceItems = items;
        source.remittanceType = res?.data?.type ?? 0;
        this.hasRemittance.set(true);
        this.remittanceCount.set(items.length);
        // `type` names the format: 1 is the new one, 0 the invoice-totalled one.
        this.remittanceFormat = source.remittanceType === 1;
      });
  }

  /** A check keeps its files and comments under `/checks/{id}`; its remittance
   *  arrives with the check body, which BankCheckService restores. */
  private loadForCheck(checkId: string): void {
    this.checks
      .getCheckAttachment(checkId)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) =>
        this.applyAttachments((res?.data ?? []) as unknown as IGetAttachment[])
      );

    this.checks
      .getAllCheckComments(checkId)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => this.applyComments((res?.data ?? []) as IGetComment[]));
  }

  /** The files already on the bill ride along with the payment that settles it. */
  loadForBill(billId: string): void {
    this.bills
      .getAttachments(billId)
      .pipe(catchError(() => of(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const items = res?.data ?? [];
        if (!items.length) {
          return;
        }
        this.applyAttachments(
          items.map((a) => ({
            ...a,
            id: a.encrypted_id,
            fileName: a.file_name
          })) as unknown as IGetAttachment[]
        );
      });
  }

  /** The bill carries its own comment count. */
  setCommentCountFromBill(count: number): void {
    this.commentCount.set(count);
  }

  // ---------------------------------------------------------------------------
  // Applying
  // ---------------------------------------------------------------------------

  /**
   * The GET list keys attachments by `encrypted_id`; the upload response for a
   * check that does not exist yet returns that same encrypted id as `id`.
   */
  private applyAttachments(items: IGetAttachment[]): void {
    this.attachments = items;
    this.attachmentCount.set(items.length);

    const ids = items
      .map((a) => String(a.encrypted_id ?? a.id ?? ''))
      .filter(Boolean);
    this.attachmentItems.set(
      items
        .map((a) => ({
          id: String(a.encrypted_id ?? a.id ?? ''),
          name: attachmentName(a),
          pageCount: a.page_count || undefined
        }))
        .filter((a) => !!a.id)
    );
    this.sources.active().attachmentIds = ids;
    if (this.state.methodId() !== 'check_mail') {
      this.fees.setAttachmentIds(ids);
    }
  }

  /** The API keys comments by their encrypted id, never the numeric one. */
  private applyComments(items: IGetComment[]): void {
    this.comments = items;
    this.commentCount.set(items.length);
    this.sources.active().commentIds = items
      .map((c) => c.encrypted_id)
      .filter(Boolean);
  }

  // ---------------------------------------------------------------------------
  // Modals
  // ---------------------------------------------------------------------------

  /** What the two modals file against: a check record, or the zil-payment itself. */
  private activityResource(): IActivityResource {
    return this.sources.isBankCheck()
      ? { id: this.selectedCheckPaymentId, type: 'checks' }
      : {
          id: this.selectedZilPaymentId,
          type: 'zil-payments',
          mode: 'zil_payments'
        };
  }

  openComments(): void {
    const resource = this.activityResource();

    this.dialog
      .open(V4CheckAddCommentModalComponent, {
        maxWidth: '800px',
        width: '93%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: {
          id: resource.id,
          type: resource.type,
          ...(resource.mode && { mode: resource.mode }),
          existingData: this.comments,
          enableDelete: true
        }
      })
      .afterClosed()
      .subscribe((res?: ICommentModalResult) => {
        if (res?.success) {
          this.applyComments(res.existingData ?? []);
        }
      });
  }

  openAttachments(): void {
    const resource = this.activityResource();

    this.dialog
      .open(V4CheckAddAttachmentCommonModalComponent, {
        maxWidth: '600px',
        width: '93%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: {
          id: resource.id,
          // No mode is what puts the modal into check mode.
          ...(resource.mode && { mode: resource.mode }),
          existingData: this.attachments
        }
      })
      .afterClosed()
      .subscribe((res?: IAttachmentModalResult) => {
        if (res?.existingData) {
          this.applyAttachments(res.existingData);
        }
      });
  }

  openRemittance(): void {
    const source = this.sources.active();
    // A mailed check prints its remittance on a fixed stub, so the format is not
    // the user's to switch.
    const isMailedCheck = this.state.methodId() === 'check_mail';

    this.dialog
      .open(AddRemittanceV4Component, {
        width: '1100px',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: {
          remitance: source.remittanceItems,
          remittanceType: source.remittanceType,
          paymentTotal: this.remittancePaymentTotal,
          grandTotal: this.remittanceGrandTotal,
          format: isMailedCheck ? true : this.remittanceFormat,
          insert: source.insertFromRemittance,
          amount: Number(this.state.coreForm.controls.amount.value),
          type: 'check',
          hideSwitchFormat: isMailedCheck
        }
      })
      .afterClosed()
      .subscribe((res?: IRemittanceModalResult) => {
        if (res) {
          this.applyRemittance(res);
        }
      });
  }

  private applyRemittance(res: IRemittanceModalResult): void {
    const source = this.sources.active();

    this.remittanceFormat = res.format;
    this.remittancePaymentTotal = res.paymentTotal;
    this.remittanceGrandTotal = res.grandTotal;

    // The modal already drops the blank rows, so a non-empty list means the user
    // actually entered remittance.
    source.remittanceItems = res.data ?? [];
    this.hasRemittance.set(source.remittanceItems.length > 0);
    this.remittanceCount.set(source.remittanceItems.length);
    source.insertFromRemittance = !!res.insert;
    // The dismiss path (`close()`) omits remittanceType; only `submit()` sets it.
    source.remittanceType = res.remittanceType ?? source.remittanceType;

    this.insertRemittanceTotal(res);
    this.writeBackRemittanceOnEdit();
  }

  /**
   * "Insert to check" makes the remittance total the payment amount. The new
   * format totals the payment column; the old one totals the invoices.
   */
  private insertRemittanceTotal(res: IRemittanceModalResult): void {
    if (!res.insert) {
      return;
    }
    const total = res.format ? res.paymentTotal : res.grandTotal;
    if (total) {
      this.state.coreForm.controls.amount.setValue(String(total));
    }
  }

  /**
   * A zil-payment's line items live in a record of their own, written back on modal
   * close, not on save. A check's ride on the check body.
   */
  private writeBackRemittanceOnEdit(): void {
    const source = this.sources.active();
    const paymentId = this.state.paymentId();

    if (this.state.mode() !== 'EDIT' || !paymentId || this.sources.isBankCheck()) {
      return;
    }

    this.payments.updateRemittanceData(
      source.remittanceItems,
      source.insertFromRemittance,
      'EDIT',
      paymentId,
      source.remittanceType
    );
  }

  /** The attachments, comments and remittance belonged to the payment just sent. */
  clear(): void {
    this.comments = [];
    this.attachments = [];
    this.attachmentCount.set(0);
    this.attachmentItems.set([]);
    this.commentCount.set(0);
    this.hasRemittance.set(false);
    this.remittanceCount.set(0);
    this.remittancePaymentTotal = 0;
    this.remittanceGrandTotal = 0;
    // The new format is the default the modal opens on; `false` would reopen it
    // in the legacy invoice-totalled one.
    this.remittanceFormat = true;
    this.selectedCheckPaymentId = 0;
    this.selectedZilPaymentId = 0;
  }
}
