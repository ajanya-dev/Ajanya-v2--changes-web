import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared.module';
import { AddInvoiceItemComponent } from './add-invoice-item/add-invoice-item.component';
import { NgxMaskDirective, NgxMaskPipe } from 'ngx-mask';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';

@NgModule({
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    SharedModule,
    FormsModule,
    NgxMaskDirective,
    NgxMaskPipe,
    AddInvoiceItemComponent
  ]
})
export class InvoiceModalModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faPlus);
  }
}
