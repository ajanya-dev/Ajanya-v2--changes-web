import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { Subject, takeUntil, finalize, Subscription } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { RowNode, ICellRendererParams } from '@ag-grid-community/core';
import { IPayeeData } from 'src/app/modules/payee/payee-v2/model/payee';
import { DtSelectAllCheckBoxComponent } from 'src/app/modules/data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { environment } from 'src/environments/environment';
import { TooltipOnEllipsisComponent } from 'src/app/shared/v3/dt-cellrenderers/v35/tooltip-on-ellipsis/tooltip-on-ellipsis.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { V3PayeeTypeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-payee-type/dt-payee-type.component';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { FormNecReportModalComponent } from 'src/app/modules/more/modals/form-nec-report-modal/form-nec-report-modal.component';
import { PayeeMergeModalComponent } from '../../../payee-v2/modals/payee-merge-modal/payee-merge-modal.component';
import { V3DataTableService } from '../../../../v3-data-table/services/v3-data-table.service';
import { PayeeDataV35Service } from '../../v35-services/payee-data-v35.service';
import { PayeeListActionV35Component } from '../payee-list-action-v35/payee-list-action-v35.component';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { WhiteLabelDirective } from '../../../../../directive/white-label.directive';
import { CommonButtonV35Component } from '../../../../../shared/v3/buttons/common-button-v35/common-button-v35.component';

@Component({
  selector: 'app-payee-table-ocw-v35',
  templateUrl: './payee-table-ocw-v35.component.html',
  styleUrls: ['./payee-table-ocw-v35.component.scss'],
  standalone: true,
  imports: [
    MatProgressBar,
    CommonButtonV35Component,
    NgClass,
    FaIconComponent,
    WhiteLabelDirective,
    MatTooltip,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    V3DataTableComponent
  ]
})
export class PayeeTableOcwV35Component implements OnInit, OnDestroy {
  /** dependancy injection using injecrt method */
  private router = inject(Router);
  public payeeDataService = inject(PayeeDataV35Service);
  private dataTableService = inject(V3DataTableService);
  private payeeService = inject(PayeeService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private v3DataTableService = inject(DataTableService);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private payeeModalService = inject(PayeeModalService);

  selectedRows: RowNode<IPayeeData>[] = [];
  /** variables */
  newButtonIcon: 'fa-solid fa-plus';
  tableId = DTTableId.payee;
  env = environment;
  importDropDown = false;
  isRowSelected = false;
  isMutliRowSelected = false;
  destroy$ = new Subject();
  frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    actionComponent: DtActionComponent,
    dateFilterComponent: DataRangeV35Component,
    payeeListAction: PayeeListActionV35Component,
    SearchBoxComponent: DtSearchBoxComponent,
    v3PayeeNameComponent: V3PayeeNameComponent,
    tooltipOnEllipsisComponent: TooltipOnEllipsisComponent,
    v3PayeeListDropDownFilterComponent: DtMultiDropdownPayeeComponent,
    V3DTCommonFilterComponent,
    V3PayeeTypeComponent
  };

  isWhiteLabel: boolean = false;
  isMerging: boolean = false;
  subscriptions: Subscription[] = [];
  whiteLabelName: string;

  /**
   * @description column definitions
   */

  colDefId: ICoulmnDefFields = {
    maxWidth: 45,
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
    headerClass: 'pl-[8px]'
  };

  colDefName = {
    headerName: 'Name',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    minWidth: 175,
    floatingFilterComponent: 'v3PayeeListDropDownFilterComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v3PayeeNameComponent',
    cellClass: 'flex flex-col justify-center',
    cellRendererParams: {
      hideFilter: true
    }
  };

  colDefNickName = {
    headerName: 'Nick Name',
    field: 'payee_nick_name',
    suppressFloatingFilterButton: true,
    minWidth: 95,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,

    cellRenderer: 'tooltipOnEllipsisComponent'
  };

  colDefInternalId= {
    headerName: 'NS Internal ID',
    field: 'netsuite_internal_id',
    suppressFloatingFilterButton: true,
    minWidth: 95,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer:(params: ICellRendererParams) => params.data?.netsuite_payee?.qb_id
  };

  colDefDate = {
    headerName: 'Date',
    field: 'created_at',
    suppressFloatingFilterButton: true,
    minWidth: 115,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'dateFilterComponent',
    cellClass: 'flex flex-col justify-center',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date' },
    floatingFilterComponentParams: {
      tableId: 8,
      v2Table: true
    }
  };

  colDefActive= {
    headerName: 'Is Inactive?',
    field: 'netsuite_status',
    suppressFloatingFilterButton: true,
    minWidth: 95,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) => {
      const status = params.data?.netsuite_payee?.status;
      if (status === 0) return 'Yes';
      if (status === null || status === undefined) return '';
      return 'No';
    }
  };

  colDefAddress1 = {
    headerName: 'Address 1',
    field: 'payee_address_line_1',
    suppressFloatingFilterButton: true,
    minWidth: 95,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,

    cellRenderer: 'tooltipOnEllipsisComponent'
  };

  colDefAddress2 = {
    headerName: 'Address 2',
    field: 'payee_address_line_2',
    suppressFloatingFilterButton: true,
    minWidth: 95,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,

    cellRenderer: 'tooltipOnEllipsisComponent'
  };

  colDefCompany = {
    headerName: 'Company',
    field: 'payee_company_name',
    suppressFloatingFilterButton: true,
    minWidth: 95,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefCity = {
    headerName: 'City',
    field: 'payee_city',
    suppressFloatingFilterButton: true,
    minWidth: 95,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefState = {
    headerName: 'State',
    field: 'payee_state',
    suppressFloatingFilterButton: true,
    minWidth: 95,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefZip = {
    headerName: 'Zip',
    field: 'payee_zip',
    suppressFloatingFilterButton: true,
    minWidth: 85,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefCountry = {
    headerName: 'Country',
    field: 'payee_country',
    suppressFloatingFilterButton: true,
    minWidth: 95,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefPhone = {
    headerName: 'Phone',
    field: 'payee_phone',
    suppressFloatingFilterButton: true,
    minWidth: 95,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex flex-col justify-center'
  };

  colDefEmail = {
    headerName: 'Email',
    field: 'payee_email',
    suppressFloatingFilterButton: true,
    minWidth: 95,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,

    cellRenderer: 'tooltipOnEllipsisComponent',
    cellClass: 'justify-center'
  };

  colDefType = {
    headerName: 'Type',
    field: 'payee_type_id',
    suppressFloatingFilterButton: true,
    minWidth: 95,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3PayeeTypeComponent',
    cellClass: 'flex flex-col justify-center'
  };

  colDefSSN: ICoulmnDefFields = {
    headerName: 'SSN/EIN',
    field: 'ssn_ein',
    suppressFloatingFilterButton: true,
    minWidth: 125,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: false,
    suppressHeaderMenuButton: false,
    sortable: false,
    cellClass: 'flex flex-col justify-center'
  };

  colDefAction = {
    headerName: 'Action',
    field: 'action',
    sortable: false,
    minWidth: 115,
    cellRenderer: 'payeeListAction',
    floatingFilter: false,
    suppressHeaderMenuButton: false
  };

  columnDefs = [
    this.colDefId,
    this.colDefName,
    ...(this.env.env_id === 'compass' ? [this.colDefInternalId] : []),
    this.colDefNickName,
    ...(this.env.env_id === 'compass' ? [this.colDefActive] : []),
    this.colDefDate,
    this.colDefAddress1,
    this.colDefAddress2,
    this.colDefCompany,
    this.colDefCity,
    this.colDefState,
    this.colDefZip,
    this.colDefCountry,
    this.colDefPhone,
    this.colDefEmail,
    this.colDefType,
    ...(this.env.env_id !== 'compass' ? [this.colDefSSN] : []),
    this.colDefAction
  ];

  floatingFilterComponent = {
    selectBox: [
      {
        id: 'payee_type_id',
        values: [
          { value: 1, name: 'Customer' },
          { value: 2, name: 'Vendor' },
          { value: 3, name: 'Employee' }
        ]
      },
      {
        id: 'netsuite_status',
        values: [
          { value: 0, name: 'Yes' },
          { value: 1, name: 'No' }
        ]
      }
    ],
    selectDate: [
      { id: 'created_at', initialRange: 'All Time', isPrimary: true }
    ]
  };

  ngOnInit(): void {
    this.setDefaultPayload();
    this.getRowSelectionData();
    this.v3DataTableService.setDataFromParent(
      undefined,
      this.floatingFilterComponent
    );
    this.isWhiteLabel =
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isWhiteLabel'
      );

    this.whiteLabelName =
      environment.env_id === 'compass' ? 'Vendors' : 'Payees';
  }

  /**
   * @description reset the the payload into default payload
   */
  setDefaultPayload() {
    this.dataTableService.defaultPayload = {
      ...this.dataTableService.defaultPayload,
      sortModel: [{ colId: 'payee_name', sort: 'asc' }]
    };
  }

  /**
   * @description Opens the add payee modal and refreshes the data table if successful.
   */
  openAddPayee() {
    this.subscriptions.push(
      this.payeeModalService.openAddPayee().subscribe((payeeModal) => {
        if (payeeModal) {
          this.subscriptions.push(
            payeeModal.afterClosed().subscribe((res) => {
              if (res?.success) {
                this.dataTableService.refreshV3DataTable();
              }
            })
          );
        }
      })
    );
  }

  /**
   * @description navigate into the import page
   */
  import() {
    this.router.navigateByUrl('/manage/payee/payee_data_import/step1');
  }

  /**
   * @description change the view into grid
   */
  viewToggle(val: boolean) {
    this.payeeDataService.setPayeeView(val);
  }

  /**
   * @description Method invoked when ''Merge' option is selected in template.
   * Opens dialog to merge payee.
   */
  onMerge() {
    if (this.isMerging) {
      return;
    }
    if (this.selectedRows.length >= 2) {
      const payeeIds: string[] = [];
      const payeeData: IPayeeData[] = [];
      this.selectedRows.forEach((rowData) => {
        if (rowData.data) {
          payeeIds.push(rowData.data.encrypted_id);
          payeeData.push(rowData.data);
        }
      });

      this.isMerging = true;
      this.subscriptions.push(
        this.payeeService
          .mergePayeeRequest({ payeeIds })
          .pipe(
            finalize(() => {
              this.isMerging = false;
            }),
            takeUntil(this.destroy$)
          )
          .subscribe((response) => {
            if (response.success) {
              const dialogRef = this.dialog.open(PayeeMergeModalComponent, {
                width: '100%',
                maxWidth: '1100px',
                data: payeeData
              });
              dialogRef.afterClosed().subscribe((res) => {
                if (res) {
                  this.selectedRows.length = 0;
                  this.dataTableService.refreshV3DataTable();
                }
              });
            }
          })
      );
    } else {
      this.alertService.warningAlert({
        content: `Please select at least two ${this.whiteLabelName}.`
      });
    }
  }

  openNecFormModal() {
    if (this.selectedRows.length >= 1) {
      const payeeIds: string[] = [];
      const payeeData: IPayeeData[] = [];
      this.selectedRows.forEach((rowData) => {
        if (rowData.data) {
          payeeIds.push(rowData.data.encrypted_id);
          payeeData.push(rowData.data);
        }
      });
      const dialogRef = this.dialog.open(FormNecReportModalComponent, {
        minWidth: '25%',
        maxHeight: '60%',
        disableClose: true,
        data: payeeData
      });
      dialogRef.afterClosed().subscribe(() => {
        this.selectedRows.length = 0;
        this.dataTableService.refreshV3DataTable();
      });
    } else {
      this.alertService.warningAlert({
        content: `Please select at least one ${this.whiteLabelName}.`
      });
    }
  }

  /**
   * @description Method to get row selection data from data table.
   */
  getRowSelectionData() {
    this.dataTableService.v3RowSelectionData$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (selectedRows) => {
          this.selectedRows = selectedRows;
          if (selectedRows.length) {
            this.isRowSelected = true;
          } else {
            this.isRowSelected = false;
          }
          if (selectedRows.length > 1) {
            this.isMutliRowSelected = true;
          } else {
            this.isMutliRowSelected = false;
          }
        }
      });
  }

  /**
   * @descripiton Mat menu close event will call this function
   */
  onMatMenuClosed() {
    this.importDropDown = false;
  }

  onDelete() {
    const selectedItems = this.selectedRows;
    if (selectedItems.length === 0) {
      this.alertService.warningAlert({
        content: `Please select a payee first`
      });
      return;
    }
    const ids = selectedItems.map((item) => item.data?.encrypted_id);
    const alertData = {
      content: `Are you sure you want to delete this ${
        selectedItems.length === 1 ? 'payee' : 'payees'
      }?`,
      cancelMsg: 'No, cancel!',
      doneMsg: 'Yes, Delete it!'
    };
    const alert = this.alertService.confirmAlert(alertData);
    alert.afterClosed().subscribe((res) => {
      if (res) this.onMultiDelAction(ids);
    });
  }

  onMultiDelAction(ids: (string | undefined)[],confirmed: 1 |0 = 0) {
    this.subscriptions.push(
      this.payeeService
        .deleteMultiPayee({ ids: ids as string[] },confirmed)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next:((res) => {
            if (res?.success) {
              this.selectedRows.length = 0;
              this.isRowSelected = false;
              this.dataTableService.refreshV3DataTable();
              this.alertService.successAlert({ content: 'Payee deleted.' });
            }
          }),
          error:((err) => {
            if (err.error?.errorCode === 126) {
              const alertData = {
                content: err.error.errorMsg,
                cancelMsg: 'Cancel',
                doneMsg: 'Delete'
              };
              const dRef = this.alertService.confirmAlert(alertData);
              dRef.afterClosed().subscribe((res) => {
                if (res) {
                  this.onMultiDelAction(ids,1);
                }
              });
            } 
          })
        })
    );
  }

  /**
   * @description Open payee edit modal.
   */
  onEdit() {
    const selectedItems = this.selectedRows;
    if (selectedItems.length === 0) {
      this.alertService.warningAlert({
        content: `Please select a payee first`
      });
      return;
    }

    const id = selectedItems.map((item) => item.data?.encrypted_id);
    this.subscriptions.push(
      this.payeeModalService
        .openEditPayee(id[0] as string, 'addPayeeModal', {
          edit: true,
          id: id[0] as string,
          type: 'string'
        })
        .subscribe((payeeModal) => {
          if (payeeModal) {
            this.subscriptions.push(
              payeeModal.afterClosed().subscribe((res) => {
                if (res?.success) {
                  res.encryptedId = res.id;
                  this.payeeDataService.editedPayeeSignal.set(res);
                  this.selectedRows.length = 0;
                  this.isRowSelected = false;
                  this.dataTableService.refreshV3DataTable();
                }
              })
            );
          }
        })
    );
  }

  /**
   * @description Open ACH invite emial modal.
   * This modal specially cretad for Compass enterprise customer.
   */
  openAchInviteModal(): void {
    const selectedItems = this.selectedRows;
    if (selectedItems.length === 0) {
      this.alertService.warningAlert({
        content: `Please select a payee first`
      });
      return;
    }
    this.isRowSelected = false;
    const ids = selectedItems.map(
      (item) => item.data?.encrypted_id
    ) as string[];
    const email = selectedItems[0].data?.payee_email;
    const status = selectedItems[0].data?.netsuite_payee?.status;
    this.payeeDataService.openAchInviteModal(ids, email,status);
  }

  /**
   * @description Import Payee from netsuite.
   * This method is specially created for Compass Enterprise customers.
   */
  importFromNetSuite(): void {
    this.payeeDataService.importFromNetSuite(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
    this.payeeDataService.clearSubscriptions();
  }
}
