import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from 'src/app/shared/shared.module';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faCalendar } from '@fortawesome/pro-solid-svg-icons';
import { DataTableModule } from '../data-table/data-table.module';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { CentralReportListComponent } from './pages/central-report-list/central-report-list.component';
import { V3DataTableModule } from '../v3-data-table/v3-data-table.module';

const routes: Routes = [
  { path: '', redirectTo: 'index', pathMatch: 'full' },
  {
    path: 'index',
    component: CentralReportListComponent,
    data: { title: 'Central Report ' }
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    AngularMaterialModule,
    HttpClientModule,
    DataTableModule,
    SharedModule,
    DemoVideoComponent,
    V3DataTableModule,
    CentralReportListComponent
  ],
  providers: [TitleCasePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CentralReportModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faCalendar);
  }
}
