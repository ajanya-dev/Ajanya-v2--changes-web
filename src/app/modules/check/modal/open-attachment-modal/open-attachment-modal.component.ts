import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-open-attachment-modal',
  templateUrl: './open-attachment-modal.component.html',
  styleUrls: ['./open-attachment-modal.component.scss'],
  standalone: true,
  imports: [MatDialogClose]
})
export class OpenAttachmentModalComponent implements OnInit {
  url: any;
  constructor(
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    const {link} = this.data;
    if (this.isValidUrl(link)) {
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl(link);
    }
  }

  /**
   * Validates whether a given string is a valid HTTP or HTTPS URL.Used to prevent security issue.
   * @param {string} url - The string to be validated as a URL.
   * @returns {boolean} - Returns `true` if the URL is valid and uses either the 'http' or 'https' protocol. Otherwise, returns `false`.
   */
  isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (_) {
      return false; // Invalid URL
    }
  }
}
