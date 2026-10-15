import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { faCircleInfo } from '@fortawesome/pro-regular-svg-icons';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialog
} from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, Subscription, interval } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PusherService } from 'src/app/core/services/pusher.service';
import { IPusherEvent } from 'src/app/modules/auth/model/pusher';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { WalletService } from 'src/app/shared/service/wallet/wallet.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { IGetAttachment } from 'src/app/models/common';
import { MatTooltip } from '@angular/material/tooltip';
import { NgxMaskDirective } from 'ngx-mask';
import { NgStyle, NgClass, NgIf, NgFor, DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faCircleCheck,
  faExternalLink,
  faQrcode,
  faTrash,
  faEnvelope
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { QrCodeScannerModalComponent } from 'src/app/modules/payments/shared/components/modals/qr-code-scanner-modal/qr-code-scanner-modal.component';
import { Channel } from 'pusher-js';
import { DropZoneComponent } from '../../../../../shared/components/drop-zone/drop-zone.component';
import { ICheckAttachmentData } from '../../../model/check';
import { OpenAttachmentModalComponent } from '../../open-attachment-modal/open-attachment-modal.component';
import { IWarningAlert } from '../../../../../models/alert';

const ATTACHMENT_PREVIEW_PLUGIN = 'india-bazaar';

const PREVIEWABLE_EXTENSIONS = new Set([
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'bmp'
]);

@Component({
  selector: 'app-check-add-attachment-common-modal',
  templateUrl: './check-add-attachment-common-modal.component.html',
  styleUrls: ['./check-add-attachment-common-modal.component.scss'],
  standalone: true,
  imports: [
    DropZoneComponent,
    NgStyle,
    NgClass,
    NgIf,
    NgxMaskDirective,
    FontAwesomeModule,
    FormsModule,
    ReactiveFormsModule,
    MatTooltip,
    MatDialogActions,
    NgFor,
    DatePipe,
    CommonButtonV35Component,
    MatDialogClose,
    V35ControlMessageComponent
  ]
})
export class CheckAddAttachmentCommonModalComponent
  implements OnInit, OnDestroy
{
  staticWhiteLabelConditions = StaticWhiteLabelConditions;
  image: File[] = [];
  subscriptions: Subscription[] = [];
  listData: (ICheckAttachmentData | IGetAttachment)[] = [];
  link: string;
  checkId: string | number;
  isRefresh: boolean;
  success = false;
  loading = false;
  hideDeleteBtn = false;
  imagePreview: SafeResourceUrl;
  pusherChannels: Channel[] = [];
  timerExist = false;
  displayTimer: string;
  timer: number;
  timerSubscription: Subscription;

  qrDialogRef: MatDialogRef<QrCodeScannerModalComponent> | undefined =
    undefined;

  acceptedFormat = '.pdf,.txt,.docx,.doc,.csv,.xls,.xlsx,rtf';
  nonCheckAcceptedFormat =
    '.pdf,.txt,.docx,.doc,.xls,rtf,.xlxs,.csv,.jped,.png,';

  phoneInput = new UntypedFormControl('', [
    Validators.required,
    ValidationService.phoneNumberValidator
  ]);

  showPhoneInput: boolean;
  phoneIncr = 0;
  phoneNumberSending: boolean;
  phoneNumberButton: string;
  previousPhoneNumber: string;
  sendSuccessfully = false;
  isQRCodeLoading: boolean = false;
  autoAttachmentForCheckMail = false; // for auto attachment notes
  checkMode = true;
  zilPaymentId: string | number;
  isInternationalPayment = false;
  PUSHER_CHANNEL_NAME_PREFIX = 'check-attachment-' as const;
  PUSHER_EVENT_NAME_PREFIX = 'check-attachment-event-' as const;
  removeSubject = new Subject<boolean>();
  allowAttachFromPhone = false;
  customAcceptedFormat: string = '.pdf';
  isWalletCheckMail: boolean = false;
  groupPaymentsAttachments: File[] = [];
  isAttachmentPreviewEnabled = false;
  validateFileSize = false;

  public data = inject(MAT_DIALOG_DATA);
  private checkService = inject(CheckService);
  private alertService = inject(AlertService);
  private sanitizer = inject(DomSanitizer);
  private sharedService = inject(SharedService);
  private walletService = inject(WalletService);
  private headerService = inject(HeaderService);
  private matDialog = inject(MatDialog);
  private pusherService = inject(PusherService);
  private localStorageService = inject(LocalStorageService);
  public dialogRef = inject(
    MatDialogRef<CheckAddAttachmentCommonModalComponent>
  );

  faCircleCheck = faCircleCheck;
  faCircleInfo = faCircleInfo;
  faQrcode = faQrcode;
  faExternalLink = faExternalLink;
  faTrash = faTrash;
  faEnvelope = faEnvelope;

  ngOnInit(): void {
    this.dialogRef.disableClose = true;
    this.validateFileSize = !!this.data?.validateFileSize;
    if(this.data.paymentType === 'wallet_check_mail'){
      this.isWalletCheckMail = true;
    }
    if (this.data.mode === 'international_payments') {
      this.checkMode = false;
      this.isInternationalPayment = true;
      this.zilPaymentId = this.data.id;
    } else if (this.data.mode === 'zil_payments') {
      this.checkMode = false;
      this.zilPaymentId = this.data.id;
    } else {
      this.checkId = this.data.id ? this.data.id : 0;
      this.allowAttachFromPhone = true;
    }
    if(this.data.mode === 'group_payments'){
      this.acceptedFormat = '.pdf';
      if (this.data.existingData) {
        this.groupPaymentsAttachments = this.data.existingData;
      }
    }else{
      this.loadAttachment();
    }
    this.loadExistingComments();

    if (
      this.headerService.autoAttachmentSetForCheckMailing === true &&
      this.headerService.autoAttachmentSetForECheck === true &&
      this.headerService.autoAttachmentSetForAch === true
    ) {
      /** IF THE AUTO ATTACHMENT IS DISABLE THE NOTE WILL BE APPEAR */
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
    if (noCountryCode !== 'null') {
      this.phoneInput.setValue(noCountryCode);
    }
    this.attachmentAddedFromPhone();
    this.loadPhoneBtnLabel();

    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        if (res) {
          this.isAttachmentPreviewEnabled = res.enabledPlugins.includes(
            ATTACHMENT_PREVIEW_PLUGIN
          );
        }
      })
    );
  }

  get currentAcceptedFormat(){
    if(this.isWalletCheckMail){
      return this.customAcceptedFormat;
    }
    return this.checkMode ? this.acceptedFormat : this.nonCheckAcceptedFormat;
  }

  // Load comments if its from new check
  loadExistingComments() {
    if (this.data?.id === 0 && this.data?.existingData)
      this.listData = this.data.existingData;
  }

  attachmentAddedFromPhone(): void {
    const userId = this.localStorageService.getItem('userId');
    const channelName = `attachment-from-phone-${userId}`;
    const eventName = 'attachment-from-phone-event';
    this.subscriptions.push(
      this.pusherService
        .getEvent(channelName, eventName)
        .subscribe((res: IPusherEvent) => {
          if (res?.event?.data?.user_id === userId) {
            this.loadAttachment(true);
          }
        })
    );
  }

  getPreview(img: File) {
    const reader = new FileReader();
    reader.readAsDataURL(img);
    reader.onload = () => {
      if (this.isValidUrl(reader.result as string)) {
        this.imagePreview = this.sanitizer.bypassSecurityTrustResourceUrl(
          reader.result as string
        );
      }
    };
  }

  /**
   * Validates whether a given string is a valid HTTP or HTTPS URL.Used to prevent security issue.
   * @param {string} url - The string to be validated as a URL.
   * @returns {boolean} - Returns `true` if the URL is valid and uses either the 'http' or 'https' protocol. Otherwise, returns `false`.
   */
  isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (_) {
      return false; // Invalid URL
    }
  }

  onSelect(event: File[]) {
    if (event.length) {
      const selectedFile = event[0];

      if(this.data.mode === 'group_payments'){
        const fileExtension = `.${  selectedFile.name.split('.').pop()?.toLowerCase()}`;
        const acceptedFormats = this.currentAcceptedFormat.split(',').map(format => format.trim().toLowerCase());

        if (!acceptedFormats.includes(fileExtension)) {
          this.alertService.warningAlert({
            content: `File format ${fileExtension} is not supported. Please select a file with one of the following formats: ${this.currentAcceptedFormat}`
          });
          this.onRemove(selectedFile);
          return;
        }
      }

      // Check file size limit (10MB) only when enabled by config or in group_payments mode
      if (this.validateFileSize || this.data.mode === 'group_payments') {
        const maxFileSizeInBytes = 10 * 1024 * 1024; // 10MB
        if (selectedFile.size > maxFileSizeInBytes) {
          this.alertService.warningAlert({
            content: 'Maximum file size is 10MB. Please select a smaller file.'
          });
          this.onRemove(selectedFile);
          this.removeSubject.next(true);
          return;
        }
      }

      this.image[0] = event[0];
      this.getPreview(this.image[0]);
    } else {
      this.image = [];
    }
    if(this.data.mode === 'group_payments' && this.image?.length){
      this.storeAttachment(event[0]);
      return;
    }
    this.onSubmit();
  }

  loadAttachment(addedFromPhone?: boolean) {
    if (
      (<unknown>this.checkId === 0 || this.checkId === '0') &&
      !addedFromPhone
    )
      return;
    if (this.data.existingData) {
      this.listData = this.data.existingData;
    }
    if (this.checkMode) {
      this.subscriptions.push(
        this.checkService
          .getCheckAttachment(this.checkId as string)
          .subscribe((res) => {
            this.listData = res.data;
          })
      );
    } else if (this.isInternationalPayment) {
      if (!this.zilPaymentId) return;
      this.walletService
        .getAttachmentsInternationalPayment(this.zilPaymentId as string)
        .subscribe((res) => {
          this.listData = res.data.map((item) => ({
            ...item,
            fileName: item.file_name,
            billAttach: false
          }));
        });
    } else {
      if (this.zilPaymentId === 0) return;
      this.sharedService
        .getAttachment('zil-payments', this.zilPaymentId)
        .subscribe((res) => {
          this.listData = res.data;
        });
    }
  }

  getBillAttachment(billId: string) {
    this.subscriptions.push(
      this.sharedService.getAttachment('bills', billId).subscribe((data) => {
        if (data?.success) {
          for (let i = 0; i < data.data.length; i += 1) {
            const item = data.data[i];
            if (!this.billAttachmentExisit(item.id)) {
              item.billAttach = true;
              if (!item.encrypted_id && item.id) {
                item.encrypted_id = item.encrypted_id.toString();
              }
              this.listData.push(item as IGetAttachment);
            }
          }
        }
      })
    );
  }

  billAttachmentExisit(attachId: string | number) {
    for (let i = 0; i < this.listData.length; i += 1) {
      const item = this.listData[i];
      if (item.id === attachId) {
        return true;
      }
    }
    return false;
  }

  /**
   * @description Opens an attachment based on the provided parameters.
   * @param id - The ID of the attachment.
   * @param encrypId The encrypted ID of the attachment.
   * @param isBillAttach -Specifies if the attachment is a bill
   *
   */
  openAttachment(
    id: string | number,
    encrypId: string | boolean,
    isBillAttach?: boolean | string
  ) {
    if (isBillAttach) {
      // For bill attachments, find the item and use its encrypted_id
      const item = this.listData.find(attachment => attachment.id === id);
      if (item && item.encrypted_id) {
        this.openBillAttachment(item.encrypted_id);
        return;
      }
    }
    if (this.checkMode) {
      this.subscriptions.push(
        this.checkService
          .openCheckAttachment(this.checkId as string, id as string)
          .subscribe((res) => {
            this.link = res.data;
            if (res.success) {
              this.showAttachment(this.link);
            }
          })
      );
    } else if (this.isInternationalPayment) {
      this.subscriptions.push(
        this.walletService
          .getAttachmentByIdInternationalPayment(this.zilPaymentId as string, encrypId as string)
          .subscribe((res: any) => {
            if (res?.success && res?.data) {
              const link =
                typeof res.data === 'string' ? res.data : res.data?.public_url;
              this.showAttachment(link);
            }
          })
      );
    } else {
      this.subscriptions.push(
        this.sharedService
          .openAttachment('zil-payments', this.zilPaymentId, encrypId as string)
          .subscribe((res) => {
            if (res?.success) {
              this.showAttachment(res.data);
            }
          })
      );
    }
  }

  openBillAttachment(id: string) {
    this.subscriptions.push(
      this.sharedService
        .openAttachment('bills', this.data.billId, id)
        .subscribe((data) => {
          if (data?.success) {
            this.showAttachment(data.data);
          }
        })
    );
  }

  /**
   * @description Shows the attachment in a preview modal on top of the current
   * modal when the in-app preview is enabled for the account and the browser can
   * render the file in an iframe (PDF / image). Every other case - other file
   * types (docx, xls, csv...) or preview not enabled - opens in a new tab.
   * @param link - The signed URL of the attachment.
   */
  private showAttachment(link: string) {
    if (!link) return;

    // Signed URLs carry a query string, strip it before reading the extension
    const extension = link.split('?')[0].split('.').pop()?.toLowerCase() ?? '';

    if (
      this.isAttachmentPreviewEnabled &&
      PREVIEWABLE_EXTENSIONS.has(extension)
    ) {
      this.matDialog.open(OpenAttachmentModalComponent, {
        maxWidth: '1100px',
        width: '95%',
        height: '90%',
        data: { link }
      });
      return;
    }

    const urlLoaded = window.open(link);
    if (
      !urlLoaded ||
      urlLoaded.closed ||
      typeof urlLoaded.closed === 'undefined'
    ) {
      const warning: IWarningAlert = {
        title: 'Error',
        content:
          'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window'
      };
      this.alertService.warningAlert(warning);
    }
  }

  deleteAttachment(id: string | number, index: number, encId?: string) {
    const data = {
      content: 'This attachment will be deleted permanently'
    };

    const confirm = this.alertService.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        if (this.data?.id === 0) {
          this.listData.splice(index, 1);
          return;
        }

        this.hideDeleteBtn = true;
        if (this.checkMode) {
          this.subscriptions.push(
            this.checkService
              .deleteCheckAttachment(this.checkId as string, id as string)
              .pipe(
                finalize(() => {
                  this.hideDeleteBtn = false;
                })
              )
              .subscribe((res) => {
                if (res?.success) {
                  this.listData.splice(index, 1);
                  if (this.listData.length === 0) {
                    this.isRefresh = true;
                  }
                  this.loadAttachment();
                }
              })
          );
        } else if (this.isInternationalPayment) {
          const attachmentData = this.listData.find((item) => item.id === id);
          this.subscriptions.push(
            this.walletService
              .deleteAttachmentInternationalPayment(this.zilPaymentId as string, attachmentData?.encrypted_id ?? '' as string)
              .pipe(finalize(() => { this.hideDeleteBtn = false; }))
              .subscribe((res) => {
                if (res?.success) {
                  this.listData.splice(index, 1);
                  if (this.listData.length === 0) this.isRefresh = true;
                  this.loadAttachment();
                }
              })
          );
        } else {
          this.subscriptions.push(
            this.sharedService
              .deleteAttachment('zil-payments', this.zilPaymentId, encId)
              .pipe(
                finalize(() => {
                  this.hideDeleteBtn = false;
                })
              )
              .subscribe((res) => {
                if (res?.success) {
                  this.listData.splice(index, 1);
                  if (this.listData.length === 0) {
                    this.isRefresh = true;
                  }
                  this.loadAttachment();
                }
              })
          );
        }
      }
    });
  }

  onRemove(event: File | File[]) {
    this.image.splice(this.image.indexOf(event as File), 1);
  }

  storeAttachment(event: File) {
    this.groupPaymentsAttachments = [...this.groupPaymentsAttachments, event];
    this.removeSubject.next(true);
  }

  onSubmit() {
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

    this.loading = true;
    this.hideDeleteBtn = true;
    if (this.checkMode) {
      this.subscriptions.push(
        this.checkService
          .addCheckAttachment(this.checkId, this.image[0])
          .pipe(
            finalize(() => {
              this.loading = false;
              this.hideDeleteBtn = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.success = true;

              if (this.listData.length === 0) {
                this.isRefresh = true;
              }

              if ((this.checkId as unknown) === 0 || this.checkId === '0') {
                this.listData.push(res.data);
              }

              this.loadAttachment();
              this.removeSubject.next(true);
            }
          })
      );
    } else if (this.isInternationalPayment) {
      this.subscriptions.push(
        this.walletService
          .addAttachmentInternationalPayment(this.zilPaymentId as string, { image: this.image[0] })
          .pipe(finalize(() => { this.loading = false; this.hideDeleteBtn = false; }))
          .subscribe((res) => {
            if (res.success) {
              this.success = true;
              if (this.listData.length === 0) this.isRefresh = true;
              this.loadAttachment();
              this.removeSubject.next(true);
            }
          })
      );
    } else {
      this.subscriptions.push(
        this.sharedService
          .addNonCheckAttachment(this.image[0], this.zilPaymentId)
          .pipe(
            finalize(() => {
              this.loading = false;
              this.hideDeleteBtn = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.success = true;

              if (this.listData.length === 0) {
                this.isRefresh = true;
              }

              if (this.zilPaymentId === 0) {
                this.listData.push(res.data);
              }

              this.loadAttachment();
              this.removeSubject.next(true);
            }
          })
      );
    }
  }

  addWithMobileDevice(): void {
    this.showPhoneInput = true;
    this.phoneInput.markAsTouched();
    this.loadPhoneBtnLabel();
    if (this.phoneInput.invalid) {
      this.phoneIncr += 1;
      return;
    }
    this.previousPhoneNumber = this.phoneInput.value;
    if (this.phoneIncr !== 0) {
      this.phoneNumberSending = true;
      this.loadPhoneBtnLabel();
      this.submitPhoneNumber();
    }
    this.phoneIncr += 1;
  }

  submitPhoneNumber(): void {
    this.subscriptions.push(
      this.checkService
        .checksUploadFromPhoneLink(this.checkId ? this.checkId : 0, {
          documentType: 'checks',
          requestType: 'sms',
          phone: this.phoneInput.value
        })
        .pipe(
          finalize(() => {
            this.phoneNumberSending = false;
            this.loadPhoneBtnLabel();
          })
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
        })
    );
  }

  phoneNumChange(): void {
    this.phoneInput.markAsTouched();
    this.loadPhoneBtnLabel();
  }

  loadPhoneBtnLabel(): void {
    if (
      this.previousPhoneNumber === this.phoneInput.value &&
      !this.phoneNumberSending
    ) {
      this.phoneNumberButton = 'Resend';
    } else if (this.phoneNumberSending) {
      this.phoneNumberButton = 'Sending';
    } else if (
      this.showPhoneInput &&
      !this.previousPhoneNumber !== this.phoneInput.value
    ) {
      this.phoneNumberButton = 'Send Link';
    } else {
      this.phoneNumberButton = 'Upload from Phone';
    }
  }

  openQrCodeModal() {
    if (this.isQRCodeLoading) {
      return;
    }
    this.isQRCodeLoading = true;
    const openQrCodeModal = (link: string) =>
      this.matDialog.open(QrCodeScannerModalComponent, {
        width: '322px',
        height: '445px',
        data: {
          link
        }
      });
    this.checkId = this.checkId ? this.checkId : 0;
    this.subscriptions.push(
      this.checkService
        .checksUploadFromPhoneLink(this.checkId ? this.checkId : 0, {
          documentType: 'checks',
          requestType: 'qr'
        })
        .pipe(
          finalize(() => {
            this.isQRCodeLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.qrDialogRef = openQrCodeModal(res.data.data.link as string);
            this.subscribePusherForAttachments(res.data.data.id as string);
          }
        })
    );
  }

  subscribePusherForAttachments(typeId: string) {
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

  close() {
    if(!this.loading){
      this.dialogRef.close({
        success: this.success,
        isRefresh: this.isRefresh,
        existingData: this.data.mode === 'group_payments' ? this.groupPaymentsAttachments : this.listData
      });
    }
    
  }

  removeAttachment(i: number) {
    this.groupPaymentsAttachments.splice(i, 1);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
