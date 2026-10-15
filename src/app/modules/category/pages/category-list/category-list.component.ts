import { Subscription, finalize } from 'rxjs';
import {
  Component,
  OnDestroy,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { MatDialog } from '@angular/material/dialog';
import { CategoryAddModalComponent } from 'src/app/shared/modal/category-modal/category-add-modal/category-add-modal.component';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CategoryService } from 'src/app/shared/service/category/category.service';
import { Params } from '@angular/router';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { ComponentType } from '@angular/cdk/portal';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { ICategoryRowData } from '../../model/category';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DTCategoryTypeComponent } from './dt-category-type.component';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class CategoryListComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private categoryService = inject(CategoryService);
  private v3DataTableService = inject(V3DataTableService);

  isDeleting = signal(false);

  public tableId = DTTableId.category;
  selectionBoxValues!: Params;
  subscriptions: Subscription[] = [];
  rowIndex: number;

  headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'New',
        id: 'new',
        icon: ['fas', 'plus'],
        isAddIcon: true,
        backGroundInput: 'var(--common-green-color)',
        type: 'list'
      },
      {
        text: 'Delete',
        id: 'multipleDelete',
        icon: ['fas', 'trash'],
        isAddIcon: true,
        loading: this.isDeleting(),
        backGroundInput: 'var(--common-red-color)',
        type: 'list'
      }
    ]
  }));

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    SelectBoxComponent: V3DataTableSelectBoxComponent,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    categoryComponent:V3DTCategoryTypeComponent
  };

  FloatingFilterComponent: Params = {
    selectBox: [
      {
        id: 'catagory_type',
        values: [
          { value: 1, name: 'Income' },
          { value: 2, name: 'Expense' },
          { value: 3, name: 'Imported from QB' }
        ]
      },
      {
        id: 'category_status',
        values: [
          { value: 1, name: 'Active' },
          { value: 0, name: 'Inactive' }
        ]
      }
    ]
  };

  actionComponentProp = {
    actionButton: true,
    eyeButton: false
  };

  cellRenderer: { action: { name: string; id: string; icon: string }[] } = {
    action: [
      {
        name: 'Edit',
        id: 'editRow',
        icon: 'fa fa-edit'
      },
      {
        name: 'Delete',
        id: 'deleteRow',
        icon: 'fa fa-trash'
      }
    ]
  };

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.reloadTable();
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp,
      this.tableId
    );
  }

  /**
   * Handles header button click
   */
  headerButtonClick(event: { id: string; selectedRows: ICategoryRowData[] }) {
    const { selectedRows } = event;

    switch (event.id) {
      case 'new':
        this.onNew();
        break;
      case 'multipleDelete':
        this.onMultipleDelete(selectedRows);
        break;
      default:
        break;
    }
  }

  /**
   * handles on roiw clicked
   */
  rowClicked(event: number) {
    this.rowIndex = event;
  }

  cellRendererActionClick(event: {
    id: string;
    selectedRow: ICategoryRowData;
  }) {
    const selectedItem = event?.selectedRow;

    if (event?.selectedRow?.catagory_type === 3) {
      this.dataTableService.setActionButtonDisable(true, ['editRow']);
    } else {
      this.dataTableService.setActionButtonDisable(true, ['', '']);
    }

    switch (event.id) {
      case 'editRow':
        this.onEditRow(selectedItem);
        break;
      case 'deleteRow':
        this.onDeleteRow(selectedItem);
        break;
      default:
        break;
    }
  }

  /**
   * Handles new button action
   */
  onNew() {
    const dialogRef = this.dialog.open(CategoryAddModalComponent, {
      maxWidth: '510px',
      width: '93%'
    });

    dialogRef.afterClosed().subscribe((id) => {
      if (id !== '') {
        this.reloadTable();
      }
    });
  }

  onMultipleDelete(selectedRows: ICategoryRowData[]): void {
    const itemIds: { ids: string[] } = { ids: [] };
    selectedRows.forEach((val: { id: string }) => {
      itemIds.ids.push(val.id);
    });

    if (selectedRows.length === 0) {
      this.alertService.warningAlert({
        content: 'Please select category to delete.'
      });
    } else {
      const alert = this.alertService.confirmAlert({
        content: 'Are you sure you want to delete?'
      });
      alert.afterClosed().subscribe((result) => {
        if (result) this.multipeDelete(itemIds);
      });
    }
  }

  multipeDelete(itemIds: { ids: string[] }) {
    this.isDeleting.set(true);
    this.subscriptions.push(
      this.categoryService
        .deleteMulitipleCategories(itemIds)
        .pipe(finalize(() => this.isDeleting.set(false)))
        .subscribe((res) => {
          if (res.success === true) {
            const alertData = {
              content: 'Category deleted.',
              close: true
            };
            this.reloadTable();
            this.alertService.successAlert(alertData);
          }
        })
    );
  }

  onEditRow(selectedRow: ICategoryRowData) {
    const selectedItem = selectedRow;
    const alert = this.dialog.open(CategoryAddModalComponent, {
      maxWidth: '510px',
      width: '93%',
      data: { selectedItem }
    });

    alert.afterClosed().subscribe((result) => {
      if (result?.success) {
        this.reloadTable();
      }
    });
  }

  onDeleteRow(selectedItem: ICategoryRowData) {
    const itemId = selectedItem.id;

    const alert = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete?'
    });
    alert.afterClosed().subscribe((result) => {
      if (result) this.deleteRow(itemId);
    });
  }

  deleteRow(itemId: string) {
    this.subscriptions.push(
      this.categoryService.deleteCategory(itemId).subscribe((res) => {
        if (res.success === true) {
          this.reloadTable();
          const alertData = {
            content: 'Category deleted.',
            close: true
          };
          this.alertService.successAlert(alertData);
        }
      })
    );
  }

  colDefId = {
    headerName: '',
    field: 'id',
    suppressFloatingFilterButton: true,
    maxWidth: 48,
    minWidth: 48,
    checkboxSelection: true,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    sortable: false,
    headerClass: 'pl-3.5',
    tableId: this.tableId,
    headerCheckboxSelection: true,
    showDisabledCheckboxes: true,
    cellClass: 'flex justify-center',
    cellRenderer: () => ''
  };

  colDefCategoryName = {
    headerName: 'Category Name',
    field: 'catagory_name',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
  };

  colDefCategoryType = {
    headerName: 'Type',
    field: 'catagory_type',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    maxWidth: 260,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    cellRenderer: 'categoryComponent',
  };

  colDefCategoryStatus= {
    headerName: 'Status',
    minWidth: 100,
    maxWidth: 120,
    field: 'category_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    sortable: false,
    cellRenderer: 'categoryComponent',
    cellRendererParams: {
      type: 'category_status'
    },
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    tableId: this.tableId,
    filter: 'agNumberColumnFilter',
  };

  actionField = {
    headerName: 'Action',
    minWidth: 100,
    maxWidth: 120,
    field: 'id',
    suppressFloatingFilterButton: true,
    sortable: false,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    tableId: this.tableId
  };

  columnDefs = [
    this.colDefId,
    this.colDefCategoryName,
    this.colDefCategoryType,
    this.colDefCategoryStatus,
    this.actionField
  ];

  columnFields = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },

    {
      id: 'name',
      name: 'Category Name',
      isDisabled: false,
      colDef: this.colDefCategoryName,
      isChecked: true
    },

    {
      id: 'type',
      name: 'Category Type',
      isDisabled: false,
      colDef: this.colDefCategoryType,
      selectBoxData: this.selectionBoxValues,
      isChecked: true
    },
    {
      id: 'status',
      name: 'Status',
      isDisabled: false,
      colDef: this.colDefCategoryStatus,
      isChecked: true
    },
    {
      id: 'action',
      name: 'Action',
      isDisabled: true,
      colDef: this.actionField,
      isChecked: true
    }
  ];

  reloadTable() {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => {
      sub.unsubscribe();
    });
  }
}
