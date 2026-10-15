import { faXmark, faCircleInfo } from '@fortawesome/pro-regular-svg-icons';
import { Component, Input, OnDestroy, OnInit, inject, signal, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ColDef, ColGroupDef, GridApi, ICellRendererParams } from '@ag-grid-community/core';
import { EMPTY, of, Subscription, firstValueFrom, from, throwError } from 'rxjs';
import { catchError, finalize, mergeMap, tap, debounceTime } from 'rxjs/operators';
import { NgIf, NgClass, NgFor, DatePipe } from '@angular/common';
import { environment } from 'src/environments/environment';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CheckService } from 'src/app/shared/service/check/check.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { NpsService } from 'src/app/shared/service/nps/nps.service';
import { IInfoAlert } from 'src/app/models/alert';
import { IntegrationService } from 'src/app/shared/service/integration/integration.service';
import { UserProfileService } from 'src/app/shared/service/user/user-profile.service';
import { ThirdpartyImportMainModalComponent } from 'src/app/shared/modal/thirdparty-imports/thirdparty-import-main-modal/thirdparty-import-main-modal.component';
import {
  IDataTable,
  IDtActionCompProp,
  IDtCellrendererBtn,
  IDtColumnFields,
  IDtFloatingFilterProp,
  IDtHeaderElements,
  ISelectedSingleRow
} from 'src/app/modules/data-table/model/datatable';
import { ScriptService } from 'src/app/core/services/script.service';
import { UserService } from 'src/app/shared/service/user/user.service';
import { HeaderService } from 'src/app/shared/service/header/header.service';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { CompanySwitchRepository } from 'src/app/modules/company-switch/repository/companySwitch.repository';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { FormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import {
  DTTableId,
  TTableIdValues
} from 'src/app/modules/data-table/data/table-id';
import { IApiRes } from 'src/app/models/api';
import {
  faArrowDownToLine,
  faUpToLine,
  faEllipsisV,
  faInfo,
  faMoneyCheck,
  faFileMagnifyingGlass
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NetsuiteIntegrationService } from 'src/app/shared/service/integration/netsuite.service';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { DtMultiDropdownPayeeComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-multi-dropdown-payee/dt-multi-dropdown-payee/dt-multi-dropdown-payee.component';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { WarningAlertComponent } from 'src/app/shared/alert/components/warning-alert/warning-alert.component';
import { DtCellFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-cell-filter/dt-cell-filter.component';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { V3DescriptionComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-description/v3-description.component';
import { DtEditFieldComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-edit-field/dt-edit-field.component';
import { V3CreatedByComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-created-by/v3-created-by.component';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { CommonOnInitService } from 'src/app/shared/service/common-onInit/common-on-init.service';
import { V3BulkPaymentService } from 'src/app/modules/v3-bulk-payment/services/v3-bulk-payment.service';
import { LayoutService } from 'src/app/shared/service/layout/layout.service';
import { CheckEmailModalComponent } from '../../modal/check-email-modal/check-email-modal.component';
import { DirectDepositComponent } from '../../modal/direct-deposit/direct-deposit.component';
import { CheckAddAttachmentCommentComponent } from './addAttachmentComment';
import { CheckAddAttachmentCommonModalComponent } from '../../modal/check-activity-modals/check-add-attachment-common-modal/check-add-attachment-common-modal.component';
import { CheckActivityModalComponent } from '../../modal/check-activity-modals/check-activity-modal/check-activity-modal.component';
import { CheckAddCommentModalComponent } from '../../modal/check-activity-modals/check-add-comment-modal/check-add-comment-modal.component';
import { CheckPrintAdModalComponent } from '../../modal/check-print-ad-modal/check-print-ad-modal.component';
import { CheckMailModalComponent } from '../../modal/mail-modals/check-mail-modal/check-mail-modal.component';
import { VerifySignatureModalComponent } from '../../modal/mail-modals/verify-signature-modal/verify-signature-modal.component';
import { CheckProcessModalComponent } from '../../modal/process-modal/check-process-modal/check-process-modal.component';
// Data table components
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtSelectBoxComponent } from '../../../data-table/components/dt-select-box/dt-select-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { DtDropDownBankComponent } from '../../../data-table/components/dt-drop-down-bank/dt-drop-down-bank.component';
import { CheckTableList } from '../../components/methods/check-methods';
import { CustomCheckExportErrorAlertComponent } from '../../components/custom-check-export-error-alert/custom-check-export-error-alert.component';
import {
  ICheckEmailData,
  ICheckListTableRowData,
  ICheckShipingTypes,
  ICheckStatus,
  IChequedata,
  IMailCheck,
  IShipingCheckPaperType,
  IShippingCostCalculation,
  IShippingType
} from '../../model/check';
import { DataTableComponent } from '../../../data-table/components/data-table/data-table.component';
import { DemoVideoComponent } from '../../../../shared/components/demo-video/demo-video.component';
import {
  IConfirmAlert,
  IFailedAlert,
  ISuccessAlert
} from '../../../../models/alert';
import { V3DTCheckNumberComponent } from './dt-check-no.component';
import { VirtualAccountConfirmationModalComponent } from 'src/app/modules/bank/bank-v2/modals/virtual-account-confirmation-modal/virtual-account-confirmation-modal.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { GroupMailingListComponent } from 'src/app/modules/business-tools/mailing-dashboard/pages/group-mailing-list/group-mailing-list.component';

interface ICheckBoxInterface {
  value: string | number;
  name: string;
}
interface ICheckApprove {
  isPending: number;
  isApprovedForMail: number;
}
@Component({
  selector: 'app-check-list',
  templateUrl: './check-list.component.html',
  styleUrls: ['./check-list.component.scss'],
  standalone: true,
  imports: [
    DemoVideoComponent,
    NgIf,
    MatTooltip,
    NgClass,
    NgFor,
    FormsModule,
    DataTableComponent,
    FontAwesomeModule,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    GroupMailingListComponent
  ]
})
export class CheckListComponent implements OnInit, OnDestroy, IDataTable {
  // DATA TABLE VARAIBLES
  public columnDefs!: (ColDef | ColGroupDef)[] | null;
  public columnFields: IDtColumnFields[];
  public headerElements: IDtHeaderElements;
  public tableId: TTableIdValues = DTTableId.check; // Data Table Id
  public v3DataTableService = inject(V3DataTableService);
  public frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: DtSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    bankAccountComponent: DtDropDownBankComponent,
    payeeListComponent: DtMultiDropdownPayeeComponent,
    addAttachmentComment: CheckAddAttachmentCommentComponent,
    dtCellFilterComponent: DtCellFilterComponent,
    dtEditFieldComponent: DtEditFieldComponent,
    v3DescriptionComponent: V3DescriptionComponent,
    v3CreatedByComponent: V3CreatedByComponent,
    V3DTCommonFilterComponent,
    V3DTCheckNumberComponent
  };

  // --------------------------------------->
  FloatingFilterComponent: IDtFloatingFilterProp;
  cellRenderer: IDtCellrendererBtn;
  actionComponentProp: IDtActionCompProp;
  selectedRow: ICheckListTableRowData[];
  subscriptions: Subscription[] = [];
  checkStatus: ICheckBoxInterface[] = [];
  cellRendererCheckStatus: Record<string, ICheckStatus> = {};
  checkImported = false;
  alertDot = false;
  disabled = false;
  checkApproveRjctCurrentData: ICheckApprove;
  checkApprovedForMail = 0;
  isQucikBookConnected = 0;
  HeaderButtonLoadingProp = { isLoading: false, btn_id: '', btn_name: '' };
  rooturl = environment.rootUrl;
  userVerified = false;
  pendingChecks: number;
  loading: boolean;
  bankAccountId: string;
  checkNo: string;
  isHamaspik = false;
  exportOptions: string[] = [];
  isShowExportList = false;
  isVerifiedChecksPluginEnabled = signal(false);
  isChaseAccountPending = false;

  faUpToLine = faUpToLine;
  faArrowDownToLine = faArrowDownToLine;
  faEllipsisV = faEllipsisV;
  faInfo = faInfo;
  faXmark = faXmark;
  faCircleInfo = faCircleInfo;
  faMoneyCheck = faMoneyCheck;
  faFileMagnifyGlass = faFileMagnifyingGlass;

  @Input() isFromPaymentsV3 = false;

  selectedCheckPaperType = '1';
  checkDesignTemplate = [
    { value: '1', name: 'Print Check On Top' },
    { value: '2', name: 'Print Check On Middle' },
    { value: '3', name: 'Print Check On Bottom' },
    { value: '4', name: 'Three Per Page' },
    { value: '5', name: 'Wallet Size' }
  ];

  defaultCheckListTab = 'id_all';
  /** Panel tab currently highlighted; kept here so it survives the table being re-created. */
  activeCheckTab = 'id_all';
  /** Group Mailings tab is open: its table replaces the check table in this layout. */
  isGroupMailingsActive = signal(false);
  readonly SCHEDULED_CHECK_STATUS = '50';
  panelBtnsMap: { [x: string]: string } = {
    1: 'id_all',
    2: 'id_new',
    4: 'id_mailed',
    6: 'id_imported',
    7: 'id_blank',
    8: 'id_void',
    9: 'id_posted',
    10: 'id_un-posted',
    11: 'id_dd',
    12: 'id_sheduled',
  };

  checkdata: {
    errorMsg: string;
    chequedata: IChequedata;
    shipping: ICheckShipingTypes[];
    paper: IShipingCheckPaperType[];
  };

  err_msg: string;
  errorCode: number;
  ShippingCostRes: IShippingCostCalculation;
  checkDetails: string | IMailCheck[];
  checkAmount: number;

  idlist = {
    mail_type: 1,
    check_paper: 7,
    informed_payee_sms: 0,
    informed_payee_email: 0,
    payee_phone: '',
    payee_email: ''
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  caldata: any = {
    mail_check_ids: [],
    all_check_ids: [],
    shipping_rate_warning: 0,
    sent_to_customer_address: 0,
    Single_mail_options: 3
  };

  isPushBackEnable: boolean;
  loadingpush: boolean;

  isUserAchVerified: number;
  totalCheckSum: number=0;
  totalCheckSumLoading: boolean = false;
  selectedCheckSum: number = 0;

  backUrl: string = '/manage/dashboard' as const;
  urlBackState = { backUrl: 'checklist' };

  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: '',
    ignoreColumns: ['action', 'id']
  };

  isQucikBookDesktopConnected = 0;
  isQBDPushBackEnabled = false;
  chequeStatus: number;
  isIndiaBazaarEnabled = false;

  isFreshBooksConnected = 0;
  isFreshBooksPushBackEnabled = 0;

  isNetSuiteushBackEnabled = false;
  isNetSuiteConnected = false;
  faExport = faUpToLine;
  whiteLabelPayeeName =
    environment.env_id === 'compass' ? 'Print On Check As' : 'Payee';

  whiteLabelPayeeHeaderName =
    environment.env_id === 'compass' ? 'Print On Check As' : 'Payee';

  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private alertService = inject(AlertService);
  private checkService = inject(CheckService);
  private headerService = inject(HeaderService);
  private router = inject(Router);
  private v3PaymentsTableService = inject(V3PaymentsTableService);
  private npsService = inject(NpsService);
  private integrationService = inject(IntegrationService);
  private userProfileService = inject(UserProfileService);
  private scriptService = inject(ScriptService);
  private userService = inject(UserService);
  private localStorageService = inject(LocalStorageService);
  private companySwitchRepo = inject(CompanySwitchRepository);
  private netsuiteIntegrationService = inject(NetsuiteIntegrationService);
  private paymentService = inject(PaymentsService);
  private commonOnInitService = inject(CommonOnInitService);
  private v3BulkPaymentService = inject(V3BulkPaymentService);
  private layoutService = inject(LayoutService);
  private datePipe = inject(DatePipe);


  @Output() totalCheckSumChange = new EventEmitter<number>();

  constructor() {
    // HEADER ELEMENTS PROPERTIES
    this.headerElements = CheckTableList.HeaderElements();
    

    // FILTER CUSTOM COMPONENTS
    this.FloatingFilterComponent = CheckTableList.floatingFilterCompProp();

    // PASS  FIELD DATA
    
    // CELL RENDERER COMPONENT
    this.cellRenderer = CheckTableList.cellRendererActionBtn();
    
    // ACTION COMPONENT PROPERTIES
    this.actionComponentProp = {
      actionButton: true,
      eyeButton: true,
      cardButton: true
    };
    
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.checkUserVeried();
    const userPlugins = this.localStorageService.getItem('userPlugins');
    this.columnDefs = this.setColumnDefs(environment.env_id,userPlugins);
    this.filterColumnFields(userPlugins);
  }

  /**
   * @description Sets the column definitions for the ag-Grid based on the provided environment ID.
   *
   * @param {string} envId - The environment ID.
   * @returns {typeof this.columnDefs} The filtered column definitions array.
   */
  setColumnDefs(envId: string,userPlugins?: string[]): typeof this.columnDefs {
    const columnDefs = [
      this.colDefId,
      this.colDefAction,
      this.colDefStatus,
      this.colDefAmount,
      this.colDefVendorId,
      this.colDefPayee,
      this.colDefNickName,
      this.colDefBank,
      this.colDefCheckNo,
      this.colDefDate,
      this.colDefCreatedAt,
      this.colDefBy,
      this.colDefPayMethod,
      this.colDefMemo,
      this.colDefNote,
      this.colDefCategory,
      this.colDefPayeeAcNo,
      this.colDefInvoiceNo
    ];

    if (envId !== 'compass') {
      return columnDefs.filter((col) => col !== this.colDefVendorId);
    }
    // Add position column only when enterprise-bryancohen plugin is enabled
    if (userPlugins && userPlugins.includes('enterprise-bryancohen')) {
      columnDefs.splice(4, 0, this.colDefPosition); // Insert after Reference ID
    }
    return columnDefs;
  }

  // CONSTRUCTOR END
  ngOnInit(): void {
    this.dataTableService.setRefreshStatus(true);
    this.fetchHeaderData();
    this.NpsLoginCredAPI();
    this.getCheckStatus();
    this.getCheckListData();
    this.getCheckPaperType();
    this.shippingType();
    this.paperType();
    this.getHeaderFilters();
    this.checkIfAchVerifiedUser();
    this.dataTableService.destroyPayload = true;
    this.subscribeToFilterChanges();
    this.subscriptions.push(
      this.dataTableService.getRefreshStatus().subscribe((res) => {
        if(res.status &&  this.isIndiaBazaarEnabled){
          this.getTotalCheckSum();
        }
        this.syncScheduledDateColumn();
      })
    );
    this.subscriptions.push(
      this.checkService.getTotalCheckSumUpdates().subscribe((total) => {
        if (total !== null) {
          this.totalCheckSum = total;
          this.totalCheckSumChange.emit(this.totalCheckSum);
        }
      })
    );
  }

  private setHeaderButtonLoading(
    isLoading: boolean,
    buttonId: string = '',
    loadingText: string = 'Loading...'
  ): void {
    this.HeaderButtonLoadingProp.isLoading = isLoading;
    this.HeaderButtonLoadingProp.btn_id = isLoading ? buttonId : '';
    this.HeaderButtonLoadingProp.btn_name = isLoading ? loadingText : '';
  }

  fetchHeaderData() {
    this.subscriptions.push(
      // eslint-disable-next-line no-underscore-dangle
      this.headerService._headerData.subscribe((res) => {
        if (res) {
          if (res.enabledPlugins.includes('enterprise-hamaspik-check-import')) {
            this.isHamaspik = true;
          }
          if (res.personalInfo?.isLegalEnabled === '1') {
            this.enableLegalCheckTemplate();
          }
          if(res.enabledPlugins.includes('cleared-checks-import')){
            this.isVerifiedChecksPluginEnabled.set(true);
          }
          if(res.enabledPlugins.includes('india-bazaar')){
            this.isIndiaBazaarEnabled = true;
            this.getTotalCheckSum();
          }
          if(res.enabledPlugins.includes('qb-auto-sub-account-mapping')){
            this.headerElements.buttons.push({
              name: 'Print Mailed Preview',
              id: 'id_print_mailed_preview',
              icon: 'fa fa-print',
              cssClass: 'ocw-data-btn ocw-btn ocw-btn-light-blue btn-hide-tab',
              toolTip: 'Print preview for mailed checks'
            });
          }
        }
      })
    );
  }

  enableLegalCheckTemplate() {
    this.checkDesignTemplate.push({ value: '100', name: 'Legal-Check On Top' },{ value: '101', name: 'Legal-Check On Middle' });
  }

  checkIfAchVerifiedUser(): void {
    this.isUserAchVerified = this.localStorageService.getItem('achEnabled');
    this.subscriptions.push(
      this.userService.achEnabledUser$.subscribe((r) => {
        this.isUserAchVerified = r;
      })
    );
  }

  // NPS Modal API
  NpsLoginCredAPI() {
    this.subscriptions.push(
      this.companySwitchRepo.showIntroModals().subscribe((resp) => {
        const result = resp.data;
        if (result.showNpsModal === 1) {
          this.localStorageService.removeItem('NpsRemind');
          this.npsService.setNPSVal(true);
        } else {
          this.localStorageService.removeItem('NPSVal');
          this.npsService.setNPSVal(false);
        }
      })
    );
  }

  getHeaderFilters() {
    this.subscriptions.push(
      this.checkService.getCheckListTabs().subscribe((data) => {
        if (data?.success) {
          this.defaultCheckListTab =
            this.panelBtnsMap[data.data?.defaultCheckListTab as keyof object];

          // The user may already have opened Group Mailings before this resolves —
          // don't pull them back to the default tab.
          if (!this.isGroupMailingsActive()) {
            this.activeCheckTab = this.defaultCheckListTab;
            this.onHeaderBtn({ id: this.defaultCheckListTab });
          }

          if (data.data?.tabOrder?.length) {
            data.data.tabOrder.forEach((item) => {
              const name = data.data.tabList[item];
              if (this.headerElements.panelButtons) {
                this.headerElements.panelButtons.push({
                  name,
                  id: this.panelBtnsMap[item as unknown as keyof object]
                });
              }
            });
          }
          // Recurring
          if (this.headerElements.panelButtons) {
            this.headerElements.panelButtons.push({
              name: 'Recurring',
              id: 'id_recurring',
              options: { isItButton: true }
            });
            this.headerElements.panelButtons.push({
              name: 'Group Mailings',
              id: 'id_groupMailings',
              options: { isItButton: true }
            });
          }
        }
      })
    );
  }

  // Load Check Status
  getCheckStatus(): void {
    if (this.localStorageService.getItem('check_status')) {
      // get status from local storage
      const status = this.localStorageService.getItem('check_status');
      this.cellRendererCheckStatus = status;
      return;
    }

    this.subscriptions.push(
      this.checkService.getCheckStatus().subscribe((res) => {
        if (res?.success) {
          this.localStorageService.setItem('check_status', res.data);
          this.cellRendererCheckStatus = res.data;
        }
      })
    );
  }

  // To know Check Approve Reject Data Exist or Not
  getCheckListData() {
    this.checkService.getCheckListData().subscribe(async (res) => {
      if (res?.success) {
        const alert = this.querySelector('#alertLine') as HTMLElement;
        this.checkApproveRjctCurrentData = res.data;
        this.checkApprovedForMail = res.data?.isApprovedForMail;
        this.isQucikBookConnected = res.data?.isQucikBookConnected;
        this.isPushBackEnable =
          !!res.data?.isPushBackEnabled?.is_push_back_enable;
        this.pendingChecks = res.data.checkApprovalTotalCount;
        this.isQucikBookDesktopConnected =
          res.data?.isQucikBookDesktopConnected;
        this.isQBDPushBackEnabled = !!res.data?.isQBDPushBackEnabled;
        this.isNetSuiteConnected = !!res.data?.isNetsuiteConnected;
        this.isNetSuiteushBackEnabled = !!res.data?.isNetsuitePushBackEnabled;
        this.isFreshBooksConnected = res.data?.isFreshBooksConnected;
        this.isFreshBooksPushBackEnabled = res.data?.isFreshBooksPushBackEnabled;

        if (this.isQucikBookConnected && this.isPushBackEnable) {
          this.exportOptions.push('quickbookOnline');
        }
        if (this.isQucikBookDesktopConnected && this.isQBDPushBackEnabled) {
          this.exportOptions.push('quickbookDesktop');
        }
        if (this.isNetSuiteushBackEnabled && this.isNetSuiteConnected) {
          this.exportOptions.push('netsuit');
        }
        if (this.exportOptions.length > 1) {
          this.isShowExportList = true;
        }

        if (res.data.isPending === 1) {
          if (alert) {
            alert.innerText =
              `You have` +
              ` ${this.pendingChecks} ` +
              `pending checks to approve`;
          }

          if (
            this.headerElements.buttons.find(
              (e: { id: string }) => e?.id === 'id_approve'
            )
          )
            return;
          if (this.isHamaspik) return;

          this.headerElements.buttons.push(
            {
              id: 'id_approve',
              name:'APPROVE',
              cssClass:'bg-common-secondary-green-color text-common-green-color ml-1 px-2 text-sm !h-8 !rounded !px-5 !min-w-[80px]',
              toolTip:'Approve Selected Item'
            },
            {
              id: 'id_reject',
              name:'REJECT',
              cssClass:'bg-common-secondary-red-color text-common-red-color ml-3 px-2 text-sm !h-8 !rounded !px-5 !min-w-[80px]',
              toolTip:'Reject Selected Item'
            }
          );
        } else {
          if (alert) {
            alert.innerText = '';
          }
          const hideArr = (
            await firstValueFrom(this.dataTableService.isDisable)
          ).selectedIds;
          this.disabledActions([...hideArr, 'RId_approve', 'RId_reject']);
          this.headerElements.buttons.forEach((el, index: number) => {
            if (el?.id === 'id_approve') {
              this.headerElements.buttons.splice(index, 2);
            }
          });
        }
      }
    });
  }

  // Load Default Check Paper Type
  getCheckPaperType(): void {
    this.subscriptions.push(
      this.checkService.getCheckPaperType().subscribe((res) => {
        if (res?.success) {
          if (!res?.data?.paperType) {
            this.onCheckDesignTemplate('1');
            this.selectedCheckPaperType = '1';
          } else {
            this.selectedCheckPaperType = res?.data?.paperType;
          }
        }
      })
    );
  }

  // FIND WHICH HEADER BUTTON IS CLICKED
  onHeaderBtn(event: {
    id?: string;
    selectedRows?: ICheckListTableRowData[];
  }): void {
    const { selectedRows } = event;

    // Keep the highlighted tab in sync so it survives the table being re-created
    // when coming back from the Group Mailings table.
    if (
      event?.id &&
      this.headerElements.panelButtons?.some((btn) => btn.id === event.id)
    ) {
      this.activeCheckTab = event.id;
    }

    switch (event?.id) {
      // panel Filters
      case 'id_all':
        this.dataTableService.setMainFilter('','cheques.cheque_status');
        break;
      case 'id_new':
        this.dataTableService.setMainFilter('0','cheques.cheque_status');
        break;
      case 'id_mailed':
        this.dataTableService.setMainFilter('show_all_mailed','cheques.cheque_status');
        break;
      case 'id_imported':
        this.dataTableService.setMainFilter('third_party','cheques.cheque_status');
        break;
      case 'id_blank':
        this.dataTableService.setMainFilter('show_blank','cheques.cheque_status');
        break;
      case 'id_void':
        this.dataTableService.setMainFilter('2','cheques.cheque_status');
        break;
      case 'id_posted':
        this.dataTableService.setMainFilter('show_posted','cheques.cheque_status');
        break;
      case 'id_un-posted':
        this.dataTableService.setMainFilter('show_un_posted','cheques.cheque_status');
        break;
      case 'id_dd':
        this.dataTableService.setMainFilter('dd','cheques.cheque_status');
        break;
      case 'id_sheduled':
        this.dataTableService.setMainFilter('50','cheques.cheque_status');
        break;
      case 'id_recurring':
        this.redirectToCheckRecurring();
        break;
      case 'id_groupMailings':
        this.openGroupMailings();
        break;

      // Buttons

      case 'id_btnNew':
        this.onNewCheck();
        break;
      case 'id_quickpay':
        this.onQuickPay();
        break;
      case 'id_printCheck':
        if (this.userVerified) {
          this.onMultiPrintCheck(
            selectedRows as ICheckListTableRowData[],
            'check'
          );
        } else {
          this.goToVerify();
        }
        break;
      case 'id_printCheck_white':
        if (this.userVerified) {
          this.onMultiPrintCheck(
            selectedRows as ICheckListTableRowData[],
            'white_paper'
          );
        } else {
          this.goToVerify();
        }
        break;
      case 'id_mail':
        if (this.userVerified) {
          this.onMultiMail(selectedRows as ICheckListTableRowData[]);
        } else {
          this.goToVerify();
        }
        break;
      case 'id_email':
        if (this.userVerified) {
          this.onMultiEmail(selectedRows as ICheckListTableRowData[]);
        } else {
          this.goToVerify();
        }
        break;
      case 'id_direct_deposit':
        if (this.userVerified) {
          this.openDirectDepositModal(selectedRows as ICheckListTableRowData[]);
        } else {
          this.goToVerify();
        }
        break;
      case 'id_btnVoid':
        this.onVoidMultipleCheck(selectedRows as ICheckListTableRowData[]);
        break;
      case 'id_btnTrash':
        this.onDeleteMultipleChecks(selectedRows as ICheckListTableRowData[]);
        break;
      case 'id_mark_as_cleared':
        this.onMarkAsClearedCheck(selectedRows as ICheckListTableRowData[]);
        break;
      case 'id_approve':
        this.onApproveCheck(selectedRows as ICheckListTableRowData[], true);
        break;
      case 'id_reject':
        this.onRejectCheck(selectedRows as ICheckListTableRowData[], true);
        break;
      case 'id_print_mailed_preview':
        this.goToBulkPrintPreviewChecks();
        break;
      default:
        break;
    }
  }

  // FIND WHICH CELL ACTION BUTTON IS CLICKED
  onCellActionbtn(event: {
    selectedRow: ICheckListTableRowData;
    id: string;
  }): void {
    const selectedItem = event?.selectedRow;
    this.setActionButtonDisable(selectedItem);
    this.setActionButtonHide(selectedItem);
    switch (event?.id) {
      case 'RId_approve':
        this.onApproveCheck(selectedItem, false);
        break;
      case 'RId_reject':
        this.onRejectCheck(selectedItem, false);
        break;
      case 'RId_print':
        if (this.userVerified) {
          this.onPrintSingleCheck(selectedItem);
        } else {
          this.goToVerify();
        }
        break;
      case 'RId_edit':
        this.onEditCheck(selectedItem);
        break;
      case 'RId_void':
        this.onVoidSingleCheck(selectedItem);
        break;
      case 'RId_delete':
        this.onSingleDelete(selectedItem);
        break;
      case 'RId_activity':
        this.activityModal(selectedItem);
        break;
      case 'RId_commentCheck':
        this.openAddCommandModal(selectedItem?.id);
        break;
      case 'RId_clone':
        this.onCloneCheck(selectedItem);
        break;
      case 'RId_summary':
        this.onPayeeSummary(selectedItem);
        break;
      case 'RId_attachmentCheck':
        this.openAddAttachmentModal(selectedItem?.id);
        break;
      case 'RId_re_email':
        this.reEmailCheck(selectedItem?.id);
        break;
      case 'RId_forcefullyPrint':
        this.forcefullyPrinted(selectedItem);
        break;
      case 'RId_printReceipt':
        this.downloadProofOfPayment(selectedItem);
        break;
      case 'RId_card':
        this.payByCreditCard(selectedItem);
        break;
      default:
        break;
    }
  }

  // View Check Action Button
  onCellActionView(event: ISelectedSingleRow): void {
    const selectedItem = event.selectedRow;

    if (event.selectedRow?.action && selectedItem) {
      this.dataTableService.destroyPayload = false;
      this.router.navigate(['/manage/cheque/view/', selectedItem.action], {
        state: { backUrl: this.router.url }
      });
    }
  }

  // Imported Check row data action warning button click
  onImportedQuickBookDataAction(event: ISelectedSingleRow): void {
    const checkId = event.selectedRow?.action;
    if (event.selectedRow?.action) {
      this.router.navigate(['/manage/cheque/create/'], {
        queryParams: { id: checkId },
        fragment: 'thirdparty=1'
      });
    }
  }

  // Hide Action Buttons
  setActionButtonHide(selectedItem: ICheckListTableRowData): void {
    if (!selectedItem) {
      return;
    }
    // -----------Approve and Reject-----------------
    const checkStatus = selectedItem?.cheque_status;

    if (checkStatus === 504) {
      if (this.cellRenderer.action.find((e) => e?.id === 'RId_forcefullyPrint'))
        return;
      this.cellRenderer.action.splice(3, 0, {
        name: 'Mark as Forcefully Printed',
        id: 'RId_forcefullyPrint',
        icon: 'fa fa-check'
      });
    } else {
      this.cellRenderer.action.forEach((el, index: number) => {
        if (el?.id === 'RId_forcefullyPrint')
          this.cellRenderer.action.splice(index, 1);
      });
    }
    if (checkStatus === 35 && !this.isHamaspik) {
      if (this.cellRenderer.action.find((e) => e?.id === 'RId_approve')) return;
      this.cellRenderer.action.unshift(
        {
          name: 'approve',
          id: 'RId_approve',
          icon: 'fa fa-check'
        },
        {
          name: 'Reject',
          id: 'RId_reject',
          icon: 'fa fa-ban'
        }
      );
    } else {
      this.cellRenderer.action.forEach((el, index: number) => {
        if (el?.id === 'RId_approve') this.cellRenderer.action.splice(index, 2);
      });
    }
    if (checkStatus >= 500 && checkStatus <= 506) {
      if (this.cellRenderer.action.find((e) => e?.id === 'RId_re_email'))
        return;
      this.cellRenderer.action.splice(3, 0, {
        name: 'Re-Email this Check',
        id: 'RId_re_email',
        icon: 'fa-solid fa-paper-plane'
      });
    } else {
      this.cellRenderer.action.forEach((el, index: number) => {
        if (el?.id === 'RId_re_email') {
          this.cellRenderer.action.splice(index, 1);
        }
      });
    }

    // -----------Payee Summary-----------------

    if (selectedItem) {
      if (!selectedItem.payee_id) {
        this.cellRenderer.action.forEach((el, index: number) => {
          if (el?.id === 'RId_summary') {
            this.cellRenderer.action.splice(index, 1);
          }
        });
      } else if (
        !this.cellRenderer.action.find((e) => e?.id === 'RId_summary')
      ) {
        let beforeIndex: number = -1; // Initialize with a default value
        this.cellRenderer.action.forEach((el, index: number) => {
          if (el?.id === 'RId_clone') {
            beforeIndex = index;
          }
        });

        if (beforeIndex !== -1) {
          // Check if beforeIndex was updated
          this.cellRenderer.action.splice(beforeIndex + 1, 0, {
            name: 'Payee Summary',
            id: 'RId_summary',
            icon: 'fa-solid fa-user'
          });
        }
      }
    }

    this.dataTableService.setCellRendererAction(this.cellRenderer.action);
  }

  // Disable Action Buttons
  async setActionButtonDisable(selectedItem: ICheckListTableRowData) {
    this.dataTableService.isDisable.next({ isDisable: false, selectedIds: [] });
    const actionList =
      this.cellRendererCheckStatus[selectedItem?.cheque_status];
    const hideArr = (await firstValueFrom(this.dataTableService.isDisable))
      .selectedIds;
    if (!actionList) return;

    if (
      actionList.isItPrintAble === 0 ||
      selectedItem.bank_account_nature_type === 2 ||
      selectedItem.create_check_from === 1
    ) {
      hideArr.push(' RId_print');
    } else {
      hideArr.push('');
    }

    if (actionList.isItEditAble === 0 || selectedItem.create_check_from === 1) {
      hideArr.push('RId_edit');
    } else {
      hideArr.push('');
    }
    if (actionList.isItVoidAble === 0 || selectedItem.create_check_from === 1) {
      hideArr.push('RId_void');
    } else {
      hideArr.push('');
    }

    if (
      actionList.isItDeleteAble === 0 ||
      selectedItem.create_check_from === 1
    ) {
      hideArr.push('RId_delete');
    } else {
      hideArr.push('');
    }

    if (selectedItem.create_check_from === 1) {
      hideArr.push('RId_clone');
    } else {
      hideArr.push('');
    }

    this.disabledActions(hideArr);
  }

  activityModal(selectedItem: ICheckListTableRowData): void {
    this.dialog.open(CheckActivityModalComponent, {
      width: '70%',
      data: selectedItem.action,
      disableClose: true
    });
  }

  disabledActions(ids: string[]): void {
    this.dataTableService.setActionButtonDisable(true, ids);
  }

  onRowSelected(event: { api: GridApi; type: string }): void {
    const gridApi = event.api; // all the data table params function get here

    this.selectedRow = gridApi.getSelectedRows();
    this.selectedCheckSum = this.selectedRow.reduce(
      (sum, row) =>
        sum + (Number(String(row?.cheque_amount ?? '').replace(/,/g, '')) || 0),
      0
    );
  }

  // Check Design Template Select Box
  onCheckDesignTemplate(value: string): void {
    const templateType = value;
    this.subscriptions.push(
      this.checkService
        .postCheckPaperType({ paperType: templateType })
        .subscribe((res) => {
          if (res?.success) this.selectedCheckPaperType = templateType;
        })
    );
  }

  // New Check
  onNewCheck(): void {
    this.router.navigateByUrl('/manage/cheque/create');
  }

  // Quick Pay
  onQuickPay(): void {
    this.router.navigate([`/manage/payment-rail/make-payment`], {
      state: this.urlBackState
    });
  }

  onMultiPrintCheck(
    selectedItems: ICheckListTableRowData[],
    type: string
  ): void {
    const virtualAccountIds: string[] = [];
    selectedItems.forEach((el) => {
      if (el.is_virtual_account === 1) {
        if (!virtualAccountIds.includes(el.bank_accounts_id)) {
          virtualAccountIds.push(el.bank_accounts_id);
          this.isChaseAccountPending = true;
        }
      }
      else if(el.is_virtual_account === 0 && el.verified_by === 88 && el.mark_as_verified === 0){
        if (!virtualAccountIds.includes(el.bank_accounts_id)) {
          virtualAccountIds.push(el.bank_accounts_id);
        }
      }
      });
    if (virtualAccountIds.length > 0) {
      let notification;
      if(this.isChaseAccountPending){
        notification = this.alertService.infoAlert({
          content: "Since you added your Bank account using instant verification, we received a virtual account number. This works for ACH and wire transfers, but won’t work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.",
          doneMsg: 'Update',
          isCancel: true
        });
      }
      else{
        notification = this.alertService.failedAlert({
          content: "Your Bank account verification was rejected. You won’t be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.",
          doneMsg: 'Update',
          isCancel: true
        });
      }
      notification.afterClosed().subscribe((res) => {
        this.isChaseAccountPending = false;
        if (res) {
          const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
            maxWidth: '1200px',
            width: '100%',
            disableClose: true,
            data: { bankAccountIds: virtualAccountIds }
          });
          confirmationDialog.afterClosed().subscribe((res) => {
            if (res && res.success) {
              this.processMultiPrintCheck(selectedItems, type);
            }
          });
        }
      });
    } else {
      this.processMultiPrintCheck(selectedItems, type);
    }
  }

  // Print Multiple Check
  processMultiPrintCheck(
    selectedItems: ICheckListTableRowData[],
    type: string
  ): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }

    if (!selectedItems.length) {
      this.openWarningAlert('Please select checks to print.');
      return;
    }

    const warning = this.onHeaderButtonWarning(selectedItems, 'print');

    if (
      warning &&
      typeof warning === 'object' &&
      warning.errorMsg &&
      selectedItems.length === 1
    ) {
      this.openWarningAlert(
        `This check cannot be printed. ${warning.errorMsg}`
      );
      return;
    }

    if (
      warning &&
      typeof warning === 'object' &&
      warning.errorMsg &&
      selectedItems.length > 1
    ) {
      this.openWarningAlert(
        `Please note that some of the checks cannot be printed. The affected check numbers are ${warning.checkNums}. ${warning.errorMsg}`
      );
      return;
    }

    if (
      this.checkApprovedForMail === 1 ||
      this.localStorageService.getItem('printMailAdsShowed') === '1'
    ) {
      this.onPrintMultiAction(selectedItems, type);
      return;
    }

    const adAlert = this.openPrintCheckAdsModal();
    this.localStorageService.setItem('printMailAdsShowed', '1');
    adAlert.afterClosed().subscribe((res) => {
      if (res === 'mail') {
        this.onMultiMail(selectedItems);
      } else {
        this.onPrintMultiAction(selectedItems, type);
      }
    });
  }

  Rejectcheckprint(error: HttpErrorResponse) {
    this.openWarningAlert(
      `Rejected Checks are not allowed to print. <br> Check Numbers - ${error.error.errorMsg.checkSerialNumber}`
    );
  }

  Onclickcheck(error: HttpErrorResponse,isSingleCheck = false) {
    this.openWarningAlert(
      isSingleCheck ? 
      `This check cannot be printed. Administrator approval is required before proceeding.`
      : `These checks cannot be printed. Administrator approval is required before proceeding. <br> Check Numbers - ${error.error.errorMsg.checkSerialNumber}`
    );
  }

  DdAchcheck(error: HttpErrorResponse) {
    this.openWarningAlert(
      `Some checks are not eligible for printing. <br> Check Number - ${error.error.errorMsg.checkSerialNumber}`
    );
  }

  DdAchchecksingle() {
    this.openWarningAlert('The check is not eligible for printing');
  }

  ApprovalCheck(error: HttpErrorResponse, type: string) {
    this.openWarningAlert(
      `Please note that some of the checks cannot be ${type}. The affected check numbers are ${error.error.errorMsg.chimeSerialNumber}.` +
        `Currently, the Neo-bank account is only set up for ACH/Direct Deposit.`
    );
  }

  singleCheck(error: HttpErrorResponse, type: string) {
    this.openWarningAlert(
      `This check cannot be ${type}.Currently, the Neo-bank account is only set up for ACH/Direct Deposit.`
    );
  }

  onPrintMultiAction(
    selectedItems: ICheckListTableRowData[],
    type: string
  ): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }
    const checkAmount = selectedItems[0].cheque_amount;

    const itemIds: { checkId: string[]; paperType: string | number } = {
      checkId: [],
      paperType: type === 'check' ? this.selectedCheckPaperType : 6
    };
    itemIds.checkId = selectedItems.map((e) => e.action);

    this.HeaderButtonLoadingProp.isLoading = true;
    this.HeaderButtonLoadingProp.btn_id =
      type === 'check' ? 'id_printCheck' : 'id_printCheck_white';
    this.HeaderButtonLoadingProp.btn_name = 'Loading...';

    if (this.commonOnInitService.isEnterPriseCustomer('enterprise-abc-legal')) {
      this.v3BulkPaymentService.setBulkPaymentCount(0);
      this.enterpriseCheckPrinting(itemIds);
      return;
    }

    this.subscriptions.push(
      this.checkService
        .printMultiCheck(itemIds)
        .pipe(
          catchError((error) => {
            if (error.error.errorCode === "plaid_virtual_account"){
              const notification = this.alertService.infoAlert({
                content: error.error.errorMsg,
                doneMsg: 'Update',
                isCancel: true
              });
              notification.afterClosed().subscribe((res) => {
                if(res){
                  const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
                    maxWidth: '1200px',
                    width: '100%',
                    disableClose: true,
                    data: error.error
                  });
                  confirmationDialog.afterClosed().subscribe((res) => {
                    if (res.success) {
                    this.onPrintMultiAction(selectedItems, type);
                    }
                  });
                }
              });
            }
            this.errorCode = error.error.errorCode;
            this.err_msg = error.error.errorMsg;

            if (error.error.errorCode === 127) {
              this.Rejectcheckprint(error);
            }

            if (error.error.errorCode === 125) {
              this.Onclickcheck(error,!(itemIds.checkId?.length > 1));
            }

            if (error.error.errorCode === 129 && selectedItems.length > 1) {
              this.DdAchcheck(error);
            } else if (
              error.error.errorCode === 129 &&
              selectedItems.length === 1
            ) {
              this.DdAchchecksingle();
            }

            if (error.error.errorCode === 123 && selectedItems.length > 1) {
              this.ApprovalCheck(error, 'printed');
            }

            if (error.error.errorCode === 123 && selectedItems.length === 1) {
              this.singleCheck(error, 'printed');
            }

            if (
              error.error.permissionType === 'action' &&
              error.error.permissionRequired === 'check-print'
            ) {
              this.alertService.warningAlert({
                content: "You don't have permission to do this action."
              });
            }
            return of(false);
          }),
          finalize(() => {
            this.HeaderButtonLoadingProp.isLoading = false;
            this.HeaderButtonLoadingProp.btn_id = '';
          })
        )
        .subscribe((res) => {
          const response = res as IApiRes<{ url: string }>;
          if (response?.success) {
            if (selectedItems.length === 1) {
              this.scriptService.gtagEventScript('check-printed', {
                amount: checkAmount
              });
            } else {
              this.scriptService.gtagEventScript('check-printed');
            }

            const urlLoaded = window.open(response.data.url);
            this.dataTableService.setRefreshStatus(true);

            if (
              !urlLoaded ||
              urlLoaded.closed ||
              typeof urlLoaded.closed === 'undefined'
            ) {
              const dref = this.openWarningAlert(
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window',
                'Try Again'
              );
              dref.afterClosed().subscribe(() => {
                window.open(response.data.url);
              });
            }
          }
        })
    );
  }

  /**
   * @description This Function specially created for ABC Enterprise customer
   * @param {Object} selectedCheckList - The list of selected checks and paper type
   */
  enterpriseCheckPrinting(selectedCheckList: {
    checkId: string[];
    paperType: string | number;
  }) {
    this.v3BulkPaymentService.completedPaymentCount = 0;
    this.v3BulkPaymentService.abcEntCheckPrintCountSignal.set(undefined);
    const totalCount = selectedCheckList.checkId?.length;
    this.v3BulkPaymentService.isAbcEntCustomer.set(true);
    this.v3BulkPaymentService.setBulkPaymentCount(totalCount);
    this.layoutService.isProgressBarInvoked.next(false);
    let successCount = 0;
    let failCount = 0;
    this.subscriptions.push(
      from(selectedCheckList.checkId)
        .pipe(
          mergeMap((id) => {
            const payloadData = {
              checkId: [id],
              paperType: selectedCheckList.paperType
            };
            return this.checkService.printMultiCheck(payloadData).pipe(
              tap(() => {
                successCount += 1;
                this.v3BulkPaymentService.completedPaymentCount = 1;
              }),
              catchError((error) => {
                if (error.error.errorCode === "plaid_virtual_account"){
                  const notification = this.alertService.infoAlert({
                    content: error.error.errorMsg,
                    doneMsg: 'Update',
                    isCancel: true
                  });
                  notification.afterClosed().subscribe((res) => {
                    if(res){
                      const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
                        maxWidth: '1200px',
                        width: '100%',
                        disableClose: true,
                        data: error.error
                      });
                      confirmationDialog.afterClosed().subscribe((res) => {
                        if (res.success) {
                        this.enterpriseCheckPrinting(selectedCheckList);
                        }
                      });
                    }
                  });
                }
                failCount += 1;
                this.v3BulkPaymentService.completedPaymentCount = 1;
                return throwError(error);
              })
            );
          }, 5),
          finalize(() => {
            this.HeaderButtonLoadingProp.isLoading = false;
            this.HeaderButtonLoadingProp.btn_id = '';
            const pendingCount = totalCount - (successCount + failCount);
            this.v3BulkPaymentService.abcEntCheckPrintCountSignal.set({
              total: totalCount,
              success: successCount,
              fail: failCount,
              canceled: pendingCount
            });
          })
        )
        .subscribe({
          next: (res) => {
            if (res && res.data && res.data.url) {
              const iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              document.body.appendChild(iframe);
              iframe.src = res.data.url;
            }
          },
          error: (error: HttpErrorResponse) => {
            this.checkPrintError(error, selectedCheckList.checkId);
          },
          complete: () => {
            this.dataTableService.setRefreshStatus(true);
          }
        })
    );
  }

  checkPrintError(error: HttpErrorResponse, selectedItems: string[]) {
    this.errorCode = error.error.errorCode;
    this.err_msg = error.error.errorMsg;

    if (error.error.errorCode === 127) {
      this.Rejectcheckprint(error);
    }

    if (error.error.errorCode === 125) {
      this.Onclickcheck(error);
    }

    if (error.error.errorCode === 129 && selectedItems.length > 1) {
      this.DdAchcheck(error);
    } else if (error.error.errorCode === 129 && selectedItems.length === 1) {
      this.DdAchchecksingle();
    }

    if (error.error.errorCode === 123 && selectedItems.length > 1) {
      this.ApprovalCheck(error, 'printed');
    }

    if (error.error.errorCode === 123 && selectedItems.length === 1) {
      this.singleCheck(error, 'printed');
    }

    if (
      error.error.permissionType === 'action' &&
      error.error.permissionRequired === 'check-print'
    ) {
      this.alertService.warningAlert({
        content: "You don't have permission to do this action."
      });
    }
  }

  onMultiMail(selectedItems: ICheckListTableRowData[]): void {
    const virtualAccountIds: string[] = [];
    selectedItems.forEach((el) => {
      if (el.is_virtual_account === 1) {
        if (!virtualAccountIds.includes(el.bank_accounts_id)) {
          virtualAccountIds.push(el.bank_accounts_id);
          this.isChaseAccountPending = true;
        }
      }
      else if(el.is_virtual_account === 0 && el.verified_by === 88 && el.mark_as_verified === 0){
        if (!virtualAccountIds.includes(el.bank_accounts_id)) {
          virtualAccountIds.push(el.bank_accounts_id);
        }
      }
    });
    if (virtualAccountIds.length > 0) {
        let notification;
        if(this.isChaseAccountPending){
          notification = this.alertService.infoAlert({
            content: "Since you added your Bank account using instant verification, we received a virtual account number. This works for ACH and wire transfers, but won’t work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.",
            doneMsg: 'Update',
            isCancel: true
          });
        }
        else{
          notification = this.alertService.failedAlert({
            content: "Your Bank account verification was rejected. You won’t be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.",
            doneMsg: 'Update',
            isCancel: true
          });
        }
        notification.afterClosed().subscribe((res) => {
          this.isChaseAccountPending = false;
          if (res) {
            const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
            maxWidth: '1200px',
            width: '100%',
            disableClose: true,
            data: { bankAccountIds: virtualAccountIds }
          });
          confirmationDialog.afterClosed().subscribe((res) => {
            if (res && res.success) {
              this.processMultiMail(selectedItems);
            }
          });
        }
      });
    } else {
      this.processMultiMail(selectedItems);
    }
    
  }

  processMultiMail(selectedItems: ICheckListTableRowData[]): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }

    const ids: { ids: string[] } = { ids: [] };

    selectedItems.forEach((el) => {
      ids?.ids.push(el.action);
    });

    if (!selectedItems.length) {
      this.openWarningAlert('Please select at least one check to mail.', 'No Checks Selected!', 'Got it');
      return;
    }

    const warning = this.onHeaderButtonWarning(selectedItems, 'mail');

    if (
      warning &&
      typeof warning === 'object' &&
      warning.errorMsg &&
      selectedItems.length === 1
    ) {
      this.openWarningAlert(`This check cannot be mailed. ${warning.errorMsg}`);
      return;
    }
    if (
      warning &&
      typeof warning === 'object' &&
      warning.errorMsg &&
      selectedItems.length > 1
    ) {
      this.openWarningAlert(
        `Please note that some of the checks cannot be mailed. The affected check numbers are ${warning.checkNums}. ${warning.errorMsg}`
      );
    } else {
      this.HeaderButtonLoadingProp.isLoading = true;
      this.HeaderButtonLoadingProp.btn_id = 'id_mail';
      this.HeaderButtonLoadingProp.btn_name = 'Loading...';
      this.subscriptions.push(
        this.checkService
          .getChequeDetails(ids)
          .pipe(
            finalize(() => {
              this.HeaderButtonLoadingProp.isLoading = false;
              this.HeaderButtonLoadingProp.btn_id = '';
            }),
            catchError((error) => {
              this.errorCode = error.error.errorCode;
              this.err_msg = error.error.errorMsg;

              if (error.error.errorCode === 129 && selectedItems.length > 1) {
                this.openWarningAlert(
                  `Some checks are not eligible for mailing ${
                    error.error.errorMsg.checkSerialNumber === undefined
                      ? ''
                      : `<br> Check Number - ${error.error.errorMsg.checkSerialNumber}`
                  }`
                );
                return of(false);
              }
              if (error.error.errorCode === 129 && selectedItems.length === 1) {
                this.openWarningAlert('The check is not eligible for mailing');
                return of(false);
              }

              if (error.error.errorCode === 123 && selectedItems.length > 1) {
                this.ApprovalCheck(error, 'Mailed');
                return of(false);
              }
              if (error.error.errorCode === 123 && selectedItems.length === 1) {
                this.singleCheck(error, 'Mailed');
                return of(false);
              }

              if (this.errorCode === 2) {
                this.checkdata.errorMsg = this.err_msg;
                selectedItems.forEach((el) => {
                  this.checkNo = el.cheque_serial_number;
                  if (this.checkNo === this.checkdata.errorMsg) {
                    this.bankAccountId = el.bank_accounts_id;
                  } else {
                    const checkNumbers = this.checkdata.errorMsg.split(',');
                    checkNumbers.forEach((e: string) => {
                      if (this.checkNo === e) {
                        this.bankAccountId = el.bank_accounts_id;
                      }
                    });
                  }
                });

                this.dialog.open(VerifySignatureModalComponent, {
                  maxWidth: '440px',
                  width: '100%',
                  minHeight: '200px',
                  disableClose: true,
                  data: {
                    ids,
                    data: this.checkdata,
                    bankAccountId: this.bankAccountId
                  }
                });
                return of(false);
              }
              if (this.errorCode === 106) {
                const warningAlert = this.alertService.warningAlert({
                  content: this.err_msg,
                  doneMsg: 'Verify',
                  isCancel: true
                });
                warningAlert.afterClosed().subscribe((response) => {
                  if (response) {
                    this.router.navigate([
                      '/manage/users/verify-email-phone'
                    ]);
                  }
                });
              }

              this.openWarningAlert(error.error.errorMsg);
              return of(false);
            })
          )
          .subscribe((res) => {
            const responseData = res as IApiRes<IChequedata>;
            if (responseData.success) {
              this.checkdata.chequedata = responseData.data;
              this.checkDetails = responseData.data.datas;
              this.checkAmount = Number(
                responseData.data.datas[0].cheque_amount
              );
              if (this.checkdata.chequedata) {
                this.ShippingCalculation();
              }
            }
          })
      );
    }
  }

  ShippingCalculation(): void {
    this.caldata.mail_check_ids = [];

    for (let i = 0; i < (this.checkDetails as IMailCheck[]).length; i += 1) {
      const singleCheckDetails = this.checkDetails[i] as IMailCheck;
      const ids2 = singleCheckDetails.enc_id;

      this.caldata.mail_check_ids.push(singleCheckDetails.enc_id);

      if (singleCheckDetails.payee_country === 'Canada') {
        // mail shipping id of canada in staging
        if (this.rooturl === 'https://staging.sebipay.com/api/v4') {
          this.caldata[ids2] = this.getobject(
            singleCheckDetails.payee_email as string,
            singleCheckDetails.payee_email as string,
            21
          );
        } else {
          // mail shipping id of canada in live
          this.caldata[ids2] = this.getobject(
            singleCheckDetails.payee_email as string,
            singleCheckDetails.payee_email as string,
            this.getSelectedShippingType(singleCheckDetails.payee_country)
          );
        }
      } else {
        this.idlist.mail_type = 1;
        this.caldata[ids2] = this.getobject(
          singleCheckDetails.payee_email as string,
          singleCheckDetails.payee_email as string,
          this.getSelectedShippingType(singleCheckDetails.payee_country??null)
        );
      }
    }

    this.caldata.mail_check_ids = [...new Set(this.caldata.mail_check_ids)];

    this.subscriptions.push(
      this.checkService
        .ShippingCostCalculationGroup(this.caldata)
        .subscribe((res) => {
          if (res) {
            this.ShippingCostRes = res.data;
            this.openModal();
          }
        })
    );
  }

  sortedoption(value: string) {
    const USA = ['united states', 'us', 'usa'];
    const ca = ['canada', 'ca'];

    const country = value?.toLowerCase();
    let selectCountry;

    if (USA.includes(country)) {
      selectCountry = 'United States';
    } else if (ca.includes(country)) {
      selectCountry = 'Canada';
    } else {
      selectCountry = value;
    }

    if (selectCountry === 'Canada') {
      return (
        this.checkdata.shipping?.filter(
          (type: IShippingType) => type.country === value
        ) || []
      );
    }
    if (selectCountry === 'United States') {
      return (
        this.checkdata.shipping?.filter(
          (type: IShippingType) =>
            type.country !== 'Canada' && type.country !== 'International'
        ) || []
      );
    }

    return (
      this.checkdata.shipping?.filter(
        (type: IShippingType) => type.country === 'International'
      ) || []
    );
  }

  getSelectedShippingType(country: string | null): number | null {
    if(!country){
      return null;
    }

    const shippingTypes = this.sortedoption(country);
    const defaultMailingType = shippingTypes.find(type => type.is_default_mailing_type);
  
    if (defaultMailingType) {
      return defaultMailingType.id;
    }
    return null;
  }

  getobject(payee_email: string, payee_phone: string, mail_type: number | null) {
    return {
      mail_type,
      check_paper: 7,
      informed_payee_sms: 0,
      informed_payee_email: 0,
      payee_phone,
      payee_email,
      file_hidden: []
    };
  }

  openModal(): void {
    if (this.checkdata && this.ShippingCostRes && this.caldata) {
      const dialog = this.dialog.open(CheckMailModalComponent, {
        maxWidth: '1200px',
        width: '100%',
        minHeight: '380px',
        disableClose: true,
        data: {
          data: this.checkdata,
          ShippingCost: this.ShippingCostRes,
          caldata: this.caldata
        }
      });
      dialog.afterClosed().subscribe(() => {
        this.shippingType();
      });
    }
  }

  // For Check Mail
  shippingType(): void {
    this.subscriptions.push(
      this.checkService.getShippingType().subscribe((res) => {
        this.checkdata = { ...this.checkdata, shipping: res.data };
      })
    );
  }

  paperType(): void {
    this.subscriptions.push(
      this.checkService.getpaperType().subscribe((res) => {
        this.checkdata = { ...this.checkdata, paper: res.data };
      })
    );
  }
  // ------------

  onMultiEmail(selectedItems: ICheckListTableRowData[]): void {
    const virtualAccountIds: string[] = [];
    selectedItems.forEach((el) => {
      if (el.is_virtual_account === 1) {
        if (!virtualAccountIds.includes(el.bank_accounts_id)) {
          virtualAccountIds.push(el.bank_accounts_id);
          this.isChaseAccountPending = true;
        }
      }
      else if(el.is_virtual_account === 0 && el.verified_by === 88 && el.mark_as_verified === 0){
        if (!virtualAccountIds.includes(el.bank_accounts_id)) {
          virtualAccountIds.push(el.bank_accounts_id);
        }
      }
    });
    if (virtualAccountIds.length > 0) {
      let notification;
      if(this.isChaseAccountPending){
        notification = this.alertService.infoAlert({
          content: "Since you added your Bank account using instant verification, we received a virtual account number. This works for ACH and wire transfers, but won’t work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.",
          doneMsg: 'Update',
          isCancel: true
        });
      }
      else{
        notification = this.alertService.failedAlert({
          content: "Your Bank account verification was rejected. You won’t be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.",
          doneMsg: 'Update',
          isCancel: true
        });
      }
      notification.afterClosed().subscribe((res) => {
        this.isChaseAccountPending = false;
        if (res) {
          const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
            maxWidth: '1200px',
            width: '100%',
            disableClose: true,
            data: { bankAccountIds: virtualAccountIds }
          });
          confirmationDialog.afterClosed().subscribe((res) => {
            if (res && res.success) {
              this.processMultiEmail(selectedItems);
            }
          });
        }
      });
    } else {
      this.processMultiEmail(selectedItems);
    }
  }

  processMultiEmail(selectedItems: ICheckListTableRowData[]): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }

    if (!selectedItems.length) {
      this.openWarningAlert('Please select checks to email.', 'Error', 'Got It');
      return;
    }
    const warning = this.onHeaderButtonWarning(selectedItems, 'email');
    if (
      warning &&
      typeof warning === 'object' &&
      warning.errorMsg &&
      selectedItems.length === 1
    ) {
      this.openWarningAlert(
        `This check cannot be emailed. ${warning.errorMsg}`
      );
      return;
    }
    if (warning && typeof warning === 'object' && selectedItems.length > 1) {
      this.openWarningAlert(
        `Please note that some of the checks cannot be emailed. The affected check numbers are ${warning.checkNums}. ${warning.errorMsg}`
      );
    } else {
      this.HeaderButtonLoadingProp.isLoading = true;
      this.HeaderButtonLoadingProp.btn_id = 'id_email';
      this.HeaderButtonLoadingProp.btn_name = 'Loading...';

      const ids: string[] = selectedItems.map((e) => e.action);
      this.subscriptions.push(
        this.checkService
          .getEmails({ ids })
          .pipe(
            finalize(() => {
              this.HeaderButtonLoadingProp.isLoading = false;
              this.HeaderButtonLoadingProp.btn_id = '';
            }),
            catchError((error) => {
              if (error.error.errorCode === 123 && selectedItems.length > 1) {
                this.ApprovalCheck(error, 'E-mailed');
                return of(false);
              }
              if (error.error.errorCode === 123 && selectedItems.length === 1) {
                this.singleCheck(error, 'E-mailed');
                return of(false);
              }

              if (error.error.errorCode === 129 && selectedItems.length > 1) {
                this.openWarningAlert(
                  `Some checks are not eligible for E-mail <br> Check Number - ${error.error.errorMsg.checkSerialNumber}`
                );
              } else if (
                error.error.errorCode === 129 &&
                selectedItems.length === 1
              ) {
                this.openWarningAlert('The check is not eligible for E-mail');
              }
              return of(false);
            })
          )
          .subscribe((data) => {
            if (data?.success) {
              this.openEmailModal(data.data);
            }
          })
      );
    }
  }

  openEmailModal(emailRows: ICheckEmailData) {
    const dialogRef = this.dialog.open(CheckEmailModalComponent, {
      maxWidth: '93%',
      width: '1210px',
      disableClose: true,
      data: {
        serverData: emailRows
      },
      panelClass: 'modal-overflow-visible'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) this.dataTableService.setRefreshStatus(true);
    });
  }

  openDirectDepositModal(selectedItems: ICheckListTableRowData[]): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }

    if (!selectedItems.length) {
      this.openWarningAlert('Please select checks to process ACH.', 'Error', 'Got It');
      return;
    }

    const dialogRef = this.dialog.open(DirectDepositComponent, {
      width: '75%',
      data: selectedItems,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.success) {
        this.dataTableService.setRefreshStatus(true);
        this.openSuccessAlert('Successfully done.');
      }
    });
  }

  noBankAccountAlert() {
    this.alertService.infoAlert({
      content: 'The bank account is not enabled for international payment'
    });
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
        this.router.navigate(['manage/bankaccount/index']);
      }
    });
  }

  onDeleteMultipleChecks(selectedItems: ICheckListTableRowData[]): void {
    if (!selectedItems.length) {
      this.openWarningAlert('Please select checks to delete.', 'Error', 'Got it');
      return;
    }

    const warning = this.onHeaderButtonWarning(selectedItems, 'delete');

    if (warning && typeof warning === 'boolean') {
      this.openFailedAlert(
        selectedItems.length === 1
          ? "Selected check can't be deleted."
          : "Some of the checks can't be deleted."
      );
      return;
    }

    if (warning && typeof warning === 'object' && warning.errorMsg) {
      this.openFailedAlert(
        `Some of the checks can't be deleted. Check Numbers - ${warning.checkNums}. ${warning.errorMsg}`
      );
      return;
    }

    const ids = selectedItems.map((e) => e.action);
    const alert = this.openConfirmAlert(
      `Are you sure you want to delete ${
        selectedItems.length === 1 ? 'this' : 'these'
      } ${selectedItems.length === 1 ? 'check' : 'checks'}?`
    );
    alert.afterClosed().subscribe((result) => {
      if (result) this.deleteMultiCheckAction({ ids });
    });
  }

  deleteMultiCheckAction(itemIds: { ids: string[] }): void {
    this.subscriptions.push(
      this.checkService.deleteMulitpleCheck(itemIds).subscribe(
        (res) => {
          if (res?.success) {
            this.getCheckListData();
            this.dataTableService.setRefreshStatus(true);
            this.openSuccessAlert('Checks deleted.');
          }
        },
        (err: HttpErrorResponse) => {
          this.openWarningAlert(err?.error?.errorMsg);
        }
      )
    );
  }

  // Void Check
  onVoidMultipleCheck(selectedItems: ICheckListTableRowData[]): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }

    if (!selectedItems.length) {
      this.openWarningAlert('Please select checks to void.', 'Error', 'Got it');
      return;
    }

    const warning = this.onHeaderButtonWarning(selectedItems, 'void');

    if (warning && typeof warning === 'boolean') {
      this.openFailedAlert(
        selectedItems.length === 1
          ? "Selected check can't be voided."
          : "Some of the checks can't be voided."
      );
      return;
    }

    if (warning && typeof warning === 'object' && warning.errorMsg) {
      this.openFailedAlert(
        `Some of the checks can't be voided. Check Numbers - ${warning.checkNums}. ${warning.errorMsg}`
      );
      return;
    }

    const ids = selectedItems.map((e) => e.action);
    selectedItems.forEach((e) => {
      this.chequeStatus = e.cheque_status;
    });
    const hasMailedCheck = selectedItems.some((e) => e.cheque_status === 7 || e.cheque_status === 505);
    let msg = '';

    if (this.chequeStatus === 504) {
      msg = `The receiver tried to print ${
        selectedItems.length === 1 ? 'this' : 'these'
      } ${
        selectedItems.length === 1 ? 'check' : 'checks'
      }.It might have been printed and marked as not printed. Are you sure you want to void this ${
        selectedItems.length === 1 ? 'check' : 'checks'
      }?`;
    } else if (hasMailedCheck) {
      msg = `This check is voided only within this platform. It may still be delivered to the payee and could still be presented to the bank. Are you sure you want to void ${
        selectedItems.length === 1 ? 'this check' : 'these checks'
      }?`;
    } else {
      msg = `Are you sure you want to void ${
        selectedItems.length === 1 ? 'this' : 'these'
      } ${selectedItems.length === 1 ? 'check' : 'checks'}?`;
    }

    const alertData = {
      content: msg
    };
    const alert = this.openConfirmAlert(alertData.content);
    alert.afterClosed().subscribe((result) => {
      if (result) this.voidMultiCheckAction(ids);
    });
  }

  voidMultiCheckAction(ids: string[]): void {
    this.subscriptions.push(
      this.checkService.voidmultipleCheck({ ids }).subscribe((res) => {
        if (res?.success) {
          if(this.isIndiaBazaarEnabled){
            this.getTotalCheckSum();
          }
          this.dataTableService.setRefreshStatus(true);
          this.openSuccessAlert('Checks voided.');
        }
      })
    );
  }

  // Mark As Cleared
  onMarkAsClearedCheck(selectedItems: ICheckListTableRowData[]): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }

    const ids = selectedItems.map((e) => e.action);

    if (!selectedItems.length) {
      this.openWarningAlert('Please select at least one check to proceed', 'Error', 'Got it');
      return;
    }

    const alert = this.openConfirmAlert(
      `Are you sure you want to mark ${
        selectedItems.length === 1 ? 'this' : 'these'
      }  ${selectedItems.length === 1 ? 'check' : 'checks'} as posted?`
    );
    alert.afterClosed().subscribe((result) => {
      if (result) this.markAsClearedCheckAction(ids);
    });
  }

  redirectToCheckRecurring() {
    this.router.navigate(['/manage/checkmailing/recurring']);
  }

  /**
   * The group mailing table is rendered inline in this tab instead of being routed
   * to, so the payments-out layout and the check tabs stay in place.
   */
  openGroupMailings(): void {
    this.activeCheckTab = 'id_groupMailings';
    this.isGroupMailingsActive.set(true);
  }

  /**
   * Panel tab click while the group mailing table is shown. The check table is only
   * re-created for the check tabs; Recurring still routes away as before.
   */
  onCheckTabChange(tabId: string): void {
    this.activeCheckTab = tabId;

    if (tabId === 'id_groupMailings') return;

    if (tabId === 'id_recurring') {
      this.redirectToCheckRecurring();
      return;
    }

    this.restoreCheckTable(tabId);
  }

  /**
   * Bring the check table back after the group mailing table was shown. The shared
   * `DataTableService` / `V3DataTableService` state is table-scoped, so re-register the
   * check configuration and drop the group mailing payload before rendering the grid.
   * The tab filter is pushed first: `mainFilter` is a `BehaviorSubject`, so the
   * re-created grid picks it up as soon as it subscribes.
   */
  private restoreCheckTable(tabId: string): void {
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
    this.v3DataTableService.initialSelectBoxFilter = undefined;
    this.v3DataTableService.resetV3DataTablePayload();
    // The retained payload still carries the status of the tab that was open before
    // Group Mailings; drop it so the re-created status filter shows the new tab.
    const retainedFilterModel = (
      this.dataTableService.dataTablePayload as
        | { filterModel?: Record<string, unknown> }
        | undefined
    )?.filterModel;
    if (retainedFilterModel) {
      delete retainedFilterModel['cheques.cheque_status'];
    }
    this.onHeaderBtn({ id: tabId });
    this.isGroupMailingsActive.set(false);
  }

  markAsClearedCheckAction(ids: string[]): void {
    this.subscriptions.push(
      this.checkService.markAsClearedCheck({ ids }).subscribe((res) => {
        if (res?.success) {
          this.dataTableService.setRefreshStatus(true);
          this.openSuccessAlert('Marked as cleared.');
        }
      })
    );
  }

  isIncludedUnMappedChecks(): boolean {
    return this.selectedRow.some(
      (item) => item.bank_account_account_name === null && item.bank_account_nick_name === null
    );
  }
  

  // Process Multiple Check
  onProcessMultipleCheck() {
    if (!this.userVerified) {
      this.goToVerify();
    } else {
      if(this.isIncludedUnMappedChecks()){
        this.alertService.warningAlert({
          title:'Error',
          content:'Please map the bank account for further processing.',
          doneMsg:'Ok',
        });
        return;
      }
      this.disabled = true;
      this.subscriptions.push(
        this.checkService
          .getCheckListData()
          .pipe(
            catchError((err) => {
              this.disabled = false;
              return of(err);
            })
          )
          .subscribe((res) => {
            if (res.data.isApprovedForProcessNow === 1) {
              const ids: string[] = [];
              this.selectedRow.forEach((val) => {
                ids.push(val.action);
              });
              if (this.selectedRow.length === 0) {
                const content = 'Please select at least one check to proceed.';
                this.openWarningAlert(content, 'Error', 'Got it');
                this.disabled = false;
                return;
              }

              const process = this.dialog.open(CheckProcessModalComponent, {
                maxWidth: '1010px',
                width: '90%',
                disableClose: true,
                data: {
                  data: ids,
                  RowData: this.selectedRow,
                  status: this.cellRendererCheckStatus
                }
              });
              process.afterClosed().subscribe(() => {
                this.disabled = false;
              });
            } else {
              this.disabled = false;
              this.router.navigate(['/manage/cheque/get-restricted-data']);
            }
          })
      );
    }
  }

  // Header Button Warning Alert
  onHeaderButtonWarning(
    selectedItems: ICheckListTableRowData[],
    action: string
  ) {
    const checkStatus = selectedItems?.map(
      (e) => this.cellRendererCheckStatus[e.cheque_status]
    );

    const fromZilBank: string[] = [];
    const fromWallet: string[] = [];
    selectedItems.forEach((e) => {
      if (
        e.bank_account_nature_type === 2 &&
        ['print', 'email', 'mail'].includes(action)
      ) {
        fromZilBank.push(e.cheque_serial_number);
      } else if (
        e.create_check_from === 1 &&
        ['print', 'email', 'delete', 'void'].includes(action)
      ) {
        fromWallet.push(e.cheque_serial_number);
      }
    });

    const errorMsg = fromZilBank.length
      ? `Currently, the Zil account is only set up for ACH/Direct Deposit.`
      : 'For wallet checks';
    const checkNums = fromZilBank.length ? fromZilBank : fromWallet;

    // eslint-disable-next-line no-restricted-syntax
    for (const status of checkStatus) {
      switch (action) {
        case 'print':
          if (checkNums.length) {
            return { errorMsg, checkNums };
          }
          if (status.isItPrintAble === 0) return true;
          break;

        case 'void':
          if (checkNums.length) {
            return { errorMsg, checkNums };
          }
          if (status.isItVoidAble === 0) return true;
          break;

        case 'delete':
          if (checkNums.length) {
            return { errorMsg, checkNums };
          }
          if (status.isItDeleteAble === 0) return true;
          break;

        case 'approveReject':
          if (status.statusValue !== 35) return true;
          break;

        case 'email':
          if (checkNums.length) {
            return { errorMsg, checkNums };
          }
          break;

        case 'mail':
          if (checkNums.length) {
            return { errorMsg, checkNums };
          }
          break;
        default:
          break;
      }
    }
    return null;
  }

  //= =======>Action Button Click

  onApproveCheck(
    selectedItem: ICheckListTableRowData[] | ICheckListTableRowData,
    isMulti: boolean
  ): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }
    const multipleCheck = selectedItem as ICheckListTableRowData[];
    if (!multipleCheck.length && isMulti) {
      const content = 'Please select at least one check to proceed.';
      this.openWarningAlert(content, 'Error', 'Got it');
      return;
    }

    if (isMulti) {
      if (
        this.onHeaderButtonWarning(
          selectedItem as ICheckListTableRowData[],
          'approveReject'
        )
      ) {
        this.openFailedAlert(
          multipleCheck.length === 1
            ? "Selected check can't be approved."
            : "Some of the checks can't be approved."
        );
        return;
      }
    }

    let ids: string[] = [];
    if (isMulti) {
      ids = multipleCheck?.map((e) => e.action);
    } else {
      ids.push((selectedItem as ICheckListTableRowData)?.id);
    }

    const alert = this.openConfirmAlert(
      'Are you sure you want to approve this check?'
    );
    alert.afterClosed().subscribe((result) => {
      if (result) {
        // Set loading state for Accept button AFTER confirmation
        this.setHeaderButtonLoading(true,'id_approve');
        
        this.subscriptions.push(
          this.checkService.approveCheck({ ids })
            .pipe(
              finalize(() => {
                // Reset loading state
                this.setHeaderButtonLoading(false,'id_approve');
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  this.getCheckListData();
                  this.dataTableService.setRefreshStatus(true);
                  this.openSuccessAlert('Check approved successfully');
                }
              },
              error: (err) => {
                this.paymentService.handleApprovalPolicyRestriction(err);
              }
            })
        );
      }
    });
  }

  onRejectCheck(
    selectedItems: ICheckListTableRowData[] | ICheckListTableRowData,
    isMulti: boolean
  ): void {
    if (!this.unmapedChecks(this.selectedRow)) {
      return;
    }
    const multipleCheck = selectedItems as ICheckListTableRowData[];

    if (!multipleCheck.length && isMulti) {
      const content = 'Please select at least one check to proceed.';
      this.openWarningAlert(content, 'Error', 'Got it');
      return;
    }

    if (isMulti) {
      if (this.onHeaderButtonWarning(multipleCheck, 'approveReject')) {
        this.openFailedAlert(
          multipleCheck.length === 1
            ? "Selected check can't be rejected."
            : "Some of the checks can't be rejected."
        );
        return;
      }
    }

    let ids: string[] = [];
    if (isMulti) {
      ids = multipleCheck?.map((e) => e.action);
    } else {
      ids.push((selectedItems as ICheckListTableRowData)?.id);
    }

    const alert = this.openConfirmAlert(
      `Are you sure you want to reject ${
        multipleCheck.length === 1 ? 'this' : 'these'
      } ${multipleCheck.length === 1 ? 'check' : 'checks'}?`
    );
    alert.afterClosed().subscribe((result) => {
      if (result) {
        // Set loading state for Reject button only after user confirms
        this.setHeaderButtonLoading(true,'id_reject');
        
        this.subscriptions.push(
          this.checkService.rejectCheck({ ids })
            .pipe(
              finalize(() => {
                // Reset loading state
                this.setHeaderButtonLoading(false,'id_reject');
              })
            )
            .subscribe({
              next: (res) => {
                if (res.success) {
                  this.getCheckListData();
                  this.dataTableService.setRefreshStatus(true);
                  this.openSuccessAlert('Check rejected successfully');
                }
              },
              error: (err) => {
                this.paymentService.handleApprovalPolicyRestriction(err);
              }
            })
        );
      }
    });
  }

  onPrintSingleCheck(selectedItem: ICheckListTableRowData): void {
    const warning = this.onHeaderButtonWarning([selectedItem], 'print');
    if (warning && typeof warning === 'object' && warning.errorMsg) {
      this.openWarningAlert(
        `This check cannot be printed. ${warning.errorMsg}`
      );
      return;
    }

    if (
      this.checkApprovedForMail === 1 ||
      this.localStorageService.getItem('printMailAdsShowed') === '1'
    ) {
      this.onPrintSingleAction(selectedItem);
      return;
    }

    const adAlert = this.openPrintCheckAdsModal();
    this.localStorageService.setItem('printMailAdsShowed', '1');
    adAlert.afterClosed().subscribe((res) => {
      if (res) {
        this.onPrintSingleAction(selectedItem);
      }
    });
  }

  onPrintSingleAction(selectedItem: ICheckListTableRowData): void {
    if (selectedItem?.is_virtual_account) {
      const notification = this.alertService.infoAlert({
        content: `Since you added your Bank account using instant verification, we received a virtual account number ending in ${selectedItem?.bank_account_account_number}. This works for ACH and wire transfers, but won’t work for printed or emailed checks. To avoid check rejection when your Receiver deposits, please confirm your original account number to use with checks.`,
        doneMsg: 'Update',
        isCancel: true
      });
      notification.afterClosed().subscribe((res) => {
        if (res) {
          const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
            maxWidth: '1200px',
            width: '100%',
            disableClose: true,
            data: { bankAccountIds: [selectedItem?.bank_accounts_id] }
          });
          
          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.processPrintSingleAction(selectedItem);
            }
          });
        }
      });
    }
    else if(selectedItem?.is_virtual_account === 0 && selectedItem?.verified_by === 88 && selectedItem?.mark_as_verified === 0){
      const notification = this.alertService.failedAlert({
        content: "Your Bank account verification was rejected. You won’t be able to process checks with this account. If you would like to confirm the account number again, please do so and upload your most recent bank statement.",
        doneMsg: 'Update',
        isCancel: true
      });
      notification.afterClosed().subscribe((res) => { 
        if(res){
          const confirmationDialog = this.dialog.open(VirtualAccountConfirmationModalComponent, {
            maxWidth: '1200px',
            width: '100%',
            disableClose: true,
            data: { bankAccountIds: [selectedItem?.bank_accounts_id] }
          });

          confirmationDialog.afterClosed().subscribe((result) => {
            if (result && result.success) {
              this.processPrintSingleAction(selectedItem);
            }
          });
        }
      });
    }
    else{
      this.processPrintSingleAction(selectedItem);
    }
  }

  processPrintSingleAction(selectedItem: ICheckListTableRowData): void {
    const checkAmount = selectedItem.cheque_amount;
    this.subscriptions.push(
      this.checkService
        .printSingleCheck(selectedItem?.id)
        .pipe(
          catchError((error) => {
            if (
              !error.error.errorCode &&
              error.error.errorMsg ===
                'Sorry,You are not authorized to this resource'
            ) {
              this.openWarningAlert('This check cannot be printed. Administrator approval is required before proceeding.');
            }

            if (error.error.errorCode === 127) {
              this.Rejectcheckprint(error);
            }

            if (error.error.errorCode === 125) {
              this.Onclickcheck(error,true);
            }

            if (error.error.errorCode === 129) {
              this.DdAchchecksingle();
            }

            if (error.error.errorCode === 123) {
              this.singleCheck(error, 'printed');
            }
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.scriptService.gtagEventScript('check-printed', {
              amount: checkAmount
            });
            const urlLoaded = window.open(res.data.url);
            this.dataTableService.setRefreshStatus(true);
            if (
              !urlLoaded ||
              urlLoaded.closed ||
              typeof urlLoaded.closed === 'undefined'
            ) {
              const dref = this.openWarningAlert(
                'A popup blocker may be preventing the application from opening the page. Try disabling it to open the window',
                'Try Again'
              );
              dref.afterClosed().subscribe(() => {
                window.open(res.data.url);
              });
            }
          }
        })
    );
  }

  // Single Edit
  onEditCheck(selectedItem: ICheckListTableRowData): void {
    const checkId = selectedItem?.id;

    this.router.navigate(['/manage/cheque/create'], {
      queryParams: { id: checkId }
    });
  }

  // Single Delete
  onSingleDelete(selectedItem: ICheckListTableRowData): void {
    const selectedId = selectedItem.action;
    const alert = this.openConfirmAlert(
      'Are you sure you want to delete this check?'
    );
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.checkService.deleteCheck(selectedId).subscribe((res) => {
            if (res.success === true) {
              this.getCheckListData();
              this.dataTableService.setRefreshStatus(true);
              this.openSuccessAlert('Check deleted.');
            }
          })
        );
      }
    });
  }

  // Single Void
  onVoidSingleCheck(selectedItem: ICheckListTableRowData): void {
    const selectedId: string = selectedItem.action;
    let msg = '';

    if (selectedItem.cheque_status === 504) {
      msg =
        'The receiver tried to print this check.It might have been printed and marked as not printed. Are you sure you want to void this check?';
    } else if (selectedItem.cheque_status === 7 || selectedItem.cheque_status === 505) {
      msg =
        'This check is voided only within this platform. It may still be delivered to the payee and could still be presented to the bank. Are you sure you want to void this check?';
    } else {
      msg = 'Are you sure you want to void this check?';
    }

    if (selectedItem.cheque_status === 35) {
      return;
    }

    const alertData = {
      content: msg
    };
    const alert = this.openConfirmAlert(alertData.content);
    alert.afterClosed().subscribe((result) => {
      if (result) {
        this.subscriptions.push(
          this.checkService.voidCheck(selectedId).subscribe({
            next: (res) => {
              if (res.success === true) {
                this.dataTableService.setRefreshStatus(true);
                this.openSuccessAlert('Check voided.');
              }
            },
            error: (err) => {
            }
          })
        );
      }
    });
  }

  // Clone Check
  onCloneCheck(selectedItem: ICheckListTableRowData): void {
    const checkId = selectedItem?.id;
    this.router.navigate(['/manage/cheque/create'], {
      queryParams: { clone: 'Yes', id: checkId }
    });
  }

  // Re email check
  reEmailCheck(checkId: string) {
    this.subscriptions.push(
      this.checkService.reEmailCheck(checkId).subscribe((data) => {
        if (data?.success) {
          this.alertService.successAlert({
            content: 'Emailed',
            close: true,
            timeout: 1500
          });
        }
      })
    );
  }

  // forcefully printed
  forcefullyPrinted(selectedItem: ICheckListTableRowData): void {
    const selectedId = selectedItem.action;
    const alert = this.openConfirmAlert('You want to set mark as printed?');
    alert.afterClosed().subscribe((result) => {
      if (result) {
        const data = {
          checkId: selectedId
        };
        this.subscriptions.push(
          this.checkService.forcePrinted(data).subscribe((res) => {
            if (res.success === true) {
              this.dataTableService.setRefreshStatus(true);
              this.openSuccessAlert('Successfully marked as printed');
            }
          })
        );
      }
    });
  }

  onPayeeSummary(selectedItem: ICheckListTableRowData): void {
    const payeeId = selectedItem.payee_id;
    const type = 1;
    this.router.navigate([
      `manage/payee/transaction-history/${payeeId}/${type}`
    ]);
  }

  unmapedChecks(selectedItems: ICheckListTableRowData[]): boolean {
    let unmaped = true;

    selectedItems.forEach((e) => {
      if (
        ((e.bank_specialization_id === null ||
          e.bank_specialization_id === 0 ||
          e.bank_specialization_id === '') &&
          Number(e.qb_transaction_id) > 1) ||
        (e.third_party === 1 &&
          (e.bank_specialization_id === 0 ||
            e.bank_specialization_id === null ||
            e.bank_specialization_id === ''))
      ) {
        unmaped = false;
      }
    });
    if (!unmaped) {
      if (this.selectedRow.length === 1) {
        const data = {
          title: 'Error',
          content: `Please map the bank account to process the check.`,
          doneMsg: 'Map now',
          cancelMsg: 'Cancel',
          isCancel: true
        };
        const warn = this.alertService.warningAlert(data);
        warn.afterClosed().subscribe((r) => {
          if (r) {
            this.router.navigate(['/manage/cheque/create/'], {
              queryParams: { id: this.selectedRow[0].id },
              fragment: 'thirdparty=1'
            });
          }
        });
      } else {
        this.openWarningAlert(
          'Bank account of some checks are not mapped. Please map the bank account for further processing.'
        );
      }
      return false;
    }
    return true;
  }

  openAddCommandModal(id: string): void {
    const dialogRef = this.dialog.open(CheckAddCommentModalComponent, {
      maxWidth: '700px',
      width: '93%',
      data: { id }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res.isRefresh) this.dataTableService.setRefreshStatus(true);
    });
  }

  openAddAttachmentModal(id: string): void {
    const dialogRef = this.dialog.open(CheckAddAttachmentCommonModalComponent, {
      maxWidth: '700px',
      width: '93%',
      disableClose: true,
      data: {
        id,
        type: 'checks'
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.isRefresh) {
        this.dataTableService.setRefreshStatus(true);
      }
    });
  }

  /**
   * @description Donwoload proof of payment
   *
   * @returns redirect to the pdf web page
   */
  downloadProofOfPayment(rowdData: ICheckListTableRowData) {
    const headerOptions = new HttpHeaders({
      'Content-Type': 'application/json',
      isDisable422: 'true'
    });
    this.subscriptions.push(
      this.checkService.getChecksById(rowdData.id, headerOptions).subscribe({
        next: (res) => {
          if (res?.success) {
            if (res.data) {
              if (res.data?.status && res.data?.status === 7) {
                this.subscriptions.push(
                  this.v3PaymentsTableService
                    .getProofOfPaymentForMailed(res.data.uuid)
                    .subscribe((apiRes) => {
                      if (apiRes) {
                        window.open(apiRes.data, '_blank');
                      }
                    })
                );
                return;
              }

              this.subscriptions.push(
                this.v3PaymentsTableService
                  .getProofOfPayment(res.data.uuid)
                  .subscribe((apiRes) => {
                    if (apiRes) {
                      window.open(apiRes.data, '_blank');
                    }
                  })
              );
            }
          }
        }
      })
    );
  }

  /**
   * @description Handle payment using credit card.
   * Navigate card ach payment method page.
   */
  payByCreditCard(rowdData: ICheckListTableRowData): void {
    const eligibleCheckStatus = [0, 1, 11, 440, 441, 502, 507, 807];
    if (!eligibleCheckStatus.includes(rowdData?.cheque_status)) {
      this.alertService.failedAlert({
        content: 'This action cannot be performed for this transaction.'
      });
      return;
    }
    const selectedPayee = {
      encryptedId: rowdData?.payee_id,
      name: rowdData.payee_name
    };
    const sendData = {
      amount: rowdData.cheque_amount,
      memo: rowdData.cheque_memo,
      invoiceNumber: rowdData.cheque_invoice_number,
      payee: selectedPayee
    };
    this.paymentService.initiatePaymentForm = sendData;
    this.router.navigate(['/manage/payments/main/pay/card/ach'], {
      state: { backUrl: this.router.url }
    });
  }

  openImport(): void {
    const dialogRef = this.dialog.open(ThirdpartyImportMainModalComponent, {
      maxWidth: '700px',
      disableClose: true,
      width: '93%',
      data: {
        type: 'checks'
      }
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res?.success === true) {
        this.dataTableService.setRefreshStatus(true);
        this.checkImported = true;
      }
    });
  }

  openPrintCheckAdsModal() {
    return this.dialog.open(CheckPrintAdModalComponent, {
      maxWidth: '450px',
      width: '93%'
    });
  }

  openInfoAlert(content: string) {
    const data: IInfoAlert = {
      content
    };
    return this.alertService.infoAlert(data);
  }

  openFailedAlert(content: string) {
    const data: IFailedAlert = {
      content
    };
    return this.alertService.failedAlert(data);
  }

  openConfirmAlert(content: string) {
    const data: IConfirmAlert = {
      title: 'Confirm',
      content,
      cancelMsg: 'Cancel',
      doneMsg: 'OK'
    };
    return this.alertService.confirmAlert(data);
  }

  openWarningAlert(
    content: string,
    title?: string,
    doneMsg?: string
  ): MatDialogRef<WarningAlertComponent, boolean> {
    const data = {
      title: title || 'Error',
      content,
      doneMsg: doneMsg || 'OK'
    };
    return this.alertService.warningAlert(data);
  }

  openSuccessAlert(content: string): void {
    const data: ISuccessAlert = {
      title: 'Success!',
      content,
      close: true
    };
    this.alertService.successAlert(data);
  }

  querySelector(el: string) {
    return document.querySelector(el);
  }

  //= =====>For Template Responsive
  mobileHeaderRightBtn(): void {
    const actionBtn = document.getElementById('mobile-header-right-btn');
    actionBtn?.classList.toggle('mobile-head-rightshow');

    const ocwOverlay = this.querySelector(
      '.ocw-overlay-righthead'
    ) as HTMLElement;
    ocwOverlay.style.display = 'block';
  }

  ocwOverlayRightHeadClick(): void {
    const ocwOverlay = this.querySelector(
      '.ocw-overlay-righthead'
    ) as HTMLElement;
    ocwOverlay.style.display = 'none';

    const actionBtn = this.querySelector('#mobile-header-right-btn');
    actionBtn?.classList.remove('mobile-head-rightshow');

    const allShowBtn = document.getElementById('alertIconline');
    allShowBtn?.classList.remove('allalertshow');
  }

  alertClick() {
    this.dataTableService.setMainFilter('userapprovalstatus');

    this.alertDot = true;

    const allShowBtn = document.getElementById('alertIconline');
    allShowBtn?.classList.toggle('allalertshow');

    const ocwOverlay = this.querySelector(
      '.ocw-overlay-righthead'
    ) as HTMLElement;
    ocwOverlay.style.display = 'block';
  }

  gotoReconcilePage(){
    this.router.navigate(['/manage/cheque/reconciliation/step1'], {
      queryParams: { page: 'check' },
    });
  }

  // --------------------------------------------------Column Definitions----------------------------------------------------------------
  colDefId = {
    minWidth: 40,
    headerName: '#',
    sortable: false,
    checkboxSelection: true,
    field: 'id',
    suppressFloatingFilterButton: true,
    maxWidth: 40,
    floatingFilterComponent: 'headerCheckBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    headerClass: 'fixed-size-header'
  };

  colDefStatus = {
    headerName: 'Status',
    minWidth: 90,
    maxWidth: 170,
    field: 'cheques.cheque_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'addAttachmentComment',
    cellRendererParams: { showFilter: true },
    cellRendererForExport: (params: { data: { cheque_status: number } }) => {
      // Only For when Export Table data
      const value = params?.data?.cheque_status;
      return this.cellRendererCheckStatus[value]?.statusShortDescription;
    }
  };

  colDefAmount = {
    minWidth: 100,
    maxWidth: 150,
    headerName: 'Amount',
    tooltipField: 'Amount',
    field: 'cheque_amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: 'dtEditFieldComponent'
  };

  colDefVendorId = {
    minWidth: 125,
    headerName: 'Vendor Name',
    field: 'payee_nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefPayee: ColDef = {
    minWidth: 175,
    headerName: this.whiteLabelPayeeHeaderName,
    field: 'payee_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'payeeListComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'dtCellFilterComponent',
    cellRendererParams: { type: 'payee' }
  };

  colDefNickName = {
    minWidth: 120,
    headerName:
      environment.env_id === 'compass'
        ? 'Netsuite GL Account'
        : 'Custom Bank Name',
    field: 'bank_account_nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'bankAccountComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRendererForExport: (params: {
      value: unknown;
      data: ICheckListTableRowData;
    }) => {
      // Only For when Export Table data
      if (params.value === null) return params?.data?.bank_account_nick_name;
      return params?.value;
    },
    cellRenderer: 'dtCellFilterComponent',
    cellRendererParams: { type: 'bank' }
  };

  colDefBank = {
    minWidth: 120,
    headerName: 'Bank',
    field: 'bank_accounts.bank_account_account_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererForExport: (params: {
      value: unknown;
      data: ICheckListTableRowData;
    }) => {
      // Only For when Export Table data
      if (params.value === null) return params?.data?.bank_account_account_name;
      return params?.value;
    }
  };

  colDefCheckNo = {
    minWidth: 70,
    headerName: 'Check #',
    field: 'cheque_serial_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCheckNumberComponent',
    cellRendererForExport: (params: {
      value: unknown;
      data: ICheckListTableRowData;
    }) => params?.value
  };

  colDefDate = {
    minWidth: 110,
    headerName: 'Issue Date',
    field: 'cheque_issue_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      v2Table: true,
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      type: 'date'
    }
  };

  colDefScheduleDate = {
    minWidth: 140,
    headerName: 'Scheduled Date',
    field: 'scheduled_checks.schedule_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      v2Table: true,
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCommonFilterComponent',
    cellRendererParams: {
      type: 'date',
      isPipeDate: true
    },
    cellRendererForExport: (params: { data: { schedule_date: string } }) =>
      this.formatScheduleDate(params?.data?.schedule_date)
  };

  colDefCreatedAt = {
    minWidth: 130,
    headerName: 'Created On',
    field: 'cheques.created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent',
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      v2Table: true,
      tableName: 'check_list_table'
    },
    cellRenderer: 'dtCellFilterComponent',
    cellRendererParams: { type: 'date' }
  };

  colDefBy = {
    minWidth: 100,
    headerName: 'Initiated By',
    field: 'cheque_created_by_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'v3CreatedByComponent',
    cellRendererForExport: (params: {
      value: unknown;
      data: ICheckListTableRowData;
    }) => 
      // Only For when Export Table data
       params?.data?.cheque_created_by_user_name
    ,
  };

  colDefMemo = {
    minWidth: window.innerWidth <= 1500 ? 100 : 280,
    maxWidth: 400,
    headerName: 'Memo',
    field: 'cheque_memo',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'v3DescriptionComponent'
  };

  colDefNote = {
    minWidth: 60,
    headerName: 'Note',
    field: 'cheque_notes',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    }
  };

  colDefCategory = {
    minWidth: 60,
    headerName: 'Category',
    field: 'catagory_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefPayeeAcNo = {
    minWidth: 100,
    headerName: `${this.whiteLabelPayeeName} A/c No`,
    field: 'cheque_account_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefInvoiceNo = {
    minWidth: 90,
    headerName: 'Invoice No',
    field: 'cheque_invoice_number',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    },
    cellRenderer: 'V3DTCommonFilterComponent'
  };

  colDefAction = {
    minWidth: 80,
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false,
    floatingFilterComponentParams: {
      tableName: 'check_list_table'
    }
  };

  colDefPayMethod = {
    headerName: 'Default Payment Method',
    field: 'payee_default_payment_method',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    sortable: false,
    suppressHeaderMenuButton: true,
    cellRenderer: (params:ICellRendererParams) => {
      const value = params.data?.payee_default_payment_method;
      switch (value) {
        case '1':
          return 'Printable Check';
        case '2':
          return 'Mail Check by USPS';
        case '3':
          return 'Direct Deposit';
        case '4':
          return 'Email Check';
        default:
          return '';
      }
    }
  };

  colDefPosition = {
    headerName: 'Position',
    field: 'custom_field_position',
    suppressFloatingFilterButton: true,
    filter: 'agTextColumnFilter',
    minWidth: 150,
    floatingFilterComponent: 'selectBoxComponent',
    floatingFilter: true,
    sortable: false,
    suppressHeaderMenuButton: true,
  };

  filterColumnFields(userPlugins?: string[]): void {
    const columnFields = [
      {
        id: 'id',
        name: '#',
        isDisabled: true,
        colDef: this.colDefId,
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
        id: 'id_amount',
        name: 'Amount',
        isDisabled: true,
        colDef: this.colDefAmount,
        isChecked: true
      },
      {
        id: 'id_vendor_id',
        name: 'Vendor Name',
        isDisabled: true,
        colDef: this.colDefVendorId,
        isChecked: true
      },
      {
        id: 'id_payee',
        name: this.whiteLabelPayeeHeaderName,
        isDisabled: true,
        colDef: this.colDefPayee,
        isChecked: true
      },
      {
        id: 'id_nickname',
        name:
          environment.env_id === 'compass'
            ? 'Netsuite GL Account'
            : 'Custom Bank Name',
        isDisabled: false,
        colDef: this.colDefNickName,
        isChecked: true
      },
      {
        id: 'id_bank',
        name: 'Bank',
        isDisabled: false,
        colDef: this.colDefBank,
        isChecked: true
      },
      {
        id: 'id_checkNo',
        name: 'Check No',
        isDisabled: false,
        colDef: this.colDefCheckNo,
        isChecked: true
      },
      {
        id: 'id_date',
        name: 'Check Issue Date',
        isDisabled: false,
        colDef: this.colDefDate,
        isChecked: true
      },
      {
        id: 'id_createdAt',
        name: 'Created Date',
        isDisabled: false,
        colDef: this.colDefCreatedAt,
        isChecked: true
      },
      {
        id: 'id_by',
        name: 'By',
        isDisabled: false,
        colDef: this.colDefBy,
        isChecked: true
      },
      {
        id: 'id_memo',
        name: 'Memo',
        isDisabled: false,
        colDef: this.colDefMemo,
        isChecked: true
      },
      {
        id: 'payee_default_payment_method',
        name: 'Default Pay Method',
        isDisabled: false,
        colDef: this.colDefPayMethod,
        isChecked: true
      },
      {
        id: 'id_position',
        name: 'Position',
        isDisabled: false,
        colDef: this.colDefPosition,
        isChecked: true
      },
      {
        id: 'id_note',
        name: 'Note',
        isDisabled: false,
        colDef: this.colDefNote,
        isChecked: false
      },
      {
        id: 'id_category',
        name: 'Category',
        isDisabled: false,
        colDef: this.colDefCategory,
        isChecked: true
      },
      {
        id: 'id_payeeAcNo',
        name: `${this.whiteLabelPayeeName} A/c No`,
        isDisabled: false,
        colDef: this.colDefPayeeAcNo,
        isChecked: true
      },
      {
        id: 'id_invoiceNo',
        name: 'Invoice No',
        isDisabled: false,
        colDef: this.colDefInvoiceNo,
        isChecked: true
      },
      {
        id: 'id_action',
        name: 'Action',
        isDisabled: true,
        colDef: this.colDefAction,
        isChecked: true
      }
    ];

    if (environment.env_id !== 'compass') {
      if (userPlugins && userPlugins.includes('enterprise-bryancohen')) {
        this.columnFields = columnFields.filter(
          (columnField) => columnField.id !== 'id_vendor_id'
        );
      } else {
        this.columnFields = columnFields.filter(
          (columnField) => columnField.id !== 'id_vendor_id' && columnField.id !== 'id_position'
        );
      }
    } else {
      this.columnFields = columnFields;
    }
  }

  /**
   * Exports checks to quickbook
   */
  exportChecksToQuickbook() {
    this.loadingpush = true;
    const selectedCheckIds = this.selectedRow.map((item) => item.id);
    if (selectedCheckIds?.length > 0) {
      this.subscriptions.push(
        this.integrationService
          .exportChecksToQuickbook(selectedCheckIds)
          .pipe(
            catchError((err) => {
              if (err.error.errorCode === 500) {
                this.openCustomCheckExportErrorAlert(
                  Object.entries(err.error.errorMsg).map(([k, v]) => ({
                    [k]: v
                  }))
                );
              } else if (err.status === 403) {
                this.openWarningAlert(err.error.errorMsg);
              }

              return EMPTY;
            }),
            finalize(() => {
              this.loadingpush = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              this.openSuccessAlert('Checks Exported Successfully');
              this.dataTableService.setRefreshStatus(true);
            }
          })
      );
    } else {
      this.openWarningAlert('Please select at least one check to proceed', 'Error', 'Got it');
      this.loadingpush = false;
    }
  }

  openCustomCheckExportErrorAlert(errorChecklist: { [x: string]: unknown }[]) {
    return this.dialog.open(CustomCheckExportErrorAlertComponent, {
      maxWidth: '500px',
      minWidth: '500px',
      width: '95%',
      disableClose: true,
      data: errorChecklist,
      panelClass: 'ocw_alert_wrapper'
    });
  }

  checkUserVeried() {
    this.loading = true;
    this.subscriptions.push(
      this.userProfileService.UserVerification$.subscribe((res) => {
        this.loading = false;
        if (res.email_verified === 1 && res.phone_verified === 1) {
          this.userVerified = true;
        }
      })
    );
  }

  showRequested() {
    if (StaticWhiteLabelConditions.zohoSupportChat)
      window.open(StaticWhiteLabelConditions.zohoSupportChat);
    else window.open(StaticWhiteLabelConditions?.helpWebsite, '_blank');

  }

  goToVerify() {
    this.router.navigate(['/manage/users/verify-email-phone'], {
      queryParams: {
        returnUrl: 'manage/payments-table/check'
      }
    });
  }

  exportChecksToQuickbookDesktop() {
    this.loadingpush = true;
    const selectedCheckIds = this.selectedRow.map((item) => item.id);
    if (selectedCheckIds?.length > 0) {
      this.subscriptions.push(
        this.integrationService
          .exportChecksToQuickbookDesktop(selectedCheckIds)
          .pipe(
            catchError((err) => {
              if (err.error.errorCode === 500) {
                this.openCustomCheckExportErrorAlert(
                  Object.entries(err.error.errorMsg).map(([k, v]) => ({
                    [k]: v
                  }))
                );
              } else if (err.status === 403) {
                this.openWarningAlert(err.error.errorMsg);
              }
              return EMPTY;
            }),
            finalize(() => {
              this.loadingpush = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              const data: ISuccessAlert = {
                title: 'Success!',
                content:
                  'Checks Exported Successfully. The checks will appear on  your QuickBooks account after one minute of importing.',
                close: false
              };
              this.alertService.successAlert(data);
              this.dataTableService.setRefreshStatus(true);
            }
          })
      );
    } else {
      this.openWarningAlert('Please select at least one check to proceed', 'Error', 'Got it');
      this.loadingpush = false;
    }
  }

  exportChecksToNetSuite() {
    this.loadingpush = true;
    const selectedCheckIds = this.selectedRow.map((item) => item.id);
    if (selectedCheckIds?.length > 0) {
      this.subscriptions.push(
        this.netsuiteIntegrationService
          .exportChecksToNetSuite(selectedCheckIds)
          .pipe(
            catchError((err) => {
              if (err.error.errorCode === 500) {
                this.openCustomCheckExportErrorAlert(
                  Object.entries(err.error.errorMsg).map(([k, v]) => ({
                    [k]: v
                  }))
                );
              }
              return EMPTY;
            }),
            finalize(() => {
              this.loadingpush = false;
            })
          )
          .subscribe((res) => {
            if (res.success) {
              const data: ISuccessAlert = {
                title: 'Success!',
                content:
                  'Checks Exported Successfully. The checks will appear on  your NetSuite account after one minute of importing.',
                close: false
              };
              this.alertService.successAlert(data);
            }
          })
      );
    } else {
      this.openWarningAlert('Please select at least one check to proceed', 'Error', 'Got it');
      this.loadingpush = false;
    }
  }


  getTotalCheckSum() {
    this.totalCheckSumLoading = true;
    if(this.isIndiaBazaarEnabled){
    const persistedPayeeIds = this.checkService.getTotalCheckSumPayeeIds();
    const selectedPayeeIds = Array.from(
      new Set(
        (persistedPayeeIds?.length
          ? persistedPayeeIds
          : ((this.dataTableService.dataTablePayload as { payeeIds?: (string | number)[] } | undefined)?.payeeIds || []))
          .filter((payeeId) => !!payeeId)
      )
    );
    this.subscriptions.push(
      this.checkService.getTotalCheckSum({
        start_date: this.dataTableService.selectedDateRangeChequeCreated?.start ? `${this.datePipe.transform(this.dataTableService.selectedDateRangeChequeCreated?.start, 'yyyy-MM-dd')} 00:00:00` : '',
        end_date: this.dataTableService.selectedDateRangeChequeCreated?.end ? `${this.datePipe.transform(this.dataTableService.selectedDateRangeChequeCreated?.end, 'yyyy-MM-dd')} 00:00:00` : '',
        payee_ids: selectedPayeeIds
      }).pipe(
        catchError((_error) => of({ success: false, data: { total_amount: 0 } })),
        finalize(() => {
          this.totalCheckSumLoading = false;
        })
      ).subscribe((res) => {
        if (res?.success) {
          this.totalCheckSum = res.data.total_amount;
          this.totalCheckSumChange.emit(this.totalCheckSum);
        }
        })
      );
    }
  }

  subscribeToFilterChanges(): void {
    this.subscriptions.push(
      this.dataTableService.getMainFilter().pipe(
        debounceTime(300)
      ).subscribe((filterData) => {
        if (filterData && (filterData.data || filterData.fieldId)) {
          if (filterData.fieldId === 'agGridFilter' || filterData.data) {
            this.getTotalCheckSum();
          }
        }
        this.syncScheduledDateColumn(
          filterData?.fieldId === 'cheques.cheque_status'
            ? String(filterData.data ?? '')
            : undefined
        );
      })
    );

    this.subscriptions.push(
      this.dataTableService.getRefreshStatus().subscribe((refreshData) => {
        if (refreshData.status && refreshData.tableId === this.tableId) {
          this.getTotalCheckSum();
        }
      })
    );
  }

  /**
   * @description Shows the Scheduled Date column only while the check list is filtered
   * by the Scheduled status, otherwise removes it.
   * @param {string} statusFromEvent - Status value when it is already known by the caller.
   */
  private syncScheduledDateColumn(statusFromEvent?: string): void {
    const gridApi = this.dataTableService.gridOptionApi;
    if (!gridApi) return; // grid not ready yet, re-run on the next filter/refresh event

    const status =
      statusFromEvent ??
      String(
        (
          gridApi.getFilterModel()?.[
            'cheques.cheque_status'
          ] as { filter?: string | number }
        )?.filter ?? ''
      );

    this.toggleScheduledDateColumn(status === this.SCHEDULED_CHECK_STATUS);
  }

  /**
   * @description Adds the Scheduled Date column right after the Issue Date column or
   * removes it, without touching the user's saved column visibility.
   * @param {boolean} show - Whether the column has to be displayed.
   */
  private toggleScheduledDateColumn(show: boolean): void {
    const gridApi = this.dataTableService.gridOptionApi;
    const currentColumnDefs = (gridApi?.getColumnDefs() ?? []) as ColDef[];
    const isColumnShown = currentColumnDefs.some(
      (col) => col.field === this.colDefScheduleDate.field
    );

    if (show === isColumnShown) return;

    let updatedColumnDefs: ColDef[];
    if (show) {
      updatedColumnDefs = [...currentColumnDefs];
      const issueDateIndex = updatedColumnDefs.findIndex(
        (col) => col.field === this.colDefDate.field
      );
      updatedColumnDefs.splice(
        issueDateIndex === -1 ? updatedColumnDefs.length : issueDateIndex + 1,
        0,
        this.colDefScheduleDate
      );
    } else {
      this.clearScheduledDateFilter();
      updatedColumnDefs = currentColumnDefs.filter(
        (col) => col.field !== this.colDefScheduleDate.field
      );
    }

    gridApi?.setGridOption('columnDefs', updatedColumnDefs);
  }

  /**
   * @description Removes any date filter applied on the Scheduled Date column, so it does
   * not keep filtering the list once the column is hidden.
   */
  private clearScheduledDateFilter(): void {
    const gridApi = this.dataTableService.gridOptionApi;
    const filterModel = gridApi?.getFilterModel() ?? {};

    if (!filterModel[this.colDefScheduleDate.field]) return;

    delete filterModel[this.colDefScheduleDate.field];
    gridApi?.setFilterModel(filterModel);
  }

  /**
   * @description Formats the scheduled date value for export, matching the date only
   * format the cell renderer shows in the grid.
   * @param {string} value - Raw schedule_date value from the row data.
   * @returns {string} The formatted date.
   */
  formatScheduleDate(value?: string): string {
    if (!value) return '';

    return this.datePipe.transform(value, 'MM/dd/yyyy') ?? value;
  }

  onTotalCheckSumChange(totalSum: number): void {
    this.totalCheckSum = totalSum;
  }

  exportChecksToFreshBooks() {
    this.loadingpush = true;
    const selectedCheckIds = this.selectedRow.map((item) => item.id);
    if (selectedCheckIds?.length > 0) {
      this.subscriptions.push(
        this.integrationService.exportFreshBookChecks({checkIds:selectedCheckIds})
        .pipe(
          catchError((err) => {
            if (err.error.errorCode === 500) {
              this.openCustomCheckExportErrorAlert(
                Object.entries(err.error.errorMsg).map(([k, v]) => ({
                  [k]: v
                }))
              );
            }
            return EMPTY;
          }),
          finalize(() => {
            this.loadingpush = false;
          })
        )
        .subscribe((res) => {
          if (res.success) {
            const data: ISuccessAlert = {
              title: 'Success!',
              content: 'Checks Exported Successfully.',
              close: false
            };
            this.alertService.successAlert(data);
            this.v3DataTableService.refreshV3DataTable();
          }
        })
      );
    }
  }

  /**
   * @description Handles Print Preview Checks button click.
   * Shows confirmation if all selected rows meet conditions, otherwise shows error.
   */
  goToBulkPrintPreviewChecks(): void {
    if (!this.selectedRow || this.selectedRow.length === 0) {
      this.alertService.warningAlert({
        content: 'Please select at least one check.',
        close: false
      });
      return;
    }

    // Mailed check statuses: 4 (Printing), 7 (Mailed), 807 (Mailed & Voided)
    // Email check statuses: 500, 501, 504, 505
    const mailedCheckStatuses = [4, 7, 807, 500, 501, 504, 505];

    // Check which rows meet the Print Preview conditions
    const eligibleRows: string[] = [];
    const ineligibleReasons: ICheckListTableRowData[] = [];

    this.selectedRow.forEach((row) => {
      const hasValidStatus = mailedCheckStatuses.includes(row.cheque_status);

      if (hasValidStatus && row.id) {
        eligibleRows.push(row.id);
      } else {
        ineligibleReasons.push(row);
      }
    });

    // If no rows are eligible
    if (eligibleRows.length === 0) {
      this.alertService.failedAlert({
        content:'The selected checks aren’t eligible for print preview. Try selecting different checks.'
      });
      return;
    }

    // If some rows are not eligible
    if (ineligibleReasons.length > 0) {
      this.alertService.failedAlert({
        content:'Some of the selected checks are not eligible for print preview.'
      });
      return;
    }

    // All rows are eligible - show confirmation dialog
    const confirmRef = this.alertService.warningAlert({
      title: 'Confirm Print Preview',
      content: `This will generate a print preview for the selected checks. Would you like to continue?`,
      doneMsg: 'Continue',
      isCancel: true
    });

    confirmRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.processPrintPreviewChecks(eligibleRows);
      }
    });
  }

  /**
   * @description Processes the print preview API call for the given check IDs.
   */
  private processPrintPreviewChecks(checkIds: string[]): void {
    this.setHeaderButtonLoading(true,'id_print_mailed_preview');
    this.subscriptions.push(
      this.v3BulkPaymentService
        .processCheckMailPreviewPrint({ checkIds })
        .pipe(finalize(() => {
          this.setHeaderButtonLoading(false,'id_print_mailed_preview');
        }))
        .subscribe({
          next: (res) => {
            if (res.success && res.data) {
              const {url} = res.data;
              if (url) {
                const urlLoaded = window.open(url);
                if (
                  !urlLoaded ||
                  urlLoaded.closed ||
                  typeof urlLoaded.closed === 'undefined'
                ) {
                  const popupBlockerMsg = this.alertService.warningAlert({
                    content:
                      'A popup blocker may be preventing the application from opening the PDF file. You may disable popup blocker from your browser settings.',
                    doneMsg: 'Try Again'
                  });
                  popupBlockerMsg.afterClosed().subscribe((result) => {
                    if (result) {
                      window.open(url);
                    }
                  });
                }
              } else {
                this.alertService.successAlert({
                  title: 'Success',
                  content: 'Print preview generated successfully.',
                  close: false
                });
              }
            }
          }
        })
    );
  }

  ngOnDestroy(): void {
    if (this.dataTableService.destroyPayload) {
      this.dataTableService.dataTablePayload = undefined;
      this.dataTableService.dateRangeNameChequeCreated = undefined;
      this.dataTableService.selectedDateRangeChequeCreated = undefined;
      this.dataTableService.selectedDateRangeCheque = undefined;
      this.dataTableService.dateRangeNameCheque = undefined;
    }
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.checkService.checkTrackingUrls.next(null);
  }
}
