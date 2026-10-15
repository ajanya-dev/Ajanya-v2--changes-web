import { ICellRendererParams } from '@ag-grid-community/core';
import { Component, InputSignal, OnInit, inject } from '@angular/core';
import { AgRendererComponent } from '@ag-grid-community/angular';
import { DataTableService } from 'src/app/shared/service/data-table/data-table.service';
import { LocalStorageService } from 'src/app/shared/service/storage/local-storage.service';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { Router } from '@angular/router';
import { PaymentsService } from 'src/app/shared/service/payments/payments.service';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { faCreditCard } from '@fortawesome/pro-solid-svg-icons';
import { faEye } from '@fortawesome/pro-solid-svg-icons';
import { environment } from 'src/environments/environment';
import { NgClass, NgStyle } from '@angular/common';
import { IDtActionCompProp, IDtColumnFields } from '../../model/datatable';
import { LucideAngularModule } from 'lucide-angular';

interface IUpdatedCellRendererParams extends ICellRendererParams {
  tableName?: string;
  tableId?: string;
  isHideAction?:InputSignal<boolean>
}

interface IGetData {
  data: IDtColumnFields[];
  values: IGetValue[] | undefined;
}

interface IGetValue {
  name: string;
  id: string;
  icon: string;
  color?: string;
  toolTip?: string | undefined;
  svg?: string | undefined;
  divider?: boolean;
}

@Component({
  selector: 'app-dt-action',
  templateUrl: './dt-action.component.html',
  styleUrls: ['./dt-action.component.scss'],
  standalone: true,
  imports: [FaIconComponent, MatTooltip, MatMenuTrigger, MatMenu, MatMenuItem, NgStyle, NgClass, LucideAngularModule]
})
export class DtActionComponent implements AgRendererComponent, OnInit {
  private dataTableData = inject(DataTableService);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  private paymentService = inject(PaymentsService);
  private alertService = inject(AlertService);

  static actionButton: boolean;
  refresh(): boolean {
    return true;
  }

  public cellValue!: string;
  getCurrentColumn: { [x: string]: unknown };
  params: any;
  getData: IGetData;
  getValues: IGetValue[] | undefined;
  isDisableData: { isDisable: boolean; selectedIds: string[] };
  actionButtonMode: IDtActionCompProp | undefined;
  companyType = this.localStorageService.getItem('activeCompanyType');
  tableName: string;
  tableId: number | undefined;
  faCreditCard = faCreditCard;
  faEye = faEye;
  env = environment;
  tableVersion: 'v3' | 'v4' = 'v3';
  showActionTooltip = false;

  /**
   * gets called once before the renderer is used
   * @param params - cell renderer params
   */
  agInit(params: IUpdatedCellRendererParams) {
    this.params = params;
    this.tableId = this.params?.colDef?.tableId;
    this.tableName =
      this.params?.colDef?.floatingFilterComponentParams?.tableName;

    this.cellValue = this.getValueToDisplay(params);
    this.getCurrentColumn = { ...this.params.data, index: this.params.node.id };

    this.tableVersion = this.params?.colDef?.cellRendererParams?.tableVersion ?? 'v3';

    // Opt-in for tables that keep v3 rendering but still want the action tooltip.
    this.showActionTooltip =
      this.tableVersion === 'v4' ||
      (this.params?.colDef?.cellRendererParams?.showActionTooltip ?? false);

    this.getData = this.dataTableData.getCellrendrerData(this.tableId);
    this.getValues = this.getData.values;
  }

  ngOnInit(): void {
    this.dataTableData.isDisable.subscribe((res) => {
      this.isDisableData = res;
    });

    const actionProps = this.dataTableData.getActionMode();

    if (this.tableId === actionProps?.tableId || this.tableId) {
      this.actionButtonMode = this.dataTableData.getActionMode(this.tableId);
    } else if (!this.tableId) {
      this.actionButtonMode = this.dataTableData.getActionMode();
    }
    this.setActionForInvoice();
  }

  /**
   * @description -Method for enable action for invoice table
   */
  setActionForInvoice() {
    if (this.tableName === 'invoice_table') {
      if (this.params.data.enableTriangle === 1) {
        this.actionButtonMode = {
          bankNotVerified: true
        };
      } else {
        this.actionButtonMode = {
          eyeButton: true,
          actionButton: true
        };
      }
    } else if (this.tableName === 'check_list_table') {
      this.actionButtonMode = { ...this.actionButtonMode, cardButton: true };
    } else if (this.tableName === 'single_mail_history_table') {
      this.actionButtonMode = { ...this.actionButtonMode, eyeButton: true, actionButton: false };
    }
  }

  /**
   * @description Handles the action button click event.
   * This function updates the data in the DataTable component based on the action.
   */
  actionButtonClick() {
    const id = '';
    this.dataTableData.setDataFromActionComp(
      this.getCurrentColumn,
      id,
      this.tableId
    );
  }

  /**
   * @description Handles the click event for action buttons with different types.
   * @param {string} type - The type of action button clicked.
   */
  actionMoreClick(type: string) {
    let id;
    switch (type) {
      case 's':
        id = 'id_setting_button';
        break;

      case 'd':
        id = 'id_danger_button';
        break;

      case 'e':
        id = 'id_edit_button';
        break;

      case 'dlt':
        id = 'id_delete_button';
        break;
      case 'bnv':
        id = 'id_bank_not_verified';
        this.dataTableData.setDataFromActionComp(this.getCurrentColumn, id);
        break;
      case 'audit':
        id = 'id_audit_trial';
        break;
      default:
        break;
    }

    this.dataTableData.setDataFromActionDangerComp(
      this.getCurrentColumn,
      id,
      this.tableId
    );
  }

  /**
   * @description  Handles the click event for the eye (view) button.
   */
  eyeButtonClick() {
    const id = '';
    this.dataTableData.setDataFromActionViewComp(this.getCurrentColumn, id);
  }

  /**
   * @description Method invoked on action menu button click.
   * @param id - Button id.
   * @param index - Index.
   * @param name - Button name.
   * @param event - Click event.
   * @param toolTip - Optional - Tooltip.
   */
  onButtonClick(
    id: string,
    index: number,
    name: string,
    event: Event,
    toolTip?: MatTooltip
  ) {
    if (toolTip?.message === 'Coming Soon') {
      event.stopPropagation();
      toolTip.show();
      return;
    }
    if (
      this.isDisableData.isDisable &&
      this.isDisableData.selectedIds[index] === id
    ) {
      return;
    }
    this.dataTableData.setDataFromActionComp(this.getCurrentColumn, id);
  }

  /**
   * @description - Used to disable some action if user using an invited company
   * @param text - Action name
   *
   */
  isInvited(text: string) {
    if (
      this.companyType === 'invcomp' &&
      (text === 'approve' || text === 'Reject')
    ) {
      return true;
    }
    return false;
  }

  /**
   * @description  Returns the value to be displayed in a cell renderer.
   * @param {ICellRendererParams} params - The parameters containing the value information.
   * @returns {any} The value to be displayed in the cell renderer
   */
  getValueToDisplay(params: ICellRendererParams) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  /**
   * @description Handle payment using credit card.
   * Navigate card ach payment method page.
   */
  cardButtonClick(): void {
    const eligibleCheckStatus = [0, 1, 11, 440, 441, 502, 507, 807] as const;
    if (!eligibleCheckStatus.includes(this.params.data?.cheque_status)) {
      this.alertService.failedAlert({
        content: 'This action cannot be performed for this transaction.'
      });
      return;
    }
    const selectedPayee = {
      encryptedId: this.params.data?.payee_id,
      name: this.params.data?.payee_name
    };
    const sendData = {
      amount: this.params.data?.cheque_amount,
      memo: this.params.data?.cheque_memo,
      invoiceNumber: this.params.data?.cheque_invoice_number,
      payee: selectedPayee
    };
    this.paymentService.initiatePaymentForm = sendData;
    this.router.navigate(['/manage/payments/main/pay/card/ach'], {
      state: { backUrl: this.router.url }
    });
  }
}
