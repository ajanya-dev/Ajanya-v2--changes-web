import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { Subscription } from 'rxjs';
import { Router, Params } from '@angular/router';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { ComponentType } from '@angular/cdk/portal';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { linkComponent } from '../../components/dt-components/link';
import { IsActiveComponent } from '../../components/dt-components/isactive-button';
import { GetPaidMessageComponent } from '../../modals/get-paid-message/get-paid-message.component';
import { PaymentSettingsModalComponent } from '../../modals/payment-settingsmodal/payment-settings.component';
import { DtSelectAllCheckBoxComponent } from '../../../data-table/components/dt-select-all-check-box/dt-select-all-check-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

@Component({
  selector: 'app-payment-link-index',
  templateUrl: './payment-link-index.component.html',
  styleUrls: ['./payment-link-index.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class PaymentLinkIndexComponent implements OnInit, OnDestroy {
  public dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private paymentLinkService = inject(PaymentLinkService);
  private v3DataTableService = inject(V3DataTableService);

  isDeleting = signal(false);

  subscriptions: Subscription[] = [];
  public tableId = DTTableId.getPaidLinks; // Data Table Id
  dateRangeField: string;
  controller = 0;
  exportConfig: { heading: string; ignoreColumns?: string[] } = {
    heading: 'Payment Links',
    ignoreColumns: ['uu_id', 'action']
  };

  fieldsShownByDefault: string[] = [
    'uu_id',
    'action',
    'bank_account_account_name'
  ];

  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Create New Link',
        id: 'id_create_new_link',
        icon: ['fas', 'plus'],
        isAddIcon: true,
        toolTip: 'Get paid by link: Create',
        backGroundInput: 'var(--common-green-color)',
        type: 'list'
      },
      {
        text: 'Message',
        id: 'id_message',
        icon: ['fas', 'edit'],
        isAddIcon: true,
        toolTip: 'Edit message',
        type: 'list'
      },
      {
        text: 'e-Payment Settings',
        id: 'id_e_settings',
        icon: ['fas', 'cog'],
        isAddIcon: true,
        toolTip: 'Payment settings',
        type: 'list'
      },
      {
        text: 'Delete',
        id: 'id_delete',
        icon: ['fas', 'trash'],
        isAddIcon: true,
        toolTip: 'Delete',
        backGroundInput: 'var(--common-red-color)',
        type: 'list',
        loading: this.isDeleting()
      }
    ],
    videoButton: [
      {
        slug: 'paymentlink'
      }
    ]
  }));

  frameworkComponents: Record<string, ComponentType<unknown>> = {
    headerCheckBoxComponent: DtSelectAllCheckBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    linkComponent,
    isActiveComponent: IsActiveComponent
  };

  actionComponentProp = {
    actionButton: true,
    eyeButton: false,
    settingsButton: true
  };

  FloatingFilterComponent: Params = {
    selectBox: [
      {
        id: 'is_active',
        values: [
          { value: 1, name: 'Active' },
          { value: 0, name: 'Inactive' }
        ]
      }
    ]
  };

  cellRenderer: {
    action: { name: string; id: string; icon: string; toolTip?: string }[];
  } = {
    action: [
      {
        name: 'Print QR',
        id: 'RId_printqr',
        icon: 'fa fa-print'
      },
      {
        name: 'Edit',
        id: 'RId_edit',
        icon: 'fa fa-edit'
      },
      /* {
        name: 'Add Stripe',
        id: 'RId_addStripe',
        icon: 'fab fa-cc-stripe'
      },
      {
        name: 'Add Stripe Check Out',
        id: 'RId_stripeCheckout',
        icon: 'fab fa-cc-stripe'
      },
      {
        name: 'Add Paypal',
        id: 'RId_add_paypal',
        icon: 'text-dark fa-brands fa-paypal'
      },
      {
        name: 'Add Bitpay',
        id: 'RId_add_bitpay',
        icon: 'fa-solid fa-circle-b'
      },
      {
        name: 'Add G-Pay',
        id: 'RId_g-pay',
        icon: 'fa-brands fa-google',
        toolTip: 'Coming Soon'
      },
      {
        name: 'Add Apple-Pay',
        id: 'RId_a_pay',
        icon: 'fa-brands fa-apple',
        toolTip: 'Coming Soon'
      }, */
      {
        name: 'Delete',
        id: 'RId_dlt',
        icon: 'fa fa-trash'
      }
    ]
  };

  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.reloadTable();
    this.getSettingsOption();
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      this.cellRenderer,
      this.actionComponentProp
    );
  }

  warningAlert() {
    const data = {
      title: 'Error',
      content: 'Please select payment link to delete.',
      isCancel: false,
      doneMsg: 'OK'
    };
    this.alertService.warningAlert(data);
  }

  confirmAlert(content: string) {
    const data = {
      title: 'Alert!',
      content,
      cancelMsg: 'No, Cancel!',
      doneMsg: 'Yes, Delete it!',
      isCancel: true
    };
    return this.alertService.warningAlert(data);
  }

  bulkDelete(items: { enid: string }[]) {
    const ids: string[] = [];
    items.forEach((element: { enid: string }) => {
      ids.push(element.enid);
    });
    const item = {
      ids
    };
    this.isDeleting.set(true);
    this.subscriptions.push(
      this.paymentLinkService
        .deletePaymentLinkBulkGPF(item)
        .subscribe((res) => {
          if (res.success) {
            this.alertService.successAlert({ content: res.data });
            this.reloadTable();
          }
          this.isDeleting.set(false);
        })
    );
  }

  getSettingsOption() {
    this.subscriptions.push(
      this.dataTableService.selectedDangerSingleId$.subscribe((res) => {
        if (res.selectedRow?.enid) {
          this.router.navigate([
            'manage/get_paid_by_form/get_html_code',
            res.selectedRow.enid
          ]);
        }
      })
    );
  }

  getActionComp(env: Params) {
    if (env) {
      /* const val = env.selectedRow?.payment_option_as_array;
      if (val) {
        if (val[1]) {
          this.cellRenderer.action[2].name = 'Revoke Stripe';
        }
        if (val[4]) {
          this.cellRenderer.action[3].name = 'Revoke Stripe Check Out';
        }
        if (val[2]) {
          this.cellRenderer.action[4].name = 'Revoke Paypal';
        }
        if (val[3]) {
          this.cellRenderer.action[5].name = 'Revoke Bitpay';
        }

        this.dataTableService.setCellRendererAction(this.cellRenderer.action);
      } else {
        this.cellRenderer.action[2].name = 'Add Stripe';
        this.cellRenderer.action[3].name = 'Add Stripe Check Out';
        this.cellRenderer.action[4].name = 'Add Paypal';
        this.cellRenderer.action[5].name = 'Add Bitpay';
      } */

      switch (env.id) {
        case 'RId_printqr':
          this.printLink(env.selectedRow.enid);
          break;
        case 'RId_edit':
          this.router.navigate(
            ['manage/get_paid_by_form/edit', env.selectedRow.enid],
            { queryParams: { from: 'getpaidbyform' } }
          );
          break;

        /* case 'RId_addStripe':
          if (env.selectedRow.payment_option_as_array !== null) {
            if (env.selectedRow.payment_option_as_array[1]) {
              this.revokePayments(env.selectedRow.enid, 1);
            } else {
              this.AddPaymentAction(
                'stripe_payments',
                1,
                env.selectedRow.enid,
                'Add Stripe Settings'
              );
            }
          } else {
            this.AddPaymentAction(
              'stripe_payments',
              1,
              env.selectedRow.enid,
              'Add Stripe Settings'
            );
          }

          break;

        case 'RId_stripeCheckout':
          if (env.selectedRow.payment_option_as_array !== null) {
            if (env.selectedRow.payment_option_as_array[4]) {
              this.revokePayments(env.selectedRow.enid, 4);
            } else {
              this.AddPaymentAction(
                'stripe_checkout_payments',
                4,
                env.selectedRow.enid,
                'Add Stripe Settings'
              );
            }
          } else {
            this.AddPaymentAction(
              'stripe_checkout_payments',
              4,
              env.selectedRow.enid,
              'Add Stripe Settings'
            );
          }
          break;

        case 'RId_add_paypal':
          if (env.selectedRow.payment_option_as_array !== null) {
            if (env.selectedRow.payment_option_as_array[2]) {
              this.revokePayments(env.selectedRow.enid, 2);
            } else {
              this.AddPaymentAction(
                'paypal_payments',
                2,
                env.selectedRow.enid,
                'Add Paypal Settings'
              );
            }
          } else {
            this.AddPaymentAction(
              'paypal_payments',
              2,
              env.selectedRow.enid,
              'Add Paypal Settings'
            );
          }
          break;

        case 'RId_add_bitpay':
          if (env.selectedRow.payment_option_as_array !== null) {
            if (env.selectedRow.payment_option_as_array[3]) {
              this.revokePayments(env.selectedRow.enid, 3);
            } else {
              this.AddPaymentAction(
                'bitpay_payments',
                3,
                env.selectedRow.enid,
                'Add Bitpay Settings'
              );
            }
          } else {
            this.AddPaymentAction(
              'bitpay_payments',
              3,
              env.selectedRow.enid,
              'Add Bitpay Settings'
            );
          }
          break;

        case 'RId_g-pay':
          break;

        case 'RId_a_pay':
          break; */

        case 'RId_dlt':
          this.deleteSingle(env.selectedRow.enid);
          break;

        default:
          break;
      }
    }
  }

  deleteSingle(id: string) {
    const confirmAlert = this.confirmAlert(
      'Are you sure you want to archive this link?'
    );
    confirmAlert.afterClosed().subscribe((res) => {
      if (res) {
        this.subscriptions.push(
          this.paymentLinkService
            .deletePaymentLinkMain(id)
            .subscribe((response) => {
              if (response.success) {
                this.reloadTable();
              }
            })
        );
      }
    });
  }

  revokePayments(id: string, typeId: number) {
    const warningAlert = this.warningAlertcond();

    this.subscriptions.push(
      warningAlert.afterClosed().subscribe((res) => {
        if (res) {
          this.revokPaymentApiCall(id, typeId);
        }
      })
    );
  }

  revokPaymentApiCall(id: string, typeId: number) {
    this.subscriptions.push(
      this.paymentLinkService
        .revokePaymentOption(id, typeId)
        .subscribe((res) => {
          if (res.success) {
            this.reloadTable();
          }
        })
    );
  }

  warningAlertcond() {
    const data = {
      title: 'Alert!',
      content: 'Are you sure you want to revoke?',
      isCancel: true,
      doneMsg: 'Yes',
      cancelMsg: 'No'
    };
    return this.alertService.warningAlert(data);
  }

  AddPaymentAction(type: string, typeId: number, id: string, header: string) {
    const modal = this.dialog.open(PaymentSettingsModalComponent, {
      maxWidth: '500px',
      width: '90%',
      data: {
        id,
        mode: 'C',
        isExcistData: true,
        type,
        typeId,
        header
      },
      autoFocus: false
    });

    modal.afterClosed().subscribe((res) => {
      if (res) {
        this.reloadTable();
      }
    });
  }

  headerButtonNavigation(env: {
    id: string;
    selectedRows: { enid: string }[];
  }) {
    switch (env.id) {
      // HEADER BUTTON CLICKS
      case 'id_create_new_link':
        this.router.navigateByUrl('manage/get_paid_by_form/create');
        break;

      case 'id_message':
        this.openMessageModal();
        break;

      case 'id_e_settings':
        this.router.navigateByUrl('manage/get_paid_by_form/payment-settings');
        break;

      case 'id_delete':
        if (env.selectedRows.length === 0) {
          this.warningAlert();
        } else {
          const response = this.confirmAlert(
            'Are you sure you want to delete this link(s)?'
          );
          response.afterClosed().subscribe((res) => {
            if (res) {
              this.bulkDelete(env.selectedRows);
            }
          });
        }
        break;

      default:
        break;
    }
  }

  openMessageModal() {
    const modal = this.dialog.open(GetPaidMessageComponent, {
      maxWidth: '1200px',
      width: '90%',
      autoFocus: false
    });
    modal.afterClosed().subscribe((res) => {
      if (res) {
        this.successAlert();
      }
    });
  }

  successAlert() {
    const data = {
      title: 'Success',
      content: 'Successfully Saved',
      close: true
    };
    const res = this.alertService.successAlert(data);
    res.afterClosed().subscribe(() => {});
  }

  printLink(id: string) {
    this.subscriptions.push(
      this.paymentLinkService.getPrintPaymentLink(id).subscribe((res) => {
        if (res.success) {
          const iframes = document.querySelectorAll('iframe');
          for (let i = 0; i < iframes.length; i += 1) {
            if (iframes[i].id?.includes('print-iframe')) {
              iframes[i]?.parentNode?.removeChild(iframes[i]);
            }
          }
          const iframe = document.createElement('iframe');
          iframe.id = 'paylink-print-iframe';
          iframe.srcdoc = res.data.printData;
          iframe.style.visibility = 'hidden';
          document.body.appendChild(iframe);
        }
      })
    );
  }

  colDefId = {
    headerName: '',
    field: 'uu_id',
    suppressFloatingFilterButton: true,
    minWidth: 40,
    maxWidth: 50,
    checkboxSelection: true,
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    headerClass: 'pl-3.5',
    sortable: false,
    cellClass: 'flex justify-center',
    headerCheckboxSelection: true,
    showDisabledCheckboxes: true,
    cellRenderer: () => ''
  };

  colDefAccountPayableTo = {
    headerName: 'Account Payable To',
    field: 'bank_account_account_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (data: Params) =>
      data.value +
      (data.data.bank_account_nick_name !== null
        ? `( ${data.data.bank_account_nick_name} )`
        : '')
  };

  colDefLinkName = {
    headerName: 'Link Name',
    field: 'name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefLink = {
    headerName: 'Link',
    minWidth: 400,
    field: 'short_url',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'linkComponent'
  };

  colDefIsActive = {
    headerName: 'Is Active',
    minWidth: 100,
    field: 'is_active',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'mt-[5px]',
    cellRenderer: 'isActiveComponent',
    cellRendererForExport: (params: Params): string =>
      params?.value === 1 ? 'Active' : 'Inactive'
  };

  colDefRedirectUrl = {
    headerName: 'Redirect URL',
    field: 'redirect_url',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (data: Params) => {
      if (data.value !== null) {
        return `<span style="text-transform: lowercase;"> ${data.value}</span>`;
      }
      return '';
    },
    cellRendererForExport: (params: Params): string => params?.value
  };

  colDefAction = {
    headerName: 'Action',
    field: 'action',
    suppressFloatingFilterButton: true,
    maxWidth: 120,
    cellRenderer: 'actionComponent',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    sortable: false
  };

  /**
   * SET COLUMN FEILDS
   */
  columnDefs = [
    this.colDefId,
    this.colDefAccountPayableTo,
    this.colDefLinkName,
    this.colDefLink,
    this.colDefIsActive,
    this.colDefRedirectUrl,
    this.colDefAction
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
      id: 'id_AccountPayableTo',
      name: 'Account Payable To',
      isDisabled: true,
      colDef: this.colDefAccountPayableTo,
      isChecked: true
    },
    {
      id: 'id_LinkName',
      name: 'Link Name',
      isDisabled: false,
      colDef: this.colDefLinkName,
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
      id: 'id_isActive',
      name: 'Is Active',
      isDisabled: false,
      colDef: this.colDefIsActive,
      isChecked: true
    },
    {
      id: 'id_RedirectUrl',
      name: 'Redirect Url',
      isDisabled: false,
      colDef: this.colDefRedirectUrl,
      isChecked: true
    },
    {
      id: 'id_Action',
      name: 'Action',
      isDisabled: true,
      colDef: this.colDefAction,
      isChecked: true
    }
  ];

  reloadTable() {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub: Subscription) => sub.unsubscribe());
  }
}
