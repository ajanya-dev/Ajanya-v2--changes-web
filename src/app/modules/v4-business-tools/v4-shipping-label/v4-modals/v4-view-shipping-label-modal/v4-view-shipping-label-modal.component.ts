import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Clipboard } from '@angular/cdk/clipboard';
import { LucideAngularModule } from 'lucide-angular';
import { finalize, take } from 'rxjs';
import { IShippView } from 'src/app/modules/business-tools/shipping-label/model/shipping-label';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { ShippingLabelService } from 'src/app/shared/service/shipping-label/shipping-label.service';

interface IViewShippingLabelModalData {
  shippLabelId: string;
}

@Component({
  selector: 'app-v4-view-shipping-label-modal',
  standalone: true,
  imports: [
    DatePipe,
    LucideAngularModule,
    MatTooltipModule,
    CommonButtonV4Component
  ],
  templateUrl: './v4-view-shipping-label-modal.component.html'
})
export class V4ViewShippingLabelModalComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<V4ViewShippingLabelModalComponent>);
  private data = inject<IViewShippingLabelModalData>(MAT_DIALOG_DATA);
  private shippingLabelService = inject(ShippingLabelService);
  private alertService = inject(V4AlertService);
  private clipboard = inject(Clipboard);

  loading = signal<boolean>(false);
  isPrintLoading = signal<boolean>(false);
  isCopied = signal<boolean>(false);
  viewData = signal<IShippView | null>(null);

  /** Payee address, one part per line, skipping the empty ones. */
  addressLines = computed<string[]>(() => {
    const label = this.viewData();
    if (!label) return [];
    return [
      label.address1,
      label.address2,
      label.city,
      label.state,
      label.zip,
      label.country
    ].filter((line): line is string => !!line?.trim());
  });

  /** Eg:- ```USPS - First Class``` */
  carrierType = computed<string>(() => {
    const label = this.viewData();
    if (!label) return '';
    return [label.shipping_type, label.shipping_service]
      .filter(Boolean)
      .join(' - ');
  });

  ngOnInit(): void {
    if (this.data?.shippLabelId) {
      this.getViewData(this.data.shippLabelId);
    }
  }

  /**
   * @description Get shipping label data.
   */
  getViewData(labelId: string): void {
    this.loading.set(true);
    this.shippingLabelService
      .shippingLabelView(labelId)
      .pipe(
        take(1),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res?.success) {
            this.viewData.set(res.data);
          }
        },
        error: () => {
          this.alertService.failedAlert({
            title: 'Error',
            content: 'Failed to load the shipping label details.'
          });
        }
      });
  }

  /**
   * @description Print this label — same endpoint used by the row action menu.
   */
  printShippingLabel(): void {
    const labelId = this.data?.shippLabelId;
    if (!labelId) return;

    this.isPrintLoading.set(true);
    this.shippingLabelService
      .printMultiShippingLabel([labelId])
      .pipe(
        take(1),
        finalize(() => this.isPrintLoading.set(false))
      )
      .subscribe({
        next: (res) => {
          if (res?.success && res?.data?.url) {
            window.open(res.data.url);
          } else {
            this.openPrintFailedAlert();
          }
        },
        error: () => {
          this.openPrintFailedAlert();
        }
      });
  }

  /**
   * @description Copy the tracking number to the clipboard.
   */
  copyTrackingNumber(): void {
    const trackingNumber = this.viewData()?.tracking_number;
    if (!trackingNumber) return;

    this.clipboard.copy(trackingNumber);
    this.isCopied.set(true);
    this.alertService.successAlert({
      content: 'Tracking number copied to clipboard',
      close: true,
      timeout: 2500
    });
    setTimeout(() => this.isCopied.set(false), 2000);
  }

  closeModal(): void {
    this.dialogRef.close(false);
  }

  private openPrintFailedAlert(): void {
    this.alertService.failedAlert({
      title: 'Error',
      content: 'Failed to print the shipping label.'
    });
  }
}
