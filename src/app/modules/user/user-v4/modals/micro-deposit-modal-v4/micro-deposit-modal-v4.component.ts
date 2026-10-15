import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { interval, of, Subscription } from 'rxjs'; // Subscription kept for timerSubscription ref
import { catchError, finalize } from 'rxjs/operators';
import {
  LucideAngularModule,
  X,
  CheckCircle2,
  Info,
  Loader2,
  Upload,
  ChevronDown
} from 'lucide-angular';
import { faPaperPlane, faQrcode } from '@fortawesome/pro-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { Channel } from 'pusher-js';

import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { AdpService } from 'src/app/shared/service/integration/adp.service';
import { PusherService } from 'src/app/core/services/pusher.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { V4CommonDropDownSelectorComponent } from 'src/app/shared/V4/v4-dropdown/v4-common-dropdown-selector.component';
import { V4ControlMessageComponent } from 'src/app/shared/V4/control-message-v4/control-message-v4.component';
import { QrCodeScannerModalV4Component } from 'src/app/modules/payments/shared/components/modals/qr-code-scanner-modal/v4/qr-code-scanner-modal-v4.component';
import {
  IDocumentInfo,
  IKybRecord,
  IMicroDepositPusherResponse,
  IMicroDepositQrLinks
} from 'src/app/models/bank';

export interface MicroDepositModalV4Data {
  encrypted_bankacc_id: string;
  selectedBusiness?: string;
  uploadedFiles?: {
    bankStatement?: File;
    selectedFileNames?: string[];
  };
}

@Component({
  selector: 'app-micro-deposit-modal-v4',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideAngularModule,
    FormsModule,
    ReactiveFormsModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    V4CommonDropDownSelectorComponent,
    V4ControlMessageComponent
  ],
  templateUrl: './micro-deposit-modal-v4.component.html',
  styleUrl: './micro-deposit-modal-v4.component.scss'
})
export class MicroDepositModalV4Component implements OnInit {
  readonly X = X;
  readonly CheckCircle2 = CheckCircle2;
  readonly Info = Info;
  readonly Loader2 = Loader2;
  readonly Upload = Upload;
  readonly ChevronDown = ChevronDown;
  readonly faPaperPlane: IconProp = faPaperPlane;
  readonly faQrcode: IconProp = faQrcode;

  private destroyRef = inject(DestroyRef);
  private dialogRef = inject(MatDialogRef<MicroDepositModalV4Component>);
  public datas: MicroDepositModalV4Data = inject(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private bankAccService = inject(BankAccountsService);
  private alertService = inject(V4AlertService);
  private adpService = inject(AdpService);
  private pusherService = inject(PusherService);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  // Form
  microDepositForm: FormGroup;

  // State signals
  isLoading = signal(false);
  isSubmitting = signal(false);
  isKycVerified = signal(false);
  businessList = signal<IKybRecord[]>([]);
  govIdName = signal('');
  bankStatementName = signal('');
  businessInfoName = signal('');
  otherInfoName = signal('');
  sentSms = signal('');
  timerExist = signal(false);
  displayTimer = signal('');
  smsLoading = signal(false);
  qrLoading = signal(false);
  phoneResponse = signal(false);

  // Non-signal state
  bankAccId = '';
  bankAccNo = '';
  microFormData: FormData = new FormData();
  isADPMarketPlaceUser = false;
  selectedBusiness = '';
  qrCodeLink = '';
  bankStatementFile: File | undefined;
  selectedFileNames: string[] = [];
  timer: number;
  private timerSubscription: Subscription;
  private pusherChannels: Channel[] = [];
  private qrDialogRef: MatDialogRef<QrCodeScannerModalV4Component> | undefined;

  uploadFromPhoneSuccessIds: IMicroDepositQrLinks = {
    govId: undefined,
    bankStatement: undefined,
    businessInfo: undefined,
    otherInfo: undefined
  };

  get uploadFromPhoneItems() {
    return [
      {
        key: 'govId',
        label: 'Government ID',
        entry: this.uploadFromPhoneSuccessIds.govId
      },
      {
        key: 'bankStatement',
        label: 'Bank Statement',
        entry: this.uploadFromPhoneSuccessIds.bankStatement
      },
      {
        key: 'businessInfo',
        label: 'Business Info',
        entry: this.uploadFromPhoneSuccessIds.businessInfo
      },
      {
        key: 'otherInfo',
        label: 'Other Info',
        entry: this.uploadFromPhoneSuccessIds.otherInfo
      }
    ];
  }

  private readonly PUSHER_CHANNEL_PREFIX = 'micro-deposit-document-';
  private readonly PUSHER_EVENT_PREFIX = 'micro-deposit-document-event-';

  ngOnInit(): void {
    this.initForm();
    this.processADPUserDetails();
    this.setBankAccData();
    if (this.datas.selectedBusiness) {
      this.selectedBusiness = this.datas.selectedBusiness;
    }
    this.restoreUploadedFiles();
    this.destroyRef.onDestroy(() => {
      this.pusherChannels.forEach((ch) => ch.unsubscribe());
      this.timerSubscription?.unsubscribe();
    });
  }

  private initForm(): void {
    this.microDepositForm = this.fb.group({
      bankName: [''],
      bankAccName: [''],
      bankAccNumber: [''],
      routingNumber: [''],
      govId: ['', [Validators.required]],
      bankStatement: ['', [Validators.required]]
    });
  }

  private processADPUserDetails(): void {
    this.adpService.adpUserDetails
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (!res) return;
        this.isADPMarketPlaceUser = res.adpMarketPlaceUser === 1;
        if (this.isADPMarketPlaceUser) {
          this.microDepositForm.controls.govId.clearValidators();
          this.microDepositForm.controls.bankStatement.clearValidators();
          this.microDepositForm.controls.govId.updateValueAndValidity();
          this.microDepositForm.controls.bankStatement.updateValueAndValidity();
        }
      });
  }

  private setBankAccData(): void {
    this.isLoading.set(true);
    this.bankAccService
      .microDepositDetailsById(this.datas.encrypted_bankacc_id)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
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
          this.isKycVerified.set(res.data.kycKybInfo.kycStatus);
          this.businessList.set(res.data.kycKybInfo.kybRecords);

          if (this.businessList().length > 0) {
            this.selectedBusiness =
              this.datas.selectedBusiness ?? this.businessList()[0].enc_id;
            this.microFormData.append(
              'kyb_reference_id',
              this.selectedBusiness
            );
          }

          if (this.isKycVerified()) {
            this.microDepositForm.controls.govId.clearValidators();
            this.microDepositForm.controls.govId.updateValueAndValidity();
            this.microFormData.append('use_kyc', 'true');
          } else {
            this.microDepositForm.controls.govId.addValidators([
              Validators.required
            ]);
            this.microDepositForm.controls.govId.updateValueAndValidity();
          }
        }

        if (
          this.datas.selectedBusiness &&
          this.datas.uploadedFiles?.bankStatement
        ) {
          this.continue();
        }
      });
  }

  private restoreUploadedFiles(): void {
    if (!this.datas.uploadedFiles) return;
    const { bankStatement, selectedFileNames } = this.datas.uploadedFiles;
    if (selectedFileNames) {
      this.selectedFileNames = [...selectedFileNames];
    }
    if (bankStatement) {
      this.bankStatementFile = bankStatement;
      this.bankStatementName.set(bankStatement.name);
      this.microFormData.append('bankStatement', bankStatement);
      this.microDepositForm.controls.bankStatement.setValue(bankStatement);
    }
  }

  fileInput(
    event: Event,
    documentType: 'govId' | 'bankingStatement' | 'bankingInfo' | 'otherInfo'
  ): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (this.selectedFileNames.includes(file.name)) {
      this.alertService.infoAlert({
        content: 'This file has already been selected, please choose a different file.',
        close: true,
        timeout: 2000
      });
      input.value = '';
      return;
    }

    this.selectedFileNames.push(file.name);

    switch (documentType) {
      case 'govId':
        this.microFormData.append('govId', file);
        this.govIdName.set(file.name);
        this.microDepositForm.controls.govId.setValue(file);
        break;
      case 'bankingStatement':
        this.microFormData.append('bankStatement', file);
        this.bankStatementName.set(file.name);
        this.bankStatementFile = file;
        this.microDepositForm.controls.bankStatement.setValue(file);
        break;
      case 'bankingInfo':
        this.microFormData.append('businessInfo1', file);
        this.businessInfoName.set(file.name);
        break;
      case 'otherInfo':
        this.microFormData.append('businessInfo2', file);
        this.otherInfoName.set(file.name);
        break;
      default:
        break;
    }

    // Reset input so same file can be re-selected
    input.value = '';
  }

  removeFile(
    documentType: 'govId' | 'bankingStatement' | 'bankingInfo' | 'otherInfo',
    fileInput: HTMLInputElement
  ): void {
    switch (documentType) {
      case 'govId': {
        const name = this.govIdName();
        this.selectedFileNames = this.selectedFileNames.filter((f) => f !== name);
        this.govIdName.set('');
        this.microFormData.delete('govId');
        this.microDepositForm.controls.govId.setValue(undefined);
        break;
      }
      case 'bankingStatement': {
        const name = this.bankStatementName();
        this.selectedFileNames = this.selectedFileNames.filter((f) => f !== name);
        this.bankStatementName.set('');
        this.bankStatementFile = undefined;
        this.microFormData.delete('bankStatement');
        this.microDepositForm.controls.bankStatement.setValue(null);
        break;
      }
      case 'bankingInfo': {
        const name = this.businessInfoName();
        this.selectedFileNames = this.selectedFileNames.filter((f) => f !== name);
        this.businessInfoName.set('');
        this.microFormData.delete('businessInfo1');
        break;
      }
      case 'otherInfo': {
        const name = this.otherInfoName();
        this.selectedFileNames = this.selectedFileNames.filter((f) => f !== name);
        this.otherInfoName.set('');
        this.microFormData.delete('businessInfo2');
        break;
      }
    }
    fileInput.value = '';
  }

  getSelectedBusiness(selectedBusiness: string): void {
    if (!selectedBusiness) return;
    this.selectedBusiness = selectedBusiness;
    if (this.microFormData.has('kyb_reference_id')) {
      this.microFormData.delete('kyb_reference_id');
    }
    this.microFormData.append('kyb_reference_id', selectedBusiness);
  }

  continue(): void {
    this.microDepositForm.markAllAsTouched();

    if (this.microDepositForm.invalid && !this.phoneResponse()) {
      return;
    }

    this.isSubmitting.set(true);

    const payload = this.phoneResponse()
      ? {
          bankAccountId: this.bankAccId,
          attachments: this.documentsUploadedFromPhone,
          kyb_reference_id: this.selectedBusiness,
          use_kyc: this.isKycVerified()
        }
      : this.microFormData;

    this.bankAccService
      .microDeposit(payload)
      .pipe(
        catchError((error) => {
          if (error.error?.errorCode === 10021) {
            const alert = this.alertService.failedAlert({
              content:
                "The bank account holder name doesn't match the selected business name. Please update the account holder name to match the business name and try again.",
              doneMsg: 'Update',
              isCancel: true
            });
            alert.afterClosed().subscribe((res) => {
              if (res) {
                const record = this.businessList().find(
                  (r) => r.enc_id === this.selectedBusiness
                );
                this.dialogRef.close({
                  errorCode: 10021,
                  bankData: this.datas,
                  bankAccId: this.bankAccId,
                  selectedBusiness: this.selectedBusiness,
                  businessName: record?.business_name ?? '',
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
        }),
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          const response = res as {
            success: boolean;
            data: string;
            message?: string;
          };
          if (response?.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.dataTableService.setRefreshStatus(true);
            this.bankAccService.bancAcEvents.next({
              message: 'MD Request',
              bankAcId: this.datas.encrypted_bankacc_id
            });
            this.dialogRef.close(true);
            this.alertService.successAlert({
              content: response.message,
              close: true,
              timeout: 1500
            });
          }
        }
      });
  }

  uploadFromPhoneAction(requestType: 'sms' | 'qr'): void {
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
    this.smsLoading.set(true);
    this.bankAccService
      .uploadFromPhone(data)
      .pipe(
        finalize(() => this.smsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.startTimer(res.data.timer.diff);
            this.qrCodeLink = res.data.data.link;
            this.clearLink();
            this.sentSms.set(res.data.data.phoneNumber);
            this.subscribePusher(res.data.data.id);
          } else {
            this.startTimer(res.errorMsg);
          }
        },
        error: (error) => this.startTimer(error.error.errorMsg)
      });
  }

  openQrCodeModal(): void {
    const openModal = (link: string) =>
      this.dialog.open(QrCodeScannerModalV4Component, {
        width: '322px',
        panelClass: 'paddingless-modal-rounded',
        data: { link }
      });

    if (this.qrCodeLink) {
      this.qrDialogRef = openModal(this.qrCodeLink);
      return;
    }

    this.qrLoading.set(true);
    this.bankAccService
      .uploadFromPhone({
        requestType: 'qr',
        bankAccountNumber: this.bankAccNo,
        bankAccountId: this.bankAccId,
        documentType: [
          'governmentId',
          'bankingStatement',
          'businessInfo',
          'otherInfo'
        ]
      })
      .pipe(
        finalize(() => this.qrLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.qrCodeLink = res.data.data.link;
          this.qrDialogRef = openModal(res.data.data.link);
          this.clearLink();
          this.subscribePusher(res.data.data.id);
        }
      });
  }

  private documentsUploadedFromPhone: IDocumentInfo[] = [];

  private subscribePusher(uuId: string): void {
    const channelName = this.PUSHER_CHANNEL_PREFIX + uuId;
    const eventName = this.PUSHER_EVENT_PREFIX + uuId;
    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(eventName, (data: IMicroDepositPusherResponse) => {
          this.phoneResponse.set(true);
          this.documentsUploadedFromPhone = data.document_info;
          this.qrDialogRef?.close();
          data.document_info.forEach((doc) => {
            if (doc.document_type === 'govId') {
              this.govIdName.set(doc.document_name);
              this.uploadFromPhoneSuccessIds.govId = doc;
            } else if (doc.document_type === 'bankStatement') {
              this.bankStatementName.set(doc.document_name);
              this.uploadFromPhoneSuccessIds.bankStatement = doc;
            } else if (doc.document_type === 'businessInfo1') {
              this.businessInfoName.set(doc.document_name);
              this.uploadFromPhoneSuccessIds.businessInfo = doc;
            } else if (doc.document_type === 'businessInfo2') {
              this.otherInfoName.set(doc.document_name);
              this.uploadFromPhoneSuccessIds.otherInfo = doc;
            }
          });
        })
    );
  }

  private startTimer(time: number): void {
    this.timer = time;
    this.timerSubscription = interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.timer > 0) {
          this.timerExist.set(true);
          this.timer -= 1;
          const h = Math.floor(this.timer / 3600);
          const m = Math.floor((this.timer % 3600) / 60);
          const s = this.timer % 60;
          this.displayTimer.set(
            `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
          );
        } else {
          this.timerExist.set(false);
          this.timerSubscription?.unsubscribe();
        }
      });
  }

  private clearLink(): void {
    setTimeout(() => {
      this.qrCodeLink = '';
    }, 300_000); // 5 minutes
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
