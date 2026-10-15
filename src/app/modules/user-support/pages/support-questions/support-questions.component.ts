import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ICellRendererParams } from '@ag-grid-community/core';
import { Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CategoryService } from 'src/app/shared/service/category/category.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  IDtColumnFields,
  IDtFloatingFilterProp,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import {
  DTTableId,
  TTableIdValues
} from 'src/app/modules/data-table/data/table-id';
import { AddQuestionModalComponent } from '../../modals/add-question-modal/add-question-modal.component';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';

@Component({
  selector: 'app-support-questions',
  templateUrl: './support-questions.component.html',
  styleUrls: ['./support-questions.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class SupportQuestionsComponent implements OnDestroy, OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);

  public tableId: TTableIdValues = DTTableId.supportQuestions; // Data Table Id

  subscriptions: Subscription[] = [];
  rowIndex: number;
  isRefresh!: boolean;
  status: number;

  /**
   * Header elements properties
   */
  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'New',
        id: 'new',
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        isAddIcon: true,
        toolTip: 'New Cash Expense'
      }
    ]
  }));

  // EXTERNAL CHILD COMPONENTS
  frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    SelectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent
  };

  // FILTER CUSTOM COMPONENTS
  FloatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'severity',
        values: [
          { value: 1, name: 'Low' },
          { value: 2, name: 'Medium' },
          { value: 3, name: 'High' }
        ]
      },
      {
        id: 'status',
        values: [
          { value: 1, name: 'Open' },
          { value: 2, name: 'Resolved' }
        ]
      }
    ],
    selectDate: [
      { id: 'created_at', initialRange: 'All Time', isPrimary: true }
    ]
  };

  // ACTION COMPONENT PROPERTIES
  actionComponentProp = {
    actionButton: false,
    eyeButton: true
  };

  cellRenderer = {
    action: [
      {
        name: 'Resolve',
        id: 'editRow',
        icon: 'fa fa-edit'
      }
    ]
  };

  ngOnInit(): void {
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  headerButtonClick(event: {
    id: string;
    selectedRows: ISelectedSingleRow['selectedRows'];
    tableId: number;
  }) {
    switch (event.id) {
      case 'new':
        this.onNew();
        break;
      default:
        break;
    }
  }

  // ON ROW CLICKED
  rowClicked(event: {
    data: {
      id: number;
      status: number;
      support_ticket: string;
      subject: string;
    };
    type: string;
  }) {
    this.rowIndex = event.data.id;
    this.status = event.data.status;
    if (event.type === 'rowClicked') {
      this.router.navigate([`/manage/user-support/allMessages`], {
        queryParams: {
          id: this.rowIndex,
          name: event.data.support_ticket,
          subject: event.data.subject,
          status: this.status
        }
      });
    }
  }

  // eye button
  cellRendererViewEvent(event: {
    id: string;
    selectedRow: {
      id: number;
      status: number;
      support_ticket: string;
      subject: string;
    };
    type: string;
  }) {
    if (!event || Object.keys(event).length === 0) {
      return;
    }
    const data = event.selectedRow;
    this.rowIndex = data.id;
    this.status = data.status;
    this.router.navigate([`/manage/user-support/allMessages`], {
      queryParams: {
        id: this.rowIndex,
        name: data.support_ticket,
        subject: data.subject,
        status: this.status
      }
    });
  }

  // NEW BUTTON
  onNew() {
    const dialogRef = this.dialog.open(AddQuestionModalComponent, {
      // open modal
      maxWidth: '510px',
      width: '93%'
    });

    dialogRef.afterClosed().subscribe((id) => {
      if (id !== '') {
        this.dataTableService.setRefreshStatus(true);
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  onMultipleDelete(selectedRows: ISelectedSingleRow['selectedRows']): void {
    const itemIds: { ids: string[] } = { ids: [] };
    selectedRows?.forEach((val) => {
      itemIds.ids.push(val?.id);
    });

    if (selectedRows?.length === 0) {
      const alertData = {
        content: 'Please select Category to delete.'
      };
      this.alertService.infoAlert(alertData);
    } else {
      const alertData = {
        content: 'Want to Delete Categories',
        cancelMsg: 'No, cancel!',
        doneMsg: 'Yes, Delete it!'
      };
      const alert = this.alertService.confirmAlert(alertData);
      alert.afterClosed().subscribe((result) => {
        if (result) this.multipeDelete(itemIds);
      });
    }
  }

  multipeDelete(itemIds: { ids: string[] }) {
    this.subscriptions.push(
      this.categoryService
        .deleteMulitipleCategories(itemIds)
        .subscribe((res) => {
          if (res.success === true) {
            const alertData = {
              title: 'Deleted!',
              content: 'Category Deleted.',
              close: true
            };
            this.dataTableService.setRefreshStatus(true);
            this.alertService.successAlert(alertData);
          }
        })
    );
  }

  // *****************************************************Data Table Column Fields*****************************************************
  colDefId = {
    headerName: 'Ticket No',
    field: 'support_ticket',
    suppressFloatingFilterButton: true,
    minWidth: 180,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false
  };

  colDefSubject = {
    headerName: 'Subject',
    // Width: 208,
    minWidth: 180,
    field: 'subject',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefSeverity = {
    headerName: 'Severity',
    field: 'severity',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agNumberColumnFilter',

    cellRenderer: (params: ICellRendererParams) => {
      if (params.value === 1) {
        return '<span >Low</span>';
      }
      if (params.value === 2) {
        return '<span >Medium</span>';
      }
      if (params.value === 3) {
        return '<span >High</span>';
      }
      return '';
    },
    cellRendererForExport: (params: ICellRendererParams) => {
      if (params.value === 1) {
        return 'Low';
      }
      if (params.value === 2) {
        return 'Medium';
      }
      if (params.value === 3) {
        return 'High';
      }
      return '';
    }
  };

  colDefCreated = {
    minWidth: 120,
    headerName: 'Created At',
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      const [date] = params.data.created_at.toString().split('_');
      return `${date}`;
    }
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'status',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agNumberColumnFilter',

    cellRenderer: (params: ICellRendererParams) =>
      params.value === 1 ? 'Open' : 'Resolved'
  };

  colDefAction = {
    headerName: 'Action',
    field: 'id',
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    sortable: false,
    cellRenderer: 'actionComponent',
    // cellRenderer: ()=>{ return '<i class="fa fa-reply"> </i>' },
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  // SET COLUMN FEILDS
  columnDefs = [
    this.colDefId,
    this.colDefSubject,
    this.colDefSeverity,
    this.colDefStatus,
    this.colDefCreated,
    this.colDefAction
  ];

  defaultColumnFields: IDtColumnFields[] = [
    {
      id: 'support_ticket',
      name: 'Ticket No',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'servity',
      name: 'Severity',
      isDisabled: false,
      colDef: this.colDefSeverity,
      isChecked: true
    },
    {
      id: 'status',
      name: 'status Type',
      isDisabled: true,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'subject',
      name: 'Subject Name',
      isDisabled: false,
      colDef: this.colDefSubject,
      isChecked: true
    },
    {
      id: 'created_at',
      name: 'Created At',
      isDisabled: false,
      colDef: this.colDefCreated,
      isChecked: true
    },
    {
      id: 'action',
      name: 'Action',
      isDisabled: true,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }
}
