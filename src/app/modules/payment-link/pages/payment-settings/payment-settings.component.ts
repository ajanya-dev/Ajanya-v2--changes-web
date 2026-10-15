import { DecimalPipe, NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { StaticWhiteLabelConditions } from 'src/app/modules/dynamic-white-label/static-white-label-conditions/static-dynamic-white-label-conditions';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { ICoulmnDefFields, IDefaultPayload } from 'src/app/models/v3-datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { ICellRendererParams } from '@ag-grid-community/core';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import {
  IDtActionCompProp,
  IDtCellrendererBtn,
  IDtColumnFields,
  IDtFloatingFilterProp
} from 'src/app/modules/data-table/model/datatable';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { AddNewGetPaidLinkComponent } from '../../modals/add-new-get-paid-link/add-new-get-paid-link.component';
import { ComingSoonModalComponent } from '../../modals/coming-soon-modal/coming-soon-modal.component';
import { EmailLinkModalComponent } from '../../modals/email-link-modal/email-link-modal.component';
import { PaymentSettingsModalComponent } from '../../modals/payment-settingsmodal/payment-settings.component';
import { IPaymentButtons, PaymentButtons } from './paymentButtons.data';
import { DtRecurringMarkComponent } from './dt-recurring-mark/dt-recurring-mark.component';
import { MatRadioGroup, MatRadioButton } from '@angular/material/radio';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { CommonBackButtonV35Component } from '../../../../shared/v3/buttons/common-back-button-v35/common-back-button-v35.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

@Component({
  selector: 'app-payment-settings',
  templateUrl: './payment-settings.component.html',
  styleUrls: ['./payment-settings.component.scss'],
  standalone: true,
  imports: [
    CommonBackButtonV35Component,
    FormsModule,
    NgClass,
    FaIconComponent,
    V3DataTableComponent,
    MatRadioGroup,
    MatRadioButton
  ]
})
export class PaymentSettingsComponent implements OnInit, OnDestroy {
  staticWhiteLabelConditions = StaticWhiteLabelConditions;

  id = 1;
  // isDisable = true;
  paymentId: any;
  isEdit = true;
  isShow = false;
  paystripe = false;
  selectedPanel = 1;
  dy_if_link: any;
  paymentButtonsObj = new PaymentButtons();
  eCButtonsV1: IPaymentButtons[] = [];
  eCButtonsV2: IPaymentButtons[] = [];
  buttonCode = '';
  widgetCode = '';
  snippetCode = '';
  buttonCodeV2 = '';
  widgetCodeV2 = '';
  snippetCodeV2 = '';
  splittedString: any[];
  amount: any = '';
  selectedIndex: number;
  viewData: any;
  newShortUrl: string;
  currentSnippetTab: 'v1snippet' | 'v2snippet' = 'v2snippet';

  subscriptions: Subscription[] = [];
  public tableId = DTTableId.customAdvanceLink; // Data Table Id
  actionComponentProp: IDtActionCompProp;
  dateRangeField: string;

  private v3DataTableService = inject(V3DataTableService);
  private dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private route = inject(ActivatedRoute);
  private paymentLinkService = inject(PaymentLinkService);
  private alertService = inject(AlertService);
  private decimal = inject(DecimalPipe);

  frameworkComponents = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    selectDateComponent: DataRangeV35Component,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    RecurringMarkComponent: DtRecurringMarkComponent
  };

  headerElements: IV3DtHeaderElements = {
    buttons: [
      {
        text: 'Add New Link',
        id: 'id_add_new_link',
        toolTip: 'New Advance Link',
        icon: ['fas', 'plus'],
        type: 'list',
        backGroundInput: 'var(--common-green-color)',
        isAddIcon: true
      },
      {
        id: 'id_delete',
        roundIcon: ['fas', 'trash'],
        customClasses: 'bg-common-secondary-red-color text-common-red-color',
        toolTip: 'Delete.'
      }
    ]
  };

  //FILTER CUSTOM COMPONENTS
  FloatingFilterComponent: IDtFloatingFilterProp = {
    selectBox: [
      {
        id: 'is_recurring',
        values: [
          { value: 0, name: 'One-time payment' },
          { value: 1, name: 'Recurring' }
        ]
      }
    ],
    selectDate: [
      { id: 'created_at', initialRange: 'All Time', isPrimary: true },
      { id: 'start_date', initialRange: 'All Time' }
    ]
  };

  cellRenderer: IDtCellrendererBtn = {
    action: [
      {
        name: 'Edit',
        id: 'RId_edit',
        icon: 'fa fa-edit'
      },
      {
        name: 'Delete',
        id: 'RId_dlt',
        icon: 'fa fa-trash'
      },
      {
        name: 'Email Link',
        id: 'RId_email_link',
        icon: 'fa fa-envelope'
      },
      {
        name: 'Sms Link',
        id: 'RId_sms_link',
        icon: 'fas fa-sms'
      }
    ]
  };

  panelButtons = [
    {
      name: 'Custom Recurring Link',
      id: 1
    },
    {
      name: 'Dynamic & iframe Link',
      id: 2
    },
    {
      name: 'e-Commerce Buttons',
      id: 3
    }
  ];

  ngOnInit(): void {
    this.paymentId = this.route.snapshot.paramMap.get('id');
    this.getDynamicAndIframeLink();
    this.getEcommerceButton();
    this.viewSettings();
    this.eCButtonsV1 = this.paymentButtonsObj.getV1Buttons({
      paymentId: this.paymentId,
      shortUrl: this.newShortUrl
    });
    this.eCButtonsV2 = this.paymentButtonsObj.getV2Buttons({
      paymentId: this.paymentId,
      shortUrl: this.newShortUrl
    });
    this.initializeV3DataTable();

    const actionComponentProp = {
      actionButton: true,
      eyeButton: false
    };

    // PASS DATAS TO DATA TABLE SERVICE
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      actionComponentProp
    );
  }

  /**
   * @description Setting up the payload  for loading ag grid
   */
  initializeV3DataTable() {
    this.v3DataTableService.defaultPayload = {
      startRow: 0,
      endRow: 50,
      linkId: this.paymentId,
      rowGroupCols: [],
      valueCols: [],
      pivotCols: [],
      pivotMode: false,
      groupKeys: [],
      filterModel: {},
      sortModel: []
    } as IDefaultPayload;
  }

  panelClick(id: number) {
    this.selectedPanel = id;
  }

  colDefId = {
    headerName: '',
    field: 'uu_id',
    suppressFloatingFilterButton: true,
    minWidth: 40,
    maxWidth: 50,
    checkboxSelection: true,
    floatingFilterComponent: 'headerCheckBoxComponent',
    filter: 'agTextColumnFilter',
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    headerClass: 'pl-[8px]',
    headerCheckboxSelection: true,
    showDisabledCheckboxes: true,
    pinned: 'left' as const,
    cellClass: 'flex flex-col justify-center pl-[6px]'
  };

  colDefCreatedTime = {
    headerName: 'Created Time',
    minWidth: 160,
    field: 'created_at',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent', //SearchBoxComponent
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (data: any) => {
      const str = String(data.data.created_at_formated);
      const splitted = str.split('_');

      return (
        '<span>' +
        splitted[0] +
        '<span style="font-size:11.5px;"> (' +
        splitted[1] +
        ')</span></span>'
      );
    }
  };

  colDefNickName = {
    minWidth: 90,
    headerName: 'Nick Name',
    field: 'nickname',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefAmount: ICoulmnDefFields = {
    minWidth: 100,
    maxWidth: 150,
    headerName: 'Amount',
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'ag-right-aligned-cell pr-3',
    cellRenderer: (params: ICellRendererParams) =>
      this.decimal.transform(params.value, '1.2-2')
  };

  colDefLink = {
    headerName: 'Link',
    minWidth: 300,
    field: 'slugurl',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (param: ICellRendererParams) =>
      `<a style="color: #5867dd;text-transform: lowercase;" target="_blank" href="${this.staticWhiteLabelConditions.paymentShortLink}/${this.viewData?.shortUrl}/${param.value}"> ${this.staticWhiteLabelConditions.paymentShortLink}/${this.viewData?.shortUrl}/${param.value}</a>`
  };

  colDefType = {
    minWidth: 90,
    headerName: 'Type',
    field: 'is_recurring',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent', // SearchBoxComponent
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'RecurringMarkComponent'
  };

  colDefMonths = {
    headerName: 'Months',
    minWidth: 90,
    field: 'months',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent', // SearchBoxComponent
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefStartDate = {
    headerName: 'Start Date',
    minWidth: 120,
    field: 'start_date',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectDateComponent', // SearchBoxComponent
    filter: 'agDateColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefAction = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    minWidth: 60,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false
  };

  // PASS FIELD DATA
  columnFields: IDtColumnFields[] = [
    {
      id: 'id',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
      isChecked: true
    },
    {
      id: 'id_created_time',
      name: 'Created Time',
      isDisabled: false,
      colDef: this.colDefCreatedTime,
      isChecked: true
    },
    {
      id: 'id_nickName',
      name: 'Nick Name',
      isDisabled: false,
      colDef: this.colDefNickName,
      isChecked: true
    },
    {
      id: 'id_amount',
      name: 'Amount',
      isDisabled: false,
      colDef: this.colDefAmount,
      isChecked: true
    },
    {
      id: 'id_link',
      name: 'Link',
      isDisabled: false,
      colDef: this.colDefLink,
      isChecked: true
    },
    {
      id: 'id_type',
      name: 'Type',
      isDisabled: false,
      colDef: this.colDefType,
      isChecked: true
    },
    {
      id: 'id_months',
      name: 'Months',
      isDisabled: false,
      colDef: this.colDefMonths,
      isChecked: true
    },
    {
      id: 'id_start_date',
      name: 'Start Date',
      isDisabled: true,
      colDef: this.colDefStartDate,
      isChecked: true
    },
    {
      id: 'id_Action',
      name: 'Action',
      isDisabled: false,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  // SET COLUMN FEILDS
  columnDefs: ICoulmnDefFields[] = [
    this.colDefId,
    this.colDefCreatedTime,
    this.colDefNickName,
    this.colDefAmount,
    this.colDefLink,
    this.colDefType,
    this.colDefMonths,
    this.colDefStartDate,
    this.colDefAction
  ];

  getActionComp(env: {
    id: string;
    selectedRow: {
      slugurl: string;
      amount: number;
      id: string;
    };
  }) {
    switch (env.id) {
      case 'RId_edit':
        this.editCRLink(env.selectedRow);
        break;

      case 'RId_dlt':
        this.deleteLink(env.selectedRow.id);
        break;

      case 'RId_email_link':
        this.openEmailSmsLinkModal(env.selectedRow, 'email');
        break;

      case 'RId_sms_link':
        this.openEmailSmsLinkModal(env.selectedRow, 'sms');
        break;

      default:
        break;
    }
  }

  openEmailSmsLinkModal(
    item: { slugurl: string; amount: number; id: string },
    type: string
  ) {
    const modal = this.dialog.open(EmailLinkModalComponent, {
      maxWidth: '420px',
      width: '90%',
      autoFocus: false,
      disableClose:true,
      data: {
        link: `${this.staticWhiteLabelConditions.paymentShortLink}/${this.viewData?.shortUrl}/${item.slugurl}`,
        amount: Math.round(item.amount),
        bankName: this.viewData.accountName,
        slugUrl: this.viewData?.shortUrl,
        id: item.id,
        type
      }
    });

    this.subscriptions.push(
      modal.afterClosed().subscribe((res) => {
        if (res) {
          this.dataTableService.setRefreshStatus(true);
          this.v3DataTableService.refreshV3DataTable();
        }
      })
    );
  }

  deleteLink(id: string) {
    const res = this.warningAlert(
      'Alert!',
      'Are you sure you want to delete the link?',
      'Yes, Delete it!',
      'No, cancel',
      true
    );
    res.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.paymentLinkService
            .DeleteCustomAdvanceLink(id)
            .subscribe((res) => {
              if (res.success) {
                this.alertService.successAlert({
                  title: 'Success',
                  content: 'Deleted successfully'
                });
                this.dataTableService.setRefreshStatus(true);
                this.v3DataTableService.refreshV3DataTable();
              }
            })
        );
      }
    });
  }

  editCRLink(item: any) {
    if (
      item.is_recurring != undefined ||
      item.start_date != undefined ||
      item.id != undefined
    ) {
      item.isRecurring = item.is_recurring == 1 ? true : false;
      item.startDate = item.start_date;
      item.link = this.paymentId;
      delete item.is_recurring;
      delete item.start_date;
    }

    const modal = this.dialog.open(AddNewGetPaidLinkComponent, {
      maxWidth: '420px',
      width: '90%',
      autoFocus: false,
      disableClose:true,
      data: {
        id: item.id,
        shortUrl: this.viewData?.shortUrl,
        mode: 'E',
        data: item
      }
    });

    this.subscriptions.push(
      modal.afterClosed().subscribe((res) => {
        if (res) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'Updated successfully'
          });
          this.dataTableService.setRefreshStatus(true);
          this.v3DataTableService.refreshV3DataTable();
        }
      })
    );
  }

  headerButtonNavigation(env: any) {
    switch (env.id) {
      // HEADER BUTTON CLICKS
      case 'id_add_new_link':
        this.addNewCustumRecurringLink();
        break;

      case 'id_delete':
        this.mutliDeleteAction(env.selectedRows);
        break;

      default:
        break;
    }
  }

  mutliDeleteAction(rows: any) {
    const ids: any[] = [];
    if (rows.length == 0) {
      this.warningAlert(
        'Error',
        'Please select link to delete.',
        'OK',
        '',
        false
      );
      return;
    } else {
      rows.forEach((element: any) => {
        ids.push(element.id);
      });

      const res = this.warningAlert(
        'Alert!',
        'Are you sure you want to delete the link?',
        'Yes,Delete it!',
        'No, cancel',
        true
      );
      res.afterClosed().subscribe((res) => {
        if (res) {
          this.MultideleteLink(ids);
        }
      });
    }
  }

  MultideleteLink(data: any) {
    const ids = {
      ids: data
    };
    this.subscriptions.push(
      this.paymentLinkService
        .MultiDeleteCustomAdvanceLink(ids)
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({
              title: 'Success',
              content: 'Deleted successfully'
            });
            this.dataTableService.setRefreshStatus(true);
            this.v3DataTableService.refreshV3DataTable();
          }
        })
    );
  }

  paymentAction(
    mode: number,
    type: string,
    typeId: number //  type = 0  => attach payment option       type = 1  => revoke payment option    type= 2  => coming soon
  ) {
    switch (mode) {
      case 0:
        this.AddPaymentAction(type, typeId);
        break;

      case 1:
        this.revokePayments(typeId);
        break;

      case 2:
        this.comingSoon();
        break;

      default:
        break;
    }
  }

  revokePayments(typeId: number) {
    const res = this.warningAlert(
      'Alert!',
      'Are you sure you want to revoke?',
      'Yes',
      'No',
      true
    );

    this.subscriptions.push(
      res.afterClosed().subscribe((res) => {
        if (res) {
          this.revokPaymentApiCall(typeId);
        }
      })
    );
  }

  revokPaymentApiCall(typeId: number) {
    this.subscriptions.push(
      this.paymentLinkService
        .revokePaymentOption(this.paymentId, typeId)
        .subscribe((res) => {
          if (res.success) {
            this.viewSettings();
          }
        })
    );
  }

  addNewCustumRecurringLink() {
    const modal = this.dialog.open(AddNewGetPaidLinkComponent, {
      maxWidth: '420px',
      width: '90%',
      autoFocus: false,
      disableClose:true,
      data: {
        id: this.paymentId,
        shortUrl: this.viewData?.shortUrl,
        mode: 'C'
      }
    });

    this.subscriptions.push(
      modal.afterClosed().subscribe((res) => {
        if (res) {
          this.alertService.successAlert({
            title: 'Success',
            content: 'New link created successfully'
          });
          this.dataTableService.setRefreshStatus(true);
          this.v3DataTableService.refreshV3DataTable();
        }
      })
    );
  }

  headers: any = {
    1: 'Add Stripe Settings',
    2: 'Add Paypal Settings',
    3: 'Add Bitpay Settings'
  };

  // PaymentLinkAction() {
  //   this.dialog.open(PaymentSettingsModalComponent, {       //open modal
  //     maxWidth: '420px',
  //     width: '90%',
  //     autoFocus: false
  //   });
  // }

  AddPaymentAction(type: string, typeId: number) {
    const modal = this.dialog.open(PaymentSettingsModalComponent, {
      //open modal
      maxWidth: '500px',
      width: '90%',
      data: {
        id: this.paymentId,
        mode: 'C',
        isExcistData: true,
        type: type,
        typeId: typeId,
        header: this.headers[typeId]
      },
      autoFocus: false
    });

    modal.afterClosed().subscribe((res) => {
      if (res) {
        this.viewSettings();
      }
    });
  }

  clicks(num: number) {
    this.id = num;
  }

  edit() {
    this.isEdit = !this.isEdit;
  }

  getPaidBtnWrapper: number = 0;

  getDynamicAndIframeLink() {
    this.subscriptions.push(
      this.paymentLinkService.getDandILink(this.paymentId).subscribe((res) => {
        if (res.success) {
          this.dy_if_link = res.data;
        }
      })
    );
  }

  comingSoon() {
    this.dialog.open(ComingSoonModalComponent);
  }

  getEcommerceButton() {
    this.subscriptions.push(
      this.paymentLinkService
        .eCommercebutton(this.paymentId)
        .subscribe((res: any) => {
          if (res.success) {
            this.eCButtonsV1 = res.data;
            this.selectedButton(0);
          }
        })
    );
  }

  viewSettings() {
    this.subscriptions.push(
      this.paymentLinkService
        .viewGPBLSettinga(this.paymentId)
        .subscribe((res) => {
          if (res.success) {
            this.viewData = res.data;
            this.newShortUrl = this.viewData.shortUrl;
            this.eCButtonsV1 = this.paymentButtonsObj.getV1Buttons({
              paymentId: this.paymentId,
              amount: this.amount,
              shortUrl: this.newShortUrl
            });
            this.eCButtonsV2 = this.paymentButtonsObj.getV2Buttons({
              paymentId: this.paymentId,
              amount: this.amount,
              shortUrl: this.newShortUrl
            });
          }
        })
    );
  }

  updateShortUrl(value: string) {
    const data = {
      shortUrl: value
    };
    this.subscriptions.push(
      this.paymentLinkService
        .updateShortUrl(this.paymentId, data)
        .pipe(
          catchError(() => {
            return of(false);
          })
        )
        .subscribe((res) => {
          if (res.success) {
            this.successAlert(res.data);
            this.isEdit = true;
          } else {
            this.isShow = true;
          }
        })
    );
  }

  successAlert(msg: string) {
    const data = {
      title: 'Success',
      content: msg,
      close: true
    };
    this.alertService.successAlert(data);
  }

  selectedButton(i: number) {
    this.amount = '';
    this.buttonCode = this.eCButtonsV1[i].htmlButtonCode;
    this.widgetCode = this.eCButtonsV1[i].htmlWidgetCode;
    this.snippetCode = this.eCButtonsV1[i].snippetCode;
    this.buttonCodeV2 = this.eCButtonsV2[i].htmlButtonCode;
    this.widgetCodeV2 = this.eCButtonsV2[i].htmlWidgetCode;
    this.snippetCodeV2 = this.eCButtonsV2[i].snippetCode;

    this.selectedIndex = i;
  }

  getAmount(value: any) {
    if (value > 0) {
      this.amount = value;
    } else {
      this.amount = '';
    }
  }

  addAmount() {
    if (this.amount === '') {
      this.warningAlert('Error', 'Please enter the amount', 'OK', '', false);
      return;
    }

    const snippetV1 = this.paymentButtonsObj.getV1Buttons({
      paymentId: this.paymentId,
      amount: this.amount,
      shortUrl: this.newShortUrl
    });
    const snippetV2 = this.paymentButtonsObj.getV2Buttons({
      paymentId: this.paymentId,
      amount: this.amount,
      shortUrl: this.newShortUrl
    });
    this.widgetCode = snippetV1[this.selectedIndex]?.htmlWidgetCode;
    this.buttonCode = snippetV1[this.selectedIndex]?.htmlButtonCode;
    this.snippetCode = snippetV1[this.selectedIndex]?.snippetCode;
    this.buttonCodeV2 = snippetV2[this.selectedIndex].htmlButtonCode;
    this.widgetCodeV2 = snippetV2[this.selectedIndex].htmlWidgetCode;
    this.snippetCodeV2 = snippetV2[this.selectedIndex].snippetCode;
  }

  clear() {
    this.amount = '';
    this.widgetCode = this.eCButtonsV1[this.selectedIndex]?.htmlWidgetCode;
    this.buttonCode = this.eCButtonsV1[this.selectedIndex]?.htmlButtonCode;
    this.snippetCode = this.eCButtonsV1[this.selectedIndex]?.snippetCode;
    this.buttonCodeV2 = this.eCButtonsV2[this.selectedIndex].htmlButtonCode;
    this.widgetCodeV2 = this.eCButtonsV2[this.selectedIndex].htmlWidgetCode;
    this.snippetCodeV2 = this.eCButtonsV2[this.selectedIndex].snippetCode;
  }

  urlFocusOut() {
    if (!this.newShortUrl) {
      return;
    }
    const urlArr = this.newShortUrl.trim().replace(/\s\s+/g, ' ').split('');

    for (let i = 0; i < urlArr.length; i++) {
      if (urlArr[i] === ' ' && i !== urlArr.length - 1) {
        urlArr[i] = '-';
      }
    }
    this.newShortUrl = urlArr.join('');
  }

  warningAlert(
    title: string,
    content: string,
    doneMsg: string,
    CancelMsg: string,
    val: boolean
  ) {
    const data = {
      title: title,
      content: content,
      doneMsg: doneMsg,
      CancelMsg: CancelMsg,
      isCancel: val
    };
    return this.alertService.warningAlert(data);
  }

  preventBackSlash(event: KeyboardEvent) {
    if (event.key === '/' || event.key === '\\') {
      event.preventDefault();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
