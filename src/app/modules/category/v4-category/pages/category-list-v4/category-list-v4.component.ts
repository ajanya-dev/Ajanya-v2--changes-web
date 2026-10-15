import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { LucideAngularModule } from 'lucide-angular';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { CategoryService } from 'src/app/shared/service/category/category.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { V4PageHeaderComponent } from 'src/app/shared/V4/v4-page-header/v4-page-header.component';
import { IV4HeaderAction } from 'src/app/shared/V4/v4-page-header/v4-page-header.model';
import { CategoryTypeBadgeV4Component } from '../../components/category-type-badge-v4/category-type-badge-v4.component';
import { CategoryActionV4Component } from '../../components/category-action-v4/category-action-v4.component';
import { CategoryStatusBadgeV4Component } from '../../components/category-status-badge-v4/category-status-badge-v4.component';
import { CategoryAddModalV4Component } from 'src/app/shared/modal/category-modal/category-add-modal-v4/category-add-modal-v4.component';

@Component({
  selector: 'app-category-list-v4',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatTooltip,
    V4DataTableComponent,
    V4PageHeaderComponent
  ],
  templateUrl: './category-list-v4.component.html',
  styleUrl: './category-list-v4.component.scss'
})
export class CategoryListV4Component implements OnInit {
  public tableId = DTTableId.category;

  private dialog = inject(MatDialog);
  private alertService = inject(V4AlertService);
  private categoryService = inject(CategoryService);
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private destroyRef = inject(DestroyRef);
  private location = inject(Location);

  public frameworkComponents = {
    categoryTypeBadgeV4: CategoryTypeBadgeV4Component,
    categoryStatusBadgeV4: CategoryStatusBadgeV4Component,
    categoryActionV4: CategoryActionV4Component,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    DropdownFilterComponent: V4DropdownFloatingFilterComponent
  };

  deleteLoading = signal(false);

  public readonly headerActions: IV4HeaderAction[] = [
    {
      id: 'new',
      text: 'New Category',
      style: 'primary',
      lucideIcon: 'plus',
      toolTip: 'Create A New Income Or Expense Category'
    }
  ];

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'New',
        id: 'id_new',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: 'Create New Category'
      },
      {
        text: 'Delete',
        id: 'multipleDelete',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        lucideIcon: 'trash-2',
        backGroundInput: 'var(--v4-common-red-color)',
        type: 'list',
        toolTip: 'Delete The Selected Categories',
        loading: this.deleteLoading(),
        floatingBarVariant: 'filled-danger'
      }
    ]
  }));

  // ── Column Definitions ──────────────────────────────────────────────

  colDefId = {
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    resizable: false,
    headerName: '',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    cellRenderer: () => '',
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    pinned: 'left' as const
  };

  colDefCategoryName = {
    headerName: 'Category Name',
    field: 'catagory_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    flex: 1,
    minWidth: 150
  };

  colDefType = {
    headerName: 'Type',
    field: 'catagory_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'DropdownFilterComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'categoryTypeBadgeV4',
    cellClass: 'flex items-center',
    flex: 1,
    minWidth: 190
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'category_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'DropdownFilterComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'categoryStatusBadgeV4',
    cellClass: 'flex items-center',
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    pinned: 'right' as const,
    lockPosition: 'right',
    lockPinned: true,
    suppressMovable: true
  };

  colDefAction = {
    headerName: 'Action',
    sortable: false,
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 90,
    minWidth: 80,
    pinned: 'left' as const,
    lockPinned: true,
    lockPosition: true,
    suppressMovable: true,
    resizable: false,
    cellClass: 'flex items-center',
    cellRenderer: 'categoryActionV4',
    cellRendererParams: () => ({
      onActionClick: (row: Record<string, unknown>, label: string) =>
        this.handleItemAction(row, label)
    }),
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  columnFields = [
    {
      id: 'id',
      name: '#',
      colDef: this.colDefId,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_action',
      name: 'Action',
      colDef: this.colDefAction,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_category_name',
      name: 'Category Name',
      colDef: this.colDefCategoryName,
      isChecked: true,
      isDisabled: true
    },
    {
      id: 'id_type',
      name: 'Type',
      colDef: this.colDefType,
      isChecked: true,
      isDisabled: false
    },
    {
      id: 'id_status',
      name: 'Status',
      colDef: this.colDefStatus,
      isChecked: true,
      isDisabled: false
    }
  ];

  private floatingFilterComponent = {
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

  // ── Lifecycle ────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.floatingFilterComponent,
      undefined,
      undefined,
      this.tableId
    );
    this.refreshDataTable();
  }

  // ── Table Helpers ────────────────────────────────────────────────────

  refreshDataTable(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  // ── Event Handlers ───────────────────────────────────────────────────

  onHeaderAction(id: string | number): void {
    if (id === 'new') this.openAddModal();
  }

  headerButtonClick(event: { id: string; selectedRows: Record<string, unknown>[] }): void {
    switch (event.id) {
      case 'id_new':
        this.openAddModal();
        break;
      case 'multipleDelete':
        this.onBulkDelete(event.selectedRows);
        break;
    }
  }

  cellRendererActionClick(event: { id: string; selectedRow: Record<string, unknown> }): void {
    switch (event.id) {
      case 'id_EditRow':
        this.onEditRow(event.selectedRow);
        break;
      case 'id_DeleteRow':
        this.onDeleteRow(event.selectedRow);
        break;
    }
  }

  handleItemAction(row: Record<string, unknown>, label: string): void {
    switch (label) {
      case 'Edit':
        this.onEditRow(row);
        break;
      case 'Delete':
        this.onDeleteRow(row);
        break;
    }
  }

  // ── CRUD Operations ──────────────────────────────────────────────────

  openAddModal(): void {
    this.dialog
      .open(CategoryAddModalV4Component, {
        maxWidth: '510px',
        width: '95%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        autoFocus: false
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) this.refreshDataTable();
      });
  }

  onEditRow(row: Record<string, unknown>): void {
    this.dialog
      .open(CategoryAddModalV4Component, {
        maxWidth: '510px',
        width: '95%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        autoFocus: false,
        data: { selectedItem: row }
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res?.success) this.refreshDataTable();
      });
  }

  onDeleteRow(row: Record<string, unknown>): void {
    const confirmRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete?'
    });

    confirmRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.categoryService
            .deleteCategory(row['id'] as string)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res.success) {
                this.alertService.successAlert({
                  title: 'Success',
                  content: 'Category deleted',
                  timeout: 2000,
                  close: true
                });
                this.refreshDataTable();
              }
            });
        }
      });
  }

  onBulkDelete(selectedRows: Record<string, unknown>[]): void {
    if (!selectedRows?.length) {
      this.alertService.warningAlert({ content: 'Please select categories to delete' });
      return;
    }

    const confirmRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete the selected categories?'
    });

    confirmRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          const ids = selectedRows.map((r) => r['id'] as string);
          this.deleteLoading.set(true);
          this.categoryService
            .deleteMulitipleCategories({ ids })
            .pipe(
              takeUntilDestroyed(this.destroyRef),
              finalize(() => this.deleteLoading.set(false))
            )
            .subscribe((res) => {
              if (res.success) {
                this.alertService.successAlert({
                  title: 'Success',
                  content: 'Categories deleted',
                  timeout: 2000,
                  close: true
                });
                this.refreshDataTable();
              }
            });
        }
      });
  }

  goBack(): void {
    this.location.back();
  }
}
