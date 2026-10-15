import { Component, OnInit, inject } from '@angular/core';
import { RowClickedEvent } from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ComponentType } from '@angular/cdk/portal';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { Params } from '@angular/router';
import { NgClass, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faXmark, faSearch } from '@fortawesome/pro-solid-svg-icons';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-webhook-events',
  templateUrl: './webhook-events.component.html',
  styleUrls: ['./webhook-events.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent, FaIconComponent, NgClass, JsonPipe, FormsModule]
})
export class WebhookEventsComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);

  leftCB = '{';
  isShow = false;

  public tableId = DTTableId.webhookLog; // Data Table Id
  copyCLass = false;
  jsonArry: unknown;
  type: string;
  globalSearchValue: string | null = null;
  faXmark = faXmark;
  faSearch = faSearch;

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    SearchBoxComponent: DtSearchBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
  };

  configs = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 'pending', name: 'Pending' },
          { value: 'completed', name: 'Completed' },
          { value: 'failed', name: 'Failed' }
        ]
      }
    ]
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(this.columnFields, this.configs);
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  colDefeventId = {
    headerName: 'Event ID',
    minWidth: 210,
    field: 'uu_id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'addAttachComment'
  };

  colDefEventType = {
    headerName: 'Event Type',
    field: 'event_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefCreatedAt = {
    headerName: 'Created at',
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: { data: { formated_created_at: string } }) => params.data.formated_created_at
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    maxWidth: '100',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: { data: { status: string } }) => {
      if (params.data.status === 'pending') {
        return `<div class="w-full h-full flex justify-center items-center text-common-yellow-color">Pending </div> `;
      }
      if (params.data.status === 'completed') {
        return `<div class="w-full h-full flex justify-center items-center text-common-green-color">Completed </div> `;
      }
      if (params.data.status === 'failed') {
        return `<div class="w-full h-full flex justify-center items-center text-common-red-color">Failed </div> `;
      }
      return '';
    }
  };

  colDefResponseCode = {
    headerName: 'Response Code',
    field: 'http_response_code',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    maxWidth: '120',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellStyle: {
      display: 'flex',
      'justify-content': 'flex-end',
      'padding-right': '20px'
    },
    cellRenderer: (params: { data: { http_response_code: string } }) => {
      const responseCode = Number(params.data.http_response_code);
      if (responseCode >= 300) {
        return `<div class="w-full h-full flex justify-center items-center  text-common-red-color">${params.data.http_response_code} </div> `;
      }
      if (
        responseCode >= 200 &&
        responseCode < 300
      ) {
        return `<div class="w-full h-full flex justify-center items-center text-common-green-color">${params.data.http_response_code} </div> `;
      }
      return '';
    }
  };

  rowClicked(event: RowClickedEvent<Params>): void {
    if (event.data) {
      let eventData = event.data.data;

      // Parse JSON string if data is a string
      if (typeof eventData === 'string') {
        try {
          eventData = JSON.parse(eventData);
        } catch (e) {
          // do nothing
        }
      }

      if (eventData?.event) {
        this.jsonArry = eventData.event;
        this.type = eventData.event.type;
        this.isShow = true;
      } else if (eventData?.type) {
        this.jsonArry = eventData;
        this.isShow = false;
        this.type = eventData.type;
      }
    }

    const allAgRows = document.querySelectorAll(
      '.ag-center-cols-container .ag-row-position-absolute'
    );

    if (allAgRows) {
      allAgRows.forEach((item: Params) => {
        item.classList.remove('activeAgRows');
      });
      if (
        event &&
        (event as Params).source &&
        (event as Params).source.centerGui &&
        (event as Params).source.centerGui.element
      ) {
        (event as Params).source.centerGui.element.classList.add(
          'activeAgRows'
        );
      }
    }
  }

  columnDefs = [
    this.colDefeventId,
    this.colDefEventType,
    this.colDefResponseCode,
    this.colDefStatus,
    this.colDefCreatedAt
  ];

  columnFields = [
    {
      id: 'id',
      name: 'Event Id',
      isDisabled: true,
      colDef: this.colDefeventId,
      isChecked: true
    },
    {
      id: 'id_status',
      name: 'EventType',
      isDisabled: false,
      colDef: this.colDefEventType,
      isChecked: true
    },
    {
      id: 'id_responseCode',
      name: 'Response Code',
      isDisabled: false,
      colDef: this.colDefResponseCode,
      isChecked: true
    },
    {
      id: 'id_fromName',
      name: 'Created at',
      isDisabled: false,
      colDef: this.colDefCreatedAt,
      isChecked: true
    },
    {
      id: 'id_status',
      name: 'Status',
      isDisabled: false,
      colDef: this.colDefStatus,
      isChecked: true
    }
  ];

  copyThisLink(content: HTMLInputElement | HTMLPreElement) {
    const copyText = content.textContent;
    const textArea = document.createElement('textarea');
    textArea.textContent = copyText;
    document.body.append(textArea);
    textArea.select();
    document.execCommand('copy');
    textArea.remove();

    this.copyCLass = !this.copyCLass;
    setTimeout(() => {
      this.copyCLass = !this.copyCLass;
    }, 800);
  }

  onGlobalSearch(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;

    if (!this.globalSearchValue) {
      this.v3DataTableService.updateV3DataTableByRemovingFilter = ['data'];
      return;
    }

    const filter = {
      data: {
        filter: this.globalSearchValue,
        filterType: 'text',
        type: 'contains'
      }
    };
    this.v3DataTableService.updateV3DataTable = filter;
  }

  resetGlobalSearch(): void {
    this.globalSearchValue = null;
    this.v3DataTableService.updateV3DataTableByRemovingFilter = ['data'];
  }
}
