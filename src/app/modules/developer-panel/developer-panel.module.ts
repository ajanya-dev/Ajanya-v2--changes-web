import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { CustomerSupportComponent } from 'src/app/shared/components/customer-support/customer-support.component';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import {
  faCopy,
  faEye,
  faCircleQuestion
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { DeveloperPanelComponent } from './pages/developer-panel/developer-panel.component';
import { ApiLogComponent } from './pages/api-log/api-log.component';
import { ApiSettingsDetailsComponent } from './pages/api-settings-details/api-settings-details.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { WebhookEventsComponent } from './pages/webhook-events/webhook-events.component';
import { DataTableModule } from '../data-table/data-table.module';
import { WhiteLabelPipe } from '../../pipes/white-label.pipe';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: DeveloperPanelComponent,
    data: { title: 'Developer Panel' }
  },
  {
    path: 'api-log',
    component: ApiLogComponent
  },
  {
    path: 'api-log-details',
    component: ApiSettingsDetailsComponent
  },
  {
    path: 'webhook-events',
    component: WebhookEventsComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    DataTableModule,
    SharedModule,
    CustomerSupportComponent,
    WhiteLabelPipe,
    WhiteLabelDirective,
    V3DataTableModule,
    FontAwesomeModule,
    ApiLogComponent,
    ApiSettingsDetailsComponent,
    DeveloperPanelComponent,
    WebhookEventsComponent
  ]
})
export class DeveloperPanelModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faEye, faCopy, faCircleQuestion);
  }
}
