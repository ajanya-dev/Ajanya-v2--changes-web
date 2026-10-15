import {
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  signal
} from '@angular/core';
import { V3DataTableComponent } from 'src/app/modules/v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import {
  IV3DtHeaderElements,
  IV3CommonButton
} from 'src/app/modules/v3-data-table/models/v3-data-table';
import { ICellRendererParams } from '@ag-grid-community/core';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DataTableModule } from 'src/app/modules/data-table/data-table.module';
import { V3DataTableModule } from 'src/app/modules/v3-data-table/v3-data-table.module';
import { Subject, take } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  IDtActionCompProp,
  IDtFloatingFilterProp,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { Router } from '@angular/router';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { environment } from 'src/environments/environment';
import { ZilSignService } from '../../service/zil-sign.service';

@Component({
  selector: 'app-sign-doc-list',
  standalone: true,
  imports: [V3DataTableComponent],
  providers: [DataTableModule, V3DataTableModule],
  templateUrl: './sign-doc-list.component.html',
  styleUrl: './sign-doc-list.component.scss'
})
export class SignDocListComponent implements OnInit, OnDestroy {
  private alertService = inject(AlertService);
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private router = inject(Router);
  private zilSignService = inject(ZilSignService);

  videoSlug = signal<string>(
    environment.env_id === 'zilMoney' ? 'zil_sign_zm' : 'zil_sign_ocw'
  );

  tableId = DTTableId.zilSign;
  refreshTableSubject = new Subject<boolean>();
  fieldsShownByDefault: string[] = ['name', 'created_at', 'status', 'action'];

  actionComponentProp: IDtActionCompProp = {
    actionButton: true,
    eyeButton: true
  };

  cellRenderer: {
    action: { name: string; id: string; icon: string; toolTip?: string }[];
  } = {
    action: [
      {
        name: 'Send Now',
        id: 'id_send_now',
        icon: 'fa fa-paper-plane',
        toolTip: 'Send document for signing'
      },
      {
        name: 'Delete',
        id: 'id_delete',
        icon: 'fa fa-trash',
        toolTip: 'Delete document'
      }
    ]
  };

  floatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'status',
        values: [
          { value: 'pending', name: 'Pending' },
          { value: 'signed', name: 'Signed' },
          { value: 'in_progress', name: 'In progress' },
          { value: 'cancelled', name: 'Cancelled' }
        ]
      }
    ],
    selectDate: [
      { id: 'created_at', initialRange: 'All Time' },
      { id: 'signed_at', initialRange: 'All Time' }
    ]
  };

  colDefName = {
    headerName: 'Document Name',
    minWidth: 200,
    field: 'name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'searchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefCreatedAt = {
    headerName: 'Created At',
    minWidth: 150,
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    valueGetter: (params: ICellRendererParams) =>
      params.data?.created_at
        ? new Date(params.data.created_at).toLocaleDateString()
        : ''
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: (params: ICellRendererParams) => ({
      fieldValue: this.getStatusLabel(params.data?.status)
    }),
    valueGetter: (params: ICellRendererParams) =>
      this.getStatusLabel(params.data?.status)
  };

  colDefAction = {
    headerName: 'Actions',
    field: 'action',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'actionComponent',
    sortable: false,
    floatingFilter: true
  };

  columnDefs = [
    this.colDefName,
    this.colDefCreatedAt,
    this.colDefStatus,
    this.colDefAction
  ];

  defaultColumnFields = [
    {
      id: 'name',
      name: 'Document Name',
      isDisabled: false,
      colDef: this.colDefName,
      isChecked: true
    },
    {
      id: 'created_at',
      name: 'Created At',
      isDisabled: false,
      colDef: this.colDefCreatedAt,
      isChecked: true
    },
    {
      id: 'status',
      name: 'Status',
      isDisabled: false,
      colDef: this.colDefStatus,
      isChecked: false
    },
    {
      id: 'action',
      name: 'Actions',
      isDisabled: false,
      colDef: this.colDefAction,
      isChecked: false
    }
  ];

  frameworkComponents = {
    actionComponent: DtActionComponent,
    dateRangeV35Component: DataRangeV35Component,
    searchBoxComponent: DtSearchBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    V3DTCommonFilterComponent
  };

  headerElements = computed<IV3DtHeaderElements>(() => ({
    topRightButtons: [
      {
        text: 'Request Signature',
        id: 'id_request_signature',
        icon: ['fas', 'plus'],
        isAddIcon: true,
        type: { style: 'filled-blue', name: 'action' },
        toolTip: 'Request signature',
        backGroundInput: 'var(--common-blue-color)'
      } as IV3CommonButton
    ],
    videoButton: [
      {
        slug: this.videoSlug()
      }
    ]
  }));

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.floatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp,
      this.tableId
    );
  }

  ngOnDestroy(): void {
    this.v3DataTableService.rowData = [];
  }

  headerButtonClick(event: { id: string }): void {
    if (event.id === 'id_request_signature') {
      this.router.navigate(['manage/business-tools/zil-sign/request-sign']);
    }
  }

  cellRendererActionClick(event: ISelectedSingleRow): void {
    if (!event) {
      return;
    }

    switch (event.id) {
      case 'id_view':
        this.cellRendererViewEvent(event);
        break;
      case 'id_send_now':
        this.cellRendererSendNowEvent(event);
        break;
      case 'id_delete':
        this.cellRendererDeleteEvent(event);
        break;
      default:
        break;
    }
  }

  cellRendererViewEvent(event: ISelectedSingleRow): void {
    if (event?.selectedRow) {
      this.router.navigate([
        `manage/business-tools/zil-sign/sign-doc-view/${event.selectedRow.uuid}`
      ]);
    }
  }

  cellRendererSendNowEvent(event: ISelectedSingleRow): void {
    if (event?.selectedRow) {
      this.router.navigate([`sign-pdf-viewer/${event.selectedRow.uuid}`]);
    }
  }

  cellRendererDeleteEvent(event: ISelectedSingleRow): void {
    if (event?.selectedRow) {
      this.zilSignService
        .deleteDocument(event.selectedRow.uuid)
        .pipe(take(1))
        .subscribe((res) => {
          if (res.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.alertService.successAlert({
              content: 'Document deleted successfully'
            });
          }
        });
    }
  }

  private getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'signed':
        return 'Signed';
      case 'in_progress':
        return 'In progress';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status ?? '';
    }
  }
}
