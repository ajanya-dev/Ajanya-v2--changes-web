import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NewBankAccountModalComponent } from './modals/new-bank-account-modal/new-bank-account-modal.component';
import { RouterModule } from '@angular/router';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { SharedModule } from '../shared.module';
import { WireRoutingnumberAddComponent } from './modals/wire-routingnumber-add/wire-routingnumber-add.component';
import { DemoVideoComponent } from '../components/demo-video/demo-video.component';
import { BankVerifyModalComponent } from './modals/bank-verify-modal/bank-verify-modal.component';
import { faPlus, faXmark } from '@fortawesome/pro-solid-svg-icons';
import {
  FaIconLibrary,
  FontAwesomeModule
} from '@fortawesome/angular-fontawesome';

@NgModule({
  imports: [
    AngularMaterialModule,
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    FormsModule,
    SharedModule,
    DemoVideoComponent,
    NgxMaskDirective,
    NgxMaskPipe,
    FontAwesomeModule,
    BankVerifyModalComponent,
    NewBankAccountModalComponent,
    WireRoutingnumberAddComponent
  ]
})
export class BankModalModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faPlus, faXmark);
  }
}
