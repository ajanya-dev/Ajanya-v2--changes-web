import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  forwardRef,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import {
  Observable,
  Subject,
  Subscription,
  combineLatest,
  debounceTime,
  map,
  take,
  takeUntil
} from 'rxjs';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import {
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ControlValueAccessor
} from '@angular/forms';
import { CategoriesActions } from 'src/app/modules/store/categories/categories.actions';
import {
  selectCategoriesState,
  selectIsCategoriesByIdLoading
} from 'src/app/modules/store/categories/categories.selectors';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { IV3DropDownOnReady } from 'src/app/models/common';
import {
  ICategoryDropdown,
  ICategoriesState
} from 'src/app/modules/category/model/category';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { faCircleQuestion } from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-category-dropdown-v3',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    MatTooltipModule
  ],
  templateUrl: './category-dropdown-v3.component.html',
  styleUrls: ['./category-dropdown-v3.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategoryDropdownV3Component),
      multi: true
    }
  ]
})
export class CategoryDropdownV3Component
  implements ControlValueAccessor, OnDestroy, OnInit,AfterViewInit
{
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private changeDetectionRef = inject(ChangeDetectorRef);
  private headerService = inject(HeaderService);

  @Input() id = 'id'; // Its better to pass a unique id always for avoiding conflict.
  @Input() enableAddNew = true;
  @Input() placeholder = 'Select Category';
  @Input() append = 'ng-select';
  @Output() ready = new EventEmitter<IV3DropDownOnReady>();
  @Output() changeEvent = new EventEmitter<
    ICategoryDropdown | null | undefined
  >();

  /**
   * Access to the ng-select component.
   *
   * @type {NgSelectComponent}
   * @memberof V35CommonDropDownSelectorComponent
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  categoriesToList$: Observable<ICategoryDropdown[]>;
  selectedCategory: FormControl<ICategoryDropdown | null | undefined> =
    new FormControl();
  searchTerm: string;
  searchTimeout: ReturnType<typeof setTimeout>;
  changesSubscription: Subscription;
  categoriesState$: Observable<ICategoriesState>;
  isLoadingWithId: boolean = false;
  onReadyResponse: IV3DropDownOnReady = {};
  selectIsCategoriesByIdLoading$: Observable<boolean>;
  destroy$ = new Subject();

  isInitialized = signal<boolean>(false);
  private isProcessingWriteValue = signal<boolean>(false);
  private pendingValue = signal<ICategoryDropdown | null>(null);
  private isNgSelectReady = signal<boolean>(false);

  faCircleQuestion=faCircleQuestion;


  ngOnInit(): void {
    this.initStoreSelectors();
    this.checkEnabledPlugins();

    this.selectedCategory.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        this.changeEvent.emit(val);
      });

      this.isInitialized.set(true);
  }

  ngAfterViewInit(): void {
    this.onReady();

    this.isNgSelectReady.set(true);
  }

  checkEnabledPlugins() {
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          if (res.enabledPlugins.includes('enterprise-wiygul')) {
            this.enableAddNew = false;
          }
        }
      });
  }

  /**
   * Onchange event for ng-select.
   */
  onChange(value: ICategoryDropdown | null | undefined | 'add-new') {
    if (value === 'add-new') {
      this.addNewCategory();
      this.clearSelection();
    } else {
      this.selectedCategory.setValue(value);
    }
  }

  /**
   * Initializes store selectors and dispatches an action to load categories.
   */
  initStoreSelectors() {
    this.store.dispatch(CategoriesActions.loadCategories({ searchTerm: '' }));
    this.categoriesState$ = this.store.select(selectCategoriesState);
    this.categoriesToList$ = this.categoriesState$.pipe(
      map((categoriesState) =>
        categoriesState.isFilterOn
          ? categoriesState.categoriesFiltered
          : categoriesState.categories
      )
    );
    this.selectIsCategoriesByIdLoading$ = this.store.select(
      selectIsCategoriesByIdLoading
    );
  }

  /**
   * Called when the component is ready. Emits a response with the setItemWithId function.
   */
  onReady() {
    this.onReadyResponse = {
      setItemWithId: this.setItemWithId
    };
    this.ready.emit(this.onReadyResponse);
  }

  /**
   * Sets an item with a specific ID in the selected category.
   * @param id - The ID of the category to set.
   */
  setItemWithId = (id: string) => {    
    if (!id) return;
      
    this.isLoadingWithId = true;
    
    // First check if the item is already in the store
    const loadingSubscription = this.categoriesState$
      .pipe(
        take(1) // Take only the current state
      )
      .subscribe((categoriesState) => {
        const item = categoriesState?.categories?.find((ele) => ele?.id === id);
        
        if (item) {
          try {
            // Item found in store, set it directly using patchValue to avoid triggering writeValue
            this.selectedCategory.patchValue(item, { emitEvent: false });
            this.changeEvent.emit(item); // Manually emit the change event
            this.isLoadingWithId = false;
            this.changeDetectionRef.detectChanges();
          } catch (error) {
            this.isLoadingWithId = false;
          }
        } else {
          // Item not in store, load it
          this.loadItemsById(id);
        }
        
      });
      loadingSubscription.unsubscribe();
  };

  /**
   * Loads items by ID and updates the selected category.
   * @param id - The ID of the category to load.
   */
  loadItemsById(id: string) {
    if (!id) return;
    
    this.store.dispatch(CategoriesActions.loadCategoriesByIds({ ids: [id] }));
    this.placeholder = 'Loading...';
    this.isLoadingWithId = true;
    this.changeDetectionRef.detectChanges();
    
    const loadingSubscription = combineLatest([
      this.categoriesToList$,
      this.selectIsCategoriesByIdLoading$
    ])
      .pipe(
        debounceTime(100), // Increased debounce time for better stability
        take(2)
      )
      .subscribe(([categories, isLoading]) => {
        this.isLoadingWithId = isLoading;
        
        // Only proceed when loading is complete
        if (!isLoading) {
          const item = categories.find((ele) => ele.id === id);
          
          if (item) {
            try {
              this.isLoadingWithId = false;
              this.selectedCategory.patchValue(item, { emitEvent: false });
              this.changeEvent.emit(item); // Manually emit the change event
              this.placeholder = 'Select Category';
              this.changeDetectionRef.detectChanges();
              loadingSubscription.unsubscribe();
            } catch (error) {
              this.isLoadingWithId = false;
              loadingSubscription.unsubscribe();
            }
          } else if (!this.isLoadingWithId) {
            // If still not found and not loading, reset placeholder
            this.placeholder = 'Select Category';
            this.changeDetectionRef.detectChanges();
            loadingSubscription.unsubscribe();
          }
        }
      });
  }

  onTouched: (event?: Event) => void;
  private onValueChange: (event?: ICategoryDropdown | null | undefined) => void = () => {};

  /**
   * Writes a value to the form control.
   * @param value - The value to write.
   */
  writeValue(value: ICategoryDropdown): void {    
    // Prevent recursive calls
    if (this.isProcessingWriteValue()) {
      return;
    }
    
    // If not ready, store the value for later processing
    if (!this.isInitialized() || !this.isNgSelectReady()) {
      this.pendingValue.set(value);
      
      // Retry after a delay if not initialized
      if (!this.isInitialized()) {
        setTimeout(() => this.writeValue(value), 100);
      }
      return;
    }
    
    this.isProcessingWriteValue.set(true);
    
    try {
      if (value?.id) {
        this.setItemWithId(value.id);
      } else {
        // Only set to undefined if ng-select is ready
        this.selectedCategory.setValue(undefined, { emitEvent: false });
      }
    } catch (error) {} 
    finally {
      // Reset flag after a short delay to allow the operation to complete
      setTimeout(() => {
        this.isProcessingWriteValue.set(false);
      }, 50);
    }
  }

  /**
   * Registers a callback function to be invoked when the form control value changes.
   * @param fn - The callback function.
   */
  registerOnChange(
    fn: (event?: ICategoryDropdown | null | undefined) => void
  ): void {
    this.onValueChange = fn;
    this.changesSubscription = this.selectedCategory.valueChanges.subscribe(fn);
  }

  /**
   * Registers a callback function to be invoked when the form control is touched.
   *
   * @param fn - The callback function.
   */
  registerOnTouched(fn: (event?: Event | undefined) => void): void {
    this.onTouched = fn;
  }

  /**
   * @description Gets next 10 element on each scroll event
   */
  onScrollToEnd() {
    this.store.dispatch(CategoriesActions.loadMoreCategories());
  }

  /**
   * @description Gets data based on search term.
   * @param event - event
   */
  search(event: KeyboardEvent | FocusEvent) {
    clearTimeout(this.searchTimeout);
    this.searchTerm = (event?.target as HTMLInputElement).value;
    const data = this.searchTerm.replace(/&/g, '%26');
    this.searchTerm = data;
    this.searchTimeout = setTimeout(() => {
      this.store.dispatch(
        CategoriesActions.loadCategories({ searchTerm: this.searchTerm })
      );
    }, 600);
  }

  /**
   * @description CLears the changes made.
   */
  clear() {
    this.searchTerm = '';
    this.store.dispatch(
      CategoriesActions.loadCategories({ searchTerm: this.searchTerm })
    );
  }

  /**
   * @description Opens modal dialog for adding new bank account. Emits `newCategoryAdded` event, on success.
   */
  addNewCategory() {
    const dialogRef = this.dialog.open(CategoryAddModalComponent, {
      maxWidth: '500px',
      width: '93%'
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success) {
        this.store.dispatch(
          CategoriesActions.addCreatedCategoryIntoCategories({
            category: res.categoryData
          })
        );
        this.writeValue(res.categoryData);
        // Manually notify parent component of the new category selection
        this.onValueChange(res.categoryData);
      }
    });
  }

  /**
   * Clears the selection in the ng-select component.
   *
   * @memberof V35CommonDropDownSelectorComponent
   */
  clearSelection() {
    this.ngSelectComponent.handleClearClick();
  }

  ngOnDestroy(): void {
    this.changesSubscription?.unsubscribe();
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
