import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subscription } from 'rxjs';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { CategoryService } from 'src/app/shared/service/category/category.service';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';

/**
 * @description Drop down component for category with multi select.
 */
@Component({
  standalone: true,
  imports: [NgSelectModule, FormsModule, CommonModule],
  selector: 'app-drop-down-category-multi-select',
  templateUrl: './drop-down-category-multi-select.component.html',
  styleUrls: ['./drop-down-category-multi-select.component.scss']
})
export class DropDownCategoryMultiSelectComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Select Category';
  @Input() dropdownPosition = 'bottom';
  @Input() appendTo = 'ng-select';
  @Input() selectedId!: string;
  @Output() selectionEvent = new EventEmitter();

  selectedItem: string | null;
  page = 1;
  searchTerm = '';
  categories: ICategoryDropdown[] = [];
  subscriptions: Subscription[] = [];
  searchTimeout: ReturnType<typeof setTimeout>;

  constructor(
    private _categoryService: CategoryService,
    private _sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.getNewCreatedCategoryData();
  }

  /**
   * @description Loads the categories and sets them to `this.categories`.
   */
  loadCategories() {
    this.subscriptions.push(
      this._categoryService.getCategory(this.page).subscribe((res) => {
        this.categories = res.data;
        this.categories.sort((a, b) => a.name?.localeCompare(b?.name));
      })
    );
  }

  /**
   * @description Loads newly created category data.
   */
  getNewCreatedCategoryData(): void {
    this._sharedService.getNewCategoryCreatedData().subscribe((result) => {
      if (result == null || result == undefined || result == '') {
        this.selectedItem = null;
        this.placeholder;
      }

      if (!result) {
        return;
      }

      this.subscriptions.push(
        this._categoryService.getCategory(this.page).subscribe((res) => {
          this.categories = res.data;
        })
      );

      //***********************in edit case use this section******************** */
      if (result) {
        if (result.categoryId != undefined) {
          //Call API only when create new catagory
          this.subscriptions.push(
            this._categoryService
              .categoryById(result.categoryId)
              .subscribe((res) => {
                this.selectedItem = res.data.categoryName;
              })
          );
          return;
        }
        this.selectedItem = result.categoryName;
      }
    });
  }

  /**
   * @description Emits `selectionEvent` when selection is made.
   * @param event - selection event in template.
   */
  getChange(event: ICategoryDropdown) {
    this.selectionEvent.emit(event);
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onScrollToEnd() {
    if (this.searchTerm) {
      this.searchCategory(this.page + 1, true);
      return;
    }
    this.subscriptions.push(
      this._categoryService.getCategory(this.page + 1).subscribe((res) => {
        this.page++;
        const that = this;
        res.data.forEach((element: ICategoryDropdown) => {
          that.categories.push(element);
        });
        this.categories.sort((category1, category2) =>
          category1?.name?.localeCompare(category2?.name)
        );
      })
    );
  }

  /**
   * @description Gets data based on search term.
   * @param event - event
   */
  search(event: KeyboardEvent) {
    clearTimeout(this.searchTimeout);
    this.searchTerm = (event?.target as HTMLInputElement).value;
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      if (this.searchTerm) {
        this.searchCategory();
      } else {
        this.loadCategories();
      }
    }, 600);
  }

  /**
   * @description Gets data based on search term.
   * @param page - optional - category page.
   * @param scrollEnd - optional - boolean
   */
  searchCategory(page?: number, scrollEnd?: boolean) {
    if (!page) {
      page = this.page;
    }
    this.subscriptions.push(
      this._categoryService
        .categorySearch(this.searchTerm, page)
        .subscribe((res) => {
          if (scrollEnd) {
            this.page++;
            res.data.forEach((element: ICategoryDropdown) => {
              this.categories.push(element);
            });
          } else {
            this.categories = res.data;
          }
          this.categories.sort((category1, category2) =>
            category1?.name?.localeCompare(category2?.name)
          );
        })
    );
  }

  ngOnDestroy(): void {
    this._sharedService.setNewCategoryCreatedData(null);
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
