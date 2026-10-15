import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { faPlus, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { CategoryListComponent } from './pages/category-list/category-list.component';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { DataTableModule } from '../data-table/data-table.module';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: CategoryListComponent,
    data: { title: 'Category List ' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    HttpClientModule,
    DataTableModule,
    V3DataTableModule,
    CategoryListComponent
  ],
  exports: []
  // entryComponents:[ActionFilterComponent,TypeSelectBoxComponent,HeaderCheckBoxComponent]
})
export class CategoryModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faTrash, faPlus);
  }
}
