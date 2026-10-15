import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { UntypedFormControl, FormsModule } from '@angular/forms';
import {
  MatDialogRef,
  MatDialogClose,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { TooltipPosition, MatTooltip } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import SignaturePad from 'signature_pad';
import { PusherService } from 'src/app/core/services/pusher.service';
import { UploadPad } from 'src/app/data/data/uploadPad';
import { IGetExistLogo } from 'src/app/models/common';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { NgxMaskDirective } from 'ngx-mask';
import { NgClass } from '@angular/common';
import { LucideAngularModule, X, FileText } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

/**
 * @description V4 Component for uploading signature.
 */
@Component({
  selector: 'app-v4-signature-upload-panel',
  templateUrl: './v4-signature-upload-panel.component.html',
  styleUrls: ['./v4-signature-upload-panel.component.scss'],
  standalone: true,
  imports: [
    MatDialogClose,
    NgClass,
    NgxMaskDirective,
    FormsModule,
    MatTooltip,
    LucideAngularModule,
    CommonButtonV4Component
  ]
})
export class V4SignatureUploadPanelComponent implements OnInit {
  readonly XIcon = X;
  readonly FileTextIcon = FileText;
  readonly tabIcons: Record<string, string> = {
    'Existing Signature': 'pen-tool',
    'Sign on Screen': 'monitor',
    'Sign from Phone': 'smartphone',
    'Sign from Email': 'mail',
    'Scan QR Code': 'qr-code',
    'Add New Signature': 'pencil',
    'Upload Signature': 'upload'
  };

  private dialogRef = inject(MatDialogRef<V4SignatureUploadPanelComponent>);
  public bankAccService = inject(BankAccountsService);
  private alertService = inject(V4AlertService);
  public pusherService = inject(PusherService);
  private localStorageService = inject(LocalStorageService);
  public dialogData = inject(MAT_DIALOG_DATA, { optional: true });

  //= ==> Tooltip position

  positionOptions: TooltipPosition[] = [
    'after',
    'before',
    'above',
    'below',
    'left',
    'right'
  ];

  position = new UntypedFormControl(this.positionOptions[5]);

  digitalSignVal: string;
  digitalSign: string;
  signPhone: string;
  signEmail: string;
  signaturePadImg: string;
  existingSIgnImg: string;
  digitalSignImg: string;
  initialSignImg: string;
  addPadSignBtn = false;
  uploadSignImg: string | ArrayBuffer | null = '';
  uploadSignListTitle = UploadPad.SignPadTitles();
  // uploadexistingSign: any = UploadPad.existingSign();
  subscriptions: Subscription[] = [];
  existingAllSignatureImages: IGetExistLogo[];
  signatureInfo: { signature: string; nickName: string; initial?: string };
  deleteExistSign = false;
  qrImage: string;
  phoneDisable = true;
  emailDidable = true;
  inputVal: string;
  initials: string = '';

  existingSignatureName: string;
  signNickNameVal = true;
  btnDesable = false;
  showSignTip = true;
  userId: string | null;
  public signNameRequiredError = false;

  existingSignatureLoading = signal(false);

  // Grid vs List view for existing signatures
  viewMode: 'grid' | 'list' = 'grid';

  // Selected existing signature
  selectedExistingSign: IGetExistLogo | null = null;

  signaturePad: SignaturePad;

  private _signPad: ElementRef;
  @ViewChild('signPad') set signPad(ref: ElementRef) {
    if (ref) {
      this._signPad = ref;
      this.initSignaturePad();
    }
  }

  // Add font family related properties
  selectedFont = 'Dancing Script';
  fontFamilies = [
    { name: 'Dancing Script', value: 'Dancing Script' },
    { name: 'Great Vibes', value: 'Great Vibes' },
    { name: 'Satisfy', value: 'Satisfy' },
    { name: 'Alex Brush', value: 'Alex Brush' }
  ];

  ngOnInit(): void {
    const mayVal = JSON.parse(sessionStorage.getItem('signTipVal') ?? 'null');
    this.getExistingSigns();
    setTimeout(() => {
      this.showSignTip = false;
    }, 4000);

    if (mayVal !== null || mayVal !== undefined) {
      this.showSignTip = mayVal;
    }

    this.subscriptions.push(
      this.bankAccService.getQrCodeToken().subscribe((res) => {
        this.qrImage = `https://in43kxjpahwsnu3hwajejfofki0jhhrz.lambda-url.us-east-1.on.aws/generate-qr?cht=qr&chl=https://${window.location.host}/outside/signature/${res.data.qrCodeToken}&chs=150x150`;
      })
    );

    //= =====> Switching tabs

    if (this.dialogData?.showOnlyDigitalAndExisting) {
      this.uploadSignListTitle = this.uploadSignListTitle.filter(
        (title) =>
          title.heading === 'Add New Signature' ||
          title.heading === 'Existing Signature'
      );
      // Auto populate username from local storage
      const username = this.localStorageService.getItem('username');
      if (username) {
        this.digitalSignVal = username;
        this.showDigitalSign(username);
      }
    }

    this.getpusherevent();
  }

  /**
   * @description  Sets `this.userId` from local storage and invokes `this.pusher` method.
   */
  getpusherevent() {
    this.userId = this.localStorageService.getItem('userId'); // puser
    if (this.userId) {
      this.pusher(this.userId);
    }
  }

  /**
   * @description Gets the pusher event from pusher js service using the channel name and user id.
   * Gets existing signs by invoking `this.getExisting` method.
   * @param id
   */
  pusher(id: string) {
    const channnelName = `check-signature-uploaded-${  id}`;
    this.subscriptions.push(
      this.pusherService
        .getEvent(channnelName, 'check-signature-uploaded-event')
        .subscribe((res) => {
          if (res) {
            this.getExistingSigns();
          }
        })
    );
  }

  /**
   * @description Remove the sign tip.
   */
  removeHint() {
    this.showSignTip = false;
  }

  /**
   * @description Method to sign from phone.
   * @param ev - keyup event.
   */
  signFromPhone(ev: Event) {
    this.signPhone = (ev.target as HTMLInputElement).value;

    if (this.signPhone.match(/(\([0-9]{3}\) |[0-9]{3}-)[0-9]{3}-[0-9]{4}$/g)) {
      this.phoneDisable = false;
    } else {
      this.phoneDisable = true;
    }
  }

  /**
   * @description Clears phone number.
   */
  clearPhoneNumber() {
    this.signPhone = '';
  }

  /**
   * @description Method to sign from tablet.
   * @param ev - keyup event.
   */
  signFromTablet(ev: Event) {
    this.signEmail = (ev.target as HTMLInputElement).value;
    if (
      this.signEmail.match(/^([\w-.]+@([\w-]+\.)+[\w-]{2,4})?$/) &&
      this.signEmail !== ''
    ) {
      this.emailDidable = false;
    } else {
      this.emailDidable = true;
    }
  }

  /**
   * @description Clears the email.
   */
  clearEmail() {
    this.signEmail = '';
  }

  /**
   * @description Method to upload signature file.
   * @param event input event
   */
  uploadSignFile(event: Event) {
    if (((event.target as HTMLInputElement).files as FileList)[0]) {
      const file = ((event.target as HTMLInputElement).files as FileList)[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.uploadSignImg = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * @description Removes the signature image.
   */
  removeShowImg() {
    this.uploadSignImg = '';
  }

  /**
   * @description Removes the digital signature.
   */
  clearDigitalSign() {
    this.digitalSignVal = '';
    this.digitalSign = '';
    this.initials = '';
    this.initialSignImg = '';
  }

  /**
   * @description Sets the digital signature and extracts initials from the name.
   * @param val - The name entered by the user
   */
  showDigitalSign(val: string) {
    this.digitalSign = val;
    this.digitalSignVal = this.digitalSign;

    // Extract initials from the name
    if (val && val.trim()) {
      this.initials = val
        .trim()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase())
        .join('');
      this.showCanInitialImg(); // Generate initials image
    } else {
      this.initials = '';
      this.initialSignImg = '';
    }

    if (val.trim().length >= 2) {
      this.customVal = true;
    } else {
      this.customVal = false;
    }
  }

  /**
   * @description Changes the font family of the digital signature
   * @param font - The selected font family
   */
  changeFontFamily(font: string) {
    this.selectedFont = font;
    if (this.digitalSignVal) {
      this.showDigitalSign(this.digitalSignVal);
      this.showCanImg();
      this.showCanInitialImg();
    }
  }

  /**
   * @description Creates canvas element for digital signature and sets canvas as an image source into `this.digitalSignImg` and returns it.
   * @returns `this.digitalSignImage`.
   */
  showCanImg() {
    const canvas = document.createElement('canvas');
    canvas.width = 250;
    canvas.height = this.dialogData?.showOnlyDigitalAndExisting ? 58 : 80;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.font = `25px ${this.selectedFont}`;
    ctx.fillText(this.digitalSignVal, 10, 50);
    this.digitalSignImg = canvas.toDataURL();
    return this.digitalSignImg;
  }

  /**
   * @description Creates canvas element for initials and sets canvas as an image source into `this.initialSignImg` and returns it.
   * @returns `this.initialSignImg`.
   */
  showCanInitialImg() {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 58;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.font = `25px ${this.selectedFont}`;
    ctx.fillText(this.initials, 10, 50);
    this.initialSignImg = canvas.toDataURL();
    return this.initialSignImg;
  }

  /**
   * @description Creates a larger canvas element for digital signature to be sent to the API.
   * Dynamically sizes the canvas to fit the text.
   * @returns Base64 encoded image string with larger dimensions.
   */
  private generateLargeDigitalSignImg(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const fontSize = 90;
    const padding = 20;

    // Set font to measure text
    ctx.font = `${fontSize}px ${this.selectedFont}`;
    const textMetrics = ctx.measureText(this.digitalSignVal);

    // Set canvas size based on text dimensions
    canvas.width = textMetrics.width + padding * 2;
    canvas.height = fontSize + padding * 2;

    // Re-apply font after resizing canvas (canvas resize clears context)
    ctx.font = `${fontSize}px ${this.selectedFont}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw text centered in canvas
    ctx.fillText(this.digitalSignVal, canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL();
  }

  //= ==> digital sign area end

  //= ==> pad sign area start
  private initSignaturePad() {
    this.signaturePad = new SignaturePad(this._signPad.nativeElement);
    this.signaturePad.addEventListener('beginStroke', this.drawStart);
    this.signaturePad.addEventListener('endStroke', this.drawComplete);
    this.signaturePad.clear();
  }

  /**
   * @description Clears the signature.
   * Sets `this.addPadSignBtn` to false.
   */
  clearSign() {
    this.signaturePad.clear();
    this.addPadSignBtn = false;
  }

  /**
   * @description Sets `this.addPadSignBtn` to false.
   */
  drawStart = () => {
    this.addPadSignBtn = false;
  };

  /**
   * @description Sets signature image to `this.signaturePadImg`.
   * Sets `this.addPadSignBtn` to false.
   */
  drawComplete = () => {
    this.signaturePadImg = this.signaturePad.toDataURL();
    this.addPadSignBtn = true;
  };

  /**
   * @description Gets the list of existing signatures and sets it to `this.existingAllSignatureImages`.
   */
  getExistingSigns() {
    this.deleteExistSign = true;
    this.existingSignatureLoading.set(true);
    this.subscriptions.push(
      this.bankAccService
        .getExistingPadImages(
          2,
          this.dialogData?.showOnlyDigitalAndExisting ? 'card' : undefined
        )
        .pipe(
          finalize(() => {
            this.deleteExistSign = false;
            this.existingSignatureLoading.set(false);
          })
        )
        .subscribe((res) => {
          this.existingAllSignatureImages = res.data;
          this.updateSelectedList();
        })
    );
  }

  selectedList: string;

  updateSelectedList() {
    const listHeading = this.existingAllSignatureImages.length
      ? 'Existing Signature'
      : 'Add New Signature';
    const list = this.uploadSignListTitle.find(
      (l) => l.heading === listHeading
    );
    if (list) {
      this.selectedList = list?.heading || listHeading;
      this.uploadSignListTitle = this.uploadSignListTitle.filter(
        (l) => l.heading !== listHeading
      );
      this.uploadSignListTitle.unshift(list);
    } else {
      this.selectedList = this.uploadSignListTitle[0].heading;
    }
  }

  /**
   * @description Sets list heading to `this.selectedList` and if it's equal to 'Existing Signature', invokes `this.getExistingSigns` method, to get the existing signatures list.
   * @param list - list heading
   */
  openMenuList(list: string) {
    this.selectedList = list;
  }

  customVal = false;

  /**
   * @description Select an existing signature (for grid click).
   */
  selectExistingSign(sign: IGetExistLogo) {
    this.selectedExistingSign = sign;
  }

  /**
   * @description Use selected existing signature.
   */
  useSelectedSignature() {
    if (!this.selectedExistingSign) return;
    this.signAddToCheck(this.selectedExistingSign.imageUrlNoAuth);
  }

  /**
   * @description Method to delete existing signatures.
   * @param event - click event.
   * @param id -id of single image.
   */
  deleteExistingSign(event: PointerEvent, id: number) {
    event.stopPropagation();

    this.deleteExistSign = true;
    this.subscriptions.push(
      this.bankAccService
        .deleteExistingSign(id, 2)
        .pipe(
          finalize(() =>
            setTimeout(() => {
              this.deleteExistSign = false;
            }, 650)
          )
        )
        .subscribe((resp) => {
          if (resp.success) {
            this.getExistingSigns();
          }
        })
    );
  }

  /**
   * @description Sets signature nickname exists or not.
   * @param ev - key up event.
   */
  getSignName(ev: Event) {
    if (ev.target === null) return;
    this.inputVal = (ev.target as HTMLInputElement).value;

    if ((ev.target as HTMLInputElement).value.length > 0) {
      this.signNameRequiredError = false;
      this.signNickNameVal = false;
    } else {
      this.signNickNameVal = true;
    }
  }

  /**
   * @description Adds the sign to the check.
   * @param img - image source.
   */
  signAddToCheck(img?: string) {
    if (
      this.selectedList !== 'Existing Signature' &&
      (!this.inputVal || this.inputVal.trim() === '')
    ) {
      this.signNameRequiredError = true;
      return;
    }
    this.signNameRequiredError = false;
    this.btnDesable = true;
    if (img) {
      this.existingSIgnImg = img;
    }

    if (this.selectedList === 'Sign on Screen') {
      this.signatureInfo = {
        signature: this.signaturePadImg,
        nickName: this.inputVal
      };
    }

    if (this.selectedList === 'Upload Signature') {
      this.signatureInfo = {
        signature: this.uploadSignImg as string,
        nickName: this.inputVal
      };
    }

    if (this.selectedList === 'Add New Signature') {
      this.showCanImg();
      this.showCanInitialImg();

      if (this.dialogData?.showOnlyDigitalAndExisting) {
        this.signatureInfo = {
          signature: this.digitalSignImg,
          nickName: this.inputVal,
          initial: this.initialSignImg
        };
      } else {
        this.signatureInfo = {
          signature: this.generateLargeDigitalSignImg(),
          nickName: this.inputVal,
          initial: this.initialSignImg
        };
      }
    }

    if (this.selectedList === 'Existing Signature') {
      this.dialogRef.close({
        signPad: this.signaturePadImg,
        existSign: this.existingSIgnImg,
        uploadSign: this.uploadSignImg,
        digitalSign: this.digitalSignImg,
        initial: this.initialSignImg
      });
    }

    //= => API POST ALL SIGNATURE
    if (
      this.selectedList === 'Sign on Screen' ||
      this.selectedList === 'Upload Signature' ||
      this.selectedList === 'Add New Signature'
    ) {
      this.subscriptions.push(
        this.bankAccService
          .SignSaveOnScreen(
            this.signatureInfo,
            this.dialogData?.showOnlyDigitalAndExisting ? 'card' : undefined
          )
          .pipe(
            finalize(() => {
              this.btnDesable = false;
            })
          )
          .subscribe((resp) => {
            if (resp.success === true) {
              this.dialogRef.close({
                signPad: this.signaturePadImg,
                existSign: this.existingSIgnImg,
                uploadSign: this.uploadSignImg,
                digitalSign: this.digitalSignImg,
                initials: this.initialSignImg,
                signatureUrl: resp.data.imageUrl
              });
            }
          })
      );
    }
  }

  /**
   * @description Skip for now — close without signature.
   */
  skipForNow() {
    this.dialogRef.close(false);
  }

  /**
   * @description Sends sms and opens success alert if succeeded.
   */
  textMe() {
    this.phoneDisable = true;
    const data = {
      phone: this.signPhone
    };
    this.subscriptions.push(
      this.bankAccService
        .sendSms(data)
        .pipe(
          finalize(() => {
            this.phoneDisable = true;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.signPhone = '';
            const alertData = {
              content: res.message,
              close: true
            };
            this.alertService.successAlert(alertData);
          }
        })
    );
  }

  /**
   * @description Sends email and opens success alert if succeeded.
   */
  sendEmail() {
    const data = {
      email: this.signEmail
    };
    this.emailDidable = true;

    this.subscriptions.push(
      this.bankAccService
        .sendEmail(data)
        .pipe(
          finalize(() => {
            this.emailDidable = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.signEmail = '';
            const alertData = {
              title: 'Success!',
              content: res.message,
              close: true,
              timeout: 1900
            };
            this.alertService.successAlert(alertData);
          }
        })
    );
  }
}
