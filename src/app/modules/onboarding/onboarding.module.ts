import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NgSelectModule } from '@ng-select/ng-select';
import { ImageCropperModule } from 'ngx-image-cropper';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';

import { PipesModule } from 'src/app/pipes/pipes.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { faArrowLeft, faCheck, faPlus } from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { DataTableModule } from '../data-table/data-table.module';
import { UserModule } from '../user/user-v2/user.module';
import { Step1Component } from './pages/step1/step1.component';
import { Step2Component } from './pages/step2/step2.component';
import { SignupPolicyPageComponent } from './pages/signup-policy-page/signup-policy-page.component';

import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { FeatureListV4Component } from './pages/feature-list-v4/feature-list-v4.component';

const routes: Routes = [
  {
    path: 'termsAndConditions',
    component: SignupPolicyPageComponent
  },
  {
    path: 'step1',
    component: Step1Component
  },
  {
    path: 'step2',
    component: Step2Component
  },
  {
    path: 'feature',
    component: FeatureListV4Component
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    NgSelectModule,
    DataTableModule,
    MatCheckboxModule,
    NgxMaskDirective,
    NgxMaskPipe,
    ImageCropperModule,
    PipesModule,
    UserModule,
    Step1Component,
    Step2Component,
    SignupPolicyPageComponent
  ]
})
export class OnboardingModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faArrowLeft, faCheck, faPlus);
  }
}
