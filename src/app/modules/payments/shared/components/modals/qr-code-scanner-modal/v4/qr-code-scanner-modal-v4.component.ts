import { Component, OnInit, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { LucideAngularModule, X } from 'lucide-angular';
import { CommonButtonV4Component } from 'src/app/shared/V4/buttons/common-button-v4/common-button-v4.component';

@Component({
  selector: 'app-qr-code-scanner-modal-v4',
  standalone: true,
  imports: [LucideAngularModule, CommonButtonV4Component, MatDialogClose],
  templateUrl: './qr-code-scanner-modal-v4.component.html',
  styleUrl: './qr-code-scanner-modal-v4.component.scss'
})
export class QrCodeScannerModalV4Component implements OnInit {
  private matDialogRef = inject(MatDialogRef<QrCodeScannerModalV4Component>);
  public dialogData: { link: string; address?: string } = inject(MAT_DIALOG_DATA);

  readonly XIcon = X;
  qrCodeLink = '';

  ngOnInit(): void {
    this.generateQRcode(this.dialogData.link);
  }

  generateQRcode(url: string) {
    this.qrCodeLink = `https://in43kxjpahwsnu3hwajejfofki0jhhrz.lambda-url.us-east-1.on.aws/generate-qr?cht=qr&chl=${url}&chs=300x300`;
  }

  closeModal() {
    this.matDialogRef.close();
  }
}
