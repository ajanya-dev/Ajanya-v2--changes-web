import { Component, inject, computed, effect, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize } from 'rxjs';
import { BillService } from 'src/app/shared/service/Bill/bill.service';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';
import { CommonLayoutToggleV4Service } from 'src/app/shared/service/common/shared/common-layout/common-layout-toggle-v4.service';
import { V4AddBillComponent } from '../../modals/v4-add-bill/v4-add-bill.component';
import { InvoiceBillStateService } from '../../../services/invoice-bill-state.service';

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'];

@Component({
  selector: 'app-v4-bill-inbox-details',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    V4AddBillComponent,
    DatePipe,
    CurrencyPipe,
    CommonButtonV4Component,
    MatTooltipModule
  ],
  templateUrl: './v4-bill-inbox-details.component.html',
  styleUrls: ['./v4-bill-inbox-details.component.scss']
})
export class V4BillInboxDetailsComponent {
  private invoiceBillStateService = inject(InvoiceBillStateService);
  private layoutToggleService = inject(CommonLayoutToggleV4Service);
  private sanitizer = inject(DomSanitizer);
  private billService = inject(BillService);
  private alertService = inject(V4AlertService);

  // Service signals
  readonly currentInvoiceData = this.invoiceBillStateService.invoiceData;
  readonly isItemsLoading = this.invoiceBillStateService.isAddBillFormLoading;

  // Attachment selection
  selectedAttachmentIndex = signal(0);
  pdfLoaded = signal(false);
  isDeleting = signal(false);

  // Converting mode
  isConverting = signal(false);

  readonly convertingTitle = computed(() => {
    const data = this.currentInvoiceData();
    const vendorName = data?.vendor?.name || 'Unknown Vendor';
    const invoiceNumber = data?.invoiceNumber || '';
    return invoiceNumber
      ? `Converting: ${vendorName} \u00B7 ${invoiceNumber}`
      : `Converting: ${vendorName}`;
  });

  readonly selectedAttachment = computed(() => {
    const data = this.currentInvoiceData();
    const index = this.selectedAttachmentIndex();
    if (data?.attachments && data.attachments.length > index) {
      return data.attachments[index];
    }
    return null;
  });

  readonly isImageAttachment = computed(() => {
    const attachment = this.selectedAttachment();
    if (!attachment) return false;
    const filename = (attachment.filename || '').toLowerCase();
    const fileType = (attachment.fileType || '').toLowerCase();
    return IMAGE_EXTENSIONS.some(
      (ext) => filename.endsWith(`.${ext}`) || fileType.includes(ext)
    );
  });

  readonly selectedAttachmentSafeUrl = computed(() => {
    const attachment = this.selectedAttachment();
    if (!attachment) return null;
    const url = attachment.public_url || attachment.fileUrl;
    if (!url) return null;

    if (this.isImageAttachment()) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    // PDF: add viewer params
    const urlWithParams = url.includes('#')
      ? `${url}&toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=100&pagemode=none`
      : `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=100&pagemode=none`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(urlWithParams);
  });

  constructor() {
    effect(() => {
      const data = this.currentInvoiceData();
      this.selectedAttachmentIndex.set(0);
      this.pdfLoaded.set(false);
      if (!data) {
        this.isConverting.set(false);
        this.layoutToggleService.hideListPanel.set(false);
      }
    });
  }

  selectAttachment(index: number): void {
    this.selectedAttachmentIndex.set(index);
    this.pdfLoaded.set(false);
  }

  onPdfLoad(): void {
    this.pdfLoaded.set(true);
  }

  showForm(): void {
    const currentData = this.currentInvoiceData();
    if (currentData) {
      this.invoiceBillStateService.setInvoiceData(currentData);
      this.invoiceBillStateService.showForm();
      this.isConverting.set(true);
      this.layoutToggleService.hideListPanel.set(true);
    }
  }

  cancelConversion(): void {
    this.isConverting.set(false);
    this.layoutToggleService.hideListPanel.set(false);
    this.invoiceBillStateService.hideForm();
  }

  onBillSaved(): void {
    this.isConverting.set(false);
    this.layoutToggleService.hideListPanel.set(false);
    this.invoiceBillStateService.hideForm();
    this.invoiceBillStateService.setInvoiceData(null);
    this.invoiceBillStateService.triggerBillSaved();
  }

  deleteEmailBill(): void {
    const data = this.currentInvoiceData();
    if (!data?.id) return;

    const { id } = data;

    this.alertService
      .confirmAlert({
        content: `Are you sure you want to delete this email bill from ${data.vendor?.name || 'unknown sender'}?`
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.performDelete(id);
        }
      });
  }

  private performDelete(id: number): void {
    this.isDeleting.set(true);

    this.billService
      .deleteEmailBill(id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.invoiceBillStateService.setInvoiceData(null);
            this.invoiceBillStateService.triggerBillSaved();
            this.alertService.successAlert({
              content: 'Email bill deleted successfully',
              close: true,
              timeout: 2500
            });
          }
        }
      });
  }
}
