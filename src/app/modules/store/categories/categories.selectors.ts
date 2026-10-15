import { createSelector } from '@ngrx/store';
import { selectMainState } from '..';
import { IMainState } from '../main-state.model';
import { ICategoriesState } from '../../category/model/category';

/**
 * Selector function to get the Categories array from the store.
 */
export const selectCategories = createSelector(
  selectMainState,
  (state: IMainState) => state.categoriesStates.categories
);
/**
 * Selector function to get the filtered Categories array from the store.
 */
export const selectFilteredCategories = createSelector(
  selectMainState,
  (state: IMainState) => state.categoriesStates.categoriesFiltered
);
/**
 * Selector function to get the entire Categories state object from the store.
 */
export const selectCategoriesState = createSelector(
  selectMainState,
  (state: IMainState) => state.categoriesStates
);
/**
 * Selector function to get the 'isFilterOn' property from the Categories state.
 */
export const selectIsCategoriesFilterOn = createSelector(
  selectCategoriesState,
  (categoriesStates: ICategoriesState) => categoriesStates.isFilterOn
);
/**
 * Selector function to get the 'isLoading' property from the Categories state.
 */
export const selectIsCategoriesLoading = createSelector(
  selectCategoriesState,
  (categoriesStates: ICategoriesState) => categoriesStates.isLoading
);

/**
 * Selector to retrieve the loading status for categories by their IDs.
 * It selects the 'isCategoriesByIdsLoading' property from the categories state.
 */
export const selectIsCategoriesByIdLoading = createSelector(
  selectCategoriesState,
  (categoriesStates: ICategoriesState) =>
    categoriesStates.isCategoriesByIdsLoading
);
