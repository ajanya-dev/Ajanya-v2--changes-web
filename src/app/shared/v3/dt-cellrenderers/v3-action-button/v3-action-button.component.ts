import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject
} from '@angular/core';
import { Router } from '@angular/router';
import { ICellRendererParams } from '@ag-grid-community/core';
import { ICommonTransactionTableData } from 'src/app/models/v3-common';
import { V3PaymentsTableService } from 'src/app/modules/v3-payments-table/shared/components/v3-payments-table/v3-payments-table.service';
import { CommonModule } from '@angular/common';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CommonButtonV35Component } from '../../buttons/common-button-v35/common-button-v35.component';

@Component({
  standalone: true,
  imports: [CommonModule, CommonButtonV35Component],
  selector: 'app-v3-action-button',
  templateUrl: './v3-action-button.component.html',
  styleUrls: ['./v3-action-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class V3ActionButtonComponent {
  /* Injectors */
  private _router = inject(Router);
  private _v3PaymentsTableService = inject(V3PaymentsTableService);
  private _changeDetectorRef = inject(ChangeDetectorRef);
  private _alertService = inject(AlertService);

  /* Variables */
  commonTransactionTableRowData: ICommonTransactionTableData;
  isButtonClickable = false;
  isCheckIconShown = false;
  isTimerIconShown = false;
  isCrossIconShown = false;
  isFieldInvalid = false;
  isWarningIconShown = false;
  actionText = '';
  isMapBank = false;
  /* Functions */

  /**
   * This function is called on initialisation of the floating component.
   * @param params This contains data like ```rowNode``` as well as the row data
   * we are getting from the backend.
   */
  agInit(params: ICellRendererParams<ICommonTransactionTableData>) {
    if (params.data) {
      this.commonTransactionTableRowData = params.data;
    }
    if (
      params.data?.third_party_name !== null &&
      params.data?.source?.name == ''
    ) {
      this.isFieldInvalid = true;
      this.isMapBank = true;
    }
    this.checkIfFieldsAreUpdated();
    this.getActionText();
  }

  /**
   * @description We show that fields are not validated if any one item is missing.
   */
  checkIfFieldsAreUpdated() {
    this._v3PaymentsTableService.triggerPaymentsTableValidation$.subscribe({
      next: (res) => {
        if (res) {
          this.isFieldInvalid = this.checkValidation();
          this._changeDetectorRef.markForCheck();
        }
      }
    });
  }

  /**
   * @returns Dynamically returns the text needed based on status type
   */
  getActionText() {
    this.isButtonClickable = false;
    this.isCheckIconShown = false;
    this.isCrossIconShown = false;
    this.isTimerIconShown = false;
    this.isWarningIconShown = false;
    this.actionText = '';

    switch (this.commonTransactionTableRowData.status) {
      case 'COMPLETED':
        this.isCheckIconShown = true;
        this.actionText = 'Paid';
        break;
      case 'CANCELED':
      case 'FAILED':
      case 'REJECTED':
        this.isCrossIconShown = true;
        break;
      case 'PROCESSING':
        this.isTimerIconShown = true;
        break;
      case 'PENDING':
      case 'APPROVED':
        this.isButtonClickable = true;
        this.isWarningIconShown = true;
        this.actionText = 'Pay';
        break;
      case 'APPROVAL_REQUIRED':
        break;
      default:
        this.isButtonClickable = false;
    }

    this._changeDetectorRef.markForCheck();
  }

  /**
   * @returns Invalid if any field is empty or null
   */
  checkValidation() {
    const sourceType = this.commonTransactionTableRowData.source.source;
    const sourceId = this.commonTransactionTableRowData.source_id;
    const transferType = this.commonTransactionTableRowData.transfer_type_code;

    if (!sourceType || !sourceId || !transferType) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @description Gets triggered if we click on the pay button and routes to the edit payment
   * component if all the fields are valid.
   */
  onPayButtonClick() {
    this.isFieldInvalid = this.checkValidation();

    if (!this.isFieldInvalid) {
      this._router.navigate(
        [
          '/manage/payments/main/edit/' +
            this.commonTransactionTableRowData.uu_id
        ],
        { state: { backUrl: this._router.url } }
      );
    } else {
      this._alertService.warningAlert({
        content: 'Please select a source for payment'
      });
    }
  }
}
