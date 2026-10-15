import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from 'src/app/shared/service/common/shared/shared.service';
import { CategoryService } from '../../../service/category/category.service';
import { ICategoryDropdown } from 'src/app/modules/category/model/category';
import { MatDialog } from '@angular/material/dialog';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';

/**
 * @description Drop down component for category.
 */
@Component({
  standalone: true,
  imports: [CommonModule, NgSelectModule, FormsModule,FaIconComponent, MatTooltipModule],
  selector: 'app-drop-down-category',
  templateUrl: './drop-down-category.component.html',
  styleUrls: ['./drop-down-category.component.scss']
})
export class DropDownCategoryComponent implements OnInit, OnDestroy, OnChanges {
  @Input() placeholder = 'Category';
  @Input() dropdownPosition = 'bottom';
  @Input() selectedId!: string;
  @Output() selectionEvent = new EventEmitter<ICategoryDropdown>();
  @Input() selectDropdownItem: ICategoryDropdown;
  @Input() enableAddNew: false;

  selectedItem: ICategoryDropdown | string | null;
  page = 1;
  searchTerm = '';
  categories: ICategoryDropdown[] = [];
  subscriptions: Subscription[] = [];
  searchTimeout: ReturnType<typeof setTimeout>;

  constructor(
    private _categoryService: CategoryService,
    private _sharedService: SharedService,
    private _dialog: MatDialog
  ) {}

  faCircleQuestion=faCircleQuestion;

  /**
   * Access ng-select
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  ngOnInit(): void {
    this.loadCategories();
    this.subscriptions.push(
      this._sharedService.getNewCategoryCreatedData().subscribe((result) => {
        if (result == null || result == undefined || result == '') {
          this.selectedItem = null;
          this.placeholder;
        }

        if (!result) {
          return;
        }

        //******************for create new bank  and set that name automaticaly into the bank acc field******** */
        this.subscriptions.push(
          this._categoryService.getCategory(this.page).subscribe((res) => {
            this.categories = res.data;
            // this.categories.sort((a, b) => a.name?.localeCompare(b?.name));
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
          if (result.categoryName) {
            this.selectedItem = result.categoryName;
          }
        }
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    /************************ IF the selected id it has *************/
    if (this.selectedId) {
      this.subscriptions.push(
        this._categoryService.categoryById(this.selectedId).subscribe((res) => {
          this.selectedItem = res.data.categoryName;
        })
      );
      return;
    }
    if (Array.isArray(this.selectDropdownItem)) {
      return;
    }
    if (changes.selectDropdownItem && this.selectDropdownItem) {
      this.handleSelectedItem();
    }
  }

  /**
   * @description THe selected drop down item is added to `this.selectDropdownItem` if not already present.
   * Also sets the same to `this.selectedItem`
   */
  handleSelectedItem() {
    setTimeout(() => {
      if (!this.categories.includes(this.selectDropdownItem)) {
        this.categories.push(this.selectDropdownItem);
      }
      this.selectedItem = this.selectDropdownItem;
    }, 100);
  }

  /**
   * @description Loads the categories and sets them to `this.categories`.
   */
  loadCategories() {
    this.subscriptions.push(
      this._categoryService.getCategory(this.page).subscribe((res: any) => {
        this.categories = res.data;
        this.categories.sort((a, b) => a.name?.localeCompare(b?.name));
      })
    );
  }

  /**
   * @description Emits `selectionEvent` when selection is made. Opens add category dialog if 'add-new' is selected.
   * @param event - selection event in template.
   */
  getChange(event: ICategoryDropdown | string) {
    if (event === 'add-new') {
      this.addCategoryModal();
      this.ngSelectComponent.handleClearClick();
      return;
    }
    this.selectionEvent.emit(event as ICategoryDropdown);
  }

  /**
   * @description Opens dialog for adding category.
   * Sets the data to service.
   */
  addCategoryModal(): void {
    const dialogRef = this._dialog.open(CategoryAddModalComponent, {
      maxWidth: '500px',
      width: '93%'
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this._sharedService.setNewCategoryCreatedData({ categoryId: res.id });
      }
    });
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
        this.categories.sort((a, b) => a.name?.localeCompare(b?.name));
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
   * @description CLears the changes made.
   */
  clear() {
    this.searchTerm = '';
    this.loadCategories();
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
          this.categories.sort((a, b) => a.name?.localeCompare(b?.name));
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
