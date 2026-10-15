import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  faCheck,
  faEnvelope,
  faTruckFast,
  faVanShuttle,
  faBarcode,
  faCircleCheck
} from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { RouterModule, Routes } from '@angular/router';
import { PhoneInputComponent } from 'src/app/shared/components/phone-input/phone-input.component';
import { guestGuard } from 'src/app/core/guards/core/guest.guard';
import { authGuard } from 'src/app/core/guards/core/auth.guard';
import { NgSelectModule } from '@ng-select/ng-select';
import { faEye, faEyeSlash } from '@fortawesome/pro-regular-svg-icons';
import { SharedModule } from '../../shared/shared.module';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { Signup2Component } from './components/signup2/signup2.component';
import { IpSecurityNotifyComponent } from './components/ip-security-notify/ip-security-notify.component';
import { TwoFactorAuthComponent } from './components/two-factor-auth/two-factor-auth.component';
import { TwoFactorAuthV4Component } from './components/two-factor-auth-v4/two-factor-auth-v4.component';
import { LoginV4Component } from './components/login-v4/login-v4.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ForgotPasswordV4Component } from './pages/forgot-password-v4/forgot-password-v4.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { SubmitOtpComponent } from './pages/submit-otp/submit-otp.component';
import { SetNewPasswordComponent } from './components/set-new-password/set-new-password.component';
import { WhiteLabelPipe } from '../../pipes/white-label.pipe';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    component: LoginComponent,
    data: { title: 'Login' }
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    component: RegisterComponent,
    data: { title: 'Register' }
  },
  { path: 'two-factor-auth', component: TwoFactorAuthComponent },
  { path: 'two-factor-auth-v4', component: TwoFactorAuthV4Component },
  { path: 'login-v4', component: LoginV4Component },
  {
    path: 'user-verification-required/:key',
    canActivate: [guestGuard],
    component: IpSecurityNotifyComponent
  },
  { path: 'signup/:plancode', component: Signup2Component },
  {
    path: 'password',
    canActivate: [guestGuard],
    children: [
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: 'submit-otp', component: SubmitOtpComponent },
      { path: 'reset', component: ForgotPasswordComponent },
      { path: 'reset-v4', component: ForgotPasswordV4Component },
      { path: 'reset/:id', component: ResetPasswordComponent }
    ]
  },
  {
    path: 'set-new-password',
    canActivate: [authGuard],
    component: SetNewPasswordComponent
  },
  {
    path: '',
    loadChildren: () => import('../main.module').then((m) => m.MainModule)
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    NgxMaskPipe,
    SharedModule,
    PhoneInputComponent,
    AngularMaterialModule,
    PipesModule,
    RouterModule.forChild(routes),
    WhiteLabelPipe,
    NgSelectModule,
    NgOptimizedImage,
    FontAwesomeModule,
    LoginComponent,
    RegisterComponent,
    ResetPasswordComponent,
    SubmitOtpComponent,
    ForgotPasswordComponent,
    Signup2Component,
    IpSecurityNotifyComponent,
    TwoFactorAuthComponent,
    TwoFactorAuthV4Component,
    LoginV4Component,
    SetNewPasswordComponent
  ]
})
export class AuthModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(
      faCheck,
      faEnvelope,
      faTruckFast,
      faVanShuttle,
      faBarcode,
      faCircleCheck,
      faEye,
      faEyeSlash
    );
  }
}
