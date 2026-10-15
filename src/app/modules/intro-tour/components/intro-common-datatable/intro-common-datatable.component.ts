import { AgGridAngular } from '@ag-grid-community/angular';
// import {
//   ColDef,
//   GridReadyEvent,
//   IServerSideDatasource
// } from '@ag-grid-community/core';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, input } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DemoVideoComponent } from 'src/app/shared/components/demo-video/demo-video.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';

@Component({
  selector: 'app-intro-common-datatable',
  standalone: true,
  imports: [
    CommonModule,
    AgGridAngular,
    CommonButtonV35Component,
    FontAwesomeModule,
    DemoVideoComponent,
    V3ViewButtonComponent,
    DataRangeV35Component,
    MatMenuModule
  ],
  templateUrl: './intro-common-datatable.component.html',
  styleUrl: './intro-common-datatable.component.scss'
})
export class IntroCommonDatatableComponent {
  headerElements = input<IV3DtHeaderElements | undefined>(undefined);
  filterComponent = DtSearchBoxComponent;
  cellComponent = DtSearchBoxComponent;
  columnHeadingComponents = input([
    {
      heading: 'Payee',
      filterComponent: this.filterComponent
    },
    {
      heading: 'Amount',
      filterComponent: this.filterComponent
    },
    {
      heading: 'Memo',
      filterComponent: this.filterComponent
    },
    {
      heading: 'Created By',
      filterComponent: this.filterComponent
    },
    {
      heading: 'Reference ID',
      filterComponent: this.filterComponent
    },
    {
      heading: 'Updated At',
      filterComponent: this.filterComponent
    },
    {
      heading: 'Source',
      filterComponent: this.filterComponent
    },
    {
      heading: 'Type',
      filterComponent: this.filterComponent
    },
    {
      heading: 'Status',
      filterComponent: this.filterComponent
    },
    {
      heading: 'View',
      filterComponent: null
    }
  ]);

  rowData = input([
    {
      payee: 'Payee 1',
      amount: 12,
      memo: 'Memo',
      created_by: 'User 1',
      reference_id: '1002',
      updated_at: '02/20/2024',
      sourceType: 'CARD',
      type: 'Heading8',
      status: 'Pending',
      view: 'Source'
    },
    {
      payee: 'Payee 1',
      amount: 12,
      memo: 'Memo',
      created_by: 'User 1',
      reference_id: '1002',
      updated_at: '02/20/2024',
      sourceType: 'CARD',
      type: 'Heading8',
      status: 'Pending',
      view: 'Source'
    }
  ]);

  @Output() headerButtonEvent = new EventEmitter();

  onHeaderButtonClick(id?: string) {
    this.headerButtonEvent.emit(id);
  }
}
