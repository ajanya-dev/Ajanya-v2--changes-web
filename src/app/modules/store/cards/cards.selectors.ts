import { createSelector } from '@ngrx/store';
import { IMainState } from '../main-state.model';
import { selectMainState } from '..';
import { ICardsStates } from 'src/app/models/card';

export const selectCards = createSelector(
  selectMainState,
  (state: IMainState) => state.cardsStates.cards
);

export const selectCardsFiltered = createSelector(
  selectMainState,
  (state: IMainState) => state.cardsStates.cardsFiltered
);

export const selectCardsStates = createSelector(
  selectMainState,
  (state: IMainState) => state.cardsStates
);

export const getReceivedCardsList = createSelector(
  selectMainState,
  (state: IMainState) => state.cardsStates.receivedCards
);
export const getSentCardsList = createSelector(
  selectMainState,
  (state: IMainState) => state.cardsStates.sentCards
);

export const selectIsCardsFilterOn = createSelector(
  selectCardsStates,
  (cardsStates: ICardsStates) => cardsStates.isFilterOn
);

export const selectIsCardsLoading = createSelector(
  selectCardsStates,
  (cardsStates: ICardsStates) => cardsStates.isLoading
);

export const CLError = createSelector(
  selectCardsStates,
  (cardsStates: ICardsStates) => cardsStates.isError
);

export const getSelectedCards = createSelector(
  selectCardsStates,
  (cardsStates: ICardsStates) => cardsStates.selectedCards
);

export const cardCurrentTab = createSelector(
  selectCardsStates,
  (cardsStates: ICardsStates) => cardsStates.currentTab
);

export const cardSearchValue = createSelector(
  selectCardsStates,
  (cardsStates: ICardsStates) => cardsStates.searchTerm
);
