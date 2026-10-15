import { RowSelectedEvent, ICellRendererParams } from '@ag-grid-community/core';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  CVSourceType,
  IActionLoaderData,
  ISelectBizData
} from 'src/app/modules/common-verification/model/common-verification';
import {
  IDtActionCompProp,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { IUserVerification } from 'src/app/models/user';
import { AddAttachmentModalV4Component } from 'src/app/shared/modal/attachment-modal/add-attachment-modal-v4/add-attachment-modal-v4.component';
import { V4AddCommentCommonModalComponent } from 'src/app/shared/modal/v4-add-comment-common-modal/v4-add-comment-common-modal.component';
import { ViewAuditTrailModalV4Component } from 'src/app/shared/modal/common-modal/v4-view-audit-trail-modal/v4-view-audit-trail-modal.component';
import { V4LoaderModalComponent } from 'src/app/shared/modal/v4-loader-modal/v4-loader-modal.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CheckDraftService } from 'src/app/shared/service/check-draft/check-draft.service';
import { CommonVerificationService } from 'src/app/shared/service/common/common-verification.service';
import { V4TextFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-text-floating-filter/v4-text-floating-filter.component';
import { V4DropdownFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-dropdown-floating-filter/v4-dropdown-floating-filter.component';
import { V4DateFloatingFilterComponent } from 'src/app/modules/v4-data-table/components/floating-filters/v4-date-floating-filter/v4-date-floating-filter.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IBusinessDetails } from 'src/app/models/bank';
import { ComponentType } from '@angular/cdk/portal';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import {
  ICoulmnDefFields,
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import { V4DTCommonFilterComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-common-filter/v4-common-filter.component';
import { V4CreatedAtComponent } from 'src/app/modules/payments-v4/payments-out/components/v4-payments-table/cell-renderers/v4-created-at/v4-created-at.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { PersonaHelperService } from 'src/app/shared/persona-v4/service/persona-helper.service';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { CustomDoubleSideModalService } from 'src/app/shared/modal/custom-double-side-modal/custom-double-side-modal.service';
import { V4StatusComponent } from 'src/app/shared/V4/v4-dt-cellrenders/v4-status/v4-status.component';
import { SelectBusinessV4Component } from 'src/app/modules/bank/bank-v4/v4-modals/select-business-v4/select-business-v4.component';
import { VerificationRequiredModalComponent } from 'src/app/shared/modal/verification-required-modal/verification-required-modal.component';
import { V4DtActionComponent } from 'src/app/modules/v4-data-table/components/v4-dt-action/v4-dt-action.component';
import { V4SelectAllCheckBoxComponent } from 'src/app/modules/v4-data-table/components/v4-select-all-check-box/v4-select-all-check-box.component';
import { V4ResendPermissionModalComponent } from '../../modal/v4-resend-permission-modal/v4-resend-permission-modal.component';
import { V4SetRecurringModalComponent } from '../../modal/v4-set-recurring-modal/v4-set-recurring-modal.component';
import { ICheckDraftTableRow } from '../../model/v4-Checkdraft';
import { V4DataTableComponent } from '../../../v4-data-table/components/v4-data-table/v4-data-table.component';
import { V4CheckDraftDetailPanelComponent } from '../../components/v4-check-draft-detail-panel/v4-check-draft-detail-panel.component';
import { V4DataTableEmptyStateComponent } from '../../../v4-data-table/components/v4-data-table-empty-state/v4-data-table-empty-state.component';
import { V4NewCheckdraftComponent } from '../../modal/v4-new-checkdraft/v4-new-checkdraft.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { NgOptimizedImage } from '@angular/common';


/**
 * @description Angular component responsible for managing and displaying a list of check drafts.
 */
@Component({
  selector: 'app-v4-check-draft-list',
  templateUrl: './v4-check-draft-list.component.html',
  styleUrls: ['./v4-check-draft-list.component.scss'],
  standalone: true,
  imports: [V4DataTableComponent, V4CheckDraftDetailPanelComponent, V4DataTableEmptyStateComponent, CommonButtonV4Component, NgOptimizedImage]
})
export class V4CheckDraftListComponent implements OnInit, OnDestroy {
  /* Injectors */
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private router = inject(Router);
  public dialog = inject(MatDialog);
  private checkDraftService = inject(CheckDraftService);
  private alertService = inject(V4AlertService);
  private userProfileService = inject(UserProfileService);
  private verificationService = inject(CommonVerificationService);
  private localStorageService = inject(LocalStorageService);
  private personaHelperService = inject(PersonaHelperService);
  private doubleSideModalService = inject(CustomDoubleSideModalService);
  private paymentsService = inject(PaymentsService);

  public tableId = DTTableId.checkDraft;
  selectedPanelButton = this.checkDraftService.selectedPanelButton;

  // Side panel state
  isPanelOpen = signal(false);
  panelSelectedRow = signal<ICheckDraftTableRow | null>(null);
  rowIndex = 0;
  subscriptions: Subscription[] = [];
  checkDraftAppStatus = signal(-1);
  applyLoading = signal(false);
  applying = signal(false);
  currentSelectedRows: ICheckDraftTableRow[] = [];

  emptyStateButtonText = computed(() => {
    if (this.applyLoading() || this.applying()) return 'Please wait...';
    return 'Apply for Check Draft';
  });

  reApplyButtonText = computed(() => {
    if (this.applyLoading() || this.applying()) return 'Please wait...';
    return 'Re-Apply';
  });

  readonly appliedEmptyStateConfig = {
    icon: 'banknote',
    title: 'No check drafts yet',
    description: 'Create your first check draft to start sending payments.',
    buttonText: 'New Check Draft',
  };

  kycLoading = false;
  kycKybStatus: { kycStatus: number; kybStatus: number };
  fieldsShownByDefault: string[] = [
    'id',
    'amount',
    'bill_grand_total',
    'payee_name',
    'action_field'
  ];

  deselectedColumns: string[] = this.defaultDeselectedColumns();

  defaultDeselectedColumns() {
    if (window.innerWidth < 768) {
      return [
        'view',
        'status',
        'source_name',
        'source.source',
        'updated_at',
        'reference_no',
        'created_by',
        'description'
      ];
    }
    if (window.innerWidth < 1100) {
      return ['source_name', 'source.source', 'created_by', 'description'];
    }
    return [];
  }

  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: '',
    ignoreColumns: ['boxId', 'action_field']
  };

  checkDesignTemplate = [
    { value: '1', name: 'Check On Top' },
    { value: '4', name: 'Three Per Page' }
  ];

  printLoading = signal(false);
  deleteLoading = signal(false);
  printDisabled = signal(false);
  directDepositLoading = signal(false);
  setRecurringLoading = signal(false);
  depositSlipDisabled = this.checkDraftService.depositSlipDisabled;
  check_design_templete = this.checkDraftService.checkDesignTemplate;
  check_design_template_name = this.checkDraftService.checkDesignTemplateName;
  loading = false;

  // HEADER ELEMENTS PROPERTIES
  public headerElements = computed<IV3DtHeaderElements>(() => ({
    panelButtons: [],
    buttons: [
      {
        text: 'Print',
        id: 'print',
        lucideIcon: 'printer',
        isAddIcon: true,
        icon: ['fas', 'print'],
        type: 'list',
        toolTip: 'Print selected check drafts',
        loading: this.printLoading(),
        disabled: this.printDisabled(),
        floatingBarVariant: 'filled-primary'
      },
      {
        text: 'Delete',
        id: 'multipleDelete',
        lucideIcon: 'trash-2',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        textColorInput: 'var(--v4-badge-error-text-color)',
        type: 'list',
        toolTip: 'Delete selected check drafts',
        loading: this.deleteLoading(),
        floatingBarVariant: 'filled-danger'
      },
      {
        text: 'Set Recurring Draft',
        isAddIcon: true,
        id: 'set-recuring',
        lucideIcon: 'repeat',
        icon: ['fas', 'file-lines'],
        type: 'list',
        toolTip: 'Select recurring options for a check draft.',
        loading: this.setRecurringLoading(),
        floatingBarVariant: 'filled-primary'
      },
      {
        text: 'Create Deposit Slip',
        id: 'deposit-slip',
        lucideIcon: 'file-text',
        isAddIcon: true,
        icon: ['fas', 'file-lines'],
        type: 'list',
        toolTip: 'Create deposit slip from selected check drafts',
        disabled: this.depositSlipDisabled(),
        floatingBarVariant: 'filled-primary'
      },
      {
        text: 'Direct Deposit',
        id: 'direct-deposit',
        lucideIcon: 'landmark',
        isAddIcon: true,
        icon: ['fas', 'bank'],
        type: 'list',
        toolTip: 'Direct deposit check draft',
        loading: this.directDepositLoading(),
        floatingBarVariant: 'filled-primary'
      }
    ],
    topRightButtons: [],
    videoButton: [
      {
        slug: 'checkdraft'
      }
    ]
  }));

  // FILTER CUSTOM COMPONENTS
  FloatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'check_drafts.status',
        values: [
          { value: '0', name: 'New' },
          { value: '1', name: 'Printed' },
          { value: '5', name: 'PA' },
          { value: '7', name: 'Approved' },
          { value: '8', name: 'Rejected' },
          { value: '10', name: 'DD Initiated' },
          { value: '11', name: 'DD Completed' },
          { value: '12', name: 'DD Rejected' },
          { value: '13', name: 'DD Returned' },
          { value: '15', name: 'Void' }
        ]
      }
    ],
    selectDate: [
      { id: 'check_drafts.check_issue_date', initialRange: 'All Time' },
      {
        id: 'check_drafts.created_at',
        initialRange: 'All Time',
        isPrimary: true
      }
    ]
  };

  // ACTION COMPONENT PROPERTIES
  actionComponentProp: IDtActionCompProp = {
    actionButton: true,
    eyeButton: true
  };

  // CELL RENDERER COMPONENT
  cellRenderer: { action: { name: string; id: string; icon: string; color?: string }[] } = {
    action: [
      {
        name: 'Print',
        id: 'print-row',
        icon: 'printer'
      },
      {
        name: 'Add Attachment',
        id: 'add-attachment',
        icon: 'paperclip'
      },
      {
        name: 'Add Comments',
        id: 'add-comments',
        icon: 'message-square'
      },
      {
        name: 'Audit Trail',
        id: 'audit-trail',
        icon: 'history'
      },
      {
        name: 'Delete',
        id: 'delete',
        icon: 'trash-2',
        color: 'var(--v4-common-red-color)'
      },
      {
        name: 'Clone',
        id: 'clone',
        icon: 'copy'
      }
    ]
  };

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    headerCheckBoxComponent: V4SelectAllCheckBoxComponent,
    selectBoxComponent: V4DropdownFloatingFilterComponent,
    v4DateRangeComponent: V4DateFloatingFilterComponent,
    v4CreatedAtComponent: V4CreatedAtComponent,
    actionComponent: V4DtActionComponent,
    searchBoxComponent: V4TextFloatingFilterComponent,
    attachmentComments: V4StatusComponent,
    v3PayeeListDropDownFilterComponent: V4TextFloatingFilterComponent,
    payeeListDropDownFilterComponent: V4TextFloatingFilterComponent,
    V4DTCommonFilterComponent
  };

  // *****************************************************Data Table Column Fields*****************************************************
  colDefId: ICoulmnDefFields = {
    width: 50,
    maxWidth: 50,
    minWidth: 50,
    headerName: '',
    sortable: false,
    field: 'boxId',
    suppressFloatingFilterButton: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    resizable: false,
    headerCheckboxSelection: true,
    checkboxSelection: true,
    showDisabledCheckboxes: true,
    headerClass: 'pl-3.5',
    cellClass: 'flex justify-center',
    pinned: 'left'
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'check_drafts.status',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    width: 150,
    maxWidth: 300,
    pinned: 'right' as const,
    lockPosition: 'right' as const,
    lockPinned: true,
    suppressMovable: true,
    cellClass: 'flex items-center',
    floatingFilterComponent: 'selectBoxComponent', // SelectBoxComponent
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'attachmentComments',
    cellRendererParams: {
      statusMode: 'check-draft',
      statusField: 'cheque_status'
    },
    valueGetter: (params: ICellRendererParams<{ cheque_status: number }>) => {
      // Only For when Export Table data
      const value = params?.data?.cheque_status;
      let status = '';
      if (value === 0) {
        status = 'New';
      } else if (value === 1) {
        status = 'Printed';
      } else if (value === 5) {
        status = 'PA';
      } else if (value === 7) {
        status = 'Approved';
      } else if (value === 8) {
        status = 'Rejected';
      } else if (value === 15) {
        status = 'Void';
      }
      return status;
    }
  };

  colDefPayToAccount = {
    headerName: 'Pay To Account',
    field: 'bank_accounts.bank_account_nick_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 160,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,

    cellClass: 'flex items-center',
    cellRenderer: 'V4DTCommonFilterComponent',
    cellRendererForExport: (params: ICellRendererParams) =>
      // Only For when Export Table data
      params?.data?.bank_account_nick_name
  };

  colDefClientName: ICoulmnDefFields = {
    headerName: 'Client Name',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'v3PayeeListDropDownFilterComponent',
    minWidth: 160,
    maxWidth: 220,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent'
  };

  colDefCheckNumber = {
    headerName: 'Check #',
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 100,
    maxWidth: 130,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent',
    cellClass: 'flex items-center'
  };

  colDefDate = {
    headerName: 'Date',
    field: 'check_drafts.check_issue_date',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 80,
    maxWidth: 120,
    floatingFilterComponent: 'v4DateRangeComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V4DTCommonFilterComponent',
    cellRendererParams: {
      type: 'date'
    },
    cellRendererForExport: (params: ICellRendererParams) =>
      // Only For when Export Table data
      params?.data?.check_issue_date
  };

  colDefBy = {
    headerName: 'By',
    field: 'users.nick_name',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 120,
    maxWidth: 180,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,

    cellClass: 'flex items-center',
    cellRenderer: 'V4DTCommonFilterComponent',
    cellRendererParams: { type: 'date', filterField: 'created_by_name' },
    cellRendererForExport: (params: ICellRendererParams) =>
      // Only For when Export Table data
      params?.data?.nick_name
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'memo',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 160,
    floatingFilterComponent: 'searchBoxComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,

    cellRenderer: 'V4DTCommonFilterComponent'
  };

  colDefCreatedTime = {
    headerName: 'Created Time',
    field: 'check_drafts.created_at',
    suppressFloatingFilterButton: true,
    filter: 'agDateColumnFilter',
    minWidth: 100,
    flex: 1,
    floatingFilterComponent: 'v4DateRangeComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'v4CreatedAtComponent'
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    floatingFilterComponent: 'searchBoxComponent',
    minWidth: 150,
    maxWidth: 200,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end',
    cellRenderer: 'V4DTCommonFilterComponent',
    cellRendererParams: {
      isAmountField: true
    }
  };

  actionField = {
    headerName: 'Action',
    field: 'action_field',
    suppressFloatingFilterButton: true,
    minWidth: 60,
    maxWidth: 80,
    sortable: false,
    pinned: 'left' as const,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    lockPinned: true,
    suppressMovable: true,
    resizable: false,
    cellClass: 'flex items-center'
  };

  /* Set Column Definitions */
  columnDefs = [
    this.colDefId,
    this.actionField,
    this.colDefAmount,
    this.colDefClientName,
    this.colDefPayToAccount,
    this.colDefCheckNumber,
    this.colDefDate,
    this.colDefBy,
    this.colDefCreatedTime,
    this.colDefMemo,
    this.colDefStatus
  ];

  // PASS  FIELD DATA
  defaultColumnFields = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'id_action',
      name: 'Action',
      isDisabled: true,
      colDef: this.actionField,
      isChecked: true
    },
    {
      id: 'id_amount',
      name: 'Amount',
      isDisabled: true,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'id_ClientName',
      name: 'Client Name',
      isDisabled: true,
      colDef: this.colDefClientName,
      isChecked: true
    },
    {
      id: 'id_PayToAccount',
      name: 'Pay To Account',
      isDisabled: false,
      colDef: this.colDefPayToAccount,
      isChecked: true
    },
    {
      id: 'id_Check',
      name: 'Check #',
      isDisabled: false,
      colDef: this.colDefCheckNumber,
      isChecked: true
    },
    {
      id: 'id_Date',
      name: 'Date',
      isDisabled: false,
      colDef: this.colDefDate,
      isChecked: true
    },
    {
      id: 'id_By',
      name: 'By',
      isDisabled: false,
      colDef: this.colDefBy,
      isChecked: true
    },
    {
      id: 'id_CreatedTime',
      name: 'Created Time',
      isDisabled: false,
      colDef: this.colDefCreatedTime,
      isChecked: true
    },
    {
      id: 'id_status',
      name: 'Status',
      isDisabled: false,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'id_memo',
      name: 'Memo',
      isDisabled: true,
      colDef: this.colDefMemo,
      isChecked: true
    }
  ];

  ngOnInit(): void {
    // PASS DATAS TO DATA TABLE SERVICE
    this.dataTableService.setDataFromParent(
      this.defaultColumnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.v3DataTableService.resetV3DataTablePayload();
    this.checkCheckDraftStatus();
    this.getLastSelectedCheckDesignTemplate();
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
    this.openBusinessModalAfterPersonaVerification();
    this.subscriptions.push(
      this.v3DataTableService.v3RowSelectionData$.subscribe((rows) => {
        this.currentSelectedRows = rows.map((row) => row.data);
      })
    );
    this.subscriptions.push(
      this.checkDraftService.triggerHeaderButton$.subscribe((id) => {
        this.headerButtonClick({ id, selectedRows: this.currentSelectedRows });
      })
    );
  }

  /**
   * @description Getting last selected check design template if there is any.
   */
  getLastSelectedCheckDesignTemplate() {
    let selectedCheckPaperTypeCheckDraft = this.localStorageService.getItem(
      'selectedCheckPaperTypeCheckDraft'
    );
    if (selectedCheckPaperTypeCheckDraft) {
      this.check_design_templete.set(selectedCheckPaperTypeCheckDraft);
      this.check_design_template_name.set(
        selectedCheckPaperTypeCheckDraft === '1'
          ? 'Check On Top'
          : 'Three Per Page'
      );
    } else {
      this.subscriptions.push(
        this.checkDraftService.getCheckDraftPrintType().subscribe((res) => {
          if (res?.success) {
            selectedCheckPaperTypeCheckDraft = res?.data?.printType;
            if (selectedCheckPaperTypeCheckDraft) {
              this.check_design_templete.set(
                String(selectedCheckPaperTypeCheckDraft)
              );
              this.check_design_template_name.set(
                selectedCheckPaperTypeCheckDraft === 1
                  ? 'Check On Top'
                  : 'Three Per Page'
              );
              this.localStorageService.setItem(
                'selectedCheckPaperTypeCheckDraft',
                this.check_design_templete()
              );
            }
          }
        })
      );
    }
  }

  /**
   * @description Handles row selection in the data table.
   * @param event - Row selected event containing selected rows.
   */
  onRowSelected(event: RowSelectedEvent) {
    const gridApi = event.api; // all the data table params function get here
    const selectedRows = gridApi.getSelectedRows();

    const checkselect = this.checkdraftStatus(selectedRows);
    const printAllowed = this.checkdraftPrintStatus(selectedRows);

    if (!checkselect && !printAllowed) {
      this.printDisabled.set(true);
      this.depositSlipDisabled.set(true);
    } else if (printAllowed && !checkselect) {
      this.printDisabled.set(false);
      this.depositSlipDisabled.set(true);
    } else if (!printAllowed && checkselect) {
      this.printDisabled.set(true);
      this.depositSlipDisabled.set(false);
    } else {
      this.printDisabled.set(false);
      this.depositSlipDisabled.set(false);
    }
  }

  /**
   * @description Retrieves and checks the application status related to check drafts.
   */
  checkdraftStatus(selectedRows: ICheckDraftTableRow[]): boolean {
    let checkselect = true;

    const chequeStatuses = [0, 1, 7];
    let bank: string;
    selectedRows?.forEach((ele) => {
      if (bank === undefined) {
        bank = ele.bank_account_id;
      }

      if (
        !chequeStatuses.includes(ele.cheque_status) ||
        bank !== ele.bank_account_id
      ) {
        checkselect = false;
      }
    });
    return checkselect;
  }

  /**
   * @description Retrieves and checks the application status related to check drafts.
   */
  checkdraftPrintStatus(selectedRows: ICheckDraftTableRow[]): boolean {
    let checkselect = true;
    const notAllowedStatus = [5, 15, 9, 10, 11, 12, 8];
    const foundElement = selectedRows.find((element) =>
      notAllowedStatus.includes(element.status)
    );
    if (foundElement) {
      checkselect = false;
    }
    return checkselect;
  }

  /**
   * @description To be executed when selecting a specific check design template.
   * @param value - name of the check design template;
   */
  onCheckDesignTemplate(value: string) {
    const template = this.checkDesignTemplate.find(
      (item) => item.value === value
    );
    this.check_design_templete.set(value);
    this.check_design_template_name.set(template?.name ?? 'Check On Top');
    this.localStorageService.setItem('selectedCheckPaperTypeCheckDraft', value);
    this.subscriptions.push(
      this.checkDraftService
        .postCheckDraftPrintType({ type: template?.value === '1' ? 1 : 4 })
        .subscribe()
    );
  }

  /**
   * @description Handles the action of clicking the mobile header right button to show/hide overlay.
   */
  mobileHeaderRightBtn(): void {
    const actionBtn = document.getElementById('mobile-header-right-btn');
    actionBtn?.classList.toggle('mobile-head-rightshow');

    const ocwOverlay = this.querySelector(
      '.ocw-overlay-righthead'
    ) as HTMLElement;
    if (ocwOverlay) ocwOverlay.style.display = 'block';
  }

  /**
   * @description Finds and returns an HTML element using the query selector.
   * @param el - The query selector string.
   * @returns The selected HTML element.
   */
  querySelector(el: string) {
    return document.querySelector(el);
  }

  /**
   * @description Handles the action of deleting a specific row from the data table.
   * @param selectedItem - The selected check draft row to be deleted.
   */
  onDeleteRow(selectedItem: ICheckDraftTableRow) {
    const itemId = selectedItem.action;
    const alert = this.confirmAlertSure(
      'Are you sure you want to delete the selected check draft(s)?'
    );
    alert.afterClosed().subscribe((result) => {
      if (result) this.deleteRow(itemId);
    });
  }

  /**
   * @description Displays a confirmation alert with a specified content message.
   * @param content - The content message of the alert.
   * @returns An observable that resolves when the alert is closed.
   */
  confirmAlertSure(content: string) {
    const alertData = {
      title: 'Alert!',
      content,
      cancelMsg: 'No',
      doneMsg: 'Yes!'
    };
    return this.alertService.confirmAlert(alertData);
  }

  /**
   * @description Handles row click event and updates the selected row index.
   * @param event - The row clicked event.
   */
  rowClicked(event: number) {
    this.rowIndex = event;
  }

  /**
   * @description Deletes a specific check draft row.
   * @param itemId - The ID of the check draft row to be deleted.
   */
  deleteRow(itemId: string) {
    this.subscriptions.push(
      this.checkDraftService.deleteCheckDraft(itemId).subscribe((res) => {
        if (res.success) {
          this.v3DataTableService.refreshV3DataTable();
          this.v3DataTableService.v3RowSelectionData = [];
          this.v3DataTableService.gridApi?.deselectAll();
          this.successAlert('Deleted');
        }
      })
    );
  }

  /**
   * @description Displays a success alert with a specified success message.
   * @param msg - The success message of the alert.
   */
  successAlert(msg: string) {
    const data = {
      title: 'Success',
      content: msg,
      close: true
    };
    this.alertService.successAlert(data);
  }

  /**
   * @description To be executed when clicking on new button.
   */
  onNew() {
    const ref = this.doubleSideModalService.open(V4NewCheckdraftComponent, {
      width: '800px',
      maxHeight: '90vh',
      disableClose: true
    });

    ref.afterClosed().subscribe((result) => {
      const res = result as { type?: string } | undefined;
      if (res?.type === 'recurring') {
        this.checkDraftService.showRecurringList.set(true);
        this.checkDraftService.triggerHeaderButton$.next('refresh');
      } else if (res?.type === 'save') {
        this.checkDraftService.showRecurringList.set(false);
        this.checkDraftService.triggerHeaderButton$.next('refresh');
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/v4/manage/home']);
  }

  applyForCheckDraft(): void {
    if (this.applyLoading() || this.applying()) return;
    this.applying.set(true);
    this.isEmailAndPhoneVerfied();
  }

  onEmptyStateActionClick(): void {
    if (this.checkDraftAppStatus() === 1) {
      this.applyForCheckDraft();
    } else {
      this.onNew();
    }
  }

  /**
   * @description To be executed when clicking on upload from excel.
   */
  onUploadFromExcel() {
    this.router.navigate(['/manage/checkdraft/import/step1']);
  }

  /**
   * @description To be executed when clicking on Recieved checks.
   */
  onReceivedCheckClicked() {
    this.router.navigate(['/manage/checkdraft/request']);
  }

  /**
   * @description opens a modal to add attachment for a specifc check draft.
   * @param id - id of the check draft.
   */
  openAttachmentModal(id: string) {
    const dialogRef = this.dialog.open(AddAttachmentModalV4Component, {
      maxWidth: '700px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id,
        type: 'cheque-drafts'
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.refresh) {
        this.v3DataTableService.refreshV3DataTable();
        this.v3DataTableService.v3RowSelectionData = [];
        this.v3DataTableService.gridApi?.deselectAll();
      }
    });
  }

  /**
   * @description Handles the click event of the header buttons on the table.
   * @param event - The header button click event.
   */
  headerButtonClick(event: {
    id: string;
    selectedRows: ICheckDraftTableRow[];
    tableId?: string;
  }) {
    const { selectedRows } = event;
    switch (event.id) {
      case 'refresh':
        this.v3DataTableService.refreshV3DataTable();
        this.v3DataTableService.gridApi?.deselectAll();
        break;
      case 'new-checkdraft':
        this.onNew();
        break;
      case 'print':
        this.printBulk(selectedRows);
        break;
      case 'multipleDelete':
        this.deltBulk(selectedRows);
        break;
      case 'received-check':
        this.onReceivedCheckClicked();
        break;
      case 'set-recuring':
        this.onSetRecurringClicked(selectedRows);
        break;
      case 'direct-deposit':
        this.directDeposit(selectedRows);
        break;
      case 'deposit-slip':
        this.createDepositslip(selectedRows);
        break;
      case 'import-checkdraft':
        this.importCheckDraft();
        break;
      case '1':
        this.onCheckDesignTemplate('1');
        break;
      case '4':
        this.onCheckDesignTemplate('4');
        break;

      case 'all':
        this.v3DataTableService.updateV3DataTableByRemovingFilter = [
          'check_drafts.status'
        ];
        break;
      case 'new':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('0');
        break;
      case 'pending':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('5');
        break;
      case 'approved':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('7');
        break;
      default:
      // case "approved": // REMOVING THE CASE AS IT IS NEVER EXECUTED.
      //   this.dataTableService.setMainFilter('8');
      //   break;
    }
  }

  /**
   * @description Creates payload object for filtering and returns it.
   * @param filterValue - string representing value to be filtered.
   * @returns filter payload object.
   */
  setFilterPayload(filterValue: string) {
    const selectBoxFilterValues: ISelectBoxFilterValues | undefined = {
      filter: filterValue,
      filterType: 'text',
      type: 'equals'
    };
    const filterName = 'check_drafts.status';
    const filterPayloadForGrid: ISelectBoxFilterArray = {
      [filterName]: {
        ...selectBoxFilterValues
      }
    };
    return filterPayloadForGrid;
  }

  /**
   * @description Gets triggered when the "View" action button is clicked in a cell renderer.
   * @param env - The environment object containing the selected row.
   */
  getViewAction(env: { selectedRow: ICheckDraftTableRow }) {
    if (env?.selectedRow) {
      this.onViewButtonClicked(env.selectedRow);
    }
  }

  /**
   * @description Handles the action of clicking the "Delete" button for a bulk selection of rows.
   * @param rows - Array of selected check draft rows.
   */
  deltBulk(rows: ICheckDraftTableRow[]) {
    const Ids: string[] = [];

    if (rows.length === 0) {
      this.warningAlertsOOps('Please select at least one row');
    } else {
      rows.forEach((element) => {
        Ids.push(element.action);
      });
      const alert = this.confirmAlertSure(
        'Are you sure you want to delete the selected check draft(s)?'
      );
      alert.afterClosed().subscribe((data) => {
        if (data) {
          this.bulkDeleteApiCall(Ids);
        }
      });
    }
  }

  /**
   * @description Handles the action of clicking the "Create Deposit Slip" button for a bulk selection of rows.
   * @param rows - Array of selected check draft rows.
   */
  createDepositslip(rows: ICheckDraftTableRow[]) {
    const Ids: string[] = [];
    const itemIds: { ids: string[] } = { ids: [] };

    rows.forEach((el) => {
      itemIds.ids.push(el.action);
    });

    if (rows.length === 0) {
      this.warningAlertsOOps('Please select at least one row');
    } else {
      rows.forEach((element) => {
        Ids.push(element.action);
      });
      this.openDeposit(Ids);
    }
  }

  /**
   * @description Initiates the process of creating a deposit slip for selected check draft rows.
   * @param Ids - Array of IDs of selected check drafts.
   */
  openDeposit(Ids: string[]): void {
    let checkIds = '';
    Ids.forEach((e, i) => {
      checkIds += i === 0 ? e : `,${e}`;
    });

    this.router.navigate(['/v4/manage/depositslips/create'], {
      queryParams: { Ids: checkIds, referenceType: 1 }
    });
  }

  /**
   * @description Initiates the process of direct deposit for selected check draft rows.
   * @param rows - Array of selected check draft rows.
   */
  directDeposit(rows: ICheckDraftTableRow[]) {
    if (this.paymentsService.checkForComplianceFreeze()) {
      this.paymentsService.openComplianceFreezeModal();
      return;
    }
    const Ids: string[] = [];

    if (rows.length === 0) {
      this.warningAlertsOOps('Please select at least one row');
    } else {
      rows.forEach((element) => {
        Ids.push(element.action);
      });
      const alert = this.confirmAlertSure(
        'Are you sure you want to deposit it directly?'
      );
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.directDepositAction(Ids);
        }
      });
    }
  }

  /**
   * @description Initiates the direct deposit action for selected check draft IDs.
   * @param ids - Array of IDs of selected check drafts.
   */
  directDepositAction(ids: string[]) {
    const data = {
      ids
    };
    this.directDepositLoading.set(true);
    this.subscriptions.push(
      this.checkDraftService
        .directDeposit(data)
        .pipe(
          finalize(() => {
            this.directDepositLoading.set(false);
          })
        )
        .subscribe({
          next: (res) => {
            if (res.success) {
              this.successAlert('Check draft deposited directly');
              this.v3DataTableService.refreshV3DataTable();
              this.v3DataTableService.v3RowSelectionData = [];
              this.v3DataTableService.gridApi?.deselectAll();
            }
          },
          error: (err) => {
            this.DdDirectdeposit(err);
          }
        })
    );
  }

  //* ********* Redirect to ACH Application **********//
  DdDirectdeposit(err: HttpErrorResponse) {
    const { errorMsg } = err.error;
    if (err.error.errorCode === 101) {
      const alert = this.alertService.warningAlert({
        content: errorMsg,
        doneMsg: 'Add Info Now',
        isCancel: true,
        cancelMsg: 'cancel'
      });
      alert.afterClosed().subscribe((res) => {
        if (res) {
          this.achVerificationRequiredAlert();
        }
      });
    }
  }

  achVerificationRequiredAlert(): void {
    const alert = this.alertService.warningAlert({
      content:
        'Some of your bank accounts are not approved for ACH, please apply to proceed.',
      doneMsg: 'See My Banks',
      cancelMsg: 'Cancel',
      isCancel: true
    });
    alert.afterClosed().subscribe((res) => {
      if (res) {
        this.router.navigate(['/v4/manage/bank-accounts/index']);
      }
    });
  }

  /**
   * @description Handles the action of clicking the "Print" button for a bulk selection of rows.
   * @param rows - Array of selected check draft rows.
   */
  printBulk(rows: ICheckDraftTableRow[]) {
    const Ids: string[] = [];

    if (rows.length === 0) {
      this.warningAlertsOOps('Please select at least one row');
      return;
    }

    const rejectedChecks: number[] = [];
    const pendingApprovedChecks: number[] = [];

    const notAllowedStatus = [5, 15, 9, 10, 11, 12];

    rows.forEach((element) => {
      if (notAllowedStatus.includes(element.status)) {
        pendingApprovedChecks.push(element.cheque_serial_number);
      }
      if (element.status === 8) {
        rejectedChecks.push(element.cheque_serial_number);
      }
    });

    if (pendingApprovedChecks.length) {
      let checkNumbers = '';
      pendingApprovedChecks.forEach((element) => {
        checkNumbers += `${element},`;
      });

      checkNumbers = checkNumbers.substring(0, checkNumbers.length - 1);
      this.warningAlertsOOps(`Some checks are not printable. ${checkNumbers}`);
      return;
    }

    if (rejectedChecks.length) {
      let checkNumbers = '';
      rejectedChecks.forEach((element) => {
        checkNumbers += `${element},`;
      });
      checkNumbers = checkNumbers.substring(0, checkNumbers.length - 1);
      this.warningAlertsOOps(
        `Rejected checks are not printable. ${checkNumbers}`
      );
      return;
    }

    rows.forEach((element) => {
      Ids.push(element.action);
    });

    this.bulkPrintApiCall(Ids);
  }

  /**
   * @description Method for API call for bulk check print.
   */
  bulkPrintApiCall(ids: string[]) {
    const data = {
      ids,
      check_design_templete: this.check_design_templete()
    };

    this.printLoading.set(true);

    this.subscriptions.push(
      this.checkDraftService
        .CheckDraftMultiPrint(data)
        .pipe(
          finalize(() => {
            this.printLoading.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.v3DataTableService.refreshV3DataTable();
            this.v3DataTableService.v3RowSelectionData = [];
            this.v3DataTableService.gridApi?.deselectAll();
            const urlLoaded = window.open(res.data.url);
            if (
              !urlLoaded ||
              urlLoaded.closed ||
              typeof urlLoaded.closed === 'undefined'
            ) {
              const popupBlockerMsg = this.alertService.warningAlert({
                content:
                  'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window',
                doneMsg: 'Try Again'
              });
              popupBlockerMsg.afterClosed().subscribe((popupBlockerRes) => {
                if (popupBlockerRes) {
                  window.open(res.data.url);
                }
              });
            }
          }
        })
    );
  }

  /**
   * @description Method for API call for bulk check delete.
   */
  bulkDeleteApiCall(ids: string[]) {
    const data = {
      ids
    };
    this.deleteLoading.set(true);
    this.subscriptions.push(
      this.checkDraftService
        .bulkdeleteCheckDraft(data)
        .pipe(
          finalize(() => {
            this.deleteLoading.set(false);
          })
        )
        .subscribe((res) => {
          if (res) {
            this.successAlert('Deleted');
            this.v3DataTableService.refreshV3DataTable();
            this.v3DataTableService.v3RowSelectionData = [];
            this.v3DataTableService.gridApi?.deselectAll();
          }
        })
    );
  }

  /**
   * @description Opens Warning Alert modal.
   * @param content - message to show on the modal.
   * @returns
   */
  warningAlertsOOps(content: string) {
    const data = {
      title: 'Error',
      content,
      doneMsg: 'OK'
    };

    return this.alertService.warningAlert(data);
  }

  /**
   * @description Handles the action of clicking the "View" button for a specific check draft row.
   * @param selectedItem - Selected check draft row.
   */
  onViewButtonClicked(selectedItem: ICheckDraftTableRow) {
    this.panelSelectedRow.set(selectedItem);
    this.isPanelOpen.set(true);
  }

  closePanelAndReset(): void {
    this.isPanelOpen.set(false);
  }

  onPanelAction(key: string): void {
    const row = this.panelSelectedRow();
    if (!row) return;
    switch (key) {
      case 'print':
        this.printRow(row);
        this.closePanelAndReset();
        break;
      case 'clone':
        this.onClone(row);
        this.closePanelAndReset();
        break;
      case 'delete':
        this.onDeleteRow(row);
        this.closePanelAndReset();
        break;
      default:
        break;
    }
  }

  /**
   * @description Shows recurring list in the details section.
   */
  onRecurringListCliked() {
    this.checkDraftService.showRecurringList.set(true);
  }

  /**
   * @description Handles the action of setting recurring for a specific check draft row.
   * @param value - The selected value for setting recurring.
   */
  onSetRecurringClicked(rows: ICheckDraftTableRow[]) {
    if (rows.length === 0) {
      this.warningAlertsOOps('Please select at least one row.');
      return;
    }
    if (rows.length > 1) {
      this.warningAlertsOOps('Multiple selection is not allowed');
      return;
    }

    if (!['0', '1', '7', 0, 1, 7].includes(rows[0].cheque_status)) {
      this.warningAlertsOOps(
        `somechecks are not eligble for recurring. check number: ${rows[0].cheque_serial_number}`
      );
      return;
    }

    const data = {
      id: rows[0].action
    };

    this.setRecurringLoading.set(true);

    this.subscriptions.push(
      this.checkDraftService
        .validationRecurringData(data)
        .pipe(
          finalize(() => {
            this.setRecurringLoading.set(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const dialogRef = this.dialog.open(V4SetRecurringModalComponent, {
              width: '500px',
              maxWidth: '95vw',
              panelClass: 'paddingless-modal-rounded',
              disableClose: true,
              data: {
                from: 'table',
                data: rows[0].action
              }
            });
            dialogRef.afterClosed().subscribe((response) => {
              if (response) {
                this.successAlert(
                  'Check draft has set for recurring. You can manage them in recurring list.'
                );
                this.checkDraftService.showRecurringList.set(true);
                this.checkDraftService.triggerHeaderButton$.next('refresh');
              }
            });
          }
        })
    );
  }

  /**
   * @description Opens the add comments modal for a specific check draft.
   * @param id - The ID of the check draft.
   */
  openCommentsModal(id: string) {
    const dialogRef = this.dialog.open(V4AddCommentCommonModalComponent, {
      maxWidth: '700px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        id,
        type: 'cheque-drafts',
        enableDelete: true
      }
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res.refresh) {
        this.v3DataTableService.refreshV3DataTable();
        this.v3DataTableService.v3RowSelectionData = [];
        this.v3DataTableService.gridApi?.deselectAll();
      }
    });
  }

  /**
   * @description Handles the action of resending permission for a specific check draft.
   * @param selectedItem - The selected check draft row.
   */
  onResendpermission(selectedItem: ICheckDraftTableRow) {
    const dialogRef = this.dialog.open(V4ResendPermissionModalComponent, {
      maxWidth: '1000px',
      width: '25%',
      autoFocus: false,
      data: selectedItem
    });
    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.v3DataTableService.refreshV3DataTable();
        this.v3DataTableService.v3RowSelectionData = [];
        this.v3DataTableService.gridApi?.deselectAll();
      }
    });
  }

  /**
   * @description Opens the audit trail modal to view the history of a specific check draft.
   * @param selectedItem - The selected check draft row.
   */
  openAuditTrailModal(selectedItem: ICheckDraftTableRow) {
    this.dialog.open(ViewAuditTrailModalV4Component, {
      maxWidth: '1000px',
      width: '100%',
      panelClass: 'paddingless-modal-rounded',
      data: {
        heading: 'Check Draft',
        slug: 'cheque-drafts',
        id: selectedItem.action
      }
    });
  }

  /**
   * @description Handles the action of cloning a specific check draft.
   * @param selected - The selected check draft row.
   */
  onClone(selected: ICheckDraftTableRow) {
    const ref = this.doubleSideModalService.open(V4NewCheckdraftComponent, {
      width: '800px',
      maxHeight: '90vh',
      disableClose: true,
      data: { cloneId: selected.action }
    });

    ref.afterClosed().subscribe((result) => {
      const res = result as { type?: string } | undefined;
      if (res?.type === 'save' || res?.type === 'recurring') {
        this.v3DataTableService.refreshV3DataTable();
        this.v3DataTableService.gridApi?.deselectAll();
      }
    });
  }

  /**
   * @description Handles the click event of an action button in a cell renderer and performs the corresponding action.
   * FINDS WHICH CELL ACTION BUTTON IS CLICKED   8
   * @param event - The cell renderer action click event.
   */
  cellRendererActionClick(event: {
    selectedRow: ICheckDraftTableRow;
    tableId: string | number;
    id: string;
  }) {
    if (event.selectedRow) {
      let hideArr;
      const selectedItem = event.selectedRow;

      if (
        selectedItem?.cheque_status === 0 ||
        selectedItem?.cheque_status === 1 ||
        selectedItem?.cheque_status === 7
      ) {
        hideArr = ['', '', '', '', '', '', ''];
      } else {
        hideArr = ['print-row', '', '', '', '', '', ''];
      }

      if (selectedItem.cheque_status === 8) {
        hideArr[5] = 'clone';
      }

      this.disabledActions(hideArr);

      if (
        selectedItem?.cheque_status === 5 ||
        selectedItem?.cheque_status === 10
      ) {
        this.cellRenderer.action[5].name = 'Resend Permission';
        this.cellRenderer.action[5].id = 'resend-permission';
        this.cellRenderer.action[5].icon = 'repeat';
      } else {
        this.cellRenderer.action[5].name = 'Clone';
        this.cellRenderer.action[5].id = 'clone';
        this.cellRenderer.action[5].icon = 'copy';
      }

      this.dataTableService.setCellRendererAction(this.cellRenderer.action);

      switch (event.id) {
        case 'print-row':
          this.printRow(selectedItem);
          break;
        case 'delete':
          this.onDeleteRow(selectedItem);
          break;
        case 'add-attachment':
          this.openAttachmentModal(selectedItem.action);
          break;
        case 'add-comments':
          this.openCommentsModal(selectedItem.action);
          break;
        case 'audit-trail':
          this.openAuditTrailModal(selectedItem);
          break;
        case 'clone':
          this.onClone(selectedItem);
          break;
        case 'resend-permission':
          this.onResendpermission(selectedItem);
          break;
        default:
      }

      this.setActionButtonDisable(selectedItem);
    }
  }

  /**
   * @description Sets the action buttons to be disabled based on the selected check draft's status.
   * @param selectedItem - The selected check draft row.
   */
  setActionButtonDisable(selectedItem: ICheckDraftTableRow) {
    if (
      selectedItem?.cheque_status === 4 ||
      selectedItem?.cheque_status === 1
    ) {
      this.dataTableService.setActionButtonDisable(true, ['', 'print-row']);
    }
  }

  /**
   * @description Prints a specific check draft.
   * @param selectedRow - The selected check draft row to be printed.
   */
  printRow(selectedRow: ICheckDraftTableRow) {
    this.subscriptions.push(
      this.checkDraftService.getPrint(selectedRow?.action).subscribe((res) => {
        if (res.success) {
          window.open(res.data.url);
          this.v3DataTableService.refreshV3DataTable();
          this.v3DataTableService.v3RowSelectionData = [];
          this.v3DataTableService.gridApi?.deselectAll();
        }
      })
    );
  }

  /**
   * method for exporting table
   */
  onExportData(filterModel: {
    items: string[];
    fromDate: string | Date;
    toDate: string | Date;
    type: 'csv' | 'pdf';
  }) {
    this.subscriptions.push(
      this.checkDraftService
        .exportTable(filterModel)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((val) => {
          if (val.message) {
            const data = {
              title: 'Success!',
              content: val.message,
              close: false
            };
            this.alertService.successAlert(data);
          } else {
            window.open(val.data.url);
          }
        })
    );
  }

  /**
   * @description Disables specific action buttons based on the check draft's status and other conditions.
   * @param ids - An array of action button IDs to be disabled.
   */
  disabledActions(ids: string[]) {
    this.dataTableService.setActionButtonDisable(true, ids);
  }

  /**
   * @description Checks the status of the check draft application and updates the component's status.
   */
  checkCheckDraftStatus() {
    this.subscriptions.push(
      this.checkDraftService.checkDraftStatus().subscribe((res) => {
        if (res.success) {
          this.checkDraftAppStatus.set(res.data);
          this.checkDraftService.checkDraftAppStatus.set(res.data);
        }
      })
    );
  }

  /**
   * @description Checks if the user's email and phone have been verified, and prompts verification if not.
   */
  isEmailAndPhoneVerfied(): void {
    this.applyLoading.set(true);
    this.subscriptions.push(
      this.userProfileService.checkEmailAndPhoneVerified().subscribe((res) => {
        if (res?.success && 'data' in res) {
          const data = res.data as IUserVerification;
          if (data.email_verified === 0 || data.phone_verified === 0) {
            this.verifyPhoneEmail(data);
          } else {
            this.getUserKysKybStatus();
          }
        }
        this.applyLoading.set(false);
      })
    );
  }

  /**
   * @description Opens a dialog to ask for the verification of email and phone.
   * @param res - The user verification details.
   */
  verifyPhoneEmail(_res: IUserVerification): void {
    const dialogRef = this.dialog.open(VerificationRequiredModalComponent, {
      width: '450px',
      maxWidth: '95%',
      panelClass: 'paddingless-modal-rounded',
      data: { description: 'You need to verify your email and phone number to apply for Check Draft.' }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.applying.set(false);
    });
  }

  /**
   * @description Retrieves the KYC (Know Your Customer) and KYB (Know Your Business) status for the user.
   */
  getUserKysKybStatus() {
    this.kycLoading = true;
    this.subscriptions.push(
      this.verificationService.applicationStatus().subscribe((res) => {
        if (res?.success) {
          this.kycKybStatus = res.data;
          this.getBusinesses();
        }
      })
    );
  }

  /**
   * @description Retrieves a list of businesses associated with the user.
   */
  getBusinesses() {
    this.subscriptions.push(
      this.verificationService
        .getUserBusinesses()
        .pipe(
          finalize(() => {
            this.kycLoading = false;
          })
        )
        .subscribe((res) => {
          if (res?.success) {
            this.selectBusiness(res.data);
          }
        })
    );
  }

  /**
   * @description Opens a dialog to select a business for applying check drafts and initiates verification if needed.
   * @param businessDetails - List of business details.
   */
  selectBusiness(businessDetails: IBusinessDetails[]) {
    this.loading = false;
    const ref = this.dialog.open<SelectBusinessV4Component, ISelectBizData>(
      SelectBusinessV4Component,
      {
        width: '450px',
        maxWidth: '95%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: {
          applyCheckDraft: true,
          applicationStatus: this.kycKybStatus,
          isShowBankDropDown: true,
          sourceType: CVSourceType.check_draft,
          bankData: { businessDetails }
        }
      }
    );

    ref.afterClosed().subscribe((res) => {
      if (res?.businessId && res?.bankAccountId) {
        this.openLoaderModal(res.businessId, res.bankAccountId);
      } else {
        this.applying.set(false);
      }
    });
  }

  openBusinessModalAfterPersonaVerification(): void {
    this.personaHelperService.kycKybVerifivationResult$.subscribe((res) => {
      if (res?.data?.inquiry_type === 'kyb') {
        this.loading = true;
        this.getBusinesses();
      }
    });
  }

  /**
   * @description Opens a loader modal to handle business and bank account verification.
   * @param businessId - ID of the selected business.
   * @param bankAccountId - ID of the selected bank account.
   */
  openLoaderModal(businessId: string, bankAccountId: string) {
    const ref = this.dialog.open<V4LoaderModalComponent, IActionLoaderData>(
      V4LoaderModalComponent,
      {
        maxWidth: '450px',
        width: '90%',
        panelClass: 'paddingless-modal-rounded',
        disableClose: true,
        data: { type: { checkDraft: { businessId, bankAccountId } } }
      }
    );
    ref.afterClosed().subscribe(() => {
      this.applying.set(false);
      this.checkCheckDraftStatus();
    });
  }

  /**
   * @description Navigates to the import check draft process.
   */
  importCheckDraft(): void {
    this.router.navigate(['/manage/checkdraft/import/step1']);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.personaHelperService.kycKybVerifivationResult.set(undefined);
  }
}
