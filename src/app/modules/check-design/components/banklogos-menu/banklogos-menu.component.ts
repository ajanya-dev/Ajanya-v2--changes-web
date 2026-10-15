import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { IImageCategories } from 'src/app/models/check-design';
import { IGetExistLogo } from 'src/app/models/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { FormsModule } from '@angular/forms';
import { OcwPreventMultiClickDirective } from '../../../../directive/ocw-prevent-multi-click.directive';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { MatTabGroup, MatTab } from '@angular/material/tabs';

/**
 * @description component responsible for managing bank logos (Menu Component).
 */
@Component({
  selector: 'app-banklogos-menu',
  templateUrl: './banklogos-menu.component.html',
  styleUrls: ['./banklogos-menu.component.scss'],
  standalone: true,
  imports: [
    MatTabGroup,
    MatTab,
    NgFor,
    NgIf,
    OcwPreventMultiClickDirective,
    NgClass,
    FormsModule
  ]
})
export class BanklogosMenuComponent implements OnInit, OnDestroy {
  //type=5&table=1

  imageUploads: IGetExistLogo[] = [];
  clipboardImages: IGetExistLogo[] = [];
  monograms: IGetExistLogo[] = [];
  categories: IImageCategories[] = [];

  subscriptions: Subscription[] = [];
  category = 0;
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

  constructor(
    public _alertService: AlertService,
    public canvasService: CheckdesignCanvasService,
    public checkDesignService: CheckDesignService
  ) {}

  ngOnInit(): void {
    this.canvasService.activeMenu$.subscribe((menu) => {
      if (menu.name === 'menu-banklogos') {
        if (!this.imageUploads.length) {
          this.getUploadedImages();
        }
        if (!this.clipboardImages.length) {
          this.getClipboardImages(this.category);
        }
        if (!this.categories.length) {
          this.getCategory();
        }
        if (!this.monograms?.length && this.isShowMonogram) {
          this.getClipboardMonograms(this.category);
        }
      }
    });
  }

  /**
   * @description Adds an image to the canvas.
   * @param imgSrc - Image source URL.
   */
  addImageToCanvas(imgSrc: string) {
    this.canvasService.addImage(imgSrc);
  }

  /**
   * @description @description Method to get uploaded logos, with pagination.
   * @param type - Optional- If the method is invoked to switch between pages,
   * type will be 'prev' for previous page and 'next' for next page.
   */
  getUploadedImages(type?: 'prev' | 'next') {
    if (type !== undefined) {
      if (type === 'prev') {
        if (
          this.uploadState.page <= 1 ||
          this.uploadState.disablePrevBtn === true
        )
          return;
        this.uploadState.page--;
      } else if (type === 'next') {
        if (this.uploadState.disableNextBtn === true) return;
        this.uploadState.page++;
      }
    } else {
      this.uploadState.page = 1;
    }

    this.subscriptions.push(
      this.checkDesignService
        .getImages(this.uploadState.page, 5, 1)
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
        this.clipBoardState.page--;
      } else if (type === 'next') {
        if (this.clipBoardState.disableNextBtn === true) return;
        this.clipBoardState.page++;
      }
    } else {
      this.clipBoardState.page = 1;
    }

    this.subscriptions.push(
      this.checkDesignService
        .getImages(this.clipBoardState.page, 5, 2, 1, category)
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
   * @description Retrieves clipboard monograms from the server.
   * Monograms: folder = 2
   * @param category - Category of monograms, default is 0.
   */
  getClipboardMonograms(category: number, page = 1) {
    this.subscriptions.push(
      this.checkDesignService
        .getImages(page, 5, 2, 2, category)
        .subscribe((data) => {
          this.monograms = data?.data;
        })
    );
  }

  /**
   * @description Retrieves image categories from the server.
   */
  getCategory() {
    this.subscriptions.push(
      this.checkDesignService.getImagesCategories(5).subscribe((data) => {
        this.categories = data?.data;
      })
    );
  }

  changeCategory(type: string, categoryId: number) {
    if (type === 'color') {
      this.getClipboardImages(categoryId);
    } else if (type === 'monograms') {
      this.getClipboardMonograms(categoryId);
    }
    this.category = categoryId;
  }

  /**
   * @description Uploads an image to the server.
   * @param type - Type of image upload.
   * @param files - Image files to upload.
   * @param nickName - Nickname for the image (optional).
   */
  uploadImage(type: number, files: File[], nickName?: string) {
    if (!files) {
      return;
    }

    this.checkDesignService
      .uploadImage(type, files[0], nickName)
      .subscribe((data) => {
        if (data?.success) {
          this.imageUploads.unshift(data?.data);
        }
      });
  }

  /**
   * @description Opens the file picker for image upload.
   */
  openFilePicker() {
    document.getElementById('upload_bank_logo')?.click();
  }

  /**
   * @description Filters uploaded logos based on ID.
   * @param id - ID of the logo to filter.
   */
  filterLogos(id: string) {
    this.imageUploads = this.imageUploads.filter((ele) => {
      return ele.id !== id;
    });
  }

  /**
   * @description Deletes a logo image.
   * @param logoId - ID of the logo to delete.
   */
  deleteLogo(logoId: string) {
    const data = {};
    const alertRef = this._alertService.confirmAlert(data);
    alertRef.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.checkDesignService.deleteImage(logoId, 5).subscribe(
            (success) => {
              if (success?.success) {
                this._alertService.successAlert({
                  title: success.message,
                  content: ' '
                });
                this.filterLogos(logoId);
              }
            },
            (err) => {
              this._alertService.failedAlert({
                title: err.errorMsg,
                content: ' '
              });
            }
          )
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
