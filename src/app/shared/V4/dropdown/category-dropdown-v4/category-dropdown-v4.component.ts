import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
  OnInit,
  output,
  input,
  viewChild,
  forwardRef,
  signal,
  effect
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { MatDialog } from '@angular/material/dialog';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideAngularModule, Plus, Layers, Info } from 'lucide-angular';
import { combineLatest, debounceTime, map, take } from 'rxjs';
import { CategoriesActions } from 'src/app/modules/store/categories/categories.actions';
import {
  selectCategoriesState,
  selectIsCategoriesByIdLoading
} from 'src/app/modules/store/categories/categories.selectors';
import {
  ICategoryDropdown,
  ICategoriesState
} from 'src/app/modules/category/model/category';
import { IV3DropDownOnReady } from 'src/app/models/common';
import { CategoryAddModalV4Component } from 'src/app/shared/modal/category-modal/category-add-modal-v4/category-add-modal-v4.component';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    FormsModule,
    LucideAngularModule,
    MatTooltipModule
  ],
  selector: 'app-category-dropdown-v4',
  templateUrl: './category-dropdown-v4.component.html',
  styleUrls: ['./category-dropdown-v4.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategoryDropdownV4Component),
      multi: true
    }
  ]
})
export class CategoryDropdownV4Component
  implements ControlValueAccessor, OnInit, OnDestroy
{
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private elementRef = inject(ElementRef);
  private ngZone = inject(NgZone);

  // Lucide icons
  readonly PlusIcon = Plus;
  readonly LayersIcon = Layers;
  readonly InfoIcon = Info;

  // Signal inputs
  placeholder = input<string>('Category');
  dropdownPosition = input('auto');
  appendTo = input('body');
  customHeight = input<'0' | '1'>('0');
  selectedId = input<string>();
  selectDropdownItem = input<ICategoryDropdown>();
  enableAddNew = input(false);
  showInfoIcon = input(true);
  fontClass = input('font-funnel');
  zIndex = input<number>(998);

  // Signal outputs
  selectionEvent = output<ICategoryDropdown>();
  ready = output<IV3DropDownOnReady>();

  ngSelectComponent = viewChild(NgSelectComponent);

  // Template-bound state
  selectedItem: ICategoryDropdown | null | undefined = null;
  categories: ICategoryDropdown[] = [];
  searchTerm = '';
  searchTimeout: ReturnType<typeof setTimeout>;
  isLoadingWithId = false;
  private scrollCleanup: (() => void) | null = null;

  // Internal signals
  private isInitialized = signal(false);
  private isProcessingWriteValue = signal(false);

  // Store selectors
  private categoriesState$ = this.store.select(selectCategoriesState);
  private selectIsCategoriesByIdLoading$ = this.store.select(
    selectIsCategoriesByIdLoading
  );

  // CVA callbacks
  private onValueChange: (
    value?: ICategoryDropdown | null | undefined
  ) => void = () => {};
  
  onTouched: () => void = () => {};

  /** Bypass ng-select client-side filtering — search is handled server-side. */
  searchFn = (_term: string, _item: ICategoryDropdown): boolean => true;

  constructor() {
    effect(() => {
      const id = this.selectedId();
      if (id) {
        this.setItemWithId(id);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const item = this.selectDropdownItem();
      if (item && !Array.isArray(item)) {
        if (!this.categories.find((c) => c.id === item.id)) {
          this.categories = [...this.categories, item];
        }
        this.selectedItem = item;
        this.cdr.detectChanges();
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.initStoreSelectors();
    this.isInitialized.set(true);

    setTimeout(() => {
      this.ready.emit({ setItemWithId: this.setItemWithId });
    });
  }

  /** Initialize store selectors and dispatch initial load. */
  private initStoreSelectors(): void {
    this.store.dispatch(CategoriesActions.loadCategories({ searchTerm: '' }));

    this.categoriesState$
      .pipe(
        map((state: ICategoriesState) =>
          state.isFilterOn ? state.categoriesFiltered : state.categories
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((categories) => {
        this.categories = categories;
        this.cdr.detectChanges();
      });
  }

  /**
   * Sets an item with a specific ID in the selected category.
   * First checks if the item exists in the store, otherwise loads it by ID.
   */
  setItemWithId = (id: string): void => {
    if (!id) return;

    this.isLoadingWithId = true;

    this.categoriesState$.pipe(take(1)).subscribe((categoriesState) => {
      const item = categoriesState?.categories?.find((ele) => ele?.id === id);

      if (item) {
        this.selectedItem = item;
        this.selectionEvent.emit(item);
        this.onValueChange(item);
        this.isLoadingWithId = false;
        this.cdr.detectChanges();
      } else {
        this.loadItemsById(id);
      }
    });
  };

  /**
   * Loads items by ID from the store and updates the selected category.
   */
  private loadItemsById(id: string): void {
    if (!id) return;

    this.store.dispatch(CategoriesActions.loadCategoriesByIds({ ids: [id] }));
    this.isLoadingWithId = true;
    this.cdr.detectChanges();

    combineLatest([
      this.categoriesState$.pipe(
        map((state) =>
          state.isFilterOn ? state.categoriesFiltered : state.categories
        )
      ),
      this.selectIsCategoriesByIdLoading$
    ])
      .pipe(debounceTime(100), take(2), takeUntilDestroyed(this.destroyRef))
      .subscribe(([categories, isLoading]) => {
        this.isLoadingWithId = isLoading;

        if (!isLoading) {
          const item = categories.find((ele) => ele.id === id);

          if (item) {
            this.selectedItem = item;
            this.selectionEvent.emit(item);
            this.onValueChange(item);
            this.isLoadingWithId = false;
            this.cdr.detectChanges();
          }
        }
      });
  }

  getChange(event: ICategoryDropdown | string): void {
    if (event === 'add-new') {
      this.ngSelectComponent()?.close();
      this.ngSelectComponent()?.handleClearClick();
      this.addCategoryModal();
      return;
    }
    const value = event as ICategoryDropdown;
    this.selectionEvent.emit(value);
    this.onValueChange(value);
  }

  addCategoryModal(): void {
    const dialogRef = this.dialog.open(CategoryAddModalV4Component, {
      maxWidth: '500px',
      width: '93%',
      panelClass: 'paddingless-modal-rounded',
      disableClose: true
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) {
          const {categoryData} = res;
          this.store.dispatch(
            CategoriesActions.addCreatedCategoryIntoCategories({
              category: categoryData
            })
          );
          if (categoryData) {
            this.setItemWithId(categoryData.id);
            this.onValueChange(categoryData);
          }
        }
      });
  }

  onScrollToEnd(): void {
    this.store.dispatch(CategoriesActions.loadMoreCategories());
  }

  search(event: KeyboardEvent): void {
    clearTimeout(this.searchTimeout);
    this.searchTerm =
      (event?.target as HTMLInputElement).value?.replace(/&/g, '%26') || '';

    this.searchTimeout = setTimeout(() => {
      this.store.dispatch(
        CategoriesActions.loadCategories({ searchTerm: this.searchTerm })
      );
    }, 600);
  }

  onOpen(): void {
    if (this.appendTo() === 'body') {
      this.addAncestorScrollListener();
    }
  }

  onDropdownClose(): void {
    this.removeAncestorScrollListener();
    if (this.searchTerm) {
      this.searchTerm = '';
      this.store.dispatch(CategoriesActions.loadCategories({ searchTerm: '' }));
    }
  }

  private addAncestorScrollListener(): void {
    this.removeAncestorScrollListener();
    const scrollableParent = this.findScrollableAncestor();
    if (!scrollableParent) return;

    this.ngZone.runOutsideAngular(() => {
      const handler = () => {
        this.ngZone.run(() => {
          this.ngSelectComponent()?.close();
        });
      };
      scrollableParent.addEventListener('scroll', handler, { passive: true });
      this.scrollCleanup = () => scrollableParent.removeEventListener('scroll', handler);
    });
  }

  private removeAncestorScrollListener(): void {
    if (this.scrollCleanup) {
      this.scrollCleanup();
      this.scrollCleanup = null;
    }
  }

  private findScrollableAncestor(): HTMLElement | null {
    let parent: HTMLElement | null = this.elementRef.nativeElement.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }

  clear(): void {
    this.searchTerm = '';
    this.store.dispatch(CategoriesActions.loadCategories({ searchTerm: '' }));
  }

  // --- ControlValueAccessor ---

  writeValue(value: ICategoryDropdown): void {
    if (this.isProcessingWriteValue()) return;

    if (!this.isInitialized()) {
      setTimeout(() => this.writeValue(value), 100);
      return;
    }

    this.isProcessingWriteValue.set(true);

    try {
      if (value?.id) {
        this.setItemWithId(value.id);
      } else {
        this.selectedItem = null;
        this.cdr.detectChanges();
      }
    } finally {
      setTimeout(() => this.isProcessingWriteValue.set(false), 50);
    }
  }

  registerOnChange(
    fn: (value?: ICategoryDropdown | null | undefined) => void
  ): void {
    this.onValueChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  ngOnDestroy(): void {
    this.removeAncestorScrollListener();
  }
}
