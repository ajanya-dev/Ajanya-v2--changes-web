/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
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

import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { NgClass } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormControl,
  Validators
} from '@angular/forms';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { MatTooltip } from '@angular/material/tooltip';
import { QrCodeScannerModalComponent } from 'src/app/modules/payments/shared/components/modals/qr-code-scanner-modal/qr-code-scanner-modal.component';
import { NgxMaskDirective } from 'ngx-mask';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { Channel } from 'pusher-js';
import { PusherService } from 'src/app/core/services/pusher.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { LucideAngularModule } from 'lucide-angular';
import { DropZoneComponent } from '../../../components/drop-zone/drop-zone.component';
import { CommonButtonV4Component } from '../../../V4/buttons/common-button-v4/common-button-v4.component';
import { NewPhoneInputComponent } from '../../../components/new-phone-input/new-phone-input.component';

/**
 * @description Modal component for adding attachments (V4).
 */
@Component({
  selector: 'app-add-attachment-modal',
  templateUrl: './add-attachment-modal-v4.component.html',
  styleUrls: ['./add-attachment-modal-v4.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatDialogClose,
    DropZoneComponent,
    NgClass,
    NgxMaskDirective,
    ReactiveFormsModule,
    MatTooltip,
    LucideAngularModule,
    CommonButtonV4Component,
    NewPhoneInputComponent
  ]
})
export class AddAttachmentModalV4Component implements OnInit, OnDestroy {
  public datas = inject(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<AddAttachmentModalV4Component>);
  private shareService = inject(SharedService);
  private alertService = inject(V4AlertService);
  private sanitizer = inject(DomSanitizer);

  private matDialog = inject(MatDialog);
  private paymentService = inject(PaymentsService);
  private pusherService = inject(PusherService);
  private localStorageService = inject(LocalStorageService);
  private checkService = inject(CheckService);
  private dataTableService = inject(DataTableService);

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
  submitting = signal(false);
  deleting: string[] = [];
  fileCountLimit = 5;
  isDeletable: boolean[] = [];
  disabled = signal(false);
  removeSubject = new Subject();
  isMailType = signal(false);
  checkedAttch: string[] = [];
  initialAttachments = 0;
  showPhoneInput = signal(false);
  phoneIncr = 0;
  phoneNumberSending = signal(false);
  phoneNumberButton = signal('');
  previousPhoneNumber: string;
  sendSuccessfully = signal(false);
  isQRCodeLoading = false;
  timerExist = signal(false);
  displayTimer = signal('');
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
    this.isMailType.set(this.datas.type === 'mail');
    if (this.isMailType()) {
      this.typeId = this.datas.checkId;
      this.type = this.datas.type;
    } else {
      this.typeId = this.datas.id;
      this.type = this.datas.type;
    }
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

  isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  onSelect(event: File[]) {
    if (event?.length) {
      if (Utils.maxSizeValidator(event[0].size)) {
        this.alertService.failedAlert({ content: 'Max size is 4MB' });
        return;
      }
      this.image[0] = event[0];
      this.getPreview(this.image[0]);
      this.onSubmit();
    } else {
      this.image = [];
    }
  }

  getAttachment() {
    this.count += 1;
    if (this.typeId === 0) {
      this.listData = this.datas?.attachments;
      return;
    }
    if (this.isMailType()) {
      this.subscriptions.push(
        this.checkService
          .getCheckAttachment(this.typeId as string)
          .subscribe((res) => {
            if (res?.success) {
              this.listData = res.data as any;
              this.initialAttachments = res.data?.length;
              if (this.count === 1) {
                this.lengths = this.listData.length;
              }
              setTimeout(() => {
                this.checkExistingAttachments();
              }, 1000);
            }
          })
      );
    } else {
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
  }

  checkExistingAttachments() {
    if (this.datas?.attachId) {
      this.listData.forEach((attachment: any) => {
        if (this.datas.attachId.includes(attachment.id)) {
          this.checkedAttch.push(attachment.id);
        }
      });
    }
  }

  openAttachment(id: string | number) {
    const obs = this.isMailType()
      ? this.checkService.openCheckAttachment(
          this.typeId as string,
          id as string
        )
      : this.shareService.openAttachment(this.type, this.typeId, <string>id);

    this.subscriptions.push(
      obs.subscribe((res) => {
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

  deleteAttachment(id: string | number, index: number) {
    if (this.deleting.includes(<string>id)) {
      return;
    }

    if (this.isMailType()) {
      this.deleteMailAttachment(id as string);
    } else {
      this.deleteNonMailAttachment(id, index);
    }
  }

  private deleteMailAttachment(attachmentId: string) {
    this.disabled.set(true);
    this.subscriptions.push(
      this.checkService
        .deleteCheckAttachment(this.typeId as string, attachmentId)
        .subscribe((res) => {
          if (res?.success) {
            this.disabled.set(false);
            this.checkedAttch.splice(
              this.checkedAttch.indexOf(attachmentId),
              1
            );
            this.listData = this.listData.filter(
              (ele: any) => ele.id !== attachmentId
            );
          }
        })
    );
  }

  private deleteNonMailAttachment(id: string | number, index: number) {
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

  onRemove(event: File) {
    this.image.splice(this.image.indexOf(event), 1);
  }

  onSubmit() {
    if (!this.image.length) {
      this.alertService.warningAlert({
        content: 'Please choose a file',
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
    this.submitting.set(true);
    if (this.isMailType()) {
      this.subscriptions.push(
        this.checkService
          .addCheckAttachment(this.typeId, this.image[0])
          .pipe(
            finalize(() => {
              this.submitting.set(false);
              this.removeSubject.next(true);
            })
          )
          .subscribe((res) => {
            if (res?.success) {
              this.isRefreesh = true;
              this.image = [];
              this.listData.push(res.data);
              if (res.data?.fileName?.toLowerCase().endsWith('.pdf')) {
                this.selectedCheck(res.data.id);
              }
            }
          })
      );
    } else {
      const file = new FormData();
      file.append('image', this.image[0]);
      this.subscriptions.push(
        this.shareService
          .addAttachment(this.datas.type, this.typeId, file)
          .pipe(
            finalize(() => {
              this.submitting.set(false);
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.isRefreesh = true;
              this.image = [];
              this.removeSubject.next(true);
              if (this.typeId === 0) {
                this.listData.push(res.data);
              } else {
                this.getAttachment();
              }
            }
          })
      );
    }
  }

  selectedCheck(id: string) {
    this.checkedAttch.push(id);
  }

  singlecheck(event: Event, item: any) {
    if ((event.target as HTMLInputElement).checked) {
      const splited = item.fileName.split('.');
      const format = splited?.length > 0 ? splited[splited.length - 1] : '';
      if ((format ?? '').toLowerCase() !== 'pdf') {
        this.alertService.warningAlert({
          content: 'Supported only pdf format'
        });
        const unCheck = document.getElementById(
          `attachId_${item.id}`
        ) as HTMLInputElement;
        unCheck.checked = false;
      } else {
        this.checkedAttch.push(item.id);
      }
    } else {
      this.checkedAttch.splice(this.checkedAttch.indexOf(item.id), 1);
    }
  }

  checkAll(event: Event) {
    let count = false;
    if ((event?.target as HTMLInputElement)?.checked) {
      for (let i = 0; i < this.listData.length; i += 1) {
        const item = this.listData[i] as any;
        const splited = item.fileName.split('.');
        const format = splited?.length > 0 ? splited[splited.length - 1] : '';
        if (format.toLowerCase() !== 'pdf') {
          const unCheck = document.getElementById(
            `attachId_${item.id}`
          ) as HTMLInputElement;
          unCheck.checked = false;
          if (!count) {
            this.alertService.warningAlert({
              content: 'Supported only pdf format'
            });
            count = true;
          }
        } else {
          const smsBox = document.querySelector(
            `#attachId_${item.id}`
          ) as HTMLInputElement;
          smsBox.checked = true;
          item.checked = true;
          this.checkedAttch.push(item.id);
        }
      }
    } else {
      this.checkedAttch = [];
      this.listData.forEach((e: any) => {
        const smsBox = document.querySelector(
          `#attachId_${e.id}`
        ) as HTMLInputElement;
        smsBox.checked = false;
        e.checked = false;
      });
    }
  }

  close() {
    if (this.isMailType()) {
      const ids: string[] = [];
      let fileName = '';
      this.listData.forEach((e: any) => {
        if (this.checkedAttch.includes(e.id)) {
          ids.push(e.id);
          fileName += `${e.fileName} , `;
        }
      });
      if (!!this.initialAttachments !== !!this.listData.length) {
        this.dataTableService.setRefreshStatus(true);
      }
      this.dialogRef.close({ checkId: this.datas.checkId, ids, fileName });
    } else {
      const isRefresh =
        this.lengths !== this.listData.length || this.isUploadedFromPhone;
      this.dialogRef.close({ listData: this.listData, refresh: isRefresh });
    }
  }

  openWarningAlert(content: string): void {
    const data = {
      title: 'Error',
      content
    };
    this.alertService.warningAlert(data);
  }

  isDeletableAttachment() {
    if (this.listData) {
      this.isDeletable = this.listData.map((res) => {
        const id = res.encrypted_id || res.id;
        return this.deleting?.includes(id as string) as boolean;
      });
    }
  }

  addWithMobileDevice(): void {
    this.showPhoneInput.set(true);
    this.phoneInput.markAsTouched();
    this.loadPhoneBtnLabel();
    if (this.phoneInput.invalid) {
      this.phoneIncr += 1;
      return;
    }
    this.previousPhoneNumber = this.phoneInput.value;
    if (this.phoneIncr !== 0) {
      this.phoneNumberSending.set(true);
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
      !this.phoneNumberSending()
    ) {
      this.phoneNumberButton.set('Resend');
    } else if (this.phoneNumberSending()) {
      this.phoneNumberButton.set('Sending');
    } else if (
      this.showPhoneInput() &&
      !this.previousPhoneNumber !== this.phoneInput.value
    ) {
      this.phoneNumberButton.set('Send Link');
    } else {
      this.phoneNumberButton.set('Upload From Phone');
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
            this.phoneNumberSending.set(false);
            this.loadPhoneBtnLabel();
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.sendSuccessfully.set(true);
              this.subscribePusherForAttachments(res.data.data.id as string);
              this.startTimer(res.data.timer?.diff);
              setTimeout(() => {
                this.sendSuccessfully.set(false);
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

  startTimer(time: number) {
    this.timer = time;
    const source = interval(1000);
    this.timerSubscription = source.subscribe(() => {
      if (this.timer > 0) {
        this.timerExist.set(true);
        this.timer -= 1;
        const hours = Math.floor(this.timer / 3600);
        const minutes = Math.floor((this.timer % 3600) / 60);
        const seconds = this.timer % 60;
        this.displayTimer.set(
          `${hours < 10 ? '0' : ''}${hours}:${
            minutes < 10 ? '0' : ''
          }${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
        );
      } else {
        this.timerExist.set(false);
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
