import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { IImageCategories } from 'src/app/models/check-design';
import { IGetExistLogo } from 'src/app/models/common';
import { CheckDesignService } from 'src/app/shared/service/check-design/check-design.service';
import { CheckdesignCanvasService } from 'src/app/shared/service/check-design/checkdesign-canvas.service';
import { OcwPreventMultiClickDirective } from '../../../../directive/ocw-prevent-multi-click.directive';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * @description Represents the Icons Menu Component responsible for managing and displaying icons.
 * This component handles the display of color icons and monograms, allowing users to add selected images to the canvas.
 */
@Component({
  selector: 'app-icons-menu',
  templateUrl: './icons-menu.component.html',
  styleUrls: ['./icons-menu.component.scss'],
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, OcwPreventMultiClickDirective, NgClass]
})
export class IconsMenuComponent implements OnInit, OnDestroy {
  colorIcons: IGetExistLogo[] = [];
  monograms: IGetExistLogo[] = [];
  categories: IImageCategories[] = [];

  subscriptions: Subscription[] = [];
  category = 0;
  isShowMonogram = false;
  colorIconState = {
    page: 1,
    disablePrevBtn: true,
    disableNextBtn: true
  };
  paginationItemCount = 28;

  constructor(
    public canvasService: CheckdesignCanvasService,
    public checkDesignService: CheckDesignService
  ) {}

  ngOnInit(): void {
    this.canvasService.activeMenu$.subscribe((menu) => {
      if (menu.name === 'menu-icons') {
        if (!this.colorIcons?.length) {
          this.getColorIcons(this.category);
        }
        if (!this.monograms?.length && this.isShowMonogram) {
          this.getMonograms(this.category);
        }
        if (!this.categories.length) {
          this.getCategory();
        }
      }
    });
  }

  /**
   * @description Method to get color icons, with pagination.
   * @param category - Category number.
   * @param type - Optional- If the method is invoked to switch between pages,
   * type will be 'prev' for previous page and 'next' for next page.
   */
  getColorIcons(category: number, type?: 'prev' | 'next') {
    if (type !== undefined) {
      if (type === 'prev') {
        if (
          this.colorIconState.page <= 1 ||
          this.colorIconState.disablePrevBtn === true
        )
          return;
        this.colorIconState.page--;
      } else if (type === 'next') {
        if (this.colorIconState.disableNextBtn === true) return;
        this.colorIconState.page++;
      }
    } else {
      this.colorIconState.page = 1;
    }

    this.subscriptions.push(
      this.checkDesignService
        .getImages(this.colorIconState.page, 6, 2, 1, category)
        .subscribe((data) => {
          this.colorIcons = data?.data;
          if (data?.data.length < this.paginationItemCount) {
            this.colorIconState.disableNextBtn = true;
          } else {
            this.colorIconState.disableNextBtn = false;
          }

          if (this.colorIconState.page > 1) {
            this.colorIconState.disablePrevBtn = false;
          } else {
            this.colorIconState.disablePrevBtn = true;
          }
        })
    );
  }

  /**
   * @description Retrieves monogram images based on the specified category.
   * @param category - The category ID for filtering monograms.
   */
  getMonograms(category: number, page = 1) {
    this.subscriptions.push(
      this.checkDesignService
        .getImages(page, 6, 2, 2, category)
        .subscribe((data) => {
          this.monograms = data?.data;
        })
    );
  }

  /**
   * @description Retrieves image categories.
   */
  getCategory() {
    this.subscriptions.push(
      this.checkDesignService.getImagesCategories(6).subscribe((data) => {
        this.categories = data?.data;
      })
    );
  }

  /**
   * @description Adds the selected image to the canvas.
   * @param imgSrc - The source of the image to be added.
   */
  addImageToCanvas(imgSrc: string) {
    this.canvasService.addImage(imgSrc);
  }

  changeCategory(type: string, categoryId: number) {
    if (type === 'color') {
      this.getColorIcons(categoryId);
    } else if (type === 'monograms') {
      this.getMonograms(categoryId);
    }
    this.category = categoryId;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
