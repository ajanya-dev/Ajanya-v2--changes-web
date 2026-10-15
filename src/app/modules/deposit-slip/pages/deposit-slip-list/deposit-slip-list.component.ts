import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { ColDef, ICellRendererParams, RowSelectedEvent } from '@ag-grid-community/core';
import { Subscription, finalize } from 'rxjs';
import {
  IDtActionCompProp,
  IDtFloatingFilterProp,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { DepositSlipsService } from 'src/app/shared/service/deposit-slips/deposit-slips.service';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { IApiRes } from 'src/app/models/api';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtDropDownBankComponent } from '../../../data-table/components/dt-drop-down-bank/dt-drop-down-bank.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { ComponentType } from '@angular/cdk/portal';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import {
  ISelectBoxFilterArray,
  ISelectBoxFilterValues
} from 'src/app/models/v3-datatable';
import { MatDialog } from '@angular/material/dialog';
import { AddAttachmentModalComponent } from 'src/app/shared/modal/attachment-modal/add-attachment-modal/add-attachment-modal.component';
import { AddCommentsModalComponent } from 'src/app/shared/modal/comments-modal/add-comments-modal/add-comments-modal.component';
import { DepositSlipAddAttachmentCommentComponent } from './dsAttachmentsComments';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { V3PayeeNameComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-payee-name/v3-payee-name.component';

@Component({
  selector: 'app-deposit-slip-list',
  templateUrl: './deposit-slip-list.component.html',
  styleUrls: ['./deposit-slip-list.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class DepositSlipListComponent implements OnDestroy, OnInit {
  private v3DataTableService = inject(V3DataTableService);
  private dataTableService = inject(DataTableService);
  private alertService = inject(AlertService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private depositService = inject(DepositSlipsService);
  public matDialog = inject(MatDialog);

  // DATA TABLE VARAIBLES

  public tableId = DTTableId.depositSlip; // Data Table Id

  subscriptions: Subscription[] = [];
  isPrinted: boolean;
  fieldsShownByDefault: string[] = ['id', 'total_amount', 'action','payee_name'];
  selectedPanelButton = signal('id_all');

  printLoading = signal(false);
  verifyDisable = signal(false);
  verifyLoading = signal(false);
  deleteLoading = signal(false);
  voidLoading = signal(false);
  voidDisable = signal(false);
  cloneDisable = signal(false);

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

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    panelButtons: [
      {
        name: 'All',
        id: 'id_all'
      },
      {
        name: 'Verified',
        id: 'id_verified'
      },
      {
        name: 'Unverified',
        id: 'id_non_verified'
      },
      {
        name: 'Voided',
        id: 'id_voided'
      }
    ],
    buttons: [
      {
        text: 'New',
        id: 'id_new',
        isAddIcon: true,
        icon: ['fas', 'plus'],
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: 'Create new deposite slip'
      },
      {
        text: 'Print',
        id: 'multiplePrint',
        isAddIcon: true,
        icon: ['far', 'print'],
        type: 'list',
        toolTip: 'Print selected deposit slip',
        loading: this.printLoading(),
        disabled: this.voidDisable() && !this.verifyDisable()
      },
      {
        text: 'Verify',
        id: 'id_verify',
        icon: ['far', 'check'],
        isAddIcon: true,
        backGroundInput: 'var(--common-green-color)',
        type: 'list',
        toolTip: ' Verify selected deposit slip',
        disabled: this.verifyDisable() || this.voidDisable(),
        loading: this.verifyLoading()
      },
      {
        text: 'Clone',
        id: 'id_cloneMultiple',
        isAddIcon: true,
        icon: ['far', 'copy'],
        type: 'list',
        toolTip: 'Clone selected deposit slip',
        disabled: this.cloneDisable()
      },
      {
        text: 'Void',
        id: 'id_void',
        isAddIcon: true,
        icon: ['far', 'ban'],
        type: 'list',
        backGroundInput: 'var(--common-yellow-color)',
        loading: this.voidLoading(),
        disabled: this.voidDisable()
      },
      {
        text: 'Delete',
        id: 'multipleDelete',
        isAddIcon: true,
        icon: ['fas', 'trash'],
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        toolTip: ' Delete selected deposit slip',
        loading: this.deleteLoading()
      }
    ],
    topRightButtons: [
      {
        text: 'Stub',
        id: 'stub',
        isAddIcon: true,
        icon: ['fas', 'pen-to-square'],
        textColorInput: 'var(--common-green-color)',
        type: 'borderless',
        boxshadow: 'none'
      }
    ]
  }));

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    SelectBoxComponent: V3DataTableSelectBoxComponent,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    dateRangeV35Component: DataRangeV35Component,
    bankAccountComponent: DtDropDownBankComponent,
    attachmentCommentStatus: DepositSlipAddAttachmentCommentComponent,
    V3DTCommonFilterComponent,
    V3payeeListDropDownFilterComponent: DtMultiDropdownPayeeComponent,
    V3PayeeNameComponent,
  };

  //FILTER CUSTOM COMPONENTS
  floatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'depositslips.status',
        values: [
          { value: 1, name: 'Verified' },
          { value: 0, name: 'Not Verified' },
          { value: 2, name: 'Voided' }
        ]
      }
    ],
    selectDate: [
      { id: 'deposit_date', initialRange: 'All Time' },
      {
        id: 'depositslips.created_at',
        initialRange: 'All Time',
        isPrimary: true
      },
      { id: 'verification_date', initialRange: 'All Time' }
    ]
  };

  //CELL RENDERER COMPONENT (side action)
  cellRenderer: { action: { name: string; id: string; icon: string;color?:string; toolTip?:string }[] } = {
    action: [
      {
        name: 'Print',
        id: 'id_printRow',
        icon: 'far fa-print',
        toolTip:'Print deposit slip'
      },
      {
        name: 'Verify',
        id: 'id_verify',
        icon: 'far fa-check',
        color:'var(--common-green-color)',
        toolTip:'Verify once you confirm in your bank account'
      },
      {
        name: 'Void',
        id: 'id_void',
        icon: 'far fa-ban',
        color:'var(--common-yellow-color)',
        toolTip:'Void deposit slip'
      },
      {
        name: 'Edit',
        id: 'id_edit',
        icon: 'far fa-edit',
        color:'var(--common-blue-color)',
        toolTip:'Edit deposit slip details'
      },
      {
        name: 'Clone',
        id: 'id_clone',
        icon: 'far fa-copy',
        color:'var(--common-violet-color)',
        toolTip:'Generate a duplicate of the deposit slip'
      },
      {
        name: 'Add Comments',
        id: 'id_comment',
        icon: 'fa fa-comments',
        color:'var(--common-blue-color)',
        toolTip:'For internal purposes, will not print on deposit slips.'
      },
      {
        name: 'Add Attachment',
        id: 'id_attachment',
        icon: 'fa fa-paperclip',
        color:'var(--common-dark-blue-color)',
        toolTip:'Add attachments to the deposit slip'
      },
      {
        name: 'Delete',
        id: 'id_Delete',
        icon: 'fa fa-trash',
        color:'var(--common-red-color)'
      }
    ]
  };

  // *****************************************************Data Table Column Fields*****************************************************
  colDefId = {
    maxWidth: 50,
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
    pinned: 'left'
  };

  colDefAccountName:ColDef = {
    headerName: 'Deposit To',
    field: 'bank_account_nick_name',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'bankAccountComponent',
    floatingFilterComponentParams:{page:'depositSlip'},
    filter: 'agTextColumnFilter',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams:{
      suffixOptionalField: 'bank_account_account_name',
      type:'bank'
    }
  };

  colDefBank = {
    headerName: 'Bank',
    field: 'banks.bank_name',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
    cellClass: 'flex flex-col justify-center',
    cellRendererForExport: (params: ICellRendererParams) => 
      // Only For when Export Table data
       params?.data?.bank_name
  };

  colDefAmount = {
    headerName: 'Amount',
    field: 'total_amount',
    suppressFloatingFilterButton: true,
    minWidth: 100,
    maxWidth: 150,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams:{
      isAmountField: true
    },
  };

  colDefDepoFrom = {
    headerName: 'Deposit From',
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    minWidth: 175,
    floatingFilterComponent: 'V3payeeListDropDownFilterComponent',
    filter: 'agTextColumnFilter',
    filterParams: { newRowsAction: 'keep' },
    cellRenderer: 'V3PayeeNameComponent',
  };

  colDefMemo = {
    headerName: 'Memo',
    field: 'comments',
    suppressFloatingFilterButton: true,
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 400,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    cellRenderer: 'V3DTCommonFilterComponent',
  };

  colDefDepositBy = {
    headerName: 'Deposit by',
    field: 'name',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams:{
      prefixOptionalField: 'nick_name'
    }
  };

  colDefVerifiedBy = {
    headerName: 'Verified By',
    field: 'depositslips.verified_by',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererForExport: (params: ICellRendererParams) => 
      // Only For when Export Table data
       params?.data?.verified_by
  };

  colDefDate = {
    headerName: 'Date',
    field: 'depositslips.created_at',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',

    filterParams: { newRowsAction: 'keep' },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams:{
      type: 'date'
    },
    cellRendererForExport: (params: ICellRendererParams) => 
      // Only For when Export Table data
       params?.data?.created_at
  };

  colDefVeriDate = {
    headerName: 'Verified Date',
    field: 'verification_date',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'dateRangeV35Component',
    filter: 'agDateColumnFilter',
    filterParams: { newRowsAction: 'keep' }
  };

  colDefStatus = {
    headerName: 'Status',
    field: 'depositslips.status',
    suppressFloatingFilterButton: true,
    minWidth: 120,
    width: 100,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SelectBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,

    cellRenderer: 'attachmentCommentStatus',
    cellRendererForExport: (params: ICellRendererParams) => {
      // Use for export
      if (params?.data?.status === 0) {
        return 'Not Verified';
      } if (params?.data?.status === 1) {
        return `Verified`;
      } if (params?.data?.status === 2) {
        return 'Voided';
      } 
        return '';
      
    },
    cellClass: 'pl-3'
  };

  colDefRefId = {
    headerName: 'Ref Id',
    field: 'ref_id',
    suppressFloatingFilterButton: true,
    minWidth: 80,
    width: 100,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    cellRenderer: 'V3DTCommonFilterComponent',
  };

  actionField = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 60,
    maxWidth: 120,
    cellRenderer: 'actionComponent',
    sortable: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };
  // *****************************************************Data Table Column Fields*****************************************************

  //SET COLUMN FEILDS
  columnDefs = [
    this.colDefId,
    this.colDefDate,
    this.colDefAccountName,
    this.colDefBank,
    this.colDefAmount,
    this.colDefDepoFrom,
    this.colDefMemo,
    this.colDefDepositBy,
    this.colDefVerifiedBy,
    this.colDefVeriDate,
    this.colDefStatus,
    this.colDefRefId,
    this.actionField
  ];

  //PASS  FIELD DATA
  columnFields = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'date',
      name: 'Date',
      isDisabled: false,
      colDef: this.colDefDate,
      isChecked: true
    },
    {
      id: 'account',
      name: 'Deposit To',
      isDisabled: false,
      colDef: this.colDefAccountName,
      isChecked: true
    },
    {
      id: 'bank',
      name: 'Bank Name',
      isDisabled: false,
      colDef: this.colDefBank,
      isChecked: true
    },
    {
      id: 'amount',
      name: 'Amount',
      isDisabled: true,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'depo_date',
      name: 'Deposit From',
      isDisabled: true,
      colDef: this.colDefDepoFrom,
      isChecked: true
    },
    {
      id: 'memo',
      name: 'Memo',
      isDisabled: false,
      colDef: this.colDefMemo,
      isChecked: true
    },
    {
      id: 'deposit_created_by',
      name: 'Deposit By',
      isDisabled: false,
      colDef: this.colDefDepositBy,
      isChecked: true
    },
    {
      id: 'verfied_by',
      name: 'Verified By',
      isDisabled: false,
      colDef: this.colDefVerifiedBy,
      isChecked: true
    },
    {
      id: 'verfied_date',
      name: 'Verified Date',
      isDisabled: false,
      colDef: this.colDefVeriDate,
      isChecked: true
    },
    {
      id: 'status',
      name: 'Status',
      isDisabled: false,
      colDef: this.colDefStatus,
      isChecked: true
    },
    {
      id: 'ref_id',
      name: 'Ref Id',
      isDisabled: false,
      colDef: this.colDefRefId,
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

  // ACTION COMPONENT PROPERTIES
  actionComponentProp: IDtActionCompProp = {
    actionButton: true,
    eyeButton: true
  };

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    // PASS DATAS TO DATA TABLE SERVICE
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.floatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );

    this.refreshDataTable();
  }

  refreshDataTable(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  cellRendererActionClick(event: ISelectedSingleRow): void {
    if (!event) {
      return;
    }

    const row = event.selectedRow;

    if (row?.status === 1 ) {
      this.dataTableService.setActionButtonDisable(true, [
        '',
        'id_verify',
        'id_void',
        'id_edit',
        ''
      ]);
    } else if (row?.status === 0) {
      this.dataTableService.setActionButtonDisable(true, ['', '', '', '']);
    } else if (row?.status === 2) {
      this.dataTableService.setActionButtonDisable(true, [
        'id_printRow',
        'id_verify',
        'id_void',
        'id_edit',
        ''
      ]);
    }

    switch (event.id) {
      case 'id_edit':
        this.editDepositSlip(row?.action);
        break;
      case 'id_Delete':
        this.deleteRow(row?.action);
        break;
      case 'id_printRow':
        this.printBulk([row?.action]);
        break;
      case 'id_clone':
        this.cloneDS(row?.action);
        break;
      case 'id_comment':
        this.addComment(row?.action);
        break;
      case 'id_attachment':
        this.addAttachment(row?.action);
        break;
      case 'id_verify':
        this.verifySlip(row?.action);
        break;
      case 'id_void':
        this.multiVoid([row?.action]);
        break;
        default:
          break;
    }
  }

  // eye button
  cellRendererViewEvent(event: ISelectedSingleRow): void {
    event?.selectedRow &&
      this.router.navigate([`../view/${event?.selectedRow.action}`], {
        relativeTo: this.activatedRoute
      });
  }

  headerButtonClick(event: ISelectedSingleRow): void {
    if (!event.id) {
      return;
    }

    const ids: string[] = event?.selectedRows?.map<string>((e: Data) => {
      return e.action as string;
    }) as string[];

    switch (event.id) {
      case 'id_new':
        this.createDepositSlip();
        break;
      case 'multiplePrint':
        if (!ids?.length) {
          this.alertService.warningAlert({
            title: 'Error',
            content: 'Please select at least one deposit slip to print.'
          });
        } else {
          this.printBulk(ids);
        }
        break;
      case 'id_cloneMultiple': {
        const selected = event?.selectedRows as Data[] | undefined;
        if (!selected?.length) {
          this.alertService.warningAlert({
            title: 'Error',
            content: 'Please select a deposit slip to clone.'
          });
        } else if (selected.length > 1) {
          this.alertService.warningAlert({
            title: 'Error',
            content: 'Please select only one deposit slip to clone.'
          });
        } else {
          this.cloneDS(selected[0].action as string);
        }
        break;
      }
      case 'id_verify':
        if (!ids?.length) {
          this.alertService.warningAlert({
            title: 'Error',
            content: 'Please select at least one deposit slip to verify.'
          });
        } else if (
          this.includesVerified(
            event.selectedRows as (RowSelectedEvent | { status: number })[]
          )
        ) {
          this.alertService.warningAlert({
            title: 'Error',
            content: 'Some slips are already verified'
          });
        } else {
          this.multiVerify(ids);
        }
        break;
      case 'multipleDelete':
        if (!ids?.length) {
          this.alertService.warningAlert({
            title: 'Error',
            content: 'Please select at least one deposit slip to delete.'
          });
        } else {
          this.multiDelete(ids);
        }
        break;

      // filters

      case 'id_all':
        this.v3DataTableService.updateV3DataTableByRemovingFilter = [
          'depositslips.status'
        ];
        break;
      case 'id_verified':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('1');
        break;
      case 'id_non_verified':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('0');
        break;
      case 'id_voided':
        this.v3DataTableService.updateV3DataTable = this.setFilterPayload('2');
        break;
      case 'stub':
        this.goToSettings();
        break;
      case 'id_void':
        if (!ids?.length) {
          this.alertService.warningAlert({
            title: 'Error',
            content: 'Please select at least one deposit slip to void.'
          });
        } else {
          this.multiVoid(ids);
        }
        break;
      default:
        break;
    }
  }

  setFilterPayload(filterValue: string): ISelectBoxFilterArray {
    const selectBoxFilterValues: ISelectBoxFilterValues | undefined = {
      filter: filterValue,
      filterType: 'text',
      type: 'equals'
    };
    const filterName = 'depositslips.status';
    const filterPayloadForGrid: ISelectBoxFilterArray = {
      [filterName]: {
        ...selectBoxFilterValues
      }
    };
    return filterPayloadForGrid;
  }

  onRowSelected(event: RowSelectedEvent): void {
    const rows = event.api.getSelectedRows();

    if (this.includesVerified(rows)) {
      this.verifyDisable.set(true);
    } else {
      this.verifyDisable.set(false);
    }

    if (this.includesVoided(rows)) {
      this.voidDisable.set(true);
    } else {
      this.voidDisable.set(false);
    }

    this.cloneDisable.set(rows.length > 1);
  }

  createDepositSlip(): void {
    this.router.navigate(['../create'], { relativeTo: this.activatedRoute });
  }

  editDepositSlip(id: string): void {
    this.router.navigate([`../edit/${id}`], {
      relativeTo: this.activatedRoute
    });
  }

  goToSettings(): void {
    this.router.navigate(['../settings'], {
      relativeTo: this.activatedRoute
    });
  }

  includesVerified(rows: (RowSelectedEvent | { status: number })[]): boolean {
    for (const row of rows) {
      if ((row as { status: number }).status == 1) {
        return true;
      }
    }
    return false;
  }

  includesVoided(rows: (RowSelectedEvent | { status: number })[]): boolean {
    return rows.some(
      row =>
        (row as { status: number }).status === 1 ||
        (row as { status: number }).status === 2
    );
  }

  /** Method to clone a DD */
  cloneDS(id: string) {
    this.router.navigate([`../clone/${id}`], {
      relativeTo: this.activatedRoute
    });
  }

  /** Method to add an attachment */
  addAttachment(id: string) {
    const dsAttach = this.matDialog.open(AddAttachmentModalComponent, {
      width: '750px',
      maxWidth: '1350px',
      data: {
        id: id,
        type: 'deposit-slips'
      }
    });
    dsAttach.afterClosed().subscribe((result) => {
      if (result) {
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  /** Method to add an comment */
  addComment(id: string) {
    const dsComment = this.matDialog.open(AddCommentsModalComponent, {
      width: '750px',
      maxWidth: '1000px',
      data: {
        id: id,
        type: 'deposit-slips',
        enableDelete: true
      }
    });

    dsComment.afterClosed().subscribe((result) => {
      if (result.refresh) {
        this.v3DataTableService.refreshV3DataTable();
      }
    });
  }

  verifySlip(id: string): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to verify this?'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.verifyLoading.set(true);
        this.subscriptions.push(
          this.depositService.verifySlip(id)
          .pipe(
            finalize(() => {
              this.verifyLoading.set(false);
            })
          )
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Deposit slip verified',
                close: true
              });
              this.dataTableService.setRefreshStatus(true);
              this.refreshDataTable();
            }
          })
        );
      }
    });
  }

  multiVerify(ids: string[]): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to verify this?'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.verifyLoading.set(true);
        this.subscriptions.push(
          this.depositService.multiVerify(ids)
          .pipe(
            finalize(() => {
              this.verifyLoading.set(false);
            })
          )
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Deposit slips verified',
                close: true
              });
              this.dataTableService.setRefreshStatus(true);
              this.refreshDataTable();
            }
          })
        );
      }
    });
  }

  deleteRow(id: string): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this?'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.deleteLoading.set(true);
        this.subscriptions.push(
          this.depositService.deleteSlip(id)
          .pipe(
            finalize(() => {
              this.deleteLoading.set(false);
            })
          )
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Deposit slip deleted',
                close: true
              });
              this.dataTableService.setRefreshStatus(true);
              this.refreshDataTable();
            }
          })
        );
      }
    });
  }

  multiDelete(ids: string[]): void {
    const dRef = this.alertService.confirmAlert({
      content: 'Are you sure you want to delete this?'
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.deleteLoading.set(true);
        this.subscriptions.push(
          this.depositService.multiDelete(ids)
          .pipe(
            finalize(() => {
              this.deleteLoading.set(false);
            })
          )
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Deposit slips deleted',
                close: true
              });
              this.dataTableService.setRefreshStatus(true);
              this.refreshDataTable();
            }
          })
        );
      }
    });
  }

  printBulk(ids: string[]): void {
    if (!this.isPrinted) {
      this.isPrinted = true;
      this.printLoading.set(true);
      this.depositService
        .printBulk(ids)
        .pipe(
          finalize(() => {
            this.printLoading.set(false);
          })
        )
        .subscribe((data: IApiRes<{ printData: string; url: string }>) => {
          if (data?.success) {
            if (data?.data?.url) {
              window.open(data?.data?.url, '_blank')?.focus();
            } else if (data.data.printData) {
              const iframes = document.querySelectorAll('iframe');
              for (let i = 0; i < iframes.length; i++) {
                if (iframes[i].id?.includes('print-iframe')) {
                  iframes[i]?.parentNode?.removeChild(iframes[i]);
                }
              }

              const iframe = document.createElement('iframe');
              iframe.id = 'dt-print-iframe';
              iframe.srcdoc = data.data.printData;
              iframe.style.visibility = 'hidden';
              document.body.appendChild(iframe);
            }
          }
          this.v3DataTableService.v3RowSelectionData = [];
          this.v3DataTableService.gridApi?.deselectAll();
          this.isPrinted = false;
        });
    }
  }

  multiVoid(ids: string[]): void {
    const dRef = this.alertService.confirmAlert({
      content: `Are you sure you want to void ${ids.length === 1 ? 'this deposit slip?' : 'these deposit slips?'}`
    });

    dRef.afterClosed().subscribe((res) => {
      if (res) {
        this.voidLoading.set(true);
        this.subscriptions.push(
          this.depositService.multiVoid(ids)
          .pipe(
            finalize(() => {
              this.voidLoading.set(false);
            })
          )
          .subscribe((data) => {
            if (data?.success) {
              this.alertService.successAlert({
                title: 'Success',
                content: 'Deposit slips voided',
                close: true
              });
              this.refreshDataTable();
            }
          })
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
