import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/pro-solid-svg-icons';
import { finalize } from 'rxjs';
import { IApiRes } from 'src/app/models/api';
import { IApiSettingsDetails } from 'src/app/models/developer';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DeveloperPanelService } from 'src/app/shared/service/developer-panel/developer-panel.service';
import { ValidationService } from 'src/app/shared/service/validation/validation.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3ViewButtonComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-view-button/v3-view-button.component';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { CommonInputFieldComponent } from 'src/app/shared/v3/common-input-field/common-input-field.component';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { V3PayloadComponent } from '../../link-payload';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-api-log',
  templateUrl: './api-log.component.html',
  styleUrls: ['./api-log.component.scss'],
  standalone: true,
  imports: [
    V3DataTableComponent,
    CommonInputFieldComponent,
    CommonButtonV35Component,
    ReactiveFormsModule,
    FontAwesomeModule
  ]
})
export class ApiLogComponent implements OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private developerService = inject(DeveloperPanelService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  public tableId = DTTableId.apiRequestLog;

  searchLoading = signal(false);
  faMagnifyingGlass = faMagnifyingGlass;

  searchForm = new FormGroup({
    eventId: new FormControl('', [
      Validators.required,
      ValidationService.noWhitespaceValidator
    ])
  });

  /**
   * @description Disable search while loading or until the user types something.
   * Whitespace-only input keeps the button enabled so the validation message
   * surfaces on submit.
   */
  get searchDisabled(): boolean {
    return this.searchLoading() || !this.searchForm.value.eventId;
  }

  frameworkComponents = {
    selectBoxComponent: V3DataTableSelectBoxComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    v3ViewButtonComponent: V3ViewButtonComponent,
    v3dateRangeFilterComponent: DataRangeV35Component,
    linkPayloadComponent: V3PayloadComponent
  };

  floatingFilterComponent = {
    selectBox: [
      {
        id: 'http_method',
        values: [
          { value: 'GET', name: 'GET' },
          { value: 'POST', name: 'POST' },
          { value: 'PUT', name: 'PUT' },
          { value: 'DELETE', name: 'DELETE' },
          { value: 'PATCH', name: 'PATCH' }
        ]
      }
    ]
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterComponent
    );
    this.v3DataTableService.resetV3DataTablePayload();
  }

  /**
   * @description Quick search by event id. Resolves the detail endpoint directly
   * (bypassing the timeout-prone aggregated table filter) and navigates to the
   * details page when a matching log exists.
   */
  searchByEventId(): void {
    if (this.searchForm.invalid || this.searchLoading()) {
      this.searchForm.markAllAsTouched();
      return;
    }

    const eventId = (this.searchForm.value.eventId ?? '').trim();
    if (!eventId) {
      this.searchForm.markAllAsTouched();
      return;
    }

    this.searchLoading.set(true);
    this.developerService
      .apiSettingsDetails(eventId)
      .pipe(
        finalize(() => this.searchLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res: IApiRes<IApiSettingsDetails>) => {
          if (res.success && res.data) {
            this.router.navigate(['manage/developer/api-log-details'], {
              queryParams: { id: eventId }
            });
          }
        },
      );
  }

  /**
   * @description Table Coulmns
   */
  colDefId = {
    headerName: 'Event Id',
    minWidth: 80,
    maxWidth: 150,
    field: 'id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3'
  };

  colDefCreatedAtTime = {
    headerName: 'Created At',
    field: 'created_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    maxWidth: 145,
    minWidth: 10,
    floatingFilterComponent: 'v3dateRangeFilterComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRendererForExport: (params: { data: { created_at: string } }) =>
      params.data.created_at
  };

  colDefPayload = {
    headerName: 'Payload',
    field: 'request_body',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'linkPayloadComponent'
  };

  colDefIp = {
    headerName: 'IP',
    minWidth: 100,
    maxWidth: 150,
    field: 'ip_address',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
    sortable: false
  };

  colDefEndPoint = {
    headerName: 'End Point',
    minWidth: 300,
    field: 'full_url',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
    sortable: false
  };

  colDefMethod = {
    headerName: 'Method',
    minWidth: 100,
    maxWidth: 150,
    field: 'http_method',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
    sortable: false
  };

  colDefResponse = {
    headerName: 'Response Status',
    minWidth: 100,
    maxWidth: 150,
    field: 'response_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center pl-2.5',
    headerClass: 'pl-3',
    sortable: false
  };

  colDefViewButton = {
    headerName: 'View',
    field: 'view',
    suppressFloatingFilterButton: true,
    minWidth: 50,
    maxWidth: 100,
    sortable: false,
    cellRenderer: 'v3ViewButtonComponent',
    cellRendererParams: {
      viewButtonType: 1,

      tableId: 91,
      hideMenuOption: true,
      disableToolTip: true
    },
    suppressHeaderMenuButton: true
  };

  /**
   * @description Set column feilds.
   */
  columnDefs = [
    this.colDefId,
    this.colDefIp,
    this.colDefCreatedAtTime,
    this.colDefPayload,
    this.colDefEndPoint,
    this.colDefMethod,
    this.colDefResponse,
    this.colDefViewButton
  ];
}
