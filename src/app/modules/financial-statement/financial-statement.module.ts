import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { faCalendar, faEye, faTimes } from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
// User Components
import { FinancialStatementListComponent } from './pages/financial-statement-list/financial-statement-list.component';
import { CheckMailStatementModalComponent } from './modals/check-mail-statement-modal/check-mail-statement-modal.component';
import { EyeButtonComponent } from './components/eye-button/eye-button.component';
import { DataTableModule } from '../data-table/data-table.module';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },

  {
    path: 'index',
    component: FinancialStatementListComponent,
    data: { title: 'My Credits Statement ' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DataTableModule,
    AngularMaterialModule,
    SharedModule,
    V3DataTableModule,
    FontAwesomeModule,
    FinancialStatementListComponent,
    CheckMailStatementModalComponent,
    EyeButtonComponent
  ],
  providers: [DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FinancialStatementModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faEye, faTimes, faCalendar);
  }
}
