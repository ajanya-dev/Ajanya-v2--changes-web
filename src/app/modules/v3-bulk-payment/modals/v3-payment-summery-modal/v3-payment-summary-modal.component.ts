import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { V3DataTableService } from 'src/app/modules/v3-data-table/services/v3-data-table.service';
import { V3BulkPaymentService } from '../../services/v3-bulk-payment.service';
import { IPaymentSummaryData } from 'src/app/modules/v3-bulk-payment/model/v3-bulk-payment';
import { MatDialogRef, MatDialogActions } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TruncatePipe } from '../../../../pipes/truncate.pipe';
import { MatTooltip } from '@angular/material/tooltip';
import { NgFor, NgIf, NgClass, NgStyle } from '@angular/common';
import {
  faArrowsRotate,
  faCircleCheck,
  faCircleXmark,
  faFileCheck
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

/**
 * @description Component for payment summary modal in bulk payment.
 */
@Component({
  selector: 'app-v3-payment-summary-modal',
  templateUrl: './v3-payment-summary-modal.component.html',
  styleUrls: ['./v3-payment-summary-modal.component.scss'],
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    MatTooltip,
    NgClass,
    NgStyle,
    MatDialogActions,
    TruncatePipe,
    FontAwesomeModule
  ]
})
export class V3PaymentSummaryModalComponent implements OnInit, OnDestroy {
  public v3DataTableService = inject(V3DataTableService);
  public _V3BulkPaymentService = inject(V3BulkPaymentService);
  private _router = inject(Router);
  matDialog = inject(MatDialogRef);

  faCircleCheck = faCircleCheck;
  faArrowsRotate = faArrowsRotate;
  faCircleXmark = faCircleXmark;
  faFileCheck = faFileCheck;

  subscriptions: Subscription[] = [];
  bulkData: (IPaymentSummaryData | IPaymentSummaryData[])[];

  ngOnInit(): void {
    this.getBulkPaymentData();
  }

  /**
   * @description get the all selected payment details from bulk payment component.
   */
  getBulkPaymentData(): void {
    this.subscriptions.push(
      this._V3BulkPaymentService.getBulkPaymentData().subscribe((res) => {
        this.bulkData = res;
      })
    );
  }

  /**
   * @description get short name of payee
   * @param payee - selected payment payee name
   * @returns if payee name contain two word then return first letter of each word otherwise return fisrt two letter.
   */
  returnPayeeInitials(payee: string) {
    const trimmedPayeeName = payee?.trim();
    const spaceClearedPayeeName = trimmedPayeeName.replace(/ +/g, ' ');

    const splitUpPayeeName = spaceClearedPayeeName?.split(' ');
    if (splitUpPayeeName?.length <= 1) {
      return payee[0] + payee[1];
    } else {
      return splitUpPayeeName[0][0] + splitUpPayeeName[1][0];
    }
  }

  /**
   * @description
   * `this._V3BulkPaymentService.setBulkPaymentCount(0);` here its used to hide the progress bar from header
   */
  close(): void {
    this.matDialog.close();
    this._V3BulkPaymentService.setBulkPaymentCount(0);
  }

  /**
   * @description
   * `this._V3BulkPaymentService.setBulkPaymentCount(0);` here its used to hide the progress bar from header
   */
  gotoPage(): void {
    this._router.navigate(['/manage/payments-table/index'], {
      queryParams: { tab: 'all' }
    });
    this._V3BulkPaymentService.setBulkPaymentCount(0);
    this.matDialog.close();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
