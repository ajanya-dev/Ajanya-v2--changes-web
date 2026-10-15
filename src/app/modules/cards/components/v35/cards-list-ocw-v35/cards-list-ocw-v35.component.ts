import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonLayoutToggleService } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle.service';
import { NgFor, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { TCardsTabs } from '../models/cards-ocw-v35.interface';
import { CardsDataServiceService } from '../../../services/cards-data-service.service';
import { ReceivedCardsListOcwV35Component } from '../lists/received-cards-list-ocw-v35/received-cards-list-ocw-v35.component';
import { SentCardsListOcwV35Component } from '../lists/sent-cards-list-ocw-v35/sent-cards-list-ocw-v35.component';
import { CreditCardsOcwV35Component } from '../lists/credit-cards-ocw-v35/credit-cards-ocw-v35.component';
import { ListHeaderV35Component } from '../../../../../shared/v3/common-components/list-header-v35/list-header-v35.component';

/**
 * @description Cards list component for v3 cards page. it is a base component for list pages like credit, sent, recieved cads list components.
 * @class
 */
@Component({
  selector: 'app-cards-list-ocw-v35',
  templateUrl: './cards-list-ocw-v35.component.html',
  styleUrls: ['./cards-list-ocw-v35.component.scss'],
  standalone: true,
  imports: [
    NgFor,
    NgClass,
    ListHeaderV35Component,
    CreditCardsOcwV35Component,
    SentCardsListOcwV35Component,
    ReceivedCardsListOcwV35Component
  ]
})
export class CardsListOcwV35Component implements OnDestroy, OnInit {
  private cardsDataService = inject(CardsDataServiceService);
  private router = inject(Router);
  private commonLayoutToggleService = inject(CommonLayoutToggleService);
  private headerService = inject(HeaderService);

  subscriptions: Subscription[] = [];
  isGridView = true;
  tabsList: {
    value: TCardsTabs;
    name: string;
    toolTip?: string;
    count?: number;
  }[] = [
    { value: 'credit', name: 'Credit Cards' },
    { value: 'sent', name: 'Sent', toolTip: 'Virtual Cards - Sent' },
    { value: 'recieved', name: 'Received', toolTip: 'Virtual Cards - Received' }
  ];

  currentTab = computed(() => this.cardsDataService.cardsData().currentTab);
  sendCardsList = computed(() => this.cardsDataService.cardsData().sentCards);
  receivedCardsList = computed(
    () => this.cardsDataService.cardsData().receivedCards
  );

  resize = false;

  searchKey = computed(() => this.cardsDataService.cardsData().searchTerm);
  creditCardGatewayType: 4 | 5;
  creditCardGatewaySwitchingStatus: 1 | 2 | 3 | 4;

  ngOnInit(): void {
    this.checkRoute();
    this.addTotalCountToTabslist();
    this.checkResize();
    this.getHeaderData();
  }

  getHeaderData() {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        const headerData = res as unknown as IHeaderData;
        this.creditCardGatewayType = headerData.credit_card_gateway_type;
        this.creditCardGatewaySwitchingStatus = headerData.credit_card_gateway_switching_status;
      })
    );
  }

  checkResize(): void {
    this.subscriptions.push(
      this.commonLayoutToggleService.toggleChange$.subscribe((res) => {
        this.resize = res;
      })
    );
  }

  /**
   * @description Getting called when user changing tabs
   * @param tab - accepting a tab id
   */
  changeTab(tab: TCardsTabs) {
    this.cardsDataService.cardsData.update((cardsData) => ({
      ...cardsData,
      currentTab: tab
    }));
  }

  /**
   * @description method to check route and activating receive panel
   */
  checkRoute() {
    if (this.router.url.includes('receive')) {
      this.changeTab('recieved');
    }
  }

  onSearch(value: string) {
    this.cardsDataService.cardsData.update((cardsData) => ({
      ...cardsData,
      searchTerm: value
    }));
  }

  addNewButtonClick() {
    if (this.creditCardGatewaySwitchingStatus === 3) {
      this.cardsDataService.openAddNewModal(this.currentTab());
      return;
    }
    this.cardsDataService.openAddNewModal(this.currentTab(),this.creditCardGatewayType);
  }

  /**
   * @description method to add the total number of send and received cards to the tabslist to show it in list header.
   */
  async addTotalCountToTabslist() {
    if (!this.sendCardsList().length) {
      await this.cardsDataService.getSentCards();
    }
    this.tabsList[1].count = this.sendCardsList().length;

    if (!this.receivedCardsList().length) {
      await this.cardsDataService.getReceivedCards(this.searchKey());
    }
    this.tabsList[2].count = this.receivedCardsList().length;
  }

  ngOnDestroy(): void {
    this.cardsDataService.cardsData.update((cardsData) => ({
      ...cardsData,
      currentTab: 'credit'
    }));
    this.subscriptions.forEach((el) => el.unsubscribe());
  }
}
