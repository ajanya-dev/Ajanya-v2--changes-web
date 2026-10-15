import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { Component, inject } from '@angular/core';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { TPaymentSource } from 'src/app/modules/payments/model/payments';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { Subscription } from 'rxjs';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { V3PaymentsTableData } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table-data';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  selector: 'app-v3-payment-source-type',
  templateUrl: './v3-payment-source-type.component.html',
  styleUrls: ['./v3-payment-source-type.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V3PaymentSourceTypeComponent implements OnDestroy {
  private _alertService = inject(AlertService);
  private _v3PaymentsTableService = inject(V3PaymentsTableService);
  private _changeDetectorRef = inject(ChangeDetectorRef);

  isFieldReadOnly = true;
  commonTransactionTableRowData: ICommonTransactionTableData;
  subscriptions: Subscription[] = [];

  paymentSourceTypes: {
    label: string;
    sourceType: string;
    sourceId: string;
  }[] = [];

  private _currentPaymentSourceType: string | undefined = '';

  public get currentPaymentSourceType(): string | undefined {
    return this._currentPaymentSourceType;
  }

  public set currentPaymentSourceType(value: string | undefined) {
    this._currentPaymentSourceType = value;
    this._changeDetectorRef.markForCheck();
  }
  temporaryPaymentSourceType: string | undefined = '';

  /**
   * Access ng-select
   */
  @ViewChild(NgSelectComponent) ngSelectComponent: NgSelectComponent;

  constructor() {
    this.setPaymentSourceTypes();
  }

  setPaymentSourceTypes() {
    this.paymentSourceTypes = V3PaymentsTableData.getPayFromItems().map(
      (el) => {
        return {
          label: el.shortLabel,
          sourceType: el.sourceType!,
          sourceId: el.id
        };
      }
    );
  }

  /**
   * This function is called on initialisation of the floating component.
   * @param params This contains data like ```rowNode``` as well as the row data
   * we are getting from the backend.
   */
  agInit(params: ICellRendererParams<ICommonTransactionTableData>): void {
    if (params.data) {
      this.commonTransactionTableRowData = params.data;
    }
    const item = this.paymentSourceTypes.find(
      (el) => params?.data?.source?.source === el.sourceType
    );
    if (item) {
      this.currentPaymentSourceType = item.sourceId;
    } else {
      this.currentPaymentSourceType = 'bankaccount';
    }

    if (params.data?.status === 'PENDING') {
      this.isFieldReadOnly = false;
    }

    if (
      params.data?.third_party_name !== '' &&
      !params.data?.source.info?.bankName
    ) {
      this.isFieldReadOnly = true;
    }

    this.temporaryPaymentSourceType = this.currentPaymentSourceType;
    // window.addEventListener("scroll", this.closeDropdown, true);
  }

  /**
   * @description Gets fired when the user selects an option.
   */
  valueChanged() {
    let alertServiceData = {};

    if (
      (this.commonTransactionTableRowData.transfer_type_code === 'check' ||
        this.commonTransactionTableRowData.transfer_type_code ===
          'checkMail') &&
      (this.currentPaymentSourceType === 'WALLET' ||
        this.currentPaymentSourceType === 'wallet' ||
        this.currentPaymentSourceType === 'CARD' ||
        this.currentPaymentSourceType === 'card')
    ) {
      alertServiceData = {
        content:
          'This source type is not compatibile with this payment type, are you sure you want to continue?',
        doneMsg: 'Yes',
        cancelMsg: 'Cancel',
        isOk: true,
        isCancel: true
      };
    } else {
      alertServiceData = {
        content: 'Are you sure you want to change this field?',
        doneMsg: 'Yes',
        cancelMsg: 'Cancel',
        isOk: true,
        isCancel: true
      };
    }
    const action = this._alertService.infoAlert(alertServiceData);

    action.afterClosed().subscribe((res) => {
      if (!res) {
        this.currentPaymentSourceType = this.temporaryPaymentSourceType;
        return;
      } else {
        this.commonTransactionTableRowData.source.source = this
          .currentPaymentSourceType as TPaymentSource;
        this.temporaryPaymentSourceType = this.currentPaymentSourceType;
        this._v3PaymentsTableService.dynamicSourceNameClearing = {
          uuid: this.commonTransactionTableRowData.uu_id
        };
      }
    });
  }

  /**
   * @description Close ng select.
   */
  closeDropdown = () => {
    if (this.ngSelectComponent.isOpen) {
      this.ngSelectComponent.close();
    }
  };

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    window.removeEventListener('scroll', this.closeDropdown, true);
  }
}
