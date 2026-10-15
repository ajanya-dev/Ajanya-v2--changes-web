import { V35ControlMessageComponent } from 'src/app/shared/v3/control-message-v35/control-message-v35.component';
import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ImageCropperModule } from 'ngx-image-cropper';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';

import { PipesModule } from 'src/app/pipes/pipes.module';
import { CommonUploadButtonV35Component } from 'src/app/shared/v3/buttons/common-upload-button-v35/common-upload-button-v35.component';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { StepperV35Component } from 'src/app/shared/v3/common-components/stepper-v35/stepper-v35.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import {
  FontAwesomeModule,
  FaIconLibrary
} from '@fortawesome/angular-fontawesome';
import { CommonBackButtonV35Component } from 'src/app/shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import {
  faArrowLeft,
  faBadgeCheck,
  faCircle,
  faEnvelope,
  faMobile,
  faLightbulbOn,
  faPenToSquare,
  faPlus,
  faUserTie,
  faShieldCheck,
  faTimesCircle,
  faUser,
  faXmark,
  faCircleXmark,
  IconDefinition,
  faClock,
  faLock
} from '@fortawesome/pro-solid-svg-icons';
import {
  faEnvelope as fatEnvelope,
  faMobile as fatMobile,
  faUserTieHair as fatUserTieHair
} from '@fortawesome/pro-thin-svg-icons';
import { DataTableModule } from '../../data-table/data-table.module';
import { VerifyEmailPhoneOcwV3Component } from './pages/verify-email-phone-ocw-v3/verify-email-phone-ocw-v3.component';
import { ConnectPaymentSourceOcwV3Component } from './pages/connect-payment-source-ocw-v3/connect-payment-source-ocw-v3.component';
import { VerifyUserIdOcwV3Component } from './components/verify-user-id-ocw-v3/verify-user-id-ocw-v3.component';
import { AddPayeeOcwV3Component } from './pages/add-payee-ocw-v3/add-payee-ocw-v3.component';
import { VerificationIndexV3Component } from './pages/verification-index-v3/verification-index-v3.component';
import { BusinessVerificationV3Component } from './components/business-verification-v3/business-verification-v3.component';
import { AddBankAccountOcwV3Component } from './pages/add-bank-account-ocw-v3/add-bank-account-ocw-v3.component';
import { AddBankManuallyOcwV3Component } from './pages/add-bank-manually-ocw-v3/add-bank-manually-ocw-v3.component';
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { GettingStartedOcwV3Component } from './pages/getting-started-ocw-v3/getting-started-ocw-v3.component';
import { WhiteLabelPipe } from '../../../pipes/white-label.pipe';
import { CommonCountryDropDownComponent } from 'src/app/shared/v3/common-country-drop-down/common-country-drop-down.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'getting-started',
    pathMatch: 'full'
  },
  {
    path: 'getting-started',
    component: GettingStartedOcwV3Component,
    data: { title: 'Getting Started' }
  },
  {
    path: 'getting-started/:removeBackNavigation',
    component: GettingStartedOcwV3Component,
    data: { title: 'Getting Started' }
  },
  {
    path: 'verify-email-phone',
    component: VerifyEmailPhoneOcwV3Component,
    data: { title: 'Getting Started' }
  },
  {
    path: 'connect-payment-source',
    component: ConnectPaymentSourceOcwV3Component,
    data: { title: 'Getting Started' }
  },
  {
    path: 'add-bank-account',
    component: AddBankAccountOcwV3Component,
    data: { title: 'Add Bank Account' }
  },
  {
    path: 'add-bank-manually',
    component: AddBankManuallyOcwV3Component,
    data: { title: 'Add Bank Account' }
  },
  {
    path: 'add-payee',
    component: AddPayeeOcwV3Component,
    data: { title: 'Add Payee' }
  },
  {
    path: 'verify-user-id',
    component: VerificationIndexV3Component,
    data: { title: 'Getting Started' }
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes),
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    DemoVideoComponent,
    NewPhoneInputComponent,
    NgSelectModule,
    DataTableModule,
    MatCheckboxModule,
    NgxMaskDirective,
    NgxMaskPipe,
    ImageCropperModule,
    PipesModule,
    CommonModule,
    WhiteLabelPipe,
    StepperV35Component,
    CommonButtonV35Component,
    CommonUploadButtonV35Component,
    FontAwesomeModule,
    V35ControlMessageComponent,
    FontAwesomeModule,
    CommonBackButtonV35Component,
    CommonCountryDropDownComponent,
    NgOptimizedImage,
    GettingStartedOcwV3Component,
    VerifyEmailPhoneOcwV3Component,
    ConnectPaymentSourceOcwV3Component,
    VerifyUserIdOcwV3Component,
    AddPayeeOcwV3Component,
    VerificationIndexV3Component,
    BusinessVerificationV3Component,
    AddBankAccountOcwV3Component,
    AddBankManuallyOcwV3Component
  ]
})
export class UserOcwV3Module {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faUser,
      faCircle,
      faPlus,
      faXmark,
      faUserTie,
      fatUserTieHair as IconDefinition,
      faPenToSquare,
      faArrowLeft,
      faTimesCircle,
      faBadgeCheck,
      faLightbulbOn,
      faCircleXmark,
      faClock,
      faLock,
      faShieldCheck,
      faEnvelope,
      faMobile,
      fatEnvelope as IconDefinition,
      fatMobile as IconDefinition
    );
  }
}
