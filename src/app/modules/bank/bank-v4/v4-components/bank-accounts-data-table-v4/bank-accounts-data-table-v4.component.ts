import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  OnDestroy
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RowNode } from '@ag-grid-community/core';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { DtSelectDateComponent } from 'src/app/modules/data-table/components/dt-select-date/dt-select-date.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { IBankData } from 'src/app/models/bank';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { ActivatedRoute } from '@angular/router';
import { finalize, take } from 'rxjs';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { DatePipe } from '@angular/common';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { IHeaderData } from 'src/app/layout/model/header';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.service';
import { BankDataV35Service } from '../../../bank-v3/v35-services/bank-data-v35.service';
import { V4DataTableComponent } from '../../../../v4-data-table/components/v4-data-table/v4-data-table.component';
import { AchStatusCellV4Component } from './cell-renderers/ach-status-cell-v4.component';
import { VerifiedStatusCellV4Component } from './cell-renderers/verified-status-cell-v4.component';
import { BankAccountsActionCellV4Component } from './cell-renderers/bank-accounts-action-cell-v4.component';
import { AddBankMethodChoiceModalComponent } from '../../v4-modals/add-bank-method-choice-modal/add-bank-method-choice-modal.component';
import { NickNameCellRendererV4Component } from './cell-renderers/nick-name-cell-renderer-v4.component';

/**
 * @description Ag grid table with all bank accounts (v4)
 */
@Component({
  selector: 'app-bank-accounts-data-table-v4',
  templateUrl: './bank-accounts-data-table-v4.component.html',
  styleUrls: ['./bank-accounts-data-table-v4.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent]
})
export class BankAccountsDataTableV4Component implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  public v3DataTableService = inject(V3DataTableService);
  public bankDataService = inject(BankDataV35Service);
  private route = inject(ActivatedRoute);
  private personaHelperService = inject(PersonaHelperService);
  private localStorageService = inject(LocalStorageService);
  private datePipe = inject(DatePipe);
  private destroyRef = inject(DestroyRef);
  private bankAccountService = inject(BankAccountsService);
  private alertService = inject(V4AlertService);
  private customDoubleSideModalService = inject(CustomDoubleSideModalService);
  private headerService = inject(HeaderService);

  tableId = DTTableId.bankAccounts;
  selectedRows: RowNode<IBankData>[] = [];

  /** Floating action bar buttons */
  headerElements: IV3DtHeaderElements = {
    buttons: [
      {
        id: 'id_delete',
        text: 'Delete',
        lucideIcon: 'trash-2',
        floatingBarVariant: 'filled-danger'
      }
    ]
  };

  /** ***** Ag grid column definitions ******* */

  colDefId: ICoulmnDefFields = {
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'boxId',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    pinned: 'left',
    // No flex classes here — the compact theme right-aligns the selection
    // checkbox via justify-content on the cell, and a flex-col cellClass
    // flips the axis and breaks alignment with the header checkbox.
    cellClass: 'pl-[6px]',
    headerClass: 'pl-[8px]'
  };

  colDefBankAccName = {
    headerName: 'Name',
    field: 'bank_account_account_name',
    suppressFloatingFilterButton: true,
    minWidth: 150,
    flex: 1,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center items-start pl-3',
    cellRenderer: (params: { data: IBankData }) =>
      params.data.bank_account_account_name
  };

  colDefNickName = {
    headerName: 'Nick Name',
    field: 'bank_account_nick_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 140,
    flex: 1,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center items-start pl-3',
    cellRenderer: 'nickNameCellRenderer'
  };

  colDefAccNo = {
    headerName: 'Account No',
    field: 'bank_account_account_number',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 140,
    flex: 1,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center items-start pl-3',
    cellRenderer: (params: { data: IBankData }) =>
      params?.data?.truncatedBankAccNumber
  };

  colDefStatus = {
    headerName: 'ACH Status',
    field: 'ach_status',
    suppressFloatingFilterButton: true,
    minWidth: 170,
    flex: 1.2,
    sortable: false,
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    cellRenderer: 'applayAch',
    cellClass: 'flex flex-col justify-center items-start pl-3'
  };

  colDefBankName = {
    headerName: 'Bank Name',
    field: 'bank_name',
    suppressFloatingFilterButton: true,
    minWidth: 160,
    flex: 1.4,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center items-start pl-3',
    cellRenderer: (params: { data: IBankData; value: string }): string =>
      params.value
  };

  colDefVerified = {
    field: 'verified_by',
    suppressFloatingFilterButton: true,
    headerName: 'Verified',
    minWidth: 200,
    flex: 1.4,
    sortable: false,
    cellRenderer: 'varifiComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filter: 'agNumberColumnFilter',
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilterComponentParams: {
      table: 'bankAccount_data_table'
    },
    cellClass: 'flex flex-col justify-center items-start pl-3',
    valueGetter: (params: { data: IBankData }) => {
      // Only For when Export Table data
      const value = params?.data?.verified_by;
      let status = '';
      if (value === null) {
        status = 'Verify Now';
      } else if (params?.data?.mark_as_verified === 1) {
        status = 'Verified';
      } else if (value === 3) {
        status = 'Confirm Micro Deposit';
      } else if (value === 4) {
        status = 'Pending';
      } else if (value === 5) {
        status = 'Approved';
        status = 'Rejected';
      } else {
        status = 'Verify Now';
      }
      return status;
    }
  };

  // View column (kebab + eye icon cluster) — pinned left, right after the
  // checkbox. Fixed to the icon cluster's width so leftover space goes to the
  // flexed data columns instead.
  colActionField: ICoulmnDefFields = {
    headerName: 'View',
    field: 'action',
    minWidth: 76,
    maxWidth: 88,
    sortable: false,
    cellRenderer: 'v3BankAccountsDataTableActionsComponent',
    suppressHeaderMenuButton: true,
    suppressMovable: true,
    pinned: 'left',
    lockPosition: true,
    lockPinned: true
  };

  // SET COLUMN FEILDS
  columnDefs = [
    this.colDefId,
    this.colActionField,
    this.colDefBankAccName,
    this.colDefNickName,
    this.colDefAccNo,
    this.colDefStatus,
    this.colDefBankName,
    this.colDefVerified
  ];

  frameworkComponents = {
    // Framework components using on this ag grid
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    selectDateComponent: DtSelectDateComponent,
    actionComponent: DtActionComponent,
    varifiComponent: VerifiedStatusCellV4Component,
    applayAch: AchStatusCellV4Component,
    v3BankAccountsDataTableActionsComponent: BankAccountsActionCellV4Component,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    nickNameCellRenderer: NickNameCellRendererV4Component
  };

  FloatingFilterComponent = {
    selectBox: [
      {
        id: 'verified_by',
        values: [
          { value: '', name: 'Verify Now' },
          { value: '1', name: 'Verified' },
          { value: '4', name: 'Pending' },
          { value: '3', name: 'Confirm MD' },
          { value: '6', name: 'Rejected- Verify instantly' },
          { value: '10', name: 'Rejected- Reapply' },
          { value: '12', name: 'failed' }
        ]
      },
      {
        id: 'catagory_type',
        values: [
          { value: 1, name: 'income' },
          { value: 2, name: 'expence' }
        ]
      }
    ]
  };

  exportConfig = { ignoreColumns: ['ach_status'] };
  exportLoading = false;
  paginationPageSize: number;
  endRow = 50;
  startRow = 0;

  ngOnInit() {
    this.initializeV3DataTable();
    this.dataTableService.setDataFromParent(
      undefined,
      this.FloatingFilterComponent
    );
    this.getGridPage();
    this.getRowSelectionData();
    this.bankAccountService.requestNewBankAccount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.onNew());
  }

  /** To get grid view value from a subject */
  getGridPage() {
    this.bankDataService
      .getGrid()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.viewToggle(res);
      });
  }

  /**
   *
   * @param event data for payload
   * Used to download all bank accounts data
   */
  onExportData(event: {
    all: boolean;
    fromDate: Date;
    toDate: Date;
    fileFormat: 'csv' | 'xlsx';
  }) {
    if (!this.exportLoading) {
      this.exportLoading = true;
      this.bankDataService
        .exportAllBankAccountsData({
          fromDate: this.transformDate(event.fromDate),
          toDate: this.transformDate(event.toDate),
          type: event.fileFormat
        })
        .pipe(
          finalize(() => {
            this.exportLoading = false;
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((val) => {
          if (val.success) {
            window.location.href = val.data.url;
          }
        });
    }
  }

  transformDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') ?? '';
  }

  onNew() {
    if (this.bankAccountService.isPermissionPopupEnabled) {
      return;
    }

    // _headerData is a session-long subject — take(1) so one click opens the
    // modal once instead of re-firing on every header reload.
    // eslint-disable-next-line no-underscore-dangle
    this.headerService._headerData
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        const isUser = (res as unknown as IHeaderData).isLoggedInAsClient;
        if (isUser) {
          this.bankAccountService.isPermissionPopupEnabled = true;
          this.bankAccountService
            .AddBank({ permission_check_to_create_bank_account: '' })
            .pipe(
              finalize(() => {
                this.bankAccountService.isPermissionPopupEnabled = false;
              }),
              takeUntilDestroyed(this.destroyRef)
            )
            .subscribe({
              next: () => {
                this.openAddBankMethodChoiceModal();
              }
            });
        } else {
          this.openAddBankMethodChoiceModal();
        }
      });
  }

  private openAddBankMethodChoiceModal(): void {
    this.customDoubleSideModalService.open(AddBankMethodChoiceModalComponent, {
      width: '480px',
      disableClose: true
    });
  }

  /**
   * @description Setting up the payload  for loading ag grid
   */
  initializeV3DataTable() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const page = this.localStorageService.getItem('selectedTablePage');
        if (params.get('selectPrev') && page) {
          this.dataTableService.paginationSizeController
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((val) => {
              this.paginationPageSize = val;
              this.v3DataTableService.CurrentPage = parseInt(page, 10);
              this.endRow = parseInt(page, 10) * this.paginationPageSize;
              this.startRow = this.endRow - this.paginationPageSize;
              this.v3DataTableService.defaultPayload = {
                startRow: this.startRow ?? 0,
                endRow: this.endRow ?? 50,
                rowGroupCols: [],
                valueCols: [],
                pivotCols: [],
                pivotMode: false,
                groupKeys: [],
                filterModel: {},
                sortModel: []
              };
              this.localStorageService.removeItem('selectedTablePage');
            });
        } else {
          this.v3DataTableService.defaultPayload = {
            startRow: 0,
            endRow: 50,
            rowGroupCols: [],
            valueCols: [],
            pivotCols: [],
            pivotMode: false,
            groupKeys: [],
            filterModel: {},
            sortModel: []
          };
        }
      });
  }

  /** Subscribe to row selection changes */
  private getRowSelectionData() {
    this.v3DataTableService.v3RowSelectionData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rows) => {
        this.selectedRows = rows;
      });
  }

  /** Handle floating action bar button clicks */
  onHeaderButtonEvent(event: {
    id: string | number;
    selectedRows: IBankData[];
    tableId: number;
  }) {
    switch (event.id) {
      case 'id_new':
        this.onNew();
        break;
      case 'id_delete':
        this.onDelete();
        break;
      default:
        break;
    }
  }

  /** Delete selected bank accounts */
  private onDelete() {
    const selectedRows = this.selectedRows.map(
      (row) => row.data
    ) as IBankData[];

    if (selectedRows.length === 0) {
      this.alertService.warningAlert({
        content: 'Please select at least one Bank Account to delete'
      });
      return;
    }

    if (selectedRows.length === 1) {
      const selected = selectedRows[0];
      const alert = this.alertService.confirmAlert({
        content: 'Are you sure you want to delete this bank account?',
        cancelMsg: 'No, cancel!',
        doneMsg: 'Yes, Delete it!'
      });
      alert
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          if (result) {
            if (this.bankDataService.isAchPending(selected, true)) {
              return;
            }
            this.deleteSingleBankAccount(selected);
          }
        });
    }

    if (selectedRows.length > 1) {
      const ids: string[] = [];
      const achPendingBanks: string[] = [];
      selectedRows.forEach((element) => {
        ids.push(element.encrypted_bankacc_id);
        if (
          element.ach_application_status === 0 ||
          element.ach_application_status === 7 ||
          element.ach_application_status === 2
        ) {
          achPendingBanks.push(element.bank_account_account_name as string);
        }
      });

      const alert = this.alertService.confirmAlert({
        content: 'Are you sure you want to delete the selected bank accounts?',
        cancelMsg: 'No, cancel!',
        doneMsg: 'Yes, Delete!'
      });
      alert
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((result) => {
          if (result) {
            if (achPendingBanks.length > 0) {
              this.alertService.warningAlert({
                content:
                  "Sorry, you can't delete the selected bank account with a pending ACH application associated with it."
              });
              return;
            }
            this.deleteMultipleBankAccounts(ids);
          }
        });
    }
  }

  private deleteSingleBankAccount(selected: IBankData, confirmed: 0 | 1 = 0) {
    this.bankAccountService
      .deleteBankAccount(selected.encrypted_bankacc_id, confirmed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dataTableService.setRefreshStatus(true);
            this.selectedRows.length = 0;
            this.v3DataTableService.refreshV3DataTable();
            this.alertService.successAlert({ content: 'Deleted' });
            this.headerService.refreshDynamicHeader.next(true);
          }
        },
        error: (err) => {
          if (err.error?.errorCode === 125) {
            this.onDeleteBank(
              { ids: [selected.encrypted_bankacc_id] },
              err.error.errorMsg
            );
          } else if (err.error?.errorCode === 126) {
            const alert = this.alertService.confirmAlert({
              content: err.error.errorMsg,
              doneMsg: 'Continue',
              isCancel: true,
              cancelMsg: 'Cancel'
            });
            alert
              .afterClosed()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((res) => {
                if (res) {
                  this.deleteSingleBankAccount(selected, 1);
                }
              });
          }
        }
      });
  }

  private deleteMultipleBankAccounts(ids: string[], confirmed: 0 | 1 = 0) {
    this.bankAccountService
      .multiDeleteBankAccount({ ids }, confirmed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.dataTableService.setRefreshStatus(true);
            this.selectedRows.length = 0;
            this.v3DataTableService.refreshV3DataTable();
            this.alertService.successAlert({ content: 'Deleted' });
            this.headerService.refreshDynamicHeader.next(true);
          }
        },
        error: (err) => {
          if (err.error?.errorCode === 125) {
            this.onDeleteBank({ ids }, err.error.errorMsg);
          } else if (err.error?.errorCode === 126) {
            const alert = this.alertService.confirmAlert({
              content: err.error.errorMsg,
              doneMsg: 'Continue',
              isCancel: true,
              cancelMsg: 'Cancel'
            });
            alert
              .afterClosed()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((res) => {
                if (res) {
                  this.deleteMultipleBankAccounts(ids, 1);
                }
              });
          }
        }
      });
  }

  /** Handle delete bank with error code 125 (force delete) */
  private onDeleteBank(data: { ids: string[] }, errorMsg: string) {
    const dRef = this.alertService.failedAlert({
      content: errorMsg,
      doneMsg: 'Ok',
      isCancel: true,
      cancelMsg: 'Cancel'
    });
    dRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.bankAccountService
            .deleteBankAccountInfo(data)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
              if (result?.success) {
                this.dataTableService.setRefreshStatus(true);
                this.selectedRows.length = 0;
                this.v3DataTableService.refreshV3DataTable();
                this.alertService.successAlert({ content: 'Deleted' });
                this.headerService.refreshDynamicHeader.next(true);
              }
            });
        }
      });
  }

  viewToggle(isGridView: boolean) {
    if (isGridView) {
      this.bankDataService.toggleView({ gridView: true });
    } else {
      this.bankDataService.toggleView({ gridView: false });
    }
  }

  ngOnDestroy() {
    this.v3DataTableService.rowData = [];
    this.bankDataService.isFromService = null;
    this.personaHelperService.kycKybVerifivationResult.set(undefined);
  }
}
