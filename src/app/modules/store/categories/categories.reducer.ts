import { Action, ActionReducer, createReducer, on } from '@ngrx/store';
import { CategoriesActions } from './categories.actions';
import {
  ICategoryDropdown,
  ICategoriesState
} from '../../category/model/category';

export const categoriesFeatureKey = 'categories';
const initialState = {
  categories: [] as ICategoryDropdown[],
  pageNo: 0,
  isFilterOn: false,
  searchTerm: '',
  searchIds: [] as string[],
  categoriesFiltered: [] as ICategoryDropdown[],
  filteredPageNo: 0,
  isLoading: false,
  isCategoriesByIdsLoading: false,
  isError: false
};
export const categoriesReducer: ActionReducer<ICategoriesState, Action> =
  createReducer(
    initialState,
    // Action handlers:
    /**
     * Handle the 'Load categories Success' action.
     * @param {ICategoriesState} state - Current state of the categories.
     * @param {Action} action - Action with categories data and optional pagination details.
     * @returns {ICategoriesState} Updated state with categories, categoriesFiltered, pagination details, and isLoading modified.
     */
    on(CategoriesActions.loadCategories, (state, action): ICategoriesState => {
      return {
        ...state,
        filteredPageNo: 0,
        searchTerm: action.searchTerm,
        isFilterOn: action.searchTerm ? true : false
      };
    }),
    /**
     * Handle the 'Load categories Success' action.
     * @param {ICategoriesState} state - Current state of the categories.
     * @param {Action} action - Action with categories data and optional pagination details.
     * @returns {ICategoriesState} Updated state with categories, categoriesFiltered, pagination details, and isLoading modified.
     */
    on(
      CategoriesActions.loadCategoriesSuccess,
      (state, action): ICategoriesState => {
        const categoriesFiltered = (() => {
          if (action.categoriesFiltered) {
            if (action.filteredPageNo === 1) {
              return action.categoriesFiltered;
            }
            return [...state.categoriesFiltered, ...action.categoriesFiltered];
          }
          return state.categoriesFiltered;
        })();
        return {
          ...state,
          pageNo: action.pageNo ?? state.pageNo,
          categories: [
            ...state.categories,
            ...(action.categories ? action.categories : [])
          ],
          filteredPageNo: action.filteredPageNo
            ? action.filteredPageNo
            : state.filteredPageNo,
          categoriesFiltered: categoriesFiltered,
          isLoading: false,
          isError: false
        };
      }
    ),
    /**
     * Handle the 'Load categories Failure' action.
     * @param {ICategoriesState} state - Current state of the categories.
     * @returns {ICategoriesState} Updated state with isLoading set to false and isError set to true.
     */
    on(CategoriesActions.loadCategoriesFailure, (state): ICategoriesState => {
      return {
        ...state,
        isLoading: false,
        isError: true
      };
    }),
    /**
     * Handle the 'Loading categories' action.
     * @param {ICategoriesState} state - Current state of the categories.
     * @returns {ICategoriesState} Updated state with isLoading set to true and isError set to false.
     */
    on(CategoriesActions.loadingCategories, (state): ICategoriesState => {
      return {
        ...state,
        isLoading: true,
        isError: false
      };
    }),

    /**
     * Reducer to handle loading categories by their IDs.
     * Updates the state with search IDs and loading flags when 'loadCategoriesByIds' action is dispatched.
     */
    on(
      CategoriesActions.loadCategoriesByIds,
      (state, action): ICategoriesState => {
        const searchIds = [...state.searchIds];
        action.ids.forEach((categoryId) => {
          if (!searchIds.includes(categoryId)) {
            searchIds.push(categoryId);
          }
        });

        return {
          ...state,
          isFilterOn: false,
          isCategoriesByIdsLoading: true,
          searchIds: searchIds
        };
      }
    ),
    /**
     * Reducer to handle successful loading of categories by their IDs.
     * Updates the state with fetched categories and resets loading flags.
     */
    on(
      CategoriesActions.loadCategoriesByIdsSuccess,
      (state, action): ICategoriesState => {
        return {
          ...state,
          isFilterOn: false,
          categories: action.categories
            ? [...state.categories, ...action.categories]
            : state.categories,
          searchIds: [],
          isCategoriesByIdsLoading: false,
          isError: false
        };
      }
    ),
    /**
     * Reducer to handle failure in loading categories by their IDs.
     * Updates the state to indicate loading failure.
     */
    on(
      CategoriesActions.loadCategoriesByIdsFailure,
      (state): ICategoriesState => {
        return {
          ...state,
          isCategoriesByIdsLoading: false,
          isError: true
        };
      }
    ),
    /**
     * Reducer to add created category into store.
     * pushes the new data into existing state of categories.
     */
    on(
      CategoriesActions.addCreatedCategoryIntoCategories,
      (state, action): ICategoriesState => {
        return {
          ...state,
          categories: action.category
            ? [...state.categories, action.category]
            : state.categories
        };
      }
    ),
    /**
     * Reducer to reset the categories state to its initial state.
     */
    on(CategoriesActions.categoriesReset, (): ICategoriesState => {
      return initialState;
    })
  );
