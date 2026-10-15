import { Action, ActionReducer, createReducer, on } from '@ngrx/store';
import { payeesActions } from './payees.actions';
import { IPayeeDropdown, IPayeesState } from '../../payee/payee-v2/model/payee';

const initialState = {
  payees: [] as IPayeeDropdown[],
  pageNo: 0,
  isFilterOn: false,
  searchTerm: '',
  searchIds: [] as string[],
  payeesFiltered: [] as IPayeeDropdown[],
  filteredPageNo: 0,
  isLoading: false,
  isPayeesByIdsLoading: false,
  isError: false,
  // Nothing has been asked for yet, so there is more until a page comes back empty.
  hasMore: true,
  filteredHasMore: true
};
/**
 * Reducer function for managing payees state.
 * @param {IPayeesState} state - Current state of the payees.
 * @param {Action} action - Action dispatched to the reducer.
 * @returns {IPayeesState} Updated state after processing the action.
 */
export const payeesReducer: ActionReducer<IPayeesState, Action> = createReducer(
  // Initial state values for the payees feature.
  initialState,
  // Action handlers:
  /**
   * Handle the 'Load Payees Success' action.
   * @param {IPayeesState} state - Current state of the payees.
   * @param {Action} action - Action with payees data and optional pagination details.
   * @returns {IPayeesState} Updated state with payees, payeesFiltered, pagination details, and isLoading modified.
   */
  on(
    payeesActions.loadPayees,
    (state, action): IPayeesState => {
      // If isReload is true, reset to initial state with new search parameters
      if (action.isReload) {
        return {
          ...initialState,
          searchTerm: action.searchTerm,
          isFilterOn: !!action.searchTerm,
          skipEmpty: action.skipEmpty,
          isReload: action.isReload,
          disablePermission: action.disablePermission
        };
      }
      
      // Otherwise, maintain existing state and update search parameters
      return {
        ...state,
        filteredPageNo: 0,
        // A new term is a new list; whatever the last one ran out of says
        // nothing about this one.
        filteredHasMore: true,
        searchTerm: action.searchTerm,
        isFilterOn: !!action.searchTerm,
        skipEmpty: action.skipEmpty,
        disablePermission: action.disablePermission
      };
    }
  ),

  /**
   * Handle the 'Load Payees Success' action.
   * @param {IPayeesState} state - Current state of the payees.
   * @param {Action} action - Action with payees data and optional pagination details.
   * @returns {IPayeesState} Updated state with payees, payeesFiltered, pagination details, and isLoading modified.
   */
  on(payeesActions.loadPayeesSuccess, (state, action): IPayeesState => {
    const payeesFiltered = (() => {
      if (action.payeesFiltered) {
        if (action.filteredPageNo === 1) {
          return action.payeesFiltered;
        }
        return [...state.payeesFiltered, ...action.payeesFiltered];
      }
      return state.payeesFiltered;
    })();
    return {
      ...state,
      pageNo: action.pageNo ?? state.pageNo,
      // `{"success": true, "data": []}` is the end of the list, and the only
      // thing that says so — the response carries no total and no `has_more`.
      // Recorded here so the next scroll to the bottom asks for nothing.
      hasMore: action.payees ? action.payees.length > 0 : state.hasMore,
      filteredHasMore: action.payeesFiltered
        ? action.payeesFiltered.length > 0
        : state.filteredHasMore,
      payees: action.payees
        ? [...state.payees, ...action.payees]
        : state.payees,
      filteredPageNo: action.filteredPageNo
        ? action.filteredPageNo
        : state.filteredPageNo,
      payeesFiltered,
      isLoading: false,
      isError: false
    };
  }),

  /**
   * Handle the 'Load Payees Failure' action.
   * @param {IPayeesState} state - Current state of the payees.
   * @returns {IPayeesState} Updated state with isLoading set to false and isError set to true.
   */
  on(
    payeesActions.loadPayeesFailure,
    (state): IPayeesState => ({
      ...state,
      isLoading: false,
      isError: true
    })
  ),

  /**
   * Handle the 'Loading Payees' action.
   * @param {IPayeesState} state - Current state of the payees.
   * @returns {IPayeesState} Updated state with isLoading set to true and isError set to false.
   */
  on(
    payeesActions.loadingPayees,
    (state): IPayeesState => ({
      ...state,
      isLoading: true,
      isError: false
    })
  ),

  /**
   * Reducer for handling the 'loadPayeesByIds' action. It updates the state by adding the provided payee IDs to the searchIds list and sets loading flags.
   */
  on(payeesActions.loadPayeesByIds, (state, action): IPayeesState => {
    const searchIds = [...state.searchIds];
    action.ids.forEach((payeeId) => {
      if (!searchIds.includes(payeeId)) {
        searchIds.push(payeeId);
      }
    });

    return {
      ...state,
      isFilterOn: false,
      isPayeesByIdsLoading: true,
      searchIds
    };
  }),

  /**
   * Reducer for handling the 'loadPayeesByIdsSuccess' action. It updates the state with the fetched payees and clears loading flags.
   */
  on(payeesActions.loadPayeesByIdsSuccess, (state, action): IPayeesState => {
    const incomingIds = new Set(action.payees.map((p) => p.id));
    const filteredPayees = state.payees.filter((p) => !incomingIds.has(p.id));
    return {
      ...state,
      isFilterOn: false,
      payees: [...filteredPayees, ...action.payees],
      searchIds: [],
      isPayeesByIdsLoading: false,
      isError: false
    };
  }),

  /**
   * Reducer for handling the 'loadPayeesByIdsFailure' action. It clears loading flags and sets an error flag in the state.
   */
  on(
    payeesActions.loadPayeesByIdsFailure,
    (state): IPayeesState => ({
      ...state,
      isPayeesByIdsLoading: false,
      isError: true
    })
  ),

  /**
   * Reducer to add created payee into store.
   * pushes the new data into existing state of payees.
   */
  on(payeesActions.addCreatedPayeeIntoPayees, (state, action): IPayeesState => {
    const updatedPayeesArray = action.payee
      ? [...state.payees, action.payee]
      : state.payees;
    updatedPayeesArray.sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
    return {
      ...state,
      payees: updatedPayeesArray,
      isPayeesByIdsLoading: false,
      isError: true
    };
  }),

  /**
   * Reducer to remove delete payee from store.
   * pushes the new data into existing state of payees.
   */
  on(payeesActions.removePayeeFromPayees, (state, action): IPayeesState => {
    const updatedPayeesArray = state.payees.filter(
      (payee) => payee.id !== action.payeeId
    );
    return {
      ...state,
      payees: updatedPayeesArray,
      isPayeesByIdsLoading: false,
      isError: true
    };
  }),

  /**
   * Reducer to add Updated payee into store.
   * pushes Updated data into existing state of payees.
   */
  on(payeesActions.addUpdatedPayeeIntoPayees, (state, action): IPayeesState => {
    const updatedPayees = state.payees.filter(
      (payee) => payee.id !== action.payee.id
    );
    return {
      ...state,
      payees: [...updatedPayees, action.payee],
      isPayeesByIdsLoading: false,
      isError: true
    };
  }),

  /**
   * Reducer for handling the 'payeesReset' action. It resets the state to its initial values.
   */
  on(payeesActions.payeesReset, (): IPayeesState => initialState)
);
