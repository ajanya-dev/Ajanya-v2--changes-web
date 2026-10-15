import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogActions } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark, faCopy, faCircleCheck, faEnvelope, faDownload, faLink } from '@fortawesome/pro-solid-svg-icons';
import { faWhatsapp, faFacebook, faXTwitter } from '@fortawesome/free-brands-svg-icons';
import { Clipboard } from '@angular/cdk/clipboard';
import { AlertService } from 'src/app/shared/service/alert/alert.service';
import { CommonButtonV35Component } from 'src/app/shared/v3/buttons/common-button-v35/common-button-v35.component';

export interface SharePaymentLinkData {
  link: string;
  name: string;
  qrCodeUrl: string;
}

@Component({
  selector: 'app-share-payment-link-modal',
  standalone: true,
  imports: [
    FontAwesomeModule,
    MatDialogActions,
    CommonButtonV35Component
  ],
  templateUrl: './share-payment-link-modal.component.html',
  styleUrl: './share-payment-link-modal.component.scss'
})
export class SharePaymentLinkModalComponent {
  private dialogRef = inject(MatDialogRef<SharePaymentLinkModalComponent>);
  private clipboard = inject(Clipboard);
  private alertService = inject(AlertService);
  data: SharePaymentLinkData = inject(MAT_DIALOG_DATA);

  // Icons
  faXmark = faXmark;
  faCopy = faCopy;
  faCircleCheck = faCircleCheck;
  faEnvelope = faEnvelope;
  faWhatsapp = faWhatsapp;
  faFacebook = faFacebook;
  faXTwitter = faXTwitter;
  faDownload = faDownload;
  faLink = faLink;

  // State
  linkCopied = signal(false);
  isDownloading = signal(false);

  close(): void {
    this.dialogRef.close();
  }

  copyLink(): void {
    this.clipboard.copy(this.data.link);
    this.linkCopied.set(true);
    setTimeout(() => this.linkCopied.set(false), 2000);
  }

  shareViaWhatsApp(): void {
    const message = encodeURIComponent(`Make a payment using this link: ${this.data.link}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  shareViaFacebook(): void {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.data.link)}`, '_blank');
  }

  shareViaTwitter(): void {
    const text = encodeURIComponent(`Payment Link: ${this.data.name}`);
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(this.data.link)}&text=${text}`, '_blank');
  }

  shareViaEmail(): void {
    const subject = encodeURIComponent(`Payment Link: ${this.data.name}`);
    const body = encodeURIComponent(`Please use this link to make a payment:\n\n${this.data.link}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  downloadQrCode(): void {
    this.isDownloading.set(true);

    // Use QR Server API for download (higher resolution)
    const downloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(this.data.link)}`;

    fetch(downloadUrl)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to fetch QR code');
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-link-qr-${this.data.name || 'code'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        this.alertService.successAlert({
          content: 'QR code downloaded successfully',
          close: true
        });
      })
      .catch(() => {
        this.alertService.warningAlert({
          title: 'Error',
          content: 'Failed to download QR code. Please try again.',
          isCancel: false,
          doneMsg: 'OK'
        });
      })
      .finally(() => {
        this.isDownloading.set(false);
      });
  }
}
