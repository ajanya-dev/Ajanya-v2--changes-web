import { Component } from '@angular/core';
import { MatDialogClose } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-e-sign-modal',
  templateUrl: './e-sign-modal.component.html',
  styleUrls: ['./e-sign-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose]
})
export class ESignModalComponent {

  esignUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {
    const pdfPath = 'assets/esign.pdf'; // ✅ Corrected path
    this.esignUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfPath);
  }

}
