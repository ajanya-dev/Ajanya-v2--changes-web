import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import { IImageCategories } from 'src/app/models/check-design';
import { IGetExistLogo } from 'src/app/models/common';
import { LogoUploadPanelComponent } from 'src/app/shared/components/upload-panel/logo-upload-panel/logo-upload-panel.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { OcwPreventMultiClickDirective } from '../../../../directive/ocw-prevent-multi-click.directive';
import { MatTabGroup, MatTab } from '@angular/material/tabs';

/**
 * @description Represents the Logos Menu Component responsible for managing and displaying logos.
 * This component handles the display of uploaded logos and clipboard logos, allowing users
 * to add selected logos to the canvas, manage logo categories, and perform logo-related actions.
 */
@Component({
  selector: 'app-logos-menu',
  templateUrl: './logos-menu.component.html',
  styleUrls: ['./logos-menu.component.scss'],
  standalone: true,
  imports: [
    MatTabGroup,
    MatTab,
    OcwPreventMultiClickDirective,
    NgClass,
    FormsModule
  ]
})
export class LogosMenuComponent implements OnInit, OnDestroy {
  public alertService = inject(AlertService);
  public canvasService = inject(CheckdesignCanvasService);
  public checkDesignService = inject(CheckDesignService);
  public dialog = inject(MatDialog);

  imageUploads: IGetExistLogo[] = [];
  clipboardImages: IGetExistLogo[] = [];
  monograms: IGetExistLogo[] = [];
  categories: IImageCategories[] = [];
  logoUrl: string;

  subscriptions: Subscription[] = [];
  categoryId = 0;
  isShowMonogram = false;
  clipBoardState = {
    page: 1,
    disablePrevBtn: true,
    disableNextBtn: true
  };

  uploadState = {
    page: 1,
    disablePrevBtn: true,
    disableNextBtn: true
  };

  paginationItemCount = 28;

  ngOnInit(): void {
    this.subscriptions.push(
      this.canvasService.activeMenu$.subscribe((menu) => {
        if (menu.name === 'menu-logos') {
          if (!this.imageUploads.length) {
            this.getUploadedLogos(this.categoryId);
          }
          if (!this.clipboardImages.length) {
            this.getClipboardImages(this.categoryId);
          }
          if (!this.categories.length) {
            this.getCategory();
          }
          if (!this.monograms.length && this.isShowMonogram) {
            this.getClipboardMonograms(this.categoryId);
          }
        }
      })
    );
  }

  /**
   * @description Adds a logo image to the canvas.
   * @param imgSrc - The source URL of the logo image.
   * @param id - The ID of the logo image.
   */
  addImageToCanvas(imgSrc: string, id?: string) {
    this.canvasService.addImage(imgSrc, id);
  }

  /**
   * @description Retrieves logo categories for the design.
   */
  getCategory() {
    this.subscriptions.push(
      this.checkDesignService
        .getImagesCategories(1)
        .pipe(first())
        .subscribe((data) => {
          this.categories = data?.data;
        })
    );
  }

  /**
   * @description @description Method to get uploaded logos, with pagination.
   * @param type - Optional- If the method is invoked to switch between pages,
   * type will be 'prev' for previous page and 'next' for next page.
   */
  getUploadedLogos(categoryId: number, type?: 'prev' | 'next') {
    if (type !== undefined) {
      if (type === 'prev') {
        if (
          this.uploadState.page <= 1 ||
          this.uploadState.disablePrevBtn === true
        )
          return;
        this.uploadState.page -= 1;
      } else if (type === 'next') {
        if (this.uploadState.disableNextBtn === true) return;
        this.uploadState.page += 1;
      }
    } else {
      this.uploadState.page = 1;
    }

    this.subscriptions.push(
      this.checkDesignService
        .getImages(this.uploadState.page, 1, 1, 1, categoryId)
        .subscribe((data) => {
          this.imageUploads = data?.data;
          if (data?.data.length < this.paginationItemCount) {
            this.uploadState.disableNextBtn = true;
          } else {
            this.uploadState.disableNextBtn = false;
          }

          if (this.uploadState.page > 1) {
            this.uploadState.disablePrevBtn = false;
          } else {
            this.uploadState.disablePrevBtn = true;
          }
        })
    );
  }

  /**
   * @description @description Method to get clipboard logos, with pagination.
   * @param category - Category number.
   * @param type - Optional- If the method is invoked to switch between pages,
   * type will be 'prev' for previous page and 'next' for next page.
   */
  getClipboardImages(category: number, type?: 'prev' | 'next') {
    if (type !== undefined) {
      if (type === 'prev') {
        if (
          this.clipBoardState.page <= 1 ||
          this.clipBoardState.disablePrevBtn === true
        )
          return;
        this.clipBoardState.page -= 1;
      } else if (type === 'next') {
        if (this.clipBoardState.disableNextBtn === true) return;
        this.clipBoardState.page += 1;
      }
    } else {
      this.clipBoardState.page = 1;
    }

    this.subscriptions.push(
      this.checkDesignService
        .getImages(this.clipBoardState.page, 1, 2, 1, category)
        .pipe(first())
        .subscribe((data) => {
          this.clipboardImages = data?.data;
          if (data?.data.length < this.paginationItemCount) {
            this.clipBoardState.disableNextBtn = true;
          } else {
            this.clipBoardState.disableNextBtn = false;
          }

          if (this.clipBoardState.page > 1) {
            this.clipBoardState.disablePrevBtn = false;
          } else {
            this.clipBoardState.disablePrevBtn = true;
          }
        })
    );
  }

  /**
   * @description Retrieves clipboard monogram images based on the specified category.
   * @param category - The category ID for filtering clipboard monogram images.
   */
  getClipboardMonograms(category = 0, page = 1) {
    this.subscriptions.push(
      this.checkDesignService
        .getImages(page, 1, 2, 2, category)
        .pipe(first())
        .subscribe((data) => {
          this.monograms = data?.data;
        })
    );
  }

  changeCategory(type: string, categoryId: number) {
    if (type === 'color') {
      this.getClipboardImages(categoryId);
    } else if (type === 'monograms') {
      this.getClipboardMonograms(categoryId);
    }
    this.categoryId = categoryId;
  }

  /**
   * @description Deletes a logo image from the design.
   * @param logoId - The ID of the logo image to be deleted.
   */
  deleteLogo(logoId: string) {
    const data = {};
    const alertRef = this.alertService.confirmAlert(data);
    alertRef.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.checkDesignService
            .deleteImage(logoId, 1)
            .pipe(first())
            .subscribe((success) => {
              if (success?.success) {
                this.alertService.successAlert({
                  title: 'Deleted',
                  content: ' ',
                  close: true,
                  timeout: 2000
                });
                this.filterLogos(logoId);
              }
            })
        );
      }
    });
  }

  /**
   * @description Uploads a logo image and adds it to the list of uploaded logos.
   * @param type - The type of logo upload.
   * @param files - The files to be uploaded.
   * @param nickName - The nickname for the uploaded logo.
   */
  uploadImage(type: number, files: File[], nickName?: string) {
    if (!files) {
      return;
    }
    this.subscriptions.push(
      this.checkDesignService
        .uploadImage(type, files[0], nickName)
        .pipe(first())
        .subscribe((data) => {
          if (data?.success) {
            this.imageUploads.unshift(data?.data);
          }
        })
    );
  }

  /**
   * @description Opens the file picker dialog for selecting logo images to upload.
   */
  openFilePicker() {
    document.getElementById('upload_new_logo')?.click();
  }

  /**
   * @description Filters out deleted logos from the list of uploaded logos.
   * @param id - The ID of the logo to filter out.
   */
  filterLogos(id: string) {
    this.imageUploads = this.imageUploads.filter((ele) => ele.id !== id);
  }

  openLogoModal() {
    this.alertService.infoAlert({ content: 'Coming Soon!', close: true });
    return;
    const dialogRef = this.dialog.open(LogoUploadPanelComponent, {
      maxWidth: '850px',
      width: '95%',
      panelClass: 'upload_panel_wrapper',
      minHeight: '550px',
      disableClose: true
    });

    dialogRef
      .afterClosed()
      .subscribe(
        (logoImg: {
          logoUrl: string;
          uploadLogo?: string;
          existImg?: string;
          saveLogoResponseData?: IGetExistLogo;
        }) => {
          if (logoImg?.saveLogoResponseData) {
            this.imageUploads.unshift(logoImg?.saveLogoResponseData);
          }
        }
      );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
