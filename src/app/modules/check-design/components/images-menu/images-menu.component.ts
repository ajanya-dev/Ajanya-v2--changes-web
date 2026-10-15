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
 * @description Represents the Images Menu Component responsible for managing and displaying images.
 * This component handles the display of uploaded images, clipboard images, and monograms,
 * allowing users to add selected images to the canvas and manage image categories.
 */
@Component({
  selector: 'app-images-menu',
  templateUrl: './images-menu.component.html',
  styleUrls: ['./images-menu.component.scss'],
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
export class ImagesMenuComponent implements OnInit, OnDestroy {
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
      if (menu.name === 'menu-images') {
        if (!this.imageUploads?.length) {
          this.getUploadedImages();
        }
        if (!this.clipboardImages?.length) {
          this.getClipboardImages(this.category);
        }
        if (!this.categories?.length) {
          this.getCategory();
        }
        if (!this.monograms.length && this.isShowMonogram) {
          this.getClipboardMonograms(this.category);
        }
      }
    });
  }

  /**
   * @description Adds the selected image to the canvas.
   * @param imgSrc - The source of the image to be added.
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
        .getImages(this.uploadState.page, 3, 1)
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
        .getImages(this.clipBoardState.page, 3, 2, 1, category)
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
   * @description Retrieves monogram images based on the specified category.
   * @param category - The category ID for filtering monogram images (default is 0).
   */
  getClipboardMonograms(category: number, page = 1) {
    this.subscriptions.push(
      this.checkDesignService
        .getImages(page, 3, 2, 2, category)
        .subscribe((data) => {
          this.monograms = data?.data;
        })
    );
  }

  /**
   * @description Retrieves image categories for the design.
   */
  getCategory() {
    this.subscriptions.push(
      this.checkDesignService.getImagesCategories(3).subscribe((data) => {
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
   * @description Uploads an image and adds it to the list of uploaded images.
   * @param type - The type of image upload (e.g., 1 for uploads, 2 for clipboard).
   * @param files - The files to be uploaded.
   * @param nickName - The nickname for the uploaded image.
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
   * @description Opens the file picker dialog for selecting images to upload.
   */
  openFilePicker() {
    document.getElementById('upload_image')?.click();
  }

  /**
   * @description Filters out deleted logos from the list of uploaded images.
   * @param id - The ID of the logo to filter out.
   */
  filterLogos(id: string) {
    this.imageUploads = this.imageUploads.filter((ele) => {
      return ele.id !== id;
    });
  }

  /**
   * @description Deletes a logo image from the design.
   * @param logoId - The ID of the logo image to be deleted.
   */
  deleteLogo(logoId: string) {
    const data = {};
    const alertRef = this._alertService.confirmAlert(data);
    alertRef.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.checkDesignService
            .deleteImage(logoId, 1)
            .subscribe((success) => {
              if (success?.success) {
                this._alertService.successAlert({
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

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
