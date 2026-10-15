/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatDialogClose,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { of, Subscription } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LucideAngularModule, AlertCircle, X, PenTool } from 'lucide-angular';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { environment } from 'src/environments/environment';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { IApiRes } from 'src/app/models/api';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckMailModalV4Component } from 'src/app/modules/check/modal/mail-modals/check-mail-modal-v4/check-mail-modal.component-v4';
import {
  ICheckData,
  ICheckListTableRowData,
  ICheckShipingTypes,
  IChequedata,
  ICustomRestrictions,
  IMailCheck,
  IProcessCheck,
  IShipingCheckPaperType,
  IShippingCostCalculation,
  ShippingIdList
} from 'src/app/modules/check/model/check';
import { V4SignatureUploadPanelComponent } from "../signature-upload-panel/v4-signature-upload-panel.component";

interface IInjectData {
  ids: { ids: string[] };
  data: ICheckData;
  bankAccountId: string;
  type?: string;
  rowData?: ICheckListTableRowData[];
  processData?: IProcessCheck;
  isDisableNavigation: unknown;
  hideSuccessAlert?: boolean;
  openRecurringModal?: boolean;

  /**
   * Opt-in, for a caller whose cheque does not exist yet — Send Payment creates
   * and mails in one call, so there is nothing to fetch details for and no mail
   * modal to hand over to. Both buttons close with a `VerifySignatureResult`
   * and the caller re-submits. Absent, every path below is unchanged.
   */
  standalone?: boolean;
  /** What to print under "Check #" in standalone mode. */
  serialNos?: string[];
}

/** How a standalone caller learns which button was pressed. */
export type VerifySignatureResult = 'signed' | 'without-sign';

@Component({
  selector: 'app-verify-signature-modal-v4',
  templateUrl: './verify-signature-modal-v4.component.html',
  standalone: true,
  imports: [CommonButtonV4Component, LucideAngularModule, MatDialogClose]
})
export class VerifySignatureModalV4Component implements OnInit, OnDestroy {
  private checkService = inject(CheckService);
  private dialog = inject(MatDialog);
  private dialogRef = inject(MatDialogRef<VerifySignatureModalV4Component>);
  public injectData: IInjectData = inject(MAT_DIALOG_DATA);
  private checkDesignService = inject(CheckDesignService);
  private bankAccountService = inject(BankAccountsService);
  private alertService = inject(V4AlertService);

  rooturl = environment.rootUrl;

  readonly AlertCircleIcon = AlertCircle;
  readonly XIcon = X;
  readonly PenToolIcon = PenTool;

  subscriptions: Subscription[] = [];
  checkIds: string[] = [];
  errorMsg = signal('');
  isSubmit = signal(false);
  isWithoutSignLoading = signal(false);
  isShippingTypesLoading = signal(true);

  checkdata: {
    errorMsg: string;
    chequedata: IChequedata;
    shipping: ICheckShipingTypes[];
    paper: IShipingCheckPaperType[];
  } = {
    errorMsg: '',
    chequedata: {} as IChequedata,
    shipping: [],
    paper: []
  };

  checkDetails: IMailCheck[];

  ShippingCostRes: IShippingCostCalculation;

  idlist: ShippingIdList = {
    mail_type: 0,
    check_paper: 7,
    informed_payee_sms: 0,
    informed_payee_email: 0,
    payee_phone: '',
    payee_email: '',
    file_hidden: []
  };

  caldata: any = {
    mail_check_ids: [],
    all_check_ids: [],
    shipping_rate_warning: 0,
    sent_to_customer_address: 0,
    Single_mail_options: 3
  };

  skipprocess = false;
  bankAccountId: string;
  caDefaultShippingType = 14;
  usDefaultShippingType: number | undefined;

  /** No cheque to load, and no mail modal to open. Set once in `ngOnInit`. */
  isStandalone = false;

  /**
   * What goes under "Check #". A blocker names the serials outright; the legacy
   * callers only ever had the error message, which is the numbers in prose.
   */
  get serialNoText(): string {
    return this.injectData.serialNos?.length
      ? this.injectData.serialNos.join(', ')
      : this.errorMsg();
  }

  /** Drives the singular/plural wording. */
  get affectedCount(): number {
    return this.injectData.serialNos?.length || this.checkIds.length;
  }

  ngOnInit(): void {
    this.checkIds = this.injectData.ids?.ids ?? [];
    this.errorMsg.set(this.injectData.data?.errorMsg as string);
    this.bankAccountId = this.injectData.bankAccountId;
    this.isStandalone = !!this.injectData.standalone;

    if (this.isStandalone) {
      // The cheque-detail, shipping and paper calls all exist to build the mail
      // modal's payload. There is no cheque and no mail modal here, so the only
      // thing left to do is unblock the footer.
      this.isShippingTypesLoading.set(false);
      return;
    }

    this.loadCheckDetails();
    this.paperType();
    this.skipprocess = this.injectData?.type === 'Checkprocess';
  }

  shippingType(): void {
    this.subscriptions.push(
      this.checkService
        .getShippingType()
        .pipe(
          finalize(() => {
            this.isShippingTypesLoading.set(false);
          })
        )
        .subscribe((res) => {
          this.checkdata.shipping = res.data;
          this.setDefaultShippingType(res.data);
        })
    );
  }

  setDefaultShippingType(shippingType: ICheckShipingTypes[]) {
    const usTypes = shippingType.filter(
      (ele) => ele.country !== 'Canada' && ele.country !== 'International'
    );
    const defaultType = usTypes.find((ele) => ele.is_default_mailing_type);
    this.usDefaultShippingType = defaultType?.id || undefined;
    const caTypes = shippingType.filter((ele) => ele.country === 'Canada');
    const defaultCaType = caTypes.find((ele) => ele.is_default_mailing_type);
    this.caDefaultShippingType = defaultCaType?.id || 14;
  }

  paperType() {
    this.subscriptions.push(
      this.checkService.getpaperType().subscribe((res) => {
        this.checkdata.paper = res.data;
      })
    );
  }

  loadCheckDetails() {
    const ids: { ids: string[]; is_signature: 0 | 1 } = {
      ids: [],
      is_signature: 1
    };

    this.checkIds.forEach((element) => {
      ids.ids.push(element);
    });

    this.subscriptions.push(
      this.checkService
        .getChequeDetails(ids)
        .pipe(
          catchError((error) => {
            this.errorMsg.update(() => error.error.errorMsg);
            return of(error);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.shippingType();
            this.checkdata.chequedata = res.data;
            this.checkDetails = res.data.datas;
            this.ShippingCalculation();
          }
        })
    );
  }

  WithoutSign() {
    if (this.isStandalone) {
      this.dialogRef.close('without-sign' as VerifySignatureResult);
      return;
    }

    const ids: { ids: string[]; is_signature: 0 | 1 } = {
      ids: [],
      is_signature: 1
    };

    this.checkIds.forEach((checkId) => {
      if (this.injectData.type === 'Checkprocess') {
        this.injectData?.processData?.processable_data.mailChequeIds.forEach(
          (cheque) => {
            if (checkId === cheque.checkId) {
              ids.ids.push(checkId);
            }
          }
        );
      } else {
        ids.ids.push(checkId);
      }
    });
    this.isWithoutSignLoading.set(true);
    this.subscriptions.push(
      this.checkService
        .getChequeDetails(ids)
        .pipe(
          catchError((error) => {
            this.errorMsg.update(() => error.error.errorMsg);
            return of(error);
          }),
          finalize(() => {
            this.isWithoutSignLoading.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.checkdata.chequedata = res.data;
            this.checkDetails = res.data.datas;
            this.ShippingCalculation();
          }
          if (this.checkdata) {
            const modalConfig = {
              maxWidth: '1200px',
              width: '100%',
              minHeight: '380px',
              disableClose: true,
              panelClass: 'paddingless-modal-rounded',
              data: this.prepareModalData()
            };
            this.dialog.open(CheckMailModalV4Component, modalConfig);
            this.dialogRef.close();
          }
        })
    );
  }

  addSignature() {
    this.isSubmit.set(true);
    this.subscriptions.push(
      this.checkDesignService
        .getCustomRestriction()
        .pipe(
          finalize(() => {
            this.isSubmit.set(false);
          })
        )
        .subscribe({
          next: (response: IApiRes<ICustomRestrictions>) => {
            if (response.success) {
              const dialogRef = this.dialog.open(
                V4SignatureUploadPanelComponent,
                {
                  maxWidth: '690px',
                  width: '93%',
                  panelClass: 'paddingless-modal-rounded',
                  minHeight: '410px',
                  disableClose: true
                }
              );
              dialogRef.afterClosed().subscribe((signImg) => {
                if (signImg) {
                  this.isSubmit.set(true);
                  this.subscriptions.push(
                    this.bankAccountService
                      .addSignature(
                        this.bankAccountId,
                        signImg.existSign
                          ? signImg.existSign
                          : signImg.signatureUrl
                      )
                      .pipe(
                        finalize(() => {
                          this.isSubmit.set(false);
                        })
                      )
                      .subscribe({
                        next: (res) => {
                          if (res) {
                            const alertData = {
                              content: 'Signature added successfully',
                              close: true
                            };
                            this.alertService.successAlert(alertData);
                            this.openCheckMailModal();
                          }
                        },
                        error: (err) => {
                          this.alertService.warningAlert({
                            content: err.error.errorMsg
                          });
                        }
                      })
                  );
                }
              });
            }
          }
        })
    );
  }

  openCheckMailModal() {
    // The signature is on the account now; the caller re-submits its own payload.
    if (this.isStandalone) {
      this.dialogRef.close('signed' as VerifySignatureResult);
      return;
    }

    this.isSubmit.set(true);
    this.subscriptions.push(
      this.checkService
        .getChequeDetails({ ids: this.checkIds })
        .pipe(
          finalize(() => {
            this.isSubmit.set(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.checkdata.chequedata = res.data as IChequedata;
              this.checkDetails = res.data?.datas as IMailCheck[];
            }

            const modalConfig = {
              maxWidth: '1200px',
              width: '100%',
              minHeight: '380px',
              disableClose: true,
              data: this.prepareModalData(),
              panelClass: 'paddingless-modal-rounded'
            };
            this.dialog.open(CheckMailModalV4Component, modalConfig);
            this.dialogRef.close(
              this.injectData.type === 'Checkprocess' ? undefined : 'close'
            );
          },
          error: (err) => {
            if (err.error?.errorCode === 2) {
              this.errorMsg.update(() => err.error.errorMsg);
              this.setNextErrorBankId(err.error.errorMsg);
            }
          }
        })
    );
  }

  setNextErrorBankId(checkNo: string) {
    if (this.injectData.data.chequedata) {
      this.injectData.data.chequedata.datas.forEach((el) => {
        if (checkNo === el.cheque_serial_number) {
          this.bankAccountId = el.enc_bank_account_id as string;
        } else {
          const checkNumbers = checkNo.split(',');
          checkNumbers.forEach((e: string) => {
            if (el.cheque_serial_number === e) {
              this.bankAccountId = el.enc_bank_account_id as string;
            }
          });
        }
      });
    }
  }

  private prepareModalData() {
    const baseData = {
      data: this.checkdata,
      ShippingCost: this.ShippingCostRes ? this.ShippingCostRes : null,
      caldata: this.caldata,
      isDisableNavigation: this.injectData.isDisableNavigation,
      hideSuccessAlert: this.injectData.hideSuccessAlert,
      openRecurringModal: this.injectData.openRecurringModal
    };

    if (this.injectData.type === 'Checkprocess') {
      return {
        ...baseData,
        rowData: this.injectData.rowData,
        processData: this.injectData.processData,
        type: 'Checkprocess'
      };
    }

    return baseData;
  }

  ShippingCalculation() {
    this.caldata.mail_check_ids = [];
    for (let i = 0; i < this.checkDetails.length; i += 1) {
      const ids2 = this.checkDetails[i].enc_id;
      this.caldata.mail_check_ids.push(ids2);

      if (this.checkDetails[i].payee_country === 'Canada') {
        this.caldata[ids2] = this.getobject(
          this.checkDetails[i].payee_email as string,
          this.checkDetails[i].payee_phone as string,
          this.caDefaultShippingType
        );
      } else {
        this.idlist.mail_type = this.usDefaultShippingType
          ? this.usDefaultShippingType
          : null;
        this.caldata[ids2] = this.getobject(
          this.checkDetails[i].payee_email as string,
          this.checkDetails[i].payee_phone as string,
          this.usDefaultShippingType ? this.usDefaultShippingType : null
        );
      }
    }

    const filteredCaldata = {
      ...this.caldata,
      mail_check_ids: this.caldata.mail_check_ids.filter(
        (id: string) => this.caldata[id].mail_type !== null
      )
    };

    filteredCaldata.mail_check_ids.forEach((id: string) => {
      if (this.caldata[id].mail_type === null) {
        delete filteredCaldata[id];
      }
    });

    if (filteredCaldata.mail_check_ids?.length !== 0) {
      this.subscriptions.push(
        this.checkService
          .ShippingCostCalculationGroup(filteredCaldata)
          .subscribe((res) => {
            this.ShippingCostRes = res.data;
          })
      );
    }
  }

  skip() {
    this.dialogRef.close({
      success: true,
      processData: this.injectData.processData,
      rowData: this.injectData.rowData,
      isDisableNavigation: this.injectData.isDisableNavigation
    });
    if (this.injectData.processData) {
      this.injectData.processData.processable_data.mailChequeIds = [];
    }
  }

  getobject(
    payee_email: string,
    payee_phone: string,
    mail_type: number | null
  ) {
    return {
      mail_type,
      check_paper: 7,
      informed_payee_sms: 0,
      informed_payee_email: 0,
      payee_phone,
      payee_email,
      file_hidden: []
    };
  }

  close() {
    this.checkService.setCheckMailEvents({ isSuccess: false });
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
