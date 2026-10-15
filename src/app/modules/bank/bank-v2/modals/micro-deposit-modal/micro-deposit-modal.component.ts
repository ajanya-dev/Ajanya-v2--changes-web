import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import {
  Validators,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogClose,
  MatDialogActions
} from '@angular/material/dialog';
import { of, Subscription, finalize, interval } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { AdpService } from 'src/app/shared/service/integration/adp.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  IBankData,
  IDocumentInfo,
  IKybRecord,
  IMicroDepositPusherResponse,
  IMicroDepositQrLinks,
  IUploadFromPhoneData
} from 'src/app/models/bank';
import { QrCodeScannerModalComponent } from 'src/app/modules/payments/shared/components/modals/qr-code-scanner-modal/qr-code-scanner-modal.component';
import { Channel } from 'pusher-js';
import { PusherService } from 'src/app/core/services/pusher.service';
import { NgClass, KeyValuePipe } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { ControlMessageComponent } from '../../../../../shared/components/control-message/control-message/control-message.component';
import { CommonUploadButtonV35Component } from '../../../../../shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { faCircleExclamation, faCircleInfo, faPaperPlane } from '@fortawesome/pro-regular-svg-icons';
import { V35CommonDropDownSelectorComponent } from '../../../../../shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { V35ControlMessageComponent } from '../../../../../shared/v3/control-message-v35/control-message-v35.component';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';

@Component({
  selector: 'app-micro-deposit-modal',
  templateUrl: './micro-deposit-modal.component.html',
  styleUrls: ['./micro-deposit-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogClose,
    FaIconComponent,
    NgClass,
    CommonUploadButtonV35Component,
    ControlMessageComponent,
    MatDialogActions,
    CommonButtonV35Component,
    KeyValuePipe,
    V35CommonDropDownSelectorComponent,
    V35ControlMessageComponent,
    CommonInputFieldComponent
  ]
})
export class MicroDepositModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private bankAccService = inject(BankAccountsService);
  private alertService = inject(AlertService);
  private dataTableService = inject(DataTableService);
  private adpService = inject(AdpService);
  public dialogRef = inject(MatDialogRef<MicroDepositModalComponent>);
  private v3DataTableService = inject(V3DataTableService);
  private matDialog = inject(MatDialog);
  private pusherService = inject(PusherService);
  public datas: IBankData & {
    selectedBusiness?: string;
    uploadedFiles?: {
      bankStatement?: File;
      selectedFileNames?: string[];
    };
  } = inject(MAT_DIALOG_DATA);

  microDepositForm: FormGroup;
  subscriptions: Subscription[] = [];
  bankAccId: string;
  bankAccNo: string;
  microFormData: FormData = new FormData();

  flag = true;
  btnDesable = false;
  faPaperPlane = faPaperPlane;
  facircleExclamation = faCircleExclamation;
  faInfo = faCircleInfo;

  sentSms = '';
  uploadFromPhone = false;
  qrLoading = false;
  uploadFromPhoneApiData: IUploadFromPhoneData;

  uploadFromPhoneSuccessIds: IMicroDepositQrLinks = {
    govId: undefined,
    bankStatement: undefined,
    businessInfo: undefined,
    otherInfo: undefined
  };

  govIdName = '';
  bankStatementName = '';
  businessInfoName = '';
  otherInfoName = '';
  bankStatementFile: File | undefined;
  isADPMarketPlaceUser: boolean;
  qrDialogRef: MatDialogRef<QrCodeScannerModalComponent> | undefined =
    undefined;

  pusherChannels: Channel[] = [];
  smsLoading: boolean;
  qrCodeLink = '';
  timerSubscription: Subscription;
  timer: number;
  pusherData: IMicroDepositPusherResponse;
  displayTimer: string;
  phoneResponse: boolean;
  documentsUploadedFromPhone: IDocumentInfo[] = [];
  timerExist = false;
  selectedFileNames: string[] = [];
  businessList = signal<IKybRecord[]>([]);
  isKycVerified = false;
  isLoading = signal(false);
  selectedBusiness: string;

  ngOnInit(): void {
    this.initForm();
    this.setBankAccData();
    this.bankAccNo = this.datas.bank_account_account_number;
    if(this.datas.selectedBusiness){
      this.selectedBusiness = this.datas.selectedBusiness;
    }
    this.restoreUploadedFiles();
  }

  /**
   * @description Restores previously uploaded files when modal reopens after error 10021
   */
  restoreUploadedFiles(): void {
    if (!this.datas.uploadedFiles) return;

    const { bankStatement, selectedFileNames } = this.datas.uploadedFiles;

    if (selectedFileNames) {
      this.selectedFileNames = [...selectedFileNames];
    }

    if (bankStatement) {
      this.bankStatementFile = bankStatement;
      this.bankStatementName = bankStatement.name;
      this.microFormData.append('bankStatement', bankStatement);
      this.microDepositForm.controls.bankStatement.setValue(bankStatement);
    }
  }

  PUSHER_CHANNEL_NAME_PREFIX = 'micro-deposit-document-';
  PUSHER_EVENT_NAME_PREFIX = 'micro-deposit-document-event-';

  /**
   * @description Processes the ADP user details and updates relevant properties.
   */
  processADPUserDetails() {
    this.subscriptions.push(
      this.adpService.adpUserDetails.subscribe((res) => {
        if (!res) return;

        if (res.adpMarketPlaceUser === 1) this.isADPMarketPlaceUser = true;
        else this.isADPMarketPlaceUser = false;

        if (res.adpMarketPlaceUser === 1) {
          this.microDepositForm.controls.govId.clearValidators();
          this.microDepositForm.controls.bankStatement.clearValidators();
        }

        const controls = ['bankStatement', 'govId'] as const;

        controls.forEach((el) =>
          this.microDepositForm.controls[el].updateValueAndValidity()
        );
      })
    );
  }

  /**
   * @description Sets the bank account data and updates the micro deposit form.
   */
  setBankAccData() {
    this.isLoading.set(true);
    this.subscriptions.push(
      this.bankAccService
        .microDepositDetailsById(this.datas.encrypted_bankacc_id)
        .pipe(
          finalize(() => {
            this.isLoading.set(false);
          })
        )
        .subscribe((res) => {
          this.bankAccId = res.data.bankAccountId;
          this.bankAccNo = res.data.bankAccountNumber;
          this.microFormData.append('bankAccountId', this.bankAccId);

          if (res.success) {
            this.microDepositForm.patchValue({
              bankName: res.data.bankName,
              bankAccNumber: res.data.bankAccountNumber,
              bankAccName: res.data.bankAccountName,
              routingNumber: res.data.routingNumber
            });
            this.isKycVerified = res.data.kycKybInfo.kycStatus;
            this.businessList.set(res.data.kycKybInfo.kybRecords);
            if(this.businessList()?.length > 0){
              this.selectedBusiness = this.datas.selectedBusiness || this.businessList()[0].enc_id;
              this.microFormData.append('kyb_reference_id', this.selectedBusiness);
            }
            if (this.isKycVerified) {
              this.microDepositForm.controls.govId.clearValidators();
              this.microDepositForm.controls.govId.updateValueAndValidity();
              this.microFormData.append(
                'use_kyc',
                this.isKycVerified.toString()
              );
            } else {
              this.microDepositForm.controls.govId.addValidators([
                Validators.required
              ]);
              this.microDepositForm.controls.govId.updateValueAndValidity();
            }
          }
          if(this.datas?.selectedBusiness && this.datas?.uploadedFiles && this.datas?.uploadedFiles?.bankStatement){
            this.continue();
          }
        })
    );
  }

  /**
   * @description Initializes the MicroDeposit Form.
   */
  initForm() {
    this.microDepositForm = this.fb.group({
      bankName: [''],
      bankAccNumber: [''],
      bankAccName: [''],
      routingNumber: [''],
      govId: ['', [Validators.required]],
      bankStatement: ['', [Validators.required]],
      businessInfo1: [''],
      businessInfo2: [''],
    });
    this.processADPUserDetails();
  }

  /**
   * @description Handles file input event and updates corresponding form controls and FormData.
   * @param {File} event - The file input event containing the selected file.
   * @param documentType
   */
  fileInput(
    event: File,
    documentType: 'govId' | 'bankingStatement' | 'bankingInfo' | 'otherInfo'
  ) {
    this.selectedFileNames.push(event.name);
    switch (documentType) {
      case 'govId':
        if (event.name) {
          this.microFormData.append('govId', event);
          this.govIdName = event.name;
          this.microDepositForm.controls.govId.setValue(event);
        } else {
          this.govIdName = '';
          this.microFormData.delete('govId');
          this.microDepositForm.controls.govId.setValue(undefined);
        }
        break;
      case 'bankingStatement':
        if (event.name) {
          this.microFormData.append('bankStatement', event);
          this.bankStatementName = event.name;
          this.bankStatementFile = event;
          this.microDepositForm.controls.bankStatement.setValue(event);
        } else {
          this.bankStatementName = '';
          this.bankStatementFile = undefined;
          this.microFormData.delete('bankStatement');
          this.microDepositForm.controls.bankStatement.setValue(null);
        }
        break;
      case 'bankingInfo':
        if (event.name) {
          this.microFormData.append('businessInfo1', event);
          this.businessInfoName = event.name;
        } else {
          this.microFormData.delete('businessInfo1');
          this.businessInfoName = '';
        }
        break;
      case 'otherInfo':
        if (event.name) {
          this.microFormData.append('businessInfo2', event);
          this.otherInfoName = event.name;
        } else {
          this.microFormData.delete('businessInfo2');
          this.otherInfoName = '';
        }
        break;
      default:
        break;
    }
  }

  removeFileName(fileName: string) {
    this.selectedFileNames = this.selectedFileNames.filter(
      (file) => file !== fileName
    );
  }

  getSelectedBusiness(selectedBusiness: string) {
    if (selectedBusiness) {
      this.selectedBusiness = selectedBusiness;
      // Check if 'kyb_reference_id' is already present in microFormData
      if (this.microFormData.has('kyb_reference_id')) {
        // Remove the existing 'kyb_reference_id' from microFormData
        this.microFormData.delete('kyb_reference_id');
      }
      // Append the new 'kyb_reference_id' to microFormData
      this.microFormData.append('kyb_reference_id', selectedBusiness);
    }
  }

  /**
   * @description Handles the submission of the microDepositForm and sends a micro deposit request.
   *
   */
  continue() {
    this.microDepositForm.markAllAsTouched();
    let dataFromPhone;

    if (this.microDepositForm.invalid && !this.phoneResponse) {
      return;
    }

    if (this.phoneResponse) {
      dataFromPhone = {
        bankAccountId: this.bankAccId,
        attachments: this.documentsUploadedFromPhone,
        kyb_reference_id: this.selectedBusiness,
        use_kyc:this.isKycVerified

      };
    }
    this.btnDesable = true;

    this.subscriptions.push(
      this.bankAccService
        .microDeposit(dataFromPhone ?? this.microFormData)
        .pipe(
          catchError((error) => {
            if(error.error.errorCode === 10021){
              const alert = this.alertService.failedAlert({
                content: 'The bank account holder name doesn’t match the selected business name. Please update the account holder name to match the business name and try again.',
                doneMsg: 'Update',
                isCancel: true
              });
              alert.afterClosed().subscribe((res) => {
                if(res){
                  const selectedBusinessRecord = this.businessList().find(
                    record => record.enc_id === this.selectedBusiness
                  );
                  const businessName = selectedBusinessRecord?.business_name || '';
                  this.dialogRef.close({
                    errorCode: 10021,
                    bankData: this.datas,
                    bankAccId: this.bankAccId,
                    selectedBusiness: this.selectedBusiness,
                    businessName,
                    uploadedFiles: {
                      bankStatement: this.bankStatementFile,
                      selectedFileNames: this.selectedFileNames
                    }
                  });
                }
              });
            }
            this.v3DataTableService.refreshV3DataTable();
            return of(false);
          })
        )
        .subscribe({
          next: (res) => {
            this.btnDesable = false;
            const response = res as {
              success: boolean;
              data: string;
              message?: string;
            };
            if (response.success) {
              this.v3DataTableService.refreshV3DataTable();
              this.dataTableService.setRefreshStatus(true);
              this.bankAccService.bancAcEvents.next({
                message: 'MD Request',
                bankAcId: this.datas.encrypted_bankacc_id
              });
              this.dialogRef.close(response.success);
              const data = {
                content: response.message,
                close: true,
                timeout: 1500
              };
              this.alertService.successAlert(data);
            }
          }
        })
    );
  }

  /**
   * @description Toggle upload from phone and browser
   * @param action
   */
  uploadFromPhoneSwitch(action: 'open' | 'cancel' = 'open') {
    this.uploadFromPhone = action === 'open';
  }

  /**
   * @description To send sms which contains the link upload documents
   * @param requestType sms or qr
   */
  uploadFromPhoneAction(requestType: string) {
    const data = {
      requestType,
      bankAccountNumber: this.bankAccNo,
      bankAccountId: this.bankAccId,
      documentType: [
        'businessInfo',
        'governmentId',
        'otherInfo',
        'bankingStatement'
      ]
    };
    this.smsLoading = true;
    this.subscriptions.push(
      this.bankAccService
        .uploadFromPhone(data)
        .pipe(
          finalize(() => {
            this.smsLoading = false;
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.startTimer(res.data.timer.diff);
              this.qrCodeLink = res.data.data.link;
              this.clearLink();
              this.uploadFromPhoneApiData = res.data.data;
              this.sentSms = res.data.data.phoneNumber;
              this.subscribePusher(res.data.data.id);
            } else {
              this.startTimer(res.errorMsg);
            }
          },
          error: (error) => {
            this.startTimer(error.error.errorMsg);
          }
        })
    );
  }

  /**
   * Opens a modal. if we have fetched the link already storing it in a variable. and reuse the link for 5 minutes.
   * and also if we get the link, we are subscribing to a pusher channel. to get the event of user submitting the document from outside.
   * @param qrFor - to know that for which document are we opening qr code modal.
   */
  openQrCodeModal() {
    const openQrCodeModal = (link: string) =>
      this.matDialog.open(QrCodeScannerModalComponent, {
        width: '322px',
        height: '445px',
        data: {
          link
        }
      });

    if (this.qrCodeLink) {
      this.qrDialogRef = openQrCodeModal(this.qrCodeLink as string);
    } else {
      const documentType = [
        'governmentId',
        'bankingStatement',
        'businessInfo',
        'otherInfo'
      ];
      this.qrLoading = true;
      this.subscriptions.push(
        this.bankAccService
          .uploadFromPhone({
            documentType,
            bankAccountNumber: this.bankAccNo,
            bankAccountId: this.bankAccId,
            requestType: 'qr'
          })
          .pipe(
            finalize(() => {
              this.qrLoading = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.qrCodeLink = res.data.data.link;
              this.qrDialogRef = openQrCodeModal(res.data.data.link);
              this.uploadFromPhoneApiData = res.data.data;
              this.clearLink();
              this.subscribePusher(res.data.data.id);
            }
          })
      );
    }
  }

  /**
   * @description Subscribe to pusher for getting realtime response of the corresponding link with unique uuId
   * @param uuId Unique id gets from api when upload from phone enabled
   */
  subscribePusher(uuId: string) {
    const channelName = this.PUSHER_CHANNEL_NAME_PREFIX + uuId;
    const eventName = this.PUSHER_EVENT_NAME_PREFIX + uuId;
    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(eventName, (data: IMicroDepositPusherResponse) => {
          this.phoneResponse = true;
          this.documentsUploadedFromPhone = data.document_info;
          this.qrDialogRef?.close();
          data.document_info.forEach((doc) => {
            if (doc.document_type === 'govId') {
              this.govIdName = doc.document_name;
              this.uploadFromPhone = false;
              this.uploadFromPhoneSuccessIds.govId = doc;
              this.microFormData.append('govId', doc.document_id);
            } else if (doc.document_type === 'bankStatement') {
              this.bankStatementName = doc.document_name;
              this.uploadFromPhone = false;
              this.uploadFromPhoneSuccessIds.bankStatement = doc;
              this.microFormData.append('bankStatement', doc.document_id);
            } else if (doc.document_type === 'businessInfo1') {
              this.businessInfoName = doc.document_name;
              this.uploadFromPhone = false;
              this.uploadFromPhoneSuccessIds.businessInfo = doc;
              this.microFormData.append('businessInfo1', doc.document_id);
            } else if (doc.document_type === 'businessInfo2') {
              this.otherInfoName = doc.document_name;
              this.uploadFromPhone = false;
              this.uploadFromPhoneSuccessIds.otherInfo = doc;
              this.microFormData.append('businessInfo2', doc.document_id);
            }
          });
        })
    );
  }

  /**
   * @description This function countdown from the time we given as param (output format 'hh:mm:ss')
   * @param time The no of seconds
   */
  startTimer(time: number) {
    this.timer = time;
    const source = interval(1000);

    this.timerSubscription = source.subscribe(() => {
      if (this.timer > 0) {
        this.timerExist = true;
        this.timer -= 1;
        const hours = Math.floor(this.timer / 3600);
        const minutes = Math.floor((this.timer % 3600) / 60);
        const seconds = this.timer % 60;
        this.displayTimer = `${hours < 10 ? '0' : ''}${hours}:${
          minutes < 10 ? '0' : ''
        }${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      } else {
        this.timerExist = false;
        this.timerSubscription.unsubscribe();
      }
    });
  }

  clearLink() {
    setTimeout(() => {
      this.qrCodeLink = '';
    }, 5000 * 60);
  }

  ngOnDestroy() {
    this.pusherChannels.forEach((el) => el.unsubscribe());
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}
