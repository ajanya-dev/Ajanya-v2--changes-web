import { Component, inject, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { V4AlertService } from 'src/app/shared/service/alert/v4-alert.service';

export interface ShareLinkModalData {
  linkUrl: string;
  linkName: string;
}

@Component({
  selector: 'app-share-link-modal',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './share-link-modal.component.html',
  styleUrls: ['./share-link-modal.component.scss']
})
export class ShareLinkModalComponent {
  private dialogRef = inject(MatDialogRef<ShareLinkModalComponent>);
  private data: ShareLinkModalData = inject(MAT_DIALOG_DATA);
  private v4AlertService = inject(V4AlertService);

  copied = signal(false);
  isDownloading = signal(false);

  get linkUrl(): string {
    return this.data.linkUrl;
  }

  get linkName(): string {
    return this.data.linkName;
  }

  get qrUrl(): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=20319D&data=${encodeURIComponent(this.linkUrl)}`;
  }

  closeModal() {
    this.dialogRef.close();
  }

  async copyLink() {
    try {
      await navigator.clipboard.writeText(this.linkUrl);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch { /* noop */ }
  }

  shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(this.linkUrl)}`, '_blank');
  }

  shareFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.linkUrl)}`, '_blank');
  }

  shareTwitter() {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(this.linkUrl)}`, '_blank');
  }

  shareEmail() {
    window.open(`mailto:?subject=${encodeURIComponent('Payment Link: ' + this.linkName)}&body=${encodeURIComponent(this.linkUrl)}`, '_blank');
  }

  async downloadQr() {
    this.isDownloading.set(true);
    const downloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&color=20319D&data=${encodeURIComponent(this.linkUrl)}`;

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Failed to fetch QR code');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const sanitizedName = this.linkName
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase() || 'code';

      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-link-qr-${sanitizedName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      this.v4AlertService.successAlert({ content: 'QR code downloaded.' });
    } catch {
      window.open(downloadUrl, '_blank');
    } finally {
      this.isDownloading.set(false);
    }
  }
}
