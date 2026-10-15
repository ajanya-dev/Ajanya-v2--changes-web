import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-qr-code-scanner-modal',
  templateUrl: './qr-code-scanner-modal.component.html',
  styleUrls: ['./qr-code-scanner-modal.component.scss'],
  standalone: true
})
export class QrCodeScannerModalComponent implements OnInit {
  private matDialogRef = inject(MatDialogRef);
  public dialogData: { link: string, address?: string } = inject(MAT_DIALOG_DATA);

  qrCodeLink = '';

  ngOnInit(): void {
    this.generateQRcode(this.dialogData.link);
  }

  generateQRcode(url: string) {
    const encodedPayload = encodeURIComponent(url);
    this.qrCodeLink = `https://in43kxjpahwsnu3hwajejfofki0jhhrz.lambda-url.us-east-1.on.aws/generate-qr?cht=qr&chl=${encodedPayload}&chs=300x300`;
  }

  closeModal() {
    this.matDialogRef.close();
  }
}
