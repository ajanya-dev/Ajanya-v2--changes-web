import { Component, OnInit, inject, signal } from '@angular/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ComponentType } from '@angular/cdk/portal';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { JsonPipe, NgClass } from '@angular/common';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { DataTableModule } from 'src/app/modules/data-table/data-table.module';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { IDtActionCompProp } from 'src/app/modules/data-table/model/datatable';
import { finalize, take } from 'rxjs';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCopy, faTimes } from '@fortawesome/pro-solid-svg-icons';
import { IApplicationErrorData } from '../../model/application-error';
import { ApplicationErrorService } from '../../services/application-error.service';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-application-error-list',
  standalone: true,
  imports: [
    V3DataTableComponent,
    JsonPipe,
    V3DataTableModule,
    DataTableModule,
    FaIconComponent,
    NgClass
  ],
  templateUrl: './application-error-list.component.html',
  styleUrl: './application-error-list.component.scss'
})
export class ApplicationErrorListComponent implements OnInit {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private applicationErrorService = inject(ApplicationErrorService);

  public tableId = DTTableId.applicationErrors;
  statsLoading = signal(false);
  errorLoading = signal(false);
  isRightPanelOpen = signal(false);
  copyCLass = false;
  errorData: IApplicationErrorData;
  faCopy = faCopy;
  faTimes = faTimes;

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    SearchBoxComponent: DtSearchBoxComponent,
    actionComponent: DtActionComponent,
    selectDateComponent: DataRangeV35Component
  };

  actionComponentProp: IDtActionCompProp = {
    eyeButton: true
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      this.columnFields,
      undefined,
      undefined,
      this.actionComponentProp,
      this.tableId
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  colDefUser = {
    headerName: 'User Name',
    minWidth: 210,
    field: 'user_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefErrorType = {
    headerName: 'Error Type',
    field: 'error_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefErrorSource = {
    headerName: 'Error Source',
    field: 'error_source',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefErrorMessage = {
    headerName: 'Error Message',
    field: 'error_message',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefExternalTransactionId = {
    headerName: 'Transaction ID',
    field: 'external_transaction_id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefCreatedAt = {
    headerName: 'Created at',
    field: 'application_errors.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: { data: { created_at: string } }) => {
      return params.data.created_at;
    }
  };

  colDefAction = {
    maxWidth: 100,
    minWidth: 100,
    headerName: 'Action',
    field: 'id',
    suppressFloatingFilterButton: true,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: false,
    suppressHeaderMenuButton: true
  };

  cellRendererViewEvent(event: {
    id: string;
    tableId: string;
    selectedRow: { id: string };
  }): void {
    if (event?.selectedRow?.id) {
      this.getApplicationErrors(event.selectedRow.id);
      this.isRightPanelOpen.set(true);
    }
  }

  columnDefs = [
    this.colDefUser,
    this.colDefErrorType,
    this.colDefErrorSource,
    this.colDefErrorMessage,
    this.colDefExternalTransactionId,
    this.colDefCreatedAt,
    this.colDefAction
  ];

  columnFields = [
    {
      id: 'user_name',
      name: 'User Name',
      isDisabled: true,
      colDef: this.colDefUser,
      isChecked: true
    },
    {
      id: 'error_type',
      name: 'Error Type',
      isDisabled: false,
      colDef: this.colDefErrorType,
      isChecked: true
    },
    {
      id: 'error_source',
      name: 'Error Source',
      isDisabled: false,
      colDef: this.colDefErrorSource,
      isChecked: true
    },
    {
      id: 'error_message',
      name: 'Error Message',
      isDisabled: false,
      colDef: this.colDefErrorMessage,
      isChecked: true
    },
    {
      id: 'external_transaction_id',
      name: 'Transaction ID',
      isDisabled: false,
      colDef: this.colDefExternalTransactionId,
      isChecked: true
    },
    {
      id: 'id_createdAt',
      name: 'Created at',
      isDisabled: false,
      colDef: this.colDefCreatedAt,
      isChecked: true
    },
    {
      id: 'id_action',
      name: 'Action',
      isDisabled: false,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  getApplicationErrorStatus() {
    this.statsLoading.set(true);
    this.applicationErrorService
      .getApplicationErrorStatus()
      .pipe(
        take(1),
        finalize(() => this.statsLoading.set(false))
      )
      .subscribe();
  }

  getApplicationErrors(id: string) {
    this.errorLoading.set(true);
    this.applicationErrorService
      .getApplicationErrors(id)
      .pipe(
        take(1),
        finalize(() => this.errorLoading.set(false))
      )
      .subscribe((res) => {
        if (res.success) {
          this.errorData = res.data;
        }
      });
  }

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

  closeRightPanel(): void {
    this.isRightPanelOpen.set(false);
  }
}
