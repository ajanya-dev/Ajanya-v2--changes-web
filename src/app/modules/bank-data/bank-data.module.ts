import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { DateRangeComponent } from 'src/app/shared/components/date-range/date-range.component';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import {
  faCirclePlus,
  faEdit,
  faEllipsisH,
  faExclamationTriangle,
  faMinusCircle,
  faPen,
  faPenToSquare,
  faPlus,
  faRefresh,
  faTimes,
  faTrash,
  faX
} from '@fortawesome/pro-solid-svg-icons';
import { ViewBankDataComponent } from './pages/view-bank-data/view-bank-data.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { AddCompanyComponent } from './modals/add-company-modal/add-company-modal.component';
import { AddNewRuleModalComponent } from './modals/add-new-rule-modal/add-new-rule-modal.component';
import { ListRulesComponent } from './pages/bank-data-list-rules/bank-data-list-rules.component';
import { BankDataListCategoriesComponent } from './pages/bank-data-list-categories/bank-data-list-categories.component';
import { BankDataAddCategoryModalComponent } from './modals/bank-data-add-category-modal/bank-data-add-category-modal.component';
import { BankDataEditProviderModalComponent } from './modals/bank-data-edit-provider-modal/bank-data-edit-provider-modal.component';
import { BankDataEditAccountModalComponent } from './modals/bank-data-edit-account-modal/bank-data-edit-account-modal.component';
import { bankDataDescriptionComponent } from './pages/view-bank-data/bankDataDescription';
import { BankDataCommonSearchComponent } from './pages/view-bank-data/dtBankDataSearch';
import { DataTableModule } from '../data-table/data-table.module';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';

const routes: Routes = [
  {
    path: '',
    component: ViewBankDataComponent,
    data: { title: 'Bank Data ' }
  },
  {
    path: 'list-rules',
    component: ListRulesComponent
  },
  {
    path: 'list-categories',
    component: BankDataListCategoriesComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    SharedModule,
    NgSelectModule,
    DataTableModule,
    DateRangeComponent,
    V3DataTableModule,
    FontAwesomeModule,
    ViewBankDataComponent,
    AddCompanyComponent,
    AddNewRuleModalComponent,
    ListRulesComponent,
    BankDataListCategoriesComponent,
    BankDataAddCategoryModalComponent,
    BankDataEditProviderModalComponent,
    BankDataEditAccountModalComponent,
    bankDataDescriptionComponent,
    BankDataCommonSearchComponent
  ],
  providers: [CurrencyPipe]
})
export class BankDataModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faTrash,
      faPlus,
      faTimes,
      faEdit,
      faPen,
      faX,
      faRefresh,
      faMinusCircle,
      faEllipsisH,
      faExclamationTriangle,
      faCirclePlus,
      faPenToSquare
    );
  }
}
