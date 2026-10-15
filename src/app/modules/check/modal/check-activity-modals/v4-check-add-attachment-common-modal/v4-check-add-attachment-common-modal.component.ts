import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog
} from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, interval } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  LucideAngularModule,
  X,
  Upload,
  Trash2,
  Smartphone,
  Send,
  QrCode,
  CircleAlert,
  CircleCheck,
  ExternalLink
} from 'lucide-angular';
import { Channel } from 'pusher-js';

import { CheckService } from 'src/app/shared/service/check/check.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { PusherService } from 'src/app/core/services/pusher.service';
import { IPusherEvent } from 'src/app/modules/auth/model/pusher';
import { IGetAttachment } from 'src/app/models/common';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { QrCodeScannerModalV4Component } from 'src/app/modules/payments/shared/components/modals/qr-code-scanner-modal/v4/qr-code-scanner-modal-v4.component';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonInputFieldV4Component } from 'src/app/shared/V4/common-input-field-v4/common-input-field.component-v4';
import { NgxMaskDirective } from 'ngx-mask';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-v4-check-add-attachment-common-modal',
  templateUrl: './v4-check-add-attachment-common-modal.component.html',
  styleUrls: ['./v4-check-add-attachment-common-modal.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass,
    LucideAngularModule,
    CommonButtonV4Component,
    CommonInputFieldV4Component,
    DatePipe,
    NgxMaskDirective,
    MatTooltipModule
  ]
})
export class V4CheckAddAttachmentCommonModalComponent
  implements OnInit, OnDestroy
{
  public data = inject(MAT_DIALOG_DATA);
  public dialogRef = inject(
    MatDialogRef<V4CheckAddAttachmentCommonModalComponent>
  );
  private checkService = inject(CheckService);
  private sharedService = inject(SharedService);
  private walletService = inject(WalletService);
  private alertService = inject(V4AlertService);
  private headerService = inject(HeaderService);
  private matDialog = inject(MatDialog);
  private pusherService = inject(PusherService);
  private localStorageService = inject(LocalStorageService);
  private destroyRef = inject(DestroyRef);

  // Lucide icons
  readonly XIcon = X;
  readonly UploadIcon = Upload;
  readonly Trash2Icon = Trash2;
  readonly SmartphoneIcon = Smartphone;
  readonly SendIcon = Send;
  readonly QrCodeIcon = QrCode;
  readonly CircleAlertIcon = CircleAlert;
  readonly CircleCheckIcon = CircleCheck;
  readonly ExternalLinkIcon = ExternalLink;

  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  image: File[] = [];
  listData: any[] = [];
  checkId: string | number;
  isRefresh: boolean;
  success = false;
  loading = false;
  submitting = false;
  hideDeleteBtn = false;
  attachmentDeletingId: false | string | number = false;
  pusherChannels: Channel[] = [];
  timerExist = false;
  displayTimer: string;
  timer: number;
  timerSubscription: Subscription;

  qrDialogRef: MatDialogRef<QrCodeScannerModalV4Component> | undefined;

  acceptedFormat = '.pdf,.txt,.docx,.doc,.csv,.xls,.xlsx,rtf';
  nonCheckAcceptedFormat =
    '.pdf,.txt,.docx,.doc,.xls,rtf,.xlxs,.csv,.jped,.png,';
  customAcceptedFormat = '.pdf';

  phoneInput = new FormControl('', {
    validators: [Validators.required, ValidationService.phoneNumberValidator],
    nonNullable: true
  });

  showPhoneInput = false;
  phoneNumberSending = false;
  previousPhoneNumber: string;
  sendSuccessfully = false;
  isQRCodeLoading = false;
  autoAttachmentForCheckMail = false;
  checkMode = true;
  zilPaymentId: string | number;
  billsMode = false;
  internationalPaymentMode = false;
  billPaymentId: string | number;
  allowAttachFromPhone = false;
  isWalletCheckMail = false;
  groupPaymentsAttachments: File[] = [];
  removeSubject = new Subject<boolean>();
  validateFileSize = false;

  // Drag-drop state
  isDragging = false;
  selectedFileName = '';

  // File input reference
  private fileInput: HTMLInputElement;

  PUSHER_CHANNEL_NAME_PREFIX = 'check-attachment-' as const;
  PUSHER_EVENT_NAME_PREFIX = 'check-attachment-event-' as const;

  ngOnInit(): void {
    this.dialogRef.disableClose = true;
    this.validateFileSize = !!this.data?.validateFileSize;

    if (this.data.paymentType === 'wallet_check_mail') {
      this.isWalletCheckMail = true;
    }

    if (this.data.mode === 'international_payments') {
      this.internationalPaymentMode = true;
      this.checkMode = false;
      this.zilPaymentId = this.data.id;
    } else if (this.data.mode === 'zil_payments') {
      this.checkMode = false;
      this.zilPaymentId = this.data.id;
    } else if (this.data.mode === 'bills') {
      // Bill-payment attachments live under /bills/{id}/attachments.
      // Keep checkMode off so the template's non-check branch renders and
      // skip the phone-upload flow (that endpoint requires a checkId).
      this.billsMode = true;
      this.checkMode = false;
      this.billPaymentId = this.data.id;
    } else {
      this.checkId = this.data.id ? this.data.id : 0;
      this.allowAttachFromPhone = true;
    }

    if (this.data.mode === 'group_payments') {
      this.acceptedFormat = '.pdf';
      if (this.data.existingData) {
        this.groupPaymentsAttachments = this.data.existingData;
      }
    } else {
      this.loadAttachment();
    }

    this.loadExistingAttachments();

    if (
      this.headerService.autoAttachmentSetForCheckMailing === true &&
      this.headerService.autoAttachmentSetForECheck === true &&
      this.headerService.autoAttachmentSetForAch === true
    ) {
      this.autoAttachmentForCheckMail = false;
    } else {
      this.autoAttachmentForCheckMail = true;
    }

    if (this.data.billId) {
      this.getBillAttachment(this.data.billId);
    }

    const userPhone = this.localStorageService.getItem('phone');
    const noCountryCode = userPhone?.slice(
      userPhone ? userPhone.length - 10 : 0,
      userPhone?.length
    );
    if (noCountryCode !== 'null' && noCountryCode) {
      this.phoneInput.setValue(noCountryCode);
    }

    this.attachmentAddedFromPhone();
  }

  get currentAcceptedFormat(): string {
    if (this.isWalletCheckMail) {
      return this.customAcceptedFormat;
    }
    return this.checkMode ? this.acceptedFormat : this.nonCheckAcceptedFormat;
  }

  get phoneNumberButton(): string {
    if (this.phoneNumberSending) {
      return 'Sending...';
    } else if (
      this.previousPhoneNumber === this.phoneInput.value &&
      this.previousPhoneNumber
    ) {
      return 'Resend';
    }
    return 'Send Link';
  }

  loadExistingAttachments(): void {
    if (this.data?.id === 0 && this.data?.existingData) {
      this.listData = this.data.existingData;
    }
  }

  attachmentAddedFromPhone(): void {
    const userId = this.localStorageService.getItem('userId');
    const channelName = `attachment-from-phone-${userId}`;
    const eventName = 'attachment-from-phone-event';
    this.pusherService
      .getEvent(channelName, eventName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: IPusherEvent) => {
        if (res?.event?.data?.user_id === userId) {
          this.loadAttachment(true);
        }
      });
  }

  loadAttachment(addedFromPhone?: boolean): void {
    if (this.billsMode) {
      if (!this.billPaymentId) return;
      this.sharedService
        .getAttachment('bills', this.billPaymentId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.success) this.listData = res.data;
        });
      return;
    }
    if (
      (<unknown>this.checkId === 0 || this.checkId === '0') &&
      !addedFromPhone
    )
      return;
    if (this.data.existingData) {
      this.listData = this.data.existingData;
    }
    if (this.checkMode) {
      this.checkService
        .getCheckAttachment(this.checkId as string)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          this.listData = res.data;
        });
    } else if (this.internationalPaymentMode) {
      if (!this.zilPaymentId) return;
      this.walletService
        .getAttachmentsInternationalPayment(this.zilPaymentId as string)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.success) this.listData = res.data;
        });
    } else {
      if (this.zilPaymentId === 0) return;
      this.sharedService
        .getAttachment('zil-payments', this.zilPaymentId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          this.listData = res.data;
        });
    }
  }

  getBillAttachment(billId: string): void {
    this.sharedService
      .getAttachment('bills', billId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data?.success) {
          for (let i = 0; i < data.data.length; i += 1) {
            const item = data.data[i];
            if (!this.billAttachmentExists(item.id)) {
              item.billAttach = true;
              if (!item.encrypted_id && item.id) {
                item.encrypted_id = item.encrypted_id?.toString();
              }
              this.listData.push(item as IGetAttachment);
            }
          }
        }
      });
  }

  billAttachmentExists(attachId: string | number): boolean {
    return this.listData.some((item) => item.id === attachId);
  }

  // --- Drag-and-drop ---

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFileSelection(input.files[0]);
      input.value = '';
    }
  }

  triggerFileInput(): void {
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = this.currentAcceptedFormat;
      this.fileInput.addEventListener('change', (e) =>
        this.onFileInputChange(e)
      );
    }
    this.fileInput.accept = this.currentAcceptedFormat;
    this.fileInput.click();
  }

  handleFileSelection(file: File): void {
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const acceptedFormats = this.currentAcceptedFormat
      .split(',')
      .map((format) => format.trim().toLowerCase());

    if (!acceptedFormats.includes(fileExtension)) {
      this.alertService.warningAlert({
        content: `File format ${fileExtension} is not supported. Please select a file with one of the following formats: ${this.currentAcceptedFormat}`
      });
      return;
    }

    // Check file size limit (10MB) only when enabled by config or in group_payments mode
    if (this.validateFileSize || this.data.mode === 'group_payments') {
      const maxFileSizeInBytes = 10 * 1024 * 1024; // 10MB
      if (file.size > maxFileSizeInBytes) {
        this.alertService.warningAlert({
          content: 'Maximum file size is 10MB. Please select a smaller file.'
        });
        return;
      }
    }

    this.selectedFileName = file.name;
    this.image = [file];

    if (this.data.mode === 'group_payments') {
      this.storeAttachment(file);
      return;
    }

    this.onSubmit();
  }

  onSubmit(): void {
    if (!this.image.length) {
      this.alertService.warningAlert({ content: 'Please choose a file' });
      return;
    }

    if (this.listData.length >= 5) {
      this.alertService.warningAlert({
        content: 'A maximum of 5 attachments is allowed.'
      });
      return;
    }

    this.submitting = true;
    this.hideDeleteBtn = true;

    if (this.billsMode) {
      const formData = new FormData();
      formData.append('image', this.image[0]);
      this.sharedService
        .addAttachment('bills', this.billPaymentId, formData)
        .pipe(
          finalize(() => {
            this.submitting = false;
            this.hideDeleteBtn = false;
            this.selectedFileName = '';
            this.image = [];
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.success = true;
            if (this.listData.length === 0) this.isRefresh = true;
            this.loadAttachment();
          }
        });
      return;
    }

    if (this.checkMode) {
      this.checkService
        .addCheckAttachment(this.checkId, this.image[0])
        .pipe(
          finalize(() => {
            this.submitting = false;
            this.hideDeleteBtn = false;
            this.selectedFileName = '';
            this.image = [];
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.success = true;
            if (this.listData.length === 0) this.isRefresh = true;
            if (<unknown>this.checkId === 0 || this.checkId === '0') {
              this.listData.push(res.data);
            }
            this.loadAttachment();
          }
        });
    } else if (this.internationalPaymentMode) {
      this.walletService
        .addAttachmentInternationalPayment(this.zilPaymentId as string, { image: this.image[0] })
        .pipe(
          finalize(() => {
            this.submitting = false;
            this.hideDeleteBtn = false;
            this.selectedFileName = '';
            this.image = [];
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.success = true;
            if (this.listData.length === 0) this.isRefresh = true;
            this.loadAttachment();
          }
        });
    } else {
      this.sharedService
        .addNonCheckAttachment(this.image[0], this.zilPaymentId)
        .pipe(
          finalize(() => {
            this.submitting = false;
            this.hideDeleteBtn = false;
            this.selectedFileName = '';
            this.image = [];
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((res) => {
          if (res.success) {
            this.success = true;
            if (this.listData.length === 0) this.isRefresh = true;
            if (this.zilPaymentId === 0) {
              this.listData.push(res.data);
            }
            this.loadAttachment();
          }
        });
    }
  }

  openAttachment(
    id: string | number,
    encrypId: string | boolean,
    isBillAttach?: boolean | string
  ): void {
    if (this.billsMode) {
      const attachmentId = (encrypId as string) || (id as string);
      this.sharedService
        .openAttachment('bills', this.billPaymentId, attachmentId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.success) window.open(res.data);
        });
      return;
    }
    if (isBillAttach) {
      const item = this.listData.find((attachment) => attachment.id === id);
      if (item && item.encrypted_id) {
        this.openBillAttachment(item.encrypted_id);
        return;
      }
    }
    if (this.checkMode) {
      this.checkService
        .openCheckAttachment(this.checkId as string, id as string)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res.success) {
            window.open(res.data);
          }
        });
    } else if (this.internationalPaymentMode) {
      this.walletService
        .getAttachmentByIdInternationalPayment(this.zilPaymentId as string, encrypId as string)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.success) window.open(res.data.public_url);
        });
    } else {
      this.sharedService
        .openAttachment('zil-payments', this.zilPaymentId, encrypId as string)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((res) => {
          if (res?.success) {
            window.open(res.data);
          }
        });
    }
  }

  openBillAttachment(id: string): void {
    this.sharedService
      .openAttachment('bills', this.data.billId, id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        if (data?.success) {
          window.open(data.data);
        }
      });
  }

  deleteAttachment(id: string | number, index: number, encId?: string): void {
    if (this.attachmentDeletingId) return;

    const confirm = this.alertService.confirmAlert({
      content: 'This attachment will be deleted permanently',
      doneMsg: 'Yes, Delete it!',
      cancelMsg: 'No, Cancel!'
    });

    confirm
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (!result) return;

        if (this.data?.id === 0) {
          this.listData.splice(index, 1);
          return;
        }

        this.attachmentDeletingId = id;
        this.hideDeleteBtn = true;

        if (this.billsMode) {
          const attachmentId = encId || (id as string);
          this.sharedService
            .deleteAttachment('bills', this.billPaymentId, attachmentId)
            .pipe(
              finalize(() => {
                this.attachmentDeletingId = false;
                this.hideDeleteBtn = false;
              }),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((res) => {
              if (res?.success) {
                this.listData.splice(index, 1);
                if (this.listData.length === 0) this.isRefresh = true;
                this.loadAttachment();
              }
            });
          return;
        }

        if (this.checkMode) {
          this.checkService
            .deleteCheckAttachment(this.checkId as string, id as string)
            .pipe(
              finalize(() => {
                this.attachmentDeletingId = false;
                this.hideDeleteBtn = false;
              }),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((res) => {
              if (res?.success) {
                this.listData.splice(index, 1);
                if (this.listData.length === 0) this.isRefresh = true;
                this.loadAttachment();
              }
            });
        } else if (this.internationalPaymentMode) {
          this.walletService
            .deleteAttachmentInternationalPayment(this.zilPaymentId as string, encId || '')
            .pipe(
              finalize(() => {
                this.attachmentDeletingId = false;
                this.hideDeleteBtn = false;
              }),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((res) => {
              if (res?.success) {
                this.listData.splice(index, 1);
                if (this.listData.length === 0) this.isRefresh = true;
                this.loadAttachment();
              }
            });
        } else {
          this.sharedService
            .deleteAttachment('zil-payments', this.zilPaymentId, encId)
            .pipe(
              finalize(() => {
                this.attachmentDeletingId = false;
                this.hideDeleteBtn = false;
              }),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((res) => {
              if (res?.success) {
                this.listData.splice(index, 1);
                if (this.listData.length === 0) this.isRefresh = true;
                this.loadAttachment();
              }
            });
        }
      });
  }

  // --- Group payments ---

  storeAttachment(file: File): void {
    this.groupPaymentsAttachments = [...this.groupPaymentsAttachments, file];
    this.selectedFileName = '';
    this.image = [];
  }

  removeAttachment(index: number): void {
    this.groupPaymentsAttachments.splice(index, 1);
  }

  // --- Upload from Phone ---

  togglePhoneInput(): void {
    this.showPhoneInput = !this.showPhoneInput;
  }

  sendPhoneLink(): void {
    this.phoneInput.markAsTouched();
    if (this.phoneInput.invalid) return;

    this.previousPhoneNumber = this.phoneInput.value;
    this.phoneNumberSending = true;
    this.submitPhoneNumber();
  }

  submitPhoneNumber(): void {
    this.checkService
      .checksUploadFromPhoneLink(this.checkId ? this.checkId : 0, {
        documentType: 'checks',
        requestType: 'sms',
        phone: Number(this.phoneInput.value)
      })
      .pipe(
        finalize(() => {
          this.phoneNumberSending = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.sendSuccessfully = true;
            this.headerService.setHeaderValueChanged(true);
            this.startTimer(res.data.timer?.diff);
            this.subscribePusherForAttachments(res.data.data.id as string);
            setTimeout(() => {
              this.sendSuccessfully = false;
            }, 3500);
          } else {
            this.startTimer(res.errorMsg);
          }
        },
        error: (err) => {
          this.startTimer(err.error.errorMsg);
        }
      });
  }

  openQrCodeModal(): void {
    if (this.isQRCodeLoading) return;
    this.isQRCodeLoading = true;
    this.checkId = this.checkId ? this.checkId : 0;
    this.checkService
      .checksUploadFromPhoneLink(this.checkId ? this.checkId : 0, {
        documentType: 'checks',
        requestType: 'qr'
      })
      .pipe(
        finalize(() => {
          this.isQRCodeLoading = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        if (res.success) {
          this.qrDialogRef = this.matDialog.open(QrCodeScannerModalV4Component, {
            width: '380px',
            panelClass: 'paddingless-modal-rounded',
            data: { link: res.data.data.link as string }
          });
          this.subscribePusherForAttachments(res.data.data.id as string);
        }
      });
  }

  subscribePusherForAttachments(typeId: string): void {
    const channelName = this.PUSHER_CHANNEL_NAME_PREFIX + typeId;
    const eventName = this.PUSHER_EVENT_NAME_PREFIX + typeId;
    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(eventName, (res: { document_info: IGetAttachment[] }) => {
          if (res) {
            this.isRefresh = true;
            if (!this.checkId) {
              res.document_info.forEach((attachment) => {
                this.listData.push(attachment);
              });
            } else {
              this.loadAttachment();
            }
            this.qrDialogRef?.close();
          }
        })
    );
  }

  startTimer(time: number): void {
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

  close(): void {
    if (this.submitting || this.attachmentDeletingId) return;
    this.dialogRef.close({
      success: this.success,
      isRefresh: this.isRefresh,
      existingData:
        this.data.mode === 'group_payments'
          ? this.groupPaymentsAttachments
          : this.listData
    });
  }

  ngOnDestroy(): void {
    this.pusherChannels.forEach((channel) => {
      channel.unbind_all();
      channel.unsubscribe();
    });
    this.timerSubscription?.unsubscribe();
  }
}
