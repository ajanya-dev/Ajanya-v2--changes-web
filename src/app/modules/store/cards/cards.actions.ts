import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { IExistingCreditCards } from '../../../models/payment-switch-board';
import { ISendReceiveVirtualCard } from 'src/app/data/data/virtual-card';
import { TCardsTabs } from '../../cards/components/v35/models/cards-ocw-v35.interface';

/**
 * Actions related to managing credit cards.
 */
export const CardsActions = createActionGroup({
  source: 'Cards',
  events: {
    /**
     * Load credit cards action.
     * @param showAllCards - Optional flag to fetch all cards including inactive ones.
     */
    'Load Cards': props<{ showAllCards?: boolean; isPayroll?: boolean }>(),

    /**
     * Load credit cards success action.
     *
     * @param cards - An array of existing credit cards.
     * @param cardsFiltered - An array of filtered existing credit cards.
     * @param isFilterOn - A boolean indicating whether a filter is applied.
     */
    'Load Cards Success': props<{
      cards?: IExistingCreditCards[];
      cardsFiltered?: IExistingCreditCards[];
      isFilterOn: boolean;
    }>(),

    /**
     * Load credit cards failure action.
     *
     * @param error - An unknown error object.
     */
    'Load Cards Failure': props<{ error: unknown }>(),

    /**
     * Loading cards action.
     */
    'Loading Cards': emptyProps(),

    /**
     * Add card action.
     */
    'Add Card': props<{ card: IExistingCreditCards }>(),

    /**
     * remove deleted card from state.
     */
    'Remove Card': props<{ cardId: IExistingCreditCards['cardId'] }>(),

    /**
     * Update an existing card in state.
     */
    'Update Card': props<{ card: IExistingCreditCards }>(),

    /**
     * Reset cards action.
     */
    'Cards Reset': emptyProps(),

    /**
     * Get received cards action.
     *
     * @param searchKey - A search key for filtering received cards.
     */
    'Get Received Cards': props<{ searchKey: string }>(),

    /**
     * Get received cards success action.
     *
     * @param cards - An array of received virtual cards.
     */
    'Get Received Cards Success': props<{ cards: ISendReceiveVirtualCard[] }>(),

    /**
     * Get sent cards action.
     */
    'Get Sent Cards': emptyProps(),

    /**
     * Get sent cards success action.
     *
     * @param cards - An array of sent virtual cards.
     */
    'Get Sent Cards Success': props<{ cards: ISendReceiveVirtualCard[] }>(),

    /**
     * Select credit card action.
     *
     * @param selectedCard - The selected credit card.
     */
    'Select Credit Card': props<{ selectedCard: IExistingCreditCards }>(),

    /**
     * Select send card action.
     *
     * @param selectedCard - The selected send card.
     */
    'Select Send Card': props<{ selectedCard: ISendReceiveVirtualCard }>(),

    /**
     * Select receive card action.
     *
     * @param selectedCard - The selected receive card.
     */
    'Select Receive Card': props<{ selectedCard: ISendReceiveVirtualCard }>(),

    /**
     * Set current tab action.
     *
     * @param tab - The current tab.
     */
    'Set Current Tab': props<{ tab: TCardsTabs }>(),

    /**
     * Set search value action.
     *
     * @param search - The search value.
     */
    'Set Search Value': props<{ search: string }>()
  }
});
