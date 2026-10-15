import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { LucideAngularModule } from 'lucide-angular';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { environment } from 'src/environments/environment';
import { V4AddAttachmentModalComponent } from 'src/app/shared/modal/v4-add-attachment-modal/v4-add-attachment-modal.component';
import { V4SendPaymentProofModalComponent } from 'src/app/shared/modal/v4-send-payment-proof-modal/v4-send-payment-proof-modal.component';
import { V4CheckActivityModalComponent } from 'src/app/shared/modal/v4-check-activity-modal/v4-check-activity-modal.component';
import { V4GetSignedReceiptModalComponent } from 'src/app/shared/modal/v4-get-signed-receipt/v4-get-signed-receipt-modal.component';
import { V4SendReceiptModalComponent } from 'src/app/shared/modal/v4-send-receipt-modal/v4-send-receipt-modal.component';
import { V4CheckAddCommentModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-comment-modal/v4-check-add-comment-modal.component';
import { payeesActions } from 'src/app/modules/store/payees/payees.actions';
import { WalletActionViewModalV4Component } from 'src/app/shared/modal/wallet-modal/wallet-action-view-modal-v4/wallet-action-view-modal-v4.component';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { SendPaymentMode } from 'src/app/modules/payments-v4/send-payment/models/send-payment.enums';
import { VirtualAccountConfirmationModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/virtual-account-confirmation-modal-v4/virtual-account-confirmation-modal-v4.component';
import { V4CheckAddAttachmentCommonModalComponent } from 'src/app/modules/check/modal/check-activity-modals/v4-check-add-attachment-common-modal/v4-check-add-attachment-common-modal.component';
import { ICheckActionList } from 'src/app/modules/payments/model/payments';
import {
  V4ActionItems,
  ACTION_LUCIDE_ICONS,
  ACTION_TOOLTIPS
} from './v4-view-actions';
import { V3ViewButtonComponent } from '../v3-view-button/v3-view-button.component';

/** Exact item order within each ⋮ menu group, per design O5. */
const DESIGN_ORDER: Record<string, number> = [
  'Print',
  'Edit',
  'Void',
  'Delete',
  'Clone This Check',
  'Edit Payee',
  'Add Comment',
  'Add Attachment',
  'Payee Summary',
  'Vendor Summary',
  'Audit Activity',
  'Send Payment Proof',
  'Send Mail Payment Proof',
  'Get Signed Receipt'
].reduce((acc, label, i) => ({ ...acc, [label]: i }), {});

@Component({
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    LucideAngularModule,
    NgOptimizedImage,
    WhiteLabelDirective
  ],
  selector: 'app-v4-view-button',
  templateUrl: './v4-view-button.component.html',
  styleUrls: ['./v4-view-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V4ViewButtonComponent extends V3ViewButtonComponent {
  private v4AlertService = inject(V4AlertService);
  private paymentsV4Service = inject(PaymentsV4Service);

  constructor() {
    super();
    this.alertService = this.v4AlertService as unknown as AlertService;
  }

  override checkActionItems =
    environment.env_id === 'csnhc'
      ? V4ActionItems.checkActionsItemsForCSNHC()
      : V4ActionItems.checkActionsItems();

  /**
   * @description Returns the Lucide icon name for a given action label.
   */
  getLucideIcon(label: string): string {
    return ACTION_LUCIDE_ICONS[label] ?? 'circle';
  }

  /**
   * @description Returns the tooltip text for a given action label.
   */
  getActionTooltip(label: string): string {
    const template = ACTION_TOOLTIPS[label] ?? '';
    return template.replace(
      '{{itemType}}',
      this.isTypeCheck ? 'check' : 'payment'
    );
  }

  /**
   * @description Groups the check-row ⋮ items into the design O5 sections
   * (Actions / Documents / Proof). Anything not explicitly a document or proof
   * item falls into Actions.
   */
  checkItemsIn(group: 'ACTIONS' | 'DOCUMENTS' | 'PROOF'): ICheckActionList[] {
    const DOCS = [
      'Payee Summary',
      'Vendor Summary',
      'Audit Activity',
      'Add Comment',
      'Add Attachment'
    ];
    const PROOF = [
      'Send Mail Payment Proof',
      'Send Payment Proof',
      'Get Signed Receipt'
    ];
    const rank = (label: string): number => DESIGN_ORDER[label] ?? 99;
    return this.checkActionItems
      .filter((i) => {
        let g = 'ACTIONS';
        if (DOCS.includes(i.label)) g = 'DOCUMENTS';
        else if (PROOF.includes(i.label)) g = 'PROOF';
        return g === group;
      })
      .sort((a, b) => rank(a.label) - rank(b.label));
  }

  override viewButtonAction(): void {
    if (
      this.commonTransactionTableRowData?.viewButtonType === 2 ||
      this.commonTransactionTableRowData?.viewButtonType === 0
    ) {
      const callback = this.commonTransactionTableRowData?.onViewClick;
      if (typeof callback === 'function') {
        callback(this.commonTransactionTableRowData.data);
      }
      return;
    }
    if (this.commonTransactionTableRowData?.viewButtonType === 1) {
      const id = this.commonTransactionTableRowData?.data?.id;
      this.dialog.open(WalletActionViewModalV4Component, {
        maxWidth: '900px',
        width: '93%',
        panelClass: 'paddingless-modal-rounded',
        data: { id }
      });
      return;
    }
    if (this.commonTransactionTableRowData.tableId === 91) {
      this.router.navigate(['/v4/manage/developer/api-log-details'], {
        queryParams: { id: this.commonTransactionTableRowData.data.id }
      });
      return;
    }
    super.viewButtonAction();
  }

  override onEditButtonClick(): void {
    this.paymentsV4Service.openSendModal({
      mode: SendPaymentMode.Edit,
      paymentId: this.commonTransactionTableRowData.data?.uu_id
    });
  }

  override clonePayment(): void {
    this.paymentsV4Service.openSendModal({
      mode: SendPaymentMode.Clone,
      paymentId: this.commonTransactionTableRowData.data?.uu_id
    });
  }

  override cloneThecheck(): void {
    this.paymentsV4Service.openSendModal({
      mode: SendPaymentMode.Clone,
      paymentId: this.commonTransactionTableRowData.data?.uu_id
    });
  }

  override goToPayeeSummary(): void {
    const payeeId = this.commonTransactionTableRowData.data?.payee_id;
    this.router.navigate([`/v4/manage/transaction-history/${payeeId}/1`]);
  }

  override singleCheckPrint(): void {
    const isVirtualAccount =
      this.commonTransactionTableRowData?.data?.source?.info?.isVirtualAccount;
    if (isVirtualAccount) {
      const notification = this.alertService.infoAlert({
        content: `Since you added your Bank account using instant verification, we received a virtual account number. This works for ACH and wire transfers, but won't work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.`,
        doneMsg: 'Update',
        isCancel: true
      });
      notification.afterClosed().subscribe((res) => {
        if (res) {
          const confirmationDialog = this.dialog.open(
            VirtualAccountConfirmationModalV4Component,
            {
              maxWidth: '1200px',
              width: '100%',
              disableClose: true,
              data: {
                bankAccountIds: [
                  this.commonTransactionTableRowData?.data?.source_id
                ]
              }
            }
          );
          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.processSingleCheckPrint();
            }
          });
        }
      });
    } else if (
      this.commonTransactionTableRowData?.data?.source?.info?.verifiedBy ===
        88 &&
      this.commonTransactionTableRowData?.data?.source?.info?.verified === 0
    ) {
      this.alertService
        .failedAlert({
          content:
            "Your Bank account verification was rejected. You won't be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.",
          doneMsg: 'Update',
          isCancel: true
        })
        .afterClosed()
        .subscribe((res) => {
          if (res) {
            const confirmationDialog = this.dialog.open(
              VirtualAccountConfirmationModalV4Component,
              {
                maxWidth: '1200px',
                width: '100%',
                disableClose: true,
                data: {
                  bankAccountIds: [
                    this.commonTransactionTableRowData?.data?.source_id
                  ]
                }
              }
            );
            confirmationDialog.afterClosed().subscribe((result) => {
              if (result && result.refreshTable) {
                this.v3DataTableService.refreshV3DataTable();
              }
              if (result && result.success) {
                this.processSingleCheckPrint();
              }
            });
          }
        });
    } else {
      this.processSingleCheckPrint();
    }
  }

  override checkAttachmentModal(): void {
    const isCheck =
      this.commonTransactionTableRowData.data.transfer_type_code === 'check';
    const dialogRef = this.dialog.open(
      V4CheckAddAttachmentCommonModalComponent,
      {
        maxWidth: '700px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          id: isCheck
            ? this.commonTransactionTableRowData.data.transfer_id
            : this.commonTransactionTableRowData.data.zilpayment_id,
          mode: isCheck ? undefined : 'zil_payments',
          existingData: this.existingDocumentsData.attachments
        }
      }
    );

    dialogRef.afterClosed().subscribe((res) => {
      if (res.isRefresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
      this.existingDocumentsData.attachments = res?.existingData;
    });
  }

  override sendPaymentProof(mode: 'pp' | 'pod'): void {
    this.dialog.open(V4SendPaymentProofModalComponent, {
      maxWidth: '500px',
      width: '93%',
      data: {
        checkStatus: this.commonTransactionTableRowData?.checkStatus,
        uuId: this.commonTransactionTableRowData.data?.uu_id,
        encryptedId: this.commonTransactionTableRowData.data?.zilpayment_id,
        mode,
        payee: {
          email: this.commonTransactionTableRowData.data?.payee_email,
          phone: this.commonTransactionTableRowData.data?.payee_phone
        },
        amount: this.commonTransactionTableRowData.data.amount
      },
      disableClose: true,
      panelClass: 'paddingless-modal-rounded'
    });
  }

  override activityModal(): void {
    this.dialog.open(V4CheckActivityModalComponent, {
      width: '100%',
      maxWidth: '750px',
      height: '70vh',
      panelClass: 'paddingless-modal-rounded',
      data: this.commonTransactionTableRowData.data?.transfer_id
    });
  }

  override getReceipt(): void {
    if (
      ((this.paymentCompleted || this.isPodCompleted || this.isRtpPayment) &&
        !this.isTypeCheck) ||
      (!this.isSignedReceiptForCheckEnabled && this.isTypeCheck)
    ) {
      this.canSubmitSignedReceiptRequest = false;
    }

    if (this.commonTransactionTableRowData.data?.signature_url === null) {
      this.dialog
        .open(V4GetSignedReceiptModalComponent, {
          maxWidth: '550px',
          width: '93%',
          disableClose: true,
          panelClass: 'paddingless-modal-rounded',
          data: {
            canSubmitSignedReceiptRequest: this.canSubmitSignedReceiptRequest,
            transactionId: this.commonTransactionTableRowData.data?.uu_id,
            zilId: this.commonTransactionTableRowData.data?.zilpayment_id,
            payee: {
              email: this.commonTransactionTableRowData.data?.payee_email,
              phone: this.commonTransactionTableRowData.data?.payee_phone
            },
            previewData: {
              senderName: this.commonTransactionTableRowData.data?.source_name,
              payeeName: this.commonTransactionTableRowData.data?.payee_name,
              amount: this.commonTransactionTableRowData.data?.amount,
              type: this.commonTransactionTableRowData.data?.transfer_type,
              address:
                this.commonTransactionTableRowData.data?.payee_address_line1,
              reference: this.commonTransactionTableRowData.data?.reference_no,
              paymentDate: this.commonTransactionTableRowData.data?.created_at
            }
          }
        })
        .afterClosed()
        .subscribe((res) => {
          if (res && res.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.cdr.detectChanges();
          }
        });
    } else {
      this.dialog.open(V4SendReceiptModalComponent, {
        maxWidth: '500px',
        width: '93%',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: {
          transactionId: this.commonTransactionTableRowData.data?.uu_id,
          payee: {
            email: this.commonTransactionTableRowData.data?.payee_email,
            phone: this.commonTransactionTableRowData.data?.payee_phone
          }
        }
      });
    }
  }

  override editPayee(): void {
    const payeeId = this.commonTransactionTableRowData.data?.payee_id;
    this.subscriptions.push(
      this.payeeModalService
        .openEditPayee(
          payeeId,
          undefined,
          { edit: true, id: payeeId, type: 'string' },
          true
        )
        .subscribe((payeeModal) => {
          if (payeeModal) {
            this.subscriptions.push(
              payeeModal.afterClosed().subscribe((res) => {
                if (res?.success) {
                  this.v3DataTableService.refreshV3DataTable();
                  this.store.dispatch(
                    payeesActions.loadPayees({
                      searchTerm: '',
                      skipEmpty: true,
                      isReload: true
                    })
                  );
                }
              })
            );
          }
        })
    );
  }

  override openAttachmentModal(): void {
    const isCheck =
      this.commonTransactionTableRowData.data.transfer_type_code === 'check';

    if (isCheck) {
      this.checkAttachmentModal();
      return;
    }

    if (this.isFromInternationalPayment()) {
      const dialogRef = this.dialog.open(
        V4CheckAddAttachmentCommonModalComponent,
        {
          maxWidth: '700px',
          width: '93%',
          panelClass: 'paddingless-modal-rounded',
          disableClose: true,
          data: {
            id: this.commonTransactionTableRowData.data.zilpayment_id,
            mode: 'international_payments',
            existingData: this.existingDocumentsData.attachments
          }
        }
      );
      dialogRef.afterClosed().subscribe((res) => {
        if (res?.isRefresh) {
          this.v3DataTableService.refreshV3DataTable();
        }
        this.existingDocumentsData.attachments = res?.existingData;
      });
      return;
    }

    const id = this.commonTransactionTableRowData.data.zilpayment_id;
    const type = 'zil-payments';

    const dialogRef = this.dialog.open(V4AddAttachmentModalComponent, {
      width: '750px',
      panelClass: 'paddingless-modal-rounded',
      data: { id, type }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.isRefresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
      this.existingDocumentsData.attachments = res?.existingData;
    });
  }

  override checkCommentModal() {
    const isCheck =
      this.commonTransactionTableRowData.data.transfer_type_code === 'check';

    let mode: string | undefined;
    if (this.isFromInternationalPayment()) {
      mode = 'international_payments';
    } else if (isCheck) {
      mode = undefined;
    } else {
      mode = 'zil_payments';
    }

    const dialogRef = this.dialog.open(V4CheckAddCommentModalComponent, {
      maxWidth: '700px',
      panelClass: 'paddingless-modal-rounded',
      width: '93%',
      disableClose: true,
      data: {
        id: isCheck
          ? this.commonTransactionTableRowData.data.transfer_id
          : this.commonTransactionTableRowData.data.zilpayment_id,
        type: isCheck ? 'checks' : 'zil-payments',
        mode,
        existingData: this.existingDocumentsData.comments,
        enableDelete: true
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.isRefresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
      this.existingDocumentsData.comments = res.existingData;
    });
  }

  override verifyEmailAndMobile(): void {
    const ref = this.alertService.warningAlert({
      content: this.verificationMessageService.getVerificationMessage(),
      doneMsg: 'Verify Now',
      isCancel: true,
      cancelMsg: 'Cancel'
    });

    ref.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/v4/manage/verification/index'], {
          queryParams: {
            openVerificationModal: true
          }
        });
      }
    });
  }
}
