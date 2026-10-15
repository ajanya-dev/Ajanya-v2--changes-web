import { finalize, takeUntil } from 'rxjs/operators';
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { IExistingCreditCards } from 'src/app/models/payment-switch-board';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { Subject } from 'rxjs';
import { PusherService } from 'src/app/core/services/pusher.service';
import { signatureUploadPanelComponent } from 'src/app/shared/components/upload-panel/signature-upload-panel/signature-upload-panel.component';
import {
  IPayeeDropdown,
  IViewPayee
} from 'src/app/modules/payee/payee-v2/model/payee';
import { Channel } from 'pusher-js';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass, CurrencyPipe, NgTemplateOutlet } from '@angular/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import {
  faArrowLeft,
  faCamera,
  faCameraWeb,
  faCircleCheck,
  faCircleExclamation,
  faMobile,
  faQrcode,
  faTimesCircle,
  faUpToLine,
  faXmark
} from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  VERIFICATION_DOCUMENT_ACCEPT,
  VERIFICATION_DOCUMENT_ERROR,
  isAcceptedVerificationDocument
} from 'src/app/shared/utils/verification-document.util';
import { QrCodeScannerModalComponent } from '../qr-code-scanner-modal/qr-code-scanner-modal.component';
import {
  WebcamCaptureModalComponent,
  IWebcamCaptureResult
} from '../webcam-capture-modal/webcam-capture-modal.component';
import { TruncatePipe } from '../../../../../../pipes/truncate.pipe';

export interface IVerifyCardInvoiceDialogData {
  card: IExistingCreditCards;
  requiredDocuments: ['invoice'?, 'card'?, 'authDoc'?];
  amount: string;
  invoiceNumber: string;
  payee?: IPayeeDropdown | IViewPayee;
  mode: string; // '1' - 'ACH', '2'- 'PRINT', '3'- 'MAIL CHECK', '4'- 'EMAIL CHECK', '5'- 'INTERNATIONAL PAYMENT', '6'- 'WIRE', '7'- 'VIRTUAL CARD', '8'- 'MAIL', '9'- 'VC-TopUp'
  paymentType?: string | undefined;
  payrollId?: string;
  companyType?: string;
  isSameDay?: number;
}

interface ICardInvoiceGeneral<T = unknown> {
  card?: T;
  invoice?: T;
  cardReverse?: T;
}

interface IUploadedDocumentDetails {
  documentId: string | undefined;
  documentName: string | undefined;
}

type TDocuments = Omit<ICardInvoiceGeneral<File>, 'invoice'> & {
  invoice: (File | IUploadedDocumentDetails | undefined)[];
};
type TUploadedDocumentDetails = Required<
  Omit<ICardInvoiceGeneral<IUploadedDocumentDetails>, 'invoice'>
> & { invoice: IUploadedDocumentDetails[] };

/**
 * @description Modal component for collecting documents and submitting it to backend when user creates a card payment, -
 * and if there is requirement for any document like card photo or invoice photo.
 * @class
 */
@Component({
  selector: 'app-verify-card-modal',
  templateUrl: './verify-card-modal.component.html',
  styleUrls: ['./verify-card-modal.component.scss'],
  standalone: true,
  imports: [
    FaIconComponent,
    MatDialogClose,
    NgClass,
    MatTooltip,
    CurrencyPipe,
    TruncatePipe,
    CommonButtonV35Component,
    NgTemplateOutlet
  ]
})
export class VerifyCardModalComponent implements OnInit, OnDestroy {
  private matDialogRef = inject(MatDialogRef);
  public dialogData: IVerifyCardInvoiceDialogData = inject(MAT_DIALOG_DATA);
  private paymentsService = inject(PaymentsService);
  private matDialog = inject(MatDialog);
  private pusherService = inject(PusherService);
  private alertService = inject(AlertService);

  PUSHER_CHANNEL_NAME_PREFIX = 'cybersource-document-verification-' as const;
  PUSHER_EVENT_NAME_PREFIX = 'cs-document-verification-event-' as const;

  step = 1;
  invoiceRequired = false;
  cardRequired = false;
  acceptedDocumentTypes = VERIFICATION_DOCUMENT_ACCEPT;
  authDocRequired = false;
  loading = false;
  destroy$ = new Subject();
  requiredBoth = false;
  selectAtleastOneError = false;
  qrLoading = { card: false, invoice: false, cardReverse: false };
  smsLoading = { card: false, invoice: false, cardReverse: false };
  sentSms = { card: false, invoice: false, cardReverse: false };
  showUploadFromPhone = { card: false, invoice: false, cardReverse: false };
  card: IExistingCreditCards;
  amount: string;
  invoiceNumber: string;
  payee?: IPayeeDropdown | IViewPayee;
  verfiedPhoneNumber: string;
  signaturePadImg = '';
  signatureUrl: string;
  cardHolderName: string;
  cardNumber: string;
  userName: string;
  pusherChannels: Channel[] = [];
  showDontCloseMessage = false;
  paymentType: string;
  payrollId: string | undefined;
  companyType: string | undefined;
  faArrowLeft = faArrowLeft;
  faXmark = faXmark;
  faUpToLine = faUpToLine;
  faCircleCheck = faCircleCheck;
  faMobile = faMobile;
  faTimes = faTimesCircle;
  faCircleExclamaton = faCircleExclamation;
  faQrCode = faQrcode;
  faCamera = faCamera;
  faCameraWeb = faCameraWeb;
  qrDialogRef: MatDialogRef<QrCodeScannerModalComponent> | undefined =
    undefined;

  isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  showError = {
    card: false,
    invoice: false,
    signature: false,
    cardReverse: false
  };

  uploadedDocumentDetails: TUploadedDocumentDetails = {
    card: { documentId: undefined, documentName: undefined },
    invoice: [],
    cardReverse: { documentId: undefined, documentName: undefined }
  };

  qrCodeLink: ICardInvoiceGeneral<string> = {
    card: undefined,
    invoice: undefined,
    cardReverse: undefined
  };

  documents: TDocuments = {
    card: undefined,
    invoice: [undefined],
    cardReverse: undefined
  };

  ngOnInit(): void {
    this.invoiceRequired =
      this.dialogData.requiredDocuments.includes('invoice');
    this.cardRequired = this.dialogData.requiredDocuments.includes('card');
    this.authDocRequired =
      this.dialogData.requiredDocuments.includes('authDoc');
    if (this.authDocRequired && !this.cardRequired && !this.invoiceRequired) {
      this.step = 2;
    }
    if (this.dialogData.paymentType) {
      this.paymentType = this.dialogData.paymentType;
      this.payrollId = this.dialogData.payrollId;
      this.companyType = this.dialogData.companyType;
    }

    if (this.invoiceRequired && this.cardRequired) this.requiredBoth = true;
    this.amount = this.dialogData.amount;
    this.card = this.dialogData.card;
    this.invoiceNumber = this.dialogData.invoiceNumber;
    this.payee = this.dialogData.payee;
    this.getAuthDocumentData(this.card?.cardId);
  }

  /**
   * Getting Auth form related data such as card holder name, masked card number and username from backend.
   * @param cardId - Selected credit card Id
   */
  getAuthDocumentData(cardId: string) {
    this.loading = true;
    this.paymentsService
      .getAuthDocumentData(cardId)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((res) => {
        if (res.success) {
          this.cardHolderName = `${res.data.firstName ?? ''} ${res.data.lastName ?? ''}`;
          this.cardNumber = res.data.cardDigits;
          this.userName = res.data.userName;
        }
      });
  }

  /**
   * @description Function for opening file choose window for user when clicking on input div.
   * @param input - HTML file input element. creates a click on it if either card or invoice are not selected
   * @returns
   */
  chooseFile(input: HTMLInputElement) {
    input.click();
  }

  /**
   * @description Funciton to be called when there is file input change event. if event has files in target property, we are just storing that file to currespoding variable.
   * @param event - File input change event
   * @param file - we should pass this param to know which file are we choosing. so we can store the file in currespoding variable.
   */
  filePicked(
    event: Event & { target: HTMLInputElement },
    file: keyof ICardInvoiceGeneral
  ) {
    if (event.target === null) return;
    const selectedFile = (
      (event.target as HTMLInputElement).files as FileList
    )[0];
    if (!isAcceptedVerificationDocument(selectedFile)) {
      this.alertService.failedAlert({
        content: VERIFICATION_DOCUMENT_ERROR
      });
      return;
    }
    if (event.target.files?.length) {
      if (file === 'invoice') {
        [this.documents.invoice[this.documents.invoice.length - 1]] =
          event.target.files;
        this.showError.invoice = false;
      } else {
        [this.documents[file]] = event.target.files;
        this.showError[file] = false;
      }
    }
  }

  /**
   * @description function for remove alredy selected file from stored variable.
   * @param input - HTML file input element. accepting input to clear its value.
   * @param file - we should pass this param to know which file are we removeing. so we can remove the file in currespoding variable.
   */
  removeFile(
    input: HTMLInputElement,
    file: keyof ICardInvoiceGeneral,
    index?: number
  ) {
    const inputRef = input;
    inputRef.value = '';
    if (file === 'invoice') {
      if (this.documents.invoice.length === 1) {
        this.documents.invoice[0] = undefined;
        this.showError[file] = true;
        return;
      }
      this.documents.invoice.splice(index as number, 1);
    } else {
      this.documents[file] = undefined;
      this.showError[file] = true;
    }
  }

  /**
   * @description Function for create formData. just normilized to chunks to avoid over population in parent Function.
   * @returns FormData
   */
  createRequiredDocumentsFormData() {
    const formData = new FormData();
    let count = 0;
    if (this.invoiceRequired) {
      this.documents.invoice
        .filter((el) => (el as File)?.name)
        .forEach((el, index) => {
          formData.append(`invoices[${index}]`, el as File);
        });
    }
    if (
      this.cardRequired &&
      this.documents.card?.name &&
      !this.uploadedDocumentDetails.card?.documentId
    ) {
      formData.append(`documents[${count}][name]`, 'card');
      formData.append(`documents[${count}][file]`, this.documents.card);
      count = 2;
    }
    if (
      this.cardRequired &&
      this.documents.cardReverse?.name &&
      !this.uploadedDocumentDetails.cardReverse?.documentId
    ) {
      formData.append(`documents[${count}][name]`, 'cardReverse');
      formData.append(`documents[${count}][file]`, this.documents.cardReverse);
    }
    const { cardId } = this.dialogData.card;
    const { amount, mode } = this.dialogData;
    formData.append('cardId', cardId);
    formData.append('amount', amount);
    formData.append('authSign', this.signatureUrl);
    formData.append('payeeId', this.payee?.id as string);
    formData.append('invoiceNumber', this.invoiceNumber);
    formData.append('mode', mode);
    formData.append(
      'paymentType',
      this.paymentType ? this.paymentType : 'rail'
    );

    if (this.paymentType && this.payrollId && this.companyType) {
      formData.append('companyId', this.payrollId ? this.payrollId : '');
      formData.append('companyType', this.companyType ? this.companyType : '');
    }
    if (this.dialogData.isSameDay) {
      formData.append('isSameDay', String(this.dialogData.isSameDay));
    }

    return formData;
  }

  /**
   * @description Function to be called when user clicking on Verify(or next) button.
   * we are submitting all the required documents in the api and getting response here. and the after the api call completes, we are closing the modal, and passing response to parent component.
   */
  onVerify() {
    let shouldReturn = false;
    if (
      this.cardRequired &&
      !this.documents.card?.name &&
      !this.uploadedDocumentDetails.card?.documentId
    ) {
      this.showUploadFromPhone.card = false;
      this.showError.card = true;
      shouldReturn = true;
    }

    if (
      this.cardRequired &&
      !this.documents.cardReverse?.name &&
      !this.uploadedDocumentDetails.cardReverse?.documentId
    ) {
      this.showUploadFromPhone.cardReverse = false;
      this.showError.cardReverse = true;
      shouldReturn = true;
    }

    if (
      this.invoiceRequired &&
      !(this.documents.invoice[0] as File)?.name &&
      !(this.documents.invoice[0] as IUploadedDocumentDetails)?.documentId &&
      !this.uploadedDocumentDetails.invoice.length
    ) {
      this.showUploadFromPhone.invoice = false;
      this.showError.invoice = true;
      shouldReturn = true;
    }
    if (shouldReturn) return;

    if (this.step === 1) {
      this.step = 2;
      this.documents.invoice = this.documents.invoice.filter(Boolean);
      return;
    }

    if (this.step === 2 && this.signaturePadImg === '') {
      this.showError.signature = true;
      return;
    }

    this.loading = true;
    this.submitRequiredDocuments()
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          const { data } = res;

          if (
            this.invoiceRequired &&
            this.uploadedDocumentDetails.invoice.length
          ) {
            data.invoices = [
              ...(data?.invoices ?? []),
              ...(this.uploadedDocumentDetails.invoice
                .filter(Boolean)
                .map((el) => el.documentId) as string[])
            ];
          }

          if (
            this.cardRequired &&
            this.uploadedDocumentDetails.card.documentId
          ) {
            data.card = this.uploadedDocumentDetails.card.documentId;
          }

          if (
            this.cardRequired &&
            this.uploadedDocumentDetails.cardReverse.documentId
          ) {
            data.cardReverse =
              this.uploadedDocumentDetails.cardReverse.documentId;
          }
          this.matDialogRef.close({ success: true, data,authSign:this.signatureUrl });
        } else {
          this.matDialogRef.close({ success: false });
        }
      });
  }

  /**
   * Submitting required documents to backend and returns the observable.
   * @returns - an observable
   */
  submitRequiredDocuments() {
    const body = this.createRequiredDocumentsFormData();
    return this.paymentsService.submitRequiredDocuments(body);
  }

  /**
   * Opens a modal. if we have fetched the link already storing it in a variable. and reuse the link for 5 minutes.
   * and also if we get the link, we are subscribing to a pusher channel. to get the event of user submitting the document from outside.
   * @param qrFor - to know that for which document are we opening qr code modal.
   */
  openQrCodeModal(qrFor: keyof ICardInvoiceGeneral) {
    const openQrCodeModal = (link: string) =>
      this.matDialog.open(QrCodeScannerModalComponent, {
        width: '322px',
        height: '445px',
        data: {
          link
        }
      });

    if (this.qrCodeLink[qrFor]) {
      this.qrDialogRef = openQrCodeModal(this.qrCodeLink[qrFor] as string);
      return;
    }

    this.qrLoading[qrFor] = true;
    this.paymentsService
      .getUploadFromPhoneLink({
        documentType: qrFor,
        requestType: 'qr',
        amount: this.amount,
        cardId: this.card.cardId
      })
      .pipe(
        finalize(() => {
          this.qrLoading[qrFor] = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.showDontCloseMessage = true;
          this.qrCodeLink[qrFor] = res.data.link;
          this.clearLink(qrFor);
          this.qrDialogRef = openQrCodeModal(res.data.link);
          if (qrFor === 'card') {
            this.subscribePusherForCard(res.data.id);
          } else if (qrFor === 'cardReverse') {
            this.subscribePusherForCardReverse(res.data.id);
          } else {
            this.subscribePusherForInvoice(res.data.id);
          }
        }
      });
  }

  clearLink(linkFor: keyof ICardInvoiceGeneral) {
    setTimeout(() => {
      this.qrCodeLink[linkFor] = undefined;
    }, 5000 * 60);
  }

  /**
   * sends an sms to users' verified number and we get a response including a link and an id.
   * we are subscribing to a pusher channel. to get the event of user submitting the document from outside.
   * @param smsFor - to know that for which document are we sending sms.
   */
  sendMessage(smsFor: keyof ICardInvoiceGeneral) {
    this.smsLoading[smsFor] = true;
    this.paymentsService
      .getUploadFromPhoneLink({
        documentType: smsFor,
        requestType: 'sms',
        cardId: this.card.cardId,
        amount: this.amount
      })
      .pipe(
        finalize(() => {
          this.smsLoading[smsFor] = false;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.showDontCloseMessage = true;
          this.qrCodeLink[smsFor] = res.data.link;
          this.verfiedPhoneNumber = res.data.phoneNumber;
          this.sentSms[smsFor] = true;
          if (smsFor === 'card') {
            this.subscribePusherForCard(res.data.id);
          } else if (smsFor === 'cardReverse') {
            this.subscribePusherForCardReverse(res.data.id);
          } else {
            this.subscribePusherForInvoice(res.data.id);
          }
        }
      });
  }

  /**
   * Subscribing pusher to get real time events from backend without sending a request.
   * Here we are subscribing to get the event of verification of card from outside.
   * @param uuid - A unique id. used in channel name and event name of pusher.
   */
  subscribePusherForCardReverse(uuid: string) {
    const channelName = this.PUSHER_CHANNEL_NAME_PREFIX + uuid;
    const eventName = this.PUSHER_EVENT_NAME_PREFIX + uuid;
    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(
          eventName,
          (data: { documentId: string; documentName: string }) => {
            if (data.documentId) {
              this.qrDialogRef?.close();
              this.showError.cardReverse = false;
              this.showUploadFromPhone.cardReverse = false;
              this.uploadedDocumentDetails.cardReverse.documentId =
                data.documentId;
              this.uploadedDocumentDetails.cardReverse.documentName =
                data.documentName;
            }
          }
        )
    );
  }

  /**
   * Subscribing pusher to get real time events from backend without sending a request.
   * Here we are subscribing to get the event of verification of card from outside.
   * @param uuid - A unique id. used in channel name and event name of pusher.
   */
  subscribePusherForCard(uuid: string) {
    const channelName = this.PUSHER_CHANNEL_NAME_PREFIX + uuid;
    const eventName = this.PUSHER_EVENT_NAME_PREFIX + uuid;
    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(
          eventName,
          (data: { documentId: string; documentName: string }) => {
            if (data.documentId) {
              this.qrDialogRef?.close();
              this.showError.card = false;
              this.showUploadFromPhone.card = false;
              this.uploadedDocumentDetails.card.documentId = data.documentId;
              this.uploadedDocumentDetails.card.documentName =
                data.documentName;
            }
          }
        )
    );
  }

  /**
   * Subscribing pusher to get real time events from backend without sending a request.
   * Here we are subscribing to get the event of verification of invoice from outside.
   * @param uuid - A unique id. used in channel name and event name of pusher.
   */
  subscribePusherForInvoice(uuid: string) {
    const channelName = this.PUSHER_CHANNEL_NAME_PREFIX + uuid;
    const eventName = this.PUSHER_EVENT_NAME_PREFIX + uuid;
    this.pusherChannels.push(
      this.pusherService
        .subscribePusher(channelName)
        .bind(eventName, (data: IUploadedDocumentDetails) => {
          if (data.documentId) {
            this.qrCodeLink.invoice = undefined;
            this.qrDialogRef?.close();
            this.showError.invoice = false;
            this.showUploadFromPhone.invoice = false;
            this.documents.invoice[this.documents.invoice.length - 1] = data;
            this.uploadedDocumentDetails.invoice.push(data);
          }
        })
    );
  }

  /**
   * Getter for modal title.
   */
  get modalTitle() {
    if (this.step === 1) {
      if (this.requiredBoth) return 'Verify your credit card and invoice';
      if (this.cardRequired) return 'Verify your credit card';
      return 'Verify your invoice';
    }
    return 'Sign';
  }

  /**
   * Getter for button text.
   */
  get buttonText() {
    if (this.step === 1) {
      return 'Next';
    }
    return this.loading ? 'Verifying...' : 'Verify';
  }

  addSignature() {
    if (this.signaturePadImg !== '') return;
    const dialogRef = this.matDialog.open(signatureUploadPanelComponent, {
      maxWidth: '690px',
      width: '93%',
      panelClass: 'upload_panel_wrapper',
      minHeight: '410px',
      disableClose: true,
      data: {
        showOnlyDigitalAndExisting: true
      }
    });

    dialogRef.afterClosed().subscribe((signImg) => {
      if (signImg) {
        this.signatureUrl = signImg.signatureUrl?.split('the_img=')[1];
        if (signImg.signPad) {
          this.signaturePadImg = signImg.signPad;
        }
        if (signImg.existSign) {
          this.signaturePadImg = signImg.existSign;
          this.signatureUrl = signImg.existSign?.split('the_img=')[1];
        }
        if (signImg.uploadSign) {
          this.signaturePadImg = signImg.uploadSign;
        }
        if (signImg.digitalSign) {
          this.signaturePadImg = signImg.digitalSign;
        }
        this.showError.signature = false;
      }
    });
  }

  get showDontClose() {
    if (this.cardRequired) {
      if (this.qrCodeLink.card) {
        return (
          this.showDontCloseMessage &&
          !this.uploadedDocumentDetails.card.documentId
        );
      }
      if (this.qrCodeLink.invoice) {
        return (
          this.showDontCloseMessage &&
          !this.uploadedDocumentDetails.invoice.length
        );
      }
      if (this.qrCodeLink.invoice && this.qrCodeLink.card) {
        return (
          this.showDontCloseMessage &&
          !this.uploadedDocumentDetails.invoice.length &&
          !this.uploadedDocumentDetails.card.documentId
        );
      }
      return false;
    }
    return (
      this.showDontCloseMessage && !this.uploadedDocumentDetails.invoice.length
    );
  }

  onAddInvoice() {
    if (
      (this.documents.invoice[this.documents.invoice.length - 1] as File)
        ?.name ||
      (
        this.documents.invoice[
          this.documents.invoice.length - 1
        ] as IUploadedDocumentDetails
      )?.documentId ||
      this.documents.invoice.length === 0
    ) {
      this.documents.invoice.length += 1;
    }
  }

  get isAddInvoiceDisabled() {
    return !(
      Boolean(
        (this.documents.invoice[this.documents.invoice.length - 1] as File)
          ?.name ||
          (
            this.documents.invoice[
              this.documents.invoice.length - 1
            ] as IUploadedDocumentDetails
          )?.documentId
      ) || this.documents.invoice.length === 0
    );
  }

  showUploadFromPhoneInvoice(index: number) {
    return (
      this.showUploadFromPhone.invoice &&
      !(this.documents.invoice[this.documents.invoice.length - 1] as File)
        ?.name &&
      !(
        this.documents.invoice[
          this.documents.invoice.length - 1
        ] as IUploadedDocumentDetails
      )?.documentId &&
      index === this.documents.invoice.length - 1
    );
  }

  removeSign() {
    this.signaturePadImg = '';
  }

  /**
   * Check if device has a webcam available
   * @returns Promise<boolean> - true if webcam is available
   */
  async checkWebcamAvailability(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        return false;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some((device) => device.kind === 'videoinput');
    } catch {
      return false;
    }
  }

  /**
   * Open webcam capture modal for card front or back
   * @param documentType - 'card' or 'cardReverse'
   */
  async openWebcamCapture(
    documentType: 'card' | 'cardReverse'
  ): Promise<void> {
    const hasWebcam = await this.checkWebcamAvailability();

    if (!hasWebcam) {
      this.alertService.failedAlert({
        content:
          'No webcam detected. Please connect a webcam or use the file upload option.'
      });
      return;
    }

    const title =
      documentType === 'card'
        ? 'Capture Credit Card (Front View)'
        : 'Capture Credit Card (Back View)';

    const dialogRef = this.matDialog.open(WebcamCaptureModalComponent, {
      width: '500px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        documentType,
        title
      }
    });

    dialogRef.afterClosed().subscribe((result: IWebcamCaptureResult | null) => {
      if (result?.file) {
        this.documents[documentType] = result.file;
        this.showError[documentType] = false;
        this.showUploadFromPhone[documentType] = false;
      }
    });
  }

  /**
   * Trigger mobile camera capture using HTML5 capture attribute
   * @param inputElement - The file input element
   */
  triggerMobileCameraCapture(inputElement: HTMLInputElement): void {
    inputElement.setAttribute('accept', 'image/*');
    inputElement.setAttribute('capture', 'environment');
    inputElement.click();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.pusherChannels.forEach((el) => el.unsubscribe());
  }
}
