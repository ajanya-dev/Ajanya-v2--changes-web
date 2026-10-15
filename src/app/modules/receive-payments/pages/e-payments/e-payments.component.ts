import { Component, OnInit, computed, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { Router } from '@angular/router';
import { IV3DtHeaderElements } from 'src/app/modules/v3-data-table/models/v3-data-table';
import { IDtColumnFields } from 'src/app/modules/data-table/model/datatable';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { DtActionComponent } from '../../../data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from '../../../data-table/components/dt-search-box/dt-search-box.component';
import { V3DataTableComponent } from '../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-e-payments',
  templateUrl: './e-payments.component.html',
  styleUrls: ['./e-payments.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class EPaymentsComponent implements OnInit {
  public dialog = inject(MatDialog);
  private dataTableService = inject(DataTableService);
  private router = inject(Router);
  private currencyPipe = inject(CurrencyPipe);
  private v3DataTableService = inject(V3DataTableService);

  /**
   * @description DATA TABLE VARAIBLES
   */
  public columnDefs: (ColDef | ColGroupDef)[] | null;
  public columnFields: IDtColumnFields[];
  public frameworkComponents: {
    selectBoxComponent: typeof V3DataTableSelectBoxComponent;
    actionComponent: typeof DtActionComponent;
    SearchBoxComponent: typeof DtSearchBoxComponent;
  };

  public tableId = DTTableId.epayments;

  /**
   * HEADER ELEMENTS PROPERTIES
   */
  public headerElements = computed<IV3DtHeaderElements>(() => ({
    buttons: [
      {
        text: 'Recurring Payment',
        id: 'id_rec_p',
        isAddIcon: true,
        icon: ['fas', 'retweet'],
        type: { style: 'green', name: 'money-action' }
      }
    ]
  }));

  // FILTER CUSTOM COMPONENTS
  FloatingFilterComponent = {
    selectBox: [
      {
        id: 'credential_type',
        values: [
          { value: 'live', name: 'live' },
          { value: 'sandbox', name: 'sandbox' }
        ]
      }
    ]
  };

  ngOnInit(): void {
    this.frameworkComponents = {
      selectBoxComponent: V3DataTableSelectBoxComponent,
      actionComponent: DtActionComponent,
      SearchBoxComponent: DtSearchBoxComponent
    };

    // SET COLUMN FEILDS
    this.columnDefs = [
      this.colDefId,
      this.colDefPaymentMethod,
      this.colDefAmount,
      this.colDefPaymentStatus,
      this.colDefRefId,
      this.colDefCustomerName,
      this.colDefEmail,
      this.colDefPaymentType
    ];

    // PASS  FIELD DATA
    this.columnFields = [
      {
        id: 'id',
        name: '#',
        isDisabled: true,
        colDef: this.colDefId,
        isChecked: true
      },
      {
        id: 'id_Paymentmethod',
        name: 'Payment method',
        isDisabled: false,
        colDef: this.colDefPaymentMethod,
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
        id: 'id_PaymentStatus',
        name: 'Payment Status',
        isDisabled: true,
        colDef: this.colDefPaymentStatus,
        isChecked: true
      },
      {
        id: 'id_refId',
        name: 'Ref Id',
        isDisabled: false,
        colDef: this.colDefRefId,
        isChecked: true
      },
      {
        id: 'id_CustomerName',
        name: 'Customer Name',
        isDisabled: false,
        colDef: this.colDefCustomerName,
        isChecked: true
      },
      {
        id: 'id_email',
        name: 'Email',
        isDisabled: false,
        colDef: this.colDefEmail,
        isChecked: true
      },

      {
        id: 'id_paymentType',
        name: 'Payment Type',
        isDisabled: false,
        colDef: this.colDefPaymentType,
        isChecked: true
      }
    ];

    /**
     * @description PASS DATAS TO DATA TABLE SERVICE
     */
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.FloatingFilterComponent
    );

    this.v3DataTableService.resetV3DataTablePayload();
    this.v3DataTableService.refreshV3DataTable();
  }

  headerButtonNavigation(env: { id: string }) {
    if (env.id === 'id_rec_p') {
      this.router.navigateByUrl(
        'manage/receivedchecks/received-payments/recurring'
      );
    }
  }

  colDefAmount = {
    headerName: 'Amount',
    minWidth: 100,
    maxWidth: 150,
    field: 'amount',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellClass: 'flex justify-end pr-3 text-end mt-0.5',
    cellRenderer: (params: { value: string | number }) =>
      this.currencyPipe.transform(params.value)
  };

  colDefId = {
    headerName: '#',
    sortable: false,
    field: 'id',
    suppressFloatingFilterButton: true,
    maxWidth: 50,
    filter: false,
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    lockPosition: true,
    resizable: false,
    headerClass: 'fixed-size-header'
  };

  colDefPaymentMethod = {
    headerName: 'Payment Method',
    field: 'payment_method_types',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefPaymentStatus = {
    headerName: 'Payment Status',
    field: 'payment_status',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true,
    cellRenderer: (params: { value: string }) => params.value.toLowerCase()
  };

  colDefRefId = {
    headerName: 'Ref Id',
    field: 'reference_id',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefCustomerName = {
    headerName: 'Customer Name',
    field: 'customer_name',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agNumberColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefEmail = {
    headerName: 'Email',
    field: 'customer_email',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'SearchBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };

  colDefPaymentType = {
    headerName: 'Payment Type',
    field: 'credential_type',
    suppressFloatingFilterButton: true,
    floatingFilterComponent: 'selectBoxComponent',
    filter: 'agTextColumnFilter',
    floatingFilter: true,
    suppressHeaderMenuButton: true
  };
}
