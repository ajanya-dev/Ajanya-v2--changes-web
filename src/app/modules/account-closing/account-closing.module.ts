import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';
import { faTimes, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { AccountCloseComponent } from './pages/account-close/account-close.component';
import { PermanentlyDeleteComponent } from './pages/permanently-delete/permanently-delete.component';
import { DeleteModalComponent } from './modals/delete-modal/delete-modal.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { ConfirmDeleteComponent } from './modals/confirm-delete/confirm-delete.component';

const routes: Routes = [
  { path: '', redirectTo: 'closemyaccount', pathMatch: 'full' },

  {
    path: 'closemyaccount',
    component: AccountCloseComponent
  },
  {
    path: 'permanently-delete',
    component: PermanentlyDeleteComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SharedModule,
    AngularMaterialModule,
    FontAwesomeModule,
    CommonButtonV35Component,
    AccountCloseComponent,
    PermanentlyDeleteComponent,
    DeleteModalComponent,
    ConfirmDeleteComponent
  ]
})
export class AccountClosingModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faTimes, faXmark);
  }
}
