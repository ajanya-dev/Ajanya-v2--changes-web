import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ICategoryDropdown } from '../../category/model/category';

export const CategoriesActions = createActionGroup({
  source: 'Categories',
  events: {
    /**
     * Action dispatched to load Categories based on the provided search term.
     * @param {string} searchTerm - The term used to search for Categories.
     * @param {boolean} [isFilterOn] - Optional flag indicating whether filtering is active.
     */
    'Load Categories': props<{ searchTerm: string }>(),
    /**
     * Action dispatched to indicate that Categories are being loaded.
     * This action does not carry any additional data.
     */
    'Loading Categories': emptyProps(),
    /**
     * Action dispatched when loading Categories is successful.
     * @param {number} [pageNo] - The page number for the loaded Categories (if not filtered).
     * @param {number} [filteredPageNo] - The page number for the loaded filtered Categories (if filtering applied).
     * @param {ICategoryDropdown[]} [categories] - The array of loaded Categories (if not filtered).
     * @param {ICategoryDropdown[]} [categoriesFiltered] - The array of loaded filtered Categories (if filtering applied).
     * @param {boolean} isFilterOn - Flag indicating whether filtering is active.
     */
    'Load Categories Success': props<{
      pageNo?: number;
      filteredPageNo?: number;
      categories?: ICategoryDropdown[];
      categoriesFiltered?: ICategoryDropdown[];
    }>(),
    /**
     * Action dispatched when loading Categories fails.
     * This action does not carry any additional data.
     */
    'Load Categories Failure': emptyProps(),
    /**
     * Action dispatched to load more Categories.
     * This action does not carry any additional data.
     */
    'Load More Categories': emptyProps(),
    /**
     * Action to load categories by their IDs.
     * @param ids An array of category IDs to load.
     */
    'Load Categories By Ids': props<{ ids: string[] }>(),
    /**
     * Action to indicate the successful loading of categories by their IDs.
     * @param categories An array of loaded category objects.
     */
    'Load Categories By Ids Success': props<{
      categories: ICategoryDropdown[];
    }>(),

    /**
     * Action to indicate the failure of loading categories by their IDs.
     * @param error The error that occurred during loading.
     */
    'Load Categories By Ids Failure': props<{ error: unknown }>(),

    /**
     * Action to add created category details into store
     * @param category The new category information.
     */
    'Add Created Category Into Categories': props<{
      category: ICategoryDropdown;
    }>(),

    /**
     * Action to reset categories to their initial state.
     */
    'Categories Reset': emptyProps()
  }
});
