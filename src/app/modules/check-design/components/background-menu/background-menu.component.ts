import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ICheckDesign, IImageCategories } from 'src/app/models/check-design';
import { IGetExistLogo } from 'src/app/models/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { OcwPreventMultiClickDirective } from '../../../../directive/ocw-prevent-multi-click.directive';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { MatTabGroup, MatTab } from '@angular/material/tabs';

/**
 * @description Responsible for managing background images and settings. (Menu Component)
 */
@Component({
  selector: 'app-background-menu',
  templateUrl: './background-menu.component.html',
  styleUrls: ['./background-menu.component.scss'],
  standalone: true,
  imports: [
    MatTabGroup,
    MatTab,
    MatSlider,
    MatSliderThumb,
    FormsModule,
    NgClass,
    NgFor,
    NgIf,
    OcwPreventMultiClickDirective
  ]
})
export class BackgroundMenuComponent implements OnInit, OnDestroy {
  imageUploads: IGetExistLogo[] = [];
  clipboardImages: IGetExistLogo[] = [];
  monograms: IGetExistLogo[] = [];
  categories: IImageCategories[] = [];
  opacity = 30;

  subscriptions: Subscription[] = [];

  //bg
  height = { value: 150, stretch: true };
  width = { value: 300, stretch: true };
  backgroundImage: {
    src?: string;
    element?:
      | HTMLImageElement
      | {
          naturalWidth: number;
          naturalHeight: number;
        };
  } = {};
  imageScaleFactorX = 1; // to stretch to canvas width
  imageScaleFactorY = 1; // to stretch to canvas Height
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
      if (menu.name === 'menu-background') {
        if (!this.imageUploads.length) {
          this.getUploadedImages();
        }
        if (!this.clipboardImages.length) {
          this.getClipboardImages(this.category);
        }
        if (!this.categories.length) {
          this.getCategory();
        }
        if (!this.monograms.length && this.isShowMonogram) {
          this.getClipboardMonograms(this.category);
        }
      }
    });
  }

  /**
   * @description Sets the background image of the canvas.
   * @param img - Image URL to set as the background.
   * @param imgEle - HTMLImageElement for calculating scaling factor.
   */
  setBackground(img?: string, imgEle?: HTMLImageElement) {
    const canvasWidth = 675;
    const canvasHeight = 240;
    const newWidth = this.width.stretch ? canvasWidth : this.width.value;
    const newHeight = this.height.stretch ? canvasHeight : this.height.value;

    if (!img && !this.backgroundImage?.src) {
      if (
        (this.canvasService.bankVariables.checkDesign as ICheckDesign)
          ?.backgroundImage
      ) {
        const backgroundImage = (
          this.canvasService.bankVariables.checkDesign as ICheckDesign
        ).backgroundImage;
        if (backgroundImage?.src) {
          this.backgroundImage.src = backgroundImage?.src;
          this.backgroundImage.element =
            this.canvasService.initialBackgroundMeta;
        }
        if (backgroundImage?.width) this.width.value = backgroundImage?.width;
        if (backgroundImage?.height)
          this.height.value = backgroundImage?.height;
        if (backgroundImage?.scaleX)
          this.imageScaleFactorX = backgroundImage?.scaleX;
        if (backgroundImage?.scaleY)
          this.imageScaleFactorY = backgroundImage?.scaleY;
        if (backgroundImage?.opacity)
          this.opacity = backgroundImage?.opacity * 100;
        if (backgroundImage?.width) this.width.stretch = false;
        if (backgroundImage?.height) this.height.stretch = false;
        if (backgroundImage?.width === canvasWidth) this.width.stretch = true;
        if (backgroundImage?.height === canvasHeight)
          this.height.stretch = true;
      } else {
        return;
      }
    }

    if (img) {
      this.backgroundImage = {
        src: img,
        element: imgEle
      };
    }
    if (this.backgroundImage.element?.naturalHeight && this.height.stretch) {
      this.imageScaleFactorY = this.getScaleFactor(
        canvasHeight,
        this.backgroundImage.element.naturalHeight
      );
    } else {
      this.imageScaleFactorY = 1;
    }
    if (this.backgroundImage.element?.naturalWidth && this.width.stretch) {
      this.imageScaleFactorX = this.getScaleFactor(
        canvasWidth,
        this.backgroundImage.element.naturalWidth
      );
    } else {
      this.imageScaleFactorX = 1;
    }

    this.canvasService.canvas.setBackgroundImage(
      this.backgroundImage.src as string,
      this.canvasService.canvas.renderAll.bind(this.canvasService.canvas),
      {
        opacity: this.opacity / 100,
        width: newWidth,
        height: newHeight,
        left: 0,
        top: 0,
        originX: 'left',
        originY: 'top',
        scaleX: this.imageScaleFactorX,
        scaleY: this.imageScaleFactorY,
        crossOrigin: 'anonymous'
      }
    );
  }

  /**
   * @description Deletes the background image from the canvas.
   */
  deleteBackground() {
    this.canvasService.deleteBackground();
    this.backgroundImage = {};
  }

  /**
   * @description Changes the size of the background image.
   * @param operator - Operator (+/-) for size change.
   * @param xy - Dimension to change (width/height).
   */
  changeSize(operator: string, xy: string) {
    const currentHeight = this.height.value * 1;
    const currentWidth = this.width.value * 1;
    if (xy === 'height') {
      if (operator === '+' && currentHeight + 1 > 240) {
        return;
      }
      this.height.value =
        operator === '+' ? currentHeight + 1 : currentHeight - 1;
    } else if (xy === 'width') {
      if (operator === '+' && currentWidth + 1 > 675) {
        return;
      }
      this.width.value = operator === '+' ? currentWidth + 1 : currentWidth - 1;
    }

    this.bgSizeChange(xy);
  }

  /**
   * @description Handles changes in the background size.
   * @param xy - Dimension that changed (width/height).
   */
  bgSizeChange(xy: string) {
    // disable stretch on input
    if (xy === 'width') {
      this.width.stretch = false;
      if (typeof this.width.value !== 'number') {
        try {
          this.width.value = new Number(this.width.value) as number;
        } catch (error) {
          // Ignore
        }
      }
    } else if (xy === 'height') {
      this.height.stretch = false;
      if (typeof this.height.value !== 'number') {
        try {
          this.height.value = new Number(this.height.value) as number;
        } catch (error) {
          // Ignore
        }
      }
    }

    // max width & height
    if (xy === 'width' && this.width.value > 675) {
      this.width.value = 675;
    } else if (xy === 'height' && this.height.value > 240) {
      this.height.value = 240;
    }

    if (!(this.width.stretch && this.height.stretch)) {
      this.setBackground();
    }
  }

  /**
   * @description Calculates the scaling factor based on canvas and image width.
   * @param canvasWidth - Canvas width.
   * @param imageWidth - Image width.
   * @returns Scaling factor.
   */
  getScaleFactor(canvasWidth: number, imageWidth: number): number {
    if (canvasWidth >= imageWidth) {
      return canvasWidth / imageWidth;
    }
    return 1;
  }

  /**
   * @description Method to get uploaded logos, with pagination.
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
        .getImages(this.uploadState.page, 4, 1)
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
   * @description Method to get clipboard logos, with pagination.
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
        .getImages(this.clipBoardState.page, 4, 2, 1, category)
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
   * @description Retrieves clipboard images from the server.
   * Monograms: folder = 2
   * @param category - Category of images (optional).
   */
  getClipboardMonograms(category: number, page = 1) {
    this.subscriptions.push(
      this.checkDesignService
        .getImages(page, 4, 2, 2, category)
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
      this.checkDesignService.getImagesCategories(4).subscribe((data) => {
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
          this.setBackgroundAfterUpload(data.data);
        }
      });
  }

  /**
   * @description Sets the background after an image upload.
   * @param data - Uploaded image data.
   */
  setBackgroundAfterUpload(data: IGetExistLogo) {
    const imgEle = new Image();
    imgEle.onload = () => {
      this.setBackground(imgEle.src, imgEle);
    };
    imgEle.src = data?.imageUrlNoAuth;
  }

  /**
   * @description Opens the file picker for image upload.
   */
  openFilePicker() {
    document.getElementById('upload_background_logo')?.click();
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
          this.checkDesignService
            .deleteImage(logoId, 4)
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

  /**
   * @description *ngFor trackBy function for image uploads
   * @param _index - Index.
   * @param item - Image.
   * @returns Item Id.
   */
  trackByFnImageUploads(_index: number, item: IGetExistLogo) {
    return item.id;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
