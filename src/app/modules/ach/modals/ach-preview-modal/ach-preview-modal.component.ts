import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose
} from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * @description Modal component for previewing ach authorization data.
 */
@Component({
  selector: 'app-ach-preview-modal',
  templateUrl: './ach-preview-modal.component.html',
  styleUrls: ['./ach-preview-modal.component.scss'],
  standalone: true,
  imports: [MatDialogActions, MatDialogClose]
})
export class AchPreviewModalComponent implements OnInit {
  urlSafe: SafeResourceUrl;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: string,
    public sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    if (this.isValidUrl(this.data)) {
      this.urlSafe = this.sanitizer.bypassSecurityTrustResourceUrl(this.data);
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
