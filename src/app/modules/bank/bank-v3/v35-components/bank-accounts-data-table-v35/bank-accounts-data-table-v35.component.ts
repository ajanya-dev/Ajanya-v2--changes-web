import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtSelectDateComponent } from 'src/app/modules/data-table/components/dt-select-date/dt-select-date.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { IBankData } from 'src/app/models/bank';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { ActivatedRoute, Router } from '@angular/router';
import { RowNode } from '@ag-grid-community/core';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { Subscription, catchError, finalize, of, take } from 'rxjs';
import { PositivePayService } from 'src/app/shared/service/positive-pay/positive-pay.service';
import { BankAccountsService } from 'src/app/shared/service/bankAccounts/bank-accounts.service';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DatePipe, NgClass } from '@angular/common';
import { WhiteLabelDirective } from 'src/app/directive/white-label.directive';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { DtVerifyComponent } from '../../../bank-v2/components/dt-verify/dt-verify.component';
import { ApplayAchComponent } from '../../../bank-v2/shared/applay-ach';
import { V35BankAccountsDataTableActionsComponent } from '../v35-bank-accounts-data-table-actions/v35-bank-accounts-data-table-actions.component';
import { BankDataV35Service } from '../../v35-services/bank-data-v35.service';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';
import { UpdatedImportedBanksModalComponent } from '../../../bank-v2/modals/updated-imported-banks-modal/updated-imported-banks-modal.component';
import { NickNameCellRendererComponent } from './nick-name-cell-renderer/nick-name-cell-renderer.component';

/**
 * @description Ag grid table with all bank accounts
 */
@Component({
  selector: 'app-bank-accounts-data-table-v35',
  templateUrl: './bank-accounts-data-table-v35.component.html',
  styleUrls: ['./bank-accounts-data-table-v35.component.scss'],
  standalone: true,
  imports: [
    CommonButtonV35Component,
    NgClass,
    FaIconComponent,
    V3DataTableComponent,
    MatTooltip,
    WhiteLabelDirective
  ]
})
export class BankAccountsDataTableV35Component implements OnInit, OnDestroy {
  /**
   * @description Dependancy injection using inject method
   */
  private dataTableService = inject(DataTableService);
  public v3DataTableService = inject(V3DataTableService);
  private router = inject(Router);
  public bankDataService = inject(BankDataV35Service);
  private positivePayService = inject(PositivePayService);
  private bankAccountService = inject(BankAccountsService);
  private alertService = inject(AlertService);
  private headerService = inject(HeaderService);
  private route = inject(ActivatedRoute);
  private personaHelperService = inject(PersonaHelperService);
  private localStorageService = inject(LocalStorageService);
  private datePipe = inject(DatePipe);
  private dialog = inject(MatDialog);

  /** Variables */
  tableId = DTTableId.bankAccounts; // Data Table Id

  /** ***** Ag grid column definitions ******* */

  colDefId: ICoulmnDefFields = {
    maxWidth: 50,
    headerName: '',
    sortable: false,
    field: 'boxId',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    pinned: 'left',
    cellClass: 'flex flex-col justify-center pl-[6px]',
    headerClass: ' pl-[8px]'
  };

  colDefBankAccName = {
    headerName: 'Name',
    field: 'bank_account_account_name',
    suppressFloatingFilterButton: true,
    minWidth: 250,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { data: IBankData }) =>
      params.data.bank_account_account_name
  };

  colDefNickName = {
    headerName: 'Nick Name',
    field: 'bank_account_nick_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 250,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'nickNameCellRenderer'
  };

  colDefAccNo = {
    headerName: 'Account No',
    field: 'bank_account_account_number',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'SearchBoxComponent',
    minWidth: 250,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { data: IBankData }) =>
      params?.data?.truncatedBankAccNumber
  };

  colDefStatus = {
    headerName: 'ACH Status',
    field: 'ach_status',
    suppressFloatingFilterButton: true,
    minWidth: 130,
    sortable: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'applayAch',
    cellClass: 'flex flex-col justify-center'
  };

  colDefBankName = {
    headerName: 'Bank Name',
    field: 'bank_name',
    suppressFloatingFilterButton: true,
    minWidth: 250,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,

    cellClass: 'flex flex-col justify-center',
    cellRenderer: (params: { data: IBankData; value: string }): string =>
      params.value
  };

  colDefVerified = {
    field: 'verified_by',
    suppressFloatingFilterButton: true,
    headerName: 'Verified',
    minWidth: 250,
    sortable: false,
    cellRenderer: 'varifiComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    filter: 'agNumberColumnFilter',
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilterComponentParams: {
      table: 'bankAccount_data_table'
    },
    cellClass: 'flex flex-col justify-center',
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

  colActionField: ICoulmnDefFields = {
    headerName: 'Action',
    field: 'action',
    minWidth: 100,
    maxWidth: 100,
    sortable: false,
    cellRenderer: 'v3BankAccountsDataTableActionsComponent',
    cellRendererParams: {
      viewButtonType: 0
    },
    suppressHeaderMenuButton: true
  };

  // SET COLUMN FEILDS
  columnDefs = [
    this.colDefId,
    this.colDefBankAccName,
    this.colDefNickName,
    this.colDefAccNo,
    this.colDefStatus,
    this.colDefBankName,
    this.colDefVerified,
    this.colActionField
  ];

  frameworkComponents = {
    // Framework components using on this ag grid
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DtSelectDateComponent,
    actionComponent: DtActionComponent,
    varifiComponent: DtVerifyComponent,
    applayAch: ApplayAchComponent,
    v3BankAccountsDataTableActionsComponent:
      V35BankAccountsDataTableActionsComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    nickNameCellRenderer: NickNameCellRendererComponent
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

  cellRenderer = {
    action: [
      {
        name: 'Edit',
        id: 'id_editRow',
        icon: 'fa fa-edit'
      },
      {
        name: 'Edit Design',
        id: 'id_edit_design_row',
        icon: 'fa fa-pencil'
      },
      {
        name: 'Delete',
        id: 'id_delete_row',
        icon: 'fa fa-trash'
      },
      {
        name: 'Change Starting Number',
        id: 'id_change_starting_number',
        icon: 'fa fa-exchange'
      },
      {
        name: 'Clone Design',
        id: 'id_clone_design_row',
        icon: 'fa fa-clone'
      },
      {
        name: 'ACH Authorization Form',
        id: 'id_ach_authorization_form',
        icon: 'fa-ballot-check fal '
      }
    ]
  };

  actionComponentProp = {
    actionButton: true,
    eyeButton: false
  };

  exportConfig = { ignoreColumns: ['ach_status'] };
  selectedRowData: RowNode<ICommonTransactionTableData>[];
  isRowSelected = false;
  subscriptions: Subscription[] = [];
  exportLoading = false;
  paginationPageSize: number;
  endRow = 50;
  startRow = 0;
  isRowEmpty: number;
  env = environment;

  ngOnInit() {
    this.initializeV3DataTable();
    this.dataTableService.setDataFromParent(
      undefined,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.getRowSelectionData();
    this.removeRowSelectionOnRefresh();
    this.getGridPage();
    this.getRowCount();
  }

  getRowCount() {
    this.subscriptions.push(
      this.v3DataTableService.emptyRowData.subscribe((res) => {
        this.isRowEmpty = res;
      })
    );
  }

  /** To get grid view value from a subject */
  getGridPage() {
    this.subscriptions.push(
      this.bankDataService.getGrid().subscribe((res) => {
        this.viewToggle(res);
      })
    );
  }

  getRowSelectionData() {
    this.subscriptions.push(
      this.v3DataTableService.v3RowSelectionData$.subscribe({
        next: (res) => {
          this.selectedRowData = res;
          this.isRowSelected = !!this.selectedRowData.length;
        }
      })
    );
  }

  removeRowSelectionOnRefresh() {
    this.subscriptions.push(
      this.v3DataTableService.refreshV3DataTableSubject$.subscribe((res) => {
        if (res) {
          this.selectedRowData = [];
          this.isRowSelected = false;
        }
      })
    );
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
      this.subscriptions.push(
        this.bankDataService
          .exportAllBankAccountsData({
            fromDate: this.transformDate(event.fromDate),
            toDate: this.transformDate(event.toDate),
            type: event.fileFormat
          })
          .pipe(
            finalize(() => {
              this.exportLoading = false;
            })
          )
          .subscribe((val) => {
            if (val.success) {
              window.location.href = val.data.url;
            }
          })
      );
    }
  }

  transformDate(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-dd') ?? '';
  }

  /**
   * Navigates to the add bank account page with query params of the current page
   * to get redirected after done adding bank account.
   */
  goToNew() {
    this.bankDataService.onCreateBankAccount();
  }

  /**
   * @description Setting up the payload  for loading ag grid
   */
  initializeV3DataTable() {
    this.subscriptions.push(
      this.route.queryParamMap.subscribe((params) => {
        const page = this.localStorageService.getItem('selectedTablePage');
        if (params.get('selectPrev') && page) {
          this.subscriptions.push(
            this.dataTableService.paginationSizeController.subscribe((val) => {
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
            })
          );
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
      })
    );
  }

  /**
   * @description Toggles view between grid and list
   */
  viewToggle(isGridView: boolean) {
    if (isGridView) {
      this.bankDataService.toggleView({ gridView: true });
    } else {
      this.bankDataService.toggleView({ gridView: false });
    }
  }

  /**
   * @description Check positive pay permission and navigate into corresponding pages
   */
  positivePay() {
    if (!this.isRowEmpty) {
      const data = {
        title: 'Error',
        content:
          'Please add/connect your bank account and try to setup Positive Pay.',
        isCancel: true
      };
      this.alertService.warningAlert(data);
      return;
    }
    this.subscriptions.push(
      this.positivePayService
        .checkPositivePayPermission()
        .pipe(
          catchError((err) => {
            if (!err.error.success && err.error.errorCode === 121) {
              this.router.navigateByUrl(
                '/manage/positivepay/getPositivePayRestrictions'
              );
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.router.navigateByUrl('/manage/positivepay/index');
          }
        })
    );
  }

  /**
   * @description Navigate into import page
   */
  importFromExel() {
    this.router.navigateByUrl('/manage/bankaccount/import-bankaccount/step1');
  }

  onDelete() {
    const selectedRows = this.selectedRowData.map(
      (row) => row.data
    ) as unknown as IBankData[];
    const selected = selectedRows[0];
    if (selectedRows.length === 0) {
      const data = {
        content: 'Please select at least one Bank Account to delete',
        isCancel: false
      };
      this.alertService.warningAlert(data);
    }
    if (selectedRows.length === 1) {
      let data: { ids: string[] } = { ids: [] };
      const arr: string[] = [];
      selectedRows.forEach((element: IBankData) => {
        arr.push(element.encrypted_bankacc_id);
      });
      data = {
        ids: arr
      };
      const response = this.alertService.confirmAlert();
      response.afterClosed().subscribe((result) => {
        if (result === true) {
          if (this.bankDataService.isAchPending(selectedRows[0])) {
            return;
          }
          this.deleteSingleBankAccount(selected, data);
        }
      });
    }
    if (selectedRows.length > 1) {
      let data: { ids: string[] } = { ids: [] };
      const arr: string[] = [];
      const achPendingBanks: string[] = [];
      selectedRows.forEach((element: IBankData) => {
        arr.push(element.encrypted_bankacc_id);
        if (
          element.ach_application_status === 0 ||
          element.ach_application_status === 7 ||
          element.ach_application_status === 2
        ) {
          achPendingBanks.push(element.bank_account_account_name as string);
        }
      });
      data = {
        ids: arr
      };
      const response = this.alertService.confirmAlert();
      response.afterClosed().subscribe((result) => {
        if (result === true) {
          if (achPendingBanks.length > 0) {
            this.alertService.warningAlert({
              content: `Sorry, you cant delete the selected bank account with a pending ACH application associated with it.`
            });
            return;
          }
          this.deleteMultipleBankAccounts(data);
        }
      });
    }
  }

  /**
   * @description Deletes a single bank account. When the API responds with
   * errorCode 126 (deletion needs explicit confirmation), a confirm alert is
   * shown and, on confirmation, the same API is re-called with confirmed = 1.
   * @param selected - The bank row being deleted.
   * @param data - The encrypted ids payload, reused for the errorCode 125 flow.
   * @param confirmed - Confirmation flag sent to the API (0 by default, 1 after the 126 confirm).
   */
  private deleteSingleBankAccount(
    selected: IBankData,
    data: { ids: string[] },
    confirmed = 0
  ) {
    this.subscriptions.push(
      this.bankAccountService
        .deleteBankAccount(selected.encrypted_bankacc_id, confirmed)
        .subscribe(
          (res) => {
            if (res.success === true) {
              this.dataTableService.setRefreshStatus(true);
              const alert = {
                content: 'Deleted',
                close: true,
                timeout: 1500
              };
              this.alertService.successAlert(alert);
            }
          },
          (err: HttpErrorResponse) => {
            if (err.error.errorCode === 125) {
              this.onDeleteBank(data, err.error.errorMsg);
            } else if (err.error.errorCode === 126) {
              const alert = this.alertService.confirmAlert({
                content: err.error.errorMsg,
                doneMsg: 'Continue',
                isCancel: true,
                cancelMsg: 'Cancel'
              });
              alert
                .afterClosed()
                .pipe(take(1))
                .subscribe((res) => {
                  if (res) {
                    this.deleteSingleBankAccount(selected, data, 1);
                  }
                });
            }
          }
        )
    );
  }

  /**
   * @description Deletes multiple bank accounts. When the API responds with
   * errorCode 126 (deletion needs explicit confirmation), a confirm alert is
   * shown and, on confirmation, the same API is re-called with confirmed = 1.
   * @param data - The encrypted ids payload.
   * @param confirmed - Confirmation flag sent to the API (0 by default, 1 after the 126 confirm).
   */
  private deleteMultipleBankAccounts(data: { ids: string[] }, confirmed = 0) {
    this.subscriptions.push(
      this.bankAccountService.multiDeleteBankAccount(data, confirmed).subscribe({
        next: (res) => {
          if (res.success === true) {
            this.dataTableService.setRefreshStatus(true);
            this.selectedRowData.length = 0;
            this.v3DataTableService.refreshV3DataTable();
            const alertData = {
              content: 'Deleted',
              close: true,
              timeout: 1500
            };
            this.alertService.successAlert(alertData);
            this.headerService.refreshDynamicHeader.next(true);
          }
        },
        error: (err: HttpErrorResponse) => {
          if (err.error.errorCode === 125) {
            this.onDeleteBank(data, err.error.errorMsg);
          } else if (err.error.errorCode === 126) {
            const alert = this.alertService.confirmAlert({
              content: err.error.errorMsg,
              doneMsg: 'Continue',
              isCancel: true,
              cancelMsg: 'Cancel'
            });
            alert
              .afterClosed()
              .pipe(take(1))
              .subscribe((res) => {
                if (res) {
                  this.deleteMultipleBankAccounts(data, 1);
                }
              });
          }
        }
      })
    );
  }

  onDeleteBank(data: { ids: string[] }, errorMsg: string) {
    const deleted = this.alertService.confirmAlert({
      content: errorMsg,
      doneMsg: 'Ok',
      isCancel: true,
      cancelMsg: 'Cancel'
    });
    deleted.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.bankAccountService
            .deleteBankAccountInfo(data)
            .subscribe((result) => {
              if (result?.success) {
                this.selectedRowData.length = 0;
                this.v3DataTableService.refreshV3DataTable();
                this.dataTableService.setRefreshStatus(true);
                const alertData = {
                  content: 'Deleted',
                  close: true,
                  timeout: 1500
                };
                this.alertService.successAlert(alertData);
                this.headerService.refreshDynamicHeader.next(true);
              }
            })
        );
      }
    });
  }

  updateBankAccount() {
    const dialogRef = this.dialog.open(UpdatedImportedBanksModalComponent, {
      disableClose: true,
      width: '700px',
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.v3DataTableService.refreshV3DataTable();
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  ngOnDestroy() {
    this.v3DataTableService.rowData = [];
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.bankDataService.isFromService = null;
    this.personaHelperService.kycKybVerifivationResult.set(undefined);
  }
}
