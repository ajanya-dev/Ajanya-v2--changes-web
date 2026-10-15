import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialog
} from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject, Subscription, interval } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Utils } from 'src/app/data/utils';
import { IGetAttachment } from 'src/app/models/common';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { NgClass } from '@angular/common';
import { CommonButtonV35Component } from '../../../v3/buttons/common-button-v35/common-button-v35.component';
import { DropZoneComponent } from '../../../components/drop-zone/drop-zone.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormControl,
  Validators
} from '@angular/forms';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { MatTooltip } from '@angular/material/tooltip';
import {
  faCircleCheck,
  faCircleInfo,
  faExternalLink,
  faQrcode
} from '@fortawesome/pro-solid-svg-icons';
import { QrCodeScannerModalComponent } from 'src/app/modules/payments/shared/components/modals/qr-code-scanner-modal/qr-code-scanner-modal.component';
import { NgxMaskDirective } from 'ngx-mask';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { Channel } from 'pusher-js';
import { PusherService } from 'src/app/core/services/pusher.service';
import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';

/**
 * @description Modal component for adding attachments.
 */
@Component({
  selector: 'app-add-attachment-modal',
  templateUrl: './add-attachment-modal.component.html',
  styleUrls: ['./add-attachment-modal.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatDialogClose,
    FaIconComponent,
    DropZoneComponent,
    CommonButtonV35Component,
    NgClass,
    NgxMaskDirective,
    ReactiveFormsModule,
    MatTooltip,
    V35ControlMessageComponent
  ]
})
export class AddAttachmentModalComponent implements OnInit, OnDestroy {
  public datas = inject(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<AddAttachmentModalComponent>);
  private shareService = inject(SharedService);
  private alertService = inject(AlertService);
  private sanitizer = inject(DomSanitizer);
  private v3DataTableService = inject(V3DataTableService);
  private matDialog = inject(MatDialog);
  private paymentService = inject(PaymentsService);
  private pusherService = inject(PusherService);
  private localStorageService = inject(LocalStorageService);

  faCircleCheck = faCircleCheck;
  faCircleInfo = faCircleInfo;
  faExternalLink = faExternalLink;

  faQrcode = faQrcode;
  image: File[] = [];
  subscriptions: Subscription[] = [];
  listData: IGetAttachment[] = [];
  link: string;
  pusherChannels: Channel[] = [];
  typeId: string | number;
  type: string;
  isRefreesh: boolean;
  count = 0;
  lengths: number;
  imagePreview: SafeResourceUrl;
  submitting = false;
  deleting: string[] = [];
  fileCountLimit = 5;
  isDeletable: boolean[] = [];
  removeSubject = new Subject();
  showPhoneInput: boolean;
  phoneIncr = 0;
  phoneNumberSending: boolean;
  phoneNumberButton: string;
  previousPhoneNumber: string;
  sendSuccessfully = false;
  isQRCodeLoading = false;
  timerExist = false;
  displayTimer: string;
  timer: number;
  timerSubscription: Subscription;
  isUploadedFromPhone = false;

  qrDialogRef: MatDialogRef<QrCodeScannerModalComponent> | undefined =
    undefined;

  PUSHER_CHANNEL_NAME_PREFIX = 'depositslip-document-' as const;
  PUSHER_EVENT_NAME_PREFIX = 'depositslip-document-event-' as const;

  phoneInput = new UntypedFormControl('', [
    Validators.required,
    ValidationService.phoneNumberValidator
  ]);

  ngOnInit(): void {
    this.typeId = this.datas.id;
    this.type = this.datas.type;
    this.fileCountLimit = this.datas?.limit ?? 5;
    this.getAttachment();
    this.loadPhoneBtnLabel();
    if (this.datas?.id === 0 && this.datas?.existingData) {
      this.listData = this.datas.existingData;
      this.isDeletableAttachment();
    }
    const userPhone = this.localStorageService.getItem('phone');
    const noCountryCode = userPhone?.slice(
      userPhone ? userPhone.length - 10 : 0,
      userPhone?.length
    );
    if (noCountryCode !== 'null') {
      this.phoneInput.setValue(noCountryCode);
    }
  }

  /**
   * @description Sets the preview of the passed in image file.
   * @param img - image file
   */
  getPreview(img: File) {
    const reader = new FileReader();
    reader.readAsDataURL(img);
    reader.onload = () => {
      if (this.isValidUrl(reader.result as string)) {
        this.imagePreview = this.sanitizer.bypassSecurityTrustResourceUrl(reader.result as string);
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

  /**
   * @description Method to invoke when files are added to the drop zone.
   * @param event - event triggered when files are added.
   */
  onSelect(event: File[]) {
    if (event?.length) {
      if (Utils.maxSizeValidator(event[0].size)) {
        this.alertService.failedAlert({ content: 'Max size is 4MB' });
        return;
      }
      this.image[0] = event[0];
      this.getPreview(this.image[0]);
    } else {
      this.image = [];
    }
  }

  /**
   * @description Gets the attachment using type and type ID.
   */
  getAttachment() {
    this.count += 1;
    if (this.typeId === 0) {
      this.listData = this.datas?.attachments;
      return;
    }
    this.subscriptions.push(
      this.shareService
        .getAttachment(this.type, this.typeId)
        .subscribe((res) => {
          this.listData = res.data;
          this.isDeletableAttachment();
          if (this.count === 1) {
            this.lengths = this.listData.length;
          }
        })
    );
  }

  /**
   * @description Opens the selected attachment using type, typeid and id of the item.
   * @param id - ID of the item.
   */
  openAttachment(id: string | number) {
    this.subscriptions.push(
      this.shareService
        .openAttachment(this.type, this.typeId, <string>id)
        .subscribe((res) => {
          this.link = res.data;
          if (res.success) {
            const urlLoaded = window.open(this.link);
            if (
              !urlLoaded ||
              urlLoaded.closed ||
              typeof urlLoaded.closed === 'undefined'
            ) {
              this.openWarningAlert(
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window'
              );
            }
          }
        })
    );
  }

  /**
   * @description Method for deleting the selected attachment.
   * @param id - ID of the item.
   * @param index - index.
   */
  deleteAttachment(id: string | number, index: number) {
    if (this.deleting.includes(<string>id)) {
      return;
    }

    const data = {
      content: 'Are you sure you want to delete this attachment?',
      doneMsg: 'Yes',
      cancelMsg: 'No, cancel!'
    };

    const confirm = this.alertService.confirmAlert(data);

    confirm.afterClosed().subscribe((result) => {
      if (result) {
        this.deleting.push(<string>id);

        this.subscriptions.push(
          this.shareService
            .deleteAttachment(this.type, this.typeId, <string>id)
            .pipe(
              finalize(() =>
                this.deleting.splice(this.deleting.indexOf(<string>id), 1)
              )
            )
            .subscribe((res) => {
              this.isRefreesh = true;
              this.listData.splice(index, 1);

              if (res.success && this.typeId === 0) {
                this.listData = this.listData.filter(
                  (e: IGetAttachment) => e.id !== id
                );
              }
            })
        );
      }
    });
  }

  /**
   * @description Method to deselected image from image array.
   * @param event - image
   */
  onRemove(event: File) {
    this.image.splice(this.image.indexOf(event), 1);
  }

  /**
   * @description Method for submitting the added attachments.
   */
  onSubmit() {
    if (!this.image.length) {
      this.alertService.warningAlert({
        content: 'Please choose a file ',
        isCancel: false
      });
      return;
    }

    if (this.listData.length >= this.fileCountLimit) {
      this.alertService.warningAlert({
        content: `Maximum limit is ${this.fileCountLimit}`,
        isCancel: false
      });
      return;
    }
    const file = new FormData();
    file.append('image', this.image[0]);
    this.submitting = true;
    this.subscriptions.push(
      this.shareService
        .addAttachment(this.datas.type, this.typeId, file)
        .pipe(
          finalize(() => {
            this.submitting = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.isRefreesh = true;
            this.image = [];
            this.removeSubject.next(true);
            if (this.typeId === 0) {
              this.listData.push(res.data);
              }else{
              this.getAttachment();
            }
          }
        })
    );
  }

  /**
   * @description Closes the dialog. For the case where the items counts are same, no need to refresh since there is no change in badge/icon display status in parent(even when user adds and deletes equal number of items).
   */
  close() {
    let isRefresh = false;
    if (this.lengths !== this.listData.length || this.isUploadedFromPhone) {
      isRefresh = true;
      this.v3DataTableService.refreshV3DataTable();
    }
    this.dialogRef.close({ listData: this.listData, refresh: isRefresh });
  }

  /**
   * @description Opens warning alert.
   * @param content - content to be shown in alert.
   */
  openWarningAlert(content: string): void {
    const data = {
      title: 'Error',
      content
    };
    this.alertService.warningAlert(data);
  }

  /**
   * Method to check that atachment is deletable
   *
   */
  isDeletableAttachment() {
    if (this.listData) {
      this.isDeletable = this.listData.map((res) => {
        const id = res.encrypted_id || res.id;
        return this.deleting?.includes(id as string) as boolean;
      });
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
      this.phoneNumberButton = 'Upload From Phone';
    }
  }

  submitPhoneNumber(): void {
    this.subscriptions.push(
      this.paymentService
        .depositSlipUploadFromPhoneLink({
          documentType: 'deposit-slips',
          requestType: 'sms',
          id: this.typeId ? (this.typeId as string) : 0,
          phoneNumber: this.phoneInput.value
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
              this.subscribePusherForAttachments(res.data.data.id as string);
              this.startTimer(res.data.timer?.diff);
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

    this.subscriptions.push(
      this.paymentService
        .depositSlipUploadFromPhoneLink({
          documentType: 'deposit-slips',
          requestType: 'qr',
          id: this.typeId ? (this.typeId as string) : 0
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

  /**
   * Subscribing pusher to get real time events from backend without sending a request.
   * Here we are subscribing to get the event of adding attachment from outside.
   * @param typeId - A unique id. used in channel name and event name of pusher.
   */
  subscribePusherForAttachments(typeId: string) {
    const channelName = this.PUSHER_CHANNEL_NAME_PREFIX + typeId;
    const eventName = this.PUSHER_EVENT_NAME_PREFIX + typeId;
    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(eventName, (res: { document_info: IGetAttachment[] }) => {          
          if (res) {
            if (!this.typeId) {
              res.document_info.forEach((attachment) => {
                this.listData.push(attachment);
              });
            } else {
              this.isUploadedFromPhone = true;
              this.getAttachment();
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

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.pusherChannels.forEach((el) => el.unsubscribe());
  }
}
