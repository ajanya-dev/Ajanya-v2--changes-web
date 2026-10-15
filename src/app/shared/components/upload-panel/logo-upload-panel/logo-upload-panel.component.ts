import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MatDialogClose
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { UploadPad } from 'src/app/data/data/uploadPad';
import { IGetExistLogo } from 'src/app/models/common';
import { LogoUploadModalComponent } from 'src/app/modules/bank-design/modals/logo-upload-modal/logo-upload-modal.component';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { NgFor, NgClass, NgIf } from '@angular/common';

/**
 * @description Component for logo upload.
 */
@Component({
  selector: 'app-logo-upload-panel',
  templateUrl: './logo-upload-panel.component.html',
  styleUrls: ['./logo-upload-panel.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgFor, NgClass, NgIf]
})
export class LogoUploadPanelComponent implements OnInit, OnDestroy {
  companyName: string;
  uploadLogoListTitle = UploadPad.logoPadTitles();
  uploadLogoImg = '';
  existingLogoImg = '';
  subscriptions: Subscription[] = [];
  existingAllLogosImages: IGetExistLogo[];
  deleteExistLogo = false;
  logo: string | Blob;
  btnDesable = false;

  formData = new FormData();
  generatedAIImages: string[] = [];
  aiImageContainer = false;
  loading = false;
  isLoading = false;
  selectedGeneratedImage: string;

  constructor(
    public __dialogRef: MatDialogRef<LogoUploadPanelComponent>,
    private bankAccService: BankAccountsService,
    private _dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.selectedList = this.uploadLogoListTitle[0].heading;
    this.getExistingLogos();
    this.companyName = this.bankAccService.companyName;
    this.generateLogo();
  }

  /**
   * @description Gets the list of existing logos and sets them to `this.existingAllLogosImage`.
   */
  getExistingLogos() {
    this.deleteExistLogo = true;
    this.subscriptions.push(
      this.bankAccService
        .getExistingPadImages(1)
        .pipe(finalize(() => (this.deleteExistLogo = false)))
        .subscribe((res) => {
          this.existingAllLogosImages = res.data;
        })
    );
  }

  selectedList: string;

  /**
   * @description Sets list heading to `this.selectedList` and if it's equal to 'Existing Logos', invokes `this.getExistingLogos` method.
   * @param list - list heading
   */
  openMenuList(list: string) {
    this.selectedList = list;
    this.companyName = this.bankAccService.companyName;
    //==> Get the existing Logos
    if (this.selectedList == 'Existing Logos') {
      this.getExistingLogos();
    }
  }

  /**
   * @description Method to upload image file.
   * @param event
   */
  uploadImgFile(event: Event) {
    if (event.target === null) return;
    this.logo = ((event.target as HTMLInputElement).files as FileList)[0];

    if (this.logo) {
      const file = this.logo;

      const reader = new FileReader();
      // reader.onload = e => this.uploadLogoImg = reader.result;
      reader.readAsDataURL(file);
    }
    this.openDialog(event);
  }

  /**
   * @description Opens dialog for image upload and sets the uploaded image to `this.uploadLogoImg`.
   * @param event - file upload input event.
   */
  openDialog(event: Event) {
    const dialogRef = this._dialog.open(LogoUploadModalComponent, {
      maxWidth: '500px',
      width: '93%',
      data: { event: event }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res?.image) {
        this.uploadLogoImg = res.image;
      } else {
        this.uploadLogoImg = '';
      }
    });
  }

  /**
   * @description Sets `this.uploadLogoImg` to ''.
   */
  remoteUploadImg() {
    this.uploadLogoImg = '';
  }

  /**
   * @description Method to delete existing logo.
   * @param event - click event.
   * @param id -id of single image.
   */
  deleteExistingLogo(event: PointerEvent, id: number) {
    event.stopPropagation();

    this.deleteExistLogo = true;
    this.subscriptions.push(
      this.bankAccService
        .deleteExistingLogos(id, 1)
        .pipe(
          finalize(() => {
            setTimeout(() => {
              this.deleteExistLogo = false;
            }, 600);
          })
        )
        .subscribe((resp) => {
          if (resp.success) {
            this.getExistingLogos();
          }
        })
    );
  }

  /**
   * @description Adds the logo to the check.
   * @param img - image source.
   */

  logoAddToCheck(img: string, heading?: string) {
    this.btnDesable = true;

    // let fileName = item.fileName

    this.existingLogoImg = img;

    if (heading == 'Existing Logos') {
      this.__dialogRef.close({
        uploadLogo: this.uploadLogoImg,
        existImg: this.existingLogoImg
      });
    }

    if (heading == 'Upload Logo') {
      this.formData.append('photo', this.logo);

      this.subscriptions.push(
        this.bankAccService
          .logoSaveOnScreen(this.formData)
          .pipe(finalize(() => (this.btnDesable = false)))
          .subscribe((resp) => {
            if (resp.success == true) {
              this.__dialogRef.close({
                uploadLogo: this.uploadLogoImg,
                existImg: this.existingLogoImg,
                logoUrl: resp.data.imageUrl
              });
            }
          })
      );
    }
  }

  openAITab() {
    this.selectedList = 'AI Logo';
  }

  generateLogo() {
    this.aiImageContainer = false;
    if (this.loading) {
      return;
    }
    this.loading = true;
    const data = {
      numberOfImages: 10,
      size: '256x256' //we can get this sizes only ['256x256', '512x512', '1024x1024']
    };
    this.subscriptions.push(
      this.bankAccService
        .generateAILogo(data)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((res) => {
          this.generatedAIImages = res?.data;
          this.aiImageContainer = true;
        })
    );
  }

  selectGeneratedImage(imageUrl: string) {
    this.selectedGeneratedImage = imageUrl;
  }

  saveGeneratedLogo() {
    if (this.isLoading) {
      return;
    }
    this.isLoading = true;
    const formData = {
      type: 1,
      imageUrl: this.selectedGeneratedImage
    };
    this.subscriptions.push(
      this.bankAccService
        .savAiImage(formData)
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.__dialogRef.close({
              uploadLogo: res.data.imageUrlNoAuth,
              logoUrl: res.data?.imageUrl,
              saveLogoResponseData: res.data
            });
          }
        })
    );
  }

  /**
   * @description Function for ngFor trackBy.
   * @param index - Index.
   * @param item - Item.
   */
  trackById(index: number, item: { id: string }) {
    return item.id;
  }

  /**
   * @description Function for ngFor trackBy.
   * @param index - Index.
   * @param item - Item.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackByIndex(index: number, item: any) {
    return index;
  }

  ngOnDestroy() {
    this.bankAccService.companyName = '';
    this.subscriptions?.forEach((sub) => {
      sub?.unsubscribe();
    });
  }
}
