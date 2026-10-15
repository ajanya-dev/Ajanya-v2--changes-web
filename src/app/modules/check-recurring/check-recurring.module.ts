import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { OcwBackButtonComponent } from 'src/app/shared/components/ocw-back-button/ocw-back-button.component';
import { faCalendar, faEye } from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { CheckRecurringListComponent } from './components/check-recurring-list/check-recurring-list.component';
import { AchRecurringListComponent } from './components/ach-recurring-list/ach-recurring-list.component';
import { GiftCardRecurringListComponent } from './components/gift-card-recurring-list/gift-card-recurring-list.component';
import { CheckRecurringComponent } from './pages/check-recurring/check-recurring.component';
import { CheckMailingRecurringDetailsComponent } from './pages/check-mailing-recurring-details/check-mailing-recurring-details.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { RecurringViewComponent } from './pages/recurring-view/recurring-view.component';
import { AuditTrailTableComponent } from './components/audit-trail-table/audit-trail-table.component';
import { CommentsComponent } from './components/comments/comments.component';
import { DataTableModule } from '../data-table/data-table.module';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';

const routes: Routes = [
  {
    path: 'recurring',
    component: CheckRecurringComponent,
    data: { title: 'Check Mailing Recurring List ' }
  },
  {
    path: 'recurring/show',
    component: RecurringViewComponent
  },
  {
    path: 'recurring/view',
    component: CheckMailingRecurringDetailsComponent
  }
];

/**
 * @description Check Recurring module.
 */
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    DataTableModule,
    AngularMaterialModule,
    SharedModule,
    OcwBackButtonComponent,
    FontAwesomeModule,
    CommonBackButtonV35Component,
    V3DataTableModule,
    CheckRecurringListComponent,
    AchRecurringListComponent,
    GiftCardRecurringListComponent,
    CheckRecurringComponent,
    CheckMailingRecurringDetailsComponent,
    RecurringViewComponent,
    AuditTrailTableComponent,
    CommentsComponent
  ]
})
export class CheckRecurringModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faEye, faCalendar);
  }
}
