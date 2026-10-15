import { Component, OnInit, inject } from '@angular/core';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { Subscription } from 'rxjs';
import {
  IDataTable,
  IDtColumnFields,
  IDtHeaderElements
} from 'src/app/modules/data-table/model/datatable';
import { DtActionComponent } from 'src/app/modules/data-table/components/dt-action/dt-action.component';
import { DtSearchBoxComponent } from 'src/app/modules/data-table/components/dt-search-box/dt-search-box.component';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { ViewAuditTrailModalComponent } from 'src/app/shared/modal/common-modal/view-audit-trail-modal/view-audit-trail-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { DataRangeV35Component } from 'src/app/shared/components/date-range-v35/data-range-v35.component';
import { V3DataTableSelectBoxComponent } from 'src/app/shared/v3/dt-cellrenderers/v3-data-table-select-box/v3-data-table-select-box.component';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { IDtFloatingFilterProp } from '../../../../data-table/model/datatable';
import { ISelectedEvent } from '../../../model/integration';
import { PayrollTransactionsAdpData } from './payroll-transactions-adp-data';
import { V3DataTableComponent } from '../../../../v3-data-table/components/v3-data-table/v3-data-table.component';
import { DTTableId } from 'src/app/modules/data-table/data/table-id';

@Component({
  selector: 'app-payroll-transactions-adp',
  templateUrl: './payroll-transactions-adp.component.html',
  styleUrls: ['./payroll-transactions-adp.component.scss'],
  standalone: true,
  imports: [V3DataTableComponent]
})
export class PayrollTransactionsAdpComponent implements OnInit, IDataTable {
  /**
   * Array to hold subscriptions for cleanup on component destruction.
   */
  subscriptions: Subscription[] = [];

  /**
   * Company ID for payroll transactions.
   */
  companyId = '';

  /**
   * Header elements configuration for the data table.
   */
  public headerElements: IDtHeaderElements;

  /**
   * Table ID for the data table.
   */
  public tableID = DTTableId.adpPayrollTransaction;

  /**
   * Column definitions for the data table.
   */
  public columnDefs: (ColDef | ColGroupDef)[] | null;

  /**
   * Column fields configuration for the data table.
   */
  public columnFields: IDtColumnFields[];

  /**
   * Framework components for custom cell rendering.
   */
  frameworkComponents: { [p: string]: { new (): any } } | any;

  /**
   * Properties for the action component.
   */
  actionComponentProp: { eyeButton: boolean };

  /**
   * Data for the data table.
   */
  tableData: PayrollTransactionsAdpData;

  /**
   * Configuration for the floating filter component.
   */
  floatingFilterComponent: IDtFloatingFilterProp;

  private dataTableService = inject(DataTableService);
  private dialog = inject(MatDialog);
  private v3DataTableService = inject(V3DataTableService);

  tableId: number;
  selectedPanelButton?: string | number | undefined;
  exportConfig?:
    | { heading: string; ignoreColumns?: string[] | undefined }
    | undefined;

  /**
   * Lifecycle hook: Called when the component is initialized.
   * Initiates component parameters and configuration.
   */
  ngOnInit(): void {
    this.v3DataTableService.resetV3DataTablePayload();
    this.initiateParams();
    this.refreshDataTable();
  }

  refreshDataTable(): void {
    this.v3DataTableService.refreshV3DataTable();
    this.v3DataTableService.v3RowSelectionData = [];
    this.v3DataTableService.gridApi?.deselectAll();
  }

  /**
   * Initializes parameters for the component.
   */
  initiateParams() {
    this.tableData = new PayrollTransactionsAdpData();
    this.columnDefs = this.tableData.getColDef();
    this.headerElements = this.tableData.headerElements;
    this.columnFields = this.tableData.getColumnFields();
    this.actionComponentProp = {
      eyeButton: true
    };

    this.frameworkComponents = {
      SearchBoxComponent: DtSearchBoxComponent,
      actionComponent: DtActionComponent,
      selectBoxComponent: V3DataTableSelectBoxComponent,
      selectDateComponent: DataRangeV35Component
    };
    this.floatingFilterComponent = this.tableData.floatingFilterCompProp();
    this.dataTableService.setDataFromParent(
      this.columnFields,
      this.floatingFilterComponent,
      undefined,
      this.actionComponentProp,
      this.tableID
    );
  }

  /**
   * Handler for cell action view.
   * Opens a dialog to view audit trail details.
   * @param event - The selected event.
   */
  onCellActionView(event: ISelectedEvent): void {
    if (event?.selectedRow) {
      this.dialog.open(ViewAuditTrailModalComponent, {
        maxWidth: '800px',
        width: '93%',
        data: {
          heading: 'ADP Transactions',
          slug: 'integrations/adp/events',
          id: event.selectedRow.id,
          hideColumns: ['userName']
        }
      });
    }
  }
}
