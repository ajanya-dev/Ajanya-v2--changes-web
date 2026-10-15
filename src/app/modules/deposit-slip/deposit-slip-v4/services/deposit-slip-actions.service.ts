import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4AddCommentCommonModalComponent } from 'src/app/shared/modal/v4-add-comment-common-modal/v4-add-comment-common-modal.component';
import { IApiRes } from 'src/app/models/api';

export interface IDepositSlipActionCallbacks {
  /** Fires when the action completes (success or failure). Use to clear loading flags. */
  onFinalize?: () => void;
  /** Fires only after a successful backend mutation. Use to refresh local state. */
  onSuccess?: () => void;
}

@Injectable({ providedIn: 'root' })
export class DepositSlipActionsService {
  private alertService = inject(V4AlertService);
  private dataTableService = inject(DataTableService);
  private depositService = inject(DepositSlipsService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  private isPrinting = false;

  verify(id: string, callbacks: IDepositSlipActionCallbacks = {}): void {
    this.alertService
      .confirmAlert({ content: 'Are you sure you want to verify this?' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          callbacks.onFinalize?.();
          return;
        }
        this.depositService
          .verifySlip(id)
          .pipe(
            finalize(() => callbacks.onFinalize?.()),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Deposit slip verified',
                close: true
              });
              this.dataTableService.setRefreshStatus(true);
              callbacks.onSuccess?.();
            }
          });
      });
  }

  verifyMany(ids: string[], callbacks: IDepositSlipActionCallbacks = {}): void {
    this.alertService
      .confirmAlert({ content: 'Are you sure you want to verify this?' })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          callbacks.onFinalize?.();
          return;
        }
        this.depositService
          .multiVerify(ids)
          .pipe(
            finalize(() => callbacks.onFinalize?.()),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Deposit slips verified',
                close: true
              });
              this.dataTableService.setRefreshStatus(true);
              callbacks.onSuccess?.();
            }
          });
      });
  }

  void(ids: string[], callbacks: IDepositSlipActionCallbacks = {}): void {
    this.alertService
      .confirmAlert({
        content: `Are you sure you want to void ${ids.length === 1 ? 'this deposit slip?' : 'these deposit slips?'}`,
        doneMsg: 'Void'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          callbacks.onFinalize?.();
          return;
        }
        this.depositService
          .multiVoid(ids)
          .pipe(
            finalize(() => callbacks.onFinalize?.()),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: ids.length === 1 ? 'Deposit slip voided' : 'Deposit slips voided',
                close: true
              });
              this.dataTableService.setRefreshStatus(true);
              callbacks.onSuccess?.();
            }
          });
      });
  }

  delete(id: string, callbacks: IDepositSlipActionCallbacks = {}): void {
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this?',
        doneMsg: 'Delete'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          callbacks.onFinalize?.();
          return;
        }
        this.depositService
          .deleteSlip(id)
          .pipe(
            finalize(() => callbacks.onFinalize?.()),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Deposit slip deleted',
                close: true
              });
              this.dataTableService.setRefreshStatus(true);
              callbacks.onSuccess?.();
            }
          });
      });
  }

  deleteMany(ids: string[], callbacks: IDepositSlipActionCallbacks = {}): void {
    this.alertService
      .confirmAlert({
        content: 'Are you sure you want to delete this?',
        doneMsg: 'Delete'
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          callbacks.onFinalize?.();
          return;
        }
        this.depositService
          .multiDelete(ids)
          .pipe(
            finalize(() => callbacks.onFinalize?.()),
            takeUntilDestroyed(this.destroyRef)
          )
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Deposit slips deleted',
                close: true
              });
              this.dataTableService.setRefreshStatus(true);
              callbacks.onSuccess?.();
            }
          });
      });
  }

  print(ids: string[], callbacks: IDepositSlipActionCallbacks = {}): void {
    if (this.isPrinting) {
      callbacks.onFinalize?.();
      return;
    }
    this.isPrinting = true;

    this.depositService
      .printBulk(ids)
      .pipe(
        finalize(() => {
          this.isPrinting = false;
          callbacks.onFinalize?.();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data: IApiRes<{ printData: string; url: string }>) => {
          if (data?.success) {
            if (data.data?.url) {
              window.open(data.data.url, '_blank')?.focus();
            } else if (data.data?.printData) {
              const iframes = document.querySelectorAll('iframe');
              for (let i = 0; i < iframes.length; i++) {
                if (iframes[i].id?.includes('print-iframe')) {
                  iframes[i]?.parentNode?.removeChild(iframes[i]);
                }
              }
              const iframe = document.createElement('iframe');
              iframe.id = 'dt-print-iframe';
              iframe.srcdoc = data.data.printData;
              iframe.style.visibility = 'hidden';
              document.body.appendChild(iframe);
            }
            callbacks.onSuccess?.();
          }
        }
      });
  }

  addAttachment(id: string, callbacks: IDepositSlipActionCallbacks = {}): void {
    this.dialog
      .open(V4AddAttachmentModalComponent, {
        width: '750px',
        maxWidth: '1350px',
        panelClass: 'paddingless-modal-rounded',
        data: { id, type: 'deposit-slips' }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.isRefresh) callbacks.onSuccess?.();
      });
  }

  addComment(id: string, callbacks: IDepositSlipActionCallbacks = {}): void {
    this.dialog
      .open(V4AddCommentCommonModalComponent, {
        width: '750px',
        maxWidth: '1000px',
        panelClass: 'paddingless-modal-rounded',
        data: { id, type: 'deposit-slips', enableDelete: true }
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.refresh) callbacks.onSuccess?.();
      });
  }
}
