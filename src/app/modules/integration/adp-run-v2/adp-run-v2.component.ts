import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { FaIconComponent, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEllipsisVertical } from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subject, takeUntil } from 'rxjs';
import { AdpRunV2Service } from 'src/app/shared/service/integration/adp-run-v2.service';
import { ColDef, ColGroupDef, ICellRendererParams } from '@ag-grid-community/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { V3DataTableComponent } from '../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from '../../data-table/data/table-id';
import { DtSearchBoxComponent } from '../../data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableModule } from '../../v3-data-table/v3-data-table.module';
import { DataTableModule } from '../../data-table/data-table.module';
import { IDtColumnFields } from '../../data-table/model/datatable';
import { V3DataTableService } from '../../v3-data-table/services/v3-data-table.service';
import { IV3DtHeaderElements } from '../../v3-data-table/models/v3-data-table';
import { AdpRunV2DtRendererComponent } from './adp-runv2-dt-renderer.component';

@Component({
  selector: 'app-adp-run-v2',
  standalone: true,
  imports: [
    FontAwesomeModule,
    MatMenuModule,
    V3DataTableComponent,
    FaIconComponent,
    V3DataTableModule,
    DataTableModule
  ],
  templateUrl: './adp-run-v2.component.html',
  styleUrl: './adp-run-v2.component.scss'
})
export class AdpRunV2Component implements OnInit, OnDestroy {

  private router = inject(Router);
  private adpRunV2Service = inject(AdpRunV2Service);
  tableId = DTTableId.adpRunV2;
  private dataTableService = inject(DataTableService);
  private alertService = inject(AlertService);
  private v3DataTableService = inject(V3DataTableService);

  destroy$ = new Subject<void>();
  loading = signal<boolean>(false);

  frameWorkComponents = {
    SearchBoxComponent: DtSearchBoxComponent,
  };

  faEllipsisVertical = faEllipsisVertical;

  menuOptions = [
    { id: 'issue-check', name: 'Issue Check' },
    { id: 'mail-check', name: 'Mail Check' },
    { id: 'send-letter', name: 'Send letter' },
    { id: 'send-virual-carft', name: 'Send Virtual Carft' },
    { id: 'view-details', name: 'View Details' }
  ];

  public columnDefs: (ColDef | ColGroupDef)[];
  public columnFields: IDtColumnFields[];

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Sync',
        id: 'sync',
        isAddIcon: true,
        icon: ['fas', 'refresh'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: 'Sync',
        loading: this.loading(),
      }
    ]
  }));

  ngOnInit(): void {
    this.setColumnDefs();
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.dataTableService.setDataFromParent(this.columnFields, undefined);
  }

  setColumnDefs() {
    this.columnDefs = [
      this.colDefId,
      this.colDefName,
      this.colDefPhone,
      this.colDefAction
    ];

    this.columnFields = [
      {
        id: 'colDefId',
        name: 'Employee ID',
        isDisabled: true,
        colDef: this.colDefId,
        isChecked: true
      },
      {
        id: 'colDefName',
        name: 'Employee Name',
        isDisabled: true,
        colDef: this.colDefName,
        isChecked: true
      },
      {
        id: 'colDefPhone',
        name: 'Employee Phone',
        isDisabled: true,
        colDef: this.colDefPhone,
        isChecked: true
      },
    ];
    this.dataTableService.setDataFromParent(this.columnFields);
  }

  colDefId: ColDef = {
    headerName: 'Employee ID',
    minWidth: 80,
    field: 'employee_id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    headerClass: 'pl-2',
    cellClass: 'flex flex-col justify-center pl-[6px]',
    suppressHeaderMenuButton: true
  };

  colDefName: ColDef = {
    headerName: 'Employee Name',
    minWidth: 80,
    field: 'employee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    headerClass: 'pl-2',
    suppressHeaderMenuButton: true
  };

  colDefPhone: ColDef = {
    headerName: 'Employee Phone',
    minWidth: 80,
    field: 'employee_phone',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    headerClass: 'pl-2',
    suppressHeaderMenuButton: true
  };

  colDefAction: ColDef = {
    headerName: 'Action',
    minWidth: 80,
    maxWidth: 120,
    field: 'action',
    sortable: false,
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    headerClass: 'pl-2',
    suppressHeaderMenuButton: true,
    cellRenderer: AdpRunV2DtRendererComponent,
    cellRendererParams: {
      onSelect: (params: ICellRendererParams & { 'click-event': string }) => {
        this.onMenuItemClick(params['click-event'], params.data.payee_id);
      }
    }
  };


  onMenuItemClick(id: string, payeeId: string): void {
    switch (id) {
      case 'issue-check':
        this.router.navigateByUrl(`manage/payments/main/pay/bankaccount/check?payee_id=${payeeId}`);
        break;
      case 'mail-check':
        this.router.navigateByUrl(`manage/payments/main/pay/bankaccount/check?payee_id=${payeeId}`);
        break;
      case 'send-letter':
        this.router.navigateByUrl(`manage/business-tools/document-mail`);
        break;
      case 'send-virual-card':
        this.router.navigateByUrl(`manage/payments/main/pay/bankaccount/check?payee_id=${payeeId}`);
        break;
      case 'view-details':
        window.open(`/manage/payees/${payeeId}`);
        break;
      default:
        break;
    }
  }

  syncEmployee(): void {
    this.loading.set(true);
    this.adpRunV2Service.syncEmployee()
      .pipe(
        finalize(() => { this.loading.set(false); }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result => {
          if (result) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Employee synced successfully',
              close: true
            });
            this.dataTableService.setRefreshStatus(true);
            this.v3DataTableService.refreshV3DataTable();
          }
        })
      });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  headerButtonEvent(event: { id: string; selectedRows: any[], tableId: number }): void {
    if (event.id === 'sync') {
      this.syncEmployee();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
