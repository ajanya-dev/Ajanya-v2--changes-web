import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { EMPTY, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LucideAngularModule, Send } from 'lucide-angular';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { IApiRes } from 'src/app/models/api';
import { VirtualAccountConfirmationModalV4Component } from 'src/app/modules/payments-v4/send-payment/components/modals/virtual-account-confirmation-modal-v4/virtual-account-confirmation-modal-v4.component';
import { EmailPhoneVerifyModalV4Component } from '../../mail-modals/email-phone-verify-modal-v4/email-phone-verify-modal-v4.component';
import {
  IProcessCheck,
  ICheckListTableRowData,
  ICheckStatus,
  IProcessableData,
  IPrintableCheck,
  IShippingCostCalculation,
  ICheckShipingTypes,
  IShipingCheckPaperType,
  IChequedata,
  IMailCheck
} from '../../../model/check';

interface IModalData {
  data: IProcessCheck;
  rowData: ICheckListTableRowData[];
  status: ICheckStatus;
  isDisableNavigation: unknown;
}

interface ICalculationData {
  mail_check_ids: string[];
  all_check_ids: string[];
  shipping_rate_warning: number;
  sent_to_customer_address: number;
  Single_mail_options: number;
  [key: string]: unknown;
}

interface ICheckData {
  chequedata: IChequedata;
  errorMsg: string;
  shipping: ICheckShipingTypes[];
  paper: IShipingCheckPaperType[];
}

@Component({
  selector: 'app-check-process-loading-modal-v4',
  templateUrl: './check-process-loading-modal-v4.component.html',
  styleUrls: ['./check-process-loading-modal-v4.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule]
})
export class CheckProcessLoadingModalV4Component implements OnInit {
  readonly SendIcon = Send;

  private dialogRef = inject(MatDialogRef<CheckProcessLoadingModalV4Component>);
  private dialog = inject(MatDialog);
  private checkService = inject(CheckService);
  private alertService = inject(V4AlertService);
  private dataTableService = inject(DataTableService);
  private destroyRef = inject(DestroyRef);
  public data: IModalData = inject(MAT_DIALOG_DATA);

  processingMessage = signal('Processing...');

  checkdata: ICheckData = {} as ICheckData;
  checkDetails: IMailCheck[];
  errorCode: number;
  err_msg: string;
  ShippingCostRes: IShippingCostCalculation;
  bankAccountId: string;
  checkNo: string;
  processdata: IProcessableData;

  idlist = {
    mail_type: 1,
    check_paper: 7,
    informed_payee_sms: 0,
    informed_payee_email: 0,
    payee_phone: '',
    payee_email: '',
    file_hidden: []
  };

  caldata: ICalculationData = {
    mail_check_ids: [],
    all_check_ids: [],
    shipping_rate_warning: 0,
    sent_to_customer_address: 0,
    Single_mail_options: 3
  };

  ngOnInit(): void {
    this.processdata = this.data.data.processable_data;
    this.shippingType();
    this.paperType();
    this.setProcessingMessage();
    setTimeout(() => {
      this.processCheck();
    }, 1000);
  }

  private setProcessingMessage(): void {
    const pd = this.data.data.processable_data;
    if (pd.emailChequeIds?.length > 0) {
      this.processingMessage.set('Processing email check...');
    } else if (pd.mailChequeIds?.length > 0) {
      this.processingMessage.set('Processing mail check...');
    } else if (pd.ddChequeIds?.length > 0) {
      this.processingMessage.set('Processing direct deposit check...');
    } else if (pd.printableChecks?.length > 0) {
      this.processingMessage.set('Processing print check...');
    }
  }

  processCheck(): void {
    const pd = this.data.data.processable_data;

    /** Email Process */
    if (pd.emailChequeIds?.length > 0) {
      const EmailData: ICheckListTableRowData[] = [];
      this.data.rowData.forEach((ele: ICheckListTableRowData) => {
        pd.emailChequeIds.forEach((el: IPrintableCheck) => {
          if (
            (el.checkId !== null || el.checkId !== undefined) &&
            el.checkId === ele.action
          ) {
            EmailData.push(ele);
          }
        });
      });
      this.dialogRef.close({
        type: 'email',
        data: {
          data: EmailData,
          processData: this.data.data,
          status: this.data.status,
          rowData: this.data.rowData,
          isDisableNavigation: this.data.isDisableNavigation
        }
      });
    } else if (pd.mailChequeIds?.length > 0) {
      /** Mail Process */
      const ids: { ids: string[] } = { ids: [] };
      this.data.rowData?.forEach((el: ICheckListTableRowData) => {
        pd.mailChequeIds?.forEach((ele: IPrintableCheck) => {
          if (el.action === ele.checkId) {
            ids.ids.push(el.action);
          }
        });
      });

      this.checkService
        .getChequeDetails(ids)
        .pipe(
          catchError((error) => {
            this.errorCode = error.error.errorCode;
            this.err_msg = error.error.errorMsg;
            return of(false);
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          const response = res as IApiRes<IChequedata>;
          if (response.success) {
            this.checkdata.chequedata = response.data;
            this.checkDetails = response.data.datas;
            if (this.checkdata.chequedata) {
              this.shippingCalculation();
            }
          }

          if (this.errorCode === 2) {
            this.checkdata.errorMsg = this.err_msg;
            this.data.rowData.forEach((el) => {
              this.checkNo = el.cheque_serial_number;
              if (this.checkNo === this.checkdata.errorMsg) {
                this.bankAccountId = el.bank_accounts_id;
              } else {
                const checkNumbers = this.checkdata.errorMsg.split(',');
                checkNumbers.forEach((e: string) => {
                  if (this.checkNo === e) {
                    this.bankAccountId = el.bank_accounts_id;
                  }
                });
              }
            });
            this.dialogRef.close({
              type: 'signature',
              data: {
                ids,
                data: this.checkdata,
                type: 'Checkprocess',
                rowData: this.data.rowData,
                processData: this.data.data,
                isDisableNavigation: this.data.isDisableNavigation,
                bankAccountId: this.bankAccountId
              }
            });
          }

          if (!res && this.errorCode === 106) {
            this.dialog.open(EmailPhoneVerifyModalV4Component, {
              maxWidth: '700px',
              width: '21%',
              minHeight: '200px',
              data: { ids, data: this.err_msg }
            });
            this.dialogRef.close();
          }
        });
    } else if (pd.ddChequeIds?.length > 0) {
      /** Direct Deposit Process */
      const DDdata: ICheckListTableRowData[] = [];
      this.data.rowData?.forEach((ele: ICheckListTableRowData) => {
        pd.ddChequeIds?.forEach((el: IPrintableCheck) => {
          if (el.checkId === ele.action) {
            DDdata.push(ele);
          }
        });
      });
      this.dialogRef.close({
        type: 'dd',
        data: {
          data: DDdata,
          type: 'Checkprocess',
          rowData: this.data.rowData,
          processData: this.data.data
        }
      });
    } else if (pd.printableChecks?.length > 0) {
      /** Print Process */
      const itemIds: { checkId: string[]; paperType: number | string } = {
        checkId: [],
        paperType: 5
      };
      this.data.rowData?.forEach((val: ICheckListTableRowData) => {
        pd.printableChecks?.forEach((ele: IPrintableCheck) => {
          if (val.action === ele.checkId) {
            itemIds.checkId.push(val.action);
          }
        });
      });

      this.checkService
        .printMultiCheck(itemIds)
        .pipe(
          catchError((error) => {
            if (error.error.errorCode === 'plaid_virtual_account') {
              const notification = this.alertService.infoAlert({
                content: error.error.errorMsg,
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
                      data: error.error
                    }
                  );
                  confirmationDialog.afterClosed().subscribe((confirmRes) => {
                    if (confirmRes.success) {
                      this.processCheck();
                    }
                  });
                }
              });
            }
            return EMPTY;
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.data.url) {
            this.dialogRef.close({
              type: 'print',
              data: { data: res.data.url, processData: this.data.data }
            });
          }
        });
    } else if (
      pd.printableChecks?.length === 0 ||
      pd.ddChequeIds?.length === 0 ||
      pd.mailChequeIds?.length === 0 ||
      pd.emailChequeIds?.length === 0
    ) {
      this.alertService.successAlert({
        content: 'Check Processing Completed',
        timeout: 2000
      });
      this.dialogRef.close();
      this.dataTableService.setRefreshStatus(true);
    }
  }

  private shippingType(): void {
    this.checkService
      .getShippingType()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.checkdata.shipping = res.data;
      });
  }

  private paperType(): void {
    this.checkService
      .getpaperType()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.checkdata.paper = res.data;
      });
  }

  private shippingCalculation(): void {
    for (let i = 0; i < this.checkDetails.length; i += 1) {
      const ids2 = this.checkDetails[i].enc_id;
      this.caldata.mail_check_ids.push(this.checkDetails[i].enc_id);
      this.idlist.payee_email = this.checkDetails[i].payee_email as string;
      this.idlist.payee_phone = this.checkDetails[i].payee_phone as string;
      this.caldata[ids2] = this.idlist;
    }

    this.checkService
      .ShippingCostCalculationGroup(this.caldata)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.ShippingCostRes = res.data;
        if (res.success) {
          this.openMailModal();
        }
      });
  }

  private openMailModal(): void {
    if (this.checkdata.chequedata) {
      this.dialogRef.close({
        type: 'mail',
        data: {
          data: this.checkdata,
          ShippingCost: this.ShippingCostRes,
          caldata: this.caldata,
          rowData: this.data.rowData,
          processData: this.data.data,
          isDisableNavigation: this.data.isDisableNavigation
        }
      });
    }
  }
}
