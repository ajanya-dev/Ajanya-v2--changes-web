import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { EMPTY, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { NgIf } from '@angular/common';
import { IApiRes } from 'src/app/models/api';
import { EmailPhoneVerifyModalComponent } from '../../mail-modals/email-phone-verify-modal/email-phone-verify-modal.component';
import { IProcessCheck, ICheckListTableRowData, ICheckStatus, IProcessableData, IPrintableCheck, IShippingCostCalculation, ICheckShipingTypes, IShipingCheckPaperType, IChequedata, IMailCheck } from '../../../model/check';
import { VirtualAccountConfirmationModalComponent } from 'src/app/modules/bank/bank-v2/modals/virtual-account-confirmation-modal/virtual-account-confirmation-modal.component';

interface IModalData{
  data:IProcessCheck,
  rowData: ICheckListTableRowData[],
  status:ICheckStatus,
  isDisableNavigation:unknown
}

interface ICalculationData{
  mail_check_ids: string[],
  all_check_ids: string[],
  shipping_rate_warning: number,
  sent_to_customer_address: number,
  Single_mail_options: number,
  [key: string]: unknown;
}

interface ICheckData { 
  chequedata: IChequedata; 
  errorMsg: string; 
  shipping: ICheckShipingTypes[]; 
  paper: IShipingCheckPaperType[]; 
}

@Component({
  selector: 'app-check-process-loading-modal',
  templateUrl: './check-process-loading-modal.component.html',
  styleUrls: ['./check-process-loading-modal.component.scss'],
  standalone: true,
  imports: [NgIf]
})
export class CheckProcessLoadingModalComponent implements OnInit, OnDestroy {

  private dialogRef = inject(MatDialogRef<CheckProcessLoadingModalComponent>);
  private dialog = inject(MatDialog);
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private dataTableService = inject(DataTableService);
  public data: IModalData = inject(MAT_DIALOG_DATA);

  checkdata: ICheckData = {} as ICheckData;
  checkDetails: IMailCheck[];
  subscriptions: Subscription[] = [];
  errorCode: number;
  err_msg: string;
  ShippingCostRes: IShippingCostCalculation;

  email: boolean;
  mail: boolean;
  dd: boolean;
  print: boolean;
  complete = false;

  success = false;
  loading: boolean;
  title = 'success';
  content = 'Check Processing Completed';
  close = false;
  timeout = 2000;
  bankAccountId: string;
  checkNo: string;

  idlist = {
    mail_type: 1,
    check_paper: 7,
    informed_payee_sms: 0,
    informed_payee_email: 0,
    payee_phone: '',
    payee_email: '',
    file_hidden: []
  };

  caldata:ICalculationData = {
    mail_check_ids: [],
    all_check_ids: [],
    shipping_rate_warning: 0,
    sent_to_customer_address: 0,
    Single_mail_options: 3
  };

  processdata: IProcessableData;

  ngOnInit(): void {
    this.processdata = this.data.data.processable_data;

    this.shippingTYpe();
    this.paperType();
    this.processing();
    setTimeout(() => {
      this.processCheck();
    }, 1000);
  }

  processing() {
    if (
      this.data.data.processable_data.emailChequeIds &&
      this.data.data.processable_data.emailChequeIds.length > 0
    ) {
      this.loading = true;
      this.email = true;
      this.mail = false;
      this.dd = false;
      this.print = false;
      return;
    }

    if (
      this.data.data.processable_data.mailChequeIds &&
      this.data.data.processable_data.mailChequeIds.length > 0
    ) {
      this.loading = true;
      this.email = false;
      this.mail = true;
      this.dd = false;
      this.print = false;
      return;
    }

    if (
      this.data.data.processable_data.ddChequeIds &&
      this.data.data.processable_data.ddChequeIds.length > 0
    ) {
      this.loading = true;
      this.email = false;
      this.mail = false;
      this.dd = true;
      this.print = false;
      return;
    }
    if (
      this.data.data.processable_data.printableChecks &&
      this.data.data.processable_data.printableChecks.length > 0
    ) {
      this.loading = true;
      this.email = false;
      this.mail = false;
      this.dd = false;
      this.print = true;
      
    }
  }

  processCheck() {
    /** Email Process */

    if (
      this.data.data.processable_data.emailChequeIds &&
      this.data.data.processable_data.emailChequeIds.length > 0
    ) {
      const EmailData: ICheckListTableRowData[] = [];
      this.data.rowData.forEach((ele: ICheckListTableRowData) => {
        this.data.data.processable_data.emailChequeIds.forEach((el: IPrintableCheck) => {
          if (
            (el.checkId !== null || el.checkId !== undefined) &&
            el.checkId === ele.action
          ) {
            EmailData.push(ele);
          }
        });
      });
      const checkEmailData = {
        data: EmailData,
        processData: this.data.data,
        status: this.data.status,
        rowData: this.data.rowData,
        isDisableNavigation: this.data.isDisableNavigation
      };
      this.dialogRef.close({type:'email',data:checkEmailData});
      
    } else if (
      /** Mail Process */
      this.data.data.processable_data.mailChequeIds &&
      this.data.data.processable_data.mailChequeIds.length > 0
    ) {
      const ids: {ids: string[]} = { ids: [] };

      this.data.rowData?.forEach((el:ICheckListTableRowData) => {
        this.data.data.processable_data.mailChequeIds?.forEach((ele:IPrintableCheck) => {
          if (el.action === ele.checkId) {
            ids.ids.push(el.action);
          }
        });
      });

      this.subscriptions.push(
        this.checkService
          .getChequeDetails(ids)
          .pipe(
            catchError((error) => {
              this.errorCode = error.error.errorCode;

              this.err_msg = error.error.errorMsg;
              return of(false);
            })
          )
          .subscribe((res) => {
            const response = res as IApiRes<IChequedata>;
            if (response.success) {
              this.checkdata.chequedata = response.data;
              this.checkDetails = response.data.datas;
              if (this.checkdata.chequedata) {
                this.ShippingCalculation();
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
              const signautureData = {
                ids,
                data: this.checkdata,
                type: 'Checkprocess',
                rowData: this.data.rowData,
                processData: this.data.data,
                isDisableNavigation: this.data.isDisableNavigation,
                bankAccountId: this.bankAccountId
              };
              this.dialogRef.close({type:'signature',data:signautureData});
            }

            if (!res && this.errorCode === 106) {
              this.dialog.open(EmailPhoneVerifyModalComponent, {
                maxWidth: '700px',
                width: '21%',
                minHeight: '200px',
                data: {
                  ids,
                  data: this.err_msg
                }
              });
              this.dialogRef.close();
            }
          })
      );
    } else if (
      /** Direct Deposit Process */
      this.data.data.processable_data.ddChequeIds &&
      this.data.data.processable_data.ddChequeIds.length > 0
    ) {
      const DDdata: ICheckListTableRowData[] = [];
      this.data.rowData?.forEach((ele: ICheckListTableRowData) => {
        this.data.data.processable_data.ddChequeIds?.forEach((el: IPrintableCheck) => {
          if (el.checkId === ele.action) {
            DDdata.push(ele);
          }
        });
      });

      const checkDdData = {
        data: DDdata,
        type: 'Checkprocess',
        rowData: this.data.rowData,
        processData: this.data.data
      };
      this.dialogRef.close({type:'dd',data:checkDdData});
      
    } else if (
      /** Print Process */
      this.data.data.processable_data.printableChecks &&
      this.data.data.processable_data.printableChecks.length > 0
    ) {
      const rowdata: ICheckListTableRowData[] = [];
      const itemIds: {checkId:string[],paperType:number | string} = { checkId: [], paperType: 5 };
      this.data.rowData?.forEach((val: ICheckListTableRowData) => {
        this.data.data.processable_data.printableChecks?.forEach((ele: IPrintableCheck) => {
          if (val.action === ele.checkId) {
            itemIds.checkId.push(val.action);
            rowdata.push(val);
          }
        });
      });
      this.subscriptions.push(
        this.checkService.printMultiCheck(itemIds)
        .pipe(
          catchError((error) => {
            if (error.error.errorCode === "plaid_virtual_account"){
              const notification = this.alertService.infoAlert({
                content: error.error.errorMsg,
                doneMsg: 'Update',
                isCancel: true
              });
              notification.afterClosed().subscribe((res) => {
                if(res){
                  const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
                    maxWidth: '1200px',
                    width: '100%',
                    disableClose: true,
                    data: error.error
                  });
                  confirmationDialog.afterClosed().subscribe((res) => {
                    if (res.success) {
                    this.processCheck();
                    }
                  });
                }
              });
            }
            // return of(false);
          return EMPTY;
          })
        )
        .subscribe((res) => {
          const printData = {
            data: res.data.url,
            processData: this.data.data,
          };
          if (res.data.url) {
            this.dialogRef.close({type:'print',data:printData});
            this.loading = false;
          }
        })
      );

      
    } else if (
      (this.data.data.processable_data.printableChecks &&
        this.data.data.processable_data.printableChecks.length === 0) ||
      (this.data.data.processable_data.ddChequeIds &&
        this.data.data.processable_data.ddChequeIds.length === 0) ||
      (this.data.data.processable_data.mailChequeIds &&
        this.data.data.processable_data.mailChequeIds.length === 0) ||
      (this.data.data.processable_data.emailChequeIds &&
        this.data.data.processable_data.emailChequeIds.length === 0)
    ) {
      this.alertService.successAlert({
        content: this.content,
        timeout: 2000,
        close: true
      });
      this.loading = false;
      this.dialogRef.close();
      this.dataTableService.setRefreshStatus(true);
    }
  }

  openFailedAlert(content: string) {
    const data = {
      content
    };
    return this.alertService.failedAlert(data);
  }

  /** shipping type data */

  shippingTYpe() {
    this.subscriptions.push(
      this.checkService.getShippingType().subscribe((res) => {
        this.checkdata.shipping = res.data;
      })
    );
  }

  /** paper type data */

  paperType() {
    this.subscriptions.push(
      this.checkService.getpaperType().subscribe((res) => {
        this.checkdata.paper = res.data;
      })
    );
  }

  /** shipping calculation */

  ShippingCalculation() {
    for (let i = 0; i < this.checkDetails.length; i += 1) {
      const ids2 = this.checkDetails[i].enc_id;

      this.caldata.mail_check_ids.push(this.checkDetails[i].enc_id);

      this.idlist.payee_email = this.checkDetails[i].payee_email as string;
      this.idlist.payee_phone = this.checkDetails[i].payee_phone as string;

      this.caldata[ids2] = this.idlist;
    }

    this.subscriptions.push(
      this.checkService
        .ShippingCostCalculationGroup(this.caldata)
        .subscribe((res) => {
          this.ShippingCostRes = res.data;
          if (res.success) {
            this.openModal();
          }
        })
    );
  }

  /** open mail modal */

  openModal() {
    if (this.checkdata.chequedata) {
      const checkMaildata = {
        data: this.checkdata,
        ShippingCost: this.ShippingCostRes,
        caldata: this.caldata,
        rowData: this.data.rowData,
        processData: this.data.data,
        isDisableNavigation: this.data.isDisableNavigation
      };
      this.dialogRef.close({type:'mail',data:checkMaildata});
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
