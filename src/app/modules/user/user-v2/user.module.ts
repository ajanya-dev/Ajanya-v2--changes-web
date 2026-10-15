import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewPhoneInputComponent } from 'src/app/shared/components/new-phone-input/new-phone-input.component';
import { CommonCountryDropDownComponent } from 'src/app/shared/v3/common-country-drop-down/common-country-drop-down.component';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { ImageCropperModule } from 'ngx-image-cropper';
import { PipesModule } from 'src/app/pipes/pipes.module';
import {
  faBell,
  faCaretDown,
  faCircleCheck,
  faCrown,
  faLink,
  faPlus,
  faUser,
  faGear,
  faEnvelope,
  faSlidersH,
  faBriefcase,
  faFileLines,
  faShieldCheck,
  faAngleDown,
  faDownload,
  faEyeSlash,
  faEye
} from '@fortawesome/pro-solid-svg-icons';
import { SearchFilterPipe } from 'src/app/pipes/search-filter.pipe';
import {
  FontAwesomeModule,
  FaIconLibrary
} from '@fortawesome/angular-fontawesome';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V35ControlMessageComponent } from "../../../shared/v3/control-message-v35/control-message-v35.component";
import { AngularMaterialModule } from '../../angular-material/angular-material.module';
import { DataTableModule } from '../../data-table/data-table.module';
import { UserProfileComponent } from './pages/user-profile/user-profile.component';
import { VerifyEmailPhoneComponent } from './pages/verify-email-phone/verify-email-phone.component';
import { UserSettingsComponent } from './pages/user-settings/user-settings.component';
import { PersonalInfoComponent } from './components/personal-info/personal-info.component';
import { BusinessInfoComponent } from './components/business-info/business-info.component';
import { SecurityComponent } from './components/security/security.component';
import { TwoFactorStep1Component } from './modals/two-factor-step1/two-factor-step1.component';
import { TwoFactorTurnonComponent } from './modals/two-factor-turnon/two-factor-turnon.component';
import { TwoFactorOtpVerifyComponent } from './modals/two-factor-otp-verify/two-factor-otp-verify.component';
import { GeneralSettingsComponent } from './components/general-settings/general-settings.component';
import { ChecklistSettingsComponent } from './components/checklist-settings/checklist-settings.component';
import { UploadDocsComponent } from './components/upload-docs/upload-docs.component';
import { NotificationSettingsComponent } from './components/notification-settings/notification-settings.component';
import { EmailSettingsComponent } from './components/email-settings/email-settings.component';
import { AdvancedSettingsComponent } from './components/advanced-settings/advanced-settings.component';
import { MyBusinessesListV35Component } from './components/my-businesses-list-v35/my-businesses-list-v35.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'index',
    pathMatch: 'full'
  },
  {
    path: 'index',
    component: UserProfileComponent,
    data: { title: 'My Profile' }
  },
  {
    path: 'verify-email-phone',
    component: VerifyEmailPhoneComponent,
    data: { title: 'My Profile' }
  },
  {
    path: 'user-settings',
    component: UserSettingsComponent,
    data: { title: 'Application Settings ' }
  },
  {
    path: 'changepassword',
    component: UserProfileComponent,
    data: { title: 'My Profile' }
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
    FontAwesomeModule,
    NewPhoneInputComponent,
    CommonCountryDropDownComponent,
    MyBusinessesListV35Component,
    CommonButtonV35Component,
    V35ControlMessageComponent,
    UserProfileComponent,
    PersonalInfoComponent,
    BusinessInfoComponent,
    UploadDocsComponent,
    SecurityComponent,
    UserSettingsComponent,
    TwoFactorStep1Component,
    TwoFactorTurnonComponent,
    TwoFactorOtpVerifyComponent,
    GeneralSettingsComponent,
    ChecklistSettingsComponent,
    NotificationSettingsComponent,
    EmailSettingsComponent,
    AdvancedSettingsComponent,
    VerifyEmailPhoneComponent
  ],
  exports: [PersonalInfoComponent],
  providers: [SearchFilterPipe]
})
export class UserModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faBell,
      faCaretDown,
      faCircleCheck,
      faUser,
      faLink,
      faCrown,
      faPlus,
      faGear,
      faEnvelope,
      faUser,
      faSlidersH,
      faBriefcase,
      faFileLines,
      faShieldCheck,
      faAngleDown,
      faDownload,
      faEye,
      faEyeSlash
    );
  }
}
