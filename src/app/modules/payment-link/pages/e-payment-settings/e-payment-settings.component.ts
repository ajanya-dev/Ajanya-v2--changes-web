import {
  Component,
  OnDestroy,
  OnInit,
  Signal,
  computed,
  inject,
  signal
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ColDef } from '@ag-grid-community/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { PaymentLinkService } from 'src/app/shared/service/payment-link/payment-link.service';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { faPlus, faTrash } from '@fortawesome/pro-solid-svg-icons';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { ISelectedSingleRow } from 'src/app/modules/data-table/model/datatable';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { PaymentSettingsModalComponent } from '../../modals/payment-settingsmodal/payment-settings.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { V3DTCommonFilterComponent } from 'src/app/shared/v3/dt-cellrenderers/dt-common-filter';
import { V3DTEpaymentTypeComponent } from './dt-e-payment-type.component';

@Component({
  selector: 'app-e-payment-settings',
  templateUrl: './e-payment-settings.component.html',
  styleUrls: ['./e-payment-settings.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class EPaymentSettingsComponent implements OnInit, OnDestroy {
  private dataTableService = inject(DataTableService);
  private v3DataTableService = inject(V3DataTableService);
  private dialog = inject(MatDialog);
  private paymentLinkService = inject(PaymentLinkService);
  private alertService = inject(AlertService);

  public tableId = DTTableId.paymentSettings; // Data Table Id
  cellRenderer: unknown;
  destroy$ = new Subject<boolean>();

  fieldsShownByDefault = ['boxId'];

  deleteLoading = signal(false);

  public headerElements: Signal<IV3DtHeaderElements> = computed(() => ({
    buttons: [
      {
        text: 'New Payment Option',
        id: 'id_add_new_link',
        icon: faPlus,
        toolTip: 'Add new payment option',
        backGroundInput: 'var(--common-green-color)',
        isAddIcon: true,
        type: 'list'
      },
      {
        text: 'Delete',
        id: 'id_delete',
        icon: faTrash,
        type: 'list',
        toolTip: 'Delete',
        backGroundInput: 'var(--common-red-color)',
        isAddIcon: true,
        loading: this.deleteLoading()
      }
    ]
  }));

  public frameworkComponents = {
    actionComponent: DtActionComponent,
    SearchBoxComponent: DtSearchBoxComponent,
    selectBoxComponent: V3DataTableSelectBoxComponent,
    V3DTCommonFilterComponent,
    V3DTEpaymentTypeComponent
  };

  FloatingFilterComponent = {
    selectBox: [
      {
        id: 'payment_type',
        values: [
          { value: 1, name: 'Stripe' },
          { value: 2, name: 'PayPal' },
          { value: 3, name: 'Bitpay' },
          { value: 4, name: 'Stripe Checkout' }
        ]
      }
    ]
  };

  ngOnInit(): void {
    const actionComponentProp = {
      deleteButton: true,
      editButton: true
    };

    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent,
      undefined,
      actionComponentProp
    );
    this.initializeV3DataTable();
    this.getDangerEvent();
  }

  initializeV3DataTable() {
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

  getDangerEvent() {
    this.dataTableService.selectedDangerSingleId$
      .pipe(takeUntil(this.destroy$))
      .subscribe((val) => {
        if ((val.tableId && val.tableId === this.tableId) || !val.tableId) {
          this.getSettingsOption(val);
        }
      });
  }

  getSettingsOption(env: ISelectedSingleRow) {
    if (env.id === 'id_edit_button' && env.selectedRow) {
      this.paymentadd('E', env.selectedRow.encrypted_id);
    }

    if (env.id === 'id_delete_button') {
      const response = this.confirmAlert('Are you sure you want to delete?');
      response
        .afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((res) => {
          if (res && env.selectedRow) {
            this.singleDelete(env.selectedRow.encrypted_id);
          }
        });
    }
  }

  headerButtonNavigation(env: {
    id: string;
    selectedRows: { encrypted_id: string }[];
  }) {
    switch (env.id) {
      case 'id_add_new_link':
        this.paymentadd('C', '');
        break;

      case 'id_delete':
        if (env.selectedRows.length === 0) {
          this.warningAlert();
        } else {
          const response = this.confirmAlert(
            'Are you sure you want to delete?'
          );
          response
            .afterClosed()
            .pipe(takeUntil(this.destroy$))
            .subscribe((res) => {
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

  paymentadd(mode: string, id: string) {
    const modal = this.dialog.open(PaymentSettingsModalComponent, {
      maxWidth: '500px',
      width: '90%',
      data: {
        id,
        mode,
        isExcistData: false
      },
      autoFocus: false
    });
    modal
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res) {
          this.v3DataTableService.refreshV3DataTable();
        }
      });
  }

  singleDelete(id: string) {
    this.paymentLinkService
      .deletePaymentLink(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.success) {
          this.successAlert();
        }
      });
  }

  bulkDelete(items: { encrypted_id: string }[]) {
    const ids: string[] = [];
    items.forEach((element) => {
      ids.push(element.encrypted_id);
    });
    const item = {
      ids
    };

    this.deleteLoading.update(() => true);
    this.paymentLinkService
      .deletePaymentLinkBulk(item)
      .pipe(
        finalize(() => {
          this.deleteLoading.update(() => false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res.success) {
          this.successAlert();
        }
      });
  }

  confirmAlert(content: string) {
    const data = {
      title: 'Alert!',
      content,
      cancelMsg: 'No, cancel!',
      doneMsg: 'Yes, delete it!',
      isCancel: true
    };
    return this.alertService.warningAlert(data);
  }

  warningAlert() {
    const data = {
      title: 'Error',
      content: 'Please select payment settings to delete.',
      isCancel: false,
      doneMsg: 'OK'
    };
    this.alertService.warningAlert(data);
  }

  successAlert() {
    const data = {
      title: 'Success',
      content: 'Deleted',
      close: true
    };
    this.v3DataTableService.gridApi.deselectAll();
    this.v3DataTableService.refreshV3DataTable();
    this.alertService.successAlert(data);
  }

  colDefId: ColDef = {
    headerName: '',
    field: 'boxId',
    suppressFloatingFilterButton: true,
    minWidth: 40,
    maxWidth: 50,
    checkboxSelection: true,
    headerCheckboxSelection: true,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    sortable: false
  };

  colDefNickName = {
    headerName: 'Nick Name',
    field: 'nick_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTCommonFilterComponent',
  };

  colDefPaymentType = {
    headerName: 'Payment Type',
    field: 'payment_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: 'V3DTEpaymentTypeComponent'
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

  columnFields = [
    {
      id: 'boxId',
      name: '#',
      isDisabled: true,
      colDef: this.colDefId,
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
      id: 'id_paymenttype',
      name: 'Payment Type',
      isDisabled: false,
      colDef: this.colDefPaymentType,
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

  public columnDefs: ColDef[] = [
    this.colDefId,
    this.colDefNickName,
    this.colDefPaymentType,
    this.colDefAction
  ];

  ngOnDestroy(): void {
    this.destroy$.next(true);
  }
}
