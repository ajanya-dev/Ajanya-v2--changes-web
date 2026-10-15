import { NgModule, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { V3UpdatedAtComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-updated-at/v3-updated-at.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { V3StatusComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-status/v3-status.component';
import { V3ActionButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-action-button/v3-action-button.component';
import { V3ModeOfTransferComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-mode-of-transfer/v3-mode-of-transfer.component';
import { V3NoRowsToShowOverlayComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-no-rows-to-show-overlay/v3-no-rows-to-show-overlay.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35CommonDropDownSelectorComponent } from 'src/app/shared/v3/v35-dropdown/v35-common-dropdown-selector.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { CommonLayoutV35Component } from 'src/app/layout/v3-layout/common-layout-v35/common-layout-v35.component';
import { ListHeaderV35Component } from 'src/app/shared/v3/common-components/list-header-v35/list-header-v35.component';
import { CommonListSkeltonComponent } from 'src/app/shared/v3/common-components/common-list-skelton/common-list-skelton.component';
import {
  faChevronLeft,
  faChevronRight,
  faCreditCard,
  faEllipsisVertical,
  faEye,
  faEyeSlash,
  faPlus
} from '@fortawesome/pro-solid-svg-icons';
import { ScrollListenerDirective } from 'src/app/directive/scroll-listner.directive';
import { RecievedCardsDetailsOcwV35Component } from './components/v35/details/received-cards-details-ocw-v35/received-cards-details-ocw-v35.component';
import { SentCardsListOcwV35Component } from './components/v35/lists/sent-cards-list-ocw-v35/sent-cards-list-ocw-v35.component';
import { CardsDetailsOcwV35Component } from './components/v35/cards-details-ocw-v35/cards-details-ocw-v35.component';
import { ReceivedCardsListOcwV35Component } from './components/v35/lists/received-cards-list-ocw-v35/received-cards-list-ocw-v35.component';
import { CreditCardsDetailsOcwV35Component } from './components/v35/details/credit-cards-details-ocw-v35/credit-cards-details-ocw-v35.component';
import { CreditCardsOcwV35Component } from './components/v35/lists/credit-cards-ocw-v35/credit-cards-ocw-v35.component';
import { SentCardsDetailsOcwV35Component } from './components/v35/details/sent-cards-details-ocw-v35/sent-cards-details-ocw-v35.component';
import { CardsOcwV3Component } from './pages/cards-ocw-v3/cards-ocw-v3.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { V3CommonTransactionTableModule } from '../v3-common-transactions-table/v3-common-transaction-table.module';
import { CardsListOcwV35Component } from './components/v35/cards-list-ocw-v35/cards-list-ocw-v35.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { SentRecvCommonCardTableV35Component } from './components/v35/details/sent-recv-common-card-table-v35/sent-recv-common-card-table-v35.component';
import { CardsTransactionsV4Component } from './components/v4/cards-transactions-v4/cards-transactions-v4.component';

const routes: Routes = [
  { path: '', component: CardsOcwV3Component, data: { title: 'My Cards' } },
  {
    path: 'receive',
    component: CardsOcwV3Component,
    data: { title: 'My Cards' }
  }
];

/**
 * @description Module for cards in V3 UI. Lazy loaded. Frontend for credit, sent, recieved and cloud(Currently disabled) cards in v3.
 * @route {{baseUrl}}/v3/manage/cards,
 * @class
 * @module
 */
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    PipesModule,
    AngularMaterialModule,
    V3ActionButtonComponent,
    V3ModeOfTransferComponent,
    V3NoRowsToShowOverlayComponent,
    V3ViewButtonComponent,
    DemoVideoComponent,
    V3UpdatedAtComponent,
    V3StatusComponent,
    V3PayeeNameComponent,
    CommonLayoutV35Component,
    V3CommonTransactionTableModule,
    ListHeaderV35Component,
    CommonListSkeltonComponent,
    FontAwesomeModule,
    V35CommonDropDownSelectorComponent,
    CommonButtonV35Component,
    ScrollListenerDirective,
    SentRecvCommonCardTableV35Component,
    CardsOcwV3Component,
    CardsListOcwV35Component,
    CreditCardsOcwV35Component,
    SentCardsListOcwV35Component,
    ReceivedCardsListOcwV35Component,
    CardsDetailsOcwV35Component,
    CreditCardsDetailsOcwV35Component,
    SentCardsDetailsOcwV35Component,
    RecievedCardsDetailsOcwV35Component,
    CardsTransactionsV4Component
  ]
})
export class CardsOcwV3Module {
  private library = inject(FaIconLibrary);

  constructor() {
    this.library.addIcons(
      faEllipsisVertical,
      faChevronRight,
      faChevronLeft,
      faEye,
      faEyeSlash,
      faPlus,
      faCreditCard
    );
  }
}
