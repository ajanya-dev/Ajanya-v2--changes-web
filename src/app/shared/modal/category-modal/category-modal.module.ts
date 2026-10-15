import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from 'src/app/modules/angular-material/angular-material.module';
import { ReactiveFormsModule } from '@angular/forms';
import { CategoryAddModalComponent } from './category-add-modal/category-add-modal.component';
import { SharedModule } from '../../shared.module';

@NgModule({
  imports: [
    AngularMaterialModule,
    ReactiveFormsModule,
    CommonModule,
    SharedModule,
    CategoryAddModalComponent
  ]
})
export class CategoryModalModule {}
