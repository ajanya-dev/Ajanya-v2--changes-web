import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject
} from '@angular/core';
import {
  UntypedFormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PusherService } from 'src/app/core/services/pusher.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { EditNicknameModalComponent } from '../../modals/edit-nickname-modal/edit-nickname-modal.component';
import SignaturePad from 'signature_pad';
import { IGetExistLogo } from 'src/app/models/common';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { OcwPreventMultiClickDirective } from '../../../../directive/ocw-prevent-multi-click.directive';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { ControlMessageComponent } from '../../../../shared/components/control-message/control-message/control-message.component';
import { NgxMaskDirective } from 'ngx-mask';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from '@angular/material/expansion';

/**
 * @description Represents the Signature Menu Component responsible for managing signatures and signature-related actions.
 * This component handles the user's signatures, allowing users to sign on screen, upload digital signatures,
 * send SMS and email notifications, and manage existing signatures.
 */
@Component({
  selector: 'app-signature-menu',
  templateUrl: './signature-menu.component.html',
  styleUrls: ['./signature-menu.component.scss'],
  standalone: true,
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    NgxMaskDirective,
    FormsModule,
    ReactiveFormsModule,
    ControlMessageComponent,
    NgClass,
    NgIf,
    NgFor,
    OcwPreventMultiClickDirective
  ]
})
export class SignatureMenuComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private localStorageService = inject(LocalStorageService);
  public alertService = inject(AlertService);
  public checkDesignService = inject(CheckDesignService);
  public canvasService = inject(CheckdesignCanvasService);
  public dialog = inject(MatDialog);
  public pusherService = inject(PusherService);

  @Output() loading = new EventEmitter();
  existingSignatures: IGetExistLogo[] = [];

  subscriptions: Subscription[] = [];

  phoneNumber = new UntypedFormControl('', [
    ValidationService.phoneNumberValidator,
    Validators.required
  ]);
  emailId = new UntypedFormControl('', [
    ValidationService.emailValidator,
    Validators.required
  ]);
  qrImage: string;

  loadingBtn = {
    text: false,
    email: false,
    uploadImg: false,
    signOnScreen: false,
    digitalSig: false
  };

  signatureShapeOption = {
    id: 'user_signature',
    left: 510,
    top: 175,
    originX: 'left',
    originY: 'top',
    cornerStyle: 'circle',
    transparentCorners: false,
    cornerColor: 'orange',
    borderColor: 'orange',
    cornerSize: 14,
    padding: 4,
    borderDashArray: [6, 6],
    rotatingPointOffset: 25,
    type: 'image'
  };
  signatureState = {
    page: 1,
    disablePrevBtn: true,
    disableNextBtn: true
  };
  paginationItemCount = 28;

  @ViewChild('signPad') public signPad: ElementRef;
  signaturePad: SignaturePad;
  signatureImg: string; // for sign on screen
  selectedFile: File | null;
  userId: string | null;

  ngOnInit(): void {
    this.subscriptions.push(
      this.canvasService.activeMenu$.subscribe((menu) => {
        if (menu.name === 'menu-signature') {
          this.getSignatures(undefined);
          this.getpusherevent();
        }
      })
    );
  }

  /**
   * @description Initializes Pusher subscription for signature upload events.
   */
  getpusherevent() {
    this.userId = this.localStorageService.getItem('userId'); //puser
    if (this.userId) {
      this.pusher(this.userId);
    }
  }

  /**
   * @description Subscribe to Pusher event for signature upload.
   * @param id - The user's ID for subscription channel.
   */
  pusher(id: string) {
    const channnelName = 'check-signature-uploaded-' + id;

    this.subscriptions.push(
      this.pusherService
        .getEvent(channnelName, 'check-signature-uploaded-event')
        .subscribe((res) => {
          if (res) {
            this.getSignatures('uploadSignature');
          }
        })
    );
  }

  /**
   * @description @description Method to get signatures, with pagination.
   * @param upload - If method is invoked after uploading signature.
   * @param type - Optional- If the method is invoked to switch between pages,
   * type will be 'prev' for previous page and 'next' for next page.
   */
  getSignatures(upload: 'uploadSignature' | undefined, type?: 'prev' | 'next') {
    if (
      this.existingSignatures.length &&
      upload === undefined &&
      type === undefined
    ) {
      return;
    }
    if (type !== undefined) {
      if (type === 'prev') {
        if (
          this.signatureState.page <= 1 ||
          this.signatureState.disablePrevBtn === true
        )
          return;
        this.signatureState.page--;
      } else if (type === 'next') {
        if (this.signatureState.disableNextBtn === true) return;
        this.signatureState.page++;
      }
    } else {
      this.signatureState.page = 1;
    }

    this.subscriptions.push(
      this.checkDesignService
        .getImages(this.signatureState.page, 2)
        .subscribe((data) => {
          this.existingSignatures = data?.data;
          if (data?.data.length < this.paginationItemCount) {
            this.signatureState.disableNextBtn = true;
          } else {
            this.signatureState.disableNextBtn = false;
          }

          if (this.signatureState.page > 1) {
            this.signatureState.disablePrevBtn = false;
          } else {
            this.signatureState.disablePrevBtn = true;
          }
        })
    );
  }

  /**
   * @description Clears the content of the signature pad.
   */
  clearSignaturePad() {
    this.signaturePad.clear();
  }

  /**
   * @description Saves the drawn signature on the screen.
   * @param nickName - Input element containing the nickname for the signature.
   */
  saveSignOnScreen(nickName: HTMLInputElement) {
    if (!nickName?.value) {
      this.alertService.warningAlert({
        title: 'Enter Nickname',
        content: ' '
      });
      return;
    }
    const dataUrl = this.signaturePad.toDataURL();

    if (this.signaturePad.isEmpty()) {
      this.alertService.warningAlert({
        title: ' ',
        content: 'Please sign in the Signature Pad'
      });
      return;
    }

    this.saveDataUrlSignature(dataUrl, nickName.value);
    this.signaturePad.clear();
    nickName.value = '';
  }

  /**
   * @description Converts text to canvas drawing on an HTML canvas element.
   * @param text - Input element containing the text to be drawn.
   * @param canvas - HTML canvas element for drawing.
   */
  textToCanvas(text: HTMLInputElement, canvas: HTMLCanvasElement) {
    const ctx = canvas?.getContext('2d');
    const x = canvas.width / 2;
    const y = canvas.height / 1.6;
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.font = '40px PrimeraSignature'; //Monsieur La Doulaise";
      ctx.fillText(text.value, x, y);
    }
  }

  /**
   * @description Saves the drawn digital signature.
   * @param text - Input element containing the user's name for the signature.
   * @param canvas - HTML canvas element for drawing.
   * @param nickName - Input element containing the nickname for the signature.
   */
  saveDigitalSignature(
    text: HTMLInputElement,
    canvas: HTMLCanvasElement,
    nickName: HTMLInputElement
  ) {
    if (!(text?.value && nickName?.value)) {
      this.alertService.warningAlert({
        content: text?.value ? 'Please Type Your Name' : 'Nick Name is required'
      });
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    this.saveDataUrlSignature(dataUrl, nickName?.value);
    text.value = '';
    nickName.value = '';
    const ctx = canvas?.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }

  /**
   * @description Saves the data URL signature to the server.
   * @param dataUrl - Data URL of the signature image.
   * @param nickName - Nickname for the signature.
   */
  saveDataUrlSignature(dataUrl: string, nickName: string) {
    this.loading.emit(true);

    this.subscriptions.push(
      this.checkDesignService
        .saveSignOnScreen(dataUrl, nickName)
        .pipe(finalize(() => this.loading.emit(false)))
        .subscribe((data) => {
          if (data?.success) {
            this.existingSignatures.unshift(data.data);
            this.addSignature(data.data);
          }
        })
    );
  }

  /**
   * @description Deletes a signature from the server and the displayed list.
   * @param id - ID of the signature to be deleted.
   */
  deleteSignature(id: string) {
    const data = {};
    const alertRef = this.alertService.confirmAlert(data);
    alertRef.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.checkDesignService.deleteImage(id, 2).subscribe(
            (success) => {
              if (success?.success) {
                this.alertService.successAlert({
                  title: 'Deleted',
                  content: ' ',
                  close: true,
                  timeout: 2000
                });
                this.filterSignatures(id);
              }
            },
            (err) => {
              this.alertService.failedAlert({
                title: err.errorMsg,
                content: ' '
              });
            }
          )
        );
      }
    });
  }

  /**
   * @description Filters out a signature from the existing list.
   * @param id - ID of the signature to be filtered.
   */
  filterSignatures(id: string) {
    this.existingSignatures = this.existingSignatures.filter(
      (ele) => ele.id === id
    );
  }

  /**
   * @description Opens a dialog for editing the nickname of a signature.
   * @param image - The signature image object to be edited.
   */
  editSignature(image: IGetExistLogo): void {
    const dialogRef = this.dialog.open(EditNicknameModalComponent, {
      maxWidth: '510px',
      width: '93%',
      data: image
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result?.submit) {
        return;
      }
      this.subscriptions.push(
        this.checkDesignService
          .editNickName(image.id, result.newName)
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                content: 'Nickname updated',
                close: true,
                timeout: 2000
              });
              image.nickName = result.newName;
            }
          })
      );
    });
  }

  /**
   * @description Sends an sms with link to the web page to sign to the provided phone number.
   */
  sendSms() {
    if (!this.phoneNumber.valid || this.phoneNumber.value.length !== 10) {
      this.alertService.warningAlert({
        content: 'Please enter a valid phone number'
      });
      return;
    }

    this.loadingBtn.text = true;
    const bankAccId = this.canvasService.bankVariables.bankAccountId;
    this.subscriptions.push(
      this.checkDesignService
        .sendSms(bankAccId, this.phoneNumber.value)
        .pipe(finalize(() => (this.loadingBtn.text = false)))
        .subscribe((data) => {
          if (data?.success) {
            this.alertService.successAlert({
              title: ' ',
              content: 'Message sent',
              close: true
            });
            this.phoneNumber.setValue(null);
            this.phoneNumber.markAsUntouched();
          }
        })
    );
  }

  /**
   * @description Sends an email with link to the web page to sign to the provided email address.
   */
  sendEmail() {
    if (!this.emailId.valid) {
      this.alertService.warningAlert({
        content: 'Please enter a valid email'
      });
      return;
    }

    this.loadingBtn.email = true;
    const bankAccId = this.canvasService.bankVariables.bankAccountId;

    this.subscriptions.push(
      this.checkDesignService
        .sendEmail(bankAccId, this.emailId.value)
        .pipe(finalize(() => (this.loadingBtn.email = false)))
        .subscribe((data) => {
          if (data?.success) {
            this.alertService.successAlert({
              title: ' ',
              content: 'Email sent',
              close: true
            });
            this.emailId.setValue(null);
            this.emailId.markAsUntouched();
          }
        })
    );
  }

  /**
   * @description Handles the event when a file is uploaded for the signature.
   * @param files - Array of files uploaded.
   */
  uploadEvent(files: File[]) {
    if (files?.length) {
      this.selectedFile = files[0];
    }
  }

  /**
   * @description Uploads a signature image along with a nickname to the server.
   * @param nickNameInput - Input element containing the nickname for the signature.
   */
  uploadSignature(nickNameInput: HTMLInputElement) {
    const nickName = nickNameInput.value;
    if (!(nickName && this.selectedFile)) {
      const content = this.selectedFile ? 'Enter nickname' : 'Choose a file';
      this.alertService.warningAlert({ title: ' ', content });
      return;
    }
    this.loadingBtn.uploadImg = true;
    this.subscriptions.push(
      this.checkDesignService
        .uploadImage(2, this.selectedFile, nickName)
        .pipe(finalize(() => (this.loadingBtn.uploadImg = false)))
        .subscribe((data) => {
          if (data?.success) {
            this.alertService.successAlert({
              title: 'Success!',
              content: 'Signature uploaded',
              close: true
            });
            this.addSignature(data.data);
            this.existingSignatures.unshift(data.data);
            this.selectedFile = null;
            nickNameInput.value = '';
          }
        })
    );
  }

  /**
   * @description Adds a signature image to the canvas.
   * @param image - The signature image to be added.
   */
  addSignature(image: IGetExistLogo) {
    const url = image.imageUrlNoAuth;
    this.canvasService.addImage(url, image.id, this.signatureShapeOption);
  }

  /**
   * @description Sets the QR code image for sharing the signature link.
   */
  setQrImage() {
    this.qrImage = `https://in43kxjpahwsnu3hwajejfofki0jhhrz.lambda-url.us-east-1.on.aws/generate-qr?cht=qr&chl=https://${window.location.host}/outside/signature/${this.canvasService.bankVariables.qrCodeToken}&chs=150x150`;
  }

  ngAfterViewInit() {
    this.signaturePad = new SignaturePad(this.signPad.nativeElement);
    const inputEle = <HTMLInputElement>(
      document.getElementById('digital_sig_text')
    );
    const canvasEle = <HTMLCanvasElement>(
      document.getElementById('digital_sig_canvas')
    );
    this.textToCanvas(inputEle, canvasEle);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
