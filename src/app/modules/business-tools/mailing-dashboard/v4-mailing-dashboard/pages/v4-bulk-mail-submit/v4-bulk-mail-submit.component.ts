import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatBadge } from '@angular/material/badge';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { finalize, forkJoin, take } from 'rxjs';

import {
  ICheckShipingTypes,
  IChequedata,
  IMailBulkShippingAddress,
  IMailShippingCalculations,
  IMailShippingPayeeDetails,
  IMailSingleShippingAddress,
  IShippingCostCalculation
} from 'src/app/modules/check/model/check';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { VirtualAccountConfirmationModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/virtual-account-confirmation-modal-v4/virtual-account-confirmation-modal-v4.component';
import { V4CheckAddAttachmentModalComponent } from 'src/app/modules/check/modal/v4-check-add-attachment-modal/v4-check-add-attachment-modal.component';

import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

interface IBulkMailData {
  isEnvelopeChecked: boolean;
  shippingForm: IBulkMailShippingForm;
  checkIds: string[];
}

interface IBulkMailShippingForm {
  groupName: string;
  shippingAddressFrom: IMailBulkShippingAddress & {
    address: IMailSingleShippingAddress;
  };
  shippingAddressTo: IMailBulkShippingAddress & {
    address: IMailSingleShippingAddress;
  };
  shippingType: ICheckShipingTypes;
}

@Component({
  selector: 'app-v4-bulk-mail-submit',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatBadge,
    MatTooltip,
    CommonButtonV4Component
  ],
  templateUrl: './v4-bulk-mail-submit.component.html',
  styleUrl: './v4-bulk-mail-submit.component.scss'
})
export class V4BulkMailSubmitComponent implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private datePipe = inject(DatePipe);
  private v4AlertService = inject(V4AlertService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private commonOnInitService = inject(CommonOnInitService);
  private headerService = inject(HeaderService);
  private destroyRef = inject(DestroyRef);

  bulkMailData = signal<IBulkMailData | null>(null);
  checkDetailsResponse = signal<IChequedata | undefined>(undefined);
  isLoading = signal(false);
  isSendingMail = signal(false);
  shippingCalculation = signal<IShippingCostCalculation | undefined>(undefined);
  attachments: { [key: string]: string[] } = {};
  costCalculation: IMailShippingCalculations;
  isLoadingCostCalculation = signal(false);
  checkIds = signal<string[]>([]);
  isQbAutoSubAccountMapping = signal(false);

  checkCount = computed(
    () => this.checkDetailsResponse()?.datas?.length ?? 0
  );

  ngOnInit(): void {
    const data = JSON.parse(
      sessionStorage.getItem('bulkMailData') || 'null'
    ) as IBulkMailData | null;
    this.bulkMailData.set(data);

    this.getHeaderData();
    if (data?.checkIds) {
      this.checkIds.set(data.checkIds);
      this.checkDetails(data.checkIds);
      this.getAddressesSimultaneously(
        data.shippingForm.shippingAddressFrom.id.toString(),
        data.shippingForm.shippingAddressTo.id.toString()
      );
    }
  }

  getHeaderData(): void {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res && res.enabledPlugins.includes('qb-auto-sub-account-mapping')) {
          this.isQbAutoSubAccountMapping.set(true);
        }
      });
  }

  checkDetails(checkIds: string[]): void {
    const payload = {
      ids: checkIds,
      is_signature: 1 as const,
      auto_add_attachments: 1 as const
    };
    this.isLoading.set(true);
    this.checkService
      .groupMailChequeDetails(payload)
      .pipe(
        take(1),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((res) => {
        if (res.success) {
          this.checkDetailsResponse.set(res.data);
          this.initializeAttachments();
          this.getShippingCostCalculation();
        }
      });
  }

  getAddressesSimultaneously(fromId: string, toId: string): void {
    if (
      this.bulkMailData()?.shippingForm.shippingAddressFrom.address &&
      this.bulkMailData()?.shippingForm.shippingAddressTo.address
    ) {
      return;
    }
    const fromAddress$ = this.checkService
      .getFromSingleId(fromId)
      .pipe(take(1));
    const toAddress$ = this.checkService.getToSingleId(toId).pipe(take(1));

    forkJoin({ fromAddress: fromAddress$, toAddress: toAddress$ }).subscribe({
      next: (responses) => {
        if (responses.fromAddress.success && responses.toAddress.success) {
          this.bulkMailData.update((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              shippingForm: {
                ...prev.shippingForm,
                shippingAddressFrom: {
                  ...prev.shippingForm.shippingAddressFrom,
                  address: responses.fromAddress.data
                },
                shippingAddressTo: {
                  ...prev.shippingForm.shippingAddressTo,
                  address: responses.toAddress
                    .data as IMailSingleShippingAddress
                }
              }
            };
          });
          sessionStorage.setItem(
            'bulkMailData',
            JSON.stringify(this.bulkMailData())
          );
        }
      },
      error: () => {
        this.v4AlertService.failedAlert({
          content: 'Failed to load address details. Please try again.'
        });
      }
    });
  }

  getShippingCostCalculation(): void {
    const mailShippingCalculationsdata: IMailShippingCalculations = {
      mail_check_ids: [],
      all_check_ids: [],
      shipping_rate_warning: 0,
      sent_to_customer_address: 1,
      Single_mail_options: 3,
      individual_envelope: this.bulkMailData()?.isEnvelopeChecked ? 1 : 0,
      shipping_from:
        this.bulkMailData()?.shippingForm?.shippingAddressFrom?.dec_id ?? '',
      shipping_to:
        this.bulkMailData()?.shippingForm?.shippingAddressTo?.dec_id ?? '',
      custom_address_shipping_type:
        this.bulkMailData()?.shippingForm?.shippingType?.id ?? 0
    };
    this.checkDetailsResponse()?.datas?.forEach((item) => {
      const mailShippingPayeeDetails: IMailShippingPayeeDetails = {
        mail_type: 1,
        check_paper: 7,
        informed_payee_sms: 0,
        informed_payee_email: 0,
        payee_phone: '',
        payee_email: '',
        file_hidden: []
      };
      const ids2 = item.enc_id;
      mailShippingCalculationsdata.mail_check_ids.push(item.enc_id);
      mailShippingPayeeDetails.payee_email = item.payee_email;
      mailShippingPayeeDetails.payee_phone = item.payee_phone;
      mailShippingCalculationsdata[ids2] = mailShippingPayeeDetails;
    });
    this.costCalculation = mailShippingCalculationsdata;
    this.checkService
      .groupMailShippingCostCalculation(mailShippingCalculationsdata)
      .pipe(
        take(1),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe((res) => {
        if (res.success) {
          this.shippingCalculation.set(res.data);
          this.setEachCheckCost(res.data?.single_items);
        }
      });
  }

  setEachCheckCost(single_items: { [key: string]: number | string }): void {
    this.checkDetailsResponse()?.datas?.forEach((item) => {
      // eslint-disable-next-line no-param-reassign
      item.cost = single_items[item.enc_id] as number;
    });
  }

  createChecks(): void {
    const payload = { ids: this.checkIds() };
    this.isSendingMail.set(true);
    this.checkService
      .groupMailCheckCreate(payload)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (res.success && res.checkIds && res.checkIds.length > 0) {
            this.sendMail(res.checkIds);
          }
        },
        error: () => {
          this.isSendingMail.set(false);
        }
      });
  }

  sendMail(checkIds?: string[]): void {
    if (checkIds && checkIds.length > 0) {
      const oldCheckIds = [...this.costCalculation.mail_check_ids];
      this.costCalculation.mail_check_ids = checkIds;
      oldCheckIds.forEach((oldId, index) => {
        const newId = checkIds[index];
        if (newId && this.costCalculation[oldId]) {
          this.costCalculation[newId] = this.costCalculation[oldId];
          delete this.costCalculation[oldId];
        }
      });
    }

    const currentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    const payload = {
      schedule_date: currentDate,
      recurring_include_check: true,
      frequency: 1,
      start_date: currentDate,
      end_select: 1,
      count: 1,
      until: '',
      auto_add_attachments: 1
    };

    const mailData = this.addBankAccountIdToMailData({
      ...this.costCalculation,
      ...payload
    });
    this.isSendingMail.set(true);
    this.checkService
      .sendmail(mailData, '')
      .pipe(
        finalize(() => this.isSendingMail.set(false)),
        take(1)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.v4AlertService.successAlert({
              title: 'Success',
              content: 'Mail has been sent successfully'
            });
            this.router.navigate(
              ['/v4/manage/business-tools/mail-dashboard/group-mailing'],
              { queryParams: { from: 'bulk-mail' } }
            );
          }
        },
        error: (err) => {
          if (err.error.errorCode === 731) {
            this.handleError731(err);
          }
          if (err.error.errorCode === 'plaid_virtual_account') {
            const notification = this.v4AlertService.infoAlert({
              content: err.error.errorMsg,
              doneMsg: 'Update',
              isCancel: true
            });
            notification.afterClosed().subscribe((res2) => {
              if (res2) {
                const confirmationDialog = this.dialog.open(
                  VirtualAccountConfirmationModalV4Component,
                  {
                    maxWidth: '1200px',
                    width: '100%',
                    disableClose: true,
                    panelClass: 'paddingless-modal-rounded',
                    data: err.error
                  }
                );
                confirmationDialog.afterClosed().subscribe((resp) => {
                  if (resp.success) this.sendMail();
                });
              }
            });
          }
          if (err.error.errorCode === 1) this.sendMail();
          if (err.error.errorCode === 516) {
            this.commonOnInitService.contactAlert(
              'Please contact our customer support to enable international mail.'
            );
          }
          if (err.error.errorCode === 215) {
            this.v4AlertService.warningAlert({
              content: err.error.errorMsg,
              doneMsg: 'OK'
            });
          }
        }
      });
  }

  private handleError731(error: HttpErrorResponse): void {
    this.v4AlertService
      .warningAlert({
        title: 'No Bank Account Found',
        content: error.error.errorMsg,
        doneMsg: 'Add Bank Account',
        cancelMsg: 'Cancel',
        isCancel: true
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.router.navigate(['/v4/manage/users/add-bank-account']);
        }
      });
  }

  onBack(): void {
    this.router.navigate(['/v4/manage/business-tools/mail-dashboard/index']);
  }

  goToHistory(): void {
    this.router.navigate(
      ['/v4/manage/business-tools/mail-dashboard/group-mailing'],
      { queryParams: { from: 'bulk-mail' } }
    );
  }

  initializeAttachments(): void {
    this.checkDetailsResponse()?.datas?.forEach((item) => {
      if (item.attachments && item.attachments.length > 0) {
        this.attachments[item.enc_id] = item.attachments;
      }
    });
  }

  getAttachmentCount(encId: string): number {
    return this.attachments[encId]?.length || 0;
  }

  getTotalChequeAmount(): number {
    return (
      this.checkDetailsResponse()?.datas?.reduce(
        (sum, item) => sum + (parseFloat(item?.cheque_amount ?? '0') || 0),
        0
      ) || 0
    );
  }

  openAttachmentModal(checkId: string): void {
    const attachmentModal = this.dialog.open(V4CheckAddAttachmentModalComponent, {
      disableClose: true,
      maxWidth: '1010px',
      width: '630px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        checkId,
        acceptFormats: '.pdf',
        attachId: this.attachments[checkId],
        type: 'group_payments',
        cost: this.shippingCalculation()?.page_cost
      }
    });
    attachmentModal.afterClosed().subscribe((data) => {
      if (data) {
        this.attachments[data.checkId] = data.ids;
        this.attachments.fileName = data.fileName;
        this.updateCostCalculationForCheck(data.checkId, data.ids);
        this.recalculateShippingCosts();
      }
    });
  }

  updateCostCalculationForCheck(checkId: string, _attachmentIds: string[]): void {
    if (this.costCalculation && this.costCalculation[checkId]) {
      this.costCalculation[checkId].file_hidden = [];
    }
  }

  recalculateShippingCosts(): void {
    if (!this.costCalculation) return;
    this.isLoadingCostCalculation.set(true);
    this.checkService
      .groupMailShippingCostCalculation(this.costCalculation)
      .pipe(
        take(1),
        finalize(() => this.isLoadingCostCalculation.set(false))
      )
      .subscribe((res) => {
        if (res.success) {
          this.shippingCalculation.set(res.data);
          this.setEachCheckCost(res.data?.single_items);
        }
      });
  }

  addBankAccountIdToMailData(
    maildata: Record<string, any>
  ): Record<string, any> {
    if (!this.isQbAutoSubAccountMapping()) return maildata;
    const mailCheckIds = maildata['mail_check_ids'] || [];
    const checkDataList = this.checkDetailsResponse()?.datas || [];
    mailCheckIds.forEach((checkId: string, index: number) => {
      const checkData = maildata[checkId];
      if (
        checkData &&
        (!checkData.file_hidden || checkData.file_hidden.length === 0)
      ) {
        const checkItem = checkDataList[index];
        if (checkItem?.enc_bank_account_id) {
          checkData.bank_account_id = checkItem.enc_bank_account_id;
        }
      }
    });
    return maildata;
  }

  ngOnDestroy(): void {
    sessionStorage.removeItem('bulkMailData');
  }
}
