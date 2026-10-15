import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs/operators';

import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { InvoiceService } from 'src/app/shared/service/invoice/invoice.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { IApiResMesssage } from 'src/app/models/api';
import {
  IAlertRes,
  IInvoiceData,
  IInvoiceRowData
} from 'src/app/modules/invoices/model/invoice';

import { V4AddInvoiceComponent } from '../modals/v4-add-invoice/v4-add-invoice.component';
import { V4AddPaymentComponent } from '../modals/v4-add-payment/v4-add-payment.component';
import { V4EntAddInvoiceComponent } from '../modals/v4-ent-add-invoice/v4-ent-add-invoice.component';

export interface IInvoiceActionCallbacks {
  /** Fires when the action completed a backend mutation (delete/void/edit/etc.). */
  onChanged?: () => void;
  /** Fires after void/unvoid so callers can patch the row's status locally. */
  onStatusPatched?: (status: number) => void;
}

@Injectable({ providedIn: 'root' })
export class InvoiceActionsService {
  private alertService = inject(V4AlertService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private headerService = inject(HeaderService);
  private invoiceService = inject(InvoiceService);
  private payeeModalService = inject(PayeeModalService);

  private isEnablePricingRule = false;

  constructor() {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(
        filter((res) => !!res),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res) {
          this.isEnablePricingRule = res.enabledPlugins.includes(
            'invoice_pricing_rule'
          );
        }
      });
  }

  handleInvoiceAction(
    row: IInvoiceRowData,
    label: string,
    callbacks: IInvoiceActionCallbacks = {}
  ): void {
    switch (label) {
      case 'Print':
        this.printInvoice(row);
        break;
      case 'Mark Paid / Partially':
        this.markAsPaid(row, callbacks);
        break;
      case 'Resend Email':
        this.resendEmail(row);
        break;
      case 'Resend SMS':
        this.resendSMS(row, callbacks);
        break;
      case 'Void':
        this.voidInvoice(row, callbacks);
        break;
      case 'Unvoid':
        this.unvoidInvoice(row, callbacks);
        break;
      case 'Edit':
        this.editInvoice(row, callbacks);
        break;
      case 'Clone Invoice':
        this.cloneInvoice(row, callbacks);
        break;
      case 'Delete':
        this.deleteInvoice(row, callbacks);
        break;
      default:
        break;
    }
  }

  printInvoice(row: IInvoiceRowData): void {
    this.invoiceService
      .singleprint(row.action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res.success) {
          const iframe = document.createElement('iframe');
          iframe.srcdoc = res.data.printData;
          iframe.style.visibility = 'hidden';
          document.body.appendChild(iframe);
        }
      });
  }

  markAsPaid(
    row: IInvoiceRowData,
    callbacks: IInvoiceActionCallbacks
  ): void {
    this.dialog
      .open(V4AddPaymentComponent, {
        maxWidth: '480px',
        width: '95%',
        panelClass: 'paddingless-modal-rounded',
        data: {
          id: row.action,
          invoiceNo: row.invoice_no,
          payeeName: row.payee_name,
          balance: row.balance
        }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) callbacks.onChanged?.();
      });
  }

  resendEmail(row: IInvoiceRowData): void {
    this.invoiceService
      .resendEmail({ id: row.action, type: 1 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.alertService.successAlert({
            title: 'success',
            content: 'Email resent',
            close: true,
            timeout: 2000
          });
          this.headerService.setHeaderValueChanged(true);
        }
      });
  }

  resendSMS(row: IInvoiceRowData, callbacks: IInvoiceActionCallbacks): void {
    this.invoiceService
      .resendEmail({ id: row.action, type: 2 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: IApiResMesssage) => {
          if (res) {
            this.alertService.successAlert({
              title: 'success',
              content: 'SMS resent',
              close: true,
              timeout: 2000
            });
            this.headerService.setHeaderValueChanged(true);
          }
        },
        error: (err: IAlertRes) => {
          this.resendSmsValidation(err, row, callbacks);
        }
      });
  }

  private resendSmsValidation(
    err: IAlertRes,
    row: IInvoiceRowData,
    callbacks: IInvoiceActionCallbacks
  ): void {
    if (err.error?.errorCode !== 514) return;
    this.alertService
      .warningAlert({
        content: 'Invalid payee Phone number, please update',
        doneMsg: 'Add',
        isCancel: true,
        cancelMsg: 'Not Now'
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res) return;
        this.payeeModalService
          .openEditPayee(
            row.payee_id,
            'addPayeeModal',
            {
              edit: true,
              id: row.payee_id,
              type: ['payeePhone']
            },
            true
          )
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((payeeModal) => {
            if (!payeeModal) return;
            payeeModal
              .afterClosed()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((resData) => {
                if (resData?.success) {
                  this.resendSMS(row, callbacks);
                  callbacks.onChanged?.();
                }
              });
          });
      });
  }

  voidInvoice(row: IInvoiceRowData, callbacks: IInvoiceActionCallbacks): void {
    this.alertService
      .confirmAlert({ content: 'Are you sure you want to void?' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.invoiceService
          .voidSingleInvoice(row.action)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res.success) {
              callbacks.onChanged?.();
              callbacks.onStatusPatched?.(3);
              this.alertService.successAlert({
                title: 'Success',
                content: 'Invoice Voided ',
                timeout: 2000,
                close: true
              });
            }
          });
      });
  }

  unvoidInvoice(
    row: IInvoiceRowData,
    callbacks: IInvoiceActionCallbacks
  ): void {
    this.alertService
      .confirmAlert({ content: 'Are you sure you want to Unvoid?' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.invoiceService
          .UnvoidSingleInvoice(row.action)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res.success) {
              callbacks.onChanged?.();
              callbacks.onStatusPatched?.(1);
              this.alertService.successAlert({
                title: 'Success',
                content: 'Invoice Unvoided ',
                timeout: 2000,
                close: true
              });
            }
          });
      });
  }

  editInvoice(row: IInvoiceRowData, callbacks: IInvoiceActionCallbacks): void {
    this.invoiceService
      .getInvoiceData(row.action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: { data: IInvoiceData }) => {
        if (this.isEnablePricingRule) {
          this.openEntInvoiceModal(res.data, callbacks);
        } else {
          this.openInvoiceModal(res.data, false, callbacks);
        }
      });
  }

  cloneInvoice(
    row: IInvoiceRowData,
    callbacks: IInvoiceActionCallbacks
  ): void {
    this.invoiceService
      .getInvoiceData(row.action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: { data: IInvoiceData }) => {
        if (this.isEnablePricingRule) {
          this.openEntInvoiceModal(res.data, callbacks);
        } else {
          this.openInvoiceModal(res.data, true, callbacks);
        }
      });
  }

  private openInvoiceModal(
    invoiceData: IInvoiceData,
    isClone: boolean,
    callbacks: IInvoiceActionCallbacks
  ): void {
    this.dialog
      .open(V4AddInvoiceComponent, {
        maxWidth: '1100px',
        width: '99%',
        height: '96vh',
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: { data: invoiceData, isClone }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) callbacks.onChanged?.();
      });
  }

  private openEntInvoiceModal(
    invoiceData: IInvoiceData,
    callbacks: IInvoiceActionCallbacks
  ): void {
    this.dialog
      .open(V4EntAddInvoiceComponent, {
        disableClose: true,
        maxWidth: '900px',
        width: '99%',
        maxHeight: '83%',
        autoFocus: false,
        panelClass: 'paddingless-modal-rounded',
        data: { data: invoiceData, isClone: false }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) callbacks.onChanged?.();
      });
  }

  deleteInvoice(
    row: IInvoiceRowData,
    callbacks: IInvoiceActionCallbacks
  ): void {
    this.alertService
      .confirmAlert({ content: 'Are you sure you want to delete?' })
      .afterClosed()
      .subscribe((result) => {
        if (!result) return;
        this.invoiceService
          .DeleteSingleInvoice(row.action)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res.success) {
              callbacks.onChanged?.();
              this.alertService.successAlert({
                title: 'Success',
                content: 'Invoice Deleted ',
                timeout: 2000,
                close: true
              });
            }
          });
      });
  }
}
