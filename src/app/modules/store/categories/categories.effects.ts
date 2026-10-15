import { Store } from '@ngrx/store';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import {
  EMPTY,
  catchError,
  debounceTime,
  exhaustMap,
  map,
  mergeMap,
  of
} from 'rxjs';
import { Injectable, inject } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { CategoriesActions } from './categories.actions';
import { CategoryService } from 'src/app/shared/service/category/category.service';
import { selectCategoriesState } from './categories.selectors';

@Injectable()
export class CategoriesEffects {
  private store = inject(Store);

  /**
   * An effect to load categories when the 'loadCategories' action is dispatched.
   * It checks if the page is 0 and isLoading is false to trigger the 'loadMorecategories' action.
   */
  loadCategories$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CategoriesActions.loadCategories), // Listen for the 'loadCategories' action
      concatLatestFrom(() => this.store.select(selectCategoriesState)),
      exhaustMap(([_action, categoriesState]) => {
        const isFilterOn =
          !categoriesState.searchTerm || categoriesState.searchTerm == ''
            ? false
            : true;
        const page = isFilterOn
          ? categoriesState.filteredPageNo
          : categoriesState.pageNo;
        if (page === 0 && categoriesState.isLoading == false) {
          return of(CategoriesActions.loadMoreCategories());
        } else {
          return EMPTY;
        }
      })
    );
  });

  /**
   * An effect to load more categories when the 'loadMorecategories' action is dispatched.
   * It dispatches the 'loadingcategories' action, retrieves payee data from the categoriesService,
   * and then dispatches either 'loadCategoriesSuccess' or 'loadCategoriesFailure' based on the result.
   *
   * `headerOptions` used to hide common loader used in `interceptor service`.
   */
  loadMorecategories$ = createEffect(() => {
    const headerOptions = new HttpHeaders({
      isHideLoader: 'true'
    });
    return this.actions$.pipe(
      ofType(CategoriesActions.loadMoreCategories), // Listen for the 'loadCategories' action
      concatLatestFrom(() => this.store.select(selectCategoriesState)),
      exhaustMap(([_action, categoriesState]) => {
        if (categoriesState.isLoading == false) {
          this.store.dispatch(CategoriesActions.loadingCategories());
          const isFilterOn =
            !categoriesState.searchTerm || categoriesState.searchTerm == ''
              ? false
              : true;
          const page =
            (isFilterOn
              ? categoriesState.filteredPageNo
              : categoriesState.pageNo) + 1;
          return this.categoriesService
            .categorySearch(categoriesState.searchTerm, page, headerOptions)
            .pipe(
              map((res) => {
                return CategoriesActions.loadCategoriesSuccess({
                  pageNo: isFilterOn ? categoriesState.pageNo : page,
                  categories: isFilterOn ? undefined : res.data,
                  filteredPageNo: isFilterOn
                    ? page
                    : categoriesState.filteredPageNo,
                  categoriesFiltered: isFilterOn ? res.data : undefined
                });
              }), // Dispatch 'loadCategoriesSuccess' action with the fetched categories
              catchError(() => of(CategoriesActions.loadCategoriesFailure())) // Dispatch 'loadCategoriesFailure' action on error
            );
        } else {
          return EMPTY;
        }
      })
    );
  });
  /**
   * Effect to load categories by their IDs.
   * Listens for the 'loadCategoriesByIds' action and fetches category data based on search IDs.
   * Dispatches 'loadCategoriesByIdsSuccess' action on successful loading or 'loadCategoriesByIdsFailure' on error.
   */
  loadCategoriesByIds$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(CategoriesActions.loadCategoriesByIds), // Listen for the 'loadCategories' action
      concatLatestFrom(() => this.store.select(selectCategoriesState)),
      debounceTime(100),
      mergeMap(([_action, categoriesState]) => {
        return this.categoriesService
          .getCategoryByIds(categoriesState.searchIds)
          .pipe(
            map((res) => {
              return CategoriesActions.loadCategoriesByIdsSuccess({
                categories: res.data
              });
            }), // Dispatch 'loadCategoriesSuccess' action with the fetched categories
            catchError((err) =>
              of(CategoriesActions.loadCategoriesByIdsFailure(err))
            ) // Dispatch 'loadCategoriesFailure' action on error
          );
      })
    );
  });

  constructor(
    private actions$: Actions,
    private categoriesService: CategoryService
  ) {}
}
