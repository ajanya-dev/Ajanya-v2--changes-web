import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { RouterModule, Routes } from '@angular/router';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import {
  faBriefcase,
  faBuilding,
  faCamera,
  faPlus,
  faTimes
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { CommonCountryDropDownComponent } from 'src/app/shared/v3/common-country-drop-down/common-country-drop-down.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { CompanyManagementListsComponent } from './pages/company-management-list/company-management-list.component';
import { CompanyManagementListAddModalComponent } from './modals/company-management-list-add-modal/company-management-list-add-modal.component';
import { CompanyCancelDeletionModalComponent } from './modals/company-cancel-deletion-modal/company-cancel-deletion-modal.component';

const routes: Routes = [
  { path: '', redirectTo: 'company_management', pathMatch: 'full' },
  { path: 'company_management', component: CompanyManagementListsComponent }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    AngularMaterialModule,
    NgxMaskDirective,
    NgxMaskPipe,
    CommonCountryDropDownComponent,
    FontAwesomeModule,
    CompanyManagementListsComponent,
    CompanyManagementListAddModalComponent,
    CompanyCancelDeletionModalComponent
  ]
})
export class CompanyManagementModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faPlus, faTimes, faBriefcase, faCamera, faBuilding);
  }
}
