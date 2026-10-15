import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { AchAuthorizationComponent } from './pages/ach-authorization/ach-authorization.component';
import { AchEmailModalComponent } from './modals/ach-email-modal/ach-email-modal.component';
import { AchPreviewModalComponent } from './modals/ach-preview-modal/ach-preview-modal.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { DropDownBankComponent } from 'src/app/shared/components/drop-downs/drop-down-bank/drop-down-bank.component';
import { faTimes } from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';

const routes: Routes = [
  // { path: '', redirectTo: 'create', pathMatch: 'full' },
  {
    path: 'auth-form/ach-authorization-form',
    component: AchAuthorizationComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    RouterModule.forChild(routes),
    SharedModule,
    DropDownBankComponent,
    MatDatepickerModule,
    MatFormFieldModule,
    NgxMaskDirective,
    NgxMaskPipe,
    NgSelectModule,
    AchAuthorizationComponent,
    AchEmailModalComponent,
    AchPreviewModalComponent
  ],
  exports: [AchAuthorizationComponent]
})
export class AchModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faTimes);
  }
}
