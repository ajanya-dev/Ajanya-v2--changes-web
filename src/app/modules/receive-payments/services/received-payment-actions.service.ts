import { inject, Injectable } from '@angular/core';
import { Params, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';

import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { RequestPaymentsService } from 'src/app/shared/service/RequestPayments/request-payments.service';
import {
  IDtActionCompProp,
  IDtCellrendererBtn
} from 'src/app/modules/data-table/model/datatable';
import { IRecieveCheckRow } from 'src/app/modules/receive-payments/model/ReceivePayment';
import { AcceptRequestComponent } from 'src/app/modules/receive-payments/modals/accept-request/accept-request.component';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { V4AddProofOfDeliveryModalComponent } from 'src/app/shared/modal/v4-add-proof-of-delivery-modal/v4-add-proof-of-delivery-modal.component';
import { V4ViewAuditTrailModalComponent } from 'src/app/shared/modal/v4-view-audit-trail-modal/v4-view-audit-trail-modal.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

@Injectable({ providedIn: 'root' })
export class ReceivedPaymentActionsService {
  private dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private requestPaymentsService = inject(RequestPaymentsService);
  private alertService = inject(V4AlertService);
  private router = inject(Router);

  private subscriptions: Subscription[] = [];

  /**
   * Lucide names — the only consumer is the v4 row menu, which renders these
   * through `<lucide-icon>`. FontAwesome class strings throw there and take
   * the whole row's cells down with them.
   */
  static getActionItems(): IDtCellrendererBtn {
    return {
      action: [
        { name: 'Accept', id: 'RId_accept', icon: 'check' },
        { name: 'Reject', id: 'RId_reject', icon: 'x' },
        { name: 'Print', id: 'RId_print', icon: 'printer' },
        { name: 'Cancel', id: 'RId_cancel', icon: 'trash-2' },
        {
          name: 'Audit Trail',
          id: 'RId_audittrail',
          icon: 'history'
        },
        {
          name: 'Mark As Printed',
          id: 'RId_markasprinted',
          icon: 'check-check'
        },
        { name: 'Resend', id: 'RId_resend', icon: 'send' },
        {
          name: 'Add Proof of Delivery',
          id: 'RId_pod',
          icon: 'receipt',
          svg: '/assets/images/pod-icon.svg'
        },
        {
          name: 'Add Attachment',
          id: 'RId_attachment',
          icon: 'paperclip'
        },
        { name: 'Add Comment', id: 'RId_comment', icon: 'message-square' }
      ]
    };
  }

  static getActionComponentProp(): IDtActionCompProp {
    return { actionButton: true, eyeButton: false };
  }

  handleAction(
    env: { selectedRow: IRecieveCheckRow; id: string },
    statusMap: Params,
    reloadFn: () => void
  ): void {
    if (!env?.selectedRow) return;

    const hideArr: string[] = [];
    const actionList =
      statusMap[env.selectedRow.received_type]?.[env.selectedRow.status];

    if (actionList) {
      hideArr.push(actionList.isItApproveAble === 0 ? 'RId_accept' : '');
      hideArr.push(actionList.isItRejectAble === 0 ? 'RId_reject' : '');
      hideArr.push(actionList.isItPrintAble === 0 ? 'RId_print' : '');
      hideArr.push(actionList.isItCancellAble === 0 ? 'RId_cancel' : '');
      hideArr.push(actionList.isItAuditable === 0 ? 'RId_audittrail' : '');
      hideArr.push(
        actionList.isItPrintmarkAble === 0 ? 'RId_markasprinted' : ''
      );
      hideArr.push(actionList.isItResendAble === 0 ? 'RId_resend' : '');
    }
    hideArr.push(env.selectedRow.pod_status === 1 ? 'RId_pod' : '');

    this.dataTableService.setActionButtonDisable(true, hideArr);

    switch (env.id) {
      case 'RId_accept': {
        const response = this.confirmMessage(
          'Are you sure you want to accept?'
        );
        response.afterClosed().subscribe((res) => {
          if (res) {
            this.acceptAction(env.selectedRow.uu_id, reloadFn);
          }
        });
        break;
      }
      case 'RId_reject': {
        const response = this.confirmMessage(
          'Are you sure you want to reject?'
        );
        response.afterClosed().subscribe((res) => {
          if (res) {
            this.rejectAction(env.selectedRow.uu_id, reloadFn);
          }
        });
        break;
      }
      case 'RId_print':
        this.printAction(env.selectedRow.uu_id, reloadFn);
        break;

      case 'RId_cancel': {
        const response = this.confirmMessage(
          'Are you sure you want to cancel?'
        );
        response.afterClosed().subscribe((res) => {
          if (res) {
            this.cancelAction(env.selectedRow.uu_id, reloadFn);
          }
        });
        break;
      }
      case 'RId_markasprinted': {
        const response = this.confirmMessage(
          "If you mark this check as printed, you won't be able to print it again"
        );
        response.afterClosed().subscribe((res) => {
          if (res) {
            this.markAsPrintedAction(env.selectedRow.uu_id, 1, reloadFn);
          }
        });
        break;
      }
      case 'RId_audittrail':
        this.auditTrail(env.selectedRow.encrypted_id);
        break;

      case 'RId_resend':
        this.resendAction(
          env.selectedRow.uu_id,
          env.selectedRow.encrypted_bankaccount_id,
          reloadFn
        );
        break;

      case 'RId_attachment':
        this.openAddAttachmentModal(env.selectedRow.encrypted_id, reloadFn);
        break;

      case 'RId_comment':
        this.openAddCommentModal(env.selectedRow.encrypted_id, reloadFn);
        break;

      case 'RId_pod':
        this.openAddPodModal(
          env.selectedRow.uu_id,
          env.selectedRow.encrypted_id,
          reloadFn
        );
        break;

      default:
        break;
    }
  }

  // --- Action methods ---

  private acceptAction(id: string, reloadFn: () => void): void {
    this.subscriptions.push(
      this.requestPaymentsService.acceptRequest(id).subscribe((res) => {
        if (res.success) {
          reloadFn();
          const data = { uuids: [id], printType: 1 };
          const response = this.acceptSuccess();
          response.afterClosed().subscribe((modalRes) => {
            switch (modalRes) {
              case 'id_print':
                this.printSelectedData(data, reloadFn);
                break;
              case 'id_dd':
                this.ddfromAccept([id], reloadFn);
                break;
              case 'id_later':
              default:
                reloadFn();
                break;
            }
          });
        }
      })
    );
  }

  private acceptSuccess() {
    return this.dialog.open(AcceptRequestComponent, {
      minWidth: '370px',
      disableClose: true
    });
  }

  private ddfromAccept(uuid: string[], reloadFn: () => void): void {
    const data = { ids: uuid };
    this.subscriptions.push(
      this.requestPaymentsService.directDeposit(data).subscribe({
        next: (res) => {
          if (res.success) {
            reloadFn();
            this.alertService.successAlert({
              title: 'Success',
              content: 'Direct Deposit has been initiated.',
              close: true,
              timeout: 3000
            });
          }
        },
        error: (err) => {
          if (err.error.errorCode === 101) {
            const alert = this.alertService.warningAlert({
              content: err.error.errorMsg,
              doneMsg: 'Add Info Now',
              isCancel: true,
              cancelMsg: 'cancel'
            });
            alert.afterClosed().subscribe((r) => {
              if (r) {
                this.achVerificationRequiredAlert();
              }
            });
          }
          if (err.error.errorCode === 423) {
            const alert = this.alertService.warningAlert({
              content: err.error.errorMsg,
              doneMsg: 'See My Banks',
              isCancel: true,
              cancelMsg: 'Cancel'
            });
            alert.afterClosed().subscribe((r) => {
              if (r) {
                this.router.navigate(['/v4/manage/bank-accounts/index']);
              }
            });
          }
        }
      })
    );
  }

  private achVerificationRequiredAlert(): void {
    const alert = this.alertService.warningAlert({
      content:
        'Some of your bank accounts are not approved for ACH, please apply to proceed.',
      doneMsg: 'See My Banks',
      cancelMsg: 'Cancel',
      isCancel: true
    });
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/v4/manage/bank-accounts/index']);
      }
    });
  }

  private rejectAction(id: string, reloadFn: () => void): void {
    this.subscriptions.push(
      this.requestPaymentsService.rejectRequest(id).subscribe((res) => {
        if (res.success) {
          reloadFn();
          this.alertService.successAlert({
            title: 'Success',
            content: 'Request rejected',
            close: true,
            timeout: 3000
          });
        }
      })
    );
  }

  private printAction(id: string, reloadFn: () => void): void {
    this.subscriptions.push(
      this.requestPaymentsService.printRequest(id).subscribe(
        (printRes) => {
          const urlLoaded = window.open(printRes.data);
          if (
            !urlLoaded ||
            urlLoaded.closed ||
            typeof urlLoaded.closed === 'undefined'
          ) {
            const popupBlockerMsg = this.alertService.warningAlert({
              content:
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window',
              doneMsg: 'Try Again'
            });
            popupBlockerMsg.afterClosed().subscribe((popupBlockerRes) => {
              if (popupBlockerRes) {
                window.open(printRes.data);
                const markAsPrinted = this.markAsPrint();
                markAsPrinted.afterClosed().subscribe((markAsPrintedRes) => {
                  if (markAsPrintedRes) {
                    this.markAsPrintedAction(id, 2, reloadFn);
                  }
                });
              }
            });
            return;
          }
          const markAsPrinted = this.markAsPrint();
          markAsPrinted.afterClosed().subscribe((markAsPrintedRes) => {
            if (markAsPrintedRes) {
              this.markAsPrintedAction(id, 2, reloadFn);
            }
          });
        },
        (err) => {
          if (err.error.errorCode === 106) {
            const dref = this.openWarningAlert(err.error.errorMsg);
            dref.afterClosed().subscribe((res) => {
              if (res) {
                this.router.navigate(['/v4/verification/index']);
              }
            });
          }
        }
      )
    );
  }

  private cancelAction(id: string, reloadFn: () => void): void {
    this.subscriptions.push(
      this.requestPaymentsService.cancelRequest(id).subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Request cancelled',
            close: true,
            timeout: 3000
          });
          reloadFn();
        }
      })
    );
  }

  private markAsPrintedAction(
    id: string,
    mode: number,
    reloadFn: () => void
  ): void {
    this.subscriptions.push(
      this.requestPaymentsService.markAsPrintRequest(id).subscribe((res) => {
        if (res.success) {
          if (mode === 1) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Request marked as printed',
              close: true,
              timeout: 3000
            });
          }
          reloadFn();
        }
      })
    );
  }

  private auditTrail(encryptedId: string): void {
    this.dialog.open(V4ViewAuditTrailModalComponent, {
      maxWidth: '1000px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        heading: 'Receive Payment',
        slug: 'request-payments',
        id: encryptedId
      }
    });
  }

  private resendAction(id: string, bankId: string, reloadFn: () => void): void {
    const alert = {
      title: 'Link not found !',
      content: 'Please add a payment link to the bank account',
      doneMsg: 'Generate a link',
      cancelMsg: 'No, cancel'
    };
    this.subscriptions.push(
      this.requestPaymentsService.resendRequest(id).subscribe((res) => {
        if (res.success) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Request resent',
            close: true,
            timeout: 3000
          });
          reloadFn();
        }
        if (res.errorCode) {
          const response = this.alertService.confirmAlert(alert);
          response.afterClosed().subscribe((result) => {
            if (result) {
              this.router.navigate(['/v4/manage/payment-links/create', bankId], {
                queryParams: { redirectUrl: '/v4/manage/receivedchecks' }
              });
            }
          });
        }
      })
    );
  }

  private openAddAttachmentModal(id: string, reloadFn: () => void): void {
    const dialogRef = this.dialog.open(V4AddAttachmentModalComponent, {
      width: '750px',
      panelClass: 'paddingless-modal-rounded',
      data: { id, type: 'request-payments' }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res?.isRefresh) {
        reloadFn();
      }
    });
  }

  private openAddCommentModal(id: string, reloadFn: () => void): void {
    const dialogRef = this.dialog.open(V4CheckAddCommentModalComponent, {
      width: '750px',
      maxHeight: '90vh',
      panelClass: 'paddingless-modal-rounded',
      data: { id, type: 'request-payments', enableDelete: true }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res?.refresh) {
        reloadFn();
      }
    });
  }

  private openAddPodModal(
    id: string,
    encryptedId: string,
    reloadFn: () => void
  ): void {
    const dialogRef = this.dialog.open(V4AddProofOfDeliveryModalComponent, {
      width: '550px',
      maxHeight: '93%',
      panelClass: 'paddingless-modal-rounded',
      data: { uuId: id, encryptedId }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        reloadFn();
      }
    });
  }

  // --- Helpers ---

  private confirmMessage(content: string) {
    return this.alertService.confirmAlert({
      title: 'Alert!',
      content,
      doneMsg: 'Yes',
      cancelMsg: 'No,cancel!'
    });
  }

  private markAsPrint() {
    return this.alertService.confirmAlert({
      title: 'Did you print it correctly?',
      doneMsg: 'Yes',
      cancelMsg: 'No'
    });
  }

  private openWarningAlert(content: string) {
    return this.alertService.warningAlert({
      title: 'Error',
      content,
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });
  }

  private printSelectedData(
    data: { uuids: string[]; printType?: number },
    reloadFn: () => void
  ): void {
    this.subscriptions.push(
      this.requestPaymentsService.printRequest(data.uuids[0]).subscribe(
        (printRes) => {
          const urlLoaded = window.open(printRes.data);
          if (
            !urlLoaded ||
            urlLoaded.closed ||
            typeof urlLoaded.closed === 'undefined'
          ) {
            const popupBlockerMsg = this.alertService.warningAlert({
              content:
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window',
              doneMsg: 'Try Again'
            });
            popupBlockerMsg.afterClosed().subscribe((popupBlockerRes) => {
              if (popupBlockerRes) {
                window.open(printRes.data);
                const markAsPrinted = this.markAsPrint();
                markAsPrinted.afterClosed().subscribe((markAsPrintedRes) => {
                  if (markAsPrintedRes) {
                    this.markAsPrintedAction(data.uuids[0], 2, reloadFn);
                  }
                });
              }
            });
            return;
          }
          const markAsPrinted = this.markAsPrint();
          markAsPrinted.afterClosed().subscribe((markAsPrintedRes) => {
            if (markAsPrintedRes) {
              this.markAsPrintedAction(data.uuids[0], 2, reloadFn);
            }
          });
        },
        (err) => {
          if (err.error.errorCode === 106) {
            const dref = this.openWarningAlert(err.error.errorMsg);
            dref.afterClosed().subscribe((res) => {
              if (res) {
                this.router.navigate(['/v4/verification/index']);
              }
            });
          }
        }
      )
    );
  }
}
