import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CheckProcessLoadingModalComponent } from '../modal/process-modal/check-process-loading-modal/check-process-loading-modal.component';
import { CheckProcessLoadingModalV4Component } from '../modal/process-modal/check-process-loading-modal-v4/check-process-loading-modal-v4.component';
import { ICheckData, ICheckListTableRowData, ICheckStatus, IProcessCheck, IShippingCostCalculation } from '../model/check';
import { CheckEmailModalComponent } from '../modal/check-email-modal/check-email-modal.component';
import { CheckEmailModalV4Component } from '../modal/check-email-modal-v4/check-email-modal-v4.component';
import { CheckMailModalComponent } from '../modal/mail-modals/check-mail-modal/check-mail-modal.component';
import { CheckMailModalV4Component } from '../modal/mail-modals/check-mail-modal-v4/check-mail-modal.component-v4';
import { ICalculationData } from '../../business-tools/plexe/model/plexe';
import { CheckProcessPrintComponent } from '../modal/process-modal/check-process-print/check-process-print.component';
import { CheckProcessPrintV4Component } from '../modal/process-modal/check-process-print-v4/check-process-print-v4.component';
import { DirectDepositComponent } from '../modal/direct-deposit/direct-deposit.component';
import { DirectDepositV4Component } from '../modal/direct-deposit-v4/direct-deposit-v4.component';
import { VerifySignatureModalComponent } from '../modal/mail-modals/verify-signature-modal/verify-signature-modal.component';
import { VerifySignatureModalV4Component } from '../../payments-v4/send-payment/components/modals/verify-signature-modal-v4/verify-signature-modal-v4.component';

interface ICheckEmailData {
  data: ICheckListTableRowData[];
  processData: IProcessCheck;
  status: ICheckStatus;
  rowData: ICheckListTableRowData[];
  isDisableNavigation: unknown;
}

interface ICheckMailData {
  data: ICheckData;
  ShippingCost: IShippingCostCalculation;
  caldata: ICalculationData;
  rowData: ICheckListTableRowData[];
  processData: IProcessCheck;
  isDisableNavigation: unknown;
}

interface ICheckDdData{
  data: ICheckListTableRowData[];
  type: string;
  rowData: ICheckListTableRowData[];
  processData: IProcessCheck;
}

interface ISignautureData {
  ids: {
      ids: string[];
  };
  data: ICheckData;
  type: string;
  rowData: ICheckListTableRowData[];
  processData: IProcessCheck;
  isDisableNavigation: unknown;
  bankAccountId:string;
}

interface IDialogResponse {
  type?: 'email' | 'mail' | 'print' | 'dd' | 'signature';
  data?: ICheckEmailData | ICheckMailData | {data: string; processData: IProcessCheck;} | ICheckDdData | ISignautureData;
}

@Injectable({
  providedIn: 'root'
})
export class CheckProcessService {

  private dialog = inject(MatDialog);

  /**
   * @description Opens the check process loading modal.
   * @param {IProcessCheck}checkData The process check data.
   * @param {ICheckListTableRowData[]}rowData The table row data.
   * @param {ICheckStatus}status The check status.
   */
  openCheckProcessLoadingModal(checkData:IProcessCheck,rowData?: ICheckListTableRowData[],status?:ICheckStatus,isDisableNavigation?:unknown): void{
    const dialog = this.dialog.open(CheckProcessLoadingModalComponent, {
      maxWidth: '400px',
      width: '40%',
      minHeight: '200px',
      height: 'unset',
      disableClose: true,
      data: {
        data: checkData,
        rowData,
        status,
        isDisableNavigation
      }
    });
    dialog.afterClosed().subscribe((res:IDialogResponse) => {
      if(res?.type === 'email'){
        this.openCheckEmailModal(res?.data as ICheckEmailData);
      }
      if(res?.type === 'mail'){
        this.openCheckMailModal(res?.data as ICheckMailData);
      }
      if(res?.type === 'print'){
        this.openCheckPrintModal(res.data as {data: string; processData: IProcessCheck;});
      }
      if(res?.type === 'dd'){
        this.openCheckDdModal(res.data as ICheckDdData);
      }
      if(res?.type === 'signature'){
        this.openSignatureVerifyModal(res.data as ISignautureData);
      }
    });
  }

  /**
   * @description Opens the check email modal.
   * @param ICheckEmailData} checkEmailData - The data object containing information to be displayed in the modal.
   */
  openCheckEmailModal(checkEmailData: ICheckEmailData): void{
    this.dialog.open(CheckEmailModalComponent, {
      maxWidth: '93%',
      width: '1232px',
      data: {
        data: checkEmailData.data,
        type: 'Checkprocess',
        processData: checkEmailData.processData,
        status:  checkEmailData.status,
        rowData:  checkEmailData.rowData,
        isDisableNavigation: checkEmailData.isDisableNavigation
      }
    }).afterClosed().subscribe((res) => {
      if(res?.success){
        this.openCheckProcessLoadingModal(res.checkData,res.rowData,res.status);
      }      
    });
  }

  /**
   * @description Open check mail modal.
   * @param {ICheckMailData} checkMailData - The data object containing information to be displayed in the modal. 
   */
  openCheckMailModal(checkMailData: ICheckMailData): void{
    this.dialog.open(CheckMailModalComponent, {
      maxWidth: '1200px',
      width: '100%',
      minHeight: '380px',
      disableClose: true,
      data: {
        data: checkMailData.data,
        ShippingCost: checkMailData.ShippingCost,
        caldata: checkMailData.caldata,
        type: 'Checkprocess',
        rowData: checkMailData.rowData,
        processData: checkMailData.processData,
        isDisableNavigation: checkMailData.isDisableNavigation
      }
    }).afterClosed().subscribe((res) => {
      if(res?.success){
        this.openCheckProcessLoadingModal(res.processData,res.rowData,undefined,res?.isDisableNavigation);
      }      
    });
  }

  /**
   * @description Open check print modal.
   * @param {Object} checkPrintData - Contain check details. 
   */
  openCheckPrintModal(checkPrintData: {data: string; processData: IProcessCheck;}): void{

    this.dialog.open(CheckProcessPrintComponent, {
      maxWidth: '1100px',
      width: '100%',
      minHeight: '380px',
      disableClose: true,
      data: {
        data: checkPrintData.data,
        processData: checkPrintData.processData,
        type: 'Checkprocess'
      }
    }).afterClosed().subscribe((res) => {
      if(res.success){
        this.openCheckProcessLoadingModal(res.processData);
      }
    });
  }

  /**
   * @description Open direct deposit modal.
   * @param {ICheckDdData}checkDdData - The data object containing information to be displayed in the modal.
   */
  openCheckDdModal(checkDdData: ICheckDdData): void{
    this.dialog.open(DirectDepositComponent, {
      width: '75%',
      data: {
        data: checkDdData.data,
        type: 'Checkprocess',
        rowData: checkDdData.rowData,
        processData: checkDdData.processData
      }
    }).afterClosed().subscribe((res) => {
      if(res.success){
        this.openCheckProcessLoadingModal(res.processData,res.rowData);
      }
    });
  }

  /**
   * @description Open signature verification modal.
   * @param {ISignautureData}signatureData - The data object containing information to be displayed in the modal.
   */
  openSignatureVerifyModal(signatureData:ISignautureData): void{
    this.dialog.open(VerifySignatureModalComponent, {
      maxWidth: '700px',
      width: '23%',
      minHeight: '200px',
      disableClose: true,
      data: {
        ids:signatureData.ids,
        data: signatureData.data,
        type: 'Checkprocess',
        rowData: signatureData.rowData,
        processData: signatureData.processData,
        isDisableNavigation: signatureData.isDisableNavigation,
        bankAccountId: signatureData.bankAccountId
      }
    }).afterClosed().subscribe((res) => {
      if(res?.success){
        this.openCheckProcessLoadingModal(res.processData,res.rowData,undefined,res?.isDisableNavigation);
      }
    });
  }

  // ─── V4 Methods ───

  openCheckProcessLoadingModalV4(checkData: IProcessCheck, rowData?: ICheckListTableRowData[], status?: ICheckStatus, isDisableNavigation?: unknown): void {
    const dialog = this.dialog.open(CheckProcessLoadingModalV4Component, {
      maxWidth: '400px',
      width: '40%',
      minHeight: '200px',
      height: 'unset',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: { data: checkData, rowData, status, isDisableNavigation }
    });
    dialog.afterClosed().subscribe((res: IDialogResponse) => {
      if (res?.type === 'email') {
        this.openCheckEmailModalV4(res.data as ICheckEmailData);
      }
      if (res?.type === 'mail') {
        this.openCheckMailModalV4(res.data as ICheckMailData);
      }
      if (res?.type === 'dd') {
        this.openCheckDdModalV4(res.data as ICheckDdData);
      }
      if (res?.type === 'print') {
        this.openCheckPrintModalV4(res.data as { data: string; processData: IProcessCheck });
      }
      if (res?.type === 'signature') {
        this.openSignatureVerifyModalV4(res.data as ISignautureData);
      }
    });
  }

  openCheckEmailModalV4(checkEmailData: ICheckEmailData): void {
    this.dialog.open(CheckEmailModalV4Component, {
      maxWidth: '93%',
      width: '1232px',
      panelClass: 'paddingless-modal-rounded',
      data: {
        data: checkEmailData.data,
        type: 'Checkprocess',
        processData: checkEmailData.processData,
        status: checkEmailData.status,
        rowData: checkEmailData.rowData,
        isDisableNavigation: checkEmailData.isDisableNavigation
      }
    }).afterClosed().subscribe((res) => {
      if (res?.success) {
        this.openCheckProcessLoadingModalV4(res.checkData, res.rowData, res.status);
      }
    });
  }

  openCheckMailModalV4(checkMailData: ICheckMailData): void {
    this.dialog.open(CheckMailModalV4Component, {
      maxWidth: '1200px',
      width: '100%',
      minHeight: '380px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        data: checkMailData.data,
        ShippingCost: checkMailData.ShippingCost,
        caldata: checkMailData.caldata,
        type: 'Checkprocess',
        rowData: checkMailData.rowData,
        processData: checkMailData.processData,
        isDisableNavigation: checkMailData.isDisableNavigation
      }
    }).afterClosed().subscribe((res) => {
      if (res?.success) {
        this.openCheckProcessLoadingModalV4(res.processData, res.rowData, undefined, res?.isDisableNavigation);
      }
    });
  }

  openCheckDdModalV4(checkDdData: ICheckDdData): void {
    this.dialog.open(DirectDepositV4Component, {
      width: '75%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        data: checkDdData.data,
        type: 'Checkprocess',
        rowData: checkDdData.rowData,
        processData: checkDdData.processData
      }
    }).afterClosed().subscribe((res) => {
      if (res?.success) {
        this.openCheckProcessLoadingModalV4(res.processData, res.rowData);
      }
    });
  }

  openCheckPrintModalV4(checkPrintData: { data: string; processData: IProcessCheck }): void {
    this.dialog.open(CheckProcessPrintV4Component, {
      maxWidth: '1100px',
      width: '100%',
      minHeight: '380px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        data: checkPrintData.data,
        processData: checkPrintData.processData,
        type: 'Checkprocess'
      }
    }).afterClosed().subscribe((res) => {
      if (res?.success) {
        this.openCheckProcessLoadingModalV4(res.processData);
      }
    });
  }

  openSignatureVerifyModalV4(signatureData: ISignautureData): void {
    this.dialog.open(VerifySignatureModalV4Component, {
      maxWidth: '700px',
      width: '23%',
      minHeight: '200px',
      disableClose: true,
      panelClass: 'paddingless-modal-rounded',
      data: {
        ids: signatureData.ids,
        data: signatureData.data,
        type: 'Checkprocess',
        rowData: signatureData.rowData,
        processData: signatureData.processData,
        isDisableNavigation: signatureData.isDisableNavigation,
        bankAccountId: signatureData.bankAccountId
      }
    }).afterClosed().subscribe((res) => {
      if (res?.success) {
        this.openCheckProcessLoadingModalV4(res.processData, res.rowData, undefined, res?.isDisableNavigation);
      }
    });
  }
}
