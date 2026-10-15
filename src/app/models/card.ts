import { ISendReceiveVirtualCard } from '../data/data/virtual-card';
import { TCardsTabs } from '../modules/cards/components/v35/models/cards-ocw-v35.interface';
import { IExistingCreditCards } from './payment-switch-board';

export interface ICardsStates {
  cards: IExistingCreditCards[];
  pageNo: number;
  isFilterOn: boolean;
  searchTerm: string;
  cardsFiltered: IExistingCreditCards[];
  filteredPageNo: number;
  isLoading: boolean;
  isError: boolean;
  receivedCards: ISendReceiveVirtualCard[];
  sentCards: ISendReceiveVirtualCard[];
  selectedCards: {
    creditCard?: IExistingCreditCards;
    sendCard?: ISendReceiveVirtualCard;
    receiveCard?: ISendReceiveVirtualCard;
  };
  currentTab: TCardsTabs;
}
