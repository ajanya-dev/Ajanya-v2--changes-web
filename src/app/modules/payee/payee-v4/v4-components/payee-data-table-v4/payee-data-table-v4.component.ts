import {
  Component,
  DestroyRef,
  OnInit,
  OnDestroy,
  computed,
  inject
} from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ColDef,
  ICellRendererParams,
  RowNode,
  RowClickedEvent
} from '@ag-grid-community/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize, skip, take } from 'rxjs';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';
import { V3PayeeTypeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-payee-type/dt-payee-type.component';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { TooltipOnEllipsisComponent } from 'src/app/shared/v3/dt-cellrenderers/v35/tooltip-on-ellipsis/tooltip-on-ellipsis.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4PayeeMultiSelectFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-payee-multi-select-floating-filter/v4-payee-multi-select-floating-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { ICoulmnDefFields } from 'src/app/models/v3-datatable';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V4DataTableComponent } from 'src/app/modules/v4-data-table/components/v4-data-table/v4-data-table.component';
import { IV4DataTableEmptyState } from 'src/app/modules/v4-data-table/components/v4-data-table-empty-state/v4-data-table-empty-state.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { PayeeService } from 'src/app/shared/service/payee/payee.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { PayeeModalService } from 'src/app/shared/service/payee-modal/payee-modal.service';
import { DynamicWhiteLabelService } from 'src/app/modules/dynamic-white-label/service/dynamic-white-label.service';
import { IPayeeData } from 'src/app/modules/payee/payee-v2/model/payee';
import { environment } from 'src/environments/environment';
import { PaymentsV4Service } from 'src/app/modules/payments-v4/shared/services/payments-v4.service';
import { FormNecReportModalV4Component } from '../../modals/form-nec-report-modal-v4/form-nec-report-modal-v4.component';
import { PayeeMergeModalV4Component } from '../../modals/payee-merge-modal-v4/payee-merge-modal-v4.component';
import { PayeeListActionV4Component } from '../payee-list-action-v4/payee-list-action-v4.component';
import { PayeeActionButtonsV4Component } from '../payee-action-buttons-v4/payee-action-buttons-v4.component';
import { PayeeDataV35Service } from '../../../payee-v3/v35-services/payee-data-v35.service';
import { PayeeV4StateService } from '../payee-v4-state.service';

/**
 * v3's `ICoulmnDefFields` narrows `lockPosition` to `boolean`, but AG Grid — and
 * the v4 pinning contract — also take `'left' | 'right'`. The v3 model is frozen,
 * so widen it here and assert once where the defs meet the v3-typed grid input.
 */
type IV4ColumnDef = Omit<ICoulmnDefFields, 'lockPosition'> & {
  lockPosition?: ColDef['lockPosition'];
};

@Component({
  selector: 'app-payee-data-table-v4',
  templateUrl: './payee-data-table-v4.component.html',
  styleUrls: ['./payee-data-table-v4.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent]
})
export class PayeeDataTableV4Component implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  public v3DataTableService = inject(V3DataTableService);
  public payeeV4State = inject(PayeeV4StateService);
  private payeeService = inject(PayeeService);
  private alertService = inject(V4AlertService);
  private payeeModalService = inject(PayeeModalService);
  public payeeDataService = inject(PayeeDataV35Service);
  private dynamicWhiteLabelService = inject(DynamicWhiteLabelService);
  private paymentsV4Service = inject(PaymentsV4Service);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  private pageType$ = toObservable(this.payeeV4State.pageType);
  env = environment;
  isWhiteLabel = false;
  whiteLabelName = 'Payees';
  isMerging = false;
  selectedRows: RowNode<IPayeeData>[] = [];
  isRowSelected = false;
  isMutliRowSelected = false;

  tableId = DTTableId.payee;

  /** Column Definitions — matching v3 exactly */

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
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    pinned: 'left',
    cellClass: 'pl-[6px]',
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
    cellClass: '',
    cellRendererParams: { hideFilter: true }
  };

  colDefInternalId = {
    headerName: 'NS Internal ID',
    field: 'netsuite_internal_id',
    suppressFloatingFilterButton: true,
    // Fits the full header text plus its sort indicator.
    minWidth: 135,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: ICellRendererParams) =>
      params.data?.netsuite_payee?.qb_id
  };

  colDefNickName = {
    headerName: 'Nickname',
    field: 'payee_nick_name',
    suppressFloatingFilterButton: true,
    minWidth: 95,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'tooltipOnEllipsisComponent'
  };

  colDefActive = {
    headerName: 'Is Inactive?',
    field: 'netsuite_status',
    suppressFloatingFilterButton: true,
    // Fits the full header text plus its sort indicator.
    minWidth: 110,
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

  colDefDate = {
    headerName: 'Date',
    field: 'created_at',
    suppressFloatingFilterButton: true,
    minWidth: 130,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'dateFilterComponent',
    cellClass: '',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: { type: 'date' },
    floatingFilterComponentParams: {
      tableId: 8,
      v2Table: true
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
    cellClass: ''
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
    cellClass: ''
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
    cellClass: ''
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
    cellClass: ''
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
    cellClass: ''
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
    cellClass: ''
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
    cellClass: ''
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
    cellClass: ''
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
    cellClass: ''
  };

  // Icon column (kebab + eye) — a View column, not an Actions column. Stays
  // pinned left, second, right after the checkbox. The right-edge rule does not
  // apply to it.
  colDefView: ICoulmnDefFields = {
    headerName: 'View',
    field: 'action',
    sortable: false,
    minWidth: 76,
    maxWidth: 88,
    cellRenderer: 'payeeListAction',
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    suppressMovable: true,
    pinned: 'left',
    lockPosition: true,
    lockPinned: true
  };

  // Operation buttons (Send / Receive) — this grid has no status column, so the
  // Actions column owns the right edge. Fixed at the cell's exact content width
  // (two 88px buttons + a 6px gap) plus the theme's 8px cell padding on each
  // side, so the gutter left of Send matches the gutter right of Receive.
  colDefActions: IV4ColumnDef = {
    headerName: 'Actions',
    field: 'actions',
    sortable: false,
    width: 198,
    minWidth: 198,
    maxWidth: 198,
    cellRenderer: 'payeeActionButtons',
    floatingFilter: false,
    suppressHeaderMenuButton: true,
    suppressMovable: true,
    pinned: 'right',
    lockPosition: 'right',
    lockPinned: true
  };

  activeColumnDefs: ICoulmnDefFields[] = this.buildColumnDefs();

  /** Fields visible by default for customer/employee tables.
   *  Other fields are available via the view controller toggle. */
  defaultVisibleFields: string[] = [
    'boxId',
    'actions',
    'payee_name',
    'created_at',
    'payee_address_line_1',
    'payee_company_name',
    'payee_country',
    'payee_phone',
    'payee_email',
    'payee_type_id',
    'action'
  ];

  /** Floating action bar buttons */
  headerElements: IV3DtHeaderElements = { buttons: [] };

  frameworkComponents = {
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    dateFilterComponent: V4DateFloatingFilterComponent,
    payeeListAction: PayeeListActionV4Component,
    payeeActionButtons: PayeeActionButtonsV4Component,
    SearchBoxComponent: V4TextFloatingFilterComponent,
    v3PayeeNameComponent: V3PayeeNameComponent,
    tooltipOnEllipsisComponent: TooltipOnEllipsisComponent,
    v3PayeeListDropDownFilterComponent:
      V4PayeeMultiSelectFloatingFilterComponent,
    V3DTCommonFilterComponent,
    V3PayeeTypeComponent
  };

  floatingFilterComponent = {
    selectBox: [
      {
        id: 'payee_type_id',
        values: [
          { value: 2, name: 'Vendor' },
          { value: 3, name: 'Employee' },
          { value: 1, name: 'Customer' },
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

  ngOnInit() {
    this.isWhiteLabel =
      this.dynamicWhiteLabelService.dynamicWhiteLabelFlagChecker(
        'isWhiteLabel'
      );
    this.whiteLabelName = this.env.env_id === 'compass' ? 'Vendors' : 'Payees';

    // Set initial header elements and payload
    this.updateHeaderElements();
    this.setDefaultPayload();
    this.getRowSelectionData();
    this.dataTableService.setDataFromParent(
      undefined,
      this.floatingFilterComponent
    );
    this.openRoutedPayeeOnLoad();

    // React to page type changes (vendor/customer/employee switch via sidebar)
    this.pageType$
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.activeColumnDefs = this.buildColumnDefs();
        this.updateHeaderElements();
        this.applyFilterForPageType();
      });
  }

  /**
   * `manage/payee/:id` — when the routed filter leaves exactly one payee,
   * open its details drawer on the first load (not on later refreshes).
   */
  private openRoutedPayeeOnLoad() {
    if (!this.payeeV4State.routePayeeId()) {
      return;
    }
    this.v3DataTableService.emptyRowData
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((rowCount) => {
        const rows = this.v3DataTableService.rowData as IPayeeData[];
        if (rowCount === 1 && rows?.length === 1) {
          this.openPayeeView(rows[0]);
        }
      });
  }

  /** Build column defs based on current page type */
  private buildColumnDefs(): ICoulmnDefFields[] {
    const type = this.payeeV4State.pageType();
    const isCompass = this.env.env_id === 'compass';

    if (type === 'vendor' || type === 'payee') {
      return [
        this.colDefId,
        this.colDefView,
        this.colDefName,
        ...(isCompass ? [this.colDefInternalId] : []),
        this.colDefNickName,
        ...(isCompass ? [this.colDefActive] : []),
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
        // "Type" column only makes sense on the combined "All" tab; the
        // dedicated Vendor tab is single-type.
        ...(type === 'payee' ? [this.colDefType] : []),
        ...(!isCompass ? [this.colDefSSN] : []),
        this.colDefActions
      ] as ICoulmnDefFields[];
    }

    // Customer and Employee — same column set
    return [
      this.colDefId,
      this.colDefView,
      this.colDefName,
      ...(isCompass ? [this.colDefInternalId] : []),
      this.colDefNickName,
      ...(isCompass ? [this.colDefActive] : []),
      this.colDefDate,
      this.colDefAddress1,
      this.colDefAddress2,
      this.colDefEmail,
      this.colDefPhone,
      this.colDefCompany,
      this.colDefCity,
      this.colDefState,
      this.colDefZip,
      this.colDefCountry,
      // SSN/EIN is hidden on the Customers tab; kept for Employees.
      ...(!isCompass && type !== 'customer' ? [this.colDefSSN] : []),
      this.colDefActions
    ] as ICoulmnDefFields[];
  }

  /** Set default payload — matching v3 pattern */
  private setDefaultPayload() {
    this.v3DataTableService.resetV3DataTablePayload();
    const routePayeeId = this.payeeV4State.routePayeeId();
    this.v3DataTableService.defaultPayload = {
      ...this.v3DataTableService.defaultPayload,
      filterModel: this.getFilterModel(),
      sortModel: [{ colId: 'payee_name', sort: 'asc' }],
      // `manage/payee/:id` — same payload key the payee floating filter uses.
      ...(routePayeeId ? { payeeIds: [routePayeeId] } : {})
    };
  }

  /** Subscribe to row selection changes — matching v3 pattern */
  private getRowSelectionData() {
    this.v3DataTableService.v3RowSelectionData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (selectedRows) => {
          this.selectedRows = selectedRows;
          this.isRowSelected = selectedRows.length > 0;
          this.isMutliRowSelected = selectedRows.length > 1;
          this.updateHeaderElements();
        }
      });
  }

  /** Build floating action bar buttons based on current state */
  private updateHeaderElements() {
    const count = this.selectedRows.length;

    this.headerElements = {
      buttons: [
        {
          id: 'id_send_payment',
          text: 'Send Payment',
          lucideIcon: 'send',
          floatingBarVariant: 'filled-success',
          isHidden: count !== 1
        },
        {
          id: 'id_generate',
          text: 'Generate 1099',
          lucideIcon: 'file-text',
          floatingBarVariant: 'outline-primary'
        },
        {
          id: 'id_edit',
          text: 'Edit',
          lucideIcon: 'pencil',
          floatingBarVariant: 'outline-primary',
          isHidden: count !== 1
        },
        {
          id: 'id_merge',
          text: 'Merge',
          lucideIcon: 'git-merge',
          floatingBarVariant: 'outline-violet',
          isHidden: count < 2
        },
        {
          id: 'id_delete',
          text: 'Delete',
          lucideIcon: 'trash-2',
          floatingBarVariant: 'filled-danger'
        }
      ]
    };
  }

  /** Update a floating bar button's loading/disabled state by id */
  private setButtonState(
    btnId: string,
    state: { loading?: boolean; disabled?: boolean }
  ) {
    this.headerElements = {
      ...this.headerElements,
      buttons: this.headerElements.buttons?.map((btn) =>
        btn.id === btnId ? { ...btn, ...state } : btn
      )
    };
  }

  /** Handle floating action bar button clicks */
  onHeaderButtonEvent(event: {
    id: string | number;
    selectedRows: IPayeeData[];
    tableId: number;
  }) {
    switch (event.id) {
      case 'id_send_payment':
        this.onSendPayment();
        break;
      case 'id_generate':
        this.openNecFormModal();
        break;
      case 'id_edit':
        this.onEdit();
        break;
      case 'id_merge':
        this.onMerge();
        break;
      case 'id_delete':
        this.onDelete();
        break;
      default:
        break;
    }
  }

  /**
   * Empty state (design O17). The page renders four payee types off one grid,
   * so the copy and the CTA label both come from `PayeeV4StateService` rather
   * than being hard-coded — `lockTitleToPayees` collapses all of them to the
   * generic "payees" wording, exactly as the page header does.
   */
  emptyStateConfig = computed<IV4DataTableEmptyState>(() => {
    const type = this.payeeV4State.lockTitleToPayees()
      ? 'payee'
      : this.payeeV4State.pageType();
    const copy: Record<string, { title: string; description: string }> = {
      customer: {
        title: 'No customers yet',
        description:
          'Add your first customer to start invoicing and requesting payments'
      },
      employee: {
        title: 'No employees yet',
        description: 'Add your first employee to start paying them directly'
      },
      payee: {
        title: 'No payees yet',
        description: 'Add your first payee to start sending payments'
      },
      vendor: {
        title: 'No vendors yet',
        description:
          'Add your first vendor or contact to start sending them payments'
      }
    };
    return {
      icon: 'users',
      ...copy[type],
      buttonText: this.payeeV4State.addButtonLabel()
    };
  });

  /**
   * Empty-state CTA — the same add-payee modal the page header opens, with the
   * same payee-type options, so the two entry points cannot drift apart.
   */
  onEmptyStateAdd(): void {
    const payeeTypeOptions = this.payeeV4State.lockPayeeType()
      ? [this.payeeV4State.payeeTypeName()]
      : ['vendor', 'employee', 'customer'];
    this.payeeModalService
      .openAddPayee(
        undefined,
        {
          payeeType: this.payeeV4State.payeeTypeId(),
          payeeTypeOptions
        },
        true
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payeeModal) => {
        payeeModal
          ?.afterClosed()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((res) => {
            if (res?.success) this.v3DataTableService.refreshV3DataTable();
          });
      });
  }

  /**
   * Open the selected payee's details in the side drawer when its row is clicked.
   */
  onRowClick(event: RowClickedEvent<IPayeeData>) {
    const target = (event.event?.target as HTMLElement) ?? null;
    if (
      target?.closest('.ag-selection-checkbox') ||
      target?.closest('[role="checkbox"]')
    ) {
      return;
    }

    const payee = event.data;
    if (!payee) {
      return;
    }
    this.openPayeeView(payee);
  }

  /** Open the payee details side drawer — mirrors PayeeListActionV4 onViewClick */
  private openPayeeView(payee: IPayeeData) {
    this.payeeDataService.actionSignal.update(() => 'more');
    this.payeeDataService.payeeDataSignal.set({
      addressLine1: payee.payee_address_line_1,
      addressLine2: payee.payee_address_line_2,
      city: payee.payee_city,
      company: payee.payee_company_name,
      country: payee.payee_country,
      createdAt: payee.created_at,
      email: payee.payee_email,
      encryptedId: payee.encrypted_id,
      id: payee.id,
      name: payee.payee_name,
      nickName: payee.payee_nick_name,
      payeeTypeId: payee.payee_type_id,
      phone: payee.payee_phone,
      state: payee.payee_state,
      typeDetails: payee.type_details,
      zip: payee.payee_zip
    });
    this.payeeDataService.setPayeeView(true);
  }

  /** Open send payment modal with selected payee pre-filled */
  onSendPayment() {
    if (this.selectedRows.length !== 1) {
      this.alertService.warningAlert({
        content: 'Please select a single payee to send payment.'
      });
      return;
    }
    const payeeId = this.selectedRows[0].data?.encrypted_id;
    if (payeeId) {
      this.paymentsV4Service.openSendModal({ payeeId });
    }
  }

  /** Generate 1099/W-2 — matching v3 openNecFormModal */
  openNecFormModal() {
    if (this.selectedRows.length >= 1) {
      const payeeData: IPayeeData[] = [];
      this.selectedRows.forEach((rowData) => {
        if (rowData.data) {
          payeeData.push(rowData.data);
        }
      });
      const dialogRef = this.dialog.open(FormNecReportModalV4Component, {
        width: '480px',
        disableClose: true,
        panelClass: 'paddingless-modal-rounded',
        data: payeeData
      });
      dialogRef
        .afterClosed()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.selectedRows.length = 0;
          this.v3DataTableService.refreshV3DataTable();
        });
    } else {
      this.alertService.warningAlert({
        content: `Please select at least one ${this.whiteLabelName}.`
      });
    }
  }

  /** Edit single selected payee — matching v3 onEdit */
  onEdit() {
    const selectedItems = this.selectedRows;
    if (selectedItems.length === 0) {
      this.alertService.warningAlert({
        content: 'Please select a payee first'
      });
      return;
    }

    const id = selectedItems.map((item) => item.data?.encrypted_id);
    this.payeeModalService
      .openEditPayee(
        id[0] as string,
        'addPayeeModal',
        {
          edit: true,
          id: id[0] as string,
          type: 'string'
        },
        true
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payeeModal) => {
        if (payeeModal) {
          payeeModal
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                res.encryptedId = res.id;
                this.payeeDataService.editedPayeeSignal.set(res);
                this.selectedRows.length = 0;
                this.isRowSelected = false;
                this.v3DataTableService.refreshV3DataTable();
              }
            });
        }
      });
  }

  /** Add payee from the empty-state CTA — matching header's openAddPayee */
  openAddPayee() {
    const payeeTypeOptions = this.payeeV4State.lockPayeeType()
      ? [this.payeeV4State.payeeTypeName()]
      : ['vendor', 'employee', 'customer'];
    this.payeeModalService
      .openAddPayee(
        undefined,
        {
          payeeType: this.payeeV4State.payeeTypeId(),
          payeeTypeOptions
        },
        true
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payeeModal) => {
        if (payeeModal) {
          payeeModal
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((res) => {
              if (res?.success) {
                this.v3DataTableService.refreshV3DataTable();
              }
            });
        }
      });
  }

  /** Merge 2+ selected payees — matching v3 onMerge */
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
      this.setButtonState('id_merge', { loading: true });
      this.payeeService
        .mergePayeeRequest({ payeeIds })
        .pipe(
          finalize(() => {
            this.isMerging = false;
            this.setButtonState('id_merge', { loading: false });
          }),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((response) => {
          if (response.success) {
            const dialogRef = this.dialog.open(PayeeMergeModalV4Component, {
              width: '100%',
              maxWidth: '1300px',
              panelClass: 'paddingless-modal-rounded',
              data: payeeData
            });
            dialogRef
              .afterClosed()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((res) => {
                if (res) {
                  this.selectedRows.length = 0;
                  this.v3DataTableService.refreshV3DataTable();
                }
              });
          }
        });
    } else {
      this.alertService.warningAlert({
        content: `Please select at least two ${this.whiteLabelName}.`
      });
    }
  }

  /** Delete selected payees — matching v3 onDelete + onMultiDelAction */
  onDelete() {
    const selectedItems = this.selectedRows;
    if (selectedItems.length === 0) {
      this.alertService.warningAlert({
        content: 'Please select a payee first'
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
    alert
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if (res) {
          this.onMultiDelAction(ids);
        }
      });
  }

  private onMultiDelAction(
    ids: (string | undefined)[],
    confirmed: 1 | 0 = 0
  ) {
    this.setButtonState('id_delete', { loading: true });
    this.payeeService
      .deleteMultiPayee({ ids: ids as string[] }, confirmed)
      .pipe(
        finalize(() => this.setButtonState('id_delete', { loading: false })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (delRes) => {
          if (delRes?.success) {
            this.v3DataTableService.v3RowSelectionData = [];
            this.v3DataTableService.gridApi?.deselectAll();
            this.v3DataTableService.refreshV3DataTable();
            this.alertService.successAlert({ content: 'Payee deleted.' });
          }
        },
        error: (err) => {
          if (err.error?.errorCode === 126) {
            const dRef = this.alertService.confirmAlert({
              content: err.error.errorMsg,
              cancelMsg: 'Cancel',
              doneMsg: 'Delete'
            });
            dRef
              .afterClosed()
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe((res) => {
                if (res) {
                  this.onMultiDelAction(ids, 1);
                }
              });
          }
        }
      });
  }

  /** ACH Invite Email — Compass only, matching v3 */
  openAchInviteModal(): void {
    const selectedItems = this.selectedRows;
    if (selectedItems.length === 0) {
      this.alertService.warningAlert({
        content: 'Please select a payee first'
      });
      return;
    }
    this.isRowSelected = false;
    const ids = selectedItems.map(
      (item) => item.data?.encrypted_id
    ) as string[];
    const email = selectedItems[0].data?.payee_email;
    const status = selectedItems[0].data?.netsuite_payee?.status;
    this.payeeDataService.openAchInviteModal(ids, email, status);
  }

  private getFilterModel(): Record<string, unknown> {
    const type = this.payeeV4State.pageType();
    switch (type) {
      case 'customer':
        return {
          payee_type_id: {
            filterType: 'number',
            type: 'equals',
            filter: 1
          }
        };
      case 'employee':
        return {
          payee_type_id: {
            filterType: 'number',
            type: 'equals',
            filter: 3
          }
        };
      case 'payee':
        return {};
      default:
        return {
          payee_type_id: {
            filterType: 'set',
            values: ['2', '0', null]
          }
        };
    }
  }

  private applyFilterForPageType() {
    this.v3DataTableService.defaultPayload = {
      ...this.v3DataTableService.defaultPayload,
      startRow: 0,
      filterModel: this.getFilterModel()
    };
    this.v3DataTableService.refreshV3DataTable();
  }

  ngOnDestroy() {
    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.rowData = [];
    this.payeeDataService.clearSubscriptions();
  }
}
