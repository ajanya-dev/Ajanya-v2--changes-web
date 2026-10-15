import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageSearchesComponent } from './pages/page-searches/page-searches.component';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import {
  faArrowToBottom,
  faBallotCheck,
  faBank,
  faChartLine,
  faCheck,
  faClone,
  faCommentAltDots,
  faCommentLines,
  faCreditCard,
  faEnvelope,
  faEnvelopeOpenDollar,
  faFile,
  faFileCheck,
  faFileDownload,
  faFileImport,
  faFileInvoice,
  faInfoCircle,
  faKey,
  faListUl,
  faMagnifyingGlass,
  faMoneyCheck,
  faMoneyCheckEdit,
  faPhoneAlt,
  faPlus,
  faPlusCircle,
  faPlusSquare,
  faRepeat1Alt,
  faRepeatAlt,
  faScroll,
  faSearch,
  faUserCircle,
  faUserFriends,
  faWallet
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';

const routes: Routes = [
  {
    path: '',
    component: PageSearchesComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    FontAwesomeModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    PageSearchesComponent
  ]
})
export class SearchesModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faSearch,
      faMagnifyingGlass,
      faMoneyCheck,
      faPlusCircle,
      faFile,
      faClone,
      faArrowToBottom,
      faBank,
      faListUl,
      faPlusSquare,
      faUserFriends,
      faCommentLines,
      faCommentAltDots,
      faInfoCircle,
      faPhoneAlt,
      faUserCircle,
      faKey,
      faBallotCheck,
      faEnvelopeOpenDollar,
      faFileImport,
      faFileCheck,
      faFileDownload,
      faCreditCard,
      faCheck,
      faScroll,
      faPlus,
      faRepeat1Alt,
      faEnvelope,
      faWallet,
      faMoneyCheckEdit,
      faChartLine,
      faFileInvoice,
      faRepeatAlt
    );
  }
}
