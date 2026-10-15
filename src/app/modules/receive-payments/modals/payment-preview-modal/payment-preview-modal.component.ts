import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { NgIf } from '@angular/common';

/**
 * @description  Component for displaying  a payment preview
 */
@Component({
  selector: 'app-payment-preview-modal',
  templateUrl: './payment-preview-modal.component.html',
  styleUrls: ['./payment-preview-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose, NgIf]
})
export class PaymentPreviewModalComponent implements OnInit {
  smsDetails: any;
  smsSection = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {
    this.previewDetails();
  }
  /**
   * @description Preview the details of the payment based on the data provided
   */
  previewDetails() {
    if (this.data.data.request_payment_type == 'sms') {
      this.smsDetails = this.data.data.preview;
      this.smsSection = true;
    } else {
      const iframe = document.createElement('iframe');
      iframe.srcdoc = this.data.data.preview;
      const details = document.getElementById('preview') as HTMLDivElement;
      details.appendChild(iframe);
      iframe.style.width = '605px';
      iframe.style.height = '710px';
      if (window.matchMedia('(max-width:767.98px)').matches) {
        iframe.style.width = '300px';
        iframe.style.height = '500px';
      }
    }
  }
}
