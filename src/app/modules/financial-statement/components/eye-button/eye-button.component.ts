import { Component, inject, OnDestroy, signal } from '@angular/core';
import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { Router } from '@angular/router';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { ICellRendererParams } from '@ag-grid-community/core';
import { MatTooltip } from '@angular/material/tooltip';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowDownToLine,
  faEye,
  faSpinnerScale
} from '@fortawesome/pro-solid-svg-icons';
import { finalize, Subject, takeUntil } from 'rxjs';
import { DocumentMailService } from 'src/app/modules/business-tools/document-mail/services/document-mail.service';
import { CheckMailStatementModalComponent } from '../../modals/check-mail-statement-modal/check-mail-statement-modal.component';
import { IFinancialStatementRowData } from '../../model/financialstatement';

@Component({
  selector: 'app-eye-button',
  templateUrl: './eye-button.component.html',
  styleUrls: ['./eye-button.component.scss'],
  standalone: true,
  imports: [FaIconComponent, MatTooltip]
})
export class EyeButtonComponent implements ICellRendererAngularComp, OnDestroy {
  private router = inject(Router);
  private alertService = inject(AlertService);
  private dialog = inject(MatDialog);
  private documentMailService = inject(DocumentMailService);

  showButton = false;
  params: ICellRendererParams<IFinancialStatementRowData>;
  faEye = faEye;
  faDownlaod = faArrowDownToLine;
  faSpinner = faSpinnerScale;
  destroy$ = new Subject();
  isDownload = signal(false);

  refresh(): boolean {
    return false;
  }

  agInit(params: ICellRendererParams<IFinancialStatementRowData>): void {
    this.params = params;
    if (this.isEnableButton(this.params.data as IFinancialStatementRowData)) {
      this.showButton = true;
    }
  }

  /**
   * @description Determines whether the button should be enabled based on the selected item
   * @param {IFinancialStatementRowData} selectedItem The selected item.
   * @returns {boolean} True if the button should be enabled, false otherwise.
   */
  isEnableButton(selectedItem: IFinancialStatementRowData): boolean {
    if (selectedItem === null) {
      return false;
    }

    if (
      selectedItem.operation_type === 25 &&
      selectedItem.has_json_data &&
      selectedItem.json_data?.invoice_id
    ) {
      return true;
    }

    if (selectedItem.action !== null) {
      if (selectedItem.operation_type === 2) {
        return true;
      }
      if (selectedItem.operation_type === 3) {
        return true;
      }
      return false;
    }
    if (selectedItem.operation_type === 3) {
      return true;
    }
    if (selectedItem.operation_type === 2) {
      if (selectedItem.has_json_data) {
        return true;
      }
      return false;
    }
    return false;
  }

  /**
   * @description Performs an action based on the selected item's operation type and action.
   * @param {IFinancialStatementRowData} selectedItem The selected item.
   */
  cellRendererActionView(selectedItem: IFinancialStatementRowData) {
    if (selectedItem) {
      if (selectedItem.action !== null) {
        if (selectedItem.operation_type === 2) {
          if (selectedItem.action.indexOf('manage/cheque/view') !== -1) {
            this.router.navigate([
              '/manage/cheque/view/',
              selectedItem.reference_id
            ]);
          } else {
            window.open(selectedItem.action, '__self');
          }
        } else if (selectedItem.operation_type === 3) {
          const tArr = selectedItem.action.split('/');
          this.router.navigate([
            '/manage/shop/order_details/',
            tArr[tArr.length - 1]
          ]);
        } else {
          this.openInfoAlert('Sorry, no details to display');
        }
      } else if (selectedItem.operation_type === 3) {
        this.openInfoAlert('Shopping cart order details');
      } else if (
        selectedItem.operation_type === 2 ||
        selectedItem.operation_type === 25
      ) {
        if (selectedItem.has_json_data) {
          let type: 'invoice' | 'check' | 'group' = 'invoice';
          if (selectedItem.operation_type === 2) {
            type = 'check';
          }
          if (selectedItem.json_data?.data) {
            type = 'group';
          }
          this.openCheckMailStatementModal(selectedItem, type);
        } else {
          this.openInfoAlert('Sorry, no details to display..');
        }
      } else {
        this.openInfoAlert('Sorry, no details to display...');
      }
    }
  }

  /**
   * @description Event handler function triggered when the button is clicked.
   */
  btnClickedHandler() {
    this.cellRendererActionView(this.params.data as IFinancialStatementRowData);
  }

  /**
   * @description Opens a modal dialog to display financial statement details.
   * @param {IFinancialStatementRowData} selectedItem The selected item for which details are to be displayed.
   * @param {'check' | 'invoice'} mode The mode indicating whether to display check or invoice details.
   */
  openCheckMailStatementModal(
    selectedItem: IFinancialStatementRowData,
    mode: 'check' | 'invoice' | 'group'
  ): void {
    this.dialog.open(CheckMailStatementModalComponent, {
      maxWidth: mode === 'group' ? '760px' : '550px',
      width: '100%',
      data: {
        slug: 'financialstatement',
        checkData: selectedItem,
        type: 'financial-statement',
        mode
      }
    });
  }

  /**
   * @description Opens an informational alert dialog with the specified content.
   * @param {string} content The content to be displayed in the alert dialog.
   */
  openInfoAlert(content: string) {
    const data = {
      content
    };
    return this.alertService.infoAlert(data);
  }

  download(documentId: string) {
    this.isDownload.set(true);
    this.documentMailService
      .downloadDocument(documentId)
      .pipe(
        finalize(() => {
          this.isDownload.set(false);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((val) => {
        if (val.success) {
          window.open(val.data.file_url, '_blank');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
