import { Action, ActionReducer, createReducer, on } from '@ngrx/store';
import { ICardsStates } from 'src/app/models/card';
import { CardsActions } from './cards.actions';
import { IExistingCreditCards } from '../../../models/payment-switch-board';

export const cardsFeatureKey = 'cards';

const initialState: ICardsStates = {
  cards: [] as IExistingCreditCards[],
  pageNo: 0,
  isFilterOn: false,
  searchTerm: '',
  cardsFiltered: [] as IExistingCreditCards[],
  filteredPageNo: 0,
  isLoading: false,
  isError: false,
  selectedCards: {},
  receivedCards: [],
  sentCards: [],
  currentTab: 'credit'
};

export const cardsReducer: ActionReducer<ICardsStates, Action> = createReducer(
  initialState,
  /**
   * Cards reducer handles state changes for credit card data.
   *
   * @param state - The current state of the cards module.
   * @param action - The action dispatched to update the state.
   * @returns The new state after applying the action.
   */
  on(CardsActions.loadCards, (state): ICardsStates => {
    return {
      ...state
    };
  }),
  /**
   * Reducer for handling the 'Load Cards Success' action.
   *
   * @param state - The current state of the cards feature.
   * @param action - The 'Load Cards Success' action.
   * @returns Updated state with loaded cards data.
   */
  on(CardsActions.loadCardsSuccess, (state, action): ICardsStates => {
    return {
      ...state,
      cards: action.cards ?? [],
      cardsFiltered: action.cardsFiltered ?? [],
      isFilterOn:
        action.isFilterOn === true
          ? true
          : action.isFilterOn === false
            ? false
            : state.isFilterOn,
      isLoading: false,
      isError: false
    };
  }),
  /**
   * Reducer for handling the 'Load Cards Failure' action.
   *
   * @param state - The current state of the cards feature.
   * @returns Updated state with an error flag set.
   */
  on(CardsActions.loadCardsFailure, (state): ICardsStates => {
    return {
      ...state,
      isLoading: false,
      isError: true
    };
  }),
  /**
   * Reducer for handling the 'Loading Cards' action.
   *
   * @param state - The current state of the cards feature.
   * @returns Updated state with loading indicators.
   */
  on(CardsActions.loadingCards, (state): ICardsStates => {
    return {
      ...state,
      isLoading: true,
      isError: false
    };
  }),
  /**
   * Reducer for handling the 'Add Cards' action.
   *
   * @param state - The current state of the cards feature.
   * @returns Updated state with loading indicators and adding new card information.
   */
  on(CardsActions.addCard, (state, action): ICardsStates => {
    return {
      ...state,
      cards: action.card ? [...state.cards, action.card] : state.cards,
      isLoading: false,
      isError: false
    };
  }),
  /**
   * Reducer for handling the 'Remove Cards' action.
   *
   * @param state - The current state of the cards feature.
   * @returns Updated state with loading indicators and removing single card information.
   */
  on(CardsActions.removeCard, (state, action): ICardsStates => {
    return {
      ...state,
      cards: state.cards.filter((c) => c.cardId !== action.cardId),
      isLoading: false,
      isError: false
    };
  }),

  /**
   * Reducer for handling the 'Update Card' action.
   *
   * @param state - The current state of the cards feature.
   * @param action - The 'Update Card' action.
   * @returns Updated state with the updated card information.
   */
  on(CardsActions.updateCard, (state, action): ICardsStates => {
    return {
      ...state,
      cards: state.cards.map((c) =>
        c.cardId === action.card.cardId ? action.card : c
      )
    };
  }),

  /**
   * Reducer for handling the 'Cards Reset' action.
   * @returns The initial state of the cards feature.
   */
  on(CardsActions.cardsReset, (): ICardsStates => {
    return initialState;
  }),

  on(CardsActions.getReceivedCards, (state) => ({
    ...state,
    isLoading: true
  })),
  on(CardsActions.getReceivedCardsSuccess, (state, action) => ({
    ...state,
    isLoading: false,
    receivedCards: action.cards
  })),

  on(CardsActions.getSentCards, (state) => ({
    ...state,
    isLoading: true
  })),
  on(CardsActions.getSentCardsSuccess, (state, action) => ({
    ...state,
    isLoading: false,
    sentCards: action.cards
  })),

  on(CardsActions.selectCreditCard, (state, action) => ({
    ...state,
    selectedCards: {
      ...state.selectedCards,
      creditCard: action.selectedCard
    }
  })),

  on(CardsActions.selectSendCard, (state, action) => ({
    ...state,
    selectedCards: {
      ...state.selectedCards,
      sendCard: action.selectedCard
    }
  })),

  on(CardsActions.selectReceiveCard, (state, action) => ({
    ...state,
    selectedCards: {
      ...state.selectedCards,
      receiveCard: action.selectedCard
    }
  })),

  on(CardsActions.setCurrentTab, (state, action) => ({
    ...state,
    currentTab: action.tab
  })),

  on(CardsActions.setSearchValue, (state, action) => ({
    ...state,
    searchTerm: action.search
  }))
);
